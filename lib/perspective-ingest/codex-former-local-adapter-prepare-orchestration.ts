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
  CODEX_FORMER_LOCAL_ADAPTER_PREPARE_SUMMARY_VERSION,
  CODEX_FORMER_LOCAL_ADAPTER_SOURCE_INPUT_PREFLIGHT_SUMMARY_VERSION,
  assertCodexFormerLocalAdapterPreparePreflightSummary,
  buildCodexFormerLocalAdapterPrepareCommandArgv,
  buildCodexFormerLocalAdapterPrepareDryRunSummary,
  hashCodexFormerLocalAdapterPrepareContent,
  stableStringifyCodexFormerLocalAdapterPrepareJson,
  validateCodexFormerLocalAdapterPrepareDryRunInput,
};
