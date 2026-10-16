import { $, bindSwitch, h, loadSettings, saveSettings } from '../shared/pages.js';

let settings = await loadSettings();

bindSwitch($('#preview'), settings.preview, async (on) => (settings = await saveSettings({ preview: on })));
bindSwitch($('#restore'), settings.restore, async (on) => (settings = await saveSettings({ restore: on })));

function wordRow(text, tag, onRemove) {
  const remove = h('button', 'remove', '✕');
  remove.setAttribute('aria-label', `Remove ${text}`);
  remove.addEventListener('click', onRemove);
  return h('li', '', h('span', '', text), tag ? h('span', 'tag', tag) : null, remove);
}

async function updateWords(patch) {
  settings = await saveSettings(patch);
  renderWords();
}

function renderWords() {
  $('#always-list').replaceChildren(
    ...settings.alwaysHide.map((item, i) =>
      wordRow(item.text, SP.TYPES[item.type]?.label, () =>
        updateWords({ alwaysHide: settings.alwaysHide.filter((_, j) => j !== i) }),
      ),
    ),
  );
  $('#never-list').replaceChildren(
    ...settings.neverHide.map((word, i) =>
      wordRow(word, null, () => updateWords({ neverHide: settings.neverHide.filter((_, j) => j !== i) })),
    ),
  );
}

$('#always-type').append(...Object.entries(SP.TYPES).map(([type, { label }]) => new Option(label, type)));

$('#always-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = $('#always-text').value.trim();
  if (!text || settings.alwaysHide.some((w) => w.text.toLowerCase() === text.toLowerCase())) return;
  await updateWords({ alwaysHide: [...settings.alwaysHide, { text, type: $('#always-type').value }] });
  e.target.reset();
});

$('#never-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = $('#never-text').value.trim();
  if (!text || settings.neverHide.some((w) => w.toLowerCase() === text.toLowerCase())) return;
  await updateWords({ neverHide: [...settings.neverHide, text] });
  e.target.reset();
});

$('#sites').replaceChildren(
  ...SP.SITES.map((site) => {
    const toggle = h('button', 'switch');
    toggle.setAttribute('role', 'switch');
    toggle.setAttribute('aria-label', site.name);
    bindSwitch(toggle, !settings.disabledSites.includes(site.host), async (on) => {
      const { disabledSites } = await loadSettings();
      settings = await saveSettings({
        disabledSites: on ? disabledSites.filter((host) => host !== site.host) : [...disabledSites, site.host],
      });
    });
    return h('li', '', h('span', '', site.name, h('span', 'tag', ` ${site.host}`)), toggle);
  }),
);

const STATUS_TEXT = {
  ready: () => 'Ready',
  'no-model': () => `Not downloaded yet. Run: ollama pull ${settings.model}`,
  blocked: () => 'Ollama blocked SafePaste. Check OLLAMA_ORIGINS.',
  offline: () => 'Ollama is not running.',
};

async function checkStatus() {
  $('#model-status').textContent = 'Checking…';
  const status = await chrome.runtime.sendMessage({ type: 'status' });
  const models = [...new Set([...(status.models ?? []), settings.model])];
  $('#model').replaceChildren(...models.map((m) => new Option(m, m)));
  $('#model').value = settings.model;
  $('#model-status').textContent = (STATUS_TEXT[status.state] ?? (() => status.error))();
}

$('#ollama-url').value = settings.ollamaUrl;
$('#ollama-url').addEventListener('change', async (e) => {
  settings = await saveSettings({ ollamaUrl: e.target.value.trim() || SP.DEFAULT_SETTINGS.ollamaUrl });
  checkStatus();
});

$('#model').addEventListener('change', async (e) => {
  settings = await saveSettings({ model: e.target.value });
  checkStatus();
});

renderWords();
checkStatus();
