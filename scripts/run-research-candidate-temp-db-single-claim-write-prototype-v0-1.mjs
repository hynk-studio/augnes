import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const HARNESS_VERSION =
  "manual_note_temp_db_single_claim_write_prototype_harness.v0.1";
const ARTIFACT_DIR = "/tmp/augnes-single-claim-write-prototype-v0-1";
const RESOLVED_ARTIFACT_DIR = path.resolve(ARTIFACT_DIR);
const DEFAULT_TEMP_DB_PATH = path.join(
  RESOLVED_ARTIFACT_DIR,
  "single-claim-prototype.sqlite",
);
const BLOCKED_TEMP_DB_PATH_EXAMPLES = [
  "/tmp/augnes-single-claim-write-prototype-v0-1/../evil.sqlite",
  "/tmp/augnes-single-claim-write-prototype-v0-1/subdir/../../evil.sqlite",
  "relative/path.sqlite",
];
const REPORT_PATH = path.join(RESOLVED_ARTIFACT_DIR, "report.json");
const PLAN_PATH = path.join(RESOLVED_ARTIFACT_DIR, "harness-plan.json");
const RESULT_PATH = path.join(RESOLVED_ARTIFACT_DIR, "harness-result.json");
const DESIGN_FIXTURE_PATH =
  "fixtures/research-candidate-review.manual-note-temp-db-single-claim-prototype-design.sample.v0.1.json";
const DESIGN_REPORT_PATH =
  "/tmp/augnes-temp-db-single-claim-prototype-design-v0-1/report.json";
const TEMP_TABLES = [
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

async function main() {
  const options = parseArgs(process.argv.slice(2));
  await rm(RESOLVED_ARTIFACT_DIR, { recursive: true, force: true });
  await mkdir(RESOLVED_ARTIFACT_DIR, { recursive: true });

  const design = await readJson(DESIGN_FIXTURE_PATH);
  const designReport = await readOptionalJson(DESIGN_REPORT_PATH);
  const plan = buildHarnessPlan({
    design,
    tempDbPath: options.tempDbPath,
    preserveTempDb: options.preserveTempDb,
  });

  let result;
  let sqliteMethod = null;
  if (options.productDbPathPresent) {
    result = buildHarnessResult({
      plan,
      tempDbPath: options.tempDbPath,
      tempDbCreated: false,
      tempDbPreservedForInspection: false,
      inserted: false,
      errorMessage: "Product DB path options are forbidden for this harness.",
    });
  } else if (!isUnderHarnessTmp(options.tempDbPath)) {
    result = buildHarnessResult({
      plan,
      tempDbPath: options.tempDbPath,
      tempDbCreated: false,
      tempDbPreservedForInspection: false,
      inserted: false,
      errorMessage:
        "Temp DB path must be under /tmp/augnes-single-claim-write-prototype-v0-1.",
    });
  } else if (plan.harness_status !== "ready_for_temp_db_execution") {
    result = buildHarnessResult({
      plan,
      tempDbPath: options.tempDbPath,
      tempDbCreated: false,
      tempDbPreservedForInspection: false,
      inserted: false,
      errorMessage: `Harness blocked by design gates: ${plan.blocked_reasons.join(
        ", ",
      )}`,
    });
  } else {
    const sqlite = await loadSqliteImplementation();
    sqliteMethod = sqlite?.method ?? null;
    if (!sqlite) {
      result = buildHarnessResult({
        plan,
        tempDbPath: options.tempDbPath,
        tempDbCreated: false,
        tempDbPreservedForInspection: false,
        inserted: false,
        errorMessage:
          "No safe SQLite implementation was available. Install existing repo dependencies or provide a system sqlite3 CLI.",
      });
    } else {
      result = await executeHarnessWithSqlite({
        sqlite,
        plan,
        tempDbPath: options.tempDbPath,
        preserveTempDb: options.preserveTempDb,
      });
    }
  }

  const report = {
    report_kind: "manual_note_temp_db_single_claim_write_prototype_report",
    report_version: HARNESS_VERSION,
    artifact_dir: ARTIFACT_DIR,
    artifact_paths: {
      report: REPORT_PATH,
      harness_plan: PLAN_PATH,
      harness_result: RESULT_PATH,
      temp_db: result.temp_db_artifact.temp_db_path,
    },
    sqlite_tooling: {
      preferred: "better-sqlite3",
      fallback: "system sqlite3 CLI",
      selected: result.sqlite_method ?? sqliteMethod,
    },
    optional_inputs: {
      temp_db_single_claim_prototype_design_report_present: Boolean(designReport),
      temp_db_single_claim_prototype_design_report_final_status:
        designReport?.final_status ?? null,
    },
    harness_plan: plan,
    harness_result: result,
    preserved_boundaries: productWriteBoundary(),
    final_status: validateReport(result) ? "pass" : "fail",
  };

  await writeFile(PLAN_PATH, `${JSON.stringify(plan, null, 2)}\n`);
  await writeFile(RESULT_PATH, `${JSON.stringify(result, null, 2)}\n`);
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    JSON.stringify(
      {
        harness: "research-candidate-temp-db-single-claim-write-prototype-v0-1",
        final_status: report.final_status,
        result_status: result.result_status,
        sqlite_method: result.sqlite_method,
        temp_db_path: result.temp_db_artifact.temp_db_path,
        temp_db_preserved_for_inspection:
          result.temp_db_artifact.temp_db_preserved_for_inspection,
        row_counts: result.verification.row_counts,
        artifact_paths: report.artifact_paths,
      },
      null,
      2,
    ),
  );

  if (report.final_status !== "pass") {
    process.exitCode = 1;
  }
}

function parseArgs(args) {
  let tempDbPath = DEFAULT_TEMP_DB_PATH;
  let preserveTempDb = true;
  let productDbPathPresent = false;
  for (const arg of args) {
    if (arg === "--delete-temp-db" || arg === "--preserve-temp-db=false") {
      preserveTempDb = false;
      continue;
    }
    if (arg === "--preserve-temp-db=true") {
      preserveTempDb = true;
      continue;
    }
    if (arg.startsWith("--temp-db-path=")) {
      tempDbPath = arg.slice("--temp-db-path=".length);
      continue;
    }
    if (arg.startsWith("--product-db-path=") || arg.startsWith("--db-path=")) {
      productDbPathPresent = true;
    }
  }
  return {
    tempDbPath: normalizeTempDbPath(tempDbPath),
    preserveTempDb,
    productDbPathPresent,
  };
}

async function executeHarnessWithSqlite({
  sqlite,
  plan,
  tempDbPath,
  preserveTempDb,
}) {
  const insertedRecords = buildInsertedRecords(plan, true);
  const previewDraftId =
    asString(valueAt(plan, ["source_design", "preview_draft_id"])) ??
    "preview-draft:fixture";
  const executionValues = {
    temp_claim_record_id:
      insertedRecords.temp_claim_record.temp_claim_record_id,
    preview_draft_id: previewDraftId,
    source_operation_id:
      insertedRecords.temp_claim_record.source_operation_id ?? "missing",
    source_temp_intent_id:
      insertedRecords.temp_claim_record.source_temp_intent_id ?? "missing",
    temp_idempotency_key:
      insertedRecords.temp_idempotency_record.temp_idempotency_key,
    claim_candidate_text_source: "fixture_operation_metadata_only",
    raw_manual_note_text_included: 0,
    created_in_temp_db_now: 1,
    selected_claim_operation_id:
      plan.temp_insert_plan.selected_claim_operation_id ?? "missing",
    transaction_plan_fingerprint: "source-transaction-plan-fixture",
    design_fingerprint: plan.source_design.design_fingerprint ?? "missing",
    storage_scope: "temp_db_only",
    temp_rollback_record_id: `temp-rollback:${stableSuffix(
      insertedRecords.temp_idempotency_record.temp_idempotency_key,
    )}`,
    rollback_strategy: "delete_temp_claim_record_by_temp_idempotency_key",
    rollback_executed_now: 0,
    temp_review_audit_record_id: `temp-audit:${stableSuffix(
      plan.source_design.design_fingerprint,
    )}`,
    records_operator_decision: 0,
    records_prototype_design_inputs: 1,
  };

  validateSqlStatements([
    ...schemaSqlStatements(),
    ...insertSqlStatements(),
    ...selectCountSqlStatements(),
  ]);

  await mkdir(path.dirname(tempDbPath), { recursive: true });
  await sqlite.execute({
    dbPath: tempDbPath,
    schemaStatements: schemaSqlStatements(),
    insertStatements: insertSqlStatements(),
    values: executionValues,
  });
  const rowCounts = await sqlite.rowCounts({
    dbPath: tempDbPath,
    selectStatements: selectCountSqlStatements(),
  });

  if (!preserveTempDb && existsSync(tempDbPath)) {
    await unlink(tempDbPath);
  }

  return buildHarnessResult({
    plan,
    tempDbPath,
    tempDbCreated: true,
    tempDbPreservedForInspection: preserveTempDb,
    sqliteMethod: sqlite.method,
    rowCounts,
    inserted: true,
    errorMessage: null,
  });
}

async function loadSqliteImplementation() {
  try {
    const imported = await import("better-sqlite3");
    const Database = imported.default ?? imported;
    return {
      method: "better-sqlite3",
      async execute({ dbPath, schemaStatements, insertStatements, values }) {
        const db = new Database(dbPath);
        try {
          for (const statement of schemaStatements) db.exec(statement);
          db.prepare(insertStatements[0]).run({
            temp_claim_record_id: values.temp_claim_record_id,
            preview_draft_id: values.preview_draft_id,
            source_operation_id: values.source_operation_id,
            source_temp_intent_id: values.source_temp_intent_id,
            temp_idempotency_key: values.temp_idempotency_key,
            claim_candidate_text_source: values.claim_candidate_text_source,
            raw_manual_note_text_included:
              values.raw_manual_note_text_included,
            created_in_temp_db_now: values.created_in_temp_db_now,
          });
          db.prepare(insertStatements[1]).run({
            temp_idempotency_key: values.temp_idempotency_key,
            preview_draft_id: values.preview_draft_id,
            selected_claim_operation_id: values.selected_claim_operation_id,
            transaction_plan_fingerprint: values.transaction_plan_fingerprint,
            design_fingerprint: values.design_fingerprint,
            storage_scope: values.storage_scope,
          });
          db.prepare(insertStatements[2]).run({
            temp_rollback_record_id: values.temp_rollback_record_id,
            temp_idempotency_key: values.temp_idempotency_key,
            target_temp_claim_record_id: values.temp_claim_record_id,
            rollback_strategy: values.rollback_strategy,
            rollback_executed_now: values.rollback_executed_now,
          });
          db.prepare(insertStatements[3]).run({
            temp_review_audit_record_id: values.temp_review_audit_record_id,
            preview_draft_id: values.preview_draft_id,
            selected_claim_operation_id: values.selected_claim_operation_id,
            design_fingerprint: values.design_fingerprint,
            records_operator_decision: values.records_operator_decision,
            records_prototype_design_inputs:
              values.records_prototype_design_inputs,
          });
        } finally {
          db.close();
        }
      },
      async rowCounts({ dbPath, selectStatements }) {
        const db = new Database(dbPath, { readonly: true });
        try {
          return {
            temp_claim_records: db.prepare(selectStatements[0]).get().count,
            temp_idempotency_records: db.prepare(selectStatements[1]).get().count,
            temp_rollback_records: db.prepare(selectStatements[2]).get().count,
            temp_review_audit_records: db.prepare(selectStatements[3]).get().count,
          };
        } finally {
          db.close();
        }
      },
    };
  } catch {
    try {
      const sqlitePath = execFileSync("which", ["sqlite3"], {
        encoding: "utf8",
      }).trim();
      if (!sqlitePath) return null;
      return {
        method: "system sqlite3 CLI",
        async execute({ dbPath, schemaStatements, insertStatements, values }) {
          const sql = [
            ...schemaStatements,
            insertStatements[0].replace(
              /@\w+/g,
              (placeholder) => sqlLiteral(values[placeholder.slice(1)]),
            ),
            insertStatements[1].replace(
              /@\w+/g,
              (placeholder) => sqlLiteral(values[placeholder.slice(1)]),
            ),
            insertStatements[2].replace(
              /@\w+/g,
              (placeholder) => sqlLiteral(values[placeholder.slice(1)]),
            ),
            insertStatements[3].replace(
              /@\w+/g,
              (placeholder) => sqlLiteral(values[placeholder.slice(1)]),
            ),
          ].join(";\n");
          execFileSync(sqlitePath, [dbPath], {
            input: `${sql};\n`,
            encoding: "utf8",
          });
        },
        async rowCounts({ dbPath, selectStatements }) {
          const counts = {};
          for (const [index, tableName] of TEMP_TABLES.entries()) {
            counts[tableName] = Number(
              execFileSync(sqlitePath, ["-batch", "-noheader", dbPath, selectStatements[index]], {
                encoding: "utf8",
              }).trim(),
            );
          }
          return counts;
        },
      };
    } catch {
      return null;
    }
  }
}

function buildHarnessPlan({ design, tempDbPath, preserveTempDb }) {
  const selectedClaimOperation = design.selected_claim_operation ?? {};
  const gateResults = buildGateResults(design, tempDbPath);
  const blockedReasons = gateResults
    .filter((gateResult) => gateResult.status === "block")
    .map((gateResult) => gateResult.gate_id);
  const planCore = {
    harness_kind: "manual_note_temp_db_single_claim_write_prototype_harness",
    harness_version: HARNESS_VERSION,
    harness_fingerprint: "",
    source_design: {
      design_version: design.design_version ?? null,
      design_fingerprint: design.design_fingerprint ?? null,
      prototype_status: design.prototype_status ?? null,
      selected_claim_operation_id: selectedClaimOperation.operation_id ?? null,
      next_recommended_slice: design.next_recommended_slice ?? null,
    },
    harness_status:
      blockedReasons.length === 0
        ? "ready_for_temp_db_execution"
        : "blocked_by_design_gate",
    execution_mode: "temp_db_single_claim_only",
    temp_db_boundary: tempDbBoundary(),
    temp_schema_plan: {
      executable_sql_included: true,
      sql_scope: "temp_db_only",
      temp_tables: [...TEMP_TABLES],
      product_table_names_forbidden: true,
      schema_sql_statements: schemaSqlStatements(),
    },
    temp_insert_plan: {
      exactly_one_claim_record: true,
      exactly_one_idempotency_record: true,
      exactly_one_rollback_record: true,
      exactly_one_review_audit_record: true,
      insert_sql_scope: "temp_db_only",
      selected_claim_operation_id: selectedClaimOperation.operation_id ?? null,
      source_temp_intent_id: selectedClaimOperation.source_temp_intent_id ?? null,
      raw_manual_note_text_included: false,
      product_ids_created: false,
    },
    expected_row_counts: expectedRowCounts(),
    execution_gates: [...EXECUTION_GATES],
    gate_results: gateResults,
    blocked_reasons: blockedReasons,
    preserve_temp_db_for_inspection: preserveTempDb,
    requested_temp_db_path: tempDbPath,
    next_recommended_slice: "temp_db_single_claim_write_prototype_result_review",
  };
  return {
    ...planCore,
    harness_fingerprint: fingerprint(planCore),
  };
}

function buildHarnessResult({
  plan,
  tempDbPath,
  tempDbCreated,
  tempDbPreservedForInspection,
  sqliteMethod = null,
  rowCounts = null,
  inserted,
  errorMessage = null,
}) {
  const normalizedRowCounts = { ...zeroRowCounts(), ...(rowCounts ?? {}) };
  const expectedMatch = rowCountsMatch(
    normalizedRowCounts,
    plan.expected_row_counts,
  );
  const resultStatus =
    plan.harness_status !== "ready_for_temp_db_execution"
      ? "blocked_before_temp_db_write"
      : errorMessage
        ? "temp_db_write_failed"
        : expectedMatch && inserted
          ? "temp_db_write_passed"
          : "temp_db_write_failed";
  const resultCore = {
    result_kind: "manual_note_temp_db_single_claim_write_prototype_result",
    result_version: HARNESS_VERSION,
    result_fingerprint: "",
    source_harness_fingerprint: plan.harness_fingerprint,
    source_design_fingerprint: plan.source_design.design_fingerprint,
    execution_mode: "temp_db_single_claim_only",
    sqlite_method: sqliteMethod,
    result_status: resultStatus,
    failure_message: errorMessage,
    temp_db_artifact: {
      temp_db_path: tempDbPath ?? null,
      temp_db_created: Boolean(tempDbCreated),
      temp_db_preserved_for_inspection: Boolean(tempDbPreservedForInspection),
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
    inserted_records: buildInsertedRecords(plan, Boolean(inserted)),
    verification: {
      row_counts: normalizedRowCounts,
      expected_row_counts_match: expectedMatch,
      temp_tables_only: true,
      product_ids_absent: true,
      raw_manual_note_absent: true,
      product_db_untouched: true,
    },
    product_write_boundary: productWriteBoundary(),
    next_recommended_slice: "temp_db_single_claim_write_prototype_result_review",
  };
  const resultFingerprint = fingerprint(resultCore);
  const result = {
    ...resultCore,
    result_fingerprint: resultFingerprint,
  };
  return {
    ...result,
    local_copy_packet: {
      markdown: buildMarkdown(result),
      json: buildJson(result),
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

function buildGateResults(design, tempDbPath) {
  const selectedClaimOperation = design.selected_claim_operation ?? {};
  const sourceTransactionPlan = design.source_transaction_plan ?? {};
  const productWriteBoundary = design.product_write_boundary ?? {};
  const gatesStatus = Array.isArray(design.gates_status) ? design.gates_status : [];
  return [
    gate(
      "design_status_ready",
      design.prototype_status === "design_only_ready_for_temp_execution_spec" &&
        gatesStatus.every((gateStatus) => gateStatus.status === "pass"),
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
      [...schemaSqlStatements(), ...insertSqlStatements(), ...selectCountSqlStatements()].every(
        sqlReferencesOnlyTempTables,
      ),
      "Executable SQL is limited to temp harness tables.",
    ),
    gate(
      "no_raw_manual_note_text",
      design.temp_claim_write_shape?.raw_manual_note_text_included === false,
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

function schemaSqlStatements() {
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

function insertSqlStatements() {
  return [
    [
      "INSERT INTO temp_claim_records (",
      "temp_claim_record_id, preview_draft_id, source_operation_id, source_temp_intent_id,",
      "temp_idempotency_key, claim_candidate_text_source, raw_manual_note_text_included, created_in_temp_db_now",
      ") VALUES (",
      "@temp_claim_record_id, @preview_draft_id, @source_operation_id, @source_temp_intent_id,",
      "@temp_idempotency_key, @claim_candidate_text_source, @raw_manual_note_text_included, @created_in_temp_db_now",
      ")",
    ].join(" "),
    [
      "INSERT INTO temp_idempotency_records (",
      "temp_idempotency_key, preview_draft_id, selected_claim_operation_id,",
      "transaction_plan_fingerprint, design_fingerprint, storage_scope",
      ") VALUES (",
      "@temp_idempotency_key, @preview_draft_id, @selected_claim_operation_id,",
      "@transaction_plan_fingerprint, @design_fingerprint, @storage_scope",
      ")",
    ].join(" "),
    [
      "INSERT INTO temp_rollback_records (",
      "temp_rollback_record_id, temp_idempotency_key, target_temp_claim_record_id,",
      "rollback_strategy, rollback_executed_now",
      ") VALUES (",
      "@temp_rollback_record_id, @temp_idempotency_key, @target_temp_claim_record_id,",
      "@rollback_strategy, @rollback_executed_now",
      ")",
    ].join(" "),
    [
      "INSERT INTO temp_review_audit_records (",
      "temp_review_audit_record_id, preview_draft_id, selected_claim_operation_id,",
      "design_fingerprint, records_operator_decision, records_prototype_design_inputs",
      ") VALUES (",
      "@temp_review_audit_record_id, @preview_draft_id, @selected_claim_operation_id,",
      "@design_fingerprint, @records_operator_decision, @records_prototype_design_inputs",
      ")",
    ].join(" "),
  ];
}

function selectCountSqlStatements() {
  return TEMP_TABLES.map((tableName) => `SELECT COUNT(*) AS count FROM ${tableName}`);
}

function validateSqlStatements(statements) {
  for (const statement of statements) {
    if (!sqlReferencesOnlyTempTables(statement)) {
      throw new Error(`SQL statement is outside temp-table scope: ${statement}`);
    }
  }
}

function sqlReferencesOnlyTempTables(sql) {
  const forbiddenTablePattern =
    /\b(claims|evidences?|proofs?|perspectives?|canonical_graph|canonical_graph_edges?|work_items?|sources?|source_documents?)\b/i;
  if (forbiddenTablePattern.test(sql)) return false;
  return TEMP_TABLES.some((tableName) => sql.includes(tableName));
}

function buildInsertedRecords(plan, inserted) {
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

function validateReport(result) {
  if (result.result_kind !== "manual_note_temp_db_single_claim_write_prototype_result") {
    return false;
  }
  if (result.result_version !== HARNESS_VERSION) return false;
  if (result.result_status !== "temp_db_write_passed") return false;
  if (!result.temp_db_artifact.temp_db_under_tmp) return false;
  if (!result.temp_db_artifact.temp_db_created) return false;
  if (result.temp_db_artifact.product_db_path_used !== false) return false;
  if (!result.verification.expected_row_counts_match) return false;
  if (!result.verification.temp_tables_only) return false;
  if (!result.verification.product_ids_absent) return false;
  if (!result.verification.raw_manual_note_absent) return false;
  if (result.executed_sql_summary.create_table_statement_count !== 4) return false;
  if (result.executed_sql_summary.insert_statement_count !== 4) return false;
  if (result.executed_sql_summary.select_statement_count !== 4) return false;
  if (result.executed_sql_summary.product_table_statement_count !== 0) {
    return false;
  }
  for (const tableName of TEMP_TABLES) {
    if (result.verification.row_counts[tableName] !== 1) return false;
  }
  return validateBoundary(result.product_write_boundary);
}

function validateBoundary(boundary) {
  if (boundary.temp_db_execution_only !== true) return false;
  for (const [key, value] of Object.entries(boundary)) {
    if (key === "temp_db_execution_only") continue;
    if (value !== false) return false;
  }
  return true;
}

function tempDbBoundary() {
  return {
    temp_db_only: true,
    temp_db_path_required_under_tmp: true,
    product_db_path_allowed: false,
    product_db_write_allowed: false,
    repo_schema_change_allowed: false,
    migration_allowed: false,
  };
}

function productWriteBoundary() {
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

function expectedRowCounts() {
  return {
    temp_claim_records: 1,
    temp_idempotency_records: 1,
    temp_rollback_records: 1,
    temp_review_audit_records: 1,
  };
}

function zeroRowCounts() {
  return {
    temp_claim_records: 0,
    temp_idempotency_records: 0,
    temp_rollback_records: 0,
    temp_review_audit_records: 0,
  };
}

function rowCountsMatch(rowCounts, expected) {
  return TEMP_TABLES.every((tableName) => rowCounts[tableName] === expected[tableName]);
}

function gate(gateId, passed, message) {
  return {
    gate_id: gateId,
    status: passed ? "pass" : "block",
    message,
  };
}

function buildMarkdown(result) {
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

function buildJson(result) {
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

function normalizeTempDbPath(inputPath) {
  if (typeof inputPath !== "string") return null;
  return path.resolve(inputPath);
}

function isUnderHarnessTmp(value) {
  if (typeof value !== "string") return false;
  const resolved = path.resolve(value);
  return (
    resolved.startsWith(`${RESOLVED_ARTIFACT_DIR}${path.sep}`) &&
    resolved.endsWith(".sqlite")
  );
}

function stableSuffix(value) {
  return fnv1a32(String(value ?? "missing"));
}

function sqlLiteral(value) {
  if (typeof value === "number") return String(value);
  return `'${String(value ?? "").replaceAll("'", "''")}'`;
}

function asString(value) {
  return typeof value === "string" ? value : null;
}

function valueAt(value, pathParts) {
  let current = value;
  for (const key of pathParts) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      return undefined;
    }
    current = current[key];
  }
  return current;
}

function fingerprint(input) {
  return `fnv1a32:${fnv1a32(canonicalJson(stripGeneratedFields(input)))}`;
}

function stripGeneratedFields(value) {
  if (Array.isArray(value)) {
    return value.map((item) => stripGeneratedFields(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "generated_at" && key !== "local_copy_packet")
        .map(([key, nestedValue]) => [key, stripGeneratedFields(nestedValue)]),
    );
  }
  return value;
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function fnv1a32(input) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

await main();
