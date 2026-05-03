import {
  groupEntriesForSnapshot,
  listActionRecords,
  listOpenTensions,
  listStateDeltaProposals,
  listStateEntries,
} from "@/lib/db";

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
    agent_instructions: [
      "Treat committed state as the source of truth.",
      "Use pending proposals as suggestions only; do not assume they are committed.",
      "Respect future_phase and future_intent as deferred work unless the user asks to change priority.",
      "Surface open tensions before making changes that depend on contested state.",
      "Record external work through POST /api/actions/record so continuity stays queryable.",
      "Do not commit API keys or local secrets.",
    ],
  };
}
