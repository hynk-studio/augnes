import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import acceptedCandidateDraft from "../lib/perspective-ingest/codex-former-local-adapter-accepted-candidate-draft.ts";
import candidateDraftList from "../lib/perspective-ingest/codex-former-local-adapter-candidate-draft-list.ts";
import localValidateBridge from "../lib/perspective-ingest/codex-former-local-adapter-operator-flow-local-validate.ts";
import operatorFlow from "../lib/perspective-ingest/codex-former-local-adapter-operator-flow.ts";
import memoryReviewQueue from "../lib/perspective-ingest/perspective-memory-local-review-queue.ts";
import writeProposal from "../lib/perspective-ingest/perspective-memory-local-write-proposal.ts";

const {
  buildCodexFormerLocalAdapterAcceptedCandidateDraft,
} = acceptedCandidateDraft;
const {
  CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_STORAGE_NAMESPACE,
  appendCodexFormerLocalAdapterCandidateDraftToList,
  createEmptyCodexFormerLocalAdapterCandidateDraftList,
  replaceCodexFormerLocalAdapterCandidateDraftInList,
} = candidateDraftList;
const { runOperatorFlowLocalValidationBridge } = localValidateBridge;
const {
  buildCodexFormerLocalAdapterOperatorFlowViewModel,
} = operatorFlow;
const {
  PERSPECTIVE_MEMORY_CANDIDATE_PREVIEW_VERSION,
  PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ITEM_VERSION,
  PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_MAX_ITEMS,
  PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ROUTE,
  PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE,
  PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION,
  appendPerspectiveMemoryLocalReviewQueueItem,
  buildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft,
  canBuildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft,
  clearPerspectiveMemoryLocalReviewQueueFromStorage,
  collectPerspectiveMemoryLocalReviewQueueUnsafeMarkers,
  createEmptyPerspectiveMemoryLocalReviewQueue,
  findPerspectiveMemoryLocalReviewQueueItemBySourceDraft,
  getPerspectiveMemoryLocalReviewQueueItemSourceState,
  loadPerspectiveMemoryLocalReviewQueueFromStorage,
  removePerspectiveMemoryLocalReviewQueueItem,
  savePerspectiveMemoryLocalReviewQueueToStorage,
  safeParsePerspectiveMemoryLocalReviewQueue,
  updatePerspectiveMemoryLocalReviewQueueItemStatus,
} = memoryReviewQueue;
const {
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE,
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_VERSION,
  buildPerspectiveMemoryLocalWriteProposalFromQueueItem,
} = writeProposal;

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const packageFile = "package.json";
const helperFile =
  "lib/perspective-ingest/perspective-memory-local-review-queue.ts";
const writeProposalHelperFile =
  "lib/perspective-ingest/perspective-memory-local-write-proposal.ts";
const candidateDraftListFile =
  "lib/perspective-ingest/codex-former-local-adapter-candidate-draft-list.ts";
const routeFile =
  "app/cockpit/perspective/memory-review-queue/local/page.tsx";
const componentFile =
  "app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.tsx";
const cssFile =
  "app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.module.css";
const operatorComponentFile =
  "app/cockpit/perspective/codex-former/local-adapter-operator-flow/operator-flow-surface.tsx";
const docFile = "docs/PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_V0_1.md";
const reportFile = "reports/2026-06-13-perspective-memory-local-review-queue.md";
const browserSmokeFile =
  "scripts/browser-smoke-perspective-memory-local-review-queue.mjs";
const writeProposalSmokeFile =
  "scripts/smoke-perspective-memory-local-write-proposal.mjs";
const writeProposalDocFile =
  "docs/PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_V0_1.md";
const writeProposalReportFile =
  "reports/2026-06-13-perspective-memory-local-write-proposal.md";
const browserReportFile =
  "reports/browser/2026-06-13-perspective-memory-local-review-queue.md";

const sourcePassFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-source-input-pass.json";
const sourceFollowUpFile =
  "reports/fixtures/2026-06-11-codex-former-local-adapter-source-input.json";
const preparePassFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass.json";
const prepareFollowUpFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-prepare-execution-summary-pass-with-follow-up.json";
const validatePassFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass.json";
const validateFollowUpFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-pass-with-follow-up.json";
const validateBlockedFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-validate-execution-summary-blocked.json";
const returnedPassFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-pass.txt";
const returnedFollowUpFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-ready.txt";
const returnedBlockedFile =
  "reports/fixtures/2026-06-12-codex-former-local-adapter-returned-candidate-envelope-blocked.txt";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const helperText = readFileSync(helperFile, "utf8");
const writeProposalHelperText = readFileSync(writeProposalHelperFile, "utf8");
const candidateDraftListText = readFileSync(candidateDraftListFile, "utf8");
const routeText = readFileSync(routeFile, "utf8");
const componentText = readFileSync(componentFile, "utf8");
const cssText = readFileSync(cssFile, "utf8");
const operatorComponentText = readFileSync(operatorComponentFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const browserReportText = readFileSync(browserReportFile, "utf8");
const writeProposalDocText = readFileSync(writeProposalDocFile, "utf8");
const writeProposalReportText = readFileSync(writeProposalReportFile, "utf8");

const fixtureInput = {
  scenarios: {
    pass: {
      key: "pass",
      label: "PASS",
      sourceInput: JSON.parse(readFileSync(sourcePassFile, "utf8")),
      sourceInputPath: sourcePassFile,
      prepareSummary: JSON.parse(readFileSync(preparePassFile, "utf8")),
      prepareSummaryPath: preparePassFile,
      validateSummary: JSON.parse(readFileSync(validatePassFile, "utf8")),
      validateSummaryPath: validatePassFile,
      returnedEnvelopeText: readFileSync(returnedPassFile, "utf8"),
      returnedEnvelopePath: returnedPassFile,
    },
    pass_with_follow_up: {
      key: "pass_with_follow_up",
      label: "PASS with follow-up",
      sourceInput: JSON.parse(readFileSync(sourceFollowUpFile, "utf8")),
      sourceInputPath: sourceFollowUpFile,
      prepareSummary: JSON.parse(readFileSync(prepareFollowUpFile, "utf8")),
      prepareSummaryPath: prepareFollowUpFile,
      validateSummary: JSON.parse(readFileSync(validateFollowUpFile, "utf8")),
      validateSummaryPath: validateFollowUpFile,
      returnedEnvelopeText: readFileSync(returnedFollowUpFile, "utf8"),
      returnedEnvelopePath: returnedFollowUpFile,
    },
    blocked: {
      key: "blocked",
      label: "BLOCKED",
      sourceInput: JSON.parse(readFileSync(sourceFollowUpFile, "utf8")),
      sourceInputPath: sourceFollowUpFile,
      prepareSummary: JSON.parse(readFileSync(prepareFollowUpFile, "utf8")),
      prepareSummaryPath: prepareFollowUpFile,
      validateSummary: JSON.parse(readFileSync(validateBlockedFile, "utf8")),
      validateSummaryPath: validateBlockedFile,
      returnedEnvelopeText: readFileSync(returnedBlockedFile, "utf8"),
      returnedEnvelopePath: returnedBlockedFile,
    },
  },
};

assertPackageScripts();
assertFilesAndSource();
assertQueueModelBehavior();
assertDocsReportsAndBoundaries();

console.log("PASS smoke:perspective-memory-local-review-queue");

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts["smoke:perspective-memory-local-review-queue"],
    `${expectedTsxCommand} scripts/smoke-perspective-memory-local-review-queue.mjs`,
  );
  assert.equal(
    packageJson.scripts["browser:perspective-memory-local-review-queue"],
    "node scripts/browser-smoke-perspective-memory-local-review-queue.mjs",
  );
  assert.equal(
    packageJson.scripts["smoke:perspective-memory-local-write-proposal"],
    `${expectedTsxCommand} scripts/smoke-perspective-memory-local-write-proposal.mjs`,
  );
}

function assertFilesAndSource() {
  for (const file of [
    helperFile,
    writeProposalHelperFile,
    candidateDraftListFile,
    routeFile,
    componentFile,
    cssFile,
    operatorComponentFile,
    docFile,
    reportFile,
    browserSmokeFile,
    writeProposalSmokeFile,
    browserReportFile,
    writeProposalDocFile,
    writeProposalReportFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }

  assertIncludesAll(helperText, [
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE,
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION,
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ITEM_VERSION,
    PERSPECTIVE_MEMORY_CANDIDATE_PREVIEW_VERSION,
    "PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_MAX_ITEMS = 50",
    "buildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft",
    "appendPerspectiveMemoryLocalReviewQueueItem",
    "dedupedItems",
    "removePerspectiveMemoryLocalReviewQueueItem",
    "updatePerspectiveMemoryLocalReviewQueueItemStatus",
    "getPerspectiveMemoryLocalReviewQueueItemSourceState",
    "current_with_source_candidate_draft",
    "source_candidate_draft_stale",
    "source_candidate_draft_missing",
    "memory_candidate_preview",
    "can_create_memory_write: false",
    "raw_prompt",
    "raw_candidate",
    "browser_dump",
  ]);
  assertIncludesAll(candidateDraftListText, [
    CODEX_FORMER_LOCAL_ADAPTER_CANDIDATE_DRAFT_LIST_STORAGE_NAMESPACE,
    "appendCodexFormerLocalAdapterCandidateDraftToList",
  ]);
  assertIncludesAll(operatorComponentText, [
    "Queue for perspective-memory review",
    "Open local memory review queue",
    "Remove queue item for selected draft",
    "data-augnes-queue-selected-candidate-draft",
    "data-augnes-open-local-memory-review-queue",
    "clearAllLocalCandidateDrafts",
  ]);
  assertIncludesAll(routeText, ["LocalMemoryReviewQueueSurface"]);
  assertIncludesAll(componentText, [
    "Local Memory Review Queue",
    "PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ROUTE",
    "PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE",
    "Queued Items",
    "Queue Item Detail",
    "Bounded Memory Candidate Preview",
    "queued_for_memory_review",
    "reviewing_locally",
    "kept_for_later",
    "removed_from_queue",
    "stale_or_missing_source",
    "Mark reviewing locally",
    "Keep for later",
    "Remove from queue",
    "Return to candidate drafts, local note only",
    "Clear queue",
    "can_create_memory_write",
    "not accepted Augnes memory",
    "not review decision",
    "not product DB persistence",
    "not Core decision",
    "data-augnes-memory-queue-filter",
    "data-augnes-memory-candidate-preview",
    "Local Memory Write Proposal",
    "Create local memory write proposal",
    "Proposed Memory Payload",
    "Proposal Diff Summary",
    "should_write_to_memory_now",
    "PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE",
    "data-augnes-local-write-proposal-panel",
    "data-augnes-create-local-memory-write-proposal",
    "data-augnes-local-write-proposal-list",
    "data-augnes-proposed-memory-payload",
    "data-augnes-proposal-diff-summary",
  ]);
  assertIncludesAll(writeProposalHelperText, [
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_VERSION,
    "perspective_memory_local_write_proposal_list.v0.1",
    "perspective_memory_candidate_write_payload.v0.1",
    "buildPerspectiveMemoryLocalWriteProposalFromQueueItem",
    "should_write_to_memory_now: false",
    "accepted_augnes_memory_created: false",
    "product_db_persistence: false",
    "review_decision_created: false",
    "core_decision_created: false",
    "raw_prompt",
    "raw_candidate",
    "browser_dump",
  ]);
  assertIncludesAll(cssText, [
    ".shell",
    ".grid",
    ".panel",
    ".itemList",
    ".selectedItem",
    ".preview",
    ".filterRow",
    ".linkButton",
    "@media (max-width: 520px)",
    "overflow-wrap: anywhere",
  ]);
}

function assertQueueModelBehavior() {
  buildCodexFormerLocalAdapterOperatorFlowViewModel(fixtureInput);
  const pass = runOperatorFlowLocalValidationBridge({
    selected_returned_envelope_fixture_key: "pass",
    source_input_ref: sourcePassFile,
    prepare_summary_ref: preparePassFile,
    returned_envelope_text: fixtureInput.scenarios.pass.returnedEnvelopeText,
  });
  const followUp = runOperatorFlowLocalValidationBridge({
    selected_returned_envelope_fixture_key: "pass_with_follow_up",
    source_input_ref: sourceFollowUpFile,
    prepare_summary_ref: prepareFollowUpFile,
    returned_envelope_text:
      fixtureInput.scenarios.pass_with_follow_up.returnedEnvelopeText,
  });
  const blocked = runOperatorFlowLocalValidationBridge({
    selected_returned_envelope_fixture_key: "blocked",
    source_input_ref: sourceFollowUpFile,
    prepare_summary_ref: prepareFollowUpFile,
    returned_envelope_text: fixtureInput.scenarios.blocked.returnedEnvelopeText,
  });

  const acceptedPass = buildCandidateDraft({
    action: "accept_as_perspective_candidate",
    validation: pass.validation_result,
    scenarioKey: "pass",
    draftId: "local-candidate-draft:pass",
  });
  const acceptedFollowUp = buildCandidateDraft({
    action: "accept_as_perspective_candidate",
    validation: followUp.validation_result,
    scenarioKey: "pass_with_follow_up",
    draftId: "local-candidate-draft:follow-up",
  });
  const rejectedBlocked = buildCandidateDraft({
    action: "reject_from_memory_candidate",
    validation: blocked.validation_result,
    scenarioKey: "blocked",
    draftId: "local-candidate-draft:blocked-rejection",
  });
  const supersedeDraft = buildCandidateDraft({
    action: "supersede_previous_candidate",
    validation: pass.validation_result,
    scenarioKey: "pass",
    draftId: "local-candidate-draft:supersede",
    supersedesDraftId: "local-candidate-draft:pass",
  });
  assert.equal(acceptedPass.ok, true);
  assert.equal(acceptedFollowUp.ok, true);
  assert.equal(rejectedBlocked.ok, true);
  assert.equal(supersedeDraft.ok, true);

  const passQueueItem = buildQueueItem({
    draft: acceptedPass.draft,
    queueItemId: "local-memory-review-queue-item:pass",
  });
  assert.equal(passQueueItem.ok, true);
  assert.equal(passQueueItem.item.source_validation_result_state, "PASS");
  assert.equal(
    passQueueItem.item.memory_candidate_preview.preview_version,
    PERSPECTIVE_MEMORY_CANDIDATE_PREVIEW_VERSION,
  );
  assert.equal(passQueueItem.item.review_only_actions.can_create_memory_write, false);
  assertNoRawQueueItemMarkers(passQueueItem.item);
  const passWriteProposal =
    buildPerspectiveMemoryLocalWriteProposalFromQueueItem({
      nowIso: "2026-06-13T00:00:01.000Z",
      proposalId: "local-memory-write-proposal:pass",
      queueItem: passQueueItem.item,
      queueSourceState: "current_with_source_candidate_draft",
    });
  assert.equal(passWriteProposal.ok, true);
  assert.equal(
    passWriteProposal.proposal.proposed_memory_payload
      .should_write_to_memory_now,
    false,
  );

  const followUpQueueItem = buildQueueItem({
    draft: acceptedFollowUp.draft,
    queueItemId: "local-memory-review-queue-item:follow-up",
  });
  assert.equal(followUpQueueItem.ok, true);
  assert(
    followUpQueueItem.item.memory_candidate_preview.risk_notes.some((note) =>
      note.includes("PASS with follow-up"),
    ),
  );
  const followUpWriteProposal =
    buildPerspectiveMemoryLocalWriteProposalFromQueueItem({
      nowIso: "2026-06-13T00:00:02.000Z",
      proposalId: "local-memory-write-proposal:follow-up",
      queueItem: followUpQueueItem.item,
      queueSourceState: "current_with_source_candidate_draft",
    });
  assert.equal(followUpWriteProposal.ok, true);
  assert(
    followUpWriteProposal.proposal.proposed_memory_payload.risk_notes.some(
      (note) => note.includes("PASS with follow-up"),
    ),
  );

  const supersedeQueueItem = buildQueueItem({
    draft: supersedeDraft.draft,
    queueItemId: "local-memory-review-queue-item:supersede",
  });
  assert.equal(supersedeQueueItem.ok, true);
  assert.equal(
    supersedeQueueItem.item.source_candidate_local_status,
    "supersedes_previous_candidate",
  );

  const blockedAccepted = buildQueueItem({
    draft: { ...acceptedPass.draft, validation_result_state: "BLOCKED" },
    queueItemId: "local-memory-review-queue-item:blocked",
  });
  assert.equal(blockedAccepted.ok, false);

  const rejectedQueueItem = buildQueueItem({
    draft: rejectedBlocked.draft,
    queueItemId: "local-memory-review-queue-item:rejected",
  });
  assert.equal(rejectedQueueItem.ok, false);

  const fixturePreviewQueueItem = buildQueueItem({
    draft: { ...acceptedPass.draft, validation_source: "fixture_preview" },
    queueItemId: "local-memory-review-queue-item:fixture-preview",
  });
  assert.equal(fixturePreviewQueueItem.ok, false);

  assert.equal(
    canBuildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft({
      draft: acceptedPass.draft,
      sourceDraftCurrentStatus: "current_local_candidate_draft",
    }).eligible,
    true,
  );
  assert.equal(
    canBuildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft({
      draft: acceptedPass.draft,
      sourceDraftCurrentStatus: "stale_local_candidate_draft",
    }).eligible,
    false,
  );

  let queue = createEmptyPerspectiveMemoryLocalReviewQueue(
    "2026-06-13T00:00:00.000Z",
  );
  for (const item of [
    passQueueItem.item,
    followUpQueueItem.item,
    supersedeQueueItem.item,
  ]) {
    queue = appendPerspectiveMemoryLocalReviewQueueItem(
      queue,
      item,
      item.updated_at,
    );
  }
  assert.equal(queue.items.length, 3);
  assert.equal(
    appendPerspectiveMemoryLocalReviewQueueItem(
      queue,
      passQueueItem.item,
      "2026-06-13T00:00:04.000Z",
    ).items.length,
    3,
  );

  let bounded = createEmptyPerspectiveMemoryLocalReviewQueue(
    "2026-06-13T00:00:00.000Z",
  );
  for (let index = 0; index < PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_MAX_ITEMS + 2; index += 1) {
    bounded = appendPerspectiveMemoryLocalReviewQueueItem(
      bounded,
      {
        ...passQueueItem.item,
        queue_item_id: `local-memory-review-queue-item:${index}`,
        updated_at: `2026-06-13T00:${String(index).padStart(2, "0")}:00.000Z`,
      },
      `2026-06-13T01:${String(index).padStart(2, "0")}:00.000Z`,
    );
  }
  assert.equal(bounded.items.length, PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_MAX_ITEMS);

  const reviewing = updatePerspectiveMemoryLocalReviewQueueItemStatus(
    queue,
    passQueueItem.item.queue_item_id,
    "reviewing_locally",
    "2026-06-13T00:00:05.000Z",
  );
  assert.equal(
    reviewing.items.find(
      (item) => item.queue_item_id === passQueueItem.item.queue_item_id,
    )?.queue_status,
    "reviewing_locally",
  );
  const removed = removePerspectiveMemoryLocalReviewQueueItem(
    queue,
    passQueueItem.item.queue_item_id,
    "2026-06-13T00:00:06.000Z",
  );
  assert.equal(removed.items.length, 2);

  const removedStatus = updatePerspectiveMemoryLocalReviewQueueItemStatus(
    queue,
    passQueueItem.item.queue_item_id,
    "removed_from_queue",
    "2026-06-13T00:00:07.000Z",
  );
  assert.equal(
    findPerspectiveMemoryLocalReviewQueueItemBySourceDraft(
      removedStatus,
      acceptedPass.draft.draft_id,
    ),
    null,
  );

  let draftList = createEmptyCodexFormerLocalAdapterCandidateDraftList(
    "2026-06-13T00:00:00.000Z",
  );
  draftList = appendCodexFormerLocalAdapterCandidateDraftToList(
    draftList,
    acceptedPass.draft,
    "2026-06-13T00:00:01.000Z",
  );
  assert.equal(
    getPerspectiveMemoryLocalReviewQueueItemSourceState(
      passQueueItem.item,
      draftList,
    ),
    "current_with_source_candidate_draft",
  );
  assert.equal(
    getPerspectiveMemoryLocalReviewQueueItemSourceState(
      passQueueItem.item,
      replaceCodexFormerLocalAdapterCandidateDraftInList(
        draftList,
        { ...acceptedPass.draft, source_input_hash: "changed-source-hash" },
        "2026-06-13T00:00:02.000Z",
      ),
    ),
    "source_candidate_draft_stale",
  );
  assert.equal(
    getPerspectiveMemoryLocalReviewQueueItemSourceState(
      passQueueItem.item,
      createEmptyCodexFormerLocalAdapterCandidateDraftList(
        "2026-06-13T00:00:03.000Z",
      ),
    ),
    "source_candidate_draft_missing",
  );

  const storage = createMockStorage();
  savePerspectiveMemoryLocalReviewQueueToStorage(storage, queue);
  assert.equal(
    storage.values.has(PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE),
    true,
  );
  assert.equal(
    loadPerspectiveMemoryLocalReviewQueueFromStorage(
      storage,
      "2026-06-13T00:00:08.000Z",
    ).items.length,
    3,
  );
  clearPerspectiveMemoryLocalReviewQueueFromStorage(storage);
  assert.equal(
    storage.values.has(PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE),
    false,
  );

  const unsafeParsed = safeParsePerspectiveMemoryLocalReviewQueue(
    JSON.stringify({
      queue_version: PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION,
      updated_at: "2026-06-13T00:00:09.000Z",
      items: [
        passQueueItem.item,
        { ...passQueueItem.item, queue_item_id: "unsafe", review_summary: "TOKEN=unsafe" },
      ],
    }),
    "2026-06-13T00:00:09.000Z",
  );
  assert.equal(unsafeParsed.items.length, 1);
  assert.deepEqual(collectPerspectiveMemoryLocalReviewQueueUnsafeMarkers(queue), []);
}

function assertDocsReportsAndBoundaries() {
  assertIncludesAll(docText, [
    "# Perspective Memory Local Review Queue v0.1",
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ROUTE,
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_STORAGE_NAMESPACE,
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_VERSION,
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ITEM_VERSION,
    "selected local candidate draft",
    "Queue for perspective-memory review",
    "memory_candidate_preview",
    "current_with_source_candidate_draft",
    "source_candidate_draft_stale",
    "source_candidate_draft_missing",
    "can_create_memory_write: false",
    "not accepted Augnes memory",
    "Local Memory Write Proposal",
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE,
    "Create local memory write proposal",
  ]);
  assertIncludesAll(reportText, [
    "# Perspective Memory Local Review Queue Report",
    helperFile,
    routeFile,
    componentFile,
    "selected local candidate draft",
    "visible local review queue",
    "bounded memory candidate preview",
    "stale/missing source",
    "no accepted Augnes memory",
    "local write proposal",
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE,
  ]);
  assertIncludesAll(writeProposalDocText, [
    "# Perspective Memory Local Write Proposal v0.1",
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_VERSION,
    "selected queue item",
    "Create local memory write proposal",
    "should_write_to_memory_now: false",
    "not accepted Augnes memory",
  ]);
  assertIncludesAll(writeProposalReportText, [
    "# Perspective Memory Local Write Proposal Report",
    writeProposalHelperFile,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE,
    "queue item to local write proposal flow",
    "deterministic payload builder",
    "no accepted Augnes memory",
  ]);
  assertIncludesAll(browserReportText, [
    "Perspective Memory Local Review Queue Browser Validation",
    PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_ROUTE,
    "queue item count visible",
    "memory candidate preview visible",
    "Mark reviewing locally works",
    "Keep for later works",
    "Remove from queue works",
    "Clear queue works",
  ]);

  for (const [file, source] of Object.entries({
    [helperFile]: helperText,
    [writeProposalHelperFile]: writeProposalHelperText,
    [routeFile]: routeText,
    [componentFile]: componentText,
    [operatorComponentFile]: operatorComponentText,
  })) {
    for (const forbidden of [
      "navigator.clipboard",
      "document.execCommand",
      "XMLHttpRequest",
      "new WebSocket",
      "OpenAI",
      "new Octokit",
      "PrismaClient",
      "better-sqlite3",
      "process.env.OPENAI",
      "github.rest",
      "createAcceptedState",
      "reviewDecision",
      "coreDecision",
    ]) {
      assert.equal(
        source.includes(forbidden),
        false,
        `${file} must not include ${forbidden}`,
      );
    }
    assert.equal(source.includes("https://"), false, `${file} must not call external URLs`);
  }
}

function buildCandidateDraft({
  action,
  validation,
  scenarioKey,
  draftId,
  supersedesDraftId,
}) {
  const viewModel =
    buildCodexFormerLocalAdapterOperatorFlowViewModel(fixtureInput);
  const scenario = viewModel.scenarios[scenarioKey];
  return buildCodexFormerLocalAdapterAcceptedCandidateDraft({
    nowIso: "2026-06-13T00:00:00.000Z",
    draftId,
    operatorFlowDraftId: "local-adapter-operator-flow-draft:v0.1",
    candidateAction: action,
    validation,
    sourceInputRef: scenario.source_input_ref.path,
    prepareSummaryRef: scenario.prepare_summary_ref.path,
    reviewSummary: scenario.candidate_review_material.review_summary,
    changedFilesCount: scenario.candidate_review_material.changed_files_count,
    sourcePrRefs: scenario.candidate_review_material.source_pr_refs,
    supersedesDraftId,
  });
}

function buildQueueItem({ draft, queueItemId }) {
  return buildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft({
    nowIso: "2026-06-13T00:00:00.000Z",
    queueItemId,
    draft,
    sourceDraftCurrentStatus: "current_local_candidate_draft",
  });
}

function assertNoRawQueueItemMarkers(item) {
  const serialized = JSON.stringify(item);
  for (const marker of [
    "REAL TRANSCRIPT CAPTURE AFTER MANUAL COPY PACKET",
    "RETURNED_CODEX_RESPONSE",
    "END RETURNED_CODEX_RESPONSE",
    "draft_kind: codex_perspective_candidate_draft",
    "raw_source_packet",
    "raw_prompt",
    "raw_candidate",
    "raw private",
    "PROVIDER_LOG",
    "PROVIDER_LOGS",
    "TOKEN=",
    "browser_dump",
    "raw_diff",
    "raw_review_payload",
  ]) {
    assert.equal(
      serialized.includes(marker),
      false,
      `queue item must not persist raw marker ${marker}`,
    );
  }
}

function assertIncludesAll(source, phrases) {
  for (const phrase of phrases) {
    assert(source.includes(phrase), `expected source to include: ${phrase}`);
  }
}

function createMockStorage() {
  const values = new Map();
  return {
    values,
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}
