import type { ExternalRefV01 } from "./external-ref";
import type {
  OperationalReentryMatchedCohortArmV02,
  OperationalReentryMatchedCohortBlockV02,
  OperationalReentryMatchedCohortCommonTaskEvidenceV02,
  OperationalReentryMatchedCohortContinuationItemV02,
  OperationalReentryMatchedCohortIntegrityV02,
  OperationalReentryMatchedCohortModelInputV02,
  OperationalReentryMatchedCohortModelOutputV02,
} from "./operational-reentry-matched-cohort-v0-2";

export const OPERATIONAL_REENTRY_MATCHED_COHORT_VERSION_V03 =
  "operational_reentry_matched_cohort.v0.3" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V04 =
  "operational_reentry_matched_cohort_codec.v0.4" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03 =
  "operational_reentry_clean_control_matched_cohort_provider_contract.v0.3" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04 =
  "operational_reentry_matched_cohort_response_schema.v0.4" as const;
export const OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V03 =
  "operational_reentry_matched_cohort_parser.v0.3" as const;
export const OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V05 =
  "openai_responses_operational_reentry_matched_cohort_adapter.v0.5" as const;

export type OperationalReentryMatchedCohortArmV03 =
  OperationalReentryMatchedCohortArmV02;
export type OperationalReentryMatchedCohortBlockV03 =
  OperationalReentryMatchedCohortBlockV02;
export type OperationalReentryMatchedCohortIntegrityV03 =
  OperationalReentryMatchedCohortIntegrityV02;
export type OperationalReentryMatchedCohortModelOutputV03 =
  OperationalReentryMatchedCohortModelOutputV02;

export const OPERATIONAL_REENTRY_MATCHED_COHORT_EMPTY_SELECTION_KEY_V03 =
  "no_continuation_available" as const;

export interface OperationalReentryMatchedCohortModelInputV03 {
  input_kind: "operational_reentry_matched_cohort_v03";
  codec_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V04;
  invocation_context: {
    cohort_ref: string;
    call_slot_id: string;
    repeat_block: OperationalReentryMatchedCohortBlockV03;
  };
  task: OperationalReentryMatchedCohortModelInputV02["task"];
  common_task_evidence: OperationalReentryMatchedCohortCommonTaskEvidenceV02;
  continuation_context: OperationalReentryMatchedCohortContinuationItemV02[];
  stale_relation: OperationalReentryMatchedCohortModelInputV02["stale_relation"];
  allowed_output: {
    result_statuses: OperationalReentryMatchedCohortModelInputV02["allowed_output"]["result_statuses"];
    required_check_dispositions: OperationalReentryMatchedCohortModelInputV02["allowed_output"]["required_check_dispositions"];
    referenced_continuation_tokens: readonly string[];
    operation_action_class_tokens: OperationalReentryMatchedCohortModelInputV02["allowed_output"]["operation_action_class_tokens"];
    result_limitation_tokens: OperationalReentryMatchedCohortModelInputV02["allowed_output"]["result_limitation_tokens"];
  };
  authority_notice: OperationalReentryMatchedCohortModelInputV02["authority_notice"];
}

export interface OperationalReentryMatchedCohortWireOutputV03 {
  result_status: OperationalReentryMatchedCohortModelOutputV03["result_status"];
  required_check_disposition: OperationalReentryMatchedCohortModelOutputV03["required_check"]["disposition"];
  referenced_continuation_selections: Record<string, boolean>;
  operation_action_class_selections: Record<string, boolean>;
  result_limitation_selections: Record<string, boolean>;
  abstention: boolean;
}

export interface OperationalReentryMatchedCohortRouteV03 {
  gateway_version: "model_gateway.v0.1";
  purpose: "operational_reentry_matched_cohort_v03";
  provider_ref: ExternalRefV01;
  model_ref: ExternalRefV01;
  adapter_implementation_id: "openai_responses.operational_reentry_matched_cohort";
  adapter_implementation_version: typeof OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V05;
  provider_contract_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03;
  provider_contract_fingerprint: string;
  maximum_canonical_wire_response_bytes: number;
  response_safety_margin_bytes: number;
  response_bytes: number;
  max_output_tokens: number;
  prepared_without_provider_egress: true;
  integrity_fingerprint: string;
}

export interface OperationalReentryMatchedCohortProviderContractV03 {
  provider_contract_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03;
  input_codec_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_CODEC_VERSION_V04;
  response_schema_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04;
  parser_version: typeof OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V03;
  openai_adapter_implementation_version: typeof OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V05;
  strict_structured_output_supported_subset_required: true;
  parser_closed_wire_contract: true;
  selection_representation: "exact_required_boolean_objects";
  common_task_evidence_fingerprint_locally_derived: true;
  required_check_token_locally_derived: true;
  target_disposition_locally_derived: true;
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
  successor_compatibility_result: "none";
  successor_live_probe_authorized: false;
  behavioral_cohort_authorized: false;
  replication_authorized: false;
  policy_authorized: false;
  stage_7_authorized: false;
  integrity: OperationalReentryMatchedCohortIntegrityV03;
}
