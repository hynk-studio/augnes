export const MANUAL_NOTE_DISABLED_WRITE_ADAPTER_TRANSACTION_PLAN_VERSION =
  "manual_note_disabled_write_adapter_transaction_plan.v0.1" as const;

export const MANUAL_NOTE_DISABLED_WRITE_ADAPTER_ABORT_RESULT_VERSION =
  "manual_note_disabled_write_adapter_abort_result.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type BuildManualNoteDisabledWriteAdapterTransactionPlanInput = {
  disabledAdapterReadiness: unknown;
  contractReview: unknown;
  tempHarness: unknown;
  contractTestReport?: unknown | null;
  label?: string | null;
  generated_at?: string | null;
};

type BuildManualNoteDisabledWriteAdapterAbortOnlyResultInput = {
  transactionPlan: ManualNoteDisabledWriteAdapterTransactionPlan;
  label?: string | null;
  generated_at?: string | null;
};

type DisabledTransactionOperation = {
  operation_id: `disabled-plan-op:${string}`;
  source_temp_intent_id: `temp-intent:${string}`;
  operation_kind: string;
  target_kind: string;
  product_record_id: null;
  canonical_id: null;
  proof_id: null;
  evidence_id: null;
  perspective_id: null;
  canonical_graph_edge_id: null;
  work_item_id: null;
  product_write_allowed: false;
  commit_allowed: false;
  rollback_required_if_future_commit: true;
  audit_required_if_future_commit: true;
  temp_harness_only: true;
};

type DisabledTransactionBoundary = {
  disabled_transaction_plan_only: true;
  abort_only_harness: true;
  normal_product_write_enabled: false;
  product_db_write: false;
  actual_promotion_performed: false;
  proof_or_evidence_writes: false;
  perspective_or_canonical_writes: false;
  canonical_graph_write: false;
  work_item_creation: false;
  provider_or_openai_calls: false;
  retrieval_or_rag: false;
  source_fetching: false;
  external_handoff_sent: false;
  durable_persistence: false;
  browser_persistence: false;
};

type AbortBoundary = {
  abort_only: true;
  normal_product_write_enabled: false;
  product_db_write: false;
  actual_promotion_performed: false;
  proof_or_evidence_writes: false;
  perspective_or_canonical_writes: false;
  canonical_graph_write: false;
  work_item_creation: false;
  provider_or_openai_calls: false;
  retrieval_or_rag: false;
  source_fetching: false;
  external_handoff_sent: false;
  durable_persistence: false;
  browser_persistence: false;
};

export type ManualNoteDisabledWriteAdapterTransactionPlan = {
  plan_kind: "manual_note_disabled_write_adapter_transaction_plan";
  plan_version: typeof MANUAL_NOTE_DISABLED_WRITE_ADAPTER_TRANSACTION_PLAN_VERSION;
  plan_fingerprint: string;
  preview_draft_id: string;
  source_chain: {
    disabled_readiness_fingerprint: string | null;
    contract_review_fingerprint: string | null;
    temp_harness_fingerprint: string | null;
    contract_test_report_fingerprint: string | null;
    contract_test_final_status: string | null;
  };
  plan_status: "blocked_before_commit" | "ready_for_abort_only_harness";
  plan_summary: string;
  operation_groups: {
    claim_operations: DisabledTransactionOperation[];
    evidence_operations: DisabledTransactionOperation[];
    perspective_operations: DisabledTransactionOperation[];
    source_verification_operations: DisabledTransactionOperation[];
    work_item_operations: DisabledTransactionOperation[];
  };
  idempotency_plan: {
    idempotency_required: true;
    idempotency_key_kind: "disabled_plan_only";
    idempotency_key_generated_now: true;
    product_idempotency_storage_added: false;
    durable_idempotency_storage_added: false;
    proposed_future_key_inputs: [
      "preview_draft_id",
      "transaction_plan_fingerprint",
      "contract_test_report_fingerprint",
      "future_operator_decision_id",
    ];
  };
  rollback_plan: {
    rollback_required: true;
    rollback_plan_generated_now: true;
    rollback_executed_now: false;
    product_rollback_performed: false;
    durable_rollback_storage_added: false;
  };
  review_audit_plan: {
    audit_required: true;
    audit_plan_generated_now: true;
    audit_record_created_now: false;
    approval_history_created_now: false;
    durable_audit_storage_added: false;
  };
  source_evidence_authority_plan: {
    source_fetching_performed_now: false;
    source_verification_performed_now: false;
    evidence_records_created_now: false;
    proof_records_created_now: false;
    required_before_future_commit: true;
  };
  commit_blockers: string[];
  execution_boundary: DisabledTransactionBoundary;
  local_copy_packet: {
    markdown: string;
    json: string;
    fingerprint: string;
    fingerprint_algorithm: "fnv1a32_canonical_json";
    local_clipboard_only: true;
    external_handoff_sent: false;
    packet_persisted: false;
    product_write_authority_granted: false;
    actual_promotion_allowed: false;
  };
  next_recommended_slice: "disabled_transaction_plan_fixture_execution_tests";
};

type ManualNoteDisabledWriteAdapterTransactionPlanCopySource = Omit<
  ManualNoteDisabledWriteAdapterTransactionPlan,
  "local_copy_packet"
>;

type AbortOperationResult = {
  operation_id: string;
  status: "aborted_before_product_write";
  product_write_attempted: false;
  product_write_performed: false;
  product_record_id: null;
  canonical_id: null;
  proof_id: null;
  evidence_id: null;
  perspective_id: null;
  canonical_graph_edge_id: null;
  work_item_id: null;
};

export type ManualNoteDisabledWriteAdapterAbortOnlyResult = {
  result_kind: "manual_note_disabled_write_adapter_abort_result";
  result_version: typeof MANUAL_NOTE_DISABLED_WRITE_ADAPTER_ABORT_RESULT_VERSION;
  result_fingerprint: string;
  preview_draft_id: string;
  source_transaction_plan_fingerprint: string;
  execution_mode: "abort_only_non_product_harness";
  result_status: "aborted_before_product_write";
  abort_reason: "Disabled adapter transaction plans cannot commit product writes.";
  operation_results: AbortOperationResult[];
  idempotency_result: {
    idempotency_key_generated_now: true;
    idempotency_storage_added: false;
    product_idempotency_storage_added: false;
  };
  rollback_result: {
    rollback_needed_for_current_run: false;
    rollback_executed_now: false;
    product_rollback_performed: false;
    rollback_storage_added: false;
  };
  review_audit_result: {
    audit_record_created_now: false;
    approval_history_created_now: false;
    durable_audit_storage_added: false;
  };
  abort_boundary: AbortBoundary;
  local_copy_packet: {
    markdown: string;
    json: string;
    fingerprint: string;
    fingerprint_algorithm: "fnv1a32_canonical_json";
    local_clipboard_only: true;
    external_handoff_sent: false;
    packet_persisted: false;
    product_write_authority_granted: false;
    actual_promotion_allowed: false;
  };
  next_recommended_slice: "disabled_transaction_plan_fixture_execution_tests";
};

type ManualNoteDisabledWriteAdapterAbortOnlyResultCopySource = Omit<
  ManualNoteDisabledWriteAdapterAbortOnlyResult,
  "local_copy_packet"
>;

const BASE_COMMIT_BLOCKERS = [
  "explicit_operator_decision_missing",
  "source_verification_authority_missing",
  "proof_evidence_write_authority_missing",
  "canonical_perspective_write_authority_missing",
  "durable_idempotency_storage_missing",
  "rollback_contract_missing",
  "audit_record_contract_missing",
  "enabled_adapter_review_missing",
  "product_write_route_missing",
] as const;

const MAX_DISPLAY_LABEL_LENGTH = 120;

const PRODUCT_ID_KEYS = new Set([
  "product_record_id",
  "canonical_id",
  "canonical_claim_id",
  "canonical_claim_id_created_now",
  "canonical_graph_edge_id",
  "canonical_graph_edge_id_created_now",
  "proof_id",
  "proof_id_created_now",
  "evidence_id",
  "evidence_id_created_now",
  "perspective_id",
  "perspective_id_created_now",
  "work_item_id",
  "work_item_id_created_now",
]);

export function buildManualNoteDisabledWriteAdapterTransactionPlan(
  input: BuildManualNoteDisabledWriteAdapterTransactionPlanInput,
): ManualNoteDisabledWriteAdapterTransactionPlan {
  const readiness = asRecord(input.disabledAdapterReadiness);
  const contractReview = asRecord(input.contractReview);
  const tempHarness = asRecord(input.tempHarness);
  const contractTestReport = input.contractTestReport
    ? asRecord(input.contractTestReport)
    : null;
  const sourceChain = {
    disabled_readiness_fingerprint: getString(readiness, [
      "local_copy_packet",
      "fingerprint",
    ]),
    contract_review_fingerprint: getString(contractReview, [
      "review_fingerprint",
    ]),
    temp_harness_fingerprint: getString(tempHarness, ["harness_fingerprint"]),
    contract_test_report_fingerprint: contractTestReport
      ? getString(contractTestReport, ["suite_fingerprint"])
      : null,
    contract_test_final_status: contractTestReport
      ? getString(contractTestReport, ["final_status"])
      : null,
  };
  const operationGroups = buildOperationGroups(tempHarness);
  const unsafeInputProductIds = collectNonNullProductIdPaths({
    disabled_readiness: readiness,
    contract_review: contractReview,
    temp_harness: tempHarness,
  });
  const invalidTempIntentIds = collectInvalidTempIntentIds(tempHarness);
  const commitBlockers = buildCommitBlockers({
    contractTestReport,
    tempHarness,
    unsafeInputProductIds,
    invalidTempIntentIds,
  });
  const planStatus =
    contractTestReport?.final_status === "pass" &&
    tempHarness.harness_status === "temp_harness_ready" &&
    unsafeInputProductIds.length === 0 &&
    invalidTempIntentIds.length === 0
      ? "ready_for_abort_only_harness"
      : "blocked_before_commit";
  const previewDraftId = getString(readiness, ["preview_draft_id"]) ??
    getString(tempHarness, ["preview_draft_id"]) ??
    "unknown_preview_draft";
  const executionBoundary = buildDisabledTransactionBoundary();
  const planWithoutCopy: ManualNoteDisabledWriteAdapterTransactionPlanCopySource = {
    plan_kind: "manual_note_disabled_write_adapter_transaction_plan",
    plan_version: MANUAL_NOTE_DISABLED_WRITE_ADAPTER_TRANSACTION_PLAN_VERSION,
    plan_fingerprint: createManualNoteDisabledWriteAdapterTransactionPlanFingerprint({
      disabledAdapterReadiness: readiness,
      contractReview,
      tempHarness,
      contractTestReport,
      label: normalizeDisplayLabel(input.label),
      generated_at: input.generated_at ?? null,
    }),
    preview_draft_id: previewDraftId,
    source_chain: sourceChain,
    plan_status: planStatus,
    plan_summary:
      planStatus === "ready_for_abort_only_harness"
        ? "Validated disabled adapter fixtures can be represented as an in-memory transaction plan, but every operation remains blocked from commit."
        : "Disabled adapter transaction plan is blocked before commit because required fixture authority or safety checks are incomplete.",
    operation_groups: operationGroups,
    idempotency_plan: {
      idempotency_required: true,
      idempotency_key_kind: "disabled_plan_only",
      idempotency_key_generated_now: true,
      product_idempotency_storage_added: false,
      durable_idempotency_storage_added: false,
      proposed_future_key_inputs: [
        "preview_draft_id",
        "transaction_plan_fingerprint",
        "contract_test_report_fingerprint",
        "future_operator_decision_id",
      ],
    },
    rollback_plan: {
      rollback_required: true,
      rollback_plan_generated_now: true,
      rollback_executed_now: false,
      product_rollback_performed: false,
      durable_rollback_storage_added: false,
    },
    review_audit_plan: {
      audit_required: true,
      audit_plan_generated_now: true,
      audit_record_created_now: false,
      approval_history_created_now: false,
      durable_audit_storage_added: false,
    },
    source_evidence_authority_plan: {
      source_fetching_performed_now: false,
      source_verification_performed_now: false,
      evidence_records_created_now: false,
      proof_records_created_now: false,
      required_before_future_commit: true,
    },
    commit_blockers: commitBlockers,
    execution_boundary: executionBoundary,
    next_recommended_slice: "disabled_transaction_plan_fixture_execution_tests",
  };

  return {
    ...planWithoutCopy,
    local_copy_packet: {
      markdown:
        buildManualNoteDisabledWriteAdapterTransactionPlanMarkdown(
          planWithoutCopy,
        ),
      json: buildManualNoteDisabledWriteAdapterTransactionPlanJson(
        planWithoutCopy,
      ),
      fingerprint: planWithoutCopy.plan_fingerprint,
      fingerprint_algorithm: "fnv1a32_canonical_json",
      local_clipboard_only: true,
      external_handoff_sent: false,
      packet_persisted: false,
      product_write_authority_granted: false,
      actual_promotion_allowed: false,
    },
  };
}

export function buildManualNoteDisabledWriteAdapterAbortOnlyResult(
  input: BuildManualNoteDisabledWriteAdapterAbortOnlyResultInput,
): ManualNoteDisabledWriteAdapterAbortOnlyResult {
  const operationResults = flattenOperationGroups(
    input.transactionPlan.operation_groups,
  ).map((operation) => ({
    operation_id: operation.operation_id,
    status: "aborted_before_product_write" as const,
    product_write_attempted: false as const,
    product_write_performed: false as const,
    product_record_id: null,
    canonical_id: null,
    proof_id: null,
    evidence_id: null,
    perspective_id: null,
    canonical_graph_edge_id: null,
    work_item_id: null,
  }));
  const abortBoundary = buildAbortBoundary();
  const resultWithoutCopy: ManualNoteDisabledWriteAdapterAbortOnlyResultCopySource =
    {
      result_kind: "manual_note_disabled_write_adapter_abort_result",
      result_version: MANUAL_NOTE_DISABLED_WRITE_ADAPTER_ABORT_RESULT_VERSION,
      result_fingerprint:
        createManualNoteDisabledWriteAdapterAbortResultFingerprint({
          transactionPlan: input.transactionPlan,
          label: normalizeDisplayLabel(input.label),
          generated_at: input.generated_at ?? null,
        }),
      preview_draft_id: input.transactionPlan.preview_draft_id,
      source_transaction_plan_fingerprint:
        input.transactionPlan.plan_fingerprint,
      execution_mode: "abort_only_non_product_harness",
      result_status: "aborted_before_product_write",
      abort_reason:
        "Disabled adapter transaction plans cannot commit product writes.",
      operation_results: operationResults,
      idempotency_result: {
        idempotency_key_generated_now: true,
        idempotency_storage_added: false,
        product_idempotency_storage_added: false,
      },
      rollback_result: {
        rollback_needed_for_current_run: false,
        rollback_executed_now: false,
        product_rollback_performed: false,
        rollback_storage_added: false,
      },
      review_audit_result: {
        audit_record_created_now: false,
        approval_history_created_now: false,
        durable_audit_storage_added: false,
      },
      abort_boundary: abortBoundary,
      next_recommended_slice: "disabled_transaction_plan_fixture_execution_tests",
    };

  return {
    ...resultWithoutCopy,
    local_copy_packet: {
      markdown:
        buildManualNoteDisabledWriteAdapterAbortResultMarkdown(resultWithoutCopy),
      json: buildManualNoteDisabledWriteAdapterAbortResultJson(resultWithoutCopy),
      fingerprint: resultWithoutCopy.result_fingerprint,
      fingerprint_algorithm: "fnv1a32_canonical_json",
      local_clipboard_only: true,
      external_handoff_sent: false,
      packet_persisted: false,
      product_write_authority_granted: false,
      actual_promotion_allowed: false,
    },
  };
}

export function buildManualNoteDisabledWriteAdapterTransactionPlanMarkdown(
  plan: ManualNoteDisabledWriteAdapterTransactionPlanCopySource,
) {
  return [
    "# Manual Note Disabled Write Adapter Transaction Plan",
    "",
    "In-memory transaction plan only.",
    "This does not perform normal product writes.",
    "This does not perform actual promotion.",
    "Every operation has commit_allowed: false.",
    "",
    `plan_version: ${plan.plan_version}`,
    `preview_draft_id: ${plan.preview_draft_id}`,
    `plan_status: ${plan.plan_status}`,
    `plan_fingerprint: ${plan.plan_fingerprint}`,
    "",
    "## Source Chain",
    formatMap(plan.source_chain),
    "",
    "## Operation Counts",
    formatMap(countOperations(plan.operation_groups)),
    "",
    "## Commit Blockers",
    plan.commit_blockers.map((blocker) => `- ${blocker}`).join("\n"),
    "",
    "## Execution Boundary",
    formatMap(plan.execution_boundary),
    "",
    `next_recommended_slice: ${plan.next_recommended_slice}`,
  ].join("\n");
}

export function buildManualNoteDisabledWriteAdapterTransactionPlanJson(
  plan: ManualNoteDisabledWriteAdapterTransactionPlanCopySource,
) {
  return JSON.stringify(plan, null, 2);
}

export function buildManualNoteDisabledWriteAdapterAbortResultMarkdown(
  result: ManualNoteDisabledWriteAdapterAbortOnlyResultCopySource,
) {
  return [
    "# Manual Note Disabled Write Adapter Abort Result",
    "",
    "Abort-only non-product harness.",
    "No product write was attempted or performed.",
    "No product IDs were created.",
    "",
    `result_version: ${result.result_version}`,
    `preview_draft_id: ${result.preview_draft_id}`,
    `execution_mode: ${result.execution_mode}`,
    `result_status: ${result.result_status}`,
    `result_fingerprint: ${result.result_fingerprint}`,
    "",
    "## Operation Results",
    result.operation_results
      .map((operation) => `${operation.operation_id}: ${operation.status}`)
      .join("\n"),
    "",
    "## Abort Boundary",
    formatMap(result.abort_boundary),
    "",
    `next_recommended_slice: ${result.next_recommended_slice}`,
  ].join("\n");
}

export function buildManualNoteDisabledWriteAdapterAbortResultJson(
  result: ManualNoteDisabledWriteAdapterAbortOnlyResultCopySource,
) {
  return JSON.stringify(result, null, 2);
}

export function createManualNoteDisabledWriteAdapterTransactionPlanFingerprint(
  input: BuildManualNoteDisabledWriteAdapterTransactionPlanInput,
) {
  const tempHarness = asRecord(input.tempHarness);
  const operations = buildOperationGroups(tempHarness);
  const contractTestReport = input.contractTestReport
    ? asRecord(input.contractTestReport)
    : null;
  return createFingerprint({
    plan_kind: "manual_note_disabled_write_adapter_transaction_plan",
    plan_version: MANUAL_NOTE_DISABLED_WRITE_ADAPTER_TRANSACTION_PLAN_VERSION,
    preview_draft_id:
      getString(asRecord(input.disabledAdapterReadiness), ["preview_draft_id"]) ??
      getString(tempHarness, ["preview_draft_id"]),
    source_chain: {
      disabled_readiness_fingerprint: getString(
        asRecord(input.disabledAdapterReadiness),
        ["local_copy_packet", "fingerprint"],
      ),
      contract_review_fingerprint: getString(asRecord(input.contractReview), [
        "review_fingerprint",
      ]),
      temp_harness_fingerprint: getString(tempHarness, ["harness_fingerprint"]),
      contract_test_report_fingerprint: contractTestReport
        ? getString(contractTestReport, ["suite_fingerprint"])
        : null,
      contract_test_final_status: contractTestReport
        ? getString(contractTestReport, ["final_status"])
        : null,
    },
    operation_ids: flattenOperationGroups(operations).map(
      (operation) => operation.operation_id,
    ),
    source_temp_intent_ids: flattenOperationGroups(operations).map(
      (operation) => operation.source_temp_intent_id,
    ),
    false_boundary_flags: buildDisabledTransactionBoundary(),
    commit_allowed: false,
    label: normalizeDisplayLabel(input.label),
    generated_at: input.generated_at ?? null,
  });
}

export function createManualNoteDisabledWriteAdapterAbortResultFingerprint(
  input: BuildManualNoteDisabledWriteAdapterAbortOnlyResultInput,
) {
  const operationIds = flattenOperationGroups(
    input.transactionPlan.operation_groups,
  ).map((operation) => operation.operation_id);
  return createFingerprint({
    result_kind: "manual_note_disabled_write_adapter_abort_result",
    result_version: MANUAL_NOTE_DISABLED_WRITE_ADAPTER_ABORT_RESULT_VERSION,
    preview_draft_id: input.transactionPlan.preview_draft_id,
    transaction_plan_fingerprint: input.transactionPlan.plan_fingerprint,
    operation_ids: operationIds,
    result_status: "aborted_before_product_write",
    false_boundary_flags: buildAbortBoundary(),
    label: normalizeDisplayLabel(input.label),
    generated_at: input.generated_at ?? null,
  });
}

function buildOperationGroups(
  tempHarness: JsonRecord,
): ManualNoteDisabledWriteAdapterTransactionPlan["operation_groups"] {
  const groups = asRecord(tempHarness.simulated_write_intents);
  return {
    claim_operations: buildOperationsFromIntents(
      asArray(groups.claim_intents),
      "claim",
      "claim_operation",
    ),
    evidence_operations: buildOperationsFromIntents(
      asArray(groups.evidence_intents),
      "evidence",
      "evidence_operation",
    ),
    perspective_operations: buildOperationsFromIntents(
      asArray(groups.perspective_intents),
      "perspective",
      "perspective_operation",
    ),
    source_verification_operations: buildOperationsFromIntents(
      asArray(groups.source_verification_intents),
      "source",
      "source_verification_operation",
    ),
    work_item_operations: buildOperationsFromIntents(
      asArray(groups.work_item_intents),
      "work",
      "work_item_operation",
    ),
  };
}

function buildOperationsFromIntents(
  rawIntents: unknown[],
  operationGroup: string,
  operationKind: string,
): DisabledTransactionOperation[] {
  return rawIntents.map((rawIntent, index) => {
    const intent = asRecord(rawIntent);
    const sourceTempIntentId =
      typeof intent.simulated_intent_id === "string" &&
      intent.simulated_intent_id.startsWith("temp-intent:")
        ? (intent.simulated_intent_id as `temp-intent:${string}`)
        : (`temp-intent:invalid:${operationGroup}:${index + 1}` as const);
    return {
      operation_id:
        `disabled-plan-op:${operationGroup}:${String(index + 1).padStart(
          3,
          "0",
        )}` as `disabled-plan-op:${string}`,
      source_temp_intent_id: sourceTempIntentId,
      operation_kind: operationKind,
      target_kind:
        typeof intent.target_kind === "string"
          ? intent.target_kind
          : "unknown_future_target",
      product_record_id: null,
      canonical_id: null,
      proof_id: null,
      evidence_id: null,
      perspective_id: null,
      canonical_graph_edge_id: null,
      work_item_id: null,
      product_write_allowed: false,
      commit_allowed: false,
      rollback_required_if_future_commit: true,
      audit_required_if_future_commit: true,
      temp_harness_only: true,
    };
  });
}

function buildCommitBlockers({
  contractTestReport,
  tempHarness,
  unsafeInputProductIds,
  invalidTempIntentIds,
}: {
  contractTestReport: JsonRecord | null;
  tempHarness: JsonRecord;
  unsafeInputProductIds: string[];
  invalidTempIntentIds: string[];
}) {
  const blockers: string[] = [...BASE_COMMIT_BLOCKERS];
  if (!contractTestReport) blockers.push("contract_test_report_missing");
  if (contractTestReport && contractTestReport.final_status !== "pass") {
    blockers.push("contract_test_report_not_pass");
  }
  if (tempHarness.harness_status !== "temp_harness_ready") {
    blockers.push("temp_harness_not_ready");
  }
  if (unsafeInputProductIds.length > 0) blockers.push("input_product_id_present");
  if (invalidTempIntentIds.length > 0) blockers.push("invalid_temp_intent_id");
  return [...new Set(blockers)];
}

function buildDisabledTransactionBoundary(): DisabledTransactionBoundary {
  return {
    disabled_transaction_plan_only: true,
    abort_only_harness: true,
    normal_product_write_enabled: false,
    product_db_write: false,
    actual_promotion_performed: false,
    proof_or_evidence_writes: false,
    perspective_or_canonical_writes: false,
    canonical_graph_write: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    durable_persistence: false,
    browser_persistence: false,
  };
}

function buildAbortBoundary(): AbortBoundary {
  return {
    abort_only: true,
    normal_product_write_enabled: false,
    product_db_write: false,
    actual_promotion_performed: false,
    proof_or_evidence_writes: false,
    perspective_or_canonical_writes: false,
    canonical_graph_write: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    durable_persistence: false,
    browser_persistence: false,
  };
}

function collectNonNullProductIdPaths(input: unknown) {
  const paths: string[] = [];
  walkJson(input, [], (path, value) => {
    const key = String(path[path.length - 1] ?? "");
    if (PRODUCT_ID_KEYS.has(key) && value !== null) paths.push(path.join("."));
  });
  return paths;
}

function collectInvalidTempIntentIds(tempHarness: JsonRecord) {
  const invalid: string[] = [];
  const groups = asRecord(tempHarness.simulated_write_intents);
  for (const [groupName, rawGroup] of Object.entries(groups)) {
    for (const [index, rawIntent] of asArray(rawGroup).entries()) {
      const intent = asRecord(rawIntent);
      if (
        typeof intent.simulated_intent_id !== "string" ||
        !intent.simulated_intent_id.startsWith("temp-intent:")
      ) {
        invalid.push(`${groupName}.${index}.simulated_intent_id`);
      }
    }
  }
  return invalid;
}

function flattenOperationGroups(
  operationGroups: ManualNoteDisabledWriteAdapterTransactionPlan["operation_groups"],
) {
  return [
    ...operationGroups.claim_operations,
    ...operationGroups.evidence_operations,
    ...operationGroups.perspective_operations,
    ...operationGroups.source_verification_operations,
    ...operationGroups.work_item_operations,
  ];
}

function countOperations(
  operationGroups: ManualNoteDisabledWriteAdapterTransactionPlan["operation_groups"],
) {
  return {
    claim_operations: operationGroups.claim_operations.length,
    evidence_operations: operationGroups.evidence_operations.length,
    perspective_operations: operationGroups.perspective_operations.length,
    source_verification_operations:
      operationGroups.source_verification_operations.length,
    work_item_operations: operationGroups.work_item_operations.length,
    total: flattenOperationGroups(operationGroups).length,
  };
}

function normalizeDisplayLabel(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) return null;
  return normalized.slice(0, MAX_DISPLAY_LABEL_LENGTH);
}

function formatMap(value: Record<string, unknown>) {
  return Object.entries(value)
    .map(([key, item]) => `${key}: ${String(item)}`)
    .join("\n");
}

function getString(value: JsonRecord, path: Array<string | number>) {
  const result = getValue(value, path);
  return typeof result === "string" ? result : null;
}

function getValue(value: unknown, path: Array<string | number>): unknown {
  let cursor = value;
  for (const segment of path) {
    if (cursor === null || cursor === undefined) return undefined;
    cursor = (cursor as Record<string | number, unknown>)[segment];
  }
  return cursor;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function walkJson(
  value: unknown,
  path: Array<string | number>,
  visitor: (path: Array<string | number>, value: unknown) => void,
) {
  visitor(path, value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkJson(item, [...path, index], visitor));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      walkJson(item, [...path, key], visitor);
    }
  }
}

function createFingerprint(value: unknown) {
  const canonical = canonicalJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  return `{${Object.entries(value as JsonRecord)
    .filter(([key]) => key !== "generated_at" && key !== "selected_at")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
}
