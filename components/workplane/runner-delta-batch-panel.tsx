import type { WorkplaneContextRead } from "@/lib/workplane/read-workplane-context";
import type { AgentWorkplaneNodeStatus } from "@/types/agent-workplane-node";
import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";

export function RunnerDeltaBatchPanel({
  context,
}: {
  context: WorkplaneContextRead;
}) {
  const read = context.runner_delta_batch_read;
  const latest = read.batches[0] ?? null;
  const nodeStatus: AgentWorkplaneNodeStatus =
    read.status === "ready"
      ? "ready"
      : read.status === "fallback"
        ? "fallback"
        : "not_materialized";

  return (
    <WorkplanePanelShell
      kicker="Runner ledger readback"
      title="Recovered Runner DeltaBatch"
      ariaLabel="Recovered Runner DeltaBatch Workplane panel"
      panelId="delta_batch"
      nodeId="runner_delta_batch"
      nodeKind="runner_context_source"
      nodeStatus={nodeStatus}
    >
      <p style={workplaneCopyStyle}>
        Recovered runner DeltaBatches are read-only review candidates from the
        runner ledger. They are separate from projected Delta Projection batches
        and are not approvals or applies.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Recovered batches"
          value={read.recovered_batch_count}
        />
        <WorkplanePanelMetric
          label="Recovered deltas"
          value={read.recovered_delta_count}
        />
        <WorkplanePanelMetric
          label="Latest status"
          value={read.latest_validation_status ?? "empty"}
        />
        <WorkplanePanelMetric
          label="Source"
          value={read.source_status}
        />
      </WorkplanePanelMetricGrid>

      {latest ? (
        <ul style={workplaneListStyle}>
          <li style={workplaneItemStyle}>
            <span style={workplaneBadgeStyle}>{latest.validation_status}</span>
            <strong>{latest.title}</strong>
            <span style={workplaneCopyStyle}>{latest.summary}</span>
            <span style={workplaneCopyStyle}>run_id: {latest.run_id}</span>
            <span style={workplaneCopyStyle}>batch_id: {latest.batch_id}</span>
            <span style={workplaneCopyStyle}>
              delta_count: {latest.delta_count}; source_refs:{" "}
              {latest.source_ref_count}
            </span>
            <span style={workplaneCopyStyle}>
              related steps: {formatRefs(latest.related_step_ids)}
            </span>
            <span style={workplaneCopyStyle}>
              related events: {formatRefs(latest.related_event_ids)}
            </span>
            <span style={workplaneCopyStyle}>
              related deltas: {formatRefs(latest.related_delta_ids)}
            </span>
          </li>
        </ul>
      ) : (
        <p style={workplaneItemStyle}>{read.empty_state}</p>
      )}

      <p style={workplaneCopyStyle}>
        Authority: no durable memory apply, no Perspective apply, no delta
        auto-apply, no proof/evidence write, no provider/OpenAI/GitHub/Codex
        execution, no runner recovery, no runner tick, and no scheduled runner
        behavior.
      </p>

      {read.fallback_reason ? (
        <p style={workplaneCopyStyle}>Fallback: {read.fallback_reason}</p>
      ) : null}
    </WorkplanePanelShell>
  );
}

function formatRefs(refs: string[]) {
  if (refs.length === 0) return "none";
  return refs.slice(0, 3).join(", ") + (refs.length > 3 ? " ..." : "");
}
