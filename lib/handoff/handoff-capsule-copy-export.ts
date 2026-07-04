import type { HandoffCapsulePreviewForWeb } from "@/lib/handoff/read-handoff-capsule-for-web";
import type { HandoffContextRelayRationale } from "@/types/handoff-context-relay-rationale";

export const HANDOFF_COPY_EXPORT_PACKET_VERSION = "handoff_copy_export.v0.1";
export const HANDOFF_COPY_EXPORT_PACKET_KIND =
  "handoff_capsule_copy_export_preview";
export const HANDOFF_COPY_EXPORT_FINGERPRINT_ALGORITHM =
  "fnv1a-32-canonical-json-v0.1";

export type HandoffCopyExportMode =
  | "handoff_capsule_markdown"
  | "codex_launch_card_markdown"
  | "combined_review_packet_markdown"
  | "json_preview";

export type HandoffCopyExportBoundaryFlags = {
  local_clipboard_only: true;
  external_handoff_sent: false;
  codex_executed: false;
  github_called: false;
  provider_called: false;
  proof_evidence_written: false;
  db_written: false;
  state_mutated: false;
  copy_persisted: false;
};

export type HandoffCopyExportInputSummary = {
  scope: string;
  capsule_id: string;
  launch_card_id: string;
  source_guide_brief_ref: string;
  source_status: HandoffCapsulePreviewForWeb["source_status"];
  fallback_reason_count: number;
  warning_count: number;
  gap_count: number;
  observed_count: number;
  inferred_count: number;
  suggested_count: number;
  judgment_count: number;
  expected_file_count: number;
  forbidden_file_count: number;
  required_check_count: number;
  optional_check_count: number;
  route_ref_count: number;
  docs_ref_count: number;
  context_rationale_selected_ref_count: number;
  context_rationale_warning_count: number;
  context_rationale_stop_count: number;
};

export type HandoffCopyExportJsonPacket = {
  packet_kind: typeof HANDOFF_COPY_EXPORT_PACKET_KIND;
  packet_version: typeof HANDOFF_COPY_EXPORT_PACKET_VERSION;
  packet_fingerprint_algorithm: typeof HANDOFF_COPY_EXPORT_FINGERPRINT_ALGORITHM;
  source: "Handoff Capsule / Codex Launch Card preview";
  scope: string;
  capsule_id: string;
  launch_card_id: string;
  source_guide_brief_ref: string;
  packet_input_summary: HandoffCopyExportInputSummary;
  source_status: HandoffCapsulePreviewForWeb["source_status"];
  fallback_reasons: string[];
  warnings: string[];
  gaps: string[];
  public_safety: HandoffCapsulePreviewForWeb["public_safety"];
  route_refs: string[];
  docs_refs: string[];
  observed_context: unknown[];
  inferred_context: unknown[];
  suggested_context: unknown[];
  suggestions_for_codex: unknown[];
  needs_user_judgment: unknown[];
  unresolved_user_judgment: unknown[];
  selected_delta_refs: unknown[];
  context_relay_rationale: HandoffContextRelayRationale | null;
  source_refs: unknown;
  expected_files: string[];
  forbidden_files: string[];
  required_checks: string[];
  optional_checks: string[];
  skipped_check_policy: string[];
  pr_body_requirements: string[];
  final_report_requirements: string[];
  proof_evidence_boundary: string[];
  authority_boundary_summary: string[];
  route_read_boundary_notes: string[];
  copy_export_boundary_statement: string[];
  boundary_flags: HandoffCopyExportBoundaryFlags;
};

export type HandoffCopyExportPreview = {
  packet_kind: typeof HANDOFF_COPY_EXPORT_PACKET_KIND;
  packet_version: typeof HANDOFF_COPY_EXPORT_PACKET_VERSION;
  packet_fingerprint_algorithm: typeof HANDOFF_COPY_EXPORT_FINGERPRINT_ALGORITHM;
  packet_fingerprint: string;
  packet_input_summary: HandoffCopyExportInputSummary;
  boundary_flags: HandoffCopyExportBoundaryFlags;
  capsule_markdown: string;
  launch_card_markdown: string;
  combined_markdown: string;
  json_preview: HandoffCopyExportJsonPacket;
  json_text: string;
  character_counts: Record<HandoffCopyExportMode, number>;
};

type HandoffMarkdownCopyPacketOptions = {
  include_context_relay_rationale?: boolean;
};

const COPY_EXPORT_BOUNDARY_STATEMENT = [
  "Local clipboard/manual copy preview only.",
  "Copying does not send a handoff.",
  "Copying does not launch Codex.",
  "Copying does not execute Codex.",
  "Copying does not create a branch or PR.",
  "Copying does not call GitHub.",
  "Copying does not call OpenAI/provider APIs.",
  "Copying does not write DB records.",
  "Copying does not write proof/evidence.",
  "Copying does not mutate memory/state/work/Perspective.",
  "Copying does not publish, merge, retry, replay, deploy, or externally post.",
  "Copying is not approval, proof, evidence, merge authority, launch authority, or source-of-truth state.",
  "Copied text may become stale; re-copy before use if source/fallback status changes.",
] as const;

export function buildHandoffCapsuleMarkdownCopyPacket(
  preview: HandoffCapsulePreviewForWeb,
  contextRelayRationale?: HandoffContextRelayRationale | null,
  options: HandoffMarkdownCopyPacketOptions = {},
): string {
  const capsule = preview.capsule;
  const includeContextRelayRationale =
    options.include_context_relay_rationale ?? true;
  const lines = [
    "# Handoff Capsule Copy Packet",
    "",
    ...formatPacketHeader(preview),
    "",
    "## Handoff Capsule",
    `- capsule_id: ${capsule.capsule_id}`,
    `- capsule_version: ${capsule.capsule_version}`,
    `- target_surface: ${capsule.target_surface}`,
    `- target_actor: ${capsule.target_actor}`,
    `- handoff_intent: ${capsule.handoff_intent}`,
    `- status: ${capsule.status}`,
    `- title: ${capsule.title}`,
    `- summary: ${capsule.summary}`,
    `- thesis: ${capsule.thesis}`,
    "",
    ...formatObservedInferredSuggestedJudgmentForCopy(preview),
    "",
    "## Selected Delta Refs",
    ...formatList(
      capsule.selected_delta_refs.map(
        (item) => `${item.delta_id}: ${item.reason}`,
      ),
    ),
    "",
    "## Source Refs",
    ...formatSourceRefsForCopy(capsule.source_refs),
    "",
    ...(includeContextRelayRationale
      ? [...formatContextRelayRationaleForCopy(contextRelayRationale), ""]
      : []),
    "## Validation Expectations",
    ...formatNamedList(
      "required_check",
      capsule.validation_expectations.required_checks,
    ),
    ...formatNamedList(
      "optional_check",
      capsule.validation_expectations.optional_checks,
    ),
    ...formatNamedList(
      "skipped_check_policy",
      capsule.validation_expectations.skipped_check_policy,
    ),
    "",
    "## Authority Boundary",
    ...formatAuthorityBoundaryForCopy(capsule.authority_boundary),
    "",
    "## Route / Read Boundary Notes",
    ...formatList(preview.boundary_notes),
    "",
    "## Copy / Export Boundary",
    ...formatCopyExportBoundaryForCopy(),
  ];

  return normalizeHandoffCopyText(lines.join("\n"));
}

export function buildCodexLaunchCardMarkdownCopyPacket(
  preview: HandoffCapsulePreviewForWeb,
  contextRelayRationale?: HandoffContextRelayRationale | null,
  options: HandoffMarkdownCopyPacketOptions = {},
): string {
  const launchCard = preview.launch_card;
  const includeContextRelayRationale =
    options.include_context_relay_rationale ?? true;
  const lines = [
    "# Codex Launch Card Copy Packet",
    "",
    ...formatPacketHeader(preview),
    "",
    "## Codex Launch Card",
    `- launch_card_id: ${launchCard.launch_card_id}`,
    `- card_version: ${launchCard.card_version}`,
    `- source_capsule_id: ${launchCard.source_capsule_id}`,
    `- repo: ${launchCard.repo}`,
    `- base_branch: ${launchCard.base_branch}`,
    `- branch_suggestion: ${launchCard.branch_suggestion}`,
    `- expected_pr_title: ${launchCard.expected_pr_title}`,
    `- task_goal: ${launchCard.task_goal}`,
    `- task_summary: ${launchCard.task_summary}`,
    `- status: ${launchCard.status}`,
    "",
    ...formatObservedInferredSuggestedJudgmentForCopy(preview),
    "",
    "## Expected Files",
    ...formatList(launchCard.expected_files),
    "",
    "## Forbidden Files",
    ...formatList(launchCard.forbidden_files),
    "",
    "## Required Checks",
    ...formatList(launchCard.required_checks),
    "",
    "## Optional Checks",
    ...formatList(launchCard.optional_checks),
    "",
    "## Skipped-Check Policy",
    ...formatList(launchCard.skipped_check_policy),
    "",
    "## PR Body Requirements",
    ...formatList(launchCard.pr_body_requirements),
    "",
    "## Final Report Requirements",
    ...formatList(launchCard.final_report_requirements),
    "",
    "## Proof / Evidence Boundary",
    ...formatList(launchCard.proof_evidence_boundary),
    "",
    "## Source Refs",
    ...formatSourceRefsForCopy(launchCard.source_refs),
    "",
    ...(includeContextRelayRationale
      ? [...formatContextRelayRationaleForCopy(contextRelayRationale), ""]
      : []),
    "## Authority Boundary",
    ...formatAuthorityBoundaryForCopy(launchCard.authority_boundary),
    "",
    "## Route / Read Boundary Notes",
    ...formatList(preview.boundary_notes),
    "",
    "## Copy / Export Boundary",
    ...formatCopyExportBoundaryForCopy(),
  ];

  return normalizeHandoffCopyText(lines.join("\n"));
}

export function buildCombinedHandoffLaunchMarkdownCopyPacket(
  preview: HandoffCapsulePreviewForWeb,
  contextRelayRationale?: HandoffContextRelayRationale | null,
): string {
  return normalizeHandoffCopyText(
    [
      "# Handoff Capsule + Codex Launch Card Review Packet",
      "",
      ...formatPacketHeader(preview),
      "",
      "## Review Boundary",
      "- Handoff Capsule and Codex Launch Card are reviewable transfer packets.",
      "- They prepare context for another surface.",
      "- They do not send, launch, execute, post, merge, publish, or mutate state.",
      "- No status may mean executed.",
      "- Suggestions are advisory only.",
      "- Unresolved user judgment remains unresolved.",
      "",
      ...formatContextRelayRationaleForCopy(contextRelayRationale),
      "",
      buildHandoffCapsuleMarkdownCopyPacket(preview, contextRelayRationale, {
        include_context_relay_rationale: false,
      }),
      "",
      "---",
      "",
      buildCodexLaunchCardMarkdownCopyPacket(preview, contextRelayRationale, {
        include_context_relay_rationale: false,
      }),
    ].join("\n"),
  );
}

export function buildHandoffCopyExportJsonPacket(
  preview: HandoffCapsulePreviewForWeb,
  contextRelayRationale?: HandoffContextRelayRationale | null,
): HandoffCopyExportJsonPacket {
  const capsule = preview.capsule;
  const launchCard = preview.launch_card;

  return {
    packet_kind: HANDOFF_COPY_EXPORT_PACKET_KIND,
    packet_version: HANDOFF_COPY_EXPORT_PACKET_VERSION,
    packet_fingerprint_algorithm: HANDOFF_COPY_EXPORT_FINGERPRINT_ALGORITHM,
    source: "Handoff Capsule / Codex Launch Card preview",
    scope: capsule.scope,
    capsule_id: capsule.capsule_id,
    launch_card_id: launchCard.launch_card_id,
    source_guide_brief_ref: capsule.source_guide_brief_ref,
    packet_input_summary: buildHandoffCopyExportInputSummary(
      preview,
      contextRelayRationale,
    ),
    source_status: preview.source_status,
    fallback_reasons: [...preview.fallback_reasons],
    warnings: [...preview.warnings],
    gaps: [...preview.gaps],
    public_safety: preview.public_safety,
    route_refs: [...preview.route_refs],
    docs_refs: [...preview.docs_refs],
    observed_context: capsule.observed_context,
    inferred_context: capsule.inferred_context,
    suggested_context: capsule.suggested_context,
    suggestions_for_codex: launchCard.suggestions_for_codex,
    needs_user_judgment: capsule.needs_user_judgment,
    unresolved_user_judgment: launchCard.unresolved_user_judgment,
    selected_delta_refs: capsule.selected_delta_refs,
    context_relay_rationale: contextRelayRationale ?? null,
    source_refs: capsule.source_refs,
    expected_files: [...launchCard.expected_files],
    forbidden_files: [...launchCard.forbidden_files],
    required_checks: [...launchCard.required_checks],
    optional_checks: [...launchCard.optional_checks],
    skipped_check_policy: [...launchCard.skipped_check_policy],
    pr_body_requirements: [...launchCard.pr_body_requirements],
    final_report_requirements: [...launchCard.final_report_requirements],
    proof_evidence_boundary: [...launchCard.proof_evidence_boundary],
    authority_boundary_summary: [
      ...formatAuthorityBoundaryForCopy(capsule.authority_boundary),
      ...formatAuthorityBoundaryForCopy(launchCard.authority_boundary),
    ],
    route_read_boundary_notes: [...preview.boundary_notes],
    copy_export_boundary_statement: [...COPY_EXPORT_BOUNDARY_STATEMENT],
    boundary_flags: buildHandoffCopyExportBoundaryFlags(),
  };
}

export function buildHandoffCopyExportPreview(
  preview: HandoffCapsulePreviewForWeb,
  contextRelayRationale?: HandoffContextRelayRationale | null,
): HandoffCopyExportPreview {
  const capsuleMarkdown = buildHandoffCapsuleMarkdownCopyPacket(
    preview,
    contextRelayRationale,
  );
  const launchCardMarkdown = buildCodexLaunchCardMarkdownCopyPacket(
    preview,
    contextRelayRationale,
  );
  const combinedMarkdown = buildCombinedHandoffLaunchMarkdownCopyPacket(
    preview,
    contextRelayRationale,
  );
  const jsonPreview = buildHandoffCopyExportJsonPacket(
    preview,
    contextRelayRationale,
  );
  const jsonText = canonicalJsonStringify(jsonPreview);
  const fingerprint = buildHandoffCopyExportFingerprint({
    packet_kind: HANDOFF_COPY_EXPORT_PACKET_KIND,
    packet_version: HANDOFF_COPY_EXPORT_PACKET_VERSION,
    packet_input_summary: jsonPreview.packet_input_summary,
    source_status: jsonPreview.source_status,
    fallback_reasons: jsonPreview.fallback_reasons,
    warnings: jsonPreview.warnings,
    gaps: jsonPreview.gaps,
    context_relay_rationale: jsonPreview.context_relay_rationale,
    boundary_flags: jsonPreview.boundary_flags,
  });

  return {
    packet_kind: HANDOFF_COPY_EXPORT_PACKET_KIND,
    packet_version: HANDOFF_COPY_EXPORT_PACKET_VERSION,
    packet_fingerprint_algorithm: HANDOFF_COPY_EXPORT_FINGERPRINT_ALGORITHM,
    packet_fingerprint: fingerprint,
    packet_input_summary: jsonPreview.packet_input_summary,
    boundary_flags: jsonPreview.boundary_flags,
    capsule_markdown: capsuleMarkdown,
    launch_card_markdown: launchCardMarkdown,
    combined_markdown: combinedMarkdown,
    json_preview: jsonPreview,
    json_text: jsonText,
    character_counts: {
      handoff_capsule_markdown: capsuleMarkdown.length,
      codex_launch_card_markdown: launchCardMarkdown.length,
      combined_review_packet_markdown: combinedMarkdown.length,
      json_preview: jsonText.length,
    },
  };
}

export function buildHandoffCopyExportInputSummary(
  preview: HandoffCapsulePreviewForWeb,
  contextRelayRationale?: HandoffContextRelayRationale | null,
): HandoffCopyExportInputSummary {
  return {
    scope: preview.capsule.scope,
    capsule_id: preview.capsule.capsule_id,
    launch_card_id: preview.launch_card.launch_card_id,
    source_guide_brief_ref: preview.capsule.source_guide_brief_ref,
    source_status: preview.source_status,
    fallback_reason_count: preview.fallback_reasons.length,
    warning_count: preview.warnings.length,
    gap_count: preview.gaps.length,
    observed_count: preview.capsule.observed_context.length,
    inferred_count: preview.capsule.inferred_context.length,
    suggested_count: preview.capsule.suggested_context.length,
    judgment_count: preview.capsule.needs_user_judgment.length,
    expected_file_count: preview.launch_card.expected_files.length,
    forbidden_file_count: preview.launch_card.forbidden_files.length,
    required_check_count: preview.launch_card.required_checks.length,
    optional_check_count: preview.launch_card.optional_checks.length,
    route_ref_count: preview.route_refs.length,
    docs_ref_count: preview.docs_refs.length,
    context_rationale_selected_ref_count:
      contextRelayRationale?.selected_refs.length ?? 0,
    context_rationale_warning_count:
      contextRelayRationale?.stale_or_gap_warnings.length ?? 0,
    context_rationale_stop_count:
      contextRelayRationale?.stop_if_missing.length ?? 0,
  };
}

export function buildHandoffCopyExportFingerprint(input: unknown): string {
  const text = canonicalJsonStringify(input);
  let hash = 0x811c9dc5;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function normalizeHandoffCopyText(input: string): string {
  return input.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function formatAuthorityBoundaryForCopy(
  boundary: object,
): string[] {
  return Object.entries(boundary)
    .filter(([key]) => key !== "notes")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}: ${String(value)}`);
}

export function formatSourceStatusForCopy(
  preview: HandoffCapsulePreviewForWeb,
): string[] {
  return [
    `source: ${preview.source_status.source}`,
    `capsule: ${preview.source_status.capsule}`,
    `launch_card: ${preview.source_status.launch_card}`,
    `source_disclosure: ${preview.source_status.source_disclosure}`,
    `synthetic_operator_supplied_fields: ${preview.source_status.synthetic_operator_supplied_fields.join(", ")}`,
    `fallback_reasons: ${preview.fallback_reasons.join(" | ") || "none"}`,
    `warnings: ${preview.warnings.join(" | ") || "none"}`,
    `gaps: ${preview.gaps.join(" | ") || "none"}`,
  ];
}

export function formatObservedInferredSuggestedJudgmentForCopy(
  preview: HandoffCapsulePreviewForWeb,
): string[] {
  const capsule = preview.capsule;
  const launchCard = preview.launch_card;

  return [
    "## Observed",
    ...formatList(
      capsule.observed_context.map((item) => `${item.context_id}: ${item.summary}`),
    ),
    "",
    "## Inferred",
    ...formatList(
      capsule.inferred_context.map(
        (item) =>
          `${item.context_id}: ${item.summary} (confidence: ${item.confidence}; caveats: ${item.caveats.join(" | ") || "none"})`,
      ),
    ),
    "",
    "## Suggested",
    ...formatList(
      capsule.suggested_context.map(
        (item) =>
          `${item.context_id}: ${item.title} - ${item.summary} Advisory only: ${item.advisory_only}.`,
      ),
    ),
    "",
    "## Suggestions For Codex",
    ...formatList(
      launchCard.suggestions_for_codex.map(
        (item) =>
          `${item.suggestion_id}: ${item.title} - ${item.summary} Advisory only: ${item.advisory_only}.`,
      ),
    ),
    "",
    "## Needs User Judgment",
    ...formatList(
      capsule.needs_user_judgment.map(
        (item) =>
          `${item.context_id}: ${item.question} Decided by packet: ${item.decided_by_packet}.`,
      ),
    ),
    "",
    "## Unresolved User Judgment",
    ...formatList(
      launchCard.unresolved_user_judgment.map(
        (item) =>
          `${item.context_id}: ${item.question} Unresolved user judgment remains unresolved.`,
      ),
    ),
  ];
}

export function formatCodexLaunchCardFieldsForCopy(
  preview: HandoffCapsulePreviewForWeb,
): string[] {
  const launchCard = preview.launch_card;

  return [
    `repo: ${launchCard.repo}`,
    `base_branch: ${launchCard.base_branch}`,
    `branch_suggestion: ${launchCard.branch_suggestion}`,
    `expected_pr_title: ${launchCard.expected_pr_title}`,
    `task_goal: ${launchCard.task_goal}`,
    `task_summary: ${launchCard.task_summary}`,
    `status: ${launchCard.status}`,
    "No status may mean executed.",
    "Suggestions are advisory only.",
    "Unresolved user judgment remains unresolved.",
  ];
}

export function formatContextRelayRationaleForCopy(
  contextRelayRationale?: HandoffContextRelayRationale | null,
): string[] {
  if (!contextRelayRationale) {
    return [
      "## Context Relay Rationale",
      "- none supplied",
      "- Re-copy from /workbench after the Continuity Relay and handoff preview are available.",
    ];
  }

  return [
    "## Context Relay Rationale",
    `- rationale_version: ${contextRelayRationale.rationale_version}`,
    `- selected_ref_count: ${contextRelayRationale.selected_refs.length}`,
    `- why_included_count: ${contextRelayRationale.why_included.length}`,
    `- stale_or_gap_warning_count: ${contextRelayRationale.stale_or_gap_warnings.length}`,
    `- stop_if_missing_count: ${contextRelayRationale.stop_if_missing.length}`,
    "",
    "### Selected Refs",
    ...formatList(
      contextRelayRationale.selected_refs.map(
        (item) =>
          `${item.ref_id}: ${item.reason_category} - ${item.summary}`,
      ),
    ),
    "",
    "### Why Included",
    ...formatList(
      contextRelayRationale.why_included.map(
        (item) =>
          `${item.ref_id}: ${item.reason_category} - ${item.rationale}`,
      ),
    ),
    "",
    "### Stale Or Gap Warnings",
    ...formatList(
      contextRelayRationale.stale_or_gap_warnings.map(
        (item) => `${item.warning_id}: ${item.summary}`,
      ),
    ),
    "",
    "### Stop If Missing",
    ...formatList(
      contextRelayRationale.stop_if_missing.map(
        (item) => `${item.stop_id}: ${item.summary}`,
      ),
    ),
    "",
    "### Expected Return Signal",
    ...formatList([
      ...contextRelayRationale.expected_return_signal.required_fields,
      ...contextRelayRationale.expected_return_signal.context_feedback_fields,
    ]),
    "",
    "### Context Rationale Boundary",
    ...formatAuthorityBoundaryForCopy(contextRelayRationale.authority_boundary),
  ];
}

function buildHandoffCopyExportBoundaryFlags(): HandoffCopyExportBoundaryFlags {
  return {
    local_clipboard_only: true,
    external_handoff_sent: false,
    codex_executed: false,
    github_called: false,
    provider_called: false,
    proof_evidence_written: false,
    db_written: false,
    state_mutated: false,
    copy_persisted: false,
  };
}

function formatPacketHeader(preview: HandoffCapsulePreviewForWeb): string[] {
  return [
    `- packet_kind: ${HANDOFF_COPY_EXPORT_PACKET_KIND}`,
    `- packet_version: ${HANDOFF_COPY_EXPORT_PACKET_VERSION}`,
    `- packet_fingerprint_algorithm: ${HANDOFF_COPY_EXPORT_FINGERPRINT_ALGORITHM}`,
    `- source: Handoff Capsule / Codex Launch Card preview`,
    `- scope: ${preview.capsule.scope}`,
    `- capsule_id: ${preview.capsule.capsule_id}`,
    `- launch_card_id: ${preview.launch_card.launch_card_id}`,
    `- source_guide_brief_ref: ${preview.capsule.source_guide_brief_ref}`,
    "",
    "## Source / Fallback Status",
    ...formatSourceStatusForCopy(preview).map((line) => `- ${line}`),
    "",
    "## Public Safety",
    `- public_safety: ${preview.public_safety}`,
    ...formatNamedList("route_ref", preview.route_refs),
    ...formatNamedList("docs_ref", preview.docs_refs),
    "",
    "## Copy Boundary Flags",
    ...Object.entries(buildHandoffCopyExportBoundaryFlags()).map(
      ([key, value]) => `- ${key}: ${String(value)}`,
    ),
  ];
}

function formatCopyExportBoundaryForCopy(): string[] {
  return formatList([...COPY_EXPORT_BOUNDARY_STATEMENT]);
}

function formatSourceRefsForCopy(sourceRefs: object): string[] {
  return Object.entries(sourceRefs)
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.length > 0
          ? value.map((item) => `- ${key}: ${String(item)}`)
          : [`- ${key}: none`];
      }

      return [`- ${key}: ${String(value)}`];
    });
}

function formatNamedList(label: string, values: readonly string[]): string[] {
  return values.length > 0
    ? values.map((value) => `- ${label}: ${value}`)
    : [`- ${label}: none`];
}

function formatList(values: readonly string[]): string[] {
  return values.length > 0
    ? values.map((value) => `- ${value}`)
    : ["- none"];
}

function canonicalJsonStringify(value: unknown): string {
  return JSON.stringify(sortForCanonicalJson(value), null, 2);
}

function sortForCanonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortForCanonicalJson);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, sortForCanonicalJson(nestedValue)]),
    );
  }

  return value;
}
