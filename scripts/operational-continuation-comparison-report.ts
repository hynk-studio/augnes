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
  const interpretation = deriveBoundedInterpretationV01(comparison);
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
      candidate_complete_path: comparison.candidate_review_burden,
      candidate_post_continuation:
        comparison.candidate_post_continuation_review_burden,
      baseline: comparison.baseline_review_burden,
    },
    coordination_overhead: {
      candidate: comparison.candidate_coordination_overhead,
      baseline: comparison.baseline_coordination_overhead,
    },
    cost_operability: {
      candidate: comparison.candidate_cost_operability,
      baseline: comparison.baseline_cost_operability,
    },
    equal_ceiling: {
      envelope_id: comparison.equal_ceiling.envelope_id,
      complete_equal_budget_claim:
        comparison.equal_ceiling.complete_equal_budget_claim,
      equal_budget_is_equal_capability:
        comparison.equal_ceiling.equal_budget_is_equal_capability,
      rows: comparison.equal_ceiling.rows,
    },
    dimension_deltas: comparison.dimension_deltas,
    interpretation,
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
    `- Candidate latency provenance: ${comparison.candidate_cost_operability.latency_provenance}`,
    `- Baseline latency provenance: ${comparison.baseline_cost_operability.latency_provenance}`,
    "",
    "## Bounded interpretation",
    "",
    interpretation,
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

function deriveBoundedInterpretationV01(
  comparison: OperationalContinuationComparisonV01,
): string {
  if (comparison.hard_gate_non_compensation_applied) {
    return "The exact-case status is decided only by the non-compensating hard-gate difference; other unknown dimensions do not offset it.";
  }
  const candidateBetter = comparison.dimension_deltas.filter(
    (row) => row.relation === "candidate_better",
  );
  const baselineBetterCoordination = comparison.dimension_deltas.filter(
    (row) =>
      row.relation === "baseline_better" &&
      row.dimension.startsWith("coordination."),
  );
  const baselineBetterReviewBurden = comparison.dimension_deltas.filter(
    (row) =>
      row.relation === "baseline_better" &&
      row.dimension.startsWith("review."),
  );
  if (
    comparison.exact_case_status === "inconclusive" &&
    comparison.equal_ceiling.complete_equal_budget_claim === false &&
    candidateBetter.length === 0 &&
    baselineBetterCoordination.length > 0
  ) {
    return `The exact case did not demonstrate a continuation benefit. The continuation path incurred greater observed structural coordination overhead${
      baselineBetterReviewBurden.length > 0
        ? " and greater complete-path review burden"
        : ""
    }, while material cost, usage, human-intervention, or performance-latency dimensions remained unobserved. The bounded overall comparison is therefore inconclusive rather than refuted. Pre-continuation Review A burden is not post-continuation harmful-transfer evidence.`;
  }
  if (comparison.exact_case_status === "inconclusive") {
    return "Material comparison dimensions remain incomplete, unknown, or not comparable, so observed directional deltas do not establish an overall supported, mixed, or refuted verdict.";
  }
  return "The directional exact-case status is bounded to the materially complete comparable dimensions and creates no general benefit, harm, rank, winner, or policy conclusion.";
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
