import {
  AUTONOMY_CONTRACT_VERSION,
  AUTONOMY_FORBIDDEN_ACTIONS,
  AUTONOMY_MODES,
  type AutonomyContract,
  type AutonomyPublicSafetyBlock,
  type AutonomySourceRefs,
  type AutonomyStopCondition,
} from "@/types/autonomy-contract";
import {
  AUTONOMY_DRY_RUN_PLAN_VERSION,
  AUTONOMY_RUNNER_FORBIDDEN_ACTIONS,
  AUTONOMY_RUNNER_PREFLIGHT_ACTION_KINDS,
  AUTONOMY_RUNNER_PREFLIGHT_VERSION,
  type AutonomyActionScopeAssessment,
  type AutonomyAssessmentStatus,
  type AutonomyAuthorityAssessment,
  type AutonomyBudgetAssessment,
  type AutonomyDeltaMergeAssessment,
  type AutonomyDryRunPlan,
  type AutonomyReviewEscalationAssessment,
  type AutonomyRunBlocker,
  type AutonomyRunReadiness,
  type AutonomyRunStepActionKind,
  type AutonomyRunStepPreview,
  type AutonomyRunWarning,
  type AutonomyRunnerAssessmentSet,
  type AutonomyRunnerAuthorityBoundary,
  type AutonomyRunnerPreflight,
  type AutonomyRunnerPreflightInput,
  type AutonomyStalenessAssessment,
  type AutonomyStopConditionAssessment,
} from "@/types/autonomy-runner";

const FALLBACK_CREATED_AT = "1970-01-01T00:00:00.000Z" as const;
const FALLBACK_PREFLIGHT_ID =
  "autonomy_runner_preflight.unspecified" as const;
const FALLBACK_DRY_RUN_ID = "autonomy_dry_run_plan.unspecified" as const;
const FALLBACK_SOURCE_CONTRACT_ID = "autonomy_contract.unspecified" as const;

const PHASE_9A_FORBIDDEN_ACTIONS = uniqueSorted([
  ...AUTONOMY_RUNNER_FORBIDDEN_ACTIONS,
  ...AUTONOMY_FORBIDDEN_ACTIONS,
]);

const REQUIRED_PREFLIGHT_DOC_REFS = [
  "docs/AUTONOMY_CONTRACT_V0_1.md",
  "docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md",
  "docs/CODEX_AUTONOMY_CONTRACT_CONSUMPTION_V0_1.md",
  "docs/AUTHORITY_MATRIX.md",
] as const;

const AUTHORITY_FLAG_NAMES = [
  "source_of_truth",
  "can_start_runner",
  "can_schedule_runner",
  "can_start_daemon",
  "can_start_background_work",
  "can_commit_or_reject_state",
  "can_record_proof",
  "can_create_evidence",
  "can_update_work",
  "can_mutate_memory",
  "can_apply_project_perspective",
  "can_publish_external",
  "can_merge",
  "can_retry_replay_deploy",
  "can_call_github",
  "can_call_openai_or_provider",
  "can_execute_codex",
  "can_create_branch_or_pr",
  "can_send_handoff",
  "can_launch_codex",
  "can_launch_autonomy",
  "can_schedule_background_work",
  "can_create_mcp_tool",
  "can_create_ui_action",
  "can_post_external_comment",
  "can_write_db",
  "can_spend_budget",
  "can_auto_apply_delta",
] as const;

const FORBIDDEN_EXECUTION_PATTERNS = [
  /execute/i,
  /run\s+codex/i,
  /launch\s+codex/i,
  /launch\s+autonomy/i,
  /schedule/i,
  /daemon/i,
  /background/i,
  /call\s+github/i,
  /call\s+(openai|provider)/i,
  /write\s+(db|database|memory|state)/i,
  /record\s+proof/i,
  /create\s+evidence/i,
  /send\s+handoff/i,
  /create\s+(branch|pr|pull request)/i,
  /publish/i,
  /merge/i,
  /retry|replay|deploy/i,
  /spend\s+budget/i,
  /auto[-_ ]?apply/i,
] as const;

export function buildAutonomyRunnerPreflight(
  input: AutonomyRunnerPreflightInput,
): AutonomyRunnerPreflight {
  const contract = input.contract ?? null;
  const assessments = buildAssessments(input);
  const readiness = deriveAutonomyRunReadiness(assessments);
  const blockers = buildAutonomyRunBlockers(assessments);
  const warnings = buildAutonomyRunWarnings(assessments);
  const sourceRefs = buildPreflightSourceRefs(contract, input.source_refs);
  const requiredUserJudgment = uniqueSorted([
    ...(input.required_user_judgment ?? []),
    ...(input.blocking_user_judgment ?? []),
  ]);
  const requiredOperatorReview = uniqueSorted([
    ...(input.required_operator_review ?? []),
    ...warnings.map((warning) => warning.warning_id),
  ]);
  const nextPhaseNotes = buildNextPhaseNotes(input.next_phase_notes);

  return {
    runtime: "augnes",
    preflight_version: AUTONOMY_RUNNER_PREFLIGHT_VERSION,
    scope: stringOrFallback(input.scope ?? contract?.scope, "project:augnes"),
    preflight_id: input.preflight_id ?? FALLBACK_PREFLIGHT_ID,
    created_at: input.created_at ?? FALLBACK_CREATED_AT,
    source_contract_id: getSourceContractId(contract),
    source_contract_version: stringOrFallback(
      contract?.contract_version,
      "missing",
    ),
    readiness,
    readiness_summary: summarizeReadiness(readiness, blockers, warnings),
    contract_status: stringOrFallback(contract?.status, "missing"),
    autonomy_mode: stringOrFallback(contract?.autonomy_mode, "unknown"),
    budget_assessment: assessments.budget_assessment,
    action_scope_assessment: assessments.action_scope_assessment,
    delta_merge_assessment: assessments.delta_merge_assessment,
    review_escalation_assessment: assessments.review_escalation_assessment,
    stop_condition_assessment: assessments.stop_condition_assessment,
    staleness_assessment: assessments.staleness_assessment,
    authority_assessment: assessments.authority_assessment,
    blockers,
    warnings,
    required_user_judgment: requiredUserJudgment,
    required_operator_review: requiredOperatorReview,
    dry_run_plan: buildAutonomyDryRunPlan(input),
    source_refs: sourceRefs,
    authority_boundary: buildAutonomyPreflightAuthorityBoundary(),
    public_safety:
      input.public_safety ??
      normalizePublicSafety(contract?.public_safety) ??
      buildDefaultPublicSafetyBlock(),
    next_phase_notes: nextPhaseNotes,
  };
}

export function buildAutonomyDryRunPlan(
  input: AutonomyRunnerPreflightInput,
): AutonomyDryRunPlan {
  const contract = input.contract ?? null;
  const assessments = buildAssessments(input);
  const blockers = buildAutonomyRunBlockers(assessments);
  const warnings = buildAutonomyRunWarnings(assessments);
  const sourceRefs = buildPreflightSourceRefs(contract, input.source_refs);
  const runPreview = contract?.run_preview;
  const budget = contract?.budget;

  return {
    runtime: "augnes",
    dry_run_version: AUTONOMY_DRY_RUN_PLAN_VERSION,
    dry_run_id: input.dry_run_id ?? FALLBACK_DRY_RUN_ID,
    source_contract_id: getSourceContractId(contract),
    status: "dry_run_only",
    planned_steps: buildDryRunSteps({ contract, blockers, warnings, sourceRefs }),
    planned_read_sources: buildPlannedReadSources(contract, sourceRefs),
    proposed_delta_outputs: uniqueSorted([
      ...(runPreview?.proposed_delta_outputs ?? []),
      "needs_review delta candidate previews only",
      "blocked action summary preview only",
    ]),
    proposed_delta_batches: uniqueSorted([
      ...sourceRefs.batch_ids.map((batchId) => `${batchId} preview only`),
      "autonomy_dry_run_delta_batch.preview_only",
    ]),
    proposed_reports: uniqueSorted([
      ...(runPreview?.proposed_reports ?? []),
      "manual operator preflight report preview",
      "next phase readiness report preview",
    ]),
    proposed_review_queue_items: uniqueSorted([
      ...blockers.map((blocker) => blocker.blocker_id),
      ...warnings.map((warning) => warning.warning_id),
      ...(input.required_user_judgment ?? []),
      ...(input.required_operator_review ?? []),
    ]),
    blocked_steps: uniqueSorted([
      ...(runPreview?.blocked_steps ?? []),
      ...PHASE_9A_FORBIDDEN_ACTIONS,
    ]),
    required_preconditions: uniqueSorted([
      ...(runPreview?.required_preconditions ?? []),
      "Phase 9A remains dry-run only.",
      "Every future execution step requires separate explicit scope and approval.",
      ...buildAssessmentPreconditions(assessments),
    ]),
    required_checks: uniqueSorted([
      ...(contract?.validation_policy?.required_checks ?? []),
      "npm run smoke:autonomy-runner-preflight-v0-1",
    ]),
    stop_conditions: uniqueSorted(
      (contract?.stop_conditions ?? []).map((condition) =>
        stringOrFallback(condition.stop_condition_id, condition.kind),
      ),
    ),
    budget_projection: {
      budget_id: stringOrFallback(budget?.budget_id, "missing_budget"),
      time_limit_minutes: numberOrNull(budget?.time_limit_minutes),
      max_iterations: numberOrNull(budget?.max_iterations),
      max_tool_calls: numberOrNull(budget?.max_tool_calls),
      max_codex_tasks: numberOrNull(budget?.max_codex_tasks),
      max_prs: numberOrNull(budget?.max_prs),
      max_file_changes: numberOrNull(budget?.max_file_changes),
      would_spend_budget: false,
      budget_boundary_notes: [
        ...(budget?.budget_boundary_notes ?? []),
        "Dry-run plan does not spend budget.",
      ],
    },
    no_run_boundary: buildAutonomyPreflightAuthorityBoundary(),
    next_phase_notes: buildNextPhaseNotes(input.next_phase_notes),
  };
}

export function assessAutonomyBudget(
  contract: Partial<AutonomyContract> | null | undefined,
  input: Pick<
    AutonomyRunnerPreflightInput,
    "budget_approved" | "budget_usage"
  > = {},
): AutonomyBudgetAssessment {
  const unsupported = getUnsupportedReasons(contract);
  if (unsupported.length > 0) {
    return {
      status: "not_supported",
      budget_id: "missing_budget",
      budget_present: false,
      budget_complete: false,
      budget_approved: false,
      budget_exceeded: false,
      would_spend_budget: false,
      requires_budget_refresh: true,
      blocks_run: false,
      requires_review: false,
      summary: unsupported.join("; "),
      source_refs: ["AutonomyContract"],
    };
  }

  const budget = contract?.budget;
  const budgetId = stringOrFallback(budget?.budget_id, "missing_budget");
  const budgetPresent = Boolean(budget);
  const budgetComplete =
    budgetPresent &&
    !budgetId.includes("unspecified") &&
    typeof budget?.time_limit_minutes === "number" &&
    budget.time_limit_minutes > 0 &&
    typeof budget.max_iterations === "number" &&
    typeof budget.max_tool_calls === "number" &&
    typeof budget.max_codex_tasks === "number" &&
    typeof budget.max_prs === "number" &&
    typeof budget.max_file_changes === "number";
  const budgetExceeded = isBudgetExceeded(budget, input.budget_usage);
  const budgetApproved = input.budget_approved === true;
  const blocksRun = !budgetPresent || !budgetComplete || budgetExceeded;
  const requiresReview = !blocksRun && !budgetApproved;
  const status = assessmentStatus({ blocksRun, requiresReview });

  return {
    status,
    budget_id: budgetId,
    budget_present: budgetPresent,
    budget_complete: budgetComplete,
    budget_approved: budgetApproved,
    budget_exceeded: budgetExceeded,
    would_spend_budget: false,
    requires_budget_refresh: blocksRun || requiresReview,
    blocks_run: blocksRun,
    requires_review: requiresReview,
    summary: blocksRun
      ? "Budget is missing, incomplete, or exceeded; future runner is blocked."
      : requiresReview
        ? "Budget is present but not operator-approved; future runner needs review."
        : "Budget is present, within limits, and operator-approved for future supervised review.",
    source_refs: ["AutonomyBudget"],
  };
}

export function assessAutonomyActionScope(
  contract: Partial<AutonomyContract> | null | undefined,
): AutonomyActionScopeAssessment {
  const unsupported = getUnsupportedReasons(contract);
  if (unsupported.length > 0) {
    return {
      status: "not_supported",
      allowed_dry_run_action_kinds: [...AUTONOMY_RUNNER_PREFLIGHT_ACTION_KINDS],
      contract_allowed_actions: [],
      contract_forbidden_actions: [],
      requested_forbidden_actions: [],
      forbidden_execution_terms: [],
      codex_or_handoff_preview_requires_future_approval: false,
      run_preview_status: "missing",
      blocks_run: false,
      requires_review: false,
      summary: unsupported.join("; "),
      source_refs: ["AutonomyContract"],
    };
  }

  const allowedActions = contract?.allowed_actions ?? [];
  const forbiddenActions = contract?.forbidden_actions ?? [];
  const requestedForbiddenActions = uniqueSorted(
    allowedActions.filter((action) => PHASE_9A_FORBIDDEN_ACTIONS.includes(action)),
  );
  const forbiddenExecutionTerms = findForbiddenExecutionTerms(
    contract?.run_preview?.planned_steps ?? [],
  );
  const runPreviewStatus = stringOrFallback(
    contract?.run_preview?.status,
    "missing",
  );
  const invalidRunPreviewStatus = runPreviewStatus !== "preview_only";
  const codexOrHandoffPreviewRequiresFutureApproval = allowedActions.some(
    (action) =>
      action === "prepare_codex_handoff_preview" ||
      action === "read_handoff_capsule_preview" ||
      action === "read_codex_launch_card_preview",
  );
  const blocksRun =
    requestedForbiddenActions.length > 0 ||
    forbiddenExecutionTerms.length > 0 ||
    invalidRunPreviewStatus;
  const requiresReview =
    !blocksRun && codexOrHandoffPreviewRequiresFutureApproval;
  const status = assessmentStatus({ blocksRun, requiresReview });

  return {
    status,
    allowed_dry_run_action_kinds: [...AUTONOMY_RUNNER_PREFLIGHT_ACTION_KINDS],
    contract_allowed_actions: [...allowedActions],
    contract_forbidden_actions: [...forbiddenActions],
    requested_forbidden_actions: requestedForbiddenActions,
    forbidden_execution_terms: forbiddenExecutionTerms,
    codex_or_handoff_preview_requires_future_approval:
      codexOrHandoffPreviewRequiresFutureApproval,
    run_preview_status: runPreviewStatus,
    blocks_run: blocksRun,
    requires_review: requiresReview,
    summary: blocksRun
      ? "Contract requests execution, scheduling, write, or external behavior that Phase 9A blocks."
      : requiresReview
        ? "Codex/Handoff preview steps remain future-supervised and need operator review before any later runner."
        : "Action scope is limited to Phase 9A dry-run/read/evaluate/report actions.",
    source_refs: ["allowed_actions", "run_preview"],
  };
}

export function assessAutonomyDeltaMergePolicy(
  contract: Partial<AutonomyContract> | null | undefined,
): AutonomyDeltaMergeAssessment {
  const unsupported = getUnsupportedReasons(contract);
  if (unsupported.length > 0) {
    return {
      status: "not_supported",
      policy_id: "missing_delta_merge_policy",
      default_delta_status: "missing",
      auto_apply_allowed: false,
      auto_apply_targets: [],
      review_required_targets: [],
      blocked_targets: [],
      proposed_outputs_are_review_only: false,
      blocks_run: false,
      requires_review: false,
      summary: unsupported.join("; "),
      source_refs: ["AutonomyContract"],
    };
  }

  const policy = contract?.delta_merge_policy;
  const autoApplyAllowed = policy?.auto_apply_allowed === true;
  const autoApplyTargets = policy?.auto_apply_targets ?? [];
  const policyMissing = !policy;
  const blocksRun =
    policyMissing || autoApplyAllowed || autoApplyTargets.length > 0;
  const requiresReview =
    !blocksRun && policy?.default_delta_status !== "needs_review";
  const status = assessmentStatus({ blocksRun, requiresReview });

  return {
    status,
    policy_id: stringOrFallback(policy?.policy_id, "missing_delta_merge_policy"),
    default_delta_status: policy?.default_delta_status ?? "missing",
    auto_apply_allowed: autoApplyAllowed,
    auto_apply_targets: [...autoApplyTargets],
    review_required_targets: [...(policy?.review_required_targets ?? [])],
    blocked_targets: [...(policy?.blocked_targets ?? [])],
    proposed_outputs_are_review_only:
      !blocksRun && policy?.default_delta_status === "needs_review",
    blocks_run: blocksRun,
    requires_review: requiresReview,
    summary: blocksRun
      ? "Delta merge policy is missing or requests auto-apply; future runner is blocked."
      : requiresReview
        ? "Delta merge policy is present but needs operator review before future runner use."
        : "Delta merge policy keeps auto_apply_allowed false and outputs review-only.",
    source_refs: ["delta_merge_policy"],
  };
}

export function assessAutonomyReviewEscalation(
  contract: Partial<AutonomyContract> | null | undefined,
  input: Pick<
    AutonomyRunnerPreflightInput,
    | "blocking_user_judgment"
    | "required_operator_review"
    | "required_user_judgment"
  > = {},
): AutonomyReviewEscalationAssessment {
  const unsupported = getUnsupportedReasons(contract);
  if (unsupported.length > 0) {
    return {
      status: "not_supported",
      escalation_id: "missing_review_escalation_policy",
      required_user_judgment: [],
      blocking_user_judgment: [],
      required_operator_review: [],
      blocks_run: false,
      requires_review: false,
      summary: unsupported.join("; "),
      source_refs: ["AutonomyContract"],
    };
  }

  const policy = contract?.review_escalation_policy;
  const contractStatus = stringOrFallback(contract?.status, "missing");
  const requiredUserJudgment = input.required_user_judgment ?? [];
  const blockingUserJudgment = input.blocking_user_judgment ?? [];
  const requiredOperatorReview = uniqueSorted([
    ...(input.required_operator_review ?? []),
    ...(contractStatus === "draft" ||
    contractStatus === "preview_only" ||
    contractStatus === "needs_review"
      ? [`contract_status.${contractStatus}`]
      : []),
  ]);
  const policyMissing = !policy;
  const contractBlocked = contractStatus === "blocked";
  const blocksRun =
    policyMissing || contractBlocked || blockingUserJudgment.length > 0;
  const requiresReview =
    !blocksRun &&
    (requiredUserJudgment.length > 0 || requiredOperatorReview.length > 0);
  const status = assessmentStatus({ blocksRun, requiresReview });

  return {
    status,
    escalation_id: stringOrFallback(
      policy?.escalation_id,
      "missing_review_escalation_policy",
    ),
    required_user_judgment: [...requiredUserJudgment],
    blocking_user_judgment: [...blockingUserJudgment],
    required_operator_review: requiredOperatorReview,
    blocks_run: blocksRun,
    requires_review: requiresReview,
    summary: blocksRun
      ? "Review escalation policy is missing, contract is blocked, or blocking user judgment is unresolved."
      : requiresReview
        ? "Review escalation is required before any future supervised runner."
        : "No unresolved review escalation blocks the dry-run preflight.",
    source_refs: ["review_escalation_policy", "contract_status"],
  };
}

export function assessAutonomyStopConditions(
  contract: Partial<AutonomyContract> | null | undefined,
  input: Pick<AutonomyRunnerPreflightInput, "triggered_stop_condition_ids"> = {},
): AutonomyStopConditionAssessment {
  const unsupported = getUnsupportedReasons(contract);
  if (unsupported.length > 0) {
    return {
      status: "not_supported",
      triggered_stop_condition_ids: [],
      blocking_triggered_stop_condition_ids: [],
      review_triggered_stop_condition_ids: [],
      stop_condition_count: 0,
      blocks_run: false,
      requires_review: false,
      summary: unsupported.join("; "),
      source_refs: ["AutonomyContract"],
    };
  }

  const conditions = contract?.stop_conditions ?? [];
  const triggeredIds = input.triggered_stop_condition_ids ?? [];
  const triggeredConditions = conditions.filter((condition) =>
    triggeredIds.includes(condition.stop_condition_id),
  );
  const blockingTriggered = triggeredConditions.filter(
    (condition) =>
      condition.blocks_future_run || condition.severity === "blocking",
  );
  const reviewTriggered = triggeredConditions.filter(
    (condition) =>
      !blockingTriggered.includes(condition) &&
      (condition.severity === "high" || condition.severity === "medium"),
  );
  const blocksRun = blockingTriggered.length > 0;
  const requiresReview = !blocksRun && reviewTriggered.length > 0;
  const status = assessmentStatus({ blocksRun, requiresReview });

  return {
    status,
    triggered_stop_condition_ids: [...triggeredIds],
    blocking_triggered_stop_condition_ids: blockingTriggered.map(
      (condition) => condition.stop_condition_id,
    ),
    review_triggered_stop_condition_ids: reviewTriggered.map(
      (condition) => condition.stop_condition_id,
    ),
    stop_condition_count: conditions.length,
    blocks_run: blocksRun,
    requires_review: requiresReview,
    summary: blocksRun
      ? "At least one blocking stop condition is triggered."
      : requiresReview
        ? "A review-level stop condition is triggered."
        : "No triggered stop condition blocks this dry-run preflight.",
    source_refs: ["stop_conditions"],
  };
}

export function assessAutonomyStaleness(
  contract: Partial<AutonomyContract> | null | undefined,
): AutonomyStalenessAssessment {
  const unsupported = getUnsupportedReasons(contract);
  if (unsupported.length > 0) {
    return {
      status: "not_supported",
      freshness: "missing",
      fresh_snapshot_required: false,
      stale_context_blocks_run: false,
      refresh_required_sources: [],
      blocks_run: false,
      requires_review: false,
      summary: unsupported.join("; "),
      source_refs: ["AutonomyContract"],
    };
  }

  const freshness = contract?.context_scope?.freshness ?? "missing";
  const policy = contract?.staleness_policy;
  const freshSnapshotRequired = policy?.fresh_snapshot_required === true;
  const staleContextBlocksRun =
    policy?.stale_context_blocks_future_run === true;
  const blocksRun = freshness === "stale" && staleContextBlocksRun;
  const requiresReview =
    !blocksRun &&
    (freshness === "partial" ||
      freshness === "unknown" ||
      freshness === "missing" ||
      (freshSnapshotRequired && freshness !== "fresh"));
  const status = assessmentStatus({ blocksRun, requiresReview });

  return {
    status,
    freshness,
    fresh_snapshot_required: freshSnapshotRequired,
    stale_context_blocks_run: staleContextBlocksRun,
    refresh_required_sources: [...(policy?.refresh_required_sources ?? [])],
    blocks_run: blocksRun,
    requires_review: requiresReview,
    summary: blocksRun
      ? "Stale context blocks future runner consideration."
      : requiresReview
        ? "Context freshness is partial, unknown, or missing; refresh/review is required."
        : "Context freshness is acceptable for future supervised review.",
    source_refs: ["context_scope", "staleness_policy"],
  };
}

export function assessAutonomyAuthority(
  contract: Partial<AutonomyContract> | null | undefined,
): AutonomyAuthorityAssessment {
  const unsupported = getUnsupportedReasons(contract);
  const missingCoreFields = getMissingCoreFields(contract);
  const boundary = contract?.authority_boundary;
  const boundaryPresent = Boolean(boundary);
  const unexpectedAuthorityGrants = boundary
    ? Object.entries(boundary)
        .filter(([key, value]) => key !== "notes" && value === true)
        .map(([key]) => key)
    : [];
  const sourceBoundaryClear =
    boundaryPresent && unexpectedAuthorityGrants.length === 0;
  const missingEnoughCoreFields = missingCoreFields.length >= 3;
  const notSupported = unsupported.length > 0 || missingEnoughCoreFields;
  const blocksRun =
    !notSupported && (!boundaryPresent || unexpectedAuthorityGrants.length > 0);
  const requiresReview = !notSupported && !blocksRun && missingCoreFields.length > 0;
  const status: AutonomyAssessmentStatus = notSupported
    ? "not_supported"
    : assessmentStatus({ blocksRun, requiresReview });

  return {
    status,
    source_contract_boundary_present: boundaryPresent,
    source_contract_boundary_clear: sourceBoundaryClear,
    preflight_boundary_all_false: true,
    missing_core_fields: missingCoreFields,
    unsupported_reasons: unsupported,
    unexpected_authority_grants: unexpectedAuthorityGrants,
    denied_authority_flags: [...AUTHORITY_FLAG_NAMES],
    blocks_run: blocksRun,
    requires_review: requiresReview,
    summary: notSupported
      ? uniqueSorted([...unsupported, ...missingCoreFields]).join("; ")
      : blocksRun
        ? "Authority boundary is missing or grants execution/write/schedule/external authority."
        : requiresReview
          ? "Authority boundary is clear, but some core fields are missing and need review."
          : "Authority boundary is explicit and preflight denies all execution/write/schedule/external flags.",
    source_refs: ["authority_boundary"],
  };
}

export function deriveAutonomyRunReadiness(
  assessments: AutonomyRunnerAssessmentSet,
): AutonomyRunReadiness {
  const values = Object.values(assessments);
  if (values.some((assessment) => assessment.status === "not_supported")) {
    return "not_supported";
  }

  if (values.some((assessment) => assessment.blocks_run)) {
    return "blocked";
  }

  if (values.some((assessment) => assessment.requires_review)) {
    return "needs_review";
  }

  return "ready_for_future_supervised_runner";
}

export function buildAutonomyRunBlockers(
  assessments: AutonomyRunnerAssessmentSet,
): AutonomyRunBlocker[] {
  return compact([
    buildBlocker("budget", assessments.budget_assessment),
    buildBlocker("action_scope", assessments.action_scope_assessment),
    buildBlocker("delta_merge_policy", assessments.delta_merge_assessment),
    buildBlocker(
      "review_escalation",
      assessments.review_escalation_assessment,
    ),
    buildBlocker("stop_condition", assessments.stop_condition_assessment),
    buildBlocker("staleness", assessments.staleness_assessment),
    buildBlocker("authority", assessments.authority_assessment),
  ]);
}

export function buildAutonomyRunWarnings(
  assessments: AutonomyRunnerAssessmentSet,
): AutonomyRunWarning[] {
  const warnings = compact([
    buildWarning("budget", assessments.budget_assessment),
    buildWarning("action_scope", assessments.action_scope_assessment),
    buildWarning("delta_merge_policy", assessments.delta_merge_assessment),
    buildWarning(
      "review_escalation",
      assessments.review_escalation_assessment,
    ),
    buildWarning("stop_condition", assessments.stop_condition_assessment),
    buildWarning("staleness", assessments.staleness_assessment),
    buildWarning("authority", assessments.authority_assessment),
  ]);

  warnings.push({
    warning_id: "phase_9a_dry_run_only",
    kind: "phase_boundary",
    severity: "medium",
    summary:
      "Phase 9A can build a preflight and dry-run plan only; no runner starts.",
    source_refs: ["docs/AUTONOMY_RUNNER_PREFLIGHT_V0_1.md"],
    review_hint:
      "Keep any execution, scheduler, daemon, route, UI, App/MCP, DB, provider, GitHub, proof/evidence, memory, Perspective, handoff, auto-apply, or external behavior for a separate explicit phase.",
  });

  return warnings;
}

export function buildAutonomyPreflightAuthorityBoundary(): AutonomyRunnerAuthorityBoundary {
  return {
    source_of_truth: false,
    can_start_runner: false,
    can_schedule_runner: false,
    can_start_daemon: false,
    can_start_background_work: false,
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
    can_spend_budget: false,
    can_auto_apply_delta: false,
    notes: [
      "Phase 9A preflight is dry-run only.",
      "Preflight does not start runner.",
      "Dry-run plan does not execute.",
      "No scheduler, daemon, or background work is created.",
      "No Codex, GitHub, OpenAI, provider, DB, proof, evidence, memory, Perspective, handoff, auto-apply, publish, merge, retry, replay, deploy, or external side effect authority is granted.",
    ],
  };
}

function buildAssessments(
  input: AutonomyRunnerPreflightInput,
): AutonomyRunnerAssessmentSet {
  const contract = input.contract ?? null;
  return {
    budget_assessment: assessAutonomyBudget(contract, input),
    action_scope_assessment: assessAutonomyActionScope(contract),
    delta_merge_assessment: assessAutonomyDeltaMergePolicy(contract),
    review_escalation_assessment: assessAutonomyReviewEscalation(
      contract,
      input,
    ),
    stop_condition_assessment: assessAutonomyStopConditions(contract, input),
    staleness_assessment: assessAutonomyStaleness(contract),
    authority_assessment: assessAutonomyAuthority(contract),
  };
}

function buildDryRunSteps({
  contract,
  blockers,
  warnings,
  sourceRefs,
}: {
  contract: Partial<AutonomyContract> | null;
  blockers: AutonomyRunBlocker[];
  warnings: AutonomyRunWarning[];
  sourceRefs: AutonomySourceRefs;
}): AutonomyRunStepPreview[] {
  const globalBlockedBy =
    contract && blockers.length === 0
      ? []
      : blockers.map((blocker) => blocker.blocker_id);
  const unsupportedBlocked = blockers.some(
    (blocker) => blocker.kind === "not_supported",
  );
  const warningReview = warnings.length > 0;
  const docsRefs = sourceRefs.docs_refs;

  const steps: Array<{
    action_kind: AutonomyRunStepActionKind;
    title: string;
    summary: string;
    expected_output: string;
  }> = [
    {
      action_kind: "read_contract",
      title: "Read source Autonomy Contract",
      summary:
        "Inspect the supplied AutonomyContract object as preview input only.",
      expected_output: "Source contract id, version, status, mode, and refs.",
    },
    {
      action_kind: "read_preview_inputs",
      title: "Read preview input refs",
      summary:
        "List GuideBrief, Handoff Capsule, Codex Launch Card, Current Working Perspective, Delta Projection, docs, and repo refs without collecting data.",
      expected_output: "Bounded source-ref inventory.",
    },
    {
      action_kind: "evaluate_budget",
      title: "Evaluate budget boundary",
      summary:
        "Classify whether the supplied budget is present, complete, approved, exceeded, or review-bound.",
      expected_output: "Budget assessment with no spend.",
    },
    {
      action_kind: "evaluate_stop_conditions",
      title: "Evaluate stop conditions",
      summary:
        "Classify triggered stop conditions supplied by input without running checks.",
      expected_output: "Stop condition assessment.",
    },
    {
      action_kind: "evaluate_review_escalation",
      title: "Evaluate review escalation",
      summary:
        "Surface required user judgment and operator review without deciding it.",
      expected_output: "Review escalation assessment.",
    },
    {
      action_kind: "rank_candidate_steps",
      title: "Rank candidate dry-run steps",
      summary:
        "Rank preview-only read/evaluate/report steps and leave execution future-only.",
      expected_output: "Ordered dry-run step previews.",
    },
    {
      action_kind: "build_dry_run_plan",
      title: "Build dry-run plan",
      summary:
        "Assemble a dry-run-only plan with would_execute false on every step.",
      expected_output: "AutonomyDryRunPlan preview.",
    },
    {
      action_kind: "draft_report_preview",
      title: "Draft report preview",
      summary:
        "Prepare a manual operator report preview with blockers, warnings, skipped checks, and next-phase notes.",
      expected_output: "Manual report preview outline.",
    },
  ];

  return steps.map((step, index) => ({
    step_id: `dry_run_step.${String(index + 1).padStart(2, "0")}.${step.action_kind}`,
    title: step.title,
    summary: step.summary,
    action_kind: step.action_kind,
    allowed_by_contract:
      AUTONOMY_RUNNER_PREFLIGHT_ACTION_KINDS.includes(step.action_kind) &&
      contract !== null &&
      !unsupportedBlocked,
    blocked_by: globalBlockedBy,
    source_refs: uniqueSorted([...docsRefs, "AutonomyContract"]),
    expected_output: step.expected_output,
    would_require_review: warningReview || globalBlockedBy.length > 0,
    would_execute: false,
  }));
}

function buildPlannedReadSources(
  contract: Partial<AutonomyContract> | null,
  sourceRefs: AutonomySourceRefs,
): string[] {
  return uniqueSorted([
    ...(contract?.run_preview?.allowed_read_sources ?? []),
    ...sourceRefs.guide_brief_refs,
    ...sourceRefs.handoff_capsule_refs,
    ...sourceRefs.codex_launch_card_refs,
    ...sourceRefs.current_working_perspective_refs,
    ...sourceRefs.delta_projection_refs,
    ...sourceRefs.workplane_refs,
    ...sourceRefs.docs_refs,
    ...sourceRefs.repo_refs,
  ]);
}

function buildAssessmentPreconditions(
  assessments: AutonomyRunnerAssessmentSet,
): string[] {
  return uniqueSorted(
    Object.values(assessments).flatMap((assessment) => {
      if (assessment.status === "not_supported") {
        return [
          `Provide supported input for ${assessment.source_refs[0] ?? "assessment"}; preflight cannot reason.`,
        ];
      }
      if (assessment.blocks_run) {
        return [`Resolve ${assessment.source_refs[0] ?? "assessment"} blocker.`];
      }
      if (assessment.requires_review) {
        return [`Review ${assessment.source_refs[0] ?? "assessment"} before future runner.`];
      }
      return [];
    }),
  );
}

function buildPreflightSourceRefs(
  contract: Partial<AutonomyContract> | null,
  inputRefs: Partial<AutonomySourceRefs> | undefined,
): AutonomySourceRefs {
  const contractRefs: Partial<AutonomySourceRefs> =
    contract?.source_refs ?? {};
  return {
    guide_brief_refs: uniqueSorted([
      ...(contractRefs.guide_brief_refs ?? []),
      ...(inputRefs?.guide_brief_refs ?? []),
    ]),
    handoff_capsule_refs: uniqueSorted([
      ...(contractRefs.handoff_capsule_refs ?? []),
      ...(inputRefs?.handoff_capsule_refs ?? []),
    ]),
    codex_launch_card_refs: uniqueSorted([
      ...(contractRefs.codex_launch_card_refs ?? []),
      ...(inputRefs?.codex_launch_card_refs ?? []),
    ]),
    current_working_perspective_refs: uniqueSorted([
      ...(contractRefs.current_working_perspective_refs ?? []),
      ...(inputRefs?.current_working_perspective_refs ?? []),
    ]),
    delta_projection_refs: uniqueSorted([
      ...(contractRefs.delta_projection_refs ?? []),
      ...(inputRefs?.delta_projection_refs ?? []),
    ]),
    workplane_refs: uniqueSorted([
      ...(contractRefs.workplane_refs ?? []),
      ...(inputRefs?.workplane_refs ?? []),
    ]),
    delta_ids: uniqueSorted([
      ...(contractRefs.delta_ids ?? []),
      ...(inputRefs?.delta_ids ?? []),
    ]),
    batch_ids: uniqueSorted([
      ...(contractRefs.batch_ids ?? []),
      ...(inputRefs?.batch_ids ?? []),
    ]),
    evidence_refs: uniqueSorted([
      ...(contractRefs.evidence_refs ?? []),
      ...(inputRefs?.evidence_refs ?? []),
    ]),
    artifact_refs: uniqueSorted([
      ...(contractRefs.artifact_refs ?? []),
      ...(inputRefs?.artifact_refs ?? []),
    ]),
    handoff_refs: uniqueSorted([
      ...(contractRefs.handoff_refs ?? []),
      ...(inputRefs?.handoff_refs ?? []),
    ]),
    diagnostic_refs: uniqueSorted([
      ...(contractRefs.diagnostic_refs ?? []),
      ...(inputRefs?.diagnostic_refs ?? []),
    ]),
    route_refs: uniqueSorted([
      ...(contractRefs.route_refs ?? []),
      ...(inputRefs?.route_refs ?? []),
    ]),
    docs_refs: uniqueSorted([
      ...(contractRefs.docs_refs ?? []),
      ...(inputRefs?.docs_refs ?? []),
      ...REQUIRED_PREFLIGHT_DOC_REFS,
    ]),
    repo_refs: uniqueSorted([
      ...(contractRefs.repo_refs ?? []),
      ...(inputRefs?.repo_refs ?? []),
    ]),
  };
}

function buildBlocker(
  kind: AutonomyRunBlocker["kind"],
  assessment: {
    status: AutonomyAssessmentStatus;
    blocks_run: boolean;
    summary: string;
    source_refs: string[];
  },
): AutonomyRunBlocker | undefined {
  const notSupported = assessment.status === "not_supported";
  if (!assessment.blocks_run && !notSupported) {
    return undefined;
  }
  const blockerKind = notSupported ? "not_supported" : kind;

  return {
    blocker_id: notSupported ? `blocker.not_supported.${kind}` : `blocker.${kind}`,
    kind: blockerKind,
    severity: "blocking",
    summary: notSupported
      ? `not_supported: ${assessment.summary || "Preflight cannot reason safely."}`
      : assessment.summary,
    source_refs: assessment.source_refs,
    recovery_hint: notSupported
      ? "Provide a supported AutonomyContract v0.1 with required fields so preflight can reason before considering any future supervised runner."
      : "Resolve this blocker and rerun preflight before considering a future supervised runner.",
  };
}

function buildWarning(
  kind: AutonomyRunWarning["kind"],
  assessment: {
    requires_review: boolean;
    summary: string;
    source_refs: string[];
  },
): AutonomyRunWarning | undefined {
  if (!assessment.requires_review) {
    return undefined;
  }

  return {
    warning_id: `warning.${kind}`,
    kind,
    severity: "medium",
    summary: assessment.summary,
    source_refs: assessment.source_refs,
    review_hint:
      "Carry this item into manual operator review before any future supervised runner phase.",
  };
}

function summarizeReadiness(
  readiness: AutonomyRunReadiness,
  blockers: AutonomyRunBlocker[],
  warnings: AutonomyRunWarning[],
): string {
  if (readiness === "not_supported") {
    return "Preflight cannot reason safely because the source contract is unsupported or missing required fields.";
  }

  if (readiness === "blocked") {
    return `Preflight is blocked by ${blockers.length} blocker(s). No run starts.`;
  }

  if (readiness === "needs_review") {
    return `Preflight needs review for ${warnings.length} warning(s). No run starts.`;
  }

  return "Preflight is ready for a future supervised runner phase only. No run starts in Phase 9A.";
}

function buildNextPhaseNotes(inputNotes: string[] | undefined): string[] {
  return inputNotes ?? [
    "Phase 9A is preflight/dry-run only.",
    "ready_for_future_supervised_runner still means no run starts in Phase 9A.",
    "Recommended next phase: Phase 9B - Autonomy Runner Preflight GET-only read route v0.1.",
  ];
}

function getUnsupportedReasons(
  contract: Partial<AutonomyContract> | null | undefined,
): string[] {
  const reasons: string[] = [];
  if (!contract) {
    return ["AutonomyContract input is missing."];
  }

  if (contract.contract_version !== AUTONOMY_CONTRACT_VERSION) {
    reasons.push(
      `Unsupported contract version: ${stringOrFallback(contract.contract_version, "missing")}.`,
    );
  }

  if (
    !contract.autonomy_mode ||
    !AUTONOMY_MODES.includes(
      contract.autonomy_mode as (typeof AUTONOMY_MODES)[number],
    )
  ) {
    reasons.push(
      `Unsupported autonomy mode: ${stringOrFallback(contract.autonomy_mode, "missing")}.`,
    );
  }

  return reasons;
}

function getMissingCoreFields(
  contract: Partial<AutonomyContract> | null | undefined,
): string[] {
  if (!contract) {
    return ["contract"];
  }

  return [
    ["scope", contract.scope],
    ["contract_id", contract.contract_id],
    ["status", contract.status],
    ["source_refs", contract.source_refs],
    ["budget", contract.budget],
    ["delta_merge_policy", contract.delta_merge_policy],
    ["review_escalation_policy", contract.review_escalation_policy],
    ["stop_conditions", contract.stop_conditions],
    ["staleness_policy", contract.staleness_policy],
    ["run_preview", contract.run_preview],
    ["authority_boundary", contract.authority_boundary],
  ]
    .filter(([, value]) => value === undefined || value === null)
    .map(([field]) => String(field));
}

function isBudgetExceeded(
  budget: Partial<AutonomyContract["budget"]> | undefined,
  usage: AutonomyRunnerPreflightInput["budget_usage"],
): boolean {
  if (!budget || !usage) {
    return false;
  }

  return (
    exceedsLimit(usage.elapsed_minutes, budget.time_limit_minutes) ||
    exceedsLimit(usage.iterations_used, budget.max_iterations) ||
    exceedsLimit(usage.tool_calls_used, budget.max_tool_calls) ||
    exceedsLimit(usage.codex_tasks_used, budget.max_codex_tasks) ||
    exceedsLimit(usage.prs_used, budget.max_prs) ||
    exceedsLimit(usage.file_changes_used, budget.max_file_changes) ||
    exceedsLimit(usage.cost_used, budget.cost_budget?.amount)
  );
}

function exceedsLimit(
  used: number | undefined,
  limit: number | null | undefined,
): boolean {
  return typeof used === "number" && typeof limit === "number" && used > limit;
}

function findForbiddenExecutionTerms(values: string[]): string[] {
  return uniqueSorted(
    values.flatMap((value) =>
      FORBIDDEN_EXECUTION_PATTERNS.filter((pattern) =>
        pattern.test(value),
      ).map((pattern) => pattern.source),
    ),
  );
}

function assessmentStatus({
  blocksRun,
  requiresReview,
}: {
  blocksRun: boolean;
  requiresReview: boolean;
}): AutonomyAssessmentStatus {
  if (blocksRun) {
    return "blocked";
  }
  if (requiresReview) {
    return "needs_review";
  }
  return "pass";
}

function getSourceContractId(
  contract: Partial<AutonomyContract> | null,
): string {
  return stringOrFallback(contract?.contract_id, FALLBACK_SOURCE_CONTRACT_ID);
}

function normalizePublicSafety(
  safety: AutonomyPublicSafetyBlock | undefined,
): AutonomyPublicSafetyBlock | undefined {
  return safety;
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

function stringOrFallback(
  value: string | undefined | null,
  fallback: string,
): string {
  return value && value.length > 0 ? value : fallback;
}

function numberOrNull(value: number | undefined | null): number | null {
  return typeof value === "number" ? value : null;
}

function compact<T>(values: Array<T | undefined>): T[] {
  return values.filter((value): value is T => value !== undefined);
}

function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
}
