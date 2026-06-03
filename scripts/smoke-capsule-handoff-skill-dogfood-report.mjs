import assert from "node:assert/strict";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertNoRuntimeImports,
  assertPackageScript,
  collectUntrackedFiles,
  loadTextByFile,
  normalizeText,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const reportFile = "docs/CAPSULE_HANDOFF_SKILL_DOGFOOD_REPORT_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-capsule-handoff-skill-dogfood-report.mjs";
const capsuleHandoffSkillSmokeFile =
  "scripts/smoke-augnes-capsule-handoff-skill.mjs";

const inspectedFiles = [reportFile, indexDoc, packageJsonFile, smokeFile];
const allowedChangedFiles = new Set([
  ...inspectedFiles,
  capsuleHandoffSkillSmokeFile,
]);

const requiredSections = [
  "Status And Scope",
  "Dogfood Source",
  "Capsule/Handoff Fields Used",
  "What The Skill Helped Preserve",
  "Friction / Ambiguity Observed",
  "Validation Behavior",
  "Browser/Computer-Use Handling",
  "Proof-Only Closeout Handling",
  "Authority Boundary Observations",
  "Suggested Skill Improvements",
  "Non-Goals",
];

const requiredFields = [
  "repo",
  "base branch",
  "working branch suggestion",
  "expected PR title",
  "task goal",
  "expected changed files",
  "forbidden changed files",
  "hard constraints",
  "required checks",
  "skipped check policy",
  "evidence pointers",
  "unresolved tensions",
  "browser/computer-use expectation",
  "proof-only closeout expectation",
  "PR body requirements",
  "final report requirements",
  "blockers",
  "repo/task mismatches",
  "scope risks",
  "assumptions",
  "questions requiring user/PM judgment",
  "next suggested goal",
];

const requiredBoundaryPhrases = [
  "docs/smoke/package-pointer only",
  "does not add runtime behavior",
  "no runtime behavior",
  "no UI",
  "no API",
  "no DB",
  "no MCP/App",
  "no proof/evidence writes",
  "no AG Resume",
  "no Codex SDK execution/provider behavior",
  "no branch/PR creation authority by itself",
  "no merge/publish authority",
  "does not grant runtime behavior",
  "does not grant UI behavior",
  "does not grant API route behavior",
  "does not grant DB schema/migration behavior",
  "does not grant MCP/App tool behavior",
  "does not grant proof/evidence write authority",
  "does not grant AG Resume behavior",
  "does not grant Codex SDK execution/provider behavior",
  "does not grant branch creation authority",
  "does not grant PR creation authority by itself",
  "does not grant merge/publish/approval/retry/replay/deploy authority",
];

const textByFile = loadTextByFile(inspectedFiles);
const report = textByFile.get(reportFile);

assertPackageJsonScript();
assertReportSections();
assertReportContent();
assertIndexPointer();
assertSmokeScriptBoundary();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "capsule-handoff-skill-dogfood-report",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      report_checked: reportFile,
      index_checked: indexDoc,
      package_script_checked: true,
      required_sections_checked: requiredSections.length,
      required_fields_checked: requiredFields.length,
      authority_boundary_checked: true,
      changed_files_boundary_checked: changedFilesBoundary.checked,
      changed_files_boundary_skipped: changedFilesBoundary.skipped,
      changed_files_boundary_skip_reason: changedFilesBoundary.skip_reason,
      changed_files_checked: changedFilesBoundary.files,
      changed_files_observed: changedFilesBoundary.files,
      changed_files_base_ref: changedFilesBoundary.base_ref,
      changed_files_base_range_checked: changedFilesBoundary.base_range_checked,
      changed_files_base_range_skipped: changedFilesBoundary.base_range_skipped,
      changed_files_working_tree_checked:
        changedFilesBoundary.working_tree_checked,
      untracked_files_checked: changedFilesBoundary.untracked_checked,
      untracked_files_skipped: changedFilesBoundary.untracked_skipped,
      untracked_files_skip_reason: changedFilesBoundary.untracked_skip_reason,
      untracked_files_observed: changedFilesBoundary.untracked_files,
      smoke_type: "static-docs-smoke-package-pointer-boundary-only",
      runtime_behavior_changed: false,
      ui_behavior_changed: false,
      api_route_behavior_changed: false,
      db_schema_migration_changed: false,
      mcp_app_tool_changes_added: false,
      proof_evidence_writes_added: false,
      codex_sdk_execution_added: false,
      branch_pr_creation_authority_added: false,
      merge_publish_authority_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:capsule-handoff-skill-dogfood-report");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:capsule-handoff-skill-dogfood-report",
    expectedCommand: "node scripts/smoke-capsule-handoff-skill-dogfood-report.mjs",
  });
}

function assertReportSections() {
  for (const section of requiredSections) {
    const headingPattern = new RegExp(`^##\\s+${escapeRegExp(section)}\\s*$`, "m");
    assert(
      headingPattern.test(report),
      `${reportFile} must contain section: ${section}`,
    );
  }
}

function assertReportContent() {
  assertContainsAll(reportFile, [
    "augnes-capsule-handoff",
    "Perspective Capsule / Handoff Capsule",
    ...requiredFields,
    ...requiredBoundaryPhrases,
    "AUGNES_BOUNDARY_SMOKE_MODE=content-only",
    "changed-file allowlist enforcement is skipped",
    "untracked-file boundary enforcement is skipped",
    "forbidden changed-path enforcement is skipped",
  ], { textByFile });
  assertNoForbiddenPositiveClauses(reportFile, report);
}

function assertIndexPointer() {
  assertContainsAll(indexDoc, [
    reportFile,
    "augnes-capsule-handoff",
    "Perspective Capsule / Handoff Capsule",
    "smoke:capsule-handoff-skill-dogfood-report",
    "docs/smoke/package-pointer only",
    "no runtime behavior",
    "no UI/API/DB/MCP/App/proof/evidence/Codex SDK authority",
  ], { textByFile });
}

function assertSmokeScriptBoundary() {
  const script = textByFile.get(smokeFile);
  assertNoRuntimeImports({
    file: smokeFile,
    text: script,
    forbiddenImports: [
      "app/",
      "components/",
      "db/",
      "migrations/",
      "apps/augnes_apps/",
      "reports/",
      "screenshots/",
      "@openai/codex-sdk",
    ],
  });
}

function assertChangedFilesBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Capsule Handoff skill dogfood report smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Capsule Handoff skill dogfood report smoke: ${file}`,
      );
    }
  }

  const files = uniqueSorted([...result.files, ...untrackedFiles]);

  if (!contentOnly) {
    assertNoForbiddenChangedPaths(files);
  }

  return {
    ...result,
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
    /^components\//,
    /^app\//,
    /^db\//,
    /^migrations\//,
    /^apps\/augnes_apps\//,
    /^reports\/browser\//,
    /^screenshots\//,
    /(^|\/)(route|api)\.(js|jsx|ts|tsx)$/,
    /^plugins\/augnes-operator\/hooks\//,
    /^plugins\/augnes-operator\/(?:\.mcp\.json|mcp|mcpServers|apps|app-mappings|app_mappings)(\/|$)/,
    /(^|\/)(secret|secrets|env)(\/|$)/i,
    /(^|\/)\.env/i,
    /(^|\/)(ag-work-resume|ag_resume|ag-resume)(\/|$)/i,
    /(^|\/)(proof|evidence).*(writer|record|route|helper)/i,
    /(^|\/)(sidecar-runtime|sidecar_et_runtime|sidecar-et-runtime|runtime-sidecar)(\/|$)/i,
    /(^|\/)(codex-sdk|codex_sdk|provider|providers)(\/|$)/i,
  ];

  for (const file of files) {
    assert(
      !forbiddenPatterns.some((pattern) => pattern.test(file)),
      `Forbidden changed file for Capsule Handoff skill dogfood report smoke: ${file}`,
    );
  }
}

function assertNoForbiddenPositiveClauses(file, text) {
  const clauses = normalizeText(text)
    .split(/[.;!?]\s+/)
    .map((clause) => clause.trim())
    .filter(Boolean);

  for (const clause of clauses) {
    assert.equal(
      isForbiddenPositiveClause(clause),
      false,
      `${file} appears to grant forbidden authority or active behavior: ${clause}`,
    );
  }
}

function isForbiddenPositiveClause(clause) {
  const forbiddenPatterns = [
    /\b(skill|capsule|handoff|report|PR|Codex)\b.{0,80}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to)\b.{0,120}\b(create branches?|open PRs?|create PRs?|merge|publish|approve|retry|replay|deploy|record proof|record evidence|execute Codex|call GitHub|call OpenAI|call Augnes runtime|call MCP\/App tools?)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?)\b.{0,120}\b(runtime behavior|UI behavior|API routes?|DB schema|migrations?|MCP\/App tools?|proof\/evidence writes?|proof writes?|evidence writes?|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation)\b/i,
    /\b(branch creation authority|PR creation authority|merge authority|publish authority|approval authority|proof\/evidence write authority|Codex SDK execution authority)\b/i,
    /\b(navigator\.clipboard|@openai\/codex-sdk|api\.github\.com|api\.openai\.com|fetch\s*\(|XMLHttpRequest|gh\s+(api|pr|issue|repo))\b/i,
  ];

  if (!forbiddenPatterns.some((pattern) => pattern.test(clause))) return false;
  return !isNegatedBoundary(clause);
}

function isNegatedBoundary(clause) {
  return /\b(not|no|does not|do not|must not|without|never|is not|are not|cannot|can't|by itself)\b/i.test(
    clause,
  );
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
