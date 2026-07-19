import type Database from "better-sqlite3";

import {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  deriveVNextSemanticTargetKeyV01,
  readVNextCoreRecordByIdempotencyKeyV01,
  readVNextCoreRecordV01,
  readVNextSemanticStateEntryV01,
  readVNextSemanticTargetHeadV01,
  rebuildVNextPersistedSemanticStateV01,
  type VNextCoreRecordEnvelopeV01,
  type VNextPersistedSemanticStateVersionV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import {
  listClaimEvidenceRelationFamilyRevisionsV01,
  listClaimFamilyRevisionsV01,
  readClaimEvidenceRelationV01,
  readClaimRecordV01,
} from "@/lib/vnext/persistence/project-verify-material-store";
import {
  canonicalizeProtocolValueV01,
  normalizeExternalRefPrimitiveV01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import {
  deriveProjectVerifyLifecycleProposalAdmissionIdentityV01,
  materializeProjectVerifyLifecycleProposalV01,
  type ProjectVerifyLifecycleProposalAdmissionIdentityV01,
  type ProjectVerifyLifecycleProposalMaterializationV01,
  type ProjectVerifyLifecycleSelectedRecordV01,
} from "@/lib/vnext/project-verify-lifecycle";
import {
  createProjectVerifyFamilyOriginFingerprintV01,
  createProjectVerifyFamilyTargetRefV01,
  createProjectVerifyLifecycleRecordRefV01,
  validateProjectVerifyLifecycleBindingV01,
} from "@/lib/vnext/project-verify-lifecycle-protocol";
import { validateEpisodeDeltaProposalV01 } from "@/lib/vnext/episode-delta-proposal";
import { createEpisodeDeltaCandidateFingerprintV01 } from "@/lib/vnext/review-decision";
import { validateStateTransitionReceiptV01 } from "@/lib/vnext/state-transition-receipt";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  ProjectVerifyLifecycleBindingV01,
  ProjectVerifyLifecycleCurrentHeadExpectationV01,
  ProjectVerifyLifecycleEntityKindV01,
} from "@/types/vnext/project-verify-lifecycle";
import type {
  ClaimEvidenceRelationV01,
  ClaimRecordV01,
} from "@/types/vnext/project-verify-material";
import type { StateTransitionReceiptV01 } from "@/types/vnext/state-transition-receipt";

export const PROJECT_VERIFY_LIFECYCLE_ADMISSION_VERSION_V01 =
  "project_verify_lifecycle_admission.v0.1" as const;

export class ProjectVerifyLifecycleAdmissionErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "ProjectVerifyLifecycleAdmissionErrorV01";
  }
}

export interface ProjectVerifyLifecycleStoreSelectionV01 {
  workspace_id: string;
  project_id: string;
  entity_kind: ProjectVerifyLifecycleEntityKindV01;
  selected_record_id: string;
  /** Exact server-owned time at which this scoped head snapshot is read. */
  observed_at: string;
}

export interface ProjectVerifyLifecycleStructuralSourceV01 {
  proposal: EpisodeDeltaProposalV01;
  selected_record: ProjectVerifyLifecycleSelectedRecordV01;
  lineage_revision_count: number;
  lifecycle_binding: ProjectVerifyLifecycleBindingV01;
}

/**
 * Canonical scoped materializer. The selected record is explicit: the reader
 * validates the complete immutable family lineage and never substitutes the
 * highest or latest recorded candidate. The head snapshot is read directly
 * from the existing semantic-state/head authority.
 */
/**
 * @internal Structural assembly used only by the durable Transition module and
 * the full-chain admission wrapper. This does not authenticate the preceding
 * proposal, ReviewDecision, gate, and Transition chain by itself.
 */
export function materializeProjectVerifyLifecycleProposalStructuralOnlyV01(
  db: Database.Database,
  input: ProjectVerifyLifecycleStoreSelectionV01,
): ProjectVerifyLifecycleProposalMaterializationV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const source = resolveSelectedRecordV01(db, input);
  const head = readLiveFamilyHeadV01(db, source.selected_record);
  assertObservationTimeV01(input.observed_at, head.observed_not_before);
  return materializeProjectVerifyLifecycleProposalV01({
    selected_record: source.selected_record,
    current_head_expectation: head.expectation,
    observed_at: input.observed_at,
  });
}

/** @internal See materializeProjectVerifyLifecycleProposalStructuralOnlyV01. */
export function readProjectVerifyLifecycleProposalStructuralOnlyV01(
  db: Database.Database,
  identity: ProjectVerifyLifecycleProposalAdmissionIdentityV01,
): {
  record: VNextCoreRecordEnvelopeV01;
  proposal: EpisodeDeltaProposalV01;
} | null {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const record = readVNextCoreRecordByIdempotencyKeyV01(db, {
    record_kind: "episode_delta_proposal",
    workspace_id: requiredTextV01(
      identity.workspace_id,
      "workspace_id_invalid",
    ),
    project_id: requiredTextV01(identity.project_id, "project_id_invalid"),
    idempotency_key: identity.admission_idempotency_key,
  });
  if (!record) return null;
  if (validateEpisodeDeltaProposalV01(record.payload).status !== "valid") {
    refuseV01("project_verify_lifecycle_proposal_invalid");
  }
  const proposal = record.payload as EpisodeDeltaProposalV01;
  assertProposalEnvelopeV01(record, proposal, identity);
  const authenticated = assertProjectVerifyLifecycleProposalStructuralOnlyV01(
    db,
    proposal,
  );
  const expectedIdentity =
    deriveProjectVerifyLifecycleProposalAdmissionIdentityV01({
      workspace_id: authenticated.lifecycle_binding.workspace_id,
      project_id: authenticated.lifecycle_binding.project_id,
      entity_kind: authenticated.lifecycle_binding.entity_kind,
      family_id: authenticated.lifecycle_binding.family_id,
      selected_record_ref: authenticated.lifecycle_binding.selected_record_ref,
    });
  if (!canonicalEqualV01(expectedIdentity, identity)) {
    refuseV01("project_verify_lifecycle_proposal_identity_conflict");
  }
  return { record, proposal };
}

/**
 * @internal Validates exact SR-2 and structural prior state/receipt material.
 * It is deliberately not named or exported as a full source-authenticity gate.
 */
export function assertProjectVerifyLifecycleProposalStructuralOnlyV01(
  db: Database.Database,
  proposal: EpisodeDeltaProposalV01,
): ProjectVerifyLifecycleStructuralSourceV01 {
  if (validateEpisodeDeltaProposalV01(proposal).status !== "valid") {
    refuseV01("project_verify_lifecycle_proposal_invalid");
  }
  const profile = proposal.project_verify_lifecycle;
  if (!profile || proposal.proposed_deltas.length !== 1) {
    refuseV01("project_verify_lifecycle_proposal_profile_missing");
  }
  const bindingValidation = validateProjectVerifyLifecycleBindingV01(
    profile.lifecycle_binding,
  );
  if (bindingValidation.status !== "valid") {
    refuseV01("project_verify_lifecycle_binding_invalid");
  }
  const binding = profile.lifecycle_binding;
  const candidate = proposal.proposed_deltas[0]!;
  const candidateFingerprint =
    createEpisodeDeltaCandidateFingerprintV01(candidate);
  if (
    binding.decision_candidate.candidate_id !== candidate.candidate_id ||
    binding.decision_candidate.candidate_fingerprint !== candidateFingerprint ||
    binding.selected_candidate.candidate_id !== candidate.candidate_id ||
    binding.selected_candidate.candidate_fingerprint !== candidateFingerprint
  ) {
    refuseV01("project_verify_lifecycle_candidate_binding_conflict");
  }
  const source = resolveSelectedRecordV01(db, {
    workspace_id: binding.workspace_id,
    project_id: binding.project_id,
    entity_kind: binding.entity_kind,
    selected_record_id: binding.selected_record_ref.record_id,
  });
  const exactRecordRef = createProjectVerifyLifecycleRecordRefV01(
    source.selected_record,
  );
  if (!canonicalEqualV01(exactRecordRef, binding.selected_record_ref)) {
    refuseV01("project_verify_lifecycle_selected_record_conflict");
  }
  const historicalHeadObservedNotBefore = assertHistoricalHeadExpectationV01(
    db,
    binding,
    profile.current_head_expectation,
  );
  assertObservationTimeV01(
    proposal.created_at,
    laterTimestampV01(
      source.selected_record.created_at,
      historicalHeadObservedNotBefore,
    ),
  );
  const rematerialized = materializeProjectVerifyLifecycleProposalV01({
    selected_record: source.selected_record,
    current_head_expectation: profile.current_head_expectation,
    observed_at: proposal.created_at,
  });
  if (!canonicalEqualV01(rematerialized.proposal, proposal)) {
    refuseV01("project_verify_lifecycle_proposal_source_material_conflict");
  }
  return {
    proposal,
    selected_record: source.selected_record,
    lineage_revision_count: source.lineage_revision_count,
    lifecycle_binding: binding,
  };
}

/**
 * @internal Structural live-CAS check. Canonical callers must first traverse
 * the full prior proposal, ReviewDecision, gate, Transition, and state chain.
 */
export function assertProjectVerifyLifecycleCurrentHeadStructuralOnlyV01(
  db: Database.Database,
  proposal: EpisodeDeltaProposalV01,
): ProjectVerifyLifecycleStructuralSourceV01 {
  const authenticated = assertProjectVerifyLifecycleProposalStructuralOnlyV01(
    db,
    proposal,
  );
  const live = readLiveFamilyHeadV01(db, authenticated.selected_record);
  if (
    !canonicalEqualV01(
      live.expectation,
      proposal.project_verify_lifecycle?.current_head_expectation,
    )
  ) {
    refuseV01("project_verify_lifecycle_current_head_expectation_conflict");
  }
  return authenticated;
}

/** @internal Structural snapshot; not a source-authenticated public read. */
export function readProjectVerifyLifecycleCurrentHeadStructuralOnlyV01(
  db: Database.Database,
  selectedRecord: ProjectVerifyLifecycleSelectedRecordV01,
): ProjectVerifyLifecycleCurrentHeadExpectationV01 {
  return readLiveFamilyHeadV01(db, selectedRecord).expectation;
}

function resolveSelectedRecordV01(
  db: Database.Database,
  input: Omit<ProjectVerifyLifecycleStoreSelectionV01, "observed_at">,
): {
  selected_record: ProjectVerifyLifecycleSelectedRecordV01;
  lineage_revision_count: number;
} {
  const workspaceId = requiredTextV01(
    input.workspace_id,
    "workspace_id_invalid",
  );
  const projectId = requiredTextV01(input.project_id, "project_id_invalid");
  const selectedRecordId = requiredTextV01(
    input.selected_record_id,
    "selected_record_id_invalid",
  );
  if (input.entity_kind === "claim_record") {
    const record = readClaimRecordV01(db, {
      workspace_id: workspaceId,
      project_id: projectId,
      claim_id: selectedRecordId,
    });
    if (!record) refuseV01("project_verify_lifecycle_claim_missing");
    const lineage = listClaimFamilyRevisionsV01(db, {
      workspace_id: workspaceId,
      project_id: projectId,
      claim_family_id: record.claim_family_id,
    });
    assertSelectedClaimInLineageV01(record, lineage);
    return {
      selected_record: structuredClone(record),
      lineage_revision_count: lineage.length,
    };
  }
  if (input.entity_kind !== "claim_evidence_relation") {
    refuseV01("project_verify_lifecycle_entity_kind_invalid");
  }
  const record = readClaimEvidenceRelationV01(db, {
    workspace_id: workspaceId,
    project_id: projectId,
    relation_id: selectedRecordId,
  });
  if (!record) refuseV01("project_verify_lifecycle_relation_missing");
  const lineage = listClaimEvidenceRelationFamilyRevisionsV01(db, {
    workspace_id: workspaceId,
    project_id: projectId,
    relation_family_id: record.relation_family_id,
  });
  assertSelectedRelationInLineageV01(record, lineage);
  return {
    selected_record: structuredClone(record),
    lineage_revision_count: lineage.length,
  };
}

function readLiveFamilyHeadV01(
  db: Database.Database,
  selectedRecord: ProjectVerifyLifecycleSelectedRecordV01,
): {
  expectation: ProjectVerifyLifecycleCurrentHeadExpectationV01;
  observed_not_before: string;
} {
  const entityKind =
    "claim_version" in selectedRecord
      ? "claim_record"
      : "claim_evidence_relation";
  const familyId =
    "claim_version" in selectedRecord
      ? selectedRecord.claim_family_id
      : selectedRecord.relation_family_id;
  const familyOriginFingerprint = createProjectVerifyFamilyOriginFingerprintV01(
    selectedRecord.family_origin,
  );
  const targetRef = createProjectVerifyFamilyTargetRefV01({
    entity_kind: entityKind,
    family_id: familyId,
    family_origin_fingerprint: familyOriginFingerprint,
  });
  const targetKey = deriveVNextSemanticTargetKeyV01(targetRef);
  const projection = readVNextSemanticStateEntryV01(db, {
    workspace_id: selectedRecord.workspace_id,
    project_id: selectedRecord.project_id,
    target_key: targetKey,
  });
  const head = readVNextSemanticTargetHeadV01(db, {
    workspace_id: selectedRecord.workspace_id,
    project_id: selectedRecord.project_id,
    target_key: targetKey,
  });
  if (!head) {
    if (projection) {
      refuseV01("project_verify_lifecycle_projection_without_head");
    }
    return {
      expectation: absentHeadExpectationV01(),
      observed_not_before: selectedRecord.created_at,
    };
  }
  if (head.presence === "absent") {
    if (projection) {
      refuseV01("project_verify_lifecycle_absent_head_projection_conflict");
    }
    // v0.1 create records are revision 1 and may not reactivate an older
    // retracted family. A retracted target remains historical, not pristine.
    refuseV01("project_verify_lifecycle_family_already_retracted");
  }
  if (
    !projection ||
    head.workspace_id !== selectedRecord.workspace_id ||
    head.project_id !== selectedRecord.project_id ||
    head.target_key !== targetKey ||
    projection.revision !== head.revision ||
    projection.state_fingerprint !== head.current_state_fingerprint ||
    projection.source_transition_receipt_id !==
      head.source_transition_receipt_id ||
    projection.source_transition_receipt_fingerprint !==
      head.source_transition_receipt_fingerprint ||
    projection.updated_at !== head.updated_at ||
    canonicalizeProtocolValueV01(projection.target_ref) !==
      canonicalizeProtocolValueV01(targetRef)
  ) {
    refuseV01("project_verify_lifecycle_head_projection_conflict");
  }
  const state = readExactPersistedStateV01(db, {
    workspace_id: selectedRecord.workspace_id,
    project_id: selectedRecord.project_id,
    state_record_id: projection.state_ref.external_id,
  });
  const stateBinding = exactLifecycleStateBindingV01(state, targetRef);
  if (
    state.state_content_fingerprint !== projection.state_fingerprint ||
    state.target_key !== targetKey ||
    state.state_content_fingerprint !== head.current_state_fingerprint ||
    state.bounded_state_summary !== projection.bounded_state_summary ||
    state.source_proposal_id !== projection.source_proposal_id ||
    state.source_proposal_fingerprint !==
      projection.source_proposal_fingerprint ||
    state.source_candidate_id !== projection.source_candidate_id ||
    state.source_candidate_fingerprint !==
      projection.source_candidate_fingerprint ||
    canonicalizeProtocolValueV01(state.state_ref) !==
      canonicalizeProtocolValueV01(projection.state_ref)
  ) {
    refuseV01("project_verify_lifecycle_current_state_conflict");
  }
  const { effect: currentEffect } = assertTransitionReceiptEffectV01(db, {
    workspace_id: selectedRecord.workspace_id,
    project_id: selectedRecord.project_id,
    receipt_id: head.source_transition_receipt_id,
    receipt_fingerprint: head.source_transition_receipt_fingerprint,
    target_ref: targetRef,
    expected_presence: "present",
    expected_state_content_fingerprint: state.state_content_fingerprint,
    expected_state_record_id: state.semantic_state_record_id,
    expected_recorded_at: head.updated_at,
  });
  if (
    currentEffect.after_state.presence !== "present" ||
    canonicalizeProtocolValueV01(currentEffect.after_state.state_ref) !==
      canonicalizeProtocolValueV01(state.state_ref)
  ) {
    refuseV01("project_verify_lifecycle_current_transition_state_conflict");
  }
  return {
    expectation: {
      presence: "present",
      revision: head.revision,
      state_content_fingerprint: state.state_content_fingerprint,
      source_transition_receipt_id: head.source_transition_receipt_id,
      source_transition_receipt_fingerprint:
        head.source_transition_receipt_fingerprint,
      selected_record_ref: structuredClone(stateBinding.selected_record_ref),
    },
    observed_not_before:
      Date.parse(head.updated_at) >= Date.parse(selectedRecord.created_at)
        ? head.updated_at
        : selectedRecord.created_at,
  };
}

function assertHistoricalHeadExpectationV01(
  db: Database.Database,
  binding: ProjectVerifyLifecycleBindingV01,
  expectation: ProjectVerifyLifecycleCurrentHeadExpectationV01,
): string | null {
  const targetRef = createProjectVerifyFamilyTargetRefV01({
    entity_kind: binding.entity_kind,
    family_id: binding.family_id,
    family_origin_fingerprint: binding.family_origin_fingerprint,
  });
  if (
    canonicalizeProtocolValueV01(targetRef) !==
    canonicalizeProtocolValueV01(binding.family_target_ref)
  ) {
    refuseV01("project_verify_lifecycle_family_target_conflict");
  }
  if (expectation.presence === "absent") {
    if (
      expectation.revision !== 0 ||
      expectation.state_content_fingerprint !== null ||
      expectation.source_transition_receipt_id !== null ||
      expectation.source_transition_receipt_fingerprint !== null ||
      expectation.selected_record_ref !== null
    ) {
      refuseV01("project_verify_lifecycle_absent_expectation_conflict");
    }
    return null;
  }
  if (
    !expectation.source_transition_receipt_id ||
    !expectation.source_transition_receipt_fingerprint ||
    !expectation.state_content_fingerprint ||
    !expectation.selected_record_ref
  ) {
    refuseV01("project_verify_lifecycle_present_expectation_incomplete");
  }
  const { effect, receipt } = assertTransitionReceiptEffectV01(db, {
    workspace_id: binding.workspace_id,
    project_id: binding.project_id,
    receipt_id: expectation.source_transition_receipt_id,
    receipt_fingerprint: expectation.source_transition_receipt_fingerprint,
    target_ref: targetRef,
    expected_presence: "present",
    expected_state_content_fingerprint: expectation.state_content_fingerprint,
    expected_state_record_id: null,
    expected_recorded_at: null,
  });
  if (effect.after_state.presence !== "present") {
    refuseV01("project_verify_lifecycle_prior_transition_effect_conflict");
  }
  const priorState = readExactPersistedStateV01(db, {
    workspace_id: binding.workspace_id,
    project_id: binding.project_id,
    state_record_id: effect.after_state.state_ref.external_id,
  });
  const priorBinding = exactLifecycleStateBindingV01(priorState, targetRef);
  if (
    priorState.state_content_fingerprint !==
      expectation.state_content_fingerprint ||
    !canonicalEqualV01(
      priorBinding.selected_record_ref,
      expectation.selected_record_ref,
    )
  ) {
    refuseV01("project_verify_lifecycle_prior_state_binding_conflict");
  }
  const currentHead = readVNextSemanticTargetHeadV01(db, {
    workspace_id: binding.workspace_id,
    project_id: binding.project_id,
    target_key: deriveVNextSemanticTargetKeyV01(targetRef),
  });
  if (!currentHead || currentHead.revision < expectation.revision) {
    refuseV01("project_verify_lifecycle_head_history_conflict");
  }
  if (
    currentHead.revision === expectation.revision &&
    (currentHead.source_transition_receipt_id !==
      expectation.source_transition_receipt_id ||
      currentHead.source_transition_receipt_fingerprint !==
        expectation.source_transition_receipt_fingerprint ||
      currentHead.current_state_fingerprint !==
        expectation.state_content_fingerprint)
  ) {
    refuseV01("project_verify_lifecycle_head_history_conflict");
  }
  return receipt.recorded_at;
}

function readExactPersistedStateV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    state_record_id: string;
  },
): VNextPersistedSemanticStateVersionV01 {
  const envelope = readVNextCoreRecordV01(db, {
    record_kind: "semantic_state",
    record_id: input.state_record_id,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
  });
  if (!envelope) refuseV01("project_verify_lifecycle_semantic_state_missing");
  let state: VNextPersistedSemanticStateVersionV01;
  try {
    state = rebuildVNextPersistedSemanticStateV01(envelope.payload);
  } catch {
    refuseV01("project_verify_lifecycle_semantic_state_invalid");
  }
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(envelope, {
    workspace_id: state.workspace_id,
    project_id: state.project_id,
    fingerprint: state.integrity.fingerprint,
  });
  if (
    envelope.record_id !== state.semantic_state_record_id ||
    envelope.created_at !== state.created_at ||
    state.workspace_id !== input.workspace_id ||
    state.project_id !== input.project_id
  ) {
    refuseV01("project_verify_lifecycle_semantic_state_envelope_conflict");
  }
  return state;
}

function exactLifecycleStateBindingV01(
  state: VNextPersistedSemanticStateVersionV01,
  targetRef: ExternalRefV01,
): ProjectVerifyLifecycleBindingV01 {
  const binding = state.state_content.project_verify_lifecycle_binding;
  if (
    !binding ||
    validateProjectVerifyLifecycleBindingV01(binding).status !== "valid" ||
    canonicalizeProtocolValueV01(binding.family_target_ref) !==
      canonicalizeProtocolValueV01(targetRef) ||
    canonicalizeProtocolValueV01(state.target_ref) !==
      canonicalizeProtocolValueV01(targetRef)
  ) {
    refuseV01("project_verify_lifecycle_semantic_state_binding_conflict");
  }
  return binding;
}

function assertTransitionReceiptEffectV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    receipt_id: string;
    receipt_fingerprint: string;
    target_ref: ExternalRefV01;
    expected_presence: "absent" | "present";
    expected_state_content_fingerprint: string | null;
    expected_state_record_id: string | null;
    expected_recorded_at: string | null;
  },
): {
  effect: StateTransitionReceiptV01["effects"][number];
  receipt: StateTransitionReceiptV01;
} {
  const envelope = readVNextCoreRecordV01(db, {
    record_kind: "state_transition_receipt",
    record_id: input.receipt_id,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
  });
  if (!envelope)
    refuseV01("project_verify_lifecycle_transition_receipt_missing");
  if (validateStateTransitionReceiptV01(envelope.payload).status !== "valid") {
    refuseV01("project_verify_lifecycle_transition_receipt_invalid");
  }
  const receipt = envelope.payload as StateTransitionReceiptV01;
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(envelope, {
    workspace_id: receipt.workspace_id,
    project_id: receipt.project_id,
    fingerprint: receipt.integrity.fingerprint,
  });
  const targetCanonical = canonicalizeProtocolValueV01(
    normalizeExternalRefPrimitiveV01(input.target_ref),
  );
  const effects = receipt.effects.filter(
    (effect) =>
      canonicalizeProtocolValueV01(
        normalizeExternalRefPrimitiveV01(effect.target_ref),
      ) === targetCanonical,
  );
  if (
    envelope.record_id !== receipt.transition_receipt_id ||
    envelope.idempotency_key !== receipt.idempotency_key ||
    envelope.created_at !== receipt.recorded_at ||
    receipt.transition_receipt_id !== input.receipt_id ||
    receipt.integrity.fingerprint !== input.receipt_fingerprint ||
    receipt.workspace_id !== input.workspace_id ||
    receipt.project_id !== input.project_id ||
    (input.expected_recorded_at !== null &&
      receipt.recorded_at !== input.expected_recorded_at) ||
    effects.length !== 1
  ) {
    refuseV01("project_verify_lifecycle_transition_receipt_conflict");
  }
  const effect = effects[0]!;
  if (
    effect.after_state.presence !== input.expected_presence ||
    effect.after_state.state_fingerprint !==
      input.expected_state_content_fingerprint ||
    (input.expected_state_record_id !== null &&
      (effect.after_state.presence !== "present" ||
        effect.after_state.state_ref.external_id !==
          input.expected_state_record_id))
  ) {
    refuseV01("project_verify_lifecycle_transition_effect_conflict");
  }
  return { effect, receipt };
}

function assertProposalEnvelopeV01(
  record: VNextCoreRecordEnvelopeV01,
  proposal: EpisodeDeltaProposalV01,
  identity: ProjectVerifyLifecycleProposalAdmissionIdentityV01,
): void {
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(record, {
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
    fingerprint: proposal.integrity.fingerprint,
  });
  if (
    record.record_id !== proposal.proposal_id ||
    record.fingerprint !== proposal.integrity.fingerprint ||
    record.idempotency_key !== identity.admission_idempotency_key ||
    record.created_at !== proposal.created_at ||
    proposal.workspace_id !== identity.workspace_id ||
    proposal.project_id !== identity.project_id ||
    !canonicalEqualV01(record.payload, proposal)
  ) {
    refuseV01("project_verify_lifecycle_proposal_envelope_conflict");
  }
}

function assertSelectedClaimInLineageV01(
  selected: ClaimRecordV01,
  lineage: ClaimRecordV01[],
): void {
  const exact = lineage.find((record) => record.claim_id === selected.claim_id);
  if (!exact || !canonicalEqualV01(exact, selected)) {
    refuseV01("project_verify_lifecycle_claim_lineage_conflict");
  }
}

function assertSelectedRelationInLineageV01(
  selected: ClaimEvidenceRelationV01,
  lineage: ClaimEvidenceRelationV01[],
): void {
  const exact = lineage.find(
    (record) => record.relation_id === selected.relation_id,
  );
  if (!exact || !canonicalEqualV01(exact, selected)) {
    refuseV01("project_verify_lifecycle_relation_lineage_conflict");
  }
}

function absentHeadExpectationV01(): ProjectVerifyLifecycleCurrentHeadExpectationV01 {
  return {
    presence: "absent",
    revision: 0,
    state_content_fingerprint: null,
    source_transition_receipt_id: null,
    source_transition_receipt_fingerprint: null,
    selected_record_ref: null,
  };
}

function requiredTextV01(value: unknown, code: string): string {
  if (typeof value !== "string" || value.trim().length === 0) refuseV01(code);
  return value.trim();
}

function assertObservationTimeV01(value: unknown, notBefore: string): void {
  if (typeof value !== "string") refuseV01("observed_at_invalid");
  const observedAt = parseStrictIsoTimestampV01(value.trim());
  const floor = parseStrictIsoTimestampV01(notBefore);
  if (observedAt === null || floor === null || observedAt < floor) {
    refuseV01("project_verify_lifecycle_observation_predates_source");
  }
}

function laterTimestampV01(left: string, right: string | null): string {
  if (right === null) return left;
  const leftAt = parseStrictIsoTimestampV01(left);
  const rightAt = parseStrictIsoTimestampV01(right);
  if (leftAt === null || rightAt === null) {
    refuseV01("project_verify_lifecycle_source_timestamp_invalid");
  }
  return leftAt >= rightAt ? left : right;
}

function canonicalEqualV01(left: unknown, right: unknown): boolean {
  return (
    canonicalizeProtocolValueV01(left) === canonicalizeProtocolValueV01(right)
  );
}

function refuseV01(code: string): never {
  throw new ProjectVerifyLifecycleAdmissionErrorV01(code);
}
