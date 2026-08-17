#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { buildOperationalReentryPerturbationFixtureV01 } from "@/fixtures/vnext/research/operational-reentry-perturbation-v0-1";
import { validateOperationalReentryEvaluationV01 } from "@/lib/vnext/operational-reentry-perturbation";
import type {
  OperationalReentryArmV01,
  OperationalReentryEvaluationV01,
} from "@/types/vnext/operational-reentry-perturbation";

export type OperationalReentryReportFormatV01 = "json" | "markdown";

export function renderOperationalReentryPerturbationReportV01(
  evaluation: OperationalReentryEvaluationV01,
  format: OperationalReentryReportFormatV01,
): string {
  const validation = validateOperationalReentryEvaluationV01(evaluation);
  if (validation.status !== "valid") {
    throw new Error(
      `operational_reentry_report_invalid:${validation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  if (format === "markdown") return renderMarkdownV01(evaluation);
  const exact = armV01(evaluation, "exact_reentry");
  const ablation = armV01(evaluation, "matched_single_item_ablation");
  const stale = armV01(evaluation, "stale_or_regime_shift_reset");
  const baseline = armV01(evaluation, "existing_one_run_baseline");
  const report = {
    report_version: "operational_reentry_perturbation_report.v0.1",
    evaluation_id: evaluation.evaluation_id,
    evaluation_fingerprint: evaluation.integrity.fingerprint,
    evidence_class: evaluation.evidence_class,
    deterministic_mechanics_only: evaluation.deterministic_mechanics_only,
    parent_stage5: {
      baseline_commit: evaluation.source.merged_stage5_baseline_commit,
      frozen_source_case: evaluation.source.frozen_source_case,
      comparison_source_equivalence:
        evaluation.source.parent_comparison_source_case,
      exact_case_status: evaluation.source.stage5_truth.exact_case_status,
      item_actual_use: evaluation.source.stage5_truth.item_actual_use,
      support_validation: evaluation.source.stage5_truth.support_validation,
      outcome_association: evaluation.source.stage5_truth.outcome_association,
      causal_contribution: evaluation.source.stage5_truth.causal_contribution,
      bundle_credit_assigned:
        evaluation.source.stage5_truth.bundle_credit_assigned,
    },
    target: evaluation.source.target,
    arms: evaluation.arms.map(armReportV01),
    arm_bindings: {
      exact_reentry: armRefV01(exact),
      matched_single_item_ablation: armRefV01(ablation),
      stale_or_regime_shift_reset: armRefV01(stale),
      existing_one_run_baseline: armRefV01(baseline),
    },
    parity: {
      rows: evaluation.exact_reentry_ablation_parity,
      all_required_equal: evaluation.exact_reentry_ablation_parity.every(
        (row) => row.status === "equal",
      ),
      single_target_intervention: evaluation.single_target_intervention,
      equal_budget_is_equal_capability:
        evaluation.source.repository.equal_budget_is_equal_capability,
    },
    exact_reference_relation: {
      exact_reentry_refs: exact.downstream.referenced_source_ids,
      ablation_refs: ablation.downstream.referenced_source_ids,
      target_reference_survives_ablation: false,
      reference_is_actual_use: false,
    },
    conditioning: {
      relation: evaluation.conditioning_relation,
      basis: evaluation.conditioning_basis,
      is_support_validation: false,
      is_outcome_benefit: false,
      is_causal_contribution: false,
    },
    reset: {
      relation: evaluation.reset_relation,
      basis: evaluation.reset_basis,
      stale_relation: stale.stale_relation,
      activates_reset_or_fallback: false,
      sticky_stale_is_policy_decision: false,
    },
    evidence_ladder: evaluation.evidence_ladder,
    real_provider_or_model_evidence:
      evaluation.real_provider_or_model_evidence,
    empirical_general_benefit_observed:
      evaluation.empirical_general_benefit_observed,
    limitations: evaluation.limitations,
    missing_evidence: evaluation.missing_evidence,
    material_boundary: evaluation.material_boundary,
    authority_summary: evaluation.authority_summary,
  };
  return `${JSON.stringify(report, null, 2)}\n`;
}

function renderMarkdownV01(evaluation: OperationalReentryEvaluationV01): string {
  const exact = armV01(evaluation, "exact_reentry");
  const ablation = armV01(evaluation, "matched_single_item_ablation");
  const stale = armV01(evaluation, "stale_or_regime_shift_reset");
  const parityRows = evaluation.exact_reentry_ablation_parity.map(
    (row) => `| ${row.dimension} | ${row.status} |`,
  );
  const armRows = evaluation.arms.map(
    (arm) =>
      `| ${arm.role} | ${arm.evidence_class} | ${arm.target_entry_ids.length > 0 ? "present" : "absent"} | ${arm.downstream.response_status} | ${arm.provider_calls}/${arm.model_calls}/${arm.network_calls} |`,
  );
  const falseAuthority = Object.entries(evaluation.authority_summary)
    .map(([key, value]) => `- \`${key}\`: ${value}`);
  return [
    "# Operational re-entry perturbation evaluation",
    "",
    `- Evaluation: \`${evaluation.evaluation_id}\``,
    `- Fingerprint: \`${evaluation.integrity.fingerprint}\``,
    `- Frozen Stage 5 source case: \`${evaluation.source.frozen_source_case.record_id}\``,
    `- Frozen source fingerprint: \`${evaluation.source.frozen_source_case.record_fingerprint}\``,
    `- Rebuilt comparison-source equivalence: \`${evaluation.source.parent_comparison_source_case.record_id}\``,
    `- Comparison-source fingerprint: \`${evaluation.source.parent_comparison_source_case.record_fingerprint}\``,
    `- Parent exact-case status: **${evaluation.source.stage5_truth.exact_case_status}**`,
    `- Target entry: \`${evaluation.source.target.packet_entry_id}\``,
    `- Target candidate: \`${evaluation.source.target.candidate.record_id}\``,
    `- Evidence class: \`${evaluation.evidence_class}\``,
    "",
    "This is deterministic synthetic/public-safe fixture and evaluator mechanics only. No real provider, model, network, product admission, or product-state mutation occurred.",
    "",
    "## Four arms",
    "",
    "| Arm | Evidence | Target | Response | Provider/model/network calls |",
    "| --- | --- | --- | --- | --- |",
    ...armRows,
    "",
    "The one-run baseline contains no continuation target, Packet B, continuation admission, or post-cutoff material. It is context, not the direct conditioning contrast.",
    "",
    "## Exact A ↔ B parity",
    "",
    "| Dimension | Status |",
    "| --- | --- |",
    ...parityRows,
    "",
    `- Removed entry: \`${evaluation.single_target_intervention.removed_entry_ids.join(", ")}\``,
    `- Introduced entries: ${evaluation.single_target_intervention.introduced_entry_ids.length}`,
    `- Only intended difference is target presence: ${evaluation.single_target_intervention.only_intended_difference_is_target_presence}`,
    `- Direct conditioning comparable: ${evaluation.single_target_intervention.direct_conditioning_comparable}`,
    `- Equal Budget = Equal Capability: ${evaluation.source.repository.equal_budget_is_equal_capability}`,
    "",
    "## Reference and conditioning",
    "",
    `- A references: ${exact.downstream.referenced_source_ids.map(codeV01).join(", ") || "none"}`,
    `- B references: ${ablation.downstream.referenced_source_ids.map(codeV01).join(", ") || "none"}`,
    `- Conditioning relation: **${evaluation.conditioning_relation}**`,
    `- Basis: ${evaluation.conditioning_basis}`,
    "",
    "Reference-only is not actual use. A structured downstream delta is not support validation, outcome benefit, causal contribution, target credit, or target blame.",
    "",
    "## Reset",
    "",
    `- Exact stale/regime reason: \`${stale.stale_relation?.reason_kind ?? "unavailable"}\``,
    `- Reset relation: **${evaluation.reset_relation}**`,
    `- Basis: ${evaluation.reset_basis}`,
    "",
    "A sticky-stale result is a candidate mechanics observation, not a policy decision. Reset observation creates no reset, fallback, rollback, or activation authority.",
    "",
    "## Evidence ladder",
    "",
    `- Availability: ${evaluation.evidence_ladder.availability}`,
    `- Reference: ${evaluation.evidence_ladder.reference}`,
    `- Conditioning candidate: ${evaluation.evidence_ladder.conditioning_candidate}`,
    `- Support validation: ${evaluation.evidence_ladder.support_validation}`,
    `- Outcome association: ${evaluation.evidence_ladder.outcome_association}`,
    `- Causal contribution: ${evaluation.evidence_ladder.causal_contribution}`,
    `- Reset behavior: ${evaluation.evidence_ladder.reset_behavior}`,
    "",
    "ACGC-E1 establishes neither continuation benefit nor Stage 7 fitness. Empirical matched-cohort evidence remains unobserved.",
    "",
    "## Limitations and missing evidence",
    "",
    ...evaluation.limitations.map((item) => `- ${item}`),
    ...evaluation.missing_evidence.map((item) => `- Missing: ${item}`),
    "",
    "## Authority/effect ledger",
    "",
    ...falseAuthority,
    "",
  ].join("\n");
}

function armV01(
  evaluation: OperationalReentryEvaluationV01,
  role: OperationalReentryArmV01["role"],
): OperationalReentryArmV01 {
  const arm = evaluation.arms.find((candidate) => candidate.role === role);
  if (!arm) throw new Error(`operational_reentry_report_arm_missing:${role}`);
  return arm;
}

function armRefV01(arm: OperationalReentryArmV01) {
  return {
    arm_id: arm.arm_id,
    arm_fingerprint: arm.integrity.fingerprint,
    evidence_class: arm.evidence_class,
  };
}

function armReportV01(arm: OperationalReentryArmV01) {
  return {
    role: arm.role,
    ...armRefV01(arm),
    target_entry_ids: arm.target_entry_ids,
    packet_entry_ids: arm.packet_entry_ids,
    downstream: arm.downstream,
    stale_relation: arm.stale_relation,
    provider_calls: arm.provider_calls,
    model_calls: arm.model_calls,
    network_calls: arm.network_calls,
    product_admission_used: arm.product_admission_used,
    product_state_mutated: arm.product_state_mutated,
  };
}

function codeV01(value: string): string {
  return `\`${value}\``;
}

function parseCliV01(argv: string[]): {
  format: OperationalReentryReportFormatV01;
  inputPath: string | null;
} {
  let format: OperationalReentryReportFormatV01 = "json";
  let inputPath: string | null = null;
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--format") {
      const next = argv[++index];
      if (next !== "json" && next !== "markdown") {
        throw new Error("operational_reentry_report_format_invalid");
      }
      format = next;
      continue;
    }
    if (value === "--input") {
      inputPath = argv[++index] ?? null;
      if (!inputPath) throw new Error("operational_reentry_report_input_missing");
      continue;
    }
    throw new Error(`operational_reentry_report_argument_unknown:${value}`);
  }
  return { format, inputPath };
}

function readEvaluationV01(inputPath: string | null): OperationalReentryEvaluationV01 {
  if (inputPath === null) {
    return buildOperationalReentryPerturbationFixtureV01().evaluation;
  }
  const raw = readFileSync(path.resolve(inputPath));
  if (raw.byteLength > 2 * 1024 * 1024) {
    throw new Error("operational_reentry_report_input_bound_exceeded");
  }
  return JSON.parse(raw.toString("utf8")) as OperationalReentryEvaluationV01;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    const options = parseCliV01(process.argv.slice(2));
    process.stdout.write(
      renderOperationalReentryPerturbationReportV01(
        readEvaluationV01(options.inputPath),
        options.format,
      ),
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
