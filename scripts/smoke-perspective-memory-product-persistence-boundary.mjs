import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import localReviewQueue from "../lib/perspective-ingest/perspective-memory-local-review-queue.ts";
import writeProposal from "../lib/perspective-ingest/perspective-memory-local-write-proposal.ts";
import checklistModel from "../lib/perspective-ingest/perspective-memory-local-write-proposal-review-checklist.ts";
import boundaryModel from "../lib/perspective-ingest/perspective-memory-product-persistence-boundary.ts";
import boundaryStore from "../lib/perspective-ingest/perspective-memory-product-persistence-boundary-store.ts";

const packageFile = "package.json";
const modelFile =
  "lib/perspective-ingest/perspective-memory-product-persistence-boundary.ts";
const storeFile =
  "lib/perspective-ingest/perspective-memory-product-persistence-boundary-store.ts";
const dbFile = "lib/db.ts";
const schemaFile = "lib/db/schema.sql";
const apiRouteFile =
  "app/api/perspective/memory/product-persistence-boundary/records/route.ts";
const apiRecordRouteFile =
  "app/api/perspective/memory/product-persistence-boundary/records/[recordId]/route.ts";
const queueSurfaceFile =
  "app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.tsx";
const docFile =
  "docs/PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_V0_1.md";
const checklistDocFile =
  "docs/PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_V0_1.md";
const reportFile =
  "reports/2026-06-13-perspective-memory-product-persistence-boundary.md";
const browserReportFile =
  "reports/browser/2026-06-13-perspective-memory-local-review-queue.md";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const modelText = readFileSync(modelFile, "utf8");
const storeText = readFileSync(storeFile, "utf8");
const dbText = readFileSync(dbFile, "utf8");
const schemaText = readFileSync(schemaFile, "utf8");
const apiRouteText = readFileSync(apiRouteFile, "utf8");
const apiRecordRouteText = readFileSync(apiRecordRouteFile, "utf8");
const queueSurfaceText = readFileSync(queueSurfaceFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const checklistDocText = readFileSync(checklistDocFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const browserReportText = readFileSync(browserReportFile, "utf8");

const {
  PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ITEM_VERSION,
  PERSPECTIVE_MEMORY_CANDIDATE_PREVIEW_VERSION,
} = localReviewQueue;
const {
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_LIST_VERSION,
  buildPerspectiveMemoryLocalWriteProposalFromQueueItem,
} = writeProposal;
const {
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_LIST_VERSION,
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_VERSION,
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_READINESS_SUMMARY_VERSION,
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_GATE_IDS,
  buildPerspectiveMemoryLocalWriteProposalReviewChecklist,
  markPerspectiveMemoryLocalWriteProposalReviewChecklistInReview,
  updatePerspectiveMemoryLocalWriteProposalReviewChecklistGate,
} = checklistModel;
const {
  PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE,
  PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_LIST_VERSION,
  PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_VERSION,
  buildPerspectiveMemoryProductPersistenceBoundaryRecord,
  canBuildPerspectiveMemoryProductPersistenceBoundaryRecord,
  collectPerspectiveMemoryProductPersistenceBoundaryRecordUnsafeMarkers,
} = boundaryModel;
const {
  createPerspectiveMemoryProductPersistenceBoundaryRecord,
  listPerspectiveMemoryProductPersistenceBoundaryRecords,
  updatePerspectiveMemoryProductPersistenceBoundaryRecordStatusInStore,
} = boundaryStore;

assertStaticFiles();
assertBoundaryBehavior();
assertStoreBehavior();
assertDocsReportsAndBoundaries();

console.log("PASS smoke:perspective-memory-product-persistence-boundary");

function assertStaticFiles() {
  for (const file of [
    modelFile,
    storeFile,
    dbFile,
    schemaFile,
    apiRouteFile,
    apiRecordRouteFile,
    queueSurfaceFile,
    docFile,
    checklistDocFile,
    reportFile,
    browserReportFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
  assert.equal(
    packageJson.scripts["smoke:perspective-memory-product-persistence-boundary"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-memory-product-persistence-boundary.mjs",
  );
  assertIncludesAll(modelText, [
    PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_VERSION,
    PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_LIST_VERSION,
    PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_API_ROUTE,
    "collectPerspectiveMemoryProductPersistenceBoundaryBlockedReasons",
    "ready_for_memory_write_now",
    "can_create_accepted_memory: false",
    "can_create_core_decision: false",
    "can_auto_promote: false",
    "buildPerspectiveMemoryProductPersistenceBoundaryRecord",
  ]);
  assertIncludesAll(storeText, [
    "openDatabase",
    "perspective_memory_product_persistence_boundary_records",
    "sqlite:lib/db.ts",
    "record_json",
    "updatePerspectiveMemoryProductPersistenceBoundaryRecordStatusInStore",
  ]);
  assertIncludesAll(dbText, [
    "migratePerspectiveMemoryProductPersistenceBoundaryRecordsTable",
    "perspective_memory_product_persistence_boundary_records",
  ]);
  assertIncludesAll(schemaText, [
    "CREATE TABLE IF NOT EXISTS perspective_memory_product_persistence_boundary_records",
    "idx_perspective_memory_boundary_status_time",
  ]);
  assertIncludesAll(apiRouteText, [
    "runtime = \"nodejs\"",
    "safeParsePerspectiveMemoryLocalWriteProposalReviewChecklistList",
    "createPerspectiveMemoryProductPersistenceBoundaryRecord",
    "result_state: \"BLOCKED\"",
  ]);
  assertIncludesAll(apiRecordRouteText, [
    "PATCH",
    "boundary_status",
    "updatePerspectiveMemoryProductPersistenceBoundaryRecordStatusInStore",
  ]);
  assertIncludesAll(queueSurfaceText, [
    "Product Persistence Boundary",
    "Create product persistence boundary record",
    "data-augnes-product-persistence-boundary-panel",
    "data-augnes-confirm-not-accepted-memory",
    "data-augnes-confirm-not-core-decision",
    "data-augnes-confirm-no-automatic-promotion",
    "data-augnes-product-persistence-boundary-record-list",
    "can_create_accepted_memory",
    "can_create_core_decision",
    "can_auto_promote",
  ]);
}

function assertBoundaryBehavior() {
  const { queueItem, proposal, readyChecklist, proposalList, queue } =
    buildReadyFixture();
  const confirmed = {
    user_confirmed_not_accepted_memory: true,
    user_confirmed_not_core_decision: true,
    user_confirmed_no_automatic_promotion: true,
  };
  const built = buildPerspectiveMemoryProductPersistenceBoundaryRecord({
    nowIso: "2026-06-13T00:00:20.000Z",
    recordId: "perspective-memory-boundary:pass",
    checklist: readyChecklist,
    proposal,
    queueItem,
    userConfirmation: confirmed,
  });
  assert.equal(built.ok, true);
  assert.equal(built.record.record_version, PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_VERSION);
  assert.equal(built.record.checklist_ready_for_product_persistence_review, true);
  assert.equal(built.record.checklist_ready_for_memory_write_now, false);
  assert.equal(built.record.proposed_memory_payload.should_write_to_memory_now, false);
  assert.equal(built.record.next_allowed_actions.can_create_accepted_memory, false);
  assert.equal(built.record.next_allowed_actions.can_create_core_decision, false);
  assert.equal(built.record.next_allowed_actions.can_auto_promote, false);
  assert.equal(built.record.authority_boundary.product_persistence_boundary_record_created, true);
  assert.equal(built.record.authority_boundary.accepted_augnes_memory_created, false);
  assert.equal(collectPerspectiveMemoryProductPersistenceBoundaryRecordUnsafeMarkers(built.record).length, 0);

  const notStartedChecklist = buildChecklist({ proposal });
  assertBlocked("not_started checklist cannot create boundary record", {
    checklist: notStartedChecklist,
    proposal,
    queueItem,
    userConfirmation: confirmed,
  });
  const inReviewChecklist =
    markPerspectiveMemoryLocalWriteProposalReviewChecklistInReview({
      checklist: notStartedChecklist,
      proposalList,
      queue,
      nowIso: "2026-06-13T00:00:21.000Z",
    });
  assert.equal(inReviewChecklist.checklist_status, "in_review");
  assertBlocked("in_review checklist cannot create boundary record", {
    checklist: inReviewChecklist,
    proposal,
    queueItem,
    userConfirmation: confirmed,
  });
  assertBlocked("blocked checklist cannot create boundary record", {
    checklist: {
      ...readyChecklist,
      checklist_status: "blocked",
      readiness_summary: {
        ...readyChecklist.readiness_summary,
        ready_for_product_persistence_review: false,
        blocked_reasons: ["source queue item state blocks readiness: source_queue_item_removed"],
      },
    },
    proposal,
    queueItem,
    userConfirmation: confirmed,
  });
  assertBlocked("ready_for_memory_write_now true is rejected", {
    checklist: {
      ...readyChecklist,
      readiness_summary: {
        ...readyChecklist.readiness_summary,
        ready_for_memory_write_now: true,
      },
    },
    proposal,
    queueItem,
    userConfirmation: confirmed,
  });
  assertBlocked("missing confirmation flags reject", {
    checklist: readyChecklist,
    proposal,
    queueItem,
    userConfirmation: {
      user_confirmed_not_accepted_memory: true,
    },
  });
  assertBlocked("rejected proposal rejects", {
    checklist: readyChecklist,
    proposal: { ...proposal, proposal_status: "rejected_locally" },
    queueItem,
    userConfirmation: confirmed,
  });
  assertBlocked("superseded proposal rejects", {
    checklist: readyChecklist,
    proposal: { ...proposal, proposal_status: "superseded_locally" },
    queueItem,
    userConfirmation: confirmed,
  });
  assertBlocked("removed queue rejects", {
    checklist: readyChecklist,
    proposal,
    queueItem: { ...queueItem, queue_status: "removed_from_queue" },
    userConfirmation: confirmed,
  });
  assertBlocked("unsafe marker rejects", {
    checklist: { ...readyChecklist, local_review_notes: "TOKEN=unsafe" },
    proposal,
    queueItem,
    userConfirmation: confirmed,
  });
}

function assertStoreBehavior() {
  const tempDir = mkdtempSync(path.join(tmpdir(), "augnes-boundary-smoke-"));
  const previousDbPath = process.env.AUGNES_DB_PATH;
  process.env.AUGNES_DB_PATH = path.join(tempDir, "augnes.db");
  try {
    const { queueItem, proposal, readyChecklist } = buildReadyFixture();
    const result = createPerspectiveMemoryProductPersistenceBoundaryRecord({
      nowIso: "2026-06-13T00:01:00.000Z",
      recordId: "perspective-memory-boundary:store-pass",
      checklist: readyChecklist,
      proposal,
      queueItem,
      userConfirmation: {
        user_confirmed_not_accepted_memory: true,
        user_confirmed_not_core_decision: true,
        user_confirmed_no_automatic_promotion: true,
      },
    });
    assert.equal(result.ok, true);
    assert.equal(result.created, true);
    const replay = createPerspectiveMemoryProductPersistenceBoundaryRecord({
      nowIso: "2026-06-13T00:01:01.000Z",
      recordId: "perspective-memory-boundary:store-pass",
      checklist: readyChecklist,
      proposal,
      queueItem,
      userConfirmation: {
        user_confirmed_not_accepted_memory: true,
        user_confirmed_not_core_decision: true,
        user_confirmed_no_automatic_promotion: true,
      },
    });
    assert.equal(replay.ok, true);
    assert.equal(replay.created, false);
    assert.equal(replay.idempotent_replay, true);
    const list = listPerspectiveMemoryProductPersistenceBoundaryRecords();
    assert.equal(list.boundary_record_list_version, PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_LIST_VERSION);
    assert.equal(list.records.length, 1);
    const updated =
      updatePerspectiveMemoryProductPersistenceBoundaryRecordStatusInStore({
        recordId: result.record.record_id,
        boundaryStatus: "locally_reviewing_boundary_record",
      });
    assert.equal(updated.ok, true);
    assert.equal(updated.record.boundary_status, "locally_reviewing_boundary_record");
    const filtered = listPerspectiveMemoryProductPersistenceBoundaryRecords({
      boundaryStatus: "locally_reviewing_boundary_record",
    });
    assert.equal(filtered.records.length, 1);
  } finally {
    if (previousDbPath == null) {
      delete process.env.AUGNES_DB_PATH;
    } else {
      process.env.AUGNES_DB_PATH = previousDbPath;
    }
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function assertDocsReportsAndBoundaries() {
  assertIncludesAll(docText, [
    "# Perspective Memory Product Persistence Boundary v0.1",
    "sqlite:lib/db.ts",
    "product persistence boundary record",
    "not accepted Augnes memory",
    "not a Core decision",
    "server-side validation",
    PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_VERSION,
    PERSPECTIVE_MEMORY_PRODUCT_PERSISTENCE_BOUNDARY_RECORD_LIST_VERSION,
  ]);
  assertIncludesAll(checklistDocText, [
    "Product Persistence Boundary",
    "Create product persistence boundary record",
  ]);
  assertIncludesAll(reportText, [
    "# Perspective Memory Product Persistence Boundary Report",
    "why this follows PR #535",
    "persistence backend chosen",
    "server-side validation",
    "browser validation",
  ]);
  assertIncludesAll(browserReportText, [
    "product persistence boundary panel visible",
    "Create product persistence boundary record disabled until confirmations checked",
    "persisted record id visible",
    "refresh still shows boundary record",
    "can_create_accepted_memory false visible",
    "no provider/model/Codex SDK/GitHub/network behavior except same-origin app/API routes",
  ]);
  for (const [file, text] of Object.entries({
    [modelFile]: modelText,
    [storeFile]: storeText,
    [apiRouteFile]: apiRouteText,
    [apiRecordRouteFile]: apiRecordRouteText,
    [queueSurfaceFile]: queueSurfaceText,
  })) {
    for (const forbidden of [
      "OpenAI",
      "new Octokit",
      "github.rest",
      "Codex SDK",
      "create_accepted_memory: true",
      "can_create_accepted_memory: true",
      "can_create_core_decision: true",
      "can_auto_promote: true",
      "runtime_handoff_created: true",
      "\n    automatic_promotion: true",
      "navigator.clipboard",
      "document.execCommand",
    ]) {
      assert(!text.includes(forbidden), `${file} must not include ${forbidden}`);
    }
  }
  for (const marker of [
    "RETURNED_CODEX_RESPONSE",
    "raw_prompt",
    "raw_candidate_payload",
    "provider_log",
    "TOKEN=",
    "browser_dump",
  ]) {
    assert(!JSON.stringify(buildReadyFixture().readyChecklist).includes(marker));
  }
}

function assertBlocked(label, input) {
  const result = canBuildPerspectiveMemoryProductPersistenceBoundaryRecord(input);
  assert.equal(result.eligible, false, label);
  const built = buildPerspectiveMemoryProductPersistenceBoundaryRecord({
    nowIso: "2026-06-13T00:00:30.000Z",
    recordId: `perspective-memory-boundary:${label.replaceAll(" ", "-")}`,
    ...input,
  });
  assert.equal(built.ok, false, label);
  assert(built.blocked_reasons.length > 0, `${label} must include reasons`);
}

function buildReadyFixture() {
  const queueItem = buildQueueItem();
  const proposalResult = buildPerspectiveMemoryLocalWriteProposalFromQueueItem({
    nowIso: "2026-06-13T00:00:10.000Z",
    proposalId: "local-memory-write-proposal:pass",
    queueItem,
    queueSourceState: "current_with_source_candidate_draft",
  });
  assert.equal(proposalResult.ok, true);
  const proposal = proposalResult.proposal;
  const proposalList = {
    proposal_list_version: PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_LIST_VERSION,
    updated_at: proposal.updated_at,
    proposals: [proposal],
  };
  const queue = {
    queue_version: "perspective_memory_local_review_queue.v0.1",
    updated_at: queueItem.updated_at,
    items: [queueItem],
  };
  const checklist = buildChecklist({ proposal });
  const readyChecklist = checkRequiredGates({
    checklist,
    proposalList,
    queue,
  });
  assert.equal(
    readyChecklist.checklist_status,
    "locally_ready_for_product_persistence_review",
  );
  return { queueItem, proposal, readyChecklist, proposalList, queue };
}

function buildChecklist({ proposal }) {
  return buildPerspectiveMemoryLocalWriteProposalReviewChecklist({
    nowIso: "2026-06-13T00:00:11.000Z",
    checklistId: "local-write-proposal-checklist:pass",
    proposal,
    proposalSourceState: "source_queue_item_current",
  });
}

function checkRequiredGates({ checklist, proposalList, queue }) {
  let nextChecklist = checklist;
  for (const gateId of PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_GATE_IDS) {
    const gate = nextChecklist.gates[gateId];
    if (!gate.required) continue;
    nextChecklist = updatePerspectiveMemoryLocalWriteProposalReviewChecklistGate({
      checklist: nextChecklist,
      proposalList,
      queue,
      nowIso: `2026-06-13T00:00:12.${String(gateId.length).padStart(3, "0")}Z`,
      gateId,
      status: "checked",
    });
  }
  return nextChecklist;
}

function buildQueueItem() {
  return {
    item_version: PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ITEM_VERSION,
    queue_item_id: "local-memory-review-queue-item:pass",
    created_at: "2026-06-13T00:00:00.000Z",
    updated_at: "2026-06-13T00:00:00.000Z",
    source: "codex_former_local_adapter_operator_flow",
    source_candidate_draft_id: "local-candidate-draft:pass",
    source_candidate_local_status: "draft_candidate",
    source_candidate_action: "accept_as_perspective_candidate",
    source_validation_result_state: "PASS",
    source_validation_summary_hash: "hash:validation",
    source_input_ref: "reports/fixtures/source-input-pass.json",
    source_input_hash: "hash:source",
    prepare_summary_ref: "reports/fixtures/prepare-pass.json",
    prepare_execution_summary_hash: "hash:prepare",
    returned_envelope_hash: "hash:returned-envelope",
    warning_count: 0,
    pointer_warning_count: 0,
    source_pr_refs: ["pr:hynk-studio/augnes#535"],
    changed_files_count: 3,
    review_summary: "Bounded PASS review summary for product persistence boundary smoke.",
    memory_candidate_preview: {
      preview_version: PERSPECTIVE_MEMORY_CANDIDATE_PREVIEW_VERSION,
      title: "Bounded perspective candidate",
      summary: "Bounded perspective candidate summary.",
      supporting_refs: [
        "pr:hynk-studio/augnes#535",
        "reports/fixtures/source-input-pass.json",
        "reports/fixtures/prepare-pass.json",
      ],
      risk_notes: [],
      unresolved_tensions: ["not captured in local queue item"],
      next_review_action:
        "Review before any perspective-memory persistence decision",
    },
    queue_status: "queued_for_memory_review",
    review_only_actions: {
      can_mark_reviewing: true,
      can_keep_for_later: true,
      can_remove_from_queue: true,
      can_return_to_candidate_drafts: true,
      can_create_memory_write: false,
    },
    stale_state: "current_with_source_candidate_draft",
    authority_boundary: {
      local_queue_only: true,
      accepted_augnes_memory_created: false,
      review_decision_created: false,
      product_db_persistence: false,
      core_decision_created: false,
      runtime_handoff_created: false,
      automatic_promotion: false,
    },
  };
}

function assertIncludesAll(source, requiredPhrases) {
  for (const phrase of requiredPhrases) {
    assert(source.includes(phrase), `expected source to include: ${phrase}`);
  }
}
