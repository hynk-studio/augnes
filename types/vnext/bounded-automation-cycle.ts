import type { ExternalRefV01 } from "./external-ref";
import type { VNextAutomationWorkSourceV01 } from "./automation-work-item";

export const BOUNDED_AUTOMATION_CYCLE_PROFILE_V01 =
  "bounded_autohunt_review_needed.v0.1" as const;
export const BOUNDED_AUTOMATION_CAPABILITY_GRANT_VERSION_V01 =
  "bounded_automation_capability_grant.v0.1" as const;
export const BOUNDED_AUTOMATION_CYCLE_PROJECTION_VERSION_V01 =
  "bounded_automation_cycle_projection.v0.1" as const;

export interface BoundedAutomationBudgetV01 {
  budget_version: "bounded_automation_budget.v0.1";
  max_work_items: 1;
  max_active_runs: 1;
  max_attempts: 1;
  max_runtime_ms: number;
  max_commands: number;
  max_augnes_model_invocations: 0;
  max_augnes_model_tokens: 0;
  max_augnes_model_cost_units: 0;
  native_host_model_scope: "none";
  host_egress: "local_in_process_only";
  network_access: "denied";
  automatic_retry: false;
}

export interface BoundedAutomationCapabilityGrantV01 {
  grant_version: typeof BOUNDED_AUTOMATION_CAPABILITY_GRANT_VERSION_V01;
  profile: typeof BOUNDED_AUTOMATION_CYCLE_PROFILE_V01;
  workspace_id: string;
  project_id: string;
  policy_ref: ExternalRefV01;
  policy_fingerprint: string;
  control_revision: number;
  source_grant_ref: ExternalRefV01;
  source_grant_fingerprint: string;
  work_source_ref: ExternalRefV01;
  work_source_fingerprint: string;
  work_operation_profile: VNextAutomationWorkSourceV01["operation_profile"];
  packet_intent_fingerprint: string;
  host_adapter_version: string;
  host_capability_version: string;
  host_execution_profile: "deterministic_zero_model";
  host_provider_egress: "forbidden";
  root_fingerprint: string;
  allowed_capabilities: string[];
  forbidden_capabilities: string[];
  resource_scope: string[];
  stop_conditions: string[];
  budget: BoundedAutomationBudgetV01;
  issued_at: string;
  expires_at: string;
  grant_id: string;
  grant_fingerprint: string;
  grants_semantic_authority: false;
  grants_external_action_authority: false;
  grants_credential_access: false;
  can_merge: false;
  can_publish: false;
  can_deploy: false;
  can_expand_authority: false;
}

export type BoundedAutomationCycleStatusV01 =
  | "not_configured"
  | "disabled"
  | "paused"
  | "no_eligible_work"
  | "work_ambiguous"
  | "grant_required"
  | "grant_expired"
  | "capability_unavailable"
  | "policy_denied"
  | "eligible"
  | "starting"
  | "running"
  | "cancellation_requested"
  | "cancelled"
  | "timed_out"
  | "failed"
  | "proposal_settlement_pending"
  | "proposal_settlement_failed"
  | "reconciliation_required"
  | "review_needed";

export interface BoundedAutomationCycleProjectionV01 {
  projection_version: typeof BOUNDED_AUTOMATION_CYCLE_PROJECTION_VERSION_V01;
  workspace_id: string;
  project_id: string;
  status: BoundedAutomationCycleStatusV01;
  stop_reason: string;
  retryable: boolean;
  control_revision: number | null;
  work_source: null | {
    label: string;
    work_id: string;
    work_fingerprint: string;
    operation_profile: VNextAutomationWorkSourceV01["operation_profile"];
    lifecycle_status: string;
    source_packet_id: string;
    source_packet_fingerprint: string;
  };
  grant: null | {
    grant_id: string;
    grant_fingerprint: string;
    expires_at: string;
    host_adapter_version: string;
    host_capability_version: string;
    host_execution_profile: "deterministic_zero_model";
  };
  budget: BoundedAutomationBudgetV01;
  run: null | {
    run_id: string;
    status: string;
    attempt: number;
    control_revision: number;
    cancellation_requested: boolean;
    reconciliation_required: boolean;
    receipt_id: string | null;
    proposal_id: string | null;
    result_href: string | null;
    proposal_href: string | null;
  };
  feedback_needed: boolean;
  feedback_href: string | null;
  next_action:
    | "enable"
    | "resume"
    | "queue_current_task"
    | "run_one_bounded_cycle"
    | "cancel"
    | "retry_proposal_settlement"
    | "open_review"
    | "provide_context_use_feedback"
    | "none";
  model_calls_allowed: 0;
  semantic_authority_granted: false;
  decision_created: false;
  transition_created: false;
}
