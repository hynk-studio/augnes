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
import {
  invokeObserveModelGatewayV01,
  type ObserveModelGatewayDependenciesV01,
} from "../lib/vnext/model-gateway/model-gateway";
import {
  MODEL_INVOCATION_ENVELOPE_VERSION_V01,
  OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
  isModelGatewayInvocationErrorV01,
  type ModelGatewayExecutionModeV01,
  type ObserveModelAdapterSessionV01,
  type ObserveModelAdapterV01,
  type ObserveModelInvocationEnvelopeV01,
} from "../lib/vnext/model-gateway/contracts";
import {
  createOpenAIResponsesObserveAdapterV01,
  type OpenAIResponsesObserveTransportV01,
} from "../lib/vnext/model-gateway/openai-responses-observe-adapter";
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

    const capturedLiveRequests: Parameters<OpenAIResponsesObserveTransportV01>[0][] = [];
    const liveAdapter = createOpenAIResponsesObserveAdapterV01({
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

    const noCredentialAdapter = createOpenAIResponsesObserveAdapterV01({
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
        },
      },
      gatewayDependencies(liveAdapter),
    );
    assert.equal(policyFailure.code, "model_gateway_policy_refused");
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
        createOpenAIResponsesObserveAdapterV01({
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
        createOpenAIResponsesObserveAdapterV01({
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
    await scopeCancellationStarted.promise;
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
    const scopeTimeoutFailure = await captureGatewayFailure(
      envelope(fixture, { timeoutMs: 10 }),
      {
        ...gatewayDependencies(liveAdapter),
        read_root_availability() {
          scopeTimeoutStarted.resolve(undefined);
          return scopeTimeoutAvailability.promise;
        },
      },
    );
    await scopeTimeoutStarted.promise;
    assert.equal(scopeTimeoutFailure.code, "model_gateway_timeout");
    assert.equal(scopeTimeoutFailure.receipt?.outcome, "timeout");
    assert.equal(scopeTimeoutFailure.receipt?.egress_attempted, false);
    assert.equal(scopeTimeoutFailure.receipt?.budget.provider_calls_used, 0);
    assert.equal(metrics.live_transport_calls, 1);
    scopeTimeoutAvailability.resolve("available");

    let prepareCancellationInvokes = 0;
    let prepareCancellationTransports = 0;
    const prepareCancellationStarted = deferred<void>();
    const prepareCancellationSession = deferred<ObserveModelAdapterSessionV01 | null>();
    const deferredCancellationAdapter: ObserveModelAdapterV01 = {
      implementation_id: "test.prepare_cancellation",
      implementation_version: "test_prepare_cancellation.v0.1",
      async prepare(signal) {
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
    await prepareCancellationStarted.promise;
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
    const prepareTimeoutSession = deferred<ObserveModelAdapterSessionV01 | null>();
    const deferredTimeoutAdapter: ObserveModelAdapterV01 = {
      implementation_id: "test.prepare_timeout",
      implementation_version: "test_prepare_timeout.v0.1",
      async prepare(signal) {
        assert.equal(signal.aborted, false);
        prepareTimeoutStarted.resolve(undefined);
        return prepareTimeoutSession.promise;
      },
    };
    const prepareTimeoutResult = invokeObserveModelGatewayV01(
      envelope(fixture, { timeoutMs: 10 }),
      gatewayDependencies(deferredTimeoutAdapter),
    ).then(
      () => null,
      (error: unknown) => error,
    );
    await prepareTimeoutStarted.promise;
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
    await deterministicCancellationStarted.promise;
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
    const deterministicTimeoutFailure = await captureGatewayFailure(
      envelope(fixture, { mode: "deterministic", timeoutMs: 10 }),
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
    await deterministicTimeoutStarted.promise;
    assert.equal(deterministicTimeoutFailure.code, "model_gateway_timeout");
    assert.equal(deterministicTimeoutFailure.receipt?.outcome, "timeout");
    assert.equal(deterministicTimeoutFailure.receipt?.egress_attempted, false);
    assert.equal(deterministicTimeoutFailure.receipt?.budget.provider_calls_used, 0);
    assert.equal(deterministicTimeoutObservedAbort, true);
    deterministicTimeoutOutput.resolve([]);

    const timeoutAdapter = createOpenAIResponsesObserveAdapterV01({
      environment: { OPENAI_API_KEY: CREDENTIAL_SENTINEL },
      transport: (request) => {
        metrics.timeout_transport_calls += 1;
        return rejectWhenAborted(request.signal);
      },
    });
    const timeoutFailure = await captureGatewayFailure(
      envelope(fixture, { timeoutMs: 10 }),
      gatewayDependencies(timeoutAdapter),
    );
    assert.equal(timeoutFailure.code, "model_gateway_timeout");
    assert.equal(timeoutFailure.receipt?.outcome, "timeout");
    assert.equal(metrics.timeout_transport_calls, 1);

    let transportStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      transportStarted = resolve;
    });
    const cancellationAdapter = createOpenAIResponsesObserveAdapterV01({
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
    await started;
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
      const hostileAdapter = createOpenAIResponsesObserveAdapterV01({
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
          production_entry_path: "POST /api/observe",
          live_transport_calls: metrics.live_transport_calls,
          deterministic_transport_calls: metrics.zero_model_transport_calls,
          blocked_transport_calls: metrics.blocked_transport_calls,
          timeout_transport_calls: metrics.timeout_transport_calls,
          cancellation_transport_calls: metrics.cancellation_transport_calls,
          hostile_provider_body_reads: metrics.hostile_body_reads,
          undici_requests: undiciRequests,
          canonical_projects_checked: 2,
          observe_bypass_guard: "pass",
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
  adapter: ReturnType<typeof createOpenAIResponsesObserveAdapterV01>,
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
  adapter: ReturnType<typeof createOpenAIResponsesObserveAdapterV01>,
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

function rejectWhenAborted(signal: AbortSignal): ReturnType<OpenAIResponsesObserveTransportV01> {
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

function unreachableSession(
  onInvoke: () => void,
): ObserveModelAdapterSessionV01 {
  return {
    implementation_id: "test.unreachable_session",
    implementation_version: "test_unreachable_session.v0.1",
    async invoke() {
      onInvoke();
      throw new Error("unreachable adapter session invoked");
    },
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

  const directTransportOwners = listTypeScriptFiles(path.join(process.cwd(), "lib"))
    .filter((file) =>
      readFileSync(file, "utf8").includes("https://api.openai.com/v1/responses"),
    )
    .map((file) => path.relative(process.cwd(), file).split(path.sep).join("/"))
    .sort();
  assert.deepEqual(directTransportOwners, [
    "lib/planner/planner.ts",
    "lib/temporal-interpretation/openai.ts",
    "lib/vnext/model-gateway/openai-responses-observe-adapter.ts",
  ]);
}

function listTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const resolved = path.join(directory, entry.name);
    if (entry.isDirectory()) return listTypeScriptFiles(resolved);
    return entry.isFile() && entry.name.endsWith(".ts") ? [resolved] : [];
  });
}
