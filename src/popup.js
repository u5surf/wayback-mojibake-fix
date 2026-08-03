// ポップアップ。判定結果を表示し、外れていたときに手動で指定できるようにする。
//
// メッセージは対象タブの全フレームへ届くが、返事をするのは介入対象の
// フレームだけ (content.js の state.eligible)。最初の返事を採用する。

'use strict';

// Firefox は browser.*、Chrome は chrome.* で Promise を返す。
// (Firefox の chrome.* はコールバック方式なので、そちらは使わない)
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
  // 応答するフレームが 1 つも無いと reject する。異常ではないので握り潰す。
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
