import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const projectionModuleFile =
  "lib/perspective-ingest/perspective-codex-former-constellation-projection.ts";
const projectionDocFile =
  "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PROJECTION_V0_1.md";
const projectionReportFile =
  "reports/2026-06-10-perspective-codex-former-constellation-projection.md";
const projectionSmokeFile =
  "scripts/smoke-perspective-codex-former-constellation-projection.mjs";
const productSurfaceDesignSmokeFile =
  "scripts/smoke-perspective-codex-former-product-surface-design.mjs";
const workflowCloseoutSmokeFile =
  "scripts/smoke-perspective-codex-former-workflow-closeout.mjs";
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

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const allowedChangedFiles = new Set([
  packageFile,
  projectionModuleFile,
  projectionDocFile,
  projectionReportFile,
  projectionSmokeFile,
  productSurfaceDesignSmokeFile,
  workflowCloseoutSmokeFile,
  manualWorkflowDocsSmokeFile,
  manualCopyPacketSmokeFile,
  separateSessionPrepSmokeFile,
  separateSessionCaptureSmokeFile,
  captureHelperSmokeFile,
]);

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const projectionDocText = readFileSync(projectionDocFile, "utf8");
const projectionReportText = readFileSync(projectionReportFile, "utf8");
const projectionModuleText = readFileSync(projectionModuleFile, "utf8");
const projectionSmokeText = readFileSync(projectionSmokeFile, "utf8");

assert.equal(existsSync(projectionModuleFile), true, `${projectionModuleFile} must exist`);
assert.equal(existsSync(projectionDocFile), true, `${projectionDocFile} must exist`);
assert.equal(
  existsSync(projectionReportFile),
  true,
  `${projectionReportFile} must exist`,
);
assert.equal(existsSync(projectionSmokeFile), true, `${projectionSmokeFile} must exist`);
assert.equal(
  packageJson.scripts["smoke:perspective-codex-former-constellation-projection"],
  `${expectedTsxCommand} ${projectionSmokeFile}`,
  "package.json must register the constellation projection smoke",
);

const { buildCodexFormerConstellationProjection } = await import(
  "../lib/perspective-ingest/perspective-codex-former-constellation-projection.ts"
);

assert.equal(
  typeof buildCodexFormerConstellationProjection,
  "function",
  "module must export buildCodexFormerConstellationProjection",
);

assertDocsAndReport();
assertPassWithFollowUpProjection(buildCodexFormerConstellationProjection);
assertBlockedProjection(buildCodexFormerConstellationProjection);
assertNoRawUnsafeMarkersInPublicArtifacts();
assertNoForbiddenImplementationSurfaces();
assertChangedFileBoundary();

console.log("PASS smoke:perspective-codex-former-constellation-projection");

function assertDocsAndReport() {
  assertContainsAll(projectionDocText, [
    "Perspective Codex Former Constellation Projection v0.1",
    "Purpose",
    "follows PR #498",
    "The projection is read-only.",
    "Input Shape",
    "Node Model",
    "Edge Model",
    "PASS With Follow-Up Mapping",
    "BLOCKED Mapping",
    "Status Summary",
    "Warning Summary",
    "Authority Summary",
    "Privacy Boundary",
    "Future Relationship To Constellation Preview",
    "Add Codex Former constellation projection fixture preview",
    "Conclusion: PASS with follow-up",
  ]);
  assertContainsAll(projectionDocText, [
    "does not create accepted Augnes state",
    "write persistence",
    "proof/evidence/readiness records",
    "call providers",
    "call the Codex SDK",
    "mutate GitHub",
    "implement UI",
    "Core decisions",
  ]);
  assertContainsAll(projectionReportText, [
    "Summary",
    "Why Follows PR #498",
    "Projection Contract",
    "Node/Edge Model",
    "PASS With Follow-Up Fixture",
    "BLOCKED Fixture",
    "Authority Boundary",
    "Privacy/Redaction Handling",
    "Verification",
    "Skipped Checks With Reasons",
    "What Codex Did Not Do",
    "Recommended Next PR",
  ]);
}

function assertPassWithFollowUpProjection(builder) {
  const projection = builder({
    generated_at: "2026-06-10T00:00:00.000Z",
    capture_source_kind: "bounded_source_input_file",
    source_input_hash: "hash:source-input-pass-follow-up",
    source_prompt_hash: "hash:prompt-pass-follow-up",
    metadata_match: true,
    candidate_count: 1,
    conclusion: "PASS with follow-up",
    direct_validation_status: "needs_review",
    candidate_authority: "non_committed",
    candidate_basis_quality: "needs_review",
    pointer_warning_count: 1,
    warning_summary: [
      "Pointer warning remains visible for human review.",
      `Unsafe marker detail ${"hidden" + "_reasoning"} must be omitted.`,
    ],
    blocked_reasons: [],
    source_pr_refs: ["pr:hynk-studio/augnes#498"],
    changed_files: [
      "docs/PERSPECTIVE_CODEX_FORMER_PRODUCT_SURFACE_DESIGN_V0_1.md",
    ],
    next_action_summaries: [
      "Define fixture-backed Constellation Preview material next.",
    ],
  });

  assert.equal(
    projection.projection_version,
    "codex_former_constellation_projection.v0.1",
  );
  assert.equal(
    projection.projection_kind,
    "codex_former_constellation_projection",
  );
  assert.equal(projection.status_summary.overall_status, "pass_with_follow_up");
  assert.equal(projection.authority_summary.review_only, true);
  assert.equal(projection.authority_summary.non_committed_candidate, true);

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
  assert.equal(
    projection.warning_summary.warnings.some((warning) =>
      warning.includes("hidden" + "_reasoning"),
    ),
    false,
    "unsafe warning marker must be omitted",
  );
  assert.equal(projection.privacy.unsafe_input_material_omitted, true);
  assert(
    projection.privacy.omitted_unsafe_fields.includes(
      "projection.warning_summary[1]",
    ),
    "projection should report omitted unsafe warning field",
  );
}

function assertBlockedProjection(builder) {
  const projection = builder({
    generated_at: "2026-06-10T00:00:00.000Z",
    capture_source_kind: "bounded_source_input_file",
    source_input_hash: "hash:source-input-blocked",
    source_prompt_hash: "hash:prompt-blocked",
    metadata_match: false,
    candidate_count: 2,
    conclusion: "BLOCKED with useful findings",
    direct_validation_status: "blocked",
    candidate_authority: "none",
    candidate_basis_quality: "blocked",
    pointer_warning_count: 0,
    warning_summary: ["Returned material needs review."],
    blocked_reasons: [
      "Missing or mismatched provenance blocks candidate review use.",
      "Multiple candidate drafts were returned.",
      `Unsafe blocked detail ${"raw" + "_review" + "_payload"} must be omitted.`,
    ],
    source_pr_refs: ["pr:hynk-studio/augnes#498"],
    changed_files: ["reports/2026-06-10-perspective-codex-former-product-surface-design.md"],
    next_action_summaries: ["This should not become usable next action material."],
  });

  assert.equal(projection.status_summary.overall_status, "blocked");
  assert.equal(projection.authority_summary.accepted_state_created, false);
  assert.equal(projection.authority_summary.non_committed_candidate, false);
  assertNodeKinds(projection, ["validation_summary", "warning"]);
  assertEdgeRelations(projection, ["blocked_by"]);
  assert.equal(
    projection.nodes.some((node) => node.node_kind === "review_candidate"),
    false,
    "blocked projection must not emit review_candidate",
  );
  assert.equal(
    projection.nodes.some((node) => node.node_kind === "worker_guidance"),
    false,
    "blocked projection must not emit worker_guidance",
  );
  assert.equal(
    projection.warning_summary.blocked_reasons.some((reason) =>
      reason.includes("raw" + "_review" + "_payload"),
    ),
    false,
    "unsafe blocked marker must be omitted",
  );
  assert.equal(projection.privacy.unsafe_input_material_omitted, true);
  assertNoAcceptedFutureOnly(projection);
}

function assertNodeKinds(projection, expectedKinds) {
  for (const kind of expectedKinds) {
    assert(
      projection.nodes.some((node) => node.node_kind === kind),
      `expected projection to include ${kind} node`,
    );
  }
}

function assertEdgeRelations(projection, expectedRelations) {
  for (const relation of expectedRelations) {
    assert(
      projection.edges.some((edge) => edge.relation === relation),
      `expected projection to include ${relation} edge`,
    );
  }
}

function assertNoAcceptedFutureOnly(projection) {
  assert.equal(
    projection.nodes.some(
      (node) =>
        node.status === "accepted_future_only" ||
        node.authority === "accepted_future_only",
    ),
    false,
    "builder must not emit accepted_future_only nodes or authorities",
  );
}

function assertNoRawUnsafeMarkersInPublicArtifacts() {
  const publicText = `${projectionDocText}\n${projectionReportText}`;
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
      publicText.includes(marker),
      false,
      `projection docs/report must not echo raw unsafe marker ${marker}`,
    );
  }
}

function assertNoForbiddenImplementationSurfaces() {
  const implementationText = `${projectionModuleText}\n${projectionSmokeText}`;
  for (const snippet of [
    "await" + " fetch(",
    "globalThis" + ".fetch(",
    "XML" + "HttpRequest",
    "responses" + ".create",
    "openai" + ".chat",
    "navigator" + ".clipboard",
    "commit" + "StateUpdate(",
    "better" + "-sql" + "ite3",
  ]) {
    assert.equal(
      implementationText.includes(snippet),
      false,
      `projection contract must not introduce forbidden surface ${snippet}`,
    );
  }
}

function assertChangedFileBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `constellation projection changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === packageFile ||
        changedFile === projectionModuleFile ||
        changedFile.startsWith("docs/") ||
        changedFile.startsWith("reports/") ||
        changedFile.startsWith("scripts/smoke-"),
      `constellation projection must stay lib/docs/report/smoke/package only: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/") &&
        !changedFile.startsWith("components/") &&
        !changedFile.startsWith("migrations/") &&
        changedFile !== "scripts/perspective-codex-former-capture-helper.mjs",
      `constellation projection must not change runtime, helper, route, UI, or schema surfaces: ${changedFile}`,
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
