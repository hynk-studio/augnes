import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertNoRuntimeImports,
  assertPackageScript,
  loadTextByFile,
  normalizeText,
} from "./smoke-boundary-common.mjs";

const designDoc = "docs/CODEX_SDK_EXECUTION_AUTHORITY_DESIGN_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-codex-sdk-execution-authority-design.mjs";

const inspectedFiles = [designDoc, indexDoc, packageJsonFile, smokeFile];
const allowedChangedFiles = new Set(inspectedFiles);
const textByFile = loadTextByFile(inspectedFiles);

const requiredSections = [
  "Status and Scope",
  "Purpose",
  "External Reference Boundary",
  "Official Codex SDK Concepts",
  "Augnes Interpretation",
  "User Agency and Responsibility Principle",
  "Permission Profile Mapping",
  "Turn-Level Permission Model",
  "Escalation Flow",
  "Execution Record Vocabulary",
  "Evidence Pointer Semantics",
  "AG Resume Relationship",
  "Project Constellation Relationship",
  "Perspective Capsule Relationship",
  "Proposed Future Type Boundary",
  "Proposed Future Provider Boundary",
  "Mock-to-Real Roadmap",
  "Validation and Smoke Plan",
  "Non-Goals",
];

const officialConcepts = [
  "Codex SDK",
  "thread",
  "run",
  "resume",
  "Sandbox.read_only",
  "Sandbox.workspace_write",
  "Sandbox.full_access",
  ":read-only",
  ":workspace",
  ":danger-full-access",
];

const augnesPermissionConcepts = [
  "read_only",
  "workspace_write",
  "network_limited",
  "full_access",
  "danger_full_access",
];

const userAgencyPhrases = [
  "user responsibility",
  "explicit approval",
  "no silent denial",
  "record and gate",
  "repo policy",
  "managed policy",
  "unavailable capability",
  "explicit forbidden scope",
  "User approval is necessary",
  "not the same as proof",
];

const executionRecordVocabulary = [
  "intent",
  "scope",
  "permission profile",
  "requested capability",
  "risk note",
  "rollback or reversibility note",
  "user approval record",
  "run/thread reference",
  "result summary",
  "changed files",
  "tests/checks",
  "evidence pointers",
  "next action candidates",
];

const relationshipPhrases = [
  "Future AG Resume records may refer to Codex thread IDs, last run state, interruption reason, next resume candidate, permission escalation need, and related evidence pointers.",
  "This PR does not update AG Resume schema, writer behavior, helper behavior, route behavior",
  "Future Project Constellation nodes may reference Codex execution records, PRs, permission history, user approval event, execution status, and next suggested action.",
  "This PR does not add Project Constellation runtime behavior, persistence, graph DB, graph engine, node creation, route behavior, or UI behavior.",
  "A Perspective Capsule may later carry Codex execution intent into a Handoff Capsule",
  "This PR does not launch Codex tasks",
];

const futureTypeNames = [
  "CodexExecutionIntent",
  "CodexPermissionProfile",
  "CodexExecutionRequest",
  "CodexExecutionResult",
  "CodexUserApprovalRecord",
  "CodexEvidenceLink",
  "CodexExecutionProvider",
];

const futureProviderNames = [
  "CodexExecutionProvider",
  "MockCodexExecutionProvider",
  "RealCodexSdkExecutionProvider",
  "createCodexExecutionRequest",
  "recordCodexExecutionResult",
];

const roadmapPhases = [
  "Phase 1: docs/smoke execution authority design",
  "Phase 2: type-only boundary",
  "Phase 3: mock execution record flow",
  "Phase 4: real SDK invocation behind explicit flag",
  "Phase 5: Project Constellation / AG Resume read-only display",
  "Phase 6: user-configurable authority profiles with explicit approval ledger",
];

const requiredNonGoals = [
  "no live Codex SDK call",
  "no @openai/codex-sdk import",
  "no TypeScript execution types",
  "no provider implementation",
  "no API route",
  "no DB schema or migration",
  "no MCP/App tool change",
  "no plugin runtime action",
  "no hooks",
  "no credentials/auth/env changes",
  "no background daemon",
  "no full_access default",
  "no danger_full_access default",
  "no proof/evidence/readiness writes",
  "no AG Resume writer/helper/route changes",
  "no Project Constellation runtime/UI behavior",
  "no Perspective Capsule runtime behavior",
  "no Codex task launch",
  "no GitHub/OpenAI/Augnes runtime/network calls",
  "no approval/publish/retry/replay/merge authority",
];

assertPackageJsonScript();
assertSmokeScriptBoundary();
assertRequiredSections();
assertOfficialReferences();
assertOfficialConcepts();
assertAugnesInterpretation();
assertUserAgency();
assertPermissionMapping();
assertExecutionRecordVocabulary();
assertRelationships();
assertFutureBoundaries();
assertRoadmap();
assertValidationPlan();
assertNonGoals();
assertIndexPointer();
assertNoLiveRuntimeCallText();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "codex-sdk-execution-authority-design",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      docs_checked: [designDoc, indexDoc],
      package_script_checked: true,
      required_sections_checked: requiredSections.length,
      official_concepts_checked: officialConcepts.length,
      augnes_permission_concepts_checked: augnesPermissionConcepts.length,
      execution_record_vocabulary_checked: executionRecordVocabulary.length,
      future_type_names_checked: futureTypeNames.length,
      future_provider_names_checked: futureProviderNames.length,
      non_goals_checked: requiredNonGoals.length,
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
      smoke_type: "documentation-boundary-only",
      runtime_behavior_changed: false,
      codex_sdk_import_added: false,
      codex_sdk_call_added: false,
      provider_implementation_added: false,
      api_route_behavior_changed: false,
      db_schema_migration_added: false,
      mcp_app_tool_changes_added: false,
      proof_evidence_writes_added: false,
      ag_resume_behavior_changed: false,
      project_constellation_runtime_changed: false,
      merge_publish_authority_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:codex-sdk-execution-authority-design");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:codex-sdk-execution-authority-design",
    expectedCommand: "node scripts/smoke-codex-sdk-execution-authority-design.mjs",
  });
}

function assertSmokeScriptBoundary() {
  const script = textByFile.get(smokeFile);
  assertNoRuntimeImports({
    file: smokeFile,
    text: script,
    forbiddenImports: [
      "@openai/codex-sdk",
      "openai_codex",
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

function assertRequiredSections() {
  const doc = textByFile.get(designDoc);
  for (const [index, section] of requiredSections.entries()) {
    const headingPattern = new RegExp(
      `^##\\s+${index + 1}\\.\\s+${escapeRegExp(section)}\\s*$`,
      "m",
    );
    assert(
      headingPattern.test(doc),
      `${designDoc} must contain required section: ${section}`,
    );
  }
}

function assertOfficialReferences() {
  assertContainsAll(designDoc, [
    "https://developers.openai.com/codex/sdk",
    "https://developers.openai.com/codex/permissions",
    "https://developers.openai.com/codex/concepts/sandboxing",
    "https://developers.openai.com/codex/agent-approvals-security",
    "external references, not repo authority",
  ], { textByFile });
}

function assertOfficialConcepts() {
  assertContainsAll(designDoc, officialConcepts, { textByFile });
  assertContainsAll(designDoc, [
    "programmatically control local Codex agents",
    "starting a thread",
    "running prompts on that thread",
    "resuming a past thread by thread ID",
    "Sandbox and approval controls are separate",
  ], { textByFile });
}

function assertAugnesInterpretation() {
  assertContainsAll(designDoc, [
    "SDK thread/run/resume maps conceptually to future execution records",
    "not to runtime authority in this PR",
    "does not create, store, launch, resume, or replay any thread or run",
  ], { textByFile });
}

function assertUserAgency() {
  assertContainsAll(designDoc, userAgencyPhrases, { textByFile });
  assertContainsAll(designDoc, [
    "explicit user-responsibility escalation states, not defaults",
    "Approval gates execution; it does not grant proof/evidence/readiness/merge authority.",
  ], { textByFile });
}

function assertPermissionMapping() {
  assertContainsAll(designDoc, augnesPermissionConcepts, { textByFile });
  assertContainsAll(designDoc, [
    "planning/review: `read_only`",
    "implementation/tests: `workspace_write`",
    "dependency/network work: `network_limited` with explicit approval",
    "outside-workspace or full local access: `full_access` / `danger_full_access` with explicit approval",
    "Official terminology differs from Augnes terminology.",
  ], { textByFile });
}

function assertExecutionRecordVocabulary() {
  assertContainsAll(designDoc, executionRecordVocabulary, { textByFile });
}

function assertRelationships() {
  assertContainsAll(designDoc, relationshipPhrases, { textByFile });
}

function assertFutureBoundaries() {
  assertContainsAll(designDoc, futureTypeNames, { textByFile });
  assertContainsAll(designDoc, futureProviderNames, { textByFile });
  assertContainsAll(designDoc, [
    "These are proposed future names only.",
    "These are future concepts only and are not implemented in this PR.",
    "does not create TypeScript files",
    "does not add TypeScript execution types",
  ], { textByFile });
}

function assertRoadmap() {
  assertContainsAll(designDoc, roadmapPhases, { textByFile });
}

function assertValidationPlan() {
  assertContainsAll(designDoc, [
    "npm run typecheck",
    "npm run smoke:codex-sdk-execution-authority-design",
    "git diff --check",
    "git diff --cached --check",
    "AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:project-constellation-ia-boundaries",
    "AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:augnes-operator-plugin-v2",
    "AUGNES_BOUNDARY_SMOKE_MODE=content-only npm run smoke:perspective-capsule-contract",
    "deterministic static read smoke",
    "no network calls",
    "no DB access",
    "no runtime imports",
    "no Codex SDK import",
    "Browser/computer-use may be skipped because this PR is docs/smoke/package-pointer only",
  ], { textByFile });
}

function assertNonGoals() {
  const nonGoals = extractNumberedSection(textByFile.get(designDoc), "Non-Goals");
  assertContainsAll(nonGoals, requiredNonGoals, {
    label: `${designDoc} Non-Goals`,
  });
}

function assertIndexPointer() {
  assertContainsAll(indexDoc, [
    "CODEX_SDK_EXECUTION_AUTHORITY_DESIGN_V0_1.md",
    "docs/smoke/package-pointer only",
    "non-SSOT",
    "design-only",
    "no live SDK call",
    "no SDK import",
    "no runtime execution",
    "no credentials/auth/env changes",
    "no proof/evidence writes",
    "no AG Resume writer/helper/route changes",
    "no Project Constellation runtime/UI behavior",
    "smoke:codex-sdk-execution-authority-design",
  ], { textByFile });
}

function assertNoLiveRuntimeCallText() {
  const codeLikePatterns = [
    /\bfrom\s+["']@openai\/codex-sdk["']/,
    /\bimport\s+.*["']@openai\/codex-sdk["']/,
    /\brequire\(["']@openai\/codex-sdk["']\)/,
    /\bnew\s+Codex\s*\(/,
    /\.startThread\s*\(/,
    /\.resumeThread\s*\(/,
    /\.thread_start\s*\(/,
    /\.run\s*\(\s*["'`]/,
  ];
  const files = [designDoc, indexDoc, packageJsonFile];
  for (const file of files) {
    const text = textByFile.get(file);
    for (const pattern of codeLikePatterns) {
      assert(
        !pattern.test(text),
        `${file} appears to add a live Codex SDK call or import: ${pattern}`,
      );
    }
  }
}

function assertChangedFilesBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Codex SDK execution authority design smoke",
  });
  const untrackedFiles = getUntrackedFiles();
  const contentOnly = result.mode === "content-only";
  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Codex SDK execution authority design smoke: ${file}`,
      );
    }
  }

  const allFiles = [...new Set([...result.files, ...untrackedFiles])].sort();
  if (!contentOnly) {
    assertNoForbiddenChangedPaths(allFiles);
    assertNoTypescriptFilesAdded(allFiles);
  }

  return {
    ...result,
    files: allFiles,
    untracked_checked: !contentOnly,
    untracked_skipped: contentOnly,
    untracked_skip_reason: contentOnly
      ? "untracked-file boundary skipped because AUGNES_BOUNDARY_SMOKE_MODE=content-only"
      : null,
  };
}

function assertNoForbiddenChangedPaths(files) {
  const forbiddenPatterns = [
    /^AGENTS\.md$/,
    /^app\//,
    /^components\//,
    /^lib\//,
    /^db\//,
    /^migrations\//,
    /^apps\/augnes_apps\//,
    /^fixtures\//,
    /^reports\//,
    /^screenshots\//,
    /(^|\/)(route|api)\.(js|jsx|ts|tsx)$/,
    /(^|\/)mcp/i,
    /(^|\/)hook/i,
    /(^|\/)\.env/,
  ];
  for (const file of files) {
    assert(
      !forbiddenPatterns.some((pattern) => pattern.test(file)),
      `Forbidden changed file for Codex SDK execution authority design smoke: ${file}`,
    );
  }
}

function assertNoTypescriptFilesAdded(files) {
  for (const file of files) {
    assert(
      !/\.(ts|tsx)$/.test(file),
      `This PR must not add TypeScript execution types or runtime files: ${file}`,
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

function extractNumberedSection(markdown, sectionName) {
  const pattern = new RegExp(
    `^##\\s+\\d+\\.\\s+${escapeRegExp(sectionName)}\\s*$`,
    "m",
  );
  const match = pattern.exec(markdown);
  assert(match, `${designDoc} must contain section: ${sectionName}`);
  const start = match.index + match[0].length;
  const rest = markdown.slice(start);
  const nextSection = rest.search(/^##\s+\d+\.\s+/m);
  return nextSection === -1 ? rest : rest.slice(0, nextSection);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
