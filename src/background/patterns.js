const SECRET_KEY = String.raw`(?:[a-z0-9]+[_-])*(?:password|passwd|pwd|pass|secret|token|api[_-]?key|auth[_-]?key|access[_-]?key|private[_-]?key|dsn)(?:[_-][a-z0-9]+)*`;
const SECRET_VALUE = String.raw`(?=[^\s"']*[\d!@#$%^&*/+=~-])[^\s"',;]{6,}`;

export const PATTERNS = [
  ['SECRET', /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]+?-----END [A-Z ]*PRIVATE KEY-----/g],
  ['SECRET', new RegExp(String.raw`(?<=\b${SECRET_KEY}["']?\s*(?:[:=]|=>|,)\s*["']?)${SECRET_VALUE}`, 'gi')],
  ['SECRET', new RegExp(String.raw`(?<=\b(?:password|passcode|pin)\s+(?:is|to)\s+)${SECRET_VALUE}`, 'gi')],
  ['SECRET', /\bhttps:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/]+/g],
  ['SECRET', /\bhttps:\/\/(?:ptb\.|canary\.)?discord(?:app)?\.com\/api\/webhooks\/[\w/-]+/g],
  ['SECRET', /\b[a-z][a-z0-9+.-]*:\/\/[^\s:/@]+(?::[^\s/@]*)?@[^\s/"']+[^\s"']*/gi],
  ['SECRET', /(?<=\bBearer\s+)[A-Za-z0-9._~+/-]{20,}=*/g],
  ['SECRET', /(?<=\b(?:session|sessionid|sid|phpsessid|laravel_session)=)[A-Za-z0-9%._-]{8,}/gi],
  ['SECRET', /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{8,}\b/g],
  ['SECRET', /\bsk-[A-Za-z0-9_-]{20,}\b/g],
  ['SECRET', /\bAKIA[0-9A-Z]{16}\b/g],
  ['SECRET', /\bgh[pousr]_[A-Za-z0-9]{30,}\b/g],
  ['SECRET', /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g],
  ['SECRET', /\bAIza[0-9A-Za-z_-]{35}\b/g],
  ['SECRET', /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g],

  ['EMAIL', /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi],

  ['ACCOUNT', /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){3,7}(?: ?[A-Z0-9]{1,3})?\b/g],
  ['ACCOUNT', /\b(?:\d{4}[ -]?){3}\d{4}\b/g],
  ['ACCOUNT', /(?<=\bsort code(?: is)?:?\s*)\d{2}-\d{2}-\d{2}\b/gi],
  ['ACCOUNT', /(?<=\b(?:account|acct)(?: number| no\.?)?(?: is)?:?\s*)\d{6,12}\b/gi],
  ['ACCOUNT', /(?<=\b(?:member|customer|client|user) (?:id|number|no\.?)(?: is)?:?\s*)[A-Z0-9-]{4,}\b/gi],

  ['PHONE', /(?<![\w+])\+?\d[\d ().-]{8,}\d(?!\w)/g],

  ['AMOUNT', /[£$€]\s?\d[\d,]*(?:\.\d{1,2})?(?:\s?(?:k|m|bn)\b)?/gi],
  ['AMOUNT', /\b\d{1,3}(?:[ .,\u00a0\u202f]\d{3})*(?:[.,]\d{1,2})?\s?[£€](?!\w)/g],
  ['AMOUNT', /\b(?:EUR|GBP|USD|AUD|CAD)\s?\d[\d,]*(?:\.\d{1,2})?\b|\b\d[\d,]*(?:\.\d{1,2})?\s?(?:EUR|GBP|USD|AUD|CAD)\b/g],

  ['URL', /\b(?:\d{1,3}\.){3}\d{1,3}\b/g],
  ['URL', /\b(?:[a-z0-9-]+\.)+(?:internal|local|lan|corp|intranet)\b/gi],
  ['URL', /\b(?:staging|stage|dev|uat|qa|preprod|test)\.[a-z0-9-]+(?:\.[a-z0-9-]+)*\.[a-z]{2,}\b/gi],

  ['ADDRESS', /\b[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}\b/g],
];
