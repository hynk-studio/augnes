import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const docPath = "docs/BOUNDED_SOURCE_INTAKE_RUNTIME_CONTRACT_V0_1.md";
const fixturePath = "fixtures/bounded-source-intake-runtime-contract.sample.v0.1.json";
const typePath = "types/bounded-source-intake-runtime-contract.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const smokePath = "scripts/smoke-bounded-source-intake-runtime-contract-v0-1.mjs";
const contractVersion = "bounded_source_intake_runtime_contract.v0.1";
const requestVersion = "bounded_source_intake_request.v0.1";
const sourceDescriptorVersion = "bounded_source_intake_source_descriptor.v0.1";
const resultVersion = "bounded_source_intake_result_envelope.v0.1";
const bundleVersion = "bounded_source_intake_contract_bundle.v0.1";
const scope = "project:augnes";
const status = "contract_only";
const packageScriptName = "smoke:bounded-source-intake-runtime-contract-v0-1";
const packageScriptValue = "node scripts/smoke-bounded-source-intake-runtime-contract-v0-1.mjs";

const sourceKinds = [
  "manual_text_summary",
  "public_url_ref",
  "repository_file_ref",
  "uploaded_file_ref",
  "operator_note_ref",
  "review_memory_ref",
  "unknown",
];

const requestStatuses = [
  "candidate_only",
  "needs_operator_review",
  "blocked_private_or_raw_payload",
  "blocked_unsupported_source_kind",
  "accepted_for_future_runtime",
];

const privacyClasses = [
  "public_safe_ref",
  "private_ref_only",
  "blocked_raw_private_payload",
  "blocked_secret_like_payload",
];

const redactionStatuses = [
  "not_needed",
  "redacted",
  "blocked_secret_like_pattern",
  "blocked_raw_payload",
  "blocked_private_location",
];

const locatorKinds = [
  "symbolic_ref",
  "public_url_locator",
  "repo_path_locator",
  "uploaded_file_locator",
  "manual_ref_locator",
  "unknown",
];

const reasonCodes = [
  "source_kind_supported",
  "source_kind_unknown",
  "source_locator_present",
  "source_locator_missing",
  "source_ref_public_safe",
  "source_ref_private_ref_only",
  "raw_source_body_blocked",
  "private_url_blocked",
  "local_private_path_blocked",
  "secret_like_pattern_blocked",
  "operator_review_required",
  "runtime_not_implemented",
  "source_fetch_not_executed",
  "local_file_read_not_executed",
  "provider_call_not_executed",
  "retrieval_not_executed",
  "source_ref_not_proof",
  "product_write_denied",
];

const authorityFalseFields = [
  "source_intake_runtime_now",
  "source_fetch_now",
  "local_file_read_now",
  "raw_source_body_storage_now",
  "provider_openai_call_now",
  "retrieval_rag_execution_now",
  "db_query_or_write_now",
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

for (const filePath of [docPath, fixturePath, typePath, packagePath, indexPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const doc = readFile(docPath);
const fixtureText = readFile(fixturePath);
const fixture = JSON.parse(fixtureText);
const typeSource = readFile(typePath);
const packageJson = JSON.parse(readFile(packagePath));
const indexDoc = readFile(indexPath);
const bundle = fixture.expected_bundle;

assert.equal(fixture.fixture_version, "bounded_source_intake_runtime_contract.sample.v0.1");
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.request_version, requestVersion);
assert.equal(fixture.source_descriptor_version, sourceDescriptorVersion);
assert.equal(fixture.result_version, resultVersion);
assert.equal(fixture.bundle_version, bundleVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.status, status);
assert.equal(bundle?.status, status);
assert.ok(Array.isArray(bundle?.requests) && bundle.requests.length > 0, "bundle requests must be non-empty");
assert.ok(
  Array.isArray(bundle?.result_envelopes) && bundle.result_envelopes.length > 0,
  "bundle result_envelopes must be non-empty",
);

assertTypeContractCoverage();
assertVocabularyCoverage();
assertBundleShape();
assertBundleFingerprint();
assertFixtureSafety();
assertDocCoverage();
assertNoForbiddenPositiveAuthorityGrants(doc, "doc");
assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
assertIndexCoverage();

console.log(
  JSON.stringify(
    {
      smoke: "bounded-source-intake-runtime-contract-v0-1",
      final_status: "pass",
      contract_version: fixture.contract_version,
      status: fixture.status,
      requests: bundle.requests.length,
      result_envelopes: bundle.result_envelopes.length,
      bundle_fingerprint: bundle.bundle_fingerprint,
    },
    null,
    2,
  ),
);

function assertTypeContractCoverage() {
  for (const exportedName of [
    "BoundedSourceIntakeRuntimeContractVersion",
    "BoundedSourceIntakeRuntimeScope",
    "BoundedSourceIntakeRuntimeContractStatus",
    "BoundedSourceIntakeSourceKind",
    "BoundedSourceIntakeRequestStatus",
    "BoundedSourceIntakeSourcePrivacyClass",
    "BoundedSourceIntakeRedactionStatus",
    "BoundedSourceIntakeLocatorKind",
    "BoundedSourceIntakeReasonCode",
    "BoundedSourceIntakeAuthorityBoundary",
    "BoundedSourceIntakeSourceDescriptor",
    "BoundedSourceIntakeRequest",
    "BoundedSourceIntakeResultEnvelope",
    "BoundedSourceIntakeContractBundle",
    "BoundedSourceIntakeValidationResult",
  ]) {
    assert.ok(typeSource.includes(`export `) && typeSource.includes(exportedName), `${exportedName} export missing`);
  }
  for (const literal of [
    contractVersion,
    scope,
    status,
    requestVersion,
    sourceDescriptorVersion,
    resultVersion,
    bundleVersion,
    ...sourceKinds,
    ...requestStatuses,
    ...privacyClasses,
    ...redactionStatuses,
    ...locatorKinds,
    ...reasonCodes,
  ]) {
    assert.ok(typeSource.includes(`"${literal}"`), `type contract must include literal ${literal}`);
  }
}

function assertVocabularyCoverage() {
  const bundleSourceKinds = new Set(bundle.requests.map((request) => request.source_descriptor?.source_kind));
  const bundleRequestStatuses = new Set(bundle.requests.map((request) => request.request_status));
  const bundlePrivacyClasses = new Set(
    bundle.requests.map((request) => request.source_descriptor?.privacy_class),
  );
  const bundleRedactionStatuses = new Set(
    bundle.requests.map((request) => request.source_descriptor?.redaction_status),
  );
  const bundleReasonCodes = new Set();
  for (const request of bundle.requests) {
    for (const code of request.source_descriptor?.reason_codes ?? []) {
      bundleReasonCodes.add(code);
    }
  }
  for (const envelope of bundle.result_envelopes) {
    for (const code of envelope.reason_codes ?? []) {
      bundleReasonCodes.add(code);
    }
  }

  assertIncludesAll(bundleSourceKinds, sourceKinds, "source kinds");
  assertIncludesAll(bundleRequestStatuses, requestStatuses, "request statuses");
  assertIncludesAll(bundlePrivacyClasses, privacyClasses, "privacy classes");
  assertIncludesAll(bundleRedactionStatuses, redactionStatuses, "redaction statuses");
  assertIncludesAll(bundleReasonCodes, reasonCodes, "reason codes");
  assert.ok(
    bundle.result_envelopes.some((envelope) => envelope.accepted_for_future_runtime === true),
    "at least one result envelope must be accepted for future runtime",
  );
  assert.ok(
    bundle.requests.some((request) => request.request_status === "accepted_for_future_runtime"),
    "at least one request must be accepted for future runtime",
  );
  assert.ok(
    bundle.requests.some(
      (request) => request.source_descriptor?.privacy_class === "blocked_raw_private_payload",
    ),
    "at least one request must block raw private payload",
  );
  assert.ok(
    bundle.requests.some(
      (request) => request.source_descriptor?.privacy_class === "blocked_secret_like_payload",
    ),
    "at least one request must block secret-like payload",
  );
  assert.ok(
    bundle.requests.some((request) => request.source_descriptor?.privacy_class === "private_ref_only"),
    "at least one request must be private_ref_only",
  );
  assert.ok(
    bundle.requests.some((request) => request.source_descriptor?.source_kind === "unknown"),
    "at least one request must have unknown source kind",
  );
  assert.ok(
    bundle.requests.some((request) =>
      request.source_descriptor?.reason_codes?.includes("source_locator_missing"),
    ),
    "at least one request must carry source_locator_missing",
  );
  assert.ok(
    bundle.requests.some((request) => request.source_descriptor?.source_kind === "review_memory_ref"),
    "at least one request must reference review memory",
  );
}

function assertBundleShape() {
  assert.equal(bundle.bundle_version, bundleVersion);
  assert.equal(bundle.contract_version, contractVersion);
  assert.equal(bundle.scope, scope);
  assert.equal(bundle.status, status);
  assert.ok(bundle.as_of, "bundle as_of must be present");
  assert.ok(Array.isArray(bundle.source_fixture_refs), "bundle source_fixture_refs must be an array");
  assertCounts(bundle.source_kind_counts, sourceKinds, "source_kind_counts");
  assertCounts(bundle.request_status_counts, requestStatuses, "request_status_counts");
  assertCounts(bundle.privacy_class_counts, privacyClasses, "privacy_class_counts");
  assertCounts(bundle.redaction_status_counts, redactionStatuses, "redaction_status_counts");
  assert.ok(Array.isArray(bundle.boundary_notes), "bundle boundary_notes must be an array");
  assertAuthorityBoundary(bundle.authority_boundary, "bundle authority_boundary");

  for (const request of bundle.requests) {
    assert.equal(request.request_version, requestVersion);
    assert.equal(request.contract_version, contractVersion);
    assert.equal(request.scope, scope);
    assert.ok(request.request_id, "request_id must be present");
    assert.ok(requestStatuses.includes(request.request_status), `${request.request_id} request_status vocabulary`);
    assert.ok(request.source_descriptor, `${request.request_id} source_descriptor must be present`);
    assert.ok(request.bounded_intake_purpose, `${request.request_id} bounded_intake_purpose must be present`);
    assert.ok(Array.isArray(request.boundary_notes), `${request.request_id} boundary_notes must be an array`);
    assertAuthorityBoundary(request.authority_boundary, `${request.request_id} authority_boundary`);
    assertSourceDescriptor(request.source_descriptor, request.request_id);
  }

  for (const envelope of bundle.result_envelopes) {
    assert.equal(envelope.result_version, resultVersion);
    assert.equal(envelope.contract_version, contractVersion);
    assert.equal(envelope.scope, scope);
    assert.equal(envelope.status, status);
    assert.ok(envelope.request_id, "result envelope request_id must be present");
    assert.equal(envelope.raw_source_body_included, false, `${envelope.request_id} raw_source_body_included false`);
    assert.equal(envelope.source_fetch_executed, false, `${envelope.request_id} source_fetch_executed false`);
    assert.equal(envelope.local_file_read_executed, false, `${envelope.request_id} local_file_read_executed false`);
    assert.equal(envelope.provider_call_executed, false, `${envelope.request_id} provider_call_executed false`);
    assert.equal(envelope.retrieval_executed, false, `${envelope.request_id} retrieval_executed false`);
    assert.equal(envelope.proof_or_evidence_created, false, `${envelope.request_id} proof_or_evidence_created false`);
    assert.equal(envelope.product_write_executed, false, `${envelope.request_id} product_write_executed false`);
    assertReasonCodes(envelope.reason_codes, `${envelope.request_id} result envelope`);
    assertAuthorityBoundary(envelope.authority_boundary, `${envelope.request_id} result authority_boundary`);
  }
}

function assertSourceDescriptor(descriptor, requestId) {
  assert.equal(descriptor.source_descriptor_version, sourceDescriptorVersion);
  assert.equal(descriptor.scope, scope);
  assert.ok(descriptor.source_id, `${requestId} source_id must be present`);
  assert.ok(sourceKinds.includes(descriptor.source_kind), `${requestId} source_kind vocabulary`);
  assert.ok(locatorKinds.includes(descriptor.locator_kind), `${requestId} locator_kind vocabulary`);
  assert.equal(typeof descriptor.source_locator, "string", `${requestId} source_locator must be a string`);
  assert.ok(descriptor.symbolic_source_ref, `${requestId} symbolic_source_ref must be present`);
  assert.ok(privacyClasses.includes(descriptor.privacy_class), `${requestId} privacy_class vocabulary`);
  assert.ok(redactionStatuses.includes(descriptor.redaction_status), `${requestId} redaction_status vocabulary`);
  assert.ok(Array.isArray(descriptor.redaction_notes), `${requestId} redaction_notes must be an array`);
  assert.equal(typeof descriptor.public_safe, "boolean", `${requestId} public_safe must be boolean`);
  assertReasonCodes(descriptor.reason_codes, `${requestId} source descriptor`);
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(boundary?.contract_only, true, `${label} contract_only true`);
  for (const field of authorityFalseFields) {
    assert.equal(boundary?.[field], false, `${label} ${field} false`);
  }
}

function assertBundleFingerprint() {
  assert.ok(bundle.bundle_fingerprint, "bundle_fingerprint must be stable and non-empty");
  const bundleForHash = JSON.parse(JSON.stringify(bundle));
  delete bundleForHash.bundle_fingerprint;
  const expectedFingerprint = createHash("sha256").update(canonicalJson(bundleForHash)).digest("hex");
  assert.equal(bundle.bundle_fingerprint, expectedFingerprint, "bundle_fingerprint must match canonical JSON hash");
}

function assertFixtureSafety() {
  for (const forbiddenText of [
    "/Users/",
    "/home/",
    "file://",
    "sk-",
    "ghp_",
    "OPENAI_API_KEY",
    "GITHUB_TOKEN",
    "password:",
    "secret:",
    "private key",
    "raw provider output",
    "raw conversation",
    "hidden reasoning",
    "raw DB row",
    "browser dump",
  ]) {
    assert.ok(!fixtureText.includes(forbiddenText), `fixture must not contain ${forbiddenText}`);
  }

  const allowedRawSourcePlaceholder = "raw source body blocked by contract fixture";
  assert.ok(
    fixtureText.includes(allowedRawSourcePlaceholder),
    "fixture should demonstrate blocked raw source body with bounded placeholder",
  );
  const fixtureWithoutAllowedPlaceholder = fixtureText.replaceAll(allowedRawSourcePlaceholder, "");
  assert.ok(
    !fixtureWithoutAllowedPlaceholder.includes("raw source body"),
    "fixture must not contain actual raw source body content",
  );
}

function assertDocCoverage() {
  for (const requiredPhrase of [
    "Bounded Source Intake Runtime Contract is contract-only.",
    "It implements the next source-intake preparation slice from the integrated development roadmap guide v0.2.",
    "It does not implement source intake runtime.",
    "It does not fetch sources.",
    "It does not read local files.",
    "It does not store raw source bodies.",
    "It does not call provider/OpenAI.",
    "It does not execute retrieval/RAG.",
    "It does not query or write DB.",
    "It does not create proof/evidence.",
    "It does not promote Perspective.",
    "It does not mutate durable Perspective state.",
    "It does not mutate work.",
    "It does not execute Codex.",
    "It does not call GitHub.",
    "It does not export Git Ledger packets.",
    "It does not write product records.",
    "Product-write remains parked by #686.",
    "Source refs are lineage pointers, not proof.",
    "Source refs must be public-safe symbolic refs.",
    "A public URL ref is not fetched in this contract.",
    "A repository file ref is not read in this contract.",
    "An uploaded file ref is not read in this contract.",
    "Raw source bodies must not be stored.",
    "Private URLs and local private paths are blocked or reduced to public-safe symbolic refs.",
    "Secret-like source locators are blocked or redacted.",
    "accepted_for_future_runtime is not runtime execution.",
    "integrated development roadmap guide v0.2",
    "background inputs already integrated into the roadmap guide",
  ]) {
    assert.ok(doc.includes(requiredPhrase), `doc must include ${requiredPhrase}`);
  }
}

function assertNoForbiddenPositiveAuthorityGrants(source, label) {
  for (const field of authorityFalseFields) {
    assert.ok(!source.includes(`${field}: true`), `${label} must not grant ${field}`);
  }
}

function assertIndexCoverage() {
  const block = extractIndexBlock(indexDoc, "Bounded Source Intake Runtime Contract v0.1");
  for (const requiredText of [
    docPath,
    fixturePath,
    typePath,
    smokePath,
    "integrated roadmap guide v0.2",
    "contract-only",
  ]) {
    assert.ok(block.includes(requiredText), `index block must include ${requiredText}`);
  }
  for (const requiredBoundaryText of [
    "does not implement source intake runtime",
    "source fetch",
    "local file read",
    "raw source storage",
    "provider",
    "retrieval",
    "DB query/write",
    "proof/evidence",
    "promotion",
    "GitHub automation",
    "Git Ledger",
    "product write",
    "product ID allocation",
  ]) {
    assert.ok(block.includes(requiredBoundaryText), `index block must include ${requiredBoundaryText}`);
  }
  for (const forbiddenPattern of [
    /source intake runtime (was|were|is) added/i,
    /source fetch (was|were|is) added/i,
    /local file read (was|were|is) added/i,
    /raw source storage (was|were|is) added/i,
    /provider runtime (was|were|is) added/i,
    /retrieval runtime (was|were|is) added/i,
    /DB query\/write (was|were|is) added/i,
    /promotion (was|were|is) added/i,
    /Codex execution (was|were|is) added/i,
    /GitHub automation (was|were|is) added/i,
    /Git Ledger export (was|were|is) added/i,
    /product write (was|were|is) added/i,
    /product ID allocation (was|were|is) added/i,
  ]) {
    assert.doesNotMatch(block, forbiddenPattern);
  }
}

function assertCounts(counts, vocabulary, label) {
  assert.ok(counts && typeof counts === "object", `${label} must be an object`);
  for (const value of vocabulary) {
    assert.equal(typeof counts[value], "number", `${label}.${value} must be a number`);
  }
}

function assertReasonCodes(codes, label) {
  assert.ok(Array.isArray(codes), `${label} reason_codes must be an array`);
  for (const code of codes) {
    assert.ok(reasonCodes.includes(code), `${label} reason code ${code} must be in vocabulary`);
  }
}

function assertIncludesAll(actualSet, expectedValues, label) {
  for (const expectedValue of expectedValues) {
    assert.ok(actualSet.has(expectedValue), `${label} must include ${expectedValue}`);
  }
}

function extractIndexBlock(source, heading) {
  const start = source.indexOf(`- ${heading}:`);
  assert.ok(start >= 0, `index block for ${heading} must exist`);
  const next = source.indexOf("\n- ", start + 1);
  return next >= 0 ? source.slice(start, next) : source.slice(start);
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}
