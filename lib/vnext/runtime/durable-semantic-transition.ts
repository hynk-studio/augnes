import type Database from "better-sqlite3";

import {
  VNEXT_LOCAL_SEMANTIC_STATE_NAMESPACE_V01,
  buildVNextPersistedSemanticStateV01,
  deriveVNextSemanticTargetKeyV01,
  ensureVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
  insertVNextSemanticStateEntryV01,
  readVNextCoreRecordByIdempotencyKeyV01,
  readVNextCoreRecordV01,
  readVNextSemanticStateEntryV01,
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
  parseStrictIsoTimestampV01,
  uniqueProtocolValuesV01,
  validateExternalRefStructureV01,
} from "@/lib/vnext/protocol-primitives";
import {
  evaluateReviewDecisionStateTransitionEligibilityV01,
  validateStateTransitionReceiptAgainstEligibilityV01,
} from "@/lib/vnext/state-transition-eligibility";
import {
  createEpisodeDeltaCandidateFingerprintV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "@/lib/vnext/review-decision";
import {
  buildStateTransitionReceiptV01,
  createStateTransitionApplicationResultFingerprintV01,
  validateStateTransitionReceiptV01,
} from "@/lib/vnext/state-transition-receipt";
import { validateEpisodeDeltaProposalV01 } from "@/lib/vnext/episode-delta-proposal";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import type {
  EpisodeDeltaProposalDeltaCandidateV01,
  EpisodeDeltaProposalV01,
} from "@/types/vnext/episode-delta-proposal";
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
export const VNEXT_DURABLE_TRANSITION_RUNTIME_NAMESPACE_V01 =
  "augnes.vnext.durable-semantic-transition.v0.1" as const;

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
  semantic_state: VNextPersistedSemanticStateVersionV01;
  projection: VNextSemanticStateProjectionEntryV01;
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
}

export interface PrepareVNextSemanticCommitPreviewInputV01 {
  workspace_id: string;
  project_id: string;
  proposal_id: string;
  proposal_fingerprint: string;
  decision_id: string;
  decision_fingerprint: string;
  current_state_observed_at: string;
  previewed_at: string;
}

export interface RecordVNextSemanticCommitAuthorizationInputV01 {
  preview: VNextSemanticCommitPreviewV01;
  confirmation_digest: string;
  operator_actor_ref: ExternalRefV01;
  confirmation_observation_ref: ExternalRefV01;
  authorized_applier_ref: ExternalRefV01;
  confirmed_at: string;
  gate_evaluated_at: string;
  gate_expires_at: string;
  eligibility_evaluated_at: string;
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
  applied_at: string;
  recorded_at: string;
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
  ensureVNextDurableSemanticStoreSchemaV01(db);
  return withImmediateTransaction(db, () => ({
    proposal_record: insertVNextCoreRecordV01(db, {
      record_kind: "episode_delta_proposal",
      record_id: input.proposal.proposal_id,
      workspace_id: input.proposal.workspace_id,
      project_id: input.proposal.project_id,
      fingerprint: input.proposal.integrity.fingerprint,
      idempotency_key: null,
      payload: input.proposal,
      created_at: input.proposal.created_at,
    }),
    decision_record: insertVNextCoreRecordV01(db, {
      record_kind: "review_decision",
      record_id: input.decision.decision_id,
      workspace_id: input.decision.workspace_id,
      project_id: input.decision.project_id,
      fingerprint: input.decision.integrity.fingerprint,
      idempotency_key: null,
      payload: input.decision,
      created_at: input.decision.decided_at,
    }),
  }));
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
  assertTimestamp(input.current_state_observed_at, "current_state_observed_at");
  assertTimestamp(input.previewed_at, "previewed_at");
  assertTimestampOrder(
    input.current_state_observed_at,
    input.previewed_at,
    "semantic_commit_observation_after_preview",
  );
  const { proposal, decision } = loadReviewMaterial({ db, ...input });
  const transition = resolveTransitionMaterial(proposal, decision);
  const currentState = readCurrentStateSnapshot(
    db,
    proposal,
    transition.target_refs,
    input.current_state_observed_at,
  );
  const intendedEffects = derivePreviewEffects({
    proposal,
    decision,
    transition,
    observations: currentState.observations,
    projections: currentState.projections,
    previewed_at: input.previewed_at,
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
    previewed_at: input.previewed_at,
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
    confirmation_digest: createProtocolSha256V01(
      canonicalizeProtocolValueV01(material),
    ),
    eligibility_input: null,
    eligibility: null,
  };
}

export function recordVNextSemanticCommitAuthorizationV01(
  input: RecordVNextSemanticCommitAuthorizationInputV01 & { db: Database.Database },
): VNextSemanticCommitAuthorizationResultV01;
export function recordVNextSemanticCommitAuthorizationV01(
  db: Database.Database,
  input: RecordVNextSemanticCommitAuthorizationInputV01,
): VNextSemanticCommitAuthorizationResultV01;
export function recordVNextSemanticCommitAuthorizationV01(
  dbOrInput:
    | Database.Database
    | (RecordVNextSemanticCommitAuthorizationInputV01 & { db: Database.Database }),
  maybeInput?: RecordVNextSemanticCommitAuthorizationInputV01,
): VNextSemanticCommitAuthorizationResultV01 {
  const { db, input } = unpackDbInput(dbOrInput, maybeInput);
  for (const [name, value] of [
    ["confirmed_at", input.confirmed_at],
    ["gate_evaluated_at", input.gate_evaluated_at],
    ["gate_expires_at", input.gate_expires_at],
    ["eligibility_evaluated_at", input.eligibility_evaluated_at],
  ] as const) assertTimestamp(value, name);
  return withImmediateTransaction(db, () => {
    const exactPreview = prepareVNextSemanticCommitPreviewV01(db, {
      workspace_id: input.preview.workspace_id,
      project_id: input.preview.project_id,
      proposal_id: input.preview.proposal_id,
      proposal_fingerprint: input.preview.proposal_fingerprint,
      decision_id: input.preview.decision_id,
      decision_fingerprint: input.preview.decision_fingerprint,
      current_state_observed_at:
        input.preview.current_state_observations[0]!.observed_at,
      previewed_at: input.preview.previewed_at,
    });
    if (
      canonicalizeProtocolValueV01(exactPreview) !==
        canonicalizeProtocolValueV01(input.preview) ||
      input.confirmation_digest !== exactPreview.confirmation_digest
    ) throw new Error("semantic_commit_confirmation_digest_mismatch");
    const { proposal, decision } = loadReviewMaterial({
      db,
      ...input.preview,
    });
    assertExactRef(input.operator_actor_ref, decision.actor_ref, "operator_actor_mismatch");
    assertConfirmationRef(
      input.confirmation_observation_ref,
      input.confirmed_at,
      input.confirmation_digest,
    );
    assertProviderNeutralRef(input.authorized_applier_ref, "authorized_applier_ref");
    assertSemanticCommitChronology({
      observations: exactPreview.current_state_observations,
      previewed_at: exactPreview.previewed_at,
      confirmed_at: input.confirmed_at,
      gate_evaluated_at: input.gate_evaluated_at,
      eligibility_evaluated_at: input.eligibility_evaluated_at,
      gate_expires_at: input.gate_expires_at,
    });
    const gateRecordId = deriveSemanticCommitGateRecordId({
      workspace_id: proposal.workspace_id,
      project_id: proposal.project_id,
      decision_fingerprint: decision.integrity.fingerprint,
      confirmation_digest: input.confirmation_digest,
      confirmed_at: input.confirmed_at,
      authorized_applier_ref: input.authorized_applier_ref,
    });
    const gate = buildSemanticCommitGateEvaluation({
      preview: exactPreview,
      decision,
      confirmation_observation_ref: input.confirmation_observation_ref,
      authorized_applier_ref: input.authorized_applier_ref,
      gate_record_id: gateRecordId,
      evaluated_at: input.gate_evaluated_at,
      expires_at: input.gate_expires_at,
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
      input.eligibility_evaluated_at,
      lineage,
    );
    const gateEligibility = evaluateReviewDecisionStateTransitionEligibilityV01(
      gateEligibilityInput,
    );
    if (gateEligibility.status !== "eligible") {
      throw new Error(`semantic_transition_not_eligible:${issueCodes(gateEligibility)}`);
    }
    const gateRecord = buildGateRecord({
      gate_record_id: gateRecordId,
      preview: exactPreview,
      operator_actor_ref: input.operator_actor_ref,
      confirmation_observation_ref: input.confirmation_observation_ref,
      confirmed_at: input.confirmed_at,
      gate,
      eligibility_evaluated_at: input.eligibility_evaluated_at,
      eligibility_precondition_fingerprint: gateEligibility.precondition_fingerprint,
    });
    const write = insertVNextCoreRecordV01(db, {
      record_kind: "semantic_commit_gate",
      record_id: gateRecord.gate_record_id,
      workspace_id: gateRecord.workspace_id,
      project_id: gateRecord.project_id,
      fingerprint: gateRecord.integrity.fingerprint,
      idempotency_key: input.confirmation_digest,
      payload: gateRecord,
      created_at: input.confirmed_at,
    });
    return {
      status: write.status,
      gate_record: gateRecord,
      eligibility_input: gateEligibilityInput,
      eligibility: gateEligibility,
    };
  });
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
  assertTimestamp(input.applied_at, "applied_at");
  assertTimestamp(input.recorded_at, "recorded_at");
  return withImmediateTransaction(db, () => {
    const { proposal, decision } = loadReviewMaterial({ db, ...input });
    const expectedIdempotency = transitionIdempotencyKey(decision);
    const existingReceiptRecord = readVNextCoreRecordByIdempotencyKeyV01(
      db,
      {
        record_kind: "state_transition_receipt",
        workspace_id: input.workspace_id,
        project_id: input.project_id,
        idempotency_key: expectedIdempotency,
      },
    );
    const gate = loadGateRecord(db, input, proposal, decision, {
      allow_historical_snapshot: existingReceiptRecord !== null,
    });
    if (
      gate.proposal_id !== proposal.proposal_id ||
      gate.proposal_fingerprint !== proposal.integrity.fingerprint ||
      gate.decision_id !== decision.decision_id ||
      gate.decision_fingerprint !== decision.integrity.fingerprint
    ) throw new Error("semantic_commit_gate_binding_mismatch");
    const candidate = phaseAWriterCandidate(proposal, decision);
    const targetRef = normalizeExternalRefPrimitiveV01(candidate.target_refs[0]!);
    const targetKey = deriveVNextSemanticTargetKeyV01(targetRef);
    const expectedState = buildVNextPersistedSemanticStateV01({
      proposal,
      candidate_id: candidate.candidate_id,
      target_ref: targetRef,
      source_decision: {
        decision_id: decision.decision_id,
        decision_fingerprint: decision.integrity.fingerprint,
      },
      created_at: input.applied_at,
    });
    const current = readVNextSemanticStateEntryV01(db, {
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      target_key: targetKey,
    });
    const gateEligibilityInput = eligibilityInputFor(
      proposal,
      decision,
      gate.current_state_observations,
      gate.semantic_commit_gate_evaluation,
      gate.eligibility_evaluated_at,
    );
    const gateEligibility = evaluateReviewDecisionStateTransitionEligibilityV01(
      gateEligibilityInput,
    );
    if (
      gateEligibility.status !== "eligible" ||
      gateEligibility.precondition_fingerprint !==
        gate.eligibility_precondition_fingerprint
    ) throw new Error("semantic_commit_precondition_mismatch");

    if (existingReceiptRecord) {
      const receipt = existingReceiptRecord.payload as StateTransitionReceiptV01;
      const receiptValidation = validateStateTransitionReceiptV01(receipt);
      if (
        receiptValidation.status !== "valid" ||
        existingReceiptRecord.fingerprint !== receipt.integrity.fingerprint ||
        receipt.idempotency_key !== expectedIdempotency ||
        receipt.semantic_commit_gate.evaluation_ref.external_id !==
          gate.semantic_commit_gate_evaluation.evaluation_ref.external_id
      ) throw new Error("conflicting_result");
      const effect = receipt.effects[0];
      if (
        receipt.effects.length !== 1 ||
        !effect ||
        effect.after_state.presence !== "present" ||
        effect.after_state.state_fingerprint !==
          expectedState.state_content_fingerprint ||
        !current ||
        current.revision !== 1 ||
        current.state_fingerprint !== effect.after_state.state_fingerprint ||
        canonicalizeProtocolValueV01(current.state_ref) !==
          canonicalizeProtocolValueV01(effect.after_state.state_ref)
      ) throw new Error("state_replay_conflict");
      const relation = validateStateTransitionReceiptAgainstEligibilityV01({
        ...gateEligibilityInput,
        receipt,
      });
      if (relation.status !== "valid") throw new Error("conflicting_result");
      const semanticStateRecord = readVNextCoreRecordV01(db, {
        record_kind: "semantic_state",
        record_id: current.state_ref.external_id,
        workspace_id: input.workspace_id,
        project_id: input.project_id,
      });
      if (!semanticStateRecord) throw new Error("state_replay_conflict");
      return {
        status: "exact_replay",
        semantic_state:
          semanticStateRecord.payload as VNextPersistedSemanticStateVersionV01,
        projection: current,
        transition_receipt: receipt,
        receipt,
        state_records: [
          semanticStateRecord.payload as VNextPersistedSemanticStateVersionV01,
        ],
        projection_entries: [current],
        eligibility_input: gateEligibilityInput,
        eligibility: gateEligibility,
      };
    }
    if (current) throw new Error("semantic_commit_stale_current_state");
    if (parseStrictIsoTimestampV01(input.applied_at)! > parseStrictIsoTimestampV01(gate.semantic_commit_gate_evaluation.expires_at)!) {
      throw new Error("semantic_commit_gate_expired");
    }
    const storedBefore = gate.current_state_observations[0]!;
    const before = createAbsentObservation(
      proposal.workspace_id,
      proposal.project_id,
      targetRef,
      targetKey,
      storedBefore.observed_at,
    );
    if (
      canonicalizeProtocolValueV01(before) !==
      canonicalizeProtocolValueV01(storedBefore)
    ) throw new Error("semantic_commit_current_state_observation_mismatch");
    if (before.presence !== "absent") throw new Error("phase_a_create_requires_absent_state");
    const eligibilityInput = eligibilityInputFor(
      proposal,
      decision,
      [before],
      gate.semantic_commit_gate_evaluation,
      gate.eligibility_evaluated_at,
    );
    const eligibility = evaluateReviewDecisionStateTransitionEligibilityV01(
      eligibilityInput,
    );
    if (
      eligibility.status !== "eligible" ||
      eligibility.precondition_fingerprint !==
        gate.eligibility_precondition_fingerprint
    ) throw new Error("semantic_commit_precondition_mismatch");
    const afterState = {
      presence: "present" as const,
      state_ref: expectedState.state_ref,
      state_fingerprint: expectedState.state_content_fingerprint,
    };
    const applicationResult = createStateTransitionApplicationResultFingerprintV01(
      {
        target_ref: targetRef,
        operation: "create",
        before_state: { presence: "absent", state_ref: null, state_fingerprint: null },
        after_state: afterState,
      },
      input.applied_at,
    );
    const afterObservationRef = localRef(
      "semantic_state_application_observation",
      `application:${expectedState.semantic_state_record_id}`,
      input.applied_at,
      applicationResult,
    );
    const durableRecordRef = localRef(
      "durable_semantic_state_record",
      expectedState.semantic_state_record_id,
      input.recorded_at,
      applicationResult,
    );
    const proposalRef = protocolRef(
      "episode_delta_proposal",
      proposal.proposal_id,
      "derived_interpretation",
      proposal.created_at,
      proposal.integrity.fingerprint,
    );
    const decisionRef = protocolRef(
      "review_decision",
      decision.decision_id,
      "user_declaration",
      decision.decided_at,
      decision.integrity.fingerprint,
    );
    const receiptInput: StateTransitionReceiptBuilderInputV01 = {
      workspace_id: proposal.workspace_id,
      project_id: proposal.project_id,
      source_proposal: {
        proposal_version: proposal.proposal_version,
        proposal_id: proposal.proposal_id,
        proposal_fingerprint: proposal.integrity.fingerprint,
      },
      source_decision: {
        decision_version: decision.decision_version,
        decision_id: decision.decision_id,
        decision_fingerprint: decision.integrity.fingerprint,
      },
      source_candidate: decision.candidate,
      requested_transition_intent: {
        intent_id: decision.requested_transition_intent!.intent_id,
        transition_kind: decision.requested_transition_intent!.transition_kind,
        target_refs: decision.requested_transition_intent!.target_refs,
      },
      effects: [{
        target_ref: targetRef,
        operation: "create",
        before_state: { presence: "absent", state_ref: null, state_fingerprint: null },
        after_state: afterState,
        before_state_observation_ref: before.observation_ref,
        after_application_observation_ref: afterObservationRef,
        durable_record_ref: durableRecordRef,
        source_refs: normalizeRefs([
          proposalRef,
          decisionRef,
          before.observation_ref,
          gate.semantic_commit_gate_evaluation.evaluation_ref,
          afterObservationRef,
          durableRecordRef,
        ]),
      }],
      applied_at: input.applied_at,
      recorded_at: input.recorded_at,
      applied_by_ref:
        gate.semantic_commit_gate_evaluation.authorized_applier_ref,
      semantic_commit_gate: {
        status: "authorized",
        evaluation_ref: gate.semantic_commit_gate_evaluation.evaluation_ref,
        evaluated_at: gate.semantic_commit_gate_evaluation.evaluated_at,
        expires_at: gate.semantic_commit_gate_evaluation.expires_at,
      },
      eligibility_precondition_fingerprint: eligibility.precondition_fingerprint,
      source_refs: normalizeRefs([
        proposalRef,
        decisionRef,
        before.observation_ref,
        gate.semantic_commit_gate_evaluation.evaluation_ref,
        gate.semantic_commit_gate_evaluation.authorized_applier_ref,
        afterObservationRef,
        durableRecordRef,
      ]),
      compatibility: {
        source_contracts: [proposal.proposal_version, decision.decision_version],
        unmapped_fields: [],
        warnings: [
          "Local application observations do not authenticate the human identity behind the synthetic decision actor.",
        ],
        external_refs: [],
      },
      authority_notes: [
        "The injected local writer applied this receipt atomically; the receipt builder itself performed no write.",
      ],
    };
    const receipt = buildStateTransitionReceiptV01(receiptInput);
    if (receipt.idempotency_key !== expectedIdempotency) {
      throw new Error("transition_idempotency_mismatch");
    }
    if (validateStateTransitionReceiptV01(receipt).status !== "valid") {
      throw new Error("state_transition_receipt_invalid");
    }
    const relation = validateStateTransitionReceiptAgainstEligibilityV01({
      ...eligibilityInput,
      receipt,
    });
    if (relation.status !== "valid") {
      throw new Error(`state_transition_receipt_relation_invalid:${issueCodes(relation)}`);
    }
    insertVNextCoreRecordV01(db, {
      record_kind: "semantic_state",
      record_id: expectedState.semantic_state_record_id,
      workspace_id: proposal.workspace_id,
      project_id: proposal.project_id,
      fingerprint: expectedState.integrity.fingerprint,
      idempotency_key: null,
      payload: expectedState,
      created_at: input.applied_at,
    });
    const projection: VNextSemanticStateProjectionEntryV01 = {
      workspace_id: proposal.workspace_id,
      project_id: proposal.project_id,
      presence: "present",
      target_key: targetKey,
      target_ref: targetRef,
      state_ref: expectedState.state_ref,
      state_fingerprint: expectedState.state_content_fingerprint,
      bounded_state_summary: expectedState.bounded_state_summary,
      source_proposal_id: proposal.proposal_id,
      source_proposal_fingerprint: proposal.integrity.fingerprint,
      source_candidate_id: candidate.candidate_id,
      source_candidate_fingerprint:
        createEpisodeDeltaCandidateFingerprintV01(candidate),
      source_transition_receipt_id: receipt.transition_receipt_id,
      source_transition_receipt_fingerprint: receipt.integrity.fingerprint,
      revision: 1,
      updated_at: input.recorded_at,
    };
    insertVNextSemanticStateEntryV01(db, projection);
    insertVNextCoreRecordV01(db, {
      record_kind: "state_transition_receipt",
      record_id: receipt.transition_receipt_id,
      workspace_id: receipt.workspace_id,
      project_id: receipt.project_id,
      fingerprint: receipt.integrity.fingerprint,
      idempotency_key: receipt.idempotency_key,
      payload: receipt,
      created_at: receipt.recorded_at,
    });
    return {
      status: "applied",
      semantic_state: expectedState,
      projection,
      transition_receipt: receipt,
      receipt,
      state_records: [expectedState],
      projection_entries: [projection],
      eligibility_input: eligibilityInput,
      eligibility,
    };
  });
}

function assertProposalDecision(
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
): void {
  const proposalValidation = validateEpisodeDeltaProposalV01(proposal);
  if (proposalValidation.status !== "valid") throw new Error("episode_delta_proposal_invalid");
  const decisionValidation = validateReviewDecisionV01(decision);
  if (decisionValidation.status !== "valid") throw new Error("review_decision_invalid");
  const relation = validateReviewDecisionAgainstEpisodeDeltaProposalV01(
    decision,
    proposal,
  );
  if (relation.status !== "valid") throw new Error("review_decision_proposal_relation_invalid");
}

function loadReviewMaterial(input: {
  db: Database.Database;
  workspace_id: string;
  project_id: string;
  proposal_id: string;
  proposal_fingerprint: string;
  decision_id: string;
  decision_fingerprint: string;
}): { proposal: EpisodeDeltaProposalV01; decision: ReviewDecisionV01 } {
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
  if (proposalRecord.fingerprint !== input.proposal_fingerprint) throw new Error("persisted_proposal_fingerprint_mismatch");
  if (decisionRecord.fingerprint !== input.decision_fingerprint) throw new Error("persisted_decision_fingerprint_mismatch");
  const proposal = proposalRecord.payload as EpisodeDeltaProposalV01;
  const decision = decisionRecord.payload as ReviewDecisionV01;
  assertProposalDecision(proposal, decision);
  return { proposal, decision };
}

interface ResolvedTransitionMaterialV01 {
  source_candidate: EpisodeDeltaProposalDeltaCandidateV01;
  state_material_candidate: EpisodeDeltaProposalDeltaCandidateV01 | null;
  transition_kind: Exclude<ReviewDecisionRequestedTransitionKindV01, "other">;
  target_refs: ExternalRefV01[];
}

interface PersistedCurrentStateSnapshotV01 {
  observations: StateTransitionCurrentStateObservationV01[];
  projections: Array<VNextSemanticStateProjectionEntryV01 | null>;
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
  if (decision.decision === "supersede") {
    const superseding = decision.lineage.superseding_candidate;
    stateMaterialCandidate = superseding
      ? proposal.proposed_deltas.find(
          (item) => item.candidate_id === superseding.candidate_id,
        ) ?? null
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
  if (
    targetRefs.length === 0 ||
    targetRefs.length > 64 ||
    !canonicalRefSetsEqual(
      targetRefs,
      (stateMaterialCandidate ?? sourceCandidate).target_refs,
    )
  ) {
    throw new Error("semantic_commit_target_set_mismatch");
  }
  if (
    decision.decision === "supersede" &&
    !canonicalRefSetsEqual(sourceCandidate.target_refs, targetRefs)
  ) {
    throw new Error("semantic_commit_supersede_target_set_mismatch");
  }
  return {
    source_candidate: sourceCandidate,
    state_material_candidate: stateMaterialCandidate,
    transition_kind: expectedKind,
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
  for (const targetRef of targetRefs) {
    const targetKey = deriveVNextSemanticTargetKeyV01(targetRef);
    const projection = readVNextSemanticStateEntryV01(db, {
      workspace_id: proposal.workspace_id,
      project_id: proposal.project_id,
      target_key: targetKey,
    });
    projections.push(projection);
    observations.push(
      projection
        ? createPresentObservation(
            proposal.workspace_id,
            proposal.project_id,
            targetRef,
            targetKey,
            projection,
            observedAt,
          )
        : createAbsentObservation(
            proposal.workspace_id,
            proposal.project_id,
            targetRef,
            targetKey,
            observedAt,
          ),
    );
  }
  return { observations, projections };
}

function derivePreviewEffects(input: {
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
  transition: ResolvedTransitionMaterialV01;
  observations: StateTransitionCurrentStateObservationV01[];
  projections: Array<VNextSemanticStateProjectionEntryV01 | null>;
  expected_revisions?: number[];
  previewed_at: string;
}): VNextSemanticCommitPreviewEffectV01[] {
  return input.transition.target_refs.map((targetRef, index) => {
    const observation = input.observations[index];
    const projection = input.projections[index];
    if (!observation) throw new Error("semantic_commit_current_state_missing");
    let operation: StateTransitionReceiptOperationV01;
    if (input.decision.decision === "accept") {
      operation = observation.presence === "absent" ? "create" : "replace";
    } else if (input.decision.decision === "supersede") {
      if (observation.presence !== "present") {
        throw new Error("semantic_commit_supersede_requires_present_state");
      }
      operation = "supersede";
    } else {
      if (observation.presence !== "present") {
        throw new Error("semantic_commit_retract_requires_present_state");
      }
      operation = "retract";
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
      input.expected_revisions?.[index] ??
      (projection ? projection.revision + 1 : 1);
    if (
      !Number.isSafeInteger(expectedRevision) ||
      expectedRevision < 1 ||
      (observation.presence === "absent" && expectedRevision !== 1) ||
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
): LoadedAppliedLineageV01 {
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
  if (!priorDecisionRecord) throw new Error("semantic_commit_prior_decision_missing");
  const priorDecision = priorDecisionRecord.payload as ReviewDecisionV01;
  if (
    priorDecisionRecord.fingerprint !== declared.decision_fingerprint ||
    priorDecision.integrity?.fingerprint !== declared.decision_fingerprint
  ) {
    throw new Error("semantic_commit_prior_decision_fingerprint_mismatch");
  }
  assertProposalDecision(proposal, priorDecision);

  let receiptBinding: VNextSemanticCommitLineageBindingV01 | null = null;
  if (expectedBindings) {
    if (expectedBindings.prior_state_transition_receipt_bindings.length !== 1) {
      throw new Error("semantic_commit_prior_receipt_binding_invalid");
    }
    receiptBinding = expectedBindings.prior_state_transition_receipt_bindings[0]!;
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
  if (!priorReceiptRecord) throw new Error("semantic_commit_prior_receipt_missing");
  const priorReceipt = priorReceiptRecord.payload as StateTransitionReceiptV01;
  const priorReceiptValidation = validateStateTransitionReceiptV01(priorReceipt);
  if (
    priorReceiptValidation.status !== "valid" ||
    priorReceiptRecord.fingerprint !== receiptBinding.fingerprint ||
    priorReceipt.integrity?.fingerprint !== receiptBinding.fingerprint
  ) {
    throw new Error("semantic_commit_prior_receipt_invalid");
  }
  return {
    prior_review_decisions: [priorDecision],
    prior_state_transition_receipts: [priorReceipt],
  };
}

function phaseAWriterCandidate(
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
): EpisodeDeltaProposalDeltaCandidateV01 {
  if (
    decision.decision !== "accept" ||
    decision.requested_transition_intent?.transition_kind !==
      "semantic_candidate_apply" ||
    decision.requested_transition_intent.target_refs.length !== 1
  ) throw new Error("phase_a_accept_create_only");
  const candidate = proposal.proposed_deltas.find(
    (item) => item.candidate_id === decision.candidate.candidate_id,
  );
  if (!candidate || candidate.target_refs.length !== 1) throw new Error("phase_a_single_target_required");
  return candidate;
}

function createAbsentObservation(
  workspaceId: string,
  projectId: string,
  targetRef: ExternalRefV01,
  targetKey: string,
  observedAt: string,
): StateTransitionCurrentStateObservationV01 {
  const fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      observation_version: "vnext_semantic_state_store_observation.v0.1",
      workspace_id: workspaceId,
      project_id: projectId,
      target_key: targetKey,
      presence: "absent",
      revision: 0,
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
    source_refs: [observationRef],
  };
}

function createPresentObservation(
  workspaceId: string,
  projectId: string,
  targetRef: ExternalRefV01,
  targetKey: string,
  projection: VNextSemanticStateProjectionEntryV01,
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
    projection.revision,
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
  revision: number,
  observedAt: string,
): StateTransitionCurrentStateObservationV01 {
  assertExternalRef(stateRef, "semantic_state_projection.state_ref");
  requireSha256Text(stateFingerprint, "state_fingerprint");
  if (!Number.isSafeInteger(revision) || revision < 1) {
    throw new Error("semantic_state_projection_revision_invalid");
  }
  const fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      observation_version: "vnext_semantic_state_store_observation.v0.1",
      workspace_id: workspaceId,
      project_id: projectId,
      target_key: targetKey,
      presence: "present",
      state_ref: normalizeExternalRefPrimitiveV01(stateRef),
      state_fingerprint: stateFingerprint,
      revision,
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
    source_refs: normalizeRefs([stateRef, observationRef]),
  };
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
    prior_state_transition_receipts:
      lineage.prior_state_transition_receipts,
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
              state_fingerprint:
                requireSha256Text(
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
    operator_actor_ref: normalizeExternalRefPrimitiveV01(input.operator_actor_ref),
    confirmation_observation_ref: normalizeExternalRefPrimitiveV01(input.confirmation_observation_ref),
    current_state_observations: input.preview.current_state_observations,
    intended_effects: input.preview.intended_effects,
    prior_review_decision_bindings:
      input.preview.prior_review_decision_bindings,
    prior_state_transition_receipt_bindings:
      input.preview.prior_state_transition_receipt_bindings,
    semantic_commit_gate_evaluation: input.gate,
    eligibility_evaluated_at: input.eligibility_evaluated_at,
    eligibility_precondition_fingerprint: input.eligibility_precondition_fingerprint,
    integrity: {
      algorithm: "sha256" as const,
      fingerprint_scope: "semantic_commit_gate_record_without_integrity_fingerprint" as const,
      fingerprint: "sha256:pending",
    },
  };
  const fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      ...withoutFingerprint,
      integrity: { ...withoutFingerprint.integrity, fingerprint: undefined },
    }),
  );
  return { ...withoutFingerprint, integrity: { ...withoutFingerprint.integrity, fingerprint } };
}

function rebuildSemanticCommitPreviewFromGateSnapshot(
  db: Database.Database,
  proposal: EpisodeDeltaProposalV01,
  decision: ReviewDecisionV01,
  gate: VNextSemanticCommitGateRecordV01,
): VNextSemanticCommitPreviewV01 {
  const transition = resolveTransitionMaterial(proposal, decision);
  const observationByTarget = new Map<string, StateTransitionCurrentStateObservationV01>();
  for (const value of gate.current_state_observations) {
    const observation = requirePlainRecord(
      value,
      "semantic_commit_gate_current_state_observation_invalid",
    ) as unknown as StateTransitionCurrentStateObservationV01;
    assertExternalRef(observation.target_ref, "current_state_observation.target_ref");
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
    let expectedObservation: StateTransitionCurrentStateObservationV01;
    if (storedObservation.presence === "absent") {
      if (storedEffect.expected_revision !== 1) {
        throw new Error("semantic_commit_expected_revision_invalid");
      }
      expectedObservation = createAbsentObservation(
        proposal.workspace_id,
        proposal.project_id,
        targetRef,
        targetKey,
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
        storedEffect.expected_revision - 1,
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
    expectedRevisions.push(storedEffect.expected_revision);
  }
  const intendedEffects = derivePreviewEffects({
    proposal,
    decision,
    transition,
    observations,
    projections: observations.map(() => null),
    expected_revisions: expectedRevisions,
    previewed_at: gate.previewed_at,
  });
  const lineage = loadAppliedLineageFromStore(
    db,
    proposal,
    decision,
    observations,
    {
      prior_review_decision_bindings:
        gate.prior_review_decision_bindings,
      prior_state_transition_receipt_bindings:
        gate.prior_state_transition_receipt_bindings,
    },
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
    confirmation_digest: createProtocolSha256V01(
      canonicalizeProtocolValueV01(material),
    ),
    eligibility_input: null,
    eligibility: null,
  };
}

const gateRecordKeys = new Set([
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

function parseGateRecordPayload(value: unknown): VNextSemanticCommitGateRecordV01 {
  const gate = requirePlainRecord(value, "semantic_commit_gate_payload_invalid");
  if (
    Object.keys(gate).some((key) => !gateRecordKeys.has(key)) ||
    Object.keys(gate).length !== gateRecordKeys.size
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
  if (gate.gate_record_version !== VNEXT_SEMANTIC_COMMIT_GATE_RECORD_VERSION_V01) {
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
  options: { allow_historical_snapshot: boolean },
): VNextSemanticCommitGateRecordV01 {
  const record = readVNextCoreRecordV01(db, {
    record_kind: "semantic_commit_gate",
    record_id: input.gate_record_id,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
  });
  if (!record) throw new Error("semantic_commit_gate_missing");
  if (record.fingerprint !== input.gate_record_fingerprint) throw new Error("semantic_commit_gate_fingerprint_mismatch");
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
  assertExactRef(gate.operator_actor_ref, decision.actor_ref, "operator_actor_mismatch");
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
  );
  if (!options.allow_historical_snapshot) {
    const livePreview = prepareVNextSemanticCommitPreviewV01(db, {
      workspace_id: proposal.workspace_id,
      project_id: proposal.project_id,
      proposal_id: proposal.proposal_id,
      proposal_fingerprint: proposal.integrity.fingerprint,
      decision_id: decision.decision_id,
      decision_fingerprint: decision.integrity.fingerprint,
      current_state_observed_at:
        rebuiltPreview.current_state_observations[0]!.observed_at,
      previewed_at: rebuiltPreview.previewed_at,
    });
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
    gate_evaluated_at:
      gate.semantic_commit_gate_evaluation.evaluated_at,
    eligibility_evaluated_at: gate.eligibility_evaluated_at,
    gate_expires_at: gate.semantic_commit_gate_evaluation.expires_at,
  });
  const expectedGateId = deriveSemanticCommitGateRecordId({
    workspace_id: proposal.workspace_id,
    project_id: proposal.project_id,
    decision_fingerprint: decision.integrity.fingerprint,
    confirmation_digest: rebuiltPreview.confirmation_digest,
    confirmed_at: gate.confirmed_at,
    authorized_applier_ref:
      gate.semantic_commit_gate_evaluation.authorized_applier_ref,
  });
  const expectedGateEvaluation = buildSemanticCommitGateEvaluation({
    preview: rebuiltPreview,
    decision,
    confirmation_observation_ref: gate.confirmation_observation_ref,
    authorized_applier_ref:
      gate.semantic_commit_gate_evaluation.authorized_applier_ref,
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
  );
  const eligibilityInput = eligibilityInputFor(
    proposal,
    decision,
    rebuiltPreview.current_state_observations,
    expectedGateEvaluation,
    gate.eligibility_evaluated_at,
    lineage,
  );
  const eligibility = evaluateReviewDecisionStateTransitionEligibilityV01(
    eligibilityInput,
  );
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
      target_refs: normalizeRefs(decision.requested_transition_intent!.target_refs),
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

function localRef(refType: string, externalId: string, observedAt: string, sourceRef: string): ExternalRefV01 {
  return protocolRef(refType, externalId, "direct_local_observation", observedAt, sourceRef);
}

function normalizeRefs(refs: ExternalRefV01[]): ExternalRefV01[] {
  return uniqueProtocolValuesV01(refs.map(normalizeExternalRefPrimitiveV01)).sort(compareExternalRefsV01);
}

function assertExactRef(actual: ExternalRefV01, expected: ExternalRefV01, code: string): void {
  if (canonicalizeProtocolValueV01(normalizeExternalRefPrimitiveV01(actual)) !== canonicalizeProtocolValueV01(normalizeExternalRefPrimitiveV01(expected))) throw new Error(code);
}

function assertProviderNeutralRef(ref: ExternalRefV01, field: string): void {
  assertExternalRef(ref, field);
  if (ref.provider != null || ref.host != null) throw new Error(`${field}_provider_specific`);
}

function assertConfirmationRef(ref: ExternalRefV01, confirmedAt: string, digest: string): void {
  assertExternalRef(ref, "confirmation_observation_ref");
  if (ref.trust_class !== "direct_local_observation" || ref.observed_at !== confirmedAt || ref.source_ref !== digest) {
    throw new Error("confirmation_observation_ref_mismatch");
  }
}

function assertExternalRef(ref: ExternalRefV01, field: string): void {
  const errors: string[] = [];
  validateExternalRefStructureV01(ref, `$.${field}`, {
    error(code) { errors.push(code); },
    warning() {},
  });
  if (errors.length) throw new Error(`${field}_invalid:${errors.join(",")}`);
}

function assertTimestamp(value: string, field: string): void {
  if (parseStrictIsoTimestampV01(value) === null) throw new Error(`${field}_invalid`);
}

function assertTimestampOrder(
  left: string,
  right: string,
  code: string,
): void {
  const leftValue = parseStrictIsoTimestampV01(left);
  const rightValue = parseStrictIsoTimestampV01(right);
  if (leftValue === null || rightValue === null || leftValue > rightValue) {
    throw new Error(code);
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
