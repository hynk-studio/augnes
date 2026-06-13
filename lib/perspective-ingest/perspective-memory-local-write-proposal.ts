import type {
  OperatorFlowStorage,
} from "@/lib/perspective-ingest/codex-former-local-adapter-operator-flow";
import type {
  PerspectiveMemoryLocalReviewQueueItemV0,
  PerspectiveMemoryLocalReviewQueueSourceState,
  PerspectiveMemoryLocalReviewQueueV0,
} from "@/lib/perspective-ingest/perspective-memory-local-review-queue";

export const PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE =
  "augnes.perspectiveMemory.localWriteProposals.v0.1";
export const PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_LIST_VERSION =
  "perspective_memory_local_write_proposal_list.v0.1";
export const PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_VERSION =
  "perspective_memory_local_write_proposal.v0.1";
export const PERSPECTIVE_MEMORY_CANDIDATE_WRITE_PAYLOAD_VERSION =
  "perspective_memory_candidate_write_payload.v0.1";
export const PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_MAX_ITEMS = 50;

export type PerspectiveMemoryLocalWriteProposalStatus =
  | "draft_write_proposal"
  | "reviewing_write_proposal"
  | "kept_for_later"
  | "rejected_locally"
  | "superseded_locally";

export type PerspectiveMemoryLocalWriteProposalSourceState =
  | "source_queue_item_current"
  | "source_queue_item_status_changed"
  | "source_queue_item_missing"
  | "source_queue_item_removed"
  | "not_checked";

export type PerspectiveMemoryCandidateWritePayloadV0 = {
  payload_version: typeof PERSPECTIVE_MEMORY_CANDIDATE_WRITE_PAYLOAD_VERSION;
  title: string;
  summary: string;
  memory_kind: "perspective_candidate";
  source_refs: string[];
  evidence_refs: string[];
  risk_notes: string[];
  unresolved_tensions: string[];
  carry_forward_questions: string[];
  suggested_next_review_action: string;
  should_write_to_memory_now: false;
};

export type PerspectiveMemoryLocalWriteProposalV0 = {
  proposal_version: typeof PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_VERSION;
  proposal_id: string;
  created_at: string;
  updated_at: string;
  source: "perspective_memory_local_review_queue";
  source_queue_item_id: string;
  source_candidate_draft_id: string;
  source_validation_result_state: "PASS" | "PASS with follow-up";
  source_validation_summary_hash: string;
  source_input_ref: string;
  source_input_hash: string;
  prepare_summary_ref: string;
  prepare_execution_summary_hash: string;
  returned_envelope_hash: string;
  queue_item_status_at_creation: string;
  queue_source_state_at_creation: PerspectiveMemoryLocalReviewQueueSourceState;
  proposal_status: PerspectiveMemoryLocalWriteProposalStatus;
  proposed_memory_payload: PerspectiveMemoryCandidateWritePayloadV0;
  proposal_diff_summary: {
    included_from_queue_item: string[];
    excluded_from_queue_item: string[];
    excluded_raw_material: string[];
    authority_boundary_notes: string[];
  };
  warning_count: number;
  pointer_warning_count: number;
  review_notes: string;
  authority_boundary: {
    local_write_proposal_only: true;
    accepted_augnes_memory_created: false;
    product_db_persistence: false;
    review_decision_created: false;
    core_decision_created: false;
    runtime_handoff_created: false;
    automatic_promotion: false;
  };
};

export type PerspectiveMemoryLocalWriteProposalListV0 = {
  proposal_list_version: typeof PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_LIST_VERSION;
  updated_at: string;
  proposals: PerspectiveMemoryLocalWriteProposalV0[];
};

export type BuildPerspectiveMemoryLocalWriteProposalInput = {
  nowIso: string;
  proposalId: string;
  queueItem: PerspectiveMemoryLocalReviewQueueItemV0;
  queueSourceState: PerspectiveMemoryLocalReviewQueueSourceState;
  reviewNotes?: string;
};

export type BuildPerspectiveMemoryLocalWriteProposalResult =
  | {
      ok: true;
      proposal: PerspectiveMemoryLocalWriteProposalV0;
    }
  | {
      ok: false;
      blocked_reasons: string[];
    };

export function createEmptyPerspectiveMemoryLocalWriteProposalList(
  nowIso: string,
): PerspectiveMemoryLocalWriteProposalListV0 {
  return {
    proposal_list_version: PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_LIST_VERSION,
    updated_at: nowIso,
    proposals: [],
  };
}

export function buildPerspectiveMemoryLocalWriteProposalFromQueueItem(
  input: BuildPerspectiveMemoryLocalWriteProposalInput,
): BuildPerspectiveMemoryLocalWriteProposalResult {
  const blockedReasons =
    collectPerspectiveMemoryLocalWriteProposalBlockedReasons(input);
  if (blockedReasons.length > 0) {
    return { ok: false, blocked_reasons: blockedReasons };
  }
  const sourceValidationResultState =
    input.queueItem.source_validation_result_state === "PASS with follow-up"
      ? "PASS with follow-up"
      : "PASS";

  const proposal: PerspectiveMemoryLocalWriteProposalV0 = {
    proposal_version: PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_VERSION,
    proposal_id: input.proposalId,
    created_at: input.nowIso,
    updated_at: input.nowIso,
    source: "perspective_memory_local_review_queue",
    source_queue_item_id: input.queueItem.queue_item_id,
    source_candidate_draft_id: input.queueItem.source_candidate_draft_id,
    source_validation_result_state: sourceValidationResultState,
    source_validation_summary_hash:
      input.queueItem.source_validation_summary_hash,
    source_input_ref: input.queueItem.source_input_ref,
    source_input_hash: input.queueItem.source_input_hash,
    prepare_summary_ref: input.queueItem.prepare_summary_ref,
    prepare_execution_summary_hash:
      input.queueItem.prepare_execution_summary_hash,
    returned_envelope_hash: input.queueItem.returned_envelope_hash,
    queue_item_status_at_creation: input.queueItem.queue_status,
    queue_source_state_at_creation: input.queueSourceState,
    proposal_status: "draft_write_proposal",
    proposed_memory_payload:
      buildPerspectiveMemoryCandidateWritePayload(input.queueItem),
    proposal_diff_summary:
      buildPerspectiveMemoryLocalWriteProposalDiffSummary(input.queueItem),
    warning_count: input.queueItem.warning_count,
    pointer_warning_count: input.queueItem.pointer_warning_count,
    review_notes: boundText(input.reviewNotes ?? "", 1000),
    authority_boundary: buildLocalWriteProposalAuthorityBoundary(),
  };

  const unsafeMarkers =
    collectPerspectiveMemoryLocalWriteProposalUnsafeMarkers(proposal);
  if (unsafeMarkers.length > 0) {
    return {
      ok: false,
      blocked_reasons: unsafeMarkers.map(
        (marker) => `write proposal contains unsafe marker: ${marker}`,
      ),
    };
  }

  return { ok: true, proposal };
}

export function canBuildPerspectiveMemoryLocalWriteProposalFromQueueItem(
  input: Pick<
    BuildPerspectiveMemoryLocalWriteProposalInput,
    "queueItem" | "queueSourceState"
  >,
) {
  const blockedReasons =
    collectPerspectiveMemoryLocalWriteProposalBlockedReasons({
      ...input,
      nowIso: "1970-01-01T00:00:00.000Z",
      proposalId: "eligibility-check",
    });
  return {
    eligible: blockedReasons.length === 0,
    blocked_reasons: blockedReasons,
  };
}

export function loadPerspectiveMemoryLocalWriteProposalListFromStorage(
  storage: OperatorFlowStorage,
  nowIso: string,
) {
  return safeParsePerspectiveMemoryLocalWriteProposalList(
    storage.getItem(PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE),
    nowIso,
  );
}

export function savePerspectiveMemoryLocalWriteProposalListToStorage(
  storage: OperatorFlowStorage,
  list: PerspectiveMemoryLocalWriteProposalListV0,
) {
  storage.setItem(
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE,
    JSON.stringify(list),
  );
}

export function clearPerspectiveMemoryLocalWriteProposalListFromStorage(
  storage: OperatorFlowStorage,
) {
  storage.removeItem(PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE);
}

export function safeParsePerspectiveMemoryLocalWriteProposalList(
  serialized: string | null,
  nowIso: string,
): PerspectiveMemoryLocalWriteProposalListV0 {
  if (!serialized) {
    return createEmptyPerspectiveMemoryLocalWriteProposalList(nowIso);
  }
  try {
    const parsed = JSON.parse(serialized);
    if (
      !isRecord(parsed) ||
      parsed.proposal_list_version !==
        PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_LIST_VERSION ||
      typeof parsed.updated_at !== "string" ||
      !Array.isArray(parsed.proposals)
    ) {
      return createEmptyPerspectiveMemoryLocalWriteProposalList(nowIso);
    }
    const proposals = parsed.proposals
      .map((proposal) =>
        isPerspectiveMemoryLocalWriteProposal(proposal) ? proposal : null,
      )
      .filter(
        (
          proposal,
        ): proposal is PerspectiveMemoryLocalWriteProposalV0 =>
          proposal != null,
      );
    return normalizePerspectiveMemoryLocalWriteProposalList(
      {
        proposal_list_version:
          PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_LIST_VERSION,
        updated_at: parsed.updated_at,
        proposals,
      },
      parsed.updated_at,
    );
  } catch {
    return createEmptyPerspectiveMemoryLocalWriteProposalList(nowIso);
  }
}

export function appendPerspectiveMemoryLocalWriteProposalToList(
  list: PerspectiveMemoryLocalWriteProposalListV0,
  proposal: PerspectiveMemoryLocalWriteProposalV0,
  nowIso: string,
) {
  return normalizePerspectiveMemoryLocalWriteProposalList(
    {
      ...list,
      updated_at: nowIso,
      proposals: [proposal, ...list.proposals],
    },
    nowIso,
  );
}

export function updatePerspectiveMemoryLocalWriteProposalStatus(
  list: PerspectiveMemoryLocalWriteProposalListV0,
  proposalId: string,
  proposalStatus: PerspectiveMemoryLocalWriteProposalStatus,
  nowIso: string,
) {
  return normalizePerspectiveMemoryLocalWriteProposalList(
    {
      ...list,
      updated_at: nowIso,
      proposals: list.proposals.map((proposal) =>
        proposal.proposal_id === proposalId
          ? { ...proposal, proposal_status: proposalStatus, updated_at: nowIso }
          : proposal,
      ),
    },
    nowIso,
  );
}

export function removePerspectiveMemoryLocalWriteProposalFromList(
  list: PerspectiveMemoryLocalWriteProposalListV0,
  proposalId: string,
  nowIso: string,
) {
  return normalizePerspectiveMemoryLocalWriteProposalList(
    {
      ...list,
      updated_at: nowIso,
      proposals: list.proposals.filter(
        (proposal) => proposal.proposal_id !== proposalId,
      ),
    },
    nowIso,
  );
}

export function findPerspectiveMemoryLocalWriteProposalByQueueItem(
  list: PerspectiveMemoryLocalWriteProposalListV0,
  queueItemId: string,
) {
  return (
    list.proposals.find(
      (proposal) => proposal.source_queue_item_id === queueItemId,
    ) ?? null
  );
}

export function getPerspectiveMemoryLocalWriteProposalSourceState(
  proposal: PerspectiveMemoryLocalWriteProposalV0,
  queue: PerspectiveMemoryLocalReviewQueueV0,
): PerspectiveMemoryLocalWriteProposalSourceState {
  const sourceQueueItem =
    queue.items.find(
      (item) => item.queue_item_id === proposal.source_queue_item_id,
    ) ?? null;
  if (!sourceQueueItem) {
    return "source_queue_item_missing";
  }
  if (sourceQueueItem.queue_status === "removed_from_queue") {
    return "source_queue_item_removed";
  }
  if (sourceQueueItem.queue_status !== proposal.queue_item_status_at_creation) {
    return "source_queue_item_status_changed";
  }
  return "source_queue_item_current";
}

export function collectPerspectiveMemoryLocalWriteProposalListUnsafeMarkers(
  list: PerspectiveMemoryLocalWriteProposalListV0,
) {
  return uniqueStrings(
    list.proposals.flatMap((proposal) =>
      collectPerspectiveMemoryLocalWriteProposalUnsafeMarkers(proposal),
    ),
  );
}

export function collectPerspectiveMemoryLocalWriteProposalUnsafeMarkers(
  proposal: PerspectiveMemoryLocalWriteProposalV0,
) {
  const serialized = JSON.stringify(proposal);
  return unsafeWriteProposalMarkers.filter((marker) =>
    serialized.includes(marker),
  );
}

function collectPerspectiveMemoryLocalWriteProposalBlockedReasons({
  queueItem,
  queueSourceState,
}: BuildPerspectiveMemoryLocalWriteProposalInput) {
  const blockedReasons: string[] = [];
  if (
    queueItem.queue_status !== "queued_for_memory_review" &&
    queueItem.queue_status !== "reviewing_locally" &&
    queueItem.queue_status !== "kept_for_later"
  ) {
    blockedReasons.push(
      "write proposal requires queued_for_memory_review, reviewing_locally, or kept_for_later queue status",
    );
  }
  if (
    queueItem.source_validation_result_state !== "PASS" &&
    queueItem.source_validation_result_state !== "PASS with follow-up"
  ) {
    blockedReasons.push("write proposal requires PASS or PASS with follow-up");
  }
  if (
    queueItem.source_candidate_local_status !== "draft_candidate" &&
    queueItem.source_candidate_local_status !== "supersedes_previous_candidate"
  ) {
    blockedReasons.push(
      "write proposal requires draft_candidate or supersedes_previous_candidate",
    );
  }
  if (queueSourceState !== "current_with_source_candidate_draft") {
    blockedReasons.push(
      "write proposal requires current_with_source_candidate_draft source state",
    );
  }
  if (queueItem.review_only_actions.can_create_memory_write !== false) {
    blockedReasons.push("queue item can_create_memory_write must remain false");
  }
  if (queueItem.authority_boundary.local_queue_only !== true) {
    blockedReasons.push("queue item must remain local_queue_only");
  }
  for (const [field, value] of Object.entries(queueItem.authority_boundary)) {
    if (field === "local_queue_only") continue;
    if (value !== false) {
      blockedReasons.push(`queue authority flag must be false: ${field}`);
    }
  }
  return uniqueStrings(blockedReasons);
}

function buildPerspectiveMemoryCandidateWritePayload(
  queueItem: PerspectiveMemoryLocalReviewQueueItemV0,
): PerspectiveMemoryCandidateWritePayloadV0 {
  return {
    payload_version: PERSPECTIVE_MEMORY_CANDIDATE_WRITE_PAYLOAD_VERSION,
    title: boundText(queueItem.memory_candidate_preview.title, 180),
    summary: boundText(queueItem.memory_candidate_preview.summary, 1200),
    memory_kind: "perspective_candidate",
    source_refs: uniqueStrings(
      [
        ...queueItem.memory_candidate_preview.supporting_refs,
        queueItem.source_input_ref,
        queueItem.prepare_summary_ref,
      ].filter(Boolean),
    ).slice(0, 16),
    evidence_refs: uniqueStrings([
      `source_input_ref:${queueItem.source_input_ref}`,
      `source_input_hash:${queueItem.source_input_hash}`,
      `prepare_summary_ref:${queueItem.prepare_summary_ref}`,
      `prepare_execution_summary_hash:${queueItem.prepare_execution_summary_hash}`,
      `returned_envelope_hash:${queueItem.returned_envelope_hash}`,
      `validation_summary_hash:${queueItem.source_validation_summary_hash}`,
    ]),
    risk_notes: uniqueStrings([
      ...queueItem.memory_candidate_preview.risk_notes,
      `${queueItem.warning_count} validation warnings at proposal creation`,
      `${queueItem.pointer_warning_count} pointer warnings at proposal creation`,
      ...(queueItem.source_validation_result_state === "PASS with follow-up"
        ? ["PASS with follow-up requires another review before persistence."]
        : []),
    ]).map((note) => boundText(note, 240)),
    unresolved_tensions: boundedStrings(
      queueItem.memory_candidate_preview.unresolved_tensions,
      300,
    ),
    carry_forward_questions:
      buildPerspectiveMemoryWriteProposalCarryForwardQuestions(),
    suggested_next_review_action:
      "Review proposal before any product persistence or Core decision.",
    should_write_to_memory_now: false,
  };
}

function buildPerspectiveMemoryWriteProposalCarryForwardQuestions() {
  return [
    "Should this perspective candidate become durable memory?",
    "Does PASS with follow-up require another validation pass before persistence?",
    "Should this supersede an older memory item?",
  ];
}

function buildPerspectiveMemoryLocalWriteProposalDiffSummary(
  queueItem: PerspectiveMemoryLocalReviewQueueItemV0,
): PerspectiveMemoryLocalWriteProposalV0["proposal_diff_summary"] {
  return {
    included_from_queue_item: [
      "memory_candidate_preview.title",
      "memory_candidate_preview.summary",
      "memory_candidate_preview.supporting_refs",
      "memory_candidate_preview.risk_notes",
      "memory_candidate_preview.unresolved_tensions",
      "source refs and hashes",
      "warning and pointer warning counts",
      "source candidate draft id",
      "queue status at creation",
    ],
    excluded_from_queue_item: [
      "mutable queue status after proposal creation",
      "local queue list ordering",
      "source candidate draft list contents",
      `queue item review-only write flag remains ${String(
        queueItem.review_only_actions.can_create_memory_write,
      )}`,
    ],
    excluded_raw_material: [
      "raw returned envelope text",
      "raw prompt text",
      "raw source packet",
      "raw candidate payload",
      "hidden reasoning",
      "provider logs",
      "tokens or secrets",
      "browser dumps",
      "raw diffs",
      "raw review payloads",
      "private material",
    ],
    authority_boundary_notes: [
      "local write proposal only",
      "not accepted Augnes memory",
      "not product DB persistence",
      "not review decision",
      "not Core decision",
      "not runtime handoff",
      "not automatic promotion",
      "actual memory write requires a future product persistence decision",
    ],
  };
}

function normalizePerspectiveMemoryLocalWriteProposalList(
  list: PerspectiveMemoryLocalWriteProposalListV0,
  updatedAt: string,
): PerspectiveMemoryLocalWriteProposalListV0 {
  const dedupedProposals = new Map<
    string,
    PerspectiveMemoryLocalWriteProposalV0
  >();
  for (const proposal of list.proposals) {
    if (
      collectPerspectiveMemoryLocalWriteProposalUnsafeMarkers(proposal).length >
      0
    ) {
      continue;
    }
    if (!dedupedProposals.has(proposal.proposal_id)) {
      dedupedProposals.set(proposal.proposal_id, proposal);
    }
  }
  return {
    proposal_list_version: PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_LIST_VERSION,
    updated_at: updatedAt,
    proposals: Array.from(dedupedProposals.values())
      .sort((left, right) =>
        proposalSortValue(right).localeCompare(proposalSortValue(left)),
      )
      .slice(0, PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_MAX_ITEMS),
  };
}

function isPerspectiveMemoryLocalWriteProposal(
  value: unknown,
): value is PerspectiveMemoryLocalWriteProposalV0 {
  if (!isRecord(value)) return false;
  const shapeIsValid =
    value.proposal_version === PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_VERSION &&
    hasText(value.proposal_id) &&
    hasText(value.created_at) &&
    hasText(value.updated_at) &&
    value.source === "perspective_memory_local_review_queue" &&
    hasText(value.source_queue_item_id) &&
    hasText(value.source_candidate_draft_id) &&
    isProposalValidationResultState(value.source_validation_result_state) &&
    hasText(value.source_validation_summary_hash) &&
    hasText(value.source_input_ref) &&
    hasText(value.source_input_hash) &&
    hasText(value.prepare_summary_ref) &&
    hasText(value.prepare_execution_summary_hash) &&
    hasText(value.returned_envelope_hash) &&
    hasText(value.queue_item_status_at_creation) &&
    isQueueSourceState(value.queue_source_state_at_creation) &&
    isProposalStatus(value.proposal_status) &&
    isProposedMemoryPayload(value.proposed_memory_payload) &&
    isProposalDiffSummary(value.proposal_diff_summary) &&
    typeof value.warning_count === "number" &&
    typeof value.pointer_warning_count === "number" &&
    typeof value.review_notes === "string" &&
    isLocalWriteProposalAuthorityBoundary(value.authority_boundary);
  return (
    shapeIsValid &&
    collectPerspectiveMemoryLocalWriteProposalUnsafeMarkers(
      value as PerspectiveMemoryLocalWriteProposalV0,
    ).length === 0
  );
}

function isProposedMemoryPayload(
  value: unknown,
): value is PerspectiveMemoryCandidateWritePayloadV0 {
  return (
    isRecord(value) &&
    value.payload_version === PERSPECTIVE_MEMORY_CANDIDATE_WRITE_PAYLOAD_VERSION &&
    hasText(value.title) &&
    hasText(value.summary) &&
    value.memory_kind === "perspective_candidate" &&
    Array.isArray(value.source_refs) &&
    Array.isArray(value.evidence_refs) &&
    Array.isArray(value.risk_notes) &&
    Array.isArray(value.unresolved_tensions) &&
    Array.isArray(value.carry_forward_questions) &&
    hasText(value.suggested_next_review_action) &&
    value.should_write_to_memory_now === false
  );
}

function isProposalDiffSummary(value: unknown) {
  return (
    isRecord(value) &&
    Array.isArray(value.included_from_queue_item) &&
    Array.isArray(value.excluded_from_queue_item) &&
    Array.isArray(value.excluded_raw_material) &&
    Array.isArray(value.authority_boundary_notes)
  );
}

function isLocalWriteProposalAuthorityBoundary(value: unknown) {
  return (
    isRecord(value) &&
    value.local_write_proposal_only === true &&
    value.accepted_augnes_memory_created === false &&
    value.product_db_persistence === false &&
    value.review_decision_created === false &&
    value.core_decision_created === false &&
    value.runtime_handoff_created === false &&
    value.automatic_promotion === false
  );
}

function buildLocalWriteProposalAuthorityBoundary():
  PerspectiveMemoryLocalWriteProposalV0["authority_boundary"] {
  return {
    local_write_proposal_only: true,
    accepted_augnes_memory_created: false,
    product_db_persistence: false,
    review_decision_created: false,
    core_decision_created: false,
    runtime_handoff_created: false,
    automatic_promotion: false,
  };
}

function isProposalValidationResultState(
  value: unknown,
): value is "PASS" | "PASS with follow-up" {
  return value === "PASS" || value === "PASS with follow-up";
}

function isProposalStatus(
  value: unknown,
): value is PerspectiveMemoryLocalWriteProposalStatus {
  return (
    value === "draft_write_proposal" ||
    value === "reviewing_write_proposal" ||
    value === "kept_for_later" ||
    value === "rejected_locally" ||
    value === "superseded_locally"
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

function proposalSortValue(proposal: PerspectiveMemoryLocalWriteProposalV0) {
  return proposal.updated_at || proposal.created_at || "";
}

function boundedStrings(values: string[], maxLength: number) {
  return values.map((value) => boundText(value, maxLength));
}

function boundText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
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

const unsafeWriteProposalMarkers = [
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
