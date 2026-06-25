import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const auditDocPath =
  "docs/RESEARCH_TO_PERSPECTIVE_FIXTURE_SMOKE_LEGACY_AUDIT_V0_1.md";
const auditFixturePath =
  "fixtures/research-candidate-review.fixture-smoke-legacy-audit.sample.v0.1.json";
const auditSmokePath =
  "scripts/smoke-research-to-perspective-fixture-smoke-legacy-audit-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const packageScriptName =
  "smoke:research-to-perspective-fixture-smoke-legacy-audit-v0-1";
const packageScriptValue =
  "node scripts/smoke-research-to-perspective-fixture-smoke-legacy-audit-v0-1.mjs";
const fixtureKind = "research_to_perspective_fixture_smoke_legacy_audit";
const fixtureVersion = "research_to_perspective_fixture_smoke_legacy_audit.v0.1";
const sliceName = "research_to_perspective_fixture_smoke_legacy_audit_v0_1";
const nextRecommendedSlice = "parked_lane_registry_and_smoke_catalog_plan_v0_1";

const downstreamSmokePaths = [
  "scripts/smoke-research-to-perspective-foundation-milestone-closeout-v0-1.mjs",
  "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-closeout-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-feedback-loop-closeout-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
];

for (const filePath of [
  auditDocPath,
  auditFixturePath,
  auditSmokePath,
  packagePath,
  indexPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const auditDoc = readFile(auditDocPath);
const auditFixture = readJson(auditFixturePath);
const packageJson = readJson(packagePath);
const indexDoc = readFile(indexPath);

assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
assert.equal(auditFixture.fixture_kind, fixtureKind);
assert.equal(auditFixture.fixture_version, fixtureVersion);
assert.equal(auditFixture.slice_name, sliceName);
assert.equal(auditFixture.next_recommended_slice, nextRecommendedSlice);
assert.equal(auditFixture.audit_policy.classification_only, true);
assert.equal(auditFixture.audit_policy.product_write_now, false);
assert.equal(auditFixture.audit_policy.provider_openai_call_now, false);
assert.equal(auditFixture.audit_policy.retrieval_rag_execution_now, false);
assert.equal(auditFixture.audit_policy.perspective_promotion_now, false);
assert.equal(auditFixture.audit_policy.proof_evidence_write_now, false);

assertDownstreamSmokeRecognition();
assertItems(auditFixture.items);
assertWarningDebt(auditFixture.items);
assertParkedProductWriteEntries(auditFixture.items);
assertCategoryCoverage(auditFixture.items);
assertNoForbiddenClaims(auditFixture.items);
assertDocCoverage(auditDoc);
assertIndexPointer(indexDoc);
assertPublicSafeFixtureText(JSON.stringify(auditFixture));

console.log(
  JSON.stringify(
    {
      smoke: "research-to-perspective-fixture-smoke-legacy-audit-v0-1",
      final_status: "pass",
      fixture_kind: auditFixture.fixture_kind,
      fixture_version: auditFixture.fixture_version,
      audited_items: auditFixture.items.length,
      next_recommended_slice: auditFixture.next_recommended_slice,
      deletion_allowed_now_count: auditFixture.items.filter(
        (item) => item.deletion_allowed_now,
      ).length,
    },
    null,
    2,
  ),
);

function assertDownstreamSmokeRecognition() {
  for (const filePath of downstreamSmokePaths) {
    assert.ok(existsSync(filePath), `${filePath} must exist`);
    const source = readFile(filePath);
    for (const requiredText of [
      "researchToPerspectiveFixtureSmokeLegacyAuditSliceActive",
      "assertResearchToPerspectiveFixtureSmokeLegacyAuditPackageScript",
      "assertResearchToPerspectiveFixtureSmokeLegacyAuditChangedFiles",
      auditDocPath,
      auditFixturePath,
      auditSmokePath,
      packageScriptName,
      packageScriptValue,
    ]) {
      assert.ok(
        source.includes(requiredText),
        `${filePath} must recognize audit slice via ${requiredText}`,
      );
    }
  }
}

function assertItems(items) {
  assert.ok(Array.isArray(items), "fixture items must be an array");
  assert.ok(items.length >= 24, "fixture must include representative audit items");
  const allowedStatuses = new Set([
    "active",
    "parked",
    "closeout",
    "historical",
    "warning_debt",
    "candidate_for_future_refactor",
  ]);
  for (const item of items) {
    assert.equal(typeof item.path, "string", "every item must include path");
    assert.ok(item.path.length > 0, "item path must not be empty");
    assert.equal(
      typeof item.artifact_kind,
      "string",
      `${item.path} must include artifact_kind`,
    );
    assert.ok(
      allowedStatuses.has(item.status),
      `${item.path} must use a known status`,
    );
    assert.equal(
      typeof item.deletion_allowed_now,
      "boolean",
      `${item.path} must include deletion_allowed_now`,
    );
    assert.equal(typeof item.reason, "string", `${item.path} must include reason`);
    assert.ok(item.reason.length > 0, `${item.path} reason must not be empty`);
    assert.equal(
      typeof item.boundary_notes,
      "string",
      `${item.path} must include boundary_notes`,
    );
    assert.ok(
      item.boundary_notes.length > 0,
      `${item.path} boundary_notes must not be empty`,
    );
    assert.ok(Array.isArray(item.source_refs), `${item.path} must include source_refs`);
    assert.ok(item.source_refs.length > 0, `${item.path} source_refs must not be empty`);
    if (
      item.path.startsWith("fixtures/") ||
      item.path.startsWith("scripts/") ||
      item.path.startsWith("docs/")
    ) {
      assert.ok(
        existsSync(item.path),
        `${item.path} referenced by audit fixture must exist`,
      );
    }
  }
}

function assertWarningDebt(items) {
  const warningText = items
    .filter((item) => item.category === "warning_debt")
    .map((item) =>
      [item.path, item.reason, item.boundary_notes, ...item.source_refs].join("\n"),
    )
    .join("\n");
  assert.match(warningText, /MODULE_TYPELESS_PACKAGE_JSON/);
  assert.match(warningText, /ExperimentalWarning: stripTypeScriptTypes/);
}

function assertParkedProductWriteEntries(items) {
  const protectedCategories = new Set([
    "active_foundation_smoke",
    "closeout_smoke",
    "parked_product_write_smoke",
    "disabled_adapter_smoke",
    "temp_db_harness_smoke",
  ]);
  for (const item of items) {
    const text = itemText(item);
    if (
      protectedCategories.has(item.category) ||
      /product-write|disabled-adapter|temp-db|closeout|foundation/i.test(item.path)
    ) {
      assert.equal(
        item.deletion_allowed_now,
        false,
        `${item.path} must not be deletion-allowed in this audit`,
      );
    }
    if (/product-write/i.test(item.path) || item.category === "parked_product_write_smoke") {
      assert.match(
        text,
        /#686|product-write parked|parked product-write/i,
        `${item.path} must cite #686 or product-write parked status`,
      );
    }
  }
}

function assertCategoryCoverage(items) {
  const categories = new Set(items.map((item) => item.category));
  for (const category of auditFixture.artifact_categories) {
    assert.ok(categories.has(category), `fixture must include ${category}`);
  }
  for (const requiredPath of [
    "scripts/smoke-research-to-perspective-foundation-milestone-closeout-v0-1.mjs",
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-closeout-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-feedback-loop-closeout-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    "scripts/smoke-ai-context-packet-contract-v0-1.mjs",
    "scripts/smoke-perspective-geometry-digest-contract-v0-1.mjs",
    "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  ]) {
    assert.ok(
      items.some((item) => item.path === requiredPath),
      `fixture must include representative item ${requiredPath}`,
    );
  }
}

function assertNoForbiddenClaims(items) {
  for (const item of items) {
    const text = itemText(item);
    assert.doesNotMatch(
      text,
      /runtime persistence (?:was )?implemented|implemented runtime persistence/i,
      `${item.path} must not claim runtime persistence`,
    );
    assert.doesNotMatch(
      text,
      /provider(?:\/OpenAI| OpenAI)? (?:was )?implemented|OpenAI call (?:was )?implemented|implemented provider/i,
      `${item.path} must not claim provider/OpenAI implementation`,
    );
    assert.doesNotMatch(
      text,
      /retrieval\/RAG (?:was )?implemented|implemented retrieval\/RAG/i,
      `${item.path} must not claim retrieval/RAG execution`,
    );
    assert.doesNotMatch(
      text,
      /Perspective promotion (?:was )?implemented|implemented Perspective promotion/i,
      `${item.path} must not claim Perspective promotion`,
    );
    assert.doesNotMatch(
      text,
      /product[- ]write (?:was )?implemented|implemented product[- ]write/i,
      `${item.path} must not claim product-write`,
    );
    assert.doesNotMatch(
      text,
      /smoke pass (?:is|as|creates|created) proof|smoke pass (?:is|as|creates|created) evidence/i,
      `${item.path} must not treat smoke pass as proof/evidence`,
    );
    assert.doesNotMatch(
      text,
      /closeout fixture (?:is|as|proves|proved) runtime completion proof/i,
      `${item.path} must not treat closeout fixture as runtime completion proof`,
    );
  }
}

function assertDocCoverage(doc) {
  for (const requiredText of [
    "# Research-to-Perspective Fixture Smoke Legacy Audit v0.1",
    "## Scope And Non-Goals",
    "## Why This Exists After #759",
    "## Active Foundation Rails",
    "## Parked Product-Write Preflight Rails",
    "## Historical And Closeout Rails",
    "## Fixture Categories",
    "## Smoke Categories",
    "## Package Script Categories",
    "## Warning Debt",
    "## Cleanup Candidates",
    "## Explicitly Deferred Cleanup",
    "## Safe Future Refactor Plan",
    "## Authority Boundaries",
    "Explicit Non-Deletion Policy",
    "Next recommended slice: `parked_lane_registry_and_smoke_catalog_plan_v0_1`",
    "No fixture or smoke script is deleted by this slice.",
    "Do not implement runtime persistence.",
    "Do not add provider/OpenAI calls.",
    "Do not execute retrieval/RAG.",
    "Do not query or write production DB.",
    "Do not promote Perspective state.",
    "Do not create proof/evidence records.",
    "Do not mutate work.",
    "Do not implement product write.",
    "Do not unpark product-write.",
    "Do not enable disabled adapters.",
    "Do not add GitHub Actions.",
    "Do not change CI runtime.",
  ]) {
    assert.ok(doc.includes(requiredText), `audit doc must include ${requiredText}`);
  }
}

function assertIndexPointer(doc) {
  for (const requiredText of [
    "Research-to-Perspective Fixture Smoke Legacy Audit v0.1",
    auditDocPath,
    auditFixturePath,
    auditSmokePath,
    packageScriptName,
    "Product-write remains parked by #686",
    "no runtime persistence, provider/OpenAI calls, retrieval/RAG, Perspective promotion, proof/evidence writes, product write, product DB writes, GitHub Actions, or CI runtime changes",
  ]) {
    assert.ok(doc.includes(requiredText), `index must include ${requiredText}`);
  }
}

function assertPublicSafeFixtureText(text) {
  assert.doesNotMatch(text, /sk-[A-Za-z0-9_-]{10,}/);
  assert.doesNotMatch(text, /BEGIN OPENSSH PRIVATE KEY/);
  assert.doesNotMatch(text, /"access_token"\s*:/i);
  assert.doesNotMatch(
    text,
    /https?:\/\/(?:localhost|127\.0\.0\.1|internal|private)/i,
  );
}

function itemText(item) {
  return JSON.stringify(item);
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}
