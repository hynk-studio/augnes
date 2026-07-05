import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { CurrentWorkingPerspectiveUpdateContractRecordReview } from "@/types/current-working-perspective-update-contract-record-review";

type CurrentWorkingPerspectiveUpdateContractRecordReviewPanelProps = {
  review: CurrentWorkingPerspectiveUpdateContractRecordReview;
};

export function CurrentWorkingPerspectiveUpdateContractRecordReviewPanel({
  review,
}: CurrentWorkingPerspectiveUpdateContractRecordReviewPanelProps) {
  const latest = review.latest_record_summary;
  const material =
    review.current_working_perspective_update_contract_material_summary;
  const sideEffects = review.receipt_no_side_effects_summary;

  return (
    <WorkplanePanelShell
      kicker="CWP contract record"
      title="CurrentWorkingPerspective Update Contract Record Review"
      ariaLabel="CurrentWorkingPerspective Update Contract Record Review panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only review of already-read scoped CWP update contract records.
        Workbench supplies no default database read and no sample records.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Review status" value={review.review_status} />
        <WorkplanePanelMetric
          label="record count"
          value={String(review.input_summary.valid_record_count)}
        />
        <WorkplanePanelMetric
          label="patch entries"
          value={String(material.proposed_patch_entry_count)}
        />
        <WorkplanePanelMetric
          label="side effect problems"
          value={String(review.input_summary.receipt_side_effect_problem_count)}
        />
      </WorkplanePanelMetricGrid>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>latest contract record</span>
        <strong>{latest?.record_id ?? "none"}</strong>
        <span style={workplaneCopyStyle}>
          patches {latest?.proposed_patch_entry_count ?? 0}; frame{" "}
          {latest?.current_frame_patch_count ?? 0}; thesis{" "}
          {latest?.current_thesis_patch_count ?? 0}; candidates{" "}
          {latest?.next_candidates_patch_count ?? 0}; relay alignment{" "}
          {latest?.continuity_relay_alignment_patch_count ?? 0}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>contributing refs</span>
        <span style={workplaneCopyStyle}>
          PerspectiveUnit{" "}
          {material.contributing_record_ref_counts.perspective_unit_record_refs};
          NextWorkBias{" "}
          {material.contributing_record_ref_counts.next_work_bias_record_refs};
          ContinuityRelay{" "}
          {material.contributing_record_ref_counts.continuity_relay_record_refs}
        </span>
      </section>

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>receipt no side effects</span>
        <strong>
          contract records{" "}
          {
            sideEffects
              .current_working_perspective_update_contract_record_written_count
          }
        </strong>
        <span style={workplaneCopyStyle}>
          contract written{" "}
          {
            sideEffects
              .current_working_perspective_update_contract_written_count
          };
          CWP updated {sideEffects.current_working_perspective_updated_count};
          CWP applied{" "}
          {sideEffects.current_working_perspective_update_applied_count};
          ContinuityRelay written {sideEffects.continuity_relay_written_count};
          handoff {sideEffects.handoff_sent_count}; memory{" "}
          {sideEffects.memory_written_count}
        </span>
      </section>

      <ReasonList
        title="record review blockers"
        reasons={[
          ...review.blocked_reasons,
          ...review.insufficient_data_reasons,
          ...review.evidence_summary.missing_evidence,
        ]}
      />

      <section style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only record review</strong>
        <span style={workplaneCopyStyle}>
          can_create_schema {String(review.authority_boundary.can_create_schema)};
          can_create_contract_record{" "}
          {String(
            review.authority_boundary
              .can_create_current_working_perspective_update_contract_record,
          )}
        </span>
        <span style={workplaneCopyStyle}>
          can_update_cwp{" "}
          {String(review.authority_boundary.can_update_current_working_perspective)};
          can_apply_cwp_update{" "}
          {String(
            review.authority_boundary.can_apply_current_working_perspective_update,
          )};
          can_send_handoff {String(review.authority_boundary.can_send_handoff)};
          can_execute_codex {String(review.authority_boundary.can_execute_codex)}
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
