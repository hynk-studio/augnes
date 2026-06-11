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
export const CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_SUMMARY_VERSION =
  "codex_former_local_adapter_prepare_execution_summary.v0.1";
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
  prepare_helper_executed: boolean;
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
  helper_command_argv_hash: string;
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
  execution_readiness: {
    ready_for_prepare_execution: boolean;
    status: "ready" | "not_ready";
    blockers: string[];
    warnings: string[];
    checked_requirements: Array<{
      id: string;
      status: "passed" | "failed" | "warning";
      detail: string;
    }>;
  };
  authority_flags: CodexFormerLocalAdapterPrepareAuthorityFlags;
};

export type CodexFormerLocalAdapterPrepareExecutionLogSummary = {
  line_count: number;
  included_line_count: number;
  truncated: boolean;
  omitted_line_count: number;
  unsafe_marker_omitted: boolean;
  max_lines: number;
  max_chars: number;
  lines: string[];
  normalized_lines: string[];
  line_events: Array<{
    category: "npm_wrapper" | "helper_kv" | "blank" | "other" | "omitted_unsafe";
    text: string | null;
  }>;
  npm_wrapper_line_count: number;
  helper_kv_line_count: number;
};

export type CodexFormerLocalAdapterPrepareExecutionOutputPaths = {
  manual_copy_packet_path: string | null;
  former_input_packet_path: string | null;
  prompt_path: string | null;
  return_envelope_template_path: string | null;
  helper_metadata_path: string | null;
};

export type CodexFormerLocalAdapterPrepareExecutionOutputRefs = {
  manual_copy_packet_ref: string | null;
  former_input_packet_ref: string | null;
};

export type CodexFormerLocalAdapterPrepareExecutionOutputHashes = {
  manual_copy_packet_hash: string | null;
  former_input_packet_hash: string | null;
  prompt_hash: string | null;
  return_envelope_template_hash: string | null;
  helper_metadata_hash: string | null;
};

export type CodexFormerLocalAdapterPrepareExecutionOutputSizes = {
  manual_copy_packet_size_bytes: number | null;
  former_input_packet_size_bytes: number | null;
  prompt_size_bytes: number | null;
  return_envelope_template_size_bytes: number | null;
  helper_metadata_size_bytes: number | null;
};

export type CodexFormerLocalAdapterPrepareExecutionMetadataChecks = {
  metadata_parse_status: "parsed" | "missing" | "invalid_json";
  source_input_hash_match: boolean | "not_present";
  generated_at_match: boolean | "not_present";
  prompt_hash_match: boolean | "not_comparable" | "not_present";
  metadata_source_prompt_hash: string | null;
  prompt_file_sha256: string | null;
};

export type CodexFormerLocalAdapterPrepareExecutionDiscovery = {
  status: "complete" | "incomplete" | "failed" | "not_run";
  paths: CodexFormerLocalAdapterPrepareExecutionOutputPaths;
  refs: CodexFormerLocalAdapterPrepareExecutionOutputRefs;
  hashes: CodexFormerLocalAdapterPrepareExecutionOutputHashes;
  sizes: CodexFormerLocalAdapterPrepareExecutionOutputSizes;
  caveats: string[];
  metadata_checks: CodexFormerLocalAdapterPrepareExecutionMetadataChecks;
};

export type CodexFormerLocalAdapterPrepareHelperRunSummary = {
  helper_invocation_attempted: boolean;
  helper_process_started: boolean;
  helper_exit_status: "success" | "failed";
  helper_exit_code: number | null;
  stdout: string;
  stderr: string;
  spawn_error_name: string | null;
};

export type CodexFormerLocalAdapterPrepareExecutionResult =
  | "success"
  | "helper_failed"
  | "output_incomplete"
  | "invocation_failed";

export type CodexFormerLocalAdapterPrepareExecutionFailureKind =
  | "helper_exit_nonzero"
  | "output_discovery_incomplete"
  | "helper_spawn_failed"
  | "summary_write_failed";

export type CodexFormerLocalAdapterPrepareExecutionOutcome = {
  execution_result: CodexFormerLocalAdapterPrepareExecutionResult;
  failure_kind: CodexFormerLocalAdapterPrepareExecutionFailureKind | null;
  prepare_helper_executed: boolean;
};

export type CodexFormerLocalAdapterPrepareOutputFileSnapshot = {
  path: string;
  text: string;
  size_bytes: number;
};

export type DiscoverCodexFormerLocalAdapterPrepareOutputsInput = {
  helperExitStatus: "success" | "failed";
  helperOutDir: string;
  sourceInputHash: string;
  generatedAt: string;
  files: {
    prompt: CodexFormerLocalAdapterPrepareOutputFileSnapshot | null;
    returnEnvelopeTemplate: CodexFormerLocalAdapterPrepareOutputFileSnapshot | null;
    metadata: CodexFormerLocalAdapterPrepareOutputFileSnapshot | null;
  };
};

export type CodexFormerLocalAdapterPrepareExecutionSummaryV0 = {
  prepare_execution_summary_version: typeof CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_SUMMARY_VERSION;
  mode: "prepare-orchestration-execution";
  generated_at: string;
  dry_run_summary_path: string;
  dry_run_summary_hash: string;
  source_input_path: string;
  source_input_hash: string;
  preflight_summary_path: string;
  preflight_summary_hash: string;
  manifest_path: string | null;
  manifest_hash: string | null;
  helper_out_dir: string;
  helper_command_kind: "existing_capture_helper_prepare";
  helper_command_argv: string[];
  helper_command_argv_hash: string;
  helper_invocation_attempted: boolean;
  helper_process_started: boolean;
  helper_exit_status: "success" | "failed";
  helper_exit_code: number | null;
  helper_stdout_summary: CodexFormerLocalAdapterPrepareExecutionLogSummary;
  helper_stderr_summary: CodexFormerLocalAdapterPrepareExecutionLogSummary;
  helper_output_paths: CodexFormerLocalAdapterPrepareExecutionOutputPaths;
  helper_output_refs: CodexFormerLocalAdapterPrepareExecutionOutputRefs;
  helper_output_hashes: CodexFormerLocalAdapterPrepareExecutionOutputHashes;
  helper_output_sizes: CodexFormerLocalAdapterPrepareExecutionOutputSizes;
  helper_metadata_checks: CodexFormerLocalAdapterPrepareExecutionMetadataChecks;
  output_discovery_caveats: string[];
  output_discovery_status: "complete" | "incomplete" | "failed" | "not_run";
  execution_result: CodexFormerLocalAdapterPrepareExecutionResult;
  next_safe_action: string;
  caveats: string[];
  execution_readiness_snapshot: CodexFormerLocalAdapterPrepareDryRunSummaryV0["execution_readiness"];
  failure_kind: CodexFormerLocalAdapterPrepareExecutionFailureKind | null;
  authority_flags: CodexFormerLocalAdapterPrepareAuthorityFlags;
};

export type BuildCodexFormerLocalAdapterPrepareExecutionContextInput = {
  sourceInput: CodexFormerLocalAdapterSourceInput;
  sourceInputPath: string;
  sourceInputHash: string;
  preflightSummary: unknown;
  preflightSummaryPath: string;
  preflightSummaryHash: string;
  dryRunSummary: unknown;
  dryRunSummaryPath: string;
  dryRunSummaryHash: string;
  helperOutDir: string;
  generatedAtOverride?: string | null;
  manifest?: CodexFormerLocalAdapterManifest | null;
  manifestPath?: string | null;
  manifestHash?: string | null;
  expectedSourceInputHash?: string | null;
  expectedHelperCommandArgvHash?: string | null;
};

export type CodexFormerLocalAdapterPrepareExecutionContext = {
  generatedAt: string;
  sourceInputPath: string;
  sourceInputHash: string;
  preflightSummaryPath: string;
  preflightSummaryHash: string;
  dryRunSummaryPath: string;
  dryRunSummaryHash: string;
  manifestPath: string | null;
  manifestHash: string | null;
  helperOutDir: string;
  helperCommandArgv: string[];
  helperCommandArgvHash: string;
  dryRunSummary: CodexFormerLocalAdapterPrepareDryRunSummaryV0;
};

export type BuildCodexFormerLocalAdapterPrepareExecutionSummaryInput = {
  context: CodexFormerLocalAdapterPrepareExecutionContext;
  helperRunSummary: CodexFormerLocalAdapterPrepareHelperRunSummary;
  helperStdoutSummary: CodexFormerLocalAdapterPrepareExecutionLogSummary;
  helperStderrSummary: CodexFormerLocalAdapterPrepareExecutionLogSummary;
  outputDiscovery: CodexFormerLocalAdapterPrepareExecutionDiscovery;
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
  helperAvailability?: {
    packageScriptPresent: boolean;
    scriptPath: string;
    scriptPresent: boolean;
    scriptIsFile: boolean;
  };
  helperOutDirStatus?: {
    existsAsFile: boolean;
    existsAsNonEmptyDirectory: boolean;
    createdByDryRun: boolean;
  };
  prepareSummaryOutsideHelperOutDir?: boolean;
};

const sha256Pattern = /^[a-f0-9]{64}$/;
const requiredExecutionReadinessIds = [
  "source_input_valid",
  "source_input_hash_matches_preflight",
  "preflight_summary_valid",
  "preflight_status_passed",
  "helper_package_script_present",
  "helper_script_present",
  "helper_command_argv_constructed",
  "helper_out_dir_not_created_by_dry_run",
  "helper_out_dir_not_existing_file",
  "helper_out_dir_not_non_empty_directory",
  "prepare_summary_outside_helper_out_dir",
  "no_forbidden_authority_behavior",
  "no_helper_execution",
] as const;

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
    errors.push("prepare.expected_source_input_hash does not match source input bytes");
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
      errors.push("prepare.manifest_path is required when manifest is supplied");
    }
    if (!isSha256(input.manifestHash)) {
      errors.push("prepare.manifest_hash must be a sha256 hash when manifest is supplied");
    }
    if (input.manifest.work_id !== input.sourceInput.work_id) {
      errors.push("prepare.manifest.work_id must match source_input.work_id");
    }
    if (input.manifest.scope !== input.sourceInput.scope) {
      errors.push("prepare.manifest.scope must match source_input.scope");
    }
    if (!sameStringArray(input.manifest.changed_files, input.sourceInput.changed_files)) {
      errors.push("prepare.manifest.changed_files must match source_input.changed_files exactly");
    }
    if (!sameStringArray(input.manifest.source_pr_refs, input.sourceInput.source_pr_refs)) {
      errors.push("prepare.manifest.source_pr_refs must match source_input.source_pr_refs exactly");
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

  const helperAvailability = normalizeHelperAvailability(input.helperAvailability);
  if (!helperAvailability.packageScriptPresent) {
    errors.push("prepare.helper.package_script is missing");
  }
  if (!helperAvailability.scriptPresent) {
    errors.push("prepare.helper.script_path is missing");
  }
  if (!helperAvailability.scriptIsFile) {
    errors.push("prepare.helper.script_path must be a file");
  }
  const helperOutDirStatus = normalizeHelperOutDirStatus(
    input.helperOutDirStatus,
  );
  if (helperOutDirStatus.existsAsFile) {
    errors.push("prepare.out_dir must not be an existing file");
  }
  if (helperOutDirStatus.existsAsNonEmptyDirectory) {
    errors.push("prepare.out_dir must not be a non-empty directory");
  }
  if (helperOutDirStatus.createdByDryRun) {
    errors.push("prepare.out_dir must not be created by dry-run");
  }
  if (input.prepareSummaryOutsideHelperOutDir === false) {
    errors.push("prepare.prepare_summary_out must not be inside helper out-dir");
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
  const helperCommandArgvHash = hashCodexFormerLocalAdapterContent(
    stableStringifyCodexFormerLocalAdapterJson(helperCommandArgv),
  );
  const executionReadiness = buildExecutionReadiness({
    helperAvailability: normalizeHelperAvailability(input.helperAvailability),
    helperOutDirStatus: normalizeHelperOutDirStatus(input.helperOutDirStatus),
    prepareSummaryOutsideHelperOutDir:
      input.prepareSummaryOutsideHelperOutDir !== false,
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
    helper_command_argv_hash: helperCommandArgvHash,
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
      "execution_readiness is not permission to execute automatically.",
    ],
    execution_readiness: executionReadiness,
    authority_flags: buildFalsePrepareAuthorityFlags(),
  };

  return {
    summary,
    summaryJson: stableStringifyCodexFormerLocalAdapterPrepareJson(summary),
  };
}

export function validateCodexFormerLocalAdapterPrepareExecutionInput(
  input: BuildCodexFormerLocalAdapterPrepareExecutionContextInput,
): CodexFormerLocalAdapterValidationResult {
  const errors = collectPrepareExecutionInputErrors(input);
  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertCodexFormerLocalAdapterPrepareDryRunSummary(
  value: unknown,
): CodexFormerLocalAdapterPrepareDryRunSummaryV0 {
  const validation = validatePrepareDryRunSummary(value);
  if (!validation.valid) {
    throw new Error(validation.errors.join("; "));
  }
  return value as CodexFormerLocalAdapterPrepareDryRunSummaryV0;
}

export function buildCodexFormerLocalAdapterPrepareExecutionContext(
  input: BuildCodexFormerLocalAdapterPrepareExecutionContextInput,
): CodexFormerLocalAdapterPrepareExecutionContext {
  const errors = collectPrepareExecutionInputErrors(input);
  if (errors.length > 0) {
    throw new Error(errors.join("; "));
  }
  const dryRunSummary = assertCodexFormerLocalAdapterPrepareDryRunSummary(
    input.dryRunSummary,
  );
  const generatedAt = hasText(input.generatedAtOverride)
    ? input.generatedAtOverride.trim()
    : input.sourceInput.generated_at;
  const helperCommandArgv = buildCodexFormerLocalAdapterPrepareCommandArgv({
    generatedAt,
    helperOutDir: input.helperOutDir,
    sourceInputPath: input.sourceInputPath,
  });
  const helperCommandArgvHash = hashCodexFormerLocalAdapterContent(
    stableStringifyCodexFormerLocalAdapterJson(helperCommandArgv),
  );

  return {
    generatedAt,
    sourceInputPath: input.sourceInputPath,
    sourceInputHash: input.sourceInputHash,
    preflightSummaryPath: input.preflightSummaryPath,
    preflightSummaryHash: input.preflightSummaryHash,
    dryRunSummaryPath: input.dryRunSummaryPath,
    dryRunSummaryHash: input.dryRunSummaryHash,
    manifestPath: input.manifest ? input.manifestPath ?? null : null,
    manifestHash: input.manifest ? input.manifestHash ?? null : null,
    helperOutDir: input.helperOutDir,
    helperCommandArgv,
    helperCommandArgvHash,
    dryRunSummary,
  };
}

export function buildCodexFormerLocalAdapterPrepareExecutionSummary(
  input: BuildCodexFormerLocalAdapterPrepareExecutionSummaryInput,
): {
  summary: CodexFormerLocalAdapterPrepareExecutionSummaryV0;
  summaryJson: string;
} {
  const outcome = buildCodexFormerLocalAdapterPrepareExecutionOutcome({
    helperRunSummary: input.helperRunSummary,
    outputDiscoveryStatus: input.outputDiscovery.status,
  });
  const summary: CodexFormerLocalAdapterPrepareExecutionSummaryV0 = {
    prepare_execution_summary_version:
      CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_SUMMARY_VERSION,
    mode: "prepare-orchestration-execution",
    generated_at: input.context.generatedAt,
    dry_run_summary_path: input.context.dryRunSummaryPath,
    dry_run_summary_hash: input.context.dryRunSummaryHash,
    source_input_path: input.context.sourceInputPath,
    source_input_hash: input.context.sourceInputHash,
    preflight_summary_path: input.context.preflightSummaryPath,
    preflight_summary_hash: input.context.preflightSummaryHash,
    manifest_path: input.context.manifestPath,
    manifest_hash: input.context.manifestHash,
    helper_out_dir: input.context.helperOutDir,
    helper_command_kind: "existing_capture_helper_prepare",
    helper_command_argv: input.context.helperCommandArgv,
    helper_command_argv_hash: input.context.helperCommandArgvHash,
    helper_invocation_attempted:
      input.helperRunSummary.helper_invocation_attempted,
    helper_process_started: input.helperRunSummary.helper_process_started,
    helper_exit_status: input.helperRunSummary.helper_exit_status,
    helper_exit_code: input.helperRunSummary.helper_exit_code,
    helper_stdout_summary: input.helperStdoutSummary,
    helper_stderr_summary: input.helperStderrSummary,
    helper_output_paths: input.outputDiscovery.paths,
    helper_output_refs: input.outputDiscovery.refs,
    helper_output_hashes: input.outputDiscovery.hashes,
    helper_output_sizes: input.outputDiscovery.sizes,
    helper_metadata_checks: input.outputDiscovery.metadata_checks,
    output_discovery_caveats: input.outputDiscovery.caveats,
    output_discovery_status: input.outputDiscovery.status,
    execution_result: outcome.execution_result,
    next_safe_action: buildExecutionNextSafeAction(outcome.execution_result),
    caveats: buildExecutionCaveats({
      helperRunSummary: input.helperRunSummary,
      outputDiscovery: input.outputDiscovery,
      outcome,
    }),
    execution_readiness_snapshot: input.context.dryRunSummary.execution_readiness,
    failure_kind: outcome.failure_kind,
    authority_flags: buildPrepareAuthorityFlags({
      prepareHelperExecuted: outcome.prepare_helper_executed,
    }),
  };

  return {
    summary,
    summaryJson: stableStringifyCodexFormerLocalAdapterPrepareJson(summary),
  };
}

export function buildCodexFormerLocalAdapterPrepareHelperRunSummary({
  helperInvocationAttempted,
  helperExitCode,
  stdout,
  stderr,
  spawnErrorName,
}: {
  helperInvocationAttempted: boolean;
  helperExitCode: number | null;
  stdout?: string | null;
  stderr?: string | null;
  spawnErrorName?: string | null;
}): CodexFormerLocalAdapterPrepareHelperRunSummary {
  const helperProcessStarted = helperInvocationAttempted && helperExitCode !== null;
  return {
    helper_invocation_attempted: helperInvocationAttempted,
    helper_process_started: helperProcessStarted,
    helper_exit_status:
      helperProcessStarted && helperExitCode === 0 ? "success" : "failed",
    helper_exit_code: helperExitCode,
    stdout: typeof stdout === "string" ? stdout : "",
    stderr: typeof stderr === "string" ? stderr : "",
    spawn_error_name: hasText(spawnErrorName) ? spawnErrorName : null,
  };
}

export function buildCodexFormerLocalAdapterPrepareExecutionOutcome({
  helperRunSummary,
  outputDiscoveryStatus,
}: {
  helperRunSummary: CodexFormerLocalAdapterPrepareHelperRunSummary;
  outputDiscoveryStatus: CodexFormerLocalAdapterPrepareExecutionDiscovery["status"];
}): CodexFormerLocalAdapterPrepareExecutionOutcome {
  if (
    helperRunSummary.helper_invocation_attempted &&
    !helperRunSummary.helper_process_started
  ) {
    return {
      execution_result: "invocation_failed",
      failure_kind: "helper_spawn_failed",
      prepare_helper_executed: false,
    };
  }
  if (helperRunSummary.helper_exit_status === "failed") {
    return {
      execution_result: "helper_failed",
      failure_kind: "helper_exit_nonzero",
      prepare_helper_executed: helperRunSummary.helper_process_started,
    };
  }
  if (outputDiscoveryStatus !== "complete") {
    return {
      execution_result: "output_incomplete",
      failure_kind: "output_discovery_incomplete",
      prepare_helper_executed: helperRunSummary.helper_process_started,
    };
  }
  return {
    execution_result: "success",
    failure_kind: null,
    prepare_helper_executed: helperRunSummary.helper_process_started,
  };
}

export function buildCodexFormerLocalAdapterPrepareExecutionLogSummary(
  text: string,
  {
    maxLines = 40,
    maxChars = 4000,
  }: {
    maxLines?: number;
    maxChars?: number;
  } = {},
): CodexFormerLocalAdapterPrepareExecutionLogSummary {
  const rawText = typeof text === "string" ? text : "";
  const rawLines = rawText.length > 0 ? rawText.split(/\r?\n/) : [];
  if (rawLines.at(-1) === "") rawLines.pop();

  const lines: string[] = [];
  const normalizedLines: string[] = [];
  const lineEvents: CodexFormerLocalAdapterPrepareExecutionLogSummary["line_events"] = [];
  let charCount = 0;
  let truncated = false;
  let unsafeMarkerOmitted = false;
  let npmWrapperLineCount = 0;
  let helperKvLineCount = 0;

  for (const line of rawLines) {
    const category = classifyPrepareExecutionLogLine(line);
    if (category === "npm_wrapper") npmWrapperLineCount += 1;
    if (category === "helper_kv") helperKvLineCount += 1;
    if (containsPrepareExecutionUnsafeMarkerCategory(line)) {
      unsafeMarkerOmitted = true;
      truncated = true;
      lineEvents.push({ category: "omitted_unsafe", text: null });
      continue;
    }
    if (lines.length >= maxLines) {
      truncated = true;
      continue;
    }
    const remainingChars = maxChars - charCount;
    if (remainingChars <= 0) {
      truncated = true;
      continue;
    }

    const truncationSuffix = "[truncated]";
    const includedLine =
      line.length > remainingChars
        ? remainingChars <= truncationSuffix.length
          ? truncationSuffix.slice(0, remainingChars)
          : `${line.slice(0, remainingChars - truncationSuffix.length)}${truncationSuffix}`
        : line;
    if (includedLine !== line) {
      truncated = true;
    }
    lines.push(includedLine);
    normalizedLines.push(normalizePrepareExecutionLogLine(includedLine, category));
    lineEvents.push({
      category,
      text: normalizePrepareExecutionLogLine(includedLine, category),
    });
    charCount += includedLine.length;
  }

  return {
    line_count: rawLines.length,
    included_line_count: lines.length,
    truncated,
    omitted_line_count: rawLines.length - lines.length,
    unsafe_marker_omitted: unsafeMarkerOmitted,
    max_lines: maxLines,
    max_chars: maxChars,
    lines,
    normalized_lines: normalizedLines,
    line_events: lineEvents,
    npm_wrapper_line_count: npmWrapperLineCount,
    helper_kv_line_count: helperKvLineCount,
  };
}

export function discoverCodexFormerLocalAdapterPrepareOutputs(
  input: DiscoverCodexFormerLocalAdapterPrepareOutputsInput,
): CodexFormerLocalAdapterPrepareExecutionDiscovery {
  const metadataRead = readPrepareExecutionMetadata(input.files.metadata?.text ?? null);
  const metadata = metadataRead.value;
  const paths: CodexFormerLocalAdapterPrepareExecutionOutputPaths = {
    manual_copy_packet_path: null,
    former_input_packet_path: null,
    prompt_path: input.files.prompt?.path ?? null,
    return_envelope_template_path:
      input.files.returnEnvelopeTemplate?.path ?? null,
    helper_metadata_path: input.files.metadata?.path ?? null,
  };
  const refs: CodexFormerLocalAdapterPrepareExecutionOutputRefs = {
    manual_copy_packet_ref: null,
    former_input_packet_ref: null,
  };
  const hashes: CodexFormerLocalAdapterPrepareExecutionOutputHashes = {
    manual_copy_packet_hash: null,
    former_input_packet_hash: null,
    prompt_hash: input.files.prompt
      ? hashCodexFormerLocalAdapterContent(input.files.prompt.text)
      : null,
    return_envelope_template_hash: input.files.returnEnvelopeTemplate
      ? hashCodexFormerLocalAdapterContent(input.files.returnEnvelopeTemplate.text)
      : null,
    helper_metadata_hash: input.files.metadata
      ? hashCodexFormerLocalAdapterContent(input.files.metadata.text)
      : null,
  };
  const sizes: CodexFormerLocalAdapterPrepareExecutionOutputSizes = {
    manual_copy_packet_size_bytes: null,
    former_input_packet_size_bytes: null,
    prompt_size_bytes: input.files.prompt?.size_bytes ?? null,
    return_envelope_template_size_bytes:
      input.files.returnEnvelopeTemplate?.size_bytes ?? null,
    helper_metadata_size_bytes: input.files.metadata?.size_bytes ?? null,
  };
  const caveats: string[] = [];
  const metadataChecks = buildPrepareExecutionMetadataChecks({
    metadata,
    metadataParseStatus: metadataRead.status,
    sourceInputHash: input.sourceInputHash,
    generatedAt: input.generatedAt,
    promptFileSha256: hashes.prompt_hash,
  });

  if (!input.files.metadata) {
    caveats.push("helper metadata output was missing");
  }
  if (metadataRead.status === "invalid_json") {
    caveats.push("helper metadata JSON was invalid");
  }
  if (!input.files.prompt) {
    caveats.push("copyable prompt output was missing");
  }
  if (!input.files.returnEnvelopeTemplate) {
    caveats.push("return envelope template output was missing");
  }

  if (metadata) {
    refs.manual_copy_packet_ref = boundedPrepareExecutionRef(
      metadata.source_manual_copy_packet_id,
      "source_manual_copy_packet_id",
      caveats,
    );
    refs.former_input_packet_ref = boundedPrepareExecutionRef(
      metadata.source_former_input_packet_id,
      "source_former_input_packet_id",
      caveats,
    );
    if (metadataChecks.source_input_hash_match === false) {
      caveats.push("helper metadata source_input_hash did not match source input bytes");
    }
    if (metadataChecks.generated_at_match === false) {
      caveats.push("helper metadata generated_at did not match execution generated_at");
    }
    if (metadata.capture_source_kind !== "bounded_source_input_file") {
      caveats.push("helper metadata capture_source_kind was not bounded_source_input_file");
    }
    if (metadataChecks.prompt_hash_match === false) {
      caveats.push("helper metadata source_prompt_hash did not match prompt file hash");
    }
    if (!isNonAuthorizingPrepareExecutionMetadata(metadata.authority_boundary)) {
      caveats.push("helper metadata authority_boundary was missing or not non-authorizing");
    }
  }

  const complete =
    input.helperExitStatus === "success" &&
    Boolean(
      metadata &&
        input.files.prompt &&
        input.files.returnEnvelopeTemplate &&
        input.files.metadata &&
        hashes.prompt_hash &&
        hashes.return_envelope_template_hash &&
        hashes.helper_metadata_hash &&
        refs.manual_copy_packet_ref &&
        refs.former_input_packet_ref,
    ) &&
    caveats.length === 0;

  return {
    status:
      input.helperExitStatus === "failed"
        ? "failed"
        : complete
          ? "complete"
          : "incomplete",
    paths,
    refs,
    hashes,
    sizes,
    caveats: uniqueStrings(caveats),
    metadata_checks: metadataChecks,
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

function validatePrepareDryRunSummary(
  value: unknown,
): CodexFormerLocalAdapterValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return {
      valid: false,
      errors: ["prepare dry-run summary JSON must be an object"],
    };
  }
  const summary = value;
  if (summary.prepare_summary_version !== CODEX_FORMER_LOCAL_ADAPTER_PREPARE_SUMMARY_VERSION) {
    errors.push(
      `prepare dry-run summary version must be ${CODEX_FORMER_LOCAL_ADAPTER_PREPARE_SUMMARY_VERSION}`,
    );
  }
  if (summary.mode !== "prepare-orchestration-dry-run") {
    errors.push("prepare dry-run summary mode must be prepare-orchestration-dry-run");
  }
  if (summary.dry_run !== true) {
    errors.push("prepare dry-run summary dry_run must be true");
  }
  if (summary.helper_exit_status !== "not_run") {
    errors.push("prepare dry-run summary helper_exit_status must be not_run");
  }
  if (summary.helper_command_kind !== "existing_capture_helper_prepare") {
    errors.push("prepare dry-run summary helper_command_kind must be existing_capture_helper_prepare");
  }
  if (!hasText(summary.generated_at)) {
    errors.push("prepare dry-run summary generated_at is required");
  }
  if (!hasText(summary.source_input_path)) {
    errors.push("prepare dry-run summary source_input_path is required");
  }
  if (!isSha256(summary.source_input_hash)) {
    errors.push("prepare dry-run summary source_input_hash must be a sha256 hash");
  }
  if (!hasText(summary.preflight_summary_path)) {
    errors.push("prepare dry-run summary preflight_summary_path is required");
  }
  if (!hasText(summary.helper_out_dir)) {
    errors.push("prepare dry-run summary helper_out_dir is required");
  }
  if (!Array.isArray(summary.helper_command_argv)) {
    errors.push("prepare dry-run summary helper_command_argv must be an array");
  } else if (!summary.helper_command_argv.every((item) => typeof item === "string")) {
    errors.push("prepare dry-run summary helper_command_argv must contain only strings");
  }
  if (!isSha256(summary.helper_command_argv_hash)) {
    errors.push("prepare dry-run summary helper_command_argv_hash must be a sha256 hash");
  }
  if (!isRecord(summary.execution_readiness)) {
    errors.push("prepare dry-run summary execution_readiness must be an object");
  } else {
    if (summary.execution_readiness.ready_for_prepare_execution !== true) {
      errors.push(
        "prepare dry-run summary execution_readiness.ready_for_prepare_execution must be true",
      );
    }
    if (summary.execution_readiness.status !== "ready") {
      errors.push("prepare dry-run summary execution_readiness.status must be ready");
    }
    if (!Array.isArray(summary.execution_readiness.blockers)) {
      errors.push("prepare dry-run summary execution_readiness.blockers must be an array");
    } else if (summary.execution_readiness.blockers.length > 0) {
      errors.push("prepare dry-run summary execution_readiness.blockers must be empty");
    }
  }
  if (!isRecord(summary.authority_flags)) {
    errors.push("prepare dry-run summary authority_flags must be an object");
  } else {
    for (const key of [
      "accepted_state_created",
      "proof_evidence_readiness_created",
      "review_decision_created",
      "provider_model_calls",
      "codex_sdk_calls",
      "github_api_calls",
      "network_calls",
      "db_writes",
      "clipboard_automation",
      "live_codex_capture",
      "runtime_fixture_mutation",
      "prepare_helper_executed",
      "validate_helper_executed",
      "surface_export_created",
      "core_decision",
    ]) {
      if (summary.authority_flags[key] !== false) {
        errors.push(`prepare dry-run summary authority_flags.${key} must be false`);
      }
    }
  }

  return { valid: errors.length === 0, errors: uniqueStrings(errors) };
}

function collectPrepareExecutionInputErrors(
  input: BuildCodexFormerLocalAdapterPrepareExecutionContextInput,
) {
  const errors: string[] = [];

  if (!hasText(input.sourceInputPath)) {
    errors.push("prepare execution source_input_path is required");
  }
  if (!isSha256(input.sourceInputHash)) {
    errors.push("prepare execution source_input_hash must be a sha256 hash");
  }
  if (!hasText(input.preflightSummaryPath)) {
    errors.push("prepare execution preflight_summary_path is required");
  }
  if (!isSha256(input.preflightSummaryHash)) {
    errors.push("prepare execution preflight_summary_hash must be a sha256 hash");
  }
  if (!hasText(input.dryRunSummaryPath)) {
    errors.push("prepare execution dry_run_summary_path is required");
  }
  if (!isSha256(input.dryRunSummaryHash)) {
    errors.push("prepare execution dry_run_summary_hash must be a sha256 hash");
  }
  if (!hasText(input.helperOutDir)) {
    errors.push("prepare execution helper_out_dir is required");
  }
  if (
    hasText(input.expectedSourceInputHash) &&
    input.expectedSourceInputHash !== input.sourceInputHash
  ) {
    errors.push(
      "prepare execution expected_source_input_hash does not match source input bytes",
    );
  }

  const sourceInputValidation = validateCodexFormerLocalAdapterSourceInput(
    input.sourceInput,
  );
  errors.push(...sourceInputValidation.errors);
  for (const marker of collectUnsafeCodexFormerLocalAdapterSourceInputMarkers(
    input.sourceInput,
  )) {
    errors.push(
      `prepare execution source input contains unsafe marker category at ${marker.path}: ${marker.marker_kind}`,
    );
  }

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
    errors.push(
      "prepare execution preflight summary source_input_hash does not match source input bytes",
    );
  }
  for (const marker of collectUnsafeCodexFormerLocalAdapterSourceInputMarkers(
    input.preflightSummary,
  )) {
    errors.push(
      `prepare execution preflight summary contains unsafe marker category at ${marker.path}: ${marker.marker_kind}`,
    );
  }

  const dryRunValidation = validatePrepareDryRunSummary(input.dryRunSummary);
  errors.push(...dryRunValidation.errors);
  if (dryRunValidation.valid) {
    const dryRunSummary = input.dryRunSummary as CodexFormerLocalAdapterPrepareDryRunSummaryV0;
    const generatedAt = hasText(input.generatedAtOverride)
      ? input.generatedAtOverride.trim()
      : input.sourceInput.generated_at;
    const helperCommandArgv = buildCodexFormerLocalAdapterPrepareCommandArgv({
      generatedAt,
      helperOutDir: input.helperOutDir,
      sourceInputPath: input.sourceInputPath,
    });
    const helperCommandArgvHash = hashCodexFormerLocalAdapterContent(
      stableStringifyCodexFormerLocalAdapterJson(helperCommandArgv),
    );

    if (dryRunSummary.generated_at !== generatedAt) {
      errors.push("prepare execution generated_at must match dry-run summary generated_at");
    }
    if (dryRunSummary.source_input_path !== input.sourceInputPath) {
      errors.push(
        "prepare execution source_input_path must exactly match dry-run summary source_input_path",
      );
    }
    if (dryRunSummary.source_input_hash !== input.sourceInputHash) {
      errors.push(
        "prepare execution dry-run summary source_input_hash does not match source input bytes",
      );
    }
    if (dryRunSummary.preflight_summary_path !== input.preflightSummaryPath) {
      errors.push(
        "prepare execution preflight_summary_path must exactly match dry-run summary preflight_summary_path",
      );
    }
    if (dryRunSummary.helper_out_dir !== input.helperOutDir) {
      errors.push(
        "prepare execution helper_out_dir must exactly match dry-run summary helper_out_dir",
      );
    }
    if (!sameStringArray(dryRunSummary.helper_command_argv, helperCommandArgv)) {
      errors.push("prepare execution helper_command_argv does not match dry-run summary");
    }
    if (dryRunSummary.helper_command_argv_hash !== helperCommandArgvHash) {
      errors.push(
        "prepare execution helper_command_argv_hash does not match reconstructed argv",
      );
    }
    if (
      hasText(input.expectedHelperCommandArgvHash) &&
      input.expectedHelperCommandArgvHash !== helperCommandArgvHash
    ) {
      errors.push(
        "prepare execution expected_helper_command_argv_hash does not match reconstructed argv",
      );
    }
    if (input.manifest) {
      if (dryRunSummary.manifest_path !== input.manifestPath) {
        errors.push(
          "prepare execution manifest_path must exactly match dry-run summary manifest_path",
        );
      }
      if (dryRunSummary.manifest_hash !== input.manifestHash) {
        errors.push(
          "prepare execution manifest_hash must match dry-run summary manifest_hash",
        );
      }
    } else if (dryRunSummary.manifest_path !== null || dryRunSummary.manifest_hash !== null) {
      errors.push("prepare execution requires --manifest when dry-run summary includes manifest");
    }
  }

  if (input.manifest) {
    const manifestValidation = validateCodexFormerLocalAdapterManifest(
      input.manifest,
    );
    errors.push(...manifestValidation.errors);
    if (!hasText(input.manifestPath)) {
      errors.push("prepare execution manifest_path is required when manifest is supplied");
    }
    if (!isSha256(input.manifestHash)) {
      errors.push(
        "prepare execution manifest_hash must be a sha256 hash when manifest is supplied",
      );
    }
    if (input.manifest.work_id !== input.sourceInput.work_id) {
      errors.push("prepare execution manifest.work_id must match source_input.work_id");
    }
    if (input.manifest.scope !== input.sourceInput.scope) {
      errors.push("prepare execution manifest.scope must match source_input.scope");
    }
    if (!sameStringArray(input.manifest.changed_files, input.sourceInput.changed_files)) {
      errors.push(
        "prepare execution manifest.changed_files must match source_input.changed_files exactly",
      );
    }
    if (!sameStringArray(input.manifest.source_pr_refs, input.sourceInput.source_pr_refs)) {
      errors.push(
        "prepare execution manifest.source_pr_refs must match source_input.source_pr_refs exactly",
      );
    }
    for (const marker of collectUnsafeCodexFormerLocalAdapterManifestMarkers(
      input.manifest,
    )) {
      errors.push(
        `prepare execution manifest contains unsafe marker category at ${marker.path}: ${marker.marker_kind}`,
      );
    }
  }

  return uniqueStrings(errors);
}

function buildFalsePrepareAuthorityFlags(): CodexFormerLocalAdapterPrepareAuthorityFlags {
  return buildPrepareAuthorityFlags({ prepareHelperExecuted: false });
}

function buildPrepareAuthorityFlags({
  prepareHelperExecuted,
}: {
  prepareHelperExecuted: boolean;
}): CodexFormerLocalAdapterPrepareAuthorityFlags {
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
    prepare_helper_executed: prepareHelperExecuted,
    validate_helper_executed: false,
    surface_export_created: false,
    core_decision: false,
  };
}

function buildExecutionNextSafeAction(
  executionResult: CodexFormerLocalAdapterPrepareExecutionResult,
) {
  if (executionResult === "success") {
    return "Use the generated manual copy packet / prompt in a separate user-started Codex session, then return exactly one candidate envelope for validation.";
  }
  if (executionResult === "helper_failed" || executionResult === "invocation_failed") {
    return "Inspect the preserved helper output directory and rerun prepare execution only after correcting the local helper failure.";
  }
  if (executionResult === "output_incomplete") {
    return "Inspect the preserved helper output directory and metadata before using any generated prepare output.";
  }
  return "Run prepare execution only after a reviewed dry-run summary is available.";
}

function buildExecutionCaveats({
  helperRunSummary,
  outputDiscovery,
  outcome,
}: {
  helperRunSummary: CodexFormerLocalAdapterPrepareHelperRunSummary;
  outputDiscovery: CodexFormerLocalAdapterPrepareExecutionDiscovery;
  outcome: CodexFormerLocalAdapterPrepareExecutionOutcome;
}) {
  const caveats = [
    "Prepare execution ran only the existing local capture helper prepare path.",
    "No Codex call was made.",
    "No validate helper was run.",
    "No accepted state, proof/evidence/readiness record, review decision, surface export, DB write, GitHub API call, provider/model API call, network call, or clipboard automation was performed.",
    "prepare_helper_executed true is operational provenance only; it is not acceptance, validation, readiness, or authority.",
  ];
  if (
    helperRunSummary.helper_invocation_attempted &&
    !helperRunSummary.helper_process_started
  ) {
    caveats.push("Helper invocation was attempted but the process did not start.");
  }
  if (outcome.execution_result === "helper_failed") {
    caveats.push("Helper exited non-zero; output directory was preserved for inspection.");
  }
  if (outcome.execution_result === "output_incomplete") {
    caveats.push("Helper exited zero but output discovery was incomplete.");
  }
  if (outputDiscovery.status === "failed") {
    caveats.push("Output discovery is marked failed because helper execution failed.");
  }
  caveats.push(...outputDiscovery.caveats);
  return uniqueStrings(caveats);
}

function readPrepareExecutionMetadata(text: string | null): {
  status: CodexFormerLocalAdapterPrepareExecutionMetadataChecks["metadata_parse_status"];
  value: Record<string, unknown> | null;
} {
  if (!hasText(text)) {
    return { status: "missing", value: null };
  }
  try {
    const parsed = JSON.parse(text);
    return isRecord(parsed)
      ? { status: "parsed", value: parsed }
      : { status: "invalid_json", value: null };
  } catch {
    return { status: "invalid_json", value: null };
  }
}

function buildPrepareExecutionMetadataChecks({
  metadata,
  metadataParseStatus,
  sourceInputHash,
  generatedAt,
  promptFileSha256,
}: {
  metadata: Record<string, unknown> | null;
  metadataParseStatus: CodexFormerLocalAdapterPrepareExecutionMetadataChecks["metadata_parse_status"];
  sourceInputHash: string;
  generatedAt: string;
  promptFileSha256: string | null;
}): CodexFormerLocalAdapterPrepareExecutionMetadataChecks {
  const metadataSourcePromptHash = hasText(metadata?.source_prompt_hash)
    ? String(metadata?.source_prompt_hash)
    : null;
  return {
    metadata_parse_status: metadataParseStatus,
    source_input_hash_match: hasText(metadata?.source_input_hash)
      ? metadata?.source_input_hash === sourceInputHash
      : "not_present",
    generated_at_match: hasText(metadata?.generated_at)
      ? metadata?.generated_at === generatedAt
      : "not_present",
    prompt_hash_match: derivePrepareExecutionPromptHashMatch({
      metadataSourcePromptHash,
      promptFileSha256,
    }),
    metadata_source_prompt_hash: metadataSourcePromptHash,
    prompt_file_sha256: promptFileSha256,
  };
}

function derivePrepareExecutionPromptHashMatch({
  metadataSourcePromptHash,
  promptFileSha256,
}: {
  metadataSourcePromptHash: string | null;
  promptFileSha256: string | null;
}): CodexFormerLocalAdapterPrepareExecutionMetadataChecks["prompt_hash_match"] {
  if (!metadataSourcePromptHash || !promptFileSha256) return "not_present";
  if (!isSha256(metadataSourcePromptHash)) return "not_comparable";
  return metadataSourcePromptHash === promptFileSha256;
}

function boundedPrepareExecutionRef(
  value: unknown,
  label: string,
  caveats: string[],
) {
  if (!hasText(value)) {
    caveats.push(`helper metadata ${label} was missing`);
    return null;
  }
  if (containsPrepareExecutionUnsafeMarkerCategory(value)) {
    caveats.push(`helper metadata ${label} contained an unsafe marker category`);
    return null;
  }
  const trimmed = String(value).trim();
  if (trimmed.length > 240) {
    caveats.push(`helper metadata ${label} was bounded to 240 characters`);
    return trimmed.slice(0, 240);
  }
  return trimmed;
}

function isNonAuthorizingPrepareExecutionMetadata(authorityBoundary: unknown) {
  if (!isRecord(authorityBoundary)) return false;
  return (
    authorityBoundary.output_is_draft_review_material_only === true &&
    authorityBoundary.accepted_augnes_state === false &&
    authorityBoundary.proof_evidence_readiness_records === false &&
    authorityBoundary.provider_model_api_calls === false &&
    authorityBoundary.codex_sdk_calls === false &&
    authorityBoundary.codex_execution === false &&
    authorityBoundary.db_writes === false &&
    authorityBoundary.runtime_routes === false &&
    authorityBoundary.ui === false &&
    authorityBoundary.clipboard_automation === false &&
    authorityBoundary.github_mutation === false &&
    authorityBoundary.approval_merge_publish_core_decision === false
  );
}

function classifyPrepareExecutionLogLine(
  line: string,
): CodexFormerLocalAdapterPrepareExecutionLogSummary["line_events"][number]["category"] {
  if (line.trim().length === 0) return "blank";
  if (line.startsWith("> ")) return "npm_wrapper";
  if (/^[a-zA-Z0-9_]+=[^\n]*$/.test(line)) return "helper_kv";
  return "other";
}

function normalizePrepareExecutionLogLine(
  line: string,
  category: CodexFormerLocalAdapterPrepareExecutionLogSummary["line_events"][number]["category"],
) {
  if (category === "npm_wrapper") return "[npm-wrapper]";
  return line;
}

function containsPrepareExecutionUnsafeMarkerCategory(value: unknown) {
  const lowered = String(value ?? "").toLowerCase();
  const exactMarkers = [
    ["private", "payload"].join("_"),
    ["provider", "payload"].join("_"),
    ["raw", "source", "payload"].join("_"),
    ["raw", "candidate", "payload"].join("_"),
    ["raw", "private", "payload"].join("_"),
    ["raw", "pr", "diff"].join("_"),
    ["raw", "page", "dump"].join("_"),
    ["raw", "review", "payload"].join("_"),
    ["oauth", "token"].join("_"),
    ["access", "token"].join("_"),
    ["refresh", "token"].join("_"),
    ["api", "key"].join("_"),
    ["hidden", "reasoning"].join("_"),
  ];
  const prefixMarkers = [
    ["sk", "proj"].join("-") + "-",
    ["gh", "p_"].join(""),
  ];
  const phraseMarkers = [
    "raw diff",
    "raw diffs",
    "raw pr diff",
    "raw review payload",
    "raw page dump",
    "provider log",
    "provider logs",
    "hidden reasoning",
    "account data",
    "raw screenshot",
    "raw screenshots",
    "screenshot payload",
    "screenshots included",
    "screenshot included",
    "unrelated private",
    "private payload",
    "provider payload",
    "raw source payload",
    "raw candidate payload",
    "raw private payload",
  ];
  const tokenBoundaryMarkers = ["cookie", "cookies", "token", "tokens", "secret", "secrets"];
  return (
    exactMarkers.some((marker) => includesExactMarker(lowered, marker)) ||
    prefixMarkers.some((marker) => lowered.includes(marker)) ||
    phraseMarkers.some((marker) => lowered.includes(marker)) ||
    tokenBoundaryMarkers.some((marker) => includesWordBoundaryMarker(lowered, marker))
  );
}

function includesExactMarker(value: string, marker: string) {
  const escaped = escapeRegExp(marker);
  return new RegExp(`(^|[^a-z0-9_])${escaped}([^a-z0-9_]|$)`, "i").test(
    value,
  );
}

function includesWordBoundaryMarker(value: string, marker: string) {
  const escaped = escapeRegExp(marker);
  return new RegExp(`\\b${escaped}\\b`, "i").test(value);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildExecutionReadiness({
  helperAvailability,
  helperOutDirStatus,
  prepareSummaryOutsideHelperOutDir,
}: {
  helperAvailability: NonNullable<
    BuildCodexFormerLocalAdapterPrepareDryRunSummaryInput["helperAvailability"]
  >;
  helperOutDirStatus: NonNullable<
    BuildCodexFormerLocalAdapterPrepareDryRunSummaryInput["helperOutDirStatus"]
  >;
  prepareSummaryOutsideHelperOutDir: boolean;
}): CodexFormerLocalAdapterPrepareDryRunSummaryV0["execution_readiness"] {
  const checkedRequirements: CodexFormerLocalAdapterPrepareDryRunSummaryV0["execution_readiness"]["checked_requirements"] = [
    requirement("source_input_valid", true, "Source input passed local adapter preflight validation."),
    requirement(
      "source_input_hash_matches_preflight",
      true,
      "Source input hash matched the passed preflight summary.",
    ),
    requirement("preflight_summary_valid", true, "Preflight summary shape is valid."),
    requirement("preflight_status_passed", true, "Preflight summary status is passed."),
    requirement(
      "helper_package_script_present",
      helperAvailability.packageScriptPresent,
      "package.json defines perspective:codex-former:capture-packet.",
    ),
    requirement(
      "helper_script_present",
      helperAvailability.scriptPresent && helperAvailability.scriptIsFile,
      `${helperAvailability.scriptPath} exists and is a file.`,
    ),
    requirement(
      "helper_command_argv_constructed",
      true,
      "Helper command argv was constructed as an array and not executed.",
    ),
    requirement(
      "helper_out_dir_not_created_by_dry_run",
      !helperOutDirStatus.createdByDryRun,
      "Dry-run did not create the helper out-dir.",
    ),
    requirement(
      "helper_out_dir_not_existing_file",
      !helperOutDirStatus.existsAsFile,
      "Helper out-dir is not an existing file.",
    ),
    requirement(
      "helper_out_dir_not_non_empty_directory",
      !helperOutDirStatus.existsAsNonEmptyDirectory,
      "Helper out-dir is not a non-empty directory.",
    ),
    requirement(
      "prepare_summary_outside_helper_out_dir",
      prepareSummaryOutsideHelperOutDir,
      "Prepare summary output is outside the helper out-dir.",
    ),
    requirement(
      "no_forbidden_authority_behavior",
      true,
      "Dry-run summary authority flags remain false.",
    ),
    requirement(
      "no_helper_execution",
      true,
      "Prepare helper and validate helper were not executed.",
    ),
  ];
  const blockers = checkedRequirements
    .filter((item) => item.status === "failed")
    .map((item) => item.detail);
  return {
    ready_for_prepare_execution: blockers.length === 0,
    status: blockers.length === 0 ? "ready" : "not_ready",
    blockers,
    warnings: [
      "execution_readiness is for future execution review only, not permission to execute automatically.",
    ],
    checked_requirements: checkedRequirements,
  };
}

function requirement(
  id: (typeof requiredExecutionReadinessIds)[number],
  passed: boolean,
  detail: string,
) {
  return {
    id,
    status: passed ? "passed" as const : "failed" as const,
    detail,
  };
}

function normalizeHelperAvailability(
  value?: BuildCodexFormerLocalAdapterPrepareDryRunSummaryInput["helperAvailability"],
) {
  return value ?? {
    packageScriptPresent: true,
    scriptPath: "scripts/perspective-codex-former-capture-helper.mjs",
    scriptPresent: true,
    scriptIsFile: true,
  };
}

function normalizeHelperOutDirStatus(
  value?: BuildCodexFormerLocalAdapterPrepareDryRunSummaryInput["helperOutDirStatus"],
) {
  return value ?? {
    existsAsFile: false,
    existsAsNonEmptyDirectory: false,
    createdByDryRun: false,
  };
}

function sameStringArray(left: string[], right: string[]) {
  return (
    Array.isArray(left) &&
    Array.isArray(right) &&
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
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
  CODEX_FORMER_LOCAL_ADAPTER_PREPARE_EXECUTION_SUMMARY_VERSION,
  CODEX_FORMER_LOCAL_ADAPTER_PREPARE_SUMMARY_VERSION,
  CODEX_FORMER_LOCAL_ADAPTER_SOURCE_INPUT_PREFLIGHT_SUMMARY_VERSION,
  assertCodexFormerLocalAdapterPrepareDryRunSummary,
  assertCodexFormerLocalAdapterPreparePreflightSummary,
  buildCodexFormerLocalAdapterPrepareCommandArgv,
  buildCodexFormerLocalAdapterPrepareDryRunSummary,
  buildCodexFormerLocalAdapterPrepareExecutionContext,
  buildCodexFormerLocalAdapterPrepareExecutionLogSummary,
  buildCodexFormerLocalAdapterPrepareExecutionOutcome,
  buildCodexFormerLocalAdapterPrepareExecutionSummary,
  buildCodexFormerLocalAdapterPrepareHelperRunSummary,
  discoverCodexFormerLocalAdapterPrepareOutputs,
  hashCodexFormerLocalAdapterPrepareContent,
  stableStringifyCodexFormerLocalAdapterPrepareJson,
  validateCodexFormerLocalAdapterPrepareDryRunInput,
  validateCodexFormerLocalAdapterPrepareExecutionInput,
};
