import {
  PERSPECTIVE_MEMORY_ITEM_MAX_ITEMS,
  type PerspectiveMemoryItemKind,
  type PerspectiveMemoryItemStatus,
  type PerspectiveMemoryItemV0,
} from "@/lib/perspective-ingest/perspective-memory-item";

export const PERSPECTIVE_MEMORY_ITEM_REVIEW_WORKSPACE_VERSION =
  "perspective_memory_item_review_workspace.v0.1";
export const PERSPECTIVE_MEMORY_ITEM_REVIEW_PACKET_VERSION =
  "perspective_memory_item_review_packet.v0.1";
export const PERSPECTIVE_MEMORY_ITEM_REVIEW_SELECTION_SUMMARY_VERSION =
  "perspective_memory_item_review_selection_summary.v0.1";
export const PERSPECTIVE_MEMORY_ITEM_REVIEW_GUIDANCE_VERSION =
  "perspective_memory_item_review_guidance.v0.1";
export const PERSPECTIVE_MEMORY_ITEM_REVIEW_WORKSPACE_ROUTE =
  "/perspective/memory-items/review";

const REVIEW_ARRAY_LIMIT = 80;
const REVIEW_TEXT_LIMIT = 300;
const REVIEW_SUMMARY_LIMIT = 900;
const REVIEW_TITLE_LIMIT = 180;

export type PerspectiveMemoryItemReviewWorkspaceInput = {
  items: PerspectiveMemoryItemV0[];
  selected_item_ids: string[];
  nowIso: string;
};

export type PerspectiveMemoryItemReviewSelectionSummaryV0 = {
  selection_summary_version:
    typeof PERSPECTIVE_MEMORY_ITEM_REVIEW_SELECTION_SUMMARY_VERSION;
  selected_item_count: number;
  selected_item_ids: string[];
  missing_item_ids: string[];
};

export type PerspectiveMemoryItemReviewPacketV0 = {
  packet_version: typeof PERSPECTIVE_MEMORY_ITEM_REVIEW_PACKET_VERSION;
  generated_at: string;
  selected_item_count: number;
  selected_item_ids: string[];
  missing_item_ids: string[];
  selection_summary: PerspectiveMemoryItemReviewSelectionSummaryV0;
  status_counts: Record<string, number>;
  validation_result_counts: Record<string, number>;
  memory_kind_counts: Record<string, number>;
  source_boundary_record_ids: string[];
  source_candidate_draft_ids: string[];
  source_refs: string[];
  evidence_refs: string[];
  risk_notes: string[];
  unresolved_tensions: string[];
  carry_forward_questions: string[];
  suggested_next_review_actions: string[];
  content_summaries: Array<{
    item_id: string;
    title: string;
    summary: string;
    item_status: PerspectiveMemoryItemStatus;
    source_validation_result_state: "PASS" | "PASS with follow-up";
    risk_indicator: string;
  }>;
  relationship_summary: {
    shared_source_refs: string[];
    duplicate_titles: string[];
    repeated_questions: string[];
    retracted_or_deprecated_items: string[];
    superseded_items: string[];
    pass_with_follow_up_items: string[];
  };
  review_guidance: {
    guidance_version: typeof PERSPECTIVE_MEMORY_ITEM_REVIEW_GUIDANCE_VERSION;
    deterministic_only: true;
    suggested_review_steps: string[];
    blocked_actions: string[];
  };
  authority_boundary: {
    read_only_review_packet: true;
    memory_item_created: false;
    memory_item_mutated: false;
    core_decision_created: false;
    core_memory_created: false;
    state_entry_created: false;
    runtime_handoff_created: false;
    automatic_runtime_injection_created: false;
    automatic_promotion_created: false;
    provider_model_call_created: false;
    github_mutation_created: false;
  };
};

export function buildPerspectiveMemoryItemReviewPacket(
  input: PerspectiveMemoryItemReviewWorkspaceInput,
): PerspectiveMemoryItemReviewPacketV0 {
  const selectedItemIds = uniqueStrings(input.selected_item_ids).slice(
    0,
    PERSPECTIVE_MEMORY_ITEM_MAX_ITEMS,
  );
  const itemsById = new Map(input.items.map((item) => [item.item_id, item]));
  const selectedItems = selectedItemIds
    .map((itemId) => itemsById.get(itemId))
    .filter((item): item is PerspectiveMemoryItemV0 => item != null);
  const selectedItemIdSet = new Set(selectedItems.map((item) => item.item_id));
  const missingItemIds = selectedItemIds.filter(
    (itemId) => !selectedItemIdSet.has(itemId),
  );

  return {
    packet_version: PERSPECTIVE_MEMORY_ITEM_REVIEW_PACKET_VERSION,
    generated_at: input.nowIso,
    selected_item_count: selectedItems.length,
    selected_item_ids: selectedItems.map((item) => item.item_id),
    missing_item_ids: missingItemIds,
    selection_summary: {
      selection_summary_version:
        PERSPECTIVE_MEMORY_ITEM_REVIEW_SELECTION_SUMMARY_VERSION,
      selected_item_count: selectedItems.length,
      selected_item_ids: selectedItems.map((item) => item.item_id),
      missing_item_ids: missingItemIds,
    },
    status_counts: countBy(selectedItems, (item) => item.item_status),
    validation_result_counts: countBy(
      selectedItems,
      (item) => item.source_validation_result_state,
    ),
    memory_kind_counts: countBy(selectedItems, (item) => item.memory_kind),
    source_boundary_record_ids: uniqueBoundedStrings(
      selectedItems.map((item) => item.source_boundary_record_id),
    ),
    source_candidate_draft_ids: uniqueBoundedStrings(
      selectedItems.map((item) => item.source_candidate_draft_id),
    ),
    source_refs: uniqueBoundedStrings(
      selectedItems.flatMap((item) => item.content.source_refs),
    ),
    evidence_refs: uniqueBoundedStrings(
      selectedItems.flatMap((item) => item.content.evidence_refs),
    ),
    risk_notes: uniqueBoundedStrings(
      selectedItems.flatMap((item) => item.content.risk_notes),
    ),
    unresolved_tensions: uniqueBoundedStrings(
      selectedItems.flatMap((item) => item.content.unresolved_tensions),
    ),
    carry_forward_questions: uniqueBoundedStrings(
      selectedItems.flatMap((item) => item.content.carry_forward_questions),
    ),
    suggested_next_review_actions: uniqueBoundedStrings(
      selectedItems.map((item) => item.content.suggested_next_review_action),
    ),
    content_summaries: selectedItems.map((item) => ({
      item_id: item.item_id,
      title: boundText(item.content.title, REVIEW_TITLE_LIMIT),
      summary: boundText(item.content.summary, REVIEW_SUMMARY_LIMIT),
      item_status: item.item_status,
      source_validation_result_state: item.source_validation_result_state,
      risk_indicator: perspectiveMemoryItemReviewRiskIndicator(item),
    })),
    relationship_summary: {
      shared_source_refs: repeatedValues(
        selectedItems.flatMap((item) => item.content.source_refs),
      ),
      duplicate_titles: repeatedValues(
        selectedItems.map((item) => item.content.title),
      ),
      repeated_questions: repeatedValues(
        selectedItems.flatMap((item) => item.content.carry_forward_questions),
      ),
      retracted_or_deprecated_items: selectedItems
        .filter(
          (item) =>
            item.item_status === "retracted" || item.item_status === "deprecated",
        )
        .map((item) => item.item_id),
      superseded_items: selectedItems
        .filter((item) => item.item_status === "superseded")
        .map((item) => item.item_id),
      pass_with_follow_up_items: selectedItems
        .filter((item) => item.source_validation_result_state === "PASS with follow-up")
        .map((item) => item.item_id),
    },
    review_guidance: buildReviewGuidance(selectedItems.length),
    authority_boundary: buildAuthorityBoundary(),
  };
}

export function perspectiveMemoryItemReviewRiskIndicator(
  item: PerspectiveMemoryItemV0,
) {
  if (item.source_validation_result_state === "PASS with follow-up") {
    return "PASS with follow-up caution";
  }
  return perspectiveMemoryItemReviewHasWarnings(item)
    ? "warnings present"
    : "no warning caveat";
}

export function perspectiveMemoryItemReviewHasWarnings(
  item: PerspectiveMemoryItemV0,
) {
  return item.content.risk_notes.some((note) => {
    const normalized = note.toLowerCase();
    if (normalized.includes("pass with follow-up")) return true;
    if (normalized.includes("warning") && !normalized.startsWith("0 ")) {
      return true;
    }
    if (normalized.includes("pointer") && !normalized.startsWith("0 ")) {
      return true;
    }
    return false;
  });
}

function buildReviewGuidance(
  selectedItemCount: number,
): PerspectiveMemoryItemReviewPacketV0["review_guidance"] {
  const suggestedReviewSteps =
    selectedItemCount === 0
      ? [
          "Select persisted perspective-memory items to build a deterministic review packet.",
          "Use search or dashboard filters to narrow candidate items before review.",
        ]
      : [
          "Review source refs and evidence refs before any synthesis.",
          "Resolve unresolved_tensions before Core-facing promotion.",
          "Treat PASS with follow-up items as needing extra caution.",
          "Do not inject selected items into runtime context from this surface.",
          "Use future product decision for Core-facing promotion.",
        ];
  return {
    guidance_version: PERSPECTIVE_MEMORY_ITEM_REVIEW_GUIDANCE_VERSION,
    deterministic_only: true as const,
    suggested_review_steps: suggestedReviewSteps,
    blocked_actions: [
      "Create Core decision",
      "Create Core memory",
      "Auto inject runtime context",
      "Provider/model synthesis",
      "GitHub mutation",
      "Automatic promotion",
      "Runtime handoff",
    ],
  };
}

function buildAuthorityBoundary(): PerspectiveMemoryItemReviewPacketV0["authority_boundary"] {
  return {
    read_only_review_packet: true,
    memory_item_created: false,
    memory_item_mutated: false,
    core_decision_created: false,
    core_memory_created: false,
    state_entry_created: false,
    runtime_handoff_created: false,
    automatic_runtime_injection_created: false,
    automatic_promotion_created: false,
    provider_model_call_created: false,
    github_mutation_created: false,
  };
}

function countBy<T>(
  values: T[],
  getKey: (value: T) => PerspectiveMemoryItemStatus | PerspectiveMemoryItemKind | string,
) {
  return values.reduce<Record<string, number>>((counts, value) => {
    const key = getKey(value);
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function repeatedValues(values: string[]) {
  const seen = new Map<string, { value: string; count: number }>();
  for (const value of values) {
    const normalized = normalizeReviewText(value);
    if (!normalized) continue;
    const current = seen.get(normalized);
    if (current) {
      current.count += 1;
    } else {
      seen.set(normalized, { value: boundText(value, REVIEW_TEXT_LIMIT), count: 1 });
    }
  }
  return Array.from(seen.values())
    .filter((entry) => entry.count > 1)
    .map((entry) => entry.value)
    .slice(0, REVIEW_ARRAY_LIMIT);
}

function uniqueBoundedStrings(values: string[]) {
  return uniqueStrings(values.map((value) => boundText(value, REVIEW_TEXT_LIMIT))).slice(
    0,
    REVIEW_ARRAY_LIMIT,
  );
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = normalizeReviewText(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(value);
  }
  return result;
}

function normalizeReviewText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function boundText(value: string, maxLength: number) {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength);
}
