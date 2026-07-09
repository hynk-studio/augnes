import { openDatabase } from "@/lib/db";
import type { AutonomyDelegationGrantDbLike } from "@/lib/autonomy/read-autonomy-delegation-grants";
import {
  allValuesFalse,
  fingerprint,
} from "@/lib/research-candidate-review/shared-source-chain-guards";
import type {
  AutohuntPreflightPacket,
  AutohuntPreflightPacketAuthorityBoundary,
  AutohuntPreflightPacketReadback,
  AutohuntPreflightPacketReadbackSelectionStatus,
  AutohuntPreflightPacketRowCountWriteSummary,
  AutohuntPreflightPacketScope,
  AutohuntPreflightPacketSelectedSummary,
  AutohuntPreflightPacketStatus,
} from "@/types/autohunt-preflight-packet";
import {
  AUTOHUNT_PREFLIGHT_PACKET_AUTHORITY_FLAG_NAMES,
  AUTOHUNT_PREFLIGHT_PACKET_KIND,
  AUTOHUNT_PREFLIGHT_PACKET_READBACK_KIND,
  AUTOHUNT_PREFLIGHT_PACKET_READBACK_VERSION,
  AUTOHUNT_PREFLIGHT_PACKET_TABLE,
  AUTOHUNT_PREFLIGHT_PACKET_VERSION,
} from "@/types/autohunt-preflight-packet";

export interface ReadAutohuntPreflightPacketsOptions {
  db?: AutonomyDelegationGrantDbLike;
  scope?: AutohuntPreflightPacketScope;
  source_grant_id?: string | null;
  candidate_id?: string | null;
  preflight_status?: AutohuntPreflightPacketStatus | null;
  preflight_packet_id?: string | null;
  limit?: number;
}

type AutohuntPreflightPacketRow = {
  preflight_packet_id: string;
  created_at: string;
  scope: AutohuntPreflightPacketScope;
  preflight_status: AutohuntPreflightPacketStatus;
  source_grant_id: string;
  source_grant_fingerprint: string;
  source_grant_status: string;
  source_grant_mode: string;
  selected_candidate_ids_json: string;
  selected_candidate_fingerprints_json: string;
  idempotency_key: string;
  source_queue_readback_json: string;
  selected_candidates_json: string;
  aggregate_budget_projection_json: string;
  grant_budget_remaining_projection_json: string;
  preflight_checks_json: string;
  blocked_actions_json: string;
  stop_conditions_json: string;
  required_checks_json: string;
  next_allowed_outputs_json: string;
  forbidden_outputs_json: string;
  authority_boundary_json: string;
  persisted_material_boundary_json: string;
  validation_json: string;
  row_count_write_summary_json: string;
  preflight_packet_fingerprint: string;
};

const DEFAULT_SCOPE: AutohuntPreflightPacketScope = "project:augnes";

export function ensureAutohuntPreflightPacketSchema(
  db: AutonomyDelegationGrantDbLike,
) {
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
}

export function readAutohuntPreflightPackets({
  db: providedDb,
  scope = DEFAULT_SCOPE,
  source_grant_id = null,
  candidate_id = null,
  preflight_status = null,
  preflight_packet_id = null,
  limit = 50,
}: ReadAutohuntPreflightPacketsOptions = {}): AutohuntPreflightPacketReadback {
  const db = providedDb ?? openDatabase();
  const shouldClose = !providedDb && hasClose(db);

  try {
    ensureAutohuntPreflightPacketSchema(db);
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
    const rows = readRows(db, {
      scope,
      source_grant_id,
      preflight_status,
      preflight_packet_id,
      limit: safeLimit,
    });
    const allRows = readRows(db, {
      scope,
      source_grant_id,
      preflight_status: null,
      preflight_packet_id: null,
      limit: safeLimit,
    });
    const { records, invalidRecordCount } = parseValidRecords(rows);
    const { records: allRecords, invalidRecordCount: allInvalidRecordCount } =
      parseValidRecords(allRows);
    const filteredRecords = candidate_id
      ? records.filter((record) =>
          record.source_queue_readback.selected_candidate_ids.includes(
            candidate_id,
          ),
        )
      : records;
    const filteredAllRecords = candidate_id
      ? allRecords.filter((record) =>
          record.source_queue_readback.selected_candidate_ids.includes(
            candidate_id,
          ),
        )
      : allRecords;
    const latestReadyPacket =
      filteredAllRecords.find(
        (record) =>
          record.preflight_status === "ready_for_supervised_handoff_planning",
      ) ?? null;
    const selectedPacket = selectPacket({
      records: filteredRecords,
      latestReadyPacket,
      preflight_packet_id,
      preflight_status,
    });
    const selectionStatus = getSelectionStatus({
      selectedPacket,
      latestReadyPacket,
      preflight_packet_id,
      allRecords: filteredAllRecords,
    });

    return createReadback({
      scope,
      source_grant_id,
      candidate_id,
      preflight_status,
      preflight_packet_id,
      selection_status: selectionStatus,
      selected_preflight_packet: selectedPacket,
      latest_ready_preflight_packet: latestReadyPacket,
      preflight_packets: filteredRecords,
      all_preflight_packets: filteredAllRecords,
      invalid_record_count: Math.max(invalidRecordCount, allInvalidRecordCount),
    });
  } finally {
    if (shouldClose) {
      db.close();
    }
  }
}

export function computeAutohuntPreflightPacketFingerprint(
  packet: Omit<AutohuntPreflightPacket, "preflight_packet_fingerprint"> & {
    preflight_packet_fingerprint?: string;
  },
) {
  const {
    preflight_packet_fingerprint: _preflightPacketFingerprint,
    ...fingerprintSource
  } = packet;
  return fingerprint(fingerprintSource);
}

export function parseAutohuntPreflightPacketRow(
  row: AutohuntPreflightPacketRow,
): AutohuntPreflightPacket | null {
  try {
    return {
      preflight_packet_kind: AUTOHUNT_PREFLIGHT_PACKET_KIND,
      preflight_packet_version: AUTOHUNT_PREFLIGHT_PACKET_VERSION,
      preflight_packet_id: row.preflight_packet_id,
      scope: row.scope,
      created_at: row.created_at,
      preflight_status: row.preflight_status,
      source_grant: {
        grant_id: row.source_grant_id,
        grant_fingerprint: row.source_grant_fingerprint,
        grant_status: row.source_grant_status as never,
        grant_mode: row.source_grant_mode as never,
      },
      source_queue_readback: parseJson(row.source_queue_readback_json),
      selected_candidates: parseJson(row.selected_candidates_json),
      aggregate_budget_projection: parseJson(
        row.aggregate_budget_projection_json,
      ),
      grant_budget_remaining_projection: parseJson(
        row.grant_budget_remaining_projection_json,
      ),
      preflight_checks: parseJson(row.preflight_checks_json),
      blocked_actions: parseJson(row.blocked_actions_json),
      stop_conditions: parseJson(row.stop_conditions_json),
      required_checks: parseJson(row.required_checks_json),
      next_allowed_outputs: parseJson(row.next_allowed_outputs_json),
      forbidden_outputs: parseJson(row.forbidden_outputs_json),
      authority_boundary: parseJson(row.authority_boundary_json),
      persisted_material_boundary: parseJson(row.persisted_material_boundary_json),
      validation: parseJson(row.validation_json),
      row_count_write_summary: parseJson(
        row.row_count_write_summary_json,
      ) as AutohuntPreflightPacketRowCountWriteSummary,
      idempotency_key: row.idempotency_key,
      preflight_packet_fingerprint: row.preflight_packet_fingerprint,
    };
  } catch {
    return null;
  }
}

export function buildAutohuntPreflightPacketAuthorityBoundary(): AutohuntPreflightPacketAuthorityBoundary {
  return Object.fromEntries(
    AUTOHUNT_PREFLIGHT_PACKET_AUTHORITY_FLAG_NAMES.map((field) => [
      field,
      false,
    ]),
  ) as AutohuntPreflightPacketAuthorityBoundary;
}

function readRows(
  db: AutonomyDelegationGrantDbLike,
  {
    scope,
    source_grant_id,
    preflight_status,
    preflight_packet_id,
    limit,
  }: {
    scope: AutohuntPreflightPacketScope;
    source_grant_id: string | null;
    preflight_status: AutohuntPreflightPacketStatus | null;
    preflight_packet_id: string | null;
    limit: number;
  },
) {
  if (preflight_packet_id) {
    return db
      .prepare(
        `
          SELECT *
          FROM ${AUTOHUNT_PREFLIGHT_PACKET_TABLE}
          WHERE scope = ?
            AND preflight_packet_id = ?
          ORDER BY created_at DESC, preflight_packet_id DESC
          LIMIT 1
        `,
      )
      .all(scope, preflight_packet_id) as AutohuntPreflightPacketRow[];
  }

  const conditions = ["scope = ?"];
  const params: unknown[] = [scope];
  if (source_grant_id) {
    conditions.push("source_grant_id = ?");
    params.push(source_grant_id);
  }
  if (preflight_status) {
    conditions.push("preflight_status = ?");
    params.push(preflight_status);
  }
  params.push(limit);

  return db
    .prepare(
      `
        SELECT *
        FROM ${AUTOHUNT_PREFLIGHT_PACKET_TABLE}
        WHERE ${conditions.join(" AND ")}
        ORDER BY created_at DESC, preflight_packet_id DESC
        LIMIT ?
      `,
    )
    .all(...params) as AutohuntPreflightPacketRow[];
}

function parseValidRecords(rows: AutohuntPreflightPacketRow[]) {
  const records: AutohuntPreflightPacket[] = [];
  let invalidRecordCount = 0;

  for (const row of rows) {
    const record = parseAutohuntPreflightPacketRow(row);
    if (
      record &&
      record.preflight_packet_fingerprint ===
        computeAutohuntPreflightPacketFingerprint(record)
    ) {
      records.push(record);
    } else {
      invalidRecordCount += 1;
    }
  }

  return { records, invalidRecordCount };
}

function selectPacket({
  records,
  latestReadyPacket,
  preflight_packet_id,
  preflight_status,
}: {
  records: AutohuntPreflightPacket[];
  latestReadyPacket: AutohuntPreflightPacket | null;
  preflight_packet_id: string | null;
  preflight_status: AutohuntPreflightPacketStatus | null;
}) {
  if (preflight_packet_id) return records[0] ?? null;
  if (!preflight_status) return latestReadyPacket;
  if (preflight_status === "ready_for_supervised_handoff_planning") {
    return records[0] ?? null;
  }
  return records[0] ?? null;
}

function getSelectionStatus({
  selectedPacket,
  latestReadyPacket,
  preflight_packet_id,
  allRecords,
}: {
  selectedPacket: AutohuntPreflightPacket | null;
  latestReadyPacket: AutohuntPreflightPacket | null;
  preflight_packet_id: string | null;
  allRecords: AutohuntPreflightPacket[];
}): AutohuntPreflightPacketReadbackSelectionStatus {
  if (preflight_packet_id) {
    return selectedPacket
      ? "selected_by_preflight_packet_id"
      : "preflight_packet_id_not_found";
  }
  if (selectedPacket?.preflight_status === "ready_for_supervised_handoff_planning") {
    return "selected_latest_ready_preflight_packet";
  }
  if (latestReadyPacket) return "selected_latest_ready_preflight_packet";
  return allRecords.length > 0 ? "no_ready_preflight_packet" : "no_preflight_packets";
}

function createReadback({
  scope,
  source_grant_id,
  candidate_id,
  preflight_status,
  preflight_packet_id,
  selection_status,
  selected_preflight_packet,
  latest_ready_preflight_packet,
  preflight_packets,
  all_preflight_packets,
  invalid_record_count,
}: Pick<
  AutohuntPreflightPacketReadback,
  | "scope"
  | "selection_status"
  | "selected_preflight_packet"
  | "latest_ready_preflight_packet"
  | "preflight_packets"
  | "all_preflight_packets"
  | "invalid_record_count"
> & {
  source_grant_id: string | null;
  candidate_id: string | null;
  preflight_status: AutohuntPreflightPacketStatus | null;
  preflight_packet_id: string | null;
}): AutohuntPreflightPacketReadback {
  const boundary = buildAutohuntPreflightPacketAuthorityBoundary();
  const selected =
    selected_preflight_packet ?? latest_ready_preflight_packet ?? null;
  const readyPackets = all_preflight_packets.filter(
    (packet) =>
      packet.preflight_status === "ready_for_supervised_handoff_planning",
  );
  const blockedPackets = all_preflight_packets.filter(
    (packet) => packet.preflight_status === "blocked",
  );
  const insufficientDataPackets = all_preflight_packets.filter(
    (packet) => packet.preflight_status === "insufficient_data",
  );
  const noQueuedCandidatesPackets = all_preflight_packets.filter(
    (packet) => packet.preflight_status === "no_queued_candidates",
  );
  const blockers = uniqueStrings(
    all_preflight_packets.flatMap(
      (packet) => packet.preflight_checks.blocker_reasons,
    ),
  );
  const warnings = uniqueStrings(
    all_preflight_packets.flatMap(
      (packet) => packet.preflight_checks.warning_reasons,
    ),
  );

  return {
    readback_kind: AUTOHUNT_PREFLIGHT_PACKET_READBACK_KIND,
    readback_version: AUTOHUNT_PREFLIGHT_PACKET_READBACK_VERSION,
    scope,
    source_grant_id_filter: source_grant_id,
    candidate_id_filter: candidate_id,
    preflight_status_filter: preflight_status,
    preflight_packet_id_filter: preflight_packet_id,
    selection_status,
    selected_preflight_packet: selected,
    selected_preflight_packet_summary: selected
      ? summarizeSelectedPacket(selected)
      : null,
    latest_ready_preflight_packet,
    preflight_packets,
    all_preflight_packets,
    ready_preflight_packets: readyPackets,
    blocked_preflight_packets: blockedPackets,
    insufficient_data_preflight_packets: insufficientDataPackets,
    no_queued_candidates_preflight_packets: noQueuedCandidatesPackets,
    invalid_record_count,
    preflight_blocker_reasons: blockers,
    preflight_warning_reasons: warnings,
    aggregate_budget_projection: selected?.aggregate_budget_projection ?? null,
    selected_candidate_summaries: selected?.selected_candidates ?? [],
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

function summarizeSelectedPacket(
  packet: AutohuntPreflightPacket,
): AutohuntPreflightPacketSelectedSummary {
  return {
    preflight_packet_id: packet.preflight_packet_id,
    preflight_status: packet.preflight_status,
    source_grant_id: packet.source_grant.grant_id,
    source_grant_fingerprint: packet.source_grant.grant_fingerprint,
    selected_candidate_count:
      packet.source_queue_readback.selected_candidate_ids.length,
    aggregate_budget_summary: [
      `iterations=${packet.aggregate_budget_projection.estimated_iterations}`,
      `tool_calls=${packet.aggregate_budget_projection.estimated_tool_calls}`,
      `codex_tasks=${packet.aggregate_budget_projection.estimated_codex_tasks}`,
      `file_changes=${packet.aggregate_budget_projection.estimated_file_changes}`,
      `draft_prs=${packet.aggregate_budget_projection.estimated_draft_prs}`,
    ].join(", "),
    blocker_count: packet.preflight_checks.blocker_reasons.length,
    warning_count: packet.preflight_checks.warning_reasons.length,
    authority_boundary_all_false: allValuesFalse(packet.authority_boundary),
  };
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
