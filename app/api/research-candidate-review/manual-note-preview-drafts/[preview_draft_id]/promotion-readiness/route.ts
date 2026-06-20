import {
  getResearchCandidateManualNotePreviewDraft,
  listResearchCandidateManualNotePreviewDraftActivities,
} from "@/lib/research-candidate-review/manual-note-preview-draft-store";
import { buildManualNotePreviewDraftPromotionReadiness } from "@/lib/research-candidate-review/manual-note-preview-draft-promotion-readiness";
import {
  MANUAL_NOTE_RUNTIME_VERSION,
  MAX_MANUAL_NOTE_PREVIEW_DRAFT_ACTIVITY_LIST_LIMIT,
  buildManualNotePreviewDraftPromotionReadinessBoundary,
  buildManualNotePreviewDraftPromotionReadinessRoute,
  type ManualNotePreviewDraftPromotionReadinessResponse,
  type ManualNotePreviewDraftRuntimeErrorResponse,
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
  const route = buildManualNotePreviewDraftPromotionReadinessRoute(previewDraftId);

  try {
    validatePreviewDraftId(previewDraftId);
    const url = new URL(request.url);
    const scope = parseScope(url.searchParams.get("scope"));
    const detail = getResearchCandidateManualNotePreviewDraft({
      previewDraftId,
      scope,
    });

    if (!detail) {
      return errorResponse({
        errorCode: "preview_draft_not_found",
        message: "Preview draft was not found.",
        status: 404,
        route,
      });
    }

    const activity = listResearchCandidateManualNotePreviewDraftActivities({
      previewDraftId,
      scope,
      limit: MAX_MANUAL_NOTE_PREVIEW_DRAFT_ACTIVITY_LIST_LIMIT,
    });
    const preflight = buildManualNotePreviewDraftPromotionReadiness({
      detail,
      activity,
      route,
    });

    return NextResponse.json(
      {
        ok: true,
        runtime_version: MANUAL_NOTE_RUNTIME_VERSION,
        preview_draft_id: preflight.preview_draft_id,
        lifecycle_status: preflight.lifecycle_status,
        readiness_status: preflight.readiness_status,
        readiness_score: preflight.readiness_score,
        gate_results: preflight.gate_results,
        blockers: preflight.blockers,
        warnings: preflight.warnings,
        next_review_steps: preflight.next_review_steps,
        source_summary: preflight.source_summary,
        candidate_summary: preflight.candidate_summary,
        lifecycle_summary: preflight.lifecycle_summary,
        authority: preflight.authority,
        runtime_boundary: preflight.runtime_boundary,
        no_side_effects: preflight.no_side_effects,
        created_at: preflight.created_at,
      } satisfies ManualNotePreviewDraftPromotionReadinessResponse,
    );
  } catch (error) {
    if (error instanceof PromotionReadinessValidationError) {
      return errorResponse({
        errorCode: error.errorCode,
        message: error.message,
        status: 400,
        route,
      });
    }

    return errorResponse({
      errorCode: "runtime_unavailable",
      message: "Manual note preview draft promotion readiness route is unavailable.",
      status: 500,
      route,
    });
  }
}

function parseScope(value: string | null): ResearchCandidateReviewScope {
  if (value === null || value.trim().length === 0 || value === DEFAULT_SCOPE) {
    return DEFAULT_SCOPE;
  }

  throw new PromotionReadinessValidationError({
    errorCode: "unsupported_scope",
    message: "scope must be project:augnes when provided.",
  });
}

function validatePreviewDraftId(previewDraftId: string) {
  if (!PREVIEW_DRAFT_ID_PATTERN.test(previewDraftId)) {
    throw new PromotionReadinessValidationError({
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
      runtime_boundary: buildManualNotePreviewDraftPromotionReadinessBoundary({
        route,
      }),
    } satisfies ManualNotePreviewDraftRuntimeErrorResponse,
    { status },
  );
}

class PromotionReadinessValidationError extends Error {
  readonly errorCode: ManualNotePreviewDraftRuntimeErrorResponse["error_code"];

  constructor({
    errorCode,
    message,
  }: {
    errorCode: ManualNotePreviewDraftRuntimeErrorResponse["error_code"];
    message: string;
  }) {
    super(message);
    this.name = "PromotionReadinessValidationError";
    this.errorCode = errorCode;
  }
}
