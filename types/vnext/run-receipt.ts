import type { ExternalRefV01 } from "./external-ref";
import type { ModelInvocationReceiptV02 } from "./model-invocation-receipt";

export const RUN_RECEIPT_VERSION_V01 = "run_receipt.v0.1" as const;
export const RUN_RECEIPT_CANONICALIZATION_V01 =
  "augnes-json-c14n-v0_1" as const;
export const RUN_RECEIPT_MODEL_INVOCATION_ENTRY_VERSION_V02 =
  "run_receipt_model_invocation.v0.2" as const;

export const RUN_RECEIPT_EXECUTION_STATUSES_V01 = [
  "completed",
  "partial",
  "blocked",
  "failed",
  "cancelled",
  "unknown",
] as const;
export const RUN_RECEIPT_VERIFICATION_STATUSES_V01 = [
  "passed",
  "failed",
  "partial",
  "not_run",
  "unknown",
] as const;
export const RUN_RECEIPT_STATUS_BASES_V01 = [
  "observed",
  "attested",
  "mixed",
  "unknown",
] as const;
export const RUN_RECEIPT_OBSERVATION_TRUST_CLASSES_V01 = [
  "direct_local_observation",
  "verified_external_observation",
] as const;
export const RUN_RECEIPT_ATTESTATION_TRUST_CLASSES_V01 = [
  "host_attestation",
  "provider_report",
  "user_declaration",
  "imported_unverified",
  "derived_interpretation",
] as const;

export type RunReceiptExecutionStatusV01 =
  (typeof RUN_RECEIPT_EXECUTION_STATUSES_V01)[number];
export type RunReceiptVerificationStatusV01 =
  (typeof RUN_RECEIPT_VERIFICATION_STATUSES_V01)[number];
export type RunReceiptStatusBasisV01 =
  (typeof RUN_RECEIPT_STATUS_BASES_V01)[number];
export type RunReceiptObservationTrustClassV01 =
  (typeof RUN_RECEIPT_OBSERVATION_TRUST_CLASSES_V01)[number];
export type RunReceiptAttestationTrustClassV01 =
  (typeof RUN_RECEIPT_ATTESTATION_TRUST_CLASSES_V01)[number];

export interface RunReceiptStatusAxisV01<TStatus extends string> {
  status: TStatus;
  basis: RunReceiptStatusBasisV01;
  source_refs: ExternalRefV01[];
}

export interface RunReceiptVerificationAxisV01
  extends RunReceiptStatusAxisV01<RunReceiptVerificationStatusV01> {
  required_check_ids: string[];
}

export interface RunReceiptObservationV01 {
  observation_id: string;
  observation_kind: string;
  summary: string;
  event_at: string | null;
  observed_at: string;
  observer_ref: ExternalRefV01;
  trust_class: RunReceiptObservationTrustClassV01;
  source_refs: ExternalRefV01[];
  related_command_ids: string[];
  related_check_ids: string[];
  related_artifact_refs: ExternalRefV01[];
}

export interface RunReceiptAttestationV01 {
  attestation_id: string;
  attestation_kind: string;
  summary: string;
  reported_at: string;
  reporter_ref: ExternalRefV01;
  trust_class: RunReceiptAttestationTrustClassV01;
  source_refs: ExternalRefV01[];
  subject_refs: ExternalRefV01[];
}

export interface RunReceiptCommandSummaryV01 {
  command_id: string;
  summary: string;
  command_fingerprint: string | null;
  started_at: string | null;
  finished_at: string | null;
  exit_code: number | null;
  status: "completed" | "failed" | "blocked" | "unknown";
  basis: RunReceiptStatusBasisV01;
  source_refs: ExternalRefV01[];
  raw_output_included: false;
}

export interface RunReceiptCheckResultV01 {
  check_id: string;
  required: boolean;
  status: "passed" | "failed" | "blocked" | "unknown";
  basis: RunReceiptStatusBasisV01;
  summary: string;
  source_refs: ExternalRefV01[];
}

export interface RunReceiptSkippedCheckV01 {
  check_id: string;
  required: boolean;
  reason: string;
  basis: RunReceiptStatusBasisV01;
  source_refs: ExternalRefV01[];
}

export interface RunReceiptChangedArtifactV01 {
  artifact_ref: ExternalRefV01;
  change_kind: "added" | "modified" | "deleted" | "renamed" | "unknown";
  before_hash: string | null;
  after_hash: string | null;
  basis: RunReceiptStatusBasisV01;
  related_observation_ids: string[];
  related_attestation_ids: string[];
  source_refs: ExternalRefV01[];
}

export interface RunReceiptModelInvocationSummaryV01 {
  invocation_ref: ExternalRefV01;
  provider_ref: ExternalRefV01 | null;
  model_ref: ExternalRefV01 | null;
  started_at: string | null;
  finished_at: string | null;
  input_units: number | null;
  output_units: number | null;
  latency_ms: number | null;
  retry_count: number | null;
  status: "completed" | "failed" | "blocked" | "unknown";
  retention_class: string | null;
  egress_status: RunReceiptEgressStatusV01;
  raw_prompt_persisted: false;
  raw_response_persisted: false;
  hidden_reasoning_persisted: false;
  source_refs: ExternalRefV01[];
}

export interface RunReceiptModelInvocationEntryV02 {
  entry_version: typeof RUN_RECEIPT_MODEL_INVOCATION_ENTRY_VERSION_V02;
  invocation_ref: ExternalRefV01;
  work_ref: ExternalRefV01;
  run_ref: ExternalRefV01;
  invocation_receipt: ModelInvocationReceiptV02;
  retry_count: 0;
  source_refs: ExternalRefV01[];
}

export type RunReceiptModelInvocationV01 =
  | RunReceiptModelInvocationSummaryV01
  | RunReceiptModelInvocationEntryV02;

export interface RunReceiptExecutionEnvironmentV01 {
  environment_kind: "local" | "remote" | "hybrid" | "unknown";
  host_ref: ExternalRefV01 | null;
  worker_ref: ExternalRefV01 | null;
  operating_system: string | null;
  runtime_labels: string[];
  source_refs: ExternalRefV01[];
}

export interface RunReceiptIssueV01 {
  code: string;
  summary: string;
  source_refs: ExternalRefV01[];
}

export interface RunReceiptResultSummaryV01 {
  summary: string;
  outcome: string | null;
  limitations: string[];
}

export type RunReceiptEgressStatusV01 =
  | "occurred"
  | "did_not_occur"
  | "blocked"
  | "unknown";

export interface RunReceiptPrivacyEgressSummaryV01 {
  data_classification: "public_safe" | "private" | "local_only" | "secret";
  egress_status: RunReceiptEgressStatusV01;
  basis: RunReceiptStatusBasisV01;
  destination_refs: ExternalRefV01[];
  redaction_status: "applied" | "not_needed" | "not_applied" | "unknown";
  retention_class: string | null;
  raw_prompt_persisted: false;
  raw_output_persisted: false;
  raw_transcript_persisted: false;
  secret_material_persisted: false;
  source_refs: ExternalRefV01[];
  notes: string[];
}

export interface RunReceiptUsageSummaryV01 {
  basis: "measured" | "attested" | "estimated" | "unknown";
  input_units: number | null;
  output_units: number | null;
  total_units: number | null;
  unit: string | null;
}

export interface RunReceiptCostUsageSummaryV01 {
  cost_basis: "measured" | "attested" | "estimated" | "unknown";
  cost_amount: number | null;
  currency: string | null;
  usage: RunReceiptUsageSummaryV01;
  source_refs: ExternalRefV01[];
}

export interface RunReceiptCapabilityCoverageEntryV01 {
  capability: string;
  coverage_level: "enforced" | "observed" | "advisory" | "outside_coverage";
  source_ref: ExternalRefV01 | null;
  notes: string[];
}

export interface RunReceiptTrustSummaryV01 {
  direct_observations: number;
  verified_external_observations: number;
  host_attestations: number;
  provider_reports: number;
  user_declarations: number;
  imported_unverified_items: number;
  derived_interpretations: number;
}

export interface RunReceiptCompatibilityMetadataV01 {
  source_contracts: string[];
  unmapped_fields: Array<{ source_field: string; reason: string }>;
  warnings: string[];
  external_refs: ExternalRefV01[];
}

export interface RunReceiptAuthoritySummaryV01 {
  receipt_is_command: false;
  receipt_is_canonical_project_state: false;
  receipt_is_approval: false;
  receipt_is_proof: false;
  receipt_is_accepted_evidence: false;
  receipt_is_semantic_commit: false;
  closes_work: false;
  authorizes_execution: false;
  authorizes_external_side_effects: false;
  authorizes_provider_calls: false;
  authorizes_github_mutation: false;
  authorizes_merge: false;
  authorizes_publication: false;
  authorizes_perspective_or_memory_mutation: false;
  performs_durable_transition: false;
  writes_database: false;
  creates_routes_or_ui_actions: false;
  reporting_action_grants_authority: false;
  notes: string[];
}

export interface RunReceiptIntegrityV01 {
  algorithm: "sha256";
  canonicalization: typeof RUN_RECEIPT_CANONICALIZATION_V01;
  fingerprint_scope: "receipt_without_integrity_fingerprint";
  fingerprint: string;
}

export interface RunReceiptV01 {
  receipt_version: typeof RUN_RECEIPT_VERSION_V01;
  receipt_id: string;
  workspace_id: string;
  project_id: string;
  run_id: string;
  work_ref: ExternalRefV01 | null;
  task_context_packet_ref: ExternalRefV01 | null;
  recorded_at: string;
  started_at: string | null;
  finished_at: string | null;
  execution: RunReceiptStatusAxisV01<RunReceiptExecutionStatusV01>;
  verification: RunReceiptVerificationAxisV01;
  reporter_ref: ExternalRefV01;
  observer_refs: ExternalRefV01[];
  verifier_refs: ExternalRefV01[];
  host_ref: ExternalRefV01 | null;
  worker_ref: ExternalRefV01 | null;
  model_invocations: RunReceiptModelInvocationV01[];
  execution_environment: RunReceiptExecutionEnvironmentV01;
  observations: RunReceiptObservationV01[];
  attestations: RunReceiptAttestationV01[];
  changed_artifacts: RunReceiptChangedArtifactV01[];
  commands: RunReceiptCommandSummaryV01[];
  checks: RunReceiptCheckResultV01[];
  skipped_checks: RunReceiptSkippedCheckV01[];
  external_refs: ExternalRefV01[];
  result_summary: RunReceiptResultSummaryV01;
  blockers: RunReceiptIssueV01[];
  warnings: RunReceiptIssueV01[];
  gaps: RunReceiptIssueV01[];
  privacy_egress: RunReceiptPrivacyEgressSummaryV01;
  cost_usage: RunReceiptCostUsageSummaryV01;
  capability_coverage: RunReceiptCapabilityCoverageEntryV01[];
  trust_summary: RunReceiptTrustSummaryV01;
  source_refs: ExternalRefV01[];
  artifact_refs: ExternalRefV01[];
  compatibility: RunReceiptCompatibilityMetadataV01;
  authority_summary: RunReceiptAuthoritySummaryV01;
  idempotency_key: string;
  integrity: RunReceiptIntegrityV01;
}

export interface RunReceiptValidationIssueV01 {
  severity: "error" | "warning";
  code: string;
  path: string | null;
  message: string;
}

export interface RunReceiptValidationResultV01 {
  status: "valid" | "invalid" | "blocked";
  normalized_protocol_version: typeof RUN_RECEIPT_VERSION_V01 | null;
  errors: RunReceiptValidationIssueV01[];
  warnings: RunReceiptValidationIssueV01[];
}
