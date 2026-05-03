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
};

type StateTransition = {
  id: string;
  state_key: string;
  before_value: StateValue;
  after_value: StateValue;
  temporal_scope: string;
  stability: string;
  change_type: string;
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

type Notice = {
  tone: "info" | "error";
  text: string;
};

export function AugnesCockpit() {
  const [message, setMessage] = useState(CANONICAL_MESSAGE);
  const [snapshot, setSnapshot] = useState<SnapshotResponse | null>(null);
  const [trajectory, setTrajectory] = useState<TrajectoryResponse | null>(null);
  const [proposals, setProposals] = useState<StateDeltaProposal[]>([]);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [plan, setPlan] = useState<PlanResponse | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void refreshRuntime();
  }, []);

  const trajectoryCount = useMemo(() => {
    if (!trajectory) {
      return 0;
    }

    return Object.values(trajectory.trajectories).reduce(
      (count, events) => count + events.length,
      0,
    );
  }, [trajectory]);

  async function refreshRuntime() {
    const [snapshotResult, trajectoryResult, proposalResult] = await Promise.all([
      fetchJson<SnapshotResponse>(`/api/state/snapshot?scope=${SCOPE}`),
      fetchJson<TrajectoryResponse>(`/api/state/trajectory?scope=${SCOPE}`),
      fetchJson<ProposalResponse>(`/api/proposals?scope=${SCOPE}&status=pending`),
    ]);

    setSnapshot(snapshotResult);
    setTrajectory(trajectoryResult);
    setProposals(proposalResult.proposals);
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
        <div>
          <p className="kicker">Augnes</p>
          <h1>Temporal State Cockpit</h1>
        </div>
        <div className="runtime-strip">
          <span>{SCOPE}</span>
          <span>{proposals.length} pending</span>
          <span>{trajectoryCount} transitions</span>
        </div>
      </header>

      <section className="cockpit-layout" aria-label="Augnes runtime cockpit">
        <section className="cockpit-panel chat-panel">
          <PanelHeader eyebrow="Input" title="Chat Cockpit" />
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
          <PanelHeader eyebrow="Pending" title="Temporal Delta Proposals" />
          <div className="proposal-list">
            {proposals.length === 0 ? (
              <EmptyState label="No pending proposals" />
            ) : (
              proposals.map((proposal) => (
                <article className="proposal-card" key={proposal.id}>
                  <div className="card-topline">
                    <h3>{proposal.state_key}</h3>
                    <StatusBadge label={proposal.temporal_scope} />
                  </div>
                  <ValueDiff
                    beforeValue={proposal.before_value}
                    afterValue={proposal.after_value}
                  />
                  <div className="meta-row">
                    <span>{proposal.operation}</span>
                    <span>{proposal.stability}</span>
                    <span>{proposal.change_type}</span>
                  </div>
                  {proposal.reason ? <p>{proposal.reason}</p> : null}
                  <div className="button-row">
                    <button
                      type="button"
                      onClick={() => void decideProposal(proposal.id, "commit")}
                      disabled={busy === proposal.id}
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

        <section className="cockpit-panel trajectory-panel">
          <PanelHeader eyebrow="Timeline" title="State Trajectory View" />
          {trajectory ? (
            <div className="trajectory-list">
              {Object.entries(trajectory.trajectories).map(
                ([stateKey, events]) => (
                  <TrajectoryLane
                    key={stateKey}
                    stateKey={stateKey}
                    events={events}
                    hasOpenTension={
                      snapshot?.open_tensions.some(
                        (tension) => tension.state_key === stateKey,
                      ) ?? false
                    }
                  />
                ),
              )}
            </div>
          ) : (
            <EmptyState label="Loading trajectory" />
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
                  {tension.state_key ? <code>{tension.state_key}</code> : null}
                </article>
              ))}
            </div>
          ) : (
            <EmptyState label="No open tensions" />
          )}
        </section>

        <section className="cockpit-panel actions-panel">
          <PanelHeader eyebrow="Next" title="State-Grounded Actions" />
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
                      <span>{recommendation.tool_name}</span>
                    ) : null}
                    {recommendation.grounded_state_keys.map((key) => (
                      <span key={key}>{key}</span>
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

function PanelHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="panel-header">
      <p className="panel-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
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
            <code>{entry.state_key}</code>
            <strong>{formatValue(entry.value)}</strong>
            <span>{entry.stability}</span>
          </div>
        ))
      )}
    </section>
  );
}

function TrajectoryLane({
  stateKey,
  events,
  hasOpenTension,
}: {
  stateKey: string;
  events: StateTransition[];
  hasOpenTension: boolean;
}) {
  const orderedEvents = [...events].sort(
    (first, second) =>
      new Date(first.committed_at).getTime() -
      new Date(second.committed_at).getTime(),
  );

  return (
    <article
      className={`trajectory-group${hasOpenTension ? " has-tension" : ""}`}
    >
      <div className="trajectory-key">
        <h3>{stateKey}</h3>
        <span>{orderedEvents.length} events</span>
        {hasOpenTension ? <StatusBadge label="open tension" tone="tension" /> : null}
      </div>
      <div className="trajectory-track" aria-label={`${stateKey} trajectory`}>
        {orderedEvents.map((event) => {
          const tone = getTrajectoryTone(event, hasOpenTension);

          return (
            <div className={`trajectory-event event-${tone}`} key={event.id}>
              <div className="timeline-value">
                <span className="value-node">{formatValue(event.before_value)}</span>
                <span className="value-arrow" aria-hidden="true">
                  →
                </span>
                <strong className="value-node">
                  {formatValue(event.after_value)}
                </strong>
              </div>
              <div className="timeline-badges">
                <StatusBadge label={event.temporal_scope} tone={tone} />
                <StatusBadge label={event.stability} tone={tone} />
                <StatusBadge label={event.change_type} tone={tone} />
              </div>
              <time dateTime={event.committed_at}>
                {formatDate(event.committed_at)}
              </time>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function ValueDiff({
  beforeValue,
  afterValue,
}: {
  beforeValue: StateValue;
  afterValue: StateValue;
}) {
  return (
    <div className="value-diff">
      <div>
        <span>Before</span>
        <strong>{formatValue(beforeValue)}</strong>
      </div>
      <div>
        <span>After</span>
        <strong>{formatValue(afterValue)}</strong>
      </div>
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

function EmptyState({ label }: { label: string }) {
  return <div className="empty-state">{label}</div>;
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

function formatValue(value: StateValue) {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
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
