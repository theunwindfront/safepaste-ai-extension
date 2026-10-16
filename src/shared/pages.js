export const $ = (selector) => document.querySelector(selector);

export async function loadSettings() {
  const { settings } = await chrome.storage.local.get('settings');
  return { ...SP.DEFAULT_SETTINGS, ...settings };
}

export async function saveSettings(patch) {
  const settings = { ...(await loadSettings()), ...patch };
  await chrome.storage.local.set({ settings });
  return settings;
}

export function bindSwitch(el, on, onChange) {
  el.setAttribute('aria-checked', String(on));
  el.addEventListener('click', async () => {
    const next = el.getAttribute('aria-checked') !== 'true';
    el.setAttribute('aria-checked', String(next));
    await onChange(next);
  });
}

export function h(tag, className = '', ...children) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false));
  return el;
}
