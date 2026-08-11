#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import Database from "better-sqlite3";

import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import {
  readContinuityDynamicsV01,
  type ContinuityDynamicsReadRequestV01,
  type ContinuityDynamicsReadResultV01,
} from "@/lib/vnext/runtime/continuity-dynamics-read-model";

const MAX_STDIN_BYTES = 1024 * 1024;

export type ContinuityDynamicsReportFormatV01 = "json" | "markdown";

export interface ContinuityDynamicsReportRequestV01
  extends ContinuityDynamicsReadRequestV01 {
  database_path: string;
  format: ContinuityDynamicsReportFormatV01;
}

export interface ContinuityDynamicsReportV01 {
  report_version: "continuity_dynamics_report.v0.1";
  report_kind: "bounded_local_offline_read_only_observation";
  result: ContinuityDynamicsReadResultV01;
  boundary: {
    source_record_is_frame: false;
    frame_is_semantic_state: false;
    frame_is_evaluation_truth: false;
    dimension_direction_is_global_health: false;
    temporal_correlation_is_causal_contribution: false;
    regime_shift_is_improvement: false;
    digest_is_policy: false;
    digest_is_decision: false;
    digest_is_transition: false;
    product_surface_created: false;
    writes_database: false;
    provider_calls: false;
    network_calls: false;
    authority_granted: false;
  };
}

export function runContinuityDynamicsReportV01(
  request: ContinuityDynamicsReportRequestV01,
): string {
  const databasePath = validateDatabasePathV01(request.database_path);
  const db = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    db.pragma("query_only = ON");
    const result = readContinuityDynamicsV01(db, {
      workspace_id: request.workspace_id,
      project_id: request.project_id,
      frames: request.frames,
      window_kind: request.window_kind,
    });
    const report: ContinuityDynamicsReportV01 = {
      report_version: "continuity_dynamics_report.v0.1",
      report_kind: "bounded_local_offline_read_only_observation",
      result,
      boundary: {
        source_record_is_frame: false,
        frame_is_semantic_state: false,
        frame_is_evaluation_truth: false,
        dimension_direction_is_global_health: false,
        temporal_correlation_is_causal_contribution: false,
        regime_shift_is_improvement: false,
        digest_is_policy: false,
        digest_is_decision: false,
        digest_is_transition: false,
        product_surface_created: false,
        writes_database: false,
        provider_calls: false,
        network_calls: false,
        authority_granted: false,
      },
    };
    return request.format === "markdown"
      ? formatContinuityDynamicsMarkdownV01(report)
      : formatContinuityDynamicsJsonV01(report);
  } finally {
    db.close();
  }
}

export function formatContinuityDynamicsJsonV01(
  report: ContinuityDynamicsReportV01,
): string {
  return `${JSON.stringify(
    JSON.parse(canonicalizeProtocolValueV01(report)),
    null,
    2,
  )}\n`;
}

export function formatContinuityDynamicsMarkdownV01(
  report: ContinuityDynamicsReportV01,
): string {
  const digest = report.result.digest;
  const current = report.result.frames.at(-1)!;
  const dimensions = Object.values(digest.dynamics);
  const lines = [
    "# Continuity Dynamics Observer",
    "",
    `- Current frame: ${current.frame_id}`,
    `- Current frame fingerprint: ${current.integrity.fingerprint}`,
    `- Boundary: ${current.boundary.kind} at ${current.boundary.boundary_timestamp}`,
    `- Source completeness: ${current.source_completeness.status}`,
    `- Digest: ${digest.digest_id}`,
    `- Digest fingerprint: ${digest.integrity.fingerprint}`,
    `- Window: ${digest.window.kind} (${digest.window.selected_frame_count}/${digest.window.max_frames})`,
    `- Window truncated: ${digest.window.truncated_to_bound}`,
    `- Since-transition status: ${digest.window.since_last_transition}`,
    "",
    "## Dimension dynamics",
    "",
    "| Dimension | Status | Rule | Completeness |",
    "| --- | --- | --- | --- |",
    ...dimensions.map(
      (dimension) =>
        `| ${dimension.dimension} | ${dimension.status} | ${dimension.comparison_rule} | ${dimension.completeness.status} |`,
    ),
    "",
    "## Missingness and limitations",
    "",
    ...(digest.warnings.length > 0
      ? digest.warnings.map((warning) => `- ${escapeMarkdownV01(warning)}`)
      : ["- none"]),
    "",
    "Source Record is not Frame. Frame is not Semantic State or Evaluation Truth. Dimension direction is not global health. Regime shift is not improvement. The digest grants no selection, policy, decision, Transition, execution, provider, network, publication, GitHub, or merge authority.",
    "",
  ];
  return lines.join("\n");
}

function parseCliV01(
  argv: string[],
  stdinText: string,
): ContinuityDynamicsReportRequestV01 {
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
    throw new Error("continuity_dynamics_arguments_invalid");
  }
  const bytes = Buffer.byteLength(stdinText, "utf8");
  if (bytes === 0 || bytes > MAX_STDIN_BYTES) {
    throw new Error("continuity_dynamics_stdin_invalid");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdinText);
  } catch {
    throw new Error("continuity_dynamics_stdin_invalid");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("continuity_dynamics_stdin_invalid");
  }
  const record = parsed as Record<string, unknown>;
  const allowed = new Set(["workspace_id", "project_id", "frames"]);
  if (Object.keys(record).some((key) => !allowed.has(key))) {
    throw new Error("continuity_dynamics_unknown_field");
  }
  const databasePath = process.env.AUGNES_DB_PATH;
  if (!databasePath) {
    throw new Error("continuity_dynamics_database_unavailable");
  }
  return {
    database_path: databasePath,
    format: argv[1],
    window_kind: argv[3] as ContinuityDynamicsReadRequestV01["window_kind"],
    workspace_id: record.workspace_id as string,
    project_id: record.project_id as string,
    frames: record.frames as ContinuityDynamicsReadRequestV01["frames"],
  };
}

function validateDatabasePathV01(value: string): string {
  if (typeof value !== "string" || !path.isAbsolute(value)) {
    throw new Error("continuity_dynamics_database_path_invalid");
  }
  return value;
}

function escapeMarkdownV01(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function publicErrorCodeV01(error: unknown): string {
  if (
    error instanceof Error &&
    /^continuity_dynamics_[a-z0-9_:,-]+$/u.test(error.message)
  ) {
    return error.message;
  }
  return "continuity_dynamics_report_failed";
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  try {
    process.stdout.write(
      runContinuityDynamicsReportV01(
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
