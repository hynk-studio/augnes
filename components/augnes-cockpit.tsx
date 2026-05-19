"use client";

import type { PerspectiveSnapshot } from "@/lib/perspective/snapshot";
import type { TemporalPreviewResponse } from "@/lib/temporal-interpretation/types";
import type { ReactNode } from "react";
import { FormEvent, useEffect, useMemo, useState } from "react";

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
        placeholder that is not computed. Loopness is a weak trace-pressure hint
        when present; sidecar_e_t, bsl_hint, and comp_index_hint remain null
        placeholders. These diagnostics are not authority, proof, readiness, or
        source of truth.
      </p>
      <div className="meta-row">
        <StatusBadge label={`mode ${diagnostics.mode}`} />
        <span>sidecar_e_t {String(diagnostics.sidecar_e_t)}</span>
        <span>bsl_hint {String(diagnostics.bsl_hint)}</span>
        <span>comp_index_hint {String(diagnostics.comp_index_hint)}</span>
      </div>
      <MetaWmHintPanel metaWmHint={diagnostics.meta_wm_hint} />
      <LoopnessHintPanel loopnessHint={diagnostics.loopness_hint} />
      <ul className="boundary-list">
        {diagnostics.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </>
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
                  <p>{workBrief.codex_handoff.task_brief}</p>
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
