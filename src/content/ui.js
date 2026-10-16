(() => {
  let shadow = null;

  function h(tag, className = '', ...children) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    el.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false));
    return el;
  }

  async function root() {
    if (shadow?.host.isConnected) return shadow;
    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:2147483647;';
    shadow = host.attachShadow({ mode: 'closed' });
    const css = await fetch(chrome.runtime.getURL('content/ui.css')).then((r) => r.text());
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    shadow.adoptedStyleSheets = [sheet];
    document.documentElement.append(host);
    return shadow;
  }

  function place(el, anchor, { maxWidth = 720, minWidth = 360, gap = 12 } = {}) {
    const box = (anchor.closest('form') ?? anchor).getBoundingClientRect();
    const width = Math.min(maxWidth, Math.max(minWidth, box.width), innerWidth - 24);
    el.style.left = `${Math.min(Math.max(box.left + box.width / 2 - width / 2, 12), innerWidth - width - 12)}px`;
    el.style.width = `${width}px`;
    if (box.top > 320) {
      el.style.bottom = `${innerHeight - box.top + gap}px`;
      el.style.maxHeight = `${box.top - gap - 12}px`;
    } else {
      el.style.top = `${box.bottom + gap}px`;
      el.style.maxHeight = `${innerHeight - box.bottom - gap - 12}px`;
    }
  }

  function placePill(el, anchor) {
    const box = (anchor.closest('form') ?? anchor).getBoundingClientRect();
    el.style.left = `${Math.max(box.left, 12)}px`;
    el.style.bottom = `${innerHeight - box.top + 10}px`;
  }

  async function checking(anchor) {
    const pill = h('div', 'pill', h('span', 'spinner'), 'Checking your paste on this computer…');
    (await root()).append(pill);
    placePill(pill, anchor);
    return () => pill.remove();
  }

  async function toast(anchor, message, tone = 'ok') {
    const el = h('div', 'pill', h('span', tone === 'ok' ? 'dot' : 'dot warn'), message);
    (await root()).append(el);
    placePill(el, anchor);
    setTimeout(() => el.remove(), 2800);
  }

  function aiNote(ai, ms) {
    if (ai.state === 'ok') return [h('span', 'dot'), `Checked on this computer in ${(ms / 1000).toFixed(1)} s · nothing sent yet`];
    const reason = { offline: 'Local AI is not running', blocked: 'Ollama blocked SafePaste' }[ai.state] ?? 'Local AI failed';
    return [h('span', 'dot warn'), `${reason}, so only common patterns were checked · nothing sent yet`];
  }

  function placeholders(text) {
    const nodes = [];
    let pos = 0;
    for (const m of text.matchAll(SP.PLACEHOLDER_RE)) {
      nodes.push(text.slice(pos, m.index), h('span', 'ph', m[0]));
      pos = m.index + m[0].length;
    }
    nodes.push(text.slice(pos));
    return nodes;
  }

  async function preview({ anchor, text, spans, map, ai, ms }) {
    const shadowRoot = await root();
    const kept = new Set();
    const active = () => spans.filter((_, i) => !kept.has(i));

    const chips = h('div', 'chips');
    const body = h('div', 'body');
    const output = h('div', 'out');
    const protectBtn = h('button', 'btn btn-primary', 'Paste protected', h('span', 'kbd', '↵'));
    const originalBtn = h('button', 'btn btn-ghost', 'Paste original');
    const closeBtn = h('button', 'close', '✕');
    closeBtn.setAttribute('aria-label', 'Cancel paste');

    const popover = h(
      'section',
      'popover',
      h(
        'header',
        '',
        h(
          'div',
          '',
          h('div', 'title', `${spans.length} sensitive item${spans.length === 1 ? '' : 's'} found in your paste`),
          h('div', 'note', aiNote(ai, ms)),
        ),
        closeBtn,
      ),
      h(
        'div',
        'content',
        chips,
        body,
        h('div', 'hint', 'Click any highlight to keep it visible. The AI will see placeholders instead of the real values.'),
        h('div', 'receives', h('span', 'label', 'What the AI will receive'), output),
      ),
      h('footer', '', 'Real values come back automatically in the reply', h('div', 'actions', originalBtn, protectBtn)),
    );

    function render() {
      const counts = {};
      for (const s of active()) counts[s.type] = (counts[s.type] ?? 0) + 1;
      chips.replaceChildren(
        ...Object.entries(counts).map(([type, n]) => h('span', `chip e-${type}`, h('b', '', String(n)), SP.TYPES[type].label)),
        kept.size ? h('span', 'chip kept', h('b', '', String(kept.size)), 'Kept by you') : null,
      );

      const nodes = [];
      let pos = 0;
      spans.forEach((span, i) => {
        const btn = h('button', kept.has(i) ? 'hl kept' : `hl e-${span.type}`, span.text);
        btn.title = kept.has(i) ? 'Click to hide this again' : `${SP.TYPES[span.type].label} · click to keep it visible`;
        btn.addEventListener('click', () => {
          kept.has(i) ? kept.delete(i) : kept.add(i);
          render();
        });
        nodes.push(text.slice(pos, span.start), btn);
        pos = span.end;
      });
      nodes.push(text.slice(pos));
      body.replaceChildren(...nodes);

      output.replaceChildren(...placeholders(SP.redact(text, active(), map).text));
    }

    render();
    shadowRoot.append(popover);
    const reposition = () => place(popover, anchor);
    reposition();
    addEventListener('resize', reposition);
    protectBtn.focus();

    return new Promise((resolve) => {
      function finish(result) {
        removeEventListener('keydown', onKey, true);
        removeEventListener('resize', reposition);
        popover.remove();
        resolve(result);
      }
      function onKey(e) {
        if (e.key === 'Escape') finish({ action: 'cancel' });
        else if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) finish({ action: 'protect', spans: active() });
        else return;
        e.preventDefault();
        e.stopImmediatePropagation();
      }
      addEventListener('keydown', onKey, true);
      protectBtn.addEventListener('click', () => finish({ action: 'protect', spans: active() }));
      originalBtn.addEventListener('click', () => finish({ action: 'original' }));
      closeBtn.addEventListener('click', () => finish({ action: 'cancel' }));
    });
  }

  SP.ui = { checking, toast, preview };
})();
