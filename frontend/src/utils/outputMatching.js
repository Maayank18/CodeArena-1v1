export const sanitizeOutput = (raw) => {
  if (raw == null) return '';
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
  if (Array.isArray(raw)) return sanitizeOutput(raw.join('\n'));

  const str = typeof raw === 'string' ? raw : JSON.stringify(raw);

  return str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n+$/, '')
    .trim();
};

export const normalizeForComparison = (raw) => {
  const sanitized = sanitizeOutput(raw);
  if (!sanitized) return '';
  return sanitized.split(/\s+/).filter(Boolean).join(' ');
};

export const outputsMatch = (actual, expected) =>
  normalizeForComparison(actual) === normalizeForComparison(expected);
