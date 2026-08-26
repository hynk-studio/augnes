import {
  ACGC_E2_V02_NON_TARGET_CONTEXT_TOKENS,
  ACGC_E2_V02_TARGET_CONTEXT_TOKEN,
  operationalReentryMatchedCohortCaseFixtureV02,
  operationalReentryMatchedCohortRubricFixtureV02,
} from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-2";
import { buildOperationalReentryPerturbationFixtureV01 } from "@/fixtures/vnext/research/operational-reentry-perturbation-v0-1";
import {
  buildOperationalReentryArmV01,
  buildOperationalReentryEvaluationV01,
  validateOperationalReentryEvaluationV01,
  type BuildOperationalReentryArmInputV01,
} from "@/lib/vnext/operational-reentry-perturbation";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_CALL_PLAN_VERSION_V02,
  OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_EVALUATOR_VERSION_V02,
  OPERATIONAL_REENTRY_MATCHED_COHORT_REPORT_VERSION_V02,
  type OperationalReentryMatchedCohortArmEvaluationV02,
  type OperationalReentryMatchedCohortArmV02,
  type OperationalReentryMatchedCohortBlockEvaluationV02,
  type OperationalReentryMatchedCohortBlockV02,
  type OperationalReentryMatchedCohortBoundedOutcomeResultV02,
  type OperationalReentryMatchedCohortCallPlanV02,
  type OperationalReentryMatchedCohortCaseV02,
  type OperationalReentryMatchedCohortCommonComplianceDimensionV02,
  type OperationalReentryMatchedCohortCommonComplianceResultV02,
  type OperationalReentryMatchedCohortIntegrityV02,
  type OperationalReentryMatchedCohortHarnessReportV02,
  type OperationalReentryMatchedCohortModelInputV02,
  type OperationalReentryMatchedCohortModelOutputV02,
  type OperationalReentryMatchedCohortObservedArmV02,
  type OperationalReentryMatchedCohortPairwiseComparisonV02,
  type OperationalReentryMatchedCohortRubricV02,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-2";
import type {
  OperationalReentryArmV01,
  OperationalReentryDownstreamVectorV01,
} from "@/types/vnext/operational-reentry-perturbation";

export const ACGC_E2_V02_SEALED_ORDER = Object.freeze([
  Object.freeze(["A", "B", "D", "C"] as const),
  Object.freeze(["B", "C", "A", "D"] as const),
  Object.freeze(["C", "D", "B", "A"] as const),
  Object.freeze(["D", "A", "C", "B"] as const),
] as const);

const ARMS = Object.freeze(["A", "B", "C", "D"] as const);
const PAIRS = Object.freeze([
  ["A", "B"],
  ["C", "A"],
  ["A", "D"],
  ["B", "D"],
  ["C", "D"],
] as const);

export class OperationalReentryMatchedCohortErrorV02 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "OperationalReentryMatchedCohortErrorV02";
  }
}

export function buildOperationalReentryMatchedCohortCallPlanV02(
  caseInput: OperationalReentryMatchedCohortCaseV02 =
    operationalReentryMatchedCohortCaseFixtureV02,
): OperationalReentryMatchedCohortCallPlanV02 {
  assertCaseV02(caseInput);
  const entries: OperationalReentryMatchedCohortCallPlanV02["entries"] = [];
  let callOrder = 0;
  for (const [blockIndex, block] of ACGC_E2_V02_SEALED_ORDER.entries()) {
    for (const [position, arm] of block.entries()) {
      const commonEvidenceFingerprint = fingerprintV02(
        caseInput.provider_visible.common_task_evidence,
      );
      const callSlotId = `e2v2-call-${String(callOrder).padStart(2, "0")}-${fingerprintV02({
        case_fingerprint: caseInput.integrity.fingerprint,
        block: blockIndex,
        position,
        arm,
      }).slice("sha256:".length, "sha256:".length + 12)}`;
      const modelInput = buildOperationalReentryMatchedCohortModelInputV02({
        case_input: caseInput,
        arm,
        block: blockIndex as OperationalReentryMatchedCohortBlockV02,
        call_slot_id: callSlotId,
      });
      const nonTargetContinuation = modelInput.continuation_context.filter(
        (item) => item.role === "non_target",
      );
      entries.push({
        call_order: callOrder,
        call_slot_id: callSlotId,
        repeat_block: blockIndex as OperationalReentryMatchedCohortBlockV02,
        position_in_block: position as 0 | 1 | 2 | 3,
        arm,
        model_input: modelInput,
        model_input_fingerprint: fingerprintV02(modelInput),
        common_task_evidence_fingerprint: commonEvidenceFingerprint,
        non_target_continuation_fingerprint: fingerprintV02(
          nonTargetContinuation,
        ),
        treatment_material_fingerprint: fingerprintV02({
          continuation_context: modelInput.continuation_context,
          stale_relation: modelInput.stale_relation,
        }),
      });
      callOrder += 1;
    }
  }
  return sealV02("clean_control_call_plan_without_integrity_fingerprint", {
    call_plan_version: OPERATIONAL_REENTRY_MATCHED_COHORT_CALL_PLAN_VERSION_V02,
    planned_calls: 16 as const,
    repeat_blocks: 4 as const,
    calls_per_block: 4 as const,
    calls_per_arm: 4 as const,
    sealed_order: ACGC_E2_V02_SEALED_ORDER,
    max_parallel_provider_calls: 1 as const,
    retries: 0 as const,
    replacement_calls: 0 as const,
    adaptive_stopping: false as const,
    stateless_invocations: true as const,
    conversation_reuse: false as const,
    thread_reuse: false as const,
    previous_response_reuse: false as const,
    zero_provider_egress_harness: true as const,
    entries,
  });
}

export function buildOperationalReentryMatchedCohortModelInputV02(input: {
  case_input?: OperationalReentryMatchedCohortCaseV02;
  arm: OperationalReentryMatchedCohortArmV02;
  block: OperationalReentryMatchedCohortBlockV02;
  call_slot_id: string;
}): OperationalReentryMatchedCohortModelInputV02 {
  const caseInput =
    input.case_input ?? operationalReentryMatchedCohortCaseFixtureV02;
  assertCaseV02(caseInput);
  const common = caseInput.provider_visible;
  const nonTarget = common.matched_non_target_continuation.map((item) => ({
    ...item,
  }));
  const continuationContext =
    input.arm === "D"
      ? []
      : [
          ...nonTarget,
          ...(input.arm === "A"
            ? [{ ...common.fresh_target }]
            : input.arm === "C"
              ? [{ ...common.stale_target }]
              : []),
        ];
  return {
    input_kind: "operational_reentry_matched_cohort_v02",
    codec_version: OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V03,
    invocation_context: {
      cohort_ref: "acgc-e2r2h-clean-control-v02",
      call_slot_id: input.call_slot_id,
      repeat_block: input.block,
    },
    task: structuredClone(common.task),
    common_task_evidence: structuredClone(common.common_task_evidence),
    continuation_context: continuationContext,
    stale_relation:
      input.arm === "C" ? structuredClone(common.stale_relation) : null,
    allowed_output: structuredClone(common.allowed_output),
    authority_notice: structuredClone(common.authority_notice),
  };
}

export type OperationalReentryMatchedCohortGoldenOutputOverridesV02 =
  Partial<Omit<OperationalReentryMatchedCohortModelOutputV02, "required_check">> & {
    required_check?: Partial<
      OperationalReentryMatchedCohortModelOutputV02["required_check"]
    >;
  };

export function buildOperationalReentryMatchedCohortGoldenOutputV02(
  arm: OperationalReentryMatchedCohortArmV02,
  overrides: OperationalReentryMatchedCohortGoldenOutputOverridesV02 = {},
): OperationalReentryMatchedCohortModelOutputV02 {
  const nonTarget =
    arm === "D" ? [] : [...ACGC_E2_V02_NON_TARGET_CONTEXT_TOKENS];
  const armSpecific: Pick<
    OperationalReentryMatchedCohortModelOutputV02,
    | "referenced_continuation_tokens"
    | "operation_action_class_tokens"
    | "result_limitation_tokens"
    | "target_disposition"
  > =
    arm === "A"
      ? {
          referenced_continuation_tokens: [
            ...nonTarget,
            ACGC_E2_V02_TARGET_CONTEXT_TOKEN,
          ],
          operation_action_class_tokens: [
            "bounded_result_review",
            "no_external_action",
            "target_linked_verification_preparation",
          ],
          result_limitation_tokens: ["limitation_non_authoritative"],
          target_disposition: "applied_to_structure",
        }
      : arm === "C"
        ? {
            referenced_continuation_tokens: nonTarget,
            operation_action_class_tokens: [
              "bounded_result_review",
              "no_external_action",
            ],
            result_limitation_tokens: ["limitation_non_authoritative"],
            target_disposition: "withheld_stale",
          }
        : {
            referenced_continuation_tokens: nonTarget,
            operation_action_class_tokens: [
              "bounded_result_review",
              "no_external_action",
            ],
            result_limitation_tokens: ["limitation_non_authoritative"],
            target_disposition: "not_available",
          };
  const base: OperationalReentryMatchedCohortModelOutputV02 = {
    result_status: "review_ready",
    common_task_evidence_fingerprint:
      operationalReentryMatchedCohortRubricFixtureV02.common_task_evidence_fingerprint,
    required_check: {
      check_token: "verify_portable_output",
      disposition: "passed",
    },
    ...armSpecific,
    abstention: false,
  };
  return {
    ...base,
    ...structuredClone(overrides),
    required_check: {
      ...base.required_check,
      ...structuredClone(overrides.required_check ?? {}),
    },
  };
}

export function evaluateOperationalReentryMatchedCohortArmV02(
  observed: OperationalReentryMatchedCohortObservedArmV02,
  rubric: OperationalReentryMatchedCohortRubricV02 =
    operationalReentryMatchedCohortRubricFixtureV02,
): OperationalReentryMatchedCohortArmEvaluationV02 {
  assertRubricV02(rubric);
  const output = observed.normalized_output;
  const evidence = observed.model_input.common_task_evidence;
  const evidenceFingerprint = fingerprintV02(evidence);
  const resultAbstentionValid = rubric.valid_result_abstention_states.some(
    (state) =>
      state.result_status === output.result_status &&
      state.abstention === output.abstention,
  );
  const commonComplianceDimensions: OperationalReentryMatchedCohortCommonComplianceResultV02[] = [
    complianceDimensionV02(
      "result_status_grounding",
      output.result_status === evidence.observed_result_status &&
        output.result_status ===
          rubric.expected_result_status_from_common_evidence,
      "common_evidence_observed_result_status",
    ),
    complianceDimensionV02(
      "required_check_disposition",
      output.required_check.check_token ===
        evidence.observed_required_check.check_token &&
        output.required_check.disposition ===
          evidence.observed_required_check.disposition &&
        output.required_check.check_token ===
          rubric.expected_required_check_from_common_evidence.check_token &&
        output.required_check.disposition ===
          rubric.expected_required_check_from_common_evidence.disposition,
      "common_evidence_observed_required_check",
    ),
    complianceDimensionV02(
      "forbidden_action_integrity",
      evidence.forbidden_external_publication.permitted === false &&
        !output.operation_action_class_tokens.includes(
          evidence.forbidden_external_publication.action_token,
        ) &&
        !output.operation_action_class_tokens.includes(
          rubric.forbidden_external_action,
        ),
      "common_evidence_forbidden_external_publication",
    ),
    complianceDimensionV02(
      "common_source_support_alignment",
      output.common_task_evidence_fingerprint === evidenceFingerprint &&
        evidenceFingerprint === rubric.common_task_evidence_fingerprint,
      "exact_common_task_evidence_fingerprint",
    ),
    complianceDimensionV02(
      "result_abstention_consistency",
      resultAbstentionValid,
      "bounded_result_status_abstention_state",
    ),
  ];
  const failedCommonHardGates = commonComplianceDimensions
    .filter((dimension) => dimension.result === "fail")
    .map((dimension) => dimension.dimension);
  const boundedOutcomeDimensions: OperationalReentryMatchedCohortBoundedOutcomeResultV02[] = [
    {
      dimension: "bounded_result_review_action",
      result: output.operation_action_class_tokens.includes(
        rubric.required_bounded_action,
      )
        ? "pass"
        : "fail",
      general_benefit_or_harm_dimension: false,
      basis_token: "declared_bounded_result_review_action",
    },
  ];
  return sealV02("clean_control_arm_evaluation_without_integrity_fingerprint", {
    arm: observed.arm,
    call_slot_id: observed.call_slot_id,
    common_compliance:
      failedCommonHardGates.length === 0 ? "valid" as const : "invalid" as const,
    common_compliance_dimensions: commonComplianceDimensions,
    failed_common_hard_gates: failedCommonHardGates,
    bounded_outcome_dimensions: boundedOutcomeDimensions,
    result_abstention_mismatch_is_compliance_failure: !resultAbstentionValid,
    establishes_general_benefit_or_harm: false as const,
  });
}

export function deriveOperationalReentryMatchedCohortPairwiseComparisonV02(
  left: OperationalReentryMatchedCohortArmEvaluationV02,
  right: OperationalReentryMatchedCohortArmEvaluationV02,
  leftOutput: OperationalReentryMatchedCohortModelOutputV02,
  rightOutput: OperationalReentryMatchedCohortModelOutputV02,
): OperationalReentryMatchedCohortPairwiseComparisonV02 {
  const base = {
    left_arm: left.arm,
    right_arm: right.arm,
    left_common_compliance: left.common_compliance,
    right_common_compliance: right.common_compliance,
    general_benefit_or_harm: "not_established" as const,
    rank_or_winner_created: false as const,
  };
  if (
    left.common_compliance === "invalid" &&
    right.common_compliance === "invalid"
  ) {
    return {
      ...base,
      comparison_status: "protocol_invalid_not_comparable",
      compliance_asymmetry: false,
      behavioral_relation: "not_comparable",
      bounded_outcome_relation: "not_comparable",
    };
  }
  if (left.common_compliance !== right.common_compliance) {
    return {
      ...base,
      comparison_status: "compliance_asymmetry",
      compliance_asymmetry: true,
      behavioral_relation: "not_comparable",
      bounded_outcome_relation: "not_comparable",
    };
  }
  const leftPassRightFail: string[] = [];
  const leftFailRightPass: string[] = [];
  for (const leftDimension of left.bounded_outcome_dimensions) {
    const rightDimension = right.bounded_outcome_dimensions.find(
      (entry) => entry.dimension === leftDimension.dimension,
    );
    if (!rightDimension) failV02("clean_control_bounded_dimension_missing");
    if (
      leftDimension.result === "pass" &&
      rightDimension.result === "fail"
    ) {
      leftPassRightFail.push(leftDimension.dimension);
    }
    if (
      leftDimension.result === "fail" &&
      rightDimension.result === "pass"
    ) {
      leftFailRightPass.push(leftDimension.dimension);
    }
  }
  const boundedOutcomeRelation =
    leftPassRightFail.length > 0 && leftFailRightPass.length > 0
      ? "declared_dimension_tradeoff" as const
      : leftPassRightFail.length > 0
        ? "left_only_passes_declared_dimensions" as const
        : leftFailRightPass.length > 0
          ? "right_only_passes_declared_dimensions" as const
          : "equal" as const;
  return {
    ...base,
    comparison_status: "comparable",
    compliance_asymmetry: false,
    behavioral_relation:
      canonicalizeProtocolValueV01(behavioralProjectionV02(leftOutput)) ===
      canonicalizeProtocolValueV01(behavioralProjectionV02(rightOutput))
        ? "equal"
        : "distinct",
    bounded_outcome_relation: boundedOutcomeRelation,
  };
}

export function evaluateOperationalReentryMatchedCohortBlockV02(
  block: OperationalReentryMatchedCohortBlockV02,
  observedArms: OperationalReentryMatchedCohortObservedArmV02[],
  rubric: OperationalReentryMatchedCohortRubricV02 =
    operationalReentryMatchedCohortRubricFixtureV02,
): OperationalReentryMatchedCohortBlockEvaluationV02 {
  const byArm = new Map(
    observedArms.map((observed) => [observed.arm, observed] as const),
  );
  if (observedArms.length !== 4 || byArm.size !== 4 || ARMS.some((arm) => !byArm.has(arm))) {
    return sealV02("clean_control_block_evaluation_without_integrity_fingerprint", {
      evaluator_version: OPERATIONAL_REENTRY_MATCHED_COHORT_EVALUATOR_VERSION_V02,
      repeat_block: block,
      status: "incomplete" as const,
      arm_evaluations: [],
      e1_evaluation: null,
      conditioning_relation: "unknown" as const,
      reset_relation: "unknown" as const,
      pairwise_comparisons: PAIRS.map(([left, right]) => ({
        left_arm: left,
        right_arm: right,
        left_common_compliance: "unknown" as const,
        right_common_compliance: "unknown" as const,
        comparison_status: "incomplete_not_comparable" as const,
        compliance_asymmetry: false,
        behavioral_relation: "not_comparable" as const,
        bounded_outcome_relation: "not_comparable" as const,
        general_benefit_or_harm: "not_established" as const,
        rank_or_winner_created: false as const,
      })),
      universal_common_hard_failure_dimensions: [],
      clean_control_admission: {
        arm_a_invariant_hard_failures: null,
        arm_b_invariant_hard_failures: null,
        arm_c_invariant_hard_failures: null,
        arm_d_invariant_hard_failures: null,
        all_arms_common_compliance_valid: false,
        no_universal_hard_failure_dimension: false,
        protocol_validation_only: true as const,
        behavioral_evidence_created: false as const,
      },
      authority: authorityBoundaryV02(),
    });
  }
  const armEvaluations = ARMS.map((arm) =>
    evaluateOperationalReentryMatchedCohortArmV02(byArm.get(arm)!, rubric),
  );
  const evaluationsByArm = new Map(
    armEvaluations.map((evaluation) => [evaluation.arm, evaluation] as const),
  );
  const pairwiseComparisons = PAIRS.map(([left, right]) =>
    deriveOperationalReentryMatchedCohortPairwiseComparisonV02(
      evaluationsByArm.get(left)!,
      evaluationsByArm.get(right)!,
      byArm.get(left)!.normalized_output,
      byArm.get(right)!.normalized_output,
    ),
  );
  const e1Evaluation = buildE1EvaluationV02(byArm);
  const universalCommonHardFailures =
    rubric.target_invariant_compliance_dimensions
      .map((entry) => entry.dimension)
      .filter((dimension) =>
        armEvaluations.every((evaluation) =>
          evaluation.failed_common_hard_gates.includes(dimension),
        ),
      );
  const failureCount = (arm: OperationalReentryMatchedCohortArmV02) =>
    evaluationsByArm.get(arm)!.failed_common_hard_gates.length;
  return sealV02("clean_control_block_evaluation_without_integrity_fingerprint", {
    evaluator_version: OPERATIONAL_REENTRY_MATCHED_COHORT_EVALUATOR_VERSION_V02,
    repeat_block: block,
    status: "complete" as const,
    arm_evaluations: armEvaluations,
    e1_evaluation: e1Evaluation,
    conditioning_relation: e1Evaluation.conditioning_relation,
    reset_relation: e1Evaluation.reset_relation,
    pairwise_comparisons: pairwiseComparisons,
    universal_common_hard_failure_dimensions: universalCommonHardFailures,
    clean_control_admission: {
      arm_a_invariant_hard_failures: failureCount("A"),
      arm_b_invariant_hard_failures: failureCount("B"),
      arm_c_invariant_hard_failures: failureCount("C"),
      arm_d_invariant_hard_failures: failureCount("D"),
      all_arms_common_compliance_valid: armEvaluations.every(
        (evaluation) => evaluation.common_compliance === "valid",
      ),
      no_universal_hard_failure_dimension:
        universalCommonHardFailures.length === 0,
      protocol_validation_only: true as const,
      behavioral_evidence_created: false as const,
    },
    authority: authorityBoundaryV02(),
  });
}

export function buildOperationalReentryMatchedCohortHarnessReportV02(input: {
  blocks: OperationalReentryMatchedCohortBlockEvaluationV02[];
  case_input?: OperationalReentryMatchedCohortCaseV02;
  rubric?: OperationalReentryMatchedCohortRubricV02;
  call_plan?: OperationalReentryMatchedCohortCallPlanV02;
}): OperationalReentryMatchedCohortHarnessReportV02 {
  const caseInput =
    input.case_input ?? operationalReentryMatchedCohortCaseFixtureV02;
  const rubric = input.rubric ?? operationalReentryMatchedCohortRubricFixtureV02;
  const callPlan =
    input.call_plan ?? buildOperationalReentryMatchedCohortCallPlanV02(caseInput);
  assertCaseV02(caseInput);
  assertRubricV02(rubric);
  const evaluatedArms = input.blocks.flatMap(
    (block) => block.arm_evaluations,
  );
  const failureCounts = Object.fromEntries(
    rubric.target_invariant_compliance_dimensions.map(({ dimension }) => [
      dimension,
      evaluatedArms.filter((evaluation) =>
        evaluation.failed_common_hard_gates.includes(dimension),
      ).length,
    ]),
  ) as OperationalReentryMatchedCohortHarnessReportV02["target_invariant_compliance"]["failed_hard_gate_counts"];
  const universalHardFailures = Object.entries(failureCounts)
    .filter(
      ([, count]) => evaluatedArms.length > 0 && count === evaluatedArms.length,
    )
    .map(
      ([dimension]) =>
        dimension as OperationalReentryMatchedCohortCommonComplianceDimensionV02,
    );
  const complete =
    input.blocks.length === 4 &&
    new Set(input.blocks.map((block) => block.repeat_block)).size === 4 &&
    input.blocks.every((block) => block.status === "complete");
  const armFailures = (arm: OperationalReentryMatchedCohortArmV02) => {
    const evaluations = evaluatedArms.filter(
      (evaluation) => evaluation.arm === arm,
    );
    return evaluations.length === 0
      ? null
      : evaluations.reduce(
          (total, evaluation) =>
            total + evaluation.failed_common_hard_gates.length,
          0,
        );
  };
  return sealV02("clean_control_harness_report_without_integrity_fingerprint", {
    report_version: OPERATIONAL_REENTRY_MATCHED_COHORT_REPORT_VERSION_V02,
    report_kind: "zero_egress_protocol_validation" as const,
    completion_status: complete ? "complete" as const : "incomplete" as const,
    case_fingerprint: caseInput.integrity.fingerprint,
    rubric_fingerprint: rubric.integrity.fingerprint,
    call_plan_fingerprint: callPlan.integrity.fingerprint,
    common_task_evidence_fingerprint:
      rubric.common_task_evidence_fingerprint,
    target_invariant_compliance: {
      evaluated_arm_rows: evaluatedArms.length,
      all_evaluated_arms_valid:
        evaluatedArms.length > 0 &&
        evaluatedArms.every(
          (evaluation) => evaluation.common_compliance === "valid",
        ),
      failed_hard_gate_counts: failureCounts,
      universal_hard_failure_dimensions: universalHardFailures,
    },
    behavioral_intervention_effect: {
      evaluator_version: "operational_reentry_perturbation_evaluation.v0.1" as const,
      block_relations: input.blocks.map((block) => ({
        block: block.repeat_block,
        conditioning: block.conditioning_relation,
        reset: block.reset_relation,
      })),
      distinct_from_common_compliance: true as const,
    },
    bounded_outcome_quality: {
      declared_dimensions: rubric.bounded_outcome_dimensions.map(
        (entry) => entry.dimension,
      ),
      comparisons_run_only_after_common_compliance: true as const,
      general_benefit_or_harm: "not_established" as const,
      scalar_score_created: false as const,
      rank_or_winner_created: false as const,
    },
    clean_control_admission: {
      arm_a_hard_failures: armFailures("A"),
      arm_b_hard_failures: armFailures("B"),
      arm_c_hard_failures: armFailures("C"),
      arm_d_hard_failures: armFailures("D"),
      no_universal_hard_failure_dimension: universalHardFailures.length === 0,
      protocol_validation_only: true as const,
      behavioral_evidence_created: false as const,
    },
    future_provider_boundary: {
      issue_193_accepted_all_shapes_establishes_v02_compatibility: false as const,
      separately_authorized_v02_compatibility_probe_required: true as const,
      v02_compatibility_probe_authorized: false as const,
      v02_live_cohort_authorized: false as const,
      v01_replication_authorized: false as const,
    },
    authority: {
      real_provider_calls: 0 as const,
      product_database_writes: 0 as const,
      core_writes: 0 as const,
      policy_authorized: false as const,
      stage_7_authorized: false as const,
      ready_merge_or_auto_merge_authorized: false as const,
    },
  });
}

function buildE1EvaluationV02(
  byArm: Map<
    OperationalReentryMatchedCohortArmV02,
    OperationalReentryMatchedCohortObservedArmV02
  >,
) {
  const sourceFixture = buildOperationalReentryPerturbationFixtureV01();
  const stickyFixture = buildOperationalReentryPerturbationFixtureV01({
    reset: "sticky_stale",
  });
  const byRole = new Map(sourceFixture.arms.map((arm) => [arm.role, arm]));
  const output = (arm: OperationalReentryMatchedCohortArmV02) =>
    byArm.get(arm)!.normalized_output;
  const exact = rebuildE1ArmV02(
    byRole.get("exact_reentry")!,
    downstreamFromOutputV02(output("A"), sourceFixture.source),
  );
  const ablation = rebuildE1ArmV02(
    byRole.get("matched_single_item_ablation")!,
    downstreamFromOutputV02(output("B"), sourceFixture.source),
  );
  const cOutput = output("C");
  const cPersists =
    cOutput.referenced_continuation_tokens.includes(
      ACGC_E2_V02_TARGET_CONTEXT_TOKEN,
    ) ||
    cOutput.operation_action_class_tokens.includes(
      "target_linked_verification_preparation",
    ) ||
    cOutput.result_limitation_tokens.includes(
      "limitation_stale_target_persisted",
    );
  const staleTemplate = cPersists
    ? stickyFixture.arms.find(
        (arm) => arm.role === "stale_or_regime_shift_reset",
      )!
    : byRole.get("stale_or_regime_shift_reset")!;
  const stale = rebuildE1ArmV02(
    staleTemplate,
    downstreamFromOutputV02(cOutput, sourceFixture.source),
  );
  const baseline = rebuildE1ArmV02(
    byRole.get("existing_one_run_baseline")!,
    downstreamFromOutputV02(output("D"), sourceFixture.source),
  );
  const evaluation = buildOperationalReentryEvaluationV01({
    source: sourceFixture.source,
    arms: [exact, ablation, stale, baseline],
    limitations: [
      "The v0.2 harness wraps unchanged E1 deterministic conditioning/reset mechanics.",
      "Common task compliance is evaluated separately from continuation-sensitive behavior.",
      "Protocol validation creates no provider compatibility or behavioral evidence.",
    ],
    missing_evidence: [
      "empirical_general_benefit",
      "exact_item_outcome_relation",
      "exact_item_support_relation",
      "causal_contribution",
    ],
  });
  if (validateOperationalReentryEvaluationV01(evaluation).status !== "valid") {
    failV02("clean_control_e1_evaluation_invalid");
  }
  return evaluation;
}

function rebuildE1ArmV02(
  template: OperationalReentryArmV01,
  downstream: OperationalReentryDownstreamVectorV01,
) {
  const {
    arm_version: _armVersion,
    arm_id: _armId,
    post_cutoff_material_present: _postCutoff,
    provider_calls: _providerCalls,
    model_calls: _modelCalls,
    network_calls: _networkCalls,
    product_admission_used: _admission,
    product_state_mutated: _mutation,
    integrity: _integrity,
    ...base
  } = template;
  return buildOperationalReentryArmV01({
    ...structuredClone(base),
    downstream,
  } satisfies BuildOperationalReentryArmInputV01);
}

function downstreamFromOutputV02(
  output: OperationalReentryMatchedCohortModelOutputV02,
  source: ReturnType<
    typeof buildOperationalReentryPerturbationFixtureV01
  >["source"],
): OperationalReentryDownstreamVectorV01 {
  return {
    referenced_source_ids: output.referenced_continuation_tokens.flatMap(
      (token) =>
        token === ACGC_E2_V02_TARGET_CONTEXT_TOKEN
          ? [source.target.packet_entry_id, source.target.candidate.record_id]
          : [`e2-context:${token}`],
    ),
    required_check_dispositions: [
      {
        check_id: "verify-portable-output",
        disposition: output.required_check.disposition,
      },
    ],
    operation_action_classes: [...output.operation_action_class_tokens],
    blocker_warning_gap_classes: [],
    changed_artifacts: [],
    result_limitations: [...output.result_limitation_tokens],
    response_status: output.abstention
      ? "abstained"
      : output.target_disposition === "withheld_stale"
        ? "withheld"
        : output.result_status === "review_blocked"
          ? "refused"
          : "continued",
  };
}

function behavioralProjectionV02(
  output: OperationalReentryMatchedCohortModelOutputV02,
) {
  return {
    referenced_continuation_tokens: output.referenced_continuation_tokens,
    target_disposition: output.target_disposition,
    target_linked_action_present: output.operation_action_class_tokens.includes(
      "target_linked_verification_preparation",
    ),
    stale_target_persistence_limitation_present:
      output.result_limitation_tokens.includes(
        "limitation_stale_target_persisted",
      ),
  };
}

function complianceDimensionV02(
  dimension: OperationalReentryMatchedCohortCommonComplianceDimensionV02,
  passed: boolean,
  basisToken: string,
): OperationalReentryMatchedCohortCommonComplianceResultV02 {
  return {
    dimension,
    result: passed ? "pass" : "fail",
    hard_gate: true,
    basis_token: basisToken,
  };
}

function authorityBoundaryV02() {
  return {
    real_provider_calls: 0 as const,
    provider_compatibility_established: false as const,
    live_cohort_authorized: false as const,
    replication_authorized: false as const,
    policy_authorized: false as const,
    stage_7_authorized: false as const,
  };
}

function assertCaseV02(value: OperationalReentryMatchedCohortCaseV02): void {
  if (
    value.case_version !== "operational_reentry_matched_cohort_case.v0.2" ||
    value.source_material !== "synthetic_public_safe" ||
    value.real_user_or_project_data_included !== false ||
    value.integrity.fingerprint !==
      fingerprintV02(stripIntegrityV02(value))
  ) {
    failV02("clean_control_case_invalid");
  }
}

function assertRubricV02(
  value: OperationalReentryMatchedCohortRubricV02,
): void {
  if (
    value.rubric_version !== "operational_reentry_matched_cohort_rubric.v0.2" ||
    value.evaluator_version !==
      OPERATIONAL_REENTRY_MATCHED_COHORT_EVALUATOR_VERSION_V02 ||
    value.provider_visible !== false ||
    value.model_as_judge_calls !== 0 ||
    value.integrity.fingerprint !== fingerprintV02(stripIntegrityV02(value))
  ) {
    failV02("clean_control_rubric_invalid");
  }
}

function stripIntegrityV02<T extends { integrity: unknown }>(value: T) {
  const { integrity: _integrity, ...withoutIntegrity } = value;
  return withoutIntegrity;
}

function fingerprintV02(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value));
}

function sealV02<T extends object>(
  scope: string,
  value: T,
): T & { integrity: OperationalReentryMatchedCohortIntegrityV02 } {
  return {
    ...structuredClone(value),
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: scope,
      fingerprint: fingerprintV02(value),
    },
  };
}

function failV02(code: string): never {
  throw new OperationalReentryMatchedCohortErrorV02(code);
}
