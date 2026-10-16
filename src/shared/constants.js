globalThis.SP = {
  TYPES: {
    PERSON: { label: 'Person' },
    COMPANY: { label: 'Company' },
    PROJECT: { label: 'Project' },
    EMAIL: { label: 'Email' },
    PHONE: { label: 'Phone' },
    ADDRESS: { label: 'Address' },
    URL: { label: 'URL' },
    AMOUNT: { label: 'Amount' },
    ACCOUNT: { label: 'Account' },
    SECRET: { label: 'Secret' },
  },

  SITES: [
    { host: 'chatgpt.com', name: 'ChatGPT' },
    { host: 'claude.ai', name: 'Claude' },
    { host: 'gemini.google.com', name: 'Gemini' },
  ],

  DEFAULT_SETTINGS: {
    enabled: true,
    preview: true,
    restore: true,
    ollamaUrl: 'http://localhost:11434',
    model: 'qwen2.5:3b',
    alwaysHide: [],
    neverHide: ['@channel', '@here', '@everyone', 'WordPress', 'Laravel', 'localhost', 'example.com'],
    disabledSites: [],
  },
};

SP.PLACEHOLDER_RE = new RegExp(`\\b(${Object.keys(SP.TYPES).join('|')})_(\\d+)\\b`, 'g');
