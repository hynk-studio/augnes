import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const manualPanelPath =
  "components/research-candidate-manual-note-preview-panel.tsx";
const runtimeHookPath =
  "components/use-research-candidate-manual-note-preview-runtime.ts";
const draftListPanelPath =
  "components/research-candidate-preview-draft-list-panel.tsx";
const draftCardPath = "components/research-candidate-preview-draft-card.tsx";
const labelControlsPath =
  "components/research-candidate-preview-draft-label-controls.tsx";
const metadataReadoutPath =
  "components/research-candidate-preview-draft-metadata-readout.tsx";
const activityReadoutPath =
  "components/research-candidate-preview-draft-activity-readout.tsx";
const preflightReadoutPath =
  "components/research-candidate-promotion-readiness-preflight-readout.tsx";
const copyPacketPanelPath =
  "components/research-candidate-readiness-copy-packet-panel.tsx";
const localChecklistPath =
  "components/research-candidate-local-packet-review-checklist.tsx";
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
const startupReadinessPath = "components/cockpit-startup-readiness-readout.tsx";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const smokePath =
  "scripts/smoke-research-candidate-manual-note-runtime-hook-extract-v0-1.mjs";

for (const filePath of [
  manualPanelPath,
  runtimeHookPath,
  draftListPanelPath,
  draftCardPath,
  labelControlsPath,
  metadataReadoutPath,
  activityReadoutPath,
  preflightReadoutPath,
  copyPacketPanelPath,
  localChecklistPath,
  formatHintPath,
  resultSummaryPath,
  warningDisplayPath,
  sourceReferenceListPath,
  candidateFamilyListsPath,
  authorityFlagsPath,
  startupReadinessPath,
  indexPath,
  packagePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const manualPanel = readFileSync(manualPanelPath, "utf8");
const runtimeHook = readFileSync(runtimeHookPath, "utf8");
const fullUiSurface = [
  manualPanel,
  runtimeHook,
  readFileSync(draftListPanelPath, "utf8"),
  readFileSync(draftCardPath, "utf8"),
  readFileSync(labelControlsPath, "utf8"),
  readFileSync(metadataReadoutPath, "utf8"),
  readFileSync(activityReadoutPath, "utf8"),
  readFileSync(preflightReadoutPath, "utf8"),
  readFileSync(copyPacketPanelPath, "utf8"),
  readFileSync(localChecklistPath, "utf8"),
  readFileSync(formatHintPath, "utf8"),
  readFileSync(resultSummaryPath, "utf8"),
  readFileSync(warningDisplayPath, "utf8"),
  readFileSync(sourceReferenceListPath, "utf8"),
  readFileSync(candidateFamilyListsPath, "utf8"),
  readFileSync(authorityFlagsPath, "utf8"),
  readFileSync(startupReadinessPath, "utf8"),
].join("\n");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertHookExistsAndOwnsRouteState();
assertManualPanelShell();
assertRouteOrchestrationMoved();
assertSameOriginRuntimeBoundaries();
assertPreservedUiWiring();
assertForbiddenPatternsAbsent();
assertDocsAndPackagePointers();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-manual-note-runtime-hook-extract-v0-1",
      hook_exists: true,
      hook_owns_runtime_route_state: true,
      parent_local_parser_preserved: true,
      parent_inline_route_handlers_removed: true,
      same_origin_route_constants_checked: true,
      preserved_ui_surfaces_checked: true,
      forbidden_patterns_absent: true,
      docs_pointer_checked: true,
      package_script_checked: true,
      manual_panel_line_count: manualPanel.split("\n").length,
    },
    null,
    2,
  ),
);

function assertHookExistsAndOwnsRouteState() {
  assert.match(
    runtimeHook,
    /export function useResearchCandidateManualNotePreviewRuntime\(/,
    "hook must export useResearchCandidateManualNotePreviewRuntime",
  );
  assert.match(runtimeHook, /"use client";/, "hook must be client-compatible");

  for (const requiredText of [
    "runtimeState",
    "draftListState",
    "openedDraftState",
    "discardState",
    "labelState",
    "activityState",
    "preflightState",
    "actions",
    "filterActions",
    "createRuntimePreviewDraft",
    "refreshPreviewDrafts",
    "openPreviewDraft",
    "discardPreviewDraft",
    "cancelDiscardPreviewDraft",
    "startDraftLabelEdit",
    "updateDraftLabelEditValue",
    "saveDraftLabel",
    "cancelDraftLabelEdit",
    "clearDraftLabelEditValue",
    "loadPreviewDraftActivity",
    "loadPromotionReadinessPreflight",
    "clearRuntimeResult",
    "resetRuntimeDraftState",
    "updateDraftLifecycleFilter",
    "updateDraftSort",
    "updateDraftWarningFilter",
    "updateDraftCandidateFilter",
    "updateDraftListLimit",
  ]) {
    assert.ok(runtimeHook.includes(requiredText), `hook must include ${requiredText}`);
  }

  for (const routeText of [
    "MANUAL_NOTE_PREVIEW_ROUTE",
    "MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE",
    "buildManualNotePreviewDraftDetailRoute(previewDraftId)",
    "buildManualNotePreviewDraftDiscardRoute(previewDraftId)",
    "buildManualNotePreviewDraftLabelRoute(previewDraftId)",
    "buildManualNotePreviewDraftActivityRoute(previewDraftId)",
    "buildManualNotePreviewDraftPromotionReadinessRoute(previewDraftId)",
    "persist_preview_draft: true",
    "operator_note_label: cleanOperatorPreviewLabel",
    "discard_reason:",
  ]) {
    assert.ok(runtimeHook.includes(routeText), `hook route orchestration must include ${routeText}`);
  }
}

function assertManualPanelShell() {
  assert.match(
    manualPanel,
    /import \{ useResearchCandidateManualNotePreviewRuntime \} from "@\/components\/use-research-candidate-manual-note-preview-runtime";/,
    "manual panel must import the runtime hook",
  );
  assert.match(
    manualPanel,
    /const manualNoteRuntime = useResearchCandidateManualNotePreviewRuntime\(\);/,
    "manual panel must call the hook once",
  );
  assert.match(
    manualPanel,
    /parseManualResearchNoteToPreview\(manualNoteText\)/,
    "manual panel must still own direct local parser execution",
  );
  assert.match(
    manualPanel,
    /onSubmit=\{parseManualNote\}/,
    "manual panel must keep local parse form submit",
  );
  assert.match(
    manualPanel,
    /const \[manualNoteText, setManualNoteText\] = useState\(""\);/,
    "manual panel must own manual note textarea state",
  );
  assert.match(
    manualPanel,
    /const \[operatorPreviewLabel, setOperatorPreviewLabel\] = useState\(""\);/,
    "manual panel must own operator preview label input state",
  );
  assert.match(
    manualPanel,
    /const \[parseCount, setParseCount\] = useState\(0\);/,
    "manual panel must own local parse count state",
  );
  assert.ok(
    manualPanel.split("\n").length < 1057,
    "manual panel should be lower than post-#657 baseline of 1057 lines",
  );
}

function assertRouteOrchestrationMoved() {
  for (const forbiddenInlineDefinition of [
    "async function createRuntimePreviewDraft(",
    "async function refreshPreviewDrafts(",
    "async function openPreviewDraft(",
    "async function discardPreviewDraft(",
    "async function saveDraftLabel(",
    "async function loadPreviewDraftActivity(",
    "async function loadPromotionReadinessPreflight(",
    "function updateDraftLifecycleFilter(",
    "function updateDraftSort(",
    "function updateDraftWarningFilter(",
    "function updateDraftCandidateFilter(",
    "function updateDraftListLimit(",
    "function startDraftLabelEdit(",
    "function updateDraftLabelEditValue(",
    "function cancelDraftLabelEdit(",
    "function clearDraftLabelEditValue(",
    "function clearRuntimeResult(",
  ]) {
    assert.ok(
      !manualPanel.includes(forbiddenInlineDefinition),
      `manual panel must not define ${forbiddenInlineDefinition}`,
    );
  }

  assert.doesNotMatch(
    manualPanel,
    /\bfetch\s*\(/,
    "manual panel must not contain route fetch calls after hook extraction",
  );
  assert.doesNotMatch(
    manualPanel,
    /buildManualNotePreviewDraft(?:Detail|Discard|Label|Activity|PromotionReadiness)Route/,
    "manual panel must not call preview draft route builders directly",
  );
}

function assertSameOriginRuntimeBoundaries() {
  assert.match(
    runtimeHook,
    /fetch\(MANUAL_NOTE_PREVIEW_ROUTE,/,
    "hook must post create to the same-origin route constant",
  );
  assert.match(
    runtimeHook,
    /`\$\{MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE\}\?\$\{params\.toString\(\)\}`/,
    "hook must list drafts with the same-origin list route constant",
  );
  assert.doesNotMatch(
    runtimeHook,
    /\bfetch\s*\(\s*["'`]https?:\/\//i,
    "hook must not fetch external URLs",
  );
  assert.doesNotMatch(
    runtimeHook,
    /\bXMLHttpRequest\b|EventSource\b|WebSocket\b|navigator\.sendBeacon\b/i,
    "hook must not add alternate external transport",
  );
}

function assertPreservedUiWiring() {
  for (const requiredText of [
    "CockpitStartupReadinessReadout",
    "Use sample note",
    "Operator preview label",
    "Parse locally",
    "Create runtime preview draft",
    "Clear local note",
    "Clear runtime result",
    "RecentPreviewDraftsPanel",
    "Recent runtime preview drafts",
    "Refresh preview drafts",
    "Lifecycle filter",
    "Sort order",
    "Warning filter",
    "Candidate filter",
    "Limit selector",
    "Open preview draft",
    "Discard preview draft",
    "Edit label",
    "Save label",
    "Clear label",
    "PreviewDraftActivityReadout",
    "Load activity",
    "Refresh activity",
    "PromotionReadinessPreflightReadout",
    "Promotion readiness preflight",
    "ReadinessCopyPacketPanel",
    "Readiness copy packet",
    "Local packet review checklist",
    "ManualNoteFormatHint",
    "ManualNoteResultSummary",
    "ParserWarningSummary",
    "SourceReferenceList",
    "ClaimCandidateList",
    "EvidenceCandidateList",
    "TensionCandidateList",
    "KnowledgeGapCandidateList",
    "PerspectiveDeltaCandidateList",
    "FollowUpWorkCandidateList",
    "id=\"research-candidate-manual-note-boundary\"",
  ]) {
    assert.ok(fullUiSurface.includes(requiredText), `UI surface must preserve ${requiredText}`);
  }
}

function assertForbiddenPatternsAbsent() {
  for (const [filePath, source] of Object.entries({
    [runtimeHookPath]: runtimeHook,
    [manualPanelPath]: manualPanel,
  })) {
    assert.doesNotMatch(
      source,
      /localStorage|sessionStorage|indexedDB|document\.cookie/,
      `${filePath} must not use browser persistence`,
    );
    assert.doesNotMatch(
      source,
      /from ["'][^"']*(?:db|store|route|provider|openai|retriev|rag|source-fetch|crawler|scraper|embedding|vector|proof|evidence|work-item|perspective-promotion|execute-codex|handoff|mcp|plugin)[^"']*["']/i,
      `${filePath} must not import forbidden route/server/provider/authority modules`,
    );
    assert.doesNotMatch(
      source,
      /\buseReducer\b|\breducer\b|\bstateMachine\b|\bcreateMachine\b/i,
      `${filePath} must not introduce reducer/state-machine terminology`,
    );
  }

  for (const forbiddenText of [
    "schema.sql",
    "CREATE TABLE",
    "ALTER TABLE",
    "DROP TABLE",
    "INSERT INTO verification_evidence_records",
    "INSERT INTO work_items",
    "INSERT INTO perspective_memory_items",
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
    assert.ok(!runtimeHook.includes(forbiddenText), `hook must not include ${forbiddenText}`);
  }
}

function assertDocsAndPackagePointers() {
  assert.match(
    index,
    /smoke:research-candidate-manual-note-runtime-hook-extract-v0-1/,
    "docs index must point to runtime hook extraction smoke",
  );
  assert.match(
    index,
    /manual note runtime route orchestration hook extraction/i,
    "docs index must describe runtime hook extraction lane",
  );
  assert.equal(
    packageJson.scripts?.["smoke:research-candidate-manual-note-runtime-hook-extract-v0-1"],
    "node scripts/smoke-research-candidate-manual-note-runtime-hook-extract-v0-1.mjs",
    "package.json must expose runtime hook extraction smoke script",
  );
}
