"use client";

import type { PerspectiveSnapshot } from "@/lib/perspective/snapshot";
import type { TemporalPreviewResponse } from "@/lib/temporal-interpretation/types";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

const SCOPE = "project:augnes";
const CANONICAL_MESSAGE =
  "이번 출품작 이름은 Augnes로 가자. Next.js + SQLite + OpenAI API로 만들고, ChatGPT App 연결은 나중에 확장으로 미루자. 이번 제출 전까지는 README, 스크린샷, no API keys가 우선이야.";

type StateValue =
  | boolean
  | number
  | string
  | null
  | StateValue[]
  | { [key: string]: StateValue };

type StateEntry = {
  id: string;
  state_key: string;
  value: StateValue;
  temporal_scope: string;
  stability: string;
  change_type: string;
};

type StateTension = {
  id: string;
  state_key: string | null;
  title: string;
  description: string;
  status: string;
  severity: string;
};

type StateDeltaProposal = {
  id: string;
  state_key: string;
  before_value: StateValue;
  after_value: StateValue;
  operation: string;
  temporal_scope: string;
  stability: string;
  change_type: string;
  reason: string | null;
  status: "pending" | "committed" | "rejected";
  consolidation_status:
    | "candidate"
    | "reinforced"
    | "ready"
    | "needs_review"
    | "expired"
    | "committed"
    | "rejected";
  salience_score: number;
  evidence_score: number;
  conflict_score: number;
  self_impact_score: number;
  prediction_error_score: number;
  reinforcement_count: number;
  scoring_version: string;
  scoring_reason: string | null;
  expires_at: string | null;
  score_breakdown?: StateValue;
};

type StateTransition = {
  id: string;
  state_key: string;
  before_value: StateValue;
  after_value: StateValue;
  temporal_scope: string;
  stability: string;
  change_type: string;
  source_agent_id: string | null;
  source_session_id: string | null;
  reason: string | null;
  committed_at: string;
};

type SnapshotResponse = {
  active_state: StateEntry[];
  future_state: StateEntry[];
  deprecated_state: StateEntry[];
  completed_state: StateEntry[];
  open_tensions: StateTension[];
};

type TrajectoryResponse = {
  trajectories: Record<string, StateTransition[]>;
};

type ProposalResponse = {
  proposals: StateDeltaProposal[];
};

type PlanRecommendation = {
  title: string;
  rationale: string;
  tool_name: string | null;
  priority: "now" | "next" | "later";
  grounded_state_keys: string[];
};

type PlanResponse = {
  planner: "openai" | "mock";
  recommendations: PlanRecommendation[];
};

type StateBriefAgentHandoff = {
  current_status: {
    summary: string;
    state_counts?: Record<string, number>;
    notable_state_keys?: string[];
  };
  next_recommended_action: {
    title: string;
    rationale: string;
    suggested_actor: string;
    priority: "now" | "next" | "later";
    related_state_keys?: string[];
  };
  blockers_or_tensions: {
    title: string;
    severity: string;
    related_state_keys: string[];
    summary: string;
  }[];
  codex_handoff: {
    task_brief: string;
    verification_commands: string[];
    action_record_template: Record<string, unknown>;
  };
};

type StateBriefResponse = {
  scope: string;
  as_of: string;
  agent_handoff?: StateBriefAgentHandoff;
};

type CockpitTemporalAdmissionDecision = {
  candidate_id: string;
  category: string;
  reason: string;
  source_authority: string;
  evidence_refs: string[];
  counterexample_refs: string[];
  residual_tension_refs: string[];
};

type CockpitTemporalActiveContextAdmission = {
  decisions: CockpitTemporalAdmissionDecision[];
  note: string;
};

type CockpitTemporalPreviewResponse = TemporalPreviewResponse & {
  preview: TemporalPreviewResponse["preview"] & {
    active_context_admission?: CockpitTemporalActiveContextAdmission;
  };
};

type TemporalActiveContextAdmission = CockpitTemporalActiveContextAdmission;

type WorkItem = {
  work_id: string;
  scope: string;
  title: string;
  status: string;
  priority: string;
  summary: string;
  next_action: string;
  user_attention_required: boolean;
  related_state_keys: string[];
  links: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type WorkEvent = {
  id: string;
  work_id: string;
  scope: string;
  actor: string;
  event_type: string;
  summary: string;
  result_status: string | null;
  result_kind: string | null;
  related_action_id: string | null;
  related_pr: string | null;
  related_state_keys: string[];
  created_at: string;
};

type WorkBriefResponse = {
  runtime: "augnes";
  scope: string;
  work_id: string;
  as_of: string;
  framing: Record<string, string>;
  work: WorkItem;
  next_action: string;
  user_attention_required: boolean;
  recent_events: WorkEvent[];
  related_state_keys: string[];
  related_proof: {
    action_ids: string[];
    prs: string[];
    docs: string[];
    links: Record<string, unknown>;
  };
  codex_handoff: {
    task_brief: string;
    constraints: string[];
    suggested_verification: string[];
    work_event_template: Record<string, unknown>;
  };
};

type WorkListResponse = {
  scope: string;
  work_items: WorkItem[];
};

type CoordinationEvent = {
  event_id: string;
  event_type: string;
  scope: string;
  work_id: string | null;
  actor: string;
  target: string | null;
  source_surface: string;
  authority_level: string;
  state_keys: string[];
  causal_parent_id: string | null;
  payload_ref: string | null;
  result_status: string | null;
  created_at: string;
};

type CoordinationEventsResponse = {
  scope: string;
  events: CoordinationEvent[];
};

type MailboxSummaryItem = {
  message_id: string;
  scope: string;
  work_id: string | null;
  from_agent: string;
  to_agent: string;
  message_type: string;
  summary: string;
  payload_ref: string | null;
  requires_ack: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  acknowledged_at: string | null;
  supersedes_message_id: string | null;
  summary_reason: string;
};

type MailboxSummaryResponse = {
  scope: string;
  as_of: string;
  summary: {
    pending_handoffs: MailboxSummaryItem[];
    needs_review: MailboxSummaryItem[];
    approval_needed: MailboxSummaryItem[];
    blocked_or_partial: MailboxSummaryItem[];
    inactive: {
      superseded_count: number;
      expired_count: number;
    };
  };
  boundaries: string[];
};

type PublicationSummaryItem = {
  publication_id: string;
  scope: string;
  work_id: string | null;
  source_event_id: string | null;
  target_surface: string;
  target_ref: string;
  status: string;
  preview_excerpt: string;
  created_by: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  latest_delivery_status: string | null;
  latest_delivery_id: string | null;
  latest_delivery_error: string | null;
  delivery_count: number;
  publish_eligibility: {
    dry_run: boolean;
    actual_publish: boolean;
    reason: string;
  };
  summary_reason: string;
};

type FailedDeliverySummaryItem = {
  delivery_id: string;
  publication_id: string;
  scope: string;
  target_surface: string;
  target_ref: string;
  status: string;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  acknowledged_at: string | null;
  publication_status: string | null;
  work_id: string | null;
  summary_reason: string;
};

type PublicationSummaryResponse = {
  scope: string;
  as_of: string;
  summary: {
    drafts: PublicationSummaryItem[];
    approved_previews: PublicationSummaryItem[];
    sent: PublicationSummaryItem[];
    failed: PublicationSummaryItem[];
    cancelled: PublicationSummaryItem[];
    delivery_status: {
      pending_count: number;
      sent_count: number;
      failed_count: number;
      acknowledged_count: number;
    };
    failed_deliveries: FailedDeliverySummaryItem[];
  };
  limits: {
    bounded_view: true;
    publication_limit: number;
    delivery_limit: number;
  };
  boundaries: string[];
};

type ApprovalGateStateItem = {
  approval_request_id: string;
  publication_id: string;
  work_id: string | null;
  target_surface: string;
  target_ref: string;
  status: string;
  requested_by: string;
  requested_at: string;
  decision_prompt: string;
  side_effect_summary: string;
  required_gate_checks: string[];
  authority_boundaries: string[];
  publication_status: string | null;
  publication_target_match: boolean;
  approval_decision_id: string | null;
  approved_by: string | null;
  approved_at: string | null;
  approval_decision_reason: string | null;
  latest_readiness_check_id: string | null;
  latest_readiness_status: string | null;
  latest_readiness_checked_at: string | null;
  latest_readiness_summary: string | null;
  latest_readiness_blocked_reasons: string[];
  latest_delivery_status: string | null;
  latest_delivery_id: string | null;
  latest_delivery_error: string | null;
  gate_state: string;
  gate_reasons: string[];
  safe_next_step: string;
  source_refs: {
    approval_request_id: string;
    publication_id: string;
    readiness_check_id: string | null;
    latest_delivery_id: string | null;
  };
};

type ApprovalGateStateSummaryResponse = {
  scope: string;
  as_of: string;
  summary: {
    requested: ApprovalGateStateItem[];
    blocked_or_not_ready: ApprovalGateStateItem[];
    ready_for_future_approval_review: ApprovalGateStateItem[];
    approved_for_future_publish_readiness: ApprovalGateStateItem[];
    dry_run_ready_for_future_publish: ApprovalGateStateItem[];
    dry_run_blocked: ApprovalGateStateItem[];
    stale_or_mismatched: ApprovalGateStateItem[];
    terminal_or_inactive: {
      superseded_count: number;
      cancelled_count: number;
      expired_count: number;
    };
  };
  counts: {
    requested_count: number;
    blocked_count: number;
    ready_for_review_count: number;
    approved_count: number;
    dry_run_ready_count: number;
    dry_run_blocked_count: number;
    superseded_count: number;
    cancelled_count: number;
    expired_count: number;
  };
  limits: {
    bounded_view: true;
    approval_request_limit: number;
    delivery_limit: number;
  };
  boundaries: string[];
};

type EvidencePackResponse = {
  scope: string;
  generated_at: string;
  evidence_pack_version: "v0.1";
  selection: {
    mode: string;
    work_id: string | null;
    publication_id: string | null;
    delivery_id: string | null;
    target_ref: string | null;
    selection_reason: string;
  };
  work_trace: {
    work_id: string | null;
    title: string | null;
    status: string | null;
    next_action: string | null;
    recent_events: WorkEvent[];
  };
  publication_trace: {
    publication_id: string | null;
    status: string | null;
    target_surface: string | null;
    target_ref: string | null;
    preview_excerpt: string | null;
    sent_at: string | null;
  };
  approval_trace: {
    approval_request_id: string | null;
    approval_request_status: string | null;
    approval_decision_id: string | null;
    approval_decision: string | null;
    decided_by: string | null;
    decided_at: string | null;
  };
  readiness_trace: {
    readiness_check_id: string | null;
    status: string | null;
    dry_run: boolean | null;
    blocked_reasons: string[];
    gate_checks: string[];
  };
  delivery_trace: {
    delivery_id: string | null;
    status: string | null;
    target_surface: string | null;
    target_ref: string | null;
    idempotency_key_present: boolean;
    sent_at: string | null;
    acknowledged_at: string | null;
    error_message: string | null;
    external_artifact_id: string | null;
    external_artifact_url: string | null;
    external_artifact_type: string | null;
  };
  replay_trace: {
    same_key_replay_supported: boolean;
    same_key_replay_observed: boolean | null;
    duplicate_block_observed: boolean | null;
    notes: string[];
  };
  verification_trace: {
    commands_run: Array<Record<string, unknown>>;
    checks_passed: Array<Record<string, unknown>>;
    skipped_checks: Array<Record<string, unknown>>;
    source_refs: string[];
  };
  authority_trace: {
    non_authority_statement: string;
    allowed_now: string[];
    blocked_now: string[];
  };
  temporal_preview_trace: {
    available: boolean;
    non_authority_boundary: string | null;
  };
  gaps: string[];
  next_suggested_goal: string | null;
};

type TemporalReviewArtifact = {
  artifact_id: string;
  scope: string;
  work_id: string;
  source_route: string;
  source_surface: string;
  source_ref: string | null;
  generator: string;
  model: string | null;
  as_of: string;
  capture_mode: string;
  preview_excerpt: string;
  bounded_preview_json: unknown;
  preview_hash: string | null;
  source_refs: string[];
  evidence_anchor_refs: string[];
  summary_refs: string[];
  counterexample_refs: string[];
  residual_tension_refs: string[];
  admission_decisions_json: unknown[];
  guardrail_passed: boolean;
  guardrail_warnings_json: unknown[];
  reviewer_verdict: string;
  reviewer_notes: string | null;
  manual_review_report_path: string | null;
  linked_evidence_record_ids: string[];
  linked_session_id: string | null;
  linked_pr_url: string | null;
  redaction_status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

type TemporalReviewArtifactsResponse = {
  runtime: "augnes";
  scope: string;
  generated_at: string;
  filters: {
    work_id: string;
    generator: string | null;
    reviewer_verdict: string | null;
    guardrail_passed: string | null;
    linked_session_id: string | null;
    linked_pr_url: string | null;
    limit: string | null;
  };
  count: number;
  artifacts: TemporalReviewArtifact[];
  gaps: string[];
  boundaries: string[];
};

type SessionTraceLatestMessage = {
  id: string;
  role: string;
  created_at: string;
};

type SessionTraceActionRecord = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  completed_at: string | null;
};

type SessionTraceLatestEvidenceRecord = {
  evidence_id: string;
  evidence_kind: string;
  status: string;
  label: string;
  created_at: string;
};

type SessionTraceSession = {
  session_id: string;
  surface: string | null;
  actor: string | null;
  title: string;
  summary: string | null;
  related_work_id: string | null;
  related_pr: string | null;
  handoff_ref: string | null;
  evidence_pack_ref: string | null;
  started_at: string;
  ended_at: string | null;
  evidence_counts: {
    messages: number;
    action_records_by_session: number;
    verification_evidence_records_for_work: number;
    verification_evidence_records_for_pr: number;
    verification_evidence_records_total: number;
  };
  work_event_counts: {
    total: number;
    by_event_type: Record<string, number>;
    with_related_action_id: number;
    with_related_pr: number;
  };
  latest_work_event: WorkEvent | null;
  latest_evidence_record: SessionTraceLatestEvidenceRecord | null;
  message_count: number;
  latest_message: SessionTraceLatestMessage | null;
  action_records: SessionTraceActionRecord[];
  work: WorkItem | null;
  gaps: string[];
};

type SessionTraceResponse = {
  runtime: "augnes";
  scope: string;
  generated_at: string;
  sessions: SessionTraceSession[];
  gaps: string[];
  boundaries: string[];
};

type ConsolidationResponse = {
  evaluated_count: number;
  ready_count: number;
  needs_review_count: number;
  reinforced_count: number;
  expired_count: number;
};

type Notice = {
  tone: "info" | "error";
  text: string;
};

type CopyTarget = "codex" | "actionTemplate";
type WorkCopyTarget = "workCodex" | "workEvent";
type CockpitTab = "overview" | "work" | "perspective" | "bridge" | "operator";

type AgResumeTargetPreviewPanelResult = {
  httpStatus: number;
  body: AgResumeTargetPreviewRouteResponse;
};

type AgResumeTargetPreviewRouteResponse = {
  ok?: boolean;
  route?: string;
  strict?: boolean;
  preflight?: AgResumeTargetPreviewPreflight | null;
  preview?: AgResumeTargetPreview | null;
  recommended_next_step?: string;
  error?: string;
};

type AgResumeTargetPreviewPreflight = {
  ran?: boolean;
  ok?: boolean | null;
  strict?: boolean;
  status?: string;
  warnings?: string[];
  failures?: string[];
};

type AgResumeTargetPreview = {
  ok_to_continue?: boolean;
  status?: string;
  packet_summary?: {
    foreign_refs?: AgResumeTargetForeignRefs | null;
  };
  gaps?: AgResumeTargetFinding[];
  conflicts?: AgResumeTargetConflict[];
  warnings?: AgResumeTargetFinding[];
  recommendations?: AgResumeTargetRecommendation[];
  authority_boundary?: {
    read_only?: string;
    boundaries?: string[];
    durable_approval?: string;
  } | null;
};

type AgResumeTargetForeignRefs = {
  foreign_action_ref_ids?: string[];
  foreign_evidence_refs?: string[];
  foreign_session_refs?: string[];
  foreign_evidence_pack_ref?: string | null;
  local_proof_records_created?: boolean;
  local_evidence_records_created?: boolean;
  local_sessions_bound?: boolean;
  note?: string;
};

type AgResumeTargetFinding = {
  id?: string;
  severity?: string;
  title?: string;
  detail?: string;
  fields?: string[];
  refs?: string[];
};

type AgResumeTargetConflict = AgResumeTargetFinding & {
  differences?: {
    field?: string;
    packet_value?: string | null;
    local_value?: string | null;
  }[];
};

type AgResumeTargetRecommendation = {
  id?: string;
  text?: string;
};

type AgResumeMappingProposalPanelResult = {
  httpStatus: number;
  body: AgResumeMappingProposalRouteResponse;
};

type AgResumeMappingProposalRouteResponse = {
  ok?: boolean;
  route?: string;
  strict?: boolean;
  preview?: AgResumeMappingProposalPreview | null;
  recommended_next_step?: string;
  error?: string;
};

type AgResumeMappingProposalPreview = {
  status?: string;
  ok_for_user_core_review?: boolean;
  packet_summary?: {
    packet_id?: string;
    packet_foreign_work?: AgResumeMappingProposalWorkSummary | null;
    git?: {
      remote?: string;
      base_branch?: string;
      base_commit?: string;
      working_branch?: string;
      head_commit?: string;
      related_pr?: string | null;
    } | null;
    expected_files?: string[];
    expected_checks?: string[];
    preflight_assumption?: string;
  } | null;
  candidate_summaries?: AgResumeMappingProposalCandidateSummary[];
  selected_candidate_summary?: AgResumeMappingProposalCandidateSummary | null;
  comparison?: {
    match_confidence_label?: string;
    advisory_only?: boolean;
    fields?: AgResumeMappingProposalDifference[];
    related_state_keys_overlap?: string[];
    repo?: {
      remote_matches?: string;
      base_commit_reachable?: string;
      dirty_worktree?: string;
      expected_files?: string;
    } | null;
  } | null;
  gaps?: AgResumeMappingProposalFinding[];
  conflicts?: AgResumeMappingProposalFinding[];
  questions?: AgResumeMappingProposalQuestion[];
  recommendations?: AgResumeTargetRecommendation[];
  foreign_refs_summary?: AgResumeTargetForeignRefs | null;
  authority_boundary?: {
    read_only?: boolean;
    proposal_only?: boolean;
    creates_mapping_record?: boolean;
    creates_import_record?: boolean;
    creates_work_item?: boolean;
    records_proof?: boolean;
    records_evidence?: boolean;
    binds_session?: boolean;
    executes_codex?: boolean;
    approval_authority?: boolean;
    publish_retry_replay_authority?: boolean;
    merge_authority?: boolean;
    state_mutation?: boolean;
    durable_approval?: string;
    statement?: string;
  } | null;
  next_step?: string;
};

type AgResumeMappingProposalWorkSummary = {
  scope?: string;
  work_id?: string;
  title?: string;
  status?: string;
  priority?: string | null;
  summary?: string | null;
  next_action?: string;
  related_state_keys?: string[];
};

type AgResumeMappingProposalCandidateSummary = AgResumeMappingProposalWorkSummary & {
  candidate_id?: string;
  local_scope?: string;
  local_work_id?: string;
  source?: string;
  work_brief_available?: boolean;
  codex_read_brief_available?: boolean;
  repo_match?: {
    remote_matches?: boolean | null;
    base_commit_reachable?: boolean | null;
    expected_files_present?: string[];
    expected_files_missing?: string[];
    dirty_worktree?: boolean | null;
  };
};

type AgResumeMappingProposalDifference = {
  field?: string;
  packet_value?: string | string[] | boolean | null;
  candidate_value?: string | string[] | boolean | null;
  label?: string;
};

type AgResumeMappingProposalFinding = AgResumeTargetFinding & {
  differences?: AgResumeMappingProposalDifference[];
};

type AgResumeMappingProposalQuestion = {
  id?: string;
  text?: string;
};

type AgResumeMappingProposalRecordReadPanelResult = {
  httpStatus: number;
  body: AgResumeMappingProposalRecordReadRouteResponse;
};

type AgResumeMappingProposalLifecycleActionPanelResult = {
  httpStatus: number;
  requestBody: AgResumeMappingProposalLifecycleActionRequestBody;
  body: AgResumeMappingProposalLifecycleActionRouteResponse;
};

type AgResumeMappingProposalLifecycleActionRequestBody = {
  proposal_id: string;
  action: AgResumeMappingProposalLifecycleAction;
  reviewed_by: string;
  review_note: string;
  reviewed_at?: string;
  replacement_proposal_id?: string;
};

type AgResumeMappingProposalLifecycleAction =
  | "withdraw"
  | "reject"
  | "supersede"
  | "expire";

type AgResumeMappingProposalLifecycleActionRouteResponse = {
  ok?: boolean;
  route?: string;
  result?: AgResumeMappingProposalLifecycleActionResult | null;
  authority_boundary?: AgResumeMappingProposalLifecycleActionAuthorityBoundary | null;
  recommended_next_step?: string;
  error?: string;
};

type AgResumeMappingProposalLifecycleActionResult = {
  ok?: boolean;
  status?: string;
  action?: AgResumeMappingProposalLifecycleAction | null;
  proposal_id?: string | null;
  before_record?: AgResumeMappingProposalRecord | null;
  record?: AgResumeMappingProposalRecord | null;
  updated_fields?: string[];
  warnings?: string[];
  failures?: string[];
  authority_boundary?: AgResumeMappingProposalLifecycleActionAuthorityBoundary | null;
  recommended_next_step?: string;
};

type AgResumeMappingProposalLifecycleActionAuthorityBoundary = {
  proposal_lifecycle_updated?: boolean;
  proposal_review_metadata_only?: boolean;
  proposal_record_created?: boolean;
  proposal_record_deleted?: boolean;
  confirmed_mapping_created?: boolean;
  import_record_created?: boolean;
  imported_context_created?: boolean;
  work_item_created?: boolean;
  work_event_created?: boolean;
  proof_recorded?: boolean;
  evidence_recorded?: boolean;
  session_bound?: boolean;
  codex_executed?: boolean;
  approval_granted?: boolean;
  publish_retry_replay_authority?: boolean;
  merge_authority?: boolean;
  durable_approval?: string;
  statement?: string;
};

type AgResumeMappingProposalRecordReadRouteResponse = {
  ok?: boolean;
  route?: string;
  result?: AgResumeMappingProposalRecordReadResult | null;
  recommended_next_step?: string;
  error?: string;
};

type AgResumeMappingProposalRecordReadResult = {
  ok?: boolean;
  status?: string;
  record?: AgResumeMappingProposalRecord | null;
  records?: AgResumeMappingProposalRecord[];
  filters?: {
    proposal_id?: string | null;
    foreign_scope?: string | null;
    foreign_work_id?: string | null;
    candidate_local_scope?: string | null;
    candidate_local_work_id?: string | null;
    status?: string | null;
  };
  limit?: number | null;
  warnings?: string[];
  failures?: string[];
  authority_boundary?: AgResumeMappingProposalRecordReadAuthorityBoundary | null;
  recommended_next_step?: string;
};

type AgResumeMappingProposalRecord = {
  proposal_id?: string;
  record_kind?: string;
  schema?: string;
  status?: string;
  foreign_scope?: string;
  foreign_work_id?: string;
  foreign_title?: string;
  foreign_status?: string | null;
  foreign_next_action?: string | null;
  candidate_local_scope?: string;
  candidate_local_work_id?: string;
  candidate_title?: string;
  candidate_status?: string | null;
  candidate_next_action?: string | null;
  packet_id?: string;
  packet_hash?: string;
  source_runtime_instance_id?: string | null;
  source_packet_created_at?: string | null;
  proposal_preview_id?: string;
  proposal_preview_hash?: string;
  match_confidence_label?: string | null;
  comparison_summary?: unknown[];
  gaps_summary?: unknown[];
  conflicts_summary?: unknown[];
  questions_summary?: unknown[];
  foreign_refs_summary?: Record<string, unknown>;
  repo_context_summary?: Record<string, unknown>;
  redaction_summary?: Record<string, unknown>;
  proposed_by?: string;
  proposed_at?: string;
  proposal_reason?: string;
  expires_at?: string | null;
  supersedes_proposal_id?: string | null;
  superseded_by_proposal_id?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  authority_boundary?: AgResumeMappingProposalRecordAuthorityBoundary | null;
  created_at?: string;
  updated_at?: string;
};

type AgResumeMappingProposalRecordAuthorityBoundary = {
  proposal_record_created?: boolean;
  confirmed_mapping_created?: boolean;
  import_record_created?: boolean;
  work_item_created?: boolean;
  work_event_created?: boolean;
  proof_recorded?: boolean;
  evidence_recorded?: boolean;
  session_bound?: boolean;
  codex_executed?: boolean;
  approval_granted?: boolean;
  publish_retry_replay_authority?: boolean;
  merge_authority?: boolean;
  durable_approval?: string;
  statement?: string;
};

type AgResumeMappingProposalRecordReadAuthorityBoundary = {
  read_only?: boolean;
  proposal_review_metadata_only?: boolean;
  proposal_record_created?: boolean;
  proposal_record_updated?: boolean;
  proposal_record_deleted?: boolean;
  confirmed_mapping_created?: boolean;
  import_record_created?: boolean;
  work_item_created?: boolean;
  work_event_created?: boolean;
  proof_recorded?: boolean;
  evidence_recorded?: boolean;
  session_bound?: boolean;
  codex_executed?: boolean;
  approval_granted?: boolean;
  publish_retry_replay_authority?: boolean;
  merge_authority?: boolean;
  durable_approval?: string;
  statement?: string;
};

const SAFE_AG_RESUME_EXAMPLE_PACKET = {
  schema: "augnes.ag_work_resume_packet.v0_2",
  packet_kind: "ag_work_resume_packet",
  packet_id: "ag-resume-packet:fixture-target-preview-001",
  created_at: "2026-05-30T00:00:00.000Z",
  expires_at: null,
  issuer: {
    runtime: "augnes",
    runtime_instance_id: "runtime:fixture-target-preview",
    source_local_label: "Local A safe fixture",
    created_by_surface: "cockpit-panel-fixture",
    export_event_id: null,
  },
  integrity: {
    canonicalization: "augnes-json-c14n-v0_1",
    payload_hash: "sha256:fixture-target-preview-payload",
    redaction_report_hash: "sha256:fixture-target-preview-redaction",
    signature: null,
  },
  source_work: {
    scope: "project:augnes",
    work_id: "AG-FIXTURE-TARGET-PREVIEW-001",
    title: "Safe target preview fixture",
    status: "in_progress",
    priority: "now",
    summary: "Synthetic public-safe packet for read-only panel verification.",
    next_action: "Review the read-only target preview result.",
    related_state_keys: ["coordination.ag_resume_packet"],
  },
  git: {
    remote: "https://github.com/hynk-studio/augnes.git",
    base_branch: "main",
    base_commit: "0f7038af9bcd4ca0d7a6f190b5772fa88c764b40",
    working_branch: "codex/ag-resume-target-preview-cockpit-fixtures",
    head_commit: "0f7038af9bcd4ca0d7a6f190b5772fa88c764b40",
    related_pr: null,
    dirty_worktree: false,
  },
  handoff: {
    handoff_id: "handoff:fixture-target-preview",
    status: "ready_for_review",
    expected_files: [
      "components/augnes-cockpit.tsx",
      "docs/AG_WORK_RESUME_TARGET_PREVIEW_COCKPIT_PANEL_V0_1.md",
      "scripts/smoke-ag-work-resume-target-preview-cockpit-panel.mjs",
    ],
    expected_checks: ["npm run smoke:ag-work-resume-target-preview-cockpit-panel"],
    expected_execution_surfaces: ["Codex CLI after user/Core review"],
    forbidden_surfaces: ["ChatGPT execution", "MCP write bridge", "external posting"],
    stop_conditions: [
      "Local mapping is missing",
      "Target preview reports conflict or blocked",
    ],
    safety_boundaries: [
      "Read-only target preview",
      "Foreign refs remain foreign",
    ],
  },
  continuity: {
    recent_work_events: [
      {
        id: "work-event:fixture-target-preview-1",
        actor: "codex",
        event_type: "verification",
        summary: "Synthetic public-safe browser fixture.",
        result_status: "completed",
        result_kind: "browser_verification",
        related_pr: null,
        related_state_keys: ["coordination.ag_resume_packet"],
        created_at: "2026-05-30T00:01:00.000Z",
      },
    ],
    foreign_action_refs: [
      {
        id: "action:foreign-fixture-target-preview-1",
        title: "Foreign proof-only fixture reference",
        status: "completed",
        proof_marker_type: "proof_only",
        created_at: "2026-05-30T00:01:00.000Z",
        ref_kind: "foreign_action_ref",
      },
    ],
    foreign_evidence_refs: ["evidence:foreign-fixture-target-preview-1"],
    foreign_session_refs: ["session:foreign-fixture-target-preview-1"],
    foreign_evidence_pack_ref: "evidence-pack:foreign-fixture-target-preview-1",
    proof_marker_note: "state_key:null action records are proof-only",
  },
  target_runtime_policy: {
    preview_only_by_default: true,
    may_map_to_existing_local_work_item:
      "requires explicit user/Core approval",
    may_create_local_work_item: false,
    may_record_evidence:
      "requires explicit user/Core approval and known local work_id",
    may_record_proof:
      "requires explicit user/Core approval and known local work_id",
    may_bind_session: false,
    may_commit_or_reject_state: false,
    may_execute_codex: false,
    may_merge: false,
    may_publish_or_replay: false,
  },
  redaction: {
    raw_db_paths_included: false,
    secrets_included: false,
    tunnel_urls_included: false,
    local_absolute_paths_included: false,
    screenshots_or_media_included: false,
    raw_openai_responses_included: false,
    notes: [],
  },
  bounds: {
    max_recent_work_events: 10,
    max_foreign_evidence_refs: 20,
    summaries_only: true,
    raw_logs_included: false,
  },
} as const;

const SAFE_AG_RESUME_MALFORMED_PACKET_JSON =
  `{ "schema": "augnes.ag_work_resume_packet.v0_2", "packet_id": `;

const SAFE_AG_RESUME_MALFORMED_LOCAL_CONTEXT_JSON =
  `{ "runtime": { "runtime_available": true, `;

const SAFE_AG_RESUME_PREFLIGHT_FAILING_PACKET = {
  ...SAFE_AG_RESUME_EXAMPLE_PACKET,
  packet_id: "ag-resume-packet:fixture-preflight-fail-001",
  source_work: {
    ...SAFE_AG_RESUME_EXAMPLE_PACKET.source_work,
    work_id: "AG-FIXTURE-PREFLIGHT-FAIL-001",
    title: "Safe preflight-failing packet fixture",
    summary:
      "Synthetic public-safe packet that fails strict preflight by policy.",
  },
  target_runtime_policy: {
    ...SAFE_AG_RESUME_EXAMPLE_PACKET.target_runtime_policy,
    may_execute_codex: true,
  },
} as const;

const SAFE_AG_RESUME_EXAMPLE_LOCAL_CONTEXT = {
  runtime: {
    runtime_available: true,
    scope: "project:augnes",
    work_item: {
      work_id: "LOCAL-FIXTURE-TARGET-PREVIEW-001",
      scope: "project:augnes",
      title: "Local target preview fixture",
      status: "in_progress",
      next_action: "Review the read-only target preview result.",
      related_state_keys: ["coordination.ag_resume_packet"],
    },
    work_brief_available: true,
    codex_read_brief_command_available: true,
    evidence_recording_authorized: false,
    proof_recording_authorized: false,
    session_binding_authorized: false,
  },
  repo: {
    repo_available: true,
    remote: "https://github.com/hynk-studio/augnes.git",
    base_branch: "main",
    base_commit_reachable: true,
    current_branch: "codex/ag-resume-target-preview-cockpit-fixtures",
    head_commit: "0f7038af9bcd4ca0d7a6f190b5772fa88c764b40",
    dirty_worktree: false,
    expected_files_present: SAFE_AG_RESUME_EXAMPLE_PACKET.handoff.expected_files,
    expected_files_missing: [],
  },
  known_local_work_mappings: [
    {
      foreign_scope: "project:augnes",
      foreign_work_id: "AG-FIXTURE-TARGET-PREVIEW-001",
      local_scope: "project:augnes",
      local_work_id: "LOCAL-FIXTURE-TARGET-PREVIEW-001",
      mapping_status: "confirmed",
      confirmed_by: "user/Core safe fixture",
    },
  ],
} as const;

const SAFE_AG_RESUME_MAPPING_EXAMPLE_PACKET = {
  schema: "augnes.ag_work_resume_packet.v0_2",
  packet_kind: "ag_work_resume_packet",
  packet_id: "ag-resume-packet:fixture-mapping-proposal-001",
  created_at: "2026-05-31T00:00:00.000Z",
  expires_at: null,
  issuer: {
    runtime: "augnes",
    runtime_instance_id: "runtime:fixture-mapping-proposal",
    source_local_label: "Local A mapping proposal fixture",
    created_by_surface: "cockpit-panel-fixture",
    export_event_id: null,
  },
  integrity: {
    canonicalization: "augnes-json-c14n-v0_1",
    payload_hash: "sha256:fixture-mapping-proposal-payload",
    redaction_report_hash: "sha256:fixture-mapping-proposal-redaction",
    signature: null,
  },
  source_work: {
    scope: "project:augnes",
    work_id: "AG-FIXTURE-MAPPING-PROPOSAL-001",
    title: "Safe mapping proposal fixture",
    status: "in_progress",
    priority: "now",
    summary:
      "Synthetic public-safe packet for read-only mapping proposal review.",
    next_action: "Review the read-only mapping proposal preview result.",
    related_state_keys: ["coordination.ag_resume_mapping"],
  },
  git: {
    remote: "https://github.com/hynk-studio/augnes.git",
    base_branch: "main",
    base_commit: "ad55e01234567890ad55e01234567890ad55e012",
    working_branch: "codex/ag-resume-mapping-proposal-cockpit-panel",
    head_commit: "ad55e01234567890ad55e01234567890ad55e012",
    related_pr: null,
    dirty_worktree: false,
  },
  handoff: {
    handoff_id: "handoff:fixture-mapping-proposal",
    status: "ready_for_review",
    expected_files: [
      "components/augnes-cockpit.tsx",
      "docs/AG_WORK_RESUME_MAPPING_PROPOSAL_PREVIEW_COCKPIT_PANEL_V0_1.md",
      "scripts/smoke-ag-work-resume-mapping-proposal-preview-cockpit-panel.mjs",
    ],
    expected_checks: [
      "npm run smoke:ag-work-resume-mapping-proposal-preview-cockpit-panel",
    ],
    expected_execution_surfaces: ["Codex CLI after user/Core review"],
    forbidden_surfaces: [
      "ChatGPT execution",
      "MCP write bridge",
      "external posting",
    ],
    stop_conditions: [
      "Mapping confirmation is requested",
      "Mapping proposal preview reports conflict or blocked",
    ],
    safety_boundaries: [
      "Read-only mapping proposal preview",
      "Proposal-only review metadata",
      "Foreign refs remain foreign",
    ],
  },
  continuity: {
    recent_work_events: [
      {
        id: "work-event:fixture-mapping-proposal-1",
        actor: "codex",
        event_type: "verification",
        summary: "Synthetic public-safe mapping proposal fixture.",
        result_status: "completed",
        result_kind: "browser_verification",
        related_pr: null,
        related_state_keys: ["coordination.ag_resume_mapping"],
        created_at: "2026-05-31T00:01:00.000Z",
      },
    ],
    foreign_action_refs: [
      {
        id: "action:foreign-fixture-mapping-proposal-1",
        title: "Foreign proof-only mapping fixture reference",
        status: "completed",
        proof_marker_type: "proof_only",
        created_at: "2026-05-31T00:01:00.000Z",
        ref_kind: "foreign_action_ref",
      },
    ],
    foreign_evidence_refs: ["evidence:foreign-fixture-mapping-proposal-1"],
    foreign_session_refs: ["session:foreign-fixture-mapping-proposal-1"],
    foreign_evidence_pack_ref: "evidence-pack:foreign-fixture-mapping-proposal-1",
    proof_marker_note: "state_key:null action records are proof-only",
  },
  target_runtime_policy: {
    preview_only_by_default: true,
    may_map_to_existing_local_work_item:
      "requires explicit user/Core approval",
    may_create_local_work_item: false,
    may_record_evidence:
      "requires explicit user/Core approval and known local work_id",
    may_record_proof:
      "requires explicit user/Core approval and known local work_id",
    may_bind_session: false,
    may_commit_or_reject_state: false,
    may_execute_codex: false,
    may_merge: false,
    may_publish_or_replay: false,
  },
  redaction: {
    raw_db_paths_included: false,
    secrets_included: false,
    tunnel_urls_included: false,
    local_absolute_paths_included: false,
    screenshots_or_media_included: false,
    raw_openai_responses_included: false,
    notes: [],
  },
  bounds: {
    max_recent_work_events: 10,
    max_foreign_evidence_refs: 20,
    summaries_only: true,
    raw_logs_included: false,
  },
} as const;

const SAFE_AG_RESUME_MAPPING_EXAMPLE_CANDIDATES = [
  {
    candidate_id: "local-candidate-mapping-safe-1",
    local_scope: "project:augnes",
    local_work_id: "AG-FIXTURE-MAPPING-PROPOSAL-001",
    title: "Safe mapping proposal fixture",
    status: "in_progress",
    next_action: "Review the read-only mapping proposal preview result.",
    related_state_keys: ["coordination.ag_resume_mapping"],
    summary: "Synthetic public-safe Local B candidate for read-only review.",
    priority: "now",
    source: "fixture",
    work_brief_available: true,
    codex_read_brief_available: true,
    repo_match: {
      remote_matches: true,
      base_commit_reachable: true,
      expected_files_present:
        SAFE_AG_RESUME_MAPPING_EXAMPLE_PACKET.handoff.expected_files,
      expected_files_missing: [],
      dirty_worktree: false,
    },
  },
] as const;

const SAFE_AG_RESUME_MAPPING_CONFLICTING_CANDIDATES = [
  {
    ...SAFE_AG_RESUME_MAPPING_EXAMPLE_CANDIDATES[0],
    candidate_id: "local-candidate-mapping-conflict-1",
    local_work_id: "AG-FIXTURE-MAPPING-CONFLICT-001",
    title: "Conflicting local mapping fixture",
    status: "blocked",
    next_action: "Resolve a different local task before mapping review.",
    repo_match: {
      ...SAFE_AG_RESUME_MAPPING_EXAMPLE_CANDIDATES[0].repo_match,
      remote_matches: false,
    },
  },
] as const;

const SAFE_AG_RESUME_MAPPING_PREFLIGHT_FAILING_PACKET = {
  ...SAFE_AG_RESUME_MAPPING_EXAMPLE_PACKET,
  packet_id: "ag-resume-packet:fixture-mapping-policy-blocked-001",
  source_work: {
    ...SAFE_AG_RESUME_MAPPING_EXAMPLE_PACKET.source_work,
    work_id: "AG-FIXTURE-MAPPING-POLICY-BLOCKED-001",
    title: "Safe mapping proposal blocked policy fixture",
    summary:
      "Synthetic public-safe packet that fails mapping preview through target policy.",
  },
  target_runtime_policy: {
    ...SAFE_AG_RESUME_MAPPING_EXAMPLE_PACKET.target_runtime_policy,
    may_execute_codex: true,
  },
} as const;

const SAFE_AG_RESUME_MAPPING_PROPOSAL_RECORD_REVIEW_FIXTURE = {
  proposal_id: "ag-resume-mapping-proposal:fixture-cockpit-read-001",
  foreign_scope: "project:augnes",
  foreign_work_id: "AG-FIXTURE-MAPPING-PROPOSAL-001",
  candidate_local_scope: "project:augnes",
  candidate_local_work_id: "AG-FIXTURE-MAPPING-PROPOSAL-001",
  status: "proposed",
  limit: "20",
} as const;

const SAFE_AG_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_FIXTURE = {
  proposal_ids: {
    withdraw: "ag-resume-mapping-proposal:14dbaabfa7e8585b16181284",
    reject: "ag-resume-mapping-proposal:0cd4f4bf115f41014c5d8491",
    expire: "ag-resume-mapping-proposal:a6c8a67d51a1426f135947d8",
    supersede: "ag-resume-mapping-proposal:94ac2e457834768783757a54",
  },
  replacement_proposal_id:
    "ag-resume-mapping-proposal:c7188476bb0f24138b263d32",
  reviewed_by: "user-core:cockpit-lifecycle-fixture",
  review_note: "Synthetic Cockpit lifecycle review metadata fixture.",
  reviewed_at: "2026-05-31T04:00:00.000Z",
} as const;

// Tab order: Overview -> Work -> Perspective -> Bridge -> Operator
const COCKPIT_TABS: { id: CockpitTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "work", label: "Work" },
  { id: "perspective", label: "Perspective" },
  { id: "bridge", label: "Bridge" },
  { id: "operator", label: "Operator" },
];

type GraphNode = StateTransition & {
  eventIndex: number;
  hasOpenTension: boolean;
  tone: string;
};

export function AugnesCockpit() {
  const [activeTab, setActiveTab] = useState<CockpitTab>("overview");
  const [message, setMessage] = useState(CANONICAL_MESSAGE);
  const [snapshot, setSnapshot] = useState<SnapshotResponse | null>(null);
  const [perspectiveSnapshot, setPerspectiveSnapshot] =
    useState<PerspectiveSnapshot | null>(null);
  const [perspectiveSnapshotError, setPerspectiveSnapshotError] =
    useState<string | null>(null);
  const [trajectory, setTrajectory] = useState<TrajectoryResponse | null>(null);
  const [proposals, setProposals] = useState<StateDeltaProposal[]>([]);
  const [brief, setBrief] = useState<StateBriefResponse | null>(null);
  const [briefError, setBriefError] = useState<string | null>(null);
  const [workItems, setWorkItems] = useState<WorkItem[]>([]);
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [workBrief, setWorkBrief] = useState<WorkBriefResponse | null>(null);
  const [workError, setWorkError] = useState<string | null>(null);
  const [coordinationEvents, setCoordinationEvents] = useState<
    CoordinationEvent[]
  >([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [eventError, setEventError] = useState<string | null>(null);
  const [mailboxSummary, setMailboxSummary] =
    useState<MailboxSummaryResponse | null>(null);
  const [mailboxError, setMailboxError] = useState<string | null>(null);
  const [publicationSummary, setPublicationSummary] =
    useState<PublicationSummaryResponse | null>(null);
  const [publicationError, setPublicationError] = useState<string | null>(null);
  const [approvalGateState, setApprovalGateState] =
    useState<ApprovalGateStateSummaryResponse | null>(null);
  const [approvalGateError, setApprovalGateError] = useState<string | null>(null);
  const [sessionTrace, setSessionTrace] = useState<SessionTraceResponse | null>(
    null,
  );
  const [sessionTraceError, setSessionTraceError] = useState<string | null>(null);
  const [sessionTraceBusy, setSessionTraceBusy] = useState(false);
  const [sessionTraceRequested, setSessionTraceRequested] = useState(false);
  const [temporalPreview, setTemporalPreview] =
    useState<CockpitTemporalPreviewResponse | null>(null);
  const [temporalPreviewError, setTemporalPreviewError] = useState<string | null>(
    null,
  );
  const [temporalPreviewBusy, setTemporalPreviewBusy] = useState(false);
  const [temporalPreviewRequested, setTemporalPreviewRequested] = useState(false);
  const [temporalReviewArtifacts, setTemporalReviewArtifacts] =
    useState<TemporalReviewArtifactsResponse | null>(null);
  const [temporalReviewArtifactsError, setTemporalReviewArtifactsError] =
    useState<string | null>(null);
  const [temporalReviewArtifactsBusy, setTemporalReviewArtifactsBusy] =
    useState(false);
  const [temporalReviewArtifactsRequested, setTemporalReviewArtifactsRequested] =
    useState(false);
  const [
    selectedTemporalReviewArtifactId,
    setSelectedTemporalReviewArtifactId,
  ] = useState<string | null>(null);
  const [evidencePack, setEvidencePack] = useState<EvidencePackResponse | null>(
    null,
  );
  const [evidencePackError, setEvidencePackError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    void refreshRuntime();
  }, []);

  useEffect(() => {
    if (!selectedWorkId) {
      setWorkBrief(null);
      return;
    }

    void refreshWorkBrief(selectedWorkId);
  }, [selectedWorkId]);

  const trajectoryCount = useMemo(() => {
    if (!trajectory) {
      return 0;
    }

    return Object.values(trajectory.trajectories).reduce(
      (count, events) => count + events.length,
      0,
    );
  }, [trajectory]);

  const selectedTransition = useMemo(() => {
    const transitions = getOrderedTransitions(trajectory);

    return (
      transitions.find((transition) => transition.id === selectedTransitionId) ??
      transitions[transitions.length - 1] ??
      null
    );
  }, [selectedTransitionId, trajectory]);

  const selectedWorkItem = useMemo(
    () =>
      workBrief?.work ??
      workItems.find((item) => item.work_id === selectedWorkId) ??
      null,
    [selectedWorkId, workBrief, workItems],
  );

  const workCounts = useMemo(() => {
    const inProgress = workItems.filter((item) =>
      ["in_progress", "active", "execution"].includes(item.status),
    ).length;
    const needsDecision = workItems.filter(
      (item) =>
        item.user_attention_required ||
        ["needs_decision", "needs_review", "blocked"].includes(item.status),
    ).length;
    const completed = workItems.filter((item) =>
      ["completed", "complete", "done"].includes(item.status),
    ).length;

    return {
      total: workItems.length,
      inProgress,
      needsDecision,
      completed,
    };
  }, [workItems]);

  const ledgerCounts = useMemo(() => {
    const stateKeyCount = trajectory
      ? Object.keys(trajectory.trajectories).length
      : new Set(
          [
            ...(snapshot?.active_state ?? []),
            ...(snapshot?.future_state ?? []),
            ...(snapshot?.completed_state ?? []),
            ...(snapshot?.deprecated_state ?? []),
          ].map((entry) => entry.state_key),
        ).size;

    return {
      transitions: trajectoryCount,
      stateKeys: stateKeyCount,
      active: snapshot?.active_state.length ?? 0,
      future: snapshot?.future_state.length ?? 0,
      completed: snapshot?.completed_state.length ?? 0,
      deprecated: snapshot?.deprecated_state.length ?? 0,
    };
  }, [snapshot, trajectory, trajectoryCount]);

  const mailboxReviewCount = mailboxSummary
    ? mailboxSummary.summary.pending_handoffs.length +
      mailboxSummary.summary.needs_review.length +
      mailboxSummary.summary.approval_needed.length +
      mailboxSummary.summary.blocked_or_partial.length
    : 0;

  const selectedCoordinationEvent = useMemo(
    () =>
      coordinationEvents.find((event) => event.event_id === selectedEventId) ??
      coordinationEvents[0] ??
      null,
    [coordinationEvents, selectedEventId],
  );

  const selectedTemporalReviewArtifact = useMemo(
    () =>
      temporalReviewArtifacts?.artifacts.find(
        (artifact) => artifact.artifact_id === selectedTemporalReviewArtifactId,
      ) ??
      temporalReviewArtifacts?.artifacts[0] ??
      null,
    [selectedTemporalReviewArtifactId, temporalReviewArtifacts],
  );

  async function refreshRuntime() {
    setBriefError(null);
    setWorkError(null);
    setEventError(null);
    setMailboxError(null);
    setPublicationError(null);
    setApprovalGateError(null);
    setEvidencePackError(null);
    setTemporalReviewArtifactsError(null);
    setPerspectiveSnapshotError(null);

    const perspectiveSnapshotRequest = fetchJson<PerspectiveSnapshot>(
      `/api/perspective/snapshot?scope=${SCOPE}`,
      { method: "GET" },
    )
      .then((value) => ({ value }))
      .catch((error: unknown) => ({
        error:
          error instanceof Error
            ? error.message
            : "PerspectiveSnapshot request failed",
      }));
    const briefRequest = fetchJson<StateBriefResponse>(
      `/api/state/brief?scope=${SCOPE}`,
    )
      .then((value) => ({ value }))
      .catch((error: unknown) => ({
        error:
          error instanceof Error ? error.message : "State brief request failed",
      }));
    const workRequest = fetchJson<WorkListResponse>(`/api/work?scope=${SCOPE}`)
      .then((value) => ({ value }))
      .catch((error: unknown) => ({
        error:
          error instanceof Error ? error.message : "Work list request failed",
      }));
    const eventsRequest = fetchJson<CoordinationEventsResponse>(
      `/api/events?scope=${SCOPE}`,
    )
      .then((value) => ({ value }))
      .catch((error: unknown) => ({
        error:
          error instanceof Error ? error.message : "Event spine request failed",
      }));
    const mailboxRequest = fetchJson<MailboxSummaryResponse>(
      `/api/mailbox/summary?scope=${SCOPE}`,
    )
      .then((value) => ({ value }))
      .catch((error: unknown) => ({
        error:
          error instanceof Error ? error.message : "Mailbox summary request failed",
      }));
    const publicationRequest = fetchJson<PublicationSummaryResponse>(
      `/api/publications/summary?scope=${SCOPE}`,
    )
      .then((value) => ({ value }))
      .catch((error: unknown) => ({
        error:
          error instanceof Error
            ? error.message
            : "Publication summary request failed",
      }));
    const approvalGateRequest = fetchJson<ApprovalGateStateSummaryResponse>(
      `/api/approval-gate-state/summary?scope=${SCOPE}`,
    )
      .then((value) => ({ value }))
      .catch((error: unknown) => ({
        error:
          error instanceof Error
            ? error.message
            : "Approval gate-state request failed",
      }));
    const [
      snapshotResult,
      trajectoryResult,
      proposalResult,
      briefResult,
      workResult,
      eventsResult,
      mailboxResult,
      publicationResult,
      approvalGateResult,
      perspectiveSnapshotResult,
    ] =
      await Promise.all([
        fetchJson<SnapshotResponse>(`/api/state/snapshot?scope=${SCOPE}`),
        fetchJson<TrajectoryResponse>(`/api/state/trajectory?scope=${SCOPE}`),
        fetchJson<ProposalResponse>(
          `/api/proposals?scope=${SCOPE}&status=pending&include_expired=true`,
        ),
        briefRequest,
        workRequest,
        eventsRequest,
        mailboxRequest,
        publicationRequest,
        approvalGateRequest,
        perspectiveSnapshotRequest,
      ]);

    setSnapshot(snapshotResult);
    setTrajectory(trajectoryResult);
    setProposals(proposalResult.proposals);

    if ("value" in briefResult) {
      setBrief(briefResult.value);
    } else {
      setBrief(null);
      setBriefError(briefResult.error);
    }

    if ("value" in workResult) {
      setWorkItems(workResult.value.work_items);
      setSelectedWorkId((current) => {
        if (
          current &&
          workResult.value.work_items.some((item) => item.work_id === current)
        ) {
          return current;
        }

        return (
          workResult.value.work_items.find((item) => item.work_id === "AG-001")
            ?.work_id ??
          workResult.value.work_items[0]?.work_id ??
          null
        );
      });
    } else {
      setWorkItems([]);
      setWorkBrief(null);
      setWorkError(workResult.error);
    }

    if ("value" in eventsResult) {
      setCoordinationEvents(eventsResult.value.events);
      setSelectedEventId((current) => {
        if (
          current &&
          eventsResult.value.events.some((event) => event.event_id === current)
        ) {
          return current;
        }

        return eventsResult.value.events[0]?.event_id ?? null;
      });
    } else {
      setCoordinationEvents([]);
      setSelectedEventId(null);
      setEventError(eventsResult.error);
    }

    if ("value" in mailboxResult) {
      setMailboxSummary(mailboxResult.value);
    } else {
      setMailboxSummary(null);
      setMailboxError(mailboxResult.error);
    }

    if ("value" in publicationResult) {
      setPublicationSummary(publicationResult.value);
    } else {
      setPublicationSummary(null);
      setPublicationError(publicationResult.error);
    }

    if ("value" in approvalGateResult) {
      setApprovalGateState(approvalGateResult.value);
    } else {
      setApprovalGateState(null);
      setApprovalGateError(approvalGateResult.error);
    }

    if ("value" in perspectiveSnapshotResult) {
      setPerspectiveSnapshot(perspectiveSnapshotResult.value);
    } else {
      setPerspectiveSnapshot(null);
      setPerspectiveSnapshotError(perspectiveSnapshotResult.error);
    }
  }

  async function refreshWorkBrief(workId: string) {
    setWorkError(null);

    try {
      setWorkBrief(
        await fetchJson<WorkBriefResponse>(
          `/api/work/${encodeURIComponent(workId)}/brief?scope=${SCOPE}`,
        ),
      );
    } catch (error) {
      setWorkBrief(null);
      setWorkError(
        error instanceof Error ? error.message : "Work brief request failed",
      );
    }
  }

  async function refreshTemporalPreview() {
    setTemporalPreviewRequested(true);
    setTemporalPreviewBusy(true);
    setTemporalPreviewError(null);

    try {
      setTemporalPreview(
        await fetchJson<CockpitTemporalPreviewResponse>(
          "/api/temporal-interpretation/preview",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ scope: SCOPE }),
          },
        ),
      );
    } catch (error) {
      setTemporalPreview(null);
      setTemporalPreviewError(
        error instanceof Error
          ? error.message
          : "Temporal interpretation preview request failed",
      );
    } finally {
      setTemporalPreviewBusy(false);
    }
  }

  async function loadEvidencePack() {
    setBusy("evidence-pack");
    setEvidencePackError(null);

    try {
      setEvidencePack(
        await fetchJson<EvidencePackResponse>(
          `/api/evidence-pack?scope=${SCOPE}`,
        ),
      );
    } catch (error) {
      setEvidencePack(null);
      setEvidencePackError(
        error instanceof Error
          ? error.message
          : "Evidence Pack request failed",
      );
    } finally {
      setBusy(null);
    }
  }

  async function loadTemporalReviewArtifacts() {
    setTemporalReviewArtifactsRequested(true);
    setTemporalReviewArtifactsBusy(true);
    setTemporalReviewArtifactsError(null);

    try {
      const response = await fetchJson<TemporalReviewArtifactsResponse>(
        `/api/temporal-interpretation/review-artifacts?scope=${SCOPE}&work_id=AG-TEMPORAL-INTERPRETATION&limit=20`,
        { method: "GET" },
      );

      setTemporalReviewArtifacts(response);
      setSelectedTemporalReviewArtifactId((current) => {
        if (
          current &&
          response.artifacts.some((artifact) => artifact.artifact_id === current)
        ) {
          return current;
        }

        return response.artifacts[0]?.artifact_id ?? null;
      });
    } catch (error) {
      setTemporalReviewArtifacts(null);
      setSelectedTemporalReviewArtifactId(null);
      setTemporalReviewArtifactsError(
        error instanceof Error
          ? error.message
          : "Temporal review artifacts request failed",
      );
    } finally {
      setTemporalReviewArtifactsBusy(false);
    }
  }

  async function refreshSessionTrace() {
    setSessionTraceRequested(true);
    setSessionTraceBusy(true);
    setSessionTraceError(null);

    try {
      setSessionTrace(
        await fetchJson<SessionTraceResponse>(
          `/api/sessions/trace?scope=${SCOPE}`,
        ),
      );
    } catch (error) {
      setSessionTrace(null);
      setSessionTraceError(
        error instanceof Error ? error.message : "Session trace request failed",
      );
    } finally {
      setSessionTraceBusy(false);
    }
  }

  async function observe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("observe");
    setNotice(null);

    try {
      const result = await fetchJson<{ proposals: StateDeltaProposal[] }>(
        "/api/observe",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scope: SCOPE, message }),
        },
      );

      await refreshRuntime();
      setNotice({
        tone: "info",
        text: `${result.proposals.length} pending proposals`,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Observe failed",
      });
    } finally {
      setBusy(null);
    }
  }

  async function decideProposal(id: string, decision: "commit" | "reject") {
    setBusy(id);
    setNotice(null);

    try {
      await fetchJson(`/api/deltas/${encodeURIComponent(id)}/${decision}`, {
        method: "POST",
      });
      await refreshRuntime();
      setNotice({ tone: "info", text: `${decision} complete` });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : `${decision} failed`,
      });
    } finally {
      setBusy(null);
    }
  }

  async function requestPlan() {
    setBusy("plan");
    setNotice(null);

    try {
      const result = await fetchJson<PlanResponse>("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: SCOPE,
          message: "What should I do next?",
        }),
      });

      setPlan(result);
      setNotice({
        tone: "info",
        text: `${result.planner} planner returned ${result.recommendations.length} actions`,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Planner failed",
      });
    } finally {
      setBusy(null);
    }
  }

  async function consolidateCandidates() {
    setBusy("consolidate");
    setNotice(null);

    try {
      const result = await fetchJson<ConsolidationResponse>("/api/consolidation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: SCOPE }),
      });

      await refreshRuntime();
      setNotice({
        tone: "info",
        text: `Consolidated ${result.evaluated_count} evaluated, ${result.ready_count} ready, ${result.needs_review_count} needs_review, ${result.reinforced_count} reinforced, ${result.expired_count} expired`,
      });
    } catch (error) {
      setNotice({
        tone: "error",
        text:
          error instanceof Error
            ? error.message
            : "Candidate consolidation failed",
      });
    } finally {
      setBusy(null);
    }
  }

  async function runTool(toolName: string) {
    setBusy(toolName);
    setNotice(null);

    try {
      await fetchJson("/api/actions/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope: SCOPE, tool_name: toolName }),
      });
      await refreshRuntime();
      setNotice({ tone: "info", text: `${toolName} complete` });
    } catch (error) {
      setNotice({
        tone: "error",
        text: error instanceof Error ? error.message : "Tool run failed",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="cockpit-shell six-tab-cockpit">
      <header className="cockpit-topbar">
        <div className="cockpit-brand" aria-label="Augnes">
          <strong>AUGNES</strong>
          <span>Temporal State Runtime</span>
        </div>
        <nav className="cockpit-tab-nav" aria-label="Cockpit tabs">
          {COCKPIT_TABS.map((tab) => (
            <button
              className={`cockpit-tab-button${
                activeTab === tab.id ? " is-active" : ""
              }`}
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id ? "page" : undefined}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="runtime-strip shell-status-strip" aria-label="Runtime status">
          <span>Runtime: Local / Local SQLite</span>
          <span>Read-first Bridge</span>
          <span>
            Work ID <code>{selectedWorkId ?? "AG-001"}</code>
          </span>
        </div>
      </header>

      {activeTab === "overview" ? (
        <OverviewTab
          proposals={proposals}
          selectedWorkItem={selectedWorkItem}
          nextAction={brief?.agent_handoff?.next_recommended_action ?? null}
          trajectory={trajectory}
          selectedTransition={selectedTransition}
          tensions={snapshot?.open_tensions ?? []}
          onSelectTransition={setSelectedTransitionId}
          onReviewProposals={() => setActiveTab("operator")}
        />
      ) : null}

      {activeTab === "work" ? (
        <WorkTab
          counts={workCounts}
          workItems={workItems}
          selectedWorkId={selectedWorkId}
          workBrief={workBrief}
          error={workError}
          onSelectWork={setSelectedWorkId}
        />
      ) : null}

      {activeTab === "perspective" ? (
        <PerspectiveTab
          counts={ledgerCounts}
          snapshot={snapshot}
          perspectiveSnapshot={perspectiveSnapshot}
          perspectiveSnapshotError={perspectiveSnapshotError}
          trajectory={trajectory}
          proposals={proposals}
          selectedTransition={selectedTransition}
          selectedWorkItem={selectedWorkItem}
          workBrief={workBrief}
          nextAction={brief?.agent_handoff?.next_recommended_action ?? null}
          evidencePack={evidencePack}
          evidencePackError={evidencePackError}
          evidencePackLoading={busy === "evidence-pack"}
          onLoadEvidencePack={() => void loadEvidencePack()}
          temporalReviewArtifacts={temporalReviewArtifacts}
          selectedTemporalReviewArtifact={selectedTemporalReviewArtifact}
          temporalReviewArtifactsError={temporalReviewArtifactsError}
          temporalReviewArtifactsBusy={temporalReviewArtifactsBusy}
          temporalReviewArtifactsRequested={temporalReviewArtifactsRequested}
          onLoadTemporalReviewArtifacts={() => void loadTemporalReviewArtifacts()}
          onSelectTemporalReviewArtifact={setSelectedTemporalReviewArtifactId}
          sessionTrace={sessionTrace}
          sessionTraceError={sessionTraceError}
          sessionTraceBusy={sessionTraceBusy}
          sessionTraceRequested={sessionTraceRequested}
          onRefreshSessionTrace={() => void refreshSessionTrace()}
          temporalPreview={temporalPreview}
          temporalPreviewError={temporalPreviewError}
          temporalPreviewBusy={temporalPreviewBusy}
          temporalPreviewRequested={temporalPreviewRequested}
          onRefreshTemporalPreview={() => void refreshTemporalPreview()}
          onSelectTransition={setSelectedTransitionId}
          onOpenOperator={() => setActiveTab("operator")}
        />
      ) : null}

      {activeTab === "bridge" ? <BridgeTab /> : null}

      {activeTab === "operator" ? (
        <OperatorTab
          proposals={proposals}
          pendingDecisionCount={proposals.length}
          mailboxReviewCount={mailboxReviewCount}
          evidencePackLoaded={Boolean(evidencePack)}
          sessionTraceLoaded={Boolean(sessionTrace)}
          message={message}
          notice={notice}
          busy={busy}
          sessionTraceBusy={sessionTraceBusy}
          plan={plan}
          coordinationEvents={coordinationEvents}
          selectedCoordinationEvent={selectedCoordinationEvent}
          eventError={eventError}
          mailboxSummary={mailboxSummary}
          mailboxError={mailboxError}
          publicationSummary={publicationSummary}
          publicationError={publicationError}
          approvalGateState={approvalGateState}
          approvalGateError={approvalGateError}
          onMessageChange={setMessage}
          onObserve={(event) => void observe(event)}
          onConsolidateCandidates={() => void consolidateCandidates()}
          onDecideProposal={(id, decision) => void decideProposal(id, decision)}
          onRequestPlan={() => void requestPlan()}
          onRunTool={(toolName) => void runTool(toolName)}
          onLoadEvidencePack={() => void loadEvidencePack()}
          onRefreshSessionTrace={() => void refreshSessionTrace()}
          onSelectEvent={setSelectedEventId}
        />
      ) : null}
    </main>
  );
}

function OverviewTab({
  proposals,
  selectedWorkItem,
  nextAction,
  trajectory,
  selectedTransition,
  tensions,
  onSelectTransition,
  onReviewProposals,
}: {
  proposals: StateDeltaProposal[];
  selectedWorkItem: WorkItem | null;
  nextAction: StateBriefAgentHandoff["next_recommended_action"] | null;
  trajectory: TrajectoryResponse | null;
  selectedTransition: StateTransition | null;
  tensions: StateTension[];
  onSelectTransition: (id: string) => void;
  onReviewProposals: () => void;
}) {
  const selectedWorkStatus = selectedWorkItem
    ? formatStatusLabel(selectedWorkItem.status)
    : "No work selected";

  return (
    <section className="cockpit-tab-panel overview-tab" aria-label="Overview">
      <PageHeader
        eyebrow="Overview"
        title="AI work becomes temporal state."
        description="Model proposes. User commits. Runtime records proof."
      />

      <ProcessStrip
        steps={[
          ["Conversation", "Intent captured"],
          ["Proposal", "Model suggests state changes"],
          ["Commit Gate", "User reviews and decides"],
          ["Ledger", "State committed"],
          ["Proof", "Runtime records evidence"],
        ]}
      />

      <div className="overview-main-grid">
        <section className="decision-card cockpit-surface-card">
          <p className="panel-eyebrow">Needs Your Decision</p>
          <strong className="decision-count">{proposals.length}</strong>
          <h2>pending proposals</h2>
          <p>
            Pending proposals are not ledger entries. Commit or reject them to
            decide what becomes state.
          </p>
          <button type="button" onClick={onReviewProposals}>
            Review Local Proposals
          </button>
          <div className="compact-current-work">
            <span />
            <strong>Current Work:</strong>
            <code>{selectedWorkItem?.work_id ?? "AG-001"}</code>
            <span>{selectedWorkStatus}</span>
          </div>
        </section>

        <section className="cockpit-surface-card overview-graph-card">
          <div className="graph-summary-heading">
            <div>
              <p className="panel-eyebrow">Temporal State Graph</p>
              <h2>State changes over time</h2>
            </div>
            <div className="timeline-badges">
              <StatusBadge
                label={`${getOrderedTransitions(trajectory).length} committed`}
                tone="active"
              />
              <StatusBadge label={`${proposals.length} pending`} tone="needs-review" />
              <StatusBadge label={`${tensions.length} tensions`} />
            </div>
          </div>
          {trajectory ? (
            <div className="overview-graph-stage">
              <TemporalStateGraph
                trajectory={trajectory}
                proposals={proposals}
                tensions={tensions}
                selectedTransitionId={selectedTransition?.id ?? null}
                onSelectTransition={onSelectTransition}
              />
            </div>
          ) : (
            <EmptyState label="Loading temporal graph" />
          )}
          <p className="boundary-note compact">
            Selected transitions are committed state. Pending nodes are review
            candidates, not ledger entries.
          </p>
        </section>
      </div>

      <footer className="overview-bottom-bar">
        <strong>After review:</strong>
        <span>{nextAction?.title ?? "Review local proposals and evidence."}</span>
        <span>Read-first cockpit · Runtime owns writes</span>
        <span>External systems are not controlled</span>
      </footer>
    </section>
  );
}

function WorkTab({
  counts,
  workItems,
  selectedWorkId,
  workBrief,
  error,
  onSelectWork,
}: {
  counts: {
    total: number;
    inProgress: number;
    needsDecision: number;
    completed: number;
  };
  workItems: WorkItem[];
  selectedWorkId: string | null;
  workBrief: WorkBriefResponse | null;
  error: string | null;
  onSelectWork: (workId: string) => void;
}) {
  return (
    <section className="cockpit-tab-panel work-tab" aria-label="Work">
      <PageHeader
        eyebrow="Work"
        title="Work"
        description="Track Augnes work items from intent to completion. Work IDs anchor traces. Ledger owns truth."
      />
      <div className="tab-stat-row">
        <MetricCard label="In Progress" value={counts.inProgress} detail="Active now" />
        <MetricCard
          label="Needs Decision"
          value={counts.needsDecision}
          detail="Waiting for your review"
        />
        <MetricCard label="Completed" value={counts.completed} detail="All time" />
        <MetricCard label="Total Work Items" value={counts.total} detail="All time" />
      </div>
      <WorkFocusSection
        workItems={workItems}
        selectedWorkId={selectedWorkId}
        workBrief={workBrief}
        error={error}
        onSelectWork={onSelectWork}
      />
      <BoundaryNote>
        Work IDs are trace anchors. Perspective shows the Ledger Basis and
        Evidence behind the current frame. Operator owns local proposal
        decisions.
      </BoundaryNote>
    </section>
  );
}

function PerspectiveTab({
  counts,
  snapshot,
  perspectiveSnapshot,
  perspectiveSnapshotError,
  trajectory,
  proposals,
  selectedTransition,
  selectedWorkItem,
  workBrief,
  nextAction,
  evidencePack,
  evidencePackError,
  evidencePackLoading,
  onLoadEvidencePack,
  temporalReviewArtifacts,
  selectedTemporalReviewArtifact,
  temporalReviewArtifactsError,
  temporalReviewArtifactsBusy,
  temporalReviewArtifactsRequested,
  onLoadTemporalReviewArtifacts,
  onSelectTemporalReviewArtifact,
  sessionTrace,
  sessionTraceError,
  sessionTraceBusy,
  sessionTraceRequested,
  onRefreshSessionTrace,
  temporalPreview,
  temporalPreviewError,
  temporalPreviewBusy,
  temporalPreviewRequested,
  onRefreshTemporalPreview,
  onSelectTransition,
  onOpenOperator,
}: {
  counts: {
    transitions: number;
    stateKeys: number;
    active: number;
    future: number;
    completed: number;
    deprecated: number;
  };
  snapshot: SnapshotResponse | null;
  perspectiveSnapshot: PerspectiveSnapshot | null;
  perspectiveSnapshotError: string | null;
  trajectory: TrajectoryResponse | null;
  proposals: StateDeltaProposal[];
  selectedTransition: StateTransition | null;
  selectedWorkItem: WorkItem | null;
  workBrief: WorkBriefResponse | null;
  nextAction: StateBriefAgentHandoff["next_recommended_action"] | null;
  evidencePack: EvidencePackResponse | null;
  evidencePackError: string | null;
  evidencePackLoading: boolean;
  onLoadEvidencePack: () => void;
  temporalReviewArtifacts: TemporalReviewArtifactsResponse | null;
  selectedTemporalReviewArtifact: TemporalReviewArtifact | null;
  temporalReviewArtifactsError: string | null;
  temporalReviewArtifactsBusy: boolean;
  temporalReviewArtifactsRequested: boolean;
  onLoadTemporalReviewArtifacts: () => void;
  onSelectTemporalReviewArtifact: (artifactId: string) => void;
  sessionTrace: SessionTraceResponse | null;
  sessionTraceError: string | null;
  sessionTraceBusy: boolean;
  sessionTraceRequested: boolean;
  onRefreshSessionTrace: () => void;
  temporalPreview: CockpitTemporalPreviewResponse | null;
  temporalPreviewError: string | null;
  temporalPreviewBusy: boolean;
  temporalPreviewRequested: boolean;
  onRefreshTemporalPreview: () => void;
  onSelectTransition: (id: string) => void;
  onOpenOperator: () => void;
}) {
  const preview = temporalPreview?.preview ?? null;
  const evidenceRecordCount =
    (evidencePack?.verification_trace.commands_run.length ?? 0) +
    (evidencePack?.verification_trace.checks_passed.length ?? 0) +
    (evidencePack?.verification_trace.skipped_checks.length ?? 0);
  const openTensions = snapshot?.open_tensions ?? [];
  const previewTensionCount =
    (preview?.counterexamples.length ?? 0) +
    (preview?.residual_tensions.length ?? 0) +
    (preview?.suppressed_alternatives.length ?? 0);
  const gapCount =
    (evidencePack?.gaps.length ?? 0) +
    (temporalReviewArtifacts?.gaps.length ?? 0) +
    (sessionTrace?.gaps.length ?? 0);
  const evidenceAnchorRefCount =
    (preview?.evidence_anchors.length ?? 0) +
    (selectedTemporalReviewArtifact?.evidence_anchor_refs.length ?? 0);
  const summaryRefCount =
    (preview?.summary_refs.length ?? 0) +
    (selectedTemporalReviewArtifact?.summary_refs.length ?? 0);
  const selectedWorkNextAction =
    workBrief?.next_action || selectedWorkItem?.next_action || null;
  const snapshotStateBasisCount = perspectiveSnapshot
    ? perspectiveSnapshot.committed_state_basis.active.length +
      perspectiveSnapshot.committed_state_basis.future.length +
      perspectiveSnapshot.committed_state_basis.completed.length +
      perspectiveSnapshot.committed_state_basis.deprecated.length
    : 0;
  const snapshotResearch = perspectiveSnapshot?.research_diagnostics ?? null;

  return (
    <section
      className="cockpit-tab-panel perspective-tab"
      aria-label="Perspective"
    >
      <PageHeader
        eyebrow="Perspective"
        title="Temporal Perspective"
        description="How the current interpretive frame was formed from temporal context, work traces, committed state, evidence, tensions, and authority boundaries."
      />

      <BoundaryNote>
        Perspective is a read-only interpretation surface. It does not commit
        state, approve work, publish proof, admit memory, replay delivery, route
        agents, execute Codex, or mutate external systems.
      </BoundaryNote>

      <BoundaryNote tone="green">
        PerspectiveSnapshot is a derived-view-only read model loaded from{" "}
        <code>/api/perspective/snapshot</code>. It is not source of truth and
        has no approve, publish, retry, proof recording, evidence creation, work
        update, commit/reject, mailbox, publication, GitHub/OpenAI, or temporal
        review artifact write authority.
      </BoundaryNote>

      <nav className="perspective-anchor-nav" aria-label="Perspective sections">
        <a href="#perspective-frame">Frame</a>
        <a href="#perspective-ledger-basis">Ledger Basis</a>
        <a href="#perspective-evidence">Evidence</a>
        <a href="#perspective-tensions">Tensions</a>
        <a href="#perspective-boundary-next">Boundary / Next</a>
      </nav>

      <div className="perspective-grid">
        <section
          className="cockpit-surface-card perspective-section perspective-frame-section perspective-frame-hero"
          id="perspective-frame"
        >
          <div className="perspective-hero-heading">
            <div>
              <p className="panel-eyebrow">Frame</p>
              <h2>Current Perspective Frame</h2>
              <p>How this frame was formed</p>
            </div>
            <div className="timeline-badges">
              {preview ? (
                <>
                  <StatusBadge
                    label={formatStatusLabel(temporalPreview?.generator ?? "unknown")}
                  />
                  <StatusBadge
                    label={formatStatusLabel(preview.transition_relation)}
                  />
                </>
              ) : (
                <StatusBadge label="Preview not loaded" />
              )}
            </div>
          </div>
          <div className="perspective-trace-strip" aria-label="Frame formation trace">
            {[
              { display: "◇ Scan", label: "Scan" },
              { display: "◇ Bind", label: "Bind" },
              { display: "◉ Resolve", label: "Resolve", current: true },
              { display: "◇ Anchor", label: "Anchor" },
              { display: "◇ Next", label: "Next" },
            ].map((step) => (
              <article
                key={step.label}
                className={step.current ? "is-current" : undefined}
                aria-label={
                  step.current
                    ? `${step.label}, current perspective focus`
                    : `${step.label}, temporal frame point`
                }
              >
                <strong>{step.display}</strong>
              </article>
            ))}
          </div>
          {perspectiveSnapshot ? (
            <div className="perspective-frame-summary">
              <article>
                <h3>PerspectiveSnapshot current_frame.summary</h3>
                <p>{perspectiveSnapshot.current_frame.summary}</p>
              </article>
              <article>
                <h3>Primary state keys</h3>
                <RefChipList
                  refs={perspectiveSnapshot.current_frame.primary_state_keys}
                  emptyLabel="No primary state keys in PerspectiveSnapshot"
                />
              </article>
              <article>
                <h3>Active work ids</h3>
                <RefChipList
                  refs={perspectiveSnapshot.current_frame.active_work_ids}
                  emptyLabel="No active work ids in PerspectiveSnapshot"
                />
              </article>
              <div className="meta-row">
                <StatusBadge
                  label={formatStatusLabel(perspectiveSnapshot.snapshot_version)}
                />
                <StatusBadge
                  label={`${formatStatusLabel(
                    perspectiveSnapshot.current_frame.pressure_level,
                  )} pressure`}
                />
                <span>
                  as_of{" "}
                  <time dateTime={perspectiveSnapshot.as_of}>
                    {formatDate(perspectiveSnapshot.as_of)}
                  </time>
                </span>
                <span>derived read model</span>
              </div>
            </div>
          ) : perspectiveSnapshotError ? (
            <EmptyState
              label="PerspectiveSnapshot unavailable"
              description={perspectiveSnapshotError}
            />
          ) : null}
          {temporalPreviewError ? (
            <EmptyState
              label="Temporal interpretation preview unavailable"
              description={temporalPreviewError}
            />
          ) : temporalPreviewBusy || (temporalPreviewRequested && !preview) ? (
            <LoadingBlock
              title="Loading Temporal Interpretation Preview"
              lines={[
                "Reading current temporal context",
                "Preparing read-only interpretation",
              ]}
            />
          ) : preview ? (
            <div className="perspective-frame-summary">
              <article>
                <h3>Current interpretation</h3>
                <p>{preview.current_interpretation}</p>
              </article>
              <article>
                <h3>Active prior context</h3>
                <p>{preview.active_prior_context}</p>
              </article>
              <article>
                <h3>Transition relation</h3>
                <p>{preview.revision_explanation}</p>
              </article>
              <div className="meta-row">
                <StatusBadge
                  label={formatStatusLabel(temporalPreview?.generator ?? "unknown")}
                />
                <StatusBadge label={formatStatusLabel(preview.transition_relation)} />
                <span>{preview.evidence_anchors.length} evidence anchors</span>
                <span>{preview.summary_refs.length} summary refs</span>
              </div>
              <div className="perspective-hero-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={onRefreshTemporalPreview}
                  disabled={temporalPreviewBusy}
                >
                  Refresh Temporal Interpretation Preview
                </button>
              </div>
            </div>
          ) : (
            <div className="panel-control-row">
              <EmptyState
                label="No Temporal Interpretation Preview loaded"
                description="Load the existing read-only preview to inspect the current frame."
              />
              <button
                type="button"
                className="secondary-button"
                onClick={onRefreshTemporalPreview}
                disabled={temporalPreviewBusy}
              >
                Load Temporal Interpretation Preview
              </button>
            </div>
          )}
          <div className="tab-stat-row perspective-stat-row">
            <MetricCard
              label="PerspectiveSnapshot"
              value={perspectiveSnapshot ? "Loaded" : "Not loaded"}
              detail="derived-view-only read model"
            />
            <MetricCard
              label="Committed transitions"
              value={counts.transitions}
              detail="ledger basis entries"
            />
            <MetricCard
              label="State keys"
              value={counts.stateKeys}
              detail="derivable committed lanes"
            />
            <MetricCard
              label="Evidence Pack"
              value={evidencePack ? "Loaded" : "Not loaded"}
              detail={`${evidenceRecordCount} evidence records`}
            />
            <MetricCard
              label="Review artifacts"
              value={temporalReviewArtifacts?.count ?? 0}
              detail="read-only temporal artifacts"
            />
            <MetricCard
              label="Frame limits"
              value={openTensions.length + previewTensionCount + gapCount}
              detail="tensions, counterexamples, alternatives"
            />
          </div>
        </section>

        <section
          className="cockpit-surface-card perspective-section perspective-ledger-section"
          id="perspective-ledger-basis"
        >
          <PanelHeader
            eyebrow="Ledger Basis"
            title="Committed runtime state basis"
            description="Ledger Basis is committed runtime state. Perspective interprets it, but does not own it. Pending proposals are not ledger entries."
          />
          <div className="tab-stat-row compact-stat-row">
            <MetricCard
              label="Committed transition count"
              value={counts.transitions}
              detail="from trajectory"
            />
            <MetricCard
              label="State key count"
              value={counts.stateKeys}
              detail="committed or snapshot-derived"
            />
            <MetricCard
              label="Pending proposals"
              value={
                perspectiveSnapshot?.pending_proposal_pressure.count ??
                proposals.length
              }
              detail={
                perspectiveSnapshot
                  ? `${formatStatusLabel(
                      perspectiveSnapshot.pending_proposal_pressure
                        .pressure_level,
                    )} pressure only`
                  : "shown as not ledger entries"
              }
            />
            <MetricCard
              label="Snapshot state basis"
              value={snapshotStateBasisCount}
              detail="committed_state_basis buckets"
            />
          </div>
          {perspectiveSnapshot ? (
            <div className="perspective-detail-stack">
              <PerspectiveStateBasis
                title="PerspectiveSnapshot committed_state_basis"
                summary={perspectiveSnapshot.committed_state_basis.summary}
                active={perspectiveSnapshot.committed_state_basis.active}
                future={perspectiveSnapshot.committed_state_basis.future}
                completed={perspectiveSnapshot.committed_state_basis.completed}
                deprecated={perspectiveSnapshot.committed_state_basis.deprecated}
              />
              <PerspectiveProposalPressure
                pressure={perspectiveSnapshot.pending_proposal_pressure}
              />
            </div>
          ) : null}
          {trajectory ? (
            <div className="ledger-graph-stage compact-ledger-graph">
              <TemporalStateGraph
                trajectory={trajectory}
                proposals={[]}
                tensions={snapshot?.open_tensions ?? []}
                selectedTransitionId={selectedTransition?.id ?? null}
                onSelectTransition={onSelectTransition}
              />
            </div>
          ) : (
            <EmptyState label="Loading committed ledger basis" />
          )}
          <TransitionInspector event={selectedTransition} />
        </section>

        <section
          className="cockpit-surface-card perspective-section perspective-evidence-section"
          id="perspective-evidence"
        >
          <PanelHeader
            eyebrow="Evidence"
            title="Evidence support and challenge"
            description="Evidence supports or challenges the frame. It does not commit, approve, publish, replay, or execute."
          />
          <section
            className="cockpit-surface-card perspective-evidence-handoff-snapshot"
            aria-label="Perspective Evidence Handoff Snapshot"
          >
            <PanelHeader
              eyebrow="Perspective evidence"
              title="Perspective Evidence Handoff Snapshot"
              description="Read-only evidence and continuity orientation for the current perspective frame. This does not create proof, call providers, execute Codex, publish, or mutate state."
            />
            <div className="perspective-evidence-handoff-grid">
              <MetricCard
                label="Evidence Pack"
                value={evidencePack ? "Loaded" : "Not loaded"}
                detail="current evidence packet"
              />
              <MetricCard
                label="Evidence records"
                value={evidenceRecordCount}
                detail="commands, checks, and skipped checks"
              />
              <MetricCard
                label="Temporal Review Artifacts"
                value={temporalReviewArtifacts?.count ?? 0}
                detail={temporalReviewArtifacts ? "Loaded" : "Not loaded"}
              />
              <MetricCard
                label="Session Trace"
                value={sessionTrace ? "Loaded" : "Not loaded"}
                detail="continuity context"
              />
              <MetricCard
                label="Loaded evidence gaps"
                value={gapCount}
                detail="evidence/session/artifact gaps"
              />
              <MetricCard
                label="Evidence anchor refs"
                value={evidenceAnchorRefCount}
                detail="preview and artifact anchors"
              />
              <MetricCard
                label="Summary refs"
                value={summaryRefCount}
                detail="preview and artifact summaries"
              />
              <MetricCard
                label="Selected temporal review artifact"
                value={selectedTemporalReviewArtifact ? "Available" : "Not loaded"}
                detail="read-only artifact focus"
              />
            </div>
            <div className="perspective-evidence-handoff-next">
              <BoundaryNote tone="green">
                Safe next step: Review evidence pack, session trace, and temporal review artifacts before treating a frame as grounded.
              </BoundaryNote>
              <BoundaryNote>
                Boundary: Read-only snapshot. No proof creation, provider call,
                Codex execution, GitHub posting, approval, merge, publication,
                Augnes mutation, or state commit/reject.
              </BoundaryNote>
            </div>
          </section>
          <div className="perspective-evidence-grid">
            <MetricCard
              label="Snapshot evidence_basis"
              value={perspectiveSnapshot?.evidence_basis.count ?? 0}
              detail="recent read model evidence"
            />
            <MetricCard
              label="Evidence Pack"
              value={evidencePack ? "Loaded" : "Not loaded"}
              detail={`${evidenceRecordCount} records`}
            />
            <MetricCard
              label="Temporal review artifacts"
              value={temporalReviewArtifacts?.count ?? 0}
              detail={temporalReviewArtifacts ? "loaded" : "not loaded"}
            />
            <MetricCard
              label="Session Trace"
              value={sessionTrace ? `${sessionTrace.sessions.length}` : "Not loaded"}
              detail="read-only continuity"
            />
            <MetricCard
              label="Loaded evidence gaps"
              value={gapCount}
              detail="from evidence/session/artifacts"
            />
          </div>
          {perspectiveSnapshot ? (
            <div className="perspective-detail-stack">
              <PerspectiveEvidenceBasis
                evidenceBasis={perspectiveSnapshot.evidence_basis}
              />
              <PerspectiveTraceBasis
                workTraceBasis={perspectiveSnapshot.work_trace_basis}
                actionTraceBasis={perspectiveSnapshot.action_trace_basis}
              />
            </div>
          ) : null}
          <div className="perspective-evidence-refs">
            <section>
              <h3>Evidence anchor refs</h3>
              <RefChipList
                refs={[
                  ...(preview?.evidence_anchors.map((anchor) => anchor.ref) ?? []),
                  ...(selectedTemporalReviewArtifact?.evidence_anchor_refs ?? []),
                ]}
                emptyLabel="No evidence anchor refs loaded"
              />
            </section>
            <section>
              <h3>Summary refs</h3>
              <RefChipList
                refs={[
                  ...(preview?.summary_refs.map((ref) => ref.ref) ?? []),
                  ...(selectedTemporalReviewArtifact?.summary_refs ?? []),
                ]}
                emptyLabel="No summary refs loaded"
              />
            </section>
            <section>
              <h3>Preview refs</h3>
              <RefChipList
                refs={selectedTemporalReviewArtifact?.source_refs ?? []}
                emptyLabel="No read-only preview refs loaded"
              />
            </section>
          </div>
          <div className="perspective-detail-stack">
            <details className="perspective-detail-panel">
              <summary>Evidence Pack details</summary>
              <EvidencePackPanel
                evidencePack={evidencePack}
                error={evidencePackError}
                loading={evidencePackLoading}
                onLoad={onLoadEvidencePack}
              />
            </details>
            <details className="perspective-detail-panel">
              <summary>Temporal Review Artifact details</summary>
              <TemporalReviewArtifactBrowserPanel
                artifactsResponse={temporalReviewArtifacts}
                selectedArtifact={selectedTemporalReviewArtifact}
                error={temporalReviewArtifactsError}
                busy={temporalReviewArtifactsBusy}
                requested={temporalReviewArtifactsRequested}
                onLoad={onLoadTemporalReviewArtifacts}
                onSelectArtifact={onSelectTemporalReviewArtifact}
              />
            </details>
            <details className="perspective-detail-panel">
              <summary>Session Trace details</summary>
              <SessionTracePanel
                trace={sessionTrace}
                error={sessionTraceError}
                busy={sessionTraceBusy}
                requested={sessionTraceRequested}
                onRefresh={onRefreshSessionTrace}
              />
            </details>
            <details className="perspective-detail-panel">
              <summary>Temporal Interpretation Preview details</summary>
              <TemporalInterpretationPreviewPanel
                previewResponse={temporalPreview}
                error={temporalPreviewError}
                busy={temporalPreviewBusy}
                requested={temporalPreviewRequested}
                onRefresh={onRefreshTemporalPreview}
              />
            </details>
          </div>
        </section>

        <section
          className="cockpit-surface-card perspective-section perspective-tensions-section"
          id="perspective-tensions"
        >
          <PanelHeader
            eyebrow="Tensions"
            title="Uncertainty and counter-pressure"
            description="Perspective must not become a self-confirming summary. It must show what weakens, limits, or challenges the frame."
          />
          <div className="perspective-tension-grid">
            <TensionList
              title="PerspectiveSnapshot open_tensions"
              items={(perspectiveSnapshot?.open_tensions.items ?? []).map(
                (tension) => ({
                  key: tension.id,
                  label: tension.title,
                  detail: tension.description,
                  metaChips: [
                    formatStatusLabel(tension.severity),
                    tension.state_key
                      ? `state ${formatStateKeyLabel(tension.state_key)}`
                      : "no state key",
                  ],
                }),
              )}
              emptyLabel="No PerspectiveSnapshot open_tensions"
            />
            <TensionList
              title="State snapshot open tensions"
              items={openTensions.map((tension) => ({
                key: tension.id,
                label: tension.title,
                detail: tension.description,
                metaChips: [
                  formatStatusLabel(tension.severity),
                  formatStatusLabel(tension.status),
                ],
              }))}
              emptyLabel="No state snapshot open tensions"
            />
            <TensionList
              title="Counterexamples"
              items={
                preview?.counterexamples.map((item) => ({
                  key: item.ref,
                  label: item.ref,
                  detail: item.description,
                })) ?? []
              }
              emptyLabel="No counterexamples loaded"
            />
            <TensionList
              title="Residual tensions"
              items={
                preview?.residual_tensions.map((item) => ({
                  key: item.ref,
                  label: item.ref,
                  detail: item.description,
                })) ?? []
              }
              emptyLabel="No residual tensions loaded"
            />
            <TensionList
              title="Suppressed alternatives"
              items={
                preview?.suppressed_alternatives.map((item) => ({
                  key: item.alternative,
                  label: item.alternative,
                  fields: [
                    { label: "Why deferred", value: item.why_deferred },
                    { label: "Would change", value: item.what_would_change_status },
                  ],
                })) ?? []
              }
              emptyLabel="No suppressed alternatives loaded"
            />
            <TensionList
              title="Evidence gaps"
              items={[
                ...(evidencePack?.gaps ?? []),
                ...(temporalReviewArtifacts?.gaps ?? []),
                ...(sessionTrace?.gaps ?? []),
              ].map((gap) => ({
                key: gap,
                label: "Gap",
                detail: gap,
              }))}
              emptyLabel="No evidence gaps loaded"
            />
          </div>
        </section>

        <section
          className="cockpit-surface-card perspective-section perspective-boundary-card"
          id="perspective-boundary-next"
        >
          <PanelHeader
            eyebrow="Boundary / Next"
            title="Next step and authority boundary"
            description="Perspective can point to review surfaces, but it does not perform local state decisions."
          />
          <div className="perspective-next-grid">
            <article>
              <h3>PerspectiveSnapshot boundary_next</h3>
              {perspectiveSnapshot ? (
                <>
                  <strong>{perspectiveSnapshot.boundary_next.title}</strong>
                  <p>{perspectiveSnapshot.boundary_next.rationale}</p>
                  <div className="meta-row">
                    <StatusBadge
                      label={formatStatusLabel(
                        perspectiveSnapshot.boundary_next.priority,
                      )}
                    />
                    <span>
                      {formatStatusLabel(
                        perspectiveSnapshot.boundary_next.suggested_actor,
                      )}
                    </span>
                  </div>
                </>
              ) : nextAction ? (
                <>
                  <strong>{nextAction.title}</strong>
                  <p>{nextAction.rationale}</p>
                  <div className="meta-row">
                    <StatusBadge label={formatStatusLabel(nextAction.priority)} />
                    <span>{formatStatusLabel(nextAction.suggested_actor)}</span>
                  </div>
                </>
              ) : (
                <EmptyState label="No brief next action loaded" />
              )}
            </article>
            <article>
              <h3>Brief next recommended action</h3>
              {nextAction ? (
                <>
                  <strong>{nextAction.title}</strong>
                  <p>{nextAction.rationale}</p>
                  <div className="meta-row">
                    <StatusBadge label={formatStatusLabel(nextAction.priority)} />
                    <span>{formatStatusLabel(nextAction.suggested_actor)}</span>
                  </div>
                </>
              ) : (
                <EmptyState label="No brief next action loaded" />
              )}
            </article>
            <article>
              <h3>Selected work next_action</h3>
              {selectedWorkNextAction ? (
                <>
                  <strong>{selectedWorkItem?.work_id ?? workBrief?.work_id}</strong>
                  <p>{selectedWorkNextAction}</p>
                </>
              ) : (
                <EmptyState label="No selected work next action loaded" />
              )}
            </article>
            <article>
              <h3>authority_boundaries</h3>
              <PerspectiveAuthorityBoundaries
                boundaries={perspectiveSnapshot?.authority_boundaries ?? null}
              />
            </article>
            <article>
              <h3>research_diagnostics</h3>
              {snapshotResearch ? (
                <ResearchDiagnosticsPanel diagnostics={snapshotResearch} />
              ) : (
                <EmptyState label="No research_diagnostics loaded" />
              )}
            </article>
          </div>
          {perspectiveSnapshot ? (
            <div className="perspective-detail-stack">
              <details className="perspective-detail-panel">
                <summary>boundary_next allowed and forbidden next steps</summary>
                <div className="perspective-next-grid">
                  <article>
                    <h3>Allowed next steps</h3>
                    <ul className="boundary-list">
                      {perspectiveSnapshot.boundary_next.allowed_next_steps.map(
                        (step) => (
                          <li key={step}>{step}</li>
                        ),
                      )}
                    </ul>
                  </article>
                  <article>
                    <h3>Forbidden next steps</h3>
                    <ul className="boundary-list">
                      {perspectiveSnapshot.boundary_next.forbidden_next_steps.map(
                        (step) => (
                          <li key={step}>{step}</li>
                        ),
                      )}
                    </ul>
                  </article>
                </div>
              </details>
            </div>
          ) : null}
          <div className="panel-control-row">
            <BoundaryNote tone="green">
              Operator owns local proposal decisions. Operator actions affect
              the local Augnes runtime only. Perspective remains read-only and
              non-authoritative.
            </BoundaryNote>
            <button
              type="button"
              className="secondary-button"
              onClick={onOpenOperator}
            >
              Open Operator
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}

function LedgerTab({
  counts,
  snapshot,
  trajectory,
  selectedTransition,
  onSelectTransition,
}: {
  counts: {
    transitions: number;
    stateKeys: number;
    active: number;
    future: number;
    completed: number;
    deprecated: number;
  };
  snapshot: SnapshotResponse | null;
  trajectory: TrajectoryResponse | null;
  selectedTransition: StateTransition | null;
  onSelectTransition: (id: string) => void;
}) {
  return (
    <section className="cockpit-tab-panel ledger-tab" aria-label="Ledger">
      <PageHeader
        eyebrow="Ledger"
        title="Temporal Ledger"
        description="Committed state changes over time. Ledger is the source of truth. Pending proposals are not ledger entries."
      />
      <div className="tab-stat-row ledger-stat-row">
        <MetricCard
          label="Committed transitions"
          value={counts.transitions}
          detail="ledger entries"
        />
        <MetricCard label="State keys" value={counts.stateKeys} detail="tracked lanes" />
        <MetricCard
          label="State groups"
          value={`${counts.active}/${counts.future}/${counts.completed}/${counts.deprecated}`}
          detail="active / future / completed / deprecated"
        />
        <BoundaryNote tone="green">
          Ledger is the source of truth. Pending proposals are not ledger
          entries.
        </BoundaryNote>
      </div>
      <div className="ledger-grid">
        <aside className="cockpit-surface-card ledger-state-groups">
          <PanelHeader eyebrow="State Keys" title="Committed Snapshot" />
          {snapshot ? (
            <div className="snapshot-grid">
              <StateGroup title="Active" entries={snapshot.active_state} />
              <StateGroup title="Future" entries={snapshot.future_state} />
              <StateGroup title="Completed" entries={snapshot.completed_state} />
              <StateGroup title="Deprecated" entries={snapshot.deprecated_state} />
            </div>
          ) : (
            <EmptyState label="Loading snapshot" />
          )}
        </aside>
        <section className="cockpit-surface-card ledger-graph-card">
          <PanelHeader
            eyebrow="Committed Ledger Timeline"
            title="Committed entries only"
            description="Pending proposals are not shown as committed state here."
          />
          {trajectory ? (
            <div className="ledger-graph-stage">
              <TemporalStateGraph
                trajectory={trajectory}
                proposals={[]}
                tensions={snapshot?.open_tensions ?? []}
                selectedTransitionId={selectedTransition?.id ?? null}
                onSelectTransition={onSelectTransition}
              />
            </div>
          ) : (
            <EmptyState label="Loading temporal ledger" />
          )}
        </section>
        <TransitionInspector event={selectedTransition} />
      </div>
    </section>
  );
}

function ProofTab({
  evidencePack,
  evidencePackError,
  evidencePackLoading,
  onLoadEvidencePack,
  temporalReviewArtifacts,
  selectedTemporalReviewArtifact,
  temporalReviewArtifactsError,
  temporalReviewArtifactsBusy,
  temporalReviewArtifactsRequested,
  onLoadTemporalReviewArtifacts,
  onSelectTemporalReviewArtifact,
  sessionTrace,
  sessionTraceError,
  sessionTraceBusy,
  sessionTraceRequested,
  onRefreshSessionTrace,
  temporalPreview,
  temporalPreviewError,
  temporalPreviewBusy,
  temporalPreviewRequested,
  onRefreshTemporalPreview,
}: {
  evidencePack: EvidencePackResponse | null;
  evidencePackError: string | null;
  evidencePackLoading: boolean;
  onLoadEvidencePack: () => void;
  temporalReviewArtifacts: TemporalReviewArtifactsResponse | null;
  selectedTemporalReviewArtifact: TemporalReviewArtifact | null;
  temporalReviewArtifactsError: string | null;
  temporalReviewArtifactsBusy: boolean;
  temporalReviewArtifactsRequested: boolean;
  onLoadTemporalReviewArtifacts: () => void;
  onSelectTemporalReviewArtifact: (artifactId: string) => void;
  sessionTrace: SessionTraceResponse | null;
  sessionTraceError: string | null;
  sessionTraceBusy: boolean;
  sessionTraceRequested: boolean;
  onRefreshSessionTrace: () => void;
  temporalPreview: CockpitTemporalPreviewResponse | null;
  temporalPreviewError: string | null;
  temporalPreviewBusy: boolean;
  temporalPreviewRequested: boolean;
  onRefreshTemporalPreview: () => void;
}) {
  const evidenceRecordCount =
    (evidencePack?.verification_trace.commands_run.length ?? 0) +
    (evidencePack?.verification_trace.checks_passed.length ?? 0) +
    (evidencePack?.verification_trace.skipped_checks.length ?? 0);

  return (
    <section className="cockpit-tab-panel proof-tab" aria-label="Proof">
      <PageHeader
        eyebrow="Proof"
        title="Proof / Evidence"
        description="Proof records evidence only. It does not commit, approve, publish, replay, or execute anything."
      />
      <div className="tab-stat-row">
        <MetricCard
          label="Evidence records"
          value={evidenceRecordCount}
          detail={evidencePack ? "loaded from Evidence Pack" : "load pack to inspect"}
        />
        <MetricCard
          label="Evidence Pack"
          value={evidencePack ? "Available" : "Not loaded"}
          detail="read-only proof bundle"
        />
        <MetricCard
          label="Temporal review artifacts"
          value={temporalReviewArtifacts?.count ?? 0}
          detail="bounded review records"
        />
        <MetricCard
          label="Session Trace"
          value={sessionTrace ? sessionTrace.sessions.length : "Not loaded"}
          detail="read-only continuity"
        />
        <MetricCard
          label="Gaps / needs review"
          value={evidencePack?.gaps.length ?? 0}
          detail="derived review gaps"
        />
      </div>
      <BoundaryNote>
        Proof records evidence only. It does not commit, approve, publish,
        replay, or execute anything.
      </BoundaryNote>
      <div className="proof-grid">
        <EvidencePackPanel
          evidencePack={evidencePack}
          error={evidencePackError}
          loading={evidencePackLoading}
          onLoad={onLoadEvidencePack}
        />
        <TemporalReviewArtifactBrowserPanel
          artifactsResponse={temporalReviewArtifacts}
          selectedArtifact={selectedTemporalReviewArtifact}
          error={temporalReviewArtifactsError}
          busy={temporalReviewArtifactsBusy}
          requested={temporalReviewArtifactsRequested}
          onLoad={onLoadTemporalReviewArtifacts}
          onSelectArtifact={onSelectTemporalReviewArtifact}
        />
        <SessionTracePanel
          trace={sessionTrace}
          error={sessionTraceError}
          busy={sessionTraceBusy}
          requested={sessionTraceRequested}
          onRefresh={onRefreshSessionTrace}
        />
      </div>
      <details className="advanced-proof-panel">
        <summary>Advanced read-only temporal interpretation preview</summary>
        <TemporalInterpretationPreviewPanel
          previewResponse={temporalPreview}
          error={temporalPreviewError}
          busy={temporalPreviewBusy}
          requested={temporalPreviewRequested}
          onRefresh={onRefreshTemporalPreview}
        />
      </details>
    </section>
  );
}

function BridgeTab() {
  const capabilityRows = [
    ["public app tools", "read allowed", "blocked", "blocked", "blocked", "blocked", "blocked"],
    ["bridge-gated tools", "read allowed", "draft gated", "record proof/trace gated", "blocked", "blocked", "blocked"],
    ["work read tools", "read allowed", "blocked", "blocked", "blocked", "blocked", "blocked"],
    ["draft tools", "read allowed", "draft gated", "blocked", "blocked", "blocked", "blocked"],
    ["record tools", "read allowed", "draft gated", "record proof/trace gated", "blocked", "blocked", "blocked"],
  ];
  const endpoints = [
    "GET /api/state/brief",
    "GET /api/evidence-pack",
    "GET /api/sessions/trace",
    "GET /api/evidence/records",
    "GET /api/work",
    "GET /api/proposals",
    "POST /api/observe",
    "POST /api/handoffs/review",
    "POST /api/actions/record",
    "POST /api/work/{work_id}/events",
  ];

  return (
    <section className="cockpit-tab-panel bridge-tab" aria-label="Bridge">
      <PageHeader
        eyebrow="Bridge"
        title="Read-first Bridge"
        description="Configured tool surface, not an external system control panel."
      />
      <div className="tab-stat-row">
        <MetricCard label="Read context" value="Allowed" detail="state and work reads" />
        <MetricCard label="Draft packets" value="Gated" detail="bounded bridge tools" />
        <MetricCard label="Record proof/trace" value="Gated" detail="runtime validated" />
        <MetricCard label="Commit state" value="Blocked" detail="user/Core gate only" />
        <MetricCard label="Execute Codex" value="Blocked" detail="not a bridge action" />
      </div>
      <div className="bridge-grid">
        <aside className="cockpit-surface-card bridge-authority-card">
          <PanelHeader eyebrow="Authority" title="Surface Groups" />
          <ul className="boundary-list">
            <li>read allowed</li>
            <li>draft gated</li>
            <li>record proof/trace gated</li>
            <li>commit state blocked</li>
            <li>execute Codex blocked</li>
            <li>publish/mutate GitHub blocked</li>
          </ul>
          <BoundaryNote>
            Bridge is a configured tool surface, not direct external control.
          </BoundaryNote>
        </aside>
        <section className="cockpit-surface-card bridge-matrix-card">
          <PanelHeader
            eyebrow="Capability Matrix"
            title="Read-first tool authority"
            description="Static matrix over existing bridge/read behavior. No new APIs are required."
          />
          <div className="capability-matrix" role="table">
            <div role="row" className="capability-row capability-head">
              <span>tool surface</span>
              <span>read</span>
              <span>draft</span>
              <span>record</span>
              <span>commit state</span>
              <span>execute Codex</span>
              <span>publish/mutate GitHub</span>
            </div>
            {capabilityRows.map((row) => (
              <div role="row" className="capability-row" key={row[0]}>
                {row.map((cell, index) => (
                  <span
                    className={
                      index === 0
                        ? "matrix-label"
                        : cell.includes("blocked")
                          ? "matrix-blocked"
                          : cell.includes("gated")
                            ? "matrix-gated"
                            : "matrix-allowed"
                    }
                    key={`${row[0]}-${cell}-${index}`}
                  >
                    {cell}
                  </span>
                ))}
              </div>
            ))}
          </div>
          <div className="endpoint-grid" aria-label="Endpoint contract examples">
            {endpoints.map((endpoint) => (
              <code key={endpoint}>{endpoint}</code>
            ))}
          </div>
        </section>
      </div>
      <BoundaryNote>
        Configured tool surface, not an external system control panel. Bridge
        reads context and may record bounded proof/trace only through existing
        gated behavior.
      </BoundaryNote>
    </section>
  );
}

function OperatorTab({
  proposals,
  pendingDecisionCount,
  mailboxReviewCount,
  evidencePackLoaded,
  sessionTraceLoaded,
  message,
  notice,
  busy,
  sessionTraceBusy,
  plan,
  coordinationEvents,
  selectedCoordinationEvent,
  eventError,
  mailboxSummary,
  mailboxError,
  publicationSummary,
  publicationError,
  approvalGateState,
  approvalGateError,
  onMessageChange,
  onObserve,
  onConsolidateCandidates,
  onDecideProposal,
  onRequestPlan,
  onRunTool,
  onLoadEvidencePack,
  onRefreshSessionTrace,
  onSelectEvent,
}: {
  proposals: StateDeltaProposal[];
  pendingDecisionCount: number;
  mailboxReviewCount: number;
  evidencePackLoaded: boolean;
  sessionTraceLoaded: boolean;
  message: string;
  notice: Notice | null;
  busy: string | null;
  sessionTraceBusy: boolean;
  plan: PlanResponse | null;
  coordinationEvents: CoordinationEvent[];
  selectedCoordinationEvent: CoordinationEvent | null;
  eventError: string | null;
  mailboxSummary: MailboxSummaryResponse | null;
  mailboxError: string | null;
  publicationSummary: PublicationSummaryResponse | null;
  publicationError: string | null;
  approvalGateState: ApprovalGateStateSummaryResponse | null;
  approvalGateError: string | null;
  onMessageChange: (value: string) => void;
  onObserve: (event: FormEvent<HTMLFormElement>) => void;
  onConsolidateCandidates: () => void;
  onDecideProposal: (id: string, decision: "commit" | "reject") => void;
  onRequestPlan: () => void;
  onRunTool: (toolName: string) => void;
  onLoadEvidencePack: () => void;
  onRefreshSessionTrace: () => void;
  onSelectEvent: (eventId: string) => void;
}) {
  return (
    <section className="cockpit-tab-panel operator-tab" aria-label="Operator">
      <PageHeader
        eyebrow="Operator"
        title="Operator"
        description="Operator actions affect the local Augnes runtime only. No publish, merge, retry, backup, live exchange, or external execution controls live here."
      />
      <div className="tab-stat-row">
        <MetricCard label="Local Runtime" value="Available" detail="demo metadata" />
        <MetricCard label="State Authority" value="Local Runtime" detail="owns and commits state" />
        <MetricCard
          label="Pending Decisions"
          value={pendingDecisionCount}
          detail="commit/reject needed"
        />
        <MetricCard
          label="Mailbox Review Items"
          value={mailboxReviewCount}
          detail="read-only buckets"
        />
        <MetricCard
          label="Evidence Pack"
          value={evidencePackLoaded ? "Available" : "Not loaded"}
          detail="read-only proof bundle"
        />
        <MetricCard label="Shell Status" value="MVP shell" detail="demo readiness" />
      </div>
      <OperatorHandoffSnapshot
        pendingDecisionCount={pendingDecisionCount}
        mailboxReviewCount={mailboxReviewCount}
        evidencePackLoaded={evidencePackLoaded}
        sessionTraceLoaded={sessionTraceLoaded}
        publicationSummary={publicationSummary}
        approvalGateState={approvalGateState}
      />
      <div className="operator-layout-grid">
        <aside className="operator-side-stack">
          <BoundaryNote tone="green">
            Operator actions are recorded with actor, timestamp, result, linked
            state keys, and work context. External systems are never directly
            controlled.
          </BoundaryNote>
          <details className="operator-advanced-observe">
            <summary>Observe advanced local proposal input</summary>
            <form onSubmit={onObserve} className="observe-form">
              <textarea
                value={message}
                onChange={(event) => onMessageChange(event.target.value)}
                rows={6}
                aria-label="Observation message"
              />
              <div className="form-row">
                <button disabled={busy === "observe" || !message.trim()}>
                  Observe local proposal
                </button>
                {notice ? (
                  <span className={`notice ${notice.tone}`}>{notice.text}</span>
                ) : null}
              </div>
            </form>
          </details>
          <SafeLocalActions
            busy={busy}
            evidencePackLoaded={evidencePackLoaded}
            sessionTraceLoaded={sessionTraceLoaded}
            sessionTraceBusy={sessionTraceBusy}
            plan={plan}
            onRequestPlan={onRequestPlan}
            onRunTool={onRunTool}
            onLoadEvidencePack={onLoadEvidencePack}
            onRefreshSessionTrace={onRefreshSessionTrace}
          />
        </aside>
        <section className="operator-main-stack">
          <AgResumeTargetPreviewPanel />
          <AgResumeMappingProposalPreviewPanel />
          <AgResumeMappingProposalRecordReviewPanel />
          <AgResumeMappingProposalLifecycleActionPanel />
          <CoordinationEventTimeline
            events={coordinationEvents}
            selectedEvent={selectedCoordinationEvent}
            error={eventError}
            onSelectEvent={onSelectEvent}
          />
          <PendingProposalQueue
            proposals={proposals}
            busy={busy}
            onConsolidateCandidates={onConsolidateCandidates}
            onDecideProposal={onDecideProposal}
          />
        </section>
        <aside className="operator-summary-stack">
          <MailboxSummaryPanel mailboxSummary={mailboxSummary} error={mailboxError} />
          <PublicationSummaryPanel
            publicationSummary={publicationSummary}
            error={publicationError}
          />
          <ApprovalGateStatePanel
            approvalGateState={approvalGateState}
            error={approvalGateError}
          />
        </aside>
      </div>
      <BoundaryNote>
        Local runtime only. No external execution, publish, merge, retry, token,
        backup, or live exchange controls.
      </BoundaryNote>
    </section>
  );
}

function OperatorHandoffSnapshot({
  pendingDecisionCount,
  mailboxReviewCount,
  evidencePackLoaded,
  sessionTraceLoaded,
  publicationSummary,
  approvalGateState,
}: {
  pendingDecisionCount: number;
  mailboxReviewCount: number;
  evidencePackLoaded: boolean;
  sessionTraceLoaded: boolean;
  publicationSummary: PublicationSummaryResponse | null;
  approvalGateState: ApprovalGateStateSummaryResponse | null;
}) {
  const publicationReviewCount = publicationSummary
    ? publicationSummary.summary.drafts.length +
      publicationSummary.summary.approved_previews.length +
      publicationSummary.summary.failed.length +
      publicationSummary.summary.failed_deliveries.length
    : null;
  const approvalGateReviewCount = approvalGateState
    ? approvalGateState.counts.requested_count +
      approvalGateState.counts.blocked_count +
      approvalGateState.counts.ready_for_review_count +
      approvalGateState.counts.dry_run_ready_count
    : null;

  return (
    <section
      className="cockpit-surface-card operator-handoff-snapshot"
      aria-label="Operator Handoff Snapshot"
    >
      <PanelHeader
        eyebrow="Operator handoff"
        title="Operator Handoff Snapshot"
        description="Local review state for the current operator handoff. This is read-only and does not post, approve, merge, publish, or execute."
      />
      <div className="operator-handoff-snapshot-grid">
        <MetricCard
          label="Pending local proposals"
          value={pendingDecisionCount}
          detail={
            pendingDecisionCount === 0
              ? "No pending proposals"
              : `${pendingDecisionCount} pending proposals`
          }
        />
        <MetricCard
          label="Mailbox review queue"
          value={mailboxReviewCount}
          detail={
            mailboxReviewCount === 0
              ? "No mailbox review items"
              : `${mailboxReviewCount} mailbox review items`
          }
        />
        <MetricCard
          label="Evidence Pack"
          value={evidencePackLoaded ? "Loaded" : "Not loaded"}
          detail="local review material"
        />
        <MetricCard
          label="Session Trace"
          value={sessionTraceLoaded ? "Loaded" : "Not loaded"}
          detail="local session context"
        />
        <MetricCard
          label="Publication review"
          value={
            publicationReviewCount === null
              ? "Not loaded"
              : `${publicationReviewCount} publication review items`
          }
          detail="drafts, previews, failures"
        />
        <MetricCard
          label="Approval gate"
          value={
            approvalGateReviewCount === null
              ? "Not loaded"
              : `${approvalGateReviewCount} gate review items`
          }
          detail="requested and dry-run review"
        />
      </div>
      <div className="operator-handoff-next">
        <BoundaryNote tone="green">
          Safe next step: Review local proposals, handoffs, and dry-run material before any separate authority-gated action.
        </BoundaryNote>
        <BoundaryNote>
          Read-only snapshot. No GitHub posting, PR review creation, approval,
          merge, publication, provider call, Augnes mutation, or state commit/reject.
        </BoundaryNote>
      </div>
    </section>
  );
}

function AgResumeTargetPreviewPanel() {
  const [agResumePacketInput, setAgResumePacketInput] = useState("");
  const [agResumeLocalContextInput, setAgResumeLocalContextInput] = useState("");
  const [
    agResumePacketValidationResult,
    setAgResumePacketValidationResult,
  ] = useState<AgResumeTargetPreviewPanelResult | null>(null);
  const [
    agResumePacketValidationError,
    setAgResumePacketValidationError,
  ] = useState<string | null>(null);
  const [agResumePacketValidationBusy, setAgResumePacketValidationBusy] =
    useState(false);
  const [
    agResumeTargetPreviewResult,
    setAgResumeTargetPreviewResult,
  ] = useState<AgResumeTargetPreviewPanelResult | null>(null);
  const [
    agResumeTargetPreviewError,
    setAgResumeTargetPreviewError,
  ] = useState<string | null>(null);
  const [agResumeStrictTargetPreview, setAgResumeStrictTargetPreview] =
    useState(false);
  const [agResumeSkipPreflight, setAgResumeSkipPreflight] = useState(false);
  const [agResumeTargetPreviewBusy, setAgResumeTargetPreviewBusy] =
    useState(false);
  const agResumeRouteRequestIdRef = useRef(0);
  const agResumePacketInputError = [
    agResumePacketValidationError,
    agResumeTargetPreviewError,
  ].find((error) => isAgResumeFieldError(error, "AG Resume Packet JSON"));
  const agResumeLocalContextInputError = isAgResumeFieldError(
    agResumeTargetPreviewError,
    "Explicit Local B context JSON",
  )
    ? agResumeTargetPreviewError
    : null;
  const agResumePacketInputErrorId =
    agResumePacketInputError === agResumePacketValidationError
      ? "ag-resume-packet-validation-error"
      : agResumePacketInputError
        ? "ag-resume-target-preview-error"
        : null;

  function clearAgResumePanelResults() {
    setAgResumePacketValidationError(null);
    setAgResumePacketValidationResult(null);
    setAgResumeTargetPreviewError(null);
    setAgResumeTargetPreviewResult(null);
  }

  function loadSafeAgResumeExamplePacket() {
    setAgResumePacketInput(formatAgResumeExampleJson(SAFE_AG_RESUME_EXAMPLE_PACKET));
    clearAgResumePanelResults();
  }

  function loadSafeAgResumeExampleLocalContext() {
    setAgResumeLocalContextInput(
      formatAgResumeExampleJson(SAFE_AG_RESUME_EXAMPLE_LOCAL_CONTEXT),
    );
    setAgResumeTargetPreviewError(null);
    setAgResumeTargetPreviewResult(null);
  }

  function loadMalformedAgResumePacketJson() {
    setAgResumePacketInput(SAFE_AG_RESUME_MALFORMED_PACKET_JSON);
    clearAgResumePanelResults();
  }

  function loadMalformedAgResumeLocalContextJson() {
    setAgResumeLocalContextInput(SAFE_AG_RESUME_MALFORMED_LOCAL_CONTEXT_JSON);
    clearAgResumePanelResults();
  }

  function loadPreflightFailingAgResumePacketExample() {
    setAgResumePacketInput(
      formatAgResumeExampleJson(SAFE_AG_RESUME_PREFLIGHT_FAILING_PACKET),
    );
    clearAgResumePanelResults();
  }

  function clearAgResumeInputs() {
    agResumeRouteRequestIdRef.current += 1;
    setAgResumePacketInput("");
    setAgResumeLocalContextInput("");
    setAgResumePacketValidationError(null);
    setAgResumePacketValidationResult(null);
    setAgResumePacketValidationBusy(false);
    setAgResumeTargetPreviewError(null);
    setAgResumeTargetPreviewResult(null);
    setAgResumeTargetPreviewBusy(false);
    setAgResumeStrictTargetPreview(false);
    setAgResumeSkipPreflight(false);
  }

  async function handleAgResumePacketValidation() {
    setAgResumePacketValidationError(null);
    setAgResumePacketValidationResult(null);

    let packet: Record<string, unknown>;
    try {
      packet = parseAgResumeObjectInput(
        "AG Resume Packet JSON",
        agResumePacketInput,
      );
    } catch (error) {
      setAgResumePacketValidationError(
        error instanceof Error ? error.message : String(error),
      );
      return;
    }

    const requestId = agResumeRouteRequestIdRef.current + 1;
    agResumeRouteRequestIdRef.current = requestId;
    setAgResumePacketValidationBusy(true);
    try {
      const response = await fetch("/api/ag-work-resume/target-preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          packet,
          local: null,
          strict: true,
          skip_preflight: false,
        }),
      });
      const bodyText = await response.text();
      const parsedBody = bodyText.trim().length > 0 ? JSON.parse(bodyText) : null;

      if (!isAgResumeRecord(parsedBody)) {
        throw new Error(
          "Packet validation route returned a non-object JSON response.",
        );
      }

      if (agResumeRouteRequestIdRef.current !== requestId) return;

      const body = parsedBody as AgResumeTargetPreviewRouteResponse;
      setAgResumePacketValidationResult({
        httpStatus: response.status,
        body,
      });

      if (!response.ok && body.error) {
        setAgResumePacketValidationError(body.error);
      }
    } catch (error) {
      if (agResumeRouteRequestIdRef.current === requestId) {
        setAgResumePacketValidationError(
          error instanceof Error ? error.message : String(error),
        );
      }
    } finally {
      if (agResumeRouteRequestIdRef.current === requestId) {
        setAgResumePacketValidationBusy(false);
      }
    }
  }

  async function handleAgResumeTargetPreviewSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setAgResumeTargetPreviewError(null);
    setAgResumeTargetPreviewResult(null);

    let packet: Record<string, unknown>;
    let local: Record<string, unknown> | null;
    try {
      packet = parseAgResumeObjectInput(
        "AG Resume Packet JSON",
        agResumePacketInput,
      );
      local = parseAgResumeObjectInput(
        "Explicit Local B context JSON",
        agResumeLocalContextInput,
        { allowEmpty: true },
      );
    } catch (error) {
      setAgResumeTargetPreviewError(
        error instanceof Error ? error.message : String(error),
      );
      return;
    }

    const requestId = agResumeRouteRequestIdRef.current + 1;
    agResumeRouteRequestIdRef.current = requestId;
    setAgResumeTargetPreviewBusy(true);
    try {
      const response = await fetch("/api/ag-work-resume/target-preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          packet,
          local,
          strict: agResumeStrictTargetPreview,
          skip_preflight: agResumeSkipPreflight,
        }),
      });
      const bodyText = await response.text();
      const parsedBody = bodyText.trim().length > 0 ? JSON.parse(bodyText) : null;

      if (!isAgResumeRecord(parsedBody)) {
        throw new Error("Target preview route returned a non-object JSON response.");
      }

      if (agResumeRouteRequestIdRef.current !== requestId) return;

      const body = parsedBody as AgResumeTargetPreviewRouteResponse;
      setAgResumeTargetPreviewResult({
        httpStatus: response.status,
        body,
      });

      if (!response.ok && body.error) {
        setAgResumeTargetPreviewError(body.error);
      }
    } catch (error) {
      if (agResumeRouteRequestIdRef.current === requestId) {
        setAgResumeTargetPreviewError(
          error instanceof Error ? error.message : String(error),
        );
      }
    } finally {
      if (agResumeRouteRequestIdRef.current === requestId) {
        setAgResumeTargetPreviewBusy(false);
      }
    }
  }

  return (
    <section
      className="cockpit-surface-card ag-resume-target-preview-panel"
      aria-label="AG Resume Target Preview"
      aria-busy={
        agResumeTargetPreviewBusy || agResumePacketValidationBusy
          ? true
          : undefined
      }
    >
      <PanelHeader
        eyebrow="AG resume"
        title="AG Resume Target Preview"
        description="Read-only Local B review for an already built AG Resume Packet and explicit local context."
      />
      <BoundaryNote tone="green">
        <ul className="boundary-list">
          <li>Read-only target preview.</li>
          <li>Uses an already built packet and explicit Local B context.</li>
          <li>
            No import/persist/work item/mapping/proof/evidence/session/Codex
            execution/approval/publish/retry/replay/merge/state mutation.
          </li>
          <li>
            ok_to_continue means user/Core review only. OK only for user/Core
            review. This is not Codex execution authority.
          </li>
          <li>
            Foreign refs remain foreign until user/Core confirms mapping and
            separate authority choices.
          </li>
        </ul>
      </BoundaryNote>
      <form
        className="observe-form"
        onSubmit={handleAgResumeTargetPreviewSubmit}
      >
        <div
          role="group"
          aria-labelledby="ag-resume-safe-fixtures-heading"
        >
          <h3 id="ag-resume-safe-fixtures-heading">
            Safe example fixture controls
          </h3>
          <BoundaryNote>
            Safe example fixtures are synthetic, public-safe, local UI state only,
            and not persisted.
          </BoundaryNote>
          <div className="action-controls">
            <button
              type="button"
              className="secondary-button"
              onClick={loadSafeAgResumeExamplePacket}
              disabled={agResumeTargetPreviewBusy || agResumePacketValidationBusy}
            >
              Load safe example packet
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={loadSafeAgResumeExampleLocalContext}
              disabled={agResumeTargetPreviewBusy || agResumePacketValidationBusy}
            >
              Load safe example Local B context
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={clearAgResumeInputs}
            >
              Clear AG resume inputs
            </button>
          </div>
        </div>
        <div
          role="group"
          aria-labelledby="ag-resume-error-fixtures-heading"
        >
          <h3 id="ag-resume-error-fixtures-heading">
            Error-state fixture controls
          </h3>
          <BoundaryNote>
            Error fixtures are local-only and synthetic. They are for checking
            safe failure states, not for import or execution.
          </BoundaryNote>
          <div className="action-controls">
            <button
              type="button"
              className="secondary-button"
              onClick={loadMalformedAgResumePacketJson}
              disabled={agResumeTargetPreviewBusy || agResumePacketValidationBusy}
            >
              Load malformed packet JSON
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={loadMalformedAgResumeLocalContextJson}
              disabled={agResumeTargetPreviewBusy || agResumePacketValidationBusy}
            >
              Load malformed Local B context JSON
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={loadPreflightFailingAgResumePacketExample}
              disabled={agResumeTargetPreviewBusy || agResumePacketValidationBusy}
            >
              Load preflight-failing packet example
            </button>
          </div>
        </div>
        <label htmlFor="ag-resume-packet-json-input">
          AG Resume Packet JSON
        </label>
        <p id="ag-resume-packet-json-help" className="notice">
          Paste one already built AG Resume Packet JSON object. Invalid JSON is rejected locally before route calls.
        </p>
        <textarea
          id="ag-resume-packet-json-input"
          value={agResumePacketInput}
          onChange={(event) => setAgResumePacketInput(event.target.value)}
          rows={10}
          spellCheck={false}
          aria-describedby={
            agResumePacketInputErrorId
              ? `ag-resume-packet-json-help ${agResumePacketInputErrorId}`
              : "ag-resume-packet-json-help"
          }
          aria-invalid={agResumePacketInputError ? true : undefined}
          placeholder='{"schema":"augnes.ag_work_resume_packet.v0_2","packet_id":"..."}'
        />
        <label htmlFor="ag-resume-local-context-json-input">
          Explicit Local B context JSON
        </label>
        <p id="ag-resume-local-context-json-help" className="notice">
          Optional explicit Local B context JSON object. Empty input sends
          local: null.
        </p>
        <textarea
          id="ag-resume-local-context-json-input"
          value={agResumeLocalContextInput}
          onChange={(event) =>
            setAgResumeLocalContextInput(event.target.value)
          }
          rows={8}
          spellCheck={false}
          aria-describedby={
            agResumeLocalContextInputError
              ? "ag-resume-local-context-json-help ag-resume-target-preview-error"
              : "ag-resume-local-context-json-help"
          }
          aria-invalid={agResumeLocalContextInputError ? true : undefined}
          placeholder='Leave empty to send local: null, or paste {"runtime":{},"repo":{},"known_local_work_mappings":[]}'
        />
        <div
          role="group"
          aria-labelledby="ag-resume-target-preview-options-heading"
        >
          <h3 id="ag-resume-target-preview-options-heading">
            Target preview options
          </h3>
          <div className="evidence-pack-grid">
            <label className="evidence-pack-card">
              <span>
                <input
                  type="checkbox"
                  checked={agResumeStrictTargetPreview}
                  onChange={(event) =>
                    setAgResumeStrictTargetPreview(event.target.checked)
                  }
                />{" "}
                Strict target preview
              </span>
              <p>
                request field: <code>strict</code>
              </p>
              <p>Treat dirty worktree / repo gaps more conservatively.</p>
            </label>
            <label className="evidence-pack-card">
              <span>
                <input
                  type="checkbox"
                  checked={agResumeSkipPreflight}
                  onChange={(event) =>
                    setAgResumeSkipPreflight(event.target.checked)
                  }
                />{" "}
                Skip packet preflight
              </span>
              <p>
                request field: <code>skip_preflight</code>
              </p>
              <p>Debug only; not recommended before relying on a preview.</p>
            </label>
          </div>
        </div>
        {agResumeSkipPreflight ? (
          <BoundaryNote>
            Debug only; run ag:resume-preflight before relying on this preview.
          </BoundaryNote>
        ) : null}
        <div
          role="group"
          aria-labelledby="ag-resume-validation-controls-heading"
        >
          <h3 id="ag-resume-validation-controls-heading">
            Copied-packet validation controls
          </h3>
          <BoundaryNote>
            Packet validation uses local: null and always runs strict preflight.
            It does not map, import, persist, or authorize implementation.
          </BoundaryNote>
          <div className="form-row">
            <button
              type="button"
              className="secondary-button"
              onClick={handleAgResumePacketValidation}
              disabled={
                agResumeTargetPreviewBusy ||
                agResumePacketValidationBusy ||
                !agResumePacketInput.trim()
              }
            >
              {agResumePacketValidationBusy
                ? "Validating pasted packet"
                : "Validate pasted packet only"}
            </button>
            {agResumePacketValidationError ? (
              <span
                id="ag-resume-packet-validation-error"
                className="notice error"
                role="alert"
              >
                Packet validation error: {agResumePacketValidationError}
              </span>
            ) : null}
          </div>
        </div>
        {agResumePacketValidationResult ? (
          <AgResumePacketValidationResults
            result={agResumePacketValidationResult}
          />
        ) : null}
        <div
          role="group"
          aria-labelledby="ag-resume-full-preview-controls-heading"
        >
          <h3 id="ag-resume-full-preview-controls-heading">
            Full target preview controls
          </h3>
          <div className="form-row">
            <button
              type="submit"
              disabled={
                agResumeTargetPreviewBusy ||
                agResumePacketValidationBusy ||
                !agResumePacketInput.trim()
              }
            >
              {agResumeTargetPreviewBusy
                ? "Previewing target"
                : "Run read-only target preview"}
            </button>
            {agResumeTargetPreviewError ? (
              <span
                id="ag-resume-target-preview-error"
                className="notice error"
                role="alert"
              >
                Target preview error: {agResumeTargetPreviewError}
              </span>
            ) : null}
          </div>
        </div>
      </form>
      {agResumeTargetPreviewResult ? (
        <AgResumeTargetPreviewResults result={agResumeTargetPreviewResult} />
      ) : (
        <EmptyState
          label="No target preview yet."
          description="Paste packet JSON and optional Local B context JSON to inspect a read-only route response."
        />
      )}
    </section>
  );
}

function AgResumeMappingProposalPreviewPanel() {
  const [
    agResumeMappingPacketInput,
    setAgResumeMappingPacketInput,
  ] = useState("");
  const [
    agResumeMappingCandidatesInput,
    setAgResumeMappingCandidatesInput,
  ] = useState("");
  const [
    agResumeMappingSelectedCandidateId,
    setAgResumeMappingSelectedCandidateId,
  ] = useState("");
  const [
    agResumeMappingStrictPreview,
    setAgResumeMappingStrictPreview,
  ] = useState(false);
  const [
    agResumeMappingProposalResult,
    setAgResumeMappingProposalResult,
  ] = useState<AgResumeMappingProposalPanelResult | null>(null);
  const [
    agResumeMappingPacketError,
    setAgResumeMappingPacketError,
  ] = useState<string | null>(null);
  const [
    agResumeMappingCandidatesError,
    setAgResumeMappingCandidatesError,
  ] = useState<string | null>(null);
  const [
    agResumeMappingRouteError,
    setAgResumeMappingRouteError,
  ] = useState<string | null>(null);
  const [
    agResumeMappingProposalBusy,
    setAgResumeMappingProposalBusy,
  ] = useState(false);
  const agResumeMappingRouteRequestIdRef = useRef(0);

  function clearAgResumeMappingResultState() {
    setAgResumeMappingPacketError(null);
    setAgResumeMappingCandidatesError(null);
    setAgResumeMappingRouteError(null);
    setAgResumeMappingProposalResult(null);
  }

  function loadSafeAgResumeMappingExamplePacket() {
    setAgResumeMappingPacketInput(
      formatAgResumeExampleJson(SAFE_AG_RESUME_MAPPING_EXAMPLE_PACKET),
    );
    clearAgResumeMappingResultState();
  }

  function loadSafeAgResumeMappingExampleCandidates() {
    setAgResumeMappingCandidatesInput(
      formatAgResumeExampleJson(SAFE_AG_RESUME_MAPPING_EXAMPLE_CANDIDATES),
    );
    setAgResumeMappingSelectedCandidateId(
      SAFE_AG_RESUME_MAPPING_EXAMPLE_CANDIDATES[0].candidate_id,
    );
    clearAgResumeMappingResultState();
  }

  function loadNoCandidateAgResumeMappingExample() {
    setAgResumeMappingPacketInput(
      formatAgResumeExampleJson(SAFE_AG_RESUME_MAPPING_EXAMPLE_PACKET),
    );
    setAgResumeMappingCandidatesInput("");
    setAgResumeMappingSelectedCandidateId("");
    clearAgResumeMappingResultState();
  }

  function loadConflictingAgResumeMappingCandidateExample() {
    setAgResumeMappingPacketInput(
      formatAgResumeExampleJson(SAFE_AG_RESUME_MAPPING_EXAMPLE_PACKET),
    );
    setAgResumeMappingCandidatesInput(
      formatAgResumeExampleJson(SAFE_AG_RESUME_MAPPING_CONFLICTING_CANDIDATES),
    );
    setAgResumeMappingSelectedCandidateId(
      SAFE_AG_RESUME_MAPPING_CONFLICTING_CANDIDATES[0].candidate_id,
    );
    clearAgResumeMappingResultState();
  }

  function loadPreflightFailingAgResumeMappingPacket() {
    setAgResumeMappingPacketInput(
      formatAgResumeExampleJson(SAFE_AG_RESUME_MAPPING_PREFLIGHT_FAILING_PACKET),
    );
    clearAgResumeMappingResultState();
  }

  function clearAgResumeMappingProposalInputs() {
    agResumeMappingRouteRequestIdRef.current += 1;
    setAgResumeMappingPacketInput("");
    setAgResumeMappingCandidatesInput("");
    setAgResumeMappingSelectedCandidateId("");
    setAgResumeMappingStrictPreview(false);
    setAgResumeMappingPacketError(null);
    setAgResumeMappingCandidatesError(null);
    setAgResumeMappingRouteError(null);
    setAgResumeMappingProposalResult(null);
    setAgResumeMappingProposalBusy(false);
  }

  async function handleAgResumeMappingProposalPreviewSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setAgResumeMappingPacketError(null);
    setAgResumeMappingCandidatesError(null);
    setAgResumeMappingRouteError(null);
    setAgResumeMappingProposalResult(null);

    let packet: Record<string, unknown>;
    let candidates: unknown[];
    try {
      packet = parseAgResumeObjectInput(
        "Mapping proposal packet JSON",
        agResumeMappingPacketInput,
      );
    } catch (error) {
      setAgResumeMappingPacketError(
        `Mapping packet error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return;
    }

    try {
      candidates = parseAgResumeArrayInput(
        "Local B candidate work items JSON",
        agResumeMappingCandidatesInput,
        { allowEmpty: true },
      );
    } catch (error) {
      setAgResumeMappingCandidatesError(
        `Mapping candidates error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return;
    }

    const selectedCandidateId = agResumeMappingSelectedCandidateId.trim() || null;
    const requestId = agResumeMappingRouteRequestIdRef.current + 1;
    agResumeMappingRouteRequestIdRef.current = requestId;
    setAgResumeMappingProposalBusy(true);

    try {
      const response = await fetch(
        "/api/ag-work-resume/mapping-proposal-preview",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            packet,
            candidates,
            selected_candidate_id: selectedCandidateId,
            strict: agResumeMappingStrictPreview,
            source: {
              reviewed_by_surface: "cockpit",
              reviewed_at: new Date().toISOString(),
            },
          }),
        },
      );
      const bodyText = await response.text();
      let parsedBody: unknown;
      try {
        parsedBody = bodyText.trim().length > 0 ? JSON.parse(bodyText) : null;
      } catch (error) {
        throw new Error(
          `Mapping proposal route returned a non-JSON response: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }

      if (!isAgResumeRecord(parsedBody)) {
        throw new Error("Mapping proposal route returned a non-object JSON response.");
      }

      if (agResumeMappingRouteRequestIdRef.current !== requestId) return;

      const body = parsedBody as AgResumeMappingProposalRouteResponse;
      setAgResumeMappingProposalResult({
        httpStatus: response.status,
        body,
      });

      if (!response.ok && body.error) {
        setAgResumeMappingRouteError(
          `Mapping proposal route error: ${body.error}`,
        );
      }
    } catch (error) {
      if (agResumeMappingRouteRequestIdRef.current === requestId) {
        setAgResumeMappingRouteError(
          `Mapping proposal route error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    } finally {
      if (agResumeMappingRouteRequestIdRef.current === requestId) {
        setAgResumeMappingProposalBusy(false);
      }
    }
  }

  return (
    <section
      className="cockpit-surface-card ag-resume-mapping-proposal-preview-panel"
      aria-label="AG Resume Mapping Proposal Preview"
      aria-busy={agResumeMappingProposalBusy ? true : undefined}
    >
      <PanelHeader
        eyebrow="AG resume"
        title="AG Resume Mapping Proposal Preview"
        description="Read-only proposal review over an already built AG Resume Packet and explicit Local B candidate work items."
      />
      <BoundaryNote tone="green">
        <ul className="boundary-list">
          <li>Read-only and proposal-only mapping proposal preview.</li>
          <li>Not mapping confirmation, not import authorization, and not persistence.</li>
          <li>
            Not proof/evidence authorization, not Codex execution authority,
            and not merge/publish authority.
          </li>
          <li>Durable approval remains user/Core gated.</li>
          <li>
            This panel does not run packet preflight; packet preflight should
            already have run.
          </li>
        </ul>
      </BoundaryNote>
      <form
        className="observe-form"
        onSubmit={handleAgResumeMappingProposalPreviewSubmit}
      >
        <div
          role="group"
          aria-labelledby="ag-resume-mapping-safe-fixtures-heading"
        >
          <h3 id="ag-resume-mapping-safe-fixtures-heading">
            Mapping safe fixture controls
          </h3>
          <BoundaryNote>
            Mapping safe fixtures are synthetic, public-safe, local React state
            only, and not persisted.
          </BoundaryNote>
          <div className="action-controls">
            <button
              type="button"
              className="secondary-button"
              onClick={loadSafeAgResumeMappingExamplePacket}
              disabled={agResumeMappingProposalBusy}
            >
              Load safe mapping example packet
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={loadSafeAgResumeMappingExampleCandidates}
              disabled={agResumeMappingProposalBusy}
            >
              Load safe mapping example candidates
            </button>
          </div>
        </div>
        <div
          role="group"
          aria-labelledby="ag-resume-mapping-edge-fixtures-heading"
        >
          <h3 id="ag-resume-mapping-edge-fixtures-heading">
            Mapping error/edge fixture controls
          </h3>
          <BoundaryNote>
            Edge fixtures are local-only and synthetic. They preview
            needs_candidate, conflict, and blocked states without write
            authority.
          </BoundaryNote>
          <div className="action-controls">
            <button
              type="button"
              className="secondary-button"
              onClick={loadNoCandidateAgResumeMappingExample}
              disabled={agResumeMappingProposalBusy}
            >
              Load no-candidate example
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={loadConflictingAgResumeMappingCandidateExample}
              disabled={agResumeMappingProposalBusy}
            >
              Load conflicting candidate example
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={loadPreflightFailingAgResumeMappingPacket}
              disabled={agResumeMappingProposalBusy}
            >
              Load preflight-failing mapping packet
            </button>
          </div>
        </div>
        <div
          role="group"
          aria-labelledby="ag-resume-mapping-inputs-heading"
        >
          <h3 id="ag-resume-mapping-inputs-heading">
            Mapping proposal input controls
          </h3>
          <label htmlFor="ag-resume-mapping-packet-json-input">
            Mapping proposal packet JSON
          </label>
          <p id="ag-resume-mapping-packet-json-help" className="notice">
            Paste an already built and preflighted AG Resume Packet. This panel does not run packet preflight.
          </p>
          <textarea
            id="ag-resume-mapping-packet-json-input"
            value={agResumeMappingPacketInput}
            onChange={(event) => setAgResumeMappingPacketInput(event.target.value)}
            rows={10}
            spellCheck={false}
            aria-describedby={
              agResumeMappingPacketError
                ? "ag-resume-mapping-packet-json-help ag-resume-mapping-packet-error"
                : "ag-resume-mapping-packet-json-help"
            }
            aria-invalid={agResumeMappingPacketError ? true : undefined}
            placeholder='{"schema":"augnes.ag_work_resume_packet.v0_2","packet_id":"..."}'
          />
          {agResumeMappingPacketError ? (
            <span
              id="ag-resume-mapping-packet-error"
              className="notice error"
              role="alert"
            >
              {agResumeMappingPacketError}
            </span>
          ) : null}
          <label htmlFor="ag-resume-mapping-candidates-json-input">
            Local B candidate work items JSON
          </label>
          <p id="ag-resume-mapping-candidates-json-help" className="notice">
            Paste explicit Local B candidate work items. This panel does not discover local work items.
          </p>
          <textarea
            id="ag-resume-mapping-candidates-json-input"
            value={agResumeMappingCandidatesInput}
            onChange={(event) =>
              setAgResumeMappingCandidatesInput(event.target.value)
            }
            rows={8}
            spellCheck={false}
            aria-describedby={
              agResumeMappingCandidatesError
                ? "ag-resume-mapping-candidates-json-help ag-resume-mapping-candidates-error"
                : "ag-resume-mapping-candidates-json-help"
            }
            aria-invalid={agResumeMappingCandidatesError ? true : undefined}
            placeholder='Leave empty to send [], or paste [{"candidate_id":"..."}]'
          />
          {agResumeMappingCandidatesError ? (
            <span
              id="ag-resume-mapping-candidates-error"
              className="notice error"
              role="alert"
            >
              {agResumeMappingCandidatesError}
            </span>
          ) : null}
          <label htmlFor="ag-resume-mapping-selected-candidate-id-input">
            Selected candidate id
          </label>
          <p
            id="ag-resume-mapping-selected-candidate-id-help"
            className="notice"
          >
            Leave empty to let the preview report needs_candidate when multiple candidates exist.
          </p>
          <input
            id="ag-resume-mapping-selected-candidate-id-input"
            value={agResumeMappingSelectedCandidateId}
            onChange={(event) =>
              setAgResumeMappingSelectedCandidateId(event.target.value)
            }
            aria-describedby="ag-resume-mapping-selected-candidate-id-help"
            placeholder="local-candidate-mapping-safe-1"
          />
        </div>
        <div
          role="group"
          aria-labelledby="ag-resume-mapping-options-heading"
        >
          <h3 id="ag-resume-mapping-options-heading">
            Mapping proposal options
          </h3>
          <div className="evidence-pack-grid">
            <div className="evidence-pack-card">
              <input
                id="ag-resume-mapping-strict-preview-input"
                type="checkbox"
                checked={agResumeMappingStrictPreview}
                onChange={(event) =>
                  setAgResumeMappingStrictPreview(event.target.checked)
                }
              />{" "}
              <label htmlFor="ag-resume-mapping-strict-preview-input">
                Strict mapping proposal preview
              </label>
              <p>
                request field: <code>strict</code>
              </p>
              <p>
                Treat repo gaps such as dirty worktree or missing expected files more conservatively.
              </p>
            </div>
          </div>
        </div>
        <div
          role="group"
          aria-labelledby="ag-resume-mapping-action-controls-heading"
        >
          <h3 id="ag-resume-mapping-action-controls-heading">
            Mapping proposal action controls
          </h3>
          <BoundaryNote>
            The preview action calls only the read-only mapping proposal route.
            Fixture buttons only update local React state.
          </BoundaryNote>
          <div className="form-row">
            <button
              type="button"
              className="secondary-button"
              onClick={clearAgResumeMappingProposalInputs}
            >
              Clear mapping proposal inputs
            </button>
            <button
              type="submit"
              disabled={
                agResumeMappingProposalBusy ||
                !agResumeMappingPacketInput.trim()
              }
            >
              {agResumeMappingProposalBusy
                ? "Previewing mapping proposal"
                : "Run read-only mapping proposal preview"}
            </button>
            {agResumeMappingRouteError ? (
              <span
                id="ag-resume-mapping-route-error"
                className="notice error"
                role="alert"
              >
                {agResumeMappingRouteError}
              </span>
            ) : null}
          </div>
        </div>
      </form>
      {agResumeMappingProposalResult ? (
        <AgResumeMappingProposalPreviewResults
          result={agResumeMappingProposalResult}
        />
      ) : (
        <EmptyState
          label="No mapping proposal preview yet."
          description="Paste packet JSON and explicit Local B candidate work items to inspect a read-only route response."
        />
      )}
    </section>
  );
}

function AgResumeMappingProposalRecordReviewPanel() {
  const [proposalId, setProposalId] = useState("");
  const [foreignScope, setForeignScope] = useState("");
  const [foreignWorkId, setForeignWorkId] = useState("");
  const [candidateLocalScope, setCandidateLocalScope] = useState("");
  const [candidateLocalWorkId, setCandidateLocalWorkId] = useState("");
  const [status, setStatus] = useState("");
  const [limit, setLimit] = useState<string>(
    SAFE_AG_RESUME_MAPPING_PROPOSAL_RECORD_REVIEW_FIXTURE.limit,
  );
  const [result, setResult] =
    useState<AgResumeMappingProposalRecordReadPanelResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const requestIdRef = useRef(0);

  function clearResultState() {
    setError(null);
    setResult(null);
  }

  function loadSafeProposalIdFixture() {
    setProposalId(SAFE_AG_RESUME_MAPPING_PROPOSAL_RECORD_REVIEW_FIXTURE.proposal_id);
    setForeignScope("");
    setForeignWorkId("");
    setCandidateLocalScope("");
    setCandidateLocalWorkId("");
    setStatus("");
    setLimit("");
    clearResultState();
  }

  function loadSafeForeignWorkFixture() {
    setProposalId("");
    setForeignScope(SAFE_AG_RESUME_MAPPING_PROPOSAL_RECORD_REVIEW_FIXTURE.foreign_scope);
    setForeignWorkId(SAFE_AG_RESUME_MAPPING_PROPOSAL_RECORD_REVIEW_FIXTURE.foreign_work_id);
    setCandidateLocalScope("");
    setCandidateLocalWorkId("");
    setStatus("");
    setLimit(SAFE_AG_RESUME_MAPPING_PROPOSAL_RECORD_REVIEW_FIXTURE.limit);
    clearResultState();
  }

  function loadSafeCandidateWorkFixture() {
    setProposalId("");
    setForeignScope("");
    setForeignWorkId("");
    setCandidateLocalScope(
      SAFE_AG_RESUME_MAPPING_PROPOSAL_RECORD_REVIEW_FIXTURE.candidate_local_scope,
    );
    setCandidateLocalWorkId(
      SAFE_AG_RESUME_MAPPING_PROPOSAL_RECORD_REVIEW_FIXTURE.candidate_local_work_id,
    );
    setStatus("");
    setLimit(SAFE_AG_RESUME_MAPPING_PROPOSAL_RECORD_REVIEW_FIXTURE.limit);
    clearResultState();
  }

  function loadSafeStatusFixture() {
    setProposalId("");
    setForeignScope("");
    setForeignWorkId("");
    setCandidateLocalScope("");
    setCandidateLocalWorkId("");
    setStatus(SAFE_AG_RESUME_MAPPING_PROPOSAL_RECORD_REVIEW_FIXTURE.status);
    setLimit(SAFE_AG_RESUME_MAPPING_PROPOSAL_RECORD_REVIEW_FIXTURE.limit);
    clearResultState();
  }

  function clearInputs() {
    requestIdRef.current += 1;
    setProposalId("");
    setForeignScope("");
    setForeignWorkId("");
    setCandidateLocalScope("");
    setCandidateLocalWorkId("");
    setStatus("");
    setLimit(SAFE_AG_RESUME_MAPPING_PROPOSAL_RECORD_REVIEW_FIXTURE.limit);
    setResult(null);
    setError(null);
    setBusy(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    let searchParams: URLSearchParams;
    try {
      searchParams = buildMappingProposalRecordReadSearchParams({
        proposalId,
        foreignScope,
        foreignWorkId,
        candidateLocalScope,
        candidateLocalWorkId,
        status,
        limit,
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : String(caughtError));
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setBusy(true);

    try {
      const response = await fetch(
        `/api/ag-work-resume/mapping-proposal-records?${searchParams.toString()}`,
        { method: "GET" },
      );
      const bodyText = await response.text();
      let parsedBody: unknown;
      try {
        parsedBody = bodyText.trim().length > 0 ? JSON.parse(bodyText) : null;
      } catch (caughtError) {
        throw new Error(
          `Mapping proposal record read route returned a non-JSON response: ${
            caughtError instanceof Error ? caughtError.message : String(caughtError)
          }`,
        );
      }

      if (!isAgResumeRecord(parsedBody)) {
        throw new Error(
          "Mapping proposal record read route returned a non-object JSON response.",
        );
      }

      if (requestIdRef.current !== requestId) return;

      const body = parsedBody as AgResumeMappingProposalRecordReadRouteResponse;
      setResult({
        httpStatus: response.status,
        body,
      });

      if (!response.ok) {
        const routeError =
          body.error ??
          body.result?.failures?.[0] ??
          body.result?.status ??
          "read failed";
        setError(`Mapping proposal record read route error: ${routeError}`);
      }
    } catch (caughtError) {
      if (requestIdRef.current === requestId) {
        setError(
          `Mapping proposal record read route error: ${
            caughtError instanceof Error ? caughtError.message : String(caughtError)
          }`,
        );
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setBusy(false);
      }
    }
  }

  return (
    <section
      className="cockpit-surface-card ag-resume-mapping-proposal-record-review-panel"
      aria-label="AG Resume Mapping Proposal Record Review"
      aria-busy={busy ? true : undefined}
    >
      <PanelHeader
        eyebrow="AG resume"
        title="AG Resume Mapping Proposal Record Review"
        description="Read-only review over stored Stage B mapping proposal records."
      />
      <BoundaryNote tone="green">
        <ul className="boundary-list">
          <li>Read-only proposal record review metadata.</li>
          <li>
            Reads only through the existing GET mapping proposal records route.
          </li>
          <li>
            No create/write affordance, update route, lifecycle mutation,
            confirmed mapping, import, proof/evidence, session binding, Codex
            execution, approval, publish, retry, replay, or merge authority.
          </li>
          <li>Durable approval remains user/Core gated.</li>
        </ul>
      </BoundaryNote>
      <form className="observe-form" onSubmit={handleSubmit}>
        <div
          role="group"
          aria-labelledby="ag-resume-mapping-record-safe-fixtures-heading"
        >
          <h3 id="ag-resume-mapping-record-safe-fixtures-heading">
            Proposal record safe fixture controls
          </h3>
          <BoundaryNote>
            Fixture buttons load synthetic public-safe lookup filters into local
            React state only. They do not create rows, update rows, call routes,
            or persist browser state.
          </BoundaryNote>
          <div className="action-controls">
            <button
              type="button"
              className="secondary-button"
              onClick={loadSafeProposalIdFixture}
              disabled={busy}
            >
              Load safe proposal id lookup
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={loadSafeForeignWorkFixture}
              disabled={busy}
            >
              Load safe foreign work lookup
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={loadSafeCandidateWorkFixture}
              disabled={busy}
            >
              Load safe candidate work lookup
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={loadSafeStatusFixture}
              disabled={busy}
            >
              Load safe status lookup
            </button>
          </div>
        </div>
        <div
          role="group"
          aria-labelledby="ag-resume-mapping-record-inputs-heading"
        >
          <h3 id="ag-resume-mapping-record-inputs-heading">
            Proposal record lookup inputs
          </h3>
          <label htmlFor="ag-resume-mapping-record-proposal-id-input">
            proposal_id
          </label>
          <p id="ag-resume-mapping-record-proposal-id-help" className="notice">
            Fetches one proposal record. Leave every list filter and limit empty
            when using proposal_id.
          </p>
          <input
            id="ag-resume-mapping-record-proposal-id-input"
            value={proposalId}
            onChange={(event) => setProposalId(event.target.value)}
            aria-describedby="ag-resume-mapping-record-proposal-id-help"
            placeholder="ag-resume-mapping-proposal:..."
          />
          <div className="evidence-pack-grid">
            <section className="evidence-pack-card">
              <h3>Foreign work filter</h3>
              <label htmlFor="ag-resume-mapping-record-foreign-scope-input">
                foreign_scope
              </label>
              <input
                id="ag-resume-mapping-record-foreign-scope-input"
                value={foreignScope}
                onChange={(event) => setForeignScope(event.target.value)}
                aria-describedby="ag-resume-mapping-record-foreign-filter-help"
                placeholder="project:augnes"
              />
              <label htmlFor="ag-resume-mapping-record-foreign-work-id-input">
                foreign_work_id
              </label>
              <input
                id="ag-resume-mapping-record-foreign-work-id-input"
                value={foreignWorkId}
                onChange={(event) => setForeignWorkId(event.target.value)}
                aria-describedby="ag-resume-mapping-record-foreign-filter-help"
                placeholder="AG-..."
              />
              <p
                id="ag-resume-mapping-record-foreign-filter-help"
                className="notice"
              >
                Both foreign_scope and foreign_work_id are required for this
                list filter.
              </p>
            </section>
            <section className="evidence-pack-card">
              <h3>Candidate local work filter</h3>
              <label htmlFor="ag-resume-mapping-record-candidate-local-scope-input">
                candidate_local_scope
              </label>
              <input
                id="ag-resume-mapping-record-candidate-local-scope-input"
                value={candidateLocalScope}
                onChange={(event) => setCandidateLocalScope(event.target.value)}
                aria-describedby="ag-resume-mapping-record-candidate-filter-help"
                placeholder="project:augnes"
              />
              <label htmlFor="ag-resume-mapping-record-candidate-local-work-id-input">
                candidate_local_work_id
              </label>
              <input
                id="ag-resume-mapping-record-candidate-local-work-id-input"
                value={candidateLocalWorkId}
                onChange={(event) => setCandidateLocalWorkId(event.target.value)}
                aria-describedby="ag-resume-mapping-record-candidate-filter-help"
                placeholder="AG-..."
              />
              <p
                id="ag-resume-mapping-record-candidate-filter-help"
                className="notice"
              >
                Both candidate_local_scope and candidate_local_work_id are
                required for this list filter.
              </p>
            </section>
            <section className="evidence-pack-card">
              <h3>Status and limit filter</h3>
              <label htmlFor="ag-resume-mapping-record-status-input">
                status
              </label>
              <select
                id="ag-resume-mapping-record-status-input"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                aria-describedby="ag-resume-mapping-record-status-limit-help"
              >
                <option value="">Any status filter omitted</option>
                <option value="proposed">proposed</option>
                <option value="needs_review">needs_review</option>
                <option value="superseded">superseded</option>
                <option value="withdrawn">withdrawn</option>
                <option value="rejected">rejected</option>
                <option value="expired">expired</option>
              </select>
              <label htmlFor="ag-resume-mapping-record-limit-input">
                limit
              </label>
              <input
                id="ag-resume-mapping-record-limit-input"
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
                aria-describedby="ag-resume-mapping-record-status-limit-help"
                inputMode="numeric"
                placeholder="20"
              />
              <p
                id="ag-resume-mapping-record-status-limit-help"
                className="notice"
              >
                Limit applies to list reads only. The route caps large positive
                values.
              </p>
            </section>
          </div>
        </div>
        <div
          role="group"
          aria-labelledby="ag-resume-mapping-record-action-controls-heading"
        >
          <h3 id="ag-resume-mapping-record-action-controls-heading">
            Proposal record read controls
          </h3>
          <BoundaryNote>
            The read action calls only the existing GET proposal records route.
            It does not call POST and does not expose write controls.
          </BoundaryNote>
          <div className="form-row">
            <button
              type="button"
              className="secondary-button"
              onClick={clearInputs}
            >
              Clear proposal record inputs
            </button>
            <button type="submit" disabled={busy}>
              {busy ? "Reading proposal records" : "Read proposal records"}
            </button>
          </div>
          {error ? (
            <span
              id="ag-resume-mapping-record-read-error"
              className="notice error"
              role="alert"
            >
              {error}
            </span>
          ) : null}
        </div>
      </form>
      {result ? (
        <AgResumeMappingProposalRecordReadResults result={result} />
      ) : (
        <EmptyState
          label="No proposal record read yet."
          description="Enter one supported lookup filter to read proposal review metadata."
        />
      )}
    </section>
  );
}

function AgResumeMappingProposalLifecycleActionPanel() {
  const [proposalId, setProposalId] = useState("");
  const [action, setAction] = useState("");
  const [reviewedBy, setReviewedBy] = useState<string>(
    SAFE_AG_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_FIXTURE.reviewed_by,
  );
  const [reviewNote, setReviewNote] = useState("");
  const [reviewedAt, setReviewedAt] = useState("");
  const [replacementProposalId, setReplacementProposalId] = useState("");
  const [result, setResult] =
    useState<AgResumeMappingProposalLifecycleActionPanelResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const requestIdRef = useRef(0);

  function clearResultState() {
    setError(null);
    setResult(null);
  }

  function loadSafeLifecycleActionFixture(
    nextAction: AgResumeMappingProposalLifecycleAction,
  ) {
    setProposalId(
      SAFE_AG_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_FIXTURE.proposal_ids[
        nextAction
      ],
    );
    setAction(nextAction);
    setReviewedBy(
      SAFE_AG_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_FIXTURE.reviewed_by,
    );
    setReviewNote(
      `${SAFE_AG_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_FIXTURE.review_note} Action: ${nextAction}.`,
    );
    setReviewedAt(
      SAFE_AG_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_FIXTURE.reviewed_at,
    );
    setReplacementProposalId(
      nextAction === "supersede"
        ? SAFE_AG_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_FIXTURE.replacement_proposal_id
        : "",
    );
    clearResultState();
  }

  function clearLifecycleActionInputs() {
    requestIdRef.current += 1;
    setProposalId("");
    setAction("");
    setReviewedBy(
      SAFE_AG_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_FIXTURE.reviewed_by,
    );
    setReviewNote("");
    setReviewedAt("");
    setReplacementProposalId("");
    setResult(null);
    setError(null);
    setBusy(false);
  }

  async function handleLifecycleActionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    let requestBody: AgResumeMappingProposalLifecycleActionRequestBody;
    try {
      requestBody = buildMappingProposalLifecycleActionRequestBody({
        proposalId,
        action,
        reviewedBy,
        reviewNote,
        reviewedAt,
        replacementProposalId,
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : String(caughtError));
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setBusy(true);

    try {
      const response = await fetch(
        "/api/ag-work-resume/mapping-proposal-records/lifecycle-actions",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(requestBody),
        },
      );
      const bodyText = await response.text();
      let parsedBody: unknown;
      try {
        parsedBody = bodyText.trim().length > 0 ? JSON.parse(bodyText) : null;
      } catch (caughtError) {
        throw new Error(
          `Mapping proposal lifecycle action route returned a non-JSON response: ${
            caughtError instanceof Error ? caughtError.message : String(caughtError)
          }`,
        );
      }

      if (!isAgResumeRecord(parsedBody)) {
        throw new Error(
          "Mapping proposal lifecycle action route returned a non-object JSON response.",
        );
      }

      if (requestIdRef.current !== requestId) return;

      const body =
        parsedBody as AgResumeMappingProposalLifecycleActionRouteResponse;
      setResult({
        httpStatus: response.status,
        requestBody,
        body,
      });

      if (!response.ok) {
        const routeError =
          body.error ??
          body.result?.failures?.[0] ??
          body.result?.status ??
          "lifecycle action failed";
        setError(`Mapping proposal lifecycle action route error: ${routeError}`);
      }
    } catch (caughtError) {
      if (requestIdRef.current === requestId) {
        setError(
          `Mapping proposal lifecycle action route error: ${
            caughtError instanceof Error ? caughtError.message : String(caughtError)
          }`,
        );
      }
    } finally {
      if (requestIdRef.current === requestId) {
        setBusy(false);
      }
    }
  }

  return (
    <section
      className="cockpit-surface-card ag-resume-mapping-proposal-lifecycle-action-panel"
      aria-label="AG Resume Mapping Proposal Lifecycle Actions"
      aria-busy={busy ? true : undefined}
    >
      <PanelHeader
        eyebrow="AG resume"
        title="AG Resume Mapping Proposal Lifecycle Actions"
        description="Bounded Cockpit controls for existing proposal review metadata."
      />
      <BoundaryNote tone="green">
        <ul className="boundary-list">
          <li>
            Lifecycle updates are proposal review metadata only on existing
            Stage B proposal records.
          </li>
          <li>
            The action submits JSON only to the existing POST lifecycle action
            route.
          </li>
          <li>
            No proposal creation, replacement proposal creation, confirmed
            mapping, import, proof/evidence, session binding, Codex execution,
            approval, publish, retry, replay, or merge authority.
          </li>
          <li>Durable approval remains user/Core gated.</li>
        </ul>
      </BoundaryNote>
      <form className="observe-form" onSubmit={handleLifecycleActionSubmit}>
        <div
          role="group"
          aria-labelledby="ag-resume-mapping-proposal-lifecycle-safe-fixtures-heading"
        >
          <h3 id="ag-resume-mapping-proposal-lifecycle-safe-fixtures-heading">
            Proposal lifecycle safe fixture controls
          </h3>
          <BoundaryNote>
            Fixture buttons load synthetic public-safe lifecycle values into
            local React state only. They do not create rows, update rows, call
            routes, or persist browser state.
          </BoundaryNote>
          <div className="action-controls">
            <button
              type="button"
              className="secondary-button"
              onClick={() => loadSafeLifecycleActionFixture("withdraw")}
              disabled={busy}
            >
              Load safe withdraw action
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => loadSafeLifecycleActionFixture("reject")}
              disabled={busy}
            >
              Load safe reject action
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => loadSafeLifecycleActionFixture("supersede")}
              disabled={busy}
            >
              Load safe supersede action
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => loadSafeLifecycleActionFixture("expire")}
              disabled={busy}
            >
              Load safe expire action
            </button>
          </div>
        </div>
        <div
          role="group"
          aria-labelledby="ag-resume-mapping-proposal-lifecycle-inputs-heading"
        >
          <h3 id="ag-resume-mapping-proposal-lifecycle-inputs-heading">
            Proposal lifecycle action inputs
          </h3>
          <label htmlFor="ag-resume-mapping-proposal-lifecycle-proposal-id-input">
            proposal_id
          </label>
          <p
            id="ag-resume-mapping-proposal-lifecycle-proposal-id-help"
            className="notice"
          >
            Existing active proposal record to move through withdraw, reject,
            supersede, or expire review metadata.
          </p>
          <input
            id="ag-resume-mapping-proposal-lifecycle-proposal-id-input"
            value={proposalId}
            onChange={(event) => setProposalId(event.target.value)}
            aria-describedby="ag-resume-mapping-proposal-lifecycle-proposal-id-help"
            placeholder="ag-resume-mapping-proposal:..."
          />
          <div className="evidence-pack-grid">
            <section className="evidence-pack-card">
              <h3>Lifecycle action</h3>
              <label htmlFor="ag-resume-mapping-proposal-lifecycle-action-input">
                action
              </label>
              <select
                id="ag-resume-mapping-proposal-lifecycle-action-input"
                value={action}
                onChange={(event) => setAction(event.target.value)}
                aria-describedby="ag-resume-mapping-proposal-lifecycle-action-help"
              >
                <option value="">Select lifecycle action</option>
                <option value="withdraw">withdraw</option>
                <option value="reject">reject</option>
                <option value="supersede">supersede</option>
                <option value="expire">expire</option>
              </select>
              <p
                id="ag-resume-mapping-proposal-lifecycle-action-help"
                className="notice"
              >
                Allowed actions only move proposal lifecycle/review metadata.
              </p>
            </section>
            <section className="evidence-pack-card">
              <h3>Review metadata</h3>
              <label htmlFor="ag-resume-mapping-proposal-lifecycle-reviewed-by-input">
                reviewed_by
              </label>
              <input
                id="ag-resume-mapping-proposal-lifecycle-reviewed-by-input"
                value={reviewedBy}
                onChange={(event) => setReviewedBy(event.target.value)}
                aria-describedby="ag-resume-mapping-proposal-lifecycle-review-help"
                placeholder="user-core:..."
              />
              <label htmlFor="ag-resume-mapping-proposal-lifecycle-review-note-input">
                review_note
              </label>
              <textarea
                id="ag-resume-mapping-proposal-lifecycle-review-note-input"
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                aria-describedby="ag-resume-mapping-proposal-lifecycle-review-help"
                rows={4}
                placeholder="Reason for the proposal lifecycle action"
              />
              <p
                id="ag-resume-mapping-proposal-lifecycle-review-help"
                className="notice"
              >
                reviewed_by and review_note are required proposal review
                metadata.
              </p>
            </section>
            <section className="evidence-pack-card">
              <h3>Optional fields</h3>
              <label htmlFor="ag-resume-mapping-proposal-lifecycle-reviewed-at-input">
                reviewed_at
              </label>
              <input
                id="ag-resume-mapping-proposal-lifecycle-reviewed-at-input"
                value={reviewedAt}
                onChange={(event) => setReviewedAt(event.target.value)}
                aria-describedby="ag-resume-mapping-proposal-lifecycle-optional-help"
                placeholder="2026-05-31T04:00:00.000Z"
              />
              <label htmlFor="ag-resume-mapping-proposal-lifecycle-replacement-proposal-id-input">
                replacement_proposal_id
              </label>
              <input
                id="ag-resume-mapping-proposal-lifecycle-replacement-proposal-id-input"
                value={replacementProposalId}
                onChange={(event) =>
                  setReplacementProposalId(event.target.value)
                }
                aria-describedby="ag-resume-mapping-proposal-lifecycle-optional-help"
                placeholder="ag-resume-mapping-proposal:..."
              />
              <p
                id="ag-resume-mapping-proposal-lifecycle-optional-help"
                className="notice"
              >
                reviewed_at must be ISO UTC when supplied.
                replacement_proposal_id is allowed only for supersede and does
                not create or update a replacement row.
              </p>
            </section>
          </div>
        </div>
        <div
          role="group"
          aria-labelledby="ag-resume-mapping-proposal-lifecycle-action-controls-heading"
        >
          <h3 id="ag-resume-mapping-proposal-lifecycle-action-controls-heading">
            Proposal lifecycle action controls
          </h3>
          <BoundaryNote>
            The action button calls only the existing POST lifecycle action
            route with JSON. It does not call proposal writer, read, import,
            work, proof/evidence, session, Codex, approval, publication,
            bridge, MCP/App, Direct Resume Code, or relay routes.
          </BoundaryNote>
          <div className="form-row">
            <button
              type="button"
              className="secondary-button"
              onClick={clearLifecycleActionInputs}
            >
              Clear lifecycle action inputs
            </button>
            <button type="submit" disabled={busy}>
              {busy ? "Applying lifecycle action" : "Apply lifecycle action"}
            </button>
          </div>
          {error ? (
            <span
              id="ag-resume-mapping-proposal-lifecycle-action-error"
              className="notice error"
              role="alert"
            >
              {error}
            </span>
          ) : null}
        </div>
      </form>
      {result ? (
        <AgResumeMappingProposalLifecycleActionResults result={result} />
      ) : (
        <EmptyState
          label="No proposal lifecycle action yet."
          description="Enter an existing proposal_id, action, reviewer, and review note to update proposal review metadata."
        />
      )}
    </section>
  );
}

function AgResumeMappingProposalLifecycleActionResults({
  result,
}: {
  result: AgResumeMappingProposalLifecycleActionPanelResult;
}) {
  const { body } = result;
  const actionResult = body.result ?? null;
  const authorityBoundary =
    body.authority_boundary ?? actionResult?.authority_boundary ?? null;

  return (
    <div
      aria-labelledby="ag-resume-mapping-proposal-lifecycle-action-result-heading"
      aria-live="polite"
    >
      <h3 id="ag-resume-mapping-proposal-lifecycle-action-result-heading">
        Mapping proposal lifecycle action result
      </h3>
      <BoundaryNote tone="green">
        Lifecycle action results are proposal review metadata only. They are not
        confirmed mappings, imports, proof/evidence authorization, session
        bindings, Codex execution authority, approval, publish, retry, replay,
        or merge authority.
      </BoundaryNote>
      {body.recommended_next_step ? (
        <BoundaryNote>
          route recommended_next_step: {body.recommended_next_step}
        </BoundaryNote>
      ) : null}
      {actionResult?.recommended_next_step ? (
        <BoundaryNote>
          lifecycle recommended_next_step: {actionResult.recommended_next_step}
        </BoundaryNote>
      ) : null}
      <div className="evidence-pack-grid">
        <section className="evidence-pack-card">
          <h3>HTTP Status</h3>
          <p>{result.httpStatus}</p>
          <small>mapping-proposal-records lifecycle POST route</small>
        </section>
        <section className="evidence-pack-card">
          <h3>Route ok</h3>
          <p>{formatAgResumeBoolean(body.ok)}</p>
          <small>{body.route ?? "route unknown"}</small>
        </section>
        <section className="evidence-pack-card">
          <h3>Lifecycle status</h3>
          <p>{actionResult?.status ?? body.error ?? "unknown"}</p>
          <small>updated/invalid_input/not_found/not_active/db_error</small>
        </section>
        <section className="evidence-pack-card">
          <h3>Action</h3>
          <p>{actionResult?.action ?? result.requestBody.action}</p>
          <small>withdraw/reject/supersede/expire</small>
        </section>
        <section className="evidence-pack-card">
          <h3>Proposal id</h3>
          <p>{actionResult?.proposal_id ?? result.requestBody.proposal_id}</p>
          <small>existing proposal review metadata row</small>
        </section>
        <section className="evidence-pack-card">
          <h3>Before/after status</h3>
          <p>
            {actionResult?.before_record?.status ?? "unknown"} {"->"}{" "}
            {actionResult?.record?.status ?? "unknown"}
          </p>
          <small>proposal lifecycle status only</small>
        </section>
      </div>
      <AgResumeStringList
        title="Updated fields"
        items={actionResult?.updated_fields ?? []}
        emptyLabel="No lifecycle fields updated."
      />
      <AgResumeStringList
        title="Warnings"
        items={actionResult?.warnings ?? []}
        emptyLabel="No lifecycle action warnings."
      />
      <AgResumeStringList
        title="Failures"
        items={actionResult?.failures ?? []}
        emptyLabel="No lifecycle action failures."
      />
      <AgResumeMappingProposalLifecycleActionAuthorityBoundary
        authorityBoundary={authorityBoundary}
      />
      <div className="evidence-pack-grid">
        <AgResumeMappingProposalLifecycleRecordSnapshot
          title="Before proposal record"
          record={actionResult?.before_record ?? null}
        />
        <AgResumeMappingProposalLifecycleRecordSnapshot
          title="After proposal record"
          record={actionResult?.record ?? null}
        />
      </div>
    </div>
  );
}

function AgResumeMappingProposalLifecycleRecordSnapshot({
  title,
  record,
}: {
  title: string;
  record: AgResumeMappingProposalRecord | null;
}) {
  return (
    <section className="evidence-pack-card evidence-pack-card-wide">
      <h3>{title}</h3>
      {record ? (
        <div className="meta-row">
          <span>proposal_id: {record.proposal_id ?? "unknown"}</span>
          <span>status: {record.status ?? "unknown"}</span>
          <span>reviewed_by: {record.reviewed_by ?? "none"}</span>
          <span>reviewed_at: {record.reviewed_at ?? "none"}</span>
          <span>review_note: {record.review_note ?? "none"}</span>
          <span>
            superseded_by_proposal_id:{" "}
            {record.superseded_by_proposal_id ?? "none"}
          </span>
          <span>updated_at: {record.updated_at ?? "unknown"}</span>
        </div>
      ) : (
        <EmptyState label={`No ${title.toLowerCase()} returned.`} />
      )}
    </section>
  );
}

function AgResumeMappingProposalLifecycleActionAuthorityBoundary({
  authorityBoundary,
}: {
  authorityBoundary: AgResumeMappingProposalLifecycleActionAuthorityBoundary | null;
}) {
  return (
    <section className="evidence-pack-card">
      <h3>Lifecycle Authority Boundary</h3>
      {authorityBoundary ? (
        <>
          <p>
            {authorityBoundary.statement ??
              "No lifecycle authority boundary statement returned."}
          </p>
          <div className="meta-row">
            <span>
              proposal_lifecycle_updated:{" "}
              {formatAgResumeBoolean(
                authorityBoundary.proposal_lifecycle_updated,
              )}
            </span>
            <span>
              proposal_review_metadata_only:{" "}
              {formatAgResumeBoolean(
                authorityBoundary.proposal_review_metadata_only,
              )}
            </span>
            <span>
              proposal_record_created:{" "}
              {formatAgResumeBoolean(authorityBoundary.proposal_record_created)}
            </span>
            <span>
              proposal_record_deleted:{" "}
              {formatAgResumeBoolean(authorityBoundary.proposal_record_deleted)}
            </span>
            <span>
              confirmed_mapping_created:{" "}
              {formatAgResumeBoolean(authorityBoundary.confirmed_mapping_created)}
            </span>
            <span>
              import_record_created:{" "}
              {formatAgResumeBoolean(authorityBoundary.import_record_created)}
            </span>
            <span>
              imported_context_created:{" "}
              {formatAgResumeBoolean(authorityBoundary.imported_context_created)}
            </span>
            <span>
              work_item_created:{" "}
              {formatAgResumeBoolean(authorityBoundary.work_item_created)}
            </span>
            <span>
              work_event_created:{" "}
              {formatAgResumeBoolean(authorityBoundary.work_event_created)}
            </span>
            <span>
              proof_recorded:{" "}
              {formatAgResumeBoolean(authorityBoundary.proof_recorded)}
            </span>
            <span>
              evidence_recorded:{" "}
              {formatAgResumeBoolean(authorityBoundary.evidence_recorded)}
            </span>
            <span>
              session_bound:{" "}
              {formatAgResumeBoolean(authorityBoundary.session_bound)}
            </span>
            <span>
              codex_executed:{" "}
              {formatAgResumeBoolean(authorityBoundary.codex_executed)}
            </span>
            <span>
              approval_granted:{" "}
              {formatAgResumeBoolean(authorityBoundary.approval_granted)}
            </span>
            <span>
              publish_retry_replay_authority:{" "}
              {formatAgResumeBoolean(
                authorityBoundary.publish_retry_replay_authority,
              )}
            </span>
            <span>
              merge_authority:{" "}
              {formatAgResumeBoolean(authorityBoundary.merge_authority)}
            </span>
          </div>
          <p>durable_approval: {authorityBoundary.durable_approval ?? "unknown"}</p>
        </>
      ) : (
        <EmptyState label="No lifecycle authority boundary returned." />
      )}
    </section>
  );
}

function AgResumeMappingProposalRecordReadResults({
  result,
}: {
  result: AgResumeMappingProposalRecordReadPanelResult;
}) {
  const { body } = result;
  const readResult = body.result ?? null;
  const records = readResult?.records ?? [];

  return (
    <div
      aria-labelledby="ag-resume-mapping-proposal-record-read-result-heading"
      aria-live="polite"
    >
      <h3 id="ag-resume-mapping-proposal-record-read-result-heading">
        Mapping proposal record read result
      </h3>
      <BoundaryNote tone="green">
        Proposal record reads are review metadata only. They are not confirmed
        mappings, imports, proof/evidence authorization, session bindings,
        Codex execution authority, or merge/publish authority.
      </BoundaryNote>
      {body.recommended_next_step ? (
        <BoundaryNote>route recommended_next_step: {body.recommended_next_step}</BoundaryNote>
      ) : null}
      {readResult?.recommended_next_step ? (
        <BoundaryNote>
          reader recommended_next_step: {readResult.recommended_next_step}
        </BoundaryNote>
      ) : null}
      <div className="evidence-pack-grid">
        <section className="evidence-pack-card">
          <h3>HTTP Status</h3>
          <p>{result.httpStatus}</p>
          <small>mapping-proposal-records GET route</small>
        </section>
        <section className="evidence-pack-card">
          <h3>Route ok</h3>
          <p>{formatAgResumeBoolean(body.ok)}</p>
          <small>{body.route ?? "route unknown"}</small>
        </section>
        <section className="evidence-pack-card">
          <h3>Read status</h3>
          <p>{readResult?.status ?? body.error ?? "unknown"}</p>
          <small>fetched/listed/not_found/invalid_input/db_error</small>
        </section>
        <section className="evidence-pack-card">
          <h3>Record count</h3>
          <p>{records.length}</p>
          <small>proposal review metadata records</small>
        </section>
        <section className="evidence-pack-card">
          <h3>Limit</h3>
          <p>{readResult?.limit ?? "single fetch or unavailable"}</p>
          <small>bounded list reads only</small>
        </section>
      </div>
      <AgResumeMappingProposalRecordReadFilters filters={readResult?.filters ?? null} />
      <AgResumeStringList
        title="Warnings"
        items={readResult?.warnings ?? []}
        emptyLabel="No proposal record read warnings."
      />
      <AgResumeStringList
        title="Failures"
        items={readResult?.failures ?? []}
        emptyLabel="No proposal record read failures."
      />
      <AgResumeMappingProposalRecordReadAuthorityBoundary
        authorityBoundary={readResult?.authority_boundary ?? null}
      />
      {records.length === 0 ? (
        <EmptyState
          label="No proposal records returned."
          description="The read route found no proposal review metadata for the supplied filter."
        />
      ) : (
        <div className="evidence-pack-grid">
          {records.map((record, index) => (
            <AgResumeMappingProposalRecordCard
              key={record.proposal_id ?? `proposal-record-${index}`}
              record={record}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AgResumeMappingProposalRecordReadFilters({
  filters,
}: {
  filters: AgResumeMappingProposalRecordReadResult["filters"] | null;
}) {
  return (
    <section className="evidence-pack-card">
      <h3>Applied filters</h3>
      <div className="meta-row">
        <span>proposal_id: {filters?.proposal_id ?? "none"}</span>
        <span>foreign_scope: {filters?.foreign_scope ?? "none"}</span>
        <span>foreign_work_id: {filters?.foreign_work_id ?? "none"}</span>
        <span>
          candidate_local_scope: {filters?.candidate_local_scope ?? "none"}
        </span>
        <span>
          candidate_local_work_id: {filters?.candidate_local_work_id ?? "none"}
        </span>
        <span>status: {filters?.status ?? "none"}</span>
      </div>
    </section>
  );
}

function AgResumeMappingProposalRecordReadAuthorityBoundary({
  authorityBoundary,
}: {
  authorityBoundary: AgResumeMappingProposalRecordReadAuthorityBoundary | null;
}) {
  return (
    <section className="evidence-pack-card">
      <h3>Read Authority Boundary</h3>
      {authorityBoundary ? (
        <>
          <p>{authorityBoundary.statement ?? "No read boundary statement returned."}</p>
          <div className="meta-row">
            <span>read_only: {formatAgResumeBoolean(authorityBoundary.read_only)}</span>
            <span>
              proposal_review_metadata_only:{" "}
              {formatAgResumeBoolean(authorityBoundary.proposal_review_metadata_only)}
            </span>
            <span>
              proposal_record_created:{" "}
              {formatAgResumeBoolean(authorityBoundary.proposal_record_created)}
            </span>
            <span>
              proposal_record_updated:{" "}
              {formatAgResumeBoolean(authorityBoundary.proposal_record_updated)}
            </span>
            <span>
              proposal_record_deleted:{" "}
              {formatAgResumeBoolean(authorityBoundary.proposal_record_deleted)}
            </span>
            <span>
              confirmed_mapping_created:{" "}
              {formatAgResumeBoolean(authorityBoundary.confirmed_mapping_created)}
            </span>
            <span>
              import_record_created:{" "}
              {formatAgResumeBoolean(authorityBoundary.import_record_created)}
            </span>
            <span>
              work_item_created:{" "}
              {formatAgResumeBoolean(authorityBoundary.work_item_created)}
            </span>
            <span>
              work_event_created:{" "}
              {formatAgResumeBoolean(authorityBoundary.work_event_created)}
            </span>
            <span>
              proof_recorded:{" "}
              {formatAgResumeBoolean(authorityBoundary.proof_recorded)}
            </span>
            <span>
              evidence_recorded:{" "}
              {formatAgResumeBoolean(authorityBoundary.evidence_recorded)}
            </span>
            <span>
              session_bound:{" "}
              {formatAgResumeBoolean(authorityBoundary.session_bound)}
            </span>
            <span>
              codex_executed:{" "}
              {formatAgResumeBoolean(authorityBoundary.codex_executed)}
            </span>
            <span>
              approval_granted:{" "}
              {formatAgResumeBoolean(authorityBoundary.approval_granted)}
            </span>
            <span>
              publish_retry_replay_authority:{" "}
              {formatAgResumeBoolean(
                authorityBoundary.publish_retry_replay_authority,
              )}
            </span>
            <span>
              merge_authority:{" "}
              {formatAgResumeBoolean(authorityBoundary.merge_authority)}
            </span>
          </div>
          <p>durable_approval: {authorityBoundary.durable_approval ?? "unknown"}</p>
        </>
      ) : (
        <EmptyState label="No read authority boundary returned." />
      )}
    </section>
  );
}

function AgResumeMappingProposalRecordCard({
  record,
}: {
  record: AgResumeMappingProposalRecord;
}) {
  return (
    <article className="evidence-pack-card evidence-pack-card-wide">
      <div className="card-topline">
        <div>
          <h3>{record.proposal_id ?? "unknown proposal_id"}</h3>
          <p>{record.proposal_reason ?? "No proposal reason returned."}</p>
        </div>
        <StatusBadge label={record.status ?? "unknown"} />
      </div>
      <div className="meta-row">
        <span>record_kind: {record.record_kind ?? "unknown"}</span>
        <span>schema: {record.schema ?? "unknown"}</span>
        <span>created_at: {record.created_at ?? "unknown"}</span>
        <span>updated_at: {record.updated_at ?? "unknown"}</span>
      </div>
      <div className="evidence-pack-grid">
        <section className="evidence-pack-card">
          <h3>Foreign work</h3>
          <p>{record.foreign_title ?? "Untitled foreign work"}</p>
          <div className="meta-row">
            <span>foreign_scope: {record.foreign_scope ?? "unknown"}</span>
            <span>foreign_work_id: {record.foreign_work_id ?? "unknown"}</span>
            <span>foreign_status: {record.foreign_status ?? "unknown"}</span>
          </div>
          {record.foreign_next_action ? (
            <p>foreign_next_action: {record.foreign_next_action}</p>
          ) : null}
        </section>
        <section className="evidence-pack-card">
          <h3>Candidate local work</h3>
          <p>{record.candidate_title ?? "Untitled candidate work"}</p>
          <div className="meta-row">
            <span>
              candidate_local_scope:{" "}
              {record.candidate_local_scope ?? "unknown"}
            </span>
            <span>
              candidate_local_work_id:{" "}
              {record.candidate_local_work_id ?? "unknown"}
            </span>
            <span>
              candidate_status: {record.candidate_status ?? "unknown"}
            </span>
          </div>
          {record.candidate_next_action ? (
            <p>candidate_next_action: {record.candidate_next_action}</p>
          ) : null}
        </section>
        <section className="evidence-pack-card">
          <h3>Proposal metadata</h3>
          <div className="meta-row">
            <span>packet_id: {record.packet_id ?? "unknown"}</span>
            <span>proposal_preview_id: {record.proposal_preview_id ?? "unknown"}</span>
            <span>
              match_confidence_label:{" "}
              {record.match_confidence_label ?? "none"}
            </span>
            <span>proposed_by: {record.proposed_by ?? "unknown"}</span>
            <span>proposed_at: {record.proposed_at ?? "unknown"}</span>
            <span>expires_at: {record.expires_at ?? "none"}</span>
          </div>
        </section>
        <AgResumeUnknownList
          title="comparison_summary"
          items={record.comparison_summary ?? []}
          emptyLabel="No comparison summary."
        />
        <AgResumeUnknownList
          title="gaps_summary"
          items={record.gaps_summary ?? []}
          emptyLabel="No gaps summary."
        />
        <AgResumeUnknownList
          title="conflicts_summary"
          items={record.conflicts_summary ?? []}
          emptyLabel="No conflicts summary."
        />
        <AgResumeUnknownList
          title="questions_summary"
          items={record.questions_summary ?? []}
          emptyLabel="No questions summary."
        />
        <AgResumeJsonSummaryCard
          title="foreign_refs_summary"
          value={record.foreign_refs_summary ?? {}}
        />
        <AgResumeJsonSummaryCard
          title="repo_context_summary"
          value={record.repo_context_summary ?? {}}
        />
        <AgResumeJsonSummaryCard
          title="redaction_summary"
          value={record.redaction_summary ?? {}}
        />
        <AgResumeMappingProposalRecordAuthorityBoundary
          authorityBoundary={record.authority_boundary ?? null}
        />
      </div>
    </article>
  );
}

function AgResumeMappingProposalRecordAuthorityBoundary({
  authorityBoundary,
}: {
  authorityBoundary: AgResumeMappingProposalRecordAuthorityBoundary | null;
}) {
  return (
    <section className="evidence-pack-card">
      <h3>Record Authority Boundary</h3>
      {authorityBoundary ? (
        <>
          <p>{authorityBoundary.statement ?? "No record boundary statement returned."}</p>
          <div className="meta-row">
            <span>
              proposal_record_created:{" "}
              {formatAgResumeBoolean(authorityBoundary.proposal_record_created)}
            </span>
            <span>
              confirmed_mapping_created:{" "}
              {formatAgResumeBoolean(authorityBoundary.confirmed_mapping_created)}
            </span>
            <span>
              import_record_created:{" "}
              {formatAgResumeBoolean(authorityBoundary.import_record_created)}
            </span>
            <span>
              work_item_created:{" "}
              {formatAgResumeBoolean(authorityBoundary.work_item_created)}
            </span>
            <span>
              work_event_created:{" "}
              {formatAgResumeBoolean(authorityBoundary.work_event_created)}
            </span>
            <span>
              proof_recorded:{" "}
              {formatAgResumeBoolean(authorityBoundary.proof_recorded)}
            </span>
            <span>
              evidence_recorded:{" "}
              {formatAgResumeBoolean(authorityBoundary.evidence_recorded)}
            </span>
            <span>
              session_bound:{" "}
              {formatAgResumeBoolean(authorityBoundary.session_bound)}
            </span>
            <span>
              codex_executed:{" "}
              {formatAgResumeBoolean(authorityBoundary.codex_executed)}
            </span>
            <span>
              approval_granted:{" "}
              {formatAgResumeBoolean(authorityBoundary.approval_granted)}
            </span>
            <span>
              publish_retry_replay_authority:{" "}
              {formatAgResumeBoolean(
                authorityBoundary.publish_retry_replay_authority,
              )}
            </span>
            <span>
              merge_authority:{" "}
              {formatAgResumeBoolean(authorityBoundary.merge_authority)}
            </span>
          </div>
          <p>durable_approval: {authorityBoundary.durable_approval ?? "unknown"}</p>
        </>
      ) : (
        <EmptyState label="No record authority boundary returned." />
      )}
    </section>
  );
}

function AgResumeUnknownList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: unknown[];
  emptyLabel: string;
}) {
  return (
    <section className="evidence-pack-card">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <ul className="compact-list">
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>
              <code>{formatAgResumeJsonValue(item)}</code>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AgResumeJsonSummaryCard({
  title,
  value,
}: {
  title: string;
  value: unknown;
}) {
  return (
    <section className="evidence-pack-card">
      <h3>{title}</h3>
      <code>{formatAgResumeJsonValue(value)}</code>
    </section>
  );
}

function AgResumePacketValidationResults({
  result,
}: {
  result: AgResumeTargetPreviewPanelResult;
}) {
  const { body } = result;
  const preview = body.preview ?? null;
  const preflight = body.preflight ?? null;

  return (
    <div
      className="evidence-pack-card"
      aria-labelledby="ag-resume-validation-result-heading"
      aria-live="polite"
    >
      <h3 id="ag-resume-validation-result-heading">Copied packet validation</h3>
      <p>
        Validation is read-only packet review, not mapping, import,
        persistence, or execution authority.
      </p>
      <div className="meta-row">
        <span>HTTP status: {result.httpStatus}</span>
        <span>route ok: {formatAgResumeBoolean(body.ok)}</span>
        <span>preflight ran: {formatAgResumeBoolean(preflight?.ran)}</span>
        <span>preflight ok: {formatAgResumeBoolean(preflight?.ok)}</span>
        <span>preflight status: {preflight?.status ?? "unknown"}</span>
        <span>preview.status: {preview?.status ?? "none"}</span>
      </div>
      {preview?.status === "context_only" ? (
        <BoundaryNote tone="green">
          context_only is expected for packet-only validation because Local B
          context is sent as null.
        </BoundaryNote>
      ) : (
        <BoundaryNote>
          context_only is expected for packet-only validation when Local B
          context is sent as null.
        </BoundaryNote>
      )}
      {body.recommended_next_step ? (
        <BoundaryNote tone="green">
          route recommended_next_step: {body.recommended_next_step}
        </BoundaryNote>
      ) : null}
      <AgResumeStringList
        title="Preflight warnings"
        items={preflight?.warnings ?? []}
        emptyLabel="No preflight warnings."
      />
      <AgResumeStringList
        title="Preflight failures"
        items={preflight?.failures ?? []}
        emptyLabel="No preflight failures."
      />
    </div>
  );
}

function AgResumeTargetPreviewResults({
  result,
}: {
  result: AgResumeTargetPreviewPanelResult;
}) {
  const { body } = result;
  const preview = body.preview ?? null;
  const preflight = body.preflight ?? null;
  const foreignRefs = preview?.packet_summary?.foreign_refs ?? null;

  return (
    <div
      aria-labelledby="ag-resume-target-preview-result-heading"
      aria-live="polite"
    >
      <h3 id="ag-resume-target-preview-result-heading">
        Full target preview result
      </h3>
      <div className="evidence-pack-grid">
        <section className="evidence-pack-card">
          <h3>HTTP Status</h3>
          <p>{result.httpStatus}</p>
          <small>target-preview route</small>
        </section>
        <section className="evidence-pack-card">
          <h3>Route ok</h3>
          <p>{formatAgResumeBoolean(body.ok)}</p>
          <small>{body.route ?? "route unknown"}</small>
        </section>
        <section className="evidence-pack-card">
          <h3>Preview status</h3>
          <p>{preview?.status ?? "none"}</p>
          <small>preview.status - read-only target result</small>
        </section>
        <section className="evidence-pack-card">
          <h3>OK to continue</h3>
          <p>{formatAgResumeBoolean(preview?.ok_to_continue)}</p>
          <small>
            {preview?.ok_to_continue
              ? "preview.ok_to_continue - OK only for user/Core review. This is not Codex execution authority."
              : "preview.ok_to_continue - Not OK for user/Core review."}
          </small>
        </section>
      </div>
      {body.recommended_next_step ? (
        <BoundaryNote tone="green">
          recommended_next_step: {body.recommended_next_step}
        </BoundaryNote>
      ) : null}
      <div className="evidence-pack-grid">
        <section className="evidence-pack-card">
          <h3>Preflight</h3>
          <div className="meta-row">
            <span>ran: {formatAgResumeBoolean(preflight?.ran)}</span>
            <span>ok: {formatAgResumeBoolean(preflight?.ok)}</span>
            <span>status: {preflight?.status ?? "unknown"}</span>
            <span>strict: {formatAgResumeBoolean(preflight?.strict)}</span>
          </div>
          <AgResumeStringList
            title="Warnings"
            items={preflight?.warnings ?? []}
            emptyLabel="No preflight warnings."
          />
          <AgResumeStringList
            title="Failures"
            items={preflight?.failures ?? []}
            emptyLabel="No preflight failures."
          />
        </section>
        <AgResumeFindingList
          title="Gaps"
          items={preview?.gaps ?? []}
          emptyLabel="No target gaps."
        />
        <AgResumeConflictList
          title="Conflicts"
          items={preview?.conflicts ?? []}
          emptyLabel="No target conflicts."
        />
        <AgResumeFindingList
          title="Warnings"
          items={preview?.warnings ?? []}
          emptyLabel="No target warnings."
        />
        <AgResumeRecommendationList
          recommendations={preview?.recommendations ?? []}
        />
        <AgResumeForeignRefsPanel foreignRefs={foreignRefs} />
        <section className="evidence-pack-card">
          <h3>Authority Boundary</h3>
          {preview?.authority_boundary?.read_only ? (
            <p>{preview.authority_boundary.read_only}</p>
          ) : null}
          <AgResumeStringList
            title="Boundaries"
            items={preview?.authority_boundary?.boundaries ?? []}
            emptyLabel="No route boundary list returned."
          />
          {preview?.authority_boundary?.durable_approval ? (
            <p>{preview.authority_boundary.durable_approval}</p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

function AgResumeMappingProposalPreviewResults({
  result,
}: {
  result: AgResumeMappingProposalPanelResult;
}) {
  const { body } = result;
  const preview = body.preview ?? null;

  return (
    <div
      aria-labelledby="ag-resume-mapping-proposal-preview-result-heading"
      aria-live="polite"
    >
      <h3 id="ag-resume-mapping-proposal-preview-result-heading">
        Mapping proposal preview result
      </h3>
      <BoundaryNote tone="green">
        ok_for_user_core_review means review only. It is not mapping confirmation, import authorization, or Codex execution authority.
      </BoundaryNote>
      <BoundaryNote>
        Foreign refs remain foreign until a separate reconciliation authority gate exists.
      </BoundaryNote>
      <BoundaryNote>
        This panel does not create mapping records, import records, work items, proof/evidence records, session bindings, or Codex executions.
      </BoundaryNote>
      <div className="evidence-pack-grid">
        <section className="evidence-pack-card">
          <h3>HTTP Status</h3>
          <p>{result.httpStatus}</p>
          <small>mapping-proposal-preview route</small>
        </section>
        <section className="evidence-pack-card">
          <h3>Route ok</h3>
          <p>{formatAgResumeBoolean(body.ok)}</p>
          <small>{body.route ?? "route unknown"}</small>
        </section>
        <section className="evidence-pack-card">
          <h3>Preview status</h3>
          <p>{preview?.status ?? "none"}</p>
          <small>preview.status - read-only mapping proposal result</small>
        </section>
        <section className="evidence-pack-card">
          <h3>OK for user/Core review</h3>
          <p>{formatAgResumeBoolean(preview?.ok_for_user_core_review)}</p>
          <small>preview.ok_for_user_core_review - review only</small>
        </section>
        <section className="evidence-pack-card">
          <h3>Match confidence</h3>
          <p>{preview?.comparison?.match_confidence_label ?? "none"}</p>
          <small>Advisory only; not a mapping decision.</small>
        </section>
      </div>
      {body.recommended_next_step ? (
        <BoundaryNote tone="green">
          recommended_next_step: {body.recommended_next_step}
        </BoundaryNote>
      ) : null}
      {preview?.next_step ? (
        <BoundaryNote>preview.next_step: {preview.next_step}</BoundaryNote>
      ) : null}
      <div className="evidence-pack-grid">
        <AgResumeMappingWorkSummaryCard
          title="Packet foreign work"
          work={preview?.packet_summary?.packet_foreign_work ?? null}
        />
        <AgResumeMappingCandidateSummaryCard
          candidate={preview?.selected_candidate_summary ?? null}
        />
        <AgResumeMappingComparisonPanel comparison={preview?.comparison ?? null} />
        <AgResumeMappingFindingList
          title="Gaps"
          items={preview?.gaps ?? []}
          emptyLabel="No mapping proposal gaps."
        />
        <AgResumeMappingFindingList
          title="Conflicts"
          items={preview?.conflicts ?? []}
          emptyLabel="No mapping proposal conflicts."
        />
        <AgResumeMappingQuestionList questions={preview?.questions ?? []} />
        <AgResumeRecommendationList
          recommendations={preview?.recommendations ?? []}
        />
        <AgResumeForeignRefsPanel
          foreignRefs={preview?.foreign_refs_summary ?? null}
        />
        <AgResumeMappingAuthorityBoundary
          authorityBoundary={preview?.authority_boundary ?? null}
        />
      </div>
    </div>
  );
}

function AgResumeMappingWorkSummaryCard({
  title,
  work,
}: {
  title: string;
  work: AgResumeMappingProposalWorkSummary | null;
}) {
  return (
    <section className="evidence-pack-card">
      <h3>{title}</h3>
      {work ? (
        <>
          <p>{work.title ?? "Untitled work"}</p>
          <div className="meta-row">
            <span>scope: {work.scope ?? "unknown"}</span>
            <span>work_id: {work.work_id ?? "unknown"}</span>
            <span>status: {work.status ?? "unknown"}</span>
          </div>
          {work.next_action ? <p>next_action: {work.next_action}</p> : null}
          <AgResumeStringList
            title="Related state keys"
            items={work.related_state_keys ?? []}
            emptyLabel="No related state keys."
          />
        </>
      ) : (
        <EmptyState label="No packet foreign work summary returned." />
      )}
    </section>
  );
}

function AgResumeMappingCandidateSummaryCard({
  candidate,
}: {
  candidate: AgResumeMappingProposalCandidateSummary | null;
}) {
  return (
    <section className="evidence-pack-card">
      <h3>Selected candidate summary</h3>
      {candidate ? (
        <>
          <p>{candidate.title ?? "Untitled candidate"}</p>
          <div className="meta-row">
            <span>candidate_id: {candidate.candidate_id ?? "unknown"}</span>
            <span>local_scope: {candidate.local_scope ?? "unknown"}</span>
            <span>local_work_id: {candidate.local_work_id ?? "unknown"}</span>
            <span>status: {candidate.status ?? "unknown"}</span>
          </div>
          {candidate.next_action ? (
            <p>next_action: {candidate.next_action}</p>
          ) : null}
          <div className="meta-row">
            <span>
              work brief available:{" "}
              {formatAgResumeBoolean(candidate.work_brief_available)}
            </span>
            <span>
              codex:read-brief available:{" "}
              {formatAgResumeBoolean(candidate.codex_read_brief_available)}
            </span>
          </div>
        </>
      ) : (
        <EmptyState label="No selected candidate summary returned." />
      )}
    </section>
  );
}

function AgResumeMappingComparisonPanel({
  comparison,
}: {
  comparison: AgResumeMappingProposalPreview["comparison"] | null;
}) {
  return (
    <section className="evidence-pack-card">
      <h3>Comparison</h3>
      {comparison ? (
        <>
          <div className="meta-row">
            <span>
              match_confidence_label:{" "}
              {comparison.match_confidence_label ?? "unknown"}
            </span>
            <span>
              advisory_only: {formatAgResumeBoolean(comparison.advisory_only)}
            </span>
          </div>
          <AgResumeStringList
            title="Related state key overlap"
            items={comparison.related_state_keys_overlap ?? []}
            emptyLabel="No related state key overlap."
          />
          <div className="meta-row">
            <span>
              repo.remote_matches:{" "}
              {comparison.repo?.remote_matches ?? "not_supplied"}
            </span>
            <span>
              repo.base_commit_reachable:{" "}
              {comparison.repo?.base_commit_reachable ?? "not_supplied"}
            </span>
            <span>
              repo.dirty_worktree:{" "}
              {comparison.repo?.dirty_worktree ?? "not_supplied"}
            </span>
            <span>
              repo.expected_files:{" "}
              {comparison.repo?.expected_files ?? "not_supplied"}
            </span>
          </div>
          <ul className="compact-list">
            {(comparison.fields ?? []).map((difference, index) => (
              <li key={`${difference.field ?? "field"}-${index}`}>
                <strong>{difference.field ?? "field"}</strong>
                <p>
                  {difference.label ?? "unknown"}: packet=
                  {formatAgResumeMappingValue(difference.packet_value)},
                  candidate=
                  {formatAgResumeMappingValue(difference.candidate_value)}
                </p>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState label="No comparison returned." />
      )}
    </section>
  );
}

function AgResumeMappingFindingList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: AgResumeMappingProposalFinding[];
  emptyLabel: string;
}) {
  return (
    <section className="evidence-pack-card">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <ul className="compact-list">
          {items.map((item, index) => (
            <li key={item.id ?? `${title}-${index}`}>
              <strong>{item.title ?? item.id ?? "Untitled mapping finding"}</strong>
              {item.severity ? <span>{item.severity}</span> : null}
              {item.detail ? <p>{item.detail}</p> : null}
              {item.fields?.length ? (
                <code>fields: {item.fields.join(", ")}</code>
              ) : null}
              {item.refs?.length ? <code>refs: {item.refs.join(", ")}</code> : null}
              {item.differences?.length ? (
                <ul className="boundary-list">
                  {item.differences.map((difference, differenceIndex) => (
                    <li key={`${item.id ?? "mapping-finding"}-${differenceIndex}`}>
                      {difference.field ?? "field"}: packet=
                      {formatAgResumeMappingValue(difference.packet_value)},
                      candidate=
                      {formatAgResumeMappingValue(difference.candidate_value)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AgResumeMappingQuestionList({
  questions,
}: {
  questions: AgResumeMappingProposalQuestion[];
}) {
  return (
    <section className="evidence-pack-card">
      <h3>Questions</h3>
      {questions.length === 0 ? (
        <EmptyState label="No mapping proposal questions." />
      ) : (
        <ul className="compact-list">
          {questions.map((question, index) => (
            <li key={question.id ?? `question-${index}`}>
              <strong>{question.id ?? "question"}</strong>
              {question.text ? <p>{question.text}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AgResumeMappingAuthorityBoundary({
  authorityBoundary,
}: {
  authorityBoundary: AgResumeMappingProposalPreview["authority_boundary"] | null;
}) {
  return (
    <section className="evidence-pack-card">
      <h3>Authority Boundary</h3>
      {authorityBoundary ? (
        <>
          <p>{authorityBoundary.statement ?? "No boundary statement returned."}</p>
          <div className="meta-row">
            <span>
              read_only: {formatAgResumeBoolean(authorityBoundary.read_only)}
            </span>
            <span>
              proposal_only:{" "}
              {formatAgResumeBoolean(authorityBoundary.proposal_only)}
            </span>
            <span>
              creates_mapping_record:{" "}
              {formatAgResumeBoolean(authorityBoundary.creates_mapping_record)}
            </span>
            <span>
              creates_import_record:{" "}
              {formatAgResumeBoolean(authorityBoundary.creates_import_record)}
            </span>
            <span>
              creates_work_item:{" "}
              {formatAgResumeBoolean(authorityBoundary.creates_work_item)}
            </span>
            <span>
              records_proof:{" "}
              {formatAgResumeBoolean(authorityBoundary.records_proof)}
            </span>
            <span>
              records_evidence:{" "}
              {formatAgResumeBoolean(authorityBoundary.records_evidence)}
            </span>
            <span>
              binds_session:{" "}
              {formatAgResumeBoolean(authorityBoundary.binds_session)}
            </span>
            <span>
              executes_codex:{" "}
              {formatAgResumeBoolean(authorityBoundary.executes_codex)}
            </span>
            <span>
              approval_authority:{" "}
              {formatAgResumeBoolean(authorityBoundary.approval_authority)}
            </span>
            <span>
              publish_retry_replay_authority:{" "}
              {formatAgResumeBoolean(
                authorityBoundary.publish_retry_replay_authority,
              )}
            </span>
            <span>
              merge_authority:{" "}
              {formatAgResumeBoolean(authorityBoundary.merge_authority)}
            </span>
            <span>
              state_mutation:{" "}
              {formatAgResumeBoolean(authorityBoundary.state_mutation)}
            </span>
          </div>
          <p>durable_approval: {authorityBoundary.durable_approval ?? "unknown"}</p>
        </>
      ) : (
        <EmptyState label="No authority boundary returned." />
      )}
    </section>
  );
}

function AgResumeFindingList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: AgResumeTargetFinding[];
  emptyLabel: string;
}) {
  return (
    <section className="evidence-pack-card">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <ul className="compact-list">
          {items.map((item, index) => (
            <li key={item.id ?? `${title}-${index}`}>
              <strong>{item.title ?? item.id ?? "Untitled finding"}</strong>
              {item.severity ? <span>{item.severity}</span> : null}
              {item.detail ? <p>{item.detail}</p> : null}
              {item.fields?.length ? (
                <code>fields: {item.fields.join(", ")}</code>
              ) : null}
              {item.refs?.length ? <code>refs: {item.refs.join(", ")}</code> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AgResumeConflictList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: AgResumeTargetConflict[];
  emptyLabel: string;
}) {
  return (
    <section className="evidence-pack-card">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <ul className="compact-list">
          {items.map((item, index) => (
            <li key={item.id ?? `${title}-${index}`}>
              <strong>{item.title ?? item.id ?? "Untitled conflict"}</strong>
              {item.detail ? <p>{item.detail}</p> : null}
              {item.fields?.length ? (
                <code>fields: {item.fields.join(", ")}</code>
              ) : null}
              {item.refs?.length ? <code>refs: {item.refs.join(", ")}</code> : null}
              {item.differences?.length ? (
                <ul className="boundary-list">
                  {item.differences.map((difference, differenceIndex) => (
                    <li key={`${item.id ?? "conflict"}-${differenceIndex}`}>
                      {difference.field ?? "field"}: packet=
                      {difference.packet_value ?? "null"}, local=
                      {difference.local_value ?? "null"}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AgResumeRecommendationList({
  recommendations,
}: {
  recommendations: AgResumeTargetRecommendation[];
}) {
  return (
    <section className="evidence-pack-card">
      <h3>Recommendations</h3>
      {recommendations.length === 0 ? (
        <EmptyState label="No recommendations." />
      ) : (
        <ul className="compact-list">
          {recommendations.map((recommendation, index) => (
            <li key={recommendation.id ?? `recommendation-${index}`}>
              <strong>{recommendation.id ?? "recommendation"}</strong>
              {recommendation.text ? <p>{recommendation.text}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AgResumeForeignRefsPanel({
  foreignRefs,
}: {
  foreignRefs: AgResumeTargetForeignRefs | null;
}) {
  return (
    <section className="evidence-pack-card">
      <h3>packet_summary.foreign_refs</h3>
      <div className="meta-row">
        <span>
          local proof records created:{" "}
          {formatAgResumeBoolean(foreignRefs?.local_proof_records_created)}
        </span>
        <span>
          local evidence records created:{" "}
          {formatAgResumeBoolean(foreignRefs?.local_evidence_records_created)}
        </span>
        <span>
          local sessions bound:{" "}
          {formatAgResumeBoolean(foreignRefs?.local_sessions_bound)}
        </span>
      </div>
      <AgResumeStringList
        title="Foreign action refs"
        items={foreignRefs?.foreign_action_ref_ids ?? []}
        emptyLabel="No foreign action refs."
      />
      <AgResumeStringList
        title="Foreign evidence refs"
        items={foreignRefs?.foreign_evidence_refs ?? []}
        emptyLabel="No foreign evidence refs."
      />
      <AgResumeStringList
        title="Foreign session refs"
        items={foreignRefs?.foreign_session_refs ?? []}
        emptyLabel="No foreign session refs."
      />
      <p>
        foreign_evidence_pack_ref:{" "}
        {foreignRefs?.foreign_evidence_pack_ref ?? "none"}
      </p>
      {foreignRefs?.note ? <p>{foreignRefs.note}</p> : null}
    </section>
  );
}

function AgResumeStringList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: string[];
  emptyLabel: string;
}) {
  return (
    <div>
      <h4>{title}</h4>
      {items.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <ul className="boundary-list">
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>{item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PendingProposalQueue({
  proposals,
  busy,
  onConsolidateCandidates,
  onDecideProposal,
}: {
  proposals: StateDeltaProposal[];
  busy: string | null;
  onConsolidateCandidates: () => void;
  onDecideProposal: (id: string, decision: "commit" | "reject") => void;
}) {
  return (
    <section className="cockpit-surface-card proposals-panel">
      <PanelHeader eyebrow="Operator" title="Pending local state proposal queue" />
      <div className="panel-control-row">
        <p>
          Local runtime proposals only. Commit/Reject writes only local Augnes
          state through the existing proposal gate.
        </p>
        <button
          type="button"
          className="secondary-button"
          onClick={onConsolidateCandidates}
          disabled={busy === "consolidate"}
        >
          Consolidate Candidates
        </button>
      </div>
      <div className="proposal-list">
        {proposals.length === 0 ? (
          <EmptyState
            label="No pending proposals."
            description="Use Observe advanced input to generate local state candidates."
          />
        ) : (
          proposals.map((proposal) => (
            <article className="proposal-card" key={proposal.id}>
              <div className="card-topline">
                <div className="state-key-heading">
                  <h3>{formatStateKeyLabel(proposal.state_key)}</h3>
                  <code>{proposal.state_key}</code>
                </div>
                <StatusBadge
                  label={formatStatusLabel(proposal.consolidation_status)}
                  tone={getConsolidationTone(proposal.consolidation_status)}
                />
              </div>
              <p className="consolidation-copy">
                {getConsolidationExplanation(proposal.consolidation_status)}
              </p>
              <ValueDiff
                beforeValue={proposal.before_value}
                afterValue={proposal.after_value}
              />
              <ProposalScoring proposal={proposal} />
              <div className="meta-row">
                <span>{formatStatusLabel(proposal.operation)}</span>
                <span>{formatStatusLabel(proposal.temporal_scope)}</span>
                <span>{formatStatusLabel(proposal.stability)}</span>
                <span>{formatStatusLabel(proposal.change_type)}</span>
              </div>
              {proposal.reason ? <p>{proposal.reason}</p> : null}
              <div className="button-row">
                <button
                  type="button"
                  onClick={() => onDecideProposal(proposal.id, "commit")}
                  disabled={
                    busy === proposal.id ||
                    proposal.consolidation_status === "expired"
                  }
                >
                  Commit local state proposal
                </button>
                <button
                  type="button"
                  className="secondary-button danger-outline-button"
                  onClick={() => onDecideProposal(proposal.id, "reject")}
                  disabled={busy === proposal.id}
                >
                  Reject local state proposal
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function SafeLocalActions({
  busy,
  evidencePackLoaded,
  sessionTraceLoaded,
  sessionTraceBusy,
  plan,
  onRequestPlan,
  onRunTool,
  onLoadEvidencePack,
  onRefreshSessionTrace,
}: {
  busy: string | null;
  evidencePackLoaded: boolean;
  sessionTraceLoaded: boolean;
  sessionTraceBusy: boolean;
  plan: PlanResponse | null;
  onRequestPlan: () => void;
  onRunTool: (toolName: string) => void;
  onLoadEvidencePack: () => void;
  onRefreshSessionTrace: () => void;
}) {
  return (
    <section className="cockpit-surface-card actions-panel">
      <PanelHeader eyebrow="Operator actions (safe)" title="Safe local actions" />
      <div className="action-controls">
        <button type="button" onClick={onRequestPlan} disabled={busy === "plan"}>
          Plan Next
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onLoadEvidencePack}
          disabled={busy === "evidence-pack"}
        >
          {evidencePackLoaded ? "Reload Evidence Pack" : "Load Evidence Pack"}
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onRefreshSessionTrace}
          disabled={sessionTraceBusy}
        >
          {sessionTraceLoaded ? "Refresh Session Trace" : "Load Session Trace"}
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onRunTool("create_readme_checklist")}
          disabled={busy === "create_readme_checklist"}
        >
          README Checklist
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onRunTool("create_security_checklist")}
          disabled={busy === "create_security_checklist"}
        >
          Security Checklist
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => onRunTool("create_demo_script")}
          disabled={busy === "create_demo_script"}
        >
          Demo Script
        </button>
      </div>
      {plan ? (
        <div className="plan-list">
          {plan.recommendations.map((recommendation) => (
            <article className="plan-item" key={recommendation.title}>
              <div className="card-topline">
                <h3>{recommendation.title}</h3>
                <StatusBadge label={recommendation.priority} />
              </div>
              <p>{recommendation.rationale}</p>
              <div className="meta-row">
                {recommendation.tool_name ? (
                  <span>{formatStateKeyLabel(recommendation.tool_name)}</span>
                ) : null}
                {recommendation.grounded_state_keys.map((key) => (
                  <span key={key}>
                    {formatStateKeyLabel(key)} <code>{key}</code>
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState label="No plan requested" />
      )}
    </section>
  );
}

function RefChipList({
  refs,
  emptyLabel,
}: {
  refs: string[];
  emptyLabel: string;
}) {
  const uniqueRefs = Array.from(new Set(refs.filter(Boolean))).slice(0, 18);

  if (uniqueRefs.length === 0) {
    return <EmptyState label={emptyLabel} />;
  }

  return (
    <div className="meta-row">
      {uniqueRefs.map((ref) => (
        <span key={ref}>
          <code>{ref}</code>
        </span>
      ))}
    </div>
  );
}

function TensionList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: {
    key: string;
    label: string;
    detail?: string;
    metaChips?: string[];
    fields?: { label: string; value: string }[];
  }[];
  emptyLabel: string;
}) {
  return (
    <section className="perspective-tension-list">
      <h3>{title}</h3>
      {items.length === 0 ? (
        <EmptyState label={emptyLabel} />
      ) : (
        <div className="compact-list">
          {items.slice(0, 8).map((item) => (
            <article className="tension-diagnostic-card" key={item.key}>
              <header className="tension-card-header">
                <strong className="tension-card-title">{item.label}</strong>
                {item.metaChips?.length ? (
                  <div className="tension-chip-row" aria-label="Tension metadata">
                    {item.metaChips.map((chip) => (
                      <span className="tension-chip" key={chip}>
                        {chip}
                      </span>
                    ))}
                  </div>
                ) : null}
              </header>
              <div className="tension-card-body">
                {item.fields?.length ? (
                  item.fields.map((field) => (
                    <div className="tension-card-field" key={field.label}>
                      <span className="tension-field-label">{field.label}</span>
                      <p>{field.value}</p>
                    </div>
                  ))
                ) : item.detail ? (
                  <p>{item.detail}</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function PerspectiveStateBasis({
  title,
  summary,
  active,
  future,
  completed,
  deprecated,
}: {
  title: string;
  summary: string;
  active: PerspectiveSnapshot["committed_state_basis"]["active"];
  future: PerspectiveSnapshot["committed_state_basis"]["future"];
  completed: PerspectiveSnapshot["committed_state_basis"]["completed"];
  deprecated: PerspectiveSnapshot["committed_state_basis"]["deprecated"];
}) {
  return (
    <details className="perspective-detail-panel">
      <summary>{title} details</summary>
      <div className="evidence-pack-grid">
        <article className="evidence-pack-card evidence-pack-card-wide">
          <h3>Summary</h3>
          <p>{summary}</p>
        </article>
        <PerspectiveStateBasisBucket title="active" entries={active} />
        <PerspectiveStateBasisBucket title="future" entries={future} />
        <PerspectiveStateBasisBucket title="completed" entries={completed} />
        <PerspectiveStateBasisBucket title="deprecated" entries={deprecated} />
      </div>
    </details>
  );
}

function PerspectiveStateBasisBucket({
  title,
  entries,
}: {
  title: string;
  entries: PerspectiveSnapshot["committed_state_basis"]["active"];
}) {
  return (
    <article className="evidence-pack-card">
      <h3>{title}</h3>
      {entries.length === 0 ? (
        <EmptyState label={`No ${title} committed_state_basis entries`} />
      ) : (
        <ul>
          {entries.slice(0, 6).map((entry) => (
            <li key={entry.id}>
              <strong>{formatStateKeyLabel(entry.state_key)}</strong>{" "}
              <code>{formatStateValueForDisplay(entry.value)}</code>
              <div className="meta-row">
                <span>{formatStatusLabel(entry.temporal_scope)}</span>
                <span>{formatStatusLabel(entry.stability)}</span>
                <span>{formatStatusLabel(entry.change_type)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function PerspectiveProposalPressure({
  pressure,
}: {
  pressure: PerspectiveSnapshot["pending_proposal_pressure"];
}) {
  return (
    <details className="perspective-detail-panel">
      <summary>PerspectiveSnapshot pending_proposal_pressure details</summary>
      <div className="evidence-pack-grid">
        <article className="evidence-pack-card evidence-pack-card-wide">
          <h3>Pressure summary</h3>
          <p>{pressure.summary_reason}</p>
          <div className="meta-row">
            <span>{pressure.count} proposals</span>
            <StatusBadge
              label={`${formatStatusLabel(pressure.pressure_level)} pressure`}
            />
          </div>
        </article>
        {pressure.proposals.length === 0 ? (
          <article className="evidence-pack-card">
            <EmptyState label="No pending proposal pressure" />
          </article>
        ) : (
          pressure.proposals.slice(0, 6).map((proposal) => (
            <article className="evidence-pack-card" key={proposal.id}>
              <h3>{formatStateKeyLabel(proposal.state_key)}</h3>
              <p>{proposal.reason ?? "No proposal reason recorded."}</p>
              <div className="meta-row">
                <span>{formatStatusLabel(proposal.operation)}</span>
                <span>{formatStatusLabel(proposal.stability)}</span>
                <span>{formatStatusLabel(proposal.change_type)}</span>
                <span>{formatStatusLabel(proposal.consolidation_status)}</span>
              </div>
            </article>
          ))
        )}
      </div>
    </details>
  );
}

function PerspectiveEvidenceBasis({
  evidenceBasis,
}: {
  evidenceBasis: PerspectiveSnapshot["evidence_basis"];
}) {
  return (
    <details className="perspective-detail-panel">
      <summary>PerspectiveSnapshot evidence_basis details</summary>
      <div className="evidence-pack-grid">
        <article className="evidence-pack-card evidence-pack-card-wide">
          <h3>Evidence basis summary</h3>
          <p>{evidenceBasis.summary_reason}</p>
          <div className="meta-row">
            <span>{evidenceBasis.count} records</span>
          </div>
        </article>
        {evidenceBasis.recent.length === 0 ? (
          <article className="evidence-pack-card">
            <EmptyState label="No evidence_basis.recent records" />
          </article>
        ) : (
          evidenceBasis.recent.slice(0, 6).map((record) => (
            <article className="evidence-pack-card" key={record.evidence_id}>
              <h3>{record.label}</h3>
              <p>{record.result_summary}</p>
              <div className="meta-row">
                <span>{formatStatusLabel(record.evidence_kind)}</span>
                <span>{formatStatusLabel(record.status)}</span>
                <span>{formatStatusLabel(record.source_surface)}</span>
                {record.work_id ? <code>{record.work_id}</code> : null}
              </div>
            </article>
          ))
        )}
      </div>
    </details>
  );
}

function PerspectiveTraceBasis({
  workTraceBasis,
  actionTraceBasis,
}: {
  workTraceBasis: PerspectiveSnapshot["work_trace_basis"];
  actionTraceBasis: PerspectiveSnapshot["action_trace_basis"];
}) {
  return (
    <details className="perspective-detail-panel">
      <summary>
        PerspectiveSnapshot work_trace_basis.active and action_trace_basis.recent details
      </summary>
      <div className="evidence-pack-grid">
        <article className="evidence-pack-card evidence-pack-card-wide">
          <h3>Trace basis</h3>
          <p>{workTraceBasis.summary_reason}</p>
          <p>{actionTraceBasis.summary_reason}</p>
          <div className="meta-row">
            <span>{workTraceBasis.active.length} active work items</span>
            <span>{actionTraceBasis.recent.length} recent actions</span>
          </div>
        </article>
        {workTraceBasis.active.slice(0, 4).map((work) => (
          <article className="evidence-pack-card" key={work.work_id}>
            <h3>{work.title}</h3>
            <p>{work.summary}</p>
            <p>{work.next_action}</p>
            <div className="meta-row">
              <code>{work.work_id}</code>
              <span>{formatStatusLabel(work.status)}</span>
              <span>{formatStatusLabel(work.priority)}</span>
            </div>
          </article>
        ))}
        {actionTraceBasis.recent.slice(0, 4).map((action) => (
          <article className="evidence-pack-card" key={action.id}>
            <h3>{action.title}</h3>
            <div className="meta-row">
              <span>{formatStatusLabel(action.status)}</span>
              {action.state_key ? (
                <code>{formatStateKeyLabel(action.state_key)}</code>
              ) : null}
              {action.source_agent_id ? <span>{action.source_agent_id}</span> : null}
            </div>
          </article>
        ))}
      </div>
    </details>
  );
}

function PerspectiveAuthorityBoundaries({
  boundaries,
}: {
  boundaries: PerspectiveSnapshot["authority_boundaries"] | null;
}) {
  if (!boundaries) {
    return (
      <ul className="boundary-list">
        <li>read-first</li>
        <li>commit state blocked outside local runtime gate</li>
        <li>execute Codex blocked</li>
        <li>publish/mutate GitHub blocked</li>
        <li>proof/trace recording gated</li>
      </ul>
    );
  }

  return (
    <>
      <ul className="boundary-list">
        <li>derived_view_only {String(boundaries.derived_view_only)}</li>
        <li>source_of_truth {String(boundaries.source_of_truth)}</li>
        <li>can_commit_or_reject_state {String(boundaries.can_commit_or_reject_state)}</li>
        <li>can_record_proof {String(boundaries.can_record_proof)}</li>
        <li>can_create_evidence {String(boundaries.can_create_evidence)}</li>
        <li>can_update_work {String(boundaries.can_update_work)}</li>
        <li>can_publish_external {String(boundaries.can_publish_external)}</li>
        <li>can_retry {String(boundaries.can_retry)}</li>
        <li>can_mutate_mailbox {String(boundaries.can_mutate_mailbox)}</li>
        <li>
          can_mutate_publication_state{" "}
          {String(boundaries.can_mutate_publication_state)}
        </li>
        <li>
          can_call_github_or_openai {String(boundaries.can_call_github_or_openai)}
        </li>
        <li>
          can_write_temporal_review_artifacts{" "}
          {String(boundaries.can_write_temporal_review_artifacts)}
        </li>
      </ul>
      <details className="perspective-detail-panel">
        <summary>authority_boundaries lane details and source refs</summary>
        <RefChipList refs={boundaries.boundaries} emptyLabel="No boundaries listed" />
        <div className="meta-row">
          {boundaries.lanes.map((lane) => (
            <span key={lane.id}>
              {lane.label}{" "}
              <code>
                {formatStatusLabel(lane.role)} / derived_view_compatible{" "}
                {String(lane.derived_view_compatible)}
              </code>
            </span>
          ))}
        </div>
      </details>
    </>
  );
}

function ResearchDiagnosticsPanel({
  diagnostics,
}: {
  diagnostics: PerspectiveSnapshot["research_diagnostics"];
}) {
  return (
    <>
      <p>
        research_diagnostics are log_only diagnostic slots only. Meta-WM is a
        placeholder that is not computed. BSL is a placeholder that is not
        computed. CompIndex is a placeholder that is not computed. Loopness is a
        weak trace-pressure hint when present. Sidecar e_t is a structured
        placeholder that is not computed, not actual Sidecar state, not
        authority, and not source of truth; it does not run a Sidecar loop,
        commit z_t, or create QP output. These diagnostics are not authority,
        proof, readiness, or source of truth.
      </p>
      <div className="meta-row">
        <StatusBadge label={`mode ${diagnostics.mode}`} />
      </div>
      <SidecarEtHintPanel sidecarEtHint={diagnostics.sidecar_e_t} />
      <MetaWmHintPanel metaWmHint={diagnostics.meta_wm_hint} />
      <BslHintPanel bslHint={diagnostics.bsl_hint} />
      <CompIndexHintPanel compIndexHint={diagnostics.comp_index_hint} />
      <LoopnessHintPanel loopnessHint={diagnostics.loopness_hint} />
      <ul className="boundary-list">
        {diagnostics.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </>
  );
}

function SidecarEtHintPanel({
  sidecarEtHint,
}: {
  sidecarEtHint: PerspectiveSnapshot["research_diagnostics"]["sidecar_e_t"];
}) {
  return (
    <div className="evidence-pack-card">
      <h3>sidecar_e_t</h3>
      <p>
        Sidecar e_t placeholder is not computed. It is not actual Sidecar
        state, not authority, not source of truth, and not a Cockpit action
        input. It does not run a Sidecar loop, commit z_t, or create QP output.
      </p>
      <div className="meta-row">
        <StatusBadge label={formatStatusLabel(sidecarEtHint.version)} />
        <StatusBadge label={`mode ${sidecarEtHint.mode}`} />
        <StatusBadge label={`status ${sidecarEtHint.status}`} />
        <span>computed {String(sidecarEtHint.computed)}</span>
      </div>
      <details className="perspective-detail-panel">
        <summary>
          sidecar_e_t null values, source_refs, and boundary notes
        </summary>
        <ul className="boundary-list">
          {Object.entries(sidecarEtHint.values).map(([name, value]) => (
            <li key={name}>
              {name} {String(value)}
            </li>
          ))}
        </ul>
        <RefChipList
          refs={sidecarEtHint.source_refs}
          emptyLabel="No sidecar_e_t source refs"
        />
        <ul className="boundary-list">
          {sidecarEtHint.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function MetaWmHintPanel({
  metaWmHint,
}: {
  metaWmHint: PerspectiveSnapshot["research_diagnostics"]["meta_wm_hint"];
}) {
  return (
    <div className="evidence-pack-card">
      <h3>meta_wm_hint</h3>
      <p>
        Meta-WM placeholder is not computed. It is control/view only and is not
        authority, proof, readiness, Gate input, source of truth, or a Cockpit
        action input.
      </p>
      <div className="meta-row">
        <StatusBadge label={formatStatusLabel(metaWmHint.version)} />
        <StatusBadge label={`mode ${metaWmHint.mode}`} />
        <StatusBadge label={`status ${metaWmHint.status}`} />
        <span>computed {String(metaWmHint.computed)}</span>
      </div>
      <details className="perspective-detail-panel">
        <summary>meta_wm_hint null values, source_refs, and boundary notes</summary>
        <ul className="boundary-list">
          {Object.entries(metaWmHint.values).map(([name, value]) => (
            <li key={name}>
              {name} {String(value)}
            </li>
          ))}
        </ul>
        <RefChipList
          refs={metaWmHint.source_refs}
          emptyLabel="No meta_wm_hint source refs"
        />
        <ul className="boundary-list">
          {metaWmHint.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function BslHintPanel({
  bslHint,
}: {
  bslHint: PerspectiveSnapshot["research_diagnostics"]["bsl_hint"];
}) {
  return (
    <div className="evidence-pack-card">
      <h3>bsl_hint</h3>
      <p>
        BSL placeholder is not computed. It is control/view only and is not
        authority, proof, readiness, Gate input, source of truth, or a Cockpit
        action input.
      </p>
      <div className="meta-row">
        <StatusBadge label={formatStatusLabel(bslHint.version)} />
        <StatusBadge label={`mode ${bslHint.mode}`} />
        <StatusBadge label={`status ${bslHint.status}`} />
        <span>computed {String(bslHint.computed)}</span>
      </div>
      <details className="perspective-detail-panel">
        <summary>bsl_hint null values, source_refs, and boundary notes</summary>
        <ul className="boundary-list">
          {Object.entries(bslHint.values).map(([name, value]) => (
            <li key={name}>
              {name} {String(value)}
            </li>
          ))}
        </ul>
        <RefChipList
          refs={bslHint.source_refs}
          emptyLabel="No bsl_hint source refs"
        />
        <ul className="boundary-list">
          {bslHint.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function CompIndexHintPanel({
  compIndexHint,
}: {
  compIndexHint: PerspectiveSnapshot["research_diagnostics"]["comp_index_hint"];
}) {
  return (
    <div className="evidence-pack-card">
      <h3>comp_index_hint</h3>
      <p>
        CompIndex placeholder is not computed. It is control/view only and is
        not authority, proof, readiness, Gate input, source of truth, or a
        Cockpit action input.
      </p>
      <div className="meta-row">
        <StatusBadge label={formatStatusLabel(compIndexHint.version)} />
        <StatusBadge label={`mode ${compIndexHint.mode}`} />
        <StatusBadge label={`status ${compIndexHint.status}`} />
        <span>computed {String(compIndexHint.computed)}</span>
      </div>
      <details className="perspective-detail-panel">
        <summary>
          comp_index_hint null values, source_refs, and boundary notes
        </summary>
        <ul className="boundary-list">
          {Object.entries(compIndexHint.values).map(([name, value]) => (
            <li key={name}>
              {name} {String(value)}
            </li>
          ))}
        </ul>
        <RefChipList
          refs={compIndexHint.source_refs}
          emptyLabel="No comp_index_hint source refs"
        />
        <ul className="boundary-list">
          {compIndexHint.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function LoopnessHintPanel({
  loopnessHint,
}: {
  loopnessHint: PerspectiveSnapshot["research_diagnostics"]["loopness_hint"];
}) {
  return (
    <div className="evidence-pack-card">
      <h3>loopness_hint</h3>
      <p>
        log_only diagnostic hint about repetitive trace pressure. It is not
        authority, proof, readiness, Gate input, source of truth, or a Cockpit
        action input.
      </p>
      <div className="meta-row">
        <StatusBadge label={formatStatusLabel(loopnessHint.version)} />
        <StatusBadge label={`mode ${loopnessHint.mode}`} />
        <StatusBadge label={`level ${loopnessHint.level}`} />
        <span>score {loopnessHint.score}</span>
      </div>
      <ul className="boundary-list">
        <li>
          repeated_action_state_keys{" "}
          {loopnessHint.signals.repeated_action_state_keys}
        </li>
        <li>
          repeated_work_event_actors{" "}
          {loopnessHint.signals.repeated_work_event_actors}
        </li>
        <li>
          pending_proposal_count {loopnessHint.signals.pending_proposal_count}
        </li>
        <li>open_tension_count {loopnessHint.signals.open_tension_count}</li>
      </ul>
      <details className="perspective-detail-panel">
        <summary>loopness_hint source refs and non-authority notes</summary>
        <RefChipList
          refs={[
            ...loopnessHint.source_refs.action_record_ids,
            ...loopnessHint.source_refs.work_event_ids,
            ...loopnessHint.source_refs.pending_proposal_ids,
            ...loopnessHint.source_refs.tension_ids,
          ]}
          emptyLabel="No loopness_hint source refs"
        />
        <ul className="boundary-list">
          {loopnessHint.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="tab-page-header">
      <p className="kicker">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
  );
}

function ProcessStrip({ steps }: { steps: [string, string][] }) {
  return (
    <section className="six-tab-process-strip" aria-label="Temporal state process">
      {steps.map(([label, detail], index) => (
        <article className="process-step-card" key={label}>
          <span>{index + 1}</span>
          <strong>{label}</strong>
          <small>{detail}</small>
        </article>
      ))}
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: ReactNode;
  detail: string;
}) {
  return (
    <article className="metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function BoundaryNote({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: "green";
}) {
  return <aside className={`boundary-note${tone ? ` is-${tone}` : ""}`}>{children}</aside>;
}

function CurrentWorkCard({
  brief,
  error,
}: {
  brief: StateBriefResponse | null;
  error: string | null;
}) {
  const [copyFeedback, setCopyFeedback] = useState<Record<CopyTarget, Notice | null>>({
    codex: null,
    actionTemplate: null,
  });
  const handoff = brief?.agent_handoff;
  const handoffError =
    error ?? (brief ? "State brief loaded but did not include agent_handoff." : null);

  if (!handoff) {
    return (
      <section
        className={`current-work-card${handoffError ? " is-error" : " is-loading"}`}
        aria-label="Current Work"
      >
        <div className="current-work-main">
          <div className="current-work-summary">
            <PanelHeader
              eyebrow="Start Here"
              title="Current Work"
              description={
                handoffError
                  ? "The cockpit could not load the agent handoff from the state brief."
                  : "Loading the agent handoff from the state brief."
              }
            />
            <div className="current-action">
              {handoffError ? (
                <>
                  <h3>State brief unavailable</h3>
                  <p>{handoffError}</p>
                </>
              ) : (
                <LoadingBlock
                  title="Loading next action"
                  lines={["Fetching current status", "Preparing Codex handoff"]}
                />
              )}
            </div>
          </div>
          <div className="current-work-detail">
            <section className="handoff-section">
              {handoffError ? (
                <EmptyState
                  label="Blockers unavailable"
                  description="Retry by refreshing the cockpit once the state brief endpoint is healthy."
                />
              ) : (
                <LoadingBlock
                  title="Loading blockers"
                  lines={["Checking open tensions"]}
                />
              )}
            </section>
            <section className="handoff-section codex-brief">
              {handoffError ? (
                <EmptyState
                  label="Codex handoff unavailable"
                  description="The rest of the cockpit can still load from snapshot, trajectory, and proposal endpoints."
                />
              ) : (
                <LoadingBlock
                  title="Loading Codex handoff"
                  lines={["Fetching task brief", "Fetching verification commands"]}
                />
              )}
            </section>
          </div>
        </div>
      </section>
    );
  }

  const action = handoff.next_recommended_action;
  const codex = handoff.codex_handoff;
  const rawStateKeys = getHandoffStateKeys(handoff);

  async function copyToClipboard(
    target: CopyTarget,
    label: string,
    getText: () => string,
  ) {
    try {
      const text = getText();

      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API is unavailable.");
      }

      await navigator.clipboard.writeText(text);
      setCopyFeedback((current) => ({
        ...current,
        [target]: {
          tone: "info",
          text: `${label} copied`,
        },
      }));
    } catch (copyError) {
      setCopyFeedback((current) => ({
        ...current,
        [target]: {
          tone: "error",
          text:
            copyError instanceof Error
              ? copyError.message
              : `${label} copy failed`,
        },
      }));
    }
  }

  return (
    <section className="current-work-card" aria-label="Current Work">
      <div className="current-work-main">
        <div className="current-work-summary">
          <PanelHeader
            eyebrow="Start Here"
            title="Current Work"
            description={handoff.current_status.summary}
          />
          <div className="current-action">
            <div className="card-topline">
              <h3>{action.title}</h3>
              <div className="timeline-badges">
                <StatusBadge
                  label={formatStatusLabel(action.priority)}
                  tone={getPriorityTone(action.priority)}
                />
                <StatusBadge
                  label={formatStatusLabel(action.suggested_actor)}
                />
              </div>
            </div>
            <p>{action.rationale}</p>
          </div>
          <div className="handoff-actions" aria-label="Copy handoff actions">
            <div className="copy-control">
              <button
                type="button"
                onClick={() =>
                  void copyToClipboard("codex", "Codex handoff", () =>
                    buildCodexHandoffText(handoff),
                  )
                }
              >
                Copy Codex handoff
              </button>
              <CopyFeedback notice={copyFeedback.codex} />
            </div>
            <div className="copy-control">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  void copyToClipboard(
                    "actionTemplate",
                    "Action record template",
                    () => formatActionRecordTemplate(codex.action_record_template),
                  )
                }
              >
                Copy action record template
              </button>
              <CopyFeedback notice={copyFeedback.actionTemplate} />
            </div>
          </div>
        </div>

        <div className="current-work-detail">
          <section className="handoff-section">
            <h3>Blockers or tensions</h3>
            {handoff.blockers_or_tensions.length ? (
              <div className="compact-list">
                {handoff.blockers_or_tensions.map((blocker) => (
                  <article className="compact-item" key={blocker.title}>
                    <div className="card-topline">
                      <strong>{blocker.title}</strong>
                      <StatusBadge label={formatStatusLabel(blocker.severity)} />
                    </div>
                    <p>{blocker.summary}</p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState
                label="No blockers or tensions"
                description="The current handoff does not report anything blocking the next action."
              />
            )}
          </section>

          <section className="handoff-section codex-brief">
            <h3>Codex handoff</h3>
            <p>{codex.task_brief}</p>
            <div className="command-list">
              {codex.verification_commands.map((command) => (
                <code key={command}>{command}</code>
              ))}
            </div>
          </section>
        </div>
      </div>

      {rawStateKeys.length ? (
        <details className="handoff-raw-keys">
          <summary>State key references</summary>
          <div className="meta-row">
            {rawStateKeys.map((stateKey) => (
              <span key={stateKey}>
                {formatStateKeyLabel(stateKey)} <code>{stateKey}</code>
              </span>
            ))}
          </div>
        </details>
      ) : null}
    </section>
  );
}

function WorkFocusSection({
  workItems,
  selectedWorkId,
  workBrief,
  error,
  onSelectWork,
}: {
  workItems: WorkItem[];
  selectedWorkId: string | null;
  workBrief: WorkBriefResponse | null;
  error: string | null;
  onSelectWork: (workId: string) => void;
}) {
  const [copyFeedback, setCopyFeedback] = useState<
    Record<WorkCopyTarget, Notice | null>
  >({
    workCodex: null,
    workEvent: null,
  });
  const selectedItem =
    workBrief?.work ??
    workItems.find((item) => item.work_id === selectedWorkId) ??
    null;

  async function copyToClipboard(
    target: WorkCopyTarget,
    label: string,
    getText: () => string,
  ) {
    try {
      const text = getText();

      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard API is unavailable.");
      }

      await navigator.clipboard.writeText(text);
      setCopyFeedback((current) => ({
        ...current,
        [target]: {
          tone: "info",
          text: `${label} copied`,
        },
      }));
    } catch (copyError) {
      setCopyFeedback((current) => ({
        ...current,
        [target]: {
          tone: "error",
          text:
            copyError instanceof Error
              ? copyError.message
              : `${label} copy failed`,
        },
      }));
    }
  }

  return (
    <section className="work-focus-shell" aria-label="Work Focus">
      <PanelHeader
        eyebrow="Work Focus"
        title="Trace Spine"
        description="Work ID is a trace anchor. Durable state lives in committed Augnes state; execution proof lives in action records and the Temporal State Graph."
      />
      <SelectedWorkHandoffSnapshot
        selectedWorkId={selectedWorkId}
        selectedWorkItem={selectedItem}
        workBrief={workBrief}
      />

      {error ? (
        <EmptyState
          label="Work focus unavailable"
          description={error}
        />
      ) : workItems.length === 0 ? (
        <EmptyState
          label="No work items"
          description="Run the demo seed or add work registry entries to inspect focused traces."
        />
      ) : (
        <div className="work-focus-grid">
          <div className="work-list" aria-label="Work list">
            {workItems.map((item) => (
              <button
                className={`work-list-item${
                  item.work_id === selectedWorkId ? " is-selected" : ""
                }`}
                key={item.work_id}
                type="button"
                onClick={() => onSelectWork(item.work_id)}
              >
                <span className="work-list-heading">
                  <strong>{item.work_id}</strong>
                  {item.user_attention_required ? (
                    <span className="attention-dot">attention</span>
                  ) : null}
                </span>
                <span>{item.title}</span>
                <span className="work-list-meta">
                  <StatusBadge label={formatStatusLabel(item.status)} />
                  <StatusBadge
                    label={formatStatusLabel(item.priority)}
                    tone={getPriorityTone(item.priority)}
                  />
                  <time dateTime={item.updated_at}>{formatDate(item.updated_at)}</time>
                </span>
              </button>
            ))}
          </div>

          <div className="work-focus-card">
            {selectedItem && workBrief ? (
              <>
                <div className="card-topline">
                  <div className="state-key-heading">
                    <h3>
                      {selectedItem.work_id}: {selectedItem.title}
                    </h3>
                    <code>{selectedItem.scope}</code>
                  </div>
                  <div className="timeline-badges">
                    <StatusBadge label={formatStatusLabel(selectedItem.status)} />
                    <StatusBadge
                      label={formatStatusLabel(selectedItem.priority)}
                      tone={getPriorityTone(selectedItem.priority)}
                    />
                  </div>
                </div>

                <p className="work-summary">{selectedItem.summary}</p>
                <div className="work-next-action">
                  <span>Next action</span>
                  <strong>{workBrief.next_action || "No next action recorded"}</strong>
                </div>

                <section className="work-proof-block">
                  <h4>Recent events</h4>
                  {workBrief.recent_events.length ? (
                    <div className="work-event-list">
                      {workBrief.recent_events.map((event) => (
                        <article className="work-event-item" key={event.id}>
                          <div className="card-topline">
                            <strong>{formatStatusLabel(event.event_type)}</strong>
                            <time dateTime={event.created_at}>
                              {formatDate(event.created_at)}
                            </time>
                          </div>
                          <p>{event.summary}</p>
                          <div className="meta-row">
                            <span>{formatStatusLabel(event.actor)}</span>
                            {event.result_status ? (
                              <span>{formatStatusLabel(event.result_status)}</span>
                            ) : null}
                            {event.related_action_id ? (
                              <span>
                                action <code>{event.related_action_id}</code>
                              </span>
                            ) : null}
                            {event.related_pr ? (
                              <span>
                                PR <code>{event.related_pr}</code>
                              </span>
                            ) : null}
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <EmptyState label="No recent events" />
                  )}
                </section>
              </>
            ) : selectedItem ? (
              <LoadingBlock
                title={`Loading ${selectedItem.work_id}`}
                lines={["Fetching work brief", "Preparing proof links"]}
              />
            ) : (
              <EmptyState label="Select a work item" />
            )}
          </div>

          <aside className="work-context-card">
            {selectedItem && workBrief ? (
              <>
                <PanelHeader
                  eyebrow="Context / Proof"
                  title="Work Summary"
                  description="Work IDs anchor traces. Ledger owns truth."
                />
                <dl className="work-context-fields">
                  <div>
                    <dt>Work ID</dt>
                    <dd>{selectedItem.work_id}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{formatStatusLabel(selectedItem.status)}</dd>
                  </div>
                  <div>
                    <dt>Priority</dt>
                    <dd>{formatStatusLabel(selectedItem.priority)}</dd>
                  </div>
                  <div>
                    <dt>Scope</dt>
                    <dd>{selectedItem.scope}</dd>
                  </div>
                </dl>

                <section className="work-context-section">
                  <h4>Related state keys</h4>
                  {workBrief.related_state_keys.length ? (
                    <div className="meta-row">
                      {workBrief.related_state_keys.map((stateKey) => (
                        <span key={stateKey}>
                          {formatStateKeyLabel(stateKey)} <code>{stateKey}</code>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <EmptyState label="No related state keys" />
                  )}
                </section>

                <section className="work-context-section">
                  <h4>Related proof / context</h4>
                  <ProofList brief={workBrief} />
                </section>

                <details className="work-context-section work-handoff-details">
                  <summary>
                    <span>Codex handoff draft</span>
                    <small>Draft/copy only</small>
                  </summary>
                  <WorkCodexHandoffReview codexHandoff={workBrief.codex_handoff} />
                  <div className="work-copy-row">
                    <div className="copy-control">
                      <button
                        type="button"
                        onClick={() =>
                          void copyToClipboard(
                            "workCodex",
                            "Work Codex handoff",
                            () => buildWorkCodexHandoffText(workBrief),
                          )
                        }
                      >
                        Copy Codex handoff
                      </button>
                      <CopyFeedback notice={copyFeedback.workCodex} />
                    </div>
                    <div className="copy-control">
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() =>
                          void copyToClipboard(
                            "workEvent",
                            "Work event template",
                            () =>
                              formatWorkEventTemplate(
                                workBrief.codex_handoff.work_event_template,
                              ),
                          )
                        }
                      >
                        Copy work event template
                      </button>
                      <CopyFeedback notice={copyFeedback.workEvent} />
                    </div>
                  </div>
                </details>
              </>
            ) : selectedItem ? (
              <LoadingBlock
                title={`Loading ${selectedItem.work_id} context`}
                lines={["Fetching state keys", "Preparing handoff draft"]}
              />
            ) : (
              <EmptyState label="Select a work item" />
            )}
          </aside>
        </div>
      )}
    </section>
  );
}

function WorkCodexHandoffReview({
  codexHandoff,
}: {
  codexHandoff: WorkBriefResponse["codex_handoff"];
}) {
  const constraintsCount = codexHandoff.constraints.length;
  const suggestedVerificationCount = codexHandoff.suggested_verification.length;
  const workEventTemplateAvailable =
    Object.keys(codexHandoff.work_event_template).length > 0;

  return (
    <section className="work-codex-handoff-review" aria-label="Codex Handoff Review">
      <PanelHeader
        eyebrow="Local draft"
        title="Codex Handoff Review"
        description="Review the local task brief, constraints, and suggested verification before copying this handoff. This does not execute Codex."
      />
      <div className="work-codex-handoff-grid">
        <div className="work-codex-handoff-field">
          <span>Constraints</span>
          <strong>{constraintsCount}</strong>
        </div>
        <div className="work-codex-handoff-field">
          <span>Suggested verification</span>
          <strong>{suggestedVerificationCount}</strong>
        </div>
        <div className="work-codex-handoff-field">
          <span>Work event template</span>
          <strong>{workEventTemplateAvailable ? "Available" : "Not loaded"}</strong>
        </div>
      </div>

      <div className="work-codex-handoff-block">
        <h4>Task brief</h4>
        <p>{codexHandoff.task_brief}</p>
      </div>

      <div className="work-codex-handoff-block">
        <h4>Constraints</h4>
        {constraintsCount ? (
          <ul className="work-codex-handoff-list">
            {codexHandoff.constraints.map((constraint) => (
              <li key={constraint}>{constraint}</li>
            ))}
          </ul>
        ) : (
          <p>No constraints recorded</p>
        )}
      </div>

      <div className="work-codex-handoff-block">
        <h4>Suggested verification</h4>
        {suggestedVerificationCount ? (
          <ul className="work-codex-handoff-list">
            {codexHandoff.suggested_verification.map((command) => (
              <li key={command}>
                <code>{command}</code>
              </li>
            ))}
          </ul>
        ) : (
          <p>No suggested verification recorded</p>
        )}
      </div>

      <BoundaryNote>
        Read-only handoff review. Copying text does not execute Codex, call providers, post to GitHub, approve, merge, publish, mutate Augnes, or commit/reject state.
      </BoundaryNote>
    </section>
  );
}

function SelectedWorkHandoffSnapshot({
  selectedWorkId,
  selectedWorkItem,
  workBrief,
}: {
  selectedWorkId: string | null;
  selectedWorkItem: WorkItem | null;
  workBrief: WorkBriefResponse | null;
}) {
  const workId =
    selectedWorkItem?.work_id ?? workBrief?.work_id ?? selectedWorkId ?? null;
  const title = selectedWorkItem?.title ?? workBrief?.work.title ?? null;
  const status = selectedWorkItem?.status ?? workBrief?.work.status ?? null;
  const priority = selectedWorkItem?.priority ?? workBrief?.work.priority ?? null;
  const needsAttention =
    selectedWorkItem?.user_attention_required ??
    workBrief?.user_attention_required ??
    false;
  const nextAction =
    workBrief?.next_action || selectedWorkItem?.next_action || "No next action recorded";
  const relatedStateKeys =
    workBrief?.related_state_keys ?? selectedWorkItem?.related_state_keys ?? [];
  const recentEventCount = workBrief?.recent_events.length ?? 0;
  const suggestedVerificationCount =
    workBrief?.codex_handoff?.suggested_verification.length ?? 0;
  const codexHandoffAvailable = Boolean(workBrief?.codex_handoff);

  return (
    <section
      className="cockpit-surface-card selected-work-handoff-snapshot"
      aria-label="Selected Work Handoff Snapshot"
    >
      <PanelHeader
        eyebrow="Selected work"
        title="Selected Work Handoff Snapshot"
        description="Local handoff view for the selected work item. This is read-only and does not execute Codex, post, approve, merge, publish, or mutate state."
      />
      {!workId ? (
        <EmptyState
          label="No selected work"
          description="Select a work item to see local handoff context."
        />
      ) : (
        <>
          <div className="selected-work-handoff-grid">
            <MetricCard
              label="Selected work"
              value={workId}
              detail={title ?? "No selected work"}
            />
            <MetricCard
              label="Status"
              value={status ? formatStatusLabel(status) : "Not loaded"}
              detail="selected work state"
            />
            <MetricCard
              label="Priority"
              value={priority ? formatStatusLabel(priority) : "Not loaded"}
              detail="local work ordering"
            />
            <MetricCard
              label="Needs attention"
              value={needsAttention ? "Yes" : "No"}
              detail="user attention required"
            />
            <MetricCard label="Next action" value={nextAction} detail="local handoff cue" />
            <MetricCard
              label="Related state keys"
              value={relatedStateKeys.length}
              detail={
                relatedStateKeys.length === 0
                  ? "No related state keys"
                  : "state key references"
              }
            />
            <MetricCard
              label="Recent events"
              value={recentEventCount}
              detail="loaded work trace events"
            />
            <MetricCard
              label="Codex handoff"
              value={codexHandoffAvailable ? "Available" : "Not loaded"}
              detail="draft handoff material"
            />
            <MetricCard
              label="Suggested verification"
              value={suggestedVerificationCount}
              detail="local verification prompts"
            />
          </div>
          {relatedStateKeys.length ? (
            <div className="selected-work-state-keys">
              <RefChipList refs={relatedStateKeys} emptyLabel="No related state keys" />
            </div>
          ) : null}
        </>
      )}
      <div className="selected-work-handoff-next">
        <BoundaryNote tone="green">
          Safe next step: Review the selected work brief, related state keys, and suggested verification before delegating or closing out work.
        </BoundaryNote>
        <BoundaryNote>
          Read-only snapshot. No Codex execution, GitHub posting, PR review creation, approval, merge, publication, provider call, Augnes mutation, or state commit/reject.
        </BoundaryNote>
      </div>
    </section>
  );
}

function ProofList({ brief }: { brief: WorkBriefResponse }) {
  const linkEntries = Object.entries(brief.related_proof.links);
  const hasProof =
    brief.related_proof.action_ids.length > 0 ||
    brief.related_proof.prs.length > 0 ||
    brief.related_proof.docs.length > 0 ||
    linkEntries.length > 0;

  if (!hasProof) {
    return (
      <EmptyState
        label="No proof links yet"
        description="Link work events to action records, PRs, docs, or state keys as evidence appears."
      />
    );
  }

  return (
    <div className="proof-list">
      {brief.related_proof.action_ids.map((id) => (
        <span key={id}>
          Action <code>{id}</code>
        </span>
      ))}
      {brief.related_proof.prs.map((pr) => (
        <span key={pr}>
          PR <code>{pr}</code>
        </span>
      ))}
      {brief.related_proof.docs.map((doc) => (
        <span key={doc}>
          Doc <code>{doc}</code>
        </span>
      ))}
      {linkEntries.map(([key, value]) => (
        <span key={key}>
          {formatStatusLabel(key)} <code>{formatCompactJson(value)}</code>
        </span>
      ))}
    </div>
  );
}

function MailboxSummaryPanel({
  mailboxSummary,
  error,
}: {
  mailboxSummary: MailboxSummaryResponse | null;
  error: string | null;
}) {
  const inactive = mailboxSummary?.summary.inactive;
  const activeCount = mailboxSummary
    ? mailboxSummary.summary.pending_handoffs.length +
      mailboxSummary.summary.needs_review.length +
      mailboxSummary.summary.approval_needed.length +
      mailboxSummary.summary.blocked_or_partial.length
    : 0;

  return (
    <section className="mailbox-summary-shell" aria-label="Mailbox Summary">
      <PanelHeader
        eyebrow="Mailbox"
        title="Read-Only Summary"
        description="Derived from mailbox messages. This panel does not acknowledge, approve, reject, execute, publish, or record proof."
      />
      {error ? (
        <EmptyState label="Mailbox summary unavailable" description={error} />
      ) : !mailboxSummary ? (
        <LoadingBlock
          title="Loading mailbox summary"
          lines={["Reading mailbox messages", "Classifying active review items"]}
        />
      ) : activeCount === 0 ? (
        <div className="mailbox-summary-empty">
          <EmptyState
            label="No active mailbox summary items"
            description="Superseded and expired messages stay out of active buckets."
          />
          <MailboxInactiveCounts inactive={inactive} />
        </div>
      ) : (
        <>
          <div className="mailbox-summary-grid">
            <MailboxSummaryBucket
              title="Pending Handoffs"
              items={mailboxSummary.summary.pending_handoffs}
              emptyLabel="No ready or delivered handoffs"
            />
            <MailboxSummaryBucket
              title="Needs Review"
              items={mailboxSummary.summary.needs_review}
              emptyLabel="No review-needed items"
            />
            <MailboxSummaryBucket
              title="Approval Needed"
              items={mailboxSummary.summary.approval_needed}
              emptyLabel="No approval-needed notices"
            />
            <MailboxSummaryBucket
              title="Blocked or Partial"
              items={mailboxSummary.summary.blocked_or_partial}
              emptyLabel="No blocked or partial result notices"
            />
          </div>
          <MailboxInactiveCounts inactive={inactive} />
          <details className="mailbox-boundaries">
            <summary>Summary boundaries</summary>
            <ul>
              {mailboxSummary.boundaries.map((boundary) => (
                <li key={boundary}>{boundary}</li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}

function MailboxSummaryBucket({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: MailboxSummaryItem[];
  emptyLabel: string;
}) {
  return (
    <section className="mailbox-summary-bucket">
      <div className="card-topline">
        <h3>{title}</h3>
        <StatusBadge label={`${items.length}`} tone={items.length ? "ready" : "muted"} />
      </div>
      {items.length ? (
        <div className="mailbox-summary-list">
          {items.map((item) => (
            <article className="mailbox-summary-item" key={item.message_id}>
              <div className="card-topline">
                <strong>{item.work_id ?? "Unscoped work"}</strong>
                <StatusBadge
                  label={formatStatusLabel(item.status)}
                  tone={getMailboxStatusTone(item.status)}
                />
              </div>
              <p>{item.summary}</p>
              <div className="meta-row">
                <span>{formatStatusLabel(item.message_type)}</span>
                <span>{formatStatusLabel(item.summary_reason)}</span>
                {item.payload_ref ? (
                  <span>
                    ref <code>{item.payload_ref}</code>
                  </span>
                ) : null}
                <time dateTime={item.created_at}>{formatDate(item.created_at)}</time>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState label={emptyLabel} />
      )}
    </section>
  );
}

function MailboxInactiveCounts({
  inactive,
}: {
  inactive: MailboxSummaryResponse["summary"]["inactive"] | undefined;
}) {
  return (
    <div className="mailbox-inactive-counts" aria-label="Inactive mailbox counts">
      <span>Inactive</span>
      <strong>{inactive?.superseded_count ?? 0} superseded</strong>
      <strong>{inactive?.expired_count ?? 0} expired</strong>
    </div>
  );
}

function PublicationSummaryPanel({
  publicationSummary,
  error,
}: {
  publicationSummary: PublicationSummaryResponse | null;
  error: string | null;
}) {
  const status = publicationSummary?.summary.delivery_status;
  const publicationCount = publicationSummary
    ? publicationSummary.summary.drafts.length +
      publicationSummary.summary.approved_previews.length +
      publicationSummary.summary.sent.length +
      publicationSummary.summary.failed.length +
      publicationSummary.summary.cancelled.length
    : 0;

  return (
    <section
      className="publication-summary-shell"
      aria-label="Publication Preview / Delivery Status"
    >
      <PanelHeader
        eyebrow="Publication"
        title="Preview / Delivery Status"
        description="Derived bounded read-only view over recent publication drafts and delivery ledger rows. This panel does not approve, publish, retry, post, record proof, or commit state."
      />
      {error ? (
        <EmptyState
          label="Publication summary unavailable"
          description={error}
        />
      ) : !publicationSummary ? (
        <LoadingBlock
          title="Loading publication summary"
          lines={["Reading publication drafts", "Reading delivery ledger"]}
        />
      ) : publicationCount === 0 ? (
        <div className="publication-summary-empty">
          <EmptyState
            label="No publication previews or deliveries"
            description="Publication drafts and delivery rows will appear here as read-only status."
          />
          <PublicationDeliveryCounts
            limits={publicationSummary.limits}
            status={status}
          />
        </div>
      ) : (
        <>
          <PublicationDeliveryCounts
            limits={publicationSummary.limits}
            status={status}
          />
          <div className="publication-summary-grid">
            <PublicationSummaryBucket
              title="Drafts"
              items={publicationSummary.summary.drafts}
              emptyLabel="No draft previews"
            />
            <PublicationSummaryBucket
              title="Approved Previews"
              items={publicationSummary.summary.approved_previews}
              emptyLabel="No approved previews"
            />
            <PublicationSummaryBucket
              title="Sent"
              items={publicationSummary.summary.sent}
              emptyLabel="No sent publications"
            />
            <PublicationSummaryBucket
              title="Failed"
              items={publicationSummary.summary.failed}
              emptyLabel="No failed publications"
            />
            <PublicationSummaryBucket
              title="Cancelled"
              items={publicationSummary.summary.cancelled}
              emptyLabel="No cancelled publications"
            />
            <PublicationFailedDeliveryBucket
              items={publicationSummary.summary.failed_deliveries}
            />
          </div>
          <details className="publication-boundaries">
            <summary>Summary boundaries</summary>
            <ul>
              {publicationSummary.boundaries.map((boundary) => (
                <li key={boundary}>{boundary}</li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}

function PublicationDeliveryCounts({
  limits,
  status,
}: {
  limits: PublicationSummaryResponse["limits"] | undefined;
  status: PublicationSummaryResponse["summary"]["delivery_status"] | undefined;
}) {
  return (
    <div
      className="publication-delivery-counts"
      aria-label="Delivery status counts"
    >
      <span>
        Bounded delivery ledger
        {limits ? `: latest ${limits.delivery_limit}` : ""}
      </span>
      <strong>{status?.pending_count ?? 0} pending</strong>
      <strong>{status?.sent_count ?? 0} sent</strong>
      <strong>{status?.failed_count ?? 0} failed</strong>
      <strong>{status?.acknowledged_count ?? 0} acknowledged</strong>
    </div>
  );
}

function PublicationSummaryBucket({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: PublicationSummaryItem[];
  emptyLabel: string;
}) {
  return (
    <section className="publication-summary-bucket">
      <div className="card-topline">
        <h3>{title}</h3>
        <StatusBadge
          label={`${items.length}`}
          tone={items.length ? "ready" : "muted"}
        />
      </div>
      {items.length ? (
        <div className="publication-summary-list">
          {items.map((item) => (
            <article
              className="publication-summary-item"
              key={item.publication_id}
            >
              <div className="card-topline">
                <strong>{item.work_id ?? "Unscoped work"}</strong>
                <StatusBadge
                  label={formatStatusLabel(item.status)}
                  tone={getPublicationStatusTone(item.status)}
                />
              </div>
              <p>{item.preview_excerpt}</p>
              <div className="meta-row">
                <span>{formatStatusLabel(item.target_surface)}</span>
                <span>
                  target <code>{item.target_ref}</code>
                </span>
                {item.latest_delivery_status ? (
                  <span>
                    delivery{" "}
                    <code>{formatStatusLabel(item.latest_delivery_status)}</code>
                  </span>
                ) : (
                  <span>no delivery rows</span>
                )}
                <span>{item.delivery_count} deliveries</span>
                <time dateTime={item.updated_at}>{formatDate(item.updated_at)}</time>
              </div>
              <div className="publication-eligibility">
                <StatusBadge
                  label={
                    item.publish_eligibility.dry_run
                      ? "Dry-run eligible"
                      : "Dry-run blocked"
                  }
                  tone={item.publish_eligibility.dry_run ? "active" : "muted"}
                />
                <StatusBadge
                  label={
                    item.publish_eligibility.actual_publish
                      ? "Backend route preconditions met"
                      : "Backend route preconditions blocked"
                  }
                  tone={
                    item.publish_eligibility.actual_publish
                      ? "needs-review"
                      : "muted"
                  }
                />
              </div>
              <p className="publication-summary-reason">
                {item.publish_eligibility.reason}
              </p>
              {item.latest_delivery_error ? (
                <p className="publication-error">
                  {item.latest_delivery_error}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState label={emptyLabel} />
      )}
    </section>
  );
}

function PublicationFailedDeliveryBucket({
  items,
}: {
  items: FailedDeliverySummaryItem[];
}) {
  return (
    <section className="publication-summary-bucket">
      <div className="card-topline">
        <h3>Failed Deliveries</h3>
        <StatusBadge
          label={`${items.length}`}
          tone={items.length ? "needs-review" : "muted"}
        />
      </div>
      {items.length ? (
        <div className="publication-summary-list">
          {items.map((item) => (
            <article className="publication-summary-item" key={item.delivery_id}>
              <div className="card-topline">
                <strong>{item.work_id ?? item.publication_id}</strong>
                <StatusBadge label="Failed" tone="tension" />
              </div>
              <p className="publication-error">
                {item.error_message ?? "No stored error_message."}
              </p>
              <div className="meta-row">
                <span>{formatStatusLabel(item.target_surface)}</span>
                <span>
                  target <code>{item.target_ref}</code>
                </span>
                <span>
                  delivery <code>{item.delivery_id}</code>
                </span>
                <time dateTime={item.updated_at}>{formatDate(item.updated_at)}</time>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState label="No failed deliveries" />
      )}
    </section>
  );
}

function ApprovalGateStatePanel({
  approvalGateState,
  error,
}: {
  approvalGateState: ApprovalGateStateSummaryResponse | null;
  error: string | null;
}) {
  const counts = approvalGateState?.counts;
  const requestedItems = approvalGateState?.summary.requested ?? [];

  return (
    <section className="approval-gate-shell" aria-label="Approval Gate State">
      <PanelHeader
        eyebrow="Approval Gate"
        title="Read-Only Gate State"
        description="Derived from approval request records, publication drafts, and delivery ledger rows. This panel does not approve, publish, retry, post, record proof, update mailbox status, or commit state."
      />
      {error ? (
        <EmptyState
          label="Approval gate-state unavailable"
          description={error}
        />
      ) : !approvalGateState ? (
        <LoadingBlock
          title="Loading approval gate state"
          lines={[
            "Reading approval request records",
            "Comparing publication targets and deliveries",
          ]}
        />
      ) : requestedItems.length === 0 ? (
        <div className="approval-gate-empty">
          <EmptyState
            label="No requested approval gate records"
            description="Approval request records will appear here as read-only gate context."
          />
          <ApprovalGateCounts counts={counts} limits={approvalGateState.limits} />
        </div>
      ) : (
        <>
          <ApprovalGateCounts counts={counts} limits={approvalGateState.limits} />
          <div className="approval-gate-grid">
            <ApprovalGateBucket
              title="Dry-Run Ready"
              items={
                approvalGateState.summary
                  .dry_run_ready_for_future_publish
              }
              emptyLabel="No request has passed dry-run readiness"
            />
            <ApprovalGateBucket
              title="Dry-Run Blocked"
              items={approvalGateState.summary.dry_run_blocked}
              emptyLabel="No dry-run readiness blockers"
            />
            <ApprovalGateBucket
              title="Approved For Future Readiness"
              items={
                approvalGateState.summary
                  .approved_for_future_publish_readiness
              }
              emptyLabel="No request has a stored approval grant"
            />
            <ApprovalGateBucket
              title="Ready For Review"
              items={approvalGateState.summary.ready_for_future_approval_review}
              emptyLabel="No request is ready for future approval review"
            />
            <ApprovalGateBucket
              title="Blocked or Not Ready"
              items={approvalGateState.summary.blocked_or_not_ready}
              emptyLabel="No blocked active requests"
            />
            <ApprovalGateBucket
              title="Stale or Mismatched"
              items={approvalGateState.summary.stale_or_mismatched}
              emptyLabel="No stale or mismatched requests"
            />
          </div>
          <ApprovalGateInactiveCounts
            inactive={approvalGateState.summary.terminal_or_inactive}
          />
          <details className="approval-gate-boundaries">
            <summary>Gate-state boundaries</summary>
            <ul>
              {approvalGateState.boundaries.map((boundary) => (
                <li key={boundary}>{boundary}</li>
              ))}
            </ul>
          </details>
        </>
      )}
    </section>
  );
}

function ApprovalGateCounts({
  counts,
  limits,
}: {
  counts: ApprovalGateStateSummaryResponse["counts"] | undefined;
  limits: ApprovalGateStateSummaryResponse["limits"] | undefined;
}) {
  return (
    <div className="approval-gate-counts" aria-label="Approval gate counts">
      <span>
        Bounded approval requests
        {limits ? `: latest ${limits.approval_request_limit}` : ""}
      </span>
      <strong>{counts?.requested_count ?? 0} requested</strong>
      <strong>{counts?.dry_run_ready_count ?? 0} dry-run ready</strong>
      <strong>{counts?.dry_run_blocked_count ?? 0} dry-run blocked</strong>
      <strong>{counts?.approved_count ?? 0} approved</strong>
      <strong>{counts?.ready_for_review_count ?? 0} ready for review</strong>
      <strong>{counts?.blocked_count ?? 0} blocked</strong>
      <strong>{counts?.superseded_count ?? 0} superseded</strong>
      <strong>{counts?.cancelled_count ?? 0} cancelled</strong>
      <strong>{counts?.expired_count ?? 0} expired</strong>
    </div>
  );
}

function ApprovalGateInactiveCounts({
  inactive,
}: {
  inactive:
    | ApprovalGateStateSummaryResponse["summary"]["terminal_or_inactive"]
    | undefined;
}) {
  return (
    <div
      className="approval-gate-inactive-counts"
      aria-label="Inactive approval request counts"
    >
      <span>Inactive</span>
      <strong>{inactive?.superseded_count ?? 0} superseded</strong>
      <strong>{inactive?.cancelled_count ?? 0} cancelled</strong>
      <strong>{inactive?.expired_count ?? 0} expired</strong>
    </div>
  );
}

function ApprovalGateBucket({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: ApprovalGateStateItem[];
  emptyLabel: string;
}) {
  return (
    <section className="approval-gate-bucket">
      <div className="card-topline">
        <h3>{title}</h3>
        <StatusBadge
          label={`${items.length}`}
          tone={items.length ? "needs-review" : "muted"}
        />
      </div>
      {items.length ? (
        <div className="approval-gate-list">
          {items.map((item) => (
            <article
              className="approval-gate-item"
              key={item.approval_request_id}
            >
              <div className="card-topline">
                <strong>{item.work_id ?? item.publication_id}</strong>
                <StatusBadge
                  label={formatStatusLabel(item.gate_state)}
                  tone={getApprovalGateStateTone(item.gate_state)}
                />
              </div>
              <p>{item.decision_prompt}</p>
              <p className="approval-gate-side-effect">
                {item.side_effect_summary}
              </p>
              <div className="meta-row">
                <span>
                  request <code>{item.approval_request_id}</code>
                </span>
                <span>
                  publication <code>{item.publication_id}</code>
                </span>
                <span>{formatStatusLabel(item.target_surface)}</span>
                <span>
                  target <code>{item.target_ref}</code>
                </span>
                <span>
                  publication{" "}
                  <code>
                    {item.publication_status
                      ? formatStatusLabel(item.publication_status)
                      : "missing"}
                  </code>
                </span>
                <span>
                  target match <code>{item.publication_target_match ? "yes" : "no"}</code>
                </span>
                {item.approval_decision_id ? (
                  <>
                    <span>
                      approval decision <code>{item.approval_decision_id}</code>
                    </span>
                    <span>
                      approved by <code>{item.approved_by}</code>
                    </span>
                  </>
                ) : null}
                {item.latest_delivery_status ? (
                  <span>
                    delivery{" "}
                    <code>{formatStatusLabel(item.latest_delivery_status)}</code>
                  </span>
                ) : (
                  <span>no delivery rows</span>
                )}
                <time dateTime={item.requested_at}>
                  {formatDate(item.requested_at)}
                </time>
                {item.approved_at ? (
                  <time dateTime={item.approved_at}>
                    approved {formatDate(item.approved_at)}
                  </time>
                ) : null}
                {item.latest_readiness_checked_at ? (
                  <time dateTime={item.latest_readiness_checked_at}>
                    readiness {formatDate(item.latest_readiness_checked_at)}
                  </time>
                ) : null}
              </div>
              {item.approval_decision_reason ? (
                <p className="approval-gate-side-effect">
                  {item.approval_decision_reason}
                </p>
              ) : null}
              {item.latest_readiness_check_id ? (
                <div className="meta-row">
                  <span>
                    readiness check <code>{item.latest_readiness_check_id}</code>
                  </span>
                  <span>
                    readiness{" "}
                    <code>
                      {item.latest_readiness_status
                        ? formatStatusLabel(item.latest_readiness_status)
                        : "unknown"}
                    </code>
                  </span>
                </div>
              ) : null}
              {item.latest_readiness_summary ? (
                <p className="approval-gate-next-step">
                  {item.latest_readiness_summary}
                </p>
              ) : null}
              {item.latest_readiness_blocked_reasons.length ? (
                <section className="approval-gate-reasons">
                  <h4>Readiness blockers</h4>
                  <ul>
                    {item.latest_readiness_blocked_reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {item.latest_delivery_error ? (
                <p className="approval-gate-error">
                  {item.latest_delivery_error}
                </p>
              ) : null}
              <section className="approval-gate-reasons">
                <h4>Gate reasons</h4>
                <ul>
                  {item.gate_reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </section>
              <p className="approval-gate-next-step">
                {item.safe_next_step}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState label={emptyLabel} />
      )}
    </section>
  );
}

function SessionTracePanel({
  trace,
  error,
  busy,
  requested,
  onRefresh,
}: {
  trace: SessionTraceResponse | null;
  error: string | null;
  busy: boolean;
  requested: boolean;
  onRefresh: () => void;
}) {
  const sessionCount = trace?.sessions.length ?? 0;
  const gaps = trace?.gaps ?? [];

  return (
    <section className="session-trace-shell" aria-label="Session Trace">
      <div className="session-trace-heading">
        <PanelHeader
          eyebrow="Session Trace"
          title="Continuity"
          description="Read-only Session Binding v0.1 trace data. This panel loads only after operator action and does not bind, create, update, or record sessions."
        />
        <button
          type="button"
          className="secondary-button"
          onClick={onRefresh}
          disabled={busy}
        >
          {trace ? "Refresh Session Trace" : "Load Session Trace"}
        </button>
      </div>

      {error ? (
        <EmptyState label="Session trace unavailable" description={error} />
      ) : busy || (requested && !trace) ? (
        <LoadingBlock
          title="Loading session trace"
          lines={[
            "Reading bound session metadata",
            "Summarizing continuity evidence",
          ]}
        />
      ) : !trace ? (
        <EmptyState
          label="Session trace not loaded"
          description="Click Load Session Trace to inspect the read-only continuity view."
        />
      ) : (
        <>
          <div className="session-trace-status">
            <span>
              generated{" "}
              <time dateTime={trace.generated_at}>
                {formatDate(trace.generated_at)}
              </time>
            </span>
            <strong>{sessionCount} sessions</strong>
            <strong>{gaps.length} top-level gaps</strong>
            <span>read-only continuity trace</span>
          </div>

          <SessionTraceGaps title="Top-level gaps" gaps={gaps} />

          {trace.boundaries?.length ? (
            <details className="session-trace-boundaries">
              <summary>Trace boundaries</summary>
              <ul>
                {trace.boundaries.map((boundary) => (
                  <li key={boundary}>{boundary}</li>
                ))}
              </ul>
            </details>
          ) : null}

          {trace.sessions.length ? (
            <div className="session-trace-list">
              {trace.sessions.map((session) => (
                <SessionTraceCard session={session} key={session.session_id} />
              ))}
            </div>
          ) : (
            <EmptyState
              label="No bound sessions"
              description="The session trace API returned no sessions for this scope."
            />
          )}
        </>
      )}
    </section>
  );
}

function SessionTraceCard({ session }: { session: SessionTraceSession }) {
  return (
    <article className="session-trace-card">
      <div className="card-topline">
        <div className="state-key-heading">
          <h3>{session.title || session.session_id}</h3>
          <code>{session.session_id}</code>
        </div>
        <div className="timeline-badges">
          <StatusBadge label={formatStatusLabel(session.surface ?? "unknown")} />
          <StatusBadge label={session.actor ?? "unknown"} />
        </div>
      </div>

      {session.summary ? (
        <p className="session-trace-summary">{session.summary}</p>
      ) : null}

      <dl className="session-trace-fields">
        <SessionTraceField label="related_work_id" value={session.related_work_id} />
        <SessionTraceField label="related_pr" value={session.related_pr} />
        <SessionTraceField label="handoff_ref" value={session.handoff_ref} />
        <SessionTraceField
          label="evidence_pack_ref"
          value={session.evidence_pack_ref}
        />
        <SessionTraceField label="started_at" value={session.started_at} />
        <SessionTraceField label="ended_at" value={session.ended_at} />
      </dl>

      <div className="session-trace-metrics">
        <strong>{session.message_count} messages</strong>
        <strong>{session.work_event_counts.total} work events</strong>
        <strong>{session.evidence_counts.action_records_by_session} action records</strong>
        <strong>
          {session.evidence_counts.verification_evidence_records_total} verification evidence
        </strong>
      </div>

      <div className="session-trace-latest-grid">
        <section>
          <h4>Latest message</h4>
          {session.latest_message ? (
            <>
              <div className="meta-row">
                <span>{formatStatusLabel(session.latest_message.role)}</span>
                <time dateTime={session.latest_message.created_at}>
                  {formatDate(session.latest_message.created_at)}
                </time>
              </div>
              <p>
                message <code>{session.latest_message.id}</code>
              </p>
            </>
          ) : (
            <EmptyState label="No latest message" />
          )}
        </section>

        <section>
          <h4>Latest work event</h4>
          {session.latest_work_event ? (
            <>
              <div className="meta-row">
                {session.latest_work_event.result_status ? (
                  <span>{formatStatusLabel(session.latest_work_event.result_status)}</span>
                ) : null}
                {session.latest_work_event.result_kind ? (
                  <span>{formatStatusLabel(session.latest_work_event.result_kind)}</span>
                ) : (
                  <span>{formatStatusLabel(session.latest_work_event.event_type)}</span>
                )}
                <time dateTime={session.latest_work_event.created_at}>
                  {formatDate(session.latest_work_event.created_at)}
                </time>
              </div>
              <p>{session.latest_work_event.summary}</p>
            </>
          ) : (
            <EmptyState label="No latest work event" />
          )}
        </section>

        <section>
          <h4>Latest evidence record</h4>
          {session.latest_evidence_record ? (
            <>
              <div className="meta-row">
                {session.latest_evidence_record.evidence_id ? (
                  <span>
                    evidence <code>{session.latest_evidence_record.evidence_id}</code>
                  </span>
                ) : null}
                {session.latest_evidence_record.evidence_kind ? (
                  <span>
                    {formatStatusLabel(session.latest_evidence_record.evidence_kind)}
                  </span>
                ) : null}
                {session.latest_evidence_record.status ? (
                  <span>
                    {formatStatusLabel(session.latest_evidence_record.status)}
                  </span>
                ) : null}
              </div>
              {session.latest_evidence_record.label ? (
                <p>{session.latest_evidence_record.label}</p>
              ) : null}
            </>
          ) : (
            <EmptyState label="No latest evidence record" />
          )}
        </section>
      </div>

      <SessionTraceGaps title="Session gaps" gaps={session.gaps ?? []} />
    </article>
  );
}

function SessionTraceField({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value ? <code>{value}</code> : <span>None</span>}</dd>
    </div>
  );
}

function SessionTraceGaps({ title, gaps }: { title: string; gaps: string[] }) {
  if (gaps.length === 0) {
    return (
      <div className="session-trace-gaps is-clear">
        <strong>{title}: none</strong>
      </div>
    );
  }

  return (
    <section className="session-trace-gaps">
      <h4>{title}</h4>
      <ul>
        {gaps.map((gap) => (
          <li key={gap}>{gap}</li>
        ))}
      </ul>
    </section>
  );
}

function TemporalInterpretationPreviewPanel({
  previewResponse,
  error,
  busy,
  requested,
  onRefresh,
}: {
  previewResponse: CockpitTemporalPreviewResponse | null;
  error: string | null;
  busy: boolean;
  requested: boolean;
  onRefresh: () => void;
}) {
  const preview = previewResponse?.preview;
  const guardrails = previewResponse?.guardrails;

  return (
    <section
      className="temporal-preview-shell"
      aria-label="Temporal Interpretation Preview"
    >
      <div className="temporal-preview-heading">
        <PanelHeader
          eyebrow="Temporal Interpretation"
          title="Preview"
          description="Generate is explicit and button-triggered. OpenAI is used only after user action when OPENAI_API_KEY is set; otherwise the route returns deterministic mock output."
        />
        <button
          type="button"
          className="secondary-button"
          onClick={onRefresh}
          disabled={busy}
        >
          {previewResponse
            ? "Refresh Temporal Interpretation Preview"
            : "Load Temporal Interpretation Preview"}
        </button>
      </div>

      {error ? (
        <EmptyState
          label="Temporal interpretation preview unavailable"
          description={error}
        />
      ) : busy || (requested && (!previewResponse || !preview)) ? (
        <LoadingBlock
          title="Loading temporal interpretation preview"
          lines={[
            "Reading current demo context",
            "Applying local guardrails",
          ]}
        />
      ) : !previewResponse || !preview ? (
        <EmptyState
          label="Preview not generated"
          description="Click Load Temporal Interpretation Preview to request the read-only temporal interpretation preview."
        />
      ) : (
        <>
          <div className="temporal-preview-status">
            <StatusBadge label={formatStatusLabel(previewResponse.generator)} />
            <StatusBadge
              label={guardrails?.passed ? "guardrails passed" : "guardrail warnings"}
              tone={guardrails?.passed ? "ready" : "needs-review"}
            />
            <StatusBadge
              label={formatStatusLabel(preview.transition_relation)}
            />
            {previewResponse.model ? (
              <span>
                model <code>{previewResponse.model}</code>
              </span>
            ) : null}
            <span>read-only interpretation preview</span>
          </div>

          <div className="temporal-preview-summary-grid">
            <section className="temporal-preview-card is-hero">
              <h3>Current interpretation</h3>
              <p>{preview.current_interpretation}</p>
            </section>
            <section className="temporal-preview-card is-action">
              <h3>Safe next step</h3>
              <p>{preview.safe_next_step}</p>
            </section>
            <section className="temporal-preview-card is-boundary">
              <h3>Non-authority boundary</h3>
              <p>{preview.non_authority_boundary}</p>
            </section>
            <section className="temporal-preview-card is-wide">
              <h3>Active prior context</h3>
              <p>{preview.active_prior_context}</p>
            </section>
          </div>

          <TemporalPreviewSection
            title="Context reasoning"
            description="Why prior context is admitted now, and which plausible paths remain deferred."
          >
            <section className="temporal-preview-card is-wide">
              <h3>Active context admission</h3>
              <TemporalAdmissionRationale
                items={preview.active_context_admission_rationale}
              />
            </section>
            <section className="temporal-preview-card is-wide">
              <h3>Structured admission decisions</h3>
              <TemporalAdmissionDecisions
                admission={preview.active_context_admission}
              />
            </section>
            <section className="temporal-preview-card">
              <h3>Suppressed alternatives</h3>
              <TemporalSuppressedAlternatives
                items={preview.suppressed_alternatives}
              />
            </section>
          </TemporalPreviewSection>

          <TemporalPreviewSection
            title="Temporal structure"
            description="How the preview relates raw observations, session work, project state, and memory lifecycle."
          >
            <section className="temporal-preview-card is-wide">
              <h3>Temporal hierarchy</h3>
              <TemporalHierarchyView view={preview.temporal_hierarchy_view} />
            </section>
            <section className="temporal-preview-card">
              <h3>Memory lifecycle</h3>
              <TemporalMemoryLifecycle view={preview.memory_lifecycle_view} />
            </section>
          </TemporalPreviewSection>

          <TemporalPreviewSection
            title="Research drivers"
            description="Plain-language drivers and qualitative axis pressures. These are diagnostic labels, not scores."
          >
            <section className="temporal-preview-card is-wide">
              <h3>Interpretive drivers</h3>
              <TemporalInterpretiveDrivers
                items={preview.interpretive_drivers}
              />
            </section>
            <section className="temporal-preview-card">
              <h3>Axis pressures</h3>
              <TemporalAxisPressures items={preview.axis_pressures} />
            </section>
          </TemporalPreviewSection>

          <TemporalPreviewSection
            title="Evidence and authority"
            description="Structured anchors, summary-only references, and the source authority profile."
          >
            <section className="temporal-preview-card">
              <h3>Evidence anchors</h3>
              <TemporalRefList
                items={preview.evidence_anchors.map((anchor) => ({
                  ref: anchor.ref,
                  text: `${anchor.claim} (${formatStatusLabel(anchor.source_type)})`,
                }))}
                emptyLabel="No evidence anchors"
              />
            </section>
            <section className="temporal-preview-card">
              <h3>Summary refs</h3>
              <TemporalRefList
                items={preview.summary_refs.map((ref) => ({
                  ref: ref.ref,
                  text: ref.summary,
                }))}
                emptyLabel="No summary refs"
              />
            </section>
            <section className="temporal-preview-card">
              <h3>Source authority profile</h3>
              <TemporalAuthorityProfile
                profile={preview.source_authority_profile}
              />
            </section>
          </TemporalPreviewSection>

          <TemporalPreviewSection
            title="Review constraints"
            description="Counterexamples, residual tensions, and the transition relation that constrain interpretation."
          >
            <section className="temporal-preview-card">
              <h3>Counterexamples</h3>
              <TemporalRefList
                items={preview.counterexamples.map((item) => ({
                  ref: item.ref,
                  text: item.description,
                }))}
                emptyLabel="No counterexamples"
              />
            </section>
            <section className="temporal-preview-card">
              <h3>Residual tensions</h3>
              <TemporalRefList
                items={preview.residual_tensions.map((item) => ({
                  ref: item.ref,
                  text: item.description,
                }))}
                emptyLabel="No residual tensions"
              />
            </section>
            <section className="temporal-preview-card is-wide">
              <h3>Transition relation</h3>
              <p>{preview.revision_explanation}</p>
              <p>{preview.user_context_vs_factuality}</p>
            </section>
          </TemporalPreviewSection>

          <TemporalWarnings
            warnings={preview.warnings}
            openaiError={previewResponse.openai_error}
          />
        </>
      )}
    </section>
  );
}

function EvidencePackPanel({
  evidencePack,
  error,
  loading,
  onLoad,
}: {
  evidencePack: EvidencePackResponse | null;
  error: string | null;
  loading: boolean;
  onLoad: () => void;
}) {
  return (
    <section className="evidence-pack-shell" aria-label="Evidence Pack">
      <div className="panel-control-row">
        <PanelHeader
          eyebrow="Evidence Pack"
          title="v0.1 Review Bundle"
          description="Button-loaded derived read-only view over work, approval, readiness, delivery, artifact, replay, verification, authority, and gap records."
        />
        <button
          type="button"
          className="secondary-button"
          onClick={onLoad}
          disabled={loading}
        >
          {loading
            ? "Loading"
            : evidencePack
              ? "Refresh Evidence Pack"
              : "Load Evidence Pack"}
        </button>
      </div>

      {error ? (
        <EmptyState label="Evidence Pack unavailable" description={error} />
      ) : !evidencePack ? (
        <EmptyState
          label="Evidence Pack not loaded"
          description="Use the button to fetch the latest derived pack for this scope."
        />
      ) : (
        <div className="evidence-pack-grid">
          <article className="evidence-pack-card evidence-pack-card-wide">
            <div className="card-topline">
              <h3>Selection</h3>
              <StatusBadge label={formatStatusLabel(evidencePack.selection.mode)} />
            </div>
            <p>{evidencePack.selection.selection_reason}</p>
            <div className="meta-row">
              {evidencePack.selection.work_id ? (
                <span>
                  work <code>{evidencePack.selection.work_id}</code>
                </span>
              ) : null}
              {evidencePack.selection.publication_id ? (
                <span>
                  publication <code>{evidencePack.selection.publication_id}</code>
                </span>
              ) : null}
              {evidencePack.selection.delivery_id ? (
                <span>
                  delivery <code>{evidencePack.selection.delivery_id}</code>
                </span>
              ) : null}
              {evidencePack.selection.target_ref ? (
                <span>
                  target <code>{evidencePack.selection.target_ref}</code>
                </span>
              ) : null}
              <time dateTime={evidencePack.generated_at}>
                {formatDate(evidencePack.generated_at)}
              </time>
            </div>
          </article>

          <article className="evidence-pack-card">
            <h3>Publication and Delivery</h3>
            <div className="meta-row">
              <span>
                publication{" "}
                <code>{evidencePack.publication_trace.status ?? "none"}</code>
              </span>
              <span>
                delivery <code>{evidencePack.delivery_trace.status ?? "none"}</code>
              </span>
              <span>
                idempotency{" "}
                <code>
                  {evidencePack.delivery_trace.idempotency_key_present
                    ? "present"
                    : "missing"}
                </code>
              </span>
            </div>
            {evidencePack.publication_trace.preview_excerpt ? (
              <p>{evidencePack.publication_trace.preview_excerpt}</p>
            ) : null}
            {evidencePack.delivery_trace.error_message ? (
              <p className="evidence-pack-error">
                {evidencePack.delivery_trace.error_message}
              </p>
            ) : null}
          </article>

          <article className="evidence-pack-card">
            <h3>External Artifact</h3>
            {evidencePack.delivery_trace.external_artifact_id ||
            evidencePack.delivery_trace.external_artifact_url ||
            evidencePack.delivery_trace.external_artifact_type ? (
              <>
                <div className="meta-row">
                  {evidencePack.delivery_trace.external_artifact_type ? (
                    <span>
                      type{" "}
                      <code>
                        {formatStatusLabel(
                          evidencePack.delivery_trace.external_artifact_type,
                        )}
                      </code>
                    </span>
                  ) : null}
                  {evidencePack.delivery_trace.external_artifact_id ? (
                    <span>
                      id <code>{evidencePack.delivery_trace.external_artifact_id}</code>
                    </span>
                  ) : null}
                </div>
                {evidencePack.delivery_trace.external_artifact_url ? (
                  <a
                    href={evidencePack.delivery_trace.external_artifact_url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open artifact
                  </a>
                ) : null}
              </>
            ) : (
              <EmptyState label="No external artifact recorded" />
            )}
          </article>

          <article className="evidence-pack-card">
            <h3>Approval and Readiness</h3>
            <div className="meta-row">
              <span>
                request{" "}
                <code>
                  {evidencePack.approval_trace.approval_request_status ??
                    "none"}
                </code>
              </span>
              <span>
                decision{" "}
                <code>{evidencePack.approval_trace.approval_decision ?? "none"}</code>
              </span>
              <span>
                readiness{" "}
                <code>{evidencePack.readiness_trace.status ?? "none"}</code>
              </span>
              <span>
                dry-run{" "}
                <code>
                  {evidencePack.readiness_trace.dry_run === null
                    ? "unknown"
                    : evidencePack.readiness_trace.dry_run
                      ? "true"
                      : "false"}
                </code>
              </span>
            </div>
            {evidencePack.readiness_trace.blocked_reasons.length ? (
              <ul>
                {evidencePack.readiness_trace.blocked_reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : null}
          </article>

          <article className="evidence-pack-card">
            <h3>Replay</h3>
            <div className="meta-row">
              <span>
                same-key support{" "}
                <code>
                  {evidencePack.replay_trace.same_key_replay_supported
                    ? "inferred"
                    : "not inferred"}
                </code>
              </span>
              <span>
                observed{" "}
                <code>
                  {evidencePack.replay_trace.same_key_replay_observed === null
                    ? "not recorded"
                    : String(evidencePack.replay_trace.same_key_replay_observed)}
                </code>
              </span>
            </div>
            <ul>
              {evidencePack.replay_trace.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </article>

          <article className="evidence-pack-card">
            <h3>Verification</h3>
            <div className="meta-row">
              <span>{evidencePack.verification_trace.commands_run.length} commands</span>
              <span>{evidencePack.verification_trace.checks_passed.length} passed</span>
              <span>{evidencePack.verification_trace.skipped_checks.length} skipped</span>
            </div>
            <details>
              <summary>Source refs</summary>
              <ul>
                {evidencePack.verification_trace.source_refs.slice(0, 12).map((ref) => (
                  <li key={ref}>{ref}</li>
                ))}
              </ul>
            </details>
          </article>

          <article className="evidence-pack-card evidence-pack-card-wide">
            <h3>Authority Boundary</h3>
            <p>{evidencePack.authority_trace.non_authority_statement}</p>
            <div className="meta-row">
              <span>
                temporal preview{" "}
                <code>
                  {evidencePack.temporal_preview_trace.available
                    ? "available"
                    : "not invoked"}
                </code>
              </span>
              {evidencePack.next_suggested_goal ? (
                <span>
                  next <code>{evidencePack.next_suggested_goal}</code>
                </span>
              ) : null}
            </div>
          </article>

          <article className="evidence-pack-card evidence-pack-card-wide">
            <h3>Gaps</h3>
            {evidencePack.gaps.length ? (
              <ul>
                {evidencePack.gaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
            ) : (
              <EmptyState label="No gaps surfaced" />
            )}
          </article>
        </div>
      )}
    </section>
  );
}

function TemporalReviewArtifactBrowserPanel({
  artifactsResponse,
  selectedArtifact,
  error,
  busy,
  requested,
  onLoad,
  onSelectArtifact,
}: {
  artifactsResponse: TemporalReviewArtifactsResponse | null;
  selectedArtifact: TemporalReviewArtifact | null;
  error: string | null;
  busy: boolean;
  requested: boolean;
  onLoad: () => void;
  onSelectArtifact: (artifactId: string) => void;
}) {
  const gaps = artifactsResponse?.gaps ?? [];

  return (
    <section
      className="temporal-review-artifacts-shell"
      aria-label="Temporal Review Artifacts"
    >
      <div className="temporal-review-artifacts-heading">
        <PanelHeader
          eyebrow="Temporal Review Artifacts"
          title="Read-Only Browser"
          description="Bounded TemporalPreviewReviewArtifact records loaded through GET list APIs only. Selection is local Cockpit UI state; Cockpit DOM is not truth."
        />
        <button
          type="button"
          className="secondary-button"
          onClick={onLoad}
          disabled={busy}
        >
          {artifactsResponse
            ? "Refresh Temporal Review Artifacts"
            : "Load Temporal Review Artifacts"}
        </button>
      </div>

      <div className="temporal-review-authority-note">
        <strong>Read-only, non-authoritative review metadata.</strong>
        <span>
          reviewer_verdict is review metadata, not approval. guardrail_passed is
          guardrail output, not readiness, state commit, approval, publish,
          replay, or memory admission.
        </span>
        <span>
          TemporalPreviewReviewArtifact is a bounded review artifact, not
          PerspectiveSnapshot runtime, RawEpisodeBundle runtime, proof
          publication, committed state, or memory authority.
        </span>
      </div>

      {error ? (
        <EmptyState
          label="Temporal review artifacts unavailable"
          description={error}
        />
      ) : busy || (requested && !artifactsResponse) ? (
        <LoadingBlock
          title="Loading Temporal review artifacts"
          lines={[
            "GET /api/temporal-interpretation/review-artifacts",
            "Reading bounded review artifacts",
          ]}
        />
      ) : !artifactsResponse ? (
        <EmptyState
          label="Temporal Review Artifacts not loaded"
          description="Use Load Temporal Review Artifacts to inspect bounded review artifacts for AG-TEMPORAL-INTERPRETATION."
        />
      ) : artifactsResponse.artifacts.length === 0 ? (
        <div className="temporal-review-empty">
          <TemporalReviewArtifactSummary response={artifactsResponse} />
          <TemporalReviewArtifactGaps gaps={gaps} />
          <TemporalReviewArtifactBoundaries
            boundaries={artifactsResponse.boundaries}
          />
        </div>
      ) : (
        <>
          <TemporalReviewArtifactSummary response={artifactsResponse} />
          <div className="temporal-review-artifacts-grid">
            <div
              className="temporal-review-artifact-list"
              aria-label="Temporal review artifact list"
            >
              {artifactsResponse.artifacts.map((artifact) => (
                <TemporalReviewArtifactCard
                  artifact={artifact}
                  selected={
                    artifact.artifact_id === selectedArtifact?.artifact_id
                  }
                  onSelectArtifact={onSelectArtifact}
                  key={artifact.artifact_id}
                />
              ))}
            </div>
            <TemporalReviewArtifactDetail artifact={selectedArtifact} />
          </div>
          <TemporalReviewArtifactGaps gaps={gaps} />
          <TemporalReviewArtifactBoundaries
            boundaries={artifactsResponse.boundaries}
          />
        </>
      )}
    </section>
  );
}

function TemporalReviewArtifactSummary({
  response,
}: {
  response: TemporalReviewArtifactsResponse;
}) {
  return (
    <div
      className="temporal-review-artifacts-status"
      aria-label="Temporal review artifact response summary"
    >
      <strong>{response.count} artifacts</strong>
      <span>
        work_id <code>{response.filters.work_id}</code>
      </span>
      <span>
        generated{" "}
        <time dateTime={response.generated_at}>
          {formatDate(response.generated_at)}
        </time>
      </span>
      <span>
        limit <code>{response.filters.limit ?? "default"}</code>
      </span>
    </div>
  );
}

function TemporalReviewArtifactCard({
  artifact,
  selected,
  onSelectArtifact,
}: {
  artifact: TemporalReviewArtifact;
  selected: boolean;
  onSelectArtifact: (artifactId: string) => void;
}) {
  return (
    <button
      type="button"
      className={`temporal-review-artifact-card${
        selected ? " is-selected" : ""
      }`}
      onClick={() => onSelectArtifact(artifact.artifact_id)}
    >
      <span className="temporal-review-artifact-card-main">
        <strong>{artifact.artifact_id}</strong>
        <span>{artifact.preview_excerpt}</span>
      </span>
      <span className="temporal-review-artifact-card-meta">
        <StatusBadge label={formatStatusLabel(artifact.reviewer_verdict)} />
        <StatusBadge
          label={
            artifact.guardrail_passed
              ? "guardrail_passed true"
              : "guardrail_passed false"
          }
          tone={artifact.guardrail_passed ? "ready" : "needs-review"}
        />
        <span>{formatStatusLabel(artifact.capture_mode)}</span>
        <time dateTime={artifact.created_at}>{formatDate(artifact.created_at)}</time>
      </span>
    </button>
  );
}

function TemporalReviewArtifactDetail({
  artifact,
}: {
  artifact: TemporalReviewArtifact | null;
}) {
  if (!artifact) {
    return (
      <section className="temporal-review-artifact-detail">
        <EmptyState
          label="No artifact selected"
          description="Select an artifact from the list to inspect bounded details."
        />
      </section>
    );
  }

  return (
    <section
      className="temporal-review-artifact-detail"
      aria-label="Selected Temporal review artifact summary"
    >
      <div className="card-topline">
        <div className="state-key-heading">
          <h3>Selected artifact</h3>
          <code>{artifact.artifact_id}</code>
        </div>
        <div className="timeline-badges">
          <StatusBadge label={formatStatusLabel(artifact.reviewer_verdict)} />
          <StatusBadge
            label={
              artifact.guardrail_passed
                ? "guardrail_passed true"
                : "guardrail_passed false"
            }
            tone={artifact.guardrail_passed ? "ready" : "needs-review"}
          />
        </div>
      </div>

      <p className="temporal-review-preview-excerpt">
        {artifact.preview_excerpt}
      </p>

      <dl className="temporal-review-artifact-fields">
        <TemporalReviewArtifactField
          label="artifact_id"
          value={artifact.artifact_id}
        />
        <TemporalReviewArtifactField
          label="reviewer_verdict"
          value={artifact.reviewer_verdict}
        />
        <TemporalReviewArtifactField
          label="guardrail_passed"
          value={String(artifact.guardrail_passed)}
        />
        <TemporalReviewArtifactField
          label="capture_mode"
          value={artifact.capture_mode}
        />
        <TemporalReviewArtifactField label="generator" value={artifact.generator} />
        <TemporalReviewArtifactField label="model" value={artifact.model} />
        <TemporalReviewArtifactField
          label="source_surface"
          value={artifact.source_surface}
        />
        <TemporalReviewArtifactField
          label="source_ref"
          value={artifact.source_ref}
        />
        <TemporalReviewArtifactField
          label="manual_review_report_path"
          value={artifact.manual_review_report_path}
        />
        <TemporalReviewArtifactField
          label="linked_session_id"
          value={artifact.linked_session_id}
        />
        <TemporalReviewArtifactField
          label="linked_pr_url"
          value={artifact.linked_pr_url}
        />
        <TemporalReviewArtifactField
          label="created_by"
          value={artifact.created_by}
        />
        <TemporalReviewArtifactField
          label="created_at"
          value={artifact.created_at}
        />
        <TemporalReviewArtifactField
          label="updated_at"
          value={artifact.updated_at}
        />
      </dl>

      <div className="temporal-review-ref-grid">
        <TemporalReviewArtifactRefs
          label="linked_evidence_record_ids"
          refs={artifact.linked_evidence_record_ids}
        />
        <TemporalReviewArtifactRefs
          label="evidence_anchor_refs"
          refs={artifact.evidence_anchor_refs}
        />
        <TemporalReviewArtifactRefs
          label="summary_refs"
          refs={artifact.summary_refs}
        />
        <TemporalReviewArtifactRefs
          label="counterexample_refs"
          refs={artifact.counterexample_refs}
        />
        <TemporalReviewArtifactRefs
          label="residual_tension_refs"
          refs={artifact.residual_tension_refs}
        />
      </div>
    </section>
  );
}

function TemporalReviewArtifactField({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value ? <code>{value}</code> : <span>None</span>}</dd>
    </div>
  );
}

function TemporalReviewArtifactRefs({
  label,
  refs,
}: {
  label: string;
  refs: string[];
}) {
  return (
    <section className="temporal-review-artifact-refs">
      <h4>{label}</h4>
      {refs.length ? (
        <ul>
          {refs.map((ref) => (
            <li key={ref}>
              <code>{ref}</code>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState label={`No ${label}`} />
      )}
    </section>
  );
}

function TemporalReviewArtifactGaps({ gaps }: { gaps: string[] }) {
  if (gaps.length === 0) {
    return (
      <div className="temporal-review-artifact-gaps is-clear">
        <strong>gaps: none</strong>
      </div>
    );
  }

  return (
    <section className="temporal-review-artifact-gaps">
      <h3>gaps</h3>
      <ul>
        {gaps.map((gap) => (
          <li key={gap}>{gap}</li>
        ))}
      </ul>
    </section>
  );
}

function TemporalReviewArtifactBoundaries({
  boundaries,
}: {
  boundaries: string[];
}) {
  return (
    <details className="temporal-review-artifact-boundaries">
      <summary>boundaries</summary>
      <ul>
        {boundaries.map((boundary) => (
          <li key={boundary}>{boundary}</li>
        ))}
      </ul>
    </details>
  );
}
function TemporalPreviewSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="temporal-preview-section">
      <div className="temporal-preview-section-header">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      <div className="temporal-preview-grid">{children}</div>
    </section>
  );
}

function TemporalAdmissionRationale({
  items,
}: {
  items: TemporalPreviewResponse["preview"]["active_context_admission_rationale"];
}) {
  if (items.length === 0) {
    return <EmptyState label="No active context admission rationale" />;
  }

  return (
    <div className="temporal-ref-list">
      {items.map((item) => (
        <article className="temporal-ref-item" key={item.context_ref}>
          <code>{item.context_ref}</code>
          <div className="meta-row">
            <StatusBadge label={formatStatusLabel(item.admission_role)} />
          </div>
          <p>{item.why_admitted}</p>
          <p>{item.why_not_merely_summary}</p>
        </article>
      ))}
    </div>
  );
}

function TemporalAdmissionDecisions({
  admission,
}: {
  admission?: CockpitTemporalActiveContextAdmission;
}) {
  if (!admission) {
    return (
      <div className="temporal-admission-decisions">
        <EmptyState label="No structured admission decisions were returned by this preview." />
      </div>
    );
  }

  return (
    <div className="temporal-admission-decisions">
      <p>{admission.note}</p>
      <div className="meta-row">
        <span>{admission.decisions.length} decisions</span>
      </div>
      <div className="temporal-ref-list">
        {admission.decisions.map((decision) => (
          <TemporalAdmissionDecisionCard
            decision={decision}
            key={`${decision.candidate_id}:${decision.category}`}
          />
        ))}
      </div>
    </div>
  );
}

function TemporalAdmissionDecisionCard({
  decision,
}: {
  decision: TemporalActiveContextAdmission["decisions"][number];
}) {
  return (
    <article className="temporal-admission-card">
      <div className="meta-row">
        <StatusBadge label={formatStatusLabel(decision.category)} />
        <span>
          source <code>{decision.source_authority}</code>
        </span>
      </div>
      <code>{decision.candidate_id}</code>
      <p>{decision.reason}</p>
      <TemporalAdmissionRefs label="Evidence refs" refs={decision.evidence_refs} />
      <TemporalAdmissionRefs
        label="Counterexample refs"
        refs={decision.counterexample_refs}
      />
      <TemporalAdmissionRefs
        label="Residual tension refs"
        refs={decision.residual_tension_refs}
      />
    </article>
  );
}

function TemporalAdmissionRefs({
  label,
  refs,
}: {
  label: string;
  refs: string[];
}) {
  return (
    <div className="temporal-admission-refs">
      <strong>{label}</strong>
      <div className="meta-row">
        {refs.length ? (
          refs.map((ref) => (
            <span key={ref}>
              <code>{ref}</code>
            </span>
          ))
        ) : (
          <span>none</span>
        )}
      </div>
    </div>
  );
}

function TemporalSuppressedAlternatives({
  items,
}: {
  items: TemporalPreviewResponse["preview"]["suppressed_alternatives"];
}) {
  if (items.length === 0) {
    return <EmptyState label="No suppressed alternatives" />;
  }

  return (
    <div className="temporal-ref-list">
      {items.map((item) => (
        <article className="temporal-ref-item" key={item.alternative}>
          <strong>{item.alternative}</strong>
          <div className="meta-row">
            <StatusBadge label={formatStatusLabel(item.status)} />
          </div>
          <p>{item.why_deferred}</p>
          <p>{item.what_would_change_status}</p>
        </article>
      ))}
    </div>
  );
}

function TemporalHierarchyView({
  view,
}: {
  view: TemporalPreviewResponse["preview"]["temporal_hierarchy_view"];
}) {
  return (
    <div className="temporal-detail-list">
      <TemporalDetail label="Raw" value={view.raw_observation_level} />
      <TemporalDetail label="Work" value={view.work_or_session_level} />
      <TemporalDetail label="Project" value={view.project_status_level} />
      <TemporalDetail label="Stance" value={view.current_interpretive_stance} />
      <TemporalDetail label="Caution" value={view.hierarchy_caution} />
    </div>
  );
}

function TemporalMemoryLifecycle({
  view,
}: {
  view: TemporalPreviewResponse["preview"]["memory_lifecycle_view"];
}) {
  return (
    <div className="temporal-detail-list">
      <TemporalDetail label="Active" value={view.active_context.join(", ")} />
      <TemporalDetail label="Retrieved" value={view.retrieved_context.join(", ")} />
      <TemporalDetail label="Summary" value={view.summary_or_view.join(", ")} />
      <TemporalDetail
        label="Deferred"
        value={view.stale_or_deferred_context.join(", ")}
      />
      <TemporalDetail label="Caution" value={view.lifecycle_caution} />
    </div>
  );
}

function TemporalInterpretiveDrivers({
  items,
}: {
  items: TemporalPreviewResponse["preview"]["interpretive_drivers"];
}) {
  if (items.length === 0) {
    return <EmptyState label="No interpretive drivers" />;
  }

  return (
    <div className="temporal-ref-list">
      {items.map((item) => (
        <article className="temporal-ref-item" key={`${item.axis}:${item.driver}`}>
          <div className="meta-row">
            <StatusBadge label={formatStatusLabel(item.axis)} />
          </div>
          <p>{item.driver}</p>
          <p>{item.effect}</p>
        </article>
      ))}
    </div>
  );
}

function TemporalAxisPressures({
  items,
}: {
  items: TemporalPreviewResponse["preview"]["axis_pressures"];
}) {
  if (items.length === 0) {
    return <EmptyState label="No axis pressures" />;
  }

  return (
    <div className="temporal-ref-list">
      {items.map((item) => (
        <article className="temporal-ref-item" key={`${item.axis}:${item.pressure}`}>
          <div className="meta-row">
            <StatusBadge label={formatStatusLabel(item.axis)} />
            <StatusBadge label={formatStatusLabel(item.pressure)} />
          </div>
          <p>{item.reason}</p>
        </article>
      ))}
    </div>
  );
}

function TemporalDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="temporal-detail">
      <strong>{label}</strong>
      <p>{value || "none"}</p>
    </div>
  );
}

function TemporalRefList({
  items,
  emptyLabel,
}: {
  items: { ref: string; text: string }[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <EmptyState label={emptyLabel} />;
  }

  return (
    <div className="temporal-ref-list">
      {items.map((item) => (
        <article className="temporal-ref-item" key={item.ref}>
          <code>{item.ref}</code>
          <p>{item.text}</p>
        </article>
      ))}
    </div>
  );
}

function TemporalAuthorityProfile({
  profile,
}: {
  profile: TemporalPreviewResponse["preview"]["source_authority_profile"];
}) {
  return (
    <div className="temporal-authority-profile">
      <TemporalAuthorityBucket
        title="Committed authority"
        items={profile.committed_state_authority}
      />
      <TemporalAuthorityBucket
        title="Summary-only"
        items={profile.summary_only_refs}
      />
      <TemporalAuthorityBucket title="Allowed now" items={profile.allowed_now} />
      <TemporalAuthorityBucket title="Blocked now" items={profile.blocked_now} />
    </div>
  );
}

function TemporalAuthorityBucket({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="temporal-authority-bucket">
      <strong>{title}</strong>
      <div className="meta-row">
        {items.length ? (
          items.map((item) => (
            <span key={item}>
              <code>{item}</code>
            </span>
          ))
        ) : (
          <span>none</span>
        )}
      </div>
    </div>
  );
}

function TemporalWarnings({
  warnings,
  openaiError,
}: {
  warnings: string[];
  openaiError?: string;
}) {
  if (warnings.length === 0 && !openaiError) {
    return (
      <div className="temporal-preview-warnings is-clear">
        <strong>Guardrails clear</strong>
      </div>
    );
  }

  return (
    <section className="temporal-preview-warnings">
      <h3>Guardrail warnings</h3>
      {openaiError ? <p>{openaiError}</p> : null}
      <ul>
        {warnings.map((warning) => (
          <li key={warning}>{warning}</li>
        ))}
      </ul>
    </section>
  );
}

function CoordinationEventTimeline({
  events,
  selectedEvent,
  error,
  onSelectEvent,
}: {
  events: CoordinationEvent[];
  selectedEvent: CoordinationEvent | null;
  error: string | null;
  onSelectEvent: (eventId: string) => void;
}) {
  return (
    <section
      className="coordination-event-shell"
      aria-label="Coordination Event Timeline"
    >
      <PanelHeader
        eyebrow="Coordination"
        title="Coordination Event Timeline"
      />
      {error ? (
        <EmptyState label="Event timeline unavailable" description={error} />
      ) : events.length === 0 ? (
        <EmptyState label="No coordination events" />
      ) : (
        <div className="coordination-event-grid">
          <div className="coordination-event-list" aria-label="Event list">
            {events.map((event) => (
              <button
                className={`coordination-event-item${
                  event.event_id === selectedEvent?.event_id
                    ? " is-selected"
                    : ""
                }`}
                key={event.event_id}
                type="button"
                onClick={() => onSelectEvent(event.event_id)}
              >
                <span className="coordination-event-node" aria-hidden="true" />
                <span className="coordination-event-main">
                  <strong>{formatStatusLabel(event.event_type)}</strong>
                  <code>{event.event_id}</code>
                </span>
                <span className="coordination-event-meta">
                  <StatusBadge
                    label={formatStatusLabel(event.authority_level)}
                    tone={getAuthorityTone(event.authority_level)}
                  />
                  {event.work_id ? (
                    <span>
                      Work <code>{event.work_id}</code>
                    </span>
                  ) : null}
                  <time dateTime={event.created_at}>
                    {formatDate(event.created_at)}
                  </time>
                </span>
              </button>
            ))}
          </div>
          <CoordinationEventInspector event={selectedEvent} />
        </div>
      )}
    </section>
  );
}

function CoordinationEventInspector({
  event,
}: {
  event: CoordinationEvent | null;
}) {
  if (!event) {
    return (
      <aside className="coordination-event-inspector">
        <PanelHeader eyebrow="Inspect" title="Event Inspector" />
        <EmptyState label="Select an event" />
      </aside>
    );
  }

  const details = [
    ["event_id", event.event_id],
    ["event_type", event.event_type],
    ["work_id", event.work_id],
    ["actor", event.actor],
    ["target", event.target],
    ["source_surface", event.source_surface],
    ["authority_level", event.authority_level],
    ["payload_ref", event.payload_ref],
    ["result_status", event.result_status],
    ["created_at", event.created_at],
  ] as const;

  return (
    <aside className="coordination-event-inspector">
      <PanelHeader eyebrow="Inspect" title="Event Inspector" />
      <div className="event-inspector-stack">
        <div className="inspector-heading">
          <h3>{formatStatusLabel(event.event_type)}</h3>
          <code>{event.event_id}</code>
          <time dateTime={event.created_at}>{formatDate(event.created_at)}</time>
        </div>
        <div className="timeline-badges">
          <StatusBadge
            label={formatStatusLabel(event.authority_level)}
            tone={getAuthorityTone(event.authority_level)}
          />
          {event.result_status ? (
            <StatusBadge
              label={formatStatusLabel(event.result_status)}
              tone={getResultTone(event.result_status)}
            />
          ) : null}
          {event.work_id ? <StatusBadge label={event.work_id} /> : null}
        </div>
        <dl className="event-field-grid">
          {details.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value ? <code>{value}</code> : <span>None</span>}</dd>
            </div>
          ))}
        </dl>
        <section className="event-state-key-block">
          <h4>state_keys</h4>
          {event.state_keys.length ? (
            <div className="meta-row">
              {event.state_keys.map((stateKey) => (
                <span key={stateKey}>
                  {formatStateKeyLabel(stateKey)} <code>{stateKey}</code>
                </span>
              ))}
            </div>
          ) : (
            <EmptyState label="No state keys" />
          )}
        </section>
      </div>
    </aside>
  );
}

function LoadingBlock({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="loading-block" aria-busy="true">
      <h3>{title}</h3>
      <div>
        {lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </div>
    </div>
  );
}

function CopyFeedback({ notice }: { notice: Notice | null }) {
  if (!notice) {
    return <span className="copy-feedback" aria-live="polite" />;
  }

  return (
    <span className={`copy-feedback ${notice.tone}`} aria-live="polite">
      {notice.text}
    </span>
  );
}

function PanelHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="panel-header">
      <div>
        <p className="panel-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        {description ? <p className="panel-description">{description}</p> : null}
      </div>
    </header>
  );
}

function StateGroup({
  title,
  entries,
}: {
  title: string;
  entries: StateEntry[];
}) {
  return (
    <section className="state-group">
      <h3>{title}</h3>
      {entries.length === 0 ? (
        <EmptyState label="None" />
      ) : (
        entries.map((entry) => (
          <div className="state-row" key={entry.id}>
            <div className="state-key-reference">
              <strong>{formatStateKeyLabel(entry.state_key)}</strong>
              <code>{entry.state_key}</code>
            </div>
            <strong>{formatValue(entry.value)}</strong>
            <span>{formatStatusLabel(entry.stability)}</span>
          </div>
        ))
      )}
    </section>
  );
}

function TemporalStateGraph({
  trajectory,
  proposals,
  tensions,
  selectedTransitionId,
  onSelectTransition,
}: {
  trajectory: TrajectoryResponse;
  proposals: StateDeltaProposal[];
  tensions: StateTension[];
  selectedTransitionId: string | null;
  onSelectTransition: (id: string) => void;
}) {
  const tensionKeys = new Set(
    tensions
      .map((tension) => tension.state_key)
      .filter((stateKey): stateKey is string => Boolean(stateKey)),
  );
  const orderedTransitions = getOrderedTransitions(trajectory);
  const transitionOrder = new Map(
    orderedTransitions.map((transition, index) => [transition.id, index]),
  );
  const laneKeys = Array.from(
    new Set([
      ...Object.keys(trajectory.trajectories),
      ...proposals.map((proposal) => proposal.state_key),
      ...Array.from(tensionKeys),
    ]),
  ).sort((first, second) => {
    const firstOrder = getLaneFirstOrder(first, trajectory, transitionOrder);
    const secondOrder = getLaneFirstOrder(second, trajectory, transitionOrder);
    const firstRank = Number.isFinite(firstOrder)
      ? firstOrder
      : Number.MAX_SAFE_INTEGER;
    const secondRank = Number.isFinite(secondOrder)
      ? secondOrder
      : Number.MAX_SAFE_INTEGER;

    return firstRank - secondRank || first.localeCompare(second);
  });
  const labelWidth = 226;
  const rightPadding = 88;
  const topPadding = 54;
  const laneHeight = 76;
  const stepWidth = 168;
  const maxEventIndex = Math.max(orderedTransitions.length - 1, 1);
  const graphWidth = Math.max(
    940,
    labelWidth + rightPadding + (maxEventIndex + 1) * stepWidth,
  );
  const graphHeight = topPadding + Math.max(laneKeys.length, 1) * laneHeight + 34;
  const nodes: GraphNode[] = orderedTransitions.map((transition) => {
    const hasOpenTension = tensionKeys.has(transition.state_key);

    return {
      ...transition,
      eventIndex: transitionOrder.get(transition.id) ?? 0,
      hasOpenTension,
      tone: getTrajectoryTone(transition, hasOpenTension),
    };
  });

  if (laneKeys.length === 0) {
    return <EmptyState label="No committed transitions yet" />;
  }

  return (
    <div className="graph-scroll" aria-label="Committed temporal state graph">
      <svg
        className="temporal-graph"
        role="img"
        viewBox={`0 0 ${graphWidth} ${graphHeight}`}
        width={graphWidth}
        height={graphHeight}
        aria-label="State keys laid out by event order"
      >
        <line
          className="graph-axis"
          x1={labelWidth}
          x2={graphWidth - rightPadding}
          y1={24}
          y2={24}
        />
        <text className="axis-label" x={labelWidth} y={17}>
          earlier
        </text>
        <text
          className="axis-label axis-label-end"
          x={graphWidth - rightPadding}
          y={17}
        >
          later
        </text>
        {orderedTransitions.map((transition, index) => {
          const x = getNodeX(index, labelWidth, stepWidth);

          return (
            <g className="axis-tick" key={transition.id}>
              <line x1={x} x2={x} y1={20} y2={31} />
              <text x={x} y={45}>
                {index + 1}
              </text>
            </g>
          );
        })}

        {laneKeys.map((stateKey, laneIndex) => {
          const y = getLaneY(laneIndex, topPadding, laneHeight);
          const laneTransitions = nodes
            .filter((node) => node.state_key === stateKey)
            .sort((first, second) => first.eventIndex - second.eventIndex);
          const laneProposals = proposals.filter(
            (proposal) => proposal.state_key === stateKey,
          );

          return (
            <g className="graph-lane" key={stateKey}>
              <line
                className={tensionKeys.has(stateKey) ? "lane-line is-tension" : "lane-line"}
                x1={labelWidth}
                x2={graphWidth - rightPadding}
                y1={y}
                y2={y}
              />
              <text className="lane-label" x={16} y={y - 4}>
                {truncateLabel(formatStateKeyLabel(stateKey), 30)}
              </text>
              <text className="lane-count" x={16} y={y + 15}>
                {truncateLabel(stateKey, 28)} - {laneTransitions.length}{" "}
                committed
                {laneProposals.length ? ` / ${laneProposals.length} pending` : ""}
              </text>
              {laneTransitions.slice(1).map((node, index) => {
                const previous = laneTransitions[index];

                return (
                  <line
                    className={`node-connector connector-${node.tone}`}
                    key={`${previous.id}-${node.id}`}
                    x1={getNodeX(previous.eventIndex, labelWidth, stepWidth)}
                    x2={getNodeX(node.eventIndex, labelWidth, stepWidth)}
                    y1={y}
                    y2={y}
                  />
                );
              })}
              {laneTransitions.map((node) => (
                <GraphTransitionNode
                  key={node.id}
                  node={node}
                  x={getNodeX(node.eventIndex, labelWidth, stepWidth)}
                  y={y}
                  selected={node.id === selectedTransitionId}
                  onSelectTransition={onSelectTransition}
                />
              ))}
              {laneProposals.slice(0, 3).map((proposal, index) => {
                const ghostX = Math.min(
                  graphWidth - rightPadding - 12,
                  getNodeX(maxEventIndex + 1, labelWidth, stepWidth) +
                    index * 32,
                );

                return (
                  <g className="pending-ghost-node" key={proposal.id}>
                    <circle cx={ghostX} cy={y} r={8} />
                    <text x={ghostX + 13} y={y + 4}>
                      pending
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function GraphTransitionNode({
  node,
  x,
  y,
  selected,
  onSelectTransition,
}: {
  node: GraphNode;
  x: number;
  y: number;
  selected: boolean;
  onSelectTransition: (id: string) => void;
}) {
  function selectNode() {
    onSelectTransition(node.id);
  }

  return (
    <g
      className={`graph-node node-${node.tone}${selected ? " is-selected" : ""}`}
      role="button"
      tabIndex={0}
      onClick={selectNode}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectNode();
        }
      }}
    >
      <title>
        {formatTransitionSummary(node)} ({node.state_key})
      </title>
      <circle cx={x} cy={y} r={10} />
      {node.tone === "complete" ? (
        <path d={`M ${x - 5} ${y} L ${x - 1} ${y + 4} L ${x + 6} ${y - 5}`} />
      ) : null}
      {node.tone === "tension" ? (
        <text className="warning-mark" x={x} y={y + 4}>
          !
        </text>
      ) : null}
      <text className="node-label" x={x + 15} y={y - 7}>
        {truncateLabel(formatStateValueForDisplay(node.after_value), 34)}
      </text>
      <text className="node-time" x={x + 15} y={y + 10}>
        {formatDate(node.committed_at)}
      </text>
    </g>
  );
}

function TransitionInspector({ event }: { event: StateTransition | null }) {
  if (!event) {
    return (
      <aside className="graph-inspector">
        <PanelHeader eyebrow="Inspect" title="Selected Transition" />
        <EmptyState label="Select a graph node" />
      </aside>
    );
  }

  const tone = getTrajectoryTone(event, false);
  const source = getTransitionSourceDetails(event);

  return (
    <aside className="graph-inspector">
      <PanelHeader eyebrow="Inspect" title="Selected Transition" />
      <div className="inspector-stack">
        <div className="inspector-heading">
          <h3>{formatStateKeyLabel(event.state_key)}</h3>
          <code>{event.state_key}</code>
          <time dateTime={event.committed_at}>{formatDate(event.committed_at)}</time>
        </div>
        <div className="source-card">
          <span>Actor</span>
          <strong>{source.actor}</strong>
          <small>{source.detail}</small>
        </div>
        <p className="transition-summary">{formatTransitionSummary(event)}</p>
        <ValueDiff
          beforeValue={event.before_value}
          afterValue={event.after_value}
        />
        <div className="timeline-badges">
          <StatusBadge label={formatStatusLabel(event.temporal_scope)} tone={tone} />
          <StatusBadge label={formatStatusLabel(event.stability)} tone={tone} />
          <StatusBadge label={formatStatusLabel(event.change_type)} tone={tone} />
        </div>
        {event.reason ? <p className="inspector-reason">{event.reason}</p> : null}
      </div>
    </aside>
  );
}

function ValueDiff({
  beforeValue,
  afterValue,
}: {
  beforeValue: StateValue;
  afterValue: StateValue;
}) {
  const beforeDisplay = formatStateValueForDisplay(beforeValue);
  const afterDisplay = formatStateValueForDisplay(afterValue);
  const beforeRaw = formatRawValue(beforeValue);
  const afterRaw = formatRawValue(afterValue);

  return (
    <div className="value-diff">
      <div>
        <span>Before</span>
        <strong>{beforeDisplay}</strong>
        {beforeDisplay !== beforeRaw ? (
          <code className="raw-value">raw: {beforeRaw}</code>
        ) : null}
      </div>
      <div>
        <span>After</span>
        <strong>{afterDisplay}</strong>
        {afterDisplay !== afterRaw ? (
          <code className="raw-value">raw: {afterRaw}</code>
        ) : null}
      </div>
    </div>
  );
}

function ProposalScoring({ proposal }: { proposal: StateDeltaProposal }) {
  const scores = [
    {
      field: "salience_score",
      label: "Priority / Salience",
      value: proposal.salience_score,
    },
    {
      field: "evidence_score",
      label: "Evidence strength",
      value: proposal.evidence_score,
    },
    {
      field: "conflict_score",
      label: "Conflict risk",
      value: proposal.conflict_score,
    },
    {
      field: "self_impact_score",
      label: "State impact",
      value: proposal.self_impact_score,
    },
    {
      field: "prediction_error_score",
      label: "Change pressure",
      value: proposal.prediction_error_score,
    },
  ] as const;

  return (
    <div className="proposal-scoring" aria-label="Advisory proposal scoring">
      <div className="score-grid">
        {scores.map(({ field, label, value }) => (
          <div className="score-pill" key={field}>
            <span className="score-label">{label}</span>
            <span className="score-field">{field}</span>
            <strong className="score-value">{formatScore(value)}</strong>
          </div>
        ))}
        <div className="score-pill">
          <span className="score-label">Repeat evidence</span>
          <span className="score-field">reinforcement_count</span>
          <strong className="score-value">{proposal.reinforcement_count}</strong>
        </div>
      </div>
      <div className="scoring-meta">
        <span>{proposal.scoring_version}</span>
        {proposal.expires_at ? (
          <time dateTime={proposal.expires_at}>
            expires {formatDate(proposal.expires_at)}
          </time>
        ) : null}
      </div>
      {proposal.scoring_reason ? (
        <p className="scoring-reason">{proposal.scoring_reason}</p>
      ) : null}
      {proposal.score_breakdown ? (
        <details className="score-breakdown">
          <summary>Score breakdown</summary>
          <code>{formatValue(proposal.score_breakdown)}</code>
        </details>
      ) : null}
    </div>
  );
}

function StatusBadge({ label, tone }: { label: string; tone?: string }) {
  return (
    <span className={`status-badge${tone ? ` badge-${tone}` : ""}`}>
      {label}
    </span>
  );
}

function EmptyState({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      <strong>{label}</strong>
      {description ? <span>{description}</span> : null}
    </div>
  );
}

function parseAgResumeObjectInput(
  label: string,
  value: string,
): Record<string, unknown>;
function parseAgResumeObjectInput(
  label: string,
  value: string,
  options: { allowEmpty: true },
): Record<string, unknown> | null;
function parseAgResumeObjectInput(
  label: string,
  value: string,
  options?: { allowEmpty: true },
) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    if (options?.allowEmpty) return null;
    throw new Error(`${label} is required.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmedValue);
  } catch (error) {
    throw new Error(
      `${label} is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  if (!isAgResumeRecord(parsed)) {
    throw new Error(`${label} must be a JSON object.`);
  }

  return parsed;
}

function isAgResumeRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function parseAgResumeArrayInput(
  label: string,
  value: string,
  options: { allowEmpty: true },
) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    if (options.allowEmpty) return [];
    throw new Error(`${label} is required.`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmedValue);
  } catch (error) {
    throw new Error(
      `${label} is not valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON array.`);
  }

  return parsed;
}

function buildMappingProposalRecordReadSearchParams({
  proposalId,
  foreignScope,
  foreignWorkId,
  candidateLocalScope,
  candidateLocalWorkId,
  status,
  limit,
}: {
  proposalId: string;
  foreignScope: string;
  foreignWorkId: string;
  candidateLocalScope: string;
  candidateLocalWorkId: string;
  status: string;
  limit: string;
}) {
  const trimmedProposalId = proposalId.trim();
  const trimmedForeignScope = foreignScope.trim();
  const trimmedForeignWorkId = foreignWorkId.trim();
  const trimmedCandidateLocalScope = candidateLocalScope.trim();
  const trimmedCandidateLocalWorkId = candidateLocalWorkId.trim();
  const trimmedStatus = status.trim();
  const trimmedLimit = limit.trim();
  const hasForeignFilter = Boolean(trimmedForeignScope || trimmedForeignWorkId);
  const hasCandidateFilter = Boolean(
    trimmedCandidateLocalScope || trimmedCandidateLocalWorkId,
  );
  const hasListFilter = Boolean(
    hasForeignFilter || hasCandidateFilter || trimmedStatus,
  );

  if (trimmedProposalId) {
    if (hasListFilter || trimmedLimit) {
      throw new Error(
        "proposal_id fetch must not be combined with list filters or limit.",
      );
    }
    return new URLSearchParams({ proposal_id: trimmedProposalId });
  }

  if (Boolean(trimmedForeignScope) !== Boolean(trimmedForeignWorkId)) {
    throw new Error("foreign_scope and foreign_work_id must be supplied together.");
  }

  if (Boolean(trimmedCandidateLocalScope) !== Boolean(trimmedCandidateLocalWorkId)) {
    throw new Error(
      "candidate_local_scope and candidate_local_work_id must be supplied together.",
    );
  }

  if (!hasListFilter) {
    throw new Error(
      "At least one proposal record read filter is required: proposal_id, foreign work, candidate local work, or status.",
    );
  }

  if (trimmedLimit) {
    const parsedLimit = Number(trimmedLimit);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
      throw new Error("limit must be a positive integer.");
    }
  }

  const searchParams = new URLSearchParams();
  if (trimmedForeignScope && trimmedForeignWorkId) {
    searchParams.set("foreign_scope", trimmedForeignScope);
    searchParams.set("foreign_work_id", trimmedForeignWorkId);
  }
  if (trimmedCandidateLocalScope && trimmedCandidateLocalWorkId) {
    searchParams.set("candidate_local_scope", trimmedCandidateLocalScope);
    searchParams.set("candidate_local_work_id", trimmedCandidateLocalWorkId);
  }
  if (trimmedStatus) {
    searchParams.set("status", trimmedStatus);
  }
  if (trimmedLimit) {
    searchParams.set("limit", trimmedLimit);
  }
  return searchParams;
}

function buildMappingProposalLifecycleActionRequestBody({
  proposalId,
  action,
  reviewedBy,
  reviewNote,
  reviewedAt,
  replacementProposalId,
}: {
  proposalId: string;
  action: string;
  reviewedBy: string;
  reviewNote: string;
  reviewedAt: string;
  replacementProposalId: string;
}): AgResumeMappingProposalLifecycleActionRequestBody {
  const trimmedProposalId = proposalId.trim();
  const trimmedAction = action.trim();
  const normalizedAction = normalizeMappingProposalLifecycleAction(trimmedAction);
  const trimmedReviewedBy = reviewedBy.trim();
  const trimmedReviewNote = reviewNote.trim();
  const trimmedReviewedAt = reviewedAt.trim();
  const trimmedReplacementProposalId = replacementProposalId.trim();

  if (!trimmedProposalId) {
    throw new Error("proposal_id is required for lifecycle action.");
  }
  if (!trimmedAction) {
    throw new Error("action is required for lifecycle action.");
  }
  if (!normalizedAction) {
    throw new Error("action must be one of: withdraw, reject, supersede, expire.");
  }
  if (!trimmedReviewedBy) {
    throw new Error("reviewed_by is required for lifecycle action.");
  }
  if (!trimmedReviewNote) {
    throw new Error("review_note is required for lifecycle action.");
  }
  if (trimmedReplacementProposalId && normalizedAction !== "supersede") {
    throw new Error("replacement_proposal_id is allowed only for supersede.");
  }
  if (trimmedReviewedAt) {
    const parsedReviewedAt = Date.parse(trimmedReviewedAt);
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
        trimmedReviewedAt,
      ) ||
      !Number.isFinite(parsedReviewedAt) ||
      new Date(parsedReviewedAt).toISOString() !== trimmedReviewedAt
    ) {
      throw new Error(
        "reviewed_at must be an ISO UTC timestamp with millisecond precision.",
      );
    }
  }

  const requestBody: AgResumeMappingProposalLifecycleActionRequestBody = {
    proposal_id: trimmedProposalId,
    action: normalizedAction,
    reviewed_by: trimmedReviewedBy,
    review_note: trimmedReviewNote,
  };
  if (trimmedReviewedAt) {
    requestBody.reviewed_at = trimmedReviewedAt;
  }
  if (normalizedAction === "supersede" && trimmedReplacementProposalId) {
    requestBody.replacement_proposal_id = trimmedReplacementProposalId;
  }
  return requestBody;
}

function normalizeMappingProposalLifecycleAction(
  value: string,
): AgResumeMappingProposalLifecycleAction | null {
  if (
    value === "withdraw" ||
    value === "reject" ||
    value === "supersede" ||
    value === "expire"
  ) {
    return value;
  }
  return null;
}

function isAgResumeFieldError(error: string | null, fieldLabel: string) {
  return Boolean(error?.startsWith(`${fieldLabel} `));
}

function formatAgResumeBoolean(value: boolean | null | undefined) {
  if (value === true) return "true";
  if (value === false) return "false";
  if (value === null) return "null";
  return "unknown";
}

function formatAgResumeExampleJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function formatAgResumeJsonValue(value: unknown) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function formatAgResumeMappingValue(
  value: string | string[] | boolean | null | undefined,
) {
  if (Array.isArray(value)) return value.join(", ") || "[]";
  if (value === true) return "true";
  if (value === false) return "false";
  if (value === null) return "null";
  return value ?? "unknown";
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  const json = (await response.json()) as T | { error?: string };

  if (!response.ok) {
    throw new Error(getErrorMessage(json));
  }

  return json as T;
}

function getErrorMessage(value: unknown) {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof value.error === "string"
  ) {
    return value.error;
  }

  return "Request failed";
}

function getOrderedTransitions(trajectory: TrajectoryResponse | null) {
  if (!trajectory) {
    return [];
  }

  return Object.values(trajectory.trajectories)
    .flat()
    .sort(
      (first, second) =>
        new Date(first.committed_at).getTime() -
        new Date(second.committed_at).getTime(),
    );
}

function getLaneFirstOrder(
  stateKey: string,
  trajectory: TrajectoryResponse,
  transitionOrder: Map<string, number>,
) {
  const events = trajectory.trajectories[stateKey] ?? [];
  const orders = events.map((event) => transitionOrder.get(event.id) ?? Infinity);

  return Math.min(...orders, Infinity);
}

function getNodeX(eventIndex: number, labelWidth: number, stepWidth: number) {
  return labelWidth + 54 + eventIndex * stepWidth;
}

function getLaneY(laneIndex: number, topPadding: number, laneHeight: number) {
  return topPadding + laneIndex * laneHeight;
}

function formatRawValue(value: StateValue) {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

function formatStateValueForDisplay(value: StateValue) {
  if (value === true) {
    return "Yes";
  }

  if (value === false) {
    return "No";
  }

  if (value === null) {
    return "No previous value";
  }

  if (typeof value === "string") {
    const labels: Record<string, string> = {
      deprecated: "Deprecated",
      planned_after_challenge: "Planned after challenge",
      unknown: "No previous value",
    };

    return labels[value] ?? value;
  }

  return JSON.stringify(value);
}

function formatValue(value: StateValue) {
  return formatStateValueForDisplay(value);
}

function formatTransitionSummary(event: StateTransition) {
  const label = formatStateKeyLabel(event.state_key);
  const afterDisplay = formatStateValueForDisplay(event.after_value);

  if (isMissingPreviousValue(event.before_value)) {
    return `${label}: Created as ${afterDisplay}`;
  }

  return `${label}: ${formatStateValueForDisplay(
    event.before_value,
  )} -> ${afterDisplay}`;
}

function isMissingPreviousValue(value: StateValue) {
  return value === null || value === "unknown";
}

function getTrajectoryTone(event: StateTransition, hasOpenTension: boolean) {
  if (hasOpenTension) {
    return "tension";
  }

  if (
    event.temporal_scope === "future_phase" ||
    event.change_type === "future_intent"
  ) {
    return "deferred";
  }

  if (event.stability === "completed" || event.change_type === "completion") {
    return "complete";
  }

  if (
    event.stability === "deprecated" ||
    event.change_type === "deprecation"
  ) {
    return "muted";
  }

  return "active";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatScore(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "--";
}

function formatStatusLabel(value: string) {
  return titleCase(value.replaceAll("_", " "));
}

function getConsolidationExplanation(
  status: StateDeltaProposal["consolidation_status"],
) {
  const explanations: Record<
    StateDeltaProposal["consolidation_status"],
    string
  > = {
    candidate: "Initial candidate. Can be reviewed or reinforced.",
    reinforced: "Repeatedly observed across inputs.",
    ready: "Enough evidence and importance, low conflict risk.",
    needs_review: "Requires user judgment due to conflict or weak evidence.",
    expired: "Too old or stale to commit.",
    committed: "Approved by the user and written into durable state.",
    rejected: "Rejected by the user.",
  };

  return explanations[status];
}

function formatStateKeyLabel(stateKey: string) {
  const labels: Record<string, string> = {
    "security.no_api_keys_in_repo": "No API keys in repo",
    "integration.chatgpt_app": "ChatGPT App integration",
    "external.mcp_inspector_bridge_check_recorded":
      "MCP bridge check recorded",
    "submission.readme_checklist_created": "README checklist created",
    "security.checklist_created": "Security checklist created",
    "demo.script_created": "Demo script created",
    "coordination.event_spine": "Coordination event spine",
    "submission.requires_screenshots": "Screenshots required",
    "product.name": "Product name",
    "implementation.stack": "Implementation stack",
  };

  if (labels[stateKey]) {
    return labels[stateKey];
  }

  const withoutNamespace =
    stateKey.startsWith("external.") || stateKey.split(".").length > 2
      ? stateKey.split(".").slice(1).join(".")
      : stateKey;

  return titleCase(withoutNamespace.replace(/[._]+/g, " "));
}

function getTransitionSourceDetails(event: StateTransition) {
  const sourceAgentId = event.source_agent_id;
  const sessionId = event.source_session_id;
  const fallbackActor = inferActorFromStateKey(event.state_key);

  if (!sourceAgentId) {
    return {
      actor: fallbackActor,
      detail: "Derived from transition metadata and state key.",
    };
  }

  const actorLabels: Record<string, string> = {
    "agent:augnes-runtime": "Augnes local tool",
    "agent:temporal-delta-compiler": "OpenAI delta compiler",
  };
  const actor = actorLabels[sourceAgentId] ?? inferActorFromSource(sourceAgentId);
  const detail = sessionId
    ? `Source ${sourceAgentId}; session ${sessionId}.`
    : `Source ${sourceAgentId}.`;

  return { actor, detail };
}

function inferActorFromSource(source: string) {
  const normalized = source.toLowerCase();

  if (normalized.includes("mcp") && normalized.includes("inspector")) {
    return "MCP Inspector";
  }

  if (normalized.includes("codex")) {
    return "Codex via MCP bridge";
  }

  if (normalized.includes("augnes")) {
    return "Augnes Runtime";
  }

  return titleCase(source.replace(/^agent:/, "").replace(/[._:-]+/g, " "));
}

function inferActorFromStateKey(stateKey: string) {
  if (stateKey.includes("mcp_inspector")) {
    return "MCP Inspector";
  }

  if (stateKey.startsWith("external.")) {
    return "External client";
  }

  return "User-approved state change";
}

function titleCase(value: string) {
  const minorWords = new Set([
    "a",
    "an",
    "and",
    "as",
    "by",
    "for",
    "in",
    "of",
    "or",
    "to",
    "with",
  ]);
  const acronyms: Record<string, string> = {
    api: "API",
    chatgpt: "ChatGPT",
    codex: "Codex",
    db: "DB",
    github: "GitHub",
    mcp: "MCP",
    oauth: "OAuth",
    openai: "OpenAI",
    readme: "README",
    sqlite: "SQLite",
    ui: "UI",
  };

  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => {
      const normalized = word.toLowerCase();

      if (acronyms[normalized]) {
        return acronyms[normalized];
      }

      if (index > 0 && minorWords.has(normalized)) {
        return normalized;
      }

      return `${normalized.slice(0, 1).toUpperCase()}${normalized.slice(1)}`;
    })
    .join(" ");
}

function getConsolidationTone(
  status: StateDeltaProposal["consolidation_status"],
) {
  if (status === "needs_review") {
    return "needs-review";
  }

  return status;
}

function getPriorityTone(priority: string) {
  const tones: Record<string, string> = {
    now: "needs-review",
    high: "needs-review",
    next: "reinforced",
    normal: "active",
    later: "muted",
    low: "muted",
  };

  return tones[priority] ?? "muted";
}

function getAuthorityTone(authorityLevel: string) {
  const tones: Record<string, string> = {
    raw_observation: "muted",
    interpretation_only: "deferred",
    handoff_guidance: "reinforced",
    execution_trace: "active",
    action_proof: "complete",
    publication_notice: "needs-review",
    acknowledged_notice: "reinforced",
    committed_state: "complete",
  };

  return tones[authorityLevel] ?? "muted";
}

function getResultTone(resultStatus: string) {
  const tones: Record<string, string> = {
    completed: "complete",
    failed: "tension",
    blocked: "needs-review",
    partial: "needs-review",
    needs_review: "needs-review",
  };

  return tones[resultStatus] ?? "muted";
}

function getMailboxStatusTone(status: string) {
  const tones: Record<string, string> = {
    ready: "ready",
    delivered: "active",
    acknowledged: "reinforced",
    reviewed: "complete",
    superseded: "expired",
    expired: "expired",
  };

  return tones[status] ?? "muted";
}

function getPublicationStatusTone(status: string) {
  const tones: Record<string, string> = {
    draft: "muted",
    approved: "needs-review",
    sent: "complete",
    failed: "tension",
    cancelled: "expired",
    pending: "active",
    acknowledged: "reinforced",
  };

  return tones[status] ?? "muted";
}

function getApprovalGateStateTone(gateState: string) {
  const tones: Record<string, string> = {
    dry_run_ready_for_future_publish: "ready",
    dry_run_blocked: "tension",
    approved_for_future_publish_readiness: "ready",
    ready_for_future_approval_review: "needs-review",
    blocked_missing_publication: "tension",
    blocked_target_mismatch: "tension",
    blocked_already_sent: "expired",
    blocked_cancelled_publication: "expired",
    blocked_existing_sent_delivery: "expired",
    needs_failure_review: "needs-review",
    inactive_request: "muted",
    blocked_or_not_ready: "muted",
  };

  return tones[gateState] ?? "muted";
}

function getHandoffStateKeys(handoff: StateBriefAgentHandoff) {
  return Array.from(
    new Set([
      ...(handoff.current_status.notable_state_keys ?? []),
      ...(handoff.next_recommended_action.related_state_keys ?? []),
      ...handoff.blockers_or_tensions.flatMap(
        (blocker) => blocker.related_state_keys,
      ),
    ]),
  ).filter(Boolean);
}

function buildCodexHandoffText(handoff: StateBriefAgentHandoff) {
  const action = handoff.next_recommended_action;
  const blockers = handoff.blockers_or_tensions.length
    ? handoff.blockers_or_tensions
        .map((blocker) => `- ${blocker.title}: ${blocker.summary}`)
        .join("\n")
    : "- None reported.";
  const commands = handoff.codex_handoff.verification_commands
    .map((command) => `- ${command}`)
    .join("\n");

  return [
    "Current status:",
    handoff.current_status.summary,
    "",
    "Next recommended action:",
    `${action.title} (${action.priority}, ${action.suggested_actor})`,
    action.rationale,
    "",
    "Blockers or tensions:",
    blockers,
    "",
    "Codex task brief:",
    handoff.codex_handoff.task_brief,
    "",
    "Verification commands:",
    commands,
  ].join("\n");
}

function formatActionRecordTemplate(template: Record<string, unknown>) {
  const formatted = JSON.stringify(template, null, 2);

  if (!formatted) {
    throw new Error("Action record template is not serializable.");
  }

  JSON.parse(formatted);

  return formatted;
}

function buildWorkCodexHandoffText(brief: WorkBriefResponse) {
  const eventLines = brief.recent_events.length
    ? brief.recent_events
        .map(
          (event) =>
            `- ${event.created_at} ${event.event_type}/${event.actor}: ${event.summary}`,
        )
        .join("\n")
    : "- None recorded.";
  const proofLines = [
    ...brief.related_proof.action_ids.map((id) => `- action_record: ${id}`),
    ...brief.related_proof.prs.map((pr) => `- PR: ${pr}`),
    ...brief.related_proof.docs.map((doc) => `- doc: ${doc}`),
  ];
  const commands = brief.codex_handoff.suggested_verification
    .map((command) => `- ${command}`)
    .join("\n");

  return [
    `${brief.work_id}: ${brief.work.title}`,
    "",
    "Trace framing:",
    `- ${brief.framing.work_id}`,
    `- ${brief.framing.state_authority}`,
    `- ${brief.framing.execution_proof}`,
    `- ${brief.framing.temporal_proof}`,
    "",
    "Current work:",
    brief.work.summary,
    "",
    "Next action:",
    brief.next_action || "No next action recorded.",
    "",
    "Recent events:",
    eventLines,
    "",
    "Related proof:",
    proofLines.length ? proofLines.join("\n") : "- None linked yet.",
    "",
    "Suggested verification:",
    commands,
  ].join("\n");
}

function formatWorkEventTemplate(template: Record<string, unknown>) {
  const formatted = JSON.stringify(
    {
      ...template,
      summary: "Summarize implementation, verification, review, or handoff result.",
    },
    null,
    2,
  );

  if (!formatted) {
    throw new Error("Work event template is not serializable.");
  }

  JSON.parse(formatted);

  return formatted;
}

function formatCompactJson(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

function truncateLabel(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}...`;
}
