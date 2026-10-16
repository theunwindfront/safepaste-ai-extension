import '../shared/constants.js';
import { detect } from './detect.js';
import { pull, status, warmUp } from './ollama.js';
import { getSettings, getStats, recordPaste } from './settings.js';

const mapKey = (tabId) => `map:${tabId}`;
chrome.tabs.onRemoved.addListener((tabId) => chrome.storage.session.remove(mapKey(tabId)));

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  console.log('[SafePaste] installed:', reason);
  if (reason === chrome.runtime.OnInstalledReason.INSTALL) {
    await chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/onboarding.html') });
  }
});


const handlers = {
  async detect({ text }) {
    return detect(text, await getSettings());
  },

  async status() {
    return status(await getSettings());
  },

  async stats() {
    return getStats();
  },

  async getMap(_, sender) {
    const key = mapKey(sender.tab.id);
    const { [key]: map } = await chrome.storage.session.get(key);
    return map ?? { values: {}, counters: {} };
  },

  async saveMap({ map, counts }, sender) {
    await chrome.storage.session.set({ [mapKey(sender.tab.id)]: map });
    if (counts) await recordPaste(counts);
    return { ok: true };
  },

  async warmup() {
    const settings = await getSettings();
    if (settings.enabled) warmUp(settings).catch(() => {});
    return { ok: true };
  },
};


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = handlers[message?.type];
  if (!handler) return false;
  handler(message, sender)
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err.message }));
  return true;
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== 'pull') return;
  let open = true;
  port.onDisconnect.addListener(() => (open = false));
  (async () => {
    try {
      await pull(await getSettings(), (event) => open && port.postMessage(event));
      if (open) port.postMessage({ done: true });
    } catch (err) {
      if (open) port.postMessage({ error: err.message });
    }
  })();
});
