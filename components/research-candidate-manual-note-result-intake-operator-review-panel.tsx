"use client";

import { buildResearchCandidateManualNoteResultIntakeOperatorReview } from "@/lib/research-candidate-review/manual-note-result-intake-operator-review";
import { buildResearchCandidateManualNoteResultRecordContractPreview } from "@/lib/research-candidate-review/manual-note-result-record-contract-preview";
import { ResearchCandidateManualNoteAuthorizedRecordWritePanel } from "@/components/research-candidate-manual-note-authorized-record-write-panel";
import type { ResearchCandidateManualNoteHandoffResultIntake } from "@/types/research-candidate-manual-note-handoff-result-intake";
import type {
  ResearchCandidateManualNoteResultIntakeOperatorDecision,
  ResearchCandidateManualNoteResultIntakeOperatorReview,
} from "@/types/research-candidate-manual-note-result-intake-operator-review";
import type { ResearchCandidateManualNoteResultRecordContractPreview } from "@/types/research-candidate-manual-note-result-record-contract-preview";
import type { FormEvent } from "react";
import { useState } from "react";

const operatorDecisionOptions: Array<{
  value: ResearchCandidateManualNoteResultIntakeOperatorDecision;
  label: string;
}> = [
  {
    value: "prepare_record_contract_preview",
    label: "Prepare record contract preview",
  },
  {
    value: "needs_more_result_detail",
    label: "Needs more result detail",
  },
  {
    value: "reject_result_intake_preview",
    label: "Reject preview",
  },
  {
    value: "defer_result_intake_preview",
    label: "Defer preview",
  },
];

export function ResearchCandidateManualNoteResultIntakeOperatorReviewPanel({
  resultIntake,
}: {
  resultIntake: ResearchCandidateManualNoteHandoffResultIntake;
}) {
  const [operatorDecision, setOperatorDecision] =
    useState<ResearchCandidateManualNoteResultIntakeOperatorDecision>(
      "prepare_record_contract_preview",
    );
  const [operatorNotes, setOperatorNotes] = useState("");
  const [operatorReview, setOperatorReview] =
    useState<ResearchCandidateManualNoteResultIntakeOperatorReview | null>(null);
  const [recordContractPreview, setRecordContractPreview] =
    useState<ResearchCandidateManualNoteResultRecordContractPreview | null>(
      null,
    );

  function previewOperatorReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const review = buildResearchCandidateManualNoteResultIntakeOperatorReview({
      result_intake: resultIntake,
      operator_decision: operatorDecision,
      operator_notes: operatorNotes,
    });
    setOperatorReview(review);
    setRecordContractPreview(
      review.selected_operator_decision === "prepare_record_contract_preview" &&
        review.review_status === "ready_for_record_contract_preview"
        ? buildResearchCandidateManualNoteResultRecordContractPreview({
            result_intake: resultIntake,
            operator_review: review,
          })
        : null,
    );
  }

  function clearOperatorReview() {
    setOperatorDecision("prepare_record_contract_preview");
    setOperatorNotes("");
    setOperatorReview(null);
    setRecordContractPreview(null);
  }

  return (
    <section
      className="perspective-inspector-section manual-note-result-intake-operator-review-preview"
      aria-label="Manual note result intake operator review preview"
      data-augnes-authority="candidate-only local-operator-review contract-preview-only no-write"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Operator Review Preview</p>
          <h3>Candidate-only operator review preview</h3>
          <p>
            Inspect the result-intake draft and preview a future record contract
            only when the pasted report has enough return material.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">local review</span>
          <span className="status-pill">contract preview only</span>
          <span className="status-pill">no ledger write</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          intake_status <code>{resultIntake.recommendation_status}</code>
        </span>
        <span>
          missing_fields <code>{resultIntake.missing_required_return_fields.length}</code>
        </span>
        <span>
          delta_status <code>{resultIntake.expected_observed_delta_draft.status}</code>
        </span>
        <span>
          reuse_outcome <code>{resultIntake.reuse_outcome_draft.outcome_label}</code>
        </span>
      </div>

      <form className="observe-form" onSubmit={previewOperatorReview}>
        <label htmlFor="research-candidate-result-intake-operator-decision">
          Operator decision
        </label>
        <select
          id="research-candidate-result-intake-operator-decision"
          value={operatorDecision}
          onChange={(event) =>
            setOperatorDecision(
              event.target
                .value as ResearchCandidateManualNoteResultIntakeOperatorDecision,
            )
          }
        >
          {operatorDecisionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label htmlFor="research-candidate-result-intake-operator-notes">
          Operator notes
        </label>
        <textarea
          id="research-candidate-result-intake-operator-notes"
          value={operatorNotes}
          onChange={(event) => setOperatorNotes(event.target.value)}
          rows={4}
          placeholder="Optional local review note. This is not persisted."
        />

        <div className="form-row">
          <button type="submit">Preview operator review</button>
          <button
            type="button"
            className="secondary-button"
            onClick={clearOperatorReview}
            disabled={!operatorReview && !recordContractPreview && !operatorNotes}
          >
            Clear review
          </button>
        </div>
        <p className="manual-note-runtime-hint">
          This review is local React state only. It is not approval, storage
          authority, record creation, or reuse ledger activity.
        </p>
      </form>

      {operatorReview ? (
        <OperatorReviewReadout review={operatorReview} />
      ) : null}
      {recordContractPreview ? (
        <RecordContractPreviewReadout contract={recordContractPreview} />
      ) : null}
      {recordContractPreview && operatorReview ? (
        <ResearchCandidateManualNoteAuthorizedRecordWritePanel
          resultIntake={resultIntake}
          operatorReview={operatorReview}
          recordContractPreview={recordContractPreview}
        />
      ) : null}
    </section>
  );
}

function OperatorReviewReadout({
  review,
}: {
  review: ResearchCandidateManualNoteResultIntakeOperatorReview;
}) {
  return (
    <div className="perspective-detail-stack">
      <div className="perspective-workbench-status-row">
        <span>
          review_status <code>{review.review_status}</code>
        </span>
        <span>
          decision <code>{review.selected_operator_decision}</code>
        </span>
        <span>
          blockers <code>{review.blocker_reasons.length}</code>
        </span>
        <span>
          warnings <code>{review.warning_reasons.length}</code>
        </span>
      </div>

      <div className="perspective-formation-summary-grid">
        <div>
          <span>source_result_intake</span>
          <strong>{review.source_result_intake_fingerprint}</strong>
          <small>{review.source_result_intake_ref}</small>
        </div>
        <div>
          <span>source_handoff_seed</span>
          <strong>{review.source_handoff_seed_fingerprint}</strong>
          <small>{review.source_preview_session_id}</small>
        </div>
        <div>
          <span>validation</span>
          <strong>{review.validation.passed ? "passed" : "blocked"}</strong>
          <small>
            {review.validation.failure_codes.length > 0
              ? review.validation.failure_codes.join(", ")
              : "no failure codes"}
          </small>
        </div>
        <div>
          <span>record_contract_preview_allowed</span>
          <strong>
            {String(review.validation.record_contract_preview_allowed)}
          </strong>
          <small>future authorization still required</small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <section className="cockpit-surface-card">
          <h4>ExpectedObservedDelta review</h4>
          <dl>
            <dt>draft_status</dt>
            <dd>{review.expected_observed_delta_review.draft_status}</dd>
            <dt>expected_summary_present</dt>
            <dd>
              {String(
                review.expected_observed_delta_review.expected_summary_present,
              )}
            </dd>
            <dt>observed_summary_present</dt>
            <dd>
              {String(
                review.expected_observed_delta_review.observed_summary_present,
              )}
            </dd>
            <dt>ready_for_record_candidate</dt>
            <dd>
              {String(
                review.expected_observed_delta_review.ready_for_record_candidate,
              )}
            </dd>
          </dl>
        </section>

        <section className="cockpit-surface-card">
          <h4>Reuse Outcome review</h4>
          <dl>
            <dt>outcome_label</dt>
            <dd>{review.reuse_outcome_review.outcome_label}</dd>
            <dt>selected_candidate_context_refs</dt>
            <dd>{review.reuse_outcome_review.selected_candidate_context_ref_count}</dd>
            <dt>source_line_present</dt>
            <dd>{String(review.reuse_outcome_review.source_line_present)}</dd>
            <dt>ready_for_record_candidate</dt>
            <dd>{String(review.reuse_outcome_review.ready_for_record_candidate)}</dd>
          </dl>
        </section>

        <section className="cockpit-surface-card">
          <h4>Blockers</h4>
          <InlineList
            items={review.blocker_reasons}
            emptyText="No blocker reasons reported."
          />
        </section>

        <section className="cockpit-surface-card">
          <h4>Warnings</h4>
          <InlineList
            items={review.warning_reasons}
            emptyText="No warning reasons reported."
          />
        </section>
      </div>

      <section className="perspective-inspector-section">
        <h4>Authority boundary review</h4>
        <div className="perspective-workbench-status-row">
          {Object.entries(review.authority_boundary).map(([key, value]) => (
            <span key={key}>
              {key} <code>{String(value)}</code>
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}

function RecordContractPreviewReadout({
  contract,
}: {
  contract: ResearchCandidateManualNoteResultRecordContractPreview;
}) {
  return (
    <section className="perspective-inspector-section manual-note-result-record-contract-preview">
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Record Contract Preview</p>
          <h3>Future record contract preview</h3>
          <p>
            Draft record shapes for later authorized ExpectedObservedDelta and
            Reuse Outcome handling. This panel does not write records.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">{contract.contract_status}</span>
          <span className="status-pill">would_write false</span>
          <span className="status-pill">record_write_authorized false</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          would_write <code>{String(contract.would_write)}</code>
        </span>
        <span>
          record_write_authorized{" "}
          <code>{String(contract.record_write_authorized)}</code>
        </span>
        <span>
          writes_ledger <code>{String(contract.writes_ledger)}</code>
        </span>
        <span>
          storage_authority_present{" "}
          <code>{String(contract.storage_authority_present)}</code>
        </span>
        <span>
          evidence_refs <code>{contract.evidence_refs.length}</code>
        </span>
        <span>
          proof_refs <code>{contract.proof_refs.length}</code>
        </span>
      </div>

      <div className="perspective-formation-summary-grid">
        <div>
          <span>contract_fingerprint</span>
          <strong>{contract.contract_fingerprint}</strong>
          <small>{contract.fingerprint_algorithm}</small>
        </div>
        <div>
          <span>idempotency_preview</span>
          <strong>{contract.idempotency_preview.idempotency_fingerprint}</strong>
          <small>durable_id_allocated false</small>
        </div>
        <div>
          <span>validation</span>
          <strong>{contract.validation.passed ? "passed" : "blocked"}</strong>
          <small>
            {contract.validation.failure_codes.length > 0
              ? contract.validation.failure_codes.join(", ")
              : "no failure codes"}
          </small>
        </div>
        <div>
          <span>source_result_intake</span>
          <strong>{contract.source_result_intake_fingerprint}</strong>
          <small>{contract.source_result_intake_ref}</small>
        </div>
      </div>

      <div className="perspective-constellation-workspace-grid">
        <section className="cockpit-surface-card">
          <h4>ExpectedObservedDelta record candidate</h4>
          <dl>
            <dt>draft_only</dt>
            <dd>
              {String(
                contract.expected_observed_delta_record_candidate.draft_only,
              )}
            </dd>
            <dt>record_write_authorized</dt>
            <dd>
              {String(
                contract.expected_observed_delta_record_candidate
                  .record_write_authorized,
              )}
            </dd>
            <dt>observed_summary</dt>
            <dd>
              {contract.expected_observed_delta_record_candidate
                .observed_summary ?? "not reported"}
            </dd>
          </dl>
        </section>

        <section className="cockpit-surface-card">
          <h4>Reuse Outcome record candidate</h4>
          <dl>
            <dt>draft_only</dt>
            <dd>{String(contract.reuse_outcome_record_candidate.draft_only)}</dd>
            <dt>record_write_authorized</dt>
            <dd>
              {String(
                contract.reuse_outcome_record_candidate.record_write_authorized,
              )}
            </dd>
            <dt>writes_ledger</dt>
            <dd>{String(contract.reuse_outcome_record_candidate.writes_ledger)}</dd>
            <dt>outcome_label</dt>
            <dd>{contract.reuse_outcome_record_candidate.outcome_label}</dd>
          </dl>
        </section>

        <section className="cockpit-surface-card">
          <h4>Future authorization required</h4>
          <InlineList
            items={contract.required_future_authorization}
            emptyText="No future authorization requirements reported."
          />
        </section>

        <section className="cockpit-surface-card">
          <h4>Contract blockers</h4>
          <InlineList
            items={contract.blocker_reasons}
            emptyText="No blocker reasons reported."
          />
        </section>
      </div>

      <section className="perspective-inspector-section">
        <h4>Contract authority boundary</h4>
        <div className="perspective-workbench-status-row">
          {Object.entries(contract.authority_boundary).map(([key, value]) => (
            <span key={key}>
              {key} <code>{String(value)}</code>
            </span>
          ))}
        </div>
      </section>
    </section>
  );
}

function InlineList({
  items,
  emptyText,
}: {
  items: string[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p>{emptyText}</p>;
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
