import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ARTIFACT_DIR = "/tmp/augnes-disabled-write-adapter-transaction-plan-v0-1";
const REPORT_PATH = path.join(ARTIFACT_DIR, "report.json");
const TRANSACTION_PLAN_PATH = path.join(ARTIFACT_DIR, "transaction-plan.json");
const ABORT_RESULT_PATH = path.join(ARTIFACT_DIR, "abort-result.json");
const READINESS_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-disabled-promotion-write-adapter-readiness.sample.v0.1.json";
const CONTRACT_REVIEW_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-disabled-adapter-contract-review.sample.v0.1.json";
const TEMP_HARNESS_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-disabled-adapter-temp-harness.sample.v0.1.json";
const CONTRACT_TEST_REPORT_PATH =
  "/tmp/augnes-disabled-write-adapter-contract-tests-v0-1/report.json";
const PLAN_VERSION = "manual_note_disabled_write_adapter_transaction_plan.v0.1";
const ABORT_VERSION = "manual_note_disabled_write_adapter_abort_result.v0.1";

const disabledReadiness = await readJson(READINESS_FIXTURE_PATH);
const contractReview = await readJson(CONTRACT_REVIEW_FIXTURE_PATH);
const tempHarness = await readJson(TEMP_HARNESS_FIXTURE_PATH);
const contractTestReport = await readOptionalJson(CONTRACT_TEST_REPORT_PATH);

const transactionPlan = buildTransactionPlan({
  disabledReadiness,
  contractReview,
  tempHarness,
  contractTestReport,
});
const abortResult = buildAbortResult(transactionPlan);
const report = {
  report_kind: "manual_note_disabled_write_adapter_transaction_plan_report",
  report_version: PLAN_VERSION,
  artifact_dir: ARTIFACT_DIR,
  artifact_paths: {
    report: REPORT_PATH,
    transaction_plan: TRANSACTION_PLAN_PATH,
    abort_result: ABORT_RESULT_PATH,
  },
  contract_test_report_present: Boolean(contractTestReport),
  transaction_plan: transactionPlan,
  abort_result: abortResult,
  preserved_boundaries: {
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
  },
  final_status: validateReport(transactionPlan, abortResult) ? "pass" : "fail",
};

await mkdir(ARTIFACT_DIR, { recursive: true });
await writeFile(TRANSACTION_PLAN_PATH, `${JSON.stringify(transactionPlan, null, 2)}\n`);
await writeFile(ABORT_RESULT_PATH, `${JSON.stringify(abortResult, null, 2)}\n`);
await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      plan: "research-candidate-disabled-write-adapter-transaction-plan-v0-1",
      final_status: report.final_status,
      contract_test_report_present: report.contract_test_report_present,
      plan_status: transactionPlan.plan_status,
      abort_result_status: abortResult.result_status,
      artifact_paths: report.artifact_paths,
    },
    null,
    2,
  ),
);

if (report.final_status !== "pass") {
  process.exitCode = 1;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readOptionalJson(filePath) {
  try {
    return await readJson(filePath);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function buildTransactionPlan({
  disabledReadiness,
  contractReview,
  tempHarness,
  contractTestReport,
}) {
  const operationGroups = buildOperationGroups(tempHarness);
  const unsafeProductIdPaths = collectNonNullProductIdPaths({
    disabled_readiness: disabledReadiness,
    contract_review: contractReview,
    temp_harness: tempHarness,
  });
  const invalidTempIntentIds = collectInvalidTempIntentIds(tempHarness);
  const sourceChain = {
    disabled_readiness_fingerprint:
      valueAt(disabledReadiness, ["local_copy_packet", "fingerprint"]) ?? null,
    contract_review_fingerprint: contractReview.review_fingerprint ?? null,
    temp_harness_fingerprint: tempHarness.harness_fingerprint ?? null,
    contract_test_report_fingerprint: contractTestReport?.suite_fingerprint ?? null,
    contract_test_final_status: contractTestReport?.final_status ?? null,
  };
  const planStatus =
    contractTestReport?.final_status === "pass" &&
    tempHarness.harness_status === "temp_harness_ready" &&
    unsafeProductIdPaths.length === 0 &&
    invalidTempIntentIds.length === 0
      ? "ready_for_abort_only_harness"
      : "blocked_before_commit";
  const planFingerprint = fingerprint({
    plan_kind: "manual_note_disabled_write_adapter_transaction_plan",
    plan_version: PLAN_VERSION,
    preview_draft_id: disabledReadiness.preview_draft_id ?? tempHarness.preview_draft_id,
    source_chain: sourceChain,
    operation_ids: flattenOperations(operationGroups).map(
      (operation) => operation.operation_id,
    ),
    source_temp_intent_ids: flattenOperations(operationGroups).map(
      (operation) => operation.source_temp_intent_id,
    ),
    false_boundary_flags: transactionBoundary(),
    commit_allowed: false,
  });
  const plan = {
    plan_kind: "manual_note_disabled_write_adapter_transaction_plan",
    plan_version: PLAN_VERSION,
    plan_fingerprint: planFingerprint,
    preview_draft_id: disabledReadiness.preview_draft_id ?? tempHarness.preview_draft_id,
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
    commit_blockers: commitBlockers({
      contractTestReport,
      tempHarness,
      unsafeProductIdPaths,
      invalidTempIntentIds,
    }),
    execution_boundary: transactionBoundary(),
    next_recommended_slice: "disabled_transaction_plan_fixture_execution_tests",
  };
  return {
    ...plan,
    local_copy_packet: {
      markdown: [
        "# Manual Note Disabled Write Adapter Transaction Plan",
        "",
        "In-memory transaction plan only.",
        "This does not perform normal product writes.",
        `plan_status: ${plan.plan_status}`,
        `plan_fingerprint: ${plan.plan_fingerprint}`,
      ].join("\n"),
      json: JSON.stringify(
        {
          plan_status: plan.plan_status,
          product_db_write: false,
          commit_allowed: false,
        },
        null,
        2,
      ),
      fingerprint: plan.plan_fingerprint,
      fingerprint_algorithm: "fnv1a32_canonical_json",
      local_clipboard_only: true,
      external_handoff_sent: false,
      packet_persisted: false,
      product_write_authority_granted: false,
      actual_promotion_allowed: false,
    },
  };
}

function buildAbortResult(plan) {
  const operationResults = flattenOperations(plan.operation_groups).map((operation) => ({
    operation_id: operation.operation_id,
    status: "aborted_before_product_write",
    product_write_attempted: false,
    product_write_performed: false,
    product_record_id: null,
    canonical_id: null,
    proof_id: null,
    evidence_id: null,
    perspective_id: null,
    canonical_graph_edge_id: null,
    work_item_id: null,
  }));
  const resultFingerprint = fingerprint({
    result_kind: "manual_note_disabled_write_adapter_abort_result",
    result_version: ABORT_VERSION,
    preview_draft_id: plan.preview_draft_id,
    transaction_plan_fingerprint: plan.plan_fingerprint,
    operation_ids: operationResults.map((operation) => operation.operation_id),
    result_status: "aborted_before_product_write",
    false_boundary_flags: abortBoundary(),
  });
  const result = {
    result_kind: "manual_note_disabled_write_adapter_abort_result",
    result_version: ABORT_VERSION,
    result_fingerprint: resultFingerprint,
    preview_draft_id: plan.preview_draft_id,
    source_transaction_plan_fingerprint: plan.plan_fingerprint,
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
    abort_boundary: abortBoundary(),
    next_recommended_slice: "disabled_transaction_plan_fixture_execution_tests",
  };
  return {
    ...result,
    local_copy_packet: {
      markdown: [
        "# Manual Note Disabled Write Adapter Abort Result",
        "",
        "Abort-only non-product harness.",
        "No product write was attempted or performed.",
        `result_status: ${result.result_status}`,
        `result_fingerprint: ${result.result_fingerprint}`,
      ].join("\n"),
      json: JSON.stringify(
        {
          result_status: result.result_status,
          product_db_write: false,
          actual_promotion_performed: false,
        },
        null,
        2,
      ),
      fingerprint: result.result_fingerprint,
      fingerprint_algorithm: "fnv1a32_canonical_json",
      local_clipboard_only: true,
      external_handoff_sent: false,
      packet_persisted: false,
      product_write_authority_granted: false,
      actual_promotion_allowed: false,
    },
  };
}

function buildOperationGroups(tempHarness) {
  const groups = tempHarness.simulated_write_intents ?? {};
  return {
    claim_operations: operationsFrom(groups.claim_intents, "claim", "claim_operation"),
    evidence_operations: operationsFrom(
      groups.evidence_intents,
      "evidence",
      "evidence_operation",
    ),
    perspective_operations: operationsFrom(
      groups.perspective_intents,
      "perspective",
      "perspective_operation",
    ),
    source_verification_operations: operationsFrom(
      groups.source_verification_intents,
      "source",
      "source_verification_operation",
    ),
    work_item_operations: operationsFrom(
      groups.work_item_intents,
      "work",
      "work_item_operation",
    ),
  };
}

function operationsFrom(rawIntents, group, operationKind) {
  return array(rawIntents).map((rawIntent, index) => {
    const intent = record(rawIntent);
    const sourceTempIntentId =
      typeof intent.simulated_intent_id === "string" &&
      intent.simulated_intent_id.startsWith("temp-intent:")
        ? intent.simulated_intent_id
        : `temp-intent:invalid:${group}:${index + 1}`;
    return {
      operation_id: `disabled-plan-op:${group}:${String(index + 1).padStart(3, "0")}`,
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

function commitBlockers({
  contractTestReport,
  tempHarness,
  unsafeProductIdPaths,
  invalidTempIntentIds,
}) {
  const blockers = [
    "explicit_operator_decision_missing",
    "source_verification_authority_missing",
    "proof_evidence_write_authority_missing",
    "canonical_perspective_write_authority_missing",
    "durable_idempotency_storage_missing",
    "rollback_contract_missing",
    "audit_record_contract_missing",
    "enabled_adapter_review_missing",
    "product_write_route_missing",
  ];
  if (!contractTestReport) blockers.push("contract_test_report_missing");
  if (contractTestReport && contractTestReport.final_status !== "pass") {
    blockers.push("contract_test_report_not_pass");
  }
  if (tempHarness.harness_status !== "temp_harness_ready") {
    blockers.push("temp_harness_not_ready");
  }
  if (unsafeProductIdPaths.length > 0) blockers.push("input_product_id_present");
  if (invalidTempIntentIds.length > 0) blockers.push("invalid_temp_intent_id");
  return [...new Set(blockers)];
}

function transactionBoundary() {
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

function abortBoundary() {
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

function validateReport(plan, result) {
  return (
    plan.plan_kind === "manual_note_disabled_write_adapter_transaction_plan" &&
    result.result_kind === "manual_note_disabled_write_adapter_abort_result" &&
    result.result_status === "aborted_before_product_write" &&
    everyBoundaryFalse(plan.execution_boundary, ["disabled_transaction_plan_only", "abort_only_harness"]) &&
    everyBoundaryFalse(result.abort_boundary, ["abort_only"]) &&
    collectNonNullProductIdPaths({ plan, result }).length === 0 &&
    flattenOperations(plan.operation_groups).every(
      (operation) =>
        operation.operation_id.startsWith("disabled-plan-op:") &&
        operation.source_temp_intent_id.startsWith("temp-intent:") &&
        operation.commit_allowed === false &&
        operation.product_write_allowed === false,
    ) &&
    result.operation_results.every(
      (operation) =>
        operation.status === "aborted_before_product_write" &&
        operation.product_write_attempted === false &&
        operation.product_write_performed === false,
    )
  );
}

function everyBoundaryFalse(boundary, trueKeys) {
  return Object.entries(boundary).every(([key, value]) =>
    trueKeys.includes(key) ? value === true : value === false,
  );
}

function flattenOperations(operationGroups) {
  return [
    ...operationGroups.claim_operations,
    ...operationGroups.evidence_operations,
    ...operationGroups.perspective_operations,
    ...operationGroups.source_verification_operations,
    ...operationGroups.work_item_operations,
  ];
}

function collectInvalidTempIntentIds(tempHarness) {
  const invalid = [];
  const groups = tempHarness.simulated_write_intents ?? {};
  for (const [groupName, rawGroup] of Object.entries(groups)) {
    for (const [index, rawIntent] of array(rawGroup).entries()) {
      const intent = record(rawIntent);
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

function collectNonNullProductIdPaths(value) {
  const productIdKeys = new Set([
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
  const paths = [];
  walk(value, [], (pathParts, item) => {
    const key = String(pathParts[pathParts.length - 1] ?? "");
    if (productIdKeys.has(key) && item !== null) paths.push(pathParts.join("."));
  });
  return paths;
}

function valueAt(value, pathParts) {
  let cursor = value;
  for (const segment of pathParts) {
    if (cursor === null || cursor === undefined) return undefined;
    cursor = cursor[segment];
  }
  return cursor;
}

function record(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function array(value) {
  return Array.isArray(value) ? value : [];
}

function walk(value, pathParts, visitor) {
  visitor(pathParts, value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, [...pathParts, index], visitor));
    return;
  }
  if (value && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      walk(item, [...pathParts, key], visitor);
    }
  }
}

function fingerprint(value) {
  const canonical = canonicalJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < canonical.length; index += 1) {
    hash ^= canonical.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function canonicalJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  return `{${Object.entries(value)
    .filter(([key]) => key !== "generated_at" && key !== "selected_at")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
}
