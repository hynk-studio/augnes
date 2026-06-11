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

export type CodexFormerLocalAdapterSnapshotState = "not_ready" | "waiting";
export type CodexFormerLocalAdapterSessionScenarioId =
  | "not-prepared"
  | "waiting-for-candidate";
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
    label: "Not ready";
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
  preflight_status: "passed" | "failed" | null;
  session_panel_snapshot_path: string;
  inbox_item_snapshot_path: string;
  authority_flags: ReturnType<typeof buildFalseAuthorityFlags>;
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
    preflight_status: input.preflightSummary?.status ?? null,
    session_panel_snapshot_path: input.sessionPanelSnapshotPath,
    inbox_item_snapshot_path: input.inboxItemSnapshotPath,
    authority_flags: buildFalseAuthorityFlags(),
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
