import {
  MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_FINGERPRINT_ALGORITHM,
  MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_KIND,
  MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_VERSION,
  type ManualNotePreviewDraftActivityOkResponse,
  type ManualNotePreviewDraftDetailOkResponse,
  type ManualNotePreviewDraftPromotionReadinessGateResult,
  type ManualNotePreviewDraftPromotionReadinessOkResponse,
  type ManualNotePreviewDraftReadinessCopyPacket,
  type ManualNotePreviewDraftReadinessCopyPacketBoundary,
  type ManualNotePreviewDraftReadinessCopyPacketInputSummary,
} from "@/lib/research-candidate-review/manual-note-runtime-preview";

type BuildReadinessCopyPacketInput = {
  storedDraftResult: ManualNotePreviewDraftDetailOkResponse;
  preflightResult: ManualNotePreviewDraftPromotionReadinessOkResponse;
  activityResult?: ManualNotePreviewDraftActivityOkResponse | null;
  generatedAt?: string;
};

type BuildReadinessCopyPacketResult = {
  packet: ManualNotePreviewDraftReadinessCopyPacket;
  markdown: string;
  json: string;
  packet_fingerprint: string;
  packet_fingerprint_algorithm: typeof MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_FINGERPRINT_ALGORITHM;
  packet_character_count_human: number;
  packet_character_count_json: number;
};

type ReadinessCopyPacketBeforeFingerprint = Omit<
  ManualNotePreviewDraftReadinessCopyPacket,
  "packet_fingerprint"
>;

export type ManualNotePreviewDraftReadinessPacketFormatView =
  | "markdown"
  | "json";

export type ManualNotePreviewDraftReadinessPacketDetailMode =
  | "summary"
  | "full";

export type ManualNotePreviewDraftReadinessPacketGateFilter =
  | "all"
  | "block"
  | "warn"
  | "pass";

export type ManualNotePreviewDraftReadinessPacketReviewSection =
  | "boundary"
  | "draft_metadata"
  | "readiness_summary"
  | "next_review_steps"
  | "source_summary"
  | "candidate_summary"
  | "lifecycle_summary"
  | "gate_explanations"
  | "runtime_no_side_effects_authority";

export type ManualNotePreviewDraftReadinessPacketReviewSectionVisibility = Record<
  ManualNotePreviewDraftReadinessPacketReviewSection,
  boolean
>;

export type ManualNotePreviewDraftReadinessPacketReviewOptions = {
  packet_format_view: ManualNotePreviewDraftReadinessPacketFormatView;
  packet_detail_mode: ManualNotePreviewDraftReadinessPacketDetailMode;
  gate_group_filter: ManualNotePreviewDraftReadinessPacketGateFilter;
  section_visibility: ManualNotePreviewDraftReadinessPacketReviewSectionVisibility;
};

export type ManualNotePreviewDraftReadinessPacketReviewPreview = {
  packet_format_view: ManualNotePreviewDraftReadinessPacketFormatView;
  packet_detail_mode: ManualNotePreviewDraftReadinessPacketDetailMode;
  gate_group_filter: ManualNotePreviewDraftReadinessPacketGateFilter;
  preview_text: string;
  preview_markdown: string;
  preview_json: string;
  preview_character_count: number;
  visible_gate_count: number;
  hidden_gate_count: number;
  visible_section_count: number;
  hidden_section_count: number;
  selected_sections: ManualNotePreviewDraftReadinessPacketReviewSection[];
  hidden_sections: ManualNotePreviewDraftReadinessPacketReviewSection[];
  preview_is_filtered: boolean;
  full_packet_fingerprint: string;
};

export const READINESS_PACKET_REVIEW_SECTIONS: Array<{
  key: ManualNotePreviewDraftReadinessPacketReviewSection;
  label: string;
}> = [
  { key: "boundary", label: "boundary" },
  { key: "draft_metadata", label: "draft metadata" },
  { key: "readiness_summary", label: "readiness summary" },
  { key: "next_review_steps", label: "next review steps" },
  { key: "source_summary", label: "source summary" },
  { key: "candidate_summary", label: "candidate summary" },
  { key: "lifecycle_summary", label: "lifecycle summary" },
  { key: "gate_explanations", label: "gate explanations" },
  {
    key: "runtime_no_side_effects_authority",
    label: "runtime/no-side-effects/authority",
  },
];

export const DEFAULT_READINESS_PACKET_REVIEW_SECTION_VISIBILITY =
  READINESS_PACKET_REVIEW_SECTIONS.reduce(
    (visibility, section) => ({
      ...visibility,
      [section.key]: true,
    }),
    {} as ManualNotePreviewDraftReadinessPacketReviewSectionVisibility,
  );

const COPY_PACKET_BOUNDARY: ManualNotePreviewDraftReadinessCopyPacketBoundary = {
  preview_only: true,
  local_clipboard_only: true,
  external_handoff_sent: false,
  proof_or_evidence_writes: false,
  perspective_promotion: false,
  canonical_graph_write: false,
  work_item_creation: false,
  provider_or_openai_calls: false,
  retrieval_or_rag: false,
  source_fetching: false,
  codex_execution: false,
  browser_persistence: false,
  raw_manual_note_text_included: false,
  promotion_authority_granted: false,
  packet_fingerprint_is_security_authority: false,
  packet_fingerprint_persisted: false,
};

export function buildManualNotePreviewDraftReadinessCopyPacket({
  storedDraftResult,
  preflightResult,
  activityResult,
  generatedAt = new Date().toISOString(),
}: BuildReadinessCopyPacketInput): BuildReadinessCopyPacketResult {
  const displayLabel =
    storedDraftResult.draft.operator_note_label ?? "Untitled preview draft";
  const activityIsCurrent =
    activityResult?.preview_draft_id === storedDraftResult.draft.preview_draft_id;
  const copiedActivityIncluded = Boolean(activityResult && activityIsCurrent);
  const copiedActivityCount =
    activityResult && activityIsCurrent ? activityResult.count : 0;
  const packetInputSummary: ManualNotePreviewDraftReadinessCopyPacketInputSummary =
    {
      preview_draft_id: storedDraftResult.draft.preview_draft_id,
      preflight_readiness_status: preflightResult.readiness_status,
      preflight_readiness_score: preflightResult.readiness_score,
      lifecycle_status: preflightResult.lifecycle_status,
      draft_updated_at: storedDraftResult.draft.updated_at,
      label_state: preflightResult.lifecycle_summary.label_state,
      discard_state: preflightResult.lifecycle_summary.discard_state,
      activity_count: preflightResult.lifecycle_summary.activity_count,
      last_activity_type: preflightResult.lifecycle_summary.last_activity_type,
      last_activity_at: preflightResult.lifecycle_summary.last_activity_at,
      gate_count: preflightResult.gate_results.length,
      blocker_count: preflightResult.blockers.length,
      warning_count: preflightResult.warnings.length,
      copied_activity_included: copiedActivityIncluded,
      copied_activity_count: copiedActivityCount,
    };
  const packetBeforeFingerprint: ReadinessCopyPacketBeforeFingerprint = {
    packet_version: MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_VERSION,
    packet_kind: MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_KIND,
    generated_at: generatedAt,
    packet_generated_at: generatedAt,
    packet_fingerprint_algorithm:
      MANUAL_NOTE_PREVIEW_DRAFT_READINESS_COPY_PACKET_FINGERPRINT_ALGORITHM,
    packet_input_summary: packetInputSummary,
    preview_draft_id: storedDraftResult.draft.preview_draft_id,
    operator_note_label: storedDraftResult.draft.operator_note_label,
    display_label: displayLabel,
    lifecycle_status: preflightResult.lifecycle_status,
    draft_metadata: {
      parser_version: storedDraftResult.draft.parser_version,
      preview_version: storedDraftResult.draft.preview_version,
      input_fingerprint: storedDraftResult.draft.input_fingerprint,
      warning_count: storedDraftResult.warnings.length,
      candidate_count_summary: storedDraftResult.draft.candidate_count_summary,
      created_at: storedDraftResult.draft.created_at,
      updated_at: storedDraftResult.draft.updated_at,
    },
    readiness_status: preflightResult.readiness_status,
    readiness_score: preflightResult.readiness_score,
    blockers: preflightResult.blockers,
    warnings: preflightResult.warnings,
    next_review_steps: preflightResult.next_review_steps,
    source_summary: preflightResult.source_summary,
    candidate_summary: preflightResult.candidate_summary,
    lifecycle_summary: preflightResult.lifecycle_summary,
    gate_results: preflightResult.gate_results,
    activity_summary: {
      included: copiedActivityIncluded,
      count: copiedActivityCount,
      lifecycle_status:
        activityResult && activityIsCurrent ? activityResult.lifecycle_status : null,
      activity_types:
        activityResult && activityIsCurrent
          ? activityResult.items.map((item) => item.activity_type)
          : [],
    },
    runtime_boundary: preflightResult.runtime_boundary,
    no_side_effects: preflightResult.no_side_effects,
    authority: preflightResult.authority,
    copy_packet_boundary: COPY_PACKET_BOUNDARY,
  };
  const packet: ManualNotePreviewDraftReadinessCopyPacket = {
    ...packetBeforeFingerprint,
    packet_fingerprint: buildReadinessCopyPacketFingerprint(packetBeforeFingerprint),
  };
  const markdown = formatReadinessCopyPacketMarkdown(packet);
  const json = JSON.stringify(packet, null, 2);

  return {
    packet,
    markdown,
    json,
    packet_fingerprint: packet.packet_fingerprint,
    packet_fingerprint_algorithm: packet.packet_fingerprint_algorithm,
    packet_character_count_human: markdown.length,
    packet_character_count_json: json.length,
  };
}

export function buildManualNotePreviewDraftReadinessPacketReviewPreview(
  packet: ManualNotePreviewDraftReadinessCopyPacket,
  options: ManualNotePreviewDraftReadinessPacketReviewOptions,
): ManualNotePreviewDraftReadinessPacketReviewPreview {
  const selectedSections = buildReadinessPacketReviewSectionSummary(options)
    .selected_sections;
  const hiddenSections = buildReadinessPacketReviewSectionSummary(options)
    .hidden_sections;
  const visibleGates = filterReadinessPacketGateResults(
    packet.gate_results,
    options.gate_group_filter,
  );
  const hiddenGateCount = packet.gate_results.length - visibleGates.length;
  const previewIsFiltered =
    options.packet_detail_mode === "summary" ||
    options.gate_group_filter !== "all" ||
    hiddenSections.length > 0;
  const previewMarkdown = formatReadinessPacketPreviewMarkdown({
    packet,
    options,
    selectedSections,
    visibleGates,
    previewIsFiltered,
  });
  const previewJson = formatReadinessPacketPreviewJson({
    packet,
    options,
    selectedSections,
    hiddenSections,
    visibleGates,
    hiddenGateCount,
    previewIsFiltered,
  });
  const previewText =
    options.packet_format_view === "markdown" ? previewMarkdown : previewJson;

  return {
    packet_format_view: options.packet_format_view,
    packet_detail_mode: options.packet_detail_mode,
    gate_group_filter: options.gate_group_filter,
    preview_text: previewText,
    preview_markdown: previewMarkdown,
    preview_json: previewJson,
    preview_character_count: previewText.length,
    visible_gate_count: visibleGates.length,
    hidden_gate_count: hiddenGateCount,
    visible_section_count: selectedSections.length,
    hidden_section_count: hiddenSections.length,
    selected_sections: selectedSections,
    hidden_sections: hiddenSections,
    preview_is_filtered: previewIsFiltered,
    full_packet_fingerprint: packet.packet_fingerprint,
  };
}

export function buildReadinessPacketReviewSectionSummary(
  options: ManualNotePreviewDraftReadinessPacketReviewOptions,
) {
  const selected_sections = READINESS_PACKET_REVIEW_SECTIONS.filter(
    (section) => options.section_visibility[section.key],
  ).map((section) => section.key);
  const hidden_sections = READINESS_PACKET_REVIEW_SECTIONS.filter(
    (section) => !options.section_visibility[section.key],
  ).map((section) => section.key);

  return {
    selected_sections,
    hidden_sections,
    visible_section_count: selected_sections.length,
    hidden_section_count: hidden_sections.length,
  };
}

export function filterReadinessPacketGateResults(
  gates: ManualNotePreviewDraftPromotionReadinessGateResult[],
  filter: ManualNotePreviewDraftReadinessPacketGateFilter,
) {
  if (filter === "all") return gates;
  return gates.filter((gate) => gate.status === filter);
}

export function formatReadinessPacketPreviewMarkdown({
  packet,
  options,
  selectedSections,
  visibleGates,
  previewIsFiltered,
}: {
  packet: ManualNotePreviewDraftReadinessCopyPacket;
  options: ManualNotePreviewDraftReadinessPacketReviewOptions;
  selectedSections: ManualNotePreviewDraftReadinessPacketReviewSection[];
  visibleGates: ManualNotePreviewDraftPromotionReadinessGateResult[];
  previewIsFiltered: boolean;
}) {
  const isFullUnfiltered =
    options.packet_detail_mode === "full" &&
    options.gate_group_filter === "all" &&
    selectedSections.length === READINESS_PACKET_REVIEW_SECTIONS.length;

  if (isFullUnfiltered) return formatReadinessCopyPacketMarkdown(packet);

  const lines = [
    "# Research Candidate Preview Draft Readiness Packet Review Preview",
    "",
    "Review workspace is local and read-only.",
    "Filtering the review preview does not change the full packet.",
    "No packet is stored, sent, shared, or persisted.",
    "",
    `preview_is_filtered: ${String(previewIsFiltered)}`,
    `packet_format_view: ${options.packet_format_view}`,
    `packet_detail_mode: ${options.packet_detail_mode}`,
    `gate_group_filter: ${options.gate_group_filter}`,
    `packet_kind: ${packet.packet_kind}`,
    `packet_version: ${packet.packet_version}`,
    `packet_fingerprint: ${packet.packet_fingerprint}`,
    `packet_fingerprint_algorithm: ${packet.packet_fingerprint_algorithm}`,
    "",
  ];

  for (const section of selectedSections) {
    if (section === "boundary") {
      lines.push("## Packet Boundary", formatBooleanMap(packet.copy_packet_boundary), "");
    }
    if (section === "draft_metadata") {
      lines.push(
        "## Draft Metadata",
        `preview_draft_id: ${packet.preview_draft_id}`,
        `display_label: ${packet.display_label}`,
        `operator_note_label: ${packet.operator_note_label ?? "null"}`,
        `lifecycle_status: ${packet.lifecycle_status}`,
        `created_at: ${packet.draft_metadata.created_at}`,
        `updated_at: ${packet.draft_metadata.updated_at}`,
        `input_fingerprint: ${packet.draft_metadata.input_fingerprint}`,
        "",
      );
    }
    if (section === "readiness_summary") {
      lines.push(
        "## Readiness Summary",
        `readiness_status: ${packet.readiness_status}`,
        `readiness_score: ${packet.readiness_score}`,
        "",
        "### Blockers",
        formatList(packet.blockers, "No blockers."),
        "",
        "### Warnings",
        formatList(packet.warnings, "No warnings."),
        "",
      );
    }
    if (section === "next_review_steps") {
      lines.push(
        "## Next Review Steps",
        formatList(packet.next_review_steps, "No next review steps."),
        "",
      );
    }
    if (section === "source_summary") {
      lines.push(
        "## Source Summary",
        `source_ref_count: ${packet.source_summary.source_ref_count}`,
        `source_titles: ${formatInlineList(packet.source_summary.source_titles)}`,
        `source_identifiers: ${formatInlineList(packet.source_summary.source_identifiers)}`,
        `source_statuses: ${formatInlineList(packet.source_summary.source_statuses)}`,
        "",
      );
    }
    if (section === "candidate_summary") {
      lines.push("## Candidate Summary", formatNumberMap(packet.candidate_summary), "");
    }
    if (section === "lifecycle_summary") {
      lines.push("## Lifecycle Summary", formatMixedMap(packet.lifecycle_summary), "");
    }
    if (section === "gate_explanations") {
      lines.push(
        "## Gate Explanations",
        ...formatReviewGateLines(visibleGates, options.packet_detail_mode),
        "",
      );
    }
    if (
      section === "runtime_no_side_effects_authority" &&
      options.packet_detail_mode === "full"
    ) {
      lines.push(
        "## Runtime Boundary",
        formatMixedMap(packet.runtime_boundary),
        "",
        "## No Side Effects",
        formatBooleanMap(packet.no_side_effects),
        "",
        "## Authority",
        formatBooleanMap(packet.authority),
        "",
      );
    }
  }

  if (
    selectedSections.includes("runtime_no_side_effects_authority") &&
    options.packet_detail_mode === "summary"
  ) {
    lines.push(
      "## Runtime/No-Side-Effects/Authority",
      "Runtime/no-side-effects/authority details are shown in full detail mode.",
      "",
    );
  }

  lines.push(
    "Raw manual note text is not included in this preview.",
    "Copy actions remain local clipboard only.",
  );

  return lines.join("\n");
}

export function formatReadinessPacketPreviewJson({
  packet,
  options,
  selectedSections,
  hiddenSections,
  visibleGates,
  hiddenGateCount,
  previewIsFiltered,
}: {
  packet: ManualNotePreviewDraftReadinessCopyPacket;
  options: ManualNotePreviewDraftReadinessPacketReviewOptions;
  selectedSections: ManualNotePreviewDraftReadinessPacketReviewSection[];
  hiddenSections: ManualNotePreviewDraftReadinessPacketReviewSection[];
  visibleGates: ManualNotePreviewDraftPromotionReadinessGateResult[];
  hiddenGateCount: number;
  previewIsFiltered: boolean;
}) {
  const isFullUnfiltered =
    options.packet_detail_mode === "full" &&
    options.gate_group_filter === "all" &&
    selectedSections.length === READINESS_PACKET_REVIEW_SECTIONS.length;

  if (isFullUnfiltered) return JSON.stringify(packet, null, 2);

  const sections: Record<string, unknown> = {};

  for (const section of selectedSections) {
    if (section === "boundary") sections.boundary = packet.copy_packet_boundary;
    if (section === "draft_metadata") {
      sections.draft_metadata = {
        preview_draft_id: packet.preview_draft_id,
        display_label: packet.display_label,
        operator_note_label: packet.operator_note_label,
        lifecycle_status: packet.lifecycle_status,
        draft_metadata: packet.draft_metadata,
      };
    }
    if (section === "readiness_summary") {
      sections.readiness_summary = {
        readiness_status: packet.readiness_status,
        readiness_score: packet.readiness_score,
        blockers: packet.blockers,
        warnings: packet.warnings,
      };
    }
    if (section === "next_review_steps") {
      sections.next_review_steps = packet.next_review_steps;
    }
    if (section === "source_summary") {
      sections.source_summary = packet.source_summary;
    }
    if (section === "candidate_summary") {
      sections.candidate_summary = packet.candidate_summary;
    }
    if (section === "lifecycle_summary") {
      sections.lifecycle_summary = packet.lifecycle_summary;
    }
    if (section === "gate_explanations") {
      sections.gate_explanations =
        options.packet_detail_mode === "summary"
          ? visibleGates.map(formatGateSummaryForReview)
          : visibleGates;
    }
    if (
      section === "runtime_no_side_effects_authority" &&
      options.packet_detail_mode === "full"
    ) {
      sections.runtime_no_side_effects_authority = {
        runtime_boundary: packet.runtime_boundary,
        no_side_effects: packet.no_side_effects,
        authority: packet.authority,
      };
    }
  }

  return JSON.stringify(
    {
      packet_kind: packet.packet_kind,
      packet_version: packet.packet_version,
      packet_fingerprint: packet.packet_fingerprint,
      packet_fingerprint_algorithm: packet.packet_fingerprint_algorithm,
      preview_is_filtered: previewIsFiltered,
      review_workspace_boundary: {
        local_ui_state_only: true,
        filtering_changes_preview_only: true,
        full_copy_packet_unchanged: true,
        packet_stored_sent_shared_or_persisted: false,
      },
      filter_summary: {
        packet_format_view: options.packet_format_view,
        packet_detail_mode: options.packet_detail_mode,
        gate_group_filter: options.gate_group_filter,
        selected_sections: selectedSections,
        hidden_sections: hiddenSections,
        visible_gate_count: visibleGates.length,
        hidden_gate_count: hiddenGateCount,
      },
      sections,
      copy_packet_boundary: packet.copy_packet_boundary,
    },
    null,
    2,
  );
}

function formatReadinessCopyPacketMarkdown(
  packet: ManualNotePreviewDraftReadinessCopyPacket,
) {
  return [
    `# Research Candidate Preview Draft Readiness Copy Packet`,
    "",
    `packet_kind: ${packet.packet_kind}`,
    `packet_version: ${packet.packet_version}`,
    `generated_at: ${packet.generated_at}`,
    `packet_fingerprint_algorithm: ${packet.packet_fingerprint_algorithm}`,
    `packet_fingerprint: ${packet.packet_fingerprint}`,
    "",
    "## Packet Input Summary",
    formatMixedMap(packet.packet_input_summary),
    "",
    "## Packet Boundary",
    formatBooleanMap(packet.copy_packet_boundary),
    "",
    "## Draft Metadata",
    `preview_draft_id: ${packet.preview_draft_id}`,
    `display_label: ${packet.display_label}`,
    `operator_note_label: ${packet.operator_note_label ?? "null"}`,
    `lifecycle_status: ${packet.lifecycle_status}`,
    `parser_version: ${packet.draft_metadata.parser_version}`,
    `preview_version: ${packet.draft_metadata.preview_version}`,
    `input_fingerprint: ${packet.draft_metadata.input_fingerprint}`,
    `created_at: ${packet.draft_metadata.created_at}`,
    `updated_at: ${packet.draft_metadata.updated_at}`,
    "",
    "## Readiness Summary",
    `readiness_status: ${packet.readiness_status}`,
    `readiness_score: ${packet.readiness_score}`,
    "",
    "### Blockers",
    formatList(packet.blockers, "No blockers."),
    "",
    "### Warnings",
    formatList(packet.warnings, "No warnings."),
    "",
    "### Next Review Steps",
    formatList(packet.next_review_steps, "No next review steps."),
    "",
    "## Candidate Summary",
    formatNumberMap(packet.candidate_summary),
    "",
    "## Source Summary",
    `source_ref_count: ${packet.source_summary.source_ref_count}`,
    `source_titles: ${formatInlineList(packet.source_summary.source_titles)}`,
    `source_identifiers: ${formatInlineList(packet.source_summary.source_identifiers)}`,
    `source_statuses: ${formatInlineList(packet.source_summary.source_statuses)}`,
    `source_boundary_notes: ${formatInlineList(packet.source_summary.source_boundary_notes)}`,
    "",
    "## Lifecycle Summary",
    formatMixedMap(packet.lifecycle_summary),
    "",
    "## Gate Explanations",
    ...formatGateGroup("Block Gates", packet.gate_results, "block"),
    ...formatGateGroup("Warning Gates", packet.gate_results, "warn"),
    ...formatGateGroup("Pass Gates", packet.gate_results, "pass"),
    "",
    "## Runtime Boundary",
    formatMixedMap(packet.runtime_boundary),
    "",
    "## No Side Effects",
    formatBooleanMap(packet.no_side_effects),
    "",
    "## Authority",
    formatBooleanMap(packet.authority),
    "",
    "Raw manual note text is not included in this packet.",
    "This packet is local clipboard material only and grants no promotion authority.",
    "Fingerprint compares preview packet content only. It excludes generated_at and is not security authority.",
  ].join("\n");
}

function formatReviewGateLines(
  gates: ManualNotePreviewDraftPromotionReadinessGateResult[],
  detailMode: ManualNotePreviewDraftReadinessPacketDetailMode,
) {
  if (gates.length === 0) return ["No gates match the selected filter."];

  return gates.flatMap((gate) =>
    detailMode === "summary"
      ? [
          `### ${gate.label} (${gate.gate_id})`,
          `status: ${gate.status}`,
          `summary: ${gate.summary}`,
          `explanation_title: ${gate.gate_explanation.explanation_title}`,
          `can_be_resolved_in_current_preview_lane: ${String(
            gate.gate_explanation.can_be_resolved_in_current_preview_lane,
          )}`,
          "",
        ]
      : [...formatGate(gate), ""],
  );
}

function formatGateSummaryForReview(
  gate: ManualNotePreviewDraftPromotionReadinessGateResult,
) {
  return {
    gate_id: gate.gate_id,
    label: gate.label,
    status: gate.status,
    summary: gate.summary,
    explanation_title: gate.gate_explanation.explanation_title,
    can_be_resolved_in_current_preview_lane:
      gate.gate_explanation.can_be_resolved_in_current_preview_lane,
  };
}

function buildReadinessCopyPacketFingerprint(
  packet: ReadinessCopyPacketBeforeFingerprint,
) {
  const fingerprintInput = omitGeneratedAtForFingerprint(packet);
  return fnv1a32Hex(stableCanonicalJson(fingerprintInput));
}

function omitGeneratedAtForFingerprint(
  packet: ReadinessCopyPacketBeforeFingerprint,
) {
  const {
    generated_at: _generatedAt,
    packet_generated_at: _packetGeneratedAt,
    ...rest
  } = packet;
  return rest;
}

function stableCanonicalJson(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableCanonicalJson(item)).join(",")}]`;
  }

  const valueType = typeof value;
  if (
    valueType === "string" ||
    valueType === "number" ||
    valueType === "boolean"
  ) {
    return JSON.stringify(value);
  }

  if (valueType === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entryValue]) => typeof entryValue !== "undefined")
      .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));
    return `{${entries
      .map(
        ([key, entryValue]) =>
          `${JSON.stringify(key)}:${stableCanonicalJson(entryValue)}`,
      )
      .join(",")}}`;
  }

  return "null";
}

function fnv1a32Hex(value: string) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function formatGateGroup(
  title: string,
  gates: ManualNotePreviewDraftPromotionReadinessGateResult[],
  status: ManualNotePreviewDraftPromotionReadinessGateResult["status"],
) {
  const matchingGates = gates.filter((gate) => gate.status === status);

  return [
    `### ${title}`,
    ...(matchingGates.length === 0
      ? ["No gates in this group."]
      : matchingGates.flatMap((gate) => formatGate(gate))),
    "",
  ];
}

function formatGate(gate: ManualNotePreviewDraftPromotionReadinessGateResult) {
  const explanation = gate.gate_explanation;

  return [
    `#### ${gate.label} (${gate.gate_id})`,
    `status: ${gate.status}`,
    `summary: ${gate.summary}`,
    `detail: ${gate.detail}`,
    `evidence_fields: ${formatInlineList(gate.evidence_fields)}`,
    `explanation_title: ${explanation.explanation_title}`,
    `operator_explanation: ${explanation.operator_explanation}`,
    `why_it_matters: ${explanation.why_it_matters}`,
    `current_signal: ${explanation.current_signal}`,
    `can_be_resolved_in_current_preview_lane: ${String(
      explanation.can_be_resolved_in_current_preview_lane,
    )}`,
    "suggested_safe_actions:",
    ...explanation.suggested_safe_actions.map(
      (action) => `- ${action.safe_action} (${action.action_scope})`,
    ),
    `related_ui_surfaces: ${formatInlineList(explanation.related_ui_surfaces)}`,
    `related_evidence_fields: ${formatInlineList(
      explanation.related_evidence_fields,
    )}`,
    "resolution_boundary:",
    formatBooleanMap(explanation.resolution_boundary),
  ];
}

function formatList(values: string[], emptyText: string) {
  if (values.length === 0) return emptyText;
  return values.map((value) => `- ${value}`).join("\n");
}

function formatInlineList(values: string[]) {
  return values.length > 0 ? values.join(", ") : "none";
}

function formatNumberMap(values: Record<string, number>) {
  return Object.entries(values)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

function formatBooleanMap(values: Record<string, boolean>) {
  return Object.entries(values)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join("\n");
}

function formatMixedMap(values: Record<string, unknown>) {
  return Object.entries(values)
    .map(([key, value]) => `${key}: ${String(value ?? "null")}`)
    .join("\n");
}
