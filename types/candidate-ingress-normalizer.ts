export const CANDIDATE_INGRESS_NORMALIZER_VERSION =
  "candidate_ingress_normalizer.v0.1" as const;

export type CandidateIngressSourceKind =
  | "selected_session_digest"
  | "project_history_digest"
  | "codex_result_report"
  | "research_note_digest"
  | "user_feedback_note"
  | "manual_operator_digest"
  | "unknown";

export type CandidateIngressCandidateKind =
  | "timeline_event"
  | "project_state_summary"
  | "decision"
  | "requirement"
  | "open_question"
  | "risk_or_blocker"
  | "changed_artifact_ref"
  | "evidence_ref"
  | "source_ref"
  | "next_action"
  | "reusable_context"
  | "expected_observed_signal"
  | "review_only";

export type CandidateIngressConfidence =
  | "explicit"
  | "inferred_heuristic"
  | "unknown";

export type CandidateIngressPersistenceHorizon =
  | "local_project_candidate_record"
  | "review_only"
  | "do_not_persist";

export interface CandidateIngressAuthorityProfile {
  source_of_truth: false;
  generated_view: boolean;
  candidate_material_only: true;
  can_write_memory: false;
  can_mutate_perspective: false;
  can_mutate_cwp: false;
  can_create_handoff: false;
}

export interface CandidateIngressNormalizedCandidate {
  candidate_id: string;
  candidate_kind: CandidateIngressCandidateKind;
  source_kind: CandidateIngressSourceKind;
  label: string;
  summary: string;
  source_ref: string;
  operator_ref: string;
  session_ref?: string;
  project_ref?: string;
  work_ref?: string;
  result_ref?: string;
  pr_ref?: string;
  commit_ref?: string;
  evidence_refs: string[];
  source_refs: string[];
  confidence: CandidateIngressConfidence;
  review_required: true;
  candidate_only: true;
  persistence_horizon: CandidateIngressPersistenceHorizon;
  authority_profile: CandidateIngressAuthorityProfile;
}

export interface CandidateIngressNormalizeCandidateInput {
  candidate_kind: CandidateIngressCandidateKind;
  source_kind: CandidateIngressSourceKind;
  label: string;
  summary: string;
  source_ref: string;
  operator_ref: string;
  session_ref?: string;
  project_ref?: string;
  work_ref?: string;
  result_ref?: string;
  pr_ref?: string;
  commit_ref?: string;
  evidence_refs?: string[];
  source_refs?: string[];
  confidence?: CandidateIngressConfidence;
  generated_view?: boolean;
  persistence_horizon?: CandidateIngressPersistenceHorizon;
  seed?: string;
}
