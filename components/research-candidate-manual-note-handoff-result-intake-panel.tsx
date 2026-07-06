"use client";

import { buildResearchCandidateManualNoteHandoffResultIntake } from "@/lib/research-candidate-review/manual-note-handoff-result-intake";
import type { ResearchCandidateManualNoteHandoffResultIntake } from "@/types/research-candidate-manual-note-handoff-result-intake";
import type { ResearchCandidateManualNoteHandoffSeed } from "@/types/research-candidate-manual-note-handoff-seed";
import type { FormEvent } from "react";
import { useState } from "react";

export function ResearchCandidateManualNoteHandoffResultIntakePanel({
  seed,
}: {
  seed: ResearchCandidateManualNoteHandoffSeed;
}) {
  const [resultReportText, setResultReportText] = useState("");
  const [intakePreview, setIntakePreview] =
    useState<ResearchCandidateManualNoteHandoffResultIntake | null>(null);
  const reportTextPresent = resultReportText.trim().length > 0;

  function previewResultIntake(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportTextPresent) return;

    setIntakePreview(
      buildResearchCandidateManualNoteHandoffResultIntake({
        handoff_seed: seed,
        codex_result_report_text: resultReportText,
        source_metadata: {
          result_source: "local_paste",
        },
      }),
    );
  }

  function clearResultIntake() {
    setResultReportText("");
    setIntakePreview(null);
  }

  return (
    <section
      className="perspective-inspector-section manual-note-handoff-result-intake-preview"
      aria-label="Manual note handoff result intake preview"
      data-augnes-authority="candidate-only local-preview draft-only no-runtime-action no-write"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Result Intake Draft</p>
          <h3>Candidate-only result intake preview</h3>
          <p>
            Paste the human-returned Codex result report from this handoff seed
            and preview local ExpectedObservedDelta and Reuse Outcome drafts.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">local preview</span>
          <span className="status-pill">draft only</span>
          <span className="status-pill">no record write</span>
        </div>
      </div>

      <form className="observe-form" onSubmit={previewResultIntake}>
        <label htmlFor="research-candidate-manual-note-handoff-result-intake-input">
          Codex result report text
        </label>
        <textarea
          id="research-candidate-manual-note-handoff-result-intake-input"
          value={resultReportText}
          onChange={(event) => setResultReportText(event.target.value)}
          rows={12}
          spellCheck={false}
          placeholder="Paste the returned Codex result report here."
        />
        <div className="form-row">
          <button type="submit" disabled={!reportTextPresent}>
            Preview result intake
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={!reportTextPresent && !intakePreview}
            onClick={clearResultIntake}
          >
            Clear result intake
          </button>
        </div>
        <p className="manual-note-runtime-hint">
          This preview parses pasted text in local React state only. It is not
          an approval, record, durable update, or closure action.
        </p>
      </form>

      {intakePreview ? <ResultIntakeDraftReadout intake={intakePreview} /> : null}
    </section>
  );
}

function ResultIntakeDraftReadout({
  intake,
}: {
  intake: ResearchCandidateManualNoteHandoffResultIntake;
}) {
  return (
    <div className="perspective-detail-stack">
      <div className="perspective-workbench-status-row">
        <span>
          status <code>{intake.recommendation_status}</code>
        </span>
        <span>
          changed_files <code>{intake.changed_files.length}</code>
        </span>
        <span>
          verification <code>{intake.verification_items.length}</code>
        </span>
        <span>
          skipped <code>{intake.skipped_checks.length}</code>
        </span>
        <span>
          missing_return_fields{" "}
          <code>{intake.missing_required_return_fields.length}</code>
        </span>
      </div>

      <div className="perspective-formation-summary-grid">
        <div>
          <span>result_text_fingerprint</span>
          <strong>{intake.result_text_fingerprint}</strong>
          <small>{intake.fingerprint_algorithm}</small>
        </div>
        <div>
          <span>source_handoff_seed</span>
          <strong>{intake.source_handoff_seed_fingerprint}</strong>
          <small>{intake.source_preview_session_id}</small>
        </div>
        <div>
          <span>validation</span>
          <strong>{intake.validation.passed ? "passed" : "blocked"}</strong>
          <small>
            {intake.validation.failure_codes.length > 0
              ? intake.validation.failure_codes.join(", ")
              : "no failure codes"}
          </small>
        </div>
        <div>
          <span>reuse_outcome</span>
          <strong>{intake.reuse_outcome_draft.outcome_label}</strong>
          <small>
            {intake.reuse_outcome_draft.warning_reasons.length > 0
              ? intake.reuse_outcome_draft.warning_reasons.join(", ")
              : "reported"}
          </small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <section className="cockpit-surface-card">
          <h4>Expected vs observed delta draft</h4>
          <dl>
            <dt>status</dt>
            <dd>{intake.expected_observed_delta_draft.status}</dd>
            <dt>expected_summary</dt>
            <dd>{intake.expected_observed_delta_draft.expected_summary}</dd>
            <dt>observed_summary</dt>
            <dd>
              {intake.expected_observed_delta_draft.observed_summary ??
                "not reported"}
            </dd>
            <dt>mismatch_or_gap_summary</dt>
            <dd>{intake.expected_observed_delta_draft.mismatch_or_gap_summary}</dd>
          </dl>
        </section>

        <section className="cockpit-surface-card">
          <h4>Reuse outcome draft</h4>
          <dl>
            <dt>outcome_label</dt>
            <dd>{intake.reuse_outcome_draft.outcome_label}</dd>
            <dt>selected_candidate_context_refs</dt>
            <dd>{intake.reuse_outcome_draft.selected_candidate_context_refs.length}</dd>
            <dt>source_line</dt>
            <dd>{intake.reuse_outcome_draft.source_line ?? "not reported"}</dd>
          </dl>
        </section>

        <section className="cockpit-surface-card">
          <h4>Return field coverage</h4>
          <ul>
            {intake.expected_return_field_coverage.map((field) => (
              <li key={field.field}>
                {field.field} <code>{field.present ? "present" : "missing"}</code>
              </li>
            ))}
          </ul>
        </section>

        <section className="cockpit-surface-card">
          <h4>Missing return fields</h4>
          {intake.missing_required_return_fields.length > 0 ? (
            <ul>
              {intake.missing_required_return_fields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          ) : (
            <p>All expected return fields are present.</p>
          )}
        </section>

        <section className="cockpit-surface-card">
          <h4>Warning reasons</h4>
          {intake.warning_reasons.length > 0 ? (
            <ul>
              {intake.warning_reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p>No warning reasons reported.</p>
          )}
        </section>
      </div>

      <section className="perspective-inspector-section">
        <h4>Authority boundary flags</h4>
        <div className="perspective-workbench-status-row">
          {Object.entries(intake.authority_boundary).map(([key, value]) => (
            <span key={key}>
              {key} <code>{String(value)}</code>
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
