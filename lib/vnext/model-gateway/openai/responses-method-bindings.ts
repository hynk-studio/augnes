import { buildOpenAIResponsesRequestMaterialV01 as serializeRequest, OPENAI_RESPONSES_ENDPOINT_V01 } from "./responses-transport";
import type { OpenAIResponsesMethodBindingV01, OpenAIResponsesPurposeCodecV01 as PurposeCodec } from "./responses-method-binding";
import { createDeterministicModelClientRequestIdV01 } from "../provider-rejection-observation";

import { openAIPlannerReasoningConfiguration, OPENAI_PLANNER_SOL_LOW_REF } from "../planner-execution-configuration";
import { refuseModelEgress } from "@/lib/model-egress/bounded-model-payload";
import {
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
  buildPlannerSystemPrompt, sourceReviewPlannerChoices, sourceReviewPlannerSchema,
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

export const OPENAI_RESPONSES_OBSERVE_ADAPTER_ID_V01 =
  "openai_responses.observe" as const;
export const OPENAI_RESPONSES_OBSERVE_ADAPTER_VERSION_V01 =
  "openai_responses_observe_adapter.v0.1" as const;
export const OPENAI_RESPONSES_PLANNER_ADAPTER_ID_V01 =
  "openai_responses.planner" as const;
export const OPENAI_RESPONSES_PLANNER_ADAPTER_VERSION_V01 =
  "openai_responses_planner_adapter.v0.2" as const;
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

/** Exact offline serialization seam. It prepares no session or authority and
 * sends nothing; the invocable adapter uses the same serializer and codec. */
export function projectOpenAIResponsesPlannerRequestV01(input: {
  model: string; material: Extract<ModelAdapterInputV01, { input_kind: "planner_plan" }>;
  max_output_tokens: number; max_input_bytes: number;
}) {
  return buildOpenAIResponsesRequestMaterialV01({ purpose: PLANNER_MODEL_GATEWAY_PURPOSE_V01,
    codec: codecFor(input.material), model: input.model, implementation: describeOpenAIImplementation(PLANNER_MODEL_GATEWAY_PURPOSE_V01),
    max_output_tokens: input.max_output_tokens, max_input_bytes: input.max_input_bytes });
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
    const choices = sourceReviewPlannerChoices(input.message);
    return {
      dynamic_material: projectPlannerModelMaterial(input),
      dynamic_bytes: PLANNER_MODEL_EGRESS_LIMITS.dynamicBytes,
      final_request_bytes: PLANNER_MODEL_EGRESS_LIMITS.finalRequestBytes,
      response_bytes: PLANNER_MODEL_EGRESS_LIMITS.responseBytes,
      system_prompt: buildPlannerSystemPrompt(choices !== null),
      schema_name: "augnes_plan",
      schema: choices ? sourceReviewPlannerSchema(choices) : plannerResponseSchema,
      parse(outputText, usage) {
        return {
          purpose: PLANNER_MODEL_GATEWAY_PURPOSE_V01,
          recommendations: parsePlannerOutput(outputText, choices),
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

/** Method identities and response semantics are frozen here, not inferred by
 * the transport. Adding or changing a method does not edit HTTP, cancellation,
 * usage normalization, size enforcement or the generic request serializer. */
function methodBinding(
  purpose: ModelGatewayPurposeV01,
  overrides: Partial<OpenAIResponsesMethodBindingV01> = {},
): Readonly<OpenAIResponsesMethodBindingV01> {
  return Object.freeze({
    implementation: Object.freeze(describeOpenAIImplementation(purpose)),
    capture_provider_rejection: false,
    require_response_status: false,
    retain_reported_usage_on_refusal: false,
    model_configuration: () => ({}),
    codec: codecFor,
    client_request_id: () => null,
    parse_failure_stage(error: unknown) {
      return error instanceof OperationalReentryMatchedCohortOutputInvalidErrorV03 ||
        error instanceof OperationalReentryMatchedCohortOutputInvalidErrorV04 ||
        error instanceof OperationalReentryStaleResetCrossCaseOutputInvalidErrorV01
        ? error.stage : "response_other_invalid";
    },
    ...overrides,
  });
}

const cohortResponseSemantics = Object.freeze({
  fixed_model: OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
  capture_provider_rejection: true,
  client_request_id(input, context) {
    if (
      input.input_kind !== OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01 &&
      input.input_kind !== OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01 &&
      input.input_kind !== OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01 &&
      input.input_kind !== OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01 &&
      input.input_kind !== OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01
    ) {
      throw new ModelGatewayAdapterFailureV01("adapter_response_invalid");
    }
    if (!context.provider_request_trace_id) {
      refuseModelEgress(context.purpose, "model_egress_payload_unsupported", 1, 0);
    }
    const callSlotId = input.input_kind === OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01 ||
      input.input_kind === OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01
      ? input.local_invocation_context.call_slot_id : input.invocation_context.call_slot_id;
    return createDeterministicModelClientRequestIdV01({
      purpose: context.purpose,
      provider_request_trace_id: context.provider_request_trace_id,
      call_slot_id: callSlotId,
      model: context.model,
    });
  },
} satisfies Pick<OpenAIResponsesMethodBindingV01, "fixed_model" | "capture_provider_rejection" | "client_request_id">);

const methodBindings = Object.freeze({
  [OBSERVE_MODEL_GATEWAY_PURPOSE_V01]: methodBinding(OBSERVE_MODEL_GATEWAY_PURPOSE_V01),
  [PLANNER_MODEL_GATEWAY_PURPOSE_V01]: methodBinding(PLANNER_MODEL_GATEWAY_PURPOSE_V01, {
    retain_reported_usage_on_refusal: true,
    model_configuration(model) {
      const configuration = openAIPlannerReasoningConfiguration(model);
      return configuration ? {
        source_ref: OPENAI_PLANNER_SOL_LOW_REF,
        reasoning: configuration.reasoning,
        identity: configuration,
      } : {};
    },
    client_request_id(_input, context) {
      return createDeterministicModelClientRequestIdV01({
        purpose: context.purpose,
        provider_request_trace_id: context.request_fingerprint,
        call_slot_id: "planner",
        model: context.model,
      });
    },
  }),
  [TEMPORAL_MODEL_GATEWAY_PURPOSE_V01]: methodBinding(TEMPORAL_MODEL_GATEWAY_PURPOSE_V01),
  [STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01]: methodBinding(STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01),
  [GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01]: methodBinding(GUIDE_BRIEF_INTERPRETATION_MODEL_GATEWAY_PURPOSE_V01),
  [GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01]: methodBinding(GOVERNED_ACTOR_LAB_MODEL_GATEWAY_PURPOSE_V01),
  [OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01]: methodBinding(OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01, cohortResponseSemantics),
  [OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01]: methodBinding(OPERATIONAL_REENTRY_MATCHED_COHORT_V02_MODEL_GATEWAY_PURPOSE_V01, cohortResponseSemantics),
  [OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01]: methodBinding(OPERATIONAL_REENTRY_MATCHED_COHORT_V03_MODEL_GATEWAY_PURPOSE_V01, {
    ...cohortResponseSemantics,
    provider_contract_version: OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V03,
    require_response_status: true,
  }),
  [OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01]: methodBinding(OPERATIONAL_REENTRY_MATCHED_COHORT_V04_MODEL_GATEWAY_PURPOSE_V01, {
    ...cohortResponseSemantics,
    provider_contract_version: OPERATIONAL_REENTRY_MATCHED_COHORT_PROVIDER_CONTRACT_VERSION_V04,
  }),
  [OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01]: methodBinding(OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_MODEL_GATEWAY_PURPOSE_V01, {
    ...cohortResponseSemantics,
    provider_contract_version: OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_PROVIDER_CONTRACT_VERSION_V02,
  }),
} satisfies Readonly<Record<ModelGatewayPurposeV01, OpenAIResponsesMethodBindingV01>>);

/** Closed production lookup; no mutation or registration API. */
export function readOpenAIResponsesMethodBindingV01(purpose: ModelGatewayPurposeV01): Readonly<OpenAIResponsesMethodBindingV01> {
  // Preserve the adapter's historical temporal fallback for untyped callers.
  // Gateway admission separately rejects unsupported invocation purposes.
  return typeof purpose === "string" && Object.hasOwn(methodBindings, purpose)
    ? methodBindings[purpose]
    : methodBindings[TEMPORAL_MODEL_GATEWAY_PURPOSE_V01];
}

/** Synchronous compatibility projections use the same binding and serializer
 * as live invocation without preparing a session or granting authority. */
function buildOpenAIResponsesRequestMaterialV01(
  input: Omit<Parameters<typeof serializeRequest>[0], "method">,
) {
  return serializeRequest({ ...input, method: readOpenAIResponsesMethodBindingV01(input.purpose) });
}
