import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const manualPanelPath =
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
const draftListPanelPath =
  "components/research-candidate-preview-draft-list-panel.tsx";
const draftCardPath = "components/research-candidate-preview-draft-card.tsx";
const labelControlsPath =
  "components/research-candidate-preview-draft-label-controls.tsx";
const activityReadoutPath =
  "components/research-candidate-preview-draft-activity-readout.tsx";
const metadataReadoutPath =
  "components/research-candidate-preview-draft-metadata-readout.tsx";
const copyPacketPanelPath =
  "components/research-candidate-readiness-copy-packet-panel.tsx";
const reviewWorkspacePath =
  "components/research-candidate-readiness-packet-review-workspace.tsx";
const gateExplanationsPath =
  "components/research-candidate-promotion-readiness-gate-explanations.tsx";
const localChecklistPath =
  "components/research-candidate-local-packet-review-checklist.tsx";
const startupReadinessPath = "components/cockpit-startup-readiness-readout.tsx";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const smokePath =
  "scripts/smoke-research-candidate-manual-note-candidate-display-extract-v0-1.mjs";

for (const filePath of [
  manualPanelPath,
  formatHintPath,
  resultSummaryPath,
  warningDisplayPath,
  sourceReferenceListPath,
  candidateFamilyListsPath,
  authorityFlagsPath,
  draftListPanelPath,
  draftCardPath,
  labelControlsPath,
  activityReadoutPath,
  metadataReadoutPath,
  copyPacketPanelPath,
  reviewWorkspacePath,
  gateExplanationsPath,
  localChecklistPath,
  startupReadinessPath,
  indexPath,
  packagePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const manualPanel = readFileSync(manualPanelPath, "utf8");
const formatHint = readFileSync(formatHintPath, "utf8");
const resultSummary = readFileSync(resultSummaryPath, "utf8");
const warningDisplay = readFileSync(warningDisplayPath, "utf8");
const sourceReferenceList = readFileSync(sourceReferenceListPath, "utf8");
const candidateFamilyLists = readFileSync(candidateFamilyListsPath, "utf8");
const authorityFlags = readFileSync(authorityFlagsPath, "utf8");
const draftListPanel = readFileSync(draftListPanelPath, "utf8");
const draftCard = readFileSync(draftCardPath, "utf8");
const labelControls = readFileSync(labelControlsPath, "utf8");
const activityReadout = readFileSync(activityReadoutPath, "utf8");
const metadataReadout = readFileSync(metadataReadoutPath, "utf8");
const copyPacketPanel = readFileSync(copyPacketPanelPath, "utf8");
const reviewWorkspace = readFileSync(reviewWorkspacePath, "utf8");
const gateExplanations = readFileSync(gateExplanationsPath, "utf8");
const localChecklist = readFileSync(localChecklistPath, "utf8");
const startupReadiness = readFileSync(startupReadinessPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

const candidateDisplayUi = [
  formatHint,
  resultSummary,
  warningDisplay,
  sourceReferenceList,
  candidateFamilyLists,
  authorityFlags,
].join("\n");
const fullUiSurface = [
  manualPanel,
  candidateDisplayUi,
  draftListPanel,
  draftCard,
  labelControls,
  activityReadout,
  metadataReadout,
  copyPacketPanel,
  reviewWorkspace,
  gateExplanations,
  localChecklist,
  startupReadiness,
].join("\n");

assertExtraction();
assertCandidateDisplayUi();
assertPreservedExistingUi();
assertForbiddenPatternsAbsent();
assertDocsAndPackagePointers();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-manual-note-candidate-display-extract-v0-1",
      extracted_components_checked: true,
      candidate_display_checked: true,
      parent_inline_definitions_removed: true,
      preserved_existing_ui_checked: true,
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
    "research-candidate-manual-note-format-hint",
    "research-candidate-manual-note-result-summary",
    "research-candidate-manual-note-warning-display",
    "research-candidate-manual-note-source-reference-list",
    "research-candidate-manual-note-candidate-family-lists",
    "research-candidate-manual-note-authority-flags",
  ]) {
    assert.ok(
      manualPanel.includes(requiredImport),
      `manual panel must import ${requiredImport}`,
    );
  }

  for (const requiredRender of [
    "<ManualNoteFormatHint",
    "<ManualNoteResultSummary",
    "<ManualNoteSessionSummary",
    "<ParserWarningSummary",
    "<ParserWarningsList",
    "<SourceReferenceList",
    "<ClaimCandidateList",
    "<EvidenceCandidateList",
    "<TensionCandidateList",
    "<KnowledgeGapCandidateList",
    "<PerspectiveDeltaCandidateList",
    "<FollowUpWorkCandidateList",
    "<BooleanFlagGrid",
  ]) {
    assert.ok(
      manualPanel.includes(requiredRender),
      `manual panel must render ${requiredRender}`,
    );
  }

  for (const removedInlineDefinition of [
    "function ManualNoteFormatHint(",
    "function ManualNoteResultSummary(",
    "function ParserWarningSummary(",
    "function ParserWarningsList(",
    "function SourceReferenceList(",
    "function ClaimCandidateList(",
    "function EvidenceCandidateList(",
    "function TensionCandidateList(",
    "function KnowledgeGapCandidateList(",
    "function PerspectiveDeltaCandidateList(",
    "function FollowUpWorkCandidateList(",
    "function CandidateCount(",
    "function BooleanFlagGrid(",
    "function formatCandidateSourceRefs(",
  ]) {
    assert.ok(
      !manualPanel.includes(removedInlineDefinition),
      `manual panel must not define ${removedInlineDefinition} inline`,
    );
  }

  assert.ok(
    formatHint.includes("export function ManualNoteFormatHint"),
    "format hint component must exist",
  );
  assert.ok(
    resultSummary.includes("export function ManualNoteResultSummary") &&
      resultSummary.includes("function CandidateCount"),
    "result summary component must contain summary and candidate count display",
  );
  assert.ok(
    warningDisplay.includes("export function ParserWarningSummary") &&
      warningDisplay.includes("export function ParserWarningsList"),
    "warning display component must contain both warning views",
  );
  assert.ok(
    sourceReferenceList.includes("export function SourceReferenceList"),
    "source reference list component must exist",
  );
  assert.ok(
    candidateFamilyLists.includes("export function ClaimCandidateList") &&
      candidateFamilyLists.includes("export function FollowUpWorkCandidateList"),
    "candidate family list component must contain candidate families",
  );
  assert.ok(
    authorityFlags.includes("export function BooleanFlagGrid"),
    "authority flags component must exist",
  );

  const manualPanelLineCount = manualPanel.split("\n").length;
  assert.ok(
    manualPanelLineCount < 2007,
    `manual panel line count should be below post-#655 baseline 2007, got ${manualPanelLineCount}`,
  );
}

function assertCandidateDisplayUi() {
  for (const requiredText of [
    "How to format a note",
    "Use one prefix per line.",
    "Research Question:",
    "Operator Intent:",
    "Source Title:",
    "Claim:",
    "Evidence:",
    "Tension:",
    "Gap:",
    "Perspective Delta:",
    "Next:",
    "files:",
    "checks:",
    "Parse result summary",
    "parser_version",
    "preview_status",
    "local_parse_count",
    "research_session_preview",
    "source refs",
    "Manual note parser candidate counts",
    "Claims",
    "Evidence",
    "Tensions",
    "Knowledge gaps",
    "Perspective deltas",
    "Follow-up work",
    "Parser warning summary",
    "warnings",
    "No parser warnings.",
    "source_reference_previews",
    "No source refs parsed.",
    "authors_or_origin",
    "identifier_or_url",
    "reference_source",
    "source_status",
    "claim_candidates",
    "evidence_candidates",
    "tension_candidates",
    "knowledge_gap_candidates",
    "perspective_delta_candidates",
    "follow_up_work_candidates",
    "No claim candidates parsed.",
    "No evidence candidates parsed.",
    "No tension candidates parsed.",
    "No knowledge gap candidates parsed.",
    "No perspective delta candidates parsed.",
    "No follow-up work candidates parsed.",
    "review_status",
    "epistemic_status",
    "source_refs",
    "promotion_readiness",
    "Parser authority",
    "Preview authority",
  ]) {
    assert.ok(
      fullUiSurface.includes(requiredText),
      `candidate display UI must include ${requiredText}`,
    );
  }
}

function assertPreservedExistingUi() {
  for (const requiredText of [
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
    "Copy human review packet",
    "Copy JSON packet",
    "Packet review workspace",
    "Local packet review checklist",
    "Clear local note",
    "Clear runtime result",
    "id=\"research-candidate-manual-note-boundary\"",
  ]) {
    assert.ok(
      fullUiSurface.includes(requiredText),
      `existing UI must retain ${requiredText}`,
    );
  }
}

function assertForbiddenPatternsAbsent() {
  for (const source of [
    formatHint,
    resultSummary,
    warningDisplay,
    sourceReferenceList,
    candidateFamilyLists,
    authorityFlags,
  ]) {
    assert.doesNotMatch(
      source,
      /from\s+["'][^"']*(?:db|store|route|openai|provider|retrieval|rag|source-fetch|crawler|scraper|embedding|vector|codex|proof|evidence|work-item|promotion)[^"']*["']/i,
      "extracted candidate display components must not import DB/store/routes/provider/retrieval/source/proof/evidence/work/Codex modules",
    );
    assert.doesNotMatch(
      source,
      /\b(?:INSERT INTO|UPDATE\s+\w|DELETE FROM|CREATE TABLE|ALTER TABLE|DROP TABLE|schema\.sql|db\.prepare|db\.exec|seed)\b/i,
      "extracted candidate display components must not write storage, mutate schema, or seed data",
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
      "smoke:research-candidate-manual-note-candidate-display-extract-v0-1"
    ],
    "node scripts/smoke-research-candidate-manual-note-candidate-display-extract-v0-1.mjs",
    "package script must point to candidate display extraction smoke",
  );
  assert.ok(
    index.includes(
      "smoke:research-candidate-manual-note-candidate-display-extract-v0-1",
    ),
    "docs index must mention candidate display extraction smoke",
  );
  assert.ok(
    index.includes("research-candidate-manual-note-candidate-family-lists.tsx") &&
      index.includes("research-candidate-manual-note-warning-display.tsx"),
    "docs index must mention extracted candidate display components",
  );
}
