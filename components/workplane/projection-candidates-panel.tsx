import type { AugnesDelta } from "@/types/augnes-delta";
import type { WorkplaneContextRead } from "@/lib/workplane/read-workplane-context";
import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";

export function ProjectionCandidatesPanel({
  context,
}: {
  context: WorkplaneContextRead;
}) {
  const projection = context.delta_projection_read.data;
  const nextCandidates = context.current_perspective_read.data.next_candidates;
  const reviewQueue = context.overview.review_queue;
  const candidateDeltas = sortDeltasNewestFirst(
    projection.deltas.filter((delta) =>
      ["draft", "needs_review", "deferred"].includes(delta.status),
    ),
  ).slice(0, 4);
  const candidateCount = nextCandidates.length + candidateDeltas.length;

  return (
    <WorkplanePanelShell
      kicker="Phase 5C preview"
      title="Projection Candidates"
      ariaLabel="Projection Candidates Workplane panel"
    >
      <p style={workplaneCopyStyle}>
        Projection candidates are read-only preview context. No apply, approve,
        reject, or persistence controls are available here.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Candidates" value={candidateCount} />
        <WorkplanePanelMetric label="Next" value={nextCandidates.length} />
        <WorkplanePanelMetric label="Review refs" value={reviewQueue.total_attention_count} />
        <WorkplanePanelMetric label="Source" value={context.source_status.delta_projection} />
      </WorkplanePanelMetricGrid>

      <ul style={workplaneListStyle}>
        {nextCandidates.slice(0, 3).map((candidate) => (
          <li key={candidate.candidate_id} style={workplaneItemStyle}>
            <span style={workplaneBadgeStyle}>{candidate.priority}</span>
            <strong>{candidate.title}</strong>
            <span style={workplaneCopyStyle}>{candidate.rationale}</span>
          </li>
        ))}
        {candidateDeltas.map((delta) => (
          <li key={delta.delta_id} style={workplaneItemStyle}>
            <span style={workplaneBadgeStyle}>{delta.status}</span>
            <strong>{delta.title}</strong>
            <span style={workplaneCopyStyle}>
              {delta.type} from {delta.source}; created_at {delta.created_at}
            </span>
          </li>
        ))}
        {candidateCount === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>
              No projection candidates materialized yet.
            </span>
          </li>
        ) : null}
      </ul>

      <p style={workplaneCopyStyle}>
        Review queue pressure: needs review {reviewQueue.needs_review_count},
        blocked {reviewQueue.blocked_count}, manual review{" "}
        {reviewQueue.manual_review_count}. Fixture fallback remains disclosed
        when runtime reads are unavailable.
      </p>
    </WorkplanePanelShell>
  );
}

function sortDeltasNewestFirst(deltas: AugnesDelta[]) {
  return [...deltas].sort((left, right) => {
    const leftCreatedAt = Date.parse(left.created_at);
    const rightCreatedAt = Date.parse(right.created_at);
    const createdAtDelta =
      Number.isFinite(rightCreatedAt) && Number.isFinite(leftCreatedAt)
        ? rightCreatedAt - leftCreatedAt
        : 0;

    if (createdAtDelta !== 0) {
      return createdAtDelta;
    }

    return left.delta_id.localeCompare(right.delta_id);
  });
}
