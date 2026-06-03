/**
 * type-only Codex execution record boundary for future Augnes execution-intent
 * and approval vocabulary.
 *
 * These types are not runtime schema, not DB schema, not API contract,
 * not MCP/App tool contract, not proof/evidence write authority, and
 * not source-of-truth. They carry no live SDK call, no provider implementation,
 * and no runtime execution.
 */

export type CodexPermissionProfile =
  | "read_only"
  | "workspace_write"
  | "network_limited"
  | "full_access"
  | "danger_full_access";

export type CodexExecutionStatus =
  | "planned"
  | "approval_required"
  | "approved"
  | "denied"
  | "running"
  | "succeeded"
  | "failed"
  | "interrupted"
  | "skipped"
  | "superseded";

export interface CodexExecutionIntent {
  intent_id: string;
  work_id: string;
  repo: string;
  base_branch: string;
  working_branch: string;
  task_goal: string;
  requested_capability: string;
  permission_profile: CodexPermissionProfile;
  risk_note: string;
  rollback_or_reversibility_note: string;
  ag_resume_ref?: string;
  project_constellation_ref?: string;
  perspective_capsule_ref?: string;
  next_action_candidates: string[];
}

export interface CodexExecutionRequest {
  intent_id: string;
  work_id: string;
  repo: string;
  base_branch: string;
  working_branch: string;
  task_goal: string;
  thread_id?: string;
  run_id?: string;
  permission_profile: CodexPermissionProfile;
  requested_capability: string;
  risk_note: string;
  rollback_or_reversibility_note: string;
  user_approval?: CodexUserApprovalRecord;
  checks: CodexExecutionCheckResult[];
  evidence_links: CodexEvidenceLink[];
  ag_resume_ref?: string;
  project_constellation_ref?: string;
  perspective_capsule_ref?: string;
  next_action_candidates: string[];
  skipped_reason?: string;
  host_provenance: CodexExecutionHostProvenance;
}

export interface CodexUserApprovalRecord {
  approval_id: string;
  approved_by: string;
  approved_at: string;
  permission_profile: CodexPermissionProfile;
  scope: string;
  risk_note: string;
  user_responsibility_acknowledged: boolean;
}

export interface CodexExecutionResult {
  intent_id: string;
  work_id: string;
  thread_id?: string;
  run_id?: string;
  status: CodexExecutionStatus;
  permission_profile: CodexPermissionProfile;
  result_summary: string;
  changed_files: string[];
  checks: CodexExecutionCheckResult[];
  evidence_links: CodexEvidenceLink[];
  ag_resume_ref?: string;
  project_constellation_ref?: string;
  perspective_capsule_ref?: string;
  interruption_reason?: string;
  next_resume_candidate?: CodexExecutionResumePointer;
  next_action_candidates: string[];
  skipped_reason?: string;
  host_provenance: CodexExecutionHostProvenance;
}

export interface CodexExecutionCheckResult {
  check_id: string;
  label: string;
  command?: string;
  status: "passed" | "failed" | "skipped" | "not_run";
  result_summary: string;
  skipped_reason?: string;
}

export interface CodexEvidenceLink {
  evidence_ref: string;
  evidence_kind: "proof_pointer" | "evidence_pointer" | "readiness_pointer" | "review_pointer";
  pointer_semantics: "pointer_only";
  proof_evidence_write_authority: false;
  readiness_write_authority: false;
  boundary_note: "pointer only; not proof/evidence/readiness write authority";
}

export interface CodexExecutionHostProvenance {
  host_surface: string;
  thread_id?: string;
  run_id?: string;
  started_at?: string;
  ended_at?: string;
  operator_ref?: string;
}

export interface CodexExecutionRiskRecord {
  risk_id: string;
  intent_id: string;
  requested_capability: string;
  permission_profile: CodexPermissionProfile;
  risk_note: string;
  rollback_or_reversibility_note: string;
  mitigation_notes: string[];
  skipped_reason?: string;
}

export interface CodexExecutionResumePointer {
  ag_resume_ref?: string;
  thread_id?: string;
  run_id?: string;
  interruption_reason?: string;
  next_resume_candidate: string;
  permission_profile: CodexPermissionProfile;
  project_constellation_ref?: string;
  perspective_capsule_ref?: string;
  evidence_links: CodexEvidenceLink[];
}

export interface CodexExecutionProviderBoundary {
  boundary_id: string;
  boundary_status: "type_boundary_only";
  provider_kind:
    | "none"
    | "mock_design_placeholder"
    | "real_sdk_future_placeholder";
  request_record_shape: CodexExecutionRequest;
  result_record_shape: CodexExecutionResult;
  user_approval: CodexUserApprovalRecord;
  live_sdk_call: false;
  sdk_import_allowed: false;
  provider_implementation: false;
  runtime_execution: false;
  credentials_or_env_required: false;
  mcp_app_tool_contract: false;
  api_contract: false;
  db_schema: false;
  source_of_truth: false;
  /**
   * This boundary does not implement MockCodexExecutionProvider or
   * RealCodexSdkExecutionProvider.
   */
  provider_boundary_note: string;
}
