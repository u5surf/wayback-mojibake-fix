// Fixes garbled text on web.archive.org replay pages.
//
// The approach is simple: re-fetch the same URL to get the raw bytes, detect
// the encoding ourselves, decode again, and replace the document.
//
// Why re-fetch: the browser has already decoded a charset-less response with
// the locale default (usually windows-1252), and any byte it could not decode
// has collapsed into U+FFFD. The original bytes cannot be recovered from the
// DOM, so fetching again is the only option. cache: 'force-cache' means this
// normally comes from the HTTP cache and costs web.archive.org nothing.
//
// Why not id_: the extension runs on web.archive.org, so Wayback's rewritten
// links and toolbar keep working as they are. The Go proxy this was ported
// from needed id_ because it changed the origin; that constraint is gone here.

'use strict';

(() => {
  const api = globalThis.browser ?? globalThis.chrome;

  const FETCH_TIMEOUT_MS = 15000;
  const UNHIDE_SAFETY_MS = 4000;

  const state = {
    bytes: null, // raw bytes, reused when the user picks an encoding by hand
    hint: '', // Wayback's x-archive-guessed-charset
    result: null, // most recent detection result
    applied: false, // whether the document was replaced
    eligible: false, // is this frame a candidate (valid UTF-8 means no)
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
    // Whatever happens, the page must become visible again in the end.
    setTimeout(unhide, UNHIDE_SAFETY_MS);
  }

  function unhide() {
    if (hideStyle) {
      hideStyle.remove();
      hideStyle = null;
    }
  }

  /** Never touch anything that is not HTML (images, PDFs, plain text). */
  function isHTMLDocument() {
    const type = (document.contentType || '').toLowerCase();
    return type === '' || type.includes('html');
  }

  /**
   * Rewrite charset declarations in the document to utf-8.
   * The replacement document is an already decoded string, so the declaration
   * no longer affects interpretation, but leaving it would be a lie when the
   * user saves the page or views its source.
   */
  function rewriteDeclarations(html) {
    return html.replace(
      /(<meta[^>]*?charset\s*=\s*["']?\s*)([A-Za-z0-9_.:-]+)/gi,
      '$1utf-8'
    );
  }

  /** Replace the whole document with the decoded HTML. */
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
      // A missing Content-Type is the very symptom we are fixing, so let it through.
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

      // A frame that is valid UTF-8 cannot be garbled in the first place.
      // This excludes Wayback's toolbar and wrappers, and keeps a manual
      // override from hitting them by accident.
      if (wjpValidUTF8(bytes)) return;

      state.bytes = bytes;
      state.eligible = true;

      const result = wjpDetect(bytes, state.hint, '');
      state.result = result;

      // Do nothing when detection failed. Leaving the browser's interpretation
      // in place is safer than replacing on a guess, and it keeps non-Japanese
      // pages (Korean, Russian, ...) intact.
      if (result.reason === 'fallback') return;

      // Leave pages the browser already reads correctly alone.
      // (Pages of that era land here when they do carry a <meta charset>.)
      const current = (document.characterSet || '').toLowerCase();
      if (current === result.encoding) return;

      replaceDocument(wjpDecode(bytes, result.encoding));
    } finally {
      unhide();
    }
  }

  /** Manual override from the popup: ignore detection and use the given codec. */
  function applyForced(label) {
    if (!state.bytes) return null;
    const result = wjpDetect(state.bytes, state.hint, label);
    state.result = result;
    replaceDocument(wjpDecode(state.bytes, result.encoding));
    return result;
  }

  api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    // Frames that are not candidates (the toolbar and friends) stay quiet.
    // The popup only looks at the first frame that answers, which is how the
    // content frame gets picked.
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
