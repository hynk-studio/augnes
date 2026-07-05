import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { CurrentWorkingPerspectiveRouteIntegrationReadReview } from "@/types/current-working-perspective-route-integration-read-review";

type CurrentWorkingPerspectiveRouteIntegrationReadPanelProps = {
  review: CurrentWorkingPerspectiveRouteIntegrationReadReview;
};

export function CurrentWorkingPerspectiveRouteIntegrationReadPanel({
  review,
}: CurrentWorkingPerspectiveRouteIntegrationReadPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="CWP route integration"
      title="CurrentWorkingPerspective Route Integration Read"
      ariaLabel="CurrentWorkingPerspective Route Integration Read panel"
    >
      <p style={workplaneCopyStyle}>
        Display-only review of the optional /api/perspective/current route
        integration read. Workbench does not call the route, open write paths,
        create schema, or perform the integration.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="review status"
          value={review.review_status}
        />
        <WorkplanePanelMetric
          label="read status"
          value={review.input_summary.read_status ?? "none"}
        />
        <WorkplanePanelMetric
          label="response mode"
          value={review.input_summary.response_mode ?? "none"}
        />
        <WorkplanePanelMetric
          label="fallback"
          value={String(review.runtime_fallback_summary.used_runtime_fallback)}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>route state</span>
        <strong>
          {review.route_integration_summary.route_path ??
            "/api/perspective/current"}
        </strong>
        <span style={workplaneCopyStyle}>
          primary source {review.route_integration_summary.primary_source};
          route integration is{" "}
          {readableMode(review.route_integration_summary.response_mode)}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>contract</span>
        <strong>{review.contract_summary.contract_record_id ?? "none"}</strong>
        <span style={workplaneCopyStyle}>
          mode {review.contract_summary.route_integration_mode ?? "none"};
          apply refs{" "}
          {review.contract_summary.source_cwp_apply_record_ref_count};
          update contract refs{" "}
          {
            review.contract_summary
              .source_cwp_update_contract_record_ref_count
          }
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>applied snapshot</span>
        <strong>
          {review.applied_snapshot_summary.applied_snapshot_ref ?? "none"}
        </strong>
        <span style={workplaneCopyStyle}>
          patches {review.applied_snapshot_summary.applied_patch_count};
          overlay{" "}
          {String(review.applied_snapshot_summary.overlay_candidate)};
          preferred{" "}
          {String(review.applied_snapshot_summary.preferred_primary)}
        </span>
      </section>

      <ReasonList
        title="route integration blockers"
        reasons={[
          ...review.blocked_reasons,
          ...review.refusal_reasons,
          ...review.warning_reasons,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only route integration review</strong>
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

function readableMode(mode: string | null) {
  if (mode === "runtime_primary_with_applied_snapshot_hint") return "hint-only";
  if (mode === "runtime_primary_with_applied_overlay_candidate") {
    return "overlay candidate";
  }
  if (mode === "applied_snapshot_preferred_with_runtime_fallback") {
    return "preferred applied snapshot with runtime fallback";
  }
  return "inactive/runtime-only";
}
