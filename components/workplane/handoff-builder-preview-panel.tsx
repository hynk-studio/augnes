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

export function HandoffBuilderPreviewPanel({
  context,
}: {
  context: WorkplaneContextRead;
}) {
  const projection = context.delta_projection_read.data;
  const sourceRefs = projection.source_refs;
  const sourceHandoffRefs = sourceRefs.handoff_refs;
  const deltaHandoffRefs = projection.deltas.flatMap((delta) => delta.handoff_refs);
  const artifactRefs = projection.deltas.flatMap((delta) => delta.artifact_refs);
  const codexResultRefs = sourceRefs.codex_result_refs;
  const uniqueHandoffRefs = new Set([
    ...sourceHandoffRefs,
    ...deltaHandoffRefs.map((handoffRef) => handoffRef.handoff_ref),
  ]);
  const hasHandoffPreviewRefs = uniqueHandoffRefs.size > 0;

  return (
    <WorkplanePanelShell
      kicker="Phase 5C preview"
      title="Handoff Builder preview"
      ariaLabel="Handoff Builder preview Workplane panel"
      panelId="handoff_builder_preview"
      nodeId="handoff_context"
      nodeKind="handoff_context_source"
      nodeStatus="preview_only"
    >
      <p style={workplaneCopyStyle}>
        Handoff Builder preview shows pointer-only handoff context. Handoff
        Capsule is not implemented in Phase 5C. Future handoff build/send
        behavior requires separate explicit authority.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Handoff refs" value={uniqueHandoffRefs.size} />
        <WorkplanePanelMetric label="Artifacts" value={artifactRefs.length} />
        <WorkplanePanelMetric label="Codex refs" value={codexResultRefs.length} />
        <WorkplanePanelMetric label="Review refs" value={context.overview.review_queue.total_attention_count} />
      </WorkplanePanelMetricGrid>

      <ul style={workplaneListStyle}>
        {sourceHandoffRefs.slice(0, 3).map((handoffRef) => (
          <li key={handoffRef} style={workplaneItemStyle}>
            <span style={workplaneBadgeStyle}>source handoff</span>
            <span style={workplaneCopyStyle}>{handoffRef}</span>
          </li>
        ))}
        {deltaHandoffRefs.slice(0, 3).map((handoffRef) => (
          <li key={handoffRef.handoff_ref} style={workplaneItemStyle}>
            <span style={workplaneBadgeStyle}>{handoffRef.handoff_kind}</span>
            <strong>{handoffRef.handoff_ref}</strong>
            <span style={workplaneCopyStyle}>{handoffRef.summary}</span>
          </li>
        ))}
        {!hasHandoffPreviewRefs ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>
              No handoff builder preview refs materialized yet.
            </span>
          </li>
        ) : null}
      </ul>

      <p style={workplaneCopyStyle}>
        This preview does not copy, send, launch Codex, create PRs, call GitHub,
        call providers, write proof, write evidence, or persist handoff state.
      </p>
    </WorkplanePanelShell>
  );
}
