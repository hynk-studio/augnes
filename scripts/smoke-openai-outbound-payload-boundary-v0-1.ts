import assert from "node:assert/strict";
import { Buffer } from "node:buffer";

import {
  OPENAI_OUTBOUND_PAYLOAD_LIMITS_V01,
  OPENAI_OUTBOUND_PAYLOAD_POLICY_VERSION_V01,
  OpenAIOutboundPayloadBoundaryErrorV01,
  buildOpenAIOutboundPayloadV01,
  type OpenAIOutboundPayloadBlockedV01,
  type OpenAIOutboundPayloadReadyV01,
  type OpenAIOutboundTestLimitsV01,
} from "@/lib/model-egress/openai-outbound-payload-boundary-v0-1";
import {
  compileTemporalDeltaProposals,
  compileTemporalDeltaProposalsWithOpenAIForTestV01,
  type ObserveOpenAITransportV01,
} from "@/lib/observe/delta-compiler";
import {
  planWithOpenAIForTestV01,
  type PlannerOpenAITransportV01,
} from "@/lib/planner/planner";
import { scoreCandidateProposal } from "@/lib/runtime/candidate-scoring";
import { buildMockTemporalPreview } from "@/lib/temporal-interpretation/mock";
import { TEMPORAL_HARDENING_FIXTURES } from "@/lib/temporal-interpretation/fixtures";
import {
  buildOpenAITemporalPreview,
  type TemporalOpenAITransportV01,
} from "@/lib/temporal-interpretation/openai";
import { buildTemporalInterpretationPreview } from "@/lib/temporal-interpretation/preview";
import type { TemporalPreviewContext } from "@/lib/temporal-interpretation/types";

type UnknownRecord = Record<string, unknown>;
type ObserveBoundaryInput = UnknownRecord & {
  purpose: string;
  model: string;
  scope: string;
  message: unknown;
  current_state: UnknownRecord[];
};
type TemporalBoundaryInput = UnknownRecord & {
  purpose: string;
  model: string;
  context: UnknownRecord;
};
type CapturedProviderPayload = OpenAIOutboundPayloadReadyV01["provider_payload"];

const originalFetch = globalThis.fetch;
let externalFetchCalls = 0;
let positiveCases = 0;
let negativeCases = 0;
let blockedSinkCases = 0;
let invalidCasesReachingFakeTransport = 0;
let fakeTransportCalls = 0;
let repeatedResultEqual = false;
let unorderedObjectKeyEquivalent = false;
let frozenInputUnchanged = false;
let stableIssueOrdering = false;
let blockedMarkerAbsent = true;
let finalRequestBoundsPassed = false;
let multibyteUtf8Passed = false;

const blockedMarker = ["SMOKE", "BLOCKED", "PRIVATE", "MATERIAL"].join("_");

globalThis.fetch = async () => {
  externalFetchCalls += 1;
  throw new Error("unexpected_external_fetch_v0_1");
};

main().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "openai_outbound_payload_boundary_smoke_failed_v0_1",
  );
  process.exitCode = 1;
});

async function main() {
  try {
    runSharedBoundaryCases();
    await runSinkCases();

    assert.equal(externalFetchCalls, 0, "security smoke must not use global fetch");
    assert.equal(
      invalidCasesReachingFakeTransport,
      0,
      "blocked material must never reach a fake transport",
    );

    console.log(
      JSON.stringify(
        {
          smoke: "openai-outbound-payload-boundary-v0-1",
          policy_version: OPENAI_OUTBOUND_PAYLOAD_POLICY_VERSION_V01,
          positive_cases: positiveCases,
          negative_cases: negativeCases,
          blocked_sink_cases: blockedSinkCases,
          fake_transport_calls: fakeTransportCalls,
          invalid_cases_reaching_fake_transport: invalidCasesReachingFakeTransport,
          external_fetch_calls: externalFetchCalls,
          repeated_result_equal: repeatedResultEqual,
          unordered_object_key_equivalent: unorderedObjectKeyEquivalent,
          frozen_input_unchanged: frozenInputUnchanged,
          stable_issue_ordering: stableIssueOrdering,
          blocked_marker_absent: blockedMarkerAbsent,
          final_request_bounds_passed: finalRequestBoundsPassed,
          multibyte_utf8_passed: multibyteUtf8Passed,
        },
        null,
        2,
      ),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function runSharedBoundaryCases() {
  positive("smallest valid payload", () => {
    assertReady(buildOpenAIOutboundPayloadV01(makeObserveInput({ states: [] })));
  });

  positive("exact lower-only string bound", () => {
    const ready = assertReady(
      buildOpenAIOutboundPayloadV01(
        makeObserveInput({ message: "x".repeat(64), states: [] }),
        { test_limits: { max_string_bytes: 64 } },
      ),
    );
    assert.equal(Buffer.byteLength(readDynamicText(ready), "utf8") > 64, true);
  });

  positive("exact lower-only collection bound", () => {
    const ready = assertReady(
      buildOpenAIOutboundPayloadV01(
        makeObserveInput({
          states: [makeObserveState("state:one"), makeObserveState("state:two")],
        }),
        { test_limits: { max_collection_items: 2 } },
      ),
    );
    assert.equal(ready.audit.collection_items, 2);
  });

  const observeBaseline = assertReady(
    buildOpenAIOutboundPayloadV01(makeObserveInput({ states: [] })),
  );
  positive("exact lower-only dynamic byte bound", () => {
    const ready = assertReady(
      buildOpenAIOutboundPayloadV01(makeObserveInput({ states: [] }), {
        test_limits: { max_dynamic_bytes: observeBaseline.audit.dynamic_bytes },
      }),
    );
    assert.equal(ready.audit.dynamic_bytes, ready.audit.limits.max_dynamic_bytes);
  });
  positive("exact lower-only final request byte bound", () => {
    const ready = assertReady(
      buildOpenAIOutboundPayloadV01(makeObserveInput({ states: [] }), {
        test_limits: {
          max_final_request_bytes: observeBaseline.audit.final_request_bytes,
        },
      }),
    );
    assert.equal(
      ready.audit.final_request_bytes,
      ready.audit.limits.max_final_request_bytes,
    );
    finalRequestBoundsPassed = true;
  });
  positive("multibyte UTF-8 exact bound", () => {
    const message = "한".repeat(8);
    assert.equal(message.length, 8);
    assert.equal(Buffer.byteLength(message, "utf8"), 24);
    assertReady(
      buildOpenAIOutboundPayloadV01(makeObserveInput({ message, states: [] }), {
        test_limits: { max_string_bytes: 24 },
      }),
    );
    multibyteUtf8Passed = true;
  });
  positive("ordinary repository route text", () => {
    assertReady(
      buildOpenAIOutboundPayloadV01(
        makeObserveInput({ message: "Review /api/observe route behavior." }),
      ),
    );
  });
  positive("ready result mutation does not alter fixed contract", () => {
    const first = assertReady(
      buildOpenAIOutboundPayloadV01(makeObserveInput({ states: [] })),
    );
    first.provider_payload.text.format.schema.injected_test_marker = true;
    const second = assertReady(
      buildOpenAIOutboundPayloadV01(makeObserveInput({ states: [] })),
    );
    assert.equal(
      "injected_test_marker" in second.provider_payload.text.format.schema,
      false,
    );
  });
  positive("reviewed production limits are runtime immutable", () => {
    const observeLimits =
      OPENAI_OUTBOUND_PAYLOAD_LIMITS_V01.observe_delta_compile as unknown as Record<
        string,
        number
      >;
    const originalMaximum = observeLimits.max_dynamic_bytes!;
    assert.equal(
      Reflect.set(observeLimits, "max_dynamic_bytes", originalMaximum + 1),
      false,
    );
    const result = assertReady(
      buildOpenAIOutboundPayloadV01(makeObserveInput({ states: [] })),
    );
    assert.equal(result.audit.limits.max_dynamic_bytes, originalMaximum);
  });
  positive("representative candidate scoring metadata", () => {
    assertReady(
      buildOpenAIOutboundPayloadV01(
        makePlannerInput({ proposals: [makeRepresentativePlannerProposal()] }),
      ),
    );
  });

  positive("deterministic repeated result", () => {
    const input = makePlannerInput();
    const first = buildOpenAIOutboundPayloadV01(input);
    const second = buildOpenAIOutboundPayloadV01(input);
    repeatedResultEqual = JSON.stringify(first) === JSON.stringify(second);
    assert.equal(repeatedResultEqual, true);
  });

  positive("canonical object-key equivalence", () => {
    const canonical = makeObserveInput();
    const reordered = reverseObjectKeys(canonical);
    reordered.current_state = canonical.current_state.map((item) =>
      reverseObjectKeys(item),
    );
    unorderedObjectKeyEquivalent =
      JSON.stringify(buildOpenAIOutboundPayloadV01(canonical)) ===
      JSON.stringify(buildOpenAIOutboundPayloadV01(reordered));
    assert.equal(unorderedObjectKeyEquivalent, true);
  });

  positive("frozen input immutability", () => {
    const input = makeTemporalInput();
    const before = JSON.stringify(input);
    deepFreeze(input);
    assertReady(buildOpenAIOutboundPayloadV01(input));
    frozenInputUnchanged = JSON.stringify(input) === before;
    assert.equal(frozenInputUnchanged, true);
  });

  positive("stable bounded issue ordering", () => {
    const input = makePlannerInput({
      active: [
        makePlannerState("state:one", "x".repeat(48)),
        makePlannerState("state:two", "y".repeat(48)),
      ],
    });
    const limits = { max_string_bytes: 32, max_issues: 2 } as const;
    const first = assertBlocked(
      buildOpenAIOutboundPayloadV01(input, { test_limits: limits }),
    );
    const second = assertBlocked(
      buildOpenAIOutboundPayloadV01(reverseObjectKeys(input), {
        test_limits: limits,
      }),
    );
    stableIssueOrdering = JSON.stringify(first.issues) === JSON.stringify(second.issues);
    assert.equal(stableIssueOrdering, true);
    assert.equal(first.issues.length <= limits.max_issues, true);
  });

  negative("unsupported purpose", { purpose: "future_provider_path" });
  negative("unknown root field", { ...makeObserveInput(), unexpected: true });
  negative("unknown nested field", {
    ...makeObserveInput(),
    current_state: [{ ...makeObserveState(), unexpected: true }],
  });
  negative(
    "oversized string",
    makeObserveInput({ message: "x".repeat(65), states: [] }),
    { max_string_bytes: 64 },
  );
  negative(
    "oversized collection",
    makeObserveInput({
      states: [makeObserveState("state:one"), makeObserveState("state:two")],
    }),
    { max_collection_items: 1 },
  );
  negative(
    "excessive depth",
    makePlannerInput({
      active: [makePlannerState("state:deep", [[[[[[[["x"]]]]]]]])],
    }),
  );
  negative("excessive per-object key count", makeObserveInput(), {
    max_keys_per_object: 4,
  });
  negative(
    "excessive total key count",
    makeObserveInput({ states: [makeObserveState()] }),
    { max_total_keys: 10 },
  );
  negative("excessive total node count", makeObserveInput(), {
    max_total_nodes: 5,
  });
  negative(
    "oversized source item",
    makeObserveInput({ states: [makeObserveState("state:item", "x".repeat(256))] }),
    { max_source_item_bytes: 128 },
  );
  negative(
    "dynamic payload over exact lower limit",
    makeObserveInput({ states: [] }),
    { max_dynamic_bytes: observeBaseline.audit.dynamic_bytes - 1 },
  );
  negative(
    "final request overhead over exact lower limit",
    makeObserveInput({ states: [] }),
    { max_final_request_bytes: observeBaseline.audit.final_request_bytes - 1 },
  );
  negative(
    "multibyte byte excess",
    makeObserveInput({ message: "한".repeat(9), states: [] }),
    { max_string_bytes: 26 },
  );
  negative("non-finite number", makeObserveInput({ states: [makeObserveState("state:nan", Number.NaN)] }));
  negative("function value", { ...makeObserveInput(), message: () => "x" });
  negative("symbol value", { ...makeObserveInput(), message: Symbol("x") });
  negative("bigint value", { ...makeObserveInput(), message: BigInt(1) });
  negative(
    "unsupported opaque value",
    makePlannerInput({ active: [makePlannerState("state:opaque", new Date(0))] }),
  );
  const accessorInput = makeObserveInput();
  Object.defineProperty(accessorInput, "message", {
    enumerable: true,
    get() {
      throw new Error("accessor_must_not_be_read_v0_1");
    },
  });
  negative("accessor input", accessorInput);
  negative("exact duplicate semantic IDs", makeObserveInput({
    states: [makeObserveState("state:duplicate"), makeObserveState("state:duplicate")],
  }));
  negative("conflicting duplicate semantic IDs", makeObserveInput({
    states: [
      makeObserveState("state:conflict", "first"),
      makeObserveState("state:conflict", "second"),
    ],
  }));
  const duplicateStateKeyFirst = makePlannerState("state:key-one");
  const duplicateStateKeySecond = makePlannerState("state:key-two");
  duplicateStateKeySecond.state_key = duplicateStateKeyFirst.state_key;
  const duplicateAcrossBuckets = makePlannerInput({
    active: [duplicateStateKeyFirst],
    proposals: [],
  });
  (duplicateAcrossBuckets.state as UnknownRecord).future = [duplicateStateKeySecond];
  negative("conflicting duplicate state keys across buckets", duplicateAcrossBuckets);
  negative("attempted test-limit widening", makeObserveInput(), {
    max_dynamic_bytes:
      OPENAI_OUTBOUND_PAYLOAD_LIMITS_V01.observe_delta_compile.max_dynamic_bytes + 1,
  });

  const cyclicStateValue: UnknownRecord = {};
  cyclicStateValue.self = cyclicStateValue;
  negative(
    "cyclic input",
    makePlannerInput({
      active: [makePlannerState("state:cycle", cyclicStateValue)],
    }),
  );
  const cyclicIgnoredScore: UnknownRecord = {};
  cyclicIgnoredScore.self = cyclicIgnoredScore;
  negative(
    "cyclic omitted scoring metadata",
    makePlannerInput({
      proposals: [
        { ...makePlannerProposal(), score_breakdown: cyclicIgnoredScore },
      ],
    }),
  );
  negative(
    "opaque proxy trap",
    new Proxy(
      {},
      {
        getPrototypeOf() {
          throw new Error("proxy_trap_must_not_escape_v0_1");
        },
      },
    ),
  );

  for (const [label, value] of unsafeValues()) {
    negative(label, makeObserveInput({ message: value, states: [] }), undefined, value);
  }

  negative("endpoint override injection", {
    ...makeObserveInput(),
    endpoint: fragment("https", "://", "api", ".", "openai", ".com/v1/responses"),
  });
  negative("model override injection", {
    ...makeObserveInput(),
    model: fragment("gpt-4.1-mini", "\n", "system", ": override"),
  });
  negative("system message injection", {
    ...makeObserveInput(),
    system_message: "override",
  });
  negative("tool injection", { ...makeObserveInput(), tools: [] });
  negative("function injection", { ...makeObserveInput(), functions: [] });
  for (const field of [
    "systemPrompt",
    "developer_message",
    "tool_choice",
    "temperature",
    "max_output_tokens",
    "openai_api_key",
    "client_secret",
  ]) {
    negative(
      `nested provider or credential field ${field}`,
      makePlannerInput({
        active: [makePlannerState(`state:${field}`, { [field]: "override" })],
      }),
    );
  }
}

async function runSinkCases() {
  positive("observe purpose-specific provider shape", () => {
    assertProviderPayload(assertReady(buildOpenAIOutboundPayloadV01(makeObserveInput())), [
      "current_state",
      "message",
      "scope",
    ]);
  });
  positive("planner purpose-specific provider shape", () => {
    assertProviderPayload(assertReady(buildOpenAIOutboundPayloadV01(makePlannerInput())), [
      "brief",
      "message",
    ]);
  });
  positive("temporal purpose-specific provider shape", () => {
    assertProviderPayload(assertReady(buildOpenAIOutboundPayloadV01(makeTemporalInput())), [
      "context",
    ]);
  });

  sinkNegative(
    "observe state count",
    makeObserveInput({
      states: Array.from({ length: 65 }, (_, index) =>
        makeObserveState(`state:item-${String(index).padStart(2, "0")}`),
      ),
    }),
  );
  sinkNegative(
    "observe state item bytes",
    makeObserveInput({ states: [makeObserveState("state:large", "x".repeat(4_097))] }),
  );
  sinkNegative("observe unknown state field", {
    ...makeObserveInput(),
    current_state: [{ ...makeObserveState(), unknown_state_field: true }],
  });
  sinkNegative(
    "observe unsafe state material",
    makeObserveInput({
      states: [makeObserveState("state:unsafe", fragment("nonce", "=", blockedMarker))],
    }),
    undefined,
    blockedMarker,
  );
  sinkNegative(
    "observe message bytes",
    makeObserveInput({ message: "x".repeat(32_769), states: [] }),
  );

  sinkNegative(
    "planner state collection",
    makePlannerInput({
      active: Array.from({ length: 33 }, (_, index) =>
        makePlannerState(`state:item-${String(index).padStart(2, "0")}`),
      ),
    }),
  );
  sinkNegative(
    "planner tension collection",
    makePlannerInput({
      tensions: Array.from({ length: 17 }, (_, index) =>
        makePlannerTension(`tension:item-${String(index).padStart(2, "0")}`),
      ),
    }),
  );
  sinkNegative(
    "planner proposal collection",
    makePlannerInput({
      proposals: Array.from({ length: 17 }, (_, index) =>
        makePlannerProposal(`proposal:item-${String(index).padStart(2, "0")}`),
      ),
    }),
  );
  sinkNegative(
    "planner request bytes",
    makePlannerInput({ message: "x".repeat(8_193) }),
  );
  sinkNegative("planner unsafe nested proposal", makePlannerInput({
    proposals: [
      {
        ...makePlannerProposal(),
        after_value: { api_key: blockedMarker },
      },
    ],
  }), undefined, blockedMarker);
  sinkNegative("planner unknown nested field", makePlannerInput({
    proposals: [{ ...makePlannerProposal(), unexpected: true }],
  }));

  sinkNegative("temporal arbitrary unsupported context", {
    ...makeTemporalInput(),
    context: { scope: "project:augnes", arbitrary: "material" },
  });
  sinkNegative("temporal unknown context variant", {
    ...makeTemporalInput(),
    context: { ...makeTemporalContext(), context_variant: "future" },
  });
  sinkNegative("temporal excessive nesting", makeTemporalInput(), {
    max_depth: 2,
  });
  sinkNegative("temporal unknown field", {
    ...makeTemporalInput(),
    context: { ...makeTemporalContext(), unexpected: true },
  });
  sinkNegative("temporal provider parameter injection", {
    ...makeTemporalInput(),
    context: { ...makeTemporalContext(), response_format: { type: "text" } },
  });
  sinkNegative(
    "temporal unsafe context material",
    {
      ...makeTemporalInput(),
      context: {
        ...makeTemporalContext(),
        current_interpretation: fragment("raw ", "transcript", ": ", blockedMarker),
      },
    },
    undefined,
    blockedMarker,
  );
  sinkNegative("temporal collection bound", {
    ...makeTemporalInput(),
    context: {
      ...makeTemporalContext(),
      evidence_anchors: Array.from({ length: 9 }, (_, index) => ({
        ref: `state:item-${index}`,
        claim: "Bounded claim.",
        source_type: "committed_state",
      })),
    },
  });

  await runInjectedTransportSinkCases();
}

async function runInjectedTransportSinkCases() {
  const observedPayloads: CapturedProviderPayload[] = [];
  const observeTransport = fakeTransport(
    {
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
          reason: "Bounded synthetic provider result.",
        },
      ],
    },
    observedPayloads,
  );
  const observeOutput = await compileTemporalDeltaProposalsWithOpenAIForTestV01(
    observeSinkInput(makeObserveInput()),
    observeTransport,
  );
  assert.equal(observeOutput.length, 1);
  assert.equal(observeOutput[0]?.state_key, "product.name");
  assertCapturedSinkPayload(
    observedPayloads,
    OPENAI_OUTBOUND_PAYLOAD_LIMITS_V01.observe_delta_compile.max_final_request_bytes,
    ["current_state", "message", "scope"],
  );
  positiveCases += 1;

  const plannerPayloads: CapturedProviderPayload[] = [];
  const plannerTransport = fakeTransport(
    {
      recommendations: [
        {
          title: "Review the bounded result",
          rationale: "The synthetic response remains review-only.",
          tool_name: null,
          priority: "next",
          grounded_state_keys: ["planner.state_planner"],
        },
      ],
    },
    plannerPayloads,
  );
  const plannerOutput = await planWithOpenAIForTestV01(
    "Plan the next bounded step.",
    plannerBrief(),
    plannerTransport,
  );
  assert.equal(plannerOutput.length, 1);
  assert.equal(plannerOutput[0]?.priority, "next");
  assertCapturedSinkPayload(
    plannerPayloads,
    OPENAI_OUTBOUND_PAYLOAD_LIMITS_V01.planner_plan.max_final_request_bytes,
    ["brief", "message"],
  );
  positiveCases += 1;

  const temporalPayloads: CapturedProviderPayload[] = [];
  const temporalContext = structuredClone(
    TEMPORAL_HARDENING_FIXTURES[0].input_context,
  );
  const temporalTransport = fakeTransport(
    buildMockTemporalPreview(temporalContext),
    temporalPayloads,
  );
  const temporalOutput = await buildOpenAITemporalPreview({
    context: temporalContext,
    transport: temporalTransport,
  });
  assert.equal(temporalOutput.model, "gpt-4.1-mini");
  assert.equal(temporalOutput.preview.non_authority_boundary.length > 0, true);
  assertCapturedSinkPayload(
    temporalPayloads,
    OPENAI_OUTBOUND_PAYLOAD_LIMITS_V01.temporal_interpretation
      .max_final_request_bytes,
    ["context"],
  );
  positiveCases += 1;

  const noKeyObserve = await compileTemporalDeltaProposals({
    message: "Bounded observation.",
    scope: "project:augnes",
    currentState: [],
  });
  assert.equal(noKeyObserve.compiler, "mock");
  const noKeyTemporal = await buildTemporalInterpretationPreview({
    scope: "project:augnes",
    context: temporalContext,
  });
  assert.equal(noKeyTemporal.generator, "mock");
  positiveCases += 2;

  await observeBlockedSeamCases();
  await plannerBlockedSeamCases();
  await temporalBlockedSeamCases();

  await expectProviderErrorRedacted(
    "observe provider error redaction",
    (transport) =>
      compileTemporalDeltaProposalsWithOpenAIForTestV01(
        observeSinkInput(makeObserveInput()),
        transport,
      ),
    blockedMarker,
  );
  await expectProviderErrorRedacted(
    "planner provider error redaction",
    (transport) =>
      planWithOpenAIForTestV01(
        "Plan the next bounded step.",
        plannerBrief(),
        transport,
      ),
    blockedMarker,
  );
  await expectProviderErrorRedacted(
    "temporal provider error redaction",
    (transport) =>
      buildOpenAITemporalPreview({
        context: temporalContext,
        transport,
      }),
    blockedMarker,
  );
}

async function observeBlockedSeamCases() {
  const cases: Array<[string, ObserveBoundaryInput, string?]> = [
    [
      "observe seam state count",
      makeObserveInput({
        states: Array.from({ length: 65 }, (_, index) =>
          makeObserveState(`state:blocked-${index}`),
        ),
      }),
    ],
    [
      "observe seam state item bytes",
      makeObserveInput({
        states: [makeObserveState("state:blocked-item", "x".repeat(4_097))],
      }),
    ],
    [
      "observe seam unknown state field",
      {
        ...makeObserveInput(),
        current_state: [{ ...makeObserveState(), unexpected: true }],
      },
    ],
    [
      "observe seam unsafe state material",
      makeObserveInput({
        states: [makeObserveState("state:blocked-unsafe", fragment("nonce", "=", blockedMarker))],
      }),
      blockedMarker,
    ],
    [
      "observe seam message bytes",
      makeObserveInput({ message: "x".repeat(32_769), states: [] }),
    ],
  ];
  for (const [label, input, marker] of cases) {
    await expectSinkBoundaryBlocked(
      label,
      (transport) =>
        compileTemporalDeltaProposalsWithOpenAIForTestV01(
          observeSinkInput(input),
          transport,
        ),
      marker,
    );
  }
}

async function plannerBlockedSeamCases() {
  const cases: Array<[string, string, UnknownRecord, string?]> = [
    [
      "planner seam state collection",
      "Plan.",
      plannerBrief({
        active: Array.from({ length: 33 }, (_, index) =>
          makePlannerState(`state:blocked-${index}`),
        ),
      }) as unknown as UnknownRecord,
    ],
    [
      "planner seam tension collection",
      "Plan.",
      plannerBrief({
        tensions: Array.from({ length: 17 }, (_, index) =>
          makePlannerTension(`tension:blocked-${index}`),
        ),
      }) as unknown as UnknownRecord,
    ],
    [
      "planner seam proposal collection",
      "Plan.",
      plannerBrief({
        proposals: Array.from({ length: 17 }, (_, index) =>
          makePlannerProposal(`proposal:blocked-${index}`),
        ),
      }) as unknown as UnknownRecord,
    ],
    ["planner seam request bytes", "x".repeat(8_193), plannerBrief() as unknown as UnknownRecord],
    [
      "planner seam unsafe nested proposal",
      "Plan.",
      plannerBrief({
        proposals: [
          { ...makePlannerProposal(), after_value: { api_key: blockedMarker } },
        ],
      }) as unknown as UnknownRecord,
      blockedMarker,
    ],
    [
      "planner seam unknown nested field",
      "Plan.",
      plannerBrief({
        proposals: [{ ...makePlannerProposal(), unexpected: true }],
      }) as unknown as UnknownRecord,
    ],
  ];
  for (const [label, message, brief, marker] of cases) {
    await expectSinkBoundaryBlocked(
      label,
      (transport) =>
        planWithOpenAIForTestV01(
          message,
          brief as Parameters<typeof planWithOpenAIForTestV01>[1],
          transport,
        ),
      marker,
    );
  }
}

async function temporalBlockedSeamCases() {
  const cases: Array<[string, UnknownRecord, string?]> = [
    ["temporal seam unsupported context", { scope: "project:augnes", arbitrary: true }],
    [
      "temporal seam unknown context variant",
      { ...makeTemporalContext(), context_variant: "future" },
    ],
    ["temporal seam unknown field", { ...makeTemporalContext(), unexpected: true }],
    [
      "temporal seam provider parameter injection",
      { ...makeTemporalContext(), response_format: { type: "text" } },
    ],
    [
      "temporal seam unsafe context material",
      {
        ...makeTemporalContext(),
        current_interpretation: fragment("raw ", "transcript", ": ", blockedMarker),
      },
      blockedMarker,
    ],
    [
      "temporal seam collection bound",
      {
        ...makeTemporalContext(),
        evidence_anchors: Array.from({ length: 9 }, (_, index) => ({
          ref: `state:blocked-${index}`,
          claim: "Bounded claim.",
          source_type: "committed_state",
        })),
      },
    ],
  ];
  for (const [label, context, marker] of cases) {
    await expectSinkBoundaryBlocked(
      label,
      (transport) =>
        buildOpenAITemporalPreview({
          context: context as unknown as TemporalPreviewContext,
          transport,
        }),
      marker,
    );
  }
}

function positive(_label: string, check: () => void) {
  check();
  positiveCases += 1;
}

function negative(
  _label: string,
  input: unknown,
  testLimits?: OpenAIOutboundTestLimitsV01,
  marker?: string,
) {
  const result = assertBlocked(
    buildOpenAIOutboundPayloadV01(
      input,
      testLimits ? { test_limits: testLimits } : undefined,
    ),
  );
  assertPublicSafe(result, marker);
  negativeCases += 1;
}

function sinkNegative(
  label: string,
  input: unknown,
  testLimits?: OpenAIOutboundTestLimitsV01,
  marker?: string,
) {
  negative(label, input, testLimits, marker);
  const result = buildOpenAIOutboundPayloadV01(
    input,
    testLimits ? { test_limits: testLimits } : undefined,
  );
  if (result.status === "ready") {
    invalidCasesReachingFakeTransport += 1;
  }
  assert.equal(result.status, "blocked");
}

type SharedFakeTransportV01 = ObserveOpenAITransportV01 &
  PlannerOpenAITransportV01 &
  TemporalOpenAITransportV01;

function fakeTransport(
  output: unknown,
  captured: CapturedProviderPayload[],
): SharedFakeTransportV01 {
  return async (payload) => {
    fakeTransportCalls += 1;
    captured.push(payload);
    return {
      ok: true,
      status: 200,
      async json() {
        return { output_text: JSON.stringify(output) };
      },
    };
  };
}

async function expectSinkBoundaryBlocked(
  _label: string,
  invoke: (transport: SharedFakeTransportV01) => Promise<unknown>,
  marker?: string,
) {
  let localCalls = 0;
  let thrown: unknown;
  const transport: SharedFakeTransportV01 = async () => {
    localCalls += 1;
    fakeTransportCalls += 1;
    invalidCasesReachingFakeTransport += 1;
    return {
      ok: true,
      status: 200,
      async json() {
        return { output_text: "{}" };
      },
    };
  };
  try {
    await invoke(transport);
  } catch (error) {
    thrown = error;
  }
  assert.equal(
    thrown instanceof OpenAIOutboundPayloadBoundaryErrorV01,
    true,
    "sink must throw the typed boundary error",
  );
  assert.equal(localCalls, 0, "blocked sink input must not call transport");
  const boundaryError = thrown as OpenAIOutboundPayloadBoundaryErrorV01;
  assertPublicSafe(boundaryError.blocked_result, marker);
  assert.equal(boundaryError.message.includes(marker ?? blockedMarker), false);
  blockedSinkCases += 1;
  negativeCases += 1;
}

async function expectProviderErrorRedacted(
  _label: string,
  invoke: (transport: SharedFakeTransportV01) => Promise<unknown>,
  marker: string,
) {
  let localCalls = 0;
  let thrown: unknown;
  const transport: SharedFakeTransportV01 = async () => {
    localCalls += 1;
    fakeTransportCalls += 1;
    return {
      ok: false,
      status: 429,
      async json() {
        return { rejected_body: marker };
      },
    };
  };
  try {
    await invoke(transport);
  } catch (error) {
    thrown = error;
  }
  assert.equal(localCalls, 1);
  assert.equal(thrown instanceof Error, true);
  const message = (thrown as Error).message;
  assert.equal(message.includes(marker), false);
  assert.match(message, /429/);
  positiveCases += 1;
}

function assertCapturedSinkPayload(
  captured: CapturedProviderPayload[],
  maximumFinalBytes: number,
  expectedDynamicKeys: string[],
) {
  assert.equal(captured.length, 1);
  const payload = captured[0]!;
  assert.deepEqual(Object.keys(payload).sort(), ["input", "model", "text"]);
  assert.equal(Buffer.byteLength(JSON.stringify(payload), "utf8") <= maximumFinalBytes, true);
  const dynamic = JSON.parse(payload.input[1].content[0].text) as UnknownRecord;
  assert.deepEqual(Object.keys(dynamic).sort(), expectedDynamicKeys);
}

function observeSinkInput(input: ObserveBoundaryInput) {
  return {
    message: input.message as string,
    scope: input.scope,
    currentState:
      input.current_state as unknown as Parameters<
        typeof compileTemporalDeltaProposalsWithOpenAIForTestV01
      >[0]["currentState"],
  };
}

function plannerBrief({
  active = [makePlannerState()],
  tensions = [makePlannerTension()],
  proposals = [makeRepresentativePlannerProposal()],
}: {
  active?: UnknownRecord[];
  tensions?: UnknownRecord[];
  proposals?: UnknownRecord[];
} = {}): Parameters<typeof planWithOpenAIForTestV01>[1] {
  return {
    scope: "project:augnes",
    active_state: active,
    future_state: [],
    completed_state: [],
    deprecated_state: [],
    open_tensions: tensions,
    pending_proposals: proposals,
  } as unknown as Parameters<typeof planWithOpenAIForTestV01>[1];
}

function assertReady(
  result: ReturnType<typeof buildOpenAIOutboundPayloadV01>,
): OpenAIOutboundPayloadReadyV01 {
  assert.equal(result.status, "ready", JSON.stringify(result));
  assert.equal(
    result.audit.final_request_bytes <= result.audit.limits.max_final_request_bytes,
    true,
  );
  assert.equal(result.audit.dynamic_bytes <= result.audit.limits.max_dynamic_bytes, true);
  return result;
}

function assertBlocked(
  result: ReturnType<typeof buildOpenAIOutboundPayloadV01>,
): OpenAIOutboundPayloadBlockedV01 {
  assert.equal(result.status, "blocked", "expected fail-closed boundary result");
  assert.equal("provider_payload" in result, false);
  assert.equal(result.provider_call_allowed_by_boundary, false);
  assert.equal(result.credential_material_included, false);
  assert.equal(result.private_material_included, false);
  assert.equal(result.reason_codes.length > 0, true);
  return result;
}

function assertPublicSafe(result: OpenAIOutboundPayloadBlockedV01, marker?: string) {
  const error = new OpenAIOutboundPayloadBoundaryErrorV01(result);
  const publicText = JSON.stringify({ result, error: error.message });
  for (const forbidden of [marker, blockedMarker]) {
    if (!forbidden) continue;
    const absent = !publicText.includes(forbidden);
    blockedMarkerAbsent &&= absent;
    assert.equal(absent, true, "blocked output must not echo rejected material");
  }
}

function readDynamicText(ready: OpenAIOutboundPayloadReadyV01) {
  return ready.provider_payload.input[1].content[0].text;
}

function assertProviderPayload(
  ready: OpenAIOutboundPayloadReadyV01,
  expectedDynamicKeys: string[],
) {
  assert.deepEqual(Object.keys(ready.provider_payload).sort(), ["input", "model", "text"]);
  assert.deepEqual(
    ready.provider_payload.input.map((message) => message.role),
    ["system", "user"],
  );
  assert.deepEqual(
    ready.provider_payload.input.map((message) =>
      message.content.map((content) => content.type),
    ),
    [["input_text"], ["input_text"]],
  );
  const dynamic = JSON.parse(readDynamicText(ready)) as UnknownRecord;
  assert.deepEqual(Object.keys(dynamic).sort(), expectedDynamicKeys);
  assert.equal(
    Buffer.byteLength(JSON.stringify(ready.provider_payload), "utf8"),
    ready.audit.final_request_bytes,
  );
}

function makeObserveInput({
  message = "Bounded observation.",
  states = [makeObserveState()],
}: {
  message?: unknown;
  states?: UnknownRecord[];
} = {}): ObserveBoundaryInput {
  return {
    purpose: "observe_delta_compile",
    model: "gpt-4.1-mini",
    scope: "project:augnes",
    message,
    current_state: states,
  };
}

function makeObserveState(id = "state:one", value: unknown = "Augnes"): UnknownRecord {
  return {
    id,
    scope: "project:augnes",
    state_key: `product.${id.replace(/[^A-Za-z0-9_]/g, "_")}`,
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

function makePlannerInput({
  message = "Plan the next bounded step.",
  active = [makePlannerState()],
  tensions = [makePlannerTension()],
  proposals = [makePlannerProposal()],
}: {
  message?: unknown;
  active?: UnknownRecord[];
  tensions?: UnknownRecord[];
  proposals?: UnknownRecord[];
} = {}): UnknownRecord {
  return {
    purpose: "planner_plan",
    model: "gpt-4.1-mini",
    scope: "project:augnes",
    message,
    state: {
      active,
      future: [],
      completed: [],
      deprecated: [],
    },
    open_tensions: tensions,
    pending_proposals: proposals,
  };
}

function makePlannerState(id = "state:planner", value: unknown = "active"): UnknownRecord {
  return {
    id,
    state_key: `planner.${id.replace(/[^A-Za-z0-9_]/g, "_")}`,
    value,
    temporal_scope: "current_project",
    valid_from: null,
    valid_until: null,
    stability: "active",
    change_type: "new_state",
    scope: "project:augnes",
    source_agent_id: null,
    source_session_id: null,
    source_transition_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

function makePlannerTension(id = "tension:one"): UnknownRecord {
  return {
    id,
    state_key: "planner.state_planner",
    title: "Review boundary",
    description: "A bounded review remains open.",
    status: "open",
    severity: "medium",
    scope: "project:augnes",
    source_agent_id: null,
    source_session_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
    resolved_at: null,
  };
}

function makePlannerProposal(id = "proposal:one"): UnknownRecord {
  return {
    id,
    state_key: "planner.next_step",
    before_value: null,
    after_value: "review",
    operation: "set",
    temporal_scope: "current_project",
    valid_from: null,
    valid_until: null,
    stability: "tentative",
    change_type: "new_state",
    reason: "Review the bounded proposal.",
    status: "pending",
    scope: "project:augnes",
    source_agent_id: null,
    source_session_id: null,
    proposed_at: "2026-01-01T00:00:00.000Z",
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
    scoring_reason: null,
    score_breakdown: {},
  };
}

function makeRepresentativePlannerProposal(): UnknownRecord {
  const proposal = makePlannerProposal();
  const scoring = scoreCandidateProposal({
    proposal: {
      id: proposal.id as string,
      scope: proposal.scope as string,
      state_key: proposal.state_key as string,
      before_value: proposal.before_value as null,
      after_value: proposal.after_value as string,
      operation: proposal.operation as string,
      temporal_scope: proposal.temporal_scope as string,
      valid_from: proposal.valid_from as null,
      valid_until: proposal.valid_until as null,
      stability: proposal.stability as string,
      change_type: proposal.change_type as string,
      source_agent_id: null,
      source_session_id: null,
      reason: proposal.reason as string,
      proposed_at: proposal.proposed_at as string,
    },
    currentState: [],
    now: "2026-01-01T00:00:00.000Z",
  });
  return { ...proposal, ...scoring };
}

function makeTemporalInput(): TemporalBoundaryInput {
  return {
    purpose: "temporal_interpretation",
    model: "gpt-4.1-mini",
    context: makeTemporalContext(),
  };
}

function makeTemporalContext(): UnknownRecord {
  return {
    scope: "project:augnes",
    as_of: "2026-01-01T00:00:00.000Z",
    current_interpretation: "Bounded read-only interpretation.",
    active_prior_context: "No prior context is required.",
    evidence_anchors: [],
    summary_refs: [],
    source_authority_profile: {
      committed_state_authority: [],
      summary_only_refs: [],
      allowed_now: ["read-only review"],
      blocked_now: ["state mutation"],
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

function unsafeValues(): Array<[string, string]> {
  return [
    ["API-key-shaped value", fragment("sk", "-", "proj", "-", "A".repeat(24))],
    ["bearer-shaped value", fragment("Bearer", " ", "B".repeat(24))],
    [
      "JWT-shaped value",
      fragment("eyJ", "A".repeat(12), ".", "B".repeat(12), ".", "C".repeat(12)),
    ],
    ["cookie-shaped value", fragment("cookie", "=", blockedMarker)],
    ["session-token-shaped value", fragment("session", "_token=", blockedMarker)],
    ["nonce-shaped value", fragment("nonce", "=", blockedMarker)],
    [
      "private-key-shaped value",
      fragment("-----BEGIN ", "PRIVATE", " KEY-----\n", blockedMarker),
    ],
    ["raw prompt material", fragment("raw ", "prompt", ": ", blockedMarker)],
    ["raw transcript material", fragment("raw ", "transcript", ": ", blockedMarker)],
    ["hidden reasoning material", fragment("hidden ", "reasoning", ": ", blockedMarker)],
    ["terminal dump material", fragment("terminal ", "dump", ": ", blockedMarker)],
    ["environment dump material", fragment("environment ", "dump", ": ", blockedMarker)],
    ["absolute Unix path", fragment("/", "Users", "/example/", blockedMarker)],
    ["custom absolute Unix path", fragment("/", "custom/internal/", blockedMarker)],
    ["filesystem-like absolute path", fragment("/", "lib/private/", blockedMarker)],
    ["single-segment absolute path", fragment("/", "secrets")],
    ["absolute Windows path", fragment("C", ":\\", "Users\\example\\", blockedMarker)],
    ["drive-relative path", fragment("C", ":", "private\\", blockedMarker)],
    ["home-relative path", fragment("~", "/private/", blockedMarker)],
    ["file URI", fragment("file", "://", "/private/", blockedMarker)],
    ["private URL", fragment("http", "://", "127", ".0.0.1/", blockedMarker)],
    ["loopback range URL", fragment("http", "://127.0.0.2/", blockedMarker)],
    ["unspecified host URL", fragment("http", "://0.0.0.0/", blockedMarker)],
    ["link-local URL", fragment("http", "://169.254.169.254/", blockedMarker)],
    ["internal host URL", fragment("https", "://service.internal/", blockedMarker)],
    [
      "provider endpoint material",
      fragment("https", "://", "api", ".", "openai", ".com/v1/", blockedMarker),
    ],
  ];
}

function fragment(...parts: string[]) {
  return parts.join("");
}

function reverseObjectKeys<T extends UnknownRecord>(value: T): T {
  return Object.fromEntries(Object.entries(value).reverse()) as T;
}

function deepFreeze(value: unknown, seen = new WeakSet<object>()): void {
  if (typeof value !== "object" || value === null || seen.has(value)) return;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    deepFreeze(Reflect.get(value, key), seen);
  }
  Object.freeze(value);
}
