import {
  assertModelEgressTextIsSafe,
  refuseModelEgress,
  requireModelEgressText,
  serializeModelEgressJson,
  utf8ByteLength,
  type ModelTransportResponse,
} from "@/lib/model-egress/bounded-model-payload";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  ModelGatewayAdapterFailureV01,
  GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01,
  GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01,
  OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
  PLANNER_MODEL_GATEWAY_PURPOSE_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01,
  TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
  type ModelAdapterImplementationV01,
  type ModelAdapterInputV01,
  type ModelAdapterInvocationResultV01,
  type ModelAdapterV01,
  type ModelGatewayNormalizedUsageV01,
  type ModelGatewayPurposeV01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  buildGuideBriefInterpretationSystemPromptV01,
  guideBriefInterpretationResponseSchemaV01,
  parseGuideBriefInterpretationOutputV01,
  projectGuideBriefInterpretationModelMaterialV01,
  GUIDE_BRIEF_INTERPRETATION_MODEL_EGRESS_LIMITS_V01,
} from "@/lib/vnext/model-gateway/openai/guide-brief-interpretation-codec";
import {
  buildObserveSystemPrompt,
  OBSERVE_MODEL_EGRESS_LIMITS,
  observeResponseSchema,
  parseObserveOutput,
  projectObserveModelMaterial,
} from "@/lib/vnext/model-gateway/openai/observe-codec";
import {
  buildPlannerSystemPrompt,
  parsePlannerOutput,
  PLANNER_MODEL_EGRESS_LIMITS,
  plannerResponseSchema,
  projectPlannerModelMaterial,
} from "@/lib/vnext/model-gateway/openai/planner-codec";
import {
  buildTemporalSystemPrompt,
  parseTemporalOutput,
  projectTemporalModelMaterial,
  TEMPORAL_MODEL_EGRESS_LIMITS,
  temporalResponseSchema,
} from "@/lib/vnext/model-gateway/openai/temporal-codec";
import {
  buildStrategicAdvantageTransferSystemPromptV01,
  parseStrategicAdvantageTransferOutputV01,
  projectStrategicAdvantageTransferModelMaterialV01,
  STRATEGIC_ADVANTAGE_TRANSFER_MODEL_EGRESS_LIMITS,
  strategicAdvantageTransferResponseSchema,
} from "@/lib/vnext/model-gateway/openai/strategic-advantage-transfer-codec";
import {
  buildGovernedActorLabSystemPromptV01,
  governedActorLabResponseSchemaV01,
  parseGovernedActorLabOutputV01,
  projectGovernedActorLabModelMaterialV01,
  GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01,
} from "@/lib/vnext/model-gateway/openai/governed-actor-lab-codec";
import {
  buildOperationalReentryMatchedCohortSystemPromptV01,
  operationalReentryMatchedCohortResponseSchemaV02,
  parseOperationalReentryMatchedCohortOutputV01,
  projectOperationalReentryMatchedCohortModelMaterialV01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-codec";
import {
  buildOperationalReentryMatchedCohortSystemPromptV02,
  operationalReentryMatchedCohortResponseSchemaV03,
  parseOperationalReentryMatchedCohortOutputV02,
  projectOperationalReentryMatchedCohortModelMaterialV02,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V02,
  OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V03,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-2-codec";
import {
  buildOperationalReentryMatchedCohortSystemPromptV03,
  operationalReentryMatchedCohortResponseSchemaV04,
  parseOperationalReentryMatchedCohortOutputV03,
  projectOperationalReentryMatchedCohortModelMaterialV03,
  OperationalReentryMatchedCohortOutputInvalidErrorV03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-3-codec";
import {
  buildOperationalReentryMatchedCohortSystemPromptV04,
  operationalReentryMatchedCohortResponseSchemaV04 as operationalReentryMatchedCohortResponseSchemaSeparatedV04,
  parseOperationalReentryMatchedCohortOutputV04,
  projectOperationalReentryMatchedCohortProviderMaterialV04,
  OperationalReentryMatchedCohortOutputInvalidErrorV04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-matched-cohort-v0-4-codec";
import {
  buildOperationalReentryStaleResetCrossCaseSystemPromptV01,
  operationalReentryStaleResetCrossCaseResponseSchemaV01,
  parseOperationalReentryStaleResetCrossCaseOutputV01,
  projectOperationalReentryStaleResetCrossCaseProviderMaterialV01,
  OperationalReentryStaleResetCrossCaseOutputInvalidErrorV01,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_MODEL_EGRESS_LIMITS_V01,
} from "@/lib/vnext/model-gateway/openai/operational-reentry-stale-reset-cross-case-replication-v0-1-codec";
import {
  OpenAIStrictSchemaSupportedSubsetErrorV01,
  validateOpenAIStrictSchemaSupportedSubsetV01,
} from "@/lib/vnext/model-gateway/openai/strict-schema-supported-subset";
import {
  createDeterministicModelClientRequestIdV01,
  projectModelProviderRejectionObservationV01,
} from "@/lib/vnext/model-gateway/provider-rejection-observation";
import {
  projectModelProviderResponseInvalidObservationV01,
  type ModelProviderIncompleteReasonV01,
  type ModelProviderResponseInvalidStageV01,
  type ModelProviderResponseStatusV01,
} from "@/lib/vnext/model-gateway/provider-response-invalid-observation";
import type { OperationalReentryMatchedCohortModelInputV01 } from "@/types/vnext/operational-reentry-matched-cohort";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V02,
  type OperationalReentryMatchedCohortModelInputV02,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-2";
import {
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V05,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03,
  OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04,
  type OperationalReentryMatchedCohortModelInputV03,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-3";
import {
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V04,
  OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04,
  type OperationalReentryMatchedCohortInvocationV04,
} from "@/types/vnext/operational-reentry-matched-cohort-v0-4";
import {
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_ADAPTER_VERSION_V02,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PARSER_VERSION_V02,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PROVIDER_CONTRACT_VERSION_V02,
  OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_RESPONSE_SCHEMA_VERSION_V02,
  type OperationalReentryStaleResetCrossCaseInvocationV01,
} from "@/types/vnext/operational-reentry-stale-reset-cross-case-replication";

export const OPENAI_RESPONSES_ENDPOINT_V01 =
  "https://api.openai.com/v1/responses" as const;
export const OPENAI_RESPONSES_OBSERVE_ADAPTER_ID_V01 =
  "openai_responses.observe" as const;
export const OPENAI_RESPONSES_OBSERVE_ADAPTER_VERSION_V01 =
  "openai_responses_observe_adapter.v0.1" as const;
export const OPENAI_RESPONSES_PLANNER_ADAPTER_ID_V01 =
  "openai_responses.planner" as const;
export const OPENAI_RESPONSES_PLANNER_ADAPTER_VERSION_V01 =
  "openai_responses_planner_adapter.v0.1" as const;
export const OPENAI_RESPONSES_TEMPORAL_ADAPTER_ID_V01 =
  "openai_responses.temporal" as const;
export const OPENAI_RESPONSES_TEMPORAL_ADAPTER_VERSION_V01 =
  "openai_responses_temporal_adapter.v0.1" as const;
export const OPENAI_RESPONSES_STRATEGIC_ADAPTER_ID_V01 =
  "openai_responses.strategic_advantage_transfer" as const;
export const OPENAI_RESPONSES_STRATEGIC_ADAPTER_VERSION_V01 =
  "openai_responses_strategic_advantage_transfer_adapter.v0.1" as const;
export const OPENAI_RESPONSES_GUIDE_BRIEF_INTERPRETATION_ADAPTER_ID_V01 =
  "openai_responses.guidebrief_interpretation" as const;
export const OPENAI_RESPONSES_GUIDE_BRIEF_INTERPRETATION_ADAPTER_VERSION_V01 =
  "openai_responses_guidebrief_interpretation_adapter.v0.1" as const;
export const OPENAI_RESPONSES_GOVERNED_ACTOR_LAB_ADAPTER_ID_V01 =
  "openai_responses.governed_actor_lab" as const;
export const OPENAI_RESPONSES_GOVERNED_ACTOR_LAB_ADAPTER_VERSION_V01 =
  "openai_responses_governed_actor_lab_adapter.v0.1" as const;
export const OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_ID_V01 =
  "openai_responses.operational_reentry_matched_cohort" as const;
export const OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V01 =
  "openai_responses_operational_reentry_matched_cohort_adapter.v0.1" as const;
export const OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V02 =
  "openai_responses_operational_reentry_matched_cohort_adapter.v0.2" as const;
export const OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03 =
  "openai_responses_operational_reentry_matched_cohort_adapter.v0.3" as const;
export const OPENAI_RESPONSES_OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_ADAPTER_ID_V01 =
  "openai_responses.operational_reentry_stale_reset_cross_case_replication" as const;
export const OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02 =
  "gpt-4.1-mini-2025-04-14" as const;

const DEFAULT_MODEL = "gpt-4.1-mini";
const MAX_PROVIDER_REJECTION_DIAGNOSTIC_BYTES_V02 = 4_096;

export interface OpenAIResponsesTransportRequestV01 {
  url: typeof OPENAI_RESPONSES_ENDPOINT_V01;
  method: "POST";
  headers: Readonly<
    Record<"Authorization" | "Content-Type", string> &
      Partial<Record<"X-Client-Request-Id", string>>
  >;
  body: string;
  signal: AbortSignal;
}

export type OpenAIResponsesTransportV01 = (
  request: OpenAIResponsesTransportRequestV01,
) => Promise<ModelTransportResponse>;

export interface OpenAIResponsesAdapterDependenciesV01 {
  environment?: Partial<
    Pick<NodeJS.ProcessEnv, "OPENAI_API_KEY" | "OPENAI_MODEL">
  >;
  transport?: OpenAIResponsesTransportV01;
}

export function projectOpenAIResponsesOperationalReentryMatchedCohortRequestV01(
  modelInput: OperationalReentryMatchedCohortModelInputV01,
) {
  const purpose =
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01;
  const model =
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02;
  const implementation = describeOpenAIImplementation(purpose);
  const input = {
    canonical_project_id: "project:00000000-0000-4000-8000-000000000000",
    ...structuredClone(modelInput),
  } as ModelAdapterInputV01;
  const request = buildOpenAIResponsesRequestMaterialV01({
    purpose,
    codec: codecFor(input),
    model,
    implementation,
    max_output_tokens:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.maxOutputTokens,
    max_input_bytes:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.finalRequestBytes,
  });
  return {
    ...request,
    provider: "openai" as const,
    model,
    adapter_implementation_id:
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_ID_V01,
    adapter_implementation_version:
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03,
    provider_endpoint_fingerprint: createProtocolSha256V01(
      OPENAI_RESPONSES_ENDPOINT_V01,
    ),
    strict_schema_supported_subset_version:
      "openai_strict_schema_supported_subset.v0.1" as const,
    response_schema_version:
      "operational_reentry_matched_cohort_response_schema.v0.2" as const,
    parser_version:
      "operational_reentry_matched_cohort_parser.v0.1" as const,
  };
}

export function projectOpenAIResponsesOperationalReentryMatchedCohortRequestV02(
  modelInput: OperationalReentryMatchedCohortModelInputV02,
) {
  const purpose =
    OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01;
  const model =
    OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02;
  const implementation = describeOpenAIImplementation(purpose);
  const input = {
    canonical_project_id: "project:00000000-0000-4000-8000-000000000000",
    ...structuredClone(modelInput),
  } as ModelAdapterInputV01;
  const request = buildOpenAIResponsesRequestMaterialV01({
    purpose,
    codec: codecFor(input),
    model,
    implementation,
    max_output_tokens:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.maxOutputTokens,
    max_input_bytes:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.finalRequestBytes,
  });
  return {
    ...request,
    provider: "openai" as const,
    model,
    adapter_implementation_id:
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_ID_V01,
    adapter_implementation_version:
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04,
    provider_contract_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V02,
    response_schema_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V03,
    parser_version: OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V02,
    real_provider_calls: 0 as const,
    compatibility_established: false as const,
    separately_authorized_compatibility_probe_required: true as const,
  };
}

export function projectOpenAIResponsesOperationalReentryMatchedCohortRequestV03(
  modelInput: OperationalReentryMatchedCohortModelInputV03,
) {
  const purpose =
    OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01;
  const model = OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02;
  const implementation = describeOpenAIImplementation(purpose);
  const input = {
    canonical_project_id: "project:00000000-0000-4000-8000-000000000000",
    ...structuredClone(modelInput),
  } as ModelAdapterInputV01;
  const request = buildOpenAIResponsesRequestMaterialV01({
    purpose,
    codec: codecFor(input),
    model,
    implementation,
    max_output_tokens:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.maxOutputTokens,
    max_input_bytes:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.finalRequestBytes,
  });
  return {
    ...request,
    provider: "openai" as const,
    model,
    adapter_implementation_id:
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_ID_V01,
    adapter_implementation_version:
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V05,
    provider_contract_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03,
    response_schema_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04,
    parser_version: OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V03,
    real_provider_calls: 0 as const,
    successor_live_authorizations_created: 0 as const,
    successor_live_authorizations_consumed: 0 as const,
    compatibility_result: "none" as const,
    successor_live_probe_authorized: false as const,
  };
}

export function projectOpenAIResponsesOperationalReentryMatchedCohortRequestV04(
  invocation: OperationalReentryMatchedCohortInvocationV04,
) {
  const purpose =
    OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01;
  const model = OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02;
  const implementation = describeOpenAIImplementation(purpose);
  const input = {
    canonical_project_id: "project:00000000-0000-4000-8000-000000000000",
    ...structuredClone(invocation),
  } as ModelAdapterInputV01;
  const request = buildOpenAIResponsesRequestMaterialV01({
    purpose,
    codec: codecFor(input),
    model,
    implementation,
    max_output_tokens:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.maxOutputTokens,
    max_input_bytes:
      OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.finalRequestBytes,
  });
  return {
    ...request,
    provider: "openai" as const,
    model,
    adapter_implementation_id:
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_ID_V01,
    adapter_implementation_version:
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06,
    provider_contract_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04,
    response_schema_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_RESPONSE_SCHEMA_VERSION_V04,
    parser_version: OPERATIONAL_REENTRY_MATCHED_COHORT_PARSER_VERSION_V04,
    real_provider_calls: 0 as const,
    successor_live_authorizations_created: 0 as const,
    successor_live_authorizations_consumed: 0 as const,
    compatibility_result: "none" as const,
    successor_live_probe_authorized: false as const,
  };
}

export function projectOpenAIResponsesOperationalReentryStaleResetCrossCaseRequestV01(
  invocation: OperationalReentryStaleResetCrossCaseInvocationV01,
) {
  const purpose =
    OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01;
  const model = OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02;
  const implementation = describeOpenAIImplementation(purpose);
  const input = {
    canonical_project_id: "project:00000000-0000-4000-8000-000000000000",
    ...structuredClone(invocation),
  } as ModelAdapterInputV01;
  const request = buildOpenAIResponsesRequestMaterialV01({
    purpose,
    codec: codecFor(input),
    model,
    implementation,
    max_output_tokens:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_MODEL_EGRESS_LIMITS_V01.maxOutputTokens,
    max_input_bytes:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_MODEL_EGRESS_LIMITS_V01.finalRequestBytes,
  });
  return {
    ...request,
    provider: "openai" as const,
    model,
    adapter_implementation_id:
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_ADAPTER_ID_V01,
    adapter_implementation_version:
      OPENAI_RESPONSES_OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_ADAPTER_VERSION_V02,
    provider_contract_version:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PROVIDER_CONTRACT_VERSION_V02,
    response_schema_version:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_RESPONSE_SCHEMA_VERSION_V02,
    parser_version:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PARSER_VERSION_V02,
    real_provider_calls: 0 as const,
    live_compatibility_authorizations_created: 0 as const,
    live_compatibility_authorizations_consumed: 0 as const,
    compatibility_result: "none" as const,
    replication_live_authorized: false as const,
  };
}

export type OpenAILocalCapabilityStatusV01 =
  | "available"
  | "action_required"
  | "misconfigured"
  | "unavailable";

export interface OpenAILocalCapabilityDiagnosticV01 {
  status: OpenAILocalCapabilityStatusV01;
  summary: string;
  verification: "trusted_local_status";
}

/**
 * Reports only bounded local configuration readiness. It never contacts the
 * provider and never returns a credential or configured model identifier.
 */
export function readOpenAILocalCapabilityDiagnosticV01(
  environment: Partial<
    Pick<NodeJS.ProcessEnv, "OPENAI_API_KEY" | "OPENAI_MODEL">
  > = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
  },
): OpenAILocalCapabilityDiagnosticV01 {
  const apiKey = optionalConfigurationText(environment.OPENAI_API_KEY);
  const configuredModel = optionalConfigurationText(environment.OPENAI_MODEL);

  if (configuredModel && !isValidModelIdentifier(configuredModel)) {
    return {
      status: "misconfigured",
      summary:
        "Local OpenAI model configuration is malformed. Provider access was not contacted or verified.",
      verification: "trusted_local_status",
    };
  }
  if (!apiKey) {
    return {
      status: configuredModel ? "action_required" : "unavailable",
      summary: configuredModel
        ? "Local OpenAI model configuration is present, but a credential is required. Provider access was not contacted or verified."
        : "No local OpenAI credential is configured. Deterministic model behavior remains available.",
      verification: "trusted_local_status",
    };
  }
  return {
    status: "available",
    summary:
      "Local OpenAI configuration is present and syntactically valid. Provider access was not contacted or verified.",
    verification: "trusted_local_status",
  };
}

export function createOpenAIResponsesAdapterV01(
  dependencies: OpenAIResponsesAdapterDependenciesV01 = {},
): ModelAdapterV01 {
  const environment = dependencies.environment ?? process.env;
  const transport = dependencies.transport ?? sendOpenAIResponsesRequest;

  return {
    describe: describeOpenAIImplementation,
    async prepare(purpose, _signal) {
      const apiKey = optionalConfigurationText(environment.OPENAI_API_KEY);
      if (!apiKey) return null;
      const model = requireModelIdentifier(
        isOperationalReentryMatchedCohortPurposeV01(purpose)
          ? OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02
          : optionalConfigurationText(environment.OPENAI_MODEL) ?? DEFAULT_MODEL,
      );
      const implementation = describeOpenAIImplementation(purpose);

      return {
        ...implementation,
        purpose,
        provider_ref: {
          ref_version: "external_ref.v0.1",
          ref_type: "model_provider",
          external_id: "openai",
          provider: "openai",
          trust_class: "direct_local_observation",
        },
        model_ref: {
          ref_version: "external_ref.v0.1",
          ref_type: "provider_model",
          external_id: model,
          provider: "openai",
          trust_class: "direct_local_observation",
        },
        async invoke(input, lifecycle) {
          if (input.input_kind !== purpose) adapterResponseInvalid();
          const codec = codecFor(input);
          const request = buildOpenAIResponsesRequestMaterialV01({
            purpose,
            codec,
            model,
            implementation,
            max_output_tokens: lifecycle.budget.max_output_tokens,
            max_input_bytes: lifecycle.budget.max_input_bytes,
          });
          const requestBody = request.request_body;
          const schemaFingerprint = request.schema_fingerprint;
          const requestFingerprint = request.request_fingerprint;
          const routeFingerprint = request.adapter_request_route_fingerprint;
          let clientRequestId: string | null = null;
          if (isOperationalReentryMatchedCohortPurposeV01(purpose)) {
            if (
              input.input_kind !==
                OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01 &&
              input.input_kind !==
                OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01 &&
              input.input_kind !==
                OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01 &&
              input.input_kind !==
                OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01 &&
              input.input_kind !==
                OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01
            ) {
              adapterResponseInvalid();
            }
            if (!lifecycle.provider_request_trace_id) {
              refuseModelEgress(
                purpose,
                "model_egress_payload_unsupported",
                1,
                0,
              );
            }
            const callSlotId =
              input.input_kind ===
                OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01 ||
              input.input_kind ===
                OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01
                ? input.local_invocation_context.call_slot_id
                : input.invocation_context.call_slot_id;
            clientRequestId = createDeterministicModelClientRequestIdV01({
              purpose,
              provider_request_trace_id:
                lifecycle.provider_request_trace_id,
              call_slot_id: callSlotId,
              model,
            });
          }
          const responseInvalid = (
            stage: ModelProviderResponseInvalidStageV01,
            observation: {
              provider_status?: unknown;
              incomplete_reason?: unknown;
              output_text_present: boolean;
              provider_request_id?: unknown;
            },
          ): never => {
            throw new ModelGatewayAdapterFailureV01(
              "adapter_response_invalid",
              null,
              clientRequestId
                ? projectModelProviderResponseInvalidObservationV01({
                    stage,
                    provider_status: observation.provider_status,
                    incomplete_reason: observation.incomplete_reason,
                    output_text_present: observation.output_text_present,
                    provider_request_id: observation.provider_request_id,
                    client_request_id: clientRequestId,
                    route_fingerprint: routeFingerprint,
                    request_fingerprint: requestFingerprint,
                    schema_fingerprint: schemaFingerprint,
                  })
                : null,
            );
          };
          lifecycle.report_input_bytes(utf8ByteLength(requestBody));
          lifecycle.mark_egress_attempted();

          let response: ModelTransportResponse;
          try {
            response = await transport({
              url: OPENAI_RESPONSES_ENDPOINT_V01,
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                ...(clientRequestId
                  ? { "X-Client-Request-Id": clientRequestId }
                  : {}),
              },
              body: requestBody,
              signal: lifecycle.signal,
            });
          } catch {
            throw new ModelGatewayAdapterFailureV01("adapter_transport_failed");
          }

          if (
            typeof response.ok !== "boolean" ||
            typeof response.status !== "number"
          ) {
            responseInvalid("response_envelope_invalid", {
              output_text_present: false,
              provider_request_id: readProviderRequestIdV01(response),
            });
          }
          if (!response.ok) {
            if (!isOperationalReentryMatchedCohortPurposeV01(purpose)) {
              throw new ModelGatewayAdapterFailureV01(
                "adapter_provider_rejected",
              );
            }
            let errorPayload: unknown = null;
            let providerRequestId: string | null = null;
            let contentLength: number | null = null;
            try {
              providerRequestId =
                response.headers?.get("x-request-id") ??
                response.headers?.get("openai-request-id") ??
                null;
              const contentLengthHeader =
                response.headers?.get("content-length") ?? null;
              contentLength =
                contentLengthHeader !== null && /^\d{1,8}$/u.test(contentLengthHeader)
                  ? Number(contentLengthHeader)
                  : null;
            } catch {
              providerRequestId = null;
              contentLength = null;
            }
            if (
              contentLength === null ||
              contentLength <= MAX_PROVIDER_REJECTION_DIAGNOSTIC_BYTES_V02
            ) {
              try {
                if (response.text) {
                  const errorText = await response.text();
                  if (
                    utf8ByteLength(errorText) <=
                    MAX_PROVIDER_REJECTION_DIAGNOSTIC_BYTES_V02
                  ) {
                    errorPayload = JSON.parse(errorText) as unknown;
                  }
                } else {
                  errorPayload = await response.json();
                }
              } catch {
                errorPayload = null;
              }
            }
            throw new ModelGatewayAdapterFailureV01(
              "adapter_provider_rejected",
              projectModelProviderRejectionObservationV01({
                http_status: response.status,
                error_payload: errorPayload,
                provider_request_id: providerRequestId,
                client_request_id: clientRequestId!,
                route_fingerprint: routeFingerprint,
                request_fingerprint: requestFingerprint,
                schema_fingerprint: schemaFingerprint,
              }),
            );
          }

          let payload: unknown;
          try {
            payload = await response.json();
          } catch {
            responseInvalid("response_json_unreadable", {
              output_text_present: false,
              provider_request_id: readProviderRequestIdV01(response),
            });
          }
          let record: Record<string, unknown> | null = null;
          try {
            record = requireProviderRecord(payload);
          } catch {
            responseInvalid("response_envelope_invalid", {
              output_text_present: false,
              provider_request_id: readProviderRequestIdV01(response),
            });
          }
          if (record === null) {
            return responseInvalid("response_envelope_invalid", {
              output_text_present: false,
              provider_request_id: readProviderRequestIdV01(response),
            });
          }
          if (
            purpose ===
              OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01 &&
            !Object.hasOwn(record, "status")
          ) {
            responseInvalid("response_envelope_invalid", {
              output_text_present: extractOutputText(record) !== null,
              provider_request_id: readProviderRequestIdV01(response),
            });
          }
          if (Object.hasOwn(record, "status") && record.status !== "completed") {
            responseInvalid("response_status_not_completed", {
              provider_status: boundedProviderStatusV01(record.status),
              incomplete_reason: boundedIncompleteReasonV01(record),
              output_text_present: extractOutputText(record) !== null,
              provider_request_id: readProviderRequestIdV01(response),
            });
          }
          const outputText = extractOutputText(record);
          if (!outputText) {
            return responseInvalid("response_output_text_missing", {
              provider_status: boundedProviderStatusV01(record.status),
              output_text_present: false,
              provider_request_id: readProviderRequestIdV01(response),
            });
          }
          if (utf8ByteLength(outputText) > codec.response_bytes) {
            responseInvalid("response_output_text_out_of_bounds", {
              provider_status: boundedProviderStatusV01(record.status),
              output_text_present: true,
              provider_request_id: readProviderRequestIdV01(response),
            });
          }
          let usage: ModelGatewayNormalizedUsageV01 | null = null;
          try {
            usage = normalizeUsage(record.usage);
          } catch {
            return responseInvalid("response_usage_invalid", {
              provider_status: boundedProviderStatusV01(record.status),
              output_text_present: true,
              provider_request_id: readProviderRequestIdV01(response),
            });
          }
          try {
            return codec.parse(outputText, usage, model);
          } catch (error) {
            if (error instanceof ModelGatewayAdapterFailureV01) throw error;
            return responseInvalid(
              error instanceof OperationalReentryMatchedCohortOutputInvalidErrorV03 ||
              error instanceof OperationalReentryMatchedCohortOutputInvalidErrorV04 ||
                error instanceof OperationalReentryStaleResetCrossCaseOutputInvalidErrorV01
                ? error.stage
                : "response_other_invalid",
              {
                provider_status: boundedProviderStatusV01(record.status),
                output_text_present: true,
                provider_request_id: readProviderRequestIdV01(response),
              },
            );
          }
        },
      };
    },
  };
}

type PurposeCodec = {
  dynamic_material: unknown;
  dynamic_bytes: number;
  final_request_bytes: number;
  response_bytes: number;
  system_prompt: string;
  schema_name: string;
  schema: unknown;
  parse(
    outputText: string,
    usage: ModelGatewayNormalizedUsageV01 | null,
    model: string,
  ): ModelAdapterInvocationResultV01;
};

function buildOpenAIResponsesRequestMaterialV01(input: {
  purpose: ModelGatewayPurposeV01;
  codec: PurposeCodec;
  model: string;
  implementation: ModelAdapterImplementationV01;
  max_output_tokens: number;
  max_input_bytes: number;
}) {
  try {
    validateOpenAIStrictSchemaSupportedSubsetV01(input.codec.schema);
  } catch (error) {
    if (error instanceof OpenAIStrictSchemaSupportedSubsetErrorV01) {
      refuseModelEgress(
        input.purpose,
        "model_egress_payload_unsupported",
        1,
        0,
      );
    }
    throw error;
  }
  const dynamicText = serializeModelEgressJson(
    input.purpose,
    input.codec.dynamic_material,
    input.codec.dynamic_bytes,
  );
  assertModelEgressTextIsSafe(input.purpose, dynamicText);
  const requestBody = serializeModelEgressJson(
    input.purpose,
    {
      model: requireModelEgressText(input.purpose, input.model, 128),
      input: [
        {
          role: "system",
          content: [
            { type: "input_text", text: input.codec.system_prompt },
          ],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: dynamicText }],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: input.codec.schema_name,
          strict: true,
          schema: input.codec.schema,
        },
      },
      max_output_tokens: input.max_output_tokens,
      store: false,
    },
    Math.min(input.codec.final_request_bytes, input.max_input_bytes),
  );
  return {
    request_body: requestBody,
    request_fingerprint: createProtocolSha256V01(requestBody),
    schema_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(input.codec.schema),
    ),
    adapter_request_route_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        purpose: input.purpose,
        provider: "openai",
        model: input.model,
        adapter_implementation_id:
          input.implementation.implementation_id,
        adapter_implementation_version:
          input.implementation.implementation_version,
        ...(input.purpose ===
          OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01 ||
        input.purpose ===
          OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01 ||
        input.purpose ===
          OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01
          ? {
              provider_contract_version:
                input.purpose ===
                OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01
                  ? OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04
                  : input.purpose ===
                      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01
                    ? OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PROVIDER_CONTRACT_VERSION_V02
                  : OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03,
              max_input_bytes: input.max_input_bytes,
              max_output_tokens: input.max_output_tokens,
              response_bytes: input.codec.response_bytes,
            }
          : {}),
      }),
    ),
  };
}

function codecFor(input: ModelAdapterInputV01): PurposeCodec {
  if (
    input.input_kind ===
    OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01
  ) {
    const { canonical_project_id: _authorizationProjectId, ...invocation } =
      input;
    const material =
      projectOperationalReentryStaleResetCrossCaseProviderMaterialV01(
        invocation,
      );
    return {
      dynamic_material: material,
      dynamic_bytes:
        OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_MODEL_EGRESS_LIMITS_V01.dynamicBytes,
      final_request_bytes:
        OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_MODEL_EGRESS_LIMITS_V01.finalRequestBytes,
      response_bytes:
        OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_MODEL_EGRESS_LIMITS_V01.responseBytes,
      system_prompt: buildOperationalReentryStaleResetCrossCaseSystemPromptV01(),
      schema_name: "operational_reentry_stale_reset_cross_case_replication_v01",
      schema: operationalReentryStaleResetCrossCaseResponseSchemaV01(material),
      parse(outputText, usage) {
        return {
          purpose:
            OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01,
          output: parseOperationalReentryStaleResetCrossCaseOutputV01(
            outputText,
            material,
          ),
          usage,
        };
      },
    };
  }
  if (
    input.input_kind ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01
  ) {
    const { canonical_project_id: _authorizationProjectId, ...invocation } =
      input;
    const material =
      projectOperationalReentryMatchedCohortProviderMaterialV04(invocation);
    return {
      dynamic_material: material,
      dynamic_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.dynamicBytes,
      final_request_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.finalRequestBytes,
      response_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V04.responseBytes,
      system_prompt: buildOperationalReentryMatchedCohortSystemPromptV04(),
      schema_name: "operational_reentry_matched_cohort_v04",
      schema: operationalReentryMatchedCohortResponseSchemaSeparatedV04(material),
      parse(outputText, usage) {
        return {
          purpose:
            OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01,
          output: parseOperationalReentryMatchedCohortOutputV04(
            outputText,
            material,
          ),
          usage,
        };
      },
    };
  }
  if (
    input.input_kind ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01
  ) {
    const { canonical_project_id: _authorizationProjectId, ...modelInput } =
      input;
    const material =
      projectOperationalReentryMatchedCohortModelMaterialV03(modelInput);
    return {
      dynamic_material: material,
      dynamic_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.dynamicBytes,
      final_request_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.finalRequestBytes,
      response_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V03.responseBytes,
      system_prompt: buildOperationalReentryMatchedCohortSystemPromptV03(),
      schema_name: "operational_reentry_matched_cohort_v03",
      schema: operationalReentryMatchedCohortResponseSchemaV04(modelInput),
      parse(outputText, usage) {
        return {
          purpose:
            OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01,
          output: parseOperationalReentryMatchedCohortOutputV03(
            outputText,
            modelInput,
          ),
          usage,
        };
      },
    };
  }
  if (
    input.input_kind ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01
  ) {
    const { canonical_project_id: _authorizationProjectId, ...modelInput } =
      input;
    const material =
      projectOperationalReentryMatchedCohortModelMaterialV02(modelInput);
    return {
      dynamic_material: material,
      dynamic_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.dynamicBytes,
      final_request_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.finalRequestBytes,
      response_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V02.responseBytes,
      system_prompt: buildOperationalReentryMatchedCohortSystemPromptV02(),
      schema_name: "operational_reentry_matched_cohort_v02",
      schema: operationalReentryMatchedCohortResponseSchemaV03(modelInput),
      parse(outputText, usage) {
        return {
          purpose:
            OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01,
          output: parseOperationalReentryMatchedCohortOutputV02(
            outputText,
            modelInput,
          ),
          usage,
        };
      },
    };
  }
  if (
    input.input_kind ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01
  ) {
    const material = projectOperationalReentryMatchedCohortModelMaterialV01(input);
    return {
      dynamic_material: material,
      dynamic_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.dynamicBytes,
      final_request_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.finalRequestBytes,
      response_bytes:
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_EGRESS_LIMITS_V01.responseBytes,
      system_prompt: buildOperationalReentryMatchedCohortSystemPromptV01(),
      schema_name: "operational_reentry_matched_cohort",
      schema: operationalReentryMatchedCohortResponseSchemaV02(input),
      parse(outputText, usage) {
        return {
          purpose:
            OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
          output: parseOperationalReentryMatchedCohortOutputV01(
            outputText,
            input,
          ),
          usage,
        };
      },
    };
  }
  if (input.input_kind === GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01) {
    const validatedInput = { ...input };
    const material = projectGovernedActorLabModelMaterialV01(validatedInput);
    return {
      dynamic_material: material,
      dynamic_bytes: GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01.dynamicBytes,
      final_request_bytes:
        GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01.finalRequestBytes,
      response_bytes:
        GOVERNED_ACTOR_LAB_MODEL_EGRESS_LIMITS_V01.responseBytes,
      system_prompt: buildGovernedActorLabSystemPromptV01(),
      schema_name: "governed_actor_lab",
      schema: governedActorLabResponseSchemaV01(input),
      parse(outputText, usage) {
        return {
          purpose: GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01,
          output: parseGovernedActorLabOutputV01(outputText, input),
          usage,
        };
      },
    };
  }
  if (
    input.input_kind ===
    GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01
  ) {
    const material = projectGuideBriefInterpretationModelMaterialV01(input);
    const suppliedTokens = material.candidates.map(
      (candidate) => candidate.candidate_token,
    );
    return {
      dynamic_material: material,
      dynamic_bytes:
        GUIDE_BRIEF_INTERPRETATION_MODEL_EGRESS_LIMITS_V01.dynamicBytes,
      final_request_bytes:
        GUIDE_BRIEF_INTERPRETATION_MODEL_EGRESS_LIMITS_V01.finalRequestBytes,
      response_bytes:
        GUIDE_BRIEF_INTERPRETATION_MODEL_EGRESS_LIMITS_V01.responseBytes,
      system_prompt: buildGuideBriefInterpretationSystemPromptV01(),
      schema_name: "guidebrief_interpretation",
      schema: guideBriefInterpretationResponseSchemaV01(suppliedTokens),
      parse(outputText, usage) {
        return {
          purpose: GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01,
          output: parseGuideBriefInterpretationOutputV01(
            outputText,
            suppliedTokens,
          ),
          usage,
        };
      },
    };
  }
  if (input.input_kind === OBSERVE_MODEL_GATEWAY_PURPOSE_V01) {
    return {
      dynamic_material: projectObserveModelMaterial(input),
      dynamic_bytes: OBSERVE_MODEL_EGRESS_LIMITS.dynamicBytes,
      final_request_bytes: OBSERVE_MODEL_EGRESS_LIMITS.finalRequestBytes,
      response_bytes: 65_536,
      system_prompt: buildObserveSystemPrompt(),
      schema_name: "temporal_delta_proposals",
      schema: observeResponseSchema,
      parse(outputText, usage) {
        return {
          purpose: OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
          proposals: parseObserveOutput(outputText),
          usage,
        };
      },
    };
  }
  if (input.input_kind === PLANNER_MODEL_GATEWAY_PURPOSE_V01) {
    return {
      dynamic_material: projectPlannerModelMaterial(input),
      dynamic_bytes: PLANNER_MODEL_EGRESS_LIMITS.dynamicBytes,
      final_request_bytes: PLANNER_MODEL_EGRESS_LIMITS.finalRequestBytes,
      response_bytes: PLANNER_MODEL_EGRESS_LIMITS.responseBytes,
      system_prompt: buildPlannerSystemPrompt(),
      schema_name: "augnes_plan",
      schema: plannerResponseSchema,
      parse(outputText, usage) {
        return {
          purpose: PLANNER_MODEL_GATEWAY_PURPOSE_V01,
          recommendations: parsePlannerOutput(outputText),
          usage,
        };
      },
    };
  }
  if (
    input.input_kind ===
    STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01
  ) {
    const expectedLenses = [...input.lenses];
    return {
      dynamic_material:
        projectStrategicAdvantageTransferModelMaterialV01(input),
      dynamic_bytes:
        STRATEGIC_ADVANTAGE_TRANSFER_MODEL_EGRESS_LIMITS.dynamicBytes,
      final_request_bytes:
        STRATEGIC_ADVANTAGE_TRANSFER_MODEL_EGRESS_LIMITS.finalRequestBytes,
      response_bytes:
        STRATEGIC_ADVANTAGE_TRANSFER_MODEL_EGRESS_LIMITS.responseBytes,
      system_prompt: buildStrategicAdvantageTransferSystemPromptV01(),
      schema_name: "strategic_advantage_transfer",
      schema: strategicAdvantageTransferResponseSchema,
      parse(outputText, usage, model) {
        return {
          purpose: STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01,
          output: parseStrategicAdvantageTransferOutputV01(
            outputText,
            expectedLenses,
          ),
          model_identifier: model,
          usage,
        };
      },
    };
  }
  return {
    dynamic_material: projectTemporalModelMaterial(input),
    dynamic_bytes: TEMPORAL_MODEL_EGRESS_LIMITS.dynamicBytes,
    final_request_bytes: TEMPORAL_MODEL_EGRESS_LIMITS.finalRequestBytes,
    response_bytes: TEMPORAL_MODEL_EGRESS_LIMITS.responseBytes,
    system_prompt: buildTemporalSystemPrompt(),
    schema_name: "temporal_interpretation_preview",
    schema: temporalResponseSchema,
    parse(outputText, usage, model) {
      return {
        purpose: TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
        preview: parseTemporalOutput(outputText),
        model_identifier: model,
        usage,
      };
    },
  };
}

function describeOpenAIImplementation(
  purpose: ModelGatewayPurposeV01,
): ModelAdapterImplementationV01 {
  if (
    purpose ===
    OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01
  ) {
    return {
      implementation_id:
        OPENAI_RESPONSES_OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_ADAPTER_ID_V01,
      implementation_version:
        OPENAI_RESPONSES_OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_ADAPTER_VERSION_V02,
    };
  }
  if (
    purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01
  ) {
    return {
      implementation_id:
        OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_ID_V01,
      implementation_version:
        OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V06,
    };
  }
  if (
    purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01
  ) {
    return {
      implementation_id:
        OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_ID_V01,
      implementation_version:
        OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V05,
    };
  }
  if (
    purpose ===
    OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01
  ) {
    return {
      implementation_id:
        OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_ID_V01,
      implementation_version:
        OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V04,
    };
  }
  if (
    purpose === OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01
  ) {
    return {
      implementation_id:
        OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_ID_V01,
      implementation_version:
        OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03,
    };
  }
  if (purpose === GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01) {
    return {
      implementation_id:
        OPENAI_RESPONSES_GOVERNED_ACTOR_LAB_ADAPTER_ID_V01,
      implementation_version:
        OPENAI_RESPONSES_GOVERNED_ACTOR_LAB_ADAPTER_VERSION_V01,
    };
  }
  if (
    purpose === GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01
  ) {
    return {
      implementation_id:
        OPENAI_RESPONSES_GUIDE_BRIEF_INTERPRETATION_ADAPTER_ID_V01,
      implementation_version:
        OPENAI_RESPONSES_GUIDE_BRIEF_INTERPRETATION_ADAPTER_VERSION_V01,
    };
  }
  if (purpose === OBSERVE_MODEL_GATEWAY_PURPOSE_V01) {
    return {
      implementation_id: OPENAI_RESPONSES_OBSERVE_ADAPTER_ID_V01,
      implementation_version: OPENAI_RESPONSES_OBSERVE_ADAPTER_VERSION_V01,
    };
  }
  if (purpose === PLANNER_MODEL_GATEWAY_PURPOSE_V01) {
    return {
      implementation_id: OPENAI_RESPONSES_PLANNER_ADAPTER_ID_V01,
      implementation_version: OPENAI_RESPONSES_PLANNER_ADAPTER_VERSION_V01,
    };
  }
  if (
    purpose === STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01
  ) {
    return {
      implementation_id: OPENAI_RESPONSES_STRATEGIC_ADAPTER_ID_V01,
      implementation_version:
        OPENAI_RESPONSES_STRATEGIC_ADAPTER_VERSION_V01,
    };
  }
  return {
    implementation_id: OPENAI_RESPONSES_TEMPORAL_ADAPTER_ID_V01,
    implementation_version: OPENAI_RESPONSES_TEMPORAL_ADAPTER_VERSION_V01,
  };
}

function isOperationalReentryMatchedCohortPurposeV01(
  purpose: ModelGatewayPurposeV01,
): boolean {
  return (
    purpose === OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01 ||
    purpose ===
      OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01 ||
    purpose ===
      OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01 ||
    purpose ===
      OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01 ||
    purpose ===
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01
  );
}

async function sendOpenAIResponsesRequest(
  request: OpenAIResponsesTransportRequestV01,
): Promise<ModelTransportResponse> {
  return fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    signal: request.signal,
  });
}

function extractOutputText(record: Record<string, unknown>): string | null {
  if (typeof record.output_text === "string" && record.output_text.length > 0) {
    return record.output_text;
  }
  if (!Array.isArray(record.output)) return null;

  const parts: string[] = [];
  for (const output of record.output) {
    if (!isProviderRecord(output) || !Array.isArray(output.content)) continue;
    for (const content of output.content) {
      if (
        isProviderRecord(content) &&
        content.type === "output_text" &&
        typeof content.text === "string"
      ) {
        parts.push(content.text);
      }
    }
  }
  return parts.length > 0 ? parts.join("") : null;
}

function normalizeUsage(value: unknown): ModelGatewayNormalizedUsageV01 | null {
  if (value === undefined || value === null) return null;
  const record = requireProviderRecord(value);
  const inputTokens = requireUsageCount(record.input_tokens);
  const outputTokens = requireUsageCount(record.output_tokens);
  const totalTokens = requireUsageCount(record.total_tokens);
  let cachedInputTokens: number | undefined;
  if (Object.hasOwn(record, "input_tokens_details")) {
    const details = requireProviderRecord(record.input_tokens_details);
    cachedInputTokens = requireUsageCount(details.cached_tokens);
    if (cachedInputTokens > inputTokens) throw new Error("usage_invalid");
  }
  if (totalTokens < inputTokens + outputTokens) throw new Error("usage_invalid");
  return {
    basis: "provider_report",
    quality: "reported",
    source: "provider_response",
    input_tokens: inputTokens,
    ...(cachedInputTokens === undefined
      ? {}
      : { cached_input_tokens: cachedInputTokens }),
    output_tokens: outputTokens,
    total_tokens: totalTokens,
  };
}

function requireUsageCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("usage_invalid");
  }
  return value;
}

function requireProviderRecord(value: unknown): Record<string, unknown> {
  if (!isProviderRecord(value)) throw new Error("provider_record_invalid");
  return value;
}

function isProviderRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalConfigurationText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function requireModelIdentifier(value: string): string {
  if (!isValidModelIdentifier(value)) {
    throw new ModelGatewayAdapterFailureV01("adapter_transport_failed");
  }
  return value;
}

function isValidModelIdentifier(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);
}

function readProviderRequestIdV01(
  response: Pick<ModelTransportResponse, "headers">,
): string | null {
  try {
    return (
      response.headers?.get("x-request-id") ??
      response.headers?.get("openai-request-id") ??
      null
    );
  } catch {
    return null;
  }
}

function boundedProviderStatusV01(
  value: unknown,
): ModelProviderResponseStatusV01 | null {
  if (value === undefined || value === null) return null;
  return ["completed", "incomplete", "failed"].includes(value as string)
    ? (value as ModelProviderResponseStatusV01)
    : "unknown";
}

function boundedIncompleteReasonV01(
  record: Record<string, unknown>,
): ModelProviderIncompleteReasonV01 | null {
  if (record.status !== "incomplete") return null;
  if (!isProviderRecord(record.incomplete_details)) return "unknown";
  const reason = record.incomplete_details.reason;
  return ["max_output_tokens", "content_filter"].includes(reason as string)
    ? (reason as ModelProviderIncompleteReasonV01)
    : "unknown";
}

function adapterResponseInvalid(): never {
  throw new ModelGatewayAdapterFailureV01("adapter_response_invalid");
}
