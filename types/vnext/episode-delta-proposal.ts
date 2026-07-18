import type {
  ExternalRefTrustClassV01,
  ExternalRefV01,
} from "./external-ref";
import type { CriterionAssessmentV01 } from "./criterion-assessment";
import type {
  RunReceiptCapabilityCoverageEntryV01,
  RunReceiptChangedArtifactV01,
  RunReceiptCheckResultV01,
  RunReceiptCommandSummaryV01,
  RunReceiptCompatibilityMetadataV01,
  RunReceiptIssueV01,
  RunReceiptResultSummaryV01,
  RunReceiptSkippedCheckV01,
  RunReceiptStatusAxisV01,
  RunReceiptTrustSummaryV01,
  RunReceiptVerificationAxisV01,
  RunReceiptExecutionStatusV01,
} from "./run-receipt";
import type { TaskContextPacketDataClassificationV01 } from "./task-context-packet";

export const EPISODE_DELTA_PROPOSAL_VERSION_V01 =
  "episode_delta_proposal.v0.1" as const;
export const EPISODE_DELTA_PROPOSAL_CANONICALIZATION_V01 =
  "augnes-json-c14n-v0_1" as const;
export const RUN_ASSESSMENT_PROPOSAL_PROFILE_VERSION_V01 =
  "run_assessment_proposal.v0.1" as const;

export const EPISODE_DELTA_PROPOSAL_STATUSES_V01 = [
  "draft",
  "pending_review",
] as const;

export const EPISODE_DELTA_PROPOSAL_DELTA_TYPES_V01 = [
  "perspective_delta",
  "memory_delta",
  "artifact_delta",
  "code_delta",
  "research_delta",
  "world_state_delta",
  "agent_plan_delta",
  "validation_delta",
  "user_decision_delta",
  "coordination_delta",
] as const;

export const EPISODE_DELTA_PROPOSAL_OPERATIONS_V01 = [
  "add",
  "revise",
  "supersede",
  "retract",
  "remove",
  "no_change",
  "unknown",
] as const;

export const EPISODE_DELTA_PROPOSAL_OBSERVATION_TRUST_CLASSES_V01 = [
  "direct_local_observation",
  "verified_external_observation",
] as const;

export const EPISODE_DELTA_PROPOSAL_ATTESTATION_TRUST_CLASSES_V01 = [
  "host_attestation",
  "provider_report",
  "user_declaration",
  "imported_unverified",
] as const;

export type EpisodeDeltaProposalStatusV01 =
  (typeof EPISODE_DELTA_PROPOSAL_STATUSES_V01)[number];
export type EpisodeDeltaProposalDeltaTypeV01 =
  (typeof EPISODE_DELTA_PROPOSAL_DELTA_TYPES_V01)[number];
export type EpisodeDeltaProposalOperationV01 =
  (typeof EPISODE_DELTA_PROPOSAL_OPERATIONS_V01)[number];
export type EpisodeDeltaProposalObservationTrustClassV01 =
  (typeof EPISODE_DELTA_PROPOSAL_OBSERVATION_TRUST_CLASSES_V01)[number];
export type EpisodeDeltaProposalAttestationTrustClassV01 =
  (typeof EPISODE_DELTA_PROPOSAL_ATTESTATION_TRUST_CLASSES_V01)[number];
export type EpisodeDeltaProposalInferenceTrustClassV01 =
  Extract<ExternalRefTrustClassV01, "derived_interpretation">;
export type EpisodeDeltaProposalKnowledgeStatusV01 =
  | "known"
  | "unknown"
  | "missing";
export type EpisodeDeltaProposalSourceCoverageV01 =
  | "complete"
  | "partial"
  | "unknown";
export type EpisodeDeltaProposalSourceCurrentnessV01 =
  | "fresh"
  | "stale"
  | "partial"
  | "unknown";

export interface EpisodeDeltaProposalSourceStatusV01 {
  coverage: EpisodeDeltaProposalSourceCoverageV01;
  currentness: EpisodeDeltaProposalSourceCurrentnessV01;
  as_of: string | null;
  review_required: boolean;
  basis: string;
  source_refs: ExternalRefV01[];
}

export interface EpisodeDeltaProposalObservationV01 {
  material_id: string;
  material_kind: string;
  bounded_summary: string;
  event_at: string | null;
  observed_at: string;
  observer_ref: ExternalRefV01;
  trust_class: EpisodeDeltaProposalObservationTrustClassV01;
  source_run_receipt_refs: ExternalRefV01[];
  source_refs: ExternalRefV01[];
  subject_refs: ExternalRefV01[];
}

export interface EpisodeDeltaProposalAttestationV01 {
  material_id: string;
  material_kind: string;
  bounded_summary: string;
  reported_at: string;
  reporter_ref: ExternalRefV01;
  trust_class: EpisodeDeltaProposalAttestationTrustClassV01;
  source_run_receipt_refs: ExternalRefV01[];
  source_refs: ExternalRefV01[];
  subject_refs: ExternalRefV01[];
}

export interface EpisodeDeltaProposalInferenceV01 {
  material_id: string;
  material_kind: string;
  bounded_summary: string;
  inferred_at: string;
  interpreter_ref: ExternalRefV01;
  trust_class: EpisodeDeltaProposalInferenceTrustClassV01;
  basis_material_ids: string[];
  source_run_receipt_refs: ExternalRefV01[];
  source_refs: ExternalRefV01[];
  subject_refs: ExternalRefV01[];
}

export interface EpisodeDeltaProposalCurrentStateV01 {
  knowledge_status: EpisodeDeltaProposalKnowledgeStatusV01;
  bounded_summary: string | null;
  source_material_ids: string[];
  source_refs: ExternalRefV01[];
}

export interface EpisodeDeltaProposalDeltaCandidateV01 {
  candidate_id: string;
  delta_type: EpisodeDeltaProposalDeltaTypeV01;
  operation: EpisodeDeltaProposalOperationV01;
  title: string;
  current_state: EpisodeDeltaProposalCurrentStateV01;
  proposed_state_summary: string;
  target_refs: ExternalRefV01[];
  basis_material_ids: string[];
  source_refs: ExternalRefV01[];
  uncertainties: string[];
  limitations: string[];
  review_required: true;
}

export interface EpisodeDeltaProposalConflictV01 {
  conflict_id: string;
  conflict_kind: string;
  bounded_summary: string;
  material_ids: string[];
  source_refs: ExternalRefV01[];
  resolution_status: "unresolved";
  automatically_resolved: false;
}

export interface EpisodeDeltaProposalMissingInformationV01 {
  missing_id: string;
  knowledge_status: Extract<
    EpisodeDeltaProposalKnowledgeStatusV01,
    "unknown" | "missing"
  >;
  code: string;
  bounded_summary: string;
  related_material_ids: string[];
  related_delta_ids: string[];
  source_refs: ExternalRefV01[];
  review_required: true;
}

export interface EpisodeDeltaProposalUncertaintyV01 {
  uncertainty_id: string;
  bounded_summary: string;
  related_material_ids: string[];
  related_delta_ids: string[];
  source_refs: ExternalRefV01[];
}

export interface EpisodeDeltaProposalCompatibilityUnmappedFieldV01 {
  source_field: string;
  reason: string;
}

export interface EpisodeDeltaProposalCompatibilityMetadataV01 {
  source_contracts: string[];
  unmapped_fields: EpisodeDeltaProposalCompatibilityUnmappedFieldV01[];
  warnings: string[];
  external_refs: ExternalRefV01[];
}

export interface EpisodeDeltaProposalTrustSummaryV01 {
  direct_observations: number;
  verified_external_observations: number;
  host_attestations: number;
  provider_reports: number;
  user_declarations: number;
  imported_unverified_items: number;
  derived_interpretations: number;
}

export interface EpisodeDeltaProposalMaterialBoundaryV01 {
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
}

export interface EpisodeDeltaProposalAuthoritySummaryV01 {
  proposal_is_command: false;
  proposal_is_canonical_project_state: false;
  proposal_is_review_decision: false;
  proposal_is_state_transition_receipt: false;
  proposal_is_accepted_evidence: false;
  proposal_is_proof: false;
  proposal_is_approval: false;
  status_commits_state: false;
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
  confidence_or_agreement_grants_authority: false;
  source_validation_grants_authority: false;
  fingerprint_verification_grants_authority: false;
  changed_files_grant_authority: false;
  passed_checks_grant_authority: false;
  pull_request_presence_grants_authority: false;
  notes: string[];
}

export interface EpisodeDeltaProposalExpectedMaterialV01 {
  task_goal: string;
  success_criteria: Array<{
    criterion_id: string;
    criterion: string;
  }>;
  required_checks: string[];
  expected_artifacts: string[];
  required_return_fields: string[];
  forbidden_actions: string[];
  data_classification: TaskContextPacketDataClassificationV01;
}

export interface EpisodeDeltaProposalObservedMaterialV01 {
  execution: RunReceiptStatusAxisV01<RunReceiptExecutionStatusV01>;
  verification: RunReceiptVerificationAxisV01;
  commands: RunReceiptCommandSummaryV01[];
  checks: RunReceiptCheckResultV01[];
  skipped_checks: RunReceiptSkippedCheckV01[];
  changed_artifacts: RunReceiptChangedArtifactV01[];
  artifact_refs: ExternalRefV01[];
  blockers: RunReceiptIssueV01[];
  warnings: RunReceiptIssueV01[];
  gaps: RunReceiptIssueV01[];
  result_summary: RunReceiptResultSummaryV01;
  capability_coverage: RunReceiptCapabilityCoverageEntryV01[];
  trust_summary: RunReceiptTrustSummaryV01;
  compatibility: RunReceiptCompatibilityMetadataV01;
}

/**
 * Optional additive v0.1 material for proposals produced from one exact R5
 * result and its derived R6-A assessment. Historical proposals omit this
 * field and remain readable. The snapshot is part of proposal identity and
 * fingerprinting; it is not a separate assessment record or authority.
 */
export interface EpisodeDeltaProposalSourceAssessmentV01 {
  admission_profile: typeof RUN_ASSESSMENT_PROPOSAL_PROFILE_VERSION_V01;
  admission_idempotency_key: string;
  work_ref: ExternalRefV01 | null;
  run_ref: ExternalRefV01;
  packet_ref: ExternalRefV01;
  receipt_ref: ExternalRefV01;
  assessment: CriterionAssessmentV01;
  expected: EpisodeDeltaProposalExpectedMaterialV01;
  observed: EpisodeDeltaProposalObservedMaterialV01;
  comparison: {
    relation_policy: "explicit_protocol_relations_only";
    criterion_specific_relations_available: false;
    task_success_status: "unknown";
    execution_status_is_task_success: false;
    gaps: string[];
  };
  authority: {
    authoritative: false;
    creates_evidence: false;
    validates_claims: false;
    creates_decision: false;
    applies_transition: false;
    changes_semantic_state: false;
    changes_later_context: false;
  };
}

export interface EpisodeDeltaProposalIntegrityV01 {
  algorithm: "sha256";
  canonicalization: typeof EPISODE_DELTA_PROPOSAL_CANONICALIZATION_V01;
  fingerprint_scope: "proposal_without_integrity_fingerprint";
  fingerprint: string;
}

export interface EpisodeDeltaProposalV01 {
  proposal_version: typeof EPISODE_DELTA_PROPOSAL_VERSION_V01;
  proposal_id: string;
  workspace_id: string;
  project_id: string;
  created_at: string;
  status: EpisodeDeltaProposalStatusV01;
  bounded_summary: string;
  task_context_packet_ref: ExternalRefV01 | null;
  run_receipt_refs: ExternalRefV01[];
  source_assessment?: EpisodeDeltaProposalSourceAssessmentV01;
  observations: EpisodeDeltaProposalObservationV01[];
  attestations: EpisodeDeltaProposalAttestationV01[];
  inferences: EpisodeDeltaProposalInferenceV01[];
  proposed_deltas: EpisodeDeltaProposalDeltaCandidateV01[];
  conflicts: EpisodeDeltaProposalConflictV01[];
  missing_information: EpisodeDeltaProposalMissingInformationV01[];
  uncertainties: EpisodeDeltaProposalUncertaintyV01[];
  limitations: string[];
  source_status: EpisodeDeltaProposalSourceStatusV01;
  source_refs: ExternalRefV01[];
  compatibility: EpisodeDeltaProposalCompatibilityMetadataV01;
  trust_summary: EpisodeDeltaProposalTrustSummaryV01;
  material_boundary: EpisodeDeltaProposalMaterialBoundaryV01;
  authority_summary: EpisodeDeltaProposalAuthoritySummaryV01;
  integrity: EpisodeDeltaProposalIntegrityV01;
}

export interface EpisodeDeltaProposalValidationIssueV01 {
  severity: "error" | "warning";
  code: string;
  path: string | null;
  message: string;
}

export interface EpisodeDeltaProposalValidationResultV01 {
  status: "valid" | "invalid" | "blocked";
  normalized_protocol_version:
    | typeof EPISODE_DELTA_PROPOSAL_VERSION_V01
    | null;
  errors: EpisodeDeltaProposalValidationIssueV01[];
  warnings: EpisodeDeltaProposalValidationIssueV01[];
}
