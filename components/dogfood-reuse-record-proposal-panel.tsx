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
  DogfoodReuseRecordProposal,
  DogfoodReuseProposedClassifications,
} from "@/types/dogfood-reuse-record-proposal";
import type { CodexContextReuseRef } from "@/types/codex-result-feedback-draft";
import type { CSSProperties } from "react";

type DogfoodReuseRecordProposalPanelProps = {
  proposal: DogfoodReuseRecordProposal;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

export function DogfoodReuseRecordProposalPanel({
  proposal,
}: DogfoodReuseRecordProposalPanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Dogfood review"
      title="Reuse record proposal"
      ariaLabel="Dogfood reuse record proposal preview"
    >
      <p style={workplaneCopyStyle}>
        Candidate-only preview of what a later operator-reviewed
        dogfood/reuse record could capture. This panel does not write a ledger,
        update metrics, mutate memory, apply Perspective state, call GitHub or
        Codex, or send a handoff.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Status"
          value={proposal.proposal_status}
        />
        <WorkplanePanelMetric
          label="Record kind"
          value={proposal.proposed_record_kind}
        />
        <WorkplanePanelMetric
          label="Blocked"
          value={proposal.blocked_reasons.length}
        />
        <WorkplanePanelMetric
          label="Unknown refs"
          value={proposal.proposed_reuse_classifications.unknown_refs.length}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <ProposalSourceSection proposal={proposal} />
        <ExpectedObservedSection proposal={proposal} />
        <ReuseClassificationsSection
          classifications={proposal.proposed_reuse_classifications}
        />
        <EvidenceSection proposal={proposal} />
      </section>

      <section aria-label="Dogfood proposal operator review checklist" style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>operator review</span>
        <ul style={workplaneListStyle}>
          {proposal.operator_review_checklist.slice(0, 7).map((item) => (
            <li key={item} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Dogfood proposal authority boundary" style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>authority</span>
        <strong>Read-only candidate proposal</strong>
        <span style={workplaneCopyStyle}>
          source_of_truth {String(proposal.authority_boundary.source_of_truth)};
          can_write_dogfood_ledger{" "}
          {String(proposal.authority_boundary.can_write_dogfood_ledger)};
          can_update_metrics{" "}
          {String(proposal.authority_boundary.can_update_metrics)};
          can_mutate_memory{" "}
          {String(proposal.authority_boundary.can_mutate_memory)};
          can_apply_project_perspective{" "}
          {String(proposal.authority_boundary.can_apply_project_perspective)}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function ProposalSourceSection({
  proposal,
}: {
  proposal: DogfoodReuseRecordProposal;
}) {
  return (
    <section aria-label="Dogfood proposal source status" style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>source status</span>
      <strong>{proposal.source_status.feedback_draft} feedback draft</strong>
      <span style={workplaneCopyStyle}>
        codex_result_report {proposal.source_status.codex_result_report};
        handoff_context_rationale{" "}
        {proposal.source_status.handoff_context_rationale}; report_status{" "}
        {proposal.source_status.codex_result_report_status}
      </span>
      <span style={workplaneCopyStyle}>
        result report{" "}
        {proposal.feedback_draft_refs.result_report_ref ?? "missing"}
      </span>
      <span style={workplaneCopyStyle}>
        fingerprint{" "}
        {proposal.feedback_draft_refs.result_report_fingerprint ?? "missing"}
      </span>
    </section>
  );
}

function ExpectedObservedSection({
  proposal,
}: {
  proposal: DogfoodReuseRecordProposal;
}) {
  return (
    <section aria-label="Dogfood proposal expected observed summary" style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>expected vs observed</span>
      <p style={workplaneCopyStyle}>
        {proposal.proposed_expected_observed_summary.mismatch_summary}
      </p>
      <span style={workplaneCopyStyle}>
        matched{" "}
        {proposal.proposed_expected_observed_summary.matched_expectation_count};
        missing{" "}
        {proposal.proposed_expected_observed_summary.missing_expectation_count};
        skipped{" "}
        {
          proposal.proposed_expected_observed_summary
            .skipped_or_unverified_check_count
        }
      </span>
    </section>
  );
}

function ReuseClassificationsSection({
  classifications,
}: {
  classifications: DogfoodReuseProposedClassifications;
}) {
  return (
    <section aria-label="Dogfood proposal reuse classifications" style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>reuse classifications</span>
      <ReuseBucket label="helpful" refs={classifications.helpful_refs} />
      <ReuseBucket label="stale" refs={classifications.stale_refs} />
      <ReuseBucket label="missing" refs={classifications.missing_refs} />
      <ReuseBucket label="noisy" refs={classifications.noisy_refs} />
      <ReuseBucket label="misleading" refs={classifications.misleading_refs} />
      <ReuseBucket label="unknown" refs={classifications.unknown_refs} />
    </section>
  );
}

function EvidenceSection({
  proposal,
}: {
  proposal: DogfoodReuseRecordProposal;
}) {
  const visibleReasons = [
    ...proposal.blocked_reasons,
    ...proposal.insufficient_data_reasons,
  ].slice(0, 6);

  return (
    <section aria-label="Dogfood proposal evidence and blockers" style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>evidence</span>
      <span style={workplaneCopyStyle}>
        has_result_report {String(proposal.evidence_summary.has_result_report)};
        explicit_context_feedback{" "}
        {String(proposal.evidence_summary.has_explicit_context_feedback)};
        insufficient_data{" "}
        {String(proposal.evidence_summary.has_insufficient_data)}
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
              No blockers detected; operator review is still required.
            </span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}

function ReuseBucket({
  label,
  refs,
}: {
  label: string;
  refs: CodexContextReuseRef[];
}) {
  return (
    <section aria-label={`Dogfood proposal ${label} refs`}>
      <strong>
        {label} ({refs.length})
      </strong>
      <ul style={workplaneListStyle}>
        {refs.slice(0, 2).map((ref) => (
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
