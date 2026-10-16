(() => {
  const SKIP = 'textarea, input, [contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"], script, style, noscript';
  const HAS_PLACEHOLDER = new RegExp(SP.PLACEHOLDER_RE.source);
  const highlight = new Highlight();
  const pending = new Set();
  let map = { values: {} };
  let observer = null;
  let scheduled = false;
  let enabled = true;

  function injectStyle() {
    const style = document.createElement('style');
    style.textContent = `::highlight(safepaste-restored) {
      background-color: rgb(13 107 91 / 0.12);
      text-decoration: underline dotted rgb(13 107 91);
      text-underline-offset: 3px;
    }`;
    document.head.append(style);
    CSS.highlights.set('safepaste-restored', highlight);
  }

  function restoreNode(node) {
    if (!node.parentElement || node.parentElement.closest(SKIP) || !HAS_PLACEHOLDER.test(node.data)) return;
    const data = node.data;
    const marks = [];
    let out = '';
    let pos = 0;

    for (const match of data.matchAll(SP.PLACEHOLDER_RE)) {
      const entry = map.values[match[0]];
      if (!entry) continue;
      out += data.slice(pos, match.index);
      marks.push([out.length, out.length + entry.value.length]);
      out += entry.value;
      pos = match.index + match[0].length;
    }
    if (!marks.length) return;

    node.data = out + data.slice(pos);
    for (const [start, end] of marks) {
      const range = new Range();
      range.setStart(node, start);
      range.setEnd(node, end);
      highlight.add(range);
    }
  }

  function scan(root) {
    if (root.nodeType === Node.TEXT_NODE) return restoreNode(root);
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) restoreNode(node);
  }

  function flush() {
    scheduled = false;
    for (const range of highlight) if (!range.startContainer.isConnected) highlight.delete(range);
    const roots = [...pending];
    pending.clear();
    for (const root of roots) if (root.isConnected) scan(root);
  }

  function queue(node) {
    pending.add(node);
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(flush);
  }

  function start() {
    if (observer) return queue(document.body);
    injectStyle();
    observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'characterData') queue(m.target);
        else m.addedNodes.forEach(queue);
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    queue(document.body);
  }

  function stop() {
    observer?.disconnect();
    observer = null;
    highlight.clear();
  }

  function refresh() {
    if (enabled && Object.keys(map.values).length) start();
    else stop();
  }

  SP.restorer = {
    update(nextMap) {
      map = nextMap;
      refresh();
    },
    setEnabled(on) {
      enabled = on;
      refresh();
    },
  };
})();
