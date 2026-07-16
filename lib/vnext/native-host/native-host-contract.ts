import path from "node:path";

import {
  canonicalizeProtocolValueV01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
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

export class NativeHostContractErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "NativeHostContractErrorV01";
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
  for (const changed of value.changed_files) {
    assertRepositoryRelativePath(changed.repository_relative_path);
  }
  for (const artifact of value.artifacts) {
    if (path.isAbsolute(artifact.artifact_ref.external_id)) {
      fail("native_host_result_absolute_path_forbidden");
    }
  }
  walk(value, (key, candidate) => {
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
  });
  const bytes = Buffer.byteLength(canonicalizeProtocolValueV01(value), "utf8");
  if (bytes > request.result_return.max_result_bytes) {
    fail("native_host_result_byte_bound_exceeded");
  }
  return value;
}

function assertRepositoryRelativePath(value: string): void {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 4096 ||
    path.isAbsolute(value) ||
    value.includes("\0")
  ) {
    fail("native_host_result_file_scope_invalid");
  }
  const normalized = path.posix.normalize(value.replaceAll("\\", "/"));
  if (normalized === ".." || normalized.startsWith("../")) {
    fail("native_host_result_file_scope_invalid");
  }
}

function walk(
  value: unknown,
  visit: (key: string, value: unknown) => void,
  key = "",
): void {
  visit(key, value);
  if (Array.isArray(value)) {
    for (const item of value) walk(item, visit, key);
  } else if (value && typeof value === "object") {
    for (const [childKey, child] of Object.entries(value)) {
      walk(child, visit, childKey);
    }
  }
}

function fail(code: string): never {
  throw new NativeHostContractErrorV01(code);
}
