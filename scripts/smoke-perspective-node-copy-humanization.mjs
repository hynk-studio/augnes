import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const packageFile = "package.json";
const builderFile = "lib/perspective-ingest/episode-to-constellation-packet.ts";
const unitPreviewBuilderFile =
  "lib/perspective-ingest/perspective-unit-preview.ts";
const cockpitFile = "components/augnes-cockpit.tsx";
const docFile = "docs/PERSPECTIVE_NODE_COPY_HUMANIZATION_V0_1.md";
const smokeFile = "scripts/smoke-perspective-node-copy-humanization.mjs";
const browserReportFile =
  "reports/browser/2026-06-07-perspective-node-copy-humanization.md";
const chatGptFixtureFile =
  "fixtures/perspective-ingest/chatgpt-record-to-constellation.sample.v0.1.json";
const codexFixtureFile =
  "fixtures/perspective-ingest/codex-record-to-constellation.sample.v0.1.json";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const builder = readFileSync(builderFile, "utf8");
const unitPreviewBuilder = readFileSync(unitPreviewBuilderFile, "utf8");
const cockpit = readFileSync(cockpitFile, "utf8");
const doc = readFileSync(docFile, "utf8");
const {
  buildPerspectiveIngestConstellationPreviewResponse,
} = await import("../lib/perspective-ingest/episode-to-constellation-packet.ts");

const allowedChangedFiles = new Set([
  "app/globals.css",
  builderFile,
  cockpitFile,
  "lib/perspective-ingest/perspective-agent-brief.ts",
  "lib/perspective-ingest/perspective-temporal-spatial-map.ts",
  "lib/perspective-ingest/perspective-workbench-projection.ts",
  packageFile,
  docFile,
  "docs/PERSPECTIVE_TEMPORAL_SPATIAL_PROJECTION_BUILDERS_V0_1.md",
  "docs/PERSPECTIVE_WORKBENCH_TEMPORAL_UNDERLAY_V0_1.md",
  smokeFile,
  browserReportFile,
  "reports/browser/2026-06-07-perspective-workbench-temporal-underlay.md",
  "reports/2026-06-07-perspective-temporal-spatial-projection-builders.md",
  "scripts/smoke-perspective-ingest-constellation-preview.mjs",
  "scripts/smoke-perspective-ingest-local-pasted-text-preview.mjs",
  "scripts/smoke-perspective-capsule-contract.mjs",
  "scripts/smoke-cockpit-perspective-authority-copy-collapse.mjs",
  "scripts/smoke-cockpit-perspective-event-rail-node-edge.mjs",
  "scripts/smoke-cockpit-perspective-event-rail-entry-cards.mjs",
  "scripts/smoke-cockpit-perspective-formation-switch-overlay.mjs",
  "scripts/smoke-cockpit-perspective-observatory-layout.mjs",
  "scripts/smoke-cockpit-perspective-ia-core.mjs",
  "scripts/smoke-cockpit-perspective-overlay-focus-agent-semantics.mjs",
  "scripts/smoke-cockpit-perspective-primary-advanced-diagnostics-collapse.mjs",
  "scripts/smoke-cockpit-perspective-scope-handler-cleanup.mjs",
  "scripts/smoke-perspective-handoff-packet-structure-review.mjs",
  "scripts/smoke-perspective-handoff-packet-copy-to-agent-dogfood.mjs",
  "scripts/smoke-perspective-temporal-spatial-projection-builders.mjs",
  "scripts/smoke-cockpit-perspective-workbench-temporal-underlay.mjs",
]);

assert.equal(
  packageJson.scripts["smoke:perspective-node-copy-humanization"],
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-node-copy-humanization.mjs",
  "package.json must register smoke:perspective-node-copy-humanization",
);

assert.equal(existsSync(docFile), true, "node copy humanization doc must exist");
assertContainsAll(doc, [
  "# Perspective Node Copy Humanization v0.1",
  "humanizes visible Perspective node labels and summaries",
  "changes copy only, not graph topology or authority",
  "Node ids, node types, edge ids, and edge types remain stable",
  "ChatGPT fixture node labels and summaries now read as user-facing explanations",
  "Codex fixture node labels and summaries now read as reviewer-facing explanations",
  "Manual pasted text generic labels may be improved without storing raw text",
  "The handoff packet structure remains stable",
  "compact authority capsule from PR #444 remains unchanged",
  "Event Rail node-edge model from PR #445 remains unchanged",
  "adds no API routes, DB schema, migrations, persistence, graph DB behavior, provider/model/API calls, GitHub mutation, Codex execution, proof/evidence/readiness writes, Auto Proposal behavior, historical snapshot persistence, or delta engine",
]);

const chatGptPreview = buildPerspectiveIngestConstellationPreviewResponse({
  episodes: [normalizeFixture(JSON.parse(readFileSync(chatGptFixtureFile, "utf8")))],
  source: "sample:chatgpt",
});
const codexPreview = buildPerspectiveIngestConstellationPreviewResponse({
  episodes: [normalizeFixture(JSON.parse(readFileSync(codexFixtureFile, "utf8")))],
  source: "sample:codex",
});
const manualPreview = buildPerspectiveIngestConstellationPreviewResponse({
  episodes: [buildManualSmokeEpisode()],
  routeId: "augnes.read.perspective-ingest-local-preview.v0.1",
  source: "manual:pasted_text",
});

assertNodeCopy(chatGptPreview, [
  ["node.sample_chatgpt.source", "source", "Sample ChatGPT record", "A public-safe sample conversation used to preview how Augnes can turn work history into a local constellation graph."],
  ["node.sample_chatgpt.user_intent", "user_intent", "What the user wants", "Show how ChatGPT/Codex history could become inspectable nodes, edges, tensions, and copyable review packets."],
  ["node.sample_chatgpt.product_concept", "product_concept", "Preview concept", "Turn ChatGPT/Codex records into a local constellation preview with typed relationships, visible tensions, and copyable ChatGPT/Codex handoff packets."],
  ["node.sample_chatgpt.decision", "decision", "Safe fixture decision", "Start with deterministic public-safe fixtures before supporting real user-provided import paths."],
  ["node.sample_chatgpt.unresolved_tension", "unresolved_tension", "Known limitation", "Real history import and durable graph storage remain separate future work, so this preview must stay clearly bounded."],
  ["node.sample_chatgpt.next_move", "next_move", "Suggested next step", "Review the fixture graph in Cockpit, then decide the next local manual import slice."],
  ["node.sample_chatgpt.packet", "packet", "Review / Codex packets", "Use the selected graph material to copy a ChatGPT review packet or Codex handoff packet for user-reviewed follow-up."],
]);

assertNodeCopy(codexPreview, [
  ["node.sample_codex.source", "source", "Sample Codex record", "A public-safe sample closeout showing how implementation work can be reviewed as a local constellation graph."],
  ["node.sample_codex.work_unit", "work_unit", "Implementation work", "The bounded work completed in the sample Codex session, kept as reviewer context rather than execution authority."],
  ["node.sample_codex.changed_files", "changed_files", "Changed files", "The files changed by the sample work, shown so reviewers can inspect the intended code boundary."],
  ["node.sample_codex.validation", "validation", "Validation results", "The checks reported for the sample work, presented as review context and not new proof/evidence writes."],
  ["node.sample_codex.blocker_risk", "blocker_risk", "Blockers / risks", "The remaining risks or limits that qualify the sample work before any next slice."],
  ["node.sample_codex.final_report", "final_report", "Final report", "The closeout items a reviewer would expect from the sample Codex work."],
  ["node.sample_codex.next_move", "next_move", "Suggested next step", "The advisory follow-up a reviewer could consider after inspecting the sample work."],
]);

assertNodeCopy(manualPreview, [
  ["node.manual_pasted_text.source", "source", "Pasted source text"],
  ["node.manual_pasted_text.user_intent", "user_intent", "What the user wants"],
  ["node.manual_pasted_text.concept", "product_concept", "Preview concept"],
  ["node.manual_pasted_text.decision", "decision", "Decision"],
  ["node.manual_pasted_text.tension", "unresolved_tension", "Known limitation"],
  ["node.manual_pasted_text.next_move", "next_move", "Suggested next step"],
  ["node.manual_pasted_text.packet", "packet", "Review / Codex packets"],
]);

assert.equal(
  findNode(chatGptPreview, "node.sample_chatgpt.product_concept").summary,
  "Turn ChatGPT/Codex records into a local constellation preview with typed relationships, visible tensions, and copyable ChatGPT/Codex handoff packets.",
  "ChatGPT product_concept summary must be sentence-style, not tag-cloud copy",
);
assert.equal(
  findNode(chatGptPreview, "node.sample_chatgpt.product_concept").summary.includes(
    "Project Constellation nodes and typed edges Perspective Capsule preview Cockpit SVG constellation preview Manual ChatGPT and Codex packets",
  ),
  false,
  "generated product_concept summary must not use old tag-cloud text",
);

assertEdgeContracts(chatGptPreview, [
  ["edge.sample_chatgpt.source.to.user_intent", "derived_from", "node.sample_chatgpt.source", "node.sample_chatgpt.user_intent"],
  ["edge.sample_chatgpt.user_intent.to.product_concept", "refines", "node.sample_chatgpt.user_intent", "node.sample_chatgpt.product_concept"],
  ["edge.sample_chatgpt.product_concept.to.decision", "supports", "node.sample_chatgpt.product_concept", "node.sample_chatgpt.decision"],
  ["edge.sample_chatgpt.decision.to.unresolved_tension", "conflicts_with", "node.sample_chatgpt.decision", "node.sample_chatgpt.unresolved_tension"],
  ["edge.sample_chatgpt.unresolved_tension.to.next_move", "warns_against", "node.sample_chatgpt.unresolved_tension", "node.sample_chatgpt.next_move"],
  ["edge.sample_chatgpt.decision.to.next_move", "next_candidate", "node.sample_chatgpt.decision", "node.sample_chatgpt.next_move"],
  ["edge.sample_chatgpt.next_move.to.packet", "depends_on", "node.sample_chatgpt.next_move", "node.sample_chatgpt.packet"],
  ["edge.sample_chatgpt.source.to.packet", "evidence_for", "node.sample_chatgpt.source", "node.sample_chatgpt.packet"],
]);
assertEdgeContracts(codexPreview, [
  ["edge.sample_codex.source.to.work_unit", "derived_from", "node.sample_codex.source", "node.sample_codex.work_unit"],
  ["edge.sample_codex.work_unit.to.changed_files", "supports", "node.sample_codex.work_unit", "node.sample_codex.changed_files"],
  ["edge.sample_codex.changed_files.to.validation", "validates", "node.sample_codex.changed_files", "node.sample_codex.validation"],
  ["edge.sample_codex.validation.to.final_report", "supports", "node.sample_codex.validation", "node.sample_codex.final_report"],
  ["edge.sample_codex.blocker_risk.to.next_move", "warns_against", "node.sample_codex.blocker_risk", "node.sample_codex.next_move"],
  ["edge.sample_codex.final_report.to.next_move", "next_candidate", "node.sample_codex.final_report", "node.sample_codex.next_move"],
  ["edge.sample_codex.source.to.final_report", "evidence_for", "node.sample_codex.source", "node.sample_codex.final_report"],
  ["edge.sample_codex.work_unit.to.next_move", "depends_on", "node.sample_codex.work_unit", "node.sample_codex.next_move"],
]);

assertContainsAll(chatGptPreview.chatgpt_rendering_packet.packet_text, [
  "Sample ChatGPT record (source)",
  "What the user wants (user_intent)",
  "Preview concept (product_concept)",
  "Review / Codex packets (packet)",
]);
assertContainsAll(chatGptPreview.codex_handoff_packet.packet_text, [
  "Graph summary:",
  "7 nodes and 8 edges from sample:chatgpt.",
]);

assertContainsAll(unitPreviewBuilder, [
  "1. Purpose",
  "2. Selected Perspective Material",
  "3. Evidence",
  "4. Unresolved Tensions",
  "5. Next Action Candidates",
  "6. Suggested Use",
  "7. Compact Authority",
  "8. Base Packet Text",
]);
assertOrdered(unitPreviewBuilder, [
  "1. Purpose",
  "2. Selected Perspective Material",
  "3. Evidence",
  "4. Unresolved Tensions",
  "5. Next Action Candidates",
  "6. Suggested Use",
  "7. Compact Authority",
  "8. Base Packet Text",
]);

assertContainsAll(builder, [
  "CHATGPT_NODE_COPY",
  "CODEX_NODE_COPY",
  "Sample ChatGPT record",
  "What the user wants",
  "Preview concept",
  "Safe fixture decision",
  "Known limitation",
  "Review / Codex packets",
  "Sample Codex record",
  "Implementation work",
  "Validation results",
  "Blockers / risks",
  "Pasted source text",
]);

for (const oldActiveCopy of [
  "label: \"Synthetic ChatGPT source\"",
  "label: \"Product concept\"",
  "label: \"Fixture-first decision\"",
  "label: \"Visible tension\"",
  "label: \"Copyable packets\"",
  "label: \"Synthetic Codex source\"",
  "label: \"Work unit\"",
  "label: \"Blocker and risk\"",
  "label: \"Manual pasted text source\"",
]) {
  assert.equal(
    builder.includes(oldActiveCopy),
    false,
    `active generated node copy should not keep old label literal: ${oldActiveCopy}`,
  );
}

assertContainsAll(cockpit, [
  'data-augnes-authority-capsule="PerspectiveCompactAuthority"',
  'data-augnes-region="event-rail"',
  'data-augnes-event-rail-view="node-edge"',
  "data-augnes-rail-node-id={node.id}",
  "data-augnes-rail-edge-id={edge.id}",
  "handoff_to_pr_ref",
  "PR entries are review pointers for local inspection.",
]);
assert.equal(
  /\brulecraft\b/i.test(cockpit),
  false,
  "Rulecraft must not be exposed in product-facing Cockpit UI",
);

assertNoRawManualInputStored(manualPreview);

for (const changedFile of collectChangedFiles()) {
  assert(
    allowedChangedFiles.has(changedFile),
    `node copy humanization changed an out-of-scope file: ${changedFile}`,
  );
  assert(
    !changedFile.startsWith("app/api/") &&
      !changedFile.startsWith("db/") &&
      !changedFile.startsWith("migrations/"),
    `node copy humanization must not introduce routes, DB, or migrations: ${changedFile}`,
  );
}

for (const [file, text] of [
  [builderFile, builder],
  [docFile, doc],
]) {
  for (const { label, test } of [
    { label: "fetch(", test: (value) => value.includes("fetch(") },
    { label: "route URL /api/", test: (value) => /["'`]\/api\//.test(value) },
    { label: "api.github.com", test: (value) => value.includes("api.github.com") },
    { label: "api.openai.com", test: (value) => value.includes("api.openai.com") },
    { label: "process.env", test: (value) => value.includes("process.env") },
    { label: "GITHUB_TOKEN", test: (value) => value.includes("GITHUB_TOKEN") },
    { label: "OPENAI_API_KEY", test: (value) => value.includes("OPENAI_API_KEY") },
    { label: "use server", test: (value) => value.includes("use server") },
  ]) {
    assert.equal(
      test(text),
      false,
      `${file} must not add runtime/provider/GitHub plumbing: ${label}`,
    );
  }
}

console.log("perspective node copy humanization smoke passed");

function assertNodeCopy(preview, expectedNodes) {
  for (const [id, type, label, summary] of expectedNodes) {
    const node = findNode(preview, id);
    assert.equal(node.type, type, `node type must remain stable for ${id}`);
    assert.equal(node.label, label, `node label must be humanized for ${id}`);
    if (summary) {
      assert.equal(node.summary, summary, `node summary must be humanized for ${id}`);
    }
  }
}

function normalizeFixture(record) {
  return {
    episode_id: record.episode_id,
    source_kind: record.source_kind,
    source_ref: record.source_ref,
    source_label: record.source_label,
    title: record.title,
    summary: record.summary,
    synthetic_timestamp: record.synthetic_timestamp,
    actors: [...record.actors],
    public_safety: {
      synthetic: true,
      public_safe: true,
      sample_fixture_only: true,
      not_raw_private_history: true,
      no_credentials_or_secrets: true,
      no_proof_evidence_readiness_write: true,
      no_external_call: true,
      no_codex_execution_authority: true,
      boundary_notes: record.public_safety.boundary_notes,
    },
    user_intents: [...(record.user_intents ?? [])],
    product_concepts: [...(record.product_concepts ?? [])],
    decisions: [...(record.decisions ?? [])],
    work_units: [...(record.work_units ?? [])],
    changed_files: [...(record.changed_files ?? [])],
    validations: [...(record.validations ?? [])],
    final_report_points: [...(record.final_report_points ?? [])],
    evidence_refs: [...(record.evidence_refs ?? [])],
    unresolved_tensions: [...(record.unresolved_tensions ?? [])],
    next_actions: [...(record.next_actions ?? [])],
  };
}

function buildManualSmokeEpisode() {
  return {
    episode_id: "episode.manual_pasted_text.node_copy_humanization.v0_1",
    source_kind: "manual_pasted_text",
    source_ref: "local-user-provided:manual-pasted-text",
    source_label: "Manual source fixture",
    title: "Manual source fixture",
    summary:
      "Intent: Review this local slice. Concept: Humanized Perspective labels. Decision: Keep it copy-only. Next: Validate browser output.",
    synthetic_timestamp: "2026-06-08T00:00:00.000Z",
    actors: ["local_user", "augnes_cockpit"],
    public_safety: {
      synthetic: false,
      public_safe: true,
      sample_fixture_only: false,
      manual_local_preview: true,
      not_raw_private_history: true,
      no_credentials_or_secrets: true,
      no_proof_evidence_readiness_write: true,
      no_external_call: true,
      no_codex_execution_authority: true,
      boundary_notes: [
        "manual pasted text",
        "local-only preview",
        "bounded summary and extracted fields only",
        "not raw private history",
        "no credential/secrets",
        "no proof/evidence/readiness write",
        "no external call",
        "no Codex execution authority",
      ],
    },
    user_intents: ["Review this local slice."],
    product_concepts: ["Humanized Perspective labels."],
    decisions: ["Keep it copy-only."],
    work_units: [],
    changed_files: [],
    validations: [],
    final_report_points: [],
    evidence_refs: ["local-user-provided:manual-pasted-text"],
    unresolved_tensions: [
      "Manual pasted input must stay bounded and non-persistent.",
    ],
    next_actions: ["Validate browser output."],
  };
}

function findNode(preview, id) {
  const node = preview.constellation.nodes.find((item) => item.id === id);
  assert(node, `expected node id: ${id}`);
  return node;
}

function assertEdgeContracts(preview, expectedEdges) {
  for (const [id, type, source, target] of expectedEdges) {
    const edge = preview.constellation.edges.find((item) => item.id === id);
    assert(edge, `expected edge id: ${id}`);
    assert.equal(edge.type, type, `edge type must remain stable for ${id}`);
    assert.equal(edge.source, source, `edge source must remain stable for ${id}`);
    assert.equal(edge.target, target, `edge target must remain stable for ${id}`);
  }
}

function assertNoRawManualInputStored(preview) {
  const rawInput =
    "Intent: Review this local slice.\nConcept: Humanized Perspective labels.\nDecision: Keep it copy-only.\nNext: Validate browser output.";
  const serialized = JSON.stringify(preview);
  assert.equal(
    serialized.includes(rawInput),
    false,
    "manual preview response must not store raw pasted text verbatim",
  );
}

function assertContainsAll(text, snippets) {
  const normalized = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalized.includes(normalize(snippet)),
      `Expected source to contain: ${snippet}`,
    );
  }
}

function assertOrdered(text, snippets) {
  let cursor = -1;
  for (const snippet of snippets) {
    const nextIndex = text.indexOf(snippet, cursor + 1);
    assert.notEqual(nextIndex, -1, `Expected ordered snippet: ${snippet}`);
    assert(nextIndex > cursor, `Expected ${snippet} after previous section`);
    cursor = nextIndex;
  }
}

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

function collectChangedFiles() {
  const workingTreeFiles = gitLines(["diff", "--name-only", "HEAD"]);
  const branchFiles = gitLines(["diff", "--name-only", "origin/main...HEAD"]);
  const untrackedFiles = gitLines(["ls-files", "--others", "--exclude-standard"]);
  return Array.from(
    new Set([...workingTreeFiles, ...branchFiles, ...untrackedFiles]),
  ).filter(Boolean);
}

function gitLines(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}
