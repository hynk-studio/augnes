import { updateResearchCandidateManualNotePreviewDraftLabel } from "@/lib/research-candidate-review/manual-note-preview-draft-store";
import {
  MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE,
  MANUAL_NOTE_RUNTIME_VERSION,
  MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH,
  buildManualNotePreviewDraftLabelBoundary,
  buildManualNotePreviewNoSideEffects,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import type {
  ManualNotePreviewDraftLabelUpdateRequest,
  ManualNotePreviewDraftLabelUpdateResponse,
  ManualNotePreviewDraftRuntimeErrorResponse,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const LABEL_UPDATE_REQUEST_BODY_BYTES = 2 * 1024;
const PREVIEW_DRAFT_ID_PATTERN =
  /^research-candidate-preview-draft:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ preview_draft_id: string }> },
) {
  const { preview_draft_id: previewDraftId } = await params;
  const route = `${MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE}/${encodeURIComponent(
    previewDraftId,
  )}/label`;

  try {
    validatePreviewDraftId(previewDraftId);
    const body = await readLabelUpdateRequestBody(request);
    const { operator_note_label: operatorNoteLabel } = parseLabelUpdateBody(body);
    const noSideEffects = buildManualNotePreviewNoSideEffects();
    const updatedDraft = updateResearchCandidateManualNotePreviewDraftLabel({
      previewDraftId,
      scope: DEFAULT_SCOPE,
      operatorNoteLabel,
      updatedAt: new Date().toISOString(),
    });

    if (!updatedDraft) {
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
        operator_note_label: updatedDraft.draft.operator_note_label,
        updated_at: updatedDraft.draft.updated_at,
        lifecycle_status: updatedDraft.lifecycle_status,
        runtime_boundary: buildManualNotePreviewDraftLabelBoundary({ route }),
        no_side_effects: noSideEffects,
      } satisfies ManualNotePreviewDraftLabelUpdateResponse,
    );
  } catch (error) {
    if (error instanceof InvalidLabelJsonError) {
      return errorResponse({
        errorCode: "invalid_json",
        message: "Request body must be valid JSON.",
        status: 400,
        route,
      });
    }

    if (error instanceof LabelBodyTooLargeError) {
      return errorResponse({
        errorCode: "invalid_body",
        message: `Request body must be ${LABEL_UPDATE_REQUEST_BODY_BYTES} bytes or fewer.`,
        status: 413,
        route,
      });
    }

    if (error instanceof PreviewDraftLabelValidationError) {
      return errorResponse({
        errorCode: error.errorCode,
        message: error.message,
        status: 400,
        route,
      });
    }

    return errorResponse({
      errorCode: "runtime_unavailable",
      message: "Manual note preview draft label route is unavailable.",
      status: 500,
      route,
    });
  }
}

function validatePreviewDraftId(previewDraftId: string) {
  if (!PREVIEW_DRAFT_ID_PATTERN.test(previewDraftId)) {
    throw new PreviewDraftLabelValidationError({
      errorCode: "invalid_preview_draft_id",
      message: "preview_draft_id is not a valid manual note preview draft id.",
    });
  }
}

function parseLabelUpdateBody(
  body: unknown,
): ManualNotePreviewDraftLabelUpdateRequest {
  if (!isRecord(body)) {
    throw new PreviewDraftLabelValidationError({
      errorCode: "invalid_body",
      message: "Request body must be a JSON object.",
    });
  }

  if ("manual_note_text" in body) {
    throw new PreviewDraftLabelValidationError({
      errorCode: "invalid_body",
      message: "manual_note_text is not accepted by the label update route.",
    });
  }

  if (
    body.operator_note_label !== null &&
    typeof body.operator_note_label !== "string"
  ) {
    throw new PreviewDraftLabelValidationError({
      errorCode: "invalid_body",
      message: "operator_note_label must be a string or null.",
    });
  }

  const label =
    typeof body.operator_note_label === "string"
      ? body.operator_note_label.trim()
      : null;
  if (
    typeof label === "string" &&
    label.length > MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH
  ) {
    throw new PreviewDraftLabelValidationError({
      errorCode: "operator_note_label_too_large",
      message: `operator_note_label must be ${MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH} characters or fewer.`,
    });
  }

  return {
    operator_note_label: label && label.length > 0 ? label : null,
  };
}

async function readLabelUpdateRequestBody(request: Request) {
  const text = await readBoundedText(request);
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new InvalidLabelJsonError();
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
    if (size > LABEL_UPDATE_REQUEST_BODY_BYTES) {
      throw new LabelBodyTooLargeError();
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
      runtime_boundary: buildManualNotePreviewDraftLabelBoundary({
        route,
      }),
    } satisfies ManualNotePreviewDraftRuntimeErrorResponse,
    { status },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

class PreviewDraftLabelValidationError extends Error {
  readonly errorCode: ManualNotePreviewDraftRuntimeErrorResponse["error_code"];

  constructor({
    errorCode,
    message,
  }: {
    errorCode: ManualNotePreviewDraftRuntimeErrorResponse["error_code"];
    message: string;
  }) {
    super(message);
    this.name = "PreviewDraftLabelValidationError";
    this.errorCode = errorCode;
  }
}

class InvalidLabelJsonError extends Error {
  constructor() {
    super("Request body must be valid JSON.");
    this.name = "InvalidLabelJsonError";
  }
}

class LabelBodyTooLargeError extends Error {
  constructor() {
    super(`Request body must be ${LABEL_UPDATE_REQUEST_BODY_BYTES} bytes or fewer.`);
    this.name = "LabelBodyTooLargeError";
  }
}
