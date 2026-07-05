import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { PerspectiveUnitScopedWritePreview } from "@/types/perspective-unit-scoped-write-preview";

type PerspectiveUnitScopedWritePreviewPanelProps = {
  preview: PerspectiveUnitScopedWritePreview;
};

export function PerspectiveUnitScopedWritePreviewPanel({
  preview,
}: PerspectiveUnitScopedWritePreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Scoped PerspectiveUnit write"
      title="PerspectiveUnit Scoped Write Preview"
      ariaLabel="PerspectiveUnit Scoped Write Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only preview for the scoped local PerspectiveUnit record and receipt.
        Workbench does not call the route or perform the write.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Preview status"
          value={preview.scoped_write_preview_status}
        />
        <WorkplanePanelMetric
          label="recommended next"
          value={preview.recommended_next_action}
        />
        <WorkplanePanelMetric
          label="write ready"
          value={String(preview.write_readiness.write_ready)}
        />
        <WorkplanePanelMetric
          label="unit entries"
          value={String(preview.input_summary.perspective_unit_entry_count)}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>selected PerspectiveUnit</span>
        <strong>
          {preview.input_summary.selected_perspective_unit_candidate_count} refs
        </strong>
        <span style={workplaneCopyStyle}>
          NextWorkBias refs visible but not writable here:{" "}
          {preview.input_summary.non_writable_next_work_bias_candidate_count};
          relay refs visible but not writable here:{" "}
          {preview.input_summary.non_writable_continuity_relay_candidate_count}
        </span>
        <span style={workplaneCopyStyle}>
          related NextWorkBias record refs, advisory only:{" "}
          {preview.related_next_work_bias_record_refs.length}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>lifecycle directives</span>
        <span style={workplaneCopyStyle}>
          {preview.perspective_unit_entries
            .slice(0, 6)
            .map(
              (entry) =>
                `${entry.lifecycle_directive}:${entry.source_candidate_ref}`,
            )
            .join("; ") || "none"}
        </span>
      </section>

      <ReasonList
        title="write blockers"
        reasons={[
          ...preview.blocking_reasons,
          ...preview.missing_evidence,
          ...preview.refusal_reasons,
          ...preview.write_readiness.current_insufficient_data,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only scoped write preview</strong>
        <span style={workplaneCopyStyle}>
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_create_perspective_unit_record{" "}
          {String(
            preview.authority_boundary
              .can_create_perspective_unit_record,
          )}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_next_work_bias{" "}
          {String(preview.authority_boundary.can_write_next_work_bias)};
          can_write_perspective_unit{" "}
          {String(preview.authority_boundary.can_write_perspective_unit)};
          can_update_current_working_perspective{" "}
          {String(
            preview.authority_boundary.can_update_current_working_perspective,
          )}
        </span>
        <span style={workplaneCopyStyle}>
          can_update_continuity_relay{" "}
          {String(preview.authority_boundary.can_update_continuity_relay)};
          can_send_handoff {String(preview.authority_boundary.can_send_handoff)};
          can_execute_codex {String(preview.authority_boundary.can_execute_codex)}
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
