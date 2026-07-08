"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReadbackPanel } from "@/components/research-candidate-manual-global-dogfood-perspective-adapter-readback-panel";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract } from "@/types/research-candidate-manual-global-dogfood-perspective-adapter-contract";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReview } from "@/types/research-candidate-manual-global-dogfood-perspective-adapter-review";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReadback } from "@/types/research-candidate-manual-global-dogfood-perspective-state-mutation-write";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_ROLLBACK_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_WRITE_CONFIRMATION,
  type ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReadback,
  type ResearchCandidateManualGlobalDogfoodPerspectiveAdapterWriteResult,
} from "@/types/research-candidate-manual-global-dogfood-perspective-adapter-write";

const routePath =
  "/api/research-candidate-review/manual-global-dogfood-perspective-adapter";
const sourcePerspectiveStateMutationRoutePath =
  "/api/research-candidate-review/manual-global-dogfood-perspective-state-mutation";

export function ResearchCandidateManualGlobalDogfoodPerspectiveAdapterWritePanel({
  perspectiveAdapterContract,
  perspectiveAdapterReview,
}: {
  perspectiveAdapterContract: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterContract;
  perspectiveAdapterReview: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReview;
}) {
  const [confirmationText, setConfirmationText] = useState("");
  const [writeResult, setWriteResult] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveAdapterWriteResult | null>(
      null,
    );
  const [readback, setReadback] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReadback | null>(
      null,
    );
  const [sourcePerspectiveStateMutationReadback, setSourcePerspectiveStateMutationReadback] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveStateMutationReadback | null>(
      null,
    );
  const [isLoadingReadback, setIsLoadingReadback] = useState(false);
  const [isLoadingSourcePerspectiveStateMutationReadback, setIsLoadingSourcePerspectiveStateMutationReadback] =
    useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [rollbackReceiptId, setRollbackReceiptId] = useState("");
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollbackConfirmationText, setRollbackConfirmationText] = useState("");
  const writeEnabled =
    confirmationText ===
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_WRITE_CONFIRMATION &&
    Boolean(sourcePerspectiveStateMutationReadback?.latest_active_committed) &&
    perspectiveAdapterReview.source_contract_fingerprint ===
      perspectiveAdapterContract.validation.contract_fingerprint &&
    perspectiveAdapterReview.accepted_mapping_summary?.proposed_idempotency_key ===
      perspectiveAdapterContract.idempotency_contract_preview.proposed_idempotency_key &&
    perspectiveAdapterReview.accepted_mapping_summary?.source_handoff_seed_fingerprint ===
      perspectiveAdapterContract.source_handoff_seed_fingerprint &&
    perspectiveAdapterReview.accepted_mapping_summary?.source_result_text_fingerprint ===
      perspectiveAdapterContract.source_result_text_fingerprint;
  const latestReceiptId =
    writeResult?.receipt?.receipt_id ??
    readback?.latest_active_committed?.receipt.receipt_id ??
    "";
  const effectiveRollbackReceiptId = rollbackReceiptId.trim() || latestReceiptId;
  const rollbackEnabled =
    effectiveRollbackReceiptId.length > 0 &&
    rollbackReason.trim().length > 0 &&
    rollbackConfirmationText ===
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_ROLLBACK_CONFIRMATION;
  const writeRequest = useMemo(
    () => ({
      perspective_adapter_contract: perspectiveAdapterContract,
      perspective_adapter_review: perspectiveAdapterReview,
      source_perspective_state_mutation_readback: sourcePerspectiveStateMutationReadback,
      operator_authorization: {
        authorization_kind: "manual_operator_authorized_perspective_adapter_write",
        operator_confirmation_text: confirmationText,
        write_mode: "commit",
      },
    }),
    [
      confirmationText,
      perspectiveAdapterContract,
      perspectiveAdapterReview,
      sourcePerspectiveStateMutationReadback,
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
        readback?: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReadback;
        error_code?: string;
      };
      if (!response.ok || payload.ok !== true || !payload.readback) {
        throw new Error(payload.error_code ?? "perspective_adapter_readback_failed");
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

  const refreshSourcePerspectiveStateMutationReadback = useCallback(async () => {
    setIsLoadingSourcePerspectiveStateMutationReadback(true);
    setRuntimeError(null);
    try {
      const response = await fetch(`${sourcePerspectiveStateMutationRoutePath}?limit=10`, {
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
        throw new Error(
          payload.error_code ?? "source_perspective_state_mutation_readback_failed",
        );
      }
      setSourcePerspectiveStateMutationReadback(payload.readback);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingSourcePerspectiveStateMutationReadback(false);
    }
  }, []);

  useEffect(() => {
    void refreshSourcePerspectiveStateMutationReadback();
  }, [refreshSourcePerspectiveStateMutationReadback]);

  async function writePerspectiveAdapterRecord() {
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
        result?: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterWriteResult;
        error_code?: string;
      };
      if (!payload.result) {
        throw new Error(payload.error_code ?? "perspective_adapter_write_failed");
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

  async function rollbackPerspectiveAdapterReceipt() {
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
                "manual_operator_authorized_perspective_adapter_rollback",
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
          readback?: ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReadback | null;
        };
        error_code?: string;
      };
      if (!response.ok || payload.ok !== true) {
        throw new Error(
          payload.result?.refusal_reasons?.join(", ") ??
            payload.error_code ??
            "perspective_adapter_rollback_failed",
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
      className="perspective-inspector-section manual-global-dogfood-perspective-adapter-write"
      aria-label="Authorized manual global dogfood Perspective adapter write"
      data-augnes-authority="authorized-manual-perspective-adapter-write no-current-working-perspective no-canonical-state no-promotion no-memory no-work no-proof no-metrics"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Authorized Perspective Adapter Write</p>
          <h4>Write Perspective adapter record</h4>
          <p>
            This writes only a manual-derived Perspective adapter
            record/receipt/readback/rollback metadata. It does not update
            current-working Perspective, mutate existing canonical Perspective
            state tables, promote Perspective, write Perspective Memory, create or
            mutate work, write proof/evidence, dogfood metrics, product state,
            or source records. Existing current-working/canonical state writers
            remain compatibility-only and are not invoked here.
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
          perspective_adapter_contract_fingerprint{" "}
          <code>{perspectiveAdapterContract.validation.contract_fingerprint}</code>
        </span>
        <span>
          perspective_adapter_review_fingerprint{" "}
          <code>{perspectiveAdapterReview.validation.review_fingerprint}</code>
        </span>
        <span>
          source_perspective_state_mutation_receipt{" "}
          <code>
            {sourcePerspectiveStateMutationReadback?.latest_active_committed?.receipt.receipt_id ??
              perspectiveAdapterContract.source_perspective_state_mutation_receipt_id ??
              "none"}
          </code>
        </span>
        <span>
          source_perspective_state_mutation_record{" "}
          <code>
            {sourcePerspectiveStateMutationReadback?.latest_active_committed
              ?.perspective_state_mutation_record
              ?.perspective_state_mutation_record_id ??
              perspectiveAdapterContract.source_perspective_state_mutation_record_id ??
              "none"}
          </code>
        </span>
        <span>
          source_perspective_relay_receipt{" "}
          <code>{perspectiveAdapterContract.source_perspective_relay_receipt_id ?? "none"}</code>
        </span>
        <span>
          source_perspective_relay_record{" "}
          <code>{perspectiveAdapterContract.source_perspective_relay_record_id ?? "none"}</code>
        </span>
        <span>
          source_next_work_signal_receipt{" "}
          <code>
            {perspectiveAdapterContract.source_next_work_signal_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_signal_record{" "}
          <code>
            {perspectiveAdapterContract.source_next_work_signal_record_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_bias_receipt{" "}
          <code>
            {perspectiveAdapterContract.source_next_work_bias_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_bias_record{" "}
          <code>
            {perspectiveAdapterContract.source_next_work_bias_record_id ??
              "none"}
          </code>
        </span>
        <span>
          source_projection_fingerprint{" "}
          <code>{perspectiveAdapterContract.source_projection_fingerprint}</code>
        </span>
        <span>
          source_metric_snapshot_receipt{" "}
          <code>{perspectiveAdapterContract.source_metric_snapshot_receipt_id ?? "none"}</code>
        </span>
        <span>
          source_handoff_seed_fingerprint{" "}
          <code>{perspectiveAdapterContract.source_handoff_seed_fingerprint ?? "none"}</code>
        </span>
        <span>
          source_result_text_fingerprint{" "}
          <code>{perspectiveAdapterContract.source_result_text_fingerprint ?? "none"}</code>
        </span>
        <span>
          proposed_idempotency_key{" "}
          <code>
            {
              perspectiveAdapterContract.idempotency_contract_preview
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
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_WRITE_CONFIRMATION
            }
          </code>
        </p>
        <label>
          Confirmation
          <input
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder={
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_WRITE_CONFIRMATION
            }
          />
        </label>
        <div className="perspective-workbench-status-row">
          <button
            type="button"
            disabled={!writeEnabled || isWriting}
            onClick={writePerspectiveAdapterRecord}
          >
            {isWriting
              ? "Writing Perspective adapter record"
              : "Write Perspective adapter record"}
          </button>
          <button type="button" onClick={refreshReadback} disabled={isLoadingReadback}>
            Refresh Perspective adapter readback
          </button>
          <button
            type="button"
            onClick={refreshSourcePerspectiveStateMutationReadback}
            disabled={isLoadingSourcePerspectiveStateMutationReadback}
          >
            Refresh source Perspective state mutation readback
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
                {writeResult.perspective_adapter_record?.perspective_adapter_record_id ??
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
          Rollback marks the Perspective adapter receipt rolled_back and keeps the
          Perspective adapter record row for audit readback.
        </p>
        <p className="manual-note-runtime-hint">
          Exact rollback authorization text required:{" "}
          <code>
            {
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_ROLLBACK_CONFIRMATION
            }
          </code>
        </p>
        <label>
          Receipt id
          <input
            value={rollbackReceiptId}
            onChange={(event) => setRollbackReceiptId(event.target.value)}
            placeholder={
              latestReceiptId || "manual-global-dogfood-perspective-adapter-receipt:..."
            }
          />
        </label>
        <label>
          Rollback reason
          <input
            value={rollbackReason}
            onChange={(event) => setRollbackReason(event.target.value)}
            placeholder="Operator requested rollback of this Perspective adapter receipt."
          />
        </label>
        <label>
          Exact rollback authorization text
          <input
            value={rollbackConfirmationText}
            onChange={(event) => setRollbackConfirmationText(event.target.value)}
            placeholder={
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_ADAPTER_ROLLBACK_CONFIRMATION
            }
          />
        </label>
        <button
          type="button"
          disabled={!rollbackEnabled || isRollingBack}
          onClick={rollbackPerspectiveAdapterReceipt}
        >
          {isRollingBack
            ? "Rolling back Perspective adapter receipt"
            : "Rollback Perspective adapter receipt"}
        </button>
      </section>

      {runtimeError ? (
        <p className="manual-note-runtime-error" role="alert">
          {runtimeError}
        </p>
      ) : null}

      <ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReadbackPanel
        readback={readback}
        isLoading={isLoadingReadback}
        error={null}
      />
    </section>
  );
}
