import type Database from "better-sqlite3";
import { hasAutonomyRunAdmissionForPreparation, hasUnsettledAutonomyRunLedgerRecords } from "@/lib/autonomy/runner-ledger";
import { compareSelectedWorkSources, readSelectedWorkSources } from "@/lib/intake/selected-work-source-comparison";
import { resolveRetainedWorkSources } from "@/lib/intake/retained-work-source-recall";
import { equalSuccessorV01 as equal, successorDigestV01 as digest } from "@/lib/vnext/authored-successor-task";
import { fingerprintNativeHostPhysicalRootIdentityV01, inspectNativeHostPhysicalRootIdentitySynchronouslyV01 } from "@/lib/vnext/native-host/project-root-identity";
import { assertVNextCoreRecordMatchesProtocolPayloadBindingV01, insertVNextCoreRecordV01, readVNextCoreRecordV01 } from "@/lib/vnext/persistence/durable-semantic-store";
import { readCanonicalProjectWithRootV01 } from "@/lib/vnext/persistence/project-identity-registry";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import { buildTaskContextPacketV01, validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import { AUTHORED_SUCCESSOR_CONTEXT_V01, AUTHORED_SUCCESSOR_TASK_V01 } from "@/types/vnext/project-work-initialization";
import { AUTHORED_SUCCESSOR_REVISION_V01, MAX_PRE_EXECUTION_PROJECT_WORK_REVISIONS_V01, type RevisePreExecutionProjectWorkRequestV01 } from "@/types/vnext/project-work-revision";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import { hasAuthoredSuccessorOfPacketV01, inspectAuthoredSuccessorPacketV01, readOrdinarySuccessorRootBindingV01, type AuthoredSuccessorPacketLineageV01 } from "./authored-successor-task";
import { normalizeInitialProjectWorkDefinitionV01 } from "./initial-project-work-context";
import { readVNextLocalOperatorSessionHistoryV01, type VNextLocalOperatorPilotConfigV01 } from "./local-operator-session";
import { readCurrentProjectWorkPacketLineageV01 } from "./operator-pilot-project-continuity";
import { ProjectWorkRevisionErrorV01, parseProjectWorkRevisionRequestV01 } from "./project-work-revision";

function check(value: unknown, reason: string): asserts value {
  if (!value) throw new ProjectWorkRevisionErrorV01(`work_revision_${reason.replace(/^revision_/u, "")}`, 409);
}

type Scope = Pick<VNextLocalOperatorPilotConfigV01, "workspace_id" | "project_id">;
interface Material {
  request: RevisePreExecutionProjectWorkRequestV01;
  origin_packet_id: string;
  origin_packet_fingerprint: string;
  revision_number: number;
  session_id: string;
  source_root_ref: ExternalRefV01;
  physical_root_fingerprint: string;
}
const MATERIAL = `${AUTHORED_SUCCESSOR_REVISION_V01}:source`;
const configFor = (db: Database.Database, scope: Scope): VNextLocalOperatorPilotConfigV01 =>
  ({ ...scope, enabled: true, database_path: db.name, operator_id: "lineage-reader" });
export const isOrdinarySuccessorRevisionV01 = (p: TaskContextPacketV01) => p.compatibility.source_contracts.includes(AUTHORED_SUCCESSOR_REVISION_V01);

export function ordinarySuccessorRevisionMaterialV01(packet: TaskContextPacketV01): Material {
  const entries = packet.selected_context.filter(e => e.entry_id === MATERIAL);
  check(entries.length === 1 && typeof entries[0]!.bounded_summary === "string" &&
    Buffer.byteLength(entries[0]!.bounded_summary!) <= 24_576, "revision_material_missing");
  let m: Material;
  try { m = JSON.parse(entries[0]!.bounded_summary!); } catch { check(false, "revision_material_invalid"); }
  check(m! && equal(Object.keys(m!).sort(), ["origin_packet_fingerprint", "origin_packet_id", "physical_root_fingerprint", "request", "revision_number", "session_id", "source_root_ref"]) &&
    Number.isSafeInteger(m!.revision_number) && m!.revision_number > 0 && m!.revision_number <= MAX_PRE_EXECUTION_PROJECT_WORK_REVISIONS_V01 &&
    typeof m!.session_id === "string", "revision_material_invalid");
  const request = parseProjectWorkRevisionRequestV01(m!.request);
  check(request.action === "revise_pre_execution_project_work" && request.expected_current_lineage_kind === "authored_successor_task", "revision_profile_invalid");
  return { ...m!, request };
}

export function ordinarySuccessorRevisionIdempotencyKeyV01(packet: TaskContextPacketV01): string {
  return requestDigest(ordinarySuccessorRevisionMaterialV01(packet).request);
}
const requestDigest = (request: RevisePreExecutionProjectWorkRequestV01) => digest({ compiler: AUTHORED_SUCCESSOR_REVISION_V01, request });

function packetFrom(db: Database.Database, scope: Scope, id: string, fingerprint: string) {
  const row = readVNextCoreRecordV01(db, { ...scope, record_kind: "task_context_packet", record_id: id });
  check(row && row.fingerprint === fingerprint, "revision_prior_missing");
  const packet = row.payload as TaskContextPacketV01;
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(row, { workspace_id: packet.workspace_id, project_id: packet.project_id, fingerprint: packet.integrity.fingerprint });
  check(row.record_id === packet.packet_id && row.created_at === packet.generated_at, "revision_envelope");
  check(validateTaskContextPacketV01(packet, { evaluated_at: packet.generated_at }).status === "valid", "revision_prior_invalid");
  return packet;
}

function build(prior: TaskContextPacketV01, anchor: AuthoredSuccessorPacketLineageV01, material: Material, operator: string, at: string) {
  const definition = normalizeInitialProjectWorkDefinitionV01(material.request);
  const selected = material.request.selected_source_context ?? readSelectedWorkSources(prior);
  const fingerprint = digest({ compiler: AUTHORED_SUCCESSOR_REVISION_V01, material, at, operator });
  const ref = (type: string, id: string, hash: string, time = at): ExternalRefV01 => ({ ref_version: "external_ref.v0.1", ref_type: type,
    external_id: id, source_ref: hash, observed_at: time, trust_class: "direct_local_observation", compatibility_namespace: AUTHORED_SUCCESSOR_REVISION_V01 });
  const definitionRef = { ...ref("work_definition_revision", `successor-revision:${material.revision_number}:${fingerprint.slice(7, 31)}`, fingerprint), trust_class: "user_declaration" as const };
  const operatorRef = ref("local_operator_session_action", material.session_id, digest({ material, operator, at }));
  const priorRef = ref("task_context_packet", prior.packet_id, prior.integrity.fingerprint, prior.generated_at);
  const originRef = ref("origin_work_preparation", material.origin_packet_id, material.origin_packet_fingerprint);
  const refs = [definitionRef, operatorRef, priorRef, originRef, anchor.predecessor_receipt_ref, material.source_root_ref];
  const currentness = { status: "fresh" as const, as_of: at, basis: "Authenticated same-task revision of an unexecuted outcome-linked preparation; inherited lifetime and authority are unchanged.", source_ref: definitionRef };
  const authoredDefinition = { objective: definition.goal, checks: definition.success_criteria.map((criterion, index) => ({ check_id: `criterion_${index + 1}`, criterion })),
    stop_conditions: definition.non_goals, materials: [], approved_instruction_hashes: [] };
  const entries = [
    { entry_id: AUTHORED_SUCCESSOR_TASK_V01, entry_kind: "work_ref" as const, source_ref: fingerprint, external_ref: definitionRef,
      why_included: "Revised task definition. Inherited mandatory constraints remain separately binding.", bounded_summary: canonicalizeProtocolValueV01(authoredDefinition), trust_class: "user_declaration" as const, currentness, compatibility_source_ref: operatorRef },
    { entry_id: MATERIAL, entry_kind: "source_ref" as const, source_ref: digest(material), external_ref: priorRef,
      why_included: "Exact revision request and immutable preparation lineage; no execution or semantic authority.", bounded_summary: canonicalizeProtocolValueV01(material), trust_class: "direct_local_observation" as const, currentness, compatibility_source_ref: definitionRef },
    ...prior.selected_context.filter(e => e.entry_kind === "accepted_state_ref" || e.entry_id === `successor-predecessor:${anchor.predecessor_receipt_ref.external_id}`),
    ...selected,
  ];
  const packet = buildTaskContextPacketV01({ workspace_id: prior.workspace_id, project_id: prior.project_id, work_ref: definitionRef,
    generated_at: at, expires_at: prior.expires_at, task: definition,
    current_projection: { projection_kind: "current_working_perspective", projection_only: true, canonical_state: false, perspective_ref: null,
      bounded_summary: definition.goal, as_of: at, items: [{ item_kind: "active_goal", summary: definition.goal, source_refs: [fingerprint], external_refs: [definitionRef], currentness }],
      source_refs: [fingerprint], external_refs: [definitionRef], currentness, warnings: ["Revision is a user declaration, not semantic acceptance or execution authority."] },
    selected_context: entries,
    excluded_context: [
      ...prior.excluded_context.filter(e => !entries.some(s => s.entry_id === e.entry_id)),
      ...readSelectedWorkSources(prior).filter(e => !selected.some(s => s.entry_id === e.entry_id)).map(e => ({ entry_id: e.entry_id, source_ref: e.source_ref, external_ref: e.external_ref,
        why_excluded: "Not selected in this revision; no refutation, deletion or change to the recorded observation is implied.", currentness: e.currentness })),
    ],
    tensions: prior.tensions, risks: prior.risks, gaps: prior.gaps,
    constraints: prior.constraints, capability_grant: null, return_contract: prior.return_contract,
    source_status: { ...prior.source_status, currentness, source_refs: refs.map(r => r.source_ref!), external_refs: refs },
    compatibility: { source_contracts: [AUTHORED_SUCCESSOR_TASK_V01, AUTHORED_SUCCESSOR_CONTEXT_V01, AUTHORED_SUCCESSOR_REVISION_V01],
      legacy_scope_ref: prior.compatibility.legacy_scope_ref, source_refs: refs, unmapped_fields: [], warnings: [] },
  }, { required_selected_entry_ids: entries.map(e => e.entry_id) });
  return { packet, successor_definition_ref: definitionRef, operator_action_ref: operatorRef, immediate_prior_packet_ref: priorRef, predecessor_receipt_ref: anchor.predecessor_receipt_ref };
}

/** Historical reconstruction never requires a local run to be fabricated after restore. */
export function inspectOrdinarySuccessorRevisionV01(db: Database.Database, input: { config: VNextLocalOperatorPilotConfigV01; packet: TaskContextPacketV01 }): AuthoredSuccessorPacketLineageV01 {
  const { packet, config } = input, m = ordinarySuccessorRevisionMaterialV01(packet);
  check(packet.workspace_id === config.workspace_id && packet.project_id === config.project_id && m.request.workspace_id === config.workspace_id && m.request.project_id === config.project_id &&
    m.request.expected_active_project_id === config.project_id, "revision_scope");
  const prior = packetFrom(db, config, m.request.expected_current_packet_id, m.request.expected_current_packet_fingerprint);
  check(Date.parse(packet.generated_at) > Date.parse(prior.generated_at) && prior.compatibility.source_contracts.includes(AUTHORED_SUCCESSOR_CONTEXT_V01), "revision_order_or_profile");
  const previous = isOrdinarySuccessorRevisionV01(prior) ? ordinarySuccessorRevisionMaterialV01(prior) : null;
  check(m.revision_number === (previous?.revision_number ?? 0) + 1 && m.origin_packet_id === (previous?.origin_packet_id ?? prior.packet_id) &&
    m.origin_packet_fingerprint === (previous?.origin_packet_fingerprint ?? prior.integrity.fingerprint), "revision_origin");
  const root = previous ?? readOrdinarySuccessorRootBindingV01(prior);
  check(equal(m.source_root_ref, root.source_root_ref) && m.physical_root_fingerprint === root.physical_root_fingerprint, "revision_root_lineage");
  const session = readVNextLocalOperatorSessionHistoryV01(db, { session_id: m.session_id });
  const at = Date.parse(packet.generated_at);
  check(session && session.workspace_id === config.workspace_id && session.project_id === config.project_id && session.bootstrap_consumed_at &&
    at >= Date.parse(session.issued_at) && at >= Date.parse(session.bootstrap_consumed_at) && at <= Date.parse(session.expires_at) &&
    (!session.revoked_at || at <= Date.parse(session.revoked_at)), "revision_operator_provenance");
  const lineage = inspectAuthoredSuccessorPacketV01(db, { config, packet: prior });
  const origin = packetFrom(db, config, m.origin_packet_id, m.origin_packet_fingerprint);
  check(!hasAutonomyRunAdmissionForPreparation({ db, scope: config.project_id, workspace_id: config.workspace_id, packet_ids: [prior.packet_id, origin.packet_id], prepared_at: origin.generated_at, through: packet.generated_at }), "revision_execution_history");
  if (m.request.selected_source_context !== undefined) {
    const family = familyPackets(db, config, prior);
    const retained = resolveRetainedWorkSources({ packets: family, tip_packet: prior }, m.request.retained_source_refs ?? []);
    check(retained.entries.every(e => m.request.selected_source_context!.some(s => equal(e, s))) &&
      compareSelectedWorkSources(prior, m.request.selected_source_context, retained.refs).fingerprint === m.request.expected_source_comparison, "revision_source_comparison");
  }
  const expected = build(prior, lineage, m, session.operator_id, packet.generated_at);
  check(equal(expected.packet, packet), "revision_compiler_binding");
  return { ...expected, lineage_kind: "authored_successor_task", prior_packet: { packet_id: prior.packet_id, packet_fingerprint: prior.integrity.fingerprint },
    inherited_context_current: lineage.inherited_context_current, projection_current: lineage.inherited_context_current && !hasAuthoredSuccessorOfPacketV01(db, config, packet.packet_id), source_transition_receipt: null };
}

function familyPackets(db: Database.Database, scope: Scope, tip: TaskContextPacketV01) {
  const packets = [tip];
  while (isOrdinarySuccessorRevisionV01(packets[0]!)) {
    check(packets.length <= MAX_PRE_EXECUTION_PROJECT_WORK_REVISIONS_V01, "revision_bound");
    const m = ordinarySuccessorRevisionMaterialV01(packets[0]!);
    const prior = packetFrom(db, scope, m.request.expected_current_packet_id, m.request.expected_current_packet_fingerprint);
    check(Date.parse(prior.generated_at) < Date.parse(packets[0]!.generated_at), "revision_order");
    packets.unshift(prior);
  }
  return packets;
}

export function inspectCurrentOrdinarySuccessorRevisionChainV01(db: Database.Database, scope: Scope, evaluatedAt?: string) {
  // Fast existence gate leaves the older initial/scoped paths on their own contracts.
  const exists = db.prepare("SELECT 1 FROM vnext_core_records WHERE workspace_id = ? AND project_id = ? AND record_kind = 'task_context_packet' AND instr(payload_json, ?) > 0 LIMIT 1")
    .get(scope.workspace_id, scope.project_id, AUTHORED_SUCCESSOR_CONTEXT_V01);
  if (!exists) return null;
  const config = configFor(db, scope);
  // The continuity owner validates envelopes and supported current lineages;
  // valid legacy execution packets remain historical, not candidate tasks.
  const lineage = readCurrentProjectWorkPacketLineageV01(db, config);
  check(lineage, "revision_current_unavailable");
  if (lineage.lineage_kind !== "authored_successor_task" || !lineage.packet.compatibility.source_contracts.includes(AUTHORED_SUCCESSOR_CONTEXT_V01)) return null;
  const packets = familyPackets(db, scope, lineage.packet);
  const material = isOrdinarySuccessorRevisionV01(lineage.packet) ? ordinarySuccessorRevisionMaterialV01(lineage.packet) : null;
  return { tip_packet: lineage.packet, tip_lineage_kind: "authored_successor_task" as const, packets, packet_ids: packets.map(p => p.packet_id),
    revision_count: packets.length - 1, projection_current: lineage.projection_current && validateTaskContextPacketV01(lineage.packet, { evaluated_at: evaluatedAt ?? new Date().toISOString() }).status === "valid",
    tip_revision: material ? { prior_packet: packets.at(-2)!, packet: lineage.packet, material } : null, lineage,
    root: material ?? readOrdinarySuccessorRootBindingV01(lineage.packet) };
}
export type OrdinarySuccessorRevisionChainV01 = NonNullable<ReturnType<typeof inspectCurrentOrdinarySuccessorRevisionChainV01>>;

export function assertOrdinarySuccessorRevisionRootV01(db: Database.Database, scope: Scope, chain: OrdinarySuccessorRevisionChainV01) {
  const r = readCanonicalProjectWithRootV01(db, scope);
  check(r && chain.root.source_root_ref.source_ref === digest({ workspace_id: scope.workspace_id, project_id: scope.project_id, local_root: r.root_binding.local_root,
    binding_version: r.root_binding.binding_version, bound_at: r.root_binding.bound_at }) &&
    chain.root.physical_root_fingerprint === fingerprintNativeHostPhysicalRootIdentityV01(inspectNativeHostPhysicalRootIdentitySynchronouslyV01(r.root_binding.local_root.normalized_path)), "revision_root_changed");
}
export function ordinarySuccessorRevisionExecutionBlockedV01(db: Database.Database, scope: Scope, chain: OrdinarySuccessorRevisionChainV01) {
  return hasUnsettledAutonomyRunLedgerRecords({ db, scope: scope.project_id }) || hasAutonomyRunAdmissionForPreparation({ db, scope: scope.project_id, workspace_id: scope.workspace_id,
    packet_ids: chain.packet_ids, prepared_at: chain.packets[0]!.generated_at });
}

/** Called only by the existing authenticated revision transaction. */
export function saveOrdinarySuccessorRevisionInsideTransactionV01(db: Database.Database, input: {
  scope: Scope & { operator_id: string }; request: RevisePreExecutionProjectWorkRequestV01;
  admission: { session: { session_id: string }; action_observed_at: string };
}) {
  check(db.inTransaction, "revision_transaction_required");
  const { request, scope, admission } = input;
  check(request.action === "revise_pre_execution_project_work", "revision_same_task_only");
  const chain = inspectCurrentOrdinarySuccessorRevisionChainV01(db, scope, admission.action_observed_at);
  check(chain && chain.projection_current, "revision_current_unavailable");
  assertOrdinarySuccessorRevisionRootV01(db, scope, chain);
  check(!ordinarySuccessorRevisionExecutionBlockedV01(db, scope, chain), "revision_execution_started");
  const exact = chain.tip_packet.packet_id === request.expected_current_packet_id && chain.tip_packet.integrity.fingerprint === request.expected_current_packet_fingerprint;
  if (!exact) {
    check(chain.tip_revision && equal(chain.tip_revision.material.request, request), "revision_current_packet_changed");
    return { packet: chain.tip_packet, status: "exact_replay" as const };
  }
  if (request.selected_source_context !== undefined) {
    const retained = resolveRetainedWorkSources(chain, request.retained_source_refs ?? []);
    check(retained.entries.every(e => request.selected_source_context!.some(s => equal(e, s))) &&
      compareSelectedWorkSources(chain.tip_packet, request.selected_source_context, retained.refs).fingerprint === request.expected_source_comparison, "revision_source_comparison");
  }
  const definition = normalizeInitialProjectWorkDefinitionV01(request);
  if (equal(definition, chain.tip_packet.task) && equal(request.selected_source_context ?? readSelectedWorkSources(chain.tip_packet), readSelectedWorkSources(chain.tip_packet))) {
    return { packet: chain.tip_packet, status: "exact_replay" as const };
  }
  check(chain.revision_count < MAX_PRE_EXECUTION_PROJECT_WORK_REVISIONS_V01 && Date.parse(admission.action_observed_at) > Date.parse(chain.tip_packet.generated_at), "revision_limit_or_time");
  const material: Material = { request, revision_number: chain.revision_count + 1, session_id: admission.session.session_id,
    origin_packet_id: chain.packets[0]!.packet_id, origin_packet_fingerprint: chain.packets[0]!.integrity.fingerprint,
    source_root_ref: chain.root.source_root_ref, physical_root_fingerprint: chain.root.physical_root_fingerprint };
  const built = build(chain.tip_packet, chain.lineage, material, scope.operator_id, admission.action_observed_at);
  check(validateTaskContextPacketV01(built.packet, { evaluated_at: admission.action_observed_at }).status === "valid", "revision_packet_invalid");
  const write = insertVNextCoreRecordV01(db, { ...scope, record_kind: "task_context_packet", record_id: built.packet.packet_id,
    fingerprint: built.packet.integrity.fingerprint, idempotency_key: requestDigest(request), payload: built.packet, created_at: built.packet.generated_at });
  const after = inspectCurrentOrdinarySuccessorRevisionChainV01(db, scope, admission.action_observed_at);
  check(after?.projection_current && after.tip_packet.packet_id === built.packet.packet_id, "revision_not_current");
  return { packet: built.packet, status: write.status };
}
