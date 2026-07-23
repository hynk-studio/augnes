import {
  ordinaryActionLabelV02,
  publicGuideBriefTextV02,
} from "@/lib/vnext/guide-brief/public-guide-text";
import type { BlankStateViewV01 } from "@/types/vnext/blank-state";
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

/** Final public-copy safety sanitizer; structured GuideBrief mapping is primary. */
export function publicBlankStateTextV01(value: string): string {
  return publicGuideBriefTextV02(value);
}
