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
  appendPerspectiveMemoryLocalWriteProposalToList,
  buildPerspectiveMemoryLocalWriteProposalFromQueueItem,
  createEmptyPerspectiveMemoryLocalWriteProposalList,
  updatePerspectiveMemoryLocalWriteProposalStatus,
} = writeProposal;
const {
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_READINESS_SUMMARY_VERSION,
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_GATE_IDS,
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_LIST_VERSION,
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_MAX_ITEMS,
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE,
  PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_VERSION,
  appendPerspectiveMemoryLocalWriteProposalReviewChecklistToList,
  buildPerspectiveMemoryLocalWriteProposalReviewChecklist,
  clearPerspectiveMemoryLocalWriteProposalReviewChecklistListFromStorage,
  collectPerspectiveMemoryLocalWriteProposalReviewChecklistListUnsafeMarkers,
  createEmptyPerspectiveMemoryLocalWriteProposalReviewChecklistList,
  findPerspectiveMemoryLocalWriteProposalReviewChecklistByProposal,
  getPerspectiveMemoryLocalWriteProposalReviewChecklistSourceProposalState,
  loadPerspectiveMemoryLocalWriteProposalReviewChecklistListFromStorage,
  markPerspectiveMemoryLocalWriteProposalReviewChecklistInReview,
  recomputePerspectiveMemoryLocalWriteProposalReviewChecklist,
  removePerspectiveMemoryLocalWriteProposalReviewChecklistFromList,
  safeParsePerspectiveMemoryLocalWriteProposalReviewChecklistList,
  savePerspectiveMemoryLocalWriteProposalReviewChecklistListToStorage,
  updatePerspectiveMemoryLocalWriteProposalReviewChecklistGate,
} = checklistModel;

const expectedTsxCommand =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json";
const packageFile = "package.json";
const helperFile =
  "lib/perspective-ingest/perspective-memory-local-write-proposal-review-checklist.ts";
const writeProposalHelperFile =
  "lib/perspective-ingest/perspective-memory-local-write-proposal.ts";
const queueComponentFile =
  "app/cockpit/perspective/memory-review-queue/local/local-memory-review-queue-surface.tsx";
const docFile =
  "docs/PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_V0_1.md";
const writeProposalDocFile =
  "docs/PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_V0_1.md";
const queueDocFile = "docs/PERSPECTIVE_MEMORY_LOCAL_REVIEW_QUEUE_V0_1.md";
const reportFile =
  "reports/2026-06-13-perspective-memory-local-write-proposal-review-checklist.md";
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
const queueComponentText = readFileSync(queueComponentFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const writeProposalDocText = readFileSync(writeProposalDocFile, "utf8");
const queueDocText = readFileSync(queueDocFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const writeProposalReportText = readFileSync(writeProposalReportFile, "utf8");
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
assertChecklistBehavior();
assertDocsReportsAndBoundaries();

console.log("PASS smoke:perspective-memory-local-write-proposal-review-checklist");

function assertPackageScripts() {
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
    writeProposalHelperFile,
    queueComponentFile,
    docFile,
    writeProposalDocFile,
    queueDocFile,
    reportFile,
    writeProposalReportFile,
    browserReportFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }
  assertIncludesAll(helperText, [
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_LIST_VERSION,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_VERSION,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_READINESS_SUMMARY_VERSION,
    "PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_MAX_ITEMS =",
    "buildPerspectiveMemoryLocalWriteProposalReviewChecklist",
    "recomputePerspectiveMemoryLocalWriteProposalReviewChecklist",
    "updatePerspectiveMemoryLocalWriteProposalReviewChecklistGate",
    "source_proposal_current",
    "source_proposal_status_changed",
    "source_proposal_missing",
    "source_proposal_removed_or_rejected",
    "ready_for_memory_write_now: false",
    "local_checklist_only: true",
    "accepted_augnes_memory_created: false",
    "product_db_persistence: false",
    "review_decision_created: false",
    "core_decision_created: false",
    "raw_prompt",
    "raw_candidate",
    "browser_dump",
  ]);
  for (const gateId of PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_GATE_IDS) {
    assert(helperText.includes(gateId), `helper must include gate id ${gateId}`);
  }
  assertIncludesAll(writeProposalHelperText, [
    "source_candidate_local_status",
    "source_candidate_action",
  ]);
  assertIncludesAll(queueComponentText, [
    "Local Write Proposal Review Checklist",
    "Create local review checklist",
    "Mark checklist in review",
    "Recompute readiness",
    "Mark locally ready for product persistence review",
    "Clear selected checklist",
    "Clear all local checklists",
    "ready_for_product_persistence_review",
    "ready_for_memory_write_now",
    "data-augnes-local-write-proposal-review-checklist-panel",
    "data-augnes-create-local-review-checklist",
    "data-augnes-checklist-gate",
    "data-augnes-save-checklist-note",
  ]);
}

function assertChecklistBehavior() {
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
  const passProposal = buildWriteProposal({
    queueItem: passQueueItem,
    proposalId: "local-memory-write-proposal:pass",
  }).proposal;
  const followUpProposal = buildWriteProposal({
    queueItem: followUpQueueItem,
    proposalId: "local-memory-write-proposal:follow-up",
  }).proposal;
  const supersedeProposal = buildWriteProposal({
    queueItem: supersedeQueueItem,
    proposalId: "local-memory-write-proposal:supersede",
  }).proposal;

  let proposalList = createEmptyPerspectiveMemoryLocalWriteProposalList(
    "2026-06-13T00:00:00.000Z",
  );
  for (const proposal of [passProposal, followUpProposal, supersedeProposal]) {
    proposalList = appendPerspectiveMemoryLocalWriteProposalToList(
      proposalList,
      proposal,
      proposal.updated_at,
    );
  }
  let queue = createEmptyPerspectiveMemoryLocalReviewQueue(
    "2026-06-13T00:00:00.000Z",
  );
  for (const item of [passQueueItem, followUpQueueItem, supersedeQueueItem]) {
    queue = appendPerspectiveMemoryLocalReviewQueueItem(
      queue,
      item,
      item.updated_at,
    );
  }

  const passChecklist = buildChecklist({
    proposal: passProposal,
    checklistId: "local-write-proposal-checklist:pass",
  });
  assert.equal(
    passChecklist.checklist_version,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_VERSION,
  );
  assert.equal(
    passChecklist.readiness_summary.readiness_version,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_READINESS_SUMMARY_VERSION,
  );
  assert.equal(passChecklist.gates.pass_follow_up_caveat_reviewed.required, false);
  assert.equal(
    passChecklist.gates.pass_follow_up_caveat_reviewed.status,
    "not_applicable",
  );
  assert.equal(passChecklist.gates.supersede_impact_reviewed.required, false);
  assert.equal(
    passChecklist.gates.supersede_impact_reviewed.status,
    "not_applicable",
  );
  assert.equal(passChecklist.readiness_summary.ready_for_memory_write_now, false);
  const passInReview =
    markPerspectiveMemoryLocalWriteProposalReviewChecklistInReview({
      checklist: passChecklist,
      proposalList,
      queue,
      nowIso: "2026-06-13T00:00:02.500Z",
    });
  assert.equal(passInReview.checklist_status, "in_review");
  assert.equal(passInReview.readiness_summary.ready_for_memory_write_now, false);

  const passWithoutFinal = checkRequiredGates({
    checklist: passChecklist,
    proposalList,
    queue,
    except: ["final_user_intent_confirmed"],
  });
  assert.notEqual(
    passWithoutFinal.checklist_status,
    "locally_ready_for_product_persistence_review",
  );
  assert(
    passWithoutFinal.readiness_summary.blocked_reasons.includes(
      "required gate incomplete: final_user_intent_confirmed",
    ),
  );

  const passReady = checkRequiredGates({ checklist: passChecklist, proposalList, queue });
  assert.equal(
    passReady.checklist_status,
    "locally_ready_for_product_persistence_review",
  );
  assert.equal(
    passReady.readiness_summary.ready_for_product_persistence_review,
    true,
  );
  assert.equal(passReady.readiness_summary.ready_for_memory_write_now, false);

  assert.notEqual(
    checkRequiredGates({
      checklist: passChecklist,
      proposalList,
      queue,
      except: ["raw_material_exclusion_reviewed"],
    }).checklist_status,
    "locally_ready_for_product_persistence_review",
  );
  assert.notEqual(
    checkRequiredGates({
      checklist: passChecklist,
      proposalList,
      queue,
      except: ["authority_boundary_reviewed"],
    }).checklist_status,
    "locally_ready_for_product_persistence_review",
  );

  const followUpChecklist = buildChecklist({
    proposal: followUpProposal,
    checklistId: "local-write-proposal-checklist:follow-up",
  });
  assert.equal(followUpChecklist.gates.pass_follow_up_caveat_reviewed.required, true);
  assert.notEqual(
    checkRequiredGates({
      checklist: followUpChecklist,
      proposalList,
      queue,
      except: ["pass_follow_up_caveat_reviewed"],
    }).checklist_status,
    "locally_ready_for_product_persistence_review",
  );
  assert.equal(
    checkRequiredGates({ checklist: followUpChecklist, proposalList, queue })
      .checklist_status,
    "locally_ready_for_product_persistence_review",
  );

  const supersedeChecklist = buildChecklist({
    proposal: supersedeProposal,
    checklistId: "local-write-proposal-checklist:supersede",
  });
  assert.equal(supersedeChecklist.gates.supersede_impact_reviewed.required, true);
  assert.notEqual(
    checkRequiredGates({
      checklist: supersedeChecklist,
      proposalList,
      queue,
      except: ["supersede_impact_reviewed"],
    }).checklist_status,
    "locally_ready_for_product_persistence_review",
  );

  assert.equal(
    recomputePerspectiveMemoryLocalWriteProposalReviewChecklist({
      checklist: passReady,
      proposalList: createEmptyPerspectiveMemoryLocalWriteProposalList(
        "2026-06-13T00:00:01.000Z",
      ),
      queue,
      nowIso: "2026-06-13T00:00:01.000Z",
    }).checklist_status,
    "blocked",
  );

  const rejectedProposalList = updatePerspectiveMemoryLocalWriteProposalStatus(
    proposalList,
    passProposal.proposal_id,
    "rejected_locally",
    "2026-06-13T00:00:02.000Z",
  );
  assert.equal(
    getPerspectiveMemoryLocalWriteProposalReviewChecklistSourceProposalState(
      passReady,
      rejectedProposalList,
    ),
    "source_proposal_removed_or_rejected",
  );
  assert.equal(
    recomputePerspectiveMemoryLocalWriteProposalReviewChecklist({
      checklist: passReady,
      proposalList: rejectedProposalList,
      queue,
      nowIso: "2026-06-13T00:00:02.000Z",
    }).checklist_status,
    "blocked",
  );

  const statusChangedProposalList = updatePerspectiveMemoryLocalWriteProposalStatus(
    proposalList,
    passProposal.proposal_id,
    "reviewing_write_proposal",
    "2026-06-13T00:00:03.000Z",
  );
  assert.equal(
    getPerspectiveMemoryLocalWriteProposalReviewChecklistSourceProposalState(
      passReady,
      statusChangedProposalList,
    ),
    "source_proposal_status_changed",
  );

  const removedQueue = updatePerspectiveMemoryLocalReviewQueueItemStatus(
    queue,
    passQueueItem.queue_item_id,
    "removed_from_queue",
    "2026-06-13T00:00:04.000Z",
  );
  assert.equal(
    recomputePerspectiveMemoryLocalWriteProposalReviewChecklist({
      checklist: passReady,
      proposalList,
      queue: removedQueue,
      nowIso: "2026-06-13T00:00:04.000Z",
    }).checklist_status,
    "blocked",
  );

  let list = createEmptyPerspectiveMemoryLocalWriteProposalReviewChecklistList(
    "2026-06-13T00:00:00.000Z",
  );
  for (const checklist of [passReady, followUpChecklist, supersedeChecklist]) {
    list = appendPerspectiveMemoryLocalWriteProposalReviewChecklistToList(
      list,
      checklist,
      checklist.updated_at,
    );
  }
  assert.equal(
    list.checklist_list_version,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_LIST_VERSION,
  );
  assert.equal(list.checklists.length, 3);
  assert.equal(
    appendPerspectiveMemoryLocalWriteProposalReviewChecklistToList(
      list,
      passReady,
      "2026-06-13T00:00:05.000Z",
    ).checklists.length,
    3,
  );
  assert.equal(
    findPerspectiveMemoryLocalWriteProposalReviewChecklistByProposal(
      list,
      passProposal.proposal_id,
    )?.checklist_id,
    passReady.checklist_id,
  );
  assert.equal(
    removePerspectiveMemoryLocalWriteProposalReviewChecklistFromList(
      list,
      passReady.checklist_id,
      "2026-06-13T00:00:06.000Z",
    ).checklists.length,
    2,
  );

  let bounded = createEmptyPerspectiveMemoryLocalWriteProposalReviewChecklistList(
    "2026-06-13T00:00:00.000Z",
  );
  for (
    let index = 0;
    index < PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_MAX_ITEMS + 2;
    index += 1
  ) {
    bounded = appendPerspectiveMemoryLocalWriteProposalReviewChecklistToList(
      bounded,
      {
        ...passReady,
        checklist_id: `local-write-proposal-checklist:${index}`,
        updated_at: `2026-06-13T00:${String(index).padStart(2, "0")}:00.000Z`,
      },
      `2026-06-13T01:${String(index).padStart(2, "0")}:00.000Z`,
    );
  }
  assert.equal(
    bounded.checklists.length,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_MAX_ITEMS,
  );

  const storage = createMockStorage();
  savePerspectiveMemoryLocalWriteProposalReviewChecklistListToStorage(
    storage,
    list,
  );
  assert.equal(
    storage.values.has(
      PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE,
    ),
    true,
  );
  assert.equal(
    loadPerspectiveMemoryLocalWriteProposalReviewChecklistListFromStorage(
      storage,
      "2026-06-13T00:00:07.000Z",
    ).checklists.length,
    3,
  );
  clearPerspectiveMemoryLocalWriteProposalReviewChecklistListFromStorage(storage);
  assert.equal(
    storage.values.has(
      PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE,
    ),
    false,
  );

  const unsafeParsed =
    safeParsePerspectiveMemoryLocalWriteProposalReviewChecklistList(
      JSON.stringify({
        checklist_list_version:
          PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_LIST_VERSION,
        updated_at: "2026-06-13T00:00:08.000Z",
        checklists: [
          passReady,
          {
            ...passReady,
            checklist_id: "unsafe",
            local_review_notes: "TOKEN=unsafe",
          },
        ],
      }),
      "2026-06-13T00:00:08.000Z",
    );
  assert.equal(unsafeParsed.checklists.length, 1);
  assert.deepEqual(
    collectPerspectiveMemoryLocalWriteProposalReviewChecklistListUnsafeMarkers(
      list,
    ),
    [],
  );
}

function assertDocsReportsAndBoundaries() {
  assertIncludesAll(docText, [
    "# Perspective Memory Local Write Proposal Review Checklist v0.1",
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_LIST_VERSION,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_VERSION,
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_READINESS_SUMMARY_VERSION,
    "Create local review checklist",
    "pass_follow_up_caveat_reviewed",
    "supersede_impact_reviewed",
    "ready_for_memory_write_now: false",
    "locally_ready_for_product_persistence_review",
    "not accepted Augnes memory",
  ]);
  assertIncludesAll(writeProposalDocText, [
    "Local Write Proposal Review Checklist",
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE,
  ]);
  assertIncludesAll(queueDocText, [
    "Local Write Proposal Review Checklist",
    "ready_for_product_persistence_review",
  ]);
  assertIncludesAll(reportText, [
    "# Perspective Memory Local Write Proposal Review Checklist Report",
    helperFile,
    queueComponentFile,
    "write proposal to checklist flow",
    "conditional gates",
    "readiness computation",
    "source proposal state tracking",
    "no accepted Augnes memory",
  ]);
  assertIncludesAll(writeProposalReportText, [
    "Local Write Proposal Review Checklist",
    PERSPECTIVE_MEMORY_LOCAL_WRITE_PROPOSAL_REVIEW_CHECKLIST_STORAGE_NAMESPACE,
  ]);
  assertIncludesAll(browserReportText, [
    "checklist panel visible",
    "create local review checklist",
    "locally_ready_for_product_persistence_review",
    "ready_for_memory_write_now false visible",
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
  const result = buildPerspectiveMemoryLocalWriteProposalFromQueueItem({
    nowIso: "2026-06-13T00:00:00.000Z",
    proposalId,
    queueItem,
    queueSourceState: "current_with_source_candidate_draft",
  });
  assert.equal(result.ok, true);
  return result;
}

function buildChecklist({ proposal, checklistId }) {
  return buildPerspectiveMemoryLocalWriteProposalReviewChecklist({
    nowIso: "2026-06-13T00:00:00.000Z",
    checklistId,
    proposal,
    proposalSourceState: "source_queue_item_current",
  });
}

function checkRequiredGates({ checklist, proposalList, queue, except = [] }) {
  let nextChecklist = checklist;
  for (const gate of Object.values(nextChecklist.gates)) {
    if (!gate.required || except.includes(gate.gate_id)) continue;
    nextChecklist = updatePerspectiveMemoryLocalWriteProposalReviewChecklistGate({
      checklist: nextChecklist,
      proposalList,
      queue,
      nowIso: "2026-06-13T00:00:10.000Z",
      gateId: gate.gate_id,
      status: "checked",
    });
  }
  return recomputePerspectiveMemoryLocalWriteProposalReviewChecklist({
    checklist: nextChecklist,
    proposalList,
    queue,
    nowIso: "2026-06-13T00:00:11.000Z",
  });
}

function createMockStorage() {
  return {
    values: new Map(),
    getItem(key) {
      return this.values.get(key) ?? null;
    },
    setItem(key, value) {
      this.values.set(key, value);
    },
    removeItem(key) {
      this.values.delete(key);
    },
  };
}

function assertIncludesAll(source, phrases) {
  for (const phrase of phrases) {
    assert(source.includes(phrase), `expected source to include: ${phrase}`);
  }
}
