import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";

export const VNEXT_OPERATOR_PILOT_REVIEW_WINDOW_CONFIG_VERSION_V01 =
  "vnext_operator_pilot_review_window_config.v0.1" as const;

export const VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_ENV_V01 =
  "AUGNES_VNEXT_OPERATOR_PREVIEW_MAX_AGE_MS" as const;
export const VNEXT_OPERATOR_PILOT_GATE_TTL_ENV_V01 =
  "AUGNES_VNEXT_OPERATOR_GATE_TTL_MS" as const;

export const VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_DEFAULT_MS_V01 = 900_000;
export const VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_MIN_MS_V01 = 900_000;
export const VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_MAX_MS_V01 = 28_800_000;
export const VNEXT_OPERATOR_PILOT_GATE_TTL_DEFAULT_MS_V01 = 600_000;
export const VNEXT_OPERATOR_PILOT_GATE_TTL_MIN_MS_V01 = 600_000;
export const VNEXT_OPERATOR_PILOT_GATE_TTL_MAX_MS_V01 = 7_200_000;

export type VNextOperatorPilotReviewWindowConfigSourceV01 =
  | "default"
  | "explicit_environment";
export type VNextOperatorPilotReviewWindowEnvironmentV01 = Readonly<
  Record<string, string | undefined>
>;

export interface VNextOperatorPilotReviewWindowConfigV01 {
  readonly config_version: typeof VNEXT_OPERATOR_PILOT_REVIEW_WINDOW_CONFIG_VERSION_V01;
  readonly preview_max_age_ms: number;
  readonly gate_ttl_ms: number;
  readonly preview_source: VNextOperatorPilotReviewWindowConfigSourceV01;
  readonly gate_source: VNextOperatorPilotReviewWindowConfigSourceV01;
}

declare const operatorPilotReviewWindowCapabilityTypeBrand: unique symbol;
export type VNextOperatorPilotReviewWindowCapabilityV01 = object & {
  readonly [operatorPilotReviewWindowCapabilityTypeBrand]: true;
};

export interface VNextOperatorPilotReviewWindowCapabilityResolutionV01 {
  readonly config: VNextOperatorPilotReviewWindowConfigV01;
  readonly workspace_id: string;
  readonly project_id: string;
}

const validatedConfigs = new WeakSet<object>();
const capabilityRecords = new WeakMap<
  object,
  VNextOperatorPilotReviewWindowCapabilityResolutionV01
>();

export class VNextOperatorPilotReviewWindowConfigErrorV01 extends Error {
  readonly code: string;
  readonly status = 503;

  constructor(code: string) {
    super(code);
    this.name = "VNextOperatorPilotReviewWindowConfigErrorV01";
    this.code = code;
  }
}

export const VNEXT_OPERATOR_PILOT_DEFAULT_REVIEW_WINDOW_CONFIG_V01 =
  createValidatedConfig({
    config_version: VNEXT_OPERATOR_PILOT_REVIEW_WINDOW_CONFIG_VERSION_V01,
    preview_max_age_ms:
      VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_DEFAULT_MS_V01,
    gate_ttl_ms: VNEXT_OPERATOR_PILOT_GATE_TTL_DEFAULT_MS_V01,
    preview_source: "default",
    gate_source: "default",
  });

export function readVNextOperatorPilotReviewWindowConfigV01(
  environment: VNextOperatorPilotReviewWindowEnvironmentV01,
): VNextOperatorPilotReviewWindowConfigV01 {
  const preview = readBoundedEnvironmentInteger({
    environment,
    name: VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_ENV_V01,
    default_value: VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_DEFAULT_MS_V01,
    minimum: VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_MIN_MS_V01,
    maximum: VNEXT_OPERATOR_PILOT_PREVIEW_MAX_AGE_MAX_MS_V01,
    error_code: "operator_pilot_preview_max_age_config_invalid",
  });
  const gate = readBoundedEnvironmentInteger({
    environment,
    name: VNEXT_OPERATOR_PILOT_GATE_TTL_ENV_V01,
    default_value: VNEXT_OPERATOR_PILOT_GATE_TTL_DEFAULT_MS_V01,
    minimum: VNEXT_OPERATOR_PILOT_GATE_TTL_MIN_MS_V01,
    maximum: VNEXT_OPERATOR_PILOT_GATE_TTL_MAX_MS_V01,
    error_code: "operator_pilot_gate_ttl_config_invalid",
  });
  if (gate.value > preview.value) {
    throw new VNextOperatorPilotReviewWindowConfigErrorV01(
      "operator_pilot_review_window_relation_invalid",
    );
  }
  return createValidatedConfig({
    config_version: VNEXT_OPERATOR_PILOT_REVIEW_WINDOW_CONFIG_VERSION_V01,
    preview_max_age_ms: preview.value,
    gate_ttl_ms: gate.value,
    preview_source: preview.source,
    gate_source: gate.source,
  });
}

export function assertVNextOperatorPilotReviewWindowConfigV01(
  value: unknown,
): VNextOperatorPilotReviewWindowConfigV01 {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    !validatedConfigs.has(value)
  ) {
    throw new VNextOperatorPilotReviewWindowConfigErrorV01(
      "operator_pilot_review_window_config_untrusted",
    );
  }
  return value as VNextOperatorPilotReviewWindowConfigV01;
}

export function createVNextOperatorPilotReviewWindowCapabilityV01(input: {
  config: VNextOperatorPilotReviewWindowConfigV01;
  workspace_id: string;
  project_id: string;
}): VNextOperatorPilotReviewWindowCapabilityV01 {
  const config = assertVNextOperatorPilotReviewWindowConfigV01(input.config);
  const workspaceId = requireScopeText(input.workspace_id);
  const projectId = requireScopeText(input.project_id);
  const capability = Object.freeze(Object.create(null)) as object;
  capabilityRecords.set(
    capability,
    Object.freeze({
      config,
      workspace_id: workspaceId,
      project_id: projectId,
    }),
  );
  return capability as VNextOperatorPilotReviewWindowCapabilityV01;
}

export function resolveVNextOperatorPilotReviewWindowCapabilityV01(
  value: unknown,
  expected: { workspace_id: string; project_id: string },
): VNextOperatorPilotReviewWindowCapabilityResolutionV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new VNextOperatorPilotReviewWindowConfigErrorV01(
      "operator_pilot_review_window_capability_invalid",
    );
  }
  const record = capabilityRecords.get(value);
  if (
    !record ||
    record.workspace_id !== requireScopeText(expected.workspace_id) ||
    record.project_id !== requireScopeText(expected.project_id)
  ) {
    throw new VNextOperatorPilotReviewWindowConfigErrorV01(
      "operator_pilot_review_window_capability_invalid",
    );
  }
  return record;
}

export function isExplicitVNextOperatorPilotReviewWindowConfigV01(
  config: VNextOperatorPilotReviewWindowConfigV01,
): boolean {
  assertVNextOperatorPilotReviewWindowConfigV01(config);
  return (
    config.preview_source === "explicit_environment" ||
    config.gate_source === "explicit_environment"
  );
}

export function createVNextOperatorPilotReviewWindowConfigFingerprintV01(
  config: VNextOperatorPilotReviewWindowConfigV01,
): string {
  assertVNextOperatorPilotReviewWindowConfigV01(config);
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      config_version: config.config_version,
      preview_max_age_ms: config.preview_max_age_ms,
      gate_ttl_ms: config.gate_ttl_ms,
      preview_source: config.preview_source,
      gate_source: config.gate_source,
    }),
  );
}

function createValidatedConfig(
  value: VNextOperatorPilotReviewWindowConfigV01,
): VNextOperatorPilotReviewWindowConfigV01 {
  const config = Object.freeze({ ...value });
  validatedConfigs.add(config);
  return config;
}

function requireScopeText(value: unknown): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 256 ||
    value.trim() !== value
  ) {
    throw new VNextOperatorPilotReviewWindowConfigErrorV01(
      "operator_pilot_review_window_capability_scope_invalid",
    );
  }
  return value;
}

function readBoundedEnvironmentInteger(input: {
  environment: VNextOperatorPilotReviewWindowEnvironmentV01;
  name: string;
  default_value: number;
  minimum: number;
  maximum: number;
  error_code: string;
}): {
  value: number;
  source: VNextOperatorPilotReviewWindowConfigSourceV01;
} {
  const supplied = Object.prototype.hasOwnProperty.call(
    input.environment,
    input.name,
  );
  if (!supplied) {
    return { value: input.default_value, source: "default" };
  }
  const raw = input.environment[input.name];
  if (typeof raw !== "string" || !/^[1-9][0-9]*$/.test(raw)) {
    throw new VNextOperatorPilotReviewWindowConfigErrorV01(input.error_code);
  }
  const value = Number(raw);
  if (
    !Number.isSafeInteger(value) ||
    String(value) !== raw ||
    value < input.minimum ||
    value > input.maximum
  ) {
    throw new VNextOperatorPilotReviewWindowConfigErrorV01(input.error_code);
  }
  return { value, source: "explicit_environment" };
}
