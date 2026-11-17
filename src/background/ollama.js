export class OllamaError extends Error {
  constructor(state, message) {
    super(message);
    this.state = state;
  }
}

async function request(baseUrl, path, init = {}) {
  let res;
  try {
    res = await fetch(new URL(path, baseUrl), init);
  } catch {
    throw new OllamaError('offline', 'Ollama is not running');
  }
  if (res.status === 403) throw new OllamaError('blocked', 'Ollama blocked the request from the extension');
  if (!res.ok) throw new OllamaError('error', `Ollama returned HTTP ${res.status}`);
  return res;
}

export async function status({ ollamaUrl, model }) {
  try {
    const res = await request(ollamaUrl, '/api/tags', { signal: AbortSignal.timeout(4000) });
    const { models = [] } = await res.json();
    const names = models.map((m) => m.name);
    return { state: names.includes(model) ? 'ready' : 'no-model', model, models: names };
  } catch (err) {
    return { state: err.state ?? 'offline', error: err.message, model };
  }
}

export async function chatJson({ ollamaUrl, model }, messages, schema) {
  const res = await request(ollamaUrl, '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(60_000),
    body: JSON.stringify({
      model,
      messages,
      format: schema,
      stream: false,
      keep_alive: '30m',
      options: { temperature: 0, num_ctx: 4096, num_predict: 1024 },
    }),
  });
  const body = await res.json();
  if (body.done_reason === 'length') throw new OllamaError('error', 'The model ran out of room before finishing');
  try {
    return JSON.parse(body.message?.content ?? '{}');
  } catch {
    throw new OllamaError('error', 'The model returned invalid JSON');
  }
}

export async function pull({ ollamaUrl, model }, onProgress) {
  const res = await request(ollamaUrl, '/api/pull', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, stream: true }),
  });
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line);
      if (event.error) throw new OllamaError('error', event.error);
      onProgress(event);
    }
  }
}

export async function warmUp({ ollamaUrl, model }) {
  await request(ollamaUrl, '/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages: [], keep_alive: '30m' }),
  });
}
