/** Public compatibility facade. Production composition is closed and static;
 * the transport owner has no dependency on method implementations. */
import { createBoundOpenAIResponsesAdapterV01, type OpenAIResponsesAdapterDependenciesV01 } from "./responses-transport";
import { readOpenAIResponsesMethodBindingV01 } from "./responses-method-bindings";
import type { ModelAdapterV01 } from "../contracts";
export {
  readOpenAILocalCapabilityDiagnosticV01,
  type OpenAILocalCapabilityDiagnosticV01,
  type OpenAILocalCapabilityStatusV01,
} from "./local-configuration";
export {
  OPENAI_RESPONSES_ENDPOINT_V01,
  type OpenAIResponsesTransportRequestV01,
  type OpenAIResponsesTransportV01,
  type OpenAIResponsesAdapterDependenciesV01
} from "./responses-transport";
export {
  OPENAI_RESPONSES_OBSERVE_ADAPTER_ID_V01,
  OPENAI_RESPONSES_OBSERVE_ADAPTER_VERSION_V01,
  OPENAI_RESPONSES_PLANNER_ADAPTER_ID_V01,
  OPENAI_RESPONSES_PLANNER_ADAPTER_VERSION_V01,
  OPENAI_RESPONSES_TEMPORAL_ADAPTER_ID_V01,
  OPENAI_RESPONSES_TEMPORAL_ADAPTER_VERSION_V01,
  OPENAI_RESPONSES_STRATEGIC_ADAPTER_ID_V01,
  OPENAI_RESPONSES_STRATEGIC_ADAPTER_VERSION_V01,
  OPENAI_RESPONSES_GUIDE_BRIEF_INTERPRETATION_ADAPTER_ID_V01,
  OPENAI_RESPONSES_GUIDE_BRIEF_INTERPRETATION_ADAPTER_VERSION_V01,
  OPENAI_RESPONSES_GOVERNED_ACTOR_LAB_ADAPTER_ID_V01,
  OPENAI_RESPONSES_GOVERNED_ACTOR_LAB_ADAPTER_VERSION_V01,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_ID_V01,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V01,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V02,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_ADAPTER_VERSION_V03,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_REPLICATION_ADAPTER_ID_V01,
  OPENAI_RESPONSES_OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_V02,
  projectOpenAIResponsesOperationalReentryMatchedCohortRequestV01,
  projectOpenAIResponsesOperationalReentryMatchedCohortRequestV02,
  projectOpenAIResponsesOperationalReentryMatchedCohortRequestV03,
  projectOpenAIResponsesOperationalReentryMatchedCohortRequestV04,
  projectOpenAIResponsesOperationalReentryStaleResetCrossCaseRequestV01,
  projectOpenAIResponsesPlannerRequestV01
} from "./responses-method-bindings";

export function createOpenAIResponsesAdapterV01(
  dependencies: OpenAIResponsesAdapterDependenciesV01 = {},
): ModelAdapterV01 {
  return createBoundOpenAIResponsesAdapterV01(readOpenAIResponsesMethodBindingV01, dependencies);
}
