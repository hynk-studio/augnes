import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const itemModel = await import(
  "../lib/perspective-ingest/perspective-memory-item.ts"
);
const itemSearch = await import(
  "../lib/perspective-ingest/perspective-memory-item-search.ts"
);

const packageFile = "package.json";
const itemSearchFile =
  "lib/perspective-ingest/perspective-memory-item-search.ts";
const itemModelFile = "lib/perspective-ingest/perspective-memory-item.ts";
const itemStoreFile =
  "lib/perspective-ingest/perspective-memory-item-store.ts";
const apiRouteFile = "app/api/perspective/memory/items/route.ts";
const searchRouteFile =
  "app/cockpit/perspective/memory-items/search/page.tsx";
const searchComponentFile =
  "app/cockpit/perspective/memory-items/search/perspective-memory-item-search-surface.tsx";
const searchCssFile =
  "app/cockpit/perspective/memory-items/search/perspective-memory-item-search-surface.module.css";
const reviewRouteFile =
  "app/cockpit/perspective/memory-items/review/page.tsx";
const reviewComponentFile =
  "app/cockpit/perspective/memory-items/review/perspective-memory-item-review-workspace-surface.tsx";
const dashboardComponentFile =
  "app/cockpit/perspective/memory-items/perspective-memory-items-surface.tsx";
const browserSmokeFile =
  "scripts/browser-smoke-perspective-memory-items-search.mjs";
const itemBrowserSmokeFile =
  "scripts/browser-smoke-perspective-memory-items.mjs";
const searchDocFile = "docs/PERSPECTIVE_MEMORY_ITEMS_SEARCH_V0_1.md";
const itemDocFile = "docs/PERSPECTIVE_MEMORY_ITEMS_V0_1.md";
const searchReportFile =
  "reports/2026-06-13-perspective-memory-items-search.md";
const searchBrowserReportFile =
  "reports/browser/2026-06-13-perspective-memory-items-search.md";
const itemBrowserReportFile =
  "reports/browser/2026-06-13-perspective-memory-items.md";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const itemSearchText = readFileSync(itemSearchFile, "utf8");
const itemModelText = readFileSync(itemModelFile, "utf8");
const itemStoreText = readFileSync(itemStoreFile, "utf8");
const apiRouteText = readFileSync(apiRouteFile, "utf8");
const searchRouteText = readFileSync(searchRouteFile, "utf8");
const searchComponentText = readFileSync(searchComponentFile, "utf8");
const searchCssText = readFileSync(searchCssFile, "utf8");
const reviewRouteText = readFileSync(reviewRouteFile, "utf8");
const reviewComponentText = readFileSync(reviewComponentFile, "utf8");
const dashboardComponentText = readFileSync(dashboardComponentFile, "utf8");
const searchDocText = readFileSync(searchDocFile, "utf8");
const itemDocText = readFileSync(itemDocFile, "utf8");
const searchReportText = readFileSync(searchReportFile, "utf8");
const searchBrowserReportText = readFileSync(searchBrowserReportFile, "utf8");
const itemBrowserReportText = readFileSync(itemBrowserReportFile, "utf8");

assertStaticFiles();
assertSearchHelperBehavior();
assertApiAndRouteReadOnlyBoundary();
assertDocsReports();

console.log("PASS smoke:perspective-memory-items-search");

function assertStaticFiles() {
  for (const file of [
    itemSearchFile,
    apiRouteFile,
    searchRouteFile,
    searchComponentFile,
    searchCssFile,
    reviewRouteFile,
    reviewComponentFile,
    dashboardComponentFile,
    browserSmokeFile,
    itemBrowserSmokeFile,
    searchDocFile,
    searchReportFile,
    searchBrowserReportFile,
    itemBrowserReportFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }

  assert.equal(
    packageJson.scripts["smoke:perspective-memory-items-search"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-memory-items-search.mjs",
  );
  assert.equal(
    packageJson.scripts["browser:perspective-memory-items-search"],
    "node scripts/browser-smoke-perspective-memory-items-search.mjs",
  );
  assert.equal(
    packageJson.scripts["smoke:perspective-memory-items-review-workspace"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-memory-items-review-workspace.mjs",
  );

  assertIncludesAll(itemSearchText, [
    "perspective_memory_item_search.v0.1",
    "perspective_memory_item_search_result_summary.v0.1",
    "/cockpit/perspective/memory-items/search",
    "PERSPECTIVE_MEMORY_ITEM_SEARCH_FIELDS",
    "searchPerspectiveMemoryItems",
    "normalizeSearchQuery",
    "perspectiveMemoryItemHasWarnings",
    "total_candidates_considered",
    "total_matches",
    "match_fields",
    "result_summaries",
    "query_empty",
    "content.title",
    "content.summary",
    "content.source_refs",
    "content.evidence_refs",
    "content.risk_notes",
    "content.unresolved_tensions",
    "content.carry_forward_questions",
    "returned_envelope_hash",
    "source_validation_summary_hash",
    "source_input_hash",
    "prepare_execution_summary_hash",
    "source_proposal_hash",
  ]);
  assertNoIncludes(itemSearchText, [
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
  ]);
}

function assertSearchHelperBehavior() {
  assert.deepEqual(
    itemSearch.PERSPECTIVE_MEMORY_ITEM_SEARCH_FIELDS,
    [
      "item_id",
      "item_status",
      "memory_kind",
      "source_boundary_record_id",
      "source_checklist_id",
      "source_proposal_id",
      "source_queue_item_id",
      "source_candidate_draft_id",
      "source_validation_result_state",
      "source_validation_summary_hash",
      "source_input_ref",
      "source_input_hash",
      "prepare_summary_ref",
      "prepare_execution_summary_hash",
      "returned_envelope_hash",
      "source_proposal_hash",
      "content.title",
      "content.summary",
      "content.source_refs",
      "content.evidence_refs",
      "content.risk_notes",
      "content.unresolved_tensions",
      "content.carry_forward_questions",
      "content.suggested_next_review_action",
    ],
  );

  const exactTitle = makeItem({
    item_id: "perspective-memory-item:exact-title",
    title: "needle phrase",
    summary: "ordinary summary",
    updated_at: "2026-06-13T00:01:00.000Z",
  });
  const titleToken = makeItem({
    item_id: "perspective-memory-item:title-token",
    title: "needle phrase source trace",
    summary: "ordinary summary",
    updated_at: "2026-06-13T00:05:00.000Z",
  });
  const summaryMatch = makeItem({
    item_id: "perspective-memory-item:summary-match",
    title: "summary holder",
    summary: "summary includes needle phrase for retrieval",
    updated_at: "2026-06-13T00:06:00.000Z",
  });
  const refMatch = makeItem({
    item_id: "perspective-memory-item:ref-match",
    title: "ref holder",
    source_refs: ["needle phrase source ref"],
    updated_at: "2026-06-13T00:07:00.000Z",
  });
  const riskMatch = makeItem({
    item_id: "perspective-memory-item:risk-match",
    title: "risk holder",
    risk_notes: ["needle phrase risk caveat"],
    updated_at: "2026-06-13T00:08:00.000Z",
  });

  const ranked = itemSearch.searchPerspectiveMemoryItems(
    [riskMatch, refMatch, summaryMatch, titleToken, exactTitle],
    { query: "needle phrase", limit: 10 },
  );
  assert.equal(
    ranked.search.search_version,
    itemSearch.PERSPECTIVE_MEMORY_ITEM_SEARCH_VERSION,
  );
  assert.equal(ranked.search.query_empty, false);
  assert.deepEqual(
    ranked.items.map((item) => item.item_id),
    [
      "perspective-memory-item:exact-title",
      "perspective-memory-item:title-token",
      "perspective-memory-item:summary-match",
      "perspective-memory-item:ref-match",
      "perspective-memory-item:risk-match",
    ],
  );
  assert.equal(
    ranked.search.result_summaries[0].summary_version,
    itemSearch.PERSPECTIVE_MEMORY_ITEM_SEARCH_RESULT_SUMMARY_VERSION,
  );
  assert(
    ranked.search.result_summaries[0].matched_fields.includes("content.title"),
  );
  assert(
    ranked.search.result_summaries.some((summary) =>
      summary.matched_fields.includes("content.risk_notes"),
    ),
  );
  assert(
    ranked.search.result_summaries.every((summary) =>
      summary.snippets.every((snippet) => snippet.snippet.length <= 160),
    ),
  );

  const multiToken = itemSearch.searchPerspectiveMemoryItems(
    [
      makeItem({
        item_id: "perspective-memory-item:distributed-token-match",
        title: "alpha local memory item",
        summary: "beta source lineage",
      }),
      makeItem({
        item_id: "perspective-memory-item:missing-token",
        title: "alpha local memory item",
        summary: "ordinary source lineage",
      }),
    ],
    { query: "alpha beta", limit: 10 },
  );
  assert.equal(multiToken.items.length, 1);
  assert.equal(
    multiToken.items[0].item_id,
    "perspective-memory-item:distributed-token-match",
  );

  const emptyQuery = itemSearch.searchPerspectiveMemoryItems(
    [
      makeItem({ item_id: "perspective-memory-item:accepted", item_status: "accepted" }),
      makeItem({
        item_id: "perspective-memory-item:reviewing",
        item_status: "reviewing",
      }),
    ],
    { query: "   ", itemStatus: "reviewing", limit: 10 },
  );
  assert.equal(emptyQuery.search.query_empty, true);
  assert.equal(emptyQuery.items.length, 1);
  assert.equal(emptyQuery.items[0].item_status, "reviewing");

  const filtered = itemSearch.searchPerspectiveMemoryItems(
    [
      makeItem({
        item_id: "perspective-memory-item:pass-warning",
        item_status: "accepted",
        source_validation_result_state: "PASS with follow-up",
        risk_notes: ["1 warning; 1 pointer warning"],
        summary: "filter needle",
      }),
      makeItem({
        item_id: "perspective-memory-item:pass-no-warning",
        item_status: "deprecated",
        source_validation_result_state: "PASS",
        risk_notes: ["0 warnings", "0 pointer warnings"],
        summary: "filter needle",
      }),
    ],
    {
      query: "filter needle",
      sourceValidationResultState: "PASS with follow-up",
      hasWarnings: true,
      activeState: "active-ish",
      limit: 10,
    },
  );
  assert.equal(filtered.items.length, 1);
  assert.equal(filtered.items[0].item_id, "perspective-memory-item:pass-warning");

  const hashResult = itemSearch.searchPerspectiveMemoryItems(
    [
      makeItem({
        item_id: "perspective-memory-item:hash",
        returned_envelope_hash: "sha256:returned-envelope-searchable",
      }),
    ],
    { query: "returned-envelope-searchable", limit: 10 },
  );
  assert.equal(hashResult.items.length, 1);
  assert(
    hashResult.search.result_summaries[0].matched_fields.includes(
      "returned_envelope_hash",
    ),
  );

  const rawSearch = itemSearch.searchPerspectiveMemoryItems(
    [makeItem({ item_id: "perspective-memory-item:raw-search-control" })],
    { query: "raw returned envelope text provider logs token browser dump" },
  );
  assert.equal(rawSearch.items.length, 0);
}

function assertApiAndRouteReadOnlyBoundary() {
  assertIncludesAll(apiRouteText, [
    "searchParams.get(\"q\")",
    "searchParams.get(\"search\")",
    "source_validation_result_state",
    "active_state",
    "has_warnings",
    "searchPerspectiveMemoryItems",
    "search_read_only: true",
    "state_entry_created: false",
    "provider_model_call_created: false",
    "github_mutation_created: false",
  ]);
  assertIncludesAll(itemStoreText, [
    "sourceValidationResultState",
    "listPerspectiveMemoryItems",
  ]);
  assertIncludesAll(searchRouteText, ["PerspectiveMemoryItemSearchSurface"]);
  assertIncludesAll(searchComponentText, [
    "Read-Only Perspective-Memory Item Search",
    "data-augnes-perspective-memory-items-search-route",
    "data-augnes-memory-items-search-input",
    "data-augnes-memory-items-search-submit",
    "data-augnes-memory-items-search-clear",
    "data-augnes-memory-items-search-reload",
    "data-augnes-memory-items-search-filter",
    "data-augnes-memory-items-search-result-list",
    "data-augnes-memory-items-search-selected-detail",
    "data-augnes-memory-items-search-source-boundary-trace",
    "data-augnes-memory-items-search-content-preview",
    "data-augnes-memory-items-search-availability",
    "data-augnes-memory-items-search-authority-boundary",
    "data-augnes-memory-items-search-read-only-boundary",
    "data-augnes-memory-items-search-review-workspace-link",
    "data-augnes-memory-items-search-review-this-item-link",
    "Open review workspace",
    "Review this item",
    "PERSPECTIVE_MEMORY_ITEM_REVIEW_WORKSPACE_ROUTE",
    "all statuses",
    "accepted",
    "reviewing",
    "retracted",
    "superseded",
    "deprecated",
    "PASS",
    "PASS with follow-up",
    "has warnings",
    "active-ish",
    "inactive-ish",
    "no Core memory",
    "no Core decision",
    "no runtime injection",
    "no provider/model call",
    "no Codex SDK",
    "no GitHub mutation",
    "no automatic promotion",
  ]);
  assertIncludesAll(searchCssText, [
    ".shell",
    ".controlPanel",
    ".searchInputRow",
    ".grid",
    ".statusStrip",
    ".itemList",
    ".detailGrid",
    "@media (max-width: 900px)",
    "@media (max-width: 520px)",
  ]);
  assertIncludesAll(dashboardComponentText, [
    "Search persisted perspective-memory items",
    "PERSPECTIVE_MEMORY_ITEM_SEARCH_ROUTE",
    "data-augnes-memory-items-search-link",
  ]);
  assertIncludesAll(reviewRouteText + reviewComponentText, [
    "PerspectiveMemoryItemReviewWorkspaceSurface",
    "data-augnes-perspective-memory-items-review-route",
    "data-augnes-memory-items-review-packet",
  ]);

  assertNoIncludes(searchComponentText, [
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
    "PATCH",
    "POST",
  ]);
  assertNoIncludes(
    itemSearchText + apiRouteText + searchComponentText,
    [
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
    ],
  );
}

function assertDocsReports() {
  for (const text of [
    searchDocText,
    itemDocText,
    searchReportText,
    searchBrowserReportText,
    itemBrowserReportText,
  ]) {
    assertIncludesAll(text, [
      "perspective-memory item",
      "/cockpit/perspective/memory-items/search",
      "sqlite:lib/db.ts",
      "read-only",
      "Core decision",
      "runtime injection",
      "provider/model",
      "GitHub mutation",
    ]);
  }
  assertIncludesAll(searchDocText + searchReportText, [
    "PR #538",
    "title",
    "summary",
    "source_refs",
    "evidence_refs",
    "risk_notes",
    "unresolved_tensions",
    "carry_forward_questions",
    "returned_envelope_hash",
    "multi-token AND",
    "no vector",
    "no embeddings",
    "Next recommended PR",
  ]);
  assertIncludesAll(searchBrowserReportText, [
    "search by title term returns item",
    "search by summary term returns item",
    "search by source boundary id returns item",
    "search by returned envelope hash returns item",
    "search by risk/carry-forward term returns item",
    "multi-token search works",
    "no-result query shows empty state",
    "clear search resets result list",
    "selected item detail visible",
    "matched fields/snippets visible",
    "source boundary trace visible",
    "authority boundary visible",
    "refresh preserves persisted item results through API/SQLite",
    "link to review workspace visible",
  ]);
}

function makeItem(overrides = {}) {
  const item = {
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
      title: overrides.title ?? "Perspective memory search fixture",
      summary: overrides.summary ?? "Bounded persisted item summary.",
      source_refs: overrides.source_refs ?? ["source-input:fixture"],
      evidence_refs: overrides.evidence_refs ?? ["evidence:fixture"],
      risk_notes: overrides.risk_notes ?? ["0 warnings", "0 pointer warnings"],
      unresolved_tensions:
        overrides.unresolved_tensions ?? ["not captured in local queue item"],
      carry_forward_questions:
        overrides.carry_forward_questions ??
        ["Should this item be reviewed before synthesis?"],
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
  return item;
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
