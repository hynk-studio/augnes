"use client";

import { LocalPacketReviewChecklist } from "@/components/research-candidate-local-packet-review-checklist";
import {
  ReadinessPacketReviewWorkspace,
  type ReadinessCopyPacketFreshnessStatus,
} from "@/components/research-candidate-readiness-packet-review-workspace";
import {
  DEFAULT_READINESS_PACKET_REVIEW_SECTION_VISIBILITY,
  buildManualNotePreviewDraftReadinessCopyPacket,
  buildManualNotePreviewDraftReadinessPacketReviewPreview,
  type ManualNotePreviewDraftReadinessPacketReviewOptions,
} from "@/lib/research-candidate-review/manual-note-preview-draft-readiness-copy-packet";
import {
  MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_FINGERPRINT_ALGORITHM,
  MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_KIND,
  MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_VERSION,
  type ManualNotePreviewDraftActivityResponse,
  type ManualNotePreviewDraftDetailOkResponse,
  type ManualNotePreviewDraftPromotionReadinessOkResponse,
  type ManualNotePreviewDraftReadinessCopyPacketInputSummary,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";
import { useMemo, useState } from "react";

type ReadinessCopyPacketMode = "human" | "json";

type ReadinessCopyPacketState = {
  status: "idle" | "success" | "error";
  mode: ReadinessCopyPacketMode | null;
  message: string | null;
  generatedAt: string | null;
  characterCount: number;
  fallbackText: string | null;
  lastCopiedPacketFingerprint: string | null;
  lastCopiedPacketMode: ReadinessCopyPacketMode | null;
  lastCopiedPacketGeneratedAt: string | null;
  lastCopiedPacketCharacterCount: number;
  lastCopiedInputSummary: ManualNotePreviewDraftReadinessCopyPacketInputSummary | null;
};

type ReadinessCopyPacketPanelProps = {
  storedDraftResult: ManualNotePreviewDraftDetailOkResponse;
  preflightResult: ManualNotePreviewDraftPromotionReadinessOkResponse;
  activityResult: ManualNotePreviewDraftActivityResponse | null;
  isPreflightRefreshing: boolean;
};

const READINESS_PACKET_FRESHNESS_LABELS: Record<
  ReadinessCopyPacketFreshnessStatus,
  string
> = {
  no_packet_copied: "No packet copied yet",
  current: "Current",
  stale: "Stale",
  unavailable: "Unavailable",
};

export function ReadinessCopyPacketPanel({
  storedDraftResult,
  preflightResult,
  activityResult,
  isPreflightRefreshing,
}: ReadinessCopyPacketPanelProps) {
  const [copyState, setCopyState] = useState<ReadinessCopyPacketState>({
    status: "idle",
    mode: null,
    message: null,
    generatedAt: null,
    characterCount: 0,
    fallbackText: null,
    lastCopiedPacketFingerprint: null,
    lastCopiedPacketMode: null,
    lastCopiedPacketGeneratedAt: null,
    lastCopiedPacketCharacterCount: 0,
    lastCopiedInputSummary: null,
  });
  const [reviewOptions, setReviewOptions] =
    useState<ManualNotePreviewDraftReadinessPacketReviewOptions>(() => ({
      packet_format_view: "markdown",
      packet_detail_mode: "summary",
      gate_group_filter: "all",
      section_visibility: {
        ...DEFAULT_READINESS_PACKET_REVIEW_SECTION_VISIBILITY,
      },
    }));
  const currentActivity =
    activityResult?.ok === true &&
    activityResult.preview_draft_id === storedDraftResult.draft.preview_draft_id
      ? activityResult
      : null;
  const isDisabled =
    isPreflightRefreshing ||
    preflightResult.preview_draft_id !== storedDraftResult.draft.preview_draft_id;
  const currentPacketResult = useMemo(() => {
    if (isDisabled) return null;

    return buildManualNotePreviewDraftReadinessCopyPacket({
      storedDraftResult,
      preflightResult,
      activityResult: currentActivity,
      generatedAt: new Date().toISOString(),
    });
  }, [currentActivity, isDisabled, preflightResult, storedDraftResult]);
  const currentPacketFingerprint =
    currentPacketResult?.packet_fingerprint ?? null;
  const packetFreshnessStatus = getReadinessPacketFreshnessStatus({
    currentPacketFingerprint,
    lastCopiedPacketFingerprint: copyState.lastCopiedPacketFingerprint,
  });
  const packetFreshnessLabel =
    READINESS_PACKET_FRESHNESS_LABELS[packetFreshnessStatus];
  const packetFreshnessClass =
    packetFreshnessStatus === "current"
      ? "is-current"
      : packetFreshnessStatus === "stale"
        ? "is-stale"
        : "is-muted";
  const staleDiffSummary =
    packetFreshnessStatus === "stale" && currentPacketResult
      ? buildReadinessPacketInputDiffSummary({
          currentSummary: currentPacketResult.packet.packet_input_summary,
          lastCopiedSummary: copyState.lastCopiedInputSummary,
        })
      : [];
  const reviewPreview = useMemo(() => {
    if (!currentPacketResult) return null;
    return buildManualNotePreviewDraftReadinessPacketReviewPreview(
      currentPacketResult.packet,
      reviewOptions,
    );
  }, [currentPacketResult, reviewOptions]);

  async function copyPacket(mode: ReadinessCopyPacketMode) {
    const generatedAt = new Date().toISOString();
    const packetResult = buildManualNotePreviewDraftReadinessCopyPacket({
      storedDraftResult,
      preflightResult,
      activityResult: currentActivity,
      generatedAt,
    });
    const text = mode === "human" ? packetResult.markdown : packetResult.json;
    const copiedPacketState = {
      mode,
      generatedAt,
      characterCount: text.length,
      fallbackText: text,
      lastCopiedPacketFingerprint: packetResult.packet_fingerprint,
      lastCopiedPacketMode: mode,
      lastCopiedPacketGeneratedAt: generatedAt,
      lastCopiedPacketCharacterCount: text.length,
      lastCopiedInputSummary: packetResult.packet.packet_input_summary,
    };

    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard ||
      typeof navigator.clipboard.writeText !== "function"
    ) {
      setCopyState({
        status: "error",
        mode,
        message:
          "Clipboard API is unavailable. Select the fallback packet text manually.",
        generatedAt: copiedPacketState.generatedAt,
        characterCount: copiedPacketState.characterCount,
        fallbackText: copiedPacketState.fallbackText,
        lastCopiedPacketFingerprint:
          copiedPacketState.lastCopiedPacketFingerprint,
        lastCopiedPacketMode: copiedPacketState.lastCopiedPacketMode,
        lastCopiedPacketGeneratedAt:
          copiedPacketState.lastCopiedPacketGeneratedAt,
        lastCopiedPacketCharacterCount:
          copiedPacketState.lastCopiedPacketCharacterCount,
        lastCopiedInputSummary: copiedPacketState.lastCopiedInputSummary,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopyState({
        status: "success",
        mode,
        message:
          mode === "human"
            ? "Human review packet copied locally to clipboard."
            : "JSON packet copied locally to clipboard.",
        generatedAt: copiedPacketState.generatedAt,
        characterCount: copiedPacketState.characterCount,
        fallbackText: null,
        lastCopiedPacketFingerprint:
          copiedPacketState.lastCopiedPacketFingerprint,
        lastCopiedPacketMode: copiedPacketState.lastCopiedPacketMode,
        lastCopiedPacketGeneratedAt:
          copiedPacketState.lastCopiedPacketGeneratedAt,
        lastCopiedPacketCharacterCount:
          copiedPacketState.lastCopiedPacketCharacterCount,
        lastCopiedInputSummary: copiedPacketState.lastCopiedInputSummary,
      });
    } catch {
      setCopyState({
        status: "error",
        mode,
        message:
          "Clipboard write failed. Select the fallback packet text manually.",
        generatedAt: copiedPacketState.generatedAt,
        characterCount: copiedPacketState.characterCount,
        fallbackText: copiedPacketState.fallbackText,
        lastCopiedPacketFingerprint:
          copiedPacketState.lastCopiedPacketFingerprint,
        lastCopiedPacketMode: copiedPacketState.lastCopiedPacketMode,
        lastCopiedPacketGeneratedAt:
          copiedPacketState.lastCopiedPacketGeneratedAt,
        lastCopiedPacketCharacterCount:
          copiedPacketState.lastCopiedPacketCharacterCount,
        lastCopiedInputSummary: copiedPacketState.lastCopiedInputSummary,
      });
    }
  }

  return (
    <section
      className="manual-note-readiness-copy-packet"
      aria-label="Readiness copy packet"
    >
      <div className="manual-note-readiness-copy-packet-header">
        <div>
          <h4>Readiness copy packet</h4>
          <p>
            Local clipboard copy only. The packet summarizes this opened preview
            draft, loaded preflight, gate explanations, and boundary metadata
            for human review.
          </p>
        </div>
        <div className="manual-note-readiness-copy-packet-actions">
          <button
            type="button"
            className="secondary-button"
            disabled={isDisabled}
            onClick={() => void copyPacket("human")}
          >
            Copy human review packet
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={isDisabled}
            onClick={() => void copyPacket("json")}
          >
            Copy JSON packet
          </button>
        </div>
      </div>
      <ul className="manual-note-label-boundary-copy">
        <li>Readiness copy packets are preview-only local clipboard material.</li>
        <li>
          Copying does not send, share, email, submit, create a handoff, execute
          Codex, write proof/evidence, create work items, or promote Perspective
          state.
        </li>
        <li>Raw manual note text is not included.</li>
      </ul>
      <div className="manual-note-readiness-copy-packet-freshness">
        <span className={packetFreshnessClass}>
          Packet freshness status <strong>{packetFreshnessLabel}</strong>
        </span>
        <p>
          Fingerprint compares preview packet content only. It excludes
          generated_at and is not security authority.
        </p>
        {packetFreshnessStatus === "stale" ? (
          <p className="manual-note-runtime-error" role="status">
            Copy a fresh packet before using it for review.
          </p>
        ) : null}
        {packetFreshnessStatus === "unavailable" ? (
          <p className="manual-note-runtime-hint">
            Run or refresh preflight for the opened stored preview draft before
            checking packet freshness.
          </p>
        ) : null}
      </div>
      <div className="manual-note-readiness-copy-packet-grid">
        <span>
          packet_kind{" "}
          <code>{MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_KIND}</code>
        </span>
        <span>
          packet_version{" "}
          <code>{MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_VERSION}</code>
        </span>
        <span>
          packet_fingerprint_algorithm{" "}
          <code>
            {MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_FINGERPRINT_ALGORITHM}
          </code>
        </span>
        <span>
          Current packet fingerprint{" "}
          <code>{currentPacketFingerprint ?? "unavailable"}</code>
        </span>
        <span>
          Last copied packet fingerprint{" "}
          <code>{copyState.lastCopiedPacketFingerprint ?? "none copied yet"}</code>
        </span>
        <span>
          last_copied_mode{" "}
          <code>{copyState.lastCopiedPacketMode ?? "none copied yet"}</code>
        </span>
        <span>
          last_copied_at{" "}
          <code>{copyState.lastCopiedPacketGeneratedAt ?? "none copied yet"}</code>
        </span>
        <span>
          current_computed_at{" "}
          <code>
            {currentPacketResult?.packet.packet_generated_at ?? "unavailable"}
          </code>
        </span>
        <span>
          local_clipboard_only <code>true</code>
        </span>
        <span>
          external_handoff_sent <code>false</code>
        </span>
        <span>
          raw_manual_note_text_included <code>false</code>
        </span>
        <span>
          packet_fingerprint_is_security_authority <code>false</code>
        </span>
        <span>
          packet_fingerprint_persisted <code>false</code>
        </span>
        <span>
          generated_at{" "}
          <code>{copyState.generatedAt ?? "not generated yet"}</code>
        </span>
        <span>
          packet_character_count <code>{copyState.characterCount}</code>
        </span>
        <span>
          last_copied_packet_character_count{" "}
          <code>{copyState.lastCopiedPacketCharacterCount}</code>
        </span>
        <span>
          copy_status <code>{copyState.status}</code>
        </span>
      </div>
      <div className="manual-note-readiness-copy-packet-summary-grid">
        <details open>
          <summary>Current packet content summary</summary>
          {currentPacketResult ? (
            <ReadinessPacketInputSummaryList
              summary={currentPacketResult.packet.packet_input_summary}
            />
          ) : (
            <p>Current packet summary unavailable until matching preflight loads.</p>
          )}
        </details>
        <details>
          <summary>Last copied packet content summary</summary>
          {copyState.lastCopiedInputSummary ? (
            <ReadinessPacketInputSummaryList
              summary={copyState.lastCopiedInputSummary}
            />
          ) : (
            <p>No packet copied yet.</p>
          )}
        </details>
      </div>
      {staleDiffSummary.length > 0 ? (
        <div className="manual-note-readiness-copy-packet-diff">
          <strong>Stale packet summary diff</strong>
          <ul>
            {staleDiffSummary.map((summaryItem) => (
              <li key={summaryItem}>{summaryItem}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <ReadinessPacketReviewWorkspace
        options={reviewOptions}
        preview={reviewPreview}
        packetFreshnessStatus={packetFreshnessStatus}
        onChangeOptions={setReviewOptions}
      />
      <LocalPacketReviewChecklist
        currentPacketFingerprint={currentPacketFingerprint}
        previewDraftId={storedDraftResult.draft.preview_draft_id}
        preflightPreviewDraftId={preflightResult.preview_draft_id}
      />
      {isDisabled ? (
        <p className="manual-note-runtime-hint">
          Run or refresh preflight for the opened stored preview draft before
          copying a packet.
        </p>
      ) : null}
      {copyState.message ? (
        <p
          className={
            copyState.status === "error"
              ? "manual-note-runtime-error"
              : "manual-note-runtime-hint"
          }
          role={copyState.status === "error" ? "alert" : undefined}
        >
          {copyState.message}
        </p>
      ) : null}
      {copyState.fallbackText ? (
        <details className="manual-note-readiness-copy-packet-fallback" open>
          <summary>Manual copy fallback</summary>
          <textarea
            readOnly
            value={copyState.fallbackText}
            aria-label="Manual readiness packet copy fallback"
          />
        </details>
      ) : null}
    </section>
  );
}

function getReadinessPacketFreshnessStatus({
  currentPacketFingerprint,
  lastCopiedPacketFingerprint,
}: {
  currentPacketFingerprint: string | null;
  lastCopiedPacketFingerprint: string | null;
}): ReadinessCopyPacketFreshnessStatus {
  if (!currentPacketFingerprint) return "unavailable";
  if (!lastCopiedPacketFingerprint) return "no_packet_copied";
  return currentPacketFingerprint === lastCopiedPacketFingerprint
    ? "current"
    : "stale";
}

function ReadinessPacketInputSummaryList({
  summary,
}: {
  summary: ManualNotePreviewDraftReadinessCopyPacketInputSummary;
}) {
  return (
    <dl className="manual-note-readiness-copy-packet-summary-list">
      {Object.entries(summary).map(([key, value]) => (
        <div key={key}>
          <dt>{key}</dt>
          <dd>{formatReadinessPacketSummaryValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function buildReadinessPacketInputDiffSummary({
  currentSummary,
  lastCopiedSummary,
}: {
  currentSummary: ManualNotePreviewDraftReadinessCopyPacketInputSummary;
  lastCopiedSummary: ManualNotePreviewDraftReadinessCopyPacketInputSummary | null;
}) {
  if (!lastCopiedSummary) return ["No last copied packet summary is available."];

  const trackedFields: Array<
    keyof ManualNotePreviewDraftReadinessCopyPacketInputSummary
  > = [
    "preflight_readiness_status",
    "lifecycle_status",
    "activity_count",
    "label_state",
    "discard_state",
    "last_activity_type",
    "blocker_count",
    "warning_count",
  ];

  return trackedFields.map((field) => {
    const currentValue = formatReadinessPacketSummaryValue(currentSummary[field]);
    const lastValue = formatReadinessPacketSummaryValue(lastCopiedSummary[field]);
    const state = currentValue === lastValue ? "unchanged" : "changed";
    return `${field} ${state}: ${lastValue} -> ${currentValue}`;
  });
}

function formatReadinessPacketSummaryValue(value: unknown) {
  if (value === null || typeof value === "undefined") return "none";
  return String(value);
}
