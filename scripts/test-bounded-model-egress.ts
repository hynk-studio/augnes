import assert from "node:assert/strict";
import { channel } from "node:diagnostics_channel";

import {
  assertModelEgressCollectionCount,
  assertModelEgressTextIsSafe,
  assertModelEgressTextBytes,
  type BoundedModelTransport,
  cloneBoundedModelEgressJson,
  isModelEgressBoundaryError,
  MODEL_EGRESS_REFUSAL_REASONS,
  serializeModelEgressJson,
  utf8ByteLength,
} from "../lib/model-egress/bounded-model-payload";
import {
  OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
  PLANNER_MODEL_GATEWAY_PURPOSE_V01,
  STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01,
  TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
  type PlannerStateBriefV01,
} from "../lib/vnext/model-gateway/contracts";
import {
  createOpenAIResponsesAdapterV01,
} from "../lib/vnext/model-gateway/openai/responses-adapter";
import { OBSERVE_MODEL_EGRESS_LIMITS } from "../lib/vnext/model-gateway/openai/observe-codec";
import { PLANNER_MODEL_EGRESS_LIMITS } from "../lib/vnext/model-gateway/openai/planner-codec";
import { STRATEGIC_ADVANTAGE_TRANSFER_MODEL_EGRESS_LIMITS } from "../lib/vnext/model-gateway/openai/strategic-advantage-transfer-codec";
import { TEMPORAL_MODEL_EGRESS_LIMITS } from "../lib/vnext/model-gateway/openai/temporal-codec";
import { buildMockTemporalPreview } from "../lib/temporal-interpretation/mock";
import type { TemporalPreviewContext } from "../lib/temporal-interpretation/types";
import {
  strategicModelInputFixtureV01,
  strategicModelOutputFixtureV01,
} from "./vnext-protocol-conformance/strategic-advantage-transfer";

const REJECTED_MARKER = "rejected-material-must-not-escape-8f37";
const OBSERVE_PROJECT_ID = "project:22222222-2222-4222-8222-222222222222";
const providerAndProxyKeys = [
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "ANTHROPIC_API_KEY",
  "AZURE_OPENAI_API_KEY",
  "GOOGLE_API_KEY",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "ALL_PROXY",
  "NO_PROXY",
  "http_proxy",
  "https_proxy",
  "all_proxy",
  "no_proxy",
];
assert.deepEqual(
  providerAndProxyKeys.filter((key) => Object.hasOwn(process.env, key)),
  [],
  "focused test requires provider credentials, model overrides, and proxies removed",
);

const counters = {
  validTransportCalls: 0,
  blockedCases: 0,
  blockedTransportCalls: 0,
  providerErrorTransportCalls: 0,
  providerErrorBodyReads: 0,
  ordinaryFallbackTransportCalls: 0,
  ordinaryFallbackBodyReads: 0,
  undiciRequests: 0,
  ownKeyRoundTripPreserved: false,
  ordinaryObjectPrototypeUnchanged: false,
  plannerOwnKeyTransportCalls: 0,
};
const undiciRequestChannel = channel("undici:request:create");
const onUndiciRequest = () => {
  counters.undiciRequests += 1;
};

void main().catch(() => {
  console.error("bounded_model_egress_test_failed");
  process.exitCode = 1;
});

async function main() {
  undiciRequestChannel.subscribe(onUndiciRequest);
  try {
    runSharedMechanicsCases();
    await runObserveCases();
    await runPlannerCases();
    await runTemporalCases();
    await runStrategicCases();
    await runProviderErrorCases();

    assert.equal(counters.blockedTransportCalls, 0);
    assert.equal(counters.providerErrorBodyReads, 0);
    assert.equal(counters.ordinaryFallbackBodyReads, 0);
    assert.equal(counters.undiciRequests, 0);
    assert.equal(counters.ownKeyRoundTripPreserved, true);
    assert.equal(counters.ordinaryObjectPrototypeUnchanged, true);
    assert.equal(counters.plannerOwnKeyTransportCalls, 1);

    const summary = {
      test: "bounded_model_egress",
      status: "pass",
      protected_transports: 4,
      valid_transport_calls: counters.validTransportCalls,
      blocked_cases: counters.blockedCases,
      blocked_transport_calls: counters.blockedTransportCalls,
      provider_error_transport_calls: counters.providerErrorTransportCalls,
      provider_error_body_reads: counters.providerErrorBodyReads,
      ordinary_fallback_transport_calls:
        counters.ordinaryFallbackTransportCalls,
      ordinary_fallback_body_reads: counters.ordinaryFallbackBodyReads,
      undici_requests: counters.undiciRequests,
      own_key_round_trip_preserved: counters.ownKeyRoundTripPreserved,
      ordinary_object_prototype_unchanged:
        counters.ordinaryObjectPrototypeUnchanged,
      planner_own_key_transport_calls: counters.plannerOwnKeyTransportCalls,
      refusal_reasons: MODEL_EGRESS_REFUSAL_REASONS,
    };
    const output = `${JSON.stringify(summary, null, 2)}\n`;
    assert.equal(output.includes(REJECTED_MARKER), false);
    process.stdout.write(output);
  } finally {
    undiciRequestChannel.unsubscribe(onUndiciRequest);
  }
}

function runSharedMechanicsCases() {
  assertModelEgressCollectionCount("observe_delta_compile", 64, 64);
  expectBoundarySync(
    "observe_delta_compile",
    () => assertModelEgressCollectionCount("observe_delta_compile", 65, 64),
    "model_egress_payload_oversize",
  );

  const korean = "한";
  assert.equal(utf8ByteLength(korean), 3);
  assertModelEgressTextBytes("observe_delta_compile", korean, 3);
  expectBoundarySync(
    "observe_delta_compile",
    () => assertModelEgressTextBytes("observe_delta_compile", `${korean}a`, 3),
    "model_egress_payload_oversize",
  );

  const itemOverhead = utf8ByteLength(JSON.stringify({ value: "" }));
  const exactItem = { value: "x".repeat(4_096 - itemOverhead) };
  assert.equal(utf8ByteLength(JSON.stringify(exactItem)), 4_096);
  serializeModelEgressJson("planner_plan", exactItem, 4_096);
  expectBoundarySync(
    "planner_plan",
    () =>
      serializeModelEgressJson(
        "planner_plan",
        { value: `${exactItem.value}x` },
        4_096,
      ),
    "model_egress_payload_oversize",
  );

  const dynamicText = serializeModelEgressJson(
    "observe_delta_compile",
    { message: korean },
    64,
  );
  const providerRequest = {
    model: "gpt-4.1-mini",
    input: [
      { role: "system", content: [{ type: "input_text", text: "fixed" }] },
      { role: "user", content: [{ type: "input_text", text: dynamicText }] },
    ],
  };
  const finalBytes = utf8ByteLength(JSON.stringify(providerRequest));
  assert.equal(finalBytes > utf8ByteLength(dynamicText), true);
  serializeModelEgressJson(
    "observe_delta_compile",
    providerRequest,
    finalBytes,
  );
  expectBoundarySync(
    "observe_delta_compile",
    () =>
      serializeModelEgressJson(
        "observe_delta_compile",
        providerRequest,
        finalBytes - 1,
      ),
    "model_egress_payload_oversize",
  );

  expectBoundarySync(
    "planner_plan",
    () => cloneBoundedModelEgressJson("planner_plan", Number.NaN),
    "model_egress_payload_malformed",
  );
  expectBoundarySync(
    "planner_plan",
    () => cloneBoundedModelEgressJson("planner_plan", new Date(0)),
    "model_egress_payload_unsupported",
  );
  expectBoundarySync(
    "temporal_interpretation",
    () =>
      assertModelEgressTextIsSafe(
        "temporal_interpretation",
        `OPENAI_API_KEY=${REJECTED_MARKER}`,
      ),
    "model_egress_payload_unsafe",
  );

  const ordinaryObjectPrototype = Object.getPrototypeOf({});
  assert.equal(({} as Record<string, unknown>).marker, undefined);
  assert.equal(Object.hasOwn(Object.prototype, "marker"), false);
  const ownKeySource = JSON.parse(
    '{"__proto__":{"marker":"preserved"},"constructor":{"value":"kept"},"prototype":"kept","ordinary":true}',
  ) as Record<string, unknown>;
  assert.equal(Object.hasOwn(ownKeySource, "__proto__"), true);
  const ownKeyClone = cloneBoundedModelEgressJson(
    "planner_plan",
    ownKeySource,
  ) as Record<string, unknown>;
  assert.equal(Object.getPrototypeOf(ownKeyClone), null);
  for (const key of ["__proto__", "constructor", "prototype", "ordinary"]) {
    assert.equal(Object.hasOwn(ownKeyClone, key), true);
  }
  const clonedProtoValue = ownKeyClone.__proto__ as Record<string, unknown>;
  assert.equal(clonedProtoValue.marker, "preserved");
  const ownKeySerialized = JSON.stringify(ownKeyClone);
  assert.equal(ownKeySerialized.includes('"__proto__"'), true);
  assert.deepEqual(
    JSON.parse(ownKeySerialized),
    JSON.parse(JSON.stringify(ownKeySource)),
  );
  assert.equal(
    JSON.stringify(cloneBoundedModelEgressJson("planner_plan", ownKeySource)),
    ownKeySerialized,
  );
  assert.equal(Object.getPrototypeOf({}), ordinaryObjectPrototype);
  assert.equal(({} as Record<string, unknown>).marker, undefined);
  assert.equal(Object.hasOwn(Object.prototype, "marker"), false);
  counters.ownKeyRoundTripPreserved = true;
  counters.ordinaryObjectPrototypeUnchanged = true;

  for (const unsupported of [
    () => REJECTED_MARKER,
    Symbol("value"),
    BigInt(1),
  ]) {
    expectBoundarySync(
      "planner_plan",
      () => cloneBoundedModelEgressJson("planner_plan", unsupported),
      "model_egress_payload_unsupported",
    );
  }
  const accessor: Record<string, unknown> = {};
  Object.defineProperty(accessor, "value", {
    enumerable: true,
    get() {
      return REJECTED_MARKER;
    },
  });
  expectBoundarySync(
    "planner_plan",
    () => cloneBoundedModelEgressJson("planner_plan", accessor),
    "model_egress_payload_unsupported",
  );
}

async function runObserveCases() {
  const captured: string[] = [];
  const validTransport = successTransport(observeProviderOutput(), captured);
  const extraState = {
    ...makeState(0),
    arbitrary_private_field: REJECTED_MARKER,
  };
  const result = await invokeObserveAdapterForTest(
    {
      message: "검토할 bounded observation",
      projectId: OBSERVE_PROJECT_ID,
      currentState: [extraState] as never,
    },
    validTransport,
  );
  assert.equal(result[0]?.state_key, "product.name");
  const request = parseObserveRequest(captured[0]);
  const dynamic = parseDynamic(request);
  assert.deepEqual(Object.keys(dynamic).sort(), ["current_state", "message", "project_id"]);
  assert.deepEqual(Object.keys(dynamic.current_state[0]).sort(), [
    "change_type",
    "stability",
    "state_key",
    "temporal_scope",
    "valid_from",
    "valid_until",
    "value",
  ]);
  assert.equal(captured[0]?.includes(REJECTED_MARKER), false);

  const exactStates = Array.from(
    { length: OBSERVE_MODEL_EGRESS_LIMITS.stateItems },
    (_, index) => makeState(index),
  );
  await invokeObserveAdapterForTest(
    {
      message: "smallest valid payload",
      projectId: OBSERVE_PROJECT_ID,
      currentState: exactStates as never,
    },
    successTransport(observeProviderOutput()),
  );
  await expectBlocked(
    "observe_delta_compile",
    (transport) =>
      invokeObserveAdapterForTest(
        {
          message: "one state over the bound",
          projectId: OBSERVE_PROJECT_ID,
          currentState: [...exactStates, makeState(64)] as never,
        },
        transport,
      ),
    "model_egress_payload_oversize",
  );
  await expectBlocked(
    "observe_delta_compile",
    (transport) =>
      invokeObserveAdapterForTest(
        {
          message: "unsupported scalar",
          projectId: OBSERVE_PROJECT_ID,
          currentState: [makeState(0, { nested: true })] as never,
        },
        transport,
      ),
    "model_egress_payload_unsupported",
  );
}

async function runPlannerCases() {
  const active = Array.from({ length: 32 }, (_, index) => makeState(index));
  const future = Array.from({ length: 32 }, (_, index) =>
    makeState(index + 32),
  );
  const tensions = Array.from({ length: 16 }, (_, index) => makeTension(index));
  const proposals = Array.from({ length: 16 }, (_, index) => makeProposal(index));
  const brief = makePlannerBrief({ active, future, tensions, proposals });
  const captured: string[] = [];
  const recommendations = await planWithOpenAIForTest(
    "Plan the next bounded step.",
    brief,
    successTransport(plannerProviderOutput(), captured),
  );
  assert.equal(recommendations[0]?.priority, "next");
  const request = parseRequest(captured[0]);
  const dynamic = parseDynamic(request);
  assert.deepEqual(Object.keys(dynamic).sort(), ["brief", "message", "project_id"]);
  assert.deepEqual(Object.keys(dynamic.brief).sort(), [
    "active_state",
    "completed_state",
    "deprecated_state",
    "future_state",
    "open_tensions",
    "pending_proposals",
    "scope",
  ]);
  assert.equal(captured[0]?.includes(REJECTED_MARKER), false);

  const ownKeyValue = JSON.parse(
    '{"__proto__":{"marker":"preserved"},"constructor":{"value":"kept"},"prototype":"kept","ordinary":true}',
  );
  const ownKeyBrief = {
    ...makePlannerBrief({
      active: [makeState(200, ownKeyValue)],
      tensions: [],
      proposals: [],
    }),
    provider_control: REJECTED_MARKER,
  } as PlannerStateBriefV01;
  const ownKeyCaptured: string[] = [];
  const ownKeyBaseTransport = successTransport(
    plannerProviderOutput(),
    ownKeyCaptured,
  );
  const ownKeyTransport: BoundedModelTransport = async (requestBody) => {
    counters.plannerOwnKeyTransportCalls += 1;
    return ownKeyBaseTransport(requestBody);
  };
  await planWithOpenAIForTest(
    "Preserve legal JSON own keys.",
    ownKeyBrief,
    ownKeyTransport,
  );
  assert.equal(counters.plannerOwnKeyTransportCalls, 1);
  assert.equal(ownKeyCaptured.length, 1);
  const ownKeyRequest = parseRequest(ownKeyCaptured[0]);
  const ownKeyDynamic = parseDynamic(ownKeyRequest);
  const projectedValue = ownKeyDynamic.brief.active_state[0].value;
  for (const key of ["__proto__", "constructor", "prototype", "ordinary"]) {
    assert.equal(Object.hasOwn(projectedValue, key), true);
  }
  assert.equal(projectedValue.__proto__.marker, "preserved");
  assert.equal(Object.hasOwn(ownKeyDynamic.brief, "recent_actions"), false);
  assert.equal(Object.hasOwn(ownKeyDynamic.brief, "agent_instructions"), false);
  assert.equal(Object.hasOwn(ownKeyDynamic.brief, "agent_handoff"), false);
  assert.equal(ownKeyCaptured[0].includes("provider_control"), false);
  assert.equal(ownKeyCaptured[0].includes(REJECTED_MARKER), false);
  assert.equal(
    utf8ByteLength(ownKeyCaptured[0]) <=
      PLANNER_MODEL_EGRESS_LIMITS.finalRequestBytes,
    true,
  );
  assert.equal(({} as Record<string, unknown>).marker, undefined);

  await expectBlocked(
    "planner_plan",
    (transport) =>
      planWithOpenAIForTest(
        "Plan.",
        makePlannerBrief({ active: [...active, makeState(99)] }),
        transport,
      ),
    "model_egress_payload_oversize",
  );
  await expectBlocked(
    "planner_plan",
    (transport) =>
      planWithOpenAIForTest(
        "Plan.",
        makePlannerBrief({
          active,
          future,
          completed: [makeState(100)],
        }),
        transport,
      ),
    "model_egress_payload_oversize",
  );
  await expectBlocked(
    "planner_plan",
    (transport) =>
      planWithOpenAIForTest(
        "Plan.",
        makePlannerBrief({
          tensions: Array.from({ length: 17 }, (_, index) => makeTension(index)),
        }),
        transport,
      ),
    "model_egress_payload_oversize",
  );
  await expectBlocked(
    "planner_plan",
    (transport) =>
      planWithOpenAIForTest(
        "Plan.",
        makePlannerBrief({
          proposals: Array.from({ length: 17 }, (_, index) =>
            makeProposal(index),
          ),
        }),
        transport,
      ),
    "model_egress_payload_oversize",
  );
  await expectBlocked(
    "planner_plan",
    (transport) =>
      planWithOpenAIForTest(
        "x".repeat(PLANNER_MODEL_EGRESS_LIMITS.messageBytes + 1),
        makePlannerBrief(),
        transport,
      ),
    "model_egress_payload_oversize",
  );

  const cycle: Record<string, unknown> = {};
  cycle.self = cycle;
  await expectBlocked(
    "planner_plan",
    (transport) =>
      planWithOpenAIForTest(
        "Plan.",
        makePlannerBrief({ active: [makeState(0, cycle)] }),
        transport,
      ),
    "model_egress_payload_malformed",
  );

}

async function runTemporalCases() {
  const context = makeTemporalContext({ evidenceCount: 8 });
  const contextWithControls = {
    ...context,
    model: REJECTED_MARKER,
    endpoint: REJECTED_MARKER,
    system_prompt: REJECTED_MARKER,
    role: REJECTED_MARKER,
    tools: [REJECTED_MARKER],
    response_schema: { marker: REJECTED_MARKER },
    temperature: 1,
  } as TemporalPreviewContext;
  const captured: string[] = [];
  const output = await buildOpenAITemporalPreviewForTest(
    contextWithControls,
    successTransport(buildMockTemporalPreview(context), captured),
  );
  assert.equal(output.model, "gpt-4.1-mini");
  assert.equal(output.preview.non_authority_boundary.length > 0, true);
  const request = parseRequest(captured[0]);
  const dynamic = parseDynamic(request);
  assert.deepEqual(Object.keys(dynamic).sort(), ["context", "project_id"]);
  assert.equal(dynamic.context.evidence_anchors.length, 8);
  assert.equal(request.model, "gpt-4.1-mini");
  assert.deepEqual(
    request.input.map((item: { role: string }) => item.role),
    ["system", "user"],
  );
  assert.equal(captured[0]?.includes(REJECTED_MARKER), false);

  const overBound = makeTemporalContext({ evidenceCount: 9 });
  await expectBlocked(
    "temporal_interpretation",
    (transport) => buildOpenAITemporalPreviewForTest(overBound, transport),
    "model_egress_payload_oversize",
  );
  const malformed = makeTemporalContext();
  (malformed.source_authority_profile.allowed_now as unknown[]) = [123];
  await expectBlocked(
    "temporal_interpretation",
    (transport) => buildOpenAITemporalPreviewForTest(malformed, transport),
    "model_egress_payload_malformed",
  );

}

async function runStrategicCases() {
  const input = strategicModelInputFixtureV01();
  const output = strategicModelOutputFixtureV01(input);
  const captured: string[] = [];
  const result = await buildOpenAIStrategicTransferForTest(
    input,
    successTransport(output, captured),
  );
  assert.deepEqual(result, output);
  const request = parseRequest(captured[0]);
  const dynamic = parseDynamic(request);
  assert.deepEqual(dynamic.lenses, input.lenses);
  assert.equal(
    dynamic.working_frame.working_frame_fingerprint,
    input.working_frame.working_frame_fingerprint,
  );
  assert.equal(
    dynamic.source_catalog.source_catalog_fingerprint,
    input.source_catalog.source_catalog_fingerprint,
  );
  assert.equal(Object.hasOwn(dynamic, "workspace_id"), false);
  assert.equal(Object.hasOwn(dynamic, "project_id"), false);

  const tooManyLenses = structuredClone(input) as unknown as Record<
    string,
    unknown
  >;
  tooManyLenses.lenses = [
    "constraint_fit",
    "verification_leverage",
    "regression_safety",
    "constraint_fit",
  ];
  await expectBlocked(
    "strategic_advantage_transfer",
    (transport) =>
      buildOpenAIStrategicTransferForTest(
        tooManyLenses as never,
        transport,
      ),
    "model_egress_payload_oversize",
  );

  const tooManySources = structuredClone(input);
  tooManySources.source_catalog.items = Array.from(
    {
      length:
        STRATEGIC_ADVANTAGE_TRANSFER_MODEL_EGRESS_LIMITS.sourceCatalogItems +
        1,
    },
    (_, index) => ({
      ...input.source_catalog.items[0]!,
      source_key: `source:${index.toString(16).padStart(24, "0")}`,
    }),
  );
  await expectBlocked(
    "strategic_advantage_transfer",
    (transport) =>
      buildOpenAIStrategicTransferForTest(tooManySources, transport),
    "model_egress_payload_oversize",
  );
}

async function runProviderErrorCases() {
  await expectProviderError((transport) =>
    invokeObserveAdapterForTest(
      {
        message: "Observe.",
        projectId: OBSERVE_PROJECT_ID,
        currentState: [] as never,
      },
      transport,
    ),
  );
  await expectProviderError((transport) =>
    planWithOpenAIForTest("Plan.", makePlannerBrief(), transport),
  );
  await expectProviderError((transport) =>
    buildOpenAITemporalPreviewForTest(makeTemporalContext(), transport),
  );
  const strategicInput = strategicModelInputFixtureV01();
  await expectProviderError((transport) =>
    buildOpenAIStrategicTransferForTest(strategicInput, transport),
  );
}

async function planWithOpenAIForTest(
  message: string,
  brief: PlannerStateBriefV01,
  transport: BoundedModelTransport,
) {
  const adapter = createOpenAIResponsesAdapterV01({
    environment: { OPENAI_API_KEY: "test-only-placeholder" },
    transport: async (request) => transport(request.body),
  });
  const session = await adapter.prepare(
    PLANNER_MODEL_GATEWAY_PURPOSE_V01,
    new AbortController().signal,
  );
  assert.ok(session);
  const result = await session.invoke(
    {
      canonical_project_id: OBSERVE_PROJECT_ID,
      input_kind: PLANNER_MODEL_GATEWAY_PURPOSE_V01,
      message,
      brief,
    },
    adapterLifecycle(PLANNER_MODEL_EGRESS_LIMITS.finalRequestBytes, 2_048),
  );
  assert.equal(result.purpose, PLANNER_MODEL_GATEWAY_PURPOSE_V01);
  if (result.purpose !== PLANNER_MODEL_GATEWAY_PURPOSE_V01) {
    throw new Error("unexpected purpose");
  }
  return result.recommendations;
}

async function buildOpenAITemporalPreviewForTest(
  context: TemporalPreviewContext,
  transport: BoundedModelTransport,
) {
  const adapter = createOpenAIResponsesAdapterV01({
    environment: { OPENAI_API_KEY: "test-only-placeholder" },
    transport: async (request) => transport(request.body),
  });
  const session = await adapter.prepare(
    TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
    new AbortController().signal,
  );
  assert.ok(session);
  const result = await session.invoke(
    {
      canonical_project_id: OBSERVE_PROJECT_ID,
      input_kind: TEMPORAL_MODEL_GATEWAY_PURPOSE_V01,
      context,
    },
    adapterLifecycle(TEMPORAL_MODEL_EGRESS_LIMITS.finalRequestBytes, 4_096),
  );
  assert.equal(result.purpose, TEMPORAL_MODEL_GATEWAY_PURPOSE_V01);
  if (result.purpose !== TEMPORAL_MODEL_GATEWAY_PURPOSE_V01) {
    throw new Error("unexpected purpose");
  }
  return {
    model: result.model_identifier,
    preview: result.preview,
  };
}

async function buildOpenAIStrategicTransferForTest(
  input: ReturnType<typeof strategicModelInputFixtureV01>,
  transport: BoundedModelTransport,
) {
  const adapter = createOpenAIResponsesAdapterV01({
    environment: { OPENAI_API_KEY: "test-only-placeholder" },
    transport: async (request) => transport(request.body),
  });
  const session = await adapter.prepare(
    STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01,
    new AbortController().signal,
  );
  assert.ok(session);
  const result = await session.invoke(
    {
      canonical_project_id: OBSERVE_PROJECT_ID,
      ...input,
    },
    adapterLifecycle(
      STRATEGIC_ADVANTAGE_TRANSFER_MODEL_EGRESS_LIMITS.finalRequestBytes,
      2_048,
    ),
  );
  assert.equal(
    result.purpose,
    STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01,
  );
  if (
    result.purpose !==
    STRATEGIC_ADVANTAGE_TRANSFER_MODEL_GATEWAY_PURPOSE_V01
  ) {
    throw new Error("unexpected purpose");
  }
  return result.output;
}

function adapterLifecycle(maxInputBytes: number, maxOutputTokens: number) {
  return {
    signal: new AbortController().signal,
    budget: {
      max_input_bytes: maxInputBytes,
      max_output_tokens: maxOutputTokens,
      max_provider_calls: 1 as const,
    },
    retention_class: "none" as const,
    mark_egress_attempted() {},
    report_input_bytes() {},
  };
}

function successTransport(output: unknown, captured: string[] = []): BoundedModelTransport {
  return async (requestBody) => {
    counters.validTransportCalls += 1;
    captured.push(requestBody);
    return {
      ok: true,
      status: 200,
      async json() {
        return { output_text: JSON.stringify(output) };
      },
    };
  };
}

async function expectBlocked(
  purpose: string,
  invoke: (transport: BoundedModelTransport) => Promise<unknown>,
  reasonCode: string,
) {
  let thrown: unknown;
  const transport: BoundedModelTransport = async () => {
    counters.blockedTransportCalls += 1;
    return { ok: true, status: 200, async json() { return {}; } };
  };
  try {
    await invoke(transport);
  } catch (error) {
    thrown = error;
  }
  assertBoundaryError(thrown, purpose, reasonCode);
  counters.blockedCases += 1;
}

function expectBoundarySync(
  purpose: string,
  invoke: () => unknown,
  reasonCode: string,
) {
  let thrown: unknown;
  try {
    invoke();
  } catch (error) {
    thrown = error;
  }
  assertBoundaryError(thrown, purpose, reasonCode);
}

function assertBoundaryError(
  thrown: unknown,
  purpose: string,
  reasonCode: string,
) {
  assert.equal(isModelEgressBoundaryError(thrown), true);
  if (!isModelEgressBoundaryError(thrown)) return;
  assert.equal(thrown.purpose, purpose);
  assert.equal(thrown.reasonCode, reasonCode);
  assert.equal(Number.isFinite(thrown.measured), true);
  assert.equal(Number.isFinite(thrown.maximum), true);
  assert.equal(thrown.message.includes(REJECTED_MARKER), false);
  assert.equal("cause" in thrown, false);
}

async function expectProviderError(
  invoke: (transport: BoundedModelTransport) => Promise<unknown>,
) {
  let thrown: unknown;
  const transport: BoundedModelTransport = async () => {
    counters.providerErrorTransportCalls += 1;
    return {
      ok: false,
      status: 429,
      async json() {
        counters.providerErrorBodyReads += 1;
        return { provider_body: REJECTED_MARKER };
      },
    };
  };
  try {
    await invoke(transport);
  } catch (error) {
    thrown = error;
  }
  assert.equal(thrown instanceof Error, true);
  assert.equal((thrown as Error).message.length > 0, true);
  assert.equal((thrown as Error).message.includes(REJECTED_MARKER), false);
}

function parseRequest(value: string | undefined): any {
  assert.equal(typeof value, "string");
  const request = JSON.parse(value!);
  assert.deepEqual(Object.keys(request).sort(), [
    "input",
    "max_output_tokens",
    "model",
    "store",
    "text",
  ]);
  assert.equal(request.store, false);
  return request;
}

function parseObserveRequest(value: string | undefined): any {
  assert.equal(typeof value, "string");
  const request = JSON.parse(value!);
  assert.deepEqual(Object.keys(request).sort(), [
    "input",
    "max_output_tokens",
    "model",
    "store",
    "text",
  ]);
  assert.equal(request.store, false);
  return request;
}

async function invokeObserveAdapterForTest(
  input: { message: string; projectId: string; currentState: never[] },
  transport: BoundedModelTransport,
) {
  const adapter = createOpenAIResponsesAdapterV01({
    environment: { OPENAI_API_KEY: "test-only-placeholder" },
    transport: async (request) => transport(request.body),
  });
  const session = await adapter.prepare(
    OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
    new AbortController().signal,
  );
  assert.ok(session);
  const result = await session.invoke(
    {
      canonical_project_id: input.projectId,
      input_kind: OBSERVE_MODEL_GATEWAY_PURPOSE_V01,
      message: input.message,
      current_state: input.currentState,
    },
    {
      signal: new AbortController().signal,
      budget: {
        max_input_bytes: OBSERVE_MODEL_EGRESS_LIMITS.finalRequestBytes,
        max_output_tokens: 2_048,
        max_provider_calls: 1,
      },
      retention_class: "none",
      mark_egress_attempted() {},
      report_input_bytes() {},
    },
  );
  assert.equal(result.purpose, OBSERVE_MODEL_GATEWAY_PURPOSE_V01);
  if (result.purpose !== OBSERVE_MODEL_GATEWAY_PURPOSE_V01) {
    throw new Error("unexpected purpose");
  }
  return result.proposals;
}

function parseDynamic(request: any): any {
  return JSON.parse(request.input[1].content[0].text);
}

function makeState(index: number, value: unknown = "active") {
  return {
    id: `state:${index}`,
    scope: OBSERVE_PROJECT_ID,
    state_key: `state.item_${index}`,
    value,
    temporal_scope: "current_project",
    valid_from: null,
    valid_until: null,
    stability: "active",
    change_type: "new_state",
    source_agent_id: null,
    source_session_id: null,
    source_transition_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function makeTension(index: number) {
  return {
    id: `tension:${index}`,
    scope: OBSERVE_PROJECT_ID,
    state_key: `state.item_${index}`,
    title: "Review boundary",
    description: "A bounded tension remains open.",
    status: "open",
    severity: "medium",
    source_agent_id: null,
    source_session_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
    resolved_at: null,
  };
}

function makeProposal(index: number) {
  return {
    id: `proposal:${index}`,
    scope: OBSERVE_PROJECT_ID,
    state_key: `proposal.item_${index}`,
    before_value: null,
    after_value: { status: "review" },
    operation: "set",
    temporal_scope: "current_project",
    valid_from: null,
    valid_until: null,
    stability: "tentative",
    change_type: "new_state",
    source_agent_id: null,
    source_session_id: null,
    reason: "Review the proposal.",
    proposed_at: "2026-01-01T00:00:00.000Z",
    status: "pending",
    decided_at: null,
    prediction_error_score: 0,
    salience_score: 0,
    evidence_score: 0,
    conflict_score: 0,
    self_impact_score: 0,
    consolidation_status: "candidate",
    reinforcement_count: 0,
    expires_at: null,
    last_evaluated_at: null,
    scoring_version: "candidate_scoring.v0.1",
    scoring_reason: REJECTED_MARKER,
    score_breakdown: { marker: REJECTED_MARKER },
  };
}

function makePlannerBrief({
  active = [makeState(0)],
  future = [],
  completed = [],
  deprecated = [],
  tensions = [makeTension(0)],
  proposals = [makeProposal(0)],
}: {
  active?: ReturnType<typeof makeState>[];
  future?: ReturnType<typeof makeState>[];
  completed?: ReturnType<typeof makeState>[];
  deprecated?: ReturnType<typeof makeState>[];
  tensions?: ReturnType<typeof makeTension>[];
  proposals?: ReturnType<typeof makeProposal>[];
} = {}) {
  return {
    runtime: "augnes",
    scope: OBSERVE_PROJECT_ID,
    as_of: "2026-01-01T00:00:00.000Z",
    generated_at: "2026-01-01T00:00:00.000Z",
    active_state: active,
    future_state: future,
    completed_state: completed,
    deprecated_state: deprecated,
    open_tensions: tensions,
    pending_proposals: proposals,
    recent_actions: [{ marker: REJECTED_MARKER }],
    recent_action_visibility: { marker: REJECTED_MARKER },
    agent_instructions: ["fixture instruction"],
    agent_handoff: { marker: REJECTED_MARKER },
  } as unknown as PlannerStateBriefV01;
}

function makeTemporalContext({ evidenceCount = 0 } = {}): TemporalPreviewContext {
  return {
    scope: OBSERVE_PROJECT_ID,
    as_of: "2026-01-01T00:00:00.000Z",
    current_interpretation: "Bounded read-only interpretation.",
    active_prior_context: "No prior context is required.",
    evidence_anchors: Array.from({ length: evidenceCount }, (_, index) => ({
      ref: `state:item-${index}`,
      claim: "Bounded claim.",
      source_type: "committed_state" as const,
    })),
    summary_refs: [],
    source_authority_profile: {
      committed_state_authority: [],
      summary_only_refs: [],
      allowed_now: ["read_state_brief"],
      blocked_now: ["commit_state"],
    },
    counterexamples: [],
    residual_tensions: [],
    user_preferences: [],
    safe_next_step: "Continue read-only review.",
    non_authority_boundary: "This preview is non-authoritative.",
    active_context_admission_rationale: [],
    active_context_admission: {
      decisions: [],
      note: "No context admission is needed.",
    },
    suppressed_alternatives: [],
    temporal_hierarchy_view: {
      raw_observation_level: "No raw observations.",
      work_or_session_level: "Bounded work context.",
      project_status_level: "Review remains pending.",
      current_interpretive_stance: "Read-only.",
      hierarchy_caution: "Do not infer authority.",
    },
    memory_lifecycle_view: {
      active_context: [],
      retrieved_context: [],
      summary_or_view: [],
      stale_or_deferred_context: [],
      lifecycle_caution: "No memory write.",
    },
    interpretive_drivers: [],
    axis_pressures: [],
  };
}

function observeProviderOutput() {
  return {
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
        reason: "Bounded synthetic response.",
      },
    ],
  };
}

function plannerProviderOutput() {
  return {
    recommendations: [
      {
        title: "Review the bounded result",
        rationale: "The synthetic response remains review-only.",
        tool_name: null,
        priority: "next",
        grounded_state_keys: ["state.item_0"],
      },
    ],
  };
}

assert.equal(OBSERVE_MODEL_EGRESS_LIMITS.finalRequestBytes, 98_304);
assert.equal(PLANNER_MODEL_EGRESS_LIMITS.finalRequestBytes, 98_304);
assert.equal(
  STRATEGIC_ADVANTAGE_TRANSFER_MODEL_EGRESS_LIMITS.finalRequestBytes,
  81_920,
);
assert.equal(TEMPORAL_MODEL_EGRESS_LIMITS.finalRequestBytes, 65_536);
