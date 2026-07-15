export const TRANSITION_RELATIONS = [
  "continuity",
  "revision",
  "drift",
  "branch",
  "reversal",
  "suspension",
] as const;

export type TransitionRelation = (typeof TRANSITION_RELATIONS)[number];

export const TEMPORAL_INTERPRETATION_AXES = [
  "factuality",
  "continuity",
  "user_context",
  "boundary",
  "exploration",
  "implementation",
  "stability",
  "revision",
] as const;

export type TemporalInterpretationAxis =
  (typeof TEMPORAL_INTERPRETATION_AXES)[number];

export const ACTIVE_CONTEXT_ADMISSION_ROLES = [
  "primary_active",
  "boundary_active",
  "tension_active",
  "counterexample_active",
  "preference_active",
] as const;

export type ActiveContextAdmissionRole =
  (typeof ACTIVE_CONTEXT_ADMISSION_ROLES)[number];

export const ACTIVE_CONTEXT_ADMISSION_CATEGORIES = [
  "admit_primary_active",
  "admit_boundary_active",
  "admit_tension_active",
  "retain_recallable",
  "exclude_duplicate",
  "exclude_summary_only",
  "exclude_out_of_scope",
  "suspend_pending_evidence",
] as const;

export type ActiveContextAdmissionCategory =
  (typeof ACTIVE_CONTEXT_ADMISSION_CATEGORIES)[number];

export const SUPPRESSED_ALTERNATIVE_STATUSES = [
  "deferred",
  "needs_approval",
  "blocked_now",
  "not_recommended",
] as const;

export type SuppressedAlternativeStatus =
  (typeof SUPPRESSED_ALTERNATIVE_STATUSES)[number];

export const AXIS_PRESSURE_LABELS = [
  "high",
  "medium",
  "low",
  "blocked",
  "needs_review",
] as const;

export type AxisPressureLabel = (typeof AXIS_PRESSURE_LABELS)[number];

export type PreviewGenerator = "openai" | "mock" | "mock_fallback";

export type TemporalPreviewEvidenceAnchor = {
  ref: string;
  claim: string;
  source_type: "committed_state" | "action_record" | "work_trace" | "doc";
};

export type TemporalPreviewSummaryRef = {
  ref: string;
  summary: string;
};

export type TemporalPreviewCounterexample = {
  ref: string;
  description: string;
};

export type TemporalPreviewTension = {
  ref: string;
  description: string;
};

export type TemporalPreviewAuthorityProfile = {
  committed_state_authority: string[];
  summary_only_refs: string[];
  allowed_now: string[];
  blocked_now: string[];
};

export type ActiveContextAdmissionRationale = {
  context_ref: string;
  admission_role: ActiveContextAdmissionRole;
  why_admitted: string;
  why_not_merely_summary: string;
};

export type ActiveContextAdmissionDecision = {
  candidate_id: string;
  category: ActiveContextAdmissionCategory;
  reason: string;
  source_authority: string;
  evidence_refs: string[];
  counterexample_refs: string[];
  residual_tension_refs: string[];
};

export type ActiveContextAdmission = {
  decisions: ActiveContextAdmissionDecision[];
  note: string;
};

export type SuppressedAlternative = {
  alternative: string;
  why_deferred: string;
  what_would_change_status: string;
  status: SuppressedAlternativeStatus;
};

export type TemporalHierarchyView = {
  raw_observation_level: string;
  work_or_session_level: string;
  project_status_level: string;
  current_interpretive_stance: string;
  hierarchy_caution: string;
};

export type MemoryLifecycleView = {
  active_context: string[];
  retrieved_context: string[];
  summary_or_view: string[];
  stale_or_deferred_context: string[];
  lifecycle_caution: string;
};

export type InterpretiveDriver = {
  axis: TemporalInterpretationAxis;
  driver: string;
  effect: string;
};

export type AxisPressure = {
  axis: TemporalInterpretationAxis;
  pressure: AxisPressureLabel;
  reason: string;
};

export type TemporalPreviewContext = {
  scope: string;
  as_of: string;
  current_interpretation: string;
  active_prior_context: string;
  evidence_anchors: TemporalPreviewEvidenceAnchor[];
  summary_refs: TemporalPreviewSummaryRef[];
  source_authority_profile: TemporalPreviewAuthorityProfile;
  counterexamples: TemporalPreviewCounterexample[];
  residual_tensions: TemporalPreviewTension[];
  user_preferences: string[];
  safe_next_step: string;
  non_authority_boundary: string;
  active_context_admission_rationale: ActiveContextAdmissionRationale[];
  active_context_admission: ActiveContextAdmission;
  suppressed_alternatives: SuppressedAlternative[];
  temporal_hierarchy_view: TemporalHierarchyView;
  memory_lifecycle_view: MemoryLifecycleView;
  interpretive_drivers: InterpretiveDriver[];
  axis_pressures: AxisPressure[];
};

export type TemporalInterpretationPreview = {
  current_interpretation: string;
  active_prior_context: string;
  evidence_anchors: TemporalPreviewEvidenceAnchor[];
  summary_refs: TemporalPreviewSummaryRef[];
  source_authority_profile: TemporalPreviewAuthorityProfile;
  counterexamples: TemporalPreviewCounterexample[];
  residual_tensions: TemporalPreviewTension[];
  transition_relation: TransitionRelation;
  revision_explanation: string;
  user_context_vs_factuality: string;
  active_context_admission_rationale: ActiveContextAdmissionRationale[];
  active_context_admission?: ActiveContextAdmission;
  suppressed_alternatives: SuppressedAlternative[];
  temporal_hierarchy_view: TemporalHierarchyView;
  memory_lifecycle_view: MemoryLifecycleView;
  interpretive_drivers: InterpretiveDriver[];
  axis_pressures: AxisPressure[];
  safe_next_step: string;
  non_authority_boundary: string;
  warnings: string[];
};

export type TemporalPreviewGuardrailResult = {
  passed: boolean;
  warnings: string[];
};

export type TemporalPreviewResponse = {
  runtime: "augnes";
  workspace_id: string;
  project_id: string;
  scope: string;
  as_of: string;
  generator: PreviewGenerator;
  model: string | null;
  preview: TemporalInterpretationPreview;
  guardrails: TemporalPreviewGuardrailResult;
  openai_error?: string;
  model_invocation_receipt: import("@/lib/vnext/model-gateway/contracts").ModelInvocationReceiptV01;
  boundaries: string[];
};
