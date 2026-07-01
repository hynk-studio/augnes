import type { AutonomyRunnerPreflightPreviewForWeb } from "@/lib/autonomy/read-autonomy-runner-preflight-for-web";
import type {
  AutonomyDryRunPlan,
  AutonomyRunnerAuthorityBoundary,
  AutonomyRunnerPreflight,
} from "@/types/autonomy-runner";

export const AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_VERSION =
  "autonomy_runner_preflight_copy_export.v0.1" as const;

export const AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_KIND =
  "autonomy_runner_preflight_copy_export_preview" as const;

export const AUTONOMY_RUNNER_PREFLIGHT_COPY_FINGERPRINT_ALGORITHM =
  "fnv1a-32-canonical-json-v0.1" as const;

export const AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_TITLES = {
  preflight_markdown: "Preflight Markdown",
  dry_run_plan_markdown: "Dry-Run Plan Markdown",
  readiness_checklist_markdown: "Readiness Checklist",
  combined_review_packet_markdown: "Combined Review Packet",
  bounded_json_preview: "Bounded JSON Preview",
} as const;

export type AutonomyRunnerPreflightCopyPacketMode =
  keyof typeof AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_TITLES;

export type AutonomyRunnerPreflightCopyBoundary = {
  read_only: true;
  preview_only: true;
  copy_manual_copy_only: true;
  local_clipboard_only: true;
  file_download_created: false;
  exported_to_disk: false;
  files_written: false;
  external_posted: false;
  external_sent: false;
  published: false;
  runner_started: false;
  scheduler_started: false;
  daemon_started: false;
  background_work_started: false;
  codex_executed: false;
  github_called: false;
  provider_called: false;
  db_written: false;
  proof_evidence_written: false;
  memory_mutated: false;
  perspective_applied: false;
  handoff_sent: false;
  branch_pr_created: false;
  auto_apply_performed: false;
  budget_spent: false;
  external_side_effect_created: false;
  no_run_boundary_notes: string[];
};

export type AutonomyRunnerPreflightCopyPacket = {
  mode: AutonomyRunnerPreflightCopyPacketMode;
  title: (typeof AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_TITLES)[AutonomyRunnerPreflightCopyPacketMode];
  media_type: "text/markdown" | "application/json";
  text: string;
  character_count: number;
};

export type AutonomyRunnerPreflightCopyInputSummary = {
  scope: string;
  preflight_id: string;
  source_contract_id: string;
  readiness: AutonomyRunnerPreflight["readiness"];
  blocker_count: number;
  warning_count: number;
  planned_step_count: number;
  planned_read_source_count: number;
  blocked_step_count: number;
  required_precondition_count: number;
  required_check_count: number;
  route_ref_count: number;
  docs_ref_count: number;
  source_status: AutonomyRunnerPreflightPreviewForWeb["source_status"];
};

export type AutonomyRunnerPreflightJsonPreview = {
  packet_kind: typeof AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_KIND;
  packet_version: typeof AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_VERSION;
  packet_fingerprint_algorithm: typeof AUTONOMY_RUNNER_PREFLIGHT_COPY_FINGERPRINT_ALGORITHM;
  source: "Autonomy Runner Preflight preview";
  packet_input_summary: AutonomyRunnerPreflightCopyInputSummary;
  copy_boundary: AutonomyRunnerPreflightCopyBoundary;
  copy_boundary_statement: string[];
  source_caveat: string;
  route_refs: string[];
  docs_refs: string[];
  source_status: AutonomyRunnerPreflightPreviewForWeb["source_status"];
  preflight: {
    runtime: "augnes";
    preflight_version: AutonomyRunnerPreflight["preflight_version"];
    scope: string;
    preflight_id: string;
    created_at: string;
    source_contract_id: string;
    source_contract_version: string;
    readiness: AutonomyRunnerPreflight["readiness"];
    readiness_summary: string;
    contract_status: string;
    autonomy_mode: string;
    blockers: AutonomyRunnerPreflight["blockers"];
    warnings: AutonomyRunnerPreflight["warnings"];
    required_user_judgment: string[];
    required_operator_review: string[];
    assessments: {
      budget: AutonomyRunnerPreflight["budget_assessment"];
      action_scope: AutonomyRunnerPreflight["action_scope_assessment"];
      delta_merge: AutonomyRunnerPreflight["delta_merge_assessment"];
      review_escalation: AutonomyRunnerPreflight["review_escalation_assessment"];
      stop_condition: AutonomyRunnerPreflight["stop_condition_assessment"];
      staleness: AutonomyRunnerPreflight["staleness_assessment"];
      authority: AutonomyRunnerPreflight["authority_assessment"];
    };
    source_refs: AutonomyRunnerPreflight["source_refs"];
    authority_boundary: AutonomyRunnerAuthorityBoundary;
    public_safety: AutonomyRunnerPreflight["public_safety"];
    next_phase_notes: string[];
  };
  dry_run_plan: AutonomyDryRunPlan;
  no_executable_commands: true;
  public_safe_text_only: true;
};

export type AutonomyRunnerPreflightCopyPackets = {
  packet_kind: typeof AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_KIND;
  packet_version: typeof AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_VERSION;
  packet_fingerprint_algorithm: typeof AUTONOMY_RUNNER_PREFLIGHT_COPY_FINGERPRINT_ALGORITHM;
  packet_fingerprint: string;
  packet_input_summary: AutonomyRunnerPreflightCopyInputSummary;
  copy_boundary: AutonomyRunnerPreflightCopyBoundary;
  preflight_markdown: string;
  dry_run_plan_markdown: string;
  readiness_checklist_markdown: string;
  combined_review_packet_markdown: string;
  bounded_json_preview: AutonomyRunnerPreflightJsonPreview;
  bounded_json_text: string;
  packets: AutonomyRunnerPreflightCopyPacket[];
  character_counts: Record<AutonomyRunnerPreflightCopyPacketMode, number>;
};

const COPY_BOUNDARY_STATEMENT = [
  "Local text copy/manual-copy preview only.",
  "Clipboard copy, when available, is local-only.",
  "No file download/export-to-disk.",
  "No object-URL transfer, binary download payload, save-as, or anchor download behavior.",
  "No external post, send, publish, merge, retry, replay, or deploy.",
  "No runner starts.",
  "No scheduler starts.",
  "No daemon starts.",
  "No background work starts.",
  "No Codex execution.",
  "No GitHub/provider/OpenAI call.",
  "No DB write.",
  "No proof/evidence write.",
  "No memory mutation.",
  "No durable Perspective apply.",
  "No handoff send.",
  "No branch/PR creation.",
  "No auto-apply.",
  "No budget spend.",
  "No external side effect.",
  "Phase 9F is not approval to run.",
  "Autonomy Runner Preflight remains planning context only.",
  "Autonomy Dry-Run Plan remains preview context only.",
] as const;

const SOURCE_CAVEAT =
  "Source composition remains preview/operator-supplied unless a later approved phase says otherwise.";

export function buildAutonomyRunnerPreflightMarkdown(
  preview: AutonomyRunnerPreflightPreviewForWeb,
): string {
  const preflight = preview.preflight;

  return normalizeCopyText(
    [
      "# Autonomy Runner Preflight Markdown",
      "",
      ...formatHeader(preview),
      "",
      "## Readiness",
      `- readiness: ${preflight.readiness}`,
      `- readiness_summary: ${preflight.readiness_summary}`,
      `- contract_status: ${preflight.contract_status}`,
      `- autonomy_mode: ${preflight.autonomy_mode}`,
      "",
      "## Blockers",
      ...formatBlockers(preflight),
      "",
      "## Warnings",
      ...formatWarnings(preflight),
      "",
      "## Required Judgment And Review",
      ...formatNamedList("required_user_judgment", preflight.required_user_judgment),
      ...formatNamedList(
        "required_operator_review",
        preflight.required_operator_review,
      ),
      "",
      "## Assessments",
      ...formatAssessments(preflight),
      "",
      "## Source Refs",
      ...formatSourceRefs(preflight.source_refs),
      "",
      "## Authority Boundary",
      ...formatAuthorityBoundary(preflight.authority_boundary),
      "",
      "## Public Safety",
      ...formatObjectEntries(preflight.public_safety),
      "",
      "## Copy / Manual-Copy Boundary",
      ...formatCopyBoundary(),
    ].join("\n"),
  );
}

export function buildAutonomyDryRunPlanMarkdown(
  preview: AutonomyRunnerPreflightPreviewForWeb,
): string {
  const plan = preview.dry_run_plan;

  return normalizeCopyText(
    [
      "# Autonomy Dry-Run Plan Markdown",
      "",
      ...formatHeader(preview),
      "",
      "## Dry-Run Plan",
      `- dry_run_version: ${plan.dry_run_version}`,
      `- dry_run_id: ${plan.dry_run_id}`,
      `- source_contract_id: ${plan.source_contract_id}`,
      `- status: ${plan.status}`,
      "- dry_run_only is preserved.",
      "- Every planned step preserves would_execute: false.",
      "",
      "## Planned Read Sources",
      ...formatNamedList("planned_read_source", plan.planned_read_sources),
      "",
      "## Planned Steps",
      ...formatPlannedSteps(plan),
      "",
      "## Blocked Steps",
      ...formatNamedList("blocked_step", plan.blocked_steps),
      "",
      "## Required Preconditions",
      ...formatNamedList("required_precondition", plan.required_preconditions),
      "",
      "## Required Checks",
      ...formatNamedList("required_check", plan.required_checks),
      "",
      "## Stop Conditions",
      ...formatNamedList("stop_condition", plan.stop_conditions),
      "",
      "## Budget Projection",
      ...formatObjectEntries(plan.budget_projection),
      "",
      "## No-Run Boundary",
      ...formatAuthorityBoundary(plan.no_run_boundary),
      "",
      "## Copy / Manual-Copy Boundary",
      ...formatCopyBoundary(),
    ].join("\n"),
  );
}

export function buildAutonomyRunnerReadinessChecklistMarkdown(
  preview: AutonomyRunnerPreflightPreviewForWeb,
): string {
  const preflight = preview.preflight;
  const plan = preview.dry_run_plan;

  return normalizeCopyText(
    [
      "# Runner Readiness Checklist",
      "",
      ...formatHeader(preview),
      "",
      "## Interpretation",
      "- Preflight is not approval to run.",
      "- Dry-run plan is not execution permission.",
      "- Readiness is not authorization.",
      "- ready_for_future_supervised_runner means future supervised review only.",
      "- not_supported must be treated as blocked planning context.",
      "- dry_run_only must be preserved.",
      "- Every planned step must preserve would_execute: false.",
      "",
      "## Readiness",
      `- readiness: ${preflight.readiness}`,
      `- readiness_summary: ${preflight.readiness_summary}`,
      "",
      "## Blocker Checklist",
      ...formatBlockers(preflight),
      "",
      "## Warning Checklist",
      ...formatWarnings(preflight),
      "",
      "## Required Review",
      ...formatNamedList("required_user_judgment", preflight.required_user_judgment),
      ...formatNamedList(
        "required_operator_review",
        preflight.required_operator_review,
      ),
      "",
      "## Preconditions And Checks",
      ...formatNamedList("required_precondition", plan.required_preconditions),
      ...formatNamedList("required_check", plan.required_checks),
      "",
      "## Budget / Action / Delta / Review / Stop / Staleness / Authority",
      ...formatAssessments(preflight),
      "",
      "## Copy / Manual-Copy Boundary",
      ...formatCopyBoundary(),
    ].join("\n"),
  );
}

export function buildAutonomyRunnerReviewPacketMarkdown(
  preview: AutonomyRunnerPreflightPreviewForWeb,
): string {
  return normalizeCopyText(
    [
      "# Autonomy Runner Preflight Review Packet",
      "",
      "## Review Boundary",
      "- This is a local text/manual-copy preview packet.",
      "- It is not approval to run.",
      "- It does not download files or export to disk.",
      "- It does not send, post, publish, persist, apply, schedule, launch, or execute anything.",
      "",
      buildAutonomyRunnerPreflightMarkdown(preview),
      "",
      "---",
      "",
      buildAutonomyDryRunPlanMarkdown(preview),
      "",
      "---",
      "",
      buildAutonomyRunnerReadinessChecklistMarkdown(preview),
      "",
      "---",
      "",
      "## Route / Source Status",
      ...formatSourceStatus(preview),
      "",
      "## Route Notes",
      ...formatNamedList("route_note", preview.route_notes),
      "",
      "## Fallback Reasons",
      ...formatNamedList("fallback_reason", preview.fallback_reasons),
    ].join("\n"),
  );
}

export function buildAutonomyRunnerPreflightJsonPreview(
  preview: AutonomyRunnerPreflightPreviewForWeb,
): AutonomyRunnerPreflightJsonPreview {
  const preflight = preview.preflight;
  const dryRunPlan = normalizeDryRunPlan(preview.dry_run_plan);

  return {
    packet_kind: AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_KIND,
    packet_version: AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_VERSION,
    packet_fingerprint_algorithm:
      AUTONOMY_RUNNER_PREFLIGHT_COPY_FINGERPRINT_ALGORITHM,
    source: "Autonomy Runner Preflight preview",
    packet_input_summary: buildAutonomyRunnerPreflightCopyInputSummary(preview),
    copy_boundary: buildAutonomyRunnerPreflightCopyBoundary(),
    copy_boundary_statement: [...COPY_BOUNDARY_STATEMENT],
    source_caveat: SOURCE_CAVEAT,
    route_refs: [...preview.route_refs],
    docs_refs: [...preview.docs_refs],
    source_status: preview.source_status,
    preflight: {
      runtime: preflight.runtime,
      preflight_version: preflight.preflight_version,
      scope: preflight.scope,
      preflight_id: preflight.preflight_id,
      created_at: preflight.created_at,
      source_contract_id: preflight.source_contract_id,
      source_contract_version: preflight.source_contract_version,
      readiness: preflight.readiness,
      readiness_summary: preflight.readiness_summary,
      contract_status: String(preflight.contract_status),
      autonomy_mode: String(preflight.autonomy_mode),
      blockers: preflight.blockers,
      warnings: preflight.warnings,
      required_user_judgment: [...preflight.required_user_judgment],
      required_operator_review: [...preflight.required_operator_review],
      assessments: {
        budget: preflight.budget_assessment,
        action_scope: preflight.action_scope_assessment,
        delta_merge: preflight.delta_merge_assessment,
        review_escalation: preflight.review_escalation_assessment,
        stop_condition: preflight.stop_condition_assessment,
        staleness: preflight.staleness_assessment,
        authority: preflight.authority_assessment,
      },
      source_refs: preflight.source_refs,
      authority_boundary: preflight.authority_boundary,
      public_safety: normalizePublicSafety(preflight.public_safety),
      next_phase_notes: [...preflight.next_phase_notes],
    },
    dry_run_plan: dryRunPlan,
    no_executable_commands: true,
    public_safe_text_only: true,
  };
}

export function buildAutonomyRunnerPreflightCopyPackets(
  preview: AutonomyRunnerPreflightPreviewForWeb,
): AutonomyRunnerPreflightCopyPackets {
  const preflightMarkdown = buildAutonomyRunnerPreflightMarkdown(preview);
  const dryRunPlanMarkdown = buildAutonomyDryRunPlanMarkdown(preview);
  const readinessChecklistMarkdown =
    buildAutonomyRunnerReadinessChecklistMarkdown(preview);
  const combinedReviewPacketMarkdown =
    buildAutonomyRunnerReviewPacketMarkdown(preview);
  const boundedJsonPreview = buildAutonomyRunnerPreflightJsonPreview(preview);
  const boundedJsonText = canonicalJsonStringify(boundedJsonPreview);
  const packets: AutonomyRunnerPreflightCopyPacket[] = [
    buildPacket("preflight_markdown", "text/markdown", preflightMarkdown),
    buildPacket("dry_run_plan_markdown", "text/markdown", dryRunPlanMarkdown),
    buildPacket(
      "readiness_checklist_markdown",
      "text/markdown",
      readinessChecklistMarkdown,
    ),
    buildPacket(
      "combined_review_packet_markdown",
      "text/markdown",
      combinedReviewPacketMarkdown,
    ),
    buildPacket("bounded_json_preview", "application/json", boundedJsonText),
  ];
  const packetInputSummary =
    buildAutonomyRunnerPreflightCopyInputSummary(preview);
  const copyBoundary = buildAutonomyRunnerPreflightCopyBoundary();
  const packetFingerprint = buildCopyPacketFingerprint({
    packet_kind: AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_KIND,
    packet_version: AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_VERSION,
    packet_input_summary: packetInputSummary,
    copy_boundary: copyBoundary,
  });

  return {
    packet_kind: AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_KIND,
    packet_version: AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_VERSION,
    packet_fingerprint_algorithm:
      AUTONOMY_RUNNER_PREFLIGHT_COPY_FINGERPRINT_ALGORITHM,
    packet_fingerprint: packetFingerprint,
    packet_input_summary: packetInputSummary,
    copy_boundary: copyBoundary,
    preflight_markdown: preflightMarkdown,
    dry_run_plan_markdown: dryRunPlanMarkdown,
    readiness_checklist_markdown: readinessChecklistMarkdown,
    combined_review_packet_markdown: combinedReviewPacketMarkdown,
    bounded_json_preview: boundedJsonPreview,
    bounded_json_text: boundedJsonText,
    packets,
    character_counts: {
      preflight_markdown: preflightMarkdown.length,
      dry_run_plan_markdown: dryRunPlanMarkdown.length,
      readiness_checklist_markdown: readinessChecklistMarkdown.length,
      combined_review_packet_markdown: combinedReviewPacketMarkdown.length,
      bounded_json_preview: boundedJsonText.length,
    },
  };
}

export function buildAutonomyRunnerPreflightCopyBoundary(): AutonomyRunnerPreflightCopyBoundary {
  return {
    read_only: true,
    preview_only: true,
    copy_manual_copy_only: true,
    local_clipboard_only: true,
    file_download_created: false,
    exported_to_disk: false,
    files_written: false,
    external_posted: false,
    external_sent: false,
    published: false,
    runner_started: false,
    scheduler_started: false,
    daemon_started: false,
    background_work_started: false,
    codex_executed: false,
    github_called: false,
    provider_called: false,
    db_written: false,
    proof_evidence_written: false,
    memory_mutated: false,
    perspective_applied: false,
    handoff_sent: false,
    branch_pr_created: false,
    auto_apply_performed: false,
    budget_spent: false,
    external_side_effect_created: false,
    no_run_boundary_notes: [...COPY_BOUNDARY_STATEMENT],
  };
}

export function buildAutonomyRunnerPreflightCopyInputSummary(
  preview: AutonomyRunnerPreflightPreviewForWeb,
): AutonomyRunnerPreflightCopyInputSummary {
  return {
    scope: preview.preflight.scope,
    preflight_id: preview.preflight.preflight_id,
    source_contract_id: preview.preflight.source_contract_id,
    readiness: preview.preflight.readiness,
    blocker_count: preview.preflight.blockers.length,
    warning_count: preview.preflight.warnings.length,
    planned_step_count: preview.dry_run_plan.planned_steps.length,
    planned_read_source_count: preview.dry_run_plan.planned_read_sources.length,
    blocked_step_count: preview.dry_run_plan.blocked_steps.length,
    required_precondition_count:
      preview.dry_run_plan.required_preconditions.length,
    required_check_count: preview.dry_run_plan.required_checks.length,
    route_ref_count: preview.route_refs.length,
    docs_ref_count: preview.docs_refs.length,
    source_status: preview.source_status,
  };
}

function buildPacket(
  mode: AutonomyRunnerPreflightCopyPacketMode,
  mediaType: AutonomyRunnerPreflightCopyPacket["media_type"],
  text: string,
): AutonomyRunnerPreflightCopyPacket {
  return {
    mode,
    title: AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_TITLES[mode],
    media_type: mediaType,
    text,
    character_count: text.length,
  };
}

function formatHeader(preview: AutonomyRunnerPreflightPreviewForWeb): string[] {
  const preflight = preview.preflight;

  return [
    `- packet_version: ${AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_VERSION}`,
    `- preflight_version: ${preflight.preflight_version}`,
    `- dry_run_version: ${preview.dry_run_plan.dry_run_version}`,
    `- scope: ${preflight.scope}`,
    `- preflight_id: ${preflight.preflight_id}`,
    `- dry_run_id: ${preview.dry_run_plan.dry_run_id}`,
    `- source_contract_id: ${preflight.source_contract_id}`,
    `- source: ${preview.source_status.source}`,
    `- source_caveat: ${SOURCE_CAVEAT}`,
  ];
}

function formatBlockers(preflight: AutonomyRunnerPreflight): string[] {
  if (preflight.blockers.length === 0) return ["- blocker: none"];

  return preflight.blockers.map(
    (blocker) =>
      `- blocker: ${blocker.blocker_id}; kind=${blocker.kind}; summary=${blocker.summary}; recovery_hint=${blocker.recovery_hint}`,
  );
}

function formatWarnings(preflight: AutonomyRunnerPreflight): string[] {
  if (preflight.warnings.length === 0) return ["- warning: none"];

  return preflight.warnings.map(
    (warning) =>
      `- warning: ${warning.warning_id}; kind=${warning.kind}; severity=${warning.severity}; summary=${warning.summary}; review_hint=${warning.review_hint}`,
  );
}

function formatAssessments(preflight: AutonomyRunnerPreflight): string[] {
  return [
    `- budget: ${preflight.budget_assessment.status}; ${preflight.budget_assessment.summary}`,
    `- action_scope: ${preflight.action_scope_assessment.status}; ${preflight.action_scope_assessment.summary}`,
    `- delta_merge: ${preflight.delta_merge_assessment.status}; ${preflight.delta_merge_assessment.summary}`,
    `- review_escalation: ${preflight.review_escalation_assessment.status}; ${preflight.review_escalation_assessment.summary}`,
    `- stop_condition: ${preflight.stop_condition_assessment.status}; ${preflight.stop_condition_assessment.summary}`,
    `- staleness: ${preflight.staleness_assessment.status}; ${preflight.staleness_assessment.summary}`,
    `- authority: ${preflight.authority_assessment.status}; ${preflight.authority_assessment.summary}`,
  ];
}

function formatPlannedSteps(plan: AutonomyDryRunPlan): string[] {
  if (plan.planned_steps.length === 0) return ["- planned_step: none"];

  return plan.planned_steps.flatMap((step) => [
    `- planned_step: ${step.step_id}`,
    `  title: ${step.title}`,
    `  summary: ${step.summary}`,
    `  action_kind: ${step.action_kind}`,
    `  allowed_by_contract: ${String(step.allowed_by_contract)}`,
    `  blocked_by: ${step.blocked_by.join(", ") || "none"}`,
    `  source_refs: ${step.source_refs.join(", ") || "none"}`,
    `  expected_output: ${step.expected_output}`,
    `  would_require_review: ${String(step.would_require_review)}`,
    "  would_execute: false",
  ]);
}

function formatSourceRefs(sourceRefs: object): string[] {
  return Object.entries(sourceRefs)
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0
          ? value.map((item) => `- ${key}: ${String(item)}`)
          : [`- ${key}: none`];
      }

      return [`- ${key}: ${String(value)}`];
    });
}

function formatSourceStatus(
  preview: AutonomyRunnerPreflightPreviewForWeb,
): string[] {
  return [
    `- source: ${preview.source_status.source}`,
    `- autonomy_contract: ${preview.source_status.autonomy_contract}`,
    `- autonomy_runner_preflight: ${preview.source_status.autonomy_runner_preflight}`,
    `- dry_run_plan: ${preview.source_status.dry_run_plan}`,
    `- source_disclosure: ${preview.source_status.source_disclosure}`,
    `- synthetic_operator_supplied_fields: ${preview.source_status.synthetic_operator_supplied_fields.join(", ") || "none"}`,
    `- source_caveat: ${SOURCE_CAVEAT}`,
  ];
}

function formatAuthorityBoundary(boundary: AutonomyRunnerAuthorityBoundary): string[] {
  return Object.entries(boundary)
    .filter(([key]) => key !== "notes")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `- ${key}: ${String(value)}`)
    .concat(boundary.notes.map((note) => `- note: ${note}`));
}

function formatCopyBoundary(): string[] {
  return COPY_BOUNDARY_STATEMENT.map((item) => `- ${item}`);
}

function formatNamedList(label: string, values: string[]): string[] {
  if (values.length === 0) return [`- ${label}: none`];
  return values.map((value) => `- ${label}: ${value}`);
}

function formatObjectEntries(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    return [`- value: ${String(value)}`];
  }

  return Object.entries(value as Record<string, unknown>)
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([key, entry]) => {
      if (Array.isArray(entry)) {
        return entry.length > 0
          ? entry.map((item) => `- ${key}: ${String(item)}`)
          : [`- ${key}: none`];
      }

      return [`- ${key}: ${String(entry)}`];
    });
}

function normalizeDryRunPlan(plan: AutonomyDryRunPlan): AutonomyDryRunPlan {
  return {
    ...plan,
    status: "dry_run_only",
    planned_steps: plan.planned_steps.map((step) => ({
      ...step,
      would_execute: false,
    })),
    budget_projection: {
      ...plan.budget_projection,
      would_spend_budget: false,
    },
  };
}

function normalizePublicSafety(
  publicSafety: AutonomyRunnerPreflight["public_safety"],
): AutonomyRunnerPreflight["public_safety"] {
  return {
    ...publicSafety,
    contains_private_conversation: false,
    contains_hidden_reasoning: false,
    contains_local_private_paths: false,
    contains_secrets_or_tokens: false,
    contains_raw_provider_output: false,
    contains_raw_retrieval_output: false,
    contains_real_account_artifacts: false,
  };
}

function buildCopyPacketFingerprint(input: unknown): string {
  const text = canonicalJsonStringify(input);
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function canonicalJsonStringify(value: unknown): string {
  return JSON.stringify(sortForJson(value), null, 2);
}

function sortForJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortForJson);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, sortForJson(entry)]),
  );
}

function normalizeCopyText(input: string): string {
  return input.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
