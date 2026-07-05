import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { CurrentWorkingPerspectiveApplyRecordReview } from "@/types/current-working-perspective-apply-record-review";

type CurrentWorkingPerspectiveApplyRecordReviewPanelProps = {
  review: CurrentWorkingPerspectiveApplyRecordReview;
};

export function CurrentWorkingPerspectiveApplyRecordReviewPanel({
  review,
}: CurrentWorkingPerspectiveApplyRecordReviewPanelProps) {
  const latest = review.latest_applied_snapshot_summary;
  return (
    <WorkplanePanelShell
      kicker="CWP apply readback"
      title="CurrentWorkingPerspective Apply Record Review"
      ariaLabel="CurrentWorkingPerspective Apply Record Review panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only review of already-read scoped local apply records and applied
        snapshots. Workbench does not open the apply route, create schema, or
        perform writes by default.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="review status"
          value={review.review_status}
        />
        <WorkplanePanelMetric
          label="valid records"
          value={String(review.input_summary.valid_record_count)}
        />
        <WorkplanePanelMetric
          label="snapshots"
          value={String(review.applied_snapshots.length)}
        />
        <WorkplanePanelMetric
          label="applied patches"
          value={String(review.input_summary.applied_patch_count)}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>latest applied snapshot</span>
        <strong>{latest?.applied_snapshot_ref ?? "none"}</strong>
        <span style={workplaneCopyStyle}>
          source contract {latest?.source_contract_record_ref ?? "none"};
          staleness {latest?.staleness_status ?? "none"}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>material counts</span>
        <span style={workplaneCopyStyle}>
          frame{" "}
          {review.current_working_perspective_apply_material_summary
            .patch_target_counts.current_frame ?? 0}
          ; thesis{" "}
          {review.current_working_perspective_apply_material_summary
            .patch_target_counts.current_thesis ?? 0}
          ; next{" "}
          {review.current_working_perspective_apply_material_summary
            .patch_target_counts.next_candidates ?? 0}
          ; risks{" "}
          {review.current_working_perspective_apply_material_summary
            .patch_target_counts.active_risks ?? 0}
        </span>
      </section>

      <ReasonList
        title="review blockers"
        reasons={[
          ...review.blocked_reasons,
          ...review.insufficient_data_reasons,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only record and snapshot review</strong>
        <span style={workplaneCopyStyle}>
          can_write_db {String(review.authority_boundary.can_write_db)};
          can_create_schema{" "}
          {String(review.authority_boundary.can_create_schema)};
          can_replace_route{" "}
          {String(
            review.authority_boundary
              .can_replace_current_working_perspective_route_response,
          )}
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
