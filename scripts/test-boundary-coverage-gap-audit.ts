import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

import {
  BOUNDARY_COVERAGE_AUDIT_AUTHORITY_V01,
  BOUNDARY_COVERAGE_AUDIT_ROWS_V01,
  BOUNDARY_COVERAGE_STATUS_DEFINITIONS_V01,
  buildBoundaryCoverageGapAuditReportV01,
  renderBoundaryCoverageGapAuditMarkdownV01,
  validateBoundaryCoverageRowsV01,
  type BoundaryCoverageAuditRowV01,
} from "@/scripts/boundary-coverage-gap-audit";

const originalFetch = globalThis.fetch;
let networkCalls = 0;
globalThis.fetch = (async () => {
  networkCalls += 1;
  throw new Error("boundary coverage audit must not call the network");
}) as typeof fetch;

try {
  const report = buildBoundaryCoverageGapAuditReportV01({ verify_sources: true });
  assert.equal(report.row_count, 24);
  assert.deepEqual(report.status_distribution, {
    enforced: 15,
    observed: 3,
    advisory: 1,
    outside_coverage: 5,
  });
  assert.deepEqual(Object.keys(report.coverage_vocabulary), [
    "enforced",
    "observed",
    "advisory",
    "outside_coverage",
  ]);
  assert.match(BOUNDARY_COVERAGE_STATUS_DEFINITIONS_V01.enforced, /blocking, admission, or refusal owner/u);
  assert.match(BOUNDARY_COVERAGE_STATUS_DEFINITIONS_V01.observed, /not a blocking guarantee/u);
  assert.match(BOUNDARY_COVERAGE_STATUS_DEFINITIONS_V01.advisory, /no enforcement claim/u);
  assert.match(BOUNDARY_COVERAGE_STATUS_DEFINITIONS_V01.outside_coverage, /do not establish/u);

  const byId = new Map(report.rows.map((auditRow) => [auditRow.row_id, auditRow]));
  for (const requiredRow of [
    "managed_start_effect_channel_convergence",
    "explicit_resume_effect_channel_convergence",
    "start_and_resume_grant_family_separation",
    "grant_replay_and_target_drift_no_second_effect",
    "resume_monotonic_same_run_envelope_and_lineage",
    "operation_approval_and_direct_command_refusal",
    "guidebrief_proposal_to_fresh_pc5_activation",
    "model_gateway_host_owned_route_material",
    "model_gateway_local_only_and_secret_pre_egress_refusal",
    "model_gateway_per_invocation_budget",
    "governed_actor_lab_product_authority_firewall",
    "automatic_resume_remains_unsupported",
    "managed_execution_cross_operation_aggregate_budget",
    "model_gateway_cross_invocation_aggregate_budget",
    "model_gateway_universal_private_material_refusal",
    "safe_partial_plan_progress",
    "child_run_or_dag_orchestration",
  ]) {
    assert(byId.has(requiredRow), requiredRow);
  }

  assert.deepEqual(
    byId.get("managed_start_effect_channel_convergence")?.reachable_channels,
    ["Browser-confirmed Start", "Operator/MCP proxy", "local repository-execution route"],
  );
  assert.deepEqual(
    byId.get("explicit_resume_effect_channel_convergence")?.reachable_channels,
    ["Browser-confirmed Resume", "Operator/MCP proxy", "local repository-execution route"],
  );
  assert.equal(byId.get("managed_execution_cross_operation_aggregate_budget")?.coverage_status, "outside_coverage");
  assert.equal(byId.get("model_gateway_cross_invocation_aggregate_budget")?.coverage_status, "outside_coverage");
  assert.equal(byId.get("model_gateway_universal_private_material_refusal")?.coverage_status, "outside_coverage");
  assert.equal(byId.get("safe_partial_plan_progress")?.coverage_status, "outside_coverage");
  assert.equal(byId.get("child_run_or_dag_orchestration")?.coverage_status, "outside_coverage");
  assert.equal(byId.get("automatic_resume_remains_unsupported")?.coverage_status, "enforced");

  for (const auditRow of report.rows) {
    assert.equal(auditRow.acgc3d_changed_owner, false, auditRow.row_id);
    assert.deepEqual(auditRow.audit_output_authority, BOUNDARY_COVERAGE_AUDIT_AUTHORITY_V01);
    assert.ok(Object.values(auditRow.audit_output_authority).every((value) => value === false));
    if (auditRow.coverage_status === "enforced") {
      assert.ok(
        auditRow.exact_sources.some(
          (source) => source.evidence_kind === "gate" || source.evidence_kind === "refusal",
        ),
        auditRow.row_id,
      );
      assert.ok(auditRow.exact_test_or_fixture_evidence.length > 0, auditRow.row_id);
    }
  }

  for (const auditRow of report.rows.filter((candidate) => candidate.coverage_status !== "enforced")) {
    const promoted = {
      ...auditRow,
      coverage_status: "enforced" as const,
    } satisfies BoundaryCoverageAuditRowV01;
    assert.throws(
      () => validateBoundaryCoverageRowsV01([promoted]),
      /boundary_coverage_enforced_owner_or_evidence_missing/,
      `${auditRow.coverage_status} row ${auditRow.row_id} must not be resealed as enforced`,
    );
  }

  const observedWithGate = {
    ...byId.get("model_invocation_receipt_is_observation")!,
    exact_sources: [{
      ...byId.get("model_invocation_receipt_is_observation")!.exact_sources[0]!,
      evidence_kind: "gate" as const,
    }],
  };
  assert.throws(
    () => validateBoundaryCoverageRowsV01([observedWithGate]),
    /boundary_coverage_non_enforced_resealed/,
  );

  assert.equal(report.findings.concrete_owner_defects_found.length, 0);
  assert.equal(report.findings.owner_local_corrections.length, 0);
  assert.match(report.findings.cumulative_budget_result, /outside_coverage/u);
  assert.match(report.findings.safe_partial_progress_result, /outside_coverage/u);
  assert.match(report.findings.resume_monotonicity_result, /same run/u);
  assert.match(report.findings.model_gateway_result, /no routing policy changed/u);
  assert.match(report.findings.governed_actor_lab_result, /authority absent/u);
  assert.equal(report.real_provider_calls, 0);
  assert.deepEqual(report.authority, BOUNDARY_COVERAGE_AUDIT_AUTHORITY_V01);
  assert.equal(networkCalls, 0);

  const markdown = renderBoundaryCoverageGapAuditMarkdownV01(report);
  assert.match(markdown, /Rows: 24/u);
  assert.match(markdown, /enforced=15, observed=3, advisory=1, outside_coverage=5/u);
  assert.match(markdown, /real_provider_calls=0/u);
  assert.match(markdown, /semantic\/product\/execution\/merge authority = false/u);

  const cli = spawnSync(
    process.execPath,
    ["--import", "tsx", "scripts/boundary-coverage-gap-audit.ts", "--markdown"],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      timeout: 10_000,
      env: {
        PATH: process.env.PATH ?? "",
        NODE_ENV: "test",
      },
    },
  );
  assert.equal(cli.status, 0, cli.stderr);
  assert.equal(cli.signal, null);
  assert.equal(cli.stderr, "");
  assert.match(cli.stdout, /# ACGC3D boundary coverage gap audit/u);
  assert.match(cli.stdout, /real_provider_calls=0/u);
  assert.equal(networkCalls, 0);

  console.log(JSON.stringify({
    suite: "boundary-coverage-gap-audit-v0.1",
    status: "passed",
    row_count: report.row_count,
    status_distribution: report.status_distribution,
    concrete_owner_defects_found: 0,
    owner_local_corrections: 0,
    non_enforced_reseal_refused: true,
    all_enforced_rows_bind_concrete_owner_evidence: true,
    audit_output_authority: report.authority,
    real_provider_calls: report.real_provider_calls,
    network_calls: networkCalls,
  }, null, 2));
} finally {
  globalThis.fetch = originalFetch;
}
