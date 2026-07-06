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
  ResidualDiagnosticCandidate,
  ResidualDiagnosticCandidateReadModel,
} from "@/types/residual-diagnostic-candidate";
import type { CSSProperties } from "react";

type ResidualDiagnosticCandidatePanelProps = {
  readModel: ResidualDiagnosticCandidateReadModel;
};

const sectionGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
  gap: "10px",
  minWidth: 0,
};

const itemHeaderStyle: CSSProperties = {
  display: "flex",
  gap: "8px",
  alignItems: "baseline",
  justifyContent: "space-between",
  flexWrap: "wrap",
  minWidth: 0,
};

export function ResidualDiagnosticCandidatePanel({
  readModel,
}: ResidualDiagnosticCandidatePanelProps) {
  return (
    <WorkplanePanelShell
      kicker="Diagnostic candidates"
      title="Residual Diagnostic Candidates"
      ariaLabel="Residual Diagnostic Candidate Layer panel"
    >
      <p style={workplaneCopyStyle}>
        Read-only residual candidate layer over existing Workbench, dogfood, and
        handoff spine material. It separates ordinary missing prerequisites from
        materialized inconsistency and proposes verification targets without
        writing records, creating routes, sending handoff, or calling providers.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Diagnostic status"
          value={readModel.dashboard_status}
        />
        <WorkplanePanelMetric
          label="Next hardening target"
          value={readModel.candidate_summary.recommended_next_hardening_target}
        />
        <WorkplanePanelMetric
          label="Actionable"
          value={readModel.candidate_summary.actionable_candidate_count}
        />
        <WorkplanePanelMetric
          label="Materialized inconsistency"
          value={readModel.candidate_summary.materialized_inconsistency_count}
        />
      </WorkplanePanelMetricGrid>

      <section style={sectionGridStyle}>
        <ReasonList
          title="ordinary missing"
          items={readModel.ordinary_missing_prerequisites}
          emptyText="No ordinary missing prerequisites are visible."
        />
        <ReasonList
          title="materialized inconsistency"
          items={readModel.materialized_inconsistencies}
          emptyText="No materialized inconsistencies are visible."
        />
        <ReasonList
          title="insufficient data"
          items={readModel.insufficient_data}
          emptyText="No residual diagnostic data gaps are visible."
        />
      </section>

      <section
        aria-label="Residual diagnostic candidate list"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>candidates</span>
        <ul style={workplaneListStyle}>
          {readModel.residual_candidates.length === 0 ? (
            <li style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>
                No residual candidates have enough signal yet.
              </span>
            </li>
          ) : null}
          {readModel.residual_candidates.map((candidate) => (
            <CandidateItem key={candidate.candidate_id} candidate={candidate} />
          ))}
        </ul>
      </section>

      <section
        aria-label="Residual diagnostic authority boundary"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>authority boundary</span>
        <span style={workplaneCopyStyle}>
          read_only {String(readModel.authority_boundary.read_only)};
          advisory_only {String(readModel.authority_boundary.advisory_only)};
          candidate_layer_only{" "}
          {String(readModel.authority_boundary.candidate_layer_only)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_db {String(readModel.authority_boundary.can_write_db)};
          can_create_route{" "}
          {String(readModel.authority_boundary.can_create_route)};
          can_send_handoff{" "}
          {String(readModel.authority_boundary.can_send_handoff)}
        </span>
        <span style={workplaneCopyStyle}>
          can_call_send_provider{" "}
          {String(readModel.authority_boundary.can_call_send_provider)};
          can_call_email {String(readModel.authority_boundary.can_call_email)};
          can_call_slack {String(readModel.authority_boundary.can_call_slack)};
          can_call_webhook{" "}
          {String(readModel.authority_boundary.can_call_webhook)}
        </span>
        <span style={workplaneCopyStyle}>
          can_write_clipboard{" "}
          {String(readModel.authority_boundary.can_write_clipboard)};
          can_download_file{" "}
          {String(readModel.authority_boundary.can_download_file)};
          can_write_memory{" "}
          {String(readModel.authority_boundary.can_write_memory)}
        </span>
      </section>
    </WorkplanePanelShell>
  );
}

function CandidateItem({
  candidate,
}: {
  candidate: ResidualDiagnosticCandidate;
}) {
  return (
    <li style={workplaneItemStyle}>
      <div style={itemHeaderStyle}>
        <strong>{candidate.label}</strong>
        <span style={workplaneBadgeStyle}>{candidate.status}</span>
      </div>
      <span style={workplaneCopyStyle}>
        {candidate.category}; severity {candidate.severity}; confidence{" "}
        {candidate.confidence}; signals {candidate.source_signal_count};
        repeated {candidate.repeated_evidence_count}
      </span>
      <span style={workplaneCopyStyle}>{candidate.summary}</span>
      <span style={workplaneCopyStyle}>
        false_leap_contrast {candidate.false_leap_contrast}
      </span>
      <ReasonList
        title="minimum verification"
        items={candidate.minimum_verification}
        emptyText="No minimum verification was materialized."
      />
      <ReasonList
        title="observed signals"
        items={candidate.observed_signals
          .slice(0, 4)
          .map((signal) => signal.summary)}
        emptyText="No observed signals were materialized."
      />
    </li>
  );
}

function ReasonList({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: string[];
  emptyText: string;
}) {
  const visibleItems = items.slice(0, 6);
  return (
    <section aria-label={`Residual diagnostic ${title}`} style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>{title}</span>
      <ul style={workplaneListStyle}>
        {visibleItems.map((item) => (
          <li key={item} style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{item}</span>
          </li>
        ))}
        {visibleItems.length === 0 ? (
          <li style={workplaneItemStyle}>
            <span style={workplaneCopyStyle}>{emptyText}</span>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
