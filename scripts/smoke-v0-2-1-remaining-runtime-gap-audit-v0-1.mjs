import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const docsPath = "docs/V0_2_1_REMAINING_RUNTIME_GAP_AUDIT_V0_1.md";
const fixturePath = "fixtures/v0-2-1-remaining-runtime-gap-audit.sample.v0.1.json";
const smokePath = "scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-1.mjs";
const roadmapPath = "docs/AUGNES_INTEGRATED_DEVELOPMENT_ROADMAP_V0_2_1_FULL.md";
const groundingDocsPath = "docs/RELEASE_READINESS_RUNTIME_GROUNDING_UPDATE_V0_1.md";
const groundingFixturePath =
  "fixtures/release-readiness-runtime-grounding-update.sample.v0.1.json";
const groundingSmokePath = "scripts/smoke-release-readiness-runtime-grounding-update-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";

const fixtureVersion = "v0_2_1_remaining_runtime_gap_audit.sample.v0.1";
const auditVersion = "v0_2_1_remaining_runtime_gap_audit_v0_1";
const scope = "project:augnes";
const packageScriptName = "smoke:v0-2-1-remaining-runtime-gap-audit-v0-1";
const packageScriptValue = "node scripts/smoke-v0-2-1-remaining-runtime-gap-audit-v0-1.mjs";
const groundingPackageScriptName = "smoke:release-readiness-runtime-grounding-update-v0-1";
const groundingPackageScriptValue =
  "node scripts/smoke-release-readiness-runtime-grounding-update-v0-1.mjs";

const expectedChangedFiles = new Set([
  docsPath,
  fixturePath,
  smokePath,
  packagePath,
  indexPath,
]);

const allowedTrueFields = [
  "remaining_runtime_gap_audit_now",
  "static_repo_grounded_audit_only",
  "next_slice_recommendation_now",
  "public_safe_inventory_only",
];

const forbiddenFalseFields = [
  "roadmap_completion_declared_now",
  "release_approval_now",
  "release_execution_now",
  "product_write_now",
  "product_write_runtime_now",
  "product_write_adapter_enabled_now",
  "product_id_allocation_now",
  "product_persistence_now",
  "github_actuation_implementation_now",
  "github_api_call_now",
  "git_write_now",
  "db_query_or_write_now",
  "route_now",
  "ui_now",
  "provider_openai_call_now",
  "prompt_sent_now",
  "source_fetch_now",
  "retrieval_execution_now",
  "rag_answer_generation_now",
  "proof_or_evidence_record_now",
  "claim_or_evidence_write_now",
  "work_item_write_now",
  "promotion_execution_now",
  "durable_state_write_now",
  "durable_state_apply_now",
  "formation_receipt_write_now",
  "codex_execution_now",
  "codex_execution_authority",
  "github_automation_authority",
  "product_write_authority",
  "audit_is_completion_claim",
  "smoke_pass_is_truth",
  "ci_pass_is_truth",
];

const validStatusCategories = new Set([
  "runtime_complete",
  "runtime_complete_with_selected_audit",
  "runtime_complete_without_audit",
  "partial_runtime_gap",
  "ungated_implementation_gap",
  "gated_requires_explicit_approval",
  "contract_only",
  "fixture_only",
  "read_only_preview_only",
  "superseded_by_runtime_completion",
  "not_applicable",
]);

const docsRequiredPhrases = [
  "This is not a roadmap completion closeout.",
  "This is not release approval.",
  "This is not release execution.",
  "This does not approve product-write.",
  "This does not approve GitHub actuation implementation.",
  "This does not implement runtime behavior.",
  "This does not query/write DB.",
  "This does not add routes/UI.",
  "This does not call providers.",
  "This does not execute retrieval/RAG.",
  "This does not create proof/evidence.",
  "This does not promote Perspective.",
  "This does not write/apply durable state.",
  "This does not write Formation Receipts.",
  "This does not execute Git/GitHub.",
  "This does not execute Codex.",
  "This does not product-write.",
  "This does not allocate product IDs.",
  "Product-write remains parked by #686.",
  "Smoke/CI pass is not truth.",
  "The roadmap guide is not SSOT.",
];

const forbiddenPositiveClaims = [
  ["This slice declares", " roadmap completion."].join(""),
  ["This audit declares", " roadmap completion."].join(""),
  ["Full roadmap is", " complete."].join(""),
  ["No remaining", " implementation work."].join(""),
  ["Release is", " approved."].join(""),
  ["Release execution is", " approved."].join(""),
  ["Product-write is", " approved."].join(""),
  ["GitHub actuation implementation is", " approved."].join(""),
  ["Smoke pass is", " truth."].join(""),
  ["CI pass is", " truth."].join(""),
];

for (const filePath of [
  docsPath,
  fixturePath,
  smokePath,
  roadmapPath,
  groundingDocsPath,
  groundingFixturePath,
  groundingSmokePath,
  packagePath,
  indexPath,
]) {
  assert(existsSync(filePath), `${filePath} must exist`);
}

const docsText = readText(docsPath);
const fixtureText = readText(fixturePath);
const fixture = JSON.parse(fixtureText);
const roadmapText = readText(roadmapPath);
const groundingDocsText = readText(groundingDocsPath);
const groundingFixtureText = readText(groundingFixturePath);
const packageJson = JSON.parse(readText(packagePath));
const indexText = readText(indexPath);

assertIncludes(roadmapText, "v0.2.1 FULL", "roadmap mentions v0.2.1 FULL");
assertIncludes(
  groundingDocsText,
  "release_readiness_runtime_grounding_update_v0_1",
  "grounding docs contain prerequisite marker",
);
assertIncludes(
  groundingFixtureText,
  "release_readiness_runtime_grounding_update.sample.v0.1",
  "grounding fixture exists and has expected version marker",
);

assert.equal(packageJson.scripts?.[packageScriptName], packageScriptValue);
assert.equal(
  packageJson.scripts?.[groundingPackageScriptName],
  groundingPackageScriptValue,
  "release readiness grounding package script",
);
assertIncludes(indexText, docsPath, "latest index docs pointer");
assertIncludes(indexText, fixturePath, "latest index fixture pointer");
assertIncludes(indexText, smokePath, "latest index smoke pointer");
assertIncludes(indexText, auditVersion, "latest index slice marker");

for (const phrase of docsRequiredPhrases) {
  assertIncludes(docsText, phrase, `docs phrase ${phrase}`);
}

for (const phrase of forbiddenPositiveClaims) {
  assertNotIncludes(docsText, phrase, `docs forbidden claim ${phrase}`);
  assertNotIncludes(fixtureText, phrase, `fixture forbidden claim ${phrase}`);
}

assert.equal(fixture.fixture_version, fixtureVersion);
assert.equal(fixture.audit_version, auditVersion);
assert.equal(fixture.scope, scope);
assert.equal(fixture.roadmap_ref, roadmapPath);
assert.equal(fixture.release_readiness_grounding_ref, groundingDocsPath);
assert.equal(fixture.remaining_work_exists, true);
assert.equal(fixture.no_remaining_work_claim, false);

for (const key of [
  "phase_inventory",
  "runtime_surface_inventory",
  "remaining_gap_inventory",
  "gated_work_inventory",
]) {
  assert(Array.isArray(fixture[key]), `${key} must be an array`);
  assert(fixture[key].length > 0, `${key} must not be empty`);
}

assert(fixture.next_recommended_implementation_slice, "next recommended slice exists");
assert.equal(
  fixture.next_recommended_implementation_slice.item_ref,
  "runtime_audit_selected_route_instrumentation_v0_4_phase_4_promotion_state_v0_1",
);
assert.equal(
  fixture.next_recommended_implementation_slice.status_category,
  "ungated_implementation_gap",
);
assert.equal(fixture.next_recommended_implementation_slice.gate_required, false);

for (const entry of allInventoryEntries(fixture)) {
  assertInventoryEntry(entry);
}

const ungatedGaps = fixture.remaining_gap_inventory.filter(
  (entry) => entry.status_category === "ungated_implementation_gap",
);
assert(ungatedGaps.length > 0, "at least one ungated implementation gap must be named");
if (ungatedGaps.length > 0) {
  assert.equal(fixture.no_remaining_work_claim, false);
  assert.notEqual(fixture.next_recommended_implementation_slice.item_ref, "");
}

const productWriteRuntime = fixture.gated_work_inventory.find(
  (entry) => entry.item_ref === "product_write_minimal_runtime_v0_1",
);
assert(productWriteRuntime, "product_write_minimal_runtime_v0_1 gated entry exists");
assert.equal(productWriteRuntime.status_category, "gated_requires_explicit_approval");
assert.equal(productWriteRuntime.gate_required, true);

const githubActuation = fixture.gated_work_inventory.find(
  (entry) => entry.item_ref === "github_actuation_implementation",
);
assert(githubActuation, "github actuation implementation gated entry exists");
assert.equal(githubActuation.status_category, "gated_requires_explicit_approval");
assert.equal(githubActuation.gate_required, true);

assertIncludes(docsText, "Product-write remains parked by #686.", "docs product-write parked");
assertIncludes(fixtureText, "Product-write remains parked by #686.", "fixture product-write parked");

assertAuthorityBoundary(fixture.authority_boundary);
assertNoLiveLookingPayloads(docsText, docsPath);
assertNoLiveLookingPayloads(fixtureText, fixturePath);
assertChangedFileScope();

console.log(
  JSON.stringify(
    {
      smoke: "v0-2-1-remaining-runtime-gap-audit-v0-1",
      final_status: "pass",
      audit_version: auditVersion,
      next_recommended_implementation_slice:
        fixture.next_recommended_implementation_slice.item_ref,
      ungated_implementation_gaps: ungatedGaps.map((entry) => entry.item_ref),
      gated_work_items: fixture.gated_work_inventory.length,
    },
    null,
    2,
  ),
);

function readText(filePath) {
  return readFileSync(filePath, "utf8");
}

function assertIncludes(text, needle, label) {
  assert.ok(text.includes(needle), `${label} missing ${needle}`);
}

function assertNotIncludes(text, needle, label) {
  assert.ok(!text.includes(needle), `${label} unexpectedly includes ${needle}`);
}

function allInventoryEntries(value) {
  return [
    ...value.phase_inventory,
    ...value.runtime_surface_inventory,
    ...value.remaining_gap_inventory,
    ...value.gated_work_inventory,
    value.next_recommended_implementation_slice,
  ];
}

function assertInventoryEntry(entry) {
  for (const field of [
    "item_ref",
    "roadmap_phase",
    "expected_acceptance_summary",
    "observed_repo_refs",
    "status_category",
    "evidence_refs",
    "remaining_gap",
    "gate_required",
    "next_action",
  ]) {
    assert(Object.hasOwn(entry, field), `${entry.item_ref ?? "entry"} missing ${field}`);
  }
  assert.equal(typeof entry.item_ref, "string");
  assert(entry.item_ref.length > 0, "item_ref must not be empty");
  assert(validStatusCategories.has(entry.status_category), `invalid status ${entry.status_category}`);
  assert(Array.isArray(entry.observed_repo_refs), `${entry.item_ref} observed_repo_refs array`);
  assert(entry.observed_repo_refs.length > 0, `${entry.item_ref} observed_repo_refs non-empty`);
  assert(Array.isArray(entry.evidence_refs), `${entry.item_ref} evidence_refs array`);
  assert(entry.evidence_refs.length > 0, `${entry.item_ref} evidence_refs non-empty`);
  assert.equal(typeof entry.remaining_gap, "string");
  assert.equal(typeof entry.gate_required, "boolean");
  assert.equal(typeof entry.next_action, "string");

  for (const ref of [...entry.observed_repo_refs, ...entry.evidence_refs]) {
    assert.equal(typeof ref, "string", `${entry.item_ref} ref must be string`);
    assert(existsSync(ref), `${entry.item_ref} ref must exist: ${ref}`);
  }
}

function assertAuthorityBoundary(boundary) {
  assert(boundary && typeof boundary === "object", "authority boundary object");
  for (const field of allowedTrueFields) {
    assert.equal(boundary[field], true, `authority ${field} must be true`);
  }
  for (const field of forbiddenFalseFields) {
    assert.equal(boundary[field], false, `authority ${field} must be false`);
  }
}

function assertNoLiveLookingPayloads(text, label) {
  const forbiddenPatterns = [
    { pattern: /\/Users\//, label: "mac user path" },
    { pattern: /\/home\//, label: "home path" },
    { pattern: /file:\/\//, label: "file URL" },
    { pattern: /\bsk-[A-Za-z0-9_-]{8,}\b/, label: "OpenAI-like token" },
    { pattern: /\bghp_[A-Za-z0-9_]{8,}\b/, label: "GitHub token" },
    { pattern: /\bgithub_pat_[A-Za-z0-9_]{8,}\b/, label: "GitHub fine-grained token" },
    { pattern: /\bOPENAI_API_KEY\b/, label: "OpenAI env var" },
    { pattern: /\bGITHUB_TOKEN\b/, label: "GitHub env var" },
    { pattern: /\bprovider[-_ ]?(?:thread|run|session)[-_ ]?id[:=][A-Za-z0-9_-]+/i, label: "provider id" },
    { pattern: /\bhttps?:\/\/(?:localhost|127\.0\.0\.1|10\.|172\.(?:1[6-9]|2\d|3[0-1])\.|192\.168\.)/i, label: "private URL" },
  ];
  for (const { pattern, label: markerLabel } of forbiddenPatterns) {
    assert.doesNotMatch(text, pattern, `${label} must not contain ${markerLabel}`);
  }
}

function assertChangedFileScope() {
  const changed = new Set();
  for (const command of [
    ["git", ["diff", "--name-only"]],
    ["git", ["ls-files", "--others", "--exclude-standard"]],
  ]) {
    for (const filePath of runLines(command[0], command[1])) {
      if (isTempSmokeArtifact(filePath)) continue;
      if (filePath) changed.add(filePath);
    }
  }

  const rangeCandidates = [
    ["git", ["diff", "--name-only", "main...HEAD"]],
    ["git", ["diff", "--name-only", "origin/main...HEAD"]],
  ];
  for (const [bin, args] of rangeCandidates) {
    const lines = runLines(bin, args, { allowFailure: true });
    for (const filePath of lines) {
      if (isTempSmokeArtifact(filePath)) continue;
      if (filePath) changed.add(filePath);
    }
    if (lines.length > 0) break;
  }

  const unexpected = [...changed].filter((filePath) => !expectedChangedFiles.has(filePath)).sort();
  assert.deepEqual(unexpected, [], "slice must change only expected audit files");

  const added = [
    ...runLines("git", ["diff", "--name-status", "main...HEAD"], { allowFailure: true }),
    ...runLines("git", ["status", "--porcelain"]),
  ];
  const forbiddenAdded = [];
  for (const line of added) {
    const parsed = parseChangedLine(line);
    if (!parsed) continue;
    const { status, filePath } = parsed;
    if (isTempSmokeArtifact(filePath)) continue;
    const isAdded = status.includes("A") || status === "??";
    if (!isAdded) continue;
    if (!expectedChangedFiles.has(filePath)) forbiddenAdded.push(filePath);
    if (/^(app\/api|components|lib|db|migrations|types|\.github)\//.test(filePath)) {
      forbiddenAdded.push(filePath);
    }
    if (/(provider|retrieval|github|git-runtime|codex-execution|product-write|product-id|db-schema|route|ui)/i.test(filePath)) {
      if (!expectedChangedFiles.has(filePath)) forbiddenAdded.push(filePath);
    }
  }
  assert.deepEqual([...new Set(forbiddenAdded)].sort(), [], "no runtime capability files added");
}

function isTempSmokeArtifact(filePath) {
  return filePath.startsWith(".tmp/") || filePath.startsWith("tmp/");
}

function parseChangedLine(line) {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("?? ")) {
    return { status: "??", filePath: unquotePath(trimmed.slice(3)) };
  }
  if (/^[A-Z]\t/.test(trimmed)) {
    const [status, ...pathParts] = trimmed.split("\t");
    return { status, filePath: unquotePath(pathParts.join("\t")) };
  }
  if (trimmed.length > 3) {
    return { status: trimmed.slice(0, 2), filePath: unquotePath(trimmed.slice(3)) };
  }
  return null;
}

function unquotePath(filePath) {
  return filePath.replace(/^"|"$/g, "");
}

function runLines(bin, args, options = {}) {
  try {
    const output = execFileSync(bin, args, { cwd: process.cwd(), encoding: "utf8" });
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch (error) {
    if (options.allowFailure) return [];
    throw error;
  }
}
