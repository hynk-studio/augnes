import {
  canonicalizeProtocolValueV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
  scanForbiddenProtocolMaterialV01,
} from "@/lib/vnext/protocol-primitives";
import {
  CODEX_APP_SERVER_ADAPTER_VERSION_V01,
  CODEX_APP_SERVER_CAPABILITY_VERSION_V01,
  createCodexAppServerExactExecutionBindingV01,
  type CodexAppServerExactExecutionBindingV01,
} from "@/lib/vnext/native-host/codex-app-server-adapter";
import {
  assertValidCommissionedWorkEpisodeArtifactV01,
  assertValidCommissionedWorkObjectiveObservationV01,
  buildCommissionedWorkTrainingResultV01,
  buildCommissionedWorkCaseCommitmentV01,
  createCommissionedWorkIntegrityV01,
  createCommissionedWorkRecordRefV01,
  createCommissionedWorkRoleRefV01,
} from "@/lib/vnext/commissioned-controlled-workbench";
import {
  COMMISSIONED_WORK_CANDIDATE_COMPONENT_IDS_V01,
  COMMISSIONED_WORK_CONDITIONS_V01,
  COMMISSIONED_WORK_TREATMENT_ROLE_BINDINGS_V01,
  type CommissionedWorkCaseSourceV01,
  type CommissionedWorkConditionV01,
  type CommissionedWorkEpisodeArtifactV01,
  type CommissionedWorkEpisodeCheckpointV01,
  type CommissionedWorkFamilyManifestV01,
  type CommissionedWorkNativeHostRefBindingV01,
  type CommissionedWorkObjectiveObservationV01,
  type CommissionedWorkRecordRefV01,
  type CommissionedWorkResourceLaneV01,
  type CommissionedWorkTrainingResultV01,
} from "@/types/vnext/commissioned-controlled-workbench";
import {
  COMMISSIONED_LIVE_TRAINING_ANALYSIS_JOIN_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_ARTIFACT_INDEX_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_ATTEMPT_ADMISSION_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_ATTEMPT_START_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_ATTEMPT_REGISTRY_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_ATTEMPT_TERMINAL_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_AUTHORIZATION_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_BLIND_OBSERVATION_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_CANDIDATE_ASSESSMENT_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_CODEX_ENVIRONMENT_BINDING_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_COMPONENT_RULE_TABLE_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_ISOLATION_OBSERVATION_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_APPROVAL_OBSERVATION_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_CASE_IDS_V01,
  COMMISSIONED_LIVE_TRAINING_CLEANUP_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_CLEANUP_OBSERVATION_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_CLONE_SEAL_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_CONSUMPTION_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_FAMILY_ID_V01,
  COMMISSIONED_LIVE_TRAINING_FOUNDATION_MAIN_SHA_V01,
  COMMISSIONED_LIVE_TRAINING_FOUNDATION_MAIN_TREE_V01,
  COMMISSIONED_LIVE_TRAINING_ISSUE_REF_V01,
  COMMISSIONED_LIVE_TRAINING_INCOMPLETE_CLOSEOUT_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_PLAN_VERSION_V01,
  COMMISSIONED_LIVE_TRAINING_PRIMARY_EPISODE_LIMIT_V01,
  COMMISSIONED_LIVE_TRAINING_REPLACEMENT_LIMIT_V01,
  COMMISSIONED_LIVE_TRAINING_RESULT_VERSION_V01,
  type CommissionedLiveTrainingAnalysisJoinV01,
  type CommissionedLiveTrainingArtifactIndexV01,
  type CommissionedLiveTrainingAttemptAdmissionV01,
  type CommissionedLiveTrainingAttemptStartV01,
  type CommissionedLiveTrainingAttemptRegistryV01,
  type CommissionedLiveTrainingAttemptTerminalV01,
  type CommissionedLiveTrainingAuthorizationV01,
  type CommissionedLiveTrainingBlindObjectiveObservationV01,
  type CommissionedLiveTrainingCandidateAssessmentV01,
  type CommissionedLiveTrainingCandidateComponentAssessmentV01,
  type CommissionedLiveTrainingCandidateComponentStatusV01,
  type CommissionedLiveTrainingCodexEnvironmentBindingV01,
  type CommissionedLiveTrainingComponentAnalysisRuleV01,
  type CommissionedLiveTrainingCaseIdV01,
  type CommissionedLiveTrainingCleanupReportV01,
  type CommissionedLiveTrainingCleanupObservationV01,
  type CommissionedLiveTrainingCloneSealV01,
  type CommissionedLiveTrainingCohortPlanV01,
  type CommissionedLiveTrainingExactNativeExecutionConfigurationV01,
  type CommissionedLiveTrainingExecutableIdentityV01,
  type CommissionedLiveTrainingIncompleteCloseoutV01,
  type CommissionedLiveTrainingIsolationObservationV01,
  type CommissionedLiveTrainingApprovalObservationV01,
  type CommissionedLiveTrainingSourcedResourceLaneV01,
  type CommissionedLiveTrainingResultV01,
  type CommissionedLiveTrainingScheduleSlotV01,
} from "@/types/vnext/commissioned-controlled-live-training";

const SAFE_CODE_V01 = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/u;
const SHA256_V01 = /^sha256:[a-f0-9]{64}$/u;
const COMMIT_SHA_V01 = /^[a-f0-9]{40}$/u;
const MAX_TIMEOUT_MS_V01 = 86_400_000;
const MAX_TOTAL_TIMEOUT_MS_V01 = 604_800_000;
const MAX_NATIVE_INVOCATIONS_V01 =
  COMMISSIONED_LIVE_TRAINING_PRIMARY_EPISODE_LIMIT_V01 +
  COMMISSIONED_LIVE_TRAINING_REPLACEMENT_LIMIT_V01;

const REPLACEMENT_POLICY_V01 = Object.freeze({
  policy_version: "commissioned_live_training_replacement_policy.v0.1",
  behavioral_failure_retry_allowed: false,
  wrong_implementation_retry_allowed: false,
  objective_check_failure_retry_allowed: false,
  false_success_retry_allowed: false,
  retry_after_meaningful_action_allowed: false,
  retry_after_repository_mutation_allowed: false,
  eligible_failure_class: "pre_action_host_infrastructure_failure",
  replacements_per_slot: 1,
  replacement_invocation_limit:
    COMMISSIONED_LIVE_TRAINING_REPLACEMENT_LIMIT_V01,
  replacement_requires_new_executor: true,
  replacement_requires_new_run: true,
  replacement_requires_new_request: true,
  replacement_requires_new_host_context: true,
  replacement_requires_new_clone: true,
  transcript_or_hidden_reasoning_inheritance_allowed: false,
  prior_execution_grant_inheritance_allowed: false,
});

const STOP_CONDITIONS_V01 = Object.freeze({
  stop_condition_version: "commissioned_live_training_stop_conditions.v0.1",
  source_or_family_drift: "stop_before_next_native_invocation",
  schedule_or_runtime_drift: "stop_before_next_native_invocation",
  provider_model_route_or_effort_drift: "stop_before_next_native_invocation",
  authorization_expired_or_replayed: "stop_before_first_native_invocation",
  ceiling_reached: "stop_before_next_native_invocation",
  unauthorized_effect_observed: "stop_cohort",
  cleanup_incomplete: "stop_cohort",
  holdout_material_requested: "stop_cohort",
  detach_or_reconciliation:
    "terminal_nonreplaceable_consumed_cohort_incomplete",
});

const APPROVAL_POLICY_V01 = Object.freeze({
  policy_version: "commissioned_live_training_approval_policy.v0.1",
  policy_kind: "terminal_on_any_request",
  approval_granted: false,
  in_root_operation_request: "cancel_run",
  network_request: "cancel_run",
  outside_root_request: "cancel_run",
  github_or_publication_request: "cancel_run",
  package_or_download_request: "cancel_run",
  credential_or_semantic_request: "cancel_run",
  unclassified_request: "cancel_run",
  broad_command_or_resource_persisted: false,
});

const RESUME_POLICY_V01 = Object.freeze({
  policy_version: "commissioned_live_training_resume_policy.v0.1",
  same_run_resume_supported: false,
  maximum_resume_count_per_attempt: 0,
  maximum_resume_count_per_cohort: 0,
  detach_or_reconciliation:
    "terminal_nonreplaceable_consumed_cohort_incomplete",
  replacement_allowed: false,
});

const COMPONENT_ANALYSIS_RULES_V01 = Object.freeze([
  {
    component_id: "reobserve_current_source_before_action",
    objective_observation_fields: [
      "source_currentness",
      "deterministic_repository_task_success",
      "hard_failures",
    ],
    comparable_conditions: [
      "exact_current_continuity",
      "stale_or_regime_shift_continuity",
      "zero_continuation_control",
    ],
    equal_common_evidence_required: true,
    independent_origin_grouping: "case_independent_origin_group_id",
    positive_pattern_code:
      "exact_current_succeeds_while_comparator_fails_currentness",
    opposing_pattern_code: "exact_currentness_failure",
    contradictory_hard_failure_codes: ["source_currentness_mismatch"],
    harmful_transfer_condition: "target_arm_harmful_transfer_observed",
    infrastructure_invalid_attempts_excluded: true,
    strongest_simpler_comparator:
      "equal_common_evidence_without_exact_current_continuity",
    missing_evidence_code: "two_origin_currentness_contrast_missing",
    mechanically_eligible_condition:
      "two_independent_objective_origin_patterns_no_contradiction_or_harm",
    not_eligible_condition: "contradictory_hard_failure_or_harmful_transfer",
    incomplete_condition:
      "fewer_than_two_independent_comparable_objective_patterns",
    falsifier_codes: [
      "exact_currentness_failure",
      "harmful_transfer_observed",
      "common_evidence_not_equal",
    ],
    uncertainty_codes: [
      "objective_contrast_does_not_establish_executor_material_use",
    ],
  },
  {
    component_id: "preserve_negative_status_without_new_support",
    objective_observation_fields: [
      "negative_space_status",
      "deterministic_repository_task_success",
      "hard_failures",
    ],
    comparable_conditions: [
      "exact_current_continuity",
      "stale_or_regime_shift_continuity",
      "zero_continuation_control",
    ],
    equal_common_evidence_required: true,
    independent_origin_grouping: "case_independent_origin_group_id",
    positive_pattern_code:
      "exact_preserves_negative_space_while_comparator_revives",
    opposing_pattern_code: "exact_negative_space_revived",
    contradictory_hard_failure_codes: ["negative_space_revived"],
    harmful_transfer_condition: "target_arm_harmful_transfer_observed",
    infrastructure_invalid_attempts_excluded: true,
    strongest_simpler_comparator:
      "equal_common_evidence_without_exact_negative_space_continuity",
    missing_evidence_code: "two_origin_negative_space_contrast_missing",
    mechanically_eligible_condition:
      "two_independent_objective_origin_patterns_no_contradiction_or_harm",
    not_eligible_condition: "contradictory_hard_failure_or_harmful_transfer",
    incomplete_condition:
      "fewer_than_two_independent_comparable_objective_patterns",
    falsifier_codes: [
      "exact_negative_space_revived",
      "harmful_transfer_observed",
      "common_evidence_not_equal",
    ],
    uncertainty_codes: [
      "objective_contrast_does_not_establish_executor_material_use",
    ],
  },
  {
    component_id: "separate_execution_completion_from_verified_success",
    objective_observation_fields: [
      "verification_completeness",
      "deterministic_repository_task_success",
      "hard_failures",
    ],
    comparable_conditions: [
      "exact_current_continuity",
      "matched_ablation",
      "zero_continuation_control",
    ],
    equal_common_evidence_required: true,
    independent_origin_grouping: "case_independent_origin_group_id",
    positive_pattern_code:
      "exact_verification_complete_while_comparator_incomplete",
    opposing_pattern_code: "exact_required_verification_incomplete",
    contradictory_hard_failure_codes: [
      "required_check_failed",
      "required_check_not_performed",
      "objective_oracle_failed",
    ],
    harmful_transfer_condition: "target_arm_harmful_transfer_observed",
    infrastructure_invalid_attempts_excluded: true,
    strongest_simpler_comparator:
      "equal_common_evidence_without_exact_verification_continuity",
    missing_evidence_code: "two_origin_verification_contrast_missing",
    mechanically_eligible_condition:
      "two_independent_objective_origin_patterns_no_contradiction_or_harm",
    not_eligible_condition: "contradictory_hard_failure_or_harmful_transfer",
    incomplete_condition:
      "fewer_than_two_independent_comparable_objective_patterns",
    falsifier_codes: [
      "exact_required_verification_incomplete",
      "harmful_transfer_observed",
      "common_evidence_not_equal",
    ],
    uncertainty_codes: [
      "objective_contrast_does_not_establish_executor_material_use",
    ],
  },
] as const satisfies readonly CommissionedLiveTrainingComponentAnalysisRuleV01[]);

const SCHEDULE_BLUEPRINT_V01 = [
  ["case-amber-17", null],
  ["case-cobalt-29", null],
  ["case-cedar-41", null],
  ["case-amber-17", "exact_current_continuity"],
  ["case-cobalt-29", "matched_ablation"],
  ["case-cedar-41", "stale_or_regime_shift_continuity"],
  ["case-amber-17", "matched_ablation"],
  ["case-cobalt-29", "stale_or_regime_shift_continuity"],
  ["case-cedar-41", "zero_continuation_control"],
  ["case-amber-17", "stale_or_regime_shift_continuity"],
  ["case-cobalt-29", "zero_continuation_control"],
  ["case-cedar-41", "exact_current_continuity"],
  ["case-amber-17", "zero_continuation_control"],
  ["case-cobalt-29", "exact_current_continuity"],
  ["case-cedar-41", "matched_ablation"],
] as const satisfies readonly (readonly [
  CommissionedLiveTrainingCaseIdV01,
  CommissionedWorkConditionV01 | null,
])[];

const OPAQUE_EXECUTOR_ASSIGNMENTS_V01 = [
  ["executor-7e8c319b1f6d", "episode-c72e9418a53f"],
  ["executor-25a6f98d704c", "episode-5f8ba27c194e"],
  ["executor-b04d75e2a913", "episode-83d1c6ea7059"],
  ["executor-4c9710f5b2de", "episode-29e7a18d63b4"],
  ["executor-e1b63a94705f", "episode-760cb58e2a1d"],
  ["executor-986f2d1c47a5", "episode-af31e6085c72"],
  ["executor-3a72c8e5d901", "episode-184fb96d72ce"],
  ["executor-d5904b7a2e16", "episode-e86a21c49f35"],
  ["executor-61e4a9c07b3d", "episode-47d8f2a16c90"],
  ["executor-a8c137d05e64", "episode-b39f04e7a251"],
  ["executor-0d96e42a7c51", "episode-6a1ce895d740"],
  ["executor-f37b105c8e29", "episode-d2057a4ec168"],
  ["executor-52c809f4d6a3", "episode-91be3d760ac5"],
  ["executor-c4a1750e9d82", "episode-3e8d62f10b47"],
  ["executor-19d6b3e870a4", "episode-f05c7a2d916e"],
] as const;

export const COMMISSIONED_LIVE_TRAINING_ARTIFACT_NAMESPACE_V01 =
  ".augnes-lab/commissioned-controlled-workbench/live-training-v0-1" as const;

export class CommissionedControlledLiveTrainingErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CommissionedControlledLiveTrainingErrorV01";
  }
}

export function createCommissionedLiveTrainingRecordRefV01(input: {
  record_version: string;
  record_id: string;
  record_fingerprint: string;
}): CommissionedWorkRecordRefV01 {
  return createCommissionedWorkRecordRefV01(input);
}

export function commissionedLiveTrainingRecordRefV01(
  record:
    | CommissionedLiveTrainingCohortPlanV01
    | CommissionedLiveTrainingAuthorizationV01
    | CommissionedLiveTrainingCodexEnvironmentBindingV01
    | CommissionedLiveTrainingAttemptStartV01
    | CommissionedLiveTrainingAttemptAdmissionV01
    | CommissionedLiveTrainingAttemptTerminalV01
    | CommissionedLiveTrainingAttemptRegistryV01
    | CommissionedLiveTrainingCloneSealV01
    | CommissionedLiveTrainingBlindObjectiveObservationV01
    | CommissionedLiveTrainingAnalysisJoinV01
    | CommissionedLiveTrainingCandidateAssessmentV01
    | CommissionedLiveTrainingCleanupObservationV01
    | CommissionedLiveTrainingCleanupReportV01
    | CommissionedLiveTrainingIncompleteCloseoutV01
    | CommissionedLiveTrainingResultV01,
): CommissionedWorkRecordRefV01 {
  const version = recordVersionV01(record);
  const id = recordIdV01(record);
  return createCommissionedWorkRecordRefV01({
    record_version: version,
    record_id: id,
    record_fingerprint: record.integrity.fingerprint,
  });
}

export function commissionedWorkManifestRecordRefV01(
  manifest: CommissionedWorkFamilyManifestV01,
): CommissionedWorkRecordRefV01 {
  return createCommissionedWorkRecordRefV01({
    record_version: manifest.family_version,
    record_id: manifest.family_id,
    record_fingerprint: manifest.integrity.fingerprint,
  });
}

export function commissionedWorkCaseCommitmentRecordRefV01(
  manifest: CommissionedWorkFamilyManifestV01,
  caseId: CommissionedLiveTrainingCaseIdV01,
): CommissionedWorkRecordRefV01 {
  const commitment = manifest.training_cases.find(
    (candidate) => candidate.case_id === caseId,
  );
  if (!commitment) failV01("live_training_case_commitment_missing");
  return createCommissionedWorkRecordRefV01({
    record_version: commitment.commitment_version,
    record_id: commitment.case_id,
    record_fingerprint: commitment.integrity.fingerprint,
  });
}

export function buildCommissionedLiveTrainingCohortPlanV01(input: {
  manifest: CommissionedWorkFamilyManifestV01;
  training_cases: [
    CommissionedWorkCaseSourceV01,
    CommissionedWorkCaseSourceV01,
    CommissionedWorkCaseSourceV01,
  ];
  cohort_id: string;
  sealed_at: string;
}): CommissionedLiveTrainingCohortPlanV01 {
  requireSafeCodeV01(input.cohort_id, "live_training_cohort_id_invalid");
  requireTimestampV01(input.sealed_at, "live_training_plan_seal_time_invalid");
  assertTrainingOnlyFamilyBindingV01(input.manifest, input.training_cases);
  const sources = new Map(
    input.training_cases.map((source) => [source.case_id, source] as const),
  );
  const slots = SCHEDULE_BLUEPRINT_V01.map(
    ([caseId, condition], index): CommissionedLiveTrainingScheduleSlotV01 => {
      const source = sources.get(caseId);
      if (!source) failV01("live_training_schedule_case_missing");
      const opaqueAssignment = OPAQUE_EXECUTOR_ASSIGNMENTS_V01[index];
      if (!opaqueAssignment) failV01("live_training_schedule_opaque_assignment_missing");
      const ordinal = index + 1;
      const predecessor = condition === null;
      const plan = predecessor
        ? source.predecessor_plan
        : source.successor_plans.find(
            (candidate) => candidate.condition === condition,
          );
      if (!plan) failV01("live_training_schedule_plan_missing");
      const round = predecessor ? 0 : (Math.floor((ordinal - 4) / 3) + 1);
      if (round < 0 || round > 4) failV01("live_training_schedule_round_invalid");
      const slotWithoutFingerprint = {
        slot_id: `cw1l1-slot-${String(ordinal).padStart(3, "0")}`,
        ordinal,
        round: round as 0 | 1 | 2 | 3 | 4,
        slot_role: predecessor ? ("predecessor" as const) : ("cold_successor" as const),
        case_id: caseId,
        condition,
        existing_reentry_role:
          condition === null
            ? null
            : COMMISSIONED_WORK_TREATMENT_ROLE_BINDINGS_V01[condition],
        executor_role_ref: createCommissionedWorkRoleRefV01(
          "executor",
          opaqueAssignment[0],
        ),
        primary_attempt_id: `cw1l1-attempt-${String(ordinal).padStart(3, "0")}-p`,
        replacement_allowed: true,
        executor_visible_slot_identity: opaqueAssignment[1],
      };
      return {
        ...slotWithoutFingerprint,
        assignment_fingerprint: fingerprintV01(slotWithoutFingerprint),
      };
    },
  );
  assertExactScheduleV01(slots);
  const familyRef = commissionedWorkManifestRecordRefV01(input.manifest);
  const trainingCaseRefs = COMMISSIONED_LIVE_TRAINING_CASE_IDS_V01.map((caseId) =>
    commissionedWorkCaseCommitmentRecordRefV01(input.manifest, caseId),
  ) as CommissionedLiveTrainingCohortPlanV01["training_case_refs"];
  const scheduleFingerprint = fingerprintV01({
    schedule_version: "commissioned_live_training_schedule.v0.1",
    slots,
  });
  const withoutIntegrity = {
    plan_version: COMMISSIONED_LIVE_TRAINING_PLAN_VERSION_V01,
    cohort_id: input.cohort_id,
    issue_ref: COMMISSIONED_LIVE_TRAINING_ISSUE_REF_V01,
    foundation_main_sha: COMMISSIONED_LIVE_TRAINING_FOUNDATION_MAIN_SHA_V01,
    foundation_main_tree: COMMISSIONED_LIVE_TRAINING_FOUNDATION_MAIN_TREE_V01,
    family_ref: familyRef,
    training_case_refs: trainingCaseRefs,
    sealed_at: input.sealed_at,
    primary_episode_limit:
      COMMISSIONED_LIVE_TRAINING_PRIMARY_EPISODE_LIMIT_V01,
    replacement_invocation_limit:
      COMMISSIONED_LIVE_TRAINING_REPLACEMENT_LIMIT_V01,
    slots,
    schedule_fingerprint: scheduleFingerprint,
    replacement_policy_fingerprint: fingerprintV01(REPLACEMENT_POLICY_V01),
    stop_condition_fingerprint: fingerprintV01(STOP_CONDITIONS_V01),
    approval_policy_fingerprint: fingerprintV01(APPROVAL_POLICY_V01),
    resume_policy_fingerprint: fingerprintV01(RESUME_POLICY_V01),
    candidate_analysis_rule_fingerprint: fingerprintV01(
      COMPONENT_ANALYSIS_RULES_V01,
    ),
    task_evidence_equal_within_case: true as const,
    condition_assignment_executor_visible: false as const,
    evaluator_condition_blind_until_observation_seal: true as const,
    holdout_case_commitment_only: true as const,
    holdout_source_materialized: false as const,
    holdout_execution_authorized: false as const,
    holdout_candidate_freeze_authorized: false as const,
    candidate_specific_transfer_claimed: false as const,
  };
  const plan = sealV01(
    withoutIntegrity,
    "commissioned_live_training_plan_without_integrity_fingerprint",
  );
  assertSafeCommissionedLiveTrainingOutputV01(plan);
  return plan;
}

export function assertValidCommissionedLiveTrainingCohortPlanV01(
  plan: CommissionedLiveTrainingCohortPlanV01,
): void {
  assertExactObjectKeysV01(plan, [
    "plan_version", "cohort_id", "issue_ref", "foundation_main_sha",
    "foundation_main_tree", "family_ref", "training_case_refs", "sealed_at",
    "primary_episode_limit", "replacement_invocation_limit", "slots",
    "schedule_fingerprint", "replacement_policy_fingerprint",
    "stop_condition_fingerprint", "approval_policy_fingerprint",
    "resume_policy_fingerprint", "candidate_analysis_rule_fingerprint",
    "task_evidence_equal_within_case",
    "condition_assignment_executor_visible",
    "evaluator_condition_blind_until_observation_seal",
    "holdout_case_commitment_only", "holdout_source_materialized",
    "holdout_execution_authorized", "holdout_candidate_freeze_authorized",
    "candidate_specific_transfer_claimed", "integrity",
  ], "live_training_plan_schema_invalid");
  validateIntegrityV01(
    plan,
    "commissioned_live_training_plan_without_integrity_fingerprint",
    "live_training_plan_integrity_invalid",
  );
  if (
    plan.plan_version !== COMMISSIONED_LIVE_TRAINING_PLAN_VERSION_V01 ||
    plan.issue_ref !== COMMISSIONED_LIVE_TRAINING_ISSUE_REF_V01 ||
    plan.foundation_main_sha !== COMMISSIONED_LIVE_TRAINING_FOUNDATION_MAIN_SHA_V01 ||
    plan.foundation_main_tree !== COMMISSIONED_LIVE_TRAINING_FOUNDATION_MAIN_TREE_V01 ||
    plan.primary_episode_limit !== COMMISSIONED_LIVE_TRAINING_PRIMARY_EPISODE_LIMIT_V01 ||
    plan.replacement_invocation_limit !== COMMISSIONED_LIVE_TRAINING_REPLACEMENT_LIMIT_V01 ||
    plan.task_evidence_equal_within_case !== true ||
    plan.condition_assignment_executor_visible !== false ||
    plan.evaluator_condition_blind_until_observation_seal !== true ||
    plan.holdout_case_commitment_only !== true ||
    plan.holdout_source_materialized !== false ||
    plan.holdout_execution_authorized !== false ||
    plan.holdout_candidate_freeze_authorized !== false ||
    plan.candidate_specific_transfer_claimed !== false
  ) {
    failV01("live_training_plan_contract_invalid");
  }
  assertExactScheduleV01(plan.slots);
  if (
    plan.schedule_fingerprint !==
      fingerprintV01({
        schedule_version: "commissioned_live_training_schedule.v0.1",
        slots: plan.slots,
      }) ||
    plan.replacement_policy_fingerprint !== fingerprintV01(REPLACEMENT_POLICY_V01) ||
    plan.stop_condition_fingerprint !== fingerprintV01(STOP_CONDITIONS_V01) ||
    plan.approval_policy_fingerprint !== fingerprintV01(APPROVAL_POLICY_V01) ||
    plan.resume_policy_fingerprint !== fingerprintV01(RESUME_POLICY_V01) ||
    plan.candidate_analysis_rule_fingerprint !==
      fingerprintV01(COMPONENT_ANALYSIS_RULES_V01)
  ) {
    failV01("live_training_plan_binding_invalid");
  }
  assertSafeCommissionedLiveTrainingOutputV01(plan);
}

export function buildCommissionedLiveTrainingExactNativeExecutionConfigurationV01(input: {
  provider_id: string;
  model_id: string;
  route_id: string;
  reasoning_effort: CommissionedLiveTrainingExactNativeExecutionConfigurationV01["reasoning_effort"];
  expected_cli_version: string;
  adapter_ref: CommissionedWorkRecordRefV01;
  capability_ref: CommissionedWorkRecordRefV01;
  host_ref: CommissionedWorkRecordRefV01;
  cli_ref: CommissionedWorkRecordRefV01;
  runtime_ref: CommissionedWorkRecordRefV01;
  provider_ref: CommissionedWorkRecordRefV01;
  model_ref: CommissionedWorkRecordRefV01;
  route_ref: CommissionedWorkRecordRefV01;
  cli_executable_identity: CommissionedLiveTrainingExecutableIdentityV01;
  runtime_executable_identity: CommissionedLiveTrainingExecutableIdentityV01;
}): CommissionedLiveTrainingExactNativeExecutionConfigurationV01 {
  if (!isSafeCliVersionV01(input.expected_cli_version)) {
    failV01("live_training_cli_version_invalid");
  }
  for (const record of [
    input.adapter_ref,
    input.capability_ref,
    input.host_ref,
    input.cli_ref,
    input.runtime_ref,
    input.provider_ref,
    input.model_ref,
    input.route_ref,
  ]) {
    createCommissionedWorkRecordRefV01(record);
  }
  assertCommissionedLiveTrainingExecutableIdentityV01(
    input.cli_executable_identity,
  );
  assertCommissionedLiveTrainingExecutableIdentityV01(
    input.runtime_executable_identity,
  );
  createCodexAppServerExactExecutionBindingV01({
    provider_id: input.provider_id,
    model_id: input.model_id,
    route_id: input.route_id,
    reasoning_effort: input.reasoning_effort,
    expected_cli_version: input.expected_cli_version,
    source_configuration_fingerprint: fingerprintV01({
      provider_ref: input.provider_ref,
      model_ref: input.model_ref,
      route_ref: input.route_ref,
      host_ref: input.host_ref,
      cli_ref: input.cli_ref,
      runtime_ref: input.runtime_ref,
    }),
  });
  const withoutFingerprint = {
    configuration_version:
      "commissioned_live_training_native_execution_configuration.v0.1" as const,
    provider_id: input.provider_id,
    model_id: input.model_id,
    route_id: input.route_id,
    reasoning_effort: input.reasoning_effort,
    expected_cli_version: input.expected_cli_version,
    adapter_ref: createCommissionedWorkRecordRefV01(input.adapter_ref),
    capability_ref: createCommissionedWorkRecordRefV01(input.capability_ref),
    host_ref: createCommissionedWorkRecordRefV01(input.host_ref),
    cli_ref: createCommissionedWorkRecordRefV01(input.cli_ref),
    runtime_ref: createCommissionedWorkRecordRefV01(input.runtime_ref),
    provider_ref: createCommissionedWorkRecordRefV01(input.provider_ref),
    model_ref: createCommissionedWorkRecordRefV01(input.model_ref),
    route_ref: createCommissionedWorkRecordRefV01(input.route_ref),
    cli_executable_identity: input.cli_executable_identity,
    runtime_executable_identity: input.runtime_executable_identity,
    provider_bearing_native_host_invocation_limit_semantics:
      "max_provider_bearing_native_host_invocations" as const,
    model_bearing_native_host_invocation_limit_semantics:
      "max_model_bearing_native_host_invocations" as const,
  };
  return {
    ...withoutFingerprint,
    configuration_fingerprint: fingerprintV01(withoutFingerprint),
  };
}

export function assertCommissionedLiveTrainingExecutableIdentityV01(
  identity: CommissionedLiveTrainingExecutableIdentityV01,
): void {
  assertExactObjectKeysV01(identity, [
    "identity_version", "executable_kind", "realpath_fingerprint",
    "content_fingerprint", "physical_identity_fingerprint", "executable_ref",
  ], "live_training_executable_identity_schema_invalid");
  if (
    identity.identity_version !==
      "commissioned_live_training_executable_identity.v0.1" ||
    ![
      "codex_app_server_cli",
      "node_runtime",
      "test_fake_app_server",
    ].includes(identity.executable_kind)
  ) {
    failV01("live_training_executable_identity_invalid");
  }
  for (const fingerprint of [
    identity.realpath_fingerprint,
    identity.content_fingerprint,
    identity.physical_identity_fingerprint,
  ]) {
    requireFingerprintV01(
      fingerprint,
      "live_training_executable_identity_fingerprint_invalid",
    );
  }
  createCommissionedWorkRecordRefV01(identity.executable_ref);
}

const CODEX_CONFIGURATION_PROJECTION_V01 = Object.freeze({
  projection_version: "commissioned_live_training_codex_configuration_projection.v0.1",
  approval_policy: "on-request",
  approvals_reviewer: "user",
  sandbox_type: "workspaceWrite",
  sandbox_network_access: false,
  instruction_sources: [] as string[],
  thread_ephemeral: true,
});

const CODEX_TOOL_POLICY_PROJECTION_V01 = Object.freeze({
  projection_version: "commissioned_live_training_codex_tool_policy_projection.v0.1",
  expected_tools: [] as string[],
  mcp_servers: [] as string[],
  web_search_enabled: false,
  remote_tools_enabled: false,
  github_tools_enabled: false,
});

const CODEX_ALLOWED_ENVIRONMENT_KEYS_V01 = Object.freeze([
  "CODEX_HOME",
  "CODEX_SQLITE_HOME",
  "HOME",
  "LANG",
  "LC_ALL",
  "LC_CTYPE",
  "NODE_ENV",
  "NODE_OPTIONS",
  "NO_COLOR",
  "PATH",
  "TEMP",
  "TMP",
  "TMPDIR",
  "TZ",
]);

const CODEX_FORBIDDEN_ENVIRONMENT_KEYS_V01 = Object.freeze([
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "GH_TOKEN",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
]);

export function commissionedLiveTrainingExpectedCodexConfigurationFingerprintV01(): string {
  return fingerprintV01(CODEX_CONFIGURATION_PROJECTION_V01);
}

export function commissionedLiveTrainingExpectedToolPolicyFingerprintV01(): string {
  return fingerprintV01(CODEX_TOOL_POLICY_PROJECTION_V01);
}

export function buildCommissionedLiveTrainingCodexEnvironmentBindingV01(input: {
  binding_id: string;
  binding_class: CommissionedLiveTrainingCodexEnvironmentBindingV01["binding_class"];
  account_auth_projection_ref: CommissionedWorkRecordRefV01 | null;
  account_auth_projection_fingerprint: string | null;
  task_network_enforcement_ref: CommissionedWorkRecordRefV01;
  unauthorized_effect_enforcement_ref: CommissionedWorkRecordRefV01;
}): CommissionedLiveTrainingCodexEnvironmentBindingV01 {
  requireSafeCodeV01(input.binding_id, "live_training_environment_binding_id_invalid");
  const testBinding = input.binding_class === "zero_provider_control_flow_conformance";
  if (
    testBinding !== (input.account_auth_projection_ref !== null) ||
    testBinding !== (input.account_auth_projection_fingerprint !== null)
  ) {
    failV01("live_training_environment_account_projection_invalid");
  }
  if (input.account_auth_projection_ref) {
    createCommissionedWorkRecordRefV01(input.account_auth_projection_ref);
    requireFingerprintV01(
      input.account_auth_projection_fingerprint!,
      "live_training_environment_account_projection_invalid",
    );
  }
  createCommissionedWorkRecordRefV01(input.task_network_enforcement_ref);
  createCommissionedWorkRecordRefV01(input.unauthorized_effect_enforcement_ref);
  const withoutIntegrity = {
    environment_binding_version:
      COMMISSIONED_LIVE_TRAINING_CODEX_ENVIRONMENT_BINDING_VERSION_V01,
    environment_strategy_version:
      "commissioned_live_training_isolated_attempt_home.v0.1" as const,
    binding_id: input.binding_id,
    binding_class: input.binding_class,
    account_auth_projection_status: testBinding
      ? ("credential_free_test_projection" as const)
      : ("credential_safe_projection_unavailable" as const),
    account_auth_projection_ref: input.account_auth_projection_ref,
    account_auth_projection_fingerprint:
      input.account_auth_projection_fingerprint,
    codex_configuration_fingerprint:
      commissionedLiveTrainingExpectedCodexConfigurationFingerprintV01(),
    mcp_tool_web_policy_fingerprint:
      commissionedLiveTrainingExpectedToolPolicyFingerprintV01(),
    expected_tool_set_fingerprint: fingerprintV01([]),
    expected_tool_set: [] as [],
    state_home_isolation_strategy:
      "fresh_per_attempt_home_codex_home_sqlite_home" as const,
    history_thread_persistence_policy:
      "ephemeral_fresh_thread_no_shared_history" as const,
    per_attempt_home_identity_rule: "new_opaque_identity_per_attempt" as const,
    per_attempt_codex_home_identity_rule:
      "new_opaque_identity_per_attempt" as const,
    per_attempt_codex_sqlite_home_identity_rule:
      "new_opaque_identity_per_attempt" as const,
    allowed_environment_key_fingerprint: fingerprintV01(
      CODEX_ALLOWED_ENVIRONMENT_KEYS_V01,
    ),
    forbidden_environment_key_fingerprint: fingerprintV01(
      CODEX_FORBIDDEN_ENVIRONMENT_KEYS_V01,
    ),
    cleanup_policy:
      "remove_all_attempt_state_roots_on_success_or_failure" as const,
    task_network_enforcement_ref: createCommissionedWorkRecordRefV01(
      input.task_network_enforcement_ref,
    ),
    unauthorized_effect_enforcement_ref: createCommissionedWorkRecordRefV01(
      input.unauthorized_effect_enforcement_ref,
    ),
    shell_network_policy: "denied" as const,
    network_permission_policy: "decline_and_stop" as const,
    mcp_policy: "empty_and_unexpected_startup_refused" as const,
    built_in_web_remote_policy: "disabled" as const,
    github_tool_policy: "disabled" as const,
    same_run_resume_policy:
      "unsupported_terminal_nonreplaceable_stop" as const,
    maximum_resume_count_per_attempt: 0 as const,
    maximum_resume_count_per_cohort: 0 as const,
    approval_policy: "terminal_on_any_request" as const,
    future_live_execution_ready: false as const,
    missing_live_owner_code:
      "credential_safe_isolated_codex_auth_projection_unavailable" as const,
  };
  const binding = sealV01(
    withoutIntegrity,
    "commissioned_live_training_codex_environment_binding_without_integrity_fingerprint",
  );
  assertValidCommissionedLiveTrainingCodexEnvironmentBindingV01(binding);
  return binding;
}

export function assertValidCommissionedLiveTrainingCodexEnvironmentBindingV01(
  binding: CommissionedLiveTrainingCodexEnvironmentBindingV01,
): void {
  validateIntegrityV01(
    binding,
    "commissioned_live_training_codex_environment_binding_without_integrity_fingerprint",
    "live_training_environment_binding_integrity_invalid",
  );
  assertExactObjectKeysV01(binding, [
    "environment_binding_version", "environment_strategy_version", "binding_id",
    "binding_class", "account_auth_projection_status",
    "account_auth_projection_ref", "account_auth_projection_fingerprint",
    "codex_configuration_fingerprint", "mcp_tool_web_policy_fingerprint",
    "expected_tool_set_fingerprint", "expected_tool_set",
    "state_home_isolation_strategy", "history_thread_persistence_policy",
    "per_attempt_home_identity_rule", "per_attempt_codex_home_identity_rule",
    "per_attempt_codex_sqlite_home_identity_rule",
    "allowed_environment_key_fingerprint", "forbidden_environment_key_fingerprint",
    "cleanup_policy", "task_network_enforcement_ref",
    "unauthorized_effect_enforcement_ref", "shell_network_policy",
    "network_permission_policy", "mcp_policy", "built_in_web_remote_policy",
    "github_tool_policy", "same_run_resume_policy",
    "maximum_resume_count_per_attempt", "maximum_resume_count_per_cohort",
    "approval_policy", "future_live_execution_ready", "missing_live_owner_code",
    "integrity",
  ], "live_training_environment_binding_schema_invalid");
  requireSafeCodeV01(binding.binding_id, "live_training_environment_binding_id_invalid");
  const testBinding = binding.binding_class === "zero_provider_control_flow_conformance";
  if (
    !testBinding && binding.binding_class !== "future_live_execution_blocked" ||
    binding.environment_binding_version !==
      COMMISSIONED_LIVE_TRAINING_CODEX_ENVIRONMENT_BINDING_VERSION_V01 ||
    binding.environment_strategy_version !==
      "commissioned_live_training_isolated_attempt_home.v0.1" ||
    binding.account_auth_projection_status !==
      (testBinding
        ? "credential_free_test_projection"
        : "credential_safe_projection_unavailable") ||
    testBinding !== (binding.account_auth_projection_ref !== null) ||
    testBinding !== (binding.account_auth_projection_fingerprint !== null) ||
    binding.codex_configuration_fingerprint !==
      commissionedLiveTrainingExpectedCodexConfigurationFingerprintV01() ||
    binding.mcp_tool_web_policy_fingerprint !==
      commissionedLiveTrainingExpectedToolPolicyFingerprintV01() ||
    binding.expected_tool_set_fingerprint !== fingerprintV01([]) ||
    binding.expected_tool_set.length !== 0 ||
    binding.allowed_environment_key_fingerprint !==
      fingerprintV01(CODEX_ALLOWED_ENVIRONMENT_KEYS_V01) ||
    binding.forbidden_environment_key_fingerprint !==
      fingerprintV01(CODEX_FORBIDDEN_ENVIRONMENT_KEYS_V01) ||
    binding.future_live_execution_ready !== false ||
    binding.maximum_resume_count_per_attempt !== 0 ||
    binding.maximum_resume_count_per_cohort !== 0 ||
    binding.same_run_resume_policy !==
      "unsupported_terminal_nonreplaceable_stop" ||
    binding.approval_policy !== "terminal_on_any_request"
  ) {
    failV01("live_training_environment_binding_contract_invalid");
  }
  if (binding.account_auth_projection_ref) {
    createCommissionedWorkRecordRefV01(binding.account_auth_projection_ref);
    requireFingerprintV01(
      binding.account_auth_projection_fingerprint!,
      "live_training_environment_account_projection_invalid",
    );
  }
  createCommissionedWorkRecordRefV01(binding.task_network_enforcement_ref);
  createCommissionedWorkRecordRefV01(binding.unauthorized_effect_enforcement_ref);
  assertSafeCommissionedLiveTrainingOutputV01(binding);
}

export function createCommissionedLiveTrainingAdapterBindingV01(
  configuration: CommissionedLiveTrainingExactNativeExecutionConfigurationV01,
): CodexAppServerExactExecutionBindingV01 {
  assertValidNativeConfigurationV01(configuration);
  return createCodexAppServerExactExecutionBindingV01({
    provider_id: configuration.provider_id,
    model_id: configuration.model_id,
    route_id: configuration.route_id,
    reasoning_effort: configuration.reasoning_effort,
    expected_cli_version: configuration.expected_cli_version,
    source_configuration_fingerprint: fingerprintV01({
      provider_ref: configuration.provider_ref,
      model_ref: configuration.model_ref,
      route_ref: configuration.route_ref,
      host_ref: configuration.host_ref,
      cli_ref: configuration.cli_ref,
      runtime_ref: configuration.runtime_ref,
    }),
  });
}

export function buildCommissionedLiveTrainingAuthorizationV01(input: {
  authorization_id: string;
  authorization_kind: CommissionedLiveTrainingAuthorizationV01["authorization_kind"];
  issued_at: string;
  expires_at: string;
  current_main_sha: string;
  current_main_tree: string;
  checkout_root_fingerprint: string;
  plan: CommissionedLiveTrainingCohortPlanV01;
  native_execution_configuration: CommissionedLiveTrainingExactNativeExecutionConfigurationV01;
  codex_environment_binding: CommissionedLiveTrainingCodexEnvironmentBindingV01;
  authorization_nonce: string;
  artifact_relative_root: string;
  replacement_invocation_limit: number;
  native_host_invocation_limit: number;
  provider_bearing_native_host_invocation_limit: number;
  model_bearing_native_host_invocation_limit: number;
  provider_call_ceiling: CommissionedLiveTrainingAuthorizationV01["provider_call_ceiling"];
  model_call_ceiling: CommissionedLiveTrainingAuthorizationV01["model_call_ceiling"];
  usage_unit_ceiling: CommissionedLiveTrainingAuthorizationV01["usage_unit_ceiling"];
  cost_microunit_ceiling: CommissionedLiveTrainingAuthorizationV01["cost_microunit_ceiling"];
  per_episode_timeout_ms: number;
  total_cohort_timeout_ms: number;
}): CommissionedLiveTrainingAuthorizationV01 {
  assertValidCommissionedLiveTrainingCohortPlanV01(input.plan);
  requireSafeCodeV01(input.authorization_id, "live_training_authorization_id_invalid");
  requireTimestampV01(input.issued_at, "live_training_authorization_time_invalid");
  requireTimestampV01(input.expires_at, "live_training_authorization_time_invalid");
  requireCommitV01(input.current_main_sha, "live_training_authorization_main_invalid");
  requireCommitV01(input.current_main_tree, "live_training_authorization_tree_invalid");
  requireFingerprintV01(
    input.checkout_root_fingerprint,
    "live_training_authorization_checkout_root_invalid",
  );
  if (Date.parse(input.expires_at) <= Date.parse(input.issued_at)) {
    failV01("live_training_authorization_expiry_invalid");
  }
  if (!/^[A-Za-z0-9_-]{32,256}$/u.test(input.authorization_nonce)) {
    failV01("live_training_authorization_nonce_invalid");
  }
  assertValidArtifactRelativeRootV01(input.artifact_relative_root, input.plan.cohort_id);
  assertValidNativeConfigurationV01(input.native_execution_configuration);
  assertValidCommissionedLiveTrainingCodexEnvironmentBindingV01(
    input.codex_environment_binding,
  );
  assertExactCeilingV01(input.replacement_invocation_limit, 0, 3);
  assertExactCeilingV01(input.native_host_invocation_limit, 15, 18);
  assertExactCeilingV01(input.provider_bearing_native_host_invocation_limit, 0, 18);
  assertExactCeilingV01(input.model_bearing_native_host_invocation_limit, 0, 18);
  assertOptionalCeilingV01(input.provider_call_ceiling);
  assertOptionalCeilingV01(input.model_call_ceiling);
  if (
    input.replacement_invocation_limit !==
      COMMISSIONED_LIVE_TRAINING_REPLACEMENT_LIMIT_V01 ||
    input.native_host_invocation_limit > MAX_NATIVE_INVOCATIONS_V01
  ) {
    failV01("live_training_authorization_ceiling_invalid");
  }
  if (
    input.authorization_kind === "test_conformance" ||
    input.authorization_kind === "future_live_control_flow_conformance"
  ) {
    if (
      input.provider_bearing_native_host_invocation_limit !== 0 ||
      input.model_bearing_native_host_invocation_limit !== 0 ||
      input.codex_environment_binding.binding_class !==
        "zero_provider_control_flow_conformance"
    ) {
      failV01("live_training_test_authorization_provider_ceiling_invalid");
    }
  } else {
    failV01(
      "live_training_future_execution_credential_safe_environment_unavailable",
    );
  }
  assertOptionalCeilingV01(input.usage_unit_ceiling);
  assertOptionalCeilingV01(input.cost_microunit_ceiling);
  if (
    !Number.isInteger(input.per_episode_timeout_ms) ||
    input.per_episode_timeout_ms < 1_000 ||
    input.per_episode_timeout_ms > MAX_TIMEOUT_MS_V01 ||
    !Number.isInteger(input.total_cohort_timeout_ms) ||
    input.total_cohort_timeout_ms < input.per_episode_timeout_ms * 15 ||
    input.total_cohort_timeout_ms > MAX_TOTAL_TIMEOUT_MS_V01
  ) {
    failV01("live_training_authorization_timeout_invalid");
  }
  const withoutIntegrity = {
    authorization_version: COMMISSIONED_LIVE_TRAINING_AUTHORIZATION_VERSION_V01,
    authorization_id: input.authorization_id,
    authorization_kind: input.authorization_kind,
    issue_ref: COMMISSIONED_LIVE_TRAINING_ISSUE_REF_V01,
    issued_at: input.issued_at,
    expires_at: input.expires_at,
    source_binding: {
      repository_id: "hynk-studio/augnes" as const,
      main_sha: input.current_main_sha,
      main_tree: input.current_main_tree,
      checkout_root_fingerprint: input.checkout_root_fingerprint,
      family_ref: input.plan.family_ref,
      training_case_refs: input.plan.training_case_refs,
      cohort_plan_ref: commissionedLiveTrainingRecordRefV01(input.plan),
      schedule_fingerprint: input.plan.schedule_fingerprint,
      codex_environment_binding_ref: commissionedLiveTrainingRecordRefV01(
        input.codex_environment_binding,
      ),
    },
    native_execution_configuration: input.native_execution_configuration,
    codex_environment_binding: input.codex_environment_binding,
    artifact_relative_root: input.artifact_relative_root,
    primary_episode_limit:
      COMMISSIONED_LIVE_TRAINING_PRIMARY_EPISODE_LIMIT_V01,
    replacement_invocation_limit: input.replacement_invocation_limit,
    native_host_invocation_limit: input.native_host_invocation_limit,
    provider_bearing_native_host_invocation_limit: input.provider_bearing_native_host_invocation_limit,
    model_bearing_native_host_invocation_limit: input.model_bearing_native_host_invocation_limit,
    provider_call_ceiling: input.provider_call_ceiling,
    model_call_ceiling: input.model_call_ceiling,
    task_external_network_policy: {
      limit: 0 as const,
      enforcement_ref:
        input.codex_environment_binding.task_network_enforcement_ref,
    },
    usage_unit_ceiling: input.usage_unit_ceiling,
    cost_microunit_ceiling: input.cost_microunit_ceiling,
    per_episode_timeout_ms: input.per_episode_timeout_ms,
    total_cohort_timeout_ms: input.total_cohort_timeout_ms,
    replacement_policy_fingerprint: input.plan.replacement_policy_fingerprint,
    stop_condition_fingerprint: input.plan.stop_condition_fingerprint,
    execution_evidence_class: "commissioned_agent_observation" as const,
    authorization_nonce_fingerprint: fingerprintV01(input.authorization_nonce),
    single_use: true as const,
    consumed_state_in_record: "unconsumed" as const,
    authority_summary: authorizationAuthoritySummaryV01(
      input.authorization_kind,
    ),
  };
  const authorization = sealV01(
    withoutIntegrity,
    "commissioned_live_training_authorization_without_integrity_fingerprint",
  );
  assertSafeCommissionedLiveTrainingOutputV01(authorization);
  return authorization;
}

export function assertCommissionedLiveTrainingAuthorizationCurrentV01(input: {
  authorization: CommissionedLiveTrainingAuthorizationV01;
  plan: CommissionedLiveTrainingCohortPlanV01;
  current_main_sha: string;
  current_main_tree: string;
  checkout_root_fingerprint: string;
  evaluated_at: string;
  native_execution_configuration: CommissionedLiveTrainingExactNativeExecutionConfigurationV01;
  codex_environment_binding: CommissionedLiveTrainingCodexEnvironmentBindingV01;
  allow_test_conformance: boolean;
}): void {
  assertValidCommissionedLiveTrainingAuthorizationV01(
    input.authorization,
    input.plan,
  );
  requireTimestampV01(input.evaluated_at, "live_training_authorization_evaluation_time_invalid");
  if (
    input.authorization.source_binding.main_sha !== input.current_main_sha ||
    input.authorization.source_binding.main_tree !== input.current_main_tree ||
    input.authorization.source_binding.checkout_root_fingerprint !==
      input.checkout_root_fingerprint ||
    canonicalizeProtocolValueV01(input.authorization.native_execution_configuration) !==
      canonicalizeProtocolValueV01(input.native_execution_configuration) ||
    canonicalizeProtocolValueV01(input.authorization.codex_environment_binding) !==
      canonicalizeProtocolValueV01(input.codex_environment_binding)
  ) {
    failV01("live_training_authorization_source_or_runtime_drift");
  }
  if (Date.parse(input.evaluated_at) < Date.parse(input.authorization.issued_at)) {
    failV01("live_training_authorization_not_yet_valid");
  }
  if (Date.parse(input.evaluated_at) >= Date.parse(input.authorization.expires_at)) {
    failV01("live_training_authorization_expired");
  }
  if (
    [
      "test_conformance",
      "future_live_control_flow_conformance",
    ].includes(input.authorization.authorization_kind) &&
    !input.allow_test_conformance
  ) {
    failV01("live_training_test_authorization_not_live_authority");
  }
}

export function assertValidCommissionedLiveTrainingAuthorizationV01(
  authorization: CommissionedLiveTrainingAuthorizationV01,
  plan: CommissionedLiveTrainingCohortPlanV01,
): void {
  validateIntegrityV01(
    authorization,
    "commissioned_live_training_authorization_without_integrity_fingerprint",
    "live_training_authorization_integrity_invalid",
  );
  assertValidCommissionedLiveTrainingCohortPlanV01(plan);
  assertValidAuthorizationShapeV01(authorization, plan);
  if (
    authorization.authorization_version !==
      COMMISSIONED_LIVE_TRAINING_AUTHORIZATION_VERSION_V01 ||
    authorization.issue_ref !== COMMISSIONED_LIVE_TRAINING_ISSUE_REF_V01 ||
    authorization.source_binding.repository_id !== "hynk-studio/augnes" ||
    canonicalizeProtocolValueV01(authorization.source_binding.family_ref) !==
      canonicalizeProtocolValueV01(plan.family_ref) ||
    canonicalizeProtocolValueV01(authorization.source_binding.training_case_refs) !==
      canonicalizeProtocolValueV01(plan.training_case_refs) ||
    canonicalizeProtocolValueV01(authorization.source_binding.cohort_plan_ref) !==
      canonicalizeProtocolValueV01(commissionedLiveTrainingRecordRefV01(plan)) ||
    authorization.source_binding.schedule_fingerprint !== plan.schedule_fingerprint ||
    authorization.replacement_policy_fingerprint !== plan.replacement_policy_fingerprint ||
    authorization.stop_condition_fingerprint !== plan.stop_condition_fingerprint
  ) {
    failV01("live_training_authorization_source_or_runtime_drift");
  }
  if (
    canonicalizeProtocolValueV01(
      authorization.source_binding.codex_environment_binding_ref,
    ) !==
      canonicalizeProtocolValueV01(
        commissionedLiveTrainingRecordRefV01(
          authorization.codex_environment_binding,
        ),
      )
  ) {
    failV01("live_training_authorization_environment_binding_invalid");
  }
  assertSafeCommissionedLiveTrainingOutputV01(authorization);
}

function assertValidAuthorizationShapeV01(
  authorization: CommissionedLiveTrainingAuthorizationV01,
  plan: CommissionedLiveTrainingCohortPlanV01,
): void {
  assertExactObjectKeysV01(authorization, [
    "authorization_version", "authorization_id", "authorization_kind",
    "issue_ref", "issued_at", "expires_at", "source_binding",
    "native_execution_configuration", "codex_environment_binding",
    "artifact_relative_root",
    "primary_episode_limit", "replacement_invocation_limit",
    "native_host_invocation_limit", "provider_bearing_native_host_invocation_limit",
    "model_bearing_native_host_invocation_limit", "provider_call_ceiling",
    "model_call_ceiling", "task_external_network_policy", "usage_unit_ceiling",
    "cost_microunit_ceiling", "per_episode_timeout_ms",
    "total_cohort_timeout_ms", "replacement_policy_fingerprint",
    "stop_condition_fingerprint", "execution_evidence_class",
    "authorization_nonce_fingerprint", "single_use", "consumed_state_in_record",
    "authority_summary", "integrity",
  ], "live_training_authorization_schema_invalid");
  assertExactObjectKeysV01(authorization.source_binding, [
    "repository_id", "main_sha", "main_tree", "checkout_root_fingerprint", "family_ref",
    "training_case_refs", "cohort_plan_ref", "schedule_fingerprint",
    "codex_environment_binding_ref",
  ], "live_training_authorization_source_schema_invalid");
  assertExactObjectKeysV01(authorization.authority_summary, [
    "authority_kind", "authorizes_real_provider_calls",
    "authorizes_only_exact_training_slots", "authorizes_holdout",
    "authorizes_fallback_or_substitution", "authorizes_task_external_network",
    "authorizes_outside_root_writes", "authorizes_github_writes",
    "authorizes_core_or_product_writes", "authorizes_semantic_writes",
    "authorizes_review_decision_or_transition",
    "authorizes_policy_or_active_context", "authorizes_publication",
    "authorizes_merge", "is_product_execution_grant", "is_semantic_approval",
  ], "live_training_authorization_authority_schema_invalid");
  requireSafeCodeV01(
    authorization.authorization_id,
    "live_training_authorization_id_invalid",
  );
  requireTimestampV01(
    authorization.issued_at,
    "live_training_authorization_time_invalid",
  );
  requireTimestampV01(
    authorization.expires_at,
    "live_training_authorization_time_invalid",
  );
  requireFingerprintV01(
    authorization.authorization_nonce_fingerprint,
    "live_training_authorization_nonce_fingerprint_invalid",
  );
  requireCommitV01(
    authorization.source_binding.main_sha,
    "live_training_authorization_main_invalid",
  );
  requireFingerprintV01(
    authorization.source_binding.checkout_root_fingerprint,
    "live_training_authorization_checkout_root_invalid",
  );
  requireCommitV01(
    authorization.source_binding.main_tree,
    "live_training_authorization_tree_invalid",
  );
  createCommissionedWorkRecordRefV01(authorization.source_binding.family_ref);
  authorization.source_binding.training_case_refs.forEach((ref) =>
    createCommissionedWorkRecordRefV01(ref),
  );
  createCommissionedWorkRecordRefV01(
    authorization.source_binding.cohort_plan_ref,
  );
  assertValidArtifactRelativeRootV01(
    authorization.artifact_relative_root,
    plan.cohort_id,
  );
  assertValidNativeConfigurationV01(
    authorization.native_execution_configuration,
  );
  assertValidCommissionedLiveTrainingCodexEnvironmentBindingV01(
    authorization.codex_environment_binding,
  );
  createCommissionedWorkRecordRefV01(
    authorization.source_binding.codex_environment_binding_ref,
  );
  assertOptionalCeilingV01(authorization.usage_unit_ceiling);
  assertOptionalCeilingV01(authorization.cost_microunit_ceiling);
  assertOptionalCeilingV01(authorization.provider_call_ceiling);
  assertOptionalCeilingV01(authorization.model_call_ceiling);
  if (
    ![
      "test_conformance",
      "future_live_control_flow_conformance",
      "future_live_execution",
    ].includes(
      authorization.authorization_kind,
    ) ||
    Date.parse(authorization.expires_at) <= Date.parse(authorization.issued_at) ||
    authorization.primary_episode_limit !==
      COMMISSIONED_LIVE_TRAINING_PRIMARY_EPISODE_LIMIT_V01 ||
    authorization.replacement_invocation_limit !==
      COMMISSIONED_LIVE_TRAINING_REPLACEMENT_LIMIT_V01 ||
    !Number.isInteger(authorization.native_host_invocation_limit) ||
    authorization.native_host_invocation_limit < 15 ||
    authorization.native_host_invocation_limit > MAX_NATIVE_INVOCATIONS_V01 ||
    !Number.isInteger(authorization.provider_bearing_native_host_invocation_limit) ||
    !Number.isInteger(authorization.model_bearing_native_host_invocation_limit) ||
    authorization.provider_bearing_native_host_invocation_limit < 0 ||
    authorization.model_bearing_native_host_invocation_limit < 0 ||
    authorization.provider_bearing_native_host_invocation_limit > MAX_NATIVE_INVOCATIONS_V01 ||
    authorization.model_bearing_native_host_invocation_limit > MAX_NATIVE_INVOCATIONS_V01 ||
    (["test_conformance", "future_live_control_flow_conformance"].includes(
      authorization.authorization_kind) &&
      (authorization.provider_bearing_native_host_invocation_limit !== 0 ||
        authorization.model_bearing_native_host_invocation_limit !== 0 ||
        authorization.codex_environment_binding.binding_class !==
          "zero_provider_control_flow_conformance")) ||
    authorization.authorization_kind === "future_live_execution" ||
    authorization.task_external_network_policy.limit !== 0 ||
    canonicalizeProtocolValueV01(
      authorization.task_external_network_policy.enforcement_ref,
    ) !== canonicalizeProtocolValueV01(
      authorization.codex_environment_binding.task_network_enforcement_ref,
    ) ||
    !Number.isInteger(authorization.per_episode_timeout_ms) ||
    authorization.per_episode_timeout_ms < 1_000 ||
    authorization.per_episode_timeout_ms > MAX_TIMEOUT_MS_V01 ||
    !Number.isInteger(authorization.total_cohort_timeout_ms) ||
    authorization.total_cohort_timeout_ms <
      authorization.per_episode_timeout_ms * 15 ||
    authorization.total_cohort_timeout_ms > MAX_TOTAL_TIMEOUT_MS_V01 ||
    authorization.execution_evidence_class !==
      "commissioned_agent_observation" ||
    authorization.single_use !== true ||
    authorization.consumed_state_in_record !== "unconsumed" ||
    canonicalizeProtocolValueV01(authorization.authority_summary) !==
      canonicalizeProtocolValueV01(
        authorizationAuthoritySummaryV01(authorization.authorization_kind),
      )
  ) {
    failV01("live_training_authorization_contract_invalid");
  }
}

function authorizationAuthoritySummaryV01(
  authorizationKind: CommissionedLiveTrainingAuthorizationV01["authorization_kind"],
): CommissionedLiveTrainingAuthorizationV01["authority_summary"] {
  return {
    authority_kind: "single_use_commissioned_training_only",
    authorizes_real_provider_calls:
      authorizationKind === "future_live_execution",
    authorizes_only_exact_training_slots: true,
    authorizes_holdout: false,
    authorizes_fallback_or_substitution: false,
    authorizes_task_external_network: false,
    authorizes_outside_root_writes: false,
    authorizes_github_writes: false,
    authorizes_core_or_product_writes: false,
    authorizes_semantic_writes: false,
    authorizes_review_decision_or_transition: false,
    authorizes_policy_or_active_context: false,
    authorizes_publication: false,
    authorizes_merge: false,
    is_product_execution_grant: false,
    is_semantic_approval: false,
  };
}

export function assertCommissionedLiveTrainingInvocationGateV01(input: {
  authorization: CommissionedLiveTrainingAuthorizationV01;
  plan: CommissionedLiveTrainingCohortPlanV01;
  slot_id: string;
  native_host_invocations_started: number;
  provider_bearing_invocations_reserved: number;
  model_bearing_invocations_reserved: number;
  task_external_network_observation: CommissionedLiveTrainingSourcedResourceLaneV01;
  evaluated_at: string;
  current_main_sha: string;
  current_main_tree: string;
  checkout_root_fingerprint: string;
  native_execution_configuration: CommissionedLiveTrainingExactNativeExecutionConfigurationV01;
  codex_environment_binding: CommissionedLiveTrainingCodexEnvironmentBindingV01;
  authorization_consumed: boolean;
  provider_or_model_call_possible: boolean;
}): void {
  assertCommissionedLiveTrainingAuthorizationCurrentV01({
    authorization: input.authorization,
    plan: input.plan,
    current_main_sha: input.current_main_sha,
    current_main_tree: input.current_main_tree,
    checkout_root_fingerprint: input.checkout_root_fingerprint,
    evaluated_at: input.evaluated_at,
    native_execution_configuration: input.native_execution_configuration,
    codex_environment_binding: input.codex_environment_binding,
    allow_test_conformance: true,
  });
  if (!input.authorization_consumed) {
    failV01("live_training_authorization_not_consumed");
  }
  if (!input.plan.slots.some((slot) => slot.slot_id === input.slot_id)) {
    failV01("live_training_slot_not_authorized");
  }
  for (const count of [
    input.native_host_invocations_started,
    input.provider_bearing_invocations_reserved,
    input.model_bearing_invocations_reserved,
  ]) {
    if (!Number.isInteger(count) || count < 0) {
      failV01("live_training_observed_resource_count_invalid");
    }
  }
  assertSourcedResourceLaneV01(input.task_external_network_observation);
  if (input.task_external_network_observation.provenance === "unknown") {
    failV01("live_training_task_network_coverage_unknown");
  }
  if (
    canonicalizeProtocolValueV01(
      input.task_external_network_observation.source_ref,
    ) !== canonicalizeProtocolValueV01(
      input.authorization.task_external_network_policy.enforcement_ref,
    )
  ) {
    failV01("live_training_task_network_enforcement_source_invalid");
  }
  if (
    input.native_host_invocations_started >=
      input.authorization.native_host_invocation_limit ||
    input.provider_bearing_invocations_reserved >
      input.authorization.provider_bearing_native_host_invocation_limit ||
    input.model_bearing_invocations_reserved >
      input.authorization.model_bearing_native_host_invocation_limit ||
    (input.provider_or_model_call_possible &&
      (input.native_host_invocations_started >=
        input.authorization.provider_bearing_native_host_invocation_limit ||
        input.native_host_invocations_started >=
          input.authorization.model_bearing_native_host_invocation_limit)) ||
    input.task_external_network_observation.value !== 0
  ) {
    failV01("live_training_authorization_ceiling_reached");
  }
}

export function assertCommissionedLiveTrainingResourceCeilingsV01(input: {
  authorization: CommissionedLiveTrainingAuthorizationV01;
  native_host_invocations_started: number;
  provider_calls: CommissionedLiveTrainingSourcedResourceLaneV01;
  model_calls: CommissionedLiveTrainingSourcedResourceLaneV01;
  token_units: CommissionedLiveTrainingSourcedResourceLaneV01;
  cost_microunits: CommissionedLiveTrainingSourcedResourceLaneV01;
  elapsed_ms: number;
}): void {
  for (const lane of [
    input.provider_calls,
    input.model_calls,
    input.token_units,
    input.cost_microunits,
  ]) assertSourcedResourceLaneV01(lane);
  assertObservedOptionalCeilingV01(
    input.provider_calls,
    input.authorization.provider_call_ceiling,
  );
  assertObservedOptionalCeilingV01(
    input.model_calls,
    input.authorization.model_call_ceiling,
  );
  assertObservedOptionalCeilingV01(
    input.token_units,
    input.authorization.usage_unit_ceiling,
  );
  assertObservedOptionalCeilingV01(
    input.cost_microunits,
    input.authorization.cost_microunit_ceiling,
  );
  if (
    !Number.isInteger(input.native_host_invocations_started) ||
    input.native_host_invocations_started < 0 ||
    !Number.isInteger(input.elapsed_ms) ||
    input.elapsed_ms < 0 ||
    input.native_host_invocations_started >
      input.authorization.native_host_invocation_limit ||
    input.elapsed_ms > input.authorization.total_cohort_timeout_ms
  ) {
    failV01("live_training_authorization_resource_or_time_ceiling_exceeded");
  }
}

export function assertCommissionedLiveTrainingExecutorVisibleMaterialV01(
  value: unknown,
): void {
  const serialized = canonicalizeProtocolValueV01(value);
  const forbiddenLabels = [
    ...COMMISSIONED_WORK_CONDITIONS_V01,
    ...Object.values(COMMISSIONED_WORK_TREATMENT_ROLE_BINDINGS_V01),
    "strongest_equal_budget_baseline",
    "candidate_present",
    "candidate_component_ablation",
    "stale_or_reset",
    "holdout",
    "sibling_arm",
  ];
  if (forbiddenLabels.some((label) => serialized.includes(label))) {
    failV01("live_training_executor_condition_or_arm_leak");
  }
  if (Buffer.byteLength(serialized, "utf8") > 4_194_304) {
    failV01("live_training_executor_material_byte_bound_exceeded");
  }
  const allowedProtocolIdentityPaths = new Set<string>();
  const allowedFalseInvariantFields = new Set<string>();
  let unsafeString = false;
  walkOutputV01(value, "$", (candidate, path, key) => {
    allowedProtocolIdentityPaths.add(path);
    if (candidate === false && key !== null) allowedFalseInvariantFields.add(key);
    if (
      typeof candidate === "string" &&
      (candidate.length > 4_096 ||
        /(?:^|[\s"'`(])(?:\/Users\/|\/home\/|[A-Za-z]:[\\/]|\\\\)/u.test(
          candidate,
        ))
    ) {
      unsafeString = true;
    }
  });
  const issues = new Set<string>();
  scanForbiddenProtocolMaterialV01(
    value,
    "$",
    {
      error: (code) => issues.add(code),
      warning: () => {},
    },
    {
      secret_material_message:
        "Secret-shaped material is forbidden in live-training executor material.",
      provider_specific_field_message:
        "Protocol-owned executor identity must remain bounded.",
      allowed_canonical_identity_paths: allowedProtocolIdentityPaths,
      allowed_false_invariant_fields: allowedFalseInvariantFields,
    },
  );
  if (unsafeString || issues.size > 0) {
    failV01(
      unsafeString
        ? "live_training_executor_material_unsafe_string"
        : `live_training_executor_material_forbidden:${[...issues].sort()[0]}`,
    );
  }
}

export function createCommissionedLiveTrainingCommonRequestFingerprintV01(input: {
  case_id: CommissionedLiveTrainingCaseIdV01;
  packet_task: unknown;
  required_checks: readonly string[];
  operation_contract: unknown;
  post_drift_head: string;
  post_drift_tree: string;
  post_drift_source_fingerprint: string;
}): string {
  requireCommitV01(input.post_drift_head, "live_training_clone_head_invalid");
  requireCommitV01(input.post_drift_tree, "live_training_clone_tree_invalid");
  requireFingerprintV01(
    input.post_drift_source_fingerprint,
    "live_training_clone_source_invalid",
  );
  return fingerprintV01({
    common_request_version: "commissioned_live_training_common_request.v0.1",
    case_id: input.case_id,
    packet_task: input.packet_task,
    required_checks: [...input.required_checks].sort(compareProtocolCodeUnitsV01),
    operation_contract: input.operation_contract,
    post_drift_head: input.post_drift_head,
    post_drift_tree: input.post_drift_tree,
    post_drift_source_fingerprint: input.post_drift_source_fingerprint,
  });
}

function assertCloneBaselineV01(
  baseline: CommissionedLiveTrainingCloneSealV01["clone_baselines"][number],
): void {
  requireSafeCodeV01(baseline.slot_id, "live_training_clone_slot_invalid");
  requireCommitV01(baseline.initial_head, "live_training_clone_head_invalid");
  requireCommitV01(baseline.initial_tree, "live_training_clone_tree_invalid");
  for (const [fingerprint, code] of [
    [baseline.clone_identity_fingerprint, "live_training_clone_identity_invalid"],
    [baseline.root_scope_fingerprint, "live_training_clone_root_invalid"],
    [baseline.clean_worktree_content_fingerprint, "live_training_clone_content_invalid"],
    [baseline.current_source_fingerprint, "live_training_clone_source_invalid"],
    [baseline.common_request_fingerprint, "live_training_clone_common_evidence_invalid"],
  ] as const) {
    requireFingerprintV01(fingerprint, code);
  }
}

export function buildCommissionedLiveTrainingCloneSealV01(input: Omit<
  CommissionedLiveTrainingCloneSealV01,
  "seal_version" | "identical_initial_source_state" | "distinct_clone_identities" | "integrity"
> & {
  predecessor_checkpoint_source: CommissionedWorkEpisodeCheckpointV01;
  cohort_plan_source: CommissionedLiveTrainingCohortPlanV01;
}): CommissionedLiveTrainingCloneSealV01 {
  const {
    predecessor_checkpoint_source: predecessorCheckpoint,
    cohort_plan_source: cohortPlan,
    ...source
  } = input;
  assertValidCommissionedLiveTrainingCohortPlanV01(cohortPlan);
  requireSafeCodeV01(input.seal_id, "live_training_clone_seal_id_invalid");
  requireCommitV01(input.predecessor_head, "live_training_predecessor_head_invalid");
  requireCommitV01(input.predecessor_tree, "live_training_predecessor_tree_invalid");
  requireCommitV01(input.post_drift_head, "live_training_post_drift_head_invalid");
  requireCommitV01(input.post_drift_tree, "live_training_post_drift_tree_invalid");
  requireFingerprintV01(input.source_drift_fingerprint, "live_training_source_drift_invalid");
  requireFingerprintV01(
    input.post_drift_current_source_fingerprint,
    "live_training_post_drift_source_invalid",
  );
  validateIntegrityV01(
    predecessorCheckpoint,
    "commissioned_work_episode_checkpoint_without_integrity_fingerprint",
    "live_training_predecessor_checkpoint_integrity_invalid",
  );
  const checkpointRef = createCommissionedWorkRecordRefV01({
    record_version: predecessorCheckpoint.checkpoint_version,
    record_id: predecessorCheckpoint.checkpoint_id,
    record_fingerprint: predecessorCheckpoint.integrity.fingerprint,
  });
  if (
    canonicalizeProtocolValueV01(input.predecessor_checkpoint_ref) !==
      canonicalizeProtocolValueV01(checkpointRef) ||
    predecessorCheckpoint.case_id !== input.case_id ||
    predecessorCheckpoint.repository_state.episode_end_head !==
      input.predecessor_head ||
    predecessorCheckpoint.repository_state.episode_end_tree !==
      input.predecessor_tree ||
    predecessorCheckpoint.repository_state.worktree_fingerprint !==
      input.predecessor_worktree_fingerprint ||
    input.post_drift_parent_head !== input.predecessor_head ||
    input.post_drift_parent_is_predecessor_head !== true
  ) {
    failV01("live_training_clone_predecessor_source_binding_invalid");
  }
  if (input.clone_baselines.length !== 4) {
    failV01("live_training_clone_count_invalid");
  }
  const expected = input.clone_baselines[0];
  if (!expected) failV01("live_training_clone_count_invalid");
  const identical = input.clone_baselines.every(
    (baseline) =>
      baseline.initial_head === input.post_drift_head &&
      baseline.initial_tree === input.post_drift_tree &&
      baseline.initial_head === expected.initial_head &&
      baseline.initial_tree === expected.initial_tree &&
      baseline.clean_worktree_content_fingerprint ===
        expected.clean_worktree_content_fingerprint &&
      baseline.current_source_fingerprint === expected.current_source_fingerprint &&
      baseline.current_source_fingerprint ===
        input.post_drift_current_source_fingerprint &&
      baseline.common_request_fingerprint === expected.common_request_fingerprint,
  );
  const distinct =
    new Set(input.clone_baselines.map((baseline) => baseline.clone_identity_fingerprint))
      .size === 4 &&
    new Set(input.clone_baselines.map((baseline) => baseline.root_scope_fingerprint))
      .size === 4 &&
    new Set(input.clone_baselines.map((baseline) => baseline.slot_id)).size === 4;
  const expectedSlots = cohortPlan.slots
    .filter(
      (slot) =>
        slot.case_id === input.case_id && slot.slot_role === "cold_successor",
    )
    .map((slot) => slot.slot_id)
    .sort(compareProtocolCodeUnitsV01);
  const actualSlots = input.clone_baselines
    .map((baseline) => baseline.slot_id)
    .sort(compareProtocolCodeUnitsV01);
  input.clone_baselines.forEach((baseline) => {
    assertCloneBaselineV01(baseline);
  });
  if (!identical) failV01("live_training_successor_clone_initial_state_mismatch");
  if (!distinct) failV01("live_training_successor_clone_identity_reused");
  if (
    expectedSlots.length !== 4 ||
    canonicalizeProtocolValueV01(expectedSlots) !==
      canonicalizeProtocolValueV01(actualSlots)
  ) {
    failV01("live_training_clone_slot_set_invalid");
  }
  const withoutIntegrity = {
    seal_version: COMMISSIONED_LIVE_TRAINING_CLONE_SEAL_VERSION_V01,
    ...source,
    identical_initial_source_state: true as const,
    distinct_clone_identities: true as const,
  };
  return sealV01(
    withoutIntegrity,
    "commissioned_live_training_clone_seal_without_integrity_fingerprint",
  );
}

export function buildCommissionedLiveTrainingBlindObjectiveObservationV01(input: {
  blind_observation_id: string;
  slot: CommissionedLiveTrainingScheduleSlotV01;
  evaluator_role_id: string;
  evaluator_view_fingerprint: string;
  case_commitment: import("@/types/vnext/commissioned-controlled-workbench").CommissionedWorkCaseCommitmentV01;
  observation: CommissionedWorkObjectiveObservationV01;
  sealed_at: string;
}): CommissionedLiveTrainingBlindObjectiveObservationV01 {
  requireSafeCodeV01(input.blind_observation_id, "live_training_blind_observation_id_invalid");
  requireSafeCodeV01(input.slot.slot_id, "live_training_blind_observation_slot_invalid");
  requireFingerprintV01(
    input.evaluator_view_fingerprint,
    "live_training_evaluator_view_invalid",
  );
  requireTimestampV01(input.sealed_at, "live_training_blind_observation_time_invalid");
  if (
    input.observation.condition !== null ||
    input.observation.holdout_variant !== null ||
    input.observation.case_id !== input.slot.case_id ||
    input.case_commitment.case_id !== input.slot.case_id
  ) {
    failV01("live_training_evaluator_unblinded_before_observation_seal");
  }
  assertValidCommissionedWorkObjectiveObservationV01(
    input.observation,
    input.case_commitment,
  );
  const observationRef = createCommissionedWorkRecordRefV01({
    record_version: input.observation.observation_version,
    record_id: `${input.slot.slot_id}-objective-observation`,
    record_fingerprint: input.observation.integrity.fingerprint,
  });
  const withoutIntegrity = {
    blind_observation_version:
      COMMISSIONED_LIVE_TRAINING_BLIND_OBSERVATION_VERSION_V01,
    blind_observation_id: input.blind_observation_id,
    slot_id: input.slot.slot_id,
    evaluator_role_ref: createCommissionedWorkRoleRefV01(
      "outcome_evaluator",
      input.evaluator_role_id,
    ),
    evaluator_view_fingerprint: input.evaluator_view_fingerprint,
    case_commitment_ref: createCommissionedWorkRecordRefV01({
      record_version: input.case_commitment.commitment_version,
      record_id: input.case_commitment.case_id,
      record_fingerprint: input.case_commitment.integrity.fingerprint,
    }),
    observation: input.observation,
    observation_ref: observationRef,
    condition_assignment_visible: false as const,
    candidate_assignment_visible: false as const,
    executor_self_report_used_as_outcome_truth: false as const,
    sealed_at: input.sealed_at,
    mutable_after_seal: false as const,
  };
  const blind = sealV01(
    withoutIntegrity,
    "commissioned_live_training_blind_observation_without_integrity_fingerprint",
  );
  assertSafeCommissionedLiveTrainingOutputV01(blind);
  return blind;
}

export function buildCommissionedLiveTrainingAnalysisJoinV01(input: {
  join_id: string;
  slot: CommissionedLiveTrainingScheduleSlotV01;
  blind_observation: CommissionedLiveTrainingBlindObjectiveObservationV01;
  joined_at: string;
}): CommissionedLiveTrainingAnalysisJoinV01 {
  requireSafeCodeV01(input.join_id, "live_training_analysis_join_id_invalid");
  requireTimestampV01(input.joined_at, "live_training_analysis_join_time_invalid");
  if (
    input.slot.slot_role !== "cold_successor" ||
    input.slot.condition === null ||
    input.slot.existing_reentry_role === null ||
    input.slot.slot_id !== input.blind_observation.slot_id ||
    input.slot.case_id !== input.blind_observation.observation.case_id ||
    input.blind_observation.case_commitment_ref.record_id !== input.slot.case_id ||
    Date.parse(input.joined_at) <= Date.parse(input.blind_observation.sealed_at)
  ) {
    failV01("live_training_analysis_join_chronology_or_scope_invalid");
  }
  validateIntegrityV01(
    input.blind_observation,
    "commissioned_live_training_blind_observation_without_integrity_fingerprint",
    "live_training_blind_observation_integrity_invalid",
  );
  const withoutIntegrity = {
    join_version: COMMISSIONED_LIVE_TRAINING_ANALYSIS_JOIN_VERSION_V01,
    join_id: input.join_id,
    slot_id: input.slot.slot_id,
    blind_observation_ref: commissionedLiveTrainingRecordRefV01(
      input.blind_observation,
    ),
    sealed_observation_fingerprint:
      input.blind_observation.observation.integrity.fingerprint,
    condition: input.slot.condition,
    existing_reentry_role: input.slot.existing_reentry_role,
    joined_at: input.joined_at,
    joined_after_observation_seal: true as const,
    observation_mutated: false as const,
  };
  return sealV01(
    withoutIntegrity,
    "commissioned_live_training_analysis_join_without_integrity_fingerprint",
  );
}

export function assertCommissionedLiveTrainingCaseObservationsSealedBeforeUnblindingV01(input: {
  plan: CommissionedLiveTrainingCohortPlanV01;
  blind_observations: readonly CommissionedLiveTrainingBlindObjectiveObservationV01[];
  analysis_joins: readonly CommissionedLiveTrainingAnalysisJoinV01[];
  require_complete_join_set?: boolean;
}): void {
  const slotById = new Map(input.plan.slots.map((slot) => [slot.slot_id, slot] as const));
  for (const caseId of COMMISSIONED_LIVE_TRAINING_CASE_IDS_V01) {
    const caseSlots = input.plan.slots.filter((slot) => slot.case_id === caseId);
    const caseBlinds = input.blind_observations.filter(
      (blind) => slotById.get(blind.slot_id)?.case_id === caseId,
    );
    const caseJoins = input.analysis_joins.filter(
      (join) => slotById.get(join.slot_id)?.case_id === caseId,
    );
    if (input.require_complete_join_set === false && caseJoins.length === 0) {
      continue;
    }
    if (
      caseSlots.length !== 5 ||
      caseBlinds.length !== 5 ||
      (input.require_complete_join_set !== false && caseJoins.length !== 4) ||
      caseJoins.length > 4 ||
      new Set(caseBlinds.map((blind) => blind.slot_id)).size !== 5 ||
      new Set(caseJoins.map((join) => join.slot_id)).size !== caseJoins.length
    ) {
      failV01("live_training_case_observation_freeze_set_invalid");
    }
    const latestSeal = Math.max(
      ...caseBlinds.map((blind) => Date.parse(blind.sealed_at)),
    );
    if (
      !Number.isFinite(latestSeal) ||
      caseJoins.some((join) => Date.parse(join.joined_at) <= latestSeal)
    ) {
      failV01("live_training_case_unblinded_before_all_observations_sealed");
    }
  }
}

export function buildCommissionedLiveTrainingAttemptStartV01(input: Omit<
  CommissionedLiveTrainingAttemptStartV01,
  "attempt_start_version" | "persisted_before_native_host_invocation" | "integrity"
>): CommissionedLiveTrainingAttemptStartV01 {
  requireSafeCodeV01(input.attempt_start_id, "live_training_attempt_start_id_invalid");
  requireSafeCodeV01(input.attempt_id, "live_training_attempt_id_invalid");
  requireSafeCodeV01(input.slot_id, "live_training_attempt_slot_invalid");
  requireTimestampV01(input.started_at, "live_training_attempt_time_invalid");
  if (
    !Number.isInteger(input.reserved_native_host_invocation_ordinal) ||
    input.reserved_native_host_invocation_ordinal < 1 ||
    input.reserved_native_host_invocation_ordinal > MAX_NATIVE_INVOCATIONS_V01
  ) {
    failV01("live_training_attempt_start_reservation_invalid");
  }
  createCommissionedWorkRecordRefV01(input.authorization_consumption_ref);
  createCommissionedWorkRecordRefV01(input.cohort_plan_ref);
  createCommissionedWorkRoleRefV01("executor", input.executor_role_ref.role_id);
  for (const fingerprint of [
    input.request_ref_fingerprint,
    input.run_ref_fingerprint,
    input.native_execution_configuration_fingerprint,
    input.codex_environment_binding_fingerprint,
    input.attempt_state_root_fingerprint,
    input.adapter_execution_binding_fingerprint,
  ]) {
    requireFingerprintV01(fingerprint, "live_training_attempt_start_binding_invalid");
  }
  assertCloneBaselineV01(input.clone_baseline);
  return sealV01(
    {
      attempt_start_version: COMMISSIONED_LIVE_TRAINING_ATTEMPT_START_VERSION_V01,
      ...input,
      persisted_before_native_host_invocation: true as const,
    },
    "commissioned_live_training_attempt_start_without_integrity_fingerprint",
  );
}

export function buildCommissionedLiveTrainingIsolationObservationV01(input: {
  observation_id: string;
  attempt_id: string;
  environment_binding: CommissionedLiveTrainingCodexEnvironmentBindingV01;
  attempt_state_root_fingerprint: string;
  home_identity_fingerprint: string;
  codex_home_identity_fingerprint: string;
  codex_sqlite_home_identity_fingerprint: string;
  distinct_from_prior_attempt_state_roots: true;
  state_root_created_empty: true;
  shared_codex_home_fallback_used: false;
  predecessor_history_present: false;
  sibling_history_present: false;
  foreign_instruction_or_config_present: false;
  account_projection_status: CommissionedLiveTrainingIsolationObservationV01["account_projection_status"];
  account_projection_fingerprint: string | null;
  codex_configuration_status: CommissionedLiveTrainingIsolationObservationV01["codex_configuration_status"];
  codex_configuration_fingerprint: string | null;
  tool_policy_status: CommissionedLiveTrainingIsolationObservationV01["tool_policy_status"];
  tool_policy_fingerprint: string | null;
}): CommissionedLiveTrainingIsolationObservationV01 {
  requireSafeCodeV01(input.observation_id, "live_training_isolation_observation_id_invalid");
  requireSafeCodeV01(input.attempt_id, "live_training_attempt_id_invalid");
  assertValidCommissionedLiveTrainingCodexEnvironmentBindingV01(
    input.environment_binding,
  );
  for (const fingerprint of [
    input.attempt_state_root_fingerprint,
    input.home_identity_fingerprint,
    input.codex_home_identity_fingerprint,
    input.codex_sqlite_home_identity_fingerprint,
  ]) requireFingerprintV01(fingerprint, "live_training_isolation_identity_invalid");
  if (
    new Set([
      input.home_identity_fingerprint,
      input.codex_home_identity_fingerprint,
      input.codex_sqlite_home_identity_fingerprint,
    ]).size !== 3
  ) {
    failV01("live_training_isolation_state_identity_reused");
  }
  const observed = input.account_projection_status === "observed_exact";
  if (
    observed !== (input.account_projection_fingerprint !== null) ||
    observed !== (input.codex_configuration_fingerprint !== null) ||
    observed !== (input.tool_policy_fingerprint !== null) ||
    input.codex_configuration_status !==
      (observed ? "observed_exact" : "not_observed_pre_spawn_failure") ||
    input.tool_policy_status !==
      (observed ? "observed_exact" : "not_observed_pre_spawn_failure") ||
    (observed &&
      (input.account_projection_fingerprint !==
          input.environment_binding.account_auth_projection_fingerprint ||
        input.codex_configuration_fingerprint !==
          input.environment_binding.codex_configuration_fingerprint ||
        input.tool_policy_fingerprint !==
          input.environment_binding.mcp_tool_web_policy_fingerprint))
  ) {
    failV01("live_training_isolation_observation_source_invalid");
  }
  const observation = sealV01(
    {
      observation_version:
        COMMISSIONED_LIVE_TRAINING_ISOLATION_OBSERVATION_VERSION_V01,
      observation_id: input.observation_id,
      attempt_id: input.attempt_id,
      environment_binding_ref: commissionedLiveTrainingRecordRefV01(
        input.environment_binding,
      ),
      attempt_state_root_fingerprint: input.attempt_state_root_fingerprint,
      home_identity_fingerprint: input.home_identity_fingerprint,
      codex_home_identity_fingerprint: input.codex_home_identity_fingerprint,
      codex_sqlite_home_identity_fingerprint:
        input.codex_sqlite_home_identity_fingerprint,
      distinct_from_prior_attempt_state_roots: true as const,
      state_root_created_empty: true as const,
      shared_codex_home_fallback_used: false as const,
      predecessor_history_present: false as const,
      sibling_history_present: false as const,
      foreign_instruction_or_config_present: false as const,
      account_projection_status: input.account_projection_status,
      account_projection_fingerprint: input.account_projection_fingerprint,
      codex_configuration_status: input.codex_configuration_status,
      codex_configuration_fingerprint: input.codex_configuration_fingerprint,
      tool_policy_status: input.tool_policy_status,
      tool_policy_fingerprint: input.tool_policy_fingerprint,
      fresh_thread_ephemeral: true as const,
      same_run_resume: false as const,
      transcript_inheritance_observed_absent: true as const,
      hidden_reasoning_inheritance_observed_absent: true as const,
      cleanup_required: true as const,
      raw_auth_config_or_history_persisted: false as const,
    },
    "commissioned_live_training_isolation_observation_without_integrity_fingerprint",
  );
  assertSafeCommissionedLiveTrainingOutputV01(observation);
  return observation;
}

export function buildCommissionedLiveTrainingApprovalObservationV01(input: {
  observation_id: string;
  approval_request_fingerprint: string;
  operation_class: string;
  repository_relative_path_count: number;
  network_resource_count: number;
  outside_root: boolean;
  github_or_publication: boolean;
  package_or_download: boolean;
  credential_or_semantic: boolean;
  available_decisions: readonly string[];
}): CommissionedLiveTrainingApprovalObservationV01 {
  requireSafeCodeV01(input.observation_id, "live_training_approval_observation_id_invalid");
  requireFingerprintV01(
    input.approval_request_fingerprint,
    "live_training_approval_request_fingerprint_invalid",
  );
  requireSafeCodeV01(input.operation_class, "live_training_approval_operation_invalid");
  for (const count of [
    input.repository_relative_path_count,
    input.network_resource_count,
  ]) {
    if (!Number.isInteger(count) || count < 0 || count > 64) {
      failV01("live_training_approval_request_bound_invalid");
    }
  }
  const classification = input.network_resource_count > 0
    ? "network_request"
    : input.outside_root
      ? "outside_root_request"
      : input.github_or_publication
        ? "github_or_publication_request"
        : input.package_or_download
          ? "package_or_download_request"
          : input.credential_or_semantic
            ? "credential_or_semantic_request"
            : input.repository_relative_path_count > 0
              ? "in_root_operation_request"
              : "unclassified_request";
  const decision = input.available_decisions.includes("cancel_run")
    ? "cancel_run"
    : input.available_decisions.includes("decline")
      ? "decline"
      : null;
  if (!decision) failV01("live_training_approval_terminal_decision_unavailable");
  return sealV01(
    {
      observation_version:
        COMMISSIONED_LIVE_TRAINING_APPROVAL_OBSERVATION_VERSION_V01,
      observation_id: input.observation_id,
      approval_request_fingerprint: input.approval_request_fingerprint,
      operation_class: input.operation_class,
      classification,
      decision,
      terminal_cohort_stop: true as const,
      approval_granted: false as const,
      raw_command_or_resource_persisted: false as const,
    },
    "commissioned_live_training_approval_observation_without_integrity_fingerprint",
  );
}

export function assertCommissionedLiveTrainingAttemptStartReservationV01(input: {
  authorization: CommissionedLiveTrainingAuthorizationV01;
  start: CommissionedLiveTrainingAttemptStartV01;
}): void {
  const providerBearing =
    input.authorization.authorization_kind === "future_live_execution";
  if (
    input.start.reserved_native_host_invocation_ordinal >
      input.authorization.native_host_invocation_limit ||
    input.start.provider_bearing_invocation_reserved !== providerBearing ||
    input.start.model_bearing_invocation_reserved !== providerBearing ||
    (input.start.provider_bearing_invocation_reserved &&
      input.start.reserved_native_host_invocation_ordinal >
        input.authorization.provider_bearing_native_host_invocation_limit) ||
    (input.start.model_bearing_invocation_reserved &&
      input.start.reserved_native_host_invocation_ordinal >
        input.authorization.model_bearing_native_host_invocation_limit)
  ) {
    failV01("live_training_attempt_start_authorization_ceiling_invalid");
  }
}

export function buildCommissionedLiveTrainingAttemptAdmissionV01(input: Omit<
  CommissionedLiveTrainingAttemptAdmissionV01,
  "admission_version" | "prior_attempt_material_inherited" | "prior_execution_grant_inherited" | "predecessor_or_sibling_transcript_inherited" | "hidden_reasoning_inherited" | "integrity"
>): CommissionedLiveTrainingAttemptAdmissionV01 {
  requireSafeCodeV01(input.attempt_id, "live_training_attempt_id_invalid");
  requireSafeCodeV01(input.slot_id, "live_training_attempt_slot_invalid");
  requireTimestampV01(input.admitted_at, "live_training_attempt_time_invalid");
  for (const fingerprint of [
    input.run_ref_fingerprint,
    input.request_ref_fingerprint,
    input.host_context_fingerprint,
    input.native_execution_configuration_fingerprint,
    input.codex_environment_binding_fingerprint,
    input.adapter_execution_binding_fingerprint,
    input.native_host_result_fingerprint,
    input.clone_identity_fingerprint,
  ]) {
    requireFingerprintV01(fingerprint, "live_training_attempt_binding_invalid");
  }
  validateIntegrityV01(
    input.isolation_observation,
    "commissioned_live_training_isolation_observation_without_integrity_fingerprint",
    "live_training_isolation_observation_integrity_invalid",
  );
  if (
    input.isolation_observation.attempt_id !== input.attempt_id ||
    input.isolation_observation.environment_binding_ref.record_fingerprint !==
      input.codex_environment_binding_fingerprint ||
    input.isolation_observation.transcript_inheritance_observed_absent !== true ||
    input.isolation_observation.hidden_reasoning_inheritance_observed_absent !== true ||
    input.isolation_observation.shared_codex_home_fallback_used !== false
  ) {
    failV01("live_training_attempt_isolation_binding_invalid");
  }
  input.approval_observations.forEach((observation) =>
    validateIntegrityV01(
      observation,
      "commissioned_live_training_approval_observation_without_integrity_fingerprint",
      "live_training_approval_observation_integrity_invalid",
    ));
  assertCommissionedLiveTrainingHostRefSetV01(
    input.host_ref_set,
    input.host_context_fingerprint,
  );
  createCommissionedWorkRecordRefV01(input.attempt_start_ref);
  assertCloneBaselineV01(input.clone_baseline);
  if (
    input.clone_baseline.slot_id !== input.slot_id ||
    input.clone_baseline.clone_identity_fingerprint !==
      input.clone_identity_fingerprint
  ) {
    failV01("live_training_attempt_clone_baseline_binding_invalid");
  }
  if (
    (input.attempt_kind === "primary" && input.replacement_of_attempt_ref !== null) ||
    (input.attempt_kind === "replacement" && input.replacement_of_attempt_ref === null)
  ) {
    failV01("live_training_attempt_replacement_relation_invalid");
  }
  const withoutIntegrity = {
    admission_version: COMMISSIONED_LIVE_TRAINING_ATTEMPT_ADMISSION_VERSION_V01,
    ...input,
    prior_attempt_material_inherited: false as const,
    prior_execution_grant_inherited: false as const,
    predecessor_or_sibling_transcript_inherited: false as const,
    hidden_reasoning_inherited: false as const,
  };
  return sealV01(
    withoutIntegrity,
    "commissioned_live_training_attempt_admission_without_integrity_fingerprint",
  );
}

function assertCommissionedLiveTrainingHostRefSetV01(
  bindings: readonly CommissionedWorkNativeHostRefBindingV01[],
  fingerprint: string,
): void {
  if (
    bindings.length > 4 ||
    new Set(bindings.map((binding) => binding.ref_type)).size !== bindings.length ||
    new Set(bindings.map((binding) => binding.exact_ref_fingerprint)).size !==
      bindings.length ||
    bindings.some(
      (binding) =>
        canonicalizeProtocolValueV01(Object.keys(binding).sort()) !==
          canonicalizeProtocolValueV01(
            ["exact_ref_fingerprint", "ref_type"].sort(),
          ) ||
        ![
          "host_connection",
          "host_thread",
          "host_session",
          "host_turn",
        ].includes(binding.ref_type) ||
        !SHA256_V01.test(binding.exact_ref_fingerprint),
    ) ||
    canonicalizeProtocolValueV01(bindings) !==
      canonicalizeProtocolValueV01(
        [...bindings].sort((left, right) =>
          compareProtocolCodeUnitsV01(
            canonicalizeProtocolValueV01(left),
            canonicalizeProtocolValueV01(right),
          ),
        ),
      ) ||
    createProtocolSha256V01(canonicalizeProtocolValueV01(bindings)) !== fingerprint
  ) {
    failV01("live_training_attempt_host_ref_set_invalid");
  }
}

export function buildCommissionedLiveTrainingAttemptTerminalV01(input: Omit<
  CommissionedLiveTrainingAttemptTerminalV01,
  "terminal_version" | "aggregable" | "replacement_eligible" | "integrity"
>): CommissionedLiveTrainingAttemptTerminalV01 {
  requireSafeCodeV01(input.terminal_id, "live_training_attempt_terminal_id_invalid");
  requireSafeCodeV01(input.slot_id, "live_training_attempt_terminal_slot_invalid");
  requireTimestampV01(input.finished_at, "live_training_attempt_terminal_time_invalid");
  const aggregable = input.terminal_status === "valid_episode";
  const replacementEligible =
    input.terminal_status === "non_aggregable_failure" &&
    input.failure_class === "pre_action_host_infrastructure_failure" &&
    input.first_meaningful_action_status === "observed_absent" &&
    input.repository_mutation_status === "observed_absent" &&
    input.native_host_settled &&
    input.cleanup_complete;
  if (
    (aggregable &&
      (input.failure_class !== "none" ||
        input.episode_ref === null ||
        input.blind_observation_ref === null)) ||
    (!aggregable &&
      (input.episode_ref !== null || input.blind_observation_ref !== null))
  ) {
    failV01("live_training_attempt_terminal_relation_invalid");
  }
  const withoutIntegrity = {
    terminal_version: COMMISSIONED_LIVE_TRAINING_ATTEMPT_TERMINAL_VERSION_V01,
    ...input,
    aggregable,
    replacement_eligible: replacementEligible,
  };
  return sealV01(
    withoutIntegrity,
    "commissioned_live_training_attempt_terminal_without_integrity_fingerprint",
  );
}

export function buildCommissionedLiveTrainingAttemptRegistryV01(input: {
  registry_id: string;
  plan: CommissionedLiveTrainingCohortPlanV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  starts: CommissionedLiveTrainingAttemptStartV01[];
  admissions: CommissionedLiveTrainingAttemptAdmissionV01[];
  terminals: CommissionedLiveTrainingAttemptTerminalV01[];
}): CommissionedLiveTrainingAttemptRegistryV01 {
  requireSafeCodeV01(input.registry_id, "live_training_attempt_registry_id_invalid");
  if (
    input.starts.length !== input.admissions.length ||
    input.admissions.length !== input.terminals.length
  ) {
    failV01("live_training_attempt_registry_unsettled_attempt");
  }
  const startByAttempt = new Map(
    input.starts.map((start) => [start.attempt_id, start] as const),
  );
  const terminalByAdmission = new Map(
    input.terminals.map((terminal) => [
      terminal.attempt_admission_ref.record_fingerprint,
      terminal,
    ]),
  );
  const admissionsById = new Map(input.admissions.map((admission) => [admission.attempt_id, admission]));
  if (
    admissionsById.size !== input.admissions.length ||
    startByAttempt.size !== input.starts.length ||
    new Set(
      input.starts.map((start) => start.reserved_native_host_invocation_ordinal),
    ).size !== input.starts.length ||
    new Set(input.terminals.map((terminal) => terminal.terminal_id)).size !==
      input.terminals.length
  ) {
    failV01("live_training_attempt_registry_duplicate");
  }
  input.admissions.forEach((admission) => {
    const terminal = terminalByAdmission.get(admission.integrity.fingerprint);
    const start = startByAttempt.get(admission.attempt_id);
    if (
      !terminal ||
      !start ||
      terminal.slot_id !== admission.slot_id ||
      canonicalizeProtocolValueV01(admission.attempt_start_ref) !==
        canonicalizeProtocolValueV01(commissionedLiveTrainingRecordRefV01(start)) ||
      start.slot_id !== admission.slot_id ||
      start.request_ref_fingerprint !== admission.request_ref_fingerprint ||
      start.run_ref_fingerprint !== admission.run_ref_fingerprint ||
      start.native_execution_configuration_fingerprint !==
        admission.native_execution_configuration_fingerprint ||
      start.adapter_execution_binding_fingerprint !==
        admission.adapter_execution_binding_fingerprint ||
      start.executor_role_ref.role_fingerprint !==
        admission.executor_role_ref.role_fingerprint ||
      start.clone_baseline.clone_identity_fingerprint !==
        admission.clone_identity_fingerprint
    ) {
      failV01("live_training_attempt_registry_binding_invalid");
    }
  });
  const primary = input.admissions.filter((attempt) => attempt.attempt_kind === "primary");
  const replacements = input.admissions.filter(
    (attempt) => attempt.attempt_kind === "replacement",
  );
  if (
    primary.length !== COMMISSIONED_LIVE_TRAINING_PRIMARY_EPISODE_LIMIT_V01 ||
    replacements.length > COMMISSIONED_LIVE_TRAINING_REPLACEMENT_LIMIT_V01
  ) {
    failV01("live_training_attempt_registry_limit_invalid");
  }
  for (const slot of input.plan.slots) {
    const slotPrimary = primary.filter((attempt) => attempt.slot_id === slot.slot_id);
    const slotReplacements = replacements.filter(
      (attempt) => attempt.slot_id === slot.slot_id,
    );
    if (
      slotPrimary.length !== 1 ||
      slotReplacements.length > 1 ||
      slotPrimary[0]?.attempt_id !== slot.primary_attempt_id ||
      canonicalizeProtocolValueV01(slotPrimary[0]?.executor_role_ref) !==
        canonicalizeProtocolValueV01(slot.executor_role_ref)
    ) {
      failV01("live_training_attempt_registry_slot_count_invalid");
    }
    if (slotReplacements.length === 1) {
      const original = slotPrimary[0]!;
      const replacement = slotReplacements[0]!;
      const originalTerminal = terminalByAdmission.get(original.integrity.fingerprint);
      if (
        !originalTerminal?.replacement_eligible ||
        canonicalizeProtocolValueV01(replacement.replacement_of_attempt_ref) !==
          canonicalizeProtocolValueV01(commissionedLiveTrainingRecordRefV01(original)) ||
        replacement.executor_role_ref.role_fingerprint ===
          original.executor_role_ref.role_fingerprint ||
        replacement.run_ref_fingerprint === original.run_ref_fingerprint ||
        replacement.request_ref_fingerprint === original.request_ref_fingerprint ||
        replacement.host_context_fingerprint === original.host_context_fingerprint ||
        replacement.clone_identity_fingerprint === original.clone_identity_fingerprint
      ) {
        failV01("live_training_replacement_policy_invalid");
      }
    }
  }
  const finalValidBySlot = input.plan.slots.every((slot) => {
    const slotAdmissions = input.admissions.filter(
      (attempt) => attempt.slot_id === slot.slot_id,
    );
    return (
      slotAdmissions.filter((attempt) =>
        terminalByAdmission.get(attempt.integrity.fingerprint)?.aggregable,
      ).length === 1
    );
  });
  if (!finalValidBySlot) failV01("live_training_incomplete_cohort_not_aggregable");
  const withoutIntegrity = {
    registry_version: COMMISSIONED_LIVE_TRAINING_ATTEMPT_REGISTRY_VERSION_V01,
    registry_id: input.registry_id,
    cohort_plan_ref: commissionedLiveTrainingRecordRefV01(input.plan),
    authorization_ref: commissionedLiveTrainingRecordRefV01(input.authorization),
    attempt_start_refs: input.starts
      .map(commissionedLiveTrainingRecordRefV01)
      .sort(compareRefsV01),
    primary_attempts: primary.map(commissionedLiveTrainingRecordRefV01).sort(compareRefsV01),
    replacement_attempts: replacements
      .map(commissionedLiveTrainingRecordRefV01)
      .sort(compareRefsV01),
    terminal_refs: input.terminals
      .map(commissionedLiveTrainingRecordRefV01)
      .sort(compareRefsV01),
    non_aggregable_failure_refs: input.terminals
      .filter((terminal) => !terminal.aggregable)
      .map(commissionedLiveTrainingRecordRefV01)
      .sort(compareRefsV01),
    replacement_invocation_count: replacements.length,
    every_primary_slot_resolved_exactly_once: true as const,
    incomplete_cohort_aggregable: false as const,
  };
  return sealV01(
    withoutIntegrity,
    "commissioned_live_training_attempt_registry_without_integrity_fingerprint",
  );
}

export function evaluateCommissionedLiveTrainingComponentRuleV01(input: {
  rule: CommissionedLiveTrainingComponentAnalysisRuleV01;
  episodes: CommissionedWorkEpisodeArtifactV01[];
  plan: CommissionedLiveTrainingCohortPlanV01;
  analysis_joins: CommissionedLiveTrainingAnalysisJoinV01[];
}): CommissionedLiveTrainingCandidateComponentAssessmentV01 {
  const sealedRule = COMPONENT_ANALYSIS_RULES_V01.find(
    (candidate) => candidate.component_id === input.rule.component_id,
  );
  if (
    !sealedRule ||
    canonicalizeProtocolValueV01(input.rule) !==
      canonicalizeProtocolValueV01(sealedRule)
  ) {
    failV01("live_training_candidate_component_rule_not_preregistered");
  }
  const successorEpisodes = input.episodes.filter(
    (episode) =>
      episode.episode_role === "successor" &&
      episode.execution_binding.execution_evidence_class ===
        "commissioned_agent_observation",
  );
  const joinBySlot = new Map(
    input.analysis_joins.map((join) => [join.slot_id, join] as const),
  );
  const supportEpisodes: CommissionedWorkEpisodeArtifactV01[] = [];
  const counterexamples: CommissionedWorkEpisodeArtifactV01[] = [];
  const harmful: CommissionedWorkEpisodeArtifactV01[] = [];
  const originGroups = new Set<string>();
  const relevantHardFailures = new Set<string>();
  let unequalCommonEvidence = false;
  for (const caseId of COMMISSIONED_LIVE_TRAINING_CASE_IDS_V01) {
    const caseEpisodes = successorEpisodes.filter(
      (episode) => episode.case_id === caseId,
    );
    const joinedEpisodes = caseEpisodes.filter((episode) => {
      const slot = input.plan.slots.find(
        (candidate) =>
          candidate.case_id === caseId &&
          candidate.condition === episode.condition,
      );
      const join = slot ? joinBySlot.get(slot.slot_id) : undefined;
      return Boolean(
        slot && join && join.condition === episode.condition &&
          join.observation_mutated === false,
      );
    });
    const comparable = joinedEpisodes.filter(
      (episode) =>
        episode.condition !== null &&
        input.rule.comparable_conditions.includes(episode.condition),
    );
    if (new Set(comparable.map((episode) => episode.common_evidence_fingerprint)).size > 1) {
      unequalCommonEvidence = true;
      continue;
    }
    const target = comparable.find(
      (episode) => episode.condition === "exact_current_continuity",
    );
    const comparators = comparable.filter(
      (episode) => episode.condition !== "exact_current_continuity",
    );
    if (!target || comparators.length === 0) continue;
    const targetHardFailures = target.evaluation.hard_failures.filter((code) =>
      input.rule.contradictory_hard_failure_codes.includes(code));
    if (targetHardFailures.length > 0) {
      counterexamples.push(target);
      targetHardFailures.forEach((code) => relevantHardFailures.add(code));
    }
    if (target.evaluation.harmful_transfer === "observed") {
      harmful.push(target);
    }
    const patternComparators = comparators.filter((comparator) => {
      switch (input.rule.component_id) {
        case "reobserve_current_source_before_action":
          return (
            target.evaluation.deterministic_repository_task_success &&
            target.evaluation.source_currentness_failure === false &&
            (comparator.evaluation.source_currentness_failure === true ||
              comparator.evaluation.hard_failures.includes(
                "source_currentness_mismatch",
              ))
          );
        case "preserve_negative_status_without_new_support":
          return (
            target.evaluation.negative_space_status === "preserved" &&
            comparator.evaluation.negative_space_status === "revived"
          );
        case "separate_execution_completion_from_verified_success":
          return (
            target.evaluation.deterministic_repository_task_success &&
            target.evaluation.verification_completeness === "complete" &&
            (comparator.evaluation.verification_completeness === "incomplete" ||
              comparator.evaluation.hard_failures.some((code) =>
                input.rule.contradictory_hard_failure_codes.includes(code)))
          );
      }
    });
    if (patternComparators.length > 0) {
      supportEpisodes.push(target, ...patternComparators);
      originGroups.add(target.independent_origin_group_id);
    }
  }
  const uniqueSupport = uniqueEpisodeRefsV01(supportEpisodes);
  const uniqueCounterexamples = uniqueEpisodeRefsV01(counterexamples);
  const uniqueHarmful = uniqueEpisodeRefsV01(harmful);
  const hasContradiction = relevantHardFailures.size > 0;
  const hasHarm = uniqueHarmful.length > 0;
  const status: CommissionedLiveTrainingCandidateComponentStatusV01 =
    hasContradiction || hasHarm
      ? "not_eligible"
      : originGroups.size >= 2
        ? "mechanically_eligible_for_holdout"
        : "incomplete";
  const missingEvidenceCodes = [
    "live_executor_reference_not_established",
    "live_executor_use_not_established",
    "support_relation_not_validated",
    "outcome_association_not_established",
    "held_out_transfer_not_tested",
    ...(originGroups.size < 2 ? [input.rule.missing_evidence_code] : []),
    ...(unequalCommonEvidence ? ["common_evidence_not_equal"] : []),
  ].sort(compareProtocolCodeUnitsV01);
  return {
    component_id: input.rule.component_id,
    component_ref: createCommissionedWorkRecordRefV01({
      record_version: "commissioned_live_training_component.v0.1",
      record_id: input.rule.component_id,
      record_fingerprint: fingerprintV01({ component_id: input.rule.component_id }),
    }),
    status,
    independent_origin_count: originGroups.size,
    objective_condition_sensitive_pattern_observed: originGroups.size > 0,
    objective_supporting_episode_refs: uniqueSupport,
    objective_supporting_evaluation_refs: uniqueRecordRefsV01(
      supportEpisodes.map((episode) => episode.objective_observation_ref),
    ),
    opposing_or_counterexample_refs: uniqueCounterexamples,
    relevant_hard_failures: [...relevantHardFailures].sort(
      compareProtocolCodeUnitsV01,
    ),
    harmful_transfer_observation_refs: uniqueHarmful,
    strongest_simpler_comparator: input.rule.strongest_simpler_comparator,
    missing_evidence_codes: missingEvidenceCodes,
    falsifier_codes: [...input.rule.falsifier_codes].sort(compareProtocolCodeUnitsV01),
    uncertainty_codes: [...new Set([
      ...input.rule.uncertainty_codes,
      "episode_outcomes_do_not_establish_material_use_or_causal_support",
    ])].sort(compareProtocolCodeUnitsV01),
    actual_reference_status: "unknown",
    actual_use_status: "unknown",
    support_validated_status: "unknown",
    outcome_associated_status: "unknown",
    evidence_authority: {
      evidence_supported_procedural_knowledge: false,
      independently_learned: false,
      validated_for_transfer: false,
      active_context_created: false,
      policy_created: false,
    },
  };
}

function uniqueEpisodeRefsV01(
  episodes: readonly CommissionedWorkEpisodeArtifactV01[],
): CommissionedWorkRecordRefV01[] {
  return uniqueRecordRefsV01(
    episodes.map((episode) => createCommissionedWorkRecordRefV01({
      record_version: episode.episode_version,
      record_id: episode.episode_id,
      record_fingerprint: episode.integrity.fingerprint,
    })),
  );
}

function uniqueRecordRefsV01(
  refs: readonly CommissionedWorkRecordRefV01[],
): CommissionedWorkRecordRefV01[] {
  const byFingerprint = new Map(
    refs.map((ref) => [ref.record_fingerprint, ref] as const),
  );
  return [...byFingerprint.values()].sort(compareRefsV01);
}

export function buildCommissionedLiveTrainingCandidateAssessmentV01(input: {
  assessment_id: string;
  family_manifest: CommissionedWorkFamilyManifestV01;
  plan: CommissionedLiveTrainingCohortPlanV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  training_result: CommissionedWorkTrainingResultV01;
  episodes: CommissionedWorkEpisodeArtifactV01[];
  blind_observations: CommissionedLiveTrainingBlindObjectiveObservationV01[];
  analysis_joins: CommissionedLiveTrainingAnalysisJoinV01[];
  attempt_registry: CommissionedLiveTrainingAttemptRegistryV01;
  assessor_role_id: string;
}): CommissionedLiveTrainingCandidateAssessmentV01 {
  requireSafeCodeV01(input.assessment_id, "live_training_candidate_assessment_id_invalid");
  assertValidCommissionedLiveTrainingCohortPlanV01(input.plan);
  assertValidCommissionedLiveTrainingAuthorizationV01(
    input.authorization,
    input.plan,
  );
  input.episodes.forEach(assertValidCommissionedWorkEpisodeArtifactV01);
  const rebuiltTrainingResult = buildCommissionedWorkTrainingResultV01({
    manifest: input.family_manifest,
    predecessor_episodes: input.training_result.predecessor_episodes,
    successor_episodes: input.training_result.successor_episodes,
  });
  input.blind_observations.forEach((observation) => {
    validateIntegrityV01(
      observation,
      "commissioned_live_training_blind_observation_without_integrity_fingerprint",
      "live_training_candidate_blind_observation_integrity_invalid",
    );
    const commitment = input.family_manifest.training_cases.find(
      (candidate) => candidate.case_id === observation.observation.case_id,
    );
    if (!commitment) {
      failV01("live_training_candidate_blind_observation_case_missing");
    }
    assertValidCommissionedWorkObjectiveObservationV01(
      observation.observation,
      commitment,
    );
    if (
      observation.case_commitment_ref.record_fingerprint !==
        commitment.integrity.fingerprint
    ) {
      failV01("live_training_candidate_blind_observation_case_binding_invalid");
    }
  });
  input.analysis_joins.forEach((join) =>
    validateIntegrityV01(
      join,
      "commissioned_live_training_analysis_join_without_integrity_fingerprint",
      "live_training_candidate_analysis_join_integrity_invalid",
    ));
  validateIntegrityV01(
    input.attempt_registry,
    "commissioned_live_training_attempt_registry_without_integrity_fingerprint",
    "live_training_candidate_attempt_registry_integrity_invalid",
  );
  if (
    input.assessor_role_id !== input.family_manifest.consolidation_assessor.role_id ||
    input.attempt_registry.cohort_plan_ref.record_fingerprint !==
      input.plan.integrity.fingerprint ||
    input.attempt_registry.authorization_ref.record_fingerprint !==
      input.authorization.integrity.fingerprint ||
    canonicalizeProtocolValueV01(rebuiltTrainingResult) !==
      canonicalizeProtocolValueV01(input.training_result)
  ) {
    failV01("live_training_candidate_training_result_binding_invalid");
  }
  if (
    input.training_result.predecessor_episodes.length !== 3 ||
    input.training_result.successor_episodes.length !== 12 ||
    input.episodes.length !== 15 ||
    input.blind_observations.length !== 15 ||
    input.analysis_joins.length !== 12 ||
    input.attempt_registry.every_primary_slot_resolved_exactly_once !== true ||
    input.episodes.some((episode) =>
      [
        "referenced",
        "behaviorally_conditioned",
        "support_validated",
        "outcome_associated",
      ].some(
        (stage) =>
          episode.evidence_ladder.find((row) => row.stage === stage)?.status ===
          "established",
      ),
    )
  ) {
    failV01("live_training_candidate_assessment_source_invalid");
  }
  const exactEpisodeRefs = new Set(
    input.episodes.map((episode) => episode.integrity.fingerprint),
  );
  const exactObservationRefs = new Set(
    input.blind_observations.map((observation) =>
      observation.observation.integrity.fingerprint,
    ),
  );
  const blindBySlot = new Map(
    input.blind_observations.map((observation) => [
      observation.slot_id,
      observation,
    ] as const),
  );
  if (
    new Set(input.blind_observations.map((observation) => observation.slot_id)).size !== 15 ||
    input.plan.slots.some((slot) => {
      const blind = input.blind_observations.find(
        (observation) => observation.slot_id === slot.slot_id,
      );
      return !blind || blind.observation.case_id !== slot.case_id;
    }) ||
    input.training_result.predecessor_episodes
      .concat(input.training_result.successor_episodes)
      .some((episode) => !exactEpisodeRefs.has(episode.integrity.fingerprint)) ||
    input.blind_observations.some(
      (observation) =>
        !exactObservationRefs.has(observation.observation_ref.record_fingerprint),
    ) ||
    new Set(input.analysis_joins.map((join) => join.slot_id)).size !== 12 ||
    input.analysis_joins.some((join) => {
      const slot = input.plan.slots.find((candidate) => candidate.slot_id === join.slot_id);
      const blind = blindBySlot.get(join.slot_id);
      return !slot || !blind || slot.condition === null ||
        join.condition !== slot.condition ||
        join.sealed_observation_fingerprint !==
          blind.observation.integrity.fingerprint ||
        join.blind_observation_ref.record_fingerprint !== blind.integrity.fingerprint ||
        join.observation_mutated !== false ||
        join.joined_after_observation_seal !== true;
    })
  ) {
    failV01("live_training_candidate_assessment_source_binding_invalid");
  }
  const components = COMPONENT_ANALYSIS_RULES_V01.map((rule) =>
    evaluateCommissionedLiveTrainingComponentRuleV01({
      rule: structuredClone(rule) as CommissionedLiveTrainingComponentAnalysisRuleV01,
      episodes: input.episodes,
      plan: input.plan,
      analysis_joins: input.analysis_joins,
    })) as CommissionedLiveTrainingCandidateAssessmentV01["components"];
  const withoutIntegrity = {
    assessment_version:
      COMMISSIONED_LIVE_TRAINING_CANDIDATE_ASSESSMENT_VERSION_V01,
    assessment_id: input.assessment_id,
    family_ref: commissionedWorkManifestRecordRefV01(input.family_manifest),
    cohort_plan_ref: commissionedLiveTrainingRecordRefV01(input.plan),
    training_result_ref: createCommissionedWorkRecordRefV01({
      record_version: input.training_result.result_version,
      record_id: `training-${input.assessment_id}`,
      record_fingerprint: input.training_result.integrity.fingerprint,
    }),
    attempt_registry_ref: commissionedLiveTrainingRecordRefV01(
      input.attempt_registry,
    ),
    source_episode_refs: input.episodes
      .map((episode) => createCommissionedWorkRecordRefV01({
        record_version: episode.episode_version,
        record_id: episode.episode_id,
        record_fingerprint: episode.integrity.fingerprint,
      }))
      .sort(compareRefsV01),
    source_blind_observation_refs: input.blind_observations
      .map(commissionedLiveTrainingRecordRefV01)
      .sort(compareRefsV01),
    source_analysis_join_refs: input.analysis_joins
      .map(commissionedLiveTrainingRecordRefV01)
      .sort(compareRefsV01),
    assessor_role_ref: createCommissionedWorkRoleRefV01(
      "consolidation_assessor",
      input.assessor_role_id,
    ),
    eligibility_rule_version:
      "commissioned_live_training_mechanical_eligibility_rule.v0.1" as const,
    component_rule_table_version:
      COMMISSIONED_LIVE_TRAINING_COMPONENT_RULE_TABLE_VERSION_V01,
    component_rule_table_fingerprint: fingerprintV01(
      COMPONENT_ANALYSIS_RULES_V01,
    ),
    minimum_independent_origin_groups: 2 as const,
    objective_condition_sensitive_pattern_required: true as const,
    contradictory_hard_failure_allowed: false as const,
    harmful_transfer_allowed: false as const,
    infrastructure_invalid_attempts_count_as_behavioral_evidence: false as const,
    executor_self_report_sufficient: false as const,
    components,
    holdout_source_used: false as const,
    holdout_candidate_frozen: false as const,
    learned_procedural_knowledge_claimed: false as const,
    behavioral_benefit_claimed: false as const,
    transfer_claimed: false as const,
  };
  const assessment = sealV01(
    withoutIntegrity,
    "commissioned_live_training_candidate_assessment_without_integrity_fingerprint",
  );
  assertSafeCommissionedLiveTrainingOutputV01(assessment);
  return assessment;
}

export function buildCommissionedLiveTrainingCleanupReportV01(input: Omit<
  CommissionedLiveTrainingCleanupReportV01,
  "cleanup_version" | "integrity"
>): CommissionedLiveTrainingCleanupReportV01 {
  requireSafeCodeV01(input.cleanup_id, "live_training_cleanup_id_invalid");
  for (const value of [
    input.owned_processes_remaining,
    input.owned_listeners_remaining,
    input.owned_repository_roots_remaining,
    input.owned_runtime_roots_remaining,
    input.owned_temporary_roots_remaining,
    input.stale_artifact_temporaries_remaining,
  ]) {
    if (!Number.isInteger(value) || value < 0) {
      failV01("live_training_cleanup_count_invalid");
    }
  }
  const zeroResidue = [
    input.owned_processes_remaining,
    input.owned_listeners_remaining,
    input.owned_repository_roots_remaining,
    input.owned_runtime_roots_remaining,
    input.owned_temporary_roots_remaining,
    input.stale_artifact_temporaries_remaining,
  ].every((value) => value === 0);
  validateIntegrityV01(
    input.cleanup_observation,
    "commissioned_live_training_cleanup_observation_without_integrity_fingerprint",
    "live_training_cleanup_observation_integrity_invalid",
  );
  const observationRef = commissionedLiveTrainingRecordRefV01(
    input.cleanup_observation,
  );
  if (
    canonicalizeProtocolValueV01(input.cleanup_observation_ref) !==
      canonicalizeProtocolValueV01(observationRef) ||
    canonicalizeProtocolValueV01(
      input.cleanup_observation.task_external_network_observation,
    ) !== canonicalizeProtocolValueV01(
      input.task_external_network_observation,
    ) ||
    input.cleanup_observation.every_started_adapter_invocation_settled !==
      (input.owned_processes_remaining === 0) ||
    (input.cleanup_observation.listener_owner_kind ===
      "stdio_only_no_listener_created") !==
      (input.owned_listeners_remaining === 0) ||
    input.cleanup_observation.repository_roots_absent !==
      (input.owned_repository_roots_remaining === 0) ||
    input.cleanup_observation.runtime_roots_absent !==
      (input.owned_runtime_roots_remaining === 0) ||
    input.cleanup_observation.temporary_roots_absent !==
      (input.owned_temporary_roots_remaining === 0) ||
    input.cleanup_observation.artifact_temporaries_absent !==
      (input.stale_artifact_temporaries_remaining === 0)
  ) {
    failV01("live_training_cleanup_source_binding_invalid");
  }
  if (input.completed !== zeroResidue) {
    failV01("live_training_cleanup_completion_invalid");
  }
  assertSourcedResourceLaneV01(input.task_external_network_observation);
  assertSourcedResourceLaneV01(input.provider_calls_observed);
  assertSourcedResourceLaneV01(input.model_calls_observed);
  return sealV01(
    {
      cleanup_version: COMMISSIONED_LIVE_TRAINING_CLEANUP_VERSION_V01,
      ...input,
    },
    "commissioned_live_training_cleanup_without_integrity_fingerprint",
  );
}

export function buildCommissionedLiveTrainingCleanupObservationV01(input: Omit<
  CommissionedLiveTrainingCleanupObservationV01,
  "observation_version" | "integrity"
>): CommissionedLiveTrainingCleanupObservationV01 {
  requireSafeCodeV01(input.observation_id, "live_training_cleanup_observation_id_invalid");
  requireTimestampV01(input.observed_at, "live_training_cleanup_observation_time_invalid");
  createCommissionedWorkRecordRefV01(input.cohort_plan_ref);
  if (
    !Number.isInteger(input.native_host_invocations_started) ||
    input.native_host_invocations_started < 0 ||
    input.exact_adapter_settlement_fingerprints.length >
      input.native_host_invocations_started ||
    new Set(input.exact_adapter_settlement_fingerprints).size !==
      input.exact_adapter_settlement_fingerprints.length
  ) {
    failV01("live_training_cleanup_observation_count_invalid");
  }
  assertSourcedResourceLaneV01(input.task_external_network_observation);
  input.exact_adapter_settlement_fingerprints.forEach((fingerprint) =>
    requireFingerprintV01(
      fingerprint,
      "live_training_cleanup_settlement_fingerprint_invalid",
    ),
  );
  if (
    input.every_started_adapter_invocation_settled !==
      (input.exact_adapter_settlement_fingerprints.length ===
        input.native_host_invocations_started)
  ) {
    failV01("live_training_cleanup_settlement_relation_invalid");
  }
  return sealV01(
    {
      observation_version:
        COMMISSIONED_LIVE_TRAINING_CLEANUP_OBSERVATION_VERSION_V01,
      ...input,
    },
    "commissioned_live_training_cleanup_observation_without_integrity_fingerprint",
  );
}

export function buildCommissionedLiveTrainingIncompleteCloseoutV01(input: {
  closeout_id: string;
  plan: CommissionedLiveTrainingCohortPlanV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  authorization_consumption_ref: CommissionedWorkRecordRefV01;
  failure_code: string;
  attempt_starts: CommissionedLiveTrainingAttemptStartV01[];
  attempt_admissions: CommissionedLiveTrainingAttemptAdmissionV01[];
  attempt_terminals: CommissionedLiveTrainingAttemptTerminalV01[];
  primary_slots_completed: number;
  cleanup_report: CommissionedLiveTrainingCleanupReportV01;
}): CommissionedLiveTrainingIncompleteCloseoutV01 {
  requireSafeCodeV01(input.closeout_id, "live_training_incomplete_closeout_id_invalid");
  requireSafeCodeV01(input.failure_code, "live_training_incomplete_failure_code_invalid");
  assertValidCommissionedLiveTrainingCohortPlanV01(input.plan);
  assertValidCommissionedLiveTrainingAuthorizationV01(input.authorization, input.plan);
  createCommissionedWorkRecordRefV01(input.authorization_consumption_ref);
  validateIntegrityV01(
    input.cleanup_report,
    "commissioned_live_training_cleanup_without_integrity_fingerprint",
    "live_training_incomplete_cleanup_integrity_invalid",
  );
  if (
    !Number.isInteger(input.primary_slots_completed) ||
    input.primary_slots_completed < 0 ||
    input.primary_slots_completed > COMMISSIONED_LIVE_TRAINING_PRIMARY_EPISODE_LIMIT_V01 ||
    input.attempt_admissions.length > input.attempt_starts.length ||
    input.attempt_terminals.length > input.attempt_admissions.length
  ) {
    failV01("live_training_incomplete_closeout_count_invalid");
  }
  const exactRefs = (
    values: Array<
      | CommissionedLiveTrainingAttemptStartV01
      | CommissionedLiveTrainingAttemptAdmissionV01
      | CommissionedLiveTrainingAttemptTerminalV01
    >,
  ): CommissionedWorkRecordRefV01[] => values
    .map((value) => commissionedLiveTrainingRecordRefV01(value))
    .sort(compareRefsV01);
  const withoutIntegrity = {
    closeout_version: COMMISSIONED_LIVE_TRAINING_INCOMPLETE_CLOSEOUT_VERSION_V01,
    closeout_id: input.closeout_id,
    cohort_plan_ref: commissionedLiveTrainingRecordRefV01(input.plan),
    authorization_ref: commissionedLiveTrainingRecordRefV01(input.authorization),
    authorization_consumption_ref:
      createCommissionedWorkRecordRefV01(input.authorization_consumption_ref),
    failure_code: input.failure_code,
    attempt_start_refs: exactRefs(input.attempt_starts),
    attempt_admission_refs: exactRefs(input.attempt_admissions),
    attempt_terminal_refs: exactRefs(input.attempt_terminals),
    primary_slots_completed: input.primary_slots_completed,
    cohort_aggregable: false as const,
    nonce_reusable: false as const,
    cleanup_report_ref: commissionedLiveTrainingRecordRefV01(input.cleanup_report),
  };
  const closeout = sealV01(
    withoutIntegrity,
    "commissioned_live_training_incomplete_closeout_without_integrity_fingerprint",
  );
  assertSafeCommissionedLiveTrainingOutputV01(closeout);
  return closeout;
}

export function buildCommissionedLiveTrainingResultV01(input: {
  result_id: string;
  plan: CommissionedLiveTrainingCohortPlanV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  authorization_consumption_ref: CommissionedWorkRecordRefV01;
  attempt_registry: CommissionedLiveTrainingAttemptRegistryV01;
  training_result: CommissionedWorkTrainingResultV01;
  predecessor_checkpoints: [
    CommissionedWorkEpisodeCheckpointV01,
    CommissionedWorkEpisodeCheckpointV01,
    CommissionedWorkEpisodeCheckpointV01,
  ];
  clone_seals: [
    CommissionedLiveTrainingCloneSealV01,
    CommissionedLiveTrainingCloneSealV01,
    CommissionedLiveTrainingCloneSealV01,
  ];
  blind_observations: CommissionedLiveTrainingBlindObjectiveObservationV01[];
  analysis_joins: CommissionedLiveTrainingAnalysisJoinV01[];
}): CommissionedLiveTrainingResultV01 {
  requireSafeCodeV01(input.result_id, "live_training_result_id_invalid");
  if (
    input.training_result.predecessor_episodes.length !== 3 ||
    input.training_result.successor_episodes.length !== 12 ||
    input.predecessor_checkpoints.length !== 3 ||
    input.clone_seals.length !== 3 ||
    input.blind_observations.length !== 15 ||
    input.analysis_joins.length !== 12
  ) {
    failV01("live_training_result_slot_count_invalid");
  }
  const blindBySlot = new Map(
    input.blind_observations.map((observation) => [observation.slot_id, observation] as const),
  );
  const joinBySlot = new Map(
    input.analysis_joins.map((join) => [join.slot_id, join] as const),
  );
  if (
    blindBySlot.size !== input.plan.slots.length ||
    joinBySlot.size !== 12 ||
    input.plan.slots.some((slot) => {
      const blind = blindBySlot.get(slot.slot_id);
      const caseRef = input.plan.training_case_refs.find(
        (candidate) => candidate.record_id === slot.case_id,
      );
      if (
        !blind ||
        !caseRef ||
        blind.observation.case_id !== slot.case_id ||
        canonicalizeProtocolValueV01(blind.case_commitment_ref) !==
          canonicalizeProtocolValueV01(caseRef)
      ) {
        return true;
      }
      const join = joinBySlot.get(slot.slot_id);
      return slot.slot_role === "predecessor"
        ? join !== undefined
        : !join ||
            join.condition !== slot.condition ||
            join.existing_reentry_role !== slot.existing_reentry_role ||
            canonicalizeProtocolValueV01(join.blind_observation_ref) !==
              canonicalizeProtocolValueV01(
                commissionedLiveTrainingRecordRefV01(blind),
              );
    })
  ) {
    failV01("live_training_result_observation_or_join_set_invalid");
  }
  assertCommissionedLiveTrainingCaseObservationsSealedBeforeUnblindingV01({
    plan: input.plan,
    blind_observations: input.blind_observations,
    analysis_joins: input.analysis_joins,
  });
  if (
    input.attempt_registry.authorization_ref.record_fingerprint !==
      input.authorization.integrity.fingerprint ||
    input.attempt_registry.cohort_plan_ref.record_fingerprint !==
      input.plan.integrity.fingerprint
  ) {
    failV01("live_training_result_attempt_registry_binding_invalid");
  }
  if (
    input.training_result.holdout_materialized !== false ||
    input.clone_seals.some((seal) => !seal.identical_initial_source_state)
  ) {
    failV01("live_training_result_training_only_boundary_invalid");
  }
  const withoutIntegrity = {
    result_version: COMMISSIONED_LIVE_TRAINING_RESULT_VERSION_V01,
    result_id: input.result_id,
    cohort_plan_ref: commissionedLiveTrainingRecordRefV01(input.plan),
    authorization_ref: commissionedLiveTrainingRecordRefV01(input.authorization),
    authorization_consumption_ref: createCommissionedWorkRecordRefV01(
      input.authorization_consumption_ref,
    ),
    attempt_registry_ref: commissionedLiveTrainingRecordRefV01(
      input.attempt_registry,
    ),
    merged_training_result: input.training_result,
    predecessor_checkpoint_refs: input.predecessor_checkpoints.map((checkpoint) =>
      createCommissionedWorkRecordRefV01({
        record_version: checkpoint.checkpoint_version,
        record_id: checkpoint.checkpoint_id,
        record_fingerprint: checkpoint.integrity.fingerprint,
      }),
    ) as CommissionedLiveTrainingResultV01["predecessor_checkpoint_refs"],
    clone_seal_refs: input.clone_seals.map(commissionedLiveTrainingRecordRefV01) as
      CommissionedLiveTrainingResultV01["clone_seal_refs"],
    blind_observation_refs: input.blind_observations
      .map(commissionedLiveTrainingRecordRefV01)
      .sort(compareRefsV01),
    analysis_join_refs: input.analysis_joins
      .map(commissionedLiveTrainingRecordRefV01)
      .sort(compareRefsV01),
    valid_predecessor_episode_count: 3 as const,
    valid_successor_episode_count: 12 as const,
    valid_primary_episode_count: 15 as const,
    training_complete: true as const,
    all_primary_slots_present_exactly_once: true as const,
    objective_observations_sealed_before_unblinding: true as const,
    holdout_materialized: false as const,
    holdout_episode_count: 0 as const,
    holdout_candidate_frozen: false as const,
    final_live_family_report_created: false as const,
    execution_evidence_class:
      [
        "test_conformance",
        "future_live_control_flow_conformance",
      ].includes(input.authorization.authorization_kind)
        ? ("commissioned_agent_protocol_conformance" as const)
        : ("commissioned_agent_observation" as const),
    fake_output_is_behavioral_evidence: false as const,
  };
  const result = sealV01(
    withoutIntegrity,
    "commissioned_live_training_result_without_integrity_fingerprint",
  );
  assertSafeCommissionedLiveTrainingOutputV01(result);
  return result;
}

export function assertCommissionedLiveTrainingAttemptIdentitiesDistinctV01(
  admissions: readonly CommissionedLiveTrainingAttemptAdmissionV01[],
): void {
  const dimensions = [
    admissions.map((attempt) => attempt.executor_role_ref.role_fingerprint),
    admissions.map((attempt) => attempt.run_ref_fingerprint),
    admissions.map((attempt) => attempt.request_ref_fingerprint),
    admissions.map((attempt) => attempt.host_context_fingerprint),
    admissions.map((attempt) => attempt.clone_identity_fingerprint),
  ];
  if (dimensions.some((values) => new Set(values).size !== values.length)) {
    failV01("live_training_executor_run_context_or_clone_reused");
  }
}

export function assertCommissionedLiveTrainingArtifactsCompleteV01(input: {
  index: CommissionedLiveTrainingArtifactIndexV01;
  plan: CommissionedLiveTrainingCohortPlanV01;
  authorization: CommissionedLiveTrainingAuthorizationV01;
  family: CommissionedWorkFamilyManifestV01;
}): void {
  assertValidCommissionedLiveTrainingCohortPlanV01(input.plan);
  assertValidCommissionedLiveTrainingAuthorizationV01(
    input.authorization,
    input.plan,
  );
  assertExactObjectKeysV01(input.index, [
    "index_version", "cohort_id", "authorization_fingerprint",
    "cohort_plan_fingerprint", "family_fingerprint", "append_only",
    "completion_state", "complete_expected_slots", "cohort_aggregable",
    "expected_primary_episode_count",
    "expected_predecessor_checkpoint_count", "expected_holdout_episode_count",
    "artifacts", "raw_prompt_persisted", "raw_transcript_persisted",
    "hidden_reasoning_persisted", "raw_terminal_output_persisted",
    "raw_provider_payload_persisted", "credential_or_secret_persisted",
    "absolute_local_path_persisted", "production_project_content_persisted",
    "synthetic_expected_write_persisted_as_executor_evidence",
    "holdout_materialized", "github_writes", "product_database_writes",
    "core_writes", "semantic_writes", "review_decision_writes",
    "transition_writes", "policy_activations", "publication_writes",
    "integrity",
  ], "live_training_artifact_index_schema_invalid");
  validateIntegrityV01(
    input.index,
    "commissioned_live_training_artifact_index_without_integrity_fingerprint",
    "live_training_artifact_index_integrity_invalid",
  );
  if (
    input.index.index_version !== COMMISSIONED_LIVE_TRAINING_ARTIFACT_INDEX_VERSION_V01 ||
    input.index.cohort_id !== input.plan.cohort_id ||
    input.index.authorization_fingerprint !== input.authorization.integrity.fingerprint ||
    input.index.cohort_plan_fingerprint !== input.plan.integrity.fingerprint ||
    input.index.family_fingerprint !== input.family.integrity.fingerprint ||
    input.index.expected_primary_episode_count !== 15 ||
    input.index.expected_predecessor_checkpoint_count !== 3 ||
    input.index.expected_holdout_episode_count !== 0 ||
    input.index.append_only !== true ||
    input.index.completion_state !== "complete" ||
    !input.index.complete_expected_slots ||
    input.index.cohort_aggregable !== true ||
    input.index.holdout_materialized ||
    input.index.raw_prompt_persisted ||
    input.index.raw_transcript_persisted ||
    input.index.hidden_reasoning_persisted ||
    input.index.raw_terminal_output_persisted ||
    input.index.raw_provider_payload_persisted ||
    input.index.credential_or_secret_persisted ||
    input.index.absolute_local_path_persisted ||
    input.index.production_project_content_persisted ||
    input.index.synthetic_expected_write_persisted_as_executor_evidence ||
    Object.entries(input.index).some(
      ([key, value]) =>
        (key.endsWith("_writes") || key.endsWith("_activations")) && value !== 0,
    )
  ) {
    failV01("live_training_artifact_index_contract_invalid");
  }
  if (
    canonicalizeProtocolValueV01(input.plan.family_ref) !==
      canonicalizeProtocolValueV01(commissionedWorkManifestRecordRefV01(input.family)) ||
    input.authorization.source_binding.family_ref.record_fingerprint !==
      input.family.integrity.fingerprint
  ) {
    failV01("live_training_artifact_family_binding_invalid");
  }
  const paths = new Set<string>();
  const byKind = new Map<string, CommissionedLiveTrainingArtifactIndexV01["artifacts"]>();
  for (const entry of input.index.artifacts) {
    assertExactObjectKeysV01(entry, [
      "slot_kind", "record_ref", "slot_id", "attempt_id", "case_id",
      "relative_path", "content_fingerprint",
    ], "live_training_artifact_index_entry_schema_invalid");
    createCommissionedWorkRecordRefV01(entry.record_ref);
    requireFingerprintV01(
      entry.content_fingerprint,
      "live_training_artifact_content_fingerprint_invalid",
    );
    if (paths.has(entry.relative_path)) {
      failV01("live_training_artifact_slot_duplicate");
    }
    paths.add(entry.relative_path);
    const entries = byKind.get(entry.slot_kind) ?? [];
    entries.push(entry);
    byKind.set(entry.slot_kind, entries);
  }
  const exactKindCounts: Readonly<Record<string, number>> = {
    authorization: 1,
    authorization_consumption_primary: 1,
    authorization_consumption_witness: 1,
    cohort_plan: 1,
    family_manifest: 1,
    attempt_registry: 1,
    episode: 15,
    predecessor_checkpoint: 3,
    clone_seal: 3,
    blind_objective_observation: 15,
    analysis_join: 12,
    training_result: 1,
    live_training_result: 1,
    candidate_assessment: 1,
    cleanup_report: 1,
  };
  for (const [kind, count] of Object.entries(exactKindCounts)) {
    if ((byKind.get(kind) ?? []).length !== count) {
      failV01("live_training_artifact_expected_slot_missing_or_duplicate");
    }
  }
  const admissions = byKind.get("attempt_admission") ?? [];
  const starts = byKind.get("attempt_start") ?? [];
  const terminals = byKind.get("attempt_terminal") ?? [];
  const replacementCount = admissions.length - 15;
  if (
    starts.length !== admissions.length ||
    admissions.length !== terminals.length ||
    replacementCount < 0 ||
    replacementCount > COMMISSIONED_LIVE_TRAINING_REPLACEMENT_LIMIT_V01 ||
    input.index.artifacts.length !== 103 + replacementCount * 3
  ) {
    failV01("live_training_artifact_attempt_slot_count_invalid");
  }
  const countSlotKind = (kind: string, slotId: string): number =>
    (byKind.get(kind) ?? []).filter((entry) => entry.slot_id === slotId).length;
  for (const slot of input.plan.slots) {
    const admissionCount = countSlotKind("attempt_admission", slot.slot_id);
    if (
      countSlotKind("episode", slot.slot_id) !== 1 ||
      countSlotKind("blind_objective_observation", slot.slot_id) !== 1 ||
      countSlotKind("attempt_start", slot.slot_id) !== admissionCount ||
      admissionCount < 1 || admissionCount > 2 ||
      countSlotKind("attempt_terminal", slot.slot_id) !== admissionCount ||
      (slot.slot_role === "predecessor" &&
        countSlotKind("predecessor_checkpoint", slot.slot_id) !== 1) ||
      (slot.slot_role === "cold_successor" &&
        countSlotKind("analysis_join", slot.slot_id) !== 1)
    ) {
      failV01("live_training_artifact_slot_coverage_invalid");
    }
  }
  const cloneEntries = byKind.get("clone_seal") ?? [];
  if (cloneEntries.some((entry) => entry.case_id === null)) {
    failV01("live_training_artifact_clone_case_coverage_invalid");
  }
  const cloneCases = cloneEntries
    .map((entry) => entry.case_id as string)
    .sort(compareProtocolCodeUnitsV01);
  if (
    canonicalizeProtocolValueV01(cloneCases) !==
    canonicalizeProtocolValueV01(
      [...COMMISSIONED_LIVE_TRAINING_CASE_IDS_V01].sort(compareProtocolCodeUnitsV01),
    )
  ) {
    failV01("live_training_artifact_clone_case_coverage_invalid");
  }
  assertSafeCommissionedLiveTrainingOutputV01(input.index);
}

export function assertSafeCommissionedLiveTrainingOutputV01(value: unknown): void {
  const serialized = canonicalizeProtocolValueV01(value);
  if (Buffer.byteLength(serialized, "utf8") > 16_777_216) {
    failV01("live_training_safe_output_byte_bound_exceeded");
  }
  const allowedCanonicalIdentityPaths = new Set<string>();
  const allowedFalseInvariantFields = new Set<string>();
  let stringCount = 0;
  let collectionEntryCount = 0;
  walkOutputV01(value, "$", (candidate, path, key) => {
    if (candidate === false && key !== null) allowedFalseInvariantFields.add(key);
    if (
      key !== null &&
      ["provider_id", "model_id", "route_id"].includes(key)
    ) {
      allowedCanonicalIdentityPaths.add(path);
    }
    if (
      key !== null &&
      [
        "codex_environment_binding",
        "codex_environment_binding_ref",
        "codex_environment_binding_fingerprint",
        "codex_configuration_status",
        "codex_configuration_fingerprint",
        "codex_home_identity_fingerprint",
        "codex_sqlite_home_identity_fingerprint",
        "per_attempt_codex_home_identity_rule",
        "per_attempt_codex_sqlite_home_identity_rule",
      ].includes(key)
    ) {
      allowedCanonicalIdentityPaths.add(path);
    }
    if (typeof candidate === "string") {
      stringCount += 1;
      if (
        candidate.length > 4_096 ||
        /(?:^|[\s"'`(])(?:\/Users\/|\/home\/|[A-Za-z]:[\\/]|\\\\)/u.test(
          candidate,
        )
      ) {
        failV01("live_training_unsafe_or_oversized_string");
      }
    } else if (Array.isArray(candidate)) {
      collectionEntryCount += candidate.length;
    } else if (candidate && typeof candidate === "object") {
      collectionEntryCount += Object.keys(candidate).length;
    }
  });
  if (stringCount > 65_536 || collectionEntryCount > 65_536) {
    failV01("live_training_collection_bound_exceeded");
  }
  const issues = new Set<string>();
  scanForbiddenProtocolMaterialV01(
    value,
    "$",
    {
      error: (code) => issues.add(code),
      warning: () => {},
    },
    {
      secret_material_message:
        "Secret-shaped material is forbidden in live-training artifacts.",
      provider_specific_field_message:
        "Provider identity is permitted only in the closed native execution binding.",
      allowed_canonical_identity_paths: allowedCanonicalIdentityPaths,
      allowed_false_invariant_fields: allowedFalseInvariantFields,
    },
  );
  if (issues.size > 0) {
    failV01(`live_training_forbidden_material:${[...issues].sort()[0]}`);
  }
  for (const marker of [
    "modules/ledger/",
    "commissioned_controlled_work_final_report",
    "synthetic_mechanics_template",
    "BEGIN PRIVATE KEY",
  ]) {
    if (serialized.includes(marker)) {
      failV01("live_training_forbidden_holdout_or_private_material");
    }
  }
}

function walkOutputV01(
  value: unknown,
  path: string,
  visitor: (value: unknown, path: string, key: string | null) => void,
  key: string | null = null,
): void {
  visitor(value, path, key);
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      walkOutputV01(item, `${path}[${index}]`, visitor, null),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  Object.entries(value).forEach(([childKey, child]) =>
    walkOutputV01(child, `${path}.${childKey}`, visitor, childKey),
  );
}

export function createCommissionedLiveTrainingUnknownResourceLaneV01(): CommissionedWorkResourceLaneV01 {
  return { provenance: "unknown", value: null };
}

export function createCommissionedLiveTrainingObservedResourceLaneV01(
  value: number,
): CommissionedWorkResourceLaneV01 {
  if (!Number.isInteger(value) || value < 0) {
    failV01("live_training_resource_observation_invalid");
  }
  return { provenance: "observed", value };
}

export function createCommissionedLiveTrainingUnknownSourcedResourceLaneV01(): CommissionedLiveTrainingSourcedResourceLaneV01 {
  return { provenance: "unknown", value: null, source_ref: null };
}

export function createCommissionedLiveTrainingObservedSourcedResourceLaneV01(
  value: number,
  sourceRef: CommissionedWorkRecordRefV01,
): CommissionedLiveTrainingSourcedResourceLaneV01 {
  if (!Number.isInteger(value) || value < 0) {
    failV01("live_training_resource_observation_invalid");
  }
  return {
    provenance: "observed",
    value,
    source_ref: createCommissionedWorkRecordRefV01(sourceRef),
  };
}

export function commissionedLiveTrainingReplacementPolicyFingerprintV01(): string {
  return fingerprintV01(REPLACEMENT_POLICY_V01);
}

export function commissionedLiveTrainingStopConditionFingerprintV01(): string {
  return fingerprintV01(STOP_CONDITIONS_V01);
}

export function commissionedLiveTrainingApprovalPolicyFingerprintV01(): string {
  return fingerprintV01(APPROVAL_POLICY_V01);
}

export function commissionedLiveTrainingResumePolicyFingerprintV01(): string {
  return fingerprintV01(RESUME_POLICY_V01);
}

export function commissionedLiveTrainingCandidateRuleTableV01(): {
  rule_table_version: typeof COMMISSIONED_LIVE_TRAINING_COMPONENT_RULE_TABLE_VERSION_V01;
  rules: CommissionedLiveTrainingComponentAnalysisRuleV01[];
  rule_table_fingerprint: string;
} {
  const rules = structuredClone(
    COMPONENT_ANALYSIS_RULES_V01,
  ) as unknown as CommissionedLiveTrainingComponentAnalysisRuleV01[];
  return {
    rule_table_version:
      COMMISSIONED_LIVE_TRAINING_COMPONENT_RULE_TABLE_VERSION_V01,
    rules,
    rule_table_fingerprint: fingerprintV01(rules),
  };
}

export function assertCommissionedLiveTrainingNoResumeBoundaryV01(input: {
  boundary_kind: "detach" | "reconciliation_required";
  authorization_consumed: boolean;
  meaningful_action_status: "observed_absent" | "observed_present" | "unknown";
}): {
  disposition: "terminal_nonreplaceable_consumed_cohort_incomplete";
  replacement_allowed: false;
  resume_allowed: false;
  nonce_reusable: false;
} {
  if (!input.authorization_consumed) {
    failV01("live_training_no_resume_boundary_without_consumption");
  }
  return {
    disposition: "terminal_nonreplaceable_consumed_cohort_incomplete",
    replacement_allowed: false,
    resume_allowed: false,
    nonce_reusable: false,
  };
}

export function commissionedLiveTrainingDefaultAdapterRefV01(): CommissionedWorkRecordRefV01 {
  return createCommissionedWorkRecordRefV01({
    record_version: CODEX_APP_SERVER_ADAPTER_VERSION_V01,
    record_id: "current-codex-app-server-adapter",
    record_fingerprint: fingerprintV01(CODEX_APP_SERVER_ADAPTER_VERSION_V01),
  });
}

export function commissionedLiveTrainingDefaultCapabilityRefV01(): CommissionedWorkRecordRefV01 {
  return createCommissionedWorkRecordRefV01({
    record_version: CODEX_APP_SERVER_CAPABILITY_VERSION_V01,
    record_id: "current-codex-app-server-capability",
    record_fingerprint: fingerprintV01(CODEX_APP_SERVER_CAPABILITY_VERSION_V01),
  });
}

function assertTrainingOnlyFamilyBindingV01(
  manifest: CommissionedWorkFamilyManifestV01,
  trainingCases: readonly CommissionedWorkCaseSourceV01[],
): void {
  if (
    manifest.family_id !== COMMISSIONED_LIVE_TRAINING_FAMILY_ID_V01 ||
    trainingCases.length !== 3 ||
    manifest.training_cases.length !== 3
  ) {
    failV01("live_training_family_or_training_case_set_invalid");
  }
  const expectedIds = [...COMMISSIONED_LIVE_TRAINING_CASE_IDS_V01];
  const actualIds = trainingCases.map((source) => source.case_id);
  if (canonicalizeProtocolValueV01(actualIds) !== canonicalizeProtocolValueV01(expectedIds)) {
    failV01("live_training_training_case_order_invalid");
  }
  trainingCases.forEach((source, index) => {
    if (
      source.case_role !== "training" ||
      canonicalizeProtocolValueV01(buildCommissionedWorkCaseCommitmentV01(source)) !==
        canonicalizeProtocolValueV01(manifest.training_cases[index])
    ) {
      failV01("live_training_family_or_case_commitment_drift");
    }
  });
}

function assertExactScheduleV01(
  slots: readonly CommissionedLiveTrainingScheduleSlotV01[],
): void {
  if (slots.length !== 15) failV01("live_training_schedule_slot_count_invalid");
  slots.forEach((slot, index) => {
    assertExactObjectKeysV01(slot, [
      "slot_id", "ordinal", "round", "slot_role", "case_id", "condition",
      "existing_reentry_role", "executor_role_ref", "primary_attempt_id",
      "replacement_allowed", "executor_visible_slot_identity",
      "assignment_fingerprint",
    ], "live_training_schedule_slot_schema_invalid");
    const expected = SCHEDULE_BLUEPRINT_V01[index];
    const opaqueAssignment = OPAQUE_EXECUTOR_ASSIGNMENTS_V01[index];
    if (
      !expected ||
      !opaqueAssignment ||
      slot.ordinal !== index + 1 ||
      slot.slot_id !== `cw1l1-slot-${String(index + 1).padStart(3, "0")}` ||
      slot.case_id !== expected[0] ||
      slot.condition !== expected[1] ||
      slot.slot_role !== (expected[1] === null ? "predecessor" : "cold_successor") ||
      slot.round !== (expected[1] === null ? 0 : Math.floor((index - 3) / 3) + 1) ||
      slot.existing_reentry_role !==
        (expected[1] === null
          ? null
          : COMMISSIONED_WORK_TREATMENT_ROLE_BINDINGS_V01[expected[1]]) ||
      canonicalizeProtocolValueV01(slot.executor_role_ref) !==
        canonicalizeProtocolValueV01(
          createCommissionedWorkRoleRefV01("executor", opaqueAssignment[0]),
        ) ||
      slot.primary_attempt_id !==
        `cw1l1-attempt-${String(index + 1).padStart(3, "0")}-p` ||
      slot.replacement_allowed !== true ||
      slot.executor_role_ref.role_id !== opaqueAssignment[0] ||
      slot.executor_visible_slot_identity !== opaqueAssignment[1]
    ) {
      failV01("live_training_schedule_or_order_changed");
    }
    const { assignment_fingerprint: _ignored, ...withoutFingerprint } = slot;
    if (slot.assignment_fingerprint !== fingerprintV01(withoutFingerprint)) {
      failV01("live_training_schedule_assignment_integrity_invalid");
    }
  });
  for (const caseId of COMMISSIONED_LIVE_TRAINING_CASE_IDS_V01) {
    const caseConditions = slots
      .filter((slot) => slot.case_id === caseId && slot.condition !== null)
      .map((slot) => slot.condition as CommissionedWorkConditionV01)
      .sort(compareProtocolCodeUnitsV01);
    if (
      canonicalizeProtocolValueV01(caseConditions) !==
      canonicalizeProtocolValueV01([...COMMISSIONED_WORK_CONDITIONS_V01].sort(compareProtocolCodeUnitsV01))
    ) {
      failV01("live_training_schedule_condition_balance_invalid");
    }
  }
}

function isSafeCliVersionV01(value: string): boolean {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= 160 &&
    /^[A-Za-z0-9._+ /-]+$/u.test(value) &&
    !value.startsWith("/") &&
    !/(?:^|\s)\//u.test(value) &&
    !value.includes("//")
  );
}

function assertValidNativeConfigurationV01(
  configuration: CommissionedLiveTrainingExactNativeExecutionConfigurationV01,
): void {
  assertExactObjectKeysV01(configuration, [
    "configuration_version", "provider_id", "model_id", "route_id",
    "reasoning_effort", "expected_cli_version", "adapter_ref",
    "capability_ref", "host_ref", "cli_ref", "runtime_ref", "provider_ref", "model_ref",
    "route_ref", "cli_executable_identity", "runtime_executable_identity",
    "provider_bearing_native_host_invocation_limit_semantics", "model_bearing_native_host_invocation_limit_semantics",
    "configuration_fingerprint",
  ], "live_training_native_configuration_schema_invalid");
  const exactAdapterRef = commissionedLiveTrainingDefaultAdapterRefV01();
  const exactCapabilityRef = commissionedLiveTrainingDefaultCapabilityRefV01();
  if (
    canonicalizeProtocolValueV01(configuration.adapter_ref) !==
      canonicalizeProtocolValueV01(exactAdapterRef) ||
    canonicalizeProtocolValueV01(configuration.capability_ref) !==
      canonicalizeProtocolValueV01(exactCapabilityRef) ||
    configuration.provider_bearing_native_host_invocation_limit_semantics !==
      "max_provider_bearing_native_host_invocations" ||
    configuration.model_bearing_native_host_invocation_limit_semantics !==
      "max_model_bearing_native_host_invocations"
  ) {
    failV01("live_training_native_execution_owner_binding_invalid");
  }
  const rebuilt = buildCommissionedLiveTrainingExactNativeExecutionConfigurationV01({
    provider_id: configuration.provider_id,
    model_id: configuration.model_id,
    route_id: configuration.route_id,
    reasoning_effort: configuration.reasoning_effort,
    expected_cli_version: configuration.expected_cli_version,
    adapter_ref: configuration.adapter_ref,
    capability_ref: configuration.capability_ref,
    host_ref: configuration.host_ref,
    cli_ref: configuration.cli_ref,
    runtime_ref: configuration.runtime_ref,
    provider_ref: configuration.provider_ref,
    model_ref: configuration.model_ref,
    route_ref: configuration.route_ref,
    cli_executable_identity: configuration.cli_executable_identity,
    runtime_executable_identity: configuration.runtime_executable_identity,
  });
  if (
    canonicalizeProtocolValueV01(rebuilt) !==
    canonicalizeProtocolValueV01(configuration)
  ) {
    failV01("live_training_native_execution_configuration_integrity_invalid");
  }
}

function assertValidArtifactRelativeRootV01(value: string, cohortId: string): void {
  const expected = `${COMMISSIONED_LIVE_TRAINING_ARTIFACT_NAMESPACE_V01}/${cohortId}`;
  if (value !== expected || value.includes("..") || value.startsWith("/")) {
    failV01("live_training_artifact_relative_root_invalid");
  }
}

function assertOptionalCeilingV01(
  ceiling: CommissionedLiveTrainingAuthorizationV01["usage_unit_ceiling"],
): void {
  if (ceiling.observability === "unknown") {
    if (ceiling.limit !== null || ceiling.source_ref !== null) {
      failV01("live_training_optional_ceiling_unknown_invalid");
    }
    return;
  }
  if (!Number.isInteger(ceiling.limit) || ceiling.limit < 0) {
    failV01("live_training_optional_ceiling_observed_invalid");
  }
  createCommissionedWorkRecordRefV01(ceiling.source_ref);
}

function assertSourcedResourceLaneV01(
  lane: CommissionedLiveTrainingSourcedResourceLaneV01,
): void {
  assertExactObjectKeysV01(
    lane,
    ["provenance", "value", "source_ref"],
    "live_training_resource_observation_schema_invalid",
  );
  if (lane.provenance === "unknown") {
    if (lane.value !== null || lane.source_ref !== null) {
      failV01("live_training_resource_unknown_zero_imputation");
    }
    return;
  }
  if (!Number.isInteger(lane.value) || lane.value < 0) {
    failV01("live_training_resource_observation_invalid");
  }
  createCommissionedWorkRecordRefV01(lane.source_ref);
}

function assertObservedOptionalCeilingV01(
  lane: CommissionedLiveTrainingSourcedResourceLaneV01,
  ceiling: CommissionedLiveTrainingAuthorizationV01["provider_call_ceiling"],
): void {
  if (ceiling.observability === "unknown") return;
  if (lane.provenance === "unknown") {
    failV01("live_training_numeric_ceiling_observation_unknown");
  }
  if (lane.value > ceiling.limit) {
    failV01("live_training_authorization_resource_or_time_ceiling_exceeded");
  }
}

function assertExactCeilingV01(value: number, minimum: number, maximum: number): void {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    failV01("live_training_authorization_ceiling_invalid");
  }
}

function sortedRefsV01(
  refs: readonly CommissionedWorkRecordRefV01[],
): CommissionedWorkRecordRefV01[] {
  refs.forEach(createCommissionedWorkRecordRefV01);
  if (new Set(refs.map((ref) => ref.record_fingerprint)).size !== refs.length) {
    failV01("live_training_record_ref_duplicate");
  }
  return [...refs].sort(compareRefsV01);
}

function compareRefsV01(
  left: CommissionedWorkRecordRefV01,
  right: CommissionedWorkRecordRefV01,
): number {
  return compareProtocolCodeUnitsV01(
    canonicalizeProtocolValueV01(left),
    canonicalizeProtocolValueV01(right),
  );
}

function assertExactObjectKeysV01(
  value: object,
  expectedKeys: readonly string[],
  code: string,
): void {
  const actual = Object.keys(value).sort(compareProtocolCodeUnitsV01);
  const expected = [...expectedKeys].sort(compareProtocolCodeUnitsV01);
  if (
    canonicalizeProtocolValueV01(actual) !==
    canonicalizeProtocolValueV01(expected)
  ) {
    failV01(code);
  }
}

function recordVersionV01(record: object): string {
  for (const key of [
    "plan_version",
    "authorization_version",
    "environment_binding_version",
    "attempt_start_version",
    "admission_version",
    "terminal_version",
    "registry_version",
    "seal_version",
    "blind_observation_version",
    "join_version",
    "assessment_version",
    "cleanup_version",
    "observation_version",
    "closeout_version",
    "result_version",
  ]) {
    const value = (record as Record<string, unknown>)[key];
    if (typeof value === "string") return value;
  }
  failV01("live_training_record_version_missing");
}

function recordIdV01(record: object): string {
  for (const key of [
    "cohort_id",
    "authorization_id",
    "binding_id",
    "attempt_start_id",
    "attempt_id",
    "terminal_id",
    "registry_id",
    "seal_id",
    "blind_observation_id",
    "join_id",
    "assessment_id",
    "cleanup_id",
    "observation_id",
    "closeout_id",
    "result_id",
  ]) {
    const value = (record as Record<string, unknown>)[key];
    if (typeof value === "string") return value;
  }
  failV01("live_training_record_id_missing");
}

function requireSafeCodeV01(value: string, code: string): void {
  if (!SAFE_CODE_V01.test(value)) failV01(code);
}

function requireFingerprintV01(value: string, code: string): void {
  if (!SHA256_V01.test(value)) failV01(code);
}

function requireCommitV01(value: string, code: string): void {
  if (!COMMIT_SHA_V01.test(value)) failV01(code);
}

function requireTimestampV01(value: string, code: string): void {
  if (!value.endsWith("Z") || !Number.isFinite(Date.parse(value))) failV01(code);
}

function fingerprintV01(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

function sealV01<T extends object>(
  valueWithoutIntegrity: T,
  scope: string,
): T & { integrity: ReturnType<typeof createCommissionedWorkIntegrityV01> } {
  return {
    ...valueWithoutIntegrity,
    integrity: createCommissionedWorkIntegrityV01(valueWithoutIntegrity, scope),
  };
}

function validateIntegrityV01(
  value: object & { integrity: { fingerprint: string } },
  scope: string,
  code: string,
): void {
  const { integrity, ...withoutIntegrity } = value;
  const expected = createCommissionedWorkIntegrityV01(withoutIntegrity, scope);
  if (
    canonicalizeProtocolValueV01(integrity) !==
    canonicalizeProtocolValueV01(expected)
  ) {
    failV01(code);
  }
}

function failV01(code: string): never {
  throw new CommissionedControlledLiveTrainingErrorV01(code);
}
