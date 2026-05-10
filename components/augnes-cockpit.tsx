"use client";

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
  latest_delivery_status: string | null;
  latest_delivery_id: string | null;
  latest_delivery_error: string | null;
  gate_state: string;
  gate_reasons: string[];
  safe_next_step: string;
  source_refs: {
    approval_request_id: string;
    publication_id: string;
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

type GraphNode = StateTransition & {
  eventIndex: number;
  hasOpenTension: boolean;
  tone: string;
};

export function AugnesCockpit() {
  const [message, setMessage] = useState(CANONICAL_MESSAGE);
  const [snapshot, setSnapshot] = useState<SnapshotResponse | null>(null);
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

  const selectedCoordinationEvent = useMemo(
    () =>
      coordinationEvents.find((event) => event.event_id === selectedEventId) ??
      coordinationEvents[0] ??
      null,
    [coordinationEvents, selectedEventId],
  );

  async function refreshRuntime() {
    setBriefError(null);
    setWorkError(null);
    setEventError(null);
    setMailboxError(null);
    setPublicationError(null);
    setApprovalGateError(null);

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
    <main className="cockpit-shell">
      <header className="cockpit-header">
        <div className="hero-copy">
          <p className="kicker">Augnes</p>
          <h1>Project State Over Time</h1>
          <p>
            A temporal coordination layer for AI-assisted development: review
            proposals, commit durable project state, and inspect how work
            changes over time.
          </p>
        </div>
        <div className="runtime-strip">
          <span>{SCOPE}</span>
          <span>{proposals.length} pending</span>
          <span>{trajectoryCount} transitions</span>
        </div>
      </header>

      <nav className="demo-flow-strip" aria-label="Demo flow">
        {[
          "Observe",
          "Propose",
          "Commit",
          "Timeline",
          "Act",
          "State Brief",
        ].map((step, index) => (
          <div className="demo-flow-step" key={step}>
            <span>{index + 1}</span>
            <strong>{step}</strong>
          </div>
        ))}
      </nav>

      <CurrentWorkCard
        brief={brief}
        error={briefError}
      />

      <WorkFocusSection
        workItems={workItems}
        selectedWorkId={selectedWorkId}
        workBrief={workBrief}
        error={workError}
        onSelectWork={setSelectedWorkId}
      />

      <MailboxSummaryPanel
        mailboxSummary={mailboxSummary}
        error={mailboxError}
      />

      <PublicationSummaryPanel
        publicationSummary={publicationSummary}
        error={publicationError}
      />

      <ApprovalGateStatePanel
        approvalGateState={approvalGateState}
        error={approvalGateError}
      />

      <CoordinationEventTimeline
        events={coordinationEvents}
        selectedEvent={selectedCoordinationEvent}
        error={eventError}
        onSelectEvent={setSelectedEventId}
      />

      <section className="cockpit-guidance" aria-label="Cockpit guidance">
        <p>
          Review proposals. Commit only what should become durable project
          state. Use the graph to see what changed over time.
        </p>
        <ol>
          <li>Turn conversation into state proposals.</li>
          <li>Review scores, tensions, and lifecycle status.</li>
          <li>Commit or reject; only the user confirms durable state.</li>
          <li>Act with tools or external clients.</li>
          <li>Track accepted changes and action records on the timeline.</li>
        </ol>
      </section>

      <section
        className="cockpit-panel graph-panel"
        aria-label="Temporal state graph"
      >
        <PanelHeader
          eyebrow="Temporal State Graph"
          title="Project State Over Time"
          description="Each lane is one project state key. Each node is a committed state transition or external action record."
        />
        <p className="bridge-proof">
          Bridge proof: external client read state -&gt; recorded action -&gt;
          graph updated.
        </p>
        {trajectory ? (
          <div className="graph-stage">
            <TemporalStateGraph
              trajectory={trajectory}
              proposals={proposals}
              tensions={snapshot?.open_tensions ?? []}
              selectedTransitionId={selectedTransition?.id ?? null}
              onSelectTransition={setSelectedTransitionId}
            />
            <TransitionInspector event={selectedTransition} />
          </div>
        ) : (
          <EmptyState label="Loading temporal graph" />
        )}
      </section>

      <section className="cockpit-layout" aria-label="Augnes runtime cockpit">
        <section className="cockpit-panel chat-panel">
          <PanelHeader eyebrow="Observe" title="Conversation Input" />
          <form onSubmit={observe} className="observe-form">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={8}
              aria-label="Observation message"
            />
            <div className="form-row">
              <button disabled={busy === "observe" || !message.trim()}>
                Observe
              </button>
              {notice ? (
                <span className={`notice ${notice.tone}`}>{notice.text}</span>
              ) : null}
            </div>
          </form>
        </section>

        <section className="cockpit-panel proposals-panel">
          <PanelHeader eyebrow="Propose" title="Pending State Deltas" />
          <div className="panel-control-row">
            <p>Advisory runtime scoring; commit and reject stay manual.</p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void consolidateCandidates()}
              disabled={busy === "consolidate"}
            >
              Consolidate Candidates
            </button>
          </div>
          <div className="proposal-list">
            {proposals.length === 0 ? (
              <EmptyState
                label="No pending proposals."
                description="Add a project update in Observe to generate state candidates."
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
                    {getConsolidationExplanation(
                      proposal.consolidation_status,
                    )}
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
                      onClick={() => void decideProposal(proposal.id, "commit")}
                      disabled={
                        busy === proposal.id ||
                        proposal.consolidation_status === "expired"
                      }
                    >
                      Commit
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => void decideProposal(proposal.id, "reject")}
                      disabled={busy === proposal.id}
                    >
                      Reject
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="cockpit-panel snapshot-panel">
          <PanelHeader eyebrow="Committed" title="State Snapshot" />
          {snapshot ? (
            <div className="snapshot-grid">
              <StateGroup title="Active" entries={snapshot.active_state} />
              <StateGroup title="Future" entries={snapshot.future_state} />
              <StateGroup title="Completed" entries={snapshot.completed_state} />
              <StateGroup
                title="Deprecated"
                entries={snapshot.deprecated_state}
              />
            </div>
          ) : (
            <EmptyState label="Loading snapshot" />
          )}
        </section>

        <section className="cockpit-panel tensions-panel">
          <PanelHeader eyebrow="Review" title="Tensions" />
          {snapshot?.open_tensions.length ? (
            <div className="tension-list">
              {snapshot.open_tensions.map((tension) => (
                <article className="tension-item" key={tension.id}>
                  <div className="card-topline">
                    <h3>{tension.title}</h3>
                    <StatusBadge label={tension.severity} />
                  </div>
                  <p>{tension.description}</p>
                  {tension.state_key ? (
                    <div className="state-key-reference">
                      <strong>{formatStateKeyLabel(tension.state_key)}</strong>
                      <code>{tension.state_key}</code>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState label="No open tensions" />
          )}
        </section>

        <section className="cockpit-panel actions-panel">
          <PanelHeader eyebrow="Act" title="State-Grounded Actions" />
          <div className="action-controls">
            <button
              type="button"
              onClick={() => void requestPlan()}
              disabled={busy === "plan"}
            >
              Plan Next
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void runTool("create_readme_checklist")}
              disabled={busy === "create_readme_checklist"}
            >
              README Checklist
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void runTool("create_security_checklist")}
              disabled={busy === "create_security_checklist"}
            >
              Security Checklist
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void runTool("create_demo_script")}
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
      </section>
    </main>
  );
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

                <div className="work-proof-grid">
                  <section className="work-proof-block">
                    <h4>Related proof and links</h4>
                    <ProofList brief={workBrief} />
                  </section>
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
                </div>

                {workBrief.related_state_keys.length ? (
                  <details className="work-related-keys">
                    <summary>Related state keys</summary>
                    <div className="meta-row">
                      {workBrief.related_state_keys.map((stateKey) => (
                        <span key={stateKey}>
                          {formatStateKeyLabel(stateKey)} <code>{stateKey}</code>
                        </span>
                      ))}
                    </div>
                  </details>
                ) : null}
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
              </div>
              {item.approval_decision_reason ? (
                <p className="approval-gate-side-effect">
                  {item.approval_decision_reason}
                </p>
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
