/**
 * Type-only AugnesDelta v0.1 contract.
 *
 * This file defines projection/change vocabulary only. It has no runtime
 * module imports, no DB reads or writes, no route calls, no provider/OpenAI
 * calls, no file reads, and no side effects.
 *
 * AugnesDelta is broader than code, PRs, proof, evidence, or work events.
 * AugnesDelta is a projection/change contract, not source-of-truth state by
 * itself. GitHub PRs are external review artifacts for code deltas, not the
 * universal Augnes change unit.
 */

export const AUGNES_DELTA_CONTRACT_VERSION = "augnes_delta_contract.v0.1" as const;

export const AUGNES_DELTA_TYPES = [
  "perspective_delta",
  "memory_delta",
  "artifact_delta",
  "code_delta",
  "research_delta",
  "office_delta",
  "handoff_delta",
  "world_state_delta",
  "agent_plan_delta",
  "validation_delta",
  "user_decision_delta",
  "coordination_delta",
] as const;

export const AUGNES_DELTA_STATUSES = [
  "draft",
  "auto_applied",
  "needs_review",
  "approved",
  "rejected",
  "superseded",
  "deferred",
  "archived",
] as const;

export const AUGNES_DELTA_SOURCES = [
  "manual_user_input",
  "chatgpt_guide",
  "codex_result",
  "agent_run",
  "work_event",
  "coordination_event",
  "state_delta_proposal",
  "state_transition",
  "perspective_snapshot_diff",
  "research_diagnostic",
  "evidence_record",
  "action_record",
  "handoff_packet",
  "dogfooding_record",
  "external_review",
  "unknown",
] as const;

export const AUGNES_DELTA_MERGE_POLICY_MODES = [
  "manual_review_required",
  "auto_apply_within_contract",
  "auto_apply_working_memory_only",
  "review_required_for_durable_memory",
  "review_required_for_project_perspective",
  "blocked",
] as const;

export type AugnesDeltaType = (typeof AUGNES_DELTA_TYPES)[number];

export type AugnesDeltaStatus = (typeof AUGNES_DELTA_STATUSES)[number];

export type AugnesDeltaSource = (typeof AUGNES_DELTA_SOURCES)[number];

export type DeltaMergePolicyMode =
  (typeof AUGNES_DELTA_MERGE_POLICY_MODES)[number];

export interface AugnesDelta {
  delta_id: string;
  contract_version: typeof AUGNES_DELTA_CONTRACT_VERSION;
  scope: string;
  type: AugnesDeltaType;
  status: AugnesDeltaStatus;
  source: AugnesDeltaSource;
  title: string;
  summary: string;
  created_at: string;
  created_by: string;
  target_refs: string[];
  snapshot_refs: SnapshotRef[];
  diagnostic_refs: ResearchDiagnosticRef[];
  evidence_refs: EvidenceRef[];
  artifact_refs: ArtifactRef[];
  handoff_refs: HandoffRef[];
  merge_policy: DeltaMergePolicy;
  authority_boundary: AugnesDeltaAuthorityBoundary;
  validation_summary?: AugnesDeltaValidationSummary;
  budget_summary?: AugnesDeltaBudgetSummary;
  supersedes_delta_ids?: string[];
  superseded_by_delta_id?: string;
  review_notes?: string[];
  non_goals: string[];
}

export interface DeltaMergePolicy {
  mode: DeltaMergePolicyMode;
  target_scope: string;
  allowed_auto_apply: boolean;
  requires_user_judgment: boolean;
  requires_fresh_snapshot: boolean;
  requires_validation: boolean;
  durable_memory_allowed: boolean;
  project_perspective_allowed: boolean;
  external_side_effect_allowed: boolean;
  blocked_reason: string;
}

export interface DeltaBatch {
  batch_id: string;
  contract_version: typeof AUGNES_DELTA_CONTRACT_VERSION;
  scope: string;
  title: string;
  summary: string;
  created_at: string;
  created_by: string;
  deltas: AugnesDelta[];
  snapshot_refs: SnapshotRef[];
  diagnostic_refs: ResearchDiagnosticRef[];
  authority_boundary: AugnesDeltaAuthorityBoundary;
  validation_summary: AugnesDeltaValidationSummary;
  budget_summary?: AugnesDeltaBudgetSummary;
}

export interface ResearchDiagnosticRef {
  diagnostic_id: string;
  diagnostic_kind: string;
  source_ref: string;
  summary: string;
  status: "log_only" | "candidate_only" | "review_only" | string;
  non_authority_notes: string[];
  informs_delta_ids: string[];
}

export interface SnapshotRef {
  snapshot_id: string;
  snapshot_kind: string;
  created_at: string;
  source_refs: string[];
  staleness_status: "fresh" | "stale" | "partial" | "unknown";
  freshness_notes: string[];
}

export interface EvidenceRef {
  evidence_ref: string;
  evidence_kind: "proof_pointer" | "evidence_pointer" | "validation_pointer" | "review_pointer" | string;
  pointer_semantics: "pointer_only";
  summary: string;
  verified_status: "verified" | "unverified" | "partial" | "stale" | "skipped";
  proof_write_authority: false;
  evidence_write_authority: false;
}

export interface ArtifactRef {
  artifact_ref: string;
  artifact_kind: "doc" | "fixture" | "type_contract" | "smoke" | "office" | "code" | string;
  pointer_semantics: "pointer_only";
  summary: string;
  source_of_truth: false;
}

export interface HandoffRef {
  handoff_ref: string;
  handoff_kind: "perspective_capsule" | "codex_handoff" | "chatgpt_review" | "operator_packet" | string;
  pointer_semantics: "pointer_only";
  summary: string;
  execution_authority: false;
  external_send_authority: false;
}

export interface AugnesDeltaAuthorityBoundary {
  source_of_truth: string;
  can_commit_or_reject_state: boolean;
  can_record_proof: boolean;
  can_create_evidence: boolean;
  can_update_work: boolean;
  can_mutate_memory: boolean;
  can_apply_project_perspective: boolean;
  can_publish_external: boolean;
  can_merge: boolean;
  can_retry_replay_deploy: boolean;
  can_call_github: boolean;
  can_call_openai_or_provider: boolean;
  can_execute_codex: boolean;
  can_create_branch_or_pr: boolean;
  notes: string[];
}

export interface AugnesDeltaValidationSummary {
  validation_status: "not_run" | "passed" | "failed" | "partial" | "skipped";
  required_checks: string[];
  completed_checks: string[];
  failed_checks: string[];
  skipped_checks: Array<{
    check: string;
    reason: string;
  }>;
  notes: string[];
}

export interface AugnesDeltaBudgetSummary {
  budget_scope: string;
  estimated_delta_count: number;
  reviewed_delta_count: number;
  auto_apply_candidate_count: number;
  manual_review_required_count: number;
  blocked_delta_count: number;
  notes: string[];
}
