#!/usr/bin/env node
import assert from "node:assert/strict";
import { channel } from "node:diagnostics_channel";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { openDatabase, type StateEntry } from "../lib/db";
import { buildMockProposals } from "../lib/observe/delta-compiler";
import { createObservePostHandlerV01 } from "../lib/observe/observe-route-handler";
import { buildMockRecommendations } from "../lib/planner/planner";
import { createPlannerPostHandlerV01 } from "../lib/planner/planner-route-handler";
import { buildStateBrief } from "../lib/state/brief";
import { buildTemporalPreviewContext } from "../lib/temporal-interpretation/context";
import { buildMockTemporalPreview } from "../lib/temporal-interpretation/mock";
import { createTemporalPreviewPostHandlerV01 } from "../lib/temporal-interpretation/preview-route-handler";
import type { TemporalPreviewContext } from "../lib/temporal-interpretation/types";
import {
  invokeObserveModelGatewayV01,
  invokePlannerModelGatewayV01,
  invokeTemporalModelGatewayV01,
  type ObserveModelGatewayDependenciesV01,
  type PlannerModelGatewayDependenciesV01,
  type TemporalModelGatewayDependenciesV01,
} from "../lib/vnext/model-gateway/model-gateway";
import {
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
  PLANNER_MODEL_GATEWAY_PURPOSE_V01,
  TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
  isModelGatewayInvocationErrorV01,
  type ModelAdapterSessionV01,
  type ModelAdapterV01,
  type ModelGatewayExecutionModeV01,
  type ModelGatewayPolicyAuthorizationV01,
  type ModelInvocationReceiptV02,
  type ObserveModelInvocationEnvelopeV01,
  type PlannerModelInvocationEnvelopeV01,
  type TemporalModelInvocationEnvelopeV01,
} from "../lib/vnext/model-gateway/contracts";
import {
  createOpenAIResponsesAdapterV01,
  type OpenAIResponsesTransportV01,
} from "../lib/vnext/model-gateway/openai/responses-adapter";
import { validateModelInvocationReceiptV02 } from "../lib/vnext/model-gateway/model-invocation-receipt";
import { projectModelInvocationReceiptToRunReceiptEntryV02 } from "../lib/vnext/model-gateway/run-receipt-projection";
import {
  getOrCreateCanonicalProjectForLocalRootV01,
  getOrCreateDefaultWorkspaceIdentityV01,
  normalizeLocalProjectRootRefV01,
} from "../lib/vnext/persistence/project-identity-registry";
import {
  selectActiveProjectV01,
  touchRecentProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";

const WORKSPACE_UUID = "11111111-1111-4111-8111-111111111111";
const PROJECT_A_UUID = "22222222-2222-4222-8222-222222222222";
const PROJECT_B_UUID = "33333333-3333-4333-8333-333333333333";
const UNKNOWN_PROJECT_ID = "project:44444444-4444-4444-8444-444444444444";
const UNKNOWN_WORKSPACE_ID = "workspace:55555555-5555-4555-8555-555555555555";
const HOSTILE_SENTINEL = "gateway-hostile-material-7dcf9c";
const CREDENTIAL_SENTINEL = "gateway-test-credential-must-not-escape";
const TARGETED_LIFECYCLE_TIMEOUT_MS = 500;
const TEST_STAGE_OBSERVATION_TIMEOUT_MS = 2_000;
const root = mkdtempSync(path.join(tmpdir(), "augnes-model-gateway-"));
const databasePath = path.join(root, "gateway.db");
const projectARoot = path.join(root, "alpha", "same-name-repository");
const projectBRoot = path.join(root, "beta", "same-name-repository");
const originalDatabasePath = process.env.AUGNES_DB_PATH;
const undiciChannel = channel("undici:request:create");
let undiciRequests = 0;
const onUndiciRequest = () => {
  undiciRequests += 1;
};

void main().catch((error) => {
  console.error("model_gateway_test_failed");
  if (error instanceof Error) console.error(error.message);
  process.exitCode = 1;
});

async function main() {
  mkdirSync(projectARoot, { recursive: true });
  mkdirSync(projectBRoot, { recursive: true });
  initializeDatabase();
  process.env.AUGNES_DB_PATH = databasePath;
  undiciChannel.subscribe(onUndiciRequest);

  try {
    const fixture = registerProjects();
    const metrics = {
      live_transport_calls: 0,
      zero_model_transport_calls: 0,
      blocked_transport_calls: 0,
      timeout_transport_calls: 0,
      cancellation_transport_calls: 0,
      hostile_body_reads: 0,
    };

    const capturedLiveRequests: Parameters<OpenAIResponsesTransportV01>[0][] = [];
    const liveAdapter = createOpenAIResponsesAdapterV01({
      environment: { OPENAI_API_KEY: CREDENTIAL_SENTINEL, OPENAI_MODEL: "test-model" },
      transport: async (request) => {
        metrics.live_transport_calls += 1;
        capturedLiveRequests.push(request);
        return providerSuccess();
      },
    });

    const liveHandler = createObservePostHandlerV01({
      gateway_dependencies: { adapter: liveAdapter },
    });
    const liveResponse = await liveHandler(
      observeRequest(fixture, {
        message: "Augnes should retain a review-only proposal.",
        execution_mode: "live",
      }),
    );
    assert.equal(liveResponse.status, 201);
    const live = await liveResponse.json();
    assert.equal(metrics.live_transport_calls, 1);
    assert.equal(live.compiler, "openai");
    assert.equal(live.proposals[0]?.state_key, "product.name");
    assert.equal(live.workspace_id, fixture.workspaceId);
    assert.equal(live.project_id, fixture.projectAId);
    assert.equal(live.model_invocation_receipt.workspace_id, fixture.workspaceId);
    assert.equal(live.model_invocation_receipt.project_id, fixture.projectAId);
    assert.equal(live.model_invocation_receipt.execution_mode, "live");
    assert.equal(live.model_invocation_receipt.egress_attempted, true);
    assert.deepEqual(live.model_invocation_receipt.usage, {
      basis: "provider_report",
      quality: "reported",
      source: "provider_response",
      input_tokens: 80,
      output_tokens: 24,
      total_tokens: 104,
    });
    const livePayload = JSON.parse(capturedLiveRequests[0]!.body);
    const dynamicInput = JSON.parse(livePayload.input[1].content[0].text);
    assert.equal(dynamicInput.project_id, fixture.projectAId);
    assert.equal(Object.hasOwn(dynamicInput, "workspace_id"), false);
    assert.equal(livePayload.store, false);
    assert.equal(livePayload.max_output_tokens, 2_048);
    assert.equal(JSON.stringify(livePayload).includes(CREDENTIAL_SENTINEL), false);
    assertNoPrivateMaterial(live.model_invocation_receipt);
    const semanticReceiptContradictions =
      assertModelInvocationReceiptSemanticMatrix(
        live.model_invocation_receipt,
      );

    const noCredentialAdapter = createOpenAIResponsesAdapterV01({
      environment: {},
      transport: async () => {
        metrics.zero_model_transport_calls += 1;
        return providerSuccess();
      },
    });
    const noCredentialHandler = createObservePostHandlerV01({
      gateway_dependencies: { adapter: noCredentialAdapter },
    });
    const noCredentialResponse = await noCredentialHandler(
      observeRequest(fixture, {
        message: "README remains required.",
        execution_mode: "live",
      }),
    );
    assert.equal(noCredentialResponse.status, 201);
    const noCredential = await noCredentialResponse.json();
    assert.equal(metrics.zero_model_transport_calls, 0);
    assert.equal(noCredential.compiler, "mock");
    assert.equal(noCredential.proposals[0]?.state_key, "submission.requires_readme");
    assert.equal(noCredential.model_invocation_receipt.execution_mode, "deterministic");
    assert.equal(noCredential.model_invocation_receipt.selection_reason, "provider_unavailable");
    assert.equal(noCredential.model_invocation_receipt.egress_attempted, false);

    const explicitDeterministic = await invokeObserveModelGatewayV01(
      envelope(fixture, { mode: "deterministic", message: "README remains required." }),
      gatewayDependencies(liveAdapter),
    );
    assert.equal(metrics.live_transport_calls, 1);
    assert.equal(explicitDeterministic.compiler, "mock");
    assert.equal(
      explicitDeterministic.model_invocation_receipt.selection_reason,
      "explicit_deterministic",
    );
    assert.equal(explicitDeterministic.model_invocation_receipt.egress_attempted, false);

    const missingIdentity = await liveHandler(
      new Request("http://localhost/api/observe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: HOSTILE_SENTINEL }),
      }),
    );
    assert.equal(missingIdentity.status, 400);
    assert.equal(metrics.live_transport_calls, 1);
    assert.equal((await missingIdentity.text()).includes(HOSTILE_SENTINEL), false);

    await assertScopeRefusal(
      { ...envelope(fixture), project_id: UNKNOWN_PROJECT_ID },
      liveAdapter,
      metrics,
    );
    await assertScopeRefusal(
      { ...envelope(fixture), workspace_id: UNKNOWN_WORKSPACE_ID },
      liveAdapter,
      metrics,
    );
    await assertScopeRefusal(
      {
        ...envelope(fixture),
        policy: {
          invocation_origin: "interactive",
          expected_active_project_id: fixture.projectBId,
          expected_active_selection_revision: fixture.activeRevision,
        },
      },
      liveAdapter,
      metrics,
    );
    await assertScopeRefusal(
      {
        ...envelope(fixture),
        project_root: {
          path_flavor: fixture.projectBRoot.path_flavor,
          normalized_path: fixture.projectBRoot.normalized_path,
        },
      },
      liveAdapter,
      metrics,
    );

    const invalidVariants: unknown[] = [
      { ...envelope(fixture), purpose: "unsupported" },
      { ...envelope(fixture), data_classification: undefined },
      { ...envelope(fixture), provenance_refs: [] },
      { ...envelope(fixture), provenance_refs: [HOSTILE_SENTINEL] },
      {
        ...envelope(fixture),
        privacy: { provider_egress: "deny", retention_class: "none" },
      },
      { ...envelope(fixture), execution_mode: "unsupported" },
      { ...envelope(fixture), timeout_ms: 0 },
      {
        ...envelope(fixture),
        budget: {
          max_input_bytes: 98_304,
          max_output_tokens: 2_048,
          max_provider_calls: 0,
        },
      },
    ];
    for (const invalidEnvelope of invalidVariants) {
      const failure = await captureGatewayFailure(
        invalidEnvelope,
        gatewayDependencies(liveAdapter),
      );
      assert.equal(failure.code, "model_gateway_invalid_envelope");
      assert.equal(failure.receipt, null);
      assert.equal(JSON.stringify(failure).includes(HOSTILE_SENTINEL), false);
    }
    assert.equal(metrics.live_transport_calls, 1);

    const policyFailure = await captureGatewayFailure(
      {
        ...envelope(fixture, { mode: "deterministic" }),
        policy: {
          invocation_origin: "policy_triggered",
          automation_control_revision: 1,
          work_id: "work:test-policy-refusal",
          run_id: "run:test-policy-refusal",
          grant_id: "grant:test-policy-refusal",
          grant_fingerprint:
            "sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
        },
      },
      gatewayDependencies(liveAdapter),
    );
    assert.equal(policyFailure.code, "model_gateway_policy_refused");
    assert.equal(metrics.live_transport_calls, 1);
    const hostilePolicyFailure = await captureGatewayFailure(
      {
        ...envelope(fixture, { mode: "deterministic" }),
        policy: {
          invocation_origin: "policy_triggered",
          automation_control_revision: 1,
          work_id: "work:test-hostile-policy-refusal",
          run_id: "run:test-hostile-policy-refusal",
          grant_id: "grant:test-hostile-policy-refusal",
          grant_fingerprint:
            "sha256:eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        },
      },
      {
        ...gatewayDependencies(liveAdapter),
        authorize_policy_invocation() {
          throw new Error(HOSTILE_SENTINEL);
        },
      },
    );
    assert.equal(hostilePolicyFailure.code, "model_gateway_policy_refused");
    assert.equal(JSON.stringify(hostilePolicyFailure).includes(HOSTILE_SENTINEL), false);
    assert.equal(metrics.live_transport_calls, 1);

    const deepState = stateEntry(fixture.projectAId, {
      nested: { deeper: { secret: HOSTILE_SENTINEL } },
    });
    const boundedLogs: string[] = [];
    const originalBoundedConsoleError = console.error;
    console.error = (...values: unknown[]) => {
      boundedLogs.push(values.map(String).join(" "));
    };
    const boundedFailure = await captureGatewayFailure(
      envelope(fixture, { currentState: [deepState] }),
      gatewayDependencies(
        createOpenAIResponsesAdapterV01({
          environment: { OPENAI_API_KEY: CREDENTIAL_SENTINEL },
          transport: async () => {
            metrics.blocked_transport_calls += 1;
            return providerSuccess();
          },
        }),
      ),
    ).finally(() => {
      console.error = originalBoundedConsoleError;
    });
    assert.equal(boundedFailure.code, "model_gateway_egress_refused");
    assert.equal(metrics.blocked_transport_calls, 0);
    assert.equal(JSON.stringify(boundedFailure).includes(HOSTILE_SENTINEL), false);
    assert.equal(boundedLogs.join("\n").includes(HOSTILE_SENTINEL), false);
    assertNoPrivateMaterial(boundedFailure.receipt);

    const tinyBudgetFailure = await captureGatewayFailure(
      {
        ...envelope(fixture),
        budget: {
          max_input_bytes: 1,
          max_output_tokens: 1,
          max_provider_calls: 1,
        },
      },
      gatewayDependencies(
        createOpenAIResponsesAdapterV01({
          environment: { OPENAI_API_KEY: CREDENTIAL_SENTINEL },
          transport: async () => {
            metrics.blocked_transport_calls += 1;
            return providerSuccess();
          },
        }),
      ),
    );
    assert.equal(tinyBudgetFailure.code, "model_gateway_egress_refused");
    assert.equal(metrics.blocked_transport_calls, 0);

    const preCancelled = new AbortController();
    preCancelled.abort();
    const preCancelledFailure = await captureGatewayFailure(
      envelope(fixture, { signal: preCancelled.signal }),
      gatewayDependencies(liveAdapter),
    );
    assert.equal(preCancelledFailure.code, "model_gateway_cancelled");
    assert.equal(preCancelledFailure.receipt?.status, "cancelled");
    assert.equal(preCancelledFailure.receipt?.egress_attempted, false);
    assert.equal(metrics.live_transport_calls, 1);

    const scopeCancellationStarted = deferred<void>();
    const scopeCancellationAvailability = deferred<"available">();
    const scopeCancellationController = new AbortController();
    const scopeCancellationResult = invokeObserveModelGatewayV01(
      envelope(fixture, { signal: scopeCancellationController.signal }),
      {
        ...gatewayDependencies(liveAdapter),
        read_root_availability() {
          scopeCancellationStarted.resolve(undefined);
          return scopeCancellationAvailability.promise;
        },
      },
    ).then(
      () => null,
      (error: unknown) => error,
    );
    await waitForTestStage(
      scopeCancellationStarted.promise,
      "Observe scope cancellation",
    );
    scopeCancellationController.abort();
    const scopeCancellationFailure = await scopeCancellationResult;
    assert.equal(isModelGatewayInvocationErrorV01(scopeCancellationFailure), true);
    if (!isModelGatewayInvocationErrorV01(scopeCancellationFailure)) {
      throw new Error("expected normalized scope cancellation failure");
    }
    assert.equal(scopeCancellationFailure.code, "model_gateway_cancelled");
    assert.equal(scopeCancellationFailure.receipt?.outcome, "cancelled");
    assert.equal(scopeCancellationFailure.receipt?.egress_attempted, false);
    assert.equal(scopeCancellationFailure.receipt?.budget.provider_calls_used, 0);
    assert.equal(metrics.live_transport_calls, 1);
    scopeCancellationAvailability.resolve("available");

    const scopeTimeoutStarted = deferred<void>();
    const scopeTimeoutAvailability = deferred<"available">();
    const scopeTimeoutResult = captureGatewayFailure(
      envelope(fixture, { timeoutMs: TARGETED_LIFECYCLE_TIMEOUT_MS }),
      {
        ...gatewayDependencies(liveAdapter),
        read_root_availability() {
          scopeTimeoutStarted.resolve(undefined);
          return scopeTimeoutAvailability.promise;
        },
      },
    );
    await waitForTestStage(scopeTimeoutStarted.promise, "Observe scope timeout");
    const scopeTimeoutFailure = await scopeTimeoutResult;
    assert.equal(scopeTimeoutFailure.code, "model_gateway_timeout");
    assert.equal(scopeTimeoutFailure.receipt?.outcome, "timeout");
    assert.equal(scopeTimeoutFailure.receipt?.egress_attempted, false);
    assert.equal(scopeTimeoutFailure.receipt?.budget.provider_calls_used, 0);
    assert.equal(metrics.live_transport_calls, 1);
    scopeTimeoutAvailability.resolve("available");

    let prepareCancellationInvokes = 0;
    let prepareCancellationTransports = 0;
    const prepareCancellationStarted = deferred<void>();
    const prepareCancellationSession = deferred<ModelAdapterSessionV01 | null>();
    const deferredCancellationAdapter: ModelAdapterV01 = {
      describe: () => ({
        implementation_id: "test.prepare_cancellation",
        implementation_version: "test_prepare_cancellation.v0.1",
      }),
      async prepare(_purpose, signal) {
        assert.equal(signal.aborted, false);
        prepareCancellationStarted.resolve(undefined);
        return prepareCancellationSession.promise;
      },
    };
    const prepareCancellationController = new AbortController();
    const prepareCancellationResult = invokeObserveModelGatewayV01(
      envelope(fixture, { signal: prepareCancellationController.signal }),
      gatewayDependencies(deferredCancellationAdapter),
    ).then(
      () => null,
      (error: unknown) => error,
    );
    await waitForTestStage(
      prepareCancellationStarted.promise,
      "Observe adapter preparation cancellation",
    );
    prepareCancellationController.abort();
    const prepareCancellationFailure = await prepareCancellationResult;
    assert.equal(isModelGatewayInvocationErrorV01(prepareCancellationFailure), true);
    if (!isModelGatewayInvocationErrorV01(prepareCancellationFailure)) {
      throw new Error("expected normalized prepare cancellation failure");
    }
    assert.equal(prepareCancellationFailure.code, "model_gateway_cancelled");
    assert.equal(prepareCancellationFailure.receipt?.outcome, "cancelled");
    assert.equal(prepareCancellationFailure.receipt?.egress_attempted, false);
    assert.equal(
      prepareCancellationFailure.receipt?.budget.provider_calls_used,
      0,
    );
    prepareCancellationSession.resolve(
      unreachableSession(() => {
        prepareCancellationInvokes += 1;
        prepareCancellationTransports += 1;
      }),
    );
    await Promise.resolve();
    assert.equal(prepareCancellationInvokes, 0);
    assert.equal(prepareCancellationTransports, 0);

    let prepareTimeoutInvokes = 0;
    let prepareTimeoutTransports = 0;
    const prepareTimeoutStarted = deferred<void>();
    const prepareTimeoutSession = deferred<ModelAdapterSessionV01 | null>();
    const deferredTimeoutAdapter: ModelAdapterV01 = {
      describe: () => ({
        implementation_id: "test.prepare_timeout",
        implementation_version: "test_prepare_timeout.v0.1",
      }),
      async prepare(_purpose, signal) {
        assert.equal(signal.aborted, false);
        prepareTimeoutStarted.resolve(undefined);
        return prepareTimeoutSession.promise;
      },
    };
    const prepareTimeoutResult = invokeObserveModelGatewayV01(
      envelope(fixture, { timeoutMs: TARGETED_LIFECYCLE_TIMEOUT_MS }),
      gatewayDependencies(deferredTimeoutAdapter),
    ).then(
      () => null,
      (error: unknown) => error,
    );
    await waitForTestStage(
      prepareTimeoutStarted.promise,
      "Observe adapter preparation timeout",
    );
    const prepareTimeoutFailure = await prepareTimeoutResult;
    assert.equal(isModelGatewayInvocationErrorV01(prepareTimeoutFailure), true);
    if (!isModelGatewayInvocationErrorV01(prepareTimeoutFailure)) {
      throw new Error("expected normalized prepare timeout failure");
    }
    assert.equal(prepareTimeoutFailure.code, "model_gateway_timeout");
    assert.equal(prepareTimeoutFailure.receipt?.outcome, "timeout");
    assert.equal(prepareTimeoutFailure.receipt?.egress_attempted, false);
    assert.equal(prepareTimeoutFailure.receipt?.budget.provider_calls_used, 0);
    prepareTimeoutSession.resolve(
      unreachableSession(() => {
        prepareTimeoutInvokes += 1;
        prepareTimeoutTransports += 1;
      }),
    );
    await Promise.resolve();
    assert.equal(prepareTimeoutInvokes, 0);
    assert.equal(prepareTimeoutTransports, 0);

    const deterministicCancellationController = new AbortController();
    const deterministicCancellationStarted = deferred<void>();
    const deterministicCancellationOutput = deferred<
      ReturnType<typeof buildMockProposals>
    >();
    let deterministicCancellationObservedAbort = false;
    const deterministicCancellationResult = invokeObserveModelGatewayV01(
      envelope(fixture, {
        mode: "deterministic",
        signal: deterministicCancellationController.signal,
      }),
      {
        adapter: liveAdapter,
        deterministic_execute(_input, lifecycle) {
          lifecycle.signal.addEventListener(
            "abort",
            () => {
              deterministicCancellationObservedAbort = true;
            },
            { once: true },
          );
          deterministicCancellationStarted.resolve(undefined);
          return deterministicCancellationOutput.promise;
        },
      },
    ).then(
      () => null,
      (error: unknown) => error,
    );
    await waitForTestStage(
      deterministicCancellationStarted.promise,
      "Observe deterministic cancellation",
    );
    deterministicCancellationController.abort();
    const deterministicCancellationFailure =
      await deterministicCancellationResult;
    assert.equal(
      isModelGatewayInvocationErrorV01(deterministicCancellationFailure),
      true,
    );
    if (!isModelGatewayInvocationErrorV01(deterministicCancellationFailure)) {
      throw new Error("expected normalized deterministic cancellation failure");
    }
    assert.equal(
      deterministicCancellationFailure.code,
      "model_gateway_cancelled",
    );
    assert.equal(deterministicCancellationFailure.receipt?.outcome, "cancelled");
    assert.equal(
      deterministicCancellationFailure.receipt?.selection_reason,
      "explicit_deterministic",
    );
    assert.equal(deterministicCancellationFailure.receipt?.egress_attempted, false);
    assert.equal(
      deterministicCancellationFailure.receipt?.budget.provider_calls_used,
      0,
    );
    assert.equal(deterministicCancellationObservedAbort, true);
    deterministicCancellationOutput.resolve([]);

    const deterministicTimeoutStarted = deferred<void>();
    const deterministicTimeoutOutput = deferred<
      ReturnType<typeof buildMockProposals>
    >();
    let deterministicTimeoutObservedAbort = false;
    const deterministicTimeoutResult = captureGatewayFailure(
      envelope(fixture, {
        mode: "deterministic",
        timeoutMs: TARGETED_LIFECYCLE_TIMEOUT_MS,
      }),
      {
        adapter: liveAdapter,
        deterministic_execute(_input, lifecycle) {
          lifecycle.signal.addEventListener(
            "abort",
            () => {
              deterministicTimeoutObservedAbort = true;
            },
            { once: true },
          );
          deterministicTimeoutStarted.resolve(undefined);
          return deterministicTimeoutOutput.promise;
        },
      },
    );
    await waitForTestStage(
      deterministicTimeoutStarted.promise,
      "Observe deterministic timeout",
    );
    const deterministicTimeoutFailure = await deterministicTimeoutResult;
    assert.equal(deterministicTimeoutFailure.code, "model_gateway_timeout");
    assert.equal(deterministicTimeoutFailure.receipt?.outcome, "timeout");
    assert.equal(deterministicTimeoutFailure.receipt?.egress_attempted, false);
    assert.equal(deterministicTimeoutFailure.receipt?.budget.provider_calls_used, 0);
    assert.equal(deterministicTimeoutObservedAbort, true);
    deterministicTimeoutOutput.resolve([]);

    const timeoutTransportStarted = deferred<void>();
    const timeoutAdapter = createOpenAIResponsesAdapterV01({
      environment: { OPENAI_API_KEY: CREDENTIAL_SENTINEL },
      transport: (request) => {
        metrics.timeout_transport_calls += 1;
        timeoutTransportStarted.resolve(undefined);
        return rejectWhenAborted(request.signal);
      },
    });
    const timeoutResult = captureGatewayFailure(
      envelope(fixture, { timeoutMs: TARGETED_LIFECYCLE_TIMEOUT_MS }),
      gatewayDependencies(timeoutAdapter),
    );
    await waitForTestStage(
      timeoutTransportStarted.promise,
      "Observe provider transport timeout",
    );
    const timeoutFailure = await timeoutResult;
    assert.equal(timeoutFailure.code, "model_gateway_timeout");
    assert.equal(timeoutFailure.receipt?.outcome, "timeout");
    assert.equal(metrics.timeout_transport_calls, 1);

    let transportStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      transportStarted = resolve;
    });
    const cancellationAdapter = createOpenAIResponsesAdapterV01({
      environment: { OPENAI_API_KEY: CREDENTIAL_SENTINEL },
      transport: (request) => {
        metrics.cancellation_transport_calls += 1;
        transportStarted();
        return rejectWhenAborted(request.signal);
      },
    });
    const externalCancellation = new AbortController();
    const cancellationResult = invokeObserveModelGatewayV01(
      envelope(fixture, { signal: externalCancellation.signal }),
      gatewayDependencies(cancellationAdapter),
    ).then(
      () => null,
      (error: unknown) => error,
    );
    await waitForTestStage(started, "Observe provider transport cancellation");
    externalCancellation.abort();
    const cancellationFailure = await cancellationResult;
    assert.equal(isModelGatewayInvocationErrorV01(cancellationFailure), true);
    if (!isModelGatewayInvocationErrorV01(cancellationFailure)) {
      throw new Error("expected normalized cancellation failure");
    }
    assert.equal(cancellationFailure.code, "model_gateway_cancelled");
    assert.equal(cancellationFailure.receipt?.outcome, "cancelled");
    assert.equal(metrics.cancellation_transport_calls, 1);

    const deterministicDatabase = openDatabase();
    const beforeDeterministicHostile = rowCounts(deterministicDatabase);
    deterministicDatabase.close();
    const deterministicLogs: string[] = [];
    const originalDeterministicConsoleError = console.error;
    console.error = (...values: unknown[]) => {
      deterministicLogs.push(values.map(String).join(" "));
    };
    let deterministicHostileResponse: Response;
    try {
      const deterministicHostileDependencies: ObserveModelGatewayDependenciesV01 = {
        adapter: liveAdapter,
        deterministic_execute() {
          throw new Error(HOSTILE_SENTINEL);
        },
      };
      const deterministicHostileFailure = await captureGatewayFailure(
        envelope(fixture, {
          mode: "deterministic",
          message: `Deterministic hostile input ${HOSTILE_SENTINEL}`,
        }),
        deterministicHostileDependencies,
      );
      assert.equal(
        deterministicHostileFailure.code,
        "model_gateway_deterministic_failed",
      );
      assert.equal(
        deterministicHostileFailure.receipt?.outcome,
        "deterministic_failure",
      );
      assert.equal(deterministicHostileFailure.receipt?.egress_attempted, false);
      assert.equal(
        deterministicHostileFailure.receipt?.budget.provider_calls_used,
        0,
      );
      assert.equal(
        JSON.stringify(deterministicHostileFailure).includes(HOSTILE_SENTINEL),
        false,
      );
      deterministicHostileResponse = await createObservePostHandlerV01({
        gateway_dependencies: deterministicHostileDependencies,
      })(
        observeRequest(fixture, {
          message: `Deterministic hostile route ${HOSTILE_SENTINEL}`,
          execution_mode: "deterministic",
        }),
      );
    } finally {
      console.error = originalDeterministicConsoleError;
    }
    assert.equal(deterministicHostileResponse!.status, 500);
    const deterministicHostileBody = await deterministicHostileResponse!.json();
    assert.equal(
      JSON.stringify(deterministicHostileBody).includes(HOSTILE_SENTINEL),
      false,
    );
    assert.equal(Object.hasOwn(deterministicHostileBody, "compiler"), false);
    assert.equal(Object.hasOwn(deterministicHostileBody, "proposals"), false);
    assert.equal(deterministicLogs.join("\n").includes(HOSTILE_SENTINEL), false);
    const databaseAfterDeterministicHostile = openDatabase();
    assert.deepEqual(
      rowCounts(databaseAfterDeterministicHostile),
      beforeDeterministicHostile,
    );
    databaseAfterDeterministicHostile.close();

    const database = openDatabase();
    const beforeHostile = rowCounts(database);
    database.close();
    const capturedLogs: string[] = [];
    const originalConsoleError = console.error;
    console.error = (...values: unknown[]) => {
      capturedLogs.push(values.map(String).join(" "));
    };
    let hostileResponse: Response;
    try {
      const hostileAdapter = createOpenAIResponsesAdapterV01({
        environment: { OPENAI_API_KEY: CREDENTIAL_SENTINEL },
        transport: async () => ({
          ok: false,
          status: 429,
          async json() {
            metrics.hostile_body_reads += 1;
            return {
              secret: CREDENTIAL_SENTINEL,
              body: HOSTILE_SENTINEL,
            };
          },
        }),
      });
      hostileResponse = await createObservePostHandlerV01({
        gateway_dependencies: { adapter: hostileAdapter },
      })(
        observeRequest(fixture, {
          message: `Provider rejection input ${HOSTILE_SENTINEL}`,
          execution_mode: "live",
        }),
      );
    } finally {
      console.error = originalConsoleError;
    }
    assert.equal(hostileResponse!.status, 502);
    const hostileText = await hostileResponse!.text();
    assert.equal(metrics.hostile_body_reads, 0);
    assert.equal(hostileText.includes(HOSTILE_SENTINEL), false);
    assert.equal(hostileText.includes(CREDENTIAL_SENTINEL), false);
    assert.equal(capturedLogs.join("\n").includes(HOSTILE_SENTINEL), false);
    const databaseAfterHostile = openDatabase();
    assert.deepEqual(rowCounts(databaseAfterHostile), beforeHostile);
    databaseAfterHostile.close();

    const remainingCallerMetrics = await runRemainingCallerCases(fixture);

    const db = openDatabase();
    const projectBSelection = selectActiveProjectV01(db, {
      workspace_id: fixture.workspaceId,
      project_id: fixture.projectBId,
      now: "2026-07-15T00:01:00.000Z",
      expected_project_id: fixture.projectAId,
      expected_revision: fixture.activeRevision,
    });
    db.close();
    const projectBResult = await invokeObserveModelGatewayV01(
      envelope(fixture, {
        mode: "deterministic",
        projectId: fixture.projectBId,
        projectRoot: fixture.projectBRoot,
        activeRevision: projectBSelection.selection_revision,
        currentState: [stateEntry(fixture.projectBId, "project-b")],
      }),
      gatewayDependencies(liveAdapter),
    );
    assert.equal(projectBResult.model_invocation_receipt.project_id, fixture.projectBId);
    assert.notEqual(
      projectBResult.model_invocation_receipt.project_id,
      live.model_invocation_receipt.project_id,
    );
    const mixedProjectStateFailure = await captureGatewayFailure(
      envelope(fixture, {
        mode: "deterministic",
        projectId: fixture.projectBId,
        projectRoot: fixture.projectBRoot,
        activeRevision: projectBSelection.selection_revision,
        currentState: [stateEntry(fixture.projectAId, "project-a")],
      }),
      gatewayDependencies(liveAdapter),
    );
    assert.equal(mixedProjectStateFailure.code, "model_gateway_invalid_envelope");
    const staleProjectAFailure = await captureGatewayFailure(
      envelope(fixture),
      gatewayDependencies(liveAdapter),
    );
    assert.equal(staleProjectAFailure.code, "model_gateway_scope_refused");
    assert.equal(metrics.live_transport_calls, 1);

    assertObserveBypassGuard();
    assert.equal(undiciRequests, 0);
    assert.equal(
      JSON.stringify({
        live,
        noCredential,
        explicitDeterministic,
        boundedFailure,
        tinyBudgetFailure,
        preCancelledFailure,
        timeoutFailure,
        cancellationFailure,
        projectBResult,
        capturedLogs,
      }).includes(HOSTILE_SENTINEL),
      false,
    );
    assert.equal(
      JSON.stringify({
        live,
        noCredential,
        explicitDeterministic,
        boundedFailure,
        preCancelledFailure,
        timeoutFailure,
        cancellationFailure,
        projectBResult,
      }).includes(CREDENTIAL_SENTINEL),
      false,
    );

    process.stdout.write(
      `${JSON.stringify(
        {
          test: "model_gateway",
          status: "pass",
          production_entry_paths: [
            "POST /api/observe",
            "POST /api/plan",
            "POST /api/temporal-interpretation/preview",
          ],
          live_transport_calls: metrics.live_transport_calls,
          deterministic_transport_calls: metrics.zero_model_transport_calls,
          blocked_transport_calls: metrics.blocked_transport_calls,
          timeout_transport_calls: metrics.timeout_transport_calls,
          cancellation_transport_calls: metrics.cancellation_transport_calls,
          hostile_provider_body_reads: metrics.hostile_body_reads,
          planner_live_transport_calls:
            remainingCallerMetrics.planner_live_transport_calls,
          temporal_live_transport_calls:
            remainingCallerMetrics.temporal_live_transport_calls,
          remaining_caller_blocked_transports:
            remainingCallerMetrics.blocked_transport_calls,
          undici_requests: undiciRequests,
          canonical_projects_checked: 2,
          semantic_receipt_contradictions_rejected:
            semanticReceiptContradictions,
          direct_model_transport_guard: "pass",
        },
        null,
        2,
      )}\n`,
    );
  } finally {
    undiciChannel.unsubscribe(onUndiciRequest);
    if (originalDatabasePath === undefined) delete process.env.AUGNES_DB_PATH;
    else process.env.AUGNES_DB_PATH = originalDatabasePath;
    rmSync(root, { recursive: true, force: true });
  }
}

async function runRemainingCallerCases(fixture: Fixture) {
  const metrics = {
    planner_live_transport_calls: 0,
    temporal_live_transport_calls: 0,
    deterministic_transport_calls: 0,
    blocked_transport_calls: 0,
    planner_hostile_body_reads: 0,
    temporal_hostile_body_reads: 0,
  };
  const plannerRequests: Parameters<OpenAIResponsesTransportV01>[0][] = [];
  const plannerAdapter = createOpenAIResponsesAdapterV01({
    environment: {
      OPENAI_API_KEY: CREDENTIAL_SENTINEL,
      OPENAI_MODEL: "planner-test-model",
    },
    transport: async (request) => {
      metrics.planner_live_transport_calls += 1;
      plannerRequests.push(request);
      return providerJsonSuccess(plannerProviderOutput(), {
        input_tokens: 44,
        output_tokens: 12,
        total_tokens: 56,
      });
    },
  });
  const plannerHandler = createPlannerPostHandlerV01({
    gateway_dependencies: { adapter: plannerAdapter },
    create_uuid: () => "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  });
  const plannerResponse = await plannerHandler(
    plannerRequest(fixture, {
      message: "Plan a bounded next step.",
      execution_mode: "live",
    }),
  );
  assert.equal(plannerResponse.status, 200);
  const plannerLive = await plannerResponse.json();
  assert.equal(metrics.planner_live_transport_calls, 1);
  assert.equal(plannerLive.planner, "openai");
  assert.equal(plannerLive.workspace_id, fixture.workspaceId);
  assert.equal(plannerLive.project_id, fixture.projectAId);
  assert.equal(plannerLive.recommendations[0]?.priority, "next");
  assert.equal(
    plannerLive.model_invocation_receipt.purpose,
    PLANNER_MODEL_GATEWAY_PURPOSE_V01,
  );
  assert.equal(plannerLive.model_invocation_receipt.project_id, fixture.projectAId);
  assert.deepEqual(plannerLive.model_invocation_receipt.usage, {
    basis: "provider_report",
    quality: "reported",
    source: "provider_response",
    input_tokens: 44,
    output_tokens: 12,
    total_tokens: 56,
  });
  assertReceiptHasNoPurposeContent(
    plannerLive.model_invocation_receipt,
    "Plan a bounded next step.",
  );
  const plannerProviderRequest = JSON.parse(plannerRequests[0]!.body);
  const plannerDynamic = JSON.parse(
    plannerProviderRequest.input[1].content[0].text,
  );
  assert.equal(plannerDynamic.project_id, fixture.projectAId);
  assert.equal(plannerDynamic.brief.scope, fixture.projectAId);
  assert.equal(Object.hasOwn(plannerDynamic, "workspace_id"), false);

  const noCredentialAdapter = createOpenAIResponsesAdapterV01({
    environment: {},
    transport: async () => {
      metrics.deterministic_transport_calls += 1;
      return providerJsonSuccess(plannerProviderOutput());
    },
  });
  const plannerNoCredential = await createPlannerPostHandlerV01({
    gateway_dependencies: { adapter: noCredentialAdapter },
  })(
    plannerRequest(fixture, {
      message: "Plan without credentials.",
      execution_mode: "live",
    }),
  );
  assert.equal(plannerNoCredential.status, 200);
  const plannerNoCredentialBody = await plannerNoCredential.json();
  assert.equal(plannerNoCredentialBody.planner, "mock");
  assert.equal(
    plannerNoCredentialBody.model_invocation_receipt.selection_reason,
    "provider_unavailable",
  );
  assert.equal(plannerNoCredentialBody.model_invocation_receipt.egress_attempted, false);

  const plannerDeterministic = await createPlannerPostHandlerV01({
    gateway_dependencies: { adapter: plannerAdapter },
  })(
    plannerRequest(fixture, {
      message: "Plan deterministically.",
      execution_mode: "deterministic",
    }),
  );
  assert.equal(plannerDeterministic.status, 200);
  const plannerDeterministicBody = await plannerDeterministic.json();
  assert.equal(plannerDeterministicBody.planner, "mock");
  assert.equal(
    plannerDeterministicBody.model_invocation_receipt.selection_reason,
    "explicit_deterministic",
  );
  assert.equal(metrics.planner_live_transport_calls, 1);
  assert.equal(metrics.deterministic_transport_calls, 0);

  const plannerMissingIdentity = await plannerHandler(
    jsonRequest("http://localhost/api/plan", {
      message: HOSTILE_SENTINEL,
      execution_mode: "live",
    }),
  );
  assert.equal(plannerMissingIdentity.status, 400);
  assert.equal((await plannerMissingIdentity.text()).includes(HOSTILE_SENTINEL), false);

  for (const body of [
    plannerRequestBody(fixture, { project_id: UNKNOWN_PROJECT_ID }),
    plannerRequestBody(fixture, { workspace_id: UNKNOWN_WORKSPACE_ID }),
    plannerRequestBody(fixture, {
      expected_active_selection_revision: fixture.activeRevision + 1,
    }),
    plannerRequestBody(fixture, {
      project_id: fixture.projectBId,
      expected_active_project_id: fixture.projectBId,
      project_root: fixture.projectBRoot,
    }),
  ]) {
    const callsBeforeRefusal: number = metrics.planner_live_transport_calls;
    const response = await plannerHandler(jsonRequest("http://localhost/api/plan", body));
    assert.equal(response.status, 409);
    assert.equal(metrics.planner_live_transport_calls, callsBeforeRefusal);
    assert.equal((await response.text()).includes(HOSTILE_SENTINEL), false);
  }

  const plannerBrief = buildStateBrief(fixture.projectAId);
  const plannerDependencies = plannerGatewayDependencies(plannerAdapter);
  const briefMismatch = await captureAnyGatewayFailure(() =>
    invokePlannerModelGatewayV01(
      plannerEnvelope(fixture, {
        brief: { ...plannerBrief, scope: fixture.projectBId },
      }),
      plannerDependencies,
    ),
  );
  assert.equal(briefMismatch.code, "model_gateway_invalid_envelope");
  assert.equal(metrics.planner_live_transport_calls, 1);

  const plannerBudgetFailure = await captureAnyGatewayFailure(() =>
    invokePlannerModelGatewayV01(
      plannerEnvelope(fixture, {
        budget: {
          max_input_bytes: 1,
          max_output_tokens: 1,
          max_provider_calls: 1,
        },
      }),
      plannerDependencies,
    ),
  );
  assert.equal(plannerBudgetFailure.code, "model_gateway_egress_refused");
  assert.equal(metrics.planner_live_transport_calls, 1);

  const plannerPreCancelledController = new AbortController();
  plannerPreCancelledController.abort();
  const plannerPreCancelled = await captureAnyGatewayFailure(() =>
    invokePlannerModelGatewayV01(
      plannerEnvelope(fixture, { signal: plannerPreCancelledController.signal }),
      plannerDependencies,
    ),
  );
  assert.equal(plannerPreCancelled.code, "model_gateway_cancelled");
  assert.equal(plannerPreCancelled.receipt?.egress_attempted, false);

  const prepareStarted = deferred<void>();
  const prepareSession = deferred<ModelAdapterSessionV01 | null>();
  let plannerPreparedInvokes = 0;
  const prepareAdapter: ModelAdapterV01 = {
    describe: () => ({
      implementation_id: "test.planner_prepare",
      implementation_version: "test_planner_prepare.v0.1",
    }),
    async prepare(_purpose, signal) {
      assert.equal(signal.aborted, false);
      prepareStarted.resolve(undefined);
      return prepareSession.promise;
    },
  };
  const prepareController = new AbortController();
  const plannerPrepareResult = invokePlannerModelGatewayV01(
    plannerEnvelope(fixture, { signal: prepareController.signal }),
    plannerGatewayDependencies(prepareAdapter),
  ).then(
    () => null,
    (error: unknown) => error,
  );
  await waitForTestStage(
    prepareStarted.promise,
    "Planner adapter preparation cancellation",
  );
  prepareController.abort();
  const plannerPrepareFailure = await plannerPrepareResult;
  assert.equal(isModelGatewayInvocationErrorV01(plannerPrepareFailure), true);
  if (!isModelGatewayInvocationErrorV01(plannerPrepareFailure)) {
    throw new Error("expected planner prepare cancellation");
  }
  assert.equal(plannerPrepareFailure.code, "model_gateway_cancelled");
  assert.equal(plannerPrepareFailure.receipt?.egress_attempted, false);
  prepareSession.resolve(
    unreachablePurposeSession(PLANNER_MODEL_GATEWAY_PURPOSE_V01, () => {
      plannerPreparedInvokes += 1;
    }),
  );
  await Promise.resolve();
  assert.equal(plannerPreparedInvokes, 0);

  const plannerPrepareTimeoutStarted = deferred<void>();
  const plannerPrepareTimeoutSession = deferred<ModelAdapterSessionV01 | null>();
  let plannerTimeoutPreparedInvokes = 0;
  const plannerPrepareTimeoutAdapter: ModelAdapterV01 = {
    describe: () => ({
      implementation_id: "test.planner_prepare_timeout",
      implementation_version: "test_planner_prepare_timeout.v0.1",
    }),
    async prepare() {
      plannerPrepareTimeoutStarted.resolve(undefined);
      return plannerPrepareTimeoutSession.promise;
    },
  };
  const plannerPrepareTimeoutResult = invokePlannerModelGatewayV01(
    plannerEnvelope(fixture, { timeoutMs: TARGETED_LIFECYCLE_TIMEOUT_MS }),
    plannerGatewayDependencies(plannerPrepareTimeoutAdapter),
  ).then(
    () => null,
    (error: unknown) => error,
  );
  await waitForTestStage(
    plannerPrepareTimeoutStarted.promise,
    "Planner adapter preparation timeout",
  );
  const plannerPrepareTimeoutFailure = await plannerPrepareTimeoutResult;
  assert.equal(isModelGatewayInvocationErrorV01(plannerPrepareTimeoutFailure), true);
  if (!isModelGatewayInvocationErrorV01(plannerPrepareTimeoutFailure)) {
    throw new Error("expected planner prepare timeout");
  }
  assert.equal(plannerPrepareTimeoutFailure.code, "model_gateway_timeout");
  assert.equal(plannerPrepareTimeoutFailure.receipt?.egress_attempted, false);
  plannerPrepareTimeoutSession.resolve(
    unreachablePurposeSession(PLANNER_MODEL_GATEWAY_PURPOSE_V01, () => {
      plannerTimeoutPreparedInvokes += 1;
    }),
  );
  await Promise.resolve();
  assert.equal(plannerTimeoutPreparedInvokes, 0);

  let plannerTransportStarted!: () => void;
  const plannerTransportReady = new Promise<void>((resolve) => {
    plannerTransportStarted = resolve;
  });
  const plannerTransportAdapter = createOpenAIResponsesAdapterV01({
    environment: { OPENAI_API_KEY: CREDENTIAL_SENTINEL },
    transport(request) {
      plannerTransportStarted();
      return rejectWhenAborted(request.signal);
    },
  });
  const plannerTransportController = new AbortController();
  const plannerTransportResult = invokePlannerModelGatewayV01(
    plannerEnvelope(fixture, { signal: plannerTransportController.signal }),
    plannerGatewayDependencies(plannerTransportAdapter),
  ).then(
    () => null,
    (error: unknown) => error,
  );
  await waitForTestStage(
    plannerTransportReady,
    "Planner provider transport cancellation",
  );
  plannerTransportController.abort();
  const plannerTransportFailure = await plannerTransportResult;
  assert.equal(isModelGatewayInvocationErrorV01(plannerTransportFailure), true);
  if (!isModelGatewayInvocationErrorV01(plannerTransportFailure)) {
    throw new Error("expected planner transport cancellation");
  }
  assert.equal(plannerTransportFailure.code, "model_gateway_cancelled");
  assert.equal(plannerTransportFailure.receipt?.egress_attempted, true);

  const plannerTimeoutTransportStarted = deferred<void>();
  const plannerTransportTimeoutResult = captureAnyGatewayFailure(() =>
    invokePlannerModelGatewayV01(
      plannerEnvelope(fixture, {
        timeoutMs: TARGETED_LIFECYCLE_TIMEOUT_MS,
      }),
      plannerGatewayDependencies(
        createOpenAIResponsesAdapterV01({
          environment: { OPENAI_API_KEY: CREDENTIAL_SENTINEL },
          transport: (request) => {
            plannerTimeoutTransportStarted.resolve(undefined);
            return rejectWhenAborted(request.signal);
          },
        }),
      ),
    ),
  );
  await waitForTestStage(
    plannerTimeoutTransportStarted.promise,
    "Planner provider transport timeout",
  );
  const plannerTransportTimeout = await plannerTransportTimeoutResult;
  assert.equal(plannerTransportTimeout.code, "model_gateway_timeout");
  assert.equal(plannerTransportTimeout.receipt?.egress_attempted, true);

  const plannerHostileAdapter = createOpenAIResponsesAdapterV01({
    environment: { OPENAI_API_KEY: CREDENTIAL_SENTINEL },
    transport: async () => ({
      ok: false,
      status: 429,
      async json() {
        metrics.planner_hostile_body_reads += 1;
        return { body: HOSTILE_SENTINEL, credential: CREDENTIAL_SENTINEL };
      },
    }),
  });
  const plannerHostile = await createPlannerPostHandlerV01({
    gateway_dependencies: { adapter: plannerHostileAdapter },
  })(
    plannerRequest(fixture, {
      message: `Hostile Planner input ${HOSTILE_SENTINEL}`,
      execution_mode: "live",
    }),
  );
  assert.equal(plannerHostile.status, 502);
  const plannerHostileText = await plannerHostile.text();
  assert.equal(metrics.planner_hostile_body_reads, 0);
  assert.equal(plannerHostileText.includes(HOSTILE_SENTINEL), false);
  assert.equal(plannerHostileText.includes(CREDENTIAL_SENTINEL), false);

  const context = buildTemporalPreviewContext(fixture.projectAId);
  const temporalRequests: Parameters<OpenAIResponsesTransportV01>[0][] = [];
  const temporalAdapter = createOpenAIResponsesAdapterV01({
    environment: {
      OPENAI_API_KEY: CREDENTIAL_SENTINEL,
      OPENAI_MODEL: "temporal-test-model",
    },
    transport: async (request) => {
      metrics.temporal_live_transport_calls += 1;
      temporalRequests.push(request);
      return providerJsonSuccess(buildMockTemporalPreview(context), {
        input_tokens: 72,
        output_tokens: 28,
        total_tokens: 100,
      });
    },
  });
  const temporalHandler = createTemporalPreviewPostHandlerV01({
    gateway_dependencies: { adapter: temporalAdapter },
  });
  const temporalLiveResponse = await temporalHandler(
    temporalRequest(fixture, context, "live"),
  );
  assert.equal(temporalLiveResponse.status, 200);
  const temporalLive = await temporalLiveResponse.json();
  assert.equal(metrics.temporal_live_transport_calls, 1);
  assert.equal(temporalLive.generator, "openai");
  assert.equal(temporalLive.model, "temporal-test-model");
  assert.equal(temporalLive.project_id, fixture.projectAId);
  assert.equal(
    temporalLive.model_invocation_receipt.purpose,
    TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
  );
  assert.equal(temporalLive.model_invocation_receipt.receipt_is_semantic_authority, false);
  assert.equal(temporalLive.preview.non_authority_boundary.length > 0, true);
  assertReceiptHasNoPurposeContent(
    temporalLive.model_invocation_receipt,
    context.current_interpretation,
  );
  const temporalProviderRequest = JSON.parse(temporalRequests[0]!.body);
  const temporalDynamic = JSON.parse(
    temporalProviderRequest.input[1].content[0].text,
  );
  assert.equal(temporalDynamic.project_id, fixture.projectAId);
  assert.equal(temporalDynamic.context.scope, fixture.projectAId);

  const temporalNoCredential = await createTemporalPreviewPostHandlerV01({
    gateway_dependencies: { adapter: noCredentialAdapter },
  })(temporalRequest(fixture, context, "live"));
  assert.equal(temporalNoCredential.status, 200);
  const temporalNoCredentialBody = await temporalNoCredential.json();
  assert.equal(temporalNoCredentialBody.generator, "mock");
  assert.equal(
    temporalNoCredentialBody.model_invocation_receipt.selection_reason,
    "provider_unavailable",
  );
  assert.equal(temporalNoCredentialBody.model_invocation_receipt.egress_attempted, false);

  const temporalDeterministic = await temporalHandler(
    temporalRequest(fixture, context, "deterministic"),
  );
  assert.equal(temporalDeterministic.status, 200);
  const temporalDeterministicBody = await temporalDeterministic.json();
  assert.equal(temporalDeterministicBody.generator, "mock");
  assert.equal(
    temporalDeterministicBody.model_invocation_receipt.selection_reason,
    "explicit_deterministic",
  );
  assert.equal(metrics.temporal_live_transport_calls, 1);

  const temporalDependencies = temporalGatewayDependencies(temporalAdapter);
  const temporalPrepareStarted = deferred<void>();
  const temporalPrepareSession = deferred<ModelAdapterSessionV01 | null>();
  let temporalPreparedInvokes = 0;
  const temporalPrepareAdapter: ModelAdapterV01 = {
    describe: () => ({
      implementation_id: "test.temporal_prepare",
      implementation_version: "test_temporal_prepare.v0.1",
    }),
    async prepare() {
      temporalPrepareStarted.resolve(undefined);
      return temporalPrepareSession.promise;
    },
  };
  const temporalPrepareController = new AbortController();
  const temporalPrepareResult = invokeTemporalModelGatewayV01(
    temporalEnvelope(fixture, { signal: temporalPrepareController.signal }),
    temporalGatewayDependencies(temporalPrepareAdapter),
  ).then(
    () => null,
    (error: unknown) => error,
  );
  await waitForTestStage(
    temporalPrepareStarted.promise,
    "Temporal adapter preparation cancellation",
  );
  temporalPrepareController.abort();
  const temporalPrepareFailure = await temporalPrepareResult;
  assert.equal(isModelGatewayInvocationErrorV01(temporalPrepareFailure), true);
  if (!isModelGatewayInvocationErrorV01(temporalPrepareFailure)) {
    throw new Error("expected temporal prepare cancellation");
  }
  assert.equal(temporalPrepareFailure.code, "model_gateway_cancelled");
  assert.equal(temporalPrepareFailure.receipt?.egress_attempted, false);
  temporalPrepareSession.resolve(
    unreachablePurposeSession(TEMPORAL_MODEL_GATEWAY_PURPOSE_V01, () => {
      temporalPreparedInvokes += 1;
    }),
  );
  await Promise.resolve();
  assert.equal(temporalPreparedInvokes, 0);

  const mismatchContext = { ...context, scope: fixture.projectBId };
  const temporalScopeMismatch = await captureAnyGatewayFailure(() =>
    invokeTemporalModelGatewayV01(
      temporalEnvelope(fixture, { context: mismatchContext }),
      temporalDependencies,
    ),
  );
  assert.equal(temporalScopeMismatch.code, "model_gateway_invalid_envelope");
  assert.equal(metrics.temporal_live_transport_calls, 1);

  const foreignContext = structuredClone(context);
  foreignContext.summary_refs = [
    {
      ref: `summary:${fixture.projectBId}`,
      summary: "Foreign project material must not cross the boundary.",
    },
  ];
  const temporalForeignFailure = await captureAnyGatewayFailure(() =>
    invokeTemporalModelGatewayV01(
      temporalEnvelope(fixture, { context: foreignContext }),
      temporalDependencies,
    ),
  );
  assert.equal(temporalForeignFailure.code, "model_gateway_egress_refused");
  assert.equal(metrics.temporal_live_transport_calls, 1);

  const injectedContext = {
    ...context,
    system_prompt: HOSTILE_SENTINEL,
  } as unknown as TemporalPreviewContext;
  const temporalInjectionFailure = await captureAnyGatewayFailure(() =>
    invokeTemporalModelGatewayV01(
      temporalEnvelope(fixture, { context: injectedContext }),
      temporalDependencies,
    ),
  );
  assert.equal(temporalInjectionFailure.code, "model_gateway_invalid_envelope");
  assert.equal(JSON.stringify(temporalInjectionFailure).includes(HOSTILE_SENTINEL), false);

  const accessorContext = structuredClone(context) as unknown as Record<string, unknown>;
  Object.defineProperty(accessorContext, "current_interpretation", {
    enumerable: true,
    get() {
      return HOSTILE_SENTINEL;
    },
  });
  const cyclicValue: Record<string, unknown> = {};
  cyclicValue.self = cyclicValue;
  const adversarialTemporalContexts: unknown[] = [
    accessorContext,
    { ...context, current_interpretation: cyclicValue },
    { ...context, current_interpretation: new Date(0) },
    { ...context, current_interpretation: `OPENAI_API_KEY=${HOSTILE_SENTINEL}` },
    { ...context, role: "system" },
    { ...context, model: "unapproved-model" },
    { ...context, endpoint: "https://example.invalid/model" },
    (() => {
      const { safe_next_step: _removed, ...incomplete } = context;
      return incomplete;
    })(),
  ];
  for (const adversarialContext of adversarialTemporalContexts) {
    const failure = await captureAnyGatewayFailure(() =>
      invokeTemporalModelGatewayV01(
        temporalEnvelope(fixture, {
          context: adversarialContext as TemporalPreviewContext,
        }),
        temporalDependencies,
      ),
    );
    assert.equal(failure.code, "model_gateway_invalid_envelope");
    assert.equal(JSON.stringify(failure).includes(HOSTILE_SENTINEL), false);
    assert.equal(metrics.temporal_live_transport_calls, 1);
  }
  const oversizedTemporalFailure = await captureAnyGatewayFailure(() =>
    invokeTemporalModelGatewayV01(
      temporalEnvelope(fixture, {
        context: { ...context, current_interpretation: "x".repeat(4_097) },
      }),
      temporalDependencies,
    ),
  );
  assert.equal(oversizedTemporalFailure.code, "model_gateway_egress_refused");
  assert.equal(metrics.temporal_live_transport_calls, 1);

  const temporalDeterministicController = new AbortController();
  const temporalDeterministicStarted = deferred<void>();
  const temporalDeterministicOutput = deferred<
    ReturnType<typeof buildMockTemporalPreview>
  >();
  const temporalDeterministicResult = invokeTemporalModelGatewayV01(
    temporalEnvelope(fixture, {
      mode: "deterministic",
      signal: temporalDeterministicController.signal,
    }),
    {
      adapter: temporalAdapter,
      deterministic_execute(_input, lifecycle) {
        assert.equal(lifecycle.signal.aborted, false);
        temporalDeterministicStarted.resolve(undefined);
        return temporalDeterministicOutput.promise;
      },
    },
  ).then(
    () => null,
    (error: unknown) => error,
  );
  await waitForTestStage(
    temporalDeterministicStarted.promise,
    "Temporal deterministic cancellation",
  );
  temporalDeterministicController.abort();
  const temporalDeterministicFailure = await temporalDeterministicResult;
  assert.equal(isModelGatewayInvocationErrorV01(temporalDeterministicFailure), true);
  if (!isModelGatewayInvocationErrorV01(temporalDeterministicFailure)) {
    throw new Error("expected temporal deterministic cancellation");
  }
  assert.equal(temporalDeterministicFailure.code, "model_gateway_cancelled");
  assert.equal(temporalDeterministicFailure.receipt?.egress_attempted, false);
  temporalDeterministicOutput.resolve(buildMockTemporalPreview(context));

  const temporalTimeoutStarted = deferred<void>();
  const temporalTimeoutOutput = deferred<ReturnType<typeof buildMockTemporalPreview>>();
  const temporalTimeoutResult = captureAnyGatewayFailure(() =>
    invokeTemporalModelGatewayV01(
      temporalEnvelope(fixture, {
        mode: "deterministic",
        timeoutMs: TARGETED_LIFECYCLE_TIMEOUT_MS,
      }),
      {
        adapter: temporalAdapter,
        deterministic_execute(_input, lifecycle) {
          assert.equal(lifecycle.signal.aborted, false);
          temporalTimeoutStarted.resolve(undefined);
          return temporalTimeoutOutput.promise;
        },
      },
    ),
  );
  await waitForTestStage(
    temporalTimeoutStarted.promise,
    "Temporal deterministic timeout",
  );
  const temporalTimeout = await temporalTimeoutResult;
  assert.equal(temporalTimeout.code, "model_gateway_timeout");
  assert.equal(temporalTimeout.receipt?.egress_attempted, false);
  temporalTimeoutOutput.resolve(buildMockTemporalPreview(context));

  let temporalTransportStarted!: () => void;
  const temporalTransportReady = new Promise<void>((resolve) => {
    temporalTransportStarted = resolve;
  });
  const temporalCancellationAdapter = createOpenAIResponsesAdapterV01({
    environment: { OPENAI_API_KEY: CREDENTIAL_SENTINEL },
    transport: (request) => {
      temporalTransportStarted();
      return rejectWhenAborted(request.signal);
    },
  });
  const temporalCancellationController = new AbortController();
  const temporalCancellationResult = invokeTemporalModelGatewayV01(
    temporalEnvelope(fixture, { signal: temporalCancellationController.signal }),
    temporalGatewayDependencies(temporalCancellationAdapter),
  ).then(
    () => null,
    (error: unknown) => error,
  );
  await waitForTestStage(
    temporalTransportReady,
    "Temporal provider transport cancellation",
  );
  temporalCancellationController.abort();
  const temporalCancellationFailure = await temporalCancellationResult;
  assert.equal(isModelGatewayInvocationErrorV01(temporalCancellationFailure), true);
  if (!isModelGatewayInvocationErrorV01(temporalCancellationFailure)) {
    throw new Error("expected temporal transport cancellation");
  }
  assert.equal(temporalCancellationFailure.code, "model_gateway_cancelled");
  assert.equal(temporalCancellationFailure.receipt?.egress_attempted, true);

  const databaseBeforeHostile = openDatabase();
  const hostileCounts = rowCounts(databaseBeforeHostile);
  databaseBeforeHostile.close();
  const temporalHostileAdapter = createOpenAIResponsesAdapterV01({
    environment: { OPENAI_API_KEY: CREDENTIAL_SENTINEL },
    transport: async () => ({
      ok: false,
      status: 503,
      async json() {
        metrics.temporal_hostile_body_reads += 1;
        return { body: HOSTILE_SENTINEL, credential: CREDENTIAL_SENTINEL };
      },
    }),
  });
  const temporalHostileResponse = await createTemporalPreviewPostHandlerV01({
    gateway_dependencies: { adapter: temporalHostileAdapter },
  })(
    temporalRequest(fixture, context, "live"),
  );
  assert.equal(temporalHostileResponse.status, 200);
  const temporalHostile = await temporalHostileResponse.json();
  assert.equal(temporalHostile.generator, "mock_fallback");
  assert.equal(
    temporalHostile.model_invocation_receipt.selection_reason,
    "provider_failure_fallback",
  );
  assert.equal(temporalHostile.model_invocation_receipt.egress_attempted, true);
  assert.equal(temporalHostile.model_invocation_receipt.budget.provider_calls_used, 1);
  assert.equal(metrics.temporal_hostile_body_reads, 0);
  assert.equal(JSON.stringify(temporalHostile).includes(HOSTILE_SENTINEL), false);
  assert.equal(JSON.stringify(temporalHostile).includes(CREDENTIAL_SENTINEL), false);
  const databaseAfterHostile = openDatabase();
  assert.deepEqual(rowCounts(databaseAfterHostile), hostileCounts);
  databaseAfterHostile.close();

  const observePolicy = policyAuthorizationFixture(fixture, "observe");
  const policyObserve = await invokeObserveModelGatewayV01(
    {
      ...envelope(fixture, { mode: "deterministic" }),
      policy: observePolicy.policy,
    },
    {
      ...gatewayDependencies(temporalAdapter),
      authorize_policy_invocation: () => observePolicy.authorization,
    },
  );
  assert.equal(policyObserve.model_invocation_receipt.invocation_origin, "policy_triggered");
  assert.equal(policyObserve.model_invocation_receipt.egress_attempted, false);

  const plannerPolicy = policyAuthorizationFixture(fixture, "planner");
  const policyPlanner = await invokePlannerModelGatewayV01(
    {
      ...plannerEnvelope(fixture, { mode: "deterministic" }),
      policy: plannerPolicy.policy,
    },
    {
      ...plannerGatewayDependencies(temporalAdapter),
      authorize_policy_invocation: () => plannerPolicy.authorization,
    },
  );
  assert.equal(policyPlanner.model_invocation_receipt.invocation_origin, "policy_triggered");
  assert.equal(policyPlanner.model_invocation_receipt.egress_attempted, false);

  let policyFallbackTransportCalls = 0;
  let policyFallbackBodyReads = 0;
  const policyFallbackAdapter = createOpenAIResponsesAdapterV01({
    environment: {
      OPENAI_API_KEY: CREDENTIAL_SENTINEL,
      OPENAI_MODEL: "temporal-fallback-test-model",
    },
    transport: async () => {
      policyFallbackTransportCalls += 1;
      return {
        ok: false,
        status: 503,
        async json() {
          policyFallbackBodyReads += 1;
          return { body: HOSTILE_SENTINEL };
        },
      };
    },
  });
  const temporalPolicy = policyAuthorizationFixture(fixture, "temporal");
  const policyTemporalFallback = await invokeTemporalModelGatewayV01(
    {
      ...temporalEnvelope(fixture),
      policy: temporalPolicy.policy,
    },
    {
      ...temporalGatewayDependencies(policyFallbackAdapter),
      authorize_policy_invocation: () => temporalPolicy.authorization,
    },
  );
  const fallbackReceipt = policyTemporalFallback.model_invocation_receipt;
  assert.equal(policyFallbackTransportCalls, 1);
  assert.equal(policyFallbackBodyReads, 0);
  assert.equal(fallbackReceipt.invocation_origin, "policy_triggered");
  assert.equal(fallbackReceipt.selection_reason, "provider_failure_fallback");
  assert.equal(fallbackReceipt.outcome, "deterministic_fallback_success");
  assert.equal(fallbackReceipt.fallback_used, true);
  assert.equal(fallbackReceipt.attempted_provider_ref?.external_id, "openai");
  assert.equal(
    fallbackReceipt.attempted_model_ref?.external_id,
    "temporal-fallback-test-model",
  );
  assert.equal(fallbackReceipt.final_implementation_id, "deterministic.temporal");
  assert.equal(fallbackReceipt.budget.provider_calls_used, 1);
  assert.equal(fallbackReceipt.egress_status, "occurred");
  assert.equal(fallbackReceipt.failure_code, "model_gateway_provider_rejected");
  const fallbackEntry = projectModelInvocationReceiptToRunReceiptEntryV02({
    receipt: fallbackReceipt,
    workspace_id: fixture.workspaceId,
    project_id: fixture.projectAId,
    work_id: temporalPolicy.policy.work_id,
    run_id: temporalPolicy.policy.run_id,
  });
  assert.equal(fallbackEntry.invocation_receipt.fallback_used, true);
  assert.equal(fallbackEntry.invocation_receipt.budget.provider_calls_used, 1);
  assert.equal(JSON.stringify(fallbackEntry).includes(HOSTILE_SENTINEL), false);

  assert.equal(metrics.deterministic_transport_calls, 0);
  assert.equal(metrics.blocked_transport_calls, 0);
  return metrics;
}

function plannerGatewayDependencies(
  adapter: ModelAdapterV01,
): PlannerModelGatewayDependenciesV01 {
  return {
    adapter,
    deterministic_execute(input) {
      return buildMockRecommendations(input.brief);
    },
  };
}

function temporalGatewayDependencies(
  adapter: ModelAdapterV01,
): TemporalModelGatewayDependenciesV01 {
  return {
    adapter,
    deterministic_execute(input) {
      return buildMockTemporalPreview(input.context);
    },
  };
}

function policyAuthorizationFixture(
  fixture: Fixture,
  label: "observe" | "planner" | "temporal",
) {
  const revision = 1;
  const workId = `work:gateway-policy-${label}`;
  const runId = `run:gateway-policy-${label}`;
  const grantId = `grant:gateway-policy-${label}`;
  const grantFingerprint =
    "sha256:dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd";
  const policy = {
    invocation_origin: "policy_triggered" as const,
    automation_control_revision: revision,
    work_id: workId,
    run_id: runId,
    grant_id: grantId,
    grant_fingerprint: grantFingerprint,
  };
  const authorization: ModelGatewayPolicyAuthorizationV01 = {
    workspace_id: fixture.workspaceId,
    project_id: fixture.projectAId,
    work_id: workId,
    run_id: runId,
    automation_control_revision: revision,
    grant_lineage_ref: {
      ref_version: "external_ref.v0.1",
      ref_type: "model_invocation_capability_grant",
      external_id: grantId,
      source_ref: grantFingerprint,
      trust_class: "direct_local_observation",
    },
    automation_control_lineage_ref: {
      ref_version: "external_ref.v0.1",
      ref_type: "project_automation_control",
      external_id: `${fixture.projectAId}:automation-control:${revision}`,
      source_ref: `control-revision:${revision}`,
      trust_class: "direct_local_observation",
    },
  };
  return { policy, authorization };
}

function plannerEnvelope(
  fixture: Fixture,
  options: {
    brief?: ReturnType<typeof buildStateBrief>;
    mode?: ModelGatewayExecutionModeV01;
    signal?: AbortSignal;
    timeoutMs?: number;
    budget?: PlannerModelInvocationEnvelopeV01["budget"];
  } = {},
): PlannerModelInvocationEnvelopeV01 {
  const mode = options.mode ?? "live";
  return {
    envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
    invocation_id: "model-invocation:planner-test",
    workspace_id: fixture.workspaceId,
    project_id: fixture.projectAId,
    purpose: PLANNER_MODEL_GATEWAY_PURPOSE_V01,
    data_classification: "private",
    provenance_refs: [
      "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    ],
    privacy: {
      provider_egress: mode === "live" ? "allow" : "deny",
      retention_class: "none",
    },
    budget:
      options.budget ??
      ({
        max_input_bytes: 98_304,
        max_output_tokens: 2_048,
        max_provider_calls: mode === "live" ? 1 : 0,
      } as PlannerModelInvocationEnvelopeV01["budget"]),
    timeout_ms: options.timeoutMs ?? 1_000,
    cancellation: { signal: options.signal ?? new AbortController().signal },
    execution_mode: mode,
    policy: {
      invocation_origin: "interactive",
      expected_active_project_id: fixture.projectAId,
      expected_active_selection_revision: fixture.activeRevision,
    },
    project_root: {
      path_flavor: fixture.projectARoot.path_flavor,
      normalized_path: fixture.projectARoot.normalized_path,
    },
    input: {
      input_kind: PLANNER_MODEL_GATEWAY_PURPOSE_V01,
      message: "Plan the canonical project.",
      brief: options.brief ?? buildStateBrief(fixture.projectAId),
    },
  };
}

function temporalEnvelope(
  fixture: Fixture,
  options: {
    context?: TemporalPreviewContext;
    mode?: ModelGatewayExecutionModeV01;
    signal?: AbortSignal;
    timeoutMs?: number;
  } = {},
): TemporalModelInvocationEnvelopeV01 {
  const mode = options.mode ?? "live";
  return {
    envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
    invocation_id: "model-invocation:temporal-test",
    workspace_id: fixture.workspaceId,
    project_id: fixture.projectAId,
    purpose: TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
    data_classification: "private",
    provenance_refs: [
      "sha256:cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc",
    ],
    privacy: {
      provider_egress: mode === "live" ? "allow" : "deny",
      retention_class: "none",
    },
    budget: {
      max_input_bytes: 65_536,
      max_output_tokens: 4_096,
      max_provider_calls: mode === "live" ? 1 : 0,
    },
    timeout_ms: options.timeoutMs ?? 1_000,
    cancellation: { signal: options.signal ?? new AbortController().signal },
    execution_mode: mode,
    policy: {
      invocation_origin: "interactive",
      expected_active_project_id: fixture.projectAId,
      expected_active_selection_revision: fixture.activeRevision,
    },
    project_root: {
      path_flavor: fixture.projectARoot.path_flavor,
      normalized_path: fixture.projectARoot.normalized_path,
    },
    input: {
      input_kind: TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
      context: options.context ?? buildTemporalPreviewContext(fixture.projectAId),
    },
  };
}

function plannerRequest(
  fixture: Fixture,
  input: { message: string; execution_mode: ModelGatewayExecutionModeV01 },
) {
  return jsonRequest(
    "http://localhost/api/plan",
    plannerRequestBody(fixture, input),
  );
}

function plannerRequestBody(
  fixture: Fixture,
  overrides: Record<string, unknown> = {},
) {
  return {
    workspace_id: fixture.workspaceId,
    project_id: fixture.projectAId,
    expected_active_project_id: fixture.projectAId,
    expected_active_selection_revision: fixture.activeRevision,
    project_root: fixture.projectARoot,
    message: "Plan the canonical project.",
    execution_mode: "live",
    ...overrides,
  };
}

function temporalRequest(
  fixture: Fixture,
  context: TemporalPreviewContext,
  executionMode: ModelGatewayExecutionModeV01,
) {
  return jsonRequest("http://localhost/api/temporal-interpretation/preview", {
    workspace_id: fixture.workspaceId,
    project_id: fixture.projectAId,
    expected_active_project_id: fixture.projectAId,
    expected_active_selection_revision: fixture.activeRevision,
    project_root: fixture.projectARoot,
    context,
    execution_mode: executionMode,
  });
}

function jsonRequest(url: string, body: unknown) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function captureAnyGatewayFailure(invoke: () => Promise<unknown>) {
  try {
    await invoke();
  } catch (error) {
    assert.equal(isModelGatewayInvocationErrorV01(error), true);
    if (isModelGatewayInvocationErrorV01(error)) return error;
  }
  throw new Error("expected model gateway failure");
}

function providerJsonSuccess(
  output: unknown,
  usage?: { input_tokens: number; output_tokens: number; total_tokens: number },
) {
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        status: "completed",
        output_text: JSON.stringify(output),
        ...(usage ? { usage } : {}),
      };
    },
  };
}

function plannerProviderOutput() {
  return {
    recommendations: [
      {
        title: "Review the canonical project result",
        rationale: "The fake provider result remains bounded and reviewable.",
        tool_name: null,
        priority: "next",
        grounded_state_keys: ["product.name"],
      },
    ],
  };
}

function unreachablePurposeSession(
  purpose:
    | typeof PLANNER_MODEL_GATEWAY_PURPOSE_V01
    | typeof TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
  onInvoke: () => void,
): ModelAdapterSessionV01 {
  return {
    implementation_id: "test.unreachable_purpose_session",
    implementation_version: "test_unreachable_purpose_session.v0.1",
    purpose,
    provider_ref: testProviderRef(),
    model_ref: testModelRef(),
    async invoke() {
      onInvoke();
      throw new Error("unreachable adapter session invoked");
    },
  };
}

function assertReceiptHasNoPurposeContent(receipt: unknown, content: string) {
  const serialized = JSON.stringify(receipt);
  assert.equal(serialized.includes(content), false);
  assert.equal(serialized.includes(CREDENTIAL_SENTINEL), false);
  assert.equal(serialized.includes(projectARoot), false);
  assert.equal(serialized.includes(projectBRoot), false);
}

function assertModelInvocationReceiptSemanticMatrix(input: unknown) {
  const liveSuccess = validateModelInvocationReceiptV02(input);
  const deterministicSuccess = structuredClone(liveSuccess);
  Object.assign(deterministicSuccess, {
    attempted_implementation_id: null,
    attempted_implementation_version: null,
    attempted_provider_ref: null,
    attempted_model_ref: null,
    final_implementation_id: "deterministic.observe",
    final_implementation_version: "deterministic_observe.v0.1",
    requested_mode: "deterministic",
    execution_mode: "deterministic",
    selection_reason: "explicit_deterministic",
    status: "completed",
    outcome: "deterministic_success",
    egress_attempted: false,
    egress_status: "did_not_occur",
    usage: null,
    failure_code: null,
    privacy_decision: "provider_egress_not_used",
    fallback_used: false,
    trust_class: "direct_local_observation",
  });
  Object.assign(deterministicSuccess.budget, {
    decision: "not_used",
    input_bytes_used: null,
    output_tokens_used: null,
    provider_call_limit: 0,
    provider_calls_used: 0,
    timeout_disposition: "completed_within_deadline",
  });

  const providerUnavailable = structuredClone(deterministicSuccess);
  Object.assign(providerUnavailable, {
    attempted_implementation_id: liveSuccess.attempted_implementation_id,
    attempted_implementation_version:
      liveSuccess.attempted_implementation_version,
    requested_mode: "live",
    selection_reason: "provider_unavailable",
  });
  providerUnavailable.budget.provider_call_limit = 1;

  const fallbackSuccess = structuredClone(liveSuccess);
  Object.assign(fallbackSuccess, {
    final_implementation_id: "deterministic.temporal",
    final_implementation_version: "deterministic_temporal.v0.1",
    execution_mode: "deterministic",
    selection_reason: "provider_failure_fallback",
    outcome: "deterministic_fallback_success",
    usage: null,
    failure_code: "model_gateway_provider_rejected",
    fallback_used: true,
    trust_class: "mixed",
  });
  fallbackSuccess.budget.output_tokens_used = null;

  const blockedRefusal = structuredClone(liveSuccess);
  Object.assign(blockedRefusal, {
    status: "blocked",
    outcome: "refused",
    egress_attempted: false,
    egress_status: "blocked",
    usage: null,
    failure_code: "model_gateway_budget_refused",
    privacy_decision: "provider_egress_blocked",
    trust_class: "direct_local_observation",
  });
  Object.assign(blockedRefusal.budget, {
    decision: "refused",
    output_tokens_used: null,
    provider_calls_used: 0,
  });

  const providerFailure = structuredClone(liveSuccess);
  Object.assign(providerFailure, {
    status: "failed",
    outcome: "provider_failure",
    usage: null,
    failure_code: "model_gateway_provider_rejected",
    trust_class: "direct_local_observation",
  });
  providerFailure.budget.output_tokens_used = null;

  const deterministicFailure = structuredClone(deterministicSuccess);
  Object.assign(deterministicFailure, {
    status: "failed",
    outcome: "deterministic_failure",
    failure_code: "model_gateway_deterministic_failed",
  });

  const timeout = structuredClone(liveSuccess);
  Object.assign(timeout, {
    attempted_provider_ref: null,
    attempted_model_ref: null,
    status: "timed_out",
    outcome: "timeout",
    egress_attempted: false,
    egress_status: "did_not_occur",
    usage: null,
    failure_code: "model_gateway_timeout",
    privacy_decision: "provider_egress_not_used",
    trust_class: "direct_local_observation",
  });
  Object.assign(timeout.budget, {
    decision: "not_used",
    input_bytes_used: null,
    output_tokens_used: null,
    provider_calls_used: 0,
    timeout_disposition: "timed_out",
  });

  const cancelled = structuredClone(timeout);
  Object.assign(cancelled, {
    status: "cancelled",
    outcome: "cancelled",
    failure_code: "model_gateway_cancelled",
    cancellation_disposition: "cancelled",
  });
  cancelled.budget.timeout_disposition = "cancelled";

  const fixtures = {
    live_success: liveSuccess,
    deterministic_success: deterministicSuccess,
    provider_unavailable: providerUnavailable,
    fallback_success: fallbackSuccess,
    blocked_refusal: blockedRefusal,
    provider_failure: providerFailure,
    deterministic_failure: deterministicFailure,
    timeout,
    cancelled,
  } satisfies Record<string, ModelInvocationReceiptV02>;
  for (const [name, receipt] of Object.entries(fixtures)) {
    assert.deepEqual(
      validateModelInvocationReceiptV02(receipt),
      receipt,
      `${name} should be a valid semantic receipt baseline`,
    );
  }

  const providerFailureBeforeEgress = structuredClone(providerFailure);
  Object.assign(providerFailureBeforeEgress, {
    attempted_provider_ref: null,
    attempted_model_ref: null,
    egress_attempted: false,
    egress_status: "did_not_occur",
    privacy_decision: "provider_egress_not_used",
  });
  Object.assign(providerFailureBeforeEgress.budget, {
    decision: "not_used",
    input_bytes_used: null,
    provider_calls_used: 0,
  });
  validateModelInvocationReceiptV02(providerFailureBeforeEgress);

  const refusalAfterEgress = structuredClone(blockedRefusal);
  Object.assign(refusalAfterEgress, {
    egress_attempted: true,
    egress_status: "occurred",
    privacy_decision: "provider_egress_approved",
  });
  refusalAfterEgress.budget.provider_calls_used = 1;
  validateModelInvocationReceiptV02(refusalAfterEgress);

  const fallbackDeterministicFailure = structuredClone(fallbackSuccess);
  Object.assign(fallbackDeterministicFailure, {
    status: "failed",
    outcome: "deterministic_failure",
    failure_code: "model_gateway_deterministic_failed",
  });
  validateModelInvocationReceiptV02(fallbackDeterministicFailure);

  const liveWithoutUsage = structuredClone(liveSuccess);
  liveWithoutUsage.usage = null;
  liveWithoutUsage.budget.output_tokens_used = null;
  validateModelInvocationReceiptV02(liveWithoutUsage);

  type FixtureName = keyof typeof fixtures;
  const cases: Array<{
    name: string;
    fixture: FixtureName;
    mutate(receipt: ModelInvocationReceiptV02): void;
  }> = [
    { name: "completed provider failure outcome", fixture: "live_success", mutate: (r) => { r.outcome = "provider_failure"; } },
    { name: "failed live success outcome", fixture: "provider_failure", mutate: (r) => { r.outcome = "live_success"; } },
    { name: "completed nonfallback failure code", fixture: "live_success", mutate: (r) => { r.failure_code = "model_gateway_transport_failed"; } },
    { name: "blocked missing failure code", fixture: "blocked_refusal", mutate: (r) => { r.failure_code = null; } },
    { name: "failed missing failure code", fixture: "provider_failure", mutate: (r) => { r.failure_code = null; } },
    { name: "timeout missing failure code", fixture: "timeout", mutate: (r) => { r.failure_code = null; } },
    { name: "cancelled missing failure code", fixture: "cancelled", mutate: (r) => { r.failure_code = null; } },
    { name: "live success deterministic request", fixture: "live_success", mutate: (r) => { r.requested_mode = "deterministic"; } },
    { name: "live success deterministic execution", fixture: "live_success", mutate: (r) => { r.execution_mode = "deterministic"; } },
    { name: "live success provider unavailable selection", fixture: "live_success", mutate: (r) => { r.selection_reason = "provider_unavailable"; } },
    { name: "live success fallback flag", fixture: "live_success", mutate: (r) => { r.fallback_used = true; } },
    { name: "live success no attempted implementation", fixture: "live_success", mutate: (r) => { r.attempted_implementation_id = null; } },
    { name: "live success no provider ref", fixture: "live_success", mutate: (r) => { r.attempted_provider_ref = null; } },
    { name: "live success no egress attempt", fixture: "live_success", mutate: (r) => { r.egress_attempted = false; } },
    { name: "live success zero provider calls", fixture: "live_success", mutate: (r) => { r.budget.provider_calls_used = 0; } },
    { name: "live success local trust", fixture: "live_success", mutate: (r) => { r.trust_class = "direct_local_observation"; } },
    { name: "explicit deterministic attempted implementation", fixture: "deterministic_success", mutate: (r) => { r.attempted_implementation_id = "openai_responses.adapter"; } },
    { name: "explicit deterministic provider ref", fixture: "deterministic_success", mutate: (r) => { r.attempted_provider_ref = liveSuccess.attempted_provider_ref; } },
    { name: "explicit deterministic egress", fixture: "deterministic_success", mutate: (r) => { r.egress_attempted = true; } },
    { name: "explicit deterministic provider usage", fixture: "deterministic_success", mutate: (r) => { r.usage = structuredClone(liveSuccess.usage); } },
    { name: "explicit deterministic provider trust", fixture: "deterministic_success", mutate: (r) => { r.trust_class = "provider_report"; } },
    { name: "provider unavailable deterministic request", fixture: "provider_unavailable", mutate: (r) => { r.requested_mode = "deterministic"; } },
    { name: "provider unavailable missing adapter", fixture: "provider_unavailable", mutate: (r) => { r.attempted_implementation_id = null; } },
    { name: "provider unavailable provider ref", fixture: "provider_unavailable", mutate: (r) => { r.attempted_provider_ref = liveSuccess.attempted_provider_ref; } },
    { name: "provider unavailable occurred egress", fixture: "provider_unavailable", mutate: (r) => { r.egress_status = "occurred"; } },
    { name: "fallback flag absent", fixture: "fallback_success", mutate: (r) => { r.fallback_used = false; } },
    { name: "fallback wrong selection", fixture: "fallback_success", mutate: (r) => { r.selection_reason = "requested_live"; } },
    { name: "fallback deterministic request", fixture: "fallback_success", mutate: (r) => { r.requested_mode = "deterministic"; } },
    { name: "fallback live execution", fixture: "fallback_success", mutate: (r) => { r.execution_mode = "live"; } },
    { name: "fallback zero calls", fixture: "fallback_success", mutate: (r) => { r.budget.provider_calls_used = 0; } },
    { name: "fallback no occurred egress", fixture: "fallback_success", mutate: (r) => { r.egress_status = "did_not_occur"; } },
    { name: "fallback ineligible failure", fixture: "fallback_success", mutate: (r) => { r.failure_code = "model_gateway_budget_refused"; } },
    { name: "fallback local trust", fixture: "fallback_success", mutate: (r) => { r.trust_class = "direct_local_observation"; } },
    { name: "provider failure completed", fixture: "provider_failure", mutate: (r) => { r.status = "completed"; } },
    { name: "provider failure wrong selection", fixture: "provider_failure", mutate: (r) => { r.selection_reason = "provider_unavailable"; } },
    { name: "provider failure refusal code", fixture: "provider_failure", mutate: (r) => { r.failure_code = "model_gateway_budget_refused"; } },
    { name: "provider failure usage", fixture: "provider_failure", mutate: (r) => { r.usage = structuredClone(liveSuccess.usage); } },
    { name: "deterministic failure completed", fixture: "deterministic_failure", mutate: (r) => { r.status = "completed"; } },
    { name: "deterministic failure provider code", fixture: "deterministic_failure", mutate: (r) => { r.failure_code = "model_gateway_transport_failed"; } },
    { name: "refusal failed status", fixture: "blocked_refusal", mutate: (r) => { r.status = "failed"; } },
    { name: "refusal provider failure code", fixture: "blocked_refusal", mutate: (r) => { r.failure_code = "model_gateway_transport_failed"; } },
    { name: "refusal nonrefused budget", fixture: "blocked_refusal", mutate: (r) => { r.budget.decision = "not_used"; } },
    { name: "refusal did not occur egress", fixture: "blocked_refusal", mutate: (r) => { r.egress_status = "did_not_occur"; } },
    { name: "timeout failed status", fixture: "timeout", mutate: (r) => { r.status = "failed"; } },
    { name: "timeout transport failure code", fixture: "timeout", mutate: (r) => { r.failure_code = "model_gateway_transport_failed"; } },
    { name: "timeout completed disposition", fixture: "timeout", mutate: (r) => { r.budget.timeout_disposition = "completed_within_deadline"; } },
    { name: "timeout cancellation disposition", fixture: "timeout", mutate: (r) => { r.cancellation_disposition = "cancelled"; } },
    { name: "cancelled failed status", fixture: "cancelled", mutate: (r) => { r.status = "failed"; } },
    { name: "cancelled timeout failure code", fixture: "cancelled", mutate: (r) => { r.failure_code = "model_gateway_timeout"; } },
    { name: "cancelled timed out disposition", fixture: "cancelled", mutate: (r) => { r.budget.timeout_disposition = "timed_out"; } },
    { name: "cancelled not cancelled", fixture: "cancelled", mutate: (r) => { r.cancellation_disposition = "not_cancelled"; } },
    { name: "occurred egress wrong privacy", fixture: "live_success", mutate: (r) => { r.privacy_decision = "provider_egress_not_used"; } },
    { name: "blocked egress wrong privacy", fixture: "blocked_refusal", mutate: (r) => { r.privacy_decision = "provider_egress_not_used"; } },
    { name: "unused egress wrong privacy", fixture: "deterministic_success", mutate: (r) => { r.privacy_decision = "provider_egress_approved"; } },
    { name: "usage output mismatch", fixture: "live_success", mutate: (r) => { r.budget.output_tokens_used = 1; } },
    { name: "success refused budget", fixture: "live_success", mutate: (r) => { r.budget.decision = "refused"; } },
  ];

  for (const testCase of cases) {
    const contradictory = structuredClone(fixtures[testCase.fixture]);
    testCase.mutate(contradictory);
    assert.throws(
      () => validateModelInvocationReceiptV02(contradictory),
      `${testCase.name} should be rejected by the root receipt validator`,
    );
  }
  return cases.length;
}

function initializeDatabase() {
  const database = new Database(databasePath);
  database.exec(readFileSync(path.join(process.cwd(), "lib", "db", "schema.sql"), "utf8"));
  database.close();
}

function registerProjects() {
  const db = openDatabase();
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db, {
    create_uuid: () => WORKSPACE_UUID,
    now: () => "2026-07-15T00:00:00.000Z",
  });
  const rootA = normalizeLocalProjectRootRefV01(projectARoot, {
    base_path: path.parse(projectARoot).root,
  });
  const rootB = normalizeLocalProjectRootRefV01(projectBRoot, {
    base_path: path.parse(projectBRoot).root,
  });
  const projectA = getOrCreateCanonicalProjectForLocalRootV01(
    db,
    {
      workspace_id: workspace.workspace_id,
      local_root: rootA,
      display_name: "same-name-repository",
    },
    {
      create_uuid: () => PROJECT_A_UUID,
      now: () => "2026-07-15T00:00:01.000Z",
    },
  );
  const projectB = getOrCreateCanonicalProjectForLocalRootV01(
    db,
    {
      workspace_id: workspace.workspace_id,
      local_root: rootB,
      display_name: "same-name-repository",
    },
    {
      create_uuid: () => PROJECT_B_UUID,
      now: () => "2026-07-15T00:00:02.000Z",
    },
  );
  touchRecentProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: projectA.project.project_id,
    now: "2026-07-15T00:00:03.000Z",
  });
  touchRecentProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: projectB.project.project_id,
    now: "2026-07-15T00:00:04.000Z",
  });
  const active = selectActiveProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: projectA.project.project_id,
    now: "2026-07-15T00:00:05.000Z",
    expected_project_id: null,
    expected_revision: null,
  });
  db.close();
  return {
    workspaceId: workspace.workspace_id,
    projectAId: projectA.project.project_id,
    projectBId: projectB.project.project_id,
    projectARoot: rootA,
    projectBRoot: rootB,
    activeRevision: active.selection_revision,
  };
}

type Fixture = ReturnType<typeof registerProjects>;

function observeRequest(
  fixture: Fixture,
  input: { message: string; execution_mode: ModelGatewayExecutionModeV01 },
) {
  return new Request("http://localhost/api/observe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      workspace_id: fixture.workspaceId,
      project_id: fixture.projectAId,
      expected_active_project_id: fixture.projectAId,
      expected_active_selection_revision: fixture.activeRevision,
      project_root: {
        path_flavor: fixture.projectARoot.path_flavor,
        normalized_path: fixture.projectARoot.normalized_path,
      },
      message: input.message,
      execution_mode: input.execution_mode,
    }),
  });
}

function envelope(
  fixture: Fixture,
  options: {
    mode?: ModelGatewayExecutionModeV01;
    message?: string;
    projectId?: string;
    projectRoot?: Fixture["projectARoot"];
    activeRevision?: number;
    currentState?: StateEntry[];
    signal?: AbortSignal;
    timeoutMs?: number;
  } = {},
): ObserveModelInvocationEnvelopeV01 {
  const mode = options.mode ?? "live";
  const projectId = options.projectId ?? fixture.projectAId;
  const projectRoot = options.projectRoot ?? fixture.projectARoot;
  return {
    envelope_version: MODEL_INVOCATION_ENVELOPE_VERSION_V01,
    invocation_id: "model-invocation:test",
    workspace_id: fixture.workspaceId,
    project_id: projectId,
    purpose: OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
    data_classification: "private",
    provenance_refs: [
      "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    ],
    privacy: {
      provider_egress: mode === "live" ? "allow" : "deny",
      retention_class: "none",
    },
    budget: {
      max_input_bytes: 98_304,
      max_output_tokens: 2_048,
      max_provider_calls: mode === "live" ? 1 : 0,
    },
    timeout_ms: options.timeoutMs ?? 1_000,
    cancellation: { signal: options.signal ?? new AbortController().signal },
    execution_mode: mode,
    policy: {
      invocation_origin: "interactive",
      expected_active_project_id: projectId,
      expected_active_selection_revision:
        options.activeRevision ?? fixture.activeRevision,
    },
    project_root: {
      path_flavor: projectRoot.path_flavor,
      normalized_path: projectRoot.normalized_path,
    },
    input: {
      input_kind: OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
      message: options.message ?? "Observe the bounded project state.",
      current_state: options.currentState ?? [],
    },
  };
}

function gatewayDependencies(
  adapter: ReturnType<typeof createOpenAIResponsesAdapterV01>,
): ObserveModelGatewayDependenciesV01 {
  return {
    adapter,
    deterministic_execute(input) {
      return buildMockProposals(input.message, input.current_state);
    },
  };
}

async function captureGatewayFailure(
  invocation: unknown,
  dependencies: ObserveModelGatewayDependenciesV01,
) {
  try {
    await invokeObserveModelGatewayV01(invocation, dependencies);
  } catch (error) {
    assert.equal(isModelGatewayInvocationErrorV01(error), true);
    if (isModelGatewayInvocationErrorV01(error)) return error;
  }
  throw new Error("expected model gateway failure");
}

async function assertScopeRefusal(
  invocation: unknown,
  adapter: ReturnType<typeof createOpenAIResponsesAdapterV01>,
  metrics: { live_transport_calls: number },
) {
  const calls = metrics.live_transport_calls;
  const failure = await captureGatewayFailure(invocation, gatewayDependencies(adapter));
  assert.equal(failure.code, "model_gateway_scope_refused");
  assert.equal(failure.receipt, null);
  assert.equal(metrics.live_transport_calls, calls);
  assert.equal(JSON.stringify(failure).includes(HOSTILE_SENTINEL), false);
}

function providerSuccess() {
  return {
    ok: true,
    status: 200,
    async json() {
      return {
        status: "completed",
        output: [
          {
            type: "message",
            content: [
              {
                type: "output_text",
                text: JSON.stringify({
                  proposals: [
                    {
                      state_key: "product.name",
                      before_value: null,
                      after_value: "Augnes",
                      operation: "set",
                      temporal_scope: "current_project",
                      valid_from: null,
                      valid_until: null,
                      stability: "active",
                      change_type: "new_state",
                      reason: "Synthetic provider response for Gateway tests.",
                    },
                  ],
                }),
              },
            ],
          },
        ],
        usage: {
          input_tokens: 80,
          output_tokens: 24,
          total_tokens: 104,
        },
      };
    },
  };
}

function rejectWhenAborted(signal: AbortSignal): ReturnType<OpenAIResponsesTransportV01> {
  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(new Error(HOSTILE_SENTINEL));
      return;
    }
    signal.addEventListener(
      "abort",
      () => reject(new Error(HOSTILE_SENTINEL)),
      { once: true },
    );
  });
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

async function waitForTestStage(stage: Promise<void>, label: string) {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  try {
    await Promise.race([
      stage,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error(`${label} did not reach the intended stage.`)),
          TEST_STAGE_OBSERVATION_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function unreachableSession(
  onInvoke: () => void,
): ModelAdapterSessionV01 {
  return {
    implementation_id: "test.unreachable_session",
    implementation_version: "test_unreachable_session.v0.1",
    purpose: OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
    provider_ref: testProviderRef(),
    model_ref: testModelRef(),
    async invoke() {
      onInvoke();
      throw new Error("unreachable adapter session invoked");
    },
  };
}

function testProviderRef() {
  return {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "model_provider",
    external_id: "test-provider",
    provider: "test-provider",
    trust_class: "direct_local_observation" as const,
  };
}

function testModelRef() {
  return {
    ref_version: "external_ref.v0.1" as const,
    ref_type: "provider_model",
    external_id: "test-model",
    provider: "test-provider",
    trust_class: "direct_local_observation" as const,
  };
}

function stateEntry(scope: string, value: unknown): StateEntry {
  return {
    id: "state:test",
    scope,
    state_key: "project.test_value",
    value: value as StateEntry["value"],
    temporal_scope: "current_project",
    valid_from: null,
    valid_until: null,
    stability: "active",
    change_type: "new_state",
    source_agent_id: null,
    source_session_id: null,
    source_transition_id: null,
    created_at: "2026-07-15T00:00:00.000Z",
    updated_at: "2026-07-15T00:00:00.000Z",
  };
}

function rowCounts(db: Database.Database) {
  const count = (table: string) =>
    (db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }).count;
  return {
    messages: count("messages"),
    proposals: count("state_delta_proposals"),
  };
}

function assertNoPrivateMaterial(value: unknown) {
  const serialized = JSON.stringify(value);
  assert.equal(serialized.includes(HOSTILE_SENTINEL), false);
  assert.equal(serialized.includes(CREDENTIAL_SENTINEL), false);
  assert.equal(serialized.includes(projectARoot), false);
  assert.equal(serialized.includes(projectBRoot), false);
}

function assertObserveBypassGuard() {
  const observeSource = readFileSync(
    path.join(process.cwd(), "lib", "observe", "delta-compiler.ts"),
    "utf8",
  );
  for (const forbidden of [
    "api.openai.com",
    "Authorization",
    "OPENAI_API_KEY",
    "fetch(",
    "json_schema",
    "output_text",
    ".json()",
  ]) {
    assert.equal(observeSource.includes(forbidden), false, forbidden);
  }
  assert.equal(observeSource.includes("invokeObserveModelGatewayV01"), true);

  for (const relativeFile of [
    "lib/planner/planner.ts",
    "lib/temporal-interpretation/preview.ts",
  ]) {
    const source = readFileSync(path.join(process.cwd(), relativeFile), "utf8");
    for (const forbidden of [
      "api.openai.com",
      "Authorization",
      "OPENAI_API_KEY",
      "OPENAI_MODEL",
      "fetch(",
      "json_schema",
      "output_text",
      ".json()",
    ]) {
      assert.equal(source.includes(forbidden), false, `${relativeFile}:${forbidden}`);
    }
  }

  const directTransportOwners = listTypeScriptFiles(path.join(process.cwd(), "lib"))
    .filter((file) =>
      readFileSync(file, "utf8").includes("https://api.openai.com/v1/responses"),
    )
    .map((file) => path.relative(process.cwd(), file).split(path.sep).join("/"))
    .sort();
  assert.deepEqual(directTransportOwners, [
    "lib/vnext/model-gateway/openai/responses-adapter.ts",
  ]);

  const providerCredentialReaders = listTypeScriptFiles(path.join(process.cwd(), "lib"))
    .filter((file) =>
      /(?:process\.env|environment)\.OPENAI_(?:API_KEY|MODEL)/.test(
        readFileSync(file, "utf8"),
      ),
    )
    .map((file) => path.relative(process.cwd(), file).split(path.sep).join("/"))
    .sort();
  assert.deepEqual(providerCredentialReaders, [
    "lib/vnext/model-gateway/openai/responses-adapter.ts",
  ]);
}

function listTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) return listTypeScriptFiles(resolved);
    return entry.isFile() && entry.name.endsWith(".ts") ? [resolved] : [];
  });
}
