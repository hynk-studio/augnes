import type { ExternalRefV01 } from "./external-ref";
import { EPISODE_DELTA_PROPOSAL_VERSION_V01 } from "./episode-delta-proposal";

export const REVIEW_DECISION_VERSION_V01 = "review_decision.v0.1" as const;
export const REVIEW_DECISION_CANONICALIZATION_V01 =
  "augnes-json-c14n-v0_1" as const;

export const REVIEW_DECISION_VALUES_V01 = [
  "accept",
  "reject",
  "defer",
  "supersede",
  "retract",
] as const;

export const REVIEW_DECISION_REQUESTED_TRANSITION_KINDS_V01 = [
  "semantic_candidate_apply",
  "semantic_candidate_supersede",
  "semantic_candidate_retract",
  "other",
] as const;

export type ReviewDecisionValueV01 =
  (typeof REVIEW_DECISION_VALUES_V01)[number];
export type ReviewDecisionRequestedTransitionKindV01 =
  (typeof REVIEW_DECISION_REQUESTED_TRANSITION_KINDS_V01)[number];

export interface ReviewDecisionSourceProposalBindingV01 {
  proposal_version: typeof EPISODE_DELTA_PROPOSAL_VERSION_V01;
  proposal_id: string;
  proposal_fingerprint: string;
}

export interface ReviewDecisionCandidateBindingV01 {
  candidate_id: string;
  candidate_fingerprint: string;
}

export interface ReviewDecisionPriorDecisionBindingV01 {
  decision_id: string;
  decision_fingerprint: string;
}

export interface ReviewDecisionLineageV01 {
  prior_decisions: ReviewDecisionPriorDecisionBindingV01[];
  superseding_candidate: ReviewDecisionCandidateBindingV01 | null;
  retracted_decision: ReviewDecisionPriorDecisionBindingV01 | null;
}

export interface ReviewDecisionRevisitV01 {
  revisit_at: string | null;
  expires_at: string | null;
  condition_summary: string | null;
}

export interface ReviewDecisionRequestedTransitionIntentV01 {
  intent_id: string;
  transition_kind: ReviewDecisionRequestedTransitionKindV01;
  bounded_summary: string;
  target_refs: ExternalRefV01[];
  intent_only: true;
  applied: false;
  state_transition_receipt_ref: null;
}

export interface ReviewDecisionCompatibilityUnmappedFieldV01 {
  source_field: string;
  reason: string;
}

export interface ReviewDecisionCompatibilityMetadataV01 {
  source_contracts: string[];
  unmapped_fields: ReviewDecisionCompatibilityUnmappedFieldV01[];
  warnings: string[];
  external_refs: ExternalRefV01[];
}

export interface ReviewDecisionMaterialBoundaryV01 {
  bounded_summaries_only: true;
  max_summary_characters: 2000;
  max_collection_items: 128;
  max_refs_per_collection: 64;
  raw_prompt_persisted: false;
  raw_transcript_persisted: false;
  raw_terminal_output_persisted: false;
  raw_provider_output_persisted: false;
  raw_artifact_content_persisted: false;
  hidden_reasoning_persisted: false;
  credential_or_secret_persisted: false;
  absolute_local_path_persisted: false;
}

export interface ReviewDecisionAuthoritySummaryV01 {
  decision_is_proposal: false;
  decision_is_canonical_project_state: false;
  decision_is_state_transition_receipt: false;
  decision_is_accepted_evidence: false;
  decision_is_proof: false;
  decision_is_work_closure: false;
  contract_validation_verifies_actor_authorization: false;
  construction_proves_real_user_decision: false;
  requested_transition_is_applied: false;
  performs_durable_transition: false;
  creates_evidence: false;
  applies_perspective: false;
  promotes_reviewed_memory: false;
  closes_work: false;
  selects_next_context_automatically: false;
  authorizes_execution: false;
  authorizes_scheduling: false;
  authorizes_retry: false;
  authorizes_replay: false;
  authorizes_deployment: false;
  authorizes_provider_calls: false;
  authorizes_github_mutation: false;
  authorizes_merge: false;
  authorizes_publication: false;
  authorizes_external_actuation: false;
  authorizes_external_side_effects: false;
  writes_database: false;
  notes: string[];
}

export interface ReviewDecisionIntegrityV01 {
  algorithm: "sha256";
  canonicalization: typeof REVIEW_DECISION_CANONICALIZATION_V01;
  fingerprint_scope: "decision_without_integrity_fingerprint";
  fingerprint: string;
}

export interface ReviewDecisionV01 {
  decision_version: typeof REVIEW_DECISION_VERSION_V01;
  decision_id: string;
  workspace_id: string;
  project_id: string;
  source_proposal: ReviewDecisionSourceProposalBindingV01;
  target_class: "episode_delta_candidate";
  candidate: ReviewDecisionCandidateBindingV01;
  decision: ReviewDecisionValueV01;
  actor_ref: ExternalRefV01;
  authorization_basis_refs: ExternalRefV01[];
  decision_basis_material_ids: string[];
  decision_basis_refs: ExternalRefV01[];
  rationale_summary: string;
  decided_at: string;
  revisit: ReviewDecisionRevisitV01 | null;
  requested_transition_intent: ReviewDecisionRequestedTransitionIntentV01 | null;
  lineage: ReviewDecisionLineageV01;
  compatibility: ReviewDecisionCompatibilityMetadataV01;
  material_boundary: ReviewDecisionMaterialBoundaryV01;
  authority_summary: ReviewDecisionAuthoritySummaryV01;
  integrity: ReviewDecisionIntegrityV01;
}

export interface ReviewDecisionValidationIssueV01 {
  severity: "error" | "warning";
  code: string;
  path: string | null;
  message: string;
}

export interface ReviewDecisionValidationResultV01 {
  status: "valid" | "invalid" | "blocked";
  normalized_protocol_version: typeof REVIEW_DECISION_VERSION_V01 | null;
  errors: ReviewDecisionValidationIssueV01[];
  warnings: ReviewDecisionValidationIssueV01[];
}
