import assert from "node:assert/strict";
import {
  assertContainsAll,
  assertPackageScript,
  loadTextByFile,
  normalizeText,
  readRepoText,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/perspective-ingest-constellation-preview.ts";
const chatGptFixtureFile =
  "fixtures/perspective-ingest/chatgpt-record-to-constellation.sample.v0.1.json";
const codexFixtureFile =
  "fixtures/perspective-ingest/codex-record-to-constellation.sample.v0.1.json";
const sessionEpisodeHelperFile = "lib/perspective-ingest/session-episode.ts";
const chatGptAdapterFile =
  "lib/perspective-ingest/chatgpt-record-adapter.ts";
const codexAdapterFile = "lib/perspective-ingest/codex-record-adapter.ts";
const packetBuilderFile =
  "lib/perspective-ingest/episode-to-constellation-packet.ts";
const routeHelperFile =
  "lib/readonly-api/perspective-ingest-constellation-preview.ts";
const routeFile =
  "app/api/augnes/read/perspective-ingest-constellation-preview/route.ts";
const cockpitFile = "components/augnes-cockpit.tsx";
const cssFile = "app/globals.css";
const boundaryDoc = "docs/PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_V0_1.md";
const indexDoc = "docs/00_INDEX_LATEST.md";
const packageJsonFile = "package.json";
const smokeFile = "scripts/smoke-perspective-ingest-constellation-preview.mjs";

const inspectedFiles = [
  typeFile,
  chatGptFixtureFile,
  codexFixtureFile,
  sessionEpisodeHelperFile,
  chatGptAdapterFile,
  codexAdapterFile,
  packetBuilderFile,
  routeHelperFile,
  routeFile,
  cockpitFile,
  cssFile,
  boundaryDoc,
  indexDoc,
  packageJsonFile,
  smokeFile,
];

const textByFile = loadTextByFile(inspectedFiles);

assertPackageJsonScript();
assertFixtureSafety(chatGptFixtureFile);
assertFixtureSafety(codexFixtureFile);
assertTypeExports();
assertHelperAndRouteShape();
assertCockpitSurface();
assertCssHooks();
assertPerspectiveConstellationStressRegressionFixes();
assertBoundaryDocs();
assertNoExternalCallPatterns();

console.log("perspective ingest constellation preview smoke passed");

function assertPackageJsonScript() {
  assertPackageScript({
    packageJsonText: textByFile.get(packageJsonFile),
    scriptName: "smoke:perspective-ingest-constellation-preview",
    expectedCommand:
      "node scripts/smoke-perspective-ingest-constellation-preview.mjs",
  });
}

function assertFixtureSafety(file) {
  const fixture = JSON.parse(readRepoText(file));
  const safety = fixture.public_safety ?? {};
  const fixtureText = normalizeText(JSON.stringify(fixture)).toLowerCase();

  assert.equal(safety.synthetic, true, `${file} must be synthetic`);
  assert.equal(safety.public_safe, true, `${file} must be public-safe`);
  assert.equal(
    safety.sample_fixture_only,
    true,
    `${file} must be sample fixture only`,
  );
  assert.equal(
    safety.not_raw_private_history,
    true,
    `${file} must not be raw private history`,
  );
  assert.equal(
    safety.no_credentials_or_secrets,
    true,
    `${file} must include no credential/secrets boundary`,
  );
  assert.equal(
    safety.no_proof_evidence_readiness_write,
    true,
    `${file} must include no proof/evidence/readiness write boundary`,
  );
  assert.equal(
    safety.no_external_call,
    true,
    `${file} must include no external call boundary`,
  );
  assert.equal(
    safety.no_codex_execution_authority,
    true,
    `${file} must include no Codex execution authority boundary`,
  );

  for (const phrase of [
    "synthetic",
    "public-safe",
    "sample fixture only",
    "not raw private history",
    "no credential/secrets",
    "no proof/evidence/readiness write",
    "no external call",
    "no codex execution authority",
  ]) {
    assert(fixtureText.includes(phrase), `${file} must contain ${phrase}`);
  }
}

function assertTypeExports() {
  assertContainsAll(typeFile, [
    "export type PerspectiveIngestSourceKind",
    "export interface PerspectiveIngestSessionEpisode",
    "export interface PerspectiveIngestConstellationNode",
    "export interface PerspectiveIngestConstellationEdge",
    "export interface PerspectiveIngestConstellationCluster",
    "export interface PerspectiveIngestEvidencePointer",
    "export interface PerspectiveIngestUnresolvedTension",
    "export interface PerspectiveIngestNextActionCandidate",
    "export interface PerspectiveIngestPerspectiveCapsulePreview",
    "export interface PerspectiveIngestChatGptRenderingPacket",
    "export interface PerspectiveIngestCodexHandoffPacket",
    "export interface PerspectiveIngestConstellationPreviewResponse",
    "export interface PerspectiveIngestConstellationPreviewErrorBody",
  ], { textByFile });
}

function assertHelperAndRouteShape() {
  assertContainsAll(sessionEpisodeHelperFile, [
    "normalizePerspectiveIngestFixtureRecord",
    "PerspectiveIngestSessionEpisode",
  ], { textByFile });
  assertContainsAll(chatGptAdapterFile, [
    "chatgpt-record-to-constellation.sample.v0.1.json",
    "buildChatGptSampleSessionEpisode",
  ], { textByFile });
  assertContainsAll(codexAdapterFile, [
    "codex-record-to-constellation.sample.v0.1.json",
    "buildCodexSampleSessionEpisode",
  ], { textByFile });
  assertContainsAll(packetBuilderFile, [
    "buildPerspectiveIngestConstellationPreviewResponse",
    "nodes",
    "edges",
    "chatgpt_rendering_packet",
    "codex_handoff_packet",
    "PerspectiveIngestConstellationPreviewResponse",
  ], { textByFile });
  assertContainsAll(routeFile, [
    "export const runtime = \"nodejs\"",
    "export const dynamic = \"force-dynamic\"",
    "export function GET",
    "validatePerspectiveIngestConstellationPreviewRequest",
    "buildPerspectiveIngestConstellationPreviewReadResponse",
  ], { textByFile });
  assertContainsAll(routeHelperFile, [
    "x-augnes-local-readonly",
    "perspective-ingest-constellation-preview-v0.1",
    "sample:chatgpt",
    "sample:codex",
    "source must be sample:chatgpt or sample:codex",
    "validateReadonlyApiLocalAccess",
    "validateReadonlyApiLocalDevAuthAdapter",
  ], { textByFile });
}

function assertCockpitSurface() {
  assertContainsAll(cockpitFile, [
    "PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_REQUEST_PATH",
    "PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_HEADERS",
    "perspectiveIngestConstellationPreviewState",
    "selectedPerspectiveIngestSource",
    "selectedPerspectiveIngestNodeId",
    "perspectiveIngestCopyNotice",
    "refreshPerspectiveIngestConstellationPreview",
    "copyPerspectiveIngestChatGptPacket",
    "copyPerspectiveIngestCodexHandoffPacket",
    "selectPerspectiveIngestPacketText",
    "Ingest graph",
    'useState<CockpitTab>("perspective")',
    'id="perspective-constellation-workspace"',
    "Perspective Constellation",
    "Constellation workspace",
    "Lens / Scope",
    "Whole Constellation",
    "Connected Nodes",
    "Open Tensions",
    "Next Candidates",
    "Codex Handoff",
    "Central Constellation Game Window",
    "Inspector / Action / Handoff",
    "Selection scope",
    "Selected node / cluster summary",
    "Thesis / capsule summary",
    "Node / Cluster Action Menu",
    "Inspect connected nodes",
    "Preview Perspective Unit",
    "Mark as Next Candidate Preview",
    "ChatGPT review packet preview",
    "Codex handoff packet preview",
    "ChatGPT / Codex handoff preview scoped to selection",
    "Copy ChatGPT Review Packet",
    "Copy Codex Handoff Packet",
    "Selection-scoped preview/copy only",
    "buildPerspectiveConstellationScopedPacketText",
    "Selection scope:",
    "Selected graph material:",
    "Unresolved tensions (kept separate):",
    "Next action candidates (advisory only):",
    "Time Axis / Event Rail",
    "Session",
    "Decision",
    "Handoff",
    "PR",
    "Review",
    "Closeout",
    "Next Perspective",
    "Formation / Archive",
    "Source docs",
    "Source reports",
    "Validation results",
    "Raw fixture/source refs",
    "Archive/source material",
    "id=\"perspective-ingest-constellation-preview\"",
    "Perspective Ingest Constellation",
    "sample:chatgpt",
    "sample:codex",
    "Load preview",
    "Copy ChatGPT review packet",
    "Copy Codex handoff packet",
    "Currently selected packet text",
    "PerspectiveIngestConstellationGraph",
    'surface="workspace"',
  ], { textByFile });
}

function assertCssHooks() {
  assertContainsAll(cssFile, [
    "perspective-constellation-workspace-shell",
    "perspective-constellation-workspace-grid",
    "perspective-lens-scope-panel",
    "perspective-lens-option",
    "perspective-constellation-game-window",
    "perspective-constellation-canvas-frame",
    "perspective-inspector-handoff-panel",
    "perspective-selection-scope-row",
    "perspective-selection-action-menu",
    "perspective-action-button-grid",
    "perspective-cluster-picker",
    "perspective-packet-preview",
    "perspective-time-axis-event-rail",
    "perspective-event-rail-track",
    "perspective-formation-archive-drawer",
    "perspective-ingest-constellation-section",
    "ingest-constellation-toolbar",
    "ingest-constellation-stage",
    "ingest-constellation-svg",
    "ingest-constellation-node",
    "ingest-constellation-edge",
    "ingest-constellation-detail-grid",
    "ingest-constellation-packet-actions",
  ], { textByFile });
}

function assertPerspectiveConstellationStressRegressionFixes() {
  const cockpitText = textByFile.get(cockpitFile);
  const cssText = textByFile.get(cssFile);
  const wholeConstellationResetPairPattern =
    /setPerspectiveConstellationSelectionScope\("whole_constellation"\);\s+setSelectedPerspectiveConstellationLens\("whole_constellation"\);/g;

  assert(
    cockpitText.match(wholeConstellationResetPairPattern)?.length >= 3,
    "source/manual preview resets must reset active lens with whole-constellation scope",
  );
  assertContainsAll(cssFile, [
    ".perspective-ingest-constellation-section .ingest-constellation-stage",
    ".perspective-ingest-constellation-section .ingest-constellation-svg",
    "overflow-wrap: anywhere",
  ], { textByFile });
  assert(
    /@media \(max-width: 760px\)[\s\S]*\.perspective-ingest-constellation-section \.ingest-constellation-svg\s*\{[\s\S]*min-width: 0;/m.test(
      cssText,
    ),
    "mobile lower ingest preview SVG must not force page-level horizontal overflow",
  );
  assert(
    !cssText.includes("min-width: 560px"),
    "mobile ingest constellation SVG must not keep a 560px forced min-width",
  );
}

function assertBoundaryDocs() {
  assertContainsAll(boundaryDoc, [
    "local-only graph-first ingest preview",
    "synthetic and public-safe",
    "SessionEpisode-like normalized input",
    "PerspectiveIngestConstellationPreviewResponse",
    "Cockpit minimal SVG constellation preview",
    "copyable ChatGPT review packet",
    "copyable Codex handoff packet",
    "no raw private history persistence",
    "no automatic ChatGPT account scraping",
    "no OAuth",
    "no external calls",
    "no OpenAI calls",
    "no GitHub calls",
    "no DB writes",
    "no graph DB",
    "no proof/evidence/readiness writes",
    "no Codex execution",
    "no approval/merge/publish/deploy authority",
    "real local user-provided import",
  ], { textByFile });
  assertContainsAll(indexDoc, [
    "PERSPECTIVE_INGEST_CONSTELLATION_PREVIEW_V0_1.md",
    "smoke:perspective-ingest-constellation-preview",
  ], { textByFile });
}

function assertNoExternalCallPatterns() {
  const files = [
    routeFile,
    routeHelperFile,
    sessionEpisodeHelperFile,
    chatGptAdapterFile,
    codexAdapterFile,
    packetBuilderFile,
  ];
  const forbiddenPatterns = [
    { pattern: /\bfetch\s*\(/, label: "fetch(" },
    { pattern: /\bOpenAI\b/, label: "OpenAI" },
    { pattern: /github\.com/i, label: "github.com" },
    { pattern: /api\.github/i, label: "api.github" },
    { pattern: /\bdb\.(insert|update|delete|execute|run)\b/i, label: "DB write helper" },
    { pattern: /\bwriteFile(Sync)?\b/, label: "filesystem write" },
  ];

  for (const file of files) {
    const text = textByFile.get(file);
    for (const { pattern, label } of forbiddenPatterns) {
      assert(!pattern.test(text), `${file} must not contain ${label}`);
    }
  }
}
