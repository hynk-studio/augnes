"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ResearchCandidateManualGlobalDogfoodPerspectiveApplyReadbackPanel } from "@/components/research-candidate-manual-global-dogfood-perspective-apply-readback-panel";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract } from "@/types/research-candidate-manual-global-dogfood-perspective-apply-contract";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveApplyReview } from "@/types/research-candidate-manual-global-dogfood-perspective-apply-review";
import type { ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback } from "@/types/research-candidate-manual-global-dogfood-canonical-perspective-update-write";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_ROLLBACK_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_WRITE_CONFIRMATION,
  type ResearchCandidateManualGlobalDogfoodPerspectiveApplyReadback,
  type ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteResult,
} from "@/types/research-candidate-manual-global-dogfood-perspective-apply-write";

const routePath =
  "/api/research-candidate-review/manual-global-dogfood-perspective-apply";
const sourceCanonicalUpdateRoutePath =
  "/api/research-candidate-review/manual-global-dogfood-canonical-perspective-update";

export function ResearchCandidateManualGlobalDogfoodPerspectiveApplyWritePanel({
  perspectiveApplyContract,
  perspectiveApplyReview,
}: {
  perspectiveApplyContract: ResearchCandidateManualGlobalDogfoodPerspectiveApplyContract;
  perspectiveApplyReview: ResearchCandidateManualGlobalDogfoodPerspectiveApplyReview;
}) {
  const [confirmationText, setConfirmationText] = useState("");
  const [writeResult, setWriteResult] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteResult | null>(
      null,
    );
  const [readback, setReadback] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveApplyReadback | null>(
      null,
    );
  const [sourceCanonicalUpdateReadback, setSourceCanonicalUpdateReadback] =
    useState<ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback | null>(
      null,
    );
  const [isLoadingReadback, setIsLoadingReadback] = useState(false);
  const [isLoadingSourceCanonicalUpdateReadback, setIsLoadingSourceCanonicalUpdateReadback] =
    useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [rollbackReceiptId, setRollbackReceiptId] = useState("");
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollbackConfirmationText, setRollbackConfirmationText] = useState("");
  const writeEnabled =
    confirmationText ===
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_WRITE_CONFIRMATION &&
    Boolean(sourceCanonicalUpdateReadback?.latest_active_committed);
  const latestReceiptId =
    writeResult?.receipt?.receipt_id ??
    readback?.latest_active_committed?.receipt.receipt_id ??
    "";
  const effectiveRollbackReceiptId = rollbackReceiptId.trim() || latestReceiptId;
  const rollbackEnabled =
    effectiveRollbackReceiptId.length > 0 &&
    rollbackReason.trim().length > 0 &&
    rollbackConfirmationText ===
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_ROLLBACK_CONFIRMATION;
  const writeRequest = useMemo(
    () => ({
      perspective_apply_contract: perspectiveApplyContract,
      perspective_apply_review: perspectiveApplyReview,
      source_canonical_perspective_update_readback: sourceCanonicalUpdateReadback,
      operator_authorization: {
        authorization_kind: "manual_operator_authorized_perspective_apply_write",
        operator_confirmation_text: confirmationText,
        write_mode: "commit",
      },
    }),
    [
      confirmationText,
      perspectiveApplyContract,
      perspectiveApplyReview,
      sourceCanonicalUpdateReadback,
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
        readback?: ResearchCandidateManualGlobalDogfoodPerspectiveApplyReadback;
        error_code?: string;
      };
      if (!response.ok || payload.ok !== true || !payload.readback) {
        throw new Error(payload.error_code ?? "perspective_apply_readback_failed");
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

  const refreshSourceCanonicalUpdateReadback = useCallback(async () => {
    setIsLoadingSourceCanonicalUpdateReadback(true);
    setRuntimeError(null);
    try {
      const response = await fetch(`${sourceCanonicalUpdateRoutePath}?limit=10`, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        readback?: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback;
        error_code?: string;
      };
      if (!response.ok || payload.ok !== true || !payload.readback) {
        throw new Error(
          payload.error_code ?? "source_canonical_perspective_update_readback_failed",
        );
      }
      setSourceCanonicalUpdateReadback(payload.readback);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingSourceCanonicalUpdateReadback(false);
    }
  }, []);

  useEffect(() => {
    void refreshSourceCanonicalUpdateReadback();
  }, [refreshSourceCanonicalUpdateReadback]);

  async function writePerspectiveApplyRecord() {
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
        result?: ResearchCandidateManualGlobalDogfoodPerspectiveApplyWriteResult;
        error_code?: string;
      };
      if (!payload.result) {
        throw new Error(payload.error_code ?? "perspective_apply_write_failed");
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

  async function rollbackPerspectiveApplyReceipt() {
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
                "manual_operator_authorized_perspective_apply_rollback",
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
          readback?: ResearchCandidateManualGlobalDogfoodPerspectiveApplyReadback | null;
        };
        error_code?: string;
      };
      if (!response.ok || payload.ok !== true) {
        throw new Error(
          payload.result?.refusal_reasons?.join(", ") ??
            payload.error_code ??
            "perspective_apply_rollback_failed",
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
      className="perspective-inspector-section manual-global-dogfood-perspective-apply-write"
      aria-label="Authorized manual global dogfood Perspective apply write"
      data-augnes-authority="authorized-manual-perspective-apply-write no-current-working-perspective no-canonical-state no-promotion no-memory no-work no-proof no-metrics"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Authorized Perspective Apply Write</p>
          <h4>Write Perspective apply record</h4>
          <p>
            This writes only a manual-derived Perspective apply
            record/receipt/readback/rollback metadata. It does not update
            current working Perspective, directly write canonical Perspective
            state, promote Perspective, write Perspective Memory, create or
            mutate work, write proof/evidence, dogfood metrics, product state,
            or source records.
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
          perspective_apply_contract_fingerprint{" "}
          <code>{perspectiveApplyContract.validation.contract_fingerprint}</code>
        </span>
        <span>
          perspective_apply_review_fingerprint{" "}
          <code>{perspectiveApplyReview.validation.review_fingerprint}</code>
        </span>
        <span>
          source_canonical_perspective_update_receipt{" "}
          <code>
            {sourceCanonicalUpdateReadback?.latest_active_committed?.receipt.receipt_id ??
              perspectiveApplyContract.source_canonical_perspective_update_receipt_id ??
              "none"}
          </code>
        </span>
        <span>
          source_canonical_perspective_update_record{" "}
          <code>
            {sourceCanonicalUpdateReadback?.latest_active_committed
              ?.canonical_perspective_update_record
              ?.canonical_perspective_update_record_id ??
              perspectiveApplyContract.source_canonical_perspective_update_record_id ??
              "none"}
          </code>
        </span>
        <span>
          source_perspective_relay_receipt{" "}
          <code>{perspectiveApplyContract.source_perspective_relay_receipt_id ?? "none"}</code>
        </span>
        <span>
          source_perspective_relay_record{" "}
          <code>{perspectiveApplyContract.source_perspective_relay_record_id ?? "none"}</code>
        </span>
        <span>
          source_next_work_signal_receipt{" "}
          <code>
            {perspectiveApplyContract.source_next_work_signal_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_signal_record{" "}
          <code>
            {perspectiveApplyContract.source_next_work_signal_record_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_bias_receipt{" "}
          <code>
            {perspectiveApplyContract.source_next_work_bias_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_bias_record{" "}
          <code>
            {perspectiveApplyContract.source_next_work_bias_record_id ??
              "none"}
          </code>
        </span>
        <span>
          source_projection_fingerprint{" "}
          <code>{perspectiveApplyContract.source_projection_fingerprint}</code>
        </span>
        <span>
          source_metric_snapshot_receipt{" "}
          <code>{perspectiveApplyContract.source_metric_snapshot_receipt_id ?? "none"}</code>
        </span>
        <span>
          proposed_idempotency_key{" "}
          <code>
            {
              perspectiveApplyContract.idempotency_contract_preview
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
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_WRITE_CONFIRMATION
            }
          </code>
        </p>
        <label>
          Confirmation
          <input
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder={
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_WRITE_CONFIRMATION
            }
          />
        </label>
        <div className="perspective-workbench-status-row">
          <button
            type="button"
            disabled={!writeEnabled || isWriting}
            onClick={writePerspectiveApplyRecord}
          >
            {isWriting
              ? "Writing Perspective apply record"
              : "Write Perspective apply record"}
          </button>
          <button type="button" onClick={refreshReadback} disabled={isLoadingReadback}>
            Refresh Perspective apply readback
          </button>
          <button
            type="button"
            onClick={refreshSourceCanonicalUpdateReadback}
            disabled={isLoadingSourceCanonicalUpdateReadback}
          >
            Refresh source canonical update readback
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
                {writeResult.perspective_apply_record?.perspective_apply_record_id ??
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
          Rollback marks the Perspective apply receipt rolled_back and keeps the
          Perspective apply record row for audit readback.
        </p>
        <p className="manual-note-runtime-hint">
          Exact rollback authorization text required:{" "}
          <code>
            {
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_ROLLBACK_CONFIRMATION
            }
          </code>
        </p>
        <label>
          Receipt id
          <input
            value={rollbackReceiptId}
            onChange={(event) => setRollbackReceiptId(event.target.value)}
            placeholder={
              latestReceiptId || "manual-global-dogfood-perspective-apply-receipt:..."
            }
          />
        </label>
        <label>
          Rollback reason
          <input
            value={rollbackReason}
            onChange={(event) => setRollbackReason(event.target.value)}
            placeholder="Operator requested rollback of this Perspective apply receipt."
          />
        </label>
        <label>
          Exact rollback authorization text
          <input
            value={rollbackConfirmationText}
            onChange={(event) => setRollbackConfirmationText(event.target.value)}
            placeholder={
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_APPLY_ROLLBACK_CONFIRMATION
            }
          />
        </label>
        <button
          type="button"
          disabled={!rollbackEnabled || isRollingBack}
          onClick={rollbackPerspectiveApplyReceipt}
        >
          {isRollingBack
            ? "Rolling back Perspective apply receipt"
            : "Rollback Perspective apply receipt"}
        </button>
      </section>

      {runtimeError ? (
        <p className="manual-note-runtime-error" role="alert">
          {runtimeError}
        </p>
      ) : null}

      <ResearchCandidateManualGlobalDogfoodPerspectiveApplyReadbackPanel
        readback={readback}
        isLoading={isLoadingReadback}
        error={null}
      />
    </section>
  );
}
