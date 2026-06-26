import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const contractDocPath = "docs/RESEARCH_RETRIEVAL_RAG_RUNTIME_V0_1.md";
const runtimeDocPath = "docs/REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_V0_1.md";
const contractTypePath = "types/research-retrieval-runtime-contract.ts";
const rebuildSourcePath = "lib/research-retrieval/rebuild-index.ts";
const searchSourcePath = "lib/research-retrieval/search-index.ts";
const storeSourcePath = "lib/research-retrieval/index-store.ts";
const rebuildRoutePath = "app/api/research-retrieval/rebuild/route.ts";
const searchRoutePath = "app/api/research-retrieval/search/route.ts";
const fixturePath = "fixtures/research-retrieval-index-runtime.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const runtimeVersion = "rebuildable_retrieval_index_runtime.v0.1";
const indexVersion = "rebuildable_retrieval_index.v0.1";
const entryVersion = "rebuildable_retrieval_index_entry.v0.1";
const buildReportVersion = "rebuildable_retrieval_index_build_report.v0.1";
const searchRequestVersion = "research_retrieval_index_search_request.v0.1";
const searchResultVersion = "research_retrieval_index_search_result.v0.1";
const contractVersion = "research_retrieval_runtime_contract.v0.1";
const scope = "project:augnes";

const requiredEntryKinds = [
  "source_ref_metadata",
  "candidate_summary",
  "review_note_summary",
  "perspective_delta_summary",
  "formation_receipt_summary",
  "feedback_summary",
  "manual_bounded_context",
  "unknown",
];

const requiredBuildStatuses = [
  "rebuilt",
  "rejected_empty_input",
  "rejected_private_or_raw_payload",
  "rejected_invalid_entry",
  "rejected_unsupported_entry_kind",
];

const requiredSearchStatuses = [
  "candidate_only",
  "no_matches",
  "blocked_unsupported_mode",
  "blocked_private_or_raw_payload",
  "rejected_invalid_request",
];

const requiredBuildReasonCodes = [
  "roadmap_file_present",
  "contract_ref_present",
  "entry_ref_present",
  "entry_ref_missing",
  "entry_kind_supported",
  "entry_kind_unknown",
  "bounded_summary_present",
  "bounded_summary_missing",
  "source_ref_present",
  "source_ref_missing",
  "candidate_ref_present",
  "review_memory_ref_present",
  "durable_summary_ref_present",
  "feedback_ref_present",
  "public_safe_entry",
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
  "raw_source_body_blocked",
  "raw_provider_output_blocked",
  "raw_retrieval_output_blocked",
  "index_rebuilt_from_caller_input",
  "index_is_rebuildable",
  "index_is_derived",
  "index_is_non_authoritative",
  "stale_index_cannot_override_current_state",
  "lexical_tokens_created",
  "embedding_not_created",
  "vector_search_not_executed",
  "provider_call_not_executed",
  "prompt_not_sent",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "db_write_not_executed",
  "proof_not_created",
  "evidence_not_created",
  "promotion_not_executed",
  "product_write_denied",
];

const requiredSearchReasonCodes = [
  "index_present",
  "index_missing",
  "query_summary_present",
  "query_summary_missing",
  "retrieval_mode_supported",
  "retrieval_mode_unsupported",
  "bounded_local_search_executed",
  "metadata_lookup_executed",
  "lexical_search_executed",
  "hybrid_search_executed",
  "no_retrieval_requested",
  "semantic_embedding_search_deferred",
  "rag_context_preview_deferred",
  "rerank_deferred",
  "citation_context_preview_deferred",
  "entry_match_found",
  "entry_match_not_found",
  "stale_result_warning",
  "retrieval_result_not_evidence",
  "retrieval_score_not_truth_score",
  "retrieval_score_not_promotion_readiness",
  "rag_answer_not_generated",
  "embedding_not_created",
  "vector_search_not_executed",
  "provider_call_not_executed",
  "prompt_not_sent",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "db_query_not_executed",
  "proof_not_created",
  "evidence_not_created",
  "promotion_not_executed",
  "product_write_denied",
];

const requiredDocPhrases = [
  "Product-write remains parked by #686.",
  "Rebuildable Retrieval Index Runtime is a bounded derived runtime.",
  "The index is rebuildable.",
  "The index is derived.",
  "The index is non-authoritative.",
  "The index is not canonical state.",
  "The index is not source of truth.",
  "Search results are not evidence.",
  "Retrieval result is not evidence.",
  "Retrieval score is not truth score.",
  "Retrieval score is not promotion readiness.",
  "Stale index cannot override current state.",
  "RAG answer generation remains deferred.",
  "Embeddings remain deferred.",
  "Vector search remains deferred.",
  "Provider/OpenAI calls remain forbidden.",
  "Source fetch remains forbidden.",
  "In-memory derived cache is not durable state.",
  "Discarding an index cache is not candidate rejection.",
  "Discarding an index cache is not proof/evidence deletion.",
  "roadmap guide is not SSOT",
  roadmapPath,
  contractTypePath,
];

const forbiddenPositiveAuthorityGrants = [
  "rag_answer_generation_now: true",
  "embedding_created_now: true",
  "vector_search_now: true",
  "semantic_embedding_search_now: true",
  "external_retrieval_provider_now: true",
  "source_fetch_now: true",
  "crawler_now: true",
  "local_file_read_now: true",
  "repository_file_read_now: true",
  "uploaded_file_read_now: true",
  "raw_source_body_storage_now: true",
  "raw_provider_output_storage_now: true",
  "raw_retrieval_output_storage_now: true",
  "provider_openai_call_now: true",
  "prompt_sent_now: true",
  "db_migration_now: true",
  "production_db_read_or_write_now: true",
  "proof_or_evidence_record_now: true",
  "claim_or_evidence_write_now: true",
  "perspective_promotion_now: true",
  "durable_perspective_state_now: true",
  "work_mutation_now: true",
  "git_ledger_export_now: true",
  "codex_execution_authority: true",
  "github_automation_authority: true",
  "product_write_authority: true",
  "product_id_allocation_authority: true",
  "source_of_truth: true",
  "retrieval_result_is_evidence: true",
  "retrieval_score_is_truth_score: true",
  "retrieval_score_is_promotion_readiness: true",
];

const forbiddenFixtureMarkers = [
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
];

const allowedFixturePlaceholders = [
  "raw retrieval payload blocked by runtime fixture",
  "secret-like retrieval input blocked by runtime fixture",
];

const forbiddenAuthorityFalseFields = [
  "rag_answer_generation_now",
  "embedding_created_now",
  "vector_search_now",
  "semantic_embedding_search_now",
  "external_retrieval_provider_now",
  "source_fetch_now",
  "crawler_now",
  "local_file_read_now",
  "repository_file_read_now",
  "uploaded_file_read_now",
  "raw_source_body_storage_now",
  "raw_provider_output_storage_now",
  "raw_retrieval_output_storage_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "db_migration_now",
  "production_db_read_or_write_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "perspective_promotion_now",
  "durable_perspective_state_now",
  "work_mutation_now",
  "git_ledger_export_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "product_id_allocation_authority",
  "source_of_truth",
  "retrieval_result_is_evidence",
  "retrieval_score_is_truth_score",
  "retrieval_score_is_promotion_readiness",
];

const roadmapText = readText(roadmapPath);
const contractDocText = readText(contractDocPath);
const runtimeDocText = readText(runtimeDocPath);
const contractTypeText = readText(contractTypePath);
const rebuildSourceText = readText(rebuildSourcePath);
const searchSourceText = readText(searchSourcePath);
const storeSourceText = readText(storeSourcePath);
const rebuildRouteText = readText(rebuildRoutePath);
const searchRouteText = readText(searchRoutePath);
const fixtureText = readText(fixturePath);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const fixture = JSON.parse(fixtureText);

assertIncludes(roadmapText, "rebuildable_retrieval_index_runtime_v0_1", "roadmap names this slice");
assertIncludes(contractDocText, "Research Retrieval/RAG Runtime Contract is contract-only.", "PR #779 contract doc boundary");
assert(runtimeDocText.length > 0, "runtime doc exists");

assert.equal(fixture.fixture_version, "research_retrieval_index_runtime.sample.v0.1");
assert.equal(fixture.runtime_version, runtimeVersion);
assert.equal(fixture.index_version, indexVersion);
assert.equal(fixture.entry_version, entryVersion);
assert.equal(fixture.build_report_version, buildReportVersion);
assert.equal(fixture.search_request_version, searchRequestVersion);
assert.equal(fixture.search_result_version, searchResultVersion);
assert.equal(fixture.contract_version, contractVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.roadmap_ref, roadmapPath);
assert.equal(fixture.contract_ref, contractTypePath);

assert.equal(fixture.expected_successful_build_report.build_status, "rebuilt");
assert.equal(fixture.expected_rebuildable_index.rebuildable, true);
assert.equal(fixture.expected_rebuildable_index.derived_non_authoritative, true);
assert.equal(fixture.expected_rebuildable_index.stale_index_cannot_override_current_state, true);
assert.equal(fixture.expected_rebuildable_index.public_safe_only, true);
assert(fixture.expected_rebuildable_index.entries.length > 0, "expected index has entries");
assert(fixture.expected_rebuildable_index.token_records.length > 0, "expected index has token records");
assert(isNonEmptyString(fixture.expected_rebuildable_index.index_fingerprint), "index_fingerprint is non-empty");
assert.equal(
  fixture.expected_rebuildable_index.index_fingerprint,
  fingerprintWithoutField(fixture.expected_rebuildable_index, "index_fingerprint"),
  "index_fingerprint is deterministic canonical sha256",
);

assertArrayCovers(fixture.entry_kind_coverage, requiredEntryKinds, "entry kind coverage");
assertArrayCovers(fixture.build_status_coverage, requiredBuildStatuses, "build status coverage");
assertArrayCovers(fixture.search_status_coverage, requiredSearchStatuses, "search status coverage");
assertArrayCovers(
  [...fixture.build_reason_code_coverage, rebuildSourceText],
  requiredBuildReasonCodes,
  "build reason code coverage",
);
assertArrayCovers(
  [...fixture.search_reason_code_coverage, searchSourceText],
  requiredSearchReasonCodes,
  "search reason code coverage",
);

assert.equal(fixture.expected_lexical_search_result.status, "candidate_only");
assert(fixture.expected_lexical_search_result.hits.length > 0, "lexical search returns hits");
assert.equal(fixture.expected_metadata_lookup_result.status, "candidate_only");
assert(fixture.expected_metadata_lookup_result.hits.length > 0, "metadata lookup returns hits");
assert.equal(fixture.expected_hybrid_search_result.status, "candidate_only");
assert(fixture.expected_hybrid_search_result.hits.length > 0, "hybrid search returns hits");
assert.equal(fixture.expected_no_retrieval_result.status, "no_matches");
assert.equal(fixture.expected_no_retrieval_result.hits.length, 0, "no_retrieval returns no hits");
assert.equal(fixture.expected_blocked_semantic_search_result.status, "blocked_unsupported_mode");
assert.equal(fixture.expected_blocked_semantic_search_result.hits.length, 0);
assert.equal(fixture.expected_blocked_rag_search_result.status, "blocked_unsupported_mode");
assert.equal(fixture.expected_blocked_rag_search_result.hits.length, 0);
assert(
  allSearchHits(fixture).some((hit) => hit.stale_warning === true),
  "stale hit has stale_warning true",
);
assert(
  allSearchHits(fixture).some((hit) => hit.score_band === "high") &&
    allSearchHits(fixture).some((hit) => hit.score_band === "medium") &&
    allSearchHits(fixture).some((hit) => hit.score_band === "low"),
  "fixture includes high, medium, and low score hits",
);
for (const hit of allSearchHits(fixture)) {
  assert.equal(hit.retrieval_result_is_evidence, false);
  assert.equal(hit.retrieval_score_is_truth_score, false);
  assert.equal(hit.retrieval_score_is_promotion_readiness, false);
}
for (const result of allSearchResults(fixture)) {
  assert.equal(result.rag_executed, false);
  assert.equal(result.embedding_created, false);
  assert.equal(result.vector_search_executed, false);
  assert.equal(result.semantic_embedding_search_executed, false);
  assert.equal(result.rerank_executed, false);
  assert.equal(result.provider_call_executed, false);
  assert.equal(result.prompt_sent, false);
  assert.equal(result.source_fetch_executed, false);
  assert.equal(result.file_read_executed, false);
  assert.equal(result.db_query_executed, false);
  assert.equal(result.proof_or_evidence_created, false);
  assert.equal(result.perspective_promoted, false);
  assert.equal(result.product_write_executed, false);
}

for (const boundary of collectAuthorityBoundaries(fixture)) {
  assert.equal(boundary.source_of_truth, false);
  assert.equal(boundary.retrieval_result_is_evidence, false);
  assert.equal(boundary.retrieval_score_is_truth_score, false);
  assert.equal(boundary.retrieval_score_is_promotion_readiness, false);
  for (const field of forbiddenAuthorityFalseFields) {
    assert.equal(boundary[field], false, `authority boundary ${field} remains false`);
  }
}

assert.equal(packageJson.scripts["smoke:research-retrieval-index-runtime-v0-1"], "node scripts/smoke-research-retrieval-index-runtime-v0-1.mjs");
const indexBlock = extractIndexBlock(indexText, "Rebuildable Retrieval Index Runtime v0.1");
for (const pointer of [
  runtimeDocPath,
  "fixtures/research-retrieval-index-runtime.sample.v0.1.json",
  "scripts/smoke-research-retrieval-index-runtime-v0-1.mjs",
]) {
  assertIncludes(indexText, pointer, `index points to ${pointer}`);
}
assertIncludes(indexBlock, "derived", "index mentions derived");
assertIncludes(indexBlock, "rebuildable", "index mentions rebuildable");
assertIncludes(indexBlock, "non-authoritative", "index mentions non-authoritative");
for (const forbiddenImplication of [
  "RAG answer generation was added",
  "embeddings were added",
  "vector search was added",
  "provider calls were added",
  "proof/evidence writes were added",
  "promotion was added",
  "Git Ledger export was added",
  "product write was added",
]) {
  assert(!indexBlock.includes(forbiddenImplication), `index must not imply ${forbiddenImplication}`);
}

await runHelperBehaviorChecks();
assertRouteSource(rebuildRouteText, "rebuild");
assertRouteSource(searchRouteText, "search");

for (const marker of forbiddenFixtureMarkers) {
  const sanitized = allowedFixturePlaceholders.reduce(
    (text, placeholder) => text.split(placeholder).join(""),
    fixtureText,
  );
  assert(!sanitized.includes(marker), `fixture must not contain forbidden marker ${marker}`);
}

for (const phrase of requiredDocPhrases) assertIncludes(runtimeDocText, phrase, `doc contains ${phrase}`);
for (const grant of forbiddenPositiveAuthorityGrants) {
  assert(!runtimeDocText.includes(grant), `runtime doc must not contain ${grant}`);
}

assertIncludes(rebuildSourceText, "buildRebuildableRetrievalIndexV01", "rebuild helper exported");
assertIncludes(searchSourceText, "searchRebuildableRetrievalIndexV01", "search helper exported");
assertIncludes(storeSourceText, "createInMemoryRebuildableRetrievalIndexStoreV01", "store helper exported");
assertIncludes(contractTypeText, contractVersion, "contract type is present");

console.log("smoke:research-retrieval-index-runtime-v0-1 passed");

async function runHelperBehaviorChecks() {
  const rebuild = await import(pathToFileURL(rebuildSourcePath).href);
  const search = await import(pathToFileURL(searchSourcePath).href);

  const reportA = rebuild.buildRebuildableRetrievalIndexV01(fixture.successful_build_input);
  const reportB = rebuild.buildRebuildableRetrievalIndexV01(fixture.successful_build_input);
  assert.deepEqual(reportA, fixture.expected_successful_build_report, "build report matches fixture");
  assert.deepEqual(reportB, reportA, "repeated build is deterministic");
  assert.equal(reportA.index.index_fingerprint, reportB.index.index_fingerprint, "repeated build fingerprint matches");

  const lexicalA = search.searchRebuildableRetrievalIndexV01(
    fixture.expected_rebuildable_index,
    fixture.lexical_search_request,
  );
  const lexicalB = search.searchRebuildableRetrievalIndexV01(
    fixture.expected_rebuildable_index,
    fixture.lexical_search_request,
  );
  assert.deepEqual(lexicalA, fixture.expected_lexical_search_result, "lexical result matches fixture");
  assert.deepEqual(
    lexicalA.hits.map((hit) => hit.entry_ref),
    lexicalB.hits.map((hit) => hit.entry_ref),
    "repeated lexical search ordering is deterministic",
  );

  assert.deepEqual(
    search.searchRebuildableRetrievalIndexV01(fixture.expected_rebuildable_index, fixture.metadata_lookup_request),
    fixture.expected_metadata_lookup_result,
    "metadata lookup result matches fixture",
  );
  assert.deepEqual(
    search.searchRebuildableRetrievalIndexV01(fixture.expected_rebuildable_index, fixture.hybrid_search_request),
    fixture.expected_hybrid_search_result,
    "hybrid result matches fixture",
  );
  assert.equal(
    search.searchRebuildableRetrievalIndexV01(fixture.expected_rebuildable_index, fixture.blocked_semantic_search_request).status,
    "blocked_unsupported_mode",
    "semantic search is blocked",
  );
  assert.equal(
    search.searchRebuildableRetrievalIndexV01(fixture.expected_rebuildable_index, fixture.blocked_rag_search_request).status,
    "blocked_unsupported_mode",
    "rag_context_preview is blocked",
  );
  assert.equal(
    rebuild.buildRebuildableRetrievalIndexV01(fixture.rejected_private_raw_payload_build_input).build_status,
    "rejected_private_or_raw_payload",
    "private/raw build input is rejected",
  );
}

function assertRouteSource(source, label) {
  assert(/export\s+async\s+function\s+POST\b/.test(source), `${label} route exports POST`);
  assert(!/export\s+async\s+function\s+GET\b/.test(source), `${label} route does not export GET`);
  assertIncludes(source, "requestHasSameOriginBoundary", `${label} route has same-origin guard`);
  assertIncludes(source, "request.headers.get(\"origin\")", `${label} route checks origin`);
  assertIncludes(source, "request.headers.get(\"host\")", `${label} route checks host`);
  assertIncludes(source, "request.json()", `${label} route parses JSON`);
  assertIncludes(source, "isRecord(body)", `${label} route requires JSON object`);
  for (const pattern of [
    "fetch(",
    "OpenAI",
    "embeddings.create",
    "pinecone",
    "chroma",
    "qdrant",
    "weaviate",
    "fs.readFile",
    "fs.writeFile",
    "writeFile",
    "readFile",
    "migration",
    "prisma",
    "proof write",
    "product write",
    "GitHub",
  ]) {
    assert(!source.includes(pattern), `${label} route must not contain ${pattern}`);
  }
}

function allSearchResults(value) {
  return [
    value.expected_lexical_search_result,
    value.expected_metadata_lookup_result,
    value.expected_hybrid_search_result,
    value.expected_no_retrieval_result,
    value.expected_blocked_semantic_search_result,
    value.expected_blocked_rag_search_result,
    value.expected_blocked_private_search_result,
  ];
}

function allSearchHits(value) {
  return allSearchResults(value).flatMap((result) => result.hits);
}

function collectAuthorityBoundaries(value, boundaries = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectAuthorityBoundaries(item, boundaries);
  } else if (value && typeof value === "object") {
    if (value.runtime_slice === runtimeVersion) boundaries.push(value);
    for (const item of Object.values(value)) collectAuthorityBoundaries(item, boundaries);
  }
  return boundaries;
}

function fingerprintWithoutField(value, field) {
  const clone = { ...value };
  delete clone[field];
  return createHash("sha256").update(JSON.stringify(canonicalJson(clone))).digest("hex");
}

function canonicalJson(value) {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalJson(value[key])]),
    );
  }
  return value;
}

function extractIndexBlock(text, heading) {
  const start = text.indexOf(`- ${heading}:`);
  assert(start >= 0, `index block exists for ${heading}`);
  const after = text.slice(start + 2);
  const next = after.search(/\n- [^\n]+:/);
  return next >= 0 ? after.slice(0, next) : after;
}

function assertArrayCovers(actual, expected, label) {
  const text = Array.isArray(actual) ? actual.join("\n") : String(actual);
  for (const value of expected) assertIncludes(text, value, `${label} includes ${value}`);
}

function assertIncludes(text, needle, message) {
  assert(text.includes(needle), message);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.length > 0;
}

function readText(path) {
  return readFileSync(path, "utf8");
}
