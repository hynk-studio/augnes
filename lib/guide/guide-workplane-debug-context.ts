import { readAgentWorkplaneNodeContext } from "@/lib/workplane/workplane-node-context";
import type {
  AgentWorkplaneFallbackStatus,
  AgentWorkplaneNodeContext,
  AgentWorkplaneNodeContextRead,
  AgentWorkplanePanelId,
  AgentWorkplaneStaleness,
} from "@/types/agent-workplane-node";
import type {
  GuideWorkplaneDebugAuthorityBoundary,
  GuideWorkplaneDebugCodexHandoffCandidate,
  GuideWorkplaneDebugContext,
  GuideWorkplaneDebugContextInput,
  GuideWorkplaneDebugInferredItem,
  GuideWorkplaneDebugNeedsUserJudgmentItem,
  GuideWorkplaneDebugObservedItem,
  GuideWorkplaneDebugSelectedContext,
  GuideWorkplaneDebugSelectionInput,
  GuideWorkplaneDebugSelectionStatus,
  GuideWorkplaneDebugStaleWarning,
  GuideWorkplaneDebugSuggestion,
  GuideWorkplaneDebugTraceStep,
  GuideWorkplaneDebugValidationSummary,
} from "@/types/guide-debug-context";
import { GUIDE_WORKPLANE_DEBUG_CONTEXT_VERSION } from "@/types/guide-debug-context";

const FALLBACK_AS_OF = "1970-01-01T00:00:00.000Z";

export const GUIDE_WORKPLANE_DEBUG_DEFAULT_SELECTIONS = {
  workplane_inspector: {
    selected_panel_id: "workplane_inspector",
    selected_node_id: "source_ref_bridge",
    debug_question: "Why is this Workplane context shown here?",
  },
  projected_delta_batch: {
    selected_panel_id: "projected_delta_batch",
    selected_node_id: "perspective_delta",
    debug_question: "Why is this projected Delta Batch preview shown?",
  },
  recovered_runner_delta_batch: {
    selected_panel_id: "delta_batch",
    selected_node_id: "runner_delta_batch",
    debug_question: "Is this recovered runner DeltaBatch acceptable for human review?",
  },
} as const satisfies Record<string, GuideWorkplaneDebugSelectionInput>;

export const GUIDE_WORKPLANE_DEBUG_DOC_REFS = [
  "docs/GUIDEBRIEF_WORKPLANE_DEBUG_CONTEXT_V0_1.md",
  "docs/GUIDEBRIEF_CONTRACT_V0_1.md",
  "docs/AGENT_WORKPLANE_V0_1.md",
  "docs/AGENT_WORKPLANE_NODE_CONTRACT_V0_1.md",
  "docs/AGENT_WORKPLANE_RUNNER_DELTABATCH_INTEGRATION_V0_1.md",
] as const;

export const GUIDE_WORKPLANE_DEBUG_SMOKE_REFS = [
  "smoke:guide-workplane-debug-context-v0-1",
  "smoke:guide-brief-v0-1",
  "smoke:agent-workplane-node-contract-v0-1",
  "smoke:workplane-runner-deltabatch-integration-v0-1",
] as const;

const DEBUG_AUTHORITY_BOUNDARY: GuideWorkplaneDebugAuthorityBoundary = {
  surface: "guide_workplane_debug_context",
  read_only_debug_context: true,
  can_write_db: false,
  can_write_runner_ledger: false,
  can_record_proof: false,
  can_create_evidence: false,
  can_update_work: false,
  can_mutate_memory: false,
  can_apply_project_perspective: false,
  can_apply_durable_memory: false,
  can_auto_apply_delta: false,
  can_call_provider_openai: false,
  can_call_github: false,
  can_actuate_github: false,
  can_execute_codex: false,
  can_execute_runner: false,
  can_schedule_runner: false,
  can_create_branch_or_pr: false,
  can_send_handoff: false,
  can_merge_publish_retry_replay_deploy: false,
  can_create_ui_action: false,
  can_project_intent: false,
  notes: [
    "GuideBrief Workplane Debug Context is read-only explanation context.",
    "It can create only a preview-only Codex debug handoff candidate packet.",
    "It cannot launch Codex, create a branch, open a PR, send handoff, execute runner work, recover DeltaBatches, schedule runners, write DB state, write proof/evidence, apply memory, apply Perspective, auto-apply deltas, or project intent.",
  ],
};

export async function readGuideWorkplaneDebugContext(
  input: Omit<GuideWorkplaneDebugContextInput, "node_context_read"> = {},
): Promise<GuideWorkplaneDebugContext> {
  const nodeContextRead = await readAgentWorkplaneNodeContext();
  return buildGuideWorkplaneDebugContext({
    ...input,
    node_context_read: nodeContextRead,
  });
}

export function buildGuideWorkplaneDebugContext(
  input: GuideWorkplaneDebugContextInput,
): GuideWorkplaneDebugContext {
  const nodeContextRead = input.node_context_read;
  const scope = input.scope ?? nodeContextRead?.scope ?? "project:augnes";
  const asOf = input.as_of ?? nodeContextRead?.as_of ?? FALLBACK_AS_OF;
  const selection =
    input.selection ?? GUIDE_WORKPLANE_DEBUG_DEFAULT_SELECTIONS.workplane_inspector;
  const match = matchSelectedWorkplaneContext(selection, nodeContextRead);
  const selectedContext = buildSelectedContext({ selection, match });
  const observed = buildObservedItems(selectedContext, nodeContextRead);
  const inferred = buildInferredItems({
    selectedContext,
    observed,
    selection,
    nodeContextRead,
  });
  const suggested = buildSuggestions(selectedContext);
  const needsUserJudgment = buildNeedsUserJudgmentItems({
    selectedContext,
    selection,
  });
  const sourceRefs = uniqueStrings([
    ...selectedContext.source_refs,
    ...(nodeContextRead?.source_refs ?? []),
    ...GUIDE_WORKPLANE_DEBUG_DOC_REFS,
  ]);
  const debugTrace = buildDebugTrace({ selection, match, selectedContext });
  const validationSummary = buildValidationSummary(selectedContext);
  const staleWarnings = buildStaleWarnings(selectedContext, nodeContextRead);

  return {
    debug_context_id: buildDebugContextId({ scope, selection, selectedContext }),
    debug_version: GUIDE_WORKPLANE_DEBUG_CONTEXT_VERSION,
    scope,
    as_of: asOf,
    selected_context: selectedContext,
    observed,
    inferred,
    suggested,
    needs_user_judgment: needsUserJudgment,
    source_refs: sourceRefs,
    debug_trace: debugTrace,
    validation_summary: validationSummary,
    stale_warnings: staleWarnings,
    authority_boundary: DEBUG_AUTHORITY_BOUNDARY,
    codex_debug_handoff_candidate: buildCodexDebugHandoffCandidate({
      selectedContext,
      validationSummary,
    }),
  };
}

type MatchCandidate = {
  panel: AgentWorkplaneNodeContext;
  matched_fields: string[];
  unmatched_fields: string[];
};

type MatchResult = {
  status: GuideWorkplaneDebugSelectionStatus;
  selected: MatchCandidate | null;
  candidates: MatchCandidate[];
  notes: string[];
};

function matchSelectedWorkplaneContext(
  selection: GuideWorkplaneDebugSelectionInput,
  nodeContextRead: AgentWorkplaneNodeContextRead | undefined,
): MatchResult {
  if (!nodeContextRead) {
    return {
      status: "not_found",
      selected: null,
      candidates: [],
      notes: ["No Agent Workplane node context read packet was supplied."],
    };
  }

  const criteria = selectionCriteria(selection);
  if (criteria.length === 0) {
    return {
      status: "not_found",
      selected: null,
      candidates: [],
      notes: ["No panel, node, or related ref selection criteria were supplied."],
    };
  }

  const candidates = nodeContextRead.panels
    .map((panel) => scorePanelAgainstSelection(panel, selection))
    .filter((candidate) => candidate.matched_fields.length > 0)
    .sort(sortCandidates);
  const exactCandidates = candidates.filter(
    (candidate) => candidate.unmatched_fields.length === 0,
  );

  if (exactCandidates.length === 1) {
    return {
      status: "matched",
      selected: exactCandidates[0],
      candidates,
      notes: ["Selection matched one stable Workplane panel/node context."],
    };
  }

  if (exactCandidates.length > 1) {
    return {
      status: "ambiguous",
      selected: exactCandidates[0],
      candidates: exactCandidates,
      notes: [
        "Selection matched more than one Workplane context; add a stable panel_id to disambiguate.",
      ],
    };
  }

  if (candidates.length === 1) {
    return {
      status: "partial_match",
      selected: candidates[0],
      candidates,
      notes: [
        `Selection partially matched by ${candidates[0].matched_fields.join(", ")}.`,
      ],
    };
  }

  if (candidates.length > 1) {
    return {
      status: "ambiguous",
      selected: candidates[0],
      candidates,
      notes: [
        "Selection matched multiple Workplane contexts; provide both selected_panel_id and selected_node_id for unambiguous debug context.",
      ],
    };
  }

  return {
    status: "not_found",
    selected: null,
    candidates: [],
    notes: ["Selection did not match any Workplane panel, node, or related ref."],
  };
}

function scorePanelAgainstSelection(
  panel: AgentWorkplaneNodeContext,
  selection: GuideWorkplaneDebugSelectionInput,
): MatchCandidate {
  const matchedFields: string[] = [];
  const unmatchedFields: string[] = [];

  scoreField({
    field: "selected_panel_id",
    provided: selection.selected_panel_id,
    matched: selection.selected_panel_id === panel.panel_id,
    matchedFields,
    unmatchedFields,
  });
  scoreField({
    field: "selected_node_id",
    provided: selection.selected_node_id,
    matched: selection.selected_node_id === panel.node_id,
    matchedFields,
    unmatchedFields,
  });
  scoreField({
    field: "run_id",
    provided: selection.run_id,
    matched: includesRef(panel.related_run_ids, selection.run_id),
    matchedFields,
    unmatchedFields,
  });
  scoreField({
    field: "step_id",
    provided: selection.step_id,
    matched: includesRef(panel.related_step_ids, selection.step_id),
    matchedFields,
    unmatchedFields,
  });
  scoreField({
    field: "event_id",
    provided: selection.event_id,
    matched: includesRef(panel.related_event_ids, selection.event_id),
    matchedFields,
    unmatchedFields,
  });
  scoreField({
    field: "batch_id",
    provided: selection.batch_id,
    matched: includesRef(panel.related_batch_ids, selection.batch_id),
    matchedFields,
    unmatchedFields,
  });
  scoreField({
    field: "delta_id",
    provided: selection.delta_id,
    matched: includesRef(panel.related_delta_ids, selection.delta_id),
    matchedFields,
    unmatchedFields,
  });
  scoreField({
    field: "handoff_ref",
    provided: selection.handoff_ref,
    matched: includesRef(panel.related_handoff_refs, selection.handoff_ref),
    matchedFields,
    unmatchedFields,
  });

  return {
    panel,
    matched_fields: matchedFields,
    unmatched_fields: unmatchedFields,
  };
}

function scoreField({
  field,
  provided,
  matched,
  matchedFields,
  unmatchedFields,
}: {
  field: string;
  provided: string | undefined;
  matched: boolean;
  matchedFields: string[];
  unmatchedFields: string[];
}) {
  if (!provided) return;
  if (matched) {
    matchedFields.push(field);
  } else {
    unmatchedFields.push(field);
  }
}

function buildSelectedContext({
  selection,
  match,
}: {
  selection: GuideWorkplaneDebugSelectionInput;
  match: MatchResult;
}): GuideWorkplaneDebugSelectedContext {
  const selected = match.selected?.panel ?? null;
  const validationSummary = buildValidationSummaryForPanel(selected);

  return {
    selection_status: match.status,
    selected_panel_id: selection.selected_panel_id ?? null,
    selected_node_id: selection.selected_node_id ?? null,
    matched_panel_id: selected?.panel_id ?? null,
    matched_node_id: selected?.node_id ?? null,
    matched_kind: selected?.kind ?? null,
    matched_status: selected?.status ?? null,
    title: selected?.title ?? "No matching Workplane context",
    summary:
      selected?.summary ??
      "GuideBrief Workplane Debug Context could not match the supplied selection to a stable Workplane panel, node, or related ref.",
    related_run_ids: selected?.related_run_ids ?? [],
    related_step_ids: selected?.related_step_ids ?? [],
    related_event_ids: selected?.related_event_ids ?? [],
    related_batch_ids: selected?.related_batch_ids ?? [],
    related_delta_ids: selected?.related_delta_ids ?? [],
    related_handoff_refs: selected?.related_handoff_refs ?? [],
    source_refs: selected?.source_refs ?? [],
    fallback_status: selected?.fallback_status ?? buildEmptyFallbackStatus(),
    staleness: selected?.staleness ?? buildUnknownStaleness(),
    validation_summary: validationSummary,
    debug_notes: uniqueStrings([
      ...(selected?.debug_notes ?? []),
      ...match.notes,
      ...deltaBatchDistinctionNotes(selected),
    ]),
  };
}

function buildObservedItems(
  selectedContext: GuideWorkplaneDebugSelectedContext,
  nodeContextRead: AgentWorkplaneNodeContextRead | undefined,
): GuideWorkplaneDebugObservedItem[] {
  const observed: GuideWorkplaneDebugObservedItem[] = [
    {
      observed_id: "observed.selected_context_identity",
      kind: "selected_context_identity",
      summary:
        selectedContext.selection_status === "not_found"
          ? "No stable Agent Workplane panel or node matched the selected debug input."
          : `Selected context resolved to panel ${selectedContext.matched_panel_id} and node ${selectedContext.matched_node_id}.`,
      source_refs: selectedContext.source_refs,
      related_run_ids: selectedContext.related_run_ids,
      related_step_ids: selectedContext.related_step_ids,
      related_event_ids: selectedContext.related_event_ids,
      related_batch_ids: selectedContext.related_batch_ids,
      related_delta_ids: selectedContext.related_delta_ids,
      related_handoff_refs: selectedContext.related_handoff_refs,
      confidence: "observed",
      notes: [
        "Observed from AgentWorkplaneNodeContextRead.panels only.",
        "Observed means source-backed Workplane node/context facts, not interpretations or decisions.",
      ],
    },
    {
      observed_id: "observed.selected_context_source_refs",
      kind: "selected_context_source_refs",
      summary: `${selectedContext.source_refs.length} source refs support the selected Workplane context.`,
      source_refs: selectedContext.source_refs,
      related_run_ids: selectedContext.related_run_ids,
      related_step_ids: selectedContext.related_step_ids,
      related_event_ids: selectedContext.related_event_ids,
      related_batch_ids: selectedContext.related_batch_ids,
      related_delta_ids: selectedContext.related_delta_ids,
      related_handoff_refs: selectedContext.related_handoff_refs,
      confidence: "observed",
      notes: [
        "Source refs are pointer-only.",
        "No proof, evidence, durable memory, Perspective, or delta apply is created.",
      ],
    },
    {
      observed_id: "observed.selected_context_fallback_staleness_validation",
      kind: "selected_context_fallback_staleness_validation",
      summary: `Fallback status is ${selectedContext.fallback_status.status}; staleness status is ${selectedContext.staleness.status}; validation status is ${selectedContext.validation_summary.status}.`,
      source_refs: selectedContext.source_refs,
      related_run_ids: selectedContext.related_run_ids,
      related_step_ids: selectedContext.related_step_ids,
      related_event_ids: selectedContext.related_event_ids,
      related_batch_ids: selectedContext.related_batch_ids,
      related_delta_ids: selectedContext.related_delta_ids,
      related_handoff_refs: selectedContext.related_handoff_refs,
      confidence: "observed",
      notes: [
        "Fallback, staleness, and validation are copied from Workplane node context.",
        "They do not authorize execution or promotion.",
      ],
    },
  ];

  if (nodeContextRead) {
    observed.push({
      observed_id: "observed.workplane_context_packet",
      kind: "workplane_context_packet",
      summary: `Agent Workplane node context exposes ${nodeContextRead.panels.length} panel contexts for ${nodeContextRead.scope}.`,
      source_refs: nodeContextRead.source_refs,
      related_run_ids: [],
      related_step_ids: [],
      related_event_ids: [],
      related_batch_ids: [],
      related_delta_ids: [],
      related_handoff_refs: [],
      confidence: "observed",
      notes: [
        "Observed from the supplied AgentWorkplaneNodeContextRead packet.",
        "GuideBrief debug does not read runner ledger, routes, providers, OpenAI, GitHub, or Codex directly.",
      ],
    });
  }

  return observed;
}

function buildInferredItems({
  selectedContext,
  observed,
  selection,
}: {
  selectedContext: GuideWorkplaneDebugSelectedContext;
  observed: GuideWorkplaneDebugObservedItem[];
  selection: GuideWorkplaneDebugSelectionInput;
  nodeContextRead: AgentWorkplaneNodeContextRead | undefined;
}): GuideWorkplaneDebugInferredItem[] {
  const inferred: GuideWorkplaneDebugInferredItem[] = [
    {
      inference_id: "inferred.why_panel_is_showing",
      summary:
        selectedContext.selection_status === "not_found"
          ? "The selected panel is not showing in the stable Workplane node context, or the selection used an unknown identifier."
          : `The selected panel is showing because Agent Workplane registered ${selectedContext.matched_panel_id} as a ${selectedContext.matched_kind} with ${selectedContext.source_refs.length} source refs and ${selectedContext.validation_summary.smoke_refs.length} validation smoke refs.`,
      basis_observed_ids: observationIds(observed),
      source_refs: selectedContext.source_refs,
      confidence:
        selectedContext.selection_status === "matched" ? "high" : "medium",
      caveats: [
        "This is derived interpretation from Workplane node metadata.",
        "It is not an approval, apply, action, or source-of-truth promotion.",
      ],
      non_authority_notes: [
        "Inference cannot write DB state, call providers, call GitHub, launch Codex, recover DeltaBatches, or project intent.",
      ],
    },
  ];

  if (isDeltaBatchSelection(selectedContext, selection)) {
    inferred.push({
      inference_id: "inferred.projected_vs_recovered_deltabatch_distinction",
      summary: deltaBatchDistinctionSummary(selectedContext),
      basis_observed_ids: observationIds(observed, [
        "observed.selected_context_identity",
        "observed.selected_context_source_refs",
      ]),
      source_refs: selectedContext.source_refs,
      confidence: "high",
      caveats: [
        "This distinction is based on stable Workplane panel and node IDs.",
        "Projected Delta Projection preview context must not be treated as recovered runner ledger output.",
      ],
      non_authority_notes: [
        "The distinction does not accept, apply, approve, reject, recover, tick, or schedule anything.",
      ],
    });
  }

  if (
    selectedContext.fallback_status.status !== "runtime" ||
    selectedContext.staleness.status !== "fresh"
  ) {
    inferred.push({
      inference_id: "inferred.fallback_or_staleness_attention",
      summary:
        "The selected context should be treated as needing extra review because fallback or non-fresh staleness metadata is present.",
      basis_observed_ids: observationIds(observed, [
        "observed.selected_context_fallback_staleness_validation",
      ]),
      source_refs: selectedContext.source_refs,
      confidence: "medium",
      caveats: [
        "Fallback and staleness metadata describe confidence limits, not actual user decisions.",
      ],
      non_authority_notes: [
        "GuideBrief debug cannot refresh, persist, or promote the selected context.",
      ],
    });
  }

  return inferred;
}

function buildSuggestions(
  selectedContext: GuideWorkplaneDebugSelectedContext,
): GuideWorkplaneDebugSuggestion[] {
  const smokeRefs = selectedContext.validation_summary.smoke_refs;
  return [
    {
      suggestion_id: "suggested.inspect_source_refs",
      title: "Inspect supporting source refs",
      summary:
        "Review the selected context source refs and related refs before treating the panel as ready for handoff.",
      priority: "medium",
      suggested_check: "Open the source refs named by this debug context.",
      required_checks: [
        "Keep Observed, Inferred, Suggested, and Needs user judgment separate.",
        "Do not convert source refs into proof/evidence writes.",
      ],
      blocked_by: [],
      source_refs: selectedContext.source_refs,
      related_delta_ids: selectedContext.related_delta_ids,
      authority_boundary_summary:
        "Suggested check only; this is not an executable command or UI action.",
    },
    {
      suggestion_id: "suggested.validation_smoke",
      title: "Review applicable validation smoke",
      summary:
        smokeRefs.length > 0
          ? `Applicable validation refs include ${smokeRefs.join(", ")}.`
          : "No validation smoke refs were available for the selected context.",
      priority: "medium",
      suggested_check:
        "Use the listed smoke refs as candidate validation context; do not run them from product code.",
      required_checks: smokeRefs,
      blocked_by:
        selectedContext.selection_status === "matched"
          ? []
          : [`selection_status:${selectedContext.selection_status}`],
      source_refs: selectedContext.source_refs,
      related_delta_ids: selectedContext.related_delta_ids,
      authority_boundary_summary:
        "Candidate validation guidance only; GuideBrief debug does not execute tests.",
    },
  ];
}

function buildNeedsUserJudgmentItems({
  selectedContext,
}: {
  selectedContext: GuideWorkplaneDebugSelectedContext;
  selection: GuideWorkplaneDebugSelectionInput;
}): GuideWorkplaneDebugNeedsUserJudgmentItem[] {
  const items: GuideWorkplaneDebugNeedsUserJudgmentItem[] = [];

  if (
    selectedContext.selection_status === "ambiguous" ||
    selectedContext.selection_status === "partial_match" ||
    selectedContext.selection_status === "not_found"
  ) {
    items.push({
      judgment_id: "judgment.debug_selection_resolution",
      question: "Which exact Workplane panel or node should this debug context explain?",
      why_it_matters:
        "GuideBrief debug must not guess across ambiguous, partial, or missing selections because future GuideBrief debug selection depends on stable panel/node identity.",
      options: [
        "Provide both selected_panel_id and selected_node_id.",
        "Select by a more specific run, step, event, batch, delta, or handoff ref.",
        "Treat the current packet as not found and inspect the Workplane registry.",
      ],
      source_refs: selectedContext.source_refs,
      related_delta_ids: selectedContext.related_delta_ids,
      urgency:
        selectedContext.selection_status === "not_found" ? "high" : "medium",
      blocked_until_decided: [
        "Any Codex debug handoff candidate that assumes a selected panel",
        "Any GuideBrief intent projection based on this selection",
      ],
    });
  }

  if (
    selectedContext.fallback_status.status !== "runtime" ||
    selectedContext.staleness.status === "stale" ||
    selectedContext.staleness.status === "unknown"
  ) {
    items.push({
      judgment_id: "judgment.fallback_or_staleness_review",
      question: "Is the selected context fresh and source-backed enough for handoff review?",
      why_it_matters:
        "Fallback or stale/unknown source context can explain why a panel is visible, but it should not be mistaken for validated runtime state.",
      options: [
        "Accept the fallback/staleness disclosure for read-only debugging.",
        "Refresh or inspect source refs outside Augnes product authority.",
        "Defer handoff until a fresher source context is available.",
      ],
      source_refs: selectedContext.source_refs,
      related_delta_ids: selectedContext.related_delta_ids,
      urgency: "medium",
      blocked_until_decided: [
        "Any review claim that depends on fresh source state",
        "Any future intent projection around this selected context",
      ],
    });
  }

  return items;
}

function buildDebugTrace({
  selection,
  match,
  selectedContext,
}: {
  selection: GuideWorkplaneDebugSelectionInput;
  match: MatchResult;
  selectedContext: GuideWorkplaneDebugSelectedContext;
}): GuideWorkplaneDebugTraceStep[] {
  return [
    {
      trace_step_id: "trace.selection_input",
      status: "observed",
      summary: `Selection input included ${selectionCriteria(selection).join(", ") || "no explicit criteria"}.`,
      source_refs: [],
      notes: [
        selection.debug_question
          ? `Debug question: ${selection.debug_question}`
          : "No debug question supplied.",
      ],
    },
    {
      trace_step_id: "trace.workplane_node_context_match",
      status: match.status,
      summary:
        match.selected?.panel.panel_id && match.selected.panel.node_id
          ? `Matched candidate ${match.selected.panel.panel_id}/${match.selected.panel.node_id} with status ${match.status}.`
          : `No stable Workplane context matched; status ${match.status}.`,
      source_refs: selectedContext.source_refs,
      notes: [
        ...match.notes,
        `Candidate count: ${match.candidates.length}.`,
      ],
    },
    {
      trace_step_id: "trace.authority_boundary_preserved",
      status: "observed",
      summary:
        "Debug context was built from Agent Workplane node context only and adds no route, write, execution, runner behavior, or intent projection.",
      source_refs: [...GUIDE_WORKPLANE_DEBUG_DOC_REFS],
      notes: [...DEBUG_AUTHORITY_BOUNDARY.notes],
    },
  ];
}

function buildValidationSummary(
  selectedContext: GuideWorkplaneDebugSelectedContext,
): GuideWorkplaneDebugValidationSummary {
  return {
    status:
      selectedContext.selection_status === "matched" ? "partial" : "skipped",
    smoke_refs: uniqueStrings([
      ...GUIDE_WORKPLANE_DEBUG_SMOKE_REFS,
      ...selectedContext.validation_summary.smoke_refs,
    ]),
    docs_refs: [...GUIDE_WORKPLANE_DEBUG_DOC_REFS],
    notes: [
      "Validation refs name applicable smoke coverage; GuideBrief debug does not execute validation.",
      `Selection status: ${selectedContext.selection_status}.`,
    ],
  };
}

function buildValidationSummaryForPanel(
  panel: AgentWorkplaneNodeContext | null,
): GuideWorkplaneDebugValidationSummary {
  return {
    status: panel?.validation_summary.status ?? "skipped",
    smoke_refs: uniqueStrings([
      ...GUIDE_WORKPLANE_DEBUG_SMOKE_REFS,
      ...(panel?.validation_summary.smoke_refs ?? []),
    ]),
    docs_refs: [...GUIDE_WORKPLANE_DEBUG_DOC_REFS],
    notes: [
      ...(panel?.validation_summary.notes ?? []),
      "GuideBrief debug validation preserves Workplane node validation summary and adds debug-context smoke coverage.",
    ],
  };
}

function buildStaleWarnings(
  selectedContext: GuideWorkplaneDebugSelectedContext,
  nodeContextRead: AgentWorkplaneNodeContextRead | undefined,
): GuideWorkplaneDebugStaleWarning[] {
  const warnings: GuideWorkplaneDebugStaleWarning[] = [];

  if (selectedContext.staleness.status !== "fresh") {
    warnings.push({
      warning_id: "staleness.selected_context",
      severity:
        selectedContext.staleness.status === "stale" ? "high" : "medium",
      summary: `Selected context staleness is ${selectedContext.staleness.status}.`,
      source_refs: selectedContext.source_refs,
      refresh_suggestion:
        "Inspect source refs or rerun relevant smoke outside Augnes product code if fresher evidence is needed.",
      blocks_debug_handoff:
        selectedContext.selection_status !== "matched" ||
        selectedContext.staleness.status === "stale",
    });
  }

  if (selectedContext.fallback_status.status !== "runtime") {
    warnings.push({
      warning_id: "fallback.selected_context",
      severity: "medium",
      summary: `Selected context fallback status is ${selectedContext.fallback_status.status}.`,
      source_refs: selectedContext.source_refs,
      refresh_suggestion:
        "Keep fallback disclosure visible and avoid presenting this debug context as live source truth.",
      blocks_debug_handoff: selectedContext.selection_status !== "matched",
    });
  }

  if (nodeContextRead && nodeContextRead.fallback_status.status !== "runtime") {
    warnings.push({
      warning_id: "fallback.workplane_context",
      severity: "medium",
      summary: `Top-level Workplane node context fallback status is ${nodeContextRead.fallback_status.status}.`,
      source_refs: nodeContextRead.source_refs,
      refresh_suggestion:
        "Use Workplane node context fallback notes before making handoff claims.",
      blocks_debug_handoff: false,
    });
  }

  return warnings;
}

function buildCodexDebugHandoffCandidate({
  selectedContext,
  validationSummary,
}: {
  selectedContext: GuideWorkplaneDebugSelectedContext;
  validationSummary: GuideWorkplaneDebugValidationSummary;
}): GuideWorkplaneDebugCodexHandoffCandidate {
  const blockedBy =
    selectedContext.selection_status === "matched"
      ? []
      : [`selection_status:${selectedContext.selection_status}`];

  return {
    candidate_id: `codex_debug_handoff:${selectedContext.matched_panel_id ?? selectedContext.selected_panel_id ?? "unmatched"}`,
    status: blockedBy.length === 0 ? "preview_only" : "blocked",
    preview_only: true,
    title: "Codex debug handoff candidate",
    summary:
      selectedContext.selection_status === "matched"
        ? `Preview-only Codex packet candidate for ${selectedContext.matched_panel_id}/${selectedContext.matched_node_id}.`
        : "Preview-only Codex packet candidate is blocked until the Workplane selection is resolved.",
    selected_panel_id:
      selectedContext.matched_panel_id ?? selectedContext.selected_panel_id,
    selected_node_id:
      selectedContext.matched_node_id ?? selectedContext.selected_node_id,
    source_refs: selectedContext.source_refs,
    required_context: uniqueStrings([
      selectedContext.title,
      ...validationSummary.smoke_refs,
      ...selectedContext.debug_notes,
    ]),
    blocked_by: blockedBy,
    authority_boundary_summary:
      "Preview-only packet data; no Codex launch, branch creation, PR creation, GitHub call, execution, send, write, merge, publish, retry, replay, or deploy authority.",
  };
}

function deltaBatchDistinctionNotes(
  panel: AgentWorkplaneNodeContext | null,
): string[] {
  if (!panel) return [];

  if (panel.panel_id === "delta_projection") {
    return [
      "delta_projection / perspective_delta is the native Delta Projection panel.",
    ];
  }

  if (panel.panel_id === "projected_delta_batch") {
    return [
      "projected_delta_batch / perspective_delta is projected Delta Projection preview context, not runner ledger output.",
    ];
  }

  if (panel.panel_id === "delta_batch" || panel.node_id === "runner_delta_batch") {
    return [
      "delta_batch / runner_delta_batch is recovered runner DeltaBatch ledger readback, not projected Delta Projection preview context.",
    ];
  }

  return [];
}

function deltaBatchDistinctionSummary(
  selectedContext: GuideWorkplaneDebugSelectedContext,
) {
  if (selectedContext.matched_panel_id === "delta_projection") {
    return "This selected context is native Delta Projection: delta_projection / perspective_delta. It explains projected deltas and source refs from the Delta Projection read model.";
  }

  if (selectedContext.matched_panel_id === "projected_delta_batch") {
    return "This selected context is projected Delta Batch preview: projected_delta_batch / perspective_delta. It comes from Delta Projection read-model batches and is not recovered runner ledger readback.";
  }

  if (
    selectedContext.matched_panel_id === "delta_batch" ||
    selectedContext.matched_node_id === "runner_delta_batch"
  ) {
    return "This selected context is recovered runner DeltaBatch readback: delta_batch / runner_delta_batch. It comes from the Workplane runner DeltaBatch read model and is separate from projected Delta Projection batches.";
  }

  return "The selected context is not one of the DeltaBatch identity surfaces.";
}

function isDeltaBatchSelection(
  selectedContext: GuideWorkplaneDebugSelectedContext,
  selection: GuideWorkplaneDebugSelectionInput,
) {
  return [
    selectedContext.matched_panel_id,
    selectedContext.matched_node_id,
    selection.selected_panel_id,
    selection.selected_node_id,
  ].some((id) =>
    [
      "delta_projection",
      "projected_delta_batch",
      "delta_batch",
      "runner_delta_batch",
      "perspective_delta",
    ].includes(String(id ?? "")),
  );
}

function selectionCriteria(selection: GuideWorkplaneDebugSelectionInput) {
  return [
    selection.selected_panel_id ? "selected_panel_id" : null,
    selection.selected_node_id ? "selected_node_id" : null,
    selection.run_id ? "run_id" : null,
    selection.step_id ? "step_id" : null,
    selection.event_id ? "event_id" : null,
    selection.batch_id ? "batch_id" : null,
    selection.delta_id ? "delta_id" : null,
    selection.handoff_ref ? "handoff_ref" : null,
  ].filter((value): value is string => Boolean(value));
}

function sortCandidates(left: MatchCandidate, right: MatchCandidate) {
  const scoreDelta = right.matched_fields.length - left.matched_fields.length;
  if (scoreDelta !== 0) return scoreDelta;

  const missDelta = left.unmatched_fields.length - right.unmatched_fields.length;
  if (missDelta !== 0) return missDelta;

  return left.panel.panel_id.localeCompare(right.panel.panel_id);
}

function includesRef(values: string[], selected: string | undefined) {
  return Boolean(selected && values.includes(selected));
}

function observationIds(
  observed: GuideWorkplaneDebugObservedItem[],
  preferredIds?: string[],
) {
  if (preferredIds) {
    return observed
      .map((item) => item.observed_id)
      .filter((id) => preferredIds.includes(id));
  }

  return observed.map((item) => item.observed_id);
}

function buildDebugContextId({
  scope,
  selection,
  selectedContext,
}: {
  scope: string;
  selection: GuideWorkplaneDebugSelectionInput;
  selectedContext: GuideWorkplaneDebugSelectedContext;
}) {
  const selectedRef =
    selectedContext.matched_panel_id ??
    selection.selected_panel_id ??
    selection.selected_node_id ??
    selection.run_id ??
    selection.step_id ??
    selection.event_id ??
    selection.batch_id ??
    selection.delta_id ??
    selection.handoff_ref ??
    "unselected";
  return `guide_workplane_debug:${sanitizeId(scope)}:${sanitizeId(String(selectedRef))}`;
}

function sanitizeId(value: string) {
  return value.replace(/[^a-zA-Z0-9_.:-]+/g, "_");
}

function buildEmptyFallbackStatus(): AgentWorkplaneFallbackStatus {
  return {
    status: "not_materialized",
    reason: "No matching Workplane context was found.",
    source_status: "not_found",
    notes: ["No fallback source can be attached to an unmatched selection."],
  };
}

function buildUnknownStaleness(): AgentWorkplaneStaleness {
  return {
    status: "unknown",
    as_of: null,
    updated_at: null,
    notes: ["Staleness is unknown because no matching Workplane context was found."],
  };
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}
