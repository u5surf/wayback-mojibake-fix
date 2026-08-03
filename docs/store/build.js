// ストア提出用のスクリーンショットと小プロモタイルを生成する。
//
//   node docs/store/build.js
//
// ヘッドレス Chrome で HTML を 1280x800 (Chrome Web Store の規定サイズ) に
// 描画する。CHROME 環境変数で実行ファイルを差し替えられる。
//
// 文面に使っている文字化けの実例は、実際に web.archive.org が返すバイト列を
// windows-1252 (現代のブラウザのロケール既定) で解釈した結果そのもの。

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const CHROME =
  process.env.CHROME ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const OUT = path.join(__dirname, 'screenshots');
const TMP = path.join(__dirname, '.tmp');

// 実際のアーカイブページから採取した文字列。左が化けた状態、右が修正後。
const SAMPLES = [
  {
    url: 'web.archive.org/web/20000925190519/http://www2a.biglobe.ne.jp/~hirapon/',
    broken: ['‚¿‚á‚è‚Ý‚Á‚­‚·', 'ƒQ[ƒ€”', 'ƒvƒƒtƒB[ƒ‹', 'ƒ`ƒƒƒŠƒ€ŠJ”­Žº'],
    fixed: ['ちゃりみっくす', 'ゲーム数', 'プロフィール', 'チャリム開発室'],
  },
];

const DETECTIONS = [
  { site: 'tbs.co.jp 2000', enc: 'shift_jis', reason: 'hint' },
  { site: 'geocities.jp 2007', enc: 'euc-jp', reason: 'hint' },
  { site: 'fctv.ne.jp 2000', enc: 'shift_jis', reason: 'meta' },
  { site: 'asahi-net.or.jp 2001', enc: 'shift_jis', reason: 'heuristic(0.84)' },
];

const STRINGS = {
  ja: {
    hero_kicker: 'Wayback Machine の昔の日本語ページ',
    hero_title: '開くだけで、読める',
    hero_before: 'これまで',
    hero_after: 'この拡張を入れると',
    hero_note:
      '2000 年前後の日本語ページは charset を宣言していない。現代のブラウザは自動判別をやめたため、ロケール既定で解釈して化ける。',

    detect_kicker: '自動判定',
    detect_title: 'Shift_JIS / EUC-JP / ISO-2022-JP',
    detect_note:
      '宣言・Wayback のヒント・統計スコアの順に試し、必ず実際にデコードして日本語として自然かを検証してから採用する。当時のページは平気で嘘の charset を書くため。',
    detect_col_site: 'ページ',
    detect_col_enc: '判定',
    detect_col_reason: '根拠',

    popup_kicker: '手動指定',
    popup_title: '外れたときは自分で選べる',
    popup_note:
      'ツールバーのアイコンから、判定結果と根拠を確認できる。短いページや日本語が数文字しかないページでは統計スコアが効かないので、そのときは手動で指定する。',
    popup_status: '変換しました: ',
    popup_reason: 'Wayback のヒント',
    popup_label: '手動で指定',
    popup_buttons: [
      '自動判定に戻す',
      'Shift_JIS',
      'EUC-JP',
      'ISO-2022-JP',
      'UTF-8',
    ],

    how_kicker: '仕組み',
    how_title: 'サーバ不要。URL もそのまま',
    how_items: [
      [
        'URL を書き換えない',
        'web.archive.org をそのまま開くだけ。プロキシもアカウントも要らない。',
      ],
      [
        '追加の通信はほぼ発生しない',
        'HTTP キャッシュから読み直して文字コードを判定するので、archive.org への負荷を増やさない。',
      ],
      [
        '権限は web.archive.org だけ',
        '他のサイトは一切見ない。閲覧履歴の収集も外部送信もしない。',
      ],
    ],

    safe_kicker: '安全側の設計',
    safe_title: '壊さないための線引き',
    safe_items: [
      'UTF-8 として正しく読めるページには一切触らない',
      'ブラウザが既に正しく解釈しているページも素通りする',
      'Wayback のツールバーとリンク書き換えはそのまま残る',
      'HTML 以外 (画像・PDF・スクリプト) は 1 バイトも触らない',
      'ソースは GitHub で公開。広告なし、課金なし、追跡なし',
    ],

    tile_title: '昔の日本語ページを、読めるように',
  },
  en: {
    hero_kicker: 'Old Japanese pages on the Wayback Machine',
    hero_title: 'Readable, just by opening them',
    hero_before: 'Before',
    hero_after: 'With this extension',
    hero_note:
      'Japanese pages from around 2000 declare no charset. Modern browsers no longer autodetect, so they fall back to a locale default and the text breaks.',

    detect_kicker: 'Automatic detection',
    detect_title: 'Shift_JIS / EUC-JP / ISO-2022-JP',
    detect_note:
      'Declarations, the Wayback hint, then statistical scoring — each candidate is actually decoded and checked for whether it reads as natural Japanese before being accepted.',
    detect_col_site: 'Page',
    detect_col_enc: 'Detected',
    detect_col_reason: 'Basis',

    popup_kicker: 'Manual override',
    popup_title: 'Pick the encoding yourself',
    popup_note:
      'The toolbar popup shows what was detected and why. Short pages with only a few Japanese characters can defeat the scoring — override them by hand.',
    popup_status: 'Converted: ',
    popup_reason: 'Wayback hint',
    popup_label: 'Set manually',
    popup_buttons: [
      'Back to automatic',
      'Shift_JIS',
      'EUC-JP',
      'ISO-2022-JP',
      'UTF-8',
    ],

    how_kicker: 'How it works',
    how_title: 'No server. No URL changes',
    how_items: [
      [
        'URLs stay untouched',
        'Just open web.archive.org as usual. No proxy, no account.',
      ],
      [
        'Almost no extra traffic',
        'It re-reads the page from the HTTP cache to detect the encoding, so it adds no load to archive.org.',
      ],
      [
        'Only web.archive.org',
        'It never touches other sites, collects no browsing history, and sends nothing anywhere.',
      ],
    ],

    safe_kicker: 'Designed to be safe',
    safe_title: 'What it refuses to touch',
    safe_items: [
      'Pages that already decode as valid UTF-8',
      'Pages the browser is already interpreting correctly',
      "The Wayback toolbar and its link rewriting stay intact",
      'Anything that is not HTML — images, PDFs, scripts',
      'Open source on GitHub. No ads, no payments, no tracking',
    ],

    tile_title: 'Read old Japanese pages again',
  },
};

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1280px; height: 800px; overflow: hidden;
    background: #f8fafc; color: #111827;
    font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", system-ui, sans-serif;
    display: flex; flex-direction: column;
    padding: 64px 72px;
  }
  .kicker { font-size: 20px; color: #0e7490; font-weight: 600; letter-spacing: .04em; }
  h1 { font-size: 54px; line-height: 1.2; margin-top: 10px; letter-spacing: -.01em; }
  .note { font-size: 19px; line-height: 1.7; color: #4b5563; max-width: 1000px; margin-top: auto; }
  .body { margin-top: 44px; flex: 1; display: flex; }

  .cards { display: grid; grid-template-columns: 1fr 64px 1fr; align-items: center; width: 100%; }
  .card { border-radius: 14px; padding: 30px 32px; height: 300px; }
  .card.before { background: #fff; border: 2px solid #e5e7eb; }
  .card.after { background: #0f172a; }
  .card .label { font-size: 16px; font-weight: 600; margin-bottom: 18px; }
  .card.before .label { color: #9ca3af; }
  .card.after .label { color: #22d3ee; }
  .card .line { font-size: 27px; line-height: 1.75; }
  /* 化けた側もブラウザと同じ比例フォントで出す。等幅にするとコードに見えてしまい、
     実際の見え方と食い違う。 */
  .card.before .line { color: #9ca3af; }
  .card.after .line { color: #f1f5f9; }
  .card.after .line:first-of-type, .card.before .line:first-of-type { font-weight: 700; }
  .arrow { text-align: center; font-size: 40px; color: #0e7490; }

  table { width: 100%; border-collapse: collapse; font-size: 25px; }
  th { text-align: left; font-size: 16px; color: #6b7280; font-weight: 600; padding-bottom: 14px; }
  td { padding: 17px 0; border-top: 1px solid #e5e7eb; }
  td.site { color: #4b5563; font-family: ui-monospace, Menlo, monospace; font-size: 21px; }
  td.enc { font-weight: 700; color: #0e7490; }
  td.reason { color: #6b7280; font-size: 19px; font-family: ui-monospace, Menlo, monospace; }

  .popup-wrap { display: flex; gap: 72px; align-items: center; width: 100%; }
  .popup {
    width: 430px; background: #fff; border: 1px solid #d1d5db; border-radius: 14px;
    padding: 24px; box-shadow: 0 18px 40px rgba(15, 23, 42, .14); font-size: 21px;
  }
  .popup .status { border: 1px solid #d1d5db; border-radius: 9px; padding: 16px; margin-bottom: 20px; }
  .popup .status strong { color: #0e7490; }
  .popup .status .r { display: block; color: #6b7280; font-size: 17px; margin-top: 5px; }
  .popup .plabel { color: #6b7280; font-size: 17px; margin-bottom: 10px; }
  .popup button {
    display: block; width: 100%; text-align: left; padding: 12px 14px; margin-bottom: 8px;
    border: 1px solid #d1d5db; border-radius: 9px; background: transparent; font: inherit; color: inherit;
  }
  .popup button.on { border-color: #0e7490; color: #0e7490; }
  .popup-side { flex: 1; font-size: 23px; line-height: 1.8; color: #374151; }

  .items { display: grid; gap: 30px; width: 100%; align-content: center; }
  .item { display: grid; grid-template-columns: 44px 1fr; gap: 22px; align-items: start; }
  .dot { width: 34px; height: 34px; border-radius: 10px; background: #0e7490; margin-top: 4px; }
  .item h2 { font-size: 29px; margin-bottom: 8px; }
  .item p { font-size: 20px; line-height: 1.6; color: #4b5563; }

  ul { list-style: none; align-self: center; width: 100%; }
  li { font-size: 27px; line-height: 1.55; padding: 19px 0 19px 52px; border-top: 1px solid #e5e7eb; position: relative; }
  li:first-child { border-top: 0; }
  li::before {
    content: ""; position: absolute; left: 6px; top: 27px;
    width: 20px; height: 11px; border-left: 4px solid #0e7490; border-bottom: 4px solid #0e7490;
    transform: rotate(-45deg);
  }
`;

const page = (body) =>
  `<!doctype html><html lang="ja"><meta charset="utf-8"><style>${CSS}</style><body>${body}</body></html>`;

const head = (kicker, title) =>
  `<div class="kicker">${kicker}</div><h1>${title}</h1>`;

function hero(t) {
  const s = SAMPLES[0];
  const lines = (arr) => arr.map((x) => `<div class="line">${x}</div>`).join('');
  return page(`
    ${head(t.hero_kicker, t.hero_title)}
    <div class="body"><div class="cards">
      <div class="card before"><div class="label">${t.hero_before}</div>${lines(s.broken)}</div>
      <div class="arrow">→</div>
      <div class="card after"><div class="label">${t.hero_after}</div>${lines(s.fixed)}</div>
    </div></div>
    <p class="note">${t.hero_note}</p>`);
}

function detect(t) {
  const rows = DETECTIONS.map(
    (d) =>
      `<tr><td class="site">${d.site}</td><td class="enc">${d.enc}</td><td class="reason">${d.reason}</td></tr>`
  ).join('');
  return page(`
    ${head(t.detect_kicker, t.detect_title)}
    <div class="body"><table>
      <tr><th>${t.detect_col_site}</th><th>${t.detect_col_enc}</th><th>${t.detect_col_reason}</th></tr>
      ${rows}
    </table></div>
    <p class="note">${t.detect_note}</p>`);
}

function popup(t) {
  const buttons = t.popup_buttons
    .map((b, i) => `<button class="${i === 1 ? 'on' : ''}">${b}</button>`)
    .join('');
  return page(`
    ${head(t.popup_kicker, t.popup_title)}
    <div class="body"><div class="popup-wrap">
      <div class="popup">
        <div class="status">${t.popup_status}<strong>shift_jis</strong><span class="r">${t.popup_reason}</span></div>
        <div class="plabel">${t.popup_label}</div>
        ${buttons}
      </div>
      <div class="popup-side">${t.popup_note}</div>
    </div></div>`);
}

function how(t) {
  const items = t.how_items
    .map(
      ([h, p]) =>
        `<div class="item"><div class="dot"></div><div><h2>${h}</h2><p>${p}</p></div></div>`
    )
    .join('');
  return page(`
    ${head(t.how_kicker, t.how_title)}
    <div class="body"><div class="items">${items}</div></div>`);
}

function safe(t) {
  const items = t.safe_items.map((x) => `<li>${x}</li>`).join('');
  return page(`
    ${head(t.safe_kicker, t.safe_title)}
    <div class="body"><ul>${items}</ul></div>`);
}

function tile(t) {
  return `<!doctype html><html lang="ja"><meta charset="utf-8"><style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { width: 440px; height: 280px; background: #0f172a; color: #f1f5f9;
      font-family: "Hiragino Sans", system-ui, sans-serif;
      display: flex; flex-direction: column; justify-content: center; padding: 32px; }
    .m { font-family: ui-monospace, Menlo, monospace; font-size: 17px; color: #64748b; }
    .f { font-size: 25px; font-weight: 700; margin: 6px 0 16px; }
    .a { color: #22d3ee; font-size: 15px; }
    h1 { font-size: 19px; line-height: 1.5; font-weight: 600; }
  </style><body>
    <div class="m">‚¿‚á‚è‚Ý‚Á‚­‚·</div>
    <div class="a">↓</div>
    <div class="f">ちゃりみっくす</div>
    <h1>${t.tile_title}</h1>
  </body></html>`;
}

const SHOTS = [
  ['1-hero', hero, 1280, 800],
  ['2-detect', detect, 1280, 800],
  ['3-popup', popup, 1280, 800],
  ['4-how', how, 1280, 800],
  ['5-safe', safe, 1280, 800],
  ['tile', tile, 440, 280],
];

fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

for (const [locale, strings] of Object.entries(STRINGS)) {
  for (const [name, render, w, h] of SHOTS) {
    const html = path.join(TMP, `${locale}-${name}.html`);
    const png = path.join(OUT, `${locale}-${name}.png`);
    fs.writeFileSync(html, render(strings));
    execFileSync(CHROME, [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--window-size=${w},${h}`,
      '--virtual-time-budget=2000',
      `--screenshot=${png}`,
      `file://${html}`,
    ]);
    console.log(`${path.relative(process.cwd(), png)}  ${w}x${h}`);
  }
}

fs.rmSync(TMP, { recursive: true, force: true });
