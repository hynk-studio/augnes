import type {
  PerspectiveIngestLocalPastedTextPreviewRequest,
} from "@/types/perspective-ingest-constellation-preview";

export const PERSPECTIVE_INGEST_LOCAL_PREVIEW_INPUT_KIND =
  "manual:pasted_text" as const;
export const PERSPECTIVE_INGEST_LOCAL_PREVIEW_INPUT_TEXT_MAX_LENGTH = 12000;
export const PERSPECTIVE_INGEST_LOCAL_PREVIEW_SOURCE_LABEL_MAX_LENGTH = 120;

export type PerspectiveIngestLocalPastedTextValidationErrorCode =
  | "invalid_body"
  | "unsupported_input_kind"
  | "missing_input_text"
  | "input_text_too_large"
  | "invalid_source_label"
  | "source_label_too_large"
  | "secret_like_input";

export type PerspectiveIngestLocalPastedTextValidationErrorStatus = 400 | 413;

export type PerspectiveIngestLocalPastedTextValidationResult =
  | {
      ok: true;
      request: PerspectiveIngestLocalPastedTextPreviewRequest;
    }
  | {
      ok: false;
      code: PerspectiveIngestLocalPastedTextValidationErrorCode;
      status: PerspectiveIngestLocalPastedTextValidationErrorStatus;
      summary: string;
      authority_boundary: string[];
    };

const LOCAL_PASTED_TEXT_VALIDATION_BOUNDARY = [
  "manual pasted text preview validation",
  "safe code and summary only",
  "no rejected payload echo",
  "no raw private history storage",
  "no credential or secret acceptance",
];

const SECRET_LIKE_PATTERNS = [
  /OPENAI_API_KEY/i,
  /(^|[^A-Za-z0-9])sk-[A-Za-z0-9_-]{8,}/i,
  /ghp_/i,
  /github_pat_/i,
  /BEGIN PRIVATE KEY/i,
  /authorization:\s*bearer\s+[A-Za-z0-9._-]{8,}/i,
  /bearer\s+[A-Za-z0-9._-]{16,}/i,
  /AWS_ACCESS_KEY_ID/i,
  /SECRET_ACCESS_KEY/i,
  /password=/i,
  /api_key=/i,
  /access_token=/i,
];

export function validatePerspectiveIngestLocalPastedTextPreviewBody(
  body: unknown,
): PerspectiveIngestLocalPastedTextValidationResult {
  if (!isPlainRecord(body)) {
    return validationError(
      "invalid_body",
      400,
      "Request body must be a JSON object.",
    );
  }

  if (body.input_kind !== PERSPECTIVE_INGEST_LOCAL_PREVIEW_INPUT_KIND) {
    return validationError(
      "unsupported_input_kind",
      400,
      "Only manual:pasted_text input is supported.",
    );
  }

  if (typeof body.input_text !== "string" || !body.input_text.trim()) {
    return validationError(
      "missing_input_text",
      400,
      "Pasted text is required.",
    );
  }

  if (
    body.input_text.length >
    PERSPECTIVE_INGEST_LOCAL_PREVIEW_INPUT_TEXT_MAX_LENGTH
  ) {
    return validationError(
      "input_text_too_large",
      413,
      "Pasted text exceeds the local preview size limit.",
    );
  }

  if (
    "source_label" in body &&
    body.source_label !== undefined &&
    typeof body.source_label !== "string"
  ) {
    return validationError(
      "invalid_source_label",
      400,
      "Source label must be text when provided.",
    );
  }

  if (
    typeof body.source_label === "string" &&
    body.source_label.length >
      PERSPECTIVE_INGEST_LOCAL_PREVIEW_SOURCE_LABEL_MAX_LENGTH
  ) {
    return validationError(
      "source_label_too_large",
      400,
      "Source label exceeds the local preview size limit.",
    );
  }

  if (containsSecretLikeMarker(body.input_text)) {
    return validationError(
      "secret_like_input",
      400,
      "Pasted text appears to include a credential-like marker and was rejected.",
    );
  }

  const sourceLabel =
    typeof body.source_label === "string" && body.source_label.trim()
      ? body.source_label.trim()
      : undefined;

  return {
    ok: true,
    request: {
      input_kind: PERSPECTIVE_INGEST_LOCAL_PREVIEW_INPUT_KIND,
      input_text: body.input_text,
      ...(sourceLabel ? { source_label: sourceLabel } : {}),
    },
  };
}

function containsSecretLikeMarker(inputText: string): boolean {
  return SECRET_LIKE_PATTERNS.some((pattern) => pattern.test(inputText));
}

function validationError(
  code: PerspectiveIngestLocalPastedTextValidationErrorCode,
  status: PerspectiveIngestLocalPastedTextValidationErrorStatus,
  summary: string,
): PerspectiveIngestLocalPastedTextValidationResult {
  return {
    ok: false,
    code,
    status,
    summary,
    authority_boundary: LOCAL_PASTED_TEXT_VALIDATION_BOUNDARY,
  };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
