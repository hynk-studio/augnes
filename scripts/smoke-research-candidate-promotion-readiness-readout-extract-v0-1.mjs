import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const manualPanelPath =
  "components/research-candidate-manual-note-preview-panel.tsx";
const preflightReadoutPath =
  "components/research-candidate-promotion-readiness-preflight-readout.tsx";
const gateExplanationsPath =
  "components/research-candidate-promotion-readiness-gate-explanations.tsx";
const copyPacketPanelPath =
  "components/research-candidate-readiness-copy-packet-panel.tsx";
const reviewWorkspacePath =
  "components/research-candidate-readiness-packet-review-workspace.tsx";
const localChecklistPath =
  "components/research-candidate-local-packet-review-checklist.tsx";
const startupReadinessPath = "components/cockpit-startup-readiness-readout.tsx";
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
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const smokePath =
  "scripts/smoke-research-candidate-promotion-readiness-readout-extract-v0-1.mjs";

for (const filePath of [
  manualPanelPath,
  preflightReadoutPath,
  gateExplanationsPath,
  copyPacketPanelPath,
  reviewWorkspacePath,
  localChecklistPath,
  startupReadinessPath,
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
  indexPath,
  packagePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const manualPanel = readFileSync(manualPanelPath, "utf8");
const preflightReadout = readFileSync(preflightReadoutPath, "utf8");
const gateExplanations = readFileSync(gateExplanationsPath, "utf8");
const copyPacketPanel = readFileSync(copyPacketPanelPath, "utf8");
const reviewWorkspace = readFileSync(reviewWorkspacePath, "utf8");
const localChecklist = readFileSync(localChecklistPath, "utf8");
const startupReadiness = readFileSync(startupReadinessPath, "utf8");
const candidateDisplayUi = [
  readFileSync(formatHintPath, "utf8"),
  readFileSync(resultSummaryPath, "utf8"),
  readFileSync(warningDisplayPath, "utf8"),
  readFileSync(sourceReferenceListPath, "utf8"),
  readFileSync(candidateFamilyListsPath, "utf8"),
  readFileSync(authorityFlagsPath, "utf8"),
].join("\n");
const draftUi = [
  readFileSync(draftListPanelPath, "utf8"),
  readFileSync(draftCardPath, "utf8"),
  readFileSync(labelControlsPath, "utf8"),
  readFileSync(activityReadoutPath, "utf8"),
  readFileSync(metadataReadoutPath, "utf8"),
].join("\n");
const fullUiSurface = [
  manualPanel,
  preflightReadout,
  gateExplanations,
  copyPacketPanel,
  reviewWorkspace,
  localChecklist,
  startupReadiness,
  candidateDisplayUi,
  draftUi,
].join("\n");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertExtraction();
assertPreflightReadoutUi();
assertPreservedUi();
assertForbiddenPatternsAbsent();
assertDocsAndPackagePointers();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-promotion-readiness-readout-extract-v0-1",
      preflight_readout_component_checked: true,
      parent_inline_preflight_removed: true,
      preflight_ui_checked: true,
      preserved_surfaces_checked: true,
      forbidden_patterns_absent: true,
      docs_pointer_checked: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertExtraction() {
  assert.match(
    preflightReadout,
    /export function PromotionReadinessPreflightReadout\(/,
    "preflight component must export PromotionReadinessPreflightReadout",
  );
  assert.match(
    manualPanel,
    /import \{ PromotionReadinessPreflightReadout \} from "@\/components\/research-candidate-promotion-readiness-preflight-readout"/,
    "manual panel must import extracted preflight readout",
  );
  assert.match(
    manualPanel,
    /<PromotionReadinessPreflightReadout\s/,
    "manual panel must render extracted preflight readout",
  );
  assert.doesNotMatch(
    manualPanel,
    /function PromotionReadinessPreflightReadout\(/,
    "manual panel must not define inline PromotionReadinessPreflightReadout",
  );
  assert.doesNotMatch(
    manualPanel,
    /function groupPromotionReadinessGates\(/,
    "manual panel must not define groupPromotionReadinessGates",
  );
  assert.doesNotMatch(
    manualPanel,
    /PROMOTION_READINESS_STATUS_LABELS/,
    "manual panel must not keep readout-only status labels",
  );

  const manualPanelLineCount = manualPanel.split("\n").length;
  assert.ok(
    manualPanelLineCount < 1402,
    `manual panel should be below post-#656 baseline of 1402 lines, got ${manualPanelLineCount}`,
  );
}

function assertPreflightReadoutUi() {
  for (const requiredText of [
    "Promotion readiness preflight",
    "Run preflight",
    "Refresh preflight",
    "Running preflight...",
    "This is a read-only preflight.",
    "Ready for promotion discussion is not promotion authority.",
    "readiness_status",
    "readiness_score",
    "lifecycle_status",
    "Blockers",
    "Warnings",
    "Next review steps",
    "Source summary",
    "Candidate summary",
    "Lifecycle summary",
    "runtime_boundary",
    "no_side_effects",
    "No source URLs are fetched",
    "No promotion, proof/evidence write, work",
    "item, retrieval, or Perspective update is created.",
  ]) {
    assert.ok(
      preflightReadout.includes(requiredText),
      `preflight readout must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "PromotionReadinessGateExplanations",
    "ReadinessCopyPacketPanel",
    "groupPromotionReadinessGates",
    "ManualNotePreviewDraftPromotionReadinessResponse",
    "ManualNotePreviewDraftActivityResponse",
    "ManualNotePreviewDraftDetailOkResponse",
  ]) {
    assert.ok(
      preflightReadout.includes(requiredText),
      `preflight readout must include ${requiredText}`,
    );
  }
}

function assertPreservedUi() {
  for (const requiredText of [
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
    "Gate explanations",
    "Readiness copy packet",
    "Copy human review packet",
    "Copy JSON packet",
    "Packet review workspace",
    "Local packet review checklist",
    "Parse result summary",
    "Parser warning summary",
    "source_reference_previews",
    "claim_candidates",
    "evidence_candidates",
    "tension_candidates",
    "knowledge_gap_candidates",
    "perspective_delta_candidates",
    "follow_up_work_candidates",
    "id=\"research-candidate-manual-note-boundary\"",
  ]) {
    assert.ok(fullUiSurface.includes(requiredText), `UI must preserve ${requiredText}`);
  }
}

function assertForbiddenPatternsAbsent() {
  for (const [filePath, source] of Object.entries({
    [preflightReadoutPath]: preflightReadout,
    [manualPanelPath]: manualPanel,
  })) {
    assert.doesNotMatch(
      source,
      /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|document\.cookie/,
      `${filePath} must not introduce browser persistence`,
    );
    assert.doesNotMatch(
      source,
      /from\s+["'][^"']*(?:db|store|route|openai|provider|retrieval|rag|source-fetch|crawler|scraper|embedding|vector|codex|proof|evidence|work-item)[^"']*["']/i,
      `${filePath} must not import DB/store/routes/provider/retrieval/source/proof/evidence/work/Codex modules`,
    );
    if (filePath === preflightReadoutPath) {
      assert.doesNotMatch(source, /\bfetch\(/, `${filePath} must not fetch`);
    }
    assert.doesNotMatch(source, /OPENAI_API_KEY|api\.openai\.com|new\s+OpenAI/i);
    assert.doesNotMatch(
      source,
      /\b(createProof|recordProof|createEvidence|recordEvidence|createWorkItem|executeCodex|runCodex|promoteCandidate|promotePerspective|approveCandidate|rejectCandidate|deferCandidate)\b/,
      `${filePath} must not add authority actions`,
    );
  }

  for (const forbiddenText of [
    "CREATE TABLE",
    "ALTER TABLE",
    "INSERT INTO",
    "UPDATE research_candidate_manual_note_preview_drafts",
    "DELETE FROM",
    "demo seed",
    "fake seed",
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
    assert.ok(
      !preflightReadout.includes(forbiddenText),
      `preflight readout must not include forbidden text ${forbiddenText}`,
    );
  }
}

function assertDocsAndPackagePointers() {
  assert.ok(
    index.includes(
      "Manual note promotion readiness preflight readout extraction",
    ),
    "docs index must mention preflight readout extraction",
  );
  assert.equal(
    packageJson.scripts[
      "smoke:research-candidate-promotion-readiness-readout-extract-v0-1"
    ],
    "node scripts/smoke-research-candidate-promotion-readiness-readout-extract-v0-1.mjs",
    "package script must point to preflight readout extraction smoke",
  );
}
