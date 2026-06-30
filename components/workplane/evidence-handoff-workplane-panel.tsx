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

export function EvidenceHandoffWorkplanePanel({
  context,
}: {
  context: WorkplaneContextRead;
}) {
  const projection = context.delta_projection_read.data;
  const sourceRefs = projection.source_refs;
  const sourceHandoffRefs = sourceRefs.handoff_refs;
  const evidenceRefs = projection.deltas.flatMap((delta) => delta.evidence_refs);
  const deltaHandoffRefs = projection.deltas.flatMap((delta) => delta.handoff_refs);
  const artifactRefs = projection.deltas.flatMap((delta) => delta.artifact_refs);
  const uniqueHandoffRefCount = new Set([
    ...sourceHandoffRefs,
    ...deltaHandoffRefs.map((handoffRef) => handoffRef.handoff_ref),
  ]).size;

  return (
    <WorkplanePanelShell
      kicker="Evidence / Handoff"
      title="Pointer-only handoff and evidence context"
      ariaLabel="Evidence and Handoff Workplane panel"
    >
      <p style={workplaneCopyStyle}>
        Evidence pointers, Handoff context, Artifact pointers, and Codex result
        refs are displayed as pointer-only backend context. This panel has no
        proof/evidence write authority and no external send authority.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Evidence refs" value={evidenceRefs.length} />
        <WorkplanePanelMetric label="Handoff refs" value={uniqueHandoffRefCount} />
        <WorkplanePanelMetric label="Codex refs" value={sourceRefs.codex_result_refs.length} />
        <WorkplanePanelMetric label="Artifacts" value={artifactRefs.length} />
      </WorkplanePanelMetricGrid>

      <ul style={workplaneListStyle}>
        {sourceHandoffRefs.slice(0, 3).map((handoffRef) => (
          <li key={handoffRef} style={workplaneItemStyle}>
            <span style={workplaneBadgeStyle}>handoff</span>
            <span style={workplaneCopyStyle}>{handoffRef}</span>
          </li>
        ))}
        {deltaHandoffRefs.slice(0, 3).map((handoffRef) => (
          <li key={handoffRef.handoff_ref} style={workplaneItemStyle}>
            <span style={workplaneBadgeStyle}>{handoffRef.handoff_kind}</span>
            <span style={workplaneCopyStyle}>{handoffRef.summary}</span>
          </li>
        ))}
        {sourceHandoffRefs.length === 0 && deltaHandoffRefs.length === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>No handoff refs materialized yet.</span>
          </li>
        ) : null}
        {evidenceRefs.length === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>No evidence pointers materialized yet.</span>
          </li>
        ) : null}
      </ul>

      <p style={workplaneCopyStyle}>
        Run postmortem source is not materialized yet. Evidence pointer count is
        bounded to projected delta refs and does not create evidence records.
      </p>
    </WorkplanePanelShell>
  );
}
