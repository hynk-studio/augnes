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
