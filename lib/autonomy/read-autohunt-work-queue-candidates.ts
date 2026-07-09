import { openDatabase } from "@/lib/db";
import type { AutonomyDelegationGrantDbLike } from "@/lib/autonomy/read-autonomy-delegation-grants";
import {
  allValuesFalse,
  fingerprint,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import type {
  AutohuntWorkQueueCandidate,
  AutohuntWorkQueueCandidateAuthorityBoundary,
  AutohuntWorkQueueCandidateOrigin,
  AutohuntWorkQueueCandidateReadback,
  AutohuntWorkQueueCandidateReadbackSelectionStatus,
  AutohuntWorkQueueCandidateRowCountWriteSummary,
  AutohuntWorkQueueCandidateScope,
  AutohuntWorkQueueCandidateSelectedSummary,
  AutohuntWorkQueueCandidateStatus,
  AutohuntWorkQueueCandidateStatusBreakdown,
} from "@/types/autohunt-work-queue-candidate";
import {
  AUTOHUNT_WORK_QUEUE_CANDIDATE_AUTHORITY_FLAG_NAMES,
  AUTOHUNT_WORK_QUEUE_CANDIDATE_KIND,
  AUTOHUNT_WORK_QUEUE_CANDIDATE_READBACK_KIND,
  AUTOHUNT_WORK_QUEUE_CANDIDATE_READBACK_VERSION,
  AUTOHUNT_WORK_QUEUE_CANDIDATE_STATUSES,
  AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE,
  AUTOHUNT_WORK_QUEUE_CANDIDATE_VERSION,
} from "@/types/autohunt-work-queue-candidate";

export interface ReadAutohuntWorkQueueCandidatesOptions {
  db?: AutonomyDelegationGrantDbLike;
  scope?: AutohuntWorkQueueCandidateScope;
  source_grant_id?: string | null;
  candidate_status?: AutohuntWorkQueueCandidateStatus | null;
  candidate_origin?: AutohuntWorkQueueCandidateOrigin | null;
  work_class?: string | null;
  candidate_id?: string | null;
  limit?: number;
}

type AutohuntWorkQueueCandidateRow = {
  candidate_id: string;
  created_at: string;
  scope: AutohuntWorkQueueCandidateScope;
  candidate_status: AutohuntWorkQueueCandidateStatus;
  candidate_origin: AutohuntWorkQueueCandidateOrigin;
  source_grant_id: string;
  source_grant_fingerprint: string;
  source_grant_status: string;
  source_grant_mode: string;
  work_class: string;
  title: string;
  summary: string;
  title_summary_fingerprint: string;
  idempotency_key: string;
  source_refs_json: string;
  source_fingerprints_json: string;
  evidence_refs_json: string;
  required_context_refs_json: string;
  proposed_files_or_globs_json: string;
  expected_outputs_json: string;
  required_checks_json: string;
  blocked_actions_json: string;
  stop_conditions_json: string;
  budget_projection_json: string;
  grant_fit_json: string;
  authority_boundary_json: string;
  persisted_material_boundary_json: string;
  validation_json: string;
  row_count_write_summary_json: string;
  candidate_fingerprint: string;
};

const DEFAULT_SCOPE: AutohuntWorkQueueCandidateScope = "project:augnes";

export function ensureAutohuntWorkQueueCandidateSchema(
  db: AutonomyDelegationGrantDbLike,
) {
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
}

export function readAutohuntWorkQueueCandidates({
  db: providedDb,
  scope = DEFAULT_SCOPE,
  source_grant_id = null,
  candidate_status = null,
  candidate_origin = null,
  work_class = null,
  candidate_id = null,
  limit = 50,
}: ReadAutohuntWorkQueueCandidatesOptions = {}): AutohuntWorkQueueCandidateReadback {
  const db = providedDb ?? openDatabase();
  const shouldClose = !providedDb && hasClose(db);

  try {
    ensureAutohuntWorkQueueCandidateSchema(db);
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
    const rows = readRows(db, {
      scope,
      source_grant_id,
      candidate_status,
      candidate_origin,
      work_class,
      candidate_id,
      limit: safeLimit,
    });
    const allRows = readRows(db, {
      scope,
      source_grant_id: null,
      candidate_status: null,
      candidate_origin: null,
      work_class: null,
      candidate_id: null,
      limit: safeLimit,
    });
    const { records, invalidRecordCount } = parseValidRecords(rows);
    const { records: allRecords, invalidRecordCount: allInvalidRecordCount } =
      parseValidRecords(allRows);
    const selectedCandidate = candidate_id ? records[0] ?? null : null;
    const selectedQueuedCandidates = candidate_id
      ? selectedCandidate?.candidate_status === "queued"
        ? [selectedCandidate]
        : []
      : records.filter((record) => record.candidate_status === "queued");
    const selectionStatus = getSelectionStatus({
      selectedCandidate,
      selectedQueuedCandidates,
      candidate_id,
      allRecords,
    });

    return createReadback({
      scope,
      source_grant_id,
      candidate_status,
      candidate_origin,
      work_class,
      candidate_id,
      selection_status: selectionStatus,
      selected_candidate: selectedCandidate,
      selected_queued_candidates: selectedQueuedCandidates,
      candidates: records,
      all_candidates: allRecords,
      invalid_record_count: Math.max(invalidRecordCount, allInvalidRecordCount),
    });
  } finally {
    if (shouldClose) {
      db.close();
    }
  }
}

export function computeAutohuntWorkQueueCandidateFingerprint(
  candidate: Omit<AutohuntWorkQueueCandidate, "candidate_fingerprint"> & {
    candidate_fingerprint?: string;
  },
) {
  const { candidate_fingerprint: _candidateFingerprint, ...fingerprintSource } =
    candidate;
  return fingerprint(fingerprintSource);
}

export function parseAutohuntWorkQueueCandidateRow(
  row: AutohuntWorkQueueCandidateRow,
): AutohuntWorkQueueCandidate | null {
  try {
    return {
      queue_candidate_kind: AUTOHUNT_WORK_QUEUE_CANDIDATE_KIND,
      queue_candidate_version: AUTOHUNT_WORK_QUEUE_CANDIDATE_VERSION,
      candidate_id: row.candidate_id,
      scope: row.scope,
      created_at: row.created_at,
      candidate_status: row.candidate_status,
      candidate_origin: row.candidate_origin,
      source_grant: {
        grant_id: row.source_grant_id,
        grant_fingerprint: row.source_grant_fingerprint,
        grant_status: row.source_grant_status as never,
        grant_mode: row.source_grant_mode as never,
      },
      work_class: row.work_class,
      title: row.title,
      summary: row.summary,
      title_summary_fingerprint: row.title_summary_fingerprint,
      idempotency_key: row.idempotency_key,
      source_refs: parseJson(row.source_refs_json),
      source_fingerprints: parseJson(row.source_fingerprints_json),
      evidence_refs: parseJson(row.evidence_refs_json),
      required_context_refs: parseJson(row.required_context_refs_json),
      proposed_files_or_globs: parseJson(row.proposed_files_or_globs_json),
      expected_outputs: parseJson(row.expected_outputs_json),
      required_checks: parseJson(row.required_checks_json),
      blocked_actions: parseJson(row.blocked_actions_json),
      stop_conditions: parseJson(row.stop_conditions_json),
      budget_projection: parseJson(row.budget_projection_json),
      grant_fit: parseJson(row.grant_fit_json),
      authority_boundary: parseJson(row.authority_boundary_json),
      persisted_material_boundary: parseJson(row.persisted_material_boundary_json),
      validation: parseJson(row.validation_json),
      row_count_write_summary: parseJson(
        row.row_count_write_summary_json,
      ) as AutohuntWorkQueueCandidateRowCountWriteSummary,
      candidate_fingerprint: row.candidate_fingerprint,
    };
  } catch {
    return null;
  }
}

export function buildAutohuntWorkQueueCandidateAuthorityBoundary(): AutohuntWorkQueueCandidateAuthorityBoundary {
  return Object.fromEntries(
    AUTOHUNT_WORK_QUEUE_CANDIDATE_AUTHORITY_FLAG_NAMES.map((field) => [
      field,
      false,
    ]),
  ) as AutohuntWorkQueueCandidateAuthorityBoundary;
}

function readRows(
  db: AutonomyDelegationGrantDbLike,
  {
    scope,
    source_grant_id,
    candidate_status,
    candidate_origin,
    work_class,
    candidate_id,
    limit,
  }: {
    scope: AutohuntWorkQueueCandidateScope;
    source_grant_id: string | null;
    candidate_status: AutohuntWorkQueueCandidateStatus | null;
    candidate_origin: AutohuntWorkQueueCandidateOrigin | null;
    work_class: string | null;
    candidate_id: string | null;
    limit: number;
  },
) {
  if (candidate_id) {
    return db
      .prepare(
        `
          SELECT *
          FROM ${AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE}
          WHERE scope = ?
            AND candidate_id = ?
          ORDER BY created_at DESC, candidate_id DESC
          LIMIT 1
        `,
      )
      .all(scope, candidate_id) as AutohuntWorkQueueCandidateRow[];
  }

  const conditions = ["scope = ?"];
  const params: unknown[] = [scope];
  if (source_grant_id) {
    conditions.push("source_grant_id = ?");
    params.push(source_grant_id);
  }
  if (candidate_status) {
    conditions.push("candidate_status = ?");
    params.push(candidate_status);
  }
  if (candidate_origin) {
    conditions.push("candidate_origin = ?");
    params.push(candidate_origin);
  }
  if (work_class) {
    conditions.push("work_class = ?");
    params.push(work_class);
  }
  params.push(limit);

  return db
    .prepare(
      `
        SELECT *
        FROM ${AUTOHUNT_WORK_QUEUE_CANDIDATE_TABLE}
        WHERE ${conditions.join(" AND ")}
        ORDER BY created_at DESC, candidate_id DESC
        LIMIT ?
      `,
    )
    .all(...params) as AutohuntWorkQueueCandidateRow[];
}

function parseValidRecords(rows: AutohuntWorkQueueCandidateRow[]) {
  const records: AutohuntWorkQueueCandidate[] = [];
  let invalidRecordCount = 0;

  for (const row of rows) {
    const record = parseAutohuntWorkQueueCandidateRow(row);
    if (
      record &&
      record.candidate_fingerprint ===
        computeAutohuntWorkQueueCandidateFingerprint(record)
    ) {
      records.push(record);
    } else {
      invalidRecordCount += 1;
    }
  }

  return { records, invalidRecordCount };
}

function getSelectionStatus({
  selectedCandidate,
  selectedQueuedCandidates,
  candidate_id,
  allRecords,
}: {
  selectedCandidate: AutohuntWorkQueueCandidate | null;
  selectedQueuedCandidates: AutohuntWorkQueueCandidate[];
  candidate_id: string | null;
  allRecords: AutohuntWorkQueueCandidate[];
}): AutohuntWorkQueueCandidateReadbackSelectionStatus {
  if (candidate_id) {
    return selectedCandidate ? "selected_by_candidate_id" : "candidate_id_not_found";
  }
  if (selectedQueuedCandidates.length > 0) return "selected_queued_candidates";
  return allRecords.length > 0 ? "no_queued_candidates" : "no_candidates";
}

function createReadback({
  scope,
  source_grant_id,
  candidate_status,
  candidate_origin,
  work_class,
  candidate_id,
  selection_status,
  selected_candidate,
  selected_queued_candidates,
  candidates,
  all_candidates,
  invalid_record_count,
}: Pick<
  AutohuntWorkQueueCandidateReadback,
  | "scope"
  | "selection_status"
  | "selected_candidate"
  | "selected_queued_candidates"
  | "candidates"
  | "all_candidates"
  | "invalid_record_count"
> & {
  source_grant_id: string | null;
  candidate_status: AutohuntWorkQueueCandidateStatus | null;
  candidate_origin: AutohuntWorkQueueCandidateOrigin | null;
  work_class: string | null;
  candidate_id: string | null;
}): AutohuntWorkQueueCandidateReadback {
  const boundary = buildAutohuntWorkQueueCandidateAuthorityBoundary();
  const queuedCandidates = all_candidates.filter(
    (candidate) => candidate.candidate_status === "queued",
  );
  const blockedCandidates = all_candidates.filter(
    (candidate) => candidate.candidate_status === "blocked",
  );
  const deferredCandidates = all_candidates.filter(
    (candidate) => candidate.candidate_status === "deferred",
  );
  const rejectedCandidates = all_candidates.filter(
    (candidate) => candidate.candidate_status === "rejected",
  );
  const supersededCandidates = all_candidates.filter(
    (candidate) => candidate.candidate_status === "superseded",
  );
  const grantFitBlockers = uniqueStrings(
    all_candidates.flatMap((candidate) => candidate.grant_fit.blocker_reasons),
  );
  const grantFitWarnings = uniqueStrings(
    all_candidates.flatMap((candidate) => candidate.grant_fit.warning_reasons),
  );

  return {
    readback_kind: AUTOHUNT_WORK_QUEUE_CANDIDATE_READBACK_KIND,
    readback_version: AUTOHUNT_WORK_QUEUE_CANDIDATE_READBACK_VERSION,
    scope,
    source_grant_id_filter: source_grant_id,
    candidate_status_filter: candidate_status,
    candidate_origin_filter: candidate_origin,
    work_class_filter: work_class,
    candidate_id_filter: candidate_id,
    selection_status,
    selected_candidate,
    selected_candidate_summary:
      selected_queued_candidates.length > 0 || selected_candidate
        ? summarizeSelection({
            selected_candidate,
            selected_queued_candidates,
            invalid_record_count,
          })
        : null,
    selected_queued_candidates,
    candidates,
    all_candidates,
    queued_candidates: queuedCandidates,
    blocked_candidates: blockedCandidates,
    deferred_candidates: deferredCandidates,
    rejected_candidates: rejectedCandidates,
    superseded_candidates: supersededCandidates,
    status_breakdown: buildStatusBreakdown(all_candidates),
    invalid_record_count,
    grant_fit_blocker_reasons: grantFitBlockers,
    grant_fit_warning_reasons: grantFitWarnings,
    no_run_no_execution_boundary: boundary,
    raw_material_persisted: false,
    runner_started: false,
    scheduler_started: false,
    codex_executed: false,
    github_called: false,
    provider_openai_called: false,
    sources_fetched: false,
    retrieval_run: false,
    memory_written: false,
    perspective_promoted: false,
    cwp_mutated: false,
    work_mutated: false,
    proof_or_evidence_written: false,
    product_or_delivery_state_written: false,
  };
}

function summarizeSelection({
  selected_candidate,
  selected_queued_candidates,
  invalid_record_count,
}: {
  selected_candidate: AutohuntWorkQueueCandidate | null;
  selected_queued_candidates: AutohuntWorkQueueCandidate[];
  invalid_record_count: number;
}): AutohuntWorkQueueCandidateSelectedSummary {
  const latest = selected_candidate ?? selected_queued_candidates[0] ?? null;
  return {
    selected_queued_count: selected_queued_candidates.length,
    latest_candidate_id: latest?.candidate_id ?? null,
    latest_source_grant_id: latest?.source_grant.grant_id ?? null,
    latest_source_grant_fingerprint:
      latest?.source_grant.grant_fingerprint ?? null,
    latest_origin: latest?.candidate_origin ?? null,
    latest_work_class: latest?.work_class ?? null,
    latest_title_summary_fingerprint: latest?.title_summary_fingerprint ?? null,
    invalid_record_count,
    authority_boundary_all_false: latest
      ? allValuesFalse(latest.authority_boundary)
      : true,
  };
}

function buildStatusBreakdown(
  candidates: AutohuntWorkQueueCandidate[],
): AutohuntWorkQueueCandidateStatusBreakdown {
  return Object.fromEntries(
    AUTOHUNT_WORK_QUEUE_CANDIDATE_STATUSES.map((status) => [
      status,
      candidates.filter((candidate) => candidate.candidate_status === status)
        .length,
    ]),
  ) as AutohuntWorkQueueCandidateStatusBreakdown;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))].sort();
}

function parseJson(value: string) {
  return JSON.parse(value);
}

function hasClose(
  db: AutonomyDelegationGrantDbLike,
): db is AutonomyDelegationGrantDbLike & { close(): void } {
  return typeof (db as { close?: unknown }).close === "function";
}
