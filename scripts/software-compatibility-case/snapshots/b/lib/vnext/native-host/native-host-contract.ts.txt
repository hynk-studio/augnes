import path from "node:path";

import {
  canonicalizeProtocolValueV01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import {
  canonicalizeRepositoryRelativePathV01,
  containsPublicTextLocalPathV01,
  externalRefUsesRepositoryRelativePathV01,
} from "@/lib/vnext/repository-relative-path";
import {
  NATIVE_HOST_RESULT_VERSION_V01,
  type NativeHostRequestV01,
  type NativeHostResultV01,
} from "@/types/vnext/native-host-adapter";

const RESULT_KEYS = new Set([
  "result_version",
  "request_id",
  "run_id",
  "outcome",
  "public_stop_reason",
  "started_at",
  "finished_at",
  "host_refs",
  "adapter_version",
  "capability_version",
  "changed_files",
  "artifacts",
  "observed_actions",
  "commands",
  "checks",
  "skipped_checks",
  "model_invocation_receipt_refs",
  "summary",
  "uncertainty",
  "gaps",
  "proposed_next_steps",
  "capability_coverage",
  "adapter_extension",
]);
const PUBLIC_TEXT_KEYS = new Set([
  "summary",
  "public_stop_reason",
  "reason",
  "public_reason",
  "public_risk_summary",
  "resource_summary",
  "observed_actions",
  "notes",
  "uncertainty",
  "gaps",
  "proposed_next_steps",
]);

// Diagnostic vocabulary is implementation-owned. Neither paths through unknown
// JSON keys nor rejected values (including their hashes) belong in observations.
export const NATIVE_HOST_RESULT_FIELD_CATEGORIES_V01 = [
  "summary", "checks[].summary", "commands[].summary", "skipped_checks[].reason",
  "artifacts[].summary", "artifacts[].artifact_ref.external_id",
  "changed_files[].repository_relative_path", "observed_actions[]",
  "uncertainty[]", "gaps[]", "proposed_next_steps[]", "public_stop_reason", "unknown",
] as const;
export type NativeHostResultFieldV01 = typeof NATIVE_HOST_RESULT_FIELD_CATEGORIES_V01[number];
export function withNativeHostResultFieldV01<T>(field: NativeHostResultFieldV01, validate: () => T): T {
  try { return validate(); }
  catch (error) {
    if (error instanceof NativeHostContractErrorV01)
      throw new NativeHostContractErrorV01(error.code, resultFieldV01(field));
    throw error;
  }
}

function resultFieldV01(value: string): NativeHostResultFieldV01 {
  return NATIVE_HOST_RESULT_FIELD_CATEGORIES_V01.find(field => field === value) ?? "unknown";
}

export class NativeHostContractErrorV01 extends Error {
  constructor(readonly code: string, readonly result_field: NativeHostResultFieldV01 = "unknown") {
    super(code);
    this.name = "NativeHostContractErrorV01";
  }
}

/**
 * The adapter settled locally, but the native host's terminal state could not
 * be proven. Callers must keep the run nonterminal and admit no RunReceipt.
 */
export class NativeHostReconciliationRequiredErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "NativeHostReconciliationRequiredErrorV01";
  }
}

export function assertNativeHostResultV01(
  request: NativeHostRequestV01,
  value: NativeHostResultV01,
): NativeHostResultV01 {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail("native_host_result_invalid");
  }
  if (
    Object.keys(value).some((key) => !RESULT_KEYS.has(key)) ||
    Object.keys(value).length !== RESULT_KEYS.size
  ) {
    fail("native_host_result_shape_invalid");
  }
  if (
    value.result_version !== NATIVE_HOST_RESULT_VERSION_V01 ||
    value.request_id !== request.request_id ||
    value.run_id !== request.run_id ||
    typeof value.adapter_extension.extension_version !== "string" ||
    typeof value.adapter_extension.adapter_kind !== "string" ||
    value.adapter_extension.extension_version.length === 0 ||
    value.adapter_extension.adapter_kind.length === 0
  ) {
    fail("native_host_result_binding_invalid");
  }
  const started = parseStrictIsoTimestampV01(value.started_at);
  const finished = parseStrictIsoTimestampV01(value.finished_at);
  if (
    started === null ||
    finished === null ||
    finished < started ||
    finished - started > request.policy.timeout_ms
  ) {
    fail("native_host_result_timing_invalid");
  }
  if (
    value.changed_files.length > request.policy.max_changed_files ||
    value.artifacts.length > request.policy.max_artifacts ||
    value.commands.length > request.policy.max_commands ||
    value.checks.length > request.policy.max_checks ||
    value.skipped_checks.length > request.policy.max_checks ||
    value.host_refs.length > 32 ||
    value.model_invocation_receipt_refs.length > 32 ||
    value.observed_actions.length > 64 ||
    value.capability_coverage.length > 64
  ) {
    fail("native_host_result_bound_exceeded");
  }
  const normalizedValue: NativeHostResultV01 = {
    ...value,
    changed_files: value.changed_files.map((changed) => ({
      ...changed,
      repository_relative_path: withNativeHostResultFieldV01("changed_files[].repository_relative_path", () => repositoryRelativePath(
        changed.repository_relative_path,
      )),
    })),
    artifacts: value.artifacts.map((artifact) =>
      externalRefUsesRepositoryRelativePathV01(artifact.artifact_ref)
        ? {
            ...artifact,
            artifact_ref: {
              ...artifact.artifact_ref,
              external_id: withNativeHostResultFieldV01("artifacts[].artifact_ref.external_id", () => repositoryRelativePath(
                artifact.artifact_ref.external_id,
              )),
            },
          }
        : artifact,
    ),
  };
  walk(normalizedValue, (key, candidate, field) => withNativeHostResultFieldV01(resultFieldV01(field), () => {
    if (typeof candidate === "string" && PUBLIC_TEXT_KEYS.has(key)) {
      assertNativeHostPublicTextV01(candidate);
    }
    if (
      typeof candidate === "string" &&
      (candidate === request.root_scope.canonical_root ||
        candidate.includes(`${request.root_scope.canonical_root}${path.sep}`))
    ) {
      fail("native_host_result_absolute_path_forbidden");
    }
    if (
      [
        "prompt",
        "transcript",
        "hidden_reasoning",
        "credential",
        "environment_dump",
        "stdout",
        "stderr",
        "provider_payload",
      ].includes(key) &&
      candidate !== false
    ) {
      fail("native_host_result_raw_material_forbidden");
    }
  }));
  const bytes = Buffer.byteLength(
    canonicalizeProtocolValueV01(normalizedValue),
    "utf8",
  );
  if (bytes > request.result_return.max_result_bytes) {
    fail("native_host_result_byte_bound_exceeded");
  }
  return normalizedValue;
}

export function assertNativeHostPublicTextV01(value: string): void {
  if (containsPublicTextLocalPathV01(value)) {
    fail("native_host_result_absolute_path_forbidden");
  }
  const credential =
    /(?:^|[^a-zA-Z0-9])(?:[a-zA-Z0-9_]*(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)[a-zA-Z0-9_]*)\s*(?:=|:)\s*([^\s]+)/iu.exec(
      value,
    );
  if (
    (credential && credential[1] !== "[redacted]") ||
    /\b(?:sk|sess)-[a-zA-Z0-9_-]{16,}\b/u.test(value)
  ) {
    fail("native_host_result_raw_material_forbidden");
  }
}

function repositoryRelativePath(value: string): string {
  try {
    return canonicalizeRepositoryRelativePathV01(value);
  } catch {
    fail("native_host_result_file_scope_invalid");
  }
}

function walk(
  value: unknown,
  visit: (key: string, value: unknown, field: string) => void,
  key = "",
  field = "",
): void {
  visit(key, value, field);
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit, key, `${field}[]`);
  } else if (value && typeof value === "object") {
    for (const [childKey, child] of Object.entries(value)) {
      walk(child, visit, childKey, field ? `${field}.${childKey}` : childKey);
    }
  }
}

function fail(code: string): never {
  throw new NativeHostContractErrorV01(code);
}
