import type {
  AgentWorkplaneNodeContextRead,
  AgentWorkplanePanelId,
} from "@/types/agent-workplane-node";
import type {
  WorkplaneIntentDisplayFilter,
  WorkplaneIntentProjection,
} from "@/types/workplane-intent-projection";

export type ProjectedWorkplaneViewModel = {
  ordered_panel_ids: Array<AgentWorkplanePanelId | string>;
  highlighted_panel_ids: Array<AgentWorkplanePanelId | string>;
  hidden_panel_ids: Array<AgentWorkplanePanelId | string>;
  focus_refs: string[];
  suppressed_refs: string[];
  display_filters: WorkplaneIntentDisplayFilter[];
  notes: string[];
};

export function applyWorkplaneViewProjection({
  projection,
  node_context_read,
}: {
  projection: WorkplaneIntentProjection;
  node_context_read: AgentWorkplaneNodeContextRead;
}): ProjectedWorkplaneViewModel {
  const orderedPanelIds = buildProjectedWorkplanePanelOrder({
    projection,
    node_context_read,
  });
  const highlightedPanelIds = orderedPanelIds.filter((panelId) =>
    projection.prioritized_panels.includes(panelId),
  );
  const hiddenPanelIds = node_context_read.panels
    .map((panel) => panel.panel_id)
    .filter((panelId) => !orderedPanelIds.includes(panelId));
  const filteredRefs = filterWorkplaneRefsForProjection({
    projection,
    node_context_read,
  });

  return {
    ordered_panel_ids: orderedPanelIds,
    highlighted_panel_ids: highlightedPanelIds,
    hidden_panel_ids: hiddenPanelIds,
    focus_refs: filteredRefs.focus_refs,
    suppressed_refs: filteredRefs.suppressed_refs,
    display_filters: projection.display_filters,
    notes: [
      "Pure non-durable view model only.",
      "Input node context is not mutated.",
      "No DB write, route call, runner/provider/GitHub/Codex call, browser storage, localStorage, sessionStorage, persistent Workplane mode, or durable projection state is created.",
    ],
  };
}

export function buildProjectedWorkplanePanelOrder({
  projection,
  node_context_read,
}: {
  projection: WorkplaneIntentProjection;
  node_context_read: AgentWorkplaneNodeContextRead;
}): Array<AgentWorkplanePanelId | string> {
  const knownPanelIds = node_context_read.panels.map((panel) => panel.panel_id);
  const prioritized = projection.prioritized_panels.filter((panelId) =>
    knownPanelIds.includes(panelId as AgentWorkplanePanelId),
  );
  const remaining = knownPanelIds.filter((panelId) => !prioritized.includes(panelId));

  return orderedUniqueStrings([...prioritized, ...remaining]);
}

export function filterWorkplaneRefsForProjection({
  projection,
  node_context_read,
}: {
  projection: WorkplaneIntentProjection;
  node_context_read: AgentWorkplaneNodeContextRead;
}): {
  focus_refs: string[];
  suppressed_refs: string[];
} {
  const allRefs = uniqueStrings([
    ...node_context_read.source_refs,
    ...node_context_read.panels.flatMap((panel) => [
      ...panel.source_refs,
      ...panel.related_run_ids,
      ...panel.related_step_ids,
      ...panel.related_event_ids,
      ...panel.related_batch_ids,
      ...panel.related_delta_ids,
      ...panel.related_handoff_refs,
    ]),
  ]);
  const focusRefs = uniqueStrings(
    projection.focus_refs.filter((ref) => allRefs.includes(ref)),
  );
  const focusSet = new Set(focusRefs);
  const suppressedRefs = uniqueStrings([
    ...projection.suppressed_refs.filter((ref) => allRefs.includes(ref)),
    ...allRefs.filter((ref) => !focusSet.has(ref)).slice(0, 24),
  ]);

  return {
    focus_refs: focusRefs,
    suppressed_refs: suppressedRefs,
  };
}

function uniqueStrings<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values.filter(Boolean))].sort((left, right) =>
    left.localeCompare(right),
  );
}

function orderedUniqueStrings<T extends string>(values: readonly T[]): T[] {
  return [...new Set(values.filter(Boolean))];
}
