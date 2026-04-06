// import axios from "axios";

// const JUDGE0_BASE_URL =
//   process.env.JUDGE0_BASE_URL || "https://ce.judge0.com";

// const JUDGE0_AUTH_TOKEN = process.env.JUDGE0_AUTH_TOKEN || "";
// const JUDGE0_AUTH_USER = process.env.JUDGE0_AUTH_USER || "";

// /**
//  * Optional auth headers for self-hosted / protected Judge0 instances.
//  * Official Judge0 docs mention X-Auth-Token / X-Auth-User headers for auth / authorization.
//  */
// function getAuthHeaders() {
//   const headers = {};
//   if (JUDGE0_AUTH_TOKEN) headers["X-Auth-Token"] = JUDGE0_AUTH_TOKEN;
//   if (JUDGE0_AUTH_USER) headers["X-Auth-User"] = JUDGE0_AUTH_USER;
//   return headers;
// }

// const http = axios.create({
//   baseURL: JUDGE0_BASE_URL,
//   timeout: 20000,
//   headers: {
//     "Content-Type": "application/json",
//     ...getAuthHeaders(),
//   },
// });

// let languageCache = null;
// let languageCacheAt = 0;
// const LANGUAGE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// function sleep(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// function normalizeLanguageKey(language) {
//   return String(language || "").trim().toLowerCase();
// }

// function matchJudge0LanguageId(languages, language) {
//   const key = normalizeLanguageKey(language);

//   const candidates = {
//     javascript: ["javascript", "js", "node"],
//     python: ["python", "py"],
//     cpp: ["c++", "cpp"],
//     "c++": ["c++", "cpp"],
//     java: ["java"],
//   };

//   const aliases = candidates[key] || [key];

//   for (const alias of aliases) {
//     const found = languages.find((l) => {
//       const name = String(l.name || "").toLowerCase();
//       const sourceFile = String(l.source_file || "").toLowerCase();
//       return name.includes(alias) || sourceFile.includes(alias);
//     });
//     if (found) return found.id;
//   }

//   return null;
// }

// async function getLanguages() {
//   const now = Date.now();

//   if (languageCache && now - languageCacheAt < LANGUAGE_CACHE_TTL) {
//     return languageCache;
//   }

//   const { data } = await http.get("/languages/");
//   if (!Array.isArray(data)) {
//     throw new Error("Judge0 /languages endpoint returned an invalid response");
//   }

//   languageCache = data;
//   languageCacheAt = now;
//   return data;
// }

// async function createSubmission({ sourceCode, languageId, stdin, timeLimit }) {
//   const cpuTimeLimitSeconds =
//     timeLimit && Number.isFinite(Number(timeLimit))
//       ? Math.max(1, Math.ceil(Number(timeLimit) / 1000))
//       : 2;

//   const payload = {
//     source_code: sourceCode,
//     language_id: languageId,
//     stdin: stdin ?? "",
//     cpu_time_limit: cpuTimeLimitSeconds,
//   };

//   const { data } = await http.post(
//     "/submissions/?base64_encoded=false&wait=false",
//     payload
//   );

//   if (!data || !data.token) {
//     throw new Error("Judge0 did not return a submission token");
//   }

//   return data.token;
// }

// async function getSubmissionResult(token) {
//   const { data } = await http.get(
//     `/submissions/${token}?base64_encoded=false&fields=stdout,stderr,compile_output,message,status_id,status,language_id,time,memory`
//   );

//   return data;
// }

// function isTerminalStatus(statusId) {
//   // Judge0 common non-terminal statuses: 1 (In Queue), 2 (Processing)
//   return statusId !== 1 && statusId !== 2;
// }

// function buildNormalizedResult(submission) {
//   const stdout = submission?.stdout ?? "";
//   const stderr =
//     submission?.stderr ??
//     submission?.compile_output ??
//     submission?.message ??
//     "";

//   const timeValue = submission?.time;
//   const millis =
//     timeValue === null || timeValue === undefined || timeValue === ""
//       ? null
//       : Math.round(Number(timeValue) * 1000);

//   return {
//     run: {
//       stdout: stdout ?? "",
//       stderr: stderr ?? "",
//       output: stdout ?? stderr ?? "",
//       millis,
//     },
//     status: submission?.status || null,
//     raw: submission,
//   };
// }

// export async function executeCode(language, sourceCode, stdin = "", timeLimit = 2000) {
//   if (!language || !String(language).trim()) {
//     throw new Error("Language is required");
//   }

//   if (sourceCode == null || String(sourceCode).trim() === "") {
//     throw new Error("Source code is required");
//   }

//   const languages = await getLanguages();
//   const languageId = matchJudge0LanguageId(languages, language);

//   if (!languageId) {
//     const available = languages
//       .slice(0, 10)
//       .map((l) => l.name)
//       .join(", ");
//     throw new Error(
//       `Unsupported language "${language}". Judge0 language not found. ${available ? `Some available languages: ${available}` : ""}`
//     );
//   }

//   const token = await createSubmission({
//     sourceCode: String(sourceCode),
//     languageId,
//     stdin: stdin == null ? "" : String(stdin),
//     timeLimit,
//   });

//   const maxAttempts = 40;
//   const delayMs = 500;

//   for (let attempt = 0; attempt < maxAttempts; attempt++) {
//     const submission = await getSubmissionResult(token);
//     const statusId = submission?.status_id ?? submission?.status?.id;

//     if (isTerminalStatus(statusId)) {
//       return buildNormalizedResult(submission);
//     }

//     await sleep(delayMs);
//   }

//   throw new Error("Judge0 timed out while waiting for the result");
// }

// export async function getAvailableLanguages() {
//   return getLanguages();
// }








































































































import axios from "axios";

const JUDGE0_BASE_URL = process.env.JUDGE0_BASE_URL || "https://ce.judge0.com";

const http = axios.create({
  baseURL: JUDGE0_BASE_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

let languageCache = null;
let languageCacheAt = 0;
const CACHE_TTL = 10 * 60 * 1000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getLanguages() {
  const now = Date.now();
  if (languageCache && now - languageCacheAt < CACHE_TTL) return languageCache;

  const { data } = await http.get("/languages/");
  languageCache = data;
  languageCacheAt = now;
  return data;
}

function pickLanguageId(languages, language) {
  const key = String(language || "").toLowerCase();

  const aliases = {
    javascript: ["javascript", "js", "node"],
    python: ["python", "py"],
    cpp: ["c++", "cpp"],
    "c++": ["c++", "cpp"],
    java: ["java"],
  }[key] || [key];

  for (const alias of aliases) {
    const found = languages.find((l) => {
      const name = String(l.name || "").toLowerCase();
      const source = String(l.source_file || "").toLowerCase();
      return name.includes(alias) || source.includes(alias);
    });
    if (found) return found.id;
  }

  return null;
}

export async function executeCode(language, sourceCode, stdin = "", timeLimit = 2000) {
  const languages = await getLanguages();
  const languageId = pickLanguageId(languages, language);

  if (!languageId) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const createRes = await http.post(
    "/submissions/?base64_encoded=false&wait=false",
    {
      source_code: sourceCode,
      language_id: languageId,
      stdin: stdin || "",
      cpu_time_limit: Math.max(1, Math.ceil(timeLimit / 1000)),
    }
  );

  const token = createRes.data?.token;
  if (!token) throw new Error("Judge0 did not return a token");

  for (let i = 0; i < 40; i++) {
    const resultRes = await http.get(
      `/submissions/${token}?base64_encoded=false&fields=stdout,stderr,compile_output,message,status_id,status,time,memory`
    );

    const r = resultRes.data;
    const statusId = r?.status_id ?? r?.status?.id;

    if (statusId !== 1 && statusId !== 2) {
      return {
        run: {
          stdout: r?.stdout ?? "",
          stderr: r?.stderr ?? r?.compile_output ?? r?.message ?? "",
          output: r?.stdout ?? r?.stderr ?? r?.compile_output ?? r?.message ?? "",
          millis: r?.time != null ? Math.round(Number(r.time) * 1000) : null,
        },
      };
    }

    await sleep(500);
  }

  throw new Error("Judge0 timed out");
}