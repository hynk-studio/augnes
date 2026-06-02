import assert from "node:assert/strict";
import {
  assertChangedFilesWithin,
  assertContainsAll as assertTextContainsAll,
  assertNoRuntimeImports,
  assertPackageScript as assertPackageJsonScript,
  loadTextByFile,
  normalizeText,
} from "./smoke-boundary-common.mjs";

const projectDoc = "docs/PROJECT_CONSTELLATION_IA_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const verificationDoc = "docs/VERIFICATION_EVIDENCE_PACK.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-project-constellation-ia-boundaries.mjs";

const inspectedFiles = [
  projectDoc,
  indexDoc,
  verificationDoc,
  packageJsonFile,
  smokeFile,
];

const allowedChangedFiles = new Set([
  packageJsonFile,
  smokeFile,
  projectDoc,
  indexDoc,
  verificationDoc,
]);

const requiredSections = [
  "Status and Scope",
  "Product Goal",
  "User-Facing Metaphor",
  "Existing Repo Anchors",
  "Core Objects",
  "Node Types",
  "Edge Types",
  "Formation Modes",
  "Whole Perspective Call",
  "Natural Language Request Surfaces",
  "Manual Gravity",
  "Perspective Lock / Snapshot",
  "Rollback / Diff / Fork Semantics",
  "Perspective Capsule",
  "Agent Handoff Adapters",
  "Initial Use Case: Sidecar e_t Strategy C First Slice",
  "ChatGPT Apps / MCP Surface Expectations",
  "Codex Handoff Expectations",
  "UI/UX Constraints",
  "Future Cockpit Panel Sketch",
  "Validation and Smoke Plan",
  "Non-Goals",
];

const requiredConcepts = [
  "Global Auto Constellation",
  "Keyword Constellation",
  "Work-Unit Constellation",
  "Manual Constellation",
  "Hybrid Constellation",
  "Whole Perspective Call",
  "PerspectiveRequest",
  "Manual Gravity",
  "PerspectiveSnapshot",
  "Perspective Capsule",
  "Agent Handoff Adapter",
  "Evidence Rays",
  "Tension Lines",
  "Next Move Beacon",
  "Sidecar e_t Strategy C first slice",
  "AG Resume isolation constraint",
];

const requiredBoundaryPhrases = [
  "docs-only",
  "non-SSOT",
  "read-only",
  "non-authoritative",
  "evidence-pointer-based, not evidence-producing",
  "perspective-assistive, not action-granting",
  "agent-handoff-preview-oriented, not agent-executing",
  "no runtime, UI, schema, route, storage, or graph-engine implementation",
  "may not become source of truth",
  "may not create evidence or proof",
  "may not approve, publish, retry, replay, merge, commit/reject, mutate state, mutate external systems, route agents, or continue Codex work",
  "may not depend on AG Resume proof/evidence recording behavior",
];

const requiredNonGoals = [
  "runtime code",
  "UI components",
  "graph engine",
  "graph database",
  "API routes",
  "DB schema or migrations",
  "package scripts",
  "fixtures",
  "smokes",
  "Cockpit action behavior",
  "Codex execution behavior",
  "ChatGPT Apps/MCP tool changes",
  "persistence",
  "save/rollback buttons",
  "automatic agent routing",
  "external calls",
  "report/compare/suite/matrix behavior",
  "runtime Sidecar e_t computation",
  "helper import",
  "proof/evidence/readiness writes",
  "QP evidence",
  ["z_t commit", "`z_t` commit"],
  "CI enforcement",
  "approval/publish/retry/replay/merge authority",
  "Codex continuation authority",
  "hosted transfer, relay, or direct resume authority",
];

const textByFile = loadTextByFile(inspectedFiles);

assertPackageScript();
assertSmokeScriptBoundary();
assertRequiredSections();
assertRequiredConcepts();
assertRequiredBoundaries();
assertRequiredNonGoals();
assertSnapshotSemanticsAreConceptualOnly();
assertIndexPointerBoundary();
assertVerificationPointerBoundary();
const changedFilesBoundary = assertChangedFilesBoundary();

const summary = {
  smoke: "project-constellation-ia-boundaries",
  pass: true,
  docs_checked: [projectDoc, indexDoc, verificationDoc],
  package_script_checked: true,
  required_sections_checked: requiredSections.length,
  required_concepts_checked: requiredConcepts.length,
  required_boundary_phrases_checked: requiredBoundaryPhrases.length,
  required_non_goals_checked: requiredNonGoals.length,
  snapshot_semantics_conceptual_only: true,
  index_pointer_checked: true,
  verification_pointer_checked: true,
  changed_files_boundary_checked: changedFilesBoundary.checked,
  changed_files_boundary_skipped: changedFilesBoundary.skipped,
  changed_files_checked: changedFilesBoundary.files,
  changed_files_base_ref: changedFilesBoundary.base_ref,
  changed_files_base_range_checked: changedFilesBoundary.base_range_checked,
  changed_files_base_range_skipped: changedFilesBoundary.base_range_skipped,
  changed_files_working_tree_checked: changedFilesBoundary.working_tree_checked,
  smoke_type: "documentation-boundary-only",
  runtime_behavior_changed: false,
  ui_behavior_changed: false,
  api_route_behavior_changed: false,
  persistence_behavior_changed: false,
  agent_execution_behavior_changed: false,
};

console.log(JSON.stringify(summary, null, 2));
console.log("PASS smoke:project-constellation-ia-boundaries");

function assertPackageScript() {
  assertPackageJsonScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:project-constellation-ia-boundaries",
    expectedCommand:
      "node scripts/smoke-project-constellation-ia-boundaries.mjs",
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
  const doc = textByFile.get(projectDoc);
  for (const section of requiredSections) {
    const headingPattern = new RegExp(
      `^##\\s+\\d+\\.\\s+${escapeRegExp(section)}\\s*$`,
      "m",
    );
    assert(
      headingPattern.test(doc),
      `${projectDoc} must contain required section heading: ${section}`,
    );
  }
}

function assertRequiredConcepts() {
  assertContainsAll(projectDoc, requiredConcepts);
}

function assertRequiredBoundaries() {
  assertContainsAll(projectDoc, requiredBoundaryPhrases);
  assertContainsAll(projectDoc, [
    "symbolic node map, not decorative space UI",
    "practical node/edge/cluster map",
    "snapshot, rollback, diff, fork, compare, and capsule semantics in this document are design semantics only",
    "This PR does not implement runtime request routing, route handlers, MCP tools, Codex CLI behavior, GitHub integration, agent calls, persistence, graph computation, or UI controls.",
    "This does not implement snapshot persistence, storage, database schema, migrations, save buttons, rollback buttons, graph layout, or route behavior.",
  ]);
}

function assertRequiredNonGoals() {
  const doc = textByFile.get(projectDoc);
  const nonGoalsSection = extractSection(doc, "Non-Goals");

  for (const entry of requiredNonGoals) {
    if (Array.isArray(entry)) {
      assertContainsAny(nonGoalsSection, entry, `${projectDoc} Non-Goals`);
    } else {
      assertContainsAllText(nonGoalsSection, [entry], {
        label: `${projectDoc} Non-Goals`,
      });
    }
  }
}

function assertSnapshotSemanticsAreConceptualOnly() {
  assertContainsAll(projectDoc, [
    "Perspective Lock freezes a selected view as a conceptual",
    "It is a read-only design object in this PR.",
    "conceptual rollback, diff, fork, and compare semantics",
    "These operations must remain read-only",
    "In v0.1 they do not create durable records, update Core state, execute agents, mutate Cockpit, change routes, or write proof/evidence/readiness data.",
  ]);
}

function assertIndexPointerBoundary() {
  assertContainsAll(indexDoc, [
    "PROJECT_CONSTELLATION_IA_V0_1.md",
    "Project Constellation",
    "repo-local",
    "non-SSOT",
    "read-only",
    "non-authoritative",
    "not an Active-set expansion",
    "symbolic node/typed-edge/cluster map",
    "smoke:project-constellation-ia-boundaries",
    "document/IA boundary guard",
    "Runtime code, UI components",
    "ChatGPT Apps/MCP tool changes",
    "proof/evidence/readiness writes",
    "`z_t` commits",
    "AG Resume behavior",
  ]);
}

function assertVerificationPointerBoundary() {
  assertContainsAll(verificationDoc, [
    "Project Constellation IA boundary verification belongs in bounded command evidence",
    "npm run smoke:project-constellation-ia-boundaries",
    "documentation-boundary-only",
    "symbolic node/edge/cluster map",
    "read-only",
    "non-authoritative",
    "evidence-pointer-based",
    "handoff-preview",
    "not runtime proof",
    "does not implement Project Constellation runtime behavior",
    "does not create proof/evidence/readiness writes",
    "does not create QP evidence",
    "does not commit `z_t`",
  ]);
}

function assertChangedFilesBoundary() {
  return assertChangedFilesWithin({
    allowedChangedFiles,
    label: "Project Constellation IA boundary smoke",
  });
}

function assertContainsAll(file, requiredPhrases) {
  assertTextContainsAll(file, requiredPhrases, { textByFile });
}

function assertContainsAllText(text, requiredPhrases, options = {}) {
  assertTextContainsAll(text, requiredPhrases, options);
}

function assertContainsAny(text, phrases, label) {
  const normalized = normalizeText(text);
  assert(
    phrases.some((phrase) => normalized.includes(normalizeText(phrase))),
    `${label} must contain one of: ${phrases.join(" | ")}`,
  );
}

function extractSection(markdown, sectionName) {
  const pattern = new RegExp(
    `^##\\s+\\d+\\.\\s+${escapeRegExp(sectionName)}\\s*$`,
    "m",
  );
  const match = pattern.exec(markdown);
  assert(match, `${projectDoc} must contain section: ${sectionName}`);
  const start = match.index + match[0].length;
  const rest = markdown.slice(start);
  const nextSection = rest.search(/^##\s+\d+\.\s+/m);
  return nextSection === -1 ? rest : rest.slice(0, nextSection);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
