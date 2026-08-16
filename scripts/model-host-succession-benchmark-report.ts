#!/usr/bin/env node

import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { validateModelHostSuccessionBenchmarkV01 } from "@/lib/vnext/model-host-succession-benchmark";
import type {
  ModelHostSuccessionBenchmarkV01,
  ModelHostSuccessionRouteProfileV01,
} from "@/types/vnext/model-host-succession-benchmark";

export type ModelHostSuccessionBenchmarkReportFormatV01 = "json" | "markdown";

export function renderModelHostSuccessionBenchmarkReportV01(
  benchmark: ModelHostSuccessionBenchmarkV01,
  format: ModelHostSuccessionBenchmarkReportFormatV01,
): string {
  const validation = validateModelHostSuccessionBenchmarkV01(benchmark);
  if (validation.status !== "valid") {
    throw new Error(
      `model_host_succession_benchmark_report_invalid:${validation.errors
        .map((issue) => issue.code)
        .join(",")}`,
    );
  }
  const report = {
    report_version: "model_host_succession_benchmark_report.v0.1",
    benchmark_id: benchmark.benchmark_id,
    benchmark_fingerprint: benchmark.integrity.fingerprint,
    summary: benchmark.summary,
    frozen_case: {
      frozen_case_id: benchmark.frozen_case.frozen_case_id,
      frozen_case_fingerprint: benchmark.frozen_case.integrity.fingerprint,
      merged_stage5_baseline_commit:
        benchmark.frozen_case.merged_stage5_baseline_commit,
      merged_stage5_comparison_binding:
        benchmark.frozen_case.merged_stage5_comparison_binding,
      repository_state: benchmark.frozen_case.repository_state,
      packet_a_id: benchmark.frozen_case.packet_a.packet_id,
      packet_b_id: benchmark.frozen_case.packet_b.packet_id,
      packet_b_canonical_bytes_fingerprint:
        benchmark.frozen_case.packet_b_canonical_bytes_fingerprint,
      selection_id:
        benchmark.frozen_case.operational_context_selection.selection_id,
      materialization_id:
        benchmark.frozen_case.acgc5a_materialization_identity.materialization_id,
      admission_id: benchmark.frozen_case.continuation_admission.admission_id,
      selected_candidate_id:
        benchmark.frozen_case.selected_operational_entry.candidate_id,
      task: benchmark.frozen_case.task,
      constraints: benchmark.frozen_case.constraints,
      stage5_truth: benchmark.frozen_case.stage5_truth,
    },
    route_profiles: benchmark.route_profiles.map(routeReportV01),
    arm_results: benchmark.arm_results,
    fallback_plan: benchmark.fallback_plan,
    fallback_relation: benchmark.fallback_relation,
    pairwise_route_deltas: benchmark.pairwise_route_deltas,
    trade_offs: benchmark.trade_offs,
    resource_observation_provenance:
      benchmark.resource_observation_provenance,
    missing_evidence: benchmark.missing_evidence,
    limitations: benchmark.limitations,
    adr_owner_gap_observations: benchmark.adr_owner_gap_observations,
    material_boundary: benchmark.material_boundary,
    authority_summary: benchmark.authority_summary,
  };
  if (format === "json") return `${JSON.stringify(report, null, 2)}\n`;
  return renderMarkdownV01(benchmark);
}

function routeReportV01(profile: ModelHostSuccessionRouteProfileV01) {
  return {
    route_profile_id: profile.route_profile_id,
    route_profile_fingerprint: profile.integrity.fingerprint,
    route_role: profile.route_role,
    evidence_class: profile.evidence_class,
    provider_id: profile.provider_ref?.external_id ?? null,
    model_id: profile.model_ref?.external_id ?? null,
    host_id: profile.host_ref.external_id,
    adapter_implementation_id: profile.adapter_implementation_id,
    adapter_implementation_version: profile.adapter_implementation_version,
    native_host_adapter_version: profile.native_host_adapter_version,
    capability_version: profile.capability_version,
    execution_profile: profile.execution_profile,
    provider_egress_policy: profile.provider_egress_policy,
    supported_operation_classes: profile.supported_operation_classes,
    unsupported_operation_classes: profile.unsupported_operation_classes,
    predecessor_route_ref: profile.predecessor_route_ref,
    fallback_target_ref: profile.fallback_target_ref,
    authority: profile.authority,
  };
}

function renderMarkdownV01(
  benchmark: ModelHostSuccessionBenchmarkV01,
): string {
  const routeRows = benchmark.route_profiles.map((profile) =>
    `| ${profile.route_role} | ${profile.evidence_class} | ${profile.provider_ref?.external_id ?? "unused"} | ${profile.model_ref?.external_id ?? "unused"} | ${profile.host_ref.external_id} | ${profile.capability_version} |`,
  );
  const armRows = benchmark.arm_results.map((arm) =>
    `| ${arm.route_profile_ref.route_role} | ${arm.contract_status} | ${arm.execution_status} | ${arm.verification_status} | ${arm.required_checks.passed.length}/${arm.required_checks.failed.length}/${arm.required_checks.blocked.length}/${arm.required_checks.skipped.length}/${arm.required_checks.unknown.length} | ${arm.continuation_trace.selected_entry_count}/${arm.continuation_trace.selected_entry_delivered_count}/${arm.continuation_trace.selected_entry_exact_receipt_referenced_count} | ${arm.fallback_required}/${arm.fallback_used} |`,
  );
  const deltaRows = benchmark.pairwise_route_deltas.map((row) =>
    `| ${row.left_route_role} | ${row.right_route_role} | ${row.dimension} | ${row.relation} | ${formatDeltaValueV01(row.left_value)} | ${formatDeltaValueV01(row.right_value)} |`,
  );
  const constrained = benchmark.arm_results.find(
    (arm) =>
      arm.route_profile_ref.route_role ===
      "capability_constrained_simulation",
  )!;
  const zero = benchmark.arm_results.find(
    (arm) => arm.route_profile_ref.route_role === "zero_model_fallback",
  )!;
  const replay = benchmark.arm_results.find(
    (arm) => arm.route_profile_ref.route_role === "predecessor_route_replay",
  )!;
  return [
    "# Model and host succession benchmark",
    "",
    `- Benchmark: \`${benchmark.benchmark_id}\``,
    `- Fingerprint: \`${benchmark.integrity.fingerprint}\``,
    `- Overall summary: **${benchmark.summary}**`,
    `- Frozen Stage 5 baseline: \`${benchmark.frozen_case.merged_stage5_baseline_commit}\``,
    `- Frozen repository HEAD: \`${benchmark.frozen_case.repository_state.frozen_head_commit}\``,
    `- Frozen worktree fingerprint: \`${benchmark.frozen_case.repository_state.frozen_worktree_content_fingerprint}\``,
    `- Packet B: \`${benchmark.frozen_case.packet_b.packet_id}\``,
    `- Packet B canonical bytes: \`${benchmark.frozen_case.packet_b_canonical_bytes_fingerprint}\``,
    "",
    "The merged Stage 5 result remains inconclusive. Its continuation mechanism delivered and referenced one exact selected operational entry, but item use, support, outcome association, causality, usage, cost, required human intervention, and genuine performance latency remained unknown or unobserved. Structural coordination and complete-path review burden favored the one-run baseline without establishing general benefit, general failure, harmful Packet B transfer, or policy fitness.",
    "",
    "## Route profiles",
    "",
    "| Role | Evidence class | Provider | Model | Host | Capability |",
    "| --- | --- | --- | --- | --- | --- |",
    ...routeRows,
    "",
    "All provider/model identities above are either unused or explicitly synthetic. No row represents live-provider execution.",
    "",
    "## Per-arm result",
    "",
    "| Role | Contract | Execution | Verification | Required checks P/F/B/S/U | Selected/delivered/referenced | Fallback required/used |",
    "| --- | --- | --- | --- | --- | --- | --- |",
    ...armRows,
    "",
    `The constrained arm kept \`${REQUIRED_CHECK_LABEL}\` unsupported and unexecuted, settled as \`${constrained.contract_status}\`, inherited no stronger result, and used no hidden fallback.`,
    `The zero-model arm completed with provider calls=${zero.resource_observations.provider_calls}, model calls=${zero.resource_observations.model_calls}, and network calls=${zero.resource_observations.network_calls}; availability does not establish model equivalence or quality superiority.`,
    `The predecessor replay status is \`${replay.predecessor_replay_status}\`; it used fresh execution identities and did not mutate the settled candidate history.`,
    "",
    "For every arm, the packet-level actual-use claim and all item-level actual-use, support, outcome, and causal lanes remain unknown. Excluded candidates receive no row or credit, and bundle credit is false.",
    "",
    "## Explicit fallback plan",
    "",
    `- Plan: \`${benchmark.fallback_plan.fallback_plan_id}\``,
    `- Failed arm: \`${benchmark.fallback_plan.failed_arm_ref.arm_id}\``,
    `- Exact settled status: \`${benchmark.fallback_plan.failed_arm_ref.settled_status}\``,
    `- Exact predecessor route: \`${benchmark.fallback_plan.predecessor_route_ref.route_profile_id}\``,
    `- Candidate settled at: \`${benchmark.fallback_relation.chronology.candidate_settled_at}\` (${benchmark.fallback_relation.chronology.candidate_settlement_basis})`,
    `- Predecessor replay started at: \`${benchmark.fallback_relation.chronology.predecessor_replay_started_at}\` (${benchmark.fallback_relation.chronology.predecessor_replay_start_basis})`,
    `- Chronology: ${benchmark.fallback_relation.chronology.ordering}`,
    `- Trigger: ${benchmark.fallback_plan.fallback_trigger}`,
    `- Reason: ${benchmark.fallback_plan.fallback_reason}`,
    `- Harness authority: ${benchmark.fallback_plan.benchmark_harness_authorization}`,
    `- Automatic execution: ${benchmark.fallback_plan.automatic_execution_authorized}`,
    `- Product route mutation: ${benchmark.fallback_plan.product_route_mutation_authorized}`,
    `- Rollback activation: ${benchmark.fallback_plan.rollback_activation_authorized}`,
    "",
    "The deterministic event chronology is source-bound fallback sequencing evidence, not genuine performance latency.",
    "",
    "## Pairwise deltas",
    "",
    "| Left route | Right route | Dimension | Relation | Left | Right |",
    "| --- | --- | --- | --- | --- | --- |",
    ...deltaRows,
    "",
    "No scalar, score, rank, route winner, promotion, demotion, blacklist, or policy preference is produced.",
    "",
    "## Trade-offs",
    "",
    ...benchmark.trade_offs.map((item) => `- ${item}`),
    "",
    "## Resource and missing-evidence lanes",
    "",
    ...benchmark.resource_observation_provenance.map((item) => `- ${item}`),
    ...benchmark.missing_evidence.map((item) => `- Missing: ${item}`),
    "",
    "## ADR owner-gap observations",
    "",
    ...benchmark.adr_owner_gap_observations.flatMap((item) => [
      `### ${item.question}`,
      "",
      item.observation,
      "",
      `Observed owners: ${item.evidence_owner_refs.map((ref) => `\`${ref}\``).join(", ")}. Decision remains deferred to ACGC6B.`,
      "",
    ]),
    "## Authority and limitations",
    "",
    "The benchmark is pure, rebuildable, non-authoritative, and unpersisted. It creates no active route, operational policy, activation or rollback receipt, automatic fallback or rollback, automatic Start or Resume, Packet C, second continuation hop, Transition, provider call, network call, GitHub call, publication, or merge authority.",
    "",
    ...benchmark.limitations.map((item) => `- ${item}`),
    "",
  ].join("\n");
}

function formatDeltaValueV01(value: unknown): string {
  if (value === null) return "unobserved";
  if (typeof value === "object") return `\`${JSON.stringify(value)}\``;
  return String(value);
}

const REQUIRED_CHECK_LABEL = "verify-portable-output";

function parseCliV01(argv: string[]): {
  input_path: string;
  format: ModelHostSuccessionBenchmarkReportFormatV01;
} {
  let inputPath: string | null = null;
  let format: ModelHostSuccessionBenchmarkReportFormatV01 = "json";
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--input") inputPath = argv[++index] ?? null;
    else if (value === "--format") {
      const requested = argv[++index];
      if (requested !== "json" && requested !== "markdown") {
        throw new Error("model_host_succession_report_format_invalid");
      }
      format = requested;
    } else {
      throw new Error("model_host_succession_report_argument_invalid");
    }
  }
  if (!inputPath) throw new Error("model_host_succession_report_input_required");
  return { input_path: inputPath, format };
}

function runCliV01(): void {
  const request = parseCliV01(process.argv.slice(2));
  const benchmark = JSON.parse(
    readFileSync(path.resolve(request.input_path), "utf8"),
  ) as ModelHostSuccessionBenchmarkV01;
  process.stdout.write(
    renderModelHostSuccessionBenchmarkReportV01(benchmark, request.format),
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
