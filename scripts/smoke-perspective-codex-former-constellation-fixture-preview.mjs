import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const fixturePreviewDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_FIXTURE_PREVIEW_V0_1.md";
const fixturePreviewReportFile =
  "reports/2026-06-10-perspective-codex-former-constellation-fixture-preview.md";
const passFixtureFile =
  "reports/fixtures/2026-06-10-codex-former-constellation-pass-with-follow-up.json";
const blockedFixtureFile =
  "reports/fixtures/2026-06-10-codex-former-constellation-blocked.json";
const fixturePreviewDogfoodFile =
  "scripts/dogfood-perspective-codex-former-constellation-fixture-preview.mjs";
const fixturePreviewSmokeFile =
  "scripts/smoke-perspective-codex-former-constellation-fixture-preview.mjs";
const manualWorkflowDocsSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-workflow-docs.mjs";
const manualCopyPacketSmokeFile =
  "scripts/smoke-perspective-codex-former-manual-copy-packet.mjs";
const separateSessionPrepSmokeFile =
  "scripts/smoke-perspective-codex-former-separate-session-capture-packet-prep.mjs";
const separateSessionCaptureSmokeFile =
  "scripts/smoke-perspective-codex-former-separate-session-provenance-clean-capture.mjs";
const captureHelperSmokeFile =
  "scripts/smoke-perspective-codex-former-capture-helper.mjs";
const workflowCloseoutSmokeFile =
  "scripts/smoke-perspective-codex-former-workflow-closeout.mjs";
const productSurfaceDesignSmokeFile =
  "scripts/smoke-perspective-codex-former-product-surface-design.mjs";
const constellationProjectionSmokeFile =
  "scripts/smoke-perspective-codex-former-constellation-projection.mjs";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  fixturePreviewDocFile,
  fixturePreviewReportFile,
  passFixtureFile,
  blockedFixtureFile,
  fixturePreviewDogfoodFile,
  fixturePreviewSmokeFile,
  manualWorkflowDocsSmokeFile,
  manualCopyPacketSmokeFile,
  separateSessionPrepSmokeFile,
  separateSessionCaptureSmokeFile,
  captureHelperSmokeFile,
  workflowCloseoutSmokeFile,
  productSurfaceDesignSmokeFile,
  constellationProjectionSmokeFile,
]);

const allowedNodeKinds = new Set([
  "work",
  "source_input",
  "manual_copy_packet",
  "codex_session",
  "candidate_draft",
  "validation_summary",
  "review_candidate",
  "warning",
  "worker_guidance",
  "next_action",
]);
const allowedNodeStatuses = new Set([
  "raw",
  "prepared",
  "returned",
  "validated",
  "needs_review",
  "blocked",
  "review_only",
  "accepted_future_only",
]);
const allowedNodeAuthorities = new Set([
  "review_only",
  "non_committed",
  "advisory_only",
  "pointer_only",
  "blocked",
  "accepted_future_only",
]);
const allowedEdgeRelations = new Set([
  "prepared",
  "pasted_by_human",
  "returned",
  "validated",
  "informs",
  "suggests",
  "pointer_only",
  "blocked_by",
]);
const allowedEdgeStatuses = new Set([
  "raw",
  "prepared",
  "returned",
  "validated",
  "needs_review",
  "blocked",
  "review_only",
]);
const allowedAuthorityBoundaries = new Set([
  "review_only",
  "non_committing",
  "advisory_only",
  "pointer_only",
  "blocked",
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const dogfoodText = readFileSync(fixturePreviewDogfoodFile, "utf8");
const smokeText = readFileSync(fixturePreviewSmokeFile, "utf8");

const { buildCodexFormerConstellationProjection } = await import(
  "../lib/perspective-ingest/perspective-codex-former-constellation-projection.ts"
);
const dogfood = await import(
  "./dogfood-perspective-codex-former-constellation-fixture-preview.mjs"
);

assertPackageScripts();
assert.equal(
  typeof buildCodexFormerConstellationProjection,
  "function",
  "must import buildCodexFormerConstellationProjection from the PR #499 module",
);
assert.equal(
  typeof dogfood.runPerspectiveCodexFormerConstellationFixturePreview,
  "function",
  "fixture preview dogfood script must export its runner",
);

const preview = dogfood.runPerspectiveCodexFormerConstellationFixturePreview();
const docText = readFileSync(fixturePreviewDocFile, "utf8");
const reportText = readFileSync(fixturePreviewReportFile, "utf8");
const passFixtureText = readFileSync(passFixtureFile, "utf8");
const blockedFixtureText = readFileSync(blockedFixtureFile, "utf8");
const passFixture = JSON.parse(passFixtureText);
const blockedFixture = JSON.parse(blockedFixtureText);

assertArtifactsExist();
assertDocAndReport();
assertProjectionBuilderCompatibility(preview, passFixture, blockedFixture);
assertPassWithFollowUpFixture(passFixture);
assertBlockedFixture(blockedFixture);
assertReadability(passFixture, {
  edgeRange: [7, 12],
  nodeRange: [8, 12],
  label: "PASS with follow-up",
});
assertReadability(blockedFixture, {
  edgeRange: [5, 10],
  nodeRange: [6, 10],
  label: "BLOCKED",
});
assertPrivacyAndSanitization([passFixture, blockedFixture]);
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-constellation-fixture-preview");

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts[
      "dogfood:perspective-codex-former-constellation-fixture-preview"
    ],
    `${expectedTsxCommand} ${fixturePreviewDogfoodFile}`,
    "package.json must register the constellation fixture preview dogfood script",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-constellation-fixture-preview"
    ],
    `${expectedTsxCommand} ${fixturePreviewSmokeFile}`,
    "package.json must register the constellation fixture preview smoke",
  );
}

function assertArtifactsExist() {
  for (const file of [
    fixturePreviewDocFile,
    fixturePreviewReportFile,
    passFixtureFile,
    blockedFixtureFile,
    fixturePreviewDogfoodFile,
    fixturePreviewSmokeFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertDocAndReport() {
  assertContainsAll(docText, [
    "Perspective Codex Former Constellation Fixture Preview v0.1",
    "Purpose",
    "Why Follows PR #499",
    "Current Projection Contract Dependency",
    "Generated Fixture Artifacts",
    "PASS with follow-up Fixture Explanation",
    "BLOCKED Fixture Explanation",
    "Node/Edge Readability Goals",
    "Authority Boundary",
    "Privacy Boundary",
    "Display-Density Implications For Future UI",
    "What This Does Not Do",
    "Add read-only Codex Former constellation preview data adapter",
    "Conclusion: PASS with follow-up",
  ]);
  assertContainsAll(reportText, [
    "Summary",
    "Why Follows PR #499",
    "Fixture Preview Scope",
    "PASS with follow-up Fixture Summary",
    "BLOCKED Fixture Summary",
    "Node/Edge Readability Notes",
    "Authority Boundary",
    "Privacy/Redaction Handling",
    "Verification",
    "Skipped Checks With Reasons",
    "Recommended Next PR",
    "What Codex Did Not Do",
    "no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added",
    "fixture preview is read-only",
    "not accepted-state automation",
    "review-only preview data",
  ]);
}

function assertProjectionBuilderCompatibility(preview, passProjection, blockedProjection) {
  assert.deepEqual(
    passProjection,
    preview.pass_with_follow_up_fixture,
    "PASS fixture JSON must match dogfood builder output",
  );
  assert.deepEqual(
    blockedProjection,
    preview.blocked_fixture,
    "BLOCKED fixture JSON must match dogfood builder output",
  );
  assert.deepEqual(
    passProjection,
    buildCodexFormerConstellationProjection(dogfood.passWithFollowUpFixtureInput),
    "PASS fixture must use the projection builder output directly",
  );
  assert.deepEqual(
    blockedProjection,
    buildCodexFormerConstellationProjection(dogfood.blockedFixtureInput),
    "BLOCKED fixture must use the projection builder output directly",
  );
  for (const [file, text] of [
    [passFixtureFile, passFixtureText],
    [blockedFixtureFile, blockedFixtureText],
  ]) {
    assert.equal(
      `${JSON.stringify(JSON.parse(text), null, 2)}\n`,
      text,
      `${file} must be stable pretty-printed JSON`,
    );
  }
  for (const projection of [passProjection, blockedProjection]) {
    assert.equal(
      projection.projection_version,
      "codex_former_constellation_projection.v0.1",
    );
    assert.equal(
      projection.projection_kind,
      "codex_former_constellation_projection",
    );
  }
}

function assertPassWithFollowUpFixture(projection) {
  assert.equal(projection.status_summary.overall_status, "pass_with_follow_up");
  assert.equal(projection.authority_summary.review_only, true);
  assert.equal(projection.authority_summary.non_committed_candidate, true);
  assert.equal(projection.warning_summary.warning_count > 0, true);
  assert.notEqual(projection.status_summary.overall_status, "blocked");
  assertNodeKinds(projection, [
    "source_input",
    "manual_copy_packet",
    "codex_session",
    "candidate_draft",
    "validation_summary",
    "review_candidate",
    "warning",
    "worker_guidance",
    "next_action",
  ]);
  assertEdgeRelations(projection, [
    "prepared",
    "pasted_by_human",
    "returned",
    "validated",
    "informs",
    "pointer_only",
    "suggests",
  ]);
  assertNoAcceptedFutureOnly(projection);
  assertFalseAuthorityBehavior(projection);
}

function assertBlockedFixture(projection) {
  assert.equal(projection.status_summary.overall_status, "blocked");
  assert.equal(projection.authority_summary.review_only, true);
  assert.equal(projection.authority_summary.non_committed_candidate, false);
  assertNodeKinds(projection, ["validation_summary", "warning"]);
  assertEdgeRelations(projection, ["blocked_by"]);
  assert.equal(
    projection.nodes.some((node) => node.node_kind === "review_candidate"),
    false,
    "BLOCKED fixture must not emit review_candidate",
  );
  assert.equal(
    projection.nodes.some((node) => node.node_kind === "worker_guidance"),
    false,
    "BLOCKED fixture must not emit worker_guidance",
  );
  assert.equal(
    projection.nodes.some((node) => node.node_kind === "next_action"),
    false,
    "BLOCKED fixture must not emit next_action",
  );
  assert.equal(
    projection.nodes.some(
      (node) => node.node_kind === "warning" && node.status === "blocked",
    ),
    true,
    "BLOCKED fixture must include a blocking warning node",
  );
  assertNoAcceptedFutureOnly(projection);
  assertFalseAuthorityBehavior(projection);
}

function assertReadability(projection, { edgeRange, nodeRange, label }) {
  assert(
    projection.nodes.length >= nodeRange[0] &&
      projection.nodes.length <= nodeRange[1],
    `${label} node count must stay bounded`,
  );
  assert(
    projection.edges.length >= edgeRange[0] &&
      projection.edges.length <= edgeRange[1],
    `${label} edge count must stay bounded`,
  );
  const nodeIds = new Set(projection.nodes.map((node) => node.id));
  assert.equal(nodeIds.size, projection.nodes.length, `${label} node ids must be unique`);

  for (const node of projection.nodes) {
    assert.equal(typeof node.title, "string", `${node.id} must have title`);
    assert.notEqual(node.title.trim(), "", `${node.id} title must be non-empty`);
    assert(allowedNodeKinds.has(node.node_kind), `${node.id} has unknown node kind`);
    assert(allowedNodeStatuses.has(node.status), `${node.id} has unknown status`);
    assert(
      allowedNodeAuthorities.has(node.authority),
      `${node.id} has unknown authority`,
    );
    assert(
      Array.isArray(node.primary_badges) && node.primary_badges.length <= 2,
      `${node.id} must have at most two primary_badges`,
    );
  }

  for (const edge of projection.edges) {
    assert(nodeIds.has(edge.from), `${edge.id} has missing from node ${edge.from}`);
    assert(nodeIds.has(edge.to), `${edge.id} has missing to node ${edge.to}`);
    assert(
      allowedEdgeRelations.has(edge.relation),
      `${edge.id} has unknown relation ${edge.relation}`,
    );
    assert(
      allowedEdgeStatuses.has(edge.status),
      `${edge.id} has unknown status ${edge.status}`,
    );
    assert(
      allowedAuthorityBoundaries.has(edge.authority_boundary),
      `${edge.id} has unknown authority boundary`,
    );
  }
}

function assertPrivacyAndSanitization(projections) {
  for (const projection of projections) {
    assert.equal(projection.privacy.raw_payloads_included, false);
    assert.equal(projection.privacy.bounded_summaries_only, true);
    assertNoRawUnsafeMarkersInText(JSON.stringify(projection));
    assertBoundedStrings(projection.warning_summary.warnings, "warnings");
    assertBoundedStrings(
      projection.warning_summary.blocked_reasons,
      "blocked reasons",
    );
    assertBoundedStrings(
      projection.nodes.flatMap((node) => [
        node.title,
        ...node.primary_badges,
        ...node.provenance_refs,
        ...node.detail_refs,
      ]),
      "node strings",
    );
  }
}

function assertFalseAuthorityBehavior(projection) {
  assert.equal(projection.authority_summary.accepted_state_created, false);
  assert.equal(
    projection.authority_summary.proof_evidence_readiness_created,
    false,
  );
  assert.equal(projection.authority_summary.provider_model_calls, false);
  assert.equal(projection.authority_summary.codex_sdk_calls, false);
  assert.equal(projection.authority_summary.github_mutation, false);
  assert.equal(projection.authority_summary.db_writes, false);
  assert.equal(projection.authority_summary.ui_implemented, false);
  assert.equal(projection.authority_summary.core_decision, false);

  for (const [key, value] of Object.entries(projection.authority_flags)) {
    assert.equal(value, false, `${key} must remain false`);
  }
}

function assertNodeKinds(projection, expectedKinds) {
  for (const kind of expectedKinds) {
    assert(
      projection.nodes.some((node) => node.node_kind === kind),
      `expected ${kind} node`,
    );
  }
}

function assertEdgeRelations(projection, expectedRelations) {
  for (const relation of expectedRelations) {
    assert(
      projection.edges.some((edge) => edge.relation === relation),
      `expected ${relation} edge`,
    );
  }
}

function assertNoAcceptedFutureOnly(projection) {
  assert.equal(
    JSON.stringify(projection).includes("accepted_future_only"),
    false,
    "current workflow fixtures must not emit accepted_future_only",
  );
}

function assertBoundedStrings(strings, label) {
  for (const value of strings) {
    assert.equal(typeof value, "string", `${label} value must be a string`);
    assert(
      value.length > 0 && value.length <= 180,
      `${label} value must stay bounded: ${value}`,
    );
  }
}

function assertNoRawUnsafeMarkersInPublicArtifacts() {
  const publicText = [
    docText,
    reportText,
    passFixtureText,
    blockedFixtureText,
  ].join("\n");
  assertNoRawUnsafeMarkersInText(publicText);
  for (const phrase of [
    "raw_private_payload",
    "raw_source_payload",
    "raw_provider_payload",
    "provider_response_body",
    "full_transcript_payload",
  ]) {
    assert.equal(
      publicText.includes(phrase),
      false,
      `public artifact must not include raw payload example ${phrase}`,
    );
  }
}

function assertNoRawUnsafeMarkersInText(value) {
  for (const marker of [
    "hidden" + "_reasoning",
    "raw_page" + "_dump",
    "raw_pr" + "_diff",
    "raw_review" + "_payload",
    "access" + "_token",
    "refresh" + "_token",
    "api" + "_key",
    "oauth" + "_token",
    "sk-proj" + "-",
    "ghp" + "_",
  ]) {
    assert.equal(
      value.includes(marker),
      false,
      `artifact must not echo raw unsafe marker ${marker}`,
    );
  }
}

function assertNoForbiddenImplementationSurfaces() {
  const implementationText = `${dogfoodText}\n${smokeText}`;
  for (const snippet of [
    "await" + " fetch(",
    "globalThis" + ".fetch(",
    "node:" + "http",
    "node:" + "https",
    "XML" + "HttpRequest",
    "responses" + ".create",
    "openai" + ".chat",
    "navigator" + ".clipboard",
    "commit" + "StateUpdate(",
    "better" + "-sql" + "ite3",
    "createClient" + "(",
    "graphql" + "(",
  ]) {
    assert.equal(
      implementationText.includes(snippet),
      false,
      `fixture preview must not introduce forbidden surface ${snippet}`,
    );
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `fixture preview changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
      changedFile === fixturePreviewDogfoodFile ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/") ||
        changedFile.startsWith("scripts/smoke-"),
      `fixture preview must stay docs/report/fixture-json/dogfood/smoke/package only: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/") &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("lib/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        changedFile !== "scripts/perspective-codex-former-capture-helper.mjs",
      `fixture preview must not change runtime, helper, route, UI, DB, or schema surfaces: ${changedFile}`,
    );
  }
}

function collectChangedFiles() {
  const workingTreeFiles = gitLines(["diff", "--name-only", "--diff-filter=ACMR"]);
  const stagedFiles = gitLines([
    "diff",
    "--cached",
    "--name-only",
    "--diff-filter=ACMR",
  ]);
  const branchFiles = gitLines([
    "diff",
    "--name-only",
    "--diff-filter=ACMR",
    "origin/main...HEAD",
  ]);
  const untrackedFiles = gitLines([
    "ls-files",
    "--others",
    "--exclude-standard",
  ]);

  return [
    ...new Set([
      ...workingTreeFiles,
      ...stagedFiles,
      ...branchFiles,
      ...untrackedFiles,
    ]),
  ].sort();
}

function gitLines(args) {
  return execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function assertContainsAll(value, expectedSnippets) {
  const normalizedValue = normalizeWhitespace(value);
  for (const snippet of expectedSnippets) {
    assert(
      normalizedValue.includes(normalizeWhitespace(snippet)),
      `expected text to include ${JSON.stringify(snippet)}`,
    );
  }
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}
