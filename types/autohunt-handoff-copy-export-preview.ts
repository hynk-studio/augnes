import type {
  AutohuntHandoffPlanOperatorDecision,
  AutohuntHandoffPlanOperatorReviewDecision,
  AutohuntHandoffPlanOperatorReviewDecisionAuthorityBoundary,
  AutohuntHandoffPlanOperatorReviewDecisionReadback,
  AutohuntHandoffPlanOperatorReviewDecisionStatus,
} from "@/types/autohunt-handoff-plan-operator-review-decision";

export const AUTOHUNT_HANDOFF_COPY_EXPORT_PREVIEW_KIND =
  "autohunt_handoff_copy_export_preview" as const;

export const AUTOHUNT_HANDOFF_COPY_EXPORT_PREVIEW_VERSION =
  "autohunt_handoff_copy_export_preview.v0.1" as const;

export const AUTOHUNT_HANDOFF_COPY_EXPORT_PREVIEW_STATUSES = [
  "ready_for_operator_copy_review",
  "missing_accepted_decision",
  "source_decision_not_accepted",
  "source_decision_fingerprint_mismatch",
  "source_handoff_plan_binding_missing",
  "unsafe_material_refused",
  "blocked",
  "insufficient_data",
] as const;

export const AUTOHUNT_HANDOFF_COPY_EXPORT_BLOCKED_ACTIONS = [
  "start_runner",
  "schedule_runner",
  "execute_codex",
  "call_github",
  "create_branch_or_pr",
  "merge",
  "deploy",
  "publish_external",
  "call_provider_or_openai",
  "fetch_sources",
  "run_retrieval",
  "write_memory",
  "promote_perspective",
  "mutate_cwp",
  "mutate_work",
  "write_proof_or_evidence",
  "auto_apply_delta",
] as const;

export type AutohuntHandoffCopyExportPreviewStatus =
  (typeof AUTOHUNT_HANDOFF_COPY_EXPORT_PREVIEW_STATUSES)[number];

export type AutohuntHandoffCopyExportBlockedAction =
  (typeof AUTOHUNT_HANDOFF_COPY_EXPORT_BLOCKED_ACTIONS)[number];

export type AutohuntHandoffCopyExportPreviewScope = "project:augnes";

export type AutohuntHandoffCopyExportAuthorityBoundary =
  AutohuntHandoffPlanOperatorReviewDecisionAuthorityBoundary;

export interface AutohuntHandoffCopyExportSourceOperatorDecision {
  decision_id: string | null;
  decision_fingerprint: string | null;
  decision_status: AutohuntHandoffPlanOperatorReviewDecisionStatus | null;
  operator_decision: AutohuntHandoffPlanOperatorDecision | null;
  approval_scope:
    | "future_supervised_handoff_copy_export_planning_only"
    | string
    | null;
}

export interface AutohuntHandoffCopyExportSourceHandoffPlan {
  handoff_plan_id: string | null;
  handoff_plan_fingerprint: string | null;
  prompt_plan_id: string | null;
  review_packet_id: string | null;
  selected_candidate_ids: string[];
  selected_candidate_fingerprints: string[];
}

export interface AutohuntHandoffCopyPacket {
  copy_packet_id: string;
  copy_packet_title: string;
  goal_summary: string;
  required_context_refs: string[];
  source_refs: string[];
  source_fingerprints: string[];
  selected_candidate_refs: string[];
  implementation_constraints: string[];
  acceptance_criteria: string[];
  required_checks: string[];
  expected_result_report_sections: string[];
  non_goals: string[];
  blocked_actions: AutohuntHandoffCopyExportBlockedAction[];
  operator_warnings: string[];
  copy_packet_fingerprint: string;
  raw_copy_text_persisted: false;
}

export interface AutohuntHandoffCopyExportDraftPrPlanPreview {
  branch_name_preview: string;
  pr_title_preview: string;
  pr_body_section_labels: string[];
  expected_changed_file_globs: string[];
  max_changed_files: number;
  checks_to_run: string[];
  reviewer_focus: string[];
  raw_pr_body_persisted: false;
}

export interface AutohuntHandoffCopyExportBoundary {
  export_ready_for_manual_copy: boolean;
  copy_button_rendered: false;
  file_download_rendered: false;
  launch_button_rendered: false;
  clipboard_written: false;
  file_written: false;
  codex_executed: false;
  github_called: false;
  branch_or_pr_created: false;
}

export interface AutohuntHandoffCopyExportPersistedMaterialBoundary {
  persists_source_fingerprints: true;
  persists_copy_export_policy: true;
  persists_raw_copy_text: false;
  persists_raw_prompt_text: false;
  persists_raw_pr_body: false;
  persists_raw_operator_note: false;
  persists_raw_source_payload: false;
  persists_secret_or_token: false;
  persists_url_or_env_value: false;
}

export interface AutohuntHandoffCopyExportValidation {
  passed: boolean;
  source_decision_present: boolean;
  source_decision_accepted: boolean;
  operator_decision_accepts: boolean;
  source_decision_fingerprint_verified: boolean;
  approval_scope_limited: boolean;
  source_handoff_plan_binding_present: boolean;
  required_checks_present: boolean;
  required_blocked_actions_present: boolean;
  authority_boundary_all_false: boolean;
  export_boundary_passive: boolean;
  persisted_material_boundary_safe: boolean;
  raw_material_absent: boolean;
  copy_packet_safe: boolean;
  blocker_reasons: string[];
  warning_reasons: string[];
}

export interface AutohuntHandoffCopyExportPreview {
  copy_export_preview_kind: typeof AUTOHUNT_HANDOFF_COPY_EXPORT_PREVIEW_KIND;
  copy_export_preview_version: typeof AUTOHUNT_HANDOFF_COPY_EXPORT_PREVIEW_VERSION;
  scope: AutohuntHandoffCopyExportPreviewScope;
  as_of: string;
  preview_status: AutohuntHandoffCopyExportPreviewStatus;
  source_operator_decision: AutohuntHandoffCopyExportSourceOperatorDecision;
  source_handoff_plan: AutohuntHandoffCopyExportSourceHandoffPlan;
  copy_packet: AutohuntHandoffCopyPacket;
  draft_pr_plan_preview: AutohuntHandoffCopyExportDraftPrPlanPreview;
  export_boundary: AutohuntHandoffCopyExportBoundary;
  authority_boundary: AutohuntHandoffCopyExportAuthorityBoundary;
  persisted_material_boundary: AutohuntHandoffCopyExportPersistedMaterialBoundary;
  validation: AutohuntHandoffCopyExportValidation;
  preview_fingerprint: string;
}

export type AutohuntHandoffCopyExportPreviewSource =
  | AutohuntHandoffPlanOperatorReviewDecisionReadback
  | AutohuntHandoffPlanOperatorReviewDecision
  | null
  | undefined;

export interface AutohuntHandoffCopyExportPreviewInput {
  source_operator_decision: AutohuntHandoffCopyExportPreviewSource;
  as_of?: string;
  operator_display_hints?: {
    display_title_ref?: string | null;
    display_goal_ref?: string | null;
    source_refs?: string[];
    hint_fingerprints?: string[];
  } | null;
  raw_material_probe?: unknown;
}
