import type Database from "better-sqlite3";

import {
  readVNextLocalRuntimeClockNowV01,
  type VNextLocalRuntimeClockV01,
} from "@/lib/vnext/runtime/local-runtime-clock";
import {
  VNEXT_OPERATOR_PILOT_GATE_TTL_MAX_MS_V01,
  VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_MAX_MS_V01,
  createVNextOperatorPilotReviewWindowConfigFingerprintV01,
  isExplicitVNextOperatorPilotReviewWindowConfigV01,
  resolveVNextOperatorPilotReviewWindowCapabilityV01,
  type VNextOperatorPilotReviewWindowCapabilityV01,
  type VNextOperatorPilotReviewWindowCapabilityResolutionV01,
} from "@/lib/vnext/runtime/operator-pilot-review-window-config-v0-1";

import {
  VNEXT_LOCAL_SEMANTIC_STATE_NAMESPACE_V01,
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01,
  assertVNextDurableSemanticStoreSchemaV01,
  buildVNextPersistedSemanticStateV01,
  deleteVNextSemanticStateEntryCasV01,
  deriveVNextSemanticTargetKeyV01,
  insertVNextCoreRecordV01,
  insertVNextSemanticStateEntryV01,
  insertVNextSemanticTargetHeadV01,
  readVNextCoreRecordByIdempotencyKeyV01,
  readVNextCoreRecordV01,
  readVNextSemanticStateEntryV01,
  readVNextSemanticTargetHeadV01,
  rebuildVNextPersistedSemanticStateV01,
  updateVNextSemanticTargetHeadCasV01,
  updateVNextSemanticStateEntryCasV01,
  type VNextCoreRecordWriteResultV01,
  type VNextCoreRecordEnvelopeV01,
  type VNextPersistedSemanticStateVersionV01,
  type VNextSemanticStateProjectionEntryV01,
  type VNextSemanticTargetHeadV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { assertPersistedRunAssessmentProposalSourceBoundV01 } from "@/lib/vnext/persistence/episode-delta-proposal-admission";
import {
  assertProjectVerifyLifecycleCurrentHeadStructuralOnlyV01,
  assertProjectVerifyLifecycleProposalStructuralOnlyV01,
  readProjectVerifyLifecycleProposalStructuralOnlyV01,
  type ProjectVerifyLifecycleStructuralSourceV01,
} from "@/lib/vnext/persistence/project-verify-lifecycle-source";
import { deriveProjectVerifyLifecycleProposalAdmissionIdentityV01 } from "@/lib/vnext/project-verify-lifecycle";
import {
  canonicalizeProtocolValueV01,
  compareExternalRefsV01,
  createProtocolSha256V01,
  normalizeExternalRefPrimitiveV01,
  normalizeProtocolTextV01,
  parseStrictIsoTimestampV01,
  uniqueProtocolValuesV01,
  validateExternalRefStructureV01,
} from "@/lib/vnext/protocol-primitives";
import {
  evaluateReviewDecisionStateTransitionEligibilityV01,
  mapEpisodeDeltaCandidateOperationToTransitionOperationV01,
  validateStateTransitionReceiptAgainstEligibilityV01,
} from "@/lib/vnext/state-transition-eligibility";
import {
  createEpisodeDeltaCandidateFingerprintV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "@/lib/vnext/review-decision";
import {
  buildStateTransitionReceiptV01,
  compareStateTransitionReceiptReplayCompatibilityV01,
  createStateTransitionApplicationResultFingerprintV01,
  validateStateTransitionReceiptV01,
} from "@/lib/vnext/state-transition-receipt";
import { validateEpisodeDeltaProposalV01 } from "@/lib/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  EpisodeDeltaProposalDeltaCandidateV01,
  EpisodeDeltaProposalV01,
} from "@/types/vnext/episode-delta-proposal";
import { PROJECT_VERIFY_LIFECYCLE_TARGET_NAMESPACE_V01 } from "@/types/vnext/project-verify-lifecycle";
import type {
  ReviewDecisionRequestedTransitionKindV01,
  ReviewDecisionV01,
} from "@/types/vnext/review-decision";
import {
  STATE_TRANSITION_RECEIPT_VERSION_V01,
  type StateTransitionCurrentStateObservationV01,
  type StateTransitionEligibilityEvaluationInputV01,
  type StateTransitionEligibilityResultV01,
  type StateTransitionGateAuthorizedEffectV01,
  type StateTransitionReceiptOperationV01,
  type StateTransitionReceiptBuilderInputV01,
  type StateTransitionReceiptV01,
  type StateTransitionSemanticCommitGateEvaluationV01,
} from "@/types/vnext/state-transition-receipt";

export const VNEXT_SEMANTIC_COMMIT_PREVIEW_VERSION_V01 =
  "vnext_semantic_commit_preview.v0.1" as const;
export const VNEXT_SEMANTIC_COMMIT_GATE_RECORD_VERSION_V01 =
  "vnext_semantic_commit_gate_record.v0.1" as const;
const VNEXT_SEMANTIC_TRANSITION_READ_SESSION_MAX_CACHED_SOURCES_V01 = 256;
export const VNEXT_DURABLE_TRANSITION_RUNTIME_NAMESPACE_V01 =
  "augnes.vnext.durable-semantic-transition.v0.1" as const;
export const VNEXT_SEMANTIC_COMMIT_CONFIRMATION_CONTEXT_REF_TYPE_V01 =
  "semantic_commit_confirmation_context" as const;
export const VNEXT_SEMANTIC_COMMIT_CONFIRMATION_CONTEXT_NAMESPACE_V01 =
  "augnes.vnext.semantic-commit-confirmation-context.v0.1" as const;
export const VNEXT_SEMANTIC_COMMIT_GATE_MAX_TTL_MS_V01 = 60 * 60 * 1000;
export const VNEXT_SEMANTIC_COMMIT_PREVIEW_MAX_AGE_MS_V01 = 15 * 60 * 1000;

const VNEXT_OPERATOR_PILOT_CONFIRMATION_CONTEXT_VERSION_V01 =
  "vnext_operator_pilot_review_window_confirmation_context.v0.1" as const;

export interface VNextLocalRuntimeActorIdentityV01 {
  ref_type: string;
  external_id: string;
}

export const VNEXT_SEMANTIC_TRANSITION_TEST_FAILURE_CHECKPOINTS_V01 = [
  "after_proposal_record_insert",
  "after_decision_record_insert",
  "after_gate_record_insert",
  "after_first_state_record_insert",
  "after_first_projection_write",
  "before_receipt_insert",
  "after_receipt_insert_before_commit",
  "during_second_target",
] as const;

export type VNextSemanticTransitionTestFailureCheckpointV01 =
  (typeof VNEXT_SEMANTIC_TRANSITION_TEST_FAILURE_CHECKPOINTS_V01)[number];

export interface VNextSemanticTransitionTestOptionsV01 {
  on_checkpoint?: (
    checkpoint: VNextSemanticTransitionTestFailureCheckpointV01,
  ) => void;
}

export interface VNextSemanticReviewMaterialPersistenceResultV01 {
  proposal_record: VNextCoreRecordWriteResultV01;
  decision_record: VNextCoreRecordWriteResultV01;
}

export interface VNextSemanticCommitPreviewEffectV01 {
  target_ref: ExternalRefV01;
  target_key: string;
  operation: StateTransitionReceiptOperationV01;
  before_presence: "absent" | "present";
  before_state_fingerprint: string | null;
  expected_after_state_fingerprint: string | null;
  expected_revision: number;
}

export interface VNextSemanticCommitLineageBindingV01 {
  record_id: string;
  fingerprint: string;
}

export interface VNextSemanticCommitPreviewV01 {
  preview_version: typeof VNEXT_SEMANTIC_COMMIT_PREVIEW_VERSION_V01;
  workspace_id: string;
  project_id: string;
  proposal_id: string;
  proposal_fingerprint: string;
  decision_id: string;
  decision_fingerprint: string;
  candidate_id: string;
  candidate_fingerprint: string;
  intent_id: string;
  transition_kind: Exclude<ReviewDecisionRequestedTransitionKindV01, "other">;
  authorized_applier_identity: VNextLocalRuntimeActorIdentityV01;
  gate_ttl_ms: number;
  previewed_at: string;
  current_state_observations: StateTransitionCurrentStateObservationV01[];
  intended_effects: VNextSemanticCommitPreviewEffectV01[];
  prior_review_decision_bindings: VNextSemanticCommitLineageBindingV01[];
  prior_state_transition_receipt_bindings: VNextSemanticCommitLineageBindingV01[];
  confirmation_digest: string;
  eligibility_input: null;
  eligibility: null;
}

export interface VNextSemanticCommitGateRecordV01 {
  gate_record_version: typeof VNEXT_SEMANTIC_COMMIT_GATE_RECORD_VERSION_V01;
  gate_record_id: string;
  workspace_id: string;
  project_id: string;
  proposal_id: string;
  proposal_fingerprint: string;
  decision_id: string;
  decision_fingerprint: string;
  candidate_id: string;
  candidate_fingerprint: string;
  confirmation_digest: string;
  previewed_at: string;
  confirmed_at: string;
  operator_actor_ref: ExternalRefV01;
  confirmation_observation_ref: ExternalRefV01;
  operator_confirmation_basis_refs?: ExternalRefV01[];
  current_state_observations: StateTransitionCurrentStateObservationV01[];
  intended_effects: VNextSemanticCommitPreviewEffectV01[];
  prior_review_decision_bindings: VNextSemanticCommitLineageBindingV01[];
  prior_state_transition_receipt_bindings: VNextSemanticCommitLineageBindingV01[];
  semantic_commit_gate_evaluation: StateTransitionSemanticCommitGateEvaluationV01;
  eligibility_evaluated_at: string;
  eligibility_precondition_fingerprint: string;
  integrity: {
    algorithm: "sha256";
    fingerprint_scope: "semantic_commit_gate_record_without_integrity_fingerprint";
    fingerprint: string;
  };
}

export interface VNextSemanticCommitAuthorizationResultV01 {
  status: VNextCoreRecordWriteResultV01["status"];
  gate_record: VNextSemanticCommitGateRecordV01;
  eligibility_input: StateTransitionEligibilityEvaluationInputV01;
  eligibility: StateTransitionEligibilityResultV01;
}

export interface VNextSemanticTransitionCommitResultV01 {
  status: "applied" | "exact_replay";
  semantic_state: VNextPersistedSemanticStateVersionV01 | null;
  projection: VNextSemanticStateProjectionEntryV01 | null;
  transition_receipt: StateTransitionReceiptV01;
  receipt: StateTransitionReceiptV01;
  state_records: VNextPersistedSemanticStateVersionV01[];
  projection_entries: VNextSemanticStateProjectionEntryV01[];
  eligibility_input: StateTransitionEligibilityEvaluationInputV01;
  eligibility: StateTransitionEligibilityResultV01;
}

export interface PersistVNextSemanticReviewMaterialInputV01 {
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
  test_options?: VNextSemanticTransitionTestOptionsV01;
}

export interface PrepareVNextSemanticCommitPreviewInputV01 {
  workspace_id: string;
  project_id: string;
  proposal_id: string;
  proposal_fingerprint: string;
  decision_id: string;
  decision_fingerprint: string;
  authorized_applier_identity: VNextLocalRuntimeActorIdentityV01;
  gate_ttl_ms: number;
  clock?: VNextLocalRuntimeClockV01;
}

export interface PrepareVNextSemanticCommitPreviewWithOperatorPilotCapabilityInputV01 extends Omit<
  PrepareVNextSemanticCommitPreviewInputV01,
  "gate_ttl_ms"
> {
  review_window_capability: VNextOperatorPilotReviewWindowCapabilityV01;
}

export interface RecordVNextSemanticCommitAuthorizationInputV01 {
  preview: VNextSemanticCommitPreviewV01;
  confirmation_digest: string;
  operator_actor_ref: ExternalRefV01;
  operator_confirmation_basis_refs?: ExternalRefV01[];
  clock?: VNextLocalRuntimeClockV01;
  test_options?: VNextSemanticTransitionTestOptionsV01;
}

export interface RecordVNextSemanticCommitAuthorizationWithOperatorPilotCapabilityInputV01 extends RecordVNextSemanticCommitAuthorizationInputV01 {
  review_window_capability: VNextOperatorPilotReviewWindowCapabilityV01;
}

export interface CommitVNextSemanticTransitionInputV01 {
  workspace_id: string;
  project_id: string;
  proposal_id: string;
  proposal_fingerprint: string;
  decision_id: string;
  decision_fingerprint: string;
  gate_record_id: string;
  gate_record_fingerprint: string;
  clock?: VNextLocalRuntimeClockV01;
  test_options?: VNextSemanticTransitionTestOptionsV01;
}

export interface CommitVNextSemanticTransitionWithOperatorPilotCapabilityInputV01 extends CommitVNextSemanticTransitionInputV01 {
  review_window_capability: VNextOperatorPilotReviewWindowCapabilityV01;
}

export interface LoadValidatedVNextSemanticTransitionInputV01 {
  workspace_id: string;
  project_id: string;
  transition_receipt_id: string;
  transition_receipt_fingerprint: string;
}

export interface LoadValidatedVNextSemanticCommitGateInputV01 {
  workspace_id: string;
  project_id: string;
  gate_record_id: string;
  gate_record_fingerprint: string;
}

export interface ValidatedVNextSemanticCommitGateRelationV01 {
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
  gate_record: VNextSemanticCommitGateRecordV01;
  eligibility_input: StateTransitionEligibilityEvaluationInputV01;
  eligibility: StateTransitionEligibilityResultV01;
}

export interface ValidatedVNextSemanticTransitionRelationV01 {
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
  gate_record: VNextSemanticCommitGateRecordV01;
  receipt: StateTransitionReceiptV01;
  eligibility_input: StateTransitionEligibilityEvaluationInputV01;
  eligibility: StateTransitionEligibilityResultV01;
}

export type VNextSemanticTransitionRelationReadSessionV01 = (input: {
  transition_receipt_id: string;
  transition_receipt_fingerprint: string;
}) => ValidatedVNextSemanticTransitionRelationV01;

export interface ProjectVerifyLifecyclePersistedStateSourceInputV01 {
  state: VNextPersistedSemanticStateVersionV01;
  transition_receipt_id: string;
  transition_receipt_fingerprint: string;
}

export function persistVNextSemanticReviewMaterialV01(
  input: PersistVNextSemanticReviewMaterialInputV01 & { db: Database.Database },
): VNextSemanticReviewMaterialPersistenceResultV01;
export function persistVNextSemanticReviewMaterialV01(
  db: Database.Database,
  input: PersistVNextSemanticReviewMaterialInputV01,
): VNextSemanticReviewMaterialPersistenceResultV01;
export function persistVNextSemanticReviewMaterialV01(
  dbOrInput:
    | Database.Database
    | (PersistVNextSemanticReviewMaterialInputV01 & { db: Database.Database }),
  maybeInput?: PersistVNextSemanticReviewMaterialInputV01,
): VNextSemanticReviewMaterialPersistenceResultV01 {
  const { db, input } = unpackDbInput(dbOrInput, maybeInput);
  assertProposalDecision(input.proposal, input.decision);
  assertVNextDurableSemanticStoreSchemaV01(db);
  return withImmediateTransaction(db, () => {
    const lifecycle = input.proposal.project_verify_lifecycle;
    if (lifecycle) {
      const binding = lifecycle.lifecycle_binding;
      const admitted = readProjectVerifyLifecycleProposalStructuralOnlyV01(
        db,
        deriveProjectVerifyLifecycleProposalAdmissionIdentityV01({
          workspace_id: binding.workspace_id,
          project_id: binding.project_id,
          entity_kind: binding.entity_kind,
          family_id: binding.family_id,
          selected_record_ref: binding.selected_record_ref,
        }),
      );
      if (
        !admitted ||
        canonicalizeProtocolValueV01(admitted.proposal) !==
          canonicalizeProtocolValueV01(input.proposal)
      ) {
        throw new Error(
          "project_verify_lifecycle_proposal_canonical_admission_required",
        );
      }
      assertProjectVerifyLifecycleProposalFullSourceBoundV01(
        db,
        admitted.proposal,
      );
    }
    const proposalRecord = insertVNextCoreRecordV01(db, {
      record_kind: "episode_delta_proposal",
      record_id: input.proposal.proposal_id,
      workspace_id: input.proposal.workspace_id,
      project_id: input.proposal.project_id,
      fingerprint: input.proposal.integrity.fingerprint,
      idempotency_key:
        input.proposal.project_verify_lifecycle?.admission_idempotency_key ??
        null,
      payload: input.proposal,
      created_at: input.proposal.created_at,
    });
    runTestCheckpoint(input.test_options, "after_proposal_record_insert");
    const decisionRecord = insertVNextCoreRecordV01(db, {
      record_kind: "review_decision",
      record_id: input.decision.decision_id,
      workspace_id: input.decision.workspace_id,
      project_id: input.decision.project_id,
      fingerprint: input.decision.integrity.fingerprint,
      idempotency_key: null,
      payload: input.decision,
      created_at: input.decision.decided_at,
    });
    runTestCheckpoint(input.test_options, "after_decision_record_insert");
    return {
      proposal_record: proposalRecord,
      decision_record: decisionRecord,
    };
  });
}

export function prepareVNextSemanticCommitPreviewV01(
  input: PrepareVNextSemanticCommitPreviewInputV01 & { db: Database.Database },
): VNextSemanticCommitPreviewV01;
export function prepareVNextSemanticCommitPreviewV01(
  db: Database.Database,
  input: PrepareVNextSemanticCommitPreviewInputV01,
): VNextSemanticCommitPreviewV01;
export function prepareVNextSemanticCommitPreviewV01(
  dbOrInput:
    | Database.Database
    | (PrepareVNextSemanticCommitPreviewInputV01 & { db: Database.Database }),
  maybeInput?: PrepareVNextSemanticCommitPreviewInputV01,
): VNextSemanticCommitPreviewV01 {
  const { db, input } = unpackDbInput(dbOrInput, maybeInput);
  assertVNextDurableSemanticStoreSchemaV01(db);
  assertRuntimeInputKeys(
    input,
    new Set([
      "workspace_id",
      "project_id",
      "proposal_id",
      "proposal_fingerprint",
      "decision_id",
      "decision_fingerprint",
      "authorized_applier_identity",
      "gate_ttl_ms",
      "clock",
    ]),
  );
  const authorizedApplierIdentity = normalizeLocalRuntimeActorIdentity(
    input.authorized_applier_identity,
  );
  const gateTtlMs = normalizeGateTtlMs(input.gate_ttl_ms);
  const currentStateObservedAt = readVNextLocalRuntimeClockNowV01(
    input.clock,
    "current_state_observed_at",
  );
  const previewedAt = readVNextLocalRuntimeClockNowV01(
    input.clock,
    "previewed_at",
  );
  assertTimestampOrder(
    currentStateObservedAt,
    previewedAt,
    "semantic_commit_observation_after_preview",
  );
  return prepareVNextSemanticCommitPreviewAtV01(
    db,
    input,
    currentStateObservedAt,
    previewedAt,
    authorizedApplierIdentity,
    gateTtlMs,
    undefined,
  );
}

export function prepareVNextSemanticCommitPreviewWithOperatorPilotCapabilityV01(
  db: Database.Database,
  input: PrepareVNextSemanticCommitPreviewWithOperatorPilotCapabilityInputV01,
): VNextSemanticCommitPreviewV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  assertRuntimeInputKeys(
    input,
    new Set([
      "workspace_id",
      "project_id",
      "proposal_id",
      "proposal_fingerprint",
      "decision_id",
      "decision_fingerprint",
      "authorized_applier_identity",
      "review_window_capability",
      "clock",
    ]),
  );
  const capability = resolveOperatorPilotCapabilityForBinding(
    input.review_window_capability,
    input,
  );
  const authorizedApplierIdentity = normalizeLocalRuntimeActorIdentity(
    input.authorized_applier_identity,
  );
  const currentStateObservedAt = readVNextLocalRuntimeClockNowV01(
    input.clock,
    "current_state_observed_at",
  );
  const previewedAt = readVNextLocalRuntimeClockNowV01(
    input.clock,
    "previewed_at",
  );
  assertTimestampOrder(
    currentStateObservedAt,
    previewedAt,
    "semantic_commit_observation_after_preview",
  );
  const confirmationContextFingerprint =
    operatorPilotConfirmationContextFingerprint(capability, {
      ...input,
      previewed_at: previewedAt,
    });
  return prepareVNextSemanticCommitPreviewAtV01(
    db,
    input,
    currentStateObservedAt,
    previewedAt,
    authorizedApplierIdentity,
    normalizeGateTtlMs(
      capability.config.gate_ttl_ms,
      VNEXT_OPERATOR_PILOT_GATE_TTL_MAX_MS_V01,
    ),
    confirmationContextFingerprint,
  );
}

export function assertVNextSemanticCommitGateMatchesOperatorPilotCapabilityV01(
  gate: VNextSemanticCommitGateRecordV01,
  capability: VNextOperatorPilotReviewWindowCapabilityV01,
): void {
  const resolved = resolveOperatorPilotCapabilityForBinding(capability, gate);
  resolveGateTimingValidation(
    gate,
    { kind: "operator_pilot", capability: resolved },
    confirmationContextFingerprintFromBasis(
      gate.operator_confirmation_basis_refs,
    ),
  );
}

function prepareVNextSemanticCommitPreviewAtV01(
  db: Database.Database,
  input: Pick<
    PrepareVNextSemanticCommitPreviewInputV01,
    | "workspace_id"
    | "project_id"
    | "proposal_id"
    | "proposal_fingerprint"
    | "decision_id"
    | "decision_fingerprint"
  >,
  currentStateObservedAt: string,
  previewedAt: string,
  authorizedApplierIdentity: VNextLocalRuntimeActorIdentityV01,
  gateTtlMs: number,
  confirmationContextFingerprint?: string,
): VNextSemanticCommitPreviewV01 {
  const { proposal, decision } = loadReviewMaterial({ db, ...input });
  if (proposal.project_verify_lifecycle) {
    assertProjectVerifyLifecycleProposalFullCurrentHeadV01(db, proposal);
  }
  const transition = resolveTransitionMaterial(proposal, decision);
  const currentState = readCurrentStateSnapshot(
    db,
    proposal,
    transition.target_refs,
    currentStateObservedAt,
  );
  assertOperationRevisionCurrentState(
    proposal,
    decision,
    transition,
    currentState.observations,
    currentState.heads,
  );
  const intendedEffects = derivePreviewEffects({
    proposal,
    decision,
    transition,
    observations: currentState.observations,
    projections: currentState.projections,
    heads: currentState.heads,
    previewed_at: previewedAt,
  });
  const lineage = loadAppliedLineageFromStore(
    db,
    proposal,
    decision,
    currentState.observations,
  );
  const material = {
    preview_version: VNEXT_SEMANTIC_COMMIT_PREVIEW_VERSION_V01,
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
    proposal_id: proposal.proposal_id,
    proposal_fingerprint: proposal.integrity.fingerprint,
    decision_id: decision.decision_id,
    decision_fingerprint: decision.integrity.fingerprint,
    candidate_id: transition.source_candidate.candidate_id,
    candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(
      transition.source_candidate,
    ),
    intent_id: decision.requested_transition_intent!.intent_id,
    transition_kind: transition.transition_kind,
    authorized_applier_identity: authorizedApplierIdentity,
    gate_ttl_ms: gateTtlMs,
    previewed_at: previewedAt,
    current_state_observations: currentState.observations,
    intended_effects: intendedEffects,
    prior_review_decision_bindings: lineage.prior_review_decisions.map(
      (item) => ({
        record_id: item.decision_id,
        fingerprint: item.integrity.fingerprint,
      }),
    ),
    prior_state_transition_receipt_bindings:
      lineage.prior_state_transition_receipts.map((item) => ({
        record_id: item.transition_receipt_id,
        fingerprint: item.integrity.fingerprint,
      })),
  };
  return {
    ...material,
    confirmation_digest: createSemanticCommitConfirmationDigest(
      material,
      confirmationContextFingerprint,
    ),
    eligibility_input: null,
    eligibility: null,
  };
}

function assertOperationRevisionCurrentState(
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
  transition: ResolvedTransitionMaterialV01,
  observations: StateTransitionCurrentStateObservationV01[],
  heads: Array<VNextSemanticTargetHeadV01 | null>,
): void {
  const lifecycle = proposal.project_verify_lifecycle;
  if (lifecycle) {
    const binding = lifecycle.lifecycle_binding;
    const expected = lifecycle.current_head_expectation;
    const observation = observations[0];
    const head = heads[0] ?? null;
    if (
      transition.target_refs.length !== 1 ||
      !canonicalRefSetsEqual(transition.target_refs, [
        binding.family_target_ref,
      ]) ||
      !observation
    ) {
      throw new Error("semantic_commit_lifecycle_target_binding_mismatch");
    }
    if (expected.presence === "absent") {
      if (
        expected.revision !== 0 ||
        head !== null ||
        observation.presence !== "absent"
      ) {
        throw new Error("semantic_commit_lifecycle_current_head_stale");
      }
      return;
    }
    if (
      !head ||
      head.presence !== "present" ||
      observation.presence !== "present" ||
      head.revision !== expected.revision ||
      head.current_state_fingerprint !== expected.state_content_fingerprint ||
      head.source_transition_receipt_id !==
        expected.source_transition_receipt_id ||
      head.source_transition_receipt_fingerprint !==
        expected.source_transition_receipt_fingerprint ||
      observation.state_fingerprint !== expected.state_content_fingerprint
    ) {
      throw new Error("semantic_commit_lifecycle_current_head_stale");
    }
    return;
  }
  const revision = proposal.operation_revision;
  if (!revision) return;
  if (
    revision.revised_candidate.candidate_id !==
      decision.candidate.candidate_id ||
    revision.revised_candidate.candidate_fingerprint !==
      decision.candidate.candidate_fingerprint ||
    mapEpisodeDeltaCandidateOperationToTransitionOperationV01(
      revision.selected_operation,
    ) !== transition.operation ||
    revision.target_expectations.length !== transition.target_refs.length
  ) {
    throw new Error("semantic_commit_operation_revision_binding_mismatch");
  }
  const expectationByTarget = new Map(
    revision.target_expectations.map((expectation) => [
      canonicalizeProtocolValueV01(expectation.target_ref),
      expectation,
    ]),
  );
  transition.target_refs.forEach((targetRef, index) => {
    const expectation = expectationByTarget.get(
      canonicalizeProtocolValueV01(targetRef),
    );
    const observation = observations[index];
    const head = heads[index];
    const observedPresence =
      observation?.presence === "present" ? "present" : "absent";
    if (
      !expectation ||
      !observation ||
      expectation.presence !== observedPresence ||
      expectation.revision !== (head?.revision ?? 0) ||
      expectation.state_fingerprint !==
        (observation.presence === "present"
          ? observation.state_fingerprint
          : null) ||
      expectation.source_transition_receipt_id !==
        (head?.source_transition_receipt_id ?? null) ||
      expectation.source_transition_receipt_fingerprint !==
        (head?.source_transition_receipt_fingerprint ?? null)
    ) {
      throw new Error("semantic_commit_operation_revision_stale");
    }
  });
}

export function recordVNextSemanticCommitAuthorizationV01(
  input: RecordVNextSemanticCommitAuthorizationInputV01 & {
    db: Database.Database;
  },
): VNextSemanticCommitAuthorizationResultV01;
export function recordVNextSemanticCommitAuthorizationV01(
  db: Database.Database,
  input: RecordVNextSemanticCommitAuthorizationInputV01,
): VNextSemanticCommitAuthorizationResultV01;
export function recordVNextSemanticCommitAuthorizationV01(
  dbOrInput:
    | Database.Database
    | (RecordVNextSemanticCommitAuthorizationInputV01 & {
        db: Database.Database;
      }),
  maybeInput?: RecordVNextSemanticCommitAuthorizationInputV01,
): VNextSemanticCommitAuthorizationResultV01 {
  const { db, input } = unpackDbInput(dbOrInput, maybeInput);
  assertVNextDurableSemanticStoreSchemaV01(db);
  return withImmediateTransaction(db, () =>
    recordVNextSemanticCommitAuthorizationInsideTransactionV01(db, input),
  );
}

/**
 * Transaction-aware authorization entry point for an authenticated operator
 * action whose nonce rotation must commit or roll back with the gate record.
 * The caller owns the surrounding immediate transaction.
 */
export function recordVNextSemanticCommitAuthorizationInsideTransactionV01(
  db: Database.Database,
  input: RecordVNextSemanticCommitAuthorizationInputV01,
): VNextSemanticCommitAuthorizationResultV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  if (!db.inTransaction) {
    throw new Error("semantic_commit_authorization_transaction_required");
  }
  assertRuntimeInputKeys(
    input,
    new Set([
      "preview",
      "confirmation_digest",
      "operator_actor_ref",
      "operator_confirmation_basis_refs",
      "clock",
      "test_options",
    ]),
  );
  assertOperatorReviewWindowContextAbsent(
    input.operator_confirmation_basis_refs,
  );
  return recordVNextSemanticCommitAuthorizationInternalV01(db, input, {
    gate_ttl_maximum_ms: VNEXT_SEMANTIC_COMMIT_GATE_MAX_TTL_MS_V01,
    preview_max_age_ms: VNEXT_SEMANTIC_COMMIT_PREVIEW_MAX_AGE_MS_V01,
    confirmation_context_fingerprint: undefined,
    confirmation_context_ref: () => null,
  });
}

export function recordVNextSemanticCommitAuthorizationWithOperatorPilotCapabilityInsideTransactionV01(
  db: Database.Database,
  input: RecordVNextSemanticCommitAuthorizationWithOperatorPilotCapabilityInputV01,
): VNextSemanticCommitAuthorizationResultV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  if (!db.inTransaction) {
    throw new Error("semantic_commit_authorization_transaction_required");
  }
  assertRuntimeInputKeys(
    input,
    new Set([
      "preview",
      "confirmation_digest",
      "operator_actor_ref",
      "operator_confirmation_basis_refs",
      "review_window_capability",
      "clock",
      "test_options",
    ]),
  );
  assertOperatorReviewWindowContextAbsent(
    input.operator_confirmation_basis_refs,
  );
  const capability = resolveOperatorPilotCapabilityForBinding(
    input.review_window_capability,
    input.preview,
  );
  const confirmationContextFingerprint =
    operatorPilotConfirmationContextFingerprint(capability, input.preview);
  const { review_window_capability: _capability, ...authorizationInput } =
    input;
  return recordVNextSemanticCommitAuthorizationInternalV01(
    db,
    authorizationInput,
    {
      gate_ttl_maximum_ms: VNEXT_OPERATOR_PILOT_GATE_TTL_MAX_MS_V01,
      preview_max_age_ms: capability.config.preview_max_age_ms,
      confirmation_context_fingerprint: confirmationContextFingerprint,
      confirmation_context_ref: (confirmedAt) =>
        confirmationContextFingerprint === undefined
          ? null
          : createOperatorPilotConfirmationContextRef(
              capability,
              input.preview,
              confirmedAt,
            ),
    },
  );
}

function recordVNextSemanticCommitAuthorizationInternalV01(
  db: Database.Database,
  input: RecordVNextSemanticCommitAuthorizationInputV01,
  timing: {
    gate_ttl_maximum_ms: number;
    preview_max_age_ms: number;
    confirmation_context_fingerprint: string | undefined;
    confirmation_context_ref: (confirmed_at: string) => ExternalRefV01 | null;
  },
): VNextSemanticCommitAuthorizationResultV01 {
  const confirmedAt = readVNextLocalRuntimeClockNowV01(
    input.clock,
    "confirmed_at",
  );
  const gateEvaluatedAt = readVNextLocalRuntimeClockNowV01(
    input.clock,
    "gate_evaluated_at",
  );
  const eligibilityEvaluatedAt = readVNextLocalRuntimeClockNowV01(
    input.clock,
    "eligibility_evaluated_at",
  );
  const gateTtlMs = normalizeGateTtlMs(
    input.preview.gate_ttl_ms,
    timing.gate_ttl_maximum_ms,
  );
  const gateExpiresAt = addMillisecondsToTimestamp(
    gateEvaluatedAt,
    gateTtlMs,
    "gate_expires_at",
    timing.gate_ttl_maximum_ms,
  );
  const confirmationContextRef = timing.confirmation_context_ref(confirmedAt);
  const exactPreview = prepareVNextSemanticCommitPreviewAtV01(
    db,
    {
      workspace_id: input.preview.workspace_id,
      project_id: input.preview.project_id,
      proposal_id: input.preview.proposal_id,
      proposal_fingerprint: input.preview.proposal_fingerprint,
      decision_id: input.preview.decision_id,
      decision_fingerprint: input.preview.decision_fingerprint,
    },
    input.preview.current_state_observations[0]!.observed_at,
    input.preview.previewed_at,
    normalizeLocalRuntimeActorIdentity(
      input.preview.authorized_applier_identity,
    ),
    gateTtlMs,
    timing.confirmation_context_fingerprint,
  );
  if (
    canonicalizeProtocolValueV01(exactPreview) !==
      canonicalizeProtocolValueV01(input.preview) ||
    input.confirmation_digest !== exactPreview.confirmation_digest
  )
    throw new Error("semantic_commit_confirmation_digest_mismatch");
  const { proposal, decision } = loadReviewMaterial({
    db,
    ...input.preview,
  });
  assertExactRef(
    input.operator_actor_ref,
    decision.actor_ref,
    "operator_actor_mismatch",
  );
  const confirmationObservationRef = createRuntimeConfirmationRef(
    exactPreview,
    confirmedAt,
  );
  const authorizedApplierRef = createRuntimeAuthorizedApplierRef(
    exactPreview,
    gateEvaluatedAt,
  );
  assertSemanticCommitChronology({
    observations: exactPreview.current_state_observations,
    previewed_at: exactPreview.previewed_at,
    confirmed_at: confirmedAt,
    gate_evaluated_at: gateEvaluatedAt,
    eligibility_evaluated_at: eligibilityEvaluatedAt,
    gate_expires_at: gateExpiresAt,
  });
  assertPreviewConfirmationAge(
    exactPreview.previewed_at,
    confirmedAt,
    timing.preview_max_age_ms,
  );
  const gateRecordId = deriveSemanticCommitGateRecordId({
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
    decision_fingerprint: decision.integrity.fingerprint,
    confirmation_digest: input.confirmation_digest,
    confirmed_at: confirmedAt,
    authorized_applier_ref: authorizedApplierRef,
  });
  const gate = buildSemanticCommitGateEvaluation({
    preview: exactPreview,
    decision,
    confirmation_observation_ref: confirmationObservationRef,
    authorized_applier_ref: authorizedApplierRef,
    gate_record_id: gateRecordId,
    evaluated_at: gateEvaluatedAt,
    expires_at: gateExpiresAt,
  });
  const lineage = loadAppliedLineageFromStore(
    db,
    proposal,
    decision,
    exactPreview.current_state_observations,
  );
  const gateEligibilityInput = eligibilityInputFor(
    proposal,
    decision,
    exactPreview.current_state_observations,
    gate,
    eligibilityEvaluatedAt,
    lineage,
  );
  const gateEligibility =
    evaluateReviewDecisionStateTransitionEligibilityV01(gateEligibilityInput);
  if (gateEligibility.status !== "eligible") {
    throw new Error(
      `semantic_transition_not_eligible:${issueCodes(gateEligibility)}`,
    );
  }
  const confirmationBasisRefs = [
    ...(input.operator_confirmation_basis_refs ?? []),
    ...(confirmationContextRef ? [confirmationContextRef] : []),
  ];
  const gateRecord = buildGateRecord({
    gate_record_id: gateRecordId,
    preview: exactPreview,
    operator_actor_ref: input.operator_actor_ref,
    confirmation_observation_ref: confirmationObservationRef,
    operator_confirmation_basis_refs:
      confirmationBasisRefs.length > 0 ? confirmationBasisRefs : undefined,
    confirmed_at: confirmedAt,
    gate,
    eligibility_evaluated_at: eligibilityEvaluatedAt,
    eligibility_precondition_fingerprint:
      gateEligibility.precondition_fingerprint,
  });
  const write = insertVNextCoreRecordV01(db, {
    record_kind: "semantic_commit_gate",
    record_id: gateRecord.gate_record_id,
    workspace_id: gateRecord.workspace_id,
    project_id: gateRecord.project_id,
    fingerprint: gateRecord.integrity.fingerprint,
    idempotency_key: input.confirmation_digest,
    payload: gateRecord,
    created_at: confirmedAt,
  });
  runTestCheckpoint(input.test_options, "after_gate_record_insert");
  return {
    status: write.status,
    gate_record: gateRecord,
    eligibility_input: gateEligibilityInput,
    eligibility: gateEligibility,
  };
}

export function commitVNextSemanticTransitionV01(
  input: CommitVNextSemanticTransitionInputV01 & { db: Database.Database },
): VNextSemanticTransitionCommitResultV01;
export function commitVNextSemanticTransitionV01(
  db: Database.Database,
  input: CommitVNextSemanticTransitionInputV01,
): VNextSemanticTransitionCommitResultV01;
export function commitVNextSemanticTransitionV01(
  dbOrInput:
    | Database.Database
    | (CommitVNextSemanticTransitionInputV01 & { db: Database.Database }),
  maybeInput?: CommitVNextSemanticTransitionInputV01,
): VNextSemanticTransitionCommitResultV01 {
  const { db, input } = unpackDbInput(dbOrInput, maybeInput);
  assertVNextDurableSemanticStoreSchemaV01(db);
  return withImmediateTransaction(db, () =>
    commitVNextSemanticTransitionInsideTransactionV01(db, input),
  );
}

/**
 * Transaction-aware writer entry point for an authenticated operator action.
 * The caller owns the surrounding immediate transaction.
 */
export function commitVNextSemanticTransitionInsideTransactionV01(
  db: Database.Database,
  input: CommitVNextSemanticTransitionInputV01,
): VNextSemanticTransitionCommitResultV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  if (!db.inTransaction) {
    throw new Error("semantic_transition_commit_transaction_required");
  }
  assertCommitInputKeys(input, false);
  return commitVNextSemanticTransitionInternalV01(db, input, {
    kind: "generic",
  });
}

export function commitVNextSemanticTransitionWithOperatorPilotCapabilityInsideTransactionV01(
  db: Database.Database,
  input: CommitVNextSemanticTransitionWithOperatorPilotCapabilityInputV01,
): VNextSemanticTransitionCommitResultV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  if (!db.inTransaction) {
    throw new Error("semantic_transition_commit_transaction_required");
  }
  assertCommitInputKeys(input, true);
  const capability = resolveOperatorPilotCapabilityForBinding(
    input.review_window_capability,
    input,
  );
  const { review_window_capability: _capability, ...commitInput } = input;
  return commitVNextSemanticTransitionInternalV01(db, commitInput, {
    kind: "operator_pilot",
    capability,
  });
}

interface VNextSemanticTransitionValidationContextV01 {
  readonly validated_by_source: Map<
    string,
    ValidatedVNextSemanticTransitionRelationV01
  >;
  readonly active_source_keys: Set<string>;
  readonly max_cached_sources: number | null;
}

/**
 * Full Project Verify source-authenticity gate. The structural SR-2/state
 * validator is intentionally private to Transition assembly; this public gate
 * additionally traverses the exact prior proposal, ReviewDecision, semantic
 * gate, Transition receipt, persisted state, and family-head binding.
 */
export function assertProjectVerifyLifecycleProposalFullSourceBoundV01(
  db: Database.Database,
  proposal: EpisodeDeltaProposalV01,
): ProjectVerifyLifecycleStructuralSourceV01 {
  return assertProjectVerifyLifecycleProposalFullSourceBoundWithContextV01(
    db,
    proposal,
    createTransitionValidationContextV01(),
  );
}

export function assertProjectVerifyLifecycleProposalFullCurrentHeadV01(
  db: Database.Database,
  proposal: EpisodeDeltaProposalV01,
): ProjectVerifyLifecycleStructuralSourceV01 {
  const authenticated = assertProjectVerifyLifecycleProposalFullSourceBoundV01(
    db,
    proposal,
  );
  assertProjectVerifyLifecycleCurrentHeadStructuralOnlyV01(db, proposal);
  return authenticated;
}

function createTransitionValidationContextV01(
  maxCachedSources: number | null = null,
): VNextSemanticTransitionValidationContextV01 {
  return {
    validated_by_source: new Map(),
    active_source_keys: new Set(),
    max_cached_sources: maxCachedSources,
  };
}

export function loadValidatedVNextSemanticTransitionRelationV01(
  db: Database.Database,
  input: LoadValidatedVNextSemanticTransitionInputV01,
): ValidatedVNextSemanticTransitionRelationV01 {
  return loadValidatedVNextSemanticTransitionRelationWithContextV01(
    db,
    input,
    createTransitionValidationContextV01(),
  );
}

/**
 * Creates one synchronous, scope-bound loader for immutable Transition source
 * chains. Successful exact receipt validations share the same private context
 * so revisions with a common prior chain do not replay that chain repeatedly.
 * Callers must create a new loader for every top-level read; no mutable head,
 * gate expiry, missing source, or conflict result is cached here. After the
 * cache bound, additional sources are still fully validated but not memoized.
 */
export function createValidatedVNextSemanticTransitionRelationReadSessionV01(
  db: Database.Database,
  scope: { workspace_id: string; project_id: string },
): VNextSemanticTransitionRelationReadSessionV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const workspaceId = scope.workspace_id;
  const projectId = scope.project_id;
  const validationContext = createTransitionValidationContextV01(
    VNEXT_SEMANTIC_TRANSITION_READ_SESSION_MAX_CACHED_SOURCES_V01,
  );
  return (input) =>
    structuredClone(
      loadValidatedVNextSemanticTransitionRelationWithContextV01(
        db,
        {
          workspace_id: workspaceId,
          project_id: projectId,
          transition_receipt_id: input.transition_receipt_id,
          transition_receipt_fingerprint: input.transition_receipt_fingerprint,
        },
        validationContext,
      ),
    );
}

function loadValidatedVNextSemanticTransitionRelationWithContextV01(
  db: Database.Database,
  input: LoadValidatedVNextSemanticTransitionInputV01,
  validationContext: VNextSemanticTransitionValidationContextV01,
): ValidatedVNextSemanticTransitionRelationV01 {
  const sourceKey = canonicalizeProtocolValueV01({
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    transition_receipt_id: input.transition_receipt_id,
    transition_receipt_fingerprint: input.transition_receipt_fingerprint,
  });
  const cached = validationContext.validated_by_source.get(sourceKey);
  if (cached) return cached;
  if (validationContext.active_source_keys.has(sourceKey)) {
    throw new Error("persisted_transition_lineage_cycle");
  }
  validationContext.active_source_keys.add(sourceKey);
  try {
    assertVNextDurableSemanticStoreSchemaV01(db);
    const receiptRecord = readVNextCoreRecordV01(db, {
      record_kind: "state_transition_receipt",
      record_id: input.transition_receipt_id,
      workspace_id: input.workspace_id,
      project_id: input.project_id,
    });
    if (!receiptRecord) throw new Error("persisted_transition_receipt_missing");
    if (receiptRecord.fingerprint !== input.transition_receipt_fingerprint) {
      throw new Error("persisted_transition_receipt_fingerprint_mismatch");
    }
    const receiptValidation = validateStateTransitionReceiptV01(
      receiptRecord.payload,
    );
    if (receiptValidation.status !== "valid") {
      throw new Error("persisted_transition_receipt_invalid");
    }
    const receipt = receiptRecord.payload as StateTransitionReceiptV01;
    assertVNextCoreRecordMatchesProtocolPayloadBindingV01(receiptRecord, {
      workspace_id: receipt.workspace_id,
      project_id: receipt.project_id,
      fingerprint: receipt.integrity.fingerprint,
    });
    if (
      receiptRecord.record_id !== receipt.transition_receipt_id ||
      receiptRecord.idempotency_key !== receipt.idempotency_key ||
      receiptRecord.created_at !== receipt.recorded_at
    ) {
      throw new Error("persisted_transition_receipt_envelope_mismatch");
    }
    const { proposal, decision } = loadReviewMaterial(
      {
        db,
        workspace_id: input.workspace_id,
        project_id: input.project_id,
        proposal_id: receipt.source_proposal.proposal_id,
        proposal_fingerprint: receipt.source_proposal.proposal_fingerprint,
        decision_id: receipt.source_decision.decision_id,
        decision_fingerprint: receipt.source_decision.decision_fingerprint,
      },
      validationContext,
    );
    const gateRecordId =
      receipt.semantic_commit_gate.evaluation_ref.external_id;
    const gateEnvelope = readVNextCoreRecordV01(db, {
      record_kind: "semantic_commit_gate",
      record_id: gateRecordId,
      workspace_id: input.workspace_id,
      project_id: input.project_id,
    });
    if (!gateEnvelope)
      throw new Error("persisted_semantic_commit_gate_missing");
    const gateRecord = loadGateRecord(
      db,
      {
        workspace_id: input.workspace_id,
        project_id: input.project_id,
        proposal_id: proposal.proposal_id,
        proposal_fingerprint: proposal.integrity.fingerprint,
        decision_id: decision.decision_id,
        decision_fingerprint: decision.integrity.fingerprint,
        gate_record_id: gateRecordId,
        gate_record_fingerprint: gateEnvelope.fingerprint,
      },
      proposal,
      decision,
      {
        allow_historical_snapshot: true,
        validation: { kind: "historical_replay" },
      },
      validationContext,
    );
    const lineage = loadAppliedLineageFromStore(
      db,
      proposal,
      decision,
      gateRecord.current_state_observations,
      {
        prior_review_decision_bindings:
          gateRecord.prior_review_decision_bindings,
        prior_state_transition_receipt_bindings:
          gateRecord.prior_state_transition_receipt_bindings,
      },
      validationContext,
    );
    const eligibilityInput = eligibilityInputFor(
      proposal,
      decision,
      gateRecord.current_state_observations,
      gateRecord.semantic_commit_gate_evaluation,
      gateRecord.eligibility_evaluated_at,
      lineage,
    );
    const eligibility =
      evaluateReviewDecisionStateTransitionEligibilityV01(eligibilityInput);
    if (
      eligibility.status !== "eligible" ||
      eligibility.precondition_fingerprint !==
        gateRecord.eligibility_precondition_fingerprint
    ) {
      throw new Error("persisted_transition_eligibility_invalid");
    }
    assertValidReceiptRelation(eligibilityInput, receipt);
    const validated: ValidatedVNextSemanticTransitionRelationV01 = {
      proposal,
      decision,
      gate_record: gateRecord,
      receipt,
      eligibility_input: eligibilityInput,
      eligibility,
    };
    if (
      validationContext.max_cached_sources === null ||
      validationContext.validated_by_source.size <
        validationContext.max_cached_sources
    ) {
      validationContext.validated_by_source.set(sourceKey, validated);
    }
    return validated;
  } finally {
    validationContext.active_source_keys.delete(sourceKey);
  }
}

function assertProjectVerifyLifecycleProposalFullSourceBoundWithContextV01(
  db: Database.Database,
  proposal: EpisodeDeltaProposalV01,
  validationContext: VNextSemanticTransitionValidationContextV01,
): ProjectVerifyLifecycleStructuralSourceV01 {
  const authenticated = assertProjectVerifyLifecycleProposalStructuralOnlyV01(
    db,
    proposal,
  );
  const profile = authenticated.proposal.project_verify_lifecycle!;
  const expectation = profile.current_head_expectation;
  if (expectation.presence === "absent") return authenticated;

  const transition = loadValidatedVNextSemanticTransitionRelationWithContextV01(
    db,
    {
      workspace_id: profile.lifecycle_binding.workspace_id,
      project_id: profile.lifecycle_binding.project_id,
      transition_receipt_id: expectation.source_transition_receipt_id!,
      transition_receipt_fingerprint:
        expectation.source_transition_receipt_fingerprint!,
    },
    validationContext,
  );
  const priorBinding =
    transition.proposal.project_verify_lifecycle?.lifecycle_binding;
  const target = profile.lifecycle_binding.family_target_ref;
  const effects = transition.receipt.effects.filter(
    (effect) =>
      canonicalizeProtocolValueV01(effect.target_ref) ===
      canonicalizeProtocolValueV01(target),
  );
  const intended = transition.gate_record.intended_effects.filter(
    (effect) =>
      canonicalizeProtocolValueV01(effect.target_ref) ===
      canonicalizeProtocolValueV01(target),
  );
  const effect = effects[0];
  const candidate = transition.proposal.proposed_deltas.find(
    (item) =>
      item.candidate_id === priorBinding?.selected_candidate.candidate_id &&
      createEpisodeDeltaCandidateFingerprintV01(item) ===
        priorBinding.selected_candidate.candidate_fingerprint,
  );
  if (
    !priorBinding ||
    !candidate ||
    effects.length !== 1 ||
    intended.length !== 1 ||
    intended[0]?.expected_revision !== expectation.revision ||
    priorBinding.workspace_id !== profile.lifecycle_binding.workspace_id ||
    priorBinding.project_id !== profile.lifecycle_binding.project_id ||
    priorBinding.entity_kind !== profile.lifecycle_binding.entity_kind ||
    priorBinding.family_id !== profile.lifecycle_binding.family_id ||
    priorBinding.family_origin_fingerprint !==
      profile.lifecycle_binding.family_origin_fingerprint ||
    priorBinding.applicability_scope_fingerprint !==
      profile.lifecycle_binding.applicability_scope_fingerprint ||
    priorBinding.selected_record_revision !== expectation.revision ||
    canonicalizeProtocolValueV01(priorBinding.family_target_ref) !==
      canonicalizeProtocolValueV01(
        profile.lifecycle_binding.family_target_ref,
      ) ||
    canonicalizeProtocolValueV01(priorBinding.selected_record_ref) !==
      canonicalizeProtocolValueV01(expectation.selected_record_ref) ||
    canonicalizeProtocolValueV01(priorBinding.relation_endpoints) !==
      canonicalizeProtocolValueV01(
        profile.lifecycle_binding.relation_endpoints,
      ) ||
    !effect ||
    effect.after_state.presence !== "present" ||
    effect.after_state.state_fingerprint !==
      expectation.state_content_fingerprint
  ) {
    throw new Error("project_verify_lifecycle_prior_source_chain_conflict");
  }

  const stateEnvelope = readVNextCoreRecordV01(db, {
    record_kind: "semantic_state",
    record_id: effect.after_state.state_ref.external_id,
    workspace_id: profile.lifecycle_binding.workspace_id,
    project_id: profile.lifecycle_binding.project_id,
  });
  if (!stateEnvelope) {
    throw new Error("project_verify_lifecycle_prior_source_chain_conflict");
  }
  const state = rebuildVNextPersistedSemanticStateV01(stateEnvelope.payload);
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(stateEnvelope, {
    workspace_id: state.workspace_id,
    project_id: state.project_id,
    fingerprint: state.integrity.fingerprint,
  });
  assertProjectVerifyLifecyclePersistedStateSourceBoundWithContextV01(
    db,
    {
      state,
      transition_receipt_id: transition.receipt.transition_receipt_id,
      transition_receipt_fingerprint: transition.receipt.integrity.fingerprint,
    },
    validationContext,
  );
  if (
    stateEnvelope.record_id !== state.semantic_state_record_id ||
    stateEnvelope.created_at !== state.created_at ||
    canonicalizeProtocolValueV01(state.state_ref) !==
      canonicalizeProtocolValueV01(effect.after_state.state_ref) ||
    canonicalizeProtocolValueV01(
      state.state_content.project_verify_lifecycle_binding,
    ) !== canonicalizeProtocolValueV01(priorBinding) ||
    state.state_content_fingerprint !==
      intended[0]?.expected_after_state_fingerprint ||
    state.source_proposal_id !== transition.proposal.proposal_id ||
    state.source_proposal_fingerprint !==
      transition.proposal.integrity.fingerprint ||
    state.source_candidate_id !== candidate.candidate_id ||
    state.source_candidate_fingerprint !==
      createEpisodeDeltaCandidateFingerprintV01(candidate) ||
    state.source_decision_id !== transition.decision.decision_id ||
    state.source_decision_fingerprint !==
      transition.decision.integrity.fingerprint ||
    state.target_key !== deriveVNextSemanticTargetKeyV01(target) ||
    canonicalizeProtocolValueV01(state.target_ref) !==
      canonicalizeProtocolValueV01(target)
  ) {
    throw new Error("project_verify_lifecycle_prior_source_chain_conflict");
  }
  return authenticated;
}

function loadValidatedTransitionForLineageV01(
  db: Database.Database,
  input: LoadValidatedVNextSemanticTransitionInputV01,
  validationContext?: VNextSemanticTransitionValidationContextV01,
): ValidatedVNextSemanticTransitionRelationV01 {
  return validationContext
    ? loadValidatedVNextSemanticTransitionRelationWithContextV01(
        db,
        input,
        validationContext,
      )
    : loadValidatedVNextSemanticTransitionRelationV01(db, input);
}

/** Read-only, historical-snapshot validation for an authorized gate that may
 * not yet have a Transition receipt. It replays the exact proposal, decision,
 * current-state snapshot, prior applied lineage, and eligibility contract. */
export function loadValidatedVNextSemanticCommitGateRelationV01(
  db: Database.Database,
  input: LoadValidatedVNextSemanticCommitGateInputV01,
): ValidatedVNextSemanticCommitGateRelationV01 {
  assertVNextDurableSemanticStoreSchemaV01(db);
  const envelope = readVNextCoreRecordV01(db, {
    record_kind: "semantic_commit_gate",
    record_id: input.gate_record_id,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
  });
  if (!envelope) throw new Error("persisted_semantic_commit_gate_missing");
  if (envelope.fingerprint !== input.gate_record_fingerprint) {
    throw new Error("persisted_semantic_commit_gate_fingerprint_mismatch");
  }
  const snapshot = parseGateRecordPayload(envelope.payload);
  const { proposal, decision } = loadReviewMaterial({
    db,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    proposal_id: snapshot.proposal_id,
    proposal_fingerprint: snapshot.proposal_fingerprint,
    decision_id: snapshot.decision_id,
    decision_fingerprint: snapshot.decision_fingerprint,
  });
  const gateRecord = loadGateRecord(
    db,
    {
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      proposal_id: proposal.proposal_id,
      proposal_fingerprint: proposal.integrity.fingerprint,
      decision_id: decision.decision_id,
      decision_fingerprint: decision.integrity.fingerprint,
      gate_record_id: input.gate_record_id,
      gate_record_fingerprint: input.gate_record_fingerprint,
    },
    proposal,
    decision,
    {
      allow_historical_snapshot: true,
      validation: { kind: "historical_replay" },
    },
  );
  const lineage = loadAppliedLineageFromStore(
    db,
    proposal,
    decision,
    gateRecord.current_state_observations,
    {
      prior_review_decision_bindings: gateRecord.prior_review_decision_bindings,
      prior_state_transition_receipt_bindings:
        gateRecord.prior_state_transition_receipt_bindings,
    },
  );
  const eligibilityInput = eligibilityInputFor(
    proposal,
    decision,
    gateRecord.current_state_observations,
    gateRecord.semantic_commit_gate_evaluation,
    gateRecord.eligibility_evaluated_at,
    lineage,
  );
  const eligibility =
    evaluateReviewDecisionStateTransitionEligibilityV01(eligibilityInput);
  if (
    eligibility.status !== "eligible" ||
    eligibility.precondition_fingerprint !==
      gateRecord.eligibility_precondition_fingerprint
  ) {
    throw new Error("persisted_semantic_commit_gate_eligibility_invalid");
  }
  return {
    proposal,
    decision,
    gate_record: gateRecord,
    eligibility_input: eligibilityInput,
    eligibility,
  };
}

/**
 * Source-authenticates one persisted Project Verify state through the exact
 * immutable SR-2 record, lifecycle proposal/candidate, ReviewDecision, gate,
 * Transition receipt, and receipt effect. Structural state validation alone
 * cannot establish this source relation.
 */
export function assertProjectVerifyLifecyclePersistedStateSourceBoundV01(
  db: Database.Database,
  input: ProjectVerifyLifecyclePersistedStateSourceInputV01,
): ValidatedVNextSemanticTransitionRelationV01 {
  return assertProjectVerifyLifecyclePersistedStateSourceBoundWithContextV01(
    db,
    input,
    createTransitionValidationContextV01(),
  );
}

function assertProjectVerifyLifecyclePersistedStateSourceBoundWithContextV01(
  db: Database.Database,
  input: ProjectVerifyLifecyclePersistedStateSourceInputV01,
  validationContext: VNextSemanticTransitionValidationContextV01,
): ValidatedVNextSemanticTransitionRelationV01 {
  const binding = input.state.state_content.project_verify_lifecycle_binding;
  if (!binding) {
    throw new Error("persisted_project_verify_lifecycle_binding_missing");
  }
  const transition = loadValidatedVNextSemanticTransitionRelationWithContextV01(
    db,
    {
      workspace_id: input.state.workspace_id,
      project_id: input.state.project_id,
      transition_receipt_id: input.transition_receipt_id,
      transition_receipt_fingerprint: input.transition_receipt_fingerprint,
    },
    validationContext,
  );
  const profile = transition.proposal.project_verify_lifecycle;
  const candidate = transition.proposal.proposed_deltas.find(
    (item) =>
      item.candidate_id === binding.selected_candidate.candidate_id &&
      createEpisodeDeltaCandidateFingerprintV01(item) ===
        binding.selected_candidate.candidate_fingerprint,
  );
  const effects = transition.receipt.effects.filter(
    (item) =>
      canonicalizeProtocolValueV01(item.target_ref) ===
      canonicalizeProtocolValueV01(binding.family_target_ref),
  );
  const intendedEffects = transition.gate_record.intended_effects.filter(
    (item) =>
      canonicalizeProtocolValueV01(item.target_ref) ===
      canonicalizeProtocolValueV01(binding.family_target_ref),
  );
  const effect = effects[0];
  const intended = intendedEffects[0];
  if (
    !profile ||
    !candidate ||
    effects.length !== 1 ||
    intendedEffects.length !== 1 ||
    !intended ||
    intended.expected_revision !== binding.selected_record_revision ||
    intended.expected_after_state_fingerprint !==
      input.state.state_content_fingerprint ||
    canonicalizeProtocolValueV01(profile.lifecycle_binding) !==
      canonicalizeProtocolValueV01(binding) ||
    input.state.source_proposal_id !== transition.proposal.proposal_id ||
    input.state.source_proposal_fingerprint !==
      transition.proposal.integrity.fingerprint ||
    input.state.source_candidate_id !== candidate.candidate_id ||
    input.state.source_candidate_fingerprint !==
      createEpisodeDeltaCandidateFingerprintV01(candidate) ||
    input.state.source_decision_id !== transition.decision.decision_id ||
    input.state.source_decision_fingerprint !==
      transition.decision.integrity.fingerprint ||
    input.state.target_key !==
      deriveVNextSemanticTargetKeyV01(binding.family_target_ref) ||
    canonicalizeProtocolValueV01(input.state.target_ref) !==
      canonicalizeProtocolValueV01(binding.family_target_ref) ||
    !effect ||
    effect.after_state.presence !== "present" ||
    effect.after_state.state_fingerprint !==
      input.state.state_content_fingerprint ||
    canonicalizeProtocolValueV01(effect.after_state.state_ref) !==
      canonicalizeProtocolValueV01(input.state.state_ref)
  ) {
    throw new Error("persisted_project_verify_lifecycle_source_conflict");
  }
  return transition;
}

interface BuiltVNextSemanticTransitionV01 {
  receipt: StateTransitionReceiptV01;
  state_records: VNextPersistedSemanticStateVersionV01[];
}

type ResolvedCommitVNextSemanticTransitionInputV01 =
  CommitVNextSemanticTransitionInputV01 & {
    applied_at: string;
    recorded_at: string;
  };

function commitVNextSemanticTransitionInternalV01(
  db: Database.Database,
  input: CommitVNextSemanticTransitionInputV01,
  validation:
    | { kind: "generic" }
    | {
        kind: "operator_pilot";
        capability: VNextOperatorPilotReviewWindowCapabilityResolutionV01;
      },
): VNextSemanticTransitionCommitResultV01 {
  return (() => {
    const transactionNow = readVNextLocalRuntimeClockNowV01(
      input.clock,
      "applied_at",
    );
    const { proposal, decision } = loadReviewMaterial({ db, ...input });
    const transition = resolveTransitionMaterial(proposal, decision);
    const expectedIdempotency = transitionIdempotencyKey(decision);
    const existingReceiptRecord = readVNextCoreRecordByIdempotencyKeyV01(db, {
      record_kind: "state_transition_receipt",
      workspace_id: proposal.workspace_id,
      project_id: proposal.project_id,
      idempotency_key: expectedIdempotency,
    });
    if (proposal.project_verify_lifecycle && !existingReceiptRecord) {
      assertProjectVerifyLifecycleProposalFullCurrentHeadV01(db, proposal);
    }
    const gate = loadGateRecord(db, input, proposal, decision, {
      // The writer performs the authoritative live projection comparison below
      // in this same immediate transaction. Gate validation first rebuilds the
      // immutable authorized snapshot so exact replays remain possible.
      allow_historical_snapshot: true,
      validation:
        existingReceiptRecord !== undefined && existingReceiptRecord !== null
          ? { kind: "historical_replay" }
          : validation,
    });
    const lineage = loadAppliedLineageFromStore(
      db,
      proposal,
      decision,
      gate.current_state_observations,
      {
        prior_review_decision_bindings: gate.prior_review_decision_bindings,
        prior_state_transition_receipt_bindings:
          gate.prior_state_transition_receipt_bindings,
      },
    );
    const gateEligibilityInput = eligibilityInputFor(
      proposal,
      decision,
      gate.current_state_observations,
      gate.semantic_commit_gate_evaluation,
      gate.eligibility_evaluated_at,
      lineage,
    );
    const gateEligibility =
      evaluateReviewDecisionStateTransitionEligibilityV01(gateEligibilityInput);
    if (
      gateEligibility.status !== "eligible" ||
      gateEligibility.precondition_fingerprint !==
        gate.eligibility_precondition_fingerprint
    ) {
      throw new Error("semantic_commit_precondition_mismatch");
    }
    let appliedAt = transactionNow;
    let recordedAt: string;
    if (existingReceiptRecord) {
      const storedTimes = readStoredReceiptTimesForReplay(
        existingReceiptRecord,
      );
      appliedAt = storedTimes.applied_at;
      recordedAt = storedTimes.recorded_at;
    } else {
      assertNewApplicationWithinGate(gate, transactionNow);
      recordedAt = readVNextLocalRuntimeClockNowV01(input.clock, "recorded_at");
      assertTimestampOrder(appliedAt, recordedAt, "recorded_before_applied");
    }
    const built = buildAppliedTransitionMaterial({
      proposal,
      decision,
      transition,
      gate,
      eligibility: gateEligibility,
      applied_at: appliedAt,
      recorded_at: recordedAt,
    });
    if (built.receipt.idempotency_key !== expectedIdempotency) {
      throw new Error("transition_idempotency_mismatch");
    }
    assertValidReceiptRelation(gateEligibilityInput, built.receipt);

    if (existingReceiptRecord) {
      return validateAndReturnExactReplay({
        db,
        proposal,
        transition,
        gate,
        eligibility_input: gateEligibilityInput,
        eligibility: gateEligibility,
        existing_receipt_record: existingReceiptRecord,
        expected: built,
      });
    }

    const observedAt = gate.current_state_observations[0]?.observed_at;
    if (!observedAt) {
      throw new Error("semantic_commit_current_state_observation_missing");
    }
    const liveSnapshot = readCurrentStateSnapshot(
      db,
      proposal,
      transition.target_refs,
      observedAt,
    );
    if (
      canonicalizeProtocolValueV01(liveSnapshot.observations) !==
      canonicalizeProtocolValueV01(gate.current_state_observations)
    ) {
      throw new Error("semantic_commit_stale_current_state");
    }
    assertLiveLineageProjectionBindings(
      proposal,
      decision,
      liveSnapshot.projections,
      gate,
    );
    const liveLineage = loadAppliedLineageFromStore(
      db,
      proposal,
      decision,
      liveSnapshot.observations,
      {
        prior_review_decision_bindings: gate.prior_review_decision_bindings,
        prior_state_transition_receipt_bindings:
          gate.prior_state_transition_receipt_bindings,
      },
    );
    const eligibilityInput = eligibilityInputFor(
      proposal,
      decision,
      liveSnapshot.observations,
      gate.semantic_commit_gate_evaluation,
      gate.eligibility_evaluated_at,
      liveLineage,
    );
    const eligibility =
      evaluateReviewDecisionStateTransitionEligibilityV01(eligibilityInput);
    if (
      eligibility.status !== "eligible" ||
      eligibility.precondition_fingerprint !==
        gate.eligibility_precondition_fingerprint
    ) {
      throw new Error("semantic_commit_precondition_mismatch");
    }
    assertValidReceiptRelation(eligibilityInput, built.receipt);
    const projections = applyTransitionWrites({
      db,
      input: {
        ...input,
        applied_at: appliedAt,
        recorded_at: recordedAt,
      },
      proposal,
      transition,
      current_projections: liveSnapshot.projections,
      current_heads: liveSnapshot.heads,
      built,
    });
    return {
      status: "applied",
      semantic_state: built.state_records[0] ?? null,
      projection: projections[0] ?? null,
      transition_receipt: built.receipt,
      receipt: built.receipt,
      state_records: built.state_records,
      projection_entries: projections,
      eligibility_input: eligibilityInput,
      eligibility,
    };
  })();
}

function assertLiveLineageProjectionBindings(
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
  projections: Array<VNextSemanticStateProjectionEntryV01 | null>,
  gate: VNextSemanticCommitGateRecordV01,
): void {
  const lifecycleRevision =
    proposal.project_verify_lifecycle?.lifecycle_binding
      .selected_record_revision ?? 1;
  if (
    lifecycleRevision === 1 &&
    decision.decision !== "supersede" &&
    decision.decision !== "retract"
  ) {
    return;
  }
  if (gate.prior_state_transition_receipt_bindings.length !== 1) {
    throw new Error("semantic_commit_prior_receipt_binding_invalid");
  }
  const binding = gate.prior_state_transition_receipt_bindings[0]!;
  for (const projection of projections) {
    if (
      !projection ||
      projection.source_transition_receipt_id !== binding.record_id ||
      projection.source_transition_receipt_fingerprint !== binding.fingerprint
    ) {
      throw new Error("semantic_commit_prior_projection_lineage_mismatch");
    }
  }
}

function buildAppliedTransitionMaterial(input: {
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
  transition: ResolvedTransitionMaterialV01;
  gate: VNextSemanticCommitGateRecordV01;
  eligibility: StateTransitionEligibilityResultV01;
  applied_at: string;
  recorded_at: string;
}): BuiltVNextSemanticTransitionV01 {
  const expectedByTarget = new Map(
    input.eligibility.expected_effects.map((effect) => [
      canonicalizeProtocolValueV01(effect.target_ref),
      effect,
    ]),
  );
  if (expectedByTarget.size !== input.transition.target_refs.length) {
    throw new Error("semantic_commit_expected_effect_set_mismatch");
  }
  const stateRecords: VNextPersistedSemanticStateVersionV01[] = [];
  const proposalRef = protocolRef(
    "episode_delta_proposal",
    input.proposal.proposal_id,
    "derived_interpretation",
    input.proposal.created_at,
    input.proposal.integrity.fingerprint,
  );
  const decisionRef = protocolRef(
    "review_decision",
    input.decision.decision_id,
    "user_declaration",
    input.decision.decided_at,
    input.decision.integrity.fingerprint,
  );
  const effects: StateTransitionReceiptBuilderInputV01["effects"] = [];
  for (const targetRef of input.transition.target_refs) {
    const expected = expectedByTarget.get(
      canonicalizeProtocolValueV01(targetRef),
    );
    if (!expected) throw new Error("semantic_commit_expected_effect_missing");
    const stateRecord = input.transition.state_material_candidate
      ? buildVNextPersistedSemanticStateV01({
          proposal: input.proposal,
          candidate_id: input.transition.state_material_candidate.candidate_id,
          target_ref: targetRef,
          source_decision: {
            decision_id: input.decision.decision_id,
            decision_fingerprint: input.decision.integrity.fingerprint,
          },
          created_at: input.applied_at,
        })
      : null;
    const afterState = stateRecord
      ? {
          presence: "present" as const,
          state_ref: stateRecord.state_ref,
          state_fingerprint: stateRecord.state_content_fingerprint,
        }
      : {
          presence: "absent" as const,
          state_ref: null,
          state_fingerprint: null,
        };
    if (
      afterState.presence !== expected.expected_after_state.presence ||
      (afterState.presence === "present" &&
        expected.expected_after_state.presence === "present" &&
        afterState.state_fingerprint !==
          expected.expected_after_state.state_fingerprint)
    ) {
      throw new Error("semantic_commit_authorized_after_state_mismatch");
    }
    if (stateRecord) stateRecords.push(stateRecord);
    const applicationResult =
      createStateTransitionApplicationResultFingerprintV01(
        {
          target_ref: targetRef,
          operation: expected.operation,
          before_state: expected.before_state,
          after_state: afterState,
        },
        input.applied_at,
      );
    const proofIdentity = createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        decision_fingerprint: input.decision.integrity.fingerprint,
        target_ref: targetRef,
        operation: expected.operation,
      }),
    ).slice("sha256:".length, 31);
    const afterObservationRef = localRef(
      "semantic_state_application_observation",
      `semantic-transition-application:${proofIdentity}`,
      input.applied_at,
      applicationResult,
    );
    const durableRecordRef = localRef(
      stateRecord
        ? "durable_semantic_state_record"
        : "durable_state_transition_receipt_by_idempotency",
      stateRecord?.semantic_state_record_id ??
        transitionIdempotencyKey(input.decision),
      input.recorded_at,
      applicationResult,
    );
    effects.push({
      target_ref: targetRef,
      operation: expected.operation,
      before_state: expected.before_state,
      after_state: afterState,
      before_state_observation_ref: expected.before_state_observation_ref,
      after_application_observation_ref: afterObservationRef,
      durable_record_ref: durableRecordRef,
      source_refs: normalizeRefs([
        proposalRef,
        decisionRef,
        expected.before_state_observation_ref,
        input.gate.semantic_commit_gate_evaluation.evaluation_ref,
        ...expected.lineage_refs,
        afterObservationRef,
        durableRecordRef,
      ]),
    });
  }
  const receipt = buildStateTransitionReceiptV01({
    workspace_id: input.proposal.workspace_id,
    project_id: input.proposal.project_id,
    source_proposal: {
      proposal_version: input.proposal.proposal_version,
      proposal_id: input.proposal.proposal_id,
      proposal_fingerprint: input.proposal.integrity.fingerprint,
    },
    source_decision: {
      decision_version: input.decision.decision_version,
      decision_id: input.decision.decision_id,
      decision_fingerprint: input.decision.integrity.fingerprint,
    },
    source_candidate: input.decision.candidate,
    requested_transition_intent: {
      intent_id: input.decision.requested_transition_intent!.intent_id,
      transition_kind:
        input.decision.requested_transition_intent!.transition_kind,
      target_refs: input.decision.requested_transition_intent!.target_refs,
    },
    effects,
    applied_at: input.applied_at,
    recorded_at: input.recorded_at,
    applied_by_ref:
      input.gate.semantic_commit_gate_evaluation.authorized_applier_ref,
    semantic_commit_gate: {
      status: "authorized",
      evaluation_ref: input.gate.semantic_commit_gate_evaluation.evaluation_ref,
      evaluated_at: input.gate.semantic_commit_gate_evaluation.evaluated_at,
      expires_at: input.gate.semantic_commit_gate_evaluation.expires_at,
    },
    eligibility_precondition_fingerprint:
      input.eligibility.precondition_fingerprint,
    source_refs: normalizeRefs([
      proposalRef,
      decisionRef,
      input.gate.semantic_commit_gate_evaluation.evaluation_ref,
      input.gate.semantic_commit_gate_evaluation.authorized_applier_ref,
      ...input.eligibility.expected_effects.flatMap(
        (effect) => effect.lineage_refs,
      ),
    ]),
    compatibility: {
      source_contracts: [
        input.proposal.proposal_version,
        input.decision.decision_version,
      ],
      unmapped_fields: [],
      warnings: [
        "Local application observations do not authenticate the human identity behind the decision actor.",
      ],
      external_refs: [],
    },
    authority_notes: [
      "The injected local writer applied this receipt atomically; the receipt builder itself performed no write.",
    ],
  });
  return {
    receipt,
    state_records: stateRecords.sort((left, right) =>
      left.target_key < right.target_key
        ? -1
        : left.target_key > right.target_key
          ? 1
          : 0,
    ),
  };
}

function applyTransitionWrites(input: {
  db: Database.Database;
  input: ResolvedCommitVNextSemanticTransitionInputV01;
  proposal: EpisodeDeltaProposalV01;
  transition: ResolvedTransitionMaterialV01;
  current_projections: Array<VNextSemanticStateProjectionEntryV01 | null>;
  current_heads: Array<VNextSemanticTargetHeadV01 | null>;
  built: BuiltVNextSemanticTransitionV01;
}): VNextSemanticStateProjectionEntryV01[] {
  const stateByTarget = new Map(
    input.built.state_records.map((state) => [state.target_key, state]),
  );
  const effectByTarget = new Map(
    input.built.receipt.effects.map((effect) => [
      canonicalizeProtocolValueV01(effect.target_ref),
      effect,
    ]),
  );
  const resultingProjections: VNextSemanticStateProjectionEntryV01[] = [];
  let stateInsertCount = 0;
  let projectionWriteCount = 0;
  for (const [index, targetRef] of input.transition.target_refs.entries()) {
    if (index === 1) {
      runTestCheckpoint(input.input.test_options, "during_second_target");
    }
    const targetKey = deriveVNextSemanticTargetKeyV01(targetRef);
    const effect = effectByTarget.get(canonicalizeProtocolValueV01(targetRef));
    const current = input.current_projections[index] ?? null;
    const currentHead = input.current_heads[index] ?? null;
    if (!effect) throw new Error("semantic_commit_effect_missing");
    const stateRecord = stateByTarget.get(targetKey) ?? null;
    if (stateRecord) {
      insertVNextCoreRecordV01(input.db, {
        record_kind: "semantic_state",
        record_id: stateRecord.semantic_state_record_id,
        workspace_id: stateRecord.workspace_id,
        project_id: stateRecord.project_id,
        fingerprint: stateRecord.integrity.fingerprint,
        idempotency_key: null,
        payload: stateRecord,
        created_at: input.input.applied_at,
      });
      stateInsertCount += 1;
      if (stateInsertCount === 1) {
        runTestCheckpoint(
          input.input.test_options,
          "after_first_state_record_insert",
        );
      }
    }
    if (effect.operation === "retract") {
      if (!current || effect.before_state.presence !== "present") {
        throw new Error("semantic_commit_retract_current_state_mismatch");
      }
      deleteVNextSemanticStateEntryCasV01(input.db, {
        workspace_id: input.proposal.workspace_id,
        project_id: input.proposal.project_id,
        target_key: targetKey,
        expected_revision: current.revision,
        expected_state_fingerprint: current.state_fingerprint,
      });
    } else {
      if (!stateRecord || effect.after_state.presence !== "present") {
        throw new Error("semantic_commit_present_state_missing");
      }
      const candidate = input.transition.state_material_candidate;
      if (!candidate)
        throw new Error("semantic_commit_state_candidate_missing");
      const nextProjection: VNextSemanticStateProjectionEntryV01 = {
        workspace_id: input.proposal.workspace_id,
        project_id: input.proposal.project_id,
        presence: "present",
        target_key: targetKey,
        target_ref: normalizeExternalRefPrimitiveV01(targetRef),
        state_ref: stateRecord.state_ref,
        state_fingerprint: stateRecord.state_content_fingerprint,
        bounded_state_summary: stateRecord.bounded_state_summary,
        source_proposal_id: input.proposal.proposal_id,
        source_proposal_fingerprint: input.proposal.integrity.fingerprint,
        source_candidate_id: candidate.candidate_id,
        source_candidate_fingerprint:
          createEpisodeDeltaCandidateFingerprintV01(candidate),
        source_transition_receipt_id: input.built.receipt.transition_receipt_id,
        source_transition_receipt_fingerprint:
          input.built.receipt.integrity.fingerprint,
        revision: currentHead ? currentHead.revision + 1 : 1,
        updated_at: input.input.recorded_at,
      };
      if (effect.operation === "create") {
        if (current) throw new Error("semantic_commit_create_state_exists");
        insertVNextSemanticStateEntryV01(input.db, nextProjection);
      } else {
        if (!current || effect.before_state.presence !== "present") {
          throw new Error("semantic_commit_replace_current_state_missing");
        }
        updateVNextSemanticStateEntryCasV01(input.db, {
          expected_revision: current.revision,
          expected_state_fingerprint: current.state_fingerprint,
          next: nextProjection,
        });
      }
      resultingProjections.push(nextProjection);
    }
    const nextHead: VNextSemanticTargetHeadV01 = {
      workspace_id: input.proposal.workspace_id,
      project_id: input.proposal.project_id,
      target_key: targetKey,
      revision: currentHead ? currentHead.revision + 1 : 1,
      presence: effect.after_state.presence,
      current_state_fingerprint:
        effect.after_state.presence === "present"
          ? effect.after_state.state_fingerprint
          : null,
      source_transition_receipt_id: input.built.receipt.transition_receipt_id,
      source_transition_receipt_fingerprint:
        input.built.receipt.integrity.fingerprint,
      updated_at: input.input.recorded_at,
    };
    if (currentHead) {
      updateVNextSemanticTargetHeadCasV01(input.db, {
        expected: currentHead,
        next: nextHead,
      });
    } else {
      insertVNextSemanticTargetHeadV01(input.db, nextHead);
    }
    projectionWriteCount += 1;
    if (projectionWriteCount === 1) {
      runTestCheckpoint(
        input.input.test_options,
        "after_first_projection_write",
      );
    }
  }
  runTestCheckpoint(input.input.test_options, "before_receipt_insert");
  insertVNextCoreRecordV01(input.db, {
    record_kind: "state_transition_receipt",
    record_id: input.built.receipt.transition_receipt_id,
    workspace_id: input.built.receipt.workspace_id,
    project_id: input.built.receipt.project_id,
    fingerprint: input.built.receipt.integrity.fingerprint,
    idempotency_key: input.built.receipt.idempotency_key,
    payload: input.built.receipt,
    created_at: input.built.receipt.recorded_at,
  });
  runTestCheckpoint(
    input.input.test_options,
    "after_receipt_insert_before_commit",
  );
  return resultingProjections.sort((left, right) =>
    left.target_key < right.target_key
      ? -1
      : left.target_key > right.target_key
        ? 1
        : 0,
  );
}

function validateAndReturnExactReplay(input: {
  db: Database.Database;
  proposal: EpisodeDeltaProposalV01;
  transition: ResolvedTransitionMaterialV01;
  gate: VNextSemanticCommitGateRecordV01;
  eligibility_input: StateTransitionEligibilityEvaluationInputV01;
  eligibility: StateTransitionEligibilityResultV01;
  existing_receipt_record: VNextCoreRecordEnvelopeV01;
  expected: BuiltVNextSemanticTransitionV01;
}): VNextSemanticTransitionCommitResultV01 {
  const receiptValidation = validateStateTransitionReceiptV01(
    input.existing_receipt_record.payload,
  );
  if (receiptValidation.status !== "valid") {
    throw new Error("conflicting_result");
  }
  const storedReceipt = input.existing_receipt_record
    .payload as StateTransitionReceiptV01;
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(
    input.existing_receipt_record,
    {
      workspace_id: storedReceipt.workspace_id,
      project_id: storedReceipt.project_id,
      fingerprint: storedReceipt.integrity.fingerprint,
    },
  );
  if (
    input.existing_receipt_record.record_id !==
      storedReceipt.transition_receipt_id ||
    input.existing_receipt_record.idempotency_key !==
      storedReceipt.idempotency_key ||
    input.existing_receipt_record.created_at !== storedReceipt.recorded_at
  ) {
    throw new Error("conflicting_result");
  }
  const replay = compareStateTransitionReceiptReplayCompatibilityV01(
    storedReceipt,
    input.expected.receipt,
  );
  if (
    replay.status !== "exact_replay" ||
    canonicalizeProtocolValueV01(storedReceipt) !==
      canonicalizeProtocolValueV01(input.expected.receipt)
  ) {
    throw new Error("conflicting_result");
  }
  assertValidReceiptRelation(input.eligibility_input, storedReceipt);
  const expectedStateByTarget = new Map(
    input.expected.state_records.map((state) => [state.target_key, state]),
  );
  const intendedEffectByTarget = new Map(
    input.gate.intended_effects.map((effect) => [
      canonicalizeProtocolValueV01(effect.target_ref),
      effect,
    ]),
  );
  const states: VNextPersistedSemanticStateVersionV01[] = [];
  const projections: VNextSemanticStateProjectionEntryV01[] = [];
  for (const effect of storedReceipt.effects) {
    const targetKey = deriveVNextSemanticTargetKeyV01(effect.target_ref);
    const intended = intendedEffectByTarget.get(
      canonicalizeProtocolValueV01(effect.target_ref),
    );
    const current = readVNextSemanticStateEntryV01(input.db, {
      workspace_id: input.proposal.workspace_id,
      project_id: input.proposal.project_id,
      target_key: targetKey,
    });
    const head = readVNextSemanticTargetHeadV01(input.db, {
      workspace_id: input.proposal.workspace_id,
      project_id: input.proposal.project_id,
      target_key: targetKey,
    });
    if (
      !intended ||
      !head ||
      head.revision !== intended.expected_revision ||
      head.presence !== effect.after_state.presence ||
      head.current_state_fingerprint !== effect.after_state.state_fingerprint ||
      head.source_transition_receipt_id !==
        storedReceipt.transition_receipt_id ||
      head.source_transition_receipt_fingerprint !==
        storedReceipt.integrity.fingerprint ||
      head.updated_at !== storedReceipt.recorded_at
    ) {
      throw new Error("state_replay_conflict");
    }
    if (effect.after_state.presence === "absent") {
      if (current) throw new Error("state_replay_conflict");
      continue;
    }
    const stateCandidate = input.transition.state_material_candidate;
    if (
      !current ||
      !intended ||
      !stateCandidate ||
      current.revision !== intended.expected_revision ||
      current.presence !== "present" ||
      current.target_key !== targetKey ||
      current.source_proposal_id !== input.proposal.proposal_id ||
      current.source_proposal_fingerprint !==
        input.proposal.integrity.fingerprint ||
      current.source_candidate_id !== stateCandidate.candidate_id ||
      current.source_candidate_fingerprint !==
        createEpisodeDeltaCandidateFingerprintV01(stateCandidate) ||
      current.source_transition_receipt_id !==
        storedReceipt.transition_receipt_id ||
      current.source_transition_receipt_fingerprint !==
        storedReceipt.integrity.fingerprint ||
      current.state_fingerprint !== effect.after_state.state_fingerprint ||
      canonicalizeProtocolValueV01(current.state_ref) !==
        canonicalizeProtocolValueV01(effect.after_state.state_ref) ||
      canonicalizeProtocolValueV01(current.target_ref) !==
        canonicalizeProtocolValueV01(effect.target_ref) ||
      current.updated_at !== storedReceipt.recorded_at
    ) {
      throw new Error("state_replay_conflict");
    }
    const expectedState = expectedStateByTarget.get(targetKey);
    if (
      !expectedState ||
      current.bounded_state_summary !== expectedState.bounded_state_summary
    ) {
      throw new Error("state_replay_conflict");
    }
    let stateRecord: VNextCoreRecordEnvelopeV01 | null = null;
    let rebuiltState: VNextPersistedSemanticStateVersionV01 | null = null;
    try {
      stateRecord = readVNextCoreRecordV01(input.db, {
        record_kind: "semantic_state",
        record_id: expectedState.semantic_state_record_id,
        workspace_id: input.proposal.workspace_id,
        project_id: input.proposal.project_id,
      });
      if (!stateRecord) throw new Error("semantic_state_record_missing");
      rebuiltState = rebuildVNextPersistedSemanticStateV01(stateRecord.payload);
      assertVNextCoreRecordMatchesProtocolPayloadBindingV01(stateRecord, {
        workspace_id: rebuiltState.workspace_id,
        project_id: rebuiltState.project_id,
        fingerprint: rebuiltState.integrity.fingerprint,
      });
    } catch {
      throw new Error("state_replay_conflict");
    }
    if (
      !stateRecord ||
      !rebuiltState ||
      stateRecord.record_id !== rebuiltState.semantic_state_record_id ||
      stateRecord.created_at !== rebuiltState.created_at ||
      canonicalizeProtocolValueV01(rebuiltState) !==
        canonicalizeProtocolValueV01(expectedState)
    ) {
      throw new Error("state_replay_conflict");
    }
    states.push(rebuiltState);
    projections.push(current);
  }
  return {
    status: "exact_replay",
    semantic_state: states[0] ?? null,
    projection: projections[0] ?? null,
    transition_receipt: storedReceipt,
    receipt: storedReceipt,
    state_records: states.sort((left, right) =>
      left.target_key < right.target_key
        ? -1
        : left.target_key > right.target_key
          ? 1
          : 0,
    ),
    projection_entries: projections.sort((left, right) =>
      left.target_key < right.target_key
        ? -1
        : left.target_key > right.target_key
          ? 1
          : 0,
    ),
    eligibility_input: input.eligibility_input,
    eligibility: input.eligibility,
  };
}

function readStoredReceiptTimesForReplay(record: VNextCoreRecordEnvelopeV01): {
  applied_at: string;
  recorded_at: string;
} {
  const validation = validateStateTransitionReceiptV01(record.payload);
  if (validation.status !== "valid") throw new Error("conflicting_result");
  const receipt = record.payload as StateTransitionReceiptV01;
  assertTimestamp(receipt.applied_at, "stored_receipt_applied_at");
  assertTimestamp(receipt.recorded_at, "stored_receipt_recorded_at");
  return {
    applied_at: receipt.applied_at,
    recorded_at: receipt.recorded_at,
  };
}

function assertNewApplicationWithinGate(
  gate: VNextSemanticCommitGateRecordV01,
  now: string,
): void {
  const nowValue = parseStrictIsoTimestampV01(now);
  const evaluatedAt = parseStrictIsoTimestampV01(
    gate.semantic_commit_gate_evaluation.evaluated_at,
  );
  const expiresAt = parseStrictIsoTimestampV01(
    gate.semantic_commit_gate_evaluation.expires_at,
  );
  if (nowValue === null || evaluatedAt === null || expiresAt === null) {
    throw new Error("semantic_commit_gate_runtime_time_invalid");
  }
  if (nowValue < evaluatedAt) {
    throw new Error("semantic_commit_application_precedes_gate");
  }
  if (nowValue > expiresAt) {
    throw new Error("semantic_commit_gate_expired");
  }
}

function assertValidReceiptRelation(
  eligibilityInput: StateTransitionEligibilityEvaluationInputV01,
  receipt: StateTransitionReceiptV01,
): void {
  if (validateStateTransitionReceiptV01(receipt).status !== "valid") {
    throw new Error("state_transition_receipt_invalid");
  }
  const relation = validateStateTransitionReceiptAgainstEligibilityV01({
    ...eligibilityInput,
    receipt,
  });
  if (relation.status !== "valid") {
    throw new Error(
      `state_transition_receipt_relation_invalid:${issueCodes(relation)}`,
    );
  }
}
function assertProposalDecision(
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
): void {
  const proposalValidation = validateEpisodeDeltaProposalV01(proposal);
  if (proposalValidation.status !== "valid")
    throw new Error("episode_delta_proposal_invalid");
  const decisionValidation = validateReviewDecisionV01(decision);
  if (decisionValidation.status !== "valid")
    throw new Error("review_decision_invalid");
  const relation = validateReviewDecisionAgainstEpisodeDeltaProposalV01(
    decision,
    proposal,
  );
  if (relation.status !== "valid")
    throw new Error("review_decision_proposal_relation_invalid");
}

function loadReviewMaterial(
  input: {
    db: Database.Database;
    workspace_id: string;
    project_id: string;
    proposal_id: string;
    proposal_fingerprint: string;
    decision_id: string;
    decision_fingerprint: string;
  },
  validationContext = createTransitionValidationContextV01(),
): {
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
} {
  const proposalRecord = readVNextCoreRecordV01(input.db, {
    record_kind: "episode_delta_proposal",
    record_id: input.proposal_id,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
  });
  const decisionRecord = readVNextCoreRecordV01(input.db, {
    record_kind: "review_decision",
    record_id: input.decision_id,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
  });
  if (!proposalRecord) throw new Error("persisted_proposal_missing");
  if (!decisionRecord) throw new Error("persisted_decision_missing");
  if (proposalRecord.fingerprint !== input.proposal_fingerprint)
    throw new Error("persisted_proposal_fingerprint_mismatch");
  if (decisionRecord.fingerprint !== input.decision_fingerprint)
    throw new Error("persisted_decision_fingerprint_mismatch");
  const proposal = proposalRecord.payload as EpisodeDeltaProposalV01;
  const decision = decisionRecord.payload as ReviewDecisionV01;
  if (proposal.source_assessment) {
    try {
      assertPersistedRunAssessmentProposalSourceBoundV01(input.db, proposal);
    } catch {
      throw new Error("persisted_proposal_relation_source_conflict");
    }
  }
  if (proposal.project_verify_lifecycle) {
    try {
      const binding = proposal.project_verify_lifecycle.lifecycle_binding;
      const admitted = readProjectVerifyLifecycleProposalStructuralOnlyV01(
        input.db,
        deriveProjectVerifyLifecycleProposalAdmissionIdentityV01({
          workspace_id: binding.workspace_id,
          project_id: binding.project_id,
          entity_kind: binding.entity_kind,
          family_id: binding.family_id,
          selected_record_ref: binding.selected_record_ref,
        }),
      );
      if (
        !admitted ||
        canonicalizeProtocolValueV01(admitted.record) !==
          canonicalizeProtocolValueV01(proposalRecord) ||
        canonicalizeProtocolValueV01(admitted.proposal) !==
          canonicalizeProtocolValueV01(proposal)
      ) {
        throw new Error(
          "project_verify_lifecycle_proposal_canonical_admission_required",
        );
      }
      assertProjectVerifyLifecycleProposalFullSourceBoundWithContextV01(
        input.db,
        admitted.proposal,
        validationContext,
      );
    } catch {
      throw new Error("persisted_project_verify_lifecycle_source_conflict");
    }
  }
  assertProposalDecision(proposal, decision);
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(proposalRecord, {
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
    fingerprint: proposal.integrity.fingerprint,
  });
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(decisionRecord, {
    workspace_id: decision.workspace_id,
    project_id: decision.project_id,
    fingerprint: decision.integrity.fingerprint,
  });
  if (
    proposalRecord.record_id !== proposal.proposal_id ||
    decisionRecord.record_id !== decision.decision_id ||
    proposalRecord.created_at !== proposal.created_at ||
    decisionRecord.created_at !== decision.decided_at
  ) {
    throw new Error("persisted_review_material_identity_mismatch");
  }
  return { proposal, decision };
}

interface ResolvedTransitionMaterialV01 {
  source_candidate: EpisodeDeltaProposalDeltaCandidateV01;
  state_material_candidate: EpisodeDeltaProposalDeltaCandidateV01 | null;
  transition_kind: Exclude<ReviewDecisionRequestedTransitionKindV01, "other">;
  operation: StateTransitionReceiptOperationV01 | null;
  target_refs: ExternalRefV01[];
}

interface PersistedCurrentStateSnapshotV01 {
  observations: StateTransitionCurrentStateObservationV01[];
  projections: Array<VNextSemanticStateProjectionEntryV01 | null>;
  heads: Array<VNextSemanticTargetHeadV01 | null>;
}

interface LoadedAppliedLineageV01 {
  prior_review_decisions: ReviewDecisionV01[];
  prior_state_transition_receipts: StateTransitionReceiptV01[];
}

function resolveTransitionMaterial(
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
): ResolvedTransitionMaterialV01 {
  const expectedKind =
    decision.decision === "accept"
      ? "semantic_candidate_apply"
      : decision.decision === "supersede"
        ? "semantic_candidate_supersede"
        : decision.decision === "retract"
          ? "semantic_candidate_retract"
          : null;
  const intent = decision.requested_transition_intent;
  if (!expectedKind || !intent || intent.transition_kind !== expectedKind) {
    throw new Error("semantic_commit_transition_intent_invalid");
  }
  const sourceCandidate = proposal.proposed_deltas.find(
    (item) => item.candidate_id === decision.candidate.candidate_id,
  );
  if (
    !sourceCandidate ||
    createEpisodeDeltaCandidateFingerprintV01(sourceCandidate) !==
      decision.candidate.candidate_fingerprint
  ) {
    throw new Error("semantic_commit_source_candidate_mismatch");
  }
  let stateMaterialCandidate: EpisodeDeltaProposalDeltaCandidateV01 | null =
    sourceCandidate;
  let operation: StateTransitionReceiptOperationV01 | null;
  if (decision.decision === "accept") {
    const mapped = mapEpisodeDeltaCandidateOperationToTransitionOperationV01(
      sourceCandidate.operation,
    );
    if (!mapped) {
      throw new Error("semantic_commit_candidate_operation_not_transitionable");
    }
    operation =
      !proposal.source_assessment &&
      !proposal.operation_revision &&
      sourceCandidate.operation === "add"
        ? null
        : mapped;
    if (mapped === "retract") stateMaterialCandidate = null;
  } else if (decision.decision === "supersede") {
    operation = "supersede";
  } else {
    operation = "retract";
  }
  if (decision.decision === "supersede") {
    const superseding = decision.lineage.superseding_candidate;
    stateMaterialCandidate = superseding
      ? (proposal.proposed_deltas.find(
          (item) => item.candidate_id === superseding.candidate_id,
        ) ?? null)
      : null;
    if (
      !stateMaterialCandidate ||
      !superseding ||
      createEpisodeDeltaCandidateFingerprintV01(stateMaterialCandidate) !==
        superseding.candidate_fingerprint
    ) {
      throw new Error("semantic_commit_superseding_candidate_mismatch");
    }
  } else if (decision.decision === "retract") {
    stateMaterialCandidate = null;
  }
  const targetRefs = normalizeRefs(intent.target_refs);
  const targetKeys = targetRefs.map(deriveVNextSemanticTargetKeyV01);
  if (
    targetRefs.length === 0 ||
    targetRefs.length > 64 ||
    new Set(targetKeys).size !== targetKeys.length ||
    !canonicalRefSetsEqual(
      targetRefs,
      (stateMaterialCandidate ?? sourceCandidate).target_refs,
    )
  ) {
    throw new Error(
      new Set(targetKeys).size !== targetKeys.length
        ? "semantic_commit_duplicate_target_key"
        : "semantic_commit_target_set_mismatch",
    );
  }
  if (
    decision.decision === "supersede" &&
    !canonicalRefSetsEqual(sourceCandidate.target_refs, targetRefs)
  ) {
    throw new Error("semantic_commit_supersede_target_set_mismatch");
  }
  if (
    targetRefs.some(
      (target) =>
        target.compatibility_namespace ===
        PROJECT_VERIFY_LIFECYCLE_TARGET_NAMESPACE_V01,
    ) !== Boolean(proposal.project_verify_lifecycle)
  ) {
    throw new Error("semantic_commit_lifecycle_target_authority_conflict");
  }
  return {
    source_candidate: sourceCandidate,
    state_material_candidate: stateMaterialCandidate,
    transition_kind: expectedKind,
    operation,
    target_refs: targetRefs,
  };
}

function readCurrentStateSnapshot(
  db: Database.Database,
  proposal: EpisodeDeltaProposalV01,
  targetRefs: ExternalRefV01[],
  observedAt: string,
): PersistedCurrentStateSnapshotV01 {
  const observations: StateTransitionCurrentStateObservationV01[] = [];
  const projections: Array<VNextSemanticStateProjectionEntryV01 | null> = [];
  const heads: Array<VNextSemanticTargetHeadV01 | null> = [];
  for (const targetRef of targetRefs) {
    const targetKey = deriveVNextSemanticTargetKeyV01(targetRef);
    const projection = readVNextSemanticStateEntryV01(db, {
      workspace_id: proposal.workspace_id,
      project_id: proposal.project_id,
      target_key: targetKey,
    });
    const head = readVNextSemanticTargetHeadV01(db, {
      workspace_id: proposal.workspace_id,
      project_id: proposal.project_id,
      target_key: targetKey,
    });
    assertCurrentStateStorageCoherence(
      db,
      proposal.workspace_id,
      proposal.project_id,
      targetRef,
      targetKey,
      projection,
      head,
    );
    projections.push(projection);
    heads.push(head);
    observations.push(
      projection
        ? createPresentObservation(
            proposal.workspace_id,
            proposal.project_id,
            targetRef,
            targetKey,
            projection,
            head!,
            observedAt,
          )
        : createAbsentObservation(
            proposal.workspace_id,
            proposal.project_id,
            targetRef,
            targetKey,
            head,
            observedAt,
          ),
    );
  }
  return { observations, projections, heads };
}

function derivePreviewEffects(input: {
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
  transition: ResolvedTransitionMaterialV01;
  observations: StateTransitionCurrentStateObservationV01[];
  projections: Array<VNextSemanticStateProjectionEntryV01 | null>;
  heads: Array<VNextSemanticTargetHeadV01 | null>;
  expected_revisions?: number[];
  previewed_at: string;
}): VNextSemanticCommitPreviewEffectV01[] {
  return input.transition.target_refs.map((targetRef, index) => {
    const observation = input.observations[index];
    const head = input.heads[index];
    if (!observation) throw new Error("semantic_commit_current_state_missing");
    const operation =
      input.transition.operation ??
      (observation.presence === "absent" ? "create" : "replace");
    if (operation === "create" && observation.presence !== "absent") {
      throw new Error("semantic_commit_create_requires_absent_state");
    }
    if (operation !== "create" && observation.presence !== "present") {
      throw new Error(
        operation === "replace"
          ? "semantic_commit_replace_requires_present_state"
          : operation === "supersede"
            ? "semantic_commit_supersede_requires_present_state"
            : "semantic_commit_retract_requires_present_state",
      );
    }
    const afterFingerprint = input.transition.state_material_candidate
      ? buildVNextPersistedSemanticStateV01({
          proposal: input.proposal,
          candidate_id: input.transition.state_material_candidate.candidate_id,
          target_ref: targetRef,
          source_decision: {
            decision_id: input.decision.decision_id,
            decision_fingerprint: input.decision.integrity.fingerprint,
          },
          created_at: input.previewed_at,
        }).state_content_fingerprint
      : null;
    const expectedRevision =
      input.expected_revisions?.[index] ?? (head ? head.revision + 1 : 1);
    if (
      !Number.isSafeInteger(expectedRevision) ||
      expectedRevision < 1 ||
      (observation.presence === "absent" &&
        expectedRevision !== (head ? head.revision + 1 : 1)) ||
      (observation.presence === "present" && expectedRevision < 2)
    ) {
      throw new Error("semantic_commit_expected_revision_invalid");
    }
    return {
      target_ref: normalizeExternalRefPrimitiveV01(targetRef),
      target_key: deriveVNextSemanticTargetKeyV01(targetRef),
      operation,
      before_presence:
        observation.presence === "present" ? "present" : "absent",
      before_state_fingerprint:
        observation.presence === "present"
          ? observation.state_fingerprint
          : null,
      expected_after_state_fingerprint: afterFingerprint,
      expected_revision: expectedRevision,
    };
  });
}

function loadAppliedLineageFromStore(
  db: Database.Database,
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
  observations: StateTransitionCurrentStateObservationV01[],
  expectedBindings?: {
    prior_review_decision_bindings: VNextSemanticCommitLineageBindingV01[];
    prior_state_transition_receipt_bindings: VNextSemanticCommitLineageBindingV01[];
  },
  validationContext?: VNextSemanticTransitionValidationContextV01,
): LoadedAppliedLineageV01 {
  if (proposal.project_verify_lifecycle) {
    return loadProjectVerifyLifecycleAppliedLineageFromStoreV01(
      db,
      proposal,
      decision,
      observations,
      expectedBindings,
      validationContext,
    );
  }
  const sourceCandidate = proposal.proposed_deltas.find(
    (candidate) =>
      candidate.candidate_id === decision.candidate.candidate_id &&
      createEpisodeDeltaCandidateFingerprintV01(candidate) ===
        decision.candidate.candidate_fingerprint,
  );
  const acceptedOperation =
    decision.decision === "accept" &&
    proposal.operation_revision &&
    sourceCandidate
      ? mapEpisodeDeltaCandidateOperationToTransitionOperationV01(
          sourceCandidate.operation,
        )
      : null;
  if (
    decision.decision === "accept" &&
    (acceptedOperation === "supersede" || acceptedOperation === "retract")
  ) {
    const revision = proposal.operation_revision;
    const bindings = revision
      ? uniqueProtocolValuesV01(
          revision.target_expectations.map((expectation) => ({
            record_id: expectation.source_transition_receipt_id,
            fingerprint: expectation.source_transition_receipt_fingerprint,
          })),
        )
      : [];
    const binding = bindings.length === 1 ? bindings[0] : null;
    if (!binding?.record_id || !binding.fingerprint) {
      throw new Error("semantic_commit_operation_revision_lineage_missing");
    }
    if (
      expectedBindings &&
      (expectedBindings.prior_state_transition_receipt_bindings.length !== 1 ||
        expectedBindings.prior_state_transition_receipt_bindings[0]
          ?.record_id !== binding.record_id ||
        expectedBindings.prior_state_transition_receipt_bindings[0]
          ?.fingerprint !== binding.fingerprint)
    ) {
      throw new Error("semantic_commit_operation_revision_lineage_mismatch");
    }
    const prior = loadValidatedTransitionForLineageV01(
      db,
      {
        workspace_id: proposal.workspace_id,
        project_id: proposal.project_id,
        transition_receipt_id: binding.record_id,
        transition_receipt_fingerprint: binding.fingerprint,
      },
      validationContext,
    );
    if (
      expectedBindings &&
      (expectedBindings.prior_review_decision_bindings.length !== 1 ||
        expectedBindings.prior_review_decision_bindings[0]?.record_id !==
          prior.decision.decision_id ||
        expectedBindings.prior_review_decision_bindings[0]?.fingerprint !==
          prior.decision.integrity.fingerprint)
    ) {
      throw new Error("semantic_commit_operation_revision_decision_mismatch");
    }
    return {
      prior_review_decisions: [prior.decision],
      prior_state_transition_receipts: [prior.receipt],
    };
  }
  if (decision.decision !== "supersede" && decision.decision !== "retract") {
    if (
      expectedBindings &&
      (expectedBindings.prior_review_decision_bindings.length > 0 ||
        expectedBindings.prior_state_transition_receipt_bindings.length > 0)
    ) {
      throw new Error("semantic_commit_unexpected_lineage_bindings");
    }
    return {
      prior_review_decisions: [],
      prior_state_transition_receipts: [],
    };
  }
  const declaredBindings = decision.lineage.prior_decisions;
  if (declaredBindings.length !== 1) {
    throw new Error("semantic_commit_prior_decision_binding_invalid");
  }
  const declared = declaredBindings[0]!;
  if (
    expectedBindings &&
    canonicalizeProtocolValueV01(
      expectedBindings.prior_review_decision_bindings,
    ) !==
      canonicalizeProtocolValueV01([
        {
          record_id: declared.decision_id,
          fingerprint: declared.decision_fingerprint,
        },
      ])
  ) {
    throw new Error("semantic_commit_prior_decision_binding_mismatch");
  }
  const priorDecisionRecord = readVNextCoreRecordV01(db, {
    record_kind: "review_decision",
    record_id: declared.decision_id,
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
  });
  if (!priorDecisionRecord)
    throw new Error("semantic_commit_prior_decision_missing");
  const priorDecision = priorDecisionRecord.payload as ReviewDecisionV01;
  if (
    priorDecisionRecord.fingerprint !== declared.decision_fingerprint ||
    priorDecision.integrity?.fingerprint !== declared.decision_fingerprint
  ) {
    throw new Error("semantic_commit_prior_decision_fingerprint_mismatch");
  }
  assertProposalDecision(proposal, priorDecision);
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(priorDecisionRecord, {
    workspace_id: priorDecision.workspace_id,
    project_id: priorDecision.project_id,
    fingerprint: priorDecision.integrity.fingerprint,
  });
  if (
    priorDecisionRecord.record_id !== priorDecision.decision_id ||
    priorDecisionRecord.created_at !== priorDecision.decided_at
  ) {
    throw new Error("semantic_commit_prior_decision_identity_mismatch");
  }

  let receiptBinding: VNextSemanticCommitLineageBindingV01 | null = null;
  if (expectedBindings) {
    if (expectedBindings.prior_state_transition_receipt_bindings.length !== 1) {
      throw new Error("semantic_commit_prior_receipt_binding_invalid");
    }
    receiptBinding =
      expectedBindings.prior_state_transition_receipt_bindings[0]!;
  } else {
    const projectionBindings = observations.map((observation) => {
      const projection = readVNextSemanticStateEntryV01(db, {
        workspace_id: proposal.workspace_id,
        project_id: proposal.project_id,
        target_key: deriveVNextSemanticTargetKeyV01(observation.target_ref),
      });
      if (!projection) throw new Error("semantic_commit_prior_state_missing");
      if (
        observation.presence !== "present" ||
        !observation.state_ref ||
        canonicalizeProtocolValueV01(observation.state_ref) !==
          canonicalizeProtocolValueV01(projection.state_ref) ||
        observation.state_fingerprint !== projection.state_fingerprint
      ) {
        throw new Error("semantic_commit_prior_state_observation_mismatch");
      }
      return {
        record_id: projection.source_transition_receipt_id,
        fingerprint: projection.source_transition_receipt_fingerprint,
      };
    });
    const uniqueBindings = uniqueProtocolValuesV01(projectionBindings);
    if (uniqueBindings.length !== 1) {
      throw new Error("semantic_commit_prior_receipt_binding_ambiguous");
    }
    receiptBinding = uniqueBindings[0]!;
  }
  const priorReceiptRecord = readVNextCoreRecordV01(db, {
    record_kind: "state_transition_receipt",
    record_id: receiptBinding.record_id,
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
  });
  if (!priorReceiptRecord)
    throw new Error("semantic_commit_prior_receipt_missing");
  const priorReceipt = priorReceiptRecord.payload as StateTransitionReceiptV01;
  const priorReceiptValidation =
    validateStateTransitionReceiptV01(priorReceipt);
  if (
    priorReceiptValidation.status !== "valid" ||
    priorReceiptRecord.fingerprint !== receiptBinding.fingerprint ||
    priorReceipt.integrity?.fingerprint !== receiptBinding.fingerprint
  ) {
    throw new Error("semantic_commit_prior_receipt_invalid");
  }
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(priorReceiptRecord, {
    workspace_id: priorReceipt.workspace_id,
    project_id: priorReceipt.project_id,
    fingerprint: priorReceipt.integrity.fingerprint,
  });
  if (
    priorReceiptRecord.record_id !== priorReceipt.transition_receipt_id ||
    priorReceiptRecord.idempotency_key !== priorReceipt.idempotency_key ||
    priorReceiptRecord.created_at !== priorReceipt.recorded_at
  ) {
    throw new Error("semantic_commit_prior_receipt_identity_mismatch");
  }
  return {
    prior_review_decisions: [priorDecision],
    prior_state_transition_receipts: [priorReceipt],
  };
}

function loadProjectVerifyLifecycleAppliedLineageFromStoreV01(
  db: Database.Database,
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
  observations: StateTransitionCurrentStateObservationV01[],
  expectedBindings?: {
    prior_review_decision_bindings: VNextSemanticCommitLineageBindingV01[];
    prior_state_transition_receipt_bindings: VNextSemanticCommitLineageBindingV01[];
  },
  validationContext?: VNextSemanticTransitionValidationContextV01,
): LoadedAppliedLineageV01 {
  const profile = proposal.project_verify_lifecycle!;
  const binding = profile.lifecycle_binding;
  if (binding.selected_record_revision === 1) {
    if (
      expectedBindings &&
      (expectedBindings.prior_review_decision_bindings.length > 0 ||
        expectedBindings.prior_state_transition_receipt_bindings.length > 0)
    ) {
      throw new Error("semantic_commit_lifecycle_initial_lineage_conflict");
    }
    return {
      prior_review_decisions: [],
      prior_state_transition_receipts: [],
    };
  }

  const head = profile.current_head_expectation;
  if (
    head.presence !== "present" ||
    !head.source_transition_receipt_id ||
    !head.source_transition_receipt_fingerprint ||
    !head.selected_record_ref ||
    !binding.prior_record_ref ||
    canonicalizeProtocolValueV01(head.selected_record_ref) !==
      canonicalizeProtocolValueV01(binding.prior_record_ref)
  ) {
    throw new Error("semantic_commit_lifecycle_prior_head_binding_invalid");
  }
  const receiptBinding = {
    record_id: head.source_transition_receipt_id,
    fingerprint: head.source_transition_receipt_fingerprint,
  };
  if (
    expectedBindings &&
    canonicalizeProtocolValueV01(
      expectedBindings.prior_state_transition_receipt_bindings,
    ) !== canonicalizeProtocolValueV01([receiptBinding])
  ) {
    throw new Error("semantic_commit_lifecycle_prior_receipt_binding_mismatch");
  }

  const prior = loadValidatedTransitionForLineageV01(
    db,
    {
      workspace_id: proposal.workspace_id,
      project_id: proposal.project_id,
      transition_receipt_id: receiptBinding.record_id,
      transition_receipt_fingerprint: receiptBinding.fingerprint,
    },
    validationContext,
  );
  const priorProfile = prior.proposal.project_verify_lifecycle;
  const priorBinding = priorProfile?.lifecycle_binding;
  if (
    !priorBinding ||
    priorBinding.workspace_id !== binding.workspace_id ||
    priorBinding.project_id !== binding.project_id ||
    priorBinding.entity_kind !== binding.entity_kind ||
    priorBinding.family_id !== binding.family_id ||
    priorBinding.family_origin_fingerprint !==
      binding.family_origin_fingerprint ||
    priorBinding.applicability_scope_fingerprint !==
      binding.applicability_scope_fingerprint ||
    priorBinding.selected_record_revision !==
      binding.selected_record_revision - 1 ||
    canonicalizeProtocolValueV01(priorBinding.family_target_ref) !==
      canonicalizeProtocolValueV01(binding.family_target_ref) ||
    canonicalizeProtocolValueV01(priorBinding.selected_record_ref) !==
      canonicalizeProtocolValueV01(binding.prior_record_ref) ||
    (binding.entity_kind === "claim_evidence_relation" &&
      canonicalizeProtocolValueV01(priorBinding.relation_endpoints) !==
        canonicalizeProtocolValueV01(binding.relation_endpoints))
  ) {
    throw new Error(
      "semantic_commit_lifecycle_prior_proposal_binding_mismatch",
    );
  }
  const priorDecisionBinding = {
    record_id: prior.decision.decision_id,
    fingerprint: prior.decision.integrity.fingerprint,
  };
  if (
    expectedBindings &&
    canonicalizeProtocolValueV01(
      expectedBindings.prior_review_decision_bindings,
    ) !== canonicalizeProtocolValueV01([priorDecisionBinding])
  ) {
    throw new Error(
      "semantic_commit_lifecycle_prior_decision_binding_mismatch",
    );
  }
  if (
    decision.lineage.prior_decisions.length !== 1 ||
    decision.lineage.prior_decisions[0]?.decision_id !==
      priorDecisionBinding.record_id ||
    decision.lineage.prior_decisions[0]?.decision_fingerprint !==
      priorDecisionBinding.fingerprint ||
    (binding.selected_record_operation_intent === "retract" &&
      (decision.lineage.retracted_decision?.decision_id !==
        priorDecisionBinding.record_id ||
        decision.lineage.retracted_decision?.decision_fingerprint !==
          priorDecisionBinding.fingerprint))
  ) {
    throw new Error("semantic_commit_lifecycle_decision_lineage_mismatch");
  }
  const priorEffect = prior.receipt.effects.find(
    (effect) =>
      canonicalizeProtocolValueV01(effect.target_ref) ===
      canonicalizeProtocolValueV01(binding.family_target_ref),
  );
  const observation = observations.find(
    (item) =>
      canonicalizeProtocolValueV01(item.target_ref) ===
      canonicalizeProtocolValueV01(binding.family_target_ref),
  );
  if (
    !priorEffect ||
    priorEffect.after_state.presence !== "present" ||
    !observation ||
    observation.presence !== "present" ||
    observation.state_fingerprint !== head.state_content_fingerprint ||
    priorEffect.after_state.state_fingerprint !==
      head.state_content_fingerprint ||
    canonicalizeProtocolValueV01(observation.state_ref) !==
      canonicalizeProtocolValueV01(priorEffect.after_state.state_ref)
  ) {
    throw new Error("semantic_commit_lifecycle_prior_state_binding_mismatch");
  }
  return {
    prior_review_decisions: [prior.decision],
    prior_state_transition_receipts: [prior.receipt],
  };
}

function assertCurrentStateStorageCoherence(
  db: Database.Database,
  workspaceId: string,
  projectId: string,
  targetRef: ExternalRefV01,
  targetKey: string,
  projection: VNextSemanticStateProjectionEntryV01 | null,
  head: VNextSemanticTargetHeadV01 | null,
): void {
  if (!head) {
    if (projection) throw new Error("semantic_state_projection_head_missing");
    return;
  }
  if (
    head.workspace_id !== workspaceId ||
    head.project_id !== projectId ||
    head.target_key !== targetKey
  ) {
    throw new Error("semantic_target_head_scope_mismatch");
  }
  if (head.presence === "absent") {
    if (projection || head.current_state_fingerprint !== null) {
      throw new Error("semantic_target_head_absence_projection_mismatch");
    }
    assertTargetHeadReceiptBinding(
      db,
      workspaceId,
      projectId,
      targetRef,
      head,
      null,
    );
    return;
  }
  if (
    !projection ||
    projection.workspace_id !== workspaceId ||
    projection.project_id !== projectId ||
    projection.target_key !== targetKey ||
    projection.revision !== head.revision ||
    projection.state_fingerprint !== head.current_state_fingerprint ||
    projection.source_transition_receipt_id !==
      head.source_transition_receipt_id ||
    projection.source_transition_receipt_fingerprint !==
      head.source_transition_receipt_fingerprint ||
    projection.updated_at !== head.updated_at ||
    canonicalizeProtocolValueV01(projection.target_ref) !==
      canonicalizeProtocolValueV01(normalizeExternalRefPrimitiveV01(targetRef))
  ) {
    throw new Error("semantic_target_head_projection_mismatch");
  }
  const stateRecord = readVNextCoreRecordV01(db, {
    record_kind: "semantic_state",
    record_id: projection.state_ref.external_id,
    workspace_id: workspaceId,
    project_id: projectId,
  });
  if (!stateRecord) throw new Error("semantic_state_projection_record_missing");
  const state = rebuildVNextPersistedSemanticStateV01(stateRecord.payload);
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(stateRecord, {
    workspace_id: state.workspace_id,
    project_id: state.project_id,
    fingerprint: state.integrity.fingerprint,
  });
  if (
    stateRecord.record_id !== state.semantic_state_record_id ||
    stateRecord.created_at !== state.created_at ||
    state.workspace_id !== workspaceId ||
    state.project_id !== projectId ||
    state.target_key !== targetKey ||
    state.state_content_fingerprint !== projection.state_fingerprint ||
    state.bounded_state_summary !== projection.bounded_state_summary ||
    canonicalizeProtocolValueV01(state.target_ref) !==
      canonicalizeProtocolValueV01(projection.target_ref) ||
    canonicalizeProtocolValueV01(state.state_ref) !==
      canonicalizeProtocolValueV01(projection.state_ref) ||
    state.source_proposal_id !== projection.source_proposal_id ||
    state.source_proposal_fingerprint !==
      projection.source_proposal_fingerprint ||
    state.source_candidate_id !== projection.source_candidate_id ||
    state.source_candidate_fingerprint !==
      projection.source_candidate_fingerprint
  ) {
    throw new Error("semantic_state_projection_record_mismatch");
  }
  if (state.state_content.project_verify_lifecycle_binding) {
    assertProjectVerifyLifecyclePersistedStateSourceBoundV01(db, {
      state,
      transition_receipt_id: head.source_transition_receipt_id,
      transition_receipt_fingerprint:
        head.source_transition_receipt_fingerprint,
    });
  }
  assertTargetHeadReceiptBinding(
    db,
    workspaceId,
    projectId,
    targetRef,
    head,
    projection,
  );
}

function assertTargetHeadReceiptBinding(
  db: Database.Database,
  workspaceId: string,
  projectId: string,
  targetRef: ExternalRefV01,
  head: VNextSemanticTargetHeadV01,
  projection: VNextSemanticStateProjectionEntryV01 | null,
): void {
  const receiptRecord = readVNextCoreRecordV01(db, {
    record_kind: "state_transition_receipt",
    record_id: head.source_transition_receipt_id,
    workspace_id: workspaceId,
    project_id: projectId,
  });
  if (!receiptRecord) throw new Error("semantic_target_head_receipt_missing");
  const validation = validateStateTransitionReceiptV01(receiptRecord.payload);
  if (validation.status !== "valid") {
    throw new Error("semantic_target_head_receipt_invalid");
  }
  const receipt = receiptRecord.payload as StateTransitionReceiptV01;
  assertVNextCoreRecordMatchesProtocolPayloadBindingV01(receiptRecord, {
    workspace_id: receipt.workspace_id,
    project_id: receipt.project_id,
    fingerprint: receipt.integrity.fingerprint,
  });
  const targetCanonical = canonicalizeProtocolValueV01(
    normalizeExternalRefPrimitiveV01(targetRef),
  );
  const effect = receipt.effects.find(
    (item) => canonicalizeProtocolValueV01(item.target_ref) === targetCanonical,
  );
  if (
    receiptRecord.record_id !== receipt.transition_receipt_id ||
    receiptRecord.idempotency_key !== receipt.idempotency_key ||
    receiptRecord.created_at !== receipt.recorded_at ||
    receipt.transition_receipt_id !== head.source_transition_receipt_id ||
    receipt.integrity.fingerprint !==
      head.source_transition_receipt_fingerprint ||
    receipt.recorded_at !== head.updated_at ||
    !effect ||
    effect.after_state.presence !== head.presence ||
    (head.presence === "present" &&
      (effect.after_state.presence !== "present" ||
        effect.after_state.state_fingerprint !==
          head.current_state_fingerprint ||
        !projection ||
        canonicalizeProtocolValueV01(effect.after_state.state_ref) !==
          canonicalizeProtocolValueV01(projection.state_ref))) ||
    (head.presence === "absent" &&
      (effect.after_state.presence !== "absent" || projection !== null))
  ) {
    throw new Error("semantic_target_head_receipt_mismatch");
  }
}

function createAbsentObservation(
  workspaceId: string,
  projectId: string,
  targetRef: ExternalRefV01,
  targetKey: string,
  head: VNextSemanticTargetHeadV01 | null,
  observedAt: string,
): StateTransitionCurrentStateObservationV01 {
  if (head && head.presence !== "absent") {
    throw new Error("semantic_target_head_presence_mismatch");
  }
  const headLineage = head ? createTargetHeadLineageRef(head) : null;
  const fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      observation_version: "vnext_semantic_state_store_observation.v0.1",
      workspace_id: workspaceId,
      project_id: projectId,
      target_key: targetKey,
      presence: "absent",
      revision: head?.revision ?? 0,
      ...(head
        ? {
            source_transition_receipt_id: head.source_transition_receipt_id,
            source_transition_receipt_fingerprint:
              head.source_transition_receipt_fingerprint,
          }
        : {}),
      observed_at: observedAt,
    }),
  );
  const observationRef = localRef(
    "semantic_state_observation",
    `semantic-state-observation:${fingerprint.slice("sha256:".length, 31)}`,
    observedAt,
    fingerprint,
  );
  return {
    target_ref: targetRef,
    presence: "absent",
    state_ref: null,
    state_fingerprint: null,
    observed_at: observedAt,
    observation_ref: observationRef,
    source_refs: normalizeRefs(
      headLineage ? [headLineage, observationRef] : [observationRef],
    ),
  };
}

function createPresentObservation(
  workspaceId: string,
  projectId: string,
  targetRef: ExternalRefV01,
  targetKey: string,
  projection: VNextSemanticStateProjectionEntryV01,
  head: VNextSemanticTargetHeadV01,
  observedAt: string,
): StateTransitionCurrentStateObservationV01 {
  if (
    projection.workspace_id !== workspaceId ||
    projection.project_id !== projectId ||
    projection.target_key !== targetKey ||
    canonicalizeProtocolValueV01(projection.target_ref) !==
      canonicalizeProtocolValueV01(normalizeExternalRefPrimitiveV01(targetRef))
  ) {
    throw new Error("semantic_state_projection_target_mismatch");
  }
  return createPresentObservationFromSnapshot(
    workspaceId,
    projectId,
    targetRef,
    targetKey,
    projection.state_ref,
    projection.state_fingerprint,
    head,
    observedAt,
  );
}

function createPresentObservationFromSnapshot(
  workspaceId: string,
  projectId: string,
  targetRef: ExternalRefV01,
  targetKey: string,
  stateRef: ExternalRefV01,
  stateFingerprint: string,
  head: VNextSemanticTargetHeadV01,
  observedAt: string,
): StateTransitionCurrentStateObservationV01 {
  assertExternalRef(stateRef, "semantic_state_projection.state_ref");
  requireSha256Text(stateFingerprint, "state_fingerprint");
  if (
    head.workspace_id !== workspaceId ||
    head.project_id !== projectId ||
    head.target_key !== targetKey ||
    head.presence !== "present" ||
    head.current_state_fingerprint !== stateFingerprint
  ) {
    throw new Error("semantic_target_head_projection_mismatch");
  }
  const headLineage = createTargetHeadLineageRef(head);
  const fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      observation_version: "vnext_semantic_state_store_observation.v0.1",
      workspace_id: workspaceId,
      project_id: projectId,
      target_key: targetKey,
      presence: "present",
      state_ref: normalizeExternalRefPrimitiveV01(stateRef),
      state_fingerprint: stateFingerprint,
      revision: head.revision,
      source_transition_receipt_id: head.source_transition_receipt_id,
      source_transition_receipt_fingerprint:
        head.source_transition_receipt_fingerprint,
      observed_at: observedAt,
    }),
  );
  const observationRef = localRef(
    "semantic_state_observation",
    `semantic-state-observation:${fingerprint.slice("sha256:".length, 31)}`,
    observedAt,
    fingerprint,
  );
  return {
    target_ref: normalizeExternalRefPrimitiveV01(targetRef),
    presence: "present",
    state_ref: normalizeExternalRefPrimitiveV01(stateRef),
    state_fingerprint: stateFingerprint,
    observed_at: observedAt,
    observation_ref: observationRef,
    source_refs: normalizeRefs([stateRef, headLineage, observationRef]),
  };
}

function createTargetHeadLineageRef(
  head: VNextSemanticTargetHeadV01,
): ExternalRefV01 {
  return localRef(
    "semantic_target_head_lineage",
    head.source_transition_receipt_id,
    head.updated_at,
    head.source_transition_receipt_fingerprint,
  );
}

function eligibilityInputFor(
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
  observations: StateTransitionCurrentStateObservationV01[],
  gate: StateTransitionSemanticCommitGateEvaluationV01,
  evaluatedAt: string,
  lineage: LoadedAppliedLineageV01 = {
    prior_review_decisions: [],
    prior_state_transition_receipts: [],
  },
): StateTransitionEligibilityEvaluationInputV01 {
  return {
    proposal,
    decision,
    current_state_observations: observations,
    semantic_commit_gate_evaluation: gate,
    prior_review_decisions: lineage.prior_review_decisions,
    prior_state_transition_receipts: lineage.prior_state_transition_receipts,
    evaluated_at: evaluatedAt,
  };
}

function deriveSemanticCommitGateRecordId(input: {
  workspace_id: string;
  project_id: string;
  decision_fingerprint: string;
  confirmation_digest: string;
  confirmed_at: string;
  authorized_applier_ref: ExternalRefV01;
}): string {
  const hash = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      decision_fingerprint: input.decision_fingerprint,
      confirmation_digest: input.confirmation_digest,
      confirmed_at: input.confirmed_at,
      authorized_applier_ref: normalizeExternalRefPrimitiveV01(
        input.authorized_applier_ref,
      ),
    }),
  );
  return `semantic-commit-gate:${hash.slice("sha256:".length, 31)}`;
}

function buildSemanticCommitGateEvaluation(input: {
  preview: VNextSemanticCommitPreviewV01;
  decision: ReviewDecisionV01;
  confirmation_observation_ref: ExternalRefV01;
  authorized_applier_ref: ExternalRefV01;
  gate_record_id: string;
  evaluated_at: string;
  expires_at: string;
}): StateTransitionSemanticCommitGateEvaluationV01 {
  const evaluationRef = localRef(
    "semantic_commit_gate_evaluation",
    input.gate_record_id,
    input.evaluated_at,
    input.preview.confirmation_digest,
  );
  const gateActorRef = localRef(
    "semantic_commit_gate_actor",
    "augnes-local-semantic-commit-gate:v0.1",
    input.evaluated_at,
    input.preview.confirmation_digest,
  );
  const authorizedEffects: StateTransitionGateAuthorizedEffectV01[] =
    input.preview.intended_effects.map((effect) => ({
      target_ref: effect.target_ref,
      operation: effect.operation,
      expected_after_state:
        effect.operation === "retract"
          ? {
              presence: "absent" as const,
              state_fingerprint: null,
              state_ref_rule: null,
            }
          : {
              presence: "present" as const,
              state_fingerprint: requireSha256Text(
                effect.expected_after_state_fingerprint,
                "expected_after_state_fingerprint",
              ),
              state_ref_rule: {
                mode: "writer_allocated" as const,
                ref_type: "accepted_semantic_state",
                compatibility_namespace:
                  VNEXT_LOCAL_SEMANTIC_STATE_NAMESPACE_V01,
                trust_class: "direct_local_observation" as const,
              },
            },
    }));
  return {
    status: "authorized",
    workspace_id: input.preview.workspace_id,
    project_id: input.preview.project_id,
    decision_id: input.decision.decision_id,
    decision_fingerprint: input.decision.integrity.fingerprint,
    intent_id: input.preview.intent_id,
    transition_kind: input.preview.transition_kind,
    target_refs: normalizeRefs(
      input.preview.intended_effects.map((effect) => effect.target_ref),
    ),
    decision_actor_ref: normalizeExternalRefPrimitiveV01(
      input.decision.actor_ref,
    ),
    authorization_basis_refs: normalizeRefs(
      input.decision.authorization_basis_refs,
    ),
    gate_actor_ref: gateActorRef,
    authorized_applier_ref: normalizeExternalRefPrimitiveV01(
      input.authorized_applier_ref,
    ),
    authorized_effects: authorizedEffects.sort(compareProtocolCanonical),
    evaluation_ref: evaluationRef,
    evaluated_at: input.evaluated_at,
    expires_at: input.expires_at,
    source_refs: normalizeRefs([
      input.confirmation_observation_ref,
      gateActorRef,
      evaluationRef,
      input.authorized_applier_ref,
    ]),
  };
}

function buildGateRecord(input: {
  gate_record_id: string;
  preview: VNextSemanticCommitPreviewV01;
  operator_actor_ref: ExternalRefV01;
  confirmation_observation_ref: ExternalRefV01;
  operator_confirmation_basis_refs?: ExternalRefV01[];
  confirmed_at: string;
  gate: StateTransitionSemanticCommitGateEvaluationV01;
  eligibility_evaluated_at: string;
  eligibility_precondition_fingerprint: string;
}): VNextSemanticCommitGateRecordV01 {
  const withoutFingerprint = {
    gate_record_version: VNEXT_SEMANTIC_COMMIT_GATE_RECORD_VERSION_V01,
    gate_record_id: input.gate_record_id,
    workspace_id: input.preview.workspace_id,
    project_id: input.preview.project_id,
    proposal_id: input.preview.proposal_id,
    proposal_fingerprint: input.preview.proposal_fingerprint,
    decision_id: input.preview.decision_id,
    decision_fingerprint: input.preview.decision_fingerprint,
    candidate_id: input.preview.candidate_id,
    candidate_fingerprint: input.preview.candidate_fingerprint,
    confirmation_digest: input.preview.confirmation_digest,
    previewed_at: input.preview.previewed_at,
    confirmed_at: input.confirmed_at,
    operator_actor_ref: normalizeExternalRefPrimitiveV01(
      input.operator_actor_ref,
    ),
    confirmation_observation_ref: normalizeExternalRefPrimitiveV01(
      input.confirmation_observation_ref,
    ),
    ...(input.operator_confirmation_basis_refs === undefined
      ? {}
      : {
          operator_confirmation_basis_refs: normalizeRefs(
            input.operator_confirmation_basis_refs,
          ),
        }),
    current_state_observations: input.preview.current_state_observations,
    intended_effects: input.preview.intended_effects,
    prior_review_decision_bindings:
      input.preview.prior_review_decision_bindings,
    prior_state_transition_receipt_bindings:
      input.preview.prior_state_transition_receipt_bindings,
    semantic_commit_gate_evaluation: input.gate,
    eligibility_evaluated_at: input.eligibility_evaluated_at,
    eligibility_precondition_fingerprint:
      input.eligibility_precondition_fingerprint,
    integrity: {
      algorithm: "sha256" as const,
      fingerprint_scope:
        "semantic_commit_gate_record_without_integrity_fingerprint" as const,
      fingerprint: "sha256:pending",
    },
  };
  const fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      ...withoutFingerprint,
      integrity: { ...withoutFingerprint.integrity, fingerprint: undefined },
    }),
  );
  return {
    ...withoutFingerprint,
    integrity: { ...withoutFingerprint.integrity, fingerprint },
  };
}

function rebuildSemanticCommitPreviewFromGateSnapshot(
  db: Database.Database,
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
  gate: VNextSemanticCommitGateRecordV01,
  validationContext?: VNextSemanticTransitionValidationContextV01,
): VNextSemanticCommitPreviewV01 {
  const transition = resolveTransitionMaterial(proposal, decision);
  const observationByTarget = new Map<
    string,
    StateTransitionCurrentStateObservationV01
  >();
  for (const value of gate.current_state_observations) {
    const observation = requirePlainRecord(
      value,
      "semantic_commit_gate_current_state_observation_invalid",
    ) as unknown as StateTransitionCurrentStateObservationV01;
    assertExternalRef(
      observation.target_ref,
      "current_state_observation.target_ref",
    );
    const key = canonicalizeProtocolValueV01(
      normalizeExternalRefPrimitiveV01(observation.target_ref),
    );
    if (observationByTarget.has(key)) {
      throw new Error("semantic_commit_gate_duplicate_current_state_target");
    }
    observationByTarget.set(key, observation);
  }
  const effectByTarget = new Map<string, VNextSemanticCommitPreviewEffectV01>();
  for (const value of gate.intended_effects) {
    const effect = requirePlainRecord(
      value,
      "semantic_commit_gate_preview_effect_invalid",
    ) as unknown as VNextSemanticCommitPreviewEffectV01;
    assertExternalRef(effect.target_ref, "intended_effect.target_ref");
    const key = canonicalizeProtocolValueV01(
      normalizeExternalRefPrimitiveV01(effect.target_ref),
    );
    if (effectByTarget.has(key)) {
      throw new Error("semantic_commit_gate_duplicate_effect_target");
    }
    effectByTarget.set(key, effect);
  }
  if (
    observationByTarget.size !== transition.target_refs.length ||
    effectByTarget.size !== transition.target_refs.length
  ) {
    throw new Error("semantic_commit_gate_target_material_mismatch");
  }
  const observations: StateTransitionCurrentStateObservationV01[] = [];
  const expectedRevisions: number[] = [];
  const heads: Array<VNextSemanticTargetHeadV01 | null> = [];
  for (const targetRef of transition.target_refs) {
    const canonicalTarget = canonicalizeProtocolValueV01(targetRef);
    const storedObservation = observationByTarget.get(canonicalTarget);
    const storedEffect = effectByTarget.get(canonicalTarget);
    if (!storedObservation || !storedEffect) {
      throw new Error("semantic_commit_gate_target_material_missing");
    }
    const observedAt = requireText(
      storedObservation.observed_at,
      "semantic_commit_gate_observed_at_invalid",
    );
    assertTimestamp(observedAt, "current_state_observed_at");
    if (
      !Number.isSafeInteger(storedEffect.expected_revision) ||
      storedEffect.expected_revision < 1
    ) {
      throw new Error("semantic_commit_expected_revision_invalid");
    }
    const targetKey = deriveVNextSemanticTargetKeyV01(targetRef);
    const storedHead = reconstructTargetHeadFromStoredObservation(
      proposal.workspace_id,
      proposal.project_id,
      targetKey,
      storedObservation,
      storedEffect.expected_revision - 1,
    );
    let expectedObservation: StateTransitionCurrentStateObservationV01;
    if (storedObservation.presence === "absent") {
      expectedObservation = createAbsentObservation(
        proposal.workspace_id,
        proposal.project_id,
        targetRef,
        targetKey,
        storedHead,
        observedAt,
      );
    } else if (
      storedObservation.presence === "present" &&
      storedObservation.state_ref &&
      typeof storedObservation.state_fingerprint === "string" &&
      storedEffect.expected_revision >= 2
    ) {
      expectedObservation = createPresentObservationFromSnapshot(
        proposal.workspace_id,
        proposal.project_id,
        targetRef,
        targetKey,
        storedObservation.state_ref,
        storedObservation.state_fingerprint,
        storedHead!,
        observedAt,
      );
    } else {
      throw new Error("semantic_commit_gate_current_state_snapshot_invalid");
    }
    if (
      canonicalizeProtocolValueV01(storedObservation) !==
      canonicalizeProtocolValueV01(expectedObservation)
    ) {
      throw new Error("semantic_commit_gate_current_state_observation_invalid");
    }
    observations.push(expectedObservation);
    heads.push(storedHead);
    expectedRevisions.push(storedEffect.expected_revision);
  }
  const intendedEffects = derivePreviewEffects({
    proposal,
    decision,
    transition,
    observations,
    projections: observations.map(() => null),
    heads,
    expected_revisions: expectedRevisions,
    previewed_at: gate.previewed_at,
  });
  const lineage = loadAppliedLineageFromStore(
    db,
    proposal,
    decision,
    observations,
    {
      prior_review_decision_bindings: gate.prior_review_decision_bindings,
      prior_state_transition_receipt_bindings:
        gate.prior_state_transition_receipt_bindings,
    },
    validationContext,
  );
  const authorizedApplierIdentity = localRuntimeActorIdentityFromRef(
    gate.semantic_commit_gate_evaluation.authorized_applier_ref,
  );
  const confirmationContextFingerprint =
    confirmationContextFingerprintFromBasis(
      gate.operator_confirmation_basis_refs,
    );
  const gateTtlMs = gateTtlFromEvaluation(
    gate.semantic_commit_gate_evaluation,
    VNEXT_OPERATOR_PILOT_GATE_TTL_MAX_MS_V01,
  );
  const material = {
    preview_version: VNEXT_SEMANTIC_COMMIT_PREVIEW_VERSION_V01,
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
    proposal_id: proposal.proposal_id,
    proposal_fingerprint: proposal.integrity.fingerprint,
    decision_id: decision.decision_id,
    decision_fingerprint: decision.integrity.fingerprint,
    candidate_id: transition.source_candidate.candidate_id,
    candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(
      transition.source_candidate,
    ),
    intent_id: decision.requested_transition_intent!.intent_id,
    transition_kind: transition.transition_kind,
    authorized_applier_identity: authorizedApplierIdentity,
    gate_ttl_ms: gateTtlMs,
    previewed_at: gate.previewed_at,
    current_state_observations: observations,
    intended_effects: intendedEffects,
    prior_review_decision_bindings: lineage.prior_review_decisions.map(
      (item) => ({
        record_id: item.decision_id,
        fingerprint: item.integrity.fingerprint,
      }),
    ),
    prior_state_transition_receipt_bindings:
      lineage.prior_state_transition_receipts.map((item) => ({
        record_id: item.transition_receipt_id,
        fingerprint: item.integrity.fingerprint,
      })),
  };
  return {
    ...material,
    confirmation_digest: createSemanticCommitConfirmationDigest(
      material,
      confirmationContextFingerprint,
    ),
    eligibility_input: null,
    eligibility: null,
  };
}

function reconstructTargetHeadFromStoredObservation(
  workspaceId: string,
  projectId: string,
  targetKey: string,
  observation: StateTransitionCurrentStateObservationV01,
  revision: number,
): VNextSemanticTargetHeadV01 | null {
  if (!Number.isSafeInteger(revision) || revision < 0) {
    throw new Error("semantic_commit_expected_revision_invalid");
  }
  const lineageRefs = observation.source_refs.filter(
    (ref) =>
      ref.ref_type === "semantic_target_head_lineage" &&
      ref.compatibility_namespace ===
        VNEXT_DURABLE_TRANSITION_RUNTIME_NAMESPACE_V01,
  );
  if (revision === 0) {
    if (lineageRefs.length !== 0) {
      throw new Error("semantic_target_head_lineage_unexpected");
    }
    return null;
  }
  if (observation.presence !== "absent" && observation.presence !== "present") {
    throw new Error("semantic_commit_gate_current_state_snapshot_invalid");
  }
  if (lineageRefs.length !== 1) {
    throw new Error("semantic_target_head_lineage_missing");
  }
  const lineage = normalizeExternalRefPrimitiveV01(lineageRefs[0]!);
  if (
    lineage.trust_class !== "direct_local_observation" ||
    !lineage.observed_at ||
    !lineage.source_ref
  ) {
    throw new Error("semantic_target_head_lineage_invalid");
  }
  return {
    workspace_id: workspaceId,
    project_id: projectId,
    target_key: targetKey,
    revision,
    presence: observation.presence,
    current_state_fingerprint:
      observation.presence === "present"
        ? requireSha256Text(observation.state_fingerprint, "state_fingerprint")
        : null,
    source_transition_receipt_id: lineage.external_id,
    source_transition_receipt_fingerprint: requireSha256Text(
      lineage.source_ref,
      "source_transition_receipt_fingerprint",
    ),
    updated_at: lineage.observed_at,
  };
}

const gateRecordRequiredKeys = new Set([
  "gate_record_version",
  "gate_record_id",
  "workspace_id",
  "project_id",
  "proposal_id",
  "proposal_fingerprint",
  "decision_id",
  "decision_fingerprint",
  "candidate_id",
  "candidate_fingerprint",
  "confirmation_digest",
  "previewed_at",
  "confirmed_at",
  "operator_actor_ref",
  "confirmation_observation_ref",
  "current_state_observations",
  "intended_effects",
  "prior_review_decision_bindings",
  "prior_state_transition_receipt_bindings",
  "semantic_commit_gate_evaluation",
  "eligibility_evaluated_at",
  "eligibility_precondition_fingerprint",
  "integrity",
]);
const gateRecordOptionalKeys = new Set(["operator_confirmation_basis_refs"]);
const gateRecordKeys = new Set([
  ...gateRecordRequiredKeys,
  ...gateRecordOptionalKeys,
]);

function parseGateRecordPayload(
  value: unknown,
): VNextSemanticCommitGateRecordV01 {
  const gate = requirePlainRecord(
    value,
    "semantic_commit_gate_payload_invalid",
  );
  if (
    Object.keys(gate).some((key) => !gateRecordKeys.has(key)) ||
    [...gateRecordRequiredKeys].some((key) => !Object.hasOwn(gate, key))
  ) {
    throw new Error("semantic_commit_gate_payload_unknown_or_missing_field");
  }
  for (const key of [
    "gate_record_id",
    "workspace_id",
    "project_id",
    "proposal_id",
    "proposal_fingerprint",
    "decision_id",
    "decision_fingerprint",
    "candidate_id",
    "candidate_fingerprint",
    "confirmation_digest",
    "previewed_at",
    "confirmed_at",
    "eligibility_evaluated_at",
    "eligibility_precondition_fingerprint",
  ] as const) {
    requireText(gate[key], `semantic_commit_gate_${key}_invalid`);
  }
  if (Object.hasOwn(gate, "operator_confirmation_basis_refs")) {
    if (
      !Array.isArray(gate.operator_confirmation_basis_refs) ||
      gate.operator_confirmation_basis_refs.length === 0 ||
      gate.operator_confirmation_basis_refs.length > 64
    ) {
      throw new Error(
        "semantic_commit_gate_operator_confirmation_basis_refs_invalid",
      );
    }
    for (const ref of gate.operator_confirmation_basis_refs) {
      assertExternalRef(
        ref as ExternalRefV01,
        "operator_confirmation_basis_ref",
      );
    }
    const normalized = normalizeRefs(
      gate.operator_confirmation_basis_refs as ExternalRefV01[],
    );
    if (
      canonicalizeProtocolValueV01(normalized) !==
      canonicalizeProtocolValueV01(gate.operator_confirmation_basis_refs)
    ) {
      throw new Error(
        "semantic_commit_gate_operator_confirmation_basis_refs_not_normalized",
      );
    }
  }
  if (
    gate.gate_record_version !== VNEXT_SEMANTIC_COMMIT_GATE_RECORD_VERSION_V01
  ) {
    throw new Error("semantic_commit_gate_version_invalid");
  }
  for (const key of [
    "current_state_observations",
    "intended_effects",
    "prior_review_decision_bindings",
    "prior_state_transition_receipt_bindings",
  ] as const) {
    if (!Array.isArray(gate[key])) {
      throw new Error(`semantic_commit_gate_${key}_invalid`);
    }
  }
  requirePlainRecord(
    gate.semantic_commit_gate_evaluation,
    "semantic_commit_gate_evaluation_invalid",
  );
  requirePlainRecord(gate.integrity, "semantic_commit_gate_integrity_invalid");
  assertExternalRef(
    gate.operator_actor_ref as ExternalRefV01,
    "operator_actor_ref",
  );
  assertExternalRef(
    gate.confirmation_observation_ref as ExternalRefV01,
    "confirmation_observation_ref",
  );
  return gate as unknown as VNextSemanticCommitGateRecordV01;
}

function loadGateRecord(
  db: Database.Database,
  input: CommitVNextSemanticTransitionInputV01,
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
  options: {
    allow_historical_snapshot: boolean;
    validation:
      | { kind: "generic" }
      | { kind: "historical_replay" }
      | {
          kind: "operator_pilot";
          capability: VNextOperatorPilotReviewWindowCapabilityResolutionV01;
        };
  },
  validationContext?: VNextSemanticTransitionValidationContextV01,
): VNextSemanticCommitGateRecordV01 {
  const record = readVNextCoreRecordV01(db, {
    record_kind: "semantic_commit_gate",
    record_id: input.gate_record_id,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
  });
  if (!record) throw new Error("semantic_commit_gate_missing");
  if (record.fingerprint !== input.gate_record_fingerprint)
    throw new Error("semantic_commit_gate_fingerprint_mismatch");
  const gate = parseGateRecordPayload(record.payload);
  if (
    gate.workspace_id !== proposal.workspace_id ||
    gate.project_id !== proposal.project_id ||
    gate.proposal_id !== proposal.proposal_id ||
    gate.proposal_fingerprint !== proposal.integrity.fingerprint ||
    gate.decision_id !== decision.decision_id ||
    gate.decision_fingerprint !== decision.integrity.fingerprint
  ) {
    throw new Error("semantic_commit_gate_binding_mismatch");
  }
  assertExactRef(
    gate.operator_actor_ref,
    decision.actor_ref,
    "operator_actor_mismatch",
  );
  assertConfirmationRef(
    gate.confirmation_observation_ref,
    gate.confirmed_at,
    gate.confirmation_digest,
  );
  assertProviderNeutralRef(
    gate.semantic_commit_gate_evaluation.authorized_applier_ref,
    "authorized_applier_ref",
  );
  const rebuiltPreview = rebuildSemanticCommitPreviewFromGateSnapshot(
    db,
    proposal,
    decision,
    gate,
    validationContext,
  );
  const confirmationContextFingerprint =
    confirmationContextFingerprintFromBasis(
      gate.operator_confirmation_basis_refs,
    );
  const timingValidation = resolveGateTimingValidation(
    gate,
    options.validation,
    confirmationContextFingerprint,
  );
  const expectedConfirmationRef = createRuntimeConfirmationRef(
    rebuiltPreview,
    gate.confirmed_at,
  );
  const expectedAuthorizedApplierRef = createRuntimeAuthorizedApplierRef(
    rebuiltPreview,
    gate.semantic_commit_gate_evaluation.evaluated_at,
  );
  assertExactRef(
    gate.confirmation_observation_ref,
    expectedConfirmationRef,
    "confirmation_observation_ref_mismatch",
  );
  assertExactRef(
    gate.semantic_commit_gate_evaluation.authorized_applier_ref,
    expectedAuthorizedApplierRef,
    "authorized_applier_ref_mismatch",
  );
  if (!options.allow_historical_snapshot) {
    const livePreview = prepareVNextSemanticCommitPreviewAtV01(
      db,
      {
        workspace_id: proposal.workspace_id,
        project_id: proposal.project_id,
        proposal_id: proposal.proposal_id,
        proposal_fingerprint: proposal.integrity.fingerprint,
        decision_id: decision.decision_id,
        decision_fingerprint: decision.integrity.fingerprint,
      },
      rebuiltPreview.current_state_observations[0]!.observed_at,
      rebuiltPreview.previewed_at,
      rebuiltPreview.authorized_applier_identity,
      rebuiltPreview.gate_ttl_ms,
      confirmationContextFingerprint,
    );
    if (
      canonicalizeProtocolValueV01(livePreview) !==
      canonicalizeProtocolValueV01(rebuiltPreview)
    ) {
      throw new Error("semantic_commit_gate_current_state_changed");
    }
  }
  assertSemanticCommitChronology({
    observations: rebuiltPreview.current_state_observations,
    previewed_at: rebuiltPreview.previewed_at,
    confirmed_at: gate.confirmed_at,
    gate_evaluated_at: gate.semantic_commit_gate_evaluation.evaluated_at,
    eligibility_evaluated_at: gate.eligibility_evaluated_at,
    gate_expires_at: gate.semantic_commit_gate_evaluation.expires_at,
  });
  assertPreviewConfirmationAge(
    rebuiltPreview.previewed_at,
    gate.confirmed_at,
    timingValidation.preview_max_age_ms,
  );
  const expectedGateId = deriveSemanticCommitGateRecordId({
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
    decision_fingerprint: decision.integrity.fingerprint,
    confirmation_digest: rebuiltPreview.confirmation_digest,
    confirmed_at: gate.confirmed_at,
    authorized_applier_ref: expectedAuthorizedApplierRef,
  });
  const expectedGateEvaluation = buildSemanticCommitGateEvaluation({
    preview: rebuiltPreview,
    decision,
    confirmation_observation_ref: expectedConfirmationRef,
    authorized_applier_ref: expectedAuthorizedApplierRef,
    gate_record_id: expectedGateId,
    evaluated_at: gate.semantic_commit_gate_evaluation.evaluated_at,
    expires_at: gate.semantic_commit_gate_evaluation.expires_at,
  });
  const lineage = loadAppliedLineageFromStore(
    db,
    proposal,
    decision,
    rebuiltPreview.current_state_observations,
    {
      prior_review_decision_bindings:
        rebuiltPreview.prior_review_decision_bindings,
      prior_state_transition_receipt_bindings:
        rebuiltPreview.prior_state_transition_receipt_bindings,
    },
    validationContext,
  );
  const eligibilityInput = eligibilityInputFor(
    proposal,
    decision,
    rebuiltPreview.current_state_observations,
    expectedGateEvaluation,
    gate.eligibility_evaluated_at,
    lineage,
  );
  const eligibility =
    evaluateReviewDecisionStateTransitionEligibilityV01(eligibilityInput);
  if (eligibility.status !== "eligible") {
    throw new Error(
      `semantic_commit_gate_not_eligible:${issueCodes(eligibility)}`,
    );
  }
  const rebuilt = buildGateRecord({
    gate_record_id: expectedGateId,
    preview: rebuiltPreview,
    operator_actor_ref: decision.actor_ref,
    confirmation_observation_ref: gate.confirmation_observation_ref,
    operator_confirmation_basis_refs: gate.operator_confirmation_basis_refs,
    confirmed_at: gate.confirmed_at,
    gate: expectedGateEvaluation,
    eligibility_evaluated_at: gate.eligibility_evaluated_at,
    eligibility_precondition_fingerprint: eligibility.precondition_fingerprint,
  });
  if (
    canonicalizeProtocolValueV01(record.payload) !==
      canonicalizeProtocolValueV01(rebuilt) ||
    record.record_id !== rebuilt.gate_record_id ||
    record.fingerprint !== rebuilt.integrity.fingerprint ||
    record.idempotency_key !== rebuilt.confirmation_digest ||
    record.created_at !== rebuilt.confirmed_at
  ) {
    throw new Error("semantic_commit_gate_payload_invalid");
  }
  return rebuilt;
}

function transitionIdempotencyKey(decision: ReviewDecisionV01): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      transition_receipt_version: STATE_TRANSITION_RECEIPT_VERSION_V01,
      workspace_id: decision.workspace_id,
      project_id: decision.project_id,
      decision_fingerprint: decision.integrity.fingerprint,
      intent_id: decision.requested_transition_intent!.intent_id,
      transition_kind: decision.requested_transition_intent!.transition_kind,
      target_refs: normalizeRefs(
        decision.requested_transition_intent!.target_refs,
      ),
    }),
  );
}

function withImmediateTransaction<T>(db: Database.Database, run: () => T): T {
  if (db.inTransaction) throw new Error("vnext_nested_transaction_forbidden");
  db.exec("BEGIN IMMEDIATE");
  try {
    const value = run();
    db.exec("COMMIT");
    return value;
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

function protocolRef(
  refType: string,
  externalId: string,
  trustClass: ExternalRefV01["trust_class"],
  observedAt: string,
  sourceRef: string,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    trust_class: trustClass,
    observed_at: observedAt,
    source_ref: sourceRef,
    compatibility_namespace: VNEXT_DURABLE_TRANSITION_RUNTIME_NAMESPACE_V01,
  };
}

function localRef(
  refType: string,
  externalId: string,
  observedAt: string,
  sourceRef: string,
  compatibilityNamespace: string = VNEXT_DURABLE_TRANSITION_RUNTIME_NAMESPACE_V01,
): ExternalRefV01 {
  return {
    ...protocolRef(
      refType,
      externalId,
      "direct_local_observation",
      observedAt,
      sourceRef,
    ),
    compatibility_namespace: compatibilityNamespace,
  };
}

function normalizeRefs(refs: ExternalRefV01[]): ExternalRefV01[] {
  return uniqueProtocolValuesV01(
    refs.map(normalizeExternalRefPrimitiveV01),
  ).sort(compareExternalRefsV01);
}

function assertExactRef(
  actual: ExternalRefV01,
  expected: ExternalRefV01,
  code: string,
): void {
  if (
    canonicalizeProtocolValueV01(normalizeExternalRefPrimitiveV01(actual)) !==
    canonicalizeProtocolValueV01(normalizeExternalRefPrimitiveV01(expected))
  )
    throw new Error(code);
}

function assertProviderNeutralRef(ref: ExternalRefV01, field: string): void {
  assertExternalRef(ref, field);
  if (ref.provider != null || ref.host != null)
    throw new Error(`${field}_provider_specific`);
}

function normalizeLocalRuntimeActorIdentity(
  value: unknown,
): VNextLocalRuntimeActorIdentityV01 {
  const record = requirePlainRecord(
    value,
    "authorized_applier_identity_invalid",
  );
  if (
    Object.keys(record).length !== 2 ||
    Object.keys(record).some(
      (key) => key !== "ref_type" && key !== "external_id",
    )
  ) {
    throw new Error("authorized_applier_identity_invalid");
  }
  return {
    ref_type: requireText(
      record.ref_type,
      "authorized_applier_identity_ref_type_invalid",
    ),
    external_id: requireText(
      record.external_id,
      "authorized_applier_identity_external_id_invalid",
    ),
  };
}

function localRuntimeActorIdentityFromRef(
  ref: ExternalRefV01,
): VNextLocalRuntimeActorIdentityV01 {
  assertProviderNeutralRef(ref, "authorized_applier_ref");
  return normalizeLocalRuntimeActorIdentity({
    ref_type: ref.ref_type,
    external_id: ref.external_id,
  });
}

function normalizeGateTtlMs(
  value: unknown,
  maximum: number = VNEXT_SEMANTIC_COMMIT_GATE_MAX_TTL_MS_V01,
): number {
  if (
    !Number.isSafeInteger(maximum) ||
    maximum < VNEXT_SEMANTIC_COMMIT_GATE_MAX_TTL_MS_V01 ||
    maximum > VNEXT_OPERATOR_PILOT_GATE_TTL_MAX_MS_V01 ||
    !Number.isSafeInteger(value) ||
    Number(value) < 1 ||
    Number(value) > maximum
  ) {
    throw new Error("semantic_commit_gate_ttl_invalid");
  }
  return Number(value);
}

function normalizePreviewMaxAgeMs(value: unknown, maximum: number): number {
  if (
    !Number.isSafeInteger(maximum) ||
    maximum < VNEXT_SEMANTIC_COMMIT_PREVIEW_MAX_AGE_MS_V01 ||
    maximum > VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_MAX_MS_V01 ||
    !Number.isSafeInteger(value) ||
    Number(value) < 1 ||
    Number(value) > maximum
  ) {
    throw new Error("semantic_commit_preview_max_age_invalid");
  }
  return Number(value);
}

function resolveOperatorPilotCapabilityForBinding(
  capability: VNextOperatorPilotReviewWindowCapabilityV01,
  binding: { workspace_id: string; project_id: string },
): VNextOperatorPilotReviewWindowCapabilityResolutionV01 {
  return resolveVNextOperatorPilotReviewWindowCapabilityV01(capability, {
    workspace_id: binding.workspace_id,
    project_id: binding.project_id,
  });
}

function operatorPilotConfirmationContextFingerprint(
  capability: VNextOperatorPilotReviewWindowCapabilityResolutionV01,
  binding: {
    workspace_id: string;
    project_id: string;
    proposal_id: string;
    proposal_fingerprint: string;
    decision_id: string;
    decision_fingerprint: string;
    previewed_at: string;
  },
): string | undefined {
  if (!isExplicitVNextOperatorPilotReviewWindowConfigV01(capability.config)) {
    return undefined;
  }
  if (
    capability.workspace_id !== binding.workspace_id ||
    capability.project_id !== binding.project_id ||
    parseStrictIsoTimestampV01(binding.previewed_at) === null
  ) {
    throw new Error("semantic_commit_operator_pilot_capability_mismatch");
  }
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      confirmation_context_version:
        VNEXT_OPERATOR_PILOT_CONFIRMATION_CONTEXT_VERSION_V01,
      review_window_config_fingerprint:
        createVNextOperatorPilotReviewWindowConfigFingerprintV01(
          capability.config,
        ),
      workspace_id: binding.workspace_id,
      project_id: binding.project_id,
      proposal_id: binding.proposal_id,
      proposal_fingerprint: binding.proposal_fingerprint,
      decision_id: binding.decision_id,
      decision_fingerprint: binding.decision_fingerprint,
      previewed_at: binding.previewed_at,
    }),
  );
}

function createOperatorPilotConfirmationContextRef(
  capability: VNextOperatorPilotReviewWindowCapabilityResolutionV01,
  preview: {
    workspace_id: string;
    project_id: string;
    proposal_id: string;
    proposal_fingerprint: string;
    decision_id: string;
    decision_fingerprint: string;
    previewed_at: string;
  },
  confirmedAt: string,
): ExternalRefV01 {
  const contextFingerprint = operatorPilotConfirmationContextFingerprint(
    capability,
    preview,
  );
  if (
    contextFingerprint === undefined ||
    parseStrictIsoTimestampV01(confirmedAt) === null
  ) {
    throw new Error("semantic_commit_confirmation_context_invalid");
  }
  return localRef(
    VNEXT_SEMANTIC_COMMIT_CONFIRMATION_CONTEXT_REF_TYPE_V01,
    capability.config.config_version,
    confirmedAt,
    contextFingerprint,
    VNEXT_SEMANTIC_COMMIT_CONFIRMATION_CONTEXT_NAMESPACE_V01,
  );
}

function assertOperatorReviewWindowContextAbsent(
  refs: ExternalRefV01[] | undefined,
): void {
  if (
    (refs ?? []).some(
      (ref) =>
        ref.ref_type ===
          VNEXT_SEMANTIC_COMMIT_CONFIRMATION_CONTEXT_REF_TYPE_V01 ||
        ref.compatibility_namespace ===
          VNEXT_SEMANTIC_COMMIT_CONFIRMATION_CONTEXT_NAMESPACE_V01,
    )
  ) {
    throw new Error("semantic_commit_operator_review_window_context_forbidden");
  }
}

function resolveGateTimingValidation(
  gate: VNextSemanticCommitGateRecordV01,
  validation:
    | { kind: "generic" }
    | { kind: "historical_replay" }
    | {
        kind: "operator_pilot";
        capability: VNextOperatorPilotReviewWindowCapabilityResolutionV01;
      },
  storedContextFingerprint: string | undefined,
): { preview_max_age_ms: number } {
  if (validation.kind === "historical_replay") {
    gateTtlFromEvaluation(
      gate.semantic_commit_gate_evaluation,
      VNEXT_OPERATOR_PILOT_GATE_TTL_MAX_MS_V01,
    );
    return {
      preview_max_age_ms: normalizePreviewMaxAgeMs(
        VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_MAX_MS_V01,
        VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_MAX_MS_V01,
      ),
    };
  }
  if (validation.kind === "generic") {
    assertOperatorReviewWindowContextAbsent(
      gate.operator_confirmation_basis_refs,
    );
    if (storedContextFingerprint !== undefined) {
      throw new Error(
        "semantic_commit_operator_review_window_context_forbidden",
      );
    }
    gateTtlFromEvaluation(
      gate.semantic_commit_gate_evaluation,
      VNEXT_SEMANTIC_COMMIT_GATE_MAX_TTL_MS_V01,
    );
    return {
      preview_max_age_ms: VNEXT_SEMANTIC_COMMIT_PREVIEW_MAX_AGE_MS_V01,
    };
  }
  const capability = validation.capability;
  const expectedFingerprint = operatorPilotConfirmationContextFingerprint(
    capability,
    gate,
  );
  const expectedRef =
    expectedFingerprint === undefined
      ? null
      : createOperatorPilotConfirmationContextRef(
          capability,
          gate,
          gate.confirmed_at,
        );
  const contextRefs = (gate.operator_confirmation_basis_refs ?? []).filter(
    (ref) =>
      ref.ref_type ===
        VNEXT_SEMANTIC_COMMIT_CONFIRMATION_CONTEXT_REF_TYPE_V01 ||
      ref.compatibility_namespace ===
        VNEXT_SEMANTIC_COMMIT_CONFIRMATION_CONTEXT_NAMESPACE_V01,
  );
  const actualRef = contextRefs.length === 1 ? contextRefs[0]! : null;
  if (
    contextRefs.length !== (expectedRef === null ? 0 : 1) ||
    storedContextFingerprint !== expectedFingerprint ||
    (actualRef === null) !== (expectedRef === null) ||
    (actualRef !== null &&
      expectedRef !== null &&
      canonicalizeProtocolValueV01(actualRef) !==
        canonicalizeProtocolValueV01(expectedRef)) ||
    gateTtlFromEvaluation(
      gate.semantic_commit_gate_evaluation,
      VNEXT_OPERATOR_PILOT_GATE_TTL_MAX_MS_V01,
    ) !== capability.config.gate_ttl_ms
  ) {
    throw new Error("semantic_commit_operator_pilot_capability_mismatch");
  }
  return { preview_max_age_ms: capability.config.preview_max_age_ms };
}

function normalizeOptionalConfirmationContextFingerprint(
  value: unknown,
): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string" || !/^sha256:[a-f0-9]{64}$/.test(value)) {
    throw new Error("semantic_commit_confirmation_context_invalid");
  }
  return value;
}

function createSemanticCommitConfirmationDigest(
  material: object,
  confirmationContextFingerprint?: string,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(
      confirmationContextFingerprint === undefined
        ? material
        : {
            ...material,
            confirmation_context_fingerprint: confirmationContextFingerprint,
          },
    ),
  );
}

function confirmationContextFingerprintFromBasis(
  refs: ExternalRefV01[] | undefined,
): string | undefined {
  const matches = (refs ?? []).filter(
    (ref) =>
      ref.ref_type ===
        VNEXT_SEMANTIC_COMMIT_CONFIRMATION_CONTEXT_REF_TYPE_V01 &&
      ref.compatibility_namespace ===
        VNEXT_SEMANTIC_COMMIT_CONFIRMATION_CONTEXT_NAMESPACE_V01,
  );
  if (matches.length > 1) {
    throw new Error("semantic_commit_confirmation_context_ambiguous");
  }
  return normalizeOptionalConfirmationContextFingerprint(
    matches[0]?.source_ref,
  );
}

function gateTtlFromEvaluation(
  gate: StateTransitionSemanticCommitGateEvaluationV01,
  maximum: number = VNEXT_SEMANTIC_COMMIT_GATE_MAX_TTL_MS_V01,
): number {
  const evaluatedAt = parseStrictIsoTimestampV01(gate.evaluated_at);
  const expiresAt = parseStrictIsoTimestampV01(gate.expires_at);
  if (evaluatedAt === null || expiresAt === null) {
    throw new Error("semantic_commit_gate_ttl_invalid");
  }
  return normalizeGateTtlMs(expiresAt - evaluatedAt, maximum);
}

function addMillisecondsToTimestamp(
  value: string,
  milliseconds: number,
  field: string,
  maximum: number = VNEXT_SEMANTIC_COMMIT_GATE_MAX_TTL_MS_V01,
): string {
  const parsed = parseStrictIsoTimestampV01(value);
  if (parsed === null) throw new Error(`${field}_invalid`);
  return new Date(
    parsed + normalizeGateTtlMs(milliseconds, maximum),
  ).toISOString();
}

function createRuntimeConfirmationRef(
  preview: VNextSemanticCommitPreviewV01,
  confirmedAt: string,
): ExternalRefV01 {
  return localRef(
    "semantic_commit_confirmation",
    `confirmation:${preview.project_id}:${preview.confirmation_digest}`,
    confirmedAt,
    preview.confirmation_digest,
  );
}

function createRuntimeAuthorizedApplierRef(
  preview: VNextSemanticCommitPreviewV01,
  evaluatedAt: string,
): ExternalRefV01 {
  const identity = normalizeLocalRuntimeActorIdentity(
    preview.authorized_applier_identity,
  );
  const sourceFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      runtime_version: VNEXT_DURABLE_TRANSITION_RUNTIME_NAMESPACE_V01,
      workspace_id: preview.workspace_id,
      project_id: preview.project_id,
      decision_fingerprint: preview.decision_fingerprint,
      confirmation_digest: preview.confirmation_digest,
      authorized_applier_identity: identity,
      gate_ttl_ms: normalizeGateTtlMs(
        preview.gate_ttl_ms,
        VNEXT_OPERATOR_PILOT_GATE_TTL_MAX_MS_V01,
      ),
    }),
  );
  return localRef(
    identity.ref_type,
    identity.external_id,
    evaluatedAt,
    sourceFingerprint,
  );
}

function assertCommitInputKeys(
  input:
    | CommitVNextSemanticTransitionInputV01
    | CommitVNextSemanticTransitionWithOperatorPilotCapabilityInputV01,
  operatorPilot: boolean,
): void {
  assertRuntimeInputKeys(
    input,
    new Set([
      "workspace_id",
      "project_id",
      "proposal_id",
      "proposal_fingerprint",
      "decision_id",
      "decision_fingerprint",
      "gate_record_id",
      "gate_record_fingerprint",
      ...(operatorPilot ? ["review_window_capability"] : []),
      "clock",
      "test_options",
    ]),
  );
}

function assertRuntimeInputKeys(
  input: object,
  allowed: ReadonlySet<string>,
): void {
  for (const key of Object.keys(input)) {
    if (allowed.has(key)) continue;
    if (
      [
        "current_state_observed_at",
        "previewed_at",
        "confirmed_at",
        "gate_evaluated_at",
        "gate_expires_at",
        "eligibility_evaluated_at",
        "applied_at",
        "recorded_at",
        "generated_at",
        "observed_at",
      ].includes(key)
    ) {
      throw new Error("local_runtime_timestamp_input_forbidden");
    }
    throw new Error(`vnext_local_runtime_input_unknown_field:${key}`);
  }
}

function assertConfirmationRef(
  ref: ExternalRefV01,
  confirmedAt: string,
  digest: string,
): void {
  assertExternalRef(ref, "confirmation_observation_ref");
  if (
    ref.trust_class !== "direct_local_observation" ||
    ref.observed_at !== confirmedAt ||
    ref.source_ref !== digest
  ) {
    throw new Error("confirmation_observation_ref_mismatch");
  }
}

function assertExternalRef(ref: ExternalRefV01, field: string): void {
  const errors: string[] = [];
  validateExternalRefStructureV01(ref, `$.${field}`, {
    error(code) {
      errors.push(code);
    },
    warning() {},
  });
  if (errors.length) throw new Error(`${field}_invalid:${errors.join(",")}`);
}

function assertTimestamp(value: string, field: string): void {
  if (parseStrictIsoTimestampV01(value) === null)
    throw new Error(`${field}_invalid`);
}

function assertTimestampOrder(left: string, right: string, code: string): void {
  const leftValue = parseStrictIsoTimestampV01(left);
  const rightValue = parseStrictIsoTimestampV01(right);
  if (leftValue === null || rightValue === null || leftValue > rightValue) {
    throw new Error(code);
  }
}

function assertPreviewConfirmationAge(
  previewedAt: string,
  confirmedAt: string,
  previewMaxAgeMs: number,
): void {
  const preview = parseStrictIsoTimestampV01(previewedAt);
  const confirmed = parseStrictIsoTimestampV01(confirmedAt);
  if (
    preview === null ||
    confirmed === null ||
    confirmed < preview ||
    confirmed - preview >
      normalizePreviewMaxAgeMs(
        previewMaxAgeMs,
        VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_MAX_MS_V01,
      )
  ) {
    throw new Error("semantic_commit_preview_confirmation_window_expired");
  }
}

function assertSemanticCommitChronology(input: {
  observations: StateTransitionCurrentStateObservationV01[];
  previewed_at: string;
  confirmed_at: string;
  gate_evaluated_at: string;
  eligibility_evaluated_at: string;
  gate_expires_at: string;
}): void {
  if (input.observations.length === 0) {
    throw new Error("semantic_commit_current_state_observation_missing");
  }
  for (const observation of input.observations) {
    assertTimestampOrder(
      observation.observed_at,
      input.previewed_at,
      "semantic_commit_observation_after_preview",
    );
  }
  assertTimestampOrder(
    input.previewed_at,
    input.confirmed_at,
    "semantic_commit_confirmation_precedes_preview",
  );
  assertTimestampOrder(
    input.confirmed_at,
    input.gate_evaluated_at,
    "semantic_commit_gate_precedes_confirmation",
  );
  assertTimestampOrder(
    input.gate_evaluated_at,
    input.eligibility_evaluated_at,
    "semantic_commit_eligibility_precedes_gate",
  );
  const eligibility = parseStrictIsoTimestampV01(
    input.eligibility_evaluated_at,
  );
  const expiry = parseStrictIsoTimestampV01(input.gate_expires_at);
  if (eligibility === null || expiry === null || eligibility >= expiry) {
    throw new Error("semantic_commit_gate_expiry_invalid");
  }
}

function canonicalRefSetsEqual(
  left: ExternalRefV01[],
  right: ExternalRefV01[],
): boolean {
  return (
    canonicalizeProtocolValueV01(normalizeRefs(left)) ===
    canonicalizeProtocolValueV01(normalizeRefs(right))
  );
}

function compareProtocolCanonical(left: unknown, right: unknown): number {
  const leftCanonical = canonicalizeProtocolValueV01(left);
  const rightCanonical = canonicalizeProtocolValueV01(right);
  return leftCanonical < rightCanonical
    ? -1
    : leftCanonical > rightCanonical
      ? 1
      : 0;
}

function requireSha256Text(value: unknown, field: string): string {
  const normalized = requireText(value, `${field}_invalid`);
  if (!/^sha256:[a-f0-9]{64}$/.test(normalized)) {
    throw new Error(`${field}_invalid`);
  }
  return normalized;
}

function requireText(value: unknown, code: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(code);
  }
  return normalizeProtocolTextV01(value);
}

function requirePlainRecord(
  value: unknown,
  code: string,
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(code);
  }
  return value as Record<string, unknown>;
}

function runTestCheckpoint(
  options: VNextSemanticTransitionTestOptionsV01 | undefined,
  checkpoint: VNextSemanticTransitionTestFailureCheckpointV01,
): void {
  options?.on_checkpoint?.(checkpoint);
}

function issueCodes(value: { errors: Array<{ code: string }> }): string {
  return value.errors.map((issue) => issue.code).join(",");
}

function unpackDbInput<T>(
  dbOrInput: Database.Database | (T & { db: Database.Database }),
  maybeInput?: T,
): { db: Database.Database; input: T } {
  if (maybeInput !== undefined) {
    return { db: dbOrInput as Database.Database, input: maybeInput };
  }
  const combined = dbOrInput as T & { db: Database.Database };
  const { db, ...input } = combined;
  return { db, input: input as T };
}
