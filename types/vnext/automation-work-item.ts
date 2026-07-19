import type { ExternalRefV01 } from "./external-ref";
import type { TaskContextPacketBoundedCapabilitySummaryV01 } from "./task-context-packet";

export const VNEXT_AUTOMATION_WORK_SOURCE_VERSION_V01 =
  "vnext_automation_work_source.v0.1" as const;
export const VNEXT_AUTOMATION_WORK_SNAPSHOT_VERSION_V01 =
  "vnext_automation_work_snapshot.v0.1" as const;

export const VNEXT_AUTOMATION_WORK_STATUSES_V01 = [
  "queued",
  "claimed",
  "running",
  "review_needed",
  "completed",
  "failed",
  "reconciliation_required",
  "cancelled",
] as const;

export type VNextAutomationWorkStatusV01 =
  (typeof VNEXT_AUTOMATION_WORK_STATUSES_V01)[number];

export interface VNextAutomationWorkSourceV01 {
  work_source_version: typeof VNEXT_AUTOMATION_WORK_SOURCE_VERSION_V01;
  workspace_id: string;
  project_id: string;
  work_id: string;
  work_class: "bounded_project_task";
  title: string;
  task: {
    goal: string;
    success_criteria: string[];
    non_goals: string[];
  };
  source_packet: {
    packet_id: string;
    packet_fingerprint: string;
  };
  source_capability_grant: TaskContextPacketBoundedCapabilitySummaryV01;
  source_capability_grant_fingerprint: string;
  source_grant_record_status: "exact_record" | "packet_bound_summary";
  required_context_refs: ExternalRefV01[];
  proposed_files: string[];
  required_checks: string[];
  expected_outputs: string[];
  blocked_actions: string[];
  stop_conditions: string[];
  budget_projection: {
    max_work_items: 1;
    max_active_runs: 1;
    max_attempts: 1;
    max_commands: number;
    max_runtime_ms: number;
    augnes_model_invocations: 0;
    augnes_model_tokens: 0;
    augnes_model_cost_units: 0;
    native_host_model_scope: "none";
    network_access: "denied";
  };
  created_at: string;
  work_fingerprint: string;
}

export interface VNextAutomationWorkCycleBindingV01 {
  cycle_id: string;
  policy_ref: ExternalRefV01;
  control_revision: number;
  final_grant_ref: ExternalRefV01;
  packet_ref: ExternalRefV01;
  trigger_ref: ExternalRefV01;
  attempt: 1;
  run_id: string;
  receipt_ref: ExternalRefV01 | null;
  proposal_ref: ExternalRefV01 | null;
}

export interface VNextAutomationWorkSnapshotV01 {
  snapshot_version: typeof VNEXT_AUTOMATION_WORK_SNAPSHOT_VERSION_V01;
  source: VNextAutomationWorkSourceV01;
  status: VNextAutomationWorkStatusV01;
  revision: number;
  prior_snapshot_ref: ExternalRefV01 | null;
  cycle_binding: VNextAutomationWorkCycleBindingV01 | null;
  status_reason: string;
  observed_at: string;
  snapshot_id: string;
  integrity: {
    algorithm: "sha256";
    fingerprint_scope: "automation_work_snapshot_without_integrity_fingerprint";
    fingerprint: string;
  };
}
