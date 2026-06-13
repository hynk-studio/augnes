import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const itemModel = await import(
  "../lib/perspective-ingest/perspective-memory-item.ts"
);
const reviewWorkspace = await import(
  "../lib/perspective-ingest/perspective-memory-item-review-workspace.ts"
);

const packageFile = "package.json";
const reviewHelperFile =
  "lib/perspective-ingest/perspective-memory-item-review-workspace.ts";
const reviewRouteFile =
  "app/cockpit/perspective/memory-items/review/page.tsx";
const reviewComponentFile =
  "app/cockpit/perspective/memory-items/review/perspective-memory-item-review-workspace-surface.tsx";
const reviewCssFile =
  "app/cockpit/perspective/memory-items/review/perspective-memory-item-review-workspace-surface.module.css";
const dashboardComponentFile =
  "app/cockpit/perspective/memory-items/perspective-memory-items-surface.tsx";
const searchComponentFile =
  "app/cockpit/perspective/memory-items/search/perspective-memory-item-search-surface.tsx";
const reviewDocFile =
  "docs/PERSPECTIVE_MEMORY_ITEMS_REVIEW_WORKSPACE_V0_1.md";
const itemDocFile = "docs/PERSPECTIVE_MEMORY_ITEMS_V0_1.md";
const searchDocFile = "docs/PERSPECTIVE_MEMORY_ITEMS_SEARCH_V0_1.md";
const reviewReportFile =
  "reports/2026-06-13-perspective-memory-items-review-workspace.md";
const reviewBrowserReportFile =
  "reports/browser/2026-06-13-perspective-memory-items-review-workspace.md";
const itemBrowserReportFile =
  "reports/browser/2026-06-13-perspective-memory-items.md";
const searchBrowserReportFile =
  "reports/browser/2026-06-13-perspective-memory-items-search.md";
const browserSmokeFile =
  "scripts/browser-smoke-perspective-memory-items-review-workspace.mjs";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const reviewHelperText = readFileSync(reviewHelperFile, "utf8");
const reviewRouteText = readFileSync(reviewRouteFile, "utf8");
const reviewComponentText = readFileSync(reviewComponentFile, "utf8");
const reviewCssText = readFileSync(reviewCssFile, "utf8");
const dashboardComponentText = readFileSync(dashboardComponentFile, "utf8");
const searchComponentText = readFileSync(searchComponentFile, "utf8");
const reviewDocText = readFileSync(reviewDocFile, "utf8");
const itemDocText = readFileSync(itemDocFile, "utf8");
const searchDocText = readFileSync(searchDocFile, "utf8");
const reviewReportText = readFileSync(reviewReportFile, "utf8");
const reviewBrowserReportText = readFileSync(reviewBrowserReportFile, "utf8");
const itemBrowserReportText = readFileSync(itemBrowserReportFile, "utf8");
const searchBrowserReportText = readFileSync(searchBrowserReportFile, "utf8");

assertStaticFilesAndScripts();
assertReviewPacketBehavior();
assertRouteIsPacketFirstAndReadOnly();
assertDocsReports();

console.log("PASS smoke:perspective-memory-items-review-workspace");

function assertStaticFilesAndScripts() {
  for (const file of [
    reviewHelperFile,
    reviewRouteFile,
    reviewComponentFile,
    reviewCssFile,
    dashboardComponentFile,
    searchComponentFile,
    reviewDocFile,
    reviewReportFile,
    reviewBrowserReportFile,
    browserSmokeFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }

  assert.equal(
    packageJson.scripts["smoke:perspective-memory-items-review-workspace"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-memory-items-review-workspace.mjs",
  );
  assert.equal(
    packageJson.scripts["browser:perspective-memory-items-review-workspace"],
    "node scripts/browser-smoke-perspective-memory-items-review-workspace.mjs",
  );

  assertIncludesAll(reviewHelperText, [
    "perspective_memory_item_review_workspace.v0.1",
    "perspective_memory_item_review_packet.v0.1",
    "perspective_memory_item_review_selection_summary.v0.1",
    "perspective_memory_item_review_guidance.v0.1",
    "buildPerspectiveMemoryItemReviewPacket",
    "status_counts",
    "validation_result_counts",
    "source_refs",
    "evidence_refs",
    "risk_notes",
    "unresolved_tensions",
    "carry_forward_questions",
    "relationship_summary",
    "shared_source_refs",
    "duplicate_titles",
    "repeated_questions",
    "read_only_review_packet: true",
    "provider_model_call_created: false",
    "github_mutation_created: false",
  ]);
  assertNoIncludes(reviewHelperText, [
    "returned_envelope_text",
    "raw_prompt",
    "raw_source_packet",
    "raw_candidate_payload",
    "hidden_reasoning",
    "provider_logs",
    "browser_dump",
    "raw_review_payload",
    "embedding",
    "vector",
    "localStorage",
  ]);
}

function assertReviewPacketBehavior() {
  const emptyPacket = reviewWorkspace.buildPerspectiveMemoryItemReviewPacket({
    items: [],
    selected_item_ids: [],
    nowIso: "2026-06-13T00:00:00.000Z",
  });
  assert.equal(
    emptyPacket.packet_version,
    reviewWorkspace.PERSPECTIVE_MEMORY_ITEM_REVIEW_PACKET_VERSION,
  );
  assert.equal(emptyPacket.selected_item_count, 0);
  assert.equal(emptyPacket.review_guidance.deterministic_only, true);
  assert(
    emptyPacket.review_guidance.suggested_review_steps.some((step) =>
      step.includes("Select persisted perspective-memory items"),
    ),
  );
  assert.equal(emptyPacket.authority_boundary.read_only_review_packet, true);
  assert.equal(emptyPacket.authority_boundary.core_decision_created, false);
  assert.equal(emptyPacket.authority_boundary.provider_model_call_created, false);

  const itemA = makeItem({
    item_id: "perspective-memory-item:a",
    title: "Shared title",
    summary: "First bounded summary",
    source_refs: ["shared-source-ref", "source-a"],
    evidence_refs: ["evidence-a", "shared-evidence-ref"],
    risk_notes: ["0 warnings", "risk one"],
    unresolved_tensions: ["tension one"],
    carry_forward_questions: ["Repeated question?", "Question A?"],
    suggested_next_review_action: "Review source refs first.",
  });
  const itemB = makeItem({
    item_id: "perspective-memory-item:b",
    title: "Shared title",
    summary: "Second bounded summary",
    source_refs: ["shared-source-ref", "source-b"],
    evidence_refs: ["evidence-b", "shared-evidence-ref"],
    risk_notes: ["PASS with follow-up caution remains"],
    unresolved_tensions: ["tension two"],
    carry_forward_questions: ["Repeated question?", "Question B?"],
    source_validation_result_state: "PASS with follow-up",
    item_status: "reviewing",
  });
  const itemC = makeItem({
    item_id: "perspective-memory-item:c",
    title: "Deprecated item",
    source_refs: ["source-c"],
    risk_notes: ["deprecated caveat"],
    carry_forward_questions: ["Question C?"],
    item_status: "deprecated",
  });
  const itemD = makeItem({
    item_id: "perspective-memory-item:d",
    title: "Superseded item",
    carry_forward_questions: ["Question D?"],
    item_status: "superseded",
  });

  const singlePacket = reviewWorkspace.buildPerspectiveMemoryItemReviewPacket({
    items: [itemA, itemB],
    selected_item_ids: [itemA.item_id],
    nowIso: "2026-06-13T00:01:00.000Z",
  });
  assert.equal(singlePacket.selected_item_count, 1);
  assert.deepEqual(singlePacket.selected_item_ids, [itemA.item_id]);
  assert.equal(singlePacket.status_counts.accepted, 1);
  assert.equal(singlePacket.validation_result_counts.PASS, 1);
  assert.equal(singlePacket.memory_kind_counts.perspective_candidate, 1);
  assert.equal(singlePacket.content_summaries.length, 1);

  const multiPacket = reviewWorkspace.buildPerspectiveMemoryItemReviewPacket({
    items: [itemA, itemB, itemC, itemD],
    selected_item_ids: [
      itemA.item_id,
      itemB.item_id,
      itemC.item_id,
      itemD.item_id,
      "perspective-memory-item:missing",
    ],
    nowIso: "2026-06-13T00:02:00.000Z",
  });
  assert.equal(multiPacket.selected_item_count, 4);
  assert.deepEqual(multiPacket.missing_item_ids, ["perspective-memory-item:missing"]);
  assert.equal(multiPacket.status_counts.accepted, 1);
  assert.equal(multiPacket.status_counts.reviewing, 1);
  assert.equal(multiPacket.status_counts.deprecated, 1);
  assert.equal(multiPacket.status_counts.superseded, 1);
  assert.equal(multiPacket.validation_result_counts.PASS, 3);
  assert.equal(multiPacket.validation_result_counts["PASS with follow-up"], 1);
  assert(multiPacket.source_refs.includes("shared-source-ref"));
  assert(multiPacket.evidence_refs.includes("shared-evidence-ref"));
  assert(multiPacket.risk_notes.includes("risk one"));
  assert(multiPacket.unresolved_tensions.includes("tension two"));
  assert(multiPacket.carry_forward_questions.includes("Repeated question?"));
  assert(multiPacket.suggested_next_review_actions.includes("Review source refs first."));
  assert.deepEqual(multiPacket.relationship_summary.duplicate_titles, [
    "Shared title",
  ]);
  assert.deepEqual(multiPacket.relationship_summary.shared_source_refs, [
    "shared-source-ref",
  ]);
  assert.deepEqual(multiPacket.relationship_summary.repeated_questions, [
    "Repeated question?",
  ]);
  assert.deepEqual(multiPacket.relationship_summary.pass_with_follow_up_items, [
    itemB.item_id,
  ]);
  assert.deepEqual(multiPacket.relationship_summary.retracted_or_deprecated_items, [
    itemC.item_id,
  ]);
  assert.deepEqual(multiPacket.relationship_summary.superseded_items, [
    itemD.item_id,
  ]);
  assert(
    multiPacket.review_guidance.blocked_actions.includes("Provider/model synthesis"),
  );
  assert.equal(multiPacket.authority_boundary.memory_item_created, false);
  assert.equal(multiPacket.authority_boundary.memory_item_mutated, false);
  assert.equal(
    multiPacket.authority_boundary.automatic_runtime_injection_created,
    false,
  );

  const serialized = JSON.stringify(multiPacket);
  for (const marker of [
    "raw returned envelope text",
    "raw prompt",
    "raw source packet",
    "raw candidate payload",
    "hidden reasoning",
    "provider logs",
    "TOKEN=",
    "browser dump",
    "raw review payload",
  ]) {
    assert.equal(
      serialized.includes(marker),
      false,
      `review packet must not include unsafe marker: ${marker}`,
    );
  }
}

function assertRouteIsPacketFirstAndReadOnly() {
  assertIncludesAll(reviewRouteText, ["PerspectiveMemoryItemReviewWorkspaceSurface"]);
  assertIncludesAll(reviewComponentText, [
    "PERSPECTIVE_MEMORY_ITEM_API_ROUTE",
    "buildPerspectiveMemoryItemReviewPacket",
    "data-augnes-perspective-memory-items-review-route",
    "data-augnes-memory-items-review-packet",
    "data-augnes-memory-items-review-counts",
    "data-augnes-memory-items-review-content-summary",
    "data-augnes-memory-items-review-source-evidence-refs",
    "data-augnes-memory-items-review-risk-tensions-questions",
    "data-augnes-memory-items-review-relationship-summary",
    "data-augnes-memory-items-review-guidance",
    "data-augnes-memory-items-review-authority-boundary",
    "data-augnes-memory-items-review-item-list",
    "data-augnes-memory-items-review-toggle-item",
    "data-augnes-memory-items-review-select-all-visible",
    "data-augnes-memory-items-review-clear-selection",
    "data-augnes-memory-items-review-reload",
    "data-augnes-memory-items-review-filter",
    "data-augnes-memory-items-review-selected-detail",
    "data-augnes-memory-items-review-read-only-boundary",
    "status_counts",
    "validation_result_counts",
    "source_refs",
    "evidence_refs",
    "risk_notes",
    "unresolved_tensions",
    "carry_forward_questions",
    "relationship_summary",
    "suggested_review_steps",
    "blocked_actions",
    "no Core memory",
    "no Core decision",
    "no runtime injection",
    "no provider/model call",
    "no Codex SDK",
    "no GitHub mutation",
    "no automatic promotion",
  ]);
  assertIncludesAll(reviewCssText, [
    ".shell",
    ".workbenchGrid",
    ".packetPanel",
    ".statusStrip",
    ".itemList",
    ".summaryList",
    ".detailGrid",
    "@media (max-width: 900px)",
    "@media (max-width: 520px)",
  ]);
  assertIncludesAll(dashboardComponentText, [
    "Review selected perspective-memory items",
    "PERSPECTIVE_MEMORY_ITEM_REVIEW_WORKSPACE_ROUTE",
    "data-augnes-memory-items-review-workspace-link",
    "data-augnes-memory-items-review-selected-item-link",
  ]);
  assertIncludesAll(searchComponentText, [
    "Open review workspace",
    "Review this item",
    "PERSPECTIVE_MEMORY_ITEM_REVIEW_WORKSPACE_ROUTE",
    "data-augnes-memory-items-search-review-workspace-link",
    "data-augnes-memory-items-search-review-this-item-link",
  ]);
  assertNoIncludes(reviewComponentText, [
    "onUpdateItemStatus",
    "data-augnes-memory-item-status-accepted",
    "data-augnes-memory-item-status-reviewing",
    "data-augnes-memory-item-status-retracted",
    "data-augnes-memory-item-status-superseded",
    "data-augnes-memory-item-status-deprecated",
    "data-augnes-create-perspective-memory-item",
    "data-augnes-create-product-persistence-boundary-record",
    "data-augnes-write-to-memory",
    "data-augnes-commit-memory",
    "data-augnes-send-to-core",
    "data-augnes-create-core-decision",
    "data-augnes-auto-inject-runtime",
    "data-augnes-auto-promote",
    "data-augnes-provider-model-enrich",
    "data-augnes-github-mutation",
    "data-augnes-commit-state-entry",
    "localStorage",
    "sessionStorage",
    "PATCH",
    "POST",
  ]);
  assertNoIncludes(reviewHelperText + reviewComponentText, [
    "new OpenAI",
    "openai.chat",
    "@openai/codex",
    "Codex(",
    "new Octokit",
    "@octokit",
    "createCoreDecision",
    "createCoreMemory",
    "runtime_handoff_created: true",
    "automatic_runtime_injection_created: true",
    "automatic_promotion_created: true",
  ]);
}

function assertDocsReports() {
  for (const text of [
    reviewDocText,
    itemDocText,
    searchDocText,
    reviewReportText,
    reviewBrowserReportText,
    itemBrowserReportText,
    searchBrowserReportText,
  ]) {
    assertIncludesAll(text, [
      "perspective-memory item",
      "/cockpit/perspective/memory-items/review",
      "sqlite:lib/db.ts",
      "read-only",
      "review packet",
      "Core decision",
      "runtime injection",
      "provider/model",
      "GitHub mutation",
    ]);
  }
  assertIncludesAll(reviewDocText + reviewReportText, [
    "PR #539",
    "status_counts",
    "validation_result_counts",
    "source_refs",
    "evidence_refs",
    "risk_notes",
    "unresolved_tensions",
    "carry_forward_questions",
    "relationship_summary",
    "review_guidance",
    "no provider/model synthesis",
    "no vector",
    "no embeddings",
    "Next recommended PR",
  ]);
  assertIncludesAll(reviewBrowserReportText, [
    "read-only boundary visible",
    "select item works",
    "selected count updates",
    "review packet panel visible",
    "status_counts visible",
    "validation_result_counts visible",
    "source/evidence refs visible",
    "risk notes visible",
    "unresolved tensions visible",
    "carry-forward questions visible",
    "relationship summary visible",
    "review guidance visible",
    "selected item detail visible",
    "clear selection works",
    "select all visible works",
    "filters work",
    "refresh preserves persisted items through API/SQLite",
  ]);
}

function makeItem(overrides = {}) {
  return {
    item_version: itemModel.PERSPECTIVE_MEMORY_ITEM_VERSION,
    item_id: overrides.item_id ?? "perspective-memory-item:base",
    created_at: overrides.created_at ?? "2026-06-13T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2026-06-13T00:00:00.000Z",
    source: "product_persistence_boundary_record",
    source_boundary_record_id:
      overrides.source_boundary_record_id ?? "perspective-memory-boundary:base",
    source_checklist_id: overrides.source_checklist_id ?? "checklist:base",
    source_proposal_id: overrides.source_proposal_id ?? "proposal:base",
    source_queue_item_id: overrides.source_queue_item_id ?? "queue-item:base",
    source_candidate_draft_id:
      overrides.source_candidate_draft_id ?? "candidate-draft:base",
    source_validation_result_state:
      overrides.source_validation_result_state ?? "PASS",
    source_validation_summary_hash:
      overrides.source_validation_summary_hash ?? "sha256:validation-summary",
    source_input_ref: overrides.source_input_ref ?? "source-input:fixture",
    source_input_hash: overrides.source_input_hash ?? "sha256:source-input",
    prepare_summary_ref:
      overrides.prepare_summary_ref ?? "prepare-summary:fixture",
    prepare_execution_summary_hash:
      overrides.prepare_execution_summary_hash ?? "sha256:prepare-summary",
    returned_envelope_hash:
      overrides.returned_envelope_hash ?? "sha256:returned-envelope",
    source_proposal_hash:
      overrides.source_proposal_hash ?? "sha256:source-proposal",
    memory_kind: overrides.memory_kind ?? "perspective_candidate",
    item_status: overrides.item_status ?? "accepted",
    content: {
      content_version: itemModel.PERSPECTIVE_MEMORY_ITEM_CONTENT_VERSION,
      title: overrides.title ?? "Perspective memory review fixture",
      summary: overrides.summary ?? "Bounded persisted item summary.",
      source_refs: overrides.source_refs ?? ["source-input:fixture"],
      evidence_refs: overrides.evidence_refs ?? ["evidence:fixture"],
      risk_notes: overrides.risk_notes ?? ["0 warnings", "0 pointer warnings"],
      unresolved_tensions:
        overrides.unresolved_tensions ?? ["not captured in local queue item"],
      carry_forward_questions:
        overrides.carry_forward_questions ??
        ["Should this item be reviewed before deterministic synthesis?"],
      suggested_next_review_action:
        overrides.suggested_next_review_action ??
        "Review before Core-facing promotion or runtime usage.",
    },
    acceptance: {
      accepted_at: overrides.accepted_at ?? "2026-06-13T00:00:00.000Z",
      acceptance_label: "Create persisted perspective-memory item",
      user_confirmed_create_persisted_perspective_memory_item: true,
      user_confirmed_not_core_decision: true,
      user_confirmed_no_automatic_runtime_injection: true,
      user_confirmed_source_boundary_record_preserved: true,
    },
    source_boundary_snapshot: {
      boundary_status_at_creation: "product_persistence_boundary_recorded",
      checklist_ready_for_product_persistence_review: true,
      checklist_ready_for_memory_write_now: false,
      proposed_memory_payload_should_write_to_memory_now: false,
      user_confirmation_from_boundary_record: {
        confirmed_at: "2026-06-13T00:00:00.000Z",
      },
      checklist_gate_summary: {
        required_gate_count: 1,
        completed_required_gate_count: 1,
        optional_gate_count: 0,
        completed_optional_gate_count: 0,
        checked_required_gates: ["final_user_intent_confirmed"],
        not_applicable_gates: [],
        blocked_gates: [],
      },
      proposal_diff_summary: {
        included_from_queue_item: ["memory candidate preview"],
        excluded_from_queue_item: ["queue-only local status"],
        excluded_raw_material: ["excluded raw material category redacted"],
        authority_boundary_notes: ["boundary record is not Core memory"],
      },
    },
    availability: {
      visible_in_perspective_memory_items: true,
      eligible_for_manual_review: true,
      eligible_for_future_retrieval_surfaces: true,
      eligible_for_future_synthesis_surfaces: true,
      automatic_runtime_injection_enabled: false,
      core_memory_enabled: false,
    },
    authority_boundary: {
      perspective_memory_item_created: true,
      accepted_product_memory_item_created: true,
      core_decision_created: false,
      core_memory_created: false,
      state_entry_created: false,
      runtime_handoff_created: false,
      automatic_runtime_injection_created: false,
      automatic_promotion_created: false,
      provider_model_call_created: false,
      github_mutation_created: false,
    },
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
