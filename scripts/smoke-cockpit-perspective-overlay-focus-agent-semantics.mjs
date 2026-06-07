import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const cockpitFile = "components/augnes-cockpit.tsx";
const cssFile = "app/globals.css";
const packageFile = "package.json";
const docFile = "docs/PERSPECTIVE_OVERLAY_FOCUS_AGENT_SEMANTICS_V0_1.md";
const smokeFile =
  "scripts/smoke-cockpit-perspective-overlay-focus-agent-semantics.mjs";
const browserReportFile =
  "reports/browser/2026-06-07-perspective-overlay-focus-agent-semantics.md";

const cockpit = readFileSync(cockpitFile, "utf8");
const css = readFileSync(cssFile, "utf8");
const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const doc = readFileSync(docFile, "utf8");
const smoke = readFileSync(smokeFile, "utf8");

const allowedChangedFiles = new Set([
  "app/globals.css",
  "components/augnes-cockpit.tsx",
  "docs/PERSPECTIVE_HANDOFF_PACKET_COPY_TO_AGENT_DOGFOOD_V0_1.md",
  "docs/PERSPECTIVE_HANDOFF_PACKET_STRUCTURE_REVIEW_V0_1.md",
  docFile,
  packageFile,
  "lib/perspective-ingest/perspective-unit-preview.ts",
  browserReportFile,
  "reports/browser/2026-06-07-perspective-handoff-packet-copy-to-agent-dogfood.md",
  "reports/browser/2026-06-07-perspective-handoff-packet-structure-review.md",
  "reports/dogfood/2026-06-07-perspective-handoff-packet-copy-to-agent-dogfood.md",
  "scripts/smoke-cockpit-perspective-event-rail-entry-cards.mjs",
  "scripts/smoke-cockpit-perspective-formation-switch-overlay.mjs",
  "scripts/smoke-cockpit-perspective-scope-handler-cleanup.mjs",
  smokeFile,
  "scripts/smoke-perspective-handoff-packet-copy-to-agent-dogfood.mjs",
  "scripts/smoke-perspective-handoff-packet-structure-review.mjs",
  "scripts/smoke-perspective-capsule-contract.mjs",
  "scripts/smoke-perspective-ingest-constellation-preview.mjs",
]);

assert.equal(
  packageJson.scripts[
    "smoke:cockpit-perspective-overlay-focus-agent-semantics"
  ],
  "node scripts/smoke-cockpit-perspective-overlay-focus-agent-semantics.mjs",
  "package.json must register smoke:cockpit-perspective-overlay-focus-agent-semantics",
);

assertContainsAll(cockpit, [
  "formationSwitchApplyButtonRef",
  "formationSwitchOverlayCardRef",
  "formationSwitchTriggerButtonRefs",
  "formationSwitchTriggerBasisRef",
  "formationSwitchWasOpenRef",
  "window.setTimeout(() =>",
  "formationSwitchTriggerButtonRefs.current[triggerBasis]?.focus();",
  "formationSwitchCancelButtonRef.current?.focus();",
  "getFocusableOverlayElements",
  "handleFormationSwitchOverlayKeyDown",
  'event.key === "Escape"',
  "closePerspectiveFormationBasisSwitchOverlay();",
  'event.key !== "Tab"',
  "overlayCard.focus();",
  "event.shiftKey && activeElement === firstFocusableElement",
  "!event.shiftKey && activeElement === lastFocusableElement",
  "document.addEventListener(\"keydown\", handleFormationSwitchOverlayKeyDown);",
  "document.removeEventListener(",
  "formationSwitchTriggerBasisRef.current = basis;",
]);

assertContainsAll(cockpit, [
  'role="dialog"',
  'aria-modal="true"',
  'aria-labelledby="perspective-formation-switch-overlay-title"',
  'aria-describedby="perspective-formation-switch-overlay-description"',
  'id="perspective-formation-switch-overlay-title"',
  'id="perspective-formation-switch-overlay-description"',
  'aria-label="Formation Basis switch actions"',
  'className="sr-only"',
  "This surface is local-only, free, and does not call APIs,",
  "persist data, bill usage, or execute Codex.",
  'perspectiveFormationSwitchOverlayCopy.mode === "local_switch" ? (',
  "Apply View",
  "Cancel",
  "Close",
]);

assertContainsAll(cockpit, [
  'data-augnes-surface="perspective-observatory"',
  'data-augnes-authority="read-only local-only preview-only"',
  'data-augnes-external-calls="false"',
  'data-augnes-api-billable="false"',
  'data-augnes-persistence="false"',
  'data-augnes-codex-execution="false"',
  'data-augnes-region="formation-identity"',
  'data-augnes-region="observatory-controls"',
  'data-augnes-region="formation-basis-controls"',
  'data-augnes-region="lens-controls"',
  'data-augnes-region="scope-controls"',
  'data-augnes-region="source-summary"',
  'data-augnes-region="starmap"',
  'data-augnes-region="inspector"',
  'data-augnes-region="event-rail"',
  'data-augnes-region="temporal-entry-card"',
  'data-augnes-region="formation-switch-overlay"',
  'data-augnes-control="formation-basis"',
  "data-augnes-basis={basis.id}",
  'data-augnes-control="lens"',
  "data-augnes-lens={option.id}",
  'data-augnes-control="scope"',
  'data-augnes-scope="whole_constellation"',
  'data-augnes-scope="connected_node"',
  'data-augnes-scope="cluster"',
  'data-augnes-scope="manual_selection"',
]);

assertContainsAll(cockpit, [
  "Perspective Observatory",
  "Current Perspective Starmap",
  "Observatory Controls",
  "Formation Basis",
  "Lens",
  "Scope",
  "Source",
  "Event Rail",
  "Archive / Present / Future",
  "Formation Basis · Switch View",
  "Preview Handoff Packet",
]);

assertContainsAll(css, [
  ".sr-only",
  "clip: rect(0, 0, 0, 0);",
  ".perspective-formation-switch-overlay-card:focus-visible",
  ".perspective-formation-switch-overlay-card button:focus-visible",
  "outline: 3px solid rgba(14, 116, 144, 0.38);",
]);

assertContainsAll(doc, [
  "# Perspective Overlay Focus and Agent Semantics v0.1",
  "implementation-hardening slice for Perspective Observatory only",
  "not a feature expansion",
  "not a capability launch",
  "starmap-first visual layout",
  "Opening a Formation Basis overlay moves focus into the dialog",
  "Escape closes the open overlay",
  "Tab and Shift+Tab stay contained inside the overlay",
  "Closing the overlay returns focus",
  "Apply View remains available only for local switch overlays",
  "role=\"dialog\"",
  "aria-modal=\"true\"",
  "aria-labelledby=\"perspective-formation-switch-overlay-title\"",
  "aria-describedby=\"perspective-formation-switch-overlay-description\"",
  "data-augnes-surface=\"perspective-observatory\"",
  "data-augnes-region=\"formation-switch-overlay\"",
  "data-augnes-authority=\"read-only local-only preview-only\"",
  "data-augnes-external-calls=\"false\"",
  "data-augnes-api-billable=\"false\"",
  "data-augnes-persistence=\"false\"",
  "data-augnes-codex-execution=\"false\"",
  "No raw graph/source/prompt/model/private/generated content",
  "npm run smoke:cockpit-perspective-overlay-focus-agent-semantics",
]);

assert.equal(
  /\brulecraft\b/i.test(cockpit),
  false,
  "Rulecraft must not be exposed in product-facing Cockpit source",
);

assertSafeDataAttributes();
assertOverlaySourceBoundary();
assertSmokeScriptBoundary();
assertChangedFilesBoundary();

console.log("cockpit perspective overlay focus agent semantics smoke passed");

function assertSafeDataAttributes() {
  const dataAttributes = Array.from(
    cockpit.matchAll(/\sdata-[A-Za-z0-9:-]+=(?:{[^}\n]*}|"[^"]*"|'[^']*')/g),
  )
    .map((match) => match[0])
    .join("\n");

  assertContainsAll(dataAttributes, [
    'data-augnes-surface="perspective-observatory"',
    'data-augnes-region="formation-switch-overlay"',
    'data-augnes-control="formation-basis"',
    "data-augnes-basis={basis.id}",
    "data-augnes-lens={option.id}",
  ]);

  for (const forbidden of [
    "data-raw-graph",
    "data-source-text",
    "data-pasted-text",
    "data-packet-text",
    "data-prompt",
    "data-model-output",
    "data-private-history",
    "data-augnes-formation-receipt",
    "FormationReceipt",
    "JSON.stringify(",
    "raw graph",
    "pasted text",
    "source text",
    "packet text",
    "prompt text",
    "model output",
    "private history",
  ]) {
    assert.equal(
      dataAttributes.includes(forbidden),
      false,
      `safe semantic data attributes must not include ${forbidden}`,
    );
  }
}

function assertOverlaySourceBoundary() {
  const overlaySource = [
    extractBetween(
      cockpit,
      "const formationSwitchApplyButtonRef = useRef",
      "useEffect(() => {\n    if (!manualGravityLocalDraftContext)",
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

  for (const forbidden of [
    "api.openai.com",
    "api.github.com",
    "OPENAI_API_KEY",
    "GITHUB_TOKEN",
    "Octokit",
    "axios",
    "fetch(",
    "use server",
    "provider selector",
    "model selector",
    "api billing selector",
    "<input type=\"hidden\"",
    "<textarea hidden",
    "localStorage.setItem",
  ]) {
    assert.equal(
      overlaySource.includes(forbidden),
      false,
      `overlay focus semantics must not add runtime/provider/storage plumbing: ${forbidden}`,
    );
  }
}

function assertSmokeScriptBoundary() {
  for (const forbiddenImport of [
    "app/",
    "components/",
    "lib/",
    "db/",
    "migrations/",
    "fixtures/",
    "reports/",
    "screenshots/",
  ]) {
    assert.equal(
      smoke.includes(` from "${forbiddenImport}`) ||
        smoke.includes(` from '${forbiddenImport}`),
      false,
      `smoke must stay static and not import runtime source: ${forbiddenImport}`,
    );
  }
}

function assertChangedFilesBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `overlay focus agent semantics slice changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      changedFile === "app/globals.css" ||
        (!changedFile.startsWith("app/") &&
          !changedFile.startsWith("app/api/") &&
          !changedFile.startsWith("db/") &&
          !changedFile.startsWith("migrations/")),
      `overlay focus agent semantics slice must not introduce routes, DB, or migrations: ${changedFile}`,
    );
  }
}

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
