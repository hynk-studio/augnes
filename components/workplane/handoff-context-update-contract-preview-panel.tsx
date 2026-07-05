import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { HandoffContextUpdateContractPreview } from "@/types/handoff-context-update-contract-preview";

type HandoffContextUpdateContractPreviewPanelProps = {
  preview: HandoffContextUpdateContractPreview;
};

export function HandoffContextUpdateContractPreviewPanel({
  preview,
}: HandoffContextUpdateContractPreviewPanelProps) {
  const contract = preview.proposed_handoff_context_update_contract;
  return (
    <WorkplanePanelShell
      kicker="Handoff context"
      title="Handoff Context Update Contract Preview"
      ariaLabel="Handoff Context Update Contract Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Display-only contract material for a future handoff context apply/update
        slice. This panel does not apply or send handoff context.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="status"
          value={preview.contract_preview_status}
        />
        <WorkplanePanelMetric
          label="mode"
          value={
            preview.input_summary.requested_handoff_context_mode ?? "missing"
          }
        />
        <WorkplanePanelMetric
          label="entries"
          value={String(preview.input_summary.proposed_entry_count)}
        />
        <WorkplanePanelMetric
          label="write ready"
          value={String(preview.contract_readiness.write_ready)}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>route-integrated CWP</span>
        <strong>
          {preview.route_integrated_current_working_perspective_summary.status ??
            "missing"}
        </strong>
        <span style={workplaneCopyStyle}>
          response mode{" "}
          {preview.route_integrated_current_working_perspective_summary
            .response_mode ?? "missing"}
          ; runtime fallback{" "}
          {preview.route_integrated_current_working_perspective_summary
            .runtime_cwp_ref ?? "missing"}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>CWP summary</span>
        <strong>
          {preview.route_integrated_current_working_perspective_summary
            .current_frame_summary ?? "no current frame"}
        </strong>
        <span style={workplaneCopyStyle}>
          thesis{" "}
          {preview.route_integrated_current_working_perspective_summary
            .current_thesis_summary ?? "missing"}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>sections</span>
        <ul style={workplaneListStyle}>
          {Object.entries(contract?.proposed_handoff_sections ?? {})
            .slice(0, 12)
            .map(([section, entries]) => (
              <li key={section} style={workplaneItemStyle}>
                <span style={workplaneCopyStyle}>
                  {section}: {entries.length}
                </span>
              </li>
            ))}
        </ul>
      </section>

      <ReasonList
        title="blockers"
        reasons={[
          ...preview.blocking_reasons,
          ...preview.missing_evidence,
          ...preview.refusal_reasons,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Contract preview only</strong>
        <span style={workplaneCopyStyle}>
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_apply_handoff{" "}
          {String(
            preview.authority_boundary.can_apply_handoff_context_update,
          )}
          ; can_send_handoff{" "}
          {String(preview.authority_boundary.can_send_handoff)}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function ReasonList({ title, reasons }: { title: string; reasons: string[] }) {
  return (
    <section style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>{title}</span>
      <ul style={workplaneListStyle}>
        {(reasons.length > 0 ? reasons : ["none"]).slice(0, 8).map((reason) => (
          <li key={reason} style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{reason}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
