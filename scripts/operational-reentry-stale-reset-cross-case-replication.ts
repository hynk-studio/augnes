#!/usr/bin/env node
import { realpathSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { readOperationalReentryStaleResetCrossCaseV01 } from "@/fixtures/vnext/research/operational-reentry-stale-reset-cross-case-replication-v0-1";
import {
  prepareOperationalReentryStaleResetCrossCaseModelGatewayRouteV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  buildOperationalReentryStaleResetCrossCaseEvaluatorBindingV01,
  buildOperationalReentryStaleResetCrossCaseGateContractV01,
  buildOperationalReentryStaleResetCrossCasePlanV01,
  runOperationalReentryStaleResetCrossCaseReplicationV01,
  validateOperationalReentryStaleResetCrossCaseReplicationAuthorizationV01,
} from "@/lib/vnext/operational-reentry-stale-reset-cross-case-replication";
import {
  appendOperationalReentryStaleResetCrossCaseArtifactV01,
  consumeOperationalReentryStaleResetCrossCaseAuthorizationV01,
  sealOperationalReentryStaleResetCrossCaseArtifactV01,
  validateOperationalReentryStaleResetCrossCaseReplicationArtifactsV01,
} from "@/lib/vnext/operational-reentry-stale-reset-cross-case-replication-artifact-store";
import { canonicalizeProtocolValueV01, createProtocolSha256V01 } from "@/lib/vnext/protocol-primitives";
import {
  assertCrossCaseLiveExecutionStateV01,
  boundedCrossCaseLiveErrorV01,
  preflightCrossCaseLiveRepositoryV01,
  readCrossCaseLiveJsonV01,
} from "@/scripts/operational-reentry-stale-reset-cross-case-live-common";
import type { OperationalReentryStaleResetCrossCaseIdV01 } from "@/types/vnext/operational-reentry-stale-reset-cross-case-replication";

if (process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url) {
  void main().catch((error) => {
    console.error("operational_reentry_stale_reset_cross_case_replication_failed");
    console.error(boundedCrossCaseLiveErrorV01(error));
    process.exitCode = 1;
  });
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));
  const root = realpathSync(options.repository_root ?? process.cwd());
  const authorizationUnknown = readCrossCaseLiveJsonV01(options.authorization_file);
  const pricing = readCrossCaseLiveJsonV01(options.pricing_file);
  const authorization = validateOperationalReentryStaleResetCrossCaseReplicationAuthorizationV01(authorizationUnknown);
  if (authorization.case_id !== options.case_id) fail("cross_case_replication_cli_case_mismatch");
  const { admission, source_attestation: sourceAttestation } =
    await preflightCrossCaseLiveRepositoryV01({
    repository_root: root,
    authorization: authorization as unknown as Record<string, unknown>,
    authorization_file: options.authorization_file,
    pricing,
    candidate_namespace: "operational-reentry-v04-stale-reset-cross-case-replications",
    issue_field: "future_live_issue_number",
  });
  const route = await prepareOperationalReentryStaleResetCrossCaseModelGatewayRouteV01();
  if (!route) fail("cross_case_replication_route_unavailable");
  const caseSpec = readOperationalReentryStaleResetCrossCaseV01(authorization.case_id);
  const plan = buildOperationalReentryStaleResetCrossCasePlanV01(authorization.case_id, route);
  const gate = buildOperationalReentryStaleResetCrossCaseGateContractV01(authorization.case_id);
  const evaluator = buildOperationalReentryStaleResetCrossCaseEvaluatorBindingV01(authorization.case_id);
  const cohortId = `cross-case-replication-${hash({ authorization: authorization.integrity.fingerprint, plan: plan.integrity.fingerprint }).slice(7, 39)}`;
  const manifest = sealOperationalReentryStaleResetCrossCaseArtifactV01("cross_case_replication_manifest_without_integrity_fingerprint", {
    manifest_version: "operational_reentry_v04_stale_reset_replication_manifest.v0.1" as const,
    cohort_id: cohortId,
    case_id: authorization.case_id,
    future_live_issue_number: authorization.future_live_issue_number,
    source_repository_head_sha: authorization.exact_merged_source_head,
    authorization_fingerprint: authorization.integrity.fingerprint,
    case_fingerprint: caseSpec.integrity.fingerprint,
    plan_fingerprint: plan.integrity.fingerprint,
    gate_contract_fingerprint: gate.integrity.fingerprint,
    evaluator_binding_fingerprint: evaluator.integrity.fingerprint,
    pricing_fingerprint: (pricing as { integrity: { fingerprint: string } }).integrity.fingerprint,
    route_fingerprint: route.integrity_fingerprint,
    provider_contract_fingerprint: route.provider_contract_fingerprint,
    route: structuredClone(route),
    request_family: plan.request_family_kind,
    public_safe: true as const,
    raw_or_private_material_persisted: false as const,
  });
  const attempt = sealOperationalReentryStaleResetCrossCaseArtifactV01("cross_case_replication_attempt_without_integrity_fingerprint", {
    manifest_fingerprint: manifest.integrity.fingerprint,
    retries: 0 as const,
    replacements: 0 as const,
    maximum_parallel_provider_calls: 1 as const,
  });
  let consumption: Awaited<ReturnType<typeof consumeOperationalReentryStaleResetCrossCaseAuthorizationV01>> | null = null;
  const callRecords: unknown[] = [];
  const blockRecords: unknown[] = [];
  const result = await runOperationalReentryStaleResetCrossCaseReplicationV01(
    { authorization, admission, route, pricing },
    {
      assert_execution_state() {
        assertCrossCaseLiveExecutionStateV01(
          root,
          authorization as unknown as Record<string, unknown>,
          sourceAttestation,
        );
      },
      async consume_authorization() {
        consumption = await consumeOperationalReentryStaleResetCrossCaseAuthorizationV01({
          lab_root: path.join(root, ".augnes-lab"), authorization, cohort_id: cohortId,
          consumed_at: new Date().toISOString(),
        });
        for (const [relative_path, artifact] of [
          ["authorization.json", authorization], ["case-specification.json", caseSpec],
          ["plan.json", plan], ["gate-contract.json", gate], ["evaluator-binding.json", evaluator],
          ["pricing.json", pricing], ["manifest.json", manifest], ["attempt.json", attempt],
        ] as const) await appendOperationalReentryStaleResetCrossCaseArtifactV01({ run_root: consumption.run_root, relative_path, artifact });
      },
      async on_call_terminal(call) {
        if (!consumption) fail("cross_case_replication_consumption_missing");
        const record = sealOperationalReentryStaleResetCrossCaseArtifactV01("cross_case_replication_call_record_without_integrity_fingerprint", {
          ...withoutIntegrity(call), manifest_fingerprint: manifest.integrity.fingerprint,
        });
        callRecords.push(record);
        await appendOperationalReentryStaleResetCrossCaseArtifactV01({
          run_root: consumption.run_root, relative_path: `call-${String(call.call_order).padStart(2, "0")}.json`, artifact: record,
        });
      },
      async on_block_evaluation(block) {
        if (!consumption) fail("cross_case_replication_consumption_missing");
        const record = sealOperationalReentryStaleResetCrossCaseArtifactV01("cross_case_replication_block_record_without_integrity_fingerprint", {
          ...withoutIntegrity(block), case_id: authorization.case_id,
          direct_pair_records: block.pair_evaluations,
        });
        blockRecords.push(record);
        await appendOperationalReentryStaleResetCrossCaseArtifactV01({ run_root: consumption.run_root, relative_path: `block-${block.repeat_block}.json`, artifact: record });
      },
    },
  );
  const finalConsumption = consumption as Awaited<ReturnType<typeof consumeOperationalReentryStaleResetCrossCaseAuthorizationV01>> | null;
  if (!finalConsumption) fail("cross_case_replication_authorization_not_consumed");
  const caseStatus = result.case_status;
  const report = sealOperationalReentryStaleResetCrossCaseArtifactV01("cross_case_replication_report_without_integrity_fingerprint", {
    report_version: "operational_reentry_v04_stale_reset_replication_report.v0.1" as const,
    manifest_fingerprint: manifest.integrity.fingerprint,
    case_status_fingerprint: caseStatus.integrity.fingerprint,
    case_status: caseStatus.status,
    planned_calls: 16 as const,
    terminal_call_records: callRecords.length,
    complete_blocks: result.blocks.filter((block) => block.status === "complete").length,
    direct_pair_records: result.blocks.reduce((count, block) => count + block.pair_evaluations.length, 0),
    attempted_provider_calls: result.attempted_provider_calls,
    retries: 0 as const, replacements: 0 as const,
    product_or_core_writes: 0 as const, policy: false as const, stage_7: false as const,
  });
  const terminal = sealOperationalReentryStaleResetCrossCaseArtifactV01("cross_case_replication_terminal_without_integrity_fingerprint", {
    report_fingerprint: report.integrity.fingerprint,
    terminal: true as const,
  });
  const index = sealOperationalReentryStaleResetCrossCaseArtifactV01("cross_case_replication_artifact_index_without_integrity_fingerprint", {
    artifact_index_version: "operational_reentry_v04_stale_reset_replication_artifact_index.v0.1" as const,
    report_fingerprint: report.integrity.fingerprint,
    terminal_fingerprint: terminal.integrity.fingerprint,
    call_record_count: 16 as const,
    block_record_count: 4 as const,
  });
  for (const [relative_path, artifact] of [["case-status.json", caseStatus], ["report.json", report], ["terminal.json", terminal], ["artifact-index.json", index]] as const) {
    await appendOperationalReentryStaleResetCrossCaseArtifactV01({ run_root: finalConsumption.run_root, relative_path, artifact });
  }
  const validation = validateOperationalReentryStaleResetCrossCaseReplicationArtifactsV01({
    authorization, case_specification: caseSpec, plan, gate_contract: gate,
    evaluator_binding: evaluator, pricing, manifest, attempt, call_records: callRecords,
    block_records: blockRecords, case_status: caseStatus, report, terminal,
    artifact_index: index, global_consumption_marker: finalConsumption.marker,
    run_local_consumption_marker: structuredClone(finalConsumption.marker),
  }, { admission, route });
  console.log(JSON.stringify({ status: "operational_reentry_stale_reset_cross_case_replication_terminal", case_id: authorization.case_id, case_status: caseStatus.status, attempted_provider_calls: result.attempted_provider_calls, retries: 0, replacements: 0, artifact_validation: validation, run_root: path.relative(root, finalConsumption.run_root) }));
}

function parseArguments(args: string[]): { authorization_file: string; pricing_file: string; repository_root: string | null; case_id: OperationalReentryStaleResetCrossCaseIdV01 } {
  let authorizationFile: string | null = null;
  let pricingFile: string | null = null;
  let repositoryRoot: string | null = null;
  let caseId: string | null = null;
  let confirmed = false;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--confirm-operational-reentry-stale-reset-cross-case-replication") confirmed = true;
    else if (value === "--authorization-file") authorizationFile = args[++index] ?? null;
    else if (value === "--pricing-file") pricingFile = args[++index] ?? null;
    else if (value === "--repository-root") repositoryRoot = args[++index] ?? null;
    else if (value === "--case-id") caseId = args[++index] ?? null;
    else fail("cross_case_replication_cli_argument_invalid");
  }
  if (!confirmed) fail("cross_case_replication_cli_confirmation_required");
  if (!authorizationFile || !pricingFile || !caseId) fail("cross_case_replication_cli_required_argument_missing");
  return { authorization_file: authorizationFile, pricing_file: pricingFile, repository_root: repositoryRoot, case_id: caseId as OperationalReentryStaleResetCrossCaseIdV01 };
}

function withoutIntegrity<T extends { integrity: unknown }>(value: T): Omit<T, "integrity"> { const { integrity: _ignored, ...rest } = value; return rest; }
function hash(value: unknown): string { return createProtocolSha256V01(canonicalizeProtocolValueV01(value)); }
function fail(code: string): never { throw new Error(code); }
