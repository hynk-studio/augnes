import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const docPath = "docs/RESEARCH_CANDIDATE_LIFECYCLE_READ_MODEL_V0_1.md";
const fixturePath = "fixtures/research-candidate-review.lifecycle.sample.v0.1.json";
const typePath = "types/research-candidate-lifecycle.ts";
const helperPath = "lib/research-candidate-review/lifecycle-read-model.ts";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const packageScriptName = "smoke:research-candidate-lifecycle-read-model-v0-1";
const packageScriptValue =
  "node scripts/smoke-research-candidate-lifecycle-read-model-v0-1.mjs";
const lifecycleVersion = "research_candidate_lifecycle.v0.1";
const lifecycleStatus = "derived_read_model_only";

const forbiddenAuthorityFields = [
  "source_of_truth",
  "proof_or_evidence_record",
  "perspective_promotion",
  "durable_perspective_state",
  "work_mutation",
  "execution_authority",
  "codex_execution_authority",
  "github_automation_authority",
  "provider_openai_authority",
  "source_fetch_authority",
  "retrieval_rag_authority",
  "git_ledger_export_authority",
  "product_write_authority",
  "product_id_allocation_authority",
];

const nextReviewActions = new Set([
  "inspect_source",
  "resolve_tension",
  "add_evidence",
  "review_feedback",
  "prepare_handoff",
  "defer",
  "reject_candidate",
  "no_action",
]);

for (const filePath of [docPath, fixturePath, typePath, helperPath, packagePath, indexPath]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const doc = readFile(docPath);
const fixture = readJson(fixturePath);
const typeSource = readFile(typePath);
const helperSource = readFile(helperPath);
const packageJson = readJson(packagePath);
const indexDoc = readFile(indexPath);

assert.equal(fixture.fixture_version, "research_candidate_lifecycle.sample.v0.1");
assert.equal(fixture.lifecycle_version, lifecycleVersion);
assert.equal(fixture.scope, "project:augnes");
assert.equal(fixture.status, lifecycleStatus);
assert.equal(fixture.expected_read_model.status, lifecycleStatus);

assertTypeContract();
assertHelperBoundary();
assertReadModelFixture(fixture.expected_read_model);
assertDocCoverage();
assertNoForbiddenPositiveAuthorityGrants(doc);
assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
assert.ok(indexDoc.includes(docPath), "index must point to lifecycle read model doc");
assertIndexBoundary();

const helper = await import(pathToFileURL(resolve(helperPath)).href);
const builtModel = helper.buildResearchCandidateLifecycleReadModel({
  scope: fixture.scope,
  as_of: fixture.as_of,
  source_fixture_refs: fixture.source_fixture_refs,
  ...fixture.input_preview,
});
assert.deepEqual(
  builtModel,
  fixture.expected_read_model,
  "helper output must match expected fixture read model",
);
assert.deepEqual(helper.validateResearchCandidateLifecycleReadModel(builtModel), {
  passed: true,
  failure_codes: [],
});
assert.equal(
  helper.createResearchCandidateLifecycleFingerprint(builtModel),
  builtModel.lifecycle_fingerprint,
  "lifecycle fingerprint must be stable",
);

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-lifecycle-read-model-v0-1",
      final_status: "pass",
      lifecycle_version: fixture.lifecycle_version,
      status: fixture.status,
      candidate_summaries: fixture.expected_read_model.candidate_summaries.length,
      lifecycle_fingerprint: fixture.expected_read_model.lifecycle_fingerprint,
    },
    null,
    2,
  ),
);

function assertReadModelFixture(model) {
  assert.equal(model.lifecycle_version, lifecycleVersion);
  assert.equal(model.scope, "project:augnes");
  assert.equal(model.status, lifecycleStatus);
  assert.ok(model.lifecycle_fingerprint, "lifecycle_fingerprint must be non-empty");
  assertAuthorityBoundary(model.authority_boundary, "model");

  const families = new Set(
    model.candidate_summaries.map((summary) => summary.candidate_family),
  );
  for (const family of [
    "claim",
    "evidence",
    "tension",
    "knowledge_gap",
    "perspective_delta",
    "follow_up_work",
  ]) {
    assert.ok(families.has(family), `candidate summaries must include ${family}`);
  }

  const statuses = new Set(
    model.candidate_summaries.map((summary) => summary.lifecycle_status),
  );
  for (const status of [
    "operator_dismissed",
    "operator_pinned",
    "operator_corrected",
    "invalidated",
    "needs_review",
    "ready_for_review",
  ]) {
    assert.ok(statuses.has(status), `lifecycle statuses must include ${status}`);
  }
  assert.ok(
    statuses.has("blocked") || statuses.has("new_candidate"),
    "lifecycle statuses must include blocked or new_candidate",
  );

  for (const summary of model.candidate_summaries) {
    assert.ok(
      summary.source_refs.length > 0 || summary.source_coverage_boundary_note,
      `${summary.candidate_id} must have source_refs or source_coverage_boundary_note`,
    );
    assertAuthorityBoundary(summary.authority_boundary, summary.candidate_id);
    assert.ok(
      nextReviewActions.has(summary.next_review_action),
      `${summary.candidate_id} must use controlled next_review_action`,
    );
  }

  const dismissed = model.candidate_summaries.filter(
    (summary) => summary.lifecycle_status === "operator_dismissed",
  );
  for (const summary of dismissed) {
    assert.doesNotMatch(summaryText(summary), /reject(?:ed|ion)?/i);
  }
  const pinned = model.candidate_summaries.filter(
    (summary) => summary.lifecycle_status === "operator_pinned",
  );
  for (const summary of pinned) {
    assert.doesNotMatch(summaryText(summary), /promot(?:ed|ion)/i);
  }
  const invalidated = model.candidate_summaries.filter(
    (summary) => summary.lifecycle_status === "invalidated",
  );
  for (const summary of invalidated) {
    assert.doesNotMatch(summaryText(summary), /proof|evidence record/i);
  }
  const readyForReview = model.candidate_summaries.filter(
    (summary) => summary.lifecycle_status === "ready_for_review",
  );
  for (const summary of readyForReview) {
    assert.doesNotMatch(summaryText(summary), /promoted/i);
  }
}

function assertAuthorityBoundary(boundary, label) {
  assert.equal(boundary.derived_read_model_only, true, `${label} must be derived only`);
  for (const field of forbiddenAuthorityFields) {
    assert.equal(boundary[field], false, `${label}.${field} must be false`);
  }
}

function assertTypeContract() {
  for (const requiredText of [
    "export type ResearchCandidateLifecycleVersion",
    "\"research_candidate_lifecycle.v0.1\"",
    "export type ResearchCandidateLifecycleScope",
    "\"project:augnes\"",
    "export type ResearchCandidateLifecycleStatus",
    "\"derived_read_model_only\"",
    "export type ResearchCandidateFamily",
    "export type ResearchCandidateLifecycleStatusLabel",
    "export type ResearchCandidateNextReviewAction",
    "export interface ResearchCandidateLifecycleAuthorityBoundary",
    "export interface ResearchCandidateLifecycleSummary",
    "export interface ResearchCandidateLifecycleReadModel",
    "export interface ResearchCandidateLifecycleValidationResult",
  ]) {
    assert.ok(typeSource.includes(requiredText), `type file must include ${requiredText}`);
  }
}

function assertHelperBoundary() {
  for (const forbiddenPattern of [
    /\breadFile(?:Sync)?\b/,
    /\bwriteFile(?:Sync)?\b/,
    /\bfetch\s*\(/,
    /\bXMLHttpRequest\b|\bEventSource\b|\bWebSocket\b/,
    /\bnew\s+OpenAI\b|from\s+["'][^"']*openai[^"']*["']/i,
    /\brunRetrieval\b|\brunRag\b|\bembed(?:ding)?\b|\bvectorDb\b/i,
    /\bsqlite\b|\bbetter-sqlite3\b|\bdb\.(?:query|prepare|run)\b/i,
  ]) {
    assert.doesNotMatch(helperSource, forbiddenPattern);
  }
  for (const requiredText of [
    "buildResearchCandidateLifecycleReadModel",
    "validateResearchCandidateLifecycleReadModel",
    "createResearchCandidateLifecycleFingerprint",
    "getResearchCandidateLifecycleAuthorityBoundary",
    "sha256",
    "canonicalJson",
  ]) {
    assert.ok(helperSource.includes(requiredText), `helper must include ${requiredText}`);
  }
}

function assertDocCoverage() {
  for (const requiredText of [
    "Candidate lifecycle is a derived read model only.",
    "It does not create proof/evidence.",
    "It does not promote Perspective.",
    "It does not mutate durable Perspective state.",
    "It does not mutate work.",
    "It does not execute Codex.",
    "It does not call GitHub.",
    "It does not call provider/OpenAI.",
    "It does not fetch sources.",
    "It does not execute retrieval/RAG.",
    "It does not export Git Ledger packets.",
    "It does not write product records.",
    "Product-write remains parked by #686.",
    "Feedback is operator signal, not truth.",
    "Dismissed is not rejected.",
    "Pinned is not promoted.",
    "Invalidated is not proof.",
    "Ready for review is not promotion.",
    "next_review_action is a review cue, not execution authority.",
  ]) {
    assert.ok(doc.includes(requiredText), `doc must include ${requiredText}`);
  }
}

function assertNoForbiddenPositiveAuthorityGrants(source) {
  for (const field of forbiddenAuthorityFields) {
    assert.ok(
      !source.includes(`${field}: true`),
      `doc must not include positive authority grant ${field}: true`,
    );
  }
}

function assertIndexBoundary() {
  for (const forbiddenPattern of [
    /runtime DB write was added/i,
    /route was added/i,
    /UI was added/i,
    /provider runtime was added/i,
    /retrieval runtime was added/i,
    /promotion was added/i,
    /Git Ledger export was added/i,
    /product write was added/i,
    /product ID allocation was added/i,
  ]) {
    assert.doesNotMatch(indexDoc, forbiddenPattern);
  }
}

function summaryText(summary) {
  return [
    summary.current_review_status,
    summary.current_epistemic_status ?? "",
    summary.lifecycle_status,
    summary.next_review_action,
    ...summary.reason_codes,
  ].join(" ");
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}
