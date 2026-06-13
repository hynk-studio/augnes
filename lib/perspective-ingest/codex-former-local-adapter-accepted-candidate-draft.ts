import type {
  OperatorFlowCandidateAction,
  OperatorFlowStorage,
  OperatorFlowValidationPreview,
} from "@/lib/perspective-ingest/codex-former-local-adapter-operator-flow";

export const CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_VERSION =
  "codex_former_local_adapter_accepted_candidate_draft.v0.1";
export const CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_STORAGE_NAMESPACE =
  "augnes.codexFormer.localAdapterAcceptedCandidateDrafts.v0.1";

export type CodexFormerLocalAdapterAcceptedCandidateDraftAction =
  | "accept_as_perspective_candidate"
  | "reject_from_memory_candidate"
  | "supersede_previous_candidate";

export type CodexFormerLocalAdapterAcceptedCandidateDraftLocalStatus =
  | "draft_candidate"
  | "rejected_memory_candidate"
  | "supersedes_previous_candidate";

export type CodexFormerLocalAdapterAcceptedCandidateDraftV0 = {
  draft_version: typeof CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_VERSION;
  draft_id: string;
  created_at: string;
  updated_at: string;
  source: "operator_flow";
  operator_flow_draft_id: string;
  candidate_action: CodexFormerLocalAdapterAcceptedCandidateDraftAction;
  validation_result_state: "PASS" | "PASS with follow-up" | "BLOCKED";
  validation_source: "real_local_validate_execution";
  validation_summary_hash: string;
  source_input_ref: string;
  source_input_hash: string;
  prepare_summary_ref: string;
  prepare_execution_summary_hash: string;
  returned_envelope_hash: string;
  candidate_count: number;
  candidate_compatible_review_material: boolean;
  candidate_basis_quality: string | null;
  candidate_authority: string | null;
  worker_facing_guidance_status: string;
  warnings: string[];
  pointer_warnings: string[];
  next_safe_action: string;
  review_summary: string;
  changed_files_count: number;
  source_pr_refs: string[];
  supersedes_draft_id?: string;
  local_status: CodexFormerLocalAdapterAcceptedCandidateDraftLocalStatus;
  authority_boundary: {
    local_draft_only: true;
    accepted_augnes_state_created: false;
    review_decision_created: false;
    product_db_persistence: false;
    core_decision_created: false;
    runtime_handoff_created: false;
    automatic_promotion: false;
  };
};

export type BuildCodexFormerLocalAdapterAcceptedCandidateDraftInput = {
  nowIso: string;
  draftId: string;
  operatorFlowDraftId: string;
  candidateAction: OperatorFlowCandidateAction;
  validation: OperatorFlowValidationPreview;
  sourceInputRef: string;
  prepareSummaryRef: string;
  reviewSummary: string;
  changedFilesCount: number;
  sourcePrRefs: string[];
  supersedesDraftId?: string | null;
};

export type BuildCodexFormerLocalAdapterAcceptedCandidateDraftResult =
  | {
      ok: true;
      draft: CodexFormerLocalAdapterAcceptedCandidateDraftV0;
    }
  | {
      ok: false;
      blocked_reasons: string[];
    };

export function buildCodexFormerLocalAdapterAcceptedCandidateDraft(
  input: BuildCodexFormerLocalAdapterAcceptedCandidateDraftInput,
): BuildCodexFormerLocalAdapterAcceptedCandidateDraftResult {
  const candidateAction = asAcceptedCandidateDraftAction(input.candidateAction);
  if (!candidateAction) {
    return {
      ok: false,
      blocked_reasons: ["candidate_action is not a local candidate draft action"],
    };
  }

  const blockedReasons = collectCandidateDraftEligibilityBlockedReasons({
    candidateAction,
    validation: input.validation,
    supersedesDraftId: input.supersedesDraftId,
  });
  if (blockedReasons.length > 0) {
    return { ok: false, blocked_reasons: blockedReasons };
  }

  const localStatus = buildLocalStatus(candidateAction);
  const supersedesDraftId =
    candidateAction === "supersede_previous_candidate" &&
    typeof input.supersedesDraftId === "string" &&
    input.supersedesDraftId.trim()
      ? input.supersedesDraftId.trim().slice(0, 240)
      : undefined;

  const draft: CodexFormerLocalAdapterAcceptedCandidateDraftV0 = {
    draft_version: CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_VERSION,
    draft_id: input.draftId,
    created_at: input.nowIso,
    updated_at: input.nowIso,
    source: "operator_flow",
    operator_flow_draft_id: input.operatorFlowDraftId,
    candidate_action: candidateAction,
    validation_result_state: input.validation.result_state,
    validation_source: "real_local_validate_execution",
    validation_summary_hash: input.validation.validation_summary_hash,
    source_input_ref: input.sourceInputRef,
    source_input_hash: input.validation.source_input_hash,
    prepare_summary_ref: input.prepareSummaryRef,
    prepare_execution_summary_hash:
      input.validation.prepare_execution_summary_hash,
    returned_envelope_hash: input.validation.returned_envelope_hash,
    candidate_count: input.validation.candidate_count,
    candidate_compatible_review_material:
      input.validation.candidate_compatible_review_material,
    candidate_basis_quality: input.validation.candidate_basis_quality,
    candidate_authority: input.validation.candidate_authority,
    worker_facing_guidance_status:
      input.validation.worker_facing_guidance_status,
    warnings: boundedStrings(input.validation.warnings),
    pointer_warnings: boundedStrings(input.validation.pointer_warnings),
    next_safe_action: input.validation.next_safe_action.slice(0, 1000),
    review_summary: input.reviewSummary.slice(0, 1000),
    changed_files_count: input.changedFilesCount,
    source_pr_refs: boundedStrings(input.sourcePrRefs),
    ...(supersedesDraftId ? { supersedes_draft_id: supersedesDraftId } : {}),
    local_status: localStatus,
    authority_boundary: buildLocalDraftAuthorityBoundary(),
  };

  const unsafeMarkers = collectAcceptedCandidateDraftUnsafeMarkers(draft);
  if (unsafeMarkers.length > 0) {
    return {
      ok: false,
      blocked_reasons: unsafeMarkers.map(
        (marker) => `candidate draft contains unsafe marker: ${marker}`,
      ),
    };
  }

  return { ok: true, draft };
}

export function canBuildCodexFormerLocalAdapterAcceptedCandidateDraft(
  input: Pick<
    BuildCodexFormerLocalAdapterAcceptedCandidateDraftInput,
    "candidateAction" | "validation" | "supersedesDraftId"
  >,
) {
  const candidateAction = asAcceptedCandidateDraftAction(input.candidateAction);
  if (!candidateAction) {
    return {
      eligible: false,
      blocked_reasons: ["candidate_action is not a local candidate draft action"],
    };
  }
  const blockedReasons = collectCandidateDraftEligibilityBlockedReasons({
    candidateAction,
    validation: input.validation,
    supersedesDraftId: input.supersedesDraftId,
  });
  return {
    eligible: blockedReasons.length === 0,
    blocked_reasons: blockedReasons,
  };
}

export function saveCodexFormerLocalAdapterAcceptedCandidateDraftToStorage(
  storage: OperatorFlowStorage,
  draft: CodexFormerLocalAdapterAcceptedCandidateDraftV0,
) {
  storage.setItem(
    CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_STORAGE_NAMESPACE,
    JSON.stringify(draft),
  );
}

export function loadCodexFormerLocalAdapterAcceptedCandidateDraftFromStorage(
  storage: OperatorFlowStorage,
) {
  return safeParseCodexFormerLocalAdapterAcceptedCandidateDraft(
    storage.getItem(
      CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_STORAGE_NAMESPACE,
    ),
  );
}

export function clearCodexFormerLocalAdapterAcceptedCandidateDraftFromStorage(
  storage: OperatorFlowStorage,
) {
  storage.removeItem(
    CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_STORAGE_NAMESPACE,
  );
}

export function safeParseCodexFormerLocalAdapterAcceptedCandidateDraft(
  serialized: string | null,
): CodexFormerLocalAdapterAcceptedCandidateDraftV0 | null {
  if (!serialized) return null;
  try {
    const parsed = JSON.parse(serialized);
    if (!isAcceptedCandidateDraft(parsed)) return null;
    if (collectAcceptedCandidateDraftUnsafeMarkers(parsed).length > 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function isCodexFormerLocalAdapterAcceptedCandidateDraftStale(
  draft: CodexFormerLocalAdapterAcceptedCandidateDraftV0,
  validation: OperatorFlowValidationPreview,
) {
  return (
    draft.validation_summary_hash !== validation.validation_summary_hash ||
    draft.source_input_hash !== validation.source_input_hash ||
    draft.prepare_execution_summary_hash !==
      validation.prepare_execution_summary_hash ||
    draft.returned_envelope_hash !== validation.returned_envelope_hash
  );
}

export function collectAcceptedCandidateDraftUnsafeMarkers(
  draft: CodexFormerLocalAdapterAcceptedCandidateDraftV0,
) {
  const serialized = JSON.stringify(draft);
  return unsafeDraftMarkers.filter((marker) => serialized.includes(marker));
}

function collectCandidateDraftEligibilityBlockedReasons({
  candidateAction,
  validation,
  supersedesDraftId,
}: {
  candidateAction: CodexFormerLocalAdapterAcceptedCandidateDraftAction;
  validation: OperatorFlowValidationPreview;
  supersedesDraftId?: string | null;
}) {
  const blockedReasons: string[] = [];
  if (validation.validation_source !== "real_local_validate_execution") {
    blockedReasons.push("validation_source must be real_local_validate_execution");
  }
  if (candidateAction === "accept_as_perspective_candidate") {
    blockedReasons.push(...collectPassCandidateBlockedReasons(validation));
  }
  if (candidateAction === "reject_from_memory_candidate") {
    if (!["PASS", "PASS with follow-up", "BLOCKED"].includes(validation.result_state)) {
      blockedReasons.push("reject draft requires PASS, PASS with follow-up, or BLOCKED validation");
    }
  }
  if (candidateAction === "supersede_previous_candidate") {
    blockedReasons.push(...collectPassCandidateBlockedReasons(validation));
    if (!supersedesDraftId?.trim()) {
      blockedReasons.push("supersede draft requires supersede_previous_candidate_ref");
    }
  }
  return uniqueStrings(blockedReasons);
}

function collectPassCandidateBlockedReasons(
  validation: OperatorFlowValidationPreview,
) {
  const blockedReasons: string[] = [];
  if (
    validation.result_state !== "PASS" &&
    validation.result_state !== "PASS with follow-up"
  ) {
    blockedReasons.push("candidate draft requires PASS or PASS with follow-up validation");
  }
  if (validation.candidate_count !== 1) {
    blockedReasons.push("candidate draft requires candidate_count === 1");
  }
  if (validation.candidate_compatible_review_material !== true) {
    blockedReasons.push("candidate draft requires candidate-compatible review material");
  }
  if (validation.candidate_authority !== "non_committed") {
    blockedReasons.push("candidate authority must be non_committed");
  }
  for (const [field, value] of Object.entries(validation.authority_flags)) {
    if (value !== false) {
      blockedReasons.push(`authority flag must be false: ${field}`);
    }
  }
  return blockedReasons;
}

function buildLocalStatus(
  candidateAction: CodexFormerLocalAdapterAcceptedCandidateDraftAction,
): CodexFormerLocalAdapterAcceptedCandidateDraftLocalStatus {
  if (candidateAction === "reject_from_memory_candidate") {
    return "rejected_memory_candidate";
  }
  if (candidateAction === "supersede_previous_candidate") {
    return "supersedes_previous_candidate";
  }
  return "draft_candidate";
}

function asAcceptedCandidateDraftAction(
  action: OperatorFlowCandidateAction,
): CodexFormerLocalAdapterAcceptedCandidateDraftAction | null {
  if (
    action === "accept_as_perspective_candidate" ||
    action === "reject_from_memory_candidate" ||
    action === "supersede_previous_candidate"
  ) {
    return action;
  }
  return null;
}

function isAcceptedCandidateDraft(
  value: unknown,
): value is CodexFormerLocalAdapterAcceptedCandidateDraftV0 {
  if (!isRecord(value)) return false;
  return (
    value.draft_version ===
      CODEX_FORMER_LOCAL_ADAPTER_ACCEPTED_CANDIDATE_DRAFT_VERSION &&
    hasText(value.draft_id) &&
    hasText(value.created_at) &&
    hasText(value.updated_at) &&
    value.source === "operator_flow" &&
    hasText(value.operator_flow_draft_id) &&
    (value.candidate_action === "accept_as_perspective_candidate" ||
      value.candidate_action === "reject_from_memory_candidate" ||
      value.candidate_action === "supersede_previous_candidate") &&
    isDraftResultStateAllowedForAction(
      value.candidate_action,
      value.validation_result_state,
    ) &&
    value.validation_source === "real_local_validate_execution" &&
    hasText(value.validation_summary_hash) &&
    hasText(value.source_input_ref) &&
    hasText(value.source_input_hash) &&
    hasText(value.prepare_summary_ref) &&
    hasText(value.prepare_execution_summary_hash) &&
    hasText(value.returned_envelope_hash) &&
    typeof value.candidate_count === "number" &&
    typeof value.candidate_compatible_review_material === "boolean" &&
    hasText(value.worker_facing_guidance_status) &&
    Array.isArray(value.warnings) &&
    Array.isArray(value.pointer_warnings) &&
    hasText(value.next_safe_action) &&
    hasText(value.review_summary) &&
    typeof value.changed_files_count === "number" &&
    Array.isArray(value.source_pr_refs) &&
    (value.local_status === "draft_candidate" ||
      value.local_status === "rejected_memory_candidate" ||
      value.local_status === "supersedes_previous_candidate") &&
    isRecord(value.authority_boundary) &&
    value.authority_boundary.local_draft_only === true &&
    value.authority_boundary.accepted_augnes_state_created === false &&
    value.authority_boundary.review_decision_created === false &&
    value.authority_boundary.product_db_persistence === false &&
    value.authority_boundary.core_decision_created === false &&
    value.authority_boundary.runtime_handoff_created === false &&
    value.authority_boundary.automatic_promotion === false
  );
}

function buildLocalDraftAuthorityBoundary():
  CodexFormerLocalAdapterAcceptedCandidateDraftV0["authority_boundary"] {
  return {
    local_draft_only: true,
    accepted_augnes_state_created: false,
    review_decision_created: false,
    product_db_persistence: false,
    core_decision_created: false,
    runtime_handoff_created: false,
    automatic_promotion: false,
  };
}

function isDraftResultStateAllowedForAction(
  candidateAction: unknown,
  resultState: unknown,
) {
  if (
    candidateAction === "accept_as_perspective_candidate" ||
    candidateAction === "supersede_previous_candidate"
  ) {
    return resultState === "PASS" || resultState === "PASS with follow-up";
  }
  return (
    candidateAction === "reject_from_memory_candidate" &&
    (resultState === "PASS" ||
      resultState === "PASS with follow-up" ||
      resultState === "BLOCKED")
  );
}

function boundedStrings(values: string[]) {
  return values.map((value) => value.slice(0, 1000));
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

const unsafeDraftMarkers = [
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
