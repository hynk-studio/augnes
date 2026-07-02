import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { AgentWorkplaneNodeStatus } from "@/types/agent-workplane-node";
import type {
  WorkplaneRunPostmortemDetailRead,
  WorkplaneRunPostmortemStatus,
} from "@/types/workplane-run-postmortem-detail";
import type { ReactNode } from "react";

export function RunPostmortemDetailPanel({
  read,
}: {
  read: WorkplaneRunPostmortemDetailRead;
}) {
  return (
    <div data-workplane-run-postmortem-detail-panel="v0.1">
      <WorkplanePanelShell
        kicker="Run Postmortem detail"
        title="Source-backed run postmortem"
        ariaLabel="Source-backed Run Postmortem detail panel"
        panelId="run_postmortem"
        nodeId="run_postmortem"
        nodeKind="runner_context_source"
        nodeStatus={nodeStatusForRunPostmortem(read.status)}
      >
        <p style={workplaneCopyStyle}>
          Run Postmortem detail is read-only run postmortem visibility, not
          runner authority and not shrink authority. It keeps source-backed run
          postmortem, run_id, step refs, event refs, recovered DeltaBatch,
          validation status, source refs, no runner execution, no runner tick,
          no DeltaBatch recovery, no durable memory apply, no Perspective
          apply, and legacy compatibility retained visible while native
          absorption remains review-gated.
        </p>

        <WorkplanePanelMetricGrid>
          <WorkplanePanelMetric label="Runs" value={read.run_summaries.length} />
          <WorkplanePanelMetric
            label="Batches"
            value={read.delta_batch_summaries.length}
          />
          <WorkplanePanelMetric
            label="Step refs"
            value={read.step_summaries.length}
          />
          <WorkplanePanelMetric
            label="Event refs"
            value={read.event_summaries.length}
          />
        </WorkplanePanelMetricGrid>

        <Section title="Run summaries">
          {read.run_summaries.length > 0 ? (
            read.run_summaries.map((run) => (
              <li key={run.run_id} style={workplaneItemStyle}>
                <span style={workplaneBadgeStyle}>{run.run_status}</span>
                <strong>{run.run_title}</strong>
                <span style={workplaneCopyStyle}>run_id: {run.run_id}</span>
                <span style={workplaneCopyStyle}>
                  latest batch: {run.latest_batch_id ?? "none"}; recovered
                  batches {run.recovered_batch_count}; recovered deltas{" "}
                  {run.recovered_delta_count}; validation status{" "}
                  {run.validation_status}.
                </span>
                <span style={workplaneCopyStyle}>
                  step refs: {formatRefs(run.related_step_ids)}; event refs:{" "}
                  {formatRefs(run.related_event_ids)}; delta refs:{" "}
                  {formatRefs(run.related_delta_ids)}.
                </span>
              </li>
            ))
          ) : (
            <EmptyItem>No run summaries are materialized yet.</EmptyItem>
          )}
        </Section>

        <Section title="Step refs">
          {read.step_summaries.length > 0 ? (
            read.step_summaries.slice(0, 8).map((step) => (
              <li key={`${step.run_id}:${step.step_id}`} style={workplaneItemStyle}>
                <span style={workplaneBadgeStyle}>{step.status}</span>
                <strong>{step.step_id}</strong>
                <span style={workplaneCopyStyle}>run_id: {step.run_id}</span>
                <span style={workplaneCopyStyle}>{step.summary}</span>
                <span style={workplaneCopyStyle}>
                  batch refs: {formatRefs(step.related_batch_ids)}; delta refs:{" "}
                  {formatRefs(step.related_delta_ids)}.
                </span>
              </li>
            ))
          ) : (
            <EmptyItem>No step refs are materialized yet.</EmptyItem>
          )}
        </Section>

        <Section title="Event refs">
          {read.event_summaries.length > 0 ? (
            read.event_summaries.slice(0, 8).map((event) => (
              <li
                key={`${event.run_id}:${event.event_id}`}
                style={workplaneItemStyle}
              >
                <span style={workplaneBadgeStyle}>{event.event_kind}</span>
                <strong>{event.event_id}</strong>
                <span style={workplaneCopyStyle}>run_id: {event.run_id}</span>
                <span style={workplaneCopyStyle}>{event.summary}</span>
                <span style={workplaneCopyStyle}>
                  batch refs: {formatRefs(event.related_batch_ids)}; delta
                  refs: {formatRefs(event.related_delta_ids)}.
                </span>
              </li>
            ))
          ) : (
            <EmptyItem>No event refs are materialized yet.</EmptyItem>
          )}
        </Section>

        <Section title="Recovered DeltaBatch summaries">
          {read.delta_batch_summaries.length > 0 ? (
            read.delta_batch_summaries.slice(0, 8).map((batch) => (
              <li key={batch.batch_id} style={workplaneItemStyle}>
                <span style={workplaneBadgeStyle}>
                  {batch.validation_status}
                </span>
                <strong>{batch.title}</strong>
                <span style={workplaneCopyStyle}>
                  recovered DeltaBatch {batch.batch_id}; run_id {batch.run_id};
                  validation status {batch.validation_status}; delta count{" "}
                  {batch.delta_count}.
                </span>
                <span style={workplaneCopyStyle}>{batch.summary}</span>
                <span style={workplaneCopyStyle}>
                  source refs: {formatRefs(batch.source_refs)}.
                </span>
              </li>
            ))
          ) : (
            <EmptyItem>No recovered DeltaBatch is materialized yet.</EmptyItem>
          )}
        </Section>

        <Section title="Timeline">
          {read.timeline_items.length > 0 ? (
            read.timeline_items.slice(0, 10).map((item) => (
              <li key={item.timeline_id} style={workplaneItemStyle}>
                <span style={workplaneBadgeStyle}>{item.item_kind}</span>
                <strong>{item.title}</strong>
                <span style={workplaneCopyStyle}>
                  {item.occurred_at}; {item.summary}
                </span>
                <span style={workplaneCopyStyle}>
                  source refs: {formatRefs(item.source_refs)}.
                </span>
              </li>
            ))
          ) : (
            <EmptyItem>No run timeline is materialized yet.</EmptyItem>
          )}
        </Section>

        <Section title="Postmortem signals">
          {read.postmortem_signals.map((signal) => (
            <li key={signal.signal_id} style={workplaneItemStyle}>
              <span style={workplaneBadgeStyle}>{signal.status}</span>
              <strong>{signal.signal_id}</strong>
              <span style={workplaneCopyStyle}>{signal.summary}</span>
            </li>
          ))}
        </Section>

        <Section title="Gap details">
          {read.gap_details.map((gap) => (
            <li key={gap.gap_id} style={workplaneItemStyle}>
              <span style={workplaneBadgeStyle}>{gap.status}</span>
              <strong>{gap.gap_id}</strong>
              <span style={workplaneCopyStyle}>{gap.summary}</span>
              <span style={workplaneCopyStyle}>Next: {gap.required_next_step}</span>
            </li>
          ))}
        </Section>

        <Section title="Authority boundary">
          {read.authority_boundary.notes.map((note) => (
            <li key={note} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{note}</span>
            </li>
          ))}
        </Section>

        <p style={workplaneCopyStyle}>
          Status: {read.status}. Run postmortem detail is visibility only, not
          runner authority. Browser regression, metrics, and dogfood are
          evidence/signals, not shrink authority. Fallback notes:{" "}
          {read.fallback_notes.join(" ") || "none"}.
        </p>
      </WorkplanePanelShell>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} style={{ display: "grid", gap: "6px", minWidth: 0 }}>
      <h3 style={{ margin: 0, fontSize: "0.82rem", color: "#0f172a" }}>
        {title}
      </h3>
      <ul style={workplaneListStyle}>{children}</ul>
    </section>
  );
}

function EmptyItem({ children }: { children: ReactNode }) {
  return (
    <li style={workplaneItemStyle}>
      <span style={workplaneCopyStyle}>{children}</span>
    </li>
  );
}

function nodeStatusForRunPostmortem(
  status: WorkplaneRunPostmortemStatus,
): AgentWorkplaneNodeStatus {
  if (status === "ready") return "ready";
  if (status === "fallback") return "fallback";
  if (status === "empty" || status === "insufficient_data") {
    return "not_materialized";
  }
  return "partial";
}

function formatRefs(refs: string[]) {
  if (refs.length === 0) return "none";
  return refs.slice(0, 4).join(", ") + (refs.length > 4 ? " ..." : "");
}
