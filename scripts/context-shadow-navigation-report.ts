#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  buildPersonalPerspectivePairedEvaluationV01,
  buildPersonalPerspectiveShadowProjectionV01,
  type BuildPersonalPerspectiveShadowProjectionInputV01,
} from "@/lib/vnext/context-shadow-navigation";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import type { ContextUseAttributionProjectionV01 } from "@/types/vnext/context-use-attribution-projection";
import type {
  PersonalPerspectivePairedEvaluationV01,
  PersonalPerspectiveShadowProjectionV01,
} from "@/types/vnext/context-shadow-navigation";

const MAX_STDIN_BYTES = 512 * 1024;

export type ContextShadowNavigationReportFormatV01 = "json" | "markdown";

export interface ContextShadowNavigationReportRequestV01
  extends BuildPersonalPerspectiveShadowProjectionInputV01 {
  later_context_use_attribution?: ContextUseAttributionProjectionV01 | null;
  format: ContextShadowNavigationReportFormatV01;
}

export interface ContextShadowNavigationReportV01 {
  report_version: "context_shadow_navigation_report.v0.1";
  report_kind: "bounded_local_read_only_research_report";
  pre_outcome_shadow: PersonalPerspectiveShadowProjectionV01;
  later_paired_evaluation: PersonalPerspectivePairedEvaluationV01 | null;
  boundary: {
    product_selector_unchanged: true;
    task_context_packet_unchanged: true;
    later_evidence_used_for_selection: false;
    product_surface_created: false;
    writes_database: false;
    provider_calls: false;
    network_calls: false;
    authority_granted: false;
  };
}

export function runContextShadowNavigationReportV01(
  request: ContextShadowNavigationReportRequestV01,
): string {
  const preOutcome = buildPersonalPerspectiveShadowProjectionV01({
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    scope: request.scope,
    candidates: request.candidates,
    baseline_task_context_packet: request.baseline_task_context_packet,
    max_shadow_selected: request.max_shadow_selected,
  });
  const paired = request.later_context_use_attribution
    ? buildPersonalPerspectivePairedEvaluationV01(
        preOutcome,
        request.later_context_use_attribution,
      )
    : null;
  const report: ContextShadowNavigationReportV01 = {
    report_version: "context_shadow_navigation_report.v0.1",
    report_kind: "bounded_local_read_only_research_report",
    pre_outcome_shadow: preOutcome,
    later_paired_evaluation: paired,
    boundary: {
      product_selector_unchanged: true,
      task_context_packet_unchanged: true,
      later_evidence_used_for_selection: false,
      product_surface_created: false,
      writes_database: false,
      provider_calls: false,
      network_calls: false,
      authority_granted: false,
    },
  };
  return request.format === "markdown"
    ? formatContextShadowNavigationMarkdownV01(report)
    : formatContextShadowNavigationJsonV01(report);
}

export function formatContextShadowNavigationJsonV01(
  report: ContextShadowNavigationReportV01,
): string {
  return `${JSON.stringify(
    JSON.parse(canonicalizeProtocolValueV01(report)),
    null,
    2,
  )}\n`;
}

export function formatContextShadowNavigationMarkdownV01(
  report: ContextShadowNavigationReportV01,
): string {
  const pre = report.pre_outcome_shadow;
  const paired = report.later_paired_evaluation;
  const lines = [
    "# Personal Perspective shadow-navigation report",
    "",
    "## Pre-outcome shadow",
    "",
    `- Projection: ${pre.projection_id}`,
    `- Fingerprint: ${pre.integrity.fingerprint}`,
    `- Candidate-set fingerprint: ${pre.candidate_snapshot.candidate_set_fingerprint}`,
    `- Baseline selected: ${pre.baseline.selection.selected_context.length}`,
    `- Shadow selected: ${pre.shadow.selected.length}`,
    `- Overlap: ${pre.comparison.overlap.length}`,
    `- Baseline only: ${pre.comparison.baseline_only.length}`,
    `- Shadow only: ${pre.comparison.shadow_only.length}`,
    `- Budget: ${pre.shadow.budget.selected_count}/${pre.shadow.max_shadow_selected}`,
    `- Stop reason: ${pre.shadow.stop_reason}`,
    `- Completeness: ${pre.candidate_snapshot.source_completeness.status}`,
    "",
    "The current selector and admitted TaskContextPacket remain product truth. The shadow result is a strict research-only subset.",
    "",
    "## Later paired evaluation",
    "",
    ...(paired
      ? [
          `- Evaluation: ${paired.evaluation_id}`,
          `- Fingerprint: ${paired.integrity.fingerprint}`,
          `- Attribution projection: ${paired.later_context_use_attribution.projection_id}`,
          `- Critical omission candidates: ${paired.summary.critical_omission_candidate_count}`,
          `- Missing attribution lanes: ${paired.summary.attribution_missing_lanes.join(", ")}`,
          "",
          "| Entry | Lane | Presented | Referenced | Support | Outcome | Causal | Omission candidate |",
          "| --- | --- | --- | --- | --- | --- | --- | --- |",
          ...paired.rows.map(
            (row) =>
              `| ${escapeMarkdownV01(row.entry_id)} | ${row.comparison_lane} | ${row.attribution.presentation.status} | ${row.attribution.citation_or_reference.status} | ${row.attribution.support_validation.status} | ${row.attribution.outcome_association.status} | ${row.attribution.causal_contribution.status} | ${row.critical_omission_candidate} |`,
          ),
        ]
      : [
          "- Status: not supplied",
          "- Missing: exact later ACGC1 attribution projection",
        ]),
    "",
    "Later evidence evaluates only the frozen pair. Reference is not support, outcome, or causal contribution, and paired evaluation grants no promotion or activation authority.",
    "",
  ];
  return lines.join("\n");
}

function parseCliV01(
  argv: string[],
  stdinText: string,
): ContextShadowNavigationReportRequestV01 {
  if (
    argv.length !== 2 ||
    argv[0] !== "--format" ||
    (argv[1] !== "json" && argv[1] !== "markdown")
  ) {
    throw new Error("context_shadow_navigation_arguments_invalid");
  }
  if (
    Buffer.byteLength(stdinText, "utf8") === 0 ||
    Buffer.byteLength(stdinText, "utf8") > MAX_STDIN_BYTES
  ) {
    throw new Error("context_shadow_navigation_stdin_invalid");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(stdinText);
  } catch {
    throw new Error("context_shadow_navigation_stdin_invalid");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("context_shadow_navigation_stdin_invalid");
  }
  const record = parsed as Record<string, unknown>;
  const allowed = new Set([
    "workspace_id",
    "project_id",
    "scope",
    "candidates",
    "baseline_task_context_packet",
    "max_shadow_selected",
    "later_context_use_attribution",
  ]);
  if (Object.keys(record).some((key) => !allowed.has(key))) {
    throw new Error("context_shadow_navigation_unknown_field");
  }
  return {
    ...(record as unknown as Omit<
      ContextShadowNavigationReportRequestV01,
      "format"
    >),
    format: argv[1],
  };
}

function escapeMarkdownV01(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

function publicErrorCodeV01(error: unknown): string {
  if (
    error instanceof Error &&
    /^context_shadow_navigation_[a-z0-9_:,-]+$/u.test(error.message)
  ) {
    return error.message;
  }
  return "context_shadow_navigation_report_failed";
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isMain) {
  try {
    process.stdout.write(
      runContextShadowNavigationReportV01(
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
