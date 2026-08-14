import type { SemanticWorkbenchShellStateV01 } from "@/components/workbench/semantic-workbench-shell";
import {
  buildSelectedWorkTimelineV01,
} from "@/lib/vnext/ai-workplane/selected-work-timeline";
import {
  selectAIWorkplaneChangeCandidateV01,
} from "@/lib/vnext/ai-workplane/ai-workplane-view";

import type { SemanticReviewProposalDetailV01 } from "./semantic-review-types";

export interface SemanticReviewEntryPresentationV01 {
  state: SemanticWorkbenchShellStateV01;
  label: string;
}

export function semanticReviewDetailEntryPresentationV01(
  read: SemanticReviewProposalDetailV01,
  selectedCandidateId: string | null,
): SemanticReviewEntryPresentationV01 {
  const selected = selectAIWorkplaneChangeCandidateV01(
    read,
    selectedCandidateId,
  );
  if (!selected) {
    return {
      state: "transition_blocked",
      label: "No exact selected change is available",
    };
  }
  const timeline = buildSelectedWorkTimelineV01({
    read,
    selected_candidate: selected,
  });
  const current = timeline.current_position;
  switch (current.stage) {
    case "review_focused":
      return {
        state:
          current.primary_action_owner === "decision"
            ? "pending_proposal"
            : "transition_blocked",
        label: current.title,
      };
    case "decision_recorded":
    case "proposal_only_accepted":
      return {
        state:
          current.primary_action_owner === "decision"
            ? "pending_proposal"
            : "decided_proposal",
        label: current.title,
      };
    case "deferred_until_condition":
      return {
        state:
          current.primary_action_owner === "decision"
            ? "pending_proposal"
            : "decided_proposal",
        label: current.title,
      };
    case "awaiting_application":
      return {
        state: "decided_proposal",
        label: current.title,
      };
    case "transition_blocked":
      return {
        state: "transition_blocked",
        label: current.title,
      };
    case "later_outcome_available":
      return {
        state: "feedback_needed",
        label: current.title,
      };
    case "project_updated":
    case "later_outcome_reviewed":
      return {
        state: "transition_applied",
        label: current.title,
      };
    case "source_observed":
    case "change_suggested":
      return {
        state: "transition_blocked",
        label: "Current selected-work position is unavailable",
      };
  }
}
