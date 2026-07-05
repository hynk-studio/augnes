import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { PerspectiveRelayUpdateCandidateBridgePreview } from "@/types/perspective-relay-update-candidate-bridge-preview";

type PerspectiveRelayUpdateCandidateBridgePreviewPanelProps = {
  preview: PerspectiveRelayUpdateCandidateBridgePreview;
};

export function PerspectiveRelayUpdateCandidateBridgePreviewPanel({
  preview,
}: PerspectiveRelayUpdateCandidateBridgePreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Perspective relay bridge"
      title="Perspective / Relay Update Candidate Bridge"
      ariaLabel="Perspective Relay Update Candidate Bridge panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only bridge from accepted next-work signal material toward future
        Perspective, NextWorkBias, and continuity relay update decisions. This
        panel does not write those states.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Bridge status" value={preview.bridge_preview_status} />
        <WorkplanePanelMetric label="recommended next action" value={preview.recommended_next_action} />
        <WorkplanePanelMetric label="candidate material" value={String(preview.input_summary.candidate_material_count)} />
        <WorkplanePanelMetric label="blockers" value={String(preview.input_summary.blocker_count)} />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>Perspective candidates</span>
        <span style={workplaneCopyStyle}>
          reinforce{" "}
          {preview.proposed_perspective_unit_candidates.reinforce_candidates.length};
          warn{" "}
          {preview.proposed_perspective_unit_candidates.weaken_or_warn_candidates.length};
          retire{" "}
          {preview.proposed_perspective_unit_candidates.retire_or_deprioritize_candidates.length};
          review{" "}
          {preview.proposed_perspective_unit_candidates.split_or_review_candidates.length}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>Next-work / relay candidates</span>
        <span style={workplaneCopyStyle}>
          preserve{" "}
          {preview.proposed_next_work_bias_candidates.preserve_next_time.length};
          warn {preview.proposed_next_work_bias_candidates.warn_next_time.length};
          drop{" "}
          {preview.proposed_next_work_bias_candidates.drop_or_deprioritize.length};
          relay focus{" "}
          {preview.proposed_continuity_relay_candidates.next_focus_candidates.length}
        </span>
      </section>

      <ReasonList
        title="bridge blockers"
        reasons={[
          ...preview.blocked_reasons,
          ...preview.insufficient_data_reasons,
          ...preview.evidence_summary.missing_evidence,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Candidate bridge only</strong>
        <span style={workplaneCopyStyle}>
          can_write_perspective_unit{" "}
          {String(preview.authority_boundary.can_write_perspective_unit)};
          can_write_next_work_bias{" "}
          {String(preview.authority_boundary.can_write_next_work_bias)};
          can_update_current_working_perspective{" "}
          {String(preview.authority_boundary.can_update_current_working_perspective)}
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
