import { randomUUID } from "node:crypto";
import { isHistoricalProjectSelectionRevision } from "@/lib/vnext/project-selection";
import type { ProjectSelectionRevision } from "@/lib/vnext/project-selection";
import type Database from "better-sqlite3";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import { normalizeWorkId } from "@/lib/work";
import { buildSelectedWorkSourceEntry, compareSelectedWorkSources, readSelectedWorkSources, selectedWorkSourceInput, assertReviewedOutcomeSourcesRetained, SelectedWorkSourceError } from "@/lib/intake/selected-work-source-comparison";
import { buildTaskContextPacketV01, validateTaskContextPacketV01 } from "../task-context-packet";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash, parseStrictIsoTimestampV01 } from "../protocol-primitives";
import { STATELESS_WORK, STATELESS_TERMINAL_WORK, STATELESS_TERMINAL_CONTEXT, statelessTerminalEntries, statelessMandatoryEntries, readSourceReview, reviewCheck as check, reviewObject, reviewText, reviewSha, StatelessReviewError, type SourceReview } from "../stateless-work";
import { readStatelessFailureReviews } from "../stateless-review-failure";
import { readStatelessGrant, buildStatelessModelInvocationGrant } from "../persistence/stateless-work-grant";
import { insertVNextCoreRecordV01 } from "../persistence/durable-semantic-store";
import { readProjectWorkBindingV01 } from "./project-work-binding";
import { effectiveDirection, directionCurrent, assertPacketDirectionCurrent, ProjectDirectionError } from "../persistence/project-direction-store";
import { directionSource, selectedDirectionProfile, DIRECTION_SOURCE } from "../project-direction-source";
import { validateModelInvocationReceiptV02, ModelInvocationReceiptValidationErrorV02 } from "../model-gateway/model-invocation-receipt";
import { readProjectRunResultSourceBindingV01, ProjectRunResultReadErrorV01 } from "./project-run-result-read-model";
import { readRun, stateOf } from "./stateless-review-ledger";
import { readHistoricalStatelessPacket, readStatelessDisposition, assertHistoricalStatelessSession, assertStatelessUnsettledAdmission } from "./stateless-review-disposition";
import { rootBinding, prepareMaterial } from "./stateless-source-review";
import { normalizeInitialProjectWorkDefinitionV01 } from "./initial-project-work-context";
import { inspectVNextOperatorPilotPacketLineageV01, readCurrentProjectWorkPacketLineageV01 } from "./operator-pilot-project-continuity";
import { admitVNextLocalOperatorMutationInsideTransactionV01, type VNextLocalOperatorPilotConfigV01 as Config, type VNextLocalOperatorSessionCredentialV01 as Credential } from "./local-operator-session";
import { VNEXT_OPERATOR_PILOT_LATER_PACKET_TTL_MS_V01 } from "./operator-pilot-semantic-transition";
import { DURABLE_AUTHORED_WORK_V01 } from "@/types/vnext/project-work-initialization";

type Scope = Pick<Config, "workspace_id" | "project_id">;
const digest = (v: unknown) => hash(canonical(v));
const equal = (a: unknown, b: unknown) => canonical(a) === canonical(b);
const WARNING = "A prior bounded attempt received a model response but stopped without a work receipt. Its retained response is advice, not accepted state; an unavailable rejection cause is not evidence of semantic invalidity. No prior allowance is reused and inherited unknown effects remain unresolved.";
const MATERIAL = `${STATELESS_TERMINAL_WORK}:source`;
export interface TerminalAttemptBinding {
  run_id: string; step_id: string; generation: string; revision: number;
  packet_id: string; packet_fingerprint: string; grant_id: string; grant_fingerprint: string;
  receipt_fingerprint: string; history_fingerprint: string;
}

/** Historical validation, never current permission. A failed model step with a
 * completed Gateway receipt is distinct from unknown dispatch or receipt repair.
 * Recovery changes only its suspension bit; lineage remains readable. */
export function readTerminalAttemptHistory(db: Database.Database, scope: Scope, runId: string) {
  const run = readRun(db, scope, runId), state = stateOf(run), grant = readStatelessGrant(db, { ...scope, ...state });
  const persistenceFailed = run.stop_reason === "result_persistence_failed_no_retry";
  check(run.autonomy_contract_ref === STATELESS_WORK && run.status === "stopped" && !state.cancelled &&
    (persistenceFailed || run.stop_reason === "invocation_refused_or_result_invalid_no_retry") && run.metadata.reconciliation_required === false &&
    run.metadata.stateless_review_disposition === undefined && run.metadata.run_receipt_id == null && run.metadata.terminal_receipt_persisted !== true &&
    run.run_id === `stateless-review:${grant.grant_id.slice("stateless-grant:".length)}` && run.metadata.work_id === normalizeWorkId(runId) &&
    run.metadata.packet_id === grant.request.packet_id && run.metadata.packet_fingerprint === grant.request.packet_fingerprint,
  "terminal_authorship_shape_unsupported");
  check(!db.prepare("SELECT 1 FROM vnext_core_records WHERE workspace_id=? AND project_id=? AND record_kind='run_receipt' AND json_extract(payload_json,'$.run_id')=? LIMIT 1").get(scope.workspace_id, scope.project_id, runId), "terminal_authorship_receipt_present");
  const failed = run.steps.filter(s => s.status === "failed");
  check(failed.length === 1 && [1, 3].includes(failed[0]!.step_index), "terminal_authorship_failed_model_required");
  const step = failed[0]!;
  check(run.steps.every((s, i) => s.step_id === `${runId}.${["choose", "observe", "conclude"][i]}` &&
    s.action_kind === (i === 1 ? "invoke_project_scoped_host_adapter" : "invoke_project_scoped_model_gateway") &&
    (s.step_index < step.step_index ? s.status === "completed" : s.step_index > step.step_index ? s.status === "planned" : true)) &&
    step.output.dispatch_outcome === (persistenceFailed ? "returned_unapplied" : "returned_invalid") && step.output.judgment === undefined && step.output.result_fingerprint === undefined,
  "terminal_authorship_step_shape_unsupported");
  const generation = reviewText(step.output.generation, 100), input = reviewSha(step.output.input_fingerprint);
  check(step.output.failure_receipt != null, "terminal_authorship_receipt_unavailable");
  const receipt = validateModelInvocationReceiptV02(step.output.failure_receipt);
  const modelGrant = buildStatelessModelInvocationGrant(grant, { work_id: String(run.metadata.work_id), run_id: runId, stage: step.title });
  check(receipt.workspace_id === scope.workspace_id && receipt.project_id === scope.project_id && receipt.run_id === runId && receipt.work_id === run.metadata.work_id &&
    receipt.invocation_id === step.step_id && receipt.purpose === "planner_plan" && receipt.invocation_origin === "policy_triggered" &&
    receipt.requested_mode === "live" && receipt.execution_mode === "live",
  "terminal_authorship_returned_receipt_required");
  check(receipt.status === "completed" && receipt.outcome === "live_success", "terminal_authorship_response_unavailable");
  check(
    receipt.egress_attempted && receipt.egress_status === "occurred" && receipt.failure_code === null && receipt.budget.decision === "within_budget" &&
    receipt.grant_lineage_ref?.external_id === modelGrant.grant_id && receipt.grant_lineage_ref.source_ref === modelGrant.lineage_fingerprint &&
    receipt.automation_control_lineage_ref?.source_ref === `control-revision:${grant.request.control_revision}` &&
    equal(receipt.budget.cost_budget, grant.request.cost_budget) && receipt.provenance_refs.includes(input) &&
    receipt.started_at >= grant.issued_at && receipt.started_at < grant.request.expires_at &&
    step.started_at && step.finished_at && run.finished_at && receipt.started_at >= step.started_at && receipt.finished_at <= step.finished_at && step.finished_at <= run.finished_at,
  "terminal_authorship_returned_receipt_required");
  // Older completed receipts predate optional model_request_claim/evidence.
  if (step.output.model_request_claim !== undefined) {
    const claim = reviewObject(step.output.model_request_claim, ["generation", "invocation_id", "at"]);
    check(claim.generation === generation && claim.invocation_id === step.step_id && typeof claim.at === "string" && parseStrictIsoTimestampV01(claim.at) !== null &&
      claim.at >= step.started_at! && claim.at < grant.request.expires_at && claim.at <= receipt.finished_at, "terminal_authorship_claim_changed");
  }
  const failures = readStatelessFailureReviews(run);
  const evidence = failures.find(e => e.step_id === step.step_id);
  check(evidence && !(evidence.availability === "unavailable" && evidence.reason === "invalid_record"), "terminal_authorship_evidence_invalid");
  if (persistenceFailed) {
    check(evidence.availability === "available", "terminal_authorship_persistence_evidence_unavailable");
    // A persistence error rolls back any open result transaction before the
    // same claim's failure and stopped status commit together. Every
    // controller rechecks terminal status/generation before another publication.
    // Unlike legacy host rejection, missing classification cannot admit this path.
    check(step.error_message === run.stop_reason && step.output.model_request_claim !== undefined &&
      step.output.model_receipt === undefined && failures.length === 1 &&
      !run.events.some(e => e.step_id === step.step_id && e.event_type === "step_completed") &&
      evidence.availability === "available" && evidence.evidence.layer === "result_persistence" &&
      evidence.evidence.code === "result_persistence_failed" && evidence.evidence.host_rejection_code === null && evidence.evidence.validation === null &&
      evidence.evidence.binding.observation_fingerprint === (step.step_index === 3 ? run.steps[1]!.output.observation_fingerprint : null),
    "terminal_authorship_persistence_evidence_required");
  }
  if (evidence.availability === "available") check(evidence.evidence.layer === (persistenceFailed ? "result_persistence" : "host_validation") &&
    evidence.evidence.binding.input_fingerprint === input && evidence.evidence.binding.receipt_fingerprint === digest(receipt) &&
    evidence.evidence.binding.review_ref === grant.request.review_ref && evidence.evidence.binding.selected_notes_ref === (grant.request.selected_notes_ref ?? null), "terminal_authorship_failure_shape_unsupported");
  const packet = readHistoricalStatelessPacket(db, scope, grant.request.packet_id, grant.request.packet_fingerprint);
  const binding: TerminalAttemptBinding = { run_id: runId, step_id: step.step_id, generation, revision: state.revision,
    packet_id: packet.packet_id, packet_fingerprint: packet.integrity.fingerprint, grant_id: grant.grant_id, grant_fingerprint: grant.grant_fingerprint,
    receipt_fingerprint: digest(receipt), history_fingerprint: digest({ ...run, metadata: { ...run.metadata, stateless_review: { ...state, recovery_suspended: false } } }) };
  const availability = evidence.availability === "available"
    ? { public_result: evidence.evidence.public_result.availability, layer: evidence.evidence.layer, code: evidence.evidence.code }
    : { public_result: "unavailable", layer: "unavailable", code: "unavailable" };
  return { run, packet, binding, availability };
}

export interface TerminalAuthorshipPreparation {
  binding: TerminalAttemptBinding;
  evidence: ReturnType<typeof readTerminalAttemptHistory>["availability"];
  definition: TaskContextPacketV01["task"];
  sources: ReturnType<typeof readSelectedWorkSources>;
  warning: string;
  recovery_suspended: boolean;
  current_direction_source: ReturnType<typeof directionSource> | null;
}
type BlockedReason = "attempt_not_stopped" | "unresolved_effects" | "completed_response_unavailable" | "work_receipt_present" |
  "work_receipt_unavailable" | "history_missing" | "grant_missing" | "packet_missing" | "receipt_unavailable" | "failure_evidence_unavailable";
type FailedReason = "history_invalid" | "grant_invalid" | "packet_invalid" | "receipt_invalid" | "failure_evidence_invalid" |
  "source_context_invalid" | "inspection_failed";
export type TerminalPreparationResult =
  | { status: "available"; preparation: TerminalAuthorshipPreparation }
  | { status: "not_applicable"; reason: "completed_work"; next_action: "none" }
  | { status: "blocked"; reason: BlockedReason; next_action: "read_again" | "review_history" }
  | { status: "failed"; reason: FailedReason; next_action: "read_again"; diagnostic_ref: string };

const blockedReasons = {
  terminal_authorship_history_unavailable: "history_missing", grant_missing: "grant_missing", grant_packet_missing: "packet_missing",
  terminal_authorship_receipt_unavailable: "receipt_unavailable",
  terminal_authorship_response_unavailable: "completed_response_unavailable",
  terminal_authorship_persistence_evidence_unavailable: "failure_evidence_unavailable",
  terminal_authorship_receipt_present: "work_receipt_present",
} as const satisfies Record<string, BlockedReason>;
const failedReasons = {
  grant_invalid: "grant_invalid", grant_binding: "grant_invalid", grant_source_conflict: "packet_invalid",
  grant_packet_mismatch: "packet_invalid", disposition_packet_missing: "packet_invalid", disposition_packet_invalid: "packet_invalid",
  terminal_authorship_returned_receipt_required: "receipt_invalid", terminal_authorship_evidence_invalid: "failure_evidence_invalid",
  terminal_authorship_persistence_evidence_required: "failure_evidence_invalid", terminal_authorship_failure_shape_unsupported: "failure_evidence_invalid",
} as const satisfies Record<string, FailedReason>;
function inspectionDiagnostic(error: unknown) {
  // Inspect only an own data property; never execute exception getters or
  // serialize the exception. These codes are observations, not recovery advice.
  let code: unknown;
  try { code = error && typeof error === "object" ? Object.getOwnPropertyDescriptor(error, "code")?.value : null; } catch { code = null; }
  const codes = ["SQLITE_BUSY", "SQLITE_LOCKED", "SQLITE_CORRUPT", "SQLITE_IOERR", "SQLITE_ERROR", "EACCES", "EPERM", "ENOENT"];
  return { error_type: error instanceof TypeError ? "TypeError" : error instanceof SyntaxError ? "SyntaxError" : error instanceof Error ? "Error" : "unknown",
    error_code: typeof code === "string" && codes.includes(code) ? code : null };
}

/** Inspection has no writer, route lookup, grant issuance or provider dispatch.
 * Only a validated completed result establishes inapplicability. A refusal or
 * missing/invalid history never proves that no attempt or obligation exists. */
export function readTerminalAuthorshipPreparation(db: Database.Database, config: Config, runId: string, at = new Date().toISOString()): TerminalPreparationResult {
  let phase: "history" | "completed_result" | "sources" | "direction" = "history";
  try {
    // Absence is scoped to this project. A foreign run must be indistinguishable
    // from a missing one, including at the unchanged execution-route boundary.
    check(db.prepare("SELECT 1 FROM autonomy_runs WHERE run_id=? AND scope=? AND json_extract(metadata_json,'$.workspace_id')=? AND json_extract(metadata_json,'$.project_id')=?")
      .get(runId, config.project_id, config.workspace_id, config.project_id), "terminal_authorship_history_unavailable");
    const run = readRun(db, config, runId);
    // Validate original authority even for known unavailable prerequisites.
    const grant = readStatelessGrant(db, { ...config, ...stateOf(run) });
    check(run.autonomy_contract_ref === STATELESS_WORK &&
      run.run_id === `stateless-review:${grant.grant_id.slice("stateless-grant:".length)}` &&
      run.metadata.work_id === normalizeWorkId(runId) && run.metadata.packet_id === grant.request.packet_id &&
      run.metadata.packet_fingerprint === grant.request.packet_fingerprint, "terminal_authorship_shape_unsupported");
    if (run.status === "completed") {
      phase = "completed_result";
      check(run.autonomy_contract_ref === STATELESS_WORK && typeof run.metadata.run_receipt_id === "string" &&
        run.metadata.reconciliation_required === false && run.metadata.stateless_review_disposition === undefined &&
        !stateOf(run).cancelled && run.steps.every(step => step.status === "completed"), "terminal_authorship_completed_history_invalid");
      const result = readProjectRunResultSourceBindingV01(db, { ...config, receipt_id: run.metadata.run_receipt_id });
      check(result.receipt.run_id === runId && result.packet && result.packet.packet_id === run.metadata.packet_id &&
        result.packet.integrity.fingerprint === run.metadata.packet_fingerprint, "terminal_authorship_completed_history_invalid");
      return { status: "not_applicable", reason: "completed_work", next_action: "none" };
    }
    // An invalid saved disposition is a validation failure, never proof of a
    // supported recovery path. Its existing owner validates historical bindings.
    if (run.metadata.stateless_review_disposition !== undefined) readStatelessDisposition(db, config, run);
    if (run.metadata.reconciliation_required === true || run.metadata.stateless_review_disposition !== undefined)
      return { status: "blocked", reason: "unresolved_effects", next_action: "review_history" };
    if (["planned", "running", "paused", "cancelled"].includes(run.status))
      return { status: "blocked", reason: "attempt_not_stopped", next_action: "read_again" };
    if (run.status === "stopped" && run.stop_reason === "receipt_persistence_failed_no_retry" &&
      run.metadata.run_receipt_id == null && run.steps.every(step => step.status === "completed")) {
      const failures = readStatelessFailureReviews(run);
      check(!failures.some(item => item.availability === "unavailable" && item.reason === "invalid_record"), "terminal_authorship_evidence_invalid");
      check(failures.some(item => item.availability === "available" && item.evidence.layer === "receipt_persistence" && item.evidence.code === "receipt_persistence_failed"),
        "terminal_authorship_persistence_evidence_unavailable");
      return { status: "blocked", reason: "work_receipt_unavailable", next_action: "review_history" };
    }
    const failed = run.steps.filter(step => step.status === "failed");
    if (run.status === "stopped" && failed.length === 1 && [1, 3].includes(failed[0]!.step_index) &&
      ["not_issued", "returned_incomplete"].includes(String(failed[0]!.output.dispatch_outcome))) {
      const step = failed[0]!;
      const evidence = readStatelessFailureReviews(run).find(item => item.step_id === step.step_id);
      check(evidence && !(evidence.availability === "unavailable" && evidence.reason === "invalid_record"), "terminal_authorship_evidence_invalid");
      if (step.output.failure_receipt != null) {
        const receipt = validateModelInvocationReceiptV02(step.output.failure_receipt);
        check(receipt.workspace_id === config.workspace_id && receipt.project_id === config.project_id &&
          receipt.run_id === runId && receipt.work_id === run.metadata.work_id && receipt.invocation_id === step.step_id &&
          receipt.status !== "completed", "terminal_authorship_returned_receipt_required");
      }
      return { status: "blocked", reason: "completed_response_unavailable", next_action: "review_history" };
    }
    if (run.status === "stopped" && ["attempt_time_limit_before_dispatch", "model_input_bound_before_dispatch", "next_stage_admission_refused"].includes(run.stop_reason ?? "") &&
      run.steps.every(step => ["planned", "completed"].includes(step.status)))
      return { status: "blocked", reason: "completed_response_unavailable", next_action: "review_history" };
    if (run.status === "stopped" && run.stop_reason === "first_judgment_stopped_work" && run.steps[0]!.status === "completed" &&
      (run.steps[0]!.output.judgment as {tool_name?:unknown} | undefined)?.tool_name === "stop" &&
      run.steps.slice(1).every(step => step.status === "skipped" && step.output.reason === "first_judgment_stopped_work"))
      return { status: "blocked", reason: "completed_response_unavailable", next_action: "review_history" };
    const h = readTerminalAttemptHistory(db, config, runId);
    phase = "sources";
    const sources = readSelectedWorkSources(h.packet);
    phase = "direction";
    const direction = effectiveDirection(db, config, at);
    return { status: "available", preparation: { binding: h.binding, evidence: h.availability, definition: h.packet.task, sources, warning: WARNING,
      recovery_suspended: stateOf(h.run).recovery_suspended, current_direction_source: direction ? directionSource(direction) : null } };
  } catch (error) {
    if (error instanceof ProjectRunResultReadErrorV01 && error.code === "project_result_receipt_missing")
      return { status: "blocked", reason: "receipt_unavailable", next_action: "read_again" };
    if (error instanceof StatelessReviewError && Object.hasOwn(blockedReasons, error.code))
      return { status: "blocked", reason: blockedReasons[error.code as keyof typeof blockedReasons], next_action: "read_again" };
    const reason: FailedReason = error instanceof StatelessReviewError
      ? Object.hasOwn(failedReasons, error.code) ? failedReasons[error.code as keyof typeof failedReasons] : "history_invalid"
      : error instanceof ModelInvocationReceiptValidationErrorV02 ? "receipt_invalid"
      : error instanceof ProjectRunResultReadErrorV01 ? "receipt_invalid"
      : error instanceof SelectedWorkSourceError || error instanceof ProjectDirectionError ? "source_context_invalid" : "inspection_failed";
    const diagnostic_ref = `terminal-preparation:${randomUUID()}`;
    // The supervisor already owns bounded child stderr/tails. Send a correlated
    // fixed-shape observation there, never exception text, SQL, paths or stacks.
    console.error(JSON.stringify({ event: "terminal_preparation_inspection_failed", diagnostic_ref, phase, reason,
      ...inspectionDiagnostic(error),
      failure_kind: error instanceof StatelessReviewError || error instanceof ModelInvocationReceiptValidationErrorV02 || error instanceof ProjectRunResultReadErrorV01 || error instanceof SelectedWorkSourceError || error instanceof ProjectDirectionError ? "domain_validation" : "unexpected_exception" }));
    return { status: "failed", reason, next_action: "read_again", diagnostic_ref };
  }
}

interface Request { predecessor: TerminalAttemptBinding; definition: TaskContextPacketV01["task"]; material: unknown; notes: unknown[]; omitted_sources: Array<{ source_binding: string; reason: string }> }
interface PreviewMaterial {
  resumes_packet?: { packet_id: string; packet_fingerprint: string };
  predecessor: TerminalAttemptBinding; definition: TaskContextPacketV01["task"]; review: SourceReview;
  selected: ReturnType<typeof readSelectedWorkSources>; omitted_sources: Request["omitted_sources"]; comparison_fingerprint: string;
  root_fingerprint: string; direction_ref: string | null; selection_revision?: ProjectSelectionRevision; project_work_binding?: string;
}
interface Material extends PreviewMaterial { session_id: string; operator_id: string; work_lifetime?: typeof DURABLE_AUTHORED_WORK_V01 }
// A saved definition is durable context. New previews bind the target root and
// direction; historical bindings remain attributable without constraining reentry.
function savedDefinition(m: Material | PreviewMaterial) {
  const { selection_revision: _selection, project_work_binding: _binding, resumes_packet: _resume, ...rest } = m;
  const { session_id: _session, operator_id: _operator, work_lifetime: _lifetime, ...definition } = rest as Omit<Material, "selection_revision" | "resumes_packet">;
  return definition;
}
function requestFrom(value: unknown): Request {
  const r = reviewObject(value, ["predecessor", "definition", "material", "notes", "omitted_sources"]);
  const b = reviewObject(r.predecessor, ["run_id", "step_id", "generation", "revision", "packet_id", "packet_fingerprint", "grant_id", "grant_fingerprint", "receipt_fingerprint", "history_fingerprint"]);
  ["run_id", "step_id", "generation", "packet_id", "grant_id"].forEach(k => reviewText(b[k], 256));
  ["packet_fingerprint", "grant_fingerprint", "receipt_fingerprint", "history_fingerprint"].forEach(k => reviewSha(b[k]));
  check(Number.isSafeInteger(b.revision) && Number(b.revision) > 0 && Array.isArray(r.notes) && r.notes.length <= 8 && Array.isArray(r.omitted_sources) && r.omitted_sources.length <= 8, "terminal_authorship_request_invalid");
  const omitted = r.omitted_sources.map(v => { const o = reviewObject(v, ["source_binding", "reason"]); return { source_binding: reviewSha(o.source_binding), reason: reviewText(o.reason, 500) }; });
  check(new Set(omitted.map(o => o.source_binding)).size === omitted.length, "terminal_authorship_omissions_invalid");
  return { predecessor: b as unknown as TerminalAttemptBinding, definition: normalizeInitialProjectWorkDefinitionV01(reviewObject(r.definition, ["goal", "success_criteria", "non_goals"]) as { goal: unknown; success_criteria: unknown; non_goals: unknown }), material: r.material, notes: r.notes, omitted_sources: omitted };
}

function compileMaterial(db: Database.Database, config: Config, raw: unknown, at: string, requireOmissions: boolean) {
  const request = requestFrom(raw), h = readTerminalAttemptHistory(db, config, request.predecessor.run_id);
  check(equal(request.predecessor, h.binding) && !stateOf(h.run).recovery_suspended, "terminal_authorship_history_changed");
  const binding = readProjectWorkBindingV01(db, config);
  check(binding, "terminal_authorship_project_binding_unavailable");
  const { review, observed } = prepareMaterial(db, config, request.material, at);
  const notes = request.notes.map(n => {
    if (n && typeof n === "object" && "saved_source_id" in n) {
      const v = reviewObject(n, ["saved_source_id"]), entry = readSelectedWorkSources(h.packet).find(e => e.entry_id === v.saved_source_id);
      check(entry, "terminal_authorship_note_missing"); return entry;
    }
    return buildSelectedWorkSourceEntry(config, n as Parameters<typeof buildSelectedWorkSourceEntry>[1]);
  });
  // New question/inventory replaces the old authored review; old answers are
  // never candidate notes here. All prior note omissions must be explicit.
  check(!notes.some(n => { try { return JSON.parse(selectedWorkSourceInput(n).text).profile === STATELESS_WORK; } catch { return false; } }), "terminal_authorship_old_review_selected");
  notes.push(buildSelectedWorkSourceEntry(config, { source: "Explicit bounded source review", label: "New candidate", observed_at: null, provenance: "user_declaration", text: canonical(review) }));
  const comparison = compareSelectedWorkSources(h.packet, notes);
  assertReviewedOutcomeSourcesRetained(comparison.entries, readSelectedWorkSources(h.packet));
  if (requireOmissions) check(equal(request.omitted_sources.map(o => o.source_binding).sort(), comparison.unselected_previous.map(e => e.source_ref!).sort()), "terminal_authorship_omissions_invalid");
  const direction = effectiveDirection(db, config, at), selectedDirection = comparison.entries.filter(e => selectedDirectionProfile(e)?.version === DIRECTION_SOURCE);
  check(direction ? selectedDirection.length === 1 && equal(selectedDirection[0], directionSource(direction)) && direction.value.status === "active" &&
    Object.values(directionCurrent(db, direction, at)).every(Boolean) : selectedDirection.length === 0, "terminal_authorship_direction_required");
  const material: PreviewMaterial = { predecessor: h.binding, definition: request.definition, review, selected: comparison.entries, omitted_sources: request.omitted_sources,
    comparison_fingerprint: comparison.fingerprint, root_fingerprint: rootBinding(db, config).fingerprint, direction_ref: direction?.ref ?? null, project_work_binding: binding };
  const current = readCurrentProjectWorkPacketLineageV01(db, config);
  if (current && isStatelessTerminalSuccessor(current.packet)) {
    const { session_id: _session, operator_id: _operator, work_lifetime: _lifetime, resumes_packet, ...saved } = materialFrom(current.packet);
    if (equal(savedDefinition(saved), savedDefinition(material))) {
      if (resumes_packet) material.resumes_packet = resumes_packet;
      else if (current.packet.expires_at !== null) material.resumes_packet = { packet_id: current.packet.packet_id, packet_fingerprint: current.packet.integrity.fingerprint };
    }
  }
  return { ...h, material, comparison, preparation_bytes: observed.bytes_read, preview_binding: digest({ version: STATELESS_TERMINAL_WORK, material }) };
}
function materialFrom(packet: TaskContextPacketV01): Material {
  const entries = packet.selected_context.filter(e => e.entry_id === MATERIAL);
  check(entries.length === 1 && typeof entries[0]!.bounded_summary === "string" && Buffer.byteLength(entries[0]!.bounded_summary!) <= 48_000, "terminal_authorship_material_missing");
  const raw = JSON.parse(entries[0]!.bounded_summary!);
  check(raw.work_lifetime === undefined || raw.work_lifetime === DURABLE_AUTHORED_WORK_V01, "terminal_authorship_lifetime_invalid");
  if (raw.resumes_packet !== undefined) {
    const binding = reviewObject(raw.resumes_packet, ["packet_id", "packet_fingerprint"]);
    reviewText(binding.packet_id, 100); reviewSha(binding.packet_fingerprint);
    check(raw.work_lifetime === DURABLE_AUTHORED_WORK_V01, "terminal_authorship_lifetime_invalid");
  }
  return reviewObject(raw, ["predecessor", "definition", "review", "selected", "omitted_sources", "comparison_fingerprint", "root_fingerprint", "direction_ref", ...(raw.project_work_binding !== undefined ? ["project_work_binding"] : ["selection_revision"]), "session_id", "operator_id", ...(raw.work_lifetime !== undefined ? ["work_lifetime"] : []), ...(raw.resumes_packet !== undefined ? ["resumes_packet"] : [])]) as unknown as Material;
}
export const isStatelessTerminalSuccessor = (p: TaskContextPacketV01) => p.compatibility.source_contracts.includes(STATELESS_TERMINAL_WORK);
export const terminalAuthorshipKey = (p: TaskContextPacketV01) => {
  const { session_id: _session, operator_id: _operator, work_lifetime: _lifetime, ...material } = materialFrom(p);
  return digest({ version: STATELESS_TERMINAL_WORK, material });
};
/** Reconstruct the existing writer request so elapsed time requires no form reentry. */
export function readTerminalWorkResumption(db: Database.Database, config: Config, packet: TaskContextPacketV01, at: string) {
  const m = materialFrom(packet), prior = readTerminalAttemptHistory(db, config, m.predecessor.run_id).packet;
  const previous = readSelectedWorkSources(prior);
  const request: Request = { predecessor: m.predecessor, definition: m.definition,
    material: { question: m.review.question, files: m.review.files.map(({ path, start_line, end_line }) => ({ path, start_line, end_line })) },
    notes: m.selected.filter(e => { try { return JSON.parse(selectedWorkSourceInput(e).text).profile !== STATELESS_WORK; } catch { return true; } })
      .map(e => previous.some(p => equal(p, e)) ? { saved_source_id: e.entry_id } : selectedWorkSourceInput(e)), omitted_sources: m.omitted_sources };
  const preview = previewTerminalAuthorship(db, config, request, at);
  check(preview.material.resumes_packet?.packet_id === packet.packet_id, "terminal_authorship_resume_invalid");
  return { action: "author_terminal_work" as const, request, expected_preview: preview.preview_binding };
}
function build(prior: TaskContextPacketV01, material: Material, availability: ReturnType<typeof readTerminalAttemptHistory>["availability"], at: string) {
  const fp = digest(material), ref: ExternalRefV01 = { ref_version: "external_ref.v0.1", ref_type: "authored_work", external_id: `stateless-successor:${fp.slice(7,31)}`, source_ref: fp, observed_at: at, trust_class: "user_declaration", compatibility_namespace: STATELESS_TERMINAL_WORK };
  const priorRef: ExternalRefV01 = { ...ref, ref_type: "task_context_packet", external_id: prior.packet_id, source_ref: prior.integrity.fingerprint, observed_at: prior.generated_at, trust_class: "direct_local_observation" };
  const refs = [ref, priorRef, ...(material.resumes_packet ? [{ ...priorRef, external_id: material.resumes_packet.packet_id, source_ref: material.resumes_packet.packet_fingerprint, observed_at: at }] : [])];
  const currentness = { status: "fresh" as const, as_of: at, basis: "Explicit new work; terminal predecessor retained without completion or semantic acceptance.", source_ref: ref };
  const old = statelessTerminalEntries(prior);
  check(old.length <= 1, "terminal_authorship_history_bound");
  const predecessors = old.length ? JSON.parse(old[0]!.bounded_summary!).predecessors as unknown[] : [];
  predecessors.push({ binding: material.predecessor, evidence: availability });
  check(predecessors.length <= 8 && Buffer.byteLength(canonical(predecessors)) <= 12_000, "terminal_authorship_history_bound");
  const selected = [...prior.selected_context.filter(e => e.entry_kind === "accepted_state_ref"), ...statelessMandatoryEntries(prior).filter(e => e.entry_id !== STATELESS_TERMINAL_CONTEXT), ...material.selected,
    { entry_id: MATERIAL, entry_kind: "source_ref" as const, source_ref: fp, external_ref: priorRef, why_included: "Authenticated explicit authorship and historical bindings, not execution authority.", bounded_summary: canonical(material), trust_class: "direct_local_observation" as const, currentness, compatibility_source_ref: ref },
    { entry_id: STATELESS_TERMINAL_CONTEXT, entry_kind: "evidence_ref" as const, source_ref: digest(predecessors), external_ref: priorRef, why_included: WARNING, bounded_summary: canonical({ warning: WARNING, predecessors }), trust_class: "direct_local_observation" as const, currentness, compatibility_source_ref: ref }];
  return buildTaskContextPacketV01({ ...prior, work_ref: ref, generated_at: at, expires_at: material.work_lifetime ? null : new Date(Date.parse(at) + VNEXT_OPERATOR_PILOT_LATER_PACKET_TTL_MS_V01).toISOString(), task: material.definition,
    current_projection: { projection_kind: "current_working_perspective", projection_only: true, canonical_state: false, perspective_ref: null, bounded_summary: material.definition.goal, as_of: at,
      items: [{ item_kind: "active_goal", summary: material.definition.goal, source_refs: [fp], external_refs: [ref], currentness }], source_refs: [fp], external_refs: [ref], currentness, warnings: [WARNING] },
    selected_context: selected, excluded_context: prior.selected_context.filter(e => !selected.some(s => s.entry_id === e.entry_id)).map(e => ({ entry_id: e.entry_id, source_ref: e.source_ref, external_ref: e.external_ref, currentness: e.currentness,
      why_excluded: material.omitted_sources.find(o => o.source_binding === e.source_ref)?.reason ?? "Historical operational context retained through the exact predecessor; not selected as substantive context." })),
    capability_grant: null, source_status: { ...prior.source_status, currentness, source_refs: [fp, prior.integrity.fingerprint], external_refs: [ref, priorRef], warnings: [WARNING] },
    compatibility: { source_contracts: [STATELESS_TERMINAL_WORK, ...(material.work_lifetime ? [DURABLE_AUTHORED_WORK_V01] : [])], legacy_scope_ref: null, source_refs: refs, unmapped_fields: [], warnings: [WARNING] },
  }, { required_selected_entry_ids: selected.map(e => e.entry_id) });
}

export interface StatelessTerminalLineage { lineage_kind: "stateless_review_terminal_successor"; packet: TaskContextPacketV01; prior_packet: { packet_id: string; packet_fingerprint: string }; projection_current: boolean; source_transition_receipt: null }
export function inspectStatelessTerminalSuccessor(db: Database.Database, input: { config: Config; packet: TaskContextPacketV01 }): StatelessTerminalLineage {
  const m = materialFrom(input.packet), h = readTerminalAttemptHistory(db, input.config, m.predecessor.run_id);
  check(equal(h.binding, m.predecessor) && input.packet.generated_at > h.packet.generated_at && input.packet.generated_at >= h.run.finished_at!, "terminal_authorship_history_changed");
  const comparison = compareSelectedWorkSources(h.packet, m.selected);
  assertReviewedOutcomeSourcesRetained(comparison.entries, readSelectedWorkSources(h.packet));
  check(equal(comparison.entries, m.selected) && comparison.fingerprint === m.comparison_fingerprint &&
    equal(m.definition, normalizeInitialProjectWorkDefinitionV01(m.definition)) && equal(readSourceReview(input.packet), m.review) &&
    Array.isArray(m.omitted_sources) && m.omitted_sources.length <= 8 &&
    equal(m.omitted_sources.map(o => reviewSha(o.source_binding)).sort(), comparison.unselected_previous.map(e => e.source_ref!).sort()) &&
    m.omitted_sources.every(o => reviewText(o.reason, 500) === o.reason) &&
    reviewSha(m.root_fingerprint) === m.root_fingerprint && (m.project_work_binding !== undefined ? reviewSha(m.project_work_binding) === m.project_work_binding : isHistoricalProjectSelectionRevision(m.selection_revision)),
  "terminal_authorship_material_invalid");
  // Historical consumption is checked at authorship time, not against today's
  // direction or source bytes. Execution independently requires current gates.
  check((effectiveDirection(db, input.config, input.packet.generated_at)?.ref ?? null) === m.direction_ref, "terminal_authorship_direction_changed");
  assertPacketDirectionCurrent(db, input.packet, input.packet.generated_at);
  assertHistoricalStatelessSession(db, input.config, m.session_id, input.packet.generated_at, m.operator_id);
  if (m.resumes_packet) {
    const old = readHistoricalStatelessPacket(db, input.config, m.resumes_packet.packet_id, m.resumes_packet.packet_fingerprint);
    check(isStatelessTerminalSuccessor(old) && old.expires_at !== null && old.generated_at < input.packet.generated_at, "terminal_authorship_resume_invalid");
    check(!materialFrom(old).resumes_packet && equal(savedDefinition(materialFrom(old)), savedDefinition(m)), "terminal_authorship_resume_changed");
    inspectStatelessTerminalSuccessor(db, { config: input.config, packet: old });
    assertUnadmitted(db, input.config, old);
  }
  check(equal(build(h.packet, m, h.availability, input.packet.generated_at), input.packet), "terminal_authorship_compiler_binding");
  const prior = inspectVNextOperatorPilotPacketLineageV01(db, { config: input.config, packet_id: h.packet.packet_id, packet_fingerprint: h.packet.integrity.fingerprint });
  return { lineage_kind: "stateless_review_terminal_successor", packet: input.packet, prior_packet: m.resumes_packet ?? { packet_id: h.packet.packet_id, packet_fingerprint: h.packet.integrity.fingerprint },
    projection_current: prior.lineage_kind === "authored_successor_task" ? prior.inherited_context_current : prior.projection_current, source_transition_receipt: null };
}
/** Inherited operational bindings are checked at finite admission, including
 * suspension after backup/restore. No shared unsettled predicate is weakened. */
export function assertTerminalHistoryActive(db: Database.Database, scope: Scope, packet: TaskContextPacketV01) {
  const entries = statelessTerminalEntries(packet); if (!entries.length) return;
  check(entries.length === 1 && typeof entries[0]!.bounded_summary === "string", "terminal_authorship_history_invalid");
  const data = reviewObject(JSON.parse(entries[0]!.bounded_summary!), ["warning", "predecessors"]);
  check(data.warning === WARNING && Array.isArray(data.predecessors) && data.predecessors.length > 0 && data.predecessors.length <= 8, "terminal_authorship_history_invalid");
  for (const value of data.predecessors) {
    const p = reviewObject(value, ["binding", "evidence"]), binding = p.binding as TerminalAttemptBinding, h = readTerminalAttemptHistory(db, scope, binding.run_id);
    check(equal(binding, h.binding) && equal(p.evidence, h.availability) && !stateOf(h.run).recovery_suspended, "terminal_authorship_history_suspended_or_changed");
  }
}
function assertUnadmitted(db: Database.Database, config: Scope, packet: TaskContextPacketV01) {
  check(!db.prepare("SELECT 1 FROM autonomy_runs WHERE scope=? AND CASE WHEN json_valid(metadata_json) THEN json_extract(metadata_json,'$.packet_id')=? ELSE 1 END LIMIT 1").get(config.project_id, packet.packet_id), "terminal_authorship_result_already_admitted");
}
function currentMatches(db: Database.Database, config: Config, prior: TaskContextPacketV01, key: string, resumes?: PreviewMaterial["resumes_packet"], at?: string) {
  const current = readCurrentProjectWorkPacketLineageV01(db, config);
  check(current?.projection_current, "terminal_authorship_current_work_changed");
  if (isStatelessTerminalSuccessor(current.packet) && terminalAuthorshipKey(current.packet) === key) {
    assertUnadmitted(db, config, current.packet);
    return current.packet;
  }
  if (resumes && current.packet.packet_id === resumes.packet_id && current.packet.integrity.fingerprint === resumes.packet_fingerprint) {
    check(current.packet.expires_at !== null && current.packet.capability_grant === null &&
      validateTaskContextPacketV01(current.packet, { evaluated_at: at! }).errors.every(e => e.code === "packet_expired"), "terminal_authorship_resume_invalid");
    assertUnadmitted(db, config, current.packet); return null;
  }
  check(current.packet.packet_id === prior.packet_id && current.packet.integrity.fingerprint === prior.integrity.fingerprint, "terminal_authorship_current_work_changed");
  return null;
}
export function previewTerminalAuthorship(db: Database.Database, config: Config, request: unknown, at: string, compareOnly = false) {
  return db.transaction(() => {
    const p = compileMaterial(db, config, request, at, !compareOnly);
    currentMatches(db, config, p.packet, p.preview_binding, p.material.resumes_packet, at);
    assertStatelessUnsettledAdmission(db, config, p.packet); assertTerminalHistoryActive(db, config, p.packet);
    return { preview_binding: p.preview_binding, material: p.material, comparison: p.comparison, evidence: p.availability, warning: WARNING,
      preparation_bytes: p.preparation_bytes, authorized: false, execution_grant: null };
  })();
}
export function authorTerminalWork(db: Database.Database, input: { config: Config; credential: Credential; request: unknown; expected_preview: string; now: () => string }) {
  check(!db.inTransaction, "terminal_authorship_transaction_conflict"); db.exec("BEGIN IMMEDIATE");
  try {
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, { ...input, clock: { now: input.now } });
    const p = compileMaterial(db, input.config, input.request, admission.action_observed_at, true);
    check(p.preview_binding === reviewSha(input.expected_preview), "terminal_authorship_preview_changed");
    const priorResult = currentMatches(db, input.config, p.packet, p.preview_binding, p.material.resumes_packet, admission.action_observed_at);
    assertStatelessUnsettledAdmission(db, input.config, p.packet); assertTerminalHistoryActive(db, input.config, p.packet);
    if (priorResult) { db.exec("COMMIT"); return { packet: priorResult, status: "exact_replay" as const, session_admission: admission }; }
    const packet = build(p.packet, { ...p.material, work_lifetime: DURABLE_AUTHORED_WORK_V01, session_id: admission.session.session_id, operator_id: input.config.operator_id }, p.availability, admission.action_observed_at);
    readSourceReview(packet);
    check(validateTaskContextPacketV01(packet, { evaluated_at: admission.action_observed_at }).status === "valid", "terminal_authorship_packet_invalid");
    const write = insertVNextCoreRecordV01(db, { ...input.config, record_kind: "task_context_packet", record_id: packet.packet_id, fingerprint: packet.integrity.fingerprint,
      idempotency_key: p.preview_binding, payload: packet, created_at: packet.generated_at });
    assertPacketDirectionCurrent(db, packet, admission.action_observed_at);
    inspectStatelessTerminalSuccessor(db, { config: input.config, packet });
    check(readCurrentProjectWorkPacketLineageV01(db, input.config)?.packet.packet_id === packet.packet_id, "terminal_authorship_not_current");
    db.exec("COMMIT"); return { packet, status: write.status, session_admission: admission };
  } catch (e) { if (db.inTransaction) db.exec("ROLLBACK"); throw e; }
}
