import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const docPath = "docs/RESEARCH_RETRIEVAL_RAG_RUNTIME_V0_1.md";
const fixturePath = "fixtures/research-retrieval-runtime-contract.sample.v0.1.json";
const typePath = "types/research-retrieval-runtime-contract.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const contractVersion = "research_retrieval_runtime_contract.v0.1";
const requestVersion = "research_retrieval_request.v0.1";
const corpusDescriptorVersion = "research_retrieval_corpus_descriptor.v0.1";
const queryDescriptorVersion = "research_retrieval_query_descriptor.v0.1";
const candidateVersion = "research_retrieval_candidate.v0.1";
const resultVersion = "research_retrieval_result_envelope.v0.1";
const bundleVersion = "research_retrieval_contract_bundle.v0.1";
const scope = "project:augnes";
const status = "contract_only";
const roadmapRef = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const packageScriptName = "smoke:research-retrieval-runtime-contract-v0-1";
const packageScriptValue = "node scripts/smoke-research-retrieval-runtime-contract-v0-1.mjs";

const inputKinds = [
  "bounded_source_intake_result_envelope",
  "bounded_source_intake_runtime_report",
  "provider_assisted_extraction_candidate_output",
  "review_memory_ref",
  "candidate_summary_ref",
  "perspective_delta_summary_ref",
  "formation_receipt_summary_ref",
  "feedback_summary_ref",
  "source_ref",
  "manual_bounded_context",
  "unknown",
];

const corpusKinds = [
  "source_ref_metadata_set",
  "candidate_summary_set",
  "review_note_set",
  "perspective_delta_summary_set",
  "formation_receipt_summary_set",
  "feedback_summary_set",
  "manual_bounded_context_set",
  "unknown",
];

const retrievalModes = [
  "metadata_lookup",
  "lexical_candidate_retrieval",
  "semantic_candidate_retrieval",
  "hybrid_candidate_retrieval",
  "rerank_candidate_preview",
  "rag_context_preview",
  "citation_context_preview",
  "no_retrieval",
  "unknown",
];

const requestStatuses = [
  "candidate_only",
  "needs_operator_review",
  "blocked_private_or_raw_payload",
  "blocked_missing_corpus",
  "blocked_unsupported_mode",
  "accepted_for_future_runtime",
  "rejected",
];

const candidateKinds = [
  "source_ref_candidate",
  "candidate_summary_candidate",
  "review_note_candidate",
  "provider_candidate_output_ref",
  "perspective_delta_summary_candidate",
  "formation_receipt_summary_candidate",
  "feedback_summary_candidate",
  "gap_context_candidate",
  "contradiction_context_candidate",
  "citation_context_candidate",
  "rag_context_candidate",
  "unknown",
];

const privacyClasses = [
  "public_safe_refs_only",
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

const scoreBands = ["none", "low", "medium", "high"];

const reviewStatuses = [
  "candidate_only",
  "needs_review",
  "rejected",
  "accepted_for_future_runtime",
  "superseded",
];

const reasonCodes = [
  "roadmap_file_present",
  "roadmap_file_missing",
  "corpus_ref_present",
  "corpus_ref_missing",
  "query_ref_present",
  "query_ref_missing",
  "source_ref_present",
  "source_ref_missing",
  "candidate_summary_ref_present",
  "candidate_summary_ref_missing",
  "review_memory_ref_present",
  "review_memory_ref_missing",
  "durable_summary_ref_present",
  "durable_summary_ref_missing",
  "input_kind_supported",
  "input_kind_unknown",
  "corpus_kind_supported",
  "corpus_kind_unknown",
  "retrieval_mode_supported",
  "retrieval_mode_unknown",
  "candidate_kind_supported",
  "candidate_kind_unknown",
  "raw_payload_blocked",
  "secret_like_pattern_blocked",
  "private_location_blocked",
  "operator_review_required",
  "retrieval_not_executed",
  "rag_not_executed",
  "embedding_not_created",
  "vector_search_not_executed",
  "index_read_not_executed",
  "index_write_not_executed",
  "corpus_scan_not_executed",
  "rerank_not_executed",
  "provider_call_not_executed",
  "prompt_not_sent",
  "provider_output_not_stored",
  "retrieval_output_not_stored",
  "source_fetch_not_executed",
  "local_file_read_not_executed",
  "repository_file_read_not_executed",
  "uploaded_file_read_not_executed",
  "db_query_not_executed",
  "db_write_not_executed",
  "candidate_context_not_truth",
  "retrieval_result_not_evidence",
  "retrieval_score_not_truth_score",
  "retrieval_score_not_promotion_readiness",
  "rag_answer_context_preview_only",
  "source_ref_not_proof",
  "accepted_for_future_runtime_not_execution",
  "product_write_denied",
];

const authorityFalseFields = [
  "retrieval_runtime_now",
  "rag_execution_now",
  "query_execution_now",
  "embedding_created_now",
  "vector_search_now",
  "rerank_now",
  "index_read_now",
  "index_write_now",
  "corpus_scan_now",
  "source_fetch_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "raw_source_body_storage_now",
  "raw_retrieval_output_storage_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "provider_output_stored_now",
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

const executionFalseFields = [
  "retrieval_executed",
  "rag_executed",
  "embedding_created",
  "vector_search_executed",
  "index_read_executed",
  "index_write_executed",
  "corpus_scan_executed",
  "rerank_executed",
  "provider_call_executed",
  "prompt_sent",
  "provider_output_stored",
  "retrieval_output_stored",
  "proof_or_evidence_created",
  "claim_or_evidence_written",
  "product_write_executed",
];

for (const filePath of [roadmapPath, docPath, fixturePath, typePath, packagePath, indexPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const roadmap = readFile(roadmapPath);
const doc = readFile(docPath);
const fixtureText = readFile(fixturePath);
const fixture = JSON.parse(fixtureText);
const typeSource = readFile(typePath);
const packageJson = JSON.parse(readFile(packagePath));
const indexDoc = readFile(indexPath);
const bundle = fixture.expected_bundle;

assert.ok(
  roadmap.includes("research_retrieval_runtime_contract_v0_1"),
  "roadmap file must contain research_retrieval_runtime_contract_v0_1",
);
assert.ok(roadmap.includes("Product-write remains parked"), "roadmap file must contain Product-write remains parked");

assert.equal(fixture.fixture_version, "research_retrieval_runtime_contract.sample.v0.1");
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.request_version, requestVersion);
assert.equal(fixture.corpus_descriptor_version, corpusDescriptorVersion);
assert.equal(fixture.query_descriptor_version, queryDescriptorVersion);
assert.equal(fixture.candidate_version, candidateVersion);
assert.equal(fixture.result_version, resultVersion);
assert.equal(fixture.bundle_version, bundleVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.status, status);
assert.equal(bundle?.status, status);
assert.equal(bundle?.roadmap_ref, roadmapRef);
assert.ok(Array.isArray(bundle?.requests) && bundle.requests.length > 0, "expected_bundle.requests must be non-empty");
assert.ok(
  Array.isArray(bundle?.candidates) && bundle.candidates.length > 0,
  "expected_bundle.candidates must be non-empty",
);
assert.ok(
  Array.isArray(bundle?.result_envelopes) && bundle.result_envelopes.length > 0,
  "expected_bundle.result_envelopes must be non-empty",
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
      smoke: "research-retrieval-runtime-contract-v0-1",
      final_status: "pass",
      contract_version: fixture.contract_version,
      status: fixture.status,
      requests: bundle.requests.length,
      candidates: bundle.candidates.length,
      result_envelopes: bundle.result_envelopes.length,
      bundle_fingerprint: bundle.bundle_fingerprint,
    },
    null,
    2,
  ),
);

function assertTypeContractCoverage() {
  for (const exportedName of [
    "ResearchRetrievalRuntimeContractVersion",
    "ResearchRetrievalScope",
    "ResearchRetrievalContractStatus",
    "ResearchRetrievalRequestVersion",
    "ResearchRetrievalCorpusDescriptorVersion",
    "ResearchRetrievalQueryDescriptorVersion",
    "ResearchRetrievalCandidateVersion",
    "ResearchRetrievalResultEnvelopeVersion",
    "ResearchRetrievalContractBundleVersion",
    "ResearchRetrievalInputKind",
    "ResearchRetrievalCorpusKind",
    "ResearchRetrievalMode",
    "ResearchRetrievalRequestStatus",
    "ResearchRetrievalCandidateKind",
    "ResearchRetrievalPrivacyClass",
    "ResearchRetrievalRedactionStatus",
    "ResearchRetrievalScoreBand",
    "ResearchRetrievalReviewStatus",
    "ResearchRetrievalReasonCode",
    "ResearchRetrievalAuthorityBoundary",
    "ResearchRetrievalInputRef",
    "ResearchRetrievalCorpusDescriptor",
    "ResearchRetrievalQueryDescriptor",
    "ResearchRetrievalRequest",
    "ResearchRetrievalCandidate",
    "ResearchRetrievalResultEnvelope",
    "ResearchRetrievalContractBundle",
    "ResearchRetrievalValidationResult",
  ]) {
    assert.ok(typeSource.includes("export ") && typeSource.includes(exportedName), `${exportedName} export missing`);
  }
  for (const literal of [
    contractVersion,
    scope,
    status,
    requestVersion,
    corpusDescriptorVersion,
    queryDescriptorVersion,
    candidateVersion,
    resultVersion,
    bundleVersion,
    ...inputKinds,
    ...corpusKinds,
    ...retrievalModes,
    ...requestStatuses,
    ...candidateKinds,
    ...privacyClasses,
    ...redactionStatuses,
    ...scoreBands,
    ...reviewStatuses,
    ...reasonCodes,
  ]) {
    assert.ok(typeSource.includes(`"${literal}"`), `type contract must include literal ${literal}`);
  }
  for (const field of authorityFalseFields) {
    assert.ok(typeSource.includes(`${field}: false`), `type authority boundary must include ${field}: false`);
  }
}

function assertVocabularyCoverage() {
  const bundleInputKinds = new Set();
  const bundleCorpusKinds = new Set(bundle.requests.map((request) => request.corpus_descriptor?.corpus_kind));
  const bundleRetrievalModes = new Set(bundle.requests.map((request) => request.query_descriptor?.retrieval_mode));
  const bundleRequestStatuses = new Set(bundle.requests.map((request) => request.request_status));
  const bundleCandidateKinds = new Set(bundle.candidates.map((candidate) => candidate.candidate_kind));
  const bundleReviewStatuses = new Set(bundle.candidates.map((candidate) => candidate.review_status));
  const bundlePrivacyClasses = new Set();
  const bundleRedactionStatuses = new Set();
  const bundleReasonCodes = new Set();

  assertReasonCodes(fixture.reason_code_coverage, "fixture reason_code_coverage");
  addReasonCodes(bundleReasonCodes, fixture.reason_code_coverage);

  for (const request of bundle.requests) {
    addReasonCodes(bundleReasonCodes, request.reason_codes);
    addReasonCodes(bundleReasonCodes, request.corpus_descriptor?.reason_codes);
    addReasonCodes(bundleReasonCodes, request.query_descriptor?.reason_codes);
    bundlePrivacyClasses.add(request.corpus_descriptor?.privacy_class);
    bundleRedactionStatuses.add(request.corpus_descriptor?.redaction_status);
    bundleRedactionStatuses.add(request.query_descriptor?.redaction_status);
    for (const inputRef of request.corpus_descriptor?.input_refs ?? []) {
      bundleInputKinds.add(inputRef.input_kind);
      bundlePrivacyClasses.add(inputRef.privacy_class);
      bundleRedactionStatuses.add(inputRef.redaction_status);
      addReasonCodes(bundleReasonCodes, inputRef.reason_codes);
    }
    for (const candidateKind of request.corpus_descriptor?.allowed_candidate_kinds ?? []) {
      bundleCandidateKinds.add(candidateKind);
    }
    for (const candidateKind of request.query_descriptor?.requested_candidate_kinds ?? []) {
      bundleCandidateKinds.add(candidateKind);
    }
  }

  for (const candidate of bundle.candidates) {
    addReasonCodes(bundleReasonCodes, candidate.reason_codes);
  }
  for (const result of bundle.result_envelopes) {
    addReasonCodes(bundleReasonCodes, result.reason_codes);
  }

  assertIncludesAll(bundleInputKinds, inputKinds, "input kinds");
  assertIncludesAll(bundleCorpusKinds, corpusKinds, "corpus kinds");
  assertIncludesAll(bundleRetrievalModes, retrievalModes, "retrieval modes");
  assertIncludesAll(bundleRequestStatuses, requestStatuses, "request statuses");
  assertIncludesAll(bundleCandidateKinds, candidateKinds, "candidate kinds");
  assertIncludesAll(bundleReviewStatuses, reviewStatuses, "review statuses");
  assertIncludesAll(bundlePrivacyClasses, privacyClasses, "privacy classes");
  assertIncludesAll(bundleRedactionStatuses, redactionStatuses, "redaction statuses");
  assertIncludesAll(bundleReasonCodes, reasonCodes, "reason codes");

  assert.ok(
    bundle.requests.some((request) => request.request_status === "accepted_for_future_runtime"),
    "at least one request must be accepted_for_future_runtime",
  );
  assert.ok(
    bundle.requests.some((request) => request.request_status === "blocked_missing_corpus"),
    "at least one request must be blocked_missing_corpus",
  );
  assert.ok(
    bundle.requests.some((request) => request.request_status === "blocked_private_or_raw_payload"),
    "at least one request must be blocked_private_or_raw_payload",
  );
  assert.ok(
    bundle.requests.some((request) => request.request_status === "blocked_unsupported_mode"),
    "at least one request must be blocked_unsupported_mode",
  );
  assert.ok(
    bundle.requests.some((request) =>
      request.corpus_descriptor?.input_refs?.some((inputRef) => inputRef.input_kind === "unknown"),
    ),
    "at least one request must use unknown input kind",
  );
  assert.ok(
    bundle.requests.some((request) => request.query_descriptor?.retrieval_mode === "unknown"),
    "at least one request must use unknown retrieval mode",
  );
  assert.ok(
    bundle.requests.some((request) =>
      request.boundary_notes?.some((note) => note.includes(`${roadmapRef} is planning metadata only`)),
    ),
    "at least one request must reference the roadmap file as planning metadata only",
  );
  assert.ok(
    bundle.candidates.some((candidate) => candidate.review_status === "accepted_for_future_runtime"),
    "at least one candidate must have review_status accepted_for_future_runtime",
  );
}

function assertBundleShape() {
  assert.equal(bundle.bundle_version, bundleVersion);
  assert.equal(bundle.contract_version, contractVersion);
  assert.equal(bundle.scope, scope);
  assert.equal(bundle.status, status);
  assert.equal(bundle.roadmap_ref, roadmapRef);
  assertNonEmptyString(bundle.as_of, "bundle as_of");
  assert.ok(Array.isArray(bundle.source_fixture_refs), "bundle source_fixture_refs must be array");
  for (const fixtureRef of [
    "fixtures/bounded-source-intake-runtime.sample.v0.1.json",
    "fixtures/provider-assisted-extraction-runtime.sample.v0.1.json",
    "fixtures/research-candidate-review.memory-store.sample.v0.1.json",
  ]) {
    assert.ok(bundle.source_fixture_refs.includes(fixtureRef), `bundle source_fixture_refs must include ${fixtureRef}`);
  }
  assertSafeAuthorityBoundary(bundle.authority_boundary, "bundle authority_boundary");

  for (const request of bundle.requests) {
    assert.equal(request.request_version, requestVersion);
    assert.equal(request.contract_version, contractVersion);
    assert.equal(request.scope, scope);
    assertNonEmptyString(request.request_id, "request_id");
    assert.ok(requestStatuses.includes(request.request_status), `${request.request_id} invalid request_status`);
    assertNonEmptyString(request.requested_at, `${request.request_id} requested_at`);
    assert.ok(request.corpus_descriptor, `${request.request_id} corpus_descriptor required`);
    assert.ok(request.query_descriptor, `${request.request_id} query_descriptor required`);
    assertNonEmptyString(request.bounded_purpose, `${request.request_id} bounded_purpose`);
    assert.ok(Array.isArray(request.expected_candidate_refs), `${request.request_id} expected_candidate_refs`);
    assert.ok(Array.isArray(request.boundary_notes), `${request.request_id} boundary_notes`);
    assertReasonCodes(request.reason_codes, `${request.request_id} reason_codes`);
    assertSafeAuthorityBoundary(request.authority_boundary, `${request.request_id} authority_boundary`);
    assertCorpusDescriptor(request.corpus_descriptor, request.request_id);
    assertQueryDescriptor(request.query_descriptor, request.request_id);
  }

  for (const candidate of bundle.candidates) {
    assert.equal(candidate.candidate_version, candidateVersion);
    assert.equal(candidate.contract_version, contractVersion);
    assert.equal(candidate.scope, scope);
    assertNonEmptyString(candidate.request_id, "candidate request_id");
    assertNonEmptyString(candidate.candidate_id, "candidate_id");
    assert.ok(candidateKinds.includes(candidate.candidate_kind), `${candidate.candidate_id} invalid candidate_kind`);
    assertNonEmptyString(candidate.candidate_ref, `${candidate.candidate_id} candidate_ref`);
    assertNonEmptyString(candidate.bounded_context_summary, `${candidate.candidate_id} bounded_context_summary`);
    for (const field of ["source_refs", "candidate_refs", "review_memory_refs", "durable_summary_refs", "feedback_refs"]) {
      assert.ok(Array.isArray(candidate[field]), `${candidate.candidate_id}.${field} must be array`);
    }
    assert.ok(scoreBands.includes(candidate.score_band), `${candidate.candidate_id} invalid score_band`);
    assert.ok(reviewStatuses.includes(candidate.review_status), `${candidate.candidate_id} invalid review_status`);
    assertExecutionFlagsFalse(candidate, candidate.candidate_id);
    assertReasonCodes(candidate.reason_codes, `${candidate.candidate_id} reason_codes`);
    assertSafeAuthorityBoundary(candidate.authority_boundary, `${candidate.candidate_id} authority_boundary`);
  }

  for (const result of bundle.result_envelopes) {
    assert.equal(result.result_version, resultVersion);
    assert.equal(result.contract_version, contractVersion);
    assert.equal(result.scope, scope);
    assert.equal(result.status, status);
    assertNonEmptyString(result.request_id, "result request_id");
    assert.equal(typeof result.accepted_for_future_runtime, "boolean", `${result.request_id} accepted flag`);
    for (const field of ["candidate_refs", "source_refs", "review_memory_refs", "durable_summary_refs", "feedback_refs"]) {
      assert.ok(Array.isArray(result[field]), `${result.request_id}.${field} must be array`);
    }
    assertExecutionFlagsFalse(result, `result ${result.request_id}`);
    assertReasonCodes(result.reason_codes, `${result.request_id} result reason_codes`);
    assertSafeAuthorityBoundary(result.authority_boundary, `${result.request_id} result authority_boundary`);
  }
}

function assertCorpusDescriptor(corpus, requestId) {
  assert.equal(corpus.corpus_descriptor_version, corpusDescriptorVersion);
  assert.equal(corpus.scope, scope);
  assertNonEmptyString(corpus.corpus_id, `${requestId} corpus_id`);
  assert.ok(corpusKinds.includes(corpus.corpus_kind), `${requestId} invalid corpus_kind`);
  assertNonEmptyString(corpus.corpus_ref, `${requestId} corpus_ref`);
  assert.ok(Array.isArray(corpus.input_refs), `${requestId} corpus input_refs must be array`);
  assert.ok(Array.isArray(corpus.allowed_candidate_kinds), `${requestId} allowed_candidate_kinds`);
  for (const candidateKind of corpus.allowed_candidate_kinds) {
    assert.ok(candidateKinds.includes(candidateKind), `${requestId} invalid allowed candidate kind ${candidateKind}`);
  }
  assert.equal(corpus.rebuildable, true, `${requestId} corpus rebuildable must be true`);
  assert.equal(corpus.derived_non_authoritative, true, `${requestId} corpus derived_non_authoritative must be true`);
  assert.equal(
    corpus.stale_index_cannot_override_current_state,
    true,
    `${requestId} stale_index_cannot_override_current_state must be true`,
  );
  assert.ok(privacyClasses.includes(corpus.privacy_class), `${requestId} invalid corpus privacy_class`);
  assert.ok(redactionStatuses.includes(corpus.redaction_status), `${requestId} invalid corpus redaction_status`);
  assert.equal(typeof corpus.public_safe, "boolean", `${requestId} corpus public_safe must be boolean`);
  assertReasonCodes(corpus.reason_codes, `${requestId} corpus reason_codes`);
  assertSafeAuthorityBoundary(corpus.authority_boundary, `${requestId} corpus authority_boundary`);
  for (const inputRef of corpus.input_refs) {
    assertInputRef(inputRef, requestId);
  }
}

function assertQueryDescriptor(query, requestId) {
  assert.equal(query.query_descriptor_version, queryDescriptorVersion);
  assert.equal(query.scope, scope);
  assertNonEmptyString(query.query_id, `${requestId} query_id`);
  assert.ok(retrievalModes.includes(query.retrieval_mode), `${requestId} invalid retrieval_mode`);
  assertNonEmptyString(query.bounded_query_summary, `${requestId} bounded_query_summary`);
  assert.ok(Array.isArray(query.requested_candidate_kinds), `${requestId} requested_candidate_kinds`);
  for (const candidateKind of query.requested_candidate_kinds) {
    assert.ok(candidateKinds.includes(candidateKind), `${requestId} invalid requested candidate kind ${candidateKind}`);
  }
  for (const field of ["source_refs", "candidate_refs", "durable_summary_refs"]) {
    assert.ok(Array.isArray(query[field]), `${requestId} query ${field} must be array`);
  }
  assert.equal(typeof query.public_safe, "boolean", `${requestId} query public_safe must be boolean`);
  assert.ok(redactionStatuses.includes(query.redaction_status), `${requestId} invalid query redaction_status`);
  assertReasonCodes(query.reason_codes, `${requestId} query reason_codes`);
  assertSafeAuthorityBoundary(query.authority_boundary, `${requestId} query authority_boundary`);
}

function assertInputRef(inputRef, requestId) {
  assert.ok(inputKinds.includes(inputRef.input_kind), `${requestId} invalid input_kind`);
  assertNonEmptyString(inputRef.input_ref, `${requestId} input_ref`);
  for (const field of [
    "source_refs",
    "candidate_refs",
    "review_memory_refs",
    "durable_summary_refs",
    "feedback_refs",
  ]) {
    assert.ok(Array.isArray(inputRef[field]), `${requestId} input_ref ${field} must be array`);
  }
  assert.equal(typeof inputRef.public_safe, "boolean", `${requestId} input_ref public_safe must be boolean`);
  assert.ok(privacyClasses.includes(inputRef.privacy_class), `${requestId} invalid input privacy_class`);
  assert.ok(redactionStatuses.includes(inputRef.redaction_status), `${requestId} invalid input redaction_status`);
  assertReasonCodes(inputRef.reason_codes, `${requestId} input reason_codes`);
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
    "raw retrieval payload blocked by contract fixture",
    "secret-like retrieval input blocked by contract fixture",
  ];
  let text = fixtureText;
  for (const placeholder of allowedPlaceholders) {
    text = text.split(placeholder).join("");
  }
  for (const marker of [
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
    "raw retrieval output",
    "raw conversation",
    "hidden reasoning",
    "raw DB row",
    "raw_db_row",
    "browser dump",
    "raw browser dump",
    "raw source body",
    "actual prompt:",
    "provider response:",
    "actual query:",
    "embedding vector:",
    "vector index dump:",
  ]) {
    assert.ok(!text.includes(marker), `fixture must not contain forbidden marker ${marker}`);
  }
}

function assertDocCoverage() {
  for (const phrase of [
    "Product-write remains parked by #686.",
    "Research Retrieval/RAG Runtime Contract is contract-only.",
    roadmapRef,
    "roadmap guide is not SSOT",
    "Retrieval candidates are not truth.",
    "Retrieval candidates are not proof/evidence.",
    "Retrieval result is not evidence.",
    "Retrieval score is not truth score.",
    "Retrieval score is not promotion readiness.",
    "RAG answer is context preview only.",
    "accepted_for_future_runtime is not runtime execution.",
    "bounded query summary is not query execution.",
    "retrieval mode is planning metadata, not retrieval execution.",
    "Source refs are lineage pointers, not proof.",
    "Source refs must be public-safe symbolic refs.",
    "Candidate summary refs are lineage metadata, not proof.",
    "Durable summary refs are lineage metadata, not proof.",
    "Provider candidate refs are lineage metadata, not proof.",
    "Raw retrieval outputs must not be stored.",
    "background inputs already integrated into the roadmap guide",
  ]) {
    assert.ok(doc.includes(phrase), `doc must include exact phrase: ${phrase}`);
  }
}

function assertIndexCoverage() {
  for (const pointer of [
    roadmapRef,
    docPath,
    typePath,
    fixturePath,
    "scripts/smoke-research-retrieval-runtime-contract-v0-1.mjs",
  ]) {
    assert.ok(indexDoc.includes(pointer), `index must point to ${pointer}`);
  }
  const indexBlock = extractIndexBlock(indexDoc, "Research Retrieval/RAG Runtime Contract v0.1");
  for (const phrase of [
    "contract-only",
    "follows the integrated roadmap guide v0.2.1 FULL",
    "follows #774, #775, #776, #777, and #778",
    "does not implement retrieval/RAG execution, query execution, embeddings, vector search, index read/write, corpus scan, provider calls, prompt sending, provider output storage, retrieval output storage, source fetch, local/repository/uploaded file reads, raw source storage, route, UI, DB query/write, proof/evidence, claim/evidence writes, promotion, GitHub automation, Git Ledger, product write, or product ID allocation",
  ]) {
    assert.ok(indexBlock.includes(phrase), `index block must include phrase: ${phrase}`);
  }
  for (const forbidden of [
    "retrieval runtime was added",
    "retrieval runtime is added",
    "RAG execution was added",
    "query execution was added",
    "embedding creation was added",
    "vector search was added",
    "index read was added",
    "index write was added",
    "corpus scan was added",
    "provider call was added",
    "prompt sending was added",
    "provider output storage was added",
    "retrieval output storage was added",
    "source fetch was added",
    "route was added",
    "UI was added",
    "DB query/write was added",
    "proof/evidence was added",
    "promotion was added",
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
  assert.equal(boundary.contract_only, true, `${label}.contract_only must be true`);
  for (const field of authorityFalseFields) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function assertExecutionFlagsFalse(record, label) {
  for (const field of executionFalseFields) {
    assert.equal(record[field], false, `${label}.${field} must be false`);
  }
}

function assertReasonCodes(codes, label) {
  assert.ok(Array.isArray(codes), `${label} must be array`);
  for (const code of codes) {
    assert.ok(reasonCodes.includes(code), `${label} contains invalid reason code ${code}`);
  }
}

function addReasonCodes(set, codes) {
  for (const code of codes ?? []) {
    set.add(code);
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
