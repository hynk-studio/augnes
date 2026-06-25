import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const docPath = "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_ROUTES_V0_1.md";
const fixturePath = "fixtures/research-candidate-review.memory-routes.sample.v0.1.json";
const routePath = "app/api/research-candidate/review-memory/route.ts";
const routeContractPath = "lib/research-candidate-review/review-memory-route-contract.ts";
const storeHelperPath = "lib/research-candidate-review/review-memory-store.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const routeVersion = "research_candidate_review_memory_routes.v0.1";
const storeVersion = "research_candidate_review_memory_store.v0.1";
const packageScriptName = "smoke:research-candidate-review-memory-routes-v0-1";
const packageScriptValue =
  "node scripts/smoke-research-candidate-review-memory-routes-v0-1.mjs";

const forbiddenAuthorityFields = [
  "ui_added_now",
  "db_migration_added_now",
  "db_query_or_write_now",
  "provider_openai_call_now",
  "source_fetch_now",
  "retrieval_rag_execution_now",
  "source_of_truth",
  "proof_or_evidence_record",
  "perspective_promotion",
  "durable_perspective_state",
  "work_mutation",
  "codex_execution_authority",
  "github_automation_authority",
  "git_ledger_export_authority",
  "product_write_authority",
  "product_id_allocation_authority",
];

const forbiddenRouteSourceSnippets = [
  "new OpenAI",
  "fetch(",
  "XMLHttpRequest",
  "WebSocket",
  "better-sqlite3",
  "sqlite",
  "db.prepare",
  "child_process",
  "exec(",
  "spawn(",
  "createPullRequest",
  "createBranch",
  "git commit",
  "product write implementation",
];

for (const filePath of [
  docPath,
  fixturePath,
  routePath,
  routeContractPath,
  storeHelperPath,
  packagePath,
  indexPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const doc = readFile(docPath);
const fixture = readJson(fixturePath);
const routeSource = readFile(routePath);
const routeContractSource = readFile(routeContractPath);
const packageJson = readJson(packagePath);
const indexDoc = readFile(indexPath);
const routeContract = await import(pathToFileURL(routeContractPath).href);

assert.equal(fixture.fixture_version, "research_candidate_review_memory_routes.sample.v0.1");
assert.equal(fixture.route_version, routeVersion);
assert.equal(fixture.store_version, storeVersion);
assert.equal(fixture.scope, "project:augnes");
assert.equal(fixture.status, "route_boundary_only");

assertRouteExports();
assertRouteContractExports();
assertRouteUsesStoreHelper();
assertRouteSourceBoundary();
assertRouteContractValidation();
assertAuthorityBoundary(routeContract.getReviewMemoryRouteAuthorityBoundary(), "route");
assertRouteHandlerStaticBoundaries();
assertResponseFixtureSafety();
assertDocCoverage();
assertNoForbiddenPositiveAuthorityGrants(doc);
assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
assertIndexCoverage();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-review-memory-routes-v0-1",
      final_status: "pass",
      route_version: fixture.route_version,
      store_version: fixture.store_version,
      status: fixture.status,
      sample_requests: fixture.sample_requests.length,
      expected_responses: fixture.expected_responses.length,
    },
    null,
    2,
  ),
);

function assertRouteExports() {
  assert.ok(routeSource.includes("export async function GET"), "route source must export GET");
  assert.ok(routeSource.includes("export async function POST"), "route source must export POST");
}

function assertRouteContractExports() {
  for (const exportedName of [
    "getReviewMemoryRouteAuthorityBoundary",
    "validateReviewMemoryRouteRequest",
    "sanitizeReviewMemoryRouteError",
  ]) {
    assert.equal(
      typeof routeContract[exportedName],
      "function",
      `route contract must export ${exportedName}`,
    );
    assert.ok(routeContractSource.includes(`export function ${exportedName}`));
  }
}

function assertRouteUsesStoreHelper() {
  for (const helperName of [
    "readResearchCandidateReviewMemoryStoreFile",
    "writeResearchCandidateReviewMemoryStoreFile",
    "createEmptyResearchCandidateReviewMemoryStoreSnapshot",
    "upsertResearchCandidateReviewMemoryRecord",
    "discardResearchCandidateReviewMemoryRecord",
    "supersedeResearchCandidateReviewMemoryRecord",
  ]) {
    assert.ok(routeSource.includes(helperName), `route must call ${helperName}`);
  }
}

function assertRouteSourceBoundary() {
  for (const forbiddenText of forbiddenRouteSourceSnippets) {
    assert.ok(!routeSource.includes(forbiddenText), `route must not contain ${forbiddenText}`);
  }
}

function assertRouteContractValidation() {
  const unsafePathExamples = [
    ["/Users", "hynk", "private.json"].join("/"),
    ["/home", "hynk", "private.json"].join("/"),
    "file:///tmp/private.json",
    "https://private.example.com/store.json",
    "../private.json",
    "store/../private.json",
    `tmp/research-candidate-review-memory/store.json${String.fromCharCode(0)}`,
    "sk-FAKE_UNREDACTED",
    "ghp_FAKE_UNREDACTED",
  ];
  for (const unsafePath of unsafePathExamples) {
    assert.equal(
      routeContract.isSafeReviewMemoryRouteStoreFilePath(unsafePath),
      false,
      `${unsafePath} must be rejected`,
    );
  }
  for (const safePath of [
    "tmp/research-candidate-review-memory/store.json",
    ".tmp/research-candidate-review-memory/store.json",
  ]) {
    assert.equal(
      routeContract.isSafeReviewMemoryRouteStoreFilePath(safePath),
      true,
      `${safePath} must be accepted`,
    );
  }

  const createRequest = fixture.sample_requests.find(
    (request) => request.action === "create_empty_snapshot",
  );
  assert.deepEqual(routeContract.validateReviewMemoryRouteRequest(createRequest).failure_codes, []);
  assertValidationFails(
    { ...createRequest, as_of: undefined },
    "missing_as_of",
    "create_empty_snapshot requires as_of",
  );
  assertValidationFails(
    {
      route_version: routeVersion,
      scope: "project:augnes",
      action: "upsert_record",
      store_file_path: "tmp/research-candidate-review-memory/store.json",
    },
    "missing_record",
    "upsert_record requires record",
  );
  assertValidationFails(
    {
      route_version: routeVersion,
      scope: "project:augnes",
      action: "discard_record",
      store_file_path: "tmp/research-candidate-review-memory/store.json",
    },
    "missing_discard",
    "discard_record requires discard",
  );
  assertValidationFails(
    {
      route_version: routeVersion,
      scope: "project:augnes",
      action: "supersede_record",
      store_file_path: "tmp/research-candidate-review-memory/store.json",
    },
    "missing_supersede",
    "supersede_record requires supersede",
  );
  assertValidationFails(
    {
      route_version: routeVersion,
      scope: "project:augnes",
      action: "unknown_action",
      store_file_path: "tmp/research-candidate-review-memory/store.json",
    },
    "invalid_action",
    "invalid action is rejected",
  );
  assertNestedPayloadSafety();
}

function assertRouteHandlerStaticBoundaries() {
  for (const requiredText of [
    "requestHasSameOriginBoundary",
    "isLocalTestHost",
    "same_origin_required",
    "sec-fetch-site",
    "same-origin",
    "same-site",
    "none",
    "origin",
    "host",
    "unsafe_store_file_path",
    "store_file_missing",
    "invalid_json_body",
    "invalid_route_request",
    "errorResponse",
    "okResponse",
    "sanitizeReviewMemoryRouteError",
  ]) {
    assert.ok(routeSource.includes(requiredText), `route source must include ${requiredText}`);
  }
  assert.ok(
    routeSource.includes("return isLocalTestHost(host)"),
    "Origin-absent requests must require local/test host",
  );
  assert.ok(
    !routeSource.includes("if (!origin) return true"),
    "Origin-absent requests must not be unconditionally allowed",
  );
  assert.match(routeSource, /localhost\|127\\\.0\\\.0\\\.1\|0\\\.0\\\.0\\\.0/);
  assert.match(routeSource, /\\\[::1\\\]/);
  assert.ok(!routeSource.includes("error.stack"), "route must not expose raw error stack");
  assert.ok(!routeSource.includes("error.message"), "route must not expose raw error message");
  for (const response of fixture.expected_responses) {
    assertAuthorityBoundary(response.authority_boundary, `fixture:${response.status}`);
  }
}

function assertResponseFixtureSafety() {
  const responseText = JSON.stringify(fixture.expected_responses);
  for (const forbiddenText of [
    "/Users/",
    "/home/",
    "file://",
    "Error:",
    "stack",
    "raw source body",
    "raw provider output",
    "hidden reasoning",
    "sk-",
    "ghp_",
  ]) {
    assert.ok(!responseText.includes(forbiddenText), `response fixture must not include ${forbiddenText}`);
  }
  assert.ok(
    fixture.expected_responses.some((response) => response.status === "ok" && response.snapshot),
    "expected responses must include ok snapshot",
  );
  assert.ok(
    fixture.expected_responses.some((response) => response.status === "error" && response.error_code),
    "expected responses must include error response",
  );
}

function assertDocCoverage() {
  for (const requiredPhrase of [
    "Research Candidate Review Memory Routes are route-boundary-only.",
    "It implements Phase 2.3 from the integrated development roadmap guide v0.2.",
    "It follows the #769 Review Memory Contract and #770 Review Memory Store.",
    "It does not add UI.",
    "It does not add DB migrations.",
    "It does not query or write DB.",
    "It uses only the local store helper.",
    "It requires same-origin or local/test-safe requests.",
    "Origin-absent requests are allowed only for local/test-safe `Host` values.",
    "Non-local Origin-absent requests are rejected.",
    "Route request validation recursively rejects raw/private markers in nested action payloads.",
    "Nested discard, record, and supersede payloads must remain public-safe before store helper execution.",
    "Error responses must not echo raw unsafe payload strings.",
    "It does not choose a default private path.",
    "It does not expose private local paths in responses.",
    "It does not store raw private payloads.",
    "It does not store raw source bodies.",
    "It does not store raw provider outputs.",
    "It does not store raw conversations.",
    "It does not store hidden reasoning.",
    "It does not call provider/OpenAI.",
    "It does not fetch sources.",
    "It does not execute retrieval/RAG.",
    "It does not create proof/evidence.",
    "It does not promote Perspective.",
    "It does not mutate durable Perspective state.",
    "It does not mutate work.",
    "It does not execute Codex.",
    "It does not call GitHub.",
    "It does not export Git Ledger packets.",
    "It does not write product records.",
    "Product-write remains parked by #686.",
    "Review memory is not truth.",
    "Candidate memory is not Perspective state.",
    "Discard is not deletion.",
    "Supersede preserves lineage.",
    "Source refs are lineage pointers, not proof.",
    "Source refs must be public-safe symbolic refs.",
    "integrated development roadmap guide v0.2",
    "background inputs already integrated into the roadmap guide",
  ]) {
    assert.ok(doc.includes(requiredPhrase), `doc must include ${requiredPhrase}`);
  }
}

function assertNoForbiddenPositiveAuthorityGrants(source) {
  for (const field of forbiddenAuthorityFields) {
    assert.ok(!source.includes(`${field}: true`), `doc must not grant ${field}`);
  }
}

function assertIndexCoverage() {
  const block = extractIndexBlock(indexDoc, "Research Candidate Review Memory Routes v0.1");
  for (const requiredText of [
    docPath,
    fixturePath,
    routePath,
    routeContractPath,
    storeHelperPath,
    "scripts/smoke-research-candidate-review-memory-routes-v0-1.mjs",
    "Phase 2.3",
    "integrated roadmap guide v0.2",
    "route-boundary-only",
  ]) {
    assert.ok(block.includes(requiredText), `index block must include ${requiredText}`);
  }
  for (const requiredBoundaryText of [
    "does not implement UI",
    "DB migrations",
    "provider calls",
    "source fetch",
    "retrieval",
    "proof/evidence",
    "promotion",
    "GitHub automation",
    "Git Ledger",
    "product write",
  ]) {
    assert.ok(block.includes(requiredBoundaryText), `index block must include ${requiredBoundaryText}`);
  }
  for (const forbiddenPattern of [
    /UI was added/i,
    /DB migration was added/i,
    /provider runtime was added/i,
    /retrieval runtime was added/i,
    /promotion was added/i,
    /Codex execution was added/i,
    /GitHub automation was added/i,
    /Git Ledger export was added/i,
    /product write was added/i,
    /product ID allocation was added/i,
  ]) {
    assert.doesNotMatch(block, forbiddenPattern);
  }
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(boundary?.route_boundary_only, true, `${label} route_boundary_only true`);
  assert.equal(boundary?.same_origin_required, true, `${label} same_origin_required true`);
  assert.equal(boundary?.local_store_helper_only, true, `${label} local_store_helper_only true`);
  for (const field of forbiddenAuthorityFields) {
    assert.equal(boundary?.[field], false, `${label} ${field} false`);
  }
}

function assertValidationFails(request, failureCode, label) {
  const validation = routeContract.validateReviewMemoryRouteRequest(request);
  assert.equal(validation.passed, false, label);
  assert.ok(validation.failure_codes.includes(failureCode), `${label}: ${failureCode}`);
}

function assertNestedPayloadSafety() {
  for (const request of fixture.sample_requests.slice(0, 4)) {
    assert.deepEqual(
      routeContract.validateReviewMemoryRouteRequest(request).failure_codes,
      [],
      `safe fixture request ${request.action} validates`,
    );
  }

  const createRequest = fixture.sample_requests.find(
    (request) => request.action === "create_empty_snapshot",
  );
  const upsertRequest = fixture.sample_requests.find(
    (request) => request.action === "upsert_record",
  );
  const discardRequest = fixture.sample_requests.find(
    (request) => request.action === "discard_record",
  );
  const supersedeRequest = fixture.sample_requests.find(
    (request) => request.action === "supersede_record",
  );

  assertNestedValidationFails(
    {
      ...deepClone(discardRequest),
      discard: {
        ...deepClone(discardRequest.discard),
        discard_reason: "hidden reasoning: example",
      },
    },
    "unsafe_nested_field:discard.discard_reason",
    "discard hidden reasoning is rejected",
  );
  assertNestedValidationFails(
    {
      ...deepClone(discardRequest),
      discard: {
        ...deepClone(discardRequest.discard),
        discard_reason: "raw source body: example",
      },
    },
    "unsafe_nested_field:discard.discard_reason",
    "discard raw source body is rejected",
  );
  assertNestedValidationFails(
    {
      ...deepClone(upsertRequest),
      record: {
        ...deepClone(upsertRequest.record),
        candidate_ref: "https://private.example.com/candidate",
      },
    },
    "unsafe_nested_field:record.candidate_ref",
    "record private candidate ref is rejected",
  );
  assertNestedValidationFails(
    {
      ...deepClone(supersedeRequest),
      supersede: {
        ...deepClone(supersedeRequest.supersede),
        superseding_record: {
          ...deepClone(supersedeRequest.supersede.superseding_record),
          bounded_summary: "raw provider output: example",
        },
      },
    },
    "unsafe_nested_field:supersede.superseding_record.bounded_summary",
    "supersede raw provider output is rejected",
  );
  assertNestedValidationFails(
    {
      ...deepClone(upsertRequest),
      record: {
        ...deepClone(upsertRequest.record),
        related_record_refs: [["file://", "/Users", "hynk", "private.txt"].join("")],
      },
    },
    "unsafe_nested_field:record.related_record_refs",
    "related private file refs are rejected",
  );
  assertNestedValidationFails(
    {
      ...deepClone(createRequest),
      action: "product write execution",
    },
    "unsafe_top_level_field:action",
    "unsafe action wording is rejected",
  );

  const safeBoundaryNoteRequest = {
    ...deepClone(upsertRequest),
    record: {
      boundary_notes: ["Product-write remains parked by #686."],
      reason_codes: ["source_ref_present", "product_write_denied"],
      record_version: "research_candidate_review_memory_record.v0.1",
      scope: "project:augnes",
      status: "contract_only",
    },
  };
  assert.deepEqual(
    routeContract.validateReviewMemoryRouteRequest(safeBoundaryNoteRequest).failure_codes,
    [],
    "safe controlled literals and parked product-write boundary note remain allowed",
  );
}

function assertNestedValidationFails(request, failureCode, label) {
  const validation = routeContract.validateReviewMemoryRouteRequest(request);
  assert.equal(validation.passed, false, label);
  assert.ok(validation.failure_codes.includes(failureCode), `${label}: ${failureCode}`);
  assertFailureCodesPublicSafe(validation.failure_codes, label);
}

function assertFailureCodesPublicSafe(failureCodes, label) {
  const codeText = failureCodes.join(" ");
  for (const forbiddenText of [
    "/Users/",
    "/home/",
    "file://",
    "http://",
    "https://",
    "hidden reasoning",
    "raw source body",
    "raw provider output",
    "raw conversation",
    "raw candidate payload",
    "sk-",
    "ghp_",
    "OPENAI_API_KEY",
    "GITHUB_TOKEN",
    "password:",
    "secret:",
    "private key",
    "product write execution",
  ]) {
    assert.ok(!codeText.includes(forbiddenText), `${label}: failure codes must not echo ${forbiddenText}`);
  }
}

function extractIndexBlock(source, heading) {
  const start = source.indexOf(`- ${heading}:`);
  assert.ok(start >= 0, `index block for ${heading} must exist`);
  const next = source.indexOf("\n- ", start + 1);
  return next >= 0 ? source.slice(start, next) : source.slice(start);
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}
