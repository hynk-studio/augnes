export const TRANSITION_RELATIONS = [
  "continuity",
  "revision",
  "drift",
  "branch",
  "reversal",
  "suspension",
] as const;

export type TransitionRelation = (typeof TRANSITION_RELATIONS)[number];

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
  scope: string;
  as_of: string;
  generator: PreviewGenerator;
  model: string | null;
  preview: TemporalInterpretationPreview;
  guardrails: TemporalPreviewGuardrailResult;
  openai_error?: string;
  boundaries: string[];
};
