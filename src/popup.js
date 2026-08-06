// The popup. Shows the detection result and lets the user override it when
// detection got it wrong.
//
// The message reaches every frame of the target tab, but only frames that are
// candidates answer (content.js state.eligible). The first answer wins.

'use strict';

// Firefox returns promises from browser.*, Chrome from chrome.*.
// (Firefox's chrome.* is callback-style, so it is not used here.)
const api = globalThis.browser ?? globalThis.chrome;

const REASONS = {
  forced: '手動指定',
  empty: '中身が空',
  'escape-sequence': 'エスケープシーケンスから確定',
  'valid-utf8': 'UTF-8 として妥当',
  meta: 'ページ内の宣言',
  hint: 'Wayback のヒント',
  fallback: '判定不能のため既定値',
};

const statusEl = document.getElementById('status');
const buttons = [...document.querySelectorAll('button[data-enc]')];
const toggleEl = document.getElementById('toggle');
const toggleLabelEl = document.getElementById('toggle-label');

function describe(reason) {
  if (!reason) return '';
  if (reason.startsWith('heuristic')) {
    const score = reason.slice('heuristic('.length, -1);
    return `統計的な推定 (スコア ${score})`;
  }
  return REASONS[reason] || reason;
}

/**
 * Bring the on/off button in line with the state.
 * Hidden on pages where switching would not change anything (no conversion
 * needed, detection failed).
 */
function renderToggle(res) {
  const usable = Boolean(res && res.convertible);
  toggleEl.hidden = !usable;
  if (!usable) return;
  toggleEl.setAttribute('aria-pressed', String(res.applied));
  toggleLabelEl.textContent = res.applied ? '変換 ON' : '変換 OFF';
}

function render(res) {
  renderToggle(res);

  if (!res || !res.encoding) {
    statusEl.textContent = 'このページに直すところはありません。';
    return;
  }
  if (res.convertible && !res.applied) {
    // Just switched off. What the page looks like now is more useful here than
    // the detection result.
    statusEl.innerHTML = '';
    const line = document.createElement('span');
    line.textContent = 'ブラウザ本来の表示 (未変換)';
    statusEl.append(line);
    const sub = document.createElement('span');
    sub.className = 'reason';
    sub.textContent = `ON で ${res.encoding} として読み直します`;
    statusEl.append(sub);
    return;
  }
  const verb = res.applied ? '変換しました' : '変換は不要でした';
  statusEl.innerHTML = '';
  const line = document.createElement('span');
  line.append(document.createTextNode(`${verb}: `));
  const strong = document.createElement('strong');
  strong.textContent = res.encoding;
  line.append(strong);
  statusEl.append(line);

  const reason = describe(res.reason);
  if (reason) {
    const sub = document.createElement('span');
    sub.className = 'reason';
    sub.textContent = reason;
    statusEl.append(sub);
  }
}

function disable(message) {
  statusEl.textContent = message;
  buttons.forEach((b) => (b.disabled = true));
  toggleEl.hidden = true;
}

/** Freeze the buttons while a request is in flight, so state cannot drift. */
function setBusy(busy) {
  buttons.forEach((b) => (b.disabled = busy));
  toggleEl.disabled = busy;
}

async function activeTab() {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function send(tabId, message) {
  // Rejects when no frame answers at all. That is not an error, so swallow it.
  return api.tabs.sendMessage(tabId, message).catch(() => null);
}

async function init() {
  const tab = await activeTab();
  if (!tab || !tab.id) return disable('タブを取得できませんでした。');
  if (!/^https?:\/\/web\.archive\.org\/web\//.test(tab.url || '')) {
    return disable('Wayback Machine の再生ページで使ってください。');
  }

  render(await send(tab.id, { type: 'status' }));

  // Send the desired state, not a flip. On frameset pages several frames
  // respond, and letting each flip on its own would drift them out of sync.
  toggleEl.addEventListener('click', async () => {
    const enabled = toggleEl.getAttribute('aria-pressed') !== 'true';
    setBusy(true);
    render(await send(tab.id, { type: 'setEnabled', enabled }));
    setBusy(false);
  });

  for (const button of buttons) {
    button.addEventListener('click', async () => {
      setBusy(true);
      const res = await send(tab.id, {
        type: 'force',
        encoding: button.dataset.enc,
      });
      render(res);
      setBusy(false);
    });
  }
}

init();
