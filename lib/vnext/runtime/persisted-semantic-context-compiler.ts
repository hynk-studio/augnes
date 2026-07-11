import type Database from "better-sqlite3";

import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  deriveVNextSemanticTargetKeyV01,
  insertVNextCoreRecordV01,
  listVNextSemanticStateEntriesV01,
  readVNextCoreRecordV01,
  readVNextSemanticTargetHeadV01,
  rebuildVNextPersistedSemanticStateV01,
  type VNextCoreRecordWriteResultV01,
  type VNextPersistedSemanticStateVersionV01,
  type VNextSemanticStateProjectionEntryV01,
  type VNextSemanticTargetHeadV01,
  VNEXT_LOCAL_SEMANTIC_STATE_NAMESPACE_V01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  normalizeExternalRefPrimitiveV01,
  uniqueProtocolValuesV01,
} from "@/lib/vnext/protocol-primitives";
import {
  createStateTransitionReceiptLineageRefV01,
  validateSemanticTransitionFullChainV01,
  type StateTransitionFullChainValidationInputV01,
} from "@/lib/vnext/state-transition-eligibility";
import { validateStateTransitionReceiptV01 } from "@/lib/vnext/state-transition-receipt";
import {
  buildTaskContextPacketV01,
  validateTaskContextPacketV01,
} from "@/lib/vnext/task-context-packet";
import {
  loadValidatedVNextSemanticTransitionRelationV01,
  type ValidatedVNextSemanticTransitionRelationV01,
} from "@/lib/vnext/runtime/durable-semantic-transition";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  StateTransitionReceiptEffectV01,
  StateTransitionReceiptV01,
  TaskContextPacketTransitionRelationResultV01,
} from "@/types/vnext/state-transition-receipt";
import type {
  TaskContextPacketExcludedEntryV01,
  TaskContextPacketSelectedEntryV01,
  TaskContextPacketV01,
} from "@/types/vnext/task-context-packet";

export const VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01 =
  "vnext_persisted_semantic_context_compiler.v0.1" as const;

export type VNextTaskContextPacketExpiryPolicyV01 =
  | { mode: "explicit"; expires_at: string | null }
  | { mode: "reuse_prior" };

export interface CompileTaskContextPacketFromPersistedSemanticStateInputV01 {
  workspace_id: string;
  project_id: string;
  prior_packet: TaskContextPacketV01;
  transition_receipt_id: string;
  transition_receipt_fingerprint: string;
  generated_at: string;
  expiry_policy: VNextTaskContextPacketExpiryPolicyV01;
}

export interface CompileTaskContextPacketFromPersistedSemanticStateResultV01 {
  status: VNextCoreRecordWriteResultV01["status"];
  later_packet: TaskContextPacketV01;
  transition: ValidatedVNextSemanticTransitionRelationV01;
  full_chain_input: StateTransitionFullChainValidationInputV01;
  full_chain_relation: TaskContextPacketTransitionRelationResultV01;
  current_state_entries: VNextSemanticStateProjectionEntryV01[];
}

interface ResolvedPresentEffectV01 {
  effect: StateTransitionReceiptEffectV01;
  projection: VNextSemanticStateProjectionEntryV01;
  state: VNextPersistedSemanticStateVersionV01;
}

export function compileTaskContextPacketFromPersistedSemanticStateV01(
  db: Database.Database,
  input: CompileTaskContextPacketFromPersistedSemanticStateInputV01,
): CompileTaskContextPacketFromPersistedSemanticStateResultV01 {
  if (db.inTransaction) {
    throw new Error("persisted_context_compiler_nested_transaction_forbidden");
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = compileTaskContextPacketInternalV01(db, input);
    db.exec("COMMIT");
    return result;
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

function compileTaskContextPacketInternalV01(
  db: Database.Database,
  input: CompileTaskContextPacketFromPersistedSemanticStateInputV01,
): CompileTaskContextPacketFromPersistedSemanticStateResultV01 {
  validatePriorPacket(input.prior_packet, input.workspace_id, input.project_id);
  const transition = loadValidatedVNextSemanticTransitionRelationV01(db, {
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    transition_receipt_id: input.transition_receipt_id,
    transition_receipt_fingerprint: input.transition_receipt_fingerprint,
  });
  const currentStateEntries = listVNextSemanticStateEntriesV01(db, {
    workspace_id: input.workspace_id,
    project_id: input.project_id,
  });
  const resolvedPresentEffects = resolvePersistedEffectStates(
    db,
    transition,
    currentStateEntries,
  );
  validateUnrelatedPersistedStateSelections(
    db,
    transition,
    currentStateEntries,
    input.prior_packet,
  );
  const laterPacket = buildLaterPacket(
    input,
    transition,
    resolvedPresentEffects,
  );
  const packetValidation = validateTaskContextPacketV01(laterPacket, {
    evaluated_at: input.generated_at,
  });
  if (packetValidation.status !== "valid") {
    throw new Error(
      `compiled_task_context_packet_invalid:${packetValidation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  const fullChainInput: StateTransitionFullChainValidationInputV01 = {
    ...transition.eligibility_input,
    receipt: transition.receipt,
    prior_packet: input.prior_packet,
    later_packet: laterPacket,
  };
  const fullChainRelation = validateSemanticTransitionFullChainV01(
    fullChainInput,
  );
  if (fullChainRelation.status !== "valid") {
    throw new Error(
      `semantic_transition_full_chain_invalid:${fullChainRelation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  const write = insertVNextCoreRecordV01(db, {
    record_kind: "task_context_packet",
    record_id: laterPacket.packet_id,
    workspace_id: laterPacket.workspace_id,
    project_id: laterPacket.project_id,
    fingerprint: laterPacket.integrity.fingerprint,
    idempotency_key: null,
    payload: laterPacket,
    created_at: laterPacket.generated_at,
  });
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(write.record, {
    workspace_id: laterPacket.workspace_id,
    project_id: laterPacket.project_id,
    fingerprint: laterPacket.integrity.fingerprint,
  });
  if (
    write.record.record_id !== laterPacket.packet_id ||
    write.record.created_at !== laterPacket.generated_at
  ) {
    throw new Error("persisted_task_context_packet_envelope_mismatch");
  }
  return {
    status: write.status,
    later_packet: laterPacket,
    transition,
    full_chain_input: fullChainInput,
    full_chain_relation: fullChainRelation,
    current_state_entries: currentStateEntries,
  };
}

function validatePriorPacket(
  packet: TaskContextPacketV01,
  workspaceId: string,
  projectId: string,
): void {
  const validation = validateTaskContextPacketV01(packet, {
    evaluated_at: packet.generated_at,
  });
  if (validation.status !== "valid") {
    throw new Error("prior_task_context_packet_invalid");
  }
  if (packet.workspace_id !== workspaceId) {
    throw new Error("prior_task_context_packet_workspace_mismatch");
  }
  if (packet.project_id !== projectId) {
    throw new Error("prior_task_context_packet_project_mismatch");
  }
}

function resolvePersistedEffectStates(
  db: Database.Database,
  transition: ValidatedVNextSemanticTransitionRelationV01,
  currentEntries: VNextSemanticStateProjectionEntryV01[],
): ResolvedPresentEffectV01[] {
  const currentByTarget = new Map(
    currentEntries.map((entry) => [entry.target_key, entry]),
  );
  const resolved: ResolvedPresentEffectV01[] = [];
  for (const effect of transition.receipt.effects) {
    const targetKey = deriveVNextSemanticTargetKeyV01(effect.target_ref);
    const projection = currentByTarget.get(targetKey) ?? null;
    const head = readRequiredTargetHead(
      db,
      transition.receipt.workspace_id,
      transition.receipt.project_id,
      targetKey,
    );
    assertTargetHeadMatchesReceiptEffect(
      head,
      transition.receipt,
      effect,
    );
    const intendedEffect = transition.gate_record.intended_effects.find(
      (intended) => intended.target_key === targetKey,
    );
    if (
      !intendedEffect ||
      intendedEffect.operation !== effect.operation ||
      head.revision !== intendedEffect.expected_revision
    ) {
      throw new Error("semantic_target_head_revision_drift");
    }
    if (effect.after_state.presence === "absent") {
      if (projection) {
        throw new Error("retracted_semantic_state_still_present");
      }
      continue;
    }
    if (!projection) throw new Error("applied_semantic_state_projection_missing");
    if (
      projection.revision !== intendedEffect.expected_revision ||
      projection.updated_at !== transition.receipt.recorded_at ||
      projection.source_transition_receipt_id !==
        transition.receipt.transition_receipt_id ||
      projection.source_transition_receipt_fingerprint !==
        transition.receipt.integrity.fingerprint ||
      projection.state_fingerprint !== effect.after_state.state_fingerprint ||
      canonicalizeProtocolValueV01(projection.state_ref) !==
        canonicalizeProtocolValueV01(effect.after_state.state_ref) ||
      canonicalizeProtocolValueV01(projection.target_ref) !==
        canonicalizeProtocolValueV01(effect.target_ref)
    ) {
      throw new Error("applied_semantic_state_projection_drift");
    }
    const state = loadValidatedProjectionState(db, projection);
    if (
      state.target_key !== targetKey ||
      canonicalizeProtocolValueV01(state.target_ref) !==
        canonicalizeProtocolValueV01(effect.target_ref) ||
      state.state_content_fingerprint !== projection.state_fingerprint ||
      state.bounded_state_summary !== projection.bounded_state_summary ||
      state.source_proposal_id !==
        transition.receipt.source_proposal.proposal_id ||
      state.source_proposal_fingerprint !==
        transition.receipt.source_proposal.proposal_fingerprint ||
      state.source_decision_id !==
        transition.receipt.source_decision.decision_id ||
      state.source_decision_fingerprint !==
        transition.receipt.source_decision.decision_fingerprint ||
      projection.source_proposal_id !== state.source_proposal_id ||
      projection.source_proposal_fingerprint !==
        state.source_proposal_fingerprint ||
      projection.source_candidate_id !== state.source_candidate_id ||
      projection.source_candidate_fingerprint !==
        state.source_candidate_fingerprint ||
      canonicalizeProtocolValueV01(state.state_ref) !==
        canonicalizeProtocolValueV01(projection.state_ref)
    ) {
      throw new Error("applied_semantic_state_record_drift");
    }
    resolved.push({ effect, projection, state });
  }
  return resolved.sort((left, right) =>
    left.projection.target_key < right.projection.target_key
      ? -1
      : left.projection.target_key > right.projection.target_key
        ? 1
        : 0,
  );
}

function validateUnrelatedPersistedStateSelections(
  db: Database.Database,
  transition: ValidatedVNextSemanticTransitionRelationV01,
  currentEntries: VNextSemanticStateProjectionEntryV01[],
  priorPacket: TaskContextPacketV01,
): void {
  const affectedTargetKeys = new Set(
    transition.receipt.effects.map((effect) =>
      deriveVNextSemanticTargetKeyV01(effect.target_ref),
    ),
  );
  const affectedBeforeSnapshots = new Set(
    transition.receipt.effects.flatMap((effect) =>
      effect.before_state.presence === "present"
        ? [
            snapshotKey(
              effect.before_state.state_ref,
              effect.before_state.state_fingerprint,
            ),
          ]
        : [],
    ),
  );
  const currentProjectionSnapshots = new Set(
    currentEntries.map((projection) =>
      snapshotKey(projection.state_ref, projection.state_fingerprint),
    ),
  );
  for (const projection of currentEntries) {
    if (affectedTargetKeys.has(projection.target_key)) continue;
    assertProjectionHeadAndReceipt(db, projection);
    const state = loadValidatedProjectionState(db, projection);
    const exactPriorSelection = priorPacket.selected_context.some(
      (entry) =>
        entry.entry_kind === "accepted_state_ref" &&
        entry.source_ref === state.state_content_fingerprint &&
        entry.trust_class === state.state_ref.trust_class &&
        canonicalizeProtocolValueV01(entry.external_ref) ===
          canonicalizeProtocolValueV01(state.state_ref),
    );
    if (!exactPriorSelection) {
      throw new Error(
        "unrelated_persisted_state_missing_from_prior_packet_selection",
      );
    }
  }
  for (const entry of priorPacket.selected_context) {
    if (
      entry.entry_kind !== "accepted_state_ref" ||
      !entry.external_ref ||
      entry.external_ref.compatibility_namespace !==
        VNEXT_LOCAL_SEMANTIC_STATE_NAMESPACE_V01
    ) {
      continue;
    }
    if (!entry.source_ref) {
      throw new Error("prior_packet_local_semantic_state_snapshot_invalid");
    }
    const key = snapshotKey(entry.external_ref, entry.source_ref);
    if (
      !affectedBeforeSnapshots.has(key) &&
      !currentProjectionSnapshots.has(key)
    ) {
      throw new Error(
        "prior_packet_stale_local_semantic_state_selection",
      );
    }
  }
}

function loadValidatedProjectionState(
  db: Database.Database,
  projection: VNextSemanticStateProjectionEntryV01,
): VNextPersistedSemanticStateVersionV01 {
  const stateRecord = readVNextCoreRecordV01(db, {
    record_kind: "semantic_state",
    record_id: projection.state_ref.external_id,
    workspace_id: projection.workspace_id,
    project_id: projection.project_id,
  });
  if (!stateRecord) throw new Error("applied_semantic_state_record_missing");
  const state = rebuildVNextPersistedSemanticStateV01(stateRecord.payload);
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(stateRecord, {
    workspace_id: state.workspace_id,
    project_id: state.project_id,
    fingerprint: state.integrity.fingerprint,
  });
  if (
    stateRecord.record_id !== state.semantic_state_record_id ||
    stateRecord.created_at !== state.created_at ||
    state.workspace_id !== projection.workspace_id ||
    state.project_id !== projection.project_id ||
    state.target_key !== projection.target_key ||
    canonicalizeProtocolValueV01(state.target_ref) !==
      canonicalizeProtocolValueV01(projection.target_ref) ||
    canonicalizeProtocolValueV01(state.state_ref) !==
      canonicalizeProtocolValueV01(projection.state_ref) ||
    state.state_content_fingerprint !== projection.state_fingerprint ||
    state.bounded_state_summary !== projection.bounded_state_summary ||
    state.source_proposal_id !== projection.source_proposal_id ||
    state.source_proposal_fingerprint !==
      projection.source_proposal_fingerprint ||
    state.source_candidate_id !== projection.source_candidate_id ||
    state.source_candidate_fingerprint !==
      projection.source_candidate_fingerprint
  ) {
    throw new Error("applied_semantic_state_record_drift");
  }
  return state;
}

function readRequiredTargetHead(
  db: Database.Database,
  workspaceId: string,
  projectId: string,
  targetKey: string,
): VNextSemanticTargetHeadV01 {
  const head = readVNextSemanticTargetHeadV01(db, {
    workspace_id: workspaceId,
    project_id: projectId,
    target_key: targetKey,
  });
  if (!head) throw new Error("semantic_target_head_missing");
  return head;
}

function assertTargetHeadMatchesReceiptEffect(
  head: VNextSemanticTargetHeadV01,
  receipt: StateTransitionReceiptV01,
  effect: StateTransitionReceiptEffectV01,
): void {
  if (
    head.presence !== effect.after_state.presence ||
    head.current_state_fingerprint !== effect.after_state.state_fingerprint ||
    head.source_transition_receipt_id !== receipt.transition_receipt_id ||
    head.source_transition_receipt_fingerprint !==
      receipt.integrity.fingerprint ||
    head.updated_at !== receipt.recorded_at
  ) {
    throw new Error("semantic_target_head_receipt_drift");
  }
}

function assertProjectionHeadAndReceipt(
  db: Database.Database,
  projection: VNextSemanticStateProjectionEntryV01,
): void {
  const head = readRequiredTargetHead(
    db,
    projection.workspace_id,
    projection.project_id,
    projection.target_key,
  );
  if (
    head.presence !== "present" ||
    head.revision !== projection.revision ||
    head.current_state_fingerprint !== projection.state_fingerprint ||
    head.source_transition_receipt_id !==
      projection.source_transition_receipt_id ||
    head.source_transition_receipt_fingerprint !==
      projection.source_transition_receipt_fingerprint ||
    head.updated_at !== projection.updated_at
  ) {
    throw new Error("semantic_target_head_projection_drift");
  }
  const record = readVNextCoreRecordV01(db, {
    record_kind: "state_transition_receipt",
    record_id: head.source_transition_receipt_id,
    workspace_id: projection.workspace_id,
    project_id: projection.project_id,
  });
  if (!record) throw new Error("semantic_target_head_receipt_missing");
  const validation = validateStateTransitionReceiptV01(record.payload);
  if (validation.status !== "valid") {
    throw new Error("semantic_target_head_receipt_invalid");
  }
  const receipt = record.payload as StateTransitionReceiptV01;
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: receipt.workspace_id,
    project_id: receipt.project_id,
    fingerprint: receipt.integrity.fingerprint,
  });
  const effect = receipt.effects.find(
    (item) => deriveVNextSemanticTargetKeyV01(item.target_ref) === projection.target_key,
  );
  if (
    record.record_id !== receipt.transition_receipt_id ||
    record.idempotency_key !== receipt.idempotency_key ||
    record.created_at !== receipt.recorded_at ||
    !effect
  ) {
    throw new Error("semantic_target_head_receipt_drift");
  }
  assertTargetHeadMatchesReceiptEffect(head, receipt, effect);
}

function buildLaterPacket(
  input: CompileTaskContextPacketFromPersistedSemanticStateInputV01,
  transition: ValidatedVNextSemanticTransitionRelationV01,
  presentEffects: ResolvedPresentEffectV01[],
): TaskContextPacketV01 {
  const receiptRef = createStateTransitionReceiptLineageRefV01(
    transition.receipt,
  );
  const priorPacketRef = createPriorPacketLineageRef(input.prior_packet);
  const beforeSnapshots = new Set(
    transition.receipt.effects.flatMap((effect) =>
      effect.before_state.presence === "present"
        ? [
            snapshotKey(
              effect.before_state.state_ref,
              effect.before_state.state_fingerprint,
            ),
          ]
        : [],
    ),
  );
  const unrelatedSelected = input.prior_packet.selected_context.filter(
    (entry) => !beforeSnapshots.has(selectedEntrySnapshotKey(entry)),
  );
  const selectedContext: TaskContextPacketSelectedEntryV01[] = [
    ...unrelatedSelected,
    ...presentEffects.map(({ effect, projection }) => ({
      entry_id: `accepted-state:${projection.state_ref.external_id}`,
      entry_kind: "accepted_state_ref" as const,
      source_ref: projection.state_fingerprint,
      external_ref: projection.state_ref,
      why_included:
        "Selected from the exact persisted semantic-state projection after the bound transition.",
      currentness: {
        status: "fresh" as const,
        as_of: effect.after_application_observation_ref.observed_at ??
          transition.receipt.applied_at,
        basis:
          "Bound to the exact local after-application observation recorded by the transition receipt.",
        source_ref: effect.after_application_observation_ref,
      },
      trust_class: projection.state_ref.trust_class,
      compatibility_source_ref: receiptRef,
      bounded_summary: projection.bounded_state_summary,
    })),
  ];
  const retractExclusions: TaskContextPacketExcludedEntryV01[] =
    transition.receipt.effects.flatMap((effect, index) =>
      effect.operation === "retract" &&
      effect.before_state.presence === "present"
        ? [
            {
              entry_id: `retracted-state:${index}:${effect.before_state.state_ref.external_id}`,
              source_ref: effect.before_state.state_fingerprint,
              external_ref: effect.before_state.state_ref,
              why_excluded:
                "Excluded because the exact persisted semantic state was retracted by the bound transition receipt.",
              currentness: {
                status: "fresh" as const,
                as_of: receiptRef.observed_at ?? transition.receipt.recorded_at,
                basis:
                  "Bound to the exact persisted StateTransitionReceipt retraction lineage.",
                source_ref: receiptRef,
              },
            },
          ]
        : [],
    );
  const expiresAt = resolveExpiryPolicy(
    input.expiry_policy,
    input.prior_packet.expires_at,
  );
  return buildTaskContextPacketV01({
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    work_ref: input.prior_packet.work_ref,
    generated_at: input.generated_at,
    expires_at: expiresAt,
    task: input.prior_packet.task,
    current_projection: input.prior_packet.current_projection,
    selected_context: selectedContext,
    excluded_context: [
      ...input.prior_packet.excluded_context,
      ...retractExclusions,
    ],
    tensions: input.prior_packet.tensions,
    risks: input.prior_packet.risks,
    gaps: input.prior_packet.gaps,
    constraints: input.prior_packet.constraints,
    capability_grant: input.prior_packet.capability_grant,
    return_contract: input.prior_packet.return_contract,
    source_status: input.prior_packet.source_status,
    compatibility: {
      ...input.prior_packet.compatibility,
      source_contracts: uniqueStrings([
        ...input.prior_packet.compatibility.source_contracts,
        input.prior_packet.packet_version,
        transition.receipt.transition_receipt_version,
        VNEXT_PERSISTED_SEMANTIC_CONTEXT_COMPILER_VERSION_V01,
      ]),
      source_refs: normalizeRefs([
        ...input.prior_packet.compatibility.source_refs,
        priorPacketRef,
        receiptRef,
      ]),
      warnings: uniqueStrings([
        ...input.prior_packet.compatibility.warnings,
        "Later context was compiled by an explicit local call; receipt presence alone does not trigger packet mutation.",
      ]),
    },
    authority_notes: [
      ...input.prior_packet.authority_summary.notes,
      "The Context Compiler reads persisted state but does not authorize or apply semantic transitions.",
    ],
  });
}

function createPriorPacketLineageRef(packet: TaskContextPacketV01): ExternalRefV01 {
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

function resolveExpiryPolicy(
  policy: VNextTaskContextPacketExpiryPolicyV01,
  priorExpiresAt: string | null,
): string | null {
  if (policy?.mode === "reuse_prior") {
    if (Object.keys(policy).length !== 1) {
      throw new Error("task_context_expiry_policy_invalid");
    }
    return priorExpiresAt;
  }
  if (
    policy?.mode !== "explicit" ||
    Object.keys(policy).some((key) => !["mode", "expires_at"].includes(key)) ||
    !(policy.expires_at === null || typeof policy.expires_at === "string")
  ) {
    throw new Error("task_context_expiry_policy_invalid");
  }
  return policy.expires_at;
}

function selectedEntrySnapshotKey(entry: TaskContextPacketSelectedEntryV01): string {
  return entry.external_ref && entry.source_ref
    ? snapshotKey(entry.external_ref, entry.source_ref)
    : "";
}

function snapshotKey(ref: ExternalRefV01, fingerprint: string): string {
  return `${canonicalizeProtocolValueV01(normalizeExternalRefPrimitiveV01(ref))}|${fingerprint}`;
}

function normalizeRefs(refs: ExternalRefV01[]): ExternalRefV01[] {
  return uniqueProtocolValuesV01(
    refs.map(normalizeExternalRefPrimitiveV01),
  ).sort(compareExternalRefsV01);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}
