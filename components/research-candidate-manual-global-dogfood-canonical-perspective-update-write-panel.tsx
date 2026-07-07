"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadbackPanel } from "@/components/research-candidate-manual-global-dogfood-canonical-perspective-update-readback-panel";
import type { ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract } from "@/types/research-candidate-manual-global-dogfood-canonical-perspective-update-contract";
import type { ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview } from "@/types/research-candidate-manual-global-dogfood-canonical-perspective-update-review";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback } from "@/types/research-candidate-manual-global-dogfood-perspective-relay-write";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_ROLLBACK_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_WRITE_CONFIRMATION,
  type ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback,
  type ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteResult,
} from "@/types/research-candidate-manual-global-dogfood-canonical-perspective-update-write";

const routePath =
  "/api/research-candidate-review/manual-global-dogfood-canonical-perspective-update";
const sourceRelayRoutePath =
  "/api/research-candidate-review/manual-global-dogfood-perspective-relay";

export function ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWritePanel({
  canonicalPerspectiveUpdateContract,
  canonicalPerspectiveUpdateReview,
}: {
  canonicalPerspectiveUpdateContract: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateContract;
  canonicalPerspectiveUpdateReview: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReview;
}) {
  const [confirmationText, setConfirmationText] = useState("");
  const [writeResult, setWriteResult] =
    useState<ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteResult | null>(
      null,
    );
  const [readback, setReadback] =
    useState<ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback | null>(
      null,
    );
  const [sourceRelayReadback, setSourceRelayReadback] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveRelayReadback | null>(
      null,
    );
  const [isLoadingReadback, setIsLoadingReadback] = useState(false);
  const [isLoadingSourceRelayReadback, setIsLoadingSourceRelayReadback] =
    useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [rollbackReceiptId, setRollbackReceiptId] = useState("");
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollbackConfirmationText, setRollbackConfirmationText] = useState("");
  const writeEnabled =
    confirmationText ===
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_WRITE_CONFIRMATION &&
    Boolean(sourceRelayReadback?.latest_active_committed);
  const latestReceiptId =
    writeResult?.receipt?.receipt_id ??
    readback?.latest_active_committed?.receipt.receipt_id ??
    "";
  const effectiveRollbackReceiptId = rollbackReceiptId.trim() || latestReceiptId;
  const rollbackEnabled =
    effectiveRollbackReceiptId.length > 0 &&
    rollbackReason.trim().length > 0 &&
    rollbackConfirmationText ===
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_ROLLBACK_CONFIRMATION;
  const writeRequest = useMemo(
    () => ({
      canonical_perspective_update_contract: canonicalPerspectiveUpdateContract,
      canonical_perspective_update_review: canonicalPerspectiveUpdateReview,
      source_perspective_relay_readback: sourceRelayReadback,
      operator_authorization: {
        authorization_kind: "manual_operator_authorized_canonical_perspective_update_write",
        operator_confirmation_text: confirmationText,
        write_mode: "commit",
      },
    }),
    [
      confirmationText,
      canonicalPerspectiveUpdateContract,
      canonicalPerspectiveUpdateReview,
      sourceRelayReadback,
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
        readback?: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback;
        error_code?: string;
      };
      if (!response.ok || payload.ok !== true || !payload.readback) {
        throw new Error(payload.error_code ?? "canonical_perspective_update_readback_failed");
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

  const refreshSourceRelayReadback = useCallback(async () => {
    setIsLoadingSourceRelayReadback(true);
    setRuntimeError(null);
    try {
      const response = await fetch(`${sourceRelayRoutePath}?limit=10`, {
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
        throw new Error(
          payload.error_code ?? "source_perspective_relay_readback_failed",
        );
      }
      setSourceRelayReadback(payload.readback);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingSourceRelayReadback(false);
    }
  }, []);

  useEffect(() => {
    void refreshSourceRelayReadback();
  }, [refreshSourceRelayReadback]);

  async function writeCanonicalPerspectiveUpdateRecord() {
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
        result?: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateWriteResult;
        error_code?: string;
      };
      if (!payload.result) {
        throw new Error(payload.error_code ?? "canonical_perspective_update_write_failed");
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

  async function rollbackCanonicalPerspectiveUpdateReceipt() {
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
                "manual_operator_authorized_canonical_perspective_update_rollback",
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
          readback?: ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadback | null;
        };
        error_code?: string;
      };
      if (!response.ok || payload.ok !== true) {
        throw new Error(
          payload.result?.refusal_reasons?.join(", ") ??
            payload.error_code ??
            "canonical_perspective_update_rollback_failed",
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
      className="perspective-inspector-section manual-global-dogfood-canonical-perspective-update-write"
      aria-label="Authorized manual global dogfood canonical Perspective update write"
      data-augnes-authority="authorized-manual-canonical-perspective-update-write no-current-working-perspective no-promotion no-memory no-work no-proof no-metrics"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Authorized Canonical Update Write</p>
          <h4>Write canonical Perspective update record</h4>
          <p>
            This writes only a manual-derived canonical Perspective update
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
          canonical_perspective_update_contract_fingerprint{" "}
          <code>{canonicalPerspectiveUpdateContract.validation.contract_fingerprint}</code>
        </span>
        <span>
          canonical_perspective_update_review_fingerprint{" "}
          <code>{canonicalPerspectiveUpdateReview.validation.review_fingerprint}</code>
        </span>
        <span>
          source_perspective_relay_receipt{" "}
          <code>
            {sourceRelayReadback?.latest_active_committed?.receipt.receipt_id ??
              canonicalPerspectiveUpdateContract.source_perspective_relay_receipt_id ??
              "none"}
          </code>
        </span>
        <span>
          source_perspective_relay_record{" "}
          <code>
            {sourceRelayReadback?.latest_active_committed
              ?.perspective_relay_record?.perspective_relay_record_id ??
              canonicalPerspectiveUpdateContract.source_perspective_relay_record_id ??
              "none"}
          </code>
        </span>
        <span>
          source_next_work_signal_receipt{" "}
          <code>
            {canonicalPerspectiveUpdateContract.source_next_work_signal_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_signal_record{" "}
          <code>
            {canonicalPerspectiveUpdateContract.source_next_work_signal_record_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_bias_receipt{" "}
          <code>
            {canonicalPerspectiveUpdateContract.source_next_work_bias_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_bias_record{" "}
          <code>
            {canonicalPerspectiveUpdateContract.source_next_work_bias_record_id ??
              "none"}
          </code>
        </span>
        <span>
          source_projection_fingerprint{" "}
          <code>{canonicalPerspectiveUpdateContract.source_projection_fingerprint}</code>
        </span>
        <span>
          source_metric_snapshot_receipt{" "}
          <code>{canonicalPerspectiveUpdateContract.source_metric_snapshot_receipt_id ?? "none"}</code>
        </span>
        <span>
          proposed_idempotency_key{" "}
          <code>
            {
              canonicalPerspectiveUpdateContract.idempotency_contract_preview
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
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_WRITE_CONFIRMATION
            }
          </code>
        </p>
        <label>
          Confirmation
          <input
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder={
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_WRITE_CONFIRMATION
            }
          />
        </label>
        <div className="perspective-workbench-status-row">
          <button
            type="button"
            disabled={!writeEnabled || isWriting}
            onClick={writeCanonicalPerspectiveUpdateRecord}
          >
            {isWriting
              ? "Writing canonical Perspective update record"
              : "Write canonical Perspective update record"}
          </button>
          <button type="button" onClick={refreshReadback} disabled={isLoadingReadback}>
            Refresh canonical Perspective update readback
          </button>
          <button
            type="button"
            onClick={refreshSourceRelayReadback}
            disabled={isLoadingSourceRelayReadback}
          >
            Refresh source relay readback
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
                {writeResult.canonical_perspective_update_record?.canonical_perspective_update_record_id ??
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
          Rollback marks the canonical Perspective update receipt rolled_back and keeps the
          canonical update record row for audit readback.
        </p>
        <p className="manual-note-runtime-hint">
          Exact rollback authorization text required:{" "}
          <code>
            {
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_ROLLBACK_CONFIRMATION
            }
          </code>
        </p>
        <label>
          Receipt id
          <input
            value={rollbackReceiptId}
            onChange={(event) => setRollbackReceiptId(event.target.value)}
            placeholder={
              latestReceiptId || "manual-global-dogfood-canonical-perspective-update-receipt:..."
            }
          />
        </label>
        <label>
          Rollback reason
          <input
            value={rollbackReason}
            onChange={(event) => setRollbackReason(event.target.value)}
            placeholder="Operator requested rollback of this canonical Perspective update receipt."
          />
        </label>
        <label>
          Exact rollback authorization text
          <input
            value={rollbackConfirmationText}
            onChange={(event) => setRollbackConfirmationText(event.target.value)}
            placeholder={
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_CANONICAL_PERSPECTIVE_UPDATE_ROLLBACK_CONFIRMATION
            }
          />
        </label>
        <button
          type="button"
          disabled={!rollbackEnabled || isRollingBack}
          onClick={rollbackCanonicalPerspectiveUpdateReceipt}
        >
          {isRollingBack
            ? "Rolling back canonical Perspective update receipt"
            : "Rollback canonical Perspective update receipt"}
        </button>
      </section>

      {runtimeError ? (
        <p className="manual-note-runtime-error" role="alert">
          {runtimeError}
        </p>
      ) : null}

      <ResearchCandidateManualGlobalDogfoodCanonicalPerspectiveUpdateReadbackPanel
        readback={readback}
        isLoading={isLoadingReadback}
        error={null}
      />
    </section>
  );
}
