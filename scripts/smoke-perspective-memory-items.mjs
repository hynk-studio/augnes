import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const tempDir = mkdtempSync(path.join(tmpdir(), "augnes-memory-items-smoke-"));
process.env.AUGNES_DB_PATH = path.join(tempDir, "augnes.db");

const itemModel = await import(
  "../lib/perspective-ingest/perspective-memory-item.ts"
);
const itemStore = await import(
  "../lib/perspective-ingest/perspective-memory-item-store.ts"
);
const { openDatabase } = await import("../lib/db.ts");

const packageFile = "package.json";
const itemModelFile = "lib/perspective-ingest/perspective-memory-item.ts";
const itemStoreFile =
  "lib/perspective-ingest/perspective-memory-item-store.ts";
const dbFile = "lib/db.ts";
const schemaFile = "lib/db/schema.sql";
const dbMigrationsFile = "scripts/db-migrations.mjs";
const dbMigrateFile = "scripts/db-migrate.mjs";
const apiRouteFile = "app/api/perspective/memory/items/route.ts";
const apiItemRouteFile = "app/api/perspective/memory/items/[itemId]/route.ts";
const dashboardRouteFile = "app/cockpit/perspective/memory-items/page.tsx";
const dashboardComponentFile =
  "app/cockpit/perspective/memory-items/perspective-memory-items-surface.tsx";
const dashboardCssFile =
  "app/cockpit/perspective/memory-items/perspective-memory-items-surface.module.css";
const boundaryInboxComponentFile =
  "app/cockpit/perspective/memory-boundary-review-inbox/memory-boundary-review-inbox-surface.tsx";
const boundaryInboxDocFile =
  "docs/PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_REVIEW_INBOX_V0_1.md";
const boundaryDocFile =
  "docs/PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_V0_1.md";
const itemDocFile = "docs/PERSPECTIVE_MEMORY_ITEMS_V0_1.md";
const itemReportFile = "reports/2026-06-13-perspective-memory-items.md";
const itemBrowserReportFile =
  "reports/browser/2026-06-13-perspective-memory-items.md";
const browserSmokeFile =
  "scripts/browser-smoke-perspective-memory-items.mjs";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const itemModelText = readFileSync(itemModelFile, "utf8");
const itemStoreText = readFileSync(itemStoreFile, "utf8");
const dbText = readFileSync(dbFile, "utf8");
const schemaText = readFileSync(schemaFile, "utf8");
const dbMigrationsText = readFileSync(dbMigrationsFile, "utf8");
const dbMigrateText = readFileSync(dbMigrateFile, "utf8");
const apiRouteText = readFileSync(apiRouteFile, "utf8");
const apiItemRouteText = readFileSync(apiItemRouteFile, "utf8");
const dashboardRouteText = readFileSync(dashboardRouteFile, "utf8");
const dashboardComponentText = readFileSync(dashboardComponentFile, "utf8");
const dashboardCssText = readFileSync(dashboardCssFile, "utf8");
const boundaryInboxComponentText = readFileSync(
  boundaryInboxComponentFile,
  "utf8",
);
const itemDocText = readFileSync(itemDocFile, "utf8");
const itemReportText = readFileSync(itemReportFile, "utf8");
const itemBrowserReportText = readFileSync(itemBrowserReportFile, "utf8");
const boundaryInboxDocText = readFileSync(boundaryInboxDocFile, "utf8");
const boundaryDocText = readFileSync(boundaryDocFile, "utf8");

try {
  assertStaticFiles();
  assertItemModelBehavior();
  assertStoreBehavior();
  assertDocsReportsAndBoundaries();
  console.log("PASS smoke:perspective-memory-items");
} finally {
  rmSync(tempDir, { force: true, recursive: true });
}

function assertStaticFiles() {
  for (const file of [
    itemModelFile,
    itemStoreFile,
    dbFile,
    schemaFile,
    dbMigrationsFile,
    dbMigrateFile,
    apiRouteFile,
    apiItemRouteFile,
    dashboardRouteFile,
    dashboardComponentFile,
    dashboardCssFile,
    boundaryInboxComponentFile,
    itemDocFile,
    itemReportFile,
    itemBrowserReportFile,
    browserSmokeFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }

  assert.equal(
    packageJson.scripts["smoke:perspective-memory-items"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-memory-items.mjs",
  );
  assert.equal(
    packageJson.scripts["browser:perspective-memory-items"],
    "node scripts/browser-smoke-perspective-memory-items.mjs",
  );

  assertIncludesAll(itemModelText, [
    "perspective_memory_item.v0.1",
    "perspective_memory_item_content.v0.1",
    "perspective_memory_item_list.v0.1",
    "/api/perspective/memory/items",
    "/cockpit/perspective/memory-items",
    "sqlite:lib/db.ts",
    "buildPerspectiveMemoryItemFromBoundaryRecord",
    "canBuildPerspectiveMemoryItemFromBoundaryRecord",
    "isItemContent",
    "isItemAcceptance",
    "isSourceBoundarySnapshot",
    "isAvailability",
    "isItemAuthorityBoundary",
    "isStringArray",
    "collectPerspectiveMemoryItemUnsafeMarkers(item).length",
    "should_write_to_memory_now",
    "automatic_runtime_injection_enabled: false",
    "core_memory_enabled: false",
    "provider_model_call_created: false",
    "github_mutation_created: false",
  ]);
  assertIncludesAll(itemStoreText, [
    "perspective_memory_items",
    "source_boundary_record_id",
    "idempotent_replay: true",
    "updatePerspectiveMemoryItemStatusInStore",
  ]);
  assertIncludesAll(dbText, [
    "migratePerspectiveMemoryItemsTable",
    "perspective_memory_items",
    "idx_perspective_memory_items_status_time",
  ]);
  assertIncludesAll(schemaText, [
    "CREATE TABLE IF NOT EXISTS perspective_memory_items",
    "source_boundary_record_id TEXT NOT NULL UNIQUE",
    "idx_perspective_memory_items_boundary",
  ]);
  assertIncludesAll(dbMigrationsText, [
    "perspectiveMemoryItemsTableSql",
    "migratePerspectiveMemoryItems",
    "perspective_memory_items",
  ]);
  assertIncludesAll(dbMigrateText, [
    "migratePerspectiveMemoryItems",
    "perspective_memory_items",
  ]);
  assertIncludesAll(apiRouteText, [
    "POST",
    "GET",
    "source_boundary_record_id",
    "user_confirmed_create_persisted_perspective_memory_item",
    "idempotent_replay",
    "result_state: \"BLOCKED\"",
  ]);
  assertIncludesAll(apiItemRouteText, [
    "GET",
    "PATCH",
    "item_status",
    "updatePerspectiveMemoryItemStatusInStore",
  ]);
  assertIncludesAll(dashboardRouteText, ["PerspectiveMemoryItemsSurface"]);
  assertIncludesAll(dashboardComponentText, [
    "Perspective-Memory Items",
    "data-augnes-perspective-memory-items-dashboard",
    "data-augnes-perspective-memory-item-list",
    "data-augnes-perspective-memory-item-detail",
    "data-augnes-perspective-memory-item-content",
    "data-augnes-perspective-memory-item-acceptance",
    "data-augnes-perspective-memory-item-source-boundary-snapshot",
    "data-augnes-perspective-memory-item-availability",
    "data-augnes-perspective-memory-item-authority-boundary",
    "data-augnes-memory-item-status-accepted",
    "data-augnes-memory-item-status-reviewing",
    "data-augnes-memory-item-status-retracted",
    "data-augnes-memory-item-status-superseded",
    "data-augnes-memory-item-status-deprecated",
    "not Core decision",
    "not automatic runtime injection",
    "sqlite:lib/db.ts",
  ]);
  assertIncludesAll(dashboardCssText, [
    ".shell",
    ".grid",
    ".statusStrip",
    ".itemList",
    ".detailGrid",
    "@media (max-width: 900px)",
    "@media (max-width: 520px)",
  ]);
  assertIncludesAll(boundaryInboxComponentText, [
    "Perspective Memory Item",
    "Create persisted perspective-memory item",
    "data-augnes-perspective-memory-item-panel",
    "data-augnes-create-perspective-memory-item",
    "data-augnes-memory-item-confirm-create",
    "data-augnes-memory-item-confirm-not-core-decision",
    "data-augnes-memory-item-confirm-no-runtime-injection",
    "data-augnes-memory-item-confirm-source-preserved",
    "data-augnes-open-perspective-memory-items-dashboard",
  ]);
}

function assertItemModelBehavior() {
  const confirmed = itemConfirmation();
  const passBoundary = makeBoundaryRecord();
  const passItem = itemModel.buildPerspectiveMemoryItemFromBoundaryRecord({
    nowIso: "2026-06-13T00:01:00.000Z",
    itemId: "perspective-memory-item:pass",
    boundaryRecord: passBoundary,
    userConfirmation: confirmed,
  });
  assert.equal(passItem.ok, true);
  assert.equal(passItem.item.item_version, itemModel.PERSPECTIVE_MEMORY_ITEM_VERSION);
  assert.equal(
    passItem.item.content.content_version,
    itemModel.PERSPECTIVE_MEMORY_ITEM_CONTENT_VERSION,
  );
  assert.equal(passItem.item.item_status, "accepted");
  assert.equal(passItem.item.memory_kind, "perspective_candidate");
  assert.equal(passItem.item.acceptance.user_confirmed_not_core_decision, true);
  assert.equal(
    passItem.item.availability.automatic_runtime_injection_enabled,
    false,
  );
  assert.equal(passItem.item.authority_boundary.core_decision_created, false);
  assert.equal(
    passItem.item.authority_boundary.automatic_runtime_injection_created,
    false,
  );
  assert.equal(passItem.item.authority_boundary.provider_model_call_created, false);
  assert.equal(passItem.item.authority_boundary.github_mutation_created, false);
  assert.equal(
    itemModel.safeParsePerspectiveMemoryItem(JSON.stringify(passItem.item))
      ?.item_id,
    passItem.item.item_id,
  );
  assertMalformedPersistedItemRejected(
    "missing content.source_refs",
    passItem.item,
    (item) => {
      delete item.content.source_refs;
    },
  );
  assertMalformedPersistedItemRejected(
    "content.risk_notes not an array",
    passItem.item,
    (item) => {
      item.content.risk_notes = "warning text";
    },
  );
  assertMalformedPersistedItemRejected(
    "missing acceptance.acceptance_label",
    passItem.item,
    (item) => {
      delete item.acceptance.acceptance_label;
    },
  );
  assertMalformedPersistedItemRejected(
    "source boundary snapshot write-now flag true",
    passItem.item,
    (item) => {
      item.source_boundary_snapshot.checklist_ready_for_memory_write_now = true;
    },
  );
  assertMalformedPersistedItemRejected(
    "availability automatic runtime injection true",
    passItem.item,
    (item) => {
      item.availability.automatic_runtime_injection_enabled = true;
    },
  );
  assertMalformedPersistedItemRejected(
    "authority state entry true",
    passItem.item,
    (item) => {
      item.authority_boundary.state_entry_created = true;
    },
  );
  assertMalformedPersistedItemRejected(
    "unsafe marker in content summary",
    passItem.item,
    (item) => {
      item.content.summary = "TOKEN=unsafe";
    },
  );
  assertMalformedPersistedItemRejected(
    "unsafe marker in source boundary snapshot",
    passItem.item,
    (item) => {
      item.source_boundary_snapshot.user_confirmation_from_boundary_record = {
        unsafe: "TOKEN=unsafe",
      };
    },
  );

  const passFollowUp = itemModel.buildPerspectiveMemoryItemFromBoundaryRecord({
    nowIso: "2026-06-13T00:01:01.000Z",
    itemId: "perspective-memory-item:pass-follow-up",
    boundaryRecord: makeBoundaryRecord({
      record_id: "perspective-memory-boundary:pass-follow-up",
      source_validation_result_state: "PASS with follow-up",
      proposed_memory_payload: {
        ...passBoundary.proposed_memory_payload,
        risk_notes: [
          "PASS with follow-up caveat remains before durable synthesis.",
          "1 warning; 1 pointer warning",
        ],
      },
    }),
    userConfirmation: confirmed,
  });
  assert.equal(passFollowUp.ok, true);
  assert.equal(
    passFollowUp.item.content.risk_notes.some((note) =>
      note.includes("PASS with follow-up"),
    ),
    true,
  );

  assertBlocked("retracted boundary record cannot create item", {
    boundaryRecord: makeBoundaryRecord({
      record_id: "perspective-memory-boundary:retracted",
      boundary_status: "retracted_before_memory_write",
    }),
    userConfirmation: confirmed,
  });
  assertBlocked("boundary record not ready cannot create item", {
    boundaryRecord: makeBoundaryRecord({
      record_id: "perspective-memory-boundary:not-ready",
      checklist_ready_for_product_persistence_review: false,
    }),
    userConfirmation: confirmed,
  });
  assertBlocked("ready_for_memory_write_now true cannot create item", {
    boundaryRecord: makeBoundaryRecord({
      record_id: "perspective-memory-boundary:write-now",
      checklist_ready_for_memory_write_now: true,
    }),
    userConfirmation: confirmed,
  });
  assertBlocked("should_write_to_memory_now true cannot create item", {
    boundaryRecord: makeBoundaryRecord({
      record_id: "perspective-memory-boundary:payload-write-now",
      proposed_memory_payload: {
        ...passBoundary.proposed_memory_payload,
        should_write_to_memory_now: true,
      },
    }),
    userConfirmation: confirmed,
  });
  assertBlocked("missing confirmations reject", {
    boundaryRecord: passBoundary,
    userConfirmation: {
      ...confirmed,
      user_confirmed_no_automatic_runtime_injection: false,
    },
  });
  assertBlocked("unsafe marker rejects", {
    boundaryRecord: makeBoundaryRecord({
      record_id: "perspective-memory-boundary:unsafe",
      local_review_notes: "TOKEN=unsafe",
    }),
    userConfirmation: confirmed,
  });

  const serialized = JSON.stringify(passItem.item);
  for (const marker of [
    "raw returned envelope text",
    "raw prompt",
    "raw candidate payload",
    "provider logs",
    "TOKEN=",
    "browser dump",
  ]) {
    assert.equal(
      serialized.includes(marker),
      false,
      `item must not persist marker: ${marker}`,
    );
  }

  const updated = itemModel.updatePerspectiveMemoryItemStatus(
    passItem.item,
    "reviewing",
    "2026-06-13T00:02:00.000Z",
  );
  assert.equal(updated.item_status, "reviewing");
  assert.equal(updated.content.title, passItem.item.content.title);
  assert.equal(
    updated.source_boundary_record_id,
    passItem.item.source_boundary_record_id,
  );

  const filtered = itemModel.filterPerspectiveMemoryItems(
    [passItem.item, passFollowUp.item, updated],
    { sourceValidationResultState: "PASS with follow-up", limit: 10 },
  );
  assert.equal(filtered.length, 1);
}

function assertStoreBehavior() {
  const confirmed = itemConfirmation();
  const boundary = makeBoundaryRecord({
    record_id: "perspective-memory-boundary:store",
  });
  insertBoundaryRecord(boundary);

  const created = itemStore.createPerspectiveMemoryItemFromBoundaryRecord({
    sourceBoundaryRecordId: boundary.record_id,
    userConfirmation: confirmed,
    itemId: "perspective-memory-item:store",
    nowIso: "2026-06-13T00:03:00.000Z",
  });
  assert.equal(created.ok, true);
  assert.equal(created.created, true);
  assert.equal(created.idempotent_replay, false);

  const replay = itemStore.createPerspectiveMemoryItemFromBoundaryRecord({
    sourceBoundaryRecordId: boundary.record_id,
    userConfirmation: confirmed,
    itemId: "perspective-memory-item:store-replay",
    nowIso: "2026-06-13T00:03:01.000Z",
  });
  assert.equal(replay.ok, true);
  assert.equal(replay.created, false);
  assert.equal(replay.idempotent_replay, true);
  assert.equal(replay.item.item_id, created.item.item_id);

  const listed = itemStore.listPerspectiveMemoryItems({ limit: 10 });
  assert.equal(listed.item_list_version, itemModel.PERSPECTIVE_MEMORY_ITEM_LIST_VERSION);
  assert.equal(listed.items.length, 1);
  const malformedStoredItem = cloneItem(created.item);
  malformedStoredItem.item_id = "perspective-memory-item:malformed-row";
  malformedStoredItem.source_boundary_record_id =
    "perspective-memory-boundary:malformed-row";
  delete malformedStoredItem.content.source_refs;
  insertMemoryItemRow(created.item, {
    item_id: malformedStoredItem.item_id,
    source_boundary_record_id: malformedStoredItem.source_boundary_record_id,
    item_json: JSON.stringify(malformedStoredItem),
  });
  const listedAfterMalformed = itemStore.listPerspectiveMemoryItems({ limit: 10 });
  assert.equal(
    listedAfterMalformed.items.length,
    1,
    "malformed persisted item_json row must be ignored during list rehydration",
  );
  const byBoundary = itemStore.getPerspectiveMemoryItemBySourceBoundaryRecord(
    boundary.record_id,
  );
  assert.equal(byBoundary?.item_id, created.item.item_id);
  const sourceBefore = JSON.stringify(created.item.content);
  const updated = itemStore.updatePerspectiveMemoryItemStatusInStore({
    itemId: created.item.item_id,
    itemStatus: "deprecated",
  });
  assert.equal(updated.ok, true);
  assert.equal(updated.item.item_status, "deprecated");
  assert.equal(JSON.stringify(updated.item.content), sourceBefore);
  assert.equal(updated.item.source_boundary_record_id, boundary.record_id);

  const filtered = itemStore.listPerspectiveMemoryItems({
    itemStatus: "deprecated",
    limit: 10,
  });
  assert.equal(filtered.items.length, 1);
}

function assertDocsReportsAndBoundaries() {
  for (const text of [
    itemDocText,
    itemReportText,
    itemBrowserReportText,
    boundaryInboxDocText,
    boundaryDocText,
  ]) {
    assertIncludesAll(text, [
      "perspective-memory item",
      "sqlite:lib/db.ts",
      "/cockpit/perspective/memory-items",
      "Core decision",
      "runtime injection",
      "not automatic promotion",
    ]);
  }
  assertIncludesAll(itemDocText + itemReportText, [
    "source_boundary_record_id",
    "idempotent",
    "item_status",
    "accepted",
    "reviewing",
    "retracted",
    "superseded",
    "deprecated",
  ]);
  assertNoIncludes(itemStoreText + apiRouteText + apiItemRouteText, [
    "new OpenAI",
    "openai.chat",
    "@openai/codex",
    "Codex(",
    "new Octokit",
    "@octokit",
    "createCoreDecision",
    "runtime handoff",
    "automatic promotion created",
  ]);
  assertNoIncludes(dashboardComponentText + boundaryInboxComponentText, [
    "data-augnes-send-to-core",
    "data-augnes-create-core-decision",
    "data-augnes-auto-inject-runtime",
    "data-augnes-auto-promote",
    "data-augnes-provider-model-enrich",
    "data-augnes-github-mutation",
    "data-augnes-commit-state-entry",
  ]);
}

function assertBlocked(label, input) {
  const result = itemModel.buildPerspectiveMemoryItemFromBoundaryRecord({
    nowIso: "2026-06-13T00:04:00.000Z",
    itemId: `perspective-memory-item:${label.replaceAll(" ", "-")}`,
    ...input,
  });
  assert.equal(result.ok, false, label);
  assert(result.blocked_reasons.length > 0, label);
}

function assertMalformedPersistedItemRejected(label, validItem, mutate) {
  const malformed = cloneItem(validItem);
  mutate(malformed);
  assert.equal(
    itemModel.safeParsePerspectiveMemoryItem(JSON.stringify(malformed)),
    null,
    `safeParsePerspectiveMemoryItem must reject ${label}`,
  );
}

function cloneItem(item) {
  return JSON.parse(JSON.stringify(item));
}

function insertBoundaryRecord(record) {
  const db = openDatabase();
  try {
    db.prepare(
      `
        INSERT INTO perspective_memory_product_persistence_boundary_records (
          record_id,
          boundary_status,
          source_checklist_id,
          source_proposal_id,
          source_queue_item_id,
          source_candidate_draft_id,
          source_validation_result_state,
          source_validation_summary_hash,
          source_input_ref,
          source_input_hash,
          prepare_summary_ref,
          prepare_execution_summary_hash,
          returned_envelope_hash,
          source_proposal_hash,
          record_json,
          created_at,
          updated_at
        )
        VALUES (
          @record_id,
          @boundary_status,
          @source_checklist_id,
          @source_proposal_id,
          @source_queue_item_id,
          @source_candidate_draft_id,
          @source_validation_result_state,
          @source_validation_summary_hash,
          @source_input_ref,
          @source_input_hash,
          @prepare_summary_ref,
          @prepare_execution_summary_hash,
          @returned_envelope_hash,
          @source_proposal_hash,
          @record_json,
          @created_at,
          @updated_at
        )
      `,
    ).run({
      record_id: record.record_id,
      boundary_status: record.boundary_status,
      source_checklist_id: record.source_checklist_id,
      source_proposal_id: record.source_proposal_id,
      source_queue_item_id: record.source_queue_item_id,
      source_candidate_draft_id: record.source_candidate_draft_id,
      source_validation_result_state: record.source_validation_result_state,
      source_validation_summary_hash: record.source_validation_summary_hash,
      source_input_ref: record.source_input_ref,
      source_input_hash: record.source_input_hash,
      prepare_summary_ref: record.prepare_summary_ref,
      prepare_execution_summary_hash: record.prepare_execution_summary_hash,
      returned_envelope_hash: record.returned_envelope_hash,
      source_proposal_hash: record.source_proposal_hash,
      record_json: JSON.stringify(record),
      created_at: record.created_at,
      updated_at: record.updated_at,
    });
  } finally {
    db.close();
  }
}

function insertMemoryItemRow(validItem, overrides = {}) {
  const row = {
    item_id: overrides.item_id ?? validItem.item_id,
    item_status: overrides.item_status ?? validItem.item_status,
    memory_kind: overrides.memory_kind ?? validItem.memory_kind,
    source_boundary_record_id:
      overrides.source_boundary_record_id ??
      validItem.source_boundary_record_id,
    source_checklist_id: overrides.source_checklist_id ?? validItem.source_checklist_id,
    source_proposal_id: overrides.source_proposal_id ?? validItem.source_proposal_id,
    source_queue_item_id: overrides.source_queue_item_id ?? validItem.source_queue_item_id,
    source_candidate_draft_id:
      overrides.source_candidate_draft_id ??
      validItem.source_candidate_draft_id,
    source_validation_result_state:
      overrides.source_validation_result_state ??
      validItem.source_validation_result_state,
    source_validation_summary_hash:
      overrides.source_validation_summary_hash ??
      validItem.source_validation_summary_hash,
    source_input_ref: overrides.source_input_ref ?? validItem.source_input_ref,
    source_input_hash: overrides.source_input_hash ?? validItem.source_input_hash,
    prepare_summary_ref:
      overrides.prepare_summary_ref ?? validItem.prepare_summary_ref,
    prepare_execution_summary_hash:
      overrides.prepare_execution_summary_hash ??
      validItem.prepare_execution_summary_hash,
    returned_envelope_hash:
      overrides.returned_envelope_hash ?? validItem.returned_envelope_hash,
    source_proposal_hash:
      overrides.source_proposal_hash ?? validItem.source_proposal_hash,
    item_title: overrides.item_title ?? validItem.content.title,
    item_summary: overrides.item_summary ?? validItem.content.summary,
    item_json: overrides.item_json ?? JSON.stringify(validItem),
    created_at: overrides.created_at ?? validItem.created_at,
    updated_at: overrides.updated_at ?? validItem.updated_at,
  };
  const db = openDatabase();
  try {
    db.prepare(
      `
        INSERT INTO perspective_memory_items (
          item_id,
          item_status,
          memory_kind,
          source_boundary_record_id,
          source_checklist_id,
          source_proposal_id,
          source_queue_item_id,
          source_candidate_draft_id,
          source_validation_result_state,
          source_validation_summary_hash,
          source_input_ref,
          source_input_hash,
          prepare_summary_ref,
          prepare_execution_summary_hash,
          returned_envelope_hash,
          source_proposal_hash,
          item_title,
          item_summary,
          item_json,
          created_at,
          updated_at
        )
        VALUES (
          @item_id,
          @item_status,
          @memory_kind,
          @source_boundary_record_id,
          @source_checklist_id,
          @source_proposal_id,
          @source_queue_item_id,
          @source_candidate_draft_id,
          @source_validation_result_state,
          @source_validation_summary_hash,
          @source_input_ref,
          @source_input_hash,
          @prepare_summary_ref,
          @prepare_execution_summary_hash,
          @returned_envelope_hash,
          @source_proposal_hash,
          @item_title,
          @item_summary,
          @item_json,
          @created_at,
          @updated_at
        )
      `,
    ).run(row);
  } finally {
    db.close();
  }
}

function makeBoundaryRecord(overrides = {}) {
  const base = {
    record_version:
      "perspective_memory_product_persistence_boundary_record.v0.1",
    record_id: "perspective-memory-boundary:base",
    created_at: "2026-06-13T00:00:00.000Z",
    updated_at: "2026-06-13T00:00:00.000Z",
    source: "local_write_proposal_review_checklist",
    source_checklist_id: "checklist:base",
    source_proposal_id: "proposal:base",
    source_queue_item_id: "queue-item:base",
    source_candidate_draft_id: "candidate-draft:base",
    source_validation_result_state: "PASS",
    source_validation_summary_hash: "sha256:validation-summary",
    source_input_ref: "source-input:fixture",
    source_input_hash: "sha256:source-input",
    prepare_summary_ref: "prepare-summary:fixture",
    prepare_execution_summary_hash: "sha256:prepare-summary",
    returned_envelope_hash: "sha256:returned-envelope",
    checklist_status_at_creation:
      "locally_ready_for_product_persistence_review",
    checklist_ready_for_product_persistence_review: true,
    checklist_ready_for_memory_write_now: false,
    source_proposal_hash: "sha256:source-proposal",
    proposed_memory_payload: {
      payload_version: "perspective_memory_candidate_write_payload.v0.1",
      title: "Perspective memory candidate from reviewed boundary",
      summary:
        "Bounded summary of the reviewed perspective-memory candidate payload.",
      memory_kind: "perspective_candidate",
      source_refs: ["pr:537", "source-input:fixture", "prepare-summary:fixture"],
      evidence_refs: [
        "source_input_hash:sha256:source-input",
        "returned_envelope_hash:sha256:returned-envelope",
      ],
      risk_notes: ["0 warnings", "0 pointer warnings"],
      unresolved_tensions: ["not captured in local queue item"],
      carry_forward_questions: [
        "Should this perspective candidate become durable memory?",
        "Does PASS with follow-up require another validation pass before persistence?",
      ],
      suggested_next_review_action:
        "Review before Core-facing promotion or runtime usage.",
      should_write_to_memory_now: false,
    },
    proposal_diff_summary: {
      included_from_queue_item: ["memory candidate preview", "source refs"],
      excluded_from_queue_item: ["queue-only local status"],
      excluded_raw_material: [
        "returned envelope text excluded",
        "prompt text excluded",
        "candidate payload excluded",
        "provider logs excluded",
      ],
      authority_boundary_notes: ["boundary record is not Core memory"],
    },
    checklist_gate_summary: {
      required_gate_count: 10,
      completed_required_gate_count: 10,
      optional_gate_count: 2,
      completed_optional_gate_count: 1,
      checked_required_gates: [
        "source_refs_reviewed",
        "validation_result_reviewed",
        "proposed_payload_reviewed",
        "raw_material_exclusion_reviewed",
        "authority_boundary_reviewed",
        "risk_notes_reviewed",
        "unresolved_tensions_reviewed",
        "carry_forward_questions_reviewed",
        "source_state_reviewed",
        "final_user_intent_confirmed",
      ],
      not_applicable_gates: ["pass_follow_up_caveat_reviewed"],
      blocked_gates: [],
    },
    local_review_notes: "Local checklist completed for product boundary review.",
    user_confirmation: {
      confirmed_at: "2026-06-13T00:00:00.000Z",
      confirmation_label: "Create product persistence boundary record",
      user_confirmed_not_accepted_memory: true,
      user_confirmed_not_core_decision: true,
      user_confirmed_no_automatic_promotion: true,
    },
    boundary_status: "product_persistence_boundary_recorded",
    next_allowed_actions: {
      can_review_boundary_record: true,
      can_keep_for_later: true,
      can_retract_before_memory_write: true,
      can_create_accepted_memory: false,
      can_create_core_decision: false,
      can_auto_promote: false,
    },
    authority_boundary: {
      product_persistence_boundary_record_created: true,
      accepted_augnes_memory_created: false,
      product_memory_write_created: false,
      review_decision_created: false,
      core_decision_created: false,
      runtime_handoff_created: false,
      automatic_promotion: false,
    },
  };
  return { ...base, ...overrides };
}

function itemConfirmation() {
  return {
    user_confirmed_create_persisted_perspective_memory_item: true,
    user_confirmed_not_core_decision: true,
    user_confirmed_no_automatic_runtime_injection: true,
    user_confirmed_source_boundary_record_preserved: true,
  };
}

function assertIncludesAll(text, snippets) {
  for (const snippet of snippets) {
    assert(text.includes(snippet), `expected source to include ${snippet}`);
  }
}

function assertNoIncludes(text, snippets) {
  for (const snippet of snippets) {
    assert(!text.includes(snippet), `source must not include ${snippet}`);
  }
}
