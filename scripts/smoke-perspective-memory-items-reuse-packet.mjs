import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const itemModel = await import(
  "../lib/perspective-ingest/perspective-memory-item.ts"
);
const reusePacket = await import(
  "../lib/perspective-ingest/perspective-memory-item-reuse-packet.ts"
);

const packageFile = "package.json";
const helperFile =
  "lib/perspective-ingest/perspective-memory-item-reuse-packet.ts";
const routeFile = "app/cockpit/perspective/memory-items/reuse/page.tsx";
const componentFile =
  "app/cockpit/perspective/memory-items/reuse/perspective-memory-item-reuse-workspace-surface.tsx";
const cssFile =
  "app/cockpit/perspective/memory-items/reuse/perspective-memory-item-reuse-workspace-surface.module.css";
const dashboardComponentFile =
  "app/cockpit/perspective/memory-items/perspective-memory-items-surface.tsx";
const searchComponentFile =
  "app/cockpit/perspective/memory-items/search/perspective-memory-item-search-surface.tsx";
const reviewComponentFile =
  "app/cockpit/perspective/memory-items/review/perspective-memory-item-review-workspace-surface.tsx";
const qualityReviewHelperFile =
  "lib/perspective-ingest/perspective-memory-reuse-quality-review.ts";
const docFile = "docs/PERSPECTIVE_MEMORY_REUSE_PACKET_V0_1.md";
const reportFile = "reports/2026-06-14-perspective-memory-reuse-packet.md";
const briefMetadataReportFile =
  "reports/2026-06-14-perspective-memory-reuse-brief-metadata.md";
const qualityReviewPanelReportFile =
  "reports/2026-06-14-perspective-memory-reuse-quality-review-panel.md";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const helperText = readFileSync(helperFile, "utf8");
const routeText = readFileSync(routeFile, "utf8");
const componentText = readFileSync(componentFile, "utf8");
const cssText = readFileSync(cssFile, "utf8");
const dashboardText = readFileSync(dashboardComponentFile, "utf8");
const searchText = readFileSync(searchComponentFile, "utf8");
const reviewText = readFileSync(reviewComponentFile, "utf8");
const qualityReviewHelperText = readFileSync(qualityReviewHelperFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");
const briefMetadataReportText = readFileSync(briefMetadataReportFile, "utf8");
const qualityReviewPanelReportText = readFileSync(
  qualityReviewPanelReportFile,
  "utf8",
);

assertStaticFilesAndScripts();
assertReusePacketBehavior();
assertRouteAndNavigation();
assertDocsReportsAndBoundary();

console.log("PASS smoke:perspective-memory-items-reuse-packet");

function assertStaticFilesAndScripts() {
  for (const file of [
    helperFile,
    routeFile,
    componentFile,
    cssFile,
    dashboardComponentFile,
    searchComponentFile,
    reviewComponentFile,
    qualityReviewHelperFile,
    docFile,
    reportFile,
    briefMetadataReportFile,
    qualityReviewPanelReportFile,
  ]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }

  assert.equal(
    packageJson.scripts["smoke:perspective-memory-items-reuse-packet"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-memory-items-reuse-packet.mjs",
  );

  assertIncludesAll(helperText, [
    "perspective_memory_reuse_packet.v0.1",
    "perspective_memory_reuse_workspace.v0.1",
    "/cockpit/perspective/memory-items/reuse",
    "target_mode: typeof PERSPECTIVE_MEMORY_REUSE_TARGET_MODE",
    "selected_memory_items",
    "missing_memory_item_ids",
    "why_selected",
    "reuse_boundary",
    "reuse_instructions",
    "known_boundaries",
    "return_expectations",
    "authority_boundary",
    "codex_memory_brief_metadata",
    "selected_item_count",
    "codex_memory_brief_character_count",
    "codex_memory_brief_line_count",
    "has_large_selection_warning",
    "compact_brief_recommended",
    "PERSPECTIVE_MEMORY_REUSE_LARGE_SELECTION_THRESHOLD",
    "PERSPECTIVE_MEMORY_REUSE_COMPACT_BRIEF_CHARACTER_THRESHOLD",
    "deterministic_local_builder: true",
    "memory_item_created: false",
    "memory_item_mutated: false",
    "perspective_memory_persistence_write_created: false",
    "reuse_packet_persisted: false",
    "db_schema_changed: false",
    "product_boundary_record_created: false",
    "proof_evidence_written: false",
    "augnes_state_commit_reject_created: false",
    "provider_model_call_created: false",
    "openai_api_call_created: false",
    "codex_sdk_execution_created: false",
    "mcp_tool_call_created: false",
    "github_mutation_created: false",
    "runtime_started: false",
    "mcp_bridge_started: false",
    "automatic_synthesis_created: false",
  ]);
  assertIncludesAll(qualityReviewHelperText, [
    "perspective_memory_reuse_quality_review.v0.1",
    "buildPerspectiveMemoryReuseQualityReview",
    "mechanical_checks_only: true",
    "semantic_truth_claim_created: false",
    "quality_review_persisted: false",
  ]);
}

function assertReusePacketBehavior() {
  const itemA = makeItem({
    item_id: "perspective-memory-item:a",
    title: "Preserve reviewed direction",
    summary: "The operator already closed the old setup polish loop.",
    source_refs: ["report:setup-dogfood", "source-a"],
    risk_notes: ["avoid reopening prepare wording without a blocker"],
    carry_forward_questions: ["What is the next implementation slice?"],
    source_boundary_record_id: "boundary:a",
    source_candidate_draft_id: "candidate:a",
  });
  const itemB = makeItem({
    item_id: "perspective-memory-item:b",
    title: "Reuse packet needs return contract",
    summary: "Codex output should report files, verification, skips, friction.",
    source_refs: ["report:return-contract"],
    risk_notes: ["do not create memory automatically"],
    carry_forward_questions: ["Did reuse expose stale memory?"],
    source_validation_result_state: "PASS with follow-up",
    item_status: "reviewing",
  });
  const itemC = makeItem({
    item_id: "perspective-memory-item:c",
    title: "Keep reuse brief size visible",
    summary: "Large selections should expose deterministic brief length metadata.",
    source_refs: ["report:brief-metadata"],
    risk_notes: ["do not replace the full Codex Memory Brief"],
    carry_forward_questions: ["Is compact brief output needed after dogfood?"],
    source_validation_result_state: "PASS",
    item_status: "accepted",
  });

  const result = reusePacket.buildPerspectiveMemoryReusePacket({
    items: [itemA, itemB],
    selected_memory_items: [
      {
        memory_item_id: itemA.item_id,
        why_selected: "prevents repeating the completed setup/prepare work",
        reuse_boundary: "preserve the no-new-authority boundary",
      },
      {
        memory_item_id: itemB.item_id,
        why_selected: "defines the return expectations for Codex output",
        reuse_boundary: "copy only; do not write memory or state",
      },
      {
        memory_item_id: "perspective-memory-item:missing",
        why_selected: "missing item should be reported",
        reuse_boundary: "missing item boundary should not fabricate content",
      },
    ],
    task_title: "Dogfood reuse packet",
    task_description: "Use persisted memory to scope the next Augnes task.",
    nowIso: "2026-06-14T00:00:00.000Z",
    packetId: "packet:fixture",
  });

  assert.equal(
    result.packet.packet_type,
    reusePacket.PERSPECTIVE_MEMORY_REUSE_PACKET_VERSION,
  );
  assert.equal(result.packet.packet_id, "packet:fixture");
  assert.equal(result.packet.created_at, "2026-06-14T00:00:00.000Z");
  assert.equal(result.packet.target_mode, "codex");
  assert.equal(result.packet.task.title, "Dogfood reuse packet");
  assert.equal(
    result.packet.task.description,
    "Use persisted memory to scope the next Augnes task.",
  );
  assert.deepEqual(result.packet.missing_memory_item_ids, [
    "perspective-memory-item:missing",
  ]);
  assert.equal(result.packet.selected_memory_items.length, 2);

  const selectedA = result.packet.selected_memory_items[0];
  assert.equal(selectedA.memory_item_id, itemA.item_id);
  assert.equal(selectedA.title, "Preserve reviewed direction");
  assert.equal(
    selectedA.summary,
    "The operator already closed the old setup polish loop.",
  );
  assert.equal(selectedA.source_ref, "source-input:fixture");
  assert.equal(
    selectedA.why_selected,
    "prevents repeating the completed setup/prepare work",
  );
  assert.equal(
    selectedA.reuse_boundary,
    "preserve the no-new-authority boundary",
  );
  assert(selectedA.derived_tags.includes("status:accepted"));
  assert(selectedA.derived_tags.includes("kind:perspective_candidate"));
  assert(selectedA.derived_tags.includes("validation:PASS"));
  assert(selectedA.derived_tags.includes("source_boundary:boundary:a"));
  assert(selectedA.derived_tags.includes("candidate:candidate:a"));
  assert(selectedA.derived_tags.includes("source_ref:report:setup-dogfood"));
  assert(
    selectedA.derived_tags.includes(
      "risk:avoid reopening prepare wording without a blocker",
    ),
  );
  assert(
    selectedA.derived_tags.includes(
      "question:What is the next implementation slice?",
    ),
  );

  const selectedB = result.packet.selected_memory_items[1];
  assert.equal(
    selectedB.why_selected,
    "defines the return expectations for Codex output",
  );
  assert.equal(selectedB.reuse_boundary, "copy only; do not write memory or state");

  assertIncludesAll(result.packet.reuse_instructions.join("\n"), [
    "avoid repeating closed work",
    "preserve Augnes direction",
    "identify the next implementation slice",
    "changed files, verification, skipped checks, and remaining friction",
  ]);
  assertIncludesAll(result.packet.return_expectations.join("\n"), [
    "Changed files",
    "Verification",
    "Skipped checks with concrete reasons",
    "Remaining friction",
  ]);

  for (const [key, value] of Object.entries(result.packet.authority_boundary)) {
    if (
      key === "deterministic_local_builder" ||
      key === "memory_items_read" ||
      key === "reuse_packet_created" ||
      key === "codex_memory_brief_created"
    ) {
      assert.equal(value, true, `${key} must be true`);
    } else {
      assert.equal(value, false, `${key} must be false`);
    }
  }

  assertIncludesAll(result.codex_memory_brief, [
    "# Codex Memory Brief",
    "## Task",
    "Dogfood reuse packet",
    "## Relevant Augnes Perspective Memory",
    "Preserve reviewed direction",
    "why relevant: prevents repeating the completed setup/prepare work",
    "boundary: preserve the no-new-authority boundary",
    "Use these memories to avoid repeating closed work, preserve Augnes direction, identify next implementation slice, and report back changed files, verification, skipped checks, and remaining friction.",
    "Do not create memory items, mutate Augnes state, run provider/model calls, call MCP tools, use Codex SDK, or perform GitHub mutation.",
    "Changed files",
    "Verification",
    "Skipped checks with concrete reasons",
    "Remaining friction",
    "perspective-memory-item:missing",
  ]);
  assert.equal(
    result.codex_memory_brief_metadata.selected_item_count,
    result.packet.selected_memory_items.length,
  );
  assert.equal(
    result.codex_memory_brief_metadata.codex_memory_brief_character_count,
    result.codex_memory_brief.length,
  );
  assert.equal(
    result.codex_memory_brief_metadata.codex_memory_brief_line_count,
    result.codex_memory_brief.split("\n").length,
  );
  assert.equal(
    result.codex_memory_brief_metadata.has_large_selection_warning,
    false,
  );
  assert.equal(
    result.codex_memory_brief_metadata.compact_brief_recommended,
    result.codex_memory_brief.length >=
      reusePacket.PERSPECTIVE_MEMORY_REUSE_COMPACT_BRIEF_CHARACTER_THRESHOLD,
  );

  const largeSelectionResult = reusePacket.buildPerspectiveMemoryReusePacket({
    items: [itemA, itemB, itemC],
    selected_memory_items: [itemA, itemB, itemC].map((item) => ({
      memory_item_id: item.item_id,
      why_selected: "included to verify large selection metadata",
      reuse_boundary: "metadata only; do not persist reuse binding",
    })),
    task_title: "Large selection metadata",
    task_description: "Exercise deterministic brief metadata thresholds.",
    nowIso: "2026-06-14T00:00:00.000Z",
    packetId: "packet:large-selection-fixture",
  });
  assert.equal(
    largeSelectionResult.codex_memory_brief_metadata.selected_item_count,
    3,
  );
  assert.equal(
    largeSelectionResult.codex_memory_brief_metadata.has_large_selection_warning,
    true,
  );
  assert.equal(
    largeSelectionResult.codex_memory_brief_metadata.compact_brief_recommended,
    true,
  );
  assert.equal(
    largeSelectionResult.codex_memory_brief_metadata
      .codex_memory_brief_character_count,
    largeSelectionResult.codex_memory_brief.length,
  );

  assertNoUnsafePayloadMarkers(
    JSON.stringify(result.packet) + "\n" + result.codex_memory_brief,
  );
}

function assertRouteAndNavigation() {
  assertIncludesAll(routeText, ["PerspectiveMemoryItemReuseWorkspaceSurface"]);
  assertIncludesAll(componentText, [
    "PERSPECTIVE_MEMORY_ITEM_API_ROUTE",
    "buildPerspectiveMemoryReusePacket",
    "buildPerspectiveMemoryReuseQualityReview",
    "data-augnes-perspective-memory-items-reuse-route",
    "data-augnes-memory-items-reuse-task-title",
    "data-augnes-memory-items-reuse-task-description",
    "data-augnes-memory-items-reuse-item-list",
    "data-augnes-memory-items-reuse-toggle-item",
    "data-augnes-memory-items-reuse-why-selected",
    "data-augnes-memory-items-reuse-boundary",
    "data-augnes-memory-items-reuse-packet-json",
    "data-augnes-memory-items-reuse-codex-brief",
    "data-augnes-memory-items-reuse-brief-metadata",
    "data-augnes-memory-items-reuse-quality-review-panel",
    "data-augnes-memory-items-reuse-quality-review-boundary",
    "data-augnes-memory-items-reuse-quality-review-summary",
    "data-augnes-memory-items-reuse-quality-review-item",
    "data-augnes-memory-items-reuse-quality-review-empty-state",
    "selected_item_count",
    "codex_memory_brief_character_count",
    "codex_memory_brief_line_count",
    "has_large_selection_warning",
    "compact_brief_recommended",
    "review_version",
    "dogfood_route_status",
    "not_applicable",
    "quality_review_preview_state",
    "reviewable_item_count",
    "needs_operator_review_count",
    "missing_why_selected_count",
    "missing_reuse_boundary_count",
    "large_selection_warning",
    "suggested_next_action",
    "relevance_review_state",
    "boundary_review_state",
    "stale_or_misleading_risk",
    "Mechanical checks only",
    "no semantic truth",
    "does not persist quality reviews",
    "data-augnes-memory-items-reuse-copy-brief",
    "data-augnes-memory-items-reuse-read-only-boundary",
    "no memory creation",
    "no persistence writes",
    "no automatic synthesis",
    "no provider/model call",
    "no Codex SDK",
    "no MCP tools",
    "no GitHub mutation",
    "method: \"GET\"",
  ]);
  assertIncludesAll(cssText, [
    ".shell",
    ".workbenchGrid",
    ".packetPanel",
    ".qualityReviewPanel",
    ".qualityReviewList",
    ".statusStrip",
    ".taskGrid",
    ".outputTextArea",
    "@media (max-width: 900px)",
    "@media (max-width: 520px)",
  ]);
  assertIncludesAll(dashboardText, [
    "Build Codex memory reuse packet",
    "Open selected item in reuse workspace",
    "PERSPECTIVE_MEMORY_REUSE_WORKSPACE_ROUTE",
    "data-augnes-memory-items-reuse-workspace-link",
    "data-augnes-memory-items-reuse-selected-item-link",
  ]);
  assertIncludesAll(searchText, [
    "Build Codex memory reuse packet",
    "Reuse this item",
    "PERSPECTIVE_MEMORY_REUSE_WORKSPACE_ROUTE",
    "data-augnes-memory-items-search-reuse-workspace-link",
    "data-augnes-memory-items-search-reuse-this-item-link",
  ]);
  assertIncludesAll(reviewText, [
    "Build Codex memory reuse packet",
    "Reuse selected items",
    "PERSPECTIVE_MEMORY_REUSE_WORKSPACE_ROUTE",
    "data-augnes-memory-items-review-reuse-workspace-link",
    "data-augnes-memory-items-review-reuse-selected-link",
  ]);
  assertNoIncludes(componentText, [
    "method: \"POST\"",
    "method: \"PATCH\"",
    "localStorage",
    "sessionStorage",
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
    "data-augnes-create-quality-review",
    "data-augnes-persist-quality-review",
    "data-augnes-write-quality-review",
    "data-augnes-quality-review-storage",
  ]);
  assertNoIncludes(helperText + componentText + qualityReviewHelperText, [
    "new OpenAI",
    "openai.chat",
    "api.openai.com",
    "OPENAI_API_KEY",
    "@openai/codex",
    "CodexSDK",
    "callMcpTool",
    "McpClient",
    "new Octokit",
    "@octokit",
    "api.github.com",
    "gh api",
    "npm run dev",
    "AUGNES_ENABLE_AGENT_BRIDGE",
    "createCoreDecision",
    "createCoreMemory",
    "runtime_handoff_created: true",
    "automatic_runtime_injection_created: true",
    "automatic_promotion_created: true",
    "quality_review_persisted: true",
    "persistence_write_created: true",
  ]);
}

function assertDocsReportsAndBoundary() {
  for (const text of [docText, reportText, briefMetadataReportText]) {
    assertIncludesAll(text, [
      "Perspective Memory Reuse Packet v0.1",
      "/cockpit/perspective/memory-items/reuse",
      "perspective_memory_reuse_packet.v0.1",
      "Codex Memory Brief",
      "intentionally not automated behavior",
      "deterministic local",
      "provider/model",
      "OpenAI API",
      "Codex SDK",
      "MCP tool",
      "GitHub mutation",
      "perspective-memory persistence",
      "DB schema",
      "proof/evidence",
      "Augnes state",
      "runtime startup",
      "hidden background daemons",
      "Next recommended PR",
    ]);
  }
  assertIncludesAll(docText, [
    "task title",
    "task description",
    "why_selected",
    "reuse_boundary",
    "Derived tags come only from existing persisted item fields",
    "Use these memories to avoid repeating closed work",
    "Do not create memory items",
    "Codex Memory Brief metadata",
    "selected_item_count",
    "codex_memory_brief_character_count",
    "codex_memory_brief_line_count",
    "has_large_selection_warning",
    "compact_brief_recommended",
    "The full Codex Memory Brief remains available",
  ]);
  assertIncludesAll(reportText, [
    "No new authority is introduced.",
    "This PR implements the reuse packet and brief portion of that loop.",
    "Browser/runtime validation is not part of this PR",
  ]);
  assertIncludesAll(briefMetadataReportText, [
    "PR #559",
    "selected count and brief length metadata",
    "The full Codex Memory Brief remains available",
    "No compact brief output is introduced in this slice.",
    "does not justify persisted return binding storage",
    "No provider/model calls",
    "No OpenAI API calls",
    "No MCP tool calls",
    "No DB schema or migrations",
    "No persistence writes",
  ]);
  assertIncludesAll(qualityReviewPanelReportText, [
    "Perspective Memory Reuse Quality Review panel",
    "/cockpit/perspective/memory-items/reuse",
    "buildPerspectiveMemoryReuseQualityReview",
    "read-only deterministic",
    "mechanical checks only",
    "no semantic truth claim",
    "dogfood_route_status: not_applicable",
    "quality_review_preview_state",
    "reviewable_item_count",
    "needs_operator_review_count",
    "missing_why_selected_count",
    "missing_reuse_boundary_count",
    "compact_brief_recommended",
    "large_selection_warning",
    "suggested_next_action",
    "No persistence/storage",
    "No DB schema",
    "No provider/model calls",
    "No OpenAI API calls",
    "No MCP tool calls",
    "No Codex SDK execution",
    "No GitHub mutation",
    "No Augnes state commit/reject authority",
    "Next recommended PR",
  ]);
}

function assertNoUnsafePayloadMarkers(text) {
  for (const marker of [
    "raw prompt",
    "hidden reasoning",
    "TOKEN=",
    "private key",
    "browser dump",
    "diff --git",
    "\n@@",
    "\n+++",
    "\n---",
  ]) {
    assert.equal(
      text.includes(marker),
      false,
      `reuse packet and brief must not include unsafe marker: ${marker}`,
    );
  }
}

function makeItem(overrides = {}) {
  return {
    item_version: itemModel.PERSPECTIVE_MEMORY_ITEM_VERSION,
    item_id: overrides.item_id ?? "perspective-memory-item:base",
    created_at: overrides.created_at ?? "2026-06-14T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2026-06-14T00:00:00.000Z",
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
      title: overrides.title ?? "Perspective memory reuse fixture",
      summary: overrides.summary ?? "Bounded persisted item summary.",
      source_refs: overrides.source_refs ?? ["source-input:fixture"],
      evidence_refs: overrides.evidence_refs ?? ["evidence:fixture"],
      risk_notes: overrides.risk_notes ?? ["0 warnings", "0 pointer warnings"],
      unresolved_tensions:
        overrides.unresolved_tensions ?? ["not captured in local queue item"],
      carry_forward_questions:
        overrides.carry_forward_questions ??
        ["Should this item be reused before deterministic synthesis?"],
      suggested_next_review_action:
        overrides.suggested_next_review_action ??
        "Review before Core-facing promotion or runtime usage.",
    },
    acceptance: {
      accepted_at: overrides.accepted_at ?? "2026-06-14T00:00:00.000Z",
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
        confirmed_at: "2026-06-14T00:00:00.000Z",
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
