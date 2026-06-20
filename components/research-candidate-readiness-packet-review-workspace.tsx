"use client";

import {
  READINESS_PACKET_REVIEW_SECTIONS,
  type ManualNotePreviewDraftReadinessPacketDetailMode,
  type ManualNotePreviewDraftReadinessPacketFormatView,
  type ManualNotePreviewDraftReadinessPacketGateFilter,
  type ManualNotePreviewDraftReadinessPacketReviewOptions,
  type ManualNotePreviewDraftReadinessPacketReviewPreview,
  type ManualNotePreviewDraftReadinessPacketReviewSection,
} from "@/lib/research-candidate-review/manual-note-preview-draft-readiness-copy-packet";

export type ReadinessCopyPacketFreshnessStatus =
  | "no_packet_copied"
  | "current"
  | "stale"
  | "unavailable";

const READINESS_PACKET_FORMAT_LABELS: Record<
  ManualNotePreviewDraftReadinessPacketFormatView,
  string
> = {
  markdown: "Markdown",
  json: "JSON",
};

const READINESS_PACKET_DETAIL_LABELS: Record<
  ManualNotePreviewDraftReadinessPacketDetailMode,
  string
> = {
  summary: "Summary",
  full: "Full",
};

const READINESS_PACKET_GATE_FILTER_LABELS: Record<
  ManualNotePreviewDraftReadinessPacketGateFilter,
  string
> = {
  all: "All",
  block: "Block",
  warn: "Warning",
  pass: "Pass",
};

type ReadinessPacketReviewWorkspaceProps = {
  options: ManualNotePreviewDraftReadinessPacketReviewOptions;
  preview: ManualNotePreviewDraftReadinessPacketReviewPreview | null;
  packetFreshnessStatus: ReadinessCopyPacketFreshnessStatus;
  onChangeOptions: (
    options: ManualNotePreviewDraftReadinessPacketReviewOptions,
  ) => void;
};

export function ReadinessPacketReviewWorkspace({
  options,
  preview,
  packetFreshnessStatus,
  onChangeOptions,
}: ReadinessPacketReviewWorkspaceProps) {
  function updateFormat(
    packet_format_view: ManualNotePreviewDraftReadinessPacketFormatView,
  ) {
    onChangeOptions({ ...options, packet_format_view });
  }

  function updateDetailMode(
    packet_detail_mode: ManualNotePreviewDraftReadinessPacketDetailMode,
  ) {
    onChangeOptions({ ...options, packet_detail_mode });
  }

  function updateGateFilter(
    gate_group_filter: ManualNotePreviewDraftReadinessPacketGateFilter,
  ) {
    onChangeOptions({ ...options, gate_group_filter });
  }

  function updateSectionVisibility(
    section: ManualNotePreviewDraftReadinessPacketReviewSection,
    checked: boolean,
  ) {
    onChangeOptions({
      ...options,
      section_visibility: {
        ...options.section_visibility,
        [section]: checked,
      },
    });
  }

  return (
    <section
      className="manual-note-readiness-packet-review-workspace"
      aria-label="Packet review workspace"
    >
      <div className="manual-note-readiness-packet-review-header">
        <div>
          <h4>Packet review workspace</h4>
          <p>
            Review workspace is local and read-only. Copy actions remain local clipboard only.
          </p>
        </div>
        <div className="manual-note-readiness-packet-review-counts">
          <span>
            visible sections <code>{preview?.visible_section_count ?? 0}</code>
          </span>
          <span>
            hidden sections <code>{preview?.hidden_section_count ?? 0}</code>
          </span>
          <span>
            visible gates <code>{preview?.visible_gate_count ?? 0}</code>
          </span>
          <span>
            hidden gates <code>{preview?.hidden_gate_count ?? 0}</code>
          </span>
          <span>
            preview character count{" "}
            <code>{preview?.preview_character_count ?? 0}</code>
          </span>
        </div>
      </div>
      <ul className="manual-note-label-boundary-copy">
        <li>Packet review controls are local UI state only.</li>
        <li>Filtering the review preview does not change the full packet.</li>
        <li>No packet is stored, sent, shared, or persisted.</li>
        <li>
          No proof/evidence, Perspective, work item, provider, retrieval, source-fetch, Codex, or handoff action is run.
        </li>
      </ul>
      {packetFreshnessStatus === "stale" ? (
        <p className="manual-note-runtime-error" role="status">
          Current preview differs from the last copied packet. Copy a fresh
          packet before using it for review.
        </p>
      ) : null}
      {packetFreshnessStatus === "unavailable" ? (
        <p className="manual-note-runtime-hint">
          Run or refresh preflight for the opened stored preview draft before
          reviewing a packet.
        </p>
      ) : null}
      <div className="manual-note-readiness-packet-review-controls">
        <fieldset>
          <legend>Format</legend>
          {(
            Object.keys(
              READINESS_PACKET_FORMAT_LABELS,
            ) as ManualNotePreviewDraftReadinessPacketFormatView[]
          ).map((formatView) => (
            <label key={formatView}>
              <input
                type="radio"
                name="readiness-packet-format-view"
                checked={options.packet_format_view === formatView}
                onChange={() => updateFormat(formatView)}
              />
              <span>{READINESS_PACKET_FORMAT_LABELS[formatView]}</span>
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Detail</legend>
          {(
            Object.keys(
              READINESS_PACKET_DETAIL_LABELS,
            ) as ManualNotePreviewDraftReadinessPacketDetailMode[]
          ).map((detailMode) => (
            <label key={detailMode}>
              <input
                type="radio"
                name="readiness-packet-detail-mode"
                checked={options.packet_detail_mode === detailMode}
                onChange={() => updateDetailMode(detailMode)}
              />
              <span>{READINESS_PACKET_DETAIL_LABELS[detailMode]}</span>
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Gate filter</legend>
          {(
            Object.keys(
              READINESS_PACKET_GATE_FILTER_LABELS,
            ) as ManualNotePreviewDraftReadinessPacketGateFilter[]
          ).map((gateFilter) => (
            <label key={gateFilter}>
              <input
                type="radio"
                name="readiness-packet-gate-filter"
                checked={options.gate_group_filter === gateFilter}
                onChange={() => updateGateFilter(gateFilter)}
              />
              <span>{READINESS_PACKET_GATE_FILTER_LABELS[gateFilter]}</span>
            </label>
          ))}
        </fieldset>
      </div>
      <fieldset className="manual-note-readiness-packet-review-sections">
        <legend>Section visibility</legend>
        {READINESS_PACKET_REVIEW_SECTIONS.map((section) => (
          <label key={section.key}>
            <input
              type="checkbox"
              checked={options.section_visibility[section.key]}
              onChange={(event) =>
                updateSectionVisibility(section.key, event.currentTarget.checked)
              }
            />
            <span>{section.label}</span>
          </label>
        ))}
      </fieldset>
      <div className="manual-note-readiness-packet-review-status-row">
        <span>
          preview_is_filtered{" "}
          <code>{String(preview?.preview_is_filtered ?? false)}</code>
        </span>
        <span>
          selected format <code>{options.packet_format_view}</code>
        </span>
        <span>
          selected detail <code>{options.packet_detail_mode}</code>
        </span>
        <span>
          selected gate filter <code>{options.gate_group_filter}</code>
        </span>
        <span>
          full_packet_fingerprint{" "}
          <code>{preview?.full_packet_fingerprint ?? "unavailable"}</code>
        </span>
      </div>
      <textarea
        readOnly
        className="manual-note-readiness-packet-review-preview"
        aria-label="Read-only readiness packet review preview"
        value={
          preview?.preview_text ??
          "Run or refresh preflight for the opened stored preview draft before reviewing a packet."
        }
      />
    </section>
  );
}
