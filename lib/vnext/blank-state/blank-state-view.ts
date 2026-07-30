import {
  ordinaryActionLabelV02,
  publicGuideBriefTextV02,
} from "@/lib/vnext/guide-brief/public-guide-text";
import type {
  BlankStateContinuityItemV01,
  BlankStatePresentationModeV01,
  BlankStateViewV01,
} from "@/types/vnext/blank-state";
import type { ProjectGuideBriefV02 } from "@/types/vnext/guide-brief";
import type {
  LocalFolderPickerOutcomeV01,
  ProjectOnboardingErrorCodeV01,
} from "@/types/vnext/project-onboarding";

export interface ProjectFolderSelectionMessageV01 {
  tone: "error" | "info";
  text: string;
}

/**
 * Blank State is the Browser projection of the canonical GuideBrief. It owns
 * no independent focus or action selection.
 */
export function buildBlankStateViewV01(
  guide: ProjectGuideBriefV02,
): BlankStateViewV01 {
  return guide.projections.blank_state;
}

export function blankStatePresentationModeV01(
  view: Pick<BlankStateViewV01, "focus">,
): BlankStatePresentationModeV01 {
  if (view.focus === "no_projects") return "local_project_onboarding";
  if (view.focus === "project_choice") return "project_choice";
  if (view.focus === "project_root_unavailable") return "project_recovery";
  if (view.focus === "viewed_project_inactive") {
    return "viewed_project_inactive";
  }
  return "active_continuities";
}

export function ordinaryActionLabel(entryState: string, fallback?: string): string {
  return ordinaryActionLabelV02(entryState, fallback);
}

export function projectFolderPickerMessageV01(
  picker: LocalFolderPickerOutcomeV01,
): ProjectFolderSelectionMessageV01 | null {
  if (picker.status === "selected") return null;
  if (picker.status === "cancelled") {
    return {
      tone: "info",
      text: "Folder selection was cancelled. Nothing changed.",
    };
  }
  if (picker.status === "unavailable") {
    return {
      tone: "error",
      text: "A native folder picker is unavailable on this system.",
    };
  }
  if (picker.error_code === "picker_timeout") {
    return {
      tone: "error",
      text: "The folder picker timed out before returning a selection. Try again.",
    };
  }
  return {
    tone: "error",
    text: "The folder picker could not be opened. Try again.",
  };
}

export function projectFolderSelectionErrorMessageV01(
  errorCode: ProjectOnboardingErrorCodeV01 | "project_management_unavailable",
): ProjectFolderSelectionMessageV01 {
  switch (errorCode) {
    case "selection_missing":
      return {
        tone: "error",
        text: "The selected folder is no longer available. Choose it again or select another folder.",
      };
    case "selection_inaccessible":
      return {
        tone: "error",
        text: "Augnes cannot read the selected folder. Check its permissions or choose another folder.",
      };
    case "selection_not_directory":
      return {
        tone: "error",
        text: "The selected item is not a folder. Choose a folder to continue.",
      };
    case "inspection_failed":
      return {
        tone: "error",
        text: "Augnes could not inspect the selected folder. Nothing was changed; try again or choose another folder.",
      };
    case "selection_invalid":
    case "selection_tampered":
      return {
        tone: "error",
        text: "The selected folder could not be verified. Choose it again.",
      };
    default:
      return {
        tone: "error",
        text: "Augnes could not add the selected folder. Nothing was changed; try again or choose another folder.",
      };
  }
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
