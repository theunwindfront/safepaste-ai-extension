(() => {
  if (!chrome.runtime?.id) return;

  const EDITABLE = 'textarea, input[type="text"], input:not([type]), [contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"]';

  const send = (message) => chrome.runtime.sendMessage(message);

  const host = location.hostname;
  let settings = SP.DEFAULT_SETTINGS;
  const active = () => settings.enabled && !settings.disabledSites.includes(host);

  async function loadSettings() {
    const { settings: saved } = await chrome.storage.local.get('settings');
    settings = { ...SP.DEFAULT_SETTINGS, ...saved };
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes.settings) return;
    settings = { ...SP.DEFAULT_SETTINGS, ...changes.settings.newValue };
    SP.restorer.setEnabled(settings.restore);
  });

  function editableFrom(target) {
    const el = target instanceof Element ? target : target?.parentElement;
    return el?.closest(EDITABLE) ?? null;
  }

  function saveSelection(el) {
    if (!el.isContentEditable) return { start: el.selectionStart, end: el.selectionEnd };
    const selection = getSelection();
    return selection.rangeCount ? selection.getRangeAt(0).cloneRange() : null;
  }

  function restoreSelection(el, saved) {
    el.focus();
    if (!saved) return;
    if (saved instanceof Range) {
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(saved);
    } else {
      el.setSelectionRange(saved.start, saved.end);
    }
  }

  function insert(el, saved, text) {
    restoreSelection(el, saved);

    if (el.isContentEditable) {
      const data = new DataTransfer();
      data.setData('text/plain', text);
      const event = new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true });
      el.dispatchEvent(event);
      if (event.defaultPrevented) return;
    }

    if (document.execCommand('insertText', false, text)) return;
    if (!el.isContentEditable) {
      el.setRangeText(text, el.selectionStart, el.selectionEnd, 'end');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  async function onPaste(e) {
    if (!e.isTrusted || !chrome.runtime?.id || !active()) return;
    const el = editableFrom(e.target);
    const text = e.clipboardData?.getData('text/plain');
    if (!el || !text?.trim()) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    const saved = saveSelection(el);

    const hideChecking = await SP.ui.checking(el);
    const result = await send({ type: 'detect', text }).catch((err) => ({ error: err.message }));
    hideChecking();

    if (!result || result.error) {
      SP.ui.toast(el, 'SafePaste could not check this paste, so nothing was pasted.', 'warn');
      return;
    }

    if (!result.spans.length) {
      insert(el, saved, text);
      if (result.ai.state === 'ok') SP.ui.toast(el, 'No private details found');
      else SP.ui.toast(el, 'Local AI is unavailable. Only common patterns were checked.', 'warn');
      return;
    }

    const map = await send({ type: 'getMap' });
    const choice = settings.preview
      ? await SP.ui.preview({ anchor: el, text, spans: result.spans, map, ai: result.ai, ms: result.ms })
      : { action: 'protect', spans: result.spans };

    if (choice.action === 'cancel') return restoreSelection(el, saved);
    if (choice.action === 'original') return insert(el, saved, text);

    const redacted = SP.redact(text, choice.spans, map);
    if (choice.spans.length) {
      await send({ type: 'saveMap', map: redacted.map, counts: redacted.counts });
      SP.restorer.update(redacted.map);
    }
    insert(el, saved, redacted.text);
    if (!settings.preview) SP.ui.toast(el, `${choice.spans.length} private item${choice.spans.length === 1 ? '' : 's'} hidden`);
  }

  async function init() {
    if (!chrome.runtime?.id) return;
    await loadSettings();
    if (active()) send({ type: 'warmup' });
    SP.restorer.setEnabled(settings.restore);
    SP.restorer.update(await send({ type: 'getMap' }));
  }

  addEventListener('paste', onPaste, true);
  init();
})();
