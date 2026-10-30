// This family owns its migration implementations and canonical result assembly.
export function migrateAutonomyDelegationGrants(db) {
  const tableName = "autonomy_delegation_grants";
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  const indexNames = [
    "idx_autonomy_delegation_grants_scope_created",
    "idx_autonomy_delegation_grants_scope_status_created",
    "idx_autonomy_delegation_grants_scope_mode_created",
    "idx_autonomy_delegation_grants_approval_ref",
    "idx_autonomy_delegation_grants_source_contract_fingerprint",
  ];
  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND name IN (${indexNames.map(() => "?").join(", ")})
        `,
      )
      .all(...indexNames)
      .map((index) => index.name),
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS autonomy_delegation_grants (
      grant_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      grant_status TEXT NOT NULL,
      grant_mode TEXT NOT NULL,
      approval_ref TEXT NOT NULL,
      approved_by TEXT,
      approved_at TEXT,
      approval_basis TEXT,
      approval_text_fingerprint TEXT NOT NULL,
      source_contract_id TEXT,
      source_contract_fingerprint TEXT,
      source_contract_version TEXT,
      source_autonomy_mode TEXT,
      idempotency_key TEXT NOT NULL UNIQUE,
      allowed_work_classes_json TEXT NOT NULL,
      forbidden_work_classes_json TEXT NOT NULL,
      allowed_actions_json TEXT NOT NULL,
      forbidden_actions_json TEXT NOT NULL,
      budget_json TEXT NOT NULL,
      reporting_cadence_json TEXT NOT NULL,
      stop_conditions_json TEXT NOT NULL,
      allowed_outputs_json TEXT NOT NULL,
      forbidden_outputs_json TEXT NOT NULL,
      revocation_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      grant_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_scope_created
      ON autonomy_delegation_grants(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_scope_status_created
      ON autonomy_delegation_grants(scope, grant_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_scope_mode_created
      ON autonomy_delegation_grants(scope, grant_mode, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_approval_ref
      ON autonomy_delegation_grants(approval_ref);
    CREATE INDEX IF NOT EXISTS idx_autonomy_delegation_grants_source_contract_fingerprint
      ON autonomy_delegation_grants(source_contract_fingerprint);
  `);

  return {
    table_found: true,
    created_tables: existingTable ? [] : [tableName],
    created_indexes: indexNames.filter((indexName) => !existingIndexes.has(indexName)),
  };
}

export function migrateAutohuntWorkQueueCandidates(db) {
  const tableName = "autohunt_work_queue_candidates";
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  const indexNames = [
    "idx_autohunt_work_queue_candidates_scope_created",
    "idx_autohunt_work_queue_candidates_source_grant_id_created",
    "idx_autohunt_work_queue_candidates_source_grant_fingerprint_created",
    "idx_autohunt_work_queue_candidates_candidate_status_created",
    "idx_autohunt_work_queue_candidates_candidate_origin_created",
    "idx_autohunt_work_queue_candidates_work_class_created",
  ];
  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND name IN (${indexNames.map(() => "?").join(", ")})
        `,
      )
      .all(...indexNames)
      .map((index) => index.name),
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_work_queue_candidates (
      candidate_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      candidate_status TEXT NOT NULL,
      candidate_origin TEXT NOT NULL,
      source_grant_id TEXT NOT NULL,
      source_grant_fingerprint TEXT NOT NULL,
      source_grant_status TEXT NOT NULL,
      source_grant_mode TEXT NOT NULL,
      work_class TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      title_summary_fingerprint TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      source_refs_json TEXT NOT NULL,
      source_fingerprints_json TEXT NOT NULL,
      evidence_refs_json TEXT NOT NULL,
      required_context_refs_json TEXT NOT NULL,
      proposed_files_or_globs_json TEXT NOT NULL,
      expected_outputs_json TEXT NOT NULL,
      required_checks_json TEXT NOT NULL,
      blocked_actions_json TEXT NOT NULL,
      stop_conditions_json TEXT NOT NULL,
      budget_projection_json TEXT NOT NULL,
      grant_fit_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      candidate_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_work_queue_candidates_scope_created
      ON autohunt_work_queue_candidates(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_work_queue_candidates_source_grant_id_created
      ON autohunt_work_queue_candidates(source_grant_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_work_queue_candidates_source_grant_fingerprint_created
      ON autohunt_work_queue_candidates(source_grant_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_work_queue_candidates_candidate_status_created
      ON autohunt_work_queue_candidates(candidate_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_work_queue_candidates_candidate_origin_created
      ON autohunt_work_queue_candidates(candidate_origin, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_work_queue_candidates_work_class_created
      ON autohunt_work_queue_candidates(work_class, created_at DESC);
  `);

  return {
    table_found: true,
    created_tables: existingTable ? [] : [tableName],
    created_indexes: indexNames.filter((indexName) => !existingIndexes.has(indexName)),
  };
}

export function migrateAutohuntPreflightPackets(db) {
  const tableName = "autohunt_preflight_packets";
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  const indexNames = [
    "idx_autohunt_preflight_packets_scope_created",
    "idx_autohunt_preflight_packets_source_grant_id_created",
    "idx_autohunt_preflight_packets_source_grant_fingerprint_created",
    "idx_autohunt_preflight_packets_preflight_status_created",
  ];
  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND name IN (${indexNames.map(() => "?").join(", ")})
        `,
      )
      .all(...indexNames)
      .map((index) => index.name),
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_preflight_packets (
      preflight_packet_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      preflight_status TEXT NOT NULL,
      source_grant_id TEXT NOT NULL,
      source_grant_fingerprint TEXT NOT NULL,
      source_grant_status TEXT NOT NULL,
      source_grant_mode TEXT NOT NULL,
      selected_candidate_ids_json TEXT NOT NULL,
      selected_candidate_fingerprints_json TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      source_queue_readback_json TEXT NOT NULL,
      selected_candidates_json TEXT NOT NULL,
      aggregate_budget_projection_json TEXT NOT NULL,
      grant_budget_remaining_projection_json TEXT NOT NULL,
      preflight_checks_json TEXT NOT NULL,
      blocked_actions_json TEXT NOT NULL,
      stop_conditions_json TEXT NOT NULL,
      required_checks_json TEXT NOT NULL,
      next_allowed_outputs_json TEXT NOT NULL,
      forbidden_outputs_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      preflight_packet_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_preflight_packets_scope_created
      ON autohunt_preflight_packets(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_preflight_packets_source_grant_id_created
      ON autohunt_preflight_packets(source_grant_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_preflight_packets_source_grant_fingerprint_created
      ON autohunt_preflight_packets(source_grant_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_preflight_packets_preflight_status_created
      ON autohunt_preflight_packets(preflight_status, created_at DESC);
  `);

  return {
    table_found: true,
    created_tables: existingTable ? [] : [tableName],
    created_indexes: indexNames.filter((indexName) => !existingIndexes.has(indexName)),
  };
}

export function migrateAutohuntHandoffPlanPreviews(db) {
  const tableName = "autohunt_handoff_plan_previews";
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  const indexNames = [
    "idx_autohunt_handoff_plan_previews_scope_created",
    "idx_autohunt_handoff_plan_previews_source_grant_id_created",
    "idx_autohunt_handoff_plan_previews_source_preflight_packet_id_created",
    "idx_autohunt_handoff_plan_previews_handoff_plan_status_created",
  ];
  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND name IN (${indexNames.map(() => "?").join(", ")})
        `,
      )
      .all(...indexNames)
      .map((index) => index.name),
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_handoff_plan_previews (
      handoff_plan_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      handoff_plan_status TEXT NOT NULL,
      source_grant_id TEXT NOT NULL,
      source_grant_fingerprint TEXT NOT NULL,
      source_grant_status TEXT NOT NULL,
      source_grant_mode TEXT NOT NULL,
      source_preflight_packet_id TEXT NOT NULL,
      source_preflight_packet_fingerprint TEXT NOT NULL,
      source_workbench_spine_fingerprint TEXT NOT NULL,
      selected_candidate_ids_json TEXT NOT NULL,
      selected_candidate_fingerprints_json TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      selected_candidate_plan_summaries_json TEXT NOT NULL,
      supervised_codex_prompt_plan_json TEXT NOT NULL,
      draft_pr_plan_json TEXT NOT NULL,
      operator_review_packet_json TEXT NOT NULL,
      aggregate_budget_projection_json TEXT NOT NULL,
      blocked_actions_json TEXT NOT NULL,
      next_allowed_outputs_json TEXT NOT NULL,
      forbidden_outputs_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      handoff_plan_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_previews_scope_created
      ON autohunt_handoff_plan_previews(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_previews_source_grant_id_created
      ON autohunt_handoff_plan_previews(source_grant_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_previews_source_preflight_packet_id_created
      ON autohunt_handoff_plan_previews(source_preflight_packet_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_previews_handoff_plan_status_created
      ON autohunt_handoff_plan_previews(handoff_plan_status, created_at DESC);
  `);

  return {
    table_found: true,
    created_tables: existingTable ? [] : [tableName],
    created_indexes: indexNames.filter((indexName) => !existingIndexes.has(indexName)),
  };
}

export function migrateAutohuntHandoffPlanOperatorReviewDecisions(db) {
  const tableName = "autohunt_handoff_plan_operator_review_decisions";
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  const indexNames = [
    "idx_autohunt_handoff_plan_operator_review_decisions_scope_created",
    "idx_autohunt_handoff_plan_operator_review_decisions_source_handoff_plan_id_created",
    "idx_autohunt_handoff_plan_operator_review_decisions_decision_status_created",
    "idx_autohunt_handoff_plan_operator_review_decisions_operator_decision_created",
  ];
  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND name IN (${indexNames.map(() => "?").join(", ")})
        `,
      )
      .all(...indexNames)
      .map((index) => index.name),
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_handoff_plan_operator_review_decisions (
      decision_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      decision_status TEXT NOT NULL,
      operator_decision TEXT NOT NULL,
      source_handoff_plan_id TEXT NOT NULL,
      source_handoff_plan_fingerprint TEXT NOT NULL,
      source_handoff_plan_status TEXT NOT NULL,
      source_grant_id TEXT NOT NULL,
      source_grant_fingerprint TEXT NOT NULL,
      source_preflight_packet_id TEXT NOT NULL,
      source_preflight_packet_fingerprint TEXT NOT NULL,
      source_workbench_spine_fingerprint TEXT NOT NULL,
      selected_candidate_ids_json TEXT NOT NULL,
      selected_candidate_fingerprints_json TEXT NOT NULL,
      review_basis_ref TEXT NOT NULL,
      reviewed_by TEXT,
      reviewed_at TEXT,
      review_basis_fingerprint TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      accepted_summary_json TEXT,
      defer_or_reject_summary_json TEXT,
      source_chain_validation_json TEXT NOT NULL,
      blocked_actions_json TEXT NOT NULL,
      next_allowed_outputs_json TEXT NOT NULL,
      forbidden_outputs_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      decision_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_operator_review_decisions_scope_created
      ON autohunt_handoff_plan_operator_review_decisions(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_operator_review_decisions_source_handoff_plan_id_created
      ON autohunt_handoff_plan_operator_review_decisions(source_handoff_plan_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_operator_review_decisions_decision_status_created
      ON autohunt_handoff_plan_operator_review_decisions(decision_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_handoff_plan_operator_review_decisions_operator_decision_created
      ON autohunt_handoff_plan_operator_review_decisions(operator_decision, created_at DESC);
  `);

  return {
    table_found: true,
    created_tables: existingTable ? [] : [tableName],
    created_indexes: indexNames.filter((indexName) => !existingIndexes.has(indexName)),
  };
}

export function migrateAutohuntSupervisedExecutionContracts(db) {
  const tableName = "autohunt_supervised_execution_contracts";
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  const indexNames = [
    "idx_autohunt_supervised_execution_contracts_scope_created",
    "idx_autohunt_supervised_execution_contracts_contract_status_created",
    "idx_autohunt_supervised_execution_contracts_source_readiness_gate_fingerprint_created",
    "idx_autohunt_supervised_execution_contracts_active_grant_fingerprint_created",
    "idx_autohunt_supervised_execution_contracts_ready_preflight_packet_fingerprint_created",
    "idx_autohunt_supervised_execution_contracts_operator_decision_fingerprint_created",
  ];
  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND name IN (${indexNames.map(() => "?").join(", ")})
        `,
      )
      .all(...indexNames)
      .map((index) => index.name),
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_supervised_execution_contracts (
      contract_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      contract_status TEXT NOT NULL,
      source_readiness_gate_fingerprint TEXT NOT NULL,
      active_grant_id TEXT NOT NULL,
      active_grant_fingerprint TEXT NOT NULL,
      latest_queued_candidate_id TEXT NOT NULL,
      latest_queued_candidate_fingerprint TEXT NOT NULL,
      ready_preflight_packet_id TEXT NOT NULL,
      ready_preflight_packet_fingerprint TEXT NOT NULL,
      handoff_plan_id TEXT NOT NULL,
      handoff_plan_fingerprint TEXT NOT NULL,
      operator_decision_id TEXT NOT NULL,
      operator_decision_fingerprint TEXT NOT NULL,
      copy_export_preview_fingerprint TEXT NOT NULL,
      launch_mode TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      freshness_contract_json TEXT NOT NULL,
      launch_envelope_json TEXT NOT NULL,
      launcher_may_json TEXT NOT NULL,
      launcher_must_not_json TEXT NOT NULL,
      launch_guard_checks_json TEXT NOT NULL,
      launch_guard_result_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      contract_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_scope_created
      ON autohunt_supervised_execution_contracts(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_contract_status_created
      ON autohunt_supervised_execution_contracts(contract_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_source_readiness_gate_fingerprint_created
      ON autohunt_supervised_execution_contracts(source_readiness_gate_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_active_grant_fingerprint_created
      ON autohunt_supervised_execution_contracts(active_grant_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_ready_preflight_packet_fingerprint_created
      ON autohunt_supervised_execution_contracts(ready_preflight_packet_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_supervised_execution_contracts_operator_decision_fingerprint_created
      ON autohunt_supervised_execution_contracts(operator_decision_fingerprint, created_at DESC);
  `);

  return {
    table_found: true,
    created_tables: existingTable ? [] : [tableName],
    created_indexes: indexNames.filter((indexName) => !existingIndexes.has(indexName)),
  };
}

export function migrateAutohuntResultIntakes(db) {
  const tableName = "autohunt_result_intakes";
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  const indexNames = [
    "idx_autohunt_result_intakes_scope_created",
    "idx_autohunt_result_intakes_source_execution_contract_id_created",
    "idx_autohunt_result_intakes_source_execution_contract_fingerprint_created",
    "idx_autohunt_result_intakes_result_intake_status_created",
    "idx_autohunt_result_intakes_result_report_fingerprint_created",
  ];
  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND name IN (${indexNames.map(() => "?").join(", ")})
        `,
      )
      .all(...indexNames)
      .map((index) => index.name),
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_result_intakes (
      result_intake_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      result_intake_status TEXT NOT NULL,
      source_execution_contract_id TEXT NOT NULL,
      source_execution_contract_fingerprint TEXT NOT NULL,
      source_execution_contract_status TEXT NOT NULL,
      source_readiness_gate_fingerprint TEXT NOT NULL,
      active_grant_id TEXT NOT NULL,
      active_grant_fingerprint TEXT NOT NULL,
      ready_preflight_packet_id TEXT NOT NULL,
      ready_preflight_packet_fingerprint TEXT NOT NULL,
      operator_decision_id TEXT NOT NULL,
      operator_decision_fingerprint TEXT NOT NULL,
      copy_export_preview_fingerprint TEXT NOT NULL,
      result_report_id TEXT NOT NULL,
      result_report_fingerprint TEXT NOT NULL,
      result_status TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      structured_result_report_json TEXT NOT NULL,
      expected_observed_delta_candidate_json TEXT NOT NULL,
      reuse_outcome_candidate_json TEXT NOT NULL,
      residual_diagnostic_candidate_json TEXT NOT NULL,
      learning_loop_summary_json TEXT NOT NULL,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      result_intake_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_scope_created
      ON autohunt_result_intakes(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_source_execution_contract_id_created
      ON autohunt_result_intakes(source_execution_contract_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_source_execution_contract_fingerprint_created
      ON autohunt_result_intakes(source_execution_contract_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_result_intake_status_created
      ON autohunt_result_intakes(result_intake_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_result_intakes_result_report_fingerprint_created
      ON autohunt_result_intakes(result_report_fingerprint, created_at DESC);
  `);

  return {
    table_found: true,
    created_tables: existingTable ? [] : [tableName],
    created_indexes: indexNames.filter((indexName) => !existingIndexes.has(indexName)),
  };
}

export function migrateAutohuntDailyLauncherRuns(db) {
  const tableName = "autohunt_daily_launcher_runs";
  const existingTable = db
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name = ?
      `,
    )
    .get(tableName);
  const indexNames = [
    "idx_autohunt_daily_launcher_runs_scope_created",
    "idx_autohunt_daily_launcher_runs_source_execution_contract_id_created",
    "idx_autohunt_daily_launcher_runs_source_execution_contract_fingerprint_created",
    "idx_autohunt_daily_launcher_runs_launcher_run_status_created",
    "idx_autohunt_daily_launcher_runs_handoff_packet_fingerprint_created",
    "idx_autohunt_daily_launcher_runs_confirmation_fingerprint_created",
  ];
  const existingIndexes = new Set(
    db
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'index'
            AND name IN (${indexNames.map(() => "?").join(", ")})
        `,
      )
      .all(...indexNames)
      .map((index) => index.name),
  );

  db.exec(`
    CREATE TABLE IF NOT EXISTS autohunt_daily_launcher_runs (
      launcher_run_id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('project:augnes')),
      launcher_run_status TEXT NOT NULL,
      source_execution_contract_id TEXT NOT NULL,
      source_execution_contract_fingerprint TEXT NOT NULL,
      source_execution_contract_status TEXT NOT NULL,
      launch_mode TEXT NOT NULL,
      active_grant_id TEXT NOT NULL,
      active_grant_fingerprint TEXT NOT NULL,
      ready_preflight_packet_id TEXT NOT NULL,
      ready_preflight_packet_fingerprint TEXT NOT NULL,
      operator_decision_id TEXT NOT NULL,
      operator_decision_fingerprint TEXT NOT NULL,
      copy_export_preview_fingerprint TEXT NOT NULL,
      confirmation_ref TEXT NOT NULL,
      confirmed_by TEXT,
      confirmed_at TEXT,
      confirmation_fingerprint TEXT NOT NULL,
      handoff_packet_id TEXT NOT NULL,
      handoff_packet_fingerprint TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      handoff_packet_json TEXT NOT NULL,
      launcher_run_boundary_json TEXT NOT NULL,
      structured_result_report_fixture_json TEXT,
      linked_result_intake_json TEXT,
      authority_boundary_json TEXT NOT NULL,
      persisted_material_boundary_json TEXT NOT NULL,
      validation_json TEXT NOT NULL,
      row_count_write_summary_json TEXT NOT NULL,
      launcher_run_fingerprint TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_scope_created
      ON autohunt_daily_launcher_runs(scope, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_source_execution_contract_id_created
      ON autohunt_daily_launcher_runs(source_execution_contract_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_source_execution_contract_fingerprint_created
      ON autohunt_daily_launcher_runs(source_execution_contract_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_launcher_run_status_created
      ON autohunt_daily_launcher_runs(launcher_run_status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_handoff_packet_fingerprint_created
      ON autohunt_daily_launcher_runs(handoff_packet_fingerprint, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_autohunt_daily_launcher_runs_confirmation_fingerprint_created
      ON autohunt_daily_launcher_runs(confirmation_fingerprint, created_at DESC);
  `);

  return {
    table_found: true,
    created_tables: existingTable ? [] : [tableName],
    created_indexes: indexNames.filter((indexName) => !existingIndexes.has(indexName)),
  };
}

export function prepareAutonomyAutohuntMigrations(db) {
  const autonomyDelegationGrantResult = migrateAutonomyDelegationGrants(db);
  const autohuntWorkQueueCandidateResult = migrateAutohuntWorkQueueCandidates(db);
  const autohuntPreflightPacketResult = migrateAutohuntPreflightPackets(db);
  const autohuntHandoffPlanPreviewResult = migrateAutohuntHandoffPlanPreviews(db);
  const autohuntHandoffPlanOperatorReviewDecisionResult =
    migrateAutohuntHandoffPlanOperatorReviewDecisions(db);
  const autohuntSupervisedExecutionContractResult =
    migrateAutohuntSupervisedExecutionContracts(db);
  const autohuntResultIntakeResult = migrateAutohuntResultIntakes(db);
  const autohuntDailyLauncherRunResult = migrateAutohuntDailyLauncherRuns(db);
  return {
    autonomyDelegationGrantResult,
    autohuntWorkQueueCandidateResult,
    autohuntPreflightPacketResult,
    autohuntHandoffPlanPreviewResult,
    autohuntHandoffPlanOperatorReviewDecisionResult,
    autohuntSupervisedExecutionContractResult,
    autohuntResultIntakeResult,
    autohuntDailyLauncherRunResult,
  };
}
