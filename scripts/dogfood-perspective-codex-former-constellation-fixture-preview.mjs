import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";

const { buildCodexFormerConstellationProjection } = await import(
  "../lib/perspective-ingest/perspective-codex-former-constellation-projection.ts"
);

export const CODEX_FORMER_CONSTELLATION_FIXTURE_PREVIEW_GENERATED_AT =
  "2026-06-10T00:00:00.000Z";
export const CODEX_FORMER_CONSTELLATION_FIXTURE_PREVIEW_DOC_PATH =
  "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_FIXTURE_PREVIEW_V0_1.md";
export const CODEX_FORMER_CONSTELLATION_FIXTURE_PREVIEW_REPORT_PATH =
  "reports/2026-06-10-perspective-codex-former-constellation-fixture-preview.md";
export const CODEX_FORMER_CONSTELLATION_PASS_FIXTURE_PATH =
  "reports/fixtures/2026-06-10-codex-former-constellation-pass-with-follow-up.json";
export const CODEX_FORMER_CONSTELLATION_BLOCKED_FIXTURE_PATH =
  "reports/fixtures/2026-06-10-codex-former-constellation-blocked.json";
export const CODEX_FORMER_CONSTELLATION_FIXTURE_PREVIEW_RECOMMENDED_NEXT_PR =
  "Add read-only Codex Former constellation preview data adapter";

const noBrowserComputerUseReason =
  "No browser/computer-use validation was run because no UI, route, browser-visible surface, clipboard automation, or browser/computer-use capture was added.";
const authorityBoundary =
  "This fixture preview is read-only review data. It does not create accepted Augnes state, proof/evidence/readiness records, provider/model calls, Codex SDK calls, DB writes, GitHub mutations, UI, approvals, merges, deploys, or Core decisions.";

export const passWithFollowUpFixtureInput = {
  generated_at: CODEX_FORMER_CONSTELLATION_FIXTURE_PREVIEW_GENERATED_AT,
  capture_source_kind: "bounded_source_input_file",
  source_input_hash: "fixture-hash:pass-with-follow-up-source-input",
  source_prompt_hash: "fixture-hash:pass-with-follow-up-prompt",
  metadata_match: true,
  candidate_count: 1,
  conclusion: "PASS with follow-up",
  direct_validation_status: "needs_review",
  candidate_authority: "non_committed",
  candidate_basis_quality: "needs_review",
  pointer_warning_count: 1,
  warning_summary: ["Pointer warning remains visible for human review."],
  blocked_reasons: [],
  source_pr_refs: ["pr:hynk-studio/augnes#499"],
  changed_files: [
    "lib/perspective-ingest/perspective-codex-former-constellation-projection.ts",
    "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PROJECTION_V0_1.md",
  ],
  next_action_summaries: [
    "Add a read-only fixture preview adapter before UI work.",
  ],
};

export const blockedFixtureInput = {
  generated_at: CODEX_FORMER_CONSTELLATION_FIXTURE_PREVIEW_GENERATED_AT,
  capture_source_kind: "bounded_source_input_file",
  source_input_hash: "fixture-hash:blocked-source-input",
  source_prompt_hash: "fixture-hash:blocked-prompt",
  metadata_match: false,
  candidate_count: 2,
  conclusion: "BLOCKED with useful findings",
  direct_validation_status: "blocked",
  candidate_authority: "none",
  candidate_basis_quality: "blocked",
  pointer_warning_count: 0,
  warning_summary: [
    "Returned material cannot be used until provenance is corrected.",
  ],
  blocked_reasons: [
    "Metadata does not match the prepared packet.",
    "Multiple candidate drafts were returned.",
  ],
  source_pr_refs: ["pr:hynk-studio/augnes#499"],
  changed_files: [
    "docs/PERSPECTIVE_CODEX_FORMER_CONSTELLATION_PROJECTION_V0_1.md",
  ],
  next_action_summaries: [],
};

export function buildPerspectiveCodexFormerConstellationFixturePreview() {
  const passWithFollowUpProjection =
    buildCodexFormerConstellationProjection(passWithFollowUpFixtureInput);
  const blockedProjection =
    buildCodexFormerConstellationProjection(blockedFixtureInput);
  const report = renderReport({
    passWithFollowUpProjection,
    blockedProjection,
  });

  return {
    blocked_fixture: blockedProjection,
    pass_with_follow_up_fixture: passWithFollowUpProjection,
    paths: {
      blocked_fixture: CODEX_FORMER_CONSTELLATION_BLOCKED_FIXTURE_PATH,
      doc: CODEX_FORMER_CONSTELLATION_FIXTURE_PREVIEW_DOC_PATH,
      pass_with_follow_up_fixture:
        CODEX_FORMER_CONSTELLATION_PASS_FIXTURE_PATH,
      report: CODEX_FORMER_CONSTELLATION_FIXTURE_PREVIEW_REPORT_PATH,
    },
    report,
  };
}

export function runPerspectiveCodexFormerConstellationFixturePreview() {
  const preview = buildPerspectiveCodexFormerConstellationFixturePreview();
  writeJsonFile(
    preview.paths.pass_with_follow_up_fixture,
    preview.pass_with_follow_up_fixture,
  );
  writeJsonFile(preview.paths.blocked_fixture, preview.blocked_fixture);
  writeTextFile(preview.paths.report, preview.report);
  console.log(`wrote ${preview.paths.pass_with_follow_up_fixture}`);
  console.log(`wrote ${preview.paths.blocked_fixture}`);
  console.log(`wrote ${preview.paths.report}`);
  console.log(
    `pass_with_follow_up_nodes=${preview.pass_with_follow_up_fixture.nodes.length}`,
  );
  console.log(
    `pass_with_follow_up_edges=${preview.pass_with_follow_up_fixture.edges.length}`,
  );
  console.log(`blocked_nodes=${preview.blocked_fixture.nodes.length}`);
  console.log(`blocked_edges=${preview.blocked_fixture.edges.length}`);
  console.log("conclusion=PASS with follow-up");
  return preview;
}

function renderReport({ passWithFollowUpProjection, blockedProjection }) {
  const passNodeKinds = summarizeNodeKinds(passWithFollowUpProjection);
  const passEdgeRelations = summarizeEdgeRelations(passWithFollowUpProjection);
  const blockedNodeKinds = summarizeNodeKinds(blockedProjection);
  const blockedEdgeRelations = summarizeEdgeRelations(blockedProjection);

  return `# Perspective Codex Former Constellation Fixture Preview

Conclusion: PASS with follow-up.

## Summary

This report records deterministic Codex Former constellation projection fixture preview artifacts for future Constellation Preview work. The fixture preview is read-only, uses sanitized local fixture inputs, and writes review-only projection JSON artifacts.

## Why Follows PR #499

PR #499 defined the read-only Codex Former constellation projection contract and recommended the next PR: Add Codex Former constellation projection fixture preview. This slice exercises that projection contract with committed PASS with follow-up and BLOCKED fixtures without changing the projection builder.

## Fixture Preview Scope

The fixture preview is data-level material, not a visual UI. It shows which nodes and edges appear, which compact badges future UI would see, which authority boundaries are present, how PASS with follow-up differs from BLOCKED, and which detail-drawer fields future UI should expose.

Generated artifacts:

- ${CODEX_FORMER_CONSTELLATION_PASS_FIXTURE_PATH}
- ${CODEX_FORMER_CONSTELLATION_BLOCKED_FIXTURE_PATH}

## PASS with follow-up Fixture Summary

- overall_status: ${passWithFollowUpProjection.status_summary.overall_status}
- nodes: ${passWithFollowUpProjection.nodes.length} (${passNodeKinds})
- edges: ${passWithFollowUpProjection.edges.length} (${passEdgeRelations})
- review_candidate node: ${hasNodeKind(passWithFollowUpProjection, "review_candidate")}
- worker_guidance node: ${hasNodeKind(passWithFollowUpProjection, "worker_guidance")}
- next_action node: ${hasNodeKind(passWithFollowUpProjection, "next_action")}
- warning node: ${hasNodeKind(passWithFollowUpProjection, "warning")}
- candidate authority: non_committed
- review_only: ${passWithFollowUpProjection.authority_summary.review_only}

## BLOCKED Fixture Summary

- overall_status: ${blockedProjection.status_summary.overall_status}
- nodes: ${blockedProjection.nodes.length} (${blockedNodeKinds})
- edges: ${blockedProjection.edges.length} (${blockedEdgeRelations})
- validation_summary node: ${hasNodeKind(blockedProjection, "validation_summary")}
- warning node: ${hasNodeKind(blockedProjection, "warning")}
- blocked_by edge: ${hasEdgeRelation(blockedProjection, "blocked_by")}
- review_candidate node: ${hasNodeKind(blockedProjection, "review_candidate")}
- worker_guidance node: ${hasNodeKind(blockedProjection, "worker_guidance")}
- next_action node: ${hasNodeKind(blockedProjection, "next_action")}

## Node/Edge Readability Notes

The PASS with follow-up fixture stays small enough for a first graph preview while still showing the full path from source input through review candidate, worker guidance, and next action. The BLOCKED fixture keeps the graph shorter by stopping at validation summary and blocking warnings, so future UI can compare usable review-only material against blocked material without implying acceptance.

Every node uses at most two primary badges. Edges reference explicit node ids and use only the PR #499 relation taxonomy. Detail refs carry bounded summaries, changed-file references, hashes, and provenance pointers intended for a future detail drawer rather than default graph labels.

## Authority Boundary

${authorityBoundary}

The projection artifacts are review-only preview data. The fixture preview is not accepted-state automation.

## Privacy/Redaction Handling

The fixtures use bounded summaries only and contain no raw private/source/provider payload examples. The generated projection privacy fields keep raw_payloads_included false and bounded_summaries_only true.

## Verification

The generator writes deterministic projection JSON from the PR #499 builder. The paired smoke verifies package scripts, artifact existence, projection version and kind, fixture graph readability, authority flags, privacy/redaction boundaries, and changed-file scope.

## Skipped Checks With Reasons

- Browser/computer-use validation: ${noBrowserComputerUseReason}
- Runtime UI validation: Not applicable because no UI, route, browser-visible surface, clipboard automation, or interactive product surface was added.
- Provider/model, Codex SDK, DB, and GitHub mutation checks: Not applicable because this PR adds no such integration behavior.

## Recommended Next PR

${CODEX_FORMER_CONSTELLATION_FIXTURE_PREVIEW_RECOMMENDED_NEXT_PR}

## What Codex Did Not Do

Codex did not implement UI, routes, runtime browser surfaces, DB persistence, provider/model calls, Codex SDK calls, GitHub mutation behavior, clipboard automation, accepted Augnes state, proof/evidence/readiness records, approvals, merges, deploys, or Core decisions.
`;
}

function summarizeNodeKinds(projection) {
  return [...new Set(projection.nodes.map((node) => node.node_kind))]
    .sort()
    .join(", ");
}

function summarizeEdgeRelations(projection) {
  return [...new Set(projection.edges.map((edge) => edge.relation))]
    .sort()
    .join(", ");
}

function hasNodeKind(projection, nodeKind) {
  return projection.nodes.some((node) => node.node_kind === nodeKind);
}

function hasEdgeRelation(projection, relation) {
  return projection.edges.some((edge) => edge.relation === relation);
}

function writeJsonFile(filePath, value) {
  writeTextFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeTextFile(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, value, "utf8");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPerspectiveCodexFormerConstellationFixturePreview();
}
