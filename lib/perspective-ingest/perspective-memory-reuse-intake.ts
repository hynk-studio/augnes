import { createHash } from "node:crypto";
import {
  PERSPECTIVE_MEMORY_ITEM_MAX_ITEMS,
  type PerspectiveMemoryItemStatus,
  type PerspectiveMemoryItemV0,
} from "@/lib/perspective-ingest/perspective-memory-item";
import { listPerspectiveMemoryItems } from "@/lib/perspective-ingest/perspective-memory-item-store";
import {
  buildPerspectiveMemoryReusePacket,
  type PerspectiveMemoryReuseBriefMetadataV01,
  type PerspectiveMemoryReusePacketV01,
} from "@/lib/perspective-ingest/perspective-memory-item-reuse-packet";
import {
  buildPerspectiveMemoryReuseQualityReview,
  type PerspectiveMemoryReuseQualityReviewV01,
} from "@/lib/perspective-ingest/perspective-memory-reuse-quality-review";

export const PERSPECTIVE_MEMORY_REUSE_INTAKE_VERSION =
  "perspective_memory_reuse_intake.v0.1";
export const PERSPECTIVE_MEMORY_REUSE_INTAKE_SUMMARY_VERSION =
  "perspective_memory_reuse_intake_summary.v0.1";
export const PERSPECTIVE_MEMORY_REUSE_INTAKE_DETERMINISTIC_NOW_ISO =
  "2026-06-14T00:00:00.000Z";
export const PERSPECTIVE_MEMORY_REUSE_INTAKE_DEFAULT_LIMIT = 5;

const INTAKE_TEXT_LIMIT = 900;
const INTAKE_TITLE_LIMIT = 180;
const INTAKE_ARRAY_LIMIT = 40;
const INTAKE_SNIPPET_LIMIT = 180;
const INTAKE_BOUNDARY_LIMIT = 700;
const INTAKE_HASH_PREFIX_LENGTH = 16;

const ACTIVE_STATUSES = ["accepted", "reviewing"] as const;
const INACTIVE_STATUSES = ["deprecated", "retracted", "superseded"] as const;

const STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "but",
  "can",
  "for",
  "facing",
  "from",
  "have",
  "into",
  "local",
  "must",
  "not",
  "now",
  "only",
  "our",
  "should",
  "that",
  "the",
  "this",
  "through",
  "use",
  "uses",
  "using",
  "with",
  "work",
]);

export type PerspectiveMemoryReuseIntakeMatchField =
  | "content.title"
  | "content.summary"
  | "content.source_refs"
  | "content.evidence_refs"
  | "content.risk_notes"
  | "content.carry_forward_questions"
  | "content.suggested_next_review_action";

export type PerspectiveMemoryReuseIntakeInput = {
  task?: string | null;
  taskTitle?: string | null;
  taskDescription?: string | null;
  limit?: number | null;
  items?: PerspectiveMemoryItemV0[] | null;
  nowIso?: string | null;
  extraWarnings?: string[] | null;
  readVia?: "listPerspectiveMemoryItems" | "provided_items";
};

export type PerspectiveMemoryReuseIntakeSuggestedItemV01 = {
  rank: number;
  memory_item_id: string;
  title: string;
  item_status: PerspectiveMemoryItemStatus;
  source_validation_result_state: PerspectiveMemoryItemV0["source_validation_result_state"];
  score: number;
  matched_terms: string[];
  matched_fields: PerspectiveMemoryReuseIntakeMatchField[];
  match_snippets: Array<{
    field: PerspectiveMemoryReuseIntakeMatchField;
    matched_terms: string[];
    snippet: string;
  }>;
  why_selected: string;
  reuse_boundary: string;
};

export type PerspectiveMemoryReuseIntakeExcludedCandidateV01 = {
  memory_item_id: string;
  title: string;
  item_status: PerspectiveMemoryItemStatus;
  score: number;
  matched_terms: string[];
  matched_fields: PerspectiveMemoryReuseIntakeMatchField[];
  exclusion_reason: string;
};

export type PerspectiveMemoryReuseIntakeQualityReviewPreviewSummaryV01 = {
  preview_state: "reviewable" | "needs_operator_review";
  reviewable_item_count: number;
  needs_operator_review_count: number;
  missing_why_selected_count: number;
  missing_reuse_boundary_count: number;
  compact_brief_recommended: boolean;
  large_selection_warning: boolean;
  suggested_next_action: string;
  warnings: string[];
};

export type PerspectiveMemoryReuseIntakeAuthorityBoundaryV01 = {
  deterministic_local_intake: true;
  mechanical_keyword_matching_only: true;
  memory_items_read: true;
  reuse_packet_created: true;
  codex_memory_brief_created: true;
  quality_review_preview_created: true;
  provider_model_call_created: false;
  openai_api_call_created: false;
  codex_sdk_execution_created: false;
  mcp_tool_call_created: false;
  github_mutation_created: false;
  persistence_write_created: false;
  perspective_memory_persistence_write_created: false;
  reuse_packet_persisted: false;
  quality_review_persisted: false;
  memory_item_created: false;
  memory_item_mutated: false;
  db_schema_changed: false;
  runtime_started: false;
  mcp_bridge_started: false;
  hidden_background_daemon_created: false;
  augnes_state_commit_reject_created: false;
};

export type PerspectiveMemoryReuseIntakeResultV01 = {
  intake_version: typeof PERSPECTIVE_MEMORY_REUSE_INTAKE_VERSION;
  summary_version: typeof PERSPECTIVE_MEMORY_REUSE_INTAKE_SUMMARY_VERSION;
  generated_at: string;
  deterministic_output: true;
  task: {
    title: string;
    description: string;
    normalized_keywords: string[];
  };
  candidate_source: {
    read_via: "listPerspectiveMemoryItems" | "provided_items";
    total_items_read: number;
    total_matched_candidates: number;
    active_candidate_count: number;
    excluded_candidate_count: number;
    limit: number;
  };
  suggested_memory_items: PerspectiveMemoryReuseIntakeSuggestedItemV01[];
  excluded_candidates: PerspectiveMemoryReuseIntakeExcludedCandidateV01[];
  warnings: string[];
  reuse_packet: PerspectiveMemoryReusePacketV01;
  codex_memory_brief: string;
  codex_memory_brief_metadata: PerspectiveMemoryReuseBriefMetadataV01;
  quality_review: PerspectiveMemoryReuseQualityReviewV01;
  quality_review_summary: string;
  quality_review_preview_summary: PerspectiveMemoryReuseIntakeQualityReviewPreviewSummaryV01;
  authority_boundary: PerspectiveMemoryReuseIntakeAuthorityBoundaryV01;
};

type IntakeMatchFieldDefinition = {
  field: PerspectiveMemoryReuseIntakeMatchField;
  weight: number;
  values: (item: PerspectiveMemoryItemV0) => string[];
};

type FieldMatch = {
  field: PerspectiveMemoryReuseIntakeMatchField;
  weight: number;
  matched_terms: string[];
  snippet: string;
  phrase_match: boolean;
};

type ScoredCandidate = {
  item: PerspectiveMemoryItemV0;
  score: number;
  matched_terms: string[];
  matched_fields: PerspectiveMemoryReuseIntakeMatchField[];
  match_snippets: PerspectiveMemoryReuseIntakeSuggestedItemV01["match_snippets"];
  why_selected: string;
  reuse_boundary: string;
};

const MATCH_FIELD_DEFINITIONS: IntakeMatchFieldDefinition[] = [
  {
    field: "content.title",
    weight: 120,
    values: (item) => [item.content.title],
  },
  {
    field: "content.summary",
    weight: 85,
    values: (item) => [item.content.summary],
  },
  {
    field: "content.source_refs",
    weight: 65,
    values: (item) => item.content.source_refs,
  },
  {
    field: "content.evidence_refs",
    weight: 55,
    values: (item) => item.content.evidence_refs,
  },
  {
    field: "content.risk_notes",
    weight: 45,
    values: (item) => item.content.risk_notes,
  },
  {
    field: "content.carry_forward_questions",
    weight: 45,
    values: (item) => item.content.carry_forward_questions,
  },
  {
    field: "content.suggested_next_review_action",
    weight: 45,
    values: (item) => [item.content.suggested_next_review_action],
  },
];

export function buildPerspectiveMemoryReuseIntakeFromStore(
  input: Omit<PerspectiveMemoryReuseIntakeInput, "items"> = {},
): PerspectiveMemoryReuseIntakeResultV01 {
  const list = listPerspectiveMemoryItems({
    limit: PERSPECTIVE_MEMORY_ITEM_MAX_ITEMS,
  });
  return buildPerspectiveMemoryReuseIntake({
    ...input,
    items: list.items,
    readVia: "listPerspectiveMemoryItems",
  });
}

export function buildPerspectiveMemoryReuseIntake(
  input: PerspectiveMemoryReuseIntakeInput = {},
): PerspectiveMemoryReuseIntakeResultV01 {
  const nowIso =
    boundText(input.nowIso ?? "", INTAKE_TITLE_LIMIT) ||
    PERSPECTIVE_MEMORY_REUSE_INTAKE_DETERMINISTIC_NOW_ISO;
  const limit = normalizeLimit(input.limit);
  const task = normalizeTask(input);
  const taskKeywords = tokenizeTask(`${task.title} ${task.description}`);
  const normalizedTaskPhrase = normalizeText(`${task.title} ${task.description}`);
  const items = (input.items ?? []).slice(0, PERSPECTIVE_MEMORY_ITEM_MAX_ITEMS);
  const readVia =
    input.readVia ?? (input.items ? "provided_items" : "listPerspectiveMemoryItems");
  const scoredCandidates = items
    .map((item) =>
      scoreCandidate({
        item,
        taskKeywords,
        normalizedTaskPhrase,
      }),
    )
    .filter((candidate): candidate is ScoredCandidate => candidate != null)
    .sort(compareCandidates);
  const activeCandidates = scoredCandidates.filter((candidate) =>
    isActiveStatus(candidate.item.item_status),
  );
  const inactiveCandidates = scoredCandidates.filter((candidate) =>
    isInactiveStatus(candidate.item.item_status),
  );
  const selectedCandidates = activeCandidates.slice(0, limit);
  const selectedItems = selectedCandidates.map((candidate) => candidate.item);
  const deterministicIdHash = buildDeterministicIdHash({
    taskTitle: task.title,
    taskDescription: task.description,
    selectedItemIds: selectedItems.map((item) => item.item_id),
    limit,
  });
  const packetResult = buildPerspectiveMemoryReusePacket({
    items,
    selected_memory_items: selectedCandidates.map((candidate) => ({
      memory_item_id: candidate.item.item_id,
      why_selected: candidate.why_selected,
      reuse_boundary: candidate.reuse_boundary,
    })),
    task_title: task.title,
    task_description: task.description,
    nowIso,
    packetId: `perspective-memory-reuse-intake:packet:${deterministicIdHash}`,
  });
  const itemsById = new Map(items.map((item) => [item.item_id, item]));
  const qualityReviewResult = buildPerspectiveMemoryReuseQualityReview({
    reuse_packet_id: packetResult.packet.packet_id,
    task_title: task.title,
    task_description: task.description,
    selected_item_count: packetResult.packet.selected_memory_items.length,
    codex_memory_brief_metadata: packetResult.codex_memory_brief_metadata,
    selected_memory_items: packetResult.packet.selected_memory_items.map(
      (item) => {
        const sourceItem = itemsById.get(item.memory_item_id);
        return {
          memory_item_id: item.memory_item_id,
          title: item.title,
          why_selected: item.why_selected,
          reuse_boundary: item.reuse_boundary,
          source_ref: item.source_ref,
          validation_state: sourceItem?.source_validation_result_state ?? "",
          item_status: sourceItem?.item_status ?? "",
        };
      },
    ),
    operator_notes: [
      "Codex-facing reuse intake preview; deterministic mechanical keyword matching only.",
    ],
    nowIso,
    reviewId: `perspective-memory-reuse-intake:quality-review:${deterministicIdHash}`,
  });
  const warnings = buildWarnings({
    inputWarnings: input.extraWarnings ?? [],
    taskKeywords,
    items,
    selectedCandidates,
    inactiveCandidates,
  });
  const qualityReviewPreviewSummary = buildQualityReviewPreviewSummary({
    review: qualityReviewResult.review,
    warnings,
  });

  return {
    intake_version: PERSPECTIVE_MEMORY_REUSE_INTAKE_VERSION,
    summary_version: PERSPECTIVE_MEMORY_REUSE_INTAKE_SUMMARY_VERSION,
    generated_at: nowIso,
    deterministic_output: true,
    task: {
      title: task.title,
      description: task.description,
      normalized_keywords: taskKeywords,
    },
    candidate_source: {
      read_via: readVia,
      total_items_read: items.length,
      total_matched_candidates: scoredCandidates.length,
      active_candidate_count: activeCandidates.length,
      excluded_candidate_count: inactiveCandidates.length,
      limit,
    },
    suggested_memory_items: selectedCandidates.map((candidate, index) =>
      toSuggestedItem(candidate, index + 1),
    ),
    excluded_candidates: inactiveCandidates.map(toExcludedCandidate),
    warnings,
    reuse_packet: packetResult.packet,
    codex_memory_brief: packetResult.codex_memory_brief,
    codex_memory_brief_metadata: packetResult.codex_memory_brief_metadata,
    quality_review: qualityReviewResult.review,
    quality_review_summary: qualityReviewResult.quality_review_summary,
    quality_review_preview_summary: qualityReviewPreviewSummary,
    authority_boundary: buildAuthorityBoundary(),
  };
}

export function formatPerspectiveMemoryReuseIntakeHuman(
  result: PerspectiveMemoryReuseIntakeResultV01,
) {
  const lines = [
    "# Perspective Memory Reuse Intake v0.1",
    "",
    `intake_version: ${result.intake_version}`,
    `generated_at: ${result.generated_at}`,
    `deterministic_output: ${result.deterministic_output}`,
    `task_title: ${result.task.title}`,
    `selected_item_count: ${result.suggested_memory_items.length}`,
    `quality_review_preview_state: ${result.quality_review_preview_summary.preview_state}`,
    "",
    "## Suggested Persisted Perspective-Memory Items",
  ];

  if (result.suggested_memory_items.length === 0) {
    lines.push("- No persisted perspective-memory items selected.");
  } else {
    for (const item of result.suggested_memory_items) {
      lines.push(
        `${item.rank}. ${item.title}`,
        `   - memory_item_id: ${item.memory_item_id}`,
        `   - item_status: ${item.item_status}`,
        `   - source_validation_result_state: ${item.source_validation_result_state}`,
        `   - score: ${item.score}`,
        `   - matched_fields: ${item.matched_fields.join(", ") || "none"}`,
        `   - matched_terms: ${item.matched_terms.join(", ") || "none"}`,
        `   - why_selected: ${item.why_selected}`,
        `   - reuse_boundary: ${item.reuse_boundary}`,
      );
    }
  }

  lines.push("", "## Excluded Or Warning Candidates");
  if (result.excluded_candidates.length === 0) {
    lines.push("- No deprecated, retracted, or superseded matches.");
  } else {
    for (const item of result.excluded_candidates) {
      lines.push(
        `- ${item.memory_item_id}`,
        `  status: ${item.item_status}`,
        `  reason: ${item.exclusion_reason}`,
      );
    }
  }

  lines.push("", "## Warnings");
  if (result.warnings.length === 0) {
    lines.push("- none");
  } else {
    for (const warning of result.warnings) lines.push(`- ${warning}`);
  }

  lines.push(
    "",
    "## Codex Memory Brief",
    result.codex_memory_brief,
    "",
    "## Quality Review Warning Summary",
    formatQualityReviewWarningSummary(result),
    "",
    "## Structured Reuse Packet JSON",
    JSON.stringify(result.reuse_packet, null, 2),
  );

  return lines.join("\n");
}

export function formatPerspectiveMemoryReuseIntakeBrief(
  result: PerspectiveMemoryReuseIntakeResultV01,
) {
  return [
    result.codex_memory_brief,
    "",
    "## Quality Review Warning Summary",
    formatQualityReviewWarningSummary(result),
  ].join("\n");
}

export function formatQualityReviewWarningSummary(
  result: PerspectiveMemoryReuseIntakeResultV01,
) {
  const summary = result.quality_review_preview_summary;
  const lines = [
    `preview_state: ${summary.preview_state}`,
    `reviewable_item_count: ${summary.reviewable_item_count}`,
    `needs_operator_review_count: ${summary.needs_operator_review_count}`,
    `missing_why_selected_count: ${summary.missing_why_selected_count}`,
    `missing_reuse_boundary_count: ${summary.missing_reuse_boundary_count}`,
    `compact_brief_recommended: ${summary.compact_brief_recommended}`,
    `large_selection_warning: ${summary.large_selection_warning}`,
    `suggested_next_action: ${summary.suggested_next_action}`,
    "warnings:",
  ];
  if (summary.warnings.length === 0) {
    lines.push("- none");
  } else {
    for (const warning of summary.warnings) lines.push(`- ${warning}`);
  }
  return lines.join("\n");
}

function normalizeTask(input: PerspectiveMemoryReuseIntakeInput) {
  const taskText = boundText(input.task ?? "", INTAKE_TEXT_LIMIT);
  const taskTitleInput = boundText(input.taskTitle ?? "", INTAKE_TITLE_LIMIT);
  const taskDescriptionInput = boundText(
    input.taskDescription ?? "",
    INTAKE_TEXT_LIMIT,
  );
  const title =
    taskTitleInput ||
    deriveTaskTitle(taskText || taskDescriptionInput) ||
    "Untitled Perspective memory reuse task";
  const description = taskDescriptionInput || taskText || title;
  return {
    title,
    description,
  };
}

function deriveTaskTitle(value: string) {
  const normalized = boundText(value, INTAKE_TITLE_LIMIT);
  if (!normalized) return "";
  const firstLine = normalized.split(/\n/)[0]?.trim() ?? "";
  if (firstLine.length <= INTAKE_TITLE_LIMIT) return firstLine;
  return firstLine.slice(0, INTAKE_TITLE_LIMIT).trim();
}

function tokenizeTask(value: string) {
  const tokens = normalizeText(value)
    .split(/[^a-z0-9]+/g)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));
  return uniqueBoundedStrings(tokens, INTAKE_ARRAY_LIMIT, 80);
}

function scoreCandidate({
  item,
  taskKeywords,
  normalizedTaskPhrase,
}: {
  item: PerspectiveMemoryItemV0;
  taskKeywords: string[];
  normalizedTaskPhrase: string;
}): ScoredCandidate | null {
  if (taskKeywords.length === 0) return null;
  const fieldMatches = MATCH_FIELD_DEFINITIONS.map((definition) =>
    matchField({
      definition,
      item,
      taskKeywords,
      normalizedTaskPhrase,
    }),
  ).filter((match): match is FieldMatch => match != null);
  if (fieldMatches.length === 0) return null;
  const matchedTerms = uniqueBoundedStrings(
    fieldMatches.flatMap((match) => match.matched_terms),
    INTAKE_ARRAY_LIMIT,
    80,
  );
  if (!hasEnoughMechanicalEvidence(fieldMatches, matchedTerms)) return null;
  const matchedFields = fieldMatches.map((match) => match.field);
  const score =
    fieldMatches.reduce((total, match) => {
      const phraseBonus = match.phrase_match ? 90 : 0;
      return total + match.weight * match.matched_terms.length + phraseBonus;
    }, 0) + statusScore(item.item_status) + validationScore(item);
  const matchSnippets = fieldMatches.map((match) => ({
    field: match.field,
    matched_terms: match.matched_terms,
    snippet: match.snippet,
  }));
  const whySelected = buildWhySelected({
    item,
    matchedTerms,
    fieldMatches,
  });
  const reuseBoundary = buildReuseBoundary({
    item,
    matchedFields,
  });
  return {
    item,
    score,
    matched_terms: matchedTerms,
    matched_fields: matchedFields,
    match_snippets: matchSnippets,
    why_selected: whySelected,
    reuse_boundary: reuseBoundary,
  };
}

function hasEnoughMechanicalEvidence(
  fieldMatches: FieldMatch[],
  matchedTerms: string[],
) {
  if (matchedTerms.length >= 2) return true;
  return fieldMatches.some(
    (match) => match.field === "content.title" || match.field === "content.summary",
  );
}

function matchField({
  definition,
  item,
  taskKeywords,
  normalizedTaskPhrase,
}: {
  definition: IntakeMatchFieldDefinition;
  item: PerspectiveMemoryItemV0;
  taskKeywords: string[];
  normalizedTaskPhrase: string;
}): FieldMatch | null {
  const value = definition.values(item).filter(Boolean).join(" ");
  const normalizedValue = normalizeText(value);
  if (!normalizedValue) return null;
  const matchedTerms = taskKeywords.filter((keyword) =>
    normalizedValue.includes(keyword),
  );
  if (matchedTerms.length === 0) return null;
  return {
    field: definition.field,
    weight: definition.weight,
    matched_terms: matchedTerms,
    snippet: buildSnippet(value, matchedTerms[0] ?? ""),
    phrase_match:
      normalizedTaskPhrase.length > 0 &&
      normalizedValue.includes(normalizedTaskPhrase),
  };
}

function buildWhySelected({
  item,
  matchedTerms,
  fieldMatches,
}: {
  item: PerspectiveMemoryItemV0;
  matchedTerms: string[];
  fieldMatches: FieldMatch[];
}) {
  const fieldSummary = fieldMatches
    .slice(0, 3)
    .map(
      (match) =>
        `${match.field} (${match.matched_terms.slice(0, 5).join(", ")})`,
    )
    .join("; ");
  const validationNote =
    item.source_validation_result_state === "PASS with follow-up"
      ? " Validation is PASS with follow-up, so keep operator review visible."
      : "";
  return boundText(
    `Matched task keyword${matchedTerms.length === 1 ? "" : "s"} ${matchedTerms
      .slice(0, 8)
      .join(", ")} in ${fieldSummary}; item status is ${item.item_status}.${validationNote}`,
    INTAKE_BOUNDARY_LIMIT,
  );
}

function buildReuseBoundary({
  item,
  matchedFields,
}: {
  item: PerspectiveMemoryItemV0;
  matchedFields: PerspectiveMemoryReuseIntakeMatchField[];
}) {
  const statusNote =
    item.item_status === "reviewing"
      ? " Treat reviewing status as a freshness prompt."
      : item.source_validation_result_state === "PASS with follow-up"
        ? " Treat follow-up validation as a freshness prompt."
        : "";
  return boundText(
    `Reuse only as bounded Augnes prior context for matched fields ${matchedFields
      .slice(0, 5)
      .join(", ")}. Do not treat it as runtime authority, current truth, or permission to create memory, mutate state, persist packets, start providers/models, call OpenAI API, use Codex SDK, call MCP tools, mutate GitHub, or commit/reject Augnes state.${statusNote}`,
    INTAKE_BOUNDARY_LIMIT,
  );
}

function toSuggestedItem(
  candidate: ScoredCandidate,
  rank: number,
): PerspectiveMemoryReuseIntakeSuggestedItemV01 {
  return {
    rank,
    memory_item_id: candidate.item.item_id,
    title: candidate.item.content.title,
    item_status: candidate.item.item_status,
    source_validation_result_state:
      candidate.item.source_validation_result_state,
    score: candidate.score,
    matched_terms: candidate.matched_terms,
    matched_fields: candidate.matched_fields,
    match_snippets: candidate.match_snippets,
    why_selected: candidate.why_selected,
    reuse_boundary: candidate.reuse_boundary,
  };
}

function toExcludedCandidate(
  candidate: ScoredCandidate,
): PerspectiveMemoryReuseIntakeExcludedCandidateV01 {
  return {
    memory_item_id: candidate.item.item_id,
    title: candidate.item.content.title,
    item_status: candidate.item.item_status,
    score: candidate.score,
    matched_terms: candidate.matched_terms,
    matched_fields: candidate.matched_fields,
    exclusion_reason: `Matched task keywords but item status is ${candidate.item.item_status}; exclude from automatic selection and let an operator review freshness first.`,
  };
}

function buildWarnings({
  inputWarnings,
  taskKeywords,
  items,
  selectedCandidates,
  inactiveCandidates,
}: {
  inputWarnings: string[];
  taskKeywords: string[];
  items: PerspectiveMemoryItemV0[];
  selectedCandidates: ScoredCandidate[];
  inactiveCandidates: ScoredCandidate[];
}) {
  const warnings = [...inputWarnings];
  if (taskKeywords.length === 0) {
    warnings.push("No usable task keywords found; no candidate matching performed.");
  }
  if (items.length === 0) {
    warnings.push("No persisted perspective-memory items were available to read.");
  }
  if (selectedCandidates.length === 0) {
    warnings.push("No accepted/reviewing perspective-memory items matched the task.");
  }
  for (const candidate of inactiveCandidates) {
    warnings.push(
      `Excluded ${candidate.item.item_status} perspective-memory item ${candidate.item.item_id}; operator review required before reuse.`,
    );
  }
  return uniqueBoundedStrings(warnings, INTAKE_ARRAY_LIMIT, INTAKE_TEXT_LIMIT);
}

function buildQualityReviewPreviewSummary({
  review,
  warnings,
}: {
  review: PerspectiveMemoryReuseQualityReviewV01;
  warnings: string[];
}): PerspectiveMemoryReuseIntakeQualityReviewPreviewSummaryV01 {
  const aggregate = review.aggregate_summary;
  const previewWarnings = [...warnings];
  if (aggregate.needs_operator_review_count > 0) {
    previewWarnings.push(
      "Quality review preview has items needing operator review.",
    );
  }
  if (aggregate.compact_brief_recommended) {
    previewWarnings.push("Quality review preview recommends compact brief review.");
  }
  return {
    preview_state:
      aggregate.needs_operator_review_count > 0 || warnings.length > 0
        ? "needs_operator_review"
        : "reviewable",
    reviewable_item_count: aggregate.reviewable_item_count,
    needs_operator_review_count: aggregate.needs_operator_review_count,
    missing_why_selected_count: aggregate.missing_why_selected_count,
    missing_reuse_boundary_count: aggregate.missing_reuse_boundary_count,
    compact_brief_recommended: aggregate.compact_brief_recommended,
    large_selection_warning: aggregate.large_selection_warning,
    suggested_next_action: aggregate.suggested_next_action,
    warnings: uniqueBoundedStrings(
      previewWarnings,
      INTAKE_ARRAY_LIMIT,
      INTAKE_TEXT_LIMIT,
    ),
  };
}

function buildSnippet(value: string, firstTerm: string) {
  const compactValue = value.replace(/\s+/g, " ").trim();
  if (compactValue.length <= INTAKE_SNIPPET_LIMIT) return compactValue;
  const normalizedValue = normalizeText(compactValue);
  const index = firstTerm ? normalizedValue.indexOf(firstTerm) : 0;
  const matchIndex = index >= 0 ? index : 0;
  const halfWidth = Math.floor(INTAKE_SNIPPET_LIMIT / 2);
  const start = Math.max(0, matchIndex - halfWidth);
  const end = Math.min(compactValue.length, start + INTAKE_SNIPPET_LIMIT);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < compactValue.length ? "..." : "";
  return `${prefix}${compactValue.slice(start, end)}${suffix}`.slice(
    0,
    INTAKE_SNIPPET_LIMIT,
  );
}

function compareCandidates(left: ScoredCandidate, right: ScoredCandidate) {
  if (left.score !== right.score) return right.score - left.score;
  const statusCompare =
    statusRank(left.item.item_status) - statusRank(right.item.item_status);
  if (statusCompare !== 0) return statusCompare;
  const updatedCompare = right.item.updated_at.localeCompare(left.item.updated_at);
  if (updatedCompare !== 0) return updatedCompare;
  return left.item.item_id.localeCompare(right.item.item_id);
}

function statusScore(status: PerspectiveMemoryItemStatus) {
  if (status === "accepted") return 60;
  if (status === "reviewing") return 45;
  return 0;
}

function validationScore(item: PerspectiveMemoryItemV0) {
  return item.source_validation_result_state === "PASS" ? 10 : 0;
}

function statusRank(status: PerspectiveMemoryItemStatus) {
  if (status === "accepted") return 0;
  if (status === "reviewing") return 1;
  if (status === "superseded") return 2;
  if (status === "deprecated") return 3;
  return 4;
}

function isActiveStatus(status: PerspectiveMemoryItemStatus) {
  return ACTIVE_STATUSES.some((activeStatus) => activeStatus === status);
}

function isInactiveStatus(status: PerspectiveMemoryItemStatus) {
  return INACTIVE_STATUSES.some((inactiveStatus) => inactiveStatus === status);
}

function normalizeLimit(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return PERSPECTIVE_MEMORY_REUSE_INTAKE_DEFAULT_LIMIT;
  }
  return Math.max(
    1,
    Math.min(Math.trunc(value), PERSPECTIVE_MEMORY_ITEM_MAX_ITEMS),
  );
}

function buildDeterministicIdHash({
  taskTitle,
  taskDescription,
  selectedItemIds,
  limit,
}: {
  taskTitle: string;
  taskDescription: string;
  selectedItemIds: string[];
  limit: number;
}) {
  return createHash("sha256")
    .update(PERSPECTIVE_MEMORY_REUSE_INTAKE_VERSION)
    .update("\n")
    .update(taskTitle)
    .update("\n")
    .update(taskDescription)
    .update("\n")
    .update(String(limit))
    .update("\n")
    .update(selectedItemIds.join("\n"))
    .digest("hex")
    .slice(0, INTAKE_HASH_PREFIX_LENGTH);
}

function buildAuthorityBoundary(): PerspectiveMemoryReuseIntakeAuthorityBoundaryV01 {
  return {
    deterministic_local_intake: true,
    mechanical_keyword_matching_only: true,
    memory_items_read: true,
    reuse_packet_created: true,
    codex_memory_brief_created: true,
    quality_review_preview_created: true,
    provider_model_call_created: false,
    openai_api_call_created: false,
    codex_sdk_execution_created: false,
    mcp_tool_call_created: false,
    github_mutation_created: false,
    persistence_write_created: false,
    perspective_memory_persistence_write_created: false,
    reuse_packet_persisted: false,
    quality_review_persisted: false,
    memory_item_created: false,
    memory_item_mutated: false,
    db_schema_changed: false,
    runtime_started: false,
    mcp_bridge_started: false,
    hidden_background_daemon_created: false,
    augnes_state_commit_reject_created: false,
  };
}

function uniqueBoundedStrings(
  values: string[],
  limit: number,
  maxLength: number,
) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const bounded = boundText(value, maxLength);
    const normalized = normalizeText(bounded);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(bounded);
    if (result.length >= limit) break;
  }
  return result;
}

function boundText(value: string, maxLength: number) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength);
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
