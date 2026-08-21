import type { ExternalRefV01 } from "./external-ref";
import type {
  OperationalReentryMatchedCohortArmV03,
  OperationalReentryMatchedCohortBlockV03,
  OperationalReentryMatchedCohortIntegrityV03,
  OperationalReentryMatchedCohortModelInputV03,
  OperationalReentryMatchedCohortModelOutputV03,
  OperationalReentryMatchedCohortWireOutputV03,
} from "./operational-reentry-matched-cohort-v0-3";

export const OPERATIONAL_REENTRY_MATCHED_COHORT_VERSION_V04 =
  "operational_reentry_matched_cohort.v0.4" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V05 =
  "operational_reentry_matched_cohort_codec.v0.5" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04 =
  "operational_reentry_clean_control_matched_cohort_provider_contract.v0.4" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V04 =
  "operational_reentry_matched_cohort_parser.v0.4" as const;
export const OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06 =
  "openai_responses_operational_reentry_matched_cohort_adapter.v0.6" as const;

export type OperationalReentryMatchedCohortArmV04 =
  OperationalReentryMatchedCohortArmV03;
export type OperationalReentryMatchedCohortBlockV04 =
  OperationalReentryMatchedCohortBlockV03;
export type OperationalReentryMatchedCohortIntegrityV04 =
  OperationalReentryMatchedCohortIntegrityV03;
export type OperationalReentryMatchedCohortModelOutputV04 =
  OperationalReentryMatchedCohortModelOutputV03;
export type OperationalReentryMatchedCohortWireOutputV04 =
  OperationalReentryMatchedCohortWireOutputV03;

export interface OperationalReentryMatchedCohortProviderMaterialV04 {
  task: OperationalReentryMatchedCohortModelInputV03["task"];
  common_task_evidence: OperationalReentryMatchedCohortModelInputV03["common_task_evidence"];
  continuation_context: OperationalReentryMatchedCohortModelInputV03["continuation_context"];
  stale_relation: OperationalReentryMatchedCohortModelInputV03["stale_relation"];
  allowed_output: OperationalReentryMatchedCohortModelInputV03["allowed_output"];
  authority_notice: OperationalReentryMatchedCohortModelInputV03["authority_notice"];
}

/**
 * Local invocation identity and provider-visible experimental material are
 * distinct by construction. Only `provider_material` may cross model egress.
 */
export interface OperationalReentryMatchedCohortInvocationV04 {
  input_kind: "operational_reentry_matched_cohort_v04";
  codec_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V05;
  local_invocation_context: {
    cohort_ref: string;
    call_slot_id: string;
    repeat_block: OperationalReentryMatchedCohortBlockV04;
  };
  provider_material: OperationalReentryMatchedCohortProviderMaterialV04;
}

export interface OperationalReentryMatchedCohortRouteV04 {
  gateway_version: "model_gateway.v0.1";
  purpose: "operational_reentry_matched_cohort_v04";
  provider_ref: ExternalRefV01;
  model_ref: ExternalRefV01;
  adapter_implementation_id: "openai_responses.operational_reentry_matched_cohort";
  adapter_implementation_version: typeof OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06;
  provider_contract_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04;
  provider_contract_fingerprint: string;
  maximum_canonical_wire_response_bytes: number;
  response_safety_margin_bytes: number;
  response_bytes: number;
  max_output_tokens: number;
  prepared_without_provider_egress: true;
  integrity_fingerprint: string;
}

export interface OperationalReentryMatchedCohortProviderContractV04 {
  provider_contract_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04;
  input_contract_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_VERSION_V04;
  input_codec_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V05;
  response_schema_version: "operational_reentry_matched_cohort_response_schema.v0.4";
  parser_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V04;
  openai_adapter_implementation_version: typeof OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06;
  strict_structured_output_supported_subset_required: true;
  parser_closed_wire_contract: true;
  parser_closure_cardinality: 172032;
  selection_representation: "exact_required_boolean_objects";
  common_task_evidence_fingerprint_locally_derived: true;
  required_check_token_locally_derived: true;
  target_disposition_locally_derived: true;
  prepared_without_provider_egress: true;
  local_invocation_identity_provider_visible: false;
  transport_correlation_experimental_material: false;
  maximum_canonical_wire_response_bytes: number;
  response_safety_margin_bytes: number;
  response_bytes: number;
  max_output_tokens: number;
  raw_prompt_persisted: false;
  raw_provider_response_persisted: false;
  raw_provider_error_persisted: false;
  hidden_reasoning_persisted: false;
  successor_live_authorizations_created: 0;
  successor_live_authorizations_consumed: 0;
  real_provider_calls: 0;
  compatibility_result: "none";
  successor_live_probe_authorized: false;
  behavioral_cohort_authorized: false;
  replication_authorized: false;
  policy_authorized: false;
  stage_7_authorized: false;
  integrity: OperationalReentryMatchedCohortIntegrityV04;
}
