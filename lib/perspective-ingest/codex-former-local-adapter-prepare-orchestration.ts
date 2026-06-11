import type {
  CodexFormerLocalAdapterManifest,
  CodexFormerLocalAdapterSourceInput,
  CodexFormerLocalAdapterValidationResult,
} from "@/lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input";
import {
  collectUnsafeCodexFormerLocalAdapterManifestMarkers,
  collectUnsafeCodexFormerLocalAdapterSourceInputMarkers,
  hashCodexFormerLocalAdapterContent,
  stableStringifyCodexFormerLocalAdapterJson,
  validateCodexFormerLocalAdapterManifest,
  validateCodexFormerLocalAdapterSourceInput,
} from "@/lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input";

export const CODEX_FORMER_LOCAL_ADAPTER_PREPARE_SUMMARY_VERSION =
  "codex_former_local_adapter_prepare_summary.v0.1";
export const CODEX_FORMER_LOCAL_ADAPTER_SOURCE_INPUT_PREFLIGHT_SUMMARY_VERSION =
  "codex_former_local_adapter_source_input_preflight_summary.v0.1";

export type CodexFormerLocalAdapterPreparePreflightSummary = {
  preflight_summary_version: typeof CODEX_FORMER_LOCAL_ADAPTER_SOURCE_INPUT_PREFLIGHT_SUMMARY_VERSION;
  mode: "source-input-preflight";
  generated_at: string | null;
  source_input_path: string;
  source_input_hash: string;
  status: "passed";
  errors: [];
  warning_count: number;
  authority_flags: Record<string, false>;
};

export type CodexFormerLocalAdapterPrepareAuthorityFlags = {
  accepted_state_created: false;
  proof_evidence_readiness_created: false;
  review_decision_created: false;
  provider_model_calls: false;
  codex_sdk_calls: false;
  github_api_calls: false;
  network_calls: false;
  db_writes: false;
  clipboard_automation: false;
  live_codex_capture: false;
  runtime_fixture_mutation: false;
  prepare_helper_executed: false;
  validate_helper_executed: false;
  surface_export_created: false;
  core_decision: false;
};

export type CodexFormerLocalAdapterPrepareDryRunSummaryV0 = {
  prepare_summary_version: typeof CODEX_FORMER_LOCAL_ADAPTER_PREPARE_SUMMARY_VERSION;
  mode: "prepare-orchestration-dry-run";
  generated_at: string;
  dry_run: true;
  source_input_path: string;
  source_input_hash: string;
  preflight_summary_path: string;
  preflight_status: "passed";
  manifest_path: string | null;
  manifest_hash: string | null;
  helper_out_dir: string;
  helper_exit_status: "not_run";
  helper_command_kind: "existing_capture_helper_prepare";
  helper_command_argv: string[];
  helper_command_summary: string;
  helper_output_paths: {
    manual_copy_packet_path: null;
    former_input_packet_path: null;
    prompt_path: null;
    return_envelope_template_path: null;
    helper_metadata_path: null;
  };
  helper_output_hashes: {
    source_prompt_hash: null;
    manual_copy_packet_hash: null;
    former_input_packet_hash: null;
    return_envelope_template_hash: null;
    helper_metadata_hash: null;
  };
  next_safe_action: string;
  caveats: string[];
  authority_flags: CodexFormerLocalAdapterPrepareAuthorityFlags;
};

export type BuildCodexFormerLocalAdapterPrepareDryRunSummaryInput = {
  sourceInput: CodexFormerLocalAdapterSourceInput;
  sourceInputPath: string;
  sourceInputHash: string;
  preflightSummary: unknown;
  preflightSummaryPath: string;
  helperOutDir: string;
  generatedAtOverride?: string | null;
  manifest?: CodexFormerLocalAdapterManifest | null;
  manifestPath?: string | null;
  manifestHash?: string | null;
  expectedSourceInputHash?: string | null;
};

const sha256Pattern = /^[a-f0-9]{64}$/;

export function validateCodexFormerLocalAdapterPrepareDryRunInput(
  input: BuildCodexFormerLocalAdapterPrepareDryRunSummaryInput,
): CodexFormerLocalAdapterValidationResult {
  const errors: string[] = [];

  if (!hasText(input.sourceInputPath)) {
    errors.push("prepare.source_input_path is required");
  }
  if (!isSha256(input.sourceInputHash)) {
    errors.push("prepare.source_input_hash must be a sha256 hash");
  }
  if (!hasText(input.preflightSummaryPath)) {
    errors.push("prepare.preflight_summary_path is required");
  }
  if (!hasText(input.helperOutDir)) {
    errors.push("prepare.helper_out_dir is required");
  }
  if (
    hasText(input.expectedSourceInputHash) &&
    input.expectedSourceInputHash !== input.sourceInputHash
  ) {
    errors.push("prepare expected source input hash does not match source input bytes");
  }

  const sourceInputValidation = validateCodexFormerLocalAdapterSourceInput(
    input.sourceInput,
  );
  errors.push(...sourceInputValidation.errors);

  const preflightValidation = validatePreparePreflightSummary(
    input.preflightSummary,
  );
  errors.push(...preflightValidation.errors);
  if (
    isRecord(input.preflightSummary) &&
    typeof input.preflightSummary.source_input_hash === "string" &&
    isSha256(input.sourceInputHash) &&
    input.preflightSummary.source_input_hash !== input.sourceInputHash
  ) {
    errors.push("prepare preflight summary source_input_hash does not match source input bytes");
  }
  for (const marker of collectUnsafeCodexFormerLocalAdapterSourceInputMarkers(
    input.preflightSummary,
  )) {
    errors.push(
      `prepare preflight summary contains unsafe marker category at ${marker.path}: ${marker.marker_kind}`,
    );
  }

  if (input.manifest) {
    const manifestValidation = validateCodexFormerLocalAdapterManifest(
      input.manifest,
    );
    errors.push(...manifestValidation.errors);
    if (!hasText(input.manifestPath)) {
      errors.push("prepare manifest_path is required when manifest is supplied");
    }
    if (!isSha256(input.manifestHash)) {
      errors.push("prepare manifest_hash must be a sha256 hash when manifest is supplied");
    }
    for (const marker of collectUnsafeCodexFormerLocalAdapterManifestMarkers(
      input.manifest,
    )) {
      errors.push(
        `prepare manifest contains unsafe marker category at ${marker.path}: ${marker.marker_kind}`,
      );
    }
  }

  for (const marker of collectUnsafeCodexFormerLocalAdapterSourceInputMarkers(
    input.sourceInput,
  )) {
    errors.push(
      `prepare source input contains unsafe marker category at ${marker.path}: ${marker.marker_kind}`,
    );
  }

  return { valid: errors.length === 0, errors: uniqueStrings(errors) };
}

export function assertCodexFormerLocalAdapterPreparePreflightSummary(
  value: unknown,
): CodexFormerLocalAdapterPreparePreflightSummary {
  const validation = validatePreparePreflightSummary(value);
  if (!validation.valid) {
    throw new Error(validation.errors.join("; "));
  }
  return value as CodexFormerLocalAdapterPreparePreflightSummary;
}

export function buildCodexFormerLocalAdapterPrepareCommandArgv({
  generatedAt,
  helperOutDir,
  sourceInputPath,
}: {
  generatedAt: string;
  helperOutDir: string;
  sourceInputPath: string;
}) {
  return [
    "npm",
    "run",
    "perspective:codex-former:capture-packet",
    "--",
    "--out-dir",
    helperOutDir,
    "--source-input",
    sourceInputPath,
    "--generated-at",
    generatedAt,
  ];
}

export function buildCodexFormerLocalAdapterPrepareDryRunSummary(
  input: BuildCodexFormerLocalAdapterPrepareDryRunSummaryInput,
): {
  summary: CodexFormerLocalAdapterPrepareDryRunSummaryV0;
  summaryJson: string;
} {
  const validation = validateCodexFormerLocalAdapterPrepareDryRunInput(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join("; "));
  }
  const preflightSummary =
    assertCodexFormerLocalAdapterPreparePreflightSummary(
      input.preflightSummary,
    );
  const generatedAt = hasText(input.generatedAtOverride)
    ? input.generatedAtOverride.trim()
    : input.sourceInput.generated_at;
  const helperCommandArgv = buildCodexFormerLocalAdapterPrepareCommandArgv({
    generatedAt,
    helperOutDir: input.helperOutDir,
    sourceInputPath: input.sourceInputPath,
  });
  const summary: CodexFormerLocalAdapterPrepareDryRunSummaryV0 = {
    prepare_summary_version: CODEX_FORMER_LOCAL_ADAPTER_PREPARE_SUMMARY_VERSION,
    mode: "prepare-orchestration-dry-run",
    generated_at: generatedAt,
    dry_run: true,
    source_input_path: input.sourceInputPath,
    source_input_hash: input.sourceInputHash,
    preflight_summary_path: input.preflightSummaryPath,
    preflight_status: preflightSummary.status,
    manifest_path: input.manifest ? input.manifestPath ?? null : null,
    manifest_hash: input.manifest ? input.manifestHash ?? null : null,
    helper_out_dir: input.helperOutDir,
    helper_exit_status: "not_run",
    helper_command_kind: "existing_capture_helper_prepare",
    helper_command_argv: helperCommandArgv,
    helper_command_summary:
      "Dry-run argv for existing capture helper prepare mode with bounded source input and explicit out-dir; command was not executed.",
    helper_output_paths: {
      manual_copy_packet_path: null,
      former_input_packet_path: null,
      prompt_path: null,
      return_envelope_template_path: null,
      helper_metadata_path: null,
    },
    helper_output_hashes: {
      source_prompt_hash: null,
      manual_copy_packet_hash: null,
      former_input_packet_hash: null,
      return_envelope_template_hash: null,
      helper_metadata_hash: null,
    },
    next_safe_action:
      "Run prepare orchestration execution only after reviewing this dry-run summary.",
    caveats: [
      "Dry-run only; helper was not executed.",
      "No Codex call was made.",
      "No clipboard automation was performed.",
    ],
    authority_flags: buildFalsePrepareAuthorityFlags(),
  };

  return {
    summary,
    summaryJson: stableStringifyCodexFormerLocalAdapterPrepareJson(summary),
  };
}

export function stableStringifyCodexFormerLocalAdapterPrepareJson(
  value: unknown,
) {
  return stableStringifyCodexFormerLocalAdapterJson(value);
}

export function hashCodexFormerLocalAdapterPrepareContent(content: string) {
  return hashCodexFormerLocalAdapterContent(content);
}

function validatePreparePreflightSummary(
  value: unknown,
): CodexFormerLocalAdapterValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return {
      valid: false,
      errors: ["prepare preflight summary JSON must be an object"],
    };
  }
  const summary = value;
  if (
    summary.preflight_summary_version !==
    CODEX_FORMER_LOCAL_ADAPTER_SOURCE_INPUT_PREFLIGHT_SUMMARY_VERSION
  ) {
    errors.push(
      `prepare preflight_summary_version must be ${CODEX_FORMER_LOCAL_ADAPTER_SOURCE_INPUT_PREFLIGHT_SUMMARY_VERSION}`,
    );
  }
  if (summary.mode !== "source-input-preflight") {
    errors.push("prepare preflight summary mode must be source-input-preflight");
  }
  if (summary.status !== "passed") {
    errors.push("prepare preflight summary status must be passed");
  }
  if (!isSha256(summary.source_input_hash)) {
    errors.push("prepare preflight summary source_input_hash must be a sha256 hash");
  }
  if (!hasText(summary.source_input_path)) {
    errors.push("prepare preflight summary source_input_path is required");
  }
  if (!Array.isArray(summary.errors)) {
    errors.push("prepare preflight summary errors must be an array");
  } else if (summary.errors.length > 0) {
    errors.push("prepare preflight summary errors must be empty when status passed");
  }
  if (
    typeof summary.warning_count !== "number" ||
    !Number.isInteger(summary.warning_count) ||
    summary.warning_count < 0
  ) {
    errors.push("prepare preflight summary warning_count must be a non-negative integer");
  }

  return { valid: errors.length === 0, errors: uniqueStrings(errors) };
}

function buildFalsePrepareAuthorityFlags(): CodexFormerLocalAdapterPrepareAuthorityFlags {
  return {
    accepted_state_created: false,
    proof_evidence_readiness_created: false,
    review_decision_created: false,
    provider_model_calls: false,
    codex_sdk_calls: false,
    github_api_calls: false,
    network_calls: false,
    db_writes: false,
    clipboard_automation: false,
    live_codex_capture: false,
    runtime_fixture_mutation: false,
    prepare_helper_executed: false,
    validate_helper_executed: false,
    surface_export_created: false,
    core_decision: false,
  };
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && sha256Pattern.test(value);
}

function hasText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function uniqueStrings(values: string[]) {
  return [...new Set(values)];
}

export default {
  CODEX_FORMER_LOCAL_ADAPTER_PREPARE_SUMMARY_VERSION,
  CODEX_FORMER_LOCAL_ADAPTER_SOURCE_INPUT_PREFLIGHT_SUMMARY_VERSION,
  assertCodexFormerLocalAdapterPreparePreflightSummary,
  buildCodexFormerLocalAdapterPrepareCommandArgv,
  buildCodexFormerLocalAdapterPrepareDryRunSummary,
  hashCodexFormerLocalAdapterPrepareContent,
  stableStringifyCodexFormerLocalAdapterPrepareJson,
  validateCodexFormerLocalAdapterPrepareDryRunInput,
};
