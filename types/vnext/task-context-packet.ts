import type {
  ExternalRefTrustClassV01,
  ExternalRefV01,
} from "./external-ref";

export const TASK_CONTEXT_PACKET_VERSION_V01 =
  "task_context_packet.v0.1" as const;

export const TASK_CONTEXT_PACKET_CANONICALIZATION_V01 =
  "augnes-json-c14n-v0_1" as const;

export const TASK_CONTEXT_PACKET_DATA_CLASSIFICATIONS_V01 = [
  "public_safe",
  "private",
  "local_only",
  "secret",
] as const;

export const TASK_CONTEXT_PACKET_CURRENTNESS_STATUSES_V01 = [
  "fresh",
  "stale",
  "partial",
  "unknown",
] as const;

export const TASK_CONTEXT_PACKET_VALIDATION_STATUSES_V01 = [
  "valid",
  "invalid",
  "blocked",
] as const;

export type TaskContextPacketDataClassificationV01 =
  (typeof TASK_CONTEXT_PACKET_DATA_CLASSIFICATIONS_V01)[number];

export type TaskContextPacketCurrentnessStatusV01 =
  (typeof TASK_CONTEXT_PACKET_CURRENTNESS_STATUSES_V01)[number];

export type TaskContextPacketValidationStatusV01 =
  (typeof TASK_CONTEXT_PACKET_VALIDATION_STATUSES_V01)[number];

export type TaskContextPacketAuthorityCoverageV01 =
  | "enforced"
  | "observed"
  | "advisory"
  | "outside_coverage";

export type TaskContextPacketSelectedEntryKindV01 =
  | "accepted_state_ref"
  | "memory_ref"
  | "evidence_ref"
  | "claim_ref"
  | "artifact_ref"
  | "proof_ref"
  | "action_ref"
  | "legacy_state_key_ref"
  | "source_ref"
  | "work_ref"
  | "other_ref";

export type TaskContextPacketProjectionItemKindV01 =
  | "frame"
  | "thesis"
  | "active_goal"
  | "risk"
  | "open_question"
  | "gap"
  | "source_ref"
  | "other";

export type TaskContextPacketIssueSeverityV01 =
  | "low"
  | "medium"
  | "high"
  | "blocking"
  | "unknown";

export interface TaskContextPacketCurrentnessV01 {
  status: TaskContextPacketCurrentnessStatusV01;
  as_of: string | null;
  basis: string;
  source_ref: ExternalRefV01 | null;
}

export interface TaskContextPacketSelectedEntryV01 {
  entry_id: string;
  entry_kind: TaskContextPacketSelectedEntryKindV01;
  source_ref: string | null;
  external_ref: ExternalRefV01 | null;
  why_included: string;
  currentness: TaskContextPacketCurrentnessV01;
  trust_class: ExternalRefTrustClassV01;
  compatibility_source_ref: ExternalRefV01 | null;
  bounded_summary: string | null;
}

export interface TaskContextPacketExcludedEntryV01 {
  entry_id: string;
  source_ref: string | null;
  external_ref: ExternalRefV01 | null;
  why_excluded: string;
  currentness: TaskContextPacketCurrentnessV01;
}

export interface TaskContextPacketProjectionItemV01 {
  item_kind: TaskContextPacketProjectionItemKindV01;
  summary: string;
  source_refs: string[];
  external_refs: ExternalRefV01[];
  currentness: TaskContextPacketCurrentnessV01;
}

export interface TaskContextPacketCurrentProjectionV01 {
  projection_kind: "current_working_perspective";
  projection_only: true;
  canonical_state: false;
  perspective_ref: string | null;
  bounded_summary: string;
  as_of: string | null;
  items: TaskContextPacketProjectionItemV01[];
  source_refs: string[];
  external_refs: ExternalRefV01[];
  currentness: TaskContextPacketCurrentnessV01;
  warnings: string[];
}

export interface TaskContextPacketIssueV01 {
  issue_kind: "tension" | "risk";
  summary: string;
  severity: TaskContextPacketIssueSeverityV01;
  source_refs: string[];
  external_refs: ExternalRefV01[];
  currentness: TaskContextPacketCurrentnessV01;
}

export interface TaskContextPacketGapV01 {
  code: string;
  summary: string;
  severity: TaskContextPacketIssueSeverityV01;
  missing_fields: string[];
  source_refs: string[];
  external_refs: ExternalRefV01[];
}

export interface TaskContextPacketContextBudgetV01 {
  bounded: true;
  max_selected_entries: number | null;
  max_projection_items: number | null;
  max_characters: number | null;
  max_estimated_tokens: number | null;
  estimated_tokens: number | null;
  truncation_applied: boolean;
}

export interface TaskContextPacketBoundedCapabilitySummaryV01 {
  grant_ref: string | null;
  grant_external_ref: ExternalRefV01 | null;
  allowed_capabilities: string[];
  forbidden_capabilities: string[];
  resource_scope: string[];
  stop_conditions: string[];
  coverage: TaskContextPacketAuthorityCoverageV01;
  expires_at: string | null;
}

export interface TaskContextPacketReturnContractV01 {
  return_kind: "bounded_result" | "compatibility_result_report";
  required_fields: string[];
  expected_artifacts: string[];
  required_checks: string[];
  return_ref: ExternalRefV01 | null;
  compatibility_only: boolean;
}

export interface TaskContextPacketAuthoritySummaryV01 {
  is_command: false;
  is_canonical_project_state: false;
  is_approval: false;
  performs_durable_transition: false;
  grants_execution_authority: false;
  grants_external_side_effect_authority: false;
  grants_semantic_commit_authority: false;
  can_write_database: false;
  can_call_provider: false;
  can_use_network: false;
  can_mutate_external_state: false;
  current_projection_is_source_of_truth: false;
  provider_refs_are_canonical: false;
  notes: string[];
}

export interface TaskContextPacketSourceStatusV01 {
  status: "complete" | "partial" | "unknown";
  currentness: TaskContextPacketCurrentnessV01;
  source_refs: string[];
  external_refs: ExternalRefV01[];
  warnings: string[];
}

export interface TaskContextPacketCompatibilityUnmappedFieldV01 {
  source_field: string;
  reason: string;
  source_ref: ExternalRefV01 | null;
  redacted: true;
}

export interface TaskContextPacketCompatibilityMetadataV01 {
  source_contracts: string[];
  legacy_scope_ref: ExternalRefV01 | null;
  source_refs: ExternalRefV01[];
  unmapped_fields: TaskContextPacketCompatibilityUnmappedFieldV01[];
  warnings: string[];
}

export interface TaskContextPacketIntegrityV01 {
  canonicalization: typeof TASK_CONTEXT_PACKET_CANONICALIZATION_V01;
  fingerprint_algorithm: "sha256";
  fingerprint_scope: "packet_without_integrity_fingerprint";
  fingerprint: string;
}

export interface TaskContextPacketTaskV01 {
  goal: string;
  success_criteria: string[];
  non_goals: string[];
}

export interface TaskContextPacketConstraintsV01 {
  required_checks: string[];
  forbidden_actions: string[];
  data_classification: TaskContextPacketDataClassificationV01;
  context_budget: TaskContextPacketContextBudgetV01;
}

export interface TaskContextPacketV01 {
  packet_version: typeof TASK_CONTEXT_PACKET_VERSION_V01;
  packet_id: string;
  workspace_id: string;
  project_id: string;
  work_ref: string | ExternalRefV01 | null;
  generated_at: string;
  expires_at: string | null;
  task: TaskContextPacketTaskV01;
  current_projection: TaskContextPacketCurrentProjectionV01 | null;
  selected_context: TaskContextPacketSelectedEntryV01[];
  excluded_context: TaskContextPacketExcludedEntryV01[];
  tensions: TaskContextPacketIssueV01[];
  risks: TaskContextPacketIssueV01[];
  gaps: TaskContextPacketGapV01[];
  constraints: TaskContextPacketConstraintsV01;
  capability_grant: TaskContextPacketBoundedCapabilitySummaryV01 | null;
  return_contract: TaskContextPacketReturnContractV01;
  authority_summary: TaskContextPacketAuthoritySummaryV01;
  source_status: TaskContextPacketSourceStatusV01;
  compatibility: TaskContextPacketCompatibilityMetadataV01;
  integrity: TaskContextPacketIntegrityV01;
}

export interface TaskContextPacketValidationIssueV01 {
  severity: "error" | "warning";
  code: string;
  path: string | null;
  message: string;
}

export interface TaskContextPacketValidationResultV01 {
  status: TaskContextPacketValidationStatusV01;
  normalized_protocol_version:
    | typeof TASK_CONTEXT_PACKET_VERSION_V01
    | "external_ref.v0.1"
    | null;
  errors: TaskContextPacketValidationIssueV01[];
  warnings: TaskContextPacketValidationIssueV01[];
}
