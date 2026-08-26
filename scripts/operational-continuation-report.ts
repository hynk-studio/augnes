#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import Database from "better-sqlite3";

import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import {
  readOperationalContinuationV01,
  type OperationalContinuationReadRequestV01,
  type OperationalContinuationReadResultV01,
} from "@/lib/vnext/runtime/operational-continuation-read-model";

const MAX_STDIN_BYTES = 2 * 1024 * 1024;

export type OperationalContinuationReportFormatV01 = "json" | "markdown";

export interface OperationalContinuationReportRequestV01
  extends OperationalContinuationReadRequestV01 {
  database_path: string;
  format: OperationalContinuationReportFormatV01;
}

export interface OperationalContinuationReportV01 {
  report_version: "operational_continuation_report.v0.1";
  report_kind: "bounded_local_offline_query_only_candidate_material";
  result: OperationalContinuationReadResultV01;
  boundary: {
    selection_is_operational_policy: false;
    proposal_accept_is_activation: false;
    proposal_accept_is_semantic_transition: false;
    selected_material_is_evidence: false;
    selected_material_is_accepted_state: false;
    selected_material_is_reviewed_memory: false;
    candidate_packet_is_current_packet: false;
    candidate_packet_is_execution_authority: false;
    knowledge_inheritance_is_authority_inheritance: false;
    run_a_grant_is_run_b_grant: false;
    managed_run_b_is_same_run_resume: false;
    companion_start_is_managed_start: false;
    product_surface_created: false;
    writes_database: false;
    calls_provider: false;
    calls_network: false;
    authority_granted: false;
  };
}

export function runOperationalContinuationReportV01(
  request: OperationalContinuationReportRequestV01,
): string {
  const databasePath = validateDatabasePathV01(request.database_path);
  const db = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    db.pragma("query_only = ON");
    const result = readOperationalContinuationV01(db, {
      workspace_id: request.workspace_id,
      project_id: request.project_id,
      operator_id: request.operator_id,
      frames: request.frames,
      window_kind: request.window_kind,
      paired_evaluation: request.paired_evaluation,
      decision_time_cutoff: request.decision_time_cutoff,
      max_selected_candidates: request.max_selected_candidates,
    });
    const report: OperationalContinuationReportV01 = {
      report_version: "operational_continuation_report.v0.1",
      report_kind: "bounded_local_offline_query_only_candidate_material",
      result,
      boundary: {
        selection_is_operational_policy: false,
        proposal_accept_is_activation: false,
        proposal_accept_is_semantic_transition: false,
        selected_material_is_evidence: false,
        selected_material_is_accepted_state: false,
        selected_material_is_reviewed_memory: false,
        candidate_packet_is_current_packet: false,
        candidate_packet_is_execution_authority: false,
        knowledge_inheritance_is_authority_inheritance: false,
        run_a_grant_is_run_b_grant: false,
        managed_run_b_is_same_run_resume: false,
        companion_start_is_managed_start: false,
        product_surface_created: false,
        writes_database: false,
        calls_provider: false,
        calls_network: false,
        authority_granted: false,
      },
    };
    return request.format === "markdown"
      ? formatOperationalContinuationMarkdownV01(report)
      : formatOperationalContinuationJsonV01(report);
  } finally {
    db.close();
  }
}

export function formatOperationalContinuationJsonV01(
  report: OperationalContinuationReportV01,
): string {
  return `${JSON.stringify(
    JSON.parse(canonicalizeProtocolValueV01(report)),
    null,
    2,
  )}\n`;
}

export function formatOperationalContinuationMarkdownV01(
  report: OperationalContinuationReportV01,
): string {
  const continuation = report.result.continuation;
  const selection = continuation.selection;
  return [
    "# Operational Continuation Candidate",
    "",
    `- Selection: ${selection.selection_id}`,
    `- Selection fingerprint: ${selection.integrity.fingerprint}`,
    `- Candidate Packet B: ${continuation.candidate_task_context_packet_b.packet_id}`,
    `- Candidate Packet B fingerprint: ${continuation.candidate_task_context_packet_b.integrity.fingerprint}`,
    `- Decision cutoff: ${selection.decision_time_cutoff}`,
    `- Explicit selection budget: ${selection.max_selected_candidates}`,
    `- Stop reason: ${selection.stop_reason}`,
    `- Persisted: ${continuation.persisted}`,
    `- Current packet: ${continuation.current_packet}`,
    `- Execution eligible: ${continuation.execution_eligible}`,
    "",
    "## Selected proposal-only candidates",
    "",
    ...(selection.selected_rows.length === 0
      ? ["- none"]
      : selection.selected_rows.map(
          (row) =>
            `- ${escapeMarkdownV01(row.candidate_id)} (${row.operation_domain}; decision ${row.review_decision?.decision_id ?? "unavailable"})`,
        )),
    "",
    "## Excluded candidates",
    "",
    ...(selection.excluded_rows.length === 0
      ? ["- none"]
      : selection.excluded_rows.map(
          (row) =>
            `- ${escapeMarkdownV01(row.candidate_id)}: ${row.exclusion_reason ?? "unknown"}`,
        )),
    "",
    "Canonical order is determinism only, not rank, priority, utility, superiority, policy benefit, or winner selection. This selection is not policy, Evidence, accepted state, reviewed memory, command, approval, or Transition. Candidate Packet B is pure, non-durable, not current work, and grants no attachment, Start, Resume, provider, network, GitHub, publication, or merge authority.",
    "",
  ].join("\n");
}

function parseCliV01(
  argv: string[],
  stdinText: string,
): OperationalContinuationReportRequestV01 {
  if (
    argv.length !== 4 ||
    argv[0] !== "--format" ||
    (argv[1] !== "json" && argv[1] !== "markdown") ||
    argv[2] !== "--window" ||
    ![
      "current_only",
      "recent_3",
      "recent_5",
      "since_last_transition",
    ].includes(argv[3] ?? "")
  ) {
    throw new Error("operational_continuation_arguments_invalid");
  }
  const bytes = Buffer.byteLength(stdinText, "utf8");
  if (bytes === 0 || bytes > MAX_STDIN_BYTES) {
    throw new Error("operational_continuation_stdin_invalid");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdinText);
  } catch {
    throw new Error("operational_continuation_stdin_invalid");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("operational_continuation_stdin_invalid");
  }
  const record = parsed as Record<string, unknown>;
  const allowed = new Set([
    "workspace_id",
    "project_id",
    "operator_id",
    "frames",
    "paired_evaluation",
    "decision_time_cutoff",
    "max_selected_candidates",
  ]);
  if (Object.keys(record).some((key) => !allowed.has(key))) {
    throw new Error("operational_continuation_unknown_field");
  }
  const databasePath = process.env.AUGNES_DB_PATH;
  if (!databasePath) {
    throw new Error("operational_continuation_database_unavailable");
  }
  return {
    database_path: databasePath,
    format: argv[1],
    window_kind:
      argv[3] as OperationalContinuationReadRequestV01["window_kind"],
    workspace_id: record.workspace_id as string,
    project_id: record.project_id as string,
    operator_id: record.operator_id as string,
    frames: record.frames as OperationalContinuationReadRequestV01["frames"],
    paired_evaluation:
      record.paired_evaluation as OperationalContinuationReadRequestV01["paired_evaluation"],
    decision_time_cutoff: record.decision_time_cutoff as string,
    max_selected_candidates: record.max_selected_candidates as number,
  };
}

function validateDatabasePathV01(value: string): string {
  if (typeof value !== "string" || !path.isAbsolute(value)) {
    throw new Error("operational_continuation_database_path_invalid");
  }
  return value;
}

function escapeMarkdownV01(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function publicErrorCodeV01(error: unknown): string {
  if (
    error instanceof Error &&
    /^operational_(?:context_)?continuation_[a-z0-9_:,.-]+$/u.test(
      error.message,
    )
  ) {
    return error.message;
  }
  return "operational_continuation_report_failed";
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  try {
    process.stdout.write(
      runOperationalContinuationReportV01(
        parseCliV01(
          process.argv.slice(2),
          readFileSync(0, { encoding: "utf8" }),
        ),
      ),
    );
  } catch (error) {
    process.stderr.write(`${publicErrorCodeV01(error)}\n`);
    process.exitCode = 1;
  }
}
