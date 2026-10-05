import { isCurrentProjectSelectionRevision, type ProjectSelectionRevision } from "@/lib/vnext/project-selection";
import { handoffEntries } from "../work-handoff";
import type Database from "better-sqlite3";
import type { AutonomyRunRecord } from "@/types/autonomy-runner-execution";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import { normalizeWorkId } from "@/lib/work";
import { appendAutonomyRunLedgerEvent, buildAutonomyRunEventRecord, readUnsettledAutonomyRunIds, updateAutonomyRunLedgerFields, updateAutonomyRunStepLedgerFields } from "@/lib/autonomy/runner-ledger";
import { buildSelectedWorkSourceEntry, readSelectedWorkSources, selectedWorkSourceInput } from "@/lib/intake/selected-work-source-comparison";
import { statelessTerminalEntries, STATELESS_WORK, STATELESS_DISPOSITION, STATELESS_REPLACEMENT, STATELESS_UNRESOLVED_CONTEXT, reviewCheck as check, reviewObject, reviewSha, reviewText, readSourceReview, type SourceReview, type StatelessDispositionBinding } from "../stateless-work";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash, parseStrictIsoTimestampV01 } from "../protocol-primitives";
import { readStatelessGrant } from "../persistence/stateless-work-grant";
import { readVNextCoreRecordV01, insertVNextCoreRecordV01 } from "../persistence/durable-semantic-store";
import { validateModelInvocationReceiptV02 } from "../model-gateway/model-invocation-receipt";
import { buildTaskContextPacketV01, validateTaskContextPacketV01 } from "../task-context-packet";
import { readActiveProjectSelectionV01 } from "../persistence/project-lifecycle-registry";
import { assertPacketDirectionCurrent } from "../persistence/project-direction-store";
import { admitVNextLocalOperatorMutationInsideTransactionV01, readVNextLocalOperatorSessionHistoryV01, type VNextLocalOperatorPilotConfigV01 as Config, type VNextLocalOperatorSessionCredentialV01 as Credential } from "./local-operator-session";
import { readRun, stateOf } from "./stateless-review-ledger";
import { inspectVNextOperatorPilotPacketLineageV01, readCurrentProjectWorkPacketLineageV01 } from "./operator-pilot-project-continuity";
import { normalizeInitialProjectWorkDefinitionV01 } from "./initial-project-work-context";
import { VNEXT_OPERATOR_PILOT_LATER_PACKET_TTL_MS_V01 } from "./operator-pilot-semantic-transition";
import { DURABLE_AUTHORED_WORK_V01 } from "@/types/vnext/project-work-initialization";
import { rootBinding } from "./stateless-source-review";

type Scope = Pick<Config, "workspace_id" | "project_id">;
const fingerprint = (value: unknown) => hash(canonical(value));
const same = (a: unknown, b: unknown) => canonical(a) === canonical(b);
const WARNING = "Earlier model-request delivery, effects and cost remain unknown. Ending that work is a local decision, not remote cancellation, settlement, success or refunded allowance.";
interface Disposition {
  version: typeof STATELESS_DISPOSITION; decision: "end_further_work"; binding: StatelessDispositionBinding;
  at: string; session_id: string; operator_id: string; fingerprint: string;
}
interface Link { run_id: string; disposition_fingerprint: string }
const keys = ["run_id", "expected_revision", "step_id", "generation", "packet_id", "packet_fingerprint", "grant_id", "grant_fingerprint", "failure_evidence_fingerprint"];
function parseBinding(value: unknown): StatelessDispositionBinding {
  const v = reviewObject(value, keys);
  for (const key of ["run_id", "step_id", "generation", "packet_id", "grant_id"]) reviewText(v[key], 256);
  for (const key of ["packet_fingerprint", "grant_fingerprint", "failure_evidence_fingerprint"]) reviewSha(v[key]);
  check(Number.isSafeInteger(v.expected_revision) && Number(v.expected_revision) > 0, "disposition_revision_invalid");
  return v as unknown as StatelessDispositionBinding;
}
function sessionAt(db: Database.Database, scope: Scope, sessionId: string, at: string, operator: string) {
  const s = readVNextLocalOperatorSessionHistoryV01(db, { session_id: sessionId });
  check(parseStrictIsoTimestampV01(at) !== null && s && s.workspace_id === scope.workspace_id && s.project_id === scope.project_id && s.operator_id === operator &&
    s.bootstrap_consumed_at && at >= s.issued_at && at >= s.bootstrap_consumed_at && at <= s.expires_at && (!s.revoked_at || at <= s.revoked_at), "disposition_authorship_invalid");
}
function packetFrom(db: Database.Database, scope: Scope, id: string, fp: string) {
  const row = readVNextCoreRecordV01(db, { ...scope, record_kind: "task_context_packet", record_id: id });
  check(row && row.fingerprint === fp, "disposition_packet_missing");
  const p = row.payload as TaskContextPacketV01;
  check(p.packet_id === row.record_id && p.integrity.fingerprint === fp && p.workspace_id === scope.workspace_id && p.project_id === scope.project_id &&
    p.generated_at === row.created_at && validateTaskContextPacketV01(p, { evaluated_at: p.generated_at }).status === "valid", "disposition_packet_invalid");
  return p;
}
/** Historical identity only: no current automation, source bytes, root, route or expiry gate. */
function historicalBinding(db: Database.Database, scope: Scope, run: AutonomyRunRecord): StatelessDispositionBinding {
  const state = stateOf(run), grant = readStatelessGrant(db, { ...scope, ...state });
  check(run.autonomy_contract_ref === STATELESS_WORK && run.run_id === `stateless-review:${grant.grant_id.slice("stateless-grant:".length)}` &&
    run.metadata.work_id === normalizeWorkId(run.run_id) && run.metadata.packet_id === grant.request.packet_id && run.metadata.packet_fingerprint === grant.request.packet_fingerprint &&
    run.metadata.run_receipt_id == null && run.metadata.terminal_receipt_persisted !== true && ["running", "paused"].includes(run.status), "disposition_profile_required");
  const running = run.steps.filter(s => s.status === "running");
  check(running.length === 1, "disposition_model_claim_required");
  const step = running[0]!;
  check(run.steps.length === 3 && [1, 3].includes(step.step_index) && step.action_kind === "invoke_project_scoped_model_gateway" &&
    run.steps.every((s, i) => s.step_index === i + 1 && s.step_id === `${run.run_id}.${["choose", "observe", "conclude"][i]}` &&
      s.action_kind === (i === 1 ? "invoke_project_scoped_host_adapter" : "invoke_project_scoped_model_gateway") &&
      (s.step_index < step.step_index ? s.status === "completed" : s.step_index > step.step_index ? s.status === "planned" : true)), "disposition_model_claim_required");
  let output = step.output;
  if (output.disposed_claim_generation !== undefined) {
    const disposition = run.metadata.stateless_review_disposition as Disposition | undefined;
    check(disposition && output.generation === `ended:${disposition.fingerprint.slice(7)}`, "disposition_fence_invalid");
    const { disposed_claim_generation, ...retained } = output;
    output = { ...retained, generation: disposed_claim_generation };
  }
  const generation = reviewText(output.generation, 100);
  const receipt = step.output.failure_receipt;
  if (receipt != null) {
    const r = validateModelInvocationReceiptV02(receipt);
    check(r.workspace_id === scope.workspace_id && r.project_id === scope.project_id && r.run_id === run.run_id && r.work_id === run.metadata.work_id &&
      r.invocation_id === step.step_id && r.purpose === "planner_plan" && r.requested_mode === "live" && r.egress_attempted &&
      ["model_gateway_transport_failed", "model_gateway_timeout", "model_gateway_cancelled"].includes(r.failure_code ?? "") &&
      step.output.dispatch_outcome === "unknown" && step.output.received_model_result == null && run.metadata.reconciliation_required === true, "disposition_unknown_required");
  } else {
    // New controllers persist this claim immediately before calling transport.
    // It proves local dispatch admission, never provider receipt or non-delivery.
    const claim = reviewObject(output.model_request_claim, ["generation", "invocation_id", "at"]);
    check(claim.generation === generation && claim.invocation_id === step.step_id && typeof claim.at === "string" && parseStrictIsoTimestampV01(claim.at) !== null, "disposition_unknown_required");
  }
  return { run_id: run.run_id, expected_revision: state.revision, step_id: step.step_id, generation,
    packet_id: grant.request.packet_id, packet_fingerprint: grant.request.packet_fingerprint, grant_id: grant.grant_id, grant_fingerprint: grant.grant_fingerprint,
    failure_evidence_fingerprint: fingerprint({ output, error_message: step.error_message, started_at: step.started_at, finished_at: step.finished_at }) };
}
export function readStatelessDisposition(db: Database.Database, scope: Scope, run: AutonomyRunRecord): Disposition | null {
  if (run.metadata.stateless_review_disposition === undefined) return null;
  const raw = reviewObject(run.metadata.stateless_review_disposition, ["version", "decision", "binding", "at", "session_id", "operator_id", "fingerprint"]);
  const d = raw as unknown as Disposition, binding = parseBinding(d.binding), { fingerprint: fp, ...material } = d;
  check(d.version === STATELESS_DISPOSITION && d.decision === "end_further_work" && fp === fingerprint(material), "disposition_invalid");
  sessionAt(db, scope, d.session_id, d.at, d.operator_id);
  const observed = historicalBinding(db, scope, run);
  check(stateOf(run).revision >= binding.expected_revision + 1 && same({ ...observed, expected_revision: binding.expected_revision }, binding) &&
    run.metadata.reconciliation_required === true && run.events.some(e => e.event_type === "host_event_observed" && e.step_id === binding.step_id && same(e.payload, d)), "disposition_binding_changed");
  return d;
}
export function readStatelessDispositionPreparation(db: Database.Database, scope: Scope, run: AutonomyRunRecord) {
  try {
    const disposition = readStatelessDisposition(db, scope, run);
    const active = readActiveProjectSelectionV01(db, scope.workspace_id);
    return { binding: disposition?.binding ?? historicalBinding(db, scope, run), disposition, warning: WARNING,
      expected_active_selection_revision: active?.project_id === scope.project_id ? active.selection_revision : null };
  } catch { return null; }
}
export function endStatelessReviewWork(db: Database.Database, input: { config: Config; credential: Credential; binding: unknown; now: () => string }) {
  const binding = parseBinding(input.binding);
  check(!db.inTransaction, "disposition_transaction_conflict"); db.exec("BEGIN IMMEDIATE");
  try {
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, { ...input, clock: { now: input.now } });
    const run = readRun(db, input.config, binding.run_id), prior = readStatelessDisposition(db, input.config, run);
    if (prior) {
      check(same(prior.binding, binding), "disposition_conflict"); db.exec("COMMIT");
      return { disposition: prior, status: "exact_replay" as const, session_admission: admission };
    }
    check(same(historicalBinding(db, input.config, run), binding), "disposition_changed");
    const material = { version: STATELESS_DISPOSITION, decision: "end_further_work" as const, binding, at: admission.action_observed_at, session_id: admission.session.session_id, operator_id: input.config.operator_id };
    const disposition = { ...material, fingerprint: fingerprint(material) };
    // Rotate the commit fence even for an older controller that checks only
    // generation. Preserve the original generation explicitly and all other
    // claim fields unchanged: historical evidence is losslessly reconstructible.
    const claimed = run.steps.find(s => s.step_id === binding.step_id)!;
    updateAutonomyRunStepLedgerFields(claimed.step_id, { output: { ...claimed.output,
      generation: `ended:${disposition.fingerprint.slice(7)}`, disposed_claim_generation: binding.generation } }, { db });
    // The transaction and exact revision/evidence comparison are the CAS.
    updateAutonomyRunLedgerFields(run.run_id, { status: "paused", updated_at: material.at,
      metadata: { ...run.metadata, reconciliation_required: true, stateless_review: { ...stateOf(run), revision: stateOf(run).revision + 1 }, stateless_review_disposition: disposition } }, { db });
    appendAutonomyRunLedgerEvent(buildAutonomyRunEventRecord({ run_id: run.run_id, step_id: binding.step_id, event_type: "host_event_observed", status: "paused",
      message: "User ended further local work. Historical model delivery, effects and cost remain unknown; no retry or settlement.", payload: disposition, created_at: material.at }), { db });
    db.exec("COMMIT"); return { disposition, status: "inserted" as const, session_admission: admission };
  } catch (e) { if (db.inTransaction) db.exec("ROLLBACK"); throw e; }
}

export function statelessUnresolvedEntries(packet: TaskContextPacketV01) {
  return packet.selected_context.filter(e => e.entry_id === STATELESS_UNRESOLVED_CONTEXT);
}
function linksFrom(packet: TaskContextPacketV01): Link[] {
  const entries = statelessUnresolvedEntries(packet);
  if (!entries.length) return [];
  check(entries.length === 1 && typeof entries[0]!.bounded_summary === "string" && Buffer.byteLength(entries[0]!.bounded_summary!) <= 4096, "disposition_links_invalid");
  const data = reviewObject(JSON.parse(entries[0]!.bounded_summary!), ["warning", "predecessors"]);
  check(data.warning === WARNING && Array.isArray(data.predecessors) && data.predecessors.length > 0 && data.predecessors.length <= 8, "disposition_links_invalid");
  const links = data.predecessors.map(v => { const link = reviewObject(v, ["run_id", "disposition_fingerprint"]); return { run_id: reviewText(link.run_id, 160), disposition_fingerprint: reviewSha(link.disposition_fingerprint) }; });
  check(new Set(links.map(l => l.run_id)).size === links.length, "disposition_links_invalid"); return links;
}
/** Only the stateless admission and its completed-result authoring/revision path call
 * this proof owner. The shared conservative predicate and native paths do not. */
export function assertStatelessUnsettledAdmission(db: Database.Database, scope: Scope, packet: TaskContextPacketV01, ownRun?: string) {
  check(packet.workspace_id === scope.workspace_id && packet.project_id === scope.project_id, "run_scope_invalid");
  const ids = readUnsettledAutonomyRunIds({ db, scope: scope.project_id, exclude_run_id: ownRun });
  check(ids.length < 129, "unsettled_project_run");
  const links = linksFrom(packet);
  for (const id of ids) {
    const link = links.find(l => l.run_id === id);
    check(link, "unsettled_project_run");
    const run = readRun(db, scope, id), disposition = readStatelessDisposition(db, scope, run);
    check(disposition && !stateOf(run).recovery_suspended && disposition.fingerprint === link.disposition_fingerprint, "unsettled_project_run");
  }
}

const MATERIAL = `${STATELESS_REPLACEMENT}:source`;
interface ReplacementMaterial { disposition: Link; prior_packet: { packet_id: string; packet_fingerprint: string }; review: SourceReview; session_id: string; operator_id: string; selection_revision: ProjectSelectionRevision;
  work_lifetime?: typeof DURABLE_AUTHORED_WORK_V01; resumes_packet?: { packet_id: string; packet_fingerprint: string } }
export const isStatelessReplacement = (packet: TaskContextPacketV01) => packet.compatibility.source_contracts.includes(STATELESS_REPLACEMENT);
function replacementMaterial(packet: TaskContextPacketV01): ReplacementMaterial {
  const entries = packet.selected_context.filter(e => e.entry_id === MATERIAL);
  check(entries.length === 1 && typeof entries[0]!.bounded_summary === "string" && Buffer.byteLength(entries[0]!.bounded_summary!) <= 8000, "replacement_material_invalid");
  const raw = JSON.parse(entries[0]!.bounded_summary!);
  check(raw.work_lifetime === undefined || raw.work_lifetime === DURABLE_AUTHORED_WORK_V01, "replacement_lifetime_invalid");
  if (raw.resumes_packet !== undefined) {
    const binding = reviewObject(raw.resumes_packet, ["packet_id", "packet_fingerprint"]);
    reviewText(binding.packet_id, 100); reviewSha(binding.packet_fingerprint);
    check(raw.work_lifetime === DURABLE_AUTHORED_WORK_V01, "replacement_lifetime_invalid");
  }
  return reviewObject(raw, ["disposition", "prior_packet", "review", "session_id", "operator_id", "selection_revision", ...(raw.work_lifetime !== undefined ? ["work_lifetime"] : []), ...(raw.resumes_packet !== undefined ? ["resumes_packet"] : [])]) as unknown as ReplacementMaterial;
}
const replacementKey = (m: ReplacementMaterial) => fingerprint({ profile: STATELESS_REPLACEMENT, disposition: m.disposition, prior_packet: m.prior_packet, review: m.review, selection_revision: m.selection_revision, ...(m.resumes_packet ? { resumes_packet: m.resumes_packet } : {}) });
const replacementDefinition = (m: ReplacementMaterial) => ({ disposition: m.disposition, prior_packet: m.prior_packet, review: m.review });
export const statelessReplacementIdempotencyKey = (p: TaskContextPacketV01) => isStatelessReplacement(p) ? replacementKey(replacementMaterial(p)) : null;
/** The existing authenticated writer rechecks current source versions and lineage. */
export function readReplacementWorkResumption(db: Database.Database, config: Config, packet: TaskContextPacketV01) {
  const m = replacementMaterial(packet);
  const active = readActiveProjectSelectionV01(db, config.workspace_id);
  check(active?.project_id === config.project_id, "replacement_project_not_active");
  return { action: "prepare_linked_work" as const, disposition: m.disposition,
    expected_active_selection_revision: active.selection_revision,
    material: { question: m.review.question, files: m.review.files.map(({ path, start_line, end_line }) => ({ path, start_line, end_line })) } };
}
function buildReplacement(prior: TaskContextPacketV01, m: ReplacementMaterial, at: string, resumed?: TaskContextPacketV01): TaskContextPacketV01 {
  const links = [...linksFrom(prior), m.disposition]; check(links.length <= 8 && new Set(links.map(l => l.run_id)).size === links.length, "disposition_chain_bound");
  const fp = fingerprint(m), ref: ExternalRefV01 = { ref_version: "external_ref.v0.1", ref_type: "authored_work", external_id: `stateless-replacement:${fp.slice(7,31)}`, source_ref: fp, observed_at: at, trust_class: "user_declaration", compatibility_namespace: STATELESS_REPLACEMENT };
  const priorRef: ExternalRefV01 = { ...ref, ref_type: "task_context_packet", external_id: prior.packet_id, source_ref: prior.integrity.fingerprint, observed_at: prior.generated_at, trust_class: "direct_local_observation" };
  const refs = [ref, priorRef, ...(m.resumes_packet ? [{ ...priorRef, external_id: m.resumes_packet.packet_id, source_ref: m.resumes_packet.packet_fingerprint, observed_at: at }] : [])];
  const currentness = { status: "fresh" as const, as_of: at, basis: "Explicit new source-review work; unknown predecessor effects remain historical.", source_ref: ref };
  check(Boolean(m.resumes_packet) === Boolean(resumed), "replacement_resume_invalid");
  const selected = resumed ? readSelectedWorkSources(resumed) : readSelectedWorkSources(prior).filter(s => { try { return JSON.parse(selectedWorkSourceInput(s).text).profile !== STATELESS_WORK; } catch { return true; } });
  if (!resumed) selected.push(buildSelectedWorkSourceEntry(prior, { source: "Explicit linked bounded source review", label: "New candidate", observed_at: at, provenance: "user_declaration", text: canonical(m.review) }));
  const entries = [...handoffEntries(prior), ...prior.selected_context.filter(e => e.entry_kind === "accepted_state_ref"), ...selected, ...statelessTerminalEntries(prior),
    { entry_id: MATERIAL, entry_kind: "source_ref" as const, source_ref: fp, external_ref: priorRef, why_included: "Authenticated new-work authorship and exact historical disposition, without a completed-result claim.", bounded_summary: canonical(m), trust_class: "direct_local_observation" as const, currentness, compatibility_source_ref: ref },
    { entry_id: STATELESS_UNRESOLVED_CONTEXT, entry_kind: "evidence_ref" as const, source_ref: fingerprint(links), external_ref: priorRef, why_included: WARNING,
      bounded_summary: canonical({ warning: WARNING, predecessors: links }), trust_class: "direct_local_observation" as const, currentness, compatibility_source_ref: ref }];
  const task = normalizeInitialProjectWorkDefinitionV01({ ...prior.task, goal: m.review.question });
  return buildTaskContextPacketV01({ ...prior, work_ref: ref, generated_at: at, expires_at: m.work_lifetime ? null : new Date(Date.parse(at) + VNEXT_OPERATOR_PILOT_LATER_PACKET_TTL_MS_V01).toISOString(), task,
    current_projection: { projection_kind: "current_working_perspective", projection_only: true, canonical_state: false, perspective_ref: null, bounded_summary: task.goal, as_of: at,
      items: [{ item_kind: "active_goal", summary: task.goal, source_refs: [fp], external_refs: [ref], currentness }], source_refs: [fp], external_refs: [ref], currentness, warnings: [WARNING] },
    selected_context: entries, excluded_context: prior.selected_context.filter(e => !entries.some(s => s.entry_id === e.entry_id)).map(e => ({ entry_id: e.entry_id, source_ref: e.source_ref, external_ref: e.external_ref, currentness: e.currentness, why_excluded: "Historical task context, not the new question; no deletion or completion is implied." })),
    capability_grant: null, source_status: { ...prior.source_status, currentness, warnings: [WARNING], source_refs: [fp, prior.integrity.fingerprint], external_refs: [ref, priorRef] },
    compatibility: { source_contracts: [STATELESS_REPLACEMENT, ...(m.work_lifetime ? [DURABLE_AUTHORED_WORK_V01] : [])], legacy_scope_ref: null, source_refs: refs, unmapped_fields: [], warnings: [WARNING] },
  }, { required_selected_entry_ids: entries.map(e => e.entry_id) });
}
export interface StatelessReplacementLineage {
  lineage_kind: "stateless_review_replacement"; packet: TaskContextPacketV01;
  prior_packet: { packet_id: string; packet_fingerprint: string }; projection_current: boolean; source_transition_receipt: null;
}
export function inspectStatelessReplacement(db: Database.Database, input: { config: Config; packet: TaskContextPacketV01 }): StatelessReplacementLineage {
  const { packet, config } = input, m = replacementMaterial(packet);
  const run = readRun(db, config, m.disposition.run_id), d = readStatelessDisposition(db, config, run);
  check(d && d.fingerprint === m.disposition.disposition_fingerprint && d.binding.packet_id === m.prior_packet.packet_id && d.binding.packet_fingerprint === m.prior_packet.packet_fingerprint, "replacement_disposition_changed");
  const prior = packetFrom(db, config, m.prior_packet.packet_id, m.prior_packet.packet_fingerprint);
  check(packet.generated_at >= d.at && packet.generated_at > prior.generated_at, "replacement_time_invalid");
  sessionAt(db, config, m.session_id, packet.generated_at, m.operator_id);
  const lineage = inspectVNextOperatorPilotPacketLineageV01(db, { config, ...m.prior_packet });
  let resumed: TaskContextPacketV01 | undefined;
  if (m.resumes_packet) {
    const old = packetFrom(db, config, m.resumes_packet.packet_id, m.resumes_packet.packet_fingerprint);
    check(isStatelessReplacement(old) && old.expires_at !== null && old.generated_at < packet.generated_at, "replacement_resume_invalid");
    check(!replacementMaterial(old).resumes_packet && same(replacementDefinition(replacementMaterial(old)), replacementDefinition(m)), "replacement_resume_changed");
    inspectStatelessReplacement(db, { config, packet: old });
    assertReplacementUnadmitted(db, config, old);
    resumed = old;
  }
  check(same(buildReplacement(prior, m, packet.generated_at, resumed), packet), "replacement_compiler_binding");
  const inherited = lineage.lineage_kind === "authored_successor_task" ? lineage.inherited_context_current : lineage.projection_current;
  return { lineage_kind: "stateless_review_replacement" as const, packet, prior_packet: m.resumes_packet ?? m.prior_packet, projection_current: inherited, source_transition_receipt: null };
}
function assertReplacementUnadmitted(db: Database.Database, scope: Scope, packet: TaskContextPacketV01) {
  check(!db.prepare("SELECT 1 FROM autonomy_runs WHERE scope=? AND CASE WHEN json_valid(metadata_json) THEN json_extract(metadata_json,'$.packet_id')=? ELSE 1 END LIMIT 1").get(scope.project_id, packet.packet_id), "replacement_result_already_admitted");
}
/** Explicit ordinary new-work writer. This never enables control, grants or runs. */
export function prepareLinkedStatelessWork(db: Database.Database, input: { config: Config; credential: Credential; disposition: Link; review: SourceReview; expected_active_selection_revision: unknown; now: () => string }) {
  check(!db.inTransaction, "replacement_transaction_conflict"); db.exec("BEGIN IMMEDIATE");
  try {
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, { ...input, clock: { now: input.now } });
    const run = readRun(db, input.config, input.disposition.run_id), d = readStatelessDisposition(db, input.config, run);
    check(d && d.fingerprint === input.disposition.disposition_fingerprint && !stateOf(run).recovery_suspended, "replacement_disposition_required");
    const prior = packetFrom(db, input.config, d.binding.packet_id, d.binding.packet_fingerprint);
    const active = readActiveProjectSelectionV01(db, input.config.workspace_id);
    check(active?.project_id === input.config.project_id, "replacement_project_not_active");
    check(isCurrentProjectSelectionRevision(input.expected_active_selection_revision) && active.selection_revision === input.expected_active_selection_revision, "replacement_selection_changed");
    const m: ReplacementMaterial = { work_lifetime: DURABLE_AUTHORED_WORK_V01, disposition: input.disposition, prior_packet: { packet_id: prior.packet_id, packet_fingerprint: prior.integrity.fingerprint }, review: input.review,
      session_id: admission.session.session_id, operator_id: input.config.operator_id, selection_revision: active.selection_revision };
    const current = readCurrentProjectWorkPacketLineageV01(db, input.config);
    // A duplicate can acknowledge only its unchanged immediate preparation.
    if (current && isStatelessReplacement(current.packet)) {
      const { resumes_packet, ...saved } = replacementMaterial(current.packet);
      if (same(replacementDefinition(saved), replacementDefinition(m))) {
        if (resumes_packet) m.resumes_packet = resumes_packet;
        else if (current.packet.expires_at !== null) m.resumes_packet = { packet_id: current.packet.packet_id, packet_fingerprint: current.packet.integrity.fingerprint };
      }
    }
    if (current && isStatelessReplacement(current.packet) && replacementKey(replacementMaterial(current.packet)) === replacementKey(m)) {
      db.exec("COMMIT"); return { packet: current.packet, status: "exact_replay" as const, session_admission: admission };
    }
    const expected = m.resumes_packet ?? m.prior_packet;
    check(current?.projection_current && current.packet.packet_id === expected.packet_id && current.packet.integrity.fingerprint === expected.packet_fingerprint, "replacement_current_work_changed");
    if (m.resumes_packet) {
      check(current.packet.capability_grant === null && validateTaskContextPacketV01(current.packet, { evaluated_at: admission.action_observed_at }).errors.every(e => e.code === "packet_expired"), "replacement_resume_invalid");
      const grant = readStatelessGrant(db, { ...input.config, ...stateOf(run) });
      check(rootBinding(db, input.config).fingerprint === grant.request.root_fingerprint, "replacement_root_changed");
      assertReplacementUnadmitted(db, input.config, current.packet);
    }
    const packet = buildReplacement(prior, m, admission.action_observed_at, m.resumes_packet ? current.packet : undefined);
    readSourceReview(packet);
    assertStatelessUnsettledAdmission(db, input.config, packet);
    check(validateTaskContextPacketV01(packet, { evaluated_at: admission.action_observed_at }).status === "valid", "replacement_packet_invalid");
    const write = insertVNextCoreRecordV01(db, { ...input.config, record_kind: "task_context_packet", record_id: packet.packet_id, fingerprint: packet.integrity.fingerprint,
      idempotency_key: replacementKey(m), payload: packet, created_at: packet.generated_at });
    // The ordinary insertion binds the direction actually selected by this
    // packet. Validate that persisted binding before either write can commit.
    assertPacketDirectionCurrent(db, packet, admission.action_observed_at);
    check(readCurrentProjectWorkPacketLineageV01(db, input.config)?.packet.packet_id === packet.packet_id, "replacement_not_current");
    db.exec("COMMIT"); return { packet, status: write.status, session_admission: admission };
  } catch (e) { if (db.inTransaction) db.exec("ROLLBACK"); throw e; }
}

// Shared historical attribution owners; neither checks current execution authority.
export { packetFrom as readHistoricalStatelessPacket, sessionAt as assertHistoricalStatelessSession };
