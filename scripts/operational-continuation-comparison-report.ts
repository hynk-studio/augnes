#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { validateOperationalContinuationComparisonV01 } from "@/lib/vnext/operational-continuation-comparison";
import type { OperationalContinuationComparisonV01 } from "@/types/vnext/operational-continuation-comparison";

export type OperationalContinuationComparisonReportFormatV01 =
  | "json"
  | "markdown";

export function renderOperationalContinuationComparisonReportV01(
  comparison: OperationalContinuationComparisonV01,
  format: OperationalContinuationComparisonReportFormatV01,
): string {
  const validation = validateOperationalContinuationComparisonV01(comparison);
  if (validation.status !== "valid") {
    throw new Error(
      `operational_continuation_comparison_report_invalid:${validation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  const report = {
    report_version: "operational_continuation_comparison_report.v0.1",
    comparison_id: comparison.comparison_id,
    comparison_fingerprint: comparison.integrity.fingerprint,
    evaluation_case_id: comparison.evaluation_case_id,
    exact_case_status: comparison.exact_case_status,
    hard_gate_non_compensation_applied:
      comparison.hard_gate_non_compensation_applied,
    candidate: {
      project_id: comparison.candidate.project_id,
      packet_a_id: comparison.candidate.packet_a.record_id,
      packet_b_id: comparison.candidate.packet_b.record_id,
      run_a_id: comparison.candidate.run_a.run_id,
      run_b_id: comparison.candidate.run_b.run_id,
      execution_status: comparison.candidate_task_outcome.execution_status,
      verification_status:
        comparison.candidate_task_outcome.verification_status,
    },
    baseline: {
      project_id: comparison.baseline.project_id,
      packet_id: comparison.baseline.packet.record_id,
      run_id: comparison.baseline.run.run_id,
      execution_status: comparison.baseline_task_outcome.execution_status,
      verification_status:
        comparison.baseline_task_outcome.verification_status,
    },
    continuation_attribution: comparison.continuation_contribution,
    review_burden: {
      candidate: comparison.candidate_review_burden,
      baseline: comparison.baseline_review_burden,
    },
    coordination_overhead: {
      candidate: comparison.candidate_coordination_overhead,
      baseline: comparison.baseline_coordination_overhead,
    },
    equal_ceiling: {
      envelope_id: comparison.equal_ceiling.envelope_id,
      complete_equal_budget_claim:
        comparison.equal_ceiling.complete_equal_budget_claim,
      equal_budget_is_equal_capability:
        comparison.equal_ceiling.equal_budget_is_equal_capability,
      rows: comparison.equal_ceiling.rows,
    },
    trade_offs: comparison.trade_offs,
    harmful_transfer: comparison.harmful_transfer,
    skipped_unobserved_dimensions:
      comparison.skipped_unobserved_dimensions,
    limitations: comparison.limitations,
    authority_summary: comparison.authority_summary,
  };
  if (format === "json") return `${JSON.stringify(report, null, 2)}\n`;
  const rows = comparison.dimension_deltas
    .map(
      (row) =>
        `| ${row.dimension} | ${row.candidate_value ?? "unobserved"} | ${row.baseline_value ?? "unobserved"} | ${row.relation} |`,
    )
    .join("\n");
  return [
    "# Operational continuation comparison",
    "",
    `- Comparison: \`${comparison.comparison_id}\``,
    `- Exact-case status: **${comparison.exact_case_status}**`,
    `- Candidate runs: \`${comparison.candidate.run_a.run_id}\`, \`${comparison.candidate.run_b.run_id}\``,
    `- Baseline run: \`${comparison.baseline.run.run_id}\``,
    `- Complete equal-budget claim: ${comparison.equal_ceiling.complete_equal_budget_claim}`,
    `- Equal budget is equal capability: ${comparison.equal_ceiling.equal_budget_is_equal_capability}`,
    "",
    "| Dimension | Candidate | Baseline | Relation |",
    "| --- | ---: | ---: | --- |",
    rows,
    "",
    "## Attribution boundary",
    "",
    `Selected/delivered/referenced: ${comparison.continuation_contribution.selected_operational_entry_count}/${comparison.continuation_contribution.exact_delivered_count}/${comparison.continuation_contribution.exact_referenced_count}. Item-level actual use, support validation, outcome association, and causal contribution remain unproven.`,
    "",
    "## Trade-offs",
    "",
    ...comparison.trade_offs.map((item) => `- ${item}`),
    "",
    "## Limitations",
    "",
    ...comparison.limitations.map((item) => `- ${item}`),
    "",
  ].join("\n");
}

function parseCliV01(argv: string[]): {
  input_path: string;
  format: OperationalContinuationComparisonReportFormatV01;
} {
  let inputPath: string | null = null;
  let format: OperationalContinuationComparisonReportFormatV01 = "json";
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--input") inputPath = argv[++index] ?? null;
    else if (value === "--format") {
      const requested = argv[++index];
      if (requested !== "json" && requested !== "markdown") {
        throw new Error("operational_continuation_comparison_report_format_invalid");
      }
      format = requested;
    } else {
      throw new Error("operational_continuation_comparison_report_argument_invalid");
    }
  }
  if (!inputPath) {
    throw new Error("operational_continuation_comparison_report_input_required");
  }
  return { input_path: inputPath, format };
}

function runCliV01(): void {
  const request = parseCliV01(process.argv.slice(2));
  const payload = JSON.parse(
    readFileSync(path.resolve(request.input_path), "utf8"),
  ) as OperationalContinuationComparisonV01;
  process.stdout.write(
    renderOperationalContinuationComparisonReportV01(payload, request.format),
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    runCliV01();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
