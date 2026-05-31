import type { AgWorkResumePacketV02 } from "@/lib/ag-work-resume-packet";
import {
  buildAgWorkResumeMappingProposalPreview,
  type AgWorkResumeMappingProposalCandidate,
  type AgWorkResumeMappingProposalPreviewInput,
  type AgWorkResumeMappingProposalPreview,
  type AgWorkResumeMappingProposalPreviewStatus,
} from "@/lib/ag-work-resume-mapping-proposal-preview";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_ID = "ag_work_resume_mapping_proposal_preview.v0_1";

type RouteBody = {
  packet: Record<string, unknown>;
  candidates: AgWorkResumeMappingProposalCandidate[];
  selectedCandidateId: string | null;
  strict: boolean;
  source: AgWorkResumeMappingProposalPreviewInput["source"];
};

export async function POST(request: Request) {
  if (!acceptsJson(request)) {
    return badRequest("Request content-type must be application/json.");
  }

  const bodyResult = await parseBody(request);
  if ("error" in bodyResult) return badRequest(bodyResult.error);

  const { packet, candidates, selectedCandidateId, strict, source } = bodyResult;

  let preview: AgWorkResumeMappingProposalPreview;
  try {
    preview = buildAgWorkResumeMappingProposalPreview({
      packet: packet as unknown as AgWorkResumePacketV02,
      candidates,
      selected_candidate_id: selectedCandidateId,
      strict,
      source,
    });
  } catch (error) {
    return badRequest(
      `Unable to build mapping proposal preview: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  const ok = isNonBlockingStatus(preview.status);

  return NextResponse.json(
    {
      ok,
      route: ROUTE_ID,
      strict,
      preview,
      recommended_next_step: recommendedNextStepForPreview(preview),
    },
    { status: statusForPreview(preview.status) },
  );
}

function acceptsJson(request: Request) {
  return (request.headers.get("content-type") ?? "")
    .toLowerCase()
    .includes("application/json");
}

async function parseBody(
  request: Request,
): Promise<RouteBody | { error: string }> {
  let value: unknown;
  try {
    const text = await request.text();
    value = text.trim().length > 0 ? JSON.parse(text) : null;
  } catch (error) {
    return {
      error: `Invalid JSON request body: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }

  if (!isRecord(value)) {
    return { error: "Request body must be a JSON object." };
  }
  if (!isRecord(value.packet)) {
    return { error: "Request body must include a packet object." };
  }
  if ("candidates" in value && !Array.isArray(value.candidates)) {
    return { error: "candidates must be an array when supplied." };
  }
  if (
    "selected_candidate_id" in value &&
    value.selected_candidate_id !== null &&
    value.selected_candidate_id !== undefined &&
    typeof value.selected_candidate_id !== "string"
  ) {
    return {
      error: "selected_candidate_id must be a string or null when supplied.",
    };
  }
  if ("strict" in value && typeof value.strict !== "boolean") {
    return { error: "strict must be a boolean when supplied." };
  }
  if ("source" in value && value.source !== undefined && !isRecord(value.source)) {
    return { error: "source must be an object when supplied." };
  }

  return {
    packet: value.packet,
    candidates: (value.candidates ?? []) as AgWorkResumeMappingProposalCandidate[],
    selectedCandidateId:
      typeof value.selected_candidate_id === "string"
        ? value.selected_candidate_id
        : null,
    strict: value.strict === true,
    source: isRecord(value.source)
      ? (value.source as AgWorkResumeMappingProposalPreviewInput["source"])
      : undefined,
  };
}

function isNonBlockingStatus(status: AgWorkResumeMappingProposalPreviewStatus) {
  return status === "candidate_review" || status === "needs_candidate";
}

function statusForPreview(status: AgWorkResumeMappingProposalPreviewStatus) {
  if (status === "conflict") return 409;
  if (status === "blocked") return 422;
  return 200;
}

function recommendedNextStepForPreview(
  preview: AgWorkResumeMappingProposalPreview,
) {
  if (preview.status === "candidate_review") {
    return "User/Core should review whether the foreign work maps to the selected local work item. Do not create a mapping record or import context from this route output.";
  }
  if (preview.status === "needs_candidate") {
    return "Provide an explicit Local B candidate work item before user/Core mapping review.";
  }
  if (preview.status === "conflict") {
    return `${preview.next_step} Conflicts must be resolved before any future mapping confirmation.`;
  }
  return `${preview.next_step} Unsafe packet policy or packet shape must be corrected before mapping proposal review.`;
}

function badRequest(error: string) {
  return NextResponse.json(
    {
      ok: false,
      route: ROUTE_ID,
      error,
    },
    { status: 400 },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
