import { WorkplaneBoundaryCard } from "@/components/workplane/workplane-boundary-card";
import {
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { WorkplaneContextRead } from "@/lib/workplane/read-workplane-context";
import type { AugnesDelta } from "@/types/augnes-delta";

export function WorkplaneInspector({
  context,
}: {
  context: WorkplaneContextRead;
}) {
  const projection = context.delta_projection_read.data;
  const latestDeltas = sortDeltasNewestFirst(projection.deltas).slice(0, 4);

  return (
    <aside aria-label="Workplane Inspector" style={{ display: "grid", gap: "14px", minWidth: 0 }}>
      <WorkplaneBoundaryCard notes={context.authority_boundary.notes} />
      <WorkplanePanelShell
        kicker="Workplane Inspector"
        title="Pointer-only backend context"
        ariaLabel="Workplane Inspector panel"
      >
        <p style={workplaneCopyStyle}>
          No hidden execution authority. Inspector details are read-only source
          refs, pointer refs, review notes, and validation context; no approve,
          apply, send, launch, persistence, merge, retry, replay, or deploy
          controls are added here.
        </p>
        <ul style={workplaneListStyle}>
          {latestDeltas.length > 0 ? (
            latestDeltas.map((delta) => (
              <li key={delta.delta_id} style={workplaneItemStyle}>
                <span style={workplaneBadgeStyle}>{delta.status}</span>
                <strong>{delta.title}</strong>
                <span style={workplaneCopyStyle}>
                  {delta.type} from {delta.source}; merge policy{" "}
                  {delta.merge_policy.mode}; target refs{" "}
                  {delta.target_refs.length}; evidence pointers{" "}
                  {delta.evidence_refs.length}; handoff refs{" "}
                  {delta.handoff_refs.length}; diagnostic refs{" "}
                  {delta.diagnostic_refs.length}.
                </span>
                <span style={workplaneCopyStyle}>
                  Non-goals:{" "}
                  {delta.non_goals.length > 0
                    ? delta.non_goals.join("; ")
                    : "none materialized"}
                </span>
              </li>
            ))
          ) : (
            <li style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>No projected deltas materialized yet.</span>
            </li>
          )}
        </ul>
      </WorkplanePanelShell>

      <WorkplanePanelShell
        kicker="Boundary notes"
        title="Surface split for Phase 6"
        ariaLabel="Workplane boundary notes"
      >
        <ul style={workplaneListStyle}>
          {context.workplane_notes.map((note) => (
            <li key={note} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{note}</span>
            </li>
          ))}
        </ul>
      </WorkplanePanelShell>
    </aside>
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
