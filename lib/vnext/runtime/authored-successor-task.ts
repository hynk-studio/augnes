import { isOrdinarySuccessorRevisionV01, inspectOrdinarySuccessorRevisionV01, ordinarySuccessorRevisionMaterialV01, ordinarySuccessorRevisionIdempotencyKeyV01 } from "./authored-successor-revision";
import { AUTHORED_SUCCESSOR_TASK_V01, AUTHORED_SUCCESSOR_REVALIDATION_V01, AUTHORED_SUCCESSOR_CONTEXT_V01 } from "@/types/vnext/project-work-initialization";
import { buildSelectedWorkSourceEntry, compareSelectedWorkSources, normalizeSelectedWorkSources, SelectedWorkSourceError } from "@/lib/intake/selected-work-source-comparison";
import type { SelectedWorkSourceSelection } from "@/types/vnext/project-work-revision";
import { VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01 } from "./persisted-semantic-context-compiler";
import type Database from "better-sqlite3";
import { isTerminalRunnerStatus } from "@/lib/autonomy/runner-state";
import { VNEXT_OPERATOR_PILOT_LATER_PACKET_TTL_MS_V01 } from "./operator-pilot-semantic-transition";
import { hasUnsettledAutonomyRunLedgerRecords, listAutonomyRunLedgerRecords } from "@/lib/autonomy/runner-ledger";
import { equalSuccessorV01 as equal, normalizeAuthoredSuccessorTaskV01,
  readAuthoredSuccessorDefinitionV01, requireSuccessorV01 as check, successorDigestV01 as digest,
  type AuthoredSuccessorTaskDefinitionV01 } from "@/lib/vnext/authored-successor-task";
import { canonicalizeProtocolValueV01, parseStrictIsoTimestampV01 } from "@/lib/vnext/protocol-primitives";
import { buildTaskContextPacketV01, validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import { insertVNextCoreRecordV01, listVNextCoreRecordsV01 } from "@/lib/vnext/persistence/durable-semantic-store";
import { readCanonicalProjectWithRootV01 } from "@/lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import { admitVNextLocalOperatorMutationInsideTransactionV01, readVNextLocalOperatorSessionHistoryV01,
  type VNextLocalOperatorPilotConfigV01, type VNextLocalOperatorSessionCredentialV01,
  type VNextLocalOperatorSecretSourceV01 } from "./local-operator-session";
import { readVNextLocalRuntimeClockNowV01, type VNextLocalRuntimeClockV01 } from "./local-runtime-clock";
import { readProjectRunResultSourceBindingV01 } from "./project-run-result-read-model";
import { admitPersistedHostTaskContextPacketV01, inspectPersistedHostProjectRootV01 } from "./direct-native-host-round-trip";
import { inspectVNextOperatorPilotPacketLineageV01, projectVNextOperatorPilotContinuityV01 } from "./operator-pilot-project-continuity";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import { buildTaskStartGuideBriefCodexProjectionV02 } from "@/lib/vnext/guide-brief/project-guide-brief";
import { fingerprintNativeHostPhysicalRootIdentityV01 } from "@/lib/vnext/native-host/project-root-identity";
import { createCodexScopedTaskV01, inspectCodexScopedTaskSourceV01 } from "@/lib/vnext/native-host/codex-scoped-task";
import { readProjectWorkInitializationV01 } from "./project-work-initialization";
import { normalizeInitialProjectWorkDefinitionV01 } from "./initial-project-work-context";

const ACTION = "define_authored_successor_task";
const MATERIAL = `${AUTHORED_SUCCESSOR_TASK_V01}:source`;
export type ResultWorkBindingV01 = Pick<DefineAuthoredSuccessorTaskRequestV01,
  "expected_current_packet_id" | "expected_current_packet_fingerprint" | "expected_latest_receipt_id" |
  "expected_latest_receipt_fingerprint" | "expected_active_selection_revision" | "expected_root_fingerprint">;

/** Read the current settled predecessor. This does not make a preparation current. */
export function readResultWorkPreparationV01(db: Database.Database, input: {
  config: VNextLocalOperatorPilotConfigV01; receipt_id: string; clock?: VNextLocalRuntimeClockV01;
}) {
  const r = readProjectRunResultSourceBindingV01(db, { ...input.config, receipt_id: input.receipt_id });
  const initialization = readProjectWorkInitializationV01(db, input.config);
  const continuity = projectVNextOperatorPilotContinuityV01(db, input);
  const roots = r.receipt.source_refs.filter(v => v.ref_type === "project_root_scope");
  check(r.packet && r.run && roots.length === 1 && roots[0]!.source_ref &&
    initialization.active_project_id === input.config.project_id && initialization.active_selection_revision !== null &&
    initialization.current_packet?.packet_id === r.packet.packet_id &&
    initialization.current_packet.packet_fingerprint === r.packet.integrity.fingerprint &&
    continuity.packet_currentness === "fresh" && r.run.status === "completed" && r.receipt.execution.status === "completed" &&
    r.run.metadata.terminal_receipt_persisted === true && r.run.metadata.reconciliation_required === false &&
    listAutonomyRunLedgerRecords({ db, scope: input.config.project_id, limit: 1 })[0]?.run_id === r.run.run_id,
  "preparation_unavailable");
  const binding: ResultWorkBindingV01 = {
    expected_current_packet_id: r.packet.packet_id, expected_current_packet_fingerprint: r.packet.integrity.fingerprint,
    expected_latest_receipt_id: r.receipt.receipt_id, expected_latest_receipt_fingerprint: r.receipt.integrity.fingerprint,
    expected_active_selection_revision: initialization.active_selection_revision, expected_root_fingerprint: roots[0]!.source_ref!,
  };
  // The receipt records a report, not verification of the report's prose.
  // Whole-note limits apply; a long report is never silently truncated.
  let result_source = null;
  try {
    result_source = buildSelectedWorkSourceEntry(r.packet, {
      source: `${r.receipt.receipt_id} ${r.receipt.integrity.fingerprint}`, observed_at: r.receipt.recorded_at,
      provenance: "imported_unverified", label: "Unclassified / needs review",
      text: `Recorded execution: ${r.receipt.execution.status}; verification: ${r.receipt.verification.status}.\nHost report (not independently verified): ${r.receipt.result_summary.summary}`,
    });
  } catch (error) {
    if (!(error instanceof SelectedWorkSourceError)) throw error;
    // The reviewer can select a bounded attributed excerpt instead.
  }
  return { initialization, binding, result_source };
}

export function compareResultWorkSourcesV01(db: Database.Database, input: {
  config: VNextLocalOperatorPilotConfigV01; binding: ResultWorkBindingV01; notes: unknown[]; clock?: VNextLocalRuntimeClockV01;
}) {
  const current = readResultWorkPreparationV01(db, { ...input, receipt_id: input.binding.expected_latest_receipt_id });
  check(equal(current.binding, input.binding), "preparation_changed");
  const r = readProjectRunResultSourceBindingV01(db, { ...input.config, receipt_id: input.binding.expected_latest_receipt_id });
  return compareSelectedWorkSources(r.packet!, input.notes.map(note => buildSelectedWorkSourceEntry(input.config, note)));
}

export function previewResultWorkV01(db: Database.Database, input: {
  config: VNextLocalOperatorPilotConfigV01; binding: ResultWorkBindingV01; definition: unknown;
  selected_sources: DefineAuthoredSuccessorTaskRequestV01["selected_sources"]; clock?: VNextLocalRuntimeClockV01;
}) {
  const before = readResultWorkPreparationV01(db, { ...input, receipt_id: input.binding.expected_latest_receipt_id });
  check(equal(before.binding, input.binding) && input.selected_sources, "preparation_changed");
  check(input.definition && typeof input.definition === "object" && !Array.isArray(input.definition) &&
    equal(Object.keys(input.definition).sort(), ["goal", "non_goals", "success_criteria"]), "definition_fields");
  const d = normalizeInitialProjectWorkDefinitionV01(input.definition as { goal: unknown; success_criteria: unknown; non_goals: unknown });
  const request = parseRequest({ action: ACTION, ...input.binding, selected_sources: input.selected_sources,
    definition: { objective: d.goal, checks: d.success_criteria.map((criterion, index) => ({ check_id: `criterion_${index + 1}`, criterion })),
      stop_conditions: d.non_goals, materials: [], approved_instruction_hashes: [] } });
  source(db, input.config, request);
  return { request, before: before.initialization.current_work, after: d,
    sources_before: before.initialization.selected_source_context ?? [], sources_after: request.selected_sources!.selected_source_context,
    omitted_sources: request.selected_sources!.omitted_sources, writes: 0 as const };
}
export interface DefineAuthoredSuccessorTaskRequestV01 {
  action: typeof ACTION;
  expected_current_packet_id: string;
  expected_current_packet_fingerprint: string;
  expected_latest_receipt_id: string;
  expected_latest_receipt_fingerprint: string;
  expected_active_selection_revision: number;
  expected_root_fingerprint: string;
  definition: AuthoredSuccessorTaskDefinitionV01;
  /** Explicit ordinary preparation; incompatible with the scoped read-only profile. */
  selected_sources?: SelectedWorkSourceSelection & { omitted_sources: Array<{ source_binding: string; reason: string }> };
  /** Explicit authenticated authorship only; not a packet refresh or grant. */
  revalidation?: { profile: typeof AUTHORED_SUCCESSOR_REVALIDATION_V01; expires_at: string };
}
interface SourceMaterial {
  request: DefineAuthoredSuccessorTaskRequestV01;
  source_root_ref: ExternalRefV01;
  physical_root_fingerprint: string;
  session_id: string;
}
export interface AuthoredSuccessorPacketLineageV01 {
  lineage_kind: "authored_successor_task";
  packet: TaskContextPacketV01;
  prior_packet: { packet_id: string; packet_fingerprint: string };
  inherited_context_current: boolean;
  projection_current: boolean;
  source_transition_receipt: null;
  successor_definition_ref: ExternalRefV01;
  operator_action_ref: ExternalRefV01;
  immediate_prior_packet_ref: ExternalRefV01;
  predecessor_receipt_ref: ExternalRefV01;
}
function parseRequest(value: unknown): DefineAuthoredSuccessorTaskRequestV01 {
  check(value && typeof value === "object" && !Array.isArray(value), "request_invalid");
  const r = value as DefineAuthoredSuccessorTaskRequestV01;
  check(equal(Object.keys(r).sort(), ["action", "definition", "expected_active_selection_revision", "expected_current_packet_fingerprint",
    "expected_current_packet_id", "expected_latest_receipt_fingerprint", "expected_latest_receipt_id", "expected_root_fingerprint", ...(r.revalidation !== undefined ? ["revalidation"] : []), ...(r.selected_sources !== undefined ? ["selected_sources"] : [])].sort()), "request_fields");
  check(r.action === ACTION && Number.isSafeInteger(r.expected_active_selection_revision) && r.expected_active_selection_revision > 0 &&
    /^task-context-packet:[a-f0-9]+$/u.test(r.expected_current_packet_id) && /^run-receipt:[a-f0-9]+$/u.test(r.expected_latest_receipt_id) &&
    [r.expected_current_packet_fingerprint, r.expected_latest_receipt_fingerprint, r.expected_root_fingerprint].every(v => /^sha256:[a-f0-9]{64}$/u.test(v)), "request_binding");
  if (r.revalidation !== undefined) check(r.revalidation &&
    equal(Object.keys(r.revalidation).sort(), ["expires_at", "profile"]) &&
    r.revalidation.profile === AUTHORED_SUCCESSOR_REVALIDATION_V01 &&
    typeof r.revalidation.expires_at === "string" && parseStrictIsoTimestampV01(r.revalidation.expires_at) !== null, "revalidation_invalid");
  if (r.selected_sources !== undefined) {
    const s = r.selected_sources;
    check(!r.revalidation && s && equal(Object.keys(s).sort(), ["expected_source_comparison", "omitted_sources", "selected_source_context"]) &&
      /^sha256:[a-f0-9]{64}$/u.test(s.expected_source_comparison) && Array.isArray(s.omitted_sources) && s.omitted_sources.length <= 8 &&
      s.omitted_sources.every(row => row && equal(Object.keys(row).sort(), ["reason", "source_binding"]) &&
        /^sha256:[a-f0-9]{64}$/u.test(row.source_binding) && typeof row.reason === "string" && row.reason.trim().length > 0 &&
        [...row.reason].length <= 500 && !/[\u0000-\u001f\u007f]/u.test(row.reason)), "source_selection_invalid");
  }
  return { ...structuredClone(r), definition: normalizeAuthoredSuccessorTaskV01(r.definition, r.selected_sources !== undefined) };
}
function ref(type: string, id: string, fingerprint: string, at: string, trust: ExternalRefV01["trust_class"] = "direct_local_observation"): ExternalRefV01 {
  return { ref_version: "external_ref.v0.1", ref_type: type, external_id: id, source_ref: fingerprint,
    observed_at: at, trust_class: trust, compatibility_namespace: AUTHORED_SUCCESSOR_TASK_V01 };
}
function source(db: Database.Database, config: VNextLocalOperatorPilotConfigV01, request: DefineAuthoredSuccessorTaskRequestV01) {
  const r = readProjectRunResultSourceBindingV01(db, { ...config, receipt_id: request.expected_latest_receipt_id });
  check(r.packet && r.receipt.integrity.fingerprint === request.expected_latest_receipt_fingerprint &&
    r.packet.packet_id === request.expected_current_packet_id && r.packet.integrity.fingerprint === request.expected_current_packet_fingerprint &&
    (!r.run || (r.run.status === r.receipt.execution.status && r.run.metadata.reconciliation_required === false &&
      r.run.metadata.terminal_receipt_persisted === true)) &&
    (r.receipt.execution.status === "completed" || (request.revalidation && r.receipt.execution.status === "failed")) &&
    r.receipt.source_refs.some(v => v.ref_type === "project_root_scope" && v.source_ref === request.expected_root_fingerprint), "predecessor_unsettled_or_mismatched");
  if (request.revalidation) {
    const priorDefinition = readAuthoredSuccessorDefinitionV01(r.packet);
    check(equal(priorDefinition.materials, request.definition.materials) &&
      equal(priorDefinition.approved_instruction_hashes, request.definition.approved_instruction_hashes), "reviewed_inputs_changed");
  }
  if (request.selected_sources) {
    const selection = request.selected_sources;
    const comparison = compareSelectedWorkSources(r.packet, selection.selected_source_context);
    check(comparison.fingerprint === selection.expected_source_comparison, "source_comparison_changed");
    check(equal([...selection.omitted_sources.map(row => row.source_binding)].sort(),
      comparison.unselected_previous.map(row => row.source_ref!).sort()), "source_omissions_invalid");
  }
  return { ...r, packet: r.packet, run: r.run };
}
function assertNewLifetime(request: DefineAuthoredSuccessorTaskRequestV01, at: string, sessionExpiresAt?: string): void {
  if (!request.revalidation) return;
  const expires = parseStrictIsoTimestampV01(request.revalidation.expires_at), now = parseStrictIsoTimestampV01(at);
  check(expires !== null && now !== null && expires > now && expires - now <= VNEXT_OPERATOR_PILOT_LATER_PACKET_TTL_MS_V01 &&
    (!sessionExpiresAt || expires <= Date.parse(sessionExpiresAt)), "lifetime_invalid");
}
function assertRevalidatedHistoryCurrent(db: Database.Database, config: VNextLocalOperatorPilotConfigV01,
  request: DefineAuthoredSuccessorTaskRequestV01, at: string) {
  const lineage = inspectVNextOperatorPilotPacketLineageV01(db, { config,
    packet_id: request.expected_current_packet_id, packet_fingerprint: request.expected_current_packet_fingerprint });
  // Evaluate NOW, preserving every independent error. Only the predecessor
  // envelope's expiry may be historical; it is never executable admission.
  const validation = validateTaskContextPacketV01(lineage.packet, { evaluated_at: at });
  check(validation.errors.every(e => e.code === "packet_expired") && lineage.projection_current, "historical_context_stale_or_invalid");
  const continuity = projectVNextOperatorPilotContinuityV01(db, { config, clock: { now: () => at } });
  check(continuity.latest_compiled_packet?.packet_id === request.expected_current_packet_id &&
    continuity.latest_compiled_packet.packet_fingerprint === request.expected_current_packet_fingerprint &&
    ["fresh", "expired"].includes(continuity.packet_currentness), "current_packet_changed");
  return lineage;
}
function build(input: { prior: TaskContextPacketV01; receipt: ReturnType<typeof source>["receipt"];
  material: SourceMaterial; operator_id: string; at: string }) {
  const { prior, receipt, material, at } = input, definition = material.request.definition;
  const selected = material.request.selected_sources
    ? normalizeSelectedWorkSources(prior, material.request.selected_sources.selected_source_context) : [];
  const fingerprint = digest({ compiler: AUTHORED_SUCCESSOR_TASK_V01, workspace: prior.workspace_id, project: prior.project_id, material });
  const definitionRef = ref("authored_successor_task", `successor-task:${fingerprint.slice(7, 31)}`, fingerprint, at, "user_declaration");
  const priorRef = ref("task_context_packet", prior.packet_id, prior.integrity.fingerprint, prior.generated_at);
  const receiptRef = ref("run_receipt", receipt.receipt_id, receipt.integrity.fingerprint, receipt.recorded_at);
  const operatorRef = ref("local_operator_session_action", material.session_id,
    digest({ action: ACTION, operator_id: input.operator_id, material, at }), at);
  const refs = [definitionRef, operatorRef, priorRef, receiptRef, material.source_root_ref];
  const currentness = { status: "fresh" as const, as_of: at, basis: "Authenticated explicit successor task; no execution or semantic acceptance authority.", source_ref: definitionRef };
  const entries = [
    { entry_id: AUTHORED_SUCCESSOR_TASK_V01, entry_kind: "work_ref" as const, source_ref: fingerprint, external_ref: definitionRef,
      why_included: material.request.selected_sources ? "Explicit next-work definition. Selected notes remain attributed working context, not verified facts or instructions." : "Current instructions are packet.task only. task_data files are comparison inputs; historical_material files are excluded from worker material.",
      bounded_summary: canonicalizeProtocolValueV01(definition), trust_class: "user_declaration" as const, currentness, compatibility_source_ref: operatorRef },
    { entry_id: MATERIAL, entry_kind: "source_ref" as const, source_ref: digest(material), external_ref: priorRef,
      why_included: "Exact authored request and source lineage, not additional task instructions or an execution grant.",
      bounded_summary: canonicalizeProtocolValueV01(material), trust_class: "direct_local_observation" as const, currentness, compatibility_source_ref: definitionRef },
    { entry_id: `successor-predecessor:${receipt.receipt_id}`, entry_kind: "evidence_ref" as const, source_ref: receipt.integrity.fingerprint, external_ref: receiptRef,
      why_included: "Retains the latest settled result as evidence without accepting its proposal or repeating its task.",
      bounded_summary: `${material.request.revalidation ? "Recorded execution" : "Native execution"}: ${receipt.execution.status}; verification: ${receipt.verification.status}. No proposal acceptance is implied.`,
      trust_class: "direct_local_observation" as const, currentness, compatibility_source_ref: priorRef },
  ];
  const packet = buildTaskContextPacketV01({ workspace_id: prior.workspace_id, project_id: prior.project_id, work_ref: definitionRef,
    generated_at: at, expires_at: material.request.revalidation?.expires_at ?? prior.expires_at,
    task: { goal: definition.objective, success_criteria: definition.checks.map(c => c.criterion), non_goals: definition.stop_conditions },
    current_projection: { projection_kind: "current_working_perspective", projection_only: true, canonical_state: false,
      perspective_ref: null, bounded_summary: definition.objective, as_of: at,
      items: [{ item_kind: "active_goal", summary: definition.objective, source_refs: [fingerprint], external_refs: [definitionRef], currentness }],
      source_refs: [fingerprint], external_refs: [definitionRef], currentness, warnings: ["Explicit user-authored task, not an inference from accepted context."] },
    selected_context: [...prior.selected_context.filter(e => e.entry_kind === "accepted_state_ref"), ...entries, ...selected],
    excluded_context: prior.selected_context.filter(e => e.entry_kind !== "accepted_state_ref" && !selected.some(note => note.entry_id === e.entry_id)).map(e => ({ entry_id: e.entry_id,
      source_ref: e.source_ref, external_ref: e.external_ref, why_excluded: material.request.selected_sources?.omitted_sources.find(row => row.source_binding === e.source_ref)?.reason ?? "Historical predecessor context; not an active successor instruction.", currentness: e.currentness })),
    tensions: [], risks: [], gaps: [],
    constraints: { required_checks: definition.checks.map(c => c.check_id).sort(), forbidden_actions: definition.stop_conditions,
      data_classification: prior.constraints.data_classification, context_budget: { max_selected_entries: 24, max_projection_items: 4,
        max_characters: 76_000, max_estimated_tokens: 19_000 } },
    capability_grant: null,
    return_contract: { return_kind: "bounded_result", required_fields: ["status", "summary", "checks"], expected_artifacts: [],
      required_checks: definition.checks.map(c => c.check_id).sort(), return_ref: null, compatibility_only: false },
    source_status: { status: prior.source_status.status, currentness, source_refs: [...prior.source_status.source_refs, ...refs.map(r => r.source_ref!)],
      external_refs: [...prior.source_status.external_refs, ...refs], warnings: ["The predecessor remains immutable; file reads and comparison results retain their actual evidence basis."] },
    compatibility: { source_contracts: [AUTHORED_SUCCESSOR_TASK_V01, ...(material.request.selected_sources ? [AUTHORED_SUCCESSOR_CONTEXT_V01] : []), ...(material.request.revalidation ? [AUTHORED_SUCCESSOR_REVALIDATION_V01] : [])], legacy_scope_ref: null,
      source_refs: [...prior.compatibility.source_refs, ...refs], unmapped_fields: [], warnings: [] },
  }, { required_selected_entry_ids: [...prior.selected_context.filter(e => e.entry_kind === "accepted_state_ref"), ...entries, ...selected].map(e => e.entry_id) });
  return { packet, successor_definition_ref: definitionRef, operator_action_ref: operatorRef,
    immediate_prior_packet_ref: priorRef, predecessor_receipt_ref: receiptRef };
}
function materialFrom(packet: TaskContextPacketV01): SourceMaterial {
  readAuthoredSuccessorDefinitionV01(packet);
  const entries = packet.selected_context.filter(e => e.entry_id === MATERIAL);
  check(entries.length === 1 && typeof entries[0]!.bounded_summary === "string" && Buffer.byteLength(entries[0]!.bounded_summary!) <= 24_576, "source_material_missing");
  let m: SourceMaterial;
  try { m = JSON.parse(entries[0]!.bounded_summary!); } catch { check(false, "source_material_invalid"); }
  check(m! && equal(Object.keys(m!).sort(), ["physical_root_fingerprint", "request", "session_id", "source_root_ref"]), "source_material_invalid");
  return { ...m!, request: parseRequest(m!.request) };
}

/** Authenticated, compare-and-set, append-only task authorship. The latest
 * result may have failed verification; its execution must actually be settled.
 * No continuation coordinator, disposition, semantic writer or worker is used. */
export async function defineAuthoredSuccessorTaskV01(db: Database.Database, input: {
  config: VNextLocalOperatorPilotConfigV01; credential: VNextLocalOperatorSessionCredentialV01; request: unknown;
  clock?: VNextLocalRuntimeClockV01; secret_source?: VNextLocalOperatorSecretSourceV01;
  approved_instruction_files?: readonly { path: string; sha256: string }[];
}) {
  const request = parseRequest(input.request);
  const at = readVNextLocalRuntimeClockNowV01(input.clock, "successor_task_authorship_time");
  assertNewLifetime(request, at);
  if (request.revalidation) check(readProjectRunResultSourceBindingV01(db, { ...input.config,
    receipt_id: request.expected_latest_receipt_id }).run, "local_predecessor_required");
  const instructionFiles = structuredClone(input.approved_instruction_files ?? []);
  const root = request.revalidation
    ? await inspectPersistedHostProjectRootV01(db, { config: input.config, evaluated_at: at })
    : (await admitPersistedHostTaskContextPacketV01(db, { config: input.config,
      packet_id: request.expected_current_packet_id, packet_fingerprint: request.expected_current_packet_fingerprint,
      evaluated_at: at, require_active_project: true })).root_scope;
  check(root.root_fingerprint === request.expected_root_fingerprint, "root_changed");
  if (request.revalidation) {
    assertRevalidatedHistoryCurrent(db, input.config, request, at);
    source(db, input.config, request);
    check(equal(instructionFiles.map(f => f.sha256), request.definition.approved_instruction_hashes), "instruction_hashes_changed");
    const inventory = (role: "task_data" | "historical_material") => request.definition.materials.filter(m => m.role === role)
      .map(({ relative_path, sha256 }) => ({ relative_path, sha256 }));
    const inspected = await inspectCodexScopedTaskSourceV01({ stage: 2, canonical_root: root.canonical_root,
      packet_id: request.expected_current_packet_id, packet_fingerprint: request.expected_current_packet_fingerprint,
      guide_brief_fingerprint: digest(request.definition), files: inventory("task_data"), historical_files: inventory("historical_material"),
      approved_instruction_files: instructionFiles });
    check(equal(inspected.physical, root.physical_root_identity), "root_changed");
  }
  check(!db.inTransaction, "transaction_conflict");
  db.exec("BEGIN IMMEDIATE");
  try {
    const auth = admitVNextLocalOperatorMutationInsideTransactionV01(db, input);
    const selection = readActiveProjectSelectionV01(db, input.config.workspace_id);
    check(selection?.project_id === input.config.project_id && selection.selection_revision === request.expected_active_selection_revision, "selection_changed");
    if (request.revalidation) assertRevalidatedHistoryCurrent(db, input.config, request, auth.action_observed_at);
    else {
      const continuity = projectVNextOperatorPilotContinuityV01(db, { config: input.config, clock: { now: () => auth.action_observed_at } });
      check(continuity.latest_compiled_packet?.packet_id === request.expected_current_packet_id &&
        continuity.latest_compiled_packet.packet_fingerprint === request.expected_current_packet_fingerprint && continuity.packet_currentness === "fresh", "current_packet_changed");
    }
    assertNewLifetime(request, auth.action_observed_at, auth.session.expires_at);
    const predecessor = source(db, input.config, request);
    // Authorship requires the live ledger's settled predecessor. A portable
    // receipt alone can be read as history, but cannot authorize this writer.
    check(predecessor.run, "local_predecessor_required");
    check(listAutonomyRunLedgerRecords({ db, scope: input.config.project_id, limit: 1 })[0]?.run_id === predecessor.run.run_id, "latest_run_changed");
    if (request.revalidation || request.selected_sources) {
      if (request.selected_sources) {
        check(!hasUnsettledAutonomyRunLedgerRecords({ db, scope: input.config.project_id }), "conflicting_run");
      } else {
        // Keep the older scoped revalidation contract unchanged.
        const runs = listAutonomyRunLedgerRecords({ db, scope: input.config.project_id, limit: 128 });
        check(runs.length < 128 && runs.every(r => isTerminalRunnerStatus(r.status) && r.metadata.reconciliation_required !== true), "conflicting_run");
      }
      check(predecessor.run.finished_at !== null && predecessor.run.finished_at === predecessor.receipt.finished_at &&
        predecessor.run.metadata.pending_approval == null &&
        predecessor.run.metadata.run_receipt_id === predecessor.receipt.receipt_id &&
        predecessor.run.metadata.run_receipt_fingerprint === predecessor.receipt.integrity.fingerprint &&
        predecessor.run.metadata.root_physical_identity_fingerprint === fingerprintNativeHostPhysicalRootIdentityV01(root.physical_root_identity), "local_predecessor_binding");
    }
    check(Date.parse(auth.action_observed_at) > Date.parse(predecessor.packet.generated_at) &&
      Date.parse(auth.action_observed_at) >= Date.parse(predecessor.receipt.recorded_at), "authorship_time");
    const built = build({ prior: predecessor.packet, receipt: predecessor.receipt, operator_id: input.config.operator_id,
      at: auth.action_observed_at, material: { request, source_root_ref: root.root_scope_ref, physical_root_fingerprint: fingerprintNativeHostPhysicalRootIdentityV01(root.physical_root_identity), session_id: auth.session.session_id } });
    const validation = validateTaskContextPacketV01(built.packet, { evaluated_at: auth.action_observed_at });
    check(validation.status === "valid", "packet_invalid");
    const write = insertVNextCoreRecordV01(db, { record_kind: "task_context_packet", record_id: built.packet.packet_id,
      workspace_id: input.config.workspace_id, project_id: input.config.project_id, fingerprint: built.packet.integrity.fingerprint,
      idempotency_key: digest({ action: ACTION, prior: predecessor.packet.integrity.fingerprint, request }), payload: built.packet, created_at: built.packet.generated_at });
    check(inspectAuthoredSuccessorPacketV01(db, { config: input.config, packet: built.packet }).projection_current, "compiled_packet_stale");
    db.exec("COMMIT");
    return { status: write.status, packet: built.packet, session_admission: auth, execution_authority_granted: false as const, semantic_transition_created: false as const };
  } catch (error) { if (db.inTransaction) db.exec("ROLLBACK"); throw error; }
}

export function inspectAuthoredSuccessorPacketV01(db: Database.Database, input: {
  config: VNextLocalOperatorPilotConfigV01; packet: TaskContextPacketV01;
}): AuthoredSuccessorPacketLineageV01 {
  if (isOrdinarySuccessorRevisionV01(input.packet)) return inspectOrdinarySuccessorRevisionV01(db, input);
  // Recovery/portable readers retain durable receipt and authenticated task
  // provenance without reconstructing a machine-local run or execution grant.
  const packet = input.packet, material = materialFrom(packet), prior = source(db, input.config, material.request);
  check(packet.workspace_id === input.config.workspace_id && packet.project_id === input.config.project_id &&
    Date.parse(packet.generated_at) > Date.parse(prior.packet.generated_at) && Date.parse(packet.generated_at) >= Date.parse(prior.receipt.recorded_at), "source_scope_or_order");
  const session = readVNextLocalOperatorSessionHistoryV01(db, { session_id: material.session_id });
  const at = Date.parse(packet.generated_at);
  check(session && session.workspace_id === input.config.workspace_id && session.project_id === input.config.project_id &&
    session.bootstrap_consumed_at && at >= Date.parse(session.issued_at) && at >= Date.parse(session.bootstrap_consumed_at) &&
    at <= Date.parse(session.expires_at) && (!session.revoked_at || at <= Date.parse(session.revoked_at)), "operator_provenance");
  assertNewLifetime(material.request, packet.generated_at, session.expires_at);
  check(/^sha256:[a-f0-9]{64}$/u.test(material.physical_root_fingerprint) &&
    (!prior.run || material.physical_root_fingerprint === prior.run.metadata.root_physical_identity_fingerprint) &&
    material.source_root_ref.ref_type === "project_root_scope" && material.source_root_ref.source_ref === material.request.expected_root_fingerprint &&
    prior.receipt.source_refs.some(r => r.ref_type === "project_root_scope" && r.source_ref === material.source_root_ref.source_ref && r.external_id === material.source_root_ref.external_id), "root_lineage");
  const lineage = inspectVNextOperatorPilotPacketLineageV01(db, { config: input.config,
    packet_id: prior.packet.packet_id, packet_fingerprint: prior.packet.integrity.fingerprint });
  const expected = build({ prior: prior.packet, receipt: prior.receipt, material, operator_id: session.operator_id, at: packet.generated_at });
  check(equal(expected.packet, packet), "compiler_binding");
  // An authored predecessor is historical as soon as its successor exists.
  // Inherit its independently revalidated context, not that task-supersession
  // flag. The first non-authored ancestor still checks actual semantic state
  // through the common lineage owner on every read.
  const inheritedContextCurrent = lineage.lineage_kind === "authored_successor_task"
    ? lineage.inherited_context_current : lineage.projection_current;
  return { ...expected, lineage_kind: "authored_successor_task", prior_packet: { packet_id: prior.packet.packet_id, packet_fingerprint: prior.packet.integrity.fingerprint },
    inherited_context_current: inheritedContextCurrent,
    projection_current: inheritedContextCurrent && !hasAuthoredSuccessorOfPacketV01(db, input.config, packet.packet_id), source_transition_receipt: null };
}

export function hasAuthoredSuccessorOfPacketV01(db: Database.Database, config: Pick<VNextLocalOperatorPilotConfigV01, "workspace_id" | "project_id">, packetId: string): boolean {
  const rows = listVNextCoreRecordsV01(db, { ...config, record_kinds: ["task_context_packet"], limit: 256 });
  check(rows.length < 256, "packet_scan_bound");
  return rows.some(row => { const p = row.payload as TaskContextPacketV01;
    return isStandaloneAuthoredSuccessorV01(p) && (isOrdinarySuccessorRevisionV01(p) ? ordinarySuccessorRevisionMaterialV01(p) : materialFrom(p)).request.expected_current_packet_id === packetId; });
}

/** Trusted local preparation for this authored read-only profile. No window is
 * created or renewed. The caller still needs separately authorized execution.
 * Legacy X-only packets refuse here, before a scope, Start or adapter exists. */
export async function prepareAuthoredSuccessorHandoffV01(db: Database.Database, input: {
  config: VNextLocalOperatorPilotConfigV01; packet_id: string; packet_fingerprint: string;
  approved_instruction_files?: readonly { path: string; sha256: string }[];
  clock?: VNextLocalRuntimeClockV01;
}) {
  const admission = await admitPersistedHostTaskContextPacketV01(db, { ...input,
    evaluated_at: readVNextLocalRuntimeClockNowV01(input.clock, "successor_task_handoff_time"), require_active_project: true });
  check(!admission.packet.compatibility.source_contracts.includes(AUTHORED_SUCCESSOR_CONTEXT_V01), "scoped_profile_required");
  check(admission.packet_lineage.lineage_kind === "authored_successor_task" ||
    (admission.packet_lineage.lineage_kind === "semantic_transition" && admission.packet.compatibility.source_contracts.includes(AUTHORED_SUCCESSOR_TASK_V01)), "authored_definition_required");
  const d = readAuthoredSuccessorDefinitionV01(admission.packet), m = materialFrom(admission.packet);
  check(admission.root_scope.root_fingerprint === m.request.expected_root_fingerprint &&
    fingerprintNativeHostPhysicalRootIdentityV01(admission.root_scope.physical_root_identity) === m.physical_root_fingerprint, "root_changed");
  check(equal((input.approved_instruction_files ?? []).map(f => f.sha256), d.approved_instruction_hashes), "instruction_hashes_changed");
  const inventory = (role: "task_data" | "historical_material") => d.materials.filter(m => m.role === role).map(({ relative_path, sha256 }) => ({ relative_path, sha256 }));
  const project = readCanonicalProjectWithRootV01(db, input.config);
  check(project, "project_missing");
  const guide = buildTaskStartGuideBriefCodexProjectionV02({ packet: admission.packet, project_name: project.project.display_name });
  const scope = await createCodexScopedTaskV01({ stage: 2, canonical_root: admission.root_scope.canonical_root,
    packet_id: admission.packet.packet_id, packet_fingerprint: admission.packet.integrity.fingerprint,
    guide_brief_fingerprint: digest(guide), files: inventory("task_data"), historical_files: inventory("historical_material"),
    approved_instruction_files: input.approved_instruction_files });
  return { admission, guide, scope, execution_authority_granted: false as const, execution_window_created: false as const };
}

export function authoredSuccessorPacketIdempotencyKeyV01(packet: TaskContextPacketV01): string | null {
  if (!isStandaloneAuthoredSuccessorV01(packet)) return null;
  if (isOrdinarySuccessorRevisionV01(packet)) return ordinarySuccessorRevisionIdempotencyKeyV01(packet);
  const request = materialFrom(packet).request;
  return digest({ action: ACTION, prior: request.expected_current_packet_fingerprint, request });
}

export function isStandaloneAuthoredSuccessorV01(packet: TaskContextPacketV01): boolean {
  return packet.compatibility.source_contracts.includes(AUTHORED_SUCCESSOR_TASK_V01) &&
    !packet.compatibility.source_contracts.includes(VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01);
}

/** The ordinary revision compiler inherits these exact bindings without copying old notes. */
export function readOrdinarySuccessorRootBindingV01(packet: TaskContextPacketV01) {
  check(packet.compatibility.source_contracts.includes(AUTHORED_SUCCESSOR_CONTEXT_V01) && !isOrdinarySuccessorRevisionV01(packet), "ordinary_preparation_required");
  const { source_root_ref, physical_root_fingerprint } = materialFrom(packet);
  return { source_root_ref, physical_root_fingerprint };
}
