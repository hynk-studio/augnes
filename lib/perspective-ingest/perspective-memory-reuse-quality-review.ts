import type { PerspectiveMemoryReuseBriefMetadataV01 } from "@/lib/perspective-ingest/perspective-memory-item-reuse-packet";

export const PERSPECTIVE_MEMORY_REUSE_QUALITY_REVIEW_VERSION =
  "perspective_memory_reuse_quality_review.v0.1";
export const PERSPECTIVE_MEMORY_REUSE_QUALITY_REVIEW_SUMMARY_VERSION =
  "perspective_memory_reuse_quality_review_summary.v0.1";

const QUALITY_REVIEW_TEXT_LIMIT = 900;
const QUALITY_REVIEW_TITLE_LIMIT = 180;
const QUALITY_REVIEW_ID_LIMIT = 220;
const QUALITY_REVIEW_ARRAY_LIMIT = 40;

export type PerspectiveMemoryReuseQualityReviewState =
  | "reviewable"
  | "needs_operator_review";

export type PerspectiveMemoryReuseBoundaryReviewState =
  | "bounded"
  | "needs_operator_review";

export type PerspectiveMemoryReuseStaleOrMisleadingRiskState =
  | "none_detected"
  | "needs_operator_review";

export type PerspectiveMemoryReuseQualityReviewSelectedItemInput = {
  memory_item_id: string;
  title: string;
  why_selected?: string | null;
  reuse_boundary?: string | null;
  source_ref?: string | null;
  validation_state?: string | null;
  item_status?: string | null;
};

export type PerspectiveMemoryReuseQualityReviewInput = {
  reuse_packet_id: string;
  task_title: string;
  task_description: string;
  selected_item_count: number;
  codex_memory_brief_metadata: PerspectiveMemoryReuseBriefMetadataV01;
  selected_memory_items: PerspectiveMemoryReuseQualityReviewSelectedItemInput[];
  return_binding_ref?: string | null;
  operator_notes?: string[] | null;
  nowIso: string;
  reviewId?: string | null;
};

export type PerspectiveMemoryReuseQualityReviewV01 = {
  review_version: typeof PERSPECTIVE_MEMORY_REUSE_QUALITY_REVIEW_VERSION;
  review_id: string;
  created_at: string;
  reuse_packet_id: string;
  task_title: string;
  selected_item_count: number;
  brief_metadata: PerspectiveMemoryReuseBriefMetadataV01;
  return_binding_ref: string;
  operator_notes: string[];
  item_reviews: Array<{
    memory_item_id: string;
    title: string;
    source_ref: string;
    validation_state: string;
    item_status: string;
    has_why_selected: boolean;
    has_reuse_boundary: boolean;
    relevance_review_state: PerspectiveMemoryReuseQualityReviewState;
    boundary_review_state: PerspectiveMemoryReuseBoundaryReviewState;
    stale_or_misleading_risk: PerspectiveMemoryReuseStaleOrMisleadingRiskState;
    review_notes: string[];
  }>;
  aggregate_summary: {
    reviewable_item_count: number;
    needs_operator_review_count: number;
    missing_why_selected_count: number;
    missing_reuse_boundary_count: number;
    compact_brief_recommended: boolean;
    large_selection_warning: boolean;
    suggested_next_action: string;
  };
  authority_boundary: PerspectiveMemoryReuseQualityReviewAuthorityBoundary;
};

export type PerspectiveMemoryReuseQualityReviewAuthorityBoundary = {
  deterministic_local_preview: true;
  mechanical_checks_only: true;
  quality_review_created: true;
  semantic_truth_claim_created: false;
  provider_model_call_created: false;
  openai_api_call_created: false;
  codex_sdk_execution_created: false;
  mcp_tool_call_created: false;
  github_mutation_created: false;
  persistence_write_created: false;
  perspective_memory_persistence_write_created: false;
  reuse_packet_persisted: false;
  return_binding_persisted: false;
  quality_review_persisted: false;
  db_schema_changed: false;
  product_boundary_record_created: false;
  proof_evidence_written: false;
  memory_item_created: false;
  memory_item_mutated: false;
  automatic_synthesis_created: false;
  automatic_memory_creation_created: false;
  runtime_started: false;
  mcp_bridge_started: false;
  hidden_background_daemon_created: false;
  augnes_state_commit_reject_created: false;
};

export type PerspectiveMemoryReuseQualityReviewResultV01 = {
  review: PerspectiveMemoryReuseQualityReviewV01;
  quality_review_summary: string;
};

export function buildPerspectiveMemoryReuseQualityReview(
  input: PerspectiveMemoryReuseQualityReviewInput,
): PerspectiveMemoryReuseQualityReviewResultV01 {
  const reusePacketId = boundText(input.reuse_packet_id, QUALITY_REVIEW_ID_LIMIT);
  const taskTitle = boundText(input.task_title, QUALITY_REVIEW_TITLE_LIMIT);
  const selectedItems = input.selected_memory_items
    .map(buildItemReview)
    .slice(0, QUALITY_REVIEW_ARRAY_LIMIT);
  const aggregateSummary = buildAggregateSummary(
    selectedItems,
    input.selected_item_count,
    input.codex_memory_brief_metadata,
  );
  const review: PerspectiveMemoryReuseQualityReviewV01 = {
    review_version: PERSPECTIVE_MEMORY_REUSE_QUALITY_REVIEW_VERSION,
    review_id: boundText(
      input.reviewId || buildDefaultReviewId(reusePacketId, input.nowIso),
      QUALITY_REVIEW_ID_LIMIT,
    ),
    created_at: input.nowIso,
    reuse_packet_id: reusePacketId,
    task_title: taskTitle,
    selected_item_count: normalizeCount(input.selected_item_count),
    brief_metadata: input.codex_memory_brief_metadata,
    return_binding_ref: boundText(
      input.return_binding_ref ?? "",
      QUALITY_REVIEW_ID_LIMIT,
    ),
    operator_notes: uniqueBoundedStrings(
      input.operator_notes ?? [],
      QUALITY_REVIEW_ARRAY_LIMIT,
      QUALITY_REVIEW_TEXT_LIMIT,
    ),
    item_reviews: selectedItems,
    aggregate_summary: aggregateSummary,
    authority_boundary: buildAuthorityBoundary(),
  };

  return {
    review,
    quality_review_summary: buildQualityReviewSummary(
      review,
      boundText(input.task_description, QUALITY_REVIEW_TEXT_LIMIT),
    ),
  };
}

export function buildQualityReviewSummary(
  review: PerspectiveMemoryReuseQualityReviewV01,
  taskDescription = "",
): string {
  const lines = [
    "# Perspective Memory Reuse Quality Review",
    "",
    `summary_version: ${PERSPECTIVE_MEMORY_REUSE_QUALITY_REVIEW_SUMMARY_VERSION}`,
    `review_version: ${review.review_version}`,
    `review_id: ${review.review_id}`,
    `reuse_packet_id: ${review.reuse_packet_id || "not provided"}`,
    `return_binding_ref: ${review.return_binding_ref || "not provided"}`,
    `task_title: ${review.task_title || "Untitled task"}`,
    `selected_item_count: ${review.selected_item_count}`,
    `compact_brief_recommended: ${review.aggregate_summary.compact_brief_recommended}`,
    `large_selection_warning: ${review.aggregate_summary.large_selection_warning}`,
    "",
    "## Task Description",
    taskDescription || "No task description provided.",
    "",
    "## Mechanical Item Review",
  ];

  if (review.item_reviews.length === 0) {
    lines.push("- No selected memory items to review.");
  } else {
    review.item_reviews.forEach((item, index) => {
      lines.push(
        `${index + 1}. ${item.title || item.memory_item_id}`,
        `   - memory_item_id: ${item.memory_item_id}`,
        `   - validation_state: ${item.validation_state || "not provided"}`,
        `   - item_status: ${item.item_status || "not provided"}`,
        `   - has_why_selected: ${item.has_why_selected}`,
        `   - has_reuse_boundary: ${item.has_reuse_boundary}`,
        `   - relevance_review_state: ${item.relevance_review_state}`,
        `   - boundary_review_state: ${item.boundary_review_state}`,
        `   - stale_or_misleading_risk: ${item.stale_or_misleading_risk}`,
        `   - review_notes: ${item.review_notes.join("; ") || "none"}`,
      );
    });
  }

  lines.push(
    "",
    "## Aggregate Summary",
    `reviewable_item_count: ${review.aggregate_summary.reviewable_item_count}`,
    `needs_operator_review_count: ${review.aggregate_summary.needs_operator_review_count}`,
    `missing_why_selected_count: ${review.aggregate_summary.missing_why_selected_count}`,
    `missing_reuse_boundary_count: ${review.aggregate_summary.missing_reuse_boundary_count}`,
    `suggested_next_action: ${review.aggregate_summary.suggested_next_action}`,
    "",
    "## Authority Boundary",
    "Preview-only deterministic local review. Mechanical checks only; no semantic truth claim.",
    "No persistence, provider/model calls, OpenAI API calls, MCP tool calls, Codex SDK execution, GitHub mutation, DB schema change, proof/evidence write, quality review persistence, or Augnes state commit/reject authority.",
  );

  return lines.join("\n");
}

function buildItemReview(
  item: PerspectiveMemoryReuseQualityReviewSelectedItemInput,
): PerspectiveMemoryReuseQualityReviewV01["item_reviews"][number] {
  const whySelected = boundText(item.why_selected ?? "", QUALITY_REVIEW_TEXT_LIMIT);
  const reuseBoundary = boundText(
    item.reuse_boundary ?? "",
    QUALITY_REVIEW_TEXT_LIMIT,
  );
  const validationState = boundText(
    item.validation_state ?? "",
    QUALITY_REVIEW_TITLE_LIMIT,
  );
  const itemStatus = boundText(item.item_status ?? "", QUALITY_REVIEW_TITLE_LIMIT);
  const hasWhySelected = whySelected.length > 0;
  const hasReuseBoundary = reuseBoundary.length > 0;
  const needsValidationReview = isPassWithFollowUp(validationState);
  const needsStatusReview = isPotentiallyStaleStatus(itemStatus);
  const reviewNotes = buildReviewNotes({
    hasWhySelected,
    hasReuseBoundary,
    needsValidationReview,
    needsStatusReview,
    validationState,
    itemStatus,
  });

  return {
    memory_item_id: boundText(item.memory_item_id, QUALITY_REVIEW_ID_LIMIT),
    title: boundText(item.title, QUALITY_REVIEW_TITLE_LIMIT),
    source_ref: boundText(item.source_ref ?? "", QUALITY_REVIEW_ID_LIMIT),
    validation_state: validationState,
    item_status: itemStatus,
    has_why_selected: hasWhySelected,
    has_reuse_boundary: hasReuseBoundary,
    relevance_review_state:
      hasWhySelected && !needsValidationReview && !needsStatusReview
        ? "reviewable"
        : "needs_operator_review",
    boundary_review_state: hasReuseBoundary
      ? "bounded"
      : "needs_operator_review",
    stale_or_misleading_risk:
      needsValidationReview || needsStatusReview
        ? "needs_operator_review"
        : "none_detected",
    review_notes: reviewNotes,
  };
}

function buildAggregateSummary(
  itemReviews: PerspectiveMemoryReuseQualityReviewV01["item_reviews"],
  selectedItemCount: number,
  briefMetadata: PerspectiveMemoryReuseBriefMetadataV01,
): PerspectiveMemoryReuseQualityReviewV01["aggregate_summary"] {
  const missingWhySelectedCount = itemReviews.filter(
    (item) => !item.has_why_selected,
  ).length;
  const missingReuseBoundaryCount = itemReviews.filter(
    (item) => !item.has_reuse_boundary,
  ).length;
  const reviewableItemCount = itemReviews.filter(
    (item) =>
      item.relevance_review_state === "reviewable" &&
      item.boundary_review_state === "bounded" &&
      item.stale_or_misleading_risk === "none_detected",
  ).length;
  const needsOperatorReviewCount = itemReviews.length - reviewableItemCount;
  const largeSelectionWarning = briefMetadata.has_large_selection_warning;

  return {
    reviewable_item_count: reviewableItemCount,
    needs_operator_review_count: needsOperatorReviewCount,
    missing_why_selected_count: missingWhySelectedCount,
    missing_reuse_boundary_count: missingReuseBoundaryCount,
    compact_brief_recommended: briefMetadata.compact_brief_recommended,
    large_selection_warning: largeSelectionWarning,
    suggested_next_action: suggestNextAction({
      selectedItemCount: normalizeCount(selectedItemCount),
      needsOperatorReviewCount,
      compactBriefRecommended: briefMetadata.compact_brief_recommended,
      largeSelectionWarning,
    }),
  };
}

function buildReviewNotes({
  hasWhySelected,
  hasReuseBoundary,
  needsValidationReview,
  needsStatusReview,
  validationState,
  itemStatus,
}: {
  hasWhySelected: boolean;
  hasReuseBoundary: boolean;
  needsValidationReview: boolean;
  needsStatusReview: boolean;
  validationState: string;
  itemStatus: string;
}) {
  const notes = [];
  if (!hasWhySelected) {
    notes.push("missing why_selected; operator should judge relevance");
  }
  if (!hasReuseBoundary) {
    notes.push("missing reuse_boundary; operator should judge boundary");
  }
  if (needsValidationReview) {
    notes.push(`validation state needs review: ${validationState}`);
  }
  if (needsStatusReview) {
    notes.push(`item status may be stale or misleading: ${itemStatus}`);
  }
  if (notes.length === 0) {
    notes.push("mechanical checks passed; operator still judges quality");
  }
  return notes;
}

function suggestNextAction({
  selectedItemCount,
  needsOperatorReviewCount,
  compactBriefRecommended,
  largeSelectionWarning,
}: {
  selectedItemCount: number;
  needsOperatorReviewCount: number;
  compactBriefRecommended: boolean;
  largeSelectionWarning: boolean;
}) {
  if (selectedItemCount === 0) {
    return "Select persisted perspective-memory items before quality review.";
  }
  if (needsOperatorReviewCount > 0) {
    return "Operator review required before treating reuse as high-quality.";
  }
  if (compactBriefRecommended || largeSelectionWarning) {
    return "Review selection scope and brief size before larger dogfood.";
  }
  return "Mechanically reviewable; operator still decides relevance, freshness, and usefulness.";
}

function isPassWithFollowUp(value: string) {
  return normalizeText(value) === "pass with follow-up";
}

function isPotentiallyStaleStatus(value: string) {
  const normalized = normalizeText(value);
  return (
    normalized === "deprecated" ||
    normalized === "retracted" ||
    normalized === "superseded"
  );
}

function buildAuthorityBoundary(): PerspectiveMemoryReuseQualityReviewAuthorityBoundary {
  return {
    deterministic_local_preview: true,
    mechanical_checks_only: true,
    quality_review_created: true,
    semantic_truth_claim_created: false,
    provider_model_call_created: false,
    openai_api_call_created: false,
    codex_sdk_execution_created: false,
    mcp_tool_call_created: false,
    github_mutation_created: false,
    persistence_write_created: false,
    perspective_memory_persistence_write_created: false,
    reuse_packet_persisted: false,
    return_binding_persisted: false,
    quality_review_persisted: false,
    db_schema_changed: false,
    product_boundary_record_created: false,
    proof_evidence_written: false,
    memory_item_created: false,
    memory_item_mutated: false,
    automatic_synthesis_created: false,
    automatic_memory_creation_created: false,
    runtime_started: false,
    mcp_bridge_started: false,
    hidden_background_daemon_created: false,
    augnes_state_commit_reject_created: false,
  };
}

function buildDefaultReviewId(reusePacketId: string, nowIso: string) {
  return `perspective-memory-reuse-quality-review:${slugify(reusePacketId)}:${nowIso}`;
}

function normalizeCount(value: number) {
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
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

function slugify(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}
