// web.archive.org の再生ページを開いたときに、文字化けしていれば直す。
//
// 仕組みは単純で、同じ URL をもう一度 fetch して「生バイト列」を手に入れ、
// 自前で文字コードを判定してデコードし直し、文書を差し替える。
//
// なぜ再取得するのか: ブラウザは charset の無い応答をロケール既定
// (多くは windows-1252) で解釈済みで、その時点で壊れた文字は U+FFFD に
// 潰れている。DOM から元のバイト列は復元できないので、取り直すしかない。
// cache: 'force-cache' を付けているので、通常は HTTP キャッシュから返り、
// web.archive.org への追加リクエストは発生しない。
//
// なぜ id_ を使わないのか: 拡張は web.archive.org 上で動くので、Wayback が
// 埋め込んだリンク書き換えとツールバーをそのまま活かせる。Go 版のプロキシが
// id_ を必要としたのはオリジンが変わるからで、ここではその制約が無い。

'use strict';

(() => {
  const api = globalThis.browser ?? globalThis.chrome;

  const FETCH_TIMEOUT_MS = 15000;
  const UNHIDE_SAFETY_MS = 4000;

  const state = {
    bytes: null, // 生バイト列。手動指定でのやり直しに使う
    hint: '', // Wayback の x-archive-guessed-charset
    result: null, // 直近の判定結果
    applied: false, // 文書を差し替えたか
    eligible: false, // このフレームが介入対象か (UTF-8 として妥当なら対象外)
  };

  if (window.wjpRan) return;
  window.wjpRan = true;

  let hideStyle = null;

  function hide() {
    const root = document.documentElement;
    if (!root || hideStyle) return;
    hideStyle = document.createElement('style');
    hideStyle.textContent = 'html{visibility:hidden!important}';
    root.appendChild(hideStyle);
    // 何が起きても最後には必ず見えるようにする
    setTimeout(unhide, UNHIDE_SAFETY_MS);
  }

  function unhide() {
    if (hideStyle) {
      hideStyle.remove();
      hideStyle = null;
    }
  }

  /** HTML 文書以外 (画像・PDF・プレーンテキスト) には触らない。 */
  function isHTMLDocument() {
    const type = (document.contentType || '').toLowerCase();
    return type === '' || type.includes('html');
  }

  /**
   * 文書内の charset 宣言を utf-8 に書き換える。
   * 差し替え後の文書は既にデコード済みの文字列なので宣言は解釈に影響しないが、
   * 残しておくと保存やソース表示のときに嘘の情報になる。
   */
  function rewriteDeclarations(html) {
    return html.replace(
      /(<meta[^>]*?charset\s*=\s*["']?\s*)([A-Za-z0-9_.:-]+)/gi,
      '$1utf-8'
    );
  }

  /** デコード済みの HTML で文書を丸ごと差し替える。 */
  function replaceDocument(html) {
    document.open();
    document.write(rewriteDeclarations(html));
    document.close();
    state.applied = true;
  }

  async function fetchBytes() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(location.href, {
        cache: 'force-cache',
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const type = (res.headers.get('content-type') || '').toLowerCase();
      // Content-Type が無いのがまさに今回の症状なので、無い場合も通す。
      if (type && !type.includes('html') && !type.includes('text/')) return null;
      state.hint = res.headers.get('x-archive-guessed-charset') || '';
      return new Uint8Array(await res.arrayBuffer());
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function run() {
    if (!isHTMLDocument()) return;
    hide();
    try {
      const bytes = await fetchBytes();
      if (!bytes || bytes.length === 0) return;

      // UTF-8 として妥当なフレームは、そもそも化けようがない。
      // Wayback のツールバーや wrapper がここで除外され、手動指定の巻き添えも防げる。
      if (wjpValidUTF8(bytes)) return;

      state.bytes = bytes;
      state.eligible = true;

      const result = wjpDetect(bytes, state.hint, '');
      state.result = result;

      // 判定できなかったときは何もしない。
      // 当てずっぽうで差し替えるより、ブラウザの解釈を残すほうが安全で、
      // 韓国語・ロシア語など日本語以外のページを壊さずに済む。
      if (result.reason === 'fallback') return;

      // ブラウザが既に正しく解釈できているなら触らない。
      // (当時のページでも <meta charset> がある場合はこちらに来る)
      const current = (document.characterSet || '').toLowerCase();
      if (current === result.encoding) return;

      replaceDocument(wjpDecode(bytes, result.encoding));
    } finally {
      unhide();
    }
  }

  /** ポップアップからの手動指定。判定を無視して指定のコーデックで読み直す。 */
  function applyForced(label) {
    if (!state.bytes) return null;
    const result = wjpDetect(state.bytes, state.hint, label);
    state.result = result;
    replaceDocument(wjpDecode(state.bytes, result.encoding));
    return result;
  }

  api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    // 介入対象でないフレーム (ツールバー等) は黙る。ポップアップは
    // 最初に返事をしたフレームだけを見るので、これで本文のフレームが選ばれる。
    if (!state.eligible) return false;

    if (msg.type === 'status') {
      sendResponse({
        encoding: state.result ? state.result.encoding : null,
        reason: state.result ? state.result.reason : null,
        applied: state.applied,
        hint: state.hint,
      });
      return false;
    }

    if (msg.type === 'force') {
      const result = applyForced(msg.encoding);
      sendResponse(
        result
          ? { encoding: result.encoding, reason: result.reason, applied: true }
          : null
      );
      return false;
    }

    return false;
  });

  run();
})();
