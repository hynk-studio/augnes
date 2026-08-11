#!/usr/bin/env node

import { accessSync, constants } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import Database from "better-sqlite3";

import {
  readContextUseAttributionProjectionV01,
  type ContextUseAttributionReadRequestV01,
} from "@/lib/vnext/runtime/context-use-attribution-read-model";
import {
  canonicalizeContextUseAttributionValueV01,
} from "@/lib/vnext/context-use-attribution-projection";
import type { ContextUseAttributionProjectionV01 } from "@/types/vnext/context-use-attribution-projection";

export type ContextUseAttributionReportFormatV01 = "json" | "markdown";

export interface ContextUseAttributionReportRequestV01
  extends ContextUseAttributionReadRequestV01 {
  database_path: string;
  format: ContextUseAttributionReportFormatV01;
}

export function runContextUseAttributionReportV01(
  request: ContextUseAttributionReportRequestV01,
): string {
  const databasePath = validateDatabasePathV01(request.database_path);
  const db = new Database(databasePath, {
    readonly: true,
    fileMustExist: true,
  });
  try {
    db.pragma("query_only = ON");
    const projection = readContextUseAttributionProjectionV01(db, {
      workspace_id: request.workspace_id,
      project_id: request.project_id,
      review_id: request.review_id,
      review_fingerprint: request.review_fingerprint,
    });
    return request.format === "markdown"
      ? formatContextUseAttributionMarkdownV01(projection)
      : formatContextUseAttributionJsonV01(projection);
  } finally {
    db.close();
  }
}

export function formatContextUseAttributionJsonV01(
  projection: ContextUseAttributionProjectionV01,
): string {
  return `${JSON.stringify(
    JSON.parse(canonicalizeContextUseAttributionValueV01(projection)),
    null,
    2,
  )}\n`;
}

export function formatContextUseAttributionMarkdownV01(
  projection: ContextUseAttributionProjectionV01,
): string {
  const lines = [
    "# Context-use attribution projection",
    "",
    `- Projection: ${projection.projection_id}`,
    `- Fingerprint: ${projection.integrity.fingerprint}`,
    `- Review: ${projection.context_use_review.review_id}`,
    `- Later receipt: ${projection.later_task_run_receipt.receipt_id}`,
    `- Later packet: ${projection.later_task_context_packet.packet_id}`,
    `- Completeness: ${projection.completeness.status}`,
    `- Missing lanes: ${projection.completeness.missing_lanes.join(", ")}`,
    `- Historical usage provenance missing: ${projection.completeness.historical_usage_provenance_missing}`,
    "",
    "| Entry | Kind | Presented | Actual use | Referenced | Support | Outcome | Causal |",
    "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ...projection.rows.map(
      (row) =>
        `| ${escapeMarkdownV01(row.entry_id)} | ${row.entry_kind} | ${row.presentation.status} | ${row.actual_use.status} | ${row.citation_or_reference.status} | ${row.support_validation.status} | ${row.outcome_association.status} | ${row.causal_contribution.status} |`,
    ),
    "",
    "Packet-level review values are episode context only. They do not assign item-level credit, blame, use, support, outcome, or causal contribution.",
    "",
  ];
  return lines.join("\n");
}

function validateDatabasePathV01(value: string): string {
  if (typeof value !== "string" || !path.isAbsolute(value)) {
    throw new Error("context_use_attribution_database_path_invalid");
  }
  try {
    accessSync(value, constants.R_OK);
  } catch {
    throw new Error("context_use_attribution_database_unavailable");
  }
  return value;
}

function parseCliV01(argv: string[]): ContextUseAttributionReportRequestV01 {
  const allowed = new Set([
    "--workspace-id",
    "--project-id",
    "--review-id",
    "--review-fingerprint",
    "--format",
  ]);
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key || !allowed.has(key) || !value || value.startsWith("--")) {
      throw new Error("context_use_attribution_arguments_invalid");
    }
    if (values.has(key)) {
      throw new Error("context_use_attribution_argument_duplicate");
    }
    values.set(key, value);
  }
  const databasePath = process.env.AUGNES_DB_PATH;
  const format = values.get("--format") ?? "json";
  const workspaceId = values.get("--workspace-id");
  const projectId = values.get("--project-id");
  const reviewId = values.get("--review-id");
  const reviewFingerprint = values.get("--review-fingerprint");
  if (
    !databasePath ||
    !workspaceId ||
    !projectId ||
    !reviewId ||
    !reviewFingerprint ||
    (format !== "json" && format !== "markdown")
  ) {
    throw new Error("context_use_attribution_arguments_invalid");
  }
  return {
    database_path: databasePath,
    workspace_id: workspaceId,
    project_id: projectId,
    review_id: reviewId,
    review_fingerprint: reviewFingerprint,
    format,
  };
}

function escapeMarkdownV01(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function publicErrorCodeV01(error: unknown): string {
  if (
    error instanceof Error &&
    /^context_use_attribution_[a-z0-9_:,-]+$/u.test(error.message)
  ) {
    return error.message;
  }
  return "context_use_attribution_report_failed";
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  try {
    process.stdout.write(
      runContextUseAttributionReportV01(parseCliV01(process.argv.slice(2))),
    );
  } catch (error) {
    process.stderr.write(`${publicErrorCodeV01(error)}\n`);
    process.exitCode = 1;
  }
}
