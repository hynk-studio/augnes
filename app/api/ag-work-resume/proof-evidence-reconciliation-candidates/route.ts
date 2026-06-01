import {
  createAgWorkResumeProofEvidenceReconciliationCandidate,
  type AgWorkResumeProofEvidenceReconciliationCandidateCreateResult,
} from "@/lib/ag-work-resume-proof-evidence-reconciliation-candidate";
import {
  readAgWorkResumeProofEvidenceReconciliationCandidates,
  type AgWorkResumeProofEvidenceReconciliationCandidateReadInput,
} from "@/lib/ag-work-resume-proof-evidence-reconciliation-candidate-read";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_ID = "ag_work_resume_proof_evidence_reconciliation_candidates.v0_1";
const READ_ROUTE_ID =
  "ag_work_resume_proof_evidence_reconciliation_candidate_read.v0_1";
const SUPPORTED_BODY_FIELDS = new Set([
  "import_id",
  "mapping_id",
  "foreign_ref_type",
  "foreign_ref_id",
  "local_target_scope",
  "local_target_work_id",
  "summary",
  "redaction_status",
  "proposed_by",
  "proposed_reason",
  "created_at",
]);
const READ_QUERY_PARAMS = new Set([
  "candidate_id",
  "import_id",
  "mapping_id",
  "foreign_ref_type",
  "foreign_ref_id",
  "local_target_scope",
  "local_target_work_id",
  "status",
  "proposed_by",
  "reviewed_by",
  "limit",
]);

type ReconciliationCandidateRouteBody = {
  import_id?: unknown;
  mapping_id?: unknown;
  foreign_ref_type?: unknown;
  foreign_ref_id?: unknown;
  local_target_scope?: unknown;
  local_target_work_id?: unknown;
  summary?: unknown;
  redaction_status?: unknown;
  proposed_by?: unknown;
  proposed_reason?: unknown;
  created_at?: unknown;
};

export async function POST(request: Request) {
  if (!acceptsJson(request)) {
    return badRequest("Request content-type must be application/json.");
  }

  const bodyResult = await parseBody(request);
  if ("error" in bodyResult) return badRequest(bodyResult.error);

  const result = createAgWorkResumeProofEvidenceReconciliationCandidate({
    import_id: bodyResult.import_id,
    mapping_id: bodyResult.mapping_id,
    foreign_ref_type: bodyResult.foreign_ref_type,
    foreign_ref_id: bodyResult.foreign_ref_id,
    local_target_scope: bodyResult.local_target_scope,
    local_target_work_id: bodyResult.local_target_work_id,
    summary: bodyResult.summary,
    redaction_status: bodyResult.redaction_status,
    proposed_by: bodyResult.proposed_by,
    proposed_reason: bodyResult.proposed_reason,
    created_at: bodyResult.created_at,
  });

  return NextResponse.json(
    {
      ok: result.ok,
      route: ROUTE_ID,
      result,
      authority_boundary: result.authority_boundary,
      recommended_next_step:
        "User/Core may review the reconciliation candidate metadata. This route is not proof/evidence recording, session binding, Codex execution authority, work item/event creation, approval, publish, retry, replay, or merge authority.",
    },
    { status: statusForResult(result) },
  );
}

export function GET(request: Request) {
  if (request.body !== null) {
    return badReadRequest(
      "GET reconciliation candidate reads do not accept a body.",
    );
  }

  const { searchParams } = new URL(request.url);
  const input = parseReadQuery(searchParams);
  if ("error" in input) return badReadRequest(input.error);

  const result = readAgWorkResumeProofEvidenceReconciliationCandidates(input);

  return NextResponse.json(
    {
      ok: result.ok,
      route: READ_ROUTE_ID,
      result,
      authority_boundary: result.authority_boundary,
      recommended_next_step:
        "User/Core may review reconciliation candidate metadata. This read route is not proof/evidence recording, session binding, Codex execution authority, work item/event creation, approval, publish, retry, replay, or merge authority.",
    },
    { status: statusForReadResult(result.status) },
  );
}

function parseReadQuery(
  searchParams: URLSearchParams,
): AgWorkResumeProofEvidenceReconciliationCandidateReadInput | { error: string } {
  for (const key of searchParams.keys()) {
    if (!READ_QUERY_PARAMS.has(key)) {
      return { error: `Unsupported read query parameter: ${key}.` };
    }
    if (searchParams.getAll(key).length > 1) {
      return { error: `Read query parameter must not be repeated: ${key}.` };
    }
  }

  return {
    candidate_id: searchParams.get("candidate_id"),
    import_id: searchParams.get("import_id"),
    mapping_id: searchParams.get("mapping_id"),
    foreign_ref_type: searchParams.get("foreign_ref_type"),
    foreign_ref_id: searchParams.get("foreign_ref_id"),
    local_target_scope: searchParams.get("local_target_scope"),
    local_target_work_id: searchParams.get("local_target_work_id"),
    status: searchParams.get("status"),
    proposed_by: searchParams.get("proposed_by"),
    reviewed_by: searchParams.get("reviewed_by"),
    limit: searchParams.get("limit"),
  };
}

async function parseBody(
  request: Request,
): Promise<ReconciliationCandidateRouteBody | { error: string }> {
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
      error: `Unsupported reconciliation candidate request field(s): ${unsupportedFields.join(", ")}.`,
    };
  }

  return {
    import_id: value.import_id,
    mapping_id: value.mapping_id,
    foreign_ref_type: value.foreign_ref_type,
    foreign_ref_id: value.foreign_ref_id,
    local_target_scope: value.local_target_scope,
    local_target_work_id: value.local_target_work_id,
    summary: value.summary,
    redaction_status: value.redaction_status,
    proposed_by: value.proposed_by,
    proposed_reason: value.proposed_reason,
    created_at: value.created_at,
  };
}

function acceptsJson(request: Request) {
  return (request.headers.get("content-type") ?? "")
    .toLowerCase()
    .includes("application/json");
}

function statusForResult(
  result: AgWorkResumeProofEvidenceReconciliationCandidateCreateResult,
) {
  if (result.status === "created") return 201;
  if (result.status === "invalid_input") return 400;
  if (result.status === "imported_context_not_found") return 404;
  if (result.status === "imported_context_not_allowed") return 409;
  if (result.status === "imported_context_mismatch") return 409;
  if (result.status === "redaction_blocked") return 400;
  if (result.status === "duplicate_candidate") return 409;
  return 500;
}

function statusForReadResult(status: string) {
  if (status === "fetched" || status === "listed") return 200;
  if (status === "invalid_input") return 400;
  if (status === "not_found") return 404;
  return 500;
}

function badRequest(error: string) {
  return NextResponse.json(
    {
      ok: false,
      route: ROUTE_ID,
      error,
      recommended_next_step:
        "Stop. Provide valid AG Resume proof/evidence reconciliation candidate creation JSON.",
    },
    { status: 400 },
  );
}

function badReadRequest(error: string) {
  return NextResponse.json(
    {
      ok: false,
      route: READ_ROUTE_ID,
      error,
      recommended_next_step:
        "Stop. Provide supported AG Resume proof/evidence reconciliation candidate read query parameters only.",
    },
    { status: 400 },
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
