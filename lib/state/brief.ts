import {
  type ActionRecord,
  groupEntriesForSnapshot,
  listActionRecords,
  listOpenTensions,
  listStateDeltaProposals,
  listStateEntries,
  type StateDeltaProposal,
  type StateEntry,
  type StateTension,
} from "@/lib/db";

type SuggestedActor = "user" | "chatgpt" | "codex" | "augnes_runtime";
type ActionPriority = "now" | "next" | "later";

type NextRecommendedAction = {
  title: string;
  rationale: string;
  suggested_actor: SuggestedActor;
  priority: ActionPriority;
  related_state_keys: string[];
};

export function buildStateBrief(scope: string) {
  const entries = listStateEntries(scope);
  const grouped = groupEntriesForSnapshot(entries);
  const openTensions = listOpenTensions(scope);
  const pendingProposals = listStateDeltaProposals({
    scope,
    status: "pending",
  });
  const recentActions = listActionRecords(scope).slice(0, 8);
  const asOf = new Date().toISOString();
  const recentActionVisibility = buildRecentActionVisibility(recentActions);

  return {
    runtime: "augnes",
    scope,
    as_of: asOf,
    generated_at: asOf,
    active_state: grouped.active_state,
    future_state: grouped.future_state,
    completed_state: grouped.completed_state,
    deprecated_state: grouped.deprecated_state,
    open_tensions: openTensions,
    pending_proposals: pendingProposals,
    recent_actions: recentActions,
    recent_action_visibility: recentActionVisibility,
    agent_instructions: [
      "Treat committed state as the source of truth.",
      "Use pending proposals as suggestions only; do not assume they are committed.",
      "Respect future_phase and future_intent as deferred work unless the user asks to change priority.",
      "Surface open tensions before making changes that depend on contested state.",
      "For Codex closeout proof, prefer POST /api/actions/record-proof or codex:record-completion-proof so proof remains separate from committed state.",
      "Do not commit API keys or local secrets.",
    ],
    agent_handoff: buildAgentHandoff({
      scope,
      grouped,
      openTensions,
      pendingProposals,
      recentActions,
    }),
  };
}

function buildAgentHandoff({
  scope,
  grouped,
  openTensions,
  pendingProposals,
  recentActions,
}: {
  scope: string;
  grouped: ReturnType<typeof groupEntriesForSnapshot>;
  openTensions: StateTension[];
  pendingProposals: StateDeltaProposal[];
  recentActions: ActionRecord[];
}) {
  const nextRecommendedAction = selectNextRecommendedAction({
    grouped,
    openTensions,
    pendingProposals,
    recentActions,
  });
  const stateCounts = {
    active: grouped.active_state.length,
    future: grouped.future_state.length,
    completed: grouped.completed_state.length,
    deprecated: grouped.deprecated_state.length,
    pending_proposals: pendingProposals.length,
    open_tensions: openTensions.length,
    recent_actions: recentActions.length,
  };

  return {
    current_status: {
      summary: [
        `${scope} has ${stateCounts.active} active, ${stateCounts.future} future,`,
        `${stateCounts.completed} completed, and ${stateCounts.deprecated} deprecated state entries.`,
        `${stateCounts.pending_proposals} proposals are pending, ${stateCounts.open_tensions} tensions are open,`,
        `and ${stateCounts.recent_actions} recent actions are available for continuity.`,
      ].join(" "),
      state_counts: stateCounts,
      notable_state_keys: collectNotableStateKeys({
        grouped,
        openTensions,
        pendingProposals,
        recentActions,
      }),
    },
    next_recommended_action: nextRecommendedAction,
    blockers_or_tensions: openTensions.slice(0, 5).map((tension) => ({
      title: tension.title,
      severity: tension.severity,
      related_state_keys: tension.state_key ? [tension.state_key] : [],
      summary: tension.description,
    })),
    codex_handoff: {
      task_brief: [
        `Repo context: Augnes Core owns committed temporal state for ${scope};`,
        "ChatGPT App is the primary human UX, Runtime Cockpit is operator/audit/proof UI,",
        "and Codex performs repo work plus verification.",
        `Current recommended task: ${nextRecommendedAction.title}.`,
        nextRecommendedAction.rationale,
      ].join(" "),
      constraints: [
        "Keep committed state as the source of truth; pending proposals are suggestions only.",
        "Do not add OpenAI calls for agent_handoff generation.",
        "Do not add DB schema changes or migrations.",
        "Do not change commit/reject behavior or add lifecycle states.",
        "Do not add auth, OAuth, multi-user, hosted deployment, or ChatGPT App write tools.",
        "Do not commit secrets, .env files, local SQLite files, generated outputs, screenshots, or unrelated files.",
        "Record Codex closeout proof through codex:record-completion-proof; use codex:record-completion only as documented compatibility behavior.",
      ],
      likely_files: [
        "lib/state/brief.ts",
        "README.md",
        "SUBMISSION.md",
        "components/augnes-cockpit.tsx",
      ],
      verification_commands: [
        "npm run typecheck",
        "npm run build",
        "npm run dev -- --port 3000",
        'curl -s "http://localhost:3000/api/state/brief?scope=project:augnes" | head',
        'curl -s "http://localhost:3000/api/state/brief?scope=project:augnes" | jq \'.agent_handoff\'',
      ],
      expected_report_fields: [
        "Branch",
        "Commit SHA",
        "Changed files",
        "Verification",
        "Push/PR status",
        "agent_handoff shape summary",
        "Next-action heuristic implemented",
        "Limitations",
        "Follow-up needed",
      ],
      action_record_template: {
        scope,
        source_agent_id: "codex",
        action_name: normalizeActionName(nextRecommendedAction.title),
        result_summary: "Summarize implementation and verification results.",
        files_changed: [] as string[],
        result_status: "completed",
        result_kind: "verification",
      },
    },
  };
}

function buildRecentActionVisibility(recentActions: ActionRecord[]) {
  const proofOnlyActionIds = recentActions
    .filter((action) => action.state_key === null)
    .map((action) => action.id);
  const committedStateMarkerActionIds = recentActions
    .filter((action) => action.state_key !== null)
    .map((action) => action.id);

  return {
    proof_only_action_ids: proofOnlyActionIds,
    committed_state_marker_action_ids: committedStateMarkerActionIds,
    note:
      "recent_actions is proof/continuity context. Rows with state_key: null are proof-only and do not add active committed state.",
  };
}

function selectNextRecommendedAction({
  grouped,
  openTensions,
  pendingProposals,
  recentActions,
}: {
  grouped: ReturnType<typeof groupEntriesForSnapshot>;
  openTensions: StateTension[];
  pendingProposals: StateDeltaProposal[];
  recentActions: ActionRecord[];
}): NextRecommendedAction {
  if (pendingProposals.length > 0) {
    return {
      title: "Review pending temporal delta proposals",
      rationale:
        "Pending proposals exist and need an explicit commit or reject decision before they can become durable project state.",
      suggested_actor: "user",
      priority: "now",
      related_state_keys: uniqueKeys(
        pendingProposals.map((proposal) => proposal.state_key),
      ),
    };
  }

  const highSeverityTensions = openTensions.filter(isHighSeverityTension);
  if (highSeverityTensions.length > 0) {
    return {
      title: "Surface high-severity blockers before risky work",
      rationale:
        "At least one open high-severity tension is present, so dependent implementation should wait until the contested state is understood.",
      suggested_actor: "chatgpt",
      priority: "now",
      related_state_keys: uniqueKeys(
        highSeverityTensions.map((tension) => tension.state_key),
      ),
    };
  }

  if (recentActions.some(isBridgeOrCodexAction)) {
    return {
      title: "Verify graph and action proof for recent agent work",
      rationale:
        "Recent action records include bridge or Codex activity, so the next coordination step is to confirm the action is visible in the state brief and temporal graph.",
      suggested_actor: "codex",
      priority: "next",
      related_state_keys: uniqueKeys(
        recentActions.map((action) => action.state_key),
      ),
    };
  }

  if (
    hasSubmissionCompletedState(grouped.completed_state) &&
    !hasFinalScreenshotsRecorded(grouped)
  ) {
    return {
      title: "Record final proof screenshots",
      rationale:
        "Submission-related state is already completed, but final screenshot proof is not recorded in committed state.",
      suggested_actor: "codex",
      priority: "next",
      related_state_keys: uniqueKeys(
        grouped.completed_state
          .filter((entry) => entry.state_key.startsWith("submission."))
          .map((entry) => entry.state_key),
      ),
    };
  }

  return {
    title: "Plan next work from committed state",
    rationale:
      "No pending proposals, high-severity tensions, recent bridge/Codex verification needs, or missing submission proof were detected.",
    suggested_actor: "chatgpt",
    priority: "later",
    related_state_keys: collectStateKeys(grouped.active_state).slice(0, 6),
  };
}

function collectNotableStateKeys({
  grouped,
  openTensions,
  pendingProposals,
  recentActions,
}: {
  grouped: ReturnType<typeof groupEntriesForSnapshot>;
  openTensions: StateTension[];
  pendingProposals: StateDeltaProposal[];
  recentActions: ActionRecord[];
}) {
  return uniqueKeys([
    ...openTensions.map((tension) => tension.state_key),
    ...pendingProposals.map((proposal) => proposal.state_key),
    ...recentActions.map((action) => action.state_key),
    ...collectStateKeys(grouped.active_state),
    ...collectStateKeys(grouped.future_state),
    ...collectStateKeys(grouped.completed_state),
    ...collectStateKeys(grouped.deprecated_state),
  ]).slice(0, 12);
}

function collectStateKeys(entries: StateEntry[]) {
  return entries.map((entry) => entry.state_key);
}

function isHighSeverityTension(tension: StateTension) {
  return ["critical", "high", "blocker", "severe"].includes(
    tension.severity.toLowerCase(),
  );
}

function isBridgeOrCodexAction(action: ActionRecord) {
  const searchable = [
    action.title,
    action.description,
    action.source_agent_id,
    action.source_session_id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return ["bridge", "mcp", "codex"].some((keyword) =>
    searchable.includes(keyword),
  );
}

function hasSubmissionCompletedState(completedState: StateEntry[]) {
  return completedState.some((entry) => entry.state_key.startsWith("submission."));
}

function hasFinalScreenshotsRecorded(
  grouped: ReturnType<typeof groupEntriesForSnapshot>,
) {
  const entries = [
    ...grouped.active_state,
    ...grouped.future_state,
    ...grouped.completed_state,
    ...grouped.deprecated_state,
  ];

  return entries.some((entry) => {
    const key = entry.state_key.toLowerCase();
    const isScreenshotKey =
      key.includes("screenshot") || key.includes("screen_shot");
    const isFinalOrProofKey = key.includes("final") || key.includes("proof");

    return (
      isScreenshotKey &&
      isFinalOrProofKey &&
      (entry.value === true ||
        entry.stability === "completed" ||
        entry.change_type === "completion")
    );
  });
}

function normalizeActionName(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
}

function uniqueKeys(keys: Array<string | null>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const key of keys) {
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(key);
  }

  return result;
}
