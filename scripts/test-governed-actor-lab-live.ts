#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  mkdirSync,
  existsSync,
  readFileSync,
  readFileSync as readTextSync,
  readdirSync,
  lstatSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { governedActorLabLiveCasebookFixture } from "@/fixtures/vnext/protocol/governed-actor-lab-live-v0-1";
import { createGovernedActorLabManifestV01 } from "@/fixtures/vnext/protocol/governed-actor-lab-v0-1";
import {
  beginGovernedActorLabLiveCohortAttemptV01,
  prepareGovernedActorLabLiveArtifactRunV01,
  resolveGovernedActorLabArtifactPathV01,
  writeGovernedActorLabLiveCohortArtifactsV01,
  type GovernedActorLabLiveAttemptJournalV01,
} from "@/lib/vnext/governed-actor-lab-artifact-store";
import {
  buildGovernedActorLabLiveIncompleteResultFromJournalV01,
  buildGovernedActorLabLiveCohortManifestV01,
  createGovernedActorLabLiveInitialAuthorizationV01,
  createGovernedActorLabLiveReplacementAuthorizationV01,
  evaluateGovernedActorLabLiveOutputV01,
  runGovernedActorLabLiveCohortV01,
  validateGovernedActorLabLiveCohortResultV01,
  validateGovernedActorLabLiveIncompleteResultV01,
} from "@/lib/vnext/governed-actor-lab-live";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  invokeGovernedActorLabModelGatewayV01,
  prepareGovernedActorLabModelGatewayRouteV01,
  readModelGatewayInteractiveAdmissionForRootV01,
} from "@/lib/vnext/model-gateway/model-gateway";
import {
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  ModelGatewayInvocationErrorV01,
  isModelGatewayInvocationErrorV01,
  type GovernedActorLabModelInvocationEnvelopeV01,
  type ModelAdapterV01,
} from "@/lib/vnext/model-gateway/contracts";
import {
  createOpenAIResponsesAdapterV01,
  type OpenAIResponsesTransportRequestV01,
  type OpenAIResponsesTransportV01,
} from "@/lib/vnext/model-gateway/openai/responses-adapter";
import {
  buildModelGatewayCostAuthorityV01,
  buildModelGatewayCostBudgetV01,
} from "@/lib/vnext/model-gateway/cost-authority";
import { validateModelInvocationReceiptV02 } from "@/lib/vnext/model-gateway/model-invocation-receipt";
import {
  parseGovernedActorLabOutputV01,
  validateGovernedActorLabModelInputV01,
} from "@/lib/vnext/model-gateway/openai/governed-actor-lab-codec";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
  normalizeLocalProjectRootRefV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import {
  selectActiveProjectV01,
  touchRecentProjectV01,
} from "@/lib/vnext/persistence/project-lifecycle-registry";
import type {
  GovernedActorLabLiveCaseV01,
  GovernedActorLabLiveExecutionResultV01,
  GovernedActorLabLiveInvocationBindingV01,
  GovernedActorLabLiveModelInputV01,
  GovernedActorLabLiveModelOutputV01,
  GovernedActorLabLivePeerArtifactV01,
} from "@/types/vnext/governed-actor-lab-live";
import type { ModelInvocationReceiptV02 } from "@/types/vnext/model-invocation-receipt";

const root = mkdtempSync(path.join(tmpdir(), "augnes-governed-actor-live-"));
const repositoryRoot = path.join(root, "repository");
const databasePath = path.join(root, "gateway.db");
const projectRoot = path.join(root, "registered-project");
const credentialSentinel = "test-credential-never-persist";
let focusedInvocationCounter = 0;

function replacementAuthorizationV01(
  sourceHead: string,
  overrides: Partial<Parameters<
    typeof createGovernedActorLabLiveReplacementAuthorizationV01
  >[0]> = {},
) {
  return createGovernedActorLabLiveReplacementAuthorizationV01({
    replacement_source_head: sourceHead,
    historical_source_head: "84df543e53ae64f42245e97bd445577e53148c1f",
    historical_cohort_id: "live-cohort:6bd6bc3c1805d1cb3696376a22185e3a",
    historical_result: "incomplete",
    historical_terminal_reason: "actor_lab_no_selection_evidence",
    authorized_replacement_count: 1,
    retry_of_historical_cohort: false,
    historical_artifacts_rewritten: false,
    further_cohort_authorized: false,
    ...overrides,
  });
}

void main().catch((error) => {
  console.error("governed_actor_lab_live_test_failed");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}).finally(() => {
  rmSync(root, { recursive: true, force: true });
});

async function main() {
  mkdirSync(repositoryRoot, { recursive: true });
  mkdirSync(projectRoot, { recursive: true });
  writeFileSync(path.join(repositoryRoot, ".gitignore"), ".augnes-lab/\n", "utf8");
  initializeDatabaseV01();
  const admission = registerProjectV01();
  assert.deepEqual(
    readModelGatewayInteractiveAdmissionForRootV01(projectRoot, {
      open_database: () => new Database(databasePath),
    }),
    admission,
    "the read-only Gateway helper must resolve the exact registered root and active selection",
  );
  const casebook = structuredClone(governedActorLabLiveCasebookFixture);
  const c1Manifest = createGovernedActorLabManifestV01();
  const casesById = new Map(
    [...casebook.development_cases, ...casebook.hidden_holdout.cases].map(
      (entry) => [entry.actor_visible.case_id, entry],
    ),
  );
  const capturedRequests: OpenAIResponsesTransportRequestV01[] = [];
  const successTransport = providerTransportV01(casesById, capturedRequests);
  const adapter = createOpenAIResponsesAdapterV01({
    environment: {
      OPENAI_API_KEY: credentialSentinel,
      OPENAI_MODEL: "governed-actor-test-model",
    },
    transport: successTransport,
  });
  const route = await prepareGovernedActorLabModelGatewayRouteV01({ adapter });
  assert.ok(route, "the non-egress adapter preparation must resolve one route");
  const sourceHead = "a".repeat(40);
  const built = buildGovernedActorLabLiveCohortManifestV01({
    source_repository_head_sha: sourceHead,
    authorization_lineage: replacementAuthorizationV01(sourceHead),
    c1_manifest: c1Manifest,
    casebook,
    route,
  });
  assert.equal(built.call_plan.entries.length, 140);
  assert.deepEqual(
    [...new Set(built.call_plan.entries.map((entry) => entry.arm))],
    [
      "single_strong_actor",
      "nonpersistent_compute_matched_ensemble",
      "persistent_population_no_evolution",
      "persistent_evolutionary_population",
      "disposable_curated_knowledge",
    ],
  );
  assert.equal(
    built.call_plan.entries.filter((entry) => entry.phase === "challenge_synthesis").length,
    60,
  );
  assert.equal(
    built.call_plan.entries.filter((entry) => entry.generation === "holdout").length,
    20,
  );
  assert.ok(
    built.call_plan.entries.every((entry, index) => entry.call_order === index),
    "call ordering must be exact and gap-free",
  );
  for (const entry of built.call_plan.entries.filter(
    (candidate) => candidate.phase === "challenge_synthesis",
  )) {
    assert.equal(
      entry.peer_slot,
      `slot-${(Number(entry.actor_slot.slice(-1)) + 1) % 4}`,
      "peer selection must depend on stable slot order, not actor iteration order",
    );
  }

  const preflight = prepareGovernedActorLabLiveArtifactRunV01({
    repository_root: repositoryRoot,
    cohort_id: built.manifest.cohort_id,
    run_label: "first-cohort",
  });
  assert.equal(readFileSync(path.join(repositoryRoot, ".gitignore"), "utf8"), ".augnes-lab/\n");
  assert.ok(preflight.relative_run_root.startsWith(".augnes-lab/perspective-evolution/live-cohorts/"));
  const liveJournal = beginGovernedActorLabLiveCohortAttemptV01({
    repository_root: repositoryRoot,
    run_label: "first-cohort",
    result_identity: built,
  });

  let maximumConcurrent = 0;
  let active = 0;
  let gatewayStarts = 0;
  let firstEnvelope: GovernedActorLabModelInvocationEnvelopeV01 | null = null;
  const result = await runGovernedActorLabLiveCohortV01(
    {
      source_repository_head_sha: sourceHead,
      authorization_lineage: replacementAuthorizationV01(sourceHead),
      c1_manifest: c1Manifest,
      casebook,
      route,
      admission,
    },
    {
      async invoke_gateway(envelope, dependencies) {
        if (gatewayStarts > 0) {
          assert.ok(
            existsSync(
              path.join(
                liveJournal.run_root,
                "invocations",
                `${String(gatewayStarts - 1).padStart(3, "0")}.json`,
              ),
            ),
            "the prior finalized binding must be durable before the next provider slot",
          );
        }
        gatewayStarts += 1;
        firstEnvelope ??= envelope as GovernedActorLabModelInvocationEnvelopeV01;
        active += 1;
        maximumConcurrent = Math.max(maximumConcurrent, active);
        try {
          return await invokeGovernedActorLabModelGatewayV01(envelope, dependencies);
        } finally {
          active -= 1;
        }
      },
      gateway_dependencies: {
        adapter,
        open_database: () => new Database(databasePath),
        read_root_availability: async () => "available",
      },
      on_binding_finalized(binding) {
        liveJournal.append_binding(binding);
      },
      on_checkpoint_finalized(checkpoint) {
        liveJournal.append_checkpoint(checkpoint);
      },
    },
  );
  if (result.result_kind !== "complete") {
    assert.fail("the successful 140-call mock lane must be complete");
  }
  assert.equal(maximumConcurrent, 1);
  assert.equal(capturedRequests.length, 140);
  const successfulMockCalls = capturedRequests.length;
  assert.equal(result.report.accounting.planned_calls, 140);
  assert.equal(result.report.accounting.attempted_provider_calls, 140);
  assert.equal(result.report.accounting.completed_live_calls, 140);
  assert.equal(result.report.accounting.provider_rejected, 0);
  assert.equal(result.report.accounting.dependency_missing, 0);
  assert.equal(result.report.accounting.pricing_status, "unpriced_unknown");
  assert.equal(result.report.accounting.exact_cost, null);
  assert.equal(result.report.stochastic_repeatability, "unmeasured_single_cohort");
  assert.equal(result.report.non_dominance.status, "determined");
  assert.ok(result.report.non_dominance.non_dominated_arms.length > 0);
  assert.equal(result.report.global_winner_created, false);
  assert.equal(result.report.product_promotion_created, false);
  assert.equal(result.report.hidden_holdout.evaluator_answers_sent_to_provider, false);
  assert.equal(result.report.hidden_holdout.post_holdout_memory_writes, 0);
  assert.equal(result.report.hidden_holdout.post_holdout_mutations, 0);
  assert.ok(
    result.report.arms.find((arm) => arm.arm === "persistent_population_no_evolution")!
      .memory_admissions.length > 0,
  );
  assert.ok(
    result.report.arms.find((arm) => arm.arm === "persistent_evolutionary_population")!
      .population_transitions.length === 2,
  );
  assert.ok(
    result.invocation_bindings
      .filter((binding) => binding.arm === "disposable_curated_knowledge")
      .every((binding) => binding.curated_material_refs.length === 3),
    "the curated representation must be present on the actual live execution path",
  );
  assert.ok(
    result.invocation_bindings.every(
      (binding) =>
        binding.model_invocation_receipt?.raw_prompt_persisted === false &&
        binding.model_invocation_receipt.raw_response_persisted === false &&
        binding.model_invocation_receipt.hidden_reasoning_persisted === false,
    ),
  );
  const resealedTamper = structuredClone(result);
  resealedTamper.report.non_dominance.non_dominated_arms = [];
  const { integrity: _priorIntegrity, ...reportWithoutIntegrity } = resealedTamper.report;
  resealedTamper.report.integrity.fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(reportWithoutIntegrity),
  );
  assert.throws(
    () => validateGovernedActorLabLiveCohortResultV01(resealedTamper),
    /governed_actor_lab_live_comparison_derivation_invalid/u,
    "resealing a tampered non-dominance projection must not make it valid",
  );

  for (const [index, request] of capturedRequests.entries()) {
    const body = JSON.parse(request.body) as Record<string, any>;
    assert.equal(body.store, false);
    assert.equal(body.max_output_tokens, 512);
    assert.equal(body.text.format.strict, true);
    const userMaterial = body.input[1].content[0].text as string;
    assert.ok(!userMaterial.includes(admission.workspace_id));
    assert.ok(!userMaterial.includes(admission.project_id));
    assert.ok(!userMaterial.includes("evaluator_only"));
    assert.ok(!userMaterial.includes("expected_result_token"));
    assert.ok(!userMaterial.includes(credentialSentinel));
    if (index < 120) {
      for (const holdout of casebook.hidden_holdout.cases) {
        assert.ok(!userMaterial.includes(holdout.actor_visible.case_id));
        assert.ok(!userMaterial.includes(holdout.actor_visible.task_text));
      }
    }
  }

  const artifactSummary = liveJournal.finalize(result);
  assert.ok(artifactSummary.artifact_count > 145);
  assert.equal(artifactSummary.product_database_writes, 0);
  assert.equal(artifactSummary.core_writes, 0);
  assert.equal(artifactSummary.tracked_repository_files_written, false);
  const artifactText = readAllArtifactsV01(artifactSummary.run_root);
  assert.ok(!artifactText.includes(credentialSentinel));
  assert.ok(!artifactText.includes('"Authorization":'));
  assert.ok(!artifactText.includes("Bearer "));
  assert.ok(!artifactText.includes(projectRoot));
  assert.throws(
    () => writeGovernedActorLabLiveCohortArtifactsV01({
      repository_root: repositoryRoot,
      run_label: "first-cohort",
      result,
    }),
    /actor_lab_run_root_not_clean/u,
  );
  const markedAttempt = beginGovernedActorLabLiveCohortAttemptV01({
    repository_root: repositoryRoot,
    run_label: "single-attempt-marker",
    result_identity: result,
  });
  assert.ok(markedAttempt.attempt_fingerprint.startsWith("sha256:"));
  assert.throws(
    () => beginGovernedActorLabLiveCohortAttemptV01({
      repository_root: repositoryRoot,
      run_label: "single-attempt-marker",
      result_identity: result,
    }),
    /actor_lab_run_root_not_clean/u,
  );
  appendResultToJournalV01(markedAttempt, result);
  const markedSummary = markedAttempt.finalize(result);
  assert.equal(markedSummary.report_fingerprint, result.report.integrity.fingerprint);
  assert.throws(
    () => resolveGovernedActorLabArtifactPathV01(preflight.lab_root, "..", "escape"),
    /actor_lab_artifact_segment_invalid/u,
  );

  assert.ok(firstEnvelope);
  await runGatewayRefusalCasesV01({
    envelope: firstEnvelope,
    adapter,
    admission,
    route,
    casesById,
  });
  await runIncompleteCohortCaseV01({
    sourceHead,
    c1Manifest,
    casebook,
    route,
    admission,
    casesById,
  });
  await runRouteDriftCohortCaseV01({
    sourceHead,
    c1Manifest,
    casebook,
    route,
    admission,
    adapter,
  });
  runEvaluationAndPeerContractCasesV01({
    result,
    casebook,
    firstEnvelope,
  });
  const terminalResult = await runSelectionAndArmTerminalCasesV01({
    sourceHead,
    c1Manifest,
    casebook,
    route,
    admission,
    casesById,
  });
  const adverseResult = await runCompleteAdverseEvidenceCasesV01({
    sourceHead,
    c1Manifest,
    casebook,
    route,
    admission,
    casesById,
  });
  runReplacementAuthorizationCasesV01({
    sourceHead,
    c1Manifest,
    casebook,
    route,
    built,
  });
  runRunnerAuthorizationCliCasesV01(sourceHead);
  await runUnknownInternalErrorCasesV01({
    sourceHead,
    c1Manifest,
    casebook,
    route,
    admission,
    adapter,
    successfulReceipt: result.invocation_bindings[0]!.model_invocation_receipt!,
  });
  runJournalCrashAndTamperCasesV01({
    result,
    terminalResult,
    adverseResult,
  });
  runSourcePurityCasesV01(artifactText);

  console.log(JSON.stringify({
    status: "governed_actor_lab_live_non_live_tests_passed",
    planned_calls: 140,
    successful_mock_cohort_calls: successfulMockCalls,
    complete_adverse_mock_cohort_calls: 420,
    additional_fake_transport_calls: capturedRequests.length - successfulMockCalls,
    max_parallel_provider_calls: maximumConcurrent,
    artifact_count: artifactSummary.artifact_count,
    report_fingerprint: artifactSummary.report_fingerprint,
    real_provider_calls: 0,
  }));
}

async function runGatewayRefusalCasesV01(input: {
  envelope: GovernedActorLabModelInvocationEnvelopeV01;
  adapter: ReturnType<typeof createOpenAIResponsesAdapterV01>;
  admission: ReturnType<typeof registerProjectV01>;
  route: NonNullable<Awaited<ReturnType<typeof prepareGovernedActorLabModelGatewayRouteV01>>>;
  casesById: Map<string, GovernedActorLabLiveCaseV01>;
}) {
  const base = () => ({
    ...input.envelope,
    invocation_id: `model-invocation:focused-${focusedInvocationCounter++}`,
    cancellation: { signal: new AbortController().signal },
  });
  let transportCalls = 0;
  const countingAdapter = createOpenAIResponsesAdapterV01({
    environment: { OPENAI_API_KEY: credentialSentinel, OPENAI_MODEL: "governed-actor-test-model" },
    transport: async (request) => {
      transportCalls += 1;
      return providerTransportV01(input.casesById, [])(request);
    },
  });
  const dependencies = {
    adapter: countingAdapter,
    open_database: () => new Database(databasePath),
    read_root_availability: async () => "available" as const,
    expected_governed_actor_lab_route: input.route,
  };
  await expectGatewayFailureV01(
    { ...base(), data_classification: "private" },
    dependencies,
    "model_gateway_invalid_envelope",
  );
  await expectGatewayFailureV01(
    { ...base(), data_classification: "local_only" },
    dependencies,
    "model_gateway_invalid_envelope",
  );
  const providerControlled = base() as any;
  providerControlled.input = { ...providerControlled.input, provider: "forbidden" };
  await expectGatewayFailureV01(
    providerControlled,
    dependencies,
    "model_gateway_invalid_envelope",
  );
  assert.equal(transportCalls, 0, "classification and provider-control refusals precede egress");

  const unavailableAdapter = createOpenAIResponsesAdapterV01({
    environment: { OPENAI_MODEL: "governed-actor-test-model" },
    transport: async () => {
      throw new Error("unreachable");
    },
  });
  await expectGatewayFailureV01(
    base(),
    { ...dependencies, adapter: unavailableAdapter },
    "model_gateway_transport_failed",
  );
  assert.equal(transportCalls, 0, "credential-unavailable preflight uses zero egress and no fallback");

  const cancelled = base();
  const cancellation = new AbortController();
  cancellation.abort();
  cancelled.cancellation = { signal: cancellation.signal };
  await expectGatewayFailureV01(cancelled, dependencies, "model_gateway_cancelled");
  assert.equal(transportCalls, 0, "pre-egress cancellation must not call transport");

  const sourceInventingAdapter = createOpenAIResponsesAdapterV01({
    environment: { OPENAI_API_KEY: credentialSentinel, OPENAI_MODEL: "governed-actor-test-model" },
    transport: async () => ({
      ok: true,
      status: 200,
      async json() {
        return {
          status: "completed",
          output_text: JSON.stringify({
            result_token: input.envelope.input.actor_visible_case.allowed_result_tokens[0],
            claim_candidates: [{
              claim_token: input.envelope.input.actor_visible_case.claim_candidates[0]!.claim_token,
              source_tokens: ["src:invented"],
            }],
            uncertainties: [],
            abstention: false,
            challenge_response: {
              peer_claim_tokens_considered: [],
              accepted_peer_claim_tokens: [],
              rejected_peer_claim_tokens: [],
            },
            referenced_memory_tokens: [],
            referenced_curated_tokens: [],
            synthesis_token: input.envelope.input.actor_visible_case.allowed_result_tokens[0],
          }),
          usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 },
        };
      },
    }),
  });
  await expectGatewayFailureV01(
    base(),
    { ...dependencies, adapter: sourceInventingAdapter },
    "model_gateway_provider_response_invalid",
  );

  const oversizedAdapter = createOpenAIResponsesAdapterV01({
    environment: { OPENAI_API_KEY: credentialSentinel, OPENAI_MODEL: "governed-actor-test-model" },
    transport: async () => ({
      ok: true,
      status: 200,
      async json() {
        return { status: "completed", output_text: "x".repeat(8_193), usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2 } };
      },
    }),
  });
  await expectGatewayFailureV01(
    base(),
    { ...dependencies, adapter: oversizedAdapter },
    "model_gateway_provider_response_invalid",
  );

  const changedRoute = {
    ...input.route,
    model_ref: { ...input.route.model_ref, external_id: "changed-route-model" },
  };
  await expectGatewayFailureV01(
    base(),
    { ...dependencies, expected_governed_actor_lab_route: changedRoute },
    "model_gateway_budget_refused",
  );

  const costAuthority = buildModelGatewayCostAuthorityV01({
    authority_kind: "provider_model_pricing_snapshot",
    workspace_id: input.admission.workspace_id,
    project_id: input.admission.project_id,
    purpose: "governed_actor_lab",
    provider_ref: input.route.provider_ref,
    model_ref: input.route.model_ref,
    cost_unit: "synthetic-microunit",
    input_rate: { unit: "utf8_byte", cost_per_unit: 1 },
    output_rate: { unit: "token", cost_per_unit: 1 },
    pricing_source_version: "synthetic-pricing.v0.1",
    pricing_effective_at: "2026-01-01T00:00:00.000Z",
    pricing_expires_at: null,
    project_model_policy_fingerprint:
      "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  });
  const costBudget = buildModelGatewayCostBudgetV01({
    authority: costAuthority,
    workspace_id: input.admission.workspace_id,
    project_id: input.admission.project_id,
    purpose: "governed_actor_lab",
    provider_ref: input.route.provider_ref,
    model_ref: input.route.model_ref,
    maximum_input_units: 24_576,
    maximum_output_units: 512,
    timeout_ms: 30_000,
    maximum_permitted_cost: 25_088,
    evaluated_at: "2026-08-04T00:00:00.000Z",
  });
  const pricedEnvelope = base();
  pricedEnvelope.budget = { ...pricedEnvelope.budget, cost_budget: costBudget };
  const priced = await invokeGovernedActorLabModelGatewayV01(
    pricedEnvelope,
    dependencies,
  );
  assert.equal(priced.model_invocation_receipt.cost.source, "provider_cost_not_reported");
  assert.equal(priced.model_invocation_receipt.cost.amount, null);

  const validInput = validateGovernedActorLabModelInputV01(input.envelope.input);
  const directOutput = providerOutputV01(
    input.casesById.get(validInput.actor_visible_case.case_id)!,
    validInput,
  );
  const invented = structuredClone(directOutput);
  invented.claim_candidates[0]!.source_tokens = ["src:invented"];
  assert.throws(
    () => parseGovernedActorLabOutputV01(JSON.stringify(invented), validInput),
    /governed_actor_lab_output_invalid/u,
  );
}

async function runIncompleteCohortCaseV01(input: {
  sourceHead: string;
  c1Manifest: ReturnType<typeof createGovernedActorLabManifestV01>;
  casebook: typeof governedActorLabLiveCasebookFixture;
  route: NonNullable<Awaited<ReturnType<typeof prepareGovernedActorLabModelGatewayRouteV01>>>;
  admission: ReturnType<typeof registerProjectV01>;
  casesById: Map<string, GovernedActorLabLiveCaseV01>;
}) {
  let transportCalls = 0;
  const transport = providerTransportV01(input.casesById, []);
  const adapter = createOpenAIResponsesAdapterV01({
    environment: { OPENAI_API_KEY: credentialSentinel, OPENAI_MODEL: "governed-actor-test-model" },
    transport: async (request) => {
      transportCalls += 1;
      if (transportCalls === 1) {
        return { ok: false, status: 429, async json() { return {}; } };
      }
      return transport(request);
    },
  });
  const result = await runGovernedActorLabLiveCohortV01(
    {
      source_repository_head_sha: input.sourceHead,
      authorization_lineage: replacementAuthorizationV01(input.sourceHead),
      c1_manifest: input.c1Manifest,
      casebook: structuredClone(input.casebook),
      route: input.route,
      admission: input.admission,
    },
    {
      gateway_dependencies: {
        adapter,
        open_database: () => new Database(databasePath),
        read_root_availability: async () => "available",
      },
    },
  );
  if (result.result_kind !== "truthful_incomplete") {
    assert.fail("provider rejection must produce a truthful incomplete result");
  }
  assert.equal(
    transportCalls,
    138,
    "one failed blind slot blocks its own synthesis and the adjacent exact-peer synthesis and is never retried",
  );
  assert.equal(result.report.accounting.provider_rejected, 1);
  assert.equal(result.report.accounting.dependency_missing, 2);
  assert.equal(result.report.accounting.attempted_provider_calls, 138);
  assert.equal(result.report.accounting.completed_live_calls, 137);
  assert.equal(result.report.non_dominance.status, "undetermined");
  assert.equal(
    result.report.arms.find((arm) => arm.arm === "single_strong_actor")!.status,
    "incomplete",
  );
}

async function runRouteDriftCohortCaseV01(input: {
  sourceHead: string;
  c1Manifest: ReturnType<typeof createGovernedActorLabManifestV01>;
  casebook: typeof governedActorLabLiveCasebookFixture;
  route: NonNullable<Awaited<ReturnType<typeof prepareGovernedActorLabModelGatewayRouteV01>>>;
  admission: ReturnType<typeof registerProjectV01>;
  adapter: ReturnType<typeof createOpenAIResponsesAdapterV01>;
}) {
  const driftedAdapter: ModelAdapterV01 = {
    describe: input.adapter.describe,
    async prepare(purpose, signal) {
      const session = await input.adapter.prepare(purpose, signal);
      return session
        ? {
            ...session,
            implementation_version: "drifted_governed_actor_lab_adapter.v0.1",
          }
        : null;
    },
  };
  const result = await runGovernedActorLabLiveCohortV01(
    {
      source_repository_head_sha: input.sourceHead,
      authorization_lineage: replacementAuthorizationV01(input.sourceHead),
      c1_manifest: input.c1Manifest,
      casebook: structuredClone(input.casebook),
      route: input.route,
      admission: input.admission,
    },
    {
      gateway_dependencies: {
        adapter: driftedAdapter,
        open_database: () => new Database(databasePath),
        read_root_availability: async () => "available",
      },
    },
  );
  if (result.result_kind !== "truthful_incomplete") {
    assert.fail("route drift must produce a truthful incomplete result");
  }
  assert.equal(result.report.accounting.attempted_provider_calls, 0);
  assert.equal(result.report.accounting.route_changed, 140);
  assert.equal(result.report.accounting.provider_model_consistent, false);
  assert.equal(result.report.non_dominance.status, "undetermined");
}

function runEvaluationAndPeerContractCasesV01(input: {
  result: Extract<GovernedActorLabLiveExecutionResultV01, { result_kind: "complete" }>;
  casebook: typeof governedActorLabLiveCasebookFixture;
  firstEnvelope: GovernedActorLabModelInvocationEnvelopeV01;
}): void {
  const liveCase = input.casebook.development_cases[1];
  const binding = input.result.invocation_bindings.find(
    (candidate) =>
      candidate.arm === "single_strong_actor" &&
      candidate.generation === 1 &&
      candidate.phase === "challenge_synthesis" &&
      candidate.actor_slot === "slot-0",
  )!;
  const peerBlind = input.result.invocation_bindings.find(
    (candidate) =>
      candidate.arm === binding.arm &&
      candidate.generation === binding.generation &&
      candidate.phase === "blind_solve" &&
      candidate.actor_slot === binding.peer_slot,
  )!;
  const peerArtifact = peerArtifactFromBindingV01(peerBlind);
  const evaluate = (
    candidate: GovernedActorLabLiveInvocationBindingV01,
    peer: GovernedActorLabLivePeerArtifactV01 | null = peerArtifact,
  ) => evaluateGovernedActorLabLiveOutputV01({
    arm: candidate.arm,
    generation: candidate.generation,
    slot: candidate.actor_slot,
    liveCase,
    binding: candidate,
    peerArtifact: peer,
  });

  const mismatch = cloneBindingWithOutputV01(binding, (output) => {
    output.synthesis_token = liveCase.actor_visible.allowed_result_tokens.find(
      (token) => token !== liveCase.evaluator_only.expected_result_token,
    )!;
  });
  const mismatchEvaluation = evaluate(mismatch);
  assert.equal(mismatchEvaluation.status, "fail");
  assert.deepEqual(mismatchEvaluation.hard_gate_failure_codes, []);
  assert.ok(
    mismatchEvaluation.evaluation_failure_codes.includes(
      "expected_result_mismatch",
    ),
  );

  const supportMiss = cloneBindingWithOutputV01(binding, (output) => {
    output.claim_candidates.forEach((claim) => {
      claim.source_tokens = [];
    });
  });
  const supportEvaluation = evaluate(supportMiss);
  assert.equal(supportEvaluation.hard_gate_failure, false);
  assert.ok(
    supportEvaluation.evaluation_failure_codes.includes(
      "required_support_missing",
    ),
  );

  const peerIgnored = cloneBindingWithOutputV01(binding, (output) => {
    output.challenge_response = {
      peer_claim_tokens_considered: [],
      accepted_peer_claim_tokens: [],
      rejected_peer_claim_tokens: [],
    };
  });
  const peerIgnoredEvaluation = evaluate(peerIgnored);
  assert.equal(peerIgnoredEvaluation.hard_gate_failure, false);
  assert.ok(
    peerIgnoredEvaluation.evaluation_failure_codes.includes(
      "peer_challenge_not_considered",
    ),
  );

  const harmfulForbidden = cloneBindingWithOutputV01(binding, (output) => {
    output.claim_candidates.push({
      claim_token: liveCase.evaluator_only.forbidden_claim_tokens[0]!,
      source_tokens: [liveCase.actor_visible.evidence_snippets[0]!.source_token],
    });
  });
  const harmfulEvaluation = evaluate(harmfulForbidden);
  assert.equal(harmfulEvaluation.hard_gate_failure, true);
  assert.deepEqual(harmfulEvaluation.hard_gate_failure_codes, [
    "forbidden_unsupported_claim",
  ]);
  assert.equal(
    harmfulEvaluation.required_checks_passed,
    harmfulEvaluation.checks.filter((check) => check.result === "pass").length,
    "required-check accounting must derive from explicit predicate results",
  );

  const unknown = structuredClone(binding);
  unknown.normalized_output = null;
  unknown.normalized_output_fingerprint = null;
  unknown.invocation_status = "provider_rejected";
  const unknownEvaluation = evaluate(unknown);
  assert.equal(unknownEvaluation.status, "unknown");
  assert.equal(unknownEvaluation.required_checks_passed, null);
  assert.ok(unknownEvaluation.checks.every((check) => check.result === "unknown"));

  const zeroPeer = { ...peerArtifact, claim_candidates: [] };
  const zeroPeerBinding = cloneBindingWithOutputV01(binding, (output) => {
    output.challenge_response = {
      peer_claim_tokens_considered: [],
      accepted_peer_claim_tokens: [],
      rejected_peer_claim_tokens: [],
    };
  });
  const zeroPeerEvaluation = evaluate(zeroPeerBinding, zeroPeer);
  const peerCheck = zeroPeerEvaluation.checks.find(
    (check) => check.check_code === "peer_challenge_not_considered",
  )!;
  assert.equal(peerCheck.result, "pass");
  assert.equal(peerCheck.basis, "no_addressable_peer_claim");

  const blindInput = validateGovernedActorLabModelInputV01(
    input.firstEnvelope.input,
  );
  const ownArtifact = { ...peerArtifact, peer_artifact_ref: "peer:own" };
  const oneClaimPeer = {
    ...peerArtifact,
    peer_artifact_ref: "peer:challenge",
    claim_candidates: peerArtifact.claim_candidates.slice(0, 1),
  };
  const challengeInput = validateGovernedActorLabModelInputV01({
    ...blindInput,
    phase: "challenge_synthesis",
    own_blind_artifact: ownArtifact,
    peer_challenge_artifact: oneClaimPeer,
  });
  const addressed = providerOutputV01(input.casebook.development_cases[0], challengeInput);
  assert.deepEqual(
    parseGovernedActorLabOutputV01(JSON.stringify(addressed), challengeInput)
      .challenge_response.peer_claim_tokens_considered,
    oneClaimPeer.claim_candidates.map((claim) => claim.claim_token),
  );
  const inventedPeer = structuredClone(addressed);
  inventedPeer.challenge_response.peer_claim_tokens_considered = ["peer:invented"];
  assert.throws(
    () => parseGovernedActorLabOutputV01(JSON.stringify(inventedPeer), challengeInput),
    /governed_actor_lab_output_invalid/u,
  );
  const zeroClaimInput = validateGovernedActorLabModelInputV01({
    ...challengeInput,
    own_blind_artifact: { ...ownArtifact, claim_candidates: [] },
    peer_challenge_artifact: { ...oneClaimPeer, claim_candidates: [] },
  });
  const zeroClaimOutput = providerOutputV01(
    input.casebook.development_cases[0],
    zeroClaimInput,
  );
  assert.deepEqual(
    parseGovernedActorLabOutputV01(JSON.stringify(zeroClaimOutput), zeroClaimInput)
      .challenge_response.peer_claim_tokens_considered,
    [],
  );
  const inventedMemory = structuredClone(zeroClaimOutput);
  inventedMemory.referenced_memory_tokens = ["memory:invented"];
  assert.throws(
    () => parseGovernedActorLabOutputV01(JSON.stringify(inventedMemory), zeroClaimInput),
    /governed_actor_lab_output_invalid/u,
  );
}

async function runSelectionAndArmTerminalCasesV01(input: {
  sourceHead: string;
  c1Manifest: ReturnType<typeof createGovernedActorLabManifestV01>;
  casebook: typeof governedActorLabLiveCasebookFixture;
  route: NonNullable<Awaited<ReturnType<typeof prepareGovernedActorLabModelGatewayRouteV01>>>;
  admission: ReturnType<typeof registerProjectV01>;
  casesById: Map<string, GovernedActorLabLiveCaseV01>;
}) {
  const ordinary = await runTransformedMockCohortV01(input, (output, modelInput, liveCase) => {
    if (
      modelInput.invocation_context.arm === "persistent_evolutionary_population" &&
      modelInput.invocation_context.generation === 0 &&
      modelInput.phase === "challenge_synthesis"
    ) {
      output.synthesis_token = liveCase.actor_visible.allowed_result_tokens.find(
        (token) => token !== liveCase.evaluator_only.expected_result_token,
      )!;
    }
    return output;
  });
  if (ordinary.result.result_kind !== "complete") {
    assert.fail("ordinary evaluation failures must not eliminate selection evidence");
  }
  const ordinaryEvolutionary = ordinary.result.report.arms.find(
    (arm) => arm.arm === "persistent_evolutionary_population",
  )!;
  assert.equal(ordinaryEvolutionary.population_transitions.length, 2);
  assert.equal(
    ordinaryEvolutionary.evaluations.filter(
      (evaluation) => evaluation.generation === 0 && evaluation.status === "fail",
    ).length,
    4,
  );
  assert.ok(
    ordinaryEvolutionary.evaluations
      .filter((evaluation) => evaluation.generation === 0)
      .every((evaluation) => evaluation.hard_gate_failure === false),
  );

  const oneHardGate = await runTransformedMockCohortV01(
    input,
    (output, modelInput, liveCase) => {
      if (
        modelInput.invocation_context.arm === "persistent_evolutionary_population" &&
        modelInput.invocation_context.generation === 1 &&
        modelInput.invocation_context.actor_slot === "slot-0" &&
        modelInput.phase === "challenge_synthesis"
      ) addForbiddenClaimV01(output, liveCase);
      return output;
    },
  );
  if (oneHardGate.result.result_kind !== "complete") {
    assert.fail("one safely excluded actor must not poison the arm");
  }
  const continuingEvolution = oneHardGate.result.report.arms.find(
    (arm) => arm.arm === "persistent_evolutionary_population",
  )!;
  assert.ok(
    continuingEvolution.population_transitions[1]!
      .hard_gate_excluded_actor_ids.length >= 1,
  );
  assert.ok(
    continuingEvolution.population_transitions[1]!
      .hard_gate_excluded_actor_ids.every(
        (excluded) =>
          !continuingEvolution.population_transitions[1]!.child_start_memory_refs.some(
            (child) => child.lab_actor_id === excluded,
          ),
      ),
    "C1 selection must not revive an excluded actor",
  );
  assert.equal(continuingEvolution.arm_level_hard_gate.failed, false);
  assert.equal(continuingEvolution.comparison_eligible, true);

  const evolutionaryTerminal = await runTransformedMockCohortV01(
    input,
    (output, modelInput, liveCase) => {
      if (
        modelInput.invocation_context.arm === "persistent_evolutionary_population" &&
        modelInput.invocation_context.generation === 1 &&
        modelInput.phase === "challenge_synthesis"
      ) addForbiddenClaimV01(output, liveCase);
      return output;
    },
  );
  if (evolutionaryTerminal.result.result_kind !== "truthful_incomplete") {
    assert.fail("all-hard-gated evolutionary population must terminate its arm");
  }
  assert.equal(evolutionaryTerminal.calls, 128);
  assert.equal(
    evolutionaryTerminal.result.report.accounting.not_attempted_arm_terminal,
    12,
  );
  assert.deepEqual(
    evolutionaryTerminal.result.report.terminal_arms.map((terminal) => terminal.arm),
    ["persistent_evolutionary_population"],
  );
  assert.ok(
    evolutionaryTerminal.result.arm_terminals.every(
      (terminal) =>
        terminal.excluded_actors_revived === false &&
        terminal.mutation_applied === false,
    ),
  );
  const terminalArm = evolutionaryTerminal.result.report.arms.find(
    (arm) => arm.arm === "persistent_evolutionary_population",
  )!;
  assert.equal(terminalArm.holdout_materialization, "not_materialized_arm_terminal");
  assert.ok(
    evolutionaryTerminal.result.invocation_bindings
      .filter((binding) => binding.invocation_status === "not_attempted_arm_terminal")
      .every(
        (binding) =>
          binding.frozen_actor_ref === null &&
          binding.frozen_private_memory_ref === null &&
          binding.last_terminal_state_ref !== null,
      ),
  );
  assert.ok(
    evolutionaryTerminal.result.report.arms
      .filter((arm) => arm.arm !== "persistent_evolutionary_population")
      .every((arm) => arm.holdout_materialization === "materialized"),
  );
  assert.equal(
    evolutionaryTerminal.captured.some((request) => {
      const material = requestModelMaterialV01(request);
      return material.invocation_context.arm === "persistent_evolutionary_population" &&
        material.phase === "holdout_blind";
    }),
    false,
    "terminal-arm holdout actor-visible material must never reach provider material",
  );

  const allTerminal = await runTransformedMockCohortV01(
    input,
    (output, modelInput, liveCase) => {
      if (
        modelInput.invocation_context.generation === 1 &&
        modelInput.phase === "challenge_synthesis"
      ) addForbiddenClaimV01(output, liveCase);
      return output;
    },
  );
  if (allTerminal.result.result_kind !== "truthful_incomplete") {
    assert.fail("an all-arm terminal cohort must return a truthful incomplete report");
  }
  assert.equal(allTerminal.calls, 80);
  assert.equal(allTerminal.result.report.terminal_arms.length, 5);
  assert.equal(allTerminal.result.report.accounting.not_attempted_arm_terminal, 60);
  assert.equal(allTerminal.result.report.non_dominance.status, "undetermined");

  const zeroClaims = await runTransformedMockCohortV01(
    input,
    (output, modelInput) => {
      if (modelInput.phase === "blind_solve") output.claim_candidates = [];
      output.referenced_memory_tokens = [];
      output.referenced_curated_tokens = [];
      return output;
    },
  );
  if (zeroClaims.result.result_kind !== "complete") {
    assert.fail("zero-claim blind artifacts must not create an impossible peer contract");
  }
  assert.equal(zeroClaims.calls, 140);
  assert.equal(
    zeroClaims.result.report.arms.flatMap((arm) => arm.evaluations).some(
      (evaluation) =>
        evaluation.evaluation_failure_codes.includes(
          "peer_challenge_not_considered",
        ),
    ),
    false,
  );
  const persistent = zeroClaims.result.report.arms.find(
    (arm) => arm.arm === "persistent_population_no_evolution",
  )!;
  assert.ok(persistent.metrics.actor_memory_presented > 0);
  assert.equal(persistent.metrics.actor_memory_explicitly_referenced, 0);
  assert.equal(persistent.metrics.actor_memory_actual_use, null);
  const curated = zeroClaims.result.report.arms.find(
    (arm) => arm.arm === "disposable_curated_knowledge",
  )!;
  assert.ok(curated.metrics.curated_material_presented > 0);
  assert.equal(curated.metrics.curated_material_explicitly_referenced, 0);
  assert.equal(curated.metrics.curated_material_actual_use, null);

  return evolutionaryTerminal.result;
}

async function runCompleteAdverseEvidenceCasesV01(input: {
  sourceHead: string;
  c1Manifest: ReturnType<typeof createGovernedActorLabManifestV01>;
  casebook: typeof governedActorLabLiveCasebookFixture;
  route: NonNullable<Awaited<ReturnType<typeof prepareGovernedActorLabModelGatewayRouteV01>>>;
  admission: ReturnType<typeof registerProjectV01>;
  casesById: Map<string, GovernedActorLabLiveCaseV01>;
}) {
  const ordinary = await runTransformedMockCohortV01(
    input,
    (output, modelInput, liveCase) => {
      if (
        modelInput.invocation_context.arm ===
          "persistent_population_no_evolution" &&
        modelInput.phase === "holdout_blind" &&
        modelInput.invocation_context.actor_slot === "slot-0"
      ) {
        output.result_token = liveCase.actor_visible.allowed_result_tokens.find(
          (token) => token !== liveCase.evaluator_only.expected_result_token,
        )!;
      }
      return output;
    },
  );
  if (ordinary.result.result_kind !== "complete") {
    assert.fail("a fully observed ordinary holdout failure must remain complete");
  }
  const ordinaryArm = ordinary.result.report.arms.find(
    (arm) => arm.arm === "persistent_population_no_evolution",
  )!;
  assert.equal(ordinaryArm.holdout.failed, 1);
  assert.equal(ordinaryArm.arm_level_hard_gate.failed, false);
  assert.equal(ordinaryArm.comparison_eligible, true);
  const ordinaryComparison = ordinary.result.report.comparisons[0];
  assert.ok(ordinaryComparison);
  assert.ok(ordinaryComparison.basis.includes("holdout_passes"));
  assert.ok(!ordinaryComparison.basis.includes("hard_gate_non_compensation"));

  const harmful = await runTransformedMockCohortV01(
    input,
    (output, modelInput, liveCase) => {
      if (
        modelInput.invocation_context.arm ===
          "persistent_population_no_evolution" &&
        modelInput.phase === "holdout_blind" &&
        liveCase.evaluator_only.harmful_transfer_trap
      ) {
        addForbiddenClaimV01(output, liveCase);
      }
      return output;
    },
  );
  if (harmful.result.result_kind !== "complete") {
    assert.fail("fully observed harmful holdout evidence must remain complete");
  }
  const harmfulArm = harmful.result.report.arms.find(
    (arm) => arm.arm === "persistent_population_no_evolution",
  )!;
  assert.equal(harmfulArm.arm_completion_status, "complete");
  assert.equal(harmfulArm.arm_level_hard_gate.failed, true);
  assert.deepEqual(harmfulArm.arm_level_hard_gate.codes, [
    "holdout_selection_disqualifying_output",
  ]);
  assert.equal(harmfulArm.arm_level_hard_gate.basis.length, 1);
  assert.equal(
    harmfulArm.arm_level_hard_gate.basis[0]?.evaluation_fingerprints.length,
    2,
  );
  assert.equal(harmfulArm.comparison_eligible, true);
  const harmfulComparison = harmful.result.report.comparisons[0];
  assert.equal(harmfulComparison?.status, "right_better");
  assert.deepEqual(harmfulComparison?.basis, ["hard_gate_non_compensation"]);
  assert.equal(
    harmful.result.report.non_dominance.non_dominated_arms.includes(
      "persistent_population_no_evolution",
    ),
    false,
  );

  const bothHardGated = await runTransformedMockCohortV01(
    input,
    (output, modelInput, liveCase) => {
      if (
        [
          "persistent_population_no_evolution",
          "nonpersistent_compute_matched_ensemble",
        ].includes(modelInput.invocation_context.arm) &&
        modelInput.phase === "holdout_blind" &&
        liveCase.evaluator_only.harmful_transfer_trap
      ) {
        addForbiddenClaimV01(output, liveCase);
      }
      return output;
    },
  );
  if (bothHardGated.result.result_kind !== "complete") {
    assert.fail("complete adverse evidence for two arms must remain complete");
  }
  const bothComparison = bothHardGated.result.report.comparisons[0];
  assert.equal(bothComparison?.status, "undetermined");
  assert.deepEqual(bothComparison?.basis, [
    "both_arms_have_noncompensable_hard_gates",
  ]);
  assert.equal(bothHardGated.calls, 140);

  assert.equal(ordinary.calls, 140);
  assert.equal(harmful.calls, 140);
  return harmful.result;
}

function runReplacementAuthorizationCasesV01(input: {
  sourceHead: string;
  c1Manifest: ReturnType<typeof createGovernedActorLabManifestV01>;
  casebook: typeof governedActorLabLiveCasebookFixture;
  route: NonNullable<Awaited<ReturnType<typeof prepareGovernedActorLabModelGatewayRouteV01>>>;
  built: ReturnType<typeof buildGovernedActorLabLiveCohortManifestV01>;
}): void {
  const historicalInitial = buildGovernedActorLabLiveCohortManifestV01({
    source_repository_head_sha:
      "84df543e53ae64f42245e97bd445577e53148c1f",
    authorization_lineage: createGovernedActorLabLiveInitialAuthorizationV01(
      "84df543e53ae64f42245e97bd445577e53148c1f",
    ),
    c1_manifest: input.c1Manifest,
    casebook: structuredClone(input.casebook),
    route: input.route,
  });
  assert.equal(
    historicalInitial.manifest.authorization_lineage.authorization_kind,
    "initial_authorized_cohort",
  );
  assert.notEqual(
    historicalInitial.manifest.cohort_id,
    input.built.manifest.cohort_id,
  );
  assert.throws(
    () => createGovernedActorLabLiveInitialAuthorizationV01(input.sourceHead),
    /governed_actor_lab_live_authorization_invalid/u,
  );
  assert.throws(
    () => replacementAuthorizationV01(
      "84df543e53ae64f42245e97bd445577e53148c1f",
    ),
    /governed_actor_lab_live_authorization_invalid/u,
  );
  assert.equal(
    input.built.manifest.authorization_lineage.authorization_kind,
    "authorized_replacement_after_historical_incomplete",
  );
  assert.equal(input.built.manifest.authorization_lineage.authorized_replacement_count, 1);
  assert.equal(input.built.manifest.authorization_lineage.retry_of_historical_cohort, false);
  assert.equal(input.built.manifest.authorization_lineage.historical_artifacts_rewritten, false);
  assert.equal(input.built.manifest.authorization_lineage.further_cohort_authorized, false);

  for (const overrides of [
    { historical_source_head: "f".repeat(40) },
    { historical_cohort_id: "live-cohort:wrong" },
    { historical_result: "complete" },
    { historical_terminal_reason: "wrong_reason" },
    { authorized_replacement_count: 2 },
    { retry_of_historical_cohort: true },
    { historical_artifacts_rewritten: true },
    { further_cohort_authorized: true },
  ]) {
    assert.throws(
      () => replacementAuthorizationV01(input.sourceHead, overrides),
      /governed_actor_lab_live_authorization_invalid/u,
    );
  }
  assert.throws(
    () => buildGovernedActorLabLiveCohortManifestV01({
      source_repository_head_sha: input.sourceHead,
      authorization_lineage: undefined as never,
      c1_manifest: input.c1Manifest,
      casebook: structuredClone(input.casebook),
      route: input.route,
    }),
    /governed_actor_lab_live_authorization_invalid/u,
  );
  assert.throws(
    () => buildGovernedActorLabLiveCohortManifestV01({
      source_repository_head_sha: input.sourceHead,
      authorization_lineage: replacementAuthorizationV01("b".repeat(40)),
      c1_manifest: input.c1Manifest,
      casebook: structuredClone(input.casebook),
      route: input.route,
    }),
    /governed_actor_lab_live_authorization_invalid/u,
  );
  const nextSourceHead = "b".repeat(40);
  const next = buildGovernedActorLabLiveCohortManifestV01({
    source_repository_head_sha: nextSourceHead,
    authorization_lineage: replacementAuthorizationV01(nextSourceHead),
    c1_manifest: input.c1Manifest,
    casebook: structuredClone(input.casebook),
    route: input.route,
  });
  assert.notEqual(next.manifest.cohort_id, input.built.manifest.cohort_id);
  assert.notEqual(
    next.manifest.integrity.fingerprint,
    input.built.manifest.integrity.fingerprint,
  );
}

function runRunnerAuthorizationCliCasesV01(sourceHead: string): void {
  const cli = path.join(process.cwd(), "node_modules", "tsx", "dist", "cli.mjs");
  const run = (args: string[]) => spawnSync(
    process.execPath,
    [cli, "scripts/governed-actor-lab-live-cohort.ts", ...args],
    {
      cwd: process.cwd(),
      encoding: "utf8",
      env: {
        ...process.env,
        OPENAI_API_KEY: "",
        OPENAI_MODEL: "",
      },
    },
  );
  const retired = run([
    "--source-head",
    sourceHead,
    "--confirm-first-cohort",
  ]);
  assert.notEqual(retired.status, 0);
  assert.match(retired.stderr, /live_cohort_first_cohort_confirmation_retired/u);
  const implicitInitial = run([
    "--source-head",
    sourceHead,
    "--confirm-authorized-cohort",
    "--authorization-kind",
    "initial_authorized_cohort",
  ]);
  assert.notEqual(implicitInitial.status, 0);
  assert.match(
    implicitInitial.stderr,
    /live_cohort_initial_authorization_already_consumed/u,
  );
  const missingLineage = run([
    "--source-head",
    sourceHead,
    "--confirm-authorized-cohort",
    "--authorization-kind",
    "authorized_replacement_after_historical_incomplete",
  ]);
  assert.notEqual(missingLineage.status, 0);
  assert.match(missingLineage.stderr, /governed_actor_lab_live_authorization_invalid/u);
  const validReplacementPreparation = run([
    "--source-head",
    sourceHead,
    "--confirm-authorized-cohort",
    "--authorization-kind",
    "authorized_replacement_after_historical_incomplete",
    "--historical-source-head",
    "84df543e53ae64f42245e97bd445577e53148c1f",
    "--historical-cohort-id",
    "live-cohort:6bd6bc3c1805d1cb3696376a22185e3a",
    "--historical-result",
    "incomplete",
    "--historical-terminal-reason",
    "actor_lab_no_selection_evidence",
    "--authorized-replacement-count",
    "1",
    "--retry-of-historical-cohort",
    "false",
    "--historical-artifacts-rewritten",
    "false",
    "--further-cohort-authorized",
    "false",
  ]);
  assert.notEqual(validReplacementPreparation.status, 0);
  assert.match(
    validReplacementPreparation.stderr,
    /live_cohort_source_head_mismatch/u,
    "valid replacement lineage must pass parsing and stop before provider preparation on source mismatch",
  );
  assert.doesNotMatch(
    validReplacementPreparation.stderr,
    /authorization_invalid/u,
  );
}

async function runTransformedMockCohortV01(
  input: {
    sourceHead: string;
    c1Manifest: ReturnType<typeof createGovernedActorLabManifestV01>;
    casebook: typeof governedActorLabLiveCasebookFixture;
    route: NonNullable<Awaited<ReturnType<typeof prepareGovernedActorLabModelGatewayRouteV01>>>;
    admission: ReturnType<typeof registerProjectV01>;
    casesById: Map<string, GovernedActorLabLiveCaseV01>;
  },
  transform: Parameters<typeof providerTransportV01>[2],
) {
  const captured: OpenAIResponsesTransportRequestV01[] = [];
  const adapter = createOpenAIResponsesAdapterV01({
    environment: {
      OPENAI_API_KEY: credentialSentinel,
      OPENAI_MODEL: "governed-actor-test-model",
    },
    transport: providerTransportV01(input.casesById, captured, transform),
  });
  const result = await runGovernedActorLabLiveCohortV01(
    {
      source_repository_head_sha: input.sourceHead,
      authorization_lineage: replacementAuthorizationV01(input.sourceHead),
      c1_manifest: input.c1Manifest,
      casebook: structuredClone(input.casebook),
      route: input.route,
      admission: input.admission,
    },
    {
      gateway_dependencies: {
        adapter,
        open_database: () => new Database(databasePath),
        read_root_availability: async () => "available",
      },
    },
  );
  return { result, calls: captured.length, captured };
}

async function runUnknownInternalErrorCasesV01(input: {
  sourceHead: string;
  c1Manifest: ReturnType<typeof createGovernedActorLabManifestV01>;
  casebook: typeof governedActorLabLiveCasebookFixture;
  route: NonNullable<Awaited<ReturnType<typeof prepareGovernedActorLabModelGatewayRouteV01>>>;
  admission: ReturnType<typeof registerProjectV01>;
  adapter: ReturnType<typeof createOpenAIResponsesAdapterV01>;
  successfulReceipt: ModelInvocationReceiptV02;
}): Promise<void> {
  let unknownCalls = 0;
  const unknown = await runGovernedActorLabLiveCohortV01(
    {
      source_repository_head_sha: input.sourceHead,
      authorization_lineage: replacementAuthorizationV01(input.sourceHead),
      c1_manifest: input.c1Manifest,
      casebook: structuredClone(input.casebook),
      route: input.route,
      admission: input.admission,
    },
    {
      async invoke_gateway() {
        unknownCalls += 1;
        throw new Error("simulated_unknown_after_invocation_boundary");
      },
    },
  );
  if (unknown.result_kind !== "truthful_incomplete") {
    assert.fail("an unknown receipt-free exception must stop with incomplete truth");
  }
  assert.equal(unknownCalls, 1);
  assert.equal(unknown.invocation_bindings.length, 1);
  assert.equal(
    unknown.invocation_bindings[0]!.invocation_status,
    "cohort_internal_error_receipt_unavailable",
  );
  assert.equal(
    unknown.invocation_bindings[0]!.provider_attempt_status,
    "unknown_receipt_unavailable",
  );
  assert.equal(unknown.report.accounting.attempted_provider_calls, null);
  assert.equal(unknown.report.accounting.attempted_provider_calls_unknown_slots, 1);
  assert.equal(unknown.report.accounting.transport_failed, 0);

  let beforeEntryCalls = 0;
  const beforeEntry = await runGovernedActorLabLiveCohortV01(
    {
      source_repository_head_sha: input.sourceHead,
      authorization_lineage: replacementAuthorizationV01(input.sourceHead),
      c1_manifest: input.c1Manifest,
      casebook: structuredClone(input.casebook),
      route: input.route,
      admission: input.admission,
    },
    {
      before_gateway_entry() {
        throw new Error("simulated_before_gateway_entry");
      },
      async invoke_gateway() {
        beforeEntryCalls += 1;
        throw new Error("unreachable");
      },
    },
  );
  if (beforeEntry.result_kind !== "truthful_incomplete") {
    assert.fail("a pre-entry internal exception must produce incomplete truth");
  }
  assert.equal(beforeEntryCalls, 0);
  assert.equal(beforeEntry.report.accounting.attempted_provider_calls, 0);
  assert.equal(
    beforeEntry.invocation_bindings[0]!.provider_attempt_status,
    "known_not_attempted_local",
  );

  for (const failure of ["model_gateway_timeout", "model_gateway_transport_failed"] as const) {
    let injected = false;
    const result = await runGovernedActorLabLiveCohortV01(
      {
        source_repository_head_sha: input.sourceHead,
        authorization_lineage: replacementAuthorizationV01(input.sourceHead),
        c1_manifest: input.c1Manifest,
        casebook: structuredClone(input.casebook),
        route: input.route,
        admission: input.admission,
      },
      {
        async invoke_gateway(envelope, dependencies) {
          const typedEnvelope = envelope as GovernedActorLabModelInvocationEnvelopeV01;
          if (!injected) {
            injected = true;
            throw new ModelGatewayInvocationErrorV01(
              failure,
              failureReceiptV01(input.successfulReceipt, typedEnvelope.invocation_id, failure),
            );
          }
          return invokeGovernedActorLabModelGatewayV01(envelope, dependencies);
        },
        gateway_dependencies: {
          adapter: input.adapter,
          open_database: () => new Database(databasePath),
          read_root_availability: async () => "available",
        },
      },
    );
    if (result.result_kind !== "truthful_incomplete") {
      assert.fail(`${failure} must preserve a truthful incomplete result`);
    }
    const binding = result.invocation_bindings[0]!;
    assert.ok(binding.model_invocation_receipt);
    assert.equal(binding.provider_attempt_status, "receipt_attempted");
    assert.equal(
      binding.invocation_status,
      failure === "model_gateway_timeout" ? "timed_out" : "transport_failed",
    );
  }
}

function runJournalCrashAndTamperCasesV01(input: {
  result: Extract<GovernedActorLabLiveExecutionResultV01, { result_kind: "complete" }>;
  terminalResult: Extract<GovernedActorLabLiveExecutionResultV01, { result_kind: "truthful_incomplete" }>;
  adverseResult: Extract<GovernedActorLabLiveExecutionResultV01, { result_kind: "complete" }>;
}): void {
  const crashJournal = beginGovernedActorLabLiveCohortAttemptV01({
    repository_root: repositoryRoot,
    run_label: "crash-after-five",
    result_identity: input.result,
  });
  input.result.invocation_bindings.slice(0, 5).forEach((binding) =>
    crashJournal.append_binding(binding),
  );
  const reconstructed = buildGovernedActorLabLiveIncompleteResultFromJournalV01({
    manifest: input.result.manifest,
    call_plan: input.result.call_plan,
    invocation_bindings: input.result.invocation_bindings.slice(0, 5),
    checkpoints: [],
    arm_terminals: [],
  });
  const crashSummary = crashJournal.finalize(reconstructed);
  assert.equal(
    readdirSync(path.join(crashSummary.run_root, "invocations")).length,
    5,
  );
  assert.equal(reconstructed.report.accounting.receipt_bearing_attempted_calls, 5);
  assert.equal(reconstructed.report.accounting.completed_live_calls, 5);
  assert.equal(reconstructed.report.accounting.missing_call_slots, 135);
  assert.ok(existsSync(path.join(crashSummary.run_root, "terminal-attempt.json")));

  const duplicate = beginGovernedActorLabLiveCohortAttemptV01({
    repository_root: repositoryRoot,
    run_label: "duplicate-refusal",
    result_identity: input.result,
  });
  duplicate.append_binding(input.result.invocation_bindings[0]!);
  assert.throws(
    () => duplicate.append_binding(input.result.invocation_bindings[0]!),
    /actor_lab|governed_actor_lab/u,
  );
  assert.throws(
    () => beginGovernedActorLabLiveCohortAttemptV01({
      repository_root: repositoryRoot,
      run_label: "duplicate-refusal",
      result_identity: input.result,
    }),
    /actor_lab_run_root_not_clean/u,
  );
  const gap = beginGovernedActorLabLiveCohortAttemptV01({
    repository_root: repositoryRoot,
    run_label: "gap-refusal",
    result_identity: input.result,
  });
  assert.throws(
    () => gap.append_binding(input.result.invocation_bindings[1]!),
    /governed_actor_lab_live_plan_binding_mismatch/u,
  );
  const checkpointGap = beginGovernedActorLabLiveCohortAttemptV01({
    repository_root: repositoryRoot,
    run_label: "checkpoint-gap-refusal",
    result_identity: input.result,
  });
  input.result.invocation_bindings.slice(0, 7).forEach((binding) =>
    checkpointGap.append_binding(binding),
  );
  assert.throws(
    () => checkpointGap.append_checkpoint(input.result.checkpoints[0]!),
    /governed_actor_lab_live_checkpoint_invalid|actor_lab_live_checkpoint_prefix_invalid/u,
  );

  for (const mutate of [
    (binding: GovernedActorLabLiveInvocationBindingV01) => {
      binding.phase = "challenge_synthesis";
    },
    (binding: GovernedActorLabLiveInvocationBindingV01) => {
      binding.case_id = "live-case:tampered";
    },
    (binding: GovernedActorLabLiveInvocationBindingV01) => {
      binding.budget.max_output_tokens -= 1;
    },
    (binding: GovernedActorLabLiveInvocationBindingV01) => {
      binding.invocation_status = "provider_rejected";
    },
    (binding: GovernedActorLabLiveInvocationBindingV01) => {
      binding.model_invocation_receipt = null;
      binding.model_invocation_receipt_fingerprint = null;
    },
    (binding: GovernedActorLabLiveInvocationBindingV01) => {
      binding.provider_ref.external_id = `${binding.provider_ref.external_id}-tampered`;
    },
    (binding: GovernedActorLabLiveInvocationBindingV01) => {
      binding.normalized_output_fingerprint = `sha256:${"0".repeat(64)}`;
    },
    (binding: GovernedActorLabLiveInvocationBindingV01) => {
      binding.call_order = 1;
    },
  ]) {
    const tampered = structuredClone(input.result);
    mutate(tampered.invocation_bindings[0]!);
    tampered.invocation_bindings[0] = resealIntegrityV01(
      tampered.invocation_bindings[0]!,
    );
    assert.throws(() => validateGovernedActorLabLiveCohortResultV01(tampered));
  }

  const accountingTamper = structuredClone(input.result);
  accountingTamper.report.accounting.attempted_provider_calls = 139;
  accountingTamper.report.accounting = resealIntegrityV01(
    accountingTamper.report.accounting,
  );
  accountingTamper.report = resealIntegrityV01(accountingTamper.report);
  assert.throws(
    () => validateGovernedActorLabLiveCohortResultV01(accountingTamper),
    /governed_actor_lab_live_accounting_invalid/u,
  );
  const pairwiseTamper = structuredClone(input.result);
  pairwiseTamper.report.comparisons[0]!.status =
    pairwiseTamper.report.comparisons[0]!.status === "equal"
      ? "tradeoff"
      : "equal";
  pairwiseTamper.report = resealIntegrityV01(pairwiseTamper.report);
  assert.throws(
    () => validateGovernedActorLabLiveCohortResultV01(pairwiseTamper),
    /governed_actor_lab_live_comparison_derivation_invalid/u,
  );

  for (const mutate of [
    (result: typeof input.adverseResult) => {
      const arm = result.report.arms.find(
        (candidate) => candidate.arm === "persistent_population_no_evolution",
      )!;
      arm.arm_level_hard_gate.failed = false;
    },
    (result: typeof input.adverseResult) => {
      const arm = result.report.arms.find(
        (candidate) => candidate.arm === "persistent_population_no_evolution",
      )!;
      arm.arm_level_hard_gate.codes = [];
    },
    (result: typeof input.adverseResult) => {
      const arm = result.report.arms.find(
        (candidate) => candidate.arm === "persistent_population_no_evolution",
      )!;
      arm.arm_level_hard_gate.basis = [];
    },
    (result: typeof input.adverseResult) => {
      result.report.comparisons[0]!.basis = ["holdout_passes"];
    },
    (result: typeof input.adverseResult) => {
      result.report.comparisons[0]!.status = "left_better";
    },
  ]) {
    const tampered = structuredClone(input.adverseResult);
    mutate(tampered);
    tampered.report = resealIntegrityV01(tampered.report);
    assert.throws(() => validateGovernedActorLabLiveCohortResultV01(tampered));
  }

  for (const mutate of [
    (attempt: typeof input.result.terminal_attempt) => {
      attempt.status = "truthful_incomplete";
    },
    (attempt: typeof input.result.terminal_attempt) => {
      attempt.terminal_reason = "required_live_observations_incomplete";
    },
    (attempt: typeof input.result.terminal_attempt) => {
      attempt.persisted_invocation_prefix = 139;
    },
    (attempt: typeof input.result.terminal_attempt) => {
      attempt.missing_call_slots = 1;
    },
  ]) {
    const tampered = structuredClone(input.result);
    mutate(tampered.terminal_attempt);
    tampered.terminal_attempt = resealIntegrityV01(tampered.terminal_attempt);
    assert.throws(
      () => validateGovernedActorLabLiveCohortResultV01(tampered),
      /governed_actor_lab_live_result_invalid/u,
    );
  }

  const authorizationTamper = structuredClone(input.result);
  authorizationTamper.terminal_attempt.authorization_lineage = {
    ...authorizationTamper.terminal_attempt.authorization_lineage,
    authorized_source_head: "c".repeat(40),
  };
  authorizationTamper.terminal_attempt = resealIntegrityV01(
    authorizationTamper.terminal_attempt,
  );
  assert.throws(
    () => validateGovernedActorLabLiveCohortResultV01(authorizationTamper),
    /governed_actor_lab_live_authorization_lineage_invalid/u,
  );

  const dispositionTamper = structuredClone(input.terminalResult);
  const terminalBindingIndex = dispositionTamper.invocation_bindings.findIndex(
    (binding) => binding.invocation_status === "not_attempted_arm_terminal",
  );
  dispositionTamper.invocation_bindings[terminalBindingIndex]!.no_egress_disposition!.code =
    "dependency_missing";
  dispositionTamper.invocation_bindings[terminalBindingIndex] = resealIntegrityV01(
    dispositionTamper.invocation_bindings[terminalBindingIndex]!,
  );
  assert.throws(
    () => validateGovernedActorLabLiveIncompleteResultV01(dispositionTamper),
    /governed_actor_lab_live_arm_terminal_binding_invalid/u,
  );
  const terminalReasonTamper = structuredClone(input.terminalResult);
  terminalReasonTamper.arm_terminals[0]!.terminal_reason =
    "tampered_terminal_reason" as never;
  terminalReasonTamper.arm_terminals[0] = resealIntegrityV01(
    terminalReasonTamper.arm_terminals[0]!,
  );
  assert.throws(() =>
    validateGovernedActorLabLiveIncompleteResultV01(terminalReasonTamper),
  );
  const incompleteDominanceTamper = structuredClone(input.terminalResult);
  incompleteDominanceTamper.report.non_dominance.status = "determined" as never;
  incompleteDominanceTamper.report = resealIntegrityV01(
    incompleteDominanceTamper.report,
  );
  assert.throws(() =>
    validateGovernedActorLabLiveIncompleteResultV01(incompleteDominanceTamper),
  );

  for (const mutate of [
    (attempt: typeof input.terminalResult.terminal_attempt) => {
      attempt.status = "complete";
    },
    (attempt: typeof input.terminalResult.terminal_attempt) => {
      attempt.terminal_reason = "required_live_observations_incomplete";
    },
    (attempt: typeof input.terminalResult.terminal_attempt) => {
      attempt.persisted_invocation_prefix -= 1;
    },
    (attempt: typeof input.terminalResult.terminal_attempt) => {
      attempt.cohort_id = `live-cohort:${"0".repeat(32)}`;
    },
  ]) {
    const tampered = structuredClone(input.terminalResult);
    mutate(tampered.terminal_attempt);
    tampered.terminal_attempt = resealIntegrityV01(tampered.terminal_attempt);
    assert.throws(() =>
      validateGovernedActorLabLiveIncompleteResultV01(tampered),
    );
  }
}

function runSourcePurityCasesV01(artifactText: string): void {
  const forbiddenRepositoryRoot = [
    "",
    "Users",
    "hynk",
    "code",
    "augnes-temp",
  ].join("/");
  const macUserRootPrefix = ["", "Users", ""].join("/");
  const sourceFiles = [
    "types/vnext/governed-actor-lab-live.ts",
    "fixtures/vnext/protocol/governed-actor-lab-live-v0-1.ts",
    "lib/vnext/governed-actor-lab-live.ts",
    "lib/vnext/governed-actor-lab-artifact-store.ts",
    "lib/vnext/model-gateway/openai/governed-actor-lab-codec.ts",
    "scripts/governed-actor-lab-live-cohort.ts",
    "scripts/test-governed-actor-lab-live.ts",
  ];
  for (const sourceFile of sourceFiles) {
    const source = readFileSync(path.join(process.cwd(), sourceFile), "utf8");
    assert.ok(!source.includes(forbiddenRepositoryRoot));
  }
  assert.ok(!artifactText.includes(macUserRootPrefix));
  assert.ok(!artifactText.includes(projectRoot));
  assert.ok(
    !readFileSync(
      path.join(process.cwd(), "lib/vnext/governed-actor-lab-live.ts"),
      "utf8",
    ).includes(".includes(claim.claim_token)"),
    "memory attribution must not use prose substring heuristics",
  );
}

function peerArtifactFromBindingV01(
  binding: GovernedActorLabLiveInvocationBindingV01,
): GovernedActorLabLivePeerArtifactV01 {
  assert.ok(binding.normalized_output);
  assert.ok(binding.normalized_output_fingerprint);
  return {
    peer_artifact_ref: `peer:${binding.call_slot_id}`,
    peer_slot: binding.actor_slot,
    result_token: binding.normalized_output.result_token,
    claim_candidates: structuredClone(binding.normalized_output.claim_candidates),
    uncertainties: [...binding.normalized_output.uncertainties],
    abstention: binding.normalized_output.abstention,
    normalized_output_fingerprint: binding.normalized_output_fingerprint,
  };
}

function cloneBindingWithOutputV01(
  binding: GovernedActorLabLiveInvocationBindingV01,
  mutate: (output: GovernedActorLabLiveModelOutputV01) => void,
): GovernedActorLabLiveInvocationBindingV01 {
  const candidate = structuredClone(binding);
  assert.ok(candidate.normalized_output);
  mutate(candidate.normalized_output);
  candidate.normalized_output_fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(candidate.normalized_output),
  );
  return candidate;
}

function addForbiddenClaimV01(
  output: GovernedActorLabLiveModelOutputV01,
  liveCase: GovernedActorLabLiveCaseV01,
): void {
  output.claim_candidates.push({
    claim_token: liveCase.evaluator_only.forbidden_claim_tokens[0]!,
    source_tokens: [liveCase.actor_visible.evidence_snippets[0]!.source_token],
  });
}

function requestModelMaterialV01(
  request: OpenAIResponsesTransportRequestV01,
): GovernedActorLabLiveModelInputV01 {
  const body = JSON.parse(request.body) as Record<string, any>;
  return {
    input_kind: "governed_actor_lab",
    codec_version: "governed_actor_lab_live_codec.v0.1",
    ...JSON.parse(body.input[1].content[0].text),
  } as GovernedActorLabLiveModelInputV01;
}

function failureReceiptV01(
  successful: ModelInvocationReceiptV02,
  invocationId: string,
  failure:
    | "model_gateway_timeout"
    | "model_gateway_transport_failed",
): ModelInvocationReceiptV02 {
  const { normalized_output_fingerprint: _output, ...base } =
    structuredClone(successful);
  const timeout = failure === "model_gateway_timeout";
  return validateModelInvocationReceiptV02({
    ...base,
    invocation_id: invocationId,
    usage: null,
    status: timeout ? "timed_out" : "failed",
    outcome: timeout ? "timeout" : "provider_failure",
    failure_code: failure,
    trust_class: "direct_local_observation",
    budget: {
      ...base.budget,
      output_tokens_used: null,
      timeout_disposition: timeout ? "timed_out" : "completed_within_deadline",
    },
    cancellation_disposition: "not_cancelled",
  });
}

function resealIntegrityV01<T extends { integrity: { fingerprint: string } }>(
  value: T,
): T {
  const clone = structuredClone(value);
  const { integrity: _integrity, ...withoutIntegrity } = clone;
  clone.integrity.fingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(withoutIntegrity),
  );
  return clone;
}

async function expectGatewayFailureV01(
  envelope: unknown,
  dependencies: Parameters<typeof invokeGovernedActorLabModelGatewayV01>[1],
  code: string,
) {
  await assert.rejects(
    () => invokeGovernedActorLabModelGatewayV01(envelope, dependencies),
    (error: unknown) => isModelGatewayInvocationErrorV01(error) && error.code === code,
  );
}

function providerTransportV01(
  casesById: Map<string, GovernedActorLabLiveCaseV01>,
  captured: OpenAIResponsesTransportRequestV01[],
  transform?: (
    output: GovernedActorLabLiveModelOutputV01,
    input: GovernedActorLabLiveModelInputV01,
    liveCase: GovernedActorLabLiveCaseV01,
  ) => GovernedActorLabLiveModelOutputV01,
): OpenAIResponsesTransportV01 {
  return async (request) => {
    captured.push(request);
    const body = JSON.parse(request.body) as Record<string, any>;
    const material = JSON.parse(body.input[1].content[0].text) as Record<string, any>;
    const modelInput = {
      input_kind: "governed_actor_lab",
      codec_version: "governed_actor_lab_live_codec.v0.1",
      ...material,
    } as GovernedActorLabLiveModelInputV01;
    const liveCase = casesById.get(modelInput.actor_visible_case.case_id);
    if (!liveCase) throw new Error("mock_provider_case_missing");
    return {
      ok: true,
      status: 200,
      async json() {
        const output = providerOutputV01(liveCase, modelInput);
        return {
          status: "completed",
          output_text: JSON.stringify(
            transform ? transform(output, modelInput, liveCase) : output,
          ),
          usage: { input_tokens: 120, output_tokens: 32, total_tokens: 152 },
        };
      },
    };
  };
}

function providerOutputV01(
  liveCase: GovernedActorLabLiveCaseV01,
  input: GovernedActorLabLiveModelInputV01,
): GovernedActorLabLiveModelOutputV01 {
  const peerClaims = input.peer_challenge_artifact?.claim_candidates.map(
    (claim) => claim.claim_token,
  ) ?? [];
  return {
    result_token: liveCase.evaluator_only.expected_result_token,
    claim_candidates: liveCase.evaluator_only.required_support_relations.map((relation) => ({
      claim_token: relation.claim_token,
      source_tokens: [...relation.required_source_tokens],
    })),
    uncertainties: input.actor_visible_case.uncertainty_tokens.slice(0, 1),
    abstention: liveCase.evaluator_only.abstention_required,
    challenge_response: {
      peer_claim_tokens_considered: [...peerClaims],
      accepted_peer_claim_tokens: [...peerClaims],
      rejected_peer_claim_tokens: [],
    },
    referenced_memory_tokens: input.admitted_private_memory.map(
      (item) => item.memory_token,
    ),
    referenced_curated_tokens: input.curated_knowledge.map(
      (item) => item.curated_token,
    ),
    synthesis_token: liveCase.evaluator_only.expected_result_token,
  };
}

function initializeDatabaseV01() {
  const database = new Database(databasePath);
  database.exec(readFileSync(path.join(process.cwd(), "lib", "db", "schema.sql"), "utf8"));
  database.close();
}

function registerProjectV01() {
  const db = new Database(databasePath);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db, {
    create_uuid: () => "11111111-1111-4111-8111-111111111111",
    now: () => "2026-08-04T00:00:00.000Z",
  });
  const rootRef = normalizeLocalProjectRootRefV01(projectRoot, {
    base_path: path.parse(projectRoot).root,
  });
  const project = getOrCreateCanonicalProjectForLocalRootV01(
    db,
    {
      workspace_id: workspace.workspace_id,
      local_root: rootRef,
      display_name: "synthetic-live-test",
    },
    {
      create_uuid: () => "22222222-2222-4222-8222-222222222222",
      now: () => "2026-08-04T00:00:01.000Z",
    },
  );
  touchRecentProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: project.project.project_id,
    now: "2026-08-04T00:00:02.000Z",
  });
  const active = selectActiveProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: project.project.project_id,
    now: "2026-08-04T00:00:03.000Z",
    expected_project_id: null,
    expected_revision: null,
  });
  db.close();
  return {
    workspace_id: workspace.workspace_id,
    project_id: project.project.project_id,
    expected_active_selection_revision: active.selection_revision,
    project_root: {
      path_flavor: rootRef.path_flavor,
      normalized_path: rootRef.normalized_path,
    },
    gateway_authorization_project_is_lab_experiment_meaning: false as const,
  };
}

function readAllArtifactsV01(rootPath: string): string {
  const walk = (current: string): string[] =>
    readdirSync(current).flatMap((entry) => {
      const target = path.join(current, entry);
      return lstatSync(target).isDirectory() ? walk(target) : [target];
    });
  return walk(rootPath).map((file) => readTextSync(file, "utf8")).join("\n");
}

function appendResultToJournalV01(
  journal: GovernedActorLabLiveAttemptJournalV01,
  result: Extract<
    Awaited<ReturnType<typeof runGovernedActorLabLiveCohortV01>>,
    { result_kind: "complete" }
  >,
): void {
  const checkpoints = new Map<number, typeof result.checkpoints>();
  for (const checkpoint of result.checkpoints) {
    const entries = checkpoints.get(checkpoint.journal_prefix_length) ?? [];
    entries.push(checkpoint);
    checkpoints.set(checkpoint.journal_prefix_length, entries);
  }
  for (const binding of result.invocation_bindings) {
    journal.append_binding(binding);
    for (const checkpoint of checkpoints.get(binding.call_order + 1) ?? []) {
      journal.append_checkpoint(checkpoint);
    }
  }
}
