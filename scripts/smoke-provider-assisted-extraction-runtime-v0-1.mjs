import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const docPath = "docs/PROVIDER_ASSISTED_EXTRACTION_RUNTIME_V0_1.md";
const fixturePath = "fixtures/provider-assisted-extraction-runtime.sample.v0.1.json";
const helperPath = "lib/research-candidate-review/provider-assisted-extraction-runtime.ts";
const typePath = "types/provider-assisted-extraction-candidate-only-contract.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const runtimeVersion = "provider_assisted_extraction_runtime.v0.1";
const contractVersion = "provider_assisted_extraction_candidate_only_contract.v0.1";
const requestVersion = "provider_assisted_extraction_candidate_request.v0.1";
const outputVersion = "provider_assisted_extraction_candidate_output.v0.1";
const scope = "project:augnes";
const runtimeStatus = "bounded_runtime_only";
const packageScriptName = "smoke:provider-assisted-extraction-runtime-v0-1";
const packageScriptValue = "node scripts/smoke-provider-assisted-extraction-runtime-v0-1.mjs";

const requiredDecisionCounts = [
  "candidate_output_created",
  "blocked_private_or_raw_payload",
  "blocked_secret_like_payload",
  "blocked_missing_bounded_source",
  "blocked_unsupported_target",
  "needs_operator_review",
  "candidate_only",
  "rejected",
];

const targetKinds = [
  "claim_candidate",
  "evidence_candidate",
  "source_summary_candidate",
  "knowledge_gap_signal",
  "contradiction_signal",
  "calibration_signal",
  "logical_shape_hint",
  "handoff_hint",
  "unknown",
];

const reviewStatuses = [
  "candidate_only",
  "needs_review",
  "rejected",
  "accepted_for_future_runtime",
  "superseded",
];

const runtimeAuthorityFalseFields = [
  "provider_call_now",
  "prompt_sent_now",
  "provider_output_stored_now",
  "source_fetch_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "raw_source_body_storage_now",
  "retrieval_rag_execution_now",
  "db_query_or_write_now",
  "source_of_truth",
  "proof_or_evidence_record",
  "claim_or_evidence_write_now",
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

assert.equal(fixture.fixture_version, "provider_assisted_extraction_runtime.sample.v0.1");
assert.equal(fixture.runtime_version, runtimeVersion);
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.request_version, requestVersion);
assert.equal(fixture.output_version, outputVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.status, runtimeStatus);

assertTypeAdditions();
assertHelperExports();
assert.deepEqual(
  runtime.buildProviderAssistedExtractionRuntimeReport(fixture.input_preview),
  fixture.expected_report,
  "helper output must deep-equal expected_report",
);
assert.deepEqual(runtime.validateProviderAssistedExtractionRuntimeInput(fixture.input_preview), {
  passed: true,
  failure_codes: [],
});
assert.deepEqual(runtime.validateProviderAssistedExtractionRuntimeReport(fixture.expected_report), {
  passed: true,
  failure_codes: [],
});
assert.equal(
  runtime.createProviderAssistedExtractionRuntimeReportFingerprint(fixture.expected_report),
  fixture.expected_report.runtime_report_fingerprint,
);
assertRuntimeReportShape();
assertRuntimeAuthorityBoundary(
  runtime.getProviderAssistedExtractionRuntimeAuthorityBoundary(),
  "helper authority boundary",
);
assertRuntimeAuthorityBoundary(
  fixture.expected_report.authority_boundary,
  "fixture report authority boundary",
);
assertUnsafeCandidatePreviewRejected();
assertCandidatePreviewPublicSafeFalseRejected();
assertCandidatePreviewMissingRequestRejected();
assertReportAuthorityGrantRejected();
assertCandidateOutputProviderOutputRejected();
assertCandidateOutputPromptSentRejected();
assertCandidateOutputClaimWriteRejected();
assertCandidateOutputForBlockedDecisionRejected();
assertHelperSourceBoundary();
assertFixtureSafety();
assertDocCoverage();
assertNoForbiddenPositiveAuthorityGrants(doc, "doc");
assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
assertIndexCoverage();

console.log(
  JSON.stringify(
    {
      smoke: "provider-assisted-extraction-runtime-v0-1",
      final_status: "pass",
      runtime_version: fixture.runtime_version,
      contract_version: fixture.contract_version,
      status: fixture.status,
      requests: fixture.input_preview.requests.length,
      candidate_outputs: fixture.expected_report.candidate_outputs.length,
      runtime_report_fingerprint: fixture.expected_report.runtime_report_fingerprint,
    },
    null,
    2,
  ),
);

function assertTypeAdditions() {
  for (const requiredType of [
    "ProviderAssistedExtractionRuntimeVersion",
    "ProviderAssistedExtractionRuntimeStatus",
    "ProviderAssistedExtractionRuntimeDecision",
    "ProviderAssistedExtractionRuntimeReasonCode",
    "ProviderAssistedExtractionRuntimeAuthorityBoundary",
    "ProviderAssistedExtractionRuntimeCandidatePreview",
    "ProviderAssistedExtractionRuntimeInput",
    "ProviderAssistedExtractionRuntimeDecisionRecord",
    "ProviderAssistedExtractionRuntimeReport",
    "ProviderAssistedExtractionRuntimeValidationResult",
  ]) {
    assert.ok(typeSource.includes(requiredType), `type contract must include ${requiredType}`);
  }
  for (const literal of [
    runtimeVersion,
    runtimeStatus,
    ...requiredDecisionCounts,
    "bounded_runtime_executed",
    "provider_call_still_not_executed",
    "prompt_still_not_sent",
    "provider_output_still_not_stored",
    "candidate_preview_present",
    "candidate_preview_missing",
    "candidate_preview_public_safe",
    "candidate_preview_blocked",
    "runtime_candidate_output_created",
    "runtime_request_validation_passed",
    "runtime_request_validation_failed",
    "blocked_request_not_executed",
    "accepted_output_not_truth",
    "accepted_output_not_proof",
  ]) {
    assert.ok(typeSource.includes(`"${literal}"`), `type contract must include literal ${literal}`);
  }
}

function assertHelperExports() {
  for (const exportedName of [
    "getProviderAssistedExtractionRuntimeAuthorityBoundary",
    "buildProviderAssistedExtractionRuntimeReport",
    "validateProviderAssistedExtractionRuntimeInput",
    "validateProviderAssistedExtractionRuntimeReport",
    "createProviderAssistedExtractionRuntimeReportFingerprint",
    "isSafeProviderAssistedExtractionRuntimeText",
    "isSafeProviderAssistedExtractionRuntimeRef",
  ]) {
    assert.equal(typeof runtime[exportedName], "function", `helper must export ${exportedName}`);
    assert.ok(helperSource.includes(`export function ${exportedName}`), `helper source must export ${exportedName}`);
  }
}

function assertRuntimeReportShape() {
  const requests = fixture.input_preview.requests;
  const report = fixture.expected_report;
  assert.equal(report.runtime_decisions.length, requests.length, "one runtime decision per request");
  assert.deepEqual(
    report.runtime_decisions.map((decision) => decision.request_id).sort(),
    requests.map((request) => request.request_id).sort(),
  );
  const createdDecisionIds = new Set(
    report.runtime_decisions
      .filter((decision) => decision.decision === "candidate_output_created")
      .map((decision) => decision.request_id),
  );
  assert.ok(report.candidate_outputs.length > 0, "candidate outputs must be non-empty");
  for (const output of report.candidate_outputs) {
    assert.ok(
      createdDecisionIds.has(output.request_id),
      `${output.request_id} output must belong to candidate_output_created decision`,
    );
  }
  for (const decision of report.runtime_decisions) {
    if (decision.decision === "candidate_output_created") {
      assert.ok(decision.output_refs.length > 0, `${decision.request_id} must carry output_refs`);
    } else {
      assert.equal(decision.output_refs.length, 0, `${decision.request_id} non-created decision output_refs empty`);
    }
  }
  for (const decision of requiredDecisionCounts) {
    assert.ok(report.decision_counts[decision] > 0, `decision count must cover ${decision}`);
  }
  for (const outputKind of [
    "claim_candidate",
    "source_summary_candidate",
    "knowledge_gap_signal",
  ]) {
    assert.ok(report.output_kind_counts[outputKind] > 0, `output kind count must cover ${outputKind}`);
  }
  for (const reviewStatus of ["candidate_only", "needs_review", "accepted_for_future_runtime"]) {
    assert.ok(report.review_status_counts[reviewStatus] > 0, `review status count must cover ${reviewStatus}`);
  }
  for (const output of report.candidate_outputs) {
    assert.equal(output.provider_output_included, false, `${output.output_id} provider_output_included false`);
    assert.equal(output.prompt_sent, false, `${output.output_id} prompt_sent false`);
    assert.equal(output.provider_call_executed, false, `${output.output_id} provider_call_executed false`);
    assert.equal(output.claim_or_evidence_written, false, `${output.output_id} claim_or_evidence_written false`);
    assert.equal(output.proof_or_evidence_created, false, `${output.output_id} proof_or_evidence_created false`);
    assert.equal(output.perspective_promoted, false, `${output.output_id} perspective_promoted false`);
    assert.equal(output.product_write_executed, false, `${output.output_id} product_write_executed false`);
    assert.ok(targetKinds.includes(output.output_kind), `${output.output_id} output_kind valid`);
    assert.ok(reviewStatuses.includes(output.review_status), `${output.output_id} review_status valid`);
  }
}

function assertRuntimeAuthorityBoundary(boundary, label) {
  assert.equal(boundary?.bounded_runtime_only, true, `${label} bounded_runtime_only true`);
  assert.equal(boundary?.caller_provided_input_only, true, `${label} caller_provided_input_only true`);
  for (const field of runtimeAuthorityFalseFields) {
    assert.equal(boundary?.[field], false, `${label} ${field} false`);
  }
}

function assertUnsafeCandidatePreviewRejected() {
  const input = cloneInputPreview();
  input.candidate_previews[0].bounded_output_summary = "raw provider output: example";
  const validation = runtime.validateProviderAssistedExtractionRuntimeInput(input);
  assert.equal(validation.passed, false, "unsafe candidate preview must be rejected");
  assert.ok(
    validation.failure_codes.includes("candidate_preview_bounded_output_summary_unsafe") ||
      validation.failure_codes.includes("candidate_preview_contains_unsafe_text") ||
      validation.failure_codes.includes("input_contains_unsafe_text"),
    "unsafe preview must carry unsafe failure code",
  );
}

function assertCandidatePreviewPublicSafeFalseRejected() {
  const input = cloneInputPreview();
  input.candidate_previews[0].public_safe = false;
  const validation = runtime.validateProviderAssistedExtractionRuntimeInput(input);
  assert.equal(validation.passed, false, "public_safe false preview must be rejected");
  assert.ok(
    validation.failure_codes.includes("candidate_preview_public_safe_not_true"),
    "public_safe false preview failure code required",
  );
}

function assertCandidatePreviewMissingRequestRejected() {
  const input = cloneInputPreview();
  input.candidate_previews.push({
    request_id: "provider-runtime-request-missing-999",
    output_kind: "claim_candidate",
    bounded_output_summary: "Public-safe preview for missing request id.",
    public_safe: true,
  });
  const validation = runtime.validateProviderAssistedExtractionRuntimeInput(input);
  assert.equal(validation.passed, false, "missing request_id preview must be rejected");
  assert.ok(
    validation.failure_codes.includes("candidate_preview_request_id_not_found"),
    "missing request id failure code required",
  );
}

function assertReportAuthorityGrantRejected() {
  const report = cloneExpectedReport();
  report.authority_boundary.provider_call_now = true;
  recomputeReportFingerprint(report);
  const validation = runtime.validateProviderAssistedExtractionRuntimeReport(report);
  assert.equal(validation.passed, false, "provider_call_now true must be rejected");
  assert.ok(
    validation.failure_codes.includes("authority_boundary_grants_forbidden_authority"),
    "authority grant failure code required",
  );
}

function assertCandidateOutputProviderOutputRejected() {
  const report = cloneExpectedReport();
  report.candidate_outputs[0].provider_output_included = true;
  recomputeReportFingerprint(report);
  const validation = runtime.validateProviderAssistedExtractionRuntimeReport(report);
  assert.equal(validation.passed, false, "provider_output_included true must be rejected");
  assert.ok(
    validation.failure_codes.includes("provider_output_included_granted"),
    "provider_output_included grant failure code required",
  );
}

function assertCandidateOutputPromptSentRejected() {
  const report = cloneExpectedReport();
  report.candidate_outputs[0].prompt_sent = true;
  recomputeReportFingerprint(report);
  const validation = runtime.validateProviderAssistedExtractionRuntimeReport(report);
  assert.equal(validation.passed, false, "prompt_sent true must be rejected");
  assert.ok(validation.failure_codes.includes("prompt_sent_granted"), "prompt_sent grant failure code required");
}

function assertCandidateOutputClaimWriteRejected() {
  const report = cloneExpectedReport();
  report.candidate_outputs[0].claim_or_evidence_written = true;
  recomputeReportFingerprint(report);
  const validation = runtime.validateProviderAssistedExtractionRuntimeReport(report);
  assert.equal(validation.passed, false, "claim_or_evidence_written true must be rejected");
  assert.ok(
    validation.failure_codes.includes("claim_or_evidence_written_granted"),
    "claim/evidence write grant failure code required",
  );
}

function assertCandidateOutputForBlockedDecisionRejected() {
  const report = cloneExpectedReport();
  const blockedDecision = report.runtime_decisions.find((decision) =>
    decision.decision.startsWith("blocked_"),
  );
  assert.ok(blockedDecision, "blocked decision must exist");
  const output = JSON.parse(JSON.stringify(report.candidate_outputs[0]));
  output.request_id = blockedDecision.request_id;
  output.output_id = `${output.output_id}:blocked-regression`;
  output.candidate_ref = `${output.candidate_ref}:blocked-regression`;
  report.candidate_outputs.push(output);
  recomputeReportFingerprint(report);
  const validation = runtime.validateProviderAssistedExtractionRuntimeReport(report);
  assert.equal(validation.passed, false, "candidate output for blocked decision must be rejected");
  assert.ok(
    validation.failure_codes.includes("candidate_output_for_blocked_or_rejected_decision") ||
      validation.failure_codes.includes("candidate_output_for_noncreated_decision"),
    "blocked decision output failure code required",
  );
}

function assertHelperSourceBoundary() {
  for (const forbiddenText of [
    "readFileSync",
    "writeFileSync",
    "fetch(",
    "XMLHttpRequest",
    "WebSocket",
    "new OpenAI",
    "openai.chat",
    "openai.responses",
    "provider call",
    "actual prompt:",
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
  for (const forbiddenText of [
    "/Users/",
    "/home/",
    "file://",
    "http://private",
    "https://private",
    "sk-",
    "ghp_",
    "OPENAI_API_KEY",
    "GITHUB_TOKEN",
    "password:",
    "secret:",
    "private key",
    "raw provider output",
    "provider response:",
    "actual prompt:",
    "raw conversation",
    "hidden reasoning",
    "raw DB row",
    "raw_db_row",
    "browser dump",
    "raw browser dump",
    "raw source body",
    "provider transcript",
  ]) {
    assert.ok(!fixtureText.includes(forbiddenText), `fixture must not contain ${forbiddenText}`);
  }
}

function assertDocCoverage() {
  for (const requiredPhrase of [
    "Product-write remains parked by #686.",
    "Candidate output is not truth.",
    "Candidate output is not proof/evidence.",
    "accepted_for_future_provider_run is not provider execution.",
    "accepted_for_future_runtime is not runtime execution.",
    "bounded prompt summary is not prompt execution.",
    "prompt descriptor is not prompt text.",
    "candidate preview is caller-provided bounded input, not provider output.",
    "Source refs are lineage pointers, not proof.",
    "Source refs must be public-safe symbolic refs.",
    "Bounded summary refs are lineage metadata, not proof.",
    "Raw provider outputs must not be stored.",
    "integrated development roadmap guide v0.2",
    "background inputs already integrated into the roadmap guide",
  ]) {
    assert.ok(doc.includes(requiredPhrase), `doc must include exact phrase: ${requiredPhrase}`);
  }
}

function assertNoForbiddenPositiveAuthorityGrants(source, label) {
  for (const field of runtimeAuthorityFalseFields) {
    assert.ok(!source.includes(`${field}: true`), `${label} must not grant ${field}`);
  }
}

function assertIndexCoverage() {
  assert.ok(indexDoc.includes(docPath), "index must point to provider-assisted extraction runtime doc");
  const block = extractIndexBlock(indexDoc, "Provider-Assisted Extraction Runtime v0.1");
  for (const requiredText of [
    "bounded-runtime-only",
    "follows the integrated roadmap guide v0.2",
    "follows #776",
    "processes caller-provided candidate previews only",
  ]) {
    assert.ok(block.includes(requiredText), `index block must include ${requiredText}`);
  }
  for (const forbiddenPattern of [
    /provider calls? (was|were|is) added/i,
    /prompt sending (was|were|is) added/i,
    /provider output storage (was|were|is) added/i,
    /source fetch (was|were|is) added/i,
    /local file read (was|were|is) added/i,
    /repository file read (was|were|is) added/i,
    /uploaded file read (was|were|is) added/i,
    /raw source storage (was|were|is) added/i,
    /route (was|were|is) added/i,
    /UI (was|were|is) added/i,
    /retrieval (was|were|is) added/i,
    /DB query\/write (was|were|is) added/i,
    /proof\/evidence (was|were|is) added/i,
    /claim\/evidence write (was|were|is) added/i,
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

function cloneInputPreview() {
  return JSON.parse(JSON.stringify(fixture.input_preview));
}

function cloneExpectedReport() {
  return JSON.parse(JSON.stringify(fixture.expected_report));
}

function recomputeReportFingerprint(report) {
  report.runtime_report_fingerprint =
    runtime.createProviderAssistedExtractionRuntimeReportFingerprint(report);
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
