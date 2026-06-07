import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const builderFile = "lib/perspective-ingest/perspective-unit-preview.ts";
const cockpitFile = "components/augnes-cockpit.tsx";
const packageFile = "package.json";
const docFile = "docs/PERSPECTIVE_HANDOFF_PACKET_STRUCTURE_REVIEW_V0_1.md";
const smokeFile = "scripts/smoke-perspective-handoff-packet-structure-review.mjs";
const browserReportFile =
  "reports/browser/2026-06-07-perspective-handoff-packet-structure-review.md";

const packageJson = JSON.parse(readFileSync(packageFile, "utf8"));
const builder = readFileSync(builderFile, "utf8");
const cockpit = readFileSync(cockpitFile, "utf8");
const doc = readFileSync(docFile, "utf8");
const smoke = readFileSync(smokeFile, "utf8");

const allowedChangedFiles = new Set([
  builderFile,
  docFile,
  packageFile,
  browserReportFile,
  smokeFile,
  "scripts/smoke-cockpit-perspective-event-rail-entry-cards.mjs",
  "scripts/smoke-cockpit-perspective-formation-switch-overlay.mjs",
  "scripts/smoke-cockpit-perspective-overlay-focus-agent-semantics.mjs",
  "scripts/smoke-cockpit-perspective-scope-handler-cleanup.mjs",
  "scripts/smoke-perspective-capsule-contract.mjs",
  "scripts/smoke-perspective-ingest-constellation-preview.mjs",
]);

const requiredSectionHeaders = [
  "1. Purpose",
  "2. Selected Perspective Material",
  "3. Evidence",
  "4. Unresolved Tensions",
  "5. Next Action Candidates",
  "6. Suggested Use",
  "7. Compact Authority",
  "8. Base Packet Text",
];

assert.equal(
  packageJson.scripts["smoke:perspective-handoff-packet-structure-review"],
  "node scripts/smoke-perspective-handoff-packet-structure-review.mjs",
  "package.json must register smoke:perspective-handoff-packet-structure-review",
);

const { buildPerspectiveUnitPreview } = await loadPerspectiveUnitPreviewBuilder();
const fullPreview = buildFixturePreview("whole_constellation");
const fallbackPreview = buildFixturePreview("manual_selection");
const chatGptPacket = fullPreview.chatgpt_review_packet_text;
const codexPacket = fullPreview.codex_handoff_packet_text;
const fallbackChatGptPacket = fallbackPreview.chatgpt_review_packet_text;
const fallbackCodexPacket = fallbackPreview.codex_handoff_packet_text;

for (const [label, packet] of [
  ["ChatGPT review packet", chatGptPacket],
  ["Codex handoff packet", codexPacket],
]) {
  assertContainsAll(packet, ["Perspective Handoff Packet", ...requiredSectionHeaders]);
  assertOrdered(packet, requiredSectionHeaders, label);
  assertSeparatedPacketSections(packet, label);
  assertSingleCompactAuthority(packet, label);
  assertNoForbiddenPacketPayloads(packet, label);
}

assertContainsAll(chatGptPacket, [
  "Use for ChatGPT review: review, critique, refine, and produce the next prompt",
]);
assertContainsAll(codexPacket, [
  "Use for Codex handoff: treat this as implementation context for a user-reviewed PR task",
  "not from this packet alone",
]);

for (const [label, packet] of [
  ["fallback ChatGPT review packet", fallbackChatGptPacket],
  ["fallback Codex handoff packet", fallbackCodexPacket],
]) {
  assertContainsAll(packet, [
    "No scoped evidence pointers",
    "No scoped unresolved tensions",
    "No scoped next action candidates",
  ]);
  assertSingleCompactAuthority(packet, label);
}

assertBuilderStructure();
assertCockpitPacketUi();
assertDocCoverage();
assertSmokeBoundary();
assertChangedFilesBoundary();

console.log("perspective handoff packet structure review smoke passed");

async function loadPerspectiveUnitPreviewBuilder() {
  const tempDir = mkdtempSync(
    path.join(tmpdir(), "augnes-handoff-packet-smoke-"),
  );
  process.on("exit", () => {
    rmSync(tempDir, { recursive: true, force: true });
  });
  const bundledFile = path.join(tempDir, "perspective-unit-preview.mjs");
  execFileSync(
    "./apps/augnes_apps/node_modules/.bin/esbuild",
    [
      builderFile,
      "--bundle",
      "--platform=node",
      "--format=esm",
      `--outfile=${bundledFile}`,
      "--log-level=error",
    ],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
  return import(pathToFileURL(bundledFile).href);
}

function buildFixturePreview(scope) {
  const sourceRef = "fixtures/perspective-ingest/packet-structure-review.sample";
  const constellation = {
    constellation_id: "constellation.packet_structure_review.v0_1",
    thesis:
      "Selected Perspective material should remain readable as evidence, tensions, and advisory next actions.",
    nodes: [
      {
        id: "node.source",
        type: "source",
        label: "Source pointer",
        summary: "Pointer-only source material for the selected Perspective frame.",
        source_refs: [sourceRef],
        source_episode_ids: ["episode.packet_review"],
        evidence_pointer_ids: ["pointer.source"],
        unresolved_tension_ids: [],
        next_action_candidate_ids: [],
      },
      {
        id: "node.tension",
        type: "unresolved_tension",
        label: "Tension marker",
        summary: "A visible unresolved question remains open.",
        source_refs: [sourceRef],
        source_episode_ids: ["episode.packet_review"],
        evidence_pointer_ids: ["pointer.source"],
        unresolved_tension_ids: ["tension.open"],
        next_action_candidate_ids: [],
      },
      {
        id: "node.next",
        type: "next_move",
        label: "Next candidate",
        summary: "An advisory next action is available for review.",
        source_refs: [sourceRef],
        source_episode_ids: ["episode.packet_review"],
        evidence_pointer_ids: ["pointer.source"],
        unresolved_tension_ids: [],
        next_action_candidate_ids: ["next.review"],
      },
    ],
    edges: [
      {
        id: "edge.source.tension",
        type: "qualifies",
        source: "node.source",
        target: "node.tension",
        summary: "The source pointer qualifies the visible tension.",
        source_episode_ids: ["episode.packet_review"],
        evidence_pointer_ids: ["pointer.source"],
      },
      {
        id: "edge.tension.next",
        type: "warns_against",
        source: "node.tension",
        target: "node.next",
        summary: "The unresolved tension qualifies the advisory next action.",
        source_episode_ids: ["episode.packet_review"],
        evidence_pointer_ids: ["pointer.source"],
      },
    ],
    clusters: [
      {
        id: "cluster.review",
        label: "Packet review cluster",
        cluster_thesis:
          "The packet review cluster keeps support, tension, and next action material distinct.",
        node_ids: ["node.source", "node.tension", "node.next"],
        edge_ids: ["edge.source.tension", "edge.tension.next"],
        evidence_pointer_ids: ["pointer.source"],
        unresolved_tension_ids: ["tension.open"],
        next_action_candidate_ids: ["next.review"],
      },
    ],
  };

  return buildPerspectiveUnitPreview({
    scope,
    selectedNode: scope === "manual_selection" ? null : constellation.nodes[0],
    selectedCluster: null,
    constellation,
    evidencePointers: [
      {
        pointer_id: "pointer.source",
        label: "Review source",
        target_ref: sourceRef,
        pointer_kind: "fixture_pointer",
        pointer_semantics: "pointer_only",
        bounded_summary: "Pointer only; not a claim body or raw source dump.",
        source_episode_ids: ["episode.packet_review"],
        proof_evidence_write_authority: false,
        readiness_write_authority: false,
      },
    ],
    unresolvedTensions: [
      {
        tension_id: "tension.open",
        label: "Open tension",
        summary: "Keep this unresolved question visible and separate from evidence.",
        source_refs: [sourceRef],
        evidence_pointer_ids: ["pointer.source"],
        blocks_or_qualifies_next_actions: true,
      },
    ],
    nextActionCandidates: [
      {
        candidate_id: "next.review",
        label: "Review next prompt",
        summary: "Draft a user-reviewed next prompt without executing tools.",
        source_refs: [sourceRef],
        blocked_by: ["tension.open"],
        advisory_only: true,
        execution_authority: false,
      },
    ],
    sourceRefs: [
      {
        source_ref: sourceRef,
        source_kind: "fixture_pointer",
        source_label: "Packet structure review fixture",
        source_scope: "project:augnes",
        provenance_note: "Synthetic packet-structure smoke fixture only.",
      },
    ],
    sourceQuery: "sample:chatgpt",
    generatedAt: "2026-06-07T00:00:00.000Z",
    baseChatGptPacketText: "Base ChatGPT review packet text fixture.",
    baseCodexHandoffPacketText: "Base Codex handoff packet text fixture.",
  });
}

function assertBuilderStructure() {
  assertContainsAll(builder, [
    "Perspective Handoff Packet",
    "1. Purpose",
    "2. Selected Perspective Material",
    "3. Evidence",
    "4. Unresolved Tensions",
    "5. Next Action Candidates",
    "6. Suggested Use",
    "7. Compact Authority",
    "8. Base Packet Text",
    "No scoped evidence pointers",
    "No scoped unresolved tensions",
    "No scoped next action candidates",
  ]);
}

function assertCockpitPacketUi() {
  const packetPreviewSource = extractBetween(
    cockpit,
    '<section className="perspective-inspector-section perspective-packet-preview">',
    "</section>",
  );

  assertContainsAll(packetPreviewSource, [
    "<details",
    "Preview Handoff Packet",
    "ChatGPT review packet preview",
    "Codex handoff packet preview",
    "<textarea",
    'id="perspective-constellation-shell-packet-preview"',
  ]);
  assert.equal(
    /<textarea[^>]*hidden|<input[^>]*type="hidden"/i.test(packetPreviewSource),
    false,
    "packet preview must not add hidden packet fields",
  );
  assert.equal(
    /\brulecraft\b/i.test(cockpit),
    false,
    "Rulecraft must not appear in product-facing Cockpit source",
  );
}

function assertDocCoverage() {
  assertContainsAll(doc, [
    "# Perspective Handoff Packet Structure Review v0.1",
    "structure/readability review",
    "not an authority, safety, permission, policy, or execution expansion",
    "human and AI readers",
    "Evidence, tensions, and next actions remain separate",
    "ChatGPT review and Codex handoff purposes remain distinct",
    "Compact Authority should be short and appear once",
    "No hidden JSON dumps or raw/private/generated content",
    "No new visible UI clutter",
    "No API/DB/provider/GitHub/Codex/Rulecraft/snapshot/delta behavior",
    "npm run smoke:perspective-handoff-packet-structure-review",
  ]);
}

function assertSmokeBoundary() {
  for (const forbiddenImport of [
    "app/",
    "components/",
    "db/",
    "migrations/",
    "apps/augnes_apps/",
    "@openai/codex-sdk",
  ]) {
    assert.equal(
      smoke.includes(` from "${forbiddenImport}`) ||
        smoke.includes(` from '${forbiddenImport}`),
      false,
      `smoke must not import runtime/provider surfaces: ${forbiddenImport}`,
    );
  }
}

function assertChangedFilesBoundary() {
  for (const changedFile of collectChangedFiles()) {
    assert(
      allowedChangedFiles.has(changedFile),
      `handoff packet structure review changed an out-of-scope file: ${changedFile}`,
    );
    assert(
      !changedFile.startsWith("app/api/") &&
        !changedFile.startsWith("db/") &&
        !changedFile.startsWith("migrations/") &&
        !changedFile.startsWith("apps/augnes_apps/"),
      `handoff packet structure review must not introduce routes, DB, migrations, or app bridge changes: ${changedFile}`,
    );
  }
}

function assertSeparatedPacketSections(packet, label) {
  const evidence = extractNumberedSection(packet, "3. Evidence");
  const tensions = extractNumberedSection(packet, "4. Unresolved Tensions");
  const nextActions = extractNumberedSection(packet, "5. Next Action Candidates");

  assertContainsAll(evidence, ["Review source", "fixtures/perspective-ingest"]);
  assert.equal(
    /Open tension|Review next prompt/.test(evidence),
    false,
    `${label} Evidence section must not absorb tensions or next actions`,
  );

  assertContainsAll(tensions, ["Open tension"]);
  assert.equal(
    /Review next prompt/.test(tensions),
    false,
    `${label} Unresolved Tensions section must not absorb next actions`,
  );

  assertContainsAll(nextActions, ["Review next prompt"]);
}

function assertSingleCompactAuthority(packet, label) {
  assert.equal(
    countMatches(packet, /^7\. Compact Authority$/gm),
    1,
    `${label} must contain one Compact Authority section`,
  );
  assert.equal(
    countMatches(packet, /^Authority:/gm),
    1,
    `${label} must contain one compact authority statement`,
  );
}

function assertNoForbiddenPacketPayloads(packet, label) {
  for (const forbidden of [
    "raw graph JSON",
    "JSON.stringify",
    "raw pasted text dump",
    "source text dump",
    "private history",
    "model output",
    "API keys",
    "provider tokens",
    "BEGIN_AUGNES_CODEX_HANDOFF_JSON",
    "FormationReceipt",
  ]) {
    assert.equal(
      packet.includes(forbidden),
      false,
      `${label} must not include forbidden raw/private/generated payload marker: ${forbidden}`,
    );
  }
}

function assertContainsAll(text, snippets) {
  const normalized = normalize(text);
  for (const snippet of snippets) {
    assert(
      normalized.includes(normalize(snippet)),
      `Expected text to contain: ${snippet}`,
    );
  }
}

function assertOrdered(text, snippets, label) {
  let previousIndex = -1;
  for (const snippet of snippets) {
    const index = text.indexOf(snippet);
    assert.notEqual(index, -1, `${label} must contain ${snippet}`);
    assert(
      index > previousIndex,
      `${label} must order ${snippet} after the previous required section`,
    );
    previousIndex = index;
  }
}

function extractNumberedSection(text, heading) {
  const start = text.indexOf(heading);
  assert.notEqual(start, -1, `Expected section heading: ${heading}`);
  const next = text.slice(start + heading.length).search(/\n\d+\.\s+/);
  if (next === -1) return text.slice(start);
  return text.slice(start, start + heading.length + next);
}

function extractBetween(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `Expected start marker: ${startMarker}`);
  assert.notEqual(end, -1, `Expected end marker: ${endMarker}`);
  return text.slice(start, end + endMarker.length);
}

function countMatches(text, pattern) {
  return Array.from(text.matchAll(pattern)).length;
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
