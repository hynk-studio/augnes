import type { RecentProjectEntryV01 } from "./project-onboarding";
import type { ProjectHomeProjectionV01 } from "./project-home";
import type { DelegatedWorkProjectionV01 } from "./delegated-work";
import type {
  ContinuityPinEligibilityV01,
  ProjectContinuityPinProjectionV01,
} from "./continuity-pins";

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

export type BlankStateContinuitySourceFamilyV01 =
  | "project_lifecycle"
  | "delegated_work"
  | "current_run"
  | "saved_result"
  | "project_attention"
  | "recent_change"
  | "continuation";

export type BlankStateAttentionCategoryV01 =
  | "access_judgment"
  | "explicit_resume"
  | "reconciliation"
  | "result_review"
  | "project_recovery"
  | "project_activation"
  | "pending_review";

export type BlankStateAttentionCountStatusV01 =
  | "complete"
  | "lower_bound"
  | "source_incomplete";

export interface BlankStateContinuityLinkV01 {
  label: string;
  href: string;
}

export interface BlankStateContinuityItemV01 {
  item_id: string;
  source_family: BlankStateContinuitySourceFamilyV01;
  work_name: string;
  meaningful_state: string;
  requires_human_attention: boolean;
  attention_category: BlankStateAttentionCategoryV01 | null;
  last_meaningful_change: null | {
    summary: string;
    occurred_at: string;
  };
  consequential_detail: string | null;
  next_action: BlankStatePrimaryActionV01 | null;
  secondary_action: BlankStateContinuityLinkV01 | null;
  verification: null | {
    passed: number;
    failed: number;
    skipped: number;
  };
  exact_detail_href: string | null;
  pinning: ContinuityPinEligibilityV01;
  projection_only: true;
  semantic_authority_granted: false;
}

export const CONTINUITIES_TEMPORAL_CONTEXT_VERSION_V01 =
  "continuities_temporal_context.v0.1" as const;

export interface ContinuitiesTemporalNextItemV01 {
  item_id: string;
  label: string;
  reason: string;
  href: string | null;
}

export interface ContinuitiesTemporalRecentItemV01 {
  item_id: string;
  summary: string;
  occurred_at: string;
  href: string | null;
}

export interface ContinuitiesTemporalContextV01 {
  temporal_context_version:
    typeof CONTINUITIES_TEMPORAL_CONTEXT_VERSION_V01;
  current: {
    label: string;
    summary: string;
  };
  next_items: ContinuitiesTemporalNextItemV01[];
  recent_items: ContinuitiesTemporalRecentItemV01[];
  projection_only: true;
  semantic_authority_granted: false;
}

export interface BlankStateSourceV01 {
  route_mode: BlankStateRouteModeV01;
  requested_project_id: string | null;
  active_project_id: string | null;
  recent_projects: RecentProjectEntryV01[];
  projection: ProjectHomeProjectionV01 | null;
  project_resolution: "none" | "resolved" | "not_found" | "unavailable";
  direct_host_round_trip_available: boolean;
  delegated_work: DelegatedWorkProjectionV01 | null;
  continuity_pins?: ProjectContinuityPinProjectionV01 | null;
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
  continuity_summary: string;
  /** Deduplicated consequential items that PC1 received and composed exactly. */
  known_attention_count: number;
  /** Whether the known count is exact or bounded by incomplete upstream input. */
  attention_count_status: BlankStateAttentionCountStatusV01;
  /** Deduplicated continuity items that PC1 received and composed exactly. */
  known_continuity_item_count: number;
  /** Known composed items omitted after PC1 applies its five-item view bound. */
  locally_omitted_item_count: number;
  /**
   * Project Home attention records omitted before PC1 composition. Null means
   * the source count was structurally inconsistent and was not fabricated.
   */
  source_omitted_attention_count: number | null;
  source_attention_destination: BlankStateContinuityLinkV01 | null;
  highlighted_item: BlankStateContinuityItemV01;
  continuity_items: BlankStateContinuityItemV01[];
  primary_action: BlankStatePrimaryActionV01 | null;
  project_management_emphasized: boolean;
  why_this_is_next: {
    observed: string[];
    inferred: Array<{ statement: string; caveats: string[] }>;
    needs_user_judgment: string[];
  };
  projection_only: true;
  semantic_authority_granted: false;
}
