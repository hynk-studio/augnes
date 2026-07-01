"use client";

import {
  buildAutonomyCopyExportPreview,
  type AutonomyCopyExportMode,
} from "@/lib/autonomy/autonomy-contract-copy-export";
import type { AutonomyContractPreviewForWeb } from "@/lib/autonomy/read-autonomy-contract-for-web";
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

type AutonomyCopyExportPanelProps = {
  preview: AutonomyContractPreviewForWeb;
};

type CopyState = {
  status: "idle" | "success" | "error";
  mode: AutonomyCopyExportMode | null;
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
  "external_posted",
  "autonomy_ran",
  "autonomy_scheduled",
  "daemon_started",
  "background_work_started",
  "codex_executed",
  "codex_launched",
  "github_called",
  "provider_called",
  "proof_evidence_written",
  "db_written",
  "state_mutated",
  "handoff_sent",
  "branch_pr_created",
  "copy_persisted",
  "budget_spent",
  "auto_apply_performed",
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

const statusStyle: CSSProperties = {
  ...workplaneItemStyle,
  background: "#f0fdf4",
  borderColor: "rgba(22, 163, 74, 0.22)",
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

export function AutonomyCopyExportPanel({
  preview,
}: AutonomyCopyExportPanelProps) {
  const copyPreview = useMemo(
    () => buildAutonomyCopyExportPreview(preview),
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

  async function copyPacket(mode: AutonomyCopyExportMode) {
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
      kicker="Phase 8F local copy"
      title="Autonomy copy/export preview"
      ariaLabel="Autonomy Contract local copy export preview"
    >
      <p style={workplaneCopyStyle}>
        Local clipboard/manual copy preview only. Copying does not run,
        schedule, launch Codex, execute Codex, send, post, persist, create
        files, spend budget, auto-apply deltas, call external services, or
        mutate Augnes state.
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

      <section aria-label="Autonomy copy packet actions" style={buttonGridStyle}>
        <button
          type="button"
          style={copyButtonStyle}
          onClick={() => void copyPacket("autonomy_contract_markdown")}
        >
          Copy Autonomy Contract markdown
        </button>
        <button
          type="button"
          style={copyButtonStyle}
          onClick={() => void copyPacket("budget_summary_markdown")}
        >
          Copy Budget summary
        </button>
        <button
          type="button"
          style={copyButtonStyle}
          onClick={() =>
            void copyPacket("review_escalation_checklist_markdown")
          }
        >
          Copy Review Escalation checklist
        </button>
        <button
          type="button"
          style={copyButtonStyle}
          onClick={() => void copyPacket("combined_review_packet_markdown")}
        >
          Copy combined autonomy review packet
        </button>
        <button
          type="button"
          style={copyButtonStyle}
          onClick={() => void copyPacket("json_preview")}
        >
          Copy JSON preview
        </button>
      </section>

      <section aria-label="Autonomy copy status" style={statusStyle} role="status">
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
        aria-label="Autonomy copy source fallback status"
        style={workplaneItemStyle}
      >
        <span style={workplaneBadgeStyle}>source/fallback status</span>
        <strong>{preview.source_status.source}</strong>
        <span style={workplaneCopyStyle}>
          Autonomy Contract: {preview.source_status.autonomy_contract}
        </span>
        <span style={workplaneCopyStyle}>
          Budget: {preview.source_status.budget}
        </span>
        <span style={workplaneCopyStyle}>
          Run Preview: {preview.source_status.run_preview}
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
          aria-label="Manual Autonomy copy fallback packet text"
          style={workplaneItemStyle}
        >
          <span style={workplaneBadgeStyle}>manual copy fallback</span>
          <p style={workplaneCopyStyle}>
            Select the read-only packet text below if local clipboard copy is
            unavailable.
          </p>
          <textarea
            aria-label="Manual Autonomy copy fallback text"
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
  flags: ReturnType<typeof buildAutonomyCopyExportPreview>["boundary_flags"];
}) {
  return (
    <section aria-label="Autonomy copy boundary flags" style={workplaneItemStyle}>
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
  copyPreview: ReturnType<typeof buildAutonomyCopyExportPreview>,
  mode: AutonomyCopyExportMode,
): string {
  if (mode === "autonomy_contract_markdown") {
    return copyPreview.autonomy_contract_markdown;
  }

  if (mode === "budget_summary_markdown") {
    return copyPreview.budget_summary_markdown;
  }

  if (mode === "review_escalation_checklist_markdown") {
    return copyPreview.review_escalation_checklist_markdown;
  }

  if (mode === "json_preview") {
    return copyPreview.json_text;
  }

  return copyPreview.combined_review_packet_markdown;
}

function getModeLabel(mode: AutonomyCopyExportMode): string {
  if (mode === "autonomy_contract_markdown") {
    return "Autonomy Contract markdown";
  }

  if (mode === "budget_summary_markdown") {
    return "Budget summary";
  }

  if (mode === "review_escalation_checklist_markdown") {
    return "Review Escalation checklist";
  }

  if (mode === "json_preview") {
    return "JSON preview";
  }

  return "combined autonomy review packet";
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
