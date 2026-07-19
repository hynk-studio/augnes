import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import { validateExternalRefV01 } from "@/lib/vnext/task-context-packet";
import {
  BOUNDED_AUTOMATION_CAPABILITY_GRANT_VERSION_V01,
  BOUNDED_AUTOMATION_CYCLE_PROFILE_V01,
  type BoundedAutomationCapabilityGrantV01,
} from "@/types/vnext/bounded-automation-cycle";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export function createBoundedAutomationCapabilityGrantFingerprintV01(
  grant: Omit<
    BoundedAutomationCapabilityGrantV01,
    "grant_id" | "grant_fingerprint"
  >,
): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(grant));
}

export function validateBoundedAutomationCapabilityGrantV01(
  value: unknown,
): value is BoundedAutomationCapabilityGrantV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const grant = value as Partial<BoundedAutomationCapabilityGrantV01>;
  if (
    !hasExactKeysV01(grant, [
      "allowed_capabilities",
      "budget",
      "can_deploy",
      "can_expand_authority",
      "can_merge",
      "can_publish",
      "control_revision",
      "expires_at",
      "forbidden_capabilities",
      "grant_fingerprint",
      "grant_id",
      "grant_version",
      "grants_credential_access",
      "grants_external_action_authority",
      "grants_semantic_authority",
      "host_adapter_version",
      "host_capability_version",
      "issued_at",
      "packet_fingerprint",
      "packet_id",
      "policy_fingerprint",
      "policy_ref",
      "profile",
      "project_id",
      "resource_scope",
      "root_fingerprint",
      "stop_conditions",
      "work_source_ref",
      "workspace_id",
    ]) ||
    !grant.budget ||
    !hasExactKeysV01(grant.budget, [
      "automatic_retry",
      "budget_version",
      "max_active_runs",
      "max_attempts",
      "max_commands",
      "max_model_cost_units",
      "max_model_invocations",
      "max_model_tokens",
      "max_runtime_ms",
      "max_work_items",
      "network_access",
    ]) ||
    !grant.policy_ref ||
    !grant.work_source_ref ||
    !Array.isArray(grant.allowed_capabilities) ||
    !Array.isArray(grant.forbidden_capabilities) ||
    !Array.isArray(grant.resource_scope) ||
    !Array.isArray(grant.stop_conditions) ||
    typeof grant.issued_at !== "string" ||
    typeof grant.expires_at !== "string"
  ) {
    return false;
  }
  const {
    grant_id: grantId,
    grant_fingerprint: grantFingerprint,
    ...material
  } = grant;
  const expectedFingerprint =
    createProtocolSha256V01(canonicalizeProtocolValueV01(material));
  const issuedAt = parseStrictIsoTimestampV01(grant.issued_at);
  const expiresAt = parseStrictIsoTimestampV01(grant.expires_at);
  return (
    grant.grant_version === BOUNDED_AUTOMATION_CAPABILITY_GRANT_VERSION_V01 &&
    grant.profile === BOUNDED_AUTOMATION_CYCLE_PROFILE_V01 &&
    typeof grant.workspace_id === "string" &&
    nonemptyV01(grant.workspace_id) &&
    typeof grant.project_id === "string" &&
    nonemptyV01(grant.project_id) &&
    validateExternalRefV01(grant.policy_ref).status === "valid" &&
    validateExternalRefV01(grant.work_source_ref).status === "valid" &&
    typeof grant.policy_fingerprint === "string" &&
    nonemptyV01(grant.policy_fingerprint) &&
    typeof grant.control_revision === "number" &&
    Number.isSafeInteger(grant.control_revision) &&
    grant.control_revision >= 1 &&
    typeof grant.packet_id === "string" &&
    nonemptyV01(grant.packet_id) &&
    typeof grant.packet_fingerprint === "string" &&
    nonemptyV01(grant.packet_fingerprint) &&
    typeof grant.host_adapter_version === "string" &&
    nonemptyV01(grant.host_adapter_version) &&
    typeof grant.host_capability_version === "string" &&
    nonemptyV01(grant.host_capability_version) &&
    typeof grant.root_fingerprint === "string" &&
    nonemptyV01(grant.root_fingerprint) &&
    canonicalStringSetV01(grant.allowed_capabilities, 128) &&
    canonicalStringSetV01(grant.forbidden_capabilities, 128) &&
    canonicalStringSetV01(grant.resource_scope, 128) &&
    canonicalStringSetV01(grant.stop_conditions, 32) &&
    grant.budget.budget_version === "bounded_automation_budget.v0.1" &&
    grant.budget.max_work_items === 1 &&
    grant.budget.max_active_runs === 1 &&
    grant.budget.max_attempts === 1 &&
    Number.isSafeInteger(grant.budget.max_runtime_ms) &&
    grant.budget.max_runtime_ms >= 1 &&
    grant.budget.max_runtime_ms <= 900_000 &&
    Number.isSafeInteger(grant.budget.max_commands) &&
    grant.budget.max_commands >= 1 &&
    grant.budget.max_commands <= 128 &&
    grant.budget.max_model_invocations === 0 &&
    grant.budget.max_model_tokens === 0 &&
    grant.budget.max_model_cost_units === 0 &&
    grant.budget.network_access === "denied" &&
    grant.budget.automatic_retry === false &&
    issuedAt !== null &&
    expiresAt !== null &&
    expiresAt > issuedAt &&
    grant.grants_semantic_authority === false &&
    grant.grants_external_action_authority === false &&
    grant.grants_credential_access === false &&
    grant.can_merge === false &&
    grant.can_publish === false &&
    grant.can_deploy === false &&
    grant.can_expand_authority === false &&
    grantFingerprint === expectedFingerprint &&
    grantId === `bounded-grant:${expectedFingerprint.slice(0, 24)}`
  );
}

export function deriveBoundedAutomationCycleIdV01(input: {
  grant: BoundedAutomationCapabilityGrantV01;
  packet: {
    packet_id: TaskContextPacketV01["packet_id"];
    integrity: { fingerprint: string };
  };
}): string {
  const digest = createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      profile: BOUNDED_AUTOMATION_CYCLE_PROFILE_V01,
      workspace_id: input.grant.workspace_id,
      project_id: input.grant.project_id,
      work_source_ref: input.grant.work_source_ref,
      packet_id: input.packet.packet_id,
      packet_fingerprint: input.packet.integrity.fingerprint,
      policy_ref: input.grant.policy_ref,
      policy_fingerprint: input.grant.policy_fingerprint,
      control_revision: input.grant.control_revision,
      grant_id: input.grant.grant_id,
      grant_fingerprint: input.grant.grant_fingerprint,
      host_adapter_version: input.grant.host_adapter_version,
      host_capability_version: input.grant.host_capability_version,
      root_fingerprint: input.grant.root_fingerprint,
      budget: input.grant.budget,
      attempt: 1,
    }),
  );
  return `bounded-cycle:${digest.slice(0, 24)}`;
}

function nonemptyV01(value: string): boolean {
  return value.length > 0 && value.length <= 512;
}

function canonicalStringSetV01(values: readonly string[], limit: number): boolean {
  if (values.length > limit || values.some((value) => !nonemptyV01(value))) {
    return false;
  }
  const sorted = [...new Set(values)].sort();
  return (
    sorted.length === values.length &&
    sorted.every((value, index) => value === values[index])
  );
}

function hasExactKeysV01(
  value: object,
  expected: readonly string[],
): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return (
    actual.length === wanted.length &&
    actual.every((key, index) => key === wanted[index])
  );
}
