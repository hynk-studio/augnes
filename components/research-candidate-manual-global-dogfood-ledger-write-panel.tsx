"use client";

import { ResearchCandidateManualGlobalDogfoodLedgerReadbackPanel } from "@/components/research-candidate-manual-global-dogfood-ledger-readback-panel";
import type {
  ResearchCandidateManualResultDogfoodLedgerAuthorizationContract,
} from "@/types/research-candidate-manual-result-dogfood-ledger-authorization-contract";
import type {
  ResearchCandidateManualResultDogfoodLedgerAuthorizationReview,
} from "@/types/research-candidate-manual-result-dogfood-ledger-authorization-review";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_ROLLBACK_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WRITE_CONFIRMATION,
  type ResearchCandidateManualGlobalDogfoodLedgerReadback,
  type ResearchCandidateManualGlobalDogfoodLedgerRollbackResult,
  type ResearchCandidateManualGlobalDogfoodLedgerWriteResult,
} from "@/types/research-candidate-manual-global-dogfood-ledger-write";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";

export function ResearchCandidateManualGlobalDogfoodLedgerWritePanel({
  authorizationContract,
  authorizationReview,
}: {
  authorizationContract: ResearchCandidateManualResultDogfoodLedgerAuthorizationContract;
  authorizationReview: ResearchCandidateManualResultDogfoodLedgerAuthorizationReview;
}) {
  const [confirmationText, setConfirmationText] = useState("");
  const [writeResult, setWriteResult] =
    useState<ResearchCandidateManualGlobalDogfoodLedgerWriteResult | null>(null);
  const [readback, setReadback] =
    useState<ResearchCandidateManualGlobalDogfoodLedgerReadback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWriting, setIsWriting] = useState(false);
  const [isLoadingReadback, setIsLoadingReadback] = useState(false);
  const [rollbackConfirmationText, setRollbackConfirmationText] = useState("");
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollbackResult, setRollbackResult] =
    useState<ResearchCandidateManualGlobalDogfoodLedgerRollbackResult | null>(
      null,
    );
  const [isRollingBack, setIsRollingBack] = useState(false);

  const confirmationMatches =
    confirmationText ===
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WRITE_CONFIRMATION;
  const rollbackConfirmationMatches =
    rollbackConfirmationText ===
    RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_ROLLBACK_CONFIRMATION;
  const latestActiveReceiptId = readback
    ? readback.latest_active_committed?.receipt.receipt_id ?? null
    : writeResult?.receipt?.ledger_write_status === "committed"
      ? writeResult.receipt.receipt_id
      : null;

  useEffect(() => {
    void refreshReadback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function writeLedgerRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmationMatches || isWriting) return;

    setIsWriting(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/research-candidate-review/manual-global-dogfood-ledger",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            authorization_contract: authorizationContract,
            authorization_review: authorizationReview,
            operator_authorization: {
              authorization_kind:
                "manual_operator_authorized_global_dogfood_ledger_write",
              operator_confirmation_text: confirmationText,
              write_mode: "commit",
            },
          }),
        },
      );
      const payload = (await response.json()) as {
        result?: ResearchCandidateManualGlobalDogfoodLedgerWriteResult;
        readback?: ResearchCandidateManualGlobalDogfoodLedgerReadback;
        error_code?: string;
      };
      if (!response.ok || !payload.result) {
        throw new Error(payload.error_code ?? "global_dogfood_ledger_write_failed");
      }
      setWriteResult(payload.result);
      setReadback(payload.readback ?? payload.result.readback);
      setRollbackResult(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsWriting(false);
    }
  }

  async function refreshReadback() {
    setIsLoadingReadback(true);
    setError(null);
    try {
      const response = await fetch(
        "/api/research-candidate-review/manual-global-dogfood-ledger?limit=10",
        { method: "GET" },
      );
      const payload = (await response.json()) as {
        readback?: ResearchCandidateManualGlobalDogfoodLedgerReadback;
        error_code?: string;
      };
      if (!response.ok || !payload.readback) {
        throw new Error(payload.error_code ?? "global_dogfood_ledger_readback_failed");
      }
      setReadback(payload.readback);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsLoadingReadback(false);
    }
  }

  async function rollbackLatestReceipt() {
    if (
      !latestActiveReceiptId ||
      !rollbackConfirmationMatches ||
      rollbackReason.trim().length === 0 ||
      isRollingBack
    ) {
      return;
    }

    setIsRollingBack(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/research-candidate-review/manual-global-dogfood-ledger/${encodeURIComponent(
          latestActiveReceiptId,
        )}/rollback`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            rollback_authorization: {
              authorization_kind:
                "manual_operator_authorized_global_dogfood_ledger_rollback",
              operator_confirmation_text: rollbackConfirmationText,
              rollback_reason: rollbackReason,
            },
          }),
        },
      );
      const payload = (await response.json()) as {
        result?: ResearchCandidateManualGlobalDogfoodLedgerRollbackResult;
        readback?: ResearchCandidateManualGlobalDogfoodLedgerReadback;
        error_code?: string;
      };
      if (!response.ok || !payload.result) {
        throw new Error(payload.error_code ?? "global_dogfood_ledger_rollback_failed");
      }
      setRollbackResult(payload.result);
      setReadback(payload.readback ?? payload.result.readback);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setIsRollingBack(false);
    }
  }

  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-ledger-write"
      aria-label="Authorized manual global dogfood ledger write"
      data-augnes-authority="explicit-operator-authorized manual-global-dogfood-ledger-only no-metrics no-proof no-work no-perspective no-memory"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Authorized Ledger Write</p>
          <h4>Manual bridge global dogfood ledger write</h4>
          <p>
            This writes only manual-to-global dogfood ledger integration
            receipt, record, and rollback metadata. It does not write dogfood
            metrics, Perspective, proof/evidence, work status, memory, product
            records, provider calls, GitHub automation, Codex execution,
            retrieval, source fetching, raw manual note text, raw result report
            text, or operator notes.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">fresh confirmation required</span>
          <span className="status-pill">idempotent</span>
          <span className="status-pill">same-origin only</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          source_contract_fingerprint{" "}
          <code>{authorizationContract.validation.contract_fingerprint}</code>
        </span>
        <span>
          source_manual_receipt_id{" "}
          <code>
            {
              authorizationContract.proposed_global_dogfood_mapping
                .source_manual_receipt_id
            }
          </code>
        </span>
        <span>
          proposed_idempotency_key{" "}
          <code>
            {
              authorizationContract.idempotency_contract_preview
                .proposed_idempotency_key
            }
          </code>
        </span>
      </div>

      <form className="observe-form" onSubmit={writeLedgerRecord}>
        <label htmlFor="manual-global-dogfood-ledger-write-confirmation">
          Exact authorization text
        </label>
        <input
          id="manual-global-dogfood-ledger-write-confirmation"
          value={confirmationText}
          onChange={(event) => setConfirmationText(event.target.value)}
          placeholder={RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WRITE_CONFIRMATION}
        />
        <p className="manual-note-runtime-hint">
          Required phrase:{" "}
          <code>
            {RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_WRITE_CONFIRMATION}
          </code>
        </p>
        <div className="form-row">
          <button type="submit" disabled={!confirmationMatches || isWriting}>
            {isWriting
              ? "Writing global dogfood ledger record..."
              : "Write global dogfood ledger record"}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void refreshReadback()}
          >
            Refresh ledger readback
          </button>
        </div>
      </form>

      {error ? (
        <p className="manual-note-runtime-error" role="alert">
          {error}
        </p>
      ) : null}

      {writeResult ? (
        <div className="perspective-formation-summary-grid">
          <div>
            <span>write_status</span>
            <strong>{writeResult.result_status}</strong>
            <small>duplicate_replayed {String(writeResult.duplicate_replayed)}</small>
          </div>
          <div>
            <span>receipt_id</span>
            <strong>{writeResult.receipt?.receipt_id ?? "not written"}</strong>
            <small>{writeResult.idempotency_key ?? "no idempotency key"}</small>
          </div>
          <div>
            <span>ledger_record_id</span>
            <strong>
              {writeResult.ledger_record?.ledger_record_id ?? "not written"}
            </strong>
            <small>manual global dogfood integration only</small>
          </div>
          <div>
            <span>non-target writes</span>
            <strong>
              {String(
                writeResult.dogfood_metrics_written ||
                  writeResult.proof_or_evidence_rows_written ||
                  writeResult.work_or_perspective_rows_written ||
                  writeResult.perspective_memory_written ||
                  writeResult.product_write_executed,
              )}
            </strong>
            <small>metrics/proof/work/Perspective/memory/product</small>
          </div>
        </div>
      ) : null}

      <section className="perspective-inspector-section manual-global-dogfood-ledger-rollback">
        <h5>Rollback receipt metadata</h5>
        <p>
          Rollback marks the latest active committed receipt rolled_back and
          records rollback metadata. It does not delete the ledger record.
        </p>
        <div className="perspective-workbench-status-row">
          <span>
            target_receipt <code>{latestActiveReceiptId ?? "none"}</code>
          </span>
          <span>
            ledger_record_deleted <code>false</code>
          </span>
        </div>
        <label htmlFor="manual-global-dogfood-ledger-rollback-reason">
          Rollback reason
        </label>
        <textarea
          id="manual-global-dogfood-ledger-rollback-reason"
          value={rollbackReason}
          onChange={(event) => setRollbackReason(event.target.value)}
          rows={3}
        />
        <label htmlFor="manual-global-dogfood-ledger-rollback-confirmation">
          Exact rollback authorization text
        </label>
        <input
          id="manual-global-dogfood-ledger-rollback-confirmation"
          value={rollbackConfirmationText}
          onChange={(event) => setRollbackConfirmationText(event.target.value)}
          placeholder={
            RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_LEDGER_ROLLBACK_CONFIRMATION
          }
        />
        <div className="form-row">
          <button
            type="button"
            className="secondary-button"
            disabled={
              !latestActiveReceiptId ||
              !rollbackConfirmationMatches ||
              rollbackReason.trim().length === 0 ||
              isRollingBack
            }
            onClick={() => void rollbackLatestReceipt()}
          >
            {isRollingBack ? "Rolling back receipt..." : "Rollback ledger receipt"}
          </button>
        </div>
        {rollbackResult ? (
          <div className="perspective-workbench-status-row">
            <span>
              rollback_status <code>{rollbackResult.result_status}</code>
            </span>
            <span>
              rollback_id <code>{rollbackResult.rollback?.rollback_id ?? "none"}</code>
            </span>
            <span>
              receipt_status{" "}
              <code>{rollbackResult.receipt?.ledger_write_status ?? "none"}</code>
            </span>
          </div>
        ) : null}
      </section>

      <ResearchCandidateManualGlobalDogfoodLedgerReadbackPanel
        readback={readback}
        isLoading={isLoadingReadback}
        error={null}
      />
    </section>
  );
}
