import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const docPath = "docs/PROVIDER_ASSISTED_EXTRACTION_CANDIDATE_ONLY_CONTRACT_V0_1.md";
const fixturePath = "fixtures/provider-assisted-extraction-candidate-only-contract.sample.v0.1.json";
const typePath = "types/provider-assisted-extraction-candidate-only-contract.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const contractVersion = "provider_assisted_extraction_candidate_only_contract.v0.1";
const requestVersion = "provider_assisted_extraction_candidate_request.v0.1";
const promptDescriptorVersion = "provider_assisted_extraction_prompt_descriptor.v0.1";
const outputVersion = "provider_assisted_extraction_candidate_output.v0.1";
const bundleVersion = "provider_assisted_extraction_candidate_contract_bundle.v0.1";
const scope = "project:augnes";
const status = "candidate_contract_only";
const packageScriptName = "smoke:provider-assisted-extraction-candidate-only-contract-v0-1";
const packageScriptValue =
  "node scripts/smoke-provider-assisted-extraction-candidate-only-contract-v0-1.mjs";

const inputKinds = [
  "bounded_source_intake_result_envelope",
  "bounded_source_intake_runtime_report",
  "bounded_summary_ref",
  "source_ref",
  "review_memory_ref",
  "manual_bounded_context",
  "unknown",
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

const extractionModes = [
  "summarize_only",
  "candidate_claim_extraction",
  "candidate_evidence_mapping",
  "gap_signal_detection",
  "contradiction_signal_detection",
  "calibration_signal_detection",
  "logical_shape_hinting",
  "metadata_only",
  "unknown",
];

const requestStatuses = [
  "candidate_only",
  "needs_operator_review",
  "blocked_private_or_raw_payload",
  "blocked_missing_bounded_source",
  "blocked_unsupported_target",
  "accepted_for_future_provider_run",
  "rejected",
];

const reviewStatuses = [
  "candidate_only",
  "needs_review",
  "rejected",
  "accepted_for_future_runtime",
  "superseded",
];

const privacyClasses = [
  "public_safe_bounded_input",
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

const confidencePreviews = ["low", "medium", "high"];

const reasonCodes = [
  "bounded_source_ref_present",
  "bounded_source_ref_missing",
  "bounded_summary_ref_present",
  "bounded_summary_ref_missing",
  "source_ref_present",
  "source_ref_missing",
  "input_kind_supported",
  "input_kind_unknown",
  "target_kind_supported",
  "target_kind_unknown",
  "prompt_descriptor_present",
  "prompt_descriptor_missing",
  "prompt_not_sent",
  "provider_call_not_executed",
  "provider_output_not_stored",
  "source_fetch_not_executed",
  "local_file_read_not_executed",
  "retrieval_not_executed",
  "raw_payload_blocked",
  "secret_like_pattern_blocked",
  "operator_review_required",
  "candidate_output_shape_defined",
  "candidate_only_not_truth",
  "source_ref_not_proof",
  "accepted_for_future_provider_run_not_execution",
  "product_write_denied",
];

const authorityFalseFields = [
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

assert.equal(fixture.fixture_version, "provider_assisted_extraction_candidate_only_contract.sample.v0.1");
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.request_version, requestVersion);
assert.equal(fixture.prompt_descriptor_version, promptDescriptorVersion);
assert.equal(fixture.output_version, outputVersion);
assert.equal(fixture.bundle_version, bundleVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.status, status);
assert.equal(bundle?.status, status);
assert.ok(Array.isArray(bundle?.requests) && bundle.requests.length > 0, "bundle requests must be non-empty");
assert.ok(
  Array.isArray(bundle?.candidate_outputs) && bundle.candidate_outputs.length > 0,
  "bundle candidate_outputs must be non-empty",
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
      smoke: "provider-assisted-extraction-candidate-only-contract-v0-1",
      final_status: "pass",
      contract_version: fixture.contract_version,
      status: fixture.status,
      requests: bundle.requests.length,
      candidate_outputs: bundle.candidate_outputs.length,
      bundle_fingerprint: bundle.bundle_fingerprint,
    },
    null,
    2,
  ),
);

function assertTypeContractCoverage() {
  for (const exportedName of [
    "ProviderAssistedExtractionCandidateOnlyContractVersion",
    "ProviderAssistedExtractionScope",
    "ProviderAssistedExtractionContractStatus",
    "ProviderAssistedExtractionRequestVersion",
    "ProviderAssistedExtractionPromptDescriptorVersion",
    "ProviderAssistedExtractionCandidateOutputVersion",
    "ProviderAssistedExtractionContractBundleVersion",
    "ProviderAssistedExtractionInputKind",
    "ProviderAssistedExtractionTargetKind",
    "ProviderAssistedExtractionMode",
    "ProviderAssistedExtractionRequestStatus",
    "ProviderAssistedExtractionCandidateReviewStatus",
    "ProviderAssistedExtractionPrivacyClass",
    "ProviderAssistedExtractionRedactionStatus",
    "ProviderAssistedExtractionConfidencePreview",
    "ProviderAssistedExtractionReasonCode",
    "ProviderAssistedExtractionAuthorityBoundary",
    "ProviderAssistedExtractionInputRef",
    "ProviderAssistedExtractionPromptDescriptor",
    "ProviderAssistedExtractionCandidateRequest",
    "ProviderAssistedExtractionCandidateOutput",
    "ProviderAssistedExtractionContractBundle",
    "ProviderAssistedExtractionValidationResult",
  ]) {
    assert.ok(typeSource.includes("export ") && typeSource.includes(exportedName), `${exportedName} export missing`);
  }
  for (const literal of [
    contractVersion,
    scope,
    status,
    requestVersion,
    promptDescriptorVersion,
    outputVersion,
    bundleVersion,
    ...inputKinds,
    ...targetKinds,
    ...extractionModes,
    ...requestStatuses,
    ...reviewStatuses,
    ...privacyClasses,
    ...redactionStatuses,
    ...confidencePreviews,
    ...reasonCodes,
  ]) {
    assert.ok(typeSource.includes(`"${literal}"`), `type contract must include literal ${literal}`);
  }
}

function assertVocabularyCoverage() {
  const bundleInputKinds = new Set();
  const bundleTargetKinds = new Set();
  const bundleExtractionModes = new Set(bundle.requests.map((request) => request.extraction_mode));
  const bundleRequestStatuses = new Set(bundle.requests.map((request) => request.request_status));
  const bundleReviewStatuses = new Set(bundle.candidate_outputs.map((output) => output.review_status));
  const bundlePrivacyClasses = new Set();
  const bundleRedactionStatuses = new Set();
  const bundleReasonCodes = new Set();

  for (const request of bundle.requests) {
    for (const targetKind of request.target_kinds ?? []) {
      bundleTargetKinds.add(targetKind);
    }
    for (const code of request.reason_codes ?? []) {
      bundleReasonCodes.add(code);
    }
    for (const inputRef of request.input_refs ?? []) {
      bundleInputKinds.add(inputRef.input_kind);
      bundlePrivacyClasses.add(inputRef.privacy_class);
      bundleRedactionStatuses.add(inputRef.redaction_status);
      for (const code of inputRef.reason_codes ?? []) {
        bundleReasonCodes.add(code);
      }
    }
    for (const code of request.prompt_descriptor?.reason_codes ?? []) {
      bundleReasonCodes.add(code);
    }
  }

  for (const output of bundle.candidate_outputs) {
    bundleTargetKinds.add(output.output_kind);
    for (const code of output.reason_codes ?? []) {
      bundleReasonCodes.add(code);
    }
  }

  assertIncludesAll(bundleInputKinds, inputKinds, "input kinds");
  assertIncludesAll(bundleTargetKinds, targetKinds, "target kinds");
  assertIncludesAll(bundleExtractionModes, extractionModes, "extraction modes");
  assertIncludesAll(bundleRequestStatuses, requestStatuses, "request statuses");
  assertIncludesAll(bundleReviewStatuses, reviewStatuses, "review statuses");
  assertIncludesAll(bundlePrivacyClasses, privacyClasses, "privacy classes");
  assertIncludesAll(bundleRedactionStatuses, redactionStatuses, "redaction statuses");
  assertIncludesAll(bundleReasonCodes, reasonCodes, "reason codes");
  assert.ok(
    bundle.requests.some((request) => request.request_status === "accepted_for_future_provider_run"),
    "at least one request must be accepted_for_future_provider_run",
  );
  assert.ok(
    bundle.requests.some((request) => request.request_status === "blocked_missing_bounded_source"),
    "at least one request must be blocked_missing_bounded_source",
  );
  assert.ok(
    bundle.requests.some((request) => request.request_status === "blocked_private_or_raw_payload"),
    "at least one request must be blocked_private_or_raw_payload",
  );
  assert.ok(
    bundle.requests.some((request) => request.request_status === "blocked_unsupported_target"),
    "at least one request must be blocked_unsupported_target",
  );
  assert.ok(
    bundle.requests.some((request) => request.input_refs?.some((inputRef) => inputRef.input_kind === "unknown")),
    "at least one request must use unknown input kind",
  );
  assert.ok(
    bundle.requests.some((request) => request.target_kinds?.includes("unknown")),
    "at least one request must use unknown target kind",
  );
  for (const outputKind of [
    "claim_candidate",
    "evidence_candidate",
    "source_summary_candidate",
    "knowledge_gap_signal",
    "contradiction_signal",
    "calibration_signal",
    "logical_shape_hint",
  ]) {
    assert.ok(
      bundle.candidate_outputs.some((output) => output.output_kind === outputKind),
      `candidate_outputs must include ${outputKind}`,
    );
  }
  assert.ok(
    bundle.candidate_outputs.some((output) => output.review_status === "accepted_for_future_runtime"),
    "at least one output must be accepted_for_future_runtime",
  );
}

function assertBundleShape() {
  assert.equal(bundle.bundle_version, bundleVersion);
  assert.equal(bundle.contract_version, contractVersion);
  assert.equal(bundle.scope, scope);
  assert.equal(bundle.status, status);
  assert.ok(typeof bundle.as_of === "string" && bundle.as_of.length > 0, "bundle as_of required");
  assert.ok(Array.isArray(bundle.source_fixture_refs), "bundle source_fixture_refs must be array");
  assertSafeAuthorityBoundary(bundle.authority_boundary, "bundle authority_boundary");

  for (const request of bundle.requests) {
    assert.equal(request.request_version, requestVersion);
    assert.equal(request.contract_version, contractVersion);
    assert.equal(request.scope, scope);
    assertNonEmptyString(request.request_id, "request_id");
    assert.ok(requestStatuses.includes(request.request_status), `${request.request_id} request_status invalid`);
    assert.ok(Array.isArray(request.input_refs), `${request.request_id} input_refs must be array`);
    assert.ok(Array.isArray(request.target_kinds), `${request.request_id} target_kinds must be array`);
    for (const targetKind of request.target_kinds) {
      assert.ok(targetKinds.includes(targetKind), `${request.request_id} target kind invalid: ${targetKind}`);
    }
    assert.ok(extractionModes.includes(request.extraction_mode), `${request.request_id} extraction_mode invalid`);
    assert.ok(request.prompt_descriptor, `${request.request_id} prompt_descriptor required`);
    assertNonEmptyString(request.bounded_purpose, `${request.request_id} bounded_purpose`);
    assert.ok(
      Array.isArray(request.expected_candidate_output_refs),
      `${request.request_id} expected_candidate_output_refs must be array`,
    );
    assert.ok(Array.isArray(request.boundary_notes), `${request.request_id} boundary_notes must be array`);
    assertReasonCodes(request.reason_codes, `${request.request_id} reason_codes`);
    assertSafeAuthorityBoundary(request.authority_boundary, `${request.request_id} authority_boundary`);
    for (const inputRef of request.input_refs) {
      assertInputRef(inputRef, request.request_id);
    }
    assertPromptDescriptor(request.prompt_descriptor, request.request_id);
  }

  for (const output of bundle.candidate_outputs) {
    assert.equal(output.output_version, outputVersion);
    assert.equal(output.contract_version, contractVersion);
    assert.equal(output.scope, scope);
    assertNonEmptyString(output.request_id, "output request_id");
    assertNonEmptyString(output.output_id, "output_id");
    assert.ok(targetKinds.includes(output.output_kind), `${output.output_id} output_kind invalid`);
    assertNonEmptyString(output.candidate_ref, `${output.output_id} candidate_ref`);
    assertNonEmptyString(output.bounded_output_summary, `${output.output_id} bounded_output_summary`);
    assert.ok(Array.isArray(output.source_refs), `${output.output_id} source_refs must be array`);
    assert.ok(Array.isArray(output.bounded_summary_refs), `${output.output_id} bounded_summary_refs must be array`);
    assert.ok(
      confidencePreviews.includes(output.confidence_preview),
      `${output.output_id} confidence_preview invalid`,
    );
    assert.ok(reviewStatuses.includes(output.review_status), `${output.output_id} review_status invalid`);
    assert.equal(output.provider_output_included, false, `${output.output_id} provider_output_included must be false`);
    assert.equal(output.prompt_sent, false, `${output.output_id} prompt_sent must be false`);
    assert.equal(output.provider_call_executed, false, `${output.output_id} provider_call_executed must be false`);
    assert.equal(output.claim_or_evidence_written, false, `${output.output_id} claim_or_evidence_written must be false`);
    assert.equal(output.proof_or_evidence_created, false, `${output.output_id} proof_or_evidence_created must be false`);
    assert.equal(output.perspective_promoted, false, `${output.output_id} perspective_promoted must be false`);
    assert.equal(output.product_write_executed, false, `${output.output_id} product_write_executed must be false`);
    assertReasonCodes(output.reason_codes, `${output.output_id} reason_codes`);
    assertSafeAuthorityBoundary(output.authority_boundary, `${output.output_id} authority_boundary`);
  }
}

function assertInputRef(inputRef, requestId) {
  assert.ok(inputKinds.includes(inputRef.input_kind), `${requestId} input_kind invalid`);
  assertNonEmptyString(inputRef.input_ref, `${requestId} input_ref`);
  assert.ok(Array.isArray(inputRef.source_refs), `${requestId} source_refs must be array`);
  assert.ok(Array.isArray(inputRef.bounded_summary_refs), `${requestId} bounded_summary_refs must be array`);
  assert.equal(typeof inputRef.public_safe, "boolean", `${requestId} public_safe must be boolean`);
  assert.ok(privacyClasses.includes(inputRef.privacy_class), `${requestId} privacy_class invalid`);
  assert.ok(redactionStatuses.includes(inputRef.redaction_status), `${requestId} redaction_status invalid`);
  assertReasonCodes(inputRef.reason_codes, `${requestId} input_ref reason_codes`);
}

function assertPromptDescriptor(promptDescriptor, requestId) {
  assert.equal(promptDescriptor.prompt_descriptor_version, promptDescriptorVersion);
  assert.equal(promptDescriptor.scope, scope);
  assertNonEmptyString(promptDescriptor.prompt_descriptor_id, `${requestId} prompt_descriptor_id`);
  assert.ok(extractionModes.includes(promptDescriptor.mode), `${requestId} prompt descriptor mode invalid`);
  assertNonEmptyString(promptDescriptor.bounded_prompt_summary, `${requestId} bounded_prompt_summary`);
  assert.ok(Array.isArray(promptDescriptor.allowed_input_refs), `${requestId} allowed_input_refs must be array`);
  assert.ok(Array.isArray(promptDescriptor.forbidden_input_classes), `${requestId} forbidden_input_classes must be array`);
  assert.ok(redactionStatuses.includes(promptDescriptor.redaction_status), `${requestId} prompt redaction_status invalid`);
  assert.equal(typeof promptDescriptor.public_safe, "boolean", `${requestId} prompt public_safe must be boolean`);
  assertReasonCodes(promptDescriptor.reason_codes, `${requestId} prompt reason_codes`);
  assert.ok(promptDescriptor.reason_codes.includes("prompt_not_sent"), `${requestId} prompt_not_sent reason missing`);
  assert.ok(
    promptDescriptor.reason_codes.includes("provider_call_not_executed"),
    `${requestId} provider_call_not_executed reason missing`,
  );
  assertSafeAuthorityBoundary(promptDescriptor.authority_boundary, `${requestId} prompt authority_boundary`);
}

function assertBundleFingerprint() {
  assertNonEmptyString(bundle.bundle_fingerprint, "bundle_fingerprint");
  const hashInput = structuredClone(bundle);
  delete hashInput.bundle_fingerprint;
  const expectedFingerprint = createHash("sha256").update(JSON.stringify(canonicalJson(hashInput))).digest("hex");
  assert.equal(bundle.bundle_fingerprint, expectedFingerprint, "bundle_fingerprint must match canonical JSON hash");
}

function assertFixtureSafety() {
  const allowedPlaceholders = [
    "raw private payload blocked by contract fixture",
    "secret-like provider input blocked by contract fixture",
  ];
  let text = fixtureText;
  for (const placeholder of allowedPlaceholders) {
    text = text.split(placeholder).join("");
  }
  const forbiddenMarkers = [
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
    "actual prompt:",
    "provider response:",
  ];
  for (const marker of forbiddenMarkers) {
    assert.ok(!text.includes(marker), `fixture must not contain forbidden marker ${marker}`);
  }
}

function assertDocCoverage() {
  for (const phrase of [
    "Product-write remains parked by #686.",
    "Candidate output is not truth.",
    "Candidate output is not proof/evidence.",
    "accepted_for_future_provider_run is not provider execution.",
    "accepted_for_future_runtime is not runtime execution.",
    "bounded prompt summary is not prompt execution.",
    "Source refs are lineage pointers, not proof.",
    "Source refs must be public-safe symbolic refs.",
    "Bounded summary refs are lineage metadata, not proof.",
    "Raw provider outputs must not be stored.",
    "integrated development roadmap guide v0.2",
    "background inputs already integrated into the roadmap guide",
  ]) {
    assert.ok(doc.includes(phrase), `doc must include exact phrase: ${phrase}`);
  }
}

function assertIndexCoverage() {
  assert.ok(
    indexDoc.includes("docs/PROVIDER_ASSISTED_EXTRACTION_CANDIDATE_ONLY_CONTRACT_V0_1.md"),
    "index must point to provider-assisted extraction candidate-only contract doc",
  );
  const indexBlock = extractIndexBlock(indexDoc, "Provider-Assisted Extraction Candidate-Only Contract v0.1");
  for (const phrase of [
    "candidate-contract-only",
    "follows the integrated roadmap guide v0.2",
    "follows #774 and #775",
    "does not implement prompt sending, provider calls, provider output storage, source fetch, local/repository/uploaded file reads, raw source storage, route, UI, retrieval, DB query/write, proof/evidence, claim/evidence writes, promotion, GitHub automation, Git Ledger, or product write",
  ]) {
    assert.ok(indexBlock.includes(phrase), `index block must include phrase: ${phrase}`);
  }
  for (const forbidden of [
    "provider runtime was added",
    "provider runtime is added",
    "prompt sending was added",
    "provider output storage was added",
    "source fetch was added",
    "local file read was added",
    "repository file read was added",
    "uploaded file read was added",
    "raw source storage was added",
    "route was added",
    "UI was added",
    "retrieval was added",
    "DB query/write was added",
    "promotion was added",
    "Codex execution was added",
    "GitHub automation was added",
    "Git Ledger export was added",
    "product write was added",
    "product ID allocation was added",
  ]) {
    assert.ok(!indexBlock.includes(forbidden), `index block must not imply ${forbidden}`);
  }
}

function assertNoForbiddenPositiveAuthorityGrants(source, label) {
  for (const field of authorityFalseFields) {
    const forbidden = `${field}: true`;
    assert.ok(!source.includes(forbidden), `${label} must not contain ${forbidden}`);
  }
}

function assertSafeAuthorityBoundary(boundary, label) {
  assert.ok(boundary, `${label} required`);
  assert.equal(boundary.candidate_contract_only, true, `${label}.candidate_contract_only must be true`);
  for (const field of authorityFalseFields) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function assertReasonCodes(codes, label) {
  assert.ok(Array.isArray(codes), `${label} must be array`);
  for (const code of codes) {
    assert.ok(reasonCodes.includes(code), `${label} contains invalid reason code ${code}`);
  }
}

function assertIncludesAll(actualSet, expectedValues, label) {
  for (const expectedValue of expectedValues) {
    assert.ok(actualSet.has(expectedValue), `${label} missing ${expectedValue}`);
  }
}

function assertNonEmptyString(value, label) {
  assert.equal(typeof value, "string", `${label} must be string`);
  assert.ok(value.length > 0, `${label} must be non-empty`);
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalJson);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalJson(value[key])]));
  }
  return value;
}

function extractIndexBlock(source, heading) {
  const start = source.indexOf(`- ${heading}:`);
  assert.ok(start >= 0, `index block for ${heading} missing`);
  const next = source.indexOf("\n- ", start + 1);
  return next >= 0 ? source.slice(start, next) : source.slice(start);
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}
