"use client";

import { DisabledAdapterTempHarnessReadout } from "@/components/research-candidate-disabled-adapter-temp-harness-readout";
import type {
  ManualNoteAuthorityGatedPromotionDesignPacket,
} from "@/lib/research-candidate-review/manual-note-dry-run-candidate-review-and-authority-design";
import type { ManualNoteDisabledPromotionWriteAdapterReadiness } from "@/lib/research-candidate-review/manual-note-disabled-promotion-write-adapter";
import { useEffect, useMemo, useState } from "react";

type DisabledPromotionWriteAdapterReadoutProps = {
  previewDraftId: string;
  authorityDesignPacket: ManualNoteAuthorityGatedPromotionDesignPacket;
};

type DisabledAdapterCopyState = {
  previewDraftId: string | null;
  readinessFingerprint: string | null;
  status: "idle" | "success" | "error";
  mode: "markdown" | "json" | null;
  message: string | null;
  fallbackText: string | null;
  characterCount: number;
};

const EMPTY_COPY_STATE: DisabledAdapterCopyState = {
  previewDraftId: null,
  readinessFingerprint: null,
  status: "idle",
  mode: null,
  message: null,
  fallbackText: null,
  characterCount: 0,
};

export function DisabledPromotionWriteAdapterReadout({
  previewDraftId,
  authorityDesignPacket,
}: DisabledPromotionWriteAdapterReadoutProps) {
  const packetIdentity = useMemo(
    () =>
      [
        previewDraftId,
        authorityDesignPacket.packet_fingerprint,
        authorityDesignPacket.source_candidate_review_packet.packet_fingerprint,
      ].join("|"),
    [authorityDesignPacket, previewDraftId],
  );
  const [readiness, setReadiness] =
    useState<ManualNoteDisabledPromotionWriteAdapterReadiness | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] =
    useState<DisabledAdapterCopyState>(EMPTY_COPY_STATE);

  useEffect(() => {
    setReadiness(null);
    setIsLoading(false);
    setError(null);
    setCopyState(EMPTY_COPY_STATE);
  }, [packetIdentity]);

  const currentReadiness =
    readiness?.preview_draft_id === previewDraftId &&
    readiness.source_authority_design.packet_fingerprint ===
      authorityDesignPacket.packet_fingerprint
      ? readiness
      : null;
  const currentCopyState =
    currentReadiness &&
    copyState.previewDraftId === previewDraftId &&
    copyState.readinessFingerprint ===
      currentReadiness.local_copy_packet.fingerprint
      ? copyState
      : null;

  async function checkDisabledAdapterReadiness() {
    setIsLoading(true);
    setError(null);
    setCopyState(EMPTY_COPY_STATE);

    try {
      const response = await fetch(
        buildDisabledAdapterReadinessRoute(previewDraftId),
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            preview_draft_id: previewDraftId,
            authority_design_packet: authorityDesignPacket,
            candidate_review_packet_fingerprint:
              authorityDesignPacket.source_candidate_review_packet
                .packet_fingerprint,
          }),
        },
      );
      const result = (await response.json()) as
        | ManualNoteDisabledPromotionWriteAdapterReadiness
        | { ok: false; message?: string };

      if (!response.ok || result.ok !== true) {
        setReadiness(null);
        setError(
          result.ok === false && result.message
            ? result.message
            : "Disabled adapter readiness route returned an unavailable response.",
        );
        return;
      }

      if (
        result.preview_draft_id !== previewDraftId ||
        result.source_authority_design.packet_fingerprint !==
          authorityDesignPacket.packet_fingerprint
      ) {
        setReadiness(null);
        setError(
          "Disabled adapter readiness route returned a mismatched authority design packet.",
        );
        return;
      }

      setReadiness(result);
    } catch {
      setReadiness(null);
      setError("Disabled adapter readiness route is unavailable.");
    } finally {
      setIsLoading(false);
    }
  }

  async function copyDisabledAdapterReadiness(mode: "markdown" | "json") {
    if (!currentReadiness) return;
    const text =
      mode === "markdown"
        ? currentReadiness.local_copy_packet.markdown
        : currentReadiness.local_copy_packet.json;
    const nextCopyState = {
      previewDraftId,
      readinessFingerprint: currentReadiness.local_copy_packet.fingerprint,
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
          "Clipboard API is unavailable. Select the fallback disabled adapter text manually.",
        ...nextCopyState,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopyState({
        status: "success",
        message:
          mode === "markdown"
            ? "Disabled adapter Markdown copied locally to clipboard."
            : "Disabled adapter JSON copied locally to clipboard.",
        previewDraftId,
        readinessFingerprint: currentReadiness.local_copy_packet.fingerprint,
        fallbackText: null,
        mode,
        characterCount: text.length,
      });
    } catch {
      setCopyState({
        status: "error",
        message:
          "Clipboard write failed. Select the fallback disabled adapter text manually.",
        ...nextCopyState,
      });
    }
  }

  return (
    <section
      className="perspective-inspector-section manual-note-promotion-readiness manual-note-disabled-promotion-write-adapter-readout"
      aria-label="Disabled adapter readiness"
      data-adapter-readiness-persisted="false"
    >
      <div className="manual-note-preview-draft-activity-header">
        <div>
          <h4>Disabled adapter readiness</h4>
          <p>
            This checks only whether the design packet has the required disabled
            adapter contract shape.
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          disabled={isLoading}
          onClick={() => void checkDisabledAdapterReadiness()}
        >
          {isLoading
            ? "Checking disabled adapter readiness..."
            : currentReadiness
              ? "Refresh disabled adapter readiness"
              : "Check disabled adapter readiness"}
        </button>
      </div>

      <ul className="manual-note-label-boundary-copy">
        <li>Disabled adapter skeleton only.</li>
        <li>This does not perform actual promotion.</li>
        <li>Normal product writes are disabled.</li>
        <li>
          No proof/evidence, Perspective, canonical graph, or work item records
          are created.
        </li>
        <li>
          No provider, retrieval, source fetch, or external handoff is performed.
        </li>
        <li>Adapter readiness is not approval and not write authority.</li>
      </ul>

      {error ? (
        <p className="manual-note-runtime-error" role="alert">
          {error}
        </p>
      ) : null}

      {currentReadiness ? (
        <>
          <div className="perspective-workbench-status-row">
            <span>
              adapter_status <code>{currentReadiness.adapter_status}</code>
            </span>
            <span>
              write_execution_status{" "}
              <code>{currentReadiness.write_execution_status}</code>
            </span>
            <span>
              fingerprint{" "}
              <code>{currentReadiness.local_copy_packet.fingerprint}</code>
            </span>
          </div>

          <p className="manual-note-runtime-hint">
            {currentReadiness.disabled_reason}
          </p>

          <div className="manual-note-promotion-readiness-summary-grid">
            <SummaryMap
              title="Validation summary"
              values={currentReadiness.validation_summary}
            />
            <SummaryMap
              title="Disabled write contract"
              values={currentReadiness.disabled_write_contract}
            />
            <SummaryMap
              title="Idempotency skeleton"
              values={currentReadiness.idempotency_skeleton}
            />
            <SummaryMap
              title="Rollback skeleton"
              values={currentReadiness.rollback_skeleton}
            />
            <SummaryMap
              title="Review audit skeleton"
              values={currentReadiness.review_audit_skeleton}
            />
            <SummaryMap
              title="Execution boundary"
              values={currentReadiness.execution_boundary}
            />
          </div>

          <div className="manual-note-promotion-readiness-list">
            <h4>Write target mapping skeleton summary</h4>
            <ul>
              <li>
                claim_write_targets{" "}
                {
                  currentReadiness.write_target_mapping_skeleton
                    .claim_write_targets.length
                }
              </li>
              <li>
                evidence_write_targets{" "}
                {
                  currentReadiness.write_target_mapping_skeleton
                    .evidence_write_targets.length
                }
              </li>
              <li>
                perspective_write_targets{" "}
                {
                  currentReadiness.write_target_mapping_skeleton
                    .perspective_write_targets.length
                }
              </li>
              <li>
                source_verification_targets{" "}
                {
                  currentReadiness.write_target_mapping_skeleton
                    .source_verification_targets.length
                }
              </li>
              <li>
                work_item_targets{" "}
                {
                  currentReadiness.write_target_mapping_skeleton
                    .work_item_targets.length
                }
              </li>
            </ul>
          </div>

          <div className="manual-note-readiness-copy-packet-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => void copyDisabledAdapterReadiness("markdown")}
            >
              Copy disabled adapter Markdown
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void copyDisabledAdapterReadiness("json")}
            >
              Copy disabled adapter JSON
            </button>
          </div>

          <SummaryMap
            title="Local copy boundary"
            values={currentReadiness.local_copy_packet}
          />

          <DisabledAdapterTempHarnessReadout readiness={currentReadiness} />
        </>
      ) : (
        <p className="manual-note-runtime-hint">
          Build the authority design packet, then check disabled adapter
          readiness. The check returns a disabled envelope only.
        </p>
      )}

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
          <summary>Manual disabled adapter copy fallback</summary>
          <textarea
            readOnly
            value={currentCopyState.fallbackText}
            aria-label="Manual disabled adapter copy fallback"
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

function buildDisabledAdapterReadinessRoute(previewDraftId: string) {
  return `/api/research-candidate-review/manual-note-preview-drafts/${encodeURIComponent(
    previewDraftId,
  )}/disabled-promotion-write-adapter-readiness`;
}

function formatValue(value: unknown): string {
  if (value === null || typeof value === "undefined") return "none";
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "none";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
