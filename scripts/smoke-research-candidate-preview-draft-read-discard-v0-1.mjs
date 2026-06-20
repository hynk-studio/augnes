import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const listRoutePath =
  "app/api/research-candidate-review/manual-note-preview-drafts/route.ts";
const detailRoutePath =
  "app/api/research-candidate-review/manual-note-preview-drafts/[preview_draft_id]/route.ts";
const discardRoutePath =
  "app/api/research-candidate-review/manual-note-preview-drafts/[preview_draft_id]/discard/route.ts";
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
const schemaPath = "lib/db/schema.sql";
const dbPath = "lib/db.ts";
const migrationsPath = "scripts/db-migrations.mjs";
const dbMigratePath = "scripts/db-migrate.mjs";
const indexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";
const smokePath =
  "scripts/smoke-research-candidate-preview-draft-read-discard-v0-1.mjs";

for (const filePath of [
  listRoutePath,
  detailRoutePath,
  discardRoutePath,
  sharedRuntimePath,
  storePath,
  componentPath,
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

const listRoute = readFileSync(listRoutePath, "utf8");
const detailRoute = readFileSync(detailRoutePath, "utf8");
const discardRoute = readFileSync(discardRoutePath, "utf8");
const allRoutes = `${listRoute}\n${detailRoute}\n${discardRoute}`;
const sharedRuntime = readFileSync(sharedRuntimePath, "utf8");
const store = readFileSync(storePath, "utf8");
const manualPanelComponent = readFileSync(componentPath, "utf8");
const draftUiComponent = [
  readFileSync(draftListPanelPath, "utf8"),
  readFileSync(draftCardPath, "utf8"),
  readFileSync(labelControlsPath, "utf8"),
  readFileSync(activityReadoutPath, "utf8"),
  readFileSync(metadataReadoutPath, "utf8"),
].join("\n");
const component = `${manualPanelComponent}\n${draftUiComponent}`;

const schema = readFileSync(schemaPath, "utf8");
const db = readFileSync(dbPath, "utf8");
const migrations = readFileSync(migrationsPath, "utf8");
const dbMigrate = readFileSync(dbMigratePath, "utf8");
const index = readFileSync(indexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
const discardTableSql = extractTableSql(
  schema,
  "research_candidate_manual_note_preview_draft_discards",
);

assertRoutesExistAndUseStore();
assertRouteValidationAndResponseShape();
assertDiscardMarkerSchema();
assertUiAffordances();
assertForbiddenPatternsAbsent();
assertDocsAndPackagePointers();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-preview-draft-read-discard-v0-1",
      list_route_checked: true,
      detail_route_checked: true,
      discard_route_checked: true,
      store_reader_checked: true,
      validation_checked: true,
      discard_marker_schema_checked: true,
      ui_affordances_checked: true,
      forbidden_patterns_absent: true,
      docs_pointer_checked: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertRoutesExistAndUseStore() {
  assert.match(
    listRoute,
    /export async function GET\(request: Request\)/,
    "list route must expose GET",
  );
  assert.match(
    detailRoute,
    /export async function GET\(\s*_request: Request,/,
    "detail route must expose GET",
  );
  assert.match(
    discardRoute,
    /export async function POST\(/,
    "discard route must expose POST",
  );

  for (const route of [listRoute, detailRoute, discardRoute]) {
    assert.match(route, /export const runtime = "nodejs"/, "routes must use node runtime");
    assert.match(
      route,
      /buildManualNotePreviewDraftLifecycleBoundary/,
      "routes must return lifecycle runtime_boundary",
    );
  }

  assert.match(
    listRoute,
    /listResearchCandidateManualNotePreviewDrafts/,
    "list route must read preview draft list from store",
  );
  assert.match(
    detailRoute,
    /getResearchCandidateManualNotePreviewDraft/,
    "detail route must read preview draft detail from store",
  );
  assert.match(
    discardRoute,
    /discardResearchCandidateManualNotePreviewDraft/,
    "discard route must mark discard through the preview draft store",
  );
}

function assertRouteValidationAndResponseShape() {
  for (const requiredText of [
    "MAX_MANUAL_NOTE_PREVIEW_DRAFT_LIST_LIMIT = 50",
    "DEFAULT_MANUAL_NOTE_PREVIEW_DRAFT_LIST_LIMIT = 10",
    "MAX_MANUAL_NOTE_PREVIEW_DRAFT_DISCARD_REASON_LENGTH = 500",
    "MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE",
    "ManualNotePreviewDraftListResponse",
    "ManualNotePreviewDraftDetailResponse",
    "ManualNotePreviewDraftDiscardResponse",
    "runtime_boundary",
    "no_side_effects",
    "active_preview_draft",
    "discarded_preview_draft",
    "discard_marker_table",
    "raw_manual_note_text_returned: false",
    "discard_deletes_canonical_state: false",
  ]) {
    assert.ok(
      `${sharedRuntime}\n${allRoutes}`.includes(requiredText),
      `runtime routes/shared contract must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "parsePreviewDraftListLimit",
    "invalid_limit",
    "include_discarded must be true or false when provided.",
    "parseIncludeDiscarded",
  ]) {
    assert.ok(listRoute.includes(requiredText), `list route must include ${requiredText}`);
  }

  for (const requiredText of [
    "PREVIEW_DRAFT_ID_PATTERN",
    "validatePreviewDraftId",
    "invalid_preview_draft_id",
    "preview_draft_not_found",
  ]) {
    assert.ok(
      `${detailRoute}\n${discardRoute}`.includes(requiredText),
      `detail/discard routes must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "parseDiscardReason",
    "discard_reason must be a string when provided.",
    "discard_reason_too_large",
    "Request body must be valid JSON when provided.",
  ]) {
    assert.ok(discardRoute.includes(requiredText), `discard route must include ${requiredText}`);
  }
}

function assertDiscardMarkerSchema() {
  for (const requiredText of [
    "CREATE TABLE IF NOT EXISTS research_candidate_manual_note_preview_draft_discards",
    "discard_id TEXT PRIMARY KEY",
    "preview_draft_id TEXT NOT NULL UNIQUE",
    "scope TEXT NOT NULL DEFAULT 'project:augnes' CHECK (scope IN ('project:augnes'))",
    "discarded_at TEXT NOT NULL",
    "discarded_by TEXT NOT NULL",
    "discard_reason TEXT NOT NULL DEFAULT ''",
    "authority_json TEXT NOT NULL",
    "no_side_effects_json TEXT NOT NULL",
    "FOREIGN KEY (preview_draft_id) REFERENCES research_candidate_manual_note_preview_drafts(preview_draft_id)",
  ]) {
    assert.ok(discardTableSql.includes(requiredText), `discard schema must include ${requiredText}`);
  }

  assert.doesNotMatch(
    discardTableSql,
    /\bmanual_note_text\b|\braw_note\b|\bpasted_note\b/i,
    "discard table must not contain raw note text fields",
  );
  assert.match(
    migrations,
    /migrateResearchCandidateManualNotePreviewDraftDiscards/,
    "CLI migrations must include discard table migration",
  );
  assert.match(
    dbMigrate,
    /migrateResearchCandidateManualNotePreviewDraftDiscards\(db\)/,
    "db:migrate must run discard table migration",
  );
  assert.match(
    db,
    /migrateResearchCandidateManualNotePreviewDraftDiscardsTable\(db\)/,
    "runtime DB opener must run discard table migration",
  );
  assert.match(
    store,
    /ON CONFLICT\(preview_draft_id\) DO NOTHING/,
    "discard store must be idempotent",
  );
}

function assertUiAffordances() {
  for (const requiredText of [
    "Recent runtime preview drafts",
    "Refresh preview drafts",
    "Open preview draft",
    "Discard preview draft",
    "Active preview draft",
    "Discarded preview draft",
    "Stored parsed preview only",
    "Raw note text not stored",
    "No active runtime preview drafts yet.",
    "Parse locally",
    "Create runtime preview draft",
    "Clear local note",
    "Clear runtime result",
    "stored_preview_draft",
    "discarded_preview_draft",
    "Discard does not delete canonical state because no canonical state was created.",
  ]) {
    assert.ok(component.includes(requiredText), `UI must include ${requiredText}`);
  }

  assert.match(
    component,
    /fetch\(\s*`\$\{MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE\}\?\$\{params\.toString\(\)\}`/,
    "UI must fetch recent preview drafts from the same-origin list route constant",
  );
  assert.match(
    component,
    /buildManualNotePreviewDraftDetailRoute\(previewDraftId\)/,
    "UI must open drafts through the shared detail route builder",
  );
  assert.match(
    component,
    /buildManualNotePreviewDraftDiscardRoute\(previewDraftId\)/,
    "UI must discard drafts through the shared discard route builder",
  );
  assert.match(
    component,
    /id="research-candidate-manual-note-boundary"/,
    "authority boundary must remain near input/action area",
  );
}

function assertForbiddenPatternsAbsent() {
  for (const source of [allRoutes, store]) {
    assert.doesNotMatch(source, /\bconsole\./, "routes/store must not console log");
    assert.doesNotMatch(source, /from ["'].*openai|OPENAI_API_KEY/i, "must not import or use OpenAI");
    assert.doesNotMatch(source, /from ["'].*provider/i, "must not import providers");
    assert.doesNotMatch(source, /from ["'].*retrieval|from ["'].*rag/i, "must not import retrieval/RAG");
    assert.doesNotMatch(source, /from ["'].*source-fetch/i, "must not import source fetching");
    assert.doesNotMatch(source, /from ["'].*codex/i, "must not import Codex execution");
    assert.doesNotMatch(source, /\bfetch\(/, "routes/store must not fetch external data");
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
      store,
      new RegExp(`\\b(?:INSERT|UPDATE|DELETE)\\s+(?:INTO\\s+)?${forbiddenWrite}\\b`, "i"),
      `store must not insert/update/delete ${forbiddenWrite}`,
    );
    assert.doesNotMatch(
      allRoutes,
      new RegExp(`\\b(?:INSERT|UPDATE|DELETE)\\s+(?:INTO\\s+)?${forbiddenWrite}\\b`, "i"),
      `routes must not insert/update/delete ${forbiddenWrite}`,
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
    /smoke:research-candidate-preview-draft-read-discard-v0-1/,
    "docs index must point to read/discard smoke",
  );
  assert.match(
    index,
    /manual note preview draft read\/list\/discard/i,
    "docs index must describe manual note preview draft read/list/discard lane",
  );
  assert.equal(
    packageJson.scripts?.["smoke:research-candidate-preview-draft-read-discard-v0-1"],
    "node scripts/smoke-research-candidate-preview-draft-read-discard-v0-1.mjs",
    "package.json must expose read/discard smoke script",
  );
}

function extractTableSql(source, tableName) {
  const start = source.indexOf(`CREATE TABLE IF NOT EXISTS ${tableName}`);
  assert.notEqual(start, -1, `${tableName} must exist in schema`);
  const end = source.indexOf(");", start);
  assert.notEqual(end, -1, `${tableName} table SQL must close`);
  return source.slice(start, end + 2);
}
