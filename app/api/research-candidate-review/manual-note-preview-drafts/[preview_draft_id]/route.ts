import { getResearchCandidateManualNotePreviewDraft } from "@/lib/research-candidate-review/manual-note-preview-draft-store";
import {
  MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE,
  MANUAL_NOTE_RUNTIME_VERSION,
  buildManualNotePreviewDraftLifecycleBoundary,
  buildManualNotePreviewNoSideEffects,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import type {
  ManualNotePreviewDraftDetailResponse,
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
  _request: Request,
  { params }: { params: Promise<{ preview_draft_id: string }> },
) {
  const { preview_draft_id: previewDraftId } = await params;
  const route = `${MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE}/${encodeURIComponent(
    previewDraftId,
  )}`;

  try {
    validatePreviewDraftId(previewDraftId);

    const detail = getResearchCandidateManualNotePreviewDraft({
      previewDraftId,
      scope: DEFAULT_SCOPE,
    });

    if (!detail) {
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
        draft: detail.draft,
        preview: detail.preview,
        warnings: detail.warnings,
        authority: detail.authority,
        runtime_boundary: buildManualNotePreviewDraftLifecycleBoundary({
          route,
        }),
        no_side_effects: buildManualNotePreviewNoSideEffects(),
        lifecycle_status: detail.lifecycle_status,
        ...(detail.discard_metadata
          ? { discard_metadata: detail.discard_metadata }
          : {}),
      } satisfies ManualNotePreviewDraftDetailResponse,
    );
  } catch (error) {
    if (error instanceof PreviewDraftDetailValidationError) {
      return errorResponse({
        errorCode: error.errorCode,
        message: error.message,
        status: 400,
        route,
      });
    }

    return errorResponse({
      errorCode: "runtime_unavailable",
      message: "Manual note preview draft detail route is unavailable.",
      status: 500,
      route,
    });
  }
}

function validatePreviewDraftId(previewDraftId: string) {
  if (!PREVIEW_DRAFT_ID_PATTERN.test(previewDraftId)) {
    throw new PreviewDraftDetailValidationError({
      errorCode: "invalid_preview_draft_id",
      message: "preview_draft_id is not a valid manual note preview draft id.",
    });
  }
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

class PreviewDraftDetailValidationError extends Error {
  readonly errorCode: ManualNotePreviewDraftRuntimeErrorResponse["error_code"];

  constructor({
    errorCode,
    message,
  }: {
    errorCode: ManualNotePreviewDraftRuntimeErrorResponse["error_code"];
    message: string;
  }) {
    super(message);
    this.name = "PreviewDraftDetailValidationError";
    this.errorCode = errorCode;
  }
}
