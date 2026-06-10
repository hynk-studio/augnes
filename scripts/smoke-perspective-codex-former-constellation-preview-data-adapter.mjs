import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const adapterModuleFile =
  "lib/perspective-ingest/perspective-codex-former-constellation-preview-data-adapter.ts";
const adapterDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PREVIEW_DATA_ADAPTER_V0_1.md";
const adapterReportFile =
  "reports/2026-06-10-perspective-codex-former-constellation-preview-data-adapter.md";
const passProjectionFixtureFile =
  "reports/fixtures/2026-06-10-codex-former-constellation-pass-with-follow-up.json";
const blockedProjectionFixtureFile =
  "reports/fixtures/2026-06-10-codex-former-constellation-blocked.json";
const passPreviewDataFixtureFile =
  "reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json";
const blockedPreviewDataFixtureFile =
  "reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json";
const adapterDogfoodFile =
  "scripts/dogfood-perspective-codex-former-constellation-preview-data-adapter.mjs";
const adapterSmokeFile =
  "scripts/smoke-perspective-codex-former-constellation-preview-data-adapter.mjs";
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
const fixturePreviewSmokeFile =
  "scripts/smoke-perspective-codex-former-constellation-fixture-preview.mjs";

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  adapterModuleFile,
  adapterDocFile,
  adapterReportFile,
  passPreviewDataFixtureFile,
  blockedPreviewDataFixtureFile,
  adapterDogfoodFile,
  adapterSmokeFile,
  manualWorkflowDocsSmokeFile,
  manualCopyPacketSmokeFile,
  separateSessionPrepSmokeFile,
  separateSessionCaptureSmokeFile,
  captureHelperSmokeFile,
  workflowCloseoutSmokeFile,
  productSurfaceDesignSmokeFile,
  constellationProjectionSmokeFile,
  fixturePreviewSmokeFile,
]);

const allowedNodeTones = new Set([
  "neutral",
  "review",
  "warning",
  "blocked",
  "future_only",
]);
const allowedLineStyles = new Set(["solid", "dashed", "dotted", "blocked"]);
const requiredAuthorityLensTags = [
  "no_accepted_state",
  "no_db_write",
  "no_provider_call",
  "no_codex_sdk_call",
  "no_github_mutation",
  "no_core_decision",
];

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const adapterText = readFileSync(adapterModuleFile, "utf8");
const dogfoodText = readFileSync(adapterDogfoodFile, "utf8");
const smokeText = readFileSync(adapterSmokeFile, "utf8");

const { buildCodexFormerConstellationPreviewData } = await import(
  "../lib/perspective-ingest/perspective-codex-former-constellation-preview-data-adapter.ts"
);
const dogfood = await import(
  "./dogfood-perspective-codex-former-constellation-preview-data-adapter.mjs"
);

assertPackageScripts();
assertArtifactsExist();
assert.equal(
  typeof buildCodexFormerConstellationPreviewData,
  "function",
  "adapter module must export buildCodexFormerConstellationPreviewData",
);
assert.equal(
  typeof dogfood.runPerspectiveCodexFormerConstellationPreviewDataAdapter,
  "function",
  "dogfood script must export its runner",
);

const previewRun = dogfood.runPerspectiveCodexFormerConstellationPreviewDataAdapter();
const docText = readFileSync(adapterDocFile, "utf8");
const reportText = readFileSync(adapterReportFile, "utf8");
const passProjectionText = readFileSync(passProjectionFixtureFile, "utf8");
const blockedProjectionText = readFileSync(blockedProjectionFixtureFile, "utf8");
const passPreviewText = readFileSync(passPreviewDataFixtureFile, "utf8");
const blockedPreviewText = readFileSync(blockedPreviewDataFixtureFile, "utf8");
const passProjection = JSON.parse(passProjectionText);
const blockedProjection = JSON.parse(blockedProjectionText);
const passPreviewData = JSON.parse(passPreviewText);
const blockedPreviewData = JSON.parse(blockedPreviewText);

assertDocsAndReport();
assertDogfoodDeterminism(previewRun, passPreviewData, blockedPreviewData);
assertAdapterCompatibility(passProjection, blockedProjection);
assertPreviewBasics(passPreviewData);
assertPreviewBasics(blockedPreviewData);
assertPassFixture(passProjection, passPreviewData);
assertBlockedFixture(blockedProjection, blockedPreviewData);
assertDisplayGraph(passPreviewData, passProjection, "PASS with follow-up");
assertDisplayGraph(blockedPreviewData, blockedProjection, "BLOCKED");
assertDetailDrawers(passPreviewData, { requiresReviewCandidate: true });
assertDetailDrawers(blockedPreviewData, { requiresReviewCandidate: false });
assertPrivacyAndSanitization([
  docText,
  reportText,
  passPreviewText,
  blockedPreviewText,
]);
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-constellation-preview-data-adapter");

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts[
      "dogfood:perspective-codex-former-constellation-preview-data-adapter"
    ],
    `${expectedTsxCommand} ${adapterDogfoodFile}`,
    "package.json must register the preview data adapter dogfood script",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-codex-former-constellation-preview-data-adapter"
    ],
    `${expectedTsxCommand} ${adapterSmokeFile}`,
    "package.json must register the preview data adapter smoke",
  );
}

function assertArtifactsExist() {
  for (const file of [
    adapterModuleFile,
    adapterDocFile,
    adapterReportFile,
    passPreviewDataFixtureFile,
    blockedPreviewDataFixtureFile,
    adapterDogfoodFile,
    adapterSmokeFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
}

function assertDocsAndReport() {
  assertContainsAll(docText, [
    "Perspective Codex Former Constellation Preview Data Adapter v0.1",
    "Purpose",
    "Why Follows PR #500",
    "Adapter Is Read-Only",
    "Input Projection",
    "Output Preview Data Shape",
    "Display Node Model",
    "Display Edge Model",
    "Display Policy",
    "Warning Panel",
    "Authority Lens",
    "Detail Drawers",
    "Legend",
    "PASS with follow-up Adaptation",
    "BLOCKED Adaptation",
    "Privacy Boundary",
    "Authority Boundary",
    "Future Relationship To Read-Only Constellation Preview",
    "Add read-only Constellation Preview fixture surface design",
    "Conclusion: PASS with follow-up",
  ]);
  assertContainsAll(reportText, [
    "Summary",
    "Why Follows PR #500",
    "Adapter Scope",
    "Preview Data Shape",
    "PASS with follow-up Adapted Fixture",
    "BLOCKED Adapted Fixture",
    "Warning Grouping",
    "Authority Lens",
    "Detail Drawer Payloads",
    "Privacy/Redaction Handling",
    "Authority Boundary",
    "Verification",
    "Skipped Checks With Reasons",
    "Recommended Next PR",
    "What Codex Did Not Do",
  ]);
}

function assertDogfoodDeterminism(run, passFixture, blockedFixture) {
  assert.deepEqual(
    passFixture,
    run.pass_preview_data,
    "PASS adapted fixture must match dogfood output",
  );
  assert.deepEqual(
    blockedFixture,
    run.blocked_preview_data,
    "BLOCKED adapted fixture must match dogfood output",
  );
  for (const [file, text] of [
    [passPreviewDataFixtureFile, passPreviewText],
    [blockedPreviewDataFixtureFile, blockedPreviewText],
  ]) {
    assert.equal(
      `${JSON.stringify(JSON.parse(text), null, 2)}\n`,
      text,
      `${file} must be deterministic pretty JSON`,
    );
  }
}

function assertAdapterCompatibility(passProjectionValue, blockedProjectionValue) {
  const passBefore = JSON.stringify(passProjectionValue);
  const blockedBefore = JSON.stringify(blockedProjectionValue);
  assert.deepEqual(
    buildCodexFormerConstellationPreviewData({
      generated_at: dogfood.CODEX_FORMER_CONSTELLATION_PREVIEW_DATA_ADAPTER_GENERATED_AT,
      projection: passProjectionValue,
      preview_context: {
        surface_label: "Codex Former constellation preview data",
        intended_surface: "constellation_preview",
      },
    }),
    passPreviewData,
    "PASS adapted fixture must be built from PASS projection fixture",
  );
  assert.deepEqual(
    buildCodexFormerConstellationPreviewData({
      generated_at: dogfood.CODEX_FORMER_CONSTELLATION_PREVIEW_DATA_ADAPTER_GENERATED_AT,
      projection: blockedProjectionValue,
      preview_context: {
        surface_label: "Codex Former constellation preview data",
        intended_surface: "constellation_preview",
      },
    }),
    blockedPreviewData,
    "BLOCKED adapted fixture must be built from BLOCKED projection fixture",
  );
  assert.equal(
    JSON.stringify(passProjectionValue),
    passBefore,
    "adapter must not mutate PASS projection",
  );
  assert.equal(
    JSON.stringify(blockedProjectionValue),
    blockedBefore,
    "adapter must not mutate BLOCKED projection",
  );
}

function assertPreviewBasics(previewData) {
  assert.equal(
    previewData.preview_version,
    "codex_former_constellation_preview_data.v0.1",
  );
  assert.equal(
    previewData.preview_kind,
    "codex_former_constellation_preview_data",
  );
  assert.equal(
    previewData.source_projection.projection_version,
    "codex_former_constellation_projection.v0.1",
  );
  assert.equal(
    previewData.source_projection.projection_kind,
    "codex_former_constellation_projection",
  );
  assert.equal(previewData.display_policy.default_badge_limit, 2);
  assert.equal(
    previewData.display_policy.default_view_shows_full_authority_flags,
    false,
  );
  assert.equal(previewData.display_policy.hover_view_enabled, true);
  assert.equal(previewData.display_policy.detail_drawer_enabled, true);
  assert.equal(previewData.display_policy.authority_lens_available, true);
  assert.equal(previewData.summary_panel.is_review_only, true);
  assert.equal(previewData.summary_panel.is_accepted_state, false);
  assert.equal(previewData.authority_lens.available, true);
  assert.equal(previewData.authority_lens.default_enabled, false);
  for (const tag of requiredAuthorityLensTags) {
    assert(
      previewData.authority_lens.tags.includes(tag),
      `authority lens must include ${tag}`,
    );
  }
  assert.equal(previewData.privacy.raw_payloads_included, false);
  assert.equal(previewData.privacy.bounded_summaries_only, true);
  assertFalseAuthorityBehavior(previewData);
  assert.equal(
    previewData.graph.nodes.some((node) => node.tone === "future_only"),
    false,
    "current fixtures must not emit future_only node tone",
  );
  assert.equal(
    previewData.graph.edges.some((edge) => edge.tone === "future_only"),
    false,
    "current fixtures must not emit future_only edge tone",
  );
  assert.equal(
    JSON.stringify(previewData.graph).includes("accepted_future_only"),
    false,
    "current fixture graph must not emit accepted_future_only",
  );
}

function assertPassFixture(projection, previewData) {
  assert.equal(previewData.source_projection.overall_status, "pass_with_follow_up");
  assert.equal(previewData.summary_panel.primary_status_label, "PASS with follow-up");
  assert.match(previewData.summary_panel.primary_caveat_label, /needs_review|pointer/);
  assert.match(previewData.summary_panel.next_safe_action_label, /Advisory/);
  assert.equal(previewData.graph.nodes.length, projection.nodes.length);
  assert.equal(previewData.graph.edges.length, projection.edges.length);
  assertNodeKind(previewData, "review_candidate", true);
  assertNodeKind(previewData, "worker_guidance", true);
  assertNodeKind(previewData, "next_action", true);
  assert.equal(previewData.warning_panel.has_pointer_warnings, true);
  assert.equal(previewData.warning_panel.has_blocking_warnings, false);
  assert(
    previewData.warning_panel.grouped_warnings.some(
      (group) => group.id === "warning_group:pointer_warning_pressure",
    ),
    "PASS fixture must group pointer warning pressure",
  );
}

function assertBlockedFixture(projection, previewData) {
  assert.equal(previewData.source_projection.overall_status, "blocked");
  assert.equal(previewData.summary_panel.primary_status_label, "BLOCKED");
  assert.match(
    previewData.summary_panel.primary_caveat_label,
    /Blocked validation|provenance|candidate/i,
  );
  assert.match(
    previewData.summary_panel.next_safe_action_label,
    /No usable review candidate/,
  );
  assert.equal(previewData.graph.nodes.length, projection.nodes.length);
  assert.equal(previewData.graph.edges.length, projection.edges.length);
  assertNodeKind(previewData, "validation_summary", true);
  assertNodeKind(previewData, "warning", true);
  assertNodeKind(previewData, "review_candidate", false);
  assertNodeKind(previewData, "worker_guidance", false);
  assertNodeKind(previewData, "next_action", false);
  assert.equal(previewData.warning_panel.has_blocking_warnings, true);
  assert(
    previewData.warning_panel.blocked_reasons.length > 0,
    "BLOCKED fixture must group blocking reasons",
  );
  assert(
    previewData.graph.edges
      .filter((edge) => edge.relation === "blocked_by")
      .every((edge) => edge.line_style === "blocked"),
    "blocked_by edges must map to blocked line style",
  );
}

function assertDisplayGraph(previewData, projection, label) {
  const nodeIds = new Set(previewData.graph.nodes.map((node) => node.id));
  assert.equal(
    nodeIds.size,
    previewData.graph.nodes.length,
    `${label} display node ids must be unique`,
  );

  for (const node of previewData.graph.nodes) {
    assert(
      projection.nodes.some((sourceNode) => sourceNode.id === node.source_node_id),
      `${label} node ${node.id} must reference a projection node`,
    );
    assert.equal(typeof node.label, "string");
    assert(node.label.length > 0 && node.label.length <= 64);
    assert.equal(typeof node.status, "string");
    assert.equal(typeof node.authority, "string");
    assert(allowedNodeTones.has(node.tone), `${node.id} has invalid tone`);
    assert(
      Array.isArray(node.badges) && node.badges.length <= 2,
      `${node.id} must have at most two badges`,
    );
    assert(node.compact_summary.length > 0 && node.compact_summary.length <= 180);
    assert.equal(typeof node.detail_drawer_id, "string");
    assert(Array.isArray(node.authority_lens_tags));
  }

  for (const edge of previewData.graph.edges) {
    assert(nodeIds.has(edge.from), `${edge.id} from node must exist`);
    assert(nodeIds.has(edge.to), `${edge.id} to node must exist`);
    assert(
      projection.edges.some((sourceEdge) => sourceEdge.id === edge.source_edge_id),
      `${label} edge ${edge.id} must reference a projection edge`,
    );
    assert(allowedLineStyles.has(edge.line_style), `${edge.id} invalid line style`);
    assert(allowedNodeTones.has(edge.tone), `${edge.id} invalid tone`);
    assert(edge.label.length > 0 && edge.label.length <= 32);
    if (edge.relation === "pointer_only") {
      assert.equal(edge.line_style, "dotted", "pointer_only edge must be dotted");
    }
    if (
      edge.relation === "blocked_by" ||
      edge.status === "blocked" ||
      edge.authority_boundary === "blocked"
    ) {
      assert.equal(edge.line_style, "blocked", "blocked edge must be blocked");
    }
  }
}

function assertDetailDrawers(previewData, { requiresReviewCandidate }) {
  assertDrawer(previewData, "summary", "summary_panel");
  assertDrawer(previewData, "warning_panel", "warning_panel");
  assertDrawer(previewData, "authority_lens", "authority_lens");
  assertDrawer(previewData, "node", "node:validation_summary");
  if (requiresReviewCandidate) {
    assertDrawer(previewData, "node", "node:review_candidate");
  }
  for (const drawer of previewData.detail_drawers) {
    assert(drawer.title.length > 0 && drawer.title.length <= 180);
    assert(Array.isArray(drawer.sections));
    for (const section of drawer.sections) {
      assert(section.heading.length > 0 && section.heading.length <= 80);
      assert(Array.isArray(section.rows));
      for (const row of section.rows) {
        assert(row.label.length > 0 && row.label.length <= 80);
        assert(row.value.length > 0 && row.value.length <= 180);
      }
    }
  }
}

function assertDrawer(previewData, targetKind, targetId) {
  assert(
    previewData.detail_drawers.some(
      (drawer) =>
        drawer.target_kind === targetKind && drawer.target_id === targetId,
    ),
    `missing drawer for ${targetKind}:${targetId}`,
  );
}

function assertNodeKind(previewData, kind, expected) {
  assert.equal(
    previewData.graph.nodes.some((node) => node.kind === kind),
    expected,
    `${kind} node existence mismatch`,
  );
}

function assertFalseAuthorityBehavior(previewData) {
  assert.equal(previewData.authority_lens.flags.accepted_state_created, false);
  assert.equal(
    previewData.authority_lens.flags.proof_evidence_readiness_created,
    false,
  );
  assert.equal(previewData.authority_lens.flags.provider_model_calls, false);
  assert.equal(previewData.authority_lens.flags.codex_sdk_calls, false);
  assert.equal(previewData.authority_lens.flags.github_mutation, false);
  assert.equal(previewData.authority_lens.flags.db_writes, false);
  assert.equal(previewData.authority_lens.flags.ui_implemented, false);
  assert.equal(previewData.authority_lens.flags.core_decision, false);
  for (const [key, value] of Object.entries(previewData.authority_flags)) {
    assert.equal(value, false, `${key} must stay false`);
  }
}

function assertPrivacyAndSanitization(publicTexts) {
  const publicText = publicTexts.join("\n");
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
  const implementationText = `${adapterText}\n${dogfoodText}\n${smokeText}`;
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
    "app" + "/api/",
  ]) {
    assert.equal(
      implementationText.includes(snippet),
      false,
      `preview data adapter must not introduce forbidden surface ${snippet}`,
    );
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `preview data adapter changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile === adapterModuleFile ||
        changedFile === adapterDogfoodFile ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/") ||
        changedFile.startsWith("scripts/smoke-"),
      `preview data adapter must stay lib/docs/report/fixture-json/dogfood/smoke/package only: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/") &&
        !changedFile.startsWith("components/") &&
        (!changedFile.startsWith("lib/") || changedFile === adapterModuleFile) &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        changedFile !== "scripts/perspective-codex-former-capture-helper.mjs",
      `preview data adapter must not change runtime, helper, route, UI, DB, or schema surfaces: ${changedFile}`,
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
