import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const contractDocPath = "docs/RESEARCH_RETRIEVAL_RAG_RUNTIME_V0_1.md";
const indexRuntimeDocPath = "docs/REBUILDABLE_RETRIEVAL_INDEX_RUNTIME_V0_1.md";
const docPath = "docs/RAG_CONTEXT_PREVIEW_V0_1.md";
const typePath = "types/rag-context-preview.ts";
const helperPath = "lib/research-retrieval/build-rag-context-preview.ts";
const fixturePath = "fixtures/rag-context-preview.sample.v0.1.json";
const componentPath = "components/rag-context-preview-panel.tsx";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const previewVersion = "rag_context_preview.v0.1";
const inputVersion = "rag_context_preview_input.v0.1";
const itemVersion = "rag_context_preview_context_item.v0.1";
const envelopeVersion = "rag_context_preview_envelope.v0.1";
const bundleVersion = "rag_context_preview_bundle.v0.1";
const scope = "project:augnes";

const requiredInputKinds = [
  "retrieval_search_result",
  "retrieval_search_hit",
  "source_ref_candidate",
  "candidate_summary",
  "review_memory_summary",
  "perspective_delta_summary",
  "formation_receipt_summary",
  "feedback_summary",
  "manual_bounded_context",
  "unknown",
];

const requiredItemKinds = [
  "included_source_ref",
  "included_candidate_summary",
  "included_review_memory_summary",
  "included_durable_summary",
  "included_feedback_summary",
  "included_gap_context",
  "included_tension_context",
  "excluded_context",
  "unknown",
];

const requiredLayers = [
  "candidate",
  "durable",
  "review_memory",
  "feedback",
  "source_ref",
  "manual",
  "unknown",
];

const requiredInclusionStatuses = [
  "included",
  "excluded_missing_source_ref",
  "excluded_private_or_raw_payload",
  "excluded_stale_without_warning",
  "excluded_duplicate",
  "excluded_unsupported_kind",
  "excluded_empty_summary",
  "needs_operator_review",
];

const requiredReasonCodes = [
  "roadmap_file_present",
  "retrieval_contract_present",
  "retrieval_index_runtime_present",
  "input_ref_present",
  "input_ref_missing",
  "source_ref_present",
  "source_ref_missing",
  "candidate_ref_present",
  "review_memory_ref_present",
  "durable_summary_ref_present",
  "feedback_ref_present",
  "bounded_summary_present",
  "bounded_summary_missing",
  "context_item_included",
  "context_item_excluded",
  "duplicate_context_excluded",
  "stale_context_warning",
  "unresolved_tension_preserved",
  "knowledge_gap_preserved",
  "candidate_layer_marked",
  "durable_layer_marked",
  "review_memory_layer_marked",
  "feedback_layer_marked",
  "source_ref_layer_marked",
  "private_or_raw_payload_blocked",
  "secret_like_pattern_blocked",
  "local_path_blocked",
  "private_url_blocked",
  "raw_source_body_blocked",
  "raw_provider_output_blocked",
  "raw_retrieval_output_blocked",
  "rag_answer_not_generated",
  "provider_call_not_executed",
  "prompt_not_sent",
  "embedding_not_created",
  "vector_search_not_executed",
  "source_fetch_not_executed",
  "file_read_not_executed",
  "db_query_not_executed",
  "db_write_not_executed",
  "proof_not_created",
  "evidence_not_created",
  "promotion_not_executed",
  "product_write_denied",
  "git_ledger_export_not_executed",
];

const requiredDocPhrases = [
  "Product-write remains parked by #686.",
  "RAG Context Preview is preview-only.",
  "RAG Context Preview does not generate answers.",
  "RAG Context Preview is not a final answer.",
  "RAG Context Preview is not truth.",
  "Context items are not evidence.",
  "Context items are not proof.",
  "Retrieval result is not evidence.",
  "Retrieval score is not truth score.",
  "Retrieval score is not promotion readiness.",
  "Bounded query summary is not query execution.",
  "No prompt is sent.",
  "No provider/OpenAI call is made.",
  "No embedding is created.",
  "No vector search is executed.",
  "No source fetch is executed.",
  "No DB query/write occurs.",
  "No Perspective promotion occurs.",
  "Raw RAG context payloads must not be stored.",
  "Raw retrieval outputs must not be stored.",
  "Source refs are lineage pointers, not proof.",
  "Source refs must be public-safe symbolic refs.",
  "Stale context cannot override current state.",
  "Unresolved tensions must be preserved.",
  "Knowledge gaps must be preserved.",
  "roadmap guide is not SSOT",
  typePath,
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
  "raw RAG context payload blocked by preview fixture",
  "secret-like RAG context input blocked by preview fixture",
];

const forbiddenPositiveAuthorityGrants = [
  "rag_answer_generation_now: true",
  "provider_openai_call_now: true",
  "prompt_sent_now: true",
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
  "db_query_or_write_now: true",
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
  "rag_answer_is_truth: true",
  "context_item_is_evidence: true",
  "retrieval_score_is_truth_score: true",
  "retrieval_score_is_promotion_readiness: true",
];

const roadmapText = readText(roadmapPath);
const contractDocText = readText(contractDocPath);
const indexRuntimeDocText = readText(indexRuntimeDocPath);
const docText = readText(docPath);
const typeText = readText(typePath);
const helperText = readText(helperPath);
const fixtureText = readText(fixturePath);
const componentText = readText(componentPath);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const fixture = JSON.parse(fixtureText);

assertIncludes(roadmapText, "rag_context_preview_v0_1", "roadmap contains rag_context_preview_v0_1");
assert(contractDocText.length > 0, "PR #779 contract doc exists");
assert(indexRuntimeDocText.length > 0, "PR #780 runtime doc exists");

assert.equal(fixture.fixture_version, "rag_context_preview.sample.v0.1");
assert.equal(fixture.preview_version, previewVersion);
assert.equal(fixture.input_version, inputVersion);
assert.equal(fixture.item_version, itemVersion);
assert.equal(fixture.envelope_version, envelopeVersion);
assert.equal(fixture.bundle_version, bundleVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.as_of, "2026-06-26T00:00:00.000Z");
assert.equal(fixture.roadmap_ref, roadmapPath);
assert(fixture.expected_bundle, "expected_bundle exists");
assert.equal(fixture.expected_bundle.bundle_version, bundleVersion);
assert.equal(fixture.expected_bundle.preview_version, previewVersion);
assert.equal(fixture.expected_bundle.scope, scope);
assert(Array.isArray(fixture.expected_bundle.inputs), "bundle inputs array exists");
assert(Array.isArray(fixture.expected_bundle.envelopes), "bundle envelopes array exists");
assert(fixture.expected_bundle.envelopes.length > 0, "bundle has envelopes");

assertArrayCovers(fixture.input_kind_coverage, requiredInputKinds, "input kind coverage");
assertArrayCovers(fixture.item_kind_coverage, requiredItemKinds, "item kind coverage");
assertArrayCovers(fixture.layer_coverage, requiredLayers, "layer coverage");
assertArrayCovers(fixture.inclusion_status_coverage, requiredInclusionStatuses, "inclusion status coverage");
assertArrayCovers(
  [...fixture.reason_code_coverage, typeText, helperText, fixtureText],
  requiredReasonCodes,
  "reason code coverage",
);

for (const envelope of fixture.expected_bundle.envelopes) {
  assertEnvelopeShape(envelope);
  assert(envelope.included_context_items.length > 0, "included_context_items is non-empty");
  assert(envelope.excluded_context_items.length > 0, "excluded_context_items is non-empty");
  assert(
    envelope.included_context_items.some((item) => item.stale_warning === true),
    "at least one stale included item has stale_warning true",
  );
  assert(envelope.unresolved_tension_refs.length > 0, "unresolved_tension_refs is non-empty");
  assert(envelope.knowledge_gap_refs.length > 0, "knowledge_gap_refs is non-empty");
  assert.deepEqual(
    envelope.unresolved_tension_refs,
    fixture.sample_input.unresolved_tension_refs.slice().sort(),
    "unresolved_tension_refs preserved",
  );
  assert.deepEqual(
    envelope.knowledge_gap_refs,
    fixture.sample_input.knowledge_gap_refs.slice().sort(),
    "knowledge_gap_refs preserved",
  );
  for (const item of [...envelope.included_context_items, ...envelope.excluded_context_items]) {
    assert.equal(item.context_item_is_evidence, false);
    assert.equal(item.retrieval_score_is_truth_score, false);
    assert.equal(item.retrieval_score_is_promotion_readiness, false);
  }
  assert.equal(envelope.rag_answer_generated, false);
  assert.equal(envelope.provider_call_executed, false);
  assert.equal(envelope.prompt_sent, false);
  assert.equal(envelope.embedding_created, false);
  assert.equal(envelope.vector_search_executed, false);
  assert.equal(envelope.source_fetch_executed, false);
  assert.equal(envelope.file_read_executed, false);
  assert.equal(envelope.db_query_executed, false);
  assert.equal(envelope.proof_or_evidence_created, false);
  assert.equal(envelope.perspective_promoted, false);
  assert.equal(envelope.product_write_executed, false);
  assert.equal(
    envelope.preview_fingerprint,
    fingerprintWithoutField(envelope, "preview_fingerprint"),
    "preview_fingerprint is deterministic canonical sha256",
  );
  assertNoAnswerOrPromptTextFields(envelope);
}

assert(
  allContextItems(fixture.expected_envelope).some((item) => item.retrieval_score_band === "high") &&
    allContextItems(fixture.expected_envelope).some((item) => item.retrieval_score_band === "medium") &&
    allContextItems(fixture.expected_envelope).some((item) => item.retrieval_score_band === "low"),
  "fixture includes high, medium, and low score items",
);
assert(
  fixture.expected_envelope.excluded_context_items.some(
    (item) => item.inclusion_status === "excluded_private_or_raw_payload",
  ),
  "private/raw context payload input is blocked or excluded",
);
const privateRawItem = fixture.expected_envelope.excluded_context_items.find(
  (item) => item.inclusion_status === "excluded_private_or_raw_payload",
);
assert(privateRawItem, "private/raw excluded item exists");
assert.equal(privateRawItem.input_ref, "blocked-rag-context-input-ref:8");
assert.equal(privateRawItem.bounded_title, "Blocked RAG context input");
assert.equal(privateRawItem.bounded_summary, "blocked RAG context payload redacted by preview");
assert.deepEqual(privateRawItem.source_refs, []);
assert.deepEqual(privateRawItem.candidate_refs, []);
assert.deepEqual(privateRawItem.review_memory_refs, []);
assert.deepEqual(privateRawItem.durable_summary_refs, []);
assert.deepEqual(privateRawItem.feedback_refs, []);
assert(
  !JSON.stringify(fixture.expected_envelope).includes("raw RAG context payload blocked by preview fixture"),
  "expected envelope does not echo private/raw placeholder payload",
);
assert(
  fixture.expected_envelope.excluded_context_items.some((item) => item.inclusion_status === "excluded_duplicate"),
  "duplicate input is excluded",
);
assert(
  fixture.expected_envelope.excluded_context_items.some((item) => item.inclusion_status === "excluded_unsupported_kind"),
  "unsupported input kind is excluded",
);
assert(
  fixture.expected_envelope.excluded_context_items.some((item) => item.inclusion_status === "excluded_empty_summary"),
  "empty summary is excluded",
);

await assertHelperBehavior();
assertComponentSource();
assertDocs();
assertFixturePrivacy();
assertIndexCoverage();

assert.equal(packageJson.scripts["smoke:rag-context-preview-v0-1"], "node scripts/smoke-rag-context-preview-v0-1.mjs");
assertIncludes(typeText, "RagContextPreviewAuthorityBoundary", "type contract exports authority boundary");
assertIncludes(helperText, "buildRagContextPreviewV01", "builder helper exported");

console.log("smoke:rag-context-preview-v0-1 passed");

async function assertHelperBehavior() {
  const helper = await import(pathToFileURL(helperPath).href);
  const envelopeA = helper.buildRagContextPreviewV01(fixture.sample_input);
  const envelopeB = helper.buildRagContextPreviewV01(fixture.sample_input);
  assert.deepEqual(envelopeA, fixture.expected_envelope, "builder output matches fixture");
  assert.deepEqual(envelopeB, envelopeA, "repeated build is deterministic");
  assert.equal(envelopeA.preview_fingerprint, envelopeB.preview_fingerprint, "repeated build fingerprint matches");
  assert.equal(
    envelopeA.preview_fingerprint,
    fixture.expected_envelope.preview_fingerprint,
    "fixture fingerprint remains stable",
  );
  const derivedRefs = helper.createRagContextPreviewInputRefsFromSearchResultV01(
    JSON.parse(readText("fixtures/research-retrieval-index-runtime.sample.v0.1.json")).expected_lexical_search_result,
  );
  assert.deepEqual(derivedRefs, fixture.derived_input_refs_from_search_result, "search result conversion matches fixture");
  assert(derivedRefs.length > 0, "search result conversion returns refs");
  assertTopLevelUnsafeInputIsRedacted(helper, "bounded_query_summary", "/Users/private/query");
  assertTopLevelUnsafeInputIsRedacted(helper, "unresolved_tension_refs", "/Users/private/tension");
  assertTopLevelUnsafeInputIsRedacted(helper, "knowledge_gap_refs", "/Users/private/gap");
  assertTopLevelUnsafeInputIsRedacted(helper, "boundary_notes", "/Users/private/boundary-note");
  assertUnsafeInputRefIsRedacted(helper);
  assertDuplicateRedactionPrecedence(helper);
  assertSafeDuplicateStillUsesDuplicate(helper);
}

function assertTopLevelUnsafeInputIsRedacted(helper, field, unsafeMarker) {
  const input = clone(fixture.sample_input);
  if (field === "bounded_query_summary") input.bounded_query_summary = unsafeMarker;
  else input[field] = [unsafeMarker];
  const envelope = helper.buildRagContextPreviewV01(input);
  const serializedEnvelope = JSON.stringify(envelope);
  assert(
    envelope.status === "blocked_private_or_raw_payload" || envelope.status === "rejected",
    `${field} unsafe input returns blocked/rejected envelope`,
  );
  assert(envelope.reason_codes.includes("private_or_raw_payload_blocked"), `${field} maps to private/raw reason`);
  assert(!serializedEnvelope.includes(unsafeMarker), `${field} unsafe marker is not echoed`);
  if (field === "bounded_query_summary") {
    assert.equal(
      envelope.bounded_query_summary,
      "blocked bounded query summary redacted by RAG context preview",
      "unsafe bounded query summary is redacted",
    );
  }
}

function assertUnsafeInputRefIsRedacted(helper) {
  const unsafeInputRef = "/Users/private/context-input-ref";
  const unsafeTitle = "/Users/private/context-title";
  const unsafeSummary = "/Users/private/context-summary";
  const input = clone(fixture.sample_input);
  input.input_refs = [
    {
      ...clone(fixture.sample_input.input_refs[0]),
      input_ref: unsafeInputRef,
      bounded_title: unsafeTitle,
      bounded_summary: unsafeSummary,
      source_refs: ["/Users/private/source-ref"],
      candidate_refs: ["/Users/private/candidate-ref"],
      review_memory_refs: ["/Users/private/review-ref"],
      durable_summary_refs: ["/Users/private/durable-ref"],
      feedback_refs: ["/Users/private/feedback-ref"],
      public_safe: true,
    },
  ];
  const envelope = helper.buildRagContextPreviewV01(input);
  const serializedEnvelope = JSON.stringify(envelope);
  const redactedItem = envelope.excluded_context_items.find(
    (item) => item.inclusion_status === "excluded_private_or_raw_payload",
  );
  assert(redactedItem, "unsafe input ref returns excluded private/raw item");
  assert.equal(redactedItem.input_ref, "blocked-rag-context-input-ref:0");
  assert.equal(redactedItem.bounded_title, "Blocked RAG context input");
  assert.equal(redactedItem.bounded_summary, "blocked RAG context payload redacted by preview");
  assert.deepEqual(redactedItem.source_refs, []);
  assert.deepEqual(redactedItem.candidate_refs, []);
  assert.deepEqual(redactedItem.review_memory_refs, []);
  assert.deepEqual(redactedItem.durable_summary_refs, []);
  assert.deepEqual(redactedItem.feedback_refs, []);
  assert(redactedItem.reason_codes.includes("private_or_raw_payload_blocked"), "redacted item has private/raw reason");
  for (const unsafeValue of [unsafeInputRef, unsafeTitle, unsafeSummary]) {
    assert(!serializedEnvelope.includes(unsafeValue), `unsafe input-ref field is not echoed: ${unsafeValue}`);
  }
}

function assertDuplicateRedactionPrecedence(helper) {
  const unsafeTitle = "Unsafe duplicate context title should not echo";
  const unsafeSummary = "Unsafe duplicate context summary should not echo";
  const unsafeSourceRef = "source-ref:unsafe-duplicate-should-not-echo";
  const input = clone(fixture.sample_input);
  const safeRef = {
    ...clone(fixture.sample_input.input_refs[0]),
    input_ref: "rag-context:duplicate-ref",
    bounded_title: "Safe duplicate context",
    bounded_summary: "Safe duplicate context summary.",
    source_refs: ["source-ref:duplicate-safe"],
    candidate_refs: ["candidate-ref:duplicate-safe"],
    review_memory_refs: [],
    durable_summary_refs: [],
    feedback_refs: [],
    public_safe: true,
  };
  const unsafeDuplicateRef = {
    ...clone(safeRef),
    bounded_title: unsafeTitle,
    bounded_summary: unsafeSummary,
    source_refs: [unsafeSourceRef],
    candidate_refs: ["candidate-ref:unsafe-duplicate-should-not-echo"],
    public_safe: false,
  };
  input.input_refs = [safeRef, unsafeDuplicateRef];
  const envelope = helper.buildRagContextPreviewV01(input);
  const serializedEnvelope = JSON.stringify(envelope);
  const redactedItem = envelope.excluded_context_items.find(
    (item) => item.input_ref === "blocked-rag-context-input-ref:1",
  );
  assert(redactedItem, "duplicate redaction-required input uses redacted placeholder ref");
  assert.equal(redactedItem.inclusion_status, "excluded_private_or_raw_payload");
  assert.equal(redactedItem.bounded_title, "Blocked RAG context input");
  assert.equal(redactedItem.bounded_summary, "blocked RAG context payload redacted by preview");
  assert.deepEqual(redactedItem.source_refs, []);
  assert.deepEqual(redactedItem.candidate_refs, []);
  assert.deepEqual(redactedItem.review_memory_refs, []);
  assert.deepEqual(redactedItem.durable_summary_refs, []);
  assert.deepEqual(redactedItem.feedback_refs, []);
  assert(redactedItem.reason_codes.includes("private_or_raw_payload_blocked"), "redacted duplicate has private/raw reason");
  assert(
    !envelope.excluded_context_items.some(
      (item) =>
        item.inclusion_status === "excluded_duplicate" &&
        (item.bounded_title === unsafeTitle || item.bounded_summary === unsafeSummary),
    ),
    "duplicate classification does not win for redaction-required input",
  );
  for (const unsafeValue of [unsafeTitle, unsafeSummary, unsafeSourceRef, "candidate-ref:unsafe-duplicate-should-not-echo"]) {
    assert(!serializedEnvelope.includes(unsafeValue), `unsafe duplicate field is not echoed: ${unsafeValue}`);
  }
}

function assertSafeDuplicateStillUsesDuplicate(helper) {
  const input = clone(fixture.sample_input);
  const safeRef = {
    ...clone(fixture.sample_input.input_refs[0]),
    input_ref: "rag-context:duplicate-ref",
    bounded_title: "Safe duplicate context",
    bounded_summary: "Safe duplicate context summary.",
    source_refs: ["source-ref:duplicate-safe"],
    candidate_refs: ["candidate-ref:duplicate-safe"],
    review_memory_refs: [],
    durable_summary_refs: [],
    feedback_refs: [],
    public_safe: true,
  };
  const safeDuplicateRef = {
    ...clone(safeRef),
    bounded_title: "Safe duplicate context repeated",
    bounded_summary: "Safe duplicate context repeated summary.",
    source_refs: ["source-ref:duplicate-safe-repeat"],
    candidate_refs: ["candidate-ref:duplicate-safe-repeat"],
  };
  input.input_refs = [safeRef, safeDuplicateRef];
  const envelope = helper.buildRagContextPreviewV01(input);
  const duplicateItem = envelope.excluded_context_items.find(
    (item) => item.inclusion_status === "excluded_duplicate",
  );
  assert(duplicateItem, "safe duplicate input produces excluded_duplicate");
  assert.equal(duplicateItem.input_ref, "rag-context:duplicate-ref");
  assert.equal(duplicateItem.bounded_title, "Safe duplicate context repeated");
  assert.equal(duplicateItem.bounded_summary, "Safe duplicate context repeated summary.");
}

function assertEnvelopeShape(envelope) {
  assert.equal(envelope.envelope_version, envelopeVersion);
  assert.equal(envelope.preview_version, previewVersion);
  assert.equal(envelope.scope, scope);
  assert(typeof envelope.preview_id === "string" && envelope.preview_id.length > 0);
  assert(Array.isArray(envelope.included_context_items));
  assert(Array.isArray(envelope.excluded_context_items));
  for (const item of [...envelope.included_context_items, ...envelope.excluded_context_items]) {
    assert.equal(item.item_version, itemVersion);
    assert.equal(item.scope, scope);
    assert(typeof item.item_id === "string" && item.item_id.length > 0);
    assert(requiredItemKinds.includes(item.item_kind), `valid item kind ${item.item_kind}`);
    assert(requiredLayers.includes(item.layer), `valid layer ${item.layer}`);
    assert(requiredInclusionStatuses.includes(item.inclusion_status), `valid inclusion status ${item.inclusion_status}`);
  }
}

function assertComponentSource() {
  for (const forbidden of [
    "fetch(",
    "useEffect",
    "POST",
    "OpenAI",
    "provider/OpenAI",
    "provider call",
    "promote button",
    "product write button",
    "create proof/evidence button",
  ]) {
    assert(!componentText.includes(forbidden), `component must not contain ${forbidden}`);
  }
  for (const required of [
    "RAG context preview only",
    "No answer generated",
    "Context items are not evidence",
    "Retrieval score is not truth score",
    "Product-write remains parked",
  ]) {
    assertIncludes(componentText, required, `component contains ${required}`);
  }
}

function assertDocs() {
  for (const phrase of requiredDocPhrases) assertIncludes(docText, phrase, `doc contains ${phrase}`);
  for (const grant of forbiddenPositiveAuthorityGrants) {
    assert(!docText.includes(grant), `doc must not contain ${grant}`);
  }
}

function assertFixturePrivacy() {
  const sanitized = allowedFixturePlaceholders.reduce(
    (text, placeholder) => text.split(placeholder).join(""),
    fixtureText,
  );
  for (const marker of forbiddenFixtureMarkers) {
    assert(!sanitized.includes(marker), `fixture must not contain forbidden marker ${marker}`);
  }
}

function assertIndexCoverage() {
  for (const pointer of [
    docPath,
    typePath,
    helperPath,
    fixturePath,
    "scripts/smoke-rag-context-preview-v0-1.mjs",
    componentPath,
  ]) {
    assertIncludes(indexText, pointer, `index points to ${pointer}`);
  }
  const indexBlock = extractIndexBlock(indexText, "RAG Context Preview v0.1");
  assertIncludes(indexBlock, "preview-only", "index mentions preview-only");
  assertIncludes(indexBlock, "no answer generated", "index mentions no answer generated");
  for (const forbiddenImplication of [
    "answer generation was added",
    "provider calls were added",
    "prompt sending was added",
    "embeddings were added",
    "vector search was added",
    "source fetch was added",
    "proof/evidence writes were added",
    "Perspective promotion was added",
    "product-write was added",
  ]) {
    assert(!indexBlock.includes(forbiddenImplication), `index must not imply ${forbiddenImplication}`);
  }
}

function assertNoAnswerOrPromptTextFields(value, path = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoAnswerOrPromptTextFields(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    assert(!["answer_text", "final_answer", "prompt_text", "actual_prompt"].includes(key), `${path}.${key} is forbidden`);
    assertNoAnswerOrPromptTextFields(nested, `${path}.${key}`);
  }
}

function allContextItems(envelope) {
  return [...envelope.included_context_items, ...envelope.excluded_context_items];
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
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
  const text = Array.isArray(actual) ? actual.join("\\n") : String(actual);
  for (const value of expected) assertIncludes(text, value, `${label} includes ${value}`);
}

function assertIncludes(text, needle, message) {
  assert(text.includes(needle), message);
}

function readText(path) {
  return readFileSync(path, "utf8");
}
