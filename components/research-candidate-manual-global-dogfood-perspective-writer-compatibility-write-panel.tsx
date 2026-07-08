"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReadbackPanel } from "@/components/research-candidate-manual-global-dogfood-perspective-writer-compatibility-readback-panel";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract } from "@/types/research-candidate-manual-global-dogfood-perspective-writer-compatibility-contract";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReview } from "@/types/research-candidate-manual-global-dogfood-perspective-writer-compatibility-review";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback } from "@/types/research-candidate-manual-global-dogfood-perspective-state-application-write";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_ROLLBACK_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_WRITE_CONFIRMATION,
  type ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReadback,
  type ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteResult,
} from "@/types/research-candidate-manual-global-dogfood-perspective-writer-compatibility-write";

const routePath =
  "/api/research-candidate-review/manual-global-dogfood-perspective-writer-compatibility";
const sourcePerspectiveStateApplicationRoutePath =
  "/api/research-candidate-review/manual-global-dogfood-perspective-state-application";

export function ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWritePanel({
  perspectiveWriterCompatibilityContract,
  perspectiveWriterCompatibilityReview,
}: {
  perspectiveWriterCompatibilityContract: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityContract;
  perspectiveWriterCompatibilityReview: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReview;
}) {
  const [confirmationText, setConfirmationText] = useState("");
  const [writeResult, setWriteResult] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteResult | null>(
      null,
    );
  const [readback, setReadback] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReadback | null>(
      null,
    );
  const [
    sourcePerspectiveStateApplicationReadback,
    setSourcePerspectiveStateApplicationReadback,
  ] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback | null>(
      null,
    );
  const [isLoadingReadback, setIsLoadingReadback] = useState(false);
  const [
    isLoadingSourcePerspectiveStateApplicationReadback,
    setIsLoadingSourcePerspectiveStateApplicationReadback,
  ] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [rollbackReceiptId, setRollbackReceiptId] = useState("");
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollbackConfirmationText, setRollbackConfirmationText] = useState("");
  const writeEnabled =
    confirmationText ===
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_WRITE_CONFIRMATION &&
    Boolean(sourcePerspectiveStateApplicationReadback?.latest_active_committed) &&
    perspectiveWriterCompatibilityReview.review_status ===
      "ready_for_future_perspective_writer_compatibility_write_slice" &&
    perspectiveWriterCompatibilityReview.operator_decision ===
      "accept_contract_for_future_perspective_writer_compatibility_write_slice" &&
    perspectiveWriterCompatibilityReview.source_contract_fingerprint ===
      perspectiveWriterCompatibilityContract.validation.contract_fingerprint &&
    perspectiveWriterCompatibilityReview.accepted_mapping_summary?.proposed_idempotency_key ===
      perspectiveWriterCompatibilityContract.idempotency_contract_preview.proposed_idempotency_key &&
    perspectiveWriterCompatibilityReview.accepted_mapping_summary?.source_handoff_seed_fingerprint ===
      perspectiveWriterCompatibilityContract.source_handoff_seed_fingerprint &&
    perspectiveWriterCompatibilityReview.accepted_mapping_summary?.source_result_text_fingerprint ===
      perspectiveWriterCompatibilityContract.source_result_text_fingerprint &&
    perspectiveWriterCompatibilityReview.accepted_mapping_summary
      ?.source_perspective_state_application_receipt_id ===
      perspectiveWriterCompatibilityContract.source_perspective_state_application_receipt_id &&
    perspectiveWriterCompatibilityReview.accepted_mapping_summary
      ?.source_perspective_state_application_record_fingerprint ===
      perspectiveWriterCompatibilityContract.source_perspective_state_application_record_fingerprint;
  const latestReceiptId =
    writeResult?.receipt?.receipt_id ??
    readback?.latest_active_committed?.receipt.receipt_id ??
    "";
  const effectiveRollbackReceiptId = rollbackReceiptId.trim() || latestReceiptId;
  const rollbackEnabled =
    effectiveRollbackReceiptId.length > 0 &&
    rollbackReason.trim().length > 0 &&
    rollbackConfirmationText ===
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_ROLLBACK_CONFIRMATION;
  const writeRequest = useMemo(
    () => ({
      perspective_writer_compatibility_contract: perspectiveWriterCompatibilityContract,
      perspective_writer_compatibility_review: perspectiveWriterCompatibilityReview,
      source_perspective_state_application_readback:
        sourcePerspectiveStateApplicationReadback,
      operator_authorization: {
        authorization_kind: "manual_operator_authorized_perspective_writer_compatibility_write",
        operator_confirmation_text: confirmationText,
        write_mode: "commit",
      },
    }),
    [
      confirmationText,
      perspectiveWriterCompatibilityContract,
      perspectiveWriterCompatibilityReview,
      sourcePerspectiveStateApplicationReadback,
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
        readback?: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReadback;
        error_code?: string;
      };
      if (!response.ok || payload.ok !== true || !payload.readback) {
        throw new Error(payload.error_code ?? "perspective_writer_compatibility_readback_failed");
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

  const refreshSourcePerspectiveStateApplicationReadback = useCallback(async () => {
    setIsLoadingSourcePerspectiveStateApplicationReadback(true);
    setRuntimeError(null);
    try {
      const response = await fetch(
        `${sourcePerspectiveStateApplicationRoutePath}?limit=10`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
      );
      const payload = (await response.json()) as {
        ok?: boolean;
        readback?: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback;
        error_code?: string;
      };
      if (!response.ok || payload.ok !== true || !payload.readback) {
        throw new Error(
          payload.error_code ?? "source_perspective_state_application_readback_failed",
        );
      }
      setSourcePerspectiveStateApplicationReadback(payload.readback);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingSourcePerspectiveStateApplicationReadback(false);
    }
  }, []);

  useEffect(() => {
    void refreshSourcePerspectiveStateApplicationReadback();
  }, [refreshSourcePerspectiveStateApplicationReadback]);

  async function writePerspectiveWriterCompatibilityRecord() {
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
        result?: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityWriteResult;
        error_code?: string;
      };
      if (!payload.result) {
        throw new Error(payload.error_code ?? "perspective_writer_compatibility_write_failed");
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

  async function rollbackPerspectiveWriterCompatibilityReceipt() {
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
                "manual_operator_authorized_perspective_writer_compatibility_rollback",
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
          readback?: ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReadback | null;
        };
        error_code?: string;
      };
      if (!response.ok || payload.ok !== true) {
        throw new Error(
          payload.result?.refusal_reasons?.join(", ") ??
            payload.error_code ??
            "perspective_writer_compatibility_rollback_failed",
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
      className="perspective-inspector-section manual-global-dogfood-perspective-writer-compatibility-write"
      aria-label="Authorized manual global dogfood Perspective writer compatibility write"
      data-augnes-authority="authorized-manual-perspective-writer-compatibility-write no-existing-writer-call no-current-working-perspective no-canonical-state no-promotion no-memory no-work no-proof no-metrics"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Authorized Perspective Writer Compatibility Write</p>
          <h4>Write Perspective writer compatibility record</h4>
          <p>
            This writes only a manual-derived Perspective writer compatibility
            record/receipt/readback/rollback metadata. It does not call
            existing current-working/canonical writers, update current-working
            Perspective, mutate existing canonical Perspective state tables,
            promote Perspective, write Perspective Memory, create or mutate
            work, write proof/evidence, dogfood metrics, product state, or
            source records.
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
          perspective_writer_compatibility_contract_fingerprint{" "}
          <code>{perspectiveWriterCompatibilityContract.validation.contract_fingerprint}</code>
        </span>
        <span>
          perspective_writer_compatibility_review_fingerprint{" "}
          <code>{perspectiveWriterCompatibilityReview.validation.review_fingerprint}</code>
        </span>
        <span>
          source_perspective_state_application_receipt{" "}
          <code>
            {sourcePerspectiveStateApplicationReadback?.latest_active_committed?.receipt.receipt_id ??
              perspectiveWriterCompatibilityContract.source_perspective_state_application_receipt_id ??
              "none"}
          </code>
        </span>
        <span>
          source_perspective_state_application_record{" "}
          <code>
            {sourcePerspectiveStateApplicationReadback?.latest_active_committed
              ?.perspective_state_application_record
              ?.perspective_state_application_record_id ??
              perspectiveWriterCompatibilityContract.source_perspective_state_application_record_id ??
              "none"}
          </code>
        </span>
        <span>
          source_perspective_state_mutation_receipt{" "}
          <code>
            {perspectiveWriterCompatibilityContract.source_perspective_state_mutation_receipt_id ??
              "none"}
          </code>
        </span>
        <span>
          source_perspective_state_mutation_record{" "}
          <code>
            {perspectiveWriterCompatibilityContract.source_perspective_state_mutation_record_id ??
              "none"}
          </code>
        </span>
        <span>
          source_perspective_relay_receipt{" "}
          <code>{perspectiveWriterCompatibilityContract.source_perspective_relay_receipt_id ?? "none"}</code>
        </span>
        <span>
          source_perspective_relay_record{" "}
          <code>{perspectiveWriterCompatibilityContract.source_perspective_relay_record_id ?? "none"}</code>
        </span>
        <span>
          source_next_work_signal_receipt{" "}
          <code>
            {perspectiveWriterCompatibilityContract.source_next_work_signal_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_signal_record{" "}
          <code>
            {perspectiveWriterCompatibilityContract.source_next_work_signal_record_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_bias_receipt{" "}
          <code>
            {perspectiveWriterCompatibilityContract.source_next_work_bias_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_bias_record{" "}
          <code>
            {perspectiveWriterCompatibilityContract.source_next_work_bias_record_id ??
              "none"}
          </code>
        </span>
        <span>
          source_projection_fingerprint{" "}
          <code>{perspectiveWriterCompatibilityContract.source_projection_fingerprint}</code>
        </span>
        <span>
          source_metric_snapshot_receipt{" "}
          <code>{perspectiveWriterCompatibilityContract.source_metric_snapshot_receipt_id ?? "none"}</code>
        </span>
        <span>
          source_handoff_seed_fingerprint{" "}
          <code>{perspectiveWriterCompatibilityContract.source_handoff_seed_fingerprint ?? "none"}</code>
        </span>
        <span>
          source_result_text_fingerprint{" "}
          <code>{perspectiveWriterCompatibilityContract.source_result_text_fingerprint ?? "none"}</code>
        </span>
        <span>
          proposed_idempotency_key{" "}
          <code>
            {
              perspectiveWriterCompatibilityContract.idempotency_contract_preview
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
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_WRITE_CONFIRMATION
            }
          </code>
        </p>
        <label>
          Confirmation
          <input
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder={
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_WRITE_CONFIRMATION
            }
          />
        </label>
        <div className="perspective-workbench-status-row">
          <button
            type="button"
            disabled={!writeEnabled || isWriting}
            onClick={writePerspectiveWriterCompatibilityRecord}
          >
            {isWriting
              ? "Writing Perspective writer compatibility record"
              : "Write Perspective writer compatibility record"}
          </button>
          <button type="button" onClick={refreshReadback} disabled={isLoadingReadback}>
            Refresh Perspective writer compatibility readback
          </button>
          <button
            type="button"
            onClick={refreshSourcePerspectiveStateApplicationReadback}
            disabled={isLoadingSourcePerspectiveStateApplicationReadback}
          >
            Refresh source Perspective state application readback
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
                {writeResult.perspective_writer_compatibility_record?.perspective_writer_compatibility_record_id ??
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
          Rollback marks the Perspective writer compatibility receipt rolled_back and keeps the
          Perspective writer compatibility record row for audit readback.
        </p>
        <p className="manual-note-runtime-hint">
          Exact rollback authorization text required:{" "}
          <code>
            {
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_ROLLBACK_CONFIRMATION
            }
          </code>
        </p>
        <label>
          Receipt id
          <input
            value={rollbackReceiptId}
            onChange={(event) => setRollbackReceiptId(event.target.value)}
            placeholder={
              latestReceiptId || "manual-global-dogfood-perspective-writer-compatibility-receipt:..."
            }
          />
        </label>
        <label>
          Rollback reason
          <input
            value={rollbackReason}
            onChange={(event) => setRollbackReason(event.target.value)}
            placeholder="Operator requested rollback of this Perspective writer compatibility receipt."
          />
        </label>
        <label>
          Exact rollback authorization text
          <input
            value={rollbackConfirmationText}
            onChange={(event) => setRollbackConfirmationText(event.target.value)}
            placeholder={
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_WRITER_COMPATIBILITY_ROLLBACK_CONFIRMATION
            }
          />
        </label>
        <button
          type="button"
          disabled={!rollbackEnabled || isRollingBack}
          onClick={rollbackPerspectiveWriterCompatibilityReceipt}
        >
          {isRollingBack
            ? "Rolling back Perspective writer compatibility receipt"
            : "Rollback Perspective writer compatibility receipt"}
        </button>
      </section>

      {runtimeError ? (
        <p className="manual-note-runtime-error" role="alert">
          {runtimeError}
        </p>
      ) : null}

      <ResearchCandidateManualGlobalDogfoodPerspectiveWriterCompatibilityReadbackPanel
        readback={readback}
        isLoading={isLoadingReadback}
        error={null}
      />
    </section>
  );
}
