#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath = "docs/POST_868_NON_UI_RUNTIME_GAP_RECONCILIATION_V0_1.md";
const fixturePath =
  "fixtures/post-868-non-ui-runtime-gap-reconciliation.sample.v0.1.json";
const smokePath =
  "scripts/smoke-post-868-non-ui-runtime-gap-reconciliation-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const packageScriptName = "smoke:post-868-non-ui-runtime-gap-reconciliation-v0-1";
const packageScriptValue =
  "node scripts/smoke-post-868-non-ui-runtime-gap-reconciliation-v0-1.mjs";
const selectedNextSlice = "dogfooding_record_runtime_store_route_v0_1";

const requiredCategories = [
  "done",
  "done_but_ui_excluded",
  "still_valid",
  "blocked",
  "superseded",
];

const requiredBlockedCapabilities = [
  "product_write",
  "accepted_evidence_ref_write",
  "product_id_allocation",
  "github_actuation",
  "github_api_call_from_augnes_runtime",
  "git_branch_commit_pr_from_augnes_runtime",
  "release_execution",
  "release_deploy_publish",
  "live_provider_validation",
  "provider_openai_call",
  "source_fetch",
  "retrieval_expansion",
  "retrieval_execution",
  "proof_evidence_creation",
  "claim_evidence_write",
  "promotion_execution",
  "formation_receipt_write",
  "durable_perspective_state_apply",
  "durable_state_mutation",
  "ci_pass_as_truth",
  "smoke_pass_as_truth",
  "validation_pass_as_proof",
  "pr_body_as_authority",
  "git_ref_as_authority",
  "github_pr_as_core_decision",
];

const requiredWebLastEntries = [
  "ui_implementation_or_polish",
  "cockpit_changes",
  "browser_validation_only_work",
  "public_surface_work",
  "route_ia_polish",
  "mobile_viewport_polish",
  "read_display_ui_expansion",
];

const requiredNoRepeatSurfaces = [
  "research_candidate_review_memory_store_v0_1",
  "research_candidate_review_memory_routes_v0_1",
  "bounded_source_intake_runtime_v0_1",
  "provider_assisted_extraction_runtime_v0_1",
  "research_retrieval_runtime_contract_v0_1",
  "rebuildable_retrieval_index_runtime_v0_1",
  "rag_context_preview_v0_1",
  "final_rag_answer_generation_candidate_review_v0_1",
  "final_rag_answer_candidate_review_memory_binding_v0_1",
  "promotion_readiness_packet_from_review_memory_v0_1",
  "dogfooding_record_runtime_contract_v0_1",
  "dogfooding_ingestion_runtime_v0_1",
  "privacy_redaction_runtime_guard_v0_1",
  "runtime_audit_panel_runtime_completion_v0_1",
  "product_write_accepted_evidence_ref_runtime_v0_1",
];

const requiredFalseAuthorityKeys = [
  "ui_change_now",
  "component_change_now",
  "cockpit_change_now",
  "public_surface_change_now",
  "route_model_change_now",
  "api_route_change_now",
  "db_schema_change_now",
  "db_migration_now",
  "provider_openai_call_now",
  "live_provider_validation_now",
  "retrieval_execution_now",
  "retrieval_expansion_now",
  "source_fetch_now",
  "proof_evidence_creation_now",
  "claim_evidence_write_now",
  "promotion_execution_now",
  "formation_receipt_write_now",
  "durable_perspective_state_apply_now",
  "durable_state_mutation_now",
  "product_write_now",
  "accepted_evidence_ref_write_now",
  "product_id_allocation_now",
  "codex_execution_from_augnes_runtime_now",
  "git_branch_commit_pr_from_augnes_runtime_now",
  "github_api_call_from_augnes_runtime_now",
  "github_actuation_now",
  "release_execution_now",
  "release_deploy_publish_now",
  "ci_pass_is_truth",
  "smoke_pass_is_truth",
  "validation_pass_is_proof",
  "pr_body_is_authority",
  "git_ref_is_authority",
  "github_pr_is_core_decision",
];

const expectedChangedFiles = new Set([
  docsPath,
  fixturePath,
  smokePath,
  "scripts/smoke-authority-boundary-regression-v0-1.mjs",
  packagePath,
  indexPath,
]);

const forbiddenOpenedCapabilityPhrases = [
  ["product-write", "is open"],
  ["product write", "is open"],
  ["GitHub actuation", "is open"],
  ["Git actuation", "is open"],
  ["live provider validation", "is open"],
  ["release execution", "is open"],
  ["release deploy publish", "is open"],
  ["provider output", "is truth"],
  ["retrieval score", "is truth"],
  ["CI pass", "is proof"],
  ["smoke pass", "is proof"],
  ["PR body", "is authority"],
  ["Git ref", "is authority"],
  ["GitHub PR", "is Core decision"],
].map(([subject, predicate]) => `${subject} ${predicate}`);

for (const filePath of [docsPath, fixturePath, smokePath, packagePath, indexPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const docsText = readText(docsPath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);
const joinedText = `${docsText}\n${fixtureText}\n${indexText}`;

assertPackageAndIndex();
assertPost868Baseline();
assertTopLevelCategories();
assertSelectedNextSlice();
assertWebLastBacklog();
assertBlockedCapabilities();
assertCompletedNoRepeatSurfaces();
assertAuthorityBoundary();
assertEvidenceRefs();
assertNoWebFirstDrift();
assertNoOpenedForbiddenCapabilities();
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "post-868-non-ui-runtime-gap-reconciliation-v0-1",
      final_status: "pass",
      selected_next_slice: fixture.selected_next_slice,
      classification_categories: requiredCategories,
      web_last_backlog_entries: fixture.web_last_backlog.length,
      forbidden_capabilities: fixture.forbidden_capabilities.length,
      changed_file_scope_checked: true
    },
    null,
    2
  )
);

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

function assertPackageAndIndex() {
  assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue, "package script");
  for (const pointer of [
    docsPath,
    fixturePath,
    smokePath,
    packageScriptName,
    selectedNextSlice,
    "Web last",
  ]) {
    assertIncludes(indexText, pointer, `latest index pointer ${pointer}`);
  }
}

function assertPost868Baseline() {
  assert.equal(fixture.post_868_baseline.pr_868_is_frozen_web_baseline, true);
  assert.equal(fixture.post_868_baseline.route_model_frozen, true);
  assert.deepEqual(fixture.post_868_baseline.routes, {
    "/": "public Augnes surface",
    "/perspective": "Perspective detail",
    "/workbench": "cockpit/workbench",
  });
  for (const phrase of [
    "PR #868 is the frozen web baseline.",
    "/ = public Augnes surface",
    "/perspective = Perspective detail",
    "/workbench = cockpit/workbench",
    "Core first, Handoff first, Conversation first, Web last",
    "old v0.2.1 roadmap",
  ]) {
    assertIncludes(docsText, phrase, `baseline doc phrase ${phrase}`);
  }
}

function assertTopLevelCategories() {
  assert.deepEqual(fixture.classification_categories, requiredCategories);
  for (const category of requiredCategories) {
    assert.ok(Array.isArray(fixture.classifications?.[category]), `${category} array exists`);
    assert.ok(fixture.classifications[category].length > 0, `${category} array has entries`);
    assertIncludes(docsText, `\`${category}\``, `doc category ${category}`);
  }
  for (const [category, entries] of Object.entries(fixture.classifications)) {
    for (const entry of entries) {
      assertIncludes(docsText, entry, `doc mirrors ${category} entry ${entry}`);
    }
  }
}

function assertSelectedNextSlice() {
  assert.equal(fixture.selected_next_slice, selectedNextSlice);
  assert.ok(!Array.isArray(fixture.selected_next_slice), "selected_next_slice must be one string");
  assert.ok(
    !Object.hasOwn(fixture, "selected_next_slices"),
    "fixture must not include plural selected_next_slices"
  );
  assert.deepEqual(fixture.classifications.still_valid, [selectedNextSlice]);
  assertIncludes(docsText, `\`${selectedNextSlice}\``, "doc selected next slice");
  for (const constraint of [
    "must_not_recreate_dogfooding_record_runtime_contract_v0_1",
    "must_not_recreate_dogfooding_ingestion_runtime_v0_1",
    "must_remain_non_ui",
  ]) {
    assert.ok(
      fixture.selected_next_slice_constraints.includes(constraint),
      `selected next constraint ${constraint}`
    );
  }
}

function assertWebLastBacklog() {
  for (const entry of requiredWebLastEntries) {
    assert.ok(fixture.web_last_backlog.includes(entry), `web-last entry ${entry}`);
  }
  for (const phrase of [
    "Web-last backlog",
    "UI implementation or UI polish",
    "Cockpit changes",
    "Browser-validation-only work",
    "Public-surface work",
    "Route IA polish",
    "Mobile viewport polish",
    "Read/display-only UI expansion",
  ]) {
    assertIncludes(docsText, phrase, `web-last doc phrase ${phrase}`);
  }
}

function assertBlockedCapabilities() {
  for (const capability of requiredBlockedCapabilities) {
    assert.ok(
      fixture.forbidden_capabilities.includes(capability),
      `forbidden capability ${capability}`
    );
    assertIncludes(docsText, `\`${capability}\``, `doc forbidden capability ${capability}`);
  }
}

function assertCompletedNoRepeatSurfaces() {
  for (const surface of requiredNoRepeatSurfaces) {
    assert.ok(
      fixture.completed_no_repeat_surfaces.includes(surface),
      `no-repeat surface ${surface}`
    );
    assertIncludes(docsText, `\`${surface}\``, `doc no-repeat surface ${surface}`);
  }
}

function assertAuthorityBoundary() {
  assert.equal(fixture.authority_boundary.docs_fixture_smoke_package_index_only, true);
  for (const key of requiredFalseAuthorityKeys) {
    assert.equal(fixture.authority_boundary[key], false, `${key} remains false`);
  }
}

function assertEvidenceRefs() {
  for (const ref of fixture.evidence_refs) {
    assert.ok(existsSync(ref), `evidence ref exists: ${ref}`);
    assertIncludes(docsText, `\`${ref}\``, `doc evidence ref ${ref}`);
  }
}

function assertNoWebFirstDrift() {
  const forbiddenPatterns = [
    /\bweb[- ]first\b/i,
    /\bui[- ]first\b/i,
    /\bcockpit[- ]first\b/i,
    /\bpublic[- ]surface[- ]first\b/i,
    /\broute[- ]ia[- ]first\b/i,
    /\bbrowser[- ]validation[- ]first\b/i,
  ];
  for (const pattern of forbiddenPatterns) {
    assert.doesNotMatch(joinedText, pattern, `forbidden Web-first wording ${pattern}`);
  }
}

function assertNoOpenedForbiddenCapabilities() {
  const normalized = normalize(joinedText);
  for (const phrase of forbiddenOpenedCapabilityPhrases) {
    assert.ok(
      !normalized.toLowerCase().includes(phrase.toLowerCase()),
      `must not open forbidden capability wording: ${phrase}`
    );
  }
  for (const key of [
    "product_write_now",
    "github_actuation_now",
    "live_provider_validation_now",
    "release_execution_now",
  ]) {
    assert.equal(fixture.authority_boundary[key], false, `${key} is not opened`);
  }
}

function assertChangedFileScope() {
  const changedFiles = collectChangedFiles();
  for (const filePath of changedFiles) {
    assert(expectedChangedFiles.has(filePath), `Unexpected changed file: ${filePath}`);
    assert.doesNotMatch(filePath, /^app\//, "no app files may change");
    assert.doesNotMatch(filePath, /^components\//, "no component files may change");
    assert.doesNotMatch(filePath, /^lib\/db\//, "no DB schema files may change");
    assert.doesNotMatch(filePath, /migrations/i, "no migration files may change");
    assert.doesNotMatch(
      filePath,
      /provider|retrieval|source-fetch/i,
      "no provider/retrieval/source-fetch files may change"
    );
  }
}

function collectChangedFiles() {
  const outputs = [
    execFileSync("git", ["diff", "--name-only", "HEAD"], { encoding: "utf8" }),
    execFileSync("git", ["ls-files", "--others", "--exclude-standard"], { encoding: "utf8" }),
  ];
  return [...new Set(outputs.flatMap((output) => output.split(/\r?\n/).filter(Boolean)))].sort();
}

function assertIncludes(text, phrase, label) {
  assert.ok(text.includes(phrase), `Expected ${label} to include ${JSON.stringify(phrase)}`);
}
