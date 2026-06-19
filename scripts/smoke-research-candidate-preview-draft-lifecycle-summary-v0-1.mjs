import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const listRoutePath =
  "app/api/research-candidate-review/manual-note-preview-drafts/route.ts";
const detailRoutePath =
  "app/api/research-candidate-review/manual-note-preview-drafts/[preview_draft_id]/route.ts";
const sharedRuntimePath =
  "lib/research-candidate-review/manual-note-runtime-preview.ts";
const storePath =
  "lib/research-candidate-review/manual-note-preview-draft-store.ts";
const componentPath =
  "components/research-candidate-manual-note-preview-panel.tsx";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const smokePath =
  "scripts/smoke-research-candidate-preview-draft-lifecycle-summary-v0-1.mjs";

for (const filePath of [
  listRoutePath,
  detailRoutePath,
  sharedRuntimePath,
  storePath,
  componentPath,
  indexPath,
  packagePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const listRoute = readFileSync(listRoutePath, "utf8");
const detailRoute = readFileSync(detailRoutePath, "utf8");
const sharedRuntime = readFileSync(sharedRuntimePath, "utf8");
const store = readFileSync(storePath, "utf8");
const component = readFileSync(componentPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

const listStoreFunction = sliceBetween(
  store,
  "export function listResearchCandidateManualNotePreviewDrafts",
  "export function summarizeResearchCandidateManualNotePreviewDraftList",
);
const summaryStoreFunction = sliceBetween(
  store,
  "export function summarizeResearchCandidateManualNotePreviewDraftList",
  "export function getResearchCandidateManualNotePreviewDraft",
);
const selectJoinedRowFunction = sliceBetween(
  store,
  "function selectResearchCandidateManualNotePreviewDraftJoinedRow",
  "function selectResearchCandidateManualNotePreviewDraftDiscardRow",
);
const parseListItemFunction = sliceBetween(
  store,
  "function parseResearchCandidateManualNotePreviewDraftListItem",
  "function buildLifecycleSummary",
);
const lifecycleSummaryHelper = sliceBetween(
  store,
  "function buildLifecycleSummary",
  "function parseResearchCandidateManualNotePreviewDraftDetail",
);

assertSharedLifecycleSummaryContract();
assertListRouteSummaryResponse();
assertStoreLifecycleSummaryReads();
assertUiLifecycleSummaryReadout();
assertForbiddenPatternsAbsent();
assertDocsAndPackagePointers();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-preview-draft-lifecycle-summary-v0-1",
      list_response_summary_checked: true,
      item_lifecycle_summary_checked: true,
      store_read_only_summary_checked: true,
      ui_summary_counts_checked: true,
      ui_per_draft_badges_checked: true,
      existing_behaviors_preserved: true,
      forbidden_patterns_absent: true,
      docs_pointer_checked: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertSharedLifecycleSummaryContract() {
  for (const requiredText of [
    "ManualNotePreviewDraftLifecycleSummary",
    "ManualNotePreviewDraftListSummary",
    'ManualNotePreviewDraftLabelState = "labeled" | "untitled"',
    'ManualNotePreviewDraftDiscardState = "active" | "discarded"',
    "activity_count: number",
    "last_activity_type: ManualNotePreviewDraftActivityType | null",
    "last_activity_at: string | null",
    "returned_count: number",
    "active_count: number",
    "discarded_count: number",
    "with_warnings_count: number",
    "without_warnings_count: number",
    "with_candidates_count: number",
    "without_candidates_count: number",
    "activity_recorded_count: number",
    "label_present_count: number",
    "label_missing_count: number",
    'summary_scope: "returned_bounded_list"',
    "lifecycle_summary: ManualNotePreviewDraftLifecycleSummary",
    "summary: ManualNotePreviewDraftListSummary",
    'lifecycle_summary_source: "returned_bounded_list"',
    "lifecycle_summary_is_preview_metadata_only: true",
    "lifecycle_summary_is_not_approval_history: true",
    "counts_do_not_promote_or_canonize: true",
    "proof_or_evidence_writes: false",
    "canonical_perspective_write: false",
    "work_item_creation: false",
  ]) {
    assert.ok(
      sharedRuntime.includes(requiredText),
      `shared lifecycle summary contract must include ${requiredText}`,
    );
  }
}

function assertListRouteSummaryResponse() {
  for (const requiredText of [
    "summarizeResearchCandidateManualNotePreviewDraftList",
    "const summary = summarizeResearchCandidateManualNotePreviewDraftList(items)",
    "summary,",
    "parsePreviewDraftListLimit",
    "parseIncludeDiscarded",
    "parseLifecycle",
    "parseSort",
    "parseWarnings",
    "parseCandidates",
    "invalid_lifecycle",
    "invalid_sort",
    "invalid_warnings",
    "invalid_candidates",
    "invalid_limit",
    "runtime_boundary",
    "no_side_effects",
  ]) {
    assert.ok(listRoute.includes(requiredText), `list route must include ${requiredText}`);
  }

  assert.match(
    detailRoute,
    /draft: detail\.draft/,
    "detail route must return stored draft metadata so lifecycle_summary is available when opened",
  );
  assert.doesNotMatch(
    listRoute,
    /\b(?:INSERT|UPDATE|DELETE)\b/i,
    "list route must not write",
  );
}

function assertStoreLifecycleSummaryReads() {
  for (const requiredText of [
    "activity_count: number",
    "last_activity_type: ManualNotePreviewDraftActivityType | null",
    "last_activity_at: string | null",
    "research_candidate_manual_note_preview_drafts drafts",
    "research_candidate_manual_note_preview_draft_discards discards",
    "research_candidate_manual_note_preview_draft_activities activities",
    "COUNT(*)",
    "ORDER BY activities.activity_at DESC, activities.activity_id DESC",
    "buildLifecycleSummary",
    "lifecycle_summary: buildLifecycleSummary",
  ]) {
    assert.ok(store.includes(requiredText), `store must include ${requiredText}`);
  }

  for (const requiredText of [
    "label_state: draft.operator_note_label ? \"labeled\" : \"untitled\"",
    "discard_state: discardMetadata ? \"discarded\" : \"active\"",
    "activity_count: Number.isFinite(activityCount) ? activityCount : 0",
    "last_activity_type: row.last_activity_type ?? null",
    "last_activity_at: row.last_activity_at ?? null",
  ]) {
    assert.ok(
      lifecycleSummaryHelper.includes(requiredText),
      `lifecycle summary helper must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "returned_count: items.length",
    "active_count",
    "discarded_count",
    "with_warnings_count",
    "without_warnings_count",
    "with_candidates_count",
    "without_candidates_count",
    "activity_recorded_count",
    "label_present_count",
    "label_missing_count",
    'summary_scope: "returned_bounded_list"',
  ]) {
    assert.ok(
      summaryStoreFunction.includes(requiredText),
      `list summary helper must include ${requiredText}`,
    );
  }

  for (const readSource of [listStoreFunction, selectJoinedRowFunction]) {
    assert.match(
      readSource,
      /FROM research_candidate_manual_note_preview_drafts drafts/,
      "summary read path must read preview draft rows",
    );
    assert.match(
      readSource,
      /LEFT JOIN research_candidate_manual_note_preview_draft_discards discards/,
      "summary read path must read discard marker rows",
    );
    assert.match(
      readSource,
      /FROM research_candidate_manual_note_preview_draft_activities activities/,
      "summary read path must read activity rows",
    );
    assert.doesNotMatch(
      readSource,
      /\b(?:INSERT|UPDATE|DELETE)\b/i,
      "summary read path must not write",
    );
  }

  assert.ok(
    parseListItemFunction.includes("lifecycle_summary: buildLifecycleSummary"),
    "list item parser must attach lifecycle_summary",
  );
}

function assertUiLifecycleSummaryReadout() {
  for (const requiredText of [
    "previewDraftListSummary",
    "setPreviewDraftListSummary(result.summary)",
    "PreviewDraftListSummaryBadges",
    "Active: {summary.active_count}",
    "Discarded: {summary.discarded_count}",
    "With warnings: {summary.with_warnings_count}",
    "With candidates: {summary.with_candidates_count}",
    "Activity recorded: {summary.activity_recorded_count}",
    "Untitled: {summary.label_missing_count}",
    "Counts are preview-list metadata only.",
    "Counts do not approve, reject, defer, promote, or canonize drafts.",
    "Activity count is lifecycle metadata, not proof or evidence.",
    "manual-note-preview-draft-badges",
    "Active preview draft",
    "Discarded preview draft",
    "Labeled",
    "Untitled",
    "Activity count {lifecycleSummary.activity_count}",
    "Last activity: {lastActivityLabel}",
    "Last activity time",
    "Warnings {item.warning_count}",
    "Candidates {item.candidate_count_summary.total}",
    "label_state",
    "discard_state",
    "activity_count",
    "last_activity_type",
    "last_activity_at",
  ]) {
    assert.ok(component.includes(requiredText), `UI must include ${requiredText}`);
  }

  for (const preservedText of [
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
    "Clear label",
    "Load activity",
    "Refresh activity",
    "Discard preview draft",
    "Clear local note",
    "Clear runtime result",
    "Parser warning summary",
    "Parse result summary",
    "claim_candidates",
    "id=\"research-candidate-manual-note-boundary\"",
  ]) {
    assert.ok(component.includes(preservedText), `UI must preserve ${preservedText}`);
  }
}

function assertForbiddenPatternsAbsent() {
  for (const source of [listRoute, detailRoute, listStoreFunction, selectJoinedRowFunction]) {
    assert.doesNotMatch(source, /\bconsole\./, "routes/store reads must not console log");
    assert.doesNotMatch(source, /\bfetch\(/, "routes/store reads must not fetch external data");
    assert.doesNotMatch(source, /OPENAI_API_KEY|api\.openai\.com|new\s+OpenAI/i, "must not call OpenAI");
    assert.doesNotMatch(source, /from ["'][^"']*(?:provider|openai|retrieval|rag|source-fetch|codex|proof|evidence|work-item|promotion)/i, "must not import forbidden authority modules");
    assert.doesNotMatch(source, /\b(retrieveSources|ragIndex|vectorStore|embedding|embeddings|crawler|scrapeSource)\b/i, "must not retrieve or fetch sources");
    assert.doesNotMatch(source, /\b(promotePerspective|promoteCandidate|rejectCandidate|deferCandidate|approveCandidate)\b/, "must not add promotion workflow");
    assert.doesNotMatch(source, /\b(recordProof|createProof|proofWrite|recordEvidence|createEvidence|evidenceWrite)\b/, "must not write proof/evidence");
    assert.doesNotMatch(source, /\b(createWorkItem|newWorkItem|workItemCreate|executeCodex|runCodex|launchCodex)\b/, "must not create work items or execute Codex");
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
    "canonical_perspectives",
    "perspective_graph_nodes",
    "perspective_graph_edges",
  ]) {
    for (const source of [listRoute, detailRoute, listStoreFunction, selectJoinedRowFunction]) {
      assert.doesNotMatch(
        source,
        new RegExp(`\\b(?:INSERT|UPDATE|DELETE)\\s+(?:INTO\\s+)?${forbiddenWrite}\\b`, "i"),
        `lifecycle summary reads must not insert/update/delete ${forbiddenWrite}`,
      );
    }
  }

  assert.doesNotMatch(
    component,
    /localStorage|sessionStorage|indexedDB|document\.cookie/,
    "UI must not introduce browser persistence",
  );
}

function assertDocsAndPackagePointers() {
  assert.match(
    index,
    /Manual note preview draft lifecycle summary lane/,
    "docs index must describe lifecycle summary lane",
  );
  assert.match(
    index,
    /smoke:research-candidate-preview-draft-lifecycle-summary-v0-1/,
    "docs index must include lifecycle summary smoke command",
  );
  assert.match(
    index,
    /returned\s+bounded\s+list window/,
    "docs index must disclose bounded returned-list summary scope",
  );
  assert.equal(
    packageJson.scripts?.["smoke:research-candidate-preview-draft-lifecycle-summary-v0-1"],
    "node scripts/smoke-research-candidate-preview-draft-lifecycle-summary-v0-1.mjs",
    "package script must point at lifecycle summary smoke",
  );
}

function sliceBetween(source, startText, endText) {
  const start = source.indexOf(startText);
  assert.notEqual(start, -1, `missing start marker ${startText}`);
  const end = source.indexOf(endText, start + startText.length);
  assert.notEqual(end, -1, `missing end marker ${endText}`);
  return source.slice(start, end);
}
