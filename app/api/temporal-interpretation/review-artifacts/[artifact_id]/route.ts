import {
  TemporalPreviewReviewArtifactValidationError,
  getTemporalPreviewReviewArtifact,
  normalizeTemporalReviewArtifactScope,
} from "@/lib/temporal-review-artifacts";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ artifact_id: string }> },
) {
  try {
    const { artifact_id } = await params;
    const { searchParams } = new URL(request.url);
    const scope = normalizeTemporalReviewArtifactScope(searchParams.get("scope"));
    const artifact = getTemporalPreviewReviewArtifact(artifact_id, scope);

    if (!artifact) {
      return NextResponse.json(
        {
          error: `Unknown TemporalPreviewReviewArtifact ${artifact_id} for scope ${scope}.`,
          gaps: [
            `No TemporalPreviewReviewArtifact record found for artifact_id ${artifact_id}.`,
          ],
          boundaries: temporalReviewArtifactReadBoundaries(),
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      runtime: "augnes",
      scope,
      generated_at: new Date().toISOString(),
      artifact,
      gaps: [],
      boundaries: temporalReviewArtifactReadBoundaries(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to get TemporalPreviewReviewArtifact.",
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
