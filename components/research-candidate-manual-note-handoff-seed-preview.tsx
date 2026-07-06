"use client";

import { ResearchCandidateManualNoteHandoffResultIntakePanel } from "@/components/research-candidate-manual-note-handoff-result-intake-panel";
import type { ResearchCandidateManualNoteHandoffSeed } from "@/types/research-candidate-manual-note-handoff-seed";

export function ResearchCandidateManualNoteHandoffSeedPreview({
  seed,
}: {
  seed: ResearchCandidateManualNoteHandoffSeed;
}) {
  return (
    <section
      className="perspective-inspector-section manual-note-handoff-seed-preview"
      aria-label="Manual note Codex handoff seed preview"
      data-augnes-authority="candidate-only preview-only copyable-text-only no-execution no-github no-provider no-retrieval no-write"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Codex Handoff Seed</p>
          <h3>Candidate-only handoff seed preview</h3>
          <p>
            Copyable prompt material derived from the visible manual Research
            Candidate Review preview.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">{seed.recommendation_status}</span>
          <span className="status-pill">copyable text only</span>
          <span className="status-pill">no execution</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          source_refs <code>{seed.source_refs.length}</code>
        </span>
        <span>
          claims <code>{seed.selected_claim_candidate_ids.length}</code>
        </span>
        <span>
          evidence <code>{seed.selected_evidence_candidate_ids.length}</code>
        </span>
        <span>
          tensions <code>{seed.unresolved_tension_candidate_ids.length}</code>
        </span>
        <span>
          gaps <code>{seed.knowledge_gap_candidate_ids.length}</code>
        </span>
        <span>
          perspective_deltas <code>{seed.perspective_delta_candidate_ids.length}</code>
        </span>
        <span>
          follow_up <code>{seed.follow_up_work_candidate_ids.length}</code>
        </span>
      </div>

      {seed.unresolved_tension_candidate_ids.length > 0 ||
      seed.knowledge_gap_candidate_ids.length > 0 ? (
        <div className="manual-note-runtime-hint" role="status">
          Unresolved tensions and knowledge gaps are carried into the seed and
          must remain visible in any returned Codex report.
        </div>
      ) : null}

      <div className="perspective-formation-summary-grid">
        <div>
          <span>seed_kind</span>
          <strong>{seed.seed_kind}</strong>
          <small>{seed.seed_version}</small>
        </div>
        <div>
          <span>source preview</span>
          <strong>{seed.source_preview_session_id}</strong>
          <small>draft {seed.source_preview_draft_id ?? "none"}</small>
        </div>
        <div>
          <span>seed fingerprint</span>
          <strong>{seed.seed_fingerprint}</strong>
          <small>{seed.fingerprint_algorithm}</small>
        </div>
        <div>
          <span>validation</span>
          <strong>{seed.validation.passed ? "passed" : "blocked"}</strong>
          <small>
            {seed.validation.failure_codes.length > 0
              ? seed.validation.failure_codes.join(", ")
              : "no failure codes"}
          </small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <section className="cockpit-surface-card">
          <h4>Authority boundary</h4>
          <ul>
            <li>
              candidate_only <code>{String(seed.authority_boundary.candidate_only)}</code>
            </li>
            <li>
              preview_only <code>{String(seed.authority_boundary.preview_only)}</code>
            </li>
            <li>
              source_of_truth <code>{String(seed.authority_boundary.source_of_truth)}</code>
            </li>
            <li>
              can_execute_codex{" "}
              <code>{String(seed.authority_boundary.can_execute_codex)}</code>
            </li>
            <li>
              can_call_github{" "}
              <code>{String(seed.authority_boundary.can_call_github)}</code>
            </li>
            <li>
              can_call_providers_or_openai{" "}
              <code>
                {String(seed.authority_boundary.can_call_providers_or_openai)}
              </code>
            </li>
            <li>
              can_fetch_sources{" "}
              <code>{String(seed.authority_boundary.can_fetch_sources)}</code>
            </li>
            <li>
              can_write_db{" "}
              <code>{String(seed.authority_boundary.can_write_db)}</code>
            </li>
            <li>
              can_promote_perspective{" "}
              <code>
                {String(seed.authority_boundary.can_promote_perspective)}
              </code>
            </li>
          </ul>
        </section>

        <section className="cockpit-surface-card">
          <h4>Expected return report fields</h4>
          <ul>
            {seed.expected_return_report_fields.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </section>
      </div>

      <label htmlFor="research-candidate-manual-note-handoff-seed-prompt">
        copyable_prompt
      </label>
      <textarea
        id="research-candidate-manual-note-handoff-seed-prompt"
        className="manual-note-handoff-seed-copyable-prompt"
        value={seed.copyable_prompt}
        readOnly
        rows={24}
        spellCheck={false}
      />

      <ResearchCandidateManualNoteHandoffResultIntakePanel seed={seed} />
    </section>
  );
}
