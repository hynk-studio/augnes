import type {
  CodexFormerLocalAdapterManifest,
  CodexFormerLocalAdapterSourceInput,
  CodexFormerLocalAdapterSourceInputPreflightSummary,
  CodexFormerLocalAdapterValidationResult,
} from "@/lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input";
import {
  collectUnsafeCodexFormerLocalAdapterSourceInputMarkers,
  hashCodexFormerLocalAdapterContent,
  stableStringifyCodexFormerLocalAdapterJson,
  validateCodexFormerLocalAdapterManifest,
  validateCodexFormerLocalAdapterSourceInput,
} from "@/lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input";

export const CODEX_FORMER_LOCAL_ADAPTER_SESSION_PANEL_SNAPSHOT_VERSION =
  "codex_former_local_adapter_session_panel_snapshot.v0.1";
export const CODEX_FORMER_LOCAL_ADAPTER_INBOX_ITEM_SNAPSHOT_VERSION =
  "codex_former_local_adapter_inbox_item_snapshot.v0.1";
export const CODEX_FORMER_LOCAL_ADAPTER_SURFACE_SNAPSHOT_SUMMARY_VERSION =
  "codex_former_local_adapter_surface_snapshot_summary.v0.1";

export type CodexFormerLocalAdapterSnapshotState =
  | "not_ready"
  | "waiting"
  | "prepared_waiting_for_codex_return";
export type CodexFormerLocalAdapterSessionScenarioId =
  | "not-prepared"
  | "waiting-for-candidate"
  | "prepared-waiting-for-codex-return";
export type CodexFormerLocalAdapterReviewability = "not_ready" | "waiting";

export type CodexFormerLocalAdapterSnapshotSource = {
  manifest_path: string;
  manifest_hash: string;
  source_input_path: string | null;
  source_input_hash: string | null;
  preflight_summary_path: string | null;
  preflight_status: "passed" | "failed" | null;
};

export type CodexFormerLocalAdapterSessionPanelSnapshotV0 = {
  snapshot_version: typeof CODEX_FORMER_LOCAL_ADAPTER_SESSION_PANEL_SNAPSHOT_VERSION;
  snapshot_kind: "session_panel";
  generated_at: string;
  source: CodexFormerLocalAdapterSnapshotSource;
  scenario_id: CodexFormerLocalAdapterSessionScenarioId;
  primary_status_label: string;
  caveat_label: string;
  next_safe_action_label: string;
  review_only: true;
  accepted_state: false;
  timeline: Array<{
    id: string;
    label: string;
    status: "not_started" | "ready" | "waiting" | "complete";
    description: string;
  }>;
  evidence: {
    source_input_hash: string;
    source_prompt_hash: "not_run";
    metadata_match: "not_run";
    candidate_count: 0;
    manifest_scope: string;
    manifest_work_id: string;
    source_pr_refs: string[];
    optional_path_presence: {
      existing_helper_metadata_path: boolean;
      returned_envelope_path: boolean;
      validation_summary_path: boolean;
    };
    prepare_execution?: CodexFormerLocalAdapterPrepareOutputSnapshotEvidence;
  };
  warnings: {
    warning_count: number;
    blocked_reason_count: 0;
    missing_prerequisites: string[];
    groups: Array<{
      id: string;
      label: string;
      count: number;
      tone: "neutral" | "warning";
      examples: string[];
    }>;
  };
  authority: {
    tags: string[];
    facts: Array<{ label: string; value: string }>;
    flags: ReturnType<typeof buildFalseAuthorityFlags>;
  };
  handoff: {
    label: string;
    detail: string;
    available: false;
    href: null;
  };
  privacy: ReturnType<typeof boundedPrivacy>;
};

export type CodexFormerLocalAdapterInboxItemSnapshotV0 = {
  snapshot_version: typeof CODEX_FORMER_LOCAL_ADAPTER_INBOX_ITEM_SNAPSHOT_VERSION;
  snapshot_kind: "capture_review_inbox_item";
  generated_at: string;
  source: CodexFormerLocalAdapterSnapshotSource;
  item_id: string;
  title: string;
  source_session_label: string;
  primary_status: string;
  reviewability: CodexFormerLocalAdapterReviewability;
  stage?: "prepared_waiting_for_codex_return";
  caveat: string;
  next_safe_action: string;
  review_only: true;
  accepted_state: false;
  candidate_count: 0;
  metadata_match: "not_run";
  warning_count: number;
  blocked_reason_count: 0;
  badges: string[];
  authority_tags: string[];
  authority_facts: Array<{ label: string; value: string }>;
  authority_flags: ReturnType<typeof buildFalseAuthorityFlags>;
  evidence?: CodexFormerLocalAdapterPrepareOutputSnapshotEvidence;
  warning_summary: {
    label: string;
    examples: string[];
  };
  blocked_reason_summary: {
    label: "No blocked reasons";
    examples: [];
  };
  safe_links: {
    session_panel: {
      label: string;
      href: null;
      available: false;
      detail: string;
    };
    constellation_preview: {
      label: "Not ready";
      href: null;
      available: false;
      detail: string;
    };
  };
  privacy: ReturnType<typeof boundedPrivacy>;
};

export type CodexFormerLocalAdapterSurfaceSnapshotSummaryV0 = {
  snapshot_summary_version: typeof CODEX_FORMER_LOCAL_ADAPTER_SURFACE_SNAPSHOT_SUMMARY_VERSION;
  mode: "local-adapter-surface-snapshots";
  generated_at: string;
  snapshot_state: CodexFormerLocalAdapterSnapshotState;
  manifest_path: string;
  manifest_hash: string;
  source_input_path: string | null;
  source_input_hash: string | null;
  preflight_summary_path: string | null;
  preflight_summary_hash: string | null;
  preflight_status: "passed" | "failed" | null;
  prepare_execution_summary_path: string | null;
  prepare_execution_summary_hash: string | null;
  output_discovery_status: "complete" | null;
  execution_result: "success" | null;
  prepare_helper_executed: boolean;
  validate_helper_executed: false;
  session_panel_snapshot_path: string;
  inbox_item_snapshot_path: string;
  authority_flags: ReturnType<typeof buildSnapshotSummaryAuthorityFlags>;
};

export type CodexFormerLocalAdapterPrepareOutputSnapshotEvidence = {
  prepare_execution_summary_path: string;
  prepare_execution_summary_hash: string;
  helper_out_dir: string;
  helper_command_argv_hash: string;
  output_discovery_status: "complete";
  execution_result: "success";
  prepare_helper_executed: true;
  validate_helper_executed: false;
  operational_provenance_only: true;
  helper_output_refs: {
    manual_copy_packet_ref: string | null;
    former_input_packet_ref: string | null;
  };
  helper_output_hashes: {
    prompt_hash: string;
    return_envelope_template_hash: string;
    helper_metadata_hash: string;
    manual_copy_packet_hash: string | null;
    former_input_packet_hash: string | null;
  };
  helper_output_sizes: {
    prompt_size_bytes: number;
    return_envelope_template_size_bytes: number;
    helper_metadata_size_bytes: number;
    manual_copy_packet_size_bytes: number | null;
    former_input_packet_size_bytes: number | null;
  };
};

export type CodexFormerLocalAdapterPrepareExecutionSummaryForSnapshots = {
  prepare_execution_summary_version: "codex_former_local_adapter_prepare_execution_summary.v0.1";
  mode: "prepare-orchestration-execution";
  source_input_hash: string;
  preflight_summary_hash: string;
  manifest_hash: string | null;
  helper_out_dir: string;
  helper_command_argv_hash: string;
  helper_exit_status: "success";
  helper_exit_code: 0;
  helper_output_paths: {
    prompt_path: string | null;
    return_envelope_template_path: string | null;
    helper_metadata_path: string | null;
    manual_copy_packet_path: string | null;
    former_input_packet_path: string | null;
  };
  helper_output_refs: {
    manual_copy_packet_ref: string | null;
    former_input_packet_ref: string | null;
  };
  helper_output_hashes: {
    prompt_hash: string | null;
    return_envelope_template_hash: string | null;
    helper_metadata_hash: string | null;
    manual_copy_packet_hash: string | null;
    former_input_packet_hash: string | null;
  };
  helper_output_sizes: {
    prompt_size_bytes: number | null;
    return_envelope_template_size_bytes: number | null;
    helper_metadata_size_bytes: number | null;
    manual_copy_packet_size_bytes: number | null;
    former_input_packet_size_bytes: number | null;
  };
  helper_metadata_checks: {
    metadata_parse_status: "parsed";
    source_input_hash_match: true;
    generated_at_match: true | "not_present";
    prompt_hash_match: true | false | "not_comparable" | "not_present";
  };
  output_discovery_status: "complete";
  execution_result: "success";
  failure_kind: null;
  authority_flags: Record<string, unknown>;
};

export type BuildCodexFormerLocalAdapterSurfaceSnapshotsInputV0 = {
  manifest: CodexFormerLocalAdapterManifest;
  manifestPath: string;
  manifestHash: string;
  sessionPanelSnapshotPath: string;
  inboxItemSnapshotPath: string;
  sourceInput?: CodexFormerLocalAdapterSourceInput | null;
  sourceInputPath?: string | null;
  sourceInputHash?: string | null;
  preflightSummary?: CodexFormerLocalAdapterSourceInputPreflightSummary | null;
  preflightSummaryPath?: string | null;
  preflightSummaryHash?: string | null;
  prepareExecutionSummary?: CodexFormerLocalAdapterPrepareExecutionSummaryForSnapshots | null;
  prepareExecutionSummaryPath?: string | null;
  prepareExecutionSummaryHash?: string | null;
  generatedAtOverride?: string | null;
};

export type CodexFormerLocalAdapterSurfaceSnapshots = {
  snapshotState: CodexFormerLocalAdapterSnapshotState;
  sessionPanelSnapshot: CodexFormerLocalAdapterSessionPanelSnapshotV0;
  inboxItemSnapshot: CodexFormerLocalAdapterInboxItemSnapshotV0;
  snapshotSummary: CodexFormerLocalAdapterSurfaceSnapshotSummaryV0;
  sessionPanelSnapshotJson: string;
  inboxItemSnapshotJson: string;
  snapshotSummaryJson: string;
};

const sourceInputPreflightSummaryVersion =
  "codex_former_local_adapter_source_input_preflight_summary.v0.1";
const prepareExecutionSummaryVersion =
  "codex_former_local_adapter_prepare_execution_summary.v0.1";

const authorityTags = [
  "review_only",
  "advisory_only",
  "no_accepted_state",
  "no_db_write",
  "no_provider_call",
  "no_codex_sdk_call",
  "no_github_mutation",
  "no_core_decision",
];

export function validateCodexFormerLocalAdapterSurfaceSnapshotInputs(
  input: BuildCodexFormerLocalAdapterSurfaceSnapshotsInputV0,
): CodexFormerLocalAdapterValidationResult {
  const errors: string[] = [];
  const manifestValidation = validateCodexFormerLocalAdapterManifest(
    input.manifest,
  );
  errors.push(...manifestValidation.errors);

  if (!hasText(input.manifestPath)) {
    errors.push("snapshot manifestPath is required");
  }
  if (!isSha256(input.manifestHash)) {
    errors.push("snapshot manifestHash must be a sha256 hash");
  }
  if (!hasText(input.sessionPanelSnapshotPath)) {
    errors.push("snapshot sessionPanelSnapshotPath is required");
  }
  if (!hasText(input.inboxItemSnapshotPath)) {
    errors.push("snapshot inboxItemSnapshotPath is required");
  }

  if (input.sourceInput) {
    const sourceInputValidation = validateCodexFormerLocalAdapterSourceInput(
      input.sourceInput,
    );
    errors.push(...sourceInputValidation.errors);
    if (!hasText(input.sourceInputPath)) {
      errors.push("snapshot sourceInputPath is required when sourceInput is supplied");
    }
    if (!isSha256(input.sourceInputHash)) {
      errors.push("snapshot sourceInputHash must be a sha256 hash when sourceInput is supplied");
    }
  }

  if (input.preflightSummary) {
    if (!input.sourceInput || !hasText(input.sourceInputHash)) {
      errors.push("snapshot sourceInput is required when preflightSummary is supplied");
    }
    errors.push(...validatePreflightSummary(input.preflightSummary).errors);
    if (!hasText(input.preflightSummaryPath)) {
      errors.push(
        "snapshot preflightSummaryPath is required when preflightSummary is supplied",
      );
    }
    if (
      hasText(input.sourceInputHash) &&
      input.preflightSummary.source_input_hash !== input.sourceInputHash
    ) {
      errors.push("snapshot preflight summary source_input_hash does not match source input bytes");
    }
  }

  if (input.prepareExecutionSummary) {
    if (!input.sourceInput || !hasText(input.sourceInputHash)) {
      errors.push(
        "snapshot sourceInput is required when prepareExecutionSummary is supplied",
      );
    }
    if (!input.preflightSummary || input.preflightSummary.status !== "passed") {
      errors.push(
        "snapshot passed preflightSummary is required when prepareExecutionSummary is supplied",
      );
    }
    if (!hasText(input.prepareExecutionSummaryPath)) {
      errors.push(
        "snapshot prepareExecutionSummaryPath is required when prepareExecutionSummary is supplied",
      );
    }
    if (!isSha256(input.prepareExecutionSummaryHash)) {
      errors.push(
        "snapshot prepareExecutionSummaryHash must be a sha256 hash when prepareExecutionSummary is supplied",
      );
    }
    if (!isSha256(input.preflightSummaryHash)) {
      errors.push(
        "snapshot preflightSummaryHash must be a sha256 hash when prepareExecutionSummary is supplied",
      );
    }
    errors.push(
      ...validatePrepareExecutionSummaryForSnapshots(input).errors,
    );
  } else if (hasText(input.prepareExecutionSummaryPath)) {
    errors.push(
      "snapshot prepareExecutionSummary is required when prepareExecutionSummaryPath is supplied",
    );
  }

  return { valid: errors.length === 0, errors: uniqueStrings(errors) };
}

export function buildCodexFormerLocalAdapterSurfaceSnapshots(
  input: BuildCodexFormerLocalAdapterSurfaceSnapshotsInputV0,
): CodexFormerLocalAdapterSurfaceSnapshots {
  const validation =
    validateCodexFormerLocalAdapterSurfaceSnapshotInputs(input);
  if (!validation.valid) {
    throw new Error(validation.errors.join("; "));
  }

  const generatedAt = hasText(input.generatedAtOverride)
    ? String(input.generatedAtOverride).trim()
    : input.manifest.generated_at;
  const snapshotState = resolveSnapshotState(input);
  const source = buildSource(input);
  const sessionPanelSnapshot =
    buildCodexFormerLocalAdapterSessionPanelSnapshot({
      generatedAt,
      input,
      snapshotState,
      source,
    });
  const inboxItemSnapshot = buildCodexFormerLocalAdapterInboxItemSnapshot({
    generatedAt,
    input,
    snapshotState,
    source,
  });
  const snapshotSummary: CodexFormerLocalAdapterSurfaceSnapshotSummaryV0 = {
    snapshot_summary_version:
      CODEX_FORMER_LOCAL_ADAPTER_SURFACE_SNAPSHOT_SUMMARY_VERSION,
    mode: "local-adapter-surface-snapshots",
    generated_at: generatedAt,
    snapshot_state: snapshotState,
    manifest_path: input.manifestPath,
    manifest_hash: input.manifestHash,
    source_input_path: input.sourceInputPath ?? null,
    source_input_hash: input.sourceInputHash ?? null,
    preflight_summary_path: input.preflightSummaryPath ?? null,
    preflight_summary_hash: input.preflightSummaryHash ?? null,
    preflight_status: input.preflightSummary?.status ?? null,
    prepare_execution_summary_path: input.prepareExecutionSummaryPath ?? null,
    prepare_execution_summary_hash: input.prepareExecutionSummaryHash ?? null,
    output_discovery_status: input.prepareExecutionSummary
      ? input.prepareExecutionSummary.output_discovery_status
      : null,
    execution_result: input.prepareExecutionSummary
      ? input.prepareExecutionSummary.execution_result
      : null,
    prepare_helper_executed: Boolean(input.prepareExecutionSummary),
    validate_helper_executed: false,
    session_panel_snapshot_path: input.sessionPanelSnapshotPath,
    inbox_item_snapshot_path: input.inboxItemSnapshotPath,
    authority_flags: buildSnapshotSummaryAuthorityFlags({
      prepareHelperExecuted: Boolean(input.prepareExecutionSummary),
    }),
  };

  return {
    snapshotState,
    sessionPanelSnapshot,
    inboxItemSnapshot,
    snapshotSummary,
    sessionPanelSnapshotJson:
      stableStringifyCodexFormerLocalAdapterSnapshotJson(sessionPanelSnapshot),
    inboxItemSnapshotJson:
      stableStringifyCodexFormerLocalAdapterSnapshotJson(inboxItemSnapshot),
    snapshotSummaryJson:
      stableStringifyCodexFormerLocalAdapterSnapshotJson(snapshotSummary),
  };
}

export function buildCodexFormerLocalAdapterSessionPanelSnapshot({
  generatedAt,
  input,
  snapshotState,
  source,
}: {
  generatedAt: string;
  input: BuildCodexFormerLocalAdapterSurfaceSnapshotsInputV0;
  snapshotState: CodexFormerLocalAdapterSnapshotState;
  source: CodexFormerLocalAdapterSnapshotSource;
}): CodexFormerLocalAdapterSessionPanelSnapshotV0 {
  const common = commonSnapshotFields(input);
  if (snapshotState === "prepared_waiting_for_codex_return") {
    return {
      snapshot_version: CODEX_FORMER_LOCAL_ADAPTER_SESSION_PANEL_SNAPSHOT_VERSION,
      snapshot_kind: "session_panel",
      generated_at: generatedAt,
      source,
      scenario_id: "prepared-waiting-for-codex-return",
      primary_status_label: "Prepared, waiting for Codex return",
      caveat_label: "Manual Codex return has not been captured.",
      next_safe_action_label:
        "Use the generated prompt/manual copy packet in a separate user-started Codex session, then return exactly one candidate envelope.",
      review_only: true,
      accepted_state: false,
      timeline: [
        step("source-input", "Bounded source input", "complete", "Bounded source input is complete and hash-checked."),
        step("source-input-preflight", "Source input preflight", "complete", "Local source-input preflight passed."),
        step("prepare-execution", "Prepare execution", "complete", "Prepare execution completed and helper outputs were discovered."),
        step("manual-copy-packet", "Manual copy packet / prompt", "ready", "Generated prompt/manual copy packet is available for a separate user-started Codex session."),
        step("codex-session", "Separate Codex session", "waiting", "Waiting for the operator to use the generated prompt in a separate Codex session."),
        step("returned-candidate", "Returned candidate", "waiting", "No returned candidate envelope has been captured."),
        step("validation", "Validation", "not_started", "Validate helper has not run."),
        step("review-candidate", "Review candidate", "not_started", "No review candidate is available before validation."),
        step("constellation-handoff", "Constellation handoff", "not_started", "No Constellation handoff is available."),
      ],
      evidence: {
        ...common.evidence,
        prepare_execution: buildPrepareOutputEvidence(input),
      },
      warnings: {
        warning_count: 3,
        blocked_reason_count: 0,
        missing_prerequisites: [
          "Manual Codex return has not been captured.",
          "Validation has not run.",
          "Prepare helper execution is operational provenance only.",
        ],
        groups: [
          {
            id: "waiting-codex-return",
            label: "Waiting for Codex return",
            count: 2,
            tone: "neutral",
            examples: [
              "Return exactly one candidate envelope before validation.",
              "Validation remains not_started.",
            ],
          },
          {
            id: "operational-provenance-only",
            label: "Operational provenance only",
            count: 1,
            tone: "warning",
            examples: [
              "prepare_helper_executed is not accepted state, validation, readiness, or review decision.",
            ],
          },
        ],
      },
      authority: {
        tags: preparedAuthorityTags(),
        facts: preparedAuthorityFacts(),
        flags: buildPreparedAuthorityFlags(),
      },
      handoff: notReadyHandoff(
        "Session Panel status inspection is available as a local snapshot; Constellation Preview and returned-candidate validation are unavailable.",
      ),
      privacy: boundedPrivacy(),
    };
  }

  if (snapshotState === "waiting") {
    return {
      snapshot_version: CODEX_FORMER_LOCAL_ADAPTER_SESSION_PANEL_SNAPSHOT_VERSION,
      snapshot_kind: "session_panel",
      generated_at: generatedAt,
      source,
      scenario_id: "waiting-for-candidate",
      primary_status_label: "Waiting for candidate",
      caveat_label: "Source input preflight passed; returned candidate envelope is missing.",
      next_safe_action_label:
        "Use the existing capture helper prepare output with a separate user-started Codex session, then return exactly one candidate envelope.",
      review_only: true,
      accepted_state: false,
      timeline: [
        step("source-input", "Bounded source input", "complete", "Source input is present and hash-checked."),
        step("source-input-preflight", "Source input preflight", "complete", "Local source-input preflight passed."),
        step("prepare-packet", "Prepare packet", "ready", "Prepare helper may be run by the operator outside this snapshot builder."),
        step("codex-session", "Separate Codex session", "waiting", "Separate user-started Codex session is waiting for manual use."),
        step("returned-candidate", "Returned candidate", "waiting", "No returned candidate envelope is present."),
        step("validation", "Validation", "not_started", "Validate helper has not run."),
        step("constellation-handoff", "Constellation handoff", "not_started", "No graph handoff is available."),
      ],
      evidence: common.evidence,
      warnings: {
        warning_count: 1,
        blocked_reason_count: 0,
        missing_prerequisites: ["Returned candidate envelope is pending."],
        groups: [
          {
            id: "waiting-returned-candidate",
            label: "Waiting for returned candidate",
            count: 1,
            tone: "neutral",
            examples: ["Exactly one candidate envelope must be returned before validation."],
          },
        ],
      },
      authority: common.authority,
      handoff: notReadyHandoff(
        "No Constellation Preview handoff is available before validation.",
      ),
      privacy: boundedPrivacy(),
    };
  }

  const preflightFailed = input.preflightSummary?.status === "failed";
  return {
    snapshot_version: CODEX_FORMER_LOCAL_ADAPTER_SESSION_PANEL_SNAPSHOT_VERSION,
    snapshot_kind: "session_panel",
    generated_at: generatedAt,
    source,
    scenario_id: "not-prepared",
    primary_status_label: "Not prepared",
    caveat_label: preflightFailed
      ? "Source input preflight failed; source input is not ready."
      : "Source input and preflight are not ready.",
    next_safe_action_label:
      "Run manifest-to-source-input adapter and preflight source input.",
    review_only: true,
    accepted_state: false,
    timeline: [
      step("source-input", "Bounded source input", input.sourceInput ? "ready" : "not_started", input.sourceInput ? "Source input exists but waiting is blocked until preflight passes." : "No source input is available."),
      step("source-input-preflight", "Source input preflight", preflightFailed ? "waiting" : "not_started", preflightFailed ? "Preflight failed and must be corrected." : "Preflight has not passed."),
      step("prepare-packet", "Prepare packet", "not_started", "Prepare helper has not run."),
      step("codex-session", "Separate Codex session", "not_started", "No user-started session handoff."),
      step("returned-candidate", "Returned candidate", "not_started", "No candidate envelope returned."),
      step("validation", "Validation", "not_started", "Validation has not run."),
      step("constellation-handoff", "Constellation handoff", "not_started", "No graph handoff."),
    ],
    evidence: common.evidence,
    warnings: {
      warning_count: preflightFailed ? 1 : 2,
      blocked_reason_count: 0,
      missing_prerequisites: input.sourceInput
        ? ["Source input preflight has not passed.", "Returned candidate envelope is unavailable."]
        : ["Source input is unavailable.", "Source input preflight has not passed."],
      groups: [
        {
          id: preflightFailed ? "preflight-failed" : "pending-source-input",
          label: preflightFailed ? "Preflight failed" : "Pending prerequisites",
          count: preflightFailed ? 1 : 2,
          tone: "warning",
          examples: preflightFailed
            ? ["Correct source input before prepare or manual Codex handoff."]
            : ["Generate source input and run local preflight."],
        },
      ],
    },
    authority: common.authority,
    handoff: notReadyHandoff(
      "No Constellation Preview handoff is available before source input preflight and validation.",
    ),
    privacy: boundedPrivacy(),
  };
}

export function buildCodexFormerLocalAdapterInboxItemSnapshot({
  generatedAt,
  input,
  snapshotState,
  source,
}: {
  generatedAt: string;
  input: BuildCodexFormerLocalAdapterSurfaceSnapshotsInputV0;
  snapshotState: CodexFormerLocalAdapterSnapshotState;
  source: CodexFormerLocalAdapterSnapshotSource;
}): CodexFormerLocalAdapterInboxItemSnapshotV0 {
  const common = commonSnapshotFields(input);
  if (snapshotState === "prepared_waiting_for_codex_return") {
    return {
      snapshot_version: CODEX_FORMER_LOCAL_ADAPTER_INBOX_ITEM_SNAPSHOT_VERSION,
      snapshot_kind: "capture_review_inbox_item",
      generated_at: generatedAt,
      source,
      item_id: "local-adapter-prepared-waiting-for-codex-return",
      title: "Prepared, waiting for Codex return",
      source_session_label: input.manifest.work_session_label,
      primary_status: "Prepared, waiting for Codex return",
      reviewability: "waiting",
      stage: "prepared_waiting_for_codex_return",
      caveat: "Manual Codex return has not been captured.",
      next_safe_action:
        "Use generated prompt/manual copy packet in a separate user-started Codex session, then return exactly one candidate envelope.",
      review_only: true,
      accepted_state: false,
      candidate_count: 0,
      metadata_match: "not_run",
      warning_count: 2,
      blocked_reason_count: 0,
      badges: ["prepared", "waiting"],
      authority_tags: preparedAuthorityTags(),
      authority_facts: preparedAuthorityFacts(),
      authority_flags: buildPreparedAuthorityFlags(),
      evidence: buildPrepareOutputEvidence(input),
      warning_summary: {
        label: "Prepared waiting state",
        examples: [
          "Manual Codex return has not been captured.",
          "Validation has not run.",
        ],
      },
      blocked_reason_summary: noBlockedReasons(),
      safe_links: {
        session_panel: {
          label: "Session Panel local snapshot",
          href: null,
          available: false,
          detail: "Session Panel snapshot/status is available as a local snapshot reference only.",
        },
        constellation_preview: {
          label: "Not ready",
          href: null,
          available: false,
          detail: "Constellation Preview is not available before a returned candidate is validated.",
        },
      },
      privacy: boundedPrivacy(),
    };
  }

  if (snapshotState === "waiting") {
    return {
      snapshot_version: CODEX_FORMER_LOCAL_ADAPTER_INBOX_ITEM_SNAPSHOT_VERSION,
      snapshot_kind: "capture_review_inbox_item",
      generated_at: generatedAt,
      source,
      item_id: `capture-review:local-adapter:${input.manifest.work_id}:waiting`,
      title: "Waiting for returned candidate",
      source_session_label: input.manifest.work_session_label,
      primary_status: "Waiting for returned candidate",
      reviewability: "waiting",
      caveat: "Source input preflight passed; returned candidate envelope is missing.",
      next_safe_action:
        "Use the existing capture helper prepare output with a separate user-started Codex session, then return exactly one candidate envelope.",
      review_only: true,
      accepted_state: false,
      candidate_count: 0,
      metadata_match: "not_run",
      warning_count: 1,
      blocked_reason_count: 0,
      badges: ["waiting", "review_only"],
      authority_tags: authorityTags,
      authority_facts: authorityFacts(),
      authority_flags: buildFalseAuthorityFlags(),
      warning_summary: {
        label: "Waiting state",
        examples: ["Source input preflight passed; returned candidate envelope is pending."],
      },
      blocked_reason_summary: noBlockedReasons(),
      safe_links: safeLinks("Session Panel snapshot is available as local JSON."),
      privacy: boundedPrivacy(),
    };
  }

  const preflightFailed = input.preflightSummary?.status === "failed";
  return {
    snapshot_version: CODEX_FORMER_LOCAL_ADAPTER_INBOX_ITEM_SNAPSHOT_VERSION,
    snapshot_kind: "capture_review_inbox_item",
    generated_at: generatedAt,
    source,
    item_id: `capture-review:local-adapter:${input.manifest.work_id}:not-ready`,
    title: "Pending preparation",
    source_session_label: input.manifest.work_session_label,
    primary_status: "Not ready",
    reviewability: "not_ready",
    caveat: preflightFailed
      ? "Source input preflight failed."
      : "Source input and preflight are not ready.",
    next_safe_action:
      "Run manifest-to-source-input adapter and preflight source input.",
    review_only: true,
    accepted_state: false,
    candidate_count: 0,
    metadata_match: "not_run",
    warning_count: preflightFailed ? 1 : 2,
    blocked_reason_count: 0,
    badges: ["not_ready", "review_only"],
    authority_tags: authorityTags,
    authority_facts: authorityFacts(),
    authority_flags: buildFalseAuthorityFlags(),
    warning_summary: {
      label: preflightFailed ? "Preflight failed" : "Pending prerequisites",
      examples: preflightFailed
        ? ["Correct source input before review."]
        : ["Generate source input and run local preflight."],
    },
    blocked_reason_summary: noBlockedReasons(),
    safe_links: safeLinks("Session Panel snapshot is available as local JSON."),
    privacy: boundedPrivacy(),
  };
}

export function stableStringifyCodexFormerLocalAdapterSnapshotJson(
  value: unknown,
) {
  return stableStringifyCodexFormerLocalAdapterJson(value);
}

export function hashCodexFormerLocalAdapterSnapshotContent(content: string) {
  return hashCodexFormerLocalAdapterContent(content);
}

function resolveSnapshotState(
  input: BuildCodexFormerLocalAdapterSurfaceSnapshotsInputV0,
): CodexFormerLocalAdapterSnapshotState {
  if (input.manifest.readiness.status === "not_ready") return "not_ready";
  if (!input.sourceInput) return "not_ready";
  if (!input.preflightSummary || input.preflightSummary.status !== "passed") {
    return "not_ready";
  }
  if (input.prepareExecutionSummary) {
    return "prepared_waiting_for_codex_return";
  }
  return "waiting";
}

function buildSource(
  input: BuildCodexFormerLocalAdapterSurfaceSnapshotsInputV0,
): CodexFormerLocalAdapterSnapshotSource {
  return {
    manifest_path: input.manifestPath,
    manifest_hash: input.manifestHash,
    source_input_path: input.sourceInputPath ?? null,
    source_input_hash: input.sourceInputHash ?? null,
    preflight_summary_path: input.preflightSummaryPath ?? null,
    preflight_status: input.preflightSummary?.status ?? null,
  };
}

function commonSnapshotFields(
  input: BuildCodexFormerLocalAdapterSurfaceSnapshotsInputV0,
) {
  return {
    evidence: {
      source_input_hash: input.sourceInputHash ?? "not_ready",
      source_prompt_hash: "not_run" as const,
      metadata_match: "not_run" as const,
      candidate_count: 0 as const,
      manifest_scope: input.manifest.scope,
      manifest_work_id: input.manifest.work_id,
      source_pr_refs: input.manifest.source_pr_refs,
      optional_path_presence: {
        existing_helper_metadata_path: hasText(
          input.manifest.existing_helper_metadata_path,
        ),
        returned_envelope_path: hasText(input.manifest.returned_envelope_path),
        validation_summary_path: hasText(
          input.manifest.validation_summary_path,
        ),
      },
    },
    authority: {
      tags: authorityTags,
      facts: authorityFacts(),
      flags: buildFalseAuthorityFlags(),
    },
  };
}

function buildPrepareOutputEvidence(
  input: BuildCodexFormerLocalAdapterSurfaceSnapshotsInputV0,
): CodexFormerLocalAdapterPrepareOutputSnapshotEvidence {
  const summary = input.prepareExecutionSummary;
  if (!summary || !hasText(input.prepareExecutionSummaryPath) || !hasText(input.prepareExecutionSummaryHash)) {
    throw new Error("prepare execution summary is required for prepared snapshot evidence");
  }
  if (
    !hasText(summary.helper_output_hashes.prompt_hash) ||
    !hasText(summary.helper_output_hashes.return_envelope_template_hash) ||
    !hasText(summary.helper_output_hashes.helper_metadata_hash) ||
    typeof summary.helper_output_sizes.prompt_size_bytes !== "number" ||
    typeof summary.helper_output_sizes.return_envelope_template_size_bytes !== "number" ||
    typeof summary.helper_output_sizes.helper_metadata_size_bytes !== "number"
  ) {
    throw new Error("prepare execution summary helper output evidence is incomplete");
  }
  return {
    prepare_execution_summary_path: input.prepareExecutionSummaryPath,
    prepare_execution_summary_hash: input.prepareExecutionSummaryHash,
    helper_out_dir: summary.helper_out_dir,
    helper_command_argv_hash: summary.helper_command_argv_hash,
    output_discovery_status: "complete",
    execution_result: "success",
    prepare_helper_executed: true,
    validate_helper_executed: false,
    operational_provenance_only: true,
    helper_output_refs: {
      manual_copy_packet_ref: summary.helper_output_refs.manual_copy_packet_ref,
      former_input_packet_ref: summary.helper_output_refs.former_input_packet_ref,
    },
    helper_output_hashes: {
      prompt_hash: summary.helper_output_hashes.prompt_hash,
      return_envelope_template_hash:
        summary.helper_output_hashes.return_envelope_template_hash,
      helper_metadata_hash: summary.helper_output_hashes.helper_metadata_hash,
      manual_copy_packet_hash: summary.helper_output_hashes.manual_copy_packet_hash,
      former_input_packet_hash: summary.helper_output_hashes.former_input_packet_hash,
    },
    helper_output_sizes: {
      prompt_size_bytes: summary.helper_output_sizes.prompt_size_bytes,
      return_envelope_template_size_bytes:
        summary.helper_output_sizes.return_envelope_template_size_bytes,
      helper_metadata_size_bytes:
        summary.helper_output_sizes.helper_metadata_size_bytes,
      manual_copy_packet_size_bytes:
        summary.helper_output_sizes.manual_copy_packet_size_bytes,
      former_input_packet_size_bytes:
        summary.helper_output_sizes.former_input_packet_size_bytes,
    },
  };
}

function step(
  id: string,
  label: string,
  status: "not_started" | "ready" | "waiting" | "complete",
  description: string,
) {
  return { id, label, status, description };
}

function notReadyHandoff(detail: string): CodexFormerLocalAdapterSessionPanelSnapshotV0["handoff"] {
  return {
    label: "Not ready",
    detail,
    available: false,
    href: null,
  };
}

function safeLinks(detail: string): CodexFormerLocalAdapterInboxItemSnapshotV0["safe_links"] {
  return {
    session_panel: {
      label: "Session Panel local snapshot",
      href: null,
      available: false,
      detail,
    },
    constellation_preview: {
      label: "Not ready",
      href: null,
      available: false,
      detail: "No Constellation Preview handoff is available for not_ready or waiting adapter snapshots.",
    },
  };
}

function noBlockedReasons(): CodexFormerLocalAdapterInboxItemSnapshotV0["blocked_reason_summary"] {
  return { label: "No blocked reasons", examples: [] };
}

function boundedPrivacy() {
  return {
    bounded_summaries_only: true,
    raw_payloads_included: false as const,
    unsafe_input_material_omitted: true,
  };
}

function authorityFacts() {
  return [
    { label: "review_only", value: "true" },
    { label: "accepted_state", value: "false" },
    { label: "candidate_count", value: "0" },
    { label: "decision_authority", value: "none" },
  ];
}

function preparedAuthorityTags() {
  return [
    "review_only",
    "no_accepted_state",
    "no_validate_helper",
    "no_codex_call",
    "no_review_decision",
  ];
}

function preparedAuthorityFacts() {
  return [
    { label: "review_only", value: "true" },
    { label: "accepted_state", value: "false" },
    { label: "candidate_count", value: "0" },
    { label: "decision_authority", value: "none" },
    { label: "prepare_helper_executed", value: "operational_provenance_only" },
    { label: "validate_helper_executed", value: "false" },
  ];
}

function buildPreparedAuthorityFlags() {
  return {
    accepted_state_created: false as const,
    proof_evidence_readiness_created: false as const,
    review_decision_created: false as const,
    provider_model_calls: false as const,
    codex_sdk_calls: false as const,
    github_api_calls: false as const,
    network_calls: false as const,
    db_writes: false as const,
    clipboard_automation: false as const,
    live_codex_capture: false as const,
    runtime_fixture_mutation: false as const,
    prepare_helper_executed: true as const,
    validate_helper_executed: false as const,
    surface_export_created: false as const,
    core_decision: false as const,
  };
}

function buildSnapshotSummaryAuthorityFlags({
  prepareHelperExecuted,
}: {
  prepareHelperExecuted: boolean;
}) {
  return {
    accepted_state_created: false as const,
    proof_evidence_readiness_created: false as const,
    review_decision_created: false as const,
    provider_model_calls: false as const,
    codex_sdk_calls: false as const,
    github_api_calls: false as const,
    network_calls: false as const,
    db_writes: false as const,
    clipboard_automation: false as const,
    live_codex_capture: false as const,
    runtime_fixture_mutation: false as const,
    prepare_helper_executed: prepareHelperExecuted,
    validate_helper_executed: false as const,
    surface_export_created: false as const,
    core_decision: false as const,
  };
}

function buildFalseAuthorityFlags() {
  return {
    accepted_state_created: false as const,
    proof_evidence_readiness_created: false as const,
    review_decision_created: false as const,
    provider_model_calls: false as const,
    codex_sdk_calls: false as const,
    github_api_calls: false as const,
    db_writes: false as const,
    clipboard_automation: false as const,
    live_codex_capture: false as const,
    runtime_fixture_mutation: false as const,
    core_decision: false as const,
  };
}

function validatePrepareExecutionSummaryForSnapshots(
  input: BuildCodexFormerLocalAdapterSurfaceSnapshotsInputV0,
): CodexFormerLocalAdapterValidationResult {
  const errors: string[] = [];
  const summary = input.prepareExecutionSummary;
  if (!isRecord(summary)) {
    return {
      valid: false,
      errors: ["snapshot prepare execution summary JSON must be an object"],
    };
  }

  if (
    summary.prepare_execution_summary_version !==
    prepareExecutionSummaryVersion
  ) {
    errors.push("snapshot prepare execution summary version is unsupported");
  }
  if (summary.mode !== "prepare-orchestration-execution") {
    errors.push("snapshot prepare execution summary mode is unsupported");
  }
  if (summary.helper_exit_status !== "success") {
    errors.push("snapshot prepare execution helper_exit_status must be success");
  }
  if (summary.helper_exit_code !== 0) {
    errors.push("snapshot prepare execution helper_exit_code must be 0");
  }
  if (summary.output_discovery_status !== "complete") {
    errors.push("snapshot prepare execution output_discovery_status must be complete");
  }
  if (summary.execution_result !== "success") {
    errors.push("snapshot prepare execution execution_result must be success");
  }
  if (summary.failure_kind !== null) {
    errors.push("snapshot prepare execution failure_kind must be null");
  }
  if (summary.source_input_hash !== input.sourceInputHash) {
    errors.push("snapshot prepare execution source_input_hash does not match source input bytes");
  }
  if (
    hasText(input.preflightSummaryHash) &&
    summary.preflight_summary_hash !== input.preflightSummaryHash
  ) {
    errors.push("snapshot prepare execution preflight_summary_hash does not match preflight summary bytes");
  }
  if (
    hasText(input.manifestHash) &&
    summary.manifest_hash !== input.manifestHash
  ) {
    errors.push("snapshot prepare execution manifest_hash does not match manifest bytes");
  }

  const paths: Record<string, unknown> = isRecord(summary.helper_output_paths)
    ? summary.helper_output_paths
    : {};
  for (const field of [
    "prompt_path",
    "return_envelope_template_path",
    "helper_metadata_path",
  ]) {
    if (!hasText(paths[field])) {
      errors.push(`snapshot prepare execution helper_output_paths.${field} is required`);
    }
  }

  const refs: Record<string, unknown> = isRecord(summary.helper_output_refs)
    ? summary.helper_output_refs
    : {};
  for (const field of [
    "manual_copy_packet_ref",
    "former_input_packet_ref",
  ]) {
    if (!isBoundedRefOrNull(refs[field])) {
      errors.push(`snapshot prepare execution helper_output_refs.${field} must be bounded or null`);
    }
  }

  const hashes: Record<string, unknown> = isRecord(summary.helper_output_hashes)
    ? summary.helper_output_hashes
    : {};
  for (const field of [
    "prompt_hash",
    "return_envelope_template_hash",
    "helper_metadata_hash",
  ]) {
    if (!isSha256(hashes[field])) {
      errors.push(`snapshot prepare execution helper_output_hashes.${field} must be a sha256 hash`);
    }
  }
  for (const field of [
    "manual_copy_packet_hash",
    "former_input_packet_hash",
  ]) {
    if (hashes[field] !== null && !isSha256(hashes[field])) {
      errors.push(`snapshot prepare execution helper_output_hashes.${field} must be a sha256 hash or null`);
    }
  }

  const sizes: Record<string, unknown> = isRecord(summary.helper_output_sizes)
    ? summary.helper_output_sizes
    : {};
  for (const field of [
    "prompt_size_bytes",
    "return_envelope_template_size_bytes",
    "helper_metadata_size_bytes",
  ]) {
    if (!isNonNegativeInteger(sizes[field])) {
      errors.push(`snapshot prepare execution helper_output_sizes.${field} must be a non-negative integer`);
    }
  }
  for (const field of [
    "manual_copy_packet_size_bytes",
    "former_input_packet_size_bytes",
  ]) {
    if (sizes[field] !== null && !isNonNegativeInteger(sizes[field])) {
      errors.push(`snapshot prepare execution helper_output_sizes.${field} must be a non-negative integer or null`);
    }
  }

  const metadataChecks: Record<string, unknown> = isRecord(
    summary.helper_metadata_checks,
  )
    ? summary.helper_metadata_checks
    : {};
  if (metadataChecks.metadata_parse_status !== "parsed") {
    errors.push("snapshot prepare execution metadata_parse_status must be parsed");
  }
  if (metadataChecks.source_input_hash_match !== true) {
    errors.push("snapshot prepare execution metadata source_input_hash_match must be true");
  }
  if (
    metadataChecks.generated_at_match !== true &&
    metadataChecks.generated_at_match !== "not_present"
  ) {
    errors.push(
      "snapshot prepare execution metadata generated_at_match must be true or not_present",
    );
  }
  if (
    metadataChecks.prompt_hash_match !== true &&
    metadataChecks.prompt_hash_match !== false &&
    metadataChecks.prompt_hash_match !== "not_comparable" &&
    metadataChecks.prompt_hash_match !== "not_present"
  ) {
    errors.push("snapshot prepare execution prompt_hash_match is unsupported");
  }

  const authorityFlags: Record<string, unknown> = isRecord(summary.authority_flags)
    ? summary.authority_flags
    : {};
  if (authorityFlags.prepare_helper_executed !== true) {
    errors.push("snapshot prepare execution prepare_helper_executed must be true");
  }
  for (const field of [
    "validate_helper_executed",
    "accepted_state_created",
    "review_decision_created",
    "proof_evidence_readiness_created",
    "surface_export_created",
    "network_calls",
    "provider_model_calls",
    "codex_sdk_calls",
    "github_api_calls",
    "db_writes",
    "clipboard_automation",
  ]) {
    if (authorityFlags[field] !== false) {
      errors.push(`snapshot prepare execution authority_flags.${field} must be false`);
    }
  }

  for (const marker of collectUnsafeCodexFormerLocalAdapterSourceInputMarkers(
    summary,
  )) {
    errors.push(
      `snapshot prepare execution summary contains unsafe marker category at ${marker.path}: ${marker.marker_kind}`,
    );
  }

  return { valid: errors.length === 0, errors: uniqueStrings(errors) };
}

function validatePreflightSummary(
  value: unknown,
): CodexFormerLocalAdapterValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return {
      valid: false,
      errors: ["snapshot preflight summary JSON must be an object"],
    };
  }
  if (
    value.preflight_summary_version !== sourceInputPreflightSummaryVersion
  ) {
    errors.push("snapshot preflight summary version is unsupported");
  }
  if (value.mode !== "source-input-preflight") {
    errors.push("snapshot preflight summary mode is unsupported");
  }
  if (value.status !== "passed" && value.status !== "failed") {
    errors.push("snapshot preflight summary status is unsupported");
  }
  if (!isSha256(value.source_input_hash)) {
    errors.push("snapshot preflight summary source_input_hash must be a sha256 hash");
  }
  for (const marker of collectUnsafeCodexFormerLocalAdapterSourceInputMarkers(
    value,
  )) {
    errors.push(
      `snapshot preflight summary contains unsafe marker category at ${marker.path}: ${marker.marker_kind}`,
    );
  }
  return { valid: errors.length === 0, errors };
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 0;
}

function isBoundedRefOrNull(value: unknown): value is string | null {
  return (
    value === null ||
    (typeof value === "string" &&
      value.length > 0 &&
      value.length <= 200 &&
      !/[\r\n]/.test(value))
  );
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
  CODEX_FORMER_LOCAL_ADAPTER_INBOX_ITEM_SNAPSHOT_VERSION,
  CODEX_FORMER_LOCAL_ADAPTER_SESSION_PANEL_SNAPSHOT_VERSION,
  CODEX_FORMER_LOCAL_ADAPTER_SURFACE_SNAPSHOT_SUMMARY_VERSION,
  buildCodexFormerLocalAdapterInboxItemSnapshot,
  buildCodexFormerLocalAdapterSessionPanelSnapshot,
  buildCodexFormerLocalAdapterSurfaceSnapshots,
  hashCodexFormerLocalAdapterSnapshotContent,
  stableStringifyCodexFormerLocalAdapterSnapshotJson,
  validateCodexFormerLocalAdapterSurfaceSnapshotInputs,
};
