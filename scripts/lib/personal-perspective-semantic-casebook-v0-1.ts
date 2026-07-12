import {
  canonicalizeProtocolValueV01,
  compareProtocolCanonicalV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
  isProtocolRecordV01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";

export const PERSONAL_PERSPECTIVE_CASEBOOK_VERSION_V01 =
  "personal_perspective_semantic_casebook.v0.1" as const;
export const PERSONAL_PERSPECTIVE_SEMANTIC_DEFINITION_VERSION_V01 =
  "personal_perspective_semantics.v0.1" as const;
export const PERSONAL_PERSPECTIVE_CASEBOOK_METHOD_VERSION_V01 =
  "personal_perspective_casebook_deterministic_method.v0.1" as const;
export const PERSONAL_PERSPECTIVE_CASEBOOK_DEFINED_AT_V01 =
  "2026-07-13T00:00:00.000Z" as const;
export const PERSONAL_PERSPECTIVE_DELETION_SOURCE_SUMMARY_V01 =
  "A fictional deletion instruction requires non-reuse of one abstract synthetic item; no deleted proposition is retained." as const;
export const PERSONAL_PERSPECTIVE_DELETION_SOURCE_KEY_V01 =
  "deletion-alpha" as const;
export const PERSONAL_PERSPECTIVE_DELETION_SOURCE_SCOPE_QUALIFIER_V01 =
  "fictional-workspace-concept" as const;
export const PERSONAL_PERSPECTIVE_TOMBSTONE_CASE_KEY_V01 =
  "deleted-item-tombstone" as const;
export const PERSONAL_PERSPECTIVE_TOMBSTONE_SCOPE_QUALIFIER_V01 =
  "fictional-deletion-scope" as const;
export const PERSONAL_PERSPECTIVE_TOMBSTONE_TITLE_V01 =
  "Synthetic deleted item tombstone" as const;
export const PERSONAL_PERSPECTIVE_TOMBSTONE_SUMMARY_V01 =
  "The fictional tombstone retains only minimal deletion identity and non-reuse meaning." as const;
export const PERSONAL_PERSPECTIVE_TOMBSTONE_RATIONALE_V01 =
  "Deletion semantics preserve no reusable proposition, automatic revival, rehydration, or context selection." as const;
export const PERSONAL_PERSPECTIVE_TOMBSTONE_LIMITATION_V01 =
  "This fictional tombstone does not claim deletion enforcement for real data." as const;
export const PERSONAL_PERSPECTIVE_TOMBSTONE_REF_V01 =
  "synthetic-deletion-tombstone:item-alpha" as const;
export const PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_CASE_KEY_V01 =
  "deleted-item-reuse-refusal" as const;
export const PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_TITLE_V01 =
  "Synthetic deleted item reuse refusal" as const;
export const PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_SUMMARY_V01 =
  "The fictional deleted item cannot be rehydrated, inferred, selected, or reused." as const;
export const PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_RATIONALE_V01 =
  "The fictional input is represented only as refusal or correction material and is not normalized into a candidate." as const;
export const PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_LIMITATION_V01 =
  "This refusal demonstrates deterministic semantics only and records no completed user decision." as const;
export const PERSONAL_PERSPECTIVE_NOT_APPLICABLE_JUSTIFICATION_V01 =
  "This member records a bounded observation, refusal, or tombstone for which a disposition counterexample is not meaningful." as const;
export const PERSONAL_PERSPECTIVE_DELETION_REVIEW_ACTIONS_V01 = [
  "control_task_context_inclusion",
  "inspect_source_and_revision_lineage",
] as const;
export const PERSONAL_PERSPECTIVE_NON_AUTHORITY_SUMMARY_V01 =
  "Synthetic Lab material only; it grants no identity, truth, persistence, context, sharing, decision, transition, Evidence, memory, publication, or merge authority." as const;
export const PERSONAL_PERSPECTIVE_SOURCE_FINGERPRINT_SCOPE_V01 =
  "all normalized source fields except integrity.fingerprint" as const;
export const PERSONAL_PERSPECTIVE_CASE_FINGERPRINT_SCOPE_V01 =
  "all normalized case fields except integrity.fingerprint" as const;
export const PERSONAL_PERSPECTIVE_CASEBOOK_FINGERPRINT_SCOPE_V01 =
  "versions, classification, normalized Lab metadata, semantic definitions, source catalog, cases, coverage, privacy, retention, and aggregate authority except integrity.fingerprint" as const;

export const PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01 = {
  title_characters: 96,
  summary_or_proposition_characters: 512,
  rationale_characters: 768,
  scope_qualifier_characters: 320,
  source_summary_characters: 320,
  counterexample_summary_characters: 320,
  limitation_characters: 320,
  list_item_characters: 121,
  scope_qualifiers: 8,
  limitations: 8,
  source_relations: 16,
  case_relations: 16,
  counterexample_refs: 16,
  future_review_actions: 12,
  experiment_list_items: 5,
  coverage_entries: 25,
  cases: 64,
  sources: 128,
  validation_issues: 128,
} as const;

export const PERSONAL_PERSPECTIVE_SEMANTIC_KINDS_V01 = [
  "descriptive_self_understanding",
  "aspirational_identity",
  "stable_value_or_commitment",
  "decision_principle",
  "contextual_role",
  "recurring_disposition_candidate",
  "behavior_observation",
  "behavioral_pattern_interpretation",
  "world_model_candidate",
  "relationship_model_candidate",
  "persistent_tension",
  "contested_interpretation",
  "known_exception",
  "scope_narrowing",
  "revision_candidate",
  "deletion_tombstone",
  "refusal_material",
] as const;

export const PERSONAL_PERSPECTIVE_EPISTEMIC_ORIGINS_V01 = [
  "explicit_synthetic_user_declaration",
  "jointly_interpreted_synthetic_candidate",
  "model_inferred_synthetic_candidate",
  "observed_synthetic_behavior",
  "derived_interpretation",
] as const;

export const PERSONAL_PERSPECTIVE_SCOPE_KINDS_V01 = [
  "workspace_conceptual",
  "project_specific",
  "role_specific",
  "relationship_specific",
  "task_specific",
  "situational",
  "time_bounded",
  "exception",
] as const;

export const PERSONAL_PERSPECTIVE_SOURCE_KINDS_V01 = [
  "synthetic_user_declaration",
  "synthetic_behavior_observation",
  "synthetic_joint_interpretation",
  "synthetic_model_inference",
  "synthetic_contextual_fact",
  "synthetic_counterexample",
  "synthetic_scope_constraint",
  "synthetic_retraction_instruction",
  "synthetic_deletion_instruction",
  "synthetic_false_premise",
] as const;

export const PERSONAL_PERSPECTIVE_SOURCE_RELATIONS_V01 = [
  "supports",
  "contextualizes",
  "derived_from",
  "observes",
  "counterexample",
  "constrains_scope",
] as const;

export const PERSONAL_PERSPECTIVE_CASE_RELATIONS_V01 = [
  "narrows",
  "exception_to",
  "contests",
  "revises",
  "counterexample_to",
  "interprets",
] as const;

export const PERSONAL_PERSPECTIVE_COUNTEREXAMPLE_STATUSES_V01 = [
  "known_present",
  "none_found",
  "not_searched",
  "not_applicable",
] as const;

export const PERSONAL_PERSPECTIVE_CANDIDATE_STATUSES_V01 = [
  "candidate",
  "contested",
  "stale",
  "retracted",
  "deleted",
] as const;

export const PERSONAL_PERSPECTIVE_REFUSAL_KINDS_V01 = [
  "false_premise",
  "over_globalization",
  "deleted_item_reuse",
  "retracted_item_reuse",
  "insufficient_source",
  "scope_conflict",
  "task_choice_globalization",
] as const;

export const PERSONAL_PERSPECTIVE_FUTURE_REVIEW_ACTIONS_V01 = [
  "endorse",
  "correct",
  "narrow_scope",
  "add_exception",
  "add_counterexample",
  "defer",
  "reject",
  "retract",
  "delete",
  "inspect_source_and_revision_lineage",
  "control_project_sharing",
  "control_task_context_inclusion",
] as const;

export const PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_V01 = [
  "P01_descriptive_self_understanding",
  "P02_aspirational_identity",
  "P03_stable_value_or_commitment",
  "P04_decision_principle",
  "P05_jointly_interpreted_candidate",
  "P06_model_inferred_candidate",
  "P07_observed_behavior_separated_from_interpretation",
  "P08_world_model_candidate",
  "P09_contextual_role",
  "P10_relationship_specific_candidate",
  "P11_persistent_tension",
  "P12_project_specific_scope_narrowing",
  "P13_known_exception",
  "P14_known_present_counterexample",
  "P15_none_found_counterexample",
  "P16_not_searched_counterexample",
  "P17_valid_not_applicable_counterexample",
  "P18_contested_interpretation",
  "P19_stale_candidate",
  "P20_retracted_candidate",
  "P21_deleted_item_tombstone",
  "P22_false_premise_refusal",
  "P23_over_globalization_correction",
  "P24_task_choice_observation_only",
  "P25_counterexample_driven_revision_candidate",
] as const;

export const PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_CASE_KEYS_V01: Record<
  ValueOf<typeof PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_V01>,
  readonly string[]
> = {
  P01_descriptive_self_understanding: ["descriptive-self-understanding"],
  P02_aspirational_identity: ["aspirational-identity"],
  P03_stable_value_or_commitment: [
    "commitment-completeness",
    "persistent-tension",
  ],
  P04_decision_principle: ["decision-principle-reversibility"],
  P05_jointly_interpreted_candidate: ["jointly-interpreted-candidate"],
  P06_model_inferred_candidate: ["model-inferred-candidate"],
  P07_observed_behavior_separated_from_interpretation: [
    "task-choice-observation",
    "behavior-pattern-interpretation",
  ],
  P08_world_model_candidate: ["world-model-candidate"],
  P09_contextual_role: ["contextual-role"],
  P10_relationship_specific_candidate: ["relationship-specific-candidate"],
  P11_persistent_tension: ["persistent-tension"],
  P12_project_specific_scope_narrowing: ["project-scope-narrowing"],
  P13_known_exception: ["known-exception"],
  P14_known_present_counterexample: ["known-present-counterexample"],
  P15_none_found_counterexample: ["world-model-candidate"],
  P16_not_searched_counterexample: ["counterexample-not-searched"],
  P17_valid_not_applicable_counterexample: ["task-choice-observation"],
  P18_contested_interpretation: ["contested-interpretation"],
  P19_stale_candidate: ["stale-candidate"],
  P20_retracted_candidate: ["retracted-candidate"],
  P21_deleted_item_tombstone: ["deleted-item-tombstone"],
  P22_false_premise_refusal: ["false-premise-refusal"],
  P23_over_globalization_correction: [
    "over-globalization-refusal",
    "project-scope-narrowing",
  ],
  P24_task_choice_observation_only: [
    "task-choice-observation",
    "task-choice-globalization-refusal",
  ],
  P25_counterexample_driven_revision_candidate: [
    "counterexample-driven-revision",
  ],
};

export const PERSONAL_PERSPECTIVE_AUTHORITY_FLAGS_V01 = [
  "actual_user_identity_established",
  "personality_truth_assigned",
  "user_endorsement_recorded",
  "accepted_personal_perspective_created",
  "personal_perspective_persisted",
  "personal_vault_implemented",
  "review_decision_created",
  "semantic_transition_applied",
  "evidence_created",
  "accepted_memory_created",
  "task_context_inclusion_authorized",
  "hidden_context_injection_performed",
  "cross_project_sharing_authorized",
  "provider_or_model_called",
  "external_actuation_authorized",
  "work_closed",
  "publication_authorized",
  "github_merge_authorized",
  "m3_pilot_executed",
  "m3_completion_established",
  "reviewed_reuse_established",
  "outcome_improvement_established",
  "candidate_is_review_decision",
  "candidate_is_semantic_transition",
  "candidate_is_evidence",
  "candidate_is_accepted_memory",
  "candidate_is_accepted_personal_perspective",
  "persistence_authorized",
  "automatic_personal_perspective_application",
  "automatic_review_decision",
  "semantic_state_commit_authorized",
  "provider_execution_authorized",
  "automatic_perspective_actor_promotion",
  "evolutionary_fitness_selection_authorized",
] as const;

export const PERSONAL_PERSPECTIVE_SEMANTIC_ASSERTION_FLAGS_V01 = [
  "premise_admitted_as_candidate",
  "over_globalized_claim_accepted",
  "aspiration_treated_as_current_truth",
  "tension_automatically_resolved",
  "exception_proves_global_falsehood",
  "model_agreement_treated_as_verification",
  "repeated_observation_treated_as_endorsement",
  "confidence_score_grants_authority",
  "psychological_diagnosis_assigned",
  "integrity_establishes_authenticity",
  "observed_behavior_establishes_personality_truth",
  "task_choice_establishes_global_identity",
  "lower_scope_rewrites_higher_scope",
  "counterexample_fabricated_for_coverage",
  "contested_as_settled_truth",
] as const;

type ValueOf<T extends readonly string[]> = T[number];
export type PersonalPerspectiveSemanticKindV01 = ValueOf<
  typeof PERSONAL_PERSPECTIVE_SEMANTIC_KINDS_V01
>;
export type PersonalPerspectiveEpistemicOriginV01 = ValueOf<
  typeof PERSONAL_PERSPECTIVE_EPISTEMIC_ORIGINS_V01
>;
export type PersonalPerspectiveScopeKindV01 = ValueOf<
  typeof PERSONAL_PERSPECTIVE_SCOPE_KINDS_V01
>;
export type PersonalPerspectiveSourceKindV01 = ValueOf<
  typeof PERSONAL_PERSPECTIVE_SOURCE_KINDS_V01
>;
export type PersonalPerspectiveSourceRelationV01 = ValueOf<
  typeof PERSONAL_PERSPECTIVE_SOURCE_RELATIONS_V01
>;
export type PersonalPerspectiveCaseRelationV01 = ValueOf<
  typeof PERSONAL_PERSPECTIVE_CASE_RELATIONS_V01
>;
export type PersonalPerspectiveCounterexampleStatusV01 = ValueOf<
  typeof PERSONAL_PERSPECTIVE_COUNTEREXAMPLE_STATUSES_V01
>;
export type PersonalPerspectiveCandidateStatusV01 = ValueOf<
  typeof PERSONAL_PERSPECTIVE_CANDIDATE_STATUSES_V01
>;
export type PersonalPerspectiveRefusalKindV01 = ValueOf<
  typeof PERSONAL_PERSPECTIVE_REFUSAL_KINDS_V01
>;
export type PersonalPerspectiveFutureReviewActionV01 = ValueOf<
  typeof PERSONAL_PERSPECTIVE_FUTURE_REVIEW_ACTIONS_V01
>;

export type PersonalPerspectiveAuthorityBoundaryV01 = {
  [K in ValueOf<typeof PERSONAL_PERSPECTIVE_AUTHORITY_FLAGS_V01>]: false;
};
export type PersonalPerspectiveSemanticAssertionsV01 = {
  [K in ValueOf<
    typeof PERSONAL_PERSPECTIVE_SEMANTIC_ASSERTION_FLAGS_V01
  >]: false;
};

export interface PersonalPerspectiveScopeV01 {
  kind: PersonalPerspectiveScopeKindV01;
  qualifiers: string[];
  project_scope_ref: string | null;
  valid_from: string | null;
  valid_until: string | null;
  ambiguous: false;
  sharing_outside_scope_authorized: false;
}

export interface PersonalPerspectiveSourceSeedV01 {
  source_key: string;
  source_kind: PersonalPerspectiveSourceKindV01;
  summary: string;
  scope: PersonalPerspectiveScopeV01;
}

export interface PersonalPerspectiveCaseSeedV01 {
  case_key: string;
  case_type: "candidate" | "refusal" | "tombstone";
  title: string;
  summary: string;
  proposition: string | null;
  tombstone_ref: string | null;
  semantic_kind: PersonalPerspectiveSemanticKindV01;
  epistemic_origin: PersonalPerspectiveEpistemicOriginV01;
  scope: PersonalPerspectiveScopeV01;
  source_relations: Array<{
    source_key: string;
    relation: PersonalPerspectiveSourceRelationV01;
  }>;
  case_relations: Array<{
    target_case_key: string;
    relation: PersonalPerspectiveCaseRelationV01;
    target_effect: "preserves_target";
  }>;
  counterexample: {
    status: PersonalPerspectiveCounterexampleStatusV01;
    source_keys: string[];
    search_summary: string | null;
    justification: string | null;
    search_completed: boolean;
    completeness_claimed: boolean;
    impossibility_claimed: boolean;
  };
  candidate_status: PersonalPerspectiveCandidateStatusV01 | null;
  refusal_kind: PersonalPerspectiveRefusalKindV01 | null;
  rationale: string;
  limitations: string[];
  future_review_actions: PersonalPerspectiveFutureReviewActionV01[];
  reuse_eligibility:
    | "review_required"
    | "re_evaluation_required"
    | "prohibited";
  synthetic_content_retained: boolean;
}

export interface PersonalPerspectiveSemanticCasebookSeedV01 {
  sources: PersonalPerspectiveSourceSeedV01[];
  cases: PersonalPerspectiveCaseSeedV01[];
  coverage: Array<{
    requirement_id: ValueOf<typeof PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_V01>;
    case_keys: string[];
  }>;
}

export interface PersonalPerspectiveIntegrityV01 {
  algorithm: "sha256_canonical_json_v0.1";
  method_version: typeof PERSONAL_PERSPECTIVE_CASEBOOK_METHOD_VERSION_V01;
  fingerprint: string;
  fingerprint_scope: string;
  omitted_fields: string[];
}

export interface PersonalPerspectiveSourceV01 {
  source_id: string;
  source_key: string;
  source_kind: PersonalPerspectiveSourceKindV01;
  summary: string;
  scope: PersonalPerspectiveScopeV01;
  synthetic: true;
  authenticity_established: false;
  authority_boundary: PersonalPerspectiveAuthorityBoundaryV01;
  integrity: PersonalPerspectiveIntegrityV01;
}

export interface PersonalPerspectiveCaseV01 {
  case_id: string;
  case_key: string;
  case_type: "candidate" | "refusal" | "tombstone";
  title: string;
  summary: string;
  proposition: string | null;
  tombstone_ref: string | null;
  semantic_kind: PersonalPerspectiveSemanticKindV01;
  epistemic_origin: PersonalPerspectiveEpistemicOriginV01;
  scope: PersonalPerspectiveScopeV01;
  source_relations: Array<{
    source_id: string;
    relation: PersonalPerspectiveSourceRelationV01;
  }>;
  case_relations: Array<{
    target_case_id: string;
    relation: PersonalPerspectiveCaseRelationV01;
    target_effect: "preserves_target";
  }>;
  counterexample: {
    status: PersonalPerspectiveCounterexampleStatusV01;
    source_refs: string[];
    search_summary: string | null;
    justification: string | null;
    search_completed: boolean;
    completeness_claimed: boolean;
    impossibility_claimed: boolean;
  };
  candidate_status: PersonalPerspectiveCandidateStatusV01 | null;
  refusal_kind: PersonalPerspectiveRefusalKindV01 | null;
  rationale: string;
  limitations: string[];
  future_review_actions: PersonalPerspectiveFutureReviewActionV01[];
  review_required: true;
  reuse: {
    eligibility:
      | "review_required"
      | "re_evaluation_required"
      | "prohibited";
    persistence_authorized: false;
    task_context_selection_authorized: false;
    cross_project_sharing_authorized: false;
    automatic_revival_authorized: false;
    rehydration_authorized: false;
    synthetic_content_retained: boolean;
  };
  semantic_assertions: PersonalPerspectiveSemanticAssertionsV01;
  non_authority_summary: string;
  authority_boundary: PersonalPerspectiveAuthorityBoundaryV01;
  integrity: PersonalPerspectiveIntegrityV01;
}

export interface PersonalPerspectiveSemanticCasebookV01 {
  casebook_version: typeof PERSONAL_PERSPECTIVE_CASEBOOK_VERSION_V01;
  semantic_definition_version: typeof PERSONAL_PERSPECTIVE_SEMANTIC_DEFINITION_VERSION_V01;
  deterministic_method_version: typeof PERSONAL_PERSPECTIVE_CASEBOOK_METHOD_VERSION_V01;
  casebook_id: string;
  defined_at: typeof PERSONAL_PERSPECTIVE_CASEBOOK_DEFINED_AT_V01;
  classification: {
    architecture_class: "lab_r_and_d";
    workstream: "K";
    stage: 1;
    synthetic_only: true;
    non_authoritative: true;
    non_persistent: true;
    provider_neutral: true;
    maturity_claim: "level_1_validated_contract";
  };
  experiment: {
    experiment_id: "lab:personal-perspective-semantic-casebook:v0.1";
    question: string;
    hypothesis: string;
    inputs: string[];
    excluded_inputs: string[];
    method: "deterministic_offline_casebook_validation";
    method_version: typeof PERSONAL_PERSPECTIVE_CASEBOOK_METHOD_VERSION_V01;
    baseline: string;
    counterexample_method: string;
    expected_signal: string[];
    failure_criteria: string[];
    authority_boundary: string[];
    retention: string;
    reproduction_steps: string[];
    productization_gate: string[];
    limitations: string[];
    defined_at: typeof PERSONAL_PERSPECTIVE_CASEBOOK_DEFINED_AT_V01;
  };
  semantic_definitions: typeof PERSONAL_PERSPECTIVE_SEMANTIC_DEFINITIONS_V01;
  sources: PersonalPerspectiveSourceV01[];
  cases: PersonalPerspectiveCaseV01[];
  coverage_matrix: Array<{
    requirement_id: ValueOf<typeof PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_V01>;
    case_refs: string[];
  }>;
  privacy_boundary: {
    all_content_synthetic: true;
    actual_personal_material_ingested: false;
    raw_transcript_collected: false;
    provider_received_personal_material: false;
    database_persistence_occurred: false;
    cross_project_reuse_occurred: false;
    task_context_injection_occurred: false;
    hidden_profile_created: false;
    real_data_deletion_enforcement_claimed: false;
  };
  retention_boundary: {
    retention_class: "committed_synthetic_fixture";
    real_user_data_retained: false;
    reusable_deleted_content_retained: false;
    deletion_semantics_scope: "fictional_fixture_refusal_only";
  };
  authority_boundary: PersonalPerspectiveAuthorityBoundaryV01;
  integrity: PersonalPerspectiveIntegrityV01;
}

export type PersonalPerspectiveValidationCategoryV01 =
  | "structure"
  | "unsafe_material"
  | "reference"
  | "semantic"
  | "integrity";

export interface PersonalPerspectiveValidationIssueV01 {
  severity: "error";
  category: PersonalPerspectiveValidationCategoryV01;
  code: string;
  path: string | null;
  blocked: boolean;
}

export interface PersonalPerspectiveValidationResultV01 {
  status: "valid" | "invalid" | "blocked";
  contract_version: string | null;
  issue_count: number;
  issues_truncated: boolean;
  issues: PersonalPerspectiveValidationIssueV01[];
  admitted_candidate_count: number;
  admitted_case_refs: string[];
  normalized: PersonalPerspectiveSemanticCasebookV01 | null;
}

export const PERSONAL_PERSPECTIVE_SEMANTIC_DEFINITIONS_V01 = {
  semantic_kinds: PERSONAL_PERSPECTIVE_SEMANTIC_KINDS_V01,
  epistemic_origins: PERSONAL_PERSPECTIVE_EPISTEMIC_ORIGINS_V01,
  scope_kinds: PERSONAL_PERSPECTIVE_SCOPE_KINDS_V01,
  source_kinds: PERSONAL_PERSPECTIVE_SOURCE_KINDS_V01,
  source_relations: PERSONAL_PERSPECTIVE_SOURCE_RELATIONS_V01,
  case_relations: PERSONAL_PERSPECTIVE_CASE_RELATIONS_V01,
  counterexample_statuses:
    PERSONAL_PERSPECTIVE_COUNTEREXAMPLE_STATUSES_V01,
  candidate_statuses: PERSONAL_PERSPECTIVE_CANDIDATE_STATUSES_V01,
  refusal_kinds: PERSONAL_PERSPECTIVE_REFUSAL_KINDS_V01,
  future_review_actions: PERSONAL_PERSPECTIVE_FUTURE_REVIEW_ACTIONS_V01,
  invariants: [
    "candidate_not_decision",
    "decision_not_transition",
    "context_not_truth",
    "lab_diagnostic_not_evidence",
    "model_inference_not_user_identity",
    "observed_behavior_not_personality_truth",
    "task_choice_not_global_identity_update",
    "personal_perspective_not_project_truth",
    "lower_scope_exception_not_higher_scope_rewrite",
    "arena_output_not_personal_perspective_mutation",
    "synthetic_fixture_not_user_endorsement",
    "valid_contract_not_persistence_authority",
    "casebook_inclusion_not_task_context_inclusion",
  ] as const,
  bounds: PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01,
} as const;

const authorityBoundary = Object.freeze(
  Object.fromEntries(
    PERSONAL_PERSPECTIVE_AUTHORITY_FLAGS_V01.map((field) => [field, false]),
  ) as PersonalPerspectiveAuthorityBoundaryV01,
);
const semanticAssertions = Object.freeze(
  Object.fromEntries(
    PERSONAL_PERSPECTIVE_SEMANTIC_ASSERTION_FLAGS_V01.map((field) => [
      field,
      false,
    ]),
  ) as PersonalPerspectiveSemanticAssertionsV01,
);

const classification: PersonalPerspectiveSemanticCasebookV01["classification"] =
  Object.freeze({
    architecture_class: "lab_r_and_d",
    workstream: "K",
    stage: 1,
    synthetic_only: true,
    non_authoritative: true,
    non_persistent: true,
    provider_neutral: true,
    maturity_claim: "level_1_validated_contract",
  });

const experiment: PersonalPerspectiveSemanticCasebookV01["experiment"] =
  Object.freeze({
    experiment_id: "lab:personal-perspective-semantic-casebook:v0.1",
    question:
      "Can a bounded synthetic casebook distinguish revisable Personal Perspective candidates, exceptions, counterexamples, correction, and refusal without granting authority?",
    hypothesis:
      "Deterministic source, origin, scope, status, counterexample, reuse, privacy, and non-authority rules can reject identity and context overreach before any persistence or product integration.",
    inputs: [
      "committed synthetic source catalog",
      "committed synthetic candidate, refusal, and tombstone cases",
      "fixed semantic definitions and validation bounds",
    ],
    excluded_inputs: [
      "personal_material_is_out_of_scope",
      "prompt_and_transcript_material_are_out_of_scope",
      "private files or environment data",
      "provider or model output",
      "production Core records",
    ],
    method: "deterministic_offline_casebook_validation",
    method_version: PERSONAL_PERSPECTIVE_CASEBOOK_METHOD_VERSION_V01,
    baseline:
      "Level 0 intent in the active Personal Perspective R&D program without a machine-checkable Stage 1 casebook.",
    counterexample_method:
      "Use only semantically necessary fictional counterexample sources and reject fabricated coverage or contradictory status/ref combinations.",
    expected_signal: [
      "all required positive semantic rows validate",
      "all malformed, unsafe, authority-escalating, and adversarial fixtures fail closed",
      "re-signed semantic attacks remain rejected for semantic reasons",
    ],
    failure_criteria: [
      "any invalid fixture admits a candidate",
      "any prohibited authority meaning validates as true",
      "normalization or validation depends on clock, environment, machine path, locale, network, provider, or random input",
      "deleted synthetic content remains reusable",
    ],
    authority_boundary: [
      "Lab output remains non-authoritative",
      "no ReviewDecision or semantic transition is created",
      "no persistence, task-context inclusion, cross-project sharing, publication, or merge is authorized",
    ],
    retention:
      "Only committed fictional synthetic fixture material is retained; no real-data deletion enforcement is claimed.",
    reproduction_steps: [
      "install dependencies from the committed lockfile",
      "run the versioned Personal Perspective casebook validation command",
      "compare the bounded JSON summary and fixed anchors",
    ],
    productization_gate: [
      "separate human review of this Level 1 Lab contract",
      "separate deterministic task-gap baseline slice",
      "future architecture decision before any Personal Vault persistence or context inclusion",
    ],
    limitations: [
      "synthetic semantics do not establish real user endorsement or usability",
      "the casebook does not implement task-gap discovery, review replay, context selection, persistence, or product integration",
      "integrity fingerprints establish deterministic equality, not authenticity",
    ],
    defined_at: PERSONAL_PERSPECTIVE_CASEBOOK_DEFINED_AT_V01,
  });

const privacyBoundary: PersonalPerspectiveSemanticCasebookV01["privacy_boundary"] =
  Object.freeze({
    all_content_synthetic: true,
    actual_personal_material_ingested: false,
    raw_transcript_collected: false,
    provider_received_personal_material: false,
    database_persistence_occurred: false,
    cross_project_reuse_occurred: false,
    task_context_injection_occurred: false,
    hidden_profile_created: false,
    real_data_deletion_enforcement_claimed: false,
  });

const retentionBoundary: PersonalPerspectiveSemanticCasebookV01["retention_boundary"] =
  Object.freeze({
    retention_class: "committed_synthetic_fixture",
    real_user_data_retained: false,
    reusable_deleted_content_retained: false,
    deletion_semantics_scope: "fictional_fixture_refusal_only",
  });

function integrity(scope: string): PersonalPerspectiveIntegrityV01 {
  return {
    algorithm: "sha256_canonical_json_v0.1",
    method_version: PERSONAL_PERSPECTIVE_CASEBOOK_METHOD_VERSION_V01,
    fingerprint: "sha256:pending",
    fingerprint_scope: scope,
    omitted_fields: ["integrity.fingerprint"],
  };
}

function canonicalFingerprint(value: Record<string, unknown>): string {
  const copy = clone(value);
  if (isProtocolRecordV01(copy.integrity)) {
    copy.integrity.fingerprint = "sha256:omitted";
  }
  return createProtocolSha256V01(canonicalizeProtocolValueV01(copy));
}

function digestSuffix(value: unknown): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(value))
    .slice("sha256:".length, "sha256:".length + 24);
}

function normalizeText(value: string): string {
  return value.trim();
}

function uniqueSortedStrings(values: readonly string[]): string[] {
  return [...new Set(values.map(normalizeText))].sort(
    compareProtocolCodeUnitsV01,
  );
}

function uniqueSortedValues<T>(values: readonly T[]): T[] {
  const byCanonical = new Map<string, T>();
  for (const value of values) {
    const key = canonicalizeProtocolValueV01(value);
    if (!byCanonical.has(key)) byCanonical.set(key, value);
  }
  return [...byCanonical.values()].sort(compareProtocolCanonicalV01);
}

function normalizeScope(scope: PersonalPerspectiveScopeV01): PersonalPerspectiveScopeV01 {
  return {
    kind: scope.kind,
    qualifiers: uniqueSortedStrings(scope.qualifiers),
    project_scope_ref: scope.project_scope_ref
      ? normalizeText(scope.project_scope_ref)
      : null,
    valid_from: scope.valid_from ? normalizeText(scope.valid_from) : null,
    valid_until: scope.valid_until ? normalizeText(scope.valid_until) : null,
    ambiguous: scope.ambiguous,
    sharing_outside_scope_authorized: scope.sharing_outside_scope_authorized,
  };
}

function dedupeConflictSensitive<T extends Record<string, unknown>>(
  values: T[],
  identityField: keyof T,
): T[] {
  const byIdentity = new Map<string, { canonical: string; value: T }>();
  for (const value of values) {
    const identity = String(value[identityField]);
    const canonical = canonicalizeProtocolValueV01(value);
    const existing = byIdentity.get(identity);
    if (existing && existing.canonical !== canonical) {
      throw new Error("casebook_fixture_conflicting_duplicate_identity");
    }
    if (!existing) byIdentity.set(identity, { canonical, value });
  }
  return [...byIdentity.values()]
    .map((entry) => entry.value)
    .sort((left, right) =>
      compareProtocolCodeUnitsV01(
        String(left[identityField]),
        String(right[identityField]),
      ),
    );
}

function normalizedSourceSeed(
  seed: PersonalPerspectiveSourceSeedV01,
): PersonalPerspectiveSourceSeedV01 {
  return {
    source_key: normalizeText(seed.source_key),
    source_kind: seed.source_kind,
    summary: normalizeText(seed.summary),
    scope: normalizeScope(seed.scope),
  };
}

function normalizedCaseSeed(
  seed: PersonalPerspectiveCaseSeedV01,
): PersonalPerspectiveCaseSeedV01 {
  return {
    ...seed,
    case_key: normalizeText(seed.case_key),
    title: normalizeText(seed.title),
    summary: normalizeText(seed.summary),
    proposition: seed.proposition ? normalizeText(seed.proposition) : null,
    tombstone_ref: seed.tombstone_ref
      ? normalizeText(seed.tombstone_ref)
      : null,
    scope: normalizeScope(seed.scope),
    source_relations: uniqueSortedValues(
      seed.source_relations.map((relation) => ({
        source_key: normalizeText(relation.source_key),
        relation: relation.relation,
      })),
    ),
    case_relations: uniqueSortedValues(
      seed.case_relations.map((relation) => ({
        target_case_key: normalizeText(relation.target_case_key),
        relation: relation.relation,
        target_effect: relation.target_effect,
      })),
    ),
    counterexample: {
      status: seed.counterexample.status,
      source_keys: uniqueSortedStrings(seed.counterexample.source_keys),
      search_summary: seed.counterexample.search_summary
        ? normalizeText(seed.counterexample.search_summary)
        : null,
      justification: seed.counterexample.justification
        ? normalizeText(seed.counterexample.justification)
        : null,
      search_completed: seed.counterexample.search_completed,
      completeness_claimed: seed.counterexample.completeness_claimed,
      impossibility_claimed: seed.counterexample.impossibility_claimed,
    },
    rationale: normalizeText(seed.rationale),
    limitations: uniqueSortedStrings(seed.limitations),
    future_review_actions: uniqueSortedStrings(
      seed.future_review_actions,
    ) as PersonalPerspectiveFutureReviewActionV01[],
  };
}

const seedRootKeys = new Set(["sources", "cases", "coverage"]);
const seedSourceKeys = new Set([
  "source_key",
  "source_kind",
  "summary",
  "scope",
]);
const seedCaseKeys = new Set([
  "case_key",
  "case_type",
  "title",
  "summary",
  "proposition",
  "tombstone_ref",
  "semantic_kind",
  "epistemic_origin",
  "scope",
  "source_relations",
  "case_relations",
  "counterexample",
  "candidate_status",
  "refusal_kind",
  "rationale",
  "limitations",
  "future_review_actions",
  "reuse_eligibility",
  "synthetic_content_retained",
]);
const seedScopeKeys = new Set([
  "kind",
  "qualifiers",
  "project_scope_ref",
  "valid_from",
  "valid_until",
  "ambiguous",
  "sharing_outside_scope_authorized",
]);
const seedSourceRelationKeys = new Set(["source_key", "relation"]);
const seedCaseRelationKeys = new Set([
  "target_case_key",
  "relation",
  "target_effect",
]);
const seedCounterexampleKeys = new Set([
  "status",
  "source_keys",
  "search_summary",
  "justification",
  "search_completed",
  "completeness_claimed",
  "impossibility_claimed",
]);
const seedCoverageKeys = new Set(["requirement_id", "case_keys"]);

function assertCasebookSeedDefinitionV01(input: unknown): asserts input is PersonalPerspectiveSemanticCasebookSeedV01 {
  if (!isPlainSeedRecord(input)) seedDefinitionFailure();
  assertSeedAllowedKeys(input, seedRootKeys);
  if (!Array.isArray(input.sources) || !Array.isArray(input.cases) || !Array.isArray(input.coverage)) {
    seedDefinitionFailure();
  }
  for (const sourceSeed of input.sources) {
    if (!isPlainSeedRecord(sourceSeed)) seedDefinitionFailure();
    assertSeedAllowedKeys(sourceSeed, seedSourceKeys);
    assertSeedStrings(sourceSeed, ["source_key", "source_kind", "summary"]);
    assertSeedScope(sourceSeed.scope);
  }
  for (const caseSeed of input.cases) {
    if (!isPlainSeedRecord(caseSeed)) seedDefinitionFailure();
    assertSeedAllowedKeys(caseSeed, seedCaseKeys);
    assertSeedStrings(caseSeed, [
      "case_key",
      "case_type",
      "title",
      "summary",
      "semantic_kind",
      "epistemic_origin",
      "rationale",
      "reuse_eligibility",
    ]);
    assertSeedNullableString(caseSeed.proposition);
    assertSeedNullableString(caseSeed.tombstone_ref);
    assertSeedNullableString(caseSeed.candidate_status);
    assertSeedNullableString(caseSeed.refusal_kind);
    if (typeof caseSeed.synthetic_content_retained !== "boolean") {
      seedDefinitionFailure();
    }
    assertSeedScope(caseSeed.scope);
    assertSeedStringArray(caseSeed.limitations);
    assertSeedStringArray(caseSeed.future_review_actions);
    if (!Array.isArray(caseSeed.source_relations)) seedDefinitionFailure();
    for (const relation of caseSeed.source_relations) {
      if (!isPlainSeedRecord(relation)) seedDefinitionFailure();
      assertSeedAllowedKeys(relation, seedSourceRelationKeys);
      assertSeedStrings(relation, ["source_key", "relation"]);
    }
    if (!Array.isArray(caseSeed.case_relations)) seedDefinitionFailure();
    for (const relation of caseSeed.case_relations) {
      if (!isPlainSeedRecord(relation)) seedDefinitionFailure();
      assertSeedAllowedKeys(relation, seedCaseRelationKeys);
      assertSeedStrings(relation, [
        "target_case_key",
        "relation",
        "target_effect",
      ]);
      if (relation.target_effect !== "preserves_target") seedDefinitionFailure();
    }
    if (!isPlainSeedRecord(caseSeed.counterexample)) seedDefinitionFailure();
    assertSeedAllowedKeys(caseSeed.counterexample, seedCounterexampleKeys);
    assertSeedStrings(caseSeed.counterexample, ["status"]);
    assertSeedStringArray(caseSeed.counterexample.source_keys);
    assertSeedNullableString(caseSeed.counterexample.search_summary);
    assertSeedNullableString(caseSeed.counterexample.justification);
    for (const field of [
      "search_completed",
      "completeness_claimed",
      "impossibility_claimed",
    ]) {
      if (typeof caseSeed.counterexample[field] !== "boolean") {
        seedDefinitionFailure();
      }
    }
  }
  const coverageByRequirement = new Map<string, string>();
  for (const coverage of input.coverage) {
    if (!isPlainSeedRecord(coverage)) seedDefinitionFailure();
    assertSeedAllowedKeys(coverage, seedCoverageKeys);
    assertSeedStrings(coverage, ["requirement_id"]);
    assertSeedStringArray(coverage.case_keys);
    const requirementId = coverage.requirement_id as string;
    const caseKeys = coverage.case_keys as string[];
    if (
      !PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_V01.includes(
        requirementId as never,
      )
    ) {
      seedDefinitionFailure();
    }
    const normalizedCaseKeys = canonicalizeProtocolValueV01(
      uniqueSortedStrings(caseKeys),
    );
    const existing = coverageByRequirement.get(requirementId);
    if (existing && existing !== normalizedCaseKeys) seedDefinitionFailure();
    coverageByRequirement.set(requirementId, normalizedCaseKeys);
  }
  if (
    PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_V01.some(
      (requirement) => !coverageByRequirement.has(requirement),
    )
  ) {
    seedDefinitionFailure();
  }
}

function assertSeedScope(value: unknown): void {
  if (!isPlainSeedRecord(value)) seedDefinitionFailure();
  assertSeedAllowedKeys(value, seedScopeKeys);
  assertSeedStrings(value, ["kind"]);
  assertSeedStringArray(value.qualifiers);
  assertSeedNullableString(value.project_scope_ref);
  assertSeedNullableString(value.valid_from);
  assertSeedNullableString(value.valid_until);
  if (
    value.ambiguous !== false ||
    value.sharing_outside_scope_authorized !== false
  ) {
    seedDefinitionFailure();
  }
}

function isPlainSeedRecord(value: unknown): value is Record<string, unknown> {
  if (!isProtocolRecordV01(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertSeedAllowedKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
): void {
  if (Object.keys(value).some((key) => !allowed.has(key))) seedDefinitionFailure();
}

function assertSeedStrings(
  value: Record<string, unknown>,
  fields: readonly string[],
): void {
  for (const field of fields) {
    if (typeof value[field] !== "string") seedDefinitionFailure();
  }
}

function assertSeedNullableString(value: unknown): void {
  if (value !== null && typeof value !== "string") seedDefinitionFailure();
}

function assertSeedStringArray(value: unknown): void {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    seedDefinitionFailure();
  }
}

function seedDefinitionFailure(): never {
  throw new Error("casebook_seed_definition_invalid");
}

function sourceIdentityMaterial(source: {
  source_key: unknown;
  source_kind: unknown;
  summary: unknown;
  scope: unknown;
}): Record<string, unknown> {
  return {
    namespace: PERSONAL_PERSPECTIVE_CASEBOOK_VERSION_V01,
    source_key: source.source_key,
    source_kind: source.source_kind,
    summary: source.summary,
    scope: source.scope,
  };
}

function caseIdentityMaterial(caseItem: {
  case_key: unknown;
  case_type: unknown;
  semantic_kind: unknown;
  epistemic_origin: unknown;
  scope: unknown;
  proposition: unknown;
  tombstone_ref: unknown;
  refusal_kind: unknown;
}): Record<string, unknown> {
  return {
    namespace: PERSONAL_PERSPECTIVE_CASEBOOK_VERSION_V01,
    case_key: caseItem.case_key,
    case_type: caseItem.case_type,
    semantic_kind: caseItem.semantic_kind,
    epistemic_origin: caseItem.epistemic_origin,
    scope: caseItem.scope,
    proposition: caseItem.proposition,
    tombstone_ref: caseItem.tombstone_ref,
    refusal_kind: caseItem.refusal_kind,
  };
}

function deriveSourceId(source: Parameters<typeof sourceIdentityMaterial>[0]): string {
  return `ppscb-source-v0-1:${digestSuffix(sourceIdentityMaterial(source))}`;
}

function deriveCaseId(caseItem: Parameters<typeof caseIdentityMaterial>[0]): string {
  return `ppscb-case-v0-1:${digestSuffix(caseIdentityMaterial(caseItem))}`;
}

function casebookIdentityMaterial(
  casebook: PersonalPerspectiveSemanticCasebookV01 | Record<string, unknown>,
): Record<string, unknown> {
  const record = casebook as unknown as Record<string, unknown>;
  const sourceIds = Array.isArray(record.sources)
    ? record.sources.map((source) =>
        isProtocolRecordV01(source) ? source.source_id ?? null : null,
      )
    : [];
  const caseIds = Array.isArray(record.cases)
    ? record.cases.map((caseItem) =>
        isProtocolRecordV01(caseItem) ? caseItem.case_id ?? null : null,
      )
    : [];
  return {
    namespace: PERSONAL_PERSPECTIVE_CASEBOOK_VERSION_V01,
    semantic_definition_version: record.semantic_definition_version,
    deterministic_method_version: record.deterministic_method_version,
    experiment: record.experiment,
    source_ids: sourceIds,
    case_ids: caseIds,
    authority_boundary: record.authority_boundary,
  };
}

function deriveCasebookId(
  casebook: PersonalPerspectiveSemanticCasebookV01 | Record<string, unknown>,
): string {
  return `ppscb-v0-1:${digestSuffix(casebookIdentityMaterial(casebook))}`;
}

export function normalizeAndBuildPersonalPerspectiveSemanticCasebookV01(
  input: PersonalPerspectiveSemanticCasebookSeedV01,
): PersonalPerspectiveSemanticCasebookV01 {
  assertCasebookSeedDefinitionV01(input);
  const sourceSeeds = dedupeConflictSensitive(
    input.sources.map(normalizedSourceSeed) as Array<
      PersonalPerspectiveSourceSeedV01 & Record<string, unknown>
    >,
    "source_key",
  );
  const caseSeeds = dedupeConflictSensitive(
    input.cases.map(normalizedCaseSeed) as Array<
      PersonalPerspectiveCaseSeedV01 & Record<string, unknown>
    >,
    "case_key",
  );

  const sources: PersonalPerspectiveSourceV01[] = sourceSeeds.map((seed) => {
    const source: PersonalPerspectiveSourceV01 = {
      source_id: deriveSourceId(seed),
      source_key: seed.source_key,
      source_kind: seed.source_kind,
      summary: seed.summary,
      scope: seed.scope,
      synthetic: true,
      authenticity_established: false,
      authority_boundary: clone(authorityBoundary),
      integrity: integrity(
        PERSONAL_PERSPECTIVE_SOURCE_FINGERPRINT_SCOPE_V01,
      ),
    };
    source.integrity.fingerprint = canonicalFingerprint(
      source as unknown as Record<string, unknown>,
    );
    return source;
  });
  sources.sort((left, right) =>
    compareProtocolCodeUnitsV01(left.source_id, right.source_id),
  );
  const sourceIdsByKey = new Map(
    sources.map((source) => [source.source_key, source.source_id]),
  );

  const caseIdsByKey = new Map(
    caseSeeds.map((seed) => [seed.case_key, deriveCaseId(seed)]),
  );
  const cases: PersonalPerspectiveCaseV01[] = caseSeeds.map((seed) => {
    const caseItem: PersonalPerspectiveCaseV01 = {
      case_id: requiredMappedValue(caseIdsByKey, seed.case_key),
      case_key: seed.case_key,
      case_type: seed.case_type,
      title: seed.title,
      summary: seed.summary,
      proposition: seed.proposition,
      tombstone_ref: seed.tombstone_ref,
      semantic_kind: seed.semantic_kind,
      epistemic_origin: seed.epistemic_origin,
      scope: seed.scope,
      source_relations: seed.source_relations
        .map((relation) => ({
          source_id: requiredMappedValue(
            sourceIdsByKey,
            relation.source_key,
          ),
          relation: relation.relation,
        }))
        .sort(compareProtocolCanonicalV01),
      case_relations: seed.case_relations
        .map((relation) => ({
          target_case_id: requiredMappedValue(
            caseIdsByKey,
            relation.target_case_key,
          ),
          relation: relation.relation,
          target_effect: relation.target_effect,
        }))
        .sort(compareProtocolCanonicalV01),
      counterexample: {
        status: seed.counterexample.status,
        source_refs: seed.counterexample.source_keys
          .map((key) => requiredMappedValue(sourceIdsByKey, key))
          .sort(compareProtocolCodeUnitsV01),
        search_summary: seed.counterexample.search_summary,
        justification: seed.counterexample.justification,
        search_completed: seed.counterexample.search_completed,
        completeness_claimed: seed.counterexample.completeness_claimed,
        impossibility_claimed: seed.counterexample.impossibility_claimed,
      },
      candidate_status: seed.candidate_status,
      refusal_kind: seed.refusal_kind,
      rationale: seed.rationale,
      limitations: seed.limitations,
      future_review_actions: seed.future_review_actions,
      review_required: true,
      reuse: {
        eligibility: seed.reuse_eligibility,
        persistence_authorized: false,
        task_context_selection_authorized: false,
        cross_project_sharing_authorized: false,
        automatic_revival_authorized: false,
        rehydration_authorized: false,
        synthetic_content_retained: seed.synthetic_content_retained,
      },
      semantic_assertions: clone(semanticAssertions),
      non_authority_summary: PERSONAL_PERSPECTIVE_NON_AUTHORITY_SUMMARY_V01,
      authority_boundary: clone(authorityBoundary),
      integrity: integrity(
        PERSONAL_PERSPECTIVE_CASE_FINGERPRINT_SCOPE_V01,
      ),
    };
    caseItem.integrity.fingerprint = canonicalFingerprint(
      caseItem as unknown as Record<string, unknown>,
    );
    return caseItem;
  });
  cases.sort((left, right) =>
    compareProtocolCodeUnitsV01(left.case_id, right.case_id),
  );

  const coverageByRequirement = new Map(
    input.coverage.map((entry) => [
      entry.requirement_id,
      uniqueSortedStrings(entry.case_keys),
    ]),
  );
  const coverage_matrix = PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_V01.map(
    (requirement_id) => ({
      requirement_id,
      case_refs: (coverageByRequirement.get(requirement_id) ?? [])
        .map((key) => requiredMappedValue(caseIdsByKey, key))
        .sort(compareProtocolCodeUnitsV01),
    }),
  );

  const casebook: PersonalPerspectiveSemanticCasebookV01 = {
    casebook_version: PERSONAL_PERSPECTIVE_CASEBOOK_VERSION_V01,
    semantic_definition_version:
      PERSONAL_PERSPECTIVE_SEMANTIC_DEFINITION_VERSION_V01,
    deterministic_method_version:
      PERSONAL_PERSPECTIVE_CASEBOOK_METHOD_VERSION_V01,
    casebook_id: "ppscb-v0-1:pending",
    defined_at: PERSONAL_PERSPECTIVE_CASEBOOK_DEFINED_AT_V01,
    classification: clone(classification),
    experiment: clone(experiment),
    semantic_definitions: clone(PERSONAL_PERSPECTIVE_SEMANTIC_DEFINITIONS_V01),
    sources,
    cases,
    coverage_matrix,
    privacy_boundary: clone(privacyBoundary),
    retention_boundary: clone(retentionBoundary),
    authority_boundary: clone(authorityBoundary),
    integrity: integrity(
      PERSONAL_PERSPECTIVE_CASEBOOK_FINGERPRINT_SCOPE_V01,
    ),
  };
  casebook.casebook_id = deriveCasebookId(casebook);
  casebook.integrity.fingerprint = canonicalFingerprint(
    casebook as unknown as Record<string, unknown>,
  );
  return casebook;
}

function requiredMappedValue(
  values: ReadonlyMap<string, string>,
  key: string,
): string {
  const value = values.get(key);
  if (!value) throw new Error("casebook_fixture_reference_unresolved");
  return value;
}

export function canonicalizePersonalPerspectiveCasebookValueV01(
  value: unknown,
): string {
  return canonicalizeProtocolValueV01(value);
}

export function resignPersonalPerspectiveSemanticCasebookV01(
  input: PersonalPerspectiveSemanticCasebookV01,
): PersonalPerspectiveSemanticCasebookV01 {
  const casebook = clone(input);
  const sourceIdMap = new Map<string, string>();
  for (const source of casebook.sources) {
    const previous = source.source_id;
    source.source_id = deriveSourceId(source);
    sourceIdMap.set(previous, source.source_id);
    source.integrity.fingerprint = canonicalFingerprint(
      source as unknown as Record<string, unknown>,
    );
  }
  for (const caseItem of casebook.cases) {
    for (const relation of caseItem.source_relations) {
      relation.source_id = sourceIdMap.get(relation.source_id) ?? relation.source_id;
    }
    caseItem.counterexample.source_refs = caseItem.counterexample.source_refs.map(
      (ref) => sourceIdMap.get(ref) ?? ref,
    );
  }

  const caseIdMap = new Map<string, string>();
  for (const caseItem of casebook.cases) {
    const previous = caseItem.case_id;
    caseItem.case_id = deriveCaseId(caseItem);
    caseIdMap.set(previous, caseItem.case_id);
  }
  for (const caseItem of casebook.cases) {
    for (const relation of caseItem.case_relations) {
      relation.target_case_id =
        caseIdMap.get(relation.target_case_id) ?? relation.target_case_id;
    }
    caseItem.source_relations.sort(compareProtocolCanonicalV01);
    caseItem.case_relations.sort(compareProtocolCanonicalV01);
    caseItem.counterexample.source_refs.sort(compareProtocolCodeUnitsV01);
    caseItem.integrity.fingerprint = canonicalFingerprint(
      caseItem as unknown as Record<string, unknown>,
    );
  }
  for (const coverage of casebook.coverage_matrix) {
    coverage.case_refs = coverage.case_refs
      .map((ref) => caseIdMap.get(ref) ?? ref)
      .sort(compareProtocolCodeUnitsV01);
  }
  const coverageOrder = new Map(
    PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_V01.map((requirement, index) => [
      requirement,
      index,
    ]),
  );
  casebook.coverage_matrix.sort(
    (left, right) =>
      (coverageOrder.get(left.requirement_id) ?? Number.MAX_SAFE_INTEGER) -
      (coverageOrder.get(right.requirement_id) ?? Number.MAX_SAFE_INTEGER),
  );
  casebook.sources.sort((left, right) =>
    compareProtocolCodeUnitsV01(left.source_id, right.source_id),
  );
  casebook.cases.sort((left, right) =>
    compareProtocolCodeUnitsV01(left.case_id, right.case_id),
  );
  casebook.casebook_id = deriveCasebookId(casebook);
  casebook.integrity.fingerprint = canonicalFingerprint(
    casebook as unknown as Record<string, unknown>,
  );
  return casebook;
}

const rootKeys = new Set([
  "casebook_version",
  "semantic_definition_version",
  "deterministic_method_version",
  "casebook_id",
  "defined_at",
  "classification",
  "experiment",
  "semantic_definitions",
  "sources",
  "cases",
  "coverage_matrix",
  "privacy_boundary",
  "retention_boundary",
  "authority_boundary",
  "integrity",
]);
const classificationKeys = new Set(Object.keys(classification));
const experimentKeys = new Set(Object.keys(experiment));
const semanticDefinitionKeys = new Set(
  Object.keys(PERSONAL_PERSPECTIVE_SEMANTIC_DEFINITIONS_V01),
);
const sourceKeys = new Set([
  "source_id",
  "source_key",
  "source_kind",
  "summary",
  "scope",
  "synthetic",
  "authenticity_established",
  "authority_boundary",
  "integrity",
]);
const caseKeys = new Set([
  "case_id",
  "case_key",
  "case_type",
  "title",
  "summary",
  "proposition",
  "tombstone_ref",
  "semantic_kind",
  "epistemic_origin",
  "scope",
  "source_relations",
  "case_relations",
  "counterexample",
  "candidate_status",
  "refusal_kind",
  "rationale",
  "limitations",
  "future_review_actions",
  "review_required",
  "reuse",
  "semantic_assertions",
  "non_authority_summary",
  "authority_boundary",
  "integrity",
]);
const scopeKeys = new Set([
  "kind",
  "qualifiers",
  "project_scope_ref",
  "valid_from",
  "valid_until",
  "ambiguous",
  "sharing_outside_scope_authorized",
]);
const sourceRelationKeys = new Set(["source_id", "relation"]);
const caseRelationKeys = new Set([
  "target_case_id",
  "relation",
  "target_effect",
]);
const counterexampleKeys = new Set([
  "status",
  "source_refs",
  "search_summary",
  "justification",
  "search_completed",
  "completeness_claimed",
  "impossibility_claimed",
]);
const reuseKeys = new Set([
  "eligibility",
  "persistence_authorized",
  "task_context_selection_authorized",
  "cross_project_sharing_authorized",
  "automatic_revival_authorized",
  "rehydration_authorized",
  "synthetic_content_retained",
]);
const integrityKeys = new Set([
  "algorithm",
  "method_version",
  "fingerprint",
  "fingerprint_scope",
  "omitted_fields",
]);
const coverageKeys = new Set(["requirement_id", "case_refs"]);
const privacyKeys = new Set(Object.keys(privacyBoundary));
const retentionKeys = new Set(Object.keys(retentionBoundary));
const authorityKeys: ReadonlySet<string> = new Set<string>(
  PERSONAL_PERSPECTIVE_AUTHORITY_FLAGS_V01,
);
const semanticAssertionKeys: ReadonlySet<string> = new Set<string>(
  PERSONAL_PERSPECTIVE_SEMANTIC_ASSERTION_FLAGS_V01,
);
const knownPathSegments = new Set<string>([
  ...rootKeys,
  ...classificationKeys,
  ...experimentKeys,
  ...semanticDefinitionKeys,
  ...sourceKeys,
  ...caseKeys,
  ...scopeKeys,
  ...sourceRelationKeys,
  ...caseRelationKeys,
  ...counterexampleKeys,
  ...reuseKeys,
  ...integrityKeys,
  ...coverageKeys,
  ...privacyKeys,
  ...retentionKeys,
  ...authorityKeys,
  ...semanticAssertionKeys,
]);

const semanticKinds = new Set<string>(PERSONAL_PERSPECTIVE_SEMANTIC_KINDS_V01);
const epistemicOrigins = new Set<string>(
  PERSONAL_PERSPECTIVE_EPISTEMIC_ORIGINS_V01,
);
const scopeKinds = new Set<string>(PERSONAL_PERSPECTIVE_SCOPE_KINDS_V01);
const sourceKinds = new Set<string>(PERSONAL_PERSPECTIVE_SOURCE_KINDS_V01);
const sourceRelations = new Set<string>(
  PERSONAL_PERSPECTIVE_SOURCE_RELATIONS_V01,
);
const sourceRelationsByKind = new Map<string, ReadonlySet<string>>([
  ["synthetic_user_declaration", new Set(["supports"])],
  ["synthetic_behavior_observation", new Set(["observes", "derived_from"])],
  ["synthetic_joint_interpretation", new Set(["derived_from"])],
  ["synthetic_model_inference", new Set(["derived_from"])],
  ["synthetic_contextual_fact", new Set(["contextualizes", "derived_from"])],
  ["synthetic_counterexample", new Set(["counterexample"])],
  ["synthetic_scope_constraint", new Set(["constrains_scope"])],
  ["synthetic_retraction_instruction", new Set(["derived_from"])],
  ["synthetic_deletion_instruction", new Set(["derived_from"])],
  ["synthetic_false_premise", new Set(["derived_from"])],
]);
const caseRelations = new Set<string>(PERSONAL_PERSPECTIVE_CASE_RELATIONS_V01);
const counterexampleStatuses = new Set<string>(
  PERSONAL_PERSPECTIVE_COUNTEREXAMPLE_STATUSES_V01,
);
const candidateStatuses = new Set<string>(
  PERSONAL_PERSPECTIVE_CANDIDATE_STATUSES_V01,
);
const refusalKinds = new Set<string>(PERSONAL_PERSPECTIVE_REFUSAL_KINDS_V01);
const futureReviewActions = new Set<string>(
  PERSONAL_PERSPECTIVE_FUTURE_REVIEW_ACTIONS_V01,
);

class IssueCollector {
  private readonly collected = new Map<
    string,
    PersonalPerspectiveValidationIssueV01
  >();
  private total = 0;
  private sawBlocked = false;

  add(
    category: PersonalPerspectiveValidationCategoryV01,
    code: string,
    path: string | null,
    blocked = false,
  ): void {
    this.total += 1;
    this.sawBlocked ||= blocked;
    const issue: PersonalPerspectiveValidationIssueV01 = {
      severity: "error",
      category,
      code,
      path,
      blocked,
    };
    const key = issueDedupKey(issue);
    if (!this.collected.has(key)) {
      this.collected.set(key, issue);
    }
    if (
      this.collected.size >
      PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.validation_issues
    ) {
      const largestKey = [...this.collected.entries()]
        .sort((left, right) =>
          compareProtocolCodeUnitsV01(
            issueSortKey(right[1]),
            issueSortKey(left[1]),
          ),
        )[0]?.[0];
      if (largestKey) this.collected.delete(largestKey);
    }
  }

  result(): {
    issues: PersonalPerspectiveValidationIssueV01[];
    issueCount: number;
    truncated: boolean;
    blockedSeen: boolean;
  } {
    const issues = [...this.collected.values()].sort((left, right) =>
      compareProtocolCodeUnitsV01(issueSortKey(left), issueSortKey(right)),
    );
    return {
      issues,
      issueCount: this.total,
      truncated: this.total > issues.length,
      blockedSeen: this.sawBlocked,
    };
  }
}

function issueDedupKey(issue: PersonalPerspectiveValidationIssueV01): string {
  return [
    issue.blocked ? "1" : "0",
    issue.category,
    issue.path ?? "",
    issue.code,
  ].join("|");
}

function issueSortKey(issue: PersonalPerspectiveValidationIssueV01): string {
  return [
    issue.blocked ? "0" : "1",
    issue.category,
    issue.path ?? "",
    issue.code,
  ].join("|");
}

export function validatePersonalPerspectiveSemanticCasebookV01(
  input: unknown,
): PersonalPerspectiveValidationResultV01 {
  const sink = new IssueCollector();
  if (!validateJsonSafety(input, "$", sink, new WeakSet<object>(), 0)) {
    return validationResult(input, sink, null);
  }
  scanUnsafeMaterial(input, "$", sink, 0);

  if (!isProtocolRecordV01(input)) {
    sink.add("structure", "casebook_non_object", "$", false);
    return validationResult(input, sink, null);
  }

  validateRootStructure(input, sink);
  const structurallyUsable = hasStructurallyUsableCollections(input);
  if (structurallyUsable) {
    validateReferencesAndSemantics(input, sink);
    validateIntegrity(input, sink);
  }
  return validationResult(
    input,
    sink,
    structurallyUsable
      ? (input as unknown as PersonalPerspectiveSemanticCasebookV01)
      : null,
  );
}

function validateJsonSafety(
  value: unknown,
  path: string,
  sink: IssueCollector,
  ancestors: WeakSet<object>,
  depth: number,
): boolean {
  if (depth > 24) {
    sink.add("structure", "input_nesting_too_deep", path);
    return false;
  }
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }
  if (typeof value === "number") {
    if (Number.isFinite(value)) return true;
    sink.add("structure", "non_finite_number_forbidden", path);
    return false;
  }
  if (typeof value !== "object") {
    sink.add("structure", "non_json_scalar_forbidden", path);
    return false;
  }
  const objectValue = value as object;
  if (ancestors.has(objectValue)) {
    sink.add("structure", "cyclic_input_forbidden", path);
    return false;
  }
  const prototype = Object.getPrototypeOf(objectValue);
  if (
    !Array.isArray(value) &&
    prototype !== Object.prototype &&
    prototype !== null
  ) {
    sink.add("structure", "non_plain_object_forbidden", path);
    return false;
  }
  ancestors.add(objectValue);
  let valid = true;
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      if (!validateJsonSafety(item, `${path}[${index}]`, sink, ancestors, depth + 1)) {
        valid = false;
      }
    });
  } else {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (
        !validateJsonSafety(
          nested,
          `${path}.${safeKnownPathSegment(key)}`,
          sink,
          ancestors,
          depth + 1,
        )
      ) {
        valid = false;
      }
    }
  }
  ancestors.delete(objectValue);
  return valid;
}

function validationResult(
  input: unknown,
  sink: IssueCollector,
  candidate: PersonalPerspectiveSemanticCasebookV01 | null,
): PersonalPerspectiveValidationResultV01 {
  const { issues, issueCount, truncated, blockedSeen } = sink.result();
  const valid = issueCount === 0 && candidate !== null;
  const admitted = valid
    ? candidate.cases
        .filter((caseItem) => caseItem.case_type === "candidate")
        .map((caseItem) => caseItem.case_id)
        .sort(compareProtocolCodeUnitsV01)
    : [];
  return {
    status: valid ? "valid" : blockedSeen ? "blocked" : "invalid",
    contract_version:
      isProtocolRecordV01(input) &&
      input.casebook_version === PERSONAL_PERSPECTIVE_CASEBOOK_VERSION_V01
        ? PERSONAL_PERSPECTIVE_CASEBOOK_VERSION_V01
        : null,
    issue_count: issueCount,
    issues_truncated: truncated,
    issues,
    admitted_candidate_count: admitted.length,
    admitted_case_refs: admitted,
    normalized: valid ? clone(candidate) : null,
  };
}

function hasStructurallyUsableCollections(
  root: Record<string, unknown>,
): boolean {
  return (
    Array.isArray(root.sources) &&
    root.sources.length <= PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.sources &&
    Array.isArray(root.cases) &&
    root.cases.length <= PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.cases &&
    Array.isArray(root.coverage_matrix) &&
    root.coverage_matrix.length <=
      PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.coverage_entries &&
    isProtocolRecordV01(root.classification) &&
    isProtocolRecordV01(root.experiment) &&
    isProtocolRecordV01(root.semantic_definitions) &&
    isProtocolRecordV01(root.privacy_boundary) &&
    isProtocolRecordV01(root.retention_boundary) &&
    isProtocolRecordV01(root.authority_boundary) &&
    isProtocolRecordV01(root.integrity)
  );
}

function validateRootStructure(
  root: Record<string, unknown>,
  sink: IssueCollector,
): void {
  rejectUnknownKeys(root, rootKeys, "$", sink);
  exactValue(
    root.casebook_version,
    PERSONAL_PERSPECTIVE_CASEBOOK_VERSION_V01,
    "$.casebook_version",
    "unsupported_casebook_version",
    sink,
  );
  exactValue(
    root.semantic_definition_version,
    PERSONAL_PERSPECTIVE_SEMANTIC_DEFINITION_VERSION_V01,
    "$.semantic_definition_version",
    "unsupported_semantic_definition_version",
    sink,
  );
  exactValue(
    root.deterministic_method_version,
    PERSONAL_PERSPECTIVE_CASEBOOK_METHOD_VERSION_V01,
    "$.deterministic_method_version",
    "unsupported_deterministic_method_version",
    sink,
  );
  boundedString(root.casebook_id, "$.casebook_id", 64, sink);
  strictTimestamp(root.defined_at, "$.defined_at", sink);

  validateExactRecord(
    root.classification,
    classification,
    classificationKeys,
    "$.classification",
    "classification_mismatch",
    sink,
  );
  validateExperiment(root.experiment, sink);
  validateSemanticDefinitions(root.semantic_definitions, sink);

  if (!Array.isArray(root.sources)) {
    sink.add("structure", "sources_malformed_collection", "$.sources");
  } else {
    if (root.sources.length > PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.sources) {
      sink.add("structure", "source_collection_oversized", "$.sources");
    }
    root.sources
      .slice(0, PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.sources)
      .forEach((source, index) =>
        validateSourceStructure(source, `$.sources[${index}]`, sink),
      );
  }

  if (!Array.isArray(root.cases)) {
    sink.add("structure", "cases_malformed_collection", "$.cases");
  } else {
    if (root.cases.length > PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.cases) {
      sink.add("structure", "case_collection_oversized", "$.cases");
    }
    root.cases
      .slice(0, PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.cases)
      .forEach((caseItem, index) =>
        validateCaseStructure(caseItem, `$.cases[${index}]`, sink),
      );
  }

  if (!Array.isArray(root.coverage_matrix)) {
    sink.add(
      "structure",
      "coverage_matrix_malformed_collection",
      "$.coverage_matrix",
    );
  } else {
    if (
      root.coverage_matrix.length >
      PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.coverage_entries
    ) {
      sink.add("structure", "coverage_matrix_oversized", "$.coverage_matrix");
    }
    root.coverage_matrix
      .slice(0, PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.coverage_entries)
      .forEach((entry, index) => {
        const path = `$.coverage_matrix[${index}]`;
        if (!isProtocolRecordV01(entry)) {
          sink.add("structure", "coverage_entry_malformed", path);
          return;
        }
        rejectUnknownKeys(entry, coverageKeys, path, sink);
        boundedString(entry.requirement_id, `${path}.requirement_id`, 96, sink);
        stringArray(entry.case_refs, `${path}.case_refs`, 16, 64, sink);
        validateNormalizedStringSet(entry.case_refs, `${path}.case_refs`, sink);
      });
  }

  validateExactRecord(
    root.privacy_boundary,
    privacyBoundary,
    privacyKeys,
    "$.privacy_boundary",
    "privacy_boundary_mismatch",
    sink,
  );
  validateExactRecord(
    root.retention_boundary,
    retentionBoundary,
    retentionKeys,
    "$.retention_boundary",
    "retention_boundary_mismatch",
    sink,
  );
  validateFalseBoundary(root.authority_boundary, "$.authority_boundary", sink);
  validateIntegrityStructure(root.integrity, "$.integrity", sink);
}

function validateExperiment(value: unknown, sink: IssueCollector): void {
  const path = "$.experiment";
  if (!isProtocolRecordV01(value)) {
    sink.add("structure", "experiment_malformed", path);
    return;
  }
  rejectUnknownKeys(value, experimentKeys, path, sink);
  for (const field of [
    "experiment_id",
    "question",
    "hypothesis",
    "baseline",
    "counterexample_method",
    "retention",
  ]) {
    boundedString(
      value[field],
      `${path}.${field}`,
      field === "hypothesis"
        ? PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.rationale_characters
        : PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.summary_or_proposition_characters,
      sink,
    );
  }
  exactValue(
    value.method,
    experiment.method,
    `${path}.method`,
    "experiment_method_mismatch",
    sink,
  );
  exactValue(
    value.method_version,
    experiment.method_version,
    `${path}.method_version`,
    "experiment_method_version_mismatch",
    sink,
  );
  strictTimestamp(value.defined_at, `${path}.defined_at`, sink);
  for (const field of [
    "inputs",
    "excluded_inputs",
    "expected_signal",
    "failure_criteria",
    "authority_boundary",
    "productization_gate",
    "limitations",
  ]) {
    stringArray(
      value[field],
      `${path}.${field}`,
      PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.experiment_list_items,
      PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.list_item_characters,
      sink,
    );
  }
  stringArray(
    value.reproduction_steps,
    `${path}.reproduction_steps`,
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.experiment_list_items,
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.list_item_characters,
    sink,
  );
  if (
    canonicalizeProtocolValueV01(value) !==
    canonicalizeProtocolValueV01(experiment)
  ) {
    sink.add("semantic", "experiment_metadata_mismatch", path, true);
  }
}

function validateSemanticDefinitions(
  value: unknown,
  sink: IssueCollector,
): void {
  const path = "$.semantic_definitions";
  if (!isProtocolRecordV01(value)) {
    sink.add("structure", "semantic_definitions_malformed", path);
    return;
  }
  rejectUnknownKeys(value, semanticDefinitionKeys, path, sink);
  if (
    canonicalizeProtocolValueV01(value) !==
    canonicalizeProtocolValueV01(PERSONAL_PERSPECTIVE_SEMANTIC_DEFINITIONS_V01)
  ) {
    sink.add("semantic", "semantic_definitions_mismatch", path);
  }
}

function validateSourceStructure(
  value: unknown,
  path: string,
  sink: IssueCollector,
): void {
  if (!isProtocolRecordV01(value)) {
    sink.add("structure", "source_malformed", path);
    return;
  }
  rejectUnknownKeys(value, sourceKeys, path, sink);
  boundedString(value.source_id, `${path}.source_id`, 64, sink);
  boundedString(value.source_key, `${path}.source_key`, 96, sink);
  enumValue(value.source_kind, sourceKinds, `${path}.source_kind`, "source_kind_invalid", sink);
  boundedString(
    value.summary,
    `${path}.summary`,
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.source_summary_characters,
    sink,
  );
  validateScope(value.scope, `${path}.scope`, sink);
  exactBoolean(value.synthetic, true, `${path}.synthetic`, "source_not_synthetic", sink);
  exactBoolean(
    value.authenticity_established,
    false,
    `${path}.authenticity_established`,
    "source_authenticity_claimed",
    sink,
  );
  validateFalseBoundary(value.authority_boundary, `${path}.authority_boundary`, sink);
  validateIntegrityStructure(value.integrity, `${path}.integrity`, sink);
}

function validateCaseStructure(
  value: unknown,
  path: string,
  sink: IssueCollector,
): void {
  if (!isProtocolRecordV01(value)) {
    sink.add("structure", "case_malformed", path);
    return;
  }
  rejectUnknownKeys(value, caseKeys, path, sink);
  boundedString(value.case_id, `${path}.case_id`, 64, sink);
  boundedString(value.case_key, `${path}.case_key`, 96, sink);
  enumValue(
    value.case_type,
    new Set(["candidate", "refusal", "tombstone"]),
    `${path}.case_type`,
    "case_type_invalid",
    sink,
  );
  boundedString(
    value.title,
    `${path}.title`,
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.title_characters,
    sink,
  );
  boundedString(
    value.summary,
    `${path}.summary`,
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.summary_or_proposition_characters,
    sink,
  );
  nullableBoundedString(
    value.proposition,
    `${path}.proposition`,
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.summary_or_proposition_characters,
    sink,
  );
  nullableBoundedString(value.tombstone_ref, `${path}.tombstone_ref`, 96, sink);
  enumValue(value.semantic_kind, semanticKinds, `${path}.semantic_kind`, "semantic_kind_invalid", sink);
  enumValue(
    value.epistemic_origin,
    epistemicOrigins,
    `${path}.epistemic_origin`,
    "epistemic_origin_invalid",
    sink,
  );
  validateScope(value.scope, `${path}.scope`, sink);
  validateSourceRelations(value.source_relations, `${path}.source_relations`, sink);
  validateCaseRelations(value.case_relations, `${path}.case_relations`, sink);
  validateCounterexample(value.counterexample, `${path}.counterexample`, sink);
  if (value.candidate_status !== null) {
    enumValue(
      value.candidate_status,
      candidateStatuses,
      `${path}.candidate_status`,
      "candidate_status_invalid",
      sink,
    );
  }
  if (value.refusal_kind !== null) {
    enumValue(
      value.refusal_kind,
      refusalKinds,
      `${path}.refusal_kind`,
      "refusal_kind_invalid",
      sink,
    );
  }
  boundedString(
    value.rationale,
    `${path}.rationale`,
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.rationale_characters,
    sink,
  );
  stringArray(
    value.limitations,
    `${path}.limitations`,
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.limitations,
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.limitation_characters,
    sink,
  );
  validateNormalizedStringSet(value.limitations, `${path}.limitations`, sink);
  validateEnumArray(
    value.future_review_actions,
    futureReviewActions,
    `${path}.future_review_actions`,
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.future_review_actions,
    "future_review_action_invalid",
    sink,
  );
  validateNormalizedStringSet(
    value.future_review_actions,
    `${path}.future_review_actions`,
    sink,
  );
  exactBoolean(value.review_required, true, `${path}.review_required`, "review_required_false", sink);
  validateReuse(value.reuse, `${path}.reuse`, sink);
  validateSemanticAssertions(value.semantic_assertions, `${path}.semantic_assertions`, sink);
  boundedString(
    value.non_authority_summary,
    `${path}.non_authority_summary`,
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.summary_or_proposition_characters,
    sink,
  );
  validateFalseBoundary(value.authority_boundary, `${path}.authority_boundary`, sink);
  validateIntegrityStructure(value.integrity, `${path}.integrity`, sink);
}

function validateScope(value: unknown, path: string, sink: IssueCollector): void {
  if (!isProtocolRecordV01(value)) {
    sink.add("structure", "scope_malformed", path);
    return;
  }
  rejectUnknownKeys(value, scopeKeys, path, sink);
  enumValue(value.kind, scopeKinds, `${path}.kind`, "scope_kind_invalid", sink);
  stringArray(
    value.qualifiers,
    `${path}.qualifiers`,
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.scope_qualifiers,
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.scope_qualifier_characters,
    sink,
  );
  validateNormalizedStringSet(value.qualifiers, `${path}.qualifiers`, sink);
  nullableBoundedString(value.project_scope_ref, `${path}.project_scope_ref`, 96, sink);
  nullableTimestamp(value.valid_from, `${path}.valid_from`, sink);
  nullableTimestamp(value.valid_until, `${path}.valid_until`, sink);
  exactBoolean(value.ambiguous, false, `${path}.ambiguous`, "scope_ambiguous", sink);
  exactBoolean(
    value.sharing_outside_scope_authorized,
    false,
    `${path}.sharing_outside_scope_authorized`,
    "scope_sharing_authorized",
    sink,
  );
}

function validateSourceRelations(value: unknown, path: string, sink: IssueCollector): void {
  if (!Array.isArray(value)) {
    sink.add("structure", "source_relations_malformed_collection", path);
    return;
  }
  if (value.length > PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.source_relations) {
    sink.add("structure", "source_relations_oversized", path);
  }
  value.forEach((relation, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isProtocolRecordV01(relation)) {
      sink.add("structure", "source_relation_malformed", itemPath);
      return;
    }
    rejectUnknownKeys(relation, sourceRelationKeys, itemPath, sink);
    boundedString(relation.source_id, `${itemPath}.source_id`, 64, sink);
    enumValue(
      relation.relation,
      sourceRelations,
      `${itemPath}.relation`,
      "source_relation_invalid",
      sink,
    );
  });
  validateNormalizedCanonicalSet(value, path, sink);
}

function validateCaseRelations(value: unknown, path: string, sink: IssueCollector): void {
  if (!Array.isArray(value)) {
    sink.add("structure", "case_relations_malformed_collection", path);
    return;
  }
  if (value.length > PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.case_relations) {
    sink.add("structure", "case_relations_oversized", path);
  }
  value.forEach((relation, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isProtocolRecordV01(relation)) {
      sink.add("structure", "case_relation_malformed", itemPath);
      return;
    }
    rejectUnknownKeys(relation, caseRelationKeys, itemPath, sink);
    boundedString(relation.target_case_id, `${itemPath}.target_case_id`, 64, sink);
    enumValue(
      relation.relation,
      caseRelations,
      `${itemPath}.relation`,
      "case_relation_invalid",
      sink,
    );
    exactValue(
      relation.target_effect,
      "preserves_target",
      `${itemPath}.target_effect`,
      "lower_scope_rewrite_attempted",
      sink,
    );
  });
  validateNormalizedCanonicalSet(value, path, sink);
}

function validateCounterexample(value: unknown, path: string, sink: IssueCollector): void {
  if (!isProtocolRecordV01(value)) {
    sink.add("structure", "counterexample_malformed", path);
    return;
  }
  rejectUnknownKeys(value, counterexampleKeys, path, sink);
  enumValue(
    value.status,
    counterexampleStatuses,
    `${path}.status`,
    "counterexample_status_invalid",
    sink,
  );
  stringArray(
    value.source_refs,
    `${path}.source_refs`,
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.counterexample_refs,
    64,
    sink,
  );
  validateNormalizedStringSet(value.source_refs, `${path}.source_refs`, sink);
  nullableBoundedString(
    value.search_summary,
    `${path}.search_summary`,
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.counterexample_summary_characters,
    sink,
  );
  nullableBoundedString(
    value.justification,
    `${path}.justification`,
    PERSONAL_PERSPECTIVE_CASEBOOK_BOUNDS_V01.counterexample_summary_characters,
    sink,
  );
  booleanValue(value.search_completed, `${path}.search_completed`, sink);
  booleanValue(value.completeness_claimed, `${path}.completeness_claimed`, sink);
  booleanValue(value.impossibility_claimed, `${path}.impossibility_claimed`, sink);
}

function validateReuse(value: unknown, path: string, sink: IssueCollector): void {
  if (!isProtocolRecordV01(value)) {
    sink.add("structure", "reuse_malformed", path);
    return;
  }
  rejectUnknownKeys(value, reuseKeys, path, sink);
  enumValue(
    value.eligibility,
    new Set(["review_required", "re_evaluation_required", "prohibited"]),
    `${path}.eligibility`,
    "reuse_eligibility_invalid",
    sink,
  );
  for (const field of [
    "persistence_authorized",
    "task_context_selection_authorized",
    "cross_project_sharing_authorized",
    "automatic_revival_authorized",
    "rehydration_authorized",
  ]) {
    exactBoolean(
      value[field],
      false,
      `${path}.${field}`,
      `reuse_${field}_true`,
      sink,
    );
  }
  booleanValue(value.synthetic_content_retained, `${path}.synthetic_content_retained`, sink);
}

function validateSemanticAssertions(value: unknown, path: string, sink: IssueCollector): void {
  if (!isProtocolRecordV01(value)) {
    sink.add("structure", "semantic_assertions_malformed", path);
    return;
  }
  rejectUnknownKeys(value, semanticAssertionKeys, path, sink);
  for (const field of PERSONAL_PERSPECTIVE_SEMANTIC_ASSERTION_FLAGS_V01) {
    if (value[field] !== false) {
      sink.add("semantic", `semantic_assertion_true_${field}`, `${path}.${field}`, true);
    }
  }
}

function validateFalseBoundary(value: unknown, path: string, sink: IssueCollector): void {
  if (!isProtocolRecordV01(value)) {
    sink.add("structure", "authority_boundary_malformed", path);
    return;
  }
  rejectUnknownKeys(value, authorityKeys, path, sink, true);
  for (const field of PERSONAL_PERSPECTIVE_AUTHORITY_FLAGS_V01) {
    if (value[field] !== false) {
      sink.add("semantic", `prohibited_authority_true_${field}`, `${path}.${field}`, true);
    }
  }
}

function validateIntegrityStructure(value: unknown, path: string, sink: IssueCollector): void {
  if (!isProtocolRecordV01(value)) {
    sink.add("structure", "integrity_malformed", path);
    return;
  }
  rejectUnknownKeys(value, integrityKeys, path, sink);
  exactValue(
    value.algorithm,
    "sha256_canonical_json_v0.1",
    `${path}.algorithm`,
    "integrity_algorithm_invalid",
    sink,
  );
  exactValue(
    value.method_version,
    PERSONAL_PERSPECTIVE_CASEBOOK_METHOD_VERSION_V01,
    `${path}.method_version`,
    "integrity_method_version_invalid",
    sink,
  );
  if (
    typeof value.fingerprint !== "string" ||
    !/^sha256:[0-9a-f]{64}$/.test(value.fingerprint)
  ) {
    sink.add("structure", "fingerprint_malformed", `${path}.fingerprint`);
  }
  boundedString(value.fingerprint_scope, `${path}.fingerprint_scope`, 512, sink);
  stringArray(value.omitted_fields, `${path}.omitted_fields`, 4, 96, sink);
  const expectedScope = path === "$.integrity"
    ? PERSONAL_PERSPECTIVE_CASEBOOK_FINGERPRINT_SCOPE_V01
    : path.includes(".sources[")
      ? PERSONAL_PERSPECTIVE_SOURCE_FINGERPRINT_SCOPE_V01
      : PERSONAL_PERSPECTIVE_CASE_FINGERPRINT_SCOPE_V01;
  if (value.fingerprint_scope !== expectedScope) {
    sink.add("semantic", "integrity_fingerprint_scope_mismatch", `${path}.fingerprint_scope`, true);
  }
  if (
    canonicalizeProtocolValueV01(value.omitted_fields) !==
    canonicalizeProtocolValueV01(["integrity.fingerprint"])
  ) {
    sink.add("semantic", "integrity_omitted_fields_mismatch", `${path}.omitted_fields`, true);
  }
}

function validateReferencesAndSemantics(
  root: Record<string, unknown>,
  sink: IssueCollector,
): void {
  const rawSources = root.sources as unknown[];
  const rawCases = root.cases as unknown[];
  const sources = rawSources.filter(isProtocolRecordV01);
  const cases = rawCases.filter(isProtocolRecordV01);
  validateRecordCollectionOrder(rawSources, "source_id", "$.sources", sink);
  validateRecordCollectionOrder(rawCases, "case_id", "$.cases", sink);

  const sourcesById = collectUniqueRecords(
    sources,
    "source_id",
    "duplicate_source_id",
    "conflicting_source_identity",
    "$.sources",
    sink,
  );
  const casesById = collectUniqueRecords(
    cases,
    "case_id",
    "duplicate_case_id",
    "conflicting_case_identity",
    "$.cases",
    sink,
  );
  collectUniqueRecords(
    sources,
    "source_key",
    "duplicate_source_key",
    "conflicting_source_key",
    "$.sources",
    sink,
  );
  collectUniqueRecords(
    cases,
    "case_key",
    "duplicate_case_key",
    "conflicting_case_key",
    "$.cases",
    sink,
  );

  for (const [index, source] of sources.entries()) {
    const path = `$.sources[${index}]`;
    const sourceId = stringValue(source.source_id);
    if (!sourceId || !/^ppscb-source-v0-1:[0-9a-f]{24}$/.test(sourceId)) {
      sink.add("structure", "source_id_malformed", `${path}.source_id`);
    } else if (sourceId !== deriveSourceId(source as never)) {
      sink.add("integrity", "source_id_mismatch", `${path}.source_id`);
    }
    if (source.synthetic !== true) {
      sink.add("semantic", "source_not_synthetic", `${path}.synthetic`, true);
    }
    if (source.authenticity_established !== false) {
      sink.add(
        "semantic",
        "source_integrity_treated_as_authenticity",
        `${path}.authenticity_established`,
        true,
      );
    }
    if (
      source.source_kind === "synthetic_deletion_instruction" &&
      (source.source_key !== PERSONAL_PERSPECTIVE_DELETION_SOURCE_KEY_V01 ||
        source.summary !== PERSONAL_PERSPECTIVE_DELETION_SOURCE_SUMMARY_V01 ||
        !matchesFixedScope(
          source.scope,
          "workspace_conceptual",
          PERSONAL_PERSPECTIVE_DELETION_SOURCE_SCOPE_QUALIFIER_V01,
        ))
    ) {
      sink.add(
        "semantic",
        "deleted_source_content_boundary_mismatch",
        path,
        true,
      );
    }
    validateScopeSemantics(source.scope, `${path}.scope`, sink);
  }

  for (const [index, caseItem] of cases.entries()) {
    const path = `$.cases[${index}]`;
    const caseId = stringValue(caseItem.case_id);
    if (!caseId || !/^ppscb-case-v0-1:[0-9a-f]{24}$/.test(caseId)) {
      sink.add("structure", "case_id_malformed", `${path}.case_id`);
    } else if (caseId !== deriveCaseId(caseItem as never)) {
      sink.add("integrity", "case_id_mismatch", `${path}.case_id`);
    }
    validateScopeSemantics(caseItem.scope, `${path}.scope`, sink);
    validateCaseReferenceSemantics(
      caseItem,
      path,
      sourcesById,
      casesById,
      sink,
    );
    validateCaseMeaning(caseItem, path, sourcesById, casesById, sink);
  }

  validateCoverage(
    root.coverage_matrix as unknown[],
    casesById,
    sourcesById,
    sink,
  );
  validateRootSemanticBoundary(root, sink);
}

function collectUniqueRecords(
  records: Record<string, unknown>[],
  identityField: string,
  duplicateCode: string,
  conflictCode: string,
  path: string,
  sink: IssueCollector,
): Map<string, Record<string, unknown>> {
  const values = new Map<string, Record<string, unknown>>();
  const canonicals = new Map<string, string>();
  records.forEach((record, index) => {
    const identity = stringValue(record[identityField]);
    if (!identity) return;
    const canonical = canonicalizeProtocolValueV01(record);
    if (values.has(identity)) {
      sink.add("reference", duplicateCode, `${path}[${index}]`);
      if (canonicals.get(identity) !== canonical) {
        sink.add("reference", conflictCode, `${path}[${index}]`, true);
      }
      return;
    }
    values.set(identity, record);
    canonicals.set(identity, canonical);
  });
  return values;
}

function validateScopeSemantics(
  value: unknown,
  path: string,
  sink: IssueCollector,
): void {
  if (!isProtocolRecordV01(value)) return;
  const kind = stringValue(value.kind);
  const projectRef = value.project_scope_ref;
  if (kind === "project_specific") {
    if (
      typeof projectRef !== "string" ||
      !/^synthetic-project-scope:fictional-[a-z0-9][a-z0-9-]{0,53}$/.test(
        projectRef,
      )
    ) {
      sink.add("semantic", "project_scope_ref_invalid", `${path}.project_scope_ref`, true);
    }
    if (
      projectRef === "project:user" ||
      projectRef === "project:personal" ||
      projectRef === "project:global" ||
      projectRef === "synthetic-project-scope:user" ||
      projectRef === "synthetic-project-scope:personal" ||
      projectRef === "synthetic-project-scope:global"
    ) {
      sink.add("semantic", "fake_personal_project_id", `${path}.project_scope_ref`, true);
    }
  } else if (projectRef !== null) {
    sink.add("semantic", "project_scope_ref_not_applicable", `${path}.project_scope_ref`);
  }
  if (!Array.isArray(value.qualifiers) || value.qualifiers.length === 0) {
    sink.add("semantic", "scope_qualifier_required", `${path}.qualifiers`);
  }
  const from = value.valid_from;
  const until = value.valid_until;
  if (kind === "time_bounded") {
    if (parseStrictIsoTimestampV01(from) === null || parseStrictIsoTimestampV01(until) === null) {
      sink.add("semantic", "time_bounded_scope_interval_required", path);
    } else if (
      (parseStrictIsoTimestampV01(from) ?? 0) >=
      (parseStrictIsoTimestampV01(until) ?? 0)
    ) {
      sink.add("semantic", "time_bounded_scope_interval_invalid", path);
    }
  } else if (from !== null || until !== null) {
    sink.add("semantic", "scope_interval_not_applicable", path);
  }
  if (value.ambiguous !== false) {
    sink.add("semantic", "ambiguous_scope_not_admitted", `${path}.ambiguous`, true);
  }
  if (value.sharing_outside_scope_authorized !== false) {
    sink.add("semantic", "scope_sharing_authorized", `${path}.sharing_outside_scope_authorized`, true);
  }
}

function validateCaseReferenceSemantics(
  caseItem: Record<string, unknown>,
  path: string,
  sourcesById: Map<string, Record<string, unknown>>,
  casesById: Map<string, Record<string, unknown>>,
  sink: IssueCollector,
): void {
  const sourceRelationItems = Array.isArray(caseItem.source_relations)
    ? caseItem.source_relations.filter(isProtocolRecordV01)
    : [];
  const relationIdentity = new Map<string, string>();
  for (const [index, relation] of sourceRelationItems.entries()) {
    const sourceId = stringValue(relation.source_id);
    if (!sourceId || !sourcesById.has(sourceId)) {
      sink.add(
        "reference",
        "source_ref_unresolved",
        `${path}.source_relations[${index}].source_id`,
      );
      continue;
    }
    const prior = relationIdentity.get(sourceId);
    const relationKind = stringValue(relation.relation) ?? "";
    if (prior && prior !== relationKind) {
      sink.add(
        "reference",
        "duplicate_conflicting_source_relation",
        `${path}.source_relations[${index}]`,
        true,
      );
    }
    relationIdentity.set(sourceId, relationKind);
  }
  if (sourceRelationItems.length === 0) {
    sink.add("semantic", "admitted_case_source_required", `${path}.source_relations`);
  }

  const caseRelationItems = Array.isArray(caseItem.case_relations)
    ? caseItem.case_relations.filter(isProtocolRecordV01)
    : [];
  for (const [index, relation] of caseRelationItems.entries()) {
    const targetId = stringValue(relation.target_case_id);
    const target = targetId ? casesById.get(targetId) : undefined;
    if (!target) {
      sink.add(
        "reference",
        "case_relation_target_unresolved",
        `${path}.case_relations[${index}].target_case_id`,
      );
      continue;
    }
    if (targetId === caseItem.case_id) {
      sink.add(
        "semantic",
        "case_relation_self_target_forbidden",
        `${path}.case_relations[${index}].target_case_id`,
        true,
      );
    }
    if (relation.target_effect !== "preserves_target") {
      sink.add(
        "semantic",
        "lower_scope_override_rewrites_higher_scope",
        `${path}.case_relations[${index}].target_effect`,
        true,
      );
    }
    validateCaseRelationScope(caseItem, target, relation, `${path}.case_relations[${index}]`, sink);
  }

  const counterexample = isProtocolRecordV01(caseItem.counterexample)
    ? caseItem.counterexample
    : null;
  if (counterexample && Array.isArray(counterexample.source_refs)) {
    for (const [index, ref] of counterexample.source_refs.entries()) {
      if (typeof ref !== "string" || !sourcesById.has(ref)) {
        sink.add(
          "reference",
          "counterexample_ref_unresolved",
          `${path}.counterexample.source_refs[${index}]`,
        );
      }
    }
  }
}

function validateCaseRelationScope(
  source: Record<string, unknown>,
  target: Record<string, unknown>,
  relation: Record<string, unknown>,
  path: string,
  sink: IssueCollector,
): void {
  const relationKind = stringValue(relation.relation);
  const sourceScope = isProtocolRecordV01(source.scope) ? source.scope : null;
  const targetScope = isProtocolRecordV01(target.scope) ? target.scope : null;
  if (!sourceScope || !targetScope) return;
  const sourceKind = stringValue(sourceScope.kind);
  const targetKind = stringValue(targetScope.kind);
  if (relationKind === "narrows" || relationKind === "exception_to") {
    if (!isNarrowerScope(sourceKind, targetKind)) {
      sink.add("semantic", "scope_relation_not_narrower", path);
    }
  }
  if (relationKind === "exception_to" && source.semantic_kind !== "known_exception") {
    sink.add("semantic", "exception_relation_kind_mismatch", path);
  }
  if (
    typeof sourceScope.project_scope_ref === "string" &&
    typeof targetScope.project_scope_ref === "string" &&
    sourceScope.project_scope_ref !== targetScope.project_scope_ref
  ) {
    sink.add("semantic", "cross_project_case_relation", path, true);
  }
  const scopesEqual = equivalentScope(sourceScope, targetScope);
  if (relationKind === "counterexample_to") {
    if (!scopesEqual && !isNarrowerScope(sourceKind, targetKind)) {
      sink.add("semantic", "cross_scope_case_relation", path, true);
    }
  } else if (
    relationKind !== "narrows" &&
    relationKind !== "exception_to" &&
    !scopesEqual
  ) {
    sink.add("semantic", "cross_scope_case_relation", path, true);
  }
}

function equivalentScope(
  left: Record<string, unknown>,
  right: Record<string, unknown>,
): boolean {
  return (
    left.kind === right.kind &&
    canonicalizeProtocolValueV01(left.qualifiers) ===
      canonicalizeProtocolValueV01(right.qualifiers) &&
    left.project_scope_ref === right.project_scope_ref &&
    left.valid_from === right.valid_from &&
    left.valid_until === right.valid_until
  );
}

function matchesFixedScope(
  value: unknown,
  kind: PersonalPerspectiveScopeKindV01,
  qualifier: string,
): boolean {
  return (
    isProtocolRecordV01(value) &&
    value.kind === kind &&
    canonicalizeProtocolValueV01(value.qualifiers) ===
      canonicalizeProtocolValueV01([qualifier]) &&
    value.project_scope_ref === null &&
    value.valid_from === null &&
    value.valid_until === null &&
    value.ambiguous === false &&
    value.sharing_outside_scope_authorized === false
  );
}

function matchesFixedDeletionCounterexample(value: unknown): boolean {
  return (
    isProtocolRecordV01(value) &&
    canonicalizeProtocolValueV01(value) ===
      canonicalizeProtocolValueV01({
        status: "not_applicable",
        source_refs: [],
        search_summary: null,
        justification:
          PERSONAL_PERSPECTIVE_NOT_APPLICABLE_JUSTIFICATION_V01,
        search_completed: false,
        completeness_claimed: false,
        impossibility_claimed: false,
      })
  );
}

function isNarrowerScope(source: string | null, target: string | null): boolean {
  if (!source || !target || source === target) return false;
  if (target === "workspace_conceptual") return true;
  return source === "exception";
}

function validateCaseMeaning(
  caseItem: Record<string, unknown>,
  path: string,
  sourcesById: Map<string, Record<string, unknown>>,
  casesById: Map<string, Record<string, unknown>>,
  sink: IssueCollector,
): void {
  const caseType = stringValue(caseItem.case_type);
  const semanticKind = stringValue(caseItem.semantic_kind);
  const origin = stringValue(caseItem.epistemic_origin);
  const status = caseItem.candidate_status;
  const refusalKind = caseItem.refusal_kind;
  const scope = isProtocolRecordV01(caseItem.scope) ? caseItem.scope : null;
  const scopeKind = scope ? stringValue(scope.kind) : null;
  const sourceRecords = resolvedCaseSources(caseItem, sourcesById);
  const sourceKindSet = new Set(
    sourceRecords.map((source) => stringValue(source.source_kind)),
  );
  const reuse = isProtocolRecordV01(caseItem.reuse) ? caseItem.reuse : null;

  if (!Array.isArray(caseItem.limitations) || caseItem.limitations.length === 0) {
    sink.add("semantic", "case_limitation_required", `${path}.limitations`);
  }
  if (
    !Array.isArray(caseItem.future_review_actions) ||
    caseItem.future_review_actions.length === 0
  ) {
    sink.add(
      "semantic",
      "future_review_expectation_required",
      `${path}.future_review_actions`,
    );
  }

  for (const source of sourceRecords) {
    const sourceScope = isProtocolRecordV01(source.scope) ? source.scope : null;
    const sourceProject = sourceScope?.project_scope_ref;
    const caseProject = scope?.project_scope_ref;
    if (
      typeof sourceProject === "string" &&
      typeof caseProject === "string" &&
      sourceProject !== caseProject
    ) {
      sink.add(
        "semantic",
        "cross_project_source_relation",
        `${path}.source_relations`,
        true,
      );
    }
    if (
      sourceScope?.kind === "project_specific" &&
      scopeKind === "workspace_conceptual"
    ) {
      sink.add(
        "semantic",
        "project_source_globalized",
        `${path}.source_relations`,
        true,
      );
    }
  }
  if (Array.isArray(caseItem.source_relations)) {
    for (const relation of caseItem.source_relations.filter(isProtocolRecordV01)) {
      const sourceId = stringValue(relation.source_id);
      const source = sourceId ? sourcesById.get(sourceId) : null;
      if (source) {
        validateSourceRelationMeaning(
          caseItem,
          source,
          relation,
          `${path}.source_relations`,
          sink,
        );
      }
    }
  }

  if (
    caseItem.non_authority_summary !==
    PERSONAL_PERSPECTIVE_NON_AUTHORITY_SUMMARY_V01
  ) {
    sink.add(
      "semantic",
      "case_non_authority_summary_mismatch",
      `${path}.non_authority_summary`,
      true,
    );
  }

  if (caseType === "candidate") {
    if (status === null || !candidateStatuses.has(String(status))) {
      sink.add("semantic", "candidate_status_required", `${path}.candidate_status`);
    }
    if (status === "deleted") {
      sink.add(
        "semantic",
        "deleted_status_requires_tombstone",
        `${path}.candidate_status`,
      );
    }
    if (refusalKind !== null) {
      sink.add("semantic", "candidate_refusal_kind_forbidden", `${path}.refusal_kind`);
    }
    if (typeof caseItem.proposition !== "string" || !caseItem.proposition.trim()) {
      sink.add("semantic", "candidate_proposition_required", `${path}.proposition`);
    }
    if (caseItem.tombstone_ref !== null) {
      sink.add("semantic", "candidate_tombstone_ref_forbidden", `${path}.tombstone_ref`);
    }
    if (
      semanticKind === "refusal_material" ||
      semanticKind === "deletion_tombstone"
    ) {
      sink.add(
        "semantic",
        "case_type_semantic_kind_incompatible",
        `${path}.semantic_kind`,
        true,
      );
    }
  } else if (caseType === "refusal") {
    if (status !== null) {
      sink.add("semantic", "refusal_candidate_status_forbidden", `${path}.candidate_status`);
    }
    if (refusalKind === null || !refusalKinds.has(String(refusalKind))) {
      sink.add("semantic", "refusal_kind_required", `${path}.refusal_kind`);
    }
    if (caseItem.proposition !== null || caseItem.tombstone_ref !== null) {
      sink.add("semantic", "refusal_must_not_admit_candidate_content", path, true);
    }
    if (semanticKind !== "refusal_material") {
      sink.add("semantic", "refusal_semantic_kind_invalid", `${path}.semantic_kind`);
    }
    if (reuse?.eligibility !== "prohibited") {
      sink.add("semantic", "refusal_reuse_not_prohibited", `${path}.reuse.eligibility`, true);
    }
    const requiredSourceKind = requiredRefusalSourceKind(refusalKind);
    if (requiredSourceKind && !sourceKindSet.has(requiredSourceKind)) {
      sink.add(
        "semantic",
        "refusal_source_kind_required",
        `${path}.source_relations`,
        true,
      );
    }
    if (
      refusalKind === "deleted_item_reuse" &&
      (caseItem.case_key !==
        PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_CASE_KEY_V01 ||
        caseItem.title !==
          PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_TITLE_V01 ||
        caseItem.summary !==
          PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_SUMMARY_V01 ||
        caseItem.rationale !==
          PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_RATIONALE_V01 ||
        canonicalizeProtocolValueV01(caseItem.limitations) !==
          canonicalizeProtocolValueV01([
            PERSONAL_PERSPECTIVE_DELETED_REUSE_REFUSAL_LIMITATION_V01,
          ]) ||
        canonicalizeProtocolValueV01(caseItem.future_review_actions) !==
          canonicalizeProtocolValueV01(
            PERSONAL_PERSPECTIVE_DELETION_REVIEW_ACTIONS_V01,
          ) ||
        !matchesFixedDeletionCounterexample(caseItem.counterexample) ||
        !Array.isArray(caseItem.case_relations) ||
        caseItem.case_relations.length !== 0 ||
        reuse?.synthetic_content_retained !== false ||
        !matchesFixedScope(
          caseItem.scope,
          "situational",
          "fictional-refusal-situation",
        ) ||
        sourceRecords.length !== 1 ||
        sourceRecords[0]?.source_key !==
          PERSONAL_PERSPECTIVE_DELETION_SOURCE_KEY_V01)
    ) {
      sink.add(
        "semantic",
        "deleted_refusal_content_boundary_mismatch",
        path,
        true,
      );
    }
  } else if (caseType === "tombstone") {
    if (status !== "deleted") {
      sink.add("semantic", "deleted_tombstone_status_required", `${path}.candidate_status`);
    }
    if (semanticKind !== "deletion_tombstone") {
      sink.add("semantic", "deleted_tombstone_semantic_kind_required", `${path}.semantic_kind`);
    }
    if (caseItem.proposition !== null) {
      sink.add("semantic", "deleted_item_retains_reusable_content", `${path}.proposition`, true);
    }
    if (caseItem.tombstone_ref !== PERSONAL_PERSPECTIVE_TOMBSTONE_REF_V01) {
      sink.add("semantic", "deleted_tombstone_ref_invalid", `${path}.tombstone_ref`);
    }
    if (
      reuse?.eligibility !== "prohibited" ||
      reuse?.synthetic_content_retained !== false ||
      reuse?.rehydration_authorized !== false ||
      reuse?.task_context_selection_authorized !== false
    ) {
      sink.add("semantic", "deleted_item_reuse_or_rehydration", `${path}.reuse`, true);
    }
    if (
      sourceRecords.length === 0 ||
      sourceRecords.some(
        (source) => source.source_kind !== "synthetic_deletion_instruction",
      ) ||
      sourceRecords.length !== 1 ||
      sourceRecords[0]?.source_key !==
        PERSONAL_PERSPECTIVE_DELETION_SOURCE_KEY_V01
    ) {
      sink.add(
        "semantic",
        "deleted_tombstone_content_bearing_source_forbidden",
        `${path}.source_relations`,
        true,
      );
    }
    if (
      caseItem.title !== PERSONAL_PERSPECTIVE_TOMBSTONE_TITLE_V01 ||
      caseItem.case_key !== PERSONAL_PERSPECTIVE_TOMBSTONE_CASE_KEY_V01 ||
      caseItem.summary !== PERSONAL_PERSPECTIVE_TOMBSTONE_SUMMARY_V01 ||
      caseItem.rationale !== PERSONAL_PERSPECTIVE_TOMBSTONE_RATIONALE_V01 ||
      canonicalizeProtocolValueV01(caseItem.limitations) !==
        canonicalizeProtocolValueV01([
          PERSONAL_PERSPECTIVE_TOMBSTONE_LIMITATION_V01,
        ]) ||
      canonicalizeProtocolValueV01(caseItem.future_review_actions) !==
        canonicalizeProtocolValueV01(
          PERSONAL_PERSPECTIVE_DELETION_REVIEW_ACTIONS_V01,
        ) ||
      !matchesFixedDeletionCounterexample(caseItem.counterexample) ||
      !matchesFixedScope(
        caseItem.scope,
        "situational",
        PERSONAL_PERSPECTIVE_TOMBSTONE_SCOPE_QUALIFIER_V01,
      )
    ) {
      sink.add(
        "semantic",
        "deleted_tombstone_content_boundary_mismatch",
        path,
        true,
      );
    }
    if (
      Array.isArray(caseItem.case_relations) &&
      caseItem.case_relations.length > 0
    ) {
      sink.add(
        "semantic",
        "deleted_tombstone_case_relation_forbidden",
        `${path}.case_relations`,
        true,
      );
    }
  }

  if (sourceKindSet.has("synthetic_false_premise") && caseType === "candidate") {
    sink.add("semantic", "false_premise_admitted_as_candidate", path, true);
  }

  if (origin === "explicit_synthetic_user_declaration" && !sourceKindSet.has("synthetic_user_declaration")) {
    sink.add("semantic", "explicit_declaration_source_required", `${path}.source_relations`);
  }
  if (origin === "jointly_interpreted_synthetic_candidate") {
    const distinctSourceIds = new Set(
      (Array.isArray(caseItem.source_relations)
        ? caseItem.source_relations.filter(isProtocolRecordV01)
        : []
      )
        .map((relation) => stringValue(relation.source_id))
        .filter((sourceId): sourceId is string => Boolean(sourceId)),
    );
    if (
      distinctSourceIds.size < 2 ||
      !sourceKindSet.has("synthetic_joint_interpretation")
    ) {
      sink.add("semantic", "joint_interpretation_multiple_sources_required", `${path}.source_relations`);
    }
  }
  if (origin === "model_inferred_synthetic_candidate") {
    if (!sourceKindSet.has("synthetic_model_inference")) {
      sink.add("semantic", "model_inference_source_required", `${path}.source_relations`);
    }
    if (caseType !== "candidate" || (status !== "candidate" && status !== "contested")) {
      sink.add("semantic", "model_inference_must_remain_candidate", `${path}.candidate_status`, true);
    }
  }
  if (origin === "observed_synthetic_behavior") {
    if (semanticKind !== "behavior_observation") {
      sink.add("semantic", "observed_behavior_personality_promotion", `${path}.semantic_kind`, true);
    }
    if (!sourceKindSet.has("synthetic_behavior_observation")) {
      sink.add("semantic", "behavior_observation_source_required", `${path}.source_relations`);
    }
  }
  if (origin === "derived_interpretation") {
    const relations = caseSourceRelationKinds(caseItem);
    if (
      !relations.has("derived_from") &&
      !relations.has("constrains_scope") &&
      !relations.has("counterexample")
    ) {
      sink.add("semantic", "derived_interpretation_relation_required", `${path}.source_relations`);
    }
  }

  if (semanticKind === "behavior_observation" && scopeKind === "workspace_conceptual") {
    sink.add("semantic", "behavior_observation_globalized", `${path}.scope`, true);
  }
  if (
    semanticKind === "behavior_observation" &&
    origin !== "observed_synthetic_behavior"
  ) {
    sink.add(
      "semantic",
      "behavior_observation_origin_invalid",
      `${path}.epistemic_origin`,
      true,
    );
  }
  if (
    semanticKind === "behavioral_pattern_interpretation" &&
    origin !== "derived_interpretation"
  ) {
    sink.add(
      "semantic",
      "behavior_interpretation_origin_invalid",
      `${path}.epistemic_origin`,
      true,
    );
  }
  if (semanticKind === "contextual_role" && scopeKind !== "role_specific") {
    sink.add("semantic", "role_specific_meaning_globalized", `${path}.scope`, true);
  }
  if (
    semanticKind === "relationship_model_candidate" &&
    scopeKind !== "relationship_specific"
  ) {
    sink.add(
      "semantic",
      "relationship_specific_meaning_globalized",
      `${path}.scope`,
      true,
    );
  }
  if (semanticKind === "known_exception" && scopeKind !== "exception") {
    sink.add("semantic", "known_exception_scope_invalid", `${path}.scope`);
  }
  if (scopeKind === "exception" && semanticKind !== "known_exception") {
    sink.add(
      "semantic",
      "exception_scope_semantic_kind_invalid",
      `${path}.scope`,
      true,
    );
  }
  if (
    semanticKind === "known_exception" &&
    isProtocolRecordV01(caseItem.counterexample) &&
    caseItem.counterexample.status !== "known_present"
  ) {
    sink.add(
      "semantic",
      "known_exception_counterexample_required",
      `${path}.counterexample.status`,
      true,
    );
  }
  if (
    semanticKind === "behavior_observation" &&
    caseItem.case_key === "task-choice-observation" &&
    scopeKind !== "task_specific"
  ) {
    sink.add("semantic", "task_choice_promoted_to_global_identity", `${path}.scope`, true);
  }
  if (semanticKind === "aspirational_identity") {
    const assertions = isProtocolRecordV01(caseItem.semantic_assertions)
      ? caseItem.semantic_assertions
      : null;
    if (assertions?.aspiration_treated_as_current_truth !== false) {
      sink.add("semantic", "aspiration_treated_as_current_truth", `${path}.semantic_assertions`, true);
    }
  }
  if (semanticKind === "persistent_tension" && sourceRecords.length < 2) {
    sink.add("semantic", "persistent_tension_two_sides_required", `${path}.source_relations`);
  }
  if (
    semanticKind === "persistent_tension" &&
    new Set(
      sourceRecords
        .filter(
          (source) => source.source_kind === "synthetic_user_declaration",
        )
        .map((source) => source.source_id),
    ).size < 2
  ) {
    sink.add(
      "semantic",
      "persistent_tension_two_sides_required",
      `${path}.source_relations`,
    );
  }
  if (semanticKind === "contested_interpretation" && status !== "contested") {
    sink.add(
      "semantic",
      "contested_interpretation_status_required",
      `${path}.candidate_status`,
      true,
    );
  }
  if (status === "contested") {
    if (reuse?.eligibility !== "review_required") {
      sink.add("semantic", "contested_item_reuse_invalid", `${path}.reuse.eligibility`);
    }
  }
  if (status === "stale" && reuse?.eligibility !== "re_evaluation_required") {
    sink.add("semantic", "stale_item_silently_reusable", `${path}.reuse.eligibility`, true);
  }
  if (status === "retracted") {
    if (
      reuse?.eligibility !== "prohibited" ||
      reuse?.automatic_revival_authorized !== false ||
      reuse?.task_context_selection_authorized !== false
    ) {
      sink.add("semantic", "retracted_item_reuse_or_revival", `${path}.reuse`, true);
    }
    if (!sourceKindSet.has("synthetic_retraction_instruction")) {
      sink.add(
        "semantic",
        "retracted_status_source_required",
        `${path}.source_relations`,
        true,
      );
    }
  }
  if (status === "candidate" && reuse?.eligibility !== "review_required") {
    sink.add("semantic", "candidate_reuse_boundary_invalid", `${path}.reuse.eligibility`);
  }

  if (scopeKind === "relationship_specific" && reuse?.cross_project_sharing_authorized !== false) {
    sink.add("semantic", "relationship_scope_shared_outside_scope", `${path}.reuse`, true);
  }

  validateCounterexampleMeaning(caseItem, path, sourcesById, sink);
  validateSpecialCaseRelations(caseItem, path, casesById, sink);
}

function resolvedCaseSources(
  caseItem: Record<string, unknown>,
  sourcesById: Map<string, Record<string, unknown>>,
): Record<string, unknown>[] {
  if (!Array.isArray(caseItem.source_relations)) return [];
  return caseItem.source_relations
    .filter(isProtocolRecordV01)
    .map((relation) => stringValue(relation.source_id))
    .filter((sourceId): sourceId is string => Boolean(sourceId))
    .map((sourceId) => sourcesById.get(sourceId))
    .filter((source): source is Record<string, unknown> => Boolean(source));
}

function validateSourceRelationMeaning(
  caseItem: Record<string, unknown>,
  source: Record<string, unknown>,
  relation: Record<string, unknown>,
  path: string,
  sink: IssueCollector,
): void {
  const sourceKind = stringValue(source.source_kind);
  const relationKind = stringValue(relation.relation);
  const origin = stringValue(caseItem.epistemic_origin);
  const caseType = stringValue(caseItem.case_type);
  const caseScope = isProtocolRecordV01(caseItem.scope) ? caseItem.scope : null;
  const sourceScope = isProtocolRecordV01(source.scope) ? source.scope : null;

  const allowedRelations = sourceKind
    ? sourceRelationsByKind.get(sourceKind)
    : null;
  if (
    allowedRelations &&
    relationKind &&
    !allowedRelations.has(relationKind)
  ) {
    sink.add("semantic", "source_kind_relation_invalid", path, true);
  }
  if (
    sourceKind === "synthetic_deletion_instruction" &&
    !(
      caseType === "tombstone" ||
      (caseType === "refusal" && caseItem.refusal_kind === "deleted_item_reuse")
    )
  ) {
    sink.add("semantic", "deletion_source_usage_invalid", path, true);
  }
  if (
    sourceKind === "synthetic_retraction_instruction" &&
    !(
      caseItem.candidate_status === "retracted" ||
      (caseType === "refusal" && caseItem.refusal_kind === "retracted_item_reuse")
    )
  ) {
    sink.add("semantic", "retraction_source_usage_invalid", path, true);
  }
  if (
    sourceKind === "synthetic_false_premise" &&
    !(caseType === "refusal" && caseItem.refusal_kind === "false_premise")
  ) {
    sink.add("semantic", "false_premise_source_usage_invalid", path, true);
  }

  if (
    sourceKind === "synthetic_behavior_observation" &&
    ((origin === "observed_synthetic_behavior" && relationKind !== "observes") ||
      (origin === "derived_interpretation" && relationKind !== "derived_from"))
  ) {
    sink.add("semantic", "behavior_source_relation_invalid", path);
  }
  if (
    sourceKind === "synthetic_model_inference" &&
    relationKind !== "derived_from"
  ) {
    sink.add("semantic", "model_source_relation_invalid", path);
  }
  if (
    sourceKind === "synthetic_counterexample" &&
    relationKind !== "counterexample"
  ) {
    sink.add("semantic", "counterexample_source_relation_invalid", path);
  }
  if (
    sourceKind === "synthetic_scope_constraint" &&
    relationKind !== "constrains_scope"
  ) {
    sink.add("semantic", "scope_constraint_relation_invalid", path);
  }

  const restrictedSourceScopeKinds = new Set([
    "project_specific",
    "role_specific",
    "relationship_specific",
    "task_specific",
    "situational",
    "time_bounded",
    "exception",
  ]);
  if (
    caseType !== "refusal" &&
    sourceScope &&
    caseScope &&
    restrictedSourceScopeKinds.has(String(sourceScope.kind))
  ) {
    const boundedExceptionForBroaderCandidate =
      relationKind === "counterexample" && sourceScope.kind === "exception";
    if (!boundedExceptionForBroaderCandidate) {
      if (sourceScope.kind !== caseScope.kind) {
        sink.add("semantic", "source_scope_escapes_case_scope", path, true);
      } else if (
        sourceScope.kind === "project_specific" &&
        sourceScope.project_scope_ref !== caseScope.project_scope_ref
      ) {
        sink.add("semantic", "cross_project_source_relation", path, true);
      } else if (
        sourceScope.kind !== "project_specific" &&
        (canonicalizeProtocolValueV01(sourceScope.qualifiers) !==
          canonicalizeProtocolValueV01(caseScope.qualifiers) ||
          sourceScope.valid_from !== caseScope.valid_from ||
          sourceScope.valid_until !== caseScope.valid_until)
      ) {
        sink.add("semantic", "source_scope_qualifier_mismatch", path, true);
      }
    }
  }
}

function requiredRefusalSourceKind(
  refusalKind: unknown,
): PersonalPerspectiveSourceKindV01 | null {
  switch (refusalKind) {
    case "false_premise":
      return "synthetic_false_premise";
    case "over_globalization":
    case "insufficient_source":
    case "scope_conflict":
      return "synthetic_scope_constraint";
    case "deleted_item_reuse":
      return "synthetic_deletion_instruction";
    case "retracted_item_reuse":
      return "synthetic_retraction_instruction";
    case "task_choice_globalization":
      return "synthetic_behavior_observation";
    default:
      return null;
  }
}

function caseSourceRelationKinds(caseItem: Record<string, unknown>): Set<string> {
  if (!Array.isArray(caseItem.source_relations)) return new Set();
  return new Set(
    caseItem.source_relations
      .filter(isProtocolRecordV01)
      .map((relation) => stringValue(relation.relation))
      .filter((value): value is string => Boolean(value)),
  );
}

function validateCounterexampleMeaning(
  caseItem: Record<string, unknown>,
  path: string,
  sourcesById: Map<string, Record<string, unknown>>,
  sink: IssueCollector,
): void {
  const counterexample = isProtocolRecordV01(caseItem.counterexample)
    ? caseItem.counterexample
    : null;
  if (!counterexample) return;
  const status = stringValue(counterexample.status);
  const refs = Array.isArray(counterexample.source_refs)
    ? counterexample.source_refs.filter((ref): ref is string => typeof ref === "string")
    : [];
  const relatedSources = refs
    .map((ref) => sourcesById.get(ref))
    .filter((source): source is Record<string, unknown> => Boolean(source));
  const relationMap = new Map<string, string>();
  const counterexampleRelationRefs = new Set<string>();
  if (Array.isArray(caseItem.source_relations)) {
    for (const relation of caseItem.source_relations.filter(isProtocolRecordV01)) {
      const sourceId = stringValue(relation.source_id);
      const relationKind = stringValue(relation.relation);
      if (sourceId && relationKind) {
        relationMap.set(sourceId, relationKind);
        if (relationKind === "counterexample") {
          counterexampleRelationRefs.add(sourceId);
        }
      }
    }
  }
  if (status === "known_present") {
    if (refs.length === 0) {
      sink.add("semantic", "known_present_counterexample_ref_required", `${path}.counterexample.source_refs`);
    }
    for (const ref of refs) {
      const source = sourcesById.get(ref);
      if (!source || source.source_kind !== "synthetic_counterexample") {
        sink.add("semantic", "known_present_counterexample_ref_unrelated", `${path}.counterexample.source_refs`);
      }
      if (relationMap.get(ref) !== "counterexample") {
        sink.add("semantic", "known_present_counterexample_relation_required", `${path}.source_relations`);
      }
    }
    if (
      canonicalizeProtocolValueV01(
        [...new Set(refs)].sort(compareProtocolCodeUnitsV01),
      ) !==
      canonicalizeProtocolValueV01(
        [...counterexampleRelationRefs].sort(compareProtocolCodeUnitsV01),
      )
    ) {
      sink.add(
        "semantic",
        "known_present_counterexample_ref_coverage_incomplete",
        `${path}.counterexample.source_refs`,
      );
    }
    if (
      counterexample.impossibility_claimed !== false ||
      counterexample.completeness_claimed !== false
    ) {
      sink.add("semantic", "known_present_exception_free_claim_forbidden", `${path}.counterexample`);
    }
  } else if (status === "none_found") {
    if (refs.length > 0 || relatedSources.some(Boolean)) {
      sink.add("semantic", "none_found_with_counterexample_ref", `${path}.counterexample.source_refs`);
    }
    if (counterexample.search_completed !== true || !stringValue(counterexample.search_summary)) {
      sink.add("semantic", "none_found_bounded_search_required", `${path}.counterexample`);
    }
    if (counterexample.impossibility_claimed !== false) {
      sink.add("semantic", "none_found_impossibility_claim", `${path}.counterexample`, true);
    }
    if (counterexample.completeness_claimed !== false) {
      sink.add("semantic", "none_found_false_completeness", `${path}.counterexample`, true);
    }
    if (counterexampleRelationRefs.size > 0) {
      sink.add(
        "semantic",
        "none_found_with_counterexample_relation",
        `${path}.source_relations`,
      );
    }
  } else if (status === "not_searched") {
    if (refs.length > 0) {
      sink.add("semantic", "not_searched_with_counterexample_ref", `${path}.counterexample.source_refs`);
    }
    if (
      counterexample.search_completed !== false ||
      counterexample.completeness_claimed !== false ||
      counterexample.impossibility_claimed !== false ||
      counterexample.search_summary !== null
    ) {
      sink.add("semantic", "not_searched_false_completeness", `${path}.counterexample`, true);
    }
    if (counterexampleRelationRefs.size > 0) {
      sink.add(
        "semantic",
        "not_searched_with_counterexample_relation",
        `${path}.source_relations`,
      );
    }
  } else if (status === "not_applicable") {
    if (refs.length > 0) {
      sink.add("semantic", "not_applicable_with_counterexample_ref", `${path}.counterexample.source_refs`);
    }
    if (!stringValue(counterexample.justification)) {
      sink.add("semantic", "not_applicable_justification_required", `${path}.counterexample.justification`);
    }
    if (
      counterexample.search_completed !== false ||
      counterexample.completeness_claimed !== false ||
      counterexample.impossibility_claimed !== false ||
      counterexample.search_summary !== null ||
      counterexampleRelationRefs.size > 0
    ) {
      sink.add(
        "semantic",
        "not_applicable_false_completeness",
        `${path}.counterexample`,
        true,
      );
    }
    if (
      caseItem.case_type !== "refusal" &&
      caseItem.case_type !== "tombstone" &&
      caseItem.semantic_kind !== "behavior_observation"
    ) {
      sink.add("semantic", "not_applicable_invalid_case_type", `${path}.counterexample.status`, true);
    }
  }
}

function validateSpecialCaseRelations(
  caseItem: Record<string, unknown>,
  path: string,
  casesById: Map<string, Record<string, unknown>>,
  sink: IssueCollector,
): void {
  const relations = Array.isArray(caseItem.case_relations)
    ? caseItem.case_relations.filter(isProtocolRecordV01)
    : [];
  for (const relation of relations) {
    if (
      (relation.relation === "narrows" &&
        caseItem.semantic_kind !== "scope_narrowing") ||
      (relation.relation === "revises" &&
        caseItem.semantic_kind !== "revision_candidate") ||
      (relation.relation === "interprets" &&
        caseItem.semantic_kind !== "behavioral_pattern_interpretation")
    ) {
      sink.add(
        "semantic",
        "case_relation_semantic_kind_mismatch",
        `${path}.case_relations`,
        true,
      );
    }
  }
  if (caseItem.semantic_kind === "known_exception") {
    const exception = relations.find(
      (relation) => relation.relation === "exception_to",
    );
    const target = exception
      ? casesById.get(String(exception.target_case_id))
      : null;
    if (
      !target ||
      target.case_type !== "candidate" ||
      target.semantic_kind !== "recurring_disposition_candidate"
    ) {
      sink.add(
        "semantic",
        "known_exception_relation_required",
        `${path}.case_relations`,
      );
    }
  }
  if (caseItem.semantic_kind === "scope_narrowing") {
    if (!relations.some((relation) => relation.relation === "narrows")) {
      sink.add("semantic", "scope_narrowing_relation_required", `${path}.case_relations`);
    }
  }
  if (caseItem.semantic_kind === "revision_candidate") {
    const revision = relations.find((relation) => relation.relation === "revises");
    const target = revision
      ? casesById.get(String(revision.target_case_id))
      : null;
    if (
      !target ||
      target.case_type !== "candidate" ||
      target.semantic_kind === "revision_candidate"
    ) {
      sink.add("semantic", "revision_relation_required", `${path}.case_relations`);
    }
  }
  if (caseItem.semantic_kind === "behavioral_pattern_interpretation") {
    const interpretation = relations.find((relation) => relation.relation === "interprets");
    const target = interpretation
      ? casesById.get(String(interpretation.target_case_id))
      : null;
    if (!target || target.semantic_kind !== "behavior_observation") {
      sink.add("semantic", "behavior_interpretation_observation_relation_required", `${path}.case_relations`);
    }
  }
}

interface RequiredCoverageCaseSignatureV01 {
  case_type: "candidate" | "refusal" | "tombstone";
  semantic_kind: PersonalPerspectiveSemanticKindV01;
  epistemic_origin: PersonalPerspectiveEpistemicOriginV01;
  scope_kind: PersonalPerspectiveScopeKindV01;
  candidate_status: PersonalPerspectiveCandidateStatusV01 | null;
  refusal_kind: PersonalPerspectiveRefusalKindV01 | null;
  counterexample_status: PersonalPerspectiveCounterexampleStatusV01;
  reuse_eligibility:
    | "review_required"
    | "re_evaluation_required"
    | "prohibited";
  required_case_relation?: PersonalPerspectiveCaseRelationV01;
  required_case_target_key?: string;
  required_source_relation?: PersonalPerspectiveSourceRelationV01;
  required_source_keys?: readonly string[];
}

const requiredCoverageCaseSignaturesV01: Record<
  string,
  RequiredCoverageCaseSignatureV01
> = {
  "descriptive-self-understanding": {
    case_type: "candidate",
    semantic_kind: "descriptive_self_understanding",
    epistemic_origin: "explicit_synthetic_user_declaration",
    scope_kind: "workspace_conceptual",
    candidate_status: "candidate",
    refusal_kind: null,
    counterexample_status: "none_found",
    reuse_eligibility: "review_required",
  },
  "aspirational-identity": {
    case_type: "candidate",
    semantic_kind: "aspirational_identity",
    epistemic_origin: "explicit_synthetic_user_declaration",
    scope_kind: "workspace_conceptual",
    candidate_status: "candidate",
    refusal_kind: null,
    counterexample_status: "not_searched",
    reuse_eligibility: "review_required",
  },
  "commitment-completeness": {
    case_type: "candidate",
    semantic_kind: "stable_value_or_commitment",
    epistemic_origin: "explicit_synthetic_user_declaration",
    scope_kind: "workspace_conceptual",
    candidate_status: "candidate",
    refusal_kind: null,
    counterexample_status: "not_searched",
    reuse_eligibility: "review_required",
    required_case_relation: "contests",
    required_case_target_key: "commitment-timeliness",
  },
  "persistent-tension": {
    case_type: "candidate",
    semantic_kind: "persistent_tension",
    epistemic_origin: "jointly_interpreted_synthetic_candidate",
    scope_kind: "workspace_conceptual",
    candidate_status: "candidate",
    refusal_kind: null,
    counterexample_status: "not_searched",
    reuse_eligibility: "review_required",
    required_source_keys: [
      "declaration-commitment-a",
      "declaration-commitment-b",
    ],
  },
  "decision-principle-reversibility": {
    case_type: "candidate",
    semantic_kind: "decision_principle",
    epistemic_origin: "explicit_synthetic_user_declaration",
    scope_kind: "workspace_conceptual",
    candidate_status: "candidate",
    refusal_kind: null,
    counterexample_status: "not_searched",
    reuse_eligibility: "review_required",
  },
  "jointly-interpreted-candidate": {
    case_type: "candidate",
    semantic_kind: "recurring_disposition_candidate",
    epistemic_origin: "jointly_interpreted_synthetic_candidate",
    scope_kind: "workspace_conceptual",
    candidate_status: "candidate",
    refusal_kind: null,
    counterexample_status: "not_searched",
    reuse_eligibility: "review_required",
    required_source_relation: "derived_from",
  },
  "model-inferred-candidate": {
    case_type: "candidate",
    semantic_kind: "recurring_disposition_candidate",
    epistemic_origin: "model_inferred_synthetic_candidate",
    scope_kind: "workspace_conceptual",
    candidate_status: "candidate",
    refusal_kind: null,
    counterexample_status: "not_searched",
    reuse_eligibility: "review_required",
    required_source_relation: "derived_from",
  },
  "task-choice-observation": {
    case_type: "candidate",
    semantic_kind: "behavior_observation",
    epistemic_origin: "observed_synthetic_behavior",
    scope_kind: "task_specific",
    candidate_status: "candidate",
    refusal_kind: null,
    counterexample_status: "not_applicable",
    reuse_eligibility: "review_required",
    required_source_relation: "observes",
  },
  "behavior-pattern-interpretation": {
    case_type: "candidate",
    semantic_kind: "behavioral_pattern_interpretation",
    epistemic_origin: "derived_interpretation",
    scope_kind: "task_specific",
    candidate_status: "candidate",
    refusal_kind: null,
    counterexample_status: "not_searched",
    reuse_eligibility: "review_required",
    required_case_relation: "interprets",
    required_case_target_key: "task-choice-observation",
    required_source_relation: "derived_from",
  },
  "world-model-candidate": {
    case_type: "candidate",
    semantic_kind: "world_model_candidate",
    epistemic_origin: "derived_interpretation",
    scope_kind: "situational",
    candidate_status: "candidate",
    refusal_kind: null,
    counterexample_status: "none_found",
    reuse_eligibility: "review_required",
  },
  "contextual-role": {
    case_type: "candidate",
    semantic_kind: "contextual_role",
    epistemic_origin: "explicit_synthetic_user_declaration",
    scope_kind: "role_specific",
    candidate_status: "candidate",
    refusal_kind: null,
    counterexample_status: "not_searched",
    reuse_eligibility: "review_required",
  },
  "relationship-specific-candidate": {
    case_type: "candidate",
    semantic_kind: "relationship_model_candidate",
    epistemic_origin: "explicit_synthetic_user_declaration",
    scope_kind: "relationship_specific",
    candidate_status: "candidate",
    refusal_kind: null,
    counterexample_status: "not_searched",
    reuse_eligibility: "review_required",
  },
  "project-scope-narrowing": {
    case_type: "candidate",
    semantic_kind: "scope_narrowing",
    epistemic_origin: "derived_interpretation",
    scope_kind: "project_specific",
    candidate_status: "candidate",
    refusal_kind: null,
    counterexample_status: "not_searched",
    reuse_eligibility: "review_required",
    required_case_relation: "narrows",
    required_case_target_key: "descriptive-self-understanding",
    required_source_relation: "constrains_scope",
  },
  "known-exception": {
    case_type: "candidate",
    semantic_kind: "known_exception",
    epistemic_origin: "derived_interpretation",
    scope_kind: "exception",
    candidate_status: "candidate",
    refusal_kind: null,
    counterexample_status: "known_present",
    reuse_eligibility: "review_required",
    required_case_relation: "exception_to",
    required_case_target_key: "jointly-interpreted-candidate",
    required_source_relation: "counterexample",
  },
  "known-present-counterexample": {
    case_type: "candidate",
    semantic_kind: "recurring_disposition_candidate",
    epistemic_origin: "explicit_synthetic_user_declaration",
    scope_kind: "workspace_conceptual",
    candidate_status: "candidate",
    refusal_kind: null,
    counterexample_status: "known_present",
    reuse_eligibility: "review_required",
    required_source_relation: "counterexample",
  },
  "counterexample-not-searched": {
    case_type: "candidate",
    semantic_kind: "world_model_candidate",
    epistemic_origin: "derived_interpretation",
    scope_kind: "situational",
    candidate_status: "candidate",
    refusal_kind: null,
    counterexample_status: "not_searched",
    reuse_eligibility: "review_required",
  },
  "contested-interpretation": {
    case_type: "candidate",
    semantic_kind: "contested_interpretation",
    epistemic_origin: "jointly_interpreted_synthetic_candidate",
    scope_kind: "workspace_conceptual",
    candidate_status: "contested",
    refusal_kind: null,
    counterexample_status: "not_searched",
    reuse_eligibility: "review_required",
    required_case_relation: "contests",
    required_case_target_key: "jointly-interpreted-candidate",
  },
  "stale-candidate": {
    case_type: "candidate",
    semantic_kind: "descriptive_self_understanding",
    epistemic_origin: "explicit_synthetic_user_declaration",
    scope_kind: "time_bounded",
    candidate_status: "stale",
    refusal_kind: null,
    counterexample_status: "not_searched",
    reuse_eligibility: "re_evaluation_required",
  },
  "retracted-candidate": {
    case_type: "candidate",
    semantic_kind: "descriptive_self_understanding",
    epistemic_origin: "derived_interpretation",
    scope_kind: "workspace_conceptual",
    candidate_status: "retracted",
    refusal_kind: null,
    counterexample_status: "not_searched",
    reuse_eligibility: "prohibited",
  },
  "deleted-item-tombstone": {
    case_type: "tombstone",
    semantic_kind: "deletion_tombstone",
    epistemic_origin: "derived_interpretation",
    scope_kind: "situational",
    candidate_status: "deleted",
    refusal_kind: null,
    counterexample_status: "not_applicable",
    reuse_eligibility: "prohibited",
  },
  "false-premise-refusal": {
    case_type: "refusal",
    semantic_kind: "refusal_material",
    epistemic_origin: "derived_interpretation",
    scope_kind: "situational",
    candidate_status: null,
    refusal_kind: "false_premise",
    counterexample_status: "not_applicable",
    reuse_eligibility: "prohibited",
  },
  "over-globalization-refusal": {
    case_type: "refusal",
    semantic_kind: "refusal_material",
    epistemic_origin: "derived_interpretation",
    scope_kind: "situational",
    candidate_status: null,
    refusal_kind: "over_globalization",
    counterexample_status: "not_applicable",
    reuse_eligibility: "prohibited",
    required_source_relation: "constrains_scope",
  },
  "task-choice-globalization-refusal": {
    case_type: "refusal",
    semantic_kind: "refusal_material",
    epistemic_origin: "derived_interpretation",
    scope_kind: "situational",
    candidate_status: null,
    refusal_kind: "task_choice_globalization",
    counterexample_status: "not_applicable",
    reuse_eligibility: "prohibited",
  },
  "counterexample-driven-revision": {
    case_type: "candidate",
    semantic_kind: "revision_candidate",
    epistemic_origin: "derived_interpretation",
    scope_kind: "workspace_conceptual",
    candidate_status: "candidate",
    refusal_kind: null,
    counterexample_status: "known_present",
    reuse_eligibility: "review_required",
    required_case_relation: "revises",
    required_case_target_key: "jointly-interpreted-candidate",
    required_source_relation: "counterexample",
  },
};

function matchesRequiredCoverageCaseSignature(
  caseItem: Record<string, unknown>,
  signature: RequiredCoverageCaseSignatureV01,
  sourcesById: Map<string, Record<string, unknown>>,
  casesById: Map<string, Record<string, unknown>>,
): boolean {
  const scope = isProtocolRecordV01(caseItem.scope) ? caseItem.scope : null;
  const counterexample = isProtocolRecordV01(caseItem.counterexample)
    ? caseItem.counterexample
    : null;
  const reuse = isProtocolRecordV01(caseItem.reuse) ? caseItem.reuse : null;
  const actualCaseRelations = new Set(
    (Array.isArray(caseItem.case_relations)
      ? caseItem.case_relations.filter(isProtocolRecordV01)
      : []
    ).map((relation) => relation.relation),
  );
  const actualSourceRelations = new Set(
    (Array.isArray(caseItem.source_relations)
      ? caseItem.source_relations.filter(isProtocolRecordV01)
      : []
    ).map((relation) => relation.relation),
  );
  const requiredCaseTargetMatches =
    !signature.required_case_target_key ||
    (Array.isArray(caseItem.case_relations) &&
      caseItem.case_relations
        .filter(isProtocolRecordV01)
        .some((relation) => {
          if (
            signature.required_case_relation &&
            relation.relation !== signature.required_case_relation
          ) {
            return false;
          }
          const target = casesById.get(String(relation.target_case_id));
          return target?.case_key === signature.required_case_target_key;
        }));
  const actualSourceKeys = new Set(
    (Array.isArray(caseItem.source_relations)
      ? caseItem.source_relations.filter(isProtocolRecordV01)
      : []
    )
      .map((relation) => sourcesById.get(String(relation.source_id))?.source_key)
      .filter((sourceKey): sourceKey is string => typeof sourceKey === "string"),
  );
  return (
    caseItem.case_type === signature.case_type &&
    caseItem.semantic_kind === signature.semantic_kind &&
    caseItem.epistemic_origin === signature.epistemic_origin &&
    scope?.kind === signature.scope_kind &&
    caseItem.candidate_status === signature.candidate_status &&
    caseItem.refusal_kind === signature.refusal_kind &&
    counterexample?.status === signature.counterexample_status &&
    reuse?.eligibility === signature.reuse_eligibility &&
    (!signature.required_case_relation ||
      actualCaseRelations.has(signature.required_case_relation)) &&
    requiredCaseTargetMatches &&
    (!signature.required_source_relation ||
      actualSourceRelations.has(signature.required_source_relation)) &&
    (!signature.required_source_keys ||
      signature.required_source_keys.every((sourceKey) =>
        actualSourceKeys.has(sourceKey),
      ))
  );
}

function validateCoverage(
  rawCoverage: unknown[],
  casesById: Map<string, Record<string, unknown>>,
  sourcesById: Map<string, Record<string, unknown>>,
  sink: IssueCollector,
): void {
  const actualRequirementOrder = rawCoverage
    .filter(isProtocolRecordV01)
    .map((entry) => stringValue(entry.requirement_id))
    .filter((requirement): requirement is string => Boolean(requirement));
  if (
    canonicalizeProtocolValueV01(actualRequirementOrder) !==
    canonicalizeProtocolValueV01(PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_V01)
  ) {
    sink.add("semantic", "coverage_matrix_order_or_membership_invalid", "$.coverage_matrix");
  }
  const byRequirement = new Map<string, Record<string, unknown>>();
  rawCoverage.filter(isProtocolRecordV01).forEach((entry, index) => {
    const requirement = stringValue(entry.requirement_id);
    if (!requirement) return;
    if (byRequirement.has(requirement)) {
      sink.add("semantic", "duplicate_coverage_requirement", `$.coverage_matrix[${index}]`);
    }
    byRequirement.set(requirement, entry);
  });
  for (const requirement of PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_V01) {
    const entry = byRequirement.get(requirement);
    if (!entry) {
      sink.add("semantic", "required_coverage_missing", "$.coverage_matrix");
      continue;
    }
    const refs = Array.isArray(entry.case_refs)
      ? entry.case_refs.filter((ref): ref is string => typeof ref === "string")
      : [];
    if (refs.length === 0 || refs.some((ref) => !casesById.has(ref))) {
      sink.add("semantic", "required_coverage_unresolved", "$.coverage_matrix");
    }
    const actualCaseKeys = refs
      .map((ref) => casesById.get(ref))
      .filter((caseItem): caseItem is Record<string, unknown> => Boolean(caseItem))
      .map((caseItem) => stringValue(caseItem.case_key))
      .filter((caseKey): caseKey is string => Boolean(caseKey))
      .sort(compareProtocolCodeUnitsV01);
    const expectedCaseKeys = [
      ...PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_CASE_KEYS_V01[requirement],
    ].sort(compareProtocolCodeUnitsV01);
    if (
      canonicalizeProtocolValueV01(actualCaseKeys) !==
      canonicalizeProtocolValueV01(expectedCaseKeys)
    ) {
      sink.add(
        "semantic",
        "required_coverage_semantic_mismatch",
        "$.coverage_matrix",
      );
    }
    for (const expectedCaseKey of expectedCaseKeys) {
      const caseItem = refs
        .map((ref) => casesById.get(ref))
        .find((candidate) => candidate?.case_key === expectedCaseKey);
      const signature = requiredCoverageCaseSignaturesV01[expectedCaseKey];
      if (
        !caseItem ||
        !signature ||
        !matchesRequiredCoverageCaseSignature(
          caseItem,
          signature,
          sourcesById,
          casesById,
        )
      ) {
        sink.add(
          "semantic",
          "required_coverage_case_semantics_mismatch",
          "$.coverage_matrix",
        );
      }
    }
  }
  for (const requirement of byRequirement.keys()) {
    if (!PERSONAL_PERSPECTIVE_REQUIRED_COVERAGE_V01.includes(requirement as never)) {
      sink.add("semantic", "unknown_coverage_requirement", "$.coverage_matrix");
    }
  }
}

function validateRootSemanticBoundary(
  root: Record<string, unknown>,
  sink: IssueCollector,
): void {
  if (root.defined_at !== PERSONAL_PERSPECTIVE_CASEBOOK_DEFINED_AT_V01) {
    sink.add("semantic", "defined_at_not_fixed", "$.defined_at");
  }
  if (
    canonicalizeProtocolValueV01(root.classification) !==
    canonicalizeProtocolValueV01(classification)
  ) {
    sink.add("semantic", "classification_mismatch", "$.classification");
  }
  if (
    canonicalizeProtocolValueV01(root.privacy_boundary) !==
    canonicalizeProtocolValueV01(privacyBoundary)
  ) {
    sink.add("semantic", "privacy_boundary_mismatch", "$.privacy_boundary", true);
  }
  if (
    canonicalizeProtocolValueV01(root.retention_boundary) !==
    canonicalizeProtocolValueV01(retentionBoundary)
  ) {
    sink.add("semantic", "retention_boundary_mismatch", "$.retention_boundary", true);
  }
}

function validateIntegrity(root: Record<string, unknown>, sink: IssueCollector): void {
  const rawSources = Array.isArray(root.sources) ? root.sources : [];
  rawSources.filter(isProtocolRecordV01).forEach((source, index) => {
    const actual = isProtocolRecordV01(source.integrity)
      ? stringValue(source.integrity.fingerprint)
      : null;
    const expected = canonicalFingerprint(source);
    if (actual !== expected) {
      sink.add("integrity", "source_fingerprint_mismatch", `$.sources[${index}].integrity.fingerprint`);
    }
  });
  const rawCases = Array.isArray(root.cases) ? root.cases : [];
  rawCases.filter(isProtocolRecordV01).forEach((caseItem, index) => {
    const actual = isProtocolRecordV01(caseItem.integrity)
      ? stringValue(caseItem.integrity.fingerprint)
      : null;
    const expected = canonicalFingerprint(caseItem);
    if (actual !== expected) {
      sink.add("integrity", "case_fingerprint_mismatch", `$.cases[${index}].integrity.fingerprint`);
    }
  });
  const typed = root as unknown as PersonalPerspectiveSemanticCasebookV01;
  const casebookId = stringValue(root.casebook_id);
  if (!casebookId || !/^ppscb-v0-1:[0-9a-f]{24}$/.test(casebookId)) {
    sink.add("structure", "casebook_id_malformed", "$.casebook_id");
  } else if (casebookId !== deriveCasebookId(typed)) {
    sink.add("integrity", "casebook_id_mismatch", "$.casebook_id");
  }
  const actual = isProtocolRecordV01(root.integrity)
    ? stringValue(root.integrity.fingerprint)
    : null;
  const expected = canonicalFingerprint(root);
  if (actual !== expected) {
    sink.add("integrity", "aggregate_fingerprint_mismatch", "$.integrity.fingerprint");
  }
}

function rejectUnknownKeys(
  record: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  path: string,
  sink: IssueCollector,
  authorityContext = false,
): void {
  for (const key of Object.keys(record).sort(compareProtocolCodeUnitsV01)) {
    if (allowed.has(key)) continue;
    const authorityShaped =
      authorityContext ||
      /author|approv|persist|identity|truth|decision|transition|evidence|memory|context|publish|merge|actuat|vault|work.?clos/i.test(
        key,
      );
    sink.add(
      "structure",
      authorityShaped ? "unknown_authority_shaped_field" : "unknown_field",
      path,
      authorityShaped,
    );
  }
}

function validateExactRecord(
  value: unknown,
  expected: Record<string, unknown>,
  allowedKeys: ReadonlySet<string>,
  path: string,
  mismatchCode: string,
  sink: IssueCollector,
): void {
  if (!isProtocolRecordV01(value)) {
    sink.add("structure", "required_record_malformed", path);
    return;
  }
  rejectUnknownKeys(value, allowedKeys, path, sink);
  if (
    canonicalizeProtocolValueV01(value) !==
    canonicalizeProtocolValueV01(expected)
  ) {
    sink.add("semantic", mismatchCode, path);
  }
}

function exactValue(
  value: unknown,
  expected: unknown,
  path: string,
  code: string,
  sink: IssueCollector,
): void {
  if (value !== expected) sink.add("structure", code, path);
}

function exactBoolean(
  value: unknown,
  expected: boolean,
  path: string,
  code: string,
  sink: IssueCollector,
): void {
  if (typeof value !== "boolean") {
    sink.add("structure", "boolean_required", path);
  } else if (value !== expected) {
    sink.add("semantic", code, path, expected === false);
  }
}

function booleanValue(value: unknown, path: string, sink: IssueCollector): void {
  if (typeof value !== "boolean") sink.add("structure", "boolean_required", path);
}

function boundedString(
  value: unknown,
  path: string,
  max: number,
  sink: IssueCollector,
): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    sink.add("structure", "required_string_missing_or_invalid", path);
    return;
  }
  if (value.length > max) sink.add("structure", "bounded_text_oversized", path);
  if (value !== value.trim()) {
    sink.add("semantic", "text_not_normalized", path);
  }
}

function nullableBoundedString(
  value: unknown,
  path: string,
  max: number,
  sink: IssueCollector,
): void {
  if (value === null) return;
  boundedString(value, path, max, sink);
}

function stringArray(
  value: unknown,
  path: string,
  maxItems: number,
  maxText: number,
  sink: IssueCollector,
): void {
  if (!Array.isArray(value)) {
    sink.add("structure", "malformed_collection", path);
    return;
  }
  if (value.length > maxItems) sink.add("structure", "collection_oversized", path);
  value.forEach((item, index) => boundedString(item, `${path}[${index}]`, maxText, sink));
}

function validateEnumArray(
  value: unknown,
  allowed: ReadonlySet<string>,
  path: string,
  maxItems: number,
  code: string,
  sink: IssueCollector,
): void {
  if (!Array.isArray(value)) {
    sink.add("structure", "malformed_collection", path);
    return;
  }
  if (value.length > maxItems) sink.add("structure", "collection_oversized", path);
  value.forEach((item, index) => enumValue(item, allowed, `${path}[${index}]`, code, sink));
}

function validateNormalizedStringSet(
  value: unknown,
  path: string,
  sink: IssueCollector,
): void {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return;
  }
  const normalized = uniqueSortedStrings(value as string[]);
  if (
    canonicalizeProtocolValueV01(value) !==
    canonicalizeProtocolValueV01(normalized)
  ) {
    sink.add("semantic", "unordered_collection_not_normalized", path);
  }
}

function validateNormalizedCanonicalSet(
  value: unknown[],
  path: string,
  sink: IssueCollector,
): void {
  const normalized = uniqueSortedValues(value);
  if (
    canonicalizeProtocolValueV01(value) !==
    canonicalizeProtocolValueV01(normalized)
  ) {
    sink.add("semantic", "unordered_collection_not_normalized", path);
  }
}

function validateRecordCollectionOrder(
  value: unknown[],
  identityField: string,
  path: string,
  sink: IssueCollector,
): void {
  if (!value.every(isProtocolRecordV01)) return;
  const identities = value.map((item) => stringValue(item[identityField]) ?? "");
  const sorted = [...identities].sort(compareProtocolCodeUnitsV01);
  if (
    canonicalizeProtocolValueV01(identities) !==
    canonicalizeProtocolValueV01(sorted)
  ) {
    sink.add("semantic", "record_collection_not_normalized", path);
  }
}

function enumValue(
  value: unknown,
  allowed: ReadonlySet<string>,
  path: string,
  code: string,
  sink: IssueCollector,
): void {
  if (typeof value !== "string" || !allowed.has(value)) {
    sink.add("structure", code, path);
  }
}

function strictTimestamp(value: unknown, path: string, sink: IssueCollector): void {
  if (
    typeof value !== "string" ||
    value !== value.trim() ||
    parseStrictIsoTimestampV01(value) === null
  ) {
    sink.add("structure", "timestamp_invalid", path);
  }
}

function nullableTimestamp(value: unknown, path: string, sink: IssueCollector): void {
  if (value === null) return;
  strictTimestamp(value, path, sink);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function scanUnsafeMaterial(
  value: unknown,
  path: string,
  sink: IssueCollector,
  depth: number,
): void {
  if (depth > 12) {
    sink.add("unsafe_material", "unsafe_nesting_depth", path, true);
    return;
  }
  if (typeof value === "string") {
    const patterns: Array<[string, RegExp]> = [
      ["credential_shaped_material", /\b(?:sk-(?:proj-)?[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9_]{12,}|github_pat_[A-Za-z0-9_]{16,})\b/],
      ["token_shaped_material", /(?:\b(?:token[_-][A-Za-z0-9_-]{12,}|Bearer\s+[A-Za-z0-9._~+/-]{12,}|xox[baprs]-[A-Za-z0-9-]{12,})\b|\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b)/i],
      ["api_key_shaped_material", /(?:\b(?:api[_-]?key|access[_-]?token)\s*[:=]\s*\S{8,}|\bAKIA[A-Z0-9]{16}\b)/i],
      ["private_key_shaped_material", /BEGIN\s+[A-Z ]*PRIVATE\s+KEY/],
      ["private_unix_path", /(?:^|[^A-Za-z0-9/])\/(?!\/)[^\s]+/],
      ["private_windows_path", /(?:^|[^A-Za-z0-9])[A-Za-z]:(?:[\\/]|[^\s\\/])[^\s]*/],
      ["private_windows_path", /(?:^|[^\\])\\\\[^\\\s]+\\[^\\\s]+(?:\\[^\\\s]+)*/],
      ["private_windows_path", /(?:^|[^\\])\\[^\\\s]+\\[^\\\s]+(?:\\[^\\\s]+)*/],
      ["home_directory_path", /(?:^|[^A-Za-z0-9])~[\\/][^\s]+/],
      ["file_uri", /\bfile:\/\/\S+/i],
      ["private_url", /\bhttps?:\/\/(?:localhost(?=[:/]|$)|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+|169\.254\.\d+\.\d+|\[::1\]|[^\s/:]+\.local(?=[:/]|$)|[^\s/]*(?:private|internal)[^\s/]*)\S*/i],
      ["opaque_secret_material", /\b(?:secret|credential|token)\s*[:=]\s*\S{8,}/i],
      ["fake_personal_project_id", /\b(?:project|synthetic-project-scope):(?:user|personal|global)\b/i],
      ["actual_personal_data_marker", /\bactual[_ -]?personal[_ -]?(?:data|material|identity)(?:\b|_)/i],
      ["raw_prompt_material", /\braw[_ -]?prompt(?:\b|_)/i],
      ["raw_transcript_material", /\braw[_ -]?transcript(?:\b|_)/i],
      ["hidden_reasoning_material", /\b(?:hidden[_ -]?reasoning|chain[_ -]?of[_ -]?thought)(?:\b|_)/i],
      ["terminal_dump_material", /\bterminal[_ -]?(?:dump|history|log)(?:\b|_)/i],
      ["environment_dump_material", /\benvironment[_ -]?(?:dump|snapshot)(?:\b|_)/i],
    ];
    for (const [code, pattern] of patterns) {
      if (pattern.test(value)) sink.add("unsafe_material", code, path, true);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => scanUnsafeMaterial(item, `${path}[${index}]`, sink, depth + 1));
    return;
  }
  if (!isProtocolRecordV01(value)) return;
  const forbiddenFieldPatterns: Array<[string, RegExp]> = [
    ["raw_prompt_field", /(?:^|_)raw_prompt(?:$|_)/i],
    ["raw_transcript_field", /(?:^|_)raw_transcript(?:$|_)/i],
    ["hidden_reasoning_field", /(?:hidden_reasoning|chain_of_thought)/i],
    ["terminal_dump_field", /terminal_(?:dump|history|log)/i],
    ["environment_dump_field", /(?:environment|env)_(?:dump|snapshot)/i],
    ["credential_field", /(?:credential|api_key|private_key|access_token|cookie|secret)/i],
    ["raw_provider_output_field", /raw_provider_output/i],
    ["actual_personal_data_field", /actual_personal_(?:data|material|identity)/i],
  ];
  for (const [key, nested] of Object.entries(value).sort(([left], [right]) =>
    compareProtocolCodeUnitsV01(left, right),
  )) {
    const isValidatedBoundaryField =
      privacyKeys.has(key) ||
      authorityKeys.has(key) ||
      semanticAssertionKeys.has(key) ||
      key === "authenticity_established";
    if (!isValidatedBoundaryField) {
      for (const [code, pattern] of forbiddenFieldPatterns) {
        if (pattern.test(key)) sink.add("unsafe_material", code, path, true);
      }
    }
    scanUnsafeMaterial(nested, `${path}.${safeKnownPathSegment(key)}`, sink, depth + 1);
  }
}

function safeKnownPathSegment(key: string): string {
  return knownPathSegments.has(key) ? key : "unknown";
}

export function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
