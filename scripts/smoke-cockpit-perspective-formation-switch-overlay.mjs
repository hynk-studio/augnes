import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const cockpitFile = "components/augnes-cockpit.tsx";
const cssFile = "app/globals.css";
const packageFile = "package.json";
const docFile = "docs/PERSPECTIVE_FORMATION_SWITCH_OVERLAY_V0_1.md";
const helperFile = "lib/perspective-ingest/formation-switch-acknowledgement.ts";
const smokeFile = "scripts/smoke-cockpit-perspective-formation-switch-overlay.mjs";

const cockpit = readFileSync(cockpitFile, "utf8");
const css = readFileSync(cssFile, "utf8");
const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const doc = readFileSync(docFile, "utf8");
const helper = readFileSync(helperFile, "utf8");

const allowedChangedFiles = new Set([
  "app/globals.css",
  "components/augnes-cockpit.tsx",
  "docs/PERSPECTIVE_FORMATION_SWITCH_OVERLAY_V0_1.md",
  "docs/PERSPECTIVE_OVERLAY_FOCUS_AGENT_SEMANTICS_V0_1.md",
  "docs/PERSPECTIVE_SCOPE_HANDLER_CLEANUP_V0_1.md",
  "lib/perspective-ingest/formation-switch-acknowledgement.ts",
  "package.json",
  "reports/browser/2026-06-07-perspective-formation-switch-overlay.md",
  "reports/browser/2026-06-07-perspective-overlay-focus-agent-semantics.md",
  "reports/browser/2026-06-07-perspective-scope-handler-cleanup.md",
  "scripts/smoke-cockpit-perspective-event-rail-entry-cards.mjs",
  "scripts/smoke-cockpit-perspective-formation-switch-overlay.mjs",
  "scripts/smoke-cockpit-perspective-overlay-focus-agent-semantics.mjs",
  "scripts/smoke-cockpit-perspective-scope-handler-cleanup.mjs",
  "scripts/smoke-cockpit-perspective-ia-core.mjs",
  "scripts/smoke-perspective-capsule-contract.mjs",
  "scripts/smoke-perspective-ingest-constellation-preview.mjs",
]);

assert.equal(
  packageJson.scripts["smoke:cockpit-perspective-formation-switch-overlay"],
  "node scripts/smoke-cockpit-perspective-formation-switch-overlay.mjs",
  "package.json must register smoke:cockpit-perspective-formation-switch-overlay",
);

assertContainsAll(cockpit, [
  "pendingFormationBasisSwitch",
  "formationSwitchOverlayOpen",
  "formationSwitchNotice",
  "PerspectiveFormationBasisSwitchDecision",
  "already_active",
  "apply_immediately",
  "show_switch_overlay",
  "show_future_explanation",
  "handlePerspectiveFormationBasisControlClick",
  "applyPendingPerspectiveFormationBasisSwitch",
  "applyPerspectiveFormationBasisSwitch",
  "Formation Basis · Switch View",
  "Switch to Current View?",
  "This returns the starmap to the current local PerspectiveUnitPreview / FormationReceiptV0 basis.",
  "Switch to Manual Selection View?",
  "This reframes the local preview around selected graph material.",
  "Apply View",
  "Cancel",
  "Close",
  "free/local",
  "no API call",
  "no cost",
  "acknowledgement metadata only",
  "expires after 24 hours",
  "Select a node or cluster before applying Manual Selection.",
  "Applied Current View · local-only",
  "Applied Manual Selection View · local-only",
  "Viewing Current · cached local acknowledgement · no API call",
  "Viewing Manual Selection · cached local acknowledgement · no API call",
  "Already viewing Current",
  "Already viewing Manual Selection",
  "Historical Snapshot is disabled / future behavior",
  "Historical Snapshot is future archive behavior only in this slice.",
  "no frozen snapshot persistence",
  "no delta view",
  "Auto Proposal is disabled / future behavior",
  "Auto Proposal is future behavior only in this slice. No provider, model, API call, API billing, proposal generation, graph rearrangement, or persistence occurs.",
  "Experimental is disabled / future behavior",
  "Experimental internals remain unexposed in this slice. No public experimental basis, no rearrangement, no API call, no persistence.",
  "data-future-only={futureOnly ? \"true\" : undefined}",
  "selectWholeConstellationScope({ syncLens: \"whole_constellation\" });",
  "selectManualSelectionScope();",
]);

assertContainsAll(helper, [
  "FORMATION_SWITCH_ACKNOWLEDGEMENT_STORAGE_KEY",
  "augnes.perspective.formationSwitchAcknowledgement.v0_1",
  "FORMATION_SWITCH_BASIS_VERSION",
  "formation_basis_switch.v0.1",
  "FORMATION_SWITCH_ACKNOWLEDGEMENT_TTL_MS = 24 * 60 * 60 * 1000",
  "FormationSwitchAcknowledgementMetadata",
  "basisVersion",
  "sourceQuery",
  "constellationId",
  "formationId",
  "contextFingerprint",
  "costTier: FormationSwitchCostTier",
  "externalCalls: false",
  "apiBillable: false",
  "persistence: false",
  "acknowledgedAt",
  "expiresAt",
  "readFormationSwitchAcknowledgementFromStorage",
  "writeFormationSwitchAcknowledgementToStorage",
  "formationSwitchAcknowledgementIsValid",
  "Date.parse(acknowledgement.expiresAt) > now.getTime()",
  "FORMATION_SWITCH_ACKNOWLEDGEMENT_FORBIDDEN_STORAGE_FIELDS",
  "raw graph",
  "pasted text",
  "source text",
  "packet text",
  "prompt text",
  "model output",
  "private history",
]);

const metadataType = extractBetween(
  helper,
  "export type FormationSwitchAcknowledgementMetadata =",
  "export type FormationSwitchAcknowledgementStorageSnapshot",
);
for (const forbiddenField of [
  "rawGraph",
  "pastedText",
  "sourceText",
  "packetText",
  "promptText",
  "modelOutput",
  "privateHistory",
  "graph",
  "prompt",
  "packet",
]) {
  assert.equal(
    metadataType.includes(forbiddenField),
    false,
    `stored acknowledgement metadata must not include ${forbiddenField}`,
  );
}

assertContainsAll(css, [
  ".perspective-formation-switch-overlay-backdrop",
  ".perspective-formation-switch-overlay-card",
  ".perspective-formation-switch-badge-row",
  ".perspective-formation-switch-list-grid",
  ".perspective-formation-switch-action-row",
  ".perspective-formation-switch-metadata",
  ".primary-button",
  ".perspective-formation-basis-explanation-list button[data-future-only=\"true\"]",
]);

assertContainsAll(doc, [
  "# Perspective Formation Switch Overlay v0.1",
  "Formation Basis switch overlay UX slice",
  "Current and Manual Selection are local/free switch candidates",
  "Historical Snapshot / Auto Proposal / Experimental remain future/explanation-only",
  "Cached-local acknowledgement policy",
  "metadata only",
  "24 hours",
  "context fingerprint",
  "No raw graph",
  "No raw pasted text",
  "No source text",
  "No packet text",
  "No prompt text",
  "No model output",
  "No private history",
  "No API route",
  "No DB",
  "No graph DB",
  "No provider",
  "No GitHub",
  "No Codex",
  "No Rulecraft exposure",
  "npm run smoke:cockpit-perspective-formation-switch-overlay",
]);

const formationSwitchComponentSource = [
  extractBetween(
    cockpit,
    "function getPerspectiveFormationSwitchAcknowledgementContext(",
    "function selectPerspectiveLensOnly(",
  ),
  extractBetween(
    cockpit,
    "function getPerspectiveFormationBasisSwitchOverlayCopy({",
    "function matchPerspectiveIngestEvidencePointers(",
  ),
  extractBetween(
    cockpit,
    "perspective-formation-switch-overlay-backdrop",
    '<section\n          className="perspective-time-axis-event-rail"',
  ),
].join("\n");

assert.equal(
  /\brulecraft\b/i.test(formationSwitchComponentSource),
  false,
  "Rulecraft must not be exposed in product-facing Formation Switch UI",
);

for (const forbidden of [
  "api.openai.com",
  "api.github.com",
  "OPENAI_API_KEY",
  "GITHUB_TOKEN",
  "Octokit",
  "axios",
  "use server",
  "provider selector",
  "model selector",
  "api billing selector",
]) {
  assert.equal(
    formationSwitchComponentSource.includes(forbidden) || helper.includes(forbidden),
    false,
    `formation switch overlay must not add ${forbidden}`,
  );
}

for (const changedFile of collectChangedFiles()) {
  assert(
    allowedChangedFiles.has(changedFile),
    `formation switch overlay slice changed an out-of-scope file: ${changedFile}`,
  );
  assert(
    changedFile === "app/globals.css" ||
      (!changedFile.startsWith("app/") &&
        !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/")),
    `formation switch overlay slice must not introduce routes, DB, or migrations: ${changedFile}`,
  );
}

console.log("cockpit perspective formation switch overlay smoke passed");

function assertContainsAll(text, snippets) {
  const normalized = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalized.includes(normalize(snippet)),
      `Expected source to contain: ${snippet}`,
    );
  }
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

function extractBetween(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Expected start marker: ${startMarker}`);
  assert.notEqual(end, -1, `Expected end marker: ${endMarker}`);
  return text.slice(start, end);
}

function collectChangedFiles() {
  const workingTreeFiles = gitLines(["diff", "--name-only", "HEAD"]);
  const branchFiles = gitLines(["diff", "--name-only", "origin/main...HEAD"]);
  const untrackedFiles = gitLines(["ls-files", "--others", "--exclude-standard"]);
  return Array.from(
    new Set([...workingTreeFiles, ...branchFiles, ...untrackedFiles]),
  ).filter(Boolean);
}

function gitLines(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}
