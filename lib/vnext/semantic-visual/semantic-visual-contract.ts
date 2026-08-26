export const SEMANTIC_VISUAL_PRIORITIES = [
  "situation",
  "primary-action",
  "ai-summary",
  "risk",
  "supporting",
  "raw-record",
] as const;

export type SemanticVisualPriority =
  (typeof SEMANTIC_VISUAL_PRIORITIES)[number];

export const SEMANTIC_VISUAL_PRIORITY = {
  situation: "situation",
  primaryAction: "primary-action",
  aiSummary: "ai-summary",
  risk: "risk",
  supporting: "supporting",
  rawRecord: "raw-record",
} as const satisfies Record<string, SemanticVisualPriority>;

export const SEMANTIC_SURFACE_ROLE = {
  blankState: "blank-state",
  aiWorkplane: "ai-workplane",
  guideBrief: "guide-brief",
  inspector: "inspector",
  management: "management",
  portability: "portability",
  recovery: "recovery",
} as const;

export function semanticVisualPriorityRank(
  priority: SemanticVisualPriority,
): number {
  return SEMANTIC_VISUAL_PRIORITIES.indexOf(priority);
}

export function semanticVisualOrderIsValid(
  priorities: readonly SemanticVisualPriority[],
): boolean {
  let previous = -1;
  for (const priority of priorities) {
    const current = semanticVisualPriorityRank(priority);
    if (current < previous) return false;
    previous = current;
  }
  return true;
}
