import { openDatabase } from "@/lib/db";
import {
  buildAutonomyDelegationGrantAuthorityBoundary,
  computeAutonomyDelegationGrantFingerprint,
  ensureAutonomyDelegationGrantSchema,
  parseAutonomyDelegationGrantRow,
  type AutonomyDelegationGrantDbLike,
} from "@/lib/autonomy/read-autonomy-delegation-grants";
import {
  assertAllFalseBoundary,
  buildDeterministicIdempotencyKey,
  containsForbiddenRawMaterial,
  findForbiddenRawMaterialFields,
  isTargetOnlyRowCountWrite,
  requiredStringFieldsPresent,
  stableJson,
  STABLE_FINGERPRINT_ALGORITHM as FINGERPRINT_ALGORITHM,
  stripFingerprintPrefix,
  summarizeTargetOnlyRowCountWrite,
  validateSourceBindingPairs,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import { RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES } from "@/types/research-candidate-manual-global-dogfood-perspective-existing-writer-dry-run-result";
import type {
  AutonomyDelegationGrant,
  AutonomyDelegationGrantBudget,
  AutonomyDelegationGrantInput,
  AutonomyDelegationGrantPersistedMaterialBoundary,
  AutonomyDelegationGrantReportingCadence,
  AutonomyDelegationGrantRevocation,
  AutonomyDelegationGrantRowCountWriteSummary,
  AutonomyDelegationGrantSourceAutonomyContract,
  AutonomyDelegationGrantValidation,
  AutonomyDelegationGrantWriteResult,
} from "@/types/autonomy-delegation-grant";
import {
  AUTONOMY_DELEGATION_GRANT_ALLOWED_OUTPUTS,
  AUTONOMY_DELEGATION_GRANT_FORBIDDEN_ACTIONS,
  AUTONOMY_DELEGATION_GRANT_FORBIDDEN_OUTPUTS,
  AUTONOMY_DELEGATION_GRANT_KIND,
  AUTONOMY_DELEGATION_GRANT_MODES,
  AUTONOMY_DELEGATION_GRANT_REQUIRED_FORBIDDEN_ACTIONS,
  AUTONOMY_DELEGATION_GRANT_STATUSES,
  AUTONOMY_DELEGATION_GRANT_TABLE,
  AUTONOMY_DELEGATION_GRANT_VERSION,
} from "@/types/autonomy-delegation-grant";

export interface WriteAutonomyDelegationGrantOptions {
  db?: AutonomyDelegationGrantDbLike;
  now?: string;
}

type RowCountSnapshot = Record<string, number>;

const NON_TARGET_ROW_COUNT_TABLES =
  RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES;

const TARGET_AND_NON_TARGET_TABLES = [
  AUTONOMY_DELEGATION_GRANT_TABLE,
  ...NON_TARGET_ROW_COUNT_TABLES,
] as const;

const REQUIRED_STOP_CONDITIONS = [
  "manual_stop_requested",
  "authority_boundary_unclear",
] as const;

const SAFE_RAW_MATERIAL_BOUNDARY_KEYS = new Set([
  "raw_approval_text_persisted",
  "persists_raw_user_approval_text",
  "persists_raw_prompt",
  "persists_raw_operator_note",
  "persists_secret_or_token",
  "persists_url_or_env_value",
]);

export function writeAutonomyDelegationGrant(
  input: AutonomyDelegationGrantInput,
  options: WriteAutonomyDelegationGrantOptions = {},
): AutonomyDelegationGrantWriteResult {
  const validationRefusalReasons = validateAutonomyDelegationGrantInput(input);
  if (validationRefusalReasons.length > 0) {
    return createRefusedResult(validationRefusalReasons);
  }

  const normalizedInput = normalizeGrantInput(input);
  const idempotencyKey = computeIdempotencyKey(normalizedInput);
  const db = options.db ?? openDatabase();
  const shouldClose = !options.db && hasClose(db);

  try {
    ensureAutonomyDelegationGrantSchema(db);
    const existingRow = db
      .prepare(
        `
          SELECT *
          FROM ${AUTONOMY_DELEGATION_GRANT_TABLE}
          WHERE idempotency_key = ?
        `,
      )
      .get(idempotencyKey);

    if (existingRow) {
      const existingGrant = parseAutonomyDelegationGrantRow(existingRow as never);
      if (
        existingGrant &&
        existingGrant.grant_fingerprint ===
          computeAutonomyDelegationGrantFingerprint(existingGrant)
      ) {
        return createAcceptedResult({
          result_status: "duplicate_replayed",
          grant: existingGrant,
          grant_record_written: false,
          duplicate_replayed: true,
        });
      }
      return createRefusedResult([
        "idempotency_conflict_existing_grant_fingerprint_mismatch",
      ]);
    }

    db.exec("BEGIN IMMEDIATE");
    try {
      const beforeCounts = captureRowCounts(db);
      const expectedWriteSummary = buildRowCountWriteSummary({
        beforeCounts,
        afterCounts: {
          ...beforeCounts,
          [AUTONOMY_DELEGATION_GRANT_TABLE]:
            beforeCounts[AUTONOMY_DELEGATION_GRANT_TABLE] + 1,
        },
      });
      const grant = buildGrant({
        input: normalizedInput,
        idempotencyKey,
        createdAt: options.now ?? new Date().toISOString(),
        rowCountWriteSummary: expectedWriteSummary,
      });

      insertGrant(db, grant);

      const afterCounts = captureRowCounts(db);
      const actualWriteSummary = buildRowCountWriteSummary({
        beforeCounts,
        afterCounts,
      });
      if (!isTargetOnlyWrite(actualWriteSummary)) {
        db.exec("ROLLBACK");
        return createRefusedResult([
          "target_only_autonomy_delegation_grant_row_count_proof_failed",
        ]);
      }

      db.exec("COMMIT");
      return createAcceptedResult({
        result_status: "written",
        grant,
        grant_record_written: true,
        duplicate_replayed: false,
      });
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  } finally {
    if (shouldClose) {
      db.close();
    }
  }
}

export function validateAutonomyDelegationGrantInput(
  input: AutonomyDelegationGrantInput,
): string[] {
  const refusalReasons: string[] = [];
  const approval = input.explicit_user_approval;
  const approvalFields = requiredStringFieldsPresent(
    {
      approval_ref: approval?.approval_ref,
      approval_text_fingerprint: approval?.approval_text_fingerprint,
    },
    ["approval_ref", "approval_text_fingerprint"],
  );
  for (const field of approvalFields.missing_fields) {
    refusalReasons.push(`${field}_missing`);
  }
  if (approval?.raw_approval_text_persisted !== false) {
    refusalReasons.push("raw_approval_text_persisted_must_be_false");
  }

  if (!AUTONOMY_DELEGATION_GRANT_STATUSES.includes(input.grant_status)) {
    refusalReasons.push("grant_status_invalid");
  }
  if (!AUTONOMY_DELEGATION_GRANT_MODES.includes(input.grant_mode)) {
    refusalReasons.push("grant_mode_invalid");
  }
  if (input.scope !== "project:augnes") {
    refusalReasons.push("scope_invalid");
  }

  const sourceContractResult = validateSourceAutonomyContract(
    input.source_autonomy_contract,
  );
  refusalReasons.push(...sourceContractResult);

  if (!Array.isArray(input.allowed_work_classes) || input.allowed_work_classes.length === 0) {
    refusalReasons.push("allowed_work_classes_empty");
  }
  if (!hasRequiredForbiddenActions(input.forbidden_actions ?? [])) {
    refusalReasons.push("hard_forbidden_actions_missing");
  }
  const missingStopConditions = REQUIRED_STOP_CONDITIONS.filter(
    (condition) => !(input.stop_conditions ?? []).includes(condition),
  );
  for (const condition of missingStopConditions) {
    refusalReasons.push(`${condition}_stop_condition_missing`);
  }
  refusalReasons.push(...validateBudget(input.budget));
  refusalReasons.push(...validateAuthorityBoundary(input.authority_boundary));
  refusalReasons.push(
    ...validatePersistedMaterialBoundary(input.persisted_material_boundary),
  );
  refusalReasons.push(...validateRawMaterialBoundary(input));

  return [...new Set(refusalReasons)];
}

function buildGrant({
  input,
  idempotencyKey,
  createdAt,
  rowCountWriteSummary,
}: {
  input: NormalizedAutonomyDelegationGrantInput;
  idempotencyKey: string;
  createdAt: string;
  rowCountWriteSummary: AutonomyDelegationGrantRowCountWriteSummary;
}): AutonomyDelegationGrant {
  const grantId = `autonomy-delegation-grant:${stripFingerprintPrefix(
    idempotencyKey,
  )}`;
  const validation: AutonomyDelegationGrantValidation = {
    passed: true,
    fingerprint_algorithm: FINGERPRINT_ALGORITHM,
    explicit_approval_ref_present: true,
    approval_text_fingerprint_present: true,
    source_contract_binding_present: Boolean(
      input.source_autonomy_contract.contract_fingerprint,
    ),
    allowed_work_classes_non_empty: true,
    required_forbidden_actions_present: true,
    budget_limits_valid: true,
    required_stop_conditions_present: true,
    authority_boundary_all_false: true,
    persisted_material_boundary_safe: true,
    raw_material_absent: true,
    target_only_write_proven: true,
    grant_fingerprint: null,
  };
  const grantWithoutFingerprint: Omit<
    AutonomyDelegationGrant,
    "grant_fingerprint"
  > = {
    grant_kind: AUTONOMY_DELEGATION_GRANT_KIND,
    grant_version: AUTONOMY_DELEGATION_GRANT_VERSION,
    grant_id: grantId,
    scope: input.scope,
    created_at: createdAt,
    grant_status: input.grant_status,
    grant_mode: input.grant_mode,
    idempotency_key: idempotencyKey,
    explicit_user_approval: input.explicit_user_approval,
    source_autonomy_contract: input.source_autonomy_contract,
    allowed_work_classes: input.allowed_work_classes,
    forbidden_work_classes: input.forbidden_work_classes,
    allowed_actions: input.allowed_actions,
    forbidden_actions: input.forbidden_actions,
    budget: input.budget,
    reporting_cadence: input.reporting_cadence,
    stop_conditions: input.stop_conditions,
    allowed_outputs: input.allowed_outputs,
    forbidden_outputs: input.forbidden_outputs,
    revocation: input.revocation,
    authority_boundary: input.authority_boundary,
    persisted_material_boundary: input.persisted_material_boundary,
    validation,
    row_count_write_summary: rowCountWriteSummary,
  };
  const grantFingerprint =
    computeAutonomyDelegationGrantFingerprint(grantWithoutFingerprint);

  return {
    ...grantWithoutFingerprint,
    validation: {
      ...validation,
      grant_fingerprint: grantFingerprint,
    },
    grant_fingerprint: computeAutonomyDelegationGrantFingerprint({
      ...grantWithoutFingerprint,
      validation: {
        ...validation,
        grant_fingerprint: grantFingerprint,
      },
    }),
  };
}

function insertGrant(
  db: AutonomyDelegationGrantDbLike,
  grant: AutonomyDelegationGrant,
) {
  db.prepare(
    `
      INSERT INTO autonomy_delegation_grants (
        grant_id,
        created_at,
        scope,
        grant_status,
        grant_mode,
        approval_ref,
        approved_by,
        approved_at,
        approval_basis,
        approval_text_fingerprint,
        source_contract_id,
        source_contract_fingerprint,
        source_contract_version,
        source_autonomy_mode,
        idempotency_key,
        allowed_work_classes_json,
        forbidden_work_classes_json,
        allowed_actions_json,
        forbidden_actions_json,
        budget_json,
        reporting_cadence_json,
        stop_conditions_json,
        allowed_outputs_json,
        forbidden_outputs_json,
        revocation_json,
        authority_boundary_json,
        persisted_material_boundary_json,
        validation_json,
        row_count_write_summary_json,
        grant_fingerprint
      )
      VALUES (
        @grant_id,
        @created_at,
        @scope,
        @grant_status,
        @grant_mode,
        @approval_ref,
        @approved_by,
        @approved_at,
        @approval_basis,
        @approval_text_fingerprint,
        @source_contract_id,
        @source_contract_fingerprint,
        @source_contract_version,
        @source_autonomy_mode,
        @idempotency_key,
        @allowed_work_classes_json,
        @forbidden_work_classes_json,
        @allowed_actions_json,
        @forbidden_actions_json,
        @budget_json,
        @reporting_cadence_json,
        @stop_conditions_json,
        @allowed_outputs_json,
        @forbidden_outputs_json,
        @revocation_json,
        @authority_boundary_json,
        @persisted_material_boundary_json,
        @validation_json,
        @row_count_write_summary_json,
        @grant_fingerprint
      )
    `,
  ).run({
    grant_id: grant.grant_id,
    created_at: grant.created_at,
    scope: grant.scope,
    grant_status: grant.grant_status,
    grant_mode: grant.grant_mode,
    approval_ref: grant.explicit_user_approval.approval_ref,
    approved_by: grant.explicit_user_approval.approved_by ?? null,
    approved_at: grant.explicit_user_approval.approved_at ?? null,
    approval_basis: grant.explicit_user_approval.approval_basis ?? null,
    approval_text_fingerprint:
      grant.explicit_user_approval.approval_text_fingerprint,
    source_contract_id: grant.source_autonomy_contract.contract_id ?? null,
    source_contract_fingerprint:
      grant.source_autonomy_contract.contract_fingerprint ?? null,
    source_contract_version:
      grant.source_autonomy_contract.contract_version ?? null,
    source_autonomy_mode: grant.source_autonomy_contract.autonomy_mode ?? null,
    idempotency_key: grant.idempotency_key,
    allowed_work_classes_json: stableJson(grant.allowed_work_classes),
    forbidden_work_classes_json: stableJson(grant.forbidden_work_classes),
    allowed_actions_json: stableJson(grant.allowed_actions),
    forbidden_actions_json: stableJson(grant.forbidden_actions),
    budget_json: stableJson(grant.budget),
    reporting_cadence_json: stableJson(grant.reporting_cadence),
    stop_conditions_json: stableJson(grant.stop_conditions),
    allowed_outputs_json: stableJson(grant.allowed_outputs),
    forbidden_outputs_json: stableJson(grant.forbidden_outputs),
    revocation_json: stableJson(grant.revocation),
    authority_boundary_json: stableJson(grant.authority_boundary),
    persisted_material_boundary_json: stableJson(
      grant.persisted_material_boundary,
    ),
    validation_json: stableJson(grant.validation),
    row_count_write_summary_json: stableJson(grant.row_count_write_summary),
    grant_fingerprint: grant.grant_fingerprint,
  });
}

type NormalizedAutonomyDelegationGrantInput = Omit<
  AutonomyDelegationGrant,
  | "grant_kind"
  | "grant_version"
  | "grant_id"
  | "created_at"
  | "idempotency_key"
  | "validation"
  | "row_count_write_summary"
  | "grant_fingerprint"
>;

function normalizeGrantInput(
  input: AutonomyDelegationGrantInput,
): NormalizedAutonomyDelegationGrantInput {
  return {
    scope: "project:augnes",
    grant_status: input.grant_status,
    grant_mode: input.grant_mode,
    explicit_user_approval: {
      approval_ref: input.explicit_user_approval.approval_ref.trim(),
      approved_by: normalizeNullableString(input.explicit_user_approval.approved_by),
      approved_at: normalizeNullableString(input.explicit_user_approval.approved_at),
      approval_basis: normalizeNullableString(
        input.explicit_user_approval.approval_basis,
      ),
      approval_text_fingerprint:
        input.explicit_user_approval.approval_text_fingerprint.trim(),
      raw_approval_text_persisted: false,
    },
    source_autonomy_contract: normalizeSourceAutonomyContract(
      input.source_autonomy_contract,
    ),
    allowed_work_classes: normalizeStringArray(input.allowed_work_classes),
    forbidden_work_classes: normalizeStringArray(input.forbidden_work_classes),
    allowed_actions: normalizeStringArray(input.allowed_actions),
    forbidden_actions: normalizeStringArray(input.forbidden_actions),
    budget: normalizeBudget(input.budget),
    reporting_cadence: normalizeReportingCadence(input.reporting_cadence),
    stop_conditions: normalizeStringArray(input.stop_conditions),
    allowed_outputs: normalizeStringArray(
      input.allowed_outputs?.length
        ? input.allowed_outputs
        : [...AUTONOMY_DELEGATION_GRANT_ALLOWED_OUTPUTS],
    ),
    forbidden_outputs: normalizeStringArray(
      input.forbidden_outputs?.length
        ? input.forbidden_outputs
        : [...AUTONOMY_DELEGATION_GRANT_FORBIDDEN_OUTPUTS],
    ),
    revocation: normalizeRevocation(input.revocation),
    authority_boundary: buildAutonomyDelegationGrantAuthorityBoundary(),
    persisted_material_boundary: createPersistedMaterialBoundary(),
  };
}

function normalizeSourceAutonomyContract(
  source: AutonomyDelegationGrantSourceAutonomyContract,
): AutonomyDelegationGrantSourceAutonomyContract {
  return {
    contract_id: normalizeNullableString(source?.contract_id),
    contract_fingerprint: normalizeNullableString(source?.contract_fingerprint),
    contract_version: normalizeNullableString(source?.contract_version),
    autonomy_mode: normalizeNullableString(source?.autonomy_mode),
    source_refs: [],
  };
}

function normalizeBudget(
  budget: AutonomyDelegationGrantBudget,
): AutonomyDelegationGrantBudget {
  return {
    time_limit_minutes: normalizeInteger(budget.time_limit_minutes),
    max_iterations: normalizeInteger(budget.max_iterations),
    max_tool_calls: normalizeInteger(budget.max_tool_calls),
    max_codex_tasks: normalizeInteger(budget.max_codex_tasks),
    max_draft_prs: normalizeInteger(budget.max_draft_prs),
    max_file_changes: normalizeInteger(budget.max_file_changes),
    max_changed_files_per_pr: normalizeInteger(budget.max_changed_files_per_pr),
    allowed_file_globs: normalizeStringArray(budget.allowed_file_globs),
    forbidden_file_globs: normalizeStringArray(budget.forbidden_file_globs),
    retry_limit: normalizeInteger(budget.retry_limit),
    failure_threshold: normalizeInteger(budget.failure_threshold),
    requires_budget_refresh_after: normalizeStringArray(
      budget.requires_budget_refresh_after,
    ),
  };
}

function normalizeReportingCadence(
  reportingCadence: AutonomyDelegationGrantReportingCadence,
): AutonomyDelegationGrantReportingCadence {
  return {
    mode: reportingCadence.mode.trim(),
    interval_description: reportingCadence.interval_description.trim(),
    minimum_report_fields: normalizeStringArray(
      reportingCadence.minimum_report_fields,
    ),
    report_target_surface: reportingCadence.report_target_surface.trim(),
  };
}

function normalizeRevocation(
  revocation: AutonomyDelegationGrantRevocation,
): AutonomyDelegationGrantRevocation {
  return {
    revoked_by: normalizeNullableString(revocation?.revoked_by),
    revoked_at: normalizeNullableString(revocation?.revoked_at),
    revocation_reason: normalizeNullableString(revocation?.revocation_reason),
    supersedes_grant_id: normalizeNullableString(revocation?.supersedes_grant_id),
    superseded_by_grant_id: normalizeNullableString(
      revocation?.superseded_by_grant_id,
    ),
  };
}

function createPersistedMaterialBoundary(): AutonomyDelegationGrantPersistedMaterialBoundary {
  return {
    persists_source_fingerprints: true,
    persists_budget: true,
    persists_policy: true,
    persists_raw_user_approval_text: false,
    persists_raw_prompt: false,
    persists_raw_operator_note: false,
    persists_secret_or_token: false,
    persists_url_or_env_value: false,
  };
}

function validateSourceAutonomyContract(
  source: AutonomyDelegationGrantSourceAutonomyContract,
) {
  const values = {
    contract_id: source?.contract_id,
    contract_fingerprint: source?.contract_fingerprint,
    contract_version: source?.contract_version,
  };
  const hasAnySourceContractField = Object.values(values).some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
  if (!hasAnySourceContractField) return [];

  const required = requiredStringFieldsPresent(values, [
    "contract_id",
    "contract_fingerprint",
    "contract_version",
  ]);
  const binding = validateSourceBindingPairs([
    {
      field: "source_contract_id",
      expected: source.contract_id,
      actual: source.contract_id,
      reason: "source_contract_id_missing",
    },
    {
      field: "source_contract_fingerprint",
      expected: source.contract_fingerprint,
      actual: source.contract_fingerprint,
      reason: "source_contract_fingerprint_missing",
    },
    {
      field: "source_contract_version",
      expected: source.contract_version,
      actual: source.contract_version,
      reason: "source_contract_version_missing",
    },
  ]);
  return required.passed && binding.passed
    ? []
    : ["source_autonomy_contract_binding_incomplete"];
}

function validateBudget(budget: AutonomyDelegationGrantBudget) {
  const refusalReasons: string[] = [];
  if (!validNumber(budget?.max_iterations, { min: 1 })) {
    refusalReasons.push("budget_max_iterations_invalid");
  }
  if (!validNumber(budget?.max_codex_tasks, { min: 0 })) {
    refusalReasons.push("budget_max_codex_tasks_invalid");
  }
  if (!validNumber(budget?.max_draft_prs, { min: 0 })) {
    refusalReasons.push("budget_max_draft_prs_invalid");
  }
  if (!validNumber(budget?.max_file_changes, { min: 0 })) {
    refusalReasons.push("budget_max_file_changes_invalid");
  }
  if (!validNumber(budget?.failure_threshold, { min: 1 })) {
    refusalReasons.push("budget_failure_threshold_invalid");
  }
  if (!validNumber(budget?.retry_limit, { min: 0 })) {
    refusalReasons.push("budget_retry_limit_invalid");
  }
  return refusalReasons;
}

function validateAuthorityBoundary(
  boundary: AutonomyDelegationGrantInput["authority_boundary"],
) {
  const result = assertAllFalseBoundary(
    boundary ?? {},
    "autonomy_delegation_grant_authority_boundary",
  );
  return result.passed ? [] : ["authority_boundary_not_all_false"];
}

function validatePersistedMaterialBoundary(
  boundary: AutonomyDelegationGrantInput["persisted_material_boundary"],
) {
  const expected = createPersistedMaterialBoundary();
  const mismatched = Object.entries(expected).filter(
    ([key, value]) =>
      boundary?.[key as keyof AutonomyDelegationGrantPersistedMaterialBoundary] !==
      value,
  );
  return mismatched.length === 0
    ? []
    : ["persisted_material_boundary_not_safe"];
}

function validateRawMaterialBoundary(input: AutonomyDelegationGrantInput) {
  const scrubbed = stripAllowedBoundaryFlagKeys(input);
  const forbiddenFields = findForbiddenRawMaterialFields(scrubbed);
  const refusalReasons: string[] = [];
  if (forbiddenFields.length > 0 || containsForbiddenRawMaterial(scrubbed)) {
    refusalReasons.push("raw_material_fields_present");
  }
  if (findUnsafeStringMaterial(input).length > 0) {
    refusalReasons.push("unsafe_string_material_present");
  }
  return refusalReasons;
}

function hasRequiredForbiddenActions(actions: string[]) {
  return AUTONOMY_DELEGATION_GRANT_REQUIRED_FORBIDDEN_ACTIONS.every((action) =>
    actions.includes(action),
  );
}

function computeIdempotencyKey(input: NormalizedAutonomyDelegationGrantInput) {
  return buildDeterministicIdempotencyKey({
    kind: AUTONOMY_DELEGATION_GRANT_KIND,
    version: AUTONOMY_DELEGATION_GRANT_VERSION,
    source: {
      approval_ref: input.explicit_user_approval.approval_ref,
      source_contract_fingerprint:
        input.source_autonomy_contract.contract_fingerprint,
      grant_mode: input.grant_mode,
      budget: input.budget,
      allowed_work_classes: input.allowed_work_classes,
      forbidden_actions: input.forbidden_actions,
      stop_conditions: input.stop_conditions,
    },
  });
}

function captureRowCounts(db: AutonomyDelegationGrantDbLike): RowCountSnapshot {
  return Object.fromEntries(
    TARGET_AND_NON_TARGET_TABLES.map((tableName) => [
      tableName,
      countRowsIfTableExists(db, tableName),
    ]),
  );
}

function countRowsIfTableExists(
  db: AutonomyDelegationGrantDbLike,
  tableName: string,
) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
    throw new Error(`Unsafe table name: ${tableName}`);
  }
  const table = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName) as { name?: string } | undefined;
  if (!table?.name) return 0;
  const row = db
    .prepare(`SELECT COUNT(*) as count FROM ${tableName}`)
    .get() as { count: number };
  return Number(row.count);
}

function buildRowCountWriteSummary({
  beforeCounts,
  afterCounts,
}: {
  beforeCounts: RowCountSnapshot;
  afterCounts: RowCountSnapshot;
}): AutonomyDelegationGrantRowCountWriteSummary {
  const writeSummary = summarizeTargetOnlyRowCountWrite({
    targetTable: AUTONOMY_DELEGATION_GRANT_TABLE,
    tableNames: TARGET_AND_NON_TARGET_TABLES,
    beforeCounts,
    afterCounts,
  });
  return {
    target_table_name: AUTONOMY_DELEGATION_GRANT_TABLE,
    target_before_count: writeSummary.target_before_count,
    target_after_count: writeSummary.target_after_count,
    target_delta: writeSummary.target_delta,
    target_table_changed: writeSummary.target_table_changed,
    expected_target_delta: writeSummary.expected_target_delta,
    target_delta_matches_expected: writeSummary.target_delta_matches_expected,
    non_target_table_count: writeSummary.non_target_table_count,
    non_target_changed_table_count:
      writeSummary.non_target_changed_table_count,
    all_non_target_row_counts_unchanged:
      writeSummary.all_non_target_row_counts_unchanged,
    rows: writeSummary.rows,
  };
}

function isTargetOnlyWrite(summary: AutonomyDelegationGrantRowCountWriteSummary) {
  return (
    summary.target_table_name === AUTONOMY_DELEGATION_GRANT_TABLE &&
    isTargetOnlyRowCountWrite(summary)
  );
}

function createAcceptedResult({
  result_status,
  grant,
  grant_record_written,
  duplicate_replayed,
}: {
  result_status: "written" | "duplicate_replayed";
  grant: AutonomyDelegationGrant;
  grant_record_written: boolean;
  duplicate_replayed: boolean;
}): AutonomyDelegationGrantWriteResult {
  return {
    ok: true,
    result_status,
    refusal_reasons: [],
    grant,
    duplicate_replayed,
    grant_record_written,
    row_count_write_summary: grant.row_count_write_summary,
    ...createNoRunAuthorityFlags(),
    raw_material_persisted: false,
  };
}

function createRefusedResult(
  refusalReasons: string[],
): AutonomyDelegationGrantWriteResult {
  return {
    ok: false,
    result_status: "refused",
    refusal_reasons: [...new Set(refusalReasons)],
    grant: null,
    duplicate_replayed: false,
    grant_record_written: false,
    row_count_write_summary: null,
    ...createNoRunAuthorityFlags(),
    raw_material_persisted: false,
  };
}

function createNoRunAuthorityFlags() {
  return {
    can_start_runner: false,
    can_schedule_runner: false,
    can_start_daemon: false,
    can_start_background_work: false,
    can_execute_codex: false,
    can_call_github: false,
    can_create_branch_or_pr: false,
    can_merge: false,
    can_deploy: false,
    can_publish_external: false,
    can_call_provider_or_openai: false,
    can_fetch_sources: false,
    can_run_retrieval: false,
    can_write_db_outside_grant_record: false,
    can_write_memory: false,
    can_promote_perspective: false,
    can_mutate_cwp: false,
    can_mutate_work: false,
    can_write_proof_or_evidence: false,
    can_auto_apply_delta: false,
  } as const;
}

function stripAllowedBoundaryFlagKeys(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(stripAllowedBoundaryFlagKeys);
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([key]) => !SAFE_RAW_MATERIAL_BOUNDARY_KEYS.has(key))
      .map(([key, nestedValue]) => [key, stripAllowedBoundaryFlagKeys(nestedValue)]),
  );
}

function findUnsafeStringMaterial(value: unknown, path: string[] = []): string[] {
  if (typeof value === "string") {
    return isUnsafeStringMaterial(value) ? [path.join(".")] : [];
  }
  if (value === null || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      findUnsafeStringMaterial(item, [...path, String(index)]),
    );
  }
  return Object.entries(value as Record<string, unknown>).flatMap(
    ([key, nestedValue]) => findUnsafeStringMaterial(nestedValue, [...path, key]),
  );
}

function isUnsafeStringMaterial(value: string) {
  return (
    /https?:\/\//i.test(value) ||
    /\b[A-Z][A-Z0-9_]{2,}\s*=\s*\S+/.test(value) ||
    /\b(sk-[A-Za-z0-9_-]{8,}|gh[pousr]_[A-Za-z0-9_]{8,}|AKIA[0-9A-Z]{16})\b/.test(
      value,
    ) ||
    /BEGIN [A-Z ]*PRIVATE KEY/.test(value) ||
    /\b(api[_-]?key|token|secret|password)\s*[:=]\s*\S+/i.test(value)
  );
}

function normalizeStringArray(values: string[] | readonly string[] | undefined) {
  return [
    ...new Set((values ?? []).map((value) => value.trim()).filter(Boolean)),
  ].sort();
}

function normalizeNullableString(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function normalizeInteger(value: number) {
  return Number.isFinite(value) ? Math.trunc(value) : 0;
}

function validNumber(value: unknown, { min }: { min: number }) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= min
  );
}

function hasClose(
  db: AutonomyDelegationGrantDbLike,
): db is AutonomyDelegationGrantDbLike & { close(): void } {
  return typeof (db as { close?: unknown }).close === "function";
}
