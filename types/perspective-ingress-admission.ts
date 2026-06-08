/**
 * Type-only contract for future Perspective ingress admission.
 *
 * Candidates may carry bounded summaries and pointers. They must not carry raw
 * private content, OAuth tokens, credentials, model outputs, prompt payloads, or
 * execution handles.
 */

export type PerspectiveIngressKindV0 =
  | "fixture"
  | "manual_pasted_text"
  | "chatgpt_export"
  | "codex_session_log"
  | "oauth_document"
  | "oauth_calendar"
  | "oauth_email"
  | "browser_capture"
  | "agent_submitted_artifact"
  | "external_pointer";

export type PerspectiveIngressTrustLevelV0 =
  | "fixture_public_safe"
  | "user_provided_local"
  | "oauth_user_authorized"
  | "agent_submitted_untrusted"
  | "external_pointer_only";

export type PerspectiveIngressAdmissionStateV0 =
  | "raw_quarantined"
  | "redacted_candidate"
  | "episode_candidate"
  | "accepted_for_preview"
  | "accepted_for_research_archive"
  | "rejected"
  | "superseded";

export type PerspectiveIngressArtifactClassV0 =
  | "conversation_export"
  | "implementation_log"
  | "document"
  | "calendar_event"
  | "email_thread"
  | "browser_page"
  | "manual_note"
  | "agent_report"
  | "pointer_only";

export type PerspectiveIngressRedactionStateV0 =
  | "not_applicable"
  | "pending"
  | "redacted"
  | "blocked_sensitive"
  | "failed";

export interface PerspectiveIngressAuthorityBoundaryV0 {
  local_only: boolean;
  read_only: boolean;
  external_calls_performed: boolean;
  persistence_performed: boolean;
  graph_db_write_performed: boolean;
  proof_evidence_readiness_write_performed: boolean;
  codex_execution_performed: boolean;
  github_mutation_performed: boolean;
  oauth_token_stored: boolean;
  raw_private_content_stored: boolean;
}

export interface PerspectiveIngressSourceProviderV0 {
  provider_id: string;
  ingress_kind: PerspectiveIngressKindV0;
  display_label: string;
  trust_level: PerspectiveIngressTrustLevelV0;
  artifact_class: PerspectiveIngressArtifactClassV0;
  admission_notes: string[];
}

export interface PerspectiveIngressSourceArtifactCandidateV0 {
  candidate_id: string;
  ingress_kind: PerspectiveIngressKindV0;
  artifact_class: PerspectiveIngressArtifactClassV0;
  source_provider: PerspectiveIngressSourceProviderV0;
  trust_level: PerspectiveIngressTrustLevelV0;
  admission_state: PerspectiveIngressAdmissionStateV0;
  redaction_state: PerspectiveIngressRedactionStateV0;
  created_at: string;
  source_label: string;
  source_ref: string;
  provenance_note: string;
  bounded_summary: string;
  pointer_refs: string[];
  actor_refs: string[];
  requested_by: string;
  consent_ref: string | null;
  retention_hint: string;
  authority_boundary: PerspectiveIngressAuthorityBoundaryV0;
  blocked_reason?: string;
  supersedes_candidate_id?: string;
  eligible_for_episode_candidate: boolean;
  eligible_for_preview: boolean;
  eligible_for_research_archive: boolean;
}

export interface PerspectiveIngressAdmissionDecisionV0 {
  decision_id: string;
  candidate_id: string;
  from_state: PerspectiveIngressAdmissionStateV0;
  to_state: PerspectiveIngressAdmissionStateV0;
  allowed: boolean;
  reason: string;
  authority_boundary: PerspectiveIngressAuthorityBoundaryV0;
}

export interface PerspectiveIngressFormationReadinessV0 {
  candidate_id: string;
  eligible_for_episode_candidate: boolean;
  eligible_for_preview: boolean;
  eligible_for_research_archive: boolean;
  reasons: string[];
}

export interface PerspectiveIngressCandidateProjectionV0 {
  projection_version: "perspective_ingress_candidate_projection.v0.1";
  candidate_id: string;
  ingress_kind: PerspectiveIngressKindV0;
  artifact_class: PerspectiveIngressArtifactClassV0;
  trust_level: PerspectiveIngressTrustLevelV0;
  admission_state: PerspectiveIngressAdmissionStateV0;
  redaction_state: PerspectiveIngressRedactionStateV0;
  source_label: string;
  source_ref: string;
  provenance_note: string;
  bounded_summary: string;
  pointer_refs: string[];
  actor_refs: string[];
  eligible_for_episode_candidate: boolean;
  eligible_for_preview: boolean;
  eligible_for_research_archive: boolean;
  authority_boundary: PerspectiveIngressAuthorityBoundaryV0;
}

export interface PerspectiveIngressAdmissionModelV0 {
  model_version: "perspective_ingress_admission_model.v0.1";
  supported_ingress_kinds: PerspectiveIngressKindV0[];
  supported_trust_levels: PerspectiveIngressTrustLevelV0[];
  supported_admission_states: PerspectiveIngressAdmissionStateV0[];
  supported_artifact_classes: PerspectiveIngressArtifactClassV0[];
  supported_redaction_states: PerspectiveIngressRedactionStateV0[];
}

export interface PerspectiveIngressAdmissionErrorV0 {
  error_version: "perspective_ingress_admission_error.v0.1";
  code: string;
  message: string;
  candidate_id?: string;
  authority_boundary: PerspectiveIngressAuthorityBoundaryV0;
}
