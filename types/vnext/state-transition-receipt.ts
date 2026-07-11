import type { ExternalRefV01 } from "./external-ref";
import {
  EPISODE_DELTA_PROPOSAL_VERSION_V01,
  type EpisodeDeltaProposalV01,
} from "./episode-delta-proposal";
import {
  REVIEW_DECISION_VERSION_V01,
  type ReviewDecisionRequestedTransitionKindV01,
  type ReviewDecisionV01,
} from "./review-decision";

export const STATE_TRANSITION_RECEIPT_VERSION_V01 =
  "state_transition_receipt.v0.1" as const;
export const STATE_TRANSITION_RECEIPT_CANONICALIZATION_V01 =
  "augnes-json-c14n-v0_1" as const;

export const STATE_TRANSITION_RECEIPT_OPERATIONS_V01 = [
  "create",
  "replace",
  "supersede",
  "retract",
] as const;

export const STATE_TRANSITION_RECEIPT_STATE_PRESENCES_V01 = [
  "absent",
  "present",
] as const;

export const STATE_TRANSITION_RECEIPT_OBSERVATION_TRUST_CLASSES_V01 = [
  "direct_local_observation",
  "verified_external_observation",
] as const;

export type StateTransitionReceiptOperationV01 =
  (typeof STATE_TRANSITION_RECEIPT_OPERATIONS_V01)[number];
export type StateTransitionReceiptStatePresenceV01 =
  (typeof STATE_TRANSITION_RECEIPT_STATE_PRESENCES_V01)[number];
export type StateTransitionReceiptObservationTrustClassV01 =
  (typeof STATE_TRANSITION_RECEIPT_OBSERVATION_TRUST_CLASSES_V01)[number];

export interface StateTransitionReceiptSourceProposalBindingV01 {
  proposal_version: typeof EPISODE_DELTA_PROPOSAL_VERSION_V01;
  proposal_id: string;
  proposal_fingerprint: string;
}

export interface StateTransitionReceiptSourceDecisionBindingV01 {
  decision_version: typeof REVIEW_DECISION_VERSION_V01;
  decision_id: string;
  decision_fingerprint: string;
}

export interface StateTransitionReceiptSourceCandidateBindingV01 {
  candidate_id: string;
  candidate_fingerprint: string;
}

export interface StateTransitionReceiptRequestedTransitionIntentBindingV01 {
  intent_id: string;
  transition_kind: ReviewDecisionRequestedTransitionKindV01;
  target_refs: ExternalRefV01[];
}

export interface StateTransitionReceiptAbsentStateSnapshotV01 {
  presence: "absent";
  state_ref: null;
  state_fingerprint: null;
}

export interface StateTransitionReceiptPresentStateSnapshotV01 {
  presence: "present";
  state_ref: ExternalRefV01;
  state_fingerprint: string;
}

export type StateTransitionReceiptStateSnapshotV01 =
  | StateTransitionReceiptAbsentStateSnapshotV01
  | StateTransitionReceiptPresentStateSnapshotV01;

export interface StateTransitionReceiptEffectV01 {
  effect_id: string;
  target_ref: ExternalRefV01;
  operation: StateTransitionReceiptOperationV01;
  before_state: StateTransitionReceiptStateSnapshotV01;
  after_state: StateTransitionReceiptStateSnapshotV01;
  before_state_observation_ref: ExternalRefV01;
  after_application_observation_ref: ExternalRefV01;
  durable_record_ref: ExternalRefV01;
  source_refs: ExternalRefV01[];
}

export interface StateTransitionReceiptSemanticCommitGateBindingV01 {
  status: "authorized";
  evaluation_ref: ExternalRefV01;
  evaluated_at: string;
  expires_at: string;
}

export interface StateTransitionReceiptAtomicityV01 {
  mode: "all_or_nothing";
  all_effects_applied: true;
  partial_application: false;
}

export interface StateTransitionReceiptCompatibilityUnmappedFieldV01 {
  source_field: string;
  reason: string;
}

export interface StateTransitionReceiptCompatibilityMetadataV01 {
  source_contracts: string[];
  unmapped_fields: StateTransitionReceiptCompatibilityUnmappedFieldV01[];
  warnings: string[];
  external_refs: ExternalRefV01[];
}

export interface StateTransitionReceiptMaterialBoundaryV01 {
  bounded_summaries_only: true;
  max_summary_characters: 2000;
  max_collection_items: 128;
  max_refs_per_collection: 64;
  raw_prompt_persisted: false;
  raw_transcript_persisted: false;
  raw_terminal_output_persisted: false;
  raw_provider_output_persisted: false;
  raw_artifact_content_persisted: false;
  hidden_reasoning_persisted: false;
  credential_or_secret_persisted: false;
  absolute_local_path_persisted: false;
}

export interface StateTransitionReceiptAuthoritySummaryV01 {
  represents_applied_durable_semantic_transition: true;
  receipt_is_proposal: false;
  receipt_is_review_decision: false;
  receipt_is_transition_request: false;
  receipt_is_eligibility_result: false;
  receipt_is_permission_grant: false;
  receipt_is_failed_transition_attempt: false;
  receipt_is_planned_transition: false;
  receipt_is_canonical_project_state: false;
  receipt_is_accepted_evidence: false;
  receipt_proves_external_publication: false;
  builder_applies_state: false;
  validator_applies_state: false;
  contract_validation_authenticates_external_refs: false;
  grants_future_transition_authority: false;
  grants_execution_authority: false;
  grants_scheduling_authority: false;
  grants_retry_authority: false;
  grants_replay_authority: false;
  grants_deployment_authority: false;
  grants_provider_call_authority: false;
  grants_github_mutation_authority: false;
  grants_merge_authority: false;
  grants_publication_authority: false;
  grants_external_actuation_authority: false;
  grants_external_side_effect_authority: false;
  writes_database: false;
  creates_evidence: false;
  applies_perspective: false;
  promotes_reviewed_memory: false;
  closes_work: false;
  selects_next_context_automatically: false;
  notes: string[];
}

export interface StateTransitionReceiptIntegrityV01 {
  algorithm: "sha256";
  canonicalization: typeof STATE_TRANSITION_RECEIPT_CANONICALIZATION_V01;
  fingerprint_scope: "transition_receipt_without_integrity_fingerprint";
  fingerprint: string;
}

export interface StateTransitionReceiptV01 {
  transition_receipt_version: typeof STATE_TRANSITION_RECEIPT_VERSION_V01;
  transition_receipt_id: string;
  idempotency_key: string;
  workspace_id: string;
  project_id: string;
  source_proposal: StateTransitionReceiptSourceProposalBindingV01;
  source_decision: StateTransitionReceiptSourceDecisionBindingV01;
  source_candidate: StateTransitionReceiptSourceCandidateBindingV01;
  requested_transition_intent: StateTransitionReceiptRequestedTransitionIntentBindingV01;
  transition_scope: "semantic_state";
  receipt_status: "applied";
  atomicity: StateTransitionReceiptAtomicityV01;
  effects: StateTransitionReceiptEffectV01[];
  applied_at: string;
  recorded_at: string;
  applied_by_ref: ExternalRefV01;
  semantic_commit_gate: StateTransitionReceiptSemanticCommitGateBindingV01;
  eligibility_precondition_fingerprint: string;
  source_refs: ExternalRefV01[];
  compatibility: StateTransitionReceiptCompatibilityMetadataV01;
  material_boundary: StateTransitionReceiptMaterialBoundaryV01;
  authority_summary: StateTransitionReceiptAuthoritySummaryV01;
  integrity: StateTransitionReceiptIntegrityV01;
}

export type StateTransitionReceiptEffectInputV01 = Omit<
  StateTransitionReceiptEffectV01,
  "effect_id"
>;

export type StateTransitionReceiptBuilderInputV01 = Omit<
  StateTransitionReceiptV01,
  | "transition_receipt_version"
  | "transition_receipt_id"
  | "idempotency_key"
  | "transition_scope"
  | "receipt_status"
  | "atomicity"
  | "effects"
  | "material_boundary"
  | "authority_summary"
  | "integrity"
> & {
  effects: StateTransitionReceiptEffectInputV01[];
  authority_notes?: string[];
};

export interface StateTransitionReceiptValidationIssueV01 {
  severity: "error" | "warning";
  code: string;
  path: string | null;
  message: string;
}

export interface StateTransitionReceiptValidationResultV01 {
  status: "valid" | "invalid" | "blocked";
  normalized_protocol_version:
    | typeof STATE_TRANSITION_RECEIPT_VERSION_V01
    | null;
  errors: StateTransitionReceiptValidationIssueV01[];
  warnings: StateTransitionReceiptValidationIssueV01[];
}

export const STATE_TRANSITION_CURRENT_STATE_PRESENCES_V01 = [
  "absent",
  "present",
  "unknown",
] as const;

export const STATE_TRANSITION_SEMANTIC_COMMIT_GATE_STATUSES_V01 = [
  "authorized",
  "denied",
  "unknown",
] as const;

export const STATE_TRANSITION_ELIGIBILITY_STATUSES_V01 = [
  "eligible",
  "ineligible",
  "blocked",
] as const;

export type StateTransitionCurrentStatePresenceV01 =
  (typeof STATE_TRANSITION_CURRENT_STATE_PRESENCES_V01)[number];
export type StateTransitionSemanticCommitGateStatusV01 =
  (typeof STATE_TRANSITION_SEMANTIC_COMMIT_GATE_STATUSES_V01)[number];
export type StateTransitionEligibilityStatusV01 =
  (typeof STATE_TRANSITION_ELIGIBILITY_STATUSES_V01)[number];

export interface StateTransitionCurrentStateObservationV01 {
  target_ref: ExternalRefV01;
  presence: StateTransitionCurrentStatePresenceV01;
  state_ref: ExternalRefV01 | null;
  state_fingerprint: string | null;
  observed_at: string;
  observation_ref: ExternalRefV01;
  source_refs: ExternalRefV01[];
}

export interface StateTransitionSemanticCommitGateEvaluationV01 {
  status: StateTransitionSemanticCommitGateStatusV01;
  workspace_id: string;
  project_id: string;
  decision_id: string;
  decision_fingerprint: string;
  intent_id: string;
  transition_kind: ReviewDecisionRequestedTransitionKindV01;
  target_refs: ExternalRefV01[];
  decision_actor_ref: ExternalRefV01;
  authorization_basis_refs: ExternalRefV01[];
  gate_actor_ref: ExternalRefV01;
  authorized_applier_ref: ExternalRefV01;
  authorized_effects: StateTransitionGateAuthorizedEffectV01[];
  evaluation_ref: ExternalRefV01;
  evaluated_at: string;
  expires_at: string;
  source_refs: ExternalRefV01[];
}

export interface StateTransitionExactStateRefIdentityRuleV01 {
  mode: "exact_identity";
  state_ref: ExternalRefV01;
}

export interface StateTransitionWriterAllocatedStateRefRuleV01 {
  mode: "writer_allocated";
  ref_type: string;
  compatibility_namespace: string;
  trust_class: StateTransitionReceiptObservationTrustClassV01;
}

export type StateTransitionAuthorizedStateRefRuleV01 =
  | StateTransitionExactStateRefIdentityRuleV01
  | StateTransitionWriterAllocatedStateRefRuleV01;

export interface StateTransitionAuthorizedAbsentAfterStateV01 {
  presence: "absent";
  state_fingerprint: null;
  state_ref_rule: null;
}

export interface StateTransitionAuthorizedPresentAfterStateV01 {
  presence: "present";
  state_fingerprint: string;
  state_ref_rule: StateTransitionAuthorizedStateRefRuleV01;
}

export type StateTransitionAuthorizedAfterStateV01 =
  | StateTransitionAuthorizedAbsentAfterStateV01
  | StateTransitionAuthorizedPresentAfterStateV01;

export interface StateTransitionGateAuthorizedEffectV01 {
  target_ref: ExternalRefV01;
  operation: StateTransitionReceiptOperationV01;
  expected_after_state: StateTransitionAuthorizedAfterStateV01;
}

export interface StateTransitionEligibilityExpectedEffectV01 {
  target_ref: ExternalRefV01;
  operation: StateTransitionReceiptOperationV01;
  before_state: StateTransitionReceiptStateSnapshotV01;
  before_state_observation_ref: ExternalRefV01;
  expected_after_state: StateTransitionAuthorizedAfterStateV01;
  lineage_refs: ExternalRefV01[];
  source_refs: ExternalRefV01[];
}

export type StateTransitionReceiptReplayCompatibilityStatusV01 =
  | "distinct_intent"
  | "exact_replay"
  | "conflicting_result"
  | "blocked";

export interface StateTransitionReceiptReplayCompatibilityV01 {
  status: StateTransitionReceiptReplayCompatibilityStatusV01;
  idempotency_key: string | null;
  left_applied_result_fingerprint: string | null;
  right_applied_result_fingerprint: string | null;
  errors: StateTransitionReceiptValidationIssueV01[];
}

export interface StateTransitionEligibilityIssueV01 {
  severity: "error" | "warning";
  code: string;
  path: string | null;
  message: string;
}

export interface StateTransitionEligibilityResultV01 {
  status: StateTransitionEligibilityStatusV01;
  precondition_fingerprint: string;
  expected_transition_kind: ReviewDecisionRequestedTransitionKindV01 | null;
  expected_target_refs: ExternalRefV01[];
  expected_effects: StateTransitionEligibilityExpectedEffectV01[];
  errors: StateTransitionEligibilityIssueV01[];
  warnings: StateTransitionEligibilityIssueV01[];
}

export interface StateTransitionEligibilityEvaluationInputV01 {
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
  current_state_observations: StateTransitionCurrentStateObservationV01[];
  semantic_commit_gate_evaluation: StateTransitionSemanticCommitGateEvaluationV01;
  prior_review_decisions: ReviewDecisionV01[];
  prior_state_transition_receipts: StateTransitionReceiptV01[];
  evaluated_at: string;
}

export interface TaskContextPacketTransitionRelationIssueV01 {
  severity: "error" | "warning";
  code: string;
  path: string | null;
  message: string;
}

export interface TaskContextPacketTransitionRelationResultV01 {
  status: "valid" | "blocked";
  errors: TaskContextPacketTransitionRelationIssueV01[];
  warnings: TaskContextPacketTransitionRelationIssueV01[];
}
