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

const pluginJsonFile = "plugins/augnes-operator/.codex-plugin/plugin.json";
const skillFile =
  "plugins/augnes-operator/skills/augnes-codex-surface-ops/SKILL.md";
const capsuleHandoffSkillFile =
  "plugins/augnes-operator/skills/augnes-capsule-handoff/SKILL.md";
const docFile = "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md";
const capsuleDocFile = "docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md";
const indexFile = "docs/00_INDEX_LATEST.md";
const smokeFile = "scripts/smoke-augnes-operator-plugin-v2.mjs";
const capsuleHandoffSmokeFile =
  "scripts/smoke-augnes-capsule-handoff-skill.mjs";
const capsuleHandoffDogfoodReportFile =
  "docs/CAPSULE_HANDOFF_SKILL_DOGFOOD_REPORT_V0_1.md";
const capsuleHandoffDogfoodSmokeFile =
  "scripts/smoke-capsule-handoff-skill-dogfood-report.mjs";
const packageJsonFile = "package.json";

const inspectedFiles = [
  pluginJsonFile,
  skillFile,
  docFile,
  indexFile,
  smokeFile,
  packageJsonFile,
];

const allowedChangedFiles = new Set(inspectedFiles);
allowedChangedFiles.add(capsuleHandoffSkillFile);
allowedChangedFiles.add(capsuleDocFile);
allowedChangedFiles.add(capsuleHandoffSmokeFile);
allowedChangedFiles.add(capsuleHandoffDogfoodReportFile);
allowedChangedFiles.add(capsuleHandoffDogfoodSmokeFile);
const textByFile = loadTextByFile(inspectedFiles);

assertPackageJsonScript();
assertPluginMetadataBoundary();
assertSkillBoundary();
assertDocBoundary();
assertIndexPointer();
assertSmokeScriptBoundary();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "augnes-operator-plugin-v2",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      plugin_json_local_metadata_only: true,
      plugin_v2_alignment_checked: true,
      instruction_only_skill_checked: true,
      docs_checked: [docFile, indexFile],
      package_script_checked: true,
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
      smoke_type: "static-docs-metadata-skill-boundary-only",
      runtime_behavior_changed: false,
      network_calls_added: false,
      mcp_app_tool_changes_added: false,
      proof_evidence_writes_added: false,
      merge_publish_authority_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:augnes-operator-plugin-v2");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:augnes-operator-plugin-v2",
    expectedCommand: "node scripts/smoke-augnes-operator-plugin-v2.mjs",
  });
}

function assertPluginMetadataBoundary() {
  const plugin = parsePackageJson(textByFile.get(pluginJsonFile));
  assert.equal(plugin.name, "augnes-operator");
  assert.equal(plugin.version, "0.2.0");
  assert.equal(plugin.skills, "./skills/");
  assert.equal(plugin.mcpServers, undefined, "plugin.json must not add MCP config");
  assert.equal(plugin.apps, undefined, "plugin.json must not add app mappings");
  assert.equal(plugin.hooks, undefined, "v0.2 alignment must not add hooks");
  assert.equal(plugin.commands, undefined, "plugin.json must not add commands");
  assert.equal(plugin.description.includes("v0.2"), true);
  assert.match(plugin.description, /adjacent ChatGPT Apps and Codex Plugin/i);
  assert.match(plugin.description, /authority boundaries/i);
  assert.match(
    plugin.interface?.longDescription ?? "",
    /does not add hooks, MCP config, app mappings, runtime calls, GitHub calls, OpenAI calls, network calls, or secrets/i,
  );
  assertNoForbiddenPositiveClauses(pluginJsonFile, JSON.stringify(plugin));
}

function assertSkillBoundary() {
  const skill = textByFile.get(skillFile);
  assert.match(skill, /^---\nname: augnes-codex-surface-ops\n/m);
  assert.match(skill, /^description: .*surface operations.*\n---/ms);

  assertContainsAll(skillFile, [
    "This skill is instruction-only.",
    "Queue is for after-completion follow-up, verification, closeout, or next-task handling.",
    "Steer is bounded correction inside the current scoped task.",
    "`/side` is for investigation, scope review, error diagnosis, explanation, or status recap. It is not main task mutation.",
    "Remote and SSH work must preserve execution provenance.",
    "execution host or remote project identity",
    "approval context used for remote actions",
    "skipped reason for unavailable remote context",
    "verification path used on that host",
    "Sites saved versions may be demo or review artifact pointers.",
    "Sites deployment URLs are production deployment and are not Augnes readiness, proof, publication, approval, or merge authority.",
    "diff/review",
    "Mobile, Lock, And Security",
    "Every skipped check or skipped surface must include a concrete reason.",
    "final reports and PR bodies should include",
    "ChatGPT reviews; the user decides merge.",
  ], { textByFile });

  assertNoForbiddenPositiveClauses(skillFile, skill);
}

function assertDocBoundary() {
  const doc = textByFile.get(docFile);
  assertContainsAll(docFile, [
    "ChatGPT Apps and Codex Plugins as adjacent OpenAI extension surfaces, not a single confirmed product surface",
    "shared-substrate framing is strategic positioning for Augnes planning and review; it is not repo authority",
    "ChatGPT App / MCP user-facing review and Project Constellation surface",
    "Codex Plugin / Skills repo-facing workflow guidance surface",
    "The common exchange unit should be the Perspective Capsule / Handoff Capsule.",
    "Queue is after-completion follow-up, verification, closeout, or next-task handling.",
    "Steer is bounded correction inside the current scoped task.",
    "`/side` is investigation, scope review, error diagnosis, explanation, or status recap, not main task mutation.",
    "Remote/SSH work must preserve execution host provenance, approval context, skipped reason, and verification path.",
    "Sites saved versions may be demo or review artifact pointers.",
    "Sites deployment URLs are production deployment and are not Augnes readiness, proof, publication, approval, or merge authority.",
    "Codex codes, verifies, reports, and opens PRs.",
    "ChatGPT reviews PRs and review feedback.",
    "The user decides whether and when to merge.",
    "docs/metadata/skill/smoke/package-pointer only",
    "Browser/computer-use may be skipped because this PR is docs/metadata/skill/smoke/package-pointer only",
    "Proof-only closeout may be skipped for this PR when no runtime/work ID context is available.",
  ], { textByFile });

  assertContainsAll(docFile, [
    "https://developers.openai.com/apps-sdk",
    "https://developers.openai.com/codex/plugins",
    "https://developers.openai.com/codex/skills",
    "https://developers.openai.com/codex/remote-connections",
    "https://developers.openai.com/codex/sites",
    "https://developers.openai.com/codex/prompting",
  ], { textByFile });

  assertNoForbiddenPositiveClauses(docFile, doc);
}

function assertIndexPointer() {
  assertContainsAll(indexFile, [
    "CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md",
    "Augnes Operator Codex plugin v0.2",
    "docs/metadata/skill/smoke/package-pointer",
    "ChatGPT Apps and Codex Plugins are adjacent OpenAI extension surfaces",
    "Perspective Capsule / Handoff Capsule",
    "smoke:augnes-operator-plugin-v2",
    "does not add runtime behavior",
    "does not add MCP/App tool changes",
    "does not add proof/evidence writes",
    "does not add merge/publish authority",
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
      "lib/",
      "db/",
      "migrations/",
      "fixtures/",
      "apps/augnes_apps/",
      "reports/",
      "screenshots/",
    ],
  });
}

function assertChangedFilesBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Augnes Operator plugin v0.2 boundary smoke",
  });
  const untrackedFiles = getUntrackedFiles();
  const contentOnly = result.mode === "content-only";
  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Augnes Operator plugin v0.2 boundary smoke: ${file}`,
      );
    }
  }
  return {
    ...result,
    files: [...new Set([...result.files, ...untrackedFiles])].sort(),
    untracked_checked: !contentOnly,
    untracked_skipped: contentOnly,
    untracked_skip_reason: contentOnly
      ? "untracked-file boundary skipped because AUGNES_BOUNDARY_SMOKE_MODE=content-only"
      : null,
  };
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
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?)\b.{0,80}\b(runtime behavior|network calls?|GitHub calls?|OpenAI calls?|Augnes runtime calls?|MCP\/App tool changes?|MCP\/App writes?|proof\/evidence writes?|proof writes?|evidence writes?|Sites deployment behavior|merge authority|publish authority|publication authority|approval authority|commit\/reject authority|Project Constellation UI\/runtime behavior)\b/i,
    /\b(Codex|ChatGPT|plugin|skill|Sites URL|deployment URL)\b.{0,80}\b(can|may|is allowed to|is permitted to)\b.{0,80}\b(merge|publish|approve|retry|replay|record proof|record evidence|commit\/reject)\b/i,
    /\bproduction deployment\b.{0,80}\b(Augnes readiness|proof|publication|approval|merge authority)\b/i,
  ];

  if (!forbiddenPatterns.some((pattern) => pattern.test(clause))) return false;
  return !isNegatedBoundary(clause);
}

function isNegatedBoundary(clause) {
  return /\b(not|no|does not|do not|must not|without|never|is not|are not|doesn't|cannot|can't|out of scope)\b/i.test(
    clause,
  );
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
