import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const docPath = "docs/BOUNDED_SOURCE_INTAKE_RUNTIME_V0_1.md";
const fixturePath = "fixtures/bounded-source-intake-runtime.sample.v0.1.json";
const helperPath = "lib/research-candidate-review/bounded-source-intake-runtime.ts";
const typePath = "types/bounded-source-intake-runtime-contract.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const smokePath = "scripts/smoke-bounded-source-intake-runtime-v0-1.mjs";
const contractSmokePath = "scripts/smoke-bounded-source-intake-runtime-contract-v0-1.mjs";
const runtimeVersion = "bounded_source_intake_runtime.v0.1";
const contractVersion = "bounded_source_intake_runtime_contract.v0.1";
const requestVersion = "bounded_source_intake_request.v0.1";
const resultVersion = "bounded_source_intake_result_envelope.v0.1";
const scope = "project:augnes";
const runtimeStatus = "bounded_runtime_only";
const packageScriptName = "smoke:bounded-source-intake-runtime-v0-1";
const packageScriptValue = "node scripts/smoke-bounded-source-intake-runtime-v0-1.mjs";

const requiredDecisionCounts = [
  "accepted_bounded_summary",
  "blocked_private_or_raw_payload",
  "blocked_secret_like_payload",
  "blocked_unsupported_source_kind",
  "needs_operator_review",
  "candidate_only",
];

const runtimeAuthorityFalseFields = [
  "source_fetch_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
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

for (const filePath of [docPath, fixturePath, helperPath, typePath, packagePath, indexPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const doc = readFile(docPath);
const fixtureText = readFile(fixturePath);
const fixture = JSON.parse(fixtureText);
const helperSource = readFile(helperPath);
const typeSource = readFile(typePath);
const packageJson = JSON.parse(readFile(packagePath));
const indexDoc = readFile(indexPath);
const runtime = await import(pathToFileURL(helperPath).href);

assert.equal(fixture.fixture_version, "bounded_source_intake_runtime.sample.v0.1");
assert.equal(fixture.runtime_version, runtimeVersion);
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.request_version, requestVersion);
assert.equal(fixture.result_version, resultVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.status, runtimeStatus);

assertTypeAdditions();
assertHelperExports();
assert.deepEqual(
  runtime.buildBoundedSourceIntakeRuntimeReport(fixture.input_preview),
  fixture.expected_report,
  "helper output must deep-equal expected_report",
);
assert.deepEqual(runtime.validateBoundedSourceIntakeRuntimeInput(fixture.input_preview), {
  passed: true,
  failure_codes: [],
});
assert.deepEqual(runtime.validateBoundedSourceIntakeRuntimeReport(fixture.expected_report), {
  passed: true,
  failure_codes: [],
});
assert.equal(
  runtime.createBoundedSourceIntakeRuntimeReportFingerprint(fixture.expected_report),
  fixture.expected_report.runtime_report_fingerprint,
);
assertRuntimeReportShape();
assertRuntimeAuthorityBoundary(
  runtime.getBoundedSourceIntakeRuntimeAuthorityBoundary(),
  "helper authority boundary",
);
assertRuntimeAuthorityBoundary(
  fixture.expected_report.authority_boundary,
  "fixture report authority boundary",
);
assertSyntheticUnsafeSummaryRejected();
assertSyntheticMissingSummaryRefRejected();
assertSyntheticUnsafeSummaryRefRejected();
assertAcceptedEnvelopeRequiresBoundedSummaryRef();
assertAcceptedEnvelopeRefMustMatchDecisionRef();
assertNonacceptedEnvelopeCannotCarryBoundedSummaryRef();
assertBlockedEnvelopeCannotCarryBoundedSummaryRef();
assertSourceKindBoundaries();
assertHelperSourceBoundary();
assertFixtureSafety();
assertDocCoverage();
assertNoForbiddenPositiveAuthorityGrants(doc, "doc");
assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
assertIndexCoverage();

console.log(
  JSON.stringify(
    {
      smoke: "bounded-source-intake-runtime-v0-1",
      final_status: "pass",
      runtime_version: fixture.runtime_version,
      contract_version: fixture.contract_version,
      status: fixture.status,
      requests: fixture.input_preview.requests.length,
      result_envelopes: fixture.expected_report.result_envelopes.length,
      runtime_report_fingerprint: fixture.expected_report.runtime_report_fingerprint,
    },
    null,
    2,
  ),
);

function assertTypeAdditions() {
  for (const requiredType of [
    "BoundedSourceIntakeRuntimeVersion",
    "BoundedSourceIntakeRuntimeStatus",
    "BoundedSourceIntakeRuntimeDecision",
    "BoundedSourceIntakeRuntimeReasonCode",
    "BoundedSourceIntakeRuntimeAuthorityBoundary",
    "BoundedSourceIntakeRuntimeInput",
    "BoundedSourceIntakeRuntimeReport",
    "BoundedSourceIntakeRuntimeValidationResult",
  ]) {
    assert.ok(typeSource.includes(requiredType), `type contract must include ${requiredType}`);
  }
  for (const literal of [
    runtimeVersion,
    runtimeStatus,
    "accepted_bounded_summary",
    "blocked_private_or_raw_payload",
    "blocked_secret_like_payload",
    "blocked_unsupported_source_kind",
    "needs_operator_review",
    "candidate_only",
    "bounded_runtime_executed",
    "bounded_summary_present",
    "bounded_summary_missing",
    "runtime_result_envelope_created",
    "request_validation_passed",
    "request_validation_failed",
    "blocked_request_not_executed",
    "accepted_request_not_truth",
  ]) {
    assert.ok(typeSource.includes(`"${literal}"`), `type contract must include literal ${literal}`);
  }
}

function assertHelperExports() {
  for (const exportedName of [
    "getBoundedSourceIntakeRuntimeAuthorityBoundary",
    "buildBoundedSourceIntakeRuntimeReport",
    "validateBoundedSourceIntakeRuntimeInput",
    "validateBoundedSourceIntakeRuntimeReport",
    "createBoundedSourceIntakeRuntimeReportFingerprint",
    "isSafeBoundedSourceIntakeRuntimeSummary",
    "isSafeBoundedSourceIntakeRuntimeLocator",
  ]) {
    assert.equal(typeof runtime[exportedName], "function", `helper must export ${exportedName}`);
    assert.ok(helperSource.includes(`export function ${exportedName}`), `helper source must export ${exportedName}`);
  }
}

function assertRuntimeReportShape() {
  const requests = fixture.input_preview.requests;
  const report = fixture.expected_report;
  assert.equal(report.result_envelopes.length, requests.length, "one result envelope per request");
  assert.equal(report.runtime_decisions.length, requests.length, "one runtime decision per request");
  assert.deepEqual(
    report.result_envelopes.map((envelope) => envelope.request_id).sort(),
    requests.map((request) => request.request_id).sort(),
  );
  assert.deepEqual(
    report.runtime_decisions.map((decision) => decision.request_id).sort(),
    requests.map((request) => request.request_id).sort(),
  );
  for (const decision of requiredDecisionCounts) {
    assert.ok(report.decision_counts[decision] > 0, `decision count must cover ${decision}`);
  }
  for (const envelope of report.result_envelopes) {
    assert.equal(envelope.raw_source_body_included, false, `${envelope.request_id} raw_source_body_included false`);
    assert.equal(envelope.source_fetch_executed, false, `${envelope.request_id} source_fetch_executed false`);
    assert.equal(envelope.local_file_read_executed, false, `${envelope.request_id} local_file_read_executed false`);
    assert.equal(envelope.provider_call_executed, false, `${envelope.request_id} provider_call_executed false`);
    assert.equal(envelope.retrieval_executed, false, `${envelope.request_id} retrieval_executed false`);
    assert.equal(envelope.proof_or_evidence_created, false, `${envelope.request_id} proof_or_evidence_created false`);
    assert.equal(envelope.product_write_executed, false, `${envelope.request_id} product_write_executed false`);
    const decision = report.runtime_decisions.find(
      (runtimeDecision) => runtimeDecision.request_id === envelope.request_id,
    );
    assert.ok(decision, `${envelope.request_id} decision must exist`);
    if (decision.decision === "accepted_bounded_summary") {
      assert.ok(decision.bounded_summary_ref, `${envelope.request_id} decision bounded_summary_ref must exist`);
      assert.ok(envelope.bounded_summary_ref, `${envelope.request_id} envelope bounded_summary_ref must exist`);
      assert.equal(
        envelope.bounded_summary_ref,
        decision.bounded_summary_ref,
        `${envelope.request_id} envelope and decision bounded_summary_ref must match`,
      );
      assert.equal(envelope.accepted_for_future_runtime, true, `${envelope.request_id} accepted envelope true`);
    } else {
      assert.equal(
        envelope.accepted_for_future_runtime,
        false,
        `${envelope.request_id} nonaccepted envelope false`,
      );
      assert.equal(
        envelope.bounded_summary_ref,
        undefined,
        `${envelope.request_id} nonaccepted envelope bounded_summary_ref absent`,
      );
    }
  }
}

function assertRuntimeAuthorityBoundary(boundary, label) {
  assert.equal(boundary?.bounded_runtime_only, true, `${label} bounded_runtime_only true`);
  assert.equal(boundary?.caller_provided_input_only, true, `${label} caller_provided_input_only true`);
  for (const field of runtimeAuthorityFalseFields) {
    assert.equal(boundary?.[field], false, `${label} ${field} false`);
  }
}

function assertSyntheticUnsafeSummaryRejected() {
  const unsafeInput = JSON.parse(JSON.stringify(fixture.input_preview));
  unsafeInput.bounded_summaries.push({
    request_id: "runtime-request-public-url-summary-001",
    bounded_summary_ref: "bounded-summary-ref:unsafe-synthetic",
    bounded_summary: "sk-FAKE_UNREDACTED",
    public_safe: true,
  });
  const validation = runtime.validateBoundedSourceIntakeRuntimeInput(unsafeInput);
  assert.equal(validation.passed, false, "unsafe bounded summary synthetic input must be rejected");
  assert.ok(
    validation.failure_codes.includes("bounded_summary_unsafe"),
    "unsafe bounded summary must carry bounded_summary_unsafe",
  );
}

function assertSyntheticMissingSummaryRefRejected() {
  const missingRefInput = JSON.parse(JSON.stringify(fixture.input_preview));
  missingRefInput.bounded_summaries.push({
    request_id: "runtime-request-public-url-summary-001",
    bounded_summary: "Public-safe summary without a ref.",
    public_safe: true,
  });
  const validation = runtime.validateBoundedSourceIntakeRuntimeInput(missingRefInput);
  assert.equal(validation.passed, false, "missing bounded_summary_ref synthetic input must be rejected");
  assert.ok(
    validation.failure_codes.includes("missing_bounded_summary_ref"),
    "missing bounded_summary_ref must carry missing_bounded_summary_ref",
  );
  assert.throws(
    () => runtime.buildBoundedSourceIntakeRuntimeReport(missingRefInput),
    /bounded_source_intake_runtime_input_invalid/,
    "runtime must refuse to build from missing bounded_summary_ref input",
  );
}

function assertSyntheticUnsafeSummaryRefRejected() {
  const unsafeRefInput = JSON.parse(JSON.stringify(fixture.input_preview));
  unsafeRefInput.bounded_summaries.push({
    request_id: "runtime-request-public-url-summary-001",
    bounded_summary_ref: "sk-FAKE_UNREDACTED",
    bounded_summary: "Public-safe synthetic summary with unsafe ref.",
    public_safe: true,
  });
  const validation = runtime.validateBoundedSourceIntakeRuntimeInput(unsafeRefInput);
  assert.equal(validation.passed, false, "unsafe bounded_summary_ref synthetic input must be rejected");
  assert.ok(
    validation.failure_codes.includes("unsafe_bounded_summary_ref") ||
      validation.failure_codes.includes("bounded_summary_ref_unsafe"),
    "unsafe bounded_summary_ref must carry unsafe ref failure code",
  );
}

function assertAcceptedEnvelopeRequiresBoundedSummaryRef() {
  const report = cloneExpectedReport();
  const { envelope } = findAcceptedDecisionAndEnvelope(report);
  delete envelope.bounded_summary_ref;
  recomputeReportFingerprint(report);
  const validation = runtime.validateBoundedSourceIntakeRuntimeReport(report);
  assert.equal(validation.passed, false, "accepted envelope without bounded_summary_ref must be rejected");
  assert.ok(
    validation.failure_codes.includes("accepted_envelope_without_bounded_summary_ref"),
    "missing accepted envelope ref must carry accepted_envelope_without_bounded_summary_ref",
  );
}

function assertAcceptedEnvelopeRefMustMatchDecisionRef() {
  const report = cloneExpectedReport();
  const { envelope } = findAcceptedDecisionAndEnvelope(report);
  envelope.bounded_summary_ref = "bounded-summary-ref:runtime-mismatched-accepted-ref";
  recomputeReportFingerprint(report);
  const validation = runtime.validateBoundedSourceIntakeRuntimeReport(report);
  assert.equal(validation.passed, false, "accepted envelope ref mismatch must be rejected");
  assert.ok(
    validation.failure_codes.includes("accepted_bounded_summary_ref_mismatch"),
    "accepted ref mismatch must carry accepted_bounded_summary_ref_mismatch",
  );
}

function assertNonacceptedEnvelopeCannotCarryBoundedSummaryRef() {
  const report = cloneExpectedReport();
  const { envelope } = findDecisionAndEnvelope(report, (decision) =>
    ["candidate_only", "needs_operator_review"].includes(decision.decision),
  );
  envelope.bounded_summary_ref = "bounded-summary-ref:runtime-unexpected-nonaccepted-ref";
  recomputeReportFingerprint(report);
  const validation = runtime.validateBoundedSourceIntakeRuntimeReport(report);
  assert.equal(validation.passed, false, "nonaccepted envelope bounded_summary_ref must be rejected");
  assert.ok(
    validation.failure_codes.includes("nonaccepted_decision_with_bounded_summary_ref"),
    "nonaccepted envelope ref must carry nonaccepted_decision_with_bounded_summary_ref",
  );
}

function assertBlockedEnvelopeCannotCarryBoundedSummaryRef() {
  const report = cloneExpectedReport();
  const { envelope } = findDecisionAndEnvelope(report, (decision) =>
    decision.decision.startsWith("blocked_"),
  );
  envelope.bounded_summary_ref = "bounded-summary-ref:runtime-unexpected-blocked-ref";
  envelope.accepted_for_future_runtime = true;
  recomputeReportFingerprint(report);
  const validation = runtime.validateBoundedSourceIntakeRuntimeReport(report);
  assert.equal(validation.passed, false, "blocked envelope bounded_summary_ref must be rejected");
  assert.ok(
    validation.failure_codes.includes("blocked_decision_with_bounded_summary_ref") ||
      validation.failure_codes.includes("accepted_envelope_without_accepted_decision"),
    "blocked envelope ref must carry blocked or accepted-without-decision failure code",
  );
}

function assertSourceKindBoundaries() {
  const requestsById = new Map(
    fixture.input_preview.requests.map((request) => [request.request_id, request]),
  );
  const envelopesById = new Map(
    fixture.expected_report.result_envelopes.map((envelope) => [envelope.request_id, envelope]),
  );
  const decisionsById = new Map(
    fixture.expected_report.runtime_decisions.map((decision) => [decision.request_id, decision]),
  );
  for (const request of requestsById.values()) {
    const envelope = envelopesById.get(request.request_id);
    const decision = decisionsById.get(request.request_id);
    assert.ok(envelope, `${request.request_id} envelope must exist`);
    assert.ok(decision, `${request.request_id} decision must exist`);
    if (request.source_descriptor.source_kind === "public_url_ref") {
      assert.equal(envelope.source_fetch_executed, false, "public_url_ref must not fetch");
    }
    if (request.source_descriptor.source_kind === "repository_file_ref") {
      assert.equal(envelope.local_file_read_executed, false, "repository_file_ref must not read files");
    }
    if (request.source_descriptor.source_kind === "uploaded_file_ref") {
      assert.equal(envelope.local_file_read_executed, false, "uploaded_file_ref must not read files");
    }
    if (request.source_descriptor.privacy_class === "blocked_secret_like_payload") {
      assert.equal(envelope.accepted_for_future_runtime, false, "blocked_secret_like_payload cannot be accepted");
    }
    if (request.source_descriptor.privacy_class === "blocked_raw_private_payload") {
      assert.equal(envelope.accepted_for_future_runtime, false, "blocked_raw_private_payload cannot be accepted");
    }
    if (request.source_descriptor.source_kind === "unknown") {
      assert.equal(decision.decision, "blocked_unsupported_source_kind", "unknown source kind must be blocked");
    }
  }
}

function assertHelperSourceBoundary() {
  for (const forbiddenText of [
    "readFileSync",
    "writeFileSync",
    "fetch(",
    "XMLHttpRequest",
    "WebSocket",
    "new OpenAI",
    "better-sqlite3",
    "sqlite",
    "db.prepare",
    "child_process",
    "exec(",
    "spawn(",
    "createPullRequest",
    "createBranch",
    "git commit",
    "app/api",
  ]) {
    assert.ok(!helperSource.includes(forbiddenText), `helper source must not contain ${forbiddenText}`);
  }
}

function assertFixtureSafety() {
  const allowedRawPlaceholder = "raw source body blocked by contract fixture";
  const allowedSecretPlaceholder = "secret-like source locator blocked by contract fixture";
  const fixtureWithoutAllowedPlaceholders = fixtureText
    .replaceAll(allowedRawPlaceholder, "")
    .replaceAll(allowedSecretPlaceholder, "");
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
    "raw_db_row",
    "browser dump",
    "raw browser dump",
    "raw source body",
    "secret-like source locator",
  ]) {
    assert.ok(!fixtureWithoutAllowedPlaceholders.includes(forbiddenText), `fixture must not contain ${forbiddenText}`);
  }
}

function assertDocCoverage() {
  for (const requiredPhrase of [
    "Bounded Source Intake Runtime is bounded-runtime-only.",
    "It implements the runtime follow-up to the #774 contract from the integrated development roadmap guide v0.2.",
    "It processes caller-provided source descriptors and bounded summaries only.",
    "It does not fetch sources.",
    "It does not read local files.",
    "It does not read repository files.",
    "It does not read uploaded files.",
    "It does not store raw source bodies.",
    "It does not call provider/OpenAI.",
    "It does not execute retrieval/RAG.",
    "It does not query or write DB.",
    "It does not add routes.",
    "It does not add UI.",
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
    "accepted_bounded_summary is not truth.",
    "accepted_bounded_summary is not proof/evidence.",
    "candidate_only is not runtime execution approval.",
    "A public URL ref is not fetched by this runtime.",
    "A repository file ref is not read by this runtime.",
    "An uploaded file ref is not read by this runtime.",
    "Raw source bodies must not be stored.",
    "integrated development roadmap guide v0.2",
    "background inputs already integrated into the roadmap guide",
  ]) {
    assert.ok(doc.includes(requiredPhrase), `doc must include ${requiredPhrase}`);
  }
}

function assertNoForbiddenPositiveAuthorityGrants(source, label) {
  for (const field of runtimeAuthorityFalseFields) {
    assert.ok(!source.includes(`${field}: true`), `${label} must not grant ${field}`);
  }
}

function assertIndexCoverage() {
  const block = extractIndexBlock(indexDoc, "Bounded Source Intake Runtime v0.1");
  for (const requiredText of [
    docPath,
    fixturePath,
    helperPath,
    typePath,
    smokePath,
    contractSmokePath,
    "integrated roadmap guide v0.2",
    "bounded-runtime-only",
    "caller-provided descriptors and bounded summaries only",
  ]) {
    assert.ok(block.includes(requiredText), `index block must include ${requiredText}`);
  }
  for (const requiredBoundaryText of [
    "does not imply source fetch",
    "local file read",
    "repository file read",
    "uploaded file read",
    "raw source storage",
    "route",
    "UI",
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
    /source fetch (was|were|is) added/i,
    /local file read (was|were|is) added/i,
    /repository file read (was|were|is) added/i,
    /uploaded file read (was|were|is) added/i,
    /raw source storage (was|were|is) added/i,
    /route (was|were|is) added/i,
    /UI (was|were|is) added/i,
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

function cloneExpectedReport() {
  return JSON.parse(JSON.stringify(fixture.expected_report));
}

function findAcceptedDecisionAndEnvelope(report) {
  return findDecisionAndEnvelope(
    report,
    (decision) => decision.decision === "accepted_bounded_summary",
  );
}

function findDecisionAndEnvelope(report, predicate) {
  const decision = report.runtime_decisions.find(predicate);
  assert.ok(decision, "expected runtime decision must exist");
  const envelope = report.result_envelopes.find(
    (candidateEnvelope) => candidateEnvelope.request_id === decision.request_id,
  );
  assert.ok(envelope, `${decision.request_id} matching envelope must exist`);
  return { decision, envelope };
}

function recomputeReportFingerprint(report) {
  report.runtime_report_fingerprint =
    runtime.createBoundedSourceIntakeRuntimeReportFingerprint(report);
}

function extractIndexBlock(source, heading) {
  const start = source.indexOf(`- ${heading}:`);
  assert.ok(start >= 0, `index block for ${heading} must exist`);
  const next = source.indexOf("\n- ", start + 1);
  return next >= 0 ? source.slice(start, next) : source.slice(start);
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}
