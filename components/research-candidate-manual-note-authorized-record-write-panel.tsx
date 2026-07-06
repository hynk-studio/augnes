"use client";

import { ResearchCandidateManualNoteRecordReadbackPanel } from "@/components/research-candidate-manual-note-record-readback-panel";
import {
  RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_RESULT_ROLLBACK_CONFIRMATION,
  type ResearchCandidateManualResultAuthorizedWriteResult,
  type ResearchCandidateManualResultReadback,
  type ResearchCandidateManualResultRollbackResult,
} from "@/types/research-candidate-manual-result-authorized-record-write";
import type { ResearchCandidateManualNoteHandoffResultIntake } from "@/types/research-candidate-manual-note-handoff-result-intake";
import type { ResearchCandidateManualNoteResultIntakeOperatorReview } from "@/types/research-candidate-manual-note-result-intake-operator-review";
import type { ResearchCandidateManualNoteResultRecordContractPreview } from "@/types/research-candidate-manual-note-result-record-contract-preview";
import type { FormEvent } from "react";
import { useState } from "react";

export function ResearchCandidateManualNoteAuthorizedRecordWritePanel({
  resultIntake,
  operatorReview,
  recordContractPreview,
}: {
  resultIntake: ResearchCandidateManualNoteHandoffResultIntake;
  operatorReview: ResearchCandidateManualNoteResultIntakeOperatorReview;
  recordContractPreview: ResearchCandidateManualNoteResultRecordContractPreview;
}) {
  const [confirmationText, setConfirmationText] = useState("");
  const [writeResult, setWriteResult] =
    useState<ResearchCandidateManualResultAuthorizedWriteResult | null>(null);
  const [readback, setReadback] =
    useState<ResearchCandidateManualResultReadback | null>(null);
  const [writeError, setWriteError] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [rollbackConfirmationText, setRollbackConfirmationText] = useState("");
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollbackResult, setRollbackResult] =
    useState<ResearchCandidateManualResultRollbackResult | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const confirmationMatches =
    confirmationText === RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION;
  const rollbackConfirmationMatches =
    rollbackConfirmationText ===
    RESEARCH_CANDIDATE_MANUAL_RESULT_ROLLBACK_CONFIRMATION;
  const latestReceiptId = writeResult?.receipt?.receipt_id ?? null;

  async function writeAuthorizedRecords(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmationMatches || isWriting) return;

    setIsWriting(true);
    setWriteError(null);
    try {
      const response = await fetch(
        "/api/research-candidate-review/manual-result-records",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            result_intake: resultIntake,
            operator_review: operatorReview,
            record_contract_preview: recordContractPreview,
            operator_authorization: {
              authorization_kind: "manual_operator_authorized_record_write",
              operator_confirmation_text: confirmationText,
              write_mode: "commit",
            },
          }),
        },
      );
      const payload = (await response.json()) as {
        result?: ResearchCandidateManualResultAuthorizedWriteResult;
        readback?: ResearchCandidateManualResultReadback;
        error_code?: string;
      };
      if (!response.ok || !payload.result) {
        throw new Error(payload.error_code ?? "authorized_write_failed");
      }
      setWriteResult(payload.result);
      setReadback(payload.readback ?? payload.result.readback);
      setRollbackResult(null);
    } catch (error) {
      setWriteError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWriting(false);
    }
  }

  async function refreshReadback() {
    const response = await fetch(
      "/api/research-candidate-review/manual-result-records?limit=10",
      { method: "GET" },
    );
    const payload = (await response.json()) as {
      readback?: ResearchCandidateManualResultReadback;
    };
    setReadback(payload.readback ?? null);
  }

  async function rollbackLatestReceipt() {
    if (
      !latestReceiptId ||
      !rollbackConfirmationMatches ||
      rollbackReason.trim().length === 0 ||
      isRollingBack
    ) {
      return;
    }
    setIsRollingBack(true);
    setWriteError(null);
    try {
      const response = await fetch(
        `/api/research-candidate-review/manual-result-records/${encodeURIComponent(
          latestReceiptId,
        )}/rollback`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            rollback_authorization: {
              authorization_kind: "manual_operator_authorized_record_rollback",
              operator_confirmation_text: rollbackConfirmationText,
              rollback_reason: rollbackReason,
            },
          }),
        },
      );
      const payload = (await response.json()) as {
        result?: ResearchCandidateManualResultRollbackResult;
        readback?: ResearchCandidateManualResultReadback;
        error_code?: string;
      };
      if (!response.ok || !payload.result) {
        throw new Error(payload.error_code ?? "rollback_failed");
      }
      setRollbackResult(payload.result);
      setReadback(payload.readback ?? payload.result.readback);
    } catch (error) {
      setWriteError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsRollingBack(false);
    }
  }

  return (
    <section
      className="perspective-inspector-section manual-note-authorized-record-write"
      aria-label="Manual Research Candidate authorized record write"
      data-augnes-authority="explicit-operator-authorized manual-result-record-write same-origin-only no-proof no-work no-perspective"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Authorized Write</p>
          <h3>Authorized manual result record write</h3>
          <p>
            This is the first durable write path for this manual result loop.
            It writes only a manual ExpectedObservedDelta record, a manual Reuse
            Outcome record, and receipt/readback metadata.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">explicit authority required</span>
          <span className="status-pill">same-origin route</span>
          <span className="status-pill">no proof/evidence</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          contract_status <code>{recordContractPreview.contract_status}</code>
        </span>
        <span>
          would_write <code>{String(recordContractPreview.would_write)}</code>
        </span>
        <span>
          preview_record_write_authorized{" "}
          <code>{String(recordContractPreview.record_write_authorized)}</code>
        </span>
        <span>
          review_status <code>{operatorReview.review_status}</code>
        </span>
      </div>

      <form className="observe-form" onSubmit={writeAuthorizedRecords}>
        <label htmlFor="research-candidate-manual-result-write-confirmation">
          Exact authorization text
        </label>
        <input
          id="research-candidate-manual-result-write-confirmation"
          value={confirmationText}
          onChange={(event) => setConfirmationText(event.target.value)}
          placeholder={RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION}
        />
        <p className="manual-note-runtime-hint">
          Required phrase:{" "}
          <code>{RESEARCH_CANDIDATE_MANUAL_RESULT_AUTHORIZED_WRITE_CONFIRMATION}</code>
        </p>
        <div className="form-row">
          <button type="submit" disabled={!confirmationMatches || isWriting}>
            {isWriting ? "Writing authorized records..." : "Write authorized records"}
          </button>
          <button type="button" className="secondary-button" onClick={refreshReadback}>
            Refresh readback
          </button>
        </div>
      </form>

      {writeError ? (
        <p className="manual-note-runtime-error" role="alert">
          {writeError}
        </p>
      ) : null}

      {writeResult ? (
        <div className="perspective-formation-summary-grid">
          <div>
            <span>write_status</span>
            <strong>{writeResult.result_status}</strong>
            <small>
              duplicate_replayed {String(writeResult.duplicate_replayed)}
            </small>
          </div>
          <div>
            <span>receipt_id</span>
            <strong>{writeResult.receipt?.receipt_id ?? "not written"}</strong>
            <small>{writeResult.idempotency_key ?? "no idempotency key"}</small>
          </div>
          <div>
            <span>ExpectedObservedDelta</span>
            <strong>
              {writeResult.expected_observed_delta_record?.record_id ??
                "not written"}
            </strong>
            <small>manual record only</small>
          </div>
          <div>
            <span>Reuse Outcome</span>
            <strong>
              {writeResult.reuse_outcome_record?.record_id ?? "not written"}
            </strong>
            <small>writes_ledger false</small>
          </div>
        </div>
      ) : null}

      {latestReceiptId ? (
        <section className="perspective-inspector-section manual-note-authorized-record-rollback">
          <h4>Rollback receipt metadata</h4>
          <p>
            Rollback marks the receipt rolled_back and records rollback metadata.
            It does not delete records.
          </p>
          <label htmlFor="research-candidate-manual-result-rollback-reason">
            Rollback reason
          </label>
          <textarea
            id="research-candidate-manual-result-rollback-reason"
            value={rollbackReason}
            onChange={(event) => setRollbackReason(event.target.value)}
            rows={3}
          />
          <label htmlFor="research-candidate-manual-result-rollback-confirmation">
            Exact rollback authorization text
          </label>
          <input
            id="research-candidate-manual-result-rollback-confirmation"
            value={rollbackConfirmationText}
            onChange={(event) => setRollbackConfirmationText(event.target.value)}
            placeholder={RESEARCH_CANDIDATE_MANUAL_RESULT_ROLLBACK_CONFIRMATION}
          />
          <div className="form-row">
            <button
              type="button"
              className="secondary-button"
              disabled={
                !rollbackConfirmationMatches ||
                rollbackReason.trim().length === 0 ||
                isRollingBack
              }
              onClick={rollbackLatestReceipt}
            >
              {isRollingBack ? "Recording rollback..." : "Record rollback metadata"}
            </button>
          </div>
          {rollbackResult ? (
            <p className="manual-note-runtime-hint">
              rollback_status <code>{rollbackResult.result_status}</code>
            </p>
          ) : null}
        </section>
      ) : null}

      <ResearchCandidateManualNoteRecordReadbackPanel readback={readback} />
    </section>
  );
}
