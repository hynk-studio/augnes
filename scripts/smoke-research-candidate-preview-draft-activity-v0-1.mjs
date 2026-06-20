import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const activityRoutePath =
  "app/api/research-candidate-review/manual-note-preview-drafts/[preview_draft_id]/activity/route.ts";
const createRoutePath =
  "app/api/research-candidate-review/manual-note-preview/route.ts";
const labelRoutePath =
  "app/api/research-candidate-review/manual-note-preview-drafts/[preview_draft_id]/label/route.ts";
const discardRoutePath =
  "app/api/research-candidate-review/manual-note-preview-drafts/[preview_draft_id]/discard/route.ts";
const sharedRuntimePath =
  "lib/research-candidate-review/manual-note-runtime-preview.ts";
const storePath =
  "lib/research-candidate-review/manual-note-preview-draft-store.ts";
const componentPath =
  "components/research-candidate-manual-note-preview-panel.tsx";
const runtimeHookPath =
  "components/use-research-candidate-manual-note-preview-runtime.ts";
const draftListPanelPath =
  "components/research-candidate-preview-draft-list-panel.tsx";
const draftCardPath = "components/research-candidate-preview-draft-card.tsx";
const labelControlsPath =
  "components/research-candidate-preview-draft-label-controls.tsx";
const activityReadoutPath =
  "components/research-candidate-preview-draft-activity-readout.tsx";
const metadataReadoutPath =
  "components/research-candidate-preview-draft-metadata-readout.tsx";
const schemaPath = "lib/db/schema.sql";
const dbPath = "lib/db.ts";
const migrationsPath = "scripts/db-migrations.mjs";
const dbMigratePath = "scripts/db-migrate.mjs";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const smokePath =
  "scripts/smoke-research-candidate-preview-draft-activity-v0-1.mjs";

for (const filePath of [
  activityRoutePath,
  createRoutePath,
  labelRoutePath,
  discardRoutePath,
  sharedRuntimePath,
  storePath,
  componentPath,
  runtimeHookPath,
  draftListPanelPath,
  draftCardPath,
  labelControlsPath,
  activityReadoutPath,
  metadataReadoutPath,
  schemaPath,
  dbPath,
  migrationsPath,
  dbMigratePath,
  indexPath,
  packagePath,
  smokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const activityRoute = readFileSync(activityRoutePath, "utf8");
const createRoute = readFileSync(createRoutePath, "utf8");
const labelRoute = readFileSync(labelRoutePath, "utf8");
const discardRoute = readFileSync(discardRoutePath, "utf8");
const sharedRuntime = readFileSync(sharedRuntimePath, "utf8");
const store = readFileSync(storePath, "utf8");
const manualPanelComponent = readFileSync(componentPath, "utf8");
const runtimeHookComponent = readFileSync(runtimeHookPath, "utf8");
const draftUiComponent = [
  readFileSync(draftListPanelPath, "utf8"),
  readFileSync(draftCardPath, "utf8"),
  readFileSync(labelControlsPath, "utf8"),
  readFileSync(activityReadoutPath, "utf8"),
  readFileSync(metadataReadoutPath, "utf8"),
].join("\n");
const component = `${manualPanelComponent}\n${draftUiComponent}\n${runtimeHookComponent}`;

const schema = readFileSync(schemaPath, "utf8");
const db = readFileSync(dbPath, "utf8");
const migrations = readFileSync(migrationsPath, "utf8");
const dbMigrate = readFileSync(dbMigratePath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const activityTableSql = extractTableSql(
  schema,
  "research_candidate_manual_note_preview_draft_activities",
);
const createStoreFunction = sliceBetween(
  store,
  "export function insertResearchCandidateManualNotePreviewDraft",
  "export function listResearchCandidateManualNotePreviewDrafts",
);
const labelStoreFunction = sliceBetween(
  store,
  "export function updateResearchCandidateManualNotePreviewDraftLabel",
  "export function discardResearchCandidateManualNotePreviewDraft",
);
const discardStoreFunction = sliceBetween(
  store,
  "export function discardResearchCandidateManualNotePreviewDraft",
  "export function listResearchCandidateManualNotePreviewDraftActivities",
);
const listActivityStoreFunction = sliceBetween(
  store,
  "export function listResearchCandidateManualNotePreviewDraftActivities",
  "function cleanOperatorNoteLabel",
);
const insertActivityHelper = sliceBetween(
  store,
  "function insertResearchCandidateManualNotePreviewDraftActivity",
  "function parseResearchCandidateManualNotePreviewDraftRow",
);

assertActivitySchema();
assertSharedActivityContract();
assertActivityRoute();
assertStoreActivityHooks();
assertUiActivityReadout();
assertForbiddenPatternsAbsent();
assertDocsAndPackagePointers();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-preview-draft-activity-v0-1",
      activity_schema_checked: true,
      migrations_checked: true,
      activity_route_checked: true,
      activity_route_validation_checked: true,
      activity_store_hooks_checked: true,
      ui_activity_readout_checked: true,
      existing_behaviors_preserved: true,
      forbidden_patterns_absent: true,
      docs_pointer_checked: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertActivitySchema() {
  for (const requiredText of [
    "CREATE TABLE IF NOT EXISTS research_candidate_manual_note_preview_draft_activities",
    "activity_id TEXT PRIMARY KEY",
    "preview_draft_id TEXT NOT NULL",
    "scope TEXT NOT NULL DEFAULT 'project:augnes' CHECK (scope IN ('project:augnes'))",
    "activity_type TEXT NOT NULL CHECK (activity_type IN ('preview_draft_created', 'label_updated', 'label_cleared', 'preview_draft_discarded'))",
    "activity_at TEXT NOT NULL",
    "activity_by TEXT NOT NULL",
    "summary TEXT NOT NULL",
    "before_json TEXT NOT NULL DEFAULT '{}'",
    "after_json TEXT NOT NULL DEFAULT '{}'",
    "authority_json TEXT NOT NULL",
    "no_side_effects_json TEXT NOT NULL",
    "FOREIGN KEY (preview_draft_id) REFERENCES research_candidate_manual_note_preview_drafts(preview_draft_id)",
  ]) {
    assert.ok(activityTableSql.includes(requiredText), `activity schema must include ${requiredText}`);
  }

  for (const requiredIndex of [
    "idx_research_candidate_manual_note_preview_draft_activities_draft_time",
    "idx_research_candidate_manual_note_preview_draft_activities_scope_time",
    "idx_research_candidate_manual_note_preview_draft_activities_type_time",
  ]) {
    assert.ok(schema.includes(requiredIndex), `schema must include ${requiredIndex}`);
    assert.ok(migrations.includes(requiredIndex), `migration helper must include ${requiredIndex}`);
  }

  assert.doesNotMatch(
    activityTableSql,
    /\bmanual_note_text\b|\braw_note\b|\bpasted_note\b/i,
    "activity table must not contain raw note text fields",
  );
  assert.doesNotMatch(
    activityTableSql,
    /\bpreview_json\b|\bwarnings_json\b|\bruntime_boundary_json\b/i,
    "activity table must not store preview JSON snapshots",
  );
  assert.match(
    db,
    /migrateResearchCandidateManualNotePreviewDraftActivitiesTable\(db\)/,
    "runtime DB opener must run activity table migration",
  );
  assert.match(
    migrations,
    /export function migrateResearchCandidateManualNotePreviewDraftActivities\(db\)/,
    "CLI migration helper must expose activity migration",
  );
  assert.match(
    dbMigrate,
    /migrateResearchCandidateManualNotePreviewDraftActivities\(db\)/,
    "db:migrate must run activity table migration",
  );
}

function assertSharedActivityContract() {
  for (const requiredText of [
    "MAX_MANUAL_NOTE_PREVIEW_DRAFT_ACTIVITY_LIST_LIMIT = 50",
    "DEFAULT_MANUAL_NOTE_PREVIEW_DRAFT_ACTIVITY_LIST_LIMIT = 20",
    "ManualNotePreviewDraftActivityType",
    '"preview_draft_created"',
    '"label_updated"',
    '"label_cleared"',
    '"preview_draft_discarded"',
    "ManualNotePreviewDraftActivityItem",
    "ManualNotePreviewDraftActivityResponse",
    "ManualNotePreviewDraftActivityRuntimeBoundary",
    "buildManualNotePreviewDraftActivityRoute",
    "buildManualNotePreviewDraftActivityBoundary",
    "buildManualNotePreviewDraftActivityAuthority",
    'activity_actions: "read_lifecycle_metadata_only"',
    "activity_is_preview_metadata_only: true",
    "approval_workflow_created: false",
    "reject_defer_promote_workflow_created: false",
    "raw_manual_note_text_persisted: false",
    "raw_manual_note_text_returned: false",
    "provider_or_openai_calls: false",
    "retrieval_or_rag: false",
    "source_fetching: false",
    "codex_execution: false",
    "external_handoff_sending: false",
  ]) {
    assert.ok(
      sharedRuntime.includes(requiredText),
      `shared activity contract must include ${requiredText}`,
    );
  }
}

function assertActivityRoute() {
  for (const requiredText of [
    "export async function GET(",
    "PREVIEW_DRAFT_ID_PATTERN",
    "validatePreviewDraftId",
    "invalid_preview_draft_id",
    "parseActivityLimit",
    "invalid_limit",
    "preview_draft_not_found",
    "listResearchCandidateManualNotePreviewDraftActivities",
    "buildManualNotePreviewDraftActivityBoundary",
    "buildManualNotePreviewNoSideEffects",
    "runtime_boundary",
    "no_side_effects",
    "lifecycle_status",
    "items",
    "count",
    "limit",
  ]) {
    assert.ok(activityRoute.includes(requiredText), `activity route must include ${requiredText}`);
  }

  assert.doesNotMatch(
    activityRoute,
    /\b(?:INSERT|UPDATE|DELETE)\b/i,
    "activity GET route must not write",
  );
  assert.doesNotMatch(
    activityRoute,
    /from ["'][^"']*(?:provider|openai|retrieval|rag|source-fetch|codex|proof|evidence|work-item|promotion)/i,
    "activity route must not import forbidden authority modules",
  );
}

function assertStoreActivityHooks() {
  for (const requiredText of [
    "insertResearchCandidateManualNotePreviewDraftActivity",
    "INSERT INTO research_candidate_manual_note_preview_draft_activities",
    "activity_type",
    "authority_json: JSON.stringify(buildManualNotePreviewDraftActivityAuthority())",
    "no_side_effects_json: JSON.stringify(noSideEffects)",
  ]) {
    assert.ok(insertActivityHelper.includes(requiredText), `activity insert helper must include ${requiredText}`);
  }

  for (const requiredText of [
    'activityType: "preview_draft_created"',
    "Preview draft created with operator preview label.",
    "candidate_count_summary: buildCandidateCountSummary(parserResult.preview)",
    "input_fingerprint: row.input_fingerprint",
  ]) {
    assert.ok(createStoreFunction.includes(requiredText), `create store path must include ${requiredText}`);
  }

  for (const requiredText of [
    'activityType: nextOperatorNoteLabel ? "label_updated" : "label_cleared"',
    "Preview draft label updated.",
    "Preview draft label cleared.",
    "beforeJson: {",
    "afterJson: {",
    "operator_note_label: previousOperatorNoteLabel",
    "operator_note_label: nextOperatorNoteLabel",
  ]) {
    assert.ok(labelStoreFunction.includes(requiredText), `label store path must include ${requiredText}`);
  }

  for (const requiredText of [
    'activityType: "preview_draft_discarded"',
    "Preview draft discarded as lifecycle metadata.",
    'lifecycle_status: "active_preview_draft"',
    'lifecycle_status: "discarded_preview_draft"',
    "discard_id: discardRow.discard_id",
    "discard_reason: discardRow.discard_reason",
  ]) {
    assert.ok(discardStoreFunction.includes(requiredText), `discard store path must include ${requiredText}`);
  }

  for (const requiredText of [
    "listResearchCandidateManualNotePreviewDraftActivities",
    "FROM research_candidate_manual_note_preview_draft_activities",
    "ORDER BY activity_at DESC",
    "LIMIT @limit",
    "parseResearchCandidateManualNotePreviewDraftActivityRow",
  ]) {
    assert.ok(listActivityStoreFunction.includes(requiredText), `activity list helper must include ${requiredText}`);
  }

  for (const forbiddenText of [
    "manual_note_text",
    "raw_note",
    "pasted_note",
    "preview_json:",
    "warnings_json:",
  ]) {
    assert.doesNotMatch(
      insertActivityHelper,
      new RegExp(forbiddenText, "i"),
      `activity helper must not include ${forbiddenText}`,
    );
  }
}

function assertUiActivityReadout() {
  for (const requiredText of [
    "Preview draft activity",
    "Load activity",
    "Refresh activity",
    "Loading activity...",
    "ManualNotePreviewDraftActivityResponse",
    "buildManualNotePreviewDraftActivityRoute(previewDraftId)",
    "No activity metadata recorded for this preview draft yet.",
    "Activity is preview-draft metadata only.",
    "Activity does not approve, reject, defer, promote, or canonize this draft.",
    "Raw note text is not stored or recoverable.",
    "Created preview draft",
    "Label updated",
    "Label cleared",
    "Discarded preview draft",
    "before_label",
    "after_label",
    "activity_at",
    "activity_by",
    "summary",
  ]) {
    assert.ok(component.includes(requiredText), `activity UI must include ${requiredText}`);
  }

  for (const preservedText of [
    "Operator preview label",
    "Use sample note",
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
    "Discard preview draft",
    "Clear local note",
    "Clear runtime result",
    "id=\"research-candidate-manual-note-boundary\"",
  ]) {
    assert.ok(component.includes(preservedText), `UI must preserve ${preservedText}`);
  }

  assert.doesNotMatch(
    component,
    /localStorage|sessionStorage|indexedDB|document\.cookie/,
    "UI must not introduce browser persistence",
  );
}

function assertForbiddenPatternsAbsent() {
  for (const source of [
    activityRoute,
    createRoute,
    labelRoute,
    discardRoute,
    store,
  ]) {
    assert.doesNotMatch(source, /\bconsole\./, "routes/store must not console log");
    assert.doesNotMatch(source, /\bfetch\(/, "routes/store must not fetch external data");
    assert.doesNotMatch(source, /OPENAI_API_KEY|api\.openai\.com|new\s+OpenAI/i, "must not call OpenAI");
    assert.doesNotMatch(source, /from ["'].*provider/i, "must not import providers");
    assert.doesNotMatch(source, /from ["'].*retrieval|from ["'].*rag/i, "must not import retrieval/RAG");
    assert.doesNotMatch(source, /from ["'].*source-fetch/i, "must not import source fetching");
    assert.doesNotMatch(source, /from ["'].*codex/i, "must not import Codex execution");
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
  ]) {
    assert.doesNotMatch(
      `${activityRoute}\n${createRoute}\n${labelRoute}\n${discardRoute}\n${store}`,
      new RegExp(`\\b(?:INSERT|UPDATE|DELETE)\\s+(?:INTO\\s+)?${forbiddenWrite}\\b`, "i"),
      `routes/store must not insert/update/delete ${forbiddenWrite}`,
    );
  }
}

function assertDocsAndPackagePointers() {
  assert.match(
    index,
    /smoke:research-candidate-preview-draft-activity-v0-1/,
    "docs index must point to activity smoke",
  );
  assert.match(
    index,
    /manual note preview draft activity\/readout/i,
    "docs index must describe manual note preview draft activity/readout lane",
  );
  assert.equal(
    packageJson.scripts?.["smoke:research-candidate-preview-draft-activity-v0-1"],
    "node scripts/smoke-research-candidate-preview-draft-activity-v0-1.mjs",
    "package.json must expose activity smoke script",
  );
}

function extractTableSql(source, tableName) {
  const start = source.indexOf(`CREATE TABLE IF NOT EXISTS ${tableName}`);
  assert.notEqual(start, -1, `${tableName} table must be declared`);
  const nextTable = source.indexOf("CREATE TABLE IF NOT EXISTS", start + 1);
  return source.slice(start, nextTable === -1 ? undefined : nextTable);
}

function sliceBetween(source, startText, endText) {
  const start = source.indexOf(startText);
  assert.notEqual(start, -1, `${startText} must exist`);
  const end = source.indexOf(endText, start);
  assert.notEqual(end, -1, `${endText} must exist after ${startText}`);
  return source.slice(start, end);
}
