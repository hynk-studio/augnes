import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const qualityReview = await import(
  "../lib/perspective-ingest/perspective-memory-reuse-quality-review.ts"
);

const packageFile = "package.json";
const helperFile =
  "lib/perspective-ingest/perspective-memory-reuse-quality-review.ts";
const docFile = "docs/PERSPECTIVE_MEMORY_REUSE_QUALITY_REVIEW_V0_1.md";
const reportFile =
  "reports/2026-06-14-perspective-memory-reuse-quality-review.md";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const helperText = readFileSync(helperFile, "utf8");
const docText = readFileSync(docFile, "utf8");
const reportText = readFileSync(reportFile, "utf8");

assertStaticFilesAndScript();
assertCompleteQualityReview();
assertIncompleteQualityReview();
assertDocsReportsAndBoundary();
assertNoForbiddenImplementationMarkers();

console.log("PASS smoke:perspective-memory-reuse-quality-review");

function assertStaticFilesAndScript() {
  for (const file of [helperFile, docFile, reportFile]) {
    assert.equal(existsSync(file), true, `${file} must exist`);
  }

  assert.equal(
    packageJson.scripts["smoke:perspective-memory-reuse-quality-review"],
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-memory-reuse-quality-review.mjs",
  );

  assertIncludesAll(helperText, [
    "PERSPECTIVE_MEMORY_REUSE_QUALITY_REVIEW_VERSION",
    "PERSPECTIVE_MEMORY_REUSE_QUALITY_REVIEW_SUMMARY_VERSION",
    "perspective_memory_reuse_quality_review.v0.1",
    "perspective_memory_reuse_quality_review_summary.v0.1",
    "buildPerspectiveMemoryReuseQualityReview",
    "buildQualityReviewSummary",
    "selected_item_count",
    "codex_memory_brief_metadata",
    "has_why_selected",
    "has_reuse_boundary",
    "relevance_review_state",
    "boundary_review_state",
    "stale_or_misleading_risk",
    "compact_brief_recommended",
    "large_selection_warning",
    "mechanical_checks_only: true",
    "quality_review_persisted: false",
  ]);
}

function assertCompleteQualityReview() {
  const result = qualityReview.buildPerspectiveMemoryReuseQualityReview({
    reuse_packet_id: "reuse-packet:560",
    task_title: "Brief metadata dogfood",
    task_description: "Judge whether the selected memories stayed useful.",
    selected_item_count: 2,
    codex_memory_brief_metadata: makeBriefMetadata({
      selected_item_count: 2,
      compact_brief_recommended: false,
      has_large_selection_warning: false,
    }),
    selected_memory_items: [
      {
        memory_item_id: "perspective-memory-item:accepted",
        title: "Accepted prior direction",
        why_selected: "preserves the no-storage boundary",
        reuse_boundary: "do not add a return binding table",
        source_ref: "report:accepted",
        validation_state: "PASS",
        item_status: "accepted",
      },
      {
        memory_item_id: "perspective-memory-item:reviewed",
        title: "Live-data harness finding",
        why_selected: "keeps the seeded-row validation context visible",
        reuse_boundary: "harness only; no default DB writes",
        source_ref: "report:harness",
        validation_state: "PASS",
        item_status: "reviewing",
      },
    ],
    return_binding_ref: "return-binding:preview",
    operator_notes: ["preview-only quality review"],
    nowIso: "2026-06-14T15:00:00.000Z",
    reviewId: "quality-review:fixture",
  });

  assert.equal(
    result.review.review_version,
    qualityReview.PERSPECTIVE_MEMORY_REUSE_QUALITY_REVIEW_VERSION,
  );
  assert.equal(result.review.review_id, "quality-review:fixture");
  assert.equal(result.review.reuse_packet_id, "reuse-packet:560");
  assert.equal(result.review.task_title, "Brief metadata dogfood");
  assert.equal(result.review.selected_item_count, 2);
  assert.equal(result.review.item_reviews.length, 2);
  assert.equal(result.review.aggregate_summary.reviewable_item_count, 2);
  assert.equal(result.review.aggregate_summary.needs_operator_review_count, 0);
  assert.equal(result.review.aggregate_summary.missing_why_selected_count, 0);
  assert.equal(result.review.aggregate_summary.missing_reuse_boundary_count, 0);
  assert.equal(result.review.aggregate_summary.compact_brief_recommended, false);
  assert.equal(result.review.aggregate_summary.large_selection_warning, false);
  assert.equal(
    result.review.aggregate_summary.suggested_next_action,
    "Mechanically reviewable; operator still decides relevance, freshness, and usefulness.",
  );

  for (const item of result.review.item_reviews) {
    assert.equal(item.has_why_selected, true);
    assert.equal(item.has_reuse_boundary, true);
    assert.equal(item.relevance_review_state, "reviewable");
    assert.equal(item.boundary_review_state, "bounded");
    assert.equal(item.stale_or_misleading_risk, "none_detected");
  }

  for (const [key, value] of Object.entries(result.review.authority_boundary)) {
    if (
      key === "deterministic_local_preview" ||
      key === "mechanical_checks_only" ||
      key === "quality_review_created"
    ) {
      assert.equal(value, true, `${key} must be true`);
    } else {
      assert.equal(value, false, `${key} must be false`);
    }
  }

  assertIncludesAll(result.quality_review_summary, [
    "# Perspective Memory Reuse Quality Review",
    "perspective_memory_reuse_quality_review_summary.v0.1",
    "reuse_packet_id: reuse-packet:560",
    "return_binding_ref: return-binding:preview",
    "compact_brief_recommended: false",
    "large_selection_warning: false",
    "reviewable_item_count: 2",
    "needs_operator_review_count: 0",
    "Mechanical checks only; no semantic truth claim.",
  ]);
}

function assertIncompleteQualityReview() {
  const result = qualityReview.buildPerspectiveMemoryReuseQualityReview({
    reuse_packet_id: "reuse-packet:incomplete",
    task_title: "Incomplete reuse notes",
    task_description: "Exercise mechanical operator-review flags.",
    selected_item_count: 3,
    codex_memory_brief_metadata: makeBriefMetadata({
      selected_item_count: 3,
      compact_brief_recommended: true,
      has_large_selection_warning: true,
    }),
    selected_memory_items: [
      {
        memory_item_id: "perspective-memory-item:missing-why",
        title: "Missing why selected",
        why_selected: "",
        reuse_boundary: "keep this local",
        source_ref: "source:missing-why",
        validation_state: "PASS",
        item_status: "accepted",
      },
      {
        memory_item_id: "perspective-memory-item:missing-boundary",
        title: "Missing reuse boundary",
        why_selected: "tests missing boundary detection",
        reuse_boundary: "",
        source_ref: "source:missing-boundary",
        validation_state: "PASS",
        item_status: "accepted",
      },
      {
        memory_item_id: "perspective-memory-item:follow-up",
        title: "Follow-up and superseded item",
        why_selected: "tests follow-up validation flag",
        reuse_boundary: "operator should review freshness",
        source_ref: "source:follow-up",
        validation_state: "PASS with follow-up",
        item_status: "superseded",
      },
    ],
    operator_notes: ["uncertain reuse quality"],
    nowIso: "2026-06-14T15:01:00.000Z",
  });

  assert.equal(result.review.aggregate_summary.reviewable_item_count, 0);
  assert.equal(result.review.aggregate_summary.needs_operator_review_count, 3);
  assert.equal(result.review.aggregate_summary.missing_why_selected_count, 1);
  assert.equal(result.review.aggregate_summary.missing_reuse_boundary_count, 1);
  assert.equal(result.review.aggregate_summary.compact_brief_recommended, true);
  assert.equal(result.review.aggregate_summary.large_selection_warning, true);
  assert.equal(
    result.review.aggregate_summary.suggested_next_action,
    "Operator review required before treating reuse as high-quality.",
  );

  const missingWhy = result.review.item_reviews[0];
  assert.equal(missingWhy.has_why_selected, false);
  assert.equal(missingWhy.relevance_review_state, "needs_operator_review");
  assertIncludesAll(missingWhy.review_notes.join("\n"), [
    "missing why_selected",
    "operator should judge relevance",
  ]);

  const missingBoundary = result.review.item_reviews[1];
  assert.equal(missingBoundary.has_reuse_boundary, false);
  assert.equal(missingBoundary.boundary_review_state, "needs_operator_review");
  assertIncludesAll(missingBoundary.review_notes.join("\n"), [
    "missing reuse_boundary",
    "operator should judge boundary",
  ]);

  const followUp = result.review.item_reviews[2];
  assert.equal(followUp.relevance_review_state, "needs_operator_review");
  assert.equal(followUp.stale_or_misleading_risk, "needs_operator_review");
  assertIncludesAll(followUp.review_notes.join("\n"), [
    "validation state needs review: PASS with follow-up",
    "item status may be stale or misleading: superseded",
  ]);

  assertIncludesAll(result.quality_review_summary, [
    "compact_brief_recommended: true",
    "large_selection_warning: true",
    "missing_why_selected_count: 1",
    "missing_reuse_boundary_count: 1",
    "stale_or_misleading_risk: needs_operator_review",
  ]);
}

function assertDocsReportsAndBoundary() {
  for (const text of [docText, reportText]) {
    assertIncludesAll(text, [
      "Perspective Memory Reuse Quality Review v0.1",
      "perspective_memory_reuse_quality_review.v0.1",
      "perspective_memory_reuse_quality_review_summary.v0.1",
      "deterministic local",
      "preview-only",
      "mechanical checks only",
      "does not claim semantic truth",
      "missing why_selected",
      "missing reuse_boundary",
      "PASS with follow-up",
      "deprecated",
      "retracted",
      "superseded",
      "compact_brief_recommended",
      "large_selection_warning",
      "no persistence",
      "no provider/model",
      "OpenAI API",
      "Codex SDK",
      "MCP tool",
      "GitHub mutation",
      "DB schema",
      "quality review persistence",
      "Augnes state commit/reject authority",
      "does not justify storage",
      "Next recommended PR",
    ]);
  }
}

function assertNoForbiddenImplementationMarkers() {
  assertNoIncludes(helperText, [
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
    "better-sqlite3",
    "insert into",
    "update ",
    "delete from",
    "create table",
    "alter table",
    "npm run dev",
    "AUGNES_ENABLE_AGENT_BRIDGE",
    "createCoreDecision",
    "createCoreMemory",
    "runtime_handoff_created: true",
    "automatic_runtime_injection_created: true",
    "automatic_promotion_created: true",
    "provider_model_call_created: true",
    "openai_api_call_created: true",
    "codex_sdk_execution_created: true",
    "mcp_tool_call_created: true",
    "github_mutation_created: true",
    "quality_review_persisted: true",
  ]);
}

function makeBriefMetadata(overrides = {}) {
  return {
    selected_item_count: overrides.selected_item_count ?? 1,
    codex_memory_brief_character_count:
      overrides.codex_memory_brief_character_count ?? 1200,
    codex_memory_brief_line_count: overrides.codex_memory_brief_line_count ?? 30,
    has_large_selection_warning: overrides.has_large_selection_warning ?? false,
    compact_brief_recommended: overrides.compact_brief_recommended ?? false,
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
