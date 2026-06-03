import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  getBoundarySmokeMode,
  loadTextByFile,
  normalizeText,
  repoRoot,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const cockpitFile = "components/augnes-cockpit.tsx";
const smokeFile = "scripts/smoke-project-constellation-cockpit-preview.mjs";
const packageJsonFile = "package.json";
const projectDoc = "docs/PROJECT_CONSTELLATION_IA_V0_1.md";
const capsuleDoc = "docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const fixtureFile =
  "fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json";
const copyableHandoffSmokeFile =
  "scripts/smoke-perspective-capsule-copyable-handoff-preview.mjs";
const browserReportFile =
  "reports/browser/2026-06-03-project-constellation-cockpit-preview.md";
const copyableHandoffBrowserReportFile =
  "reports/browser/2026-06-03-perspective-capsule-copyable-handoff-preview.md";

const inspectedFiles = [
  cockpitFile,
  smokeFile,
  packageJsonFile,
  projectDoc,
  indexDoc,
  fixtureFile,
];

const allowedChangedFiles = new Set([
  cockpitFile,
  smokeFile,
  copyableHandoffSmokeFile,
  packageJsonFile,
  capsuleDoc,
  projectDoc,
  indexDoc,
  browserReportFile,
  copyableHandoffBrowserReportFile,
]);

const textByFile = loadTextByFile(inspectedFiles);
const cockpit = textByFile.get(cockpitFile);
const fixture = JSON.parse(textByFile.get(fixtureFile));
const previewConstantSource = extractSourceBetween(
  cockpit,
  "const PROJECT_CONSTELLATION_SAMPLE_FIXTURE_PATH =",
  "// Tab order: Overview -> Work -> Perspective -> Bridge -> Operator",
);
const perspectiveSource = extractSourceBetween(
  cockpit,
  "function PerspectiveTab",
  "function LedgerTab",
);
const previewSectionSource = extractSourceBetween(
  cockpit,
  'id="perspective-constellation-preview"',
  "function LedgerTab",
);

assertPackageJsonScript();
assertPreviewAnchoredToFixture();
assertPreviewCopyAndLayout();
assertPreviewIsReadOnly();
assertDocPointers();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "project-constellation-cockpit-preview",
      pass: true,
      cockpit_checked: cockpitFile,
      fixture_checked: fixtureFile,
      docs_checked: [projectDoc, indexDoc],
      package_script_checked: true,
      fixture_path_visible: true,
      nodes_checked: fixture.nodes.length,
      edges_checked: fixture.edges.length,
      cluster_checked: true,
      perspective_capsule_preview_checked: true,
      codex_execution_authority_preview_checked: true,
      read_only_preview_checked: true,
      forbidden_action_controls_checked: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_checked: changedFilesBoundary.files,
      changed_files_observed: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      untracked_files_checked: changedFilesBoundary.untracked_checked,
      untracked_files_skipped: changedFilesBoundary.untracked_skipped,
      untracked_files_skip_reason: changedFilesBoundary.untracked_skip_reason,
      untracked_files_observed: changedFilesBoundary.untracked_files,
      smoke_type: "static-cockpit-preview-boundary-only",
      runtime_behavior_changed: false,
      project_constellation_runtime_behavior_changed: false,
      graph_db_added: false,
      persistence_added: false,
      api_route_behavior_changed: false,
      mcp_app_tool_changes_added: false,
      codex_sdk_import_added: false,
      codex_sdk_call_added: false,
      provider_implementation_added: false,
      proof_evidence_writes_added: false,
      ag_resume_behavior_changed: false,
      action_controls_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:project-constellation-cockpit-preview");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:project-constellation-cockpit-preview",
    expectedCommand: "node scripts/smoke-project-constellation-cockpit-preview.mjs",
  });
}

function assertPreviewAnchoredToFixture() {
  assertContainsAll(previewConstantSource, [
    fixtureFile,
    "Project Constellation",
    "sample_fixture_only",
    "read_only_non_authoritative",
    "work_unit_constellation",
    "Sidecar e_t Strategy C first slice",
    "Perspective Capsule preview",
    "Codex execution authority preview",
    "no live SDK call",
    "no provider implementation",
    "no runtime execution",
    "no graph DB",
    "no persistence",
    "no proof/evidence/readiness writes",
  ], { label: "Project Constellation Cockpit preview constant" });

  assert.equal(
    countOccurrences(previewConstantSource, 'id: "node.'),
    fixture.nodes.length,
    "Cockpit preview constant should include every fixture node",
  );
  assert.equal(
    countOccurrences(previewConstantSource, 'id: "edge.'),
    fixture.edges.length,
    "Cockpit preview constant should include every fixture edge",
  );

  for (const node of fixture.nodes) {
    assertContainsAll(previewConstantSource, [node.id, node.type, node.label], {
      label: "Project Constellation Cockpit node preview",
    });
  }

  for (const edge of fixture.edges) {
    assertContainsAll(
      previewConstantSource,
      [edge.id, edge.type, edge.source, edge.target],
      { label: "Project Constellation Cockpit edge preview" },
    );
  }

  const cluster = fixture.clusters.find(
    (entry) => entry.id === "cluster.sidecar_strategy_c_first_slice",
  );
  assert(cluster, "sample fixture should include expected cluster");
  assertContainsAll(previewConstantSource, [
    cluster.id,
    cluster.label,
    cluster.cluster_thesis,
  ], { label: "Project Constellation Cockpit cluster preview" });
}

function assertPreviewCopyAndLayout() {
  assertContainsAll(perspectiveSource, [
    'href="#perspective-constellation-preview"',
    "Constellation preview",
    "Project Constellation",
  ], { label: "Perspective Project Constellation anchor" });

  assertContainsAll(previewSectionSource, [
    "Project Constellation",
    "constellationPreview.fixturePath",
    "sample_fixture_only",
    "read_only_non_authoritative",
    "constellationPreview.sourceScopeTitle",
    "nodes",
    "edges",
    "evidence pointers",
    "unresolved tensions",
    "next action candidates",
    "Perspective Capsule preview",
    "Codex handoff packet summary",
    "Codex execution authority preview",
    "execution_intent",
    "recommended_permission_profile",
    "planning_review_permission",
    "escalation_required",
    "user_approval_required",
    "live_sdk_call",
    "provider_implementation",
    "runtime_execution",
    "no live SDK call",
    "no provider implementation",
    "no runtime execution",
    "constellationPreview.forbiddenBoundaries",
  ], { label: "Project Constellation Cockpit preview section" });
}

function assertPreviewIsReadOnly() {
  assert.equal(
    /<button\b/.test(previewSectionSource),
    false,
    "Project Constellation preview must not add buttons",
  );
  assert.equal(
    /\bonClick\s*=/.test(previewSectionSource),
    false,
    "Project Constellation preview must not add click handlers",
  );
  assert.equal(
    /\bfetch\s*\(|fetchJson\s*</.test(previewSectionSource),
    false,
    "Project Constellation preview must not fetch runtime data",
  );
  assert.equal(
    /method:\s*"POST"|method:\s*"PUT"|method:\s*"PATCH"|method:\s*"DELETE"/.test(
      previewSectionSource,
    ),
    false,
    "Project Constellation preview must not introduce write methods",
  );

  for (const forbiddenRoute of [
    "/api/",
    "db/",
    "migrations/",
    "createProjectConstellation",
    "recordProof",
    "recordEvidence",
    "@openai/codex-sdk",
  ]) {
    assert.equal(
      previewSectionSource.includes(forbiddenRoute),
      false,
      `Project Constellation preview must not introduce forbidden runtime pointer: ${forbiddenRoute}`,
    );
  }

  const previewButtonLabels = [
    ...previewSectionSource.matchAll(/<button\b[\s\S]*?<\/button>/g),
  ].map(([button]) => normalizeText(button.replace(/<[^>]*>/g, " ")).toLowerCase());

  for (const forbiddenControl of [
    "save snapshot",
    "rollback",
    "execute",
    "launch codex",
    "run codex",
    "record proof",
    "record evidence",
    "approve",
    "publish",
    "merge",
    "retry",
    "replay",
    "deploy",
  ]) {
    assert.equal(
      previewButtonLabels.some((label) => label.includes(forbiddenControl)),
      false,
      `Project Constellation preview must not add forbidden control: ${forbiddenControl}`,
    );
  }
}

function assertDocPointers() {
  assertContainsAll(projectDoc, [
    "smoke:project-constellation-cockpit-preview",
    "Project Constellation read-only Cockpit preview",
    "fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json",
    "sample_fixture_only",
    "read_only_non_authoritative",
    "no live SDK call",
    "no provider implementation",
    "no runtime execution",
  ], { textByFile });

  assertContainsAll(indexDoc, [
    "smoke:project-constellation-cockpit-preview",
    "Project Constellation read-only Cockpit preview",
    "no Project Constellation runtime behavior",
    "no graph DB",
    "no persistence",
    "no proof/evidence write",
    "no Codex SDK execution",
    "no AG Resume writer/helper/route behavior",
  ], { textByFile });
}

function assertChangedFilesBoundary() {
  const boundary = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Project Constellation Cockpit preview smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const mode = getBoundarySmokeMode();
  const contentOnly = mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Project Constellation Cockpit preview smoke: ${file}`,
      );
    }
  }

  const files = uniqueSorted([...boundary.files, ...untrackedFiles]);
  if (!contentOnly) {
    assertNoForbiddenChangedPaths(files);
  }

  return {
    ...boundary,
    files,
    untracked_checked: !contentOnly,
    untracked_skipped: contentOnly,
    untracked_skip_reason: contentOnly
      ? "untracked-file boundary skipped because AUGNES_BOUNDARY_SMOKE_MODE=content-only"
      : null,
    untracked_files: untrackedFiles,
  };
}

function assertNoForbiddenChangedPaths(files) {
  const forbiddenPatterns = [
    /^AGENTS\.md$/,
    /^db\//,
    /^migrations\//,
    /^app\/api\//,
    /^app\/.*route\.(ts|tsx|js|jsx)$/,
    /^apps\/augnes_apps\//,
    /(^|\/)(mcp|plugin|plugins|tool|tools|hook|hooks|mapping|mappings)(\/|$)/i,
    /(^|\/)(secret|secrets|env)(\/|$)/i,
    /(^|\/)(ag-work-resume|ag_resume|proof|evidence|sidecar|codex-sdk|provider|graph|persistence)/i,
  ];

  for (const file of files) {
    for (const pattern of forbiddenPatterns) {
      assert(
        !pattern.test(file),
        `Forbidden changed path for Project Constellation Cockpit preview smoke: ${file}`,
      );
    }
  }
}

function collectUntrackedFiles() {
  try {
    const output = execFileSync(
      "git",
      ["ls-files", "--others", "--exclude-standard"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    return uniqueSorted(
      output
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    );
  } catch {
    return [];
  }
}

function extractSourceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `Missing source marker after ${startMarker}: ${endMarker}`);
  return source.slice(start, end);
}

function countOccurrences(text, phrase) {
  return text.split(phrase).length - 1;
}
