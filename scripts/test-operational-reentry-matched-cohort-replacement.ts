#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  operationalReentryMatchedCohortCaseFixtureV01,
  operationalReentryMatchedCohortRubricFixtureV01,
} from "@/fixtures/vnext/research/operational-reentry-matched-cohort-v0-1";
import {
  assertOperationalReentryMatchedCohortReplacementArtifactRootAvailableV01,
  beginOperationalReentryMatchedCohortReplacementAttemptV01,
  validateOperationalReentryMatchedCohortReplacementArtifactsV01,
} from "@/lib/vnext/operational-reentry-matched-cohort-replacement-artifact-store";
import {
  ACGC_E2R1_AGGREGATE_COST_CEILING_NANO_USD_V01,
  ACGC_E2R1_COMPATIBILITY_ARTIFACT_INDEX_FINGERPRINT_V01,
  ACGC_E2R1_COMPATIBILITY_REPORT_FINGERPRINT_V01,
  ACGC_E2R1_COMPATIBILITY_SOURCE_HEAD_V01,
  ACGC_E2R1_HISTORICAL_HEAD_V01,
  assertOperationalReentryMatchedCohortReplacementAggregateCostWithinCeilingV01,
  buildOperationalReentryMatchedCohortReplacementAuthorizationExpectationsV01,
  buildOperationalReentryMatchedCohortReplacementHarnessV01,
  buildOperationalReentryMatchedCohortReplacementLineageV01,
  buildOperationalReentryMatchedCohortReplacementV01,
  readOperationalReentryMatchedCohortReplacementCompatibilityGateV01,
  revalidateOperationalReentryMatchedCohortReplacementCompatibilityGateBeforeAttemptV01,
  runOperationalReentryMatchedCohortReplacementV01,
} from "@/lib/vnext/operational-reentry-matched-cohort-replacement";
import {
  ACGC_E2_HISTORICAL_COHORT_ID_V01,
  ACGC_E2_HISTORICAL_RUN_ROOT_V01,
} from "@/lib/vnext/operational-reentry-matched-cohort-artifact-store";
import {
  buildOperationalReentryMatchedCohortCallPlanV01,
  buildOperationalReentryMatchedCohortReplacementLineageV02,
} from "@/lib/vnext/operational-reentry-matched-cohort";
import {
  ModelGatewayAdapterFailureV01,
  OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
  type ModelAdapterV01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  prepareOperationalReentryMatchedCohortModelGatewayRouteV01,
  type ModelGatewayInteractiveAdmissionV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  createDeterministicModelClientRequestIdV01,
  createDeterministicModelProviderRequestTraceV01,
} from "@/lib/vnext/model-gateway/provider-rejection-observation";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
  normalizeLocalProjectRootRefV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import { selectActiveProjectV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import { preflightOperationalReentryMatchedCohortReplacementRepositoryV01 } from "@/scripts/operational-reentry-matched-cohort-replacement";
import type {
  OperationalReentryMatchedCohortIntegrityV01,
  OperationalReentryMatchedCohortModelInputV01,
  OperationalReentryMatchedCohortModelOutputV01,
} from "@/types/vnext/operational-reentry-matched-cohort";
import {
  OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_AUTHORIZATION_VERSION_V01,
  type OperationalReentryMatchedCohortReplacementAuthorizationV01,
  type OperationalReentryMatchedCohortReplacementCompatibilityGateV01,
} from "@/types/vnext/operational-reentry-matched-cohort-replacement";

const root = mkdtempSync(path.join(tmpdir(), "augnes-e2r1h-"));
const projectRoot = path.join(root, "project");
const databasePath = path.join(root, "gateway.db");
const sourceHead = "fb5801572d35e13029a86b8195eae1a82ece9a03";
const evaluatedAt = "2026-08-18T12:30:00.000Z";
let fakeTransportCalls = 0;

void main()
  .finally(() => rmSync(root, { recursive: true, force: true }))
  .catch((error) => {
    console.error("operational_reentry_matched_cohort_replacement_test_failed");
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });

async function main(): Promise<void> {
  mkdirSync(projectRoot, { recursive: true });
  writeFileSync(path.join(projectRoot, ".gitignore"), ".augnes-lab/\n");
  initializeDatabaseV01();
  const admission = registerProjectV01();
  const route = await prepareOperationalReentryMatchedCohortModelGatewayRouteV01({
    adapter: fakeAdapterV01(),
  });
  assert.ok(route);
  const compatibilityGate = compatibilityGateFixtureV01(projectRoot);

  verifyStaticHarnessAndHistoricalLineageV01();
  verifyCompatibilityGateTruthTableV01(projectRoot);
  const authorization = authorizationFixtureV01(
    admission,
    route,
    compatibilityGate,
  );
  const prepared = verifyAuthorizationAndPreparedIdentityV01(
    authorization,
    admission,
    route,
    compatibilityGate,
  );
  verifyFinalCompatibilityGateRevalidationV01(prepared);
  await verifyCompleteAndIncompleteExecutionsV01(
    authorization,
    admission,
    route,
    compatibilityGate,
  );
  await verifyAtomicGlobalSingleUseAndArtifactsV01(
    prepared,
    authorization,
    admission,
    route,
    compatibilityGate,
  );
  verifyRepositoryPreflightV01();
  verifyStaticCliAndHistoricalCommandV01();
  assert.equal(fakeTransportCalls, 0);
  console.log(
    JSON.stringify({
      status: "operational_reentry_matched_cohort_replacement_test_passed",
      planned_calls: prepared.call_plan.planned_calls,
      request_family_kind: prepared.manifest.request_family_kind,
      aggregate_worst_case_cost_nano_usd:
        prepared.pricing.aggregate_worst_case_cost_nano_usd,
      aggregate_ceiling_nano_usd:
        prepared.pricing.aggregate_ceiling_nano_usd,
      replacement_authorizations_created: 0,
      replacement_authorizations_consumed: 0,
      real_provider_calls: 0,
    }),
  );
}

function verifyStaticHarnessAndHistoricalLineageV01(): void {
  const harness = buildOperationalReentryMatchedCohortReplacementHarnessV01();
  assert.equal(harness.issue_number, 197);
  assert.equal(harness.zero_provider_egress, true);
  assert.equal(harness.replacement_authorizations_created, 0);
  assert.equal(harness.replacement_authorizations_consumed, 0);
  assert.equal(harness.replacement_provider_calls, 0);
  assert.equal(harness.behavioral_result_exists, false);
  const lineage = buildOperationalReentryMatchedCohortReplacementLineageV01();
  assert.deepEqual(
    {
      historical_issue: lineage.historical_issue,
      historical_pr: lineage.historical_pr,
      historical_source_head: lineage.historical_source_head,
      historical_result: lineage.historical_result,
      historical_authorization_consumed:
        lineage.historical_authorization_consumed,
      historical_rejection_cause: lineage.historical_rejection_cause,
      compatibility_probe_issue: lineage.compatibility_probe_issue,
      compatibility_source_head: lineage.compatibility_source_head,
      compatibility_probe_result: lineage.compatibility_probe_result,
      replacement_count: lineage.replacement_count,
      retry_of_historical_cohort: lineage.retry_of_historical_cohort,
      historical_artifacts_rewritten:
        lineage.historical_artifacts_rewritten,
      further_cohort_authorized: lineage.further_cohort_authorized,
      second_replacement_authorized: lineage.second_replacement_authorized,
      stage_7_authorized: lineage.stage_7_authorized,
    },
    {
      historical_issue: 185,
      historical_pr: 186,
      historical_source_head: ACGC_E2R1_HISTORICAL_HEAD_V01,
      historical_result: "terminal_incomplete",
      historical_authorization_consumed: true,
      historical_rejection_cause: "unclassified",
      compatibility_probe_issue: 193,
      compatibility_source_head: ACGC_E2R1_COMPATIBILITY_SOURCE_HEAD_V01,
      compatibility_probe_result: "accepted_all_shapes",
      replacement_count: 1,
      retry_of_historical_cohort: false,
      historical_artifacts_rewritten: false,
      further_cohort_authorized: false,
      second_replacement_authorized: false,
      stage_7_authorized: false,
    },
  );
  const historicalLineage = buildOperationalReentryMatchedCohortReplacementLineageV02();
  assert.equal(historicalLineage.replacement_authorization_granted, false);
  assert.equal(historicalLineage.replacement_authorization_consumed, false);
}

function verifyCompatibilityGateTruthTableV01(repositoryRoot: string): void {
  const gate = compatibilityGateFixtureV01(repositoryRoot);
  assert.equal(gate.outcome, "accepted_all_shapes");
  assert.equal(gate.attempted_provider_calls, 4);
  assert.equal(gate.accepted_and_normalized_shapes, 4);
  assert.equal(gate.retries, 0);
  assert.equal(gate.second_probe, 0);
  assert.equal(gate.normalized_probe_outputs_reused, false);
  assert.equal(
    gate.report_fingerprint,
    ACGC_E2R1_COMPATIBILITY_REPORT_FINGERPRINT_V01,
  );
  assert.equal(
    gate.artifact_index_fingerprint,
    ACGC_E2R1_COMPATIBILITY_ARTIFACT_INDEX_FINGERPRINT_V01,
  );
  assert.throws(
    () => compatibilityGateFixtureV01(repositoryRoot, { attempted: 3 }),
    /operational_reentry_replacement_compatibility_artifact_mismatch/,
  );
  assert.throws(
    () => compatibilityGateFixtureV01(repositoryRoot, { outcome: "provider_rejected" }),
    /operational_reentry_replacement_compatibility_artifact_mismatch/,
  );
  assert.throws(
    () => compatibilityGateFixtureV01(repositoryRoot, { source: "a".repeat(40) }),
    /operational_reentry_replacement_compatibility_artifact_mismatch/,
  );
  assert.throws(
    () => compatibilityGateFixtureV01(repositoryRoot, { retries: 1 }),
    /operational_reentry_replacement_compatibility_artifact_mismatch/,
  );
  assert.throws(
    () => compatibilityGateFixtureV01(repositoryRoot, { issue: 194 }),
    /operational_reentry_replacement_compatibility_artifact_mismatch/,
  );
  assert.throws(
    () =>
      compatibilityGateFixtureV01(repositoryRoot, {
        index_fingerprint: `sha256:${"4".repeat(64)}`,
      }),
    /operational_reentry_replacement_compatibility_artifact_mismatch/,
  );
  const outsideProbe = path.join(root, "outside-probe-root");
  mkdirSync(outsideProbe, { recursive: true });
  assert.throws(
    () =>
      readOperationalReentryMatchedCohortReplacementCompatibilityGateV01(
        {
          repository_root: repositoryRoot,
          probe_run_root: outsideProbe,
        },
        compatibilityGateDependenciesV01(),
      ),
    /operational_reentry_replacement_compatibility_root_invalid/,
  );
  const symlinkParent = path.join(
    repositoryRoot,
    ".augnes-lab",
    "operational-reentry-provider-probes",
    "operational-reentry-provider-probe_symlink",
  );
  mkdirSync(symlinkParent, { recursive: true });
  const symlinkRoot = path.join(symlinkParent, "issue-193");
  symlinkSync(outsideProbe, symlinkRoot, "dir");
  assert.throws(
    () =>
      readOperationalReentryMatchedCohortReplacementCompatibilityGateV01(
        {
          repository_root: repositoryRoot,
          probe_run_root: symlinkRoot,
        },
        compatibilityGateDependenciesV01(),
      ),
    /operational_reentry_replacement_compatibility_root_invalid/,
  );
}

function verifyAuthorizationAndPreparedIdentityV01(
  authorization: OperationalReentryMatchedCohortReplacementAuthorizationV01,
  admission: ModelGatewayInteractiveAdmissionV01,
  route: NonNullable<Awaited<ReturnType<typeof prepareOperationalReentryMatchedCohortModelGatewayRouteV01>>>,
  compatibilityGate: OperationalReentryMatchedCohortReplacementCompatibilityGateV01,
) {
  const prepared = buildOperationalReentryMatchedCohortReplacementV01({
    authorization,
    admission,
    route,
    compatibility_gate: compatibilityGate,
    evaluated_at: evaluatedAt,
  });
  const historicalPlan = buildOperationalReentryMatchedCohortCallPlanV01();
  assert.equal(
    canonicalizeProtocolValueV01(prepared.call_plan),
    canonicalizeProtocolValueV01(historicalPlan),
  );
  assert.equal(
    prepared.case.integrity.fingerprint,
    operationalReentryMatchedCohortCaseFixtureV01.integrity.fingerprint,
  );
  assert.equal(
    prepared.rubric.integrity.fingerprint,
    operationalReentryMatchedCohortRubricFixtureV01.integrity.fingerprint,
  );
  assert.deepEqual(prepared.call_plan.sealed_order, [
    ["A", "B", "D", "C"],
    ["B", "C", "A", "D"],
    ["C", "D", "B", "A"],
    ["D", "A", "C", "B"],
  ]);
  assert.equal(prepared.call_plan.entries.length, 16);
  assert.equal(prepared.call_plan.max_parallel_provider_calls, 1);
  assert.equal(prepared.call_plan.retries, 0);
  assert.equal(prepared.call_plan.replacement_calls, 0);
  assert.equal(prepared.call_plan.adaptive_stopping, false);
  assert.equal(prepared.call_plan.stateless_invocations, true);
  assert.equal(prepared.manifest.request_family_kind, "replacement_cohort");
  assert.equal(prepared.manifest.route.provider_ref.external_id, "openai");
  assert.equal(
    prepared.manifest.route.model_ref.external_id,
    "gpt-4.1-mini-2025-04-14",
  );
  assert.equal(
    prepared.manifest.route.adapter_implementation_version,
    "openai_responses_operational_reentry_matched_cohort_adapter.v0.3",
  );
  assert.ok(
    prepared.pricing.aggregate_worst_case_cost_nano_usd <=
      ACGC_E2R1_AGGREGATE_COST_CEILING_NANO_USD_V01,
  );
  assert.equal(
    authorization.pricing_fingerprint,
    prepared.pricing.integrity.fingerprint,
  );
  assert.equal(
    authorization.pricing_snapshot_evaluated_at,
    prepared.pricing.evaluated_at,
  );
  assert.equal(
    authorization.pricing_authority_fingerprint,
    prepared.pricing.gateway_cost_budget.authority.pricing_fingerprint,
  );
  const sameSnapshotLater =
    buildOperationalReentryMatchedCohortReplacementV01({
      authorization,
      admission,
      route,
      compatibility_gate: compatibilityGate,
      evaluated_at: "2026-08-18T12:31:00.000Z",
    });
  assert.equal(
    sameSnapshotLater.pricing.integrity.fingerprint,
    prepared.pricing.integrity.fingerprint,
  );
  const historicalTrace = createDeterministicModelProviderRequestTraceV01({
    request_family_kind: "cohort_attempt",
    request_family_fingerprint: authorization.integrity.fingerprint,
  });
  const probeTrace = createDeterministicModelProviderRequestTraceV01({
    request_family_kind: "compatibility_probe",
    request_family_fingerprint: authorization.integrity.fingerprint,
  });
  assert.notEqual(prepared.manifest.request_family_trace_id, historicalTrace);
  assert.notEqual(prepared.manifest.request_family_trace_id, probeTrace);
  const requestIds = prepared.call_plan.entries.map((entry) =>
    createDeterministicModelClientRequestIdV01({
      purpose: OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
      provider_request_trace_id: prepared.manifest.request_family_trace_id,
      call_slot_id: entry.call_slot_id,
      model: "gpt-4.1-mini-2025-04-14",
    }),
  );
  assert.equal(new Set(requestIds).size, 16);

  for (const mutation of [
    { retries: 1 },
    { replacement_calls: 1 },
    { retry_of_historical_cohort: true },
    { further_cohort_authorized: true },
    { second_replacement_authorized: true },
    { stage_7_authorized: true },
    { future_live_issue_number: 185 },
  ]) {
    assert.throws(
      () =>
        buildOperationalReentryMatchedCohortReplacementV01({
          authorization: resealV01({ ...authorization, ...mutation }),
          admission,
          route,
          compatibility_gate: compatibilityGate,
          evaluated_at: evaluatedAt,
        }),
      /operational_reentry_replacement_authorization_mismatched/,
    );
  }
  assert.throws(
    () =>
      buildOperationalReentryMatchedCohortReplacementV01({
        authorization,
        admission: {
          ...admission,
          expected_active_selection_revision:
            admission.expected_active_selection_revision + 1,
        },
        route,
        compatibility_gate: compatibilityGate,
        evaluated_at: evaluatedAt,
      }),
    /operational_reentry_replacement_authorization_mismatched/,
  );
  assert.throws(
    () =>
      buildOperationalReentryMatchedCohortReplacementV01({
        authorization: resealV01({
          ...authorization,
          pricing_fingerprint: `sha256:${"2".repeat(64)}`,
        }),
        admission,
        route,
        compatibility_gate: compatibilityGate,
        evaluated_at: evaluatedAt,
      }),
    /operational_reentry_replacement_authorization_mismatched/,
  );
  assert.throws(
    () =>
      buildOperationalReentryMatchedCohortReplacementV01({
        authorization: resealV01({
          ...authorization,
          pricing_authority_fingerprint: `sha256:${"3".repeat(64)}`,
        }),
        admission,
        route,
        compatibility_gate: compatibilityGate,
        evaluated_at: evaluatedAt,
      }),
    /operational_reentry_replacement_authorization_mismatched/,
  );
  assert.throws(
    () =>
      buildOperationalReentryMatchedCohortReplacementV01({
        authorization,
        admission,
        route,
        compatibility_gate: compatibilityGate,
        evaluated_at: "2026-08-24T00:00:00.000Z",
      }),
    /model_gateway_pricing_stale/,
  );
  assert.throws(
    () =>
      assertOperationalReentryMatchedCohortReplacementAggregateCostWithinCeilingV01(
        {
          aggregate_worst_case_cost_nano_usd:
            ACGC_E2R1_AGGREGATE_COST_CEILING_NANO_USD_V01 + 1,
          maximum_total_cost_nano_usd:
            ACGC_E2R1_AGGREGATE_COST_CEILING_NANO_USD_V01,
        },
      ),
    /operational_reentry_replacement_aggregate_cost_exceeded/,
  );
  return prepared;
}

function verifyFinalCompatibilityGateRevalidationV01(
  prepared: ReturnType<
    typeof buildOperationalReentryMatchedCohortReplacementV01
  >,
): void {
  const repositoryRoot = path.join(root, "compatibility-toctou-repository");
  mkdirSync(repositoryRoot, { recursive: true });
  writeFileSync(path.join(repositoryRoot, ".gitignore"), ".augnes-lab/\n");
  const probeRoot = compatibilityProbeRootV01(repositoryRoot);
  const initialGate = compatibilityGateFixtureV01(repositoryRoot);
  assert.equal(
    initialGate.integrity.fingerprint,
    prepared.compatibility_gate.integrity.fingerprint,
  );
  const unchangedFinalGate =
    revalidateOperationalReentryMatchedCohortReplacementCompatibilityGateBeforeAttemptV01(
      {
        repository_root: repositoryRoot,
        probe_run_root: probeRoot,
        prepared,
      },
      compatibilityGateDependenciesV01(),
    );
  assert.equal(
    unchangedFinalGate.integrity.fingerprint,
    prepared.compatibility_gate.integrity.fingerprint,
  );

  const providerCallsBeforeMutation = fakeTransportCalls;
  const reportPath = path.join(probeRoot, "report.json");
  const changedReport = JSON.parse(readFileSync(reportPath, "utf8")) as {
    attempted_provider_calls: number;
  };
  changedReport.attempted_provider_calls = 3;
  writeFileSync(reportPath, JSON.stringify(changedReport));
  assert.throws(
    () =>
      revalidateOperationalReentryMatchedCohortReplacementCompatibilityGateBeforeAttemptV01(
        {
          repository_root: repositoryRoot,
          probe_run_root: probeRoot,
          prepared,
        },
        compatibilityGateDependenciesV01(),
      ),
    /operational_reentry_replacement_compatibility_artifact_mismatch/,
  );
  assert.equal(
    existsSync(
      path.join(
        repositoryRoot,
        ".augnes-lab",
        "operational-reentry-matched-cohort-replacements",
      ),
    ),
    false,
  );
  assert.equal(fakeTransportCalls, providerCallsBeforeMutation);

  rmSync(probeRoot, { recursive: true, force: true });
  compatibilityGateFixtureV01(repositoryRoot);
  const indexPath = path.join(probeRoot, "artifact-index.json");
  const swappedIndex = JSON.parse(readFileSync(indexPath, "utf8")) as {
    source_repository_head_sha: string;
  };
  swappedIndex.source_repository_head_sha = "a".repeat(40);
  writeFileSync(indexPath, JSON.stringify(swappedIndex));
  assert.throws(
    () =>
      revalidateOperationalReentryMatchedCohortReplacementCompatibilityGateBeforeAttemptV01(
        {
          repository_root: repositoryRoot,
          probe_run_root: probeRoot,
          prepared,
        },
        compatibilityGateDependenciesV01(),
      ),
    /operational_reentry_replacement_compatibility_artifact_mismatch/,
  );
  assert.equal(
    existsSync(
      path.join(
        repositoryRoot,
        ".augnes-lab",
        "operational-reentry-matched-cohort-replacements",
      ),
    ),
    false,
  );
  assert.equal(fakeTransportCalls, providerCallsBeforeMutation);
}

async function verifyCompleteAndIncompleteExecutionsV01(
  authorization: OperationalReentryMatchedCohortReplacementAuthorizationV01,
  admission: ModelGatewayInteractiveAdmissionV01,
  route: NonNullable<Awaited<ReturnType<typeof prepareOperationalReentryMatchedCohortModelGatewayRouteV01>>>,
  compatibilityGate: OperationalReentryMatchedCohortReplacementCompatibilityGateV01,
): Promise<void> {
  let consumed = 0;
  let fakeCalls = 0;
  const complete = await runOperationalReentryMatchedCohortReplacementV01(
    {
      authorization,
      admission,
      route,
      compatibility_gate: compatibilityGate,
      evaluated_at: evaluatedAt,
    },
    {
      assert_source_unchanged() {},
      on_first_egress_attempt() {
        consumed += 1;
      },
      gateway_dependencies: gatewayDependenciesV01(
        fakeAdapterV01(null, () => {
          fakeCalls += 1;
        }),
      ),
    },
  );
  assert.equal(complete.result_kind, "complete");
  assert.equal(complete.calls.length, 16);
  assert.equal(complete.block_evaluations.length, 4);
  assert.equal(complete.report.accounting.attempted_provider_calls, 16);
  assert.equal(complete.report.accounting.completed_live_calls, 16);
  assert.equal(complete.report.accounting.operator_intervention.retries, 0);
  assert.equal(
    complete.report.accounting.operator_intervention.replacement_calls,
    0,
  );
  assert.equal(consumed, 1);
  assert.equal(fakeCalls, 16);
  assert.equal(complete.report.authority_ledger.claims_hidden_actual_use, false);
  assert.equal(complete.report.authority_ledger.claims_general_causality, false);
  assert.equal(
    complete.report.authority_ledger.claims_general_benefit_or_harm,
    false,
  );
  assert.equal(
    complete.report.authority_ledger.claims_model_or_provider_superiority,
    false,
  );
  assert.equal(
    complete.report.authority_ledger.creates_scalar_rank_or_winner,
    false,
  );
  assert.equal(complete.report.authority_ledger.authorizes_policy, false);
  assert.equal(complete.report.authority_ledger.authorizes_stage_7, false);

  let incompleteCalls = 0;
  const incomplete = await runOperationalReentryMatchedCohortReplacementV01(
    {
      authorization,
      admission,
      route,
      compatibility_gate: compatibilityGate,
      evaluated_at: evaluatedAt,
    },
    {
      assert_source_unchanged() {},
      on_first_egress_attempt() {},
      gateway_dependencies: gatewayDependenciesV01(
        fakeAdapterV01(5, () => {
          incompleteCalls += 1;
        }),
      ),
    },
  );
  assert.equal(incomplete.result_kind, "incomplete");
  assert.equal(incomplete.calls.length, 16);
  assert.equal(incompleteCalls, 16);
  assert.equal(incomplete.report.terminal_category_counts.provider_rejected, 1);
  assert.equal(incomplete.report.block_evaluations[1]?.status, "incomplete");
  assert.ok(
    incomplete.report.block_evaluations[1]?.pairwise_relations.every(
      (relation) => relation.relation === "not_comparable",
    ),
  );
  assert.equal(incomplete.report.exact_case_dispositions.conditioning, "incomplete");
  assert.equal(incomplete.report.exact_case_dispositions.reset, "incomplete");
}

async function verifyAtomicGlobalSingleUseAndArtifactsV01(
  prepared: ReturnType<typeof buildOperationalReentryMatchedCohortReplacementV01>,
  authorization: OperationalReentryMatchedCohortReplacementAuthorizationV01,
  admission: ModelGatewayInteractiveAdmissionV01,
  route: NonNullable<Awaited<ReturnType<typeof prepareOperationalReentryMatchedCohortModelGatewayRouteV01>>>,
  compatibilityGate: OperationalReentryMatchedCohortReplacementCompatibilityGateV01,
): Promise<void> {
  const artifactRepository = path.join(root, "artifact-repository");
  mkdirSync(artifactRepository, { recursive: true });
  writeFileSync(
    path.join(artifactRepository, ".gitignore"),
    ".augnes-lab/\n",
  );
  const journal = beginOperationalReentryMatchedCohortReplacementAttemptV01({
    repository_root: artifactRepository,
    prepared,
  });
  let calls = 0;
  const result = await runOperationalReentryMatchedCohortReplacementV01(
    {
      authorization,
      admission,
      route,
      compatibility_gate: compatibilityGate,
      evaluated_at: evaluatedAt,
    },
    {
      assert_source_unchanged() {},
      on_first_egress_attempt(consumption) {
        journal.consume_authorization(consumption);
      },
      on_call_terminal(call) {
        journal.append_call(call);
      },
      on_block_evaluation(block) {
        journal.append_block(block);
      },
      gateway_dependencies: gatewayDependenciesV01(
        fakeAdapterV01(null, () => {
          calls += 1;
        }),
      ),
    },
  );
  const summary = journal.finalize(result);
  assert.equal(calls, 16);
  assert.equal(summary.authorization_consumed, true);
  assert.equal(summary.result_kind, "complete");
  assert.equal(summary.historical_artifacts_modified, false);
  assert.equal(summary.compatibility_probe_artifacts_modified, false);
  assert.equal(
    validateOperationalReentryMatchedCohortReplacementArtifactsV01({
      repository_root: artifactRepository,
      run_root: journal.run_root,
    }).artifact_index_fingerprint,
    summary.artifact_index_fingerprint,
  );
  assert.throws(
    () =>
      beginOperationalReentryMatchedCohortReplacementAttemptV01({
        repository_root: artifactRepository,
        prepared,
      }),
    /operational_reentry_replacement_authorization_global_collision_refused/,
  );
  assert.throws(
    () =>
      beginOperationalReentryMatchedCohortReplacementAttemptV01({
        repository_root: artifactRepository,
        prepared: buildOperationalReentryMatchedCohortReplacementV01({
          authorization,
          admission,
          route,
          compatibility_gate: compatibilityGate,
          evaluated_at: "2026-08-18T12:31:00.000Z",
        }),
      }),
    /operational_reentry_replacement_authorization_global_collision_refused/,
  );
  assert.throws(
    () =>
      assertOperationalReentryMatchedCohortReplacementArtifactRootAvailableV01({
        repository_root: artifactRepository,
        relative_run_root: ACGC_E2_HISTORICAL_RUN_ROOT_V01,
      }),
    /operational_reentry_replacement_historical_or_probe_root_refused/,
  );
  assert.throws(
    () =>
      assertOperationalReentryMatchedCohortReplacementArtifactRootAvailableV01({
        repository_root: artifactRepository,
        relative_run_root:
          ".augnes-lab/operational-reentry-provider-probes/probe/issue-193",
      }),
    /operational_reentry_replacement_historical_or_probe_root_refused/,
  );
  assert.throws(
    () =>
      assertOperationalReentryMatchedCohortReplacementArtifactRootAvailableV01({
        repository_root: artifactRepository,
        relative_run_root:
          `.augnes-lab/operational-reentry-matched-cohort-replacements/${ACGC_E2_HISTORICAL_COHORT_ID_V01}/issue-198`,
      }),
    /operational_reentry_replacement_historical_or_probe_root_refused/,
  );
}

function verifyRepositoryPreflightV01(): void {
  const repository = path.join(root, "preflight-repository");
  mkdirSync(repository, { recursive: true });
  gitV01(repository, ["init"]);
  gitV01(repository, ["config", "user.email", "codex@example.invalid"]);
  gitV01(repository, ["config", "user.name", "Codex Test"]);
  gitV01(repository, [
    "remote",
    "add",
    "origin",
    "https://github.com/hynk-studio/augnes.git",
  ]);
  writeFileSync(path.join(repository, "fixture.txt"), "fixture\n");
  gitV01(repository, ["add", "fixture.txt"]);
  gitV01(repository, ["commit", "-m", "fixture"]);
  const head = gitV01(repository, ["rev-parse", "HEAD"]);
  gitV01(repository, ["update-ref", "refs/remotes/origin/main", head]);
  const canonicalRepository = realpathSync(repository);
  preflightOperationalReentryMatchedCohortReplacementRepositoryV01(
    canonicalRepository,
    head,
  );
  writeFileSync(path.join(repository, "dirty.txt"), "dirty\n");
  assert.throws(
    () =>
      preflightOperationalReentryMatchedCohortReplacementRepositoryV01(
        canonicalRepository,
        head,
      ),
    /operational_reentry_replacement_dirty_or_mismatched_head/,
  );
  rmSync(path.join(repository, "dirty.txt"));
  writeFileSync(path.join(repository, "fixture.txt"), "advanced\n");
  gitV01(repository, ["add", "fixture.txt"]);
  gitV01(repository, ["commit", "-m", "feature head"]);
  assert.throws(
    () =>
      preflightOperationalReentryMatchedCohortReplacementRepositoryV01(
        canonicalRepository,
        gitV01(repository, ["rev-parse", "HEAD"]),
      ),
    /operational_reentry_replacement_source_not_exact_origin_main/,
  );
}

function verifyStaticCliAndHistoricalCommandV01(): void {
  const replacementSource = readFileSync(
    path.join(
      process.cwd(),
      "scripts/operational-reentry-matched-cohort-replacement.ts",
    ),
    "utf8",
  );
  assert.ok(
    replacementSource.includes("--confirm-future-live-replacement-cohort"),
  );
  assert.ok(replacementSource.includes("--authorization-file"));
  assert.ok(replacementSource.includes("--compatibility-probe-root"));
  assert.ok(replacementSource.includes("refs/remotes/origin/main"));
  assert.ok(
    replacementSource.indexOf(
      "revalidateOperationalReentryMatchedCohortReplacementCompatibilityGateBeforeAttemptV01",
      replacementSource.indexOf("const finalAdmission"),
    ) <
      replacementSource.indexOf(
        "beginOperationalReentryMatchedCohortReplacementAttemptV01",
        replacementSource.indexOf("const finalAdmission"),
      ),
  );
  assert.equal(replacementSource.includes("retry" + "("), false);
  const missingConfirmation = spawnSync(
    process.execPath,
    [
      "--import",
      "tsx",
      "scripts/operational-reentry-matched-cohort-replacement.ts",
    ],
    { cwd: process.cwd(), encoding: "utf8" },
  );
  assert.notEqual(missingConfirmation.status, 0);
  assert.match(
    missingConfirmation.stderr,
    /operational_reentry_replacement_explicit_confirmation_required/,
  );
  const historicalSource = readFileSync(
    path.join(process.cwd(), "scripts/operational-reentry-matched-cohort.ts"),
    "utf8",
  );
  assert.ok(historicalSource.includes("authorizationIssue !== \"185\""));
  assert.ok(
    historicalSource.includes("codex/acgc-e2-live-matched-reentry-cohort"),
  );
  assert.equal(
    ACGC_E2_HISTORICAL_RUN_ROOT_V01,
    ".augnes-lab/operational-reentry-matched-cohorts/operational-reentry-cohort_48331280ed7ead6dbad2d12105208dfb/issue-185",
  );
}

function compatibilityGateFixtureV01(
  repositoryRoot: string,
  changes: {
    attempted?: number;
    outcome?: string;
    source?: string;
    retries?: number;
    issue?: number;
    index_fingerprint?: string;
  } = {},
): OperationalReentryMatchedCohortReplacementCompatibilityGateV01 {
  const probeRoot = compatibilityProbeRootV01(repositoryRoot);
  mkdirSync(probeRoot, { recursive: true });
  const index = {
    future_live_issue_number: changes.issue ?? 193,
    source_repository_head_sha:
      changes.source ?? ACGC_E2R1_COMPATIBILITY_SOURCE_HEAD_V01,
    request_family_kind: "compatibility_probe",
    outcome: changes.outcome ?? "accepted_all_shapes",
    authorization_consumed: true,
  };
  const report = {
    outcome: changes.outcome ?? "accepted_all_shapes",
    planned_shapes: 4,
    attempted_provider_calls: changes.attempted ?? 4,
    accepted_and_normalized_shapes: 4,
    terminal_category_counts: { accepted_and_normalized: 4 },
  };
  const authorization = {
    future_live_issue_number: changes.issue ?? 193,
    exact_merged_source_head: ACGC_E2R1_COMPATIBILITY_SOURCE_HEAD_V01,
    retries: changes.retries ?? 0,
    second_probe_authorized: false,
  };
  writeFileSync(
    path.join(probeRoot, "artifact-index.json"),
    JSON.stringify(index),
  );
  writeFileSync(path.join(probeRoot, "report.json"), JSON.stringify(report));
  writeFileSync(
    path.join(probeRoot, "authorization.json"),
    JSON.stringify(authorization),
  );
  return readOperationalReentryMatchedCohortReplacementCompatibilityGateV01(
    { repository_root: repositoryRoot, probe_run_root: probeRoot },
    compatibilityGateDependenciesV01(
      changes.index_fingerprint ??
        ACGC_E2R1_COMPATIBILITY_ARTIFACT_INDEX_FINGERPRINT_V01,
    ),
  );
}

function compatibilityProbeRootV01(repositoryRoot: string): string {
  return path.join(
    repositoryRoot,
    ".augnes-lab",
    "operational-reentry-provider-probes",
    "operational-reentry-provider-probe_fixture",
    "issue-193",
  );
}

function compatibilityGateDependenciesV01(
  indexFingerprint: string =
    ACGC_E2R1_COMPATIBILITY_ARTIFACT_INDEX_FINGERPRINT_V01,
) {
  return {
    validate_artifacts: () => ({
      relative_run_root:
        ".augnes-lab/operational-reentry-provider-probes/operational-reentry-provider-probe_fixture/issue-193",
      outcome: "accepted_all_shapes" as const,
      artifact_count: 11,
      artifact_index_fingerprint:
        ACGC_E2R1_COMPATIBILITY_ARTIFACT_INDEX_FINGERPRINT_V01,
      report_fingerprint:
        ACGC_E2R1_COMPATIBILITY_REPORT_FINGERPRINT_V01,
      probe_fingerprint: `sha256:${"1".repeat(64)}`,
      authorization_consumed: true as const,
      tracked_repository_files_written: false as const,
      product_database_writes: 0 as const,
      core_writes: 0 as const,
    }),
    fingerprint_text: () => indexFingerprint,
  };
}

function authorizationFixtureV01(
  admission: ModelGatewayInteractiveAdmissionV01,
  route: NonNullable<Awaited<ReturnType<typeof prepareOperationalReentryMatchedCohortModelGatewayRouteV01>>>,
  compatibilityGate: OperationalReentryMatchedCohortReplacementCompatibilityGateV01,
): OperationalReentryMatchedCohortReplacementAuthorizationV01 {
  const expectations =
    buildOperationalReentryMatchedCohortReplacementAuthorizationExpectationsV01(
      {
        admission,
        route,
        compatibility_gate: compatibilityGate,
        evaluated_at: evaluatedAt,
      },
    );
  return sealV01("authorization_without_integrity_fingerprint", {
    authorization_version:
      OPERATIONAL_REENTRY_MATCHED_COHORT_REPLACEMENT_AUTHORIZATION_VERSION_V01,
    authorization_id: "fixture-e2r1-live-issue-198",
    authorization_kind:
      "authorized_replacement_after_historical_incomplete" as const,
    request_family_kind: "replacement_cohort" as const,
    future_live_issue_number: 198,
    exact_merged_source_head: sourceHead,
    issued_at: "2026-08-18T12:30:00.000Z",
    expires_at: "2026-08-18T13:30:00.000Z",
    workspace_id: expectations.workspace_id,
    project_id: expectations.project_id,
    expected_active_selection_revision:
      expectations.expected_active_selection_revision,
    project_root_fingerprint: expectations.project_root_fingerprint,
    gateway_authorization_project_is_lab_experiment_meaning: false as const,
    lineage_fingerprint: expectations.lineage_fingerprint,
    compatibility_gate_fingerprint:
      expectations.compatibility_gate_fingerprint,
    case_fingerprint: expectations.case_fingerprint,
    rubric_fingerprint: expectations.rubric_fingerprint,
    call_plan_fingerprint: expectations.call_plan_fingerprint,
    route_fingerprint: expectations.route_fingerprint,
    provider_contract_fingerprint:
      expectations.provider_contract_fingerprint,
    pricing_fingerprint: expectations.pricing_fingerprint,
    pricing_snapshot_evaluated_at:
      expectations.pricing_snapshot_evaluated_at,
    pricing_authority_fingerprint:
      expectations.pricing_authority_fingerprint,
    planned_calls: 16 as const,
    repeat_blocks: 4 as const,
    calls_per_arm: 4 as const,
    maximum_parallel_calls: 1 as const,
    retries: 0 as const,
    replacement_calls: 0 as const,
    adaptive_stopping: false as const,
    fresh_stateless_request_per_call: true as const,
    conversation_reuse: false as const,
    thread_reuse: false as const,
    previous_response_reuse: false as const,
    replacement_count: 1 as const,
    retry_of_historical_cohort: false as const,
    historical_artifacts_rewritten: false as const,
    further_cohort_authorized: false as const,
    second_replacement_authorized: false as const,
    stage_7_authorized: false as const,
    maximum_total_cost_nano_usd:
      ACGC_E2R1_AGGREGATE_COST_CEILING_NANO_USD_V01,
  });
}

function fakeAdapterV01(
  failInvocation: number | null = null,
  onInvoke: () => void = () => {},
): ModelAdapterV01 {
  let invocation = 0;
  return {
    describe() {
      return {
        implementation_id:
          "openai_responses.operational_reentry_matched_cohort",
        implementation_version:
          "openai_responses_operational_reentry_matched_cohort_adapter.v0.3",
      };
    },
    async prepare(purpose) {
      if (
        purpose !==
        OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01
      ) {
        return null;
      }
      return {
        ...this.describe(purpose),
        purpose,
        provider_ref: {
          ref_version: "external_ref.v0.1" as const,
          ref_type: "model_provider",
          external_id: "openai",
          provider: "openai",
          trust_class: "direct_local_observation" as const,
        },
        model_ref: {
          ref_version: "external_ref.v0.1" as const,
          ref_type: "provider_model",
          external_id: "gpt-4.1-mini-2025-04-14",
          provider: "openai",
          trust_class: "direct_local_observation" as const,
        },
        async invoke(input, lifecycle) {
          assert.equal(
            input.input_kind,
            OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
          );
          onInvoke();
          lifecycle.report_input_bytes(1_024);
          lifecycle.mark_egress_attempted();
          const current = invocation++;
          if (current === failInvocation) {
            throw new ModelGatewayAdapterFailureV01(
              "adapter_provider_rejected",
            );
          }
          return {
            purpose:
              OPERATIONAL_REENTRY_MATCHED_COHORT_MODEL_GATEWAY_PURPOSE_V01,
            output: outputForV01(
              input as OperationalReentryMatchedCohortModelInputV01,
            ),
            usage: {
              basis: "provider_report" as const,
              quality: "reported" as const,
              source: "provider_response" as const,
              input_tokens: 120,
              cached_input_tokens: 0,
              output_tokens: 40,
              total_tokens: 160,
            },
          };
        },
      };
    },
  };
}

function outputForV01(
  input: OperationalReentryMatchedCohortModelInputV01,
): OperationalReentryMatchedCohortModelOutputV01 {
  const stale = input.stale_relation !== null;
  const targetAvailable = input.target_context_token !== null;
  const armA = targetAvailable && !stale;
  const armB = !targetAvailable && input.context_material.length > 0;
  if (armB) {
    return {
      result_token: "result_review_blocked",
      referenced_context_tokens: [
        ...input.allowed_output.referenced_context_tokens,
      ],
      required_check_dispositions: ["verify_portable_output:blocked"],
      operation_action_class_tokens: ["no_external_action"],
      blocker_warning_gap_tokens: ["gap_support_unknown"],
      result_limitation_tokens: [
        "limitation_non_authoritative",
        "limitation_target_not_available",
      ],
      target_disposition: "not_available",
      abstention: true,
    };
  }
  if (stale) {
    return {
      result_token: "result_review_ready",
      referenced_context_tokens:
        input.allowed_output.referenced_context_tokens.filter(
          (token) => token !== input.target_context_token,
        ),
      required_check_dispositions: ["verify_portable_output:passed"],
      operation_action_class_tokens: ["bounded_result_review"],
      blocker_warning_gap_tokens: ["gap_decision_pending"],
      result_limitation_tokens: ["limitation_non_authoritative"],
      target_disposition: "withheld_stale",
      abstention: false,
    };
  }
  return {
    result_token: "result_review_ready",
    referenced_context_tokens: [
      ...input.allowed_output.referenced_context_tokens,
    ],
    required_check_dispositions: ["verify_portable_output:passed"],
    operation_action_class_tokens: armA
      ? ["bounded_result_review", "target_linked_verification_preparation"]
      : ["bounded_result_review"],
    blocker_warning_gap_tokens: targetAvailable
      ? ["gap_decision_pending", "gap_support_unknown"]
      : [],
    result_limitation_tokens: targetAvailable
      ? ["limitation_non_authoritative"]
      : [
          "limitation_non_authoritative",
          "limitation_target_not_available",
        ],
    target_disposition: targetAvailable
      ? "applied_to_structure"
      : "not_available",
    abstention: false,
  };
}

function gatewayDependenciesV01(adapter: ModelAdapterV01) {
  return {
    adapter,
    open_database: () => new Database(databasePath),
    read_root_availability: async () => "available" as const,
    now: () => new Date(evaluatedAt),
  };
}

function initializeDatabaseV01(): void {
  const database = new Database(databasePath);
  database.exec(
    readFileSync(path.join(process.cwd(), "lib/db/schema.sql"), "utf8"),
  );
  database.close();
}

function registerProjectV01(): ModelGatewayInteractiveAdmissionV01 {
  const database = new Database(databasePath);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(database, {
    create_uuid: () => "11111111-1111-4111-8111-111111111111",
    now: () => "2026-08-18T11:59:00.000Z",
  });
  const localRoot = normalizeLocalProjectRootRefV01(projectRoot, {
    base_path: path.parse(projectRoot).root,
  });
  const project = getOrCreateCanonicalProjectForLocalRootV01(database, {
    workspace_id: workspace.workspace_id,
    local_root: localRoot,
    display_name: "E2R1 fixture",
  }, {
    create_uuid: () => "22222222-2222-4222-8222-222222222222",
    now: () => "2026-08-18T11:59:00.000Z",
  });
  const active = selectActiveProjectV01(database, {
    workspace_id: workspace.workspace_id,
    project_id: project.project.project_id,
    now: "2026-08-18T11:59:00.000Z",
    expected_project_id: null,
    expected_revision: null,
  });
  database.close();
  return {
    workspace_id: workspace.workspace_id,
    project_id: project.project.project_id,
    expected_active_selection_revision: active.selection_revision,
    project_root: {
      path_flavor: localRoot.path_flavor,
      normalized_path: localRoot.normalized_path,
    },
    gateway_authorization_project_is_lab_experiment_meaning: false,
  };
}

function resealV01(
  value: Record<string, unknown>,
): OperationalReentryMatchedCohortReplacementAuthorizationV01 {
  const { integrity: _integrity, ...withoutIntegrity } = value;
  return sealV01(
    "authorization_without_integrity_fingerprint",
    withoutIntegrity,
  ) as unknown as OperationalReentryMatchedCohortReplacementAuthorizationV01;
}

function sealV01<T extends object>(
  scope: string,
  value: T,
): T & { integrity: OperationalReentryMatchedCohortIntegrityV01 } {
  return {
    ...structuredClone(value),
    integrity: {
      algorithm: "sha256",
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: scope,
      fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(value),
      ),
    },
  };
}

function gitV01(repository: string, args: string[]): string {
  return execFileSync("git", ["-C", repository, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}
