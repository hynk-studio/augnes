"use client";

import type {
  ManualResearchNoteParserResult,
  ManualResearchNoteParserWarning,
} from "@/lib/research-candidate-review/manual-note-parser";

type ManualNoteResultSummaryDisplayResult = {
  parser_version: string;
  preview: ManualResearchNoteParserResult["preview"];
  warnings: ManualResearchNoteParserWarning[];
  source: string;
};

type ManualNoteSessionSummaryProps = {
  session: ManualResearchNoteParserResult["preview"]["research_session_preview"];
};

export function ManualNoteResultSummary({
  displayResult,
  parseCount,
}: {
  displayResult: ManualNoteResultSummaryDisplayResult;
  parseCount: number;
}) {
  const { preview } = displayResult;
  const session = preview.research_session_preview;

  return (
    <section
      className="perspective-inspector-section manual-note-result-summary"
      aria-label="Manual note parse result summary"
    >
      <h3>Parse result summary</h3>
      <div className="perspective-workbench-status-row">
        <span>
          candidates{" "}
          <code>
            {session.claim_candidate_count +
              session.evidence_candidate_count +
              session.tension_candidate_count +
              session.knowledge_gap_candidate_count +
              session.perspective_delta_candidate_count +
              session.follow_up_work_candidate_count}
          </code>
        </span>
        <span>
          claims <code>{session.claim_candidate_count}</code>
        </span>
        <span>
          evidence <code>{session.evidence_candidate_count}</code>
        </span>
        <span>
          warnings <code>{displayResult.warnings.length}</code>
        </span>
        <span>
          parser_version <code>{displayResult.parser_version}</code>
        </span>
        <span>
          preview_status <code>{preview.status}</code>
        </span>
        <span>
          source <code>{displayResult.source}</code>
        </span>
        <span>
          local_parse_count <code>{parseCount}</code>
        </span>
      </div>
    </section>
  );
}

export function ManualNoteSessionSummary({ session }: ManualNoteSessionSummaryProps) {
  return (
    <>
      <div className="perspective-formation-summary-grid">
        <div>
          <span>research_session_preview</span>
          <strong>{session.session_id}</strong>
          <small>work_id {session.work_id}</small>
        </div>
        <div>
          <span>research question</span>
          <strong>{session.research_question}</strong>
          <small>review_status {session.review_status}</small>
        </div>
        <div>
          <span>operator intent</span>
          <strong>{session.operator_intent}</strong>
          <small>scope {session.scope}</small>
        </div>
        <div>
          <span>source refs</span>
          <strong>{formatList(session.source_refs)}</strong>
          <small>{session.boundary_notes}</small>
        </div>
      </div>

      <div className="tab-stat-row" aria-label="Manual note parser candidate counts">
        <CandidateCount label="Claims" value={session.claim_candidate_count} />
        <CandidateCount label="Evidence" value={session.evidence_candidate_count} />
        <CandidateCount label="Tensions" value={session.tension_candidate_count} />
        <CandidateCount
          label="Knowledge gaps"
          value={session.knowledge_gap_candidate_count}
        />
        <CandidateCount
          label="Perspective deltas"
          value={session.perspective_delta_candidate_count}
        />
        <CandidateCount
          label="Follow-up work"
          value={session.follow_up_work_candidate_count}
        />
      </div>
    </>
  );
}

function CandidateCount({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function formatList(values: readonly string[]) {
  return values.length > 0 ? values.join(", ") : "none";
}
