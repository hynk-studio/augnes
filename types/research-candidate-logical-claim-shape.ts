// Type-only contract for Logical Claim Shape Preview v0.1.
// This preview is structure-only: not proof, not theorem proving, not formal
// verification, not truth, not Perspective promotion, not durable state, not
// execution authority, and not product write.

export type ResearchCandidateLogicalClaimShapeVersion =
  "logical_claim_shape_preview.v0.1";

export type ResearchCandidateLogicalClaimShapeScope = "project:augnes";

export type ResearchCandidateLogicalClaimShapeStatus = "structure_preview_only";

export type LogicalClaimInferenceType =
  | "direct_observation"
  | "source_summary"
  | "abductive_hypothesis"
  | "analogy"
  | "extrapolation"
  | "operational_translation"
  | "causal_claim"
  | "comparison"
  | "definition"
  | "unknown";

export type LogicalClaimStatus =
  | "well_structured_candidate"
  | "missing_premise"
  | "missing_conclusion"
  | "missing_source_grounding"
  | "possible_non_sequitur"
  | "contradicted_by_candidate"
  | "underspecified"
  | "blocked";

export type LogicalClaimReviewCue =
  | "inspect_source"
  | "add_premise"
  | "clarify_conclusion"
  | "state_missing_assumption"
  | "resolve_counterclaim"
  | "resolve_contradiction"
  | "add_evidence"
  | "defer"
  | "no_action";

export type LogicalClaimShapeReasonCode =
  | "claim_text_present"
  | "claim_text_missing"
  | "source_ref_present"
  | "source_ref_missing"
  | "premise_present"
  | "premise_missing"
  | "conclusion_present"
  | "conclusion_missing"
  | "evidence_present"
  | "evidence_missing"
  | "counterclaim_present"
  | "contradiction_present"
  | "tension_present"
  | "knowledge_gap_present"
  | "missing_assumption_present"
  | "calibration_blocked"
  | "calibration_ready_with_tensions"
  | "calibration_overclaim_risk"
  | "structure_only_not_proof";

export interface LogicalClaimShapeAuthorityBoundary {
  structure_preview_only: true;
  proof_check: false;
  theorem_proving: false;
  formal_verification: false;
  source_of_truth: false;
  proof_or_evidence_record: false;
  perspective_promotion: false;
  durable_perspective_state: false;
  work_mutation: false;
  execution_authority: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  provider_openai_authority: false;
  source_fetch_authority: false;
  retrieval_rag_authority: false;
  git_ledger_export_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
}

export interface LogicalClaimShapePreview {
  shape_version: ResearchCandidateLogicalClaimShapeVersion;
  scope: ResearchCandidateLogicalClaimShapeScope;
  status: ResearchCandidateLogicalClaimShapeStatus;
  as_of: string;
  claim_candidate_id: string;
  source_refs: string[];
  source_coverage_boundary_note?: string;
  claim_text: string;
  inference_type: LogicalClaimInferenceType;
  premise_candidate_ids: string[];
  premise_summaries: string[];
  conclusion_text: string;
  missing_assumption_notes: string[];
  possible_counterclaim_candidate_ids: string[];
  contradiction_candidate_ids: string[];
  related_tension_candidate_ids: string[];
  related_knowledge_gap_candidate_ids: string[];
  calibration_ref?: string;
  calibration_readiness_label?: string;
  calibration_reason_codes: string[];
  logical_status: LogicalClaimStatus;
  review_cues: LogicalClaimReviewCue[];
  reason_codes: LogicalClaimShapeReasonCode[];
  shape_summary: string;
  authority_boundary: LogicalClaimShapeAuthorityBoundary;
}

export interface LogicalClaimShapePreviewReport {
  shape_version: ResearchCandidateLogicalClaimShapeVersion;
  scope: ResearchCandidateLogicalClaimShapeScope;
  status: ResearchCandidateLogicalClaimShapeStatus;
  as_of: string;
  source_fixture_refs: string[];
  claim_shapes: LogicalClaimShapePreview[];
  logical_status_counts: Record<LogicalClaimStatus, number>;
  review_cue_counts: Record<LogicalClaimReviewCue, number>;
  shape_queue: {
    blocked: string[];
    missing_premise: string[];
    missing_conclusion: string[];
    contradictions: string[];
    ready_for_review: string[];
  };
  boundary_notes: string[];
  shape_fingerprint: string;
  authority_boundary: LogicalClaimShapeAuthorityBoundary;
}

export interface LogicalClaimShapeValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface LogicalClaimShapeCandidateReviewInput {
  claim_candidates?: unknown[];
  evidence_candidates?: unknown[];
  tension_candidates?: unknown[];
  knowledge_gap_candidates?: unknown[];
}

export interface LogicalClaimShapePreviewBuilderInput {
  scope: ResearchCandidateLogicalClaimShapeScope;
  as_of: string;
  source_fixture_refs: string[];
  candidate_review: LogicalClaimShapeCandidateReviewInput;
  calibration_diagnostic?: {
    diagnostics?: unknown[];
  };
}
