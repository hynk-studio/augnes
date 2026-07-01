import type { AutonomyContractPreviewForWeb } from "@/lib/autonomy/read-autonomy-contract-for-web";

export const AUTONOMY_COPY_EXPORT_PACKET_VERSION =
  "autonomy_copy_export.v0.1" as const;
export const AUTONOMY_COPY_EXPORT_PACKET_KIND =
  "autonomy_contract_copy_export_preview" as const;
export const AUTONOMY_COPY_EXPORT_FINGERPRINT_ALGORITHM =
  "fnv1a-32-canonical-json-v0.1" as const;

export type AutonomyCopyExportMode =
  | "autonomy_contract_markdown"
  | "budget_summary_markdown"
  | "review_escalation_checklist_markdown"
  | "combined_review_packet_markdown"
  | "json_preview";

export type AutonomyCopyExportBoundaryFlags = {
  local_clipboard_only: true;
  external_posted: false;
  autonomy_ran: false;
  autonomy_scheduled: false;
  daemon_started: false;
  background_work_started: false;
  codex_executed: false;
  codex_launched: false;
  github_called: false;
  provider_called: false;
  proof_evidence_written: false;
  db_written: false;
  state_mutated: false;
  handoff_sent: false;
  branch_pr_created: false;
  copy_persisted: false;
  budget_spent: false;
  auto_apply_performed: false;
};

export type AutonomyCopyExportInputSummary = {
  scope: string;
  contract_id: string;
  contract_version: string;
  status: string;
  autonomy_mode: string;
  source_status: AutonomyContractPreviewForWeb["source_status"];
  fallback_reason_count: number;
  warning_count: number;
  gap_count: number;
  allowed_action_count: number;
  forbidden_action_count: number;
  stop_condition_count: number;
  review_escalation_trigger_count: number;
  validation_required_check_count: number;
  route_ref_count: number;
  docs_ref_count: number;
};

export type AutonomyCopyExportJsonPacket = {
  packet_kind: typeof AUTONOMY_COPY_EXPORT_PACKET_KIND;
  packet_version: typeof AUTONOMY_COPY_EXPORT_PACKET_VERSION;
  packet_fingerprint_algorithm: typeof AUTONOMY_COPY_EXPORT_FINGERPRINT_ALGORITHM;
  source: "Autonomy Contract preview";
  scope: string;
  contract_id: string;
  contract_version: string;
  status: string;
  autonomy_mode: string;
  title: string;
  goal: string;
  bounded_context_summary: string;
  packet_input_summary: AutonomyCopyExportInputSummary;
  source_status: AutonomyContractPreviewForWeb["source_status"];
  fallback_reasons: string[];
  warnings: string[];
  gaps: string[];
  public_safety: AutonomyContractPreviewForWeb["public_safety"];
  route_refs: string[];
  docs_refs: string[];
  source_refs: unknown;
  guide_brief_refs: string[];
  handoff_capsule_refs: string[];
  codex_launch_card_refs: string[];
  current_working_perspective_refs: string[];
  delta_projection_refs: string[];
  allowed_agents: string[];
  allowed_surfaces: string[];
  allowed_actions: string[];
  forbidden_actions: string[];
  budget: unknown;
  reporting_cadence: unknown;
  stop_conditions: unknown[];
  delta_merge_policy: unknown;
  review_escalation_policy: unknown;
  output_policy: unknown;
  staleness_policy: unknown;
  validation_policy: unknown;
  run_preview: unknown;
  authority_boundary_summary: string[];
  route_read_boundary_notes: string[];
  auto_apply_allowed: false;
  auto_apply_targets: [];
  run_preview_status: "preview_only";
  budget_is_not_spend_permission: true;
  allowed_actions_are_not_commands: true;
  autonomy_run_preview_is_not_execution: true;
  no_runner_scheduler_daemon_background_work_exists: true;
  phase_9_runner_requires_separate_explicit_scope_and_approval: true;
  copy_export_boundary_statement: string[];
  boundary_flags: AutonomyCopyExportBoundaryFlags;
};

export type AutonomyCopyExportPreview = {
  packet_kind: typeof AUTONOMY_COPY_EXPORT_PACKET_KIND;
  packet_version: typeof AUTONOMY_COPY_EXPORT_PACKET_VERSION;
  packet_fingerprint_algorithm: typeof AUTONOMY_COPY_EXPORT_FINGERPRINT_ALGORITHM;
  packet_fingerprint: string;
  packet_input_summary: AutonomyCopyExportInputSummary;
  boundary_flags: AutonomyCopyExportBoundaryFlags;
  autonomy_contract_markdown: string;
  budget_summary_markdown: string;
  review_escalation_checklist_markdown: string;
  combined_review_packet_markdown: string;
  json_preview: AutonomyCopyExportJsonPacket;
  json_text: string;
  character_counts: Record<AutonomyCopyExportMode, number>;
};

const COPY_EXPORT_BOUNDARY_STATEMENT = [
  "Local clipboard/manual copy preview only.",
  "Copying does not run autonomy.",
  "Copying does not schedule autonomy.",
  "Copying does not start a daemon.",
  "Copying does not start background work.",
  "Copying does not launch Codex.",
  "Copying does not execute Codex.",
  "Copying does not send a handoff.",
  "Copying does not create a branch or PR.",
  "Copying does not call GitHub.",
  "Copying does not call OpenAI/provider APIs.",
  "Copying does not write DB records.",
  "Copying does not write proof/evidence.",
  "Copying does not mutate memory/state/work/Perspective.",
  "Copying does not apply durable memory or project Perspective.",
  "Copying does not publish, merge, retry, replay, deploy, or externally post.",
  "Copying does not spend budget.",
  "Copying does not auto-apply deltas.",
  "Copying is not approval, proof, evidence, merge authority, launch authority, run authority, budget approval, or source-of-truth state.",
  "Copied text may become stale; re-copy before use if source/fallback status changes.",
] as const;

export function buildAutonomyContractMarkdownCopyPacket(
  preview: AutonomyContractPreviewForWeb,
): string {
  const contract = preview.contract;
  const lines = [
    "# Autonomy Contract Copy Packet",
    "",
    ...formatPacketHeader(preview),
    "",
    "## Contract",
    `- contract_id: ${contract.contract_id}`,
    `- contract_version: ${contract.contract_version}`,
    `- status: ${contract.status}`,
    `- autonomy_mode: ${contract.autonomy_mode}`,
    `- title: ${contract.title}`,
    `- goal: ${contract.goal}`,
    `- bounded_context_summary: ${contract.bounded_context_summary}`,
    "",
    "## Source Refs",
    ...formatAutonomySourceRefsForCopy(preview),
    "",
    "## Agents And Surfaces",
    ...formatNamedList("allowed_agent", contract.allowed_agents),
    ...formatNamedList("allowed_surface", contract.allowed_surfaces),
    "",
    "## Allowed Actions",
    "- Allowed actions are not commands.",
    ...formatNamedList("allowed_action", contract.allowed_actions),
    "",
    "## Forbidden Actions",
    ...formatNamedList("forbidden_action", contract.forbidden_actions),
    "",
    "## Public Safety",
    ...formatObjectForCopy(contract.public_safety),
    "",
    "## Warnings And Gaps",
    ...formatNamedList("warning", preview.warnings),
    ...formatNamedList("gap", preview.gaps),
    "",
    "## Authority Boundary",
    ...formatAutonomyAuthorityBoundaryForCopy(contract.authority_boundary),
    "",
    "## Route / Read Boundary Notes",
    ...formatList(preview.boundary_notes),
    "",
    "## Copy / Export Boundary",
    ...formatCopyExportBoundaryForCopy(),
  ];

  return normalizeAutonomyCopyText(lines.join("\n"));
}

export function buildAutonomyBudgetMarkdownCopyPacket(
  preview: AutonomyContractPreviewForWeb,
): string {
  return normalizeAutonomyCopyText(
    [
      "# Autonomy Budget Summary Copy Packet",
      "",
      ...formatPacketHeader(preview),
      "",
      "## Budget Summary",
      ...formatAutonomyBudgetForCopy(preview),
      "",
      "## Budget Boundary",
      "- Budget is boundary only.",
      "- Budget is not spend permission.",
      "- Missing budget blocks future autonomy.",
      "- Phase 8F does not charge, call providers, execute tools, run background work, spend budget, or auto-apply deltas.",
      "",
      "## Copy / Export Boundary",
      ...formatCopyExportBoundaryForCopy(),
    ].join("\n"),
  );
}

export function buildAutonomyReviewEscalationChecklistMarkdown(
  preview: AutonomyContractPreviewForWeb,
): string {
  return normalizeAutonomyCopyText(
    [
      "# Autonomy Review Escalation Checklist Copy Packet",
      "",
      ...formatPacketHeader(preview),
      "",
      "## Review Escalation Policy",
      ...formatAutonomyReviewEscalationForCopy(preview),
      "",
      "## Stop Conditions",
      ...formatAutonomyStopConditionsForCopy(preview),
      "",
      "## Delta Merge Policy",
      ...formatAutonomyDeltaMergePolicyForCopy(preview),
      "",
      "## Required Checks",
      ...formatNamedList(
        "required_check",
        preview.contract.validation_policy.required_checks,
      ),
      "",
      "## Checklist Boundary",
      "- Review escalation triggers are surfaced, not decided by this copied packet.",
      "- Unresolved user judgment remains unresolved.",
      "- Durable memory and project Perspective require review.",
      "- Proof/evidence write, external publication, GitHub actuation, provider call, branch/PR creation, and durable apply without review remain blocked.",
      "",
      "## Copy / Export Boundary",
      ...formatCopyExportBoundaryForCopy(),
    ].join("\n"),
  );
}

export function buildCombinedAutonomyReviewPacketMarkdown(
  preview: AutonomyContractPreviewForWeb,
): string {
  return normalizeAutonomyCopyText(
    [
      "# Autonomy Contract Review Packet",
      "",
      "## Review Boundary",
      "- This is a local clipboard/manual-copy preview packet.",
      "- Autonomy Contract is planning boundary context only.",
      "- Budget is boundary only and not spend permission.",
      "- Allowed actions are not commands.",
      "- AutonomyRunPreview is not execution.",
      "- No runner/scheduler/daemon/background work exists.",
      "- Phase 9 runner requires separate explicit scope and approval.",
      "- `auto_apply_allowed` remains false.",
      "- `auto_apply_targets` remains empty.",
      "",
      buildAutonomyContractMarkdownCopyPacket(preview),
      "",
      "---",
      "",
      buildAutonomyBudgetMarkdownCopyPacket(preview),
      "",
      "---",
      "",
      buildAutonomyReviewEscalationChecklistMarkdown(preview),
      "",
      "---",
      "",
      "## Run Preview",
      ...formatAutonomyRunPreviewForCopy(preview),
      "",
      "## Reporting Cadence",
      ...formatObjectForCopy(preview.contract.reporting_cadence),
      "",
      "## Output Policy",
      ...formatObjectForCopy(preview.contract.output_policy),
      "",
      "## Staleness Policy",
      ...formatObjectForCopy(preview.contract.staleness_policy),
      "",
      "## Validation Policy",
      ...formatObjectForCopy(preview.contract.validation_policy),
    ].join("\n"),
  );
}

export function buildAutonomyCopyExportJsonPacket(
  preview: AutonomyContractPreviewForWeb,
): AutonomyCopyExportJsonPacket {
  const contract = preview.contract;

  return {
    packet_kind: AUTONOMY_COPY_EXPORT_PACKET_KIND,
    packet_version: AUTONOMY_COPY_EXPORT_PACKET_VERSION,
    packet_fingerprint_algorithm: AUTONOMY_COPY_EXPORT_FINGERPRINT_ALGORITHM,
    source: "Autonomy Contract preview",
    scope: contract.scope,
    contract_id: contract.contract_id,
    contract_version: contract.contract_version,
    status: contract.status,
    autonomy_mode: contract.autonomy_mode,
    title: contract.title,
    goal: contract.goal,
    bounded_context_summary: contract.bounded_context_summary,
    packet_input_summary: buildAutonomyCopyExportInputSummary(preview),
    source_status: preview.source_status,
    fallback_reasons: [...preview.fallback_reasons],
    warnings: [...preview.warnings],
    gaps: [...preview.gaps],
    public_safety: preview.public_safety,
    route_refs: [...preview.route_refs],
    docs_refs: [...preview.docs_refs],
    source_refs: contract.source_refs,
    guide_brief_refs: [contract.guide_brief_ref],
    handoff_capsule_refs: [...contract.handoff_capsule_refs],
    codex_launch_card_refs: [...contract.codex_launch_card_refs],
    current_working_perspective_refs: [
      contract.current_working_perspective_ref,
    ],
    delta_projection_refs: [contract.delta_projection_ref],
    allowed_agents: [...contract.allowed_agents],
    allowed_surfaces: [...contract.allowed_surfaces],
    allowed_actions: [...contract.allowed_actions],
    forbidden_actions: [...contract.forbidden_actions],
    budget: contract.budget,
    reporting_cadence: contract.reporting_cadence,
    stop_conditions: contract.stop_conditions,
    delta_merge_policy: {
      ...contract.delta_merge_policy,
      auto_apply_allowed: false,
      auto_apply_targets: [],
    },
    review_escalation_policy: contract.review_escalation_policy,
    output_policy: contract.output_policy,
    staleness_policy: contract.staleness_policy,
    validation_policy: contract.validation_policy,
    run_preview: {
      ...contract.run_preview,
      status: "preview_only",
    },
    authority_boundary_summary: formatAutonomyAuthorityBoundaryForCopy(
      contract.authority_boundary,
    ),
    route_read_boundary_notes: [...preview.boundary_notes],
    auto_apply_allowed: false,
    auto_apply_targets: [],
    run_preview_status: "preview_only",
    budget_is_not_spend_permission: true,
    allowed_actions_are_not_commands: true,
    autonomy_run_preview_is_not_execution: true,
    no_runner_scheduler_daemon_background_work_exists: true,
    phase_9_runner_requires_separate_explicit_scope_and_approval: true,
    copy_export_boundary_statement: [...COPY_EXPORT_BOUNDARY_STATEMENT],
    boundary_flags: buildAutonomyCopyExportBoundaryFlags(),
  };
}

export function buildAutonomyCopyExportPreview(
  preview: AutonomyContractPreviewForWeb,
): AutonomyCopyExportPreview {
  const autonomyContractMarkdown =
    buildAutonomyContractMarkdownCopyPacket(preview);
  const budgetSummaryMarkdown =
    buildAutonomyBudgetMarkdownCopyPacket(preview);
  const reviewEscalationChecklistMarkdown =
    buildAutonomyReviewEscalationChecklistMarkdown(preview);
  const combinedReviewPacketMarkdown =
    buildCombinedAutonomyReviewPacketMarkdown(preview);
  const jsonPreview = buildAutonomyCopyExportJsonPacket(preview);
  const jsonText = canonicalJsonStringify(jsonPreview);
  const fingerprint = buildAutonomyCopyExportFingerprint({
    packet_kind: AUTONOMY_COPY_EXPORT_PACKET_KIND,
    packet_version: AUTONOMY_COPY_EXPORT_PACKET_VERSION,
    packet_input_summary: jsonPreview.packet_input_summary,
    source_status: jsonPreview.source_status,
    fallback_reasons: jsonPreview.fallback_reasons,
    warnings: jsonPreview.warnings,
    gaps: jsonPreview.gaps,
    boundary_flags: jsonPreview.boundary_flags,
  });

  return {
    packet_kind: AUTONOMY_COPY_EXPORT_PACKET_KIND,
    packet_version: AUTONOMY_COPY_EXPORT_PACKET_VERSION,
    packet_fingerprint_algorithm: AUTONOMY_COPY_EXPORT_FINGERPRINT_ALGORITHM,
    packet_fingerprint: fingerprint,
    packet_input_summary: jsonPreview.packet_input_summary,
    boundary_flags: jsonPreview.boundary_flags,
    autonomy_contract_markdown: autonomyContractMarkdown,
    budget_summary_markdown: budgetSummaryMarkdown,
    review_escalation_checklist_markdown:
      reviewEscalationChecklistMarkdown,
    combined_review_packet_markdown: combinedReviewPacketMarkdown,
    json_preview: jsonPreview,
    json_text: jsonText,
    character_counts: {
      autonomy_contract_markdown: autonomyContractMarkdown.length,
      budget_summary_markdown: budgetSummaryMarkdown.length,
      review_escalation_checklist_markdown:
        reviewEscalationChecklistMarkdown.length,
      combined_review_packet_markdown: combinedReviewPacketMarkdown.length,
      json_preview: jsonText.length,
    },
  };
}

export function buildAutonomyCopyExportInputSummary(
  preview: AutonomyContractPreviewForWeb,
): AutonomyCopyExportInputSummary {
  const contract = preview.contract;

  return {
    scope: contract.scope,
    contract_id: contract.contract_id,
    contract_version: contract.contract_version,
    status: contract.status,
    autonomy_mode: contract.autonomy_mode,
    source_status: preview.source_status,
    fallback_reason_count: preview.fallback_reasons.length,
    warning_count: preview.warnings.length,
    gap_count: preview.gaps.length,
    allowed_action_count: contract.allowed_actions.length,
    forbidden_action_count: contract.forbidden_actions.length,
    stop_condition_count: contract.stop_conditions.length,
    review_escalation_trigger_count:
      contract.review_escalation_policy.requires_user_judgment_when.length +
      contract.review_escalation_policy.requires_operator_review_when.length +
      contract.review_escalation_policy.requires_fresh_snapshot_when.length +
      contract.review_escalation_policy.requires_new_budget_when.length +
      contract.review_escalation_policy.blocks_run_when.length,
    validation_required_check_count:
      contract.validation_policy.required_checks.length,
    route_ref_count: preview.route_refs.length,
    docs_ref_count: preview.docs_refs.length,
  };
}

export function buildAutonomyCopyExportFingerprint(input: unknown): string {
  const text = canonicalJsonStringify(input);
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function normalizeAutonomyCopyText(input: string): string {
  return input.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function formatAutonomyAuthorityBoundaryForCopy(
  boundary: object,
): string[] {
  const entries = Object.entries(boundary)
    .filter(([key]) => key !== "notes")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}: ${String(value)}`);

  const notes = Array.isArray((boundary as { notes?: unknown }).notes)
    ? ((boundary as { notes: string[] }).notes ?? []).map(
        (note) => `note: ${note}`,
      )
    : [];

  return [...entries, ...notes];
}

export function formatAutonomySourceStatusForCopy(
  preview: AutonomyContractPreviewForWeb,
): string[] {
  return [
    `source: ${preview.source_status.source}`,
    `autonomy_contract: ${preview.source_status.autonomy_contract}`,
    `budget: ${preview.source_status.budget}`,
    `delta_merge_policy: ${preview.source_status.delta_merge_policy}`,
    `run_preview: ${preview.source_status.run_preview}`,
    `source_disclosure: ${preview.source_status.source_disclosure}`,
    `synthetic_operator_supplied_fields: ${preview.source_status.synthetic_operator_supplied_fields.join(", ")}`,
    `fallback_reasons: ${preview.fallback_reasons.join(" | ") || "none"}`,
    `warnings: ${preview.warnings.join(" | ") || "none"}`,
    `gaps: ${preview.gaps.join(" | ") || "none"}`,
  ];
}

export function formatAutonomyBudgetForCopy(
  preview: AutonomyContractPreviewForWeb,
): string[] {
  const budget = preview.contract.budget;

  return [
    `budget_id: ${budget.budget_id}`,
    `time_limit_minutes: ${budget.time_limit_minutes}`,
    `wall_clock_window.starts_at: ${budget.wall_clock_window.starts_at ?? "none"}`,
    `wall_clock_window.ends_at: ${budget.wall_clock_window.ends_at ?? "none"}`,
    `wall_clock_window.timezone: ${budget.wall_clock_window.timezone}`,
    `max_iterations: ${budget.max_iterations}`,
    `max_tool_calls: ${budget.max_tool_calls}`,
    `max_codex_tasks: ${budget.max_codex_tasks}`,
    `max_prs: ${budget.max_prs}`,
    `max_file_changes: ${budget.max_file_changes}`,
    `allowed_file_globs: ${budget.allowed_file_globs.join(", ") || "none"}`,
    `forbidden_file_globs: ${budget.forbidden_file_globs.join(", ") || "none"}`,
    `token_or_compute_budget.max_tokens: ${budget.token_or_compute_budget.max_tokens ?? "none"}`,
    `token_or_compute_budget.max_compute_units: ${budget.token_or_compute_budget.max_compute_units ?? "none"}`,
    `cost_budget.currency: ${budget.cost_budget.currency}`,
    `cost_budget.amount: ${budget.cost_budget.amount ?? "none"}`,
    `retry_limit: ${budget.retry_limit}`,
    `failure_threshold: ${budget.failure_threshold}`,
    `reporting_interval: ${budget.reporting_interval}`,
    `requires_budget_refresh_after: ${budget.requires_budget_refresh_after.join(", ") || "none"}`,
    ...budget.budget_boundary_notes.map(
      (note) => `budget_boundary_note: ${note}`,
    ),
  ];
}

export function formatAutonomyDeltaMergePolicyForCopy(
  preview: AutonomyContractPreviewForWeb,
): string[] {
  const policy = preview.contract.delta_merge_policy;

  return [
    `policy_id: ${policy.policy_id}`,
    `default_delta_status: ${policy.default_delta_status}`,
    "auto_apply_allowed: false",
    "auto_apply_targets: none",
    `review_required_targets: ${policy.review_required_targets.join(", ") || "none"}`,
    `blocked_targets: ${policy.blocked_targets.join(", ") || "none"}`,
    `durable_memory_policy: ${policy.durable_memory_policy}`,
    `project_perspective_policy: ${policy.project_perspective_policy}`,
    `external_side_effect_policy: ${policy.external_side_effect_policy}`,
    `codex_launch_policy: ${policy.codex_launch_policy}`,
    `proof_evidence_policy: ${policy.proof_evidence_policy}`,
    `stale_context_policy: ${policy.stale_context_policy}`,
    `user_judgment_policy: ${policy.user_judgment_policy}`,
    ...policy.policy_notes.map((note) => `policy_note: ${note}`),
  ];
}

export function formatAutonomyReviewEscalationForCopy(
  preview: AutonomyContractPreviewForWeb,
): string[] {
  const policy = preview.contract.review_escalation_policy;

  return [
    `escalation_id: ${policy.escalation_id}`,
    ...formatNamedList(
      "requires_user_judgment_when",
      policy.requires_user_judgment_when,
    ),
    ...formatNamedList(
      "requires_operator_review_when",
      policy.requires_operator_review_when,
    ),
    ...formatNamedList(
      "requires_fresh_snapshot_when",
      policy.requires_fresh_snapshot_when,
    ),
    ...formatNamedList(
      "requires_new_budget_when",
      policy.requires_new_budget_when,
    ),
    ...formatNamedList("blocks_run_when", policy.blocks_run_when),
    `review_queue_target: ${policy.review_queue_target}`,
    `escalation_summary_template: ${policy.escalation_summary_template}`,
    ...policy.notes.map((note) => `note: ${note}`),
  ];
}

export function formatAutonomyRunPreviewForCopy(
  preview: AutonomyContractPreviewForWeb,
): string[] {
  const runPreview = preview.contract.run_preview;

  return [
    `preview_id: ${runPreview.preview_id}`,
    `title: ${runPreview.title}`,
    "status: preview_only",
    "AutonomyRunPreview is not execution.",
    "No runner exists.",
    "No scheduler exists.",
    "No daemon exists.",
    "No background job exists.",
    "Phase 9 runner requires separate explicit scope and approval.",
    ...formatNamedList("planned_step", runPreview.planned_steps),
    ...formatNamedList("allowed_read_source", runPreview.allowed_read_sources),
    ...formatNamedList(
      "proposed_delta_output",
      runPreview.proposed_delta_outputs,
    ),
    ...formatNamedList("proposed_report", runPreview.proposed_reports),
    ...formatNamedList("blocked_step", runPreview.blocked_steps),
    ...formatNamedList(
      "required_precondition",
      runPreview.required_preconditions,
    ),
    ...formatNamedList(
      "not_implemented_note",
      runPreview.not_implemented_notes,
    ),
  ];
}

function buildAutonomyCopyExportBoundaryFlags(): AutonomyCopyExportBoundaryFlags {
  return {
    local_clipboard_only: true,
    external_posted: false,
    autonomy_ran: false,
    autonomy_scheduled: false,
    daemon_started: false,
    background_work_started: false,
    codex_executed: false,
    codex_launched: false,
    github_called: false,
    provider_called: false,
    proof_evidence_written: false,
    db_written: false,
    state_mutated: false,
    handoff_sent: false,
    branch_pr_created: false,
    copy_persisted: false,
    budget_spent: false,
    auto_apply_performed: false,
  };
}

function formatPacketHeader(
  preview: AutonomyContractPreviewForWeb,
): string[] {
  const contract = preview.contract;

  return [
    `- packet_kind: ${AUTONOMY_COPY_EXPORT_PACKET_KIND}`,
    `- packet_version: ${AUTONOMY_COPY_EXPORT_PACKET_VERSION}`,
    `- packet_fingerprint_algorithm: ${AUTONOMY_COPY_EXPORT_FINGERPRINT_ALGORITHM}`,
    "- source: Autonomy Contract preview",
    `- scope: ${contract.scope}`,
    `- contract_id: ${contract.contract_id}`,
    `- contract_version: ${contract.contract_version}`,
    `- status: ${contract.status}`,
    `- autonomy_mode: ${contract.autonomy_mode}`,
    "- auto_apply_allowed: false",
    "- auto_apply_targets: none",
    "- run_preview.status: preview_only",
    "- budget is not spend permission",
    "- allowed actions are not commands",
    "- AutonomyRunPreview is not execution",
    "- no runner/scheduler/daemon/background work exists",
    "- Phase 9 runner requires separate explicit scope and approval",
    "",
    "## Source / Fallback Status",
    ...formatAutonomySourceStatusForCopy(preview).map((line) => `- ${line}`),
    "",
    "## Route And Docs Refs",
    ...formatNamedList("route_ref", preview.route_refs),
    ...formatNamedList("docs_ref", preview.docs_refs),
    "",
    "## Copy Boundary Flags",
    ...Object.entries(buildAutonomyCopyExportBoundaryFlags()).map(
      ([key, value]) => `- ${key}: ${String(value)}`,
    ),
  ];
}

function formatAutonomySourceRefsForCopy(
  preview: AutonomyContractPreviewForWeb,
): string[] {
  const contract = preview.contract;

  return [
    `- guide_brief_ref: ${contract.guide_brief_ref}`,
    ...formatNamedList("handoff_capsule_ref", contract.handoff_capsule_refs),
    ...formatNamedList("codex_launch_card_ref", contract.codex_launch_card_refs),
    `- current_working_perspective_ref: ${contract.current_working_perspective_ref}`,
    `- delta_projection_ref: ${contract.delta_projection_ref}`,
    ...formatSourceRefsObjectForCopy(contract.source_refs),
  ];
}

function formatAutonomyStopConditionsForCopy(
  preview: AutonomyContractPreviewForWeb,
): string[] {
  return preview.contract.stop_conditions.flatMap((condition) => [
    `- stop_condition_id: ${condition.stop_condition_id}`,
    `  kind: ${condition.kind}`,
    `  summary: ${condition.summary}`,
    `  severity: ${condition.severity}`,
    `  blocks_future_run: ${String(condition.blocks_future_run)}`,
    `  recovery_hint: ${condition.recovery_hint}`,
  ]);
}

function formatCopyExportBoundaryForCopy(): string[] {
  return formatList([...COPY_EXPORT_BOUNDARY_STATEMENT]);
}

function formatObjectForCopy(value: unknown, prefix = ""): string[] {
  if (Array.isArray(value)) {
    return value.length > 0
      ? value.flatMap((item, index) =>
          formatObjectForCopy(item, `${prefix}${index}.`),
        )
      : [`- ${prefix || "value"}none`];
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([left], [right]) => left.localeCompare(right),
    );

    return entries.length > 0
      ? entries.flatMap(([key, nestedValue]) =>
          formatObjectForCopy(nestedValue, `${prefix}${key}.`),
        )
      : [`- ${prefix || "value"}none`];
  }

  return [`- ${prefix.replace(/\.$/, "")}: ${String(value)}`];
}

function formatSourceRefsObjectForCopy(sourceRefs: object): string[] {
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

function formatNamedList(label: string, values: readonly string[]): string[] {
  return values.length > 0
    ? values.map((value) => `- ${label}: ${value}`)
    : [`- ${label}: none`];
}

function formatList(values: readonly string[]): string[] {
  return values.length > 0
    ? values.map((value) => `- ${value}`)
    : ["- none"];
}

function canonicalJsonStringify(value: unknown): string {
  return JSON.stringify(sortForCanonicalJson(value), null, 2);
}

function sortForCanonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortForCanonicalJson);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, sortForCanonicalJson(nestedValue)]),
    );
  }

  return value;
}
