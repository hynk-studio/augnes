import { openDatabase } from "@/lib/db";
import type { AutonomyDelegationGrantDbLike } from "@/lib/autonomy/read-autonomy-delegation-grants";
import {
  allValuesFalse,
  fingerprint,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import type {
  AutohuntHandoffPlanOperatorDecision,
  AutohuntHandoffPlanOperatorReviewDecision,
  AutohuntHandoffPlanOperatorReviewDecisionAcceptedSummary,
  AutohuntHandoffPlanOperatorReviewDecisionAuthorityBoundary,
  AutohuntHandoffPlanOperatorReviewDecisionReadback,
  AutohuntHandoffPlanOperatorReviewDecisionRowCountWriteSummary,
  AutohuntHandoffPlanOperatorReviewDecisionScope,
  AutohuntHandoffPlanOperatorReviewDecisionSelectedSummary,
  AutohuntHandoffPlanOperatorReviewDecisionSelectionStatus,
  AutohuntHandoffPlanOperatorReviewDecisionStatus,
} from "@/types/autohunt-handoff-plan-operator-review-decision";
import {
  AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_KIND,
  AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_READBACK_KIND,
  AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_READBACK_VERSION,
  AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE,
  AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_VERSION,
} from "@/types/autohunt-handoff-plan-operator-review-decision";
import { buildAutohuntHandoffPlanPreviewAuthorityBoundary } from "@/lib/autonomy/read-autohunt-handoff-plan-previews";

export interface ReadAutohuntHandoffPlanOperatorReviewDecisionsOptions {
  db?: AutonomyDelegationGrantDbLike;
  scope?: AutohuntHandoffPlanOperatorReviewDecisionScope;
  source_handoff_plan_id?: string | null;
  decision_status?: AutohuntHandoffPlanOperatorReviewDecisionStatus | null;
  operator_decision?: AutohuntHandoffPlanOperatorDecision | null;
  decision_id?: string | null;
  limit?: number;
}

type AutohuntHandoffPlanOperatorReviewDecisionRow = {
  decision_id: string;
  created_at: string;
  scope: AutohuntHandoffPlanOperatorReviewDecisionScope;
  decision_status: AutohuntHandoffPlanOperatorReviewDecisionStatus;
  operator_decision: AutohuntHandoffPlanOperatorDecision;
  source_handoff_plan_id: string;
  source_handoff_plan_fingerprint: string;
  source_handoff_plan_status: string;
  source_grant_id: string;
  source_grant_fingerprint: string;
  source_preflight_packet_id: string;
  source_preflight_packet_fingerprint: string;
  source_workbench_spine_fingerprint: string;
  selected_candidate_ids_json: string;
  selected_candidate_fingerprints_json: string;
  review_basis_ref: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_basis_fingerprint: string;
  idempotency_key: string;
  accepted_summary_json: string | null;
  defer_or_reject_summary_json: string | null;
  source_chain_validation_json: string;
  blocked_actions_json: string;
  next_allowed_outputs_json: string;
  forbidden_outputs_json: string;
  authority_boundary_json: string;
  persisted_material_boundary_json: string;
  validation_json: string;
  row_count_write_summary_json: string;
  decision_fingerprint: string;
};

const DEFAULT_SCOPE: AutohuntHandoffPlanOperatorReviewDecisionScope =
  "project:augnes";

export function ensureAutohuntHandoffPlanOperatorReviewDecisionSchema(
  db: AutonomyDelegationGrantDbLike,
) {
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
}

export function readAutohuntHandoffPlanOperatorReviewDecisions({
  db: providedDb,
  scope = DEFAULT_SCOPE,
  source_handoff_plan_id = null,
  decision_status = null,
  operator_decision = null,
  decision_id = null,
  limit = 50,
}: ReadAutohuntHandoffPlanOperatorReviewDecisionsOptions = {}): AutohuntHandoffPlanOperatorReviewDecisionReadback {
  const db = providedDb ?? openDatabase();
  const shouldClose = !providedDb && hasClose(db);

  try {
    ensureAutohuntHandoffPlanOperatorReviewDecisionSchema(db);
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
    const rows = readRows(db, {
      scope,
      source_handoff_plan_id,
      decision_status,
      operator_decision,
      decision_id,
      limit: safeLimit,
    });
    const allRows = readRows(db, {
      scope,
      source_handoff_plan_id,
      decision_status: null,
      operator_decision: null,
      decision_id: null,
      limit: safeLimit,
    });
    const { records, invalidRecordCount } = parseValidRecords(rows);
    const { records: allRecords, invalidRecordCount: allInvalidRecordCount } =
      parseValidRecords(allRows);
    const latestAcceptedDecision =
      allRecords.find(
        (record) =>
          record.decision_status ===
          "accepted_for_future_supervised_handoff_copy_export_planning",
      ) ?? null;
    const selectedDecision = selectDecision({
      records,
      latestAcceptedDecision,
      decision_id,
      decision_status,
    });
    const selectionStatus = getSelectionStatus({
      selectedDecision,
      latestAcceptedDecision,
      decision_id,
      allRecords,
    });

    return createReadback({
      scope,
      source_handoff_plan_id,
      decision_status,
      operator_decision,
      decision_id,
      selection_status: selectionStatus,
      selected_decision: selectedDecision,
      latest_accepted_decision: latestAcceptedDecision,
      decisions: records,
      all_decisions: allRecords,
      invalid_record_count: Math.max(
        invalidRecordCount,
        allInvalidRecordCount,
      ),
    });
  } finally {
    if (shouldClose) {
      db.close();
    }
  }
}

export function computeAutohuntHandoffPlanOperatorReviewDecisionFingerprint(
  decision: Omit<
    AutohuntHandoffPlanOperatorReviewDecision,
    "decision_fingerprint"
  > & {
    decision_fingerprint?: string;
  },
) {
  const { decision_fingerprint: _decisionFingerprint, ...fingerprintSource } =
    decision;
  return fingerprint(fingerprintSource);
}

export function parseAutohuntHandoffPlanOperatorReviewDecisionRow(
  row: AutohuntHandoffPlanOperatorReviewDecisionRow,
): AutohuntHandoffPlanOperatorReviewDecision | null {
  try {
    const selectedCandidateIds = parseJson(row.selected_candidate_ids_json);
    const selectedCandidateFingerprints = parseJson(
      row.selected_candidate_fingerprints_json,
    );
    return {
      decision_kind: AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_KIND,
      decision_version:
        AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_VERSION,
      decision_id: row.decision_id,
      scope: row.scope,
      created_at: row.created_at,
      decision_status: row.decision_status,
      operator_decision: row.operator_decision,
      source_handoff_plan: {
        handoff_plan_id: row.source_handoff_plan_id,
        handoff_plan_fingerprint: row.source_handoff_plan_fingerprint,
        handoff_plan_status: row.source_handoff_plan_status as never,
        source_grant_id: row.source_grant_id,
        source_grant_fingerprint: row.source_grant_fingerprint,
        source_preflight_packet_id: row.source_preflight_packet_id,
        source_preflight_packet_fingerprint:
          row.source_preflight_packet_fingerprint,
        source_workbench_spine_fingerprint:
          row.source_workbench_spine_fingerprint,
        selected_candidate_ids: selectedCandidateIds,
        selected_candidate_fingerprints: selectedCandidateFingerprints,
      },
      review_basis: {
        review_basis_ref: row.review_basis_ref,
        reviewed_by: row.reviewed_by,
        reviewed_at: row.reviewed_at,
        review_basis_fingerprint: row.review_basis_fingerprint,
        raw_review_note_persisted: false,
      },
      accepted_summary: row.accepted_summary_json
        ? (parseJson(
            row.accepted_summary_json,
          ) as AutohuntHandoffPlanOperatorReviewDecisionAcceptedSummary)
        : null,
      defer_or_reject_summary: row.defer_or_reject_summary_json
        ? parseJson(row.defer_or_reject_summary_json)
        : null,
      source_chain_validation: parseJson(
        row.source_chain_validation_json,
      ),
      blocked_actions: parseJson(row.blocked_actions_json),
      next_allowed_outputs: parseJson(row.next_allowed_outputs_json),
      forbidden_outputs: parseJson(row.forbidden_outputs_json),
      authority_boundary: parseJson(row.authority_boundary_json),
      persisted_material_boundary: parseJson(
        row.persisted_material_boundary_json,
      ),
      validation: parseJson(row.validation_json),
      row_count_write_summary: parseJson(
        row.row_count_write_summary_json,
      ) as AutohuntHandoffPlanOperatorReviewDecisionRowCountWriteSummary,
      idempotency_key: row.idempotency_key,
      decision_fingerprint: row.decision_fingerprint,
    };
  } catch {
    return null;
  }
}

export function buildAutohuntHandoffPlanOperatorReviewDecisionAuthorityBoundary(): AutohuntHandoffPlanOperatorReviewDecisionAuthorityBoundary {
  return buildAutohuntHandoffPlanPreviewAuthorityBoundary();
}

function readRows(
  db: AutonomyDelegationGrantDbLike,
  {
    scope,
    source_handoff_plan_id,
    decision_status,
    operator_decision,
    decision_id,
    limit,
  }: {
    scope: AutohuntHandoffPlanOperatorReviewDecisionScope;
    source_handoff_plan_id: string | null;
    decision_status: AutohuntHandoffPlanOperatorReviewDecisionStatus | null;
    operator_decision: AutohuntHandoffPlanOperatorDecision | null;
    decision_id: string | null;
    limit: number;
  },
) {
  if (decision_id) {
    return db
      .prepare(
        `
          SELECT *
          FROM ${AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE}
          WHERE scope = ?
            AND decision_id = ?
          ORDER BY created_at DESC, decision_id DESC
          LIMIT 1
        `,
      )
      .all(scope, decision_id) as AutohuntHandoffPlanOperatorReviewDecisionRow[];
  }

  const conditions = ["scope = ?"];
  const params: unknown[] = [scope];
  if (source_handoff_plan_id) {
    conditions.push("source_handoff_plan_id = ?");
    params.push(source_handoff_plan_id);
  }
  if (decision_status) {
    conditions.push("decision_status = ?");
    params.push(decision_status);
  }
  if (operator_decision) {
    conditions.push("operator_decision = ?");
    params.push(operator_decision);
  }
  params.push(limit);

  return db
    .prepare(
      `
        SELECT *
        FROM ${AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_TABLE}
        WHERE ${conditions.join(" AND ")}
        ORDER BY created_at DESC, decision_id DESC
        LIMIT ?
      `,
    )
    .all(...params) as AutohuntHandoffPlanOperatorReviewDecisionRow[];
}

function parseValidRecords(
  rows: AutohuntHandoffPlanOperatorReviewDecisionRow[],
) {
  const records: AutohuntHandoffPlanOperatorReviewDecision[] = [];
  let invalidRecordCount = 0;

  for (const row of rows) {
    const record = parseAutohuntHandoffPlanOperatorReviewDecisionRow(row);
    if (
      record &&
      record.decision_fingerprint ===
        computeAutohuntHandoffPlanOperatorReviewDecisionFingerprint(record)
    ) {
      records.push(record);
    } else {
      invalidRecordCount += 1;
    }
  }

  return { records, invalidRecordCount };
}

function selectDecision({
  records,
  latestAcceptedDecision,
  decision_id,
  decision_status,
}: {
  records: AutohuntHandoffPlanOperatorReviewDecision[];
  latestAcceptedDecision: AutohuntHandoffPlanOperatorReviewDecision | null;
  decision_id: string | null;
  decision_status: AutohuntHandoffPlanOperatorReviewDecisionStatus | null;
}) {
  if (decision_id) return records[0] ?? null;
  if (!decision_status) return latestAcceptedDecision;
  return records[0] ?? null;
}

function getSelectionStatus({
  selectedDecision,
  latestAcceptedDecision,
  decision_id,
  allRecords,
}: {
  selectedDecision: AutohuntHandoffPlanOperatorReviewDecision | null;
  latestAcceptedDecision: AutohuntHandoffPlanOperatorReviewDecision | null;
  decision_id: string | null;
  allRecords: AutohuntHandoffPlanOperatorReviewDecision[];
}): AutohuntHandoffPlanOperatorReviewDecisionSelectionStatus {
  if (decision_id) {
    return selectedDecision ? "selected_by_decision_id" : "decision_id_not_found";
  }
  if (
    selectedDecision?.decision_status ===
    "accepted_for_future_supervised_handoff_copy_export_planning"
  ) {
    return "selected_latest_accepted_decision";
  }
  if (latestAcceptedDecision) return "selected_latest_accepted_decision";
  return allRecords.length > 0 ? "no_accepted_decision" : "no_decisions";
}

function createReadback({
  scope,
  source_handoff_plan_id,
  decision_status,
  operator_decision,
  decision_id,
  selection_status,
  selected_decision,
  latest_accepted_decision,
  decisions,
  all_decisions,
  invalid_record_count,
}: Pick<
  AutohuntHandoffPlanOperatorReviewDecisionReadback,
  | "scope"
  | "selection_status"
  | "selected_decision"
  | "latest_accepted_decision"
  | "decisions"
  | "all_decisions"
  | "invalid_record_count"
> & {
  source_handoff_plan_id: string | null;
  decision_status: AutohuntHandoffPlanOperatorReviewDecisionStatus | null;
  operator_decision: AutohuntHandoffPlanOperatorDecision | null;
  decision_id: string | null;
}): AutohuntHandoffPlanOperatorReviewDecisionReadback {
  const boundary = buildAutohuntHandoffPlanOperatorReviewDecisionAuthorityBoundary();
  const selected = selected_decision ?? latest_accepted_decision ?? null;

  return {
    readback_kind:
      AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_READBACK_KIND,
    readback_version:
      AUTOHUNT_HANDOFF_PLAN_OPERATOR_REVIEW_DECISION_READBACK_VERSION,
    scope,
    source_handoff_plan_id_filter: source_handoff_plan_id,
    decision_status_filter: decision_status,
    operator_decision_filter: operator_decision,
    decision_id_filter: decision_id,
    selection_status,
    selected_decision: selected,
    selected_decision_summary: selected ? summarizeSelectedDecision(selected) : null,
    latest_accepted_decision,
    decisions,
    all_decisions,
    accepted_decisions: all_decisions.filter(
      (decision) =>
        decision.decision_status ===
        "accepted_for_future_supervised_handoff_copy_export_planning",
    ),
    deferred_decisions: all_decisions.filter(
      (decision) => decision.decision_status === "deferred",
    ),
    rejected_decisions: all_decisions.filter(
      (decision) => decision.decision_status === "rejected",
    ),
    blocked_decisions: all_decisions.filter(
      (decision) => decision.decision_status === "blocked",
    ),
    insufficient_data_decisions: all_decisions.filter(
      (decision) => decision.decision_status === "insufficient_data",
    ),
    invalid_record_count,
    selected_candidate_summaries: [],
    accepted_summary: selected?.accepted_summary ?? null,
    defer_or_reject_summary: selected?.defer_or_reject_summary ?? null,
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

function summarizeSelectedDecision(
  decision: AutohuntHandoffPlanOperatorReviewDecision,
): AutohuntHandoffPlanOperatorReviewDecisionSelectedSummary {
  return {
    decision_id: decision.decision_id,
    decision_status: decision.decision_status,
    operator_decision: decision.operator_decision,
    source_handoff_plan_id: decision.source_handoff_plan.handoff_plan_id,
    selected_candidate_count:
      decision.source_handoff_plan.selected_candidate_ids.length,
    accepted_for_future_supervised_copy_export_planning:
      decision.decision_status ===
      "accepted_for_future_supervised_handoff_copy_export_planning",
    authority_boundary_all_false: allValuesFalse(decision.authority_boundary),
  };
}

function parseJson(value: string) {
  return JSON.parse(value);
}

function hasClose(
  db: AutonomyDelegationGrantDbLike,
): db is AutonomyDelegationGrantDbLike & { close(): void } {
  return typeof (db as { close?: unknown }).close === "function";
}
