import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { SelectedSessionDigestIngestRecordReview } from "@/types/selected-session-digest-ingest-record-review";
import type { CSSProperties } from "react";

type SelectedSessionDigestIngestRecordReviewPanelProps = {
  review: SelectedSessionDigestIngestRecordReview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function SelectedSessionDigestIngestRecordReviewPanel({
  review,
}: SelectedSessionDigestIngestRecordReviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Selected session digest record review"
      title="Selected Session Digest Ingest Record Review"
      ariaLabel="Selected Session Digest Ingest Record Review panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only review of already-read selected session digest candidate
        ingest records. Workbench supplies no default DB read and no sample
        current record, so the default state remains honest when no candidate
        ingest record has been supplied.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Review status"
          value={review.review_status}
        />
        <WorkplanePanelMetric
          label="candidate ingest record count"
          value={String(review.input_summary.valid_record_count)}
        />
        <WorkplanePanelMetric
          label="selected candidate refs"
          value={String(
            review.input_summary.selected_digest_candidate_ref_count,
          )}
        />
        <WorkplanePanelMetric
          label="receipt side effect problems"
          value={String(review.input_summary.receipt_side_effect_problem_count)}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <RecordStatusSection review={review} />
        <LatestRecordSection review={review} />
        <NoSideEffectsSection review={review} />
        <EvidenceSection review={review} />
      </section>

      <section
        aria-label="Selected session digest ingest record review blockers"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>record review blockers</span>
        <strong>
          blockers {review.blocked_reasons.length}; insufficient{" "}
          {review.insufficient_data_reasons.length}
        </strong>
        <ul style={workplaneListStyle}>
          {[...review.blocked_reasons, ...review.insufficient_data_reasons]
            .slice(0, 8)
            .map((reason) => (
              <li key={reason} style={workplaneItemStyle}>
                <span style={workplaneCopyStyle}>{reason}</span>
              </li>
            ))}
        </ul>
      </section>

      <section
        aria-label="Selected session digest ingest record review would not do"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>would not do</span>
        <ul style={workplaneListStyle}>
          {review.would_not_do.slice(0, 12).map((item) => (
            <li key={item} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Selected session digest ingest record review authority boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <strong>Read-only record review</strong>
        <span style={workplaneCopyStyle}>
          read_only_record_review{" "}
          {String(review.authority_boundary.read_only_record_review)};
          source_of_truth {String(review.authority_boundary.source_of_truth)}
        </span>
        <span style={workplaneCopyStyle}>
          can_create_ingest_record{" "}
          {String(review.authority_boundary.can_create_ingest_record)};
          can_create_ingest_receipt{" "}
          {String(review.authority_boundary.can_create_ingest_receipt)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_memory {String(review.authority_boundary.can_write_memory)};
          can_mutate_current_working_perspective{" "}
          {String(
            review.authority_boundary.can_mutate_current_working_perspective,
          )}
        </span>
        <span style={workplaneCopyStyle}>
          can_apply_handoff_context{" "}
          {String(review.authority_boundary.can_apply_handoff_context)};
          can_send_handoff {String(review.authority_boundary.can_send_handoff)}
        </span>
        <span style={workplaneCopyStyle}>
          can_call_provider_openai{" "}
          {String(review.authority_boundary.can_call_provider_openai)};
          can_call_github {String(review.authority_boundary.can_call_github)};
          can_execute_codex {String(review.authority_boundary.can_execute_codex)}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function RecordStatusSection({
  review,
}: {
  review: SelectedSessionDigestIngestRecordReview;
}) {
  return (
    <section
      aria-label="Selected session digest ingest record status"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>record status</span>
      <strong>{review.review_status}</strong>
      <span style={workplaneCopyStyle}>
        supplied {review.input_summary.supplied_record_count}; valid{" "}
        {review.input_summary.valid_record_count}; invalid{" "}
        {review.input_summary.invalid_record_count}
      </span>
      <span style={workplaneCopyStyle}>
        selected record{" "}
        {review.input_summary.selected_record_id ?? "none supplied"}; found{" "}
        {String(review.input_summary.selected_record_found)}
      </span>
    </section>
  );
}

function LatestRecordSection({
  review,
}: {
  review: SelectedSessionDigestIngestRecordReview;
}) {
  const latest = review.latest_record_summary;
  return (
    <section
      aria-label="Selected session digest latest candidate ingest record"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>latest candidate ingest record</span>
      <strong>{latest?.record_id ?? "none"}</strong>
      <span style={workplaneCopyStyle}>
        source {latest?.source_kind ?? "none"}; operator{" "}
        {latest?.operator_ref ?? "none"}
      </span>
      <span style={workplaneCopyStyle}>
        session {latest?.session_ref ?? "none"}; project{" "}
        {latest?.project_ref ?? "none"}
      </span>
      <span style={workplaneCopyStyle}>
        privacy {latest?.privacy_review_confirmation_ref ?? "none"}; summaries{" "}
        {latest?.sanitized_candidate_summary_count ?? 0}
      </span>
    </section>
  );
}

function NoSideEffectsSection({
  review,
}: {
  review: SelectedSessionDigestIngestRecordReview;
}) {
  const sideEffects = review.receipt_no_side_effects_summary;
  return (
    <section
      aria-label="Selected session digest ingest record receipt no side effects"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>receipt no side effects</span>
      <strong>
        candidate records{" "}
        {sideEffects.selected_session_digest_ingest_record_written_count}
      </strong>
      <span style={workplaneCopyStyle}>
        receipts{" "}
        {sideEffects.selected_session_digest_ingest_receipt_written_count};
        persisted candidate records{" "}
        {sideEffects.selected_session_digest_persisted_as_candidate_record_count}
      </span>
      <span style={workplaneCopyStyle}>
        memory {sideEffects.memory_mutated_count}; CWP{" "}
        {sideEffects.current_working_perspective_updated_count}; Perspective{" "}
        {sideEffects.perspective_unit_written_count}
      </span>
      <span style={workplaneCopyStyle}>
        relay {sideEffects.continuity_relay_written_count}; handoff{" "}
        {sideEffects.handoff_context_mutated_count}; provider{" "}
        {sideEffects.provider_called_count}
      </span>
    </section>
  );
}

function EvidenceSection({
  review,
}: {
  review: SelectedSessionDigestIngestRecordReview;
}) {
  return (
    <section
      aria-label="Selected session digest ingest record evidence"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>evidence</span>
      <strong>
        source refs {review.evidence_summary.source_refs.length}; evidence refs{" "}
        {review.evidence_summary.evidence_refs.length}
      </strong>
      <span style={workplaneCopyStyle}>
        has records {String(review.evidence_summary.has_records)}; has valid{" "}
        {String(review.evidence_summary.has_valid_records)}
      </span>
      <span style={workplaneCopyStyle}>
        problem records {review.evidence_summary.problem_record_ids.length};
        missing evidence {review.evidence_summary.missing_evidence.length}
      </span>
    </section>
  );
}
