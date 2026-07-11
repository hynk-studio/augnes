import type Database from "better-sqlite3";

import {
  readVNextLocalRuntimeClockNowV01,
  type VNextLocalRuntimeClockV01,
} from "@/lib/vnext/runtime/local-runtime-clock";

import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  deriveVNextSemanticTargetKeyV01,
  insertVNextCoreRecordV01,
  listVNextSemanticStateEntriesV01,
  readVNextCoreRecordV01,
  readVNextSemanticStateEntryV01,
  readVNextSemanticTargetHeadV01,
  rebuildVNextPersistedSemanticStateV01,
  type VNextCoreRecordWriteResultV01,
  type VNextPersistedSemanticStateVersionV01,
  type VNextSemanticStateProjectionEntryV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  createProtocolSha256V01,
  normalizeExternalRefPrimitiveV01,
  normalizeProtocolTextV01,
  isProtocolRecordV01,
  parseStrictIsoTimestampV01,
  uniqueProtocolValuesV01,
  validateExternalRefStructureV01,
} from "@/lib/vnext/protocol-primitives";
import {
  buildRunReceiptV01,
  validateRunReceiptV01,
  type RunReceiptBuilderInputV01,
} from "@/lib/vnext/run-receipt";
import {
  validateSemanticTransitionFullChainV01,
  validateTaskContextPacketTransitionRelationV01,
} from "@/lib/vnext/state-transition-eligibility";
import { VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01 } from "@/lib/vnext/runtime/persisted-semantic-context-compiler";
import { loadValidatedVNextSemanticTransitionRelationV01 } from "@/lib/vnext/runtime/durable-semantic-transition";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import { validateStateTransitionReceiptV01 } from "@/lib/vnext/state-transition-receipt";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type {
  StateTransitionReceiptV01,
  TaskContextPacketTransitionRelationResultV01,
} from "@/types/vnext/state-transition-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export const VNEXT_LOCAL_CONTEXT_USE_PROBE_VERSION_V01 =
  "vnext_local_context_use_probe.v0.1" as const;
export const VNEXT_LOCAL_CONTEXT_USE_PROBE_NAMESPACE_V01 =
  "augnes.vnext.local-context-use-probe.v0.1" as const;

export interface RunLocalContextUseProbeInputV01 {
  workspace_id: string;
  project_id: string;
  prior_packet_id: string;
  prior_packet_fingerprint: string;
  later_packet_id: string;
  later_packet_fingerprint: string;
  expected_transition_receipt_id: string;
  expected_transition_receipt_fingerprint: string;
  clock?: VNextLocalRuntimeClockV01;
}

export interface LocalContextUseResolvedStateBindingV01 {
  target_ref: ExternalRefV01;
  state_ref: ExternalRefV01;
  state_fingerprint: string;
  semantic_state_record_id: string;
  semantic_state_record_fingerprint: string;
  projection_fingerprint: string;
  revision: number;
}

export interface LocalContextUseProbeRelationIssueV01 {
  code: string;
  message: string;
}

export interface LocalContextUseProbeRelationResultV01 {
  status: "valid" | "invalid";
  errors: LocalContextUseProbeRelationIssueV01[];
  packet_transition_relation: TaskContextPacketTransitionRelationResultV01;
}

export interface ValidateLocalContextUseProbeRunReceiptInputV01 {
  receipt: RunReceiptV01;
  prior_packet: TaskContextPacketV01;
  later_packet: TaskContextPacketV01;
  transition_receipt: StateTransitionReceiptV01;
  resolved_states: LocalContextUseResolvedStateBindingV01[];
  retracted_target_refs: ExternalRefV01[];
}

export interface RunLocalContextUseProbeResultV01 {
  status: VNextCoreRecordWriteResultV01["status"];
  receipt: RunReceiptV01;
  prior_packet: TaskContextPacketV01;
  later_packet: TaskContextPacketV01;
  transition_receipt: StateTransitionReceiptV01;
  resolved_states: LocalContextUseResolvedStateBindingV01[];
  retracted_target_refs: ExternalRefV01[];
  relation: LocalContextUseProbeRelationResultV01;
}

interface LoadedTaskContextPacketV01 {
  packet: TaskContextPacketV01;
  read_ref: ExternalRefV01;
}

interface LoadedTransitionReceiptV01 {
  receipt: StateTransitionReceiptV01;
  read_ref: ExternalRefV01;
}

/**
 * Performs a bounded local read probe over an already-persisted later packet.
 *
 * The observations cover only reads and comparisons performed in this call.
 * They do not establish helpfulness, approval, accepted Evidence, or transition
 * authority, and this function never applies semantic state.
 */
export function runLocalContextUseProbeV01(
  db: Database.Database,
  input: RunLocalContextUseProbeInputV01,
): RunLocalContextUseProbeResultV01 {
  if (db.inTransaction) {
    throw new Error("local_context_use_probe_nested_transaction_forbidden");
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    assertProbeInputKeys(input);
    const result = runLocalContextUseProbeInsideTransactionV01(
      db,
      input,
      readVNextLocalRuntimeClockNowV01(
        input.clock,
        "local_context_use_observed_at",
      ),
    );
    db.exec("COMMIT");
    return result;
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

function runLocalContextUseProbeInsideTransactionV01(
  db: Database.Database,
  input: RunLocalContextUseProbeInputV01,
  observedAt: string,
): RunLocalContextUseProbeResultV01 {
  const workspaceId = requiredText(input.workspace_id, "workspace_id");
  const projectId = requiredText(input.project_id, "project_id");
  const prior = loadTaskContextPacket(db, {
    workspace_id: workspaceId,
    project_id: projectId,
    packet_id: requiredText(input.prior_packet_id, "prior_packet_id"),
    packet_fingerprint: sha256(
      input.prior_packet_fingerprint,
      "prior_packet_fingerprint",
    ),
    evaluated_at: null,
    observed_at: observedAt,
    role: "prior",
  });
  const later = loadTaskContextPacket(db, {
    workspace_id: workspaceId,
    project_id: projectId,
    packet_id: requiredText(input.later_packet_id, "later_packet_id"),
    packet_fingerprint: sha256(
      input.later_packet_fingerprint,
      "later_packet_fingerprint",
    ),
    evaluated_at: observedAt,
    observed_at: observedAt,
    role: "later",
  });
  const validatedTransition =
    loadValidatedVNextSemanticTransitionRelationV01(db, {
      workspace_id: workspaceId,
      project_id: projectId,
      transition_receipt_id: requiredText(
        input.expected_transition_receipt_id,
        "expected_transition_receipt_id",
      ),
      transition_receipt_fingerprint: sha256(
        input.expected_transition_receipt_fingerprint,
        "expected_transition_receipt_fingerprint",
      ),
    });
  const transition: LoadedTransitionReceiptV01 = {
    receipt: validatedTransition.receipt,
    read_ref: transitionReceiptReadRef(
      validatedTransition.receipt,
      observedAt,
    ),
  };
  assertTimestampNotBefore(
    observedAt,
    transition.receipt.recorded_at,
    "local_context_observation_before_transition_receipt",
  );
  assertTimestampNotBefore(
    observedAt,
    later.packet.generated_at,
    "local_context_observation_before_later_packet",
  );
  /* The validated loader also proves exact proposal, decision, gate, lineage,
   * eligibility, receipt-envelope, and project bindings before observation. */
  const composedRelation = validateSemanticTransitionFullChainV01({
    ...validatedTransition.eligibility_input,
    receipt: transition.receipt,
    prior_packet: prior.packet,
    later_packet: later.packet,
  });
  if (composedRelation.status !== "valid") {
    throw new Error(
      `local_context_semantic_transition_full_chain_invalid:${composedRelation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  if (
    !containsExactRef(
      later.packet.compatibility.source_refs,
      compilerPriorPacketLineageRef(prior.packet),
    )
  ) {
    throw new Error("local_context_prior_packet_lineage_mismatch");
  }

  const packetTransitionRelation =
    validateTaskContextPacketTransitionRelationV01(
      prior.packet,
      transition.receipt,
      later.packet,
    );
  if (packetTransitionRelation.status !== "valid") {
    throw new Error(
      `local_context_packet_transition_relation_invalid:${packetTransitionRelation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  if (
    canonicalizeProtocolValueV01(prior.packet.selected_context) ===
    canonicalizeProtocolValueV01(later.packet.selected_context)
  ) {
    throw new Error("local_context_selection_unchanged");
  }

  const resolvedStates = resolveSelectedSemanticStates(
    db,
    workspaceId,
    projectId,
    later.packet,
    transition.receipt,
    observedAt,
  );
  const retractedTargetRefs = assertRetractedStateAbsent(
    db,
    workspaceId,
    projectId,
    transition.receipt,
  );
  const receipt = buildLocalContextUseRunReceipt({
    workspace_id: workspaceId,
    project_id: projectId,
    observed_at: observedAt,
    prior_packet: prior.packet,
    prior_packet_read_ref: prior.read_ref,
    later_packet: later.packet,
    later_packet_read_ref: later.read_ref,
    transition_receipt: transition.receipt,
    transition_receipt_read_ref: transition.read_ref,
    resolved_states: resolvedStates,
    retracted_target_refs: retractedTargetRefs,
  });
  const relation = validateLocalContextUseProbeRunReceiptV01({
    receipt,
    prior_packet: prior.packet,
    later_packet: later.packet,
    transition_receipt: transition.receipt,
    resolved_states: resolvedStates,
    retracted_target_refs: retractedTargetRefs,
  });
  if (relation.status !== "valid") {
    throw new Error(
      `local_context_use_run_receipt_relation_invalid:${relation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  const write = insertVNextCoreRecordV01(db, {
    record_kind: "run_receipt",
    record_id: receipt.receipt_id,
    workspace_id: receipt.workspace_id,
    project_id: receipt.project_id,
    fingerprint: receipt.integrity.fingerprint,
    idempotency_key: receipt.idempotency_key,
    payload: receipt,
    created_at: receipt.recorded_at,
  });
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(write.record, {
    workspace_id: receipt.workspace_id,
    project_id: receipt.project_id,
    fingerprint: receipt.integrity.fingerprint,
  });
  if (
    write.record.record_id !== receipt.receipt_id ||
    write.record.idempotency_key !== receipt.idempotency_key ||
    write.record.created_at !== receipt.recorded_at
  ) {
    throw new Error("persisted_local_context_use_receipt_envelope_mismatch");
  }
  return {
    status: write.status,
    receipt,
    prior_packet: prior.packet,
    later_packet: later.packet,
    transition_receipt: transition.receipt,
    resolved_states: resolvedStates,
    retracted_target_refs: retractedTargetRefs,
    relation,
  };
}

export function validateLocalContextUseProbeRunReceiptV01(
  input: ValidateLocalContextUseProbeRunReceiptInputV01 | unknown,
): LocalContextUseProbeRelationResultV01 {
  const errors: LocalContextUseProbeRelationIssueV01[] = [];
  const addError = (code: string, message: string) => {
    errors.push({ code, message });
  };
  const record = isProtocolRecordV01(input) ? input : null;
  const receiptInput = record?.receipt;
  const priorPacketInput = record?.prior_packet;
  const laterPacketInput = record?.later_packet;
  const transitionReceiptInput = record?.transition_receipt;
  const packetTransitionRelation =
    validateTaskContextPacketTransitionRelationV01(
      priorPacketInput,
      transitionReceiptInput,
      laterPacketInput,
    );
  const receiptValidation = validateRunReceiptV01(receiptInput);
  if (receiptValidation.status !== "valid") {
    for (const issue of receiptValidation.errors) {
      addError(`run_receipt_${issue.code}`, issue.message);
    }
  }
  if (packetTransitionRelation.status !== "valid") {
    for (const issue of packetTransitionRelation.errors) {
      addError(`packet_transition_${issue.code}`, issue.message);
    }
  }
  if (
    !record ||
    receiptValidation.status !== "valid" ||
    packetTransitionRelation.status !== "valid"
  ) {
    return {
      status: "invalid",
      errors,
      packet_transition_relation: packetTransitionRelation,
    };
  }
  if (
    !Array.isArray(record.resolved_states) ||
    !Array.isArray(record.retracted_target_refs) ||
    !record.resolved_states.every(isResolvedStateRelationMaterialV01) ||
    !record.retracted_target_refs.every(isStructurallyValidExternalRefV01)
  ) {
    addError(
      "local_context_use_relation_material_malformed",
      "Resolved-state and retracted-target relation material must be arrays.",
    );
    return {
      status: "invalid",
      errors,
      packet_transition_relation: packetTransitionRelation,
    };
  }
  const typed = input as ValidateLocalContextUseProbeRunReceiptInputV01;
  const receipt = typed.receipt;
  const priorPacket = typed.prior_packet;
  const laterPacket = typed.later_packet;
  const transitionReceipt = typed.transition_receipt;
  const resolvedStates = typed.resolved_states;
  const retractedTargetRefs = typed.retracted_target_refs;
  if (
    receipt.workspace_id !== laterPacket.workspace_id ||
    receipt.workspace_id !== transitionReceipt.workspace_id
  ) {
    addError(
      "local_context_use_workspace_mismatch",
      "Probe receipt, packet, and transition receipt workspace identity must match.",
    );
  }
  if (
    receipt.project_id !== laterPacket.project_id ||
    receipt.project_id !== transitionReceipt.project_id
  ) {
    addError(
      "local_context_use_project_mismatch",
      "Probe receipt, packet, and transition receipt project identity must match.",
    );
  }
  if (
    canonicalizeProtocolValueV01(priorPacket.selected_context) ===
    canonicalizeProtocolValueV01(laterPacket.selected_context)
  ) {
    addError(
      "local_context_selection_unchanged",
      "The bound transition requires an exact persisted context selection change.",
    );
  }

  const observedAt = receipt.recorded_at;
  const priorPacketRef = packetReadRef(
    priorPacket,
    observedAt,
    "prior_task_context_packet",
  );
  const laterPacketRef = packetReadRef(
    laterPacket,
    observedAt,
    "later_task_context_packet",
  );
  const transitionReceiptRef = transitionReceiptReadRef(
    transitionReceipt,
    observedAt,
  );
  for (const [sourceAt, code] of [
    [
      transitionReceipt.recorded_at,
      "local_context_observation_before_transition_receipt",
    ],
    [laterPacket.generated_at, "local_context_observation_before_later_packet"],
    ...resolvedStates.map(
      (state) =>
        [
          state.state_ref.observed_at ?? "",
          "local_context_observation_before_semantic_state_record",
        ] as const,
    ),
  ] as const) {
    if (!timestampNotBefore(observedAt, sourceAt)) {
      addError(
        code,
        "Probe observation time cannot predate locally read persisted material.",
      );
    }
  }
  if (
    !containsExactRef(
      laterPacket.compatibility.source_refs,
      compilerPriorPacketLineageRef(priorPacket),
    )
  ) {
    addError(
      "local_context_prior_packet_lineage_mismatch",
      "Later packet must preserve the exact compiler-bound prior packet ID and fingerprint lineage.",
    );
  }
  if (!exactRef(receipt.task_context_packet_ref, laterPacketRef)) {
    addError(
      "local_context_use_packet_binding_mismatch",
      "RunReceipt must bind the exact persisted later packet ID and fingerprint.",
    );
  }
  for (const [code, ref] of [
    ["prior_packet_read_ref_missing", priorPacketRef],
    ["later_packet_read_ref_missing", laterPacketRef],
    ["transition_receipt_read_ref_missing", transitionReceiptRef],
  ] as const) {
    if (!containsExactRef(receipt.source_refs, ref)) {
      addError(code, "Required exact local-store read provenance is missing.");
    }
  }
  for (const state of resolvedStates) {
    const stateRecordRef = semanticStateRecordReadRef(state, observedAt);
    const projectionRef = semanticStateProjectionReadRef(state, observedAt);
    if (
      !containsExactRef(receipt.source_refs, state.state_ref) ||
      !containsExactRef(receipt.source_refs, stateRecordRef) ||
      !containsExactRef(receipt.source_refs, projectionRef)
    ) {
      addError(
        "resolved_state_ref_missing",
        "Every resolved state, immutable record, and current projection fingerprint must remain an exact source ref.",
      );
    }
    const stateObservation = receipt.observations.find(
      (observation) =>
        observation.observation_kind === "local_semantic_state_resolution" &&
        containsExactRef(observation.source_refs, state.state_ref) &&
        containsExactRef(observation.source_refs, stateRecordRef) &&
        containsExactRef(observation.source_refs, projectionRef),
    );
    if (!stateObservation) {
      addError(
        "resolved_state_observation_missing",
        "Every resolved current semantic state requires a direct local read observation.",
      );
    }
  }
  for (const targetRef of retractedTargetRefs) {
    const retractionObservation = receipt.observations.find(
      (observation) =>
        observation.observation_kind ===
          "local_retracted_semantic_state_absence" &&
        containsExactRef(observation.source_refs, targetRef) &&
        containsExactRef(observation.source_refs, transitionReceiptRef),
    );
    if (!retractionObservation) {
      addError(
        "retracted_state_absence_observation_missing",
        "Every retracted target requires an exact direct-local absence observation.",
      );
    }
  }
  if (
    receipt.observations.some(
      (observation) => observation.trust_class !== "direct_local_observation",
    ) ||
    receipt.attestations.length !== 0 ||
    receipt.model_invocations.length !== 0
  ) {
    addError(
      "local_context_use_trust_boundary_invalid",
      "The local probe may emit only direct observations of reads it performed and no attestations or model invocations.",
    );
  }
  if (
    receipt.execution.status !== "completed" ||
    receipt.execution.basis !== "observed" ||
    receipt.verification.status !== "passed" ||
    receipt.verification.basis !== "observed"
  ) {
    addError(
      "local_context_use_status_invalid",
      "Successful local resolution requires observed completed execution and observed passed verification.",
    );
  }
  const expectedReceipt = buildLocalContextUseRunReceipt({
    workspace_id: receipt.workspace_id,
    project_id: receipt.project_id,
    observed_at: observedAt,
    prior_packet: priorPacket,
    prior_packet_read_ref: priorPacketRef,
    later_packet: laterPacket,
    later_packet_read_ref: laterPacketRef,
    transition_receipt: transitionReceipt,
    transition_receipt_read_ref: transitionReceiptRef,
    resolved_states: resolvedStates,
    retracted_target_refs: retractedTargetRefs,
  });
  if (
    canonicalizeProtocolValueV01(receipt) !==
    canonicalizeProtocolValueV01(expectedReceipt)
  ) {
    addError(
      "local_context_use_receipt_canonical_mismatch",
      "RunReceipt must equal the exact canonical probe result derived from the validated local reads.",
    );
  }

  return {
    status: errors.length === 0 ? "valid" : "invalid",
    errors,
    packet_transition_relation: packetTransitionRelation,
  };
}

function loadTaskContextPacket(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    packet_id: string;
    packet_fingerprint: string;
    evaluated_at: string | null;
    observed_at: string;
    role: "prior" | "later";
  },
): LoadedTaskContextPacketV01 {
  const record = readVNextCoreRecordV01(db, {
    record_kind: "task_context_packet",
    record_id: input.packet_id,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
  });
  if (!record) throw new Error(`${input.role}_task_context_packet_missing`);
  if (record.fingerprint !== input.packet_fingerprint) {
    throw new Error(`${input.role}_task_context_packet_fingerprint_mismatch`);
  }
  const packet = record.payload as TaskContextPacketV01;
  const validation = validateTaskContextPacketV01(packet, {
    evaluated_at: input.evaluated_at ?? packet.generated_at,
  });
  if (validation.status !== "valid") {
    throw new Error(
      `${input.role}_task_context_packet_invalid:${validation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: packet.workspace_id,
    project_id: packet.project_id,
    fingerprint: packet.integrity.fingerprint,
  });
  if (
    packet.workspace_id !== input.workspace_id ||
    packet.project_id !== input.project_id ||
    packet.packet_id !== input.packet_id ||
    packet.integrity.fingerprint !== input.packet_fingerprint ||
    record.record_id !== packet.packet_id ||
    record.idempotency_key !== null ||
    record.created_at !== packet.generated_at
  ) {
    throw new Error(`${input.role}_task_context_packet_envelope_mismatch`);
  }
  return {
    packet,
    read_ref: packetReadRef(
      packet,
      input.observed_at,
      `${input.role}_task_context_packet`,
    ),
  };
}

function resolveSelectedSemanticStates(
  db: Database.Database,
  workspaceId: string,
  projectId: string,
  laterPacket: TaskContextPacketV01,
  transitionReceipt: StateTransitionReceiptV01,
  observedAt: string,
): LocalContextUseResolvedStateBindingV01[] {
  const currentEntries = listVNextSemanticStateEntriesV01(db, {
    workspace_id: workspaceId,
    project_id: projectId,
  });
  const resolved: LocalContextUseResolvedStateBindingV01[] = [];
  for (const entry of laterPacket.selected_context) {
    if (entry.entry_kind !== "accepted_state_ref") continue;
    if (!entry.external_ref || !entry.source_ref) {
      throw new Error("local_context_selected_state_binding_missing");
    }
    const matching = currentEntries.filter(
      (state) =>
        state.state_fingerprint === entry.source_ref &&
        exactRef(state.state_ref, entry.external_ref),
    );
    if (matching.length !== 1) {
      throw new Error(
        matching.length === 0
          ? "local_context_selected_state_missing"
          : "local_context_selected_state_ambiguous",
      );
    }
    const projection = matching[0]!;
    assertCurrentProjectionHeadAndReceipt(db, projection);
    assertTimestampNotBefore(
      observedAt,
      projection.updated_at,
      "local_context_observation_before_projection_update",
    );
    const affectedByReceipt = transitionReceipt.effects.some(
      (effect) =>
        effect.after_state.presence === "present" &&
        effect.after_state.state_fingerprint === projection.state_fingerprint &&
        exactRef(effect.after_state.state_ref, projection.state_ref),
    );
    if (
      affectedByReceipt &&
      (projection.source_transition_receipt_id !==
        transitionReceipt.transition_receipt_id ||
        projection.source_transition_receipt_fingerprint !==
          transitionReceipt.integrity.fingerprint)
    ) {
      throw new Error("local_context_affected_projection_receipt_mismatch");
    }
    const stateRecord = readVNextCoreRecordV01(db, {
      record_kind: "semantic_state",
      record_id: projection.state_ref.external_id,
      workspace_id: workspaceId,
      project_id: projectId,
    });
    if (!stateRecord) throw new Error("local_context_semantic_state_record_missing");
    const state = rebuildVNextPersistedSemanticStateV01(stateRecord.payload);
    assertTimestampNotBefore(
      observedAt,
      state.created_at,
      "local_context_observation_before_semantic_state_record",
    );
    assertVNextCoreRecordMatchesProtocolPayloadBindingV01(stateRecord, {
      workspace_id: state.workspace_id,
      project_id: state.project_id,
      fingerprint: state.integrity.fingerprint,
    });
    assertStateProjectionRecordRelation(projection, state, stateRecord);
    resolved.push({
      target_ref: projection.target_ref,
      state_ref: projection.state_ref,
      state_fingerprint: projection.state_fingerprint,
      semantic_state_record_id: state.semantic_state_record_id,
      semantic_state_record_fingerprint: state.integrity.fingerprint,
      projection_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(projection),
      ),
      revision: projection.revision,
    });
  }
  const canonical = new Set<string>();
  for (const state of resolved) {
    const key = canonicalizeProtocolValueV01({
      state_ref: state.state_ref,
      state_fingerprint: state.state_fingerprint,
    });
    if (canonical.has(key)) throw new Error("local_context_selected_state_duplicate");
    canonical.add(key);
  }
  return resolved.sort((left, right) =>
    canonicalizeProtocolValueV01(left).localeCompare(
      canonicalizeProtocolValueV01(right),
    ),
  );
}

function assertRetractedStateAbsent(
  db: Database.Database,
  workspaceId: string,
  projectId: string,
  receipt: StateTransitionReceiptV01,
): ExternalRefV01[] {
  const targetRefs: ExternalRefV01[] = [];
  for (const effect of receipt.effects) {
    if (effect.operation !== "retract") continue;
    const current = readVNextSemanticStateEntryV01(db, {
      workspace_id: workspaceId,
      project_id: projectId,
      target_key: deriveVNextSemanticTargetKeyV01(effect.target_ref),
    });
    if (current) throw new Error("local_context_retracted_state_still_present");
    const head = readVNextSemanticTargetHeadV01(db, {
      workspace_id: workspaceId,
      project_id: projectId,
      target_key: deriveVNextSemanticTargetKeyV01(effect.target_ref),
    });
    if (
      !head ||
      head.presence !== "absent" ||
      head.current_state_fingerprint !== null ||
      head.source_transition_receipt_id !== receipt.transition_receipt_id ||
      head.source_transition_receipt_fingerprint !==
        receipt.integrity.fingerprint ||
      head.updated_at !== receipt.recorded_at
    ) {
      throw new Error("local_context_retracted_target_head_mismatch");
    }
    targetRefs.push(normalizeExternalRefPrimitiveV01(effect.target_ref));
  }
  return normalizeRefs(targetRefs);
}

function assertCurrentProjectionHeadAndReceipt(
  db: Database.Database,
  projection: VNextSemanticStateProjectionEntryV01,
): void {
  const head = readVNextSemanticTargetHeadV01(db, {
    workspace_id: projection.workspace_id,
    project_id: projection.project_id,
    target_key: projection.target_key,
  });
  if (
    !head ||
    head.presence !== "present" ||
    head.revision !== projection.revision ||
    head.current_state_fingerprint !== projection.state_fingerprint ||
    head.source_transition_receipt_id !==
      projection.source_transition_receipt_id ||
    head.source_transition_receipt_fingerprint !==
      projection.source_transition_receipt_fingerprint ||
    head.updated_at !== projection.updated_at
  ) {
    throw new Error("local_context_semantic_target_head_drift");
  }
  const record = readVNextCoreRecordV01(db, {
    record_kind: "state_transition_receipt",
    record_id: head.source_transition_receipt_id,
    workspace_id: projection.workspace_id,
    project_id: projection.project_id,
  });
  if (!record) throw new Error("local_context_source_transition_receipt_missing");
  const validation = validateStateTransitionReceiptV01(record.payload);
  if (validation.status !== "valid") {
    throw new Error("local_context_source_transition_receipt_invalid");
  }
  const receipt = record.payload as StateTransitionReceiptV01;
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: receipt.workspace_id,
    project_id: receipt.project_id,
    fingerprint: receipt.integrity.fingerprint,
  });
  const effect = receipt.effects.find(
    (item) =>
      deriveVNextSemanticTargetKeyV01(item.target_ref) === projection.target_key,
  );
  if (
    record.record_id !== receipt.transition_receipt_id ||
    record.idempotency_key !== receipt.idempotency_key ||
    record.created_at !== receipt.recorded_at ||
    receipt.transition_receipt_id !== head.source_transition_receipt_id ||
    receipt.integrity.fingerprint !==
      head.source_transition_receipt_fingerprint ||
    receipt.recorded_at !== head.updated_at ||
    !effect ||
    effect.after_state.presence !== "present" ||
    effect.after_state.state_fingerprint !== projection.state_fingerprint ||
    !exactRef(effect.after_state.state_ref, projection.state_ref)
  ) {
    throw new Error("local_context_source_transition_receipt_mismatch");
  }
}

function assertStateProjectionRecordRelation(
  projection: VNextSemanticStateProjectionEntryV01,
  state: VNextPersistedSemanticStateVersionV01,
  record: VNextCoreRecordWriteResultV01["record"],
): void {
  if (
    record.record_id !== state.semantic_state_record_id ||
    record.created_at !== state.created_at ||
    projection.workspace_id !== state.workspace_id ||
    projection.project_id !== state.project_id ||
    projection.target_key !== state.target_key ||
    !exactRef(projection.target_ref, state.target_ref) ||
    !exactRef(projection.state_ref, state.state_ref) ||
    projection.state_fingerprint !== state.state_content_fingerprint ||
    projection.bounded_state_summary !== state.bounded_state_summary ||
    projection.source_proposal_id !== state.source_proposal_id ||
    projection.source_proposal_fingerprint !==
      state.source_proposal_fingerprint ||
    projection.source_candidate_id !== state.source_candidate_id ||
    projection.source_candidate_fingerprint !==
      state.source_candidate_fingerprint
  ) {
    throw new Error("local_context_semantic_state_record_drift");
  }
}

function buildLocalContextUseRunReceipt(input: {
  workspace_id: string;
  project_id: string;
  observed_at: string;
  prior_packet: TaskContextPacketV01;
  prior_packet_read_ref: ExternalRefV01;
  later_packet: TaskContextPacketV01;
  later_packet_read_ref: ExternalRefV01;
  transition_receipt: StateTransitionReceiptV01;
  transition_receipt_read_ref: ExternalRefV01;
  resolved_states: LocalContextUseResolvedStateBindingV01[];
  retracted_target_refs: ExternalRefV01[];
}): RunReceiptV01 {
  const probeFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      probe_version: VNEXT_LOCAL_CONTEXT_USE_PROBE_VERSION_V01,
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      prior_packet_ref: input.prior_packet_read_ref,
      later_packet_ref: input.later_packet_read_ref,
      transition_receipt_ref: input.transition_receipt_read_ref,
      resolved_states: input.resolved_states,
      retracted_target_refs: input.retracted_target_refs,
      observed_at: input.observed_at,
    }),
  );
  const observerRef = localReadRef(
    "local_context_use_observer",
    `local-context-use-observer:${probeFingerprint.slice(7, 31)}`,
    input.observed_at,
    probeFingerprint,
  );
  const sourceRefs = normalizeRefs([
    observerRef,
    input.prior_packet_read_ref,
    input.later_packet_read_ref,
    input.transition_receipt_read_ref,
    ...input.resolved_states.map((state) => state.state_ref),
    ...input.resolved_states.map((state) =>
      semanticStateRecordReadRef(state, input.observed_at),
    ),
    ...input.resolved_states.map((state) =>
      semanticStateProjectionReadRef(state, input.observed_at),
    ),
    ...input.retracted_target_refs,
  ]);
  const observations: RunReceiptBuilderInputV01["observations"] = [
    observation(
      "prior_packet_read",
      "local_prior_task_context_packet_read",
      "The exact persisted prior TaskContextPacket payload was read and validated locally.",
      input.observed_at,
      observerRef,
      [input.prior_packet_read_ref],
      ["check:local-task-context-packets-valid"],
    ),
    observation(
      "later_packet_read",
      "local_later_task_context_packet_read",
      "The exact persisted later TaskContextPacket payload was read and validated locally.",
      input.observed_at,
      observerRef,
      [input.later_packet_read_ref],
      ["check:local-task-context-packets-valid"],
    ),
    observation(
      "transition_receipt_read",
      "local_state_transition_receipt_read",
      "The exact persisted StateTransitionReceipt payload and later-packet lineage were read and validated locally.",
      input.observed_at,
      observerRef,
      [input.transition_receipt_read_ref, input.later_packet_read_ref],
      ["check:local-transition-lineage-valid"],
    ),
    ...input.resolved_states.map((state) =>
      observation(
        `state_resolution:${state.semantic_state_record_id}`,
        "local_semantic_state_resolution",
        "An accepted-state selection resolved to the exact current project-scoped semantic-state record and content fingerprint.",
        input.observed_at,
        observerRef,
        [
          state.state_ref,
          semanticStateRecordReadRef(state, input.observed_at),
          semanticStateProjectionReadRef(state, input.observed_at),
          input.later_packet_read_ref,
        ],
        ["check:local-semantic-state-resolution"],
      ),
    ),
    ...input.retracted_target_refs.map((targetRef) =>
      observation(
        `retracted_absence:${deriveVNextSemanticTargetKeyV01(targetRef)}`,
        "local_retracted_semantic_state_absence",
        "The retracted target had no current project-scoped semantic-state projection row.",
        input.observed_at,
        observerRef,
        [targetRef, input.transition_receipt_read_ref],
        ["check:local-semantic-state-resolution"],
      ),
    ),
    observation(
      "selection_change",
      "local_context_selection_change",
      "The persisted later packet selection differed from the exact persisted prior packet as required by the transition relation.",
      input.observed_at,
      observerRef,
      [
        input.prior_packet_read_ref,
        input.later_packet_read_ref,
        input.transition_receipt_read_ref,
      ],
      ["check:local-context-selection-change"],
    ),
  ];
  const checks: RunReceiptBuilderInputV01["checks"] = [
    check(
      "check:local-task-context-packets-valid",
      "Both exact persisted TaskContextPacket payloads validated.",
      observerRef,
    ),
    check(
      "check:local-transition-lineage-valid",
      "The persisted later packet retained exact StateTransitionReceipt lineage.",
      observerRef,
    ),
    check(
      "check:local-semantic-state-resolution",
      "Every selected accepted state resolved exactly and each retracted target remained absent.",
      observerRef,
    ),
    check(
      "check:local-context-selection-change",
      "The exact persisted before and after selections differed as required.",
      observerRef,
    ),
  ];
  const runIdHash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      probe_version: VNEXT_LOCAL_CONTEXT_USE_PROBE_VERSION_V01,
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      prior_packet_id: input.prior_packet.packet_id,
      later_packet_id: input.later_packet.packet_id,
      transition_receipt_id: input.transition_receipt.transition_receipt_id,
    }),
  );
  return buildRunReceiptV01({
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    run_id: `local-context-use-probe:${runIdHash.slice(7, 31)}`,
    work_ref:
      input.later_packet.work_ref &&
      typeof input.later_packet.work_ref === "object"
        ? input.later_packet.work_ref
        : null,
    task_context_packet_ref: input.later_packet_read_ref,
    recorded_at: input.observed_at,
    started_at: input.observed_at,
    finished_at: input.observed_at,
    execution: {
      status: "completed",
      basis: "observed",
      source_refs: [observerRef],
    },
    verification: {
      status: "passed",
      basis: "observed",
      required_check_ids: checks.map((item) => item.check_id),
      source_refs: [observerRef],
    },
    reporter_ref: observerRef,
    observer_refs: [observerRef],
    verifier_refs: [observerRef],
    host_ref: null,
    worker_ref: observerRef,
    model_invocations: [],
    execution_environment: {
      environment_kind: "local",
      host_ref: null,
      worker_ref: observerRef,
      operating_system: null,
      runtime_labels: ["local-sqlite-read-probe", "provider-neutral"],
      source_refs: [observerRef],
    },
    observations,
    attestations: [],
    changed_artifacts: [],
    commands: [],
    checks,
    skipped_checks: [],
    external_refs: sourceRefs,
    result_summary: {
      summary: `The local probe resolved ${input.resolved_states.length} accepted semantic state(s) and ${input.retracted_target_refs.length} retracted-state absence check(s) from persisted context.`,
      outcome:
        "Persisted packet, transition lineage, state resolution, and required selection change checks passed.",
      limitations: [
        "The probe observes local context resolution only; it does not establish helpfulness or outcome improvement.",
        "The probe does not approve semantic state, accept Evidence, close work, or grant transition authority.",
      ],
    },
    blockers: [],
    warnings: [],
    gaps: [
      {
        code: "context_helpfulness_not_observed",
        summary:
          "No later task outcome or user review was observed, so context usefulness remains unknown.",
        source_refs: [observerRef],
      },
    ],
    privacy_egress: {
      data_classification: "local_only",
      egress_status: "did_not_occur",
      basis: "observed",
      destination_refs: [],
      redaction_status: "not_needed",
      retention_class: null,
      raw_prompt_persisted: false,
      raw_output_persisted: false,
      raw_transcript_persisted: false,
      secret_material_persisted: false,
      source_refs: [observerRef],
      notes: [
        "This bounded probe performs local store reads and one immutable local receipt write only.",
        "No fetch, provider call, model invocation, or network destination exists in the probe path.",
      ],
    },
    cost_usage: {
      cost_basis: "unknown",
      cost_amount: null,
      currency: null,
      usage: {
        basis: "unknown",
        input_units: null,
        output_units: null,
        total_units: null,
        unit: null,
      },
      source_refs: [],
    },
    capability_coverage: [
      {
        capability: "persisted_task_context_packet_read",
        coverage_level: "observed",
        source_ref: observerRef,
        notes: ["Observation is limited to exact local ledger reads."],
      },
      {
        capability: "current_semantic_state_resolution",
        coverage_level: "observed",
        source_ref: observerRef,
        notes: [
          "Observed resolution does not approve the selected state or establish usefulness.",
        ],
      },
      {
        capability: "outcome_improvement",
        coverage_level: "outside_coverage",
        source_ref: null,
        notes: ["No later outcome was measured or reviewed."],
      },
    ],
    source_refs: sourceRefs,
    artifact_refs: [],
    compatibility: {
      source_contracts: [
        VNEXT_LOCAL_CONTEXT_USE_PROBE_VERSION_V01,
        input.prior_packet.packet_version,
        input.transition_receipt.transition_receipt_version,
      ],
      unmapped_fields: [],
      warnings: [
        "Local resolution observation is not user approval, accepted Evidence, or proof of context helpfulness.",
      ],
      external_refs: sourceRefs,
    },
    authority_notes: [
      "The local context-use probe is an observer, not an approver or semantic transition gate.",
      "Reading persisted context does not authorize a later action or automatic next-context mutation.",
    ],
  });
}

function observation(
  identity: string,
  kind: string,
  summary: string,
  observedAt: string,
  observerRef: ExternalRefV01,
  sourceRefs: ExternalRefV01[],
  relatedCheckIds: string[],
): RunReceiptBuilderInputV01["observations"][number] {
  const observationId = createProtocolSha256V01(
    canonicalizeProtocolValueV01({ identity, kind, source_refs: normalizeRefs(sourceRefs) }),
  );
  return {
    observation_id: `observation:${observationId.slice(7, 31)}`,
    observation_kind: kind,
    summary,
    event_at: observedAt,
    observed_at: observedAt,
    observer_ref: observerRef,
    trust_class: "direct_local_observation",
    source_refs: normalizeRefs(sourceRefs),
    related_command_ids: [],
    related_check_ids: relatedCheckIds,
    related_artifact_refs: [],
  };
}

function check(
  checkId: string,
  summary: string,
  observerRef: ExternalRefV01,
): RunReceiptBuilderInputV01["checks"][number] {
  return {
    check_id: checkId,
    required: true,
    status: "passed",
    basis: "observed",
    summary,
    source_refs: [observerRef],
  };
}

function packetReadRef(
  packet: TaskContextPacketV01,
  observedAt: string,
  refType: string,
): ExternalRefV01 {
  return localReadRef(
    refType,
    packet.packet_id,
    observedAt,
    packet.integrity.fingerprint,
  );
}

function compilerPriorPacketLineageRef(
  packet: TaskContextPacketV01,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: "task_context_packet",
    external_id: packet.packet_id,
    trust_class: "derived_interpretation",
    observed_at: packet.generated_at,
    source_ref: packet.integrity.fingerprint,
    compatibility_namespace:
      VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
  };
}

function transitionReceiptReadRef(
  receipt: StateTransitionReceiptV01,
  observedAt: string,
): ExternalRefV01 {
  return localReadRef(
    "state_transition_receipt",
    receipt.transition_receipt_id,
    observedAt,
    receipt.integrity.fingerprint,
  );
}

function semanticStateRecordReadRef(
  state: LocalContextUseResolvedStateBindingV01,
  observedAt: string,
): ExternalRefV01 {
  return localReadRef(
    "persisted_semantic_state_record",
    state.semantic_state_record_id,
    observedAt,
    state.semantic_state_record_fingerprint,
  );
}

function semanticStateProjectionReadRef(
  state: LocalContextUseResolvedStateBindingV01,
  observedAt: string,
): ExternalRefV01 {
  return localReadRef(
    "current_semantic_state_projection",
    deriveVNextSemanticTargetKeyV01(state.target_ref),
    observedAt,
    state.projection_fingerprint,
  );
}

function localReadRef(
  refType: string,
  externalId: string,
  observedAt: string,
  sourceRef: string,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    trust_class: "direct_local_observation",
    observed_at: observedAt,
    source_ref: sourceRef,
    compatibility_namespace: VNEXT_LOCAL_CONTEXT_USE_PROBE_NAMESPACE_V01,
  };
}

function normalizeRefs(refs: ExternalRefV01[]): ExternalRefV01[] {
  return uniqueProtocolValuesV01(
    refs.map(normalizeExternalRefPrimitiveV01),
  ).sort(compareExternalRefsV01);
}

function exactRef(
  left: ExternalRefV01 | null,
  right: ExternalRefV01 | null,
): boolean {
  return (
    canonicalizeProtocolValueV01(
      left ? normalizeExternalRefPrimitiveV01(left) : null,
    ) ===
    canonicalizeProtocolValueV01(
      right ? normalizeExternalRefPrimitiveV01(right) : null,
    )
  );
}

function containsExactRef(
  refs: ExternalRefV01[],
  expected: ExternalRefV01,
): boolean {
  return refs.some((ref) => exactRef(ref, expected));
}

function requiredText(value: unknown, field: string): string {
  const normalized = normalizeProtocolTextV01(value);
  if (!normalized) throw new Error(`${field}_missing`);
  return normalized;
}

function sha256(value: unknown, field: string): string {
  const normalized = requiredText(value, field);
  if (!/^sha256:[a-f0-9]{64}$/.test(normalized)) {
    throw new Error(`${field}_invalid`);
  }
  return normalized;
}

function strictTimestamp(value: unknown, field: string): string {
  const normalized = requiredText(value, field);
  if (parseStrictIsoTimestampV01(normalized) === null) {
    throw new Error(`${field}_invalid`);
  }
  return normalized;
}

function assertProbeInputKeys(input: RunLocalContextUseProbeInputV01): void {
  const allowed = new Set([
    "workspace_id",
    "project_id",
    "prior_packet_id",
    "prior_packet_fingerprint",
    "later_packet_id",
    "later_packet_fingerprint",
    "expected_transition_receipt_id",
    "expected_transition_receipt_fingerprint",
    "clock",
  ]);
  for (const key of Object.keys(input)) {
    if (allowed.has(key)) continue;
    throw new Error(
      key === "observed_at"
        ? "local_runtime_timestamp_input_forbidden"
        : `local_context_use_probe_input_unknown_field:${key}`,
    );
  }
}

function isResolvedStateRelationMaterialV01(value: unknown): boolean {
  if (!isProtocolRecordV01(value)) return false;
  const allowed = new Set([
    "target_ref",
    "state_ref",
    "state_fingerprint",
    "semantic_state_record_id",
    "semantic_state_record_fingerprint",
    "projection_fingerprint",
    "revision",
  ]);
  return (
    Object.keys(value).every((key) => allowed.has(key)) &&
    isStructurallyValidExternalRefV01(value.target_ref) &&
    isStructurallyValidExternalRefV01(value.state_ref) &&
    typeof value.state_fingerprint === "string" &&
    /^sha256:[a-f0-9]{64}$/.test(value.state_fingerprint) &&
    typeof value.semantic_state_record_id === "string" &&
    value.semantic_state_record_id.trim().length > 0 &&
    typeof value.semantic_state_record_fingerprint === "string" &&
    /^sha256:[a-f0-9]{64}$/.test(
      value.semantic_state_record_fingerprint,
    ) &&
    typeof value.projection_fingerprint === "string" &&
    /^sha256:[a-f0-9]{64}$/.test(value.projection_fingerprint) &&
    Number.isSafeInteger(value.revision) &&
    Number(value.revision) >= 1
  );
}

function isStructurallyValidExternalRefV01(value: unknown): boolean {
  let invalid = false;
  validateExternalRefStructureV01(value, "$.relation_ref", {
    error() {
      invalid = true;
    },
    warning() {},
  });
  return !invalid;
}

function assertTimestampNotBefore(
  observedAt: string,
  sourceAt: string,
  code: string,
): void {
  const observed = parseStrictIsoTimestampV01(observedAt);
  const source = parseStrictIsoTimestampV01(sourceAt);
  if (observed === null || source === null || observed < source) {
    throw new Error(code);
  }
}

function timestampNotBefore(observedAt: string, sourceAt: string): boolean {
  const observed = parseStrictIsoTimestampV01(observedAt);
  const source = parseStrictIsoTimestampV01(sourceAt);
  return observed !== null && source !== null && observed >= source;
}
