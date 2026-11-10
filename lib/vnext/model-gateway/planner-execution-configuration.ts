import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../protocol-primitives";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import {
  ModelGatewayInvocationErrorV01,
  type ModelAdapterSessionV01,
  type PlannerModelExecutionConfigurationV01,
} from "./contracts";

/** Public non-invocable Gateway configuration contract for one opt-in route.
 * Contains only bounded metadata and reference validation: no adapter import,
 * environment, credential, session or transport. Provider serialization stays
 * inside the adapter; an old reference cannot authorize these settings. */
export const OPENAI_PLANNER_SOL_LOW = Object.freeze({
  configuration_version: "openai_planner_sol_low.v0.1" as const,
  provider: "openai" as const,
  model: "gpt-6.1-sol" as const,
  reasoning: Object.freeze({ effort: "low" as const, mode: "standard" as const }),
  store: false as const,
  previous_response_id: null,
  service_tier: null,
});
export const OPENAI_PLANNER_SOL_LOW_REF = hash(canonical(OPENAI_PLANNER_SOL_LOW));

export function openAIPlannerReasoningConfiguration(model: string) {
  return model === OPENAI_PLANNER_SOL_LOW.model ? OPENAI_PLANNER_SOL_LOW : null;
}

export function isOpenAIPlannerSolLowRoute(model: Pick<ExternalRefV01, "external_id" | "provider" | "source_ref">) {
  return model.external_id === OPENAI_PLANNER_SOL_LOW.model && model.provider === "openai" && model.source_ref === OPENAI_PLANNER_SOL_LOW_REF;
}

/** Pure historical grant read, without importing the invocable Gateway stack. */
export function readBoundPlannerExecutionConfigurationV01(model: ExternalRefV01): PlannerModelExecutionConfigurationV01 | null {
  return isOpenAIPlannerSolLowRoute(model) ? structuredClone(OPENAI_PLANNER_SOL_LOW) : null;
}

/** Non-invocable configuration read for preview and historical grant validation.
 * New authority must refuse a known route missing its current configuration
 * binding; old unbound references remain readable with their historical scope. */
export function readPlannerModelGatewayExecutionConfigurationV01(
  model: ModelAdapterSessionV01["model_ref"],
  options: { require_current_binding?: boolean } = {},
): PlannerModelExecutionConfigurationV01 | null {
  if (model.external_id !== OPENAI_PLANNER_SOL_LOW.model) return null;
  if (isOpenAIPlannerSolLowRoute(model)) return structuredClone(OPENAI_PLANNER_SOL_LOW);
  if (options.require_current_binding) {
    throw new ModelGatewayInvocationErrorV01("model_gateway_provider_response_invalid");
  }
  return null;
}
