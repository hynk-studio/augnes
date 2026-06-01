import {
  createAgWorkResumeProofEvidenceRecordingFromCandidate,
  type AgWorkResumeProofEvidenceRecordingAuthorityBoundary,
  type AgWorkResumeProofEvidenceRecordingResult,
  type AgWorkResumeProofEvidenceRecordingResultName,
} from "@/lib/ag-work-resume-proof-evidence-recording";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE_ID = "ag_work_resume_proof_evidence_recordings.v0_1";
const AUTHORITY_STATEMENT =
  "AG Resume proof/evidence recording route is a thin HTTP boundary over createAgWorkResumeProofEvidenceRecordingFromCandidate. It requires exact per-attempt user/Core approval and grants no session, Codex, work/action, source-row mutation, approval, publish, retry, replay, merge, auto-merge, external posting, or committed-state authority.";
const SUPPORTED_BODY_FIELDS = new Set([
  "candidate_id",
  "import_id",
  "mapping_id",
  "user_core_approval",
  "actor",
  "reason",
  "redaction_summary",
  "trust_provenance_label",
  "local_target_scope",
  "local_target_work_id",
  "expected_idempotency_key",
]);
const FORBIDDEN_BODY_FIELDS = new Set([
  "db",
  "now",
  "route_path",
  "route_method",
  "content_type",
  "session_id",
  "bind_session",
  "codex_session_id",
  "codex_continue",
  "codex_execute",
  "work_item",
  "work_item_create",
  "work_event",
  "work_event_create",
  "action_id",
  "action_record",
  "target_action_id",
  "evidence_id",
  "recording_link_id",
  "mutate_imported_context",
  "mutate_confirmed_mapping",
  "mutate_proposal",
  "mutate_candidate",
  "approval_request_id",
  "approval_decision_id",
  "publish",
  "retry",
  "replay",
  "merge",
  "auto_merge",
  "external_post",
  "committed_state",
  "direct_resume_code",
  "relay_transfer",
  "hosted_transfer",
]);

type RecordingRouteBody = {
  candidate_id?: unknown;
  import_id?: unknown;
  mapping_id?: unknown;
  user_core_approval?: unknown;
  actor?: unknown;
  reason?: unknown;
  redaction_summary?: unknown;
  trust_provenance_label?: unknown;
  local_target_scope?: unknown;
  local_target_work_id?: unknown;
  expected_idempotency_key?: unknown;
};

type RouteValidationResult =
  | "unsupported_method"
  | "unsupported_content_type"
  | "invalid_json"
  | "non_object_json"
  | "unsupported_field"
  | "forbidden_field";

type RecordingRouteResultName =
  | AgWorkResumeProofEvidenceRecordingResultName
  | RouteValidationResult;

type RecordingRouteResponse = {
  ok: boolean;
  route: typeof ROUTE_ID;
  result: RecordingRouteResultName;
  created: boolean;
  candidate_id: string | null;
  evidence_id: string | null;
  recording_link_id: string | null;
  idempotency_key: string | null;
  target_record_kind: "verification_evidence" | null;
  warnings: string[];
  failures: string[];
  authority_boundary: AgWorkResumeProofEvidenceRecordingAuthorityBoundary;
  recommended_next_step: string;
};

export async function POST(request: Request) {
  if (!acceptsJson(request)) {
    return routeFailure({
      result: "unsupported_content_type",
      status: 415,
      failures: ["Request content-type must be application/json."],
      recommended_next_step:
        "Stop. Submit one application/json AG Resume proof/evidence recording request.",
    });
  }

  const bodyResult = await parseBody(request);
  if ("error" in bodyResult) {
    return routeFailure({
      result: bodyResult.result,
      status: 400,
      failures: [bodyResult.error],
      recommended_next_step: bodyResult.recommended_next_step,
    });
  }

  let result: AgWorkResumeProofEvidenceRecordingResult;
  try {
    result = createAgWorkResumeProofEvidenceRecordingFromCandidate({
      candidate_id: bodyResult.candidate_id,
      import_id: bodyResult.import_id,
      mapping_id: bodyResult.mapping_id,
      user_core_approval: bodyResult.user_core_approval,
      actor: bodyResult.actor,
      reason: bodyResult.reason,
      redaction_summary: bodyResult.redaction_summary,
      trust_provenance_label: bodyResult.trust_provenance_label,
      local_target_scope: bodyResult.local_target_scope,
      local_target_work_id: bodyResult.local_target_work_id,
      expected_idempotency_key: bodyResult.expected_idempotency_key,
    });
  } catch {
    return routeFailure({
      result: "db_error",
      status: 500,
      failures: ["Database recording failed. Inspect local logs before retrying."],
      recommended_next_step:
        "Stop. Inspect local database availability before retrying recording.",
    });
  }

  return NextResponse.json(responseFromHelperResult(result), {
    status: statusForHelperResult(result.result),
  });
}

export function GET() {
  return methodNotAllowed();
}

export function PUT() {
  return methodNotAllowed();
}

export function PATCH() {
  return methodNotAllowed();
}

export function DELETE() {
  return methodNotAllowed();
}

function acceptsJson(request: Request) {
  return (request.headers.get("content-type") ?? "")
    .toLowerCase()
    .includes("application/json");
}

async function parseBody(
  request: Request,
): Promise<
  | RecordingRouteBody
  | {
      error: string;
      result: RouteValidationResult;
      recommended_next_step: string;
    }
> {
  let value: unknown;
  try {
    const text = await request.text();
    value = text.trim().length > 0 ? JSON.parse(text) : null;
  } catch {
    return {
      error: "Invalid JSON request body.",
      result: "invalid_json",
      recommended_next_step:
        "Stop. Provide valid JSON for exactly one AG Resume proof/evidence recording attempt.",
    };
  }

  if (!isRecord(value)) {
    return {
      error: "Request body must be a JSON object.",
      result: "non_object_json",
      recommended_next_step:
        "Stop. Provide a JSON object with candidate_id and exact user_core_approval.",
    };
  }

  const forbiddenFields = Object.keys(value).filter((key) =>
    FORBIDDEN_BODY_FIELDS.has(key),
  );
  if (forbiddenFields.length > 0) {
    return {
      error: `Forbidden proof/evidence recording route field(s): ${forbiddenFields.join(", ")}.`,
      result: "forbidden_field",
      recommended_next_step:
        "Stop. Remove authority, mutation, route-control, session, Codex, work, action, publish, retry, replay, merge, external-posting, or implementation-internal fields.",
    };
  }

  const unsupportedFields = Object.keys(value).filter(
    (key) => !SUPPORTED_BODY_FIELDS.has(key),
  );
  if (unsupportedFields.length > 0) {
    return {
      error: `Unsupported proof/evidence recording route field(s): ${unsupportedFields.join(", ")}.`,
      result: "unsupported_field",
      recommended_next_step:
        "Stop. Submit only the supported AG Resume proof/evidence recording request fields.",
    };
  }

  return {
    candidate_id: value.candidate_id,
    import_id: value.import_id,
    mapping_id: value.mapping_id,
    user_core_approval: value.user_core_approval,
    actor: value.actor,
    reason: value.reason,
    redaction_summary: value.redaction_summary,
    trust_provenance_label: value.trust_provenance_label,
    local_target_scope: value.local_target_scope,
    local_target_work_id: value.local_target_work_id,
    expected_idempotency_key: value.expected_idempotency_key,
  };
}

function responseFromHelperResult(
  result: AgWorkResumeProofEvidenceRecordingResult,
): RecordingRouteResponse {
  return {
    ok: result.ok,
    route: ROUTE_ID,
    result: result.result,
    created: result.created,
    candidate_id: result.candidate_id,
    evidence_id: result.evidence_id,
    recording_link_id: result.recording_link_id,
    idempotency_key: result.idempotency_key,
    target_record_kind: result.target_record_kind,
    warnings: sanitizeTexts(result.warnings),
    failures: publicFailures(result),
    authority_boundary: result.authority_boundary,
    recommended_next_step: publicText(result.recommended_next_step),
  };
}

function publicFailures(result: AgWorkResumeProofEvidenceRecordingResult) {
  if (result.result === "db_error") {
    return ["Database recording failed. Inspect local logs before retrying."];
  }
  if (result.result === "fk_or_unique_failure") {
    return [
      "Database constraint prevented recording. The transaction rolled back with no partial recording.",
    ];
  }
  return sanitizeTexts(result.failures);
}

function routeFailure({
  result,
  status,
  failures,
  recommended_next_step,
}: {
  result: RecordingRouteResultName;
  status: number;
  failures: string[];
  recommended_next_step: string;
}) {
  return NextResponse.json(
    {
      ok: false,
      route: ROUTE_ID,
      result,
      created: false,
      candidate_id: null,
      evidence_id: null,
      recording_link_id: null,
      idempotency_key: null,
      target_record_kind: null,
      warnings: [],
      failures: sanitizeTexts(failures),
      authority_boundary: buildRouteAuthorityBoundary(),
      recommended_next_step: publicText(recommended_next_step),
    } satisfies RecordingRouteResponse,
    { status },
  );
}

function methodNotAllowed() {
  return routeFailure({
    result: "unsupported_method",
    status: 405,
    failures: ["Use POST for AG Resume proof/evidence recording requests."],
    recommended_next_step:
      "Stop. Submit the request with POST and application/json.",
  });
}

function statusForHelperResult(
  result: AgWorkResumeProofEvidenceRecordingResultName,
) {
  if (result === "recorded") return 201;
  if (result === "idempotent_no_new_write") return 200;
  if (result === "unauthorized_attempt") return 403;
  if (result === "invalid_candidate") return 409;
  if (result === "source_cross_check_failed") return 409;
  if (result === "missing_source_rows") return 404;
  if (result === "unsafe_redaction") return 422;
  if (result === "invalid_actor_reason") return 422;
  if (result === "invalid_trust_provenance") return 422;
  if (result === "duplicate_conflict") return 409;
  if (result === "fk_or_unique_failure") return 409;
  if (result === "db_error") return 500;
  return 500;
}

function buildRouteAuthorityBoundary(): AgWorkResumeProofEvidenceRecordingAuthorityBoundary {
  return {
    exact_user_core_approval_required: true,
    verification_evidence_record_created: false,
    bridge_link_created: false,
    proof_recorded: false,
    action_record_created: false,
    route_added: false,
    ui_added: false,
    session_bound: false,
    codex_executed: false,
    codex_continued: false,
    work_item_created: false,
    work_event_created: false,
    imported_context_mutated: false,
    confirmed_mapping_mutated: false,
    proposal_record_mutated: false,
    reconciliation_candidate_mutated: false,
    approval_granted: false,
    publish_retry_replay_authority: false,
    merge_authority: false,
    auto_merge_authority: false,
    external_posting_authority: false,
    committed_state_mutated: false,
    allowed_insert_tables: [
      "verification_evidence_records",
      "ag_work_resume_proof_evidence_recording_links",
    ],
    statement: AUTHORITY_STATEMENT,
  };
}

function sanitizeTexts(values: string[]) {
  return values.map(publicText);
}

function publicText(value: string) {
  return value
    .replace(/\/Users\/[^\s"'`]+/g, "[local-path-redacted]")
    .replace(/\bsk-[A-Za-z0-9_-]+/g, "[token-redacted]")
    .replace(/\bgh[pousr]_[A-Za-z0-9_]+/g, "[token-redacted]")
    .slice(0, 600);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
