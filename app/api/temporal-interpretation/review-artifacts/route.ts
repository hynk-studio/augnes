import {
  TEMPORAL_INTERPRETATION_WORK_ID,
  TemporalPreviewReviewArtifactValidationError,
  listTemporalPreviewReviewArtifacts,
  normalizeTemporalReviewArtifactScope,
} from "@/lib/temporal-review-artifacts";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = normalizeTemporalReviewArtifactScope(searchParams.get("scope"));
    const workId =
      searchParams.get("work_id") ?? TEMPORAL_INTERPRETATION_WORK_ID;
    const artifacts = listTemporalPreviewReviewArtifacts({
      scope,
      work_id: workId,
      generator: searchParams.get("generator"),
      reviewer_verdict: searchParams.get("reviewer_verdict"),
      guardrail_passed: searchParams.get("guardrail_passed"),
      linked_session_id: searchParams.get("linked_session_id"),
      linked_pr_url: searchParams.get("linked_pr_url"),
      limit: searchParams.get("limit"),
    });

    return NextResponse.json({
      runtime: "augnes",
      scope,
      generated_at: new Date().toISOString(),
      filters: {
        work_id: workId,
        generator: searchParams.get("generator"),
        reviewer_verdict: searchParams.get("reviewer_verdict"),
        guardrail_passed: searchParams.get("guardrail_passed"),
        linked_session_id: searchParams.get("linked_session_id"),
        linked_pr_url: searchParams.get("linked_pr_url"),
        limit: searchParams.get("limit") ?? null,
      },
      count: artifacts.length,
      artifacts,
      gaps:
        artifacts.length === 0
          ? [
              `No TemporalPreviewReviewArtifact records found for work_id ${workId}.`,
            ]
          : [],
      boundaries: temporalReviewArtifactReadBoundaries(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to list TemporalPreviewReviewArtifact records.",
        boundaries: temporalReviewArtifactReadBoundaries(),
      },
      {
        status:
          error instanceof TemporalPreviewReviewArtifactValidationError
            ? 400
            : 500,
      },
    );
  }
}

function temporalReviewArtifactReadBoundaries() {
  return [
    "TemporalPreviewReviewArtifact records are bounded review artifacts only.",
    "Read APIs do not create artifacts, call OpenAI/GitHub, approve, publish, replay, or commit state.",
    "Artifacts are not PerspectiveSnapshot persistence or RawEpisodeBundle runtime.",
  ];
}
