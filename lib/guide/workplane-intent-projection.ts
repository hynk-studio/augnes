import {
  buildGuideWorkplaneDebugContext,
  GUIDE_WORKPLANE_DEBUG_DEFAULT_SELECTIONS,
} from "@/lib/guide/guide-workplane-debug-context";
import { readAgentWorkplaneNodeContext } from "@/lib/workplane/workplane-node-context";
import type {
  AgentWorkplaneNodeContextRead,
  AgentWorkplanePanelId,
} from "@/types/agent-workplane-node";
import type { GuideWorkplaneDebugContext } from "@/types/guide-debug-context";
import type {
  WorkplaneIntentAuthorityBoundary,
  WorkplaneIntentCandidateAction,
  WorkplaneIntentCandidateHandoff,
  WorkplaneIntentCandidatePerspectiveUpdate,
  WorkplaneIntentCandidateRunnerConfig,
  WorkplaneIntentClass,
  WorkplaneIntentDisplayFilter,
  WorkplaneIntentNeedsUserJudgmentItem,
  WorkplaneIntentPanelMode,
  WorkplaneIntentProjection,
  WorkplaneIntentProjectionInput,
  WorkplaneIntentProjectionLevel,
  WorkplaneIntentProjectionRead,
  WorkplaneIntentProjectionStatus,
  WorkplaneInterpretedIntent,
} from "@/types/workplane-intent-projection";
import { WORKPLANE_INTENT_PROJECTION_VERSION } from "@/types/workplane-intent-projection";

const FALLBACK_NOW = "1970-01-01T00:00:00.000Z";

export const WORKPLANE_INTENT_PROJECTION_EXAMPLES = [
  "Show only post-Phase-9 next work.",
  "Prepare this state for Codex handoff.",
  "Focus the Workplane on runner and DeltaBatch review.",
  "Sort next actions by impact on Augnes-on-Augnes dogfood.",
  "Show what is stale before starting a scheduled run.",
  "Use this perspective lens for the next work session.",
] as const;

export const WORKPLANE_INTENT_PROJECTION_DEFAULT_INPUT = {
  original_user_intent: "Focus the Workplane on runner and DeltaBatch review.",
  selected_panel_id: "delta_batch",
  selected_node_id: "runner_delta_batch",
  debug_question: "How should the Workplane focus runner and DeltaBatch review?",
} as const satisfies WorkplaneIntentProjectionInput;

export const WORKPLANE_INTENT_CLASS_RULES: ReadonlyArray<{
  intent_class: WorkplaneIntentClass;
  terms: readonly string[];
}> = [
  {
    intent_class: "debug",
    terms: ["debug", "why", "explain", "stale", "fallback"],
  },
  {
    intent_class: "handoff",
    terms: ["handoff", "codex handoff", "prepare for codex"],
  },
  {
    intent_class: "run_planning",
    terms: ["runner", "scheduled run", "deltabatch", "recover", "run review"],
  },
  {
    intent_class: "dogfood",
    terms: ["dogfood", "augnes-on-augnes", "augnes on augnes"],
  },
  {
    intent_class: "research",
    terms: ["research"],
  },
  {
    intent_class: "implementation",
    terms: ["implement", "implementation", "pr", "code", "build"],
  },
  {
    intent_class: "cleanup",
    terms: ["cleanup", "clean up", "delete", "shrink"],
  },
  {
    intent_class: "metric_review",
    terms: ["metrics", "metric", "measure", "yield", "latency"],
  },
  {
    intent_class: "perspective_alignment",
    terms: ["perspective", "lens", "alignment"],
  },
  {
    intent_class: "navigate",
    terms: ["show", "focus", "filter", "only", "view"],
  },
  {
    intent_class: "review",
    terms: ["review", "triage", "inspect", "sort"],
  },
];

const EXECUTABLE_TERMS = [
  "run",
  "execute",
  "recover",
  "schedule",
  "apply",
  "merge",
  "publish",
  "deploy",
  "call github",
  "call openai",
  "launch codex",
  "create branch",
  "open pr",
  "mutate memory",
  "apply perspective",
  "auto-apply",
] as const;

const INTENT_DOC_REFS = [
  "docs/GUIDEBRIEF_INTENT_PROJECTION_V0_1.md",
  "docs/GUIDEBRIEF_WORKPLANE_DEBUG_CONTEXT_V0_1.md",
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md",
] as const;

const INTENT_SMOKE_REFS = [
  "smoke:guidebrief-intent-projection-v0-1",
  "smoke:guide-workplane-debug-context-v0-1",
  "smoke:agent-workplane-node-contract-v0-1",
  "smoke:workplane-runner-deltabatch-integration-v0-1",
] as const;

const INTENT_AUTHORITY_BOUNDARY: WorkplaneIntentAuthorityBoundary = {
  surface: "guidebrief_intent_projection",
  can_change_ui_view: true,
  can_create_draft_projection: true,
  can_create_handoff_candidate: true,
  can_create_runner_config_candidate: true,
  can_create_perspective_candidate: true,
  can_apply_perspective: false,
  can_mutate_memory: false,
  can_execute_runner: false,
  can_schedule_runner: false,
  can_recover_delta_batch: false,
  can_call_provider_openai: false,
  can_call_github: false,
  can_actuate_github: false,
  can_execute_codex: false,
  can_create_branch_or_pr: false,
  can_auto_apply_delta: false,
  can_write_db: false,
  can_write_runner_ledger: false,
  can_record_proof: false,
  can_create_evidence: false,
  can_merge_publish_retry_replay_deploy: false,
  can_send_handoff: false,
  notes: [
    "GuideBrief Intent Projection may produce reversible view projections and draft candidate packets only.",
    "It cannot execute candidates, persist view mode, write DB state, write runner ledger records, call providers/OpenAI/GitHub/Codex, run or schedule runners, recover DeltaBatches, apply Perspective, mutate memory, auto-apply deltas, send handoffs, create branches, open PRs, merge, publish, retry, replay, or deploy.",
  ],
};

type BuildProjectionInput = WorkplaneIntentProjectionInput & {
  debug_context?: GuideWorkplaneDebugContext;
  node_context_read?: AgentWorkplaneNodeContextRead;
};

export async function readWorkplaneIntentProjection(
  input: WorkplaneIntentProjectionInput = WORKPLANE_INTENT_PROJECTION_DEFAULT_INPUT,
): Promise<WorkplaneIntentProjectionRead> {
  const nodeContextRead = await readAgentWorkplaneNodeContext();
  const projection = buildWorkplaneIntentProjection({
    ...input,
    node_context_read: nodeContextRead,
  });

  return {
    projection_version: WORKPLANE_INTENT_PROJECTION_VERSION,
    scope: projection.scope,
    as_of: projection.created_at,
    projection,
    source_refs: projection.source_refs,
    authority_boundary: projection.authority_boundary,
    notes: [
      "Read through existing Agent Workplane node context only.",
      "No routes, writes, runner behavior, provider/OpenAI/GitHub/Codex calls, browser storage, or durable projection state are added.",
    ],
  };
}

export function buildWorkplaneIntentProjection(
  input: BuildProjectionInput,
): WorkplaneIntentProjection {
  const originalIntent = (input.original_user_intent ?? "").trim();
  const nodeContextRead = input.node_context_read;
  const scope = input.scope ?? nodeContextRead?.scope ?? "project:augnes";
  const createdAt = input.now ?? nodeContextRead?.as_of ?? FALLBACK_NOW;
  const debugContext =
    input.debug_context ??
    buildGuideWorkplaneDebugContext({
      scope,
      as_of: createdAt,
      node_context_read: nodeContextRead,
      selection: buildDebugSelection(input),
    });
  const interpretedIntent = interpretIntent(originalIntent);
  const intentClass = interpretedIntent.intent_class;
  const projectionLevel = projectionLevelForIntent({
    originalIntent,
    interpretedIntent,
  });
  const prioritizedPanels = prioritizedPanelsForIntent({
    intentClass,
    originalIntent,
    debugContext,
  });
  const focusRefs = buildFocusRefs({
    debugContext,
    nodeContextRead,
    prioritizedPanels,
    maxFocusRefs: input.max_focus_refs ?? 12,
  });
  const suppressedRefs = buildSuppressedRefs({
    nodeContextRead,
    focusRefs,
    maxFocusRefs: input.max_focus_refs ?? 12,
  });
  const staleWarnings = uniqueStrings([
    ...debugContext.stale_warnings.map((warning) => warning.summary),
    ...debugContext.selected_context.debug_notes.filter((note) =>
      /stale|fallback/i.test(note),
    ),
  ]);
  const needsUserJudgment = buildNeedsUserJudgment({
    originalIntent,
    interpretedIntent,
    debugContext,
    staleWarnings,
  });
  const projectionStatus = projectionStatusForIntent({
    originalIntent,
    interpretedIntent,
    debugContext,
    needsUserJudgment,
  });
  const sourceRefs = uniqueStrings([
    ...debugContext.source_refs,
    ...(nodeContextRead?.source_refs ?? []),
    ...INTENT_DOC_REFS,
  ]);
  const validationRefs = uniqueStrings([
    ...INTENT_SMOKE_REFS,
    ...debugContext.validation_summary.smoke_refs,
  ]);

  return {
    projection_id: buildProjectionId({ scope, originalIntent, createdAt }),
    projection_version: WORKPLANE_INTENT_PROJECTION_VERSION,
    created_at: createdAt,
    scope,
    original_user_intent: originalIntent,
    interpreted_intent: stripIntentClass(interpretedIntent),
    intent_class: intentClass,
    projection_level: projectionLevel,
    projection_status: projectionStatus,
    target_surface: "agent_workplane",
    focus_refs: focusRefs,
    suppressed_refs: suppressedRefs,
    prioritized_panels: prioritizedPanels,
    suggested_panel_modes: buildSuggestedPanelModes({
      prioritizedPanels,
      intentClass,
      debugContext,
    }),
    candidate_actions: buildCandidateActions({
      intentClass,
      originalIntent,
      prioritizedPanels,
      sourceRefs,
      validationRefs,
      maxCandidateActions: input.max_candidate_actions ?? 5,
      executableLanguageDetected: interpretedIntent.executable_language_detected,
    }),
    candidate_handoffs: buildCandidateHandoffs({
      intentClass,
      originalIntent,
      sourceRefs,
      debugContext,
    }),
    candidate_runner_configs: buildCandidateRunnerConfigs({
      intentClass,
      originalIntent,
      sourceRefs,
      debugContext,
    }),
    candidate_perspective_updates: buildCandidatePerspectiveUpdates({
      intentClass,
      originalIntent,
      sourceRefs,
      debugContext,
    }),
    display_filters: buildDisplayFilters({
      intentClass,
      prioritizedPanels,
      suppressedRefs,
    }),
    source_refs: sourceRefs,
    stale_warnings: staleWarnings,
    authority_boundary: INTENT_AUTHORITY_BOUNDARY,
    needs_user_judgment: needsUserJudgment,
    reversibility: {
      reversible: true,
      durable_state_changed: false,
      dismissible: true,
      reset_behavior:
        "Dismiss the projection or rebuild without this intent to return to the unprojected Agent Workplane read model.",
      notes: [
        "Projection state is computed only for this render/read packet.",
        "No localStorage, sessionStorage, DB row, runner ledger record, Perspective state, memory item, proof, evidence, or delta apply is created.",
      ],
    },
    validation_summary: {
      status: "partial",
      smoke_refs: validationRefs,
      docs_refs: [...INTENT_DOC_REFS],
      notes: [
        "Validation refs name applicable smoke coverage; GuideBrief Intent Projection does not execute validation.",
        "Intent Projection v0.1 is view/draft projection only.",
      ],
    },
    debug_context_refs: uniqueStrings([
      debugContext.debug_context_id,
      debugContext.selected_context.matched_panel_id ?? "",
      debugContext.selected_context.matched_node_id ?? "",
    ]),
    notes: uniqueStrings([
      "Projection is reversible, dismissible, and non-executable.",
      "Candidate handoffs, runner configs, and Perspective updates are draft-only packets.",
      ...deltaBatchDistinctionNotes(originalIntent, debugContext),
      ...debugContext.selected_context.debug_notes,
    ]),
  };
}

function buildDebugSelection(input: WorkplaneIntentProjectionInput) {
  return {
    selected_panel_id:
      input.selected_panel_id ??
      WORKPLANE_INTENT_PROJECTION_DEFAULT_INPUT.selected_panel_id,
    selected_node_id:
      input.selected_node_id ??
      WORKPLANE_INTENT_PROJECTION_DEFAULT_INPUT.selected_node_id,
    run_id: input.selected_run_id,
    step_id: input.selected_step_id,
    event_id: input.selected_event_id,
    batch_id: input.selected_batch_id,
    delta_id: input.selected_delta_id,
    handoff_ref: input.selected_handoff_ref,
    debug_question:
      input.debug_question ??
      WORKPLANE_INTENT_PROJECTION_DEFAULT_INPUT.debug_question,
  };
}

function interpretIntent(
  originalIntent: string,
): WorkplaneInterpretedIntent & { intent_class: WorkplaneIntentClass } {
  if (!originalIntent) {
    return {
      summary: "No user intent was supplied.",
      intent_class: "unknown",
      matched_terms: [],
      confidence: "low",
      executable_language_detected: false,
      ambiguity_notes: ["Projection cannot target a useful view without intent text."],
    };
  }

  const normalized = normalize(originalIntent);
  const executableTerms = EXECUTABLE_TERMS.filter((term) =>
    matchesTerm(normalized, term),
  );
  const matchedRule = WORKPLANE_INTENT_CLASS_RULES.find((rule) =>
    rule.terms.some((term) => matchesTerm(normalized, term)),
  );
  const matchedTerms = matchedRule
    ? matchedRule.terms.filter((term) => matchesTerm(normalized, term))
    : [];
  const intentClass = matchedRule?.intent_class ?? "unknown";

  return {
    summary: summaryForIntentClass(intentClass, originalIntent),
    intent_class: intentClass,
    matched_terms: matchedTerms,
    confidence:
      matchedTerms.length > 1 ? "high" : matchedTerms.length === 1 ? "medium" : "low",
    executable_language_detected: executableTerms.length > 0,
    ambiguity_notes:
      intentClass === "unknown"
        ? ["No deterministic local rule matched the supplied intent."]
        : executableTerms.length > 0
          ? [
              `Executable-looking terms detected: ${executableTerms.join(", ")}.`,
              "Execution is deferred and requires user/operator approval under existing authority boundaries.",
            ]
          : [],
  };
}

function stripIntentClass(
  interpreted: WorkplaneInterpretedIntent & { intent_class: WorkplaneIntentClass },
): WorkplaneInterpretedIntent {
  return {
    summary: interpreted.summary,
    matched_terms: interpreted.matched_terms,
    confidence: interpreted.confidence,
    executable_language_detected: interpreted.executable_language_detected,
    ambiguity_notes: interpreted.ambiguity_notes,
  };
}

function projectionLevelForIntent({
  originalIntent,
  interpretedIntent,
}: {
  originalIntent: string;
  interpretedIntent: WorkplaneInterpretedIntent;
}): WorkplaneIntentProjectionLevel {
  if (!originalIntent.trim()) return "view_projection";
  if (interpretedIntent.executable_language_detected) {
    return "executable_projection_deferred";
  }
  if (
    /handoff|runner|deltabatch|perspective|lens|implement|pr|code|build/i.test(
      originalIntent,
    )
  ) {
    return "draft_projection";
  }
  return "view_projection";
}

function projectionStatusForIntent({
  originalIntent,
  interpretedIntent,
  debugContext,
  needsUserJudgment,
}: {
  originalIntent: string;
  interpretedIntent: WorkplaneInterpretedIntent & { intent_class: WorkplaneIntentClass };
  debugContext: GuideWorkplaneDebugContext;
  needsUserJudgment: WorkplaneIntentNeedsUserJudgmentItem[];
}): WorkplaneIntentProjectionStatus {
  if (!originalIntent.trim()) return "empty_intent";
  if (interpretedIntent.intent_class === "unknown") return "unsupported";
  if (
    interpretedIntent.executable_language_detected ||
    debugContext.selected_context.selection_status !== "matched" ||
    needsUserJudgment.some((item) => item.urgency === "blocking")
  ) {
    return "needs_user_judgment";
  }
  if (
    debugContext.selected_context.staleness.status !== "fresh" ||
    debugContext.selected_context.fallback_status.status !== "runtime"
  ) {
    return "partial";
  }
  return "projected";
}

function prioritizedPanelsForIntent({
  intentClass,
  originalIntent,
  debugContext,
}: {
  intentClass: WorkplaneIntentClass;
  originalIntent: string;
  debugContext: GuideWorkplaneDebugContext;
}): Array<AgentWorkplanePanelId | string> {
  const selected = debugContext.selected_context.matched_panel_id;
  const normalized = normalize(originalIntent);

  if (
    intentClass === "run_planning" ||
    /runner|deltabatch|recover|scheduled run/.test(normalized)
  ) {
    return orderedUniqueStrings([
      "delta_batch",
      "projected_delta_batch",
      "delta_projection",
      "trace_diagnostics",
      "review_queue",
      "workplane_inspector",
      "handoff_builder_preview",
      selected ?? "",
    ]);
  }

  if (intentClass === "handoff") {
    return orderedUniqueStrings([
      "handoff_builder_preview",
      "evidence_handoff",
      "workplane_inspector",
      "trace_diagnostics",
      "review_queue",
      selected ?? "",
    ]);
  }

  if (intentClass === "perspective_alignment") {
    return orderedUniqueStrings([
      "current_perspective",
      "delta_projection",
      "projected_delta_batch",
      "review_queue",
      "workplane_inspector",
      selected ?? "",
    ]);
  }

  if (intentClass === "debug") {
    return orderedUniqueStrings([
      "workplane_inspector",
      "trace_diagnostics",
      "delta_projection",
      "projected_delta_batch",
      "delta_batch",
      selected ?? "",
    ]);
  }

  if (intentClass === "cleanup") {
    return orderedUniqueStrings([
      "work_queue",
      "review_queue",
      "trace_diagnostics",
      "legacy_cockpit_compatibility",
      "workplane_inspector",
      selected ?? "",
    ]);
  }

  if (intentClass === "dogfood") {
    return orderedUniqueStrings([
      "work_queue",
      "review_queue",
      "delta_projection",
      "delta_batch",
      "trace_diagnostics",
      "handoff_builder_preview",
      selected ?? "",
    ]);
  }

  return orderedUniqueStrings([
    selected ?? "",
    "work_queue",
    "current_perspective",
    "review_queue",
    "workplane_inspector",
    "trace_diagnostics",
  ]);
}

function buildFocusRefs({
  debugContext,
  nodeContextRead,
  prioritizedPanels,
  maxFocusRefs,
}: {
  debugContext: GuideWorkplaneDebugContext;
  nodeContextRead: AgentWorkplaneNodeContextRead | undefined;
  prioritizedPanels: Array<AgentWorkplanePanelId | string>;
  maxFocusRefs: number;
}) {
  const panelRefs =
    nodeContextRead?.panels
      .filter((panel) => prioritizedPanels.includes(panel.panel_id))
      .flatMap((panel) => [
        ...panel.source_refs,
        ...panel.related_run_ids,
        ...panel.related_step_ids,
        ...panel.related_event_ids,
        ...panel.related_batch_ids,
        ...panel.related_delta_ids,
        ...panel.related_handoff_refs,
      ]) ?? [];

  return uniqueStrings([
    ...debugContext.selected_context.source_refs,
    ...debugContext.selected_context.related_run_ids,
    ...debugContext.selected_context.related_step_ids,
    ...debugContext.selected_context.related_event_ids,
    ...debugContext.selected_context.related_batch_ids,
    ...debugContext.selected_context.related_delta_ids,
    ...debugContext.selected_context.related_handoff_refs,
    ...panelRefs,
  ]).slice(0, Math.max(1, maxFocusRefs));
}

function buildSuppressedRefs({
  nodeContextRead,
  focusRefs,
  maxFocusRefs,
}: {
  nodeContextRead: AgentWorkplaneNodeContextRead | undefined;
  focusRefs: string[];
  maxFocusRefs: number;
}) {
  const focusSet = new Set(focusRefs);
  const allRefs =
    nodeContextRead?.panels.flatMap((panel) => [
      ...panel.source_refs,
      ...panel.related_run_ids,
      ...panel.related_step_ids,
      ...panel.related_event_ids,
      ...panel.related_batch_ids,
      ...panel.related_delta_ids,
      ...panel.related_handoff_refs,
    ]) ?? [];

  return uniqueStrings(allRefs.filter((ref) => !focusSet.has(ref))).slice(
    0,
    Math.max(1, maxFocusRefs),
  );
}

function buildSuggestedPanelModes({
  prioritizedPanels,
  intentClass,
  debugContext,
}: {
  prioritizedPanels: Array<AgentWorkplanePanelId | string>;
  intentClass: WorkplaneIntentClass;
  debugContext: GuideWorkplaneDebugContext;
}): WorkplaneIntentPanelMode[] {
  return prioritizedPanels.slice(0, 8).map((panelId, index) => ({
    panel_id: panelId,
    mode:
      panelId === "delta_batch"
        ? "runner_review"
        : intentClass === "handoff" && panelId === "handoff_builder_preview"
          ? "handoff_prepare"
          : intentClass === "debug" || panelId === "workplane_inspector"
            ? "inspect"
            : intentClass === "review" || panelId === "review_queue"
              ? "review"
              : debugContext.selected_context.staleness.status !== "fresh"
                ? "stale_check"
                : index > 4
                  ? "compact"
                  : "focus",
    reason:
      panelId === "delta_batch"
        ? "Recovered runner DeltaBatch ledger readback should stay visible for runner review."
        : panelId === "projected_delta_batch"
          ? "Projected Delta Batch preview stays adjacent to recovered runner DeltaBatch so the distinction is visible."
          : "Panel is relevant to the interpreted intent and remains a view-only target.",
    source_refs: debugContext.source_refs.slice(0, 5),
  }));
}

function buildCandidateActions({
  intentClass,
  originalIntent,
  prioritizedPanels,
  sourceRefs,
  validationRefs,
  maxCandidateActions,
  executableLanguageDetected,
}: {
  intentClass: WorkplaneIntentClass;
  originalIntent: string;
  prioritizedPanels: Array<AgentWorkplanePanelId | string>;
  sourceRefs: string[];
  validationRefs: string[];
  maxCandidateActions: number;
  executableLanguageDetected: boolean;
}): WorkplaneIntentCandidateAction[] {
  const base: WorkplaneIntentCandidateAction[] = [
    {
      action_id: "candidate_action.inspect_focus_refs",
      title: "Inspect focused refs",
      summary:
        "Review focus refs and stale/fallback warnings before treating this projection as useful.",
      status: executableLanguageDetected ? "requires_user_judgment" : "preview_only",
      intent_class: intentClass,
      related_panel_ids: prioritizedPanels.slice(0, 4),
      source_refs: sourceRefs.slice(0, 8),
      validation_refs: validationRefs,
      blocked_by: executableLanguageDetected
        ? ["executable_language_detected"]
        : [],
      non_executable_reason:
        "Candidate action is a draft check only; product code does not execute commands or mutate state.",
    },
    {
      action_id: "candidate_action.review_validation",
      title: "Review validation coverage",
      summary: `Use smoke refs as validation context for intent: ${originalIntent || "empty intent"}.`,
      status: "preview_only",
      intent_class: intentClass,
      related_panel_ids: prioritizedPanels.slice(0, 5),
      source_refs: sourceRefs.slice(0, 8),
      validation_refs: validationRefs,
      blocked_by: [],
      non_executable_reason:
        "Validation refs are named only; GuideBrief Intent Projection does not run tests.",
    },
  ];

  return base.slice(0, Math.max(1, maxCandidateActions));
}

function buildCandidateHandoffs({
  intentClass,
  originalIntent,
  sourceRefs,
  debugContext,
}: {
  intentClass: WorkplaneIntentClass;
  originalIntent: string;
  sourceRefs: string[];
  debugContext: GuideWorkplaneDebugContext;
}): WorkplaneIntentCandidateHandoff[] {
  if (
    intentClass !== "handoff" &&
    !/handoff|codex|prepare/i.test(originalIntent)
  ) {
    return [];
  }

  return [
    {
      handoff_candidate_id: "handoff_candidate.guidebrief_intent_projection",
      title: "Draft Codex handoff candidate",
      summary:
        "Draft-only handoff packet candidate from the interpreted intent and selected Workplane debug context.",
      target_surface: "codex_handoff",
      status:
        debugContext.selected_context.selection_status === "matched"
          ? "draft_only"
          : "blocked",
      source_refs: sourceRefs.slice(0, 10),
      required_context: uniqueStrings([
        debugContext.selected_context.title,
        ...debugContext.validation_summary.smoke_refs,
      ]),
      blocked_by:
        debugContext.selected_context.selection_status === "matched"
          ? []
          : [`selection_status:${debugContext.selected_context.selection_status}`],
    },
  ];
}

function buildCandidateRunnerConfigs({
  intentClass,
  originalIntent,
  sourceRefs,
  debugContext,
}: {
  intentClass: WorkplaneIntentClass;
  originalIntent: string;
  sourceRefs: string[];
  debugContext: GuideWorkplaneDebugContext;
}): WorkplaneIntentCandidateRunnerConfig[] {
  if (
    intentClass !== "run_planning" &&
    !/runner|deltabatch|scheduled run|recover|run review/i.test(originalIntent)
  ) {
    return [];
  }

  return [
    {
      runner_config_candidate_id:
        "runner_config_candidate.guidebrief_intent_projection",
      title: "Draft runner review config candidate",
      summary:
        "Draft-only runner review configuration candidate for recovered DeltaBatch inspection. It cannot tick, schedule, recover, or execute a runner.",
      status:
        debugContext.selected_context.selection_status === "matched"
          ? "draft_only"
          : "requires_user_judgment",
      related_run_ids: debugContext.selected_context.related_run_ids,
      related_batch_ids: debugContext.selected_context.related_batch_ids,
      related_delta_ids: debugContext.selected_context.related_delta_ids,
      source_refs: sourceRefs.slice(0, 10),
      blocked_by:
        debugContext.selected_context.selection_status === "matched"
          ? []
          : [`selection_status:${debugContext.selected_context.selection_status}`],
      authority_boundary_summary:
        "Draft config only; no runner execution, tick, schedule, recovery write, or runner ledger write is available.",
    },
  ];
}

function buildCandidatePerspectiveUpdates({
  intentClass,
  originalIntent,
  sourceRefs,
  debugContext,
}: {
  intentClass: WorkplaneIntentClass;
  originalIntent: string;
  sourceRefs: string[];
  debugContext: GuideWorkplaneDebugContext;
}): WorkplaneIntentCandidatePerspectiveUpdate[] {
  if (
    intentClass !== "perspective_alignment" &&
    !/perspective|lens|alignment/i.test(originalIntent)
  ) {
    return [];
  }

  return [
    {
      perspective_update_candidate_id:
        "perspective_update_candidate.guidebrief_intent_projection",
      title: "Draft Perspective lens candidate",
      summary:
        "Draft-only Perspective update candidate. It describes a lens for the next work session without applying Perspective state.",
      status:
        debugContext.selected_context.selection_status === "matched"
          ? "draft_only"
          : "requires_user_judgment",
      proposed_lens: "next_work_session_intent_projection",
      source_refs: sourceRefs.slice(0, 10),
      related_delta_ids: debugContext.selected_context.related_delta_ids,
      blocked_by:
        debugContext.selected_context.selection_status === "matched"
          ? []
          : [`selection_status:${debugContext.selected_context.selection_status}`],
      non_apply_reason:
        "Perspective candidate is draft-only; no Perspective apply or durable memory apply is available.",
    },
  ];
}

function buildDisplayFilters({
  intentClass,
  prioritizedPanels,
  suppressedRefs,
}: {
  intentClass: WorkplaneIntentClass;
  prioritizedPanels: Array<AgentWorkplanePanelId | string>;
  suppressedRefs: string[];
}): WorkplaneIntentDisplayFilter[] {
  return [
    {
      filter_id: `display_filter.${intentClass}`,
      label: `${intentClass} focus`,
      include_panel_ids: prioritizedPanels,
      suppress_ref_patterns: suppressedRefs.slice(0, 8),
      reason:
        "Pure view filter for focus/suppression only; it does not hide source truth or mutate Workplane state.",
      pure_view_only: true,
    },
  ];
}

function buildNeedsUserJudgment({
  originalIntent,
  interpretedIntent,
  debugContext,
  staleWarnings,
}: {
  originalIntent: string;
  interpretedIntent: WorkplaneInterpretedIntent & { intent_class: WorkplaneIntentClass };
  debugContext: GuideWorkplaneDebugContext;
  staleWarnings: string[];
}): WorkplaneIntentNeedsUserJudgmentItem[] {
  const items: WorkplaneIntentNeedsUserJudgmentItem[] = [];

  if (!originalIntent.trim()) {
    items.push({
      judgment_id: "judgment.empty_intent",
      question: "What should GuideBrief project onto Agent Workplane?",
      why_it_matters:
        "Empty intent cannot create a useful reversible view projection.",
      options: [
        "Provide a focus, review, handoff, runner, or Perspective alignment intent.",
        "Dismiss the empty projection.",
      ],
      urgency: "medium",
      source_refs: debugContext.source_refs,
      blocked_until_decided: ["Useful panel prioritization"],
    });
  }

  if (interpretedIntent.intent_class === "unknown") {
    items.push({
      judgment_id: "judgment.unsupported_intent",
      question: "Which supported intent class should this projection use?",
      why_it_matters:
        "GuideBrief Intent Projection uses deterministic local rules and must not guess unsupported intent semantics.",
      options: [
        "Rewrite the intent as debug, navigate, review, handoff, run planning, dogfood, research, implementation, cleanup, metric review, or Perspective alignment.",
        "Treat the projection as unsupported.",
      ],
      urgency: "medium",
      source_refs: debugContext.source_refs,
      blocked_until_decided: ["Projection classification"],
    });
  }

  if (interpretedIntent.executable_language_detected) {
    items.push({
      judgment_id: "judgment.executable_language_deferred",
      question: "Should this executable-looking intent be handled outside GuideBrief Intent Projection?",
      why_it_matters:
        "Intent Projection can draft candidates but cannot execute, recover, schedule, apply, merge, publish, call GitHub/OpenAI, launch Codex, create branches, or open PRs.",
      options: [
        "Keep this as a draft projection only.",
        "Route execution through an existing approved Autonomy Contract / Runner boundary.",
        "Ask an operator to perform any external action outside product code.",
      ],
      urgency: "blocking",
      source_refs: debugContext.source_refs,
      blocked_until_decided: [
        "Any runner execution",
        "Any recovery write",
        "Any scheduled behavior",
        "Any external actuation",
      ],
    });
  }

  if (
    debugContext.selected_context.selection_status !== "matched" ||
    staleWarnings.length > 0
  ) {
    items.push({
      judgment_id: "judgment.stale_or_partial_debug_basis",
      question: "Is the selected debug basis fresh enough for this projection?",
      why_it_matters:
        "Stale, fallback, partial, or unmatched debug context can guide a view, but it should not be treated as validated runtime truth.",
      options: [
        "Accept the disclosure for reversible view projection.",
        "Inspect source refs before relying on the projection.",
        "Dismiss the projection until fresher context exists.",
      ],
      urgency: "medium",
      source_refs: debugContext.source_refs,
      blocked_until_decided: ["Freshness-sensitive handoff or runner review claims"],
    });
  }

  return items;
}

function deltaBatchDistinctionNotes(
  originalIntent: string,
  debugContext: GuideWorkplaneDebugContext,
) {
  const ids = [
    debugContext.selected_context.matched_panel_id,
    debugContext.selected_context.matched_node_id,
    originalIntent,
  ].join(" ");

  if (!/delta_projection|projected_delta_batch|delta_batch|runner_delta_batch|deltabatch|runner|recovered/i.test(ids)) {
    return [];
  }

  return [
    "delta_projection / perspective_delta is native Delta Projection context.",
    "projected_delta_batch / perspective_delta is projected Delta Projection preview batch context.",
    "delta_batch / runner_delta_batch is recovered runner DeltaBatch ledger readback context.",
    "Intent Projection keeps projected preview batches separate from recovered runner DeltaBatches.",
  ];
}

function summaryForIntentClass(
  intentClass: WorkplaneIntentClass,
  originalIntent: string,
) {
  if (intentClass === "unknown") {
    return `Intent could not be classified by deterministic local rules: ${originalIntent}`;
  }

  return `Intent classified as ${intentClass}: ${originalIntent}`;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function matchesTerm(normalizedValue: string, normalizedTerm: string) {
  if (normalizedTerm.includes(" ")) {
    return normalizedValue.includes(normalizedTerm);
  }

  return new RegExp(`(^|[^a-z0-9_])${escapeRegExp(normalizedTerm)}([^a-z0-9_]|$)`).test(
    normalizedValue,
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildProjectionId({
  scope,
  originalIntent,
  createdAt,
}: {
  scope: string;
  originalIntent: string;
  createdAt: string;
}) {
  return `workplane_intent_projection:${sanitize(scope)}:${sanitize(originalIntent || "empty")}@${sanitize(createdAt)}`;
}

function sanitize(value: string) {
  return value.replace(/[^a-zA-Z0-9_.:-]+/g, "_").slice(0, 140);
}

function uniqueStrings<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function orderedUniqueStrings<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values.filter(Boolean))];
}
