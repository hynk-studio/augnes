#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  buildStrategyCompositionComparisonV01,
  canonicalizeStrategyCompositionComparisonValueV01,
  type BuildStrategyCompositionComparisonInputV01,
} from "@/lib/vnext/strategy-composition-comparison";
import type { StrategyCompositionComparisonV01 } from "@/types/vnext/strategy-composition-comparison";

const MAX_STDIN_BYTES = 1024 * 1024;
export type StrategyCompositionComparisonReportFormatV01 = "json" | "markdown";
export interface StrategyCompositionComparisonReportRequestV01 extends BuildStrategyCompositionComparisonInputV01 {
  format: StrategyCompositionComparisonReportFormatV01;
}

export function runStrategyCompositionComparisonReportV01(request: StrategyCompositionComparisonReportRequestV01): string {
  const { format, ...input } = request;
  const comparison = buildStrategyCompositionComparisonV01(input);
  return format === "markdown" ? formatStrategyCompositionComparisonMarkdownV01(comparison) : formatStrategyCompositionComparisonJsonV01(comparison);
}

export function formatStrategyCompositionComparisonJsonV01(comparison: StrategyCompositionComparisonV01): string {
  return `${JSON.stringify(JSON.parse(canonicalizeStrategyCompositionComparisonValueV01(comparison)), null, 2)}\n`;
}

export function formatStrategyCompositionComparisonMarkdownV01(comparison: StrategyCompositionComparisonV01): string {
  const lines = [
    "# Strategy composition comparison",
    "",
    `- Comparison: ${comparison.comparison_id}`,
    `- Fingerprint: ${comparison.integrity.fingerprint}`,
    `- Evaluation case: ${comparison.evaluation_binding.evaluation_case.evaluation_case_id}`,
    `- Holdout case: ${comparison.evaluation_binding.holdout_case.case_id}`,
    `- Frozen cutoff: ${comparison.evaluation_binding.frozen_cutoff}`,
    `- Observation cutoff: ${comparison.evaluation_binding.observation_cutoff}`,
    `- Equal budget: ${comparison.equal_budget.budget_id}`,
    `- Budget ceilings: provider calls ${comparison.equal_budget.provider_call_limit}; tool calls ${comparison.equal_budget.tool_call_limit}; steps ${comparison.equal_budget.step_limit}; tokens ${comparison.equal_budget.token_limit}; cost microunits ${comparison.equal_budget.cost_limit_microunits}; latency ms ${comparison.equal_budget.latency_limit_ms}`,
    "- Step-budget compliance: unobserved in v0.1 because the exact outcome vector has no step-count observation.",
    "",
    "## Four variants",
    "",
    "| Variant | Role | Case | Components | Bindings | Relations |",
    "| --- | --- | --- | ---: | ---: | ---: |",
    ...comparison.variant_summaries.map((item) => `| ${item.variant_kind} | ${item.case_role} | ${item.case_ref.case_id} | ${item.component_count} | ${item.role_binding_count} | ${item.relation_count} |`),
    "",
    "The monolithic case is the exact baseline bound by all three development cases. Task family and construction cutoff match across all four variants. Component content and sources remain intentionally independent for the monolithic representation, while they are exact across unbound, bound, and ordered; only binding/order structure changes there.",
    "Source-case parity is validated at the builder boundary with exact Stage 3B1 cases; serialized validation proves projection-internal consistency only.",
    "",
    "## Observed outcome vectors",
    "",
    "| Variant | Required passed | Failed | Hard gate | Corrections | Interventions | Tool calls | Latency ms | Budget compliance | Completeness |",
    "| --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | --- | --- |",
    ...comparison.outcome_observations.map((item) => `| ${item.subject_kind} | ${shown(item.outcome.verification.required_passed)} | ${shown(item.outcome.verification.failed)} | ${shown(item.outcome.verification.hard_gate_failure)} | ${shown(item.outcome.review_burden.correction_count)} | ${shown(item.outcome.review_burden.intervention_count)} | ${shown(item.outcome.cost_operability.tool_call_count)} | ${shown(item.outcome.cost_operability.latency_ms)} | observed dimensions within ceiling; steps unobserved | ${item.completeness} |`),
    "",
    "## Pairwise dimension results",
    "",
    ...comparison.pairwise_comparisons.flatMap((pair) => [
      `### ${pair.left_variant} to ${pair.right_variant}`,
      "",
      `- Summary: ${pair.summary_relation}`,
      `- Hard-gate non-compensation applied: ${pair.hard_gate_non_compensation_applied}`,
      ...pair.dimension_deltas.map((delta) => `- ${delta.dimension}: ${delta.relation} (${shown(delta.left_value)} vs ${shown(delta.right_value)}; delta ${shown(delta.exact_delta)})`),
      "",
    ]),
    "## Non-dominance and trade-offs",
    "",
    `- Status: ${comparison.non_dominance.status}`,
    `- Non-dominated variants: ${comparison.non_dominance.non_dominated_variants.join(", ") || "none reported"}`,
    `- Trade-offs: ${comparison.non_dominance.tradeoff_pairs.join(", ") || "none reported"}`,
    `- Unknown dimensions: ${comparison.non_dominance.unknown_dimensions.join(", ") || "none"}`,
    "- No ordinal ranking, winner, acceptance, or promotion is created.",
    "",
    "## Ablation association",
    "",
    ...(comparison.ablation_association ? [
      `- Parent: ${comparison.ablation_association.parent_case_ref.case_id}`,
      `- Ablation: ${comparison.ablation_association.ablation_case_ref.case_id}`,
      `- Target: ${JSON.stringify(comparison.ablation_association.target)}`,
      "- Meaning: bounded intervention-associated difference; no causal contribution is claimed.",
    ] : ["- Not supplied."]),
    "",
    "## Negative transfer",
    "",
    ...(comparison.negative_transfer ? [
      `- Origin task family: ${comparison.negative_transfer.origin_task_family_key}`,
      `- Target task family: ${comparison.negative_transfer.target_task_family_key}`,
      `- Signal: ${comparison.negative_transfer.signal}`,
      "- Meaning: local adverse association only; no general harm, blacklist, promotion, or demotion.",
    ] : ["- Not supplied."]),
    "",
    "## Completeness and authority boundary",
    "",
    `- Completeness: ${comparison.completeness.status}`,
    `- Missing dimensions: ${comparison.completeness.missing_dimensions.join(", ") || "none"}`,
    `- Stochastic aggregation: ${comparison.completeness.stochastic_aggregation}`,
    "- Case variant is not accepted strategy; outcome observation is not evaluation truth; observed advantage is not verified general benefit.",
    "- Pairwise better is not a global winner; Pareto non-dominated is not product promotion; equal budget is not equal capability.",
    "- Holdout result is not strategy acceptance; ablation association is not general causal contribution; a negative-transfer signal is not general harm.",
    "- The report creates no Core state, Evidence, accepted strategy, execution, policy, decision, Transition, provider/network action, publication, or merge authority.",
    "",
  ];
  return lines.join("\n");
}

function parseCliV01(argv: string[], stdinText: string): StrategyCompositionComparisonReportRequestV01 {
  if (argv.length !== 2 || argv[0] !== "--format" || (argv[1] !== "json" && argv[1] !== "markdown")) throw new Error("strategy_comparison_report_arguments_invalid");
  const bytes = Buffer.byteLength(stdinText, "utf8");
  if (bytes === 0 || bytes > MAX_STDIN_BYTES) throw new Error("strategy_comparison_report_stdin_invalid");
  let parsed: unknown;
  try { parsed = JSON.parse(stdinText); } catch { throw new Error("strategy_comparison_report_stdin_invalid"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("strategy_comparison_report_stdin_invalid");
  return { ...(parsed as BuildStrategyCompositionComparisonInputV01), format: argv[1] };
}

function shown(value: unknown): string { return value === null ? "unknown" : String(value).replaceAll("|", "\\|").replaceAll("\n", " "); }
function publicErrorV01(error: unknown): string {
  if (error instanceof Error && /^strategy_(?:comparison|composition)_[a-z0-9_:.-]+$/u.test(error.message)) return error.message;
  return "strategy_comparison_report_failed";
}

const isMain = process.argv[1] !== undefined && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  try { process.stdout.write(runStrategyCompositionComparisonReportV01(parseCliV01(process.argv.slice(2), readFileSync(0, "utf8")))); }
  catch (error) { process.stderr.write(`${publicErrorV01(error)}\n`); process.exitCode = 1; }
}
