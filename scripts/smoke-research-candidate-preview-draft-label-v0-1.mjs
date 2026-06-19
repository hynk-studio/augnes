import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const labelRoutePath =
  "app/api/research-candidate-review/manual-note-preview-drafts/[preview_draft_id]/label/route.ts";
const sharedRuntimePath =
  "lib/research-candidate-review/manual-note-runtime-preview.ts";
const storePath =
  "lib/research-candidate-review/manual-note-preview-draft-store.ts";
const componentPath =
  "components/research-candidate-manual-note-preview-panel.tsx";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const smokePath =
  "scripts/smoke-research-candidate-preview-draft-label-v0-1.mjs";

for (const filePath of [
  labelRoutePath,
  sharedRuntimePath,
  storePath,
  componentPath,
  indexPath,
  packagePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const labelRoute = readFileSync(labelRoutePath, "utf8");
const sharedRuntime = readFileSync(sharedRuntimePath, "utf8");
const store = readFileSync(storePath, "utf8");
const labelUpdateStoreFunction = sliceBetween(
  store,
  "export function updateResearchCandidateManualNotePreviewDraftLabel",
  "export function discardResearchCandidateManualNotePreviewDraft",
);
const component = readFileSync(componentPath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertSharedContract();
assertLabelRoute();
assertStoreLabelUpdate();
assertUiLabelUx();
assertForbiddenPatternsAbsent();
assertDocsAndPackagePointers();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-preview-draft-label-v0-1",
      label_route_checked: true,
      route_validation_checked: true,
      runtime_boundary_checked: true,
      store_label_update_checked: true,
      ui_label_create_and_edit_checked: true,
      list_filters_preserved: true,
      open_discard_preserved: true,
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
    "MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH = 160",
    "ManualNotePreviewDraftLabelUpdateRequest",
    "ManualNotePreviewDraftLabelUpdateOkResponse",
    "ManualNotePreviewDraftLabelUpdateResponse",
    "ManualNotePreviewDraftLabelRuntimeBoundary",
    "buildManualNotePreviewDraftLabelRoute",
    "buildManualNotePreviewDraftLabelBoundary",
    '"label_update_only"',
    "label_is_operator_preview_metadata_only: true",
    "label_promotes_perspective: false",
    "label_creates_proof_or_evidence: false",
    "label_creates_work_item: false",
    "raw_manual_note_text_persisted: false",
    "raw_manual_note_text_returned: false",
    "provider_or_openai_calls: false",
    "retrieval_or_rag: false",
    "source_fetching: false",
    "codex_execution: false",
    "external_handoff_sending: false",
    '"operator_note_label_too_large"',
  ]) {
    assert.ok(
      sharedRuntime.includes(requiredText),
      `shared runtime contract must include ${requiredText}`,
    );
  }
}

function assertLabelRoute() {
  for (const requiredText of [
    "export async function PATCH(",
    "PREVIEW_DRAFT_ID_PATTERN",
    "validatePreviewDraftId",
    "invalid_preview_draft_id",
    "preview_draft_not_found",
    "readLabelUpdateRequestBody",
    "parseLabelUpdateBody",
    "Request body must be a JSON object.",
    "Request body must be valid JSON.",
    "operator_note_label must be a string or null.",
    "operator_note_label must be ${MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH} characters or fewer.",
    "manual_note_text is not accepted by the label update route.",
    "MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH",
    "LABEL_UPDATE_REQUEST_BODY_BYTES = 2 * 1024",
    "buildManualNotePreviewDraftLabelBoundary",
    "buildManualNotePreviewNoSideEffects",
    "runtime_boundary",
    "no_side_effects",
    "lifecycle_status",
    "updated_at",
  ]) {
    assert.ok(labelRoute.includes(requiredText), `label route must include ${requiredText}`);
  }

  assert.match(
    labelRoute,
    /updateResearchCandidateManualNotePreviewDraftLabel/,
    "label route must call the preview draft store label updater",
  );
  assert.match(
    labelRoute,
    /operator_note_label:\s*label && label\.length > 0 \? label : null/,
    "label route must normalize empty labels to null",
  );
  assert.doesNotMatch(
    labelRoute,
    /from ["'][^"']*(?:provider|openai|retrieval|rag|source-fetch|codex|proof|evidence|work-item|promotion)/i,
    "label route must not import forbidden authority modules",
  );
}

function assertStoreLabelUpdate() {
  for (const requiredText of [
    "updateResearchCandidateManualNotePreviewDraftLabel",
    "UPDATE research_candidate_manual_note_preview_drafts",
    "operator_note_label = @operator_note_label",
    "updated_at = @updated_at",
    "WHERE preview_draft_id = @preview_draft_id",
    "AND scope = @scope",
    "cleanOperatorNoteLabel(operatorNoteLabel)",
    "insertResearchCandidateManualNotePreviewDraftActivity",
    'activityType: nextOperatorNoteLabel ? "label_updated" : "label_cleared"',
    "Preview draft label updated.",
    "Preview draft label cleared.",
    "parseResearchCandidateManualNotePreviewDraftDetail(updated)",
  ]) {
    assert.ok(
      labelUpdateStoreFunction.includes(requiredText),
      `label store update must include ${requiredText}`,
    );
  }
  assert.ok(
    store.includes("MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH"),
    "store must reuse the shared label max-length constant",
  );

  assert.doesNotMatch(
    labelUpdateStoreFunction,
    /\bDELETE\b/i,
    "label store update must not delete rows",
  );

  for (const forbiddenUpdateColumn of [
    "preview_json",
    "warnings_json",
    "authority_json",
    "runtime_boundary_json",
    "no_side_effects_json",
    "status",
    "promoted_at",
    "canonical_perspective_id",
    "proof_id",
    "evidence_id",
    "work_item_id",
  ]) {
    assert.doesNotMatch(
      labelUpdateStoreFunction,
      new RegExp(`\\b${forbiddenUpdateColumn}\\s*=`, "i"),
      `label store update must not update ${forbiddenUpdateColumn}`,
    );
  }
}

function assertUiLabelUx() {
  for (const requiredText of [
    "Operator preview label",
    "Paper synthesis: retrieval quality notes",
    "MAX_MANUAL_NOTE_PREVIEW_DRAFT_LABEL_LENGTH",
    "operatorPreviewLabel",
    "operatorPreviewLabelTooLong",
    "operator_note_label: cleanOperatorPreviewLabel",
    "Labels are operator-facing preview metadata only.",
    "Labels do not promote, classify, or canonize the draft.",
    "Raw note text is not stored or recoverable.",
    "Untitled preview draft",
    "generated fallback label",
    "label-only metadata",
    "Edit label",
    "Save label",
    "Cancel",
    "Clear label",
    "Saving label...",
    "buildManualNotePreviewDraftLabelRoute(previewDraftId)",
    "ManualNotePreviewDraftLabelUpdateResponse",
    "Label editing is metadata-only, including discarded preview",
    "operator_note_label",
    "updated_at",
  ]) {
    assert.ok(component.includes(requiredText), `UI must include ${requiredText}`);
  }

  for (const preservedText of [
    "Lifecycle filter",
    "Sort order",
    "Warning filter",
    "Candidate filter",
    "Limit selector",
    "Open preview draft",
    "Discard preview draft",
    "Refresh preview drafts",
    "id=\"research-candidate-manual-note-boundary\"",
    "Create runtime preview draft",
    "Parse locally",
    "Clear local note",
    "Clear runtime result",
  ]) {
    assert.ok(component.includes(preservedText), `UI must preserve ${preservedText}`);
  }
}

function assertForbiddenPatternsAbsent() {
  for (const source of [labelRoute, labelUpdateStoreFunction]) {
    assert.doesNotMatch(source, /\bconsole\./, "route/store must not console log");
    assert.doesNotMatch(source, /\bfetch\(/, "route/store must not fetch external data");
    assert.doesNotMatch(source, /OPENAI_API_KEY|api\.openai\.com|new\s+OpenAI/i, "must not call OpenAI");
    assert.doesNotMatch(source, /\b(retrieveSources|ragIndex|vectorStore|embedding|crawler|scrapeSource)\b/i, "must not retrieve or fetch sources");
    assert.doesNotMatch(source, /\b(promotePerspective|promoteCandidate|rejectCandidate|deferCandidate|approveCandidate)\b/, "must not add promotion workflow");
    assert.doesNotMatch(source, /\b(recordProof|createProof|proofWrite|recordEvidence|createEvidence|evidenceWrite)\b/, "must not write proof/evidence");
    assert.doesNotMatch(source, /\b(createWorkItem|newWorkItem|workItemCreate|executeCodex|runCodex|launchCodex)\b/, "must not create work items or execute Codex");
  }

  for (const forbiddenWrite of [
    "research_candidate_manual_note_preview_draft_discards",
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
      labelUpdateStoreFunction,
      new RegExp(`\\b(?:INSERT|UPDATE|DELETE)\\s+(?:INTO\\s+)?${forbiddenWrite}\\b`, "i"),
      `label update must not insert/update/delete ${forbiddenWrite}`,
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
    /smoke:research-candidate-preview-draft-label-v0-1/,
    "docs index must point to label smoke",
  );
  assert.match(
    index,
    /manual note preview draft label refinement/i,
    "docs index must describe manual note preview draft label refinement lane",
  );
  assert.equal(
    packageJson.scripts?.["smoke:research-candidate-preview-draft-label-v0-1"],
    "node scripts/smoke-research-candidate-preview-draft-label-v0-1.mjs",
    "package.json must expose label refinement smoke script",
  );
}

function sliceBetween(source, startText, endText) {
  const start = source.indexOf(startText);
  assert.notEqual(start, -1, `${startText} must exist`);
  const end = source.indexOf(endText, start);
  assert.notEqual(end, -1, `${endText} must exist after ${startText}`);
  return source.slice(start, end);
}
