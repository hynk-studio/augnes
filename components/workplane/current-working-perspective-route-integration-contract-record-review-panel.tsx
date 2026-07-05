import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { CurrentWorkingPerspectiveRouteIntegrationContractRecordReview } from "@/types/current-working-perspective-route-integration-contract-record-review";

type CurrentWorkingPerspectiveRouteIntegrationContractRecordReviewPanelProps = {
  review: CurrentWorkingPerspectiveRouteIntegrationContractRecordReview;
};

export function CurrentWorkingPerspectiveRouteIntegrationContractRecordReviewPanel({
  review,
}: CurrentWorkingPerspectiveRouteIntegrationContractRecordReviewPanelProps) {
  const latest = review.latest_record_summary;
  return (
    <WorkplanePanelShell
      kicker="CWP route readback"
      title="CurrentWorkingPerspective Route Integration Contract Record Review"
      ariaLabel="CurrentWorkingPerspective Route Integration Contract Record Review panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only review of already-read scoped local route integration
        contract records. Workbench does not open the write route, create
        schema, or modify /api/perspective/current by default.
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
          label="latest mode"
          value={latest?.route_integration_mode ?? "none"}
        />
        <WorkplanePanelMetric
          label="guard count"
          value={String(latest?.enabled_guard_count ?? 0)}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>latest contract</span>
        <strong>{latest?.record_id ?? "none"}</strong>
        <span style={workplaneCopyStyle}>
          route {latest?.route_path ?? "/api/perspective/current"};
          applied snapshot {latest?.source_applied_snapshot_ref ?? "none"}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>material counts</span>
        <span style={workplaneCopyStyle}>
          future requirements{" "}
          {
            review.route_integration_contract_material_summary
              .future_implementation_requirement_count
          }
          ; runtime hint mode{" "}
          {review.route_integration_contract_material_summary.mode_counts
            .runtime_only_with_applied_snapshot_hint ?? 0}
          ; overlay mode{" "}
          {review.route_integration_contract_material_summary.mode_counts
            .applied_snapshot_overlay_candidate ?? 0}
          ; preferred mode{" "}
          {review.route_integration_contract_material_summary.mode_counts
            .applied_snapshot_preferred_with_runtime_fallback ?? 0}
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
        <strong>Read-only route contract review</strong>
        <span style={workplaneCopyStyle}>
          can_write_db {String(review.authority_boundary.can_write_db)};
          can_create_schema{" "}
          {String(review.authority_boundary.can_create_schema)};
          can_modify_route{" "}
          {String(
            review.authority_boundary
              .can_modify_api_perspective_current_route,
          )}
          ; can_replace_route{" "}
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
