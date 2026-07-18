import type { CriterionAssessmentV01 } from "./criterion-assessment";
import type { ExternalRefTrustClassV01, ExternalRefV01 } from "./external-ref";
import type {
  ModelGatewayCostBudgetV01,
  ModelInvocationReceiptV02,
} from "./model-invocation-receipt";

export const STRATEGIC_ADVANTAGE_TRANSFER_PROFILE_VERSION_V01 =
  "strategic_advantage_transfer.v0.1" as const;
export const STRATEGIC_ADVANTAGE_TRANSFER_WORKING_FRAME_VERSION_V01 =
  "strategic_advantage_transfer_working_frame.v0.1" as const;
export const STRATEGIC_ADVANTAGE_TRANSFER_SOURCE_CATALOG_VERSION_V01 =
  "strategic_advantage_transfer_source_catalog.v0.1" as const;
export const STRATEGIC_ADVANTAGE_TRANSFER_MODEL_SCHEMA_VERSION_V01 =
  "strategic_advantage_transfer_model_output.v0.1" as const;
export const STRATEGIC_ADVANTAGE_TRANSFER_BUDGET_VERSION_V01 =
  "strategic_advantage_transfer_budget.v0.1" as const;

export const STRATEGIC_ADVANTAGE_TRANSFER_LENSES_V01 = [
  "constraint_fit",
  "verification_leverage",
  "regression_safety",
] as const;

export type StrategicAdvantageTransferLensIdV01 =
  (typeof STRATEGIC_ADVANTAGE_TRANSFER_LENSES_V01)[number];

export const STRATEGIC_ADVANTAGE_TRANSFER_MAX_LENSES_V01 = 3 as const;
export const STRATEGIC_ADVANTAGE_TRANSFER_MAX_TRANSFERS_V01 = 3 as const;
export const STRATEGIC_ADVANTAGE_TRANSFER_MAX_SOURCE_CATALOG_ITEMS_V01 =
  64 as const;
export const STRATEGIC_ADVANTAGE_TRANSFER_MAX_SOURCE_REFS_V01 = 16 as const;
export const STRATEGIC_ADVANTAGE_TRANSFER_MAX_TEXT_CHARACTERS_V01 = 1200 as const;
export const STRATEGIC_ADVANTAGE_TRANSFER_MAX_TEXT_ITEMS_V01 = 16 as const;
export const STRATEGIC_ADVANTAGE_TRANSFER_MAX_CANONICAL_UTF8_BYTES_V01 =
  98_304 as const;
export const STRATEGIC_ADVANTAGE_TRANSFER_MAX_INPUT_BYTES_V01 = 65_536 as const;
export const STRATEGIC_ADVANTAGE_TRANSFER_MAX_OUTPUT_TOKENS_V01 = 2_048 as const;
export const STRATEGIC_ADVANTAGE_TRANSFER_TIMEOUT_MS_V01 = 20_000 as const;

export interface StrategicAdvantageTransferBudgetV01 {
  budget_version: typeof STRATEGIC_ADVANTAGE_TRANSFER_BUDGET_VERSION_V01;
  max_lenses: typeof STRATEGIC_ADVANTAGE_TRANSFER_MAX_LENSES_V01;
  max_transfer_items: typeof STRATEGIC_ADVANTAGE_TRANSFER_MAX_TRANSFERS_V01;
  max_source_catalog_items: typeof STRATEGIC_ADVANTAGE_TRANSFER_MAX_SOURCE_CATALOG_ITEMS_V01;
  max_source_refs_per_transfer: typeof STRATEGIC_ADVANTAGE_TRANSFER_MAX_SOURCE_REFS_V01;
  max_text_characters: typeof STRATEGIC_ADVANTAGE_TRANSFER_MAX_TEXT_CHARACTERS_V01;
  max_total_canonical_utf8_bytes: typeof STRATEGIC_ADVANTAGE_TRANSFER_MAX_CANONICAL_UTF8_BYTES_V01;
  model: {
    max_input_bytes: typeof STRATEGIC_ADVANTAGE_TRANSFER_MAX_INPUT_BYTES_V01;
    max_output_tokens: typeof STRATEGIC_ADVANTAGE_TRANSFER_MAX_OUTPUT_TOKENS_V01;
    max_provider_calls: 1;
    timeout_ms: typeof STRATEGIC_ADVANTAGE_TRANSFER_TIMEOUT_MS_V01;
    automatic_retry: false;
    provider_failover: false;
    cost:
      | {
          status: "unavailable";
          reason: "cost_authority_unavailable";
        }
      | {
          status: "available";
          budget: ModelGatewayCostBudgetV01;
        };
  };
  truncation_allowed: false;
}

export interface StrategicAdvantageTransferSourceProposalBindingV01 {
  proposal_id: string;
  proposal_fingerprint: string;
  candidate_bindings: Array<{
    candidate_id: string;
    candidate_fingerprint: string;
  }>;
}

export interface StrategicAdvantageTransferBaseStrategyV01 {
  basis: "packet_selected_accepted_semantic_state";
  delta_type: "agent_plan_delta";
  semantic_state_record_id: string;
  semantic_state_record_fingerprint: string;
  state_content_fingerprint: string;
  state_ref: ExternalRefV01;
  target_ref: ExternalRefV01;
  target_key: string;
  revision: number;
  bounded_summary: string;
  source_proposal_id: string;
  source_proposal_fingerprint: string;
  source_candidate_id: string;
  source_candidate_fingerprint: string;
  source_decision_id: string;
  source_decision_fingerprint: string;
  source_transition_receipt_id: string;
  source_transition_receipt_fingerprint: string;
  currentness: "fresh";
  source_refs: ExternalRefV01[];
  base_fingerprint: string;
}

export interface StrategicAdvantageTransferWorkingFrameV01 {
  frame_version: typeof STRATEGIC_ADVANTAGE_TRANSFER_WORKING_FRAME_VERSION_V01;
  workspace_id: string;
  project_id: string;
  packet_ref: ExternalRefV01;
  receipt_ref: ExternalRefV01;
  assessment_version: CriterionAssessmentV01["assessment_version"];
  assessment_fingerprint: string;
  source_proposal: StrategicAdvantageTransferSourceProposalBindingV01;
  data_classification: "public_safe" | "private" | "local_only" | "secret";
  task_goal: string;
  success_criteria: Array<{
    criterion_id: string;
    criterion: string;
    status: CriterionAssessmentV01["criteria"][number]["status"];
    basis: CriterionAssessmentV01["criteria"][number]["basis"];
    uncertainty: string[];
  }>;
  required_checks: string[];
  forbidden_actions: string[];
  expected_artifacts: string[];
  required_return_fields: string[];
  selected_accepted_state_refs: ExternalRefV01[];
  excluded_context_summaries: string[];
  gap_summaries: string[];
  base_strategy: StrategicAdvantageTransferBaseStrategyV01;
  trust_summary: CriterionAssessmentV01["criteria"][number]["trust"];
  coverage_summary: string[];
  authority: {
    authoritative: false;
    creates_decision: false;
    applies_transition: false;
    changes_semantic_state: false;
    changes_later_context: false;
  };
  working_frame_fingerprint: string;
}

export interface StrategicAdvantageTransferSourceCatalogEntryV01 {
  source_key: string;
  ref: ExternalRefV01;
  material_kind: string;
  /** Trust of the bounded material lane, independent of its lineage ref. */
  trust_class: ExternalRefTrustClassV01;
  /** Persisted provenance classification carried by the exact source ref. */
  reference_trust_class: ExternalRefTrustClassV01;
  bounded_summary: string;
  source_fingerprint: string | null;
}

export interface StrategicAdvantageTransferSourceCatalogV01 {
  catalog_version: typeof STRATEGIC_ADVANTAGE_TRANSFER_SOURCE_CATALOG_VERSION_V01;
  workspace_id: string;
  project_id: string;
  items: StrategicAdvantageTransferSourceCatalogEntryV01[];
  source_catalog_fingerprint: string;
}

export interface StrategicAdvantageTransferModelInputV01 {
  input_kind: "strategic_advantage_transfer";
  profile_version: typeof STRATEGIC_ADVANTAGE_TRANSFER_PROFILE_VERSION_V01;
  schema_version: typeof STRATEGIC_ADVANTAGE_TRANSFER_MODEL_SCHEMA_VERSION_V01;
  working_frame: {
    working_frame_fingerprint: string;
    data_classification: "public_safe" | "private" | "local_only" | "secret";
    task_goal: string;
    success_criteria: StrategicAdvantageTransferWorkingFrameV01["success_criteria"];
    required_checks: string[];
    forbidden_actions: string[];
    expected_artifacts: string[];
    required_return_fields: string[];
    base_strategy_summary: string;
    excluded_context_summaries: string[];
    gap_summaries: string[];
  };
  source_catalog: {
    source_catalog_fingerprint: string;
    items: Array<{
      source_key: string;
      material_kind: string;
      trust_class: ExternalRefTrustClassV01;
      bounded_summary: string;
    }>;
  };
  lenses: StrategicAdvantageTransferLensIdV01[];
  budget: StrategicAdvantageTransferBudgetV01;
}

export interface StrategicAdvantageTransferRegressionReviewV01 {
  regression_risks: string[];
  checks_or_observations_needed: string[];
  stop_conditions: string[];
  invalidation_conditions: string[];
  source_keys: string[];
}

export interface StrategicAdvantageTransferModelTransferV01 {
  result: "transfer";
  lens_id: StrategicAdvantageTransferLensIdV01;
  title: string;
  applicability_condition: string;
  expected_effect: string;
  transfer_cost: string;
  source_keys: string[];
  falsifier: string;
  uncertainty: string[];
  introduced_risks: string[];
  patch_summary: string;
  regression_review: StrategicAdvantageTransferRegressionReviewV01;
  known_limitations: string[];
}

export interface StrategicAdvantageTransferModelNoTransferV01 {
  result: "no_transfer";
  lens_id: StrategicAdvantageTransferLensIdV01;
  non_transfer_reason: string;
}

export type StrategicAdvantageTransferModelLensResultV01 =
  | StrategicAdvantageTransferModelTransferV01
  | StrategicAdvantageTransferModelNoTransferV01;

export interface StrategicAdvantageTransferModelOutputV01 {
  schema_version: typeof STRATEGIC_ADVANTAGE_TRANSFER_MODEL_SCHEMA_VERSION_V01;
  lens_results: StrategicAdvantageTransferModelLensResultV01[];
  stop_reason: "completed" | "no_transferable_advantage";
}

export interface StrategicAdvantageTransferNormalizedItemV01 {
  transfer_id: string;
  lens_id: StrategicAdvantageTransferLensIdV01;
  title: string;
  applicability_condition: string;
  expected_effect: string;
  transfer_cost: string;
  source_keys: string[];
  source_refs: ExternalRefV01[];
  falsifier: string;
  uncertainty: string[];
  introduced_risks: string[];
  patch_summary: string;
  regression_review: StrategicAdvantageTransferRegressionReviewV01 & {
    source_refs: ExternalRefV01[];
  };
  known_limitations: string[];
  support: {
    status: "supported" | "unknown";
    basis: "observed" | "attested" | "mixed" | "insufficient";
    direct_local_observation: number;
    verified_external_observation: number;
    host_attestation: number;
    provider_report: number;
    derived_interpretation: number;
    conflicted_material: number;
    skipped_material: number;
    unavailable_material: number;
    missing_material: number;
    uncertain_material: number;
    skipped_or_unavailable_material: number;
  };
}

export interface StrategicAdvantageTransferProfileV01 {
  profile_version: typeof STRATEGIC_ADVANTAGE_TRANSFER_PROFILE_VERSION_V01;
  analysis_identity: string;
  source_proposal: StrategicAdvantageTransferSourceProposalBindingV01;
  packet_ref: ExternalRefV01;
  receipt_ref: ExternalRefV01;
  assessment: CriterionAssessmentV01;
  base_strategy: StrategicAdvantageTransferBaseStrategyV01;
  working_frame: StrategicAdvantageTransferWorkingFrameV01;
  source_catalog: StrategicAdvantageTransferSourceCatalogV01;
  lenses: StrategicAdvantageTransferLensIdV01[];
  budget: StrategicAdvantageTransferBudgetV01;
  model_invocation: {
    receipt: ModelInvocationReceiptV02;
    receipt_ref: ExternalRefV01;
    receipt_fingerprint: string;
    normalized_output_fingerprint: string;
    schema_version: typeof STRATEGIC_ADVANTAGE_TRANSFER_MODEL_SCHEMA_VERSION_V01;
  };
  normalized_model_output: StrategicAdvantageTransferModelOutputV01;
  transfer_items: StrategicAdvantageTransferNormalizedItemV01[];
  stop_reason: StrategicAdvantageTransferModelOutputV01["stop_reason"];
  compatibility: {
    source_contracts: string[];
    warnings: string[];
  };
  authority: {
    authoritative: false;
    creates_evidence: false;
    validates_claims: false;
    creates_decision: false;
    authorizes_gate: false;
    applies_transition: false;
    changes_semantic_state: false;
    changes_later_context: false;
    authorizes_execution: false;
    authorizes_external_action: false;
    confidence_or_agreement_grants_authority: false;
  };
}
