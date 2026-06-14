import path from "node:path";
import process from "node:process";

const DEFAULT_TEMP_DB_PATH =
  "/tmp/augnes-perspective-memory-reuse-live-data-dogfood/augnes.db";
const REUSE_ROUTE = "/cockpit/perspective/memory-items/reuse";
const SCRIPT_NAME = "perspective-memory-reuse-live-data-dogfood-seed";
const SEEDED_ITEM_IDS = [
  "perspective-memory-item:reuse-live-data-accepted",
  "perspective-memory-item:reuse-live-data-follow-up",
];

const options = parseArgs(process.argv.slice(2));
const dbPath = path.resolve(options.dbPath ?? DEFAULT_TEMP_DB_PATH);

if (options.help) {
  printUsage();
  process.exit(0);
}

if (!isTempDbPath(dbPath)) {
  console.error(
    `${SCRIPT_NAME}: refused DB path outside /tmp. Received: ${dbPath}`,
  );
  process.exit(1);
}

if (!options.yes) {
  console.error(`${SCRIPT_NAME}: refusing to reset or seed without --yes.`);
  console.error(`Explicit temp DB path: ${dbPath}`);
  console.error("Rerun with --yes to reset and seed this temp DB.");
  printNextSteps(dbPath, []);
  process.exit(1);
}

process.env.AUGNES_DB_PATH = dbPath;

const { resetDatabase } = await import("./db-common.mjs");
const boundaryStore = await import(
  "../lib/perspective-ingest/perspective-memory-product-persistence-boundary-store.ts"
);
const itemStore = await import(
  "../lib/perspective-ingest/perspective-memory-item-store.ts"
);
const checklistModel = await import(
  "../lib/perspective-ingest/perspective-memory-local-write-proposal-review-checklist.ts"
);

const db = resetDatabase();
db.close();

const seededItems = [];
for (const fixture of buildSeedFixtures({
  sourceProposalHashForChecklist:
    checklistModel.hashPerspectiveMemoryLocalWriteProposalForChecklist,
})) {
  const boundaryResult =
    boundaryStore.createPerspectiveMemoryProductPersistenceBoundaryRecord({
      recordId: fixture.recordId,
      nowIso: fixture.nowIso,
      checklist: fixture.checklist,
      proposal: fixture.proposal,
      queueItem: fixture.queueItem,
      userConfirmation: {
        user_confirmed_not_accepted_memory: true,
        user_confirmed_not_core_decision: true,
        user_confirmed_no_automatic_promotion: true,
      },
    });
  assertOk(boundaryResult, `create boundary record ${fixture.recordId}`);

  const itemResult = itemStore.createPerspectiveMemoryItemFromBoundaryRecord({
    sourceBoundaryRecordId: boundaryResult.record.record_id,
    itemId: fixture.itemId,
    nowIso: fixture.nowIso,
    userConfirmation: {
      user_confirmed_create_persisted_perspective_memory_item: true,
      user_confirmed_not_core_decision: true,
      user_confirmed_no_automatic_runtime_injection: true,
      user_confirmed_source_boundary_record_preserved: true,
    },
  });
  assertOk(itemResult, `create perspective-memory item ${fixture.itemId}`);
  seededItems.push(itemResult.item);
}

const seededItemIds = seededItems.map((item) => item.item_id);
console.log(`${SCRIPT_NAME}: seeded Perspective Memory Reuse live-data dogfood DB.`);
console.log(`Explicit temp DB path: ${dbPath}`);
console.log("Seeded item IDs:");
for (const itemId of seededItemIds) {
  console.log(`- ${itemId}`);
}
printNextSteps(dbPath, seededItemIds);

function printUsage() {
  console.log(`${SCRIPT_NAME}`);
  console.log("");
  console.log("Usage:");
  console.log(
    "  npm run perspective:memory-reuse-live-data-dogfood-seed -- --yes",
  );
  console.log(
    `  npm run perspective:memory-reuse-live-data-dogfood-seed -- --yes --db-path ${DEFAULT_TEMP_DB_PATH}`,
  );
  console.log("");
  console.log("Requires --yes before resetting and seeding the explicit temp DB.");
}

function printNextSteps(nextDbPath, seededItemIds) {
  console.log("Next runtime command:");
  console.log(
    `env -u OPENAI_API_KEY AUGNES_DB_PATH=${nextDbPath} npm run dev -- --port 3000`,
  );
  console.log(`Reuse route: ${REUSE_ROUTE}`);
  if (seededItemIds.length > 0) {
    console.log(
      `Preselected route: ${REUSE_ROUTE}?item_ids=${seededItemIds.join(",")}`,
    );
  }
  console.log("This harness does not start runtime, MCP bridge, MCP tools, provider/model calls, OpenAI API, Codex SDK, or GitHub mutation.");
}

function parseArgs(args) {
  const parsed = {
    yes: false,
    help: false,
    dbPath: null,
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--yes") {
      parsed.yes = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }
    if (arg === "--db-path") {
      parsed.dbPath = args[index + 1] ?? "";
      index += 1;
      continue;
    }
    if (arg.startsWith("--db-path=")) {
      parsed.dbPath = arg.slice("--db-path=".length);
      continue;
    }
    throw new Error(`Unsupported argument: ${arg}`);
  }
  return parsed;
}

function isTempDbPath(candidate) {
  return candidate === "/tmp/augnes.db" || candidate.startsWith("/tmp/");
}

function assertOk(result, label) {
  if (result.ok) return;
  throw new Error(`${label} blocked: ${result.blocked_reasons.join("; ")}`);
}

function buildSeedFixtures({ sourceProposalHashForChecklist }) {
  return [
    buildSeedFixture({
      sourceProposalHashForChecklist,
      kind: "accepted",
      nowIso: "2026-06-14T12:45:00.000Z",
      validationResult: "PASS",
      warningCount: 0,
      pointerWarningCount: 0,
      title: "Return Binding dogfood keeps next step bounded",
      summary:
        "PR #557 showed the reuse route is usable with persisted rows and does not justify return binding persistence yet.",
      sourceRefs: ["pr:557", "report:reuse-live-data-dogfood", "seed:accepted"],
      riskNotes: ["0 warnings", "do not skip live persisted-row validation"],
      carryForwardQuestions: [
        "Does the live reuse route produce a usable Codex Memory Brief?",
      ],
      nextReviewAction:
        "Use as the accepted seeded row for live-data reuse dogfood.",
    }),
    buildSeedFixture({
      sourceProposalHashForChecklist,
      kind: "follow-up",
      nowIso: "2026-06-14T12:46:00.000Z",
      validationResult: "PASS with follow-up",
      warningCount: 1,
      pointerWarningCount: 1,
      title: "Persisted rows are required for route-level reuse confidence",
      summary:
        "Manual seed setup is easy to omit, so future route validation needs this opt-in temp DB harness.",
      sourceRefs: ["pr:557", "report:reuse-live-data-dogfood", "seed:follow-up"],
      riskNotes: [
        "PASS with follow-up caveat: fixture-backed validation can over-claim route usability",
        "warning-ish item should remain visible in reuse packet",
      ],
      carryForwardQuestions: [
        "Should the next PR rerun live browser validation with this harness?",
      ],
      nextReviewAction:
        "Use as the warning-ish seeded row for live-data reuse dogfood.",
    }),
  ];
}

function buildSeedFixture({
  sourceProposalHashForChecklist,
  kind,
  nowIso,
  validationResult,
  warningCount,
  pointerWarningCount,
  title,
  summary,
  sourceRefs,
  riskNotes,
  carryForwardQuestions,
  nextReviewAction,
}) {
  const suffix = kind;
  const recordId = `perspective-memory-boundary:reuse-live-data-${suffix}`;
  const itemId = `perspective-memory-item:reuse-live-data-${suffix}`;
  const queueItemId = `local-memory-review-queue-item:reuse-live-data-${suffix}`;
  const proposalId = `local-memory-write-proposal:reuse-live-data-${suffix}`;
  const checklistId = `local-memory-write-checklist:reuse-live-data-${suffix}`;
  const candidateDraftId = `local-candidate-draft:reuse-live-data-${suffix}`;
  const sourceInputRef = `reports/browser/2026-06-14-perspective-memory-reuse-live-data-dogfood.md#${suffix}`;
  const sourceInputHash = `sha256:reuse-live-data-source-${suffix}`;
  const prepareSummaryRef = `reports/2026-06-14-perspective-memory-reuse-live-data-dogfood-harness.md#${suffix}`;
  const prepareExecutionSummaryHash = `sha256:reuse-live-data-prepare-${suffix}`;
  const returnedEnvelopeHash = `sha256:reuse-live-data-returned-envelope-${suffix}`;
  const validationSummaryHash = `sha256:reuse-live-data-validation-${suffix}`;

  const queueItem = {
    item_version: "perspective_memory_local_review_queue_item.v0.1",
    queue_item_id: queueItemId,
    created_at: nowIso,
    updated_at: nowIso,
    source: "codex_former_local_adapter_operator_flow",
    source_candidate_draft_id: candidateDraftId,
    source_candidate_local_status: "draft_candidate",
    source_candidate_action: "accept_as_perspective_candidate",
    source_validation_result_state: validationResult,
    source_validation_summary_hash: validationSummaryHash,
    source_input_ref: sourceInputRef,
    source_input_hash: sourceInputHash,
    prepare_summary_ref: prepareSummaryRef,
    prepare_execution_summary_hash: prepareExecutionSummaryHash,
    returned_envelope_hash: returnedEnvelopeHash,
    warning_count: warningCount,
    pointer_warning_count: pointerWarningCount,
    source_pr_refs: ["pr:hynk-studio/augnes#557"],
    changed_files_count: 4,
    review_summary: summary,
    memory_candidate_preview: {
      preview_version: "perspective_memory_candidate_preview.v0.1",
      title,
      summary,
      supporting_refs: sourceRefs,
      risk_notes: riskNotes,
      unresolved_tensions: ["manual seed setup was previously easy to omit"],
      next_review_action: nextReviewAction,
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

  const proposal = {
    proposal_version: "perspective_memory_local_write_proposal.v0.1",
    proposal_id: proposalId,
    created_at: nowIso,
    updated_at: nowIso,
    source: "perspective_memory_local_review_queue",
    source_queue_item_id: queueItemId,
    source_candidate_draft_id: candidateDraftId,
    source_candidate_local_status: "draft_candidate",
    source_candidate_action: "accept_as_perspective_candidate",
    source_validation_result_state: validationResult,
    source_validation_summary_hash: validationSummaryHash,
    source_input_ref: sourceInputRef,
    source_input_hash: sourceInputHash,
    prepare_summary_ref: prepareSummaryRef,
    prepare_execution_summary_hash: prepareExecutionSummaryHash,
    returned_envelope_hash: returnedEnvelopeHash,
    queue_item_status_at_creation: "queued_for_memory_review",
    queue_source_state_at_creation: "source_queue_item_current",
    proposal_status: "draft_write_proposal",
    proposed_memory_payload: {
      payload_version: "perspective_memory_candidate_write_payload.v0.1",
      title,
      summary,
      memory_kind: "perspective_candidate",
      source_refs: sourceRefs,
      evidence_refs: [
        `source_input_hash:${sourceInputHash}`,
        `returned_envelope_hash:${returnedEnvelopeHash}`,
      ],
      risk_notes: riskNotes,
      unresolved_tensions: ["manual seed setup was previously easy to omit"],
      carry_forward_questions: carryForwardQuestions,
      suggested_next_review_action: nextReviewAction,
      should_write_to_memory_now: false,
    },
    proposal_diff_summary: {
      included_from_queue_item: [
        "memory candidate preview",
        "source refs",
        "risk notes",
        "carry-forward questions",
      ],
      excluded_from_queue_item: ["queue-only local status"],
      excluded_raw_material: [
        "returned envelope text excluded",
        "prompt text excluded",
        "candidate payload excluded",
        "provider logs excluded",
      ],
      authority_boundary_notes: [
        "seed harness creates temp DB dogfood rows only",
        "not Core memory and not runtime injection",
      ],
    },
    warning_count: warningCount,
    pointer_warning_count: pointerWarningCount,
    review_notes:
      "Deterministic local write proposal fixture for live-data reuse dogfood.",
    authority_boundary: {
      local_write_proposal_only: true,
      accepted_augnes_memory_created: false,
      product_db_persistence: false,
      review_decision_created: false,
      core_decision_created: false,
      runtime_handoff_created: false,
      automatic_promotion: false,
    },
  };

  const sourceProposalHash = sourceProposalHashForChecklist(proposal);
  const checklist = {
    checklist_version:
      "perspective_memory_local_write_proposal_review_checklist.v0.1",
    checklist_id: checklistId,
    created_at: nowIso,
    updated_at: nowIso,
    source: "perspective_memory_local_write_proposal",
    source_proposal_id: proposalId,
    source_queue_item_id: queueItemId,
    source_candidate_draft_id: candidateDraftId,
    source_validation_result_state: validationResult,
    source_proposal_status_at_creation: "draft_write_proposal",
    source_proposal_hash: sourceProposalHash,
    source_queue_item_state_at_creation: "source_queue_item_current",
    checklist_status: "locally_ready_for_product_persistence_review",
    readiness_summary: {
      summary_version:
        "perspective_memory_local_write_proposal_readiness_summary.v0.1",
      ready_for_product_persistence_review: true,
      ready_for_memory_write_now: false,
      blocked_reasons: [],
      warning_reasons:
        validationResult === "PASS with follow-up"
          ? ["PASS with follow-up row intentionally keeps warning-ish context"]
          : [],
      next_recommended_action:
        "Use for explicit temp DB live-data reuse dogfood only.",
    },
    gates: buildCheckedGates(),
    required_gate_count: 10,
    completed_required_gate_count: 10,
    optional_gate_count: 2,
    completed_optional_gate_count: 1,
    local_review_notes:
      "Deterministic seed fixture for Perspective Memory Reuse live-data dogfood.",
    authority_boundary: {
      local_checklist_only: true,
      product_persistence_boundary_record_created: false,
      accepted_augnes_memory_created: false,
      product_memory_write_created: false,
      review_decision_created: false,
      core_decision_created: false,
      runtime_handoff_created: false,
      automatic_promotion: false,
    },
  };

  return {
    recordId,
    itemId,
    nowIso,
    queueItem,
    proposal,
    checklist,
  };
}

function buildCheckedGates() {
  const requiredGateIds = [
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
  ];
  const gates = {};
  for (const gateId of requiredGateIds) {
    gates[gateId] = {
      gate_id: gateId,
      required: true,
      status: "checked",
      label: gateId.replaceAll("_", " "),
      notes: "Checked for deterministic temp DB seed harness.",
    };
  }
  gates.pass_follow_up_caveat_reviewed = {
    gate_id: "pass_follow_up_caveat_reviewed",
    required: false,
    status: "checked",
    label: "PASS with follow-up caveat reviewed",
    notes: "Warning-ish seeded row should remain visible in route output.",
  };
  gates.live_route_repeatability_reviewed = {
    gate_id: "live_route_repeatability_reviewed",
    required: false,
    status: "not_applicable",
    label: "Live route repeatability reviewed",
    notes: "This harness seeds only; browser validation is a follow-up PR.",
  };
  return gates;
}

export { DEFAULT_TEMP_DB_PATH, REUSE_ROUTE, SEEDED_ITEM_IDS };
