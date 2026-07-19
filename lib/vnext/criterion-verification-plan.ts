import { deriveCriterionIdentityV01 } from "@/lib/vnext/criterion-identity";
import {
  canonicalizeProtocolValueV01,
  compareProtocolCanonicalV01,
  createProtocolSha256V01,
  normalizeProtocolTextV01,
  uniqueProtocolStringsV01,
} from "@/lib/vnext/protocol-primitives";
import {
  CRITERION_VERIFICATION_EVALUATOR_VERSION_V01,
  CRITERION_VERIFICATION_PLAN_VERSION_V01,
  CRITERION_VERIFICATION_PROFILE_VERSION_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_OPERATION_PROFILE_V01,
  type CriterionVerificationPlanEntryV01,
  type CriterionVerificationPlanV01,
} from "@/types/vnext/criterion-verification-plan";

const CRITERION_VERIFICATION_OBLIGATION_ID_VERSION_V01 =
  "criterion_verification_obligation_identity.v0.1" as const;

export function deriveCriterionVerificationObligationIdV01(input: {
  criterion_id: string;
  check_id: string;
}): string {
  return `criterion-obligation:${createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      identity_version: CRITERION_VERIFICATION_OBLIGATION_ID_VERSION_V01,
      criterion_id: normalizeProtocolTextV01(input.criterion_id),
      check_id: normalizeProtocolTextV01(input.check_id),
    }),
  )}`;
}

export function normalizeCriterionVerificationPlanV01(
  input: CriterionVerificationPlanV01,
): CriterionVerificationPlanV01 {
  return {
    plan_version: CRITERION_VERIFICATION_PLAN_VERSION_V01,
    profile_version: CRITERION_VERIFICATION_PROFILE_VERSION_V01,
    evaluator_version: CRITERION_VERIFICATION_EVALUATOR_VERSION_V01,
    operation_profile: LOCAL_PROJECT_ROOT_VERIFICATION_OPERATION_PROFILE_V01,
    workspace_id: normalizeProtocolTextV01(input.workspace_id),
    project_id: normalizeProtocolTextV01(input.project_id),
    criteria: input.criteria
      .map(normalizeCriterionVerificationPlanEntryV01)
      .sort(compareProtocolCanonicalV01),
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
  };
}

function normalizeCriterionVerificationPlanEntryV01(
  input: CriterionVerificationPlanEntryV01,
): CriterionVerificationPlanEntryV01 {
  const criterion = normalizeProtocolTextV01(input.criterion);
  const criterionId = deriveCriterionIdentityV01(criterion);
  return {
    criterion_id: criterionId,
    criterion,
    applicability: {
      rule: "constant",
      value: input.applicability.value,
    },
    aggregation: "all",
    required_basis: input.required_basis,
    admitted_trust_classes: uniqueProtocolStringsV01(
      input.admitted_trust_classes,
    ) as CriterionVerificationPlanEntryV01["admitted_trust_classes"],
    obligations: input.obligations
      .map((obligation) => {
        const checkId = normalizeProtocolTextV01(obligation.check_id);
        return {
          obligation_id: deriveCriterionVerificationObligationIdV01({
            criterion_id: criterionId,
            check_id: checkId,
          }),
          check_id: checkId,
          expected_status: "passed" as const,
        };
      })
      .sort(compareProtocolCanonicalV01),
    missing_policy: "unknown",
    failed_policy: "unsatisfied",
    conflict_policy: "unknown",
  };
}
