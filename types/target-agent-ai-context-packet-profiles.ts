// Type-only contract for Target-Agent AI Context Packet Profiles v0.1.
// This contract is profile-preview-only: not prompt execution, not provider
// execution, not Codex execution, not GitHub automation, not proof/evidence,
// not Perspective promotion, not durable state, not work mutation, and not
// product write.

export type TargetAgentAiContextPacketProfilesVersion =
  "target_agent_ai_context_packet_profiles.v0.1";

export type TargetAgentAiContextPacketProfilesReportVersion =
  "target_agent_ai_context_packet_profiles_report.v0.1";

export type TargetAgentAiContextPacketProfilesScope = "project:augnes";

export type TargetAgentAiContextPacketProfilesStatus = "profile_preview_only";

export type TargetAgentKind =
  | "human_review"
  | "chatgpt_review"
  | "codex_handoff"
  | "dogfooding_review"
  | "unknown";

export type TargetAgentProfileMode =
  | "review"
  | "handoff"
  | "diagnostic"
  | "dogfood"
  | "unknown";

export type TargetAgentPacketSectionKind =
  | "scope_summary"
  | "source_refs"
  | "candidate_lifecycle"
  | "calibration_diagnostic"
  | "logical_claim_shape"
  | "feedback_to_rule"
  | "temporal_handoff_diagnostic"
  | "unresolved_tensions"
  | "knowledge_gaps"
  | "review_cues"
  | "expected_observed_delta"
  | "authority_boundary"
  | "deferred_work"
  | "omitted_context";

export type TargetAgentContextCompressionLevel =
  | "full"
  | "balanced"
  | "compact"
  | "minimal";

export type TargetAgentPacketProfileReasonCode =
  | "target_agent_supported"
  | "target_agent_unknown"
  | "source_refs_present"
  | "source_refs_missing"
  | "lifecycle_context_included"
  | "calibration_context_included"
  | "logical_shape_context_included"
  | "feedback_to_rule_context_included"
  | "temporal_handoff_context_included"
  | "unresolved_tension_present"
  | "knowledge_gap_present"
  | "authority_boundary_included"
  | "execution_authority_denied"
  | "codex_handoff_draft_not_execution"
  | "provider_call_denied"
  | "github_automation_denied"
  | "product_write_denied"
  | "profile_preview_not_prompt_execution";

export interface TargetAgentPacketProfileAuthorityBoundary {
  profile_preview_only: true;
  prompt_execution_now: false;
  provider_openai_call_now: false;
  codex_execution_authority: false;
  github_automation_authority: false;
  branch_pr_creation_authority: false;
  source_of_truth: false;
  proof_or_evidence_record: false;
  perspective_promotion: false;
  durable_perspective_state: false;
  work_mutation: false;
  source_fetch_authority: false;
  retrieval_rag_authority: false;
  git_ledger_export_authority: false;
  product_write_authority: false;
  product_id_allocation_authority: false;
}

export interface TargetAgentPacketProfileSection {
  section_id: string;
  section_kind: TargetAgentPacketSectionKind;
  included: boolean;
  priority: "low" | "medium" | "high";
  compression_level: TargetAgentContextCompressionLevel;
  source_refs: string[];
  candidate_refs: string[];
  summary: string;
  omission_reason?: string;
}

export interface TargetAgentAiContextPacketProfile {
  profile_version: TargetAgentAiContextPacketProfilesVersion;
  scope: TargetAgentAiContextPacketProfilesScope;
  status: TargetAgentAiContextPacketProfilesStatus;
  as_of: string;
  target_agent: TargetAgentKind;
  profile_mode: TargetAgentProfileMode;
  target_ref: string;
  source_fixture_refs: string[];
  included_sections: TargetAgentPacketProfileSection[];
  omitted_sections: TargetAgentPacketProfileSection[];
  source_refs: string[];
  candidate_refs: string[];
  unresolved_tension_refs: string[];
  knowledge_gap_refs: string[];
  review_cue_refs: string[];
  reason_codes: TargetAgentPacketProfileReasonCode[];
  boundary_notes: string[];
  authority_boundary: TargetAgentPacketProfileAuthorityBoundary;
}

export interface TargetAgentAiContextPacketProfilesReport {
  report_version: TargetAgentAiContextPacketProfilesReportVersion;
  scope: TargetAgentAiContextPacketProfilesScope;
  status: TargetAgentAiContextPacketProfilesStatus;
  as_of: string;
  source_fixture_refs: string[];
  profiles: TargetAgentAiContextPacketProfile[];
  target_counts: Record<TargetAgentKind, number>;
  section_counts: Record<TargetAgentPacketSectionKind, number>;
  compression_counts: Record<TargetAgentContextCompressionLevel, number>;
  boundary_notes: string[];
  report_fingerprint: string;
  authority_boundary: TargetAgentPacketProfileAuthorityBoundary;
}

export interface TargetAgentAiContextPacketProfilesValidationResult {
  passed: boolean;
  failure_codes: string[];
}

export interface TargetAgentProfileInput {
  target_agent: TargetAgentKind | string;
  target_ref: string;
  profile_mode?: TargetAgentProfileMode | string;
  compression_level?: TargetAgentContextCompressionLevel | string;
  requested_sections?: string[];
  omitted_sections?: string[];
}

export interface TargetAgentProfileArtifactInput {
  lifecycle_summaries?: unknown[];
  calibration_diagnostics?: unknown[];
  logical_claim_shapes?: unknown[];
  feedback_to_rule_candidates?: unknown[];
  temporal_handoff_sections?: unknown[];
  source_refs?: string[];
  candidate_refs?: string[];
  unresolved_tension_refs?: string[];
  knowledge_gap_refs?: string[];
  review_cue_refs?: string[];
}

export interface TargetAgentAiContextPacketProfilesBuilderInput {
  scope: TargetAgentAiContextPacketProfilesScope;
  as_of: string;
  source_fixture_refs: string[];
  targets: TargetAgentProfileInput[];
  artifacts: TargetAgentProfileArtifactInput;
}
