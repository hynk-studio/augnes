import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const docsPath = "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_BINDING_V0_1.md";
const fixturePath = "fixtures/final-rag-answer-review-memory-binding.sample.v0.1.json";
const typePath = "types/final-rag-answer-review-memory-binding.ts";
const helperPath = "lib/research-retrieval/final-rag-answer-review-memory-binding.ts";
const routePath = "app/api/research-retrieval/final-rag-answer/review-memory/route.ts";
const packagePath = "package.json";
const latestIndexPath = "docs/00_INDEX_LATEST.md";
const auditStorePath = "lib/runtime-audit/audit-event-store.ts";
const v04AuditPath = "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_4.md";
const finalRagDocsPath = "docs/FINAL_RAG_ANSWER_GENERATION_CANDIDATE_REVIEW_V0_1.md";
const finalRagFixturePath = "fixtures/final-rag-answer-generation-candidate-review.sample.v0.1.json";
const finalRagSmokePath = "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs";
const finalRagTypePath = "types/final-rag-answer-candidate-review.ts";
const finalRagBuilderPath = "lib/research-retrieval/build-final-rag-answer-candidate.ts";
const finalRagProviderBoundaryPath =
  "lib/research-retrieval/final-rag-answer-provider-boundary.ts";
const reviewMemoryStoreDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_STORE_RUNTIME_COMPLETION_V0_1.md";
const reviewMemoryRoutesDocsPath =
  "docs/RESEARCH_CANDIDATE_REVIEW_MEMORY_DB_ROUTES_RUNTIME_COMPLETION_V0_1.md";
const reviewMemoryStoreFixturePath =
  "fixtures/research-candidate-review.memory-db-store-runtime.sample.v0.1.json";
const reviewMemoryRoutesFixturePath =
  "fixtures/research-candidate-review.memory-db-routes-runtime.sample.v0.1.json";
const reviewMemoryStoreHelperPath = "lib/research-candidate-review/review-memory-db-store.ts";
const reviewMemoryRouteContractPath =
  "lib/research-candidate-review/review-memory-db-route-contract.ts";
const reviewMemoryRecordsRoutePath =
  "app/api/research-candidate-review/review-records/route.ts";
const runtimeAuditDocPath = "docs/RUNTIME_AUDIT_PANEL_RUNTIME_COMPLETION_V0_1.md";
const privacyGuardDocPath = "docs/PRIVACY_REDACTION_RUNTIME_GUARD_V0_1.md";

const packageScriptName = "smoke:final-rag-answer-review-memory-binding-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs";
const runtimeVersion = "final_rag_answer_review_memory_binding.v0.1";
const requestVersion = "final_rag_answer_review_memory_binding_request.v0.1";
const resultVersion = "final_rag_answer_review_memory_binding_result.v0.1";
const routeVersion = "final_rag_answer_review_memory_binding_route.v0.1";
const runtimeRef = "final_rag_answer_candidate_review_memory_binding_v0_1";
const scope = "project:augnes";
const tempRoot = `.tmp/research-candidate-review-memory/final-rag-review-memory-binding-smoke-${process.pid}`;
const dbPath = `${tempRoot}/review-memory.sqlite`;
const auditDbPath = `.tmp/runtime-audit/final-rag-review-memory-binding-smoke-${process.pid}.sqlite`;
const invalidAuditDbPath = "../runtime-audit/final-rag-review-memory-binding.sqlite";

const expectedChangedFiles = new Set([
  typePath,
  helperPath,
  routePath,
  docsPath,
  fixturePath,
  "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs",
  packagePath,
  latestIndexPath,
  auditStorePath,
  "scripts/smoke-final-rag-answer-generation-candidate-review-v0-1.mjs",
  "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-4.mjs",
  "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_5.md",
  "fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.5.json",
  "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-5.mjs",
  "components/final-rag-answer-review-memory-panel.tsx",
  "app/research-retrieval/final-rag-answer/review-memory/page.tsx",
  "docs/FINAL_ANSWER_CANDIDATE_REVIEW_UI_BINDING_V0_1.md",
  "fixtures/final-answer-candidate-review-ui-binding.sample.v0.1.json",
  "scripts/smoke-final-answer-candidate-review-ui-binding-v0-1.mjs",
  "scripts/smoke-research-candidate-review-memory-db-ui-runtime-v0-1.mjs",
  "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_6.md",
  "fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.6.json",
  "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-6.mjs",
  "types/promotion-readiness-packet-from-review-memory.ts",
  "lib/perspective/promotion/promotion-readiness-packet-from-review-memory.ts",
  "app/api/perspective/promotion/readiness-packet/route.ts",
  "docs/PROMOTION_READINESS_PACKET_FROM_REVIEW_MEMORY_V0_1.md",
  "fixtures/promotion-readiness-packet-from-review-memory.sample.v0.1.json",
  "scripts/smoke-promotion-readiness-packet-from-review-memory-v0-1.mjs",
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_END_TO_END_OPERATOR_PATH_V0_1.md",
  "fixtures/final-rag-answer-review-memory-end-to-end-operator-path.sample.v0.1.json",
  "scripts/smoke-final-rag-answer-review-memory-end-to-end-operator-path-v0-1.mjs",
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_BROWSER_VALIDATION_V0_1.md",
  "fixtures/final-rag-answer-review-memory-operator-browser-validation.sample.v0.1.json",
  "scripts/browser-validate-final-rag-answer-review-memory-operator-path-v0-1.mjs",
  "scripts/smoke-final-rag-answer-review-memory-operator-browser-validation-v0-1.mjs",
  "docs/FINAL_RAG_ANSWER_REVIEW_MEMORY_OPERATOR_PATH_USABILITY_AUDIT_V0_1.md",
  "fixtures/final-rag-answer-review-memory-operator-path-usability-audit.sample.v0.1.json",
  "scripts/smoke-final-rag-answer-review-memory-operator-path-usability-audit-v0-1.mjs",
  "docs/OPERATOR_PATH_MANUAL_QA_RUNBOOK_V0_1.md",
  "fixtures/operator-path-manual-qa-runbook.sample.v0.1.json",
  "scripts/smoke-operator-path-manual-qa-runbook-v0-1.mjs",
  "docs/OPERATOR_PATH_ASSISTED_MANUAL_QA_EXECUTION_REPORT_V0_1.md",
  "fixtures/operator-path-assisted-manual-qa-execution-report.sample.v0.1.json",
  "scripts/assisted-execute-operator-path-manual-qa-v0-1.mjs",
  "scripts/smoke-operator-path-assisted-manual-qa-execution-report-v0-1.mjs",
]);
const falseExecutionFlags = [
  "provider_call_executed",
  "prompt_sent",
  "retrieval_executed",
  "rag_answer_generated",
  "final_answer_generated",
  "source_fetch_executed",
  "retrieval_index_write_executed",
  "proof_or_evidence_created",
  "claim_or_evidence_written",
  "promotion_executed",
  "durable_state_written",
  "durable_state_applied",
  "formation_receipt_written",
  "product_write_executed",
  "accepted_evidence_ref_write_executed",
  "product_id_allocated",
  "github_api_called",
  "git_write_executed",
  "release_executed",
];
const authorityForbiddenFalseFields = [
  "provider_openai_call_now",
  "prompt_sent_now",
  "raw_prompt_stored_now",
  "raw_provider_output_stored_now",
  "raw_retrieval_output_stored_now",
  "raw_source_body_stored_now",
  "hidden_reasoning_stored_now",
  "chain_of_thought_stored_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "final_rag_answer_generation_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "product_write_now",
  "accepted_evidence_ref_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "broad_product_persistence_now",
  "product_persistence_now",
  "git_write_now",
  "github_api_call_now",
  "repository_file_write_now",
  "release_execution_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "review_memory_is_truth",
  "review_memory_is_proof",
  "review_memory_is_accepted_evidence",
  "review_memory_is_durable_perspective_state",
  "final_answer_candidate_is_truth",
  "final_answer_candidate_is_proof",
  "final_answer_candidate_is_accepted_evidence",
  "final_answer_candidate_is_promotion",
  "final_answer_candidate_is_product",
  "source_ref_is_proof",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];
const authorityAllowedTrueFields = [
  "final_rag_answer_review_memory_binding_now",
  "explicit_operator_review_memory_binding_only",
  "same_origin_post_route_now",
  "caller_injected_review_memory_db_only",
  "review_memory_db_store_now",
  "final_answer_candidate_input_required",
  "answer_review_state_candidate_only_required",
  "source_refs_lineage_only",
  "no_truth_language_required",
  "no_proof_language_required",
];

for (const filePath of [
  docsPath,
  fixturePath,
  typePath,
  helperPath,
  routePath,
  packagePath,
  latestIndexPath,
  auditStorePath,
  v04AuditPath,
  finalRagDocsPath,
  finalRagFixturePath,
  finalRagSmokePath,
  finalRagTypePath,
  finalRagBuilderPath,
  finalRagProviderBoundaryPath,
  reviewMemoryStoreDocsPath,
  reviewMemoryRoutesDocsPath,
  reviewMemoryStoreFixturePath,
  reviewMemoryRoutesFixturePath,
  reviewMemoryStoreHelperPath,
  reviewMemoryRouteContractPath,
  reviewMemoryRecordsRoutePath,
  runtimeAuditDocPath,
  privacyGuardDocPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const docsText = readText(docsPath);
const normalizedDocs = normalize(docsText);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const latestIndexText = readText(latestIndexPath);
const routeSource = readText(routePath);
const helperSource = readText(helperPath);
const typeSource = readText(typePath);
const auditStoreSource = readText(auditStorePath);
const v04AuditText = readText(v04AuditPath);
const finalRagDocsText = readText(finalRagDocsPath);
const reviewMemoryStoreDocsText = readText(reviewMemoryStoreDocsPath);
const reviewMemoryRoutesDocsText = readText(reviewMemoryRoutesDocsPath);

const helper = await import(pathToFileURL(helperPath).href);
const route = await import(pathToFileURL(routePath).href);
rmSync(tempRoot, { recursive: true, force: true });
rmSync(auditDbPath, { force: true });
process.on("exit", () => {
  rmSync(tempRoot, { recursive: true, force: true });
  rmSync(auditDbPath, { force: true });
});

assertDocsFixturePackageAndIndex();
assertStaticBoundaries();
await assertRouteRuntimeBehavior();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "final-rag-answer-review-memory-binding-v0-1",
      final_status: "pass",
      runtime_version: runtimeVersion,
      request_version: requestVersion,
      result_version: resultVersion,
      route_version: routeVersion,
      scope,
    },
    null,
    2,
  ),
);

function assertDocsFixturePackageAndIndex() {
  assert.equal(fixture.fixture_version, "final_rag_answer_review_memory_binding.sample.v0.1");
  assert.equal(fixture.runtime_version, runtimeVersion);
  assert.equal(fixture.request_version, requestVersion);
  assert.equal(fixture.result_version, resultVersion);
  assert.equal(fixture.route_version, routeVersion);
  assert.equal(fixture.scope, scope);
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  for (const pointer of [
    docsPath,
    typePath,
    helperPath,
    routePath,
    fixturePath,
    "scripts/smoke-final-rag-answer-review-memory-binding-v0-1.mjs",
    packageScriptName,
    runtimeRef,
  ]) {
    assert.ok(latestIndexText.includes(pointer), `latest index must include ${pointer}`);
  }
  for (const marker of [
    "v0_2_1_remaining_runtime_gap_audit_v0_4",
    "final_rag_answer_generation_candidate_review_v0_1",
  ]) {
    assert.ok(v04AuditText.includes(marker), `v0.4 audit must include ${marker}`);
  }
  assert.ok(finalRagDocsText.includes("Provider output remains candidate-only."));
  assert.ok(reviewMemoryStoreDocsText.includes("Review memory is not truth."));
  assert.ok(reviewMemoryRoutesDocsText.includes("This slice closes the original Phase 2.3 DB-backed route gap."));
  for (const phrase of [
    "This is the explicitly approved final RAG answer candidate Review Memory binding slice only.",
    "It writes bounded Review Memory DB records from already generated final RAG answer candidates.",
    "It does not generate final answers.",
    "It does not call providers.",
    "It does not send prompts.",
    "It does not execute retrieval.",
    "It does not fetch sources.",
    "It does not create proof/evidence.",
    "It does not write claim/evidence records.",
    "It does not promote Perspective.",
    "It does not write/apply durable Perspective state.",
    "It does not write Formation Receipts.",
    "It does not product-write.",
    "It does not write accepted evidence refs.",
    "It does not allocate product IDs.",
    "It does not enable product-write adapter.",
    "It does not execute Git/GitHub/release work.",
    "Review Memory is not truth.",
    "Review Memory is not proof.",
    "Review Memory is not accepted evidence.",
    "Review Memory is not durable Perspective state.",
    "Final answer candidate remains candidate-only.",
    "Source refs are lineage pointers, not proof.",
    "Operator review note is review memory, not authority for promotion or product-write.",
    "final_rag_answer_review_memory_binding_runtime",
    "Smoke/CI pass is not truth.",
  ]) {
    assert.ok(normalizedDocs.includes(phrase), `docs must include ${phrase}`);
  }
  assert.ok(typeSource.includes("FinalRagAnswerReviewMemoryBindingRequestV01"));
  assert.ok(helperSource.includes("preflightFinalRagAnswerReviewMemoryBindingRuntimeV01"));
  assert.ok(helperSource.includes("buildFinalRagAnswerReviewMemoryCreateInputV01"));
  assert.ok(auditStoreSource.includes("\"final_rag_answer_review_memory_binding_runtime\""));
  assertPublicSafeFixture();
}

function assertStaticBoundaries() {
  assert.equal(typeof route.POST, "function", "route exports POST");
  assert.equal(route.GET, undefined, "no GET route");
  assert.ok(routeSource.includes("requestHasSameOriginBoundary"));
  assert.ok(routeSource.includes("same_origin_required"));
  assert.ok(routeSource.includes("preflightFinalRagAnswerReviewMemoryBindingRuntimeV01"));
  assert.ok(routeSource.indexOf("preflightFinalRagAnswerReviewMemoryBindingRuntimeV01") < routeSource.indexOf("openWriteLocalDb(input.review_memory_db_path)"));
  assert.ok(routeSource.includes("createResearchCandidateReviewRecordV01") || helperSource.includes("createResearchCandidateReviewRecordV01"));
  assert.ok(routeSource.includes("final_rag_answer_review_memory_binding_runtime"));
  assert.ok(!routeSource.includes("export async function GET"));
  for (const source of [routeSource, helperSource]) {
    assert.ok(!source.includes("OpenAI"), "no provider call path");
    assert.ok(!source.includes("fetch("), "no source fetch path");
    assert.ok(!source.includes("createPullRequest"), "no GitHub actuation path");
    assert.ok(!source.includes("product write implementation"), "no product-write path");
  }
}

async function assertRouteRuntimeBehavior() {
  const validBody = routeBody(validInput({ review_memory_db_path: dbPath }));
  const crossOrigin = await callJson(
    route.POST(new Request("http://localhost:3000/api/research-retrieval/final-rag-answer/review-memory", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        host: "localhost:3000",
        origin: "https://example.invalid",
      },
      body: JSON.stringify(validBody),
    })),
    403,
  );
  assert.equal(crossOrigin.error_code, "same_origin_required");
  assert.equal(existsSync(dbPath), false, "cross-origin request must not create DB");

  const created = await callJson(route.POST(localPostRequest(validBody)), 201);
  assert.equal(created.status, "ok");
  assert.equal(created.error_code, null);
  assert.equal(created.result.status, fixture.expected_success.status);
  assert.equal(created.result.store_result.status, "created");
  assert.equal(created.result.store_result.record.record_kind, fixture.expected_success.record_kind);
  assert.equal(created.result.store_result.record.lifecycle_state, fixture.expected_success.lifecycle_state);
  assert.equal(created.audit_event_result.status, fixture.audit_cases.missing_audit_db_path_status);
  assertFalseExecutionFlags(created);
  assertFalseExecutionFlags(created.result);
  assertAuthorityBoundary(created.authority_boundary, {
    db_query_or_write_now: true,
    review_record_persistence_now: true,
    review_record_activity_persistence_now: true,
    bounded_review_memory_snapshot_now: true,
  });
  const record = created.result.store_result.record;
  assert.equal(record.review_record_id, fixture.valid_binding_request.idempotency_key);
  assert.deepEqual(record.candidate_refs.sort(), [
    fixture.valid_binding_request.final_answer_candidate_result.answer_candidate_ref,
    fixture.valid_binding_request.final_answer_candidate_result.answer_request_id,
    fixture.valid_binding_request.final_answer_candidate_result.rag_context_preview_ref,
  ].sort());
  assert.deepEqual(
    record.source_refs.map((source) => source.source_ref).sort(),
    fixture.valid_binding_request.final_answer_candidate_result.cited_source_refs.slice().sort(),
  );
  for (const source of record.source_refs) {
    assert.equal(source.public_safe, true);
    assert.equal(source.source_surface, "manual_source_ref");
  }
  assertNoUnsafeEcho(record.bounded_summary, "bounded summary");
  for (const ack of [
    "review_memory_not_truth",
    "review_memory_not_proof",
    "review_memory_not_accepted_evidence",
    "review_memory_not_durable_state",
  ]) {
    assert.ok(record.boundary_acknowledgements.includes(ack), `record acknowledgement ${ack}`);
  }
  assert.ok(record.boundary_acknowledgements.includes("final_answer_candidate_not_truth"));
  assert.ok(record.reason_codes.includes("review_memory_not_truth"));
  assert.equal(countRows(dbPath).records, 1);
  assert.equal(countRows(dbPath).candidates, 3);
  assert.equal(countRows(dbPath).sources, 2);
  assert.equal(countRows(dbPath).activities, 1);

  const idempotentInvalidAudit = await callJson(
    route.POST(localPostRequest({ ...validBody, audit_db_path: invalidAuditDbPath })),
    200,
  );
  assert.equal(idempotentInvalidAudit.result.status, fixture.expected_success.idempotent_status);
  assert.equal(idempotentInvalidAudit.audit_event_result.status, fixture.audit_cases.invalid_audit_db_path_status);
  assert.equal(countRows(dbPath).records, 1);

  const idempotentWithAudit = await callJson(
    route.POST(localPostRequest({ ...validBody, audit_db_path: auditDbPath })),
    200,
  );
  assert.equal(idempotentWithAudit.result.status, fixture.expected_success.idempotent_status);
  assertAuditPublicSafe();

  const conflictInput = validInput({
    review_memory_db_path: dbPath,
    operator_review_payload: {
      ...fixture.valid_binding_request.operator_review_payload,
      reviewer_note_summary: "Keep this bounded candidate with a materially different review note.",
    },
  });
  const conflict = await callJson(route.POST(localPostRequest(routeBody(conflictInput))), 409);
  assert.equal(conflict.result.status, fixture.expected_success.conflict_status);
  assert.equal(countRows(dbPath).records, 1);

  await assertRejectedNoCreate(
    "missing-answer-candidate-ref",
    removeCandidateField("answer_candidate_ref"),
    fixture.rejection_cases.missing_answer_candidate_ref_status,
  );
  await assertRejectedNoCreate(
    "no-truth-claim-false",
    candidateOverride({ no_truth_claim: false }),
    fixture.rejection_cases.no_truth_claim_false_status,
  );
  await assertRejectedNoCreate(
    "proof-created-true",
    candidateOverride({ proof_or_evidence_created: true }),
    fixture.rejection_cases.proof_or_evidence_created_true_status,
  );
  await assertRejectedNoCreate(
    "product-write-executed-true",
    candidateOverride({ product_write_executed: true }),
    fixture.rejection_cases.product_write_executed_true_status,
  );
  await assertRejectedNoCreate(
    "empty-cited-source-refs",
    candidateOverride({ cited_source_refs: [] }),
    fixture.rejection_cases.empty_cited_source_refs_status,
  );
  await assertRejectedNoCreate(
    "unsafe-cited-source-ref",
    candidateOverride({ cited_source_refs: ["source-ref:SAFE_MARKER_SECRET_TOKEN"] }),
    fixture.rejection_cases.unsafe_cited_source_ref_status,
  );
  await assertRejectedNoCreate(
    "citation-note-source-not-cited",
    candidateOverride({
      bounded_citation_notes: [
        {
          source_ref: "source-ref:not-cited",
          context_refs: ["context-ref:not-cited"],
          bounded_note: "Lineage pointer that is not in cited source refs.",
        },
      ],
    }),
    fixture.rejection_cases.citation_note_source_not_cited_status,
  );

  for (const testCase of fixture.forbidden_authority_cases) {
    const value = valueForKind(testCase.value_kind);
    await assertRejectedNoCreate(
      `forbidden-${testCase.field}-${testCase.value_kind}`,
      {
        authority_boundary: {
          ...fixture.valid_binding_request.authority_boundary,
          [testCase.field]: value,
        },
      },
      testCase.expected_status,
      403,
    );
  }
  for (const testCase of fixture.private_raw_key_blocked_cases) {
    await assertRejectedNoCreate(
      `private-key-${testCase.blocked_key}`,
      {
        [testCase.blocked_key]: testCase.bounded_looking_value,
      },
      testCase.expected_status,
    );
  }

  const invalidDbPath = await callJson(
    route.POST(localPostRequest(routeBody(validInput({
      review_memory_db_path: fixture.invalid_db_path_case.db_path,
    })))),
    400,
  );
  assert.equal(invalidDbPath.result.status, fixture.invalid_db_path_case.expected_status);
  assertNoUnsafeEcho(invalidDbPath, "invalid DB path response");
}

async function assertRejectedNoCreate(label, overrides, expectedStatus, expectedHttpStatus = 400) {
  const dbPathForCase = `${tempRoot}/no-create-${label}/review-memory.sqlite`;
  const input = validInput({
    review_memory_db_path: dbPathForCase,
    idempotency_key: `review-memory-binding:final-rag-answer:${label}`,
    binding_request_id: `final-rag-review-memory-binding:${label}`,
    ...overrides,
  });
  const beforeDir = dirname(dbPathForCase);
  assert.equal(existsSync(beforeDir), false, `${label} precondition no directory`);
  const response = await callJson(route.POST(localPostRequest(routeBody(input))), expectedHttpStatus);
  assert.equal(response.result.status, expectedStatus, `${label} status`);
  assert.equal(existsSync(dbPathForCase), false, `${label} must not create DB file`);
  assert.equal(existsSync(beforeDir), false, `${label} must not create DB directory`);
  assertFalseExecutionFlags(response);
  assertNoUnsafeEcho(response, `${label} response`);
}

function assertAuditPublicSafe() {
  assert.ok(existsSync(auditDbPath), "audit DB should exist when requested");
  const db = new Database(auditDbPath, { readonly: true, fileMustExist: true });
  try {
    const rows = db.prepare("SELECT * FROM runtime_audit_events").all();
    assert.ok(rows.length >= 1, "audit event should be written");
    for (const row of rows) {
      assert.equal(row.event_surface, fixture.audit_cases.expected_event_surface);
      assertNoUnsafeEcho(row, "audit event row");
    }
  } finally {
    db.close();
  }
}

function validInput(overrides = {}) {
  const base = structuredClone(fixture.valid_binding_request);
  const finalResultOverrides = overrides.final_answer_candidate_result ?? {};
  const operatorPayloadOverrides = overrides.operator_review_payload ?? {};
  const authorityBoundaryOverrides = overrides.authority_boundary ?? {};
  return {
    ...base,
    ...overrides,
    final_answer_candidate_result: {
      ...base.final_answer_candidate_result,
      ...finalResultOverrides,
    },
    operator_review_payload: {
      ...base.operator_review_payload,
      ...operatorPayloadOverrides,
    },
    authority_boundary: {
      ...base.authority_boundary,
      ...authorityBoundaryOverrides,
    },
  };
}

function routeBody(input) {
  return {
    route_version: routeVersion,
    scope,
    input,
  };
}

function candidateOverride(overrides) {
  return {
    final_answer_candidate_result: {
      ...fixture.valid_binding_request.final_answer_candidate_result,
      ...overrides,
    },
  };
}

function removeCandidateField(field) {
  return {
    final_answer_candidate_result: {
      ...fixture.valid_binding_request.final_answer_candidate_result,
      [field]: undefined,
    },
  };
}

function valueForKind(kind) {
  if (kind === "string_true") return "true";
  if (kind === "numeric_one") return 1;
  if (kind === "object_enabled") return { enabled: true };
  if (kind === "array_enabled") return ["enabled"];
  throw new Error(`Unhandled value kind ${kind}`);
}

async function callJson(responseOrPromise, expectedStatus = 200) {
  const response = await responseOrPromise;
  assert.equal(response.status, expectedStatus, `HTTP status ${expectedStatus}`);
  const json = await response.json();
  assertNoUnsafeEcho(json, "route response");
  return json;
}

function localPostRequest(body) {
  return new Request("http://localhost:3000/api/research-retrieval/final-rag-answer/review-memory", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      host: "localhost:3000",
    },
    body: JSON.stringify(body),
  });
}

function countRows(path) {
  const db = new Database(path, { readonly: true, fileMustExist: true });
  try {
    return {
      records: Number(db.prepare("SELECT COUNT(*) AS count FROM research_candidate_review_records").get().count),
      candidates: Number(db.prepare("SELECT COUNT(*) AS count FROM research_candidate_review_record_candidates").get().count),
      sources: Number(db.prepare("SELECT COUNT(*) AS count FROM research_candidate_review_record_sources").get().count),
      activities: Number(db.prepare("SELECT COUNT(*) AS count FROM research_candidate_review_record_activity").get().count),
    };
  } finally {
    db.close();
  }
}

function assertFalseExecutionFlags(value) {
  for (const field of falseExecutionFlags) {
    assert.equal(value[field], false, `${field} must be false`);
  }
}

function assertAuthorityBoundary(boundary, conditionalExpected = {}) {
  assert.ok(boundary && typeof boundary === "object", "authority boundary object");
  for (const field of authorityAllowedTrueFields) {
    assert.equal(boundary[field], true, `${field} true`);
  }
  for (const [field, expected] of Object.entries(conditionalExpected)) {
    assert.equal(boundary[field], expected, `${field} conditional`);
  }
  for (const field of authorityForbiddenFalseFields) {
    assert.equal(boundary[field], false, `${field} false`);
  }
}

function assertPublicSafeFixture() {
  assert.equal(fixture.public_safe_fixture_policy.symbolic_refs_only, true);
  for (const field of [
    "raw_prompt_allowed",
    "raw_provider_output_allowed",
    "raw_retrieval_output_allowed",
    "raw_source_body_allowed",
    "raw_candidate_payload_allowed",
    "raw_db_rows_allowed",
    "raw_conversations_allowed",
    "hidden_reasoning_allowed",
    "chain_of_thought_allowed",
    "telemetry_dumps_allowed",
    "raw_diffs_allowed",
    "terminal_logs_allowed",
    "github_payloads_allowed",
    "browser_dumps_allowed",
    "private_paths_allowed",
    "private_urls_allowed",
    "secrets_allowed",
    "provider_keys_allowed",
    "provider_internal_ids_allowed",
    "real_product_ids_allowed",
  ]) {
    assert.equal(fixture.public_safe_fixture_policy[field], false, `${field} false`);
  }
  assertNoLiveLookingFixtureValues(fixtureText);
}

function assertNoUnsafeEcho(value, label) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  for (const marker of [
    "SAFE_MARKER_RAW_PROVIDER_OUTPUT",
    "SAFE_MARKER_RAW_RETRIEVAL_OUTPUT",
    "SAFE_MARKER_PRIVATE_URL",
    "SAFE_MARKER_LOCAL_PRIVATE_PATH",
    "SAFE_MARKER_SECRET_TOKEN",
    "SAFE_MARKER_HIDDEN_REASONING",
  ]) {
    assert.equal(text.includes(marker), false, `${label} must not echo ${marker}`);
  }
  assert.doesNotMatch(text, /sk-[A-Za-z0-9]|ghp_[A-Za-z0-9]|OPENAI_API_KEY|GITHUB_TOKEN/);
  assert.doesNotMatch(text, /\/Users\/|\/home\/|file:\/\//);
  assert.doesNotMatch(text, /raw source body:|raw provider output:|raw retrieval output:|raw DB row:|raw conversation:|hidden reasoning:|telemetry dump:|diff --git/i);
}

function assertNoLiveLookingFixtureValues(text) {
  const sanitized = text
    .replaceAll('"raw_provider_output"', '"blocked_key"')
    .replaceAll('"raw_candidate_payload"', '"blocked_key"')
    .replaceAll('"hidden_reasoning"', '"blocked_key"')
    .replaceAll("raw_provider_output_allowed", "blocked_policy")
    .replaceAll("raw_candidate_payload_allowed", "blocked_policy")
    .replaceAll("hidden_reasoning_allowed", "blocked_policy");
  assert.doesNotMatch(sanitized, /\/Users\/|\/home\/|file:\/\//);
  assert.doesNotMatch(sanitized, /\bsk-[A-Za-z0-9_-]{8,}\b|\bghp_[A-Za-z0-9_]{8,}\b|\bgithub_pat_[A-Za-z0-9_]{8,}\b/);
  assert.doesNotMatch(sanitized, /diff --git/);
}

function assertChangedFileScope() {
  const changed = new Set();
  for (const args of [
    ["diff", "--name-only"],
    ["ls-files", "--others", "--exclude-standard"],
  ]) {
    for (const filePath of runGitLines(args)) {
      if (!isTempSmokeArtifact(filePath)) changed.add(filePath);
    }
  }
  for (const args of [
    ["diff", "--name-only", "origin/main...HEAD"],
    ["diff", "--name-only", "main...HEAD"],
  ]) {
    const lines = runGitLines(args, { allowFailure: true });
    for (const filePath of lines) {
      if (!isTempSmokeArtifact(filePath)) changed.add(filePath);
    }
    if (lines.length > 0) break;
  }
  const unexpected = [...changed].filter((filePath) => !expectedChangedFiles.has(filePath)).sort();
  assert.deepEqual(
    unexpected,
    [],
    "changed-file scope limited to final RAG answer review memory binding files plus exact audit surface update",
  );
}

function isTempSmokeArtifact(filePath) {
  return filePath.startsWith(".tmp/") || filePath.startsWith("tmp/");
}

function runGitLines(args, options = {}) {
  try {
    return execFileSync("git", args, { cwd: process.cwd(), encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    if (options.allowFailure) return [];
    throw error;
  }
}

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalize(value) {
  return value.replace(/\s+/g, " ").trim();
}
