import {
  applyAgWorkResumeMappingProposalLifecycleAction,
  type AgWorkResumeMappingProposalLifecycleActionResult,
} from "@/lib/ag-work-resume-mapping-proposal-lifecycle-action";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_ID = "ag_work_resume_mapping_proposal_lifecycle_actions.v0_1";
const SUPPORTED_BODY_FIELDS = new Set([
  "proposal_id",
  "action",
  "reviewed_by",
  "review_note",
  "reviewed_at",
  "replacement_proposal_id",
  "superseded_by_proposal_id",
]);

type LifecycleRouteBody = {
  proposal_id?: unknown;
  action?: unknown;
  reviewed_by?: unknown;
  review_note?: unknown;
  reviewed_at?: unknown;
  replacement_proposal_id?: unknown;
  superseded_by_proposal_id?: unknown;
};

export async function POST(request: Request) {
  if (!acceptsJson(request)) {
    return badRequest("Request content-type must be application/json.");
  }

  const bodyResult = await parseBody(request);
  if ("error" in bodyResult) return badRequest(bodyResult.error);

  const result = applyAgWorkResumeMappingProposalLifecycleAction({
    proposal_id: bodyResult.proposal_id,
    action: bodyResult.action,
    reviewed_by: bodyResult.reviewed_by,
    review_note: bodyResult.review_note,
    reviewed_at: bodyResult.reviewed_at,
    replacement_proposal_id: bodyResult.replacement_proposal_id,
    superseded_by_proposal_id: bodyResult.superseded_by_proposal_id,
  });

  return NextResponse.json(
    {
      ok: result.ok,
      route: ROUTE_ID,
      result,
      authority_boundary: result.authority_boundary,
      recommended_next_step:
        "User/Core may review the lifecycle result. This route updates proposal review metadata only and is not mapping confirmation, import authorization, proof/evidence authorization, session binding, Codex execution authority, or merge/publish authority.",
    },
    { status: statusForResult(result) },
  );
}

function acceptsJson(request: Request) {
  return (request.headers.get("content-type") ?? "")
    .toLowerCase()
    .includes("application/json");
}

async function parseBody(
  request: Request,
): Promise<LifecycleRouteBody | { error: string }> {
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

  const unsupportedFields = Object.keys(value).filter(
    (key) => !SUPPORTED_BODY_FIELDS.has(key),
  );
  if (unsupportedFields.length > 0) {
    return {
      error: `Unsupported lifecycle action request field(s): ${unsupportedFields.join(", ")}.`,
    };
  }

  return {
    proposal_id: value.proposal_id,
    action: value.action,
    reviewed_by: value.reviewed_by,
    review_note: value.review_note,
    reviewed_at: value.reviewed_at,
    replacement_proposal_id: value.replacement_proposal_id,
    superseded_by_proposal_id: value.superseded_by_proposal_id,
  };
}

function statusForResult(result: AgWorkResumeMappingProposalLifecycleActionResult) {
  if (result.status === "updated") return 200;
  if (result.status === "invalid_input") return 400;
  if (result.status === "not_found") return 404;
  if (result.status === "not_active") return 409;
  if (result.status === "replacement_not_found") return 404;
  return 500;
}

function badRequest(error: string) {
  return NextResponse.json(
    {
      ok: false,
      route: ROUTE_ID,
      error,
      recommended_next_step:
        "Stop. Provide valid AG Resume mapping proposal lifecycle action JSON.",
    },
    { status: 400 },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
