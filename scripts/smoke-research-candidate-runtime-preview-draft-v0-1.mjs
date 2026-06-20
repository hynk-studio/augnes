import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const routePath =
  "app/api/research-candidate-review/manual-note-preview/route.ts";
const sharedRuntimePath =
  "lib/research-candidate-review/manual-note-runtime-preview.ts";
const storePath =
  "lib/research-candidate-review/manual-note-preview-draft-store.ts";
const parserPath = "lib/research-candidate-review/manual-note-parser.ts";
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
  "scripts/smoke-research-candidate-runtime-preview-draft-v0-1.mjs";

for (const filePath of [
  routePath,
  sharedRuntimePath,
  storePath,
  parserPath,
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

const route = readFileSync(routePath, "utf8");
const sharedRuntime = readFileSync(sharedRuntimePath, "utf8");
const store = readFileSync(storePath, "utf8");
const parser = readFileSync(parserPath, "utf8");
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
const previewDraftTableSql = extractTableSql(
  schema,
  "research_candidate_manual_note_preview_drafts",
);

assertRouteExistsAndUsesParser();
assertRuntimeValidationAndResponseShape();
assertPreviewDraftPersistenceShape();
assertUiRuntimeAction();
assertForbiddenRuntimePatterns();
assertIndexPointer();
assertPackageScript();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-runtime-preview-draft-v0-1",
      route_exists: true,
      existing_manual_note_parser_reused: true,
      non_empty_and_max_guards_checked: true,
      runtime_boundary_and_no_side_effects_checked: true,
      preview_draft_persistence_shape_checked: true,
      ui_runtime_action_checked: true,
      forbidden_authority_patterns_absent: true,
      index_pointer_checked: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertRouteExistsAndUsesParser() {
  assert.match(
    route,
    /export async function POST\(request: Request\)/,
    "route must expose POST handler",
  );
  assert.match(route, /export const runtime = "nodejs"/, "route must use node runtime");
  assert.match(
    parser,
    /export function parseManualResearchNoteToPreview\(/,
    "existing deterministic manual note parser must exist",
  );
  assert.match(
    route,
    /parseManualResearchNoteToPreview\(manualNoteText,/,
    "route must execute the existing parser locally",
  );
  assert.match(
    route,
    /from "@\/lib\/research-candidate-review\/manual-note-parser"/,
    "route must import the existing manual-note-parser",
  );
  assert.match(
    route,
    /createManualNoteInputFingerprint/,
    "route must create an input fingerprint",
  );
}

function assertRuntimeValidationAndResponseShape() {
  for (const requiredText of [
    "MAX_MANUAL_NOTE_TEXT_LENGTH = 20_000",
    "MAX_MANUAL_NOTE_BODY_BYTES = 64 * 1024",
    "manual_note_text is required.",
    "manual_note_text must be a string.",
    "manual_note_text must be ${MAX_MANUAL_NOTE_TEXT_LENGTH} characters or fewer.",
    "Request body must be valid JSON.",
    "unsupported_scope",
    "Only scope project:augnes is supported for this preview route.",
    "manual_research_candidate_runtime_preview.v0.1",
    "persisted_preview_draft",
    "route_only_no_persistence",
    "input_fingerprint",
    "created_at",
    "runtime_boundary",
    "no_side_effects",
  ]) {
    assert.ok(
      `${route}\n${sharedRuntime}`.includes(requiredText),
      `runtime route/shared contract must include ${requiredText}`,
    );
  }

  for (const requiredBoundary of [
    "same_origin_route_local_parser_only",
    "raw_manual_note_text_persisted: false",
    "durable_candidate_storage: false",
    "durable_review_storage: false",
    "durable_receipt_storage: false",
    "canonical_perspective_write: false",
    "proof_or_evidence_writes: false",
    "work_item_creation: false",
    "provider_or_openai_calls: false",
    "retrieval_or_rag: false",
    "source_fetching: false",
    "codex_execution: false",
    "external_handoff_sending: false",
    "provider_or_openai_calls_absent: true",
    "retrieval_or_source_fetching_absent: true",
    "proof_or_evidence_writes_absent: true",
    "work_item_creation_absent: true",
    "promotion_workflow_absent: true",
    "canonical_perspective_write_absent: true",
  ]) {
    assert.ok(
      sharedRuntime.includes(requiredBoundary),
      `runtime boundary must include ${requiredBoundary}`,
    );
  }
}

function assertPreviewDraftPersistenceShape() {
  assert.match(
    previewDraftTableSql,
    /CREATE TABLE IF NOT EXISTS research_candidate_manual_note_preview_drafts/,
    "preview-draft table must exist",
  );
  for (const requiredText of [
    "status TEXT NOT NULL CHECK (status IN ('preview_draft'))",
    "scope TEXT NOT NULL DEFAULT 'project:augnes' CHECK (scope IN ('project:augnes'))",
    "source_kind TEXT NOT NULL CHECK (source_kind IN ('manual_paste'))",
    "operator_note_label TEXT",
    "parser_version TEXT NOT NULL",
    "preview_version TEXT NOT NULL",
    "input_fingerprint TEXT NOT NULL",
    "manual_note_text_stored INTEGER NOT NULL DEFAULT 0 CHECK (manual_note_text_stored = 0)",
    "preview_json TEXT NOT NULL",
    "warnings_json TEXT NOT NULL DEFAULT '[]'",
    "authority_json TEXT NOT NULL",
    "runtime_boundary_json TEXT NOT NULL",
    "no_side_effects_json TEXT NOT NULL",
    "promoted_at TEXT CHECK (promoted_at IS NULL)",
    "canonical_perspective_id TEXT CHECK (canonical_perspective_id IS NULL)",
    "proof_id TEXT CHECK (proof_id IS NULL)",
    "evidence_id TEXT CHECK (evidence_id IS NULL)",
    "work_item_id TEXT CHECK (work_item_id IS NULL)",
  ]) {
    assert.ok(
      previewDraftTableSql.includes(requiredText),
      `preview-draft schema must include ${requiredText}`,
    );
  }
  assert.doesNotMatch(
    previewDraftTableSql,
    /\bmanual_note_text\s+TEXT\b/i,
    "preview-draft schema must not persist raw manual note text",
  );
  assert.match(
    store,
    /INSERT INTO research_candidate_manual_note_preview_drafts/,
    "store must write the preview-draft table",
  );
  assert.match(
    store,
    /INSERT INTO research_candidate_manual_note_preview_draft_activities/,
    "store may write metadata-only preview-draft activity rows",
  );
  assert.match(
    store,
    /manual_note_text_stored:\s*0/,
    "store must mark raw note text as not stored",
  );
  assert.match(
    db,
    /migrateResearchCandidateManualNotePreviewDraftsTable\(db\)/,
    "runtime DB opener must run preview-draft migration",
  );
  assert.match(
    migrations,
    /export function migrateResearchCandidateManualNotePreviewDrafts\(db\)/,
    "CLI migration helper must expose preview-draft migration",
  );
  assert.match(
    dbMigrate,
    /migrateResearchCandidateManualNotePreviewDrafts\(db\)/,
    "db:migrate must run preview-draft migration",
  );
}

function assertUiRuntimeAction() {
  for (const requiredText of [
    "Parse locally",
    "Create runtime preview draft",
    "Clear local note",
    "Clear runtime result",
    "MANUAL_NOTE_PREVIEW_ROUTE",
    "fetch(MANUAL_NOTE_PREVIEW_ROUTE",
    "persist_preview_draft: true",
    "Runtime preview draft metadata",
    "input_fingerprint",
    "preview_draft_id",
    "persistence_mode",
    "runtime_boundary",
    "no_side_effects",
    "Local parser execution remains available.",
    "Runtime action uses the same-origin bounded preview route only.",
    "Optional DB write is a non-canonical preview draft.",
    "Raw pasted note text is not persisted.",
  ]) {
    assert.ok(component.includes(requiredText), `component must include ${requiredText}`);
  }
  assert.match(
    component,
    /parseManualResearchNoteToPreview\(manualNoteText\)/,
    "component must retain direct local parsing",
  );
  assert.doesNotMatch(
    component,
    /function useSampleNote\(\)[\s\S]*parseManualResearchNoteToPreview/,
    "sample note action must not auto-parse",
  );
  assert.doesNotMatch(
    component,
    /localStorage|sessionStorage|indexedDB|document\.cookie/,
    "component must not use browser persistence",
  );
}

function assertForbiddenRuntimePatterns() {
  for (const { label, regex } of [
    { label: "console logging raw input", regex: /\bconsole\./ },
    { label: "external fetch", regex: /\bfetch\s*\(\s*["'`]https?:\/\//i },
    { label: "OpenAI key", regex: /\bOPENAI_API_KEY\b/ },
    { label: "OpenAI endpoint", regex: /\bapi\.openai\.com\b/i },
    { label: "OpenAI client", regex: /\bnew\s+OpenAI\b/ },
    { label: "provider client", regex: /\b(providerClient|providerRun|callProvider)\b/i },
    { label: "retrieval implementation", regex: /\b(retrieveSources|ragIndex|vectorStore|embedding|embeddings|crawler|scrapeSource)\b/i },
    { label: "promotion workflow", regex: /\b(promotePerspective|promoteCandidate|rejectCandidate|deferCandidate|approveCandidate)\b/ },
    { label: "proof write helper", regex: /\b(recordProof|createProof|proofWrite)\b/ },
    { label: "evidence write helper", regex: /\b(recordEvidence|createEvidence|evidenceWrite)\b/ },
    { label: "work item create helper", regex: /\b(createWorkItem|newWorkItem|workItemCreate)\b/ },
    { label: "Codex execution", regex: /\b(executeCodex|runCodex|launchCodex)\b/ },
    { label: "external handoff send", regex: /\b(sendHandoff|postHandoff|navigator\.sendBeacon)\b/ },
  ]) {
    assert.doesNotMatch(
      `${route}\n${sharedRuntime}\n${store}\n${component}`,
      regex,
      `runtime lane must not include ${label}`,
    );
  }

  for (const forbiddenTable of [
    "verification_evidence_records",
    "action_records",
    "work_items",
    "work_events",
    "perspective_memory_items",
    "perspective_memory_product_persistence_boundary_records",
    "state_entries",
    "state_transitions",
    "state_delta_proposals",
  ]) {
    assert.doesNotMatch(
      `${route}\n${store}`,
      new RegExp(`INSERT\\s+INTO\\s+${forbiddenTable}\\b`, "i"),
      `runtime lane must not insert into ${forbiddenTable}`,
    );
    assert.doesNotMatch(
      `${route}\n${store}`,
      new RegExp(`UPDATE\\s+${forbiddenTable}\\b`, "i"),
      `runtime lane must not update ${forbiddenTable}`,
    );
  }
}

function assertIndexPointer() {
  for (const requiredText of [
    "app/api/research-candidate-review/manual-note-preview",
    "bounded runtime preview route",
    sharedRuntimePath,
    storePath,
    "research_candidate_manual_note_preview_drafts",
    smokePath,
    "smoke:research-candidate-runtime-preview-draft-v0-1",
  ]) {
    assert.ok(index.includes(requiredText), `docs index must include ${requiredText}`);
  }
}

function assertPackageScript() {
  assert.equal(
    packageJson.scripts?.["smoke:research-candidate-runtime-preview-draft-v0-1"],
    "node scripts/smoke-research-candidate-runtime-preview-draft-v0-1.mjs",
    "package.json must include the runtime preview draft smoke script",
  );
}

function extractTableSql(source, tableName) {
  const start = source.indexOf(`CREATE TABLE IF NOT EXISTS ${tableName}`);
  assert.notEqual(start, -1, `${tableName} table must be declared`);
  const nextTable = source.indexOf("CREATE TABLE IF NOT EXISTS", start + 1);
  return source.slice(start, nextTable === -1 ? undefined : nextTable);
}
