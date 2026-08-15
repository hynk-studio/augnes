import type { ExternalRefV01 } from "./external-ref";
import type {
  OperationalFrictionOperationDomainV01,
  OperationalFrictionTargetClassV01,
} from "./operational-friction-proposal";
import type { EpisodeDeltaProposalDeltaTypeV01 } from "./episode-delta-proposal";
import type { TaskContextPacketV01 } from "./task-context-packet";

export const OPERATIONAL_CONTEXT_SELECTION_VERSION_V01 =
  "operational_context_selection.v0.1" as const;
export const OPERATIONAL_CONTEXT_SELECTION_RULE_VERSION_V01 =
  "eligible_effective_proposal_only_accepts_canonical_order.v0.1" as const;
export const SOURCE_LINKED_OPERATIONAL_CONTINUATION_VERSION_V01 =
  "source_linked_operational_continuation.v0.1" as const;
export const OPERATIONAL_CONTINUATION_ADMISSION_IDENTITY_VERSION_V01 =
  "operational_continuation_admission_identity.v0.1" as const;
export const OPERATIONAL_CONTEXT_SELECTION_MAX_CANDIDATES_V01 = 32 as const;
export const OPERATIONAL_CONTEXT_SELECTION_MAX_SUMMARY_CHARACTERS_V01 =
  2000 as const;

export type OperationalContextSelectionExclusionReasonV01 =
  | "effective_review_rejected"
  | "effective_review_deferred_revisit_capable"
  | "effective_review_unresolved"
  | "budget_reached";

export type OperationalContextSelectionDispositionV01 =
  | "selected_effective_accept"
  | "excluded_effective_reject"
  | "excluded_effective_defer"
  | "excluded_unresolved"
  | "excluded_budget_reached";

export interface OperationalContextSelectionRecordBindingV01 {
  record_version: string;
  record_id: string;
  record_fingerprint: string;
}

export interface OperationalContextSelectionAcgc4AdmissionBindingV01 {
  workspace_id: string;
  project_id: string;
  materialization_version: "operational_friction_proposal_materialization.v0.1";
  materialization_id: string;
  source_bundle_id: string;
  source_bundle_fingerprint: string;
  profile_id: string;
  profile_fingerprint: string;
  proposal_id: string;
  proposal_fingerprint: string;
  idempotency_key: string;
}

export interface OperationalContextSelectionDecisionBindingV01 {
  decision_version: "review_decision.v0.1";
  decision_id: string;
  decision_fingerprint: string;
  disposition: "accept" | "reject" | "defer";
  decided_at: string;
  revisit: {
    revisit_at: string | null;
    expires_at: string | null;
    condition_summary: string | null;
  } | null;
  review_mode: "proposal_only_no_activation";
  requested_transition_intent_present: false;
}

export interface OperationalContextSelectionCurrentnessV01 {
  status: "fresh" | "stale" | "partial" | "unknown";
  as_of: string;
  basis: string;
  source_refs: ExternalRefV01[];
}

export interface OperationalContextSelectionCandidateSnapshotRowV01 {
  candidate_id: string;
  candidate_fingerprint: string;
  delta_family: Extract<
    EpisodeDeltaProposalDeltaTypeV01,
    "research_delta" | "validation_delta" | "agent_plan_delta"
  >;
  operation: "unknown";
  operation_domain: OperationalFrictionOperationDomainV01;
  target_class: OperationalFrictionTargetClassV01;
}

export interface OperationalContextSelectionCandidateSnapshotV01 {
  snapshot_version: "operational_context_candidate_snapshot.v0.1";
  candidate_count: number;
  canonical_order: "candidate_id_then_fingerprint_code_unit_order";
  rows: OperationalContextSelectionCandidateSnapshotRowV01[];
  fingerprint: string;
}

export interface OperationalContextSelectionRowV01
  extends OperationalContextSelectionCandidateSnapshotRowV01 {
  basis_observation_ids: string[];
  source_refs: ExternalRefV01[];
  review_decision: OperationalContextSelectionDecisionBindingV01 | null;
  disposition: OperationalContextSelectionDispositionV01;
  exclusion_reason: OperationalContextSelectionExclusionReasonV01 | null;
  currentness: OperationalContextSelectionCurrentnessV01;
  uncertainties: string[];
  limitations: string[];
  proposal_only: true;
  activation_owner: null;
  semantic_transition_eligible: false;
  causal_contribution: false;
  item_level_credit_or_blame: false;
  exact_intervention_evidence_present: false;
  exact_item_evidence_present: false;
}

export interface OperationalContextSelectionMaterialBoundaryV01 {
  bounded_summaries_only: true;
  max_summary_characters: typeof OPERATIONAL_CONTEXT_SELECTION_MAX_SUMMARY_CHARACTERS_V01;
  max_candidates: typeof OPERATIONAL_CONTEXT_SELECTION_MAX_CANDIDATES_V01;
  raw_prompt_included: false;
  raw_transcript_included: false;
  raw_terminal_output_included: false;
  raw_provider_output_included: false;
  raw_artifact_content_included: false;
  hidden_reasoning_included: false;
  credential_or_secret_included: false;
  token_cookie_or_nonce_included: false;
  absolute_local_path_included: false;
}

export interface OperationalContextSelectionAuthoritySummaryV01 {
  is_operational_policy: false;
  is_evidence: false;
  is_accepted_state: false;
  is_reviewed_memory: false;
  is_canonical_perspective: false;
  is_command: false;
  is_approval: false;
  performs_semantic_transition: false;
  activates_policy: false;
  mutates_current_packet: false;
  persists_candidate_packet: false;
  grants_execution_authority: false;
  grants_external_effect_authority: false;
  grants_scheduling_authority: false;
  inherits_run_grant: false;
  creates_attachment: false;
  creates_start_decision: false;
  creates_resume_decision: false;
  calls_provider: false;
  calls_network: false;
  calls_github: false;
  writes_database: false;
  writes_project_files: false;
}

export interface OperationalContextSelectionIntegrityV01 {
  algorithm: "sha256";
  canonicalization: "augnes-json-c14n-v0_1";
  fingerprint_scope: "selection_without_integrity_fingerprint";
  fingerprint: string;
}

export interface OperationalContextSelectionV01 {
  selection_version: typeof OPERATIONAL_CONTEXT_SELECTION_VERSION_V01;
  selection_id: string;
  selection_kind: "pure_rebuildable_non_authoritative_operational_context";
  workspace_id: string;
  project_id: string;
  work_ref: TaskContextPacketV01["work_ref"];
  packet_a: OperationalContextSelectionRecordBindingV01;
  run_receipt_a: OperationalContextSelectionRecordBindingV01;
  context_use_review_a: OperationalContextSelectionRecordBindingV01;
  acgc1_attribution: OperationalContextSelectionRecordBindingV01;
  acgc2_shadow_projection: OperationalContextSelectionRecordBindingV01;
  acgc2_paired_evaluation: OperationalContextSelectionRecordBindingV01;
  acgc3_dynamics_digest: OperationalContextSelectionRecordBindingV01;
  acgc3_ordered_frames: OperationalContextSelectionRecordBindingV01[];
  acgc4_materialization: {
    materialization_version: string;
    materialization_id: string;
  };
  acgc4_source_bundle: OperationalContextSelectionRecordBindingV01;
  acgc4_profile: OperationalContextSelectionRecordBindingV01;
  acgc4_proposal: OperationalContextSelectionRecordBindingV01;
  acgc4_canonical_admission: OperationalContextSelectionAcgc4AdmissionBindingV01;
  effective_decisions: OperationalContextSelectionDecisionBindingV01[];
  decision_time_cutoff: string;
  selection_rule_version: typeof OPERATIONAL_CONTEXT_SELECTION_RULE_VERSION_V01;
  max_selected_candidates: number;
  candidate_snapshot: OperationalContextSelectionCandidateSnapshotV01;
  selected_rows: OperationalContextSelectionRowV01[];
  excluded_rows: OperationalContextSelectionRowV01[];
  source_currentness: OperationalContextSelectionCurrentnessV01;
  uncertainties: string[];
  limitations: string[];
  stop_reason:
    | "eligible_candidates_exhausted"
    | "no_eligible_candidates"
    | "budget_reached";
  material_boundary: OperationalContextSelectionMaterialBoundaryV01;
  authority_summary: OperationalContextSelectionAuthoritySummaryV01;
  integrity: OperationalContextSelectionIntegrityV01;
}

export interface OperationalContinuationAdmissionIdentityV01 {
  identity_version: typeof OPERATIONAL_CONTINUATION_ADMISSION_IDENTITY_VERSION_V01;
  materialization_id: string;
  materialization_fingerprint: string;
  workspace_id: string;
  project_id: string;
  work_ref_fingerprint: string;
  packet_a_id: string;
  packet_a_fingerprint: string;
  run_receipt_a_id: string;
  run_receipt_a_fingerprint: string;
  context_use_review_a_id: string;
  context_use_review_a_fingerprint: string;
  acgc4_source_bundle_id: string;
  acgc4_source_bundle_fingerprint: string;
  acgc4_profile_id: string;
  acgc4_profile_fingerprint: string;
  acgc4_proposal_id: string;
  acgc4_proposal_fingerprint: string;
  acgc4_admission_idempotency_key: string;
  effective_decisions_fingerprint: string;
  decision_time_cutoff: string;
  selection_rule_version: typeof OPERATIONAL_CONTEXT_SELECTION_RULE_VERSION_V01;
  max_selected_candidates: number;
  selection_id: string;
  selection_fingerprint: string;
  candidate_packet_b_id: string;
  candidate_packet_b_fingerprint: string;
  future_admission_idempotency_key: string;
}

export interface SourceLinkedOperationalContinuationV01 {
  materialization_version: typeof SOURCE_LINKED_OPERATIONAL_CONTINUATION_VERSION_V01;
  materialization_identity: OperationalContinuationAdmissionIdentityV01;
  selection: OperationalContextSelectionV01;
  candidate_task_context_packet_b: TaskContextPacketV01;
  persisted: false;
  current_packet: false;
  execution_eligible: false;
  attachment_prepared: false;
  grant_issued: false;
  run_created: false;
  semantic_transition_created: false;
  persistence: {
    reads: 0;
    writes: 0;
    database_calls: 0;
  };
  external_effects: {
    provider_calls: 0;
    model_calls: 0;
    network_calls: 0;
    github_calls: 0;
    browser_calls: 0;
    companion_calls: 0;
    filesystem_calls: 0;
  };
  authority_summary: OperationalContextSelectionAuthoritySummaryV01;
}
