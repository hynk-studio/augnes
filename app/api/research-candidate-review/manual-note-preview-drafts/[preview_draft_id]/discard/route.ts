import { discardResearchCandidateManualNotePreviewDraft } from "@/lib/research-candidate-review/manual-note-preview-draft-store";
import {
  MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE,
  MANUAL_NOTE_RUNTIME_VERSION,
  MAX_MANUAL_NOTE_PREVIEW_DRAFT_DISCARD_REASON_LENGTH,
  buildManualNotePreviewDraftLifecycleAuthority,
  buildManualNotePreviewDraftLifecycleBoundary,
  buildManualNotePreviewNoSideEffects,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import type {
  ManualNotePreviewDraftDiscardResponse,
  ManualNotePreviewDraftRuntimeErrorResponse,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const DISCARD_REQUEST_BODY_BYTES = 4 * 1024;
const PREVIEW_DRAFT_ID_PATTERN =
  /^research-candidate-preview-draft:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ preview_draft_id: string }> },
) {
  const { preview_draft_id: previewDraftId } = await params;
  const route = `${MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE}/${encodeURIComponent(
    previewDraftId,
  )}/discard`;

  try {
    validatePreviewDraftId(previewDraftId);
    const body = await readDiscardRequestBody(request);
    const discardReason = parseDiscardReason(body);
    const noSideEffects = buildManualNotePreviewNoSideEffects();
    const discard = discardResearchCandidateManualNotePreviewDraft({
      previewDraftId,
      scope: DEFAULT_SCOPE,
      discardedAt: new Date().toISOString(),
      discardedBy: "cockpit_operator",
      discardReason,
      authority: buildManualNotePreviewDraftLifecycleAuthority(),
      noSideEffects,
    });

    if (!discard) {
      return errorResponse({
        errorCode: "preview_draft_not_found",
        message: "Preview draft was not found.",
        status: 404,
        route,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        runtime_version: MANUAL_NOTE_RUNTIME_VERSION,
        preview_draft_id: previewDraftId,
        lifecycle_status: "discarded_preview_draft",
        discarded_at: discard.discarded_at,
        discard_metadata: {
          discard_id: discard.discard_id,
          preview_draft_id: discard.preview_draft_id,
          scope: discard.scope,
          discarded_at: discard.discarded_at,
          discarded_by: discard.discarded_by,
          discard_reason: discard.discard_reason,
        },
        no_side_effects: noSideEffects,
        runtime_boundary: buildManualNotePreviewDraftLifecycleBoundary({
          route,
        }),
      } satisfies ManualNotePreviewDraftDiscardResponse,
    );
  } catch (error) {
    if (error instanceof InvalidDiscardJsonError) {
      return errorResponse({
        errorCode: "invalid_json",
        message: "Request body must be valid JSON when provided.",
        status: 400,
        route,
      });
    }

    if (error instanceof DiscardBodyTooLargeError) {
      return errorResponse({
        errorCode: "invalid_body",
        message: `Request body must be ${DISCARD_REQUEST_BODY_BYTES} bytes or fewer.`,
        status: 413,
        route,
      });
    }

    if (error instanceof PreviewDraftDiscardValidationError) {
      return errorResponse({
        errorCode: error.errorCode,
        message: error.message,
        status: 400,
        route,
      });
    }

    return errorResponse({
      errorCode: "runtime_unavailable",
      message: "Manual note preview draft discard route is unavailable.",
      status: 500,
      route,
    });
  }
}

function validatePreviewDraftId(previewDraftId: string) {
  if (!PREVIEW_DRAFT_ID_PATTERN.test(previewDraftId)) {
    throw new PreviewDraftDiscardValidationError({
      errorCode: "invalid_preview_draft_id",
      message: "preview_draft_id is not a valid manual note preview draft id.",
    });
  }
}

function parseDiscardReason(body: unknown) {
  if (!isRecord(body)) {
    throw new PreviewDraftDiscardValidationError({
      errorCode: "invalid_body",
      message: "Request body must be a JSON object when provided.",
    });
  }

  if (
    body.discard_reason !== undefined &&
    typeof body.discard_reason !== "string"
  ) {
    throw new PreviewDraftDiscardValidationError({
      errorCode: "invalid_body",
      message: "discard_reason must be a string when provided.",
    });
  }

  const discardReason =
    typeof body.discard_reason === "string" ? body.discard_reason.trim() : "";
  if (
    discardReason.length >
    MAX_MANUAL_NOTE_PREVIEW_DRAFT_DISCARD_REASON_LENGTH
  ) {
    throw new PreviewDraftDiscardValidationError({
      errorCode: "discard_reason_too_large",
      message: `discard_reason must be ${MAX_MANUAL_NOTE_PREVIEW_DRAFT_DISCARD_REASON_LENGTH} characters or fewer.`,
    });
  }

  return discardReason;
}

async function readDiscardRequestBody(request: Request) {
  const text = await readBoundedText(request);
  if (text.trim().length === 0) {
    return {};
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new InvalidDiscardJsonError();
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
    if (size > DISCARD_REQUEST_BODY_BYTES) {
      throw new DiscardBodyTooLargeError();
    }
    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();
  return text;
}

function errorResponse({
  errorCode,
  message,
  status,
  route,
}: {
  errorCode: ManualNotePreviewDraftRuntimeErrorResponse["error_code"];
  message: string;
  status: number;
  route: string;
}) {
  return NextResponse.json(
    {
      ok: false,
      error_code: errorCode,
      message,
      runtime_boundary: buildManualNotePreviewDraftLifecycleBoundary({
        route,
      }),
    } satisfies ManualNotePreviewDraftRuntimeErrorResponse,
    { status },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

class PreviewDraftDiscardValidationError extends Error {
  readonly errorCode: ManualNotePreviewDraftRuntimeErrorResponse["error_code"];

  constructor({
    errorCode,
    message,
  }: {
    errorCode: ManualNotePreviewDraftRuntimeErrorResponse["error_code"];
    message: string;
  }) {
    super(message);
    this.name = "PreviewDraftDiscardValidationError";
    this.errorCode = errorCode;
  }
}

class InvalidDiscardJsonError extends Error {
  constructor() {
    super("Request body must be valid JSON when provided.");
    this.name = "InvalidDiscardJsonError";
  }
}

class DiscardBodyTooLargeError extends Error {
  constructor() {
    super(`Request body must be ${DISCARD_REQUEST_BODY_BYTES} bytes or fewer.`);
    this.name = "DiscardBodyTooLargeError";
  }
}
