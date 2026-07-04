import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type {
  DogfoodReuseBucketCounts,
  DogfoodReuseOperatorDecisionPreview,
} from "@/types/dogfood-reuse-operator-decision-preview";
import type { CSSProperties } from "react";

type DogfoodReuseOperatorDecisionPreviewPanelProps = {
  preview: DogfoodReuseOperatorDecisionPreview;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function DogfoodReuseOperatorDecisionPreviewPanel({
  preview,
}: DogfoodReuseOperatorDecisionPreviewPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Dogfood review"
      title="Operator decision preview"
      ariaLabel="Dogfood reuse operator decision preview"
    >
      <p style={workplaneCopyStyle}>
        Read-only decision preview for whether the current proposal is ready
        for a later operator-approved dogfood/reuse write. This panel does not
        persist approve/defer/reject decisions, write a ledger, update metrics,
        mutate memory, apply Perspective state, call GitHub or Codex, or send a
        handoff.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Status"
          value={preview.decision_preview_status}
        />
        <WorkplanePanelMetric
          label="Decision"
          value={preview.recommended_operator_decision}
        />
        <WorkplanePanelMetric
          label="Write ready"
          value={String(preview.write_readiness.write_ready)}
        />
        <WorkplanePanelMetric
          label="Blockers"
          value={preview.blocking_reasons.length}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <DecisionSourceSection preview={preview} />
        <WriteReadinessSection preview={preview} />
        <WouldWriteSection preview={preview} />
        <WouldNotWriteSection preview={preview} />
      </section>

      <section
        aria-label="Dogfood operator decision approval requirements"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>approval requirements</span>
        <ul style={workplaneListStyle}>
          {preview.approval_requirements.slice(0, 8).map((item) => (
            <li key={item} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Dogfood operator decision review checklist"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>review checklist</span>
        <ul style={workplaneListStyle}>
          {preview.review_checklist.slice(0, 7).map((item) => (
            <li key={item} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section
        aria-label="Dogfood operator decision authority boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority</span>
        <strong>Read-only decision preview</strong>
        <span style={workplaneCopyStyle}>
          source_of_truth{" "}
          {String(preview.authority_boundary.source_of_truth)};
          can_persist_decision{" "}
          {String(preview.authority_boundary.can_persist_decision)};
          can_write_dogfood_ledger{" "}
          {String(preview.authority_boundary.can_write_dogfood_ledger)};
          can_update_metrics{" "}
          {String(preview.authority_boundary.can_update_metrics)};
          can_mutate_memory{" "}
          {String(preview.authority_boundary.can_mutate_memory)};
          can_apply_project_perspective{" "}
          {String(preview.authority_boundary.can_apply_project_perspective)}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function DecisionSourceSection({
  preview,
}: {
  preview: DogfoodReuseOperatorDecisionPreview;
}) {
  return (
    <section
      aria-label="Dogfood operator decision source status"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>source status</span>
      <strong>{preview.source_status.proposal} proposal</strong>
      <span style={workplaneCopyStyle}>
        result_report {preview.source_status.codex_result_report};
        handoff_context_rationale{" "}
        {preview.source_status.handoff_context_rationale}; report_status{" "}
        {preview.source_status.codex_result_report_status}
      </span>
      <span style={workplaneCopyStyle}>
        proposal status{" "}
        {preview.proposal_refs.proposal_status ?? "missing"}
      </span>
      <span style={workplaneCopyStyle}>
        result report {preview.proposal_refs.result_report_ref ?? "missing"}
      </span>
    </section>
  );
}

function WriteReadinessSection({
  preview,
}: {
  preview: DogfoodReuseOperatorDecisionPreview;
}) {
  const visibleReasons = [
    ...preview.write_readiness.current_blockers,
    ...preview.write_readiness.current_missing_evidence,
  ].slice(0, 6);

  return (
    <section
      aria-label="Dogfood operator decision write readiness"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>write readiness</span>
      <strong>{preview.write_readiness.readiness_label}</strong>
      <span style={workplaneCopyStyle}>
        requires_result_report{" "}
        {String(preview.write_readiness.requires_actual_result_report)};
        requires_context_feedback{" "}
        {String(preview.write_readiness.requires_explicit_context_feedback)};
        requires_operator_confirmation{" "}
        {String(preview.write_readiness.requires_operator_confirmation)};
        skipped_checks_review{" "}
        {String(preview.write_readiness.requires_skipped_checks_review)}
      </span>
      <ul style={workplaneListStyle}>
        {visibleReasons.map((reason) => (
          <li key={reason} style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{reason}</span>
          </li>
        ))}
        {visibleReasons.length === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>
              No blockers detected; this is still a preview and requires
              explicit operator approval before any future write.
            </span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function WouldWriteSection({
  preview,
}: {
  preview: DogfoodReuseOperatorDecisionPreview;
}) {
  return (
    <section
      aria-label="Dogfood operator decision would write preview"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>would write preview</span>
      <strong>
        {preview.would_write_preview.proposed_record_kind ?? "not ready"}
      </strong>
      <span style={workplaneCopyStyle}>
        {preview.would_write_preview.proposed_dogfood_signal_summary
          .mismatch_summary}
      </span>
      <ReuseBucketCounts
        counts={preview.would_write_preview.proposed_reuse_bucket_counts}
      />
    </section>
  );
}

function WouldNotWriteSection({
  preview,
}: {
  preview: DogfoodReuseOperatorDecisionPreview;
}) {
  return (
    <section
      aria-label="Dogfood operator decision would not write"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>would not write</span>
      <ul style={workplaneListStyle}>
        {preview.would_not_write.map((item) => (
          <li key={item} style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ReuseBucketCounts({ counts }: { counts: DogfoodReuseBucketCounts }) {
  return (
    <ul style={workplaneListStyle}>
      {Object.entries(counts).map(([bucket, count]) => (
        <li key={bucket} style={workplaneItemStyle}>
          <span style={workplaneCopyStyle}>
            {bucket}: {count}
          </span>
        </li>
      ))}
    </ul>
  );
}
