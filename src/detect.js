// Detects the character encoding of old web pages that carry no charset
// declaration.
//
// Ported from a Go reverse proxy written to solve the same problem; the order
// of the checks and the scoring weights are deliberately kept in sync (only
// the kana requirement on the brute-force path and doing nothing when
// detection fails differ on the extension side -- see the README).
// TextDecoder implements the WHATWG label table as is, so the browser absorbs
// the x-sjis / ms_kanji / windows-31j spelling variants that the Go version
// delegated to htmlindex.
//
// Loaded as a classic script from the content script, exposing wjpDetect and
// wjpDecode as globals. The Node tests pull it in with require.

'use strict';

const WJP_UTF8 = 'utf-8';

// Minimum score required to trust a declaration or an external hint. Pages of
// that era happily declared the wrong charset, so even a declaration gets
// verified before it is used.
const WJP_MIN_DECLARED = 0.5;

// Minimum score required to accept a brute-force guess. Below this the page is
// not even Japanese.
const WJP_MIN_HEURISTIC = 0.3;

// Share of non-ASCII characters that must be kana for a brute-force guess to
// be accepted.
//
// The score alone is not enough. Reading EUC-KR or GBK bytes as EUC-JP yields
// a run of kanji, and the kanji bonus (+0.85) alone pushes the score to around
// 0.85. A Korean page (naver 2003) really was misdetected as euc-jp this way,
// breaking a page that correctly declared euc-kr.
//
// A Japanese page of that era with not a single kana character effectively
// does not exist. Conversely kana almost never show up on Chinese or Korean
// pages. This is the strongest signal available.
//
// Declarations (meta) and Wayback's hint have a clear provenance, so this
// constraint is not applied to them. A Chinese page that declares its charset
// still gets fixed exactly as before.
const WJP_MIN_KANA_RATIO = 0.05;

// How far to look for a declaration. Per the HTML spec charset should appear
// within the first 1024 bytes, but pages of that era sometimes had a long
// head, so look a little further.
const WJP_SNIFF_LIMIT = 4096;

// Brute-force candidates. These three are the only ones that come up in
// practice on Japanese pages. Ties go to the first entry, so they are ordered
// by how often they occur.
const WJP_CANDIDATES = ['shift_jis', 'euc-jp', 'iso-2022-jp'];

// Matches both <meta charset="..."> and
// <meta http-equiv="Content-Type" content="...; charset=...">.
// A content attribute never contains >, so [^>]*? is enough.
const WJP_META_RE = /<meta[^>]*?charset\s*=\s*["']?\s*([A-Za-z0-9_.:-]+)/i;

// A CSS @charset always sits at the very start of the file.
const WJP_CSS_RE = /^@charset\s+["']([A-Za-z0-9_.:-]+)["']/i;

/**
 * Resolve a label to TextDecoder's canonical name, or null if it cannot be
 * resolved.
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
 * Decode bytes with the given encoding.
 * Broken bytes become U+FFFD (the same treatment as RuneError in the Go
 * version).
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
 * Score how natural the decoded result looks as Japanese prose, from 0 to 1.
 *
 * Read with the wrong codec, the output fills up with private-use characters,
 * half-width katakana and unrelated symbols. Read correctly, hiragana,
 * katakana and Japanese punctuation appear at a high rate. ASCII reads the
 * same under every codec and carries no signal, so it is left out of the
 * denominator.
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
      pts -= 8.0; // undecodable byte
    } else if (r >= 0x3041 && r <= 0x3096) {
      pts += 1.0; // hiragana
    } else if (r >= 0x30a1 && r <= 0x30fa) {
      pts += 1.0; // katakana
    } else if (r >= 0x3000 && r <= 0x303f) {
      pts += 1.0; // Japanese punctuation
    } else if (r >= 0x4e00 && r <= 0x9fff) {
      pts += 0.85; // CJK unified ideographs
    } else if (r >= 0xff01 && r <= 0xff5e) {
      pts += 0.5; // full-width alphanumerics
    } else if (r >= 0xff61 && r <= 0xff9f) {
      pts -= 0.5; // half-width katakana: rare in real prose, a classic misdetect
    } else if (r >= 0xe000 && r <= 0xf8ff) {
      pts -= 3.0; // private use area: almost certainly a misdetect
    } else {
      pts -= 0.5;
    }
  }
  if (total === 0) return 0; // no non-ASCII means no signal
  return Math.max(0, pts / total);
}

/** Decode with a candidate codec and return its score. */
function wjpEvaluate(bytes, encoding) {
  return wjpScore(wjpDecode(bytes, encoding));
}

/**
 * Share of non-ASCII characters that are hiragana or katakana.
 * A far stronger signal for "is this Japanese" than kanji.
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

/** Is this valid UTF-8? */
function wjpValidUTF8(bytes) {
  try {
    new TextDecoder(WJP_UTF8, { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

/** Pick up a declared charset label from the first sniffLimit bytes. */
function wjpDeclaredLabel(bytes) {
  const head = bytes.subarray(0, Math.min(bytes.length, WJP_SNIFF_LIMIT));
  // Labels are always ASCII, so latin1 is enough (it looks the same under
  // every codec).
  const text = new TextDecoder('windows-1252').decode(head);
  for (const re of [WJP_META_RE, WJP_CSS_RE]) {
    const m = re.exec(text);
    if (m) return m[1];
  }
  return '';
}

/**
 * Detect the character encoding of a byte sequence.
 * @param {Uint8Array} bytes
 * @param {string} [hint] Wayback's x-archive-guessed-charset, or the charset
 *   from Content-Type
 * @param {string} [forced] when non-empty, use it no questions asked (a manual
 *   override from the popup)
 * @returns {{encoding: string, reason: string}}
 */
function wjpDetect(bytes, hint, forced) {
  const forcedName = wjpCanonical(forced);
  if (forcedName) return { encoding: forcedName, reason: 'forced' };

  if (bytes.length === 0) return { encoding: WJP_UTF8, reason: 'empty' };

  // ISO-2022-JP is pinned down uniquely by its escape sequences.
  const limit = Math.min(bytes.length, WJP_SNIFF_LIMIT);
  for (let i = 0; i + 1 < limit; i++) {
    if (bytes[i] === 0x1b && bytes[i + 1] === 0x24) {
      if (wjpEvaluate(bytes, 'iso-2022-jp') >= WJP_MIN_DECLARED) {
        return { encoding: 'iso-2022-jp', reason: 'escape-sequence' };
      }
      break;
    }
  }

  // Already valid UTF-8 means leave it alone. Pure ASCII pages exit here too.
  // EUC-JP and Shift_JIS prose is essentially never valid UTF-8, so putting
  // this check first does not cost us anything.
  if (wjpValidUTF8(bytes)) return { encoding: WJP_UTF8, reason: 'valid-utf8' };

  // In-document declaration first, external hint second. Both get verified
  // before they are used.
  for (const [label, reason] of [
    [wjpDeclaredLabel(bytes), 'meta'],
    [hint, 'hint'],
  ]) {
    const name = wjpCanonical(label);
    if (!name || name === WJP_UTF8) continue; // not UTF-8; settled above
    if (wjpEvaluate(bytes, name) >= WJP_MIN_DECLARED) {
      return { encoding: name, reason };
    }
  }

  // Brute force plus scoring.
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
  // On top of the score, require that kana actually occur. Without this we
  // would "fix" non-Japanese pages into a run of kanji.
  if (
    bestScore >= WJP_MIN_HEURISTIC &&
    wjpKanaRatio(bestText) >= WJP_MIN_KANA_RATIO
  ) {
    return { encoding: best, reason: `heuristic(${bestScore.toFixed(2)})` };
  }

  // Detection failed. The caller is expected to leave the page alone.
  // (The Go proxy has to return something, so it defaults to Shift_JIS; the
  //  extension can choose to do nothing, and the browser's interpretation is
  //  more likely to be reasonable.)
  return { encoding: 'shift_jis', reason: 'fallback' };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { wjpDetect, wjpDecode, wjpScore, wjpCanonical, wjpKanaRatio };
}
