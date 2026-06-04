import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertNoRuntimeImports,
  assertPackageScript,
  loadTextByFile,
  normalizeText,
  parsePackageJson,
} from "./smoke-boundary-common.mjs";

const skillFile =
  "plugins/augnes-operator/skills/augnes-capsule-handoff/SKILL.md";
const pluginJsonFile = "plugins/augnes-operator/.codex-plugin/plugin.json";
const pluginDoc = "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md";
const capsuleDoc = "docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-augnes-capsule-handoff-skill.mjs";
const pluginV2SmokeFile = "scripts/smoke-augnes-operator-plugin-v2.mjs";
const dogfoodReportFile = "docs/CAPSULE_HANDOFF_SKILL_DOGFOOD_REPORT_V0_1.md";
const dogfoodSmokeFile =
  "scripts/smoke-capsule-handoff-skill-dogfood-report.mjs";
const firstLoopCloseoutFile =
  "docs/PROJECT_CONSTELLATION_CAPSULE_HANDOFF_FIRST_LOOP_CLOSEOUT_V0_1.md";
const firstLoopCloseoutSmokeFile =
  "scripts/smoke-project-constellation-capsule-handoff-first-loop-closeout.mjs";
const usefulnessPlanFile =
  "docs/PERSPECTIVE_HANDOFF_USEFULNESS_EXPERIMENT_PLAN_V0_1.md";
const usefulnessPlanSmokeFile =
  "scripts/smoke-perspective-handoff-usefulness-experiment-plan.mjs";
const userIntentSmokeFile =
  "scripts/smoke-project-constellation-user-intent-validation.mjs";
const readonlyCloseoutSmokeFile =
  "scripts/smoke-readonly-constellation-local-only-consumer-closeout.mjs";

const inspectedFiles = [
  skillFile,
  pluginJsonFile,
  pluginDoc,
  capsuleDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  ...inspectedFiles,
  pluginV2SmokeFile,
  dogfoodReportFile,
  dogfoodSmokeFile,
  firstLoopCloseoutFile,
  firstLoopCloseoutSmokeFile,
  usefulnessPlanFile,
  usefulnessPlanSmokeFile,
  userIntentSmokeFile,
  readonlyCloseoutSmokeFile,
]);

const requiredSections = [
  "Purpose",
  "Operating Contract",
  "Intake Checklist",
  "Capsule Fields To Preserve",
  "Repo And Branch Handling",
  "Expected Vs Forbidden Changed Files",
  "Hard Constraints",
  "Required Checks",
  "Skipped Check Policy",
  "Evidence Pointers And Unresolved Tensions",
  "Browser/Computer-Use Expectations",
  "Proof-Only Closeout Expectations",
  "PR Body Requirements",
  "Final Report Requirements",
  "Dogfood Checklist Example",
  "Smoke-Only Dogfood Note",
  "Explicit Empty-Field Reporting",
  "Not-Done Classification For Final Reports",
  "Authority Boundaries",
  "Non-Goals",
];

const requiredConcepts = [
  "Perspective Capsule / Handoff Capsule",
  "repo",
  "base branch",
  "working branch suggestion",
  "expected PR title",
  "task goal",
  "context anchors",
  "expected changed files",
  "forbidden changed files",
  "hard constraints",
  "required checks",
  "skipped check policy",
  "evidence pointers",
  "unresolved tensions",
  "browser/computer-use",
  "proof-only closeout",
  "PR body requirements",
  "final report requirements",
  "blockers",
  "repo/task mismatches",
  "scope risks",
  "assumptions",
  "questions requiring user/PM judgment",
  "next suggested goal",
  "closed",
  "implementation_fix",
  "impossible_now",
  "rejected_for_current_goal",
  "rejected_for_next_session",
  "waiting_for_concrete_trigger",
  "manual_next_step",
];

const forbiddenPositiveAuthoritySelfTests = [
  "A capsule may record proof without evidence gate approval.",
  "A plugin skill may deploy without authority matrix update.",
  "A handoff may create PRs without review.",
];

const allowedBoundarySelfTests = [
  "No capsule may record proof without separate approval.",
  "No skill may deploy without authority matrix update.",
];

const textByFile = loadTextByFile(inspectedFiles);
const skill = textByFile.get(skillFile);

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertSkillFrontmatter();
assertRequiredSections();
assertRequiredConcepts();
assertSkillAuthorityBoundary();
assertPluginMetadata();
assertDocPointers();
assertSmokeScriptBoundary();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "augnes-capsule-handoff-skill",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      skill_checked: skillFile,
      plugin_json_checked: pluginJsonFile,
      docs_checked: [pluginDoc, capsuleDoc, indexDoc],
      package_script_checked: true,
      required_sections_checked: requiredSections.length,
      required_concepts_checked: requiredConcepts.length,
      instruction_only_skill_checked: true,
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
      smoke_type: "static-docs-metadata-skill-boundary-only",
      runtime_behavior_changed: false,
      github_openai_augnes_runtime_calls_added: false,
      mcp_app_tool_calls_added: false,
      proof_evidence_writes_added: false,
      branch_pr_creation_authority_added: false,
      merge_publish_authority_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:augnes-capsule-handoff-skill");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:augnes-capsule-handoff-skill",
    expectedCommand: "node scripts/smoke-augnes-capsule-handoff-skill.mjs",
  });
}

function assertSkillFrontmatter() {
  assert.match(skill, /^---\nname: augnes-capsule-handoff\n/m);
  assert.match(skill, /^description: .*Perspective Capsule \/ Handoff Capsule.*\n---/ms);
}

function assertRequiredSections() {
  for (const section of requiredSections) {
    const headingPattern = new RegExp(`^##\\s+${escapeRegExp(section)}\\s*$`, "m");
    assert(headingPattern.test(skill), `${skillFile} must contain section: ${section}`);
  }
}

function assertRequiredConcepts() {
  assertContainsAllCaseInsensitive(skill, requiredConcepts, skillFile);
  assertContainsAll(skillFile, [
    "read the full capsule or handoff packet",
    "Compare expected changed files against actual planned changes before editing.",
    "If completing the task would require forbidden changed files, stop or report a scope mismatch.",
    "Do not claim a check passed unless it actually ran and passed.",
    "This skill does not open PRs by itself.",
    "ChatGPT reviews; the user decides merge.",
    "Dogfood Checklist Example",
    "PR body requirements: include summary, files changed, task scope, authority boundary statement, validation results, skipped-check reasons, blockers/risks, assumptions, questions requiring user/PM judgment, and next suggested goal.",
    "Final report requirements: include PR number and URL when an active user-scoped task independently requests a PR to be opened, branch, commit SHA, changed files, tests run with exact results, regression result when relevant, blockers, repo/task mismatches, scope risks, assumptions, questions requiring user/PM judgment, and next suggested goal.",
    "Validation list: preserve the exact required checks from the capsule or active user task",
    "Skipped check policy: keep skipped checks explicit and tied to scope or environment.",
    "AUGNES_BOUNDARY_SMOKE_MODE=content-only",
    "content-only is diagnostic only",
    "Default scoped smoke remains the direct-edit gate.",
    "Do not make content-only the default.",
    "browser/computer-use skipped: docs/metadata/skill/smoke/package-pointer only; no UI or browser-facing behavior changed.",
    "proof-only closeout skipped: no runtime/work ID context exists, and this task must not record proof/evidence writes.",
    "runtime check skipped: no runtime behavior, API route, or provider implementation changed.",
    "Blockers: none.",
    "Repo/task mismatches: none.",
    "Questions requiring user/PM judgment: none.",
    "Not-Done Classification For Final Reports",
    "Final reports and PR bodies must classify skipped or unopened work",
    "deferred/later/나중에 must not be used as status values.",
    "This classification guidance is instruction-only.",
  ], { textByFile });
}

function assertSkillAuthorityBoundary() {
  assertContainsAll(skillFile, [
    "This skill is instruction-only workflow guidance.",
    "The skill itself does not create branches.",
    "This skill does not open PRs by itself.",
    "This skill does not grant execution authority.",
    "Capsules guide workflow discipline only.",
    "They do not override `AGENTS.md`",
  ], { textByFile });
  assertNoForbiddenPositiveClauses(skillFile, skill);
}

function assertPluginMetadata() {
  const plugin = parsePackageJson(textByFile.get(pluginJsonFile));
  assert.equal(plugin.name, "augnes-operator");
  assert.equal(plugin.skills, "./skills/");
  assert.equal(plugin.mcpServers, undefined, "plugin.json must not add MCP config");
  assert.equal(plugin.apps, undefined, "plugin.json must not add app mappings");
  assert.equal(plugin.hooks, undefined, "plugin.json must not add hooks");
  assert.equal(plugin.commands, undefined, "plugin.json must not add commands");
  const pluginText = JSON.stringify(plugin);
  assert.match(pluginText, /capsule handoff/i);
  assert.match(pluginText, /workflow/i);
  assertNoForbiddenPositiveClauses(pluginJsonFile, pluginText);
}

function assertDocPointers() {
  assertContainsAll(pluginDoc, [
    "augnes-capsule-handoff",
    skillFile,
    "Perspective Capsule / Handoff Capsule",
    "instruction-only",
    "does not create execution authority",
    "does not call GitHub",
    "does not call OpenAI",
    "does not call Augnes runtime",
    "does not call MCP/App tools",
    "does not record proof/evidence",
    "does not create branches",
    "does not open PRs",
    "Dogfood-derived v0.1 wording refinement",
    "short checklist example",
    "concrete skipped-reason examples",
    "explicit empty-field reporting guidance",
    "smoke:augnes-capsule-handoff-skill",
  ], { textByFile });

  assertContainsAll(capsuleDoc, [
    skillFile,
    "Codex Plugin consumption guidance",
    "Perspective Capsule / Handoff Capsule",
    "instruction-only workflow guidance",
    "does not create capsule runtime behavior",
    "does not call GitHub/OpenAI/Augnes runtime",
    "does not call MCP/App tools",
    "does not create proof/evidence",
  ], { textByFile });

  assertContainsAll(indexDoc, [
    skillFile,
    "instruction-only Perspective Capsule / Handoff Capsule consumption skill",
    "smoke:augnes-capsule-handoff-skill",
    "no GitHub/OpenAI/Augnes runtime calls",
    "no MCP/App tool calls",
    "no proof/evidence writes",
    "no branch/PR creation authority by itself",
    "no merge/publish/approval/retry/replay/deploy authority",
    "Dogfood-derived wording refinement",
    "smoke-only content-only diagnostic guidance",
    "explicit empty-field reporting",
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
    label: "Augnes Capsule Handoff skill smoke",
  });
  const untrackedFiles = getUntrackedFiles();
  const contentOnly = result.mode === "content-only";
  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Augnes Capsule Handoff skill smoke: ${file}`,
      );
    }
  }
  const files = [...new Set([...result.files, ...untrackedFiles])].sort();
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
    /^app\//,
    /^components\//,
    /^db\//,
    /^migrations\//,
    /^apps\/augnes_apps\//,
    /^reports\//,
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
    /(^|\/)(graph-db|graph_db|persistence)(\/|$)/i,
  ];

  for (const file of files) {
    assert(
      !forbiddenPatterns.some((pattern) => pattern.test(file)),
      `Forbidden changed file for Augnes Capsule Handoff skill smoke: ${file}`,
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

function assertAuthorityClassifierSelfTests() {
  for (const clause of forbiddenPositiveAuthoritySelfTests) {
    assert.equal(
      isForbiddenPositiveClause(clause),
      true,
      `Authority classifier must reject forbidden positive claim: ${clause}`,
    );
  }

  for (const clause of allowedBoundarySelfTests) {
    assert.equal(
      isForbiddenPositiveClause(clause),
      false,
      `Authority classifier must allow legitimate boundary wording: ${clause}`,
    );
  }
}

function isForbiddenPositiveClause(clause) {
  const forbiddenPatterns = [
    /\b(skill|capsule|handoff|plugin|codex)\b.{0,80}\b(can|may|is allowed to|is permitted to|has authority to|is authorized to)\b.{0,100}\b(create branches?|open PRs?|create PRs?|merge|publish|approve|retry|replay|deploy|record proof|record evidence|execute Codex|call GitHub|call OpenAI|call Augnes runtime|call MCP\/App tools?)\b/i,
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?)\b.{0,100}\b(runtime behavior|UI behavior|API routes?|DB schema|migrations?|MCP\/App tools?|proof\/evidence writes?|proof writes?|evidence writes?|branch creation authority|PR creation authority|merge authority|publish authority|approval authority|Codex SDK execution|provider implementation|Sites deployment authority)\b/i,
    /\b(branch creation authority|PR creation authority|merge authority|publish authority|approval authority|proof\/evidence write authority|Codex SDK execution authority|Sites deployment authority)\b/i,
    /\b(navigator\.clipboard|@openai\/codex-sdk|api\.github\.com|api\.openai\.com|fetch\s*\(|XMLHttpRequest|gh\s+(api|pr|issue|repo))\b/i,
  ];

  if (!forbiddenPatterns.some((pattern) => pattern.test(clause))) return false;
  return !isNegatedBoundary(clause);
}

function isNegatedBoundary(clause) {
  return /\b(not|no|does not|do not|must not|never|is not|are not|cannot|can't|by itself)\b/i.test(
    clause,
  );
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

function getUntrackedFiles() {
  try {
    const output = execFileSync("git", ["ls-files", "--others", "--exclude-standard"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .sort();
  } catch {
    return [];
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
