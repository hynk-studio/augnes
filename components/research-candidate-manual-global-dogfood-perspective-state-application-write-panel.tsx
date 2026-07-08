"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadbackPanel } from "@/components/research-candidate-manual-global-dogfood-perspective-state-application-readback-panel";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract } from "@/types/research-candidate-manual-global-dogfood-perspective-state-application-contract";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReview } from "@/types/research-candidate-manual-global-dogfood-perspective-state-application-review";
import type { ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReadback } from "@/types/research-candidate-manual-global-dogfood-perspective-adapter-write";
import {
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_APPLICATION_ROLLBACK_CONFIRMATION,
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_APPLICATION_WRITE_CONFIRMATION,
  type ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback,
  type ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteResult,
} from "@/types/research-candidate-manual-global-dogfood-perspective-state-application-write";

const routePath =
  "/api/research-candidate-review/manual-global-dogfood-perspective-state-application";
const sourcePerspectiveAdapterRoutePath =
  "/api/research-candidate-review/manual-global-dogfood-perspective-adapter";

export function ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWritePanel({
  perspectiveStateApplicationContract,
  perspectiveStateApplicationReview,
}: {
  perspectiveStateApplicationContract: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationContract;
  perspectiveStateApplicationReview: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReview;
}) {
  const [confirmationText, setConfirmationText] = useState("");
  const [writeResult, setWriteResult] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteResult | null>(
      null,
    );
  const [readback, setReadback] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback | null>(
      null,
    );
  const [sourcePerspectiveAdapterReadback, setSourcePerspectiveAdapterReadback] =
    useState<ResearchCandidateManualGlobalDogfoodPerspectiveAdapterReadback | null>(
      null,
    );
  const [isLoadingReadback, setIsLoadingReadback] = useState(false);
  const [isLoadingSourcePerspectiveAdapterReadback, setIsLoadingSourcePerspectiveAdapterReadback] =
    useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [rollbackReceiptId, setRollbackReceiptId] = useState("");
  const [rollbackReason, setRollbackReason] = useState("");
  const [rollbackConfirmationText, setRollbackConfirmationText] = useState("");
  const writeEnabled =
    confirmationText ===
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_APPLICATION_WRITE_CONFIRMATION &&
    Boolean(sourcePerspectiveAdapterReadback?.latest_active_committed) &&
    perspectiveStateApplicationReview.source_contract_fingerprint ===
      perspectiveStateApplicationContract.validation.contract_fingerprint &&
    perspectiveStateApplicationReview.accepted_mapping_summary?.proposed_idempotency_key ===
      perspectiveStateApplicationContract.idempotency_contract_preview.proposed_idempotency_key &&
    perspectiveStateApplicationReview.accepted_mapping_summary?.source_handoff_seed_fingerprint ===
      perspectiveStateApplicationContract.source_handoff_seed_fingerprint &&
    perspectiveStateApplicationReview.accepted_mapping_summary?.source_result_text_fingerprint ===
      perspectiveStateApplicationContract.source_result_text_fingerprint;
  const latestReceiptId =
    writeResult?.receipt?.receipt_id ??
    readback?.latest_active_committed?.receipt.receipt_id ??
    "";
  const effectiveRollbackReceiptId = rollbackReceiptId.trim() || latestReceiptId;
  const rollbackEnabled =
    effectiveRollbackReceiptId.length > 0 &&
    rollbackReason.trim().length > 0 &&
    rollbackConfirmationText ===
      RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_APPLICATION_ROLLBACK_CONFIRMATION;
  const writeRequest = useMemo(
    () => ({
      perspective_state_application_contract: perspectiveStateApplicationContract,
      perspective_state_application_review: perspectiveStateApplicationReview,
      source_perspective_adapter_readback: sourcePerspectiveAdapterReadback,
      operator_authorization: {
        authorization_kind: "manual_operator_authorized_perspective_state_application_write",
        operator_confirmation_text: confirmationText,
        write_mode: "commit",
      },
    }),
    [
      confirmationText,
      perspectiveStateApplicationContract,
      perspectiveStateApplicationReview,
      sourcePerspectiveAdapterReadback,
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
        readback?: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback;
        error_code?: string;
      };
      if (!response.ok || payload.ok !== true || !payload.readback) {
        throw new Error(payload.error_code ?? "perspective_state_application_readback_failed");
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

  const refreshSourcePerspectiveAdapterReadback = useCallback(async () => {
    setIsLoadingSourcePerspectiveAdapterReadback(true);
    setRuntimeError(null);
    try {
      const response = await fetch(`${sourcePerspectiveAdapterRoutePath}?limit=10`, {
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
        throw new Error(
          payload.error_code ?? "source_perspective_adapter_readback_failed",
        );
      }
      setSourcePerspectiveAdapterReadback(payload.readback);
    } catch (error) {
      setRuntimeError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoadingSourcePerspectiveAdapterReadback(false);
    }
  }, []);

  useEffect(() => {
    void refreshSourcePerspectiveAdapterReadback();
  }, [refreshSourcePerspectiveAdapterReadback]);

  async function writePerspectiveStateApplicationRecord() {
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
        result?: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationWriteResult;
        error_code?: string;
      };
      if (!payload.result) {
        throw new Error(payload.error_code ?? "perspective_state_application_write_failed");
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

  async function rollbackPerspectiveStateApplicationReceipt() {
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
                "manual_operator_authorized_perspective_state_application_rollback",
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
          readback?: ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadback | null;
        };
        error_code?: string;
      };
      if (!response.ok || payload.ok !== true) {
        throw new Error(
          payload.result?.refusal_reasons?.join(", ") ??
            payload.error_code ??
            "perspective_state_application_rollback_failed",
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
      className="perspective-inspector-section manual-global-dogfood-perspective-state-application-write"
      aria-label="Authorized manual global dogfood Perspective state application write"
      data-augnes-authority="authorized-manual-perspective-state-application-write no-current-working-perspective no-canonical-state no-promotion no-memory no-work no-proof no-metrics"
    >
      <div className="perspective-constellation-shell-header">
        <div>
          <p className="panel-eyebrow">AUGNES / Authorized Perspective State Application Write</p>
          <h4>Write Perspective state application record</h4>
          <p>
            This writes only a manual-derived Perspective state application
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
          perspective_state_application_contract_fingerprint{" "}
          <code>{perspectiveStateApplicationContract.validation.contract_fingerprint}</code>
        </span>
        <span>
          perspective_state_application_review_fingerprint{" "}
          <code>{perspectiveStateApplicationReview.validation.review_fingerprint}</code>
        </span>
        <span>
          source_perspective_adapter_receipt{" "}
          <code>
            {sourcePerspectiveAdapterReadback?.latest_active_committed?.receipt.receipt_id ??
              perspectiveStateApplicationContract.source_perspective_adapter_receipt_id ??
              "none"}
          </code>
        </span>
        <span>
          source_perspective_adapter_record{" "}
          <code>
            {sourcePerspectiveAdapterReadback?.latest_active_committed
              ?.perspective_adapter_record
              ?.perspective_adapter_record_id ??
              perspectiveStateApplicationContract.source_perspective_adapter_record_id ??
              "none"}
          </code>
        </span>
        <span>
          source_perspective_state_mutation_receipt{" "}
          <code>
            {perspectiveStateApplicationContract.source_perspective_state_mutation_receipt_id ??
              "none"}
          </code>
        </span>
        <span>
          source_perspective_state_mutation_record{" "}
          <code>
            {perspectiveStateApplicationContract.source_perspective_state_mutation_record_id ??
              "none"}
          </code>
        </span>
        <span>
          source_perspective_relay_receipt{" "}
          <code>{perspectiveStateApplicationContract.source_perspective_relay_receipt_id ?? "none"}</code>
        </span>
        <span>
          source_perspective_relay_record{" "}
          <code>{perspectiveStateApplicationContract.source_perspective_relay_record_id ?? "none"}</code>
        </span>
        <span>
          source_next_work_signal_receipt{" "}
          <code>
            {perspectiveStateApplicationContract.source_next_work_signal_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_signal_record{" "}
          <code>
            {perspectiveStateApplicationContract.source_next_work_signal_record_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_bias_receipt{" "}
          <code>
            {perspectiveStateApplicationContract.source_next_work_bias_receipt_id ?? "none"}
          </code>
        </span>
        <span>
          source_next_work_bias_record{" "}
          <code>
            {perspectiveStateApplicationContract.source_next_work_bias_record_id ??
              "none"}
          </code>
        </span>
        <span>
          source_projection_fingerprint{" "}
          <code>{perspectiveStateApplicationContract.source_projection_fingerprint}</code>
        </span>
        <span>
          source_metric_snapshot_receipt{" "}
          <code>{perspectiveStateApplicationContract.source_metric_snapshot_receipt_id ?? "none"}</code>
        </span>
        <span>
          source_handoff_seed_fingerprint{" "}
          <code>{perspectiveStateApplicationContract.source_handoff_seed_fingerprint ?? "none"}</code>
        </span>
        <span>
          source_result_text_fingerprint{" "}
          <code>{perspectiveStateApplicationContract.source_result_text_fingerprint ?? "none"}</code>
        </span>
        <span>
          proposed_idempotency_key{" "}
          <code>
            {
              perspectiveStateApplicationContract.idempotency_contract_preview
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
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_APPLICATION_WRITE_CONFIRMATION
            }
          </code>
        </p>
        <label>
          Confirmation
          <input
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder={
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_APPLICATION_WRITE_CONFIRMATION
            }
          />
        </label>
        <div className="perspective-workbench-status-row">
          <button
            type="button"
            disabled={!writeEnabled || isWriting}
            onClick={writePerspectiveStateApplicationRecord}
          >
            {isWriting
              ? "Writing Perspective state application record"
              : "Write Perspective state application record"}
          </button>
          <button type="button" onClick={refreshReadback} disabled={isLoadingReadback}>
            Refresh Perspective state application readback
          </button>
          <button
            type="button"
            onClick={refreshSourcePerspectiveAdapterReadback}
            disabled={isLoadingSourcePerspectiveAdapterReadback}
          >
            Refresh source Perspective adapter readback
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
                {writeResult.perspective_state_application_record?.perspective_state_application_record_id ??
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
          Rollback marks the Perspective state application receipt rolled_back and keeps the
          Perspective state application record row for audit readback.
        </p>
        <p className="manual-note-runtime-hint">
          Exact rollback authorization text required:{" "}
          <code>
            {
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_APPLICATION_ROLLBACK_CONFIRMATION
            }
          </code>
        </p>
        <label>
          Receipt id
          <input
            value={rollbackReceiptId}
            onChange={(event) => setRollbackReceiptId(event.target.value)}
            placeholder={
              latestReceiptId || "manual-global-dogfood-perspective-state-application-receipt:..."
            }
          />
        </label>
        <label>
          Rollback reason
          <input
            value={rollbackReason}
            onChange={(event) => setRollbackReason(event.target.value)}
            placeholder="Operator requested rollback of this Perspective state application receipt."
          />
        </label>
        <label>
          Exact rollback authorization text
          <input
            value={rollbackConfirmationText}
            onChange={(event) => setRollbackConfirmationText(event.target.value)}
            placeholder={
              RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_STATE_APPLICATION_ROLLBACK_CONFIRMATION
            }
          />
        </label>
        <button
          type="button"
          disabled={!rollbackEnabled || isRollingBack}
          onClick={rollbackPerspectiveStateApplicationReceipt}
        >
          {isRollingBack
            ? "Rolling back Perspective state application receipt"
            : "Rollback Perspective state application receipt"}
        </button>
      </section>

      {runtimeError ? (
        <p className="manual-note-runtime-error" role="alert">
          {runtimeError}
        </p>
      ) : null}

      <ResearchCandidateManualGlobalDogfoodPerspectiveStateApplicationReadbackPanel
        readback={readback}
        isLoading={isLoadingReadback}
        error={null}
      />
    </section>
  );
}
