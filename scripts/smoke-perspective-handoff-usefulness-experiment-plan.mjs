import assert from "node:assert/strict";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertNoRuntimeImports,
  assertPackageScript,
  assertRepoFileExists,
  collectUntrackedFiles,
  loadTextByFile,
  normalizeText,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const planDoc =
  "docs/PERSPECTIVE_HANDOFF_USEFULNESS_EXPERIMENT_PLAN_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile =
  "scripts/smoke-perspective-handoff-usefulness-experiment-plan.mjs";
const skillFile =
  "plugins/augnes-operator/skills/augnes-capsule-handoff/SKILL.md";
const skillSmokeFile = "scripts/smoke-augnes-capsule-handoff-skill.mjs";
const dogfoodSmokeFile =
  "scripts/smoke-capsule-handoff-skill-dogfood-report.mjs";
const userIntentSmokeFile =
  "scripts/smoke-project-constellation-user-intent-validation.mjs";
const closeoutSmokeFile =
  "scripts/smoke-readonly-constellation-local-only-consumer-closeout.mjs";

const inspectedFiles = [
  planDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  skillFile,
];

const allowedChangedFiles = new Set([
  planDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
  skillFile,
  skillSmokeFile,
  dogfoodSmokeFile,
  userIntentSmokeFile,
  closeoutSmokeFile,
]);

const requiredSections = [
  "Status and scope",
  "Purpose",
  "Baseline comparison",
  "Comparison scenarios",
  "Evaluation rubric",
  "Outcome labels",
  "Not-done classification rules",
  "Final report and PR body guidance",
  "Codex handoff efficiency comparison plan",
  "Decision gate",
  "Forbidden scope",
  "Static smoke and package/index pointers",
  "Browser/computer-use handling",
  "Proof-only closeout handling",
  "Non-goals",
];

const requiredScopePhrases = [
  "docs/smoke/package-pointer/skill-guidance only",
  "non-SSOT",
  "non-authoritative",
  "no runtime behavior",
  "no UI behavior",
  "no API route behavior",
  "no DB schema/migration/query",
  "no graph DB",
  "no persistence",
  "no App/MCP/ChatGPT App/tool implementation",
  "no plugin runtime hook/config/mapping",
  "no GitHub/OpenAI/Augnes runtime calls",
  "no proof/evidence/readiness writes",
  "no Codex SDK execution/provider behavior",
  "no branch/PR/merge/publish/approval/retry/replay/deploy authority by itself",
];

const requiredBaselinePhrases = [
  "Baseline A: ordinary Codex prompt from current chat/repo instructions only",
  "Baseline B: Augnes handoff prompt using Perspective/Handoff Capsule fields",
  "Optional human-review baseline: ChatGPT review with/without Perspective context",
];

const requiredRubricTerms = [
  "Context retention",
  "Handoff quality",
  "PR alignment",
  "Scope drift resistance",
  "skipped reason accuracy",
  "repo/task mismatch detection",
  "scope risk preservation",
  "unresolved tension preservation",
  "final report completeness",
  "next suggested goal quality",
  "ChatGPT review burden",
  "user merge/review judgment burden",
];

const requiredOutcomeLabels = [
  "useful",
  "partially_useful",
  "ambiguous",
  "misleading",
  "blocked",
  "needs_repair",
  "superseded",
];

const requiredNotDoneLabels = [
  "closed",
  "implementation_fix",
  "impossible_now",
  "rejected_for_current_goal",
  "rejected_for_next_session",
  "waiting_for_concrete_trigger",
  "manual_next_step",
];

const requiredForbiddenScopeTerms = [
  "no real auth implementation",
  "no ChatGPT App/MCP consumer",
  "no new route/auth/consumer planning loop",
  "no standalone boundary compression PR",
  "no route response field expansion",
  "no DB-backed Constellation model",
  "no capsule/handoff display expansion",
  "no Codex plugin runtime integration",
  "no proof/evidence writes",
  "no browser-facing UI changes",
];

const authorityGrantPatterns = [
  {
    label: "runtime or implementation grant",
    regex:
      /\b(?:adds?|implements?|enables?|activates?|creates?|records?|writes?|calls?|runs?|executes?|publishes?|approves?|retries|replays|merges?|deploys?)\b.{0,120}\b(runtime behavior|UI behavior|API routes?|route behavior|DB schema|migrations?|DB query|graph DB|persistence|MCP\/App tools?|ChatGPT App|proof\/evidence writes?|proof records?|evidence records?|Codex SDK execution|provider behavior|plugin runtime|runtime integration|real auth implementation|browser-facing UI)\b/i,
  },
  {
    label: "agent authority grant",
    regex:
      /\b(?:skill|capsule|handoff|plan|experiment|codex)\b.{0,120}\b(?:can|may|is allowed to|is permitted to|has authority to|is authorized to)\b.{0,120}\b(create branches?|open PRs?|create PRs?|merge|publish|approve|retry|replay|deploy|record proof|record evidence|execute Codex|call GitHub|call OpenAI|call Augnes runtime|call MCP\/App tools?)\b/i,
  },
  {
    label: "authority phrase",
    regex:
      /\b(branch creation authority|PR creation authority|merge authority|publish authority|approval authority|proof\/evidence write authority|Codex SDK execution authority|deploy authority)\b/i,
  },
  {
    label: "external/runtime call",
    regex:
      /\b(navigator\.clipboard|@openai\/codex-sdk|api\.github\.com|api\.openai\.com|fetch\s*\(|XMLHttpRequest|gh\s+(api|pr|issue|repo))\b/i,
  },
];

const negationPattern =
  /\b(no|not|does not|do not|must not|never|is not|are not|cannot|can't|by itself|forbidden|out of scope|skipped)\b/i;

const textByFile = loadTextByFile(inspectedFiles);
const plan = textByFile.get(planDoc);
const smokeSource = textByFile.get(smokeFile);
const skill = textByFile.get(skillFile);

assertAuthorityClassifierSelfTests();
assertPlanExists();
assertPackageJsonScript();
assertSmokeScriptBoundary();
assertRequiredSections();
assertStatusAndScope();
assertBaselines();
assertComparisonScenarios();
assertEvaluationRubric();
assertOutcomeLabels();
assertNotDoneClassification();
assertDecisionGate();
assertForbiddenScope();
assertStaticSmokeGuidance();
assertIndexPointer();
assertSkillGuidance();
assertNoForbiddenPositiveAuthorityGrants();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "perspective-handoff-usefulness-experiment-plan",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      plan_checked: planDoc,
      index_checked: indexDoc,
      package_script_checked: true,
      skill_guidance_checked: true,
      required_sections_checked: requiredSections.length,
      baseline_comparison_checked: true,
      comparison_scenarios_checked: 2,
      rubric_terms_checked: requiredRubricTerms.length,
      outcome_labels_checked: requiredOutcomeLabels.length,
      not_done_labels_checked: requiredNotDoneLabels.length,
      forbidden_scope_terms_checked: requiredForbiddenScopeTerms.length,
      content_only_diagnostic_checked: true,
      forbidden_positive_authority_grants_checked: true,
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
      smoke_type:
        "static-docs-smoke-package-pointer-skill-guidance-boundary-only",
      runtime_behavior_changed: false,
      ui_behavior_changed: false,
      api_route_behavior_changed: false,
      db_schema_migration_query_changed: false,
      graph_db_added: false,
      persistence_added: false,
      app_mcp_chatgpt_tool_implementation_added: false,
      plugin_runtime_hook_config_mapping_added: false,
      proof_evidence_readiness_writes_added: false,
      codex_sdk_execution_provider_behavior_added: false,
      branch_pr_merge_publish_approval_authority_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:perspective-handoff-usefulness-experiment-plan");

function assertPlanExists() {
  assertRepoFileExists(planDoc);
}

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:perspective-handoff-usefulness-experiment-plan",
    expectedCommand:
      "node scripts/smoke-perspective-handoff-usefulness-experiment-plan.mjs",
  });
}

function assertSmokeScriptBoundary() {
  assertNoRuntimeImports({
    file: smokeFile,
    text: smokeSource,
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

function assertRequiredSections() {
  for (const section of requiredSections) {
    const headingPattern = new RegExp(
      `^##\\s+\\d+\\.\\s+${escapeRegExp(section)}\\s*$`,
      "m",
    );
    assert(
      headingPattern.test(plan),
      `${planDoc} must contain required section heading: ${section}`,
    );
  }
}

function assertStatusAndScope() {
  assertContainsAll(planDoc, requiredScopePhrases, { textByFile });
}

function assertBaselines() {
  assertContainsAll(planDoc, requiredBaselinePhrases, { textByFile });
}

function assertComparisonScenarios() {
  assertContainsAll(planDoc, [
    "Scenario 1: docs/smoke/package-pointer task similar to prior capsule handoff dogfood",
    "Scenario 2: bounded implementation-fix or UI/read-only preview task, planned scenario only",
    "Planned-only boundary",
  ], { textByFile });

  const scenarioMatches = plan.match(/^Scenario \d+:/gm) ?? [];
  assert(
    scenarioMatches.length >= 2,
    `${planDoc} must include at least two comparison scenarios`,
  );
}

function assertEvaluationRubric() {
  assertContainsAll(planDoc, requiredRubricTerms, { textByFile });
}

function assertOutcomeLabels() {
  assertContainsAll(planDoc, requiredOutcomeLabels, { textByFile });
  assertContainsAll(planDoc, [
    "Outcome labels are review notes only, not proof, readiness, source-of-truth state, proposal score, or commit/reject input.",
    "These labels must not be used as merge readiness",
  ], { textByFile });
}

function assertNotDoneClassification() {
  assertContainsAll(planDoc, requiredNotDoneLabels, { textByFile });
  assertContainsAll(planDoc, [
    "`closed`: already completed; do not reopen without concrete defect.",
    "`implementation_fix`: concrete defect in closed work.",
    "`impossible_now`: missing concrete source/substrate/permission/info; must name the missing dependency.",
    "`rejected_for_current_goal`: possible but does not serve current goal.",
    "`rejected_for_next_session`: not supported by current experiment/usefulness trigger.",
    "`waiting_for_concrete_trigger`: do not open until named trigger occurs.",
    "`manual_next_step`: user/human dogfood or review, not repo PR initially.",
    "Do not use deferred/later/나중에 as status values.",
  ], { textByFile });
}

function assertDecisionGate() {
  assertContainsAll(planDoc, [
    "Result that leads to experiment execution PR",
    "Result that leads to skill/report template hardening",
    "Result that leads to current-state/next-action compression UX",
    "Result that still blocks DB-backed constellation, App/MCP consumer, real auth, runtime integration, route response expansion, graph UI, or capsule display expansion",
  ], { textByFile });
}

function assertForbiddenScope() {
  assertContainsAll(planDoc, requiredForbiddenScopeTerms, { textByFile });
}

function assertStaticSmokeGuidance() {
  assertContainsAll(planDoc, [
    "this plan exists",
    "required sections exist",
    "at least two comparison scenarios exist",
    "Baseline A/B comparison exists",
    "rubric terms exist",
    "outcome labels exist",
    "not-done classification terms exist",
    "forbidden deferred/later/나중에-as-status guidance exists",
    "required forbidden scope terms exist",
    "docs index pointer exists",
    "package script pointer exists",
    "if the skill is updated, it remains instruction-only and has no runtime/authority grants",
    "scoped changed-file allowlist is narrow",
    "content-only mode remains diagnostic only",
    "no forbidden positive authority phrases are introduced",
    "AUGNES_BOUNDARY_SMOKE_MODE=content-only",
    "Default scoped smoke remains the direct-edit gate.",
    "browser/computer-use skipped: docs/smoke/package-pointer/skill-guidance only; no UI, browser-facing files, routes, interactive behavior, visual layout, or user workflow behavior changed.",
    "proof-only closeout skipped: no runtime/work ID context exists for this docs/smoke/package-pointer/skill-guidance PR, and this PR must not record proof/evidence writes.",
  ], { textByFile });
}

function assertIndexPointer() {
  assertContainsAll(indexDoc, [
    planDoc,
    "Perspective handoff usefulness experiment plan",
    "smoke:perspective-handoff-usefulness-experiment-plan",
    "docs/smoke/package-pointer/skill-guidance only",
    "non-SSOT",
    "non-authoritative",
    "not-done classification",
    "no runtime behavior",
    "no UI/API/DB/MCP/App/proof/evidence/Codex SDK authority",
  ], { textByFile });
}

function assertSkillGuidance() {
  assertContainsAll(skillFile, [
    "This skill is instruction-only workflow guidance.",
    "## Not-Done Classification For Final Reports",
    "Final reports and PR bodies must classify skipped or unopened work",
    "closed",
    "implementation_fix",
    "impossible_now",
    "rejected_for_current_goal",
    "rejected_for_next_session",
    "waiting_for_concrete_trigger",
    "manual_next_step",
    "deferred/later/나중에 must not be used as status values",
    "This skill does not grant execution authority.",
    "does not call GitHub",
    "call OpenAI",
    "call Augnes runtime",
    "call MCP/App tools",
    "record proof",
    "record evidence",
    "execute Codex SDK calls",
    "provider implementation",
    "branch creation authority",
    "PR creation authority by itself",
    "merge, publish, approval, retry, replay, deploy",
  ], { textByFile });
}

function assertNoForbiddenPositiveAuthorityGrants() {
  const indexSlice = extractSourceBetween(
    textByFile.get(indexDoc),
    "- `docs/PERSPECTIVE_HANDOFF_USEFULNESS_EXPERIMENT_PLAN_V0_1.md`",
    "- `scripts/smoke-boundary-common.mjs`",
  );
  const scopedTexts = [
    { file: planDoc, text: plan },
    { file: `${indexDoc} perspective handoff pointer`, text: indexSlice },
    { file: skillFile, text: skill },
  ];

  for (const { file, text } of scopedTexts) {
    assertNoForbiddenPositiveAuthorityGrant({ file, text });
  }
}

function assertChangedFilesBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Perspective handoff usefulness experiment plan smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Perspective handoff usefulness experiment plan smoke: ${file}`,
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
      `Forbidden changed file for Perspective handoff usefulness experiment plan smoke: ${file}`,
    );
  }
}

function assertAuthorityClassifierSelfTests() {
  const forbiddenSelfTests = [
    "The plan may implement runtime behavior.",
    "The handoff may create PRs without review.",
    "The experiment plan may record proof records.",
    "The skill may call OpenAI during final reporting.",
    "The plan may deploy after review.",
    "The plan enables graph DB persistence.",
    "This plan does not implement UI behavior, but the plan may record proof records.",
    "No runtime behavior is added, but the handoff may create PRs without review.",
    "This skill does not call OpenAI, but Codex may deploy after review.",
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
    "This plan does not implement runtime behavior.",
    "No handoff may create PRs without review.",
    "This skill does not call OpenAI.",
    "Proof-only closeout is skipped because this task must not record proof.",
    "The experiment execution PR requires explicit user scope.",
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
  const clauses = normalizeText(text)
    .split(/[.;!?]\s+/)
    .map((clause) => clause.trim())
    .filter(Boolean);

  for (const clause of clauses) {
    for (const { label, regex } of authorityGrantPatterns) {
      const matcher = toGlobalRegex(regex);
      let match = matcher.exec(clause);
      while (match) {
        assert(
          isNegatedBoundaryForMatch({ clause, matchIndex: match.index }),
          `${file} contains forbidden positive authority grant (${label}): ${clause}`,
        );
        match = matcher.exec(clause);
      }
    }
  }
}

function toGlobalRegex(regex) {
  const flags = regex.flags.includes("g") ? regex.flags : `${regex.flags}g`;
  return new RegExp(regex.source, flags);
}

function isNegatedBoundaryForMatch({ clause, matchIndex }) {
  const beforeMatch = clause.slice(0, matchIndex);
  const governingContext = beforeMatch.slice(
    findLastContrastMarkerEnd(beforeMatch),
  );
  return negationPattern.test(governingContext);
}

function findLastContrastMarkerEnd(text) {
  let markerEnd = 0;
  const contrastPattern = /\b(but|however|yet|although|though|except)\b/gi;
  let match = contrastPattern.exec(text);
  while (match) {
    markerEnd = match.index + match[0].length;
    match = contrastPattern.exec(text);
  }
  return markerEnd;
}

function extractSourceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `Missing source marker after ${startMarker}: ${endMarker}`);
  return source.slice(start, end);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
