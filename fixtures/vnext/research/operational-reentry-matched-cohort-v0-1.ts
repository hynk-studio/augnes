import { buildOperationalReentryPerturbationFixtureV01 } from "@/fixtures/vnext/research/operational-reentry-perturbation-v0-1";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_CASE_VERSION_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_RUBRIC_VERSION_V01,
  type OperationalReentryMatchedCohortCaseV01,
  type OperationalReentryMatchedCohortIntegrityV01,
  type OperationalReentryMatchedCohortRubricV01,
} from "@/types/vnext/operational-reentry-matched-cohort";

export const ACGC_E2_TARGET_CONTEXT_TOKEN_V01 = "ctx_target_reentry_7e31" as const;
export const ACGC_E2_NON_TARGET_CONTEXT_TOKENS_V01 = Object.freeze([
  "ctx_receipt_public_safe_35b0",
  "ctx_proposal_non_authoritative_a614",
  "ctx_decision_pending_8d22",
] as const);

const source = buildOperationalReentryPerturbationFixtureV01().source;

const outputTokens = {
  result_tokens: ["result_review_ready", "result_review_blocked"],
  referenced_context_tokens: [
    ...ACGC_E2_NON_TARGET_CONTEXT_TOKENS_V01,
    ACGC_E2_TARGET_CONTEXT_TOKEN_V01,
  ],
  required_check_disposition_tokens: [
    "verify_portable_output:passed",
    "verify_portable_output:failed",
    "verify_portable_output:blocked",
    "verify_portable_output:unknown",
  ],
  operation_action_class_tokens: [
    "bounded_result_review",
    "no_external_action",
    "target_linked_verification_preparation",
  ],
  blocker_warning_gap_tokens: [
    "gap_decision_pending",
    "gap_support_unknown",
    "gap_target_stale",
  ],
  result_limitation_tokens: [
    "limitation_non_authoritative",
    "limitation_target_not_available",
    "limitation_stale_target_withheld",
    "limitation_stale_target_persisted",
  ],
  target_dispositions: [
    "not_available",
    "not_referenced",
    "reference_only",
    "applied_to_structure",
    "withheld_stale",
    "stale_persisted",
    "uncertain",
  ],
} satisfies OperationalReentryMatchedCohortCaseV01["actor_visible"]["output_tokens"];

const caseWithoutIntegrity = {
  case_version: OPERATIONAL_REENTRY_MATCHED_COHORT_CASE_VERSION_V01,
  case_id: "operational-reentry-matched-case:e1-public-safe-01",
  source_ref: {
    source_id: source.source_id,
    source_fingerprint: source.integrity.fingerprint,
  },
  target_ref: {
    target_entry_id: source.target.packet_entry_id,
    target_candidate_id: source.target.candidate.record_id,
  },
  actor_visible: {
    task: {
      goal_token: "goal_review_bounded_semantic_result_chain",
      success_criterion_tokens: [
        "criterion_keep_receipt_proposal_decision_relations_isolated",
        "criterion_report_portable_output_check",
      ],
      non_goal_tokens: [
        "non_goal_no_state_transition",
        "non_goal_no_external_publication",
      ],
      required_check_tokens: ["verify_portable_output"],
      forbidden_action_tokens: ["publish_external_without_authority"],
      task_family_token: "task_family_semantic_review_equal_budget_stage5",
    },
    non_target_context: [
      {
        context_token: ACGC_E2_NON_TARGET_CONTEXT_TOKENS_V01[0],
        material_token: "material_receipt_present_and_project_isolated",
      },
      {
        context_token: ACGC_E2_NON_TARGET_CONTEXT_TOKENS_V01[1],
        material_token: "material_proposal_is_non_authoritative",
      },
      {
        context_token: ACGC_E2_NON_TARGET_CONTEXT_TOKENS_V01[2],
        material_token: "material_explicit_decision_remains_pending",
      },
    ],
    target_context: {
      context_token: ACGC_E2_TARGET_CONTEXT_TOKEN_V01,
      material_token: "material_target_prepare_portable_output_verification_only",
    },
    stale_relation: {
      relation_token: "relation_target_regime_inapplicable_before_outcome",
      target_context_token: ACGC_E2_TARGET_CONTEXT_TOKEN_V01,
      source_ref:
        "sha256:ca64e69fd744ae6dc4555c91666daedbc03aed76f1c69e4954540849e9ae0f4a",
      reason_observed_at: "2026-07-18T15:30:00.000Z",
      regime_key:
        "synthetic-regime:verification-preparation-no-longer-applicable",
      applies_before_outcome: true as const,
    },
    output_tokens: outputTokens,
  },
  source_material: "synthetic_public_safe" as const,
  real_user_or_project_data_included: false as const,
};

export const operationalReentryMatchedCohortCaseFixtureV01 = Object.freeze({
  ...caseWithoutIntegrity,
  integrity: integrityV01("case_without_integrity_fingerprint", caseWithoutIntegrity),
}) satisfies OperationalReentryMatchedCohortCaseV01;

const rubricWithoutIntegrity = {
  rubric_version: OPERATIONAL_REENTRY_MATCHED_COHORT_RUBRIC_VERSION_V01,
  rubric_id: "operational-reentry-matched-rubric:e1-public-safe-01",
  evaluator_only: true as const,
  model_as_judge_calls: 0 as const,
  dimensions: [
    { dimension: "result_correctness", hard_failure: false },
    { dimension: "required_check_disposition", hard_failure: true },
    { dimension: "forbidden_action_integrity", hard_failure: true },
    { dimension: "source_support_alignment", hard_failure: true },
    { dimension: "appropriate_abstention", hard_failure: false },
  ] satisfies OperationalReentryMatchedCohortRubricV01["dimensions"],
  expected_result_token: "result_review_ready",
  expected_check_disposition_token: "verify_portable_output:passed",
  required_action_token: "bounded_result_review",
  target_context_token: ACGC_E2_TARGET_CONTEXT_TOKEN_V01,
  target_linked_action_tokens: ["target_linked_verification_preparation"],
  target_linked_limitation_tokens: [
    "limitation_stale_target_withheld",
    "limitation_stale_target_persisted",
  ],
  aggregate_rules: {
    repeat_count: 4 as const,
    predominant_count: 3 as const,
    bounded_positive_min_better: 3 as const,
    bounded_positive_min_structured_delta: 3 as const,
  },
  provider_visible: false as const,
};

export const operationalReentryMatchedCohortRubricFixtureV01 = Object.freeze({
  ...rubricWithoutIntegrity,
  integrity: integrityV01(
    "rubric_without_integrity_fingerprint",
    rubricWithoutIntegrity,
  ),
}) satisfies OperationalReentryMatchedCohortRubricV01;

function integrityV01(
  scope: string,
  value: unknown,
): OperationalReentryMatchedCohortIntegrityV01 {
  return {
    algorithm: "sha256",
    canonicalization: "augnes-json-c14n-v0_1",
    fingerprint_scope: scope,
    fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(value)),
  };
}
