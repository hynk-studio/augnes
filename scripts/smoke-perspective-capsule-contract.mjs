import assert from "node:assert/strict";
import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertNoRuntimeImports,
  assertPackageScript,
  collectUntrackedFiles,
  getProjectConstellationBoundaryScopeProfile,
  loadTextByFile,
  normalizeText,
  uniqueSorted,
} from "./smoke-boundary-common.mjs";

const contractDoc = "docs/PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md";
const projectDoc = "docs/PROJECT_CONSTELLATION_IA_V0_1.md";
const pluginDoc = "docs/CODEX_AUGNES_OPERATOR_PLUGIN_V0_2.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const smokeFile = "scripts/smoke-perspective-capsule-contract.mjs";
const packageJsonFile = "package.json";
const verificationDoc = "docs/VERIFICATION_EVIDENCE_PACK.md";
const globalsCssFile = "app/globals.css";
const cockpitFile = "components/augnes-cockpit.tsx";
const readonlyRouteSmokeFile =
  "scripts/smoke-readonly-api-route-constellation-preview.mjs";
const cockpitRouteSmokeFile =
  "scripts/smoke-cockpit-local-only-constellation-route-preview.mjs";
const perspectiveIngestTypeFile =
  "types/perspective-ingest-constellation-preview.ts";
const perspectiveIngestChatGptFixtureFile =
  "fixtures/perspective-ingest/chatgpt-record-to-constellation.sample.v0.1.json";
const perspectiveIngestCodexFixtureFile =
  "fixtures/perspective-ingest/codex-record-to-constellation.sample.v0.1.json";
const perspectiveIngestSessionEpisodeFile =
  "lib/perspective-ingest/session-episode.ts";
const perspectiveIngestChatGptAdapterFile =
  "lib/perspective-ingest/chatgpt-record-adapter.ts";
const perspectiveIngestCodexAdapterFile =
  "lib/perspective-ingest/codex-record-adapter.ts";
const perspectiveIngestPacketBuilderFile =
  "lib/perspective-ingest/episode-to-constellation-packet.ts";
const perspectiveIngestRouteHelperFile =
  "lib/readonly-api/perspective-ingest-constellation-preview.ts";
const perspectiveIngestRouteFile =
  "app/api/augnes/read/perspective-ingest-constellation-preview/route.ts";
const perspectiveIngestDoc =
  "docs/PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_V0_1.md";
const perspectiveIngestSmokeFile =
  "scripts/smoke-perspective-ingest-constellation-preview.mjs";

const inspectedFiles = [
  contractDoc,
  projectDoc,
  pluginDoc,
  indexDoc,
  smokeFile,
  packageJsonFile,
];

const boundaryScopeProfile = getProjectConstellationBoundaryScopeProfile({
  ownedFiles: [pluginDoc, verificationDoc],
});
const allowedChangedFiles = new Set([
  ...boundaryScopeProfile.exactAllowedFiles,
  globalsCssFile,
  cockpitFile,
  readonlyRouteSmokeFile,
  cockpitRouteSmokeFile,
  perspectiveIngestTypeFile,
  perspectiveIngestChatGptFixtureFile,
  perspectiveIngestCodexFixtureFile,
  perspectiveIngestSessionEpisodeFile,
  perspectiveIngestChatGptAdapterFile,
  perspectiveIngestCodexAdapterFile,
  perspectiveIngestPacketBuilderFile,
  perspectiveIngestRouteHelperFile,
  perspectiveIngestRouteFile,
  perspectiveIngestDoc,
  perspectiveIngestSmokeFile,
]);
const textByFile = loadTextByFile(inspectedFiles);

const requiredSections = [
  "Status and Scope",
  "Purpose",
  "Existing Repo Anchors",
  "Surface Model",
  "Capsule Vocabulary",
  "Required Fields",
  "Source Surfaces",
  "Target Surfaces",
  "ChatGPT Rendering Notes",
  "Codex Handoff Packet",
  "Evidence Pointers",
  "Unresolved Tensions",
  "Boundaries and Forbidden Actions",
  "Next Action Candidates",
  "Validation and Final Report Requirements",
  "Lifecycle States",
  "Non-Authority Semantics",
  "Examples",
  "Validation and Smoke Plan",
  "Non-Goals",
];

const requiredFields = [
  "capsule_id",
  "capsule_version",
  "source_surface",
  "source_scope",
  "source_snapshot_ref",
  "source_constellation_ref",
  "formation_mode",
  "thesis",
  "selected_nodes",
  "selected_edges",
  "evidence_pointers",
  "unresolved_tensions",
  "boundaries",
  "forbidden_actions",
  "next_action_candidates",
  "target_surface",
  "chatgpt_rendering_notes",
  "codex_handoff_packet",
  "required_checks",
  "skipped_check_policy",
  "browser_computer_use_expectation",
  "proof_only_closeout_status_or_skip",
  "final_report_requirements",
  "user_pm_judgment_questions",
  "assumptions",
  "blockers_or_risks",
];

const sourceSurfaces = [
  "project_constellation",
  "whole_perspective",
  "cockpit_perspective",
  "chatgpt_app",
  "mcp_bridge",
  "codex_plugin",
  "manual_user_selection",
  "future_agent_surface",
];

const targetSurfaces = [
  "chatgpt_review",
  "codex_handoff",
  "documentation_handoff",
  "research_handoff",
  "cockpit_preview",
  "future_agent_handoff",
];

const codexHandoffPacketFields = [
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
  "browser/computer-use expectation",
  "PR body requirements",
  "final report requirements",
  "blockers/risks",
  "assumptions",
  "questions requiring user/PM judgment",
  "next suggested goal",
];

const requiredNonAuthorityPhrases = [
  "docs-only",
  "non-SSOT",
  "contract/design-only",
  "read-only",
  "non-authoritative",
  "evidence-pointer-based, not evidence-producing",
  "handoff-preview-oriented, not agent-executing",
  "no runtime schema",
  "no API route",
  "no MCP/App tool changes",
  "no plugin runtime action",
  "no graph DB",
  "no persistence",
  "no proof/evidence write",
  "no Codex task launch",
  "Evidence pointers are pointers only",
  "They do not create proof, evidence, readiness, or approval.",
  "Unresolved tensions must remain visible and must not be collapsed into support.",
  "They can block or qualify a next action candidate.",
  "Sites deployment URLs remain production deployment and are not Augnes readiness, proof, publication, approval, or merge authority.",
  "AUGNES_BOUNDARY_SMOKE_MODE=content-only",
  "Content-only mode is an explicit cross-PR regression diagnostic.",
];

const requiredForbiddenExamples = [
  "runtime behavior",
  "API route behavior",
  "DB schema/migration",
  "MCP/App tool change",
  "plugin hook",
  "plugin app mapping",
  "plugin MCP config",
  "graph DB",
  "persistence",
  "proof/evidence/readiness write",
  "QP evidence",
  "`z_t` commit",
  "Codex continuation authority",
  "Sites deployment authority",
  "approval/publish/retry/replay/merge authority",
  "external posting",
  "Direct Resume Code / relay / hosted transfer authority",
];

const lifecycleStates = [
  "draft",
  "previewed",
  "copied",
  "superseded",
  "rejected_for_scope",
  "deferred",
  "archived",
];

const requiredNonGoals = [
  "no runtime schema",
  "no DB schema",
  "no API route",
  "no MCP/App tool change",
  "no plugin runtime action",
  "no plugin hook",
  "no graph DB",
  "no persistence",
  "no UI implementation",
  "no Project Constellation runtime behavior",
  "no proof/evidence write",
  "no Codex task launch",
  "no GitHub/OpenAI/Augnes runtime/network calls",
  "no Sites deployment behavior",
  "no approval/publish/retry/replay/merge authority",
];

const forbiddenPositiveAuthoritySelfTests = [
  "A capsule may record proof without evidence gate approval.",
  "A ChatGPT capsule may execute without inference.",
  "A Perspective Capsule may launch Codex without inference.",
  "A capsule may record proof without inference.",
  "A contract may publish without review.",
  "A ChatGPT capsule may execute without approval.",
];

const allowedBoundarySelfTests = [
  "No capsule may record proof without separate approval.",
  "The surface must not execute Codex.",
];

assertAuthorityClassifierSelfTests();
assertPackageJsonScript();
assertSmokeScriptBoundary();
assertRequiredSections();
assertRequiredCapsuleFields();
assertSourceSurfaces();
assertTargetSurfaces();
assertCodexHandoffPacket();
assertNonAuthorityPhrases();
assertBoundariesAndNonGoals();
assertLifecycleStates();
assertExamples();
assertPointers();
const changedFilesBoundary = assertChangedFilesBoundary();

console.log(
  JSON.stringify(
    {
      smoke: "perspective-capsule-contract",
      pass: true,
      boundary_smoke_mode: changedFilesBoundary.mode,
      docs_checked: [contractDoc, projectDoc, pluginDoc, indexDoc],
      package_script_checked: true,
      required_sections_checked: requiredSections.length,
      required_fields_checked: requiredFields.length,
      source_surfaces_checked: sourceSurfaces.length,
      target_surfaces_checked: targetSurfaces.length,
      codex_handoff_packet_fields_checked: codexHandoffPacketFields.length,
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
      smoke_type: "contract-boundary-only",
      runtime_behavior_changed: false,
      api_route_behavior_changed: false,
      mcp_app_tool_changes_added: false,
      persistence_behavior_changed: false,
      proof_evidence_writes_added: false,
      codex_task_launch_added: false,
      graph_db_added: false,
      sites_deployment_authority_added: false,
      merge_publish_authority_added: false,
    },
    null,
    2,
  ),
);
console.log("PASS smoke:perspective-capsule-contract");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:perspective-capsule-contract",
    expectedCommand: "node scripts/smoke-perspective-capsule-contract.mjs",
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
      "reports/",
      "screenshots/",
    ],
  });
}

function assertRequiredSections() {
  const doc = textByFile.get(contractDoc);
  for (const [index, section] of requiredSections.entries()) {
    const headingPattern = new RegExp(
      `^##\\s+${index + 1}\\.\\s+${escapeRegExp(section)}\\s*$`,
      "m",
    );
    assert(headingPattern.test(doc), `${contractDoc} must contain section: ${section}`);
  }
}

function assertRequiredCapsuleFields() {
  assertContainsAll(contractDoc, requiredFields, { textByFile });
}

function assertSourceSurfaces() {
  assertContainsAll(contractDoc, sourceSurfaces, { textByFile });
}

function assertTargetSurfaces() {
  assertContainsAll(contractDoc, targetSurfaces, { textByFile });
}

function assertCodexHandoffPacket() {
  assertContainsAll(contractDoc, codexHandoffPacketFields, { textByFile });
}

function assertNonAuthorityPhrases() {
  assertContainsAll(contractDoc, requiredNonAuthorityPhrases, { textByFile });
  assertNoForbiddenPositiveClauses(contractDoc, textByFile.get(contractDoc));
}

function assertBoundariesAndNonGoals() {
  assertContainsAll(contractDoc, requiredForbiddenExamples, { textByFile });
  const nonGoals = extractNumberedSection(textByFile.get(contractDoc), "Non-Goals");
  assertContainsAll(nonGoals, requiredNonGoals, { label: `${contractDoc} Non-Goals` });
}

function assertLifecycleStates() {
  assertContainsAll(contractDoc, lifecycleStates, { textByFile });
  assertContainsAll(contractDoc, [
    "These states do not define persistence, runtime status, DB rows, API state, MCP/App tool state, plugin runtime state, proof state, evidence state, or readiness state.",
  ], { textByFile });
}

function assertExamples() {
  assertContainsAll(contractDoc, [
    "Project Constellation To Codex Docs-Only Handoff",
    "Project Constellation / Sidecar Strategy C first slice",
    "Strategy C is stopped at fixture/manifest closeout; next task should remain docs/smoke bounded.",
    "runtime `sidecar_e_t`",
    "AG Resume route/helper",
    "QP evidence",
    "`z_t` commit",
    "ChatGPT App/MCP Review To Codex Plugin Workflow",
    "ChatGPT App/MCP whole perspective review",
    "Codex Plugin skill-guided task",
    "Queue can hold after-completion follow-up",
    "Steer can correct the current scoped task",
    "`/side` can investigate scope",
    "Remote/SSH notes should preserve host provenance",
    "Sites saved versions may be demo/review artifact pointers",
  ], { textByFile });
}

function assertPointers() {
  assertContainsAll(projectDoc, [
    "PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md",
    "Detailed Perspective Capsule / Handoff Capsule contract semantics are factored",
    "Project Constellation v0.1 remains read-only, non-authoritative, evidence-pointer-based, and handoff-preview-oriented.",
  ], { textByFile });

  assertContainsAll(pluginDoc, [
    "PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md",
    "The shared Perspective Capsule / Handoff Capsule contract is defined",
    "This v0.2 plugin alignment remains docs/metadata/skill/smoke/package-pointer only",
    "does not modify plugin skill semantics",
  ], { textByFile });

  assertContainsAll(indexDoc, [
    "PERSPECTIVE_CAPSULE_CONTRACT_V0_1.md",
    "Perspective Capsule / Handoff",
    "non-SSOT",
    "docs-only",
    "read-only/non-authoritative",
    "contract/design-only",
    "smoke:perspective-capsule-contract",
    "does not add runtime schema",
    "API route",
    "MCP/App tool",
    "persistence",
    "graph DB",
    "proof/evidence write",
    "Codex task launch",
    "plugin runtime action",
  ], { textByFile });
}

function assertChangedFilesBoundary() {
  const result = assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Perspective Capsule contract boundary smoke",
  });
  const untrackedFiles = collectUntrackedFiles();
  const contentOnly = result.mode === "content-only";

  if (!contentOnly) {
    for (const file of untrackedFiles) {
      assert(
        allowedChangedFiles.has(file),
        `Unexpected untracked file for Perspective Capsule contract boundary smoke: ${file}`,
      );
    }
  }

  return {
    ...result,
    files: uniqueSorted([...result.files, ...untrackedFiles]),
    untracked_checked: !contentOnly,
    untracked_skipped: contentOnly,
    untracked_skip_reason: contentOnly
      ? "untracked-file boundary skipped because AUGNES_BOUNDARY_SMOKE_MODE=content-only"
      : null,
    untracked_files: untrackedFiles,
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
    /\b(adds?|implements?|enables?|activates?|creates?|records?|writes?(?!\s*[,/-])|calls?|runs?|executes?|launches?|routes?(?!\s+behavior)|persists?|publishes?|approves?|retries|replays|merges?|deploys?)\b.{0,100}\b(runtime behavior|runtime schema|DB schema|API route|MCP\/App writes?|MCP\/App tool changes?|plugin runtime action|graph DB|persistence|proof\/evidence writes?|proof writes?|evidence writes?|Codex execution|Codex task launch|Sites deployment authority|approval\/publish\/retry\/replay\/merge authority|merge authority|publish authority)\b/i,
    /\b(Codex|ChatGPT|MCP|plugin|capsule|contract|Sites URL|deployment URL)\b.{0,80}\b(can|may|is allowed to|is permitted to|will)\b.{0,80}\b(execute|launch|write|persist|route|merge|publish|approve|retry|replay|record proof|record evidence|commit\/reject)\b/i,
  ];

  if (!forbiddenPatterns.some((pattern) => pattern.test(clause))) return false;
  return !isNegatedBoundary(clause);
}

function isNegatedBoundary(clause) {
  return (
    /\b(not|no|does not|do not|must not|never|is not|are not|doesn't|cannot|can't|out of scope)\b/i.test(
      clause,
    )
  );
}

function extractNumberedSection(markdown, sectionName) {
  const pattern = new RegExp(
    `^##\\s+\\d+\\.\\s+${escapeRegExp(sectionName)}\\s*$`,
    "m",
  );
  const match = pattern.exec(markdown);
  assert(match, `${contractDoc} must contain section: ${sectionName}`);
  const start = match.index + match[0].length;
  const rest = markdown.slice(start);
  const nextSection = rest.search(/^##\s+\d+\.\s+/m);
  return nextSection === -1 ? rest : rest.slice(0, nextSection);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
