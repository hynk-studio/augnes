"use client";

import {
  AutonomyKeyValues,
  AutonomyList,
  AutonomySection,
  WorkplanePanelMetric,
  WorkplanePanelMetricGrid,
  workplaneBadgeStyle,
  workplaneCopyStyle,
  workplaneItemStyle,
  workplaneListStyle,
} from "@/components/autonomy/autonomy-preview-shared";
import {
  AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_TITLES,
  buildAutonomyRunnerPreflightCopyPackets,
  type AutonomyRunnerPreflightCopyPacket,
  type AutonomyRunnerPreflightCopyPacketMode,
} from "@/lib/autonomy/autonomy-runner-preflight-copy-export";
import type { AutonomyRunnerPreflightPreviewForWeb } from "@/lib/autonomy/read-autonomy-runner-preflight-for-web";
import { useMemo, useState, type CSSProperties } from "react";

type AutonomyRunnerPreflightCopyExportPanelProps = {
  preview: AutonomyRunnerPreflightPreviewForWeb;
};

type CopyState = {
  status: "idle" | "success" | "manual_copy_required";
  mode: AutonomyRunnerPreflightCopyPacketMode | null;
  message: string;
  character_count: number;
};

const copyBoundaryItems = [
  "Copy/manual-copy only",
  "Local clipboard only when clipboard copy is available",
  "No file download/export-to-disk",
  "No external post/send/publish",
  "No runner starts",
  "No scheduler starts",
  "No daemon starts",
  "No background work starts",
  "No Codex execution",
  "No GitHub/provider/OpenAI call",
  "No DB write",
  "No proof/evidence write",
  "No memory mutation",
  "No durable Perspective apply",
  "No handoff send",
  "No branch/PR creation",
  "No auto-apply",
  "No budget spend",
  "No external side effect",
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
  minHeight: "180px",
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

const packetListStyle: CSSProperties = {
  ...workplaneListStyle,
  gap: "12px",
};

const packetItemStyle: CSSProperties = {
  ...workplaneItemStyle,
  gap: "8px",
};

export function AutonomyRunnerPreflightCopyExportPanel({
  preview,
}: AutonomyRunnerPreflightCopyExportPanelProps) {
  const copyPackets = useMemo(
    () => buildAutonomyRunnerPreflightCopyPackets(preview),
    [preview],
  );
  const [copyState, setCopyState] = useState<CopyState>({
    status: "idle",
    mode: null,
    message:
      "No packet copied yet. Manual-copy packet text is visible below.",
    character_count: 0,
  });

  async function copyPacket(packet: AutonomyRunnerPreflightCopyPacket) {
    const nextState = {
      mode: packet.mode,
      character_count: packet.character_count,
    };

    if (
      typeof navigator === "undefined" ||
      !navigator.clipboard ||
      typeof navigator.clipboard.writeText !== "function"
    ) {
      setCopyState({
        ...nextState,
        status: "manual_copy_required",
        message:
          "Clipboard API is unavailable. Select the visible packet text manually.",
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(packet.text);
      setCopyState({
        ...nextState,
        status: "success",
        message: `${packet.title} copied locally to clipboard.`,
      });
    } catch {
      setCopyState({
        ...nextState,
        status: "manual_copy_required",
        message:
          "Clipboard write failed. Select the visible packet text manually.",
      });
    }
  }

  return (
    <AutonomySection
      title="Autonomy Runner Preflight Copy Preview"
      description="Local text copy/manual-copy preview only. No file download/export-to-disk, external send, posting, run, schedule, launch, apply, persist, write, or state mutation behavior is exposed."
    >
      <WorkplanePanelMetricGrid>
        <WorkplanePanelMetric
          label="Packet version"
          value={copyPackets.packet_version}
        />
        <WorkplanePanelMetric
          label="Fingerprint"
          value={copyPackets.packet_fingerprint}
        />
        <WorkplanePanelMetric label="Copy status" value={copyState.status} />
        <WorkplanePanelMetric
          label="Last count"
          value={copyState.character_count}
        />
      </WorkplanePanelMetricGrid>

      <AutonomyList
        itemLabel="copy boundary"
        items={[...copyBoundaryItems]}
        limit={copyBoundaryItems.length}
      />

      <section
        aria-label="Autonomy Runner Preflight copy packet controls"
        style={buttonGridStyle}
      >
        {copyPackets.packets.map((packet) => (
          <button
            key={packet.mode}
            type="button"
            style={copyButtonStyle}
            onClick={() => void copyPacket(packet)}
          >
            {getCopyButtonLabel(packet.mode)}
          </button>
        ))}
      </section>

      <section aria-live="polite" style={workplaneItemStyle}>
        <span style={workplaneBadgeStyle}>manual copy status</span>
        <span style={workplaneCopyStyle}>{copyState.message}</span>
      </section>

      <AutonomyKeyValues
        rows={[
          ["dry_run_plan.status", preview.dry_run_plan.status],
          [
            "planned_steps_would_execute_false",
            preview.dry_run_plan.planned_steps.every(
              (step) => step.would_execute === false,
            ),
          ],
          [
            "bounded_json_public_safe",
            isPublicSafetyClear(copyPackets.bounded_json_preview),
          ],
          ["file_download_created", copyPackets.copy_boundary.file_download_created],
          ["exported_to_disk", copyPackets.copy_boundary.exported_to_disk],
          [
            "external_side_effect_created",
            copyPackets.copy_boundary.external_side_effect_created,
          ],
        ]}
      />

      <ul style={packetListStyle}>
        {copyPackets.packets.map((packet) => (
          <PacketPreview key={packet.mode} packet={packet} />
        ))}
      </ul>
    </AutonomySection>
  );
}

function PacketPreview({
  packet,
}: {
  packet: AutonomyRunnerPreflightCopyPacket;
}) {
  return (
    <li style={packetItemStyle}>
      <span style={workplaneBadgeStyle}>{packet.media_type}</span>
      <strong>{packet.title}</strong>
      <span style={workplaneCopyStyle}>
        Manual-copy packet text. It remains visible if local clipboard access is
        unavailable.
      </span>
      <AutonomyKeyValues
        rows={[
          ["packet_mode", packet.mode],
          ["character_count", packet.character_count],
          ["copy_manual_copy_only", true],
        ]}
      />
      <label style={workplaneCopyStyle} htmlFor={`packet-${packet.mode}`}>
        {packet.title} text
      </label>
      <textarea
        id={`packet-${packet.mode}`}
        aria-label={`${packet.title} manual-copy text`}
        readOnly
        style={textareaStyle}
        value={packet.text}
      />
    </li>
  );
}

function getCopyButtonLabel(mode: AutonomyRunnerPreflightCopyPacketMode) {
  switch (mode) {
    case "preflight_markdown":
      return "Copy preflight markdown";
    case "dry_run_plan_markdown":
      return "Copy dry-run plan markdown";
    case "readiness_checklist_markdown":
      return "Copy readiness checklist";
    case "combined_review_packet_markdown":
      return "Copy combined review packet";
    case "bounded_json_preview":
      return "Copy bounded JSON preview";
    default:
      return `Copy ${AUTONOMY_RUNNER_PREFLIGHT_COPY_PACKET_TITLES[mode]}`;
  }
}

function isPublicSafetyClear(
  preview: ReturnType<typeof buildAutonomyRunnerPreflightCopyPackets>["bounded_json_preview"],
) {
  const publicSafety = preview.preflight.public_safety;
  return (
    publicSafety.contains_private_conversation === false &&
    publicSafety.contains_hidden_reasoning === false &&
    publicSafety.contains_local_private_paths === false &&
    publicSafety.contains_secrets_or_tokens === false &&
    publicSafety.contains_raw_provider_output === false &&
    publicSafety.contains_raw_retrieval_output === false &&
    publicSafety.contains_real_account_artifacts === false
  );
}
