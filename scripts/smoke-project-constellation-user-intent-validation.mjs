import assert from "node:assert/strict";
import {
  assertContainsAll,
  assertNoRuntimeImports,
  assertPackageScript,
  collectGitDiffFiles,
  collectUntrackedFiles,
  getBaseRangeChangedFiles,
  getBoundarySmokeMode,
  loadTextByFile,
  normalizeText,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const validationDoc =
  "docs/PROJECT_CONSTELLATION_USER_INTENT_VALIDATION_V0_1.md";
const browserReport =
  "reports/browser/2026-06-03-project-constellation-user-intent-validation.md";
const smokeFile =
  "scripts/smoke-project-constellation-user-intent-validation.mjs";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";

const inspectedFiles = [
  validationDoc,
  browserReport,
  smokeFile,
  indexDoc,
  packageJsonFile,
];

const allowedChangedFiles = new Set(inspectedFiles);

const requiredSections = [
  "Status and scope",
  "Purpose",
  "User-intent validation thesis",
  "Scenario matrix",
  "Scenario 1: first-entry orientation",
  "Scenario 2: node and edge meaning",
  "Scenario 3: evidence pointer comprehension",
  "Scenario 4: unresolved tension visibility",
  "Scenario 5: boundary and next-action clarity",
  "Scenario 6: Perspective Capsule / Handoff Capsule comprehension",
  "Scenario 7: authority-misread prevention",
  "Scenario 8: user question answerability",
  "Browser/computer-use validation method",
  "Pass/fail rubric",
  "Required report fields",
  "Validation and smoke plan",
  "Non-goals",
];

const requiredScenarioNames = requiredSections.filter((section) =>
  /^Scenario \d+:/.test(section),
);

const requiredExpectations = [
  "current Project Constellation preview and sample fixture status",
  "cluster thesis",
  "nodes",
  "edges",
  "clusters",
  "evidence pointers",
  "unresolved tensions",
  "boundaries",
  "next action candidates",
  "pointer-only",
  "do not create proof/evidence/readiness records",
  "advisory",
  "bounded handoff preview",
  "manually inspect/select",
  "does not execute Codex",
  "create branches",
  "open PRs",
  "merge",
  "publish",
  "approve",
  "retry",
  "replay",
  "deploy",
  "record proof",
  "record evidence",
  "save snapshots",
  "persist graphs",
  "create runtime nodes",
];

const requiredReportFields = [
  "Inspected URL or skipped reason",
  "Local runtime setup used or skipped reason",
  "Browser/computer-use availability",
  "Scenario results",
  "Screenshots or visual references",
  "Observed UX gaps",
  "Authority clarity findings",
  "User-facing comprehension findings",
  "False-affordance findings",
  "Recommended next UI/API/doc action",
  "Skipped checks with concrete reasons",
  "Proof-only closeout",
];

const reportResultPhrases = [
  "Scenario 1: first-entry orientation",
  "Scenario 2: node and edge meaning",
  "Scenario 3: evidence pointer comprehension",
  "Scenario 4: unresolved tension visibility",
  "Scenario 5: boundary and next-action clarity",
  "Scenario 6: Perspective Capsule / Handoff Capsule comprehension",
  "Scenario 7: authority-misread prevention",
  "Scenario 8: user question answerability",
];

const forbiddenPathPatterns = [
  /^AGENTS\.md$/,
  /^app\//,
  /^components\//,
  /^db\//,
  /^migrations\//,
  /^apps\/augnes_apps\//,
  /(^|\/)(mcp|plugin|plugins|tool|tools|hook|hooks|mapping|mappings)(\/|$)/i,
  /(^|\/)(secret|secrets|env)(\/|$)/i,
  /(^|\/)\.env/i,
  /(^|\/)(ag-work-resume|ag_resume|ag-resume)(\/|$)/i,
  /(^|\/)(proof|evidence)(\/|$)/i,
  /(^|\/)(sidecar-runtime|sidecar_et_runtime|sidecar-et-runtime|runtime-sidecar)(\/|$)/i,
  /(^|\/)(codex-sdk|codex_sdk|provider|providers)(\/|$)/i,
  /(^|\/)(graph-db|graph_db|persistence)(\/|$)/i,
];

const authorityGrantPatterns = [
  { label: "execute Codex", regex: /\b(?:execute|launch|run)\s+Codex\b/gi },
  {
    label: "create branches",
    regex: /\bcreate\s+(?:branches|a\s+branch|branch)\b/gi,
  },
  {
    label: "create PR",
    regex: /\bcreate\s+(?:a\s+)?(?:PR|pull request)\b/gi,
  },
  {
    label: "open PR",
    regex: /\bopen\s+(?:PRs|a\s+PR|pull requests|a\s+pull request)\b/gi,
  },
  { label: "merge authority", regex: /\b(?:merge|merge readiness)\b/gi },
  { label: "publish authority", regex: /\bpublish\b/gi },
  { label: "approval authority", regex: /\b(?:approve|approval)\b/gi },
  { label: "retry authority", regex: /\bretry\b/gi },
  { label: "replay authority", regex: /\breplay\b/gi },
  { label: "deploy authority", regex: /\bdeploy\b/gi },
  { label: "record proof", regex: /\brecord\s+proof(?:\s+records)?\b/gi },
  {
    label: "record evidence",
    regex: /\brecord\s+evidence(?:\s+records)?\b/gi,
  },
  {
    label: "proof records",
    regex: /\bcreate\s+proof\s+records\b/gi,
  },
  {
    label: "save snapshots",
    regex: /\bsave\s+snapshots?\b/gi,
  },
  {
    label: "persist graph snapshots",
    regex: /\bpersist\s+graph\s+snapshots?\b/gi,
  },
  {
    label: "persist graphs",
    regex: /\bpersist\s+graphs?\b/gi,
  },
  {
    label: "create runtime nodes",
    regex: /\bcreate\s+runtime\s+nodes?\b/gi,
  },
];

const negationPattern =
  /\b(no|not|does not|do not|did not|must not|may not|cannot|can not|should not|will not|is not|are not|never|doesn't|don't|won't)\b/i;

const textByFile = loadTextByFile(inspectedFiles);

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertSmokeScriptBoundary();
assertRequiredDocSections();
assertRequiredScenarioNames();
assertRequiredExpectations();
assertReportFields();
assertReportScenarioResultsOrSkippedPlan();
assertIndexPointer();
assertNoForbiddenPositiveAuthorityGrants();
const changedFilesBoundary = assertChangedFilesWithinAllowedSet();

const summary = {
  smoke: "project-constellation-user-intent-validation",
  pass: true,
  docs_checked: [validationDoc, indexDoc],
  report_checked: browserReport,
  package_script_checked: true,
  required_sections_checked: requiredSections.length,
  required_scenarios_checked: requiredScenarioNames.length,
  report_fields_checked: requiredReportFields.length,
  authority_classifier_self_tests_checked: true,
  forbidden_positive_authority_grants_checked: true,
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
  smoke_type: "docs-report-smoke-package-pointer-boundary-only",
  runtime_behavior_changed: false,
  ui_behavior_changed: false,
  api_route_behavior_changed: false,
  graph_db_added: false,
  persistence_added: false,
  proof_evidence_writes_added: false,
  codex_sdk_execution_added: false,
  ag_resume_behavior_changed: false,
  merge_publish_approval_authority_added: false,
};

console.log(JSON.stringify(summary, null, 2));
console.log("PASS smoke:project-constellation-user-intent-validation");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:project-constellation-user-intent-validation",
    expectedCommand:
      "node scripts/smoke-project-constellation-user-intent-validation.mjs",
  });
}

function assertSmokeScriptBoundary() {
  const script = textByFile.get(smokeFile);
  assertNoRuntimeImports({
    file: smokeFile,
    text: script,
    forbiddenImports: [
      "app/",
      "components/",
      "lib/",
      "db/",
      "migrations/",
      "fixtures/",
      "apps/augnes_apps/",
      "screenshots/",
      "@openai/codex-sdk",
    ],
  });
}

function assertRequiredDocSections() {
  const doc = textByFile.get(validationDoc);
  for (const section of requiredSections) {
    const headingPattern = new RegExp(
      `^##\\s+\\d+\\.\\s+${escapeRegExp(section)}\\s*$`,
      "m",
    );
    assert(
      headingPattern.test(doc),
      `${validationDoc} must contain required section heading: ${section}`,
    );
  }
}

function assertRequiredScenarioNames() {
  assertContainsAll(validationDoc, requiredScenarioNames, { textByFile });
  assertContainsAll(browserReport, requiredScenarioNames, { textByFile });
}

function assertRequiredExpectations() {
  assertContainsAll(validationDoc, requiredExpectations, { textByFile });
}

function assertReportFields() {
  assertContainsAll(browserReport, requiredReportFields, { textByFile });
  assertContainsAllCaseInsensitive(textByFile.get(browserReport), [
    "inspected URL",
    "skipped reason",
    "local runtime",
    "browser/computer-use",
    "authority clarity",
    "false-affordance",
    "concrete reasons",
  ], "browser/computer-use report field aliases");
}

function assertReportScenarioResultsOrSkippedPlan() {
  const report = textByFile.get(browserReport);
  assertContainsAll(report, reportResultPhrases, {
    label: "browser/computer-use report scenario results",
  });

  const normalizedReport = normalizeText(report).toLowerCase();
  const hasObservedOrPlannedStatus =
    /\b(pass|partial|fail|skipped|pending)\b/.test(normalizedReport) &&
    /\b(planned|observation|skipped reason|inspected url)\b/.test(
      normalizedReport,
    );
  assert(
    hasObservedOrPlannedStatus,
    `${browserReport} must include scenario results or planned/skipped reason`,
  );
}

function assertIndexPointer() {
  assertContainsAll(indexDoc, [
    "PROJECT_CONSTELLATION_USER_INTENT_VALIDATION_V0_1.md",
    "Project Constellation user-intent validation",
    "smoke:project-constellation-user-intent-validation",
    "2026-06-03-project-constellation-user-intent-validation.md",
    "browser/computer-use",
    "authority clarity",
    "false-affordance",
    "no UI implementation change",
    "no API route implementation",
    "no proof/evidence write",
    "no Codex SDK execution",
  ], { textByFile });
}

function assertNoForbiddenPositiveAuthorityGrants() {
  for (const file of [validationDoc, browserReport, indexDoc]) {
    const text =
      file === indexDoc
        ? extractSourceBetween(
            textByFile.get(file),
            "- `PROJECT_CONSTELLATION_USER_INTENT_VALIDATION_V0_1.md`",
            "- `scripts/smoke-boundary-common.mjs`",
          )
        : textByFile.get(file);
    assertNoForbiddenPositiveAuthorityGrant({ file, text });
  }
}

function assertAuthorityClassifierSelfTests() {
  const forbiddenSelfTests = [
    "The Project Constellation UI may execute Codex from the preview.",
    "A next action candidate may create a PR.",
    "Evidence pointers may create proof records.",
    "The validation report may approve merge readiness.",
    "The preview may persist graph snapshots.",
    "Future preview may execute Codex.",
    "Read-only checklist may create a PR.",
    "Planning placeholder may record proof records.",
    "Design-only surface may deploy.",
    "Type-only preview without approval may record evidence records.",
  ];

  for (const selfTest of forbiddenSelfTests) {
    assert.throws(
      () =>
        assertNoForbiddenPositiveAuthorityGrant({
          file: "forbidden-self-test",
          text: selfTest,
        }),
      /forbidden positive authority grant/i,
      `Authority classifier self-test should fail: ${selfTest}`,
    );
  }

  const allowedSelfTests = [
    "This validation does not implement UI behavior.",
    "No preview control may execute Codex.",
    "Evidence pointers are pointer-only.",
    "User-intent validation does not create proof records.",
    "Browser/computer-use inspection does not grant merge authority.",
  ];

  for (const selfTest of allowedSelfTests) {
    assert.doesNotThrow(
      () =>
        assertNoForbiddenPositiveAuthorityGrant({
          file: "allowed-self-test",
          text: selfTest,
        }),
      `Authority classifier self-test should pass: ${selfTest}`,
    );
  }
}

function assertNoForbiddenPositiveAuthorityGrant({ file, text }) {
  for (const { label, regex } of authorityGrantPatterns) {
    regex.lastIndex = 0;
    let match = regex.exec(text);
    while (match) {
      const before = text.slice(Math.max(0, match.index - 100), match.index);
      assert(
        negationPattern.test(before),
        `${file} contains forbidden positive authority grant (${label}): ${match[0]}`,
      );
      match = regex.exec(text);
    }
  }
}

function assertChangedFilesWithinAllowedSet() {
  const mode = getBoundarySmokeMode();
  const workingTree = collectGitDiffFiles(["diff", "--name-only", "HEAD"]);
  const baseRange = getBaseRangeChangedFiles();
  const untrackedFiles = collectUntrackedFiles();
  const files = uniqueSorted([
    ...workingTree.files,
    ...baseRange.files,
    ...untrackedFiles,
  ]);

  if (mode === "content-only") {
    return {
      mode,
      checked: false,
      skipped: true,
      skip_reason:
        "changed-file boundary skipped because AUGNES_BOUNDARY_SMOKE_MODE=content-only",
      files,
      base_ref: baseRange.base_ref,
      untracked_checked: false,
      untracked_skipped: true,
      untracked_skip_reason:
        "untracked-file boundary skipped because AUGNES_BOUNDARY_SMOKE_MODE=content-only",
      untracked_files: untrackedFiles,
    };
  }

  for (const file of files) {
    assert(
      allowedChangedFiles.has(file),
      `Unexpected changed file for Project Constellation user-intent validation: ${file}`,
    );
  }

  for (const file of files) {
    for (const pattern of forbiddenPathPatterns) {
      assert(
        !pattern.test(file),
        `Forbidden changed path for Project Constellation user-intent validation: ${file}`,
      );
    }
  }

  const checked = workingTree.checked || baseRange.checked;
  return {
    mode,
    checked,
    skipped: !checked,
    skip_reason: checked ? null : "changed-file boundary could not be checked",
    files,
    base_ref: baseRange.base_ref,
    untracked_checked: true,
    untracked_skipped: false,
    untracked_skip_reason: null,
    untracked_files: untrackedFiles,
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSourceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `Missing source marker after ${startMarker}: ${endMarker}`);
  return source.slice(start, end);
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
