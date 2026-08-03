// charset 宣言を持たない古い Web ページの文字コードを推定する。
//
// もともと同じ問題を解くために書いた Go のリバースプロキシからの移植で、
// 判定順とスコアの重みは意図的に揃えてある (総当たりのかな条件と、判定不能時に
// 何もしない点だけ拡張側で変えてある。README 参照)。
// TextDecoder は WHATWG のラベル表をそのまま実装しているので、Go 版が
// htmlindex に任せていた x-sjis / ms_kanji / windows-31j といった表記揺れの
// 吸収はブラウザ側が肩代わりしてくれる。
//
// 内容スクリプトからは classic script として読まれ、グローバルに
// wjpDetect / wjpDecode を生やす。Node のテストからは require で使う。

'use strict';

const WJP_UTF8 = 'utf-8';

// 宣言や外部ヒントを信用するための最低スコア。当時のページは平気で嘘の
// charset を書くので、宣言があっても裏を取ってから使う。
const WJP_MIN_DECLARED = 0.5;

// 総当たり推定の結果を採用する最低スコア。これを下回るなら日本語ですらない。
const WJP_MIN_HEURISTIC = 0.3;

// 総当たり推定を採用するのに必要な、非 ASCII 中のかなの割合。
//
// スコアだけでは足りない。EUC-KR や GBK のバイト列を EUC-JP として読むと
// 漢字が並ぶため、漢字の加点 (+0.85) だけで 0.85 前後の高スコアが出てしまう。
// 実際に韓国語のページ (naver 2003) が euc-jp と誤判定され、正しく euc-kr を
// 宣言していたページを壊していた。
//
// 当時の日本語ページで、かなが 1 文字も無いものは実質存在しない。逆に
// 中国語・韓国語のページにかなはまず現れない。ここが最も効く判別材料になる。
//
// 宣言 (meta) や Wayback のヒントは出所がはっきりしているのでこの制約は掛けない。
// 中国語ページが charset を宣言していれば、これまでどおり正しく直る。
const WJP_MIN_KANA_RATIO = 0.05;

// 宣言を探す範囲。HTML の仕様上 charset は先頭 1024 バイト以内にあるべきだが、
// 当時のページは head が長いことがあるので少し広めに見る。
const WJP_SNIFF_LIMIT = 4096;

// 総当たりの候補。日本語ページで実用上ありうるのはこの 3 つ。
// 同点なら先頭が勝つので、出現頻度の高い順に並べてある。
const WJP_CANDIDATES = ['shift_jis', 'euc-jp', 'iso-2022-jp'];

// <meta charset="..."> と <meta http-equiv="Content-Type" content="...; charset=...">
// の両方にマッチする。content 属性の中身に > は入らないので [^>]*? で足りる。
const WJP_META_RE = /<meta[^>]*?charset\s*=\s*["']?\s*([A-Za-z0-9_.:-]+)/i;

// CSS の @charset は必ずファイル先頭に来る。
const WJP_CSS_RE = /^@charset\s+["']([A-Za-z0-9_.:-]+)["']/i;

/**
 * ラベルを TextDecoder の正規名へ解決する。解決できなければ null。
 * @param {string} label
 * @returns {string|null}
 */
function wjpCanonical(label) {
  if (!label) return null;
  const trimmed = label.trim().replace(/^["']|["']$/g, '');
  if (!trimmed) return null;
  try {
    return new TextDecoder(trimmed).encoding;
  } catch {
    return null;
  }
}

/**
 * バイト列を指定エンコーディングでデコードする。
 * 壊れたバイトは U+FFFD になる (Go 版の RuneError と同じ扱い)。
 * @param {Uint8Array} bytes
 * @param {string} encoding
 * @returns {string}
 */
function wjpDecode(bytes, encoding) {
  if (!encoding || encoding === WJP_UTF8) {
    return new TextDecoder(WJP_UTF8).decode(bytes);
  }
  try {
    return new TextDecoder(encoding).decode(bytes);
  } catch {
    return new TextDecoder(WJP_UTF8).decode(bytes);
  }
}

/**
 * デコード結果が「日本語の文章として自然か」を 0..1 で採点する。
 *
 * 誤ったコーデックで読むと、私用領域・半角カナ・脈絡のない記号ばかりが並ぶ。
 * 正しければひらがな・カタカナ・句読点が高頻度で現れる。ASCII は
 * どのコーデックでも同じに読めて判別材料にならないので母数から除く。
 * @param {string} s
 * @returns {number}
 */
function wjpScore(s) {
  let total = 0;
  let pts = 0;
  for (const ch of s) {
    const r = ch.codePointAt(0);
    if (r < 0x80) continue;
    total++;
    if (r === 0xfffd) {
      pts -= 8.0; // デコード不能バイト
    } else if (r >= 0x3041 && r <= 0x3096) {
      pts += 1.0; // ひらがな
    } else if (r >= 0x30a1 && r <= 0x30fa) {
      pts += 1.0; // カタカナ
    } else if (r >= 0x3000 && r <= 0x303f) {
      pts += 1.0; // 和文約物 (、。「」…)
    } else if (r >= 0x4e00 && r <= 0x9fff) {
      pts += 0.85; // CJK 統合漢字
    } else if (r >= 0xff01 && r <= 0xff5e) {
      pts += 0.5; // 全角英数
    } else if (r >= 0xff61 && r <= 0xff9f) {
      pts -= 0.5; // 半角カナ: 実文では稀。誤判定の典型
    } else if (r >= 0xe000 && r <= 0xf8ff) {
      pts -= 3.0; // 私用領域: ほぼ確実に誤判定
    } else {
      pts -= 0.5;
    }
  }
  if (total === 0) return 0; // 非 ASCII が無い = 判別材料が無い
  return Math.max(0, pts / total);
}

/** 候補コーデックでデコードしてスコアを返す。 */
function wjpEvaluate(bytes, encoding) {
  return wjpScore(wjpDecode(bytes, encoding));
}

/**
 * 非 ASCII 文字のうち、ひらがな・カタカナが占める割合。
 * 日本語かどうかの判別材料として、漢字より遥かに強い。
 * @param {string} s
 * @returns {number}
 */
function wjpKanaRatio(s) {
  let total = 0;
  let kana = 0;
  for (const ch of s) {
    const r = ch.codePointAt(0);
    if (r < 0x80) continue;
    total++;
    if ((r >= 0x3041 && r <= 0x3096) || (r >= 0x30a1 && r <= 0x30fa)) kana++;
  }
  return total === 0 ? 0 : kana / total;
}

/** UTF-8 として妥当か。 */
function wjpValidUTF8(bytes) {
  try {
    new TextDecoder(WJP_UTF8, { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

/** 先頭 sniffLimit バイトから宣言された charset ラベルを拾う。 */
function wjpDeclaredLabel(bytes) {
  const head = bytes.subarray(0, Math.min(bytes.length, WJP_SNIFF_LIMIT));
  // ラベルは必ず ASCII なので latin1 で読めば十分 (どのコーデックでも同じに見える)
  const text = new TextDecoder('windows-1252').decode(head);
  for (const re of [WJP_META_RE, WJP_CSS_RE]) {
    const m = re.exec(text);
    if (m) return m[1];
  }
  return '';
}

/**
 * バイト列の文字コードを推定する。
 * @param {Uint8Array} bytes
 * @param {string} [hint] Wayback の x-archive-guessed-charset や Content-Type の charset
 * @param {string} [forced] 空でなければ問答無用でそれを使う (ポップアップからの手動指定)
 * @returns {{encoding: string, reason: string}}
 */
function wjpDetect(bytes, hint, forced) {
  const forcedName = wjpCanonical(forced);
  if (forcedName) return { encoding: forcedName, reason: 'forced' };

  if (bytes.length === 0) return { encoding: WJP_UTF8, reason: 'empty' };

  // ISO-2022-JP はエスケープシーケンスで一意に決まる。
  const limit = Math.min(bytes.length, WJP_SNIFF_LIMIT);
  for (let i = 0; i + 1 < limit; i++) {
    if (bytes[i] === 0x1b && bytes[i + 1] === 0x24) {
      if (wjpEvaluate(bytes, 'iso-2022-jp') >= WJP_MIN_DECLARED) {
        return { encoding: 'iso-2022-jp', reason: 'escape-sequence' };
      }
      break;
    }
  }

  // 既に UTF-8 として妥当ならそのまま。ASCII のみのページもここで抜ける。
  // EUC-JP / Shift_JIS の本文はまず UTF-8 として妥当にならないので、
  // この判定を先に置いても取りこぼさない。
  if (wjpValidUTF8(bytes)) return { encoding: WJP_UTF8, reason: 'valid-utf8' };

  // 本文の宣言 → 外部ヒント の順。どちらも検証してから採用する。
  for (const [label, reason] of [
    [wjpDeclaredLabel(bytes), 'meta'],
    [hint, 'hint'],
  ]) {
    const name = wjpCanonical(label);
    if (!name || name === WJP_UTF8) continue; // UTF-8 でないことは上で確定済み
    if (wjpEvaluate(bytes, name) >= WJP_MIN_DECLARED) {
      return { encoding: name, reason };
    }
  }

  // 総当たり + スコアリング。
  let best = null;
  let bestScore = -1;
  let bestText = '';
  for (const name of WJP_CANDIDATES) {
    const text = wjpDecode(bytes, name);
    const sc = wjpScore(text);
    if (sc > bestScore) {
      best = name;
      bestScore = sc;
      bestText = text;
    }
  }
  // スコアに加えて、かなが実際に出現することを要求する。
  // これが無いと非日本語ページを漢字の羅列として「直して」しまう。
  if (
    bestScore >= WJP_MIN_HEURISTIC &&
    wjpKanaRatio(bestText) >= WJP_MIN_KANA_RATIO
  ) {
    return { encoding: best, reason: `heuristic(${bestScore.toFixed(2)})` };
  }

  // 判定できなかった。呼び出し側は触らずに済ませること。
  // (Go 版のプロキシは何かを返す必要があるので Shift_JIS を既定にしているが、
  //  拡張は「何もしない」を選べる。ブラウザの解釈のほうが妥当な可能性が高い)
  return { encoding: 'shift_jis', reason: 'fallback' };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { wjpDetect, wjpDecode, wjpScore, wjpCanonical, wjpKanaRatio };
}
