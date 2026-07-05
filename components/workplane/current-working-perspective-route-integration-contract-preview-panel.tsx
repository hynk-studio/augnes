import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { CurrentWorkingPerspectiveRouteIntegrationContractPreview } from "@/types/current-working-perspective-route-integration-contract-preview";

type CurrentWorkingPerspectiveRouteIntegrationContractPreviewPanelProps = {
  preview: CurrentWorkingPerspectiveRouteIntegrationContractPreview;
};

export function CurrentWorkingPerspectiveRouteIntegrationContractPreviewPanel({
  preview,
}: CurrentWorkingPerspectiveRouteIntegrationContractPreviewPanelProps) {
  const contract =
    preview.proposed_current_working_perspective_route_integration_contract;

  return (
    <WorkplanePanelShell
      kicker="CWP route contract"
      title="CurrentWorkingPerspective Route Integration Contract Preview"
      ariaLabel="CurrentWorkingPerspective Route Integration Contract Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only contract preview for a future route integration slice.
        /api/perspective/current is not changed here, and Workbench does not
        write the contract record.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="contract status"
          value={preview.contract_preview_status}
        />
        <WorkplanePanelMetric
          label="recommended next"
          value={preview.recommended_next_action}
        />
        <WorkplanePanelMetric
          label="write ready"
          value={String(preview.contract_readiness.write_ready)}
        />
        <WorkplanePanelMetric
          label="mode"
          value={
            preview.input_summary.requested_route_integration_mode ??
            "missing"
          }
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>route path</span>
        <strong>{contract?.route_path ?? "/api/perspective/current"}</strong>
        <span style={workplaneCopyStyle}>
          future behavior{" "}
          {contract?.proposed_future_route_behavior.default_mode ?? "not ready"}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>runtime CWP</span>
        <strong>
          {preview.runtime_current_working_perspective_summary.current_cwp_ref ??
            "none"}
        </strong>
        <span style={workplaneCopyStyle}>
          source{" "}
          {preview.runtime_current_working_perspective_summary.source_status};
          frame{" "}
          {preview.runtime_current_working_perspective_summary
            .current_frame_summary ?? "none"}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>applied snapshot</span>
        <strong>
          {preview.applied_current_working_perspective_summary
            .applied_snapshot_ref ?? "none"}
        </strong>
        <span style={workplaneCopyStyle}>
          source contract{" "}
          {preview.applied_current_working_perspective_summary
            .source_contract_record_ref ?? "none"}
          ; patches{" "}
          {preview.applied_current_working_perspective_summary
            .applied_patch_count}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>route guards</span>
        <span style={workplaneCopyStyle}>
          safe path{" "}
          {String(contract?.route_integration_guards.require_safe_applied_snapshot_db_path ?? false)}
          ; schema existing{" "}
          {String(contract?.route_integration_guards.require_schema_existing_for_applied_snapshot_reads ?? false)}
          ; never write on GET{" "}
          {String(contract?.route_integration_guards.never_write_on_get ?? false)}
          ; runtime fallback{" "}
          {String(contract?.route_integration_guards.preserve_runtime_fallback ?? false)}
        </span>
      </section>

      <ReasonList
        title="contract blockers"
        reasons={[
          ...preview.blocking_reasons,
          ...preview.missing_evidence,
          ...preview.refusal_reasons,
          ...preview.contract_readiness.current_insufficient_data,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Contract material only</strong>
        <span style={workplaneCopyStyle}>
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_modify_route{" "}
          {String(
            preview.authority_boundary
              .can_modify_api_perspective_current_route,
          )}
          ; can_replace_route{" "}
          {String(
            preview.authority_boundary
              .can_replace_current_working_perspective_route_response,
          )}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_applied_snapshot{" "}
          {String(
            preview.authority_boundary
              .can_write_applied_current_working_perspective_snapshot,
          )}
          ; can_write_memory {String(preview.authority_boundary.can_write_memory)};
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
