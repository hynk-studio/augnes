import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

const { buildCodexFormerConstellationPreviewData } = await import(
  "../lib/perspective-ingest/perspective-codex-former-constellation-preview-data-adapter.ts"
);

export const CODEX_FORMER_CONSTELLATION_PREVIEW_DATA_ADAPTER_GENERATED_AT =
  "2026-06-10T00:00:00.000Z";
export const CODEX_FORMER_CONSTELLATION_PREVIEW_DATA_ADAPTER_DOC_PATH =
  "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PREVIEW_DATA_ADAPTER_V0_1.md";
export const CODEX_FORMER_CONSTELLATION_PREVIEW_DATA_ADAPTER_REPORT_PATH =
  "reports/2026-06-10-perspective-codex-former-constellation-preview-data-adapter.md";
export const CODEX_FORMER_CONSTELLATION_PASS_PROJECTION_FIXTURE_PATH =
  "reports/fixtures/2026-06-10-codex-former-constellation-pass-with-follow-up.json";
export const CODEX_FORMER_CONSTELLATION_BLOCKED_PROJECTION_FIXTURE_PATH =
  "reports/fixtures/2026-06-10-codex-former-constellation-blocked.json";
export const CODEX_FORMER_CONSTELLATION_PASS_PREVIEW_DATA_FIXTURE_PATH =
  "reports/fixtures/2026-06-10-codex-former-constellation-preview-data-pass-with-follow-up.json";
export const CODEX_FORMER_CONSTELLATION_BLOCKED_PREVIEW_DATA_FIXTURE_PATH =
  "reports/fixtures/2026-06-10-codex-former-constellation-preview-data-blocked.json";
export const CODEX_FORMER_CONSTELLATION_PREVIEW_DATA_RECOMMENDED_NEXT_PR =
  "Add read-only Constellation Preview fixture surface design";

const noBrowserComputerUseReason =
  "No browser/computer-use validation was run because no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.";
const authorityBoundary =
  "This preview data adapter is read-only. It transforms existing projection JSON into a future UI read model and does not create accepted Augnes state, proof/evidence/readiness records, provider/model calls, Codex SDK calls, DB writes, GitHub mutations, UI, approvals, merges, deploys, or Core decisions.";

export function buildPerspectiveCodexFormerConstellationPreviewDataAdapter() {
  const passProjection = readJsonFile(
    CODEX_FORMER_CONSTELLATION_PASS_PROJECTION_FIXTURE_PATH,
  );
  const blockedProjection = readJsonFile(
    CODEX_FORMER_CONSTELLATION_BLOCKED_PROJECTION_FIXTURE_PATH,
  );
  const passPreviewData = buildCodexFormerConstellationPreviewData({
    generated_at: CODEX_FORMER_CONSTELLATION_PREVIEW_DATA_ADAPTER_GENERATED_AT,
    projection: passProjection,
    preview_context: {
      surface_label: "Codex Former constellation preview data",
      intended_surface: "constellation_preview",
    },
  });
  const blockedPreviewData = buildCodexFormerConstellationPreviewData({
    generated_at: CODEX_FORMER_CONSTELLATION_PREVIEW_DATA_ADAPTER_GENERATED_AT,
    projection: blockedProjection,
    preview_context: {
      surface_label: "Codex Former constellation preview data",
      intended_surface: "constellation_preview",
    },
  });
  const report = renderReport({
    blockedPreviewData,
    passPreviewData,
  });

  return {
    blocked_preview_data: blockedPreviewData,
    pass_preview_data: passPreviewData,
    paths: {
      blocked_projection_fixture:
        CODEX_FORMER_CONSTELLATION_BLOCKED_PROJECTION_FIXTURE_PATH,
      blocked_preview_data:
        CODEX_FORMER_CONSTELLATION_BLOCKED_PREVIEW_DATA_FIXTURE_PATH,
      doc: CODEX_FORMER_CONSTELLATION_PREVIEW_DATA_ADAPTER_DOC_PATH,
      pass_projection_fixture:
        CODEX_FORMER_CONSTELLATION_PASS_PROJECTION_FIXTURE_PATH,
      pass_preview_data:
        CODEX_FORMER_CONSTELLATION_PASS_PREVIEW_DATA_FIXTURE_PATH,
      report: CODEX_FORMER_CONSTELLATION_PREVIEW_DATA_ADAPTER_REPORT_PATH,
    },
    report,
    source_projection_fixtures: {
      blocked: blockedProjection,
      pass_with_follow_up: passProjection,
    },
  };
}

export function runPerspectiveCodexFormerConstellationPreviewDataAdapter() {
  const previewData = buildPerspectiveCodexFormerConstellationPreviewDataAdapter();
  writeJsonFile(
    previewData.paths.pass_preview_data,
    previewData.pass_preview_data,
  );
  writeJsonFile(
    previewData.paths.blocked_preview_data,
    previewData.blocked_preview_data,
  );
  writeTextFile(previewData.paths.report, previewData.report);
  console.log(`wrote ${previewData.paths.pass_preview_data}`);
  console.log(`wrote ${previewData.paths.blocked_preview_data}`);
  console.log(`wrote ${previewData.paths.report}`);
  console.log(
    `pass_preview_nodes=${previewData.pass_preview_data.graph.nodes.length}`,
  );
  console.log(
    `pass_preview_edges=${previewData.pass_preview_data.graph.edges.length}`,
  );
  console.log(
    `blocked_preview_nodes=${previewData.blocked_preview_data.graph.nodes.length}`,
  );
  console.log(
    `blocked_preview_edges=${previewData.blocked_preview_data.graph.edges.length}`,
  );
  console.log("conclusion=PASS with follow-up");
  return previewData;
}

function renderReport({ blockedPreviewData, passPreviewData }) {
  return `# Perspective Codex Former Constellation Preview Data Adapter

Conclusion: PASS with follow-up.

## Summary

This report records the read-only Codex Former constellation preview data adapter and deterministic adapted fixture artifacts. The adapter transforms PR #500 projection fixture JSON into a future UI read model without rendering UI.

## Why Follows PR #500

PR #500 added deterministic PASS with follow-up and BLOCKED projection fixture previews and recommended the next PR: Add read-only Codex Former constellation preview data adapter. This PR follows that recommendation by adapting the committed projection fixtures into compact display data, warning panels, Authority Lens data, detail drawers, and legends.

## Adapter Scope

The adapter is data-only. It accepts an existing projection object, copies it, derives preview data, and returns a new object. It does not mutate the projection, write state, render UI, add a route, or create accepted Augnes state.

## Preview Data Shape

The preview data includes:

- source projection summary
- display policy
- graph nodes and edges
- summary panel
- warning panel
- Authority Lens
- detail drawers
- legend
- privacy and authority flags

## PASS with follow-up Adapted Fixture

- fixture: ${CODEX_FORMER_CONSTELLATION_PASS_PREVIEW_DATA_FIXTURE_PATH}
- overall_status: ${passPreviewData.summary_panel.overall_status}
- graph nodes: ${passPreviewData.graph.nodes.length}
- graph edges: ${passPreviewData.graph.edges.length}
- review_candidate display node: ${hasNodeKind(passPreviewData, "review_candidate")}
- worker_guidance display node: ${hasNodeKind(passPreviewData, "worker_guidance")}
- next_action display node: ${hasNodeKind(passPreviewData, "next_action")}
- pointer warning pressure: ${passPreviewData.warning_panel.has_pointer_warnings}
- is_review_only: ${passPreviewData.summary_panel.is_review_only}
- is_accepted_state: ${passPreviewData.summary_panel.is_accepted_state}

## BLOCKED Adapted Fixture

- fixture: ${CODEX_FORMER_CONSTELLATION_BLOCKED_PREVIEW_DATA_FIXTURE_PATH}
- overall_status: ${blockedPreviewData.summary_panel.overall_status}
- graph nodes: ${blockedPreviewData.graph.nodes.length}
- graph edges: ${blockedPreviewData.graph.edges.length}
- validation_summary display node: ${hasNodeKind(blockedPreviewData, "validation_summary")}
- review_candidate display node: ${hasNodeKind(blockedPreviewData, "review_candidate")}
- worker_guidance display node: ${hasNodeKind(blockedPreviewData, "worker_guidance")}
- next_action display node: ${hasNodeKind(blockedPreviewData, "next_action")}
- blocking warnings: ${blockedPreviewData.warning_panel.has_blocking_warnings}

## Warning Grouping

The adapter keeps graph nodes one-to-one with projection nodes while grouping warning pressure in the warning panel. PASS with follow-up groups pointer warning pressure without making the graph blocked. BLOCKED groups blocking reasons separately from review warnings so future UI can show the block compactly.

## Authority Lens

Authority Lens data is separate from default graph labels. It includes compact tags such as review_only, non_committed, pointer_only, blocked, provenance_mismatch, no_accepted_state, no_db_write, no_provider_call, no_codex_sdk_call, no_github_mutation, and no_core_decision.

## Detail Drawer Payloads

Detail drawers are generated for summary, warning panel, Authority Lens, every display node, and every display edge. Rows expose bounded provenance refs, detail refs, source hashes, candidate count, metadata match, warning summaries, blocked reasons, validation status, privacy status, and false authority flags.

## Privacy/Redaction Handling

The adapted fixtures preserve raw_payloads_included false and bounded_summaries_only true. The adapter uses bounded strings and does not include raw private/source/provider payload examples.

## Authority Boundary

${authorityBoundary}

## Verification

The dogfood script writes deterministic adapted preview-data JSON from the PR #500 projection fixtures. The smoke verifies package scripts, adapter exports, fixture determinism, graph shape, display nodes and edges, warning grouping, Authority Lens tags, detail drawers, privacy, authority flags, changed-file scope, and absence of forbidden implementation surfaces.

## Skipped Checks With Reasons

- Browser/computer-use validation: ${noBrowserComputerUseReason}
- Runtime UI validation: Not applicable because no UI, route, browser-visible surface, clipboard automation, or interactive product surface was added.
- Provider/model, Codex SDK, DB, and GitHub mutation checks: Not applicable because this PR adds no such integration behavior.

## Recommended Next PR

${CODEX_FORMER_CONSTELLATION_PREVIEW_DATA_RECOMMENDED_NEXT_PR}

## What Codex Did Not Do

Codex did not implement UI, routes, runtime browser surfaces, DB persistence, provider/model calls, Codex SDK calls, GitHub mutation behavior, clipboard automation, accepted Augnes state, proof/evidence/readiness records, approvals, merges, deploys, or Core decisions.
`;
}

function hasNodeKind(previewData, nodeKind) {
  return previewData.graph.nodes.some((node) => node.kind === nodeKind);
}

function readJsonFile(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function writeJsonFile(filePath, value) {
  writeTextFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeTextFile(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, value, "utf8");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPerspectiveCodexFormerConstellationPreviewDataAdapter();
}
