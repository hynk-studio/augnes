import type {
  SharedProjectInspectorSectionKindV01,
  SharedProjectInspectorSectionV01,
  SharedProjectInspectorTargetV01,
} from "./shared-project-inspector";

export const CONTEXTUAL_INSPECTOR_VIEW_VERSION_V01 =
  "contextual_inspector_view.v0.1" as const;

export type ContextualInspectorRelatedContextKindV01 =
  | "ai_workplane_home"
  | "suggested_change"
  | "result"
  | "delegated_work"
  | "blank_state";

export interface ContextualInspectorRelatedContextV01 {
  kind: ContextualInspectorRelatedContextKindV01;
  label: string;
  href: string;
  explanation: string;
}

export type ContextualInspectorExactStatusV01 =
  | "complete"
  | "partial"
  | "bounded_incomplete"
  | "conflict"
  | "missing"
  | "inactive_read_only"
  | "unavailable";

export interface ContextualInspectorViewV01 {
  presentation_version: typeof CONTEXTUAL_INSPECTOR_VIEW_VERSION_V01;
  target_kind: SharedProjectInspectorTargetV01["target_kind"];
  target_label: string;
  heading: string;
  target_summary: string;
  status: ContextualInspectorExactStatusV01;
  status_label: string;
  status_explanation: string;
  material_notice: string | null;
  observed_at: string | null;
  related_context: ContextualInspectorRelatedContextV01;
  primary_sections: SharedProjectInspectorSectionV01[];
  additional_sections: SharedProjectInspectorSectionV01[];
  default_open_section_kind: SharedProjectInspectorSectionKindV01 | null;
  authority: {
    writes_database: false;
    creates_evidence: false;
    accepts_evidence: false;
    establishes_claim_truth: false;
    creates_proposal: false;
    creates_decision: false;
    authorizes_project_change: false;
    applies_project_change: false;
    starts_or_controls_work: false;
    calls_model_or_provider: false;
    performs_external_action: false;
    repairs_source_conflict: false;
  };
}
