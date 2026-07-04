import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { ApprovedHandoffContextUpdateRecordReview } from "@/types/handoff-context-update-record-review";
import type { CSSProperties } from "react";

type HandoffContextUpdateRecordReviewPanelProps = {
  review: ApprovedHandoffContextUpdateRecordReview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function HandoffContextUpdateRecordReviewPanel({
  review,
}: HandoffContextUpdateRecordReviewPanelProps) {
  const selectedOrLatest =
    review.selected_record_summary ?? review.record_summaries[0] ?? null;
  const latestLabel = review.input_summary.latest_record_id
    ? `${review.input_summary.latest_record_id} / ${
        review.input_summary.latest_record_created_at ?? "unknown"
      }`
    : "none";

  return (
    <WorkplanePanelShell
      kicker="Handoff record review"
      title="Approved Handoff Context Update Record Review"
      ariaLabel="Approved Handoff Context Update Record Review panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only review of supplied operator-approved handoff context update
        records. This panel summarizes recorded candidate material and confirms
        it has not been applied to live handoff context or sent as a handoff.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Review status"
          value={review.review_status}
        />
        <WorkplanePanelMetric
          label="Records"
          value={review.input_summary.supplied_record_count}
        />
        <WorkplanePanelMetric label="Valid" value={review.input_summary.valid_record_count} />
        <WorkplanePanelMetric label="Latest" value={latestLabel} />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <SelectedRecordSection review={review} record={selectedOrLatest} />
        <ApprovedMaterialSection review={review} />
        <EvidenceSection review={review} />
        <LiveBoundarySection review={review} />
      </section>

      <section
        aria-label="Approved handoff context update record authority boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority</span>
        <strong>Read-only record review</strong>
        <span style={workplaneCopyStyle}>
          can_write_db {String(review.authority_boundary.can_write_db)};
          can_create_schema{" "}
          {String(review.authority_boundary.can_create_schema)};
          can_write_handoff_context_update_record{" "}
          {String(
            review.authority_boundary.can_write_handoff_context_update_record,
          )}
          ; can_write_operator_approved_handoff_context_update_record{" "}
          {String(
            review.authority_boundary
              .can_write_operator_approved_handoff_context_update_record,
          )}
          ; can_mutate_live_handoff_context{" "}
          {String(review.authority_boundary.can_mutate_live_handoff_context)};
          can_write_selected_refs_to_live_handoff{" "}
          {String(
            review.authority_boundary.can_write_selected_refs_to_live_handoff,
          )}
          ; can_send_handoff{" "}
          {String(review.authority_boundary.can_send_handoff)};
          can_call_provider_openai{" "}
          {String(review.authority_boundary.can_call_provider_openai)};
          can_call_github {String(review.authority_boundary.can_call_github)};
          can_execute_codex {String(review.authority_boundary.can_execute_codex)}
        </span>
      </section>

      {review.insufficient_data_reasons.length > 0 ? (
        <section
          aria-label="Approved handoff context update record review insufficient data"
          style={workplaneItemStyle}
        >
          <span style={workplaneBadgeStyle}>insufficient data</span>
          <ul style={workplaneListStyle}>
            {review.insufficient_data_reasons.slice(0, 8).map((reason) => (
              <li key={reason} style={workplaneItemStyle}>
                <span style={workplaneCopyStyle}>{reason}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </WorkplanePanelShell>
  );
}

function SelectedRecordSection({
  review,
  record,
}: {
  review: ApprovedHandoffContextUpdateRecordReview;
  record: ApprovedHandoffContextUpdateRecordReview["selected_record_summary"];
}) {
  return (
    <section
      aria-label="Approved handoff context update selected record summary"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>record</span>
      <strong>
        {record?.record_id ??
          review.input_summary.selected_record_id ??
          "no record supplied"}
      </strong>
      <span style={workplaneCopyStyle}>
        selected_found {String(review.input_summary.selected_record_found)};
        selected_id {review.input_summary.selected_record_id ?? "none"};
        latest_id {review.input_summary.latest_record_id ?? "none"}
      </span>
      <span style={workplaneCopyStyle}>
        operator_ref {record?.operator_ref ?? "none"}; approved_by{" "}
        {record?.approved_by ?? "none"}; decision{" "}
        {record?.operator_decision ?? "none"}
      </span>
    </section>
  );
}

function ApprovedMaterialSection({
  review,
}: {
  review: ApprovedHandoffContextUpdateRecordReview;
}) {
  const material = review.approved_material_summary;
  return (
    <section
      aria-label="Approved handoff context update candidate material summary"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>approved material</span>
      <strong>
        selected {material.selected_ref_add_count +
          material.selected_ref_reinforcement_count}
      </strong>
      <span style={workplaneCopyStyle}>
        add {material.selected_ref_add_count}; reinforce{" "}
        {material.selected_ref_reinforcement_count}; warnings{" "}
        {material.warning_update_count}; context_diet{" "}
        {material.context_diet_count}; keep_unknown{" "}
        {material.keep_unknown_count}; expected_return{" "}
        {material.expected_return_signal_count}
      </span>
      <span style={workplaneCopyStyle}>
        carry_forward_stop_if_missing {material.stop_if_missing_count};
        rejected_or_excluded {material.rejected_or_excluded_count}
      </span>
    </section>
  );
}

function EvidenceSection({
  review,
}: {
  review: ApprovedHandoffContextUpdateRecordReview;
}) {
  return (
    <section
      aria-label="Approved handoff context update record evidence summary"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>source and evidence</span>
      <strong>
        sources {review.evidence_summary.source_refs.length}; evidence{" "}
        {review.evidence_summary.evidence_refs.length}
      </strong>
      <span style={workplaneCopyStyle}>
        has_source_refs {String(review.evidence_summary.has_source_refs)};
        has_evidence_refs {String(review.evidence_summary.has_evidence_refs)};
        fingerprints{" "}
        {String(review.evidence_summary.all_records_have_fingerprints)};
        validation_hashes{" "}
        {String(review.evidence_summary.all_records_have_validation_hashes)}
      </span>
      <span style={workplaneCopyStyle}>
        problem_records {review.evidence_summary.problem_record_ids.length};
        missing_evidence {review.evidence_summary.missing_evidence.length}
      </span>
    </section>
  );
}

function LiveBoundarySection({
  review,
}: {
  review: ApprovedHandoffContextUpdateRecordReview;
}) {
  return (
    <section
      aria-label="Approved handoff context update record live state boundary"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>live state</span>
      <strong>Live handoff context not mutated</strong>
      <span style={workplaneCopyStyle}>
        selected_refs_written_to_live_handoff{" "}
        {String(review.live_state_boundary.selected_refs_written_to_live_handoff)}
        ; handoff_sent {String(review.live_state_boundary.handoff_sent)}
      </span>
      <span style={workplaneCopyStyle}>
        confirmed_no_live_mutation{" "}
        {String(
          review.evidence_summary
            .all_records_confirm_no_live_handoff_mutation,
        )}
        ; confirmed_no_handoff_send{" "}
        {String(review.evidence_summary.all_records_confirm_no_handoff_send)};
        confirmed_no_provider_github_codex{" "}
        {String(
          review.evidence_summary
            .all_records_confirm_no_provider_github_codex,
        )}
      </span>
    </section>
  );
}
