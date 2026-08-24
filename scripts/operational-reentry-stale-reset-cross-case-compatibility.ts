#!/usr/bin/env node
import { realpathSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { prepareOperationalReentryStaleResetCrossCaseModelGatewayRouteV01 } from "@/lib/vnext/model-gateway/model-gateway";
import {
  buildOperationalReentryStaleResetCrossCaseCompatibilityPlanV01,
  runOperationalReentryStaleResetCrossCaseCompatibilityV01,
  validateOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01,
} from "@/lib/vnext/operational-reentry-stale-reset-cross-case-replication";
import {
  appendOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01,
  consumeOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01,
  sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01,
  validateOperationalReentryStaleResetCrossCaseCompatibilityArtifactsV01,
} from "@/lib/vnext/operational-reentry-stale-reset-cross-case-compatibility-artifact-store";
import {
  assertCrossCaseLiveExecutionStateV01,
  boundedCrossCaseLiveErrorV01,
  preflightCrossCaseLiveRepositoryV01,
  readCrossCaseLiveJsonV01,
} from "@/scripts/operational-reentry-stale-reset-cross-case-live-common";
import { OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_VERSION_V02 } from "@/types/vnext/operational-reentry-stale-reset-cross-case-replication";

if (process.argv[1] && pathToFileURL(realpathSync(process.argv[1])).href === import.meta.url) {
  void main().catch((error) => {
    console.error("operational_reentry_stale_reset_cross_case_compatibility_failed");
    console.error(boundedCrossCaseLiveErrorV01(error));
    process.exitCode = 1;
  });
}

async function main(): Promise<void> {
  const options = parseArguments(process.argv.slice(2));
  const root = realpathSync(options.repository_root ?? process.cwd());
  const authorizationUnknown = readCrossCaseLiveJsonV01(options.authorization_file);
  const pricing = readCrossCaseLiveJsonV01(options.pricing_file);
  const authorization = validateOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01(authorizationUnknown);
  const admission = preflightCrossCaseLiveRepositoryV01({
    repository_root: root, authorization, authorization_file: options.authorization_file,
    pricing, candidate_namespace: "operational-reentry-stale-reset-cross-case-compatibility-probes",
    issue_field: "future_compatibility_issue_number",
  });
  const route = await prepareOperationalReentryStaleResetCrossCaseModelGatewayRouteV01();
  if (!route) fail("cross_case_compatibility_route_unavailable");
  const plan = buildOperationalReentryStaleResetCrossCaseCompatibilityPlanV01(route);
  const probeId = `cross-case-compatibility-${authorization.integrity.fingerprint.slice(7, 39)}`;
  const manifest = sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01("cross_case_compatibility_manifest_without_integrity_fingerprint", {
    compatibility_version:
      OPERATIONAL_REENTRY_STALE_RESET_CROSS_CASE_COMPATIBILITY_VERSION_V02,
    probe_id: probeId,
    future_compatibility_issue_number: authorization.future_compatibility_issue_number,
    source_repository_head_sha: authorization.exact_merged_source_head,
    authorization_fingerprint: authorization.integrity.fingerprint,
    plan_fingerprint: plan.integrity.fingerprint,
    provider_contract_fingerprint: route.provider_contract_fingerprint,
    route_fingerprint: route.integrity_fingerprint,
    route: structuredClone(route),
    pricing_fingerprint: (pricing as { integrity: { fingerprint: string } }).integrity.fingerprint,
    behavioral_replication: false as const,
    raw_or_private_material_persisted: false as const,
  });
  let consumption: Awaited<ReturnType<typeof consumeOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01>> | null = null;
  const shapeRecords: unknown[] = [];
  const result = await runOperationalReentryStaleResetCrossCaseCompatibilityV01(
    { authorization, admission, route, pricing },
    {
      assert_execution_state() { assertCrossCaseLiveExecutionStateV01(root, authorization); },
      async consume_authorization() {
        consumption = await consumeOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01({
          lab_root: path.join(root, ".augnes-lab"), authorization,
          probe_id: probeId, consumed_at: new Date().toISOString(),
        });
        for (const [relative_path, artifact] of [["authorization.json", authorization], ["plan.json", plan], ["pricing.json", pricing], ["manifest.json", manifest]] as const) {
          await appendOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01({ run_root: consumption.run_root, relative_path, artifact });
        }
      },
      async on_call_terminal(call) {
        if (!consumption) fail("cross_case_compatibility_consumption_missing");
        const planEntry = plan.entries[call.call_order]!;
        const record = sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01("cross_case_compatibility_shape_record_without_integrity_fingerprint", {
          ...withoutIntegrity(call),
          shape_label: `${planEntry.case_id.includes(":r1-") ? "R1" : "R2"}-${planEntry.provider_shape}`,
          manifest_fingerprint: manifest.integrity.fingerprint,
        });
        shapeRecords.push(record);
        await appendOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01({ run_root: consumption.run_root, relative_path: `shape-${call.call_order}.json`, artifact: record });
      },
    },
  );
  const finalConsumption = consumption as Awaited<ReturnType<typeof consumeOperationalReentryStaleResetCrossCaseCompatibilityAuthorizationV01>> | null;
  if (!finalConsumption) fail("cross_case_compatibility_authorization_not_consumed");
  const report = sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01("cross_case_compatibility_report_without_integrity_fingerprint", {
    manifest_fingerprint: manifest.integrity.fingerprint,
    completion_status: result.calls.every((call) => call.terminal_category === "completed_live") ? "compatible" as const : "not_compatible_or_incomplete" as const,
    planned_shapes: 6 as const, terminal_shape_records: 6 as const,
    attempted_provider_calls: result.attempted_provider_calls,
    retries: 0 as const, replacements: 0 as const, behavioral_replication: false as const,
  });
  const terminal = sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01("cross_case_compatibility_terminal_without_integrity_fingerprint", { report_fingerprint: report.integrity.fingerprint, terminal: true as const });
  const index = sealOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01("cross_case_compatibility_artifact_index_without_integrity_fingerprint", {
    report_fingerprint: report.integrity.fingerprint, terminal_fingerprint: terminal.integrity.fingerprint, shape_record_count: 6 as const,
  });
  for (const [relative_path, artifact] of [["report.json", report], ["terminal.json", terminal], ["artifact-index.json", index]] as const) {
    await appendOperationalReentryStaleResetCrossCaseCompatibilityArtifactV01({ run_root: finalConsumption.run_root, relative_path, artifact });
  }
  const validation = validateOperationalReentryStaleResetCrossCaseCompatibilityArtifactsV01({
    authorization, plan, pricing, manifest, shape_records: shapeRecords, report, terminal,
    artifact_index: index, global_consumption_marker: finalConsumption.marker,
    run_local_consumption_marker: structuredClone(finalConsumption.marker),
  }, { admission, route });
  console.log(JSON.stringify({ status: "operational_reentry_stale_reset_cross_case_compatibility_terminal", attempted_provider_calls: result.attempted_provider_calls, retries: 0, replacements: 0, artifact_validation: validation, run_root: path.relative(root, finalConsumption.run_root) }));
}

function parseArguments(args: string[]): { authorization_file: string; pricing_file: string; repository_root: string | null } {
  let authorizationFile: string | null = null;
  let pricingFile: string | null = null;
  let repositoryRoot: string | null = null;
  let confirmed = false;
  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--confirm-operational-reentry-stale-reset-cross-case-compatibility") confirmed = true;
    else if (value === "--authorization-file") authorizationFile = args[++index] ?? null;
    else if (value === "--pricing-file") pricingFile = args[++index] ?? null;
    else if (value === "--repository-root") repositoryRoot = args[++index] ?? null;
    else fail("cross_case_compatibility_cli_argument_invalid");
  }
  if (!confirmed) fail("cross_case_compatibility_cli_confirmation_required");
  if (!authorizationFile || !pricingFile) fail("cross_case_compatibility_cli_required_argument_missing");
  return { authorization_file: authorizationFile, pricing_file: pricingFile, repository_root: repositoryRoot };
}

function withoutIntegrity<T extends { integrity: unknown }>(value: T): Omit<T, "integrity"> { const { integrity: _ignored, ...rest } = value; return rest; }
function fail(code: string): never { throw new Error(code); }
