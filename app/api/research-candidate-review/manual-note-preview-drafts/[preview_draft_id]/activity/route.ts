import { listResearchCandidateManualNotePreviewDraftActivities } from "@/lib/research-candidate-review/manual-note-preview-draft-store";
import {
  DEFAULT_MANUAL_NOTE_PREVIEW_DRAFT_ACTIVITY_LIST_LIMIT,
  MANUAL_NOTE_RUNTIME_VERSION,
  MAX_MANUAL_NOTE_PREVIEW_DRAFT_ACTIVITY_LIST_LIMIT,
  buildManualNotePreviewDraftActivityBoundary,
  buildManualNotePreviewDraftActivityRoute,
  buildManualNotePreviewNoSideEffects,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import type {
  ManualNotePreviewDraftActivityResponse,
  ManualNotePreviewDraftRuntimeErrorResponse,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import type { ResearchCandidateReviewScope } from "@/types/research-candidate-review";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_SCOPE: ResearchCandidateReviewScope = "project:augnes";
const PREVIEW_DRAFT_ID_PATTERN =
  /^research-candidate-preview-draft:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ preview_draft_id: string }> },
) {
  const { preview_draft_id: previewDraftId } = await params;
  const route = buildManualNotePreviewDraftActivityRoute(previewDraftId);

  try {
    validatePreviewDraftId(previewDraftId);
    const url = new URL(request.url);
    const limit = parseActivityLimit(url.searchParams.get("limit"));
    const activity = listResearchCandidateManualNotePreviewDraftActivities({
      previewDraftId,
      scope: DEFAULT_SCOPE,
      limit,
    });

    if (!activity) {
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
        lifecycle_status: activity.lifecycle_status,
        items: activity.items,
        count: activity.items.length,
        limit,
        runtime_boundary: buildManualNotePreviewDraftActivityBoundary({
          route,
        }),
        no_side_effects: buildManualNotePreviewNoSideEffects(),
      } satisfies ManualNotePreviewDraftActivityResponse,
    );
  } catch (error) {
    if (error instanceof PreviewDraftActivityValidationError) {
      return errorResponse({
        errorCode: error.errorCode,
        message: error.message,
        status: 400,
        route,
      });
    }

    return errorResponse({
      errorCode: "runtime_unavailable",
      message: "Manual note preview draft activity route is unavailable.",
      status: 500,
      route,
    });
  }
}

function validatePreviewDraftId(previewDraftId: string) {
  if (!PREVIEW_DRAFT_ID_PATTERN.test(previewDraftId)) {
    throw new PreviewDraftActivityValidationError({
      errorCode: "invalid_preview_draft_id",
      message: "preview_draft_id is not a valid manual note preview draft id.",
    });
  }
}

function parseActivityLimit(value: string | null) {
  if (value === null || value.trim().length === 0) {
    return DEFAULT_MANUAL_NOTE_PREVIEW_DRAFT_ACTIVITY_LIST_LIMIT;
  }

  const limit = Number(value);
  if (
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > MAX_MANUAL_NOTE_PREVIEW_DRAFT_ACTIVITY_LIST_LIMIT
  ) {
    throw new PreviewDraftActivityValidationError({
      errorCode: "invalid_limit",
      message: `limit must be an integer from 1 to ${MAX_MANUAL_NOTE_PREVIEW_DRAFT_ACTIVITY_LIST_LIMIT}.`,
    });
  }

  return limit;
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
      runtime_boundary: buildManualNotePreviewDraftActivityBoundary({
        route,
      }),
    } satisfies ManualNotePreviewDraftRuntimeErrorResponse,
    { status },
  );
}

class PreviewDraftActivityValidationError extends Error {
  readonly errorCode: ManualNotePreviewDraftRuntimeErrorResponse["error_code"];

  constructor({
    errorCode,
    message,
  }: {
    errorCode: ManualNotePreviewDraftRuntimeErrorResponse["error_code"];
    message: string;
  }) {
    super(message);
    this.name = "PreviewDraftActivityValidationError";
    this.errorCode = errorCode;
  }
}
