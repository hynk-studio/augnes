"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadbackPanel } from "@/components/research-candidate-manual-global-dogfood-perspective-relay-readback-panel";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract } from "@/types/research-candidate-manual-global-dogfood-perspective-relay-contract";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveRelayReview } from "@/types/research-candidate-manual-global-dogfood-perspective-relay-review";
import type { ResearchCandidateManualGlobalDogfoodNextWorkBiasReadback } from "@/types/research-candidate-manual-global-dogfood-next-work-bias-write";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_ROLLBACK_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_WRITE_CONFIRMATION,
  type ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback,
  type ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteResult,
} from "@/types/research-candidate-manual-global-dogfood-perspective-relay-write";

const routePath =
  "/api/research-candidate-review/manual-global-dogfood-perspective-relay";
const sourceBiasRoutePath =
  "/api/research-candidate-review/manual-global-dogfood-next-work-bias";

export function ResearchCandidateManualGlobalDogfoodPerspectiveRelayWritePanel({
  perspectiveRelayContract,
  perspectiveRelayReview,
}: {
  perspectiveRelayContract: ResearchCandidateManualGlobalDogfoodPerspectiveRelayContract;
  perspectiveRelayReview: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReview;
}) {
  const [confirmationText, setConfirmationText] = useState("");
  const [writeResult, setWriteResult] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteResult | null>(
      null,
    );
  const [readback, setReadback] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback | null>(
      null,
    );
  const [sourceBiasReadback, setSourceBiasReadback] =
    useState<ResearchCandidateManualGlobalDogfoodNextWorkBiasReadback | null>(
      null,
    );
  const [isLoadingReadback, setIsLoadingReadback] = useState(false);
  const [isLoadingSourceBiasReadback, setIsLoadingSourceBiasReadback] =
    useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [rollbackReceiptId, setRollbackReceiptId] = useState("");
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollbackConfirmationText, setRollbackConfirmationText] = useState("");
  const writeEnabled =
    confirmationText ===
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_WRITE_CONFIRMATION &&
    Boolean(sourceBiasReadback?.latest_active_committed);
  const latestReceiptId =
    writeResult?.receipt?.receipt_id ??
    readback?.latest_active_committed?.receipt.receipt_id ??
    "";
  const effectiveRollbackReceiptId = rollbackReceiptId.trim() || latestReceiptId;
  const rollbackEnabled =
    effectiveRollbackReceiptId.length > 0 &&
    rollbackReason.trim().length > 0 &&
    rollbackConfirmationText ===
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_ROLLBACK_CONFIRMATION;
  const writeRequest = useMemo(
    () => ({
      perspective_relay_contract: perspectiveRelayContract,
      perspective_relay_review: perspectiveRelayReview,
      source_next_work_bias_readback: sourceBiasReadback,
      operator_authorization: {
        authorization_kind: "manual_operator_authorized_perspective_relay_write",
        operator_confirmation_text: confirmationText,
        write_mode: "commit",
      },
    }),
    [
      confirmationText,
      perspectiveRelayContract,
      perspectiveRelayReview,
      sourceBiasReadback,
    ],
  );

  const refreshReadback = useCallback(async () => {
    setIsLoadingReadback(true);
    setRuntimeError(null);
    try {
      const response = await fetch(`${routePath}?limit=10`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        readback?: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback;
        error_code?: string;
      };
      if (!response.ok || payload.ok !== true || !payload.readback) {
        throw new Error(payload.error_code ?? "perspective_relay_readback_failed");
      }
      setReadback(payload.readback);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingReadback(false);
    }
  }, []);

  useEffect(() => {
    void refreshReadback();
  }, [refreshReadback]);

  const refreshSourceBiasReadback = useCallback(async () => {
    setIsLoadingSourceBiasReadback(true);
    setRuntimeError(null);
    try {
      const response = await fetch(`${sourceBiasRoutePath}?limit=10`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        readback?: ResearchCandidateManualGlobalDogfoodNextWorkBiasReadback;
        error_code?: string;
      };
      if (!response.ok || payload.ok !== true || !payload.readback) {
        throw new Error(
          payload.error_code ?? "source_next_work_bias_readback_failed",
        );
      }
      setSourceBiasReadback(payload.readback);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingSourceBiasReadback(false);
    }
  }, []);

  useEffect(() => {
    void refreshSourceBiasReadback();
  }, [refreshSourceBiasReadback]);

  async function writePerspectiveRelayRecord() {
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
        result?: ResearchCandidateManualGlobalDogfoodPerspectiveRelayWriteResult;
        error_code?: string;
      };
      if (!payload.result) {
        throw new Error(payload.error_code ?? "perspective_relay_write_failed");
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

  async function rollbackPerspectiveRelayReceipt() {
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
                "manual_operator_authorized_perspective_relay_rollback",
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
          readback?: ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback | null;
        };
        error_code?: string;
      };
      if (!response.ok || payload.ok !== true) {
        throw new Error(
          payload.result?.refusal_reasons?.join(", ") ??
            payload.error_code ??
            "perspective_relay_rollback_failed",
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
      className="perspective-inspector-section manual-global-dogfood-perspective-relay-write"
      aria-label="Authorized manual global dogfood Perspective relay write"
      data-augnes-authority="authorized-manual-perspective-relay-write no-work no-perspective no-proof no-metrics no-memory"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Authorized Relay Write</p>
          <h4>Write Perspective relay update record</h4>
          <p>
            This writes only a manual-derived Perspective relay
            update record/receipt/readback/rollback metadata. It does not write
            canonical Perspective state, promote Perspective, write Perspective
            Memory, create or mutate work, write proof/evidence, dogfood
            metrics, product state, or source records.
          </p>
        </div>
        <div className="perspective-constellation-shell-status">
          <span className="status-pill">
            {writeResult?.result_status ?? "not written"}
          </span>
          <span className="status-pill">work false</span>
          <span className="status-pill">canonical Perspective false</span>
          <span className="status-pill">metrics false</span>
        </div>
      </div>

      <div className="perspective-workbench-status-row">
        <span>
          perspective_relay_contract_fingerprint{" "}
          <code>{perspectiveRelayContract.validation.contract_fingerprint}</code>
        </span>
        <span>
          perspective_relay_review_fingerprint{" "}
          <code>{perspectiveRelayReview.validation.review_fingerprint}</code>
        </span>
        <span>
          source_next_work_signal_receipt{" "}
          <code>
            {perspectiveRelayContract.source_next_work_signal_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_signal_record{" "}
          <code>
            {perspectiveRelayContract.source_next_work_signal_record_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_bias_receipt{" "}
          <code>
            {sourceBiasReadback?.latest_active_committed?.receipt.receipt_id ??
              "none"}
          </code>
        </span>
        <span>
          source_next_work_bias_record{" "}
          <code>
            {sourceBiasReadback?.latest_active_committed?.next_work_bias_record
              ?.next_work_bias_record_id ?? "none"}
          </code>
        </span>
        <span>
          source_projection_fingerprint{" "}
          <code>{perspectiveRelayContract.source_projection_fingerprint}</code>
        </span>
        <span>
          source_metric_snapshot_receipt{" "}
          <code>{perspectiveRelayContract.source_metric_snapshot_receipt_id ?? "none"}</code>
        </span>
        <span>
          proposed_idempotency_key{" "}
          <code>
            {
              perspectiveRelayContract.idempotency_contract_preview
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
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_WRITE_CONFIRMATION
            }
          </code>
        </p>
        <label>
          Confirmation
          <input
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder={
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_WRITE_CONFIRMATION
            }
          />
        </label>
        <div className="perspective-workbench-status-row">
          <button
            type="button"
            disabled={!writeEnabled || isWriting}
            onClick={writePerspectiveRelayRecord}
          >
            {isWriting
              ? "Writing Perspective relay update record"
              : "Write Perspective relay update record"}
          </button>
          <button type="button" onClick={refreshReadback} disabled={isLoadingReadback}>
            Refresh Perspective relay readback
          </button>
          <button
            type="button"
            onClick={refreshSourceBiasReadback}
            disabled={isLoadingSourceBiasReadback}
          >
            Refresh source bias readback
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
                {writeResult.perspective_relay_record?.perspective_relay_record_id ??
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
          Rollback marks the Perspective relay receipt rolled_back and keeps the
          relay update record row for audit readback.
        </p>
        <p className="manual-note-runtime-hint">
          Exact rollback authorization text required:{" "}
          <code>
            {
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_ROLLBACK_CONFIRMATION
            }
          </code>
        </p>
        <label>
          Receipt id
          <input
            value={rollbackReceiptId}
            onChange={(event) => setRollbackReceiptId(event.target.value)}
            placeholder={
              latestReceiptId || "manual-global-dogfood-perspective-relay-receipt:..."
            }
          />
        </label>
        <label>
          Rollback reason
          <input
            value={rollbackReason}
            onChange={(event) => setRollbackReason(event.target.value)}
            placeholder="Operator requested rollback of this Perspective relay receipt."
          />
        </label>
        <label>
          Exact rollback authorization text
          <input
            value={rollbackConfirmationText}
            onChange={(event) => setRollbackConfirmationText(event.target.value)}
            placeholder={
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_RELAY_ROLLBACK_CONFIRMATION
            }
          />
        </label>
        <button
          type="button"
          disabled={!rollbackEnabled || isRollingBack}
          onClick={rollbackPerspectiveRelayReceipt}
        >
          {isRollingBack
            ? "Rolling back Perspective relay receipt"
            : "Rollback Perspective relay receipt"}
        </button>
      </section>

      {runtimeError ? (
        <p className="manual-note-runtime-error" role="alert">
          {runtimeError}
        </p>
      ) : null}

      <ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadbackPanel
        readback={readback}
        isLoading={isLoadingReadback}
        error={null}
      />
    </section>
  );
}
