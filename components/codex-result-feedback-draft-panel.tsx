import type {
  CodexContextReuseRef,
  CodexResultFeedbackDraft,
  CodexResultExpectationItem,
} from "@/types/codex-result-feedback-draft";
import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { CSSProperties } from "react";

type CodexResultFeedbackDraftPanelProps = {
  draft: CodexResultFeedbackDraft;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function CodexResultFeedbackDraftPanel({
  draft,
}: CodexResultFeedbackDraftPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Result review"
      title="Feedback draft"
      ariaLabel="Codex result feedback draft preview"
    >
      <p style={workplaneCopyStyle}>
        Candidate-only comparison of the expected handoff return signal against
        normalized Codex result material. It can suggest carry-forward review
        material, but it cannot write memory, metrics, Perspective state,
        GitHub, Codex, or handoff delivery.
      </p>

      <SourceStatusSection draft={draft} />

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Matched"
          value={draft.expected_observed_delta.matched_expectations.length}
        />
        <WorkplanePanelMetric
          label="Missing"
          value={draft.expected_observed_delta.missing_expectations.length}
        />
        <WorkplanePanelMetric
          label="Unknown refs"
          value={draft.reuse_outcome_draft.unknown_refs.length}
        />
        <WorkplanePanelMetric
          label="Status"
          value={draft.candidate_status}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <ExpectedObservedSection draft={draft} />
        <SkippedChecksSection draft={draft} />
        <ReuseOutcomeSection draft={draft} />
        <CarryForwardSection draft={draft} />
      </section>

      <section aria-label="Codex result feedback insufficient data" style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>insufficient data</span>
        <ul style={workplaneListStyle}>
          {draft.insufficient_data_reasons.slice(0, 6).map((reason) => (
            <li key={reason} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{reason}</span>
            </li>
          ))}
          {draft.insufficient_data_reasons.length === 0 ? (
            <li style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>
                No missing source inputs were detected; review is still needed.
              </span>
            </li>
          ) : null}
        </ul>
      </section>

      <section
        aria-label="Codex result feedback authority boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority</span>
        <strong>Read-only candidate material</strong>
        <span style={workplaneCopyStyle}>
          source_of_truth {String(draft.authority_boundary.source_of_truth)};
          can_write_db {String(draft.authority_boundary.can_write_db)};
          can_mutate_memory{" "}
          {String(draft.authority_boundary.can_mutate_memory)};
          can_execute_codex{" "}
          {String(draft.authority_boundary.can_execute_codex)};
          can_send_handoff {String(draft.authority_boundary.can_send_handoff)}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function ExpectedObservedSection({
  draft,
}: {
  draft: CodexResultFeedbackDraft;
}) {
  return (
    <section aria-label="Codex result expected observed summary" style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>expected vs observed</span>
      <p style={workplaneCopyStyle}>
        {draft.expected_observed_delta.mismatch_summary}
      </p>
      <ExpectationList
        title="Missing"
        items={draft.expected_observed_delta.missing_expectations}
      />
    </section>
  );
}

function SkippedChecksSection({
  draft,
}: {
  draft: CodexResultFeedbackDraft;
}) {
  return (
    <section aria-label="Codex result skipped or unverified checks" style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>skipped checks</span>
      <ul style={workplaneListStyle}>
        {draft.expected_observed_delta.skipped_or_unverified_checks
          .slice(0, 5)
          .map((check) => (
            <li key={check} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{check}</span>
            </li>
          ))}
        {draft.expected_observed_delta.skipped_or_unverified_checks.length ===
        0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>
              No skipped checks were explicitly reported.
            </span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function ReuseOutcomeSection({
  draft,
}: {
  draft: CodexResultFeedbackDraft;
}) {
  return (
    <section aria-label="Codex result reuse outcome draft" style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>reuse outcome</span>
      <p style={workplaneCopyStyle}>
        {draft.reuse_outcome_draft.context_helpfulness_summary}
      </p>
      <ReuseRefList
        label="helpful"
        refs={draft.reuse_outcome_draft.helpful_refs}
      />
      <ReuseRefList label="stale" refs={draft.reuse_outcome_draft.stale_refs} />
      <ReuseRefList
        label="missing"
        refs={draft.reuse_outcome_draft.missing_refs}
      />
      <ReuseRefList label="noisy" refs={draft.reuse_outcome_draft.noisy_refs} />
      <ReuseRefList
        label="misleading"
        refs={draft.reuse_outcome_draft.misleading_refs}
      />
      <ReuseRefList
        label="unknown"
        refs={draft.reuse_outcome_draft.unknown_refs}
      />
    </section>
  );
}

function SourceStatusSection({
  draft,
}: {
  draft: CodexResultFeedbackDraft;
}) {
  const sampleFixtureBacked = isSampleFixtureBacked(draft);

  return (
    <section
      aria-label="Codex result feedback source status"
      style={workplaneItemStyle}
    >
      <span style={workplaneBadgeStyle}>
        {sampleFixtureBacked ? "sample fixture preview" : "source status"}
      </span>
      <strong>source status</strong>
      <span style={workplaneCopyStyle}>
        handoff_context_rationale{" "}
        {draft.source_status.handoff_context_rationale};
        codex_result_report {draft.source_status.codex_result_report};
        report_status {draft.source_status.codex_result_report_status}
      </span>
      <span style={workplaneCopyStyle}>
        result report {draft.result_report_refs.result_report_ref ?? "missing"}
      </span>
      <span style={workplaneCopyStyle}>
        report fingerprint{" "}
        {draft.result_report_refs.result_report_fingerprint ?? "missing"}
      </span>
    </section>
  );
}

function isSampleFixtureBacked(draft: CodexResultFeedbackDraft) {
  return (
    draft.result_report_refs.result_report_ref?.includes("sample") === true ||
    draft.result_report_refs.source_refs.some((ref) =>
      ref.includes("codex_result_report_ingestion_v0_1"),
    )
  );
}

function CarryForwardSection({
  draft,
}: {
  draft: CodexResultFeedbackDraft;
}) {
  return (
    <section aria-label="Codex result carry forward suggestions" style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>carry forward</span>
      <p style={workplaneCopyStyle}>
        {draft.carry_forward_suggestions.next_focus_candidate}
      </p>
      <ul style={workplaneListStyle}>
        {draft.carry_forward_suggestions.next_relay_update_suggestions
          .slice(0, 5)
          .map((suggestion) => (
            <li key={suggestion} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{suggestion}</span>
            </li>
          ))}
      </ul>
    </section>
  );
}

function ExpectationList({
  title,
  items,
}: {
  title: string;
  items: CodexResultExpectationItem[];
}) {
  return (
    <section aria-label={`Codex result ${title.toLowerCase()} expectations`}>
      <strong>{title}</strong>
      <ul style={workplaneListStyle}>
        {items.slice(0, 5).map((item) => (
          <li key={item.field} style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{item.field}</span>
            <span style={workplaneCopyStyle}>{item.summary}</span>
          </li>
        ))}
        {items.length === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>No missing expectations.</span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function ReuseRefList({
  label,
  refs,
}: {
  label: string;
  refs: CodexContextReuseRef[];
}) {
  return (
    <section aria-label={`Codex result ${label} context refs`}>
      <strong>
        {label} ({refs.length})
      </strong>
      <ul style={workplaneListStyle}>
        {refs.slice(0, 3).map((ref) => (
          <li key={ref.ref_id} style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{ref.label}</span>
            <span style={workplaneCopyStyle}>{ref.reason_category}</span>
          </li>
        ))}
        {refs.length === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>No refs in this bucket.</span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
