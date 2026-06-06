import assert from "node:assert/strict";
import {
  assertContainsAll,
  assertPackageScript,
  loadTextByFile,
  normalizeText,
  readRepoText,
} from "./smoke-boundary-common.mjs";

const typeFile = "types/perspective-ingest-constellation-preview.ts";
const formationTypeFile = "types/perspective-constellation-formation.ts";
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
const perspectiveUnitPreviewBuilderFile =
  "lib/perspective-ingest/perspective-unit-preview.ts";
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
  formationTypeFile,
  chatGptFixtureFile,
  codexFixtureFile,
  sessionEpisodeHelperFile,
  chatGptAdapterFile,
  codexAdapterFile,
  packetBuilderFile,
  perspectiveUnitPreviewBuilderFile,
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
const manualGravityLocalDraftStorageKey =
  "augnes:perspective-constellation:manual-gravity-draft:v0.1";
const manualGravityLocalDraftVersion = "manual_gravity_draft.v0.1";

assertPackageJsonScript();
assertFixtureSafety(chatGptFixtureFile);
assertFixtureSafety(codexFixtureFile);
assertTypeExports();
assertPerspectiveUnitPreviewBuilder();
assertHelperAndRouteShape();
assertCockpitSurface();
assertManualGravityPreviewMarks();
assertFormationSummaryOverlay();
assertFormationBasisExplanationOverlay();
assertFormationSubstratePanel();
assertEventRailArchiveEntryCards();
assertCssHooks();
assertPerspectiveConstellationStressRegressionFixes();
assertBoundaryDocs();
assertNoExternalCallPatterns();

console.log("perspective ingest constellation preview smoke passed");

function stripAllowedManualGravityLocalDraftStorage(cockpitText) {
  return cockpitText.replace(
    /\bwindow\.localStorage\.(?:getItem|setItem|removeItem)\(\s*MANUAL_GRAVITY_LOCAL_DRAFT_STORAGE_KEY[\s\S]*?\);/g,
    "",
  );
}

function assertOnlyManualGravityLocalDraftStorage(cockpitText) {
  assertContainsAll(cockpitFile, [
    "MANUAL_GRAVITY_LOCAL_DRAFT_STORAGE_KEY",
    manualGravityLocalDraftStorageKey,
    "MANUAL_GRAVITY_LOCAL_DRAFT_VERSION",
    manualGravityLocalDraftVersion,
    "window.localStorage.getItem(MANUAL_GRAVITY_LOCAL_DRAFT_STORAGE_KEY)",
    "window.localStorage.setItem(",
    "window.localStorage.removeItem(MANUAL_GRAVITY_LOCAL_DRAFT_STORAGE_KEY)",
  ], { textByFile });

  const withoutAllowedDraftStorage =
    stripAllowedManualGravityLocalDraftStorage(cockpitText);
  assert(
    !/\blocalStorage\b/.test(withoutAllowedDraftStorage),
    "localStorage must only be used for Manual Gravity local draft metadata",
  );
}

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
  assertContainsAll(formationTypeFile, [
    "export type FormationBasisV0",
    "\"current\"",
    "\"manual_selection\"",
    "\"auto_proposal\"",
    "\"historical_snapshot\"",
    "\"experimental\"",
    "export type PerspectiveConstellationViewModeV0 = \"single\" | \"compare\"",
    "export interface FormationReceiptV0",
    "formation_id",
    "constellation_id",
    "formation_basis",
    "view_mode",
    "formed_by",
    "source_refs",
    "generated_at",
    "as_of",
    "criteria_summary",
    "authority",
    "preview_overrides",
    "node_attributions",
    "edge_attributions",
    "export interface PerspectiveUnitPreview",
    "preview_id",
    "scope_label",
    "selected_node_ids",
    "selected_node_labels",
    "selected_edge_ids",
    "chatgpt_review_packet_text",
    "codex_handoff_packet_text",
    "formation_receipt",
    "local_boundary_notes",
  ], { textByFile });
}

function assertPerspectiveUnitPreviewBuilder() {
  const builderText = textByFile.get(perspectiveUnitPreviewBuilderFile);
  const cockpitText = textByFile.get(cockpitFile);
  const formationText = textByFile.get(formationTypeFile);
  const basisTypeMatch =
    formationText.match(/export type FormationBasisV0 =([\s\S]*?);/);

  assertContainsAll(perspectiveUnitPreviewBuilderFile, [
    "buildPerspectiveUnitPreview",
    "PerspectiveUnitPreview",
    "FormationReceiptV0",
    "buildFormationReceipt",
    "buildPerspectiveConstellationScopedPacketText",
    "Formation Basis records how this preview was formed",
    "actor_type: \"augnes_builder\"",
    "Augnes Perspective ingest / Constellation preview builder",
    "external_calls: false",
    "api_billable: false",
    "persistence: false",
    "graph_db_write: false",
    "proof_evidence_write: false",
    "codex_execution: false",
    "preview_overrides",
    "node_attributions",
    "edge_attributions",
    "Selection scope:",
    "Selected graph material:",
    "Evidence pointers (support only):",
    "Unresolved tensions (kept separate):",
    "Next action candidates (advisory only):",
  ], { textByFile });
  assertContainsAll(cockpitFile, [
    "buildPerspectiveUnitPreview",
    "perspectiveConstellationUnitPreview",
    "PerspectiveConstellationLens",
    "PerspectiveConstellationSelectionScopeV0",
  ], { textByFile });
  assert(
    !/function\s+buildPerspectiveConstellationScopedPacketText/.test(cockpitText),
    "Cockpit must not own the scoped packet assembly helper",
  );
  assert(basisTypeMatch, "FormationBasisV0 union must be inspectable");
  const basisTypeText = basisTypeMatch?.[1] ?? "";
  for (const forbiddenBasis of [
    "compare",
    "whole_constellation",
    "connected_nodes",
    "open_tensions",
    "next_candidates",
    "codex_handoff",
  ]) {
    assert(
      !basisTypeText.includes(forbiddenBasis),
      `FormationBasisV0 must not include ${forbiddenBasis}`,
    );
  }
  assert(
    /PerspectiveConstellationLens[\s\S]*"whole_constellation"[\s\S]*"codex_handoff"/.test(
      cockpitText,
    ),
    "Lens values must remain component view lenses, separate from FormationBasisV0",
  );
  assertNoRulecraftSurface([
    formationTypeFile,
    perspectiveUnitPreviewBuilderFile,
    cockpitFile,
  ]);
  assertNoNewPreviewBuilderAuthority();
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
    "buildPerspectiveUnitPreview",
    "perspectiveConstellationUnitPreview",
    "Time Axis / Event Rail",
    "Session",
    "Decision",
    "Handoff",
    "PR",
    "Review",
    "Closeout",
    "Current View",
    "Next Perspective",
    "Formation / Archive",
    "Formation Receipt",
    "Source refs",
    "Criteria summary",
    "Authority flags",
    "Node attributions",
    "Edge attributions",
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

function assertManualGravityPreviewMarks() {
  const cockpitText = textByFile.get(cockpitFile);

  assertContainsAll(cockpitFile, [
    "ManualGravityPreviewMark",
    "ManualGravityPreviewOverride",
    "MANUAL_GRAVITY_PREVIEW_MARKS",
    "selectedGravityPreviewMarks",
    "setSelectedGravityPreviewMarks",
    "manualGravityPreviewSelection",
    "activeManualGravityPreviewMarks",
    "manualGravityPreviewOverrides",
    "toggleManualGravityPreviewMark",
    "clearManualGravityPreviewMarks",
    "saveManualGravityLocalDraftMarks",
    "clearManualGravityLocalDraftMarks",
    "parseManualGravityLocalDraft",
    "manualGravityLocalDraftMatchesContext",
    "sanitizeManualGravityPreviewMarks",
    "manualGravityLocalDraftStatus",
    "manualGravityLocalDraftContext",
    "manualGravityLocalDraftContextKey",
    "Manual Gravity Preview",
    "Local salience marks for the current selected graph material.",
    "Preview-only. Not saved. Not written to FormationReceiptV0. No graph DB write.",
    "Pin Preview",
    "Watch Preview",
    "Defer Preview",
    "Boost Preview",
    "Clear Preview Marks",
    "Pinned preview",
    "Watch preview",
    "Deferred preview",
    "Boosted preview",
    "No preview marks applied",
    "select a node, cluster, or manual selection first",
    "preview marks are not persisted",
    "not receipt overrides yet",
    "source graph remains read-only",
    "no persistence, API route, or external call",
    "preview overrides",
    "Preview overrides",
    "Manual Gravity preview marks are UI-only salience signals for",
    "the current selected graph material.",
    "Not persisted. Not source graph changes. Not written as stored FormationReceiptV0 authority. No graph DB write.",
    "storage",
    "authority",
    "preview-only",
    "No UI-only preview overrides",
    "Manual Gravity Local Draft",
    "Local draft:",
    "Browser-local mark metadata only.",
    "No pasted text, source text, graph data, packet text, prompts, model outputs, evidence",
    "content, or private history are stored.",
    "Not server persistence.",
    "Not FormationReceiptV0 authority.",
    "Save Local Draft Marks",
    "Clear Local Draft Marks",
    "saved for this formation",
    "restored for this formation",
    "no matching local draft",
    "storage key",
    "version",
    "disabled={!manualGravityPreviewSelection}",
    "type=\"button\"",
  ], { textByFile });

  assertOnlyManualGravityLocalDraftStorage(cockpitText);
  assert(
    !/\bpreview_overrides\s*[:=][\s\S]{0,240}selectedGravityPreviewMarks\b|\bselectedGravityPreviewMarks\b[\s\S]{0,240}\bpreview_overrides\s*[:=]/.test(
      cockpitText,
    ),
    "Manual Gravity preview marks must not write into FormationReceiptV0 preview_overrides",
  );
  assert(
    !/\bdb\.(insert|update|delete|execute|run)\b/i.test(cockpitText),
    "Manual Gravity preview marks must not introduce DB writes",
  );
  assert(
    !/\bfetch\s*\([^)]*selectedGravityPreviewMarks|\bselectedGravityPreviewMarks[\s\S]{0,160}\bfetch\s*\(/.test(
      cockpitText,
    ),
    "Manual Gravity preview marks must not call APIs",
  );
  assert(
    (cockpitText.match(/setSelectedGravityPreviewMarks\(\{\}\)/g) ?? [])
      .length >= 3,
    "Manual Gravity preview marks and UI-only preview overrides must reset on source/manual/fail-closed paths",
  );
}

function assertFormationSummaryOverlay() {
  const cockpitText = textByFile.get(cockpitFile);
  const cockpitTextWithoutAllowedDraftStorage =
    stripAllowedManualGravityLocalDraftStorage(cockpitText);
  const formationBasisMatch =
    cockpitText.match(/type PerspectiveConstellationLens =([\s\S]*?);/);

  assertContainsAll(cockpitFile, [
    "perspectiveConstellationUnitPreview",
    "perspectiveConstellationFormationReceipt",
    "perspectiveConstellationFormationReceipt?.formation_basis",
    "perspectiveConstellationFormationReceipt?.view_mode",
    "perspectiveConstellationFormationReceipt?.formed_by.label",
    "perspectiveConstellationFormationReceipt.source_refs",
    "perspectiveConstellationFormationReceipt?.generated_at",
    "perspectiveConstellationFormationReceipt?.as_of",
    "perspectiveConstellationFormationReceipt?.authority",
    "perspectiveConstellationUnitPreview.local_boundary_notes",
    "Perspective Constellation summary overlay",
    "Current Formation Receipt",
    "Perspective Unit summary",
    "Viewing",
    "Formed by",
    "Formation Basis",
    "Source",
    "Generated",
    "As of",
    "Status",
    "External calls",
    "API billing",
    "Persistence",
    "Graph DB writes",
    "Proof/evidence writes",
    "Codex execution",
    "manual_selection",
    "failed preview",
    "no current graph",
    "formatPerspectiveConstellationAuthorityFlag",
    "getPerspectiveConstellationSummaryStatus",
    "getPerspectiveConstellationReceiptSourceDetail",
  ], { textByFile });
  assertContainsAll(perspectiveUnitPreviewBuilderFile, [
    "manual_selection",
    "Manual Selection",
  ], { textByFile });
  assert(
    formationBasisMatch,
    "PerspectiveConstellationLens union must be inspectable",
  );
  const lensText = formationBasisMatch?.[1] ?? "";
  for (const expectedLens of [
    "whole_constellation",
    "connected_nodes",
    "open_tensions",
    "next_candidates",
    "codex_handoff",
  ]) {
    assert(lensText.includes(expectedLens), `Lens must keep ${expectedLens}`);
  }
  assert(
    !lensText.includes("manual_selection"),
    "Manual selection must remain scope/receipt behavior, not a Lens value",
  );
  assert(
    !/\blocalStorage\b/.test(cockpitTextWithoutAllowedDraftStorage),
    "Cockpit must not introduce localStorage acknowledgement logic",
  );
}

function assertFormationBasisExplanationOverlay() {
  const cockpitText = textByFile.get(cockpitFile);
  const cockpitTextWithoutAllowedDraftStorage =
    stripAllowedManualGravityLocalDraftStorage(cockpitText);

  assertContainsAll(cockpitFile, [
    "formationBasisExplanationOpen",
    "setFormationBasisExplanationOpen",
    "selectedFormationBasisExplanation",
    "setSelectedFormationBasisExplanation",
    "PerspectiveFormationBasisExplanationCandidate",
    "perspectiveConstellationFormationBasisExplanations",
    "perspectiveConstellationActiveReceiptBasis",
    "selectedPerspectiveFormationBasisExplanation",
    "perspective-formation-basis-explanation-card",
    "Formation Basis explanation card",
    "What does this basis mean?",
    "Formation Basis explanation",
    "How this constellation was formed",
    "Formation Basis explains how the current constellation arrangement was formed. Lens explains how you inspect it. Scope explains what part is selected.",
    "Current",
    "Active local PerspectiveUnitPreview formed from the current Perspective ingest Constellation preview.",
    "Manual Selection",
    "User-selected graph scope. Local-only, preview-only, no new facts, no persistence.",
    "Historical Snapshot",
    "future behavior / not implemented here",
    "Future archive behavior. No frozen snapshot is created in this slice.",
    "Auto Proposal",
    "future behavior / no provider, model, API call, or billing",
    "Future proposal behavior. No provider, model, API call, or billing occurs in this slice.",
    "Experimental",
    "future/internal reserved basis",
    "Reserved future formation basis. Rulecraft is not exposed as a product surface yet.",
    "Compare is a future view mode, not a Formation Basis.",
    "Rulecraft is not exposed yet.",
    "Auto Proposal is not executed here.",
    "No API calls, cost, persistence, graph DB writes, or external calls occur.",
    "Selected basis preview",
    "active receipt basis",
    "selected explanation candidate",
    "Active receipt basis remains unchanged.",
    "Visible graph remains unchanged.",
    "No apply, OK, Cancel, or rearrange flow is available.",
    "No snapshots, delta view, API calls, or persistence occur.",
    "Selecting this explanation candidate does not re-run ingest, rearrange the graph, or change the active receipt basis.",
    "If supported as a formation basis, this would remain local-only and would be based on selected graph material.",
    "No frozen snapshot exists in this slice, no snapshot is created, and no archive state is persisted.",
    "No provider, model, API call, billing, graph rearrangement, or proposal execution occurs here.",
    "It does not expose Rulecraft, create a public enum surface, or apply experimental rearrangement.",
    "aria-pressed={basis.id === selectedFormationBasisExplanation}",
    "aria-expanded={formationBasisExplanationOpen}",
    "aria-controls=\"perspective-formation-basis-explanation-card\"",
  ], { textByFile });
  assert(
    !/\blocalStorage\b/.test(cockpitTextWithoutAllowedDraftStorage),
    "Formation Basis explanation must not introduce localStorage",
  );
  assert(
    !/\bOK-skip\b|\bok skip\b|\backnowledgement\b|\backnowledgment\b/i.test(
      cockpitText,
    ),
    "Formation Basis explanation must not introduce OK-skip acknowledgement logic",
  );
  assert(
    !/\bprovider selector\b|\bmodel selector\b|\brearrange view\b|\bapply basis\b|\bcompareToCurrent\b|\bsetCompare\b/i.test(
      cockpitText,
    ),
    "Formation Basis explanation must not add switching, provider, model, or compare controls",
  );
}

function assertFormationSubstratePanel() {
  const cockpitText = textByFile.get(cockpitFile);
  const cockpitTextWithoutAllowedDraftStorage =
    stripAllowedManualGravityLocalDraftStorage(cockpitText);

  assertContainsAll(cockpitFile, [
    "perspectiveConstellationSubstrateSourceRefs",
    "perspectiveConstellationSubstrateAuthorityItems",
    "perspectiveConstellationSubstrateNodeAttributions",
    "perspectiveConstellationSubstrateEdgeAttributions",
    "perspectiveConstellationFormationReceipt.node_attributions",
    "perspectiveConstellationFormationReceipt.edge_attributions",
    "perspectiveConstellationFormationReceipt?.criteria_summary",
    "perspectiveConstellationUnitPreview?.local_boundary_notes",
    "Formation / Archive",
    "Formation Receipt",
    "Source refs",
    "Criteria summary",
    "Authority flags",
    "Local boundary notes",
    "Node attributions",
    "Edge attributions",
    "Evidence pointers",
    "Unresolved tensions",
    "Next action candidates",
    "No current Formation Receipt",
    "No source refs in current receipt",
    "No criteria summary in current receipt",
    "No authority flags in current receipt",
    "No node attributions for current selection",
    "No edge attributions for current selection",
    "No scoped evidence pointers",
    "No scoped unresolved tensions",
    "No scoped next action candidates",
  ], { textByFile });
  assert(
    !/\blocalStorage\b/.test(cockpitTextWithoutAllowedDraftStorage),
    "Formation Substrate panel must not introduce localStorage",
  );
}

function assertEventRailArchiveEntryCards() {
  const cockpitText = textByFile.get(cockpitFile);
  const cockpitTextWithoutAllowedDraftStorage =
    stripAllowedManualGravityLocalDraftStorage(cockpitText);

  assertContainsAll(cockpitFile, [
    "selectedEventRailEntry",
    "PerspectiveEventRailEntryId",
    "PerspectiveEventRailTemporalRole",
    "PerspectiveEventRailEntry",
    "getPerspectiveEventRailTemporalRoleLabel",
    "perspectiveConstellationEventRail",
    "selectedPerspectiveEventRailEntry",
    "Event Rail archive entry card",
    "Event Rail temporal entry card",
    "Archive Entry Card",
    "Current View Card",
    "Future Candidate Card",
    "Snapshot Archive Card v0",
    "Snapshot Archive Card v0 preview",
    "Archive stage: preview-only",
    "Frozen snapshot: not stored",
    "Compare to Current: not implemented",
    "Use as Reference: informational only",
    "Formation context",
    "current local receipt and preview refs as context only",
    "does not store a frozen snapshot",
    "compute a delta",
    "mutate the Event Rail",
    "No current local receipt / preview refs available",
    "Past / Archive",
    "Present / Active View",
    "Future / Candidate",
    "Temporal role",
    "Mutation",
    "disabled",
    "Source refs / related refs",
    "Use as reference only",
    "No snapshot persistence yet",
    "No delta view",
    "Possible next actions are candidates only",
    "No Codex execution",
    "No GitHub call",
    "No mutation",
    "Uses current PerspectiveUnitPreview / FormationReceiptV0",
    "Local-only / read-only / preview-only",
    "aria-pressed={event.id === selectedEventRailEntry}",
    "onClick={() => setSelectedEventRailEntry(event.id)}",
    "selectedPerspectiveEventRailEntry.temporalRole === \"archive\"",
  ], { textByFile });
  assert(
    !/\blocalStorage\b/.test(cockpitTextWithoutAllowedDraftStorage),
    "Event Rail entry cards must not introduce localStorage",
  );
  assert(
    !/\brulecraft\b/i.test(
      cockpitText
        .replaceAll("Rulecraft is not exposed yet.", "")
        .replaceAll(
        "Reserved future formation basis. Rulecraft is not exposed as a product surface yet.",
        "",
      )
      .replaceAll(
        "It does not expose Rulecraft, create a public enum surface, or apply experimental rearrangement.",
        "",
      ),
    ),
    "Event Rail entry cards must not introduce Rulecraft",
  );
  assert(
    !/\bcompareToCurrent\b|\bsetCompare\b|\bdeltaEngine\b|\bviewSnapshot\b|\buseAsReference\b/.test(
      cockpitText,
    ),
    "Event Rail entry cards must not add snapshot/delta/compare/reference mutation behavior",
  );
}

function assertCssHooks() {
  assertContainsAll(cssFile, [
    "perspective-constellation-workspace-shell",
    "perspective-formation-summary-overlay",
    "perspective-formation-summary-heading",
    "perspective-formation-summary-status",
    "perspective-formation-summary-status-label",
    "perspective-formation-summary-grid",
    "perspective-formation-authority-grid",
    "perspective-formation-summary-actions",
    "perspective-formation-basis-explanation-toggle",
    "perspective-formation-basis-explanation-card",
    "perspective-formation-basis-explanation-list",
    "perspective-formation-basis-explanation-list button[aria-pressed=\"true\"]",
    "perspective-formation-basis-selected-preview",
    "perspective-formation-basis-selected-preview-meta",
    "perspective-formation-basis-selected-preview-boundary",
    "perspective-formation-basis-explanation-boundary",
    "overflow-wrap: anywhere",
    "perspective-constellation-workspace-grid",
    "perspective-lens-scope-panel",
    "perspective-lens-option",
    "perspective-constellation-game-window",
    "perspective-constellation-canvas-frame",
    "perspective-inspector-handoff-panel",
    "perspective-selection-scope-row",
    "perspective-selection-action-menu",
    "perspective-action-button-grid",
    "perspective-manual-gravity-preview",
    "perspective-manual-gravity-actions",
    "perspective-manual-gravity-actions .secondary-button[aria-pressed=\"true\"]",
    "perspective-manual-gravity-chips",
    "perspective-manual-gravity-boundary",
    "perspective-manual-gravity-local-draft",
    "perspective-manual-gravity-draft-actions",
    "perspective-cluster-picker",
    "perspective-packet-preview",
    "perspective-time-axis-event-rail",
    "perspective-event-rail-track",
    "perspective-event-rail-item[aria-pressed=\"true\"]",
    "perspective-event-rail-entry-card",
    "perspective-event-rail-entry-meta",
    "perspective-event-rail-entry-notes",
    "perspective-event-rail-snapshot-preview",
    "perspective-event-rail-snapshot-preview-heading",
    "perspective-event-rail-snapshot-preview-status",
    "perspective-formation-archive-drawer",
    "perspective-substrate-field-grid",
    "perspective-substrate-authority-list",
    "perspective-substrate-card-list",
    "perspective-preview-overrides-panel",
    "perspective-preview-overrides-list",
    "section.is-wide",
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
    perspectiveUnitPreviewBuilderFile,
  ];
  const forbiddenPatterns = [
    { pattern: /\bfetch\s*\(/, label: "fetch(" },
    { pattern: /\bOpenAI\b/, label: "OpenAI" },
    { pattern: /github\.com/i, label: "github.com" },
    { pattern: /api\.github/i, label: "api.github" },
    { pattern: /\bdb\.(insert|update|delete|execute|run)\b/i, label: "DB write helper" },
    { pattern: /\blocalStorage\b/, label: "localStorage" },
    { pattern: /\bwriteFile(Sync)?\b/, label: "filesystem write" },
  ];

  for (const file of files) {
    const text = textByFile.get(file);
    for (const { pattern, label } of forbiddenPatterns) {
      assert(!pattern.test(text), `${file} must not contain ${label}`);
    }
  }
}

function assertNoRulecraftSurface(files) {
  for (const file of files) {
    const text = textByFile
      .get(file)
      .replaceAll("Rulecraft is not exposed yet.", "")
      .replaceAll(
        "Reserved future formation basis. Rulecraft is not exposed as a product surface yet.",
        "",
      )
      .replaceAll(
        "It does not expose Rulecraft, create a public enum surface, or apply experimental rearrangement.",
        "",
      );
    assert(!/rulecraft/i.test(text), `${file} must not introduce Rulecraft`);
  }
}

function assertNoNewPreviewBuilderAuthority() {
  const builderText = textByFile.get(perspectiveUnitPreviewBuilderFile);

  assert(
    !/\bfetch\s*\(/.test(builderText),
    "Perspective Unit preview builder must not make external calls",
  );
  assert(
    !/\bOpenAI\b/.test(builderText),
    "Perspective Unit preview builder must not introduce OpenAI calls",
  );
  assert(
    !/github\.com|api\.github/i.test(builderText),
    "Perspective Unit preview builder must not introduce GitHub calls",
  );
  assert(
    !/\bdb\.(insert|update|delete|execute|run)\b/i.test(builderText),
    "Perspective Unit preview builder must not introduce DB writes",
  );
  assert(
    !/\bwriteFile(Sync)?\b/.test(builderText),
    "Perspective Unit preview builder must not write files",
  );
  assert(
    /read_only:\s*true/.test(builderText),
    "Formation receipt authority must stay read-only",
  );
  for (const falseFlag of [
    "proposal_only",
    "cached",
    "external_calls",
    "api_billable",
    "persistence",
    "graph_db_write",
    "proof_evidence_write",
    "codex_execution",
  ]) {
    assert(
      new RegExp(`${falseFlag}:\\s*false`).test(builderText),
      `Formation receipt authority must keep ${falseFlag} false`,
    );
  }
}
