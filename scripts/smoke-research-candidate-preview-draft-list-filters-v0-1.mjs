import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const listRoutePath =
  "app/api/research-candidate-review/manual-note-preview-drafts/route.ts";
const sharedRuntimePath =
  "lib/research-candidate-review/manual-note-runtime-preview.ts";
const storePath =
  "lib/research-candidate-review/manual-note-preview-draft-store.ts";
const componentPath =
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
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const smokePath =
  "scripts/smoke-research-candidate-preview-draft-list-filters-v0-1.mjs";

for (const filePath of [
  listRoutePath,
  sharedRuntimePath,
  storePath,
  componentPath,
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

const listRoute = readFileSync(listRoutePath, "utf8");
const sharedRuntime = readFileSync(sharedRuntimePath, "utf8");
const store = readFileSync(storePath, "utf8");
const listStoreFunction = sliceBetween(
  store,
  "export function listResearchCandidateManualNotePreviewDrafts",
  "export function getResearchCandidateManualNotePreviewDraft",
);
const manualPanelComponent = readFileSync(componentPath, "utf8");
const draftUiComponent = [
  readFileSync(draftListPanelPath, "utf8"),
  readFileSync(draftCardPath, "utf8"),
  readFileSync(labelControlsPath, "utf8"),
  readFileSync(activityReadoutPath, "utf8"),
  readFileSync(metadataReadoutPath, "utf8"),
].join("\n");
const component = `${manualPanelComponent}\n${draftUiComponent}`;

const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertSharedContract();
assertListRouteQuerySupport();
assertStoreQuerySupport();
assertUiControls();
assertForbiddenPatternsAbsent();
assertDocsAndPackagePointers();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-preview-draft-list-filters-v0-1",
      lifecycle_filter_checked: true,
      sort_filter_checked: true,
      warnings_filter_checked: true,
      candidates_filter_checked: true,
      limit_validation_checked: true,
      include_discarded_compatibility_checked: true,
      response_shape_checked: true,
      ui_controls_checked: true,
      forbidden_patterns_absent: true,
      docs_pointer_checked: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertSharedContract() {
  for (const requiredText of [
    "ManualNotePreviewDraftListLifecycleFilter",
    '"active"',
    '"discarded"',
    '"all"',
    "ManualNotePreviewDraftListSort",
    '"created_desc"',
    '"created_asc"',
    "ManualNotePreviewDraftWarningFilter",
    '"with_warnings"',
    '"without_warnings"',
    "ManualNotePreviewDraftCandidateFilter",
    '"with_candidates"',
    '"without_candidates"',
    "ManualNotePreviewDraftListQuery",
    "limit: number",
    "lifecycle: ManualNotePreviewDraftListLifecycleFilter",
    "sort: ManualNotePreviewDraftListSort",
    "warnings: ManualNotePreviewDraftWarningFilter",
    "candidates: ManualNotePreviewDraftCandidateFilter",
    "include_discarded: boolean",
    '"invalid_lifecycle"',
    '"invalid_sort"',
    '"invalid_warnings"',
    '"invalid_candidates"',
  ]) {
    assert.ok(
      sharedRuntime.includes(requiredText),
      `shared runtime contract must include ${requiredText}`,
    );
  }
}

function assertListRouteQuerySupport() {
  for (const requiredText of [
    "parsePreviewDraftListLimit",
    "parseIncludeDiscarded",
    "parseLifecycle",
    "parseSort",
    "parseWarnings",
    "parseCandidates",
    "requestedIncludeDiscarded",
    'return includeDiscarded ? "all" : "active"',
    'errorCode: "invalid_lifecycle"',
    'errorCode: "invalid_sort"',
    'errorCode: "invalid_warnings"',
    'errorCode: "invalid_candidates"',
    "limit: query.limit",
    "lifecycle: query.lifecycle",
    "sort: query.sort",
    "warnings: query.warnings",
    "candidates: query.candidates",
    "include_discarded: query.include_discarded",
    "runtime_boundary",
    "no_side_effects",
  ]) {
    assert.ok(listRoute.includes(requiredText), `list route must include ${requiredText}`);
  }

  for (const routeValue of [
    '"active"',
    '"discarded"',
    '"all"',
    '"created_desc"',
    '"created_asc"',
    '"with_warnings"',
    '"without_warnings"',
    '"with_candidates"',
    '"without_candidates"',
  ]) {
    assert.ok(listRoute.includes(routeValue), `list route must validate ${routeValue}`);
  }
}

function assertStoreQuerySupport() {
  for (const requiredText of [
    "lifecycle: ManualNotePreviewDraftListLifecycleFilter",
    "sort: ManualNotePreviewDraftListSort",
    "warnings: ManualNotePreviewDraftWarningFilter",
    "candidates: ManualNotePreviewDraftCandidateFilter",
    "buildLifecycleWhereClause",
    "buildCreatedAtSortClause",
    "matchesWarningFilter",
    "matchesCandidateFilter",
    "MAX_MANUAL_NOTE_PREVIEW_DRAFT_LIST_LIMIT",
    "const rowLimit = MAX_MANUAL_NOTE_PREVIEW_DRAFT_LIST_LIMIT",
    ".slice(0, limit)",
    "AND discards.preview_draft_id IS NULL",
    "AND discards.preview_draft_id IS NOT NULL",
    "ORDER BY drafts.created_at ${sortClause}",
    "item.warning_count > 0",
    "item.warning_count === 0",
    "item.candidate_count_summary.total > 0",
    "item.candidate_count_summary.total === 0",
  ]) {
    assert.ok(store.includes(requiredText), `store must include ${requiredText}`);
  }

  assert.match(
    listStoreFunction,
    /FROM research_candidate_manual_note_preview_drafts drafts/,
    "list store function must read preview draft table",
  );
  assert.match(
    listStoreFunction,
    /LEFT JOIN research_candidate_manual_note_preview_draft_discards discards/,
    "list store function must read discard marker table",
  );
  assert.doesNotMatch(
    listStoreFunction,
    /\b(?:INSERT|UPDATE|DELETE)\b/i,
    "list store function must not write tables",
  );
}

function assertUiControls() {
  for (const requiredText of [
    "Lifecycle filter",
    "Sort order",
    "Warning filter",
    "Candidate filter",
    "Limit selector",
    "Refresh preview drafts",
    "Showing ${lifecycleSummary[controls.lifecycle]}",
    "active preview drafts",
    "newest first",
    "all warning states",
    "all candidate counts",
    "No preview drafts match the current filters.",
    "Recent runtime preview drafts",
    "Open preview draft",
    "Discard preview draft",
    "Raw note text not stored",
    "Parse locally",
    "Create runtime preview draft",
    "Clear local note",
    "Clear runtime result",
    "id=\"research-candidate-manual-note-boundary\"",
  ]) {
    assert.ok(component.includes(requiredText), `UI must include ${requiredText}`);
  }

  for (const requiredText of [
    "draftLifecycleFilter",
    "draftSort",
    "draftWarningFilter",
    "draftCandidateFilter",
    "draftListLimit",
    "updateDraftLifecycleFilter",
    "updateDraftSort",
    "updateDraftWarningFilter",
    "updateDraftCandidateFilter",
    "updateDraftListLimit",
    "include_discarded: String(controls.lifecycle !== \"active\")",
    "formatDraftListFilterSummary",
    "DRAFT_LIST_LIMIT_OPTIONS = [10, 25, 50]",
  ]) {
    assert.ok(component.includes(requiredText), `UI logic must include ${requiredText}`);
  }
}

function assertForbiddenPatternsAbsent() {
  for (const source of [listRoute, store]) {
    assert.doesNotMatch(source, /\bconsole\./, "route/store must not console log");
    assert.doesNotMatch(source, /from ["'].*openai|OPENAI_API_KEY/i, "must not import or use OpenAI");
    assert.doesNotMatch(source, /from ["'].*provider/i, "must not import providers");
    assert.doesNotMatch(source, /from ["'].*retrieval|from ["'].*rag/i, "must not import retrieval/RAG");
    assert.doesNotMatch(source, /from ["'].*source-fetch/i, "must not import source fetching");
    assert.doesNotMatch(source, /from ["'].*codex/i, "must not import Codex execution");
    assert.doesNotMatch(source, /\bfetch\(/, "route/store must not fetch external data");
  }

  for (const forbiddenWrite of [
    "verification_evidence_records",
    "ag_work_resume_proof_evidence_recording_links",
    "work_items",
    "work_events",
    "action_records",
    "state_entries",
    "state_transitions",
    "state_delta_proposals",
    "perspective_memory_items",
    "perspective_memory_product_persistence_boundary_records",
  ]) {
    assert.doesNotMatch(
      listRoute,
      new RegExp(`\\b(?:INSERT|UPDATE|DELETE)\\s+(?:INTO\\s+)?${forbiddenWrite}\\b`, "i"),
      `list route must not insert/update/delete ${forbiddenWrite}`,
    );
    assert.doesNotMatch(
      store,
      new RegExp(`\\b(?:INSERT|UPDATE|DELETE)\\s+(?:INTO\\s+)?${forbiddenWrite}\\b`, "i"),
      `store must not insert/update/delete ${forbiddenWrite}`,
    );
  }

  assert.doesNotMatch(
    component,
    /localStorage|sessionStorage|indexedDB|document\.cookie/,
    "UI must not use browser persistence",
  );
}

function assertDocsAndPackagePointers() {
  assert.match(
    index,
    /smoke:research-candidate-preview-draft-list-filters-v0-1/,
    "docs index must point to list filters smoke",
  );
  assert.match(
    index,
    /manual note preview draft list sorting\/filtering/i,
    "docs index must describe manual note preview draft list sorting/filtering lane",
  );
  assert.equal(
    packageJson.scripts?.["smoke:research-candidate-preview-draft-list-filters-v0-1"],
    "node scripts/smoke-research-candidate-preview-draft-list-filters-v0-1.mjs",
    "package.json must expose list filters smoke script",
  );
}

function sliceBetween(source, startText, endText) {
  const start = source.indexOf(startText);
  assert.notEqual(start, -1, `${startText} must exist`);
  const end = source.indexOf(endText, start);
  assert.notEqual(end, -1, `${endText} must exist after ${startText}`);
  return source.slice(start, end);
}
