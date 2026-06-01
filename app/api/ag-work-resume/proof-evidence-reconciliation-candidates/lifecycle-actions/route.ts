import {
  applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction,
  type AgWorkResumeProofEvidenceReconciliationCandidateLifecycleResult,
} from "@/lib/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_ID =
  "ag_work_resume_proof_evidence_reconciliation_candidate_lifecycle_actions.v0_1";
const SUPPORTED_BODY_FIELDS = new Set([
  "candidate_id",
  "action",
  "reviewed_by",
  "review_note",
  "reviewed_at",
  "replacement_candidate_id",
  "superseded_by_candidate_id",
]);

type LifecycleRouteBody = {
  candidate_id?: unknown;
  action?: unknown;
  reviewed_by?: unknown;
  review_note?: unknown;
  reviewed_at?: unknown;
  replacement_candidate_id?: unknown;
  superseded_by_candidate_id?: unknown;
};

export async function POST(request: Request) {
  if (!acceptsJson(request)) {
    return badRequest("Request content-type must be application/json.");
  }

  const bodyResult = await parseBody(request);
  if ("error" in bodyResult) return badRequest(bodyResult.error);

  const result =
    applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction({
      candidate_id: bodyResult.candidate_id,
      action: bodyResult.action,
      reviewed_by: bodyResult.reviewed_by,
      review_note: bodyResult.review_note,
      reviewed_at: bodyResult.reviewed_at,
      replacement_candidate_id: bodyResult.replacement_candidate_id,
      superseded_by_candidate_id: bodyResult.superseded_by_candidate_id,
    });

  return NextResponse.json(
    {
      ok: result.ok,
      route: ROUTE_ID,
      result,
      authority_boundary: result.authority_boundary,
      recommended_next_step:
        "User/Core may review the candidate lifecycle result. This route updates reconciliation candidate review metadata only. accepted_for_future_recording is not proof/evidence recording and grants no session, Codex, work, approval, publish, retry, replay, or merge authority.",
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
      error: `Unsupported reconciliation candidate lifecycle request field(s): ${unsupportedFields.join(", ")}.`,
    };
  }

  return {
    candidate_id: value.candidate_id,
    action: value.action,
    reviewed_by: value.reviewed_by,
    review_note: value.review_note,
    reviewed_at: value.reviewed_at,
    replacement_candidate_id: value.replacement_candidate_id,
    superseded_by_candidate_id: value.superseded_by_candidate_id,
  };
}

function statusForResult(
  result: AgWorkResumeProofEvidenceReconciliationCandidateLifecycleResult,
) {
  if (result.status === "updated") return 200;
  if (result.status === "invalid_input") return 400;
  if (result.status === "not_found") return 404;
  if (result.status === "invalid_transition") return 409;
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
        "Stop. Provide valid AG Resume proof/evidence reconciliation candidate lifecycle action JSON.",
    },
    { status: 400 },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
