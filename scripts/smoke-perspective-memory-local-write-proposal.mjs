import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import acceptedCandidateDraft from "../lib/perspective-ingest/codex-former-local-adapter-accepted-candidate-draft.ts";
import localValidateBridge from "../lib/perspective-ingest/codex-former-local-adapter-operator-flow-local-validate.ts";
import operatorFlow from "../lib/perspective-ingest/codex-former-local-adapter-operator-flow.ts";
import memoryReviewQueue from "../lib/perspective-ingest/perspective-memory-local-review-queue.ts";
import writeProposal from "../lib/perspective-ingest/perspective-memory-local-write-proposal.ts";
import checklistModel from "../lib/perspective-ingest/perspective-memory-local-write-proposal-review-checklist.ts";

const {
  buildCodexFormerLocalAdapterAcceptedCandidateDraft,
} = acceptedCandidateDraft;
const { runOperatorFlowLocalValidationBridge } = localValidateBridge;
const {
  buildCodexFormerLocalAdapterOperatorFlowViewModel,
} = operatorFlow;
const {
  appendPerspectiveMemoryLocalReviewQueueItem,
  buildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft,
  createEmptyPerspectiveMemoryLocalReviewQueue,
  updatePerspectiveMemoryLocalReviewQueueItemStatus,
} = memoryReviewQueue;
const {
  PERSPECTIVE_MEMORY_CANDIDATE_WRITE_PAYLOAD_VERSION,
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_LIST_VERSION,
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_MAX_ITEMS,
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE,
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_VERSION,
  appendPerspectiveMemoryLocalWriteProposalToList,
  buildPerspectiveMemoryLocalWriteProposalFromQueueItem,
  canBuildPerspectiveMemoryLocalWriteProposalFromQueueItem,
  clearPerspectiveMemoryLocalWriteProposalListFromStorage,
  collectPerspectiveMemoryLocalWriteProposalListUnsafeMarkers,
  createEmptyPerspectiveMemoryLocalWriteProposalList,
  findPerspectiveMemoryLocalWriteProposalByQueueItem,
  getPerspectiveMemoryLocalWriteProposalSourceState,
  loadPerspectiveMemoryLocalWriteProposalListFromStorage,
  removePerspectiveMemoryLocalWriteProposalFromList,
  safeParsePerspectiveMemoryLocalWriteProposalList,
  savePerspectiveMemoryLocalWriteProposalListToStorage,
  updatePerspectiveMemoryLocalWriteProposalStatus,
} = writeProposal;
const {
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE,
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_VERSION,
} = checklistModel;

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const packageFile = "package.json";
const helperFile =
  "lib/perspective-ingest/perspective-memory-local-write-proposal.ts";
const checklistHelperFile =
  "lib/perspective-ingest/perspective-memory-local-write-proposal-review-checklist.ts";
const queueHelperFile =
  "lib/perspective-ingest/perspective-memory-local-review-queue.ts";
const queueComponentFile =
  "app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.tsx";
const docFile = "docs/PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_V0_1.md";
const checklistDocFile =
  "docs/PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_V0_1.md";
const queueDocFile = "docs/PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_V0_1.md";
const reportFile =
  "reports/2026-06-13-perspective-memory-local-write-proposal.md";
const checklistReportFile =
  "reports/2026-06-13-perspective-memory-local-write-proposal-review-checklist.md";
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
const checklistHelperText = readFileSync(checklistHelperFile, "utf8");
const queueHelperText = readFileSync(queueHelperFile, "utf8");
const queueComponentText = readFileSync(queueComponentFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const checklistDocText = readFileSync(checklistDocFile, "utf8");
const queueDocText = readFileSync(queueDocFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const checklistReportText = readFileSync(checklistReportFile, "utf8");
const browserReportText = readFileSync(browserReportFile, "utf8");

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
assertWriteProposalBehavior();
assertDocsReportsAndBoundaries();

console.log("PASS smoke:perspective-memory-local-write-proposal");

function assertPackageScripts() {
  assert.equal(
    packageJson.scripts["smoke:perspective-memory-local-write-proposal"],
    `${expectedTsxCommand} scripts/smoke-perspective-memory-local-write-proposal.mjs`,
  );
  assert.equal(
    packageJson.scripts[
      "smoke:perspective-memory-local-write-proposal-review-checklist"
    ],
    `${expectedTsxCommand} scripts/smoke-perspective-memory-local-write-proposal-review-checklist.mjs`,
  );
}

function assertFilesAndSource() {
  for (const file of [
    helperFile,
    checklistHelperFile,
    queueHelperFile,
    queueComponentFile,
    docFile,
    checklistDocFile,
    queueDocFile,
    reportFile,
    checklistReportFile,
    browserReportFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
  assertIncludesAll(helperText, [
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_LIST_VERSION,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_VERSION,
    PERSPECTIVE_MEMORY_CANDIDATE_WRITE_PAYLOAD_VERSION,
    "PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_MAX_ITEMS = 50",
    "buildPerspectiveMemoryLocalWriteProposalFromQueueItem",
    "appendPerspectiveMemoryLocalWriteProposalToList",
    "updatePerspectiveMemoryLocalWriteProposalStatus",
    "removePerspectiveMemoryLocalWriteProposalFromList",
    "findPerspectiveMemoryLocalWriteProposalByQueueItem",
    "getPerspectiveMemoryLocalWriteProposalSourceState",
    "source_queue_item_current",
    "source_queue_item_status_changed",
    "source_queue_item_missing",
    "source_queue_item_removed",
    "source_candidate_local_status",
    "source_candidate_action",
    "should_write_to_memory_now: false",
    "local_write_proposal_only: true",
    "accepted_augnes_memory_created: false",
    "product_db_persistence: false",
    "review_decision_created: false",
    "core_decision_created: false",
    "raw_prompt",
    "raw_candidate",
    "browser_dump",
  ]);
  assertIncludesAll(queueHelperText, ["can_create_memory_write: false"]);
  assertIncludesAll(queueComponentText, [
    "Local Memory Write Proposal",
    "Create local memory write proposal",
    "Proposed Memory Payload",
    "Proposal Diff Summary",
    "Mark proposal reviewing locally",
    "Keep proposal for later",
    "Reject proposal locally",
    "Mark proposal superseded locally",
    "Clear selected proposal",
    "Clear all local write proposals",
    "should_write_to_memory_now",
    "data-augnes-create-local-memory-write-proposal",
    "data-augnes-proposed-memory-payload",
    "data-augnes-proposal-diff-summary",
    "Local Write Proposal Review Checklist",
    "Create local review checklist",
    "ready_for_product_persistence_review",
    "ready_for_memory_write_now",
    "PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE",
  ]);
  assertIncludesAll(checklistHelperText, [
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_VERSION,
    "locally_ready_for_product_persistence_review",
    "ready_for_memory_write_now: false",
  ]);
}

function assertWriteProposalBehavior() {
  buildCodexFormerLocalAdapterOperatorFlowViewModel(fixtureInput);
  const passQueueItem = buildQueueItem({
    scenarioKey: "pass",
    queueItemId: "local-memory-review-queue-item:pass",
    candidateAction: "accept_as_perspective_candidate",
  });
  const followUpQueueItem = buildQueueItem({
    scenarioKey: "pass_with_follow_up",
    queueItemId: "local-memory-review-queue-item:follow-up",
    candidateAction: "accept_as_perspective_candidate",
  });
  const supersedeQueueItem = buildQueueItem({
    scenarioKey: "pass",
    queueItemId: "local-memory-review-queue-item:supersede",
    candidateAction: "supersede_previous_candidate",
    supersedesDraftId: "local-candidate-draft:pass",
  });
  const rejectedQueueItem = {
    ...passQueueItem,
    source_candidate_local_status: "rejected_memory_candidate",
    source_candidate_action: "reject_from_memory_candidate",
  };

  const passProposal = buildWriteProposal({
    queueItem: passQueueItem,
    proposalId: "local-memory-write-proposal:pass",
  });
  assert.equal(passProposal.ok, true);
  assert.equal(
    passProposal.proposal.proposal_version,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_VERSION,
  );
  assert.equal(
    passProposal.proposal.proposed_memory_payload.payload_version,
    PERSPECTIVE_MEMORY_CANDIDATE_WRITE_PAYLOAD_VERSION,
  );
  assert.equal(
    passProposal.proposal.proposed_memory_payload.should_write_to_memory_now,
    false,
  );
  assert.equal(
    passProposal.proposal.authority_boundary.accepted_augnes_memory_created,
    false,
  );
  assertNoRawProposalMarkers(passProposal.proposal);

  const followUpProposal = buildWriteProposal({
    queueItem: followUpQueueItem,
    proposalId: "local-memory-write-proposal:follow-up",
  });
  assert.equal(followUpProposal.ok, true);
  assert.equal(
    followUpProposal.proposal.source_validation_result_state,
    "PASS with follow-up",
  );
  assert(
    followUpProposal.proposal.proposed_memory_payload.risk_notes.some((note) =>
      note.includes("PASS with follow-up"),
    ),
  );
  assert(
    followUpProposal.proposal.proposed_memory_payload
      .carry_forward_questions.length >= 3,
  );

  const supersedeProposal = buildWriteProposal({
    queueItem: supersedeQueueItem,
    proposalId: "local-memory-write-proposal:supersede",
  });
  assert.equal(supersedeProposal.ok, true);

  assert.equal(
    buildWriteProposal({
      queueItem: { ...passQueueItem, queue_status: "removed_from_queue" },
      proposalId: "local-memory-write-proposal:removed",
    }).ok,
    false,
  );
  assert.equal(
    buildWriteProposal({
      queueItem: { ...passQueueItem, source_validation_result_state: "BLOCKED" },
      proposalId: "local-memory-write-proposal:blocked",
    }).ok,
    false,
  );
  assert.equal(
    buildWriteProposal({
      queueItem: rejectedQueueItem,
      proposalId: "local-memory-write-proposal:rejected",
    }).ok,
    false,
  );
  assert.equal(
    buildPerspectiveMemoryLocalWriteProposalFromQueueItem({
      nowIso: "2026-06-13T00:00:00.000Z",
      proposalId: "local-memory-write-proposal:stale",
      queueItem: passQueueItem,
      queueSourceState: "source_candidate_draft_stale",
    }).ok,
    false,
  );
  assert.equal(
    canBuildPerspectiveMemoryLocalWriteProposalFromQueueItem({
      queueItem: passQueueItem,
      queueSourceState: "current_with_source_candidate_draft",
    }).eligible,
    true,
  );
  assert.equal(
    canBuildPerspectiveMemoryLocalWriteProposalFromQueueItem({
      queueItem: passQueueItem,
      queueSourceState: "source_candidate_draft_missing",
    }).eligible,
    false,
  );

  let list = createEmptyPerspectiveMemoryLocalWriteProposalList(
    "2026-06-13T00:00:00.000Z",
  );
  for (const proposal of [
    passProposal.proposal,
    followUpProposal.proposal,
    supersedeProposal.proposal,
  ]) {
    list = appendPerspectiveMemoryLocalWriteProposalToList(
      list,
      proposal,
      proposal.updated_at,
    );
  }
  assert.equal(list.proposal_list_version, PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_LIST_VERSION);
  assert.equal(list.proposals.length, 3);
  assert.equal(
    appendPerspectiveMemoryLocalWriteProposalToList(
      list,
      passProposal.proposal,
      "2026-06-13T00:00:04.000Z",
    ).proposals.length,
    3,
  );

  let bounded = createEmptyPerspectiveMemoryLocalWriteProposalList(
    "2026-06-13T00:00:00.000Z",
  );
  for (let index = 0; index < PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_MAX_ITEMS + 2; index += 1) {
    bounded = appendPerspectiveMemoryLocalWriteProposalToList(
      bounded,
      {
        ...passProposal.proposal,
        proposal_id: `local-memory-write-proposal:${index}`,
        updated_at: `2026-06-13T00:${String(index).padStart(2, "0")}:00.000Z`,
      },
      `2026-06-13T01:${String(index).padStart(2, "0")}:00.000Z`,
    );
  }
  assert.equal(
    bounded.proposals.length,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_MAX_ITEMS,
  );

  const reviewing = updatePerspectiveMemoryLocalWriteProposalStatus(
    list,
    passProposal.proposal.proposal_id,
    "reviewing_write_proposal",
    "2026-06-13T00:00:05.000Z",
  );
  assert.equal(
    reviewing.proposals.find(
      (proposal) => proposal.proposal_id === passProposal.proposal.proposal_id,
    )?.proposal_status,
    "reviewing_write_proposal",
  );
  const removed = removePerspectiveMemoryLocalWriteProposalFromList(
    list,
    passProposal.proposal.proposal_id,
    "2026-06-13T00:00:06.000Z",
  );
  assert.equal(removed.proposals.length, 2);

  let queue = createEmptyPerspectiveMemoryLocalReviewQueue(
    "2026-06-13T00:00:00.000Z",
  );
  queue = appendPerspectiveMemoryLocalReviewQueueItem(
    queue,
    passQueueItem,
    "2026-06-13T00:00:01.000Z",
  );
  assert.equal(
    getPerspectiveMemoryLocalWriteProposalSourceState(
      passProposal.proposal,
      queue,
    ),
    "source_queue_item_current",
  );
  const changedStatusQueue = updatePerspectiveMemoryLocalReviewQueueItemStatus(
    queue,
    passQueueItem.queue_item_id,
    "reviewing_locally",
    "2026-06-13T00:00:02.000Z",
  );
  assert.equal(
    getPerspectiveMemoryLocalWriteProposalSourceState(
      passProposal.proposal,
      changedStatusQueue,
    ),
    "source_queue_item_status_changed",
  );
  const removedQueue = updatePerspectiveMemoryLocalReviewQueueItemStatus(
    queue,
    passQueueItem.queue_item_id,
    "removed_from_queue",
    "2026-06-13T00:00:03.000Z",
  );
  assert.equal(
    getPerspectiveMemoryLocalWriteProposalSourceState(
      passProposal.proposal,
      removedQueue,
    ),
    "source_queue_item_removed",
  );
  assert.equal(
    getPerspectiveMemoryLocalWriteProposalSourceState(
      passProposal.proposal,
      createEmptyPerspectiveMemoryLocalReviewQueue(
        "2026-06-13T00:00:04.000Z",
      ),
    ),
    "source_queue_item_missing",
  );
  assert.equal(
    findPerspectiveMemoryLocalWriteProposalByQueueItem(
      list,
      passQueueItem.queue_item_id,
    )?.proposal_id,
    passProposal.proposal.proposal_id,
  );

  const storage = createMockStorage();
  savePerspectiveMemoryLocalWriteProposalListToStorage(storage, list);
  assert.equal(
    storage.values.has(PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE),
    true,
  );
  assert.equal(
    loadPerspectiveMemoryLocalWriteProposalListFromStorage(
      storage,
      "2026-06-13T00:00:07.000Z",
    ).proposals.length,
    3,
  );
  clearPerspectiveMemoryLocalWriteProposalListFromStorage(storage);
  assert.equal(
    storage.values.has(PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE),
    false,
  );

  const unsafeParsed = safeParsePerspectiveMemoryLocalWriteProposalList(
    JSON.stringify({
      proposal_list_version: PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_LIST_VERSION,
      updated_at: "2026-06-13T00:00:08.000Z",
      proposals: [
        passProposal.proposal,
        { ...passProposal.proposal, proposal_id: "unsafe", review_notes: "TOKEN=unsafe" },
      ],
    }),
    "2026-06-13T00:00:08.000Z",
  );
  assert.equal(unsafeParsed.proposals.length, 1);
  assert.deepEqual(
    collectPerspectiveMemoryLocalWriteProposalListUnsafeMarkers(list),
    [],
  );
}

function assertDocsReportsAndBoundaries() {
  assertIncludesAll(docText, [
    "# Perspective Memory Local Write Proposal v0.1",
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_LIST_VERSION,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_VERSION,
    PERSPECTIVE_MEMORY_CANDIDATE_WRITE_PAYLOAD_VERSION,
    "Create local memory write proposal",
    "proposed_memory_payload",
    "proposal_diff_summary",
    "source_queue_item_status_changed",
    "should_write_to_memory_now: false",
    "not accepted Augnes memory",
    "Local Write Proposal Review Checklist",
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE,
  ]);
  assertIncludesAll(checklistDocText, [
    "# Perspective Memory Local Write Proposal Review Checklist v0.1",
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE,
    "Create local review checklist",
    "ready_for_memory_write_now: false",
  ]);
  assertIncludesAll(queueDocText, [
    "Local Memory Write Proposal",
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_STORAGE_NAMESPACE,
  ]);
  assertIncludesAll(reportText, [
    "# Perspective Memory Local Write Proposal Report",
    helperFile,
    queueComponentFile,
    "queue item to local write proposal flow",
    "deterministic payload builder",
    "proposal diff summary",
    "source queue item state tracking",
    "no accepted Augnes memory",
    "Local Write Proposal Review Checklist",
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE,
  ]);
  assertIncludesAll(checklistReportText, [
    "# Perspective Memory Local Write Proposal Review Checklist Report",
    checklistHelperFile,
    "write proposal to checklist flow",
    "readiness computation",
  ]);
  assertIncludesAll(browserReportText, [
    "Create local memory write proposal works",
    "proposal id visible",
    "proposal_status visible",
    "proposed memory payload visible",
    "should_write_to_memory_now false visible",
    "proposal diff summary visible",
  ]);

  for (const [file, source] of Object.entries({
    [helperFile]: helperText,
    [queueComponentFile]: queueComponentText,
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

function buildQueueItem({
  scenarioKey,
  queueItemId,
  candidateAction,
  supersedesDraftId,
}) {
  const viewModel =
    buildCodexFormerLocalAdapterOperatorFlowViewModel(fixtureInput);
  const scenario = viewModel.scenarios[scenarioKey];
  const validation = runOperatorFlowLocalValidationBridge({
    selected_returned_envelope_fixture_key: scenarioKey,
    source_input_ref: scenario.source_input_ref.path,
    prepare_summary_ref: scenario.prepare_summary_ref.path,
    returned_envelope_text: scenario.returned_envelope_fixture.text,
  });
  const candidateDraft = buildCodexFormerLocalAdapterAcceptedCandidateDraft({
    nowIso: "2026-06-13T00:00:00.000Z",
    draftId: `local-candidate-draft:${scenarioKey}:${candidateAction}`,
    operatorFlowDraftId: "local-adapter-operator-flow-draft:v0.1",
    candidateAction,
    validation: validation.validation_result,
    sourceInputRef: scenario.source_input_ref.path,
    prepareSummaryRef: scenario.prepare_summary_ref.path,
    reviewSummary: scenario.candidate_review_material.review_summary,
    changedFilesCount: scenario.candidate_review_material.changed_files_count,
    sourcePrRefs: scenario.candidate_review_material.source_pr_refs,
    supersedesDraftId,
  });
  assert.equal(candidateDraft.ok, true);
  const queueItem = buildPerspectiveMemoryLocalReviewQueueItemFromCandidateDraft({
    nowIso: "2026-06-13T00:00:00.000Z",
    queueItemId,
    draft: candidateDraft.draft,
    sourceDraftCurrentStatus: "current_local_candidate_draft",
  });
  assert.equal(queueItem.ok, true);
  return queueItem.item;
}

function buildWriteProposal({ queueItem, proposalId }) {
  return buildPerspectiveMemoryLocalWriteProposalFromQueueItem({
    nowIso: "2026-06-13T00:00:00.000Z",
    proposalId,
    queueItem,
    queueSourceState: "current_with_source_candidate_draft",
  });
}

function assertNoRawProposalMarkers(proposal) {
  const serialized = JSON.stringify(proposal);
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
      `write proposal must not persist raw marker ${marker}`,
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
