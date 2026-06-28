import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const docsPath = "docs/BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_V0_1.md";
const intakeRuntimePath = "lib/research-source/intake-runtime.ts";
const sanitizePath = "lib/research-source/sanitize-source-ref.ts";
const fetchPath = "lib/research-source/fetch-bounded-source.ts";
const routePath = "app/api/research-source/intake/route.ts";
const fixturePath = "fixtures/bounded-source-intake-runtime-completion.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";

const runtimeVersion = "bounded_source_intake_runtime_completion.v0.1";
const requestVersion = "bounded_source_intake_runtime_completion_request.v0.1";
const resultVersion = "bounded_source_intake_runtime_completion_result.v0.1";
const routeVersion = "bounded_source_intake_runtime_completion_route.v0.1";
const scope = "project:augnes";
const packageScriptName = "smoke:bounded-source-intake-runtime-completion-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-bounded-source-intake-runtime-completion-v0-1.mjs";

const authorityTrueFields = [
  "bounded_source_intake_runtime_now",
  "explicit_user_provided_source_only",
  "same_origin_post_route_now",
  "bounded_fetch_abstraction_now",
  "source_ref_metadata_now",
  "raw_body_non_persistent_by_default",
  "failure_to_gap_candidate_metadata_now",
];

const authorityFalseFields = [
  "automatic_crawling_now",
  "background_fetch_now",
  "automatic_web_discovery_now",
  "provider_extraction_now",
  "retrieval_index_write_now",
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
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "raw_source_body_persisted_now",
  "raw_private_payload_persisted_now",
  "raw_provider_output_stored_now",
  "raw_retrieval_output_stored_now",
  "source_ref_is_proof",
  "source_summary_is_truth",
  "failure_gap_is_fact",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const requiredFixtureKeys = [
  "safe_url_request_example",
  "safe_manual_text_summary_request_example",
  "safe_file_ref_request_example",
  "safe_note_ref_request_example",
  "mock_fetch_success_example",
  "mock_fetch_unsupported_content_type_example",
  "mock_fetch_missing_content_type_example",
  "mock_fetch_content_too_large_example",
  "mock_fetch_timeout_example",
  "mock_fetch_failure_to_gap_example",
  "live_fetch_redirect_blocked_example",
  "live_fetch_content_length_too_large_example",
  "live_fetch_stream_too_large_example",
  "expected_source_ref_metadata_example",
  "expected_result_envelope_example",
  "blocked_user_provided_false_example",
  "blocked_private_or_raw_payload_example",
  "blocked_forbidden_authority_example",
  "blocked_raw_body_storage_request_example",
  "authority_boundary_sample",
];

for (const filePath of [
  docsPath,
  intakeRuntimePath,
  sanitizePath,
  fetchPath,
  routePath,
  fixturePath,
  packagePath,
  indexPath,
  roadmapPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const docs = readFile(docsPath);
const intakeRuntimeSource = readFile(intakeRuntimePath);
const sanitizeSource = readFile(sanitizePath);
const fetchSource = readFile(fetchPath);
const routeSource = readFile(routePath);
const fixtureText = readFile(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readFile(packagePath));
const indexDoc = readFile(indexPath);
const roadmap = readFile(roadmapPath);

const intakeRuntime = await import(pathToFileURL(intakeRuntimePath).href);
const fetchRuntime = await import(pathToFileURL(fetchPath).href);
const sanitizeRuntime = await import(pathToFileURL(sanitizePath).href);
const routeModule = await import(pathToFileURL(routePath).href);

assertFixtureVersions();
assertDocsAndIndexCoverage();
assertRoadmapCoverage();
assertLibraryExports();
assertBoundedLiveFetchSource();
assertRouteShape();

const successFetcher = fetchRuntime.createMockBoundedSourceFetcherV01([
  {
    ...fixture.mock_fetch_success_example,
    source_ref_id: intakeRuntime.createBoundedSourceRefIdV01(fixture.safe_url_request_example),
  },
]);

const safeUrlResult = await intakeRuntime.runBoundedSourceIntakeRuntimeV01(
  fixture.safe_url_request_example,
  { fetcher: successFetcher },
);
assert.equal(safeUrlResult.status, "accepted_bounded_summary");
assert.ok(safeUrlResult.source_ref_id?.startsWith("source-ref:bounded-intake:"));
assert.ok(safeUrlResult.source_locator_ref?.startsWith("url-locator-ref:"));
assert.equal(safeUrlResult.bounded_summary, fixture.mock_fetch_success_example.bounded_summary);
assert.equal(safeUrlResult.raw_body_stored, false);
assert.equal(safeUrlResult.provider_extraction_started, false);
assert.equal(safeUrlResult.retrieval_indexed, false);
assert.equal(safeUrlResult.proof_or_evidence_created, false);
assert.equal(safeUrlResult.product_write_executed, false);
assertNoRawBodyEcho(safeUrlResult, "safe URL result");

const metadata = intakeRuntime.buildBoundedSourceRefMetadataV01(safeUrlResult);
assert.equal(metadata.source_ref_id, safeUrlResult.source_ref_id);
assert.equal(metadata.source_ref_is_proof, false);
assert.equal(metadata.source_summary_is_truth, false);

const repeatUrlResult = await intakeRuntime.runBoundedSourceIntakeRuntimeV01(
  fixture.safe_url_request_example,
  { fetcher: successFetcher },
);
assert.equal(repeatUrlResult.source_ref_id, safeUrlResult.source_ref_id);

const manualSummaryResult = await intakeRuntime.runBoundedSourceIntakeRuntimeV01(
  fixture.safe_manual_text_summary_request_example,
  { fetcher: failIfFetched },
);
assert.equal(manualSummaryResult.status, "accepted_bounded_summary");
assert.equal(manualSummaryResult.fetch_report.fetch_executed, false);
assert.equal(manualSummaryResult.bounded_summary, fixture.safe_manual_text_summary_request_example.bounded_summary);

const fileRefResult = await intakeRuntime.runBoundedSourceIntakeRuntimeV01(
  fixture.safe_file_ref_request_example,
  { fetcher: failIfFetched },
);
assert.equal(fileRefResult.status, "candidate_only");
assert.equal(fileRefResult.fetch_report.local_file_read_executed, false);
assert.equal(fileRefResult.fetch_report.symbolic_ref_only, true);

const noteRefResult = await intakeRuntime.runBoundedSourceIntakeRuntimeV01(
  fixture.safe_note_ref_request_example,
  { fetcher: failIfFetched },
);
assert.equal(noteRefResult.status, "candidate_only");
assert.equal(noteRefResult.fetch_report.symbolic_ref_only, true);

const userProvidedFalse = await intakeRuntime.runBoundedSourceIntakeRuntimeV01(
  fixture.blocked_user_provided_false_example,
);
assert.equal(userProvidedFalse.status, "blocked_invalid_input");

const privateResult = await intakeRuntime.runBoundedSourceIntakeRuntimeV01(
  fixture.blocked_private_or_raw_payload_example,
);
assert.equal(privateResult.status, "blocked_private_or_raw_payload");
assert.equal(privateResult.failure_kind, "private_identifier_detected");
assertNoUnsafeMarkerEcho(privateResult, "private blocked result");

const forbiddenAuthorityResult = await intakeRuntime.runBoundedSourceIntakeRuntimeV01(
  fixture.blocked_forbidden_authority_example,
);
assert.equal(forbiddenAuthorityResult.status, "blocked_forbidden_authority");
assert.equal(forbiddenAuthorityResult.failure_kind, "forbidden_authority");

const rawStorageResult = await intakeRuntime.runBoundedSourceIntakeRuntimeV01(
  fixture.blocked_raw_body_storage_request_example,
);
assert.equal(rawStorageResult.status, "blocked_invalid_input");
assert.equal(rawStorageResult.failure_kind, "raw_payload_blocked");

const unsupportedRoute = await postWithFetcher(
  fixture.safe_url_request_example,
  fixture.mock_fetch_unsupported_content_type_example,
);
assert.equal(unsupportedRoute.response.status, 415);
assert.equal(unsupportedRoute.body.error_code, "unsupported_content_type");
assert.equal(unsupportedRoute.body.result.failure_kind, "unsupported_content_type");

const missingContentTypeRoute = await postWithFetcher(
  fixture.safe_url_request_example,
  fixture.mock_fetch_missing_content_type_example,
);
assert.equal(missingContentTypeRoute.response.status, 415);
assert.equal(missingContentTypeRoute.body.error_code, "unsupported_content_type");
assert.equal(missingContentTypeRoute.body.result.failure_kind, "unsupported_content_type");

const tooLargeRequest = {
  ...fixture.safe_url_request_example,
  source_intake_request_id: "source-intake-request:url-too-large-001",
  source_locator: "https://example.invalid/bounded-source-intake/public-source-too-large",
  size_limit_bytes: 128,
};
const tooLargeRoute = await postWithFetcher(
  tooLargeRequest,
  fixture.mock_fetch_content_too_large_example,
);
assert.equal(tooLargeRoute.response.status, 413);
assert.equal(tooLargeRoute.body.error_code, "content_too_large");

const timeoutRoute = await postWithFetcher(
  fixture.safe_url_request_example,
  fixture.mock_fetch_timeout_example,
);
assert.equal(timeoutRoute.response.status, 504);
assert.equal(timeoutRoute.body.error_code, "timeout");

const failureRoute = await postWithFetcher(
  fixture.safe_url_request_example,
  fixture.mock_fetch_failure_to_gap_example,
);
assert.equal(failureRoute.response.status, 200);
assert.equal(failureRoute.body.status, "ok");
assert.equal(failureRoute.body.result.failure_kind, "fetch_failed");
assert.ok(failureRoute.body.result.gap_candidate_ref?.startsWith("gap-candidate:"));
assert.equal(failureRoute.body.result.bounded_summary, null);

const successRoute = await postWithFetcher(
  fixture.safe_url_request_example,
  fixture.mock_fetch_success_example,
);
assert.equal(successRoute.response.status, 200);
assert.equal(successRoute.body.status, "ok");
assert.equal(successRoute.body.error_code, null);
assert.equal(successRoute.body.raw_body_stored, false);
assert.equal(successRoute.body.provider_extraction_started, false);
assert.equal(successRoute.body.retrieval_indexed, false);
assert.equal(successRoute.body.proof_or_evidence_created, false);
assert.equal(successRoute.body.product_write_executed, false);
assertAuthorityBoundary(successRoute.body.authority_boundary, "route response authority boundary");
assertNoRawBodyEcho(successRoute.body, "success route body");

await assertLiveFetchRedirectRejected();
await assertLiveFetchMissingContentTypeRejected();
await assertLiveFetchContentLengthLimitBeforeRead();
await assertLiveFetchStreamLimit();
await assertLiveFetchBoundedSuccess();

const crossSiteResponse = await routeModule.POST(
  new Request("http://localhost:3000/api/research-source/intake", {
    method: "POST",
    headers: {
      host: "localhost:3000",
      origin: "https://example.invalid",
      "sec-fetch-site": "cross-site",
      "content-type": "application/json",
    },
    body: JSON.stringify({ route_version: routeVersion, scope, input: fixture.safe_url_request_example }),
  }),
);
const crossSiteBody = await crossSiteResponse.json();
assert.equal(crossSiteResponse.status, 403);
assert.equal(crossSiteBody.error_code, "same_origin_required");

const invalidJsonResponse = await routeModule.POST(
  new Request("http://localhost:3000/api/research-source/intake", {
    method: "POST",
    headers: sameOriginHeaders(),
    body: "{",
  }),
);
const invalidJsonBody = await invalidJsonResponse.json();
assert.equal(invalidJsonResponse.status, 400);
assert.equal(invalidJsonBody.error_code, "invalid_json_body");

const display = sanitizeRuntime.redactSourceLocatorForDisplayV01({
  input_kind: "url",
  source_locator: fixture.safe_url_request_example.source_locator,
});
assert.match(display, /^url-host:example\.invalid#[a-f0-9]{12}$/);
assert.ok(
  sanitizeRuntime.isPublicSafeSourceLocatorV01({
    input_kind: "url",
    source_locator: fixture.safe_url_request_example.source_locator,
  }),
);
assert.equal(
  sanitizeRuntime.isPublicSafeSourceLocatorV01({ input_kind: "url", source_locator: "SAFE_MARKER_PRIVATE_URL" }),
  false,
);

assertAuthorityBoundary(
  intakeRuntime.createBoundedSourceIntakeRuntimeAuthorityBoundaryV01(),
  "runtime authority boundary",
);
assertAuthorityBoundary(fixture.authority_boundary_sample, "fixture authority boundary");
assertFixtureSafety();
assertPackageScript();
assertNoForbiddenFilesAdded();
runExistingSmoke("smoke:bounded-source-intake-runtime-v0-1");
runExistingSmoke("smoke:bounded-source-intake-runtime-contract-v0-1");
runExistingSmoke("smoke:research-candidate-review-memory-db-ui-runtime-v0-1");

console.log(
  JSON.stringify(
    {
      smoke: "bounded-source-intake-runtime-completion-v0-1",
      final_status: "pass",
      runtime_version: runtimeVersion,
      route_version: routeVersion,
      scope,
      safe_url_status: safeUrlResult.status,
      failure_to_gap_status: failureRoute.body.result.status,
      source_ref_id: safeUrlResult.source_ref_id,
    },
    null,
    2,
  ),
);

function assertFixtureVersions() {
  assert.equal(fixture.fixture_version, "bounded_source_intake_runtime_completion.sample.v0.1");
  assert.equal(fixture.runtime_version, runtimeVersion);
  assert.equal(fixture.request_version, requestVersion);
  assert.equal(fixture.result_version, resultVersion);
  assert.equal(fixture.route_version, routeVersion);
  assert.equal(fixture.scope, scope);
  for (const key of requiredFixtureKeys) {
    assert.ok(key in fixture, `fixture must include ${key}`);
  }
}

function assertDocsAndIndexCoverage() {
  for (const expected of [
    "This slice closes the original Phase 3.2 bounded source intake runtime gap.",
    "The earlier deterministic envelope helper remains compatible but was not the full runtime completion.",
    "This slice implements explicit POST runtime only.",
    "This slice accepts only `user_provided` sources.",
    "This slice does not crawl.",
    "This slice does not perform background fetch.",
    "This slice does not perform automatic web discovery.",
    "This slice does not perform provider extraction.",
    "This slice does not write retrieval indexes.",
    "This slice does not create proof/evidence.",
    "This slice does not write claim/evidence records.",
    "This slice does not promote Perspective.",
    "This slice does not write/apply durable Perspective state.",
    "This slice does not write Formation Receipts.",
    "This slice does not execute Git Ledger export runtime.",
    "This slice does not execute Git or call GitHub.",
    "This slice does not execute Codex.",
    "This slice does not product-write.",
    "This slice does not allocate product IDs.",
    "Product-write remains parked by #686.",
    "Raw source body is non-persistent by default.",
    "Source refs are lineage pointers, not proof.",
    "Bounded source summary is not truth.",
    "Failed fetch creates gap metadata, not hallucinated summary.",
    "If live fetch is explicitly enabled, it does not follow redirects automatically.",
    "Content type is checked before the body is read.",
    "When `content-length` is present, it is checked before the body is read.",
    "The body stream is read incrementally and is stopped/aborted once",
    "Missing content type also returns `unsupported_content_type`.",
    "Smoke/CI pass is not truth.",
    "The roadmap guide is not SSOT.",
  ]) {
    assert.ok(docs.includes(expected), `docs must include: ${expected}`);
  }
  assert.ok(indexDoc.includes("BOUNDED_SOURCE_INTAKE_RUNTIME_COMPLETION_V0_1.md"));
  assert.ok(indexDoc.includes("bounded_source_intake_runtime_completion_v0_1"));
  assert.ok(indexDoc.includes("Product-write remains parked by #686"));
}

function assertRoadmapCoverage() {
  for (const expected of [
    "bounded_source_intake_runtime_v0_1",
    "lib/research-source/intake-runtime.ts",
    "app/api/research-source/intake/route.ts",
    "explicit POST only",
    "max size enforcement",
    "timeout enforcement",
    "content-type allowlist",
    "mock/fake fetch",
  ]) {
    assert.ok(roadmap.includes(expected), `roadmap must include ${expected}`);
  }
}

function assertLibraryExports() {
  for (const exportedName of [
    "validateBoundedSourceIntakeRuntimeRequestV01",
    "runBoundedSourceIntakeRuntimeV01",
    "buildBoundedSourceRefMetadataV01",
    "createBoundedSourceIntakeRuntimeAuthorityBoundaryV01",
    "createBoundedSourceRefIdV01",
    "classifyBoundedSourceIntakeFailureV01",
  ]) {
    assert.equal(typeof intakeRuntime[exportedName], "function", `${exportedName} export`);
    assert.match(
      intakeRuntimeSource,
      new RegExp(`export\\s+(async\\s+)?function\\s+${exportedName}\\b`),
    );
  }
  for (const exportedName of [
    "fetchBoundedSourceV01",
    "createMockBoundedSourceFetcherV01",
    "enforceBoundedSourceFetchLimitsV01",
  ]) {
    assert.equal(typeof fetchRuntime[exportedName], "function", `${exportedName} export`);
    assert.match(
      fetchSource,
      new RegExp(`export\\s+(async\\s+)?function\\s+${exportedName}\\b`),
    );
  }
  for (const exportedName of [
    "sanitizeSourceLocatorV01",
    "redactSourceLocatorForDisplayV01",
    "isPublicSafeSourceLocatorV01",
    "createPublicSafeSourceLocatorFingerprintV01",
  ]) {
    assert.equal(typeof sanitizeRuntime[exportedName], "function", `${exportedName} export`);
    assert.match(
      sanitizeSource,
      new RegExp(`export\\s+(async\\s+)?function\\s+${exportedName}\\b`),
    );
  }
}

function assertBoundedLiveFetchSource() {
  assert.ok(fetchSource.includes('redirect: "manual"'), "live fetch must use manual redirects");
  assert.ok(fetchSource.includes("redirect_not_followed"), "live fetch must reject redirects");
  assert.ok(fetchSource.includes("content_length_too_large"), "live fetch must check content-length");
  assert.ok(fetchSource.includes("readBoundedResponseBody"), "live fetch must stream bounded body reads");
  assert.ok(fetchSource.includes("stream_size_limit_exceeded"), "live fetch must stop oversized streams");
  assert.ok(fetchSource.includes("missing_content_type"), "live fetch must fail closed on missing content type");
  assert.ok(!fetchSource.includes(".arrayBuffer()"), "live fetch must not use arrayBuffer");
  assert.ok(!fetchSource.includes('redirect: "follow"'), "live fetch must not follow redirects");
}

function assertRouteShape() {
  assert.equal(typeof routeModule.POST, "function", "route exports POST");
  assert.equal(
    typeof routeModule.createBoundedSourceIntakeRuntimeCompletionPostHandlerV01,
    "function",
  );
  assert.ok(routeSource.includes("requestHasSameOriginBoundary"));
  assert.ok(routeSource.includes("same_origin_required"));
  assert.ok(routeSource.includes("invalid_json_body"));
  assert.ok(routeSource.includes("runBoundedSourceIntakeRuntimeV01"));
  assert.ok(!/export\s+(async\s+)?function\s+GET\b/.test(routeSource), "route must not export GET");
}

async function postWithFetcher(input, mockFixture) {
  const fetcher = fetchRuntime.createMockBoundedSourceFetcherV01([
    {
      ...mockFixture,
      source_ref_id: intakeRuntime.createBoundedSourceRefIdV01(input),
    },
  ]);
  const handler = routeModule.createBoundedSourceIntakeRuntimeCompletionPostHandlerV01({
    fetcher,
  });
  const response = await handler(
    new Request("http://localhost:3000/api/research-source/intake", {
      method: "POST",
      headers: sameOriginHeaders(),
      body: JSON.stringify({ route_version: routeVersion, scope, input }),
    }),
  );
  const body = await response.json();
  assertNoUnsafeMarkerEcho(body, "route response");
  return { response, body };
}

function sameOriginHeaders() {
  return {
    host: "localhost:3000",
    origin: "http://localhost:3000",
    "sec-fetch-site": "same-origin",
    "content-type": "application/json",
  };
}

async function assertLiveFetchRedirectRejected() {
  let bodyRead = false;
  let observedRedirectMode = null;
  const result = await withStubbedFetch(async (_sourceLocator, init) => {
    observedRedirectMode = init?.redirect ?? null;
    return fakeFetchResponse({
      status: fixture.live_fetch_redirect_blocked_example.http_status,
      headers: {
        location: "https://example.invalid/bounded-source-intake/redirect-target",
      },
      body: new ReadableStream(),
      onBodyAccess: () => {
        bodyRead = true;
      },
    });
  }, () =>
    fetchRuntime.fetchBoundedSourceV01(createLiveFetchRequest(fixture.safe_url_request_example), {
      allow_live_fetch: true,
    }),
  );

  assert.equal(observedRedirectMode, "manual", "live fetch must not follow redirects");
  assert.equal(result.status, fixture.live_fetch_redirect_blocked_example.status);
  assert.equal(result.failure_kind, fixture.live_fetch_redirect_blocked_example.failure_kind);
  assert.ok(result.reason_codes.includes("redirect_not_followed"));
  assert.equal(bodyRead, false, "redirect body must not be read");
}

async function assertLiveFetchMissingContentTypeRejected() {
  let bodyRead = false;
  const result = await withStubbedFetch(async () => {
    return fakeFetchResponse({
      status: 200,
      body: new ReadableStream({
        pull(controller) {
          controller.close();
        },
      }),
      onBodyAccess: () => {
        bodyRead = true;
      },
    });
  }, () =>
    fetchRuntime.fetchBoundedSourceV01(createLiveFetchRequest(fixture.safe_url_request_example), {
      allow_live_fetch: true,
    }),
  );

  assert.equal(result.status, "unsupported_content_type");
  assert.equal(result.failure_kind, "unsupported_content_type");
  assert.ok(result.reason_codes.includes("missing_content_type"));
  assert.equal(bodyRead, false, "missing content-type body must not be read");
}

async function assertLiveFetchContentLengthLimitBeforeRead() {
  let bodyRead = false;
  const result = await withStubbedFetch(async () => {
    return fakeFetchResponse({
      status: fixture.live_fetch_content_length_too_large_example.http_status,
      headers: {
        "content-type": fixture.live_fetch_content_length_too_large_example.content_type,
        "content-length": String(fixture.live_fetch_content_length_too_large_example.byte_length),
      },
      body: new ReadableStream({
        pull(controller) {
          controller.enqueue(new Uint8Array(16));
          controller.close();
        },
      }),
      onBodyAccess: () => {
        bodyRead = true;
      },
    });
  }, () =>
    fetchRuntime.fetchBoundedSourceV01(
      createLiveFetchRequest(fixture.safe_url_request_example, { size_limit_bytes: 128 }),
      { allow_live_fetch: true },
    ),
  );

  assert.equal(result.status, fixture.live_fetch_content_length_too_large_example.status);
  assert.equal(result.failure_kind, fixture.live_fetch_content_length_too_large_example.failure_kind);
  assert.ok(result.reason_codes.includes("content_length_too_large"));
  assert.equal(bodyRead, false, "content-length oversized body must not be read");
}

async function assertLiveFetchStreamLimit() {
  let chunkReads = 0;
  const result = await withStubbedFetch(async () => {
    return new Response(
      new ReadableStream({
        pull(controller) {
          chunkReads += 1;
          if (chunkReads <= 3) {
            controller.enqueue(new Uint8Array(64));
            return;
          }
          controller.close();
        },
      }),
      {
        status: fixture.live_fetch_stream_too_large_example.http_status,
        headers: {
          "content-type": fixture.live_fetch_stream_too_large_example.content_type,
        },
      },
    );
  }, () =>
    fetchRuntime.fetchBoundedSourceV01(
      createLiveFetchRequest(fixture.safe_url_request_example, { size_limit_bytes: 128 }),
      { allow_live_fetch: true },
    ),
  );

  assert.equal(result.status, fixture.live_fetch_stream_too_large_example.status);
  assert.equal(result.failure_kind, fixture.live_fetch_stream_too_large_example.failure_kind);
  assert.ok(result.reason_codes.includes("stream_size_limit_exceeded"));
  assert.equal(result.bounded_summary, undefined);
  assert.ok(chunkReads >= 3, "stream should be read only until the limit is exceeded");
  assertNoRawBodyEcho(result, "stream-too-large live result");
}

async function assertLiveFetchBoundedSuccess() {
  const rawBodyText = "public bounded body that is never returned";
  const result = await withStubbedFetch(async () => {
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(rawBodyText));
          controller.close();
        },
      }),
      {
        status: 200,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "content-length": String(new TextEncoder().encode(rawBodyText).byteLength),
        },
      },
    );
  }, () =>
    fetchRuntime.fetchBoundedSourceV01(
      createLiveFetchRequest(fixture.safe_url_request_example, { size_limit_bytes: 256 }),
      { allow_live_fetch: true },
    ),
  );

  assert.equal(result.status, "ok");
  assert.equal(result.failure_kind, undefined);
  assert.equal(
    result.bounded_summary,
    `Bounded fetch completed for ${createLiveFetchRequest(fixture.safe_url_request_example).source_locator_ref}.`,
  );
  assert.ok(!JSON.stringify(result).includes(rawBodyText), "live success must not echo raw body");
  assertNoRawBodyEcho(result, "bounded live success result");
}

function fakeFetchResponse({ status, headers = {}, body = null, onBodyAccess }) {
  const normalizedHeaders = new Map(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), String(value)]),
  );
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: {
      get(name) {
        return normalizedHeaders.get(String(name).toLowerCase()) ?? null;
      },
    },
    get body() {
      onBodyAccess?.();
      return body;
    },
  };
}

async function withStubbedFetch(stubFetch, run) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = stubFetch;
  try {
    return await run();
  } finally {
    globalThis.fetch = originalFetch;
  }
}

function createLiveFetchRequest(input, limitOverrides = {}) {
  const sanitized = sanitizeRuntime.sanitizeSourceLocatorV01({
    input_kind: input.input_kind,
    source_locator: input.source_locator,
  });
  assert.equal(sanitized.status, "ok", "live fetch test source locator must sanitize");
  return {
    input_kind: input.input_kind,
    source_locator: input.source_locator,
    source_locator_ref: sanitized.source_locator_ref,
    source_ref_id: intakeRuntime.createBoundedSourceRefIdV01(input),
    limits: {
      size_limit_bytes: input.size_limit_bytes ?? 2048,
      timeout_ms: input.timeout_ms ?? 500,
      content_type_allowlist: input.content_type_allowlist ?? [
        "text/plain",
        "text/html",
        "application/json",
      ],
      ...limitOverrides,
    },
  };
}

function failIfFetched() {
  throw new Error("symbolic_input_should_not_fetch");
}

function assertAuthorityBoundary(boundary, label) {
  for (const field of authorityTrueFields) {
    assert.equal(boundary?.[field], true, `${label} ${field} true`);
  }
  for (const field of authorityFalseFields) {
    assert.equal(boundary?.[field], false, `${label} ${field} false`);
  }
}

function assertNoRawBodyEcho(value, label) {
  const serialized = JSON.stringify(value);
  assert.ok(!serialized.includes("body_text"), `${label} must not include body_text`);
  assert.ok(!serialized.includes("raw source body"), `${label} must not echo raw source body`);
  assert.ok(!serialized.includes("RAW_SOURCE_BODY"), `${label} must not echo raw body marker`);
}

function assertNoUnsafeMarkerEcho(value, label) {
  const serialized = JSON.stringify(value);
  for (const marker of [
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
  ]) {
    assert.ok(!serialized.includes(marker), `${label} must not echo ${marker}`);
  }
}

function assertFixtureSafety() {
  const markers = [
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
  ];
  for (const marker of markers) {
    const occurrences = pathsContaining(fixture, marker);
    for (const path of occurrences) {
      assert.match(path, /^blocked_/, `${marker} may appear only in blocked examples, got ${path}`);
    }
  }
  assert.ok(!/\/Users\/|\/home\/|file:\/\/|sk-[A-Za-z0-9]|ghp_[A-Za-z0-9]/.test(fixtureText));
  assert.ok(!/\b(thread|run|session)_[A-Za-z0-9_-]{8,}/.test(fixtureText));
}

function assertPackageScript() {
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
}

function assertNoForbiddenFilesAdded() {
  const changedFiles = changedFilesFromGit();
  for (const filePath of changedFiles) {
    assert.ok(!filePath.startsWith("components/"), `${filePath} must not add UI`);
    assert.ok(!filePath.startsWith("lib/db/"), `${filePath} must not add DB schema`);
    assert.ok(
      !filePath.includes("provider") || isProviderExtractionRuntimeCompletionFile(filePath),
      `${filePath} must not add provider runtime outside provider extraction runtime completion`,
    );
    assert.ok(!filePath.includes("retrieval-index-write"), `${filePath} must not add retrieval indexing`);
    assert.ok(!filePath.includes("github"), `${filePath} must not add GitHub runtime`);
    assert.ok(!filePath.includes("codex-execution"), `${filePath} must not add Codex runtime`);
    assert.ok(!filePath.includes("product-write"), `${filePath} must not add product-write runtime`);
    assert.ok(!filePath.includes("product-id"), `${filePath} must not add product ID allocation`);
  }
}

function isProviderExtractionRuntimeCompletionFile(filePath) {
  if (
    filePath === "app/api/research-candidate-review/provider-extraction/" ||
    filePath === "lib/research-extraction/"
  ) {
    return true;
  }
  return [
    "docs/PROVIDER_ASSISTED_EXTRACTION_RUNTIME_COMPLETION_V0_1.md",
    "lib/research-extraction/provider-extract-candidates.ts",
    "lib/research-extraction/normalize-provider-output.ts",
    "lib/research-extraction/provider-boundary.ts",
    "app/api/research-candidate-review/provider-extraction/route.ts",
    "fixtures/provider-assisted-extraction-runtime-completion.sample.v0.1.json",
    "scripts/smoke-provider-assisted-extraction-runtime-completion-v0-1.mjs",
  ].includes(filePath);
}

function changedFilesFromGit() {
  const files = new Set();
  for (const args of [
    ["diff", "--name-only", "main...HEAD"],
    ["diff", "--name-only", "main"],
  ]) {
    try {
      for (const line of execFileSync("git", args, { encoding: "utf8" }).split("\n")) {
        if (line.trim()) files.add(line.trim());
      }
    } catch {
      // Keep smoke portable when a base ref is unavailable.
    }
  }
  try {
    for (const line of execFileSync("git", ["status", "--short"], { encoding: "utf8" }).split("\n")) {
      const filePath = line.slice(3).trim();
      if (filePath) files.add(filePath);
    }
  } catch {
    // Ignore git status unavailability in packaged smoke contexts.
  }
  return Array.from(files);
}

function runExistingSmoke(scriptName) {
  execFileSync("npm", ["run", scriptName], { stdio: "inherit" });
}

function pathsContaining(value, needle, path = "") {
  const matches = [];
  if (typeof value === "string") {
    if (value.includes(needle)) matches.push(path);
    return matches;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      matches.push(...pathsContaining(item, needle, `${path}[${index}]`));
    });
    return matches;
  }
  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      matches.push(...pathsContaining(nested, needle, path ? `${path}.${key}` : key));
    }
  }
  return matches;
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}
