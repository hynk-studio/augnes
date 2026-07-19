import {
  LOCAL_PROJECT_ROOT_VERIFICATION_WORK_PROFILE_V01,
  type VNextAutomationWorkSourceV01,
} from "@/types/vnext/automation-work-item";
import { deriveCriterionIdentityV01 } from "@/lib/vnext/criterion-identity";
import {
  deriveCriterionVerificationObligationIdV01,
  normalizeCriterionVerificationPlanV01,
} from "@/lib/vnext/criterion-verification-plan";
import {
  CRITERION_VERIFICATION_EVALUATOR_VERSION_V01,
  CRITERION_VERIFICATION_PLAN_VERSION_V01,
  CRITERION_VERIFICATION_PROFILE_VERSION_V01,
  LOCAL_PROJECT_ROOT_CRITERION_CHECK_BINDINGS_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_ADMITTED_CHECK_IDS_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_OPERATION_PROFILE_V01,
  type CriterionVerificationPlanV01,
} from "@/types/vnext/criterion-verification-plan";

export { LOCAL_PROJECT_ROOT_VERIFICATION_WORK_PROFILE_V01 };

export const LOCAL_PROJECT_ROOT_VERIFICATION_TITLE_V01 =
  "Bounded project-root verification" as const;

export const LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01 = {
  goal:
    "Verify the exact current project root and produce one bounded canonical top-level manifest fingerprint.",
  success_criteria: LOCAL_PROJECT_ROOT_CRITERION_CHECK_BINDINGS_V01.map(
    (binding) => binding.criterion,
  ),
  non_goals: [
    "Do not execute the source packet task.",
    "Do not execute repository commands or mutate project files.",
    "Do not use network, provider, model, credential, or external-action authority.",
  ],
} as const satisfies VNextAutomationWorkSourceV01["task"];

export const LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01 = [
  ...LOCAL_PROJECT_ROOT_VERIFICATION_ADMITTED_CHECK_IDS_V01,
] as const;

export const LOCAL_PROJECT_ROOT_VERIFICATION_EXPECTED_OUTPUTS_V01 = [
  "project_root_manifest_fingerprint",
] as const;

/**
 * The only SR-1 production criterion/check registry. The packet compiler calls
 * this before execution; the evaluator never reconstructs relations from
 * criterion prose, check names, completion, or model output.
 */
export function createLocalProjectRootCriterionVerificationPlanV01(input: {
  workspace_id: string;
  project_id: string;
}): CriterionVerificationPlanV01 {
  return normalizeCriterionVerificationPlanV01({
    plan_version: CRITERION_VERIFICATION_PLAN_VERSION_V01,
    profile_version: CRITERION_VERIFICATION_PROFILE_VERSION_V01,
    evaluator_version: CRITERION_VERIFICATION_EVALUATOR_VERSION_V01,
    operation_profile: LOCAL_PROJECT_ROOT_VERIFICATION_OPERATION_PROFILE_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    criteria: LOCAL_PROJECT_ROOT_CRITERION_CHECK_BINDINGS_V01.map((binding) => {
      const criterionId = deriveCriterionIdentityV01(binding.criterion);
      return {
        criterion_id: criterionId,
        criterion: binding.criterion,
        applicability: { rule: "constant", value: "applicable" },
        aggregation: "all",
        required_basis: "observed_or_attested",
        admitted_trust_classes: [
          "direct_local_observation",
          "verified_external_observation",
          "host_attestation",
        ],
        obligations: binding.check_ids.map((checkId) => ({
          obligation_id: deriveCriterionVerificationObligationIdV01({
            criterion_id: criterionId,
            check_id: checkId,
          }),
          check_id: checkId,
          expected_status: "passed",
        })),
        missing_policy: "unknown",
        failed_policy: "unsatisfied",
        conflict_policy: "unknown",
      };
    }),
    authority: {
      server_owned_profile: true,
      grants_execution_authority: false,
      grants_external_side_effect_authority: false,
      creates_evidence: false,
      validates_claims: false,
      creates_proposal: false,
      creates_decision: false,
      applies_transition: false,
      changes_semantic_state: false,
      changes_later_context: false,
    },
  });
}
