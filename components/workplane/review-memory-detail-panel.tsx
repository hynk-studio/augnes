import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import type { AgentWorkplaneNodeStatus } from "@/types/agent-workplane-node";
import type {
  WorkplaneReviewMemoryCandidate,
  WorkplaneReviewMemoryDetailRead,
  WorkplaneReviewMemoryStatus,
} from "@/types/workplane-review-memory-detail";
import type { ReactNode } from "react";

export function ReviewMemoryDetailPanel({
  read,
}: {
  read: WorkplaneReviewMemoryDetailRead;
}) {
  return (
    <div data-workplane-review-memory-detail-panel="v0.1">
      <WorkplanePanelShell
        kicker="Review / memory proposal detail"
        title="Review memory detail"
        ariaLabel="Review and memory proposal detail panel"
        panelId="review_memory_detail"
        nodeId="authority_validation_debug"
        nodeKind="debug_context_source"
        nodeStatus={nodeStatusForReviewMemory(read.status)}
      >
        <p style={workplaneCopyStyle}>
          Review / memory proposal detail is read-only review/memory proposal
          visibility, not apply authority and not shrink authority. It keeps
          durable memory review, Perspective review, validation required,
          needs user judgment, source refs, no durable memory apply, no
          Perspective apply, and legacy compatibility retained visible while
          native absorption remains review-gated.
        </p>

        <WorkplanePanelMetricGrid>
          <WorkplanePanelMetric label="Attention refs" value={read.queue_summary.total_attention_count} />
          <WorkplanePanelMetric label="Durable memory" value={read.queue_summary.durable_memory_review_count} />
          <WorkplanePanelMetric label="Perspective" value={read.queue_summary.project_perspective_review_count} />
          <WorkplanePanelMetric label="User decisions" value={read.queue_summary.user_decision_count} />
        </WorkplanePanelMetricGrid>

        <Section title="Queue summary">
          <li style={workplaneItemStyle}>
            <strong>Review lanes</strong>
            <span style={workplaneCopyStyle}>
              needs review {read.queue_summary.needs_review_count}; blocked{" "}
              {read.queue_summary.blocked_count}; manual review{" "}
              {read.queue_summary.manual_review_count}; validation required{" "}
              {read.queue_summary.validation_required_count}; Perspective
              review {read.queue_summary.project_perspective_review_count};
              durable memory review{" "}
              {read.queue_summary.durable_memory_review_count}; user decision{" "}
              {read.queue_summary.user_decision_count}.
            </span>
          </li>
          <li style={workplaneItemStyle}>
            <strong>Queue notes</strong>
            <span style={workplaneCopyStyle}>
              {read.queue_summary.notes.join(" ") || "none materialized"}
            </span>
          </li>
        </Section>

        <CandidateSection
          title="Durable memory review candidates"
          candidates={read.durable_memory_review_candidates}
        />
        <CandidateSection
          title="Perspective update candidates"
          candidates={read.perspective_update_candidates}
        />
        <CandidateSection
          title="Validation-required candidates"
          candidates={read.validation_required_candidates}
        />
        <CandidateSection
          title="User decision candidates"
          candidates={read.user_decision_candidates}
        />
        <CandidateSection title="Blocked candidates" candidates={read.blocked_candidates} />

        <Section title="Candidate source refs">
          {read.candidates.slice(0, 10).map((candidate) => (
            <li key={`${candidate.candidate_id}:refs`} style={workplaneItemStyle}>
              <span style={workplaneBadgeStyle}>{candidate.lane}</span>
              <strong>{candidate.title}</strong>
              <span style={workplaneCopyStyle}>
                source refs: {candidate.source_refs.slice(0, 6).join("; ") ||
                  "none materialized"}.
              </span>
              <span style={workplaneCopyStyle}>
                evidence refs: {candidate.evidence_refs.join(", ") || "none"};
                artifact refs: {candidate.artifact_refs.join(", ") || "none"};
                handoff refs: {candidate.handoff_refs.join(", ") || "none"}.
              </span>
            </li>
          ))}
        </Section>

        <Section title="Gap details">
          {read.gap_details.map((gap) => (
            <li key={gap.gap_id} style={workplaneItemStyle}>
              <span style={workplaneBadgeStyle}>{gap.status}</span>
              <strong>{gap.gap_id}</strong>
              <span style={workplaneCopyStyle}>{gap.summary}</span>
              <span style={workplaneCopyStyle}>Next: {gap.required_next_step}</span>
            </li>
          ))}
        </Section>

        <Section title="Authority boundary">
          {read.authority_boundary.notes.map((note) => (
            <li key={note} style={workplaneItemStyle}>
              <span style={workplaneCopyStyle}>{note}</span>
            </li>
          ))}
        </Section>

        <p style={workplaneCopyStyle}>
          Status: {read.status}. Review/memory detail is visibility only and
          not apply authority. Browser regression, metrics, and dogfood are
          evidence/signals, not shrink authority. Fallback notes:{" "}
          {read.fallback_notes.join(" ") || "none"}.
        </p>
      </WorkplanePanelShell>
    </div>
  );
}

function CandidateSection({
  title,
  candidates,
}: {
  title: string;
  candidates: WorkplaneReviewMemoryCandidate[];
}) {
  return (
    <Section title={title}>
      {candidates.map((candidate) => (
        <li key={candidate.candidate_id} style={workplaneItemStyle}>
          <span style={workplaneBadgeStyle}>{candidate.status}</span>
          <strong>{candidate.title}</strong>
          <span style={workplaneCopyStyle}>
            {candidate.candidate_kind} in {candidate.lane}; delta{" "}
            {candidate.delta_id ?? "none materialized"}.
          </span>
          <span style={workplaneCopyStyle}>{candidate.summary}</span>
          <span style={workplaneCopyStyle}>
            merge policy: {candidate.merge_policy_summary ?? "none materialized"}.
          </span>
          <span style={workplaneCopyStyle}>
            needs user judgment:{" "}
            {candidate.needs_user_judgment.join(" ") || "none materialized"}.
          </span>
          <span style={workplaneCopyStyle}>
            non-goals: {candidate.non_goals.join(" ") || "none materialized"}.
          </span>
        </li>
      ))}
    </Section>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-label={title} style={{ display: "grid", gap: "6px", minWidth: 0 }}>
      <h3 style={{ margin: 0, fontSize: "0.82rem", color: "#0f172a" }}>
        {title}
      </h3>
      <ul style={workplaneListStyle}>{children}</ul>
    </section>
  );
}

function nodeStatusForReviewMemory(
  status: WorkplaneReviewMemoryStatus,
): AgentWorkplaneNodeStatus {
  if (status === "ready") return "ready";
  if (status === "fallback") return "fallback";
  if (status === "empty" || status === "insufficient_data") {
    return "not_materialized";
  }
  return "partial";
}
