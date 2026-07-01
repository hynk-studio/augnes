import {
  CODEX_LAUNCH_CARD_VERSION,
  HANDOFF_CAPSULE_VERSION,
  type CodexLaunchCard,
  type CodexLaunchCardAuthorityBoundary,
  type CodexLaunchCardInput,
  type CodexSuggestionForCodex,
  type HandoffCapsule,
  type HandoffCapsuleAuthorityBoundary,
  type HandoffCapsuleInput,
  type HandoffConstraintSet,
  type HandoffGap,
  type HandoffInferredContextItem,
  type HandoffJudgmentContextItem,
  type HandoffObservedContextItem,
  type HandoffPublicSafetyBlock,
  type HandoffSelectedDeltaRef,
  type HandoffSelectionInput,
  type HandoffSourceRefs,
  type HandoffStaleness,
  type HandoffSuggestedContextItem,
  type HandoffTargetRendering,
  type HandoffValidationExpectations,
} from "@/types/handoff-capsule";
import type { GuideBrief } from "@/types/guide-brief";

const FALLBACK_CREATED_AT = "1970-01-01T00:00:00.000Z" as const;
const FALLBACK_CAPSULE_ID = "handoff_capsule.unspecified" as const;
const FALLBACK_LAUNCH_CARD_ID = "codex_launch_card.unspecified" as const;

const REQUIRED_DOCS_REFS = [
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md",
  "docs/CODEX_GUIDEBRIEF_HANDOFF_V0_1.md",
  "docs/AUGNES_CODEX_WORKER_BOOTSTRAP_V0_1.md",
  "docs/AUGNES_CODEX_RESULT_REPORT_TEMPLATE_V0_1.md",
  "docs/AUTHORITY_MATRIX.md",
] as const;

const DEFAULT_FORBIDDEN_ACTIONS = [
  "Do not send handoffs.",
  "Do not launch Codex.",
  "Do not execute Codex.",
  "Do not create branches or PRs from Augnes product code.",
  "Do not call GitHub from Augnes product code.",
  "Do not call providers or OpenAI.",
  "Do not write proof or evidence.",
  "Do not mutate DB state.",
  "Do not mutate memory.",
  "Do not apply durable Perspective state.",
  "Do not add product-write behavior.",
  "Do not add scheduler or autonomy runner behavior.",
  "Do not merge, publish, retry, replay, or deploy.",
] as const;

const DEFAULT_PUBLIC_SAFETY_LINES = [
  "No private conversation.",
  "No hidden reasoning.",
  "No local private paths.",
  "No secrets or tokens.",
  "No raw provider output.",
  "No raw retrieval output.",
  "No real account artifacts.",
] as const;

export function buildHandoffCapsule(
  input: HandoffCapsuleInput,
): HandoffCapsule {
  const selections = input.selections ?? {};
  const sourceRefs =
    input.source_refs ??
    buildHandoffSourceRefs(input.guide_brief, {
      ...selections,
      guide_brief_ref:
        input.source_guide_brief_ref ?? selections.guide_brief_ref,
    });
  const observed =
    input.observed_context ??
    buildHandoffObservedContext(input.guide_brief, selections);
  const inferred =
    input.inferred_context ??
    buildHandoffInferredContext(input.guide_brief, selections);
  const suggested =
    input.suggested_context ??
    buildHandoffSuggestedContext(input.guide_brief, selections);
  const needsUserJudgment =
    input.needs_user_judgment ??
    buildHandoffJudgmentContext(input.guide_brief, selections);
  const selectedDeltaRefs =
    input.selected_delta_refs ??
    buildSelectedDeltaRefs(sourceRefs, selections);

  return {
    runtime: "augnes",
    capsule_version: HANDOFF_CAPSULE_VERSION,
    scope: input.scope,
    capsule_id: input.capsule_id ?? FALLBACK_CAPSULE_ID,
    created_at: input.created_at ?? FALLBACK_CREATED_AT,
    source_guide_brief_ref:
      input.source_guide_brief_ref ?? sourceRefs.guide_brief_ref,
    source_snapshot_refs:
      input.source_snapshot_refs ?? sourceRefs.perspective_snapshot_refs,
    target_surface: input.target_surface,
    target_actor: input.target_actor,
    handoff_intent: input.handoff_intent,
    status: input.status ?? "preview_only",
    title: input.title,
    summary: input.summary,
    thesis:
      input.thesis ??
      input.guide_brief?.current_perspective_summary.current_thesis ??
      input.summary,
    observed_context: observed,
    inferred_context: inferred,
    suggested_context: suggested,
    needs_user_judgment: needsUserJudgment,
    source_refs: sourceRefs,
    selected_delta_refs: selectedDeltaRefs,
    evidence_refs: input.evidence_refs ?? sourceRefs.evidence_refs,
    artifact_refs: input.artifact_refs ?? sourceRefs.artifact_refs,
    diagnostic_refs: input.diagnostic_refs ?? sourceRefs.diagnostic_refs,
    constraints: input.constraints ?? buildHandoffConstraints(input),
    forbidden_actions: uniqueSorted([
      ...DEFAULT_FORBIDDEN_ACTIONS,
      ...(input.forbidden_actions ?? []),
    ]),
    expected_inputs: input.expected_inputs ?? [
      "Active operator/user prompt.",
      "GuideBrief or GuideBrief-derived source refs.",
      "Explicit target surface and target actor.",
    ],
    expected_outputs: input.expected_outputs ?? [
      "Reviewable Handoff Capsule only.",
      "No sent handoff and no execution side effect.",
    ],
    validation_expectations:
      input.validation_expectations ??
      buildDefaultValidationExpectations(input),
    staleness: input.staleness ?? buildHandoffStaleness(input.guide_brief),
    authority_boundary:
      input.authority_boundary ?? buildHandoffCapsuleAuthorityBoundary(),
    target_rendering:
      input.target_rendering ?? buildDefaultTargetRendering(input.target_surface),
    gaps: input.gaps ?? buildHandoffGaps(input.guide_brief),
    next_phase_notes: input.next_phase_notes ?? [
      "Phase 7A adds Handoff Capsule and Codex Launch Card core only.",
      "Route, UI, MCP/App tool, and Codex skill alignment remain deferred.",
      "Future execution paths require a separate explicit operator prompt.",
    ],
    public_safety: input.public_safety ?? buildDefaultPublicSafetyBlock(),
  };
}

export function buildCodexLaunchCard(
  input: CodexLaunchCardInput,
): CodexLaunchCard {
  const capsule = input.source_capsule;
  const sourceRefs = input.source_refs ?? capsule.source_refs;
  const requiredChecks = buildCodexRequiredChecks(input);

  return {
    runtime: "augnes",
    card_version: CODEX_LAUNCH_CARD_VERSION,
    scope: input.scope,
    launch_card_id: input.launch_card_id ?? FALLBACK_LAUNCH_CARD_ID,
    created_at: input.created_at ?? capsule.created_at,
    source_capsule_id: capsule.capsule_id,
    source_guide_brief_ref:
      input.source_guide_brief_ref ?? capsule.source_guide_brief_ref,
    repo: input.repo,
    base_branch: input.base_branch,
    branch_suggestion: input.branch_suggestion,
    expected_pr_title: input.expected_pr_title,
    task_goal: input.task_goal,
    task_summary: input.task_summary ?? capsule.summary,
    context_anchors: input.context_anchors ?? [
      capsule.source_guide_brief_ref,
      ...capsule.source_snapshot_refs,
      ...sourceRefs.docs_refs,
    ],
    observed_context: input.observed_context ?? capsule.observed_context,
    inferred_context: input.inferred_context ?? capsule.inferred_context,
    suggestions_for_codex:
      input.suggestions_for_codex ??
      capsule.suggested_context.map(toCodexSuggestion),
    unresolved_user_judgment:
      input.unresolved_user_judgment ?? capsule.needs_user_judgment,
    expected_files: buildCodexExpectedFiles(input),
    forbidden_files: buildCodexForbiddenFiles(input),
    allowed_change_scope:
      input.allowed_change_scope ?? capsule.constraints.allowed_change_scope,
    forbidden_actions: uniqueSorted([
      ...capsule.forbidden_actions,
      ...(input.forbidden_actions ?? []),
      "Do not treat this Launch Card as Codex execution.",
      "Do not treat this Launch Card as branch or PR creation authority.",
    ]),
    required_checks: requiredChecks,
    optional_checks: input.optional_checks ?? [],
    skipped_check_policy:
      input.skipped_check_policy ??
      capsule.validation_expectations.skipped_check_policy,
    pr_body_requirements: buildCodexPrBodyRequirements(input),
    final_report_requirements: buildCodexFinalReportRequirements(input),
    proof_evidence_boundary: input.proof_evidence_boundary ?? [
      "No proof/evidence writes.",
      "Validation output may be reported in PR/final report only.",
      "Proof-only closeout requires a separately scoped authorized path.",
    ],
    source_refs: sourceRefs,
    staleness: input.staleness ?? capsule.staleness,
    authority_boundary:
      input.authority_boundary ?? buildCodexLaunchCardAuthorityBoundary(),
    status: input.status ?? "preview_only",
    next_phase_notes: input.next_phase_notes ?? capsule.next_phase_notes,
    public_safety: input.public_safety ?? capsule.public_safety,
  };
}

export function buildHandoffObservedContext(
  guideBrief: GuideBrief | undefined,
  selections: HandoffSelectionInput = {},
): HandoffObservedContextItem[] {
  const observed = filterGuideItems(
    guideBrief?.observed ?? [],
    selections.observed_ids,
    (item) => item.observation_id,
  );

  return observed.map((item) => ({
    context_id: `handoff.${item.observation_id}`,
    source_observation_id: item.observation_id,
    kind: item.kind,
    summary: item.summary,
    source_refs: [...item.source_refs],
    related_delta_ids: [...item.related_delta_ids],
    confidence: "observed",
    notes: [
      ...item.notes,
      "Preserved as source-backed observed context only.",
    ],
  }));
}

export function buildHandoffInferredContext(
  guideBrief: GuideBrief | undefined,
  selections: HandoffSelectionInput = {},
): HandoffInferredContextItem[] {
  const inferred = filterGuideItems(
    guideBrief?.inferred ?? [],
    selections.inference_ids,
    (item) => item.inference_id,
  );

  return inferred.map((item) => ({
    context_id: `handoff.${item.inference_id}`,
    source_inference_id: item.inference_id,
    summary: item.summary,
    basis_observation_ids: [...item.basis_observation_ids],
    source_refs: [...item.source_refs],
    confidence: item.confidence,
    caveats: [...item.caveats],
    non_authority_notes: [
      ...item.non_authority_notes,
      "Preserved as derived interpretation only.",
    ],
  }));
}

export function buildHandoffSuggestedContext(
  guideBrief: GuideBrief | undefined,
  selections: HandoffSelectionInput = {},
): HandoffSuggestedContextItem[] {
  const suggested = filterGuideItems(
    guideBrief?.suggested ?? [],
    selections.suggestion_ids,
    (item) => item.suggestion_id,
  );

  return suggested.map((item) => ({
    context_id: `handoff.${item.suggestion_id}`,
    source_suggestion_id: item.suggestion_id,
    title: item.title,
    summary: item.summary,
    suggested_surface: item.suggested_surface,
    suggested_actor: item.suggested_actor,
    priority: item.priority,
    required_checks: [...item.required_checks],
    blocked_by: [...item.blocked_by],
    source_refs: [...item.source_refs],
    related_delta_ids: [...item.related_delta_ids],
    advisory_only: true,
    authority_boundary_summary:
      `${item.authority_boundary_summary} Suggestions are not commands.`,
  }));
}

export function buildHandoffJudgmentContext(
  guideBrief: GuideBrief | undefined,
  selections: HandoffSelectionInput = {},
): HandoffJudgmentContextItem[] {
  const judgments = filterGuideItems(
    guideBrief?.needs_user_judgment ?? [],
    selections.judgment_ids,
    (item) => item.judgment_id,
  );

  return judgments.map((item) => ({
    context_id: `handoff.${item.judgment_id}`,
    source_judgment_id: item.judgment_id,
    question: item.question,
    why_it_matters: item.why_it_matters,
    options: [...item.options],
    source_refs: [...item.source_refs],
    related_delta_ids: [...item.related_delta_ids],
    urgency: item.urgency,
    blocked_until_decided: [...item.blocked_until_decided],
    decided_by_packet: false,
  }));
}

export function buildHandoffSourceRefs(
  guideBrief: GuideBrief | undefined,
  selections: HandoffSelectionInput = {},
): HandoffSourceRefs {
  const guideRefs = guideBrief?.source_refs;

  return {
    guide_brief_ref:
      selections.guide_brief_ref ??
      (guideBrief
        ? `guide_brief:${guideBrief.scope}:${guideBrief.as_of}`
        : "guide_brief:unspecified"),
    current_working_perspective_ref:
      selections.current_working_perspective_ref ??
      guideRefs?.current_working_perspective_ref ??
      "current_working_perspective:unspecified",
    delta_projection_ref:
      selections.delta_projection_ref ??
      guideRefs?.delta_projection_ref ??
      "augnes_delta_projection:unspecified",
    workplane_ref:
      selections.workplane_ref ??
      guideRefs?.workplane_ref ??
      "/workbench:agent_workplane",
    perspective_snapshot_refs: uniqueSorted([
      ...(guideRefs?.perspective_snapshot_refs ?? []),
      ...(selections.perspective_snapshot_refs ?? []),
    ]),
    delta_ids: uniqueSorted([
      ...(guideRefs?.delta_ids ?? []),
      ...(selections.delta_ids ?? []),
    ]),
    batch_ids: uniqueSorted([
      ...(guideRefs?.batch_ids ?? []),
      ...(selections.batch_ids ?? []),
    ]),
    evidence_refs: uniqueSorted([
      ...(guideRefs?.evidence_refs ?? []),
      ...(selections.evidence_refs ?? []),
    ]),
    artifact_refs: uniqueSorted([
      ...(guideRefs?.artifact_refs ?? []),
      ...(selections.artifact_refs ?? []),
    ]),
    handoff_refs: uniqueSorted([
      ...(guideRefs?.handoff_refs ?? []),
      ...(selections.handoff_refs ?? []),
    ]),
    diagnostic_refs: uniqueSorted([
      ...(guideRefs?.diagnostic_refs ?? []),
      ...(selections.diagnostic_refs ?? []),
    ]),
    route_refs: uniqueSorted([
      ...(guideRefs?.route_refs ?? []),
      ...(selections.route_refs ?? []),
    ]),
    docs_refs: uniqueSorted([
      ...REQUIRED_DOCS_REFS,
      ...(guideRefs?.docs_refs ?? []),
      ...(selections.docs_refs ?? []),
    ]),
    repo_refs: uniqueSorted(selections.repo_refs ?? []),
  };
}

export function buildHandoffConstraints(
  input: HandoffCapsuleInput,
): HandoffConstraintSet {
  return {
    allowed_change_scope: [
      "Use only context explicitly present in the capsule or active operator prompt.",
      "Keep output preview-only until a separate operator action copies or scopes it.",
    ],
    boundary_notes: [
      "Handoff Capsule is not source of truth.",
      "Handoff Capsule is not handoff send.",
      "Suggestions are not commands.",
      "User/operator judgment remains unresolved unless decided outside the packet.",
    ],
    skipped_check_policy: [
      "Run named checks when available.",
      "Every skipped check must include a concrete reason.",
      "Do not report skipped checks as passing.",
    ],
    public_safety: [...DEFAULT_PUBLIC_SAFETY_LINES],
    non_goals: uniqueSorted([
      ...DEFAULT_FORBIDDEN_ACTIONS,
      ...(input.forbidden_actions ?? []),
    ]),
  };
}

export function buildCodexExpectedFiles(
  input: CodexLaunchCardInput,
): string[] {
  return [...(input.expected_files ?? [])];
}

export function buildCodexForbiddenFiles(
  input: CodexLaunchCardInput,
): string[] {
  return input.forbidden_files ?? [
    "app/**",
    "components/**",
    "app/api/**",
    "apps/augnes_apps/**",
    "migrations/**",
    "lib/db/**",
  ];
}

export function buildCodexRequiredChecks(
  input: CodexLaunchCardInput,
): string[] {
  return input.required_checks ??
    input.source_capsule.validation_expectations.required_checks;
}

export function buildCodexPrBodyRequirements(
  input: CodexLaunchCardInput,
): string[] {
  return input.pr_body_requirements ?? [
    "Summary",
    "Files changed",
    "Handoff Capsule / Codex Launch Card changes",
    "Source mapping",
    "Observed/Inferred/Suggested/Judgment preservation",
    "Codex packet fields",
    "Authority boundary statement",
    "Validation",
    "Skipped checks with concrete reasons",
    "Proof-only closeout status or skipped reason",
    "Known risks",
    "Next phase readiness: YES / CONDITIONAL / NO",
    "Recommended next phase",
  ];
}

export function buildCodexFinalReportRequirements(
  input: CodexLaunchCardInput,
): string[] {
  return input.final_report_requirements ?? [
    "PR URL if opened.",
    "Changed files.",
    "Validation results.",
    "Skipped checks with concrete reasons.",
    "Known risks.",
    "No proof/evidence write unless separately scoped and actually performed.",
    "No merge statement.",
  ];
}

export function buildHandoffCapsuleAuthorityBoundary():
  HandoffCapsuleAuthorityBoundary {
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
    can_create_mcp_tool: false,
    can_create_ui_action: false,
    can_post_external_comment: false,
    notes: [
      "Capsule is preview-only.",
      "Launch Card is reviewable preparation only.",
      "No execution authority.",
      "No GitHub actuation.",
      "No provider calls.",
      "No proof/evidence writes.",
      "No state/memory mutation.",
      "No handoff send.",
      "No background work.",
      "User/operator prompt is required before any future execution path.",
    ],
  };
}

export function buildCodexLaunchCardAuthorityBoundary():
  CodexLaunchCardAuthorityBoundary {
  return {
    ...buildHandoffCapsuleAuthorityBoundary(),
    notes: [
      "Capsule is preview-only.",
      "Launch Card is reviewable preparation only.",
      "No execution authority.",
      "No GitHub actuation.",
      "No provider calls.",
      "No proof/evidence writes.",
      "No state/memory mutation.",
      "No handoff send.",
      "No background work.",
      "User/operator prompt is required before any future execution path.",
      "Launch Card status never means executed.",
      "Codex may implement only what the active operator/user prompt explicitly scopes.",
      "GuideBrief suggestions and Launch Card suggestions are not commands by themselves.",
    ],
  };
}

function buildSelectedDeltaRefs(
  sourceRefs: HandoffSourceRefs,
  selections: HandoffSelectionInput,
): HandoffSelectedDeltaRef[] {
  const selectedDeltaIds =
    selections.delta_ids && selections.delta_ids.length > 0
      ? selections.delta_ids
      : sourceRefs.delta_ids;

  return uniqueSorted(selectedDeltaIds).map((deltaId) => ({
    delta_id: deltaId,
    reason: "Selected for portable handoff context.",
    source_refs: [`augnes_delta:${deltaId}`],
  }));
}

function buildDefaultValidationExpectations(
  input: HandoffCapsuleInput,
): HandoffValidationExpectations {
  return {
    required_checks: [],
    optional_checks: [],
    skipped_check_policy:
      input.constraints?.skipped_check_policy ?? [
        "Name the exact skipped check.",
        "Give a concrete reason.",
        "Do not claim skipped checks passed.",
      ],
    success_criteria: [
      "Packet remains preview-only.",
      "Observed/Inferred/Suggested/Judgment separation is preserved.",
      "Authority boundary denies writes, execution, external calls, and launch/send behavior.",
    ],
  };
}

function buildHandoffStaleness(
  guideBrief: GuideBrief | undefined,
): HandoffStaleness {
  const warnings = guideBrief?.staleness_warnings ?? [];
  const hasBlockingWarning = warnings.some((warning) => warning.blocks_handoff);

  return {
    status: guideBrief
      ? hasBlockingWarning
        ? "stale"
        : warnings.length > 0
          ? "partial"
          : "fresh"
      : "unknown",
    as_of: guideBrief?.as_of ?? FALLBACK_CREATED_AT,
    warnings: warnings.map((warning) => warning.summary),
    refresh_suggestion:
      warnings[0]?.refresh_suggestion ??
      "Refresh source refs before relying on this packet for future execution-scoped work.",
  };
}

function buildDefaultTargetRendering(
  targetSurface: HandoffCapsule["target_surface"],
): HandoffTargetRendering {
  return {
    primary_sections: [
      "Summary",
      "Observed context",
      "Inferred context",
      "Suggested context",
      "Needs user judgment",
      "Source refs",
      "Authority boundary",
    ],
    preserve_separation: true,
    compact_summary: `Render for ${targetSurface} as reviewable preparation only.`,
    copy_behavior: "manual_copy_only",
    action_controls: false,
    notes: [
      "Show suggestions separately from commands.",
      "Show unresolved judgment separately from decisions.",
      "Do not render send, launch, execute, post, merge, publish, or mutate controls.",
    ],
  };
}

function buildHandoffGaps(guideBrief: GuideBrief | undefined): HandoffGap[] {
  return (guideBrief?.gaps ?? []).map((gap) => ({
    code: gap.code,
    severity: gap.severity,
    summary: gap.summary,
    source_refs: [...gap.source_refs],
    blocks_transfer_confidence: gap.blocks_guide_confidence,
  }));
}

function buildDefaultPublicSafetyBlock(): HandoffPublicSafetyBlock {
  return {
    fixture_kind: "operator_supplied" as const,
    contains_private_conversations: false as const,
    contains_hidden_reasoning: false as const,
    contains_local_private_paths: false as const,
    contains_secrets: false as const,
    contains_tokens: false as const,
    contains_raw_provider_output: false as const,
    contains_raw_retrieval_output: false as const,
    contains_real_account_artifacts: false as const,
    notes: [...DEFAULT_PUBLIC_SAFETY_LINES],
  };
}

function toCodexSuggestion(
  item: HandoffSuggestedContextItem,
): CodexSuggestionForCodex {
  return {
    suggestion_id: item.context_id,
    title: item.title,
    summary: item.summary,
    source_refs: [...item.source_refs],
    related_delta_ids: [...item.related_delta_ids],
    required_checks: [...item.required_checks],
    blocked_by: [...item.blocked_by],
    advisory_only: true,
    active_operator_prompt_required: true,
  };
}

function filterGuideItems<T>(
  items: T[],
  selectedIds: string[] | undefined,
  getId: (item: T) => string,
): T[] {
  if (!selectedIds) return items;
  const selected = new Set(selectedIds);
  return items.filter((item) => selected.has(getId(item)));
}

function uniqueSorted(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
    .sort((left, right) => left.localeCompare(right));
}
