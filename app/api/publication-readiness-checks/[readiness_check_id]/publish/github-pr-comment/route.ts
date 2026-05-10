import {
  PublishGateConflictError,
  PublishGateNotFoundError,
  PublishGateValidationError,
  PublishTokenUnavailableError,
  buildDryRunPublishPreview,
  executeGitHubPrCommentPublish,
  validateGitHubPrCommentPublishRequest,
} from "@/lib/core-gated-publish";
import {
  ReadinessCheckNotFoundError,
  ReadinessCheckValidationError,
} from "@/lib/publication-readiness-checks";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ readiness_check_id: string }> },
) {
  const { readiness_check_id } = await params;

  try {
    const body = await readJsonBody(request);
    const publishRequest = validateGitHubPrCommentPublishRequest({
      readinessCheckId: readiness_check_id,
      body,
    });

    if (publishRequest.dryRun) {
      const preview = buildDryRunPublishPreview(publishRequest);

      return NextResponse.json(preview, { status: 200 });
    }

    const result = await executeGitHubPrCommentPublish(publishRequest);

    return NextResponse.json(result, { status: result.posted ? 201 : 200 });
  } catch (error) {
    if (
      error instanceof PublishGateNotFoundError ||
      error instanceof ReadinessCheckNotFoundError
    ) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    if (error instanceof PublishGateConflictError) {
      return NextResponse.json(
        {
          error: error.message,
          blocked_reasons: error.blockedReasons,
          gate_checks: error.gateChecks,
        },
        { status: 409 },
      );
    }

    if (error instanceof PublishTokenUnavailableError) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to run Core-gated GitHub PR comment publish route.",
      },
      {
        status:
          error instanceof PublishGateValidationError ||
          error instanceof ReadinessCheckValidationError
            ? 400
            : 500,
      },
    );
  }
}

async function readJsonBody(request: Request) {
  try {
    const body = (await request.json()) as unknown;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new PublishGateValidationError(
        "Request body must be a JSON object.",
      );
    }

    return body as Record<string, unknown>;
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Request body must be a JSON object."
    ) {
      throw error;
    }

    throw new PublishGateValidationError("Request body must be valid JSON.");
  }
}
