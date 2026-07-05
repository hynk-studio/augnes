import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { CurrentWorkingPerspectiveUpdateContractPreview } from "@/types/current-working-perspective-update-contract-preview";

type CurrentWorkingPerspectiveUpdateContractPreviewPanelProps = {
  preview: CurrentWorkingPerspectiveUpdateContractPreview;
};

export function CurrentWorkingPerspectiveUpdateContractPreviewPanel({
  preview,
}: CurrentWorkingPerspectiveUpdateContractPreviewPanelProps) {
  const contract = preview.proposed_current_working_perspective_update_contract;
  const patchTargets = countBy(contract.proposed_patch_entries, "patch_target");

  return (
    <WorkplanePanelShell
      kicker="CWP update contract"
      title="CurrentWorkingPerspective Update Contract Preview"
      ariaLabel="CurrentWorkingPerspective Update Contract Preview panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only contract preview for a future CurrentWorkingPerspective apply
        slice. The only writable artifact in this PR is a scoped local contract
        record and receipt, and Workbench does not perform that write.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Contract status"
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
          label="patch entries"
          value={String(preview.input_summary.proposed_patch_entry_count)}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>CWP source</span>
        <strong>
          {preview.current_working_perspective_summary.current_cwp_ref ?? "none"}
        </strong>
        <span style={workplaneCopyStyle}>
          source {preview.current_working_perspective_summary.source_status};
          version {preview.current_working_perspective_summary.perspective_version};
          staleness {preview.current_working_perspective_summary.staleness_status}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>contributing scoped records</span>
        <span style={workplaneCopyStyle}>
          PerspectiveUnit{" "}
          {preview.contributing_record_refs.perspective_unit_record_refs.length};
          NextWorkBias{" "}
          {preview.contributing_record_refs.next_work_bias_record_refs.length};
          ContinuityRelay{" "}
          {preview.contributing_record_refs.continuity_relay_record_refs.length}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>patch target coverage</span>
        <span style={workplaneCopyStyle}>
          frame {patchTargets.current_frame ?? 0}; thesis{" "}
          {patchTargets.current_thesis ?? 0}; next candidates{" "}
          {patchTargets.next_candidates ?? 0}; risks{" "}
          {patchTargets.active_risks ?? 0}; gaps{" "}
          {patchTargets.staleness_and_gaps ?? 0}; relay alignment{" "}
          {patchTargets.continuity_relay_alignment ?? 0}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>proposed entries</span>
        <ul style={workplaneListStyle}>
          {contract.proposed_patch_entries.slice(0, 6).map((entry) => (
            <li key={entry.patch_ref} style={workplaneItemStyle}>
              <strong>
                {entry.patch_target} / {entry.patch_operation}
              </strong>
              <span style={workplaneCopyStyle}>{entry.summary}</span>
            </li>
          ))}
          {contract.proposed_patch_entries.length === 0 ? (
            <li style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>none</span>
            </li>
          ) : null}
        </ul>
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
        <strong>Read-only contract preview</strong>
        <span style={workplaneCopyStyle}>
          can_write_db {String(preview.authority_boundary.can_write_db)};
          can_create_contract_record{" "}
          {String(
            preview.authority_boundary
              .can_create_current_working_perspective_update_contract_record,
          )}
        </span>
        <span style={workplaneCopyStyle}>
          can_update_cwp{" "}
          {String(preview.authority_boundary.can_update_current_working_perspective)};
          can_apply_cwp_update{" "}
          {String(
            preview.authority_boundary.can_apply_current_working_perspective_update,
          )};
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

function countBy<T extends object>(items: T[], field: keyof T & string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = typeof item[field] === "string" ? item[field] : "unknown";
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}
