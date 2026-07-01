import {
  AUTONOMY_ALLOWED_ACTIONS,
  AUTONOMY_CONTRACT_VERSION,
  AUTONOMY_FORBIDDEN_ACTIONS,
  type AutonomyBudget,
  type AutonomyContract,
  type AutonomyContractAuthorityBoundary,
  type AutonomyContractBuilderInput,
  type AutonomyContextScope,
  type AutonomyDeltaMergePolicy,
  type AutonomyGap,
  type AutonomyOutputPolicy,
  type AutonomyPublicSafetyBlock,
  type AutonomyRefInput,
  type AutonomyReviewEscalationPolicy,
  type AutonomyRunPreview,
  type AutonomySourceRefs,
  type AutonomyStalenessPolicy,
  type AutonomyStopCondition,
  type AutonomyValidationPolicy,
  type ReportingCadence,
} from "@/types/autonomy-contract";

const FALLBACK_CREATED_AT = "1970-01-01T00:00:00.000Z" as const;
const FALLBACK_CONTRACT_ID = "autonomy_contract.unspecified" as const;
const FALLBACK_BUDGET_ID = "autonomy_budget.unspecified" as const;
const FALLBACK_POLICY_ID = "autonomy_delta_merge_policy.phase_8a_default" as const;
const FALLBACK_ESCALATION_ID =
  "autonomy_review_escalation_policy.phase_8a_default" as const;
const FALLBACK_PREVIEW_ID = "autonomy_run_preview.phase_8a_preview" as const;

const REQUIRED_DOCS_REFS = [
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "docs/HANDOFF_CAPSULE_CONTRACT_V0_1.md",
  "docs/CODEX_HANDOFF_CAPSULE_CONSUMPTION_V0_1.md",
  "docs/AUGNES_DELTA_CONTRACT_V0_1.md",
  "docs/AUTHORITY_MATRIX.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
] as const;

const DEFAULT_REPORT_SECTIONS = [
  "summary",
  "source_refs",
  "deltas_created",
  "delta_batch_summary",
  "budget_used",
  "checks_run",
  "skipped_checks",
  "blocked_actions",
  "user_judgment_items",
  "known_risks",
  "next_phase_readiness",
] as const;

const DEFAULT_REVIEW_REQUIRED_TARGETS = [
  "working_memory_candidate",
  "project_perspective_candidate",
  "durable_memory_candidate",
  "codex_launch_candidate",
  "handoff_send_candidate",
] as const;

const DEFAULT_BLOCKED_TARGETS = [
  "proof_evidence_write",
  "external_publication",
  "github_actuation",
  "provider_call",
  "branch_pr_creation",
  "durable_apply_without_review",
] as const;

export function buildAutonomyContract(
  input: AutonomyContractBuilderInput,
): AutonomyContract {
  const sourceRefs = buildAutonomySourceRefs(input);
  const budget = buildAutonomyBudget(input.budget);

  return {
    runtime: "augnes",
    contract_version: AUTONOMY_CONTRACT_VERSION,
    scope: input.scope,
    contract_id: input.contract_id ?? FALLBACK_CONTRACT_ID,
    created_at: input.created_at ?? FALLBACK_CREATED_AT,
    status: input.status ?? "preview_only",
    autonomy_mode: input.autonomy_mode,
    title: input.title,
    goal: input.goal,
    bounded_context_summary:
      input.bounded_context_summary ??
      "Autonomy Contract preview built from supplied refs only.",
    source_refs: sourceRefs,
    guide_brief_ref:
      sourceRefs.guide_brief_refs[0] ?? "guide_brief.unspecified",
    handoff_capsule_refs: [...sourceRefs.handoff_capsule_refs],
    codex_launch_card_refs: [...sourceRefs.codex_launch_card_refs],
    current_working_perspective_ref:
      sourceRefs.current_working_perspective_refs[0] ??
      "current_working_perspective.unspecified",
    delta_projection_ref:
      sourceRefs.delta_projection_refs[0] ?? "delta_projection.unspecified",
    context_scope:
      input.context_scope ?? buildDefaultContextScope(input, sourceRefs),
    allowed_agents: input.allowed_agents ?? [
      "user",
      "operator",
      "chatgpt",
      "codex",
      "future_agent",
    ],
    allowed_surfaces: input.allowed_surfaces ?? [
      "guide_brief",
      "handoff_capsule_preview",
      "codex_launch_card_preview",
      "agent_workplane_preview",
      "manual_review_packet",
    ],
    allowed_actions: uniqueSorted([
      ...buildDefaultAllowedActions(),
      ...(input.allowed_actions ?? []),
    ]),
    forbidden_actions: uniqueSorted([
      ...buildDefaultForbiddenActions(),
      ...(input.forbidden_actions ?? []),
      ...(input.operator_constraints ?? []),
    ]),
    budget,
    reporting_cadence: buildAutonomyReportingCadence(input.reporting_cadence),
    stop_conditions: buildAutonomyStopConditions(input.stop_conditions),
    delta_merge_policy: buildAutonomyDeltaMergePolicy(
      input.delta_merge_policy,
    ),
    review_escalation_policy: buildAutonomyReviewEscalationPolicy(
      input.review_escalation_policy,
    ),
    output_policy: buildAutonomyOutputPolicy(input.output_policy),
    staleness_policy: buildAutonomyStalenessPolicy(input.staleness_policy),
    validation_policy: buildAutonomyValidationPolicy(input.validation_policy),
    run_preview: buildAutonomyRunPreview(input.run_preview),
    authority_boundary: buildAutonomyContractAuthorityBoundary(),
    gaps: input.gaps ?? buildDefaultGaps(budget),
    public_safety: input.public_safety ?? buildDefaultPublicSafetyBlock(),
    next_phase_notes: input.next_phase_notes ?? [
      "Phase 8A defines preview-only Autonomy Contract / Budget / Delta Merge Policy core.",
      "Future runner requires separate Phase 9 scope and explicit approval.",
    ],
  };
}

export function buildAutonomyBudget(
  input: Partial<AutonomyBudget> = {},
): AutonomyBudget {
  return {
    budget_id: input.budget_id ?? FALLBACK_BUDGET_ID,
    time_limit_minutes: input.time_limit_minutes ?? 0,
    wall_clock_window: input.wall_clock_window ?? {
      starts_at: null,
      ends_at: null,
      timezone: "unspecified",
      notes: [
        "No active wall-clock schedule is created by this contract.",
        "Missing operator-supplied budget blocks future autonomy.",
      ],
    },
    max_iterations: input.max_iterations ?? 0,
    max_tool_calls: input.max_tool_calls ?? 0,
    max_codex_tasks: input.max_codex_tasks ?? 0,
    max_prs: input.max_prs ?? 0,
    max_file_changes: input.max_file_changes ?? 0,
    allowed_file_globs: input.allowed_file_globs ?? [],
    forbidden_file_globs: input.forbidden_file_globs ?? [
      "app/**",
      "app/api/**",
      "components/**",
      "apps/augnes_apps/**",
      "migrations/**",
      "lib/db*",
      "proof/**",
      "evidence/**",
      "scheduler/**",
    ],
    token_or_compute_budget: input.token_or_compute_budget ?? {
      max_tokens: null,
      max_compute_units: null,
      notes: [
        "Budget is a boundary, not permission to spend.",
        "Phase 8A does not call providers or execute tools.",
      ],
    },
    cost_budget: input.cost_budget ?? {
      currency: "USD",
      amount: null,
      notes: [
        "No cost-spend permission is granted.",
        "Phase 8A must not charge or call provider APIs.",
      ],
    },
    retry_limit: input.retry_limit ?? 0,
    failure_threshold: input.failure_threshold ?? 0,
    reporting_interval:
      input.reporting_interval ?? "manual preview report only",
    requires_budget_refresh_after:
      input.requires_budget_refresh_after ?? [
        "missing_budget",
        "budget_exceeded",
        "scope_change",
        "new_external_side_effect_request",
      ],
    budget_boundary_notes: input.budget_boundary_notes ?? [
      "Budget is a boundary, not spend permission.",
      "Missing budget blocks future autonomy.",
      "Phase 8A must not charge, call providers, execute tools, or run background work.",
    ],
  };
}

export function buildAutonomyDeltaMergePolicy(
  input: Partial<AutonomyDeltaMergePolicy> = {},
): AutonomyDeltaMergePolicy {
  return {
    policy_id: input.policy_id ?? FALLBACK_POLICY_ID,
    default_delta_status: input.default_delta_status ?? "needs_review",
    auto_apply_allowed: false,
    auto_apply_targets: [],
    review_required_targets:
      input.review_required_targets ??
      [...DEFAULT_REVIEW_REQUIRED_TARGETS],
    blocked_targets: input.blocked_targets ?? [...DEFAULT_BLOCKED_TARGETS],
    durable_memory_policy:
      input.durable_memory_policy ??
      "Durable memory changes require user/operator review and are not auto-applied in Phase 8A.",
    project_perspective_policy:
      input.project_perspective_policy ??
      "Project Perspective changes require user/operator review and are not auto-applied in Phase 8A.",
    external_side_effect_policy:
      input.external_side_effect_policy ??
      "External side effects are blocked in Phase 8A.",
    codex_launch_policy:
      input.codex_launch_policy ??
      "Codex launch is blocked; Codex Launch Card refs are preview input only.",
    proof_evidence_policy:
      input.proof_evidence_policy ??
      "Proof/evidence writes are blocked in Phase 8A.",
    stale_context_policy:
      input.stale_context_policy ??
      "Stale context requires fresh snapshot review before any future runner.",
    user_judgment_policy:
      input.user_judgment_policy ??
      "needs_user_judgment items require review and block future autonomy until decided.",
    policy_notes: input.policy_notes ?? [
      "auto_apply_allowed is false in Phase 8A.",
      "auto_apply_within_contract may be described only as future-contract-preview and inactive.",
      "Durable memory and project Perspective require review.",
    ],
  };
}

export function buildAutonomyReviewEscalationPolicy(
  input: Partial<AutonomyReviewEscalationPolicy> = {},
): AutonomyReviewEscalationPolicy {
  return {
    escalation_id: input.escalation_id ?? FALLBACK_ESCALATION_ID,
    requires_user_judgment_when:
      input.requires_user_judgment_when ?? [
        "needs_user_judgment item exists",
        "ambiguous authority boundary",
      ],
    requires_operator_review_when:
      input.requires_operator_review_when ?? [
        "external side effect requested",
        "durable memory change requested",
        "project perspective change requested",
        "proof/evidence write requested",
        "Codex launch requested",
        "GitHub/provider call requested",
        "forbidden file touched in future run",
      ],
    requires_fresh_snapshot_when:
      input.requires_fresh_snapshot_when ?? [
        "stale GuideBrief or stale Handoff Capsule",
        "stale Current Working Perspective",
        "stale Delta Projection",
      ],
    requires_new_budget_when:
      input.requires_new_budget_when ?? [
        "budget exceeded",
        "budget missing",
        "scope expands beyond budget boundary",
      ],
    blocks_run_when: input.blocks_run_when ?? [
      "required check skipped",
      "required check failed",
      "external side effect requested",
      "durable memory change requested",
      "project perspective change requested",
      "proof/evidence write requested",
      "Codex launch requested",
      "GitHub/provider call requested",
      "ambiguous authority boundary",
    ],
    review_queue_target:
      input.review_queue_target ?? "operator_autonomy_review_queue_preview",
    escalation_summary_template:
      input.escalation_summary_template ??
      "Review required: {trigger}. Source refs: {source_refs}. Recovery: {recovery_hint}.",
    notes: input.notes ?? [
      "Review escalation is preview policy only in Phase 8A.",
      "Escalation does not run, schedule, apply, post, or merge.",
    ],
  };
}

export function buildAutonomyStopConditions(
  input?: AutonomyStopCondition[],
): AutonomyStopCondition[] {
  return input ?? [
    buildStopCondition(
      "budget_exhausted",
      "Budget is missing, exceeded, or no longer matches scope.",
      "blocking",
      "Refresh budget with operator review before any future run.",
    ),
    buildStopCondition(
      "stale_context",
      "GuideBrief, Handoff Capsule, Current Working Perspective, or Delta Projection is stale.",
      "high",
      "Refresh source snapshots before review.",
    ),
    buildStopCondition(
      "user_judgment_required",
      "At least one needs_user_judgment item exists.",
      "blocking",
      "Resolve user/operator judgment before future autonomy.",
    ),
    buildStopCondition(
      "required_check_failed",
      "A required check failed.",
      "blocking",
      "Fix the failure and rerun the required check.",
    ),
    buildStopCondition(
      "required_check_skipped",
      "A required check was skipped.",
      "high",
      "Report the skipped check and obtain review before continuing.",
    ),
    buildStopCondition(
      "forbidden_action_requested",
      "A forbidden action was requested.",
      "blocking",
      "Remove the forbidden action or obtain a new explicit phase scope.",
    ),
    buildStopCondition(
      "forbidden_file_scope",
      "A forbidden file scope would be touched.",
      "blocking",
      "Constrain file scope or obtain operator review.",
    ),
    buildStopCondition(
      "source_gap_high",
      "A high-severity source gap blocks safe review.",
      "high",
      "Collect a fresh bounded source packet before future autonomy.",
    ),
    buildStopCondition(
      "authority_boundary_unclear",
      "Authority boundary is ambiguous.",
      "blocking",
      "Clarify authority before any future runner.",
    ),
    buildStopCondition(
      "runtime_unavailable",
      "Required future runtime source is unavailable.",
      "high",
      "Use fallback honestly or wait for runtime availability.",
    ),
    buildStopCondition(
      "manual_stop_requested",
      "User/operator manually stops the future run.",
      "blocking",
      "Stop and report current state without retry/replay/deploy.",
    ),
  ];
}

export function buildAutonomyReportingCadence(
  input: Partial<ReportingCadence> = {},
): ReportingCadence {
  return {
    mode: input.mode ?? "manual",
    interval_description:
      input.interval_description ?? "Manual report after preview packet review.",
    minimum_report_fields:
      input.minimum_report_fields ?? [...DEFAULT_REPORT_SECTIONS],
    report_target_surface:
      input.report_target_surface ?? "manual_operator_review",
  };
}

export function buildAutonomyOutputPolicy(
  input: Partial<AutonomyOutputPolicy> = {},
): AutonomyOutputPolicy {
  return {
    output_surfaces: input.output_surfaces ?? [
      "manual_operator_review",
      "future_agent_workplane_preview",
    ],
    required_report_sections:
      input.required_report_sections ?? [...DEFAULT_REPORT_SECTIONS],
    delta_batch_required: input.delta_batch_required ?? true,
    skipped_check_reporting_required:
      input.skipped_check_reporting_required ?? true,
    proof_evidence_status_required:
      input.proof_evidence_status_required ?? true,
    no_background_work_statement_required:
      input.no_background_work_statement_required ?? true,
    no_merge_statement_required: input.no_merge_statement_required ?? true,
    next_phase_readiness_required:
      input.next_phase_readiness_required ?? true,
  };
}

export function buildAutonomyRunPreview(
  input: Partial<AutonomyRunPreview> = {},
): AutonomyRunPreview {
  return {
    preview_id: input.preview_id ?? FALLBACK_PREVIEW_ID,
    title: input.title ?? "Preview-only future autonomy sketch",
    planned_steps: input.planned_steps ?? [
      "Read GuideBrief, Handoff Capsule, Codex Launch Card, Current Working Perspective, and Delta Projection refs.",
      "Summarize bounded context and rank candidate deltas.",
      "Prepare review packet and draft report preview.",
    ],
    allowed_read_sources: input.allowed_read_sources ?? [
      "GuideBrief",
      "Handoff Capsule preview",
      "Codex Launch Card preview",
      "Current Working Perspective",
      "Delta Projection",
      "Agent Workplane preview refs",
    ],
    proposed_delta_outputs: input.proposed_delta_outputs ?? [
      "needs_review delta candidates",
      "blocked action summary",
      "user judgment item list",
    ],
    proposed_reports: input.proposed_reports ?? [
      "manual operator review packet",
      "budget usage preview",
      "next phase readiness summary",
    ],
    blocked_steps: input.blocked_steps ?? [
      "run_codex",
      "open_pr",
      "call_github",
      "call_openai_or_provider",
      "write_memory",
      "apply_project_perspective",
      "record_proof",
      "create_evidence",
      "schedule_run",
      "send_handoff",
      "publish_external",
    ],
    required_preconditions: input.required_preconditions ?? [
      "Explicit future Phase 9 runner scope.",
      "Fresh source snapshots.",
      "Operator-reviewed budget.",
      "Resolved user judgment items.",
    ],
    not_implemented_notes: input.not_implemented_notes ?? [
      "AutonomyRunPreview is not background work.",
      "No runner, scheduler, daemon, background job, or active execution exists in Phase 8A.",
      "Future runner requires separate Phase 9 scope and explicit approval.",
    ],
    status: "preview_only",
  };
}

export function buildAutonomySourceRefs(
  input: Pick<
    AutonomyContractBuilderInput,
    | "guide_brief"
    | "handoff_capsules"
    | "codex_launch_cards"
    | "current_working_perspective_ref"
    | "delta_projection_ref"
    | "docs_refs"
    | "source_refs"
  >,
): AutonomySourceRefs {
  const sourceRefs = input.source_refs ?? {};

  return {
    guide_brief_refs: uniqueSorted([
      ...(sourceRefs.guide_brief_refs ?? []),
      ...compact([extractRef(input.guide_brief)]),
    ]),
    handoff_capsule_refs: uniqueSorted([
      ...(sourceRefs.handoff_capsule_refs ?? []),
      ...extractRefs(input.handoff_capsules),
    ]),
    codex_launch_card_refs: uniqueSorted([
      ...(sourceRefs.codex_launch_card_refs ?? []),
      ...extractRefs(input.codex_launch_cards),
    ]),
    current_working_perspective_refs: uniqueSorted([
      ...(sourceRefs.current_working_perspective_refs ?? []),
      ...compact([input.current_working_perspective_ref]),
    ]),
    delta_projection_refs: uniqueSorted([
      ...(sourceRefs.delta_projection_refs ?? []),
      ...compact([input.delta_projection_ref]),
    ]),
    workplane_refs: uniqueSorted(sourceRefs.workplane_refs ?? []),
    delta_ids: uniqueSorted(sourceRefs.delta_ids ?? []),
    batch_ids: uniqueSorted(sourceRefs.batch_ids ?? []),
    evidence_refs: uniqueSorted(sourceRefs.evidence_refs ?? []),
    artifact_refs: uniqueSorted(sourceRefs.artifact_refs ?? []),
    handoff_refs: uniqueSorted(sourceRefs.handoff_refs ?? []),
    diagnostic_refs: uniqueSorted(sourceRefs.diagnostic_refs ?? []),
    route_refs: uniqueSorted(sourceRefs.route_refs ?? []),
    docs_refs: uniqueSorted([
      ...(sourceRefs.docs_refs ?? []),
      ...(input.docs_refs ?? []),
      ...REQUIRED_DOCS_REFS,
    ]),
    repo_refs: uniqueSorted(sourceRefs.repo_refs ?? []),
  };
}

export function buildAutonomyContractAuthorityBoundary(): AutonomyContractAuthorityBoundary {
  return {
    source_of_truth: false,
    can_commit_or_reject_state: false,
    can_record_proof: false,
    can_create_evidence: false,
    can_update_work: false,
    can_mutate_memory: false,
    can_apply_project_perspective: false,
    can_publish_external: false,
    can_merge: false,
    can_retry_replay_deploy: false,
    can_call_github: false,
    can_call_openai_or_provider: false,
    can_execute_codex: false,
    can_create_branch_or_pr: false,
    can_send_handoff: false,
    can_launch_codex: false,
    can_launch_autonomy: false,
    can_schedule_background_work: false,
    can_create_mcp_tool: false,
    can_create_ui_action: false,
    can_post_external_comment: false,
    can_write_db: false,
    can_start_daemon: false,
    notes: [
      "Contract is preview-only.",
      "Contract does not run.",
      "Contract does not schedule.",
      "Contract does not launch Codex.",
      "Contract does not call GitHub or providers.",
      "Contract does not mutate state/memory/work/Perspective.",
      "Contract does not send handoffs.",
      "Contract does not create proof/evidence.",
      "Future runner requires separate Phase 9 scope and explicit approval.",
    ],
  };
}

export function buildDefaultForbiddenActions(): string[] {
  return [...AUTONOMY_FORBIDDEN_ACTIONS];
}

export function buildDefaultAllowedActions(): string[] {
  return [...AUTONOMY_ALLOWED_ACTIONS];
}

function buildAutonomyStalenessPolicy(
  input: Partial<AutonomyStalenessPolicy> = {},
): AutonomyStalenessPolicy {
  return {
    policy_id: input.policy_id ?? "autonomy_staleness_policy.phase_8a_default",
    fresh_snapshot_required: input.fresh_snapshot_required ?? true,
    stale_context_blocks_future_run:
      input.stale_context_blocks_future_run ?? true,
    stale_guide_brief_requires_review:
      input.stale_guide_brief_requires_review ?? true,
    stale_handoff_capsule_requires_review:
      input.stale_handoff_capsule_requires_review ?? true,
    refresh_required_sources: input.refresh_required_sources ?? [
      "GuideBrief",
      "Handoff Capsule",
      "Codex Launch Card",
      "Current Working Perspective",
      "Delta Projection",
    ],
    notes: input.notes ?? [
      "Stale context requires review before any future autonomous run.",
    ],
  };
}

function buildAutonomyValidationPolicy(
  input: Partial<AutonomyValidationPolicy> = {},
): AutonomyValidationPolicy {
  return {
    policy_id: input.policy_id ?? "autonomy_validation_policy.phase_8a_default",
    required_checks: input.required_checks ?? [
      "typecheck",
      "smoke:autonomy-contract-v0-1",
    ],
    optional_checks: input.optional_checks ?? [],
    skipped_check_policy: input.skipped_check_policy ?? [
      "Skipped checks must be reported with concrete reasons.",
      "Skipped required checks block future autonomy.",
    ],
    failed_check_policy: input.failed_check_policy ?? [
      "Failed required checks block future autonomy.",
    ],
    validation_notes: input.validation_notes ?? [
      "Validation is report context only and does not create proof/evidence.",
    ],
  };
}

function buildDefaultContextScope(
  input: AutonomyContractBuilderInput,
  sourceRefs: AutonomySourceRefs,
): AutonomyContextScope {
  return {
    scope_summary: `Preview-only autonomy context for ${input.scope}.`,
    included_refs: uniqueSorted([
      ...sourceRefs.guide_brief_refs,
      ...sourceRefs.handoff_capsule_refs,
      ...sourceRefs.codex_launch_card_refs,
      ...sourceRefs.current_working_perspective_refs,
      ...sourceRefs.delta_projection_refs,
    ]),
    excluded_refs: [
      "private conversation logs",
      "hidden reasoning",
      "secrets or tokens",
      "raw provider output",
      "raw retrieval output",
    ],
    freshness: "unknown",
    notes: [
      "Context refs are preview inputs only.",
      "Context refs do not grant execution, write, schedule, or external authority.",
    ],
  };
}

function buildDefaultGaps(budget: AutonomyBudget): AutonomyGap[] {
  const gaps: AutonomyGap[] = [
    {
      code: "phase_9_runner_not_scoped",
      severity: "medium",
      summary:
        "Future runner implementation is intentionally deferred outside Phase 8A.",
      source_refs: ["docs/AUTONOMY_CONTRACT_V0_1.md"],
      blocks_future_runner: true,
    },
  ];

  if (budget.budget_id === FALLBACK_BUDGET_ID) {
    gaps.push({
      code: "operator_budget_not_supplied",
      severity: "high",
      summary:
        "No operator-supplied budget was provided; missing budget blocks future autonomy.",
      source_refs: ["AutonomyBudget"],
      blocks_future_runner: true,
    });
  }

  return gaps;
}

function buildDefaultPublicSafetyBlock(): AutonomyPublicSafetyBlock {
  return {
    fixture_kind: "synthetic_sample",
    contains_private_conversation: false,
    contains_hidden_reasoning: false,
    contains_local_private_paths: false,
    contains_secrets_or_tokens: false,
    contains_raw_provider_output: false,
    contains_raw_retrieval_output: false,
    contains_real_account_artifacts: false,
    notes: [
      "No private conversation.",
      "No hidden reasoning.",
      "No local private paths.",
      "No secrets/tokens.",
      "No raw provider output.",
      "No raw retrieval output.",
      "No real account artifacts.",
    ],
  };
}

function buildStopCondition(
  kind: AutonomyStopCondition["kind"],
  summary: string,
  severity: AutonomyStopCondition["severity"],
  recoveryHint: string,
): AutonomyStopCondition {
  return {
    stop_condition_id: `stop.${kind}`,
    kind,
    summary,
    severity,
    source_refs: ["docs/AUTONOMY_CONTRACT_V0_1.md"],
    blocks_future_run: true,
    recovery_hint: recoveryHint,
  };
}

function extractRefs(inputs: AutonomyRefInput[] | undefined): string[] {
  return compact((inputs ?? []).map(extractRef));
}

function extractRef(input: AutonomyRefInput | undefined): string | undefined {
  if (!input) {
    return undefined;
  }

  if (typeof input === "string") {
    return input;
  }

  return (
    input.ref ??
    input.source_ref ??
    input.guide_brief_ref ??
    input.capsule_id ??
    input.launch_card_id ??
    input.id
  );
}

function compact(values: Array<string | undefined>): string[] {
  return values.filter((value): value is string => Boolean(value));
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}
