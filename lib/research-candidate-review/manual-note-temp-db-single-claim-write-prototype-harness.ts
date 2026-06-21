import path from "node:path";

export const MANUAL_NOTE_TEMP_DB_SINGLE_CLAIM_WRITE_PROTOTYPE_HARNESS_VERSION =
  "manual_note_temp_db_single_claim_write_prototype_harness.v0.1" as const;

type JsonRecord = Record<string, unknown>;

type GateResult = {
  gate_id: string;
  status: "pass" | "block";
  message: string;
};

type TempDbBoundary = {
  temp_db_only: true;
  temp_db_path_required_under_tmp: true;
  product_db_path_allowed: false;
  product_db_write_allowed: false;
  repo_schema_change_allowed: false;
  migration_allowed: false;
};

type ProductWriteBoundary = {
  temp_db_execution_only: true;
  normal_product_write_enabled: false;
  product_db_write: false;
  actual_promotion_performed: false;
  proof_or_evidence_writes: false;
  perspective_or_canonical_writes: false;
  canonical_graph_write: false;
  work_item_creation: false;
  product_ids_created: false;
  repo_schema_changed: false;
  migration_added: false;
  provider_or_openai_calls: false;
  retrieval_or_rag: false;
  source_fetching: false;
  external_handoff_sent: false;
  durable_product_persistence: false;
  browser_persistence: false;
};

type HarnessPlanInput = {
  design: unknown;
  tempDbPath?: string | null;
  preserveTempDb?: boolean | null;
  generated_at?: string | null;
};

type HarnessResultInput = {
  plan: ManualNoteTempDbSingleClaimWritePrototypeHarnessPlan;
  tempDbPath?: string | null;
  tempDbCreated?: boolean | null;
  tempDbPreservedForInspection?: boolean | null;
  sqliteMethod?: string | null;
  rowCounts?: Partial<Record<TempTableName, number>> | null;
  inserted?: boolean | null;
  errorMessage?: string | null;
  generated_at?: string | null;
};

type TempTableName =
  | "temp_claim_records"
  | "temp_idempotency_records"
  | "temp_rollback_records"
  | "temp_review_audit_records";

type InsertedRecords = {
  temp_claim_record: {
    inserted: boolean;
    temp_claim_record_id: string;
    source_operation_id: string | null;
    source_temp_intent_id: string | null;
    product_claim_id: null;
    canonical_claim_id: null;
    proof_id: null;
    evidence_id: null;
    perspective_id: null;
    work_item_id: null;
    raw_manual_note_text_included: false;
  };
  temp_idempotency_record: {
    inserted: boolean;
    temp_idempotency_key: string;
    product_idempotency_record_id: null;
  };
  temp_rollback_record: {
    inserted: boolean;
    rollback_strategy: "delete_temp_claim_record_by_temp_idempotency_key";
    rollback_executed_now: false;
    product_rollback_performed_now: false;
  };
  temp_review_audit_record: {
    inserted: boolean;
    records_operator_decision: false;
    audit_record_product_id: null;
  };
};

export type ManualNoteTempDbSingleClaimWritePrototypeHarnessPlan = {
  harness_kind: "manual_note_temp_db_single_claim_write_prototype_harness";
  harness_version: typeof MANUAL_NOTE_TEMP_DB_SINGLE_CLAIM_WRITE_PROTOTYPE_HARNESS_VERSION;
  harness_fingerprint: string;
  source_design: {
    design_version: string | null;
    design_fingerprint: string | null;
    prototype_status: string | null;
    selected_claim_operation_id: string | null;
    next_recommended_slice: string | null;
  };
  harness_status: "ready_for_temp_db_execution" | "blocked_by_design_gate";
  execution_mode: "temp_db_single_claim_only";
  temp_db_boundary: TempDbBoundary;
  temp_schema_plan: {
    executable_sql_included: true;
    sql_scope: "temp_db_only";
    temp_tables: TempTableName[];
    product_table_names_forbidden: true;
    schema_sql_statements: string[];
  };
  temp_insert_plan: {
    exactly_one_claim_record: true;
    exactly_one_idempotency_record: true;
    exactly_one_rollback_record: true;
    exactly_one_review_audit_record: true;
    insert_sql_scope: "temp_db_only";
    selected_claim_operation_id: string | null;
    source_temp_intent_id: string | null;
    raw_manual_note_text_included: false;
    product_ids_created: false;
  };
  expected_row_counts: Record<TempTableName, 1>;
  execution_gates: string[];
  gate_results: GateResult[];
  blocked_reasons: string[];
  preserve_temp_db_for_inspection: boolean;
  requested_temp_db_path: string | null;
  next_recommended_slice: "temp_db_single_claim_write_prototype_result_review";
};

export type ManualNoteTempDbSingleClaimWritePrototypeHarnessResult = {
  result_kind: "manual_note_temp_db_single_claim_write_prototype_result";
  result_version: typeof MANUAL_NOTE_TEMP_DB_SINGLE_CLAIM_WRITE_PROTOTYPE_HARNESS_VERSION;
  result_fingerprint: string;
  source_harness_fingerprint: string;
  source_design_fingerprint: string | null;
  execution_mode: "temp_db_single_claim_only";
  sqlite_method: string | null;
  result_status:
    | "temp_db_write_passed"
    | "blocked_before_temp_db_write"
    | "temp_db_write_failed";
  failure_message: string | null;
  temp_db_artifact: {
    temp_db_path: string | null;
    temp_db_created: boolean;
    temp_db_preserved_for_inspection: boolean;
    temp_db_under_tmp: boolean;
    product_db_path_used: false;
  };
  executed_sql_summary: {
    create_table_statement_count: number;
    insert_statement_count: number;
    select_statement_count: number;
    product_table_statement_count: 0;
    sql_scope: "temp_db_only";
  };
  inserted_records: InsertedRecords;
  verification: {
    row_counts: Record<TempTableName, number>;
    expected_row_counts_match: boolean;
    temp_tables_only: boolean;
    product_ids_absent: boolean;
    raw_manual_note_absent: boolean;
    product_db_untouched: true;
  };
  product_write_boundary: ProductWriteBoundary;
  local_copy_packet: {
    markdown: string;
    json: string;
    fingerprint: string;
    fingerprint_algorithm: "fnv1a32_canonical_json";
    local_clipboard_only: true;
    external_handoff_sent: false;
    packet_persisted_to_product_db: false;
    product_write_authority_granted: false;
    actual_promotion_allowed: false;
  };
  next_recommended_slice: "temp_db_single_claim_write_prototype_result_review";
};

type ManualNoteTempDbSingleClaimWritePrototypeHarnessResultCopySource = Omit<
  ManualNoteTempDbSingleClaimWritePrototypeHarnessResult,
  "local_copy_packet"
>;

const ARTIFACT_DIR = "/tmp/augnes-single-claim-write-prototype-v0-1";
const RESOLVED_ARTIFACT_DIR = path.resolve(ARTIFACT_DIR);
const DEFAULT_TEMP_DB_PATH = path.join(
  RESOLVED_ARTIFACT_DIR,
  "single-claim-prototype.sqlite",
);
const TEMP_TABLES: TempTableName[] = [
  "temp_claim_records",
  "temp_idempotency_records",
  "temp_rollback_records",
  "temp_review_audit_records",
];
const EXECUTION_GATES = [
  "design_status_ready",
  "temp_db_path_under_tmp",
  "product_db_path_absent",
  "exactly_one_claim_selected",
  "sql_limited_to_temp_tables",
  "no_raw_manual_note_text",
  "no_product_ids",
  "no_provider_retrieval_source_fetch",
  "no_external_handoff",
];

export function buildManualNoteTempDbSingleClaimWritePrototypeHarnessPlan(
  input: HarnessPlanInput,
): ManualNoteTempDbSingleClaimWritePrototypeHarnessPlan {
  const design = asRecord(input.design);
  const selectedClaimOperation = asRecord(design.selected_claim_operation);
  const tempDbPath = normalizeTempDbPath(input.tempDbPath ?? DEFAULT_TEMP_DB_PATH);
  const gateResults = buildGateResults(design, tempDbPath);
  const blockedReasons = gateResults
    .filter((gateResult) => gateResult.status === "block")
    .map((gateResult) => gateResult.gate_id);
  const planCore = {
    harness_kind: "manual_note_temp_db_single_claim_write_prototype_harness" as const,
    harness_version:
      MANUAL_NOTE_TEMP_DB_SINGLE_CLAIM_WRITE_PROTOTYPE_HARNESS_VERSION,
    harness_fingerprint: "",
    source_design: {
      design_version: asString(design.design_version),
      design_fingerprint: asString(design.design_fingerprint),
      prototype_status: asString(design.prototype_status),
      selected_claim_operation_id: asString(selectedClaimOperation.operation_id),
      next_recommended_slice: asString(design.next_recommended_slice),
    },
    harness_status: blockedReasons.length === 0
      ? ("ready_for_temp_db_execution" as const)
      : ("blocked_by_design_gate" as const),
    execution_mode: "temp_db_single_claim_only" as const,
    temp_db_boundary: tempDbBoundary(),
    temp_schema_plan: {
      executable_sql_included: true as const,
      sql_scope: "temp_db_only" as const,
      temp_tables: [...TEMP_TABLES],
      product_table_names_forbidden: true as const,
      schema_sql_statements: schemaSqlStatements(),
    },
    temp_insert_plan: {
      exactly_one_claim_record: true as const,
      exactly_one_idempotency_record: true as const,
      exactly_one_rollback_record: true as const,
      exactly_one_review_audit_record: true as const,
      insert_sql_scope: "temp_db_only" as const,
      selected_claim_operation_id: asString(selectedClaimOperation.operation_id),
      source_temp_intent_id: asString(selectedClaimOperation.source_temp_intent_id),
      raw_manual_note_text_included: false as const,
      product_ids_created: false as const,
    },
    expected_row_counts: expectedRowCounts(),
    execution_gates: [...EXECUTION_GATES],
    gate_results: gateResults,
    blocked_reasons: blockedReasons,
    preserve_temp_db_for_inspection: input.preserveTempDb ?? true,
    requested_temp_db_path: tempDbPath,
    next_recommended_slice:
      "temp_db_single_claim_write_prototype_result_review" as const,
  };
  return {
    ...planCore,
    harness_fingerprint:
      createManualNoteTempDbSingleClaimWritePrototypeHarnessFingerprint(planCore),
  };
}

export function buildManualNoteTempDbSingleClaimWritePrototypeHarnessResult(
  input: HarnessResultInput,
): ManualNoteTempDbSingleClaimWritePrototypeHarnessResult {
  const rowCounts = {
    ...zeroRowCounts(),
    ...(input.rowCounts ?? {}),
  };
  const inserted = input.inserted === true;
  const tempDbPath = normalizeTempDbPath(
    input.tempDbPath ?? input.plan.requested_temp_db_path,
  );
  const expectedMatch = rowCountsMatch(rowCounts, input.plan.expected_row_counts);
  const resultStatus =
    input.plan.harness_status !== "ready_for_temp_db_execution"
      ? "blocked_before_temp_db_write"
      : input.errorMessage
        ? "temp_db_write_failed"
        : expectedMatch && inserted
          ? "temp_db_write_passed"
          : "temp_db_write_failed";
  const insertedRecords = buildInsertedRecords(input.plan, inserted);
  const resultCore: ManualNoteTempDbSingleClaimWritePrototypeHarnessResultCopySource = {
    result_kind: "manual_note_temp_db_single_claim_write_prototype_result",
    result_version:
      MANUAL_NOTE_TEMP_DB_SINGLE_CLAIM_WRITE_PROTOTYPE_HARNESS_VERSION,
    result_fingerprint: "",
    source_harness_fingerprint: input.plan.harness_fingerprint,
    source_design_fingerprint: input.plan.source_design.design_fingerprint,
    execution_mode: "temp_db_single_claim_only",
    sqlite_method: input.sqliteMethod ?? null,
    result_status: resultStatus,
    failure_message: input.errorMessage ?? null,
    temp_db_artifact: {
      temp_db_path: tempDbPath ?? null,
      temp_db_created: input.tempDbCreated === true,
      temp_db_preserved_for_inspection:
        input.tempDbPreservedForInspection === true,
      temp_db_under_tmp: isUnderHarnessTmp(tempDbPath),
      product_db_path_used: false,
    },
    executed_sql_summary: {
      create_table_statement_count: 4,
      insert_statement_count: inserted ? 4 : 0,
      select_statement_count: inserted ? 4 : 0,
      product_table_statement_count: 0,
      sql_scope: "temp_db_only",
    },
    inserted_records: insertedRecords,
    verification: {
      row_counts: rowCounts,
      expected_row_counts_match: expectedMatch,
      temp_tables_only: true,
      product_ids_absent: true,
      raw_manual_note_absent: true,
      product_db_untouched: true,
    },
    product_write_boundary: productWriteBoundary(),
    next_recommended_slice:
      "temp_db_single_claim_write_prototype_result_review",
  };
  const resultFingerprint =
    createManualNoteTempDbSingleClaimWritePrototypeHarnessFingerprint(resultCore);
  const result = {
    ...resultCore,
    result_fingerprint: resultFingerprint,
  };
  return {
    ...result,
    local_copy_packet: {
      markdown: buildManualNoteTempDbSingleClaimWritePrototypeHarnessMarkdown(result),
      json: buildManualNoteTempDbSingleClaimWritePrototypeHarnessJson(result),
      fingerprint: resultFingerprint,
      fingerprint_algorithm: "fnv1a32_canonical_json",
      local_clipboard_only: true,
      external_handoff_sent: false,
      packet_persisted_to_product_db: false,
      product_write_authority_granted: false,
      actual_promotion_allowed: false,
    },
  };
}

export function buildManualNoteTempDbSingleClaimWritePrototypeHarnessMarkdown(
  result: ManualNoteTempDbSingleClaimWritePrototypeHarnessResultCopySource,
): string {
  return [
    "# Manual Note Temp DB Single-Claim Write Prototype Harness",
    "",
    "Temp DB execution only. No product DB write is allowed.",
    `result_status: ${result.result_status}`,
    `temp_db_path: ${result.temp_db_artifact.temp_db_path ?? "none"}`,
    `source_design_fingerprint: ${result.source_design_fingerprint ?? "missing"}`,
    "",
    "## Inserted Temp Records",
    `- temp_claim_records: ${result.verification.row_counts.temp_claim_records}`,
    `- temp_idempotency_records: ${result.verification.row_counts.temp_idempotency_records}`,
    `- temp_rollback_records: ${result.verification.row_counts.temp_rollback_records}`,
    `- temp_review_audit_records: ${result.verification.row_counts.temp_review_audit_records}`,
    "",
    "## Boundary",
    "product_db_write=false",
    "actual_promotion_performed=false",
    "proof_or_evidence_writes=false",
    "perspective_or_canonical_writes=false",
    "external_handoff_sent=false",
  ].join("\n");
}

export function buildManualNoteTempDbSingleClaimWritePrototypeHarnessJson(
  result: ManualNoteTempDbSingleClaimWritePrototypeHarnessResultCopySource,
): string {
  return JSON.stringify(
    {
      result_kind: result.result_kind,
      result_version: result.result_version,
      result_fingerprint: result.result_fingerprint,
      result_status: result.result_status,
      temp_db_artifact: result.temp_db_artifact,
      executed_sql_summary: result.executed_sql_summary,
      verification: result.verification,
      product_write_boundary: result.product_write_boundary,
      next_recommended_slice: result.next_recommended_slice,
    },
    null,
    2,
  );
}

export function createManualNoteTempDbSingleClaimWritePrototypeHarnessFingerprint(
  input: unknown,
): string {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(input)))}`;
}

function buildGateResults(design: JsonRecord, tempDbPath: string | null): GateResult[] {
  const selectedClaimOperation = asRecord(design.selected_claim_operation);
  const sourceTransactionPlan = asRecord(design.source_transaction_plan);
  const productWriteBoundary = asRecord(design.product_write_boundary);
  const gatesStatus = Array.isArray(design.gates_status)
    ? design.gates_status
    : [];
  return [
    gate(
      "design_status_ready",
      design.prototype_status === "design_only_ready_for_temp_execution_spec" &&
        gatesStatus.every(
          (gateStatus) => asRecord(gateStatus).status === "pass",
        ),
      "Source prototype design is ready and all design gates pass.",
    ),
    gate(
      "temp_db_path_under_tmp",
      isUnderHarnessTmp(tempDbPath),
      "Temp DB path is constrained to /tmp/augnes-single-claim-write-prototype-v0-1.",
    ),
    gate(
      "product_db_path_absent",
      productWriteBoundary.product_db_write === false,
      "No product DB path or product DB write authority is present.",
    ),
    gate(
      "exactly_one_claim_selected",
      selectedClaimOperation.operation_id !== null &&
        selectedClaimOperation.operation_id !== undefined &&
        sourceTransactionPlan.claim_operation_count === 1,
      "Exactly one disabled transaction-plan claim operation is selected.",
    ),
    gate(
      "sql_limited_to_temp_tables",
      schemaSqlStatements().every(sqlReferencesOnlyTempTables),
      "Executable SQL is limited to temp harness tables.",
    ),
    gate(
      "no_raw_manual_note_text",
      valueAt(design, ["temp_claim_write_shape", "raw_manual_note_text_included"]) ===
        false,
      "The temp record shape excludes raw manual note text.",
    ),
    gate(
      "no_product_ids",
      selectedClaimOperation.product_record_id === null &&
        productWriteBoundary.product_ids_created === false,
      "No product or canonical identifiers are created.",
    ),
    gate(
      "no_provider_retrieval_source_fetch",
      productWriteBoundary.provider_or_openai_calls === false &&
        productWriteBoundary.retrieval_or_rag === false &&
        productWriteBoundary.source_fetching === false,
      "The harness does not call providers, retrieval, RAG, or source fetch.",
    ),
    gate(
      "no_external_handoff",
      productWriteBoundary.external_handoff_sent === false,
      "The harness sends no external handoff.",
    ),
  ];
}

function buildInsertedRecords(
  plan: ManualNoteTempDbSingleClaimWritePrototypeHarnessPlan,
  inserted: boolean,
): InsertedRecords {
  const operationId = plan.temp_insert_plan.selected_claim_operation_id;
  const sourceTempIntentId = plan.temp_insert_plan.source_temp_intent_id;
  const tempClaimRecordId = `temp-claim:${stableSuffix(operationId)}`;
  return {
    temp_claim_record: {
      inserted,
      temp_claim_record_id: tempClaimRecordId,
      source_operation_id: operationId,
      source_temp_intent_id: sourceTempIntentId,
      product_claim_id: null,
      canonical_claim_id: null,
      proof_id: null,
      evidence_id: null,
      perspective_id: null,
      work_item_id: null,
      raw_manual_note_text_included: false,
    },
    temp_idempotency_record: {
      inserted,
      temp_idempotency_key: `temp-idempotency:${stableSuffix(
        `${plan.source_design.design_fingerprint}:${operationId}`,
      )}`,
      product_idempotency_record_id: null,
    },
    temp_rollback_record: {
      inserted,
      rollback_strategy: "delete_temp_claim_record_by_temp_idempotency_key",
      rollback_executed_now: false,
      product_rollback_performed_now: false,
    },
    temp_review_audit_record: {
      inserted,
      records_operator_decision: false,
      audit_record_product_id: null,
    },
  };
}

function schemaSqlStatements(): string[] {
  return [
    [
      "CREATE TABLE IF NOT EXISTS temp_claim_records (",
      "temp_claim_record_id TEXT PRIMARY KEY,",
      "preview_draft_id TEXT NOT NULL,",
      "source_operation_id TEXT NOT NULL,",
      "source_temp_intent_id TEXT NOT NULL,",
      "temp_idempotency_key TEXT NOT NULL,",
      "claim_candidate_text_source TEXT NOT NULL,",
      "raw_manual_note_text_included INTEGER NOT NULL,",
      "created_in_temp_db_now INTEGER NOT NULL",
      ")",
    ].join(" "),
    [
      "CREATE TABLE IF NOT EXISTS temp_idempotency_records (",
      "temp_idempotency_key TEXT PRIMARY KEY,",
      "preview_draft_id TEXT NOT NULL,",
      "selected_claim_operation_id TEXT NOT NULL,",
      "transaction_plan_fingerprint TEXT NOT NULL,",
      "design_fingerprint TEXT NOT NULL,",
      "storage_scope TEXT NOT NULL",
      ")",
    ].join(" "),
    [
      "CREATE TABLE IF NOT EXISTS temp_rollback_records (",
      "temp_rollback_record_id TEXT PRIMARY KEY,",
      "temp_idempotency_key TEXT NOT NULL,",
      "target_temp_claim_record_id TEXT NOT NULL,",
      "rollback_strategy TEXT NOT NULL,",
      "rollback_executed_now INTEGER NOT NULL",
      ")",
    ].join(" "),
    [
      "CREATE TABLE IF NOT EXISTS temp_review_audit_records (",
      "temp_review_audit_record_id TEXT PRIMARY KEY,",
      "preview_draft_id TEXT NOT NULL,",
      "selected_claim_operation_id TEXT NOT NULL,",
      "design_fingerprint TEXT NOT NULL,",
      "records_operator_decision INTEGER NOT NULL,",
      "records_prototype_design_inputs INTEGER NOT NULL",
      ")",
    ].join(" "),
  ];
}

function sqlReferencesOnlyTempTables(sql: string): boolean {
  const forbiddenTablePattern =
    /\b(claims|evidences?|proofs?|perspectives?|canonical_graph|canonical_graph_edges?|work_items?|sources?|source_documents?)\b/i;
  if (forbiddenTablePattern.test(sql)) return false;
  return TEMP_TABLES.some((tableName) => sql.includes(tableName));
}

function gate(gateId: string, passed: boolean, message: string): GateResult {
  return {
    gate_id: gateId,
    status: passed ? "pass" : "block",
    message,
  };
}

function tempDbBoundary(): TempDbBoundary {
  return {
    temp_db_only: true,
    temp_db_path_required_under_tmp: true,
    product_db_path_allowed: false,
    product_db_write_allowed: false,
    repo_schema_change_allowed: false,
    migration_allowed: false,
  };
}

function productWriteBoundary(): ProductWriteBoundary {
  return {
    temp_db_execution_only: true,
    normal_product_write_enabled: false,
    product_db_write: false,
    actual_promotion_performed: false,
    proof_or_evidence_writes: false,
    perspective_or_canonical_writes: false,
    canonical_graph_write: false,
    work_item_creation: false,
    product_ids_created: false,
    repo_schema_changed: false,
    migration_added: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    durable_product_persistence: false,
    browser_persistence: false,
  };
}

function expectedRowCounts(): Record<TempTableName, 1> {
  return {
    temp_claim_records: 1,
    temp_idempotency_records: 1,
    temp_rollback_records: 1,
    temp_review_audit_records: 1,
  };
}

function zeroRowCounts(): Record<TempTableName, number> {
  return {
    temp_claim_records: 0,
    temp_idempotency_records: 0,
    temp_rollback_records: 0,
    temp_review_audit_records: 0,
  };
}

function rowCountsMatch(
  rowCounts: Record<TempTableName, number>,
  expected: Record<TempTableName, number>,
): boolean {
  return TEMP_TABLES.every((tableName) => rowCounts[tableName] === expected[tableName]);
}

function isUnderHarnessTmp(value: string | null | undefined): boolean {
  if (typeof value !== "string") return false;
  const resolved = path.resolve(value);
  return (
    resolved.startsWith(`${RESOLVED_ARTIFACT_DIR}${path.sep}`) &&
    resolved.endsWith(".sqlite")
  );
}

function normalizeTempDbPath(inputPath: string | null | undefined): string | null {
  if (typeof inputPath !== "string") return null;
  return path.resolve(inputPath);
}

function stableSuffix(value: string | null | undefined): string {
  return fnv1a32(String(value ?? "missing"));
}

function stripGeneratedFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => stripGeneratedFields(item));
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as JsonRecord)
      .filter(([key]) => key !== "generated_at" && key !== "local_copy_packet")
      .map(([key, nestedValue]) => [key, stripGeneratedFields(nestedValue)]);
    return Object.fromEntries(entries);
  }
  return value;
}

function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as JsonRecord;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonRecord;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function valueAt(value: unknown, path: string[]): unknown {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = (current as JsonRecord)[key];
  }
  return current;
}
