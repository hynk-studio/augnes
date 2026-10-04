import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../../protocol-primitives";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

/** One explicit opt-in Planner route, not a model registry or fallback policy.
 * The model reference binds these settings in the existing cost authority.
 * An older reference without this source fingerprint cannot authorize it. */
export const OPENAI_PLANNER_SOL_LOW = Object.freeze({
  configuration_version: "openai_planner_sol_low.v0.1" as const,
  provider: "openai" as const,
  model: "gpt-6.1-sol" as const,
  reasoning: Object.freeze({ effort: "low" as const, mode: "standard" as const }),
  store: false as const,
  previous_response_id: null,
  service_tier: null,
});
export type OpenAIPlannerSolLow = typeof OPENAI_PLANNER_SOL_LOW;
export const OPENAI_PLANNER_SOL_LOW_REF = hash(canonical(OPENAI_PLANNER_SOL_LOW));

export function openAIPlannerReasoningConfiguration(model: string) {
  return model === OPENAI_PLANNER_SOL_LOW.model ? OPENAI_PLANNER_SOL_LOW : null;
}

export function isOpenAIPlannerSolLowRoute(model: Pick<ExternalRefV01, "external_id" | "provider" | "source_ref">) {
  return model.external_id === OPENAI_PLANNER_SOL_LOW.model && model.provider === "openai" && model.source_ref === OPENAI_PLANNER_SOL_LOW_REF;
}
