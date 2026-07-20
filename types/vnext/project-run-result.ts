import type { AutonomyRunnerStatus } from "../autonomy-runner-execution";
import type { CriterionAssessmentReadbackV01 } from "./criterion-assessment";
import type { ExternalRefV01 } from "./external-ref";
import type {
  RunReceiptCapabilityCoverageEntryV01,
  RunReceiptCheckResultV01,
  RunReceiptCommandSummaryV01,
  RunReceiptHostApprovalV01,
  RunReceiptIssueV01,
  RunReceiptPrivacyEgressSummaryV01,
  RunReceiptSkippedCheckV01,
  RunReceiptTrustSummaryV01,
} from "./run-receipt";
import type { BoundedAutomationBudgetV01 } from "./bounded-automation-cycle";

export const PROJECT_RUN_RESULT_READ_MODEL_VERSION_V01 =
  "project_run_result_read_model.v0.1" as const;

export type ProjectRunResultAttentionV01 =
  | "terminal_result_available"
  | "verification_partial"
  | "verification_failed"
  | "blocked"
  | "cancelled"
  | "timed_out"
  | "unavailable"
  | "gaps_present"
  | "no_terminal_result"
  | "receipt_unavailable"
  | "reconciliation_required";

export interface ProjectRunResultCurrentRunV01 {
  run_ref: string;
  status: AutonomyRunnerStatus;
  mode: "interactive" | "policy_triggered" | "unknown";
  started_at: string | null;
  updated_at: string;
  public_reason: string | null;
  reconciliation_required: boolean;
  packet_ref: string | null;
  receipt_available: boolean;
}

export interface ProjectRunResultSummaryV01 {
  receipt_ref: string;
  run_ref: string;
  outcome: string | null;
  execution_status: string;
  verification_status: string;
  recorded_at: string;
  started_at: string | null;
  finished_at: string | null;
  summary: string;
  changed_file_count: number;
  artifact_count: number;
  command_count: number;
  action_count: number;
  check_counts: {
    passed: number;
    failed: number;
    blocked: number;
    unknown: number;
    skipped: number;
  };
  blocker_count: number;
  gap_count: number;
  trust_label: "observed" | "mixed" | "host_attested" | "unknown";
  review_attention: ProjectRunResultAttentionV01;
  review_href: string;
  inspector_href: string;
  mode: "interactive" | "policy_triggered" | "unknown";
}

export interface ProjectRunResultArtifactV01 {
  artifact_ref: ExternalRefV01;
  summary: string | null;
  change_kind: "added" | "modified" | "deleted" | "renamed" | "unknown" | null;
  before_hash: string | null;
  after_hash: string | null;
  basis: "observed" | "attested" | "mixed" | "unknown";
  source_refs: ExternalRefV01[];
}

export interface ProjectRunResultActionV01 {
  action_id: string;
  summary: string;
  basis: "observed" | "host_attested" | "advisory";
  source_refs: ExternalRefV01[];
}

export interface ProjectRunResultModelInvocationV01 {
  state:
    | "resolved_augnes_owned"
    | "referenced_unresolved"
    | "native_host_internal_outside_coverage"
    | "none";
  invocation_ref: ExternalRefV01 | null;
  provider_ref: ExternalRefV01 | null;
  model_ref: ExternalRefV01 | null;
  purpose: string | null;
  status: string | null;
  outcome: string | null;
  usage_summary: string | null;
  latency_ms: number | null;
  cost_summary: string | null;
  budget_summary: string | null;
  egress_status: string | null;
  cancellation_disposition: string | null;
  failure_code: string | null;
  coverage: string;
  source_refs: ExternalRefV01[];
}

export type ProjectRunResultProposalReadbackV01 =
  | {
      status: "available";
      proposal_id: string;
      proposal_fingerprint: string;
      proposal_status: "pending_review";
      admission_idempotency_key: string;
      review_href: string;
    }
  | {
      status: "unavailable";
      reason:
        | "assessment_unavailable"
        | "not_created"
        | "unsupported_protocol";
    }
  | {
      status: "failed";
      error_code: string;
      retryable: boolean;
      failure_recorded: true;
      failure_recording_error_code: null;
    };

export interface ProjectRunResultDetailV01 {
  read_model_version: typeof PROJECT_RUN_RESULT_READ_MODEL_VERSION_V01;
  workspace_id: string;
  project_id: string;
  summary: ProjectRunResultSummaryV01;
  identity: {
    receipt_ref: string;
    receipt_fingerprint: string;
    run_ref: string;
    work_ref: ExternalRefV01 | null;
    packet_ref: ExternalRefV01 | null;
    source_transition_ref: ExternalRefV01 | null;
    root_scope_ref: ExternalRefV01 | null;
    repository_ref: ExternalRefV01 | null;
    selected_worktree_ref: ExternalRefV01 | null;
    adapter_ref: ExternalRefV01 | null;
    capability_ref: ExternalRefV01 | null;
    source_refs: ExternalRefV01[];
  };
  packet: {
    status: "available" | "missing" | "not_recorded";
    generated_at: string | null;
    packet_fingerprint: string | null;
    selected_context_count: number | null;
    selected_context_refs: ExternalRefV01[];
    source_ref_count: number | null;
  };
  criterion_assessment: CriterionAssessmentReadbackV01;
  proposal: ProjectRunResultProposalReadbackV01;
  automation: null | {
    origin: "policy_triggered";
    cycle_id: string;
    attempt: number;
    policy_ref: ExternalRefV01;
    capability_grant_ref: ExternalRefV01;
    budget: BoundedAutomationBudgetV01;
    stop_reason: string | null;
    stopped_at_review_needed: boolean;
    automatic_retry: false;
    semantic_authority_granted: false;
  };
  host: {
    host_ref: ExternalRefV01 | null;
    host_refs: ExternalRefV01[];
    approvals: RunReceiptHostApprovalV01[];
  };
  artifacts: ProjectRunResultArtifactV01[];
  commands: RunReceiptCommandSummaryV01[];
  actions: ProjectRunResultActionV01[];
  checks: RunReceiptCheckResultV01[];
  skipped_checks: RunReceiptSkippedCheckV01[];
  blockers: RunReceiptIssueV01[];
  warnings: RunReceiptIssueV01[];
  gaps: RunReceiptIssueV01[];
  uncertainty: string[];
  proposed_next_steps: ProjectRunResultActionV01[];
  model_invocations: ProjectRunResultModelInvocationV01[];
  capability_coverage: RunReceiptCapabilityCoverageEntryV01[];
  trust_summary: RunReceiptTrustSummaryV01;
  privacy_egress: RunReceiptPrivacyEgressSummaryV01;
  compatibility: {
    source_contracts: string[];
    unmapped_fields: Array<{ source_field: string; reason: string }>;
    warnings: string[];
  };
  authority: {
    proposal_created: false;
    review_decision_created: false;
    semantic_transition_created: false;
    evidence_accepted: false;
    work_closed: false;
    semantic_state_changed: false;
  };
}

export interface ProjectRunResultOverviewV01 {
  read_model_version: typeof PROJECT_RUN_RESULT_READ_MODEL_VERSION_V01;
  workspace_id: string;
  project_id: string;
  current_run: ProjectRunResultCurrentRunV01 | null;
  latest_result: ProjectRunResultSummaryV01 | null;
  latest_result_state:
    | "available"
    | "empty"
    | "receipt_unavailable"
    | "error";
}
