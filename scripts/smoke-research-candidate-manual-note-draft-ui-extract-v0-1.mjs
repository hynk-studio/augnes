import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const manualPanelPath =
  "components/research-candidate-manual-note-preview-panel.tsx";
const draftListPanelPath =
  "components/research-candidate-preview-draft-list-panel.tsx";
const draftCardPath = "components/research-candidate-preview-draft-card.tsx";
const labelControlsPath =
  "components/research-candidate-preview-draft-label-controls.tsx";
const activityReadoutPath =
  "components/research-candidate-preview-draft-activity-readout.tsx";
const metadataReadoutPath =
  "components/research-candidate-preview-draft-metadata-readout.tsx";
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
const preflightReadoutPath =
  "components/research-candidate-promotion-readiness-preflight-readout.tsx";
const localChecklistPath =
  "components/research-candidate-local-packet-review-checklist.tsx";
const startupReadinessPath = "components/cockpit-startup-readiness-readout.tsx";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const smokePath =
  "scripts/smoke-research-candidate-manual-note-draft-ui-extract-v0-1.mjs";

for (const filePath of [
  manualPanelPath,
  draftListPanelPath,
  draftCardPath,
  labelControlsPath,
  activityReadoutPath,
  metadataReadoutPath,
  formatHintPath,
  resultSummaryPath,
  warningDisplayPath,
  sourceReferenceListPath,
  candidateFamilyListsPath,
  authorityFlagsPath,
  copyPacketPanelPath,
  reviewWorkspacePath,
  gateExplanationsPath,
  preflightReadoutPath,
  localChecklistPath,
  startupReadinessPath,
  indexPath,
  packagePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const manualPanel = readFileSync(manualPanelPath, "utf8");
const draftListPanel = readFileSync(draftListPanelPath, "utf8");
const draftCard = readFileSync(draftCardPath, "utf8");
const labelControls = readFileSync(labelControlsPath, "utf8");
const activityReadout = readFileSync(activityReadoutPath, "utf8");
const metadataReadout = readFileSync(metadataReadoutPath, "utf8");
const formatHint = readFileSync(formatHintPath, "utf8");
const resultSummary = readFileSync(resultSummaryPath, "utf8");
const warningDisplay = readFileSync(warningDisplayPath, "utf8");
const sourceReferenceList = readFileSync(sourceReferenceListPath, "utf8");
const candidateFamilyLists = readFileSync(candidateFamilyListsPath, "utf8");
const authorityFlags = readFileSync(authorityFlagsPath, "utf8");
const copyPacketPanel = readFileSync(copyPacketPanelPath, "utf8");
const reviewWorkspace = readFileSync(reviewWorkspacePath, "utf8");
const gateExplanations = readFileSync(gateExplanationsPath, "utf8");
const preflightReadout = readFileSync(preflightReadoutPath, "utf8");
const localChecklist = readFileSync(localChecklistPath, "utf8");
const startupReadiness = readFileSync(startupReadinessPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

const extractedDraftUi = [
  draftListPanel,
  draftCard,
  labelControls,
  activityReadout,
  metadataReadout,
].join("\n");
const preservedReadinessUi = [
  manualPanel,
  formatHint,
  resultSummary,
  warningDisplay,
  sourceReferenceList,
  candidateFamilyLists,
  authorityFlags,
  copyPacketPanel,
  reviewWorkspace,
  gateExplanations,
  preflightReadout,
  localChecklist,
  startupReadiness,
].join("\n");
const fullUiSurface = `${manualPanel}\n${extractedDraftUi}\n${preservedReadinessUi}`;

assertExtraction();
assertDraftListAndCardUi();
assertLabelAndActivityUi();
assertPreservedReadinessUi();
assertForbiddenPatternsAbsent();
assertDocsAndPackagePointers();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-manual-note-draft-ui-extract-v0-1",
      extracted_components_checked: true,
      draft_list_card_label_activity_checked: true,
      metadata_readout_checked: true,
      preserved_readiness_ui_checked: true,
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
    "research-candidate-preview-draft-list-panel",
    "research-candidate-preview-draft-activity-readout",
    "research-candidate-preview-draft-metadata-readout",
  ]) {
    assert.ok(
      manualPanel.includes(requiredImport),
      `manual panel must import ${requiredImport}`,
    );
  }

  for (const requiredRender of [
    "<RecentPreviewDraftsPanel",
    "<PreviewDraftActivityReadout",
    "<RuntimeMetadataSummary",
    "<RuntimeBoundarySummary",
  ]) {
    assert.ok(
      manualPanel.includes(requiredRender),
      `manual panel must render ${requiredRender}`,
    );
  }

  for (const removedInlineDefinition of [
    "function RecentPreviewDraftsPanel(",
    "function PreviewDraftActivityReadout(",
    "function PreviewDraftActivityItemCard(",
    "function RuntimeMetadataSummary(",
    "function RuntimeBoundarySummary(",
    "function PreviewDraftListSummaryBadges(",
  ]) {
    assert.ok(
      !manualPanel.includes(removedInlineDefinition),
      `manual panel must not define ${removedInlineDefinition} inline`,
    );
  }

  assert.ok(
    draftListPanel.includes("export function RecentPreviewDraftsPanel"),
    "draft list panel component must exist",
  );
  assert.ok(
    draftCard.includes("export function PreviewDraftCard"),
    "draft card component must exist",
  );
  assert.ok(
    labelControls.includes("export function PreviewDraftLabelControls"),
    "label controls component must exist",
  );
  assert.ok(
    activityReadout.includes("export function PreviewDraftActivityReadout"),
    "activity readout component must exist",
  );
  assert.ok(
    metadataReadout.includes("export function RuntimeMetadataSummary") &&
      metadataReadout.includes("export function RuntimeBoundarySummary"),
    "metadata readout component must export runtime metadata and boundary summaries",
  );
  assert.ok(
    draftListPanel.includes("<PreviewDraftCard"),
    "draft list panel must render draft cards",
  );
  assert.ok(
    draftCard.includes("<PreviewDraftLabelControls"),
    "draft card must render extracted label controls",
  );

  const manualPanelLineCount = manualPanel.split("\n").length;
  assert.ok(
    manualPanelLineCount < 2974,
    `manual panel line count should be below pre-PR baseline 2974, got ${manualPanelLineCount}`,
  );
}

function assertDraftListAndCardUi() {
  for (const requiredText of [
    "Recent runtime preview drafts",
    "Refresh preview drafts",
    "Lifecycle filter",
    "Sort order",
    "Warning filter",
    "Candidate filter",
    "Limit selector",
    "DRAFT_LIST_LIMIT_OPTIONS = [10, 25, 50]",
    "No active runtime preview drafts yet.",
    "No preview drafts match the current filters.",
    "Stored parsed preview only. Raw note text not stored.",
    "non-canonical preview drafts only",
    "Counts are preview-list metadata only.",
    "Counts do not approve, reject, defer, promote, or canonize drafts.",
    "Activity count is lifecycle metadata, not proof or evidence.",
    "Open preview draft",
    "Discard preview draft",
    "Confirm discard preview draft",
    "Cancel discard",
    "Active preview draft",
    "Discarded preview draft",
    "Labeled",
    "Untitled",
    "Activity count",
    "Last activity:",
    "Warnings",
    "Candidates",
    "input_fingerprint",
    "parser_version",
    "preview_version",
    "lifecycle_status",
  ]) {
    assert.ok(
      extractedDraftUi.includes(requiredText),
      `extracted draft UI must include ${requiredText}`,
    );
  }
}

function assertLabelAndActivityUi() {
  for (const requiredText of [
    "Untitled preview draft",
    "generated fallback label",
    "label-only metadata",
    "Edit label",
    "Save label",
    "Cancel",
    "Clear label",
    "Saving label...",
    "MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH",
    "Labels are operator-facing preview metadata only.",
    "Label editing is metadata-only, including discarded preview drafts.",
    "Preview draft activity",
    "Load activity",
    "Refresh activity",
    "Loading activity...",
    "Activity is preview-draft metadata only.",
    "Activity does not approve, reject, defer, promote, or canonize this draft.",
    "Raw note text is not stored or recoverable.",
    "No activity metadata recorded for this preview draft yet.",
    "Open/load activity is not persisted as an activity row.",
    "metadata-only",
    "Created preview draft",
    "Label updated",
    "Label cleared",
    "Discarded preview draft",
    "Runtime preview draft metadata",
    "Stored preview draft metadata",
    "Runtime boundary",
    "Stored creation boundary",
  ]) {
    assert.ok(
      extractedDraftUi.includes(requiredText),
      `extracted label/activity UI must include ${requiredText}`,
    );
  }
}

function assertPreservedReadinessUi() {
  for (const requiredText of [
    "CockpitStartupReadinessReadout",
    "Startup readiness",
    "Promotion readiness preflight",
    "Gate explanations",
    "Readiness copy packet",
    "Copy human review packet",
    "Copy JSON packet",
    "Packet freshness status",
    "Packet review workspace",
    "Local packet review checklist",
    "Clear local note",
    "Clear runtime result",
    "Parser warning summary",
    "ClaimCandidateList",
    "EvidenceCandidateList",
    "id=\"research-candidate-manual-note-boundary\"",
  ]) {
    assert.ok(
      fullUiSurface.includes(requiredText),
      `preserved UI must include ${requiredText}`,
    );
  }
}

function assertForbiddenPatternsAbsent() {
  for (const source of [
    draftListPanel,
    draftCard,
    labelControls,
    activityReadout,
    metadataReadout,
  ]) {
    assert.doesNotMatch(
      source,
      /from\s+["'][^"']*(?:db|store|route|openai|provider|retrieval|rag|source-fetch|crawler|scraper|embedding|vector|codex|proof|evidence|work-item|promotion)[^"']*["']/i,
      "extracted UI components must not import DB/store/routes/provider/retrieval/source/proof/evidence/work/Codex modules",
    );
    assert.doesNotMatch(
      source,
      /\b(?:INSERT INTO|UPDATE\s+\w|DELETE FROM|CREATE TABLE|ALTER TABLE|DROP TABLE|schema\.sql|db\.prepare|db\.exec|seed)\b/i,
      "extracted UI components must not write storage, mutate schema, or seed data",
    );
  }

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

  for (const forbiddenButtonText of [
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
    "Save checklist",
    "Submit checklist",
    "Approve checklist",
    "Complete review",
    "Download",
    "file export",
  ]) {
    assert.ok(
      !fullUiSurface.includes(forbiddenButtonText),
      `UI must not add forbidden action button text: ${forbiddenButtonText}`,
    );
  }
}

function assertDocsAndPackagePointers() {
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-manual-note-draft-ui-extract-v0-1"
    ],
    "node scripts/smoke-research-candidate-manual-note-draft-ui-extract-v0-1.mjs",
    "package script must point to extraction smoke",
  );
  assert.ok(
    index.includes("smoke:research-candidate-manual-note-draft-ui-extract-v0-1"),
    "docs index must mention extraction smoke",
  );
  assert.ok(
    index.includes("research-candidate-preview-draft-list-panel.tsx") &&
      index.includes("research-candidate-preview-draft-activity-readout.tsx"),
    "docs index must mention extracted draft UI components",
  );
}
