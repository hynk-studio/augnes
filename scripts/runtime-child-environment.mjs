import {
  CANONICAL_AMBIENT_ENVIRONMENT_ALLOWLIST,
} from "./canonical-test-environment.mjs";

const ROLE_VALUE_KEYS = Object.freeze({
  ui: new Set([
    "NODE_ENV",
    "NEXT_TELEMETRY_DISABLED",
    "AUGNES_DB_PATH",
    "AUGNES_RUNTIME_INSTANCE_ID",
    "AUGNES_RUNTIME_CONTRACT",
    "AUGNES_RUNTIME_SCHEMA_VERSION",
    "AUGNES_RUNTIME_REPOSITORY_FINGERPRINT",
    "AUGNES_RUNTIME_GENERATION_ID",
    "AUGNES_RUNTIME_GENERATION_VERSION",
    "AUGNES_RUNTIME_CHILD_ROLE",
    "AUGNES_RUNTIME_CHILD_PORT",
    "AUGNES_RUNTIME_OWNERSHIP_TOKEN",
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
    "AUGNES_VNEXT_OPERATOR_PILOT_ENABLED",
    "AUGNES_VNEXT_OPERATOR_WORKSPACE_ID",
    "AUGNES_VNEXT_OPERATOR_PROJECT_ID",
    "AUGNES_VNEXT_OPERATOR_ID",
    "AUGNES_VNEXT_OPERATOR_PREVIEW_MAX_AGE_MS",
    "AUGNES_VNEXT_OPERATOR_GATE_TTL_MS",
  ]),
  bridge: new Set([
    "NODE_ENV",
    "PORT",
    "DOTENV_CONFIG_PATH",
    "AUGNES_CORE_MODE",
    "AUGNES_API_BASE_URL",
    "AUGNES_ENABLE_AGENT_BRIDGE",
    "AUGNES_RUNTIME_INSTANCE_ID",
    "AUGNES_RUNTIME_CONTRACT",
    "AUGNES_RUNTIME_SCHEMA_VERSION",
    "AUGNES_RUNTIME_REPOSITORY_FINGERPRINT",
    "AUGNES_RUNTIME_GENERATION_ID",
    "AUGNES_RUNTIME_GENERATION_VERSION",
    "AUGNES_RUNTIME_CHILD_ROLE",
    "AUGNES_RUNTIME_CHILD_PORT",
    "AUGNES_RUNTIME_OWNERSHIP_TOKEN",
    "AUGNES_APP_PROFILE",
    "AUGNES_APP_TOOL_SURFACE",
    "AUGNES_APP_DOMAIN",
    "AUGNES_CONNECT_DOMAIN",
    "AUGNES_RESOURCE_DOMAIN",
  ]),
});

/**
 * Build the deliberately small environment inherited by a supervised runtime
 * child. Ambient provider credentials, proxy settings, and unrelated AUGNES_*
 * values are not copied. Role values are authored explicitly by the supervisor,
 * including the UI-only OpenAI values reviewed for runtime compatibility.
 */
export function buildRuntimeChildEnvironment({
  role,
  ambientEnvironment = process.env,
  values = {},
}) {
  const allowedValueKeys = ROLE_VALUE_KEYS[role];
  if (!allowedValueKeys) {
    throw new Error(`unknown supervised child role: ${role}`);
  }

  const environment = {};
  for (const key of CANONICAL_AMBIENT_ENVIRONMENT_ALLOWLIST) {
    copyNonEmptyString(environment, ambientEnvironment, key);
  }

  for (const [key, value] of Object.entries(values)) {
    if (!allowedValueKeys.has(key)) {
      throw new Error(`runtime child value is not reviewed for ${role}: ${key}`);
    }
    if (value === undefined || value === null || value === "") continue;
    if (typeof value !== "string") {
      throw new Error(`runtime child value must be a string: ${role}.${key}`);
    }
    environment[key] = value;
  }

  return environment;
}

export function findForbiddenRuntimeChildEnvironmentKeys({
  role,
  childEnvironment,
  authoredValues = {},
}) {
  const allowedValueKeys = ROLE_VALUE_KEYS[role];
  if (!allowedValueKeys) {
    throw new Error(`unknown supervised child role: ${role}`);
  }

  const allowed = new Set([
    ...CANONICAL_AMBIENT_ENVIRONMENT_ALLOWLIST,
    ...Object.keys(authoredValues).filter((key) => allowedValueKeys.has(key)),
  ]);
  return Object.keys(childEnvironment).filter((key) => !allowed.has(key)).sort();
}

function copyNonEmptyString(target, source, key) {
  const value = source[key];
  if (typeof value === "string" && value.length > 0) target[key] = value;
}
