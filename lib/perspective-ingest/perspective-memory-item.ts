import type {
  PerspectiveMemoryProductPersistenceBoundaryRecordV0,
} from "@/lib/perspective-ingest/perspective-memory-product-persistence-boundary";

export const PERSPECTIVE_MEMORY_ITEM_VERSION =
  "perspective_memory_item.v0.1";
export const PERSPECTIVE_MEMORY_ITEM_CONTENT_VERSION =
  "perspective_memory_item_content.v0.1";
export const PERSPECTIVE_MEMORY_ITEM_LIST_VERSION =
  "perspective_memory_item_list.v0.1";
export const PERSPECTIVE_MEMORY_ITEM_API_ROUTE =
  "/api/perspective/memory/items";
export const PERSPECTIVE_MEMORY_ITEMS_ROUTE =
  "/cockpit/perspective/memory-items";
export const PERSPECTIVE_MEMORY_ITEM_STORE_BACKEND = "sqlite:lib/db.ts";
export const PERSPECTIVE_MEMORY_ITEM_MAX_ITEMS = 100;

export const PERSPECTIVE_MEMORY_ITEM_STATUSES = [
  "accepted",
  "reviewing",
  "retracted",
  "superseded",
  "deprecated",
] as const;

export const PERSPECTIVE_MEMORY_ITEM_MEMORY_KINDS = [
  "perspective_candidate",
] as const;

export type PerspectiveMemoryItemStatus =
  (typeof PERSPECTIVE_MEMORY_ITEM_STATUSES)[number];

export type PerspectiveMemoryItemKind =
  (typeof PERSPECTIVE_MEMORY_ITEM_MEMORY_KINDS)[number];

export type PerspectiveMemoryItemUserConfirmation = {
  user_confirmed_create_persisted_perspective_memory_item?: boolean;
  user_confirmed_not_core_decision?: boolean;
  user_confirmed_no_automatic_runtime_injection?: boolean;
  user_confirmed_source_boundary_record_preserved?: boolean;
};

export type PerspectiveMemoryItemContentV0 = {
  content_version: typeof PERSPECTIVE_MEMORY_ITEM_CONTENT_VERSION;
  title: string;
  summary: string;
  source_refs: string[];
  evidence_refs: string[];
  risk_notes: string[];
  unresolved_tensions: string[];
  carry_forward_questions: string[];
  suggested_next_review_action: string;
};

export type PerspectiveMemoryItemV0 = {
  item_version: typeof PERSPECTIVE_MEMORY_ITEM_VERSION;
  item_id: string;
  created_at: string;
  updated_at: string;
  source: "product_persistence_boundary_record";
  source_boundary_record_id: string;
  source_checklist_id: string;
  source_proposal_id: string;
  source_queue_item_id: string;
  source_candidate_draft_id: string;
  source_validation_result_state: "PASS" | "PASS with follow-up";
  source_validation_summary_hash: string;
  source_input_ref: string;
  source_input_hash: string;
  prepare_summary_ref: string;
  prepare_execution_summary_hash: string;
  returned_envelope_hash: string;
  source_proposal_hash: string;
  memory_kind: PerspectiveMemoryItemKind;
  item_status: PerspectiveMemoryItemStatus;
  content: PerspectiveMemoryItemContentV0;
  acceptance: {
    accepted_at: string;
    acceptance_label: "Create persisted perspective-memory item";
    user_confirmed_create_persisted_perspective_memory_item: true;
    user_confirmed_not_core_decision: true;
    user_confirmed_no_automatic_runtime_injection: true;
    user_confirmed_source_boundary_record_preserved: true;
  };
  source_boundary_snapshot: {
    boundary_status_at_creation: string;
    checklist_ready_for_product_persistence_review: true;
    checklist_ready_for_memory_write_now: false;
    proposed_memory_payload_should_write_to_memory_now: false;
    user_confirmation_from_boundary_record: PerspectiveMemoryProductPersistenceBoundaryRecordV0["user_confirmation"];
    checklist_gate_summary: PerspectiveMemoryProductPersistenceBoundaryRecordV0["checklist_gate_summary"];
    proposal_diff_summary: PerspectiveMemoryProductPersistenceBoundaryRecordV0["proposal_diff_summary"];
  };
  availability: {
    visible_in_perspective_memory_items: true;
    eligible_for_manual_review: true;
    eligible_for_future_retrieval_surfaces: true;
    eligible_for_future_synthesis_surfaces: true;
    automatic_runtime_injection_enabled: false;
    core_memory_enabled: false;
  };
  authority_boundary: {
    perspective_memory_item_created: true;
    accepted_product_memory_item_created: true;
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

export type PerspectiveMemoryItemListV0 = {
  item_list_version: typeof PERSPECTIVE_MEMORY_ITEM_LIST_VERSION;
  updated_at: string;
  items: PerspectiveMemoryItemV0[];
};

export type PerspectiveMemoryItemCreateInput = {
  nowIso: string;
  itemId: string;
  boundaryRecord: PerspectiveMemoryProductPersistenceBoundaryRecordV0;
  userConfirmation: PerspectiveMemoryItemUserConfirmation;
};

export type PerspectiveMemoryItemCreateResult =
  | {
      ok: true;
      item: PerspectiveMemoryItemV0;
    }
  | {
      ok: false;
      blocked_reasons: string[];
    };

export type PerspectiveMemoryItemFilter = {
  itemStatus?: PerspectiveMemoryItemStatus | null;
  memoryKind?: PerspectiveMemoryItemKind | null;
  sourceBoundaryRecordId?: string | null;
  sourceValidationResultState?: "PASS" | "PASS with follow-up" | null;
  limit?: number | null;
};

export function buildPerspectiveMemoryItemFromBoundaryRecord(
  input: PerspectiveMemoryItemCreateInput,
): PerspectiveMemoryItemCreateResult {
  const blockedReasons = collectPerspectiveMemoryItemBlockedReasons(input);
  if (blockedReasons.length > 0) {
    return { ok: false, blocked_reasons: blockedReasons };
  }

  const payload = input.boundaryRecord.proposed_memory_payload;
  const item: PerspectiveMemoryItemV0 = {
    item_version: PERSPECTIVE_MEMORY_ITEM_VERSION,
    item_id: boundText(input.itemId, 160),
    created_at: input.nowIso,
    updated_at: input.nowIso,
    source: "product_persistence_boundary_record",
    source_boundary_record_id: input.boundaryRecord.record_id,
    source_checklist_id: input.boundaryRecord.source_checklist_id,
    source_proposal_id: input.boundaryRecord.source_proposal_id,
    source_queue_item_id: input.boundaryRecord.source_queue_item_id,
    source_candidate_draft_id: input.boundaryRecord.source_candidate_draft_id,
    source_validation_result_state:
      input.boundaryRecord.source_validation_result_state,
    source_validation_summary_hash:
      input.boundaryRecord.source_validation_summary_hash,
    source_input_ref: input.boundaryRecord.source_input_ref,
    source_input_hash: input.boundaryRecord.source_input_hash,
    prepare_summary_ref: input.boundaryRecord.prepare_summary_ref,
    prepare_execution_summary_hash:
      input.boundaryRecord.prepare_execution_summary_hash,
    returned_envelope_hash: input.boundaryRecord.returned_envelope_hash,
    source_proposal_hash: input.boundaryRecord.source_proposal_hash,
    memory_kind: "perspective_candidate",
    item_status: "accepted",
    content: {
      content_version: PERSPECTIVE_MEMORY_ITEM_CONTENT_VERSION,
      title: boundText(payload.title, 180),
      summary: boundText(payload.summary, 1200),
      source_refs: boundedStrings(payload.source_refs, 40, 240),
      evidence_refs: boundedStrings(payload.evidence_refs, 40, 240),
      risk_notes: boundedStrings(payload.risk_notes, 20, 300),
      unresolved_tensions: boundedStrings(payload.unresolved_tensions, 20, 300),
      carry_forward_questions: boundedStrings(
        payload.carry_forward_questions,
        20,
        300,
      ),
      suggested_next_review_action: boundText(
        payload.suggested_next_review_action,
        240,
      ),
    },
    acceptance: {
      accepted_at: input.nowIso,
      acceptance_label: "Create persisted perspective-memory item",
      user_confirmed_create_persisted_perspective_memory_item: true,
      user_confirmed_not_core_decision: true,
      user_confirmed_no_automatic_runtime_injection: true,
      user_confirmed_source_boundary_record_preserved: true,
    },
    source_boundary_snapshot: {
      boundary_status_at_creation: input.boundaryRecord.boundary_status,
      checklist_ready_for_product_persistence_review: true,
      checklist_ready_for_memory_write_now: false,
      proposed_memory_payload_should_write_to_memory_now: false,
      user_confirmation_from_boundary_record:
        input.boundaryRecord.user_confirmation,
      checklist_gate_summary: input.boundaryRecord.checklist_gate_summary,
      proposal_diff_summary: sanitizeProposalDiffSummary(
        input.boundaryRecord.proposal_diff_summary,
      ),
    },
    availability: buildAvailability(),
    authority_boundary: buildAuthorityBoundary(),
  };

  const unsafeMarkers = collectPerspectiveMemoryItemUnsafeMarkers(item);
  if (unsafeMarkers.length > 0) {
    return {
      ok: false,
      blocked_reasons: unsafeMarkers.map(
        (marker) => `perspective-memory item contains unsafe marker: ${marker}`,
      ),
    };
  }

  return { ok: true, item };
}

export function canBuildPerspectiveMemoryItemFromBoundaryRecord(
  input: Omit<PerspectiveMemoryItemCreateInput, "nowIso" | "itemId">,
) {
  const blockedReasons = collectPerspectiveMemoryItemBlockedReasons({
    ...input,
    nowIso: "1970-01-01T00:00:00.000Z",
    itemId: "eligibility-check",
  });
  return {
    eligible: blockedReasons.length === 0,
    blocked_reasons: blockedReasons,
  };
}

export function updatePerspectiveMemoryItemStatus(
  item: PerspectiveMemoryItemV0,
  itemStatus: PerspectiveMemoryItemStatus,
  nowIso: string,
): PerspectiveMemoryItemV0 {
  return {
    ...item,
    item_status: itemStatus,
    updated_at: nowIso,
    availability: buildAvailability(),
    authority_boundary: buildAuthorityBoundary(),
  };
}

export function createEmptyPerspectiveMemoryItemList(
  nowIso: string,
): PerspectiveMemoryItemListV0 {
  return {
    item_list_version: PERSPECTIVE_MEMORY_ITEM_LIST_VERSION,
    updated_at: nowIso,
    items: [],
  };
}

export function normalizePerspectiveMemoryItemList(
  list: PerspectiveMemoryItemListV0,
  updatedAt: string,
): PerspectiveMemoryItemListV0 {
  const deduped = new Map<string, PerspectiveMemoryItemV0>();
  for (const item of list.items) {
    if (isPerspectiveMemoryItem(item) && !deduped.has(item.item_id)) {
      deduped.set(item.item_id, item);
    }
  }
  return {
    item_list_version: PERSPECTIVE_MEMORY_ITEM_LIST_VERSION,
    updated_at: updatedAt,
    items: Array.from(deduped.values())
      .sort((left, right) =>
        itemSortValue(right).localeCompare(itemSortValue(left)),
      )
      .slice(0, PERSPECTIVE_MEMORY_ITEM_MAX_ITEMS),
  };
}

export function filterPerspectiveMemoryItems(
  items: PerspectiveMemoryItemV0[],
  filter: PerspectiveMemoryItemFilter,
) {
  return items
    .filter((item) => {
      if (filter.itemStatus && item.item_status !== filter.itemStatus) {
        return false;
      }
      if (filter.memoryKind && item.memory_kind !== filter.memoryKind) {
        return false;
      }
      if (
        filter.sourceBoundaryRecordId &&
        item.source_boundary_record_id !== filter.sourceBoundaryRecordId
      ) {
        return false;
      }
      if (
        filter.sourceValidationResultState &&
        item.source_validation_result_state !== filter.sourceValidationResultState
      ) {
        return false;
      }
      return true;
    })
    .slice(0, normalizeLimit(filter.limit));
}

export function safeParsePerspectiveMemoryItem(
  serialized: string | null,
): PerspectiveMemoryItemV0 | null {
  if (!serialized) return null;
  try {
    const parsed = JSON.parse(serialized);
    return isPerspectiveMemoryItem(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function safeParsePerspectiveMemoryItemList(
  serialized: string | null,
  nowIso: string,
): PerspectiveMemoryItemListV0 {
  if (!serialized) return createEmptyPerspectiveMemoryItemList(nowIso);
  try {
    const parsed = JSON.parse(serialized);
    if (
      !isRecord(parsed) ||
      parsed.item_list_version !== PERSPECTIVE_MEMORY_ITEM_LIST_VERSION ||
      typeof parsed.updated_at !== "string" ||
      !Array.isArray(parsed.items)
    ) {
      return createEmptyPerspectiveMemoryItemList(nowIso);
    }
    return normalizePerspectiveMemoryItemList(
      {
        item_list_version: PERSPECTIVE_MEMORY_ITEM_LIST_VERSION,
        updated_at: parsed.updated_at,
        items: parsed.items.filter(isPerspectiveMemoryItem),
      },
      parsed.updated_at,
    );
  } catch {
    return createEmptyPerspectiveMemoryItemList(nowIso);
  }
}

export function isPerspectiveMemoryItemStatus(
  value: unknown,
): value is PerspectiveMemoryItemStatus {
  return PERSPECTIVE_MEMORY_ITEM_STATUSES.includes(
    value as PerspectiveMemoryItemStatus,
  );
}

export function isPerspectiveMemoryItemKind(
  value: unknown,
): value is PerspectiveMemoryItemKind {
  return PERSPECTIVE_MEMORY_ITEM_MEMORY_KINDS.includes(
    value as PerspectiveMemoryItemKind,
  );
}

export function collectPerspectiveMemoryItemUnsafeMarkers(value: unknown) {
  const serialized = JSON.stringify(value);
  return unsafeMemoryItemMarkers.filter((marker) => serialized.includes(marker));
}

function collectPerspectiveMemoryItemBlockedReasons(
  input: PerspectiveMemoryItemCreateInput,
) {
  const blockedReasons: string[] = [];
  if (!hasText(input.itemId)) blockedReasons.push("item_id is required");
  if (!input.boundaryRecord) {
    blockedReasons.push("source boundary record is required");
    return blockedReasons;
  }
  const unsafeBoundaryMarkers = collectPerspectiveMemoryItemUnsafeMarkers(
    input.boundaryRecord,
  );
  for (const marker of unsafeBoundaryMarkers) {
    blockedReasons.push(`source boundary record contains unsafe marker: ${marker}`);
  }
  if (
    input.boundaryRecord.boundary_status !==
      "product_persistence_boundary_recorded" &&
    input.boundaryRecord.boundary_status !== "locally_reviewing_boundary_record"
  ) {
    blockedReasons.push(
      "source boundary record must be recorded or locally_reviewing_boundary_record",
    );
  }
  if (input.boundaryRecord.boundary_status === "retracted_before_memory_write") {
    blockedReasons.push("retracted boundary records cannot create memory items");
  }
  if (
    input.boundaryRecord.checklist_ready_for_product_persistence_review !== true
  ) {
    blockedReasons.push(
      "source boundary checklist must be ready_for_product_persistence_review",
    );
  }
  if (input.boundaryRecord.checklist_ready_for_memory_write_now !== false) {
    blockedReasons.push("source boundary must keep ready_for_memory_write_now false");
  }
  if (
    input.boundaryRecord.proposed_memory_payload.should_write_to_memory_now !==
    false
  ) {
    blockedReasons.push("source boundary payload must keep should_write_to_memory_now false");
  }
  if (
    input.boundaryRecord.source_validation_result_state !== "PASS" &&
    input.boundaryRecord.source_validation_result_state !== "PASS with follow-up"
  ) {
    blockedReasons.push("source boundary validation result must be PASS or PASS with follow-up");
  }
  validateBoundaryAuthority(input.boundaryRecord, blockedReasons);
  validateBoundaryNextAllowedActions(input.boundaryRecord, blockedReasons);
  validateConfirmation(input.userConfirmation, blockedReasons);
  return uniqueStrings(blockedReasons);
}

function validateBoundaryAuthority(
  boundaryRecord: PerspectiveMemoryProductPersistenceBoundaryRecordV0,
  blockedReasons: string[],
) {
  const authority = boundaryRecord.authority_boundary;
  if (authority.product_persistence_boundary_record_created !== true) {
    blockedReasons.push("source boundary record must have product boundary created");
  }
  if (authority.accepted_augnes_memory_created !== false) {
    blockedReasons.push("source boundary must not have accepted Augnes memory");
  }
  if (authority.product_memory_write_created !== false) {
    blockedReasons.push("source boundary must not have product memory write");
  }
  if (authority.review_decision_created !== false) {
    blockedReasons.push("source boundary must not have review decision");
  }
  if (authority.core_decision_created !== false) {
    blockedReasons.push("source boundary must not have Core decision");
  }
  if (authority.runtime_handoff_created !== false) {
    blockedReasons.push("source boundary must not have runtime handoff");
  }
  if (authority.automatic_promotion !== false) {
    blockedReasons.push("source boundary must not have automatic promotion");
  }
}

function validateBoundaryNextAllowedActions(
  boundaryRecord: PerspectiveMemoryProductPersistenceBoundaryRecordV0,
  blockedReasons: string[],
) {
  const actions = boundaryRecord.next_allowed_actions;
  if (actions.can_create_accepted_memory !== false) {
    blockedReasons.push("source boundary can_create_accepted_memory must remain false");
  }
  if (actions.can_create_core_decision !== false) {
    blockedReasons.push("source boundary can_create_core_decision must remain false");
  }
  if (actions.can_auto_promote !== false) {
    blockedReasons.push("source boundary can_auto_promote must remain false");
  }
}

function validateConfirmation(
  confirmation: PerspectiveMemoryItemUserConfirmation,
  blockedReasons: string[],
) {
  if (
    confirmation.user_confirmed_create_persisted_perspective_memory_item !== true
  ) {
    blockedReasons.push(
      "user must confirm creation of a persisted perspective-memory item",
    );
  }
  if (confirmation.user_confirmed_not_core_decision !== true) {
    blockedReasons.push("user must confirm this is not a Core decision");
  }
  if (
    confirmation.user_confirmed_no_automatic_runtime_injection !== true
  ) {
    blockedReasons.push(
      "user must confirm no automatic runtime context injection",
    );
  }
  if (confirmation.user_confirmed_source_boundary_record_preserved !== true) {
    blockedReasons.push("user must confirm the source boundary record is preserved");
  }
}

function sanitizeProposalDiffSummary(
  diffSummary: PerspectiveMemoryProductPersistenceBoundaryRecordV0["proposal_diff_summary"],
): PerspectiveMemoryProductPersistenceBoundaryRecordV0["proposal_diff_summary"] {
  return {
    included_from_queue_item: boundedStrings(diffSummary.included_from_queue_item),
    excluded_from_queue_item: boundedStrings(diffSummary.excluded_from_queue_item),
    excluded_raw_material: diffSummary.excluded_raw_material.map(
      () => "excluded raw material category redacted",
    ),
    authority_boundary_notes: boundedStrings(diffSummary.authority_boundary_notes),
  };
}

function buildAvailability(): PerspectiveMemoryItemV0["availability"] {
  return {
    visible_in_perspective_memory_items: true,
    eligible_for_manual_review: true,
    eligible_for_future_retrieval_surfaces: true,
    eligible_for_future_synthesis_surfaces: true,
    automatic_runtime_injection_enabled: false,
    core_memory_enabled: false,
  };
}

function buildAuthorityBoundary(): PerspectiveMemoryItemV0["authority_boundary"] {
  return {
    perspective_memory_item_created: true,
    accepted_product_memory_item_created: true,
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

function isPerspectiveMemoryItem(value: unknown): value is PerspectiveMemoryItemV0 {
  if (!isRecord(value)) return false;
  const item = value as PerspectiveMemoryItemV0;
  if (collectPerspectiveMemoryItemUnsafeMarkers(item).length > 0) {
    return false;
  }
  return (
    item.item_version === PERSPECTIVE_MEMORY_ITEM_VERSION &&
    typeof item.item_id === "string" &&
    typeof item.created_at === "string" &&
    typeof item.updated_at === "string" &&
    item.source === "product_persistence_boundary_record" &&
    typeof item.source_boundary_record_id === "string" &&
    typeof item.source_checklist_id === "string" &&
    typeof item.source_proposal_id === "string" &&
    typeof item.source_queue_item_id === "string" &&
    typeof item.source_candidate_draft_id === "string" &&
    (item.source_validation_result_state === "PASS" ||
      item.source_validation_result_state === "PASS with follow-up") &&
    typeof item.source_validation_summary_hash === "string" &&
    typeof item.source_input_ref === "string" &&
    typeof item.source_input_hash === "string" &&
    typeof item.prepare_summary_ref === "string" &&
    typeof item.prepare_execution_summary_hash === "string" &&
    typeof item.returned_envelope_hash === "string" &&
    typeof item.source_proposal_hash === "string" &&
    item.memory_kind === "perspective_candidate" &&
    isPerspectiveMemoryItemStatus(item.item_status) &&
    isItemContent(item.content) &&
    isItemAcceptance(item.acceptance) &&
    isSourceBoundarySnapshot(item.source_boundary_snapshot) &&
    isAvailability(item.availability) &&
    isItemAuthorityBoundary(item.authority_boundary)
  );
}

function isItemContent(value: unknown): value is PerspectiveMemoryItemV0["content"] {
  if (!isRecord(value)) return false;
  return (
    value.content_version === PERSPECTIVE_MEMORY_ITEM_CONTENT_VERSION &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    isStringArray(value.source_refs) &&
    isStringArray(value.evidence_refs) &&
    isStringArray(value.risk_notes) &&
    isStringArray(value.unresolved_tensions) &&
    isStringArray(value.carry_forward_questions) &&
    typeof value.suggested_next_review_action === "string"
  );
}

function isItemAcceptance(
  value: unknown,
): value is PerspectiveMemoryItemV0["acceptance"] {
  if (!isRecord(value)) return false;
  return (
    typeof value.accepted_at === "string" &&
    value.acceptance_label === "Create persisted perspective-memory item" &&
    value.user_confirmed_create_persisted_perspective_memory_item === true &&
    value.user_confirmed_not_core_decision === true &&
    value.user_confirmed_no_automatic_runtime_injection === true &&
    value.user_confirmed_source_boundary_record_preserved === true
  );
}

function isSourceBoundarySnapshot(
  value: unknown,
): value is PerspectiveMemoryItemV0["source_boundary_snapshot"] {
  if (!isRecord(value)) return false;
  return (
    typeof value.boundary_status_at_creation === "string" &&
    value.checklist_ready_for_product_persistence_review === true &&
    value.checklist_ready_for_memory_write_now === false &&
    value.proposed_memory_payload_should_write_to_memory_now === false &&
    isRecord(value.user_confirmation_from_boundary_record) &&
    isRecord(value.checklist_gate_summary) &&
    isRecord(value.proposal_diff_summary)
  );
}

function isAvailability(
  value: unknown,
): value is PerspectiveMemoryItemV0["availability"] {
  if (!isRecord(value)) return false;
  return (
    value.visible_in_perspective_memory_items === true &&
    value.eligible_for_manual_review === true &&
    value.eligible_for_future_retrieval_surfaces === true &&
    value.eligible_for_future_synthesis_surfaces === true &&
    value.automatic_runtime_injection_enabled === false &&
    value.core_memory_enabled === false
  );
}

function isItemAuthorityBoundary(
  value: unknown,
): value is PerspectiveMemoryItemV0["authority_boundary"] {
  if (!isRecord(value)) return false;
  return (
    value.perspective_memory_item_created === true &&
    value.accepted_product_memory_item_created === true &&
    value.core_decision_created === false &&
    value.core_memory_created === false &&
    value.state_entry_created === false &&
    value.runtime_handoff_created === false &&
    value.automatic_runtime_injection_created === false &&
    value.automatic_promotion_created === false &&
    value.provider_model_call_created === false &&
    value.github_mutation_created === false
  );
}

function boundedStrings(values: string[], maxItems = 40, maxLength = 240) {
  return values
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .map((value) => boundText(value, maxLength))
    .slice(0, maxItems);
}

function boundText(value: string, maxLength: number) {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength - 1).trimEnd();
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeLimit(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return PERSPECTIVE_MEMORY_ITEM_MAX_ITEMS;
  return Math.max(1, Math.min(Math.trunc(value), PERSPECTIVE_MEMORY_ITEM_MAX_ITEMS));
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}

function itemSortValue(item: PerspectiveMemoryItemV0) {
  return item.updated_at || item.created_at || "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

const unsafeMemoryItemMarkers = [
  "RETURNED_CODEX_RESPONSE",
  "raw_returned_envelope",
  "raw returned envelope text",
  "raw prompt",
  "raw_prompt",
  "raw source packet",
  "raw_source_packet",
  "raw candidate payload",
  "raw_candidate_payload",
  "raw_candidate",
  "provider_log",
  "hidden_reasoning",
  "TOKEN=",
  "OPENAI_API_KEY",
  "browser_dump",
  "raw_diff",
  "raw diffs",
  "private_key",
  "secret_key",
  "BEGIN PRIVATE KEY",
  "sk-",
  "Codex SDK",
  "github.rest",
  "new Octokit",
];

export default {
  PERSPECTIVE_MEMORY_ITEM_API_ROUTE,
  PERSPECTIVE_MEMORY_ITEM_CONTENT_VERSION,
  PERSPECTIVE_MEMORY_ITEM_LIST_VERSION,
  PERSPECTIVE_MEMORY_ITEM_MEMORY_KINDS,
  PERSPECTIVE_MEMORY_ITEM_STATUSES,
  PERSPECTIVE_MEMORY_ITEM_STORE_BACKEND,
  PERSPECTIVE_MEMORY_ITEM_VERSION,
  PERSPECTIVE_MEMORY_ITEMS_ROUTE,
  buildPerspectiveMemoryItemFromBoundaryRecord,
  canBuildPerspectiveMemoryItemFromBoundaryRecord,
  collectPerspectiveMemoryItemUnsafeMarkers,
  createEmptyPerspectiveMemoryItemList,
  filterPerspectiveMemoryItems,
  isPerspectiveMemoryItemKind,
  isPerspectiveMemoryItemStatus,
  normalizePerspectiveMemoryItemList,
  safeParsePerspectiveMemoryItem,
  safeParsePerspectiveMemoryItemList,
  updatePerspectiveMemoryItemStatus,
};
