import type { ExternalRefV01 } from "./external-ref";
import type {
  OperationalContextSelectionDecisionBindingV01,
  OperationalContinuationAdmissionIdentityV01,
} from "./operational-context-selection";
import type { TaskContextPacketV01 } from "./task-context-packet";

export const OPERATIONAL_CONTINUATION_ADMISSION_VERSION_V01 =
  "operational_continuation_admission.v0.1" as const;
export const SOURCE_LINKED_OPERATIONAL_CONTINUATION_LINEAGE_V01 =
  "source_linked_operational_continuation" as const;
export const OPERATIONAL_CONTINUATION_ADMISSION_REQUEST_VERSION_V01 =
  "operational_continuation_admission_request.v0.1" as const;

export interface OperationalContinuationPacketBindingV01 {
  packet_version: TaskContextPacketV01["packet_version"];
  packet_id: string;
  packet_fingerprint: string;
}

export interface OperationalContinuationAdmissionAuthorityV01 {
  is_operational_policy: false;
  activates_policy: false;
  performs_semantic_transition: false;
  changes_accepted_semantic_state: false;
  grants_execution_authority: false;
  grants_external_effect_authority: false;
  grants_scheduling_authority: false;
  inherits_run_a_grant: false;
  inherits_run_a_capability_summary: false;
  inherits_run_a_attachment: false;
  creates_attachment: false;
  creates_start_decision: false;
  creates_resume_decision: false;
  creates_managed_run: false;
  calls_provider: false;
  calls_model: false;
  calls_network: false;
  calls_github: false;
  writes_project_files: false;
  executes_project_commands: false;
  closes_work: false;
}

export interface OperationalContinuationAdmissionV01 {
  admission_version: typeof OPERATIONAL_CONTINUATION_ADMISSION_VERSION_V01;
  admission_id: string;
  workspace_id: string;
  project_id: string;
  work_ref: TaskContextPacketV01["work_ref"];
  lineage: {
    lineage_kind: typeof SOURCE_LINKED_OPERATIONAL_CONTINUATION_LINEAGE_V01;
    packet_a: OperationalContinuationPacketBindingV01;
    packet_b: OperationalContinuationPacketBindingV01;
    packet_a_was_exact_current_at_admission: true;
    packet_b_is_non_semantic_current_work: true;
    same_workspace_project_and_work: true;
    continuation_hop: 1;
    semantic_transition_created: false;
  };
  acgc5a_materialization_identity: OperationalContinuationAdmissionIdentityV01;
  operational_context_selection: {
    selection_id: string;
    selection_fingerprint: string;
  };
  acgc4_binding: {
    source_bundle_id: string;
    source_bundle_fingerprint: string;
    profile_id: string;
    profile_fingerprint: string;
    proposal_id: string;
    proposal_fingerprint: string;
    canonical_admission_idempotency_key: string;
  };
  effective_proposal_only_decisions: OperationalContextSelectionDecisionBindingV01[];
  authenticated_action: {
    action: "admit_source_linked_operational_continuation";
    operator_actor_ref: ExternalRefV01;
    local_session_action_ref: ExternalRefV01;
    request_ref: ExternalRefV01;
    admitted_at: string;
  };
  idempotency_key: string;
  effect_summary: {
    task_context_packet_b_persisted: true;
    continuation_admission_persisted: true;
    packet_b_became_current_work: true;
    attachment_prepared: false;
    start_decision_created: false;
    resume_decision_created: false;
    grant_issued: false;
    run_created: false;
    semantic_state_changed: false;
    semantic_target_head_changed: false;
    state_transition_receipt_created: false;
    proposal_changed: false;
    review_decision_changed: false;
  };
  authority_boundary: OperationalContinuationAdmissionAuthorityV01;
  integrity: {
    algorithm: "sha256";
    canonicalization: "augnes-json-c14n-v0_1";
    fingerprint_scope: "operational_continuation_admission_without_integrity_fingerprint";
    fingerprint: string;
  };
}

export interface AdmitSourceLinkedOperationalContinuationRequestV01 {
  request_version: typeof OPERATIONAL_CONTINUATION_ADMISSION_REQUEST_VERSION_V01;
  action: "admit_source_linked_operational_continuation";
  workspace_id: string;
  project_id: string;
  expected_active_project_id: string;
  expected_active_selection_revision: number;
  expected_current_packet_a_id: string;
  expected_current_packet_a_fingerprint: string;
  source_request: Omit<
    import("@/lib/vnext/runtime/operational-continuation-read-model").OperationalContinuationReadRequestV01,
    "workspace_id" | "project_id" | "operator_id"
  >;
  expected_materialization_identity: OperationalContinuationAdmissionIdentityV01;
  expected_selection_id: string;
  expected_selection_fingerprint: string;
  expected_packet_b_id: string;
  expected_packet_b_fingerprint: string;
}

export interface AdmitSourceLinkedOperationalContinuationResultV01 {
  status: "inserted" | "exact_replay";
  admission: OperationalContinuationAdmissionV01;
  packet_b: TaskContextPacketV01;
  session_admission: {
    cookie_value: string;
    cookie_expires_at: string;
    cookie_max_age_seconds: number;
  };
  packet_b_persisted: true;
  packet_b_current: true;
  attachment_prepared: false;
  start_decision_created: false;
  resume_decision_created: false;
  grant_issued: false;
  run_created: false;
  provider_called: false;
  model_called: false;
  network_called: false;
  github_called: false;
  project_files_written: false;
  project_commands_executed: false;
  semantic_state_changed: false;
  semantic_transition_created: false;
  policy_activated: false;
  semantic_authority_granted: false;
  execution_authority_granted: false;
}

export interface SourceLinkedOperationalContinuationLineageInspectionV01 {
  lineage_kind: typeof SOURCE_LINKED_OPERATIONAL_CONTINUATION_LINEAGE_V01;
  packet: TaskContextPacketV01;
  prior_packet: TaskContextPacketV01;
  admission: OperationalContinuationAdmissionV01;
  projection_current: boolean;
  exact_source_rematerialization_reperformed: false;
  historical_canonical_writer_invocation_proven: false;
  authenticated_admission_provenance_bound: true;
  semantic_transition_created: false;
}
