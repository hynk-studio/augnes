import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const manualPanelPath =
  "components/research-candidate-manual-note-preview-panel.tsx";
const copyPacketPanelPath =
  "components/research-candidate-readiness-copy-packet-panel.tsx";
const reviewWorkspacePath =
  "components/research-candidate-readiness-packet-review-workspace.tsx";
const gateExplanationsPath =
  "components/research-candidate-promotion-readiness-gate-explanations.tsx";
const localChecklistPath =
  "components/research-candidate-local-packet-review-checklist.tsx";
const startupReadinessPath = "components/cockpit-startup-readiness-readout.tsx";
const cssPath = "app/globals.css";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const smokePath =
  "scripts/smoke-research-candidate-preview-draft-local-checklist-and-extract-v0-1.mjs";

for (const filePath of [
  manualPanelPath,
  copyPacketPanelPath,
  reviewWorkspacePath,
  gateExplanationsPath,
  localChecklistPath,
  startupReadinessPath,
  cssPath,
  indexPath,
  packagePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const manualPanel = readFileSync(manualPanelPath, "utf8");
const copyPacketPanel = readFileSync(copyPacketPanelPath, "utf8");
const reviewWorkspace = readFileSync(reviewWorkspacePath, "utf8");
const gateExplanations = readFileSync(gateExplanationsPath, "utf8");
const localChecklist = readFileSync(localChecklistPath, "utf8");
const startupReadiness = readFileSync(startupReadinessPath, "utf8");
const css = readFileSync(cssPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const extractedUi = [
  copyPacketPanel,
  reviewWorkspace,
  gateExplanations,
  localChecklist,
].join("\n");
const fullUiSurface = `${manualPanel}\n${extractedUi}`;

assertExtraction();
assertChecklistUi();
assertPreservedUi();
assertForbiddenPatternsAbsent();
assertDocsAndPackagePointers();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-preview-draft-local-checklist-and-extract-v0-1",
      extracted_components_checked: true,
      local_checklist_checked: true,
      panel_bloat_reduction_checked: true,
      preserved_readiness_ui_checked: true,
      local_only_boundaries_checked: true,
      forbidden_patterns_absent: true,
      docs_pointer_checked: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertExtraction() {
  for (const requiredImport of [
    "research-candidate-promotion-readiness-gate-explanations",
    "research-candidate-readiness-copy-packet-panel",
  ]) {
    assert.ok(
      manualPanel.includes(requiredImport),
      `manual panel must import ${requiredImport}`,
    );
  }

  for (const requiredRender of [
    "<PromotionReadinessGateExplanations",
    "<ReadinessCopyPacketPanel",
  ]) {
    assert.ok(
      manualPanel.includes(requiredRender),
      `manual panel must render ${requiredRender}`,
    );
  }

  for (const removedInlineDefinition of [
    "function ReadinessCopyPacketPanel(",
    "function ReadinessPacketReviewWorkspace(",
    "function PromotionReadinessGateExplanations(",
  ]) {
    assert.ok(
      !manualPanel.includes(removedInlineDefinition),
      `manual panel must not define ${removedInlineDefinition} inline`,
    );
  }

  assert.ok(
    copyPacketPanel.includes("export function ReadinessCopyPacketPanel"),
    "readiness copy packet panel component must exist",
  );
  assert.ok(
    reviewWorkspace.includes("export function ReadinessPacketReviewWorkspace"),
    "packet review workspace component must exist",
  );
  assert.ok(
    gateExplanations.includes("export function PromotionReadinessGateExplanations"),
    "gate explanations component must exist",
  );
  assert.ok(
    localChecklist.includes("export function LocalPacketReviewChecklist"),
    "local packet review checklist component must exist",
  );

  assert.ok(
    copyPacketPanel.includes("<ReadinessPacketReviewWorkspace"),
    "copy packet panel must render packet review workspace",
  );
  assert.ok(
    copyPacketPanel.includes("<LocalPacketReviewChecklist"),
    "copy packet panel must render local checklist",
  );

  const manualPanelLineCount = manualPanel.split("\n").length;
  assert.ok(
    manualPanelLineCount < 3300,
    `manual panel line count should be reduced below 3300, got ${manualPanelLineCount}`,
  );
}

function assertChecklistUi() {
  for (const requiredText of [
    "Local packet review checklist",
    "Checklist state is local to this screen only.",
    "Checklist is local screen aid only.",
    "Checklist completion is not approval or promotion authority.",
    "Checklist notes are not stored, sent, shared, or persisted.",
    "No proof/evidence, Perspective, work item, provider, retrieval, source-fetch, Codex, or handoff action is run.",
    "Source references reviewed",
    "Parser warnings reviewed",
    "Block gates reviewed",
    "Warning gates reviewed",
    "Gate explanations reviewed",
    "Packet freshness is current",
    "Full packet copied or manual fallback reviewed",
    "Raw manual note text absence confirmed",
    "Boundary/no-side-effect metadata reviewed",
    "Separate future lane needed, if applicable",
    "Local reviewer notes",
    "Local packet review notes",
    "checklist_status",
    "checked_count",
    "total_count",
    "current_packet_fingerprint",
    "checklist_started_for_packet_fingerprint",
    "local notes character count",
    "Reset local checklist",
    "no_checklist_started",
    "in_progress",
    "complete",
    "stale_for_current_packet",
    "Checklist was made against a previous packet state.",
    "Complete checklist is a local screen aid only.",
    "It does not approve, reject, defer, promote, or canonize this draft.",
  ]) {
    assert.ok(
      localChecklist.includes(requiredText),
      `local checklist must include ${requiredText}`,
    );
  }

  for (const requiredCss of [
    "manual-note-local-packet-review-checklist",
    "manual-note-local-packet-review-checklist-header",
    "manual-note-local-packet-review-checklist-status",
    "manual-note-local-packet-review-checklist-items",
    "manual-note-local-packet-review-checklist-item",
    "manual-note-local-packet-review-checklist-notes",
  ]) {
    assert.ok(css.includes(requiredCss), `CSS must include ${requiredCss}`);
  }
}

function assertPreservedUi() {
  for (const preservedText of [
    "CockpitStartupReadinessReadout",
    "Startup readiness",
    "Use sample note",
    "Operator preview label",
    "Parse locally",
    "Create runtime preview draft",
    "Recent runtime preview drafts",
    "Refresh preview drafts",
    "Lifecycle filter",
    "Sort order",
    "Warning filter",
    "Candidate filter",
    "Limit selector",
    "Open preview draft",
    "Edit label",
    "Save label",
    "Cancel",
    "Clear label",
    "Load activity",
    "Refresh activity",
    "Discard preview draft",
    "Promotion readiness preflight",
    "Gate explanations",
    "Readiness copy packet",
    "Packet freshness status",
    "Packet review workspace",
    "Markdown",
    "JSON",
    "Summary",
    "Full",
    "All",
    "Block",
    "Warning",
    "Pass",
    "Section visibility",
    "Copy human review packet",
    "Copy JSON packet",
    "Manual copy fallback",
    "Authority boundary",
  ]) {
    assert.ok(
      fullUiSurface.includes(preservedText) ||
        startupReadiness.includes(preservedText),
      `existing UI must retain ${preservedText}`,
    );
  }
}

function assertForbiddenPatternsAbsent() {
  assert.doesNotMatch(
    extractedUi,
    /from\s+["'][^"']*(?:db|store|schema|route|openai|provider|retrieval|rag|source-fetch|crawler|scraper|embedding|vector|codex-sdk|proof|evidence|work-item)[^"']*["']/i,
    "extracted UI components must not import DB/store/server/provider/retrieval/proof/evidence/work modules",
  );
  assert.doesNotMatch(
    extractedUi,
    /\b(?:INSERT INTO|UPDATE\s+\w|DELETE FROM|CREATE TABLE|ALTER TABLE|DROP TABLE|db\.prepare|db\.exec|fetch\s*\()\b/i,
    "extracted UI components must not write DB, mutate schema, or fetch",
  );

  for (const forbiddenStoragePattern of [
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "document.cookie",
  ]) {
    assert.ok(
      !fullUiSurface.includes(forbiddenStoragePattern),
      `UI must not use ${forbiddenStoragePattern}`,
    );
  }

  for (const forbiddenButtonLabel of [
    "Save checklist",
    "Submit checklist",
    "Approve checklist",
    "Complete review",
    "Send checklist",
    "Export checklist",
    "Send packet",
    "Share packet",
    "Email packet",
    "Submit packet",
    "Create handoff",
    "Execute Codex",
    "Promote",
    "Approve",
    "Reject",
    "Defer",
    "Create proof",
    "Create evidence",
    "Create work item",
    "Fix all",
  ]) {
    assert.doesNotMatch(
      fullUiSurface,
      new RegExp(`>\\s*${escapeRegExp(forbiddenButtonLabel)}\\s*<`, "i"),
      `UI must not add forbidden button ${forbiddenButtonLabel}`,
    );
  }

  for (const forbiddenText of ["download", "Download", "file export", "File export"]) {
    assert.ok(
      !fullUiSurface.includes(forbiddenText),
      `UI must not add download/file export text: ${forbiddenText}`,
    );
  }
}

function assertDocsAndPackagePointers() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-preview-draft-local-checklist-and-extract-v0-1"
    ],
    "node scripts/smoke-research-candidate-preview-draft-local-checklist-and-extract-v0-1.mjs",
    "package script must point to local checklist/extract smoke",
  );

  for (const requiredText of [
    "local packet review checklist",
    "Local packet review checklist",
    "components/research-candidate-readiness-copy-packet-panel.tsx",
    "components/research-candidate-readiness-packet-review-workspace.tsx",
    "components/research-candidate-promotion-readiness-gate-explanations.tsx",
    "components/research-candidate-local-packet-review-checklist.tsx",
    "Checklist state is local to this screen only",
    "Checklist completion is not approval or promotion authority",
    "Checklist notes are not stored, sent, shared, or persisted",
    "smoke:research-candidate-preview-draft-local-checklist-and-extract-v0-1",
  ]) {
    assert.ok(index.includes(requiredText), `docs index must include ${requiredText}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
