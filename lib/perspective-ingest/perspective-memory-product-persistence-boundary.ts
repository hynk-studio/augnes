import type {
  PerspectiveMemoryLocalReviewQueueItemV0,
} from "@/lib/perspective-ingest/perspective-memory-local-review-queue";
import {
  hashPerspectiveMemoryLocalWriteProposalForChecklist,
  type PerspectiveMemoryLocalWriteProposalReviewChecklistV0,
} from "@/lib/perspective-ingest/perspective-memory-local-write-proposal-review-checklist";
import type {
  PerspectiveMemoryCandidateWritePayloadV0,
  PerspectiveMemoryLocalWriteProposalV0,
} from "@/lib/perspective-ingest/perspective-memory-local-write-proposal";

export const PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_VERSION =
  "perspective_memory_product_persistence_boundary_record.v0.1";
export const PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_LIST_VERSION =
  "perspective_memory_product_persistence_boundary_record_list.v0.1";
export const PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE =
  "/api/perspective/memory/product-persistence-boundary/records";
export const PERSPECTIVE_MEMORY_BOUNDARY_REVIEW_INBOX_ROUTE =
  "/cockpit/perspective/memory-boundary-review-inbox";
export const PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_MAX_RECORDS = 100;

export const PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_STATUSES = [
  "product_persistence_boundary_recorded",
  "locally_reviewing_boundary_record",
  "kept_for_later",
  "retracted_before_memory_write",
] as const;

export type PerspectiveMemoryProductPersistenceBoundaryStatus =
  (typeof PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_STATUSES)[number];

export type PerspectiveMemoryProductPersistenceBoundaryUserConfirmation = {
  confirmed_at: string;
  confirmation_label: "Create product persistence boundary record";
  user_confirmed_not_accepted_memory: true;
  user_confirmed_not_core_decision: true;
  user_confirmed_no_automatic_promotion: true;
};

export type PerspectiveMemoryProductPersistenceBoundaryChecklistGateSummary = {
  required_gate_count: number;
  completed_required_gate_count: number;
  optional_gate_count: number;
  completed_optional_gate_count: number;
  checked_required_gates: string[];
  not_applicable_gates: string[];
  blocked_gates: string[];
};

export type PerspectiveMemoryProductPersistenceBoundaryRecordV0 = {
  record_version: typeof PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_VERSION;
  record_id: string;
  created_at: string;
  updated_at: string;
  source: "local_write_proposal_review_checklist";
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
  checklist_status_at_creation: "locally_ready_for_product_persistence_review";
  checklist_ready_for_product_persistence_review: true;
  checklist_ready_for_memory_write_now: false;
  source_proposal_hash: string;
  proposed_memory_payload: PerspectiveMemoryCandidateWritePayloadV0;
  proposal_diff_summary: PerspectiveMemoryLocalWriteProposalV0["proposal_diff_summary"];
  checklist_gate_summary: PerspectiveMemoryProductPersistenceBoundaryChecklistGateSummary;
  local_review_notes: string;
  user_confirmation: PerspectiveMemoryProductPersistenceBoundaryUserConfirmation;
  boundary_status: PerspectiveMemoryProductPersistenceBoundaryStatus;
  next_allowed_actions: {
    can_review_boundary_record: true;
    can_keep_for_later: true;
    can_retract_before_memory_write: true;
    can_create_accepted_memory: false;
    can_create_core_decision: false;
    can_auto_promote: false;
  };
  authority_boundary: {
    product_persistence_boundary_record_created: true;
    accepted_augnes_memory_created: false;
    product_memory_write_created: false;
    review_decision_created: false;
    core_decision_created: false;
    runtime_handoff_created: false;
    automatic_promotion: false;
  };
};

export type PerspectiveMemoryProductPersistenceBoundaryRecordListV0 = {
  boundary_record_list_version: typeof PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_LIST_VERSION;
  updated_at: string;
  records: PerspectiveMemoryProductPersistenceBoundaryRecordV0[];
};

export type PerspectiveMemoryProductPersistenceBoundaryCreateInput = {
  nowIso: string;
  recordId: string;
  checklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0;
  proposal: PerspectiveMemoryLocalWriteProposalV0;
  queueItem: PerspectiveMemoryLocalReviewQueueItemV0;
  userConfirmation: {
    user_confirmed_not_accepted_memory?: boolean;
    user_confirmed_not_core_decision?: boolean;
    user_confirmed_no_automatic_promotion?: boolean;
  };
};

export type PerspectiveMemoryProductPersistenceBoundaryCreateResult =
  | {
      ok: true;
      record: PerspectiveMemoryProductPersistenceBoundaryRecordV0;
    }
  | {
      ok: false;
      blocked_reasons: string[];
    };

export function buildPerspectiveMemoryProductPersistenceBoundaryRecord(
  input: PerspectiveMemoryProductPersistenceBoundaryCreateInput,
): PerspectiveMemoryProductPersistenceBoundaryCreateResult {
  const blockedReasons =
    collectPerspectiveMemoryProductPersistenceBoundaryBlockedReasons(input);
  if (blockedReasons.length > 0) {
    return { ok: false, blocked_reasons: blockedReasons };
  }

  const record: PerspectiveMemoryProductPersistenceBoundaryRecordV0 = {
    record_version:
      PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_VERSION,
    record_id: boundText(input.recordId, 160),
    created_at: input.nowIso,
    updated_at: input.nowIso,
    source: "local_write_proposal_review_checklist",
    source_checklist_id: input.checklist.checklist_id,
    source_proposal_id: input.proposal.proposal_id,
    source_queue_item_id: input.queueItem.queue_item_id,
    source_candidate_draft_id: input.proposal.source_candidate_draft_id,
    source_validation_result_state: input.proposal.source_validation_result_state,
    source_validation_summary_hash: input.proposal.source_validation_summary_hash,
    source_input_ref: input.proposal.source_input_ref,
    source_input_hash: input.proposal.source_input_hash,
    prepare_summary_ref: input.proposal.prepare_summary_ref,
    prepare_execution_summary_hash:
      input.proposal.prepare_execution_summary_hash,
    returned_envelope_hash: input.proposal.returned_envelope_hash,
    checklist_status_at_creation:
      "locally_ready_for_product_persistence_review",
    checklist_ready_for_product_persistence_review: true,
    checklist_ready_for_memory_write_now: false,
    source_proposal_hash: input.checklist.source_proposal_hash,
    proposed_memory_payload: normalizePayload(input.proposal.proposed_memory_payload),
    proposal_diff_summary: normalizeProposalDiffSummary(
      input.proposal.proposal_diff_summary,
    ),
    checklist_gate_summary: buildChecklistGateSummary(input.checklist),
    local_review_notes: boundText(input.checklist.local_review_notes, 1200),
    user_confirmation: {
      confirmed_at: input.nowIso,
      confirmation_label: "Create product persistence boundary record",
      user_confirmed_not_accepted_memory: true,
      user_confirmed_not_core_decision: true,
      user_confirmed_no_automatic_promotion: true,
    },
    boundary_status: "product_persistence_boundary_recorded",
    next_allowed_actions: buildNextAllowedActions(),
    authority_boundary: buildAuthorityBoundary(),
  };

  const unsafeMarkers =
    collectPerspectiveMemoryProductPersistenceBoundaryRecordUnsafeMarkers(record);
  if (unsafeMarkers.length > 0) {
    return {
      ok: false,
      blocked_reasons: unsafeMarkers.map(
        (marker) => `boundary record contains unsafe marker: ${marker}`,
      ),
    };
  }

  return { ok: true, record };
}

export function canBuildPerspectiveMemoryProductPersistenceBoundaryRecord(
  input: Omit<PerspectiveMemoryProductPersistenceBoundaryCreateInput, "nowIso" | "recordId">,
) {
  const blockedReasons =
    collectPerspectiveMemoryProductPersistenceBoundaryBlockedReasons({
      ...input,
      nowIso: "1970-01-01T00:00:00.000Z",
      recordId: "eligibility-check",
    });
  return {
    eligible: blockedReasons.length === 0,
    blocked_reasons: blockedReasons,
  };
}

export function updatePerspectiveMemoryProductPersistenceBoundaryRecordStatus(
  record: PerspectiveMemoryProductPersistenceBoundaryRecordV0,
  boundaryStatus: PerspectiveMemoryProductPersistenceBoundaryStatus,
  nowIso: string,
): PerspectiveMemoryProductPersistenceBoundaryRecordV0 {
  return {
    ...record,
    boundary_status: boundaryStatus,
    updated_at: nowIso,
    next_allowed_actions: buildNextAllowedActions(),
    authority_boundary: buildAuthorityBoundary(),
  };
}

export function createEmptyPerspectiveMemoryProductPersistenceBoundaryRecordList(
  nowIso: string,
): PerspectiveMemoryProductPersistenceBoundaryRecordListV0 {
  return {
    boundary_record_list_version:
      PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_LIST_VERSION,
    updated_at: nowIso,
    records: [],
  };
}

export function normalizePerspectiveMemoryProductPersistenceBoundaryRecordList(
  list: PerspectiveMemoryProductPersistenceBoundaryRecordListV0,
  updatedAt: string,
): PerspectiveMemoryProductPersistenceBoundaryRecordListV0 {
  const deduped = new Map<
    string,
    PerspectiveMemoryProductPersistenceBoundaryRecordV0
  >();
  for (const record of list.records) {
    if (
      isPerspectiveMemoryProductPersistenceBoundaryRecord(record) &&
      !deduped.has(record.record_id)
    ) {
      deduped.set(record.record_id, record);
    }
  }
  return {
    boundary_record_list_version:
      PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_LIST_VERSION,
    updated_at: updatedAt,
    records: Array.from(deduped.values())
      .sort((left, right) =>
        recordSortValue(right).localeCompare(recordSortValue(left)),
      )
      .slice(0, PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_MAX_RECORDS),
  };
}

export function safeParsePerspectiveMemoryProductPersistenceBoundaryRecord(
  serialized: string | null,
): PerspectiveMemoryProductPersistenceBoundaryRecordV0 | null {
  if (!serialized) return null;
  try {
    const parsed = JSON.parse(serialized);
    return isPerspectiveMemoryProductPersistenceBoundaryRecord(parsed)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

export function safeParsePerspectiveMemoryProductPersistenceBoundaryRecordList(
  serialized: string | null,
  nowIso: string,
): PerspectiveMemoryProductPersistenceBoundaryRecordListV0 {
  if (!serialized) {
    return createEmptyPerspectiveMemoryProductPersistenceBoundaryRecordList(
      nowIso,
    );
  }
  try {
    const parsed = JSON.parse(serialized);
    if (
      !isRecord(parsed) ||
      parsed.boundary_record_list_version !==
        PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_LIST_VERSION ||
      typeof parsed.updated_at !== "string" ||
      !Array.isArray(parsed.records)
    ) {
      return createEmptyPerspectiveMemoryProductPersistenceBoundaryRecordList(
        nowIso,
      );
    }
    return normalizePerspectiveMemoryProductPersistenceBoundaryRecordList(
      {
        boundary_record_list_version:
          PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_LIST_VERSION,
        updated_at: parsed.updated_at,
        records: parsed.records.filter(
          isPerspectiveMemoryProductPersistenceBoundaryRecord,
        ),
      },
      parsed.updated_at,
    );
  } catch {
    return createEmptyPerspectiveMemoryProductPersistenceBoundaryRecordList(
      nowIso,
    );
  }
}

export function isPerspectiveMemoryProductPersistenceBoundaryStatus(
  value: unknown,
): value is PerspectiveMemoryProductPersistenceBoundaryStatus {
  return PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_STATUSES.includes(
    value as PerspectiveMemoryProductPersistenceBoundaryStatus,
  );
}

export function collectPerspectiveMemoryProductPersistenceBoundaryRecordUnsafeMarkers(
  record: PerspectiveMemoryProductPersistenceBoundaryRecordV0,
) {
  const serialized = JSON.stringify(record);
  return unsafeBoundaryMarkers.filter((marker) => serialized.includes(marker));
}

export function collectPerspectiveMemoryProductPersistenceBoundaryUnsafeMarkers(
  value: unknown,
) {
  const serialized = JSON.stringify(value);
  return unsafeBoundaryMarkers.filter((marker) => serialized.includes(marker));
}

export function buildChecklistGateSummary(
  checklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0,
): PerspectiveMemoryProductPersistenceBoundaryChecklistGateSummary {
  const gates = Object.values(checklist.gates);
  const required = gates.filter((gate) => gate.required);
  const optional = gates.filter((gate) => !gate.required);
  return {
    required_gate_count: checklist.required_gate_count,
    completed_required_gate_count: checklist.completed_required_gate_count,
    optional_gate_count: checklist.optional_gate_count,
    completed_optional_gate_count: checklist.completed_optional_gate_count,
    checked_required_gates: required
      .filter((gate) => gate.status === "checked")
      .map((gate) => gate.gate_id),
    not_applicable_gates: optional
      .filter((gate) => gate.status === "not_applicable")
      .map((gate) => gate.gate_id),
    blocked_gates: gates
      .filter((gate) => gate.status === "blocked")
      .map((gate) => gate.gate_id),
  };
}

function collectPerspectiveMemoryProductPersistenceBoundaryBlockedReasons(
  input: PerspectiveMemoryProductPersistenceBoundaryCreateInput,
) {
  const blockedReasons: string[] = [];
  const unsafeMarkers =
    collectPerspectiveMemoryProductPersistenceBoundaryUnsafeMarkers({
      ...input,
      proposal: {
        ...input.proposal,
        proposal_diff_summary: normalizeProposalDiffSummary(
          input.proposal.proposal_diff_summary,
        ),
      },
    });
  for (const marker of unsafeMarkers) {
    blockedReasons.push(`request contains unsafe marker: ${marker}`);
  }
  if (!hasText(input.recordId)) {
    blockedReasons.push("record_id is required");
  }
  if (input.checklist.checklist_status !== "locally_ready_for_product_persistence_review") {
    blockedReasons.push("checklist must be locally_ready_for_product_persistence_review");
  }
  if (
    input.checklist.readiness_summary.ready_for_product_persistence_review !==
    true
  ) {
    blockedReasons.push("checklist readiness must be ready_for_product_persistence_review");
  }
  if (input.checklist.readiness_summary.ready_for_memory_write_now !== false) {
    blockedReasons.push("ready_for_memory_write_now must remain false");
  }
  if (input.checklist.source_proposal_id !== input.proposal.proposal_id) {
    blockedReasons.push("checklist source_proposal_id must match proposal");
  }
  if (input.checklist.source_queue_item_id !== input.queueItem.queue_item_id) {
    blockedReasons.push("checklist source_queue_item_id must match queue item");
  }
  if (
    input.checklist.source_candidate_draft_id !==
    input.proposal.source_candidate_draft_id
  ) {
    blockedReasons.push("checklist source_candidate_draft_id must match proposal");
  }
  if (input.proposal.source_queue_item_id !== input.queueItem.queue_item_id) {
    blockedReasons.push("proposal source_queue_item_id must match queue item");
  }
  if (
    input.proposal.source_candidate_draft_id !==
    input.queueItem.source_candidate_draft_id
  ) {
    blockedReasons.push("proposal source_candidate_draft_id must match queue item");
  }
  if (input.proposal.proposal_status === "rejected_locally") {
    blockedReasons.push("rejected local write proposals cannot cross the boundary");
  }
  if (input.proposal.proposal_status === "superseded_locally") {
    blockedReasons.push("superseded local write proposals cannot cross the boundary");
  }
  if (input.queueItem.queue_status === "removed_from_queue") {
    blockedReasons.push("removed queue items cannot cross the boundary");
  }
  if (input.queueItem.review_only_actions.can_create_memory_write !== false) {
    blockedReasons.push("queue item must keep can_create_memory_write false");
  }
  if (
    input.proposal.proposed_memory_payload.should_write_to_memory_now !== false
  ) {
    blockedReasons.push("proposal payload must keep should_write_to_memory_now false");
  }
  if (
    input.proposal.source_validation_result_state !== "PASS" &&
    input.proposal.source_validation_result_state !== "PASS with follow-up"
  ) {
    blockedReasons.push("proposal validation result must be PASS or PASS with follow-up");
  }
  if (
    input.proposal.source_validation_result_state !==
    input.queueItem.source_validation_result_state
  ) {
    blockedReasons.push("proposal validation result must match queue item");
  }
  const computedProposalHash =
    hashPerspectiveMemoryLocalWriteProposalForChecklist(input.proposal);
  if (input.checklist.source_proposal_hash !== computedProposalHash) {
    blockedReasons.push("checklist source_proposal_hash must match proposal");
  }
  validateProposalAuthorityBoundary(input.proposal, blockedReasons);
  validateChecklistAuthorityBoundary(input.checklist, blockedReasons);
  validateQueueAuthorityBoundary(input.queueItem, blockedReasons);
  validateConfirmation(input.userConfirmation, blockedReasons);
  for (const gate of Object.values(input.checklist.gates)) {
    if (gate.required && gate.status !== "checked") {
      blockedReasons.push(`required checklist gate is not checked: ${gate.gate_id}`);
    }
  }
  return uniqueStrings(blockedReasons);
}

function validateConfirmation(
  confirmation: PerspectiveMemoryProductPersistenceBoundaryCreateInput["userConfirmation"],
  blockedReasons: string[],
) {
  if (confirmation.user_confirmed_not_accepted_memory !== true) {
    blockedReasons.push("user must confirm this is not accepted Augnes memory");
  }
  if (confirmation.user_confirmed_not_core_decision !== true) {
    blockedReasons.push("user must confirm this is not a Core decision");
  }
  if (confirmation.user_confirmed_no_automatic_promotion !== true) {
    blockedReasons.push("user must confirm no automatic promotion or memory write");
  }
}

function validateProposalAuthorityBoundary(
  proposal: PerspectiveMemoryLocalWriteProposalV0,
  blockedReasons: string[],
) {
  if (proposal.authority_boundary.local_write_proposal_only !== true) {
    blockedReasons.push("proposal must remain local_write_proposal_only");
  }
  for (const [field, value] of Object.entries(proposal.authority_boundary)) {
    if (field === "local_write_proposal_only") continue;
    if (value !== false) {
      blockedReasons.push(`proposal authority flag must be false: ${field}`);
    }
  }
}

function validateChecklistAuthorityBoundary(
  checklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0,
  blockedReasons: string[],
) {
  if (checklist.authority_boundary.local_checklist_only !== true) {
    blockedReasons.push("checklist must remain local_checklist_only");
  }
  for (const [field, value] of Object.entries(checklist.authority_boundary)) {
    if (field === "local_checklist_only") continue;
    if (value !== false) {
      blockedReasons.push(`checklist authority flag must be false: ${field}`);
    }
  }
}

function validateQueueAuthorityBoundary(
  queueItem: PerspectiveMemoryLocalReviewQueueItemV0,
  blockedReasons: string[],
) {
  if (queueItem.authority_boundary.local_queue_only !== true) {
    blockedReasons.push("queue item must remain local_queue_only");
  }
  for (const [field, value] of Object.entries(queueItem.authority_boundary)) {
    if (field === "local_queue_only") continue;
    if (value !== false) {
      blockedReasons.push(`queue authority flag must be false: ${field}`);
    }
  }
}

function normalizePayload(
  payload: PerspectiveMemoryCandidateWritePayloadV0,
): PerspectiveMemoryCandidateWritePayloadV0 {
  return {
    payload_version: payload.payload_version,
    title: boundText(payload.title, 180),
    summary: boundText(payload.summary, 1200),
    memory_kind: "perspective_candidate",
    source_refs: boundedStrings(payload.source_refs, 40, 240),
    evidence_refs: boundedStrings(payload.evidence_refs, 40, 240),
    risk_notes: boundedStrings(payload.risk_notes, 20, 300),
    unresolved_tensions: boundedStrings(payload.unresolved_tensions, 20, 300),
    carry_forward_questions: boundedStrings(payload.carry_forward_questions, 20, 300),
    suggested_next_review_action: boundText(
      payload.suggested_next_review_action,
      240,
    ),
    should_write_to_memory_now: false,
  };
}

function normalizeProposalDiffSummary(
  diffSummary: PerspectiveMemoryLocalWriteProposalV0["proposal_diff_summary"],
): PerspectiveMemoryLocalWriteProposalV0["proposal_diff_summary"] {
  return {
    included_from_queue_item: boundedStrings(diffSummary.included_from_queue_item),
    excluded_from_queue_item: boundedStrings(diffSummary.excluded_from_queue_item),
    excluded_raw_material: boundedStrings(
      diffSummary.excluded_raw_material.map(safeBoundaryExcludedMaterialLabel),
    ),
    authority_boundary_notes: boundedStrings(diffSummary.authority_boundary_notes),
  };
}

function safeBoundaryExcludedMaterialLabel(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === "raw returned envelope text") {
    return "returned envelope text excluded";
  }
  if (normalized === "raw prompt text") {
    return "prompt text excluded";
  }
  if (normalized === "raw source packet") {
    return "source packet excluded";
  }
  if (normalized === "raw candidate payload") {
    return "candidate payload excluded";
  }
  if (normalized === "hidden reasoning") {
    return "hidden reasoning excluded";
  }
  if (normalized === "provider logs") {
    return "provider logs excluded";
  }
  if (normalized === "tokens or secrets") {
    return "token and secret material excluded";
  }
  if (normalized === "browser dumps") {
    return "browser dump material excluded";
  }
  if (normalized === "raw diffs") {
    return "diff material excluded";
  }
  if (normalized === "raw review payloads") {
    return "review payloads excluded";
  }
  if (normalized === "private material") {
    return "private material excluded";
  }
  return value;
}

function buildNextAllowedActions():
  PerspectiveMemoryProductPersistenceBoundaryRecordV0["next_allowed_actions"] {
  return {
    can_review_boundary_record: true,
    can_keep_for_later: true,
    can_retract_before_memory_write: true,
    can_create_accepted_memory: false,
    can_create_core_decision: false,
    can_auto_promote: false,
  };
}

function buildAuthorityBoundary():
  PerspectiveMemoryProductPersistenceBoundaryRecordV0["authority_boundary"] {
  return {
    product_persistence_boundary_record_created: true,
    accepted_augnes_memory_created: false,
    product_memory_write_created: false,
    review_decision_created: false,
    core_decision_created: false,
    runtime_handoff_created: false,
    automatic_promotion: false,
  };
}

function isPerspectiveMemoryProductPersistenceBoundaryRecord(
  value: unknown,
): value is PerspectiveMemoryProductPersistenceBoundaryRecordV0 {
  if (!isRecord(value)) return false;
  const record = value as PerspectiveMemoryProductPersistenceBoundaryRecordV0;
  return (
    record.record_version ===
      PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_VERSION &&
    hasText(record.record_id) &&
    hasText(record.created_at) &&
    hasText(record.updated_at) &&
    record.source === "local_write_proposal_review_checklist" &&
    hasText(record.source_checklist_id) &&
    hasText(record.source_proposal_id) &&
    hasText(record.source_queue_item_id) &&
    hasText(record.source_candidate_draft_id) &&
    (record.source_validation_result_state === "PASS" ||
      record.source_validation_result_state === "PASS with follow-up") &&
    hasText(record.source_validation_summary_hash) &&
    hasText(record.source_input_ref) &&
    hasText(record.source_input_hash) &&
    hasText(record.prepare_summary_ref) &&
    hasText(record.prepare_execution_summary_hash) &&
    hasText(record.returned_envelope_hash) &&
    record.checklist_status_at_creation ===
      "locally_ready_for_product_persistence_review" &&
    record.checklist_ready_for_product_persistence_review === true &&
    record.checklist_ready_for_memory_write_now === false &&
    hasText(record.source_proposal_hash) &&
    isPayload(record.proposed_memory_payload) &&
    isProposalDiffSummary(record.proposal_diff_summary) &&
    isChecklistGateSummary(record.checklist_gate_summary) &&
    typeof record.local_review_notes === "string" &&
    isUserConfirmation(record.user_confirmation) &&
    isPerspectiveMemoryProductPersistenceBoundaryStatus(record.boundary_status) &&
    isNextAllowedActions(record.next_allowed_actions) &&
    isAuthorityBoundary(record.authority_boundary) &&
    collectPerspectiveMemoryProductPersistenceBoundaryRecordUnsafeMarkers(record)
      .length === 0
  );
}

function isPayload(value: unknown): value is PerspectiveMemoryCandidateWritePayloadV0 {
  return (
    isRecord(value) &&
    value.payload_version === "perspective_memory_candidate_write_payload.v0.1" &&
    typeof value.title === "string" &&
    typeof value.summary === "string" &&
    value.memory_kind === "perspective_candidate" &&
    Array.isArray(value.source_refs) &&
    Array.isArray(value.evidence_refs) &&
    Array.isArray(value.risk_notes) &&
    Array.isArray(value.unresolved_tensions) &&
    Array.isArray(value.carry_forward_questions) &&
    typeof value.suggested_next_review_action === "string" &&
    value.should_write_to_memory_now === false
  );
}

function isProposalDiffSummary(
  value: unknown,
): value is PerspectiveMemoryLocalWriteProposalV0["proposal_diff_summary"] {
  return (
    isRecord(value) &&
    Array.isArray(value.included_from_queue_item) &&
    Array.isArray(value.excluded_from_queue_item) &&
    Array.isArray(value.excluded_raw_material) &&
    Array.isArray(value.authority_boundary_notes)
  );
}

function isChecklistGateSummary(
  value: unknown,
): value is PerspectiveMemoryProductPersistenceBoundaryChecklistGateSummary {
  return (
    isRecord(value) &&
    typeof value.required_gate_count === "number" &&
    typeof value.completed_required_gate_count === "number" &&
    typeof value.optional_gate_count === "number" &&
    typeof value.completed_optional_gate_count === "number" &&
    Array.isArray(value.checked_required_gates) &&
    Array.isArray(value.not_applicable_gates) &&
    Array.isArray(value.blocked_gates)
  );
}

function isUserConfirmation(
  value: unknown,
): value is PerspectiveMemoryProductPersistenceBoundaryUserConfirmation {
  return (
    isRecord(value) &&
    typeof value.confirmed_at === "string" &&
    value.confirmation_label === "Create product persistence boundary record" &&
    value.user_confirmed_not_accepted_memory === true &&
    value.user_confirmed_not_core_decision === true &&
    value.user_confirmed_no_automatic_promotion === true
  );
}

function isNextAllowedActions(
  value: unknown,
): value is PerspectiveMemoryProductPersistenceBoundaryRecordV0["next_allowed_actions"] {
  return (
    isRecord(value) &&
    value.can_review_boundary_record === true &&
    value.can_keep_for_later === true &&
    value.can_retract_before_memory_write === true &&
    value.can_create_accepted_memory === false &&
    value.can_create_core_decision === false &&
    value.can_auto_promote === false
  );
}

function isAuthorityBoundary(
  value: unknown,
): value is PerspectiveMemoryProductPersistenceBoundaryRecordV0["authority_boundary"] {
  return (
    isRecord(value) &&
    value.product_persistence_boundary_record_created === true &&
    value.accepted_augnes_memory_created === false &&
    value.product_memory_write_created === false &&
    value.review_decision_created === false &&
    value.core_decision_created === false &&
    value.runtime_handoff_created === false &&
    value.automatic_promotion === false
  );
}

function boundedStrings(values: unknown[], maxItems = 30, maxLength = 260) {
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => boundText(value, maxLength))
    .filter((value) => value.length > 0)
    .slice(0, maxItems);
}

function boundText(value: string, maxLength: number) {
  return value.trim().slice(0, maxLength);
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function recordSortValue(record: PerspectiveMemoryProductPersistenceBoundaryRecordV0) {
  return record.updated_at || record.created_at || "";
}

const unsafeBoundaryMarkers = [
  "RETURNED_CODEX_RESPONSE",
  "raw_returned_envelope",
  "raw prompt",
  "raw_prompt",
  "raw_source_packet",
  "raw_candidate_payload",
  "raw_candidate",
  "provider_log",
  "hidden_reasoning",
  "TOKEN=",
  "OPENAI_API_KEY",
  "browser_dump",
  "raw_diff",
  "private_key",
  "secret_key",
  "BEGIN PRIVATE KEY",
];

export default {
  PERSPECTIVE_MEMORY_BOUNDARY_REVIEW_INBOX_ROUTE,
  PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE,
  PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_MAX_RECORDS,
  PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_LIST_VERSION,
  PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_VERSION,
  PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_STATUSES,
  buildChecklistGateSummary,
  buildPerspectiveMemoryProductPersistenceBoundaryRecord,
  canBuildPerspectiveMemoryProductPersistenceBoundaryRecord,
  collectPerspectiveMemoryProductPersistenceBoundaryRecordUnsafeMarkers,
  collectPerspectiveMemoryProductPersistenceBoundaryUnsafeMarkers,
  createEmptyPerspectiveMemoryProductPersistenceBoundaryRecordList,
  isPerspectiveMemoryProductPersistenceBoundaryStatus,
  normalizePerspectiveMemoryProductPersistenceBoundaryRecordList,
  safeParsePerspectiveMemoryProductPersistenceBoundaryRecord,
  safeParsePerspectiveMemoryProductPersistenceBoundaryRecordList,
  updatePerspectiveMemoryProductPersistenceBoundaryRecordStatus,
};
