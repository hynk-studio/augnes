#!/usr/bin/env node

import assert from "node:assert/strict";
import { channel } from "node:diagnostics_channel";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { openDatabase } from "../lib/db";
import {
  normalizeWorkId,
  resolveCanonicalWorkItemFromDatabase,
} from "../lib/work";
import { buildPlan } from "../lib/planner/planner";
import { createAutonomyRun, tickAutonomyRun } from "../lib/autonomy/runner";
import {
  readAutonomyRunLedgerRecord,
  updateAutonomyRunLedgerFields,
} from "../lib/autonomy/runner-ledger";
import {
  buildModelInvocationCapabilityGrantV01,
  type ModelInvocationCapabilityGrantBuilderInputV01,
} from "../lib/vnext/automation/model-invocation-capability-grant";
import {
  PolicyTriggeredPlannerRunErrorV01,
  listIncompletePolicyTriggeredModelRunsV01,
  runPolicyTriggeredPlannerV01,
  type PolicyTriggeredPlannerRunInputV01,
} from "../lib/vnext/automation/policy-triggered-planner-run";
import { createOpenAIResponsesAdapterV01 } from "../lib/vnext/model-gateway/openai/responses-adapter";
import { projectModelInvocationReceiptToRunReceiptEntryV02 } from "../lib/vnext/model-gateway/run-receipt-projection";
import type {
  ModelAdapterSessionV01,
  ModelAdapterV01,
} from "../lib/vnext/model-gateway/contracts";
import {
  mutateProjectControlV01,
} from "../lib/vnext/persistence/project-control-store";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
  normalizeLocalProjectRootRefV01,
} from "../lib/vnext/persistence/project-identity-registry";
import {
  selectActiveProjectV01,
  touchRecentProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import { validateRunReceiptV01 } from "../lib/vnext/run-receipt";
import type { ModelInvocationCapabilityGrantV01 } from "../types/vnext/model-invocation-capability-grant";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";

const HOSTILE = "policy-run-hostile-credential-payload-4fa9";
const root = mkdtempSync(path.join(tmpdir(), "augnes-policy-model-run-"));
const databasePath = path.join(root, "policy-model-run.db");
const projectARoot = path.join(root, "a", "same-name");
const projectBRoot = path.join(root, "b", "same-name");
const priorDatabasePath = process.env.AUGNES_DB_PATH;
const undiciChannel = channel("undici:request:create");
let undiciRequests = 0;
const onUndici = () => {
  undiciRequests += 1;
};

void main().catch((error) => {
  console.error("policy_triggered_model_run_test_failed");
  if (error instanceof PolicyTriggeredPlannerRunErrorV01) {
    console.error(error.code);
    if (error.model_invocation_receipt) {
      console.error(
        `${error.model_invocation_receipt.status}:${error.model_invocation_receipt.failure_code ?? "none"}`,
      );
    }
  } else if (error instanceof Error) {
    console.error(error.name);
  }
  process.exitCode = 1;
});

async function main() {
  mkdirSync(projectARoot, { recursive: true });
  mkdirSync(projectBRoot, { recursive: true });
  process.env.AUGNES_DB_PATH = databasePath;
  undiciChannel.subscribe(onUndici);
  const grants = new Map<string, ModelInvocationCapabilityGrantV01>();
  let fakeTransportCalls = 0;
  const capturedBodies: string[] = [];
  try {
    const fixture = setupProjectsAndControl();
    const deterministicInput = runInput(fixture, {
      run_id: "run:policy-deterministic",
      work_id: "work:policy-deterministic",
      grant_id: "grant:policy-deterministic",
      execution_mode: "deterministic",
    });
    grants.set(
      deterministicInput.grant_id,
      grantFor(deterministicInput, {
        permitted_execution_modes: ["deterministic"],
        provider_egress_allowed: false,
        max_provider_calls: 0,
      }),
    );
    const beforeDeterministic = authoritativeMutationCounts();
    const deterministic = await runPolicyTriggeredPlannerV01(
      deterministicInput,
      dependencies(grants, createOpenAIResponsesAdapterV01({
        environment: { OPENAI_API_KEY: HOSTILE },
        transport: async () => {
          fakeTransportCalls += 1;
          return plannerSuccess();
        },
      })),
    );
    assert.equal(fakeTransportCalls, 0);
    assert.equal(deterministic.planner, "mock");
    assert.equal(deterministic.model_invocation_receipt.invocation_origin, "policy_triggered");
    assert.equal(deterministic.model_invocation_receipt.work_id, deterministicInput.work_id);
    assert.equal(deterministic.model_invocation_receipt.run_id, deterministicInput.run_id);
    assert.equal(deterministic.model_invocation_receipt.attempted_provider_ref, null);
    assert.equal(deterministic.model_invocation_receipt.fallback_used, false);
    assert.equal(deterministic.run_receipt.model_invocations.length, 1);
    assert.equal(validateRunReceiptV01(deterministic.run_receipt).status, "valid");
    assert.equal(deterministic.run_receipt.execution.status, "completed");
    assert.equal(deterministic.semantic_state_changed, false);
    assert.equal(deterministic.proposal_approved, false);
    assert.equal(deterministic.publication_performed, false);
    assert.equal(deterministic.deployment_performed, false);
    assert.equal(deterministic.retry_performed, false);
    assert.equal(deterministic.external_action_performed, false);
    assert.notEqual(fixture.projectAId, fixture.projectBId);
    assertNoPrivateMaterial([
      deterministic.model_invocation_receipt,
      deterministic.run_receipt,
    ]);
    const deterministicLedger = readLedger(deterministicInput.run_id);
    assert.equal(deterministicLedger?.status, "completed");
    assert.equal(
      terminalStepEventType(deterministicInput.run_id),
      "step_completed",
    );
    assert.equal(listIncompleteRuns(fixture.projectAId).length, 0);
    assert.deepEqual(authoritativeMutationCounts(), {
      ...beforeDeterministic,
      run_receipts: beforeDeterministic.run_receipts + 1,
      autonomy_runs: beforeDeterministic.autonomy_runs + 1,
    });

    const liveInput = runInput(fixture, {
      run_id: "run:policy-live",
      work_id: "work:policy-live",
      grant_id: "grant:policy-live",
      execution_mode: "live",
    });
    grants.set(liveInput.grant_id, grantFor(liveInput));
    const adapter = createOpenAIResponsesAdapterV01({
      environment: { OPENAI_API_KEY: HOSTILE, OPENAI_MODEL: "test-model" },
      transport: async (request) => {
        fakeTransportCalls += 1;
        capturedBodies.push(request.body);
        return plannerSuccess();
      },
    });
    const live = await runPolicyTriggeredPlannerV01(
      liveInput,
      dependencies(grants, adapter),
    );
    assert.equal(fakeTransportCalls, 1);
    assert.equal(live.planner, "openai");
    assert.equal(live.model_invocation_receipt.attempted_provider_ref?.external_id, "openai");
    assert.equal(live.model_invocation_receipt.attempted_model_ref?.external_id, "test-model");
    assert.equal(live.model_invocation_receipt.final_implementation_id, "openai_responses.planner");
    assert.equal(live.model_invocation_receipt.budget.provider_calls_used, 1);
    assert.deepEqual(live.model_invocation_receipt.usage, {
      basis: "provider_report",
      quality: "reported",
      source: "provider_response",
      input_tokens: 17,
      output_tokens: 9,
      total_tokens: 26,
    });
    assert.equal(live.model_invocation_receipt.cost.basis, "unavailable");
    assert.equal(live.run_receipt.model_invocations.length, 1);
    assert.equal(validateRunReceiptV01(live.run_receipt).status, "valid");
    assert.equal(terminalStepEventType(liveInput.run_id), "step_completed");
    assertNoPrivateMaterial([
      live.model_invocation_receipt,
      live.run_receipt,
    ]);

    const active = activateProjectA(fixture);
    const interactive = await buildPlan(
      {
        workspace_id: fixture.workspaceId,
        project_id: fixture.projectAId,
        expected_active_project_id: fixture.projectAId,
        expected_active_selection_revision: active,
        project_root: fixture.projectARoot,
        message: liveInput.message,
        execution_mode: "live",
      },
      { gateway_dependencies: { adapter }, create_uuid: () => "parity" },
    );
    assert.equal(fakeTransportCalls, 2);
    assert.deepEqual(JSON.parse(capturedBodies[0]!), JSON.parse(capturedBodies[1]!));
    assert.deepEqual(live.recommendations, interactive.recommendations);
    assert.equal(
      live.model_invocation_receipt.egress_policy_version,
      interactive.model_invocation_receipt.egress_policy_version,
    );
    assert.deepEqual(
      live.model_invocation_receipt.usage,
      interactive.model_invocation_receipt.usage,
    );
    assert.equal(interactive.model_invocation_receipt.invocation_origin, "interactive");
    assert.equal(interactive.model_invocation_receipt.grant_lineage_ref, null);

    await refusalMatrix(fixture, grants, adapter, () => fakeTransportCalls);
    await activeRunLimitRefusal(fixture, grants, adapter, () => fakeTransportCalls);
    const workBindingMetrics = await workBindingRegressions(fixture, grants);
    const atomicClaimMetrics = await atomicActiveRunClaimRace(fixture, grants);

    const beforeReplay = authoritativeMutationCounts();
    await assertPolicyError(
      () =>
        runPolicyTriggeredPlannerV01(
          deterministicInput,
          dependencies(grants, adapter),
        ),
      ["policy_planner_run_conflict"],
    );
    assert.deepEqual(authoritativeMutationCounts(), beforeReplay);
    assert.throws(() =>
      projectModelInvocationReceiptToRunReceiptEntryV02({
        receipt: deterministic.model_invocation_receipt,
        workspace_id: "workspace:44444444-4444-4444-8444-444444444444",
        project_id: fixture.projectAId,
        work_id: deterministicInput.work_id,
        run_id: deterministicInput.run_id,
      }),
    );
    assert.throws(() =>
      projectModelInvocationReceiptToRunReceiptEntryV02({
        receipt: deterministic.model_invocation_receipt,
        workspace_id: fixture.workspaceId,
        project_id: fixture.projectBId,
        work_id: deterministicInput.work_id,
        run_id: deterministicInput.run_id,
      }),
    );
    assert.throws(() =>
      projectModelInvocationReceiptToRunReceiptEntryV02({
        receipt: deterministic.model_invocation_receipt,
        workspace_id: fixture.workspaceId,
        project_id: fixture.projectAId,
        work_id: deterministicInput.work_id,
        run_id: "run:other",
      }),
    );
    assert.throws(() =>
      projectModelInvocationReceiptToRunReceiptEntryV02({
        receipt: deterministic.model_invocation_receipt,
        workspace_id: fixture.workspaceId,
        project_id: fixture.projectAId,
        work_id: "work:other",
        run_id: deterministicInput.run_id,
      }),
    );
    const duplicateReceipt = structuredClone(deterministic.run_receipt);
    duplicateReceipt.model_invocations.push(
      structuredClone(duplicateReceipt.model_invocations[0]!),
    );
    assert.equal(
      validateRunReceiptV01(duplicateReceipt).errors.some(
        (issue) => issue.code === "model_invocation_duplicate",
      ),
      true,
    );
    await admissionRefusalCases(
      fixture,
      active,
      grants,
      adapter,
      () => fakeTransportCalls,
    );
    await lifecycleMappingCases(fixture, grants);

    const database = openDatabase();
    try {
      const persisted = database
        .prepare(
          `SELECT payload_json FROM vnext_core_records
           WHERE workspace_id = ? AND project_id = ?
             AND record_kind = 'run_receipt'
           ORDER BY created_at, record_id`,
        )
        .all(fixture.workspaceId, fixture.projectAId) as Array<{
        payload_json: string;
      }>;
      assert.equal(persisted.length >= 2, true);
      assertNoPrivateMaterial(persisted);
      assert.equal(
        Number(
          (
            database
              .prepare("SELECT COUNT(*) AS count FROM vnext_semantic_state_entries")
              .get() as { count: number }
          ).count,
        ),
        0,
      );
      assert.equal(
        Number(
          (
            database
              .prepare("SELECT COUNT(*) AS count FROM state_delta_proposals")
              .get() as { count: number }
          ).count,
        ),
        0,
      );
    } finally {
      database.close();
    }
    assert.equal(undiciRequests, 0);
    console.log(
      JSON.stringify(
        {
          test: "policy_triggered_model_run",
          status: "pass",
          deterministic_provider_calls: 0,
          live_fake_provider_calls: 2,
          refused_provider_calls: 0,
          run_receipts_persisted: authoritativeMutationCounts().run_receipts,
          incomplete_runs: listIncompleteRuns(fixture.projectAId).length,
          canonical_work_binding_cases: workBindingMetrics.cases,
          work_refusal_provider_calls: workBindingMetrics.transport_calls,
          atomic_claim_requests: atomicClaimMetrics.requests,
          atomic_claim_winners: atomicClaimMetrics.winners,
          atomic_claim_refusals: atomicClaimMetrics.refusals,
          atomic_claim_provider_calls: atomicClaimMetrics.transport_calls,
          external_requests: undiciRequests,
          semantic_mutations: 0,
        },
        null,
        2,
      ),
    );
  } finally {
    undiciChannel.unsubscribe(onUndici);
    if (priorDatabasePath === undefined) delete process.env.AUGNES_DB_PATH;
    else process.env.AUGNES_DB_PATH = priorDatabasePath;
    rmSync(root, { recursive: true, force: true });
  }
}

async function workBindingRegressions(
  fixture: Fixture,
  grants: Map<string, ModelInvocationCapabilityGrantV01>,
) {
  let transportCalls = 0;
  const adapter = createOpenAIResponsesAdapterV01({
    environment: { OPENAI_API_KEY: HOSTILE },
    transport: async () => {
      transportCalls += 1;
      return plannerSuccess();
    },
  });
  const canonicalInput = runInput(fixture, {
    run_id: "run:work-canonicalized",
    work_id: "work:work-canonicalized",
    grant_id: "grant:work-canonicalized",
    execution_mode: "deterministic",
  });
  const canonicalWorkId = canonicalInput.work_id;
  canonicalInput.work_id = canonicalWorkId.toLowerCase();
  grants.set(
    canonicalInput.grant_id,
    grantFor(canonicalInput, {
      permitted_execution_modes: ["deterministic"],
      provider_egress_allowed: false,
      max_provider_calls: 0,
    }),
  );
  const canonicalized = await runPolicyTriggeredPlannerV01(
    canonicalInput,
    dependencies(grants, adapter),
  );
  assert.equal(transportCalls, 0);
  assert.equal(canonicalized.work_id, canonicalWorkId);
  assert.equal(canonicalized.model_invocation_receipt.work_id, canonicalWorkId);
  assert.equal(canonicalized.run_receipt.work_ref?.external_id, canonicalWorkId);
  const canonicalModelEntry = canonicalized.run_receipt.model_invocations[0];
  assert.equal(
    canonicalModelEntry && "entry_version" in canonicalModelEntry
      ? canonicalModelEntry.invocation_receipt.work_id
      : null,
    canonicalWorkId,
  );

  const missingInput = runInput(
    fixture,
    {
      run_id: "run:work-missing",
      work_id: "work:work-missing",
      grant_id: "grant:work-missing",
      execution_mode: "live",
    },
    { persist_work: false },
  );
  grants.set(missingInput.grant_id, grantFor(missingInput));
  let missingGrantReads = 0;
  const missing = await assertPolicyError(
    () =>
      runPolicyTriggeredPlannerV01(missingInput, {
        ...dependencies(grants, adapter),
        grant_authority: {
          read(grantId) {
            missingGrantReads += 1;
            return grants.get(grantId) ?? null;
          },
        },
      }),
    ["policy_planner_work_refused"],
  );
  assert.equal(missingGrantReads, 0);
  assert.equal(transportCalls, 0);
  assert.equal(missing.model_invocation_receipt, null);
  assert.equal(missing.run_receipt, null);
  assert.equal(readLedger(missingInput.run_id), null);
  assert.equal(countRunReceiptsForRun(missingInput.run_id), 0);

  const crossProjectInput = runInput(
    fixture,
    {
      run_id: "run:work-cross-project",
      work_id: "work:work-cross-project",
      grant_id: "grant:work-cross-project",
      execution_mode: "live",
    },
    { persist_work: false },
  );
  seedCanonicalWorkItem(fixture.projectBId, crossProjectInput.work_id);
  grants.set(crossProjectInput.grant_id, grantFor(crossProjectInput));
  const crossProject = await assertPolicyError(
    () =>
      runPolicyTriggeredPlannerV01(
        crossProjectInput,
        dependencies(grants, adapter),
      ),
    ["policy_planner_work_refused"],
  );
  assert.equal(transportCalls, 0);
  assert.equal(crossProject.model_invocation_receipt, null);
  assert.equal(crossProject.run_receipt, null);
  assert.equal(readLedger(crossProjectInput.run_id), null);

  const noncanonicalInput = runInput(
    fixture,
    {
      run_id: "run:work-noncanonical",
      work_id: "work:work-noncanonical",
      grant_id: "grant:work-noncanonical",
      execution_mode: "live",
    },
    { persist_work: false },
  );
  insertRawWorkItem(fixture.projectAId, noncanonicalInput.work_id.toLowerCase());
  noncanonicalInput.work_id = noncanonicalInput.work_id.toLowerCase();
  grants.set(noncanonicalInput.grant_id, grantFor(noncanonicalInput));
  await assertPolicyError(
    () =>
      runPolicyTriggeredPlannerV01(
        noncanonicalInput,
        dependencies(grants, adapter),
      ),
    ["policy_planner_work_refused"],
  );
  assert.equal(transportCalls, 0);
  assert.equal(readLedger(noncanonicalInput.run_id), null);

  const ambiguousInput = runInput(
    fixture,
    {
      run_id: "run:work-ambiguous",
      work_id: "work:work-ambiguous",
      grant_id: "grant:work-ambiguous",
      execution_mode: "live",
    },
    { persist_work: false },
  );
  insertRawWorkItem(fixture.projectAId, ambiguousInput.work_id);
  insertRawWorkItem(fixture.projectAId, ambiguousInput.work_id.toLowerCase());
  grants.set(ambiguousInput.grant_id, grantFor(ambiguousInput));
  await assertPolicyError(
    () =>
      runPolicyTriggeredPlannerV01(
        ambiguousInput,
        dependencies(grants, adapter),
      ),
    ["policy_planner_work_refused"],
  );
  assert.equal(transportCalls, 0);
  assert.equal(readLedger(ambiguousInput.run_id), null);
  return { cases: 5, transport_calls: transportCalls };
}

async function atomicActiveRunClaimRace(
  fixture: Fixture,
  grants: Map<string, ModelInvocationCapabilityGrantV01>,
) {
  const first = runInput(fixture, {
    run_id: "run:atomic-claim-a",
    work_id: "work:atomic-claim-a",
    grant_id: "grant:atomic-claim-a",
    execution_mode: "live",
  });
  const second = runInput(fixture, {
    run_id: "run:atomic-claim-b",
    work_id: "work:atomic-claim-b",
    grant_id: "grant:atomic-claim-b",
    execution_mode: "live",
  });
  grants.set(first.grant_id, grantFor(first));
  grants.set(second.grant_id, grantFor(second));

  let releaseGrantReads!: () => void;
  const grantReadBarrier = new Promise<void>((resolve) => {
    releaseGrantReads = resolve;
  });
  let grantReadCount = 0;
  let observeRace!: () => void;
  const raceObserved = new Promise<void>((resolve) => {
    observeRace = resolve;
  });
  let releaseTransport!: () => void;
  const transportBarrier = new Promise<void>((resolve) => {
    releaseTransport = resolve;
  });
  let transportCalls = 0;
  const adapter = createOpenAIResponsesAdapterV01({
    environment: { OPENAI_API_KEY: HOSTILE },
    async transport() {
      transportCalls += 1;
      if (transportCalls > 1) observeRace();
      await transportBarrier;
      return plannerSuccess();
    },
  });
  const grantAuthority = {
    async read(grantId: string) {
      grantReadCount += 1;
      if (grantReadCount === 2) releaseGrantReads();
      await grantReadBarrier;
      return grants.get(grantId) ?? null;
    },
  };
  const before = authoritativeMutationCounts();
  const invoke = (input: PolicyTriggeredPlannerRunInputV01, label: string) => {
    const base = dependencies(grants, adapter);
    return runPolicyTriggeredPlannerV01(input, {
      ...base,
      grant_authority: grantAuthority,
      open_database() {
        const database = new Database(databasePath);
        database.pragma("foreign_keys = ON");
        return database;
      },
      create_uuid: () => `atomic-claim-${label}`,
    }).then(
      (value) => ({ status: "fulfilled" as const, value }),
      (reason: unknown) => {
        observeRace();
        return { status: "rejected" as const, reason };
      },
    );
  };
  const firstPending = invoke(first, "a");
  const secondPending = invoke(second, "b");
  let observationTimeout: ReturnType<typeof setTimeout> | null = null;
  try {
    await Promise.race([
      raceObserved,
      new Promise<never>((_, reject) => {
        observationTimeout = setTimeout(
          () => reject(new Error("atomic claim race did not settle")),
          2_000,
        );
      }),
    ]);
  } finally {
    if (observationTimeout) clearTimeout(observationTimeout);
    releaseTransport();
  }
  const outcomes = await Promise.all([firstPending, secondPending]);
  const winners = outcomes.filter(
    (outcome): outcome is Extract<(typeof outcomes)[number], { status: "fulfilled" }> =>
      outcome.status === "fulfilled",
  );
  const losers = outcomes.filter(
    (outcome): outcome is Extract<(typeof outcomes)[number], { status: "rejected" }> =>
      outcome.status === "rejected",
  );
  assert.equal(grantReadCount, 2);
  assert.equal(winners.length, 1);
  assert.equal(losers.length, 1);
  assert.equal(transportCalls, 1);
  const loser = losers[0]!.reason;
  assert(loser instanceof PolicyTriggeredPlannerRunErrorV01);
  assert.equal(loser.code, "policy_planner_admission_refused");
  assert.equal(loser.admission_status, "active_run_limit");
  assert.equal(loser.model_invocation_receipt, null);
  assert.equal(loser.run_receipt, null);

  const database = openDatabase();
  try {
    const runIds = [first.run_id, second.run_id];
    const placeholders = runIds.map(() => "?").join(", ");
    const runCount = Number(
      (
        database
          .prepare(
            `SELECT COUNT(*) AS count FROM autonomy_runs WHERE run_id IN (${placeholders})`,
          )
          .get(...runIds) as { count: number }
      ).count,
    );
    const stepCount = Number(
      (
        database
          .prepare(
            `SELECT COUNT(*) AS count FROM autonomy_run_steps WHERE run_id IN (${placeholders})`,
          )
          .get(...runIds) as { count: number }
      ).count,
    );
    const eventCount = Number(
      (
        database
          .prepare(
            `SELECT COUNT(*) AS count FROM autonomy_run_events WHERE run_id IN (${placeholders})`,
          )
          .get(...runIds) as { count: number }
      ).count,
    );
    assert.equal(runCount, 1);
    assert.equal(stepCount, 1);
    assert.equal(eventCount, 5);
    assert.equal(
      runIds.reduce((total, runId) => total + countRunReceiptsForRun(runId), 0),
      1,
    );
  } finally {
    database.close();
  }
  const after = authoritativeMutationCounts();
  assert.equal(after.semantic_state, before.semantic_state);
  assert.equal(after.proposals, before.proposals);
  assert.equal(after.approvals, before.approvals);
  assert.equal(after.run_receipts, before.run_receipts + 1);
  assert.equal(after.autonomy_runs, before.autonomy_runs + 1);
  return {
    requests: 2,
    winners: winners.length,
    refusals: losers.length,
    transport_calls: transportCalls,
  };
}

async function refusalMatrix(
  fixture: Fixture,
  grants: Map<string, ModelInvocationCapabilityGrantV01>,
  adapter: ReturnType<typeof createOpenAIResponsesAdapterV01>,
  transportCalls: () => number,
) {
  const cases: Array<{
    name: string;
    mutate?: (grant: ModelInvocationCapabilityGrantBuilderInputV01) => void;
    request?: (input: PolicyTriggeredPlannerRunInputV01) => void;
    tamper?: (grant: ModelInvocationCapabilityGrantV01) => void;
    omit?: boolean;
  }> = [
    { name: "missing", omit: true },
    { name: "unknown", omit: true },
    {
      name: "wrong-workspace",
      mutate: (grant) => {
        grant.workspace_id = "workspace:44444444-4444-4444-8444-444444444444";
      },
    },
    { name: "wrong-project", mutate: (grant) => { grant.project_id = fixture.projectBId; } },
    { name: "wrong-work", mutate: (grant) => { grant.work_id = "work:other"; } },
    { name: "wrong-run", mutate: (grant) => { grant.run_id = "run:other"; } },
    { name: "wrong-purpose", mutate: (grant) => { grant.permitted_purposes = ["observe_delta_compile"]; } },
    { name: "wrong-mode", mutate: (grant) => { grant.permitted_execution_modes = ["deterministic"]; } },
    { name: "expired", mutate: (grant) => { grant.expires_at = "2026-07-15T00:00:00.000Z"; grant.issued_at = "2026-07-14T00:00:00.000Z"; } },
    { name: "revoked", mutate: (grant) => { grant.status = "revoked"; } },
    { name: "capability-unavailable", mutate: (grant) => { grant.capability_status = "unavailable"; } },
    { name: "budget", mutate: (grant) => { grant.max_input_bytes = 1_024; } },
    { name: "timeout", mutate: (grant) => { grant.max_timeout_ms = 100; } },
    {
      name: "run-budget",
      request: (input) => {
        input.run_budget.max_output_tokens = 1;
      },
    },
    { name: "control-revision", mutate: (grant) => { grant.automation_control_revision += 1; } },
    {
      name: "self-expanding-grant",
      tamper: (grant) => {
        (grant as unknown as Record<string, unknown>).can_expand_own_authority = true;
      },
    },
  ];
  for (const testCase of cases) {
    const input = runInput(fixture, {
      run_id: `run:refusal-${testCase.name}`,
      work_id: `work:refusal-${testCase.name}`,
      grant_id: `grant:refusal-${testCase.name}`,
      execution_mode: "live",
    });
    testCase.request?.(input);
    if (!testCase.omit) {
      const builder = grantBuilder(input);
      testCase.mutate?.(builder);
      const grant = buildModelInvocationCapabilityGrantV01(builder);
      testCase.tamper?.(grant);
      grants.set(input.grant_id, grant);
    }
    const before = transportCalls();
    await assertPolicyError(
      () => runPolicyTriggeredPlannerV01(input, dependencies(grants, adapter)),
      ["policy_planner_grant_refused", "policy_planner_control_revision_refused"],
    );
    assert.equal(transportCalls(), before, `${testCase.name} must not transport`);
    assert.equal(readLedger(input.run_id), null);
  }
  const accessorInput = runInput(fixture, {
    run_id: "run:refusal-accessor",
    work_id: "work:refusal-accessor",
    grant_id: "grant:refusal-accessor",
    execution_mode: "live",
  });
  Object.defineProperty(accessorInput, "message", {
    enumerable: true,
    get() {
      throw new Error(HOSTILE);
    },
  });
  const callsBeforeAccessor = transportCalls();
  await assertPolicyError(
    () => runPolicyTriggeredPlannerV01(accessorInput, dependencies(grants, adapter)),
    ["policy_planner_request_invalid"],
  );
  assert.equal(transportCalls(), callsBeforeAccessor);

  const callerBooleanInput = {
    ...runInput(fixture, {
      run_id: "run:refusal-caller-boolean",
      work_id: "work:refusal-caller-boolean",
      grant_id: "grant:refusal-caller-boolean",
      execution_mode: "live",
    }),
    grant_valid: true,
  } as unknown as PolicyTriggeredPlannerRunInputV01;
  await assertPolicyError(
    () =>
      runPolicyTriggeredPlannerV01(
        callerBooleanInput,
        dependencies(grants, adapter),
      ),
    ["policy_planner_request_invalid"],
  );
  assert.equal(transportCalls(), callsBeforeAccessor);
}

async function activeRunLimitRefusal(
  fixture: Fixture,
  grants: Map<string, ModelInvocationCapabilityGrantV01>,
  adapter: ReturnType<typeof createOpenAIResponsesAdapterV01>,
  transportCalls: () => number,
) {
  const blocker = createAutonomyRun({
    dbPath: databasePath,
    run_id: "run:active-policy-blocker",
    scope: fixture.projectAId,
    metadata: { invocation_origin: "policy_triggered" },
  });
  const input = runInput(fixture, {
    run_id: "run:active-limit-refusal",
    work_id: "work:active-limit-refusal",
    grant_id: "grant:active-limit-refusal",
    execution_mode: "live",
  });
  grants.set(input.grant_id, grantFor(input));
  const before = transportCalls();
  await assertPolicyError(
    () => runPolicyTriggeredPlannerV01(input, dependencies(grants, adapter)),
    ["policy_planner_admission_refused"],
  );
  assert.equal(transportCalls(), before);
  assert.equal(readLedger(input.run_id), null);
  updateAutonomyRunLedgerFields(
    blocker.run_id,
    {
      status: "completed",
      finished_at: "2026-07-16T00:30:00.000Z",
      updated_at: "2026-07-16T00:30:00.000Z",
      stop_reason: "test_complete",
    },
    { dbPath: databasePath },
  );
}

async function admissionRefusalCases(
  fixture: Fixture,
  activeSelectionRevision: number,
  grants: Map<string, ModelInvocationCapabilityGrantV01>,
  adapter: ModelAdapterV01,
  transportCalls: () => number,
) {
  const notConfiguredInput = {
    ...runInput(fixture, {
      run_id: "run:admission-not-configured",
      work_id: "work:admission-not-configured",
      grant_id: "grant:admission-not-configured",
      execution_mode: "live" as const,
    }),
    project_id: fixture.projectBId,
    project_root: fixture.projectBRoot,
    automation_control_revision: 1,
  };
  seedCanonicalWorkItem(fixture.projectBId, notConfiguredInput.work_id);
  grants.set(
    notConfiguredInput.grant_id,
    grantFor(notConfiguredInput),
  );
  const beforeNotConfigured = transportCalls();
  await assertPolicyError(
    () =>
      runPolicyTriggeredPlannerV01(
        notConfiguredInput,
        dependencies(grants, adapter),
      ),
    ["policy_planner_admission_refused"],
  );
  assert.equal(transportCalls(), beforeNotConfigured);
  assert.equal(readLedger(notConfiguredInput.run_id), null);

  fixture.controlRevision = mutateAutomationControl(
    fixture,
    activeSelectionRevision,
    fixture.controlRevision,
    "pause_automation",
    "2026-07-16T00:21:00.000Z",
  );
  const pausedInput = runInput(fixture, {
    run_id: "run:admission-paused",
    work_id: "work:admission-paused",
    grant_id: "grant:admission-paused",
    execution_mode: "live",
  });
  grants.set(pausedInput.grant_id, grantFor(pausedInput));
  const beforePaused = transportCalls();
  await assertPolicyError(
    () =>
      runPolicyTriggeredPlannerV01(
        pausedInput,
        dependencies(grants, adapter),
      ),
    ["policy_planner_admission_refused"],
  );
  assert.equal(transportCalls(), beforePaused);
  assert.equal(readLedger(pausedInput.run_id), null);

  fixture.controlRevision = mutateAutomationControl(
    fixture,
    activeSelectionRevision,
    fixture.controlRevision,
    "disable_automation",
    "2026-07-16T00:22:00.000Z",
  );
  const disabledInput = runInput(fixture, {
    run_id: "run:admission-disabled",
    work_id: "work:admission-disabled",
    grant_id: "grant:admission-disabled",
    execution_mode: "live",
  });
  grants.set(disabledInput.grant_id, grantFor(disabledInput));
  const beforeDisabled = transportCalls();
  await assertPolicyError(
    () =>
      runPolicyTriggeredPlannerV01(
        disabledInput,
        dependencies(grants, adapter),
      ),
    ["policy_planner_admission_refused"],
  );
  assert.equal(transportCalls(), beforeDisabled);
  assert.equal(readLedger(disabledInput.run_id), null);

  fixture.controlRevision = mutateAutomationControl(
    fixture,
    activeSelectionRevision,
    fixture.controlRevision,
    "enable_automation",
    "2026-07-16T00:23:00.000Z",
  );
}

function mutateAutomationControl(
  fixture: Fixture,
  activeSelectionRevision: number,
  expectedControlRevision: number,
  action: "pause_automation" | "disable_automation" | "enable_automation",
  now: string,
) {
  const database = openDatabase();
  try {
    const result = mutateProjectControlV01(
      database,
      {
        workspace_id: fixture.workspaceId,
        project_id: fixture.projectAId,
        action,
        expected_active_project_id: fixture.projectAId,
        expected_active_selection_revision: activeSelectionRevision,
        expected_control_revision: expectedControlRevision,
      },
      { now: () => now },
    );
    assert(result.automation?.control_revision);
    return result.automation.control_revision;
  } finally {
    database.close();
  }
}

async function lifecycleMappingCases(
  fixture: Fixture,
  grants: Map<string, ModelInvocationCapabilityGrantV01>,
) {
  let providerUnavailableCalls = 0;
  const unavailableInput = runInput(fixture, {
    run_id: "run:lifecycle-provider-unavailable",
    work_id: "work:lifecycle-provider-unavailable",
    grant_id: "grant:lifecycle-provider-unavailable",
    execution_mode: "live",
  });
  grants.set(unavailableInput.grant_id, grantFor(unavailableInput));
  const unavailable = await runPolicyTriggeredPlannerV01(
    unavailableInput,
    dependencies(
      grants,
      createOpenAIResponsesAdapterV01({
        environment: {},
        transport: async () => {
          providerUnavailableCalls += 1;
          return plannerSuccess();
        },
      }),
    ),
  );
  assert.equal(providerUnavailableCalls, 0);
  assert.equal(unavailable.planner, "mock");
  assert.equal(
    unavailable.model_invocation_receipt.selection_reason,
    "provider_unavailable",
  );
  assert.equal(unavailable.run_receipt.execution.status, "completed");

  let rejectedCalls = 0;
  let rejectedBodyReads = 0;
  const rejectedInput = runInput(fixture, {
    run_id: "run:lifecycle-provider-rejected",
    work_id: "work:lifecycle-provider-rejected",
    grant_id: "grant:lifecycle-provider-rejected",
    execution_mode: "live",
  });
  grants.set(rejectedInput.grant_id, grantFor(rejectedInput));
  const rejected = await assertPolicyError(
    () =>
      runPolicyTriggeredPlannerV01(
        rejectedInput,
        dependencies(
          grants,
          createOpenAIResponsesAdapterV01({
            environment: { OPENAI_API_KEY: HOSTILE },
            transport: async () => {
              rejectedCalls += 1;
              return {
                ok: false,
                status: 429,
                async json() {
                  rejectedBodyReads += 1;
                  return { raw_provider_body: HOSTILE };
                },
              };
            },
          }),
        ),
      ),
    ["policy_planner_gateway_failed"],
  );
  assert.equal(rejectedCalls, 1);
  assert.equal(rejectedBodyReads, 0);
  assert.equal(
    rejected.model_invocation_receipt?.failure_code,
    "model_gateway_provider_rejected",
  );
  assert.equal(rejected.run_receipt?.execution.status, "failed");
  assert.equal(readLedger(rejectedInput.run_id)?.status, "failed");
  assert.equal(terminalStepEventType(rejectedInput.run_id), "step_failed");

  let transportFailureCalls = 0;
  const transportFailureInput = runInput(fixture, {
    run_id: "run:lifecycle-transport-failure",
    work_id: "work:lifecycle-transport-failure",
    grant_id: "grant:lifecycle-transport-failure",
    execution_mode: "live",
  });
  grants.set(
    transportFailureInput.grant_id,
    grantFor(transportFailureInput),
  );
  const transportFailure = await assertPolicyError(
    () =>
      runPolicyTriggeredPlannerV01(
        transportFailureInput,
        dependencies(
          grants,
          createOpenAIResponsesAdapterV01({
            environment: { OPENAI_API_KEY: HOSTILE },
            transport: async () => {
              transportFailureCalls += 1;
              throw new Error(HOSTILE);
            },
          }),
        ),
      ),
    ["policy_planner_gateway_failed"],
  );
  assert.equal(transportFailureCalls, 1);
  assert.equal(
    transportFailure.model_invocation_receipt?.failure_code,
    "model_gateway_transport_failed",
  );
  assert.equal(transportFailure.run_receipt?.execution.status, "failed");
  assertNoPrivateMaterial(transportFailure);

  let invalidResponseCalls = 0;
  const invalidResponseInput = runInput(fixture, {
    run_id: "run:lifecycle-provider-response-invalid",
    work_id: "work:lifecycle-provider-response-invalid",
    grant_id: "grant:lifecycle-provider-response-invalid",
    execution_mode: "live",
  });
  grants.set(invalidResponseInput.grant_id, grantFor(invalidResponseInput));
  const invalidResponse = await assertPolicyError(
    () =>
      runPolicyTriggeredPlannerV01(
        invalidResponseInput,
        dependencies(
          grants,
          createOpenAIResponsesAdapterV01({
            environment: { OPENAI_API_KEY: HOSTILE },
            transport: async () => {
              invalidResponseCalls += 1;
              return {
                ok: true,
                status: 200,
                async json() {
                  return { output: [{ type: "message", content: HOSTILE }] };
                },
              };
            },
          }),
        ),
      ),
    ["policy_planner_gateway_failed"],
  );
  assert.equal(invalidResponseCalls, 1);
  assert.equal(
    invalidResponse.model_invocation_receipt?.failure_code,
    "model_gateway_provider_response_invalid",
  );
  assert.equal(invalidResponse.run_receipt?.execution.status, "failed");
  assertNoPrivateMaterial(invalidResponse);

  const deterministicFailureInput = runInput(fixture, {
    run_id: "run:lifecycle-deterministic-failure",
    work_id: "work:lifecycle-deterministic-failure",
    grant_id: "grant:lifecycle-deterministic-failure",
    execution_mode: "deterministic",
  });
  grants.set(
    deterministicFailureInput.grant_id,
    grantFor(deterministicFailureInput, {
      permitted_execution_modes: ["deterministic"],
      provider_egress_allowed: false,
      max_provider_calls: 0,
    }),
  );
  const deterministicFailure = await assertPolicyError(
    () =>
      runPolicyTriggeredPlannerV01(deterministicFailureInput, {
        ...dependencies(
          grants,
          createOpenAIResponsesAdapterV01({ environment: {} }),
        ),
        gateway_dependencies: {
          adapter: createOpenAIResponsesAdapterV01({ environment: {} }),
          deterministic_execute() {
            throw new Error(HOSTILE);
          },
        },
      }),
    ["policy_planner_gateway_failed"],
  );
  assert.equal(
    deterministicFailure.model_invocation_receipt?.failure_code,
    "model_gateway_deterministic_failed",
  );
  assert.equal(
    deterministicFailure.model_invocation_receipt?.egress_attempted,
    false,
  );
  assert.equal(deterministicFailure.run_receipt?.execution.status, "failed");
  assert.equal(
    terminalStepEventType(deterministicFailureInput.run_id),
    "step_failed",
  );
  assertNoPrivateMaterial(deterministicFailure);

  const deterministicTimeoutInput = runInput(fixture, {
    run_id: "run:lifecycle-deterministic-timeout",
    work_id: "work:lifecycle-deterministic-timeout",
    grant_id: "grant:lifecycle-deterministic-timeout",
    execution_mode: "deterministic",
  });
  deterministicTimeoutInput.timeout_ms = 20;
  deterministicTimeoutInput.run_budget.max_timeout_ms = 20;
  grants.set(
    deterministicTimeoutInput.grant_id,
    grantFor(deterministicTimeoutInput, {
      permitted_execution_modes: ["deterministic"],
      provider_egress_allowed: false,
      max_provider_calls: 0,
      max_timeout_ms: 20,
    }),
  );
  const deterministicTimeout = await assertPolicyError(
    () =>
      runPolicyTriggeredPlannerV01(deterministicTimeoutInput, {
        ...dependencies(
          grants,
          createOpenAIResponsesAdapterV01({ environment: {} }),
        ),
        gateway_dependencies: {
          adapter: createOpenAIResponsesAdapterV01({ environment: {} }),
          deterministic_execute(_input, lifecycle) {
            return new Promise((_resolve, reject) => {
              lifecycle.signal.addEventListener(
                "abort",
                () => reject(new Error(HOSTILE)),
                { once: true },
              );
            });
          },
        },
      }),
    ["policy_planner_gateway_timeout"],
  );
  assert.equal(
    deterministicTimeout.model_invocation_receipt?.failure_code,
    "model_gateway_timeout",
  );
  assert.equal(
    deterministicTimeout.model_invocation_receipt?.budget.provider_calls_used,
    0,
  );
  assert.equal(deterministicTimeout.run_receipt?.execution.status, "failed");
  assert.equal(
    terminalStepEventType(deterministicTimeoutInput.run_id),
    "step_failed",
  );
  assertNoPrivateMaterial(deterministicTimeout);

  let deterministicStarted!: () => void;
  const deterministicReady = new Promise<void>((resolve) => {
    deterministicStarted = resolve;
  });
  const deterministicCancellationInput = runInput(fixture, {
    run_id: "run:lifecycle-deterministic-cancelled",
    work_id: "work:lifecycle-deterministic-cancelled",
    grant_id: "grant:lifecycle-deterministic-cancelled",
    execution_mode: "deterministic",
  });
  const deterministicCancellationController = new AbortController();
  deterministicCancellationInput.cancellation_signal =
    deterministicCancellationController.signal;
  grants.set(
    deterministicCancellationInput.grant_id,
    grantFor(deterministicCancellationInput, {
      permitted_execution_modes: ["deterministic"],
      provider_egress_allowed: false,
      max_provider_calls: 0,
    }),
  );
  const deterministicCancelled = await assertPolicyError(
    async () => {
      const pending = runPolicyTriggeredPlannerV01(
        deterministicCancellationInput,
        {
          ...dependencies(
            grants,
            createOpenAIResponsesAdapterV01({ environment: {} }),
          ),
          gateway_dependencies: {
            adapter: createOpenAIResponsesAdapterV01({ environment: {} }),
            deterministic_execute(_input, lifecycle) {
              deterministicStarted();
              return new Promise((_resolve, reject) => {
                lifecycle.signal.addEventListener(
                  "abort",
                  () => reject(new Error(HOSTILE)),
                  { once: true },
                );
              });
            },
          },
        },
      );
      await deterministicReady;
      deterministicCancellationController.abort();
      return pending;
    },
    ["policy_planner_gateway_cancelled"],
  );
  assert.equal(
    deterministicCancelled.model_invocation_receipt?.failure_code,
    "model_gateway_cancelled",
  );
  assert.equal(
    deterministicCancelled.model_invocation_receipt?.budget.provider_calls_used,
    0,
  );
  assert.equal(
    deterministicCancelled.run_receipt?.execution.status,
    "cancelled",
  );
  assert.equal(
    terminalStepEventType(deterministicCancellationInput.run_id),
    "step_cancelled",
  );
  assertNoPrivateMaterial(deterministicCancelled);

  let cancelledBeforeTransportCalls = 0;
  const preCancelledInput = runInput(fixture, {
    run_id: "run:lifecycle-pre-cancelled",
    work_id: "work:lifecycle-pre-cancelled",
    grant_id: "grant:lifecycle-pre-cancelled",
    execution_mode: "live",
  });
  const preCancelledController = new AbortController();
  preCancelledController.abort();
  preCancelledInput.cancellation_signal = preCancelledController.signal;
  grants.set(preCancelledInput.grant_id, grantFor(preCancelledInput));
  const preCancelled = await assertPolicyError(
    () =>
      runPolicyTriggeredPlannerV01(
        preCancelledInput,
        dependencies(
          grants,
          createOpenAIResponsesAdapterV01({
            environment: { OPENAI_API_KEY: HOSTILE },
            transport: async () => {
              cancelledBeforeTransportCalls += 1;
              return plannerSuccess();
            },
          }),
        ),
      ),
    ["policy_planner_gateway_cancelled"],
  );
  assert.equal(cancelledBeforeTransportCalls, 0);
  assert.equal(preCancelled.run_receipt?.execution.status, "cancelled");
  assert.equal(readLedger(preCancelledInput.run_id)?.status, "cancelled");

  const prepareTimeoutInput = runInput(fixture, {
    run_id: "run:lifecycle-prepare-timeout",
    work_id: "work:lifecycle-prepare-timeout",
    grant_id: "grant:lifecycle-prepare-timeout",
    execution_mode: "live",
  });
  prepareTimeoutInput.timeout_ms = 250;
  prepareTimeoutInput.run_budget.max_timeout_ms = 250;
  grants.set(
    prepareTimeoutInput.grant_id,
    grantFor(prepareTimeoutInput, { max_timeout_ms: 250 }),
  );
  let prepareStarted!: () => void;
  const prepareReady = new Promise<void>((resolve) => {
    prepareStarted = resolve;
  });
  const prepareTimeoutAdapter: ModelAdapterV01 = {
    describe() {
      return {
        implementation_id: "test.policy_prepare_timeout",
        implementation_version: "test_policy_prepare_timeout.v0.1",
      };
    },
    prepare(_purpose, signal) {
      prepareStarted();
      return new Promise<ModelAdapterSessionV01 | null>((resolve) => {
        signal.addEventListener("abort", () => resolve(null), { once: true });
      });
    },
  };
  const prepareTimeout = await assertPolicyError(
    async () => {
      const pending = runPolicyTriggeredPlannerV01(
        prepareTimeoutInput,
        dependencies(grants, prepareTimeoutAdapter),
      );
      await prepareReady;
      assert.equal(
        listIncompleteRuns(fixture.projectAId).some(
          (run) => run.run_id === prepareTimeoutInput.run_id,
        ),
        true,
      );
      const reconciled = tickAutonomyRun({
        run_id: prepareTimeoutInput.run_id,
        dbPath: databasePath,
        now: "2026-07-16T00:40:00.000Z",
      });
      assert.equal(reconciled.status, "running");
      return pending;
    },
    ["policy_planner_gateway_timeout"],
  );
  assert.equal(prepareTimeout.model_invocation_receipt?.egress_attempted, false);
  assert.equal(
    prepareTimeout.model_invocation_receipt?.budget.provider_calls_used,
    0,
  );
  assert.equal(prepareTimeout.run_receipt?.execution.status, "failed");
  assert.equal(
    readLedger(prepareTimeoutInput.run_id)?.stop_reason,
    "model_gateway_timeout",
  );
  assert.equal(
    listIncompleteRuns(fixture.projectAId).some(
      (run) => run.run_id === prepareTimeoutInput.run_id,
    ),
    false,
  );

  let timeoutTransportCalls = 0;
  const transportTimeoutInput = runInput(fixture, {
    run_id: "run:lifecycle-transport-timeout",
    work_id: "work:lifecycle-transport-timeout",
    grant_id: "grant:lifecycle-transport-timeout",
    execution_mode: "live",
  });
  transportTimeoutInput.timeout_ms = 20;
  transportTimeoutInput.run_budget.max_timeout_ms = 20;
  grants.set(
    transportTimeoutInput.grant_id,
    grantFor(transportTimeoutInput, { max_timeout_ms: 20 }),
  );
  const transportTimeout = await assertPolicyError(
    () =>
      runPolicyTriggeredPlannerV01(
        transportTimeoutInput,
        dependencies(
          grants,
          createOpenAIResponsesAdapterV01({
            environment: { OPENAI_API_KEY: HOSTILE },
            async transport(request) {
              timeoutTransportCalls += 1;
              await new Promise<void>((_resolve, reject) => {
                request.signal.addEventListener(
                  "abort",
                  () => reject(new Error(HOSTILE)),
                  { once: true },
                );
              });
              return plannerSuccess();
            },
          }),
        ),
      ),
    ["policy_planner_gateway_timeout"],
  );
  assert.equal(timeoutTransportCalls, 1);
  assert.equal(transportTimeout.model_invocation_receipt?.egress_attempted, true);
  assert.equal(transportTimeout.run_receipt?.execution.status, "failed");

  let cancellationTransportCalls = 0;
  let signalTransportStarted!: () => void;
  const transportStarted = new Promise<void>((resolve) => {
    signalTransportStarted = resolve;
  });
  const transportCancellationInput = runInput(fixture, {
    run_id: "run:lifecycle-transport-cancelled",
    work_id: "work:lifecycle-transport-cancelled",
    grant_id: "grant:lifecycle-transport-cancelled",
    execution_mode: "live",
  });
  const transportCancellationController = new AbortController();
  transportCancellationInput.cancellation_signal =
    transportCancellationController.signal;
  grants.set(
    transportCancellationInput.grant_id,
    grantFor(transportCancellationInput),
  );
  const transportCancelled = await assertPolicyError(
    async () => {
      const pending = runPolicyTriggeredPlannerV01(
        transportCancellationInput,
        dependencies(
          grants,
          createOpenAIResponsesAdapterV01({
            environment: { OPENAI_API_KEY: HOSTILE },
            async transport(request) {
              cancellationTransportCalls += 1;
              signalTransportStarted();
              await new Promise<void>((_resolve, reject) => {
                request.signal.addEventListener(
                  "abort",
                  () => reject(new Error(HOSTILE)),
                  { once: true },
                );
              });
              return plannerSuccess();
            },
          }),
        ),
      );
      await transportStarted;
      transportCancellationController.abort();
      return pending;
    },
    ["policy_planner_gateway_cancelled"],
  );
  assert.equal(cancellationTransportCalls, 1);
  assert.equal(transportCancelled.run_receipt?.execution.status, "cancelled");
  assert.equal(
    readLedger(transportCancellationInput.run_id)?.status,
    "cancelled",
  );

  let budgetRefusalTransportCalls = 0;
  const budgetInput = runInput(fixture, {
    run_id: "run:lifecycle-budget-refusal",
    work_id: "work:lifecycle-budget-refusal",
    grant_id: "grant:lifecycle-budget-refusal",
    execution_mode: "live",
  });
  budgetInput.invocation_budget.max_input_bytes = 1;
  budgetInput.run_budget.max_input_bytes = 1;
  grants.set(budgetInput.grant_id, grantFor(budgetInput, { max_input_bytes: 1 }));
  const budgetRefusal = await assertPolicyError(
    () =>
      runPolicyTriggeredPlannerV01(
        budgetInput,
        dependencies(
          grants,
          createOpenAIResponsesAdapterV01({
            environment: { OPENAI_API_KEY: HOSTILE },
            transport: async () => {
              budgetRefusalTransportCalls += 1;
              return plannerSuccess();
            },
          }),
        ),
      ),
    ["policy_planner_gateway_blocked"],
  );
  assert.equal(budgetRefusalTransportCalls, 0);
  assert.equal(budgetRefusal.run_receipt?.execution.status, "blocked");
  assert.equal(readLedger(budgetInput.run_id)?.status, "blocked");
  assert.equal(terminalStepEventType(budgetInput.run_id), "step_blocked");
}

function dependencies(
  grants: Map<string, ModelInvocationCapabilityGrantV01>,
  adapter: ModelAdapterV01,
) {
  let tick = 0;
  return {
    grant_authority: {
      read(grantId: string) {
        return grants.get(grantId) ?? null;
      },
    },
    gateway_dependencies: { adapter },
    create_uuid: () => `policy-test-${tick}`,
    now: () => new Date(Date.UTC(2026, 6, 16, 0, 0, tick++)),
  };
}

function grantFor(
  input: PolicyTriggeredPlannerRunInputV01,
  overrides: Partial<ModelInvocationCapabilityGrantBuilderInputV01> = {},
) {
  return buildModelInvocationCapabilityGrantV01({
    ...grantBuilder(input),
    ...overrides,
  });
}

function grantBuilder(
  input: PolicyTriggeredPlannerRunInputV01,
): ModelInvocationCapabilityGrantBuilderInputV01 {
  return {
    grant_id: input.grant_id,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    work_id: input.work_id,
    run_id: input.run_id,
    automation_control_revision: input.automation_control_revision,
    permitted_purposes: ["planner_plan"],
    permitted_execution_modes: [input.execution_mode],
    provider_egress_allowed: input.execution_mode === "live",
    max_provider_calls: input.execution_mode === "live" ? 1 : 0,
    max_input_bytes: 98_304,
    max_output_tokens: 2_048,
    max_timeout_ms: 30_000,
    allowed_data_classifications: ["private"],
    issued_at: "2026-07-15T00:00:00.000Z",
    expires_at: "2026-07-17T00:00:00.000Z",
    status: "active",
    capability_status: "available",
  };
}

function runInput(
  fixture: Fixture,
  identity: Pick<
    PolicyTriggeredPlannerRunInputV01,
    "run_id" | "work_id" | "grant_id" | "execution_mode"
  >,
  options: {
    persist_work?: boolean;
    work_project_id?: string;
  } = {},
): PolicyTriggeredPlannerRunInputV01 {
  const live = identity.execution_mode === "live";
  const workId = normalizeWorkId(identity.work_id);
  if (options.persist_work !== false) {
    seedCanonicalWorkItem(
      options.work_project_id ?? fixture.projectAId,
      workId,
    );
  }
  return {
    workspace_id: fixture.workspaceId,
    project_id: fixture.projectAId,
    ...identity,
    work_id: workId,
    automation_control_revision: fixture.controlRevision,
    message: "Plan the same canonical advisory next step.",
    invocation_budget: {
      max_input_bytes: 98_304,
      max_output_tokens: 2_048,
      max_provider_calls: live ? 1 : 0,
    },
    run_budget: {
      max_input_bytes: 98_304,
      max_output_tokens: 2_048,
      max_provider_calls: live ? 1 : 0,
      max_timeout_ms: 30_000,
    },
    timeout_ms: 30_000,
    project_root: fixture.projectARoot,
  };
}

function seedCanonicalWorkItem(projectId: string, workId: string) {
  const canonicalWorkId = normalizeWorkId(workId);
  insertRawWorkItem(projectId, canonicalWorkId);
  const database = openDatabase();
  try {
    const resolution = resolveCanonicalWorkItemFromDatabase(
      database,
      canonicalWorkId,
      projectId,
    );
    assert.equal(resolution.status, "resolved");
    return canonicalWorkId;
  } finally {
    database.close();
  }
}

function insertRawWorkItem(projectId: string, workId: string) {
  const database = openDatabase();
  try {
    database
      .prepare(
        `INSERT INTO work_items (
          work_id, scope, title, status, priority, summary, next_action,
          user_attention_required, related_state_keys, links, created_at, updated_at
        ) VALUES (?, ?, ?, 'planned', 'normal', ?, ?, 0, '[]', '{}', ?, ?)
        ON CONFLICT(scope, work_id) DO NOTHING`,
      )
      .run(
        workId,
        projectId,
        `Policy model test work ${workId}`,
        "Canonical project-scoped work fixture for policy model execution.",
        "Run one bounded advisory Planner step.",
        "2026-07-15T00:00:00.000Z",
        "2026-07-15T00:00:00.000Z",
      );
  } finally {
    database.close();
  }
}

function setupProjectsAndControl() {
  const database = new Database(databasePath);
  database.pragma("foreign_keys = ON");
  applyCanonicalDatabaseMigrations(database);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(database, {
    create_uuid: () => "11111111-1111-4111-8111-111111111111",
    now: () => "2026-07-15T00:00:00.000Z",
  });
  const rootA = normalizeLocalProjectRootRefV01(projectARoot, {
    base_path: root,
  });
  const rootB = normalizeLocalProjectRootRefV01(projectBRoot, {
    base_path: root,
  });
  const projectA = getOrCreateCanonicalProjectForLocalRootV01(
    database,
    {
      workspace_id: workspace.workspace_id,
      local_root: rootA,
      display_name: "same-name",
    },
    {
      create_uuid: () => "22222222-2222-4222-8222-222222222222",
      now: () => "2026-07-15T00:00:01.000Z",
    },
  );
  const projectB = getOrCreateCanonicalProjectForLocalRootV01(
    database,
    {
      workspace_id: workspace.workspace_id,
      local_root: rootB,
      display_name: "same-name",
    },
    {
      create_uuid: () => "33333333-3333-4333-8333-333333333333",
      now: () => "2026-07-15T00:00:02.000Z",
    },
  );
  for (const [projectId, now] of [
    [projectA.project.project_id, "2026-07-15T00:00:03.000Z"],
    [projectB.project.project_id, "2026-07-15T00:00:04.000Z"],
  ] as const) {
    touchRecentProjectV01(database, {
      workspace_id: workspace.workspace_id,
      project_id: projectId,
      now,
    });
  }
  const activeA = selectActiveProjectV01(database, {
    workspace_id: workspace.workspace_id,
    project_id: projectA.project.project_id,
    expected_project_id: null,
    expected_revision: null,
    now: "2026-07-15T00:00:05.000Z",
  });
  const control = mutateProjectControlV01(
    database,
    {
      workspace_id: workspace.workspace_id,
      project_id: projectA.project.project_id,
      action: "enable_automation",
      expected_active_project_id: projectA.project.project_id,
      expected_active_selection_revision: activeA.selection_revision,
      expected_control_revision: null,
    },
    { now: () => "2026-07-15T00:00:06.000Z" },
  );
  const activeB = selectActiveProjectV01(database, {
    workspace_id: workspace.workspace_id,
    project_id: projectB.project.project_id,
    expected_project_id: projectA.project.project_id,
    expected_revision: activeA.selection_revision,
    now: "2026-07-15T00:00:07.000Z",
  });
  database.close();
  assert(control.automation);
  return {
    workspaceId: workspace.workspace_id,
    projectAId: projectA.project.project_id,
    projectBId: projectB.project.project_id,
    projectARoot: {
      path_flavor: rootA.path_flavor,
      normalized_path: rootA.normalized_path,
    },
    projectBRoot: {
      path_flavor: rootB.path_flavor,
      normalized_path: rootB.normalized_path,
    },
    controlRevision: control.automation.control_revision!,
    activeProjectBRevision: activeB.selection_revision,
  };
}

type Fixture = ReturnType<typeof setupProjectsAndControl>;

function activateProjectA(fixture: Fixture) {
  const database = openDatabase();
  try {
    return selectActiveProjectV01(database, {
      workspace_id: fixture.workspaceId,
      project_id: fixture.projectAId,
      expected_project_id: fixture.projectBId,
      expected_revision: fixture.activeProjectBRevision,
      now: "2026-07-16T00:20:00.000Z",
    }).selection_revision;
  } finally {
    database.close();
  }
}

function authoritativeMutationCounts() {
  const database = openDatabase();
  try {
    const count = (sql: string) =>
      Number((database.prepare(sql).get() as { count: number }).count);
    return {
      semantic_state: count("SELECT COUNT(*) AS count FROM vnext_semantic_state_entries"),
      proposals: count("SELECT COUNT(*) AS count FROM state_delta_proposals"),
      approvals: count(
        "SELECT COUNT(*) AS count FROM vnext_core_records WHERE record_kind = 'review_decision'",
      ),
      run_receipts: count("SELECT COUNT(*) AS count FROM vnext_core_records WHERE record_kind = 'run_receipt'"),
      autonomy_runs: count("SELECT COUNT(*) AS count FROM autonomy_runs"),
    };
  } finally {
    database.close();
  }
}

function readLedger(runId: string) {
  return readAutonomyRunLedgerRecord(runId, { dbPath: databasePath });
}

function terminalStepEventType(runId: string) {
  const ledger = readLedger(runId);
  return ledger?.events.findLast(
    (event) =>
      event.step_id !== null &&
      [
        "step_completed",
        "step_blocked",
        "step_failed",
        "step_cancelled",
      ].includes(event.event_type),
  )?.event_type;
}

function listIncompleteRuns(projectId: string) {
  const database = openDatabase();
  try {
    return listIncompletePolicyTriggeredModelRunsV01(database, {
      project_id: projectId,
    });
  } finally {
    database.close();
  }
}

function countRunReceiptsForRun(runId: string) {
  const database = openDatabase();
  try {
    return Number(
      (
        database
          .prepare(
            `SELECT COUNT(*) AS count FROM vnext_core_records
             WHERE record_kind = 'run_receipt'
               AND json_extract(payload_json, '$.run_id') = ?`,
          )
          .get(runId) as { count: number }
      ).count,
    );
  } finally {
    database.close();
  }
}

async function assertPolicyError(
  invoke: () => Promise<unknown>,
  codes: PolicyTriggeredPlannerRunErrorV01["code"][],
) {
  let captured: unknown = null;
  try {
    await invoke();
  } catch (error) {
    captured = error;
  }
  assert(captured instanceof PolicyTriggeredPlannerRunErrorV01);
  assert(codes.includes(captured.code), `${captured.code} not in ${codes.join(",")}`);
  assertNoPrivateMaterial(captured);
  return captured;
}

function plannerSuccess() {
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        status: "completed",
        output_text: JSON.stringify({
          recommendations: [
            {
              title: "Review the bounded advisory result",
              rationale: "The fake provider result remains review-only.",
              tool_name: null,
              priority: "next",
              grounded_state_keys: ["product.name"],
            },
          ],
        }),
        usage: {
          input_tokens: 17,
          output_tokens: 9,
          total_tokens: 26,
        },
      };
    },
  };
}

function assertNoPrivateMaterial(value: unknown) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  assert.equal(serialized.includes(HOSTILE), false);
  assert.equal(serialized.includes(projectARoot), false);
  assert.equal(serialized.includes(projectBRoot), false);
  assert.equal(serialized.includes("Authorization"), false);
  assert.equal(serialized.includes('"raw_prompt":'), false);
  assert.equal(serialized.includes("recommendations\":"), false);
}
