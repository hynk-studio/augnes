import {
  acceptReviewDecisionInputFixture,
  deferReviewDecisionInputFixture,
  rejectReviewDecisionInputFixture,
  reviewDecisionGenericSourceProposal,
} from "@/fixtures/vnext/protocol/review-decision-v0-1";
import {
  buildReviewDecisionV01,
  createEpisodeDeltaCandidateFingerprintV01,
  createReviewDecisionFingerprintV01,
  deriveReviewDecisionIdV01,
} from "@/lib/vnext/review-decision";
import {
  EXTERNAL_REF_VERSION_V01,
  type ExternalRefTrustClassV01,
  type ExternalRefV01,
} from "@/types/vnext/external-ref";
import type {
  StateTransitionCurrentStateObservationV01,
  StateTransitionReceiptBuilderInputV01,
  StateTransitionReceiptV01,
  StateTransitionEligibilityEvaluationInputV01,
  StateTransitionSemanticCommitGateEvaluationV01,
} from "@/types/vnext/state-transition-receipt";

export const STATE_TRANSITION_RECEIPT_FIXTURE_GATE_EVALUATED_AT =
  "2026-07-10T12:20:00.000Z";
export const STATE_TRANSITION_RECEIPT_FIXTURE_GATE_EXPIRES_AT =
  "2026-07-10T13:00:00.000Z";
export const STATE_TRANSITION_RECEIPT_FIXTURE_APPLIED_AT =
  "2026-07-10T12:25:00.000Z";
export const STATE_TRANSITION_RECEIPT_FIXTURE_RECORDED_AT =
  "2026-07-10T12:26:00.000Z";

const BEFORE_OBSERVED_AT = "2026-07-10T12:18:00.000Z";
const STATE_AFTER_FINGERPRINT = `sha256:${"a".repeat(64)}`;
const BEFORE_OBSERVATION_FINGERPRINT = `sha256:${"b".repeat(64)}`;
const AFTER_OBSERVATION_FINGERPRINT = `sha256:${"c".repeat(64)}`;
const DURABLE_RECORD_FINGERPRINT = `sha256:${"d".repeat(64)}`;
const GATE_EVALUATION_FINGERPRINT = `sha256:${"e".repeat(64)}`;
const ELIGIBILITY_PRECONDITION_FINGERPRINT = `sha256:${"f".repeat(64)}`;

function ref(
  refType: string,
  externalId: string,
  trustClass: ExternalRefTrustClassV01,
  extra: Partial<ExternalRefV01> = {},
): ExternalRefV01 {
  return {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: refType,
    external_id: externalId,
    trust_class: trustClass,
    ...extra,
  };
}

export const genericStateTransitionReceiptSourceProposalFixture =
  reviewDecisionGenericSourceProposal;

export const genericStateTransitionReceiptSourceDecisionFixture =
  buildReviewDecisionV01(clone(acceptReviewDecisionInputFixture));

const sourceCandidate =
  genericStateTransitionReceiptSourceProposalFixture.proposed_deltas[0]!;
const targetRef = clone(sourceCandidate.target_refs[0]!);

export const genericStateTransitionReceiptBeforeObservationRefFixture = ref(
  "semantic_state_observation",
  "current-state-observation:protocol-foundation-absent",
  "direct_local_observation",
  {
    observed_at: BEFORE_OBSERVED_AT,
    source_ref: BEFORE_OBSERVATION_FINGERPRINT,
  },
);

export const genericStateTransitionReceiptAfterStateRefFixture = ref(
  "accepted_semantic_state",
  "semantic-state:protocol-foundation:v1",
  "direct_local_observation",
  {
    observed_at: STATE_TRANSITION_RECEIPT_FIXTURE_APPLIED_AT,
    source_ref: STATE_AFTER_FINGERPRINT,
  },
);

export const genericStateTransitionReceiptAfterObservationRefFixture = ref(
  "semantic_state_application_observation",
  "application-observation:protocol-foundation:v1",
  "direct_local_observation",
  {
    observed_at: STATE_TRANSITION_RECEIPT_FIXTURE_APPLIED_AT,
    source_ref: AFTER_OBSERVATION_FINGERPRINT,
  },
);

export const genericStateTransitionReceiptDurableRecordRefFixture = ref(
  "durable_semantic_state_record",
  "durable-record:protocol-foundation:v1",
  "verified_external_observation",
  {
    observed_at: STATE_TRANSITION_RECEIPT_FIXTURE_RECORDED_AT,
    source_ref: DURABLE_RECORD_FINGERPRINT,
  },
);

export const genericStateTransitionReceiptGateEvaluationRefFixture = ref(
  "semantic_commit_gate_evaluation",
  "gate-evaluation:protocol-foundation:authorized",
  "direct_local_observation",
  {
    observed_at: STATE_TRANSITION_RECEIPT_FIXTURE_GATE_EVALUATED_AT,
    source_ref: GATE_EVALUATION_FINGERPRINT,
  },
);

const appliedByRef = ref(
  "semantic_transition_actor",
  "synthetic-actor:semantic-transition-conformance",
  "direct_local_observation",
  {
    observed_at: STATE_TRANSITION_RECEIPT_FIXTURE_APPLIED_AT,
    source_ref: genericStateTransitionReceiptGateEvaluationRefFixture.source_ref,
  },
);

const sourceProposalRef = ref(
  "episode_delta_proposal",
  genericStateTransitionReceiptSourceProposalFixture.proposal_id,
  "derived_interpretation",
  {
    observed_at:
      genericStateTransitionReceiptSourceProposalFixture.created_at,
    source_ref:
      genericStateTransitionReceiptSourceProposalFixture.integrity.fingerprint,
  },
);

const sourceDecisionRef = ref(
  "review_decision",
  genericStateTransitionReceiptSourceDecisionFixture.decision_id,
  "user_declaration",
  {
    observed_at: genericStateTransitionReceiptSourceDecisionFixture.decided_at,
    source_ref:
      genericStateTransitionReceiptSourceDecisionFixture.integrity.fingerprint,
  },
);

export const genericStateTransitionReceiptInputFixture: StateTransitionReceiptBuilderInputV01 = {
  workspace_id: genericStateTransitionReceiptSourceProposalFixture.workspace_id,
  project_id: genericStateTransitionReceiptSourceProposalFixture.project_id,
  source_proposal: {
    proposal_version:
      genericStateTransitionReceiptSourceProposalFixture.proposal_version,
    proposal_id: genericStateTransitionReceiptSourceProposalFixture.proposal_id,
    proposal_fingerprint:
      genericStateTransitionReceiptSourceProposalFixture.integrity.fingerprint,
  },
  source_decision: {
    decision_version:
      genericStateTransitionReceiptSourceDecisionFixture.decision_version,
    decision_id: genericStateTransitionReceiptSourceDecisionFixture.decision_id,
    decision_fingerprint:
      genericStateTransitionReceiptSourceDecisionFixture.integrity.fingerprint,
  },
  source_candidate: {
    candidate_id: sourceCandidate.candidate_id,
    candidate_fingerprint:
      createEpisodeDeltaCandidateFingerprintV01(sourceCandidate),
  },
  requested_transition_intent: {
    intent_id:
      genericStateTransitionReceiptSourceDecisionFixture
        .requested_transition_intent!.intent_id,
    transition_kind:
      genericStateTransitionReceiptSourceDecisionFixture
        .requested_transition_intent!.transition_kind,
    target_refs: [targetRef],
  },
  effects: [
    {
      target_ref: targetRef,
      operation: "create",
      before_state: {
        presence: "absent",
        state_ref: null,
        state_fingerprint: null,
      },
      after_state: {
        presence: "present",
        state_ref: genericStateTransitionReceiptAfterStateRefFixture,
        state_fingerprint: STATE_AFTER_FINGERPRINT,
      },
      before_state_observation_ref:
        genericStateTransitionReceiptBeforeObservationRefFixture,
      after_application_observation_ref:
        genericStateTransitionReceiptAfterObservationRefFixture,
      durable_record_ref:
        genericStateTransitionReceiptDurableRecordRefFixture,
      source_refs: [
        sourceProposalRef,
        sourceDecisionRef,
        genericStateTransitionReceiptBeforeObservationRefFixture,
        genericStateTransitionReceiptAfterObservationRefFixture,
        genericStateTransitionReceiptDurableRecordRefFixture,
      ],
    },
  ],
  applied_at: STATE_TRANSITION_RECEIPT_FIXTURE_APPLIED_AT,
  recorded_at: STATE_TRANSITION_RECEIPT_FIXTURE_RECORDED_AT,
  applied_by_ref: appliedByRef,
  semantic_commit_gate: {
    status: "authorized",
    evaluation_ref: genericStateTransitionReceiptGateEvaluationRefFixture,
    evaluated_at: STATE_TRANSITION_RECEIPT_FIXTURE_GATE_EVALUATED_AT,
    expires_at: STATE_TRANSITION_RECEIPT_FIXTURE_GATE_EXPIRES_AT,
  },
  eligibility_precondition_fingerprint:
    ELIGIBILITY_PRECONDITION_FINGERPRINT,
  source_refs: [
    sourceProposalRef,
    sourceDecisionRef,
    genericStateTransitionReceiptBeforeObservationRefFixture,
    genericStateTransitionReceiptGateEvaluationRefFixture,
    genericStateTransitionReceiptAfterObservationRefFixture,
    genericStateTransitionReceiptDurableRecordRefFixture,
  ],
  compatibility: {
    source_contracts: [
      genericStateTransitionReceiptSourceProposalFixture.proposal_version,
      genericStateTransitionReceiptSourceDecisionFixture.decision_version,
    ],
    unmapped_fields: [],
    warnings: [
      "Synthetic conformance material does not prove that a real durable transition occurred.",
    ],
    external_refs: [],
  },
  authority_notes: [
    "The fixture represents an applied receipt only inside synthetic protocol conformance.",
  ],
};

export const STATE_TRANSITION_ELIGIBILITY_FIXTURE_EVALUATED_AT =
  "2026-07-10T12:21:00.000Z";

const semanticCommitGateActorRef = ref(
  "semantic_commit_gate_actor",
  "synthetic-actor:semantic-commit-gate-conformance",
  "direct_local_observation",
  {
    observed_at: STATE_TRANSITION_RECEIPT_FIXTURE_GATE_EVALUATED_AT,
    source_ref: GATE_EVALUATION_FINGERPRINT,
  },
);

export const genericStateTransitionCurrentStateObservationsFixture: StateTransitionCurrentStateObservationV01[] = [
  {
    target_ref: clone(targetRef),
    presence: "absent",
    state_ref: null,
    state_fingerprint: null,
    observed_at: BEFORE_OBSERVED_AT,
    observation_ref: clone(
      genericStateTransitionReceiptBeforeObservationRefFixture,
    ),
    source_refs: [
      clone(genericStateTransitionReceiptBeforeObservationRefFixture),
    ],
  },
];

export const genericStateTransitionSemanticCommitGateEvaluationFixture: StateTransitionSemanticCommitGateEvaluationV01 = {
  status: "authorized",
  workspace_id: genericStateTransitionReceiptSourceProposalFixture.workspace_id,
  project_id: genericStateTransitionReceiptSourceProposalFixture.project_id,
  decision_id: genericStateTransitionReceiptSourceDecisionFixture.decision_id,
  decision_fingerprint:
    genericStateTransitionReceiptSourceDecisionFixture.integrity.fingerprint,
  intent_id:
    genericStateTransitionReceiptSourceDecisionFixture
      .requested_transition_intent!.intent_id,
  transition_kind:
    genericStateTransitionReceiptSourceDecisionFixture
      .requested_transition_intent!.transition_kind,
  target_refs: [clone(targetRef)],
  decision_actor_ref: clone(
    genericStateTransitionReceiptSourceDecisionFixture.actor_ref,
  ),
  authorization_basis_refs: clone(
    genericStateTransitionReceiptSourceDecisionFixture
      .authorization_basis_refs,
  ),
  gate_actor_ref: semanticCommitGateActorRef,
  evaluation_ref: clone(
    genericStateTransitionReceiptGateEvaluationRefFixture,
  ),
  evaluated_at: STATE_TRANSITION_RECEIPT_FIXTURE_GATE_EVALUATED_AT,
  expires_at: STATE_TRANSITION_RECEIPT_FIXTURE_GATE_EXPIRES_AT,
  source_refs: [
    sourceDecisionRef,
    semanticCommitGateActorRef,
    genericStateTransitionReceiptGateEvaluationRefFixture,
  ],
};

export const genericStateTransitionEligibilityEvaluationInputFixture: StateTransitionEligibilityEvaluationInputV01 = {
  proposal: genericStateTransitionReceiptSourceProposalFixture,
  decision: genericStateTransitionReceiptSourceDecisionFixture,
  current_state_observations:
    genericStateTransitionCurrentStateObservationsFixture,
  semantic_commit_gate_evaluation:
    genericStateTransitionSemanticCommitGateEvaluationFixture,
  evaluated_at: STATE_TRANSITION_ELIGIBILITY_FIXTURE_EVALUATED_AT,
};

export interface InvalidStateTransitionEligibilityInputFixtureCaseV01 {
  name: string;
  expected_status: "ineligible" | "blocked";
  expected_error_code: string;
  mutate(input: StateTransitionEligibilityEvaluationInputV01): unknown;
}

function eligibilityMutation(
  name: string,
  expectedStatus: "ineligible" | "blocked",
  expectedErrorCode: string,
  mutate: (
    input: StateTransitionEligibilityEvaluationInputV01 &
      Record<string, unknown>,
  ) => void,
): InvalidStateTransitionEligibilityInputFixtureCaseV01 {
  return {
    name,
    expected_status: expectedStatus,
    expected_error_code: expectedErrorCode,
    mutate(input) {
      const value = clone(input) as StateTransitionEligibilityEvaluationInputV01 &
        Record<string, unknown>;
      mutate(value);
      return value;
    },
  };
}

const validRejectDecision = buildReviewDecisionV01(
  clone(rejectReviewDecisionInputFixture),
);
const validDeferDecision = buildReviewDecisionV01(
  clone(deferReviewDecisionInputFixture),
);

export const invalidStateTransitionEligibilityInputFixtureCases: InvalidStateTransitionEligibilityInputFixtureCaseV01[] = [
  eligibilityMutation(
    "invalid_proposal",
    "blocked",
    "proposal_invalid",
    (value) => {
      value.proposal.workspace_id = "";
    },
  ),
  eligibilityMutation(
    "invalid_decision",
    "blocked",
    "decision_invalid",
    (value) => {
      value.decision.integrity.fingerprint = `sha256:${"0".repeat(64)}`;
    },
  ),
  eligibilityMutation(
    "decision_proposal_relation_mismatch",
    "blocked",
    "decision_proposal_relation_invalid",
    (value) => {
      value.decision.source_proposal.proposal_id =
        "episode-delta-proposal:other";
      value.decision.decision_id = deriveReviewDecisionIdV01(value.decision);
      value.decision.integrity.fingerprint =
        createReviewDecisionFingerprintV01(value.decision);
    },
  ),
  eligibilityMutation(
    "reject_decision",
    "ineligible",
    "decision_not_transitionable",
    (value) => {
      value.decision = clone(validRejectDecision);
      value.semantic_commit_gate_evaluation.decision_id =
        validRejectDecision.decision_id;
      value.semantic_commit_gate_evaluation.decision_fingerprint =
        validRejectDecision.integrity.fingerprint;
      value.semantic_commit_gate_evaluation.decision_actor_ref = clone(
        validRejectDecision.actor_ref,
      );
      value.semantic_commit_gate_evaluation.authorization_basis_refs = clone(
        validRejectDecision.authorization_basis_refs,
      );
    },
  ),
  eligibilityMutation(
    "defer_decision",
    "ineligible",
    "decision_not_transitionable",
    (value) => {
      value.decision = clone(validDeferDecision);
      value.semantic_commit_gate_evaluation.decision_id =
        validDeferDecision.decision_id;
      value.semantic_commit_gate_evaluation.decision_fingerprint =
        validDeferDecision.integrity.fingerprint;
      value.semantic_commit_gate_evaluation.decision_actor_ref = clone(
        validDeferDecision.actor_ref,
      );
      value.semantic_commit_gate_evaluation.authorization_basis_refs = clone(
        validDeferDecision.authorization_basis_refs,
      );
    },
  ),
  eligibilityMutation(
    "missing_requested_transition_intent",
    "ineligible",
    "requested_transition_intent_missing",
    (value) => {
      const decisionInput = clone(acceptReviewDecisionInputFixture);
      decisionInput.requested_transition_intent = null;
      value.decision = buildReviewDecisionV01(decisionInput);
      value.semantic_commit_gate_evaluation.decision_id =
        value.decision.decision_id;
      value.semantic_commit_gate_evaluation.decision_fingerprint =
        value.decision.integrity.fingerprint;
    },
  ),
  eligibilityMutation(
    "denied_gate",
    "ineligible",
    "semantic_commit_gate_denied",
    (value) => {
      value.semantic_commit_gate_evaluation.status = "denied";
    },
  ),
  eligibilityMutation(
    "unknown_gate",
    "ineligible",
    "semantic_commit_gate_unknown",
    (value) => {
      value.semantic_commit_gate_evaluation.status = "unknown";
    },
  ),
  eligibilityMutation(
    "expired_gate",
    "ineligible",
    "semantic_commit_gate_expired",
    (value) => {
      value.semantic_commit_gate_evaluation.expires_at =
        "2026-07-10T12:20:30.000Z";
    },
  ),
  eligibilityMutation(
    "missing_current_state",
    "ineligible",
    "current_state_missing",
    (value) => {
      value.current_state_observations = [];
    },
  ),
  eligibilityMutation(
    "unknown_current_state",
    "ineligible",
    "current_state_unknown",
    (value) => {
      value.current_state_observations[0]!.presence = "unknown";
    },
  ),
  eligibilityMutation(
    "current_state_target_outside_intent",
    "blocked",
    "current_state_target_mismatch",
    (value) => {
      value.current_state_observations[0]!.target_ref = ref(
        "project_semantic_target",
        "target:outside-transition-intent",
        "direct_local_observation",
      );
    },
  ),
  eligibilityMutation(
    "duplicate_current_state_target",
    "blocked",
    "duplicate_current_state_target",
    (value) => {
      value.current_state_observations.push(
        clone(value.current_state_observations[0]!),
      );
    },
  ),
  eligibilityMutation(
    "conflicting_current_state_snapshots",
    "blocked",
    "conflicting_current_state_snapshot",
    (value) => {
      const conflicting = clone(value.current_state_observations[0]!);
      conflicting.presence = "present";
      conflicting.state_ref = clone(
        genericStateTransitionReceiptAfterStateRefFixture,
      );
      conflicting.state_fingerprint = STATE_AFTER_FINGERPRINT;
      value.current_state_observations.push(conflicting);
    },
  ),
  eligibilityMutation(
    "current_state_absent_with_state_ref",
    "blocked",
    "current_state_snapshot_invalid",
    (value) => {
      value.current_state_observations[0]!.state_ref = clone(
        genericStateTransitionReceiptAfterStateRefFixture,
      );
    },
  ),
  eligibilityMutation(
    "current_state_present_without_state_ref",
    "blocked",
    "current_state_snapshot_invalid",
    (value) => {
      value.current_state_observations[0]!.presence = "present";
      value.current_state_observations[0]!.state_ref = null;
      value.current_state_observations[0]!.state_fingerprint =
        STATE_AFTER_FINGERPRINT;
    },
  ),
  eligibilityMutation(
    "current_state_unknown_with_state_material",
    "blocked",
    "current_state_snapshot_invalid",
    (value) => {
      value.current_state_observations[0]!.presence = "unknown";
      value.current_state_observations[0]!.state_ref = clone(
        genericStateTransitionReceiptAfterStateRefFixture,
      );
      value.current_state_observations[0]!.state_fingerprint =
        STATE_AFTER_FINGERPRINT;
    },
  ),
  eligibilityMutation(
    "untrusted_current_state_observation",
    "blocked",
    "current_state_observation_trust_insufficient",
    (value) => {
      value.current_state_observations[0]!.observation_ref.trust_class =
        "host_attestation";
    },
  ),
  eligibilityMutation(
    "current_state_observation_trust_upgrade",
    "blocked",
    "duplicate_conflicting_external_ref",
    (value) => {
      const conflictingSource = clone(
        value.current_state_observations[0]!.observation_ref,
      );
      conflictingSource.trust_class = "host_attestation";
      value.current_state_observations[0]!.source_refs.push(
        conflictingSource,
      );
    },
  ),
  eligibilityMutation(
    "missing_current_state_observation_ref",
    "blocked",
    "external_ref_malformed",
    (value) => {
      value.current_state_observations[0]!.observation_ref =
        null as unknown as ExternalRefV01;
    },
  ),
  eligibilityMutation(
    "missing_current_state_source_refs",
    "blocked",
    "current_state_source_ref_required",
    (value) => {
      value.current_state_observations[0]!.source_refs = [];
    },
  ),
  eligibilityMutation(
    "malformed_current_state_observed_at",
    "blocked",
    "timestamp_invalid",
    (value) => {
      value.current_state_observations[0]!.observed_at = "not-a-timestamp";
    },
  ),
  eligibilityMutation(
    "gate_decision_id_mismatch",
    "blocked",
    "gate_decision_id_mismatch",
    (value) => {
      value.semantic_commit_gate_evaluation.decision_id =
        "review-decision:other";
    },
  ),
  eligibilityMutation(
    "gate_decision_fingerprint_mismatch",
    "blocked",
    "gate_decision_fingerprint_mismatch",
    (value) => {
      value.semantic_commit_gate_evaluation.decision_fingerprint =
        `sha256:${"1".repeat(64)}`;
    },
  ),
  eligibilityMutation(
    "gate_intent_mismatch",
    "blocked",
    "gate_intent_mismatch",
    (value) => {
      value.semantic_commit_gate_evaluation.intent_id =
        "transition-intent:other";
    },
  ),
  eligibilityMutation(
    "gate_transition_kind_mismatch",
    "blocked",
    "gate_transition_kind_mismatch",
    (value) => {
      value.semantic_commit_gate_evaluation.transition_kind =
        "semantic_candidate_retract";
    },
  ),
  eligibilityMutation(
    "gate_target_mismatch",
    "blocked",
    "gate_target_mismatch",
    (value) => {
      value.semantic_commit_gate_evaluation.target_refs = [
        ref(
          "project_semantic_target",
          "target:other-gate-target",
          "direct_local_observation",
        ),
      ];
    },
  ),
  eligibilityMutation(
    "gate_decision_actor_mismatch",
    "blocked",
    "gate_decision_actor_mismatch",
    (value) => {
      value.semantic_commit_gate_evaluation.decision_actor_ref = ref(
        "operator_actor",
        "synthetic-operator:other",
        "user_declaration",
      );
    },
  ),
  eligibilityMutation(
    "gate_authorization_basis_mismatch",
    "blocked",
    "gate_authorization_basis_mismatch",
    (value) => {
      value.semantic_commit_gate_evaluation.authorization_basis_refs = [
        ref(
          "authorization_basis",
          "synthetic-basis:other",
          "user_declaration",
        ),
      ];
    },
  ),
  eligibilityMutation(
    "cross_project_gate",
    "blocked",
    "gate_project_mismatch",
    (value) => {
      value.semantic_commit_gate_evaluation.project_id = "project-other";
    },
  ),
  eligibilityMutation(
    "cross_workspace_gate",
    "blocked",
    "gate_workspace_mismatch",
    (value) => {
      value.semantic_commit_gate_evaluation.workspace_id = "workspace-other";
    },
  ),
  eligibilityMutation(
    "untrusted_gate_evaluation_ref",
    "blocked",
    "semantic_commit_gate_trust_insufficient",
    (value) => {
      value.semantic_commit_gate_evaluation.evaluation_ref.trust_class =
        "provider_report";
    },
  ),
  eligibilityMutation(
    "malformed_gate_evaluated_at",
    "blocked",
    "timestamp_invalid",
    (value) => {
      value.semantic_commit_gate_evaluation.evaluated_at =
        "not-a-timestamp";
    },
  ),
  eligibilityMutation(
    "malformed_gate_expires_at",
    "blocked",
    "timestamp_invalid",
    (value) => {
      value.semantic_commit_gate_evaluation.expires_at = "not-a-timestamp";
    },
  ),
  eligibilityMutation(
    "malformed_evaluation_time",
    "blocked",
    "timestamp_invalid",
    (value) => {
      value.evaluated_at = "not-a-timestamp";
    },
  ),
  eligibilityMutation(
    "gate_evaluated_after_evaluation_time",
    "blocked",
    "timestamp_order_invalid",
    (value) => {
      value.semantic_commit_gate_evaluation.evaluated_at =
        "2026-07-10T12:22:00.000Z";
    },
  ),
  eligibilityMutation(
    "current_state_observed_after_evaluation_time",
    "blocked",
    "timestamp_order_invalid",
    (value) => {
      value.current_state_observations[0]!.observed_at =
        "2026-07-10T12:22:00.000Z";
    },
  ),
  eligibilityMutation(
    "missing_gate_source_refs",
    "blocked",
    "semantic_commit_gate_source_ref_required",
    (value) => {
      value.semantic_commit_gate_evaluation.source_refs = [];
    },
  ),
];

export interface InvalidStateTransitionReceiptFixtureCaseV01 {
  name: string;
  expected_status: "invalid" | "blocked";
  expected_error_code: string;
  mutate(receipt: StateTransitionReceiptV01): unknown;
}

function mutation(
  name: string,
  expectedStatus: "invalid" | "blocked",
  expectedErrorCode: string,
  mutate: (
    receipt: StateTransitionReceiptV01 & Record<string, unknown>,
  ) => void,
): InvalidStateTransitionReceiptFixtureCaseV01 {
  return {
    name,
    expected_status: expectedStatus,
    expected_error_code: expectedErrorCode,
    mutate(receipt) {
      const value = clone(receipt) as StateTransitionReceiptV01 &
        Record<string, unknown>;
      mutate(value);
      return value;
    },
  };
}

function authorityMutation(
  name: string,
  field: keyof StateTransitionReceiptV01["authority_summary"],
): InvalidStateTransitionReceiptFixtureCaseV01 {
  return mutation(name, "blocked", "authority_boundary_violation", (value) => {
    (value.authority_summary as unknown as Record<string, unknown>)[field] =
      true;
  });
}

export const invalidStateTransitionReceiptFixtureCases: InvalidStateTransitionReceiptFixtureCaseV01[] = [
  mutation(
    "unsupported_protocol_version",
    "blocked",
    "unsupported_protocol_version",
    (value) => {
      value.transition_receipt_version =
        "state_transition_receipt.v9.9" as never;
    },
  ),
  mutation(
    "missing_workspace_identity",
    "invalid",
    "workspace_id_missing",
    (value) => {
      value.workspace_id = "";
    },
  ),
  mutation(
    "missing_project_identity",
    "invalid",
    "project_id_missing",
    (value) => {
      value.project_id = "";
    },
  ),
  mutation(
    "provider_specific_core_field",
    "blocked",
    "provider_specific_core_field",
    (value) => {
      value.github_pr_id = "provider-native:synthetic";
    },
  ),
  mutation("unknown_root_field", "blocked", "unknown_core_field", (value) => {
    value.transition_authorized = true;
  }),
  mutation(
    "unknown_nested_field",
    "blocked",
    "unknown_nested_field",
    (value) => {
      (
        value.semantic_commit_gate as unknown as Record<string, unknown>
      ).automatically_applied = true;
    },
  ),
  mutation("raw_prompt_field", "blocked", "raw_prompt_shaped_field", (value) => {
    value.raw_prompt = "synthetic prompt";
  }),
  mutation(
    "raw_transcript_field",
    "blocked",
    "raw_transcript_shaped_field",
    (value) => {
      value.transcript = "synthetic transcript";
    },
  ),
  mutation(
    "terminal_dump_field",
    "blocked",
    "raw_terminal_log_shaped_field",
    (value) => {
      value.terminal_log = "synthetic terminal output";
    },
  ),
  mutation(
    "raw_provider_output_field",
    "blocked",
    "raw_provider_output_shaped_field",
    (value) => {
      value.raw_provider_output = "synthetic provider output";
    },
  ),
  mutation(
    "hidden_reasoning_field",
    "blocked",
    "hidden_reasoning_shaped_field",
    (value) => {
      value.hidden_reasoning = "synthetic reasoning";
    },
  ),
  mutation("credential_field", "blocked", "secret_shaped_field", (value) => {
    value.credentials = "synthetic credential";
  }),
  mutation(
    "secret_shaped_value",
    "blocked",
    "secret_shaped_material",
    (value) => {
      value.compatibility.warnings = [
        "OPENAI_API_KEY=SAFE_MARKER_SECRET_TOKEN",
      ];
    },
  ),
  mutation(
    "absolute_local_path",
    "blocked",
    "absolute_local_path_forbidden",
    (value) => {
      value.compatibility.warnings = [
        "/Users/example/private/transition.json",
      ];
    },
  ),
  mutation(
    "summary_bound_exceeded",
    "blocked",
    "summary_bound_exceeded",
    (value) => {
      value.compatibility.warnings = ["x".repeat(2001)];
    },
  ),
  mutation(
    "collection_bound_exceeded",
    "blocked",
    "collection_bound_exceeded",
    (value) => {
      value.compatibility.warnings = Array.from(
        { length: 129 },
        (_, index) => `warning-${index}`,
      );
    },
  ),
  mutation(
    "malformed_applied_by_ref",
    "invalid",
    "external_ref_malformed",
    (value) => {
      value.applied_by_ref = null as unknown as ExternalRefV01;
    },
  ),
  mutation(
    "malformed_gate_evaluation_ref",
    "blocked",
    "unsupported_external_ref_version",
    (value) => {
      value.semantic_commit_gate.evaluation_ref = {
        ...value.semantic_commit_gate.evaluation_ref,
        ref_version: "external_ref.v9.9" as never,
      };
    },
  ),
  mutation(
    "malformed_effect_target_ref",
    "blocked",
    "external_id_missing",
    (value) => {
      value.effects[0]!.target_ref.external_id = "";
    },
  ),
  mutation(
    "conflicting_duplicate_source_ref",
    "blocked",
    "duplicate_conflicting_external_ref",
    (value) => {
      const duplicate = clone(value.source_refs[0]!);
      duplicate.trust_class = "imported_unverified";
      value.source_refs.push(duplicate);
    },
  ),
  mutation(
    "effect_target_outside_intent",
    "blocked",
    "effect_target_outside_intent",
    (value) => {
      value.effects[0]!.target_ref = ref(
        "project_semantic_target",
        "target:outside-requested-intent",
        "direct_local_observation",
      );
    },
  ),
  mutation(
    "duplicate_effect_target",
    "blocked",
    "duplicate_effect_target",
    (value) => {
      value.effects.push(clone(value.effects[0]!));
    },
  ),
  mutation(
    "effect_identity_mismatch",
    "invalid",
    "effect_identity_mismatch",
    (value) => {
      value.effects[0]!.effect_id = "transition-effect:wrong";
    },
  ),
  mutation(
    "absent_state_with_ref",
    "blocked",
    "absent_state_snapshot_invalid",
    (value) => {
      (
        value.effects[0]!.before_state as unknown as Record<string, unknown>
      ).state_ref = genericStateTransitionReceiptAfterStateRefFixture;
    },
  ),
  mutation(
    "absent_state_with_fingerprint",
    "blocked",
    "absent_state_snapshot_invalid",
    (value) => {
      (
        value.effects[0]!.before_state as unknown as Record<string, unknown>
      ).state_fingerprint = STATE_AFTER_FINGERPRINT;
    },
  ),
  mutation(
    "present_state_missing_ref",
    "invalid",
    "present_state_snapshot_invalid",
    (value) => {
      (
        value.effects[0]!.after_state as unknown as Record<string, unknown>
      ).state_ref = null;
    },
  ),
  mutation(
    "present_state_missing_fingerprint",
    "invalid",
    "present_state_snapshot_invalid",
    (value) => {
      (
        value.effects[0]!.after_state as unknown as Record<string, unknown>
      ).state_fingerprint = null;
    },
  ),
  mutation(
    "present_state_malformed_fingerprint",
    "invalid",
    "state_fingerprint_invalid",
    (value) => {
      if (value.effects[0]!.after_state.presence === "present") {
        value.effects[0]!.after_state.state_fingerprint = "sha256:wrong";
      }
    },
  ),
  mutation(
    "create_with_present_before_state",
    "blocked",
    "operation_snapshot_mismatch",
    (value) => {
      value.effects[0]!.before_state = clone(value.effects[0]!.after_state);
    },
  ),
  mutation(
    "create_with_absent_after_state",
    "blocked",
    "operation_snapshot_mismatch",
    (value) => {
      value.effects[0]!.after_state = {
        presence: "absent",
        state_ref: null,
        state_fingerprint: null,
      };
    },
  ),
  mutation(
    "replace_with_absent_before_state",
    "blocked",
    "operation_snapshot_mismatch",
    (value) => {
      value.effects[0]!.operation = "replace";
    },
  ),
  mutation(
    "replace_with_absent_after_state",
    "blocked",
    "operation_snapshot_mismatch",
    (value) => {
      value.effects[0]!.operation = "replace";
      value.effects[0]!.before_state = clone(value.effects[0]!.after_state);
      value.effects[0]!.after_state = {
        presence: "absent",
        state_ref: null,
        state_fingerprint: null,
      };
    },
  ),
  mutation(
    "supersede_with_absent_before_state",
    "blocked",
    "operation_snapshot_mismatch",
    (value) => {
      value.effects[0]!.operation = "supersede";
    },
  ),
  mutation(
    "supersede_with_absent_after_state",
    "blocked",
    "operation_snapshot_mismatch",
    (value) => {
      value.effects[0]!.operation = "supersede";
      value.effects[0]!.before_state = clone(value.effects[0]!.after_state);
      value.effects[0]!.after_state = {
        presence: "absent",
        state_ref: null,
        state_fingerprint: null,
      };
    },
  ),
  mutation(
    "retract_with_absent_before_state",
    "blocked",
    "operation_snapshot_mismatch",
    (value) => {
      value.effects[0]!.operation = "retract";
      value.effects[0]!.after_state = {
        presence: "absent",
        state_ref: null,
        state_fingerprint: null,
      };
    },
  ),
  mutation(
    "retract_with_present_after_state",
    "blocked",
    "operation_snapshot_mismatch",
    (value) => {
      value.effects[0]!.operation = "retract";
      value.effects[0]!.before_state = clone(value.effects[0]!.after_state);
    },
  ),
  mutation(
    "replace_before_after_identical",
    "blocked",
    "state_change_required",
    (value) => {
      value.effects[0]!.operation = "replace";
      value.effects[0]!.before_state = clone(value.effects[0]!.after_state);
    },
  ),
  mutation(
    "supersede_before_after_identical",
    "blocked",
    "state_change_required",
    (value) => {
      value.effects[0]!.operation = "supersede";
      value.effects[0]!.before_state = clone(value.effects[0]!.after_state);
    },
  ),
  mutation(
    "missing_before_state_observation_ref",
    "invalid",
    "before_state_observation_ref_required",
    (value) => {
      value.effects[0]!.before_state_observation_ref =
        null as unknown as ExternalRefV01;
    },
  ),
  mutation(
    "untrusted_before_state_observation_ref",
    "blocked",
    "observation_trust_insufficient",
    (value) => {
      value.effects[0]!.before_state_observation_ref.trust_class =
        "host_attestation";
    },
  ),
  mutation(
    "missing_after_application_observation_ref",
    "invalid",
    "after_application_observation_ref_required",
    (value) => {
      value.effects[0]!.after_application_observation_ref =
        null as unknown as ExternalRefV01;
    },
  ),
  mutation(
    "untrusted_after_application_observation_ref",
    "blocked",
    "observation_trust_insufficient",
    (value) => {
      value.effects[0]!.after_application_observation_ref.trust_class =
        "host_attestation";
    },
  ),
  mutation(
    "missing_durable_record_ref",
    "invalid",
    "durable_record_ref_required",
    (value) => {
      value.effects[0]!.durable_record_ref =
        null as unknown as ExternalRefV01;
    },
  ),
  mutation(
    "malformed_durable_record_ref",
    "invalid",
    "external_id_missing",
    (value) => {
      value.effects[0]!.durable_record_ref.external_id = "";
    },
  ),
  mutation(
    "untrusted_durable_record_ref",
    "blocked",
    "durable_record_trust_insufficient",
    (value) => {
      value.effects[0]!.durable_record_ref.trust_class = "provider_report";
    },
  ),
  mutation(
    "untrusted_gate_evaluation_ref",
    "blocked",
    "semantic_commit_gate_trust_insufficient",
    (value) => {
      value.semantic_commit_gate.evaluation_ref.trust_class =
        "user_declaration";
    },
  ),
  mutation(
    "malformed_applied_at",
    "invalid",
    "timestamp_invalid",
    (value) => {
      value.applied_at = "not-a-timestamp";
    },
  ),
  mutation(
    "malformed_recorded_at",
    "invalid",
    "timestamp_invalid",
    (value) => {
      value.recorded_at = "not-a-timestamp";
    },
  ),
  mutation(
    "malformed_gate_evaluated_at",
    "invalid",
    "timestamp_invalid",
    (value) => {
      value.semantic_commit_gate.evaluated_at = "not-a-timestamp";
    },
  ),
  mutation(
    "malformed_gate_expires_at",
    "invalid",
    "timestamp_invalid",
    (value) => {
      value.semantic_commit_gate.expires_at = "not-a-timestamp";
    },
  ),
  mutation(
    "gate_evaluated_after_applied_at",
    "blocked",
    "timestamp_order_invalid",
    (value) => {
      value.semantic_commit_gate.evaluated_at =
        "2026-07-10T12:30:00.000Z";
    },
  ),
  mutation(
    "before_observed_after_applied_at",
    "blocked",
    "timestamp_order_invalid",
    (value) => {
      value.effects[0]!.before_state_observation_ref.observed_at =
        "2026-07-10T12:30:00.000Z";
    },
  ),
  mutation(
    "recorded_before_applied_at",
    "blocked",
    "timestamp_order_invalid",
    (value) => {
      value.recorded_at = "2026-07-10T12:24:00.000Z";
    },
  ),
  mutation(
    "gate_expired_before_application",
    "blocked",
    "semantic_commit_gate_expired",
    (value) => {
      value.semantic_commit_gate.expires_at =
        "2026-07-10T12:24:00.000Z";
    },
  ),
  mutation(
    "idempotency_key_mismatch",
    "invalid",
    "idempotency_key_mismatch",
    (value) => {
      value.idempotency_key = "state-transition-intent:wrong";
    },
  ),
  mutation(
    "transition_receipt_identity_mismatch",
    "invalid",
    "transition_receipt_identity_mismatch",
    (value) => {
      value.transition_receipt_id = "state-transition-receipt:wrong";
    },
  ),
  mutation(
    "fingerprint_mismatch",
    "invalid",
    "fingerprint_mismatch",
    (value) => {
      value.integrity.fingerprint = `sha256:${"0".repeat(64)}`;
    },
  ),
  authorityMutation("future_transition_authority_claim", "grants_future_transition_authority"),
  authorityMutation("execution_authority_claim", "grants_execution_authority"),
  authorityMutation("provider_authority_claim", "grants_provider_call_authority"),
  authorityMutation("github_authority_claim", "grants_github_mutation_authority"),
  authorityMutation("merge_authority_claim", "grants_merge_authority"),
  authorityMutation("publication_authority_claim", "grants_publication_authority"),
  authorityMutation("deployment_authority_claim", "grants_deployment_authority"),
  authorityMutation("external_actuation_claim", "grants_external_actuation_authority"),
  authorityMutation("database_write_claim", "writes_database"),
  authorityMutation("evidence_creation_claim", "creates_evidence"),
  authorityMutation("perspective_apply_claim", "applies_perspective"),
  authorityMutation("memory_promotion_claim", "promotes_reviewed_memory"),
  authorityMutation("work_closure_claim", "closes_work"),
  authorityMutation("automatic_next_context_claim", "selects_next_context_automatically"),
];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
