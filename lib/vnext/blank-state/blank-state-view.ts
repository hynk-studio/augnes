import {
  ordinaryActionLabelV02,
  publicGuideBriefTextV02,
} from "@/lib/vnext/guide-brief/public-guide-text";
import type {
  BlankStateContinuityItemV01,
  BlankStateViewV01,
} from "@/types/vnext/blank-state";
import type { ProjectGuideBriefV02 } from "@/types/vnext/guide-brief";

/**
 * Blank State is the Browser projection of the canonical GuideBrief. It owns
 * no independent focus or action selection.
 */
export function buildBlankStateViewV01(
  guide: ProjectGuideBriefV02,
): BlankStateViewV01 {
  return guide.projections.blank_state;
}

export function ordinaryActionLabel(entryState: string, fallback?: string): string {
  return ordinaryActionLabelV02(entryState, fallback);
}

export function blankStateAttentionLabelV01(
  item: Pick<
    BlankStateContinuityItemV01,
    "attention_category" | "next_action" | "source_family"
  >,
): string {
  if (item.attention_category) {
    return {
      access_judgment: "Needs you: access decision",
      explicit_resume: "Needs you: explicit resume",
      reconciliation: "Needs you: reconcile observation",
      result_review: "Needs you: review saved result",
      project_recovery: "Needs you: reconnect project",
      project_activation: "Needs you: activate viewed project",
      pending_review: "Needs you: consequential review",
    }[item.attention_category];
  }
  if (
    item.source_family === "project_lifecycle" &&
    item.next_action?.kind === "choose_folder"
  ) {
    return "Start by choosing a project";
  }
  return "No intervention required";
}

/** Final public-copy safety sanitizer; structured GuideBrief mapping is primary. */
export function publicBlankStateTextV01(value: string): string {
  return publicGuideBriefTextV02(value);
}
