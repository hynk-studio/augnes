import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const docPath = "docs/PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_V0_1.md";
const fixturePath = "fixtures/provider-assisted-extraction-runtime-completion.sample.v0.1.json";
const boundaryPath = "lib/research-extraction/provider-boundary.ts";
const runPath = "lib/research-extraction/provider-extract-candidates.ts";
const normalizePath = "lib/research-extraction/normalize-provider-output.ts";
const routePath = "app/api/research-candidate-review/provider-extraction/route.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const legacyRuntimeSmokeScript = "smoke:provider-assisted-extraction-runtime-v0-1";
const legacyContractSmokeScript = "smoke:provider-assisted-extraction-candidate-only-contract-v0-1";
const boundedSourceCompletionSmokeScript = "smoke:bounded-source-intake-runtime-completion-v0-1";
const packageScriptName = "smoke:provider-assisted-extraction-runtime-completion-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-provider-assisted-extraction-runtime-completion-v0-1.mjs";

const runtimeVersion = "provider_assisted_extraction_runtime_completion.v0.1";
const requestVersion = "provider_assisted_extraction_runtime_completion_request.v0.1";
const resultVersion = "provider_assisted_extraction_runtime_completion_result.v0.1";
const routeVersion = "provider_assisted_extraction_runtime_completion_route.v0.1";
const scope = "project:augnes";

const requiredFixtureKeys = [
  "fixture_version",
  "runtime_version",
  "request_version",
  "result_version",
  "route_version",
  "scope",
  "safe_mock_provider_request_example",
  "safe_missing_key_configured_provider_request_example",
  "mock_provider_output_example",
  "normalized_candidate_bundle_example",
  "expected_candidate_bundle_result_example",
  "provider_unavailable_result_example",
  "unsupported_extraction_result_example",
  "low_grounding_warning_example",
  "blocked_private_or_raw_payload_example",
  "blocked_forbidden_authority_example",
  "blocked_missing_source_ref_example",
  "blocked_missing_bounded_excerpt_example",
  "blocked_raw_provider_output_storage_request_example",
  "blocked_chain_of_thought_storage_request_example",
  "authority_boundary_sample",
];

const authorityAllowedTrueFields = [
  "provider_assisted_extraction_runtime_now",
  "explicit_operator_provider_action_only",
  "same_origin_post_route_now",
  "normalized_candidate_bundle_now",
  "candidate_only_output_now",
  "source_ref_required",
  "bounded_source_excerpt_required",
  "raw_source_body_non_persistent_by_default",
  "raw_provider_output_non_persistent_by_default",
];

const authorityConditionalFields = [
  "provider_adapter_invocation_now",
  "mock_provider_adapter_now",
  "configured_provider_missing_key_refusal_now",
];

const authorityForbiddenFalseFields = [
  "provider_call_on_load_now",
  "background_provider_call_now",
  "hidden_provider_call_now",
  "raw_prompt_stored_now",
  "prompt_sent_without_operator_action_now",
  "hidden_reasoning_stored_now",
  "chain_of_thought_stored_now",
  "raw_source_body_stored_now",
  "raw_provider_output_stored_now",
  "provider_thread_run_session_id_canonicalized_now",
  "retrieval_index_write_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "db_query_or_write_now",
  "route_get_provider_execution_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "product_persistence_now",
  "git_ledger_export_runtime_now",
  "git_write_now",
  "github_api_call_now",
  "repository_file_write_now",
  "local_file_export_now",
  "local_file_import_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "provider_output_is_truth",
  "provider_output_is_proof",
  "provider_output_is_accepted_evidence",
  "provider_confidence_is_truth",
  "provider_confidence_is_promotion_readiness",
  "candidate_is_fact",
  "candidate_is_proof",
  "candidate_is_accepted_evidence",
  "source_ref_is_proof",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

for (const filePath of [
  docPath,
  fixturePath,
  boundaryPath,
  runPath,
  normalizePath,
  routePath,
  packagePath,
  indexPath,
  roadmapPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const doc = readFile(docPath);
const fixtureText = readFile(fixturePath);
const fixture = JSON.parse(fixtureText);
const boundarySource = readFile(boundaryPath);
const runSource = readFile(runPath);
const normalizeSource = readFile(normalizePath);
const routeSource = readFile(routePath);
const packageJson = JSON.parse(readFile(packagePath));
const indexDoc = readFile(indexPath);
const roadmap = readFile(roadmapPath);

const boundary = await import(pathToFileURL(boundaryPath).href);
const runtime = await import(pathToFileURL(runPath).href);
const normalize = await import(pathToFileURL(normalizePath).href);
const routeModule = await import(pathToFileURL(routePath).href);

assertFixtureShape();
assertDocsAndRoadmapCoverage();
assertPackageAndIndexCoverage();
assertLibraryExports();
assertStaticBoundaries();

const mockAdapter = runtime.createMockProviderExtractionAdapterV01([
  fixture.mock_provider_output_example,
]);
let mockAdapterInvocations = 0;
const observedAdapterRequests = [];
const countingMockAdapter = async (request) => {
  mockAdapterInvocations += 1;
  observedAdapterRequests.push(request);
  return mockAdapter(request);
};

const mockResult = await runtime.runProviderAssistedExtractionRuntimeV01(
  fixture.safe_mock_provider_request_example,
  { providerAdapter: countingMockAdapter },
);
assert.equal(mockResult.status, "candidate_bundle_created");
assert.equal(mockAdapterInvocations, 1, "mock provider adapter must be invoked");
assert.equal(mockResult.provider_call_executed, true);
assert.equal(mockResult.raw_source_body_stored, false);
assert.equal(mockResult.raw_provider_output_stored, false);
assert.equal(mockResult.hidden_reasoning_stored, false);
assert.equal(mockResult.retrieval_indexed, false);
assert.equal(mockResult.proof_or_evidence_created, false);
assert.equal(mockResult.promotion_executed, false);
assert.equal(mockResult.product_write_executed, false);
assertAuthorityBoundary(mockResult.authority_boundary, {
  provider_adapter_invocation_now: true,
  mock_provider_adapter_now: true,
  configured_provider_missing_key_refusal_now: false,
});
assertAdapterRequestShape(observedAdapterRequests[0]);
assertNormalizedBundle(mockResult.normalized_candidate_bundle);
assertNoUnsafeEcho(mockResult, "mock provider result");

const bundleFingerprint = normalize.createProviderCandidateBundleFingerprintV01(
  mockResult.normalized_candidate_bundle,
);
assert.equal(typeof bundleFingerprint, "string");
assert.ok(bundleFingerprint.length >= 32);

const missingKeyResult = await runtime.runProviderAssistedExtractionRuntimeV01(
  fixture.safe_missing_key_configured_provider_request_example,
);
assert.equal(missingKeyResult.status, "provider_missing_key");
assert.equal(missingKeyResult.provider_call_executed, false);
assert.equal(missingKeyResult.raw_provider_output_stored, false);
assert.ok(missingKeyResult.reason_codes.includes("configured_provider_missing_key_refusal_now"));
assertAuthorityBoundary(missingKeyResult.authority_boundary, {
  provider_adapter_invocation_now: false,
  mock_provider_adapter_now: false,
  configured_provider_missing_key_refusal_now: true,
});
assertNoUnsafeEcho(missingKeyResult, "missing-key result");

const unsupportedResult = await runtime.runProviderAssistedExtractionRuntimeV01(
  fixture.safe_mock_provider_request_example,
  {
    providerAdapter: runtime.createMockProviderExtractionAdapterV01([
      {
        status: "unsupported_extraction",
        provider_request_ref: "provider-request-ref:unsupported-public-safe",
        provider_response_ref: "provider-response-ref:unsupported-public-safe",
        provider_latency_ms: 2,
        output_items: [],
        warnings: ["unsupported_extraction"],
        reason_codes: ["unsupported_extraction"],
      },
    ]),
  },
);
assert.equal(unsupportedResult.status, "unsupported_extraction");
assert.ok(unsupportedResult.warnings.includes("unsupported_extraction"));
assert.equal(unsupportedResult.provider_call_executed, true);
assertNoUnsafeEcho(unsupportedResult, "unsupported extraction result");

assert.ok(mockResult.warnings.includes("low_grounding_warning"));
assert.ok(
  mockResult.normalized_candidate_bundle.candidates.some(
    (candidate) => candidate.confidence_label === "low",
  ),
  "low-grounding provider output must remain visible as warning cue",
);

assertBlockedResult(
  await runtime.runProviderAssistedExtractionRuntimeV01(
    fixture.blocked_private_or_raw_payload_example,
    { providerAdapter: countingMockAdapter },
  ),
  "blocked_private_or_raw_payload",
);
assertBlockedResult(
  await runtime.runProviderAssistedExtractionRuntimeV01(
    fixture.blocked_forbidden_authority_example,
    { providerAdapter: countingMockAdapter },
  ),
  "blocked_forbidden_authority",
);
assertBlockedResult(
  await runtime.runProviderAssistedExtractionRuntimeV01(
    fixture.blocked_missing_source_ref_example,
    { providerAdapter: countingMockAdapter },
  ),
  "blocked_invalid_input",
);
assertBlockedResult(
  await runtime.runProviderAssistedExtractionRuntimeV01(
    fixture.blocked_missing_bounded_excerpt_example,
    { providerAdapter: countingMockAdapter },
  ),
  "blocked_invalid_input",
);
assertBlockedResult(
  await runtime.runProviderAssistedExtractionRuntimeV01(
    fixture.blocked_raw_provider_output_storage_request_example,
    { providerAdapter: countingMockAdapter },
  ),
  "blocked_invalid_input",
);
assertBlockedResult(
  await runtime.runProviderAssistedExtractionRuntimeV01(
    fixture.blocked_chain_of_thought_storage_request_example,
    { providerAdapter: countingMockAdapter },
  ),
  "blocked_private_or_raw_payload",
);

const rawProviderOutputResult = await runtime.runProviderAssistedExtractionRuntimeV01(
  fixture.safe_mock_provider_request_example,
  {
    providerAdapter: runtime.createMockProviderExtractionAdapterV01([
      {
        status: "ok",
        provider_request_ref: "provider-request-ref:raw-output-redacted",
        provider_response_ref: "provider-response-ref:raw-output-redacted",
        provider_latency_ms: 2,
        output_items: [
          {
            candidate_family: "claim_candidate",
            bounded_claim_summary: "SAFE_MARKER_RAW_PROVIDER_OUTPUT",
            bounded_support_summary: "SAFE_MARKER_HIDDEN_REASONING",
            confidence_label: "medium",
            warnings: ["SAFE_MARKER_PROVIDER_THREAD_ID"],
            reason_codes: ["mock_provider_adapter_now"],
          },
        ],
        warnings: ["mock_provider_adapter_now"],
        reason_codes: ["mock_provider_adapter_now"],
      },
    ]),
  },
);
assert.equal(rawProviderOutputResult.status, "candidate_bundle_created");
assertNoUnsafeEcho(rawProviderOutputResult, "raw provider output redaction result");

const routePost = routeModule.createProviderAssistedExtractionRuntimeCompletionPostHandlerV01({
  providerAdapter: countingMockAdapter,
});
const routeSuccess = await postJson(routePost, {
  route_version: routeVersion,
  scope,
  input: fixture.safe_mock_provider_request_example,
});
assert.equal(routeSuccess.response.status, 200);
assert.equal(routeSuccess.body.status, "ok");
assert.equal(routeSuccess.body.error_code, null);
assert.equal(routeSuccess.body.result.status, "candidate_bundle_created");
assertNoUnsafeEcho(routeSuccess.body, "route success body");

const routeMissingKey = await postJson(routeModule.POST, {
  route_version: routeVersion,
  scope,
  input: fixture.safe_missing_key_configured_provider_request_example,
});
assert.equal(routeMissingKey.response.status, 200);
assert.equal(routeMissingKey.body.status, "ok");
assert.equal(routeMissingKey.body.error_code, null);
assert.equal(routeMissingKey.body.result.status, "provider_missing_key");
assert.equal(routeMissingKey.body.result.provider_call_executed, false);

const routeUnsupported = await postJson(routePost, {
  route_version: routeVersion,
  scope,
  input: fixture.safe_mock_provider_request_example,
}, {
  providerAdapter: runtime.createMockProviderExtractionAdapterV01([
    {
      status: "unsupported_extraction",
      output_items: [],
      warnings: ["unsupported_extraction"],
      reason_codes: ["unsupported_extraction"],
    },
  ]),
});
assert.equal(routeUnsupported.response.status, 400);
assert.equal(routeUnsupported.body.error_code, "unsupported_extraction");

const crossSiteResponse = await routeModule.POST(
  new Request("http://localhost:3000/api/research-candidate-review/provider-extraction", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost:3000",
      origin: "https://example.invalid",
      "sec-fetch-site": "cross-site",
    },
    body: JSON.stringify({
      route_version: routeVersion,
      scope,
      input: fixture.safe_mock_provider_request_example,
    }),
  }),
);
const crossSiteBody = await crossSiteResponse.json();
assert.equal(crossSiteResponse.status, 403);
assert.equal(crossSiteBody.error_code, "same_origin_required");

const invalidJsonResponse = await routeModule.POST(
  new Request("http://localhost:3000/api/research-candidate-review/provider-extraction", {
    method: "POST",
    headers: sameOriginHeaders(),
    body: "{",
  }),
);
const invalidJsonBody = await invalidJsonResponse.json();
assert.equal(invalidJsonResponse.status, 400);
assert.equal(invalidJsonBody.error_code, "invalid_json_body");

assertFixtureSafety();

console.log(
  JSON.stringify(
    {
      smoke: "provider-assisted-extraction-runtime-completion-v0-1",
      final_status: "pass",
      runtime_version: runtimeVersion,
      route_version: routeVersion,
      scope,
      mock_status: mockResult.status,
      configured_provider_status: missingKeyResult.status,
      candidates: mockResult.candidate_refs.length,
    },
    null,
    2,
  ),
);

function assertFixtureShape() {
  for (const key of requiredFixtureKeys) {
    assert.ok(Object.hasOwn(fixture, key), `fixture must include ${key}`);
  }
  assert.equal(fixture.fixture_version, "provider_assisted_extraction_runtime_completion.sample.v0.1");
  assert.equal(fixture.runtime_version, runtimeVersion);
  assert.equal(fixture.request_version, requestVersion);
  assert.equal(fixture.result_version, resultVersion);
  assert.equal(fixture.route_version, routeVersion);
  assert.equal(fixture.scope, scope);
}

function assertDocsAndRoadmapCoverage() {
  const normalizedDoc = normalizeWhitespace(doc);
  for (const expected of [
    "provider key missing graceful refusal",
    "provider call은 explicit user action 필요",
    "source_ref_id required",
    "source excerpt length bounded",
    "raw source body non-persistence by default",
    "normalized candidate bundle output",
    "warnings for unsupported/low-grounding extraction",
    "no promotion/write authority",
  ]) {
    assert.ok(roadmap.includes(expected), `roadmap must contain ${expected}`);
  }
  for (const expected of [
    "This slice closes the original Phase 3.4 provider-assisted extraction runtime gap.",
    "The earlier deterministic provider runtime helper remains compatible but was not full runtime completion.",
    "Provider execution requires explicit same-origin POST operator action.",
    "Provider key/config missing is a graceful bounded refusal.",
    "Mock provider smoke is deterministic and requires no live provider.",
    "Live provider validation is optional and skipped if no safe key/config is available.",
    "`source_ref_id` is required.",
    "A bounded source excerpt or bounded source summary is required.",
    "Raw source body is non-persistent by default.",
    "Raw provider output is non-persistent by default.",
    "No chain-of-thought or hidden reasoning is stored.",
    "Normalized provider output is candidate-only.",
    "Provider output is not truth.",
    "Provider output is not proof/evidence.",
    "Provider confidence is not promotion readiness.",
    "There is no automatic review memory write.",
    "There is no retrieval index write.",
    "There is no proof/evidence write.",
    "There is no Perspective promotion.",
    "There is no durable Perspective state apply.",
    "There is no Formation Receipt write.",
    "This slice does not execute Git or call GitHub from Augnes runtime.",
    "This slice does not execute Codex.",
    "This slice does not product-write.",
    "This slice does not allocate product IDs.",
    "Product-write remains parked by #686.",
    "Smoke/CI pass is not truth.",
    "The roadmap guide is not SSOT.",
  ]) {
    assert.ok(normalizedDoc.includes(normalizeWhitespace(expected)), `docs must mention: ${expected}`);
  }
}

function assertPackageAndIndexCoverage() {
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
  for (const scriptName of [
    legacyRuntimeSmokeScript,
    legacyContractSmokeScript,
    boundedSourceCompletionSmokeScript,
  ]) {
    assert.equal(typeof packageJson.scripts?.[scriptName], "string", `${scriptName} script must exist`);
  }
  for (const expected of [
    "Provider-Assisted Extraction Runtime Completion v0.1",
    "provider_assisted_extraction_runtime_completion_v0_1",
    docPath,
    runPath,
    normalizePath,
    boundaryPath,
    routePath,
    fixturePath,
    packageScriptName,
    "Product-write remains parked by #686",
  ]) {
    assert.ok(indexDoc.includes(expected), `index must include ${expected}`);
  }
}

function assertLibraryExports() {
  for (const [moduleName, moduleValue, source, exports] of [
    [
      "provider-boundary",
      boundary,
      boundarySource,
      [
        "createProviderAssistedExtractionRuntimeAuthorityBoundaryV01",
        "validateProviderAssistedExtractionRuntimeRequestV01",
        "isSafeProviderExtractionRouteDbOrConfigValueV01",
        "redactProviderRuntimeRefV01",
        "classifyProviderAssistedExtractionFailureV01",
      ],
    ],
    [
      "provider-extract-candidates",
      runtime,
      runSource,
      [
        "runProviderAssistedExtractionRuntimeV01",
        "createMockProviderExtractionAdapterV01",
        "createMissingKeyProviderExtractionAdapterV01",
        "createProviderExtractionRequestFingerprintV01",
      ],
    ],
    [
      "normalize-provider-output",
      normalize,
      normalizeSource,
      [
        "normalizeProviderExtractionOutputV01",
        "validateNormalizedProviderCandidateBundleV01",
        "createProviderCandidateBundleFingerprintV01",
      ],
    ],
  ]) {
    for (const exportedName of exports) {
      assert.equal(typeof moduleValue[exportedName], "function", `${moduleName} exports ${exportedName}`);
      assert.ok(
        new RegExp(`export\\s+(?:async\\s+)?function\\s+${exportedName}\\b`).test(source),
        `${moduleName} source exports ${exportedName}`,
      );
    }
  }
  assert.equal(typeof routeModule.POST, "function", "route exports POST");
  assert.equal(
    typeof routeModule.createProviderAssistedExtractionRuntimeCompletionPostHandlerV01,
    "function",
    "route exports handler factory",
  );
}

function assertStaticBoundaries() {
  assert.ok(!Object.hasOwn(routeModule, "GET"), "route must not export GET");
  assert.ok(!/\bexport\s+(async\s+)?function\s+GET\b/.test(routeSource), "route source must not export GET");
  for (const [name, source] of [
    ["route", routeSource],
    ["runtime", runSource],
    ["boundary", boundarySource],
    ["normalize", normalizeSource],
  ]) {
    assert.ok(!source.includes("better-sqlite3"), `${name} must not import DB`);
    assert.ok(!source.includes("fs/promises"), `${name} must not write files`);
    assert.ok(!source.includes("writeFile"), `${name} must not write files`);
    assert.ok(!source.includes("retrieval_indexed: true"), `${name} must not index retrieval`);
    assert.ok(!source.includes("proof_or_evidence_created: true"), `${name} must not create proof/evidence`);
    assert.ok(!source.includes("promotion_executed: true"), `${name} must not promote`);
    assert.ok(!source.includes("product_write_executed: true"), `${name} must not product-write`);
    assert.ok(!source.includes("product_id_allocation_now: true"), `${name} must not allocate product IDs`);
    assert.ok(!source.includes("allocateProduct"), `${name} must not allocate product IDs`);
  }
  assert.ok(!routeSource.includes("fetch("), "route must not perform live provider network fetch");
}

function assertAdapterRequestShape(request) {
  assert.ok(request, "adapter request must be captured");
  for (const key of [
    "provider_ref",
    "model_or_tool_ref",
    "source_ref_id",
    "bounded_source_excerpt",
    "bounded_prompt_descriptor",
    "extraction_goal",
    "candidate_family_allowlist",
    "max_candidates",
    "max_output_chars",
  ]) {
    assert.ok(Object.hasOwn(request, key), `adapter request must include ${key}`);
  }
  const serialized = JSON.stringify(request);
  for (const forbidden of [
    "raw_prompt",
    "raw_provider_response",
    "hidden_reasoning",
    "chain_of_thought",
    "token_log",
    "thread_",
    "run_",
    "session_",
  ]) {
    assert.ok(!serialized.includes(forbidden), `adapter request must not include ${forbidden}`);
  }
}

function assertNormalizedBundle(bundle) {
  assert.ok(bundle, "normalized candidate bundle must exist");
  const validation = normalize.validateNormalizedProviderCandidateBundleV01(bundle);
  assert.deepEqual(validation, { passed: true, failure_codes: [] });
  assert.equal(bundle.source_ref_id, fixture.safe_mock_provider_request_example.source_ref_id);
  assert.ok(bundle.candidate_refs.length > 0, "candidate refs must be present");
  assert.equal(bundle.provider_output_is_truth, false);
  assert.equal(bundle.provider_output_is_proof, false);
  assert.equal(bundle.provider_output_is_accepted_evidence, false);
  assert.equal(bundle.provider_confidence_is_truth, false);
  assert.equal(bundle.provider_confidence_is_promotion_readiness, false);
  assert.equal(bundle.candidate_is_fact, false);
  assert.equal(bundle.candidate_is_proof, false);
  assert.equal(bundle.candidate_is_accepted_evidence, false);
  for (const candidate of bundle.candidates) {
    assert.ok(candidate.candidate_ref.startsWith("provider-candidate-ref:"));
    assert.equal(candidate.source_ref_id, fixture.safe_mock_provider_request_example.source_ref_id);
    assert.ok(["low", "medium", "high", "unknown"].includes(candidate.confidence_label));
    assert.equal(candidate.confidence_is_truth, false);
    assert.equal(candidate.provider_output_is_truth, false);
    assert.equal(candidate.provider_output_is_proof, false);
    assert.equal(candidate.candidate_is_fact, false);
    assert.equal(candidate.candidate_is_accepted_evidence, false);
    assert.equal(candidate.needs_operator_review, true);
    assert.ok(candidate.reason_codes.includes("candidate_only_output_now"));
  }
}

function assertBlockedResult(result, expectedStatus) {
  assert.equal(result.status, expectedStatus);
  assert.equal(result.provider_call_executed, false);
  assert.equal(result.raw_source_body_stored, false);
  assert.equal(result.raw_provider_output_stored, false);
  assert.equal(result.hidden_reasoning_stored, false);
  assert.equal(result.retrieval_indexed, false);
  assert.equal(result.proof_or_evidence_created, false);
  assert.equal(result.promotion_executed, false);
  assert.equal(result.product_write_executed, false);
  assertNoUnsafeEcho(result, `${expectedStatus} result`);
}

function assertAuthorityBoundary(boundaryValue, expectedConditional) {
  for (const field of authorityAllowedTrueFields) {
    assert.equal(boundaryValue[field], true, `${field} must be true`);
  }
  for (const field of authorityConditionalFields) {
    assert.equal(boundaryValue[field], expectedConditional[field], `${field} conditional mismatch`);
  }
  for (const field of authorityForbiddenFalseFields) {
    assert.equal(boundaryValue[field], false, `${field} must be false`);
  }
}

async function postJson(handler, body, options = {}) {
  const activeHandler = options.providerAdapter
    ? routeModule.createProviderAssistedExtractionRuntimeCompletionPostHandlerV01({
        providerAdapter: options.providerAdapter,
      })
    : handler;
  const response = await activeHandler(
    new Request("http://localhost:3000/api/research-candidate-review/provider-extraction", {
      method: "POST",
      headers: sameOriginHeaders(),
      body: JSON.stringify(body),
    }),
  );
  return { response, body: await response.json() };
}

function sameOriginHeaders() {
  return {
    "content-type": "application/json",
    host: "localhost:3000",
    origin: "http://localhost:3000",
    "sec-fetch-site": "same-origin",
  };
}

function assertFixtureSafety() {
  assertSafeMarkersOnlyInsideBlockedExamples(fixture);
  const scrubbed = fixtureText.replace(/SAFE_MARKER_[A-Z_]+/g, "SAFE_MARKER_ALLOWED_IN_BLOCKED_EXAMPLE");
  for (const pattern of [
    /sk-[A-Za-z0-9]/,
    /ghp_[A-Za-z0-9]/,
    /OPENAI_API_KEY/,
    /GITHUB_TOKEN/,
    /\/Users\//,
    /\/home\//,
    /file:\/\//,
    /https?:\/\/localhost/i,
    /https?:\/\/127\.0\.0\.1/i,
  ]) {
    assert.ok(!pattern.test(scrubbed), `fixture must not contain live-looking unsafe value ${pattern}`);
  }
}

function assertSafeMarkersOnlyInsideBlockedExamples(value, path = "$") {
  if (typeof value === "string" && value.includes("SAFE_MARKER_")) {
    assert.ok(path.includes("blocked_"), `safe marker appears outside blocked example at ${path}`);
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeMarkersOnlyInsideBlockedExamples(item, `${path}[${index}]`));
  } else if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      assertSafeMarkersOnlyInsideBlockedExamples(nested, `${path}.${key}`);
    }
  }
}

function assertNoUnsafeEcho(value, label) {
  const serialized = JSON.stringify(value);
  for (const forbidden of [
    "SAFE_MARKER_PRIVATE_URL",
    "SAFE_MARKER_LOCAL_PRIVATE_PATH",
    "SAFE_MARKER_SECRET_TOKEN",
    "SAFE_MARKER_RAW_SOURCE_BODY",
    "SAFE_MARKER_RAW_PROVIDER_OUTPUT",
    "SAFE_MARKER_RAW_RETRIEVAL_OUTPUT",
    "SAFE_MARKER_PROVIDER_THREAD_ID",
    "SAFE_MARKER_RAW_CONVERSATION",
    "SAFE_MARKER_HIDDEN_REASONING",
    "SAFE_MARKER_RAW_DB_ROW",
    "SAFE_MARKER_RAW_DIFF",
    "SAFE_MARKER_TELEMETRY_DUMP",
    "SAFE_MARKER_CHAIN_OF_THOUGHT",
    "raw provider output",
    "raw source body",
    "hidden reasoning",
  ]) {
    assert.ok(!serialized.includes(forbidden), `${label} must not echo ${forbidden}`);
  }
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, " ").trim();
}
