import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const builderPath =
  "lib/research-candidate-review/manual-note-preview-draft-readiness-copy-packet.ts";
const sharedRuntimePath =
  "lib/research-candidate-review/manual-note-runtime-preview.ts";
const componentPath =
  "components/research-candidate-manual-note-preview-panel.tsx";
const formatHintPath =
  "components/research-candidate-manual-note-format-hint.tsx";
const resultSummaryPath =
  "components/research-candidate-manual-note-result-summary.tsx";
const warningDisplayPath =
  "components/research-candidate-manual-note-warning-display.tsx";
const sourceReferenceListPath =
  "components/research-candidate-manual-note-source-reference-list.tsx";
const candidateFamilyListsPath =
  "components/research-candidate-manual-note-candidate-family-lists.tsx";
const authorityFlagsPath =
  "components/research-candidate-manual-note-authority-flags.tsx";
const copyPacketPanelPath =
  "components/research-candidate-readiness-copy-packet-panel.tsx";
const reviewWorkspacePath =
  "components/research-candidate-readiness-packet-review-workspace.tsx";
const gateExplanationsPath =
  "components/research-candidate-promotion-readiness-gate-explanations.tsx";
const startupReadinessPath = "components/cockpit-startup-readiness-readout.tsx";
const cssPath = "app/globals.css";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const stalenessSmokePath =
  "scripts/smoke-research-candidate-preview-draft-readiness-copy-packet-staleness-v0-1.mjs";
const smokePath =
  "scripts/smoke-research-candidate-preview-draft-readiness-packet-review-workspace-v0-1.mjs";

for (const filePath of [
  builderPath,
  sharedRuntimePath,
  componentPath,
  formatHintPath,
  resultSummaryPath,
  warningDisplayPath,
  sourceReferenceListPath,
  candidateFamilyListsPath,
  authorityFlagsPath,
  copyPacketPanelPath,
  reviewWorkspacePath,
  gateExplanationsPath,
  startupReadinessPath,
  cssPath,
  indexPath,
  packagePath,
  stalenessSmokePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const builder = readFileSync(builderPath, "utf8");
const sharedRuntime = readFileSync(sharedRuntimePath, "utf8");
const manualComponent = readFileSync(componentPath, "utf8");
const copyPacketPanel = readFileSync(copyPacketPanelPath, "utf8");
const reviewWorkspace = readFileSync(reviewWorkspacePath, "utf8");
const gateExplanations = readFileSync(gateExplanationsPath, "utf8");
const component = [
  readFileSync(formatHintPath, "utf8"),
  readFileSync(resultSummaryPath, "utf8"),
  readFileSync(warningDisplayPath, "utf8"),
  readFileSync(sourceReferenceListPath, "utf8"),
  readFileSync(candidateFamilyListsPath, "utf8"),
  readFileSync(authorityFlagsPath, "utf8"),
  manualComponent,
  copyPacketPanel,
  reviewWorkspace,
  gateExplanations,
].join("\n");
const startupReadiness = readFileSync(startupReadinessPath, "utf8");
const css = readFileSync(cssPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertHelper();
assertUi();
assertForbiddenPatternsAbsent();
assertDocsAndPackagePointers();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-preview-draft-readiness-packet-review-workspace-v0-1",
      helper_checked: true,
      review_workspace_ui_checked: true,
      scan_controls_checked: true,
      boundary_copy_checked: true,
      existing_copy_and_freshness_checked: true,
      forbidden_patterns_absent: true,
      docs_pointer_checked: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertHelper() {
  for (const requiredText of [
    "buildManualNotePreviewDraftReadinessPacketReviewPreview",
    "buildReadinessPacketReviewSectionSummary",
    "filterReadinessPacketGateResults",
    "formatReadinessPacketPreviewMarkdown",
    "formatReadinessPacketPreviewJson",
    "ManualNotePreviewDraftReadinessPacketReviewOptions",
    "ManualNotePreviewDraftReadinessPacketReviewPreview",
    "ManualNotePreviewDraftReadinessPacketDetailMode",
    "ManualNotePreviewDraftReadinessPacketGateFilter",
    "ManualNotePreviewDraftReadinessPacketFormatView",
    "ManualNotePreviewDraftReadinessPacketReviewSection",
    "READINESS_PACKET_REVIEW_SECTIONS",
    "DEFAULT_READINESS_PACKET_REVIEW_SECTION_VISIBILITY",
    "packet_format_view",
    "packet_detail_mode",
    "gate_group_filter",
    "section_visibility",
    "preview_markdown",
    "preview_json",
    "preview_character_count",
    "visible_gate_count",
    "hidden_gate_count",
    "visible_section_count",
    "hidden_section_count",
    "preview_is_filtered",
    "Review workspace is local and read-only.",
    "Filtering the review preview does not change the full packet.",
    "No packet is stored, sent, shared, or persisted.",
  ]) {
    assert.ok(builder.includes(requiredText), `builder must include ${requiredText}`);
  }

  assert.doesNotMatch(
    builder,
    /\b(?:openDatabase|INSERT|UPDATE|DELETE|CREATE TABLE|ALTER TABLE|DROP TABLE|db\.prepare|db\.exec)\b/i,
    "review helper must not open DB, write rows, or mutate schema",
  );
  assert.doesNotMatch(builder, /\bfetch\s*\(/, "review helper must not fetch");
  assert.doesNotMatch(
    builder,
    /\bmanual_note_text\s*:/,
    "review helper must not include raw manual note text fields",
  );
}

function assertUi() {
  for (const requiredText of [
    "Packet review workspace",
    "ReadinessPacketReviewWorkspace",
    "Review workspace is local and read-only.",
    "Packet review controls are local UI state only.",
    "Filtering the review preview does not change the full packet.",
    "No packet is stored, sent, shared, or persisted.",
    "Copy actions remain local clipboard only.",
    "No proof/evidence, Perspective, work item, provider, retrieval, source-fetch, Codex, or handoff action is run.",
    "Markdown",
    "JSON",
    "Summary",
    "Full",
    "All",
    "Block",
    "Warning",
    "Pass",
    "Section visibility",
    "visible sections",
    "hidden sections",
    "visible gates",
    "hidden gates",
    "preview character count",
    "preview_is_filtered",
    "Read-only readiness packet review preview",
    "Current preview differs from the last copied packet. Copy a fresh",
    "Copy human review packet",
    "Copy JSON packet",
    "Packet freshness status",
    "No packet copied yet",
    "Current",
    "Stale",
    "Unavailable",
    "Gate explanations",
    "Promotion readiness preflight",
    "CockpitStartupReadinessReadout",
  ]) {
    assert.ok(component.includes(requiredText), `UI must include ${requiredText}`);
  }

  for (const requiredCss of [
    "manual-note-readiness-packet-review-workspace",
    "manual-note-readiness-packet-review-controls",
    "manual-note-readiness-packet-review-sections",
    "manual-note-readiness-packet-review-preview",
    "manual-note-readiness-packet-review-counts",
    "manual-note-readiness-packet-review-status-row",
  ]) {
    assert.ok(css.includes(requiredCss), `CSS must include ${requiredCss}`);
  }

  assert.ok(
    startupReadiness.includes("Startup readiness"),
    "Startup readiness readout component must remain present",
  );
}

function assertForbiddenPatternsAbsent() {
  const helperAndComponent = `${builder}\n${copyPacketPanel}\n${reviewWorkspace}`;

  assert.doesNotMatch(
    helperAndComponent,
    /from\s+["'][^"']*(?:openai|provider|retrieval|rag|source-fetch|crawler|scraper|embedding|vector|codex|proof|evidence|work-item|promotion)[^"']*["']/i,
    "helper/component must not import provider/retrieval/source/proof/evidence/work/Codex modules",
  );
  assert.doesNotMatch(
    helperAndComponent,
    /\b(?:INSERT INTO|UPDATE\s+\w|DELETE FROM|CREATE TABLE|ALTER TABLE|DROP TABLE|db\.prepare|db\.exec)\b/i,
    "helper/component must not write storage or mutate schema",
  );

  for (const forbiddenStoragePattern of [
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "document.cookie",
  ]) {
    assert.ok(
      !component.includes(forbiddenStoragePattern),
      `UI must not use ${forbiddenStoragePattern}`,
    );
  }

  for (const forbiddenText of ["download", "Download", "file export", "File export"]) {
    assert.ok(
      !helperAndComponent.includes(forbiddenText),
      `review workspace must not add download/file export text: ${forbiddenText}`,
    );
  }

  for (const forbiddenButtonLabel of [
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
      component,
      new RegExp(`>\\s*${escapeRegExp(forbiddenButtonLabel)}\\s*<`, "i"),
      `UI must not add forbidden button ${forbiddenButtonLabel}`,
    );
  }

  assert.ok(
    sharedRuntime.includes("packet_fingerprint_persisted: false"),
    "staleness boundary must remain present",
  );
}

function assertDocsAndPackagePointers() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-preview-draft-readiness-packet-review-workspace-v0-1"
    ],
    "node scripts/smoke-research-candidate-preview-draft-readiness-packet-review-workspace-v0-1.mjs",
    "package script must point to review workspace smoke",
  );

  for (const requiredText of [
    "readiness packet review workspace",
    "Packet review workspace",
    "Markdown / JSON",
    "Summary / Full",
    "All / Block / Warning / Pass",
    "section visibility",
    "visible section/gate counts",
    "preview character count",
    "local UI state only",
    "filtering review preview does not change the full packet",
    "no packet is stored, sent, shared, or persisted",
    "smoke:research-candidate-preview-draft-readiness-packet-review-workspace-v0-1",
  ]) {
    assert.ok(index.includes(requiredText), `docs index must include ${requiredText}`);
  }
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
