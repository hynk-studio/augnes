import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { CurrentWorkingPerspectiveApplyPreview } from "@/types/current-working-perspective-apply-preview";

type CurrentWorkingPerspectiveApplyPreviewPanelProps = {
  preview: CurrentWorkingPerspectiveApplyPreview;
};

export function CurrentWorkingPerspectiveApplyPreviewPanel({
  preview,
}: CurrentWorkingPerspectiveApplyPreviewPanelProps) {
  const summary = preview.proposed_patch_application_summary;

  return (
    <WorkplanePanelShell
      kicker="CWP apply"
      title="CurrentWorkingPerspective Apply Preview"
      ariaLabel="CurrentWorkingPerspective Apply Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only preview for applying an approved CWP update contract to a
        scoped local applied snapshot. Workbench does not perform the apply and
        this preview does not replace /api/perspective/current.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="apply status"
          value={preview.apply_preview_status}
        />
        <WorkplanePanelMetric
          label="recommended next"
          value={preview.recommended_next_action}
        />
        <WorkplanePanelMetric
          label="write ready"
          value={String(preview.apply_readiness.write_ready)}
        />
        <WorkplanePanelMetric
          label="applied patches"
          value={String(summary.applied_patch_count)}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>source contract</span>
        <strong>{preview.source_contract_summary.record_id ?? "none"}</strong>
        <span style={workplaneCopyStyle}>
          fingerprint {preview.source_contract_summary.record_fingerprint ?? "none"}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>applied snapshot</span>
        <strong>
          {preview.proposed_applied_current_working_perspective_summary
            .applied_snapshot_ref ?? "none"}
        </strong>
        <span style={workplaneCopyStyle}>
          goals{" "}
          {
            preview.proposed_applied_current_working_perspective_summary
              .active_goal_count
          }
          ; questions{" "}
          {
            preview.proposed_applied_current_working_perspective_summary
              .open_question_count
          }
          ; risks{" "}
          {
            preview.proposed_applied_current_working_perspective_summary
              .active_risk_count
          }
          ; candidates{" "}
          {
            preview.proposed_applied_current_working_perspective_summary
              .next_candidate_count
          }
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>patch targets</span>
        <span style={workplaneCopyStyle}>
          frame {summary.patch_target_counts.current_frame ?? 0}; thesis{" "}
          {summary.patch_target_counts.current_thesis ?? 0}; next candidates{" "}
          {summary.patch_target_counts.next_candidates ?? 0}; risks{" "}
          {summary.patch_target_counts.active_risks ?? 0}; gaps{" "}
          {summary.patch_target_counts.staleness_and_gaps ?? 0}; relay{" "}
          {summary.patch_target_counts.continuity_relay_alignment ?? 0}
        </span>
      </section>

      <ReasonList
        title="apply blockers"
        reasons={[
          ...preview.blocking_reasons,
          ...preview.missing_evidence,
          ...preview.refusal_reasons,
          ...preview.apply_readiness.current_insufficient_data,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Local applied snapshot preview only</strong>
        <span style={workplaneCopyStyle}>
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_create_apply_record{" "}
          {String(
            preview.authority_boundary
              .can_create_current_working_perspective_apply_record,
          )}
          ; can_create_snapshot{" "}
          {String(
            preview.authority_boundary
              .can_create_applied_current_working_perspective_snapshot,
          )}
        </span>
        <span style={workplaneCopyStyle}>
          can_apply_cwp_update{" "}
          {String(preview.authority_boundary.can_apply_current_working_perspective_update)};
          can_write_memory {String(preview.authority_boundary.can_write_memory)};
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
