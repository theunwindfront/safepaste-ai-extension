import '../shared/constants.js';
import { chatJson } from './ollama.js';
import { PATTERNS } from './patterns.js';

const TYPES = Object.keys(SP.TYPES);
const CHUNK_SIZE = 2500;
const TITLES = new Set(['Mr', 'Mrs', 'Ms', 'Miss', 'Dr', 'Prof', 'Sir']);

const PROMPT = `You are a privacy filter. Find every private detail in the user's text so it can be hidden before the text is sent to an online AI service. Missing a private detail is much worse than returning an extra one.

Types:
- PERSON: every name of a person, including first names on their own and names in greetings, sign-offs, lists, chat logs and code comments
- COMPANY: clients, companies, agencies, shops, councils, organisations and their brands
- PROJECT: internal project and code names
- EMAIL: email addresses
- PHONE: phone numbers
- ADDRESS: a full street address with its postcode, as one item
- URL: private, client, staging or internal domains, hostnames and IP addresses
- AMOUNT: money: prices, budgets, salaries, fees, rates and totals
- ACCOUNT: bank, card, IBAN, sort code, customer, member, invoice and order numbers, usernames
- SECRET: passwords, API keys, tokens, private keys and connection strings

Never return:
- well-known public products, platforms and companies (WordPress, React, Stripe, Google, Heroku)
- dates, days, months, job titles, cities or countries on their own, chat mentions (@channel, @here) or generic words

Copy each item exactly as it appears in the text. Read the whole text to the end before answering. If nothing is private, return an empty list.`;

const EXAMPLE_IN = `Hi Sam, @here Lunar Bakery approved the £3.2k budget for Project Comet. Their shop runs on Shopify. Ping Ana or Joe with questions, or call 07123 456789. Cheers, Mo`;

const EXAMPLE_OUT = JSON.stringify({
  entities: [
    { text: 'Sam', type: 'PERSON' },
    { text: 'Lunar Bakery', type: 'COMPANY' },
    { text: '£3.2k', type: 'AMOUNT' },
    { text: 'Comet', type: 'PROJECT' },
    { text: 'Ana', type: 'PERSON' },
    { text: 'Joe', type: 'PERSON' },
    { text: '07123 456789', type: 'PHONE' },
    { text: 'Mo', type: 'PERSON' },
  ],
});


const SCHEMA = {
  type: 'object',
  properties: {
    entities: {
      type: 'array',
      items: {
        type: 'object',
        properties: { text: { type: 'string' }, type: { type: 'string', enum: TYPES } },
        required: ['text', 'type'],
      },
    },
  },
  required: ['entities'],
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function findAll(text, value, type, source, flags = 'g') {
  const re = new RegExp(`(?<!\\w)${escapeRe(value)}(?!\\w)`, flags);
  return [...text.matchAll(re)].map((m) => ({ start: m.index, end: m.index + m[0].length, text: m[0], type, source }));
}

function patternSpans(text) {
  return PATTERNS.flatMap(([type, re]) =>
    [...text.matchAll(re)]
      .filter((m) => type !== 'PHONE' || m[0].replace(/\D/g, '').length >= 10)
      .map((m) => ({ start: m.index, end: m.index + m[0].length, text: m[0], type, source: 'pattern' })),
  );
}

function listSpans(text, alwaysHide) {
  return alwaysHide.flatMap(({ text: value, type }) => findAll(text, value, type, 'list', 'gi'));
}

function chunk(text) {
  const parts = [];
  let current = '';
  for (const para of text.split(/(?<=\n\n)/)) {
    if (current && current.length + para.length > CHUNK_SIZE) {
      parts.push(current);
      current = '';
    }
    current += para;
  }
  if (current) parts.push(current);
  return parts;
}

async function aiSpans(text, settings) {
  const found = new Map();

  for (const part of chunk(text)) {
    const input = part.trim();
    if (!input) continue;

    const { entities = [] } = await chatJson(
      settings,
      [
        { role: 'system', content: PROMPT },
        { role: 'user', content: EXAMPLE_IN },
        { role: 'assistant', content: EXAMPLE_OUT },
        { role: 'user', content: input },
      ],
      SCHEMA,
    );

    for (const { text: value, type } of entities) {
      const clean = value?.trim();
      if (clean && clean.length > 1 && TYPES.includes(type) && text.includes(clean)) found.set(clean, type);
    }
  }

  for (const [value, type] of [...found]) {
    if (type !== 'PERSON') continue;
    for (const part of value.split(/\s+/)) {
      const name = part.replace(/\.$/, '');
      if (!found.has(name) && !TITLES.has(name) && /^\p{Lu}[\p{L}'’-]{2,}$/u.test(name)) found.set(name, 'PERSON');
    }
  }

  return [...found].flatMap(([value, type]) => findAll(text, value, type, 'ai'));
}

function resolveOverlaps(spans) {
  const sorted = [...spans].sort((a, b) => a.start - b.start || b.end - a.end);
  const result = [];
  for (const span of sorted) {
    if (!result.length || span.start >= result.at(-1).end) result.push(span);
  }
  return result;
}

export async function detect(text, settings) {
  const started = performance.now();
  const spans = [...patternSpans(text), ...listSpans(text, settings.alwaysHide)];

  let ai = { state: 'ok' };
  try {
    spans.push(...(await aiSpans(text, settings)));
  } catch (err) {
    ai = { state: err.state ?? 'error', error: err.message };
  }

  const never = new Set(settings.neverHide.map((w) => w.toLowerCase()));
  const kept = spans.filter((s) => !never.has(s.text.toLowerCase()));

  return { spans: resolveOverlaps(kept), ai, ms: Math.round(performance.now() - started) };
}
