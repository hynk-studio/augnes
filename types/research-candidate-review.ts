// This file is a type-only, non-SSOT preview contract for the Research
// Candidate Review Surface v0.1 static fixture. It is not a DB schema, not an API route contract,
// not a runtime parser, not a provider prompt, not a durable memory schema,
// not a proof/evidence record, not a work mutation path,
// and not perspective promotion authority.

export type ResearchCandidateReviewFixtureVersion = "research_candidate_review.sample.v0.1";

export type ResearchCandidateReviewPreviewVersion = "research_candidate_review.v0.1";

export type ResearchCandidateReviewScope = "project:augnes";

export type ResearchCandidateReviewStatus = "sample_fixture_only" | "candidate_preview_only";

export interface ResearchCandidateReviewAuthority {
  candidate_only: true;
  source_of_truth: false;
  creates_evidence: false;
  creates_proof: false;
  commits_state: false;
  promotes_perspective: false;
  creates_work_item: false;
}

export type ResearchReviewStatus =
  | "candidate_only"
  | "needs_review"
  | "reviewed_reference_only"
  | "rejected"
  | "superseded";

export type ResearchEpistemicStatus =
  | "operator_note"
  | "candidate_claim"
  | "weakly_supported"
  | "supported"
  | "contested"
  | "contradicted"
  | "hypothesis_only"
  | "promoted"
  | "retired";

export type PerspectiveDeltaType =
  | "add"
  | "refine"
  | "weaken"
  | "reverse"
  | "split"
  | "merge"
  | "retire"
  | "reweight"
  | "reactivate";

export type PromotionReadiness = "not_ready" | "weak_ready" | "ready_with_tensions" | "ready" | "blocked";

export type EvidenceRole = "supports" | "contradicts" | "contextualizes" | "qualifies" | "method" | "limitation";

export type TensionType =
  | "contradiction"
  | "ambiguity"
  | "missing_context"
  | "authority_risk"
  | "schema_misread_risk"
  | "scope_limit"
  | "method_limit"
  | "implementation_conflict";

export interface SourceReferencePreview {
  source_ref_id: string;
  title: string;
  authors_or_origin: string;
  identifier_or_url: string;
  reference_source: string;
  source_status: string;
  operator_note_summary: string;
  review_status: ResearchReviewStatus;
  boundary_notes: string;
}

export interface ResearchSessionPreview {
  session_id: string;
  scope: ResearchCandidateReviewScope;
  work_id: string;
  research_question: string;
  operator_intent: string;
  source_refs: string[];
  claim_candidate_count: number;
  evidence_candidate_count: number;
  tension_candidate_count: number;
  knowledge_gap_candidate_count: number;
  perspective_delta_candidate_count: number;
  follow_up_work_candidate_count: number;
  review_status: ResearchReviewStatus;
  boundary_notes: string;
}

export type SourceGrounding =
  | { source_ref_id: string; source_refs?: string[] }
  | { source_ref_id?: string; source_refs: string[] };

export interface CandidateBoundaryFields {
  review_status: ResearchReviewStatus;
  boundary_notes: string;
}

export type EpistemicCandidateFields = SourceGrounding &
  CandidateBoundaryFields & {
    epistemic_status: ResearchEpistemicStatus;
  };

export type ClaimCandidate = EpistemicCandidateFields & {
  claim_candidate_id: string;
  claim_text: string;
  claim_type: string;
  confidence_label: string;
  supporting_evidence_candidate_ids: string[];
  contradicting_evidence_candidate_ids: string[];
};

export type EvidenceCandidate = EpistemicCandidateFields & {
  evidence_candidate_id: string;
  claim_candidate_id: string;
  evidence_summary: string;
  evidence_role: EvidenceRole;
  locator: string;
  quality_note: string;
};

export type TensionCandidate = EpistemicCandidateFields & {
  tension_candidate_id: string;
  summary: string;
  related_claim_candidate_ids: string[];
  related_evidence_candidate_ids: string[];
  tension_type: TensionType;
  operator_question: string;
  blocks_or_qualifies_promotion: boolean;
};

export type KnowledgeGapCandidate = EpistemicCandidateFields & {
  knowledge_gap_candidate_id: string;
  summary: string;
  why_it_matters: string;
  related_claim_candidate_ids: string[];
  related_tension_candidate_ids: string[];
  suggested_next_reading: string[];
};

export type PerspectiveDeltaCandidate = EpistemicCandidateFields & {
  perspective_delta_candidate_id: string;
  target_perspective_key: string;
  delta_type: PerspectiveDeltaType;
  before_summary: string;
  after_summary: string;
  proposed_update_summary: string;
  basis_claim_candidate_ids: string[];
  basis_evidence_candidate_ids: string[];
  related_tension_candidate_ids: string[];
  related_gap_candidate_ids: string[];
  risk_or_conflict_note: string;
  promotion_readiness: PromotionReadiness;
};

export type FollowUpWorkCandidate = CandidateBoundaryFields & {
  follow_up_work_candidate_id: string;
  candidate_title: string;
  candidate_scope: ResearchCandidateReviewScope;
  candidate_summary: string;
  reason: string;
  suggested_expected_files: string[];
  suggested_expected_checks: string[];
};

export interface ResearchCandidateReviewPreviewResponse {
  fixture_version?: ResearchCandidateReviewFixtureVersion;
  preview_version?: ResearchCandidateReviewPreviewVersion;
  scope: ResearchCandidateReviewScope;
  status: ResearchCandidateReviewStatus;
  authority: ResearchCandidateReviewAuthority;
  research_session_preview: ResearchSessionPreview;
  source_reference_previews: SourceReferencePreview[];
  claim_candidates: ClaimCandidate[];
  evidence_candidates: EvidenceCandidate[];
  tension_candidates: TensionCandidate[];
  knowledge_gap_candidates: KnowledgeGapCandidate[];
  perspective_delta_candidates: PerspectiveDeltaCandidate[];
  follow_up_work_candidates: FollowUpWorkCandidate[];
}

export type ResearchCandidateReviewSampleFixture = ResearchCandidateReviewPreviewResponse & {
  fixture_version: ResearchCandidateReviewFixtureVersion;
  preview_version?: never;
  status: "sample_fixture_only";
};
