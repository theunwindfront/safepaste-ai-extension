SP.redact = (text, spans, map) => {
  const next = { values: { ...map.values }, counters: { ...map.counters } };
  const byValue = new Map(Object.entries(next.values).map(([ph, { value }]) => [value, ph]));
  const counts = {};
  let out = '';
  let pos = 0;

  for (const span of [...spans].sort((a, b) => a.start - b.start)) {
    let ph = byValue.get(span.text);
    if (!ph) {
      next.counters[span.type] = (next.counters[span.type] ?? 0) + 1;
      ph = `${span.type}_${next.counters[span.type]}`;
      next.values[ph] = { value: span.text, type: span.type };
      byValue.set(span.text, ph);
    }
    counts[span.type] = (counts[span.type] ?? 0) + 1;
    out += text.slice(pos, span.start) + ph;
    pos = span.end;
  }

  return { text: out + text.slice(pos), map: next, counts };
};

SP.restore = (text, map) => text.replace(SP.PLACEHOLDER_RE, (ph) => map.values[ph]?.value ?? ph);
