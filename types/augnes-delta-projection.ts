/**
 * Type-only Augnes Delta projection read-model v0.1 contract.
 *
 * This file defines the read-model shape for projecting existing Augnes source
 * records into AugnesDelta[] and DeltaBatch[] without mutating source records.
 * It imports only types, performs no DB reads or writes, calls no routes,
 * providers, OpenAI, GitHub, or Codex runtime, and has no side effects.
 */

import type {
  ArtifactRef,
  AugnesDelta,
  AugnesDeltaAuthorityBoundary,
  DeltaBatch,
  EvidenceRef,
  HandoffRef,
  ResearchDiagnosticRef,
  SnapshotRef,
} from "./augnes-delta";

export const AUGNES_DELTA_PROJECTION_VERSION = "augnes_delta_projection.v0.1" as const;

export const AUGNES_DELTA_PROJECTION_SOURCE_KINDS = [
  "state_delta_proposal",
  "work_event",
  "coordination_event",
  "action_record",
  "evidence_record",
  "dogfooding_record",
  "dogfooding_review_cue",
  "dogfooding_signal",
  "handoff_packet",
  "codex_result",
  "perspective_snapshot",
  "unknown",
] as const;

export const AUGNES_DELTA_PROJECTION_GAP_SEVERITIES = [
  "low",
  "medium",
  "high",
] as const;

export type AugnesDeltaProjectionSourceKind =
  (typeof AUGNES_DELTA_PROJECTION_SOURCE_KINDS)[number];

export type AugnesDeltaProjectionGapSeverity =
  (typeof AUGNES_DELTA_PROJECTION_GAP_SEVERITIES)[number];

export interface AugnesDeltaProjectionReadModel {
  runtime: "augnes";
  projection_version: typeof AUGNES_DELTA_PROJECTION_VERSION;
  contract_version: "augnes_delta_contract.v0.1";
  scope: string;
  as_of: string;
  source_refs: AugnesDeltaProjectionSourceRefs;
  source_counts: AugnesDeltaProjectionSourceCounts;
  deltas: AugnesDelta[];
  batches: DeltaBatch[];
  gaps: AugnesDeltaProjectionGap[];
  authority_boundary: AugnesDeltaProjectionAuthorityBoundary;
  next_phase_notes: string[];
}

export interface AugnesDeltaProjectionSourceRefs {
  state_delta_proposal_ids: string[];
  work_event_ids: string[];
  coordination_event_ids: string[];
  action_record_ids: string[];
  evidence_record_ids: string[];
  dogfooding_record_ids: string[];
  handoff_refs: string[];
  codex_result_refs: string[];
  snapshot_refs: SnapshotRef[];
  diagnostic_refs: ResearchDiagnosticRef[];
}

export interface AugnesDeltaProjectionSourceCounts {
  state_delta_proposals: number;
  work_events: number;
  coordination_events: number;
  action_records: number;
  evidence_records: number;
  dogfooding_records: number;
  handoff_traces: number;
  codex_result_traces: number;
  snapshot_refs: number;
  diagnostic_refs: number;
  total_projected_deltas: number;
  total_batches: number;
  total_gaps: number;
}

export interface AugnesDeltaProjectionGap {
  code: string;
  severity: AugnesDeltaProjectionGapSeverity;
  source_kind: AugnesDeltaProjectionSourceKind;
  summary: string;
  details: string[];
  source_refs: string[];
}

export interface AugnesDeltaProjectionOptions {
  scope?: string;
  as_of?: string;
  include_empty_source_gaps?: boolean;
  next_phase_notes?: string[];
}

export interface AugnesDeltaProjectionAuthorityBoundary
  extends AugnesDeltaAuthorityBoundary {}

export interface AugnesDeltaProjectionInput {
  scope: string;
  as_of?: string;
  state_delta_proposals?: AugnesDeltaProjectionStateDeltaProposalInput[];
  work_events?: AugnesDeltaProjectionWorkEventInput[];
  coordination_events?: AugnesDeltaProjectionCoordinationEventInput[];
  action_records?: AugnesDeltaProjectionActionRecordInput[];
  evidence_records?: AugnesDeltaProjectionEvidenceRecordInput[];
  dogfooding_records?: AugnesDeltaProjectionDogfoodingRecordInput[];
  handoff_traces?: AugnesDeltaProjectionHandoffTraceInput[];
  codex_result_traces?: AugnesDeltaProjectionCodexResultTraceInput[];
  snapshot_refs?: SnapshotRef[];
  diagnostic_refs?: ResearchDiagnosticRef[];
  gaps?: AugnesDeltaProjectionGap[];
  next_phase_notes?: string[];
}

export interface AugnesDeltaProjectionResult {
  read_model: AugnesDeltaProjectionReadModel;
  projected_delta_count: number;
  batch_count: number;
  gap_count: number;
}

export interface AugnesDeltaProjectionStateDeltaProposalInput {
  id: string;
  scope?: string;
  state_key?: string;
  status?: "pending" | "committed" | "rejected" | string | null;
  change_type?: string | null;
  operation?: string | null;
  temporal_scope?: string | null;
  reason?: string | null;
  proposed_at?: string | null;
  source_agent_id?: string | null;
  source_session_id?: string | null;
}

export interface AugnesDeltaProjectionWorkEventInput {
  id: string;
  work_id?: string | null;
  scope?: string;
  actor?: string | null;
  event_type?: string | null;
  summary?: string | null;
  result_status?: string | null;
  result_kind?: string | null;
  related_action_id?: string | null;
  related_pr?: string | null;
  related_state_keys?: string[] | null;
  created_at?: string | null;
}

export interface AugnesDeltaProjectionCoordinationEventInput {
  event_id: string;
  event_type?: string | null;
  scope?: string;
  work_id?: string | null;
  actor?: string | null;
  target?: string | null;
  source_surface?: string | null;
  authority_level?: string | null;
  state_keys?: string[] | null;
  causal_parent_id?: string | null;
  payload_ref?: string | null;
  result_status?: string | null;
  created_at?: string | null;
}

export interface AugnesDeltaProjectionActionRecordInput {
  id: string;
  scope?: string;
  state_key?: string | null;
  title?: string | null;
  description?: string | null;
  status?: string | null;
  source_agent_id?: string | null;
  source_session_id?: string | null;
  created_at?: string | null;
  completed_at?: string | null;
}

export interface AugnesDeltaProjectionEvidenceRecordInput {
  evidence_id: string;
  scope?: string;
  work_id?: string | null;
  publication_id?: string | null;
  delivery_id?: string | null;
  target_surface?: string | null;
  target_ref?: string | null;
  evidence_kind?: string | null;
  label?: string | null;
  status?: string | null;
  command?: string | null;
  result_summary?: string | null;
  skipped_reason?: string | null;
  observed_behavior?: string | null;
  source_surface?: string | null;
  source_ref?: string | null;
  related_action_id?: string | null;
  related_work_event_id?: string | null;
  created_by?: string | null;
  created_at?: string | null;
}

export interface AugnesDeltaProjectionDogfoodingRecordInput {
  record_id: string;
  scope?: string;
  record_kind?: "dogfooding_record" | "dogfooding_review_cue" | "dogfooding_signal" | string | null;
  title?: string | null;
  summary?: string | null;
  status?: string | null;
  created_at?: string | null;
  created_by?: string | null;
  signal_refs?: string[] | null;
}

export interface AugnesDeltaProjectionHandoffTraceInput {
  handoff_ref: string;
  scope?: string;
  handoff_kind?: string | null;
  summary?: string | null;
  created_at?: string | null;
  created_by?: string | null;
}

export interface AugnesDeltaProjectionCodexResultTraceInput {
  result_ref: string;
  scope?: string;
  result_kind?: string | null;
  summary?: string | null;
  status?: string | null;
  created_at?: string | null;
  created_by?: string | null;
  artifact_refs?: ArtifactRef[] | null;
  evidence_refs?: EvidenceRef[] | null;
  handoff_refs?: HandoffRef[] | null;
}
