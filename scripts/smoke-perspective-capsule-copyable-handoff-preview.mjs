import assert from "node:assert/strict";
import {
  assertChangedFilesWithinBoundaryProfile,
  assertContainsAll,
  assertPackageScript,
  getProjectConstellationBoundaryScopeProfile,
  loadTextByFile,
  normalizeText,
} from "./smoke-boundary-common.mjs";

const cockpitFile = "components/augnes-cockpit.tsx";
const smokeFile = "scripts/smoke-perspective-capsule-copyable-handoff-preview.mjs";
const cockpitPreviewSmokeFile =
  "scripts/smoke-project-constellation-cockpit-preview.mjs";
const packageJsonFile = "package.json";
const capsuleDoc = "docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md";
const projectDoc = "docs/PROJECT_CONSTELLATION_IA_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const browserReportFile =
  "reports/browser/2026-06-03-perspective-capsule-copyable-handoff-preview.md";

const inspectedFiles = [
  cockpitFile,
  smokeFile,
  cockpitPreviewSmokeFile,
  packageJsonFile,
  capsuleDoc,
  projectDoc,
  indexDoc,
];

const boundaryScopeProfile = getProjectConstellationBoundaryScopeProfile({
  ownedFiles: [browserReportFile],
});

const textByFile = loadTextByFile(inspectedFiles);
const cockpit = textByFile.get(cockpitFile);
const perspectiveSource = extractSourceBetween(
  cockpit,
  "function PerspectiveTab",
  "function LedgerTab",
);
const constellationPreviewSource = extractSourceBetween(
  cockpit,
  'id="perspective-constellation-preview"',
  "function LedgerTab",
);
const handoffPreviewSource = extractSourceBetween(
  cockpit,
  'className="perspective-detail-panel perspective-capsule-copyable-handoff-preview"',
  "<h3>Codex execution authority preview</h3>",
);
const previewConstantSource = extractSourceBetween(
  cockpit,
  "const PROJECT_CONSTELLATION_SAMPLE_FIXTURE_PATH =",
  "// Tab order: Overview -> Work -> Perspective -> Bridge -> Operator",
);
const handoffBuilderSource = extractSourceBetween(
  cockpit,
  "function buildProjectConstellationCopyableHandoffText",
  "// Tab order: Overview -> Work -> Perspective -> Bridge -> Operator",
);
const combinedPreviewSource = [
  previewConstantSource,
  handoffBuilderSource,
  handoffPreviewSource,
].join("\n");

assertPackageJsonScript();
assertCopyablePreviewPlacement();
assertCopyablePreviewContent();
assertCopyablePreviewReadOnly();
assertDocPointers();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "perspective-capsule-copyable-handoff-preview",
      pass: true,
      cockpit_checked: cockpitFile,
      docs_checked: [capsuleDoc, projectDoc, indexDoc],
      package_script_checked: true,
      copyable_handoff_preview_checked: true,
      readonly_selectable_surface_checked: true,
      content_checks_preserved: true,
      forbidden_action_controls_checked: true,
      boundary_profile_name: changedFilesBoundary.profile_name,
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
      smoke_type: "static-copyable-handoff-preview-boundary-only",
      runtime_behavior_changed: false,
      project_constellation_runtime_behavior_changed: false,
      graph_db_added: false,
      persistence_added: false,
      api_route_behavior_changed: false,
      mcp_app_tool_changes_added: false,
      plugin_runtime_action_added: false,
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
console.log("PASS smoke:perspective-capsule-copyable-handoff-preview");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:perspective-capsule-copyable-handoff-preview",
    expectedCommand:
      "node scripts/smoke-perspective-capsule-copyable-handoff-preview.mjs",
  });
}

function assertCopyablePreviewPlacement() {
  assertContainsAll(perspectiveSource, [
    'id="perspective-constellation-preview"',
    "perspective-capsule-copyable-handoff-preview",
    "Perspective Capsule / Handoff Capsule",
  ], { label: "Perspective tab copyable handoff preview placement" });

  assert(
    constellationPreviewSource.includes(
      "perspective-capsule-copyable-handoff-preview",
    ),
    "Copyable handoff preview must be inside the Project Constellation preview section",
  );
}

function assertCopyablePreviewContent() {
  assertContainsAllCaseInsensitive(combinedPreviewSource, [
    "Perspective Capsule / Handoff Capsule",
    "codex_handoff",
    "thesis",
    "repo",
    "base branch",
    "expected PR title",
    "task goal",
    "expected changed files",
    "forbidden changed files",
    "hard constraints",
    "required checks",
    "skipped check policy",
    "browser/computer-use",
    "proof-only closeout",
    "final report requirements",
    "blockers/risks",
    "assumptions",
    "questions requiring user/PM judgment",
    "next suggested goal",
    "evidence pointers",
    "unresolved tensions",
    "forbidden actions",
    "Readonly selectable handoff text",
    "This is a read-only handoff preview for manual review",
  ], "Perspective Capsule copyable handoff preview content");

  assertContainsAll(combinedPreviewSource, [
    "PROJECT_CONSTELLATION_COPYABLE_HANDOFF_TEXT",
    "buildProjectConstellationCopyableHandoffText",
    "sourceSurface",
    "sourceScope",
    "selectedNodes",
    "selectedEdges",
    "expectedPrTitle",
    "expectedChangedFiles",
    "forbiddenChangedFiles",
    "hardConstraints",
    "skippedCheckPolicy",
    "browserComputerUseExpectation",
    "proofOnlyCloseoutStatusOrSkip",
    "prBodyRequirements",
    "finalReportRequirements",
    "blockersOrRisks",
    "questionsRequiringUserPmJudgment",
  ], { label: "Perspective Capsule copyable handoff data bindings" });

  assertContainsAll(handoffBuilderSource, [
    "`- expected PR title: ${packet.expectedPrTitle}`",
  ], {
    label:
      "Perspective Capsule copyable handoff expected PR title generated text",
  });
}

function assertCopyablePreviewReadOnly() {
  assert.equal(
    /<textarea\b/.test(handoffPreviewSource),
    true,
    "Copyable handoff preview must render a textarea text surface",
  );
  assert.equal(
    /\breadOnly\b/.test(handoffPreviewSource),
    true,
    "Copyable handoff preview textarea must be readonly",
  );
  assert.equal(
    /value=\{copyableHandoffText\}/.test(handoffPreviewSource),
    true,
    "Copyable handoff preview textarea must render the static handoff text",
  );
  assert.equal(
    /<button\b/.test(handoffPreviewSource),
    false,
    "Copyable handoff preview must not add action buttons",
  );
  assert.equal(
    /\bonClick\s*=|navigator\.clipboard|\bfetch\s*\(|fetchJson\s*</.test(
      handoffPreviewSource,
    ),
    false,
    "Copyable handoff preview must not add click handlers, clipboard calls, or fetches",
  );
  assert.equal(
    /method:\s*"POST"|method:\s*"PUT"|method:\s*"PATCH"|method:\s*"DELETE"/.test(
      handoffPreviewSource,
    ),
    false,
    "Copyable handoff preview must not introduce write methods",
  );

  const buttonLabels = [
    ...handoffPreviewSource.matchAll(/<button\b[\s\S]*?<\/button>/g),
  ].map(([button]) => normalizeText(button.replace(/<[^>]*>/g, " ")).toLowerCase());

  for (const forbiddenControl of [
    "copy button",
    "save snapshot",
    "rollback",
    "execute",
    "launch codex",
    "run codex",
    "create pr",
    "open pr",
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
      buttonLabels.some((label) => label.includes(forbiddenControl)),
      false,
      `Copyable handoff preview must not add forbidden control: ${forbiddenControl}`,
    );
  }

  for (const forbiddenRuntimePointer of [
    "/api/",
    "db/",
    "migrations/",
    "@openai/codex-sdk",
    "provider implementation",
    "graph DB",
    "persistence write",
    "AG Resume writer",
  ]) {
    assert.equal(
      handoffPreviewSource.includes(forbiddenRuntimePointer),
      false,
      `Copyable handoff preview must not introduce runtime pointer: ${forbiddenRuntimePointer}`,
    );
  }
}

function assertDocPointers() {
  assertContainsAll(capsuleDoc, [
    "Perspective Capsule / Handoff Capsule copyable handoff preview",
    "smoke:perspective-capsule-copyable-handoff-preview",
    "readonly",
    "codex_handoff",
    "no live SDK call",
    "no provider implementation",
    "no runtime execution",
  ], { textByFile });

  assertContainsAll(projectDoc, [
    "Perspective Capsule / Handoff Capsule copyable handoff preview",
    "smoke:perspective-capsule-copyable-handoff-preview",
    "readonly",
    "codex_handoff",
    "no action controls",
  ], { textByFile });

  assertContainsAll(indexDoc, [
    "Perspective Capsule / Handoff Capsule copyable handoff preview",
    "smoke:perspective-capsule-copyable-handoff-preview",
    "no live SDK call",
    "no provider implementation",
    "no runtime execution",
    "no proof/evidence write",
  ], { textByFile });
}

function assertChangedFilesBoundary() {
  return assertChangedFilesWithinBoundaryProfile({
    profile: boundaryScopeProfile,
    label: "Perspective Capsule copyable handoff preview smoke",
  });
}

function assertContainsAllCaseInsensitive(text, requiredPhrases, label) {
  const normalizedText = normalizeText(text).toLowerCase();

  for (const phrase of requiredPhrases) {
    assert(
      normalizedText.includes(normalizeText(phrase).toLowerCase()),
      `${label} must contain: ${phrase}`,
    );
  }
}

function extractSourceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `Missing source marker after ${startMarker}: ${endMarker}`);
  return source.slice(start, end);
}
