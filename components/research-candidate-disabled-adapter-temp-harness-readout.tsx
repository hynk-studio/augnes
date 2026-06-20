"use client";

import {
  buildManualNoteDisabledAdapterContractReview,
  buildManualNoteDisabledAdapterContractReviewJson,
  buildManualNoteDisabledAdapterContractReviewMarkdown,
  buildManualNoteDisabledAdapterTempHarness,
  buildManualNoteDisabledAdapterTempHarnessJson,
  buildManualNoteDisabledAdapterTempHarnessMarkdown,
  type ManualNoteDisabledAdapterContractReview,
  type ManualNoteDisabledAdapterTempHarness,
} from "@/lib/research-candidate-review/manual-note-disabled-adapter-contract-review-and-temp-harness";
import type { ManualNoteDisabledPromotionWriteAdapterReadiness } from "@/lib/research-candidate-review/manual-note-disabled-promotion-write-adapter";
import { useEffect, useMemo, useState } from "react";

type DisabledAdapterTempHarnessReadoutProps = {
  readiness: ManualNoteDisabledPromotionWriteAdapterReadiness;
};

type TempHarnessCopyState = {
  packetKind:
    | "manual_note_disabled_adapter_contract_review"
    | "manual_note_disabled_adapter_temp_harness"
    | null;
  previewDraftId: string | null;
  fingerprint: string | null;
  status: "idle" | "success" | "error";
  mode: "markdown" | "json" | null;
  message: string | null;
  fallbackText: string | null;
  characterCount: number;
};

const EMPTY_COPY_STATE: TempHarnessCopyState = {
  packetKind: null,
  previewDraftId: null,
  fingerprint: null,
  status: "idle",
  mode: null,
  message: null,
  fallbackText: null,
  characterCount: 0,
};

export function DisabledAdapterTempHarnessReadout({
  readiness,
}: DisabledAdapterTempHarnessReadoutProps) {
  const readinessIdentity = useMemo(
    () =>
      [
        readiness.preview_draft_id,
        readiness.local_copy_packet.fingerprint,
        readiness.source_authority_design.packet_fingerprint,
      ].join("|"),
    [readiness],
  );
  const [contractReview, setContractReview] =
    useState<ManualNoteDisabledAdapterContractReview | null>(null);
  const [tempHarness, setTempHarness] =
    useState<ManualNoteDisabledAdapterTempHarness | null>(null);
  const [copyState, setCopyState] =
    useState<TempHarnessCopyState>(EMPTY_COPY_STATE);

  useEffect(() => {
    setContractReview(null);
    setTempHarness(null);
    setCopyState(EMPTY_COPY_STATE);
  }, [readinessIdentity]);

  const currentContractReview =
    contractReview?.preview_draft_id === readiness.preview_draft_id &&
    contractReview.source_readiness.local_copy_fingerprint ===
      readiness.local_copy_packet.fingerprint
      ? contractReview
      : null;
  const currentTempHarness =
    tempHarness?.preview_draft_id === readiness.preview_draft_id &&
    tempHarness.source_contract_review_fingerprint ===
      currentContractReview?.review_fingerprint
      ? tempHarness
      : null;
  const currentCopyState = getCurrentCopyState({
    copyState,
    contractReview: currentContractReview,
    tempHarness: currentTempHarness,
    previewDraftId: readiness.preview_draft_id,
  });

  function reviewContract() {
    const review = buildManualNoteDisabledAdapterContractReview({ readiness });
    setContractReview(review);
    setTempHarness(null);
    setCopyState(EMPTY_COPY_STATE);
  }

  function buildTempHarness() {
    if (!currentContractReview) return;
    const harness = buildManualNoteDisabledAdapterTempHarness({
      readiness,
      contractReview: currentContractReview,
    });
    setTempHarness(harness);
    setCopyState(EMPTY_COPY_STATE);
  }

  async function copyContractReview(mode: "markdown" | "json") {
    if (!currentContractReview) return;
    const text =
      mode === "markdown"
        ? buildManualNoteDisabledAdapterContractReviewMarkdown(
            currentContractReview,
          )
        : buildManualNoteDisabledAdapterContractReviewJson(currentContractReview);
    await copyPacket({
      packetKind: currentContractReview.review_kind,
      previewDraftId: currentContractReview.preview_draft_id,
      fingerprint: currentContractReview.review_fingerprint,
      mode,
      text,
      successMessage:
        mode === "markdown"
          ? "Contract review Markdown copied locally to clipboard."
          : "Contract review JSON copied locally to clipboard.",
    });
  }

  async function copyTempHarness(mode: "markdown" | "json") {
    if (!currentTempHarness) return;
    const text =
      mode === "markdown"
        ? buildManualNoteDisabledAdapterTempHarnessMarkdown(currentTempHarness)
        : buildManualNoteDisabledAdapterTempHarnessJson(currentTempHarness);
    await copyPacket({
      packetKind: currentTempHarness.harness_kind,
      previewDraftId: currentTempHarness.preview_draft_id,
      fingerprint: currentTempHarness.harness_fingerprint,
      mode,
      text,
      successMessage:
        mode === "markdown"
          ? "Temp harness Markdown copied locally to clipboard."
          : "Temp harness JSON copied locally to clipboard.",
    });
  }

  async function copyPacket({
    packetKind,
    previewDraftId,
    fingerprint,
    mode,
    text,
    successMessage,
  }: {
    packetKind: NonNullable<TempHarnessCopyState["packetKind"]>;
    previewDraftId: string;
    fingerprint: string;
    mode: "markdown" | "json";
    text: string;
    successMessage: string;
  }) {
    const nextCopyState = {
      packetKind,
      previewDraftId,
      fingerprint,
      mode,
      fallbackText: text,
      characterCount: text.length,
    };

    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard ||
      typeof navigator.clipboard.writeText !== "function"
    ) {
      setCopyState({
        status: "error",
        message:
          "Clipboard API is unavailable. Select the fallback temp harness text manually.",
        ...nextCopyState,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopyState({
        status: "success",
        message: successMessage,
        packetKind,
        previewDraftId,
        fingerprint,
        fallbackText: null,
        mode,
        characterCount: text.length,
      });
    } catch {
      setCopyState({
        status: "error",
        message:
          "Clipboard write failed. Select the fallback temp harness text manually.",
        ...nextCopyState,
      });
    }
  }

  return (
    <section
      className="perspective-inspector-section manual-note-promotion-readiness manual-note-disabled-adapter-temp-harness-readout"
      aria-label="Disabled adapter contract review and temp harness"
      data-contract-review-persisted="false"
      data-temp-harness-persisted="false"
    >
      <div className="manual-note-preview-draft-activity-header">
        <div>
          <h4>Disabled adapter contract review and temp harness</h4>
          <p>
            Review the disabled adapter contract, then build a sandbox
            simulation report with no product write.
          </p>
        </div>
        <div className="manual-note-readiness-copy-packet-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={reviewContract}
          >
            Review disabled adapter contract
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={!currentContractReview}
            onClick={buildTempHarness}
          >
            Build temp harness simulation
          </button>
        </div>
      </div>

      <ul className="manual-note-label-boundary-copy">
        <li>Temp harness only.</li>
        <li>This does not perform normal product writes.</li>
        <li>This does not perform actual promotion.</li>
        <li>
          Simulated write intents are not proof/evidence, Perspective,
          canonical graph, or work item records.
        </li>
        <li>
          No provider, retrieval, source fetch, or external handoff is
          performed.
        </li>
        <li>No durable persistence is added.</li>
      </ul>

      {currentContractReview ? (
        <section>
          <div className="manual-note-preview-draft-activity-header">
            <div>
              <h4>Contract review</h4>
              <p>
                contract_status{" "}
                <code>{currentContractReview.contract_status}</code>
              </p>
            </div>
            <div className="manual-note-readiness-copy-packet-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => void copyContractReview("markdown")}
              >
                Copy contract review Markdown
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => void copyContractReview("json")}
              >
                Copy contract review JSON
              </button>
            </div>
          </div>

          <p className="manual-note-runtime-hint">
            {currentContractReview.contract_summary}
          </p>
          <div className="manual-note-promotion-readiness-summary-grid">
            <SummaryMap
              title="Required contract checks"
              values={currentContractReview.required_contract_checks}
            />
            <SummaryMap
              title="Preserved boundaries"
              values={currentContractReview.preserved_boundaries}
            />
          </div>
          <TextList
            title="Contract gaps"
            items={
              currentContractReview.contract_gaps.length === 0
                ? ["none"]
                : currentContractReview.contract_gaps.map(
                    (gap) => `${gap.check_id}: ${gap.message}`,
                  )
            }
          />
        </section>
      ) : (
        <p className="manual-note-runtime-hint">
          Review the disabled adapter contract before building the temp harness
          simulation.
        </p>
      )}

      {currentTempHarness ? (
        <section>
          <div className="manual-note-preview-draft-activity-header">
            <div>
              <h4>Temp harness simulation</h4>
              <p>
                harness_status <code>{currentTempHarness.harness_status}</code>
                ; execution_mode <code>{currentTempHarness.execution_mode}</code>
                ; product_write_mode{" "}
                <code>{currentTempHarness.product_write_mode}</code>
              </p>
            </div>
            <div className="manual-note-readiness-copy-packet-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => void copyTempHarness("markdown")}
              >
                Copy temp harness Markdown
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => void copyTempHarness("json")}
              >
                Copy temp harness JSON
              </button>
            </div>
          </div>

          <p className="manual-note-runtime-hint">
            {currentTempHarness.temp_execution_summary}
          </p>
          <div className="manual-note-promotion-readiness-summary-grid">
            <SummaryMap
              title="Simulated write intent counts"
              values={countSimulatedIntents(
                currentTempHarness.simulated_write_intents,
              )}
            />
            <SummaryMap
              title="Idempotency temp harness"
              values={currentTempHarness.idempotency_temp_harness}
            />
            <SummaryMap
              title="Rollback temp harness"
              values={currentTempHarness.rollback_temp_harness}
            />
            <SummaryMap
              title="Review audit temp harness"
              values={currentTempHarness.review_audit_temp_harness}
            />
            <SummaryMap
              title="Temp harness boundary"
              values={currentTempHarness.temp_harness_boundary}
            />
            <SummaryMap
              title="Local copy boundary"
              values={currentTempHarness.local_copy_packet}
            />
          </div>
          <p className="manual-note-runtime-hint">
            next_recommended_slice{" "}
            <code>{currentTempHarness.next_recommended_slice}</code>
          </p>
        </section>
      ) : null}

      {currentCopyState?.message ? (
        <p
          className={
            currentCopyState.status === "error"
              ? "manual-note-runtime-error"
              : "manual-note-runtime-hint"
          }
          role={currentCopyState.status === "error" ? "alert" : undefined}
        >
          {currentCopyState.message} Character count{" "}
          {currentCopyState.characterCount}.
        </p>
      ) : null}
      {currentCopyState?.fallbackText ? (
        <details className="manual-note-readiness-copy-packet-fallback" open>
          <summary>Manual temp harness copy fallback</summary>
          <textarea
            readOnly
            value={currentCopyState.fallbackText}
            aria-label="Manual temp harness copy fallback"
          />
        </details>
      ) : null}
    </section>
  );
}

function SummaryMap({
  title,
  values,
}: {
  title: string;
  values: Record<string, unknown>;
}) {
  return (
    <div>
      <h4>{title}</h4>
      {Object.entries(values).map(([key, value]) => (
        <span key={key}>
          {key} <code>{formatValue(value)}</code>
        </span>
      ))}
    </div>
  );
}

function TextList({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <div className="manual-note-promotion-readiness-list">
      <h4>{title}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function getCurrentCopyState({
  copyState,
  contractReview,
  tempHarness,
  previewDraftId,
}: {
  copyState: TempHarnessCopyState;
  contractReview: ManualNoteDisabledAdapterContractReview | null;
  tempHarness: ManualNoteDisabledAdapterTempHarness | null;
  previewDraftId: string;
}) {
  if (
    copyState.packetKind === "manual_note_disabled_adapter_contract_review" &&
    copyState.previewDraftId === previewDraftId &&
    copyState.fingerprint === contractReview?.review_fingerprint
  ) {
    return copyState;
  }

  if (
    copyState.packetKind === "manual_note_disabled_adapter_temp_harness" &&
    copyState.previewDraftId === previewDraftId &&
    copyState.fingerprint === tempHarness?.harness_fingerprint
  ) {
    return copyState;
  }

  return null;
}

function countSimulatedIntents(
  intents: ManualNoteDisabledAdapterTempHarness["simulated_write_intents"],
) {
  return {
    claim_intents: intents.claim_intents.length,
    evidence_intents: intents.evidence_intents.length,
    perspective_intents: intents.perspective_intents.length,
    source_verification_intents: intents.source_verification_intents.length,
    work_item_intents: intents.work_item_intents.length,
    total: Object.values(intents).reduce((sum, group) => sum + group.length, 0),
  };
}

function formatValue(value: unknown): string {
  if (value === null || typeof value === "undefined") return "none";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "none";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
