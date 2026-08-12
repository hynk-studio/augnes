#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
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
} from "@/lib/vnext/governed-actor-lab-artifact-store";
import {
  buildGovernedActorLabLiveCohortManifestV01,
  runGovernedActorLabLiveCohortV01,
  validateGovernedActorLabLiveCohortResultV01,
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
  GovernedActorLabLiveModelInputV01,
  GovernedActorLabLiveModelOutputV01,
} from "@/types/vnext/governed-actor-lab-live";

const root = mkdtempSync(path.join(tmpdir(), "augnes-governed-actor-live-"));
const repositoryRoot = path.join(root, "repository");
const databasePath = path.join(root, "gateway.db");
const projectRoot = path.join(root, "registered-project");
const credentialSentinel = "test-credential-never-persist";
let focusedInvocationCounter = 0;

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

  let maximumConcurrent = 0;
  let active = 0;
  let firstEnvelope: GovernedActorLabModelInvocationEnvelopeV01 | null = null;
  const result = await runGovernedActorLabLiveCohortV01(
    {
      source_repository_head_sha: sourceHead,
      c1_manifest: c1Manifest,
      casebook,
      route,
      admission,
    },
    {
      async invoke_gateway(envelope, dependencies) {
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
    },
  );
  assert.equal(maximumConcurrent, 1);
  assert.equal(capturedRequests.length, 140);
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

  const artifactSummary = writeGovernedActorLabLiveCohortArtifactsV01({
    repository_root: repositoryRoot,
    run_label: "first-cohort",
    result,
  });
  assert.equal(artifactSummary.artifact_count, 145);
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
  const markedSummary = writeGovernedActorLabLiveCohortArtifactsV01({
    repository_root: repositoryRoot,
    run_label: "single-attempt-marker",
    result,
  });
  assert.equal(markedSummary.artifact_count, 146);
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

  console.log(JSON.stringify({
    status: "governed_actor_lab_live_non_live_tests_passed",
    planned_calls: 140,
    mock_provider_calls: capturedRequests.length,
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
    result.report.arms.find((arm) => arm.arm === "single_strong_actor")!.comparable,
    false,
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
  assert.equal(result.report.accounting.attempted_provider_calls, 0);
  assert.equal(result.report.accounting.route_changed, 140);
  assert.equal(result.report.accounting.provider_model_consistent, false);
  assert.equal(result.report.non_dominance.status, "undetermined");
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
        return {
          status: "completed",
          output_text: JSON.stringify(providerOutputV01(liveCase, modelInput)),
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
