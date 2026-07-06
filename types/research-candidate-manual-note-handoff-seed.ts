// Type-only, candidate-only preview contract for compiling a visible manual
// Research Candidate Review preview into a copyable Codex handoff seed. This is
// not Codex execution, GitHub automation, source fetching, retrieval/RAG,
// proof/evidence, durable Perspective state, work mutation, or product write.

import type {
  ResearchCandidateReviewPreviewResponse,
  ResearchCandidateReviewScope,
} from "@/types/research-candidate-review";

export type ResearchCandidateManualNoteHandoffSeedKind =
  "research_candidate_manual_note_handoff_seed";

export type ResearchCandidateManualNoteHandoffSeedVersion =
  "research_candidate_manual_note_handoff_seed.v0.1";

export type ResearchCandidateManualNoteHandoffSeedRecommendationStatus =
  | "ready_for_human_operator_copy_review"
  | "blocked_missing_manual_candidate_context";

export interface ResearchCandidateManualNoteHandoffSeedParserWarning {
  code: string;
  message: string;
  line?: number;
}

export interface ResearchCandidateManualNoteHandoffSeedSourceMetadata {
  result_source?:
    | "local_parse"
    | "persisted_preview_draft"
    | "route_only_no_persistence"
    | "stored_preview_draft"
    | "discarded_preview_draft";
  parser_version?: string;
  preview_draft_id?: string | null;
  input_fingerprint?: string | null;
  created_at?: string | null;
  persisted_preview_draft?: boolean;
  operator_preview_label?: string | null;
}

export interface ResearchCandidateManualNoteHandoffSeedInput {
  preview: ResearchCandidateReviewPreviewResponse;
  warnings?: ResearchCandidateManualNoteHandoffSeedParserWarning[];
  source_metadata?: ResearchCandidateManualNoteHandoffSeedSourceMetadata;
  operator_note?: string;
  target_label?: string;
}

export interface ResearchCandidateManualNoteSelectedContextCard {
  card_id: string;
  card_kind:
    | "research_session"
    | "source_reference"
    | "claim_candidate"
    | "evidence_candidate"
    | "tension_candidate"
    | "knowledge_gap_candidate"
    | "perspective_delta_candidate"
    | "follow_up_work_candidate";
  title: string;
  summary: string;
  source_refs: string[];
  candidate_ids: string[];
  preview_only: true;
  source_of_truth: false;
}

export interface ResearchCandidateManualNoteHandoffCandidateSummary {
  research_question: string;
  operator_intent: string;
  total_candidate_count: number;
  claim_count: number;
  evidence_count: number;
  tension_count: number;
  knowledge_gap_count: number;
  perspective_delta_count: number;
  follow_up_work_count: number;
  parser_warning_count: number;
}

export interface ResearchCandidateManualNoteHandoffExpectedObservedDeltaSeed {
  expected_delta_summary: string;
  observed_delta_required: true;
  candidate_context_refs: string[];
  return_field: "expected vs observed delta summary";
}

export interface ResearchCandidateManualNoteHandoffReuseOutcomeReviewSeed {
  required: true;
  allowed_outcomes: Array<
    "helpful" | "stale" | "missing" | "noisy" | "misleading"
  >;
  return_field: "whether selected candidate context was helpful/stale/missing/noisy/misleading";
}

export interface ResearchCandidateManualNoteHandoffSeedAuthorityBoundary {
  candidate_only: true;
  preview_only: true;
  copyable_text_only: true;
  source_of_truth: false;
  can_execute_codex: false;
  can_create_branch: false;
  can_open_pr: false;
  can_call_github: false;
  can_send_external_handoff: false;
  can_call_providers_or_openai: false;
  can_fetch_sources: false;
  can_run_retrieval_rag_embeddings_vector_fts_or_crawler: false;
  can_write_db: false;
  can_write_proof_or_evidence: false;
  can_create_work_item: false;
  can_promote_perspective: false;
  can_mutate_committed_augnes_state: false;
  can_allocate_product_ids: false;
  can_execute_product_write: false;
}

export interface ResearchCandidateManualNoteHandoffSeedValidation {
  passed: boolean;
  failure_codes: string[];
  copyable_prompt_plain_text: boolean;
  copyable_prompt_not_markdown_fenced: boolean;
  source_refs_present: boolean;
  candidate_context_present: boolean;
  no_fabricated_geometry_or_substrate_lineage: true;
  authority_boundary_safe: boolean;
}

export interface ResearchCandidateManualNoteHandoffSeed {
  seed_kind: ResearchCandidateManualNoteHandoffSeedKind;
  seed_version: ResearchCandidateManualNoteHandoffSeedVersion;
  scope: ResearchCandidateReviewScope;
  seed_fingerprint: string;
  fingerprint_algorithm: "fnv1a32_canonical_json_v0_1";
  source_preview_session_id: string;
  source_preview_draft_id: string | null;
  source_input_fingerprint: string | null;
  source_preview_refs: string[];
  source_refs: string[];
  selected_context_cards: ResearchCandidateManualNoteSelectedContextCard[];
  candidate_summary: ResearchCandidateManualNoteHandoffCandidateSummary;
  selected_claim_candidate_ids: string[];
  selected_evidence_candidate_ids: string[];
  unresolved_tension_candidate_ids: string[];
  knowledge_gap_candidate_ids: string[];
  perspective_delta_candidate_ids: string[];
  follow_up_work_candidate_ids: string[];
  copyable_prompt: string;
  expected_return_report_fields: string[];
  expected_observed_delta_seed: ResearchCandidateManualNoteHandoffExpectedObservedDeltaSeed;
  reuse_outcome_review_seed: ResearchCandidateManualNoteHandoffReuseOutcomeReviewSeed;
  stop_conditions: string[];
  forbidden_actions: string[];
  authority_boundary: ResearchCandidateManualNoteHandoffSeedAuthorityBoundary;
  validation: ResearchCandidateManualNoteHandoffSeedValidation;
  recommendation_status: ResearchCandidateManualNoteHandoffSeedRecommendationStatus;
  next_recommended_slice: "manual_research_candidate_handoff_seed_operator_review_v0_1";
}
