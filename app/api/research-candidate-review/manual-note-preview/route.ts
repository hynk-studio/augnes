import { createHash } from "node:crypto";
import { insertResearchCandidateManualNotePreviewDraft } from "@/lib/research-candidate-review/manual-note-preview-draft-store";
import {
  MAX_MANUAL_NOTE_BODY_BYTES,
  MAX_MANUAL_NOTE_TEXT_LENGTH,
  buildManualNotePreviewNoSideEffects,
  buildManualNotePreviewRuntimeAuthority,
  buildManualNotePreviewRuntimeBoundary,
  buildManualNotePreviewRuntimeOkResponse,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import type {
  ManualNotePreviewRuntimeErrorResponse,
  ManualNotePreviewRuntimeRequest,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import { parseManualResearchNoteToPreview } from "@/lib/research-candidate-review/manual-note-parser";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";

export async function POST(request: Request) {
  let persistPreviewDraft = false;

  try {
    const body = await readBoundedJsonBody(request);
    if (!isRecord(body)) {
      return errorResponse({
        errorCode: "invalid_body",
        message: "Request body must be a JSON object.",
        status: 400,
        persistPreviewDraft,
      });
    }

    const requestBody = parseRequestBody(body);
    persistPreviewDraft = requestBody.persist_preview_draft === true;
    const manualNoteText = requestBody.manual_note_text.trim();

    if (manualNoteText.length === 0) {
      return errorResponse({
        errorCode: "empty_manual_note_text",
        message: "manual_note_text is required.",
        status: 400,
        persistPreviewDraft,
      });
    }

    if (manualNoteText.length > MAX_MANUAL_NOTE_TEXT_LENGTH) {
      return errorResponse({
        errorCode: "manual_note_text_too_large",
        message: `manual_note_text must be ${MAX_MANUAL_NOTE_TEXT_LENGTH} characters or fewer.`,
        status: 413,
        persistPreviewDraft,
      });
    }

    const scope = normalizeManualNotePreviewScope(requestBody.scope);
    const parserResult = parseManualResearchNoteToPreview(manualNoteText, {
      scope,
    });
    const inputFingerprint = createManualNoteInputFingerprint(manualNoteText);
    const createdAt = new Date().toISOString();
    const authority = buildManualNotePreviewRuntimeAuthority();
    const runtimeBoundary = buildManualNotePreviewRuntimeBoundary({
      persistPreviewDraft,
    });
    const noSideEffects = buildManualNotePreviewNoSideEffects();
    const draftMetadata = persistPreviewDraft
      ? {
          preview_draft_id: insertResearchCandidateManualNotePreviewDraft({
            scope,
            operatorNoteLabel: requestBody.operator_note_label,
            inputFingerprint,
            parserResult,
            authority,
            runtimeBoundary,
            noSideEffects,
            createdAt,
          }).preview_draft_id,
          persisted_preview_draft: true,
          persistence_mode: "persisted_preview_draft" as const,
        }
      : {
          persisted_preview_draft: false,
          persistence_mode: "route_only_no_persistence" as const,
        };

    return NextResponse.json(
      buildManualNotePreviewRuntimeOkResponse({
        parserResult,
        inputFingerprint,
        createdAt,
        draftMetadata,
        persistPreviewDraft,
      }),
      { status: persistPreviewDraft ? 201 : 200 },
    );
  } catch (error) {
    if (error instanceof InvalidJsonError) {
      return errorResponse({
        errorCode: "invalid_json",
        message: "Request body must be valid JSON.",
        status: 400,
        persistPreviewDraft,
      });
    }

    if (error instanceof PayloadTooLargeError) {
      return errorResponse({
        errorCode: "manual_note_text_too_large",
        message: `Request body must be ${MAX_MANUAL_NOTE_BODY_BYTES} bytes or fewer.`,
        status: 413,
        persistPreviewDraft,
      });
    }

    if (error instanceof ManualNotePreviewValidationError) {
      return errorResponse({
        errorCode: error.errorCode,
        message: error.message,
        status: error.status,
        persistPreviewDraft,
      });
    }

    return errorResponse({
      errorCode: "runtime_unavailable",
      message: "Manual note preview route is unavailable.",
      status: 500,
      persistPreviewDraft,
    });
  }
}

export function createManualNoteInputFingerprint(input: string) {
  return `sha256:${createHash("sha256").update(input).digest("hex")}`;
}

function parseRequestBody(
  body: Record<string, unknown>,
): ManualNotePreviewRuntimeRequest {
  if (typeof body.manual_note_text !== "string") {
    throw new ManualNotePreviewValidationError({
      errorCode: "invalid_body",
      message: "manual_note_text must be a string.",
      status: 400,
    });
  }

  if (
    body.scope !== undefined &&
    typeof body.scope !== "string"
  ) {
    throw new ManualNotePreviewValidationError({
      errorCode: "invalid_body",
      message: "scope must be a string when provided.",
      status: 400,
    });
  }

  if (
    body.persist_preview_draft !== undefined &&
    typeof body.persist_preview_draft !== "boolean"
  ) {
    throw new ManualNotePreviewValidationError({
      errorCode: "invalid_body",
      message: "persist_preview_draft must be a boolean when provided.",
      status: 400,
    });
  }

  if (
    body.operator_note_label !== undefined &&
    typeof body.operator_note_label !== "string"
  ) {
    throw new ManualNotePreviewValidationError({
      errorCode: "invalid_body",
      message: "operator_note_label must be a string when provided.",
      status: 400,
    });
  }

  return {
    manual_note_text: body.manual_note_text,
    scope: body.scope as ResearchCandidateReviewScope | undefined,
    persist_preview_draft: body.persist_preview_draft,
    operator_note_label: body.operator_note_label,
  };
}

function normalizeManualNotePreviewScope(
  scope: ResearchCandidateReviewScope | undefined,
): ResearchCandidateReviewScope {
  if (scope === undefined || scope === DEFAULT_SCOPE) {
    return DEFAULT_SCOPE;
  }

  throw new ManualNotePreviewValidationError({
    errorCode: "unsupported_scope",
    message: "Only scope project:augnes is supported for this preview route.",
    status: 400,
  });
}

function errorResponse({
  errorCode,
  message,
  status,
  persistPreviewDraft,
}: {
  errorCode: ManualNotePreviewRuntimeErrorResponse["error_code"];
  message: string;
  status: number;
  persistPreviewDraft: boolean;
}) {
  return NextResponse.json(
    {
      ok: false,
      error_code: errorCode,
      message,
      runtime_boundary: buildManualNotePreviewRuntimeBoundary({
        persistPreviewDraft,
      }),
    } satisfies ManualNotePreviewRuntimeErrorResponse,
    { status },
  );
}

async function readBoundedJsonBody(request: Request) {
  const text = await readBoundedText(request);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new InvalidJsonError();
  }
}

async function readBoundedText(request: Request) {
  if (!request.body) {
    return "";
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    size += value.byteLength;
    if (size > MAX_MANUAL_NOTE_BODY_BYTES) {
      throw new PayloadTooLargeError();
    }
    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

class ManualNotePreviewValidationError extends Error {
  readonly errorCode: ManualNotePreviewRuntimeErrorResponse["error_code"];
  readonly status: number;

  constructor({
    errorCode,
    message,
    status,
  }: {
    errorCode: ManualNotePreviewRuntimeErrorResponse["error_code"];
    message: string;
    status: number;
  }) {
    super(message);
    this.name = "ManualNotePreviewValidationError";
    this.errorCode = errorCode;
    this.status = status;
  }
}

class InvalidJsonError extends Error {
  constructor() {
    super("Request body must be valid JSON.");
    this.name = "InvalidJsonError";
  }
}

class PayloadTooLargeError extends Error {
  constructor() {
    super(`Request body must be ${MAX_MANUAL_NOTE_BODY_BYTES} bytes or fewer.`);
    this.name = "PayloadTooLargeError";
  }
}
