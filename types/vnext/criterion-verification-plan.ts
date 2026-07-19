import type { ExternalRefTrustClassV01 } from "./external-ref";

export const CRITERION_VERIFICATION_PLAN_VERSION_V01 =
  "criterion_verification_plan.v0.1" as const;
export const CRITERION_VERIFICATION_PROFILE_VERSION_V01 =
  "exact_check.v0.1" as const;
export const CRITERION_VERIFICATION_EVALUATOR_VERSION_V01 =
  "criterion_exact_check_evaluator.v0.1" as const;
export const LOCAL_PROJECT_ROOT_VERIFICATION_OPERATION_PROFILE_V01 =
  "local_project_root_verification.v0.1" as const;

export const CRITERION_VERIFICATION_MAX_CRITERIA_V01 = 64 as const;
export const CRITERION_VERIFICATION_MAX_OBLIGATIONS_PER_CRITERION_V01 =
  16 as const;
export const CRITERION_VERIFICATION_MAX_TEXT_CHARACTERS_V01 = 2_000 as const;

export const CRITERION_VERIFICATION_CONCLUSIVE_TRUST_CLASSES_V01 = [
  "direct_local_observation",
  "verified_external_observation",
  "host_attestation",
] as const satisfies readonly ExternalRefTrustClassV01[];

export type CriterionVerificationConclusiveTrustClassV01 =
  (typeof CRITERION_VERIFICATION_CONCLUSIVE_TRUST_CLASSES_V01)[number];

export type CriterionVerificationRequiredBasisV01 =
  | "observed"
  | "attested"
  | "observed_or_attested";

export interface CriterionVerificationExactCheckObligationV01 {
  obligation_id: string;
  check_id: string;
  expected_status: "passed";
}

export interface CriterionVerificationPlanEntryV01 {
  criterion_id: string;
  criterion: string;
  applicability: {
    rule: "constant";
    value: "applicable" | "not_applicable";
  };
  aggregation: "all";
  required_basis: CriterionVerificationRequiredBasisV01;
  admitted_trust_classes: CriterionVerificationConclusiveTrustClassV01[];
  obligations: CriterionVerificationExactCheckObligationV01[];
  missing_policy: "unknown";
  failed_policy: "unsatisfied";
  conflict_policy: "unknown";
}

export interface CriterionVerificationPlanAuthorityV01 {
  server_owned_profile: true;
  grants_execution_authority: false;
  grants_external_side_effect_authority: false;
  creates_evidence: false;
  validates_claims: false;
  creates_proposal: false;
  creates_decision: false;
  applies_transition: false;
  changes_semantic_state: false;
  changes_later_context: false;
}

export interface CriterionVerificationPlanV01 {
  plan_version: typeof CRITERION_VERIFICATION_PLAN_VERSION_V01;
  profile_version: typeof CRITERION_VERIFICATION_PROFILE_VERSION_V01;
  evaluator_version: typeof CRITERION_VERIFICATION_EVALUATOR_VERSION_V01;
  operation_profile: typeof LOCAL_PROJECT_ROOT_VERIFICATION_OPERATION_PROFILE_V01;
  workspace_id: string;
  project_id: string;
  criteria: CriterionVerificationPlanEntryV01[];
  authority: CriterionVerificationPlanAuthorityV01;
}

export const LOCAL_PROJECT_ROOT_CRITERION_CHECK_BINDINGS_V01 = [
  {
    criterion:
      "The exact admitted project-root identity was revalidated at adapter execution time.",
    check_ids: ["project_root_scope_verified"],
  },
  {
    criterion:
      "Manifest enumeration completed within the exact configured entry bound.",
    check_ids: ["project_root_manifest_bound"],
  },
  {
    criterion: "One canonical top-level manifest fingerprint was produced.",
    check_ids: ["project_root_manifest_verified"],
  },
  {
    criterion:
      "No command, file mutation, network, provider, model, credential, or external action occurred.",
    check_ids: [
      "project_file_mutation_absent",
      "provider_model_network_absent",
    ],
  },
] as const;

export const LOCAL_PROJECT_ROOT_VERIFICATION_ADMITTED_CHECK_IDS_V01 = [
  "project_file_mutation_absent",
  "project_root_manifest_bound",
  "project_root_manifest_verified",
  "project_root_scope_verified",
  "provider_model_network_absent",
] as const;
