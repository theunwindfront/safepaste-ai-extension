import { $, bindSwitch, loadSettings, saveSettings } from '../shared/pages.js';
const { setupDone } = await chrome.storage.local.get('setupDone');
if (!setupDone) {
  const { state } = await chrome.runtime.sendMessage({ type: 'status' });
  if (state === 'ready') {
    await chrome.storage.local.set({ setupDone: true });
  } else {
    await chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/onboarding.html') });
    window.close();
  }
}


const STATUS = {
  ready: (s) => ['Local AI ready', `${s.model} via Ollama`],
  'no-model': (s) => ['AI model not downloaded', `Run: ollama pull ${s.model}`],
  blocked: () => ['Ollama blocked SafePaste', 'Add this extension to OLLAMA_ORIGINS'],
  offline: () => ['Ollama is not running', 'Only common patterns are checked'],
};

const settings = await loadSettings();
bindSwitch($('#enabled'), settings.enabled, (on) => saveSettings({ enabled: on }));

const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
const host = tab?.url ? new URL(tab.url).hostname : '';
const site = SP.SITES.find((s) => s.host === host);

if (site) {
  $('#site-name').textContent = site.name;
  bindSwitch($('#site'), !settings.disabledSites.includes(host), async (on) => {
    const { disabledSites } = await loadSettings();
    await saveSettings({ disabledSites: on ? disabledSites.filter((h) => h !== host) : [...disabledSites, host] });
  });
} else {
  $('#site-row').hidden = true;
}

$('#settings').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

const stats = await chrome.runtime.sendMessage({ type: 'stats' });
$('#items').textContent = stats.items;

const status = await chrome.runtime.sendMessage({ type: 'status' });
const [title, sub] = (STATUS[status.state] ?? STATUS.offline)(status);
$('#status').classList.toggle('bad', status.state !== 'ready');
$('#status-title').textContent = title;
$('#status-sub').textContent = sub;

$('#status').addEventListener('click', () => {
  if (status.state !== 'ready') chrome.tabs.create({ url: chrome.runtime.getURL('onboarding/onboarding.html') });
});
