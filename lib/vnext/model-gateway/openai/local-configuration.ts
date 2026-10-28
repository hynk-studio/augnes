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

/** Shared with the invocable adapter to keep configuration interpretation exact. */
export function optionalConfigurationText(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

export function isValidModelIdentifier(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value);
}
