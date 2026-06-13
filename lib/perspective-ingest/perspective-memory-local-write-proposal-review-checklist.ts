import type {
  OperatorFlowStorage,
} from "@/lib/perspective-ingest/codex-former-local-adapter-operator-flow";
import type {
  PerspectiveMemoryLocalReviewQueueV0,
} from "@/lib/perspective-ingest/perspective-memory-local-review-queue";
import {
  getPerspectiveMemoryLocalWriteProposalSourceState,
  type PerspectiveMemoryLocalWriteProposalListV0,
  type PerspectiveMemoryLocalWriteProposalSourceState,
  type PerspectiveMemoryLocalWriteProposalStatus,
  type PerspectiveMemoryLocalWriteProposalV0,
} from "@/lib/perspective-ingest/perspective-memory-local-write-proposal";

export const PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE =
  "augnes.perspectiveMemory.localWriteProposalReviewChecklists.v0.1";
export const PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_LIST_VERSION =
  "perspective_memory_local_write_proposal_review_checklist_list.v0.1";
export const PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_VERSION =
  "perspective_memory_local_write_proposal_review_checklist.v0.1";
export const PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_READINESS_SUMMARY_VERSION =
  "perspective_memory_local_write_proposal_readiness_summary.v0.1";
export const PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_MAX_ITEMS =
  50;

export const PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_GATE_IDS =
  [
    "source_refs_reviewed",
    "validation_result_reviewed",
    "pass_follow_up_caveat_reviewed",
    "proposed_payload_reviewed",
    "raw_material_exclusion_reviewed",
    "authority_boundary_reviewed",
    "risk_notes_reviewed",
    "unresolved_tensions_reviewed",
    "carry_forward_questions_reviewed",
    "source_state_reviewed",
    "supersede_impact_reviewed",
    "final_user_intent_confirmed",
  ] as const;

export type PerspectiveMemoryLocalWriteProposalReviewChecklistGateId =
  (typeof PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_GATE_IDS)[number];

export type ChecklistGateStatus =
  | "unchecked"
  | "checked"
  | "not_applicable"
  | "blocked";

export type PerspectiveMemoryLocalWriteProposalReviewChecklistStatus =
  | "not_started"
  | "in_review"
  | "blocked"
  | "locally_ready_for_product_persistence_review";

export type PerspectiveMemoryLocalWriteProposalReviewChecklistSourceProposalState =
  | "source_proposal_current"
  | "source_proposal_status_changed"
  | "source_proposal_missing"
  | "source_proposal_removed_or_rejected"
  | "not_checked";

export type ChecklistGate = {
  gate_id: string;
  label: string;
  required: boolean;
  status: ChecklistGateStatus;
  checked_at?: string;
  local_note?: string;
};

export type PerspectiveMemoryLocalWriteProposalReviewChecklistGates = Record<
  PerspectiveMemoryLocalWriteProposalReviewChecklistGateId,
  ChecklistGate
>;

export type PerspectiveMemoryLocalWriteProposalReadinessSummaryV0 = {
  readiness_version: typeof PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_READINESS_SUMMARY_VERSION;
  ready_for_product_persistence_review: boolean;
  ready_for_memory_write_now: false;
  blocked_reasons: string[];
  warnings: string[];
  next_action: string;
};

export type PerspectiveMemoryLocalWriteProposalReviewChecklistV0 = {
  checklist_version: typeof PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_VERSION;
  checklist_id: string;
  created_at: string;
  updated_at: string;
  source: "perspective_memory_local_write_proposal";
  source_proposal_id: string;
  source_queue_item_id: string;
  source_candidate_draft_id: string;
  source_validation_result_state: "PASS" | "PASS with follow-up";
  source_proposal_status_at_creation: PerspectiveMemoryLocalWriteProposalStatus;
  source_proposal_hash: string;
  source_queue_item_state_at_creation: PerspectiveMemoryLocalWriteProposalSourceState;
  checklist_status: PerspectiveMemoryLocalWriteProposalReviewChecklistStatus;
  required_gate_count: number;
  completed_required_gate_count: number;
  optional_gate_count: number;
  completed_optional_gate_count: number;
  gates: PerspectiveMemoryLocalWriteProposalReviewChecklistGates;
  local_review_notes: string;
  readiness_summary: PerspectiveMemoryLocalWriteProposalReadinessSummaryV0;
  authority_boundary: {
    local_checklist_only: true;
    accepted_augnes_memory_created: false;
    product_db_persistence: false;
    review_decision_created: false;
    core_decision_created: false;
    runtime_handoff_created: false;
    automatic_promotion: false;
  };
};

export type PerspectiveMemoryLocalWriteProposalReviewChecklistListV0 = {
  checklist_list_version: typeof PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_LIST_VERSION;
  updated_at: string;
  checklists: PerspectiveMemoryLocalWriteProposalReviewChecklistV0[];
};

export type BuildPerspectiveMemoryLocalWriteProposalReviewChecklistInput = {
  nowIso: string;
  checklistId: string;
  proposal: PerspectiveMemoryLocalWriteProposalV0;
  proposalSourceState: PerspectiveMemoryLocalWriteProposalSourceState;
};

export type RecomputePerspectiveMemoryLocalWriteProposalReviewChecklistInput = {
  checklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0;
  proposalList: PerspectiveMemoryLocalWriteProposalListV0;
  queue: PerspectiveMemoryLocalReviewQueueV0;
  nowIso: string;
};

export function createEmptyPerspectiveMemoryLocalWriteProposalReviewChecklistList(
  nowIso: string,
): PerspectiveMemoryLocalWriteProposalReviewChecklistListV0 {
  return {
    checklist_list_version:
      PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_LIST_VERSION,
    updated_at: nowIso,
    checklists: [],
  };
}

export function buildPerspectiveMemoryLocalWriteProposalReviewChecklist(
  input: BuildPerspectiveMemoryLocalWriteProposalReviewChecklistInput,
): PerspectiveMemoryLocalWriteProposalReviewChecklistV0 {
  const checklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0 = {
    checklist_version:
      PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_VERSION,
    checklist_id: input.checklistId,
    created_at: input.nowIso,
    updated_at: input.nowIso,
    source: "perspective_memory_local_write_proposal",
    source_proposal_id: input.proposal.proposal_id,
    source_queue_item_id: input.proposal.source_queue_item_id,
    source_candidate_draft_id: input.proposal.source_candidate_draft_id,
    source_validation_result_state: input.proposal.source_validation_result_state,
    source_proposal_status_at_creation: input.proposal.proposal_status,
    source_proposal_hash:
      hashPerspectiveMemoryLocalWriteProposalForChecklist(input.proposal),
    source_queue_item_state_at_creation: input.proposalSourceState,
    checklist_status: "not_started",
    required_gate_count: 0,
    completed_required_gate_count: 0,
    optional_gate_count: 0,
    completed_optional_gate_count: 0,
    gates: buildInitialChecklistGates(input.proposal),
    local_review_notes: "",
    readiness_summary: buildReadinessSummary({
      ready: false,
      blockedReasons: [],
      warnings: [],
      nextAction: "Complete required checklist gates before any future persistence review.",
    }),
    authority_boundary: buildChecklistAuthorityBoundary(),
  };
  return recomputeChecklistReadinessWithKnownState({
    checklist,
    sourceProposalState: "source_proposal_current",
    sourceQueueItemState: input.proposalSourceState,
    sourceProposal: input.proposal,
    nowIso: input.nowIso,
  });
}

export function recomputePerspectiveMemoryLocalWriteProposalReviewChecklist(
  input: RecomputePerspectiveMemoryLocalWriteProposalReviewChecklistInput,
): PerspectiveMemoryLocalWriteProposalReviewChecklistV0 {
  const sourceProposal =
    input.proposalList.proposals.find(
      (proposal) => proposal.proposal_id === input.checklist.source_proposal_id,
    ) ?? null;
  const sourceProposalState =
    getPerspectiveMemoryLocalWriteProposalReviewChecklistSourceProposalState(
      input.checklist,
      input.proposalList,
    );
  const sourceQueueItemState = sourceProposal
    ? getPerspectiveMemoryLocalWriteProposalSourceState(sourceProposal, input.queue)
    : "not_checked";
  return recomputeChecklistReadinessWithKnownState({
    checklist: input.checklist,
    sourceProposalState,
    sourceQueueItemState,
    sourceProposal,
    nowIso: input.nowIso,
  });
}

export function updatePerspectiveMemoryLocalWriteProposalReviewChecklistGate(
  input: RecomputePerspectiveMemoryLocalWriteProposalReviewChecklistInput & {
    gateId: PerspectiveMemoryLocalWriteProposalReviewChecklistGateId;
    status: Exclude<ChecklistGateStatus, "not_applicable">;
    localNote?: string;
  },
): PerspectiveMemoryLocalWriteProposalReviewChecklistV0 {
  const gate = input.checklist.gates[input.gateId];
  if (gate.status === "not_applicable") {
    return input.checklist;
  }
  const nextChecklist = {
    ...input.checklist,
    gates: {
      ...input.checklist.gates,
      [input.gateId]: {
        ...gate,
        status: input.status,
        checked_at: input.status === "checked" ? input.nowIso : undefined,
        local_note:
          input.localNote != null
            ? boundText(input.localNote, 400)
            : gate.local_note,
      },
    },
  };
  return recomputePerspectiveMemoryLocalWriteProposalReviewChecklist({
    checklist: nextChecklist,
    proposalList: input.proposalList,
    queue: input.queue,
    nowIso: input.nowIso,
  });
}

export function updatePerspectiveMemoryLocalWriteProposalReviewChecklistNotes(
  input: RecomputePerspectiveMemoryLocalWriteProposalReviewChecklistInput & {
    localReviewNotes: string;
  },
): PerspectiveMemoryLocalWriteProposalReviewChecklistV0 {
  return recomputePerspectiveMemoryLocalWriteProposalReviewChecklist({
    checklist: {
      ...input.checklist,
      local_review_notes: boundText(input.localReviewNotes, 1200),
    },
    proposalList: input.proposalList,
    queue: input.queue,
    nowIso: input.nowIso,
  });
}

export function markPerspectiveMemoryLocalWriteProposalReviewChecklistInReview(
  input: RecomputePerspectiveMemoryLocalWriteProposalReviewChecklistInput,
): PerspectiveMemoryLocalWriteProposalReviewChecklistV0 {
  const recomputed = recomputePerspectiveMemoryLocalWriteProposalReviewChecklist(
    input,
  );
  if (
    recomputed.checklist_status !== "blocked" &&
    recomputed.checklist_status !==
      "locally_ready_for_product_persistence_review"
  ) {
    return {
      ...recomputed,
      checklist_status: "in_review",
      updated_at: input.nowIso,
    };
  }
  return recomputed;
}

export function markPerspectiveMemoryLocalWriteProposalReviewChecklistReady(
  input: RecomputePerspectiveMemoryLocalWriteProposalReviewChecklistInput,
): PerspectiveMemoryLocalWriteProposalReviewChecklistV0 {
  return recomputePerspectiveMemoryLocalWriteProposalReviewChecklist(input);
}

export function loadPerspectiveMemoryLocalWriteProposalReviewChecklistListFromStorage(
  storage: OperatorFlowStorage,
  nowIso: string,
) {
  return safeParsePerspectiveMemoryLocalWriteProposalReviewChecklistList(
    storage.getItem(
      PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE,
    ),
    nowIso,
  );
}

export function savePerspectiveMemoryLocalWriteProposalReviewChecklistListToStorage(
  storage: OperatorFlowStorage,
  list: PerspectiveMemoryLocalWriteProposalReviewChecklistListV0,
) {
  storage.setItem(
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE,
    JSON.stringify(list),
  );
}

export function clearPerspectiveMemoryLocalWriteProposalReviewChecklistListFromStorage(
  storage: OperatorFlowStorage,
) {
  storage.removeItem(
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE,
  );
}

export function safeParsePerspectiveMemoryLocalWriteProposalReviewChecklistList(
  serialized: string | null,
  nowIso: string,
): PerspectiveMemoryLocalWriteProposalReviewChecklistListV0 {
  if (!serialized) {
    return createEmptyPerspectiveMemoryLocalWriteProposalReviewChecklistList(
      nowIso,
    );
  }
  try {
    const parsed = JSON.parse(serialized);
    if (
      !isRecord(parsed) ||
      parsed.checklist_list_version !==
        PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_LIST_VERSION ||
      typeof parsed.updated_at !== "string" ||
      !Array.isArray(parsed.checklists)
    ) {
      return createEmptyPerspectiveMemoryLocalWriteProposalReviewChecklistList(
        nowIso,
      );
    }
    const checklists = parsed.checklists
      .map((checklist) =>
        isPerspectiveMemoryLocalWriteProposalReviewChecklist(checklist)
          ? checklist
          : null,
      )
      .filter(
        (
          checklist,
        ): checklist is PerspectiveMemoryLocalWriteProposalReviewChecklistV0 =>
          checklist != null,
      );
    return normalizePerspectiveMemoryLocalWriteProposalReviewChecklistList(
      {
        checklist_list_version:
          PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_LIST_VERSION,
        updated_at: parsed.updated_at,
        checklists,
      },
      parsed.updated_at,
    );
  } catch {
    return createEmptyPerspectiveMemoryLocalWriteProposalReviewChecklistList(
      nowIso,
    );
  }
}

export function appendPerspectiveMemoryLocalWriteProposalReviewChecklistToList(
  list: PerspectiveMemoryLocalWriteProposalReviewChecklistListV0,
  checklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0,
  nowIso: string,
) {
  return normalizePerspectiveMemoryLocalWriteProposalReviewChecklistList(
    {
      ...list,
      updated_at: nowIso,
      checklists: [checklist, ...list.checklists],
    },
    nowIso,
  );
}

export function replacePerspectiveMemoryLocalWriteProposalReviewChecklistInList(
  list: PerspectiveMemoryLocalWriteProposalReviewChecklistListV0,
  checklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0,
  nowIso: string,
) {
  const exists = list.checklists.some(
    (item) => item.checklist_id === checklist.checklist_id,
  );
  return normalizePerspectiveMemoryLocalWriteProposalReviewChecklistList(
    {
      ...list,
      updated_at: nowIso,
      checklists: exists
        ? list.checklists.map((item) =>
            item.checklist_id === checklist.checklist_id ? checklist : item,
          )
        : [checklist, ...list.checklists],
    },
    nowIso,
  );
}

export function removePerspectiveMemoryLocalWriteProposalReviewChecklistFromList(
  list: PerspectiveMemoryLocalWriteProposalReviewChecklistListV0,
  checklistId: string,
  nowIso: string,
) {
  return normalizePerspectiveMemoryLocalWriteProposalReviewChecklistList(
    {
      ...list,
      updated_at: nowIso,
      checklists: list.checklists.filter(
        (checklist) => checklist.checklist_id !== checklistId,
      ),
    },
    nowIso,
  );
}

export function findPerspectiveMemoryLocalWriteProposalReviewChecklistByProposal(
  list: PerspectiveMemoryLocalWriteProposalReviewChecklistListV0,
  proposalId: string,
) {
  return (
    list.checklists.find(
      (checklist) => checklist.source_proposal_id === proposalId,
    ) ?? null
  );
}

export function getPerspectiveMemoryLocalWriteProposalReviewChecklistSourceProposalState(
  checklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0,
  proposalList: PerspectiveMemoryLocalWriteProposalListV0,
): PerspectiveMemoryLocalWriteProposalReviewChecklistSourceProposalState {
  const proposal =
    proposalList.proposals.find(
      (item) => item.proposal_id === checklist.source_proposal_id,
    ) ?? null;
  if (!proposal) {
    return "source_proposal_missing";
  }
  if (
    proposal.proposal_status === "rejected_locally" ||
    proposal.proposal_status === "superseded_locally"
  ) {
    return "source_proposal_removed_or_rejected";
  }
  if (
    proposal.proposal_status !== checklist.source_proposal_status_at_creation ||
    hashPerspectiveMemoryLocalWriteProposalForChecklist(proposal) !==
      checklist.source_proposal_hash
  ) {
    return "source_proposal_status_changed";
  }
  return "source_proposal_current";
}

export function collectPerspectiveMemoryLocalWriteProposalReviewChecklistListUnsafeMarkers(
  list: PerspectiveMemoryLocalWriteProposalReviewChecklistListV0,
) {
  return uniqueStrings(
    list.checklists.flatMap((checklist) =>
      collectPerspectiveMemoryLocalWriteProposalReviewChecklistUnsafeMarkers(
        checklist,
      ),
    ),
  );
}

export function collectPerspectiveMemoryLocalWriteProposalReviewChecklistUnsafeMarkers(
  checklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0,
) {
  const serialized = JSON.stringify(checklist);
  return unsafeChecklistMarkers.filter((marker) => serialized.includes(marker));
}

export function hashPerspectiveMemoryLocalWriteProposalForChecklist(
  proposal: PerspectiveMemoryLocalWriteProposalV0,
) {
  return `local-proposal-hash:${stableHash(stableStringify(proposal))}`;
}

function recomputeChecklistReadinessWithKnownState({
  checklist,
  sourceProposalState,
  sourceQueueItemState,
  sourceProposal,
  nowIso,
}: {
  checklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0;
  sourceProposalState: PerspectiveMemoryLocalWriteProposalReviewChecklistSourceProposalState;
  sourceQueueItemState: PerspectiveMemoryLocalWriteProposalSourceState;
  sourceProposal: PerspectiveMemoryLocalWriteProposalV0 | null;
  nowIso: string;
}) {
  const gates = checklist.gates;
  const counts = countChecklistGates(gates);
  const incompleteRequiredGates = Object.values(gates)
    .filter((gate) => gate.required && gate.status !== "checked")
    .map((gate) => gate.gate_id);
  const gateWarnings = collectChecklistGateWarnings(gates);
  const blockedReasons = collectReadinessBlockedReasons({
    checklist,
    sourceProposalState,
    sourceQueueItemState,
    sourceProposal,
    incompleteRequiredGates,
  });
  const ready =
    blockedReasons.length === 0 &&
    incompleteRequiredGates.length === 0 &&
    sourceProposal != null;
  const noGatesChecked = Object.values(gates).every(
    (gate) => gate.status !== "checked",
  );
  const checklistStatus: PerspectiveMemoryLocalWriteProposalReviewChecklistStatus =
    blockedReasons.some((reason) => reason.startsWith("source "))
      ? "blocked"
      : ready
        ? "locally_ready_for_product_persistence_review"
        : noGatesChecked
          ? "not_started"
          : "in_review";
  return {
    ...checklist,
    updated_at: nowIso,
    checklist_status: checklistStatus,
    required_gate_count: counts.requiredGateCount,
    completed_required_gate_count: counts.completedRequiredGateCount,
    optional_gate_count: counts.optionalGateCount,
    completed_optional_gate_count: counts.completedOptionalGateCount,
    readiness_summary: buildReadinessSummary({
      ready,
      blockedReasons,
      warnings: [
        ...gateWarnings,
        ...collectReadinessWarnings({
          sourceProposalState,
          sourceQueueItemState,
          sourceProposal,
        }),
      ],
      nextAction: ready
        ? "Locally ready for product persistence review; actual memory write remains unavailable."
        : "Complete required checklist gates or resolve source state before future persistence review.",
    }),
  };
}

function collectReadinessBlockedReasons({
  checklist,
  sourceProposalState,
  sourceQueueItemState,
  sourceProposal,
  incompleteRequiredGates,
}: {
  checklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0;
  sourceProposalState: PerspectiveMemoryLocalWriteProposalReviewChecklistSourceProposalState;
  sourceQueueItemState: PerspectiveMemoryLocalWriteProposalSourceState;
  sourceProposal: PerspectiveMemoryLocalWriteProposalV0 | null;
  incompleteRequiredGates: string[];
}) {
  const blockedReasons: string[] = [];
  if (!sourceProposal) {
    blockedReasons.push("source proposal missing");
  }
  if (sourceProposalState === "source_proposal_missing") {
    blockedReasons.push("source proposal missing");
  }
  if (sourceProposalState === "source_proposal_removed_or_rejected") {
    blockedReasons.push("source proposal rejected or superseded locally");
  }
  if (
    sourceProposal?.proposal_status === "rejected_locally" ||
    sourceProposal?.proposal_status === "superseded_locally"
  ) {
    blockedReasons.push("source proposal status is not eligible");
  }
  if (
    sourceQueueItemState === "source_queue_item_missing" ||
    sourceQueueItemState === "source_queue_item_removed"
  ) {
    blockedReasons.push(`source queue item state blocks readiness: ${sourceQueueItemState}`);
  }
  if (
    sourceQueueItemState === "source_queue_item_status_changed" &&
    checklist.gates.source_state_reviewed.status !== "checked"
  ) {
    blockedReasons.push("source queue item status changed and source_state_reviewed is unchecked");
  }
  if (
    sourceProposalState === "source_proposal_status_changed" &&
    checklist.gates.source_state_reviewed.status !== "checked"
  ) {
    blockedReasons.push("source proposal status changed and source_state_reviewed is unchecked");
  }
  if (sourceProposal?.proposed_memory_payload.should_write_to_memory_now !== false) {
    blockedReasons.push("source proposal must keep should_write_to_memory_now false");
  }
  if (
    sourceProposal &&
    sourceProposal.authority_boundary.local_write_proposal_only !== true
  ) {
    blockedReasons.push("source proposal must remain local_write_proposal_only");
  }
  if (sourceProposal) {
    for (const [field, value] of Object.entries(
      sourceProposal.authority_boundary,
    )) {
      if (field === "local_write_proposal_only") continue;
      if (value !== false) {
        blockedReasons.push(`source proposal authority flag must be false: ${field}`);
      }
    }
  }
  for (const gateId of incompleteRequiredGates) {
    blockedReasons.push(`required gate incomplete: ${gateId}`);
  }
  return uniqueStrings(blockedReasons);
}

function collectReadinessWarnings({
  sourceProposalState,
  sourceQueueItemState,
  sourceProposal,
}: {
  sourceProposalState: PerspectiveMemoryLocalWriteProposalReviewChecklistSourceProposalState;
  sourceQueueItemState: PerspectiveMemoryLocalWriteProposalSourceState;
  sourceProposal: PerspectiveMemoryLocalWriteProposalV0 | null;
}) {
  return uniqueStrings([
    ...(sourceProposalState === "source_proposal_status_changed"
      ? ["source proposal status changed after checklist creation"]
      : []),
    ...(sourceQueueItemState === "source_queue_item_status_changed"
      ? ["source queue item status changed after proposal creation"]
      : []),
    ...(sourceProposal?.source_validation_result_state === "PASS with follow-up"
      ? ["PASS with follow-up requires explicit caveat review before persistence review"]
      : []),
  ]);
}

function collectChecklistGateWarnings(
  gates: PerspectiveMemoryLocalWriteProposalReviewChecklistGates,
) {
  return Object.values(gates)
    .filter((gate) => gate.status === "blocked")
    .map((gate) => `gate blocked: ${gate.gate_id}`);
}

function countChecklistGates(
  gates: PerspectiveMemoryLocalWriteProposalReviewChecklistGates,
) {
  const values = Object.values(gates);
  const required = values.filter((gate) => gate.required);
  const optional = values.filter((gate) => !gate.required);
  return {
    requiredGateCount: required.length,
    completedRequiredGateCount: required.filter(
      (gate) => gate.status === "checked",
    ).length,
    optionalGateCount: optional.length,
    completedOptionalGateCount: optional.filter(
      (gate) => gate.status === "checked" || gate.status === "not_applicable",
    ).length,
  };
}

function buildInitialChecklistGates(
  proposal: PerspectiveMemoryLocalWriteProposalV0,
): PerspectiveMemoryLocalWriteProposalReviewChecklistGates {
  const passFollowUpRequired =
    proposal.source_validation_result_state === "PASS with follow-up";
  const supersedeRequired = isSupersedeWriteProposal(proposal);
  return {
    source_refs_reviewed: buildGate("source_refs_reviewed", "Source refs reviewed", true),
    validation_result_reviewed: buildGate(
      "validation_result_reviewed",
      "Validation result reviewed",
      true,
    ),
    pass_follow_up_caveat_reviewed: buildGate(
      "pass_follow_up_caveat_reviewed",
      "PASS with follow-up caveat reviewed",
      passFollowUpRequired,
      passFollowUpRequired ? "unchecked" : "not_applicable",
    ),
    proposed_payload_reviewed: buildGate(
      "proposed_payload_reviewed",
      "Proposed payload reviewed",
      true,
    ),
    raw_material_exclusion_reviewed: buildGate(
      "raw_material_exclusion_reviewed",
      "Raw material exclusion reviewed",
      true,
    ),
    authority_boundary_reviewed: buildGate(
      "authority_boundary_reviewed",
      "Authority boundary reviewed",
      true,
    ),
    risk_notes_reviewed: buildGate(
      "risk_notes_reviewed",
      "Risk notes reviewed",
      true,
    ),
    unresolved_tensions_reviewed: buildGate(
      "unresolved_tensions_reviewed",
      "Unresolved tensions reviewed",
      true,
    ),
    carry_forward_questions_reviewed: buildGate(
      "carry_forward_questions_reviewed",
      "Carry-forward questions reviewed",
      true,
    ),
    source_state_reviewed: buildGate(
      "source_state_reviewed",
      "Source proposal and queue state reviewed",
      true,
    ),
    supersede_impact_reviewed: buildGate(
      "supersede_impact_reviewed",
      "Supersede impact reviewed",
      supersedeRequired,
      supersedeRequired ? "unchecked" : "not_applicable",
    ),
    final_user_intent_confirmed: buildGate(
      "final_user_intent_confirmed",
      "Final user intent confirmed",
      true,
    ),
  };
}

function buildGate(
  gateId: PerspectiveMemoryLocalWriteProposalReviewChecklistGateId,
  label: string,
  required: boolean,
  status: ChecklistGateStatus = "unchecked",
): ChecklistGate {
  return {
    gate_id: gateId,
    label,
    required,
    status,
  };
}

function isSupersedeWriteProposal(
  proposal: PerspectiveMemoryLocalWriteProposalV0,
) {
  return (
    proposal.source_candidate_action === "supersede_previous_candidate" ||
    proposal.source_candidate_local_status === "supersedes_previous_candidate"
  );
}

function buildReadinessSummary({
  ready,
  blockedReasons,
  warnings,
  nextAction,
}: {
  ready: boolean;
  blockedReasons: string[];
  warnings: string[];
  nextAction: string;
}): PerspectiveMemoryLocalWriteProposalReadinessSummaryV0 {
  return {
    readiness_version:
      PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_READINESS_SUMMARY_VERSION,
    ready_for_product_persistence_review: ready,
    ready_for_memory_write_now: false,
    blocked_reasons: uniqueStrings(blockedReasons).map((reason) =>
      boundText(reason, 260),
    ),
    warnings: uniqueStrings(warnings).map((warning) => boundText(warning, 260)),
    next_action: nextAction,
  };
}

function normalizePerspectiveMemoryLocalWriteProposalReviewChecklistList(
  list: PerspectiveMemoryLocalWriteProposalReviewChecklistListV0,
  updatedAt: string,
): PerspectiveMemoryLocalWriteProposalReviewChecklistListV0 {
  const dedupedChecklists = new Map<
    string,
    PerspectiveMemoryLocalWriteProposalReviewChecklistV0
  >();
  for (const checklist of list.checklists) {
    if (
      collectPerspectiveMemoryLocalWriteProposalReviewChecklistUnsafeMarkers(
        checklist,
      ).length > 0
    ) {
      continue;
    }
    if (!dedupedChecklists.has(checklist.checklist_id)) {
      dedupedChecklists.set(checklist.checklist_id, checklist);
    }
  }
  return {
    checklist_list_version:
      PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_LIST_VERSION,
    updated_at: updatedAt,
    checklists: Array.from(dedupedChecklists.values())
      .sort((left, right) =>
        checklistSortValue(right).localeCompare(checklistSortValue(left)),
      )
      .slice(
        0,
        PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_MAX_ITEMS,
      ),
  };
}

function isPerspectiveMemoryLocalWriteProposalReviewChecklist(
  value: unknown,
): value is PerspectiveMemoryLocalWriteProposalReviewChecklistV0 {
  if (!isRecord(value)) return false;
  const shapeIsValid =
    value.checklist_version ===
      PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_VERSION &&
    hasText(value.checklist_id) &&
    hasText(value.created_at) &&
    hasText(value.updated_at) &&
    value.source === "perspective_memory_local_write_proposal" &&
    hasText(value.source_proposal_id) &&
    hasText(value.source_queue_item_id) &&
    hasText(value.source_candidate_draft_id) &&
    isProposalValidationResultState(value.source_validation_result_state) &&
    isProposalStatus(value.source_proposal_status_at_creation) &&
    hasText(value.source_proposal_hash) &&
    isProposalSourceState(value.source_queue_item_state_at_creation) &&
    isChecklistStatus(value.checklist_status) &&
    typeof value.required_gate_count === "number" &&
    typeof value.completed_required_gate_count === "number" &&
    typeof value.optional_gate_count === "number" &&
    typeof value.completed_optional_gate_count === "number" &&
    isChecklistGates(value.gates) &&
    typeof value.local_review_notes === "string" &&
    isReadinessSummary(value.readiness_summary) &&
    isChecklistAuthorityBoundary(value.authority_boundary);
  return (
    shapeIsValid &&
    collectPerspectiveMemoryLocalWriteProposalReviewChecklistUnsafeMarkers(
      value as PerspectiveMemoryLocalWriteProposalReviewChecklistV0,
    ).length === 0
  );
}

function isChecklistGates(
  value: unknown,
): value is PerspectiveMemoryLocalWriteProposalReviewChecklistGates {
  if (!isRecord(value)) return false;
  return PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_GATE_IDS.every(
    (gateId) => isChecklistGate(value[gateId], gateId),
  );
}

function isChecklistGate(
  value: unknown,
  gateId: PerspectiveMemoryLocalWriteProposalReviewChecklistGateId,
): value is ChecklistGate {
  return (
    isRecord(value) &&
    value.gate_id === gateId &&
    typeof value.label === "string" &&
    typeof value.required === "boolean" &&
    isGateStatus(value.status) &&
    (value.checked_at == null || typeof value.checked_at === "string") &&
    (value.local_note == null || typeof value.local_note === "string")
  );
}

function isReadinessSummary(
  value: unknown,
): value is PerspectiveMemoryLocalWriteProposalReadinessSummaryV0 {
  return (
    isRecord(value) &&
    value.readiness_version ===
      PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_READINESS_SUMMARY_VERSION &&
    typeof value.ready_for_product_persistence_review === "boolean" &&
    value.ready_for_memory_write_now === false &&
    Array.isArray(value.blocked_reasons) &&
    Array.isArray(value.warnings) &&
    typeof value.next_action === "string"
  );
}

function isChecklistAuthorityBoundary(value: unknown) {
  return (
    isRecord(value) &&
    value.local_checklist_only === true &&
    value.accepted_augnes_memory_created === false &&
    value.product_db_persistence === false &&
    value.review_decision_created === false &&
    value.core_decision_created === false &&
    value.runtime_handoff_created === false &&
    value.automatic_promotion === false
  );
}

function buildChecklistAuthorityBoundary():
  PerspectiveMemoryLocalWriteProposalReviewChecklistV0["authority_boundary"] {
  return {
    local_checklist_only: true,
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

function isProposalSourceState(
  value: unknown,
): value is PerspectiveMemoryLocalWriteProposalSourceState {
  return (
    value === "source_queue_item_current" ||
    value === "source_queue_item_status_changed" ||
    value === "source_queue_item_missing" ||
    value === "source_queue_item_removed" ||
    value === "not_checked"
  );
}

function isChecklistStatus(
  value: unknown,
): value is PerspectiveMemoryLocalWriteProposalReviewChecklistStatus {
  return (
    value === "not_started" ||
    value === "in_review" ||
    value === "blocked" ||
    value === "locally_ready_for_product_persistence_review"
  );
}

function isGateStatus(value: unknown): value is ChecklistGateStatus {
  return (
    value === "unchecked" ||
    value === "checked" ||
    value === "not_applicable" ||
    value === "blocked"
  );
}

function checklistSortValue(
  checklist: PerspectiveMemoryLocalWriteProposalReviewChecklistV0,
) {
  return checklist.updated_at || checklist.created_at || "";
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
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

const unsafeChecklistMarkers = [
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
