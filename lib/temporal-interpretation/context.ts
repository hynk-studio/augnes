import { buildStateBrief } from "@/lib/state/brief";
import {
  type ActiveContextAdmissionRationale,
  type AxisPressure,
  type InterpretiveDriver,
  type MemoryLifecycleView,
  type SuppressedAlternative,
  type TemporalPreviewContext,
  type TemporalPreviewCounterexample,
  type TemporalPreviewEvidenceAnchor,
  type TemporalPreviewTension,
  type TemporalHierarchyView,
} from "@/lib/temporal-interpretation/types";

const DEFAULT_SCOPE = "project:augnes";

export function buildTemporalPreviewContext(
  scope = DEFAULT_SCOPE,
): TemporalPreviewContext {
  const brief = buildStateBrief(scope);
  const asOf = new Date().toISOString();
  const notableKeys = brief.agent_handoff.current_status.notable_state_keys ?? [];
  const activeEntries = brief.active_state.slice(0, 5);
  const completedEntries = brief.completed_state.slice(0, 3);
  const recentActions = brief.recent_actions.slice(0, 3);
  const evidenceAnchors: TemporalPreviewEvidenceAnchor[] = [
    ...activeEntries.map((entry) => ({
      ref: `state:${entry.state_key}`,
      claim: `${entry.state_key} is committed ${entry.stability} state for ${entry.temporal_scope}.`,
      source_type: "committed_state" as const,
    })),
    ...completedEntries.map((entry) => ({
      ref: `state:${entry.state_key}`,
      claim: `${entry.state_key} is recorded as completed state.`,
      source_type: "committed_state" as const,
    })),
    ...recentActions.map((action) => ({
      ref: `action:${action.id}`,
      claim: action.description ?? action.title,
      source_type: "action_record" as const,
    })),
  ].slice(0, 8);
  const counterexamples = buildCounterexamples({ brief });
  const residualTensions = buildResidualTensions({ brief });
  const currentInterpretation = buildCurrentInterpretation({ brief });
  const activeContextAdmissionRationale =
    buildActiveContextAdmissionRationale({
      currentStatusRef: "summary:agent_handoff.current_status",
      nextActionRef: "summary:agent_handoff.next_recommended_action",
      tensionRefs: residualTensions.map((tension) => tension.ref),
      counterexampleRefs: counterexamples.map((counterexample) => counterexample.ref),
    });
  const suppressedAlternatives = buildSuppressedAlternatives();
  const temporalHierarchyView = buildTemporalHierarchyView();
  const memoryLifecycleView = buildMemoryLifecycleView({
    activeEntries: activeEntries.map((entry) => `state:${entry.state_key}`),
    completedEntries: completedEntries.map((entry) => `state:${entry.state_key}`),
    summaryRefs: [
      "summary:agent_handoff.current_status",
      "summary:agent_handoff.next_recommended_action",
    ],
    deferredRefs: [
      ...brief.pending_proposals.slice(0, 2).map((proposal) => `proposal:${proposal.id}`),
      ...residualTensions.map((tension) => tension.ref),
    ],
  });
  const interpretiveDrivers = buildInterpretiveDrivers();
  const axisPressures = buildAxisPressures();

  return {
    scope,
    as_of: asOf,
    current_interpretation: currentInterpretation,
    active_prior_context: [
      "Augnes currently treats committed temporal state as the source of truth.",
      "Pending proposals, summaries, and handoff packets are interpretive aids, not durable authority.",
      brief.agent_handoff.next_recommended_action.rationale,
    ].join(" "),
    evidence_anchors: evidenceAnchors,
    summary_refs: [
      {
        ref: "summary:agent_handoff.current_status",
        summary: brief.agent_handoff.current_status.summary,
      },
      {
        ref: "summary:agent_handoff.next_recommended_action",
        summary: brief.agent_handoff.next_recommended_action.title,
      },
    ],
    source_authority_profile: {
      committed_state_authority: notableKeys.slice(0, 8),
      summary_only_refs: [
        "summary:agent_handoff.current_status",
        "summary:agent_handoff.next_recommended_action",
      ],
      allowed_now: [
        "read_state_brief",
        "render_preview",
        "run_local_guardrails",
      ],
      blocked_now: [
        "commit_state",
        "publish_proof",
        "promote_rule",
        "claim_full_p4_readiness",
      ],
    },
    counterexamples,
    residual_tensions: residualTensions,
    user_preferences: [
      "The challenge-demo slice should prioritize a small working preview over conceptual documentation.",
      "OpenAI should be optional locally because mock fallback must work from a clean checkout.",
    ],
    safe_next_step:
      "Use this read-only preview as demo evidence, verify no API-key leakage, capture the Cockpit screenshot with OpenAI enabled, and keep durable PerspectiveSnapshot work behind separate review.",
    non_authority_boundary:
      "This preview is non-authoritative: it does not commit state, approve work, publish proof, mutate mailbox status, promote rules, or claim full P4 PerspectiveSnapshot readiness.",
    active_context_admission_rationale: activeContextAdmissionRationale,
    suppressed_alternatives: suppressedAlternatives,
    temporal_hierarchy_view: temporalHierarchyView,
    memory_lifecycle_view: memoryLifecycleView,
    interpretive_drivers: interpretiveDrivers,
    axis_pressures: axisPressures,
  };
}

function buildActiveContextAdmissionRationale({
  currentStatusRef,
  nextActionRef,
  tensionRefs,
  counterexampleRefs,
}: {
  currentStatusRef: string;
  nextActionRef: string;
  tensionRefs: string[];
  counterexampleRefs: string[];
}): ActiveContextAdmissionRationale[] {
  return [
    {
      context_ref: currentStatusRef,
      admission_role: "primary_active",
      why_admitted:
        "It frames the current project status that the preview is interpreting.",
      why_not_merely_summary:
        "It is admitted only as active context and remains separate from evidence anchors and committed state authority.",
    },
    {
      context_ref: nextActionRef,
      admission_role: "preference_active",
      why_admitted:
        "It captures the currently recommended review direction without turning it into approval.",
      why_not_merely_summary:
        "It guides the safe next step but cannot replace proof, state, or boundary checks.",
    },
    {
      context_ref: tensionRefs[0] ?? "boundary:p4_scope",
      admission_role: "tension_active",
      why_admitted:
        "The preview must keep unresolved tension visible while interpreting current readiness.",
      why_not_merely_summary:
        "The tension constrains the interpretation rather than serving as standalone support.",
    },
    {
      context_ref: counterexampleRefs[0] ?? "boundary:summary_refs",
      admission_role: "counterexample_active",
      why_admitted:
        "It prevents the preview from treating pending or summary-only material as committed evidence.",
      why_not_merely_summary:
        "It actively limits inference and is not a condensed replacement for source authority.",
    },
  ];
}

function buildSuppressedAlternatives(): SuppressedAlternative[] {
  return [
    {
      alternative: "Persist a durable PerspectiveSnapshot table.",
      why_deferred:
        "The preview is intentionally read-only and this follow-up does not add schema or runtime authority.",
      what_would_change_status:
        "A separately scoped P4 implementation review approves persistence semantics and migrations.",
      status: "deferred",
    },
    {
      alternative: "Promote qualitative drivers into automatic rule candidates.",
      why_deferred:
        "The preview exposes interpretation for reviewers but does not create RuleCandidate or PromotedRule runtime behavior.",
      what_would_change_status:
        "A future rule-governance task defines explicit authority, review, and promotion boundaries.",
      status: "blocked_now",
    },
    {
      alternative: "Treat axis pressure labels as authority thresholds.",
      why_deferred:
        "Axis pressures are label-only diagnostic context and are not confidence, authority, or scoring.",
      what_would_change_status:
        "A future research review explicitly asks for a separate scoring model and validation strategy.",
      status: "not_recommended",
    },
  ];
}

function buildTemporalHierarchyView(): TemporalHierarchyView {
  return {
    raw_observation_level:
      "Committed state entries, action records, and work traces remain the closest available source material.",
    work_or_session_level:
      "Recent implementation and verification work explains why the preview exists in the current demo session.",
    project_status_level:
      "Project status stays anchored to committed Augnes state and challenge-demo readiness boundaries.",
    current_interpretive_stance:
      "Treat the preview as a reviewer-visible interpretation layer over current context, not as durable state.",
    hierarchy_caution:
      "Higher-level summaries can organize interpretation but must not override raw or committed authority.",
  };
}

function buildMemoryLifecycleView({
  activeEntries,
  completedEntries,
  summaryRefs,
  deferredRefs,
}: {
  activeEntries: string[];
  completedEntries: string[];
  summaryRefs: string[];
  deferredRefs: string[];
}): MemoryLifecycleView {
  return {
    active_context: activeEntries.slice(0, 5),
    retrieved_context: completedEntries.slice(0, 3),
    summary_or_view: summaryRefs,
    stale_or_deferred_context: deferredRefs.slice(0, 5),
    lifecycle_caution:
      "Lifecycle labels describe preview handling only; they do not admit memory automatically or mutate state.",
  };
}

function buildInterpretiveDrivers(): InterpretiveDriver[] {
  return [
    {
      axis: "factuality",
      driver:
        "Committed state and action records remain distinct from summaries and pending proposals.",
      effect:
        "The preview keeps evidence anchors explicit and avoids treating summaries as proof.",
    },
    {
      axis: "boundary",
      driver:
        "The task excludes DB persistence, approval authority, rule promotion, and full P4 claims.",
      effect:
        "The interpretation emphasizes non-authority and safe review rather than runtime control.",
    },
    {
      axis: "revision",
      driver:
        "The prior preview v0.1 structure is being enriched with research-model visibility fields.",
      effect:
        "The output can show why context matters without adding scoring or governance behavior.",
    },
    {
      axis: "implementation",
      driver:
        "The Cockpit and smoke route need concrete reviewer-visible output from a clean checkout.",
      effect:
        "Mock fallback carries the same structure as OpenAI output so local demos remain deterministic.",
    },
  ];
}

function buildAxisPressures(): AxisPressure[] {
  return [
    {
      axis: "factuality",
      pressure: "high",
      reason:
        "Evidence/source boundaries are central to preventing summary-only support from becoming proof.",
    },
    {
      axis: "boundary",
      pressure: "high",
      reason:
        "The preview must stay read-only and non-authoritative despite richer interpretation structure.",
    },
    {
      axis: "revision",
      pressure: "medium",
      reason:
        "The follow-up revises preview shape while preserving existing route and UI behavior.",
    },
    {
      axis: "implementation",
      pressure: "medium",
      reason:
        "The demo must remain runnable with deterministic mock output and no new dependencies.",
    },
  ];
}

function buildCounterexamples({
  brief,
}: {
  brief: ReturnType<typeof buildStateBrief>;
}): TemporalPreviewCounterexample[] {
  const pending = brief.pending_proposals.slice(0, 2).map((proposal) => ({
    ref: `proposal:${proposal.id}`,
    description: `${proposal.state_key} is only a pending proposal and must not be treated as committed evidence.`,
  }));

  return [
    ...pending,
    {
      ref: "boundary:summary_refs",
      description:
        "A handoff or summary can guide interpretation but cannot become an evidence anchor by itself.",
    },
  ];
}

function buildCurrentInterpretation({
  brief,
}: {
  brief: ReturnType<typeof buildStateBrief>;
}) {
  const apiKeyTensionCount = brief.open_tensions.filter((tension) => {
    const text = [
      tension.id,
      tension.state_key,
      tension.title,
      tension.description,
      tension.severity,
    ]
      .join(" ")
      .toLowerCase();

    return (
      isHighSeverityTension(tension.severity) &&
      (text.includes("api key") ||
        text.includes("api-key") ||
        text.includes("api_keys") ||
        text.includes("secret"))
    );
  }).length;

  const tensionPhrase =
    apiKeyTensionCount === 1
      ? "but one high-severity API-key handling tension remains active"
      : apiKeyTensionCount > 1
        ? `but ${apiKeyTensionCount} high-severity API-key handling tensions remain active`
        : "while any unresolved tensions remain active review constraints";

  return [
    `Augnes has enough committed project state to generate a read-only temporal interpretation preview, ${tensionPhrase}.`,
    "The preview treats committed state as evidence, summaries as guidance only, and implementation work as still bounded by review.",
  ].join(" ");
}

function buildResidualTensions({
  brief,
}: {
  brief: ReturnType<typeof buildStateBrief>;
}): TemporalPreviewTension[] {
  const open = brief.open_tensions.slice(0, 4).map((tension) => ({
    ref: `tension:${tension.id}`,
    description: tension.description,
  }));

  if (open.length > 0) {
    return open;
  }

  return [
    {
      ref: "boundary:p4_scope",
      description:
        "The preview can demonstrate temporal interpretation but remains separate from durable P4 PerspectiveSnapshot implementation.",
    },
  ];
}

function isHighSeverityTension(severity: string) {
  return ["critical", "high", "blocker", "severe"].includes(
    severity.toLowerCase(),
  );
}
