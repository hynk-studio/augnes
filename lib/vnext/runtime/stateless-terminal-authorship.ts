import type Database from "better-sqlite3";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import { normalizeWorkId } from "@/lib/work";
import { buildSelectedWorkSourceEntry, compareSelectedWorkSources, readSelectedWorkSources, selectedWorkSourceInput, assertReviewedOutcomeSourcesRetained } from "@/lib/intake/selected-work-source-comparison";
import { buildTaskContextPacketV01, validateTaskContextPacketV01 } from "../task-context-packet";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash, parseStrictIsoTimestampV01 } from "../protocol-primitives";
import { STATELESS_WORK, STATELESS_TERMINAL_WORK, STATELESS_TERMINAL_CONTEXT, STATELESS_LIMITS, statelessTerminalEntries, statelessMandatoryEntries, readSourceReview, reviewCheck as check, reviewObject, reviewText, reviewSha, type SourceReview } from "../stateless-work";
import { readStatelessFailureReviews } from "../stateless-review-failure";
import { readStatelessGrant } from "../persistence/stateless-work-grant";
import { insertVNextCoreRecordV01 } from "../persistence/durable-semantic-store";
import { readActiveProjectSelectionV01 } from "../persistence/project-lifecycle-registry";
import { effectiveDirection, directionCurrent, assertPacketDirectionCurrent } from "../persistence/project-direction-store";
import { directionSource, selectedDirectionProfile, DIRECTION_SOURCE } from "../project-direction-source";
import { validateModelInvocationReceiptV02 } from "../model-gateway/model-invocation-receipt";
import { buildModelInvocationCapabilityGrantV01 } from "../automation/model-invocation-capability-grant";
import { readRun, stateOf } from "./stateless-review-ledger";
import { readHistoricalStatelessPacket, assertHistoricalStatelessSession, assertStatelessUnsettledAdmission } from "./stateless-review-disposition";
import { rootBinding, prepareMaterial } from "./stateless-source-review";
import { normalizeInitialProjectWorkDefinitionV01 } from "./initial-project-work-context";
import { inspectVNextOperatorPilotPacketLineageV01, readCurrentProjectWorkPacketLineageV01 } from "./operator-pilot-project-continuity";
import { admitVNextLocalOperatorMutationInsideTransactionV01, type VNextLocalOperatorPilotConfigV01 as Config, type VNextLocalOperatorSessionCredentialV01 as Credential } from "./local-operator-session";
import { VNEXT_OPERATOR_PILOT_LATER_PACKET_TTL_MS_V01 } from "./operator-pilot-semantic-transition";

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
  check(run.autonomy_contract_ref === STATELESS_WORK && run.status === "stopped" && !state.cancelled &&
    run.stop_reason === "invocation_refused_or_result_invalid_no_retry" && run.metadata.reconciliation_required === false &&
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
    step.output.dispatch_outcome === "returned_invalid" && step.output.judgment === undefined && step.output.result_fingerprint === undefined,
  "terminal_authorship_step_shape_unsupported");
  const generation = reviewText(step.output.generation, 100), input = reviewSha(step.output.input_fingerprint);
  const receipt = validateModelInvocationReceiptV02(step.output.failure_receipt);
  const modelGrant = buildModelInvocationCapabilityGrantV01({ grant_id: `${grant.grant_id}.${step.title}`, workspace_id: scope.workspace_id, project_id: scope.project_id, work_id: String(run.metadata.work_id), run_id: runId,
    automation_control_revision: grant.request.control_revision, permitted_purposes: ["planner_plan"], permitted_execution_modes: ["live"], provider_egress_allowed: true,
    max_provider_calls: 1, max_input_bytes: STATELESS_LIMITS.input_bytes, max_output_tokens: STATELESS_LIMITS.output_tokens, max_timeout_ms: STATELESS_LIMITS.invocation_ms,
    allowed_data_classifications: ["private"], issued_at: grant.issued_at, expires_at: grant.request.expires_at, status: "active", capability_status: "available" });
  check(receipt.workspace_id === scope.workspace_id && receipt.project_id === scope.project_id && receipt.run_id === runId && receipt.work_id === run.metadata.work_id &&
    receipt.invocation_id === step.step_id && receipt.purpose === "planner_plan" && receipt.invocation_origin === "policy_triggered" &&
    receipt.status === "completed" && receipt.outcome === "live_success" && receipt.requested_mode === "live" && receipt.execution_mode === "live" &&
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
  const evidence = readStatelessFailureReviews(run).find(e => e.step_id === step.step_id);
  check(evidence && !(evidence.availability === "unavailable" && evidence.reason === "invalid_record"), "terminal_authorship_evidence_invalid");
  if (evidence.availability === "available") check(evidence.evidence.layer === "host_validation" &&
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

export function readTerminalAuthorshipPreparation(db: Database.Database, config: Config, runId: string, at = new Date().toISOString()) {
  try {
    const h = readTerminalAttemptHistory(db, config, runId);
    return { binding: h.binding, evidence: h.availability, definition: h.packet.task, sources: readSelectedWorkSources(h.packet), warning: WARNING,
      recovery_suspended: stateOf(h.run).recovery_suspended, current_direction_source: effectiveDirection(db, config, at) ? directionSource(effectiveDirection(db, config, at)!) : null };
  } catch { return null; }
}

interface Request { predecessor: TerminalAttemptBinding; definition: TaskContextPacketV01["task"]; material: unknown; notes: unknown[]; omitted_sources: Array<{ source_binding: string; reason: string }> }
interface PreviewMaterial {
  predecessor: TerminalAttemptBinding; definition: TaskContextPacketV01["task"]; review: SourceReview;
  selected: ReturnType<typeof readSelectedWorkSources>; omitted_sources: Request["omitted_sources"]; comparison_fingerprint: string;
  root_fingerprint: string; direction_ref: string | null; selection_revision: number;
}
interface Material extends PreviewMaterial { session_id: string; operator_id: string }
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
  const active = readActiveProjectSelectionV01(db, config.workspace_id);
  check(active?.project_id === config.project_id, "terminal_authorship_selection_changed");
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
    comparison_fingerprint: comparison.fingerprint, root_fingerprint: rootBinding(db, config).fingerprint, direction_ref: direction?.ref ?? null, selection_revision: active.selection_revision };
  return { ...h, material, comparison, preparation_bytes: observed.bytes_read, preview_binding: digest({ version: STATELESS_TERMINAL_WORK, material }) };
}
function materialFrom(packet: TaskContextPacketV01): Material {
  const entries = packet.selected_context.filter(e => e.entry_id === MATERIAL);
  check(entries.length === 1 && typeof entries[0]!.bounded_summary === "string" && Buffer.byteLength(entries[0]!.bounded_summary!) <= 48_000, "terminal_authorship_material_missing");
  return reviewObject(JSON.parse(entries[0]!.bounded_summary!), ["predecessor", "definition", "review", "selected", "omitted_sources", "comparison_fingerprint", "root_fingerprint", "direction_ref", "selection_revision", "session_id", "operator_id"]) as unknown as Material;
}
export const isStatelessTerminalSuccessor = (p: TaskContextPacketV01) => p.compatibility.source_contracts.includes(STATELESS_TERMINAL_WORK);
export const terminalAuthorshipKey = (p: TaskContextPacketV01) => {
  const { session_id: _session, operator_id: _operator, ...material } = materialFrom(p);
  return digest({ version: STATELESS_TERMINAL_WORK, material });
};
function build(prior: TaskContextPacketV01, material: Material, availability: ReturnType<typeof readTerminalAttemptHistory>["availability"], at: string) {
  const fp = digest(material), ref: ExternalRefV01 = { ref_version: "external_ref.v0.1", ref_type: "authored_work", external_id: `stateless-successor:${fp.slice(7,31)}`, source_ref: fp, observed_at: at, trust_class: "user_declaration", compatibility_namespace: STATELESS_TERMINAL_WORK };
  const priorRef: ExternalRefV01 = { ...ref, ref_type: "task_context_packet", external_id: prior.packet_id, source_ref: prior.integrity.fingerprint, observed_at: prior.generated_at, trust_class: "direct_local_observation" };
  const currentness = { status: "fresh" as const, as_of: at, basis: "Explicit new work; terminal predecessor retained without completion or semantic acceptance.", source_ref: ref };
  const old = statelessTerminalEntries(prior);
  check(old.length <= 1, "terminal_authorship_history_bound");
  const predecessors = old.length ? JSON.parse(old[0]!.bounded_summary!).predecessors as unknown[] : [];
  predecessors.push({ binding: material.predecessor, evidence: availability });
  check(predecessors.length <= 8 && Buffer.byteLength(canonical(predecessors)) <= 12_000, "terminal_authorship_history_bound");
  const selected = [...prior.selected_context.filter(e => e.entry_kind === "accepted_state_ref"), ...statelessMandatoryEntries(prior).filter(e => e.entry_id !== STATELESS_TERMINAL_CONTEXT), ...material.selected,
    { entry_id: MATERIAL, entry_kind: "source_ref" as const, source_ref: fp, external_ref: priorRef, why_included: "Authenticated explicit authorship and historical bindings, not execution authority.", bounded_summary: canonical(material), trust_class: "direct_local_observation" as const, currentness, compatibility_source_ref: ref },
    { entry_id: STATELESS_TERMINAL_CONTEXT, entry_kind: "evidence_ref" as const, source_ref: digest(predecessors), external_ref: priorRef, why_included: WARNING, bounded_summary: canonical({ warning: WARNING, predecessors }), trust_class: "direct_local_observation" as const, currentness, compatibility_source_ref: ref }];
  return buildTaskContextPacketV01({ ...prior, work_ref: ref, generated_at: at, expires_at: new Date(Date.parse(at) + VNEXT_OPERATOR_PILOT_LATER_PACKET_TTL_MS_V01).toISOString(), task: material.definition,
    current_projection: { projection_kind: "current_working_perspective", projection_only: true, canonical_state: false, perspective_ref: null, bounded_summary: material.definition.goal, as_of: at,
      items: [{ item_kind: "active_goal", summary: material.definition.goal, source_refs: [fp], external_refs: [ref], currentness }], source_refs: [fp], external_refs: [ref], currentness, warnings: [WARNING] },
    selected_context: selected, excluded_context: prior.selected_context.filter(e => !selected.some(s => s.entry_id === e.entry_id)).map(e => ({ entry_id: e.entry_id, source_ref: e.source_ref, external_ref: e.external_ref, currentness: e.currentness,
      why_excluded: material.omitted_sources.find(o => o.source_binding === e.source_ref)?.reason ?? "Historical operational context retained through the exact predecessor; not selected as substantive context." })),
    capability_grant: null, source_status: { ...prior.source_status, currentness, source_refs: [fp, prior.integrity.fingerprint], external_refs: [ref, priorRef], warnings: [WARNING] },
    compatibility: { source_contracts: [STATELESS_TERMINAL_WORK], legacy_scope_ref: null, source_refs: [ref, priorRef], unmapped_fields: [], warnings: [WARNING] },
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
    reviewSha(m.root_fingerprint) === m.root_fingerprint && Number.isSafeInteger(m.selection_revision) && m.selection_revision > 0,
  "terminal_authorship_material_invalid");
  // Historical consumption is checked at authorship time, not against today's
  // direction or source bytes. Execution independently requires current gates.
  check((effectiveDirection(db, input.config, input.packet.generated_at)?.ref ?? null) === m.direction_ref, "terminal_authorship_direction_changed");
  assertPacketDirectionCurrent(db, input.packet, input.packet.generated_at);
  assertHistoricalStatelessSession(db, input.config, m.session_id, input.packet.generated_at, m.operator_id);
  check(equal(build(h.packet, m, h.availability, input.packet.generated_at), input.packet), "terminal_authorship_compiler_binding");
  const prior = inspectVNextOperatorPilotPacketLineageV01(db, { config: input.config, packet_id: h.packet.packet_id, packet_fingerprint: h.packet.integrity.fingerprint });
  return { lineage_kind: "stateless_review_terminal_successor", packet: input.packet, prior_packet: { packet_id: h.packet.packet_id, packet_fingerprint: h.packet.integrity.fingerprint },
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
function currentMatches(db: Database.Database, config: Config, prior: TaskContextPacketV01, key: string) {
  const current = readCurrentProjectWorkPacketLineageV01(db, config);
  check(current?.projection_current, "terminal_authorship_current_work_changed");
  if (isStatelessTerminalSuccessor(current.packet) && terminalAuthorshipKey(current.packet) === key) {
    check(!db.prepare("SELECT 1 FROM autonomy_runs WHERE scope=? AND CASE WHEN json_valid(metadata_json) THEN json_extract(metadata_json,'$.packet_id')=? ELSE 1 END LIMIT 1").get(config.project_id, current.packet.packet_id), "terminal_authorship_result_already_admitted");
    return current.packet;
  }
  check(current.packet.packet_id === prior.packet_id && current.packet.integrity.fingerprint === prior.integrity.fingerprint, "terminal_authorship_current_work_changed");
  return null;
}
export function previewTerminalAuthorship(db: Database.Database, config: Config, request: unknown, at: string, compareOnly = false) {
  return db.transaction(() => {
    const p = compileMaterial(db, config, request, at, !compareOnly);
    currentMatches(db, config, p.packet, p.preview_binding);
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
    const priorResult = currentMatches(db, input.config, p.packet, p.preview_binding);
    assertStatelessUnsettledAdmission(db, input.config, p.packet); assertTerminalHistoryActive(db, input.config, p.packet);
    if (priorResult) { db.exec("COMMIT"); return { packet: priorResult, status: "exact_replay" as const, session_admission: admission }; }
    const packet = build(p.packet, { ...p.material, session_id: admission.session.session_id, operator_id: input.config.operator_id }, p.availability, admission.action_observed_at);
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
