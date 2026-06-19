"use client";

import { parseManualResearchNoteToPreview } from "@/lib/research-candidate-review/manual-note-parser";
import type {
  ManualResearchNoteParserResult,
  ManualResearchNoteParserWarning,
} from "@/lib/research-candidate-review/manual-note-parser";
import type {
  ClaimCandidate,
  EvidenceCandidate,
  FollowUpWorkCandidate,
  KnowledgeGapCandidate,
  PerspectiveDeltaCandidate,
  ResearchCandidateReviewAuthority,
  SourceReferencePreview,
  TensionCandidate,
} from "@/types/research-candidate-review";
import type { FormEvent } from "react";
import { useState } from "react";

const MANUAL_NOTE_PLACEHOLDER = [
  "Research Question: What should the operator review?",
  "Operator Intent: Inspect candidate-only research material.",
  "Source Title: Manual source title",
  "Source Origin: operator note",
  "Source Identifier: local-note",
  "Claim: Candidate claim text.",
  "Evidence: supporting source-bound note.",
  "Tension: What remains uncertain?",
  "Gap: Missing context. next: source A, source B",
  "Perspective Delta: Refine the candidate review frame.",
  "Next: Review the candidate list before any separate work.",
].join("\n");

const AUTHORITY_BOUNDARY_COPY = [
  "Parser execution is local only.",
  "Output is read-only preview material.",
  "No network, no API route, no DB, no persistence, no durable candidate/review/receipt storage.",
  "No promotion/reject/defer workflow.",
  "No proof/evidence writes.",
  "No work item creation.",
  "No provider/OpenAI calls.",
  "No retrieval/RAG/source fetching.",
  "No Codex execution or external handoff sending.",
];

export function ResearchCandidateManualNotePreviewPanel() {
  const [manualNoteText, setManualNoteText] = useState("");
  const [parserResult, setParserResult] =
    useState<ManualResearchNoteParserResult | null>(null);
  const [parseCount, setParseCount] = useState(0);

  const inputHasText = manualNoteText.trim().length > 0;

  function parseManualNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!inputHasText) return;

    setParserResult(parseManualResearchNoteToPreview(manualNoteText));
    setParseCount((currentCount) => currentCount + 1);
  }

  function clearManualNote() {
    setManualNoteText("");
    setParserResult(null);
    setParseCount(0);
  }

  const preview = parserResult?.preview ?? null;
  const session = preview?.research_session_preview ?? null;

  return (
    <section
      className="perspective-section"
      id="research-candidate-manual-note-preview-panel"
      aria-label="Manual pasted note local parser preview"
      data-augnes-authority="local-only read-only preview-only candidate-only manual-parser"
      data-augnes-parser-execution="local-only"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Research</p>
          <h2>Cockpit Manual Pasted Note Preview</h2>
          <p>
            Paste a bounded manual research note, run the deterministic local
            parser, and inspect candidate-only Research Candidate Review preview
            output.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">local parser</span>
          <span className="status-pill">read-only preview</span>
          <span className="status-pill">candidate-only</span>
        </div>
      </div>

      <form className="observe-form" onSubmit={parseManualNote}>
        <label htmlFor="research-candidate-manual-note-input">
          Manual note text
        </label>
        <textarea
          id="research-candidate-manual-note-input"
          value={manualNoteText}
          onChange={(event) => setManualNoteText(event.target.value)}
          rows={10}
          placeholder={MANUAL_NOTE_PLACEHOLDER}
          spellCheck={false}
          aria-describedby="research-candidate-manual-note-boundary"
        />
        <div className="form-row">
          <button type="submit" disabled={!inputHasText}>
            Parse local note
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={!manualNoteText && !parserResult}
            onClick={clearManualNote}
          >
            Clear
          </button>
        </div>
      </form>

      <section
        className="perspective-inspector-section"
        id="research-candidate-manual-note-boundary"
      >
        <h3>Authority boundary</h3>
        <ul className="boundary-list">
          {AUTHORITY_BOUNDARY_COPY.map((boundary) => (
            <li key={boundary}>{boundary}</li>
          ))}
        </ul>
      </section>

      {parserResult && preview && session ? (
        <div className="perspective-detail-stack">
          <div className="perspective-workbench-status-row">
            <span>
              parser_version <code>{parserResult.parser_version}</code>
            </span>
            <span>
              preview_version <code>{preview.preview_version}</code>
            </span>
            <span>
              scope <code>{preview.scope}</code>
            </span>
            <span>
              status <code>{preview.status}</code>
            </span>
            <span>
              warnings <code>{parserResult.warnings.length}</code>
            </span>
            <span>
              local_parse_count <code>{parseCount}</code>
            </span>
          </div>

          <BooleanFlagGrid title="Parser authority" flags={parserResult.authority} />
          <BooleanFlagGrid title="Preview authority" flags={preview.authority} />

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

          <div
            className="tab-stat-row"
            aria-label="Manual note parser candidate counts"
          >
            <CandidateCount label="Claims" value={session.claim_candidate_count} />
            <CandidateCount
              label="Evidence"
              value={session.evidence_candidate_count}
            />
            <CandidateCount
              label="Tensions"
              value={session.tension_candidate_count}
            />
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

          <div className="perspective-constellation-workspace-grid">
            <ParserWarningsList warnings={parserResult.warnings} />
            <SourceReferenceList sources={preview.source_reference_previews} />
            <ClaimCandidateList candidates={preview.claim_candidates} />
            <EvidenceCandidateList candidates={preview.evidence_candidates} />
            <TensionCandidateList candidates={preview.tension_candidates} />
            <KnowledgeGapCandidateList
              candidates={preview.knowledge_gap_candidates}
            />
            <PerspectiveDeltaCandidateList
              candidates={preview.perspective_delta_candidates}
            />
            <FollowUpWorkCandidateList
              candidates={preview.follow_up_work_candidates}
            />
          </div>
        </div>
      ) : (
        <section className="perspective-inspector-section">
          <h3>Preview output</h3>
          <p>
            Parser output appears here after local parsing. No parser result has
            been created for this pasted note yet.
          </p>
        </section>
      )}
    </section>
  );
}

function BooleanFlagGrid({
  title,
  flags,
}: {
  title: string;
  flags:
    | ManualResearchNoteParserResult["authority"]
    | ResearchCandidateReviewAuthority;
}) {
  return (
    <section className="perspective-inspector-section">
      <h3>{title}</h3>
      <div className="perspective-workbench-status-row">
        {Object.entries(flags).map(([key, value]) => (
          <span key={key}>
            {key} <code>{String(value)}</code>
          </span>
        ))}
      </div>
    </section>
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

function ParserWarningsList({
  warnings,
}: {
  warnings: ManualResearchNoteParserWarning[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h3>warnings</h3>
      {warnings.length === 0 ? (
        <p>No parser warnings.</p>
      ) : (
        <ul>
          {warnings.map((warning) => (
            <li key={`${warning.code}:${warning.line ?? "none"}`}>
              <code>{warning.code}</code> {warning.message}
              {warning.line ? <small> line {warning.line}</small> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SourceReferenceList({
  sources,
}: {
  sources: SourceReferencePreview[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h3>source_reference_previews</h3>
      {sources.length === 0 ? (
        <p>No source refs parsed.</p>
      ) : (
        sources.map((source) => (
          <article key={source.source_ref_id} className="cockpit-surface-card">
            <div className="meta-row">
              <span>
                source_ref_id <code>{source.source_ref_id}</code>
              </span>
              <span>
                review_status <code>{source.review_status}</code>
              </span>
            </div>
            <h4>{source.title}</h4>
            <p>{source.operator_note_summary}</p>
            <ul>
              <li>
                authors_or_origin <code>{source.authors_or_origin}</code>
              </li>
              <li>
                identifier_or_url <code>{source.identifier_or_url}</code>
              </li>
              <li>
                reference_source <code>{source.reference_source}</code>
              </li>
              <li>
                source_status <code>{source.source_status}</code>
              </li>
              <li>{source.boundary_notes}</li>
            </ul>
          </article>
        ))
      )}
    </section>
  );
}

function ClaimCandidateList({ candidates }: { candidates: ClaimCandidate[] }) {
  return (
    <section className="perspective-inspector-section">
      <h3>claim_candidates</h3>
      {candidates.length === 0 ? (
        <p>No claim candidates parsed.</p>
      ) : (
        candidates.map((candidate) => (
          <article
            key={candidate.claim_candidate_id}
            className="cockpit-surface-card"
          >
            <CandidateMeta
              idLabel="claim_candidate_id"
              id={candidate.claim_candidate_id}
              reviewStatus={candidate.review_status}
              epistemicStatus={candidate.epistemic_status}
              sourceRefs={formatCandidateSourceRefs(candidate)}
            />
            <p>{candidate.claim_text}</p>
            <ul>
              <li>
                claim_type <code>{candidate.claim_type}</code>
              </li>
              <li>
                confidence_label <code>{candidate.confidence_label}</code>
              </li>
              <li>
                supporting_evidence_candidate_ids{" "}
                <code>{formatList(candidate.supporting_evidence_candidate_ids)}</code>
              </li>
              <li>
                contradicting_evidence_candidate_ids{" "}
                <code>
                  {formatList(candidate.contradicting_evidence_candidate_ids)}
                </code>
              </li>
              <li>{candidate.boundary_notes}</li>
            </ul>
          </article>
        ))
      )}
    </section>
  );
}

function EvidenceCandidateList({
  candidates,
}: {
  candidates: EvidenceCandidate[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h3>evidence_candidates</h3>
      {candidates.length === 0 ? (
        <p>No evidence candidates parsed.</p>
      ) : (
        candidates.map((candidate) => (
          <article
            key={candidate.evidence_candidate_id}
            className="cockpit-surface-card"
          >
            <CandidateMeta
              idLabel="evidence_candidate_id"
              id={candidate.evidence_candidate_id}
              reviewStatus={candidate.review_status}
              epistemicStatus={candidate.epistemic_status}
              sourceRefs={formatCandidateSourceRefs(candidate)}
            />
            <p>{candidate.evidence_summary}</p>
            <ul>
              <li>
                claim_candidate_id <code>{candidate.claim_candidate_id}</code>
              </li>
              <li>
                evidence_role <code>{candidate.evidence_role}</code>
              </li>
              <li>
                locator <code>{candidate.locator}</code>
              </li>
              <li>{candidate.quality_note}</li>
              <li>{candidate.boundary_notes}</li>
            </ul>
          </article>
        ))
      )}
    </section>
  );
}

function TensionCandidateList({
  candidates,
}: {
  candidates: TensionCandidate[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h3>tension_candidates</h3>
      {candidates.length === 0 ? (
        <p>No tension candidates parsed.</p>
      ) : (
        candidates.map((candidate) => (
          <article
            key={candidate.tension_candidate_id}
            className="cockpit-surface-card"
          >
            <CandidateMeta
              idLabel="tension_candidate_id"
              id={candidate.tension_candidate_id}
              reviewStatus={candidate.review_status}
              epistemicStatus={candidate.epistemic_status}
              sourceRefs={formatCandidateSourceRefs(candidate)}
            />
            <p>{candidate.summary}</p>
            <ul>
              <li>
                tension_type <code>{candidate.tension_type}</code>
              </li>
              <li>
                related_claim_candidate_ids{" "}
                <code>{formatList(candidate.related_claim_candidate_ids)}</code>
              </li>
              <li>
                related_evidence_candidate_ids{" "}
                <code>{formatList(candidate.related_evidence_candidate_ids)}</code>
              </li>
              <li>{candidate.operator_question}</li>
              <li>
                blocks_or_qualifies_promotion{" "}
                <code>{String(candidate.blocks_or_qualifies_promotion)}</code>
              </li>
              <li>{candidate.boundary_notes}</li>
            </ul>
          </article>
        ))
      )}
    </section>
  );
}

function KnowledgeGapCandidateList({
  candidates,
}: {
  candidates: KnowledgeGapCandidate[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h3>knowledge_gap_candidates</h3>
      {candidates.length === 0 ? (
        <p>No knowledge gap candidates parsed.</p>
      ) : (
        candidates.map((candidate) => (
          <article
            key={candidate.knowledge_gap_candidate_id}
            className="cockpit-surface-card"
          >
            <CandidateMeta
              idLabel="knowledge_gap_candidate_id"
              id={candidate.knowledge_gap_candidate_id}
              reviewStatus={candidate.review_status}
              epistemicStatus={candidate.epistemic_status}
              sourceRefs={formatCandidateSourceRefs(candidate)}
            />
            <p>{candidate.summary}</p>
            <ul>
              <li>{candidate.why_it_matters}</li>
              <li>
                related_claim_candidate_ids{" "}
                <code>{formatList(candidate.related_claim_candidate_ids)}</code>
              </li>
              <li>
                related_tension_candidate_ids{" "}
                <code>{formatList(candidate.related_tension_candidate_ids)}</code>
              </li>
              <li>
                suggested_next_reading{" "}
                <code>{formatList(candidate.suggested_next_reading)}</code>
              </li>
              <li>{candidate.boundary_notes}</li>
            </ul>
          </article>
        ))
      )}
    </section>
  );
}

function PerspectiveDeltaCandidateList({
  candidates,
}: {
  candidates: PerspectiveDeltaCandidate[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h3>perspective_delta_candidates</h3>
      {candidates.length === 0 ? (
        <p>No perspective delta candidates parsed.</p>
      ) : (
        candidates.map((candidate) => (
          <article
            key={candidate.perspective_delta_candidate_id}
            className="cockpit-surface-card"
          >
            <CandidateMeta
              idLabel="perspective_delta_candidate_id"
              id={candidate.perspective_delta_candidate_id}
              reviewStatus={candidate.review_status}
              epistemicStatus={candidate.epistemic_status}
              sourceRefs={formatCandidateSourceRefs(candidate)}
            />
            <p>{candidate.proposed_update_summary}</p>
            <ul>
              <li>
                target_perspective_key{" "}
                <code>{candidate.target_perspective_key}</code>
              </li>
              <li>
                delta_type <code>{candidate.delta_type}</code>
              </li>
              <li>
                promotion_readiness <code>{candidate.promotion_readiness}</code>
              </li>
              <li>{candidate.before_summary}</li>
              <li>{candidate.after_summary}</li>
              <li>
                basis_claim_candidate_ids{" "}
                <code>{formatList(candidate.basis_claim_candidate_ids)}</code>
              </li>
              <li>
                basis_evidence_candidate_ids{" "}
                <code>{formatList(candidate.basis_evidence_candidate_ids)}</code>
              </li>
              <li>
                related_tension_candidate_ids{" "}
                <code>{formatList(candidate.related_tension_candidate_ids)}</code>
              </li>
              <li>
                related_gap_candidate_ids{" "}
                <code>{formatList(candidate.related_gap_candidate_ids)}</code>
              </li>
              <li>{candidate.risk_or_conflict_note}</li>
              <li>{candidate.boundary_notes}</li>
            </ul>
          </article>
        ))
      )}
    </section>
  );
}

function FollowUpWorkCandidateList({
  candidates,
}: {
  candidates: FollowUpWorkCandidate[];
}) {
  return (
    <section className="perspective-inspector-section">
      <h3>follow_up_work_candidates</h3>
      {candidates.length === 0 ? (
        <p>No follow-up work candidates parsed.</p>
      ) : (
        candidates.map((candidate) => (
          <article
            key={candidate.follow_up_work_candidate_id}
            className="cockpit-surface-card"
          >
            <div className="meta-row">
              <span>
                follow_up_work_candidate_id{" "}
                <code>{candidate.follow_up_work_candidate_id}</code>
              </span>
              <span>
                candidate_scope <code>{candidate.candidate_scope}</code>
              </span>
              <span>
                review_status <code>{candidate.review_status}</code>
              </span>
            </div>
            <h4>{candidate.candidate_title}</h4>
            <p>{candidate.candidate_summary}</p>
            <ul>
              <li>{candidate.reason}</li>
              <li>
                suggested_expected_files{" "}
                <code>{formatList(candidate.suggested_expected_files)}</code>
              </li>
              <li>
                suggested_expected_checks{" "}
                <code>{formatList(candidate.suggested_expected_checks)}</code>
              </li>
              <li>{candidate.boundary_notes}</li>
            </ul>
          </article>
        ))
      )}
    </section>
  );
}

function CandidateMeta({
  idLabel,
  id,
  reviewStatus,
  epistemicStatus,
  sourceRefs,
}: {
  idLabel: string;
  id: string;
  reviewStatus: string;
  epistemicStatus: string;
  sourceRefs: string;
}) {
  return (
    <div className="meta-row">
      <span>
        {idLabel} <code>{id}</code>
      </span>
      <span>
        review_status <code>{reviewStatus}</code>
      </span>
      <span>
        epistemic_status <code>{epistemicStatus}</code>
      </span>
      <span>
        source_refs <code>{sourceRefs}</code>
      </span>
    </div>
  );
}

function formatCandidateSourceRefs(candidate: {
  source_ref_id?: string;
  source_refs?: string[];
}) {
  return formatList(
    candidate.source_refs ??
      (candidate.source_ref_id ? [candidate.source_ref_id] : []),
  );
}

function formatList(values: readonly string[]) {
  return values.length > 0 ? values.join(", ") : "none";
}
