"use client";

import {
  buildHandoffCopyExportPreview,
  type HandoffCopyExportMode,
} from "@/lib/handoff/handoff-capsule-copy-export";
import type { HandoffCapsulePreviewForWeb } from "@/lib/handoff/read-handoff-capsule-for-web";
import {
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  WorkplanePanelShell,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/workplane/workplane-panel-shell";
import { useMemo, useState, type CSSProperties } from "react";

type HandoffCopyExportPanelProps = {
  preview: HandoffCapsulePreviewForWeb;
};

type CopyState = {
  status: "idle" | "success" | "error";
  mode: HandoffCopyExportMode | null;
  message: string;
  fallbackText: string | null;
  lastCopiedPacketFingerprint: string | null;
  lastCopiedCharacterCount: number;
};

type PacketFreshnessStatus =
  | "no_packet_copied"
  | "current"
  | "stale"
  | "unavailable";

const boundaryFlagLabels = [
  "local_clipboard_only",
  "external_handoff_sent",
  "codex_executed",
  "github_called",
  "provider_called",
  "proof_evidence_written",
  "db_written",
  "state_mutated",
  "copy_persisted",
] as const;

const buttonGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))",
  gap: "8px",
  minWidth: 0,
};

const copyButtonStyle: CSSProperties = {
  minHeight: "42px",
  border: "1px solid rgba(14, 116, 144, 0.32)",
  borderRadius: "8px",
  background: "#ecfeff",
  color: "#155e75",
  fontSize: "0.8rem",
  fontWeight: 780,
  lineHeight: 1.2,
  cursor: "pointer",
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: "170px",
  boxSizing: "border-box",
  padding: "10px",
  border: "1px solid rgba(30, 41, 59, 0.18)",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#0f172a",
  fontFamily:
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  fontSize: "0.74rem",
  lineHeight: 1.35,
  resize: "vertical",
  overflowWrap: "anywhere",
};

const statusStyle: CSSProperties = {
  ...workplaneItemStyle,
  background: "#f0fdf4",
  borderColor: "rgba(22, 163, 74, 0.22)",
};

export function HandoffCopyExportPanel({
  preview,
}: HandoffCopyExportPanelProps) {
  const copyPreview = useMemo(
    () => buildHandoffCopyExportPreview(preview),
    [preview],
  );
  const [copyState, setCopyState] = useState<CopyState>({
    status: "idle",
    mode: null,
    message:
      "No packet copied yet. Local clipboard/manual copy preview is available.",
    fallbackText: null,
    lastCopiedPacketFingerprint: null,
    lastCopiedCharacterCount: 0,
  });

  const freshnessStatus = getPacketFreshnessStatus({
    currentFingerprint: copyPreview.packet_fingerprint,
    lastCopiedFingerprint: copyState.lastCopiedPacketFingerprint,
  });

  async function copyPacket(mode: HandoffCopyExportMode) {
    const text = getCopyText(copyPreview, mode);
    const nextState = {
      mode,
      fallbackText: text,
      lastCopiedPacketFingerprint: copyPreview.packet_fingerprint,
      lastCopiedCharacterCount: text.length,
    };

    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard ||
      typeof navigator.clipboard.writeText !== "function"
    ) {
      setCopyState({
        ...nextState,
        status: "error",
        message:
          "Clipboard API is unavailable. Select the fallback packet text manually.",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopyState({
        ...nextState,
        status: "success",
        message: `${getModeLabel(mode)} copied locally to clipboard.`,
        fallbackText: null,
      });
    } catch {
      setCopyState({
        ...nextState,
        status: "error",
        message:
          "Clipboard write failed. Select the fallback packet text manually.",
      });
    }
  }

  return (
    <WorkplanePanelShell
      kicker="Phase 7F local copy"
      title="Handoff copy/export preview"
      ariaLabel="Handoff Capsule and Codex Launch Card local copy export preview"
    >
      <p style={workplaneCopyStyle}>
        Local clipboard/manual copy preview only. Copying does not send,
        launch, execute, post, persist, create files, call external services,
        or mutate Augnes state.
      </p>

      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric label="Freshness" value={freshnessStatus} />
        <WorkplanePanelMetric
          label="Fingerprint"
          value={copyPreview.packet_fingerprint}
        />
        <WorkplanePanelMetric
          label="Last count"
          value={copyState.lastCopiedCharacterCount}
        />
        <WorkplanePanelMetric label="Copy status" value={copyState.status} />
      </WorkplanePanelMetricGrid>

      <section aria-label="Handoff copy packet actions" style={buttonGridStyle}>
        <button
          type="button"
          style={copyButtonStyle}
          onClick={() => void copyPacket("handoff_capsule_markdown")}
        >
          Copy Handoff Capsule markdown
        </button>
        <button
          type="button"
          style={copyButtonStyle}
          onClick={() => void copyPacket("codex_launch_card_markdown")}
        >
          Copy Codex Launch Card markdown
        </button>
        <button
          type="button"
          style={copyButtonStyle}
          onClick={() => void copyPacket("combined_review_packet_markdown")}
        >
          Copy combined review packet
        </button>
        <button
          type="button"
          style={copyButtonStyle}
          onClick={() => void copyPacket("json_preview")}
        >
          Copy JSON preview
        </button>
      </section>

      <section aria-label="Handoff copy status" style={statusStyle} role="status">
        <span style={workplaneBadgeStyle}>copy status</span>
        <strong>{copyState.message}</strong>
        <span style={workplaneCopyStyle}>
          packet_fingerprint {copyPreview.packet_fingerprint}
        </span>
        <span style={workplaneCopyStyle}>
          packet_fingerprint_algorithm{" "}
          {copyPreview.packet_fingerprint_algorithm}
        </span>
        <span style={workplaneCopyStyle}>
          packet_character_count{" "}
          {copyState.mode
            ? copyPreview.character_counts[copyState.mode]
            : copyPreview.character_counts.combined_review_packet_markdown}
        </span>
      </section>

      <BoundaryFlags flags={copyPreview.boundary_flags} />

      <section
        aria-label="Handoff copy source fallback status"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>source/fallback status</span>
        <strong>{preview.source_status.source}</strong>
        <span style={workplaneCopyStyle}>
          Capsule: {preview.source_status.capsule}
        </span>
        <span style={workplaneCopyStyle}>
          Launch Card: {preview.source_status.launch_card}
        </span>
        <span style={workplaneCopyStyle}>
          {preview.source_status.source_disclosure}
        </span>
        <span style={workplaneCopyStyle}>
          Copied text may become stale; re-copy before use if source/fallback
          status changes.
        </span>
      </section>

      {copyState.fallbackText ? (
        <section
          aria-label="Manual copy fallback packet text"
          style={workplaneItemStyle}
        >
          <span style={workplaneBadgeStyle}>manual copy fallback</span>
          <p style={workplaneCopyStyle}>
            Select the read-only packet text below if local clipboard copy is
            unavailable.
          </p>
          <textarea
            aria-label="Manual copy fallback text"
            readOnly
            value={copyState.fallbackText}
            style={textareaStyle}
          />
        </section>
      ) : null}
    </WorkplanePanelShell>
  );
}

function BoundaryFlags({
  flags,
}: {
  flags: ReturnType<
    typeof buildHandoffCopyExportPreview
  >["boundary_flags"];
}) {
  return (
    <section aria-label="Handoff copy boundary flags" style={workplaneItemStyle}>
      <span style={workplaneBadgeStyle}>local copy boundary</span>
      <ul style={workplaneListStyle}>
        {boundaryFlagLabels.map((key) => (
          <li key={key} style={workplaneItemStyle}>
            <strong>{key}</strong>
            <span style={workplaneCopyStyle}>{String(flags[key])}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function getCopyText(
  copyPreview: ReturnType<typeof buildHandoffCopyExportPreview>,
  mode: HandoffCopyExportMode,
): string {
  if (mode === "handoff_capsule_markdown") {
    return copyPreview.capsule_markdown;
  }

  if (mode === "codex_launch_card_markdown") {
    return copyPreview.launch_card_markdown;
  }

  if (mode === "json_preview") {
    return copyPreview.json_text;
  }

  return copyPreview.combined_markdown;
}

function getModeLabel(mode: HandoffCopyExportMode): string {
  if (mode === "handoff_capsule_markdown") {
    return "Handoff Capsule markdown";
  }

  if (mode === "codex_launch_card_markdown") {
    return "Codex Launch Card markdown";
  }

  if (mode === "json_preview") {
    return "JSON preview";
  }

  return "combined review packet";
}

function getPacketFreshnessStatus({
  currentFingerprint,
  lastCopiedFingerprint,
}: {
  currentFingerprint: string | null;
  lastCopiedFingerprint: string | null;
}): PacketFreshnessStatus {
  if (!currentFingerprint) return "unavailable";
  if (!lastCopiedFingerprint) return "no_packet_copied";
  return currentFingerprint === lastCopiedFingerprint ? "current" : "stale";
}
