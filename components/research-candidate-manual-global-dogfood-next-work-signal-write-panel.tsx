"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ResearchCandidateManualGlobalDogfoodNextWorkSignalReadbackPanel } from "@/components/research-candidate-manual-global-dogfood-next-work-signal-readback-panel";
import type { ResearchCandidateManualGlobalDogfoodMetricSnapshotReadback } from "@/types/research-candidate-manual-global-dogfood-metric-snapshot-write";
import type { ResearchCandidateManualGlobalDogfoodNextWorkSignalContract } from "@/types/research-candidate-manual-global-dogfood-next-work-signal-contract";
import type { ResearchCandidateManualGlobalDogfoodNextWorkSignalReview } from "@/types/research-candidate-manual-global-dogfood-next-work-signal-review";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_ROLLBACK_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_WRITE_CONFIRMATION,
  type ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback,
  type ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteResult,
} from "@/types/research-candidate-manual-global-dogfood-next-work-signal-write";

const routePath =
  "/api/research-candidate-review/manual-global-dogfood-next-work-signal";
const metricSnapshotRoutePath =
  "/api/research-candidate-review/manual-global-dogfood-metric-snapshot";

export function ResearchCandidateManualGlobalDogfoodNextWorkSignalWritePanel({
  nextWorkSignalContract,
  nextWorkSignalReview,
}: {
  nextWorkSignalContract: ResearchCandidateManualGlobalDogfoodNextWorkSignalContract;
  nextWorkSignalReview: ResearchCandidateManualGlobalDogfoodNextWorkSignalReview;
}) {
  const [confirmationText, setConfirmationText] = useState("");
  const [writeResult, setWriteResult] =
    useState<ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteResult | null>(
      null,
    );
  const [readback, setReadback] =
    useState<ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback | null>(
      null,
    );
  const [metricSnapshotReadback, setMetricSnapshotReadback] =
    useState<ResearchCandidateManualGlobalDogfoodMetricSnapshotReadback | null>(
      null,
    );
  const [isLoadingReadback, setIsLoadingReadback] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [rollbackReceiptId, setRollbackReceiptId] = useState("");
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollbackConfirmationText, setRollbackConfirmationText] = useState("");
  const sourceMetricSnapshotReceiptId =
    metricSnapshotReadback?.latest_active_committed?.receipt.receipt_id ?? "";
  const sourceMetricSnapshotRecordId =
    metricSnapshotReadback?.latest_active_committed?.metric_snapshot_record
      ?.metric_snapshot_record_id ?? "";
  const writeEnabled =
    confirmationText ===
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_WRITE_CONFIRMATION &&
    sourceMetricSnapshotReceiptId.length > 0 &&
    sourceMetricSnapshotRecordId.length > 0;
  const latestReceiptId =
    writeResult?.receipt?.receipt_id ??
    readback?.latest_active_committed?.receipt.receipt_id ??
    "";
  const effectiveRollbackReceiptId = rollbackReceiptId.trim() || latestReceiptId;
  const rollbackEnabled =
    effectiveRollbackReceiptId.length > 0 &&
    rollbackReason.trim().length > 0 &&
    rollbackConfirmationText ===
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_ROLLBACK_CONFIRMATION;
  const writeRequest = useMemo(
    () => ({
      next_work_signal_contract: nextWorkSignalContract,
      next_work_signal_review: nextWorkSignalReview,
      source_metric_snapshot_receipt_id: sourceMetricSnapshotReceiptId,
      source_metric_snapshot_record_id: sourceMetricSnapshotRecordId,
      operator_authorization: {
        authorization_kind:
          "manual_operator_authorized_next_work_signal_decision_write",
        operator_confirmation_text: confirmationText,
        write_mode: "commit",
      },
    }),
    [
      confirmationText,
      nextWorkSignalContract,
      nextWorkSignalReview,
      sourceMetricSnapshotReceiptId,
      sourceMetricSnapshotRecordId,
    ],
  );

  const refreshReadback = useCallback(async () => {
    setIsLoadingReadback(true);
    setRuntimeError(null);
    try {
      const [nextWorkResponse, metricResponse] = await Promise.all([
        fetch(`${routePath}?limit=10`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }),
        fetch(`${metricSnapshotRoutePath}?limit=10`, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }),
      ]);
      const nextWorkPayload = (await nextWorkResponse.json()) as {
        ok?: boolean;
        readback?: ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback;
        error_code?: string;
      };
      const metricPayload = (await metricResponse.json()) as {
        ok?: boolean;
        readback?: ResearchCandidateManualGlobalDogfoodMetricSnapshotReadback;
        error_code?: string;
      };
      if (
        !nextWorkResponse.ok ||
        nextWorkPayload.ok !== true ||
        !nextWorkPayload.readback
      ) {
        throw new Error(
          nextWorkPayload.error_code ?? "next_work_signal_readback_failed",
        );
      }
      if (
        !metricResponse.ok ||
        metricPayload.ok !== true ||
        !metricPayload.readback
      ) {
        throw new Error(
          metricPayload.error_code ?? "metric_snapshot_source_readback_failed",
        );
      }
      setReadback(nextWorkPayload.readback);
      setMetricSnapshotReadback(metricPayload.readback);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingReadback(false);
    }
  }, []);

  useEffect(() => {
    void refreshReadback();
  }, [refreshReadback]);

  async function writeNextWorkSignalDecision() {
    if (!writeEnabled) return;
    setIsWriting(true);
    setRuntimeError(null);
    try {
      const response = await fetch(routePath, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(writeRequest),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        result?: ResearchCandidateManualGlobalDogfoodNextWorkSignalWriteResult;
        error_code?: string;
      };
      if (!payload.result) {
        throw new Error(payload.error_code ?? "next_work_signal_write_failed");
      }
      setWriteResult(payload.result);
      if (!response.ok || payload.ok !== true) {
        setRuntimeError(payload.result.refusal_reasons.join(", "));
      }
      if (payload.result.readback) {
        setReadback(payload.result.readback);
      } else {
        await refreshReadback();
      }
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWriting(false);
    }
  }

  async function rollbackNextWorkSignalDecision() {
    if (!rollbackEnabled) return;
    setIsRollingBack(true);
    setRuntimeError(null);
    try {
      const response = await fetch(
        `${routePath}/${encodeURIComponent(effectiveRollbackReceiptId)}/rollback`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            rollback_authorization: {
              authorization_kind:
                "manual_operator_authorized_next_work_signal_decision_rollback",
              operator_confirmation_text: rollbackConfirmationText,
              rollback_reason: rollbackReason.trim(),
            },
          }),
        },
      );
      const payload = (await response.json()) as {
        ok?: boolean;
        result?: {
          result_status?: string;
          refusal_reasons?: string[];
          readback?: ResearchCandidateManualGlobalDogfoodNextWorkSignalReadback | null;
        };
        error_code?: string;
      };
      if (!response.ok || payload.ok !== true) {
        throw new Error(
          payload.result?.refusal_reasons?.join(", ") ??
            payload.error_code ??
            "next_work_signal_rollback_failed",
        );
      }
      setRuntimeError(null);
      if (payload.result?.readback) {
        setReadback(payload.result.readback);
      } else {
        await refreshReadback();
      }
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsRollingBack(false);
    }
  }

  return (
    <section
      className="perspective-inspector-section manual-global-dogfood-next-work-signal-write"
      aria-label="Authorized manual global dogfood next-work signal decision write"
      data-augnes-authority="authorized-manual-next-work-signal-write no-next-work-bias no-work no-perspective no-proof no-metrics no-memory"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Authorized Next-Work Signal Write</p>
          <h4>Write next-work signal decision record</h4>
          <p>
            This writes only a manual-derived next-work signal decision
            record/receipt/readback/rollback metadata. It does not write
            next-work bias, work status, Perspective, memory, proof/evidence,
            dogfood metrics, product state, or source records.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">
            {writeResult?.result_status ?? "not written"}
          </span>
          <span className="status-pill">bias false</span>
          <span className="status-pill">work false</span>
          <span className="status-pill">Perspective false</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          next_work_contract_fingerprint{" "}
          <code>{nextWorkSignalContract.validation.contract_fingerprint}</code>
        </span>
        <span>
          next_work_review_fingerprint{" "}
          <code>{nextWorkSignalReview.validation.review_fingerprint}</code>
        </span>
        <span>
          source_projection_fingerprint{" "}
          <code>{nextWorkSignalContract.source_projection_fingerprint}</code>
        </span>
        <span>
          source_global_dogfood_ledger_receipt{" "}
          <code>
            {nextWorkSignalContract.source_latest_active_committed_receipt_id ??
              "none"}
          </code>
        </span>
        <span>
          source_metric_snapshot_receipt{" "}
          <code>{sourceMetricSnapshotReceiptId || "none"}</code>
        </span>
        <span>
          source_metric_snapshot_record{" "}
          <code>{sourceMetricSnapshotRecordId || "none"}</code>
        </span>
        <span>
          proposed_idempotency_key{" "}
          <code>
            {
              nextWorkSignalContract.idempotency_contract_preview
                .proposed_idempotency_key
            }
          </code>
        </span>
      </div>

      <section className="cockpit-surface-card">
        <h5>Fresh operator authorization</h5>
        <p className="manual-note-runtime-hint">
          Exact confirmation required:{" "}
          <code>
            {
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_WRITE_CONFIRMATION
            }
          </code>
        </p>
        <label>
          Confirmation
          <input
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder={
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_WRITE_CONFIRMATION
            }
          />
        </label>
        {!sourceMetricSnapshotReceiptId || !sourceMetricSnapshotRecordId ? (
          <p className="manual-note-runtime-hint">
            An active committed manual metric snapshot receipt and record are
            required before this next-work signal decision can be written.
          </p>
        ) : null}
        <div className="perspective-workbench-status-row">
          <button
            type="button"
            disabled={!writeEnabled || isWriting}
            onClick={writeNextWorkSignalDecision}
          >
            {isWriting
              ? "Writing next-work signal decision record"
              : "Write next-work signal decision record"}
          </button>
          <button type="button" onClick={refreshReadback} disabled={isLoadingReadback}>
            Refresh next-work signal readback
          </button>
        </div>
      </section>

      {writeResult ? (
        <section className="cockpit-surface-card">
          <h5>Write result</h5>
          <div className="perspective-workbench-status-row">
            <span>
              result_status <code>{writeResult.result_status}</code>
            </span>
            <span>
              duplicate_replayed <code>{String(writeResult.duplicate_replayed)}</code>
            </span>
            <span>
              receipt <code>{writeResult.receipt?.receipt_id ?? "none"}</code>
            </span>
            <span>
              record{" "}
              <code>
                {writeResult.next_work_signal_record?.next_work_signal_record_id ??
                  "none"}
              </code>
            </span>
          </div>
          {writeResult.refusal_reasons.length > 0 ? (
            <ul>
              {writeResult.refusal_reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      <section className="cockpit-surface-card">
        <h5>Rollback metadata</h5>
        <p>
          Rollback marks the next-work signal receipt rolled_back and keeps the
          decision record row for audit readback.
        </p>
        <p className="manual-note-runtime-hint">
          Exact rollback authorization text required:{" "}
          <code>
            {
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_ROLLBACK_CONFIRMATION
            }
          </code>
        </p>
        <label>
          Receipt id
          <input
            value={rollbackReceiptId}
            onChange={(event) => setRollbackReceiptId(event.target.value)}
            placeholder={
              latestReceiptId || "manual-global-dogfood-next-work-signal-receipt:..."
            }
          />
        </label>
        <label>
          Rollback reason
          <input
            value={rollbackReason}
            onChange={(event) => setRollbackReason(event.target.value)}
            placeholder="Operator requested rollback of this next-work signal receipt."
          />
        </label>
        <label>
          Exact rollback authorization text
          <input
            value={rollbackConfirmationText}
            onChange={(event) => setRollbackConfirmationText(event.target.value)}
            placeholder={
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_NEXT_WORK_SIGNAL_ROLLBACK_CONFIRMATION
            }
          />
        </label>
        <button
          type="button"
          disabled={!rollbackEnabled || isRollingBack}
          onClick={rollbackNextWorkSignalDecision}
        >
          {isRollingBack
            ? "Rolling back next-work signal receipt"
            : "Rollback next-work signal receipt"}
        </button>
      </section>

      {runtimeError ? (
        <p className="manual-note-runtime-error" role="alert">
          {runtimeError}
        </p>
      ) : null}

      <ResearchCandidateManualGlobalDogfoodNextWorkSignalReadbackPanel
        readback={readback}
        isLoading={isLoadingReadback}
        error={null}
      />
    </section>
  );
}
