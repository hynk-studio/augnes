import {
  CONTINUITY_PIN_TARGET_VERSION_V01,
  type ContinuityPinCoreRecordKindV01,
  type ContinuityPinEligibilityV01,
  type ContinuityPinSupportedOwnerV01,
  type ContinuityPinTargetRefV01,
} from "@/types/vnext/continuity-pins";

const CORE_RECORD_KINDS = new Set<ContinuityPinCoreRecordKindV01>([
  "episode_delta_proposal",
  "review_decision",
  "state_transition_receipt",
  "run_receipt",
]);

export function buildContinuityPinTargetV01(input: {
  workspace_id: string;
  project_id: string;
  owner: ContinuityPinSupportedOwnerV01;
}): ContinuityPinTargetRefV01 & {
  owner: ContinuityPinSupportedOwnerV01;
} {
  const target = {
    target_version: CONTINUITY_PIN_TARGET_VERSION_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    owner: input.owner,
  } satisfies ContinuityPinTargetRefV01;
  if (!isSupportedContinuityPinTargetV01(target)) {
    throw new Error("continuity_pin_target_invalid");
  }
  return target;
}

export function buildContinuityPinEligibilityV01(input: {
  workspace_id: string | null;
  project_id: string | null;
  owner: ContinuityPinSupportedOwnerV01 | null;
  source_item_id: string;
  unsupported_reason?: string;
}): ContinuityPinEligibilityV01 {
  if (!input.workspace_id || !input.project_id) {
    return {
      status: "unsupported",
      reason_code: "no_current_project",
      reason: "Pinning is available only for a resolved current project.",
    };
  }
  if (!input.owner) {
    return {
      status: "unsupported",
      reason_code: "durable_owner_unavailable",
      reason:
        input.unsupported_reason ??
        "This projection does not expose a stable owner that can be pinned safely.",
    };
  }
  return {
    status: "eligible",
    target: buildContinuityPinTargetV01({
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      owner: input.owner,
    }),
    source_item_id: input.source_item_id,
  };
}

export function isSupportedContinuityPinTargetV01(
  value: unknown,
): value is ContinuityPinTargetRefV01 & {
  owner: ContinuityPinSupportedOwnerV01;
} {
  if (!isTargetEnvelopeV01(value)) return false;
  const owner = value.owner;
  if (!owner || typeof owner !== "object" || Array.isArray(owner)) return false;
  const record = owner as Record<string, unknown>;
  if (record.kind === "managed_run") {
    return (
      Object.keys(record).length === 2 &&
      boundedTextV01(record.run_ref, 512)
    );
  }
  if (record.kind === "core_record") {
    return (
      Object.keys(record).length === 3 &&
      typeof record.record_kind === "string" &&
      CORE_RECORD_KINDS.has(
        record.record_kind as ContinuityPinCoreRecordKindV01,
      ) &&
      boundedTextV01(record.record_id, 512)
    );
  }
  return false;
}

export function isRetainedContinuityPinTargetV01(
  value: unknown,
): value is ContinuityPinTargetRefV01 {
  if (!isTargetEnvelopeV01(value)) return false;
  if (isSupportedContinuityPinTargetV01(value)) return true;
  const owner = value.owner;
  if (!owner || typeof owner !== "object" || Array.isArray(owner)) return false;
  const record = owner as Record<string, unknown>;
  return (
    record.kind === "unsupported_source" &&
    Object.keys(record).length === 3 &&
    boundedTextV01(record.source_family, 128) &&
    boundedTextV01(record.source_key, 512)
  );
}

export function continuityPinTargetIdentityV01(
  target: ContinuityPinTargetRefV01,
): string {
  const owner = target.owner;
  const ownerKey =
    owner.kind === "managed_run"
      ? `managed_run\0${owner.run_ref}`
      : owner.kind === "core_record"
        ? `core_record\0${owner.record_kind}\0${owner.record_id}`
        : `unsupported_source\0${owner.source_family}\0${owner.source_key}`;
  return [
    target.target_version,
    target.workspace_id,
    target.project_id,
    ownerKey,
  ].join("\0");
}

export function sameContinuityPinTargetV01(
  left: ContinuityPinTargetRefV01,
  right: ContinuityPinTargetRefV01,
): boolean {
  return (
    continuityPinTargetIdentityV01(left) ===
    continuityPinTargetIdentityV01(right)
  );
}

function isTargetEnvelopeV01(
  value: unknown,
): value is ContinuityPinTargetRefV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    Object.keys(record).length === 4 &&
    record.target_version === CONTINUITY_PIN_TARGET_VERSION_V01 &&
    boundedTextV01(record.workspace_id, 256) &&
    boundedTextV01(record.project_id, 256) &&
    record.owner !== null
  );
}

function boundedTextV01(value: unknown, limit: number): value is string {
  return (
    typeof value === "string" &&
    value === value.trim() &&
    value.length > 0 &&
    value.length <= limit &&
    !/[\u0000-\u001f\u007f]/u.test(value)
  );
}
