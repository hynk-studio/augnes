import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const builderPath =
  "lib/research-candidate-review/formation-receipt-durable-event.ts";
const contractFixturePath =
  "fixtures/research-candidate-review.formation-receipt-durable-event-contract.sample.v0.1.json";
const fixturePath =
  "fixtures/research-candidate-review.formation-receipt-durable-event-implementation.sample.v0.1.json";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.formation-receipt-durable-event-browser-validation.sample.v0.1.json";
const smokePath =
  "scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs";
const browserValidationSmokePath =
  "scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs";
const contractSmokePath =
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:formation-receipt-durable-event-implementation-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs";
const browserValidationPackageScriptName =
  "smoke:formation-receipt-durable-event-browser-validation-v0-1";
const browserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs";
const implementationKind = "formation_receipt_durable_event_implementation";
const implementationVersion =
  "formation_receipt_durable_event_implementation.v0.1";
const eventVersion = "formation_receipt_durable_event.v0.1";
const recommendationStatus =
  "ready_for_formation_receipt_durable_event_browser_validation_v0_1";
const nextRecommendedSlice =
  "formation_receipt_durable_event_browser_validation_v0_1";
const browserValidationVersion =
  "formation_receipt_durable_event_browser_validation.v0.1";
const browserValidationRecommendationStatus =
  "ready_for_recent_rehearsal_buffer_contract_v0_1";
const browserValidationNextRecommendedSlice =
  "recent_rehearsal_buffer_contract_v0_1";
const writeFixture = process.argv.includes("--write-fixture");

const expectedChangedFiles = [
  builderPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  contractSmokePath,
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
];
const browserValidationChangedFiles = [
  browserValidationFixturePath,
  browserValidationSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
  contractSmokePath,
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
];

for (const filePath of [
  builderPath,
  contractFixturePath,
  smokePath,
  contractSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}
if (!writeFixture) {
  assert.ok(existsSync(fixturePath), `${fixturePath} must exist`);
}

const builderSource = readFile(builderPath);
const contractSmokeSource = readFile(contractSmokePath);
const packageJson = readJson(packagePath);
const basePackageJson = readJsonFromGit(packagePath);
const contractFixture = readJson(contractFixturePath);
const indexDoc = readFile(indexPath);
const substrateDoc = readFile(substrateDocPath);
const surfaceDoc = readFile(surfaceDocPath);
const gateDoc = readFile(gateDocPath);

const { buildFormationReceiptDurableEventImplementation } = await import(
  "../lib/research-candidate-review/formation-receipt-durable-event.ts"
);

const rebuiltFixture = buildImplementationFixture();

if (writeFixture) {
  writeFileSync(fixturePath, `${JSON.stringify(rebuiltFixture, null, 2)}\n`);
  process.exit(0);
}

const fixture = readJson(fixturePath);

assertBuilderFile();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertImplementationFixture(fixture);
assertGeneratedReceiptEvent(fixture.generated_receipt_event, contractFixture);
assertSelectedContextSummary(fixture.selected_context_summary);
assertExcludedContextSummary(fixture.excluded_context_summary);
assertUnresolvedTensionSummary(fixture.unresolved_tension_summary);
assertReferenceLinkSummary(fixture.reference_link_summary);
assertAuthorityBoundary(fixture.authority_boundary);
assertValidationPolicy(fixture.validation_policy);
assertValidation(fixture.validation);
assertInvalidOverrideSummaryConsistency();
assertDocsPointers();
assertContractSmokeDownstreamPointer();
assertFormationReceiptDurableEventBrowserValidationDownstreamPointer();
assert.deepEqual(
  fixture,
  rebuiltFixture,
  "rebuilt Formation Receipt durable event implementation fixture must match committed fixture",
);

console.log(
  JSON.stringify(
    {
      smoke: "formation-receipt-durable-event-implementation-v0-1",
      final_status: "pass",
      implementation_kind: fixture.implementation_kind,
      implementation_version: fixture.implementation_version,
      source_contract_fingerprint: fixture.source_contract_fingerprint,
      generated_event_version: fixture.generated_receipt_event.event_version,
      selected_context_count:
        fixture.selected_context_summary.selected_context_count,
      excluded_context_count:
        fixture.excluded_context_summary.excluded_context_count,
      unresolved_tensions_preserved:
        fixture.validation.unresolved_tensions_preserved,
      durable_event_written_now:
        fixture.authority_boundary.durable_event_written_now,
      runtime_db_write_now: fixture.authority_boundary.runtime_db_write_now,
      runtime_db_query_now: fixture.authority_boundary.runtime_db_query_now,
      browser_request_now: fixture.authority_boundary.browser_request_now,
      salience_authority: fixture.authority_boundary.salience_authority,
      product_write_lane_parked_by_686:
        fixture.authority_boundary.product_write_lane_parked_by_686,
      next_recommended_slice: fixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function buildImplementationFixture() {
  return buildFormationReceiptDurableEventImplementation({
    formation_receipt_durable_event_contract: contractFixture,
    source_contract_ref: `${contractFixture.contract_version}:${contractFixturePath}`,
  });
}

function assertBuilderFile() {
  for (const requiredText of [
    "buildFormationReceiptDurableEventImplementation",
    "formation_receipt_durable_event_implementation",
    "formation_receipt_durable_event_implementation.v0.1",
    "source_contract_ref",
    "source_contract_fingerprint",
    "source_feedback_event_aggregation_validation_ref",
    "generated_receipt_event",
    "selected_context_summary",
    "excluded_context_summary",
    "unresolved_tension_summary",
    "reference_link_summary",
    "authority_boundary",
    "validation_policy",
    "recommendation_status",
    "next_recommended_slice",
    "implementation_fingerprint",
    "fnv1a32_canonical_json",
  ]) {
    assert.ok(builderSource.includes(requiredText), `${builderPath} must include ${requiredText}`);
  }
  assert.match(
    builderSource,
    /export function buildFormationReceiptDurableEventImplementation\b/,
    "builder must export buildFormationReceiptDurableEventImplementation",
  );
}

function assertPackageScript() {
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  const addedScripts = Object.keys(packageJson.scripts)
    .filter((scriptName) => !basePackageJson.scripts[scriptName])
    .sort();
  if (browserValidationSliceActive()) {
    assert.equal(
      packageJson.scripts[browserValidationPackageScriptName],
      browserValidationPackageScriptValue,
    );
    assert.deepEqual(
      addedScripts,
      [browserValidationPackageScriptName],
      "package.json must add only the Formation Receipt durable event browser validation smoke script",
    );
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
    return;
  }
  assert.deepEqual(
    addedScripts,
    [packageScriptName],
    "package.json must add only the Formation Receipt durable event implementation smoke script",
  );
  assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  const activeExpectedFiles = browserValidationSliceActive()
    ? browserValidationChangedFiles
    : expectedChangedFiles;
  if (browserValidationSliceActive()) {
    assert.ok(
      !changedFiles.includes(builderPath),
      "browser validation slice must not change the #713 builder",
    );
    assert.ok(
      !changedFiles.includes(fixturePath),
      "browser validation slice must not change the #713 implementation fixture",
    );
  }
  for (const expectedFile of activeExpectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      activeExpectedFiles.includes(changedFile),
      `unexpected changed file in Formation Receipt durable event implementation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(provider|retrieval|source-fetch)\b/i);
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function assertNoForbiddenRuntimePatterns() {
  const changedSourceFiles = readChangedFiles().filter((filePath) =>
    (filePath.endsWith(".ts") || filePath.endsWith(".tsx") || filePath.endsWith(".mjs")) &&
    !filePath.startsWith("scripts/smoke-"),
  );
  for (const filePath of changedSourceFiles) {
    const source = stripValidationText(readFile(filePath));
    for (const { label, regex } of [
      { label: "route handler", regex: /\bexport\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\b/ },
      { label: "server action", regex: /["']use server["']/ },
      { label: "browser fetch", regex: /\bfetch\s*\(/ },
      { label: "localStorage", regex: /\blocalStorage\b/ },
      { label: "sessionStorage", regex: /\bsessionStorage\b/ },
      { label: "indexedDB", regex: /\bindexedDB\b/ },
      { label: "document.cookie", regex: /document\.cookie/ },
      { label: "DB open", regex: /\bnew\s+Database\b|\bopenDatabase\b|better-sqlite3/i },
      { label: "runtime SQL", regex: /\bdb\.(prepare|query|exec)\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b/ },
      { label: "DB write", regex: /\bdb\.(insert|update|delete|transaction)\b|\bruntimeDbWrite\b|\bproductionDbWrite\b/i },
      { label: "durable event runtime writer", regex: /\b(write|insert|persist)FormationReceipt(Durable)?Event\b/i },
      { label: "feedback write", regex: /\bwriteFeedbackEvent\b|\binsertFeedbackEvent\b|\bmutateFeedbackEvent\b/ },
      { label: "OpenAI import", regex: /from\s+["'][^"']*openai["']/i },
      { label: "OpenAI constructor", regex: /new\s+OpenAI\b/i },
      { label: "source fetch call", regex: /\bfetchSource\b|\bsourceFetch\b/ },
      { label: "retrieval execution", regex: /\brunRetrieval\b|\brunRag\b|\brunRAG\b/ },
      { label: "embedding/vector/FTS implementation", regex: /\bcreateEmbedding\b|\bvectorIndex\b|\bFTS5\b/i },
      { label: "Codex product execution", regex: /\bcodex\s+(exec|run)\b/i },
      { label: "GitHub automation", regex: /\bgh\s+pr\b|Octokit|api\.github\.com/i },
      { label: "external handoff send", regex: /\bsendExternalHandoff\b/ },
      { label: "agent execution", regex: /\bexecuteAgent\b|\brouteAgent\b/ },
      { label: "proof write", regex: /\bcreateProof\b|\binsertProof\b/ },
      { label: "evidence write", regex: /\bcreateEvidence\b|\binsertEvidence\b/ },
      { label: "Perspective promotion", regex: /\bpromotePerspective\b/ },
      { label: "Perspective durable state write", regex: /\bwritePerspective\b|\bupsertPerspective\b/ },
      { label: "promotion decision", regex: /\bcreatePromotionDecision\b|\brecordPromotionDecision\b/ },
      { label: "work mutation", regex: /\bcreateWork\b|\bmutateWork\b|\bupdateWork\b/ },
      { label: "salience authority true flag", regex: /\bsalience_authority:\s*true\b/ },
      { label: "salience score", regex: /\bsalience_score\b|\bsalienceScore\b/ },
      { label: "product write", regex: /\bexecuteProductWrite\b|\bproductDbWrite\b/i },
      { label: "product ID allocation", regex: /\ballocateProductId\b/i },
    ]) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
}

function assertImplementationFixture(value) {
  assert.equal(value.implementation_kind, implementationKind);
  assert.equal(value.implementation_version, implementationVersion);
  assert.equal(
    value.source_contract_ref,
    `${contractFixture.contract_version}:${contractFixturePath}`,
  );
  assert.equal(value.source_contract_fingerprint, contractFixture.contract_fingerprint);
  assert.equal(
    value.source_feedback_event_aggregation_validation_ref,
    contractFixture.source_feedback_event_aggregation_validation_ref,
  );
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.match(value.implementation_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
}

function assertGeneratedReceiptEvent(event, contract) {
  for (const field of Object.keys(contract.durable_event_fields)) {
    assert.ok(Object.hasOwn(event, field), `generated receipt event must include ${field}`);
  }
  assert.equal(event.event_version, eventVersion);
  assert.ok(event.formation_receipt_event_id.startsWith("formation_receipt_event_contract_sample"));
  assert.ok(Array.isArray(event.selected_context_refs) && event.selected_context_refs.length > 0);
  assert.ok(Array.isArray(event.excluded_context_refs) && event.excluded_context_refs.length > 0);
  assert.ok(Array.isArray(event.unresolved_tension_ids) && event.unresolved_tension_ids.length > 0);
  assert.ok(Array.isArray(event.source_refs) && event.source_refs.length > 0);
  assert.ok(Array.isArray(event.candidate_refs) && event.candidate_refs.length > 0);
  assert.ok(Array.isArray(event.digest_refs) && event.digest_refs.length > 0);
  assert.ok(Array.isArray(event.handoff_refs) && event.handoff_refs.length > 0);
  assert.ok(Array.isArray(event.decision_refs) && event.decision_refs.length > 0);
  assert.ok(Array.isArray(event.result_refs) && event.result_refs.length > 0);
  assert.deepEqual(event.authority_boundary, contract.authority_boundary);
  assert.deepEqual(event.validation, contract.validation_policy);
}

function assertSelectedContextSummary(value) {
  assert.equal(value.selected_context_count, fixture.generated_receipt_event.selected_context_refs.length);
  assert.deepEqual(
    value.selected_context_ref_ids,
    fixture.generated_receipt_event.selected_context_refs.map((ref) => ref.context_ref_id),
  );
  assert.equal(value.selected_context_has_source_refs, true);
  assert.equal(value.provenance_only, true);
  assert.equal(value.not_proof_or_evidence, true);
  assert.equal(value.not_source_of_truth, true);
  assert.equal(value.not_perspective_promotion, true);
  assert.equal(value.not_work_completion, true);
  assert.equal(value.not_product_write, true);
  for (const ref of fixture.generated_receipt_event.selected_context_refs) {
    assert.ok(Array.isArray(ref.source_refs) && ref.source_refs.length > 0);
  }
}

function assertExcludedContextSummary(value) {
  assert.equal(value.excluded_context_count, fixture.generated_receipt_event.excluded_context_refs.length);
  assert.deepEqual(
    value.excluded_context_ref_ids,
    fixture.generated_receipt_event.excluded_context_refs.map((ref) => ref.context_ref_id),
  );
  assert.equal(value.excluded_context_reasons_present, true);
  assert.equal(value.deletes_records, false);
  assert.equal(value.suppresses_future_review, false);
  assert.equal(value.audit_provenance_only, true);
  for (const ref of fixture.generated_receipt_event.excluded_context_refs) {
    assert.ok(typeof ref.reason === "string" && ref.reason.length > 0);
    assert.equal(
      fixture.generated_receipt_event.excluded_context_reasons[ref.context_ref_id],
      ref.reason,
    );
  }
}

function assertUnresolvedTensionSummary(value) {
  assert.equal(value.unresolved_tension_count, fixture.generated_receipt_event.unresolved_tension_ids.length);
  assert.deepEqual(value.unresolved_tension_ids, fixture.generated_receipt_event.unresolved_tension_ids);
  assert.equal(value.unresolved_tensions_preserved, true);
  assert.equal(value.receipt_creation_resolves_tensions, false);
  assert.equal(value.contract_decides_promotion, false);
  assert.equal(value.implementation_decides_promotion, false);
}

function assertReferenceLinkSummary(value) {
  assert.equal(value.digest_refs_count, fixture.generated_receipt_event.digest_refs.length);
  assert.equal(value.handoff_refs_count, fixture.generated_receipt_event.handoff_refs.length);
  assert.equal(value.decision_refs_count, fixture.generated_receipt_event.decision_refs.length);
  assert.equal(value.result_refs_count, fixture.generated_receipt_event.result_refs.length);
  assert.equal(value.references_only, true);
  assert.equal(value.creates_referenced_objects, false);
  assert.equal(value.approves_merge, false);
  assert.equal(value.executes_codex_or_github_automation, false);
  assert.equal(value.mutates_work_status, false);
  for (const ref of [
    ...fixture.generated_receipt_event.digest_refs,
    ...fixture.generated_receipt_event.handoff_refs,
    ...fixture.generated_receipt_event.decision_refs,
    ...fixture.generated_receipt_event.result_refs,
  ]) {
    assert.equal(ref.references_only, true);
  }
}

function assertAuthorityBoundary(value) {
  assert.deepEqual(value, {
    implementation_added_now: true,
    contract_followed_now: true,
    fixture_backed_only: true,
    deterministic_builder_added_now: true,
    runtime_persistence_implemented_now: false,
    durable_event_written_now: false,
    runtime_db_write_now: false,
    runtime_db_query_now: false,
    production_db_used_now: false,
    db_schema_implemented_now: false,
    route_changed_now: false,
    component_changed_now: false,
    browser_request_now: false,
    feedback_events_written_now: false,
    feedback_events_mutated_now: false,
    proof_or_evidence_record: false,
    perspective_promotion: false,
    durable_perspective_state_write: false,
    promotion_decision_record: false,
    work_mutation: false,
    execution_authority: false,
    codex_execution_authority: false,
    github_automation_authority: false,
    external_handoff_authority: false,
    provider_openai_authority: false,
    retrieval_rag_authority: false,
    source_fetch_authority: false,
    salience_authority: false,
    product_write_authority: false,
    product_id_allocation_authority: false,
    product_write_lane_parked_by_686: true,
  });
}

function assertValidationPolicy(value) {
  assert.deepEqual(value, {
    static_source_validation_only: true,
    fixture_backed_only: true,
    app_server_started_now: false,
    production_db_used_now: false,
    runtime_browser_request_now: false,
    runtime_db_query_now: false,
    runtime_db_write_now: false,
  });
}

function assertValidation(value) {
  assert.equal(value.passed, true);
  assert.deepEqual(value.failure_codes, []);
  assert.equal(value.selected_context_has_source_refs, true);
  assert.equal(value.excluded_context_has_reasons, true);
  assert.equal(value.unresolved_tensions_preserved, true);
  assert.equal(value.reference_links_are_reference_only, true);
  assert.equal(value.authority_boundary_preserved, true);
  assert.equal(value.deterministic_rebuild_matches_fixture, true);
}

function assertInvalidOverrideSummaryConsistency() {
  const invalidOverride = buildFormationReceiptDurableEventImplementation({
    formation_receipt_durable_event_contract: contractFixture,
    selected_context_refs: [
      {
        context_ref_id: "selected_context_ref_missing_source_refs",
        context_kind: "synthetic_invalid_selected_context",
        selection_status: "selected",
        source_refs: [],
        reason: "Synthetic invalid override for summary validation consistency.",
      },
    ],
    excluded_context_refs: [
      {
        context_ref_id: "excluded_context_ref_missing_reason",
        context_kind: "synthetic_invalid_excluded_context",
        selection_status: "excluded",
        source_refs: ["source_ref_feedback_aggregation_validation_711"],
        reason: "",
      },
    ],
  });

  assert.equal(invalidOverride.validation.selected_context_has_source_refs, false);
  assert.ok(
    invalidOverride.validation.failure_codes.includes("selected_context_missing_source_refs"),
  );
  assert.equal(
    invalidOverride.selected_context_summary.selected_context_has_source_refs,
    false,
  );
  assert.equal(invalidOverride.validation.excluded_context_has_reasons, false);
  assert.ok(
    invalidOverride.validation.failure_codes.includes("excluded_context_missing_reason"),
  );
  assert.equal(
    invalidOverride.excluded_context_summary.excluded_context_reasons_present,
    false,
  );
}

function assertDocsPointers() {
  for (const requiredText of [
    "Formation Receipt durable event implementation v0.1",
    builderPath,
    fixturePath,
    smokePath,
    packageScriptName,
    "deterministic fixture-backed implementation",
    "generated receipt event shape from #712 contract",
    "selected/excluded context summary",
    "unresolved tension preservation",
    "reference-only decision/handoff/result links",
    "no runtime persistence",
    "no runtime DB write/query",
    "no schema/migration",
    "no route or UI",
    "no browser request",
    "no proof/evidence/Perspective promotion/work mutation",
    "no provider/OpenAI/source-fetch/retrieval/RAG execution",
    "no salience authority",
    "no product write/product IDs",
    "product-write remains parked by #686",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index doc must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Formation Receipt durable event implementation v0\.1/i);
    assert.match(doc, /deterministic/i);
    assert.match(doc, /fixture-backed/i);
    assert.match(doc, /receipt-shaped provenance artifacts|provenance and reference links/i);
    assert.match(doc, /not proof\/evidence/i);
    assert.match(doc, /not Perspective state|durable Perspective promotion/i);
    assert.match(doc, /not work status|work mutation/i);
    assert.match(doc, /not promotion authority|promotion/i);
    assert.match(doc, /not salience authority|salience/i);
    assert.match(doc, /retrieval\/RAG/i);
    assert.match(doc, /product write/i);
    assert.match(doc, /no runtime DB|runtime DB/i);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertContractSmokeDownstreamPointer() {
  for (const requiredText of [
    implementationVersion,
    builderPath,
    fixturePath,
    smokePath,
    packageScriptName,
    recommendationStatus,
    nextRecommendedSlice,
    "assertFormationReceiptDurableEventImplementationDownstreamPointer",
  ]) {
    assert.ok(
      contractSmokeSource.includes(requiredText),
      `#712 contract smoke must allow implementation downstream pointer: ${requiredText}`,
    );
  }
}

function assertFormationReceiptDurableEventBrowserValidationDownstreamPointer() {
  if (!browserValidationSliceActive()) return;
  for (const requiredText of [
    browserValidationVersion,
    browserValidationFixturePath,
    browserValidationSmokePath,
    browserValidationPackageScriptName,
    browserValidationRecommendationStatus,
    browserValidationNextRecommendedSlice,
    "summary_validation_consistent_for_invalid_overrides",
    "product-write remains parked by #686",
  ]) {
    assert.ok(
      readFile(smokePath).includes(requiredText),
      `#713 implementation smoke must allow browser validation text: ${requiredText}`,
    );
  }
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readJsonFromGit(filePath) {
  return JSON.parse(readGitOutput(["show", `${mergeBaseRef()}:${filePath}`]));
}

function readChangedFiles() {
  const changed = [
    ...readGitOutput(["diff", "--name-only", mergeBaseRef()]).split("\n"),
    ...readGitOutput(["diff", "--cached", "--name-only"]).split("\n"),
    ...readGitOutput(["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ]
    .map((line) => line.trim())
    .filter(Boolean);
  return [...new Set(changed)].sort();
}

function browserValidationSliceActive() {
  return readChangedFiles().includes(browserValidationSmokePath);
}

function stripValidationText(source) {
  return source
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(["'`])(?:\\.|(?!\1)[\s\S])*\1/g, "\"\"");
}

function mergeBaseRef() {
  return readGitOutput(["merge-base", "HEAD", "origin/main"]).trim();
}

function readGitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}
