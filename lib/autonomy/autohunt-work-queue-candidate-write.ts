import { openDatabase } from "@/lib/db";
import {
  buildAutohuntWorkQueueCandidateAuthorityBoundary,
  computeAutohuntWorkQueueCandidateFingerprint,
  ensureAutohuntWorkQueueCandidateSchema,
  parseAutohuntWorkQueueCandidateRow,
} from "@/lib/autonomy/read-autohunt-work-queue-candidates";
import {
  computeAutonomyDelegationGrantFingerprint,
  type AutonomyDelegationGrantDbLike,
} from "@/lib/autonomy/read-autonomy-delegation-grants";
import {
  assertAllFalseBoundary,
  buildDeterministicIdempotencyKey,
  containsForbiddenRawMaterial,
  findForbiddenRawMaterialFields,
  fingerprint,
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
  AutonomyDelegationGrantReadback,
} from "@/types/autonomy-delegation-grant";
import { AUTONOMY_DELEGATION_GRANT_TABLE } from "@/types/autonomy-delegation-grant";
import type {
  AutohuntWorkQueueCandidate,
  AutohuntWorkQueueCandidateBudgetProjection,
  AutohuntWorkQueueCandidateGrantFit,
  AutohuntWorkQueueCandidateInput,
  AutohuntWorkQueueCandidatePersistedMaterialBoundary,
  AutohuntWorkQueueCandidateRowCountWriteSummary,
  AutohuntWorkQueueCandidateSourceGrant,
  AutohuntWorkQueueCandidateValidation,
  AutohuntWorkQueueCandidateWriteResult,
} from "@/types/autohunt-work-queue-candidate";
import {
  AUTOHUNT_WORK_QUEUE_CANDIDATE_KIND,
  AUTOHUNT_WORK_QUEUE_CANDIDATE_ORIGINS,
  AUTOHUNT_WORK_QUEUE_CANDIDATE_REQUIRED_STOP_CONDITIONS,
  AUTOHUNT_WORK_QUEUE_CANDIDATE_STATUSES,
  AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE,
  AUTOHUNT_WORK_QUEUE_CANDIDATE_VERSION,
} from "@/types/autohunt-work-queue-candidate";

export interface WriteAutohuntWorkQueueCandidateOptions {
  db?: AutonomyDelegationGrantDbLike;
  now?: string;
}

type RowCountSnapshot = Record<string, number>;

const NON_TARGET_ROW_COUNT_TABLES = [
  AUTONOMY_DELEGATION_GRANT_TABLE,
  ...RESEARCH_CANDIDATE_MANUAL_GLOBAL_DOGFOOD_PERSPECTIVE_EXISTING_WRITER_DRY_RUN_PROTECTED_ROW_COUNT_TABLES,
] as const;

const TARGET_AND_NON_TARGET_TABLES = [
  AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE,
  ...NON_TARGET_ROW_COUNT_TABLES,
] as const;

const SAFE_RAW_MATERIAL_BOUNDARY_KEYS = new Set([
  "persists_raw_prompt",
  "persists_raw_operator_note",
  "persists_raw_source_payload",
  "persists_secret_or_token",
  "persists_url_or_env_value",
]);

export function writeAutohuntWorkQueueCandidate(
  input: AutohuntWorkQueueCandidateInput,
  options: WriteAutohuntWorkQueueCandidateOptions = {},
): AutohuntWorkQueueCandidateWriteResult {
  const sourceGrant = extractSourceGrant(input.source_grant);
  const validationRefusalReasons = validateAutohuntWorkQueueCandidateInput(
    input,
    sourceGrant,
  );
  if (validationRefusalReasons.length > 0 || !sourceGrant) {
    return createRefusedResult(validationRefusalReasons);
  }

  const normalizedInput = normalizeCandidateInput(input, sourceGrant);
  const grantFit = buildGrantFit(normalizedInput, sourceGrant);
  if (!grantFit.passed) {
    return createRefusedResult(grantFit.blocker_reasons);
  }

  const idempotencyKey = computeIdempotencyKey(normalizedInput);
  const db = options.db ?? openDatabase();
  const shouldClose = !options.db && hasClose(db);

  try {
    ensureAutohuntWorkQueueCandidateSchema(db);
    const existingRow = db
      .prepare(
        `
          SELECT *
          FROM ${AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE}
          WHERE idempotency_key = ?
        `,
      )
      .get(idempotencyKey);

    if (existingRow) {
      const existingCandidate = parseAutohuntWorkQueueCandidateRow(
        existingRow as never,
      );
      if (
        existingCandidate &&
        existingCandidate.candidate_fingerprint ===
          computeAutohuntWorkQueueCandidateFingerprint(existingCandidate)
      ) {
        return createAcceptedResult({
          result_status: "duplicate_replayed",
          candidate: existingCandidate,
          queue_candidate_record_written: false,
          duplicate_replayed: true,
        });
      }
      return createRefusedResult([
        "idempotency_conflict_existing_candidate_fingerprint_mismatch",
      ]);
    }

    db.exec("BEGIN IMMEDIATE");
    try {
      const beforeCounts = captureRowCounts(db);
      const expectedWriteSummary = buildRowCountWriteSummary({
        beforeCounts,
        afterCounts: {
          ...beforeCounts,
          [AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE]:
            beforeCounts[AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE] + 1,
        },
      });
      const candidate = buildCandidate({
        input: normalizedInput,
        grantFit,
        idempotencyKey,
        createdAt: options.now ?? new Date().toISOString(),
        rowCountWriteSummary: expectedWriteSummary,
      });

      insertCandidate(db, candidate);

      const afterCounts = captureRowCounts(db);
      const actualWriteSummary = buildRowCountWriteSummary({
        beforeCounts,
        afterCounts,
      });
      if (!isTargetOnlyWrite(actualWriteSummary)) {
        db.exec("ROLLBACK");
        return createRefusedResult([
          "target_only_autohunt_work_queue_candidate_row_count_proof_failed",
        ]);
      }

      db.exec("COMMIT");
      return createAcceptedResult({
        result_status: "written",
        candidate,
        queue_candidate_record_written: true,
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

export function validateAutohuntWorkQueueCandidateInput(
  input: AutohuntWorkQueueCandidateInput,
  sourceGrant: AutonomyDelegationGrant | null = extractSourceGrant(
    input.source_grant,
  ),
): string[] {
  const refusalReasons: string[] = [];
  if (!sourceGrant) {
    refusalReasons.push("source_grant_missing_or_not_full_record");
  }

  const requiredStrings = requiredStringFieldsPresent(
    {
      title: input.title,
      summary: input.summary,
      work_class: input.work_class,
    },
    ["title", "summary", "work_class"],
  );
  for (const field of requiredStrings.missing_fields) {
    refusalReasons.push(`${field}_missing`);
  }

  if (input.scope !== "project:augnes") {
    refusalReasons.push("scope_invalid");
  }
  if (!AUTOHUNT_WORK_QUEUE_CANDIDATE_ORIGINS.includes(input.candidate_origin)) {
    refusalReasons.push("candidate_origin_invalid");
  }
  if (
    input.candidate_status &&
    !AUTOHUNT_WORK_QUEUE_CANDIDATE_STATUSES.includes(input.candidate_status)
  ) {
    refusalReasons.push("candidate_status_invalid");
  }
  if (!Array.isArray(input.source_fingerprints) || input.source_fingerprints.length === 0) {
    refusalReasons.push("source_fingerprints_empty");
  }
  if (!Array.isArray(input.source_refs) || input.source_refs.length === 0) {
    refusalReasons.push("source_refs_empty");
  }
  if (
    !Array.isArray(input.proposed_files_or_globs) ||
    input.proposed_files_or_globs.length === 0
  ) {
    refusalReasons.push("proposed_files_or_globs_empty");
  }
  refusalReasons.push(...validateBudgetProjection(input.budget_projection));

  const missingStopConditions =
    AUTOHUNT_WORK_QUEUE_CANDIDATE_REQUIRED_STOP_CONDITIONS.filter(
      (condition) => !(input.stop_conditions ?? []).includes(condition),
    );
  for (const condition of missingStopConditions) {
    refusalReasons.push(`${condition}_stop_condition_missing`);
  }

  if (sourceGrant) {
    refusalReasons.push(...validateSourceGrant(sourceGrant));
  }
  refusalReasons.push(...validateRawMaterialBoundary(input));

  return [...new Set(refusalReasons)];
}

function buildCandidate({
  input,
  grantFit,
  idempotencyKey,
  createdAt,
  rowCountWriteSummary,
}: {
  input: NormalizedAutohuntWorkQueueCandidateInput;
  grantFit: AutohuntWorkQueueCandidateGrantFit;
  idempotencyKey: string;
  createdAt: string;
  rowCountWriteSummary: AutohuntWorkQueueCandidateRowCountWriteSummary;
}): AutohuntWorkQueueCandidate {
  const candidateId = `autohunt-work-queue-candidate:${stripFingerprintPrefix(
    idempotencyKey,
  )}`;
  const authorityBoundaryAllFalse = assertAllFalseBoundary(
    input.authority_boundary,
    "autohunt_work_queue_candidate_authority_boundary",
  ).passed;
  const validation: AutohuntWorkQueueCandidateValidation = {
    passed: true,
    fingerprint_algorithm: FINGERPRINT_ALGORITHM,
    active_grant_verified: true,
    grant_fingerprint_verified: true,
    grant_validation_passed: true,
    work_class_allowed: grantFit.work_class_allowed,
    file_scope_allowed: grantFit.file_scope_allowed,
    forbidden_actions_absent: grantFit.forbidden_actions_absent,
    budget_within_grant: grantFit.budget_within_grant,
    required_stop_conditions_present: grantFit.stop_conditions_present,
    authority_boundary_all_false: authorityBoundaryAllFalse,
    persisted_material_boundary_safe: true,
    raw_material_absent: true,
    target_only_write_proven: true,
    candidate_fingerprint: null,
  };
  const candidateWithoutFingerprint: Omit<
    AutohuntWorkQueueCandidate,
    "candidate_fingerprint"
  > = {
    queue_candidate_kind: AUTOHUNT_WORK_QUEUE_CANDIDATE_KIND,
    queue_candidate_version: AUTOHUNT_WORK_QUEUE_CANDIDATE_VERSION,
    candidate_id: candidateId,
    scope: input.scope,
    created_at: createdAt,
    candidate_status: input.candidate_status,
    candidate_origin: input.candidate_origin,
    source_grant: input.source_grant,
    work_class: input.work_class,
    title: input.title,
    summary: input.summary,
    title_summary_fingerprint: input.title_summary_fingerprint,
    idempotency_key: idempotencyKey,
    source_refs: input.source_refs,
    source_fingerprints: input.source_fingerprints,
    evidence_refs: input.evidence_refs,
    required_context_refs: input.required_context_refs,
    proposed_files_or_globs: input.proposed_files_or_globs,
    expected_outputs: input.expected_outputs,
    required_checks: input.required_checks,
    blocked_actions: input.blocked_actions,
    stop_conditions: input.stop_conditions,
    budget_projection: input.budget_projection,
    grant_fit: grantFit,
    authority_boundary: input.authority_boundary,
    persisted_material_boundary: input.persisted_material_boundary,
    validation,
    row_count_write_summary: rowCountWriteSummary,
  };
  const candidateFingerprint =
    computeAutohuntWorkQueueCandidateFingerprint(candidateWithoutFingerprint);

  return {
    ...candidateWithoutFingerprint,
    validation: {
      ...validation,
      candidate_fingerprint: candidateFingerprint,
    },
    candidate_fingerprint: computeAutohuntWorkQueueCandidateFingerprint({
      ...candidateWithoutFingerprint,
      validation: {
        ...validation,
        candidate_fingerprint: candidateFingerprint,
      },
    }),
  };
}

function insertCandidate(
  db: AutonomyDelegationGrantDbLike,
  candidate: AutohuntWorkQueueCandidate,
) {
  db.prepare(
    `
      INSERT INTO autohunt_work_queue_candidates (
        candidate_id,
        created_at,
        scope,
        candidate_status,
        candidate_origin,
        source_grant_id,
        source_grant_fingerprint,
        source_grant_status,
        source_grant_mode,
        work_class,
        title,
        summary,
        title_summary_fingerprint,
        idempotency_key,
        source_refs_json,
        source_fingerprints_json,
        evidence_refs_json,
        required_context_refs_json,
        proposed_files_or_globs_json,
        expected_outputs_json,
        required_checks_json,
        blocked_actions_json,
        stop_conditions_json,
        budget_projection_json,
        grant_fit_json,
        authority_boundary_json,
        persisted_material_boundary_json,
        validation_json,
        row_count_write_summary_json,
        candidate_fingerprint
      )
      VALUES (
        @candidate_id,
        @created_at,
        @scope,
        @candidate_status,
        @candidate_origin,
        @source_grant_id,
        @source_grant_fingerprint,
        @source_grant_status,
        @source_grant_mode,
        @work_class,
        @title,
        @summary,
        @title_summary_fingerprint,
        @idempotency_key,
        @source_refs_json,
        @source_fingerprints_json,
        @evidence_refs_json,
        @required_context_refs_json,
        @proposed_files_or_globs_json,
        @expected_outputs_json,
        @required_checks_json,
        @blocked_actions_json,
        @stop_conditions_json,
        @budget_projection_json,
        @grant_fit_json,
        @authority_boundary_json,
        @persisted_material_boundary_json,
        @validation_json,
        @row_count_write_summary_json,
        @candidate_fingerprint
      )
    `,
  ).run({
    candidate_id: candidate.candidate_id,
    created_at: candidate.created_at,
    scope: candidate.scope,
    candidate_status: candidate.candidate_status,
    candidate_origin: candidate.candidate_origin,
    source_grant_id: candidate.source_grant.grant_id,
    source_grant_fingerprint: candidate.source_grant.grant_fingerprint,
    source_grant_status: candidate.source_grant.grant_status,
    source_grant_mode: candidate.source_grant.grant_mode,
    work_class: candidate.work_class,
    title: candidate.title,
    summary: candidate.summary,
    title_summary_fingerprint: candidate.title_summary_fingerprint,
    idempotency_key: candidate.idempotency_key,
    source_refs_json: stableJson(candidate.source_refs),
    source_fingerprints_json: stableJson(candidate.source_fingerprints),
    evidence_refs_json: stableJson(candidate.evidence_refs),
    required_context_refs_json: stableJson(candidate.required_context_refs),
    proposed_files_or_globs_json: stableJson(candidate.proposed_files_or_globs),
    expected_outputs_json: stableJson(candidate.expected_outputs),
    required_checks_json: stableJson(candidate.required_checks),
    blocked_actions_json: stableJson(candidate.blocked_actions),
    stop_conditions_json: stableJson(candidate.stop_conditions),
    budget_projection_json: stableJson(candidate.budget_projection),
    grant_fit_json: stableJson(candidate.grant_fit),
    authority_boundary_json: stableJson(candidate.authority_boundary),
    persisted_material_boundary_json: stableJson(
      candidate.persisted_material_boundary,
    ),
    validation_json: stableJson(candidate.validation),
    row_count_write_summary_json: stableJson(candidate.row_count_write_summary),
    candidate_fingerprint: candidate.candidate_fingerprint,
  });
}

type NormalizedAutohuntWorkQueueCandidateInput = Omit<
  AutohuntWorkQueueCandidate,
  | "queue_candidate_kind"
  | "queue_candidate_version"
  | "candidate_id"
  | "created_at"
  | "idempotency_key"
  | "grant_fit"
  | "validation"
  | "row_count_write_summary"
  | "candidate_fingerprint"
> & {
  proposed_actions: string[];
};

function normalizeCandidateInput(
  input: AutohuntWorkQueueCandidateInput,
  sourceGrant: AutonomyDelegationGrant,
): NormalizedAutohuntWorkQueueCandidateInput {
  return {
    scope: "project:augnes",
    candidate_status: input.candidate_status ?? "queued",
    candidate_origin: input.candidate_origin,
    source_grant: normalizeSourceGrant(sourceGrant),
    work_class: input.work_class.trim(),
    title: input.title.trim(),
    summary: input.summary.trim(),
    title_summary_fingerprint: fingerprint({
      title: input.title.trim(),
      summary: input.summary.trim(),
    }),
    source_refs: normalizeStringArray(input.source_refs),
    source_fingerprints: normalizeStringArray(input.source_fingerprints),
    evidence_refs: normalizeStringArray(input.evidence_refs),
    required_context_refs: normalizeStringArray(input.required_context_refs),
    proposed_files_or_globs: normalizeStringArray(input.proposed_files_or_globs),
    expected_outputs: normalizeStringArray(input.expected_outputs),
    required_checks: normalizeStringArray(input.required_checks),
    blocked_actions: normalizeStringArray(input.blocked_actions),
    stop_conditions: normalizeStringArray(input.stop_conditions),
    budget_projection: normalizeBudgetProjection(input.budget_projection),
    authority_boundary: buildAutohuntWorkQueueCandidateAuthorityBoundary(),
    persisted_material_boundary: createPersistedMaterialBoundary(),
    proposed_actions: normalizeStringArray(input.proposed_actions),
  };
}

function normalizeSourceGrant(
  sourceGrant: AutonomyDelegationGrant,
): AutohuntWorkQueueCandidateSourceGrant {
  return {
    grant_id: sourceGrant.grant_id,
    grant_fingerprint: sourceGrant.grant_fingerprint,
    grant_status: sourceGrant.grant_status,
    grant_mode: sourceGrant.grant_mode,
  };
}

function normalizeBudgetProjection(
  budgetProjection: AutohuntWorkQueueCandidateBudgetProjection,
): AutohuntWorkQueueCandidateBudgetProjection {
  return {
    estimated_iterations: normalizeInteger(budgetProjection?.estimated_iterations),
    estimated_tool_calls: normalizeInteger(budgetProjection?.estimated_tool_calls),
    estimated_codex_tasks: normalizeInteger(budgetProjection?.estimated_codex_tasks),
    estimated_file_changes: normalizeInteger(budgetProjection?.estimated_file_changes),
    estimated_draft_prs: normalizeInteger(budgetProjection?.estimated_draft_prs),
  };
}

function createPersistedMaterialBoundary(): AutohuntWorkQueueCandidatePersistedMaterialBoundary {
  return {
    persists_source_fingerprints: true,
    persists_queue_policy: true,
    persists_raw_prompt: false,
    persists_raw_operator_note: false,
    persists_raw_source_payload: false,
    persists_secret_or_token: false,
    persists_url_or_env_value: false,
  };
}

function validateSourceGrant(sourceGrant: AutonomyDelegationGrant) {
  const refusalReasons: string[] = [];
  if (sourceGrant.grant_status !== "active") {
    refusalReasons.push("source_grant_not_active");
  }
  if (!sourceGrant.grant_fingerprint) {
    refusalReasons.push("source_grant_fingerprint_missing");
  } else if (
    sourceGrant.grant_fingerprint !==
    computeAutonomyDelegationGrantFingerprint(sourceGrant)
  ) {
    refusalReasons.push("source_grant_fingerprint_mismatch");
  }
  if (sourceGrant.validation?.passed !== true) {
    refusalReasons.push("source_grant_validation_not_passed");
  }
  const required = requiredStringFieldsPresent(
    {
      source_grant_id: sourceGrant.grant_id,
      source_grant_fingerprint: sourceGrant.grant_fingerprint,
      source_grant_status: sourceGrant.grant_status,
      source_grant_mode: sourceGrant.grant_mode,
    },
    [
      "source_grant_id",
      "source_grant_fingerprint",
      "source_grant_status",
      "source_grant_mode",
    ],
  );
  for (const field of required.missing_fields) {
    refusalReasons.push(`${field}_missing`);
  }
  const sourceBinding = validateSourceBindingPairs([
    {
      field: "source_grant_id",
      expected: sourceGrant.grant_id,
      actual: sourceGrant.grant_id,
      reason: "source_grant_id_missing",
    },
    {
      field: "source_grant_fingerprint",
      expected: sourceGrant.grant_fingerprint,
      actual: sourceGrant.grant_fingerprint,
      reason: "source_grant_fingerprint_missing",
    },
  ]);
  if (!sourceBinding.passed) {
    refusalReasons.push("source_grant_binding_incomplete");
  }
  return refusalReasons;
}

function buildGrantFit(
  input: NormalizedAutohuntWorkQueueCandidateInput,
  sourceGrant: AutonomyDelegationGrant,
): AutohuntWorkQueueCandidateGrantFit {
  const workClassAllowed = sourceGrant.allowed_work_classes.includes(
    input.work_class,
  );
  const fileScopeAllowed =
    allProposedFilesAllowed({
      proposed: input.proposed_files_or_globs,
      allowed: sourceGrant.budget.allowed_file_globs,
    }) &&
    noProposedFilesForbidden({
      proposed: input.proposed_files_or_globs,
      forbidden: sourceGrant.budget.forbidden_file_globs,
    });
  const forbiddenActionsAbsent = input.proposed_actions.every(
    (action) => !sourceGrant.forbidden_actions.includes(action),
  );
  const budgetWithinGrant = isBudgetProjectionWithinGrant(
    input.budget_projection,
    sourceGrant,
  );
  const stopConditionsPresent =
    AUTOHUNT_WORK_QUEUE_CANDIDATE_REQUIRED_STOP_CONDITIONS.every((condition) =>
      input.stop_conditions.includes(condition),
    );
  const sourceFreshnessOk = input.source_fingerprints.length > 0;

  const blockerReasons = [
    !workClassAllowed ? "work_class_not_allowed_by_grant" : null,
    !fileScopeAllowed ? "file_scope_not_allowed_by_grant" : null,
    !forbiddenActionsAbsent ? "forbidden_action_requested" : null,
    !budgetWithinGrant ? "budget_projection_exceeds_grant" : null,
    !stopConditionsPresent ? "required_stop_conditions_missing" : null,
    !sourceFreshnessOk ? "source_fingerprints_empty" : null,
  ].filter((reason): reason is string => Boolean(reason));
  const warningReasons = input.required_checks.length === 0
    ? ["required_checks_empty"]
    : [];

  return {
    work_class_allowed: workClassAllowed,
    file_scope_allowed: fileScopeAllowed,
    forbidden_actions_absent: forbiddenActionsAbsent,
    budget_within_grant: budgetWithinGrant,
    stop_conditions_present: stopConditionsPresent,
    source_freshness_ok: sourceFreshnessOk,
    passed: blockerReasons.length === 0,
    blocker_reasons: blockerReasons,
    warning_reasons: warningReasons,
  };
}

function validateBudgetProjection(
  budgetProjection: AutohuntWorkQueueCandidateBudgetProjection,
) {
  const refusalReasons: string[] = [];
  if (!validNumber(budgetProjection?.estimated_iterations, { min: 0 })) {
    refusalReasons.push("budget_projection_estimated_iterations_invalid");
  }
  if (!validNumber(budgetProjection?.estimated_tool_calls, { min: 0 })) {
    refusalReasons.push("budget_projection_estimated_tool_calls_invalid");
  }
  if (!validNumber(budgetProjection?.estimated_codex_tasks, { min: 0 })) {
    refusalReasons.push("budget_projection_estimated_codex_tasks_invalid");
  }
  if (!validNumber(budgetProjection?.estimated_file_changes, { min: 0 })) {
    refusalReasons.push("budget_projection_estimated_file_changes_invalid");
  }
  if (!validNumber(budgetProjection?.estimated_draft_prs, { min: 0 })) {
    refusalReasons.push("budget_projection_estimated_draft_prs_invalid");
  }
  return refusalReasons;
}

function isBudgetProjectionWithinGrant(
  budgetProjection: AutohuntWorkQueueCandidateBudgetProjection,
  sourceGrant: AutonomyDelegationGrant,
) {
  return (
    budgetProjection.estimated_iterations <= sourceGrant.budget.max_iterations &&
    budgetProjection.estimated_tool_calls <= sourceGrant.budget.max_tool_calls &&
    budgetProjection.estimated_codex_tasks <= sourceGrant.budget.max_codex_tasks &&
    budgetProjection.estimated_file_changes <= sourceGrant.budget.max_file_changes &&
    budgetProjection.estimated_draft_prs <= sourceGrant.budget.max_draft_prs
  );
}

function allProposedFilesAllowed({
  proposed,
  allowed,
}: {
  proposed: string[];
  allowed: string[];
}) {
  if (proposed.length === 0 || allowed.length === 0) return false;
  return proposed.every((item) =>
    allowed.some((allowedGlob) => globMatches(allowedGlob, item)),
  );
}

function noProposedFilesForbidden({
  proposed,
  forbidden,
}: {
  proposed: string[];
  forbidden: string[];
}) {
  return proposed.every(
    (item) => !forbidden.some((forbiddenGlob) => globMatches(forbiddenGlob, item)),
  );
}

function globMatches(glob: string, value: string) {
  const normalizedGlob = glob.trim();
  const normalizedValue = value.trim();
  if (!normalizedGlob || !normalizedValue) return false;
  if (normalizedGlob === normalizedValue) return true;
  const escaped = normalizedGlob
    .replace(/[.+^${}()|[\]\\]/g, "\\$&")
    .replace(/\*\*/g, "\u0000")
    .replace(/\*/g, "[^/]*")
    .replace(/\u0000/g, ".*");
  return new RegExp(`^${escaped}$`).test(normalizedValue);
}

function computeIdempotencyKey(input: NormalizedAutohuntWorkQueueCandidateInput) {
  return buildDeterministicIdempotencyKey({
    kind: AUTOHUNT_WORK_QUEUE_CANDIDATE_KIND,
    version: AUTOHUNT_WORK_QUEUE_CANDIDATE_VERSION,
    source: {
      source_grant_fingerprint: input.source_grant.grant_fingerprint,
      candidate_origin: input.candidate_origin,
      source_fingerprints: input.source_fingerprints,
      work_class: input.work_class,
      title_summary_fingerprint: input.title_summary_fingerprint,
      budget_projection: input.budget_projection,
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
}): AutohuntWorkQueueCandidateRowCountWriteSummary {
  const writeSummary = summarizeTargetOnlyRowCountWrite({
    targetTable: AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE,
    tableNames: TARGET_AND_NON_TARGET_TABLES,
    beforeCounts,
    afterCounts,
  });
  return {
    target_table_name: AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE,
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

function isTargetOnlyWrite(
  summary: AutohuntWorkQueueCandidateRowCountWriteSummary,
) {
  return (
    summary.target_table_name === AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE &&
    isTargetOnlyRowCountWrite(summary)
  );
}

function createAcceptedResult({
  result_status,
  candidate,
  queue_candidate_record_written,
  duplicate_replayed,
}: {
  result_status: "written" | "duplicate_replayed";
  candidate: AutohuntWorkQueueCandidate;
  queue_candidate_record_written: boolean;
  duplicate_replayed: boolean;
}): AutohuntWorkQueueCandidateWriteResult {
  return {
    ok: true,
    result_status,
    refusal_reasons: [],
    candidate,
    duplicate_replayed,
    queue_candidate_record_written,
    row_count_write_summary: candidate.row_count_write_summary,
    ...createNoRunAuthorityFlags(),
    raw_material_persisted: false,
  };
}

function createRefusedResult(
  refusalReasons: string[],
): AutohuntWorkQueueCandidateWriteResult {
  return {
    ok: false,
    result_status: "refused",
    refusal_reasons: [...new Set(refusalReasons)],
    candidate: null,
    duplicate_replayed: false,
    queue_candidate_record_written: false,
    row_count_write_summary: null,
    ...createNoRunAuthorityFlags(),
    raw_material_persisted: false,
  };
}

function createNoRunAuthorityFlags() {
  return {
    can_start_runner: false,
    can_schedule_runner: false,
    can_execute_codex: false,
    can_call_github: false,
    can_create_branch_or_pr: false,
    can_merge: false,
    can_deploy: false,
    can_publish_external: false,
    can_call_provider_or_openai: false,
    can_fetch_sources: false,
    can_run_retrieval: false,
    can_write_memory: false,
    can_promote_perspective: false,
    can_mutate_cwp: false,
    can_mutate_work: false,
    can_write_proof_or_evidence: false,
    can_auto_apply_delta: false,
  } as const;
}

function validateRawMaterialBoundary(input: AutohuntWorkQueueCandidateInput) {
  const { source_grant: _sourceGrant, validation: _validation, ...candidateOnly } =
    input;
  const scrubbed = stripAllowedBoundaryFlagKeys(candidateOnly);
  const forbiddenFields = findForbiddenRawMaterialFields(scrubbed);
  const refusalReasons: string[] = [];
  if (forbiddenFields.length > 0 || containsForbiddenRawMaterial(scrubbed)) {
    refusalReasons.push("raw_material_fields_present");
  }
  if (findUnsafeStringMaterial(candidateOnly).length > 0) {
    refusalReasons.push("unsafe_string_material_present");
  }
  return refusalReasons;
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

function extractSourceGrant(
  source:
    | AutohuntWorkQueueCandidateInput["source_grant"]
    | AutonomyDelegationGrantReadback,
): AutonomyDelegationGrant | null {
  if (!source || typeof source !== "object") return null;
  if ("grant_kind" in source && source.grant_kind === "autonomy_delegation_grant") {
    return source as AutonomyDelegationGrant;
  }
  if ("selected_grant" in source || "latest_active_grant" in source) {
    const readback = source as AutonomyDelegationGrantReadback;
    if (readback.selected_grant?.grant_status === "active") {
      return readback.selected_grant;
    }
    return readback.latest_active_grant ?? null;
  }
  return null;
}

function normalizeStringArray(values: string[] | readonly string[] | undefined) {
  return [
    ...new Set((values ?? []).map((value) => value.trim()).filter(Boolean)),
  ].sort();
}

function normalizeInteger(value: number | undefined) {
  return Number.isFinite(value) ? Math.trunc(value as number) : 0;
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
