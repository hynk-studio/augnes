import type {
  CodexFormerLocalAdapterAcceptedCandidateDraftAction,
  CodexFormerLocalAdapterAcceptedCandidateDraftLocalStatus,
  CodexFormerLocalAdapterAcceptedCandidateDraftV0,
} from "@/lib/perspective-ingest/codex-former-local-adapter-accepted-candidate-draft";
import type {
  CodexFormerLocalAdapterCandidateDraftCurrentStatus,
  CodexFormerLocalAdapterCandidateDraftListV0,
} from "@/lib/perspective-ingest/codex-former-local-adapter-candidate-draft-list";
import type {
  OperatorFlowStorage,
} from "@/lib/perspective-ingest/codex-former-local-adapter-operator-flow";

export const PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ROUTE =
  "/cockpit/perspective/memory-review-queue/local";
export const PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE =
  "augnes.perspectiveMemory.localReviewQueue.v0.1";
export const PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION =
  "perspective_memory_local_review_queue.v0.1";
export const PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ITEM_VERSION =
  "perspective_memory_local_review_queue_item.v0.1";
export const PERSPECTIVE_MEMORY_CANDIDATE_PREVIEW_VERSION =
  "perspective_memory_candidate_preview.v0.1";
export const PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_MAX_ITEMS = 50;

export type PerspectiveMemoryLocalReviewQueueStatus =
  | "queued_for_memory_review"
  | "reviewing_locally"
  | "kept_for_later"
  | "removed_from_queue"
  | "returned_to_candidate_drafts";

export type PerspectiveMemoryLocalReviewQueueSourceState =
  | "current_with_source_candidate_draft"
  | "source_candidate_draft_stale"
  | "source_candidate_draft_missing"
  | "not_checked";

export type PerspectiveMemoryCandidatePreviewV0 = {
  preview_version: typeof PERSPECTIVE_MEMORY_CANDIDATE_PREVIEW_VERSION;
  title: string;
  summary: string;
  supporting_refs: string[];
  risk_notes: string[];
  unresolved_tensions: string[];
  next_review_action: string;
};

export type PerspectiveMemoryLocalReviewQueueItemV0 = {
  item_version: typeof PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ITEM_VERSION;
  queue_item_id: string;
  created_at: string;
  updated_at: string;
  source: "codex_former_local_adapter_operator_flow";
  source_candidate_draft_id: string;
  source_candidate_local_status: CodexFormerLocalAdapterAcceptedCandidateDraftLocalStatus;
  source_candidate_action: CodexFormerLocalAdapterAcceptedCandidateDraftAction;
  source_validation_result_state: "PASS" | "PASS with follow-up" | "BLOCKED";
  source_validation_summary_hash: string;
  source_input_ref: string;
  source_input_hash: string;
  prepare_summary_ref: string;
  prepare_execution_summary_hash: string;
  returned_envelope_hash: string;
  warning_count: number;
  pointer_warning_count: number;
  source_pr_refs: string[];
  changed_files_count: number;
  review_summary: string;
  memory_candidate_preview: PerspectiveMemoryCandidatePreviewV0;
  queue_status: PerspectiveMemoryLocalReviewQueueStatus;
  review_only_actions: {
    can_mark_reviewing: boolean;
    can_keep_for_later: boolean;
    can_remove_from_queue: boolean;
    can_return_to_candidate_drafts: boolean;
    can_create_memory_write: false;
  };
  stale_state: PerspectiveMemoryLocalReviewQueueSourceState;
  authority_boundary: {
    local_queue_only: true;
    accepted_augnes_memory_created: false;
    review_decision_created: false;
    product_db_persistence: false;
    core_decision_created: false;
    runtime_handoff_created: false;
    automatic_promotion: false;
  };
};

export type PerspectiveMemoryLocalReviewQueueV0 = {
  queue_version: typeof PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION;
  updated_at: string;
  items: PerspectiveMemoryLocalReviewQueueItemV0[];
};

export type BuildPerspectiveMemoryLocalReviewQueueItemInput = {
  nowIso: string;
  queueItemId: string;
  draft: CodexFormerLocalAdapterAcceptedCandidateDraftV0;
  sourceDraftCurrentStatus: CodexFormerLocalAdapterCandidateDraftCurrentStatus;
};

export type BuildPerspectiveMemoryLocalReviewQueueItemResult =
  | {
      ok: true;
      item: PerspectiveMemoryLocalReviewQueueItemV0;
    }
  | {
      ok: false;
      blocked_reasons: string[];
    };

export function createEmptyPerspectiveMemoryLocalReviewQueue(
  nowIso: string,
): PerspectiveMemoryLocalReviewQueueV0 {
  return {
    queue_version: PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION,
    updated_at: nowIso,
    items: [],
  };
}

export function buildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft(
  input: BuildPerspectiveMemoryLocalReviewQueueItemInput,
): BuildPerspectiveMemoryLocalReviewQueueItemResult {
  const blockedReasons =
    collectPerspectiveMemoryQueueEligibilityBlockedReasons(input);
  if (blockedReasons.length > 0) {
    return { ok: false, blocked_reasons: blockedReasons };
  }

  const item: PerspectiveMemoryLocalReviewQueueItemV0 = {
    item_version: PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ITEM_VERSION,
    queue_item_id: input.queueItemId,
    created_at: input.nowIso,
    updated_at: input.nowIso,
    source: "codex_former_local_adapter_operator_flow",
    source_candidate_draft_id: input.draft.draft_id,
    source_candidate_local_status: input.draft.local_status,
    source_candidate_action: input.draft.candidate_action,
    source_validation_result_state: input.draft.validation_result_state,
    source_validation_summary_hash: input.draft.validation_summary_hash,
    source_input_ref: input.draft.source_input_ref,
    source_input_hash: input.draft.source_input_hash,
    prepare_summary_ref: input.draft.prepare_summary_ref,
    prepare_execution_summary_hash:
      input.draft.prepare_execution_summary_hash,
    returned_envelope_hash: input.draft.returned_envelope_hash,
    warning_count: input.draft.warnings.length,
    pointer_warning_count: input.draft.pointer_warnings.length,
    source_pr_refs: boundedStrings(input.draft.source_pr_refs),
    changed_files_count: input.draft.changed_files_count,
    review_summary: boundText(input.draft.review_summary, 1000),
    memory_candidate_preview:
      buildPerspectiveMemoryCandidatePreviewFromDraft(input.draft),
    queue_status: "queued_for_memory_review",
    review_only_actions: buildReviewOnlyActions(),
    stale_state: "current_with_source_candidate_draft",
    authority_boundary: buildLocalQueueAuthorityBoundary(),
  };

  const unsafeMarkers =
    collectPerspectiveMemoryLocalReviewQueueItemUnsafeMarkers(item);
  if (unsafeMarkers.length > 0) {
    return {
      ok: false,
      blocked_reasons: unsafeMarkers.map(
        (marker) => `queue item contains unsafe marker: ${marker}`,
      ),
    };
  }

  return { ok: true, item };
}

export function canBuildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft(
  input: Pick<
    BuildPerspectiveMemoryLocalReviewQueueItemInput,
    "draft" | "sourceDraftCurrentStatus"
  >,
) {
  const blockedReasons =
    collectPerspectiveMemoryQueueEligibilityBlockedReasons({
      ...input,
      nowIso: "1970-01-01T00:00:00.000Z",
      queueItemId: "eligibility-check",
    });
  return {
    eligible: blockedReasons.length === 0,
    blocked_reasons: blockedReasons,
  };
}

export function loadPerspectiveMemoryLocalReviewQueueFromStorage(
  storage: OperatorFlowStorage,
  nowIso: string,
) {
  return safeParsePerspectiveMemoryLocalReviewQueue(
    storage.getItem(PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE),
    nowIso,
  );
}

export function savePerspectiveMemoryLocalReviewQueueToStorage(
  storage: OperatorFlowStorage,
  queue: PerspectiveMemoryLocalReviewQueueV0,
) {
  storage.setItem(
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE,
    JSON.stringify(queue),
  );
}

export function clearPerspectiveMemoryLocalReviewQueueFromStorage(
  storage: OperatorFlowStorage,
) {
  storage.removeItem(PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE);
}

export function safeParsePerspectiveMemoryLocalReviewQueue(
  serialized: string | null,
  nowIso: string,
): PerspectiveMemoryLocalReviewQueueV0 {
  if (!serialized) {
    return createEmptyPerspectiveMemoryLocalReviewQueue(nowIso);
  }
  try {
    const parsed = JSON.parse(serialized);
    if (
      !isRecord(parsed) ||
      parsed.queue_version !== PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION ||
      typeof parsed.updated_at !== "string" ||
      !Array.isArray(parsed.items)
    ) {
      return createEmptyPerspectiveMemoryLocalReviewQueue(nowIso);
    }
    const items = parsed.items
      .map((item) => (isPerspectiveMemoryLocalReviewQueueItem(item) ? item : null))
      .filter(
        (
          item,
        ): item is PerspectiveMemoryLocalReviewQueueItemV0 => item != null,
      );
    return normalizePerspectiveMemoryLocalReviewQueue(
      {
        queue_version: PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION,
        updated_at: parsed.updated_at,
        items,
      },
      parsed.updated_at,
    );
  } catch {
    return createEmptyPerspectiveMemoryLocalReviewQueue(nowIso);
  }
}

export function appendPerspectiveMemoryLocalReviewQueueItem(
  queue: PerspectiveMemoryLocalReviewQueueV0,
  item: PerspectiveMemoryLocalReviewQueueItemV0,
  nowIso: string,
) {
  return normalizePerspectiveMemoryLocalReviewQueue(
    {
      ...queue,
      updated_at: nowIso,
      items: [item, ...queue.items],
    },
    nowIso,
  );
}

export function updatePerspectiveMemoryLocalReviewQueueItemStatus(
  queue: PerspectiveMemoryLocalReviewQueueV0,
  queueItemId: string,
  queueStatus: PerspectiveMemoryLocalReviewQueueStatus,
  nowIso: string,
) {
  return normalizePerspectiveMemoryLocalReviewQueue(
    {
      ...queue,
      updated_at: nowIso,
      items: queue.items.map((item) =>
        item.queue_item_id === queueItemId
          ? { ...item, queue_status: queueStatus, updated_at: nowIso }
          : item,
      ),
    },
    nowIso,
  );
}

export function removePerspectiveMemoryLocalReviewQueueItem(
  queue: PerspectiveMemoryLocalReviewQueueV0,
  queueItemId: string,
  nowIso: string,
) {
  return normalizePerspectiveMemoryLocalReviewQueue(
    {
      ...queue,
      updated_at: nowIso,
      items: queue.items.filter((item) => item.queue_item_id !== queueItemId),
    },
    nowIso,
  );
}

export function findPerspectiveMemoryLocalReviewQueueItemBySourceDraft(
  queue: PerspectiveMemoryLocalReviewQueueV0,
  sourceCandidateDraftId: string,
) {
  return (
    queue.items.find(
      (item) =>
        item.source_candidate_draft_id === sourceCandidateDraftId &&
        item.queue_status !== "removed_from_queue",
    ) ?? null
  );
}

export function getPerspectiveMemoryLocalReviewQueueItemSourceState(
  item: PerspectiveMemoryLocalReviewQueueItemV0,
  candidateDraftList: CodexFormerLocalAdapterCandidateDraftListV0,
): PerspectiveMemoryLocalReviewQueueSourceState {
  const draft =
    candidateDraftList.drafts.find(
      (candidateDraft) =>
        candidateDraft.draft_id === item.source_candidate_draft_id,
    ) ?? null;
  if (!draft) {
    return "source_candidate_draft_missing";
  }
  if (
    item.source_validation_summary_hash !== draft.validation_summary_hash ||
    item.source_input_hash !== draft.source_input_hash ||
    item.prepare_execution_summary_hash !==
      draft.prepare_execution_summary_hash ||
    item.returned_envelope_hash !== draft.returned_envelope_hash
  ) {
    return "source_candidate_draft_stale";
  }
  return "current_with_source_candidate_draft";
}

export function collectPerspectiveMemoryLocalReviewQueueUnsafeMarkers(
  queue: PerspectiveMemoryLocalReviewQueueV0,
) {
  return uniqueStrings(
    queue.items.flatMap((item) =>
      collectPerspectiveMemoryLocalReviewQueueItemUnsafeMarkers(item),
    ),
  );
}

export function collectPerspectiveMemoryLocalReviewQueueItemUnsafeMarkers(
  item: PerspectiveMemoryLocalReviewQueueItemV0,
) {
  const serialized = JSON.stringify(item);
  return unsafeQueueItemMarkers.filter((marker) =>
    serialized.includes(marker),
  );
}

function collectPerspectiveMemoryQueueEligibilityBlockedReasons({
  draft,
  sourceDraftCurrentStatus,
}: BuildPerspectiveMemoryLocalReviewQueueItemInput) {
  const blockedReasons: string[] = [];
  if (
    draft.local_status !== "draft_candidate" &&
    draft.local_status !== "supersedes_previous_candidate"
  ) {
    blockedReasons.push(
      "only draft_candidate or supersedes_previous_candidate can be queued for memory review",
    );
  }
  if (
    draft.candidate_action !== "accept_as_perspective_candidate" &&
    draft.candidate_action !== "supersede_previous_candidate"
  ) {
    blockedReasons.push(
      "rejected_memory_candidate is not queue-eligible for memory write review",
    );
  }
  if (
    draft.validation_result_state !== "PASS" &&
    draft.validation_result_state !== "PASS with follow-up"
  ) {
    blockedReasons.push("queue item requires PASS or PASS with follow-up");
  }
  if (draft.validation_source !== "real_local_validate_execution") {
    blockedReasons.push("queue item requires real_local_validate_execution");
  }
  if (sourceDraftCurrentStatus === "stale_local_candidate_draft") {
    blockedReasons.push(
      "selected candidate draft is stale against current validation",
    );
  }
  if (sourceDraftCurrentStatus === "no_current_validation") {
    blockedReasons.push(
      "selected candidate draft requires current real local validation before queueing",
    );
  }
  if (draft.authority_boundary.local_draft_only !== true) {
    blockedReasons.push("source candidate draft must be local draft only");
  }
  for (const [field, value] of Object.entries(draft.authority_boundary)) {
    if (field === "local_draft_only") continue;
    if (value !== false) {
      blockedReasons.push(`source candidate authority flag must be false: ${field}`);
    }
  }
  return uniqueStrings(blockedReasons);
}

function buildPerspectiveMemoryCandidatePreviewFromDraft(
  draft: CodexFormerLocalAdapterAcceptedCandidateDraftV0,
): PerspectiveMemoryCandidatePreviewV0 {
  return {
    preview_version: PERSPECTIVE_MEMORY_CANDIDATE_PREVIEW_VERSION,
    title: buildPreviewTitle(draft),
    summary: boundText(
      draft.review_summary ||
        "No bounded review summary captured in local candidate draft.",
      700,
    ),
    supporting_refs: uniqueStrings(
      [
        ...draft.source_pr_refs,
        draft.source_input_ref,
        draft.prepare_summary_ref,
      ].filter(Boolean),
    ).slice(0, 12),
    risk_notes: buildRiskNotes(draft),
    unresolved_tensions:
      draft.validation_result_state === "PASS with follow-up"
        ? ["PASS with follow-up requires review before memory persistence."]
        : ["not captured in local queue item"],
    next_review_action:
      "Review before any perspective-memory persistence decision",
  };
}

function buildPreviewTitle(
  draft: CodexFormerLocalAdapterAcceptedCandidateDraftV0,
) {
  const firstSentence =
    draft.review_summary
      .split(/[.!?]\s/)
      .map((part) => part.trim())
      .find(Boolean) ?? "";
  return boundText(
    firstSentence || `Perspective candidate from ${shortRef(draft.source_input_ref)}`,
    120,
  );
}

function buildRiskNotes(
  draft: CodexFormerLocalAdapterAcceptedCandidateDraftV0,
) {
  const notes = [
    `${draft.warnings.length} validation warnings`,
    `${draft.pointer_warnings.length} pointer warnings`,
  ];
  if (draft.validation_result_state === "PASS with follow-up") {
    notes.push("PASS with follow-up caveat must be reviewed locally");
  }
  if (draft.changed_files_count > 0) {
    notes.push(`${draft.changed_files_count} changed files in source context`);
  }
  return notes.map((note) => boundText(note, 180));
}

function normalizePerspectiveMemoryLocalReviewQueue(
  queue: PerspectiveMemoryLocalReviewQueueV0,
  updatedAt: string,
): PerspectiveMemoryLocalReviewQueueV0 {
  const dedupedItems = new Map<
    string,
    PerspectiveMemoryLocalReviewQueueItemV0
  >();
  for (const item of queue.items) {
    if (collectPerspectiveMemoryLocalReviewQueueItemUnsafeMarkers(item).length > 0) {
      continue;
    }
    if (!dedupedItems.has(item.queue_item_id)) {
      dedupedItems.set(item.queue_item_id, item);
    }
  }
  return {
    queue_version: PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION,
    updated_at: updatedAt,
    items: Array.from(dedupedItems.values())
      .sort((left, right) =>
        itemSortValue(right).localeCompare(itemSortValue(left)),
      )
      .slice(0, PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_MAX_ITEMS),
  };
}

function isPerspectiveMemoryLocalReviewQueueItem(
  value: unknown,
): value is PerspectiveMemoryLocalReviewQueueItemV0 {
  if (!isRecord(value)) return false;
  const shapeIsValid =
    value.item_version === PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ITEM_VERSION &&
    hasText(value.queue_item_id) &&
    hasText(value.created_at) &&
    hasText(value.updated_at) &&
    value.source === "codex_former_local_adapter_operator_flow" &&
    hasText(value.source_candidate_draft_id) &&
    isCandidateLocalStatus(value.source_candidate_local_status) &&
    isCandidateAction(value.source_candidate_action) &&
    isValidationResultState(value.source_validation_result_state) &&
    hasText(value.source_validation_summary_hash) &&
    hasText(value.source_input_ref) &&
    hasText(value.source_input_hash) &&
    hasText(value.prepare_summary_ref) &&
    hasText(value.prepare_execution_summary_hash) &&
    hasText(value.returned_envelope_hash) &&
    typeof value.warning_count === "number" &&
    typeof value.pointer_warning_count === "number" &&
    Array.isArray(value.source_pr_refs) &&
    typeof value.changed_files_count === "number" &&
    hasText(value.review_summary) &&
    isMemoryCandidatePreview(value.memory_candidate_preview) &&
    isQueueStatus(value.queue_status) &&
    isReviewOnlyActions(value.review_only_actions) &&
    isQueueSourceState(value.stale_state) &&
    isLocalQueueAuthorityBoundary(value.authority_boundary);
  return (
    shapeIsValid &&
    collectPerspectiveMemoryLocalReviewQueueItemUnsafeMarkers(
      value as PerspectiveMemoryLocalReviewQueueItemV0,
    ).length === 0
  );
}

function isMemoryCandidatePreview(
  value: unknown,
): value is PerspectiveMemoryCandidatePreviewV0 {
  return (
    isRecord(value) &&
    value.preview_version === PERSPECTIVE_MEMORY_CANDIDATE_PREVIEW_VERSION &&
    hasText(value.title) &&
    hasText(value.summary) &&
    Array.isArray(value.supporting_refs) &&
    Array.isArray(value.risk_notes) &&
    Array.isArray(value.unresolved_tensions) &&
    hasText(value.next_review_action)
  );
}

function isReviewOnlyActions(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.can_mark_reviewing === "boolean" &&
    typeof value.can_keep_for_later === "boolean" &&
    typeof value.can_remove_from_queue === "boolean" &&
    typeof value.can_return_to_candidate_drafts === "boolean" &&
    value.can_create_memory_write === false
  );
}

function isLocalQueueAuthorityBoundary(value: unknown) {
  return (
    isRecord(value) &&
    value.local_queue_only === true &&
    value.accepted_augnes_memory_created === false &&
    value.review_decision_created === false &&
    value.product_db_persistence === false &&
    value.core_decision_created === false &&
    value.runtime_handoff_created === false &&
    value.automatic_promotion === false
  );
}

function buildReviewOnlyActions():
  PerspectiveMemoryLocalReviewQueueItemV0["review_only_actions"] {
  return {
    can_mark_reviewing: true,
    can_keep_for_later: true,
    can_remove_from_queue: true,
    can_return_to_candidate_drafts: true,
    can_create_memory_write: false,
  };
}

function buildLocalQueueAuthorityBoundary():
  PerspectiveMemoryLocalReviewQueueItemV0["authority_boundary"] {
  return {
    local_queue_only: true,
    accepted_augnes_memory_created: false,
    review_decision_created: false,
    product_db_persistence: false,
    core_decision_created: false,
    runtime_handoff_created: false,
    automatic_promotion: false,
  };
}

function isCandidateLocalStatus(
  value: unknown,
): value is CodexFormerLocalAdapterAcceptedCandidateDraftLocalStatus {
  return (
    value === "draft_candidate" ||
    value === "rejected_memory_candidate" ||
    value === "supersedes_previous_candidate"
  );
}

function isCandidateAction(
  value: unknown,
): value is CodexFormerLocalAdapterAcceptedCandidateDraftAction {
  return (
    value === "accept_as_perspective_candidate" ||
    value === "reject_from_memory_candidate" ||
    value === "supersede_previous_candidate"
  );
}

function isValidationResultState(
  value: unknown,
): value is "PASS" | "PASS with follow-up" | "BLOCKED" {
  return (
    value === "PASS" ||
    value === "PASS with follow-up" ||
    value === "BLOCKED"
  );
}

function isQueueStatus(
  value: unknown,
): value is PerspectiveMemoryLocalReviewQueueStatus {
  return (
    value === "queued_for_memory_review" ||
    value === "reviewing_locally" ||
    value === "kept_for_later" ||
    value === "removed_from_queue" ||
    value === "returned_to_candidate_drafts"
  );
}

function isQueueSourceState(
  value: unknown,
): value is PerspectiveMemoryLocalReviewQueueSourceState {
  return (
    value === "current_with_source_candidate_draft" ||
    value === "source_candidate_draft_stale" ||
    value === "source_candidate_draft_missing" ||
    value === "not_checked"
  );
}

function itemSortValue(item: PerspectiveMemoryLocalReviewQueueItemV0) {
  return item.updated_at || item.created_at || "";
}

function boundedStrings(values: string[]) {
  return values.map((value) => boundText(value, 1000));
}

function boundText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

function shortRef(ref: string) {
  return ref.split("/").filter(Boolean).at(-1) ?? ref;
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

const unsafeQueueItemMarkers = [
  "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET",
  "RETURNED_CODEX_RESPONSE",
  "END RETURNED_CODEX_RESPONSE",
  "draft_version: codex_perspective_candidate_draft.v0.1",
  "\"draft_version\":\"codex_perspective_candidate_draft.v0.1\"",
  "\"draft_version\": \"codex_perspective_candidate_draft.v0.1\"",
  "BEGIN_HIDDEN_REASONING",
  "HIDDEN_REASONING:",
  "PROVIDER_LOG:",
  "PROVIDER_LOGS:",
  "TOKEN=",
  "sk-",
  "raw_source_packet:",
  "raw_prompt",
  "raw_candidate",
  "browser_dump",
  "raw_diff",
  "raw_review_payload",
];
