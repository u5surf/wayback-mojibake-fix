// Checks that detection matches the Go implementation this was ported from.
// The byte sequences were generated with the golang.org/x/text encoders.

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const {
  wjpDetect,
  wjpDecode,
  wjpScore,
  wjpCanonical,
  wjpKanaRatio,
  wjpHasJISEscape,
} = require('../src/detect.js');

const HELLO = 'こんにちは';
const LONG = '日本語のホームページへようこそ。ここは個人的な記録の場所です。';

// prettier-ignore
const bytes = {
  helloSJIS:  [0x82, 0xb1, 0x82, 0xf1, 0x82, 0xc9, 0x82, 0xbf, 0x82, 0xcd],
  helloEUC:   [0xa4, 0xb3, 0xa4, 0xf3, 0xa4, 0xcb, 0xa4, 0xc1, 0xa4, 0xcf],
  helloJIS:   [0x1b, 0x24, 0x42, 0x24, 0x33, 0x24, 0x73, 0x24, 0x4b, 0x24, 0x41, 0x24, 0x4f, 0x1b, 0x28, 0x42],
  longSJIS:   [0x93, 0xfa, 0x96, 0x7b, 0x8c, 0xea, 0x82, 0xcc, 0x83, 0x7a, 0x81, 0x5b, 0x83, 0x80, 0x83, 0x79,
               0x81, 0x5b, 0x83, 0x57, 0x82, 0xd6, 0x82, 0xe6, 0x82, 0xa4, 0x82, 0xb1, 0x82, 0xbb, 0x81, 0x42,
               0x82, 0xb1, 0x82, 0xb1, 0x82, 0xcd, 0x8c, 0xc2, 0x90, 0x6c, 0x93, 0x49, 0x82, 0xc8, 0x8b, 0x4c,
               0x98, 0x5e, 0x82, 0xcc, 0x8f, 0xea, 0x8f, 0x8a, 0x82, 0xc5, 0x82, 0xb7, 0x81, 0x42],
  longEUC:    [0xc6, 0xfc, 0xcb, 0xdc, 0xb8, 0xec, 0xa4, 0xce, 0xa5, 0xdb, 0xa1, 0xbc, 0xa5, 0xe0, 0xa5, 0xda,
               0xa1, 0xbc, 0xa5, 0xb8, 0xa4, 0xd8, 0xa4, 0xe8, 0xa4, 0xa6, 0xa4, 0xb3, 0xa4, 0xbd, 0xa1, 0xa3,
               0xa4, 0xb3, 0xa4, 0xb3, 0xa4, 0xcf, 0xb8, 0xc4, 0xbf, 0xcd, 0xc5, 0xaa, 0xa4, 0xca, 0xb5, 0xad,
               0xcf, 0xbf, 0xa4, 0xce, 0xbe, 0xec, 0xbd, 0xea, 0xa4, 0xc7, 0xa4, 0xb9, 0xa1, 0xa3],
  // Not Japanese. Each of these could be "fixed" into something broken.
  korean:     [0xb3, 0xd7, 0xc0, 0xcc, 0xb9, 0xf6, 0x20, 0xc1, 0xf6, 0xbd, 0xc4, 0xb1, 0xee, 0xc1, 0xf6, 0x20,
               0xc3, 0xa3, 0xbe, 0xc6, 0xc1, 0xd6, 0xb4, 0xc2, 0x20, 0xb0, 0xcb, 0xbb, 0xf6],
  russian:    [0xf0, 0xd2, 0xc9, 0xd7, 0xc5, 0xd4, 0x20, 0xcd, 0xc9, 0xd2, 0x20, 0xec, 0xc5, 0xce, 0xd4, 0xc1,
               0x2e, 0xf2, 0xd5, 0x20, 0xce, 0xcf, 0xd7, 0xcf, 0xd3, 0xd4, 0xc9],
  chinese:    [0xd6, 0xd0, 0xb9, 0xfa, 0xd0, 0xc2, 0xce, 0xc5, 0xc9, 0xe7, 0x20, 0xbb, 0xb6, 0xd3, 0xad, 0xb9,
               0xe2, 0xc1, 0xd9],
};

/** Concatenate ASCII strings and byte arrays into a Uint8Array. */
function buf(...parts) {
  const out = [];
  for (const part of parts) {
    if (typeof part === 'string') {
      out.push(...Buffer.from(part, 'utf8'));
    } else {
      out.push(...part);
    }
  }
  return new Uint8Array(out);
}

test('宣言もヒントも無い Shift_JIS を統計スコアで当てる', () => {
  const b = buf('<html><body>', bytes.longSJIS, '</body></html>');
  const r = wjpDetect(b, '', '');
  assert.strictEqual(r.encoding, 'shift_jis');
  assert.match(r.reason, /^heuristic/);
  assert.ok(wjpDecode(b, r.encoding).includes(LONG));
});

test('宣言もヒントも無い EUC-JP を統計スコアで当てる', () => {
  const b = buf('<html><body>', bytes.longEUC, '</body></html>');
  const r = wjpDetect(b, '', '');
  assert.strictEqual(r.encoding, 'euc-jp');
  assert.match(r.reason, /^heuristic/);
  assert.ok(wjpDecode(b, r.encoding).includes(LONG));
});

test('ISO-2022-JP はエスケープシーケンスで確定する', () => {
  const b = buf('<html><body>', bytes.helloJIS, '</body></html>');
  const r = wjpDetect(b, '', '');
  assert.strictEqual(r.encoding, 'iso-2022-jp');
  assert.strictEqual(r.reason, 'escape-sequence');
  assert.ok(wjpDecode(b, r.encoding).includes(HELLO));
});

// Regression: Wayback injects its toolbar at the top of a replay page, so the
// first ESC of the content lands more than 10 KB in. Limiting the escape
// search to the first 4096 bytes never reached it, and the page sailed through
// as valid UTF-8 because ISO-2022-JP is 7-bit.
// (Byte 10837 for the 1998 capture of orchid.co.jp/computer/linux/linux.html.)
test('ツールバーの後ろにある ISO-2022-JP も見つける', () => {
  const toolbar = `<!-- ${'wayback '.repeat(1500)} -->`;
  assert.ok(toolbar.length > 10000);
  const b = buf(toolbar, '<html><body>', bytes.helloJIS, '</body></html>');
  const r = wjpDetect(b, '', '');
  assert.strictEqual(r.encoding, 'iso-2022-jp');
  assert.strictEqual(r.reason, 'escape-sequence');
  assert.ok(wjpDecode(b, r.encoding).includes(HELLO));
});

// Every byte of ISO-2022-JP is 7-bit, so it is valid UTF-8 too. This is the
// exception content.js needs so "valid UTF-8 means leave it alone" does not
// reject it.
test('7bit の ISO-2022-JP は UTF-8 妥当でも検出できる', () => {
  const b = buf('<html><body>', bytes.helloJIS, '</body></html>');
  assert.ok(b.every((x) => x < 0x80));
  assert.ok(wjpHasJISEscape(b));
  assert.ok(!wjpHasJISEscape(buf('<html><body>hello</body></html>')));
  assert.ok(!wjpHasJISEscape(buf('<html><body>こんにちは</body></html>')));
});

// Containing ESC $ is not enough: if decoding does not yield Japanese, do not
// take it. Keeps pages that discuss JIS in their body intact.
test('UTF-8 文書に紛れた ESC $ では乗っ取られない', () => {
  const b = buf('<html><body>ESC $ B の例: \x1b$B です</body></html>');
  const r = wjpDetect(b, '', '');
  assert.strictEqual(r.encoding, 'utf-8');
  assert.strictEqual(r.reason, 'valid-utf8');
});

test('UTF-8 として妥当ならそのまま', () => {
  const r = wjpDetect(buf('<html><body>こんにちは</body></html>'), '', '');
  assert.strictEqual(r.encoding, 'utf-8');
  assert.strictEqual(r.reason, 'valid-utf8');
});

test('純 ASCII も UTF-8 として抜ける', () => {
  const r = wjpDetect(buf('<html><body>hello</body></html>'), '', '');
  assert.strictEqual(r.encoding, 'utf-8');
  assert.strictEqual(r.reason, 'valid-utf8');
});

test('空なら utf-8', () => {
  const r = wjpDetect(new Uint8Array(0), '', '');
  assert.strictEqual(r.encoding, 'utf-8');
  assert.strictEqual(r.reason, 'empty');
});

test('meta 宣言を裏取りしてから採用する', () => {
  const b = buf(
    '<html><head><meta http-equiv="Content-Type" content="text/html; charset=x-sjis"></head><body>',
    bytes.longSJIS,
    '</body></html>'
  );
  const r = wjpDetect(b, '', '');
  assert.strictEqual(r.encoding, 'shift_jis'); // the WHATWG label table absorbs x-sjis
  assert.strictEqual(r.reason, 'meta');
});

test('嘘の meta 宣言はスコアが低いので退けられる', () => {
  const b = buf(
    '<html><head><meta charset="euc-jp"></head><body>',
    bytes.longSJIS,
    '</body></html>'
  );
  const r = wjpDetect(b, '', '');
  assert.strictEqual(r.encoding, 'shift_jis');
  assert.match(r.reason, /^heuristic/);
});

test('宣言が無ければ Wayback のヒントを使う', () => {
  const b = buf('<html><body>', bytes.longEUC, '</body></html>');
  const r = wjpDetect(b, 'euc-jp', '');
  assert.strictEqual(r.encoding, 'euc-jp');
  assert.strictEqual(r.reason, 'hint');
});

test('嘘のヒントは退けられる', () => {
  const b = buf('<html><body>', bytes.longSJIS, '</body></html>');
  const r = wjpDetect(b, 'euc-jp', '');
  assert.strictEqual(r.encoding, 'shift_jis');
  assert.match(r.reason, /^heuristic/);
});

test('手動指定はすべてに優先する', () => {
  const b = buf('<html><body>', bytes.longSJIS, '</body></html>');
  const r = wjpDetect(b, '', 'euc-jp');
  assert.strictEqual(r.encoding, 'euc-jp');
  assert.strictEqual(r.reason, 'forced');
});

test('ロシア語 (koi8-r) は fallback になる', () => {
  const b = buf('<html><body>', bytes.russian, '</body></html>');
  const r = wjpDetect(b, '', '');
  assert.strictEqual(r.reason, 'fallback');
});

// Regression: a Korean page (naver 2003) was misdetected as euc-jp.
// Reading EUC-KR as EUC-JP yields a run of kanji, and the kanji bonus alone
// reaches a score of 0.85. It broke a page that correctly declared euc-kr and
// that the browser was rendering just fine.
test('韓国語 (euc-kr) を日本語と誤判定しない', () => {
  const b = buf('<html><body>', bytes.korean, '</body></html>');
  const r = wjpDetect(b, '', '');
  assert.strictEqual(
    r.reason,
    'fallback',
    `かな抜きで採用された: ${JSON.stringify(r)} → ${wjpDecode(b, r.encoding)}`
  );
  // High-scoring as kanji, but rejected because there is no kana
  assert.ok(wjpScore(wjpDecode(b, 'euc-jp')) > 0.5);
  assert.strictEqual(wjpKanaRatio(wjpDecode(b, 'euc-jp')), 0);
});

test('中国語 (gbk) を日本語と誤判定しない', () => {
  const b = buf('<html><body>', bytes.chinese, '</body></html>');
  assert.strictEqual(wjpDetect(b, '', '').reason, 'fallback');
});

// A declaration with a clear provenance is trusted even without kana.
// A Chinese page that declares its charset still gets fixed as before.
test('宣言があれば日本語以外でも従う', () => {
  const b = buf(
    '<html><head><meta charset="gb2312"></head><body>',
    bytes.chinese,
    '</body></html>'
  );
  const r = wjpDetect(b, '', '');
  assert.strictEqual(r.encoding, 'gbk');
  assert.strictEqual(r.reason, 'meta');
  assert.ok(wjpDecode(b, r.encoding).includes('中国新闻社'));
});

test('手動指定なら日本語以外にも従う', () => {
  const b = buf('<html><body>', bytes.korean, '</body></html>');
  const r = wjpDetect(b, '', 'euc-kr');
  assert.strictEqual(r.encoding, 'euc-kr');
  assert.ok(wjpDecode(b, r.encoding).includes('네이버'));
});

test('score は誤ったコーデックに低い点を付ける', () => {
  const b = buf(bytes.longSJIS);
  const correct = wjpScore(wjpDecode(b, 'shift_jis'));
  const wrong = wjpScore(wjpDecode(b, 'euc-jp'));
  assert.ok(correct > 0.8, `correct=${correct}`);
  assert.ok(wrong < correct, `wrong=${wrong} correct=${correct}`);
});

test('当時よく使われたラベルの表記揺れを吸収する', () => {
  for (const label of ['x-sjis', 'ms_kanji', 'windows-31j', 'Shift_JIS']) {
    assert.strictEqual(wjpCanonical(label), 'shift_jis', label);
  }
  for (const label of ['x-euc-jp', 'EUC-JP', 'cseucpkdfmtjapanese']) {
    assert.strictEqual(wjpCanonical(label), 'euc-jp', label);
  }
  assert.strictEqual(wjpCanonical('nonsense-charset'), null);
  assert.strictEqual(wjpCanonical(''), null);

  // Spellings absent from the WHATWG label table (they did exist) cannot be
  // resolved. Those fall through to the statistical score, so they still work
  // out in the end.
  assert.strictEqual(wjpCanonical('eucjp'), null);
});
