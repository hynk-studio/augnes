import type { RecentProjectEntryV01 } from "./project-onboarding";
import type { ProjectHomeProjectionV01 } from "./project-home";
import type { DelegatedWorkProjectionV01 } from "./delegated-work";

export const BLANK_STATE_VIEW_VERSION_V01 = "blank_state_view.v0.1" as const;

export type BlankStateRouteModeV01 =
  | "canonical"
  | "project_management"
  | "viewed_project";

export type BlankStateFocusV01 =
  | "no_projects"
  | "project_choice"
  | "viewed_project_inactive"
  | "project_root_unavailable"
  | "work_requires_attention"
  | "work_in_progress"
  | "result_ready"
  | "attention_required"
  | "ready_to_continue";

export type BlankStatePrimaryActionV01 =
  | {
      kind: "choose_folder";
      label: string;
    }
  | {
      kind: "open_recent" | "locate_folder" | "make_active";
      label: string;
      project_id: string;
    }
  | {
      kind: "link";
      label: string;
      href: string;
      entry_state: string | null;
    };

export interface BlankStateSourceV01 {
  route_mode: BlankStateRouteModeV01;
  requested_project_id: string | null;
  active_project_id: string | null;
  recent_projects: RecentProjectEntryV01[];
  projection: ProjectHomeProjectionV01 | null;
  project_resolution: "none" | "resolved" | "not_found" | "unavailable";
  direct_host_round_trip_available: boolean;
  delegated_work: DelegatedWorkProjectionV01 | null;
}

export interface BlankStateViewV01 {
  blank_state_view_version: typeof BLANK_STATE_VIEW_VERSION_V01;
  focus: BlankStateFocusV01;
  route_mode: BlankStateRouteModeV01;
  project_name: string | null;
  project_context_label: "Current project" | "Viewed project" | null;
  heading: string;
  situation: string;
  material_note: string | null;
  primary_action: BlankStatePrimaryActionV01;
  project_management_emphasized: boolean;
  current_work: null | {
    status: string;
    goal: string | null;
    result_summary: string | null;
    verification: null | {
      passed: number;
      failed: number;
      skipped: number;
    };
    exact_detail_href: string | null;
    delegated_work: null | {
      stage: DelegatedWorkProjectionV01["stage"];
      stage_label: string;
      latest_checkpoint: string | null;
      last_observed_at: string | null;
      trusted_result_available: boolean;
      href: string;
    };
  };
  additional_attention: Array<{
    id: string;
    summary: string;
    reason: string;
    href: string | null;
    label: string;
  }>;
  recent_change: null | {
    summary: string;
    occurred_at: string;
  };
  why_this_is_next: {
    observed: string[];
    inferred: Array<{ statement: string; caveats: string[] }>;
    needs_user_judgment: string[];
  };
  projection_only: true;
  semantic_authority_granted: false;
}
