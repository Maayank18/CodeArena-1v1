import axios from 'axios';

const JUDGE0_BASE_URL = process.env.JUDGE0_BASE_URL || 'https://ce.judge0.com';
const JUDGE0_AUTH_TOKEN = process.env.JUDGE0_AUTH_TOKEN || '';
const JUDGE0_AUTH_USER = process.env.JUDGE0_AUTH_USER || '';
const LANGUAGE_CACHE_TTL = 10 * 60 * 1000;
const POLL_DELAY_MS = 500;
const MAX_POLL_ATTEMPTS = 40;

const LANGUAGE_ALIASES = {
  javascript: ['javascript', 'node.js', 'node', 'js'],
  js: ['javascript', 'node.js', 'node', 'js'],
  node: ['javascript', 'node.js', 'node', 'js'],
  python: ['python', 'python3', 'py'],
  py: ['python', 'python3', 'py'],
  python3: ['python', 'python3', 'py'],
  cpp: ['c++', 'cpp', 'g++'],
  'c++': ['c++', 'cpp', 'g++'],
  java: ['java'],
};

const TERMINAL_STATUS_IDS = new Set([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);

const http = axios.create({
  baseURL: JUDGE0_BASE_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    ...(JUDGE0_AUTH_TOKEN ? { 'X-Auth-Token': JUDGE0_AUTH_TOKEN } : {}),
    ...(JUDGE0_AUTH_USER ? { 'X-Auth-User': JUDGE0_AUTH_USER } : {}),
  },
});

let languageCache = null;
let languageCacheAt = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizeLanguageKey = (language) => String(language || '').trim().toLowerCase();

const normalizeAxiosError = (error, fallbackMessage) => {
  const responseMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.response?.data?.stderr;

  if (responseMessage) {
    return new Error(String(responseMessage).trim());
  }

  if (error?.code === 'ECONNABORTED') {
    return new Error('Execution service timed out while communicating with Judge0.');
  }

  if (error?.message) {
    return new Error(`${fallbackMessage}: ${error.message}`);
  }

  return new Error(fallbackMessage);
};

const pickLanguageId = (languages, language) => {
  const key = normalizeLanguageKey(language);
  const aliases = LANGUAGE_ALIASES[key] || [key];

  for (const alias of aliases) {
    const matched = languages.find((item) => {
      const name = String(item?.name || '').toLowerCase();
      const sourceFile = String(item?.source_file || '').toLowerCase();
      return name.includes(alias) || sourceFile.includes(alias);
    });

    if (matched?.id) {
      return matched.id;
    }
  }

  return null;
};

const getLanguages = async () => {
  const now = Date.now();
  if (languageCache && now - languageCacheAt < LANGUAGE_CACHE_TTL) {
    return languageCache;
  }

  try {
    const { data } = await http.get('/languages/');
    if (!Array.isArray(data)) {
      throw new Error('Judge0 /languages returned an invalid response.');
    }

    languageCache = data;
    languageCacheAt = now;
    return data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Failed to load Judge0 language catalog');
  }
};

const classifyVerdict = (submission) => {
  const statusId = submission?.status_id ?? submission?.status?.id;
  const description = String(submission?.status?.description || '').toLowerCase();

  if (statusId === 3 || description.includes('accepted')) return 'accepted';
  if (statusId === 4 || description.includes('wrong answer')) return 'wrong_answer';
  if (statusId === 5 || description.includes('time limit')) return 'tle';
  if (statusId === 6 || description.includes('compile')) return 'compile_error';
  if ([7, 8, 9, 10, 11, 12].includes(statusId) || description.includes('runtime')) {
    return 'runtime_error';
  }
  if ([13, 14].includes(statusId) || description.includes('internal')) {
    return 'internal_error';
  }

  return 'unknown';
};

const buildErrorMessage = (submission, verdict) => {
  const compileOutput = submission?.compile_output ?? '';
  const stderr = submission?.stderr ?? '';
  const message = submission?.message ?? '';
  const statusText = submission?.status?.description || 'Execution Error';
  const detail = compileOutput || stderr || message || '';

  if (verdict === 'accepted' || verdict === 'wrong_answer') {
    return detail ? String(detail).trim() : '';
  }

  if (!detail) {
    if (verdict === 'tle') return 'Time Limit Exceeded';
    return statusText;
  }

  return String(detail).trim();
};

const buildNormalizedResult = (submission) => {
  const verdict = classifyVerdict(submission);
  const stdout = submission?.stdout ?? '';
  const stderr = buildErrorMessage(submission, verdict);
  const timeValue = submission?.time;
  const millis =
    timeValue === null || timeValue === undefined || timeValue === ''
      ? null
      : Math.round(Number(timeValue) * 1000);

  return {
    run: {
      stdout,
      stderr,
      compileOutput: submission?.compile_output ?? '',
      message: submission?.message ?? '',
      output: stdout || stderr,
      millis,
      memoryKb: submission?.memory ?? null,
      exitCode: submission?.exit_code ?? null,
    },
    status: submission?.status || null,
    verdict,
    errorMessage: stderr,
    raw: submission,
  };
};

const createSubmission = async ({ sourceCode, languageId, stdin, timeLimit }) => {
  const cpuTimeLimitSeconds =
    timeLimit && Number.isFinite(Number(timeLimit))
      ? Math.max(1, Math.ceil(Number(timeLimit) / 1000))
      : 2;

  try {
    const { data } = await http.post('/submissions/?base64_encoded=false&wait=false', {
      source_code: String(sourceCode),
      language_id: languageId,
      stdin: stdin == null ? '' : String(stdin),
      cpu_time_limit: cpuTimeLimitSeconds,
      wall_time_limit: cpuTimeLimitSeconds + 1,
    });

    if (!data?.token) {
      throw new Error('Judge0 did not return a submission token.');
    }

    return data.token;
  } catch (error) {
    throw normalizeAxiosError(error, 'Failed to create Judge0 submission');
  }
};

const getSubmissionResult = async (token) => {
  try {
    const { data } = await http.get(
      `/submissions/${token}?base64_encoded=false&fields=stdout,stderr,compile_output,message,status_id,status,time,memory,exit_code`
    );

    return data;
  } catch (error) {
    throw normalizeAxiosError(error, 'Failed to fetch Judge0 submission result');
  }
};

export async function executeCode(language, sourceCode, stdin = '', timeLimit = 2000) {
  if (!normalizeLanguageKey(language)) {
    throw new Error('Language is required.');
  }

  if (sourceCode == null || String(sourceCode).trim() === '') {
    throw new Error('Source code is required.');
  }

  const languages = await getLanguages();
  const languageId = pickLanguageId(languages, language);

  if (!languageId) {
    const availableLanguages = languages.slice(0, 12).map((item) => item?.name).filter(Boolean);
    throw new Error(
      `Unsupported language "${language}".${availableLanguages.length ? ` Available examples: ${availableLanguages.join(', ')}` : ''}`
    );
  }

  const token = await createSubmission({
    sourceCode,
    languageId,
    stdin,
    timeLimit,
  });

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    const submission = await getSubmissionResult(token);
    const statusId = submission?.status_id ?? submission?.status?.id;

    if (TERMINAL_STATUS_IDS.has(statusId)) {
      return buildNormalizedResult(submission);
    }

    await sleep(POLL_DELAY_MS);
  }

  throw new Error('Judge0 timed out while waiting for the execution result.');
}

export async function getAvailableLanguages() {
  return getLanguages();
}
