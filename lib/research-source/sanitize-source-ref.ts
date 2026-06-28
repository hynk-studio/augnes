import { createHash } from "node:crypto";

export type BoundedSourceInputKindV01 =
  | "url"
  | "doi"
  | "file_ref"
  | "note_ref"
  | "manual_text_summary";

export type SanitizedSourceLocatorStatusV01 =
  | "ok"
  | "blocked_private_or_raw_payload"
  | "blocked_invalid_input";

export interface SanitizedSourceLocatorV01 {
  status: SanitizedSourceLocatorStatusV01;
  source_locator_ref: string | null;
  source_locator_display: string | null;
  source_locator_fingerprint: string | null;
  failure_codes: string[];
}

const unsafeStringPatterns = [
  /SAFE_MARKER_/i,
  /\/Users\//i,
  /\/home\//i,
  /file:\/\//i,
  /\bhttps?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[[^\]]+\])/i,
  /\bhttps?:\/\/[^/\s]*(?:private|internal|intranet|corp|\.local)\b/i,
  /\bprivate[-_ ]?url\b/i,
  /\blocal[-_ ]?private[-_ ]?path\b/i,
  /\braw[-_ ]?source[-_ ]?body\b/i,
  /\braw[-_ ]?provider[-_ ]?output\b/i,
  /\braw[-_ ]?retrieval[-_ ]?output\b/i,
  /\braw[-_ ]?conversation\b/i,
  /\bhidden[-_ ]?reasoning\b/i,
  /\braw[-_ ]?db[-_ ]?row\b/i,
  /\braw[-_ ]?diff\b/i,
  /\btelemetry[-_ ]?dump\b/i,
  /\bbrowser[-_ ]?dump\b/i,
  /\bthread_[A-Za-z0-9_-]+/i,
  /\brun_[A-Za-z0-9_-]+/i,
  /\bsession_[A-Za-z0-9_-]+/i,
  /\bprovider[-_ ]?(thread|run|session)[-_ ]?id\b/i,
  /\buploaded[-_ ]?file[-_ ]?id\b/i,
  /\bconnector[-_ ]?id\b/i,
  /sk-[A-Za-z0-9]/i,
  /ghp_[A-Za-z0-9]/i,
  /OPENAI_API_KEY/i,
  /GITHUB_TOKEN/i,
  /\btoken\b/i,
  /password:/i,
  /secret:/i,
  /\bsecret\b/i,
  /private key/i,
  /-----BEGIN PRIVATE KEY-----/i,
  /-----BEGIN RSA PRIVATE KEY-----/i,
  /-----BEGIN OPENSSH PRIVATE KEY-----/i,
] as const;

const symbolicRefPattern = /^[a-z][a-z0-9_-]*:[a-z0-9][a-z0-9._:-]{1,160}$/i;
const doiPattern = /^(?:doi:)?10\.\d{4,9}\/[-._;()/:A-Z0-9]+$/i;

export function sanitizeSourceLocatorV01(input: {
  input_kind?: unknown;
  source_locator?: unknown;
}): SanitizedSourceLocatorV01 {
  const inputKind = input.input_kind;
  const sourceLocator = input.source_locator;
  if (!isBoundedSourceInputKindV01(inputKind)) {
    return blockedInvalid("input_kind_invalid");
  }
  if (typeof sourceLocator !== "string" || sourceLocator.trim().length === 0) {
    return blockedInvalid("source_locator_invalid");
  }

  const normalized = sourceLocator.trim();
  if (!isPublicSafeSourceLocatorV01({ input_kind: inputKind, source_locator: normalized })) {
    const unsafe = unsafeStringPatterns.some((pattern) => pattern.test(normalized));
    return unsafe
      ? blockedPrivate("source_locator_private_or_raw")
      : blockedInvalid("source_locator_invalid");
  }

  const fingerprint = createPublicSafeSourceLocatorFingerprintV01({
    input_kind: inputKind,
    source_locator: normalized,
  });
  const sourceLocatorRef = `${inputKind}-locator-ref:${fingerprint.slice(0, 24)}`;
  return {
    status: "ok",
    source_locator_ref: sourceLocatorRef,
    source_locator_display: redactSourceLocatorForDisplayV01({
      input_kind: inputKind,
      source_locator: normalized,
    }),
    source_locator_fingerprint: fingerprint,
    failure_codes: [],
  };
}

export function redactSourceLocatorForDisplayV01(input: {
  input_kind?: unknown;
  source_locator?: unknown;
}): string {
  const inputKind = isBoundedSourceInputKindV01(input.input_kind)
    ? input.input_kind
    : "manual_text_summary";
  const sourceLocator = typeof input.source_locator === "string" ? input.source_locator.trim() : "";
  const fingerprint = createPublicSafeSourceLocatorFingerprintV01({
    input_kind: inputKind,
    source_locator: sourceLocator,
  }).slice(0, 12);

  if (inputKind === "url") {
    try {
      const url = new URL(sourceLocator);
      return `url-host:${url.hostname.toLowerCase()}#${fingerprint}`;
    } catch {
      return `url-ref:redacted#${fingerprint}`;
    }
  }
  if (inputKind === "doi") {
    return `doi-ref:redacted#${fingerprint}`;
  }
  if (inputKind === "file_ref") {
    return `file-ref:redacted#${fingerprint}`;
  }
  if (inputKind === "note_ref") {
    return `note-ref:redacted#${fingerprint}`;
  }
  return `manual-summary-ref:redacted#${fingerprint}`;
}

export function isPublicSafeSourceLocatorV01(input: {
  input_kind?: unknown;
  source_locator?: unknown;
}): boolean {
  if (!isBoundedSourceInputKindV01(input.input_kind)) return false;
  if (typeof input.source_locator !== "string") return false;

  const value = input.source_locator.trim();
  if (value.length === 0 || value.length > 512) return false;
  if (value.includes("\0") || value.includes("\\") || value.includes("..")) return false;
  if (unsafeStringPatterns.some((pattern) => pattern.test(value))) return false;

  if (input.input_kind === "url") {
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) return false;
      if (url.username || url.password) return false;
      if (!url.hostname || url.hostname.length > 253) return false;
      if (url.hostname === "localhost") return false;
      if (/^(127|10|192\.168|172\.(1[6-9]|2\d|3[0-1]))\./.test(url.hostname)) {
        return false;
      }
      if (/(^|\.)local$/i.test(url.hostname)) return false;
      if (/(private|internal|intranet|corp)/i.test(url.hostname)) return false;
      return true;
    } catch {
      return false;
    }
  }

  if (input.input_kind === "doi") {
    return doiPattern.test(value);
  }

  if (input.input_kind === "file_ref") {
    return symbolicRefPattern.test(value) && value.startsWith("file-ref:");
  }
  if (input.input_kind === "note_ref") {
    return symbolicRefPattern.test(value) && value.startsWith("note-ref:");
  }

  return symbolicRefPattern.test(value) && value.startsWith("manual-summary-ref:");
}

export function createPublicSafeSourceLocatorFingerprintV01(input: {
  input_kind?: unknown;
  source_locator?: unknown;
}): string {
  const inputKind = isBoundedSourceInputKindV01(input.input_kind)
    ? input.input_kind
    : "unknown";
  const value = typeof input.source_locator === "string" ? input.source_locator.trim() : "";
  return createHash("sha256")
    .update(`${inputKind}\n${normalizeFingerprintValue(value)}`)
    .digest("hex");
}

export function isBoundedSourceInputKindV01(value: unknown): value is BoundedSourceInputKindV01 {
  return (
    value === "url" ||
    value === "doi" ||
    value === "file_ref" ||
    value === "note_ref" ||
    value === "manual_text_summary"
  );
}

export function containsUnsafeSourceLocatorTextV01(value: unknown): boolean {
  if (typeof value === "string") {
    return unsafeStringPatterns.some((pattern) => pattern.test(value));
  }
  if (Array.isArray(value)) {
    return value.some((item) => containsUnsafeSourceLocatorTextV01(item));
  }
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((item) =>
      containsUnsafeSourceLocatorTextV01(item),
    );
  }
  return false;
}

function normalizeFingerprintValue(value: string): string {
  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      url.hash = "";
      return url.toString();
    } catch {
      return value;
    }
  }
  return value.toLowerCase();
}

function blockedInvalid(code: string): SanitizedSourceLocatorV01 {
  return {
    status: "blocked_invalid_input",
    source_locator_ref: null,
    source_locator_display: null,
    source_locator_fingerprint: null,
    failure_codes: [code],
  };
}

function blockedPrivate(code: string): SanitizedSourceLocatorV01 {
  return {
    status: "blocked_private_or_raw_payload",
    source_locator_ref: null,
    source_locator_display: null,
    source_locator_fingerprint: null,
    failure_codes: [code],
  };
}
