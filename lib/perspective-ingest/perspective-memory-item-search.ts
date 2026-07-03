import {
  PERSPECTIVE_MEMORY_ITEM_MAX_ITEMS,
  type PerspectiveMemoryItemKind,
  type PerspectiveMemoryItemStatus,
  type PerspectiveMemoryItemV0,
} from "@/lib/perspective-ingest/perspective-memory-item";

export const PERSPECTIVE_MEMORY_ITEM_SEARCH_VERSION =
  "perspective_memory_item_search.v0.1";
export const PERSPECTIVE_MEMORY_ITEM_SEARCH_RESULT_SUMMARY_VERSION =
  "perspective_memory_item_search_result_summary.v0.1";
export const PERSPECTIVE_MEMORY_ITEM_SEARCH_DEFAULT_LIMIT = 50;
export const PERSPECTIVE_MEMORY_ITEM_SEARCH_MAX_LIMIT = 100;
export const PERSPECTIVE_MEMORY_ITEM_SEARCH_SNIPPET_MAX_CHARS = 160;

export const PERSPECTIVE_MEMORY_ITEM_SEARCH_ROUTE =
  "/perspective/memory-items/search";

export const PERSPECTIVE_MEMORY_ITEM_SEARCH_FIELDS = [
  "item_id",
  "item_status",
  "memory_kind",
  "source_boundary_record_id",
  "source_checklist_id",
  "source_proposal_id",
  "source_queue_item_id",
  "source_candidate_draft_id",
  "source_validation_result_state",
  "source_validation_summary_hash",
  "source_input_ref",
  "source_input_hash",
  "prepare_summary_ref",
  "prepare_execution_summary_hash",
  "returned_envelope_hash",
  "source_proposal_hash",
  "content.title",
  "content.summary",
  "content.source_refs",
  "content.evidence_refs",
  "content.risk_notes",
  "content.unresolved_tensions",
  "content.carry_forward_questions",
  "content.suggested_next_review_action",
] as const;

export type PerspectiveMemoryItemSearchField =
  (typeof PERSPECTIVE_MEMORY_ITEM_SEARCH_FIELDS)[number];

export type PerspectiveMemoryItemSearchActiveState =
  | "active-ish"
  | "inactive-ish";

export type PerspectiveMemoryItemSearchInput = {
  query?: string | null;
  itemStatus?: PerspectiveMemoryItemStatus | null;
  memoryKind?: PerspectiveMemoryItemKind | null;
  sourceValidationResultState?: "PASS" | "PASS with follow-up" | null;
  sourceBoundaryRecordId?: string | null;
  activeState?: PerspectiveMemoryItemSearchActiveState | null;
  hasWarnings?: boolean | null;
  limit?: number | null;
};

export type PerspectiveMemoryItemSearchResultSummaryV0 = {
  summary_version: typeof PERSPECTIVE_MEMORY_ITEM_SEARCH_RESULT_SUMMARY_VERSION;
  item_id: string;
  score: number;
  matched_fields: PerspectiveMemoryItemSearchField[];
  snippets: Array<{
    field: PerspectiveMemoryItemSearchField;
    snippet: string;
  }>;
};

export type PerspectiveMemoryItemSearchMetadataV0 = {
  search_version: typeof PERSPECTIVE_MEMORY_ITEM_SEARCH_VERSION;
  query: string;
  normalized_query: string;
  query_empty: boolean;
  total_candidates_considered: number;
  total_matches: number;
  match_fields: PerspectiveMemoryItemSearchField[];
  result_summaries: PerspectiveMemoryItemSearchResultSummaryV0[];
};

export type PerspectiveMemoryItemSearchResultV0 = {
  items: PerspectiveMemoryItemV0[];
  search: PerspectiveMemoryItemSearchMetadataV0;
};

type SearchFieldEntry = {
  field: PerspectiveMemoryItemSearchField;
  value: string;
  rankGroup: number;
};

type MatchedItem = {
  item: PerspectiveMemoryItemV0;
  summary: PerspectiveMemoryItemSearchResultSummaryV0;
  rankGroup: number;
  exactPhraseMatches: number;
  updatedAt: string;
};

export function searchPerspectiveMemoryItems(
  items: PerspectiveMemoryItemV0[],
  input: PerspectiveMemoryItemSearchInput = {},
): PerspectiveMemoryItemSearchResultV0 {
  const limit = normalizeSearchLimit(input.limit);
  const query = input.query ?? "";
  const normalizedQuery = normalizeSearchQuery(query);
  const queryTokens = tokenizeQuery(normalizedQuery);
  const queryEmpty = queryTokens.length === 0;
  const filteredCandidates = items
    .filter((item) => filterSearchCandidate(item, input))
    .slice(0, PERSPECTIVE_MEMORY_ITEM_MAX_ITEMS);

  if (queryEmpty) {
    const selectedItems = filteredCandidates.slice(0, limit);
    return {
      items: selectedItems,
      search: {
        search_version: PERSPECTIVE_MEMORY_ITEM_SEARCH_VERSION,
        query,
        normalized_query: normalizedQuery,
        query_empty: true,
        total_candidates_considered: filteredCandidates.length,
        total_matches: filteredCandidates.length,
        match_fields: [],
        result_summaries: selectedItems.map((item) =>
          summarizeQueryEmptyItem(item),
        ),
      },
    };
  }

  const matches = filteredCandidates
    .map((item) => matchItem(item, normalizedQuery, queryTokens))
    .filter((match): match is MatchedItem => match != null)
    .sort(compareMatchedItems);
  const selectedMatches = matches.slice(0, limit);
  return {
    items: selectedMatches.map((match) => match.item),
    search: {
      search_version: PERSPECTIVE_MEMORY_ITEM_SEARCH_VERSION,
      query,
      normalized_query: normalizedQuery,
      query_empty: false,
      total_candidates_considered: filteredCandidates.length,
      total_matches: matches.length,
      match_fields: collectMatchedFields(selectedMatches),
      result_summaries: selectedMatches.map((match) => match.summary),
    },
  };
}

export function normalizeSearchQuery(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function normalizeSearchLimit(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) {
    return PERSPECTIVE_MEMORY_ITEM_SEARCH_DEFAULT_LIMIT;
  }
  return Math.max(
    1,
    Math.min(
      Math.trunc(value),
      PERSPECTIVE_MEMORY_ITEM_SEARCH_MAX_LIMIT,
      PERSPECTIVE_MEMORY_ITEM_MAX_ITEMS,
    ),
  );
}

export function perspectiveMemoryItemHasWarnings(item: PerspectiveMemoryItemV0) {
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

function tokenizeQuery(normalizedQuery: string) {
  if (normalizedQuery.length === 0) return [];
  return normalizedQuery.split(" ").filter(Boolean);
}

function filterSearchCandidate(
  item: PerspectiveMemoryItemV0,
  input: PerspectiveMemoryItemSearchInput,
) {
  if (input.itemStatus && item.item_status !== input.itemStatus) return false;
  if (input.memoryKind && item.memory_kind !== input.memoryKind) return false;
  if (
    input.sourceValidationResultState &&
    item.source_validation_result_state !== input.sourceValidationResultState
  ) {
    return false;
  }
  if (
    input.sourceBoundaryRecordId &&
    item.source_boundary_record_id !== input.sourceBoundaryRecordId
  ) {
    return false;
  }
  if (input.activeState === "active-ish" && !isActiveish(item)) return false;
  if (input.activeState === "inactive-ish" && !isInactiveish(item)) return false;
  if (input.hasWarnings === true && !perspectiveMemoryItemHasWarnings(item)) {
    return false;
  }
  if (input.hasWarnings === false && perspectiveMemoryItemHasWarnings(item)) {
    return false;
  }
  return true;
}

function matchItem(
  item: PerspectiveMemoryItemV0,
  normalizedQuery: string,
  queryTokens: string[],
): MatchedItem | null {
  const entries = buildSearchFieldEntries(item);
  const normalizedSearchText = entries
    .map((entry) => normalizeSearchQuery(entry.value))
    .join(" ");
  if (!queryTokens.every((token) => normalizedSearchText.includes(token))) {
    return null;
  }

  const matchedEntries = entries.filter((entry) =>
    fieldMatches(entry.value, normalizedQuery, queryTokens),
  );
  if (matchedEntries.length === 0) return null;

  const matchedFields = uniqueSearchFields(
    matchedEntries.map((entry) => entry.field),
  );
  const rankGroup = getRankGroup(item, normalizedQuery, queryTokens, matchedEntries);
  const exactPhraseMatches = matchedEntries.filter((entry) =>
    normalizeSearchQuery(entry.value).includes(normalizedQuery),
  ).length;
  const score =
    (7 - rankGroup) * 1000 +
    exactPhraseMatches * 50 +
    Math.min(matchedFields.length, 20);
  return {
    item,
    rankGroup,
    exactPhraseMatches,
    updatedAt: item.updated_at,
    summary: {
      summary_version: PERSPECTIVE_MEMORY_ITEM_SEARCH_RESULT_SUMMARY_VERSION,
      item_id: item.item_id,
      score,
      matched_fields: matchedFields,
      snippets: matchedEntries.slice(0, 5).map((entry) => ({
        field: entry.field,
        snippet: buildSnippet(entry.value, normalizedQuery, queryTokens),
      })),
    },
  };
}

function buildSearchFieldEntries(
  item: PerspectiveMemoryItemV0,
): SearchFieldEntry[] {
  return [
    { field: "item_id", value: item.item_id, rankGroup: 4 },
    { field: "item_status", value: item.item_status, rankGroup: 4 },
    { field: "memory_kind", value: item.memory_kind, rankGroup: 4 },
    {
      field: "source_boundary_record_id",
      value: item.source_boundary_record_id,
      rankGroup: 4,
    },
    {
      field: "source_checklist_id",
      value: item.source_checklist_id,
      rankGroup: 4,
    },
    { field: "source_proposal_id", value: item.source_proposal_id, rankGroup: 4 },
    {
      field: "source_queue_item_id",
      value: item.source_queue_item_id,
      rankGroup: 4,
    },
    {
      field: "source_candidate_draft_id",
      value: item.source_candidate_draft_id,
      rankGroup: 4,
    },
    {
      field: "source_validation_result_state",
      value: item.source_validation_result_state,
      rankGroup: 4,
    },
    {
      field: "source_validation_summary_hash",
      value: item.source_validation_summary_hash,
      rankGroup: 4,
    },
    { field: "source_input_ref", value: item.source_input_ref, rankGroup: 4 },
    { field: "source_input_hash", value: item.source_input_hash, rankGroup: 4 },
    { field: "prepare_summary_ref", value: item.prepare_summary_ref, rankGroup: 4 },
    {
      field: "prepare_execution_summary_hash",
      value: item.prepare_execution_summary_hash,
      rankGroup: 4,
    },
    {
      field: "returned_envelope_hash",
      value: item.returned_envelope_hash,
      rankGroup: 4,
    },
    { field: "source_proposal_hash", value: item.source_proposal_hash, rankGroup: 4 },
    { field: "content.title", value: item.content.title, rankGroup: 2 },
    { field: "content.summary", value: item.content.summary, rankGroup: 3 },
    {
      field: "content.source_refs",
      value: item.content.source_refs.join(" "),
      rankGroup: 4,
    },
    {
      field: "content.evidence_refs",
      value: item.content.evidence_refs.join(" "),
      rankGroup: 4,
    },
    {
      field: "content.risk_notes",
      value: item.content.risk_notes.join(" "),
      rankGroup: 5,
    },
    {
      field: "content.unresolved_tensions",
      value: item.content.unresolved_tensions.join(" "),
      rankGroup: 5,
    },
    {
      field: "content.carry_forward_questions",
      value: item.content.carry_forward_questions.join(" "),
      rankGroup: 5,
    },
    {
      field: "content.suggested_next_review_action",
      value: item.content.suggested_next_review_action,
      rankGroup: 5,
    },
  ];
}

function getRankGroup(
  item: PerspectiveMemoryItemV0,
  normalizedQuery: string,
  queryTokens: string[],
  matchedEntries: SearchFieldEntry[],
) {
  if (normalizeSearchQuery(item.content.title) === normalizedQuery) return 1;
  if (
    queryTokens.every((token) =>
      normalizeSearchQuery(item.content.title).includes(token),
    )
  ) {
    return 2;
  }
  if (
    queryTokens.every((token) =>
      normalizeSearchQuery(item.content.summary).includes(token),
    )
  ) {
    return 3;
  }
  return matchedEntries.reduce(
    (lowest, entry) => Math.min(lowest, entry.rankGroup),
    6,
  );
}

function fieldMatches(
  value: string,
  normalizedQuery: string,
  queryTokens: string[],
) {
  const normalizedValue = normalizeSearchQuery(value);
  if (normalizedQuery.length > 0 && normalizedValue.includes(normalizedQuery)) {
    return true;
  }
  return queryTokens.some((token) => normalizedValue.includes(token));
}

function buildSnippet(
  value: string,
  normalizedQuery: string,
  queryTokens: string[],
) {
  const compactValue = value.replace(/\s+/g, " ").trim();
  if (compactValue.length <= PERSPECTIVE_MEMORY_ITEM_SEARCH_SNIPPET_MAX_CHARS) {
    return compactValue;
  }
  const normalizedValue = compactValue.toLowerCase();
  const matchIndex = findSnippetIndex(
    normalizedValue,
    normalizedQuery,
    queryTokens,
  );
  const halfWidth = Math.floor(PERSPECTIVE_MEMORY_ITEM_SEARCH_SNIPPET_MAX_CHARS / 2);
  const start = Math.max(0, matchIndex - halfWidth);
  const end = Math.min(
    compactValue.length,
    start + PERSPECTIVE_MEMORY_ITEM_SEARCH_SNIPPET_MAX_CHARS,
  );
  const prefix = start > 0 ? "..." : "";
  const suffix = end < compactValue.length ? "..." : "";
  return `${prefix}${compactValue.slice(start, end)}${suffix}`.slice(
    0,
    PERSPECTIVE_MEMORY_ITEM_SEARCH_SNIPPET_MAX_CHARS,
  );
}

function findSnippetIndex(
  normalizedValue: string,
  normalizedQuery: string,
  queryTokens: string[],
) {
  if (normalizedQuery.length > 0) {
    const phraseIndex = normalizedValue.indexOf(normalizedQuery);
    if (phraseIndex >= 0) return phraseIndex;
  }
  for (const token of queryTokens) {
    const tokenIndex = normalizedValue.indexOf(token);
    if (tokenIndex >= 0) return tokenIndex;
  }
  return 0;
}

function compareMatchedItems(left: MatchedItem, right: MatchedItem) {
  if (left.rankGroup !== right.rankGroup) return left.rankGroup - right.rankGroup;
  if (left.exactPhraseMatches !== right.exactPhraseMatches) {
    return right.exactPhraseMatches - left.exactPhraseMatches;
  }
  const updatedCompare = right.updatedAt.localeCompare(left.updatedAt);
  if (updatedCompare !== 0) return updatedCompare;
  return left.item.item_id.localeCompare(right.item.item_id);
}

function collectMatchedFields(matches: MatchedItem[]) {
  return uniqueSearchFields(
    matches.flatMap((match) => match.summary.matched_fields),
  );
}

function uniqueSearchFields(fields: PerspectiveMemoryItemSearchField[]) {
  return PERSPECTIVE_MEMORY_ITEM_SEARCH_FIELDS.filter((field) =>
    fields.includes(field),
  );
}

function summarizeQueryEmptyItem(
  item: PerspectiveMemoryItemV0,
): PerspectiveMemoryItemSearchResultSummaryV0 {
  return {
    summary_version: PERSPECTIVE_MEMORY_ITEM_SEARCH_RESULT_SUMMARY_VERSION,
    item_id: item.item_id,
    score: 0,
    matched_fields: [],
    snippets: [],
  };
}

function isActiveish(item: PerspectiveMemoryItemV0) {
  return item.item_status === "accepted" || item.item_status === "reviewing";
}

function isInactiveish(item: PerspectiveMemoryItemV0) {
  return (
    item.item_status === "retracted" ||
    item.item_status === "superseded" ||
    item.item_status === "deprecated"
  );
}
