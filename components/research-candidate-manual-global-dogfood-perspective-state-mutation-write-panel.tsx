"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReadbackPanel } from "@/components/research-candidate-manual-global-dogfood-perspective-state-mutation-readback-panel";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationContract } from "@/types/research-candidate-manual-global-dogfood-perspective-state-mutation-contract";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReview } from "@/types/research-candidate-manual-global-dogfood-perspective-state-mutation-review";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveApplyReadback } from "@/types/research-candidate-manual-global-dogfood-perspective-apply-write";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_MUTATION_ROLLBACK_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_MUTATION_WRITE_CONFIRMATION,
  type ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReadback,
  type ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationWriteResult,
} from "@/types/research-candidate-manual-global-dogfood-perspective-state-mutation-write";

const routePath =
  "/api/research-candidate-review/manual-global-dogfood-perspective-state-mutation";
const sourcePerspectiveApplyRoutePath =
  "/api/research-candidate-review/manual-global-dogfood-perspective-apply";

export function ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationWritePanel({
  perspectiveStateMutationContract,
  perspectiveStateMutationReview,
}: {
  perspectiveStateMutationContract: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationContract;
  perspectiveStateMutationReview: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReview;
}) {
  const [confirmationText, setConfirmationText] = useState("");
  const [writeResult, setWriteResult] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationWriteResult | null>(
      null,
    );
  const [readback, setReadback] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReadback | null>(
      null,
    );
  const [sourcePerspectiveApplyReadback, setSourcePerspectiveApplyReadback] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveApplyReadback | null>(
      null,
    );
  const [isLoadingReadback, setIsLoadingReadback] = useState(false);
  const [isLoadingSourcePerspectiveApplyReadback, setIsLoadingSourcePerspectiveApplyReadback] =
    useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [rollbackReceiptId, setRollbackReceiptId] = useState("");
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollbackConfirmationText, setRollbackConfirmationText] = useState("");
  const writeEnabled =
    confirmationText ===
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_MUTATION_WRITE_CONFIRMATION &&
    Boolean(sourcePerspectiveApplyReadback?.latest_active_committed);
  const latestReceiptId =
    writeResult?.receipt?.receipt_id ??
    readback?.latest_active_committed?.receipt.receipt_id ??
    "";
  const effectiveRollbackReceiptId = rollbackReceiptId.trim() || latestReceiptId;
  const rollbackEnabled =
    effectiveRollbackReceiptId.length > 0 &&
    rollbackReason.trim().length > 0 &&
    rollbackConfirmationText ===
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_MUTATION_ROLLBACK_CONFIRMATION;
  const writeRequest = useMemo(
    () => ({
      perspective_state_mutation_contract: perspectiveStateMutationContract,
      perspective_state_mutation_review: perspectiveStateMutationReview,
      source_perspective_apply_readback: sourcePerspectiveApplyReadback,
      operator_authorization: {
        authorization_kind: "manual_operator_authorized_perspective_state_mutation_write",
        operator_confirmation_text: confirmationText,
        write_mode: "commit",
      },
    }),
    [
      confirmationText,
      perspectiveStateMutationContract,
      perspectiveStateMutationReview,
      sourcePerspectiveApplyReadback,
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
        readback?: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReadback;
        error_code?: string;
      };
      if (!response.ok || payload.ok !== true || !payload.readback) {
        throw new Error(payload.error_code ?? "perspective_state_mutation_readback_failed");
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

  const refreshSourcePerspectiveApplyReadback = useCallback(async () => {
    setIsLoadingSourcePerspectiveApplyReadback(true);
    setRuntimeError(null);
    try {
      const response = await fetch(`${sourcePerspectiveApplyRoutePath}?limit=10`, {
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
        throw new Error(
          payload.error_code ?? "source_perspective_apply_readback_failed",
        );
      }
      setSourcePerspectiveApplyReadback(payload.readback);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingSourcePerspectiveApplyReadback(false);
    }
  }, []);

  useEffect(() => {
    void refreshSourcePerspectiveApplyReadback();
  }, [refreshSourcePerspectiveApplyReadback]);

  async function writePerspectiveStateMutationRecord() {
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
        result?: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationWriteResult;
        error_code?: string;
      };
      if (!payload.result) {
        throw new Error(payload.error_code ?? "perspective_state_mutation_write_failed");
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

  async function rollbackPerspectiveStateMutationReceipt() {
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
                "manual_operator_authorized_perspective_state_mutation_rollback",
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
          readback?: ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReadback | null;
        };
        error_code?: string;
      };
      if (!response.ok || payload.ok !== true) {
        throw new Error(
          payload.result?.refusal_reasons?.join(", ") ??
            payload.error_code ??
            "perspective_state_mutation_rollback_failed",
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
      className="perspective-inspector-section manual-global-dogfood-perspective-state-mutation-write"
      aria-label="Authorized manual global dogfood Perspective state mutation write"
      data-augnes-authority="authorized-manual-perspective-state-mutation-write no-current-working-perspective no-canonical-state no-promotion no-memory no-work no-proof no-metrics"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Authorized Perspective State Mutation Write</p>
          <h4>Write Perspective state mutation record</h4>
          <p>
            This writes only a manual-derived Perspective state mutation
            record/receipt/readback/rollback metadata. It does not update
            current working Perspective, directly mutate existing canonical
            Perspective state tables, promote Perspective, write Perspective Memory, create or
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
          perspective_state_mutation_contract_fingerprint{" "}
          <code>{perspectiveStateMutationContract.validation.contract_fingerprint}</code>
        </span>
        <span>
          perspective_state_mutation_review_fingerprint{" "}
          <code>{perspectiveStateMutationReview.validation.review_fingerprint}</code>
        </span>
        <span>
          source_perspective_apply_receipt{" "}
          <code>
            {sourcePerspectiveApplyReadback?.latest_active_committed?.receipt.receipt_id ??
              perspectiveStateMutationContract.source_perspective_apply_receipt_id ??
              "none"}
          </code>
        </span>
        <span>
          source_perspective_apply_record{" "}
          <code>
            {sourcePerspectiveApplyReadback?.latest_active_committed
              ?.perspective_apply_record
              ?.perspective_apply_record_id ??
              perspectiveStateMutationContract.source_perspective_apply_record_id ??
              "none"}
          </code>
        </span>
        <span>
          source_perspective_relay_receipt{" "}
          <code>{perspectiveStateMutationContract.source_perspective_relay_receipt_id ?? "none"}</code>
        </span>
        <span>
          source_perspective_relay_record{" "}
          <code>{perspectiveStateMutationContract.source_perspective_relay_record_id ?? "none"}</code>
        </span>
        <span>
          source_next_work_signal_receipt{" "}
          <code>
            {perspectiveStateMutationContract.source_next_work_signal_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_signal_record{" "}
          <code>
            {perspectiveStateMutationContract.source_next_work_signal_record_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_bias_receipt{" "}
          <code>
            {perspectiveStateMutationContract.source_next_work_bias_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_bias_record{" "}
          <code>
            {perspectiveStateMutationContract.source_next_work_bias_record_id ??
              "none"}
          </code>
        </span>
        <span>
          source_projection_fingerprint{" "}
          <code>{perspectiveStateMutationContract.source_projection_fingerprint}</code>
        </span>
        <span>
          source_metric_snapshot_receipt{" "}
          <code>{perspectiveStateMutationContract.source_metric_snapshot_receipt_id ?? "none"}</code>
        </span>
        <span>
          proposed_idempotency_key{" "}
          <code>
            {
              perspectiveStateMutationContract.idempotency_contract_preview
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
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_MUTATION_WRITE_CONFIRMATION
            }
          </code>
        </p>
        <label>
          Confirmation
          <input
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder={
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_MUTATION_WRITE_CONFIRMATION
            }
          />
        </label>
        <div className="perspective-workbench-status-row">
          <button
            type="button"
            disabled={!writeEnabled || isWriting}
            onClick={writePerspectiveStateMutationRecord}
          >
            {isWriting
              ? "Writing Perspective state mutation record"
              : "Write Perspective state mutation record"}
          </button>
          <button type="button" onClick={refreshReadback} disabled={isLoadingReadback}>
            Refresh Perspective state mutation readback
          </button>
          <button
            type="button"
            onClick={refreshSourcePerspectiveApplyReadback}
            disabled={isLoadingSourcePerspectiveApplyReadback}
          >
            Refresh source Perspective apply readback
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
                {writeResult.perspective_state_mutation_record?.perspective_state_mutation_record_id ??
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
          Rollback marks the Perspective state mutation receipt rolled_back and keeps the
          Perspective state mutation record row for audit readback.
        </p>
        <p className="manual-note-runtime-hint">
          Exact rollback authorization text required:{" "}
          <code>
            {
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_MUTATION_ROLLBACK_CONFIRMATION
            }
          </code>
        </p>
        <label>
          Receipt id
          <input
            value={rollbackReceiptId}
            onChange={(event) => setRollbackReceiptId(event.target.value)}
            placeholder={
              latestReceiptId || "manual-global-dogfood-perspective-state-mutation-receipt:..."
            }
          />
        </label>
        <label>
          Rollback reason
          <input
            value={rollbackReason}
            onChange={(event) => setRollbackReason(event.target.value)}
            placeholder="Operator requested rollback of this Perspective state mutation receipt."
          />
        </label>
        <label>
          Exact rollback authorization text
          <input
            value={rollbackConfirmationText}
            onChange={(event) => setRollbackConfirmationText(event.target.value)}
            placeholder={
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_MUTATION_ROLLBACK_CONFIRMATION
            }
          />
        </label>
        <button
          type="button"
          disabled={!rollbackEnabled || isRollingBack}
          onClick={rollbackPerspectiveStateMutationReceipt}
        >
          {isRollingBack
            ? "Rolling back Perspective state mutation receipt"
            : "Rollback Perspective state mutation receipt"}
        </button>
      </section>

      {runtimeError ? (
        <p className="manual-note-runtime-error" role="alert">
          {runtimeError}
        </p>
      ) : null}

      <ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReadbackPanel
        readback={readback}
        isLoading={isLoadingReadback}
        error={null}
      />
    </section>
  );
}
