import type {
  PerspectiveTrajectory,
  PerspectiveTrajectoryAuthorityBoundary,
  PerspectiveTrajectoryEvent,
  PerspectiveTrajectorySourceRef,
} from "@/lib/perspective/state/build-trajectory";

type PerspectiveTrajectoryPanelProps = {
  title?: string;
  trajectory: PerspectiveTrajectory;
  fixturePath?: string;
};

export function PerspectiveTrajectoryPanel({
  title = "Perspective trajectory",
  trajectory,
  fixturePath,
}: PerspectiveTrajectoryPanelProps) {
  return (
    <section
      className="perspective-inspector-section"
      data-augnes-authority="read-only derived-perspective-trajectory"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">Perspective trajectory is read-only</p>
          <h3>{title}</h3>
          <p>Derived view, not source of truth</p>
          <p>No state mutation</p>
          <p>No product write</p>
          <p>Product-write remains parked</p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">{trajectory.status}</span>
          <span className="status-pill">read-only</span>
          <span className="status-pill">derived view</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          perspective <code>{trajectory.perspective_id}</code>
        </span>
        <span>
          scope <code>{trajectory.scope}</code>
        </span>
        <span>
          fingerprint <code>{trajectory.trajectory_fingerprint}</code>
        </span>
        {fixturePath ? (
          <span>
            fixture <code>{fixturePath}</code>
          </span>
        ) : null}
      </div>

      <section className="perspective-inspector-section">
        <h4>Current state summary</h4>
        <p>{trajectory.current_state_summary}</p>
      </section>

      <div className="perspective-constellation-workspace-grid">
        <TrajectoryEventList events={trajectory.events} />
        <RefList title="Prior thesis refs" values={trajectory.prior_thesis_refs} />
        <RefList title="Active claim refs" values={trajectory.active_claim_refs} />
        <RefList title="Retired claim refs" values={trajectory.retired_claim_refs} />
        <RefList title="Supporting evidence refs" values={trajectory.supporting_evidence_refs} />
        <RefList title="Contradicting evidence refs" values={trajectory.contradicting_evidence_refs} />
        <RefList title="Open tension refs" values={trajectory.open_tension_refs} />
        <RefList title="Resolved tension refs" values={trajectory.resolved_tension_refs} />
        <RefList title="Knowledge gap refs" values={trajectory.knowledge_gap_refs} />
        <RefList title="Promotion decision refs" values={trajectory.promotion_decision_refs} />
        <RefList title="Formation Receipt refs" values={trajectory.formation_receipt_refs} />
        <RefList title="Apply event refs" values={trajectory.apply_event_refs} />
        <RefList title="Feedback refs" values={trajectory.feedback_refs} />
        <SourceRefList sourceRefs={trajectory.source_refs} />
        <AuthorityBoundaryReadout boundary={trajectory.authority_boundary} />
      </div>
    </section>
  );
}

function TrajectoryEventList({ events }: { events: PerspectiveTrajectoryEvent[] }) {
  return (
    <section className="perspective-inspector-section">
      <h4>Trajectory events</h4>
      <ul>
        {events.map((event) => (
          <li key={event.event_id}>
            <strong>{event.event_kind}</strong>{" "}
            <code>{event.layer}</code>{" "}
            <code>{event.occurred_at}</code>
            <p>{event.bounded_summary}</p>
            <small>
              subject <code>{event.subject_ref}</code>
            </small>
            <small>
              {" "}
              source refs <code>{formatList(event.source_refs)}</code>
            </small>
            <small>
              {" "}
              candidate refs <code>{formatList(event.candidate_refs)}</code>
            </small>
            <small>
              {" "}
              reasons <code>{formatList(event.reason_codes)}</code>
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RefList({ title, values }: { title: string; values: string[] }) {
  return (
    <section className="perspective-inspector-section">
      <h4>{title}</h4>
      <ul>
        {values.map((value) => (
          <li key={value}>
            <code>{value}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SourceRefList({ sourceRefs }: { sourceRefs: PerspectiveTrajectorySourceRef[] }) {
  return (
    <section className="perspective-inspector-section">
      <h4>Source refs</h4>
      <ul>
        {sourceRefs.map((sourceRef) => (
          <li key={sourceRef.source_ref}>
            <code>{sourceRef.source_ref}</code>
            <p>{sourceRef.bounded_summary}</p>
            <small>
              reasons <code>{formatList(sourceRef.reason_codes)}</code>
            </small>
          </li>
        ))}
      </ul>
    </section>
  );
}

function AuthorityBoundaryReadout({
  boundary,
}: {
  boundary: PerspectiveTrajectoryAuthorityBoundary;
}) {
  return (
    <section className="perspective-inspector-section">
      <h4>Authority boundary</h4>
      <div className="perspective-workbench-status-row">
        {Object.entries(boundary).map(([key, value]) => (
          <span key={key}>
            {key} <code>{String(value)}</code>
          </span>
        ))}
      </div>
    </section>
  );
}

function formatList(values: readonly string[]) {
  return values.length > 0 ? values.join(", ") : "none";
}
