import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type {
  WorkplaneBridgeTraceDetailRead,
  WorkplaneBridgeTraceStatus,
} from "@/types/workplane-bridge-trace-detail";
import type { AgentWorkplaneNodeStatus } from "@/types/agent-workplane-node";
import type { ReactNode } from "react";

export function SourceRefBridgeDetailPanel({
  read,
}: {
  read: WorkplaneBridgeTraceDetailRead;
}) {
  return (
    <div data-workplane-bridge-trace-detail-panel="v0.1">
      <WorkplanePanelShell
        kicker="Source Ref Bridge"
        title="Trace Bridge detail"
        ariaLabel="Source Ref Bridge and Trace Bridge detail panel"
        panelId="source_ref_bridge"
        nodeId="source_ref_bridge"
        nodeKind="debug_context_source"
        nodeStatus={nodeStatusForBridgeTrace(read.status)}
      >
        <p style={workplaneCopyStyle}>
          Source Ref Bridge and Trace Bridge detail is read-only bridge/trace
          detail, not execution authority and not shrink authority. The Bridge
          matrix below keeps source refs, validation summary, evidence refs,
          diagnostic refs, and legacy compatibility retained while native
          absorption remains review-gated.
        </p>

        <WorkplanePanelMetricGrid>
          <WorkplanePanelMetric label="Bridge rows" value={read.bridge_rows.length} />
          <WorkplanePanelMetric label="Source refs" value={read.refs.length} />
          <WorkplanePanelMetric label="Validation" value={read.validation_details.length} />
          <WorkplanePanelMetric label="Gaps" value={read.gap_details.length} />
        </WorkplanePanelMetricGrid>

        <Section title="Bridge rows">
          {read.bridge_rows.map((row) => (
            <li key={row.row_id} style={workplaneItemStyle}>
              <span style={workplaneBadgeStyle}>{row.status}</span>
              <strong>{row.title}</strong>
              <span style={workplaneCopyStyle}>
                {row.source_panel_id} / {row.source_node_id}
              </span>
              <span style={workplaneCopyStyle}>{row.trace_role}</span>
              <span style={workplaneCopyStyle}>
                Bridge matrix ref kinds: {row.ref_kinds.join(", ")}. Sample
                source refs: {row.sample_refs.join("; ") || "none materialized"}.
              </span>
              <span style={workplaneCopyStyle}>{row.authority_summary}</span>
            </li>
          ))}
        </Section>

        <Section title="Source ref kinds">
          {read.source_ref_kinds.map((kind) => (
            <li key={kind.ref_kind} style={workplaneItemStyle}>
              <span style={workplaneBadgeStyle}>{kind.status}</span>
              <strong>{kind.ref_kind}</strong>
              <span style={workplaneCopyStyle}>
                {kind.ref_count} refs. Samples:{" "}
                {kind.sample_refs.join("; ") || "none materialized"}.
              </span>
            </li>
          ))}
        </Section>

        <Section title="Validation details">
          {read.validation_details.slice(0, 8).map((detail) => (
            <li key={detail.validation_id} style={workplaneItemStyle}>
              <span style={workplaneBadgeStyle}>{detail.status}</span>
              <strong>{detail.validation_id}</strong>
              <span style={workplaneCopyStyle}>
                validation summary from {detail.source_panel_id} /{" "}
                {detail.source_node_id}; smoke refs{" "}
                {detail.smoke_refs.join(", ") || "none materialized"}.
              </span>
              <span style={workplaneCopyStyle}>
                Notes: {detail.notes.join(" ") || "none materialized"}.
              </span>
            </li>
          ))}
        </Section>

        <Section title="Evidence / artifact / handoff details">
          {read.evidence_details.slice(0, 8).map((detail) => (
            <li key={detail.detail_id} style={workplaneItemStyle}>
              <span style={workplaneBadgeStyle}>{detail.ref_kind}</span>
              <strong>{detail.ref_id}</strong>
              <span style={workplaneCopyStyle}>
                evidence refs / artifact refs / handoff refs remain pointer-only:
                {detail.summary}
              </span>
              <span style={workplaneCopyStyle}>
                Authority: {detail.authority_notes.join("; ")}.
              </span>
            </li>
          ))}
          {read.evidence_details.length === 0 ? (
            <li style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>
                No evidence refs, artifact refs, or handoff refs materialized yet.
              </span>
            </li>
          ) : null}
        </Section>

        <Section title="Diagnostics / snapshots">
          {read.diagnostic_details.slice(0, 8).map((detail) => (
            <li key={detail.detail_id} style={workplaneItemStyle}>
              <span style={workplaneBadgeStyle}>{detail.ref_kind}</span>
              <strong>{detail.ref_id}</strong>
              <span style={workplaneCopyStyle}>
                diagnostic refs and snapshot refs from {detail.source_panel_id}:{" "}
                {detail.summary}
              </span>
              <span style={workplaneCopyStyle}>
                Notes: {detail.notes.join(" ") || "none materialized"}.
              </span>
            </li>
          ))}
        </Section>

        <Section title="Gap details">
          {read.gap_details.map((gap) => (
            <li key={gap.gap_id} style={workplaneItemStyle}>
              <span style={workplaneBadgeStyle}>{gap.status}</span>
              <strong>{gap.capability_id}</strong>
              <span style={workplaneCopyStyle}>{gap.summary}</span>
              <span style={workplaneCopyStyle}>
                Next: {gap.required_next_step}
              </span>
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
          Status: {read.status}. Source status and fallback notes remain visible:
          {read.fallback_notes.join(" ") || " no fallback notes"}. Browser
          regression, metrics, and dogfood are evidence/signals, not shrink
          authority.
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

function nodeStatusForBridgeTrace(
  status: WorkplaneBridgeTraceStatus,
): AgentWorkplaneNodeStatus {
  if (status === "ready") return "ready";
  if (status === "fallback") return "fallback";
  if (status === "empty" || status === "insufficient_data") {
    return "not_materialized";
  }
  return "partial";
}
