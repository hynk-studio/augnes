import { openDatabase } from "@/lib/db";
import type { AutonomyDelegationGrantDbLike } from "@/lib/autonomy/read-autonomy-delegation-grants";
import {
  allValuesFalse,
  fingerprint,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import type {
  AutohuntHandoffPlanPreview,
  AutohuntHandoffPlanPreviewAuthorityBoundary,
  AutohuntHandoffPlanPreviewReadback,
  AutohuntHandoffPlanPreviewReadbackSelectionStatus,
  AutohuntHandoffPlanPreviewRowCountWriteSummary,
  AutohuntHandoffPlanPreviewScope,
  AutohuntHandoffPlanPreviewSelectedSummary,
  AutohuntHandoffPlanPreviewStatus,
} from "@/types/autohunt-handoff-plan-preview";
import {
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_AUTHORITY_FLAG_NAMES,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_KIND,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_READBACK_KIND,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_READBACK_VERSION,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE,
  AUTOHUNT_HANDOFF_PLAN_PREVIEW_VERSION,
} from "@/types/autohunt-handoff-plan-preview";

export interface ReadAutohuntHandoffPlanPreviewsOptions {
  db?: AutonomyDelegationGrantDbLike;
  scope?: AutohuntHandoffPlanPreviewScope;
  source_grant_id?: string | null;
  source_preflight_packet_id?: string | null;
  handoff_plan_status?: AutohuntHandoffPlanPreviewStatus | null;
  handoff_plan_id?: string | null;
  limit?: number;
}

type AutohuntHandoffPlanPreviewRow = {
  handoff_plan_id: string;
  created_at: string;
  scope: AutohuntHandoffPlanPreviewScope;
  handoff_plan_status: AutohuntHandoffPlanPreviewStatus;
  source_grant_id: string;
  source_grant_fingerprint: string;
  source_grant_status: string;
  source_grant_mode: string;
  source_preflight_packet_id: string;
  source_preflight_packet_fingerprint: string;
  source_workbench_spine_fingerprint: string;
  selected_candidate_ids_json: string;
  selected_candidate_fingerprints_json: string;
  idempotency_key: string;
  selected_candidate_plan_summaries_json: string;
  supervised_codex_prompt_plan_json: string;
  draft_pr_plan_json: string;
  operator_review_packet_json: string;
  aggregate_budget_projection_json: string;
  blocked_actions_json: string;
  next_allowed_outputs_json: string;
  forbidden_outputs_json: string;
  authority_boundary_json: string;
  persisted_material_boundary_json: string;
  validation_json: string;
  row_count_write_summary_json: string;
  handoff_plan_fingerprint: string;
};

const DEFAULT_SCOPE: AutohuntHandoffPlanPreviewScope = "project:augnes";

export function ensureAutohuntHandoffPlanPreviewSchema(
  db: AutonomyDelegationGrantDbLike,
) {
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
}

export function readAutohuntHandoffPlanPreviews({
  db: providedDb,
  scope = DEFAULT_SCOPE,
  source_grant_id = null,
  source_preflight_packet_id = null,
  handoff_plan_status = null,
  handoff_plan_id = null,
  limit = 50,
}: ReadAutohuntHandoffPlanPreviewsOptions = {}): AutohuntHandoffPlanPreviewReadback {
  const db = providedDb ?? openDatabase();
  const shouldClose = !providedDb && hasClose(db);

  try {
    ensureAutohuntHandoffPlanPreviewSchema(db);
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
    const rows = readRows(db, {
      scope,
      source_grant_id,
      source_preflight_packet_id,
      handoff_plan_status,
      handoff_plan_id,
      limit: safeLimit,
    });
    const allRows = readRows(db, {
      scope,
      source_grant_id,
      source_preflight_packet_id,
      handoff_plan_status: null,
      handoff_plan_id: null,
      limit: safeLimit,
    });
    const { records, invalidRecordCount } = parseValidRecords(rows);
    const { records: allRecords, invalidRecordCount: allInvalidRecordCount } =
      parseValidRecords(allRows);
    const latestReadyHandoffPlan =
      allRecords.find(
        (record) => record.handoff_plan_status === "ready_for_operator_review",
      ) ?? null;
    const selectedHandoffPlan = selectHandoffPlan({
      records,
      latestReadyHandoffPlan,
      handoff_plan_id,
      handoff_plan_status,
    });
    const selectionStatus = getSelectionStatus({
      selectedHandoffPlan,
      latestReadyHandoffPlan,
      handoff_plan_id,
      allRecords,
    });

    return createReadback({
      scope,
      source_grant_id,
      source_preflight_packet_id,
      handoff_plan_status,
      handoff_plan_id,
      selection_status: selectionStatus,
      selected_handoff_plan: selectedHandoffPlan,
      latest_ready_handoff_plan: latestReadyHandoffPlan,
      handoff_plans: records,
      all_handoff_plans: allRecords,
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

export function computeAutohuntHandoffPlanPreviewFingerprint(
  handoffPlan: Omit<AutohuntHandoffPlanPreview, "handoff_plan_fingerprint"> & {
    handoff_plan_fingerprint?: string;
  },
) {
  const {
    handoff_plan_fingerprint: _handoffPlanFingerprint,
    ...fingerprintSource
  } = handoffPlan;
  return fingerprint(fingerprintSource);
}

export function parseAutohuntHandoffPlanPreviewRow(
  row: AutohuntHandoffPlanPreviewRow,
): AutohuntHandoffPlanPreview | null {
  try {
    const selectedCandidateIds = parseJson(row.selected_candidate_ids_json);
    const selectedCandidateFingerprints = parseJson(
      row.selected_candidate_fingerprints_json,
    );
    return {
      handoff_plan_kind: AUTOHUNT_HANDOFF_PLAN_PREVIEW_KIND,
      handoff_plan_version: AUTOHUNT_HANDOFF_PLAN_PREVIEW_VERSION,
      handoff_plan_id: row.handoff_plan_id,
      scope: row.scope,
      created_at: row.created_at,
      handoff_plan_status: row.handoff_plan_status,
      source_grant: {
        grant_id: row.source_grant_id,
        grant_fingerprint: row.source_grant_fingerprint,
        grant_status: row.source_grant_status as never,
        grant_mode: row.source_grant_mode as never,
      },
      source_preflight: {
        preflight_packet_id: row.source_preflight_packet_id,
        preflight_packet_fingerprint: row.source_preflight_packet_fingerprint,
        preflight_status: "ready_for_supervised_handoff_planning",
        selected_candidate_ids: selectedCandidateIds,
        selected_candidate_fingerprints: selectedCandidateFingerprints,
      },
      source_workbench_spine: {
        spine_fingerprint: row.source_workbench_spine_fingerprint,
        spine_status: "ready_for_supervised_handoff_planning",
        chain_binding_summary: {
          grant_to_candidates_bound: true,
          candidates_to_preflight_bound: true,
          grant_fingerprint_matches: true,
          candidate_fingerprints_match: true,
          selected_candidate_ids: selectedCandidateIds,
          selected_candidate_fingerprints: selectedCandidateFingerprints,
        },
      },
      selected_candidate_plan_summaries: parseJson(
        row.selected_candidate_plan_summaries_json,
      ),
      supervised_codex_prompt_plan: parseJson(
        row.supervised_codex_prompt_plan_json,
      ),
      draft_pr_plan: parseJson(row.draft_pr_plan_json),
      operator_review_packet: parseJson(row.operator_review_packet_json),
      aggregate_budget_projection: parseJson(
        row.aggregate_budget_projection_json,
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
      ) as AutohuntHandoffPlanPreviewRowCountWriteSummary,
      idempotency_key: row.idempotency_key,
      handoff_plan_fingerprint: row.handoff_plan_fingerprint,
    };
  } catch {
    return null;
  }
}

export function buildAutohuntHandoffPlanPreviewAuthorityBoundary(): AutohuntHandoffPlanPreviewAuthorityBoundary {
  return Object.fromEntries(
    AUTOHUNT_HANDOFF_PLAN_PREVIEW_AUTHORITY_FLAG_NAMES.map((field) => [
      field,
      false,
    ]),
  ) as AutohuntHandoffPlanPreviewAuthorityBoundary;
}

function readRows(
  db: AutonomyDelegationGrantDbLike,
  {
    scope,
    source_grant_id,
    source_preflight_packet_id,
    handoff_plan_status,
    handoff_plan_id,
    limit,
  }: {
    scope: AutohuntHandoffPlanPreviewScope;
    source_grant_id: string | null;
    source_preflight_packet_id: string | null;
    handoff_plan_status: AutohuntHandoffPlanPreviewStatus | null;
    handoff_plan_id: string | null;
    limit: number;
  },
) {
  if (handoff_plan_id) {
    return db
      .prepare(
        `
          SELECT *
          FROM ${AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE}
          WHERE scope = ?
            AND handoff_plan_id = ?
          ORDER BY created_at DESC, handoff_plan_id DESC
          LIMIT 1
        `,
      )
      .all(scope, handoff_plan_id) as AutohuntHandoffPlanPreviewRow[];
  }

  const conditions = ["scope = ?"];
  const params: unknown[] = [scope];
  if (source_grant_id) {
    conditions.push("source_grant_id = ?");
    params.push(source_grant_id);
  }
  if (source_preflight_packet_id) {
    conditions.push("source_preflight_packet_id = ?");
    params.push(source_preflight_packet_id);
  }
  if (handoff_plan_status) {
    conditions.push("handoff_plan_status = ?");
    params.push(handoff_plan_status);
  }
  params.push(limit);

  return db
    .prepare(
      `
        SELECT *
        FROM ${AUTOHUNT_HANDOFF_PLAN_PREVIEW_TABLE}
        WHERE ${conditions.join(" AND ")}
        ORDER BY created_at DESC, handoff_plan_id DESC
        LIMIT ?
      `,
    )
    .all(...params) as AutohuntHandoffPlanPreviewRow[];
}

function parseValidRecords(rows: AutohuntHandoffPlanPreviewRow[]) {
  const records: AutohuntHandoffPlanPreview[] = [];
  let invalidRecordCount = 0;

  for (const row of rows) {
    const record = parseAutohuntHandoffPlanPreviewRow(row);
    if (
      record &&
      record.handoff_plan_fingerprint ===
        computeAutohuntHandoffPlanPreviewFingerprint(record)
    ) {
      records.push(record);
    } else {
      invalidRecordCount += 1;
    }
  }

  return { records, invalidRecordCount };
}

function selectHandoffPlan({
  records,
  latestReadyHandoffPlan,
  handoff_plan_id,
  handoff_plan_status,
}: {
  records: AutohuntHandoffPlanPreview[];
  latestReadyHandoffPlan: AutohuntHandoffPlanPreview | null;
  handoff_plan_id: string | null;
  handoff_plan_status: AutohuntHandoffPlanPreviewStatus | null;
}) {
  if (handoff_plan_id) return records[0] ?? null;
  if (!handoff_plan_status) return latestReadyHandoffPlan;
  if (handoff_plan_status === "ready_for_operator_review") {
    return records[0] ?? null;
  }
  return records[0] ?? null;
}

function getSelectionStatus({
  selectedHandoffPlan,
  latestReadyHandoffPlan,
  handoff_plan_id,
  allRecords,
}: {
  selectedHandoffPlan: AutohuntHandoffPlanPreview | null;
  latestReadyHandoffPlan: AutohuntHandoffPlanPreview | null;
  handoff_plan_id: string | null;
  allRecords: AutohuntHandoffPlanPreview[];
}): AutohuntHandoffPlanPreviewReadbackSelectionStatus {
  if (handoff_plan_id) {
    return selectedHandoffPlan
      ? "selected_by_handoff_plan_id"
      : "handoff_plan_id_not_found";
  }
  if (selectedHandoffPlan?.handoff_plan_status === "ready_for_operator_review") {
    return "selected_latest_ready_handoff_plan";
  }
  if (latestReadyHandoffPlan) return "selected_latest_ready_handoff_plan";
  return allRecords.length > 0 ? "no_ready_handoff_plan" : "no_handoff_plans";
}

function createReadback({
  scope,
  source_grant_id,
  source_preflight_packet_id,
  handoff_plan_status,
  handoff_plan_id,
  selection_status,
  selected_handoff_plan,
  latest_ready_handoff_plan,
  handoff_plans,
  all_handoff_plans,
  invalid_record_count,
}: Pick<
  AutohuntHandoffPlanPreviewReadback,
  | "scope"
  | "selection_status"
  | "selected_handoff_plan"
  | "latest_ready_handoff_plan"
  | "handoff_plans"
  | "all_handoff_plans"
  | "invalid_record_count"
> & {
  source_grant_id: string | null;
  source_preflight_packet_id: string | null;
  handoff_plan_status: AutohuntHandoffPlanPreviewStatus | null;
  handoff_plan_id: string | null;
}): AutohuntHandoffPlanPreviewReadback {
  const boundary = buildAutohuntHandoffPlanPreviewAuthorityBoundary();
  const selected = selected_handoff_plan ?? latest_ready_handoff_plan ?? null;
  const readyHandoffPlans = all_handoff_plans.filter(
    (plan) => plan.handoff_plan_status === "ready_for_operator_review",
  );
  const blockedHandoffPlans = all_handoff_plans.filter(
    (plan) => plan.handoff_plan_status === "blocked",
  );
  const insufficientDataHandoffPlans = all_handoff_plans.filter(
    (plan) => plan.handoff_plan_status === "insufficient_data",
  );

  return {
    readback_kind: AUTOHUNT_HANDOFF_PLAN_PREVIEW_READBACK_KIND,
    readback_version: AUTOHUNT_HANDOFF_PLAN_PREVIEW_READBACK_VERSION,
    scope,
    source_grant_id_filter: source_grant_id,
    source_preflight_packet_id_filter: source_preflight_packet_id,
    handoff_plan_status_filter: handoff_plan_status,
    handoff_plan_id_filter: handoff_plan_id,
    selection_status,
    selected_handoff_plan: selected,
    selected_handoff_plan_summary: selected
      ? summarizeSelectedHandoffPlan(selected)
      : null,
    latest_ready_handoff_plan,
    handoff_plans,
    all_handoff_plans,
    ready_handoff_plans: readyHandoffPlans,
    blocked_handoff_plans: blockedHandoffPlans,
    insufficient_data_handoff_plans: insufficientDataHandoffPlans,
    invalid_record_count,
    selected_candidate_summaries:
      selected?.selected_candidate_plan_summaries ?? [],
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

function summarizeSelectedHandoffPlan(
  handoffPlan: AutohuntHandoffPlanPreview,
): AutohuntHandoffPlanPreviewSelectedSummary {
  return {
    handoff_plan_id: handoffPlan.handoff_plan_id,
    handoff_plan_status: handoffPlan.handoff_plan_status,
    source_grant_id: handoffPlan.source_grant.grant_id,
    source_preflight_packet_id:
      handoffPlan.source_preflight.preflight_packet_id,
    selected_candidate_count:
      handoffPlan.selected_candidate_plan_summaries.length,
    prompt_plan_id:
      handoffPlan.supervised_codex_prompt_plan.prompt_plan_id,
    review_packet_id: handoffPlan.operator_review_packet.review_packet_id,
    blocker_count: handoffPlan.validation.passed ? 0 : 1,
    authority_boundary_all_false: allValuesFalse(
      handoffPlan.authority_boundary,
    ),
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
