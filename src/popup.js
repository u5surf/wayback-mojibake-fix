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

function describe(reason) {
  if (!reason) return '';
  if (reason.startsWith('heuristic')) {
    const score = reason.slice('heuristic('.length, -1);
    return `統計的な推定 (スコア ${score})`;
  }
  return REASONS[reason] || reason;
}

function render(res) {
  if (!res || !res.encoding) {
    statusEl.textContent = 'このページに直すところはありません。';
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

  for (const button of buttons) {
    button.addEventListener('click', async () => {
      buttons.forEach((b) => (b.disabled = true));
      const res = await send(tab.id, {
        type: 'force',
        encoding: button.dataset.enc,
      });
      render(res);
      buttons.forEach((b) => (b.disabled = false));
    });
  }
}

init();
