import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const componentPath =
  "components/agent-perspective-substrate-folded-audit-panel.tsx";
const feedbackControlsComponentPath = "components/feedback-event-controls.tsx";
const cockpitPath = "components/augnes-cockpit.tsx";
const previewFixturePath =
  "fixtures/agent-perspective-substrate-preview.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const previewBuilderSmokePath =
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs";
const substrateSmokePath = "scripts/smoke-agent-perspective-substrate-v0-1.mjs";
const digestSmokePath =
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs";
const aiContextSmokePath =
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs";
const formationReceiptSmokePath =
  "scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs";
const productWriteStoplineSmokePath =
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs";
const smokePath =
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs";
const aiContextPacketTypePath = "types/research-candidate-ai-context-packet.ts";
const aiContextPacketBuilderPath =
  "lib/research-candidate-review/ai-context-packet.ts";
const aiContextPacketGeometrySubstrateUpgradeFixturePath =
  "fixtures/research-candidate-review.ai-context-packet.geometry-substrate-upgrade.sample.v0.1.json";
const aiContextPacketGeometrySubstrateUpgradeSmokePath =
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs";
const candidateToCodexHandoffDraftTypePath =
  "types/candidate-to-codex-handoff-draft.ts";
const candidateToCodexHandoffDraftBuilderPath =
  "lib/research-candidate-review/candidate-to-codex-handoff-draft.ts";
const candidateToCodexHandoffDraftFixturePath =
  "fixtures/research-candidate-review.candidate-to-codex-handoff-draft.geometry-substrate.sample.v0.1.json";
const candidateToCodexHandoffDraftSmokePath =
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs";
const candidateToCodexHandoffDraftReviewTypePath =
  "types/candidate-to-codex-handoff-draft-review.ts";
const candidateToCodexHandoffDraftReviewBuilderPath =
  "lib/research-candidate-review/candidate-to-codex-handoff-draft-review.ts";
const candidateToCodexHandoffDraftReviewFixturePath =
  "fixtures/research-candidate-review.candidate-to-codex-handoff-draft-review.sample.v0.1.json";
const candidateToCodexHandoffDraftReviewSmokePath =
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs";
const candidateToCodexHandoffOperatorDecisionTypePath =
  "types/candidate-to-codex-handoff-operator-decision.ts";
const candidateToCodexHandoffOperatorDecisionBuilderPath =
  "lib/research-candidate-review/candidate-to-codex-handoff-operator-decision.ts";
const candidateToCodexHandoffOperatorDecisionFixturePath =
  "fixtures/research-candidate-review.candidate-to-codex-handoff-operator-decision.sample.v0.1.json";
const candidateToCodexHandoffOperatorDecisionSmokePath =
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs";
const uiImplementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-implementation.sample.v0.1.json";
const uiImplementationSmokePath =
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs";
const listRouteContractTypePath =
  "types/feedback-event-store-list-route-contract.ts";
const listRouteContractBuilderPath =
  "lib/research-candidate-review/feedback-event-store-list-route-contract.ts";
const listRouteContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-route-contract.sample.v0.1.json";
const listRouteContractSmokePath =
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs";

const packageScriptName =
  "smoke:agent-perspective-substrate-folded-audit-panel-v0-1";
const packageScriptValue = `node ${smokePath}`;
const downstreamAIContextPacketGeometrySubstrateUpgradePackageScriptNames = [
  "smoke:research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1",
];
const downstreamCandidateToCodexHandoffDraftPackageScriptNames = [
  "smoke:research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1",
];
const downstreamCandidateToCodexHandoffDraftReviewPackageScriptNames = [
  "smoke:research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1",
];
const downstreamCandidateToCodexHandoffOperatorDecisionPackageScriptNames = [
  "smoke:research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1",
];
const downstreamFeedbackEventControlsUiImplementationPackageScriptNames = [
  "smoke:feedback-event-controls-ui-implementation-v0-1",
];
const listRouteContractPackageScriptNames = [
  "smoke:feedback-event-store-list-route-contract-v0-1",
];
const anchorId = "agent-perspective-substrate-folded-audit-panel";
const nextRecommendedSlice =
  "ai_context_packet_compiler_geometry_substrate_upgrade_v0_1";
const downstreamAIContextPacketGeometrySubstrateUpgradeNextRecommendedSlice =
  "candidate_to_codex_handoff_draft_geometry_substrate_v0_1";
const downstreamCandidateToCodexHandoffDraftNextRecommendedSlice =
  "candidate_to_codex_handoff_draft_review_v0_1";
const downstreamCandidateToCodexHandoffDraftReviewNextRecommendedSlice =
  "candidate_to_codex_handoff_operator_decision_v0_1";
const downstreamCandidateToCodexHandoffOperatorDecisionNextRecommendedSlice =
  "feedback_event_store_minimal_v0_1";
const requiredSectionKinds = [
  "blockers",
  "warnings",
  "notices",
  "retrieval_hints",
  "handoff_improvements",
  "stale_context",
  "product_write_stopline",
  "source_coverage",
];
const expectedChangedFiles = [
  componentPath,
  cockpitPath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  previewBuilderSmokePath,
  substrateSmokePath,
  digestSmokePath,
  aiContextSmokePath,
  formationReceiptSmokePath,
  productWriteStoplineSmokePath,
];
const downstreamAIContextPacketGeometrySubstrateUpgradeChangedFiles = [
  aiContextPacketTypePath,
  aiContextPacketBuilderPath,
  aiContextPacketGeometrySubstrateUpgradeFixturePath,
  aiContextPacketGeometrySubstrateUpgradeSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  aiContextSmokePath,
  smokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  digestSmokePath,
  formationReceiptSmokePath,
  productWriteStoplineSmokePath,
];
const downstreamCandidateToCodexHandoffDraftChangedFiles = [
  candidateToCodexHandoffDraftTypePath,
  candidateToCodexHandoffDraftBuilderPath,
  candidateToCodexHandoffDraftFixturePath,
  candidateToCodexHandoffDraftSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  aiContextPacketGeometrySubstrateUpgradeSmokePath,
  smokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  digestSmokePath,
  aiContextSmokePath,
  formationReceiptSmokePath,
];
const downstreamCandidateToCodexHandoffDraftReviewChangedFiles = [
  candidateToCodexHandoffDraftReviewTypePath,
  candidateToCodexHandoffDraftReviewBuilderPath,
  candidateToCodexHandoffDraftReviewFixturePath,
  candidateToCodexHandoffDraftReviewSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  candidateToCodexHandoffDraftSmokePath,
  aiContextPacketGeometrySubstrateUpgradeSmokePath,
  smokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  digestSmokePath,
  aiContextSmokePath,
  formationReceiptSmokePath,
];
const downstreamCandidateToCodexHandoffOperatorDecisionChangedFiles = [
  candidateToCodexHandoffOperatorDecisionTypePath,
  candidateToCodexHandoffOperatorDecisionBuilderPath,
  candidateToCodexHandoffOperatorDecisionFixturePath,
  candidateToCodexHandoffOperatorDecisionSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  candidateToCodexHandoffDraftReviewSmokePath,
  candidateToCodexHandoffDraftSmokePath,
  aiContextPacketGeometrySubstrateUpgradeSmokePath,
  smokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  digestSmokePath,
  "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs",
];

for (const filePath of [
  componentPath,
  cockpitPath,
  previewFixturePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  previewBuilderSmokePath,
  substrateSmokePath,
  digestSmokePath,
  aiContextSmokePath,
  formationReceiptSmokePath,
  productWriteStoplineSmokePath,
  aiContextPacketTypePath,
  aiContextPacketBuilderPath,
  candidateToCodexHandoffDraftTypePath,
  candidateToCodexHandoffDraftBuilderPath,
  candidateToCodexHandoffDraftFixturePath,
  candidateToCodexHandoffDraftSmokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const componentSource = readFileSync(componentPath, "utf8");
const cockpitSource = readFileSync(cockpitPath, "utf8");
const previewFixture = readJson(previewFixturePath);
const packageJson = readJson(packagePath);
const indexDoc = readFileSync(indexPath, "utf8");
const substrateDoc = readFileSync(substrateDocPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const previewBuilderSmoke = readFileSync(previewBuilderSmokePath, "utf8");
const substrateSmoke = readFileSync(substrateSmokePath, "utf8");
const digestSmoke = readFileSync(digestSmokePath, "utf8");
const aiContextSmoke = readFileSync(aiContextSmokePath, "utf8");
const formationReceiptSmoke = readFileSync(formationReceiptSmokePath, "utf8");
const productWriteStoplineSmoke = readFileSync(productWriteStoplineSmokePath, "utf8");
const cockpitIntegrationSource = extractAround(
  cockpitSource,
  "AgentPerspectiveSubstrateFoldedAuditPanel",
  900,
);

assertComponentContract();
assertCockpitIntegration();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenPanelPatterns();
assertPreviewFixtureCoverage();
assertDocsPointers();
assertAdjacentSmokePointers();

console.log(
  JSON.stringify(
    {
      smoke: "agent-perspective-substrate-folded-audit-panel-v0-1",
      final_status: "pass",
      component: componentPath,
      anchor_id: anchorId,
      folded_section_count: previewFixture.folded_sections.length,
      surfacing_card_count: previewFixture.surfacing_cards.length,
      next_recommended_slice: nextRecommendedSlice,
      checked_preview_ui_only_boundary: true,
      checked_product_write_stopline_parked: true,
    },
    null,
    2,
  ),
);

function assertComponentContract() {
  assert.match(componentSource, /export function AgentPerspectiveSubstrateFoldedAuditPanel\b/);
  assert.match(componentSource, /agent-perspective-substrate-preview\.sample\.v0\.1\.json/);
  assert.match(componentSource, /preview\?: AgentPerspectiveSubstratePreview/);
  assert.match(componentSource, new RegExp(`id="${anchorId}"`));
  assert.match(componentSource, /folded-by-default/);
  assert.match(componentSource, /useState<Set<string>>/);
  assert.match(componentSource, /new Set\(\)/);
  assert.match(componentSource, /aria-expanded=\{isOpen\}/);
  assert.match(componentSource, /Inspect preview/);
  assert.doesNotMatch(componentSource, /No durable action in this slice/);
  assert.match(
    componentSource,
    /Suggested action labels above remain preview-only\. Feedback controls may\s+write durable feedback events only\./,
  );
  assert.match(componentSource, /no direct DB\/SQL in UI/);
  assert.match(componentSource, /feedback route writes durable feedback events only/);
  assert.match(componentSource, /preview-only/);
  assert.match(componentSource, /disabled/);

  for (const requiredSectionKind of requiredSectionKinds) {
    assert.ok(
      componentSource.includes(`"${requiredSectionKind}"`),
      `component must include section kind ${requiredSectionKind}`,
    );
  }
  for (const requiredText of [
    "epistemic_status",
    "review_status",
    "why_now",
    "source_refs",
    "source coverage boundary note",
    "authority_boundary_notes",
    "execution_authority",
    "durable_write_authority",
    "product_write_available",
    "diagnostics",
    "Authority boundary",
    "Product-write lane remains parked by #686",
    nextRecommendedSlice,
  ]) {
    assert.ok(componentSource.includes(requiredText), `component must include ${requiredText}`);
  }
  for (const boundaryText of [
    "advisory only",
    "preview only",
    "non-SSOT",
    "no proof/evidence",
    "no work mutation",
    "no Perspective state",
    "no retrieval",
    "no agents",
    "no product write",
  ]) {
    assert.ok(
      componentSource.toLowerCase().includes(boundaryText.toLowerCase()),
      `component must state ${boundaryText}`,
    );
  }
}

function assertCockpitIntegration() {
  assert.match(
    cockpitSource,
    /import \{ AgentPerspectiveSubstrateFoldedAuditPanel \} from "@\/components\/agent-perspective-substrate-folded-audit-panel";/,
  );
  assert.match(cockpitSource, /<AgentPerspectiveSubstrateFoldedAuditPanel \/>/);
  assert.match(cockpitSource, new RegExp(`#${anchorId}`));
  const staticRenderOnlyPattern = new RegExp(
    [
      "fet" + "ch\\s*\\(",
      "XML" + "Http" + "Request",
      "Web" + "Socket",
      "Event" + "Source",
      "send" + "Beacon",
      "use " + "server",
      "action=\\{",
    ].join("|"),
  );
  assert.doesNotMatch(
    cockpitIntegrationSource,
    staticRenderOnlyPattern,
    "Cockpit integration must be static render only",
  );
}

function assertPackageScript() {
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    mergeBaseRef(),
    "--",
    packagePath,
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  const addedScriptNames = packageAddedLines
    .map(extractScriptName)
    .filter(Boolean)
    .sort();
  assert.ok(
    [
      downstreamCandidateToCodexHandoffDraftPackageScriptNames,
      downstreamCandidateToCodexHandoffDraftReviewPackageScriptNames,
      downstreamCandidateToCodexHandoffOperatorDecisionPackageScriptNames,
      ["smoke:feedback-event-store-minimal-v0-1"],
      ["smoke:feedback-event-store-review-controls-preview-v0-1"],
      ["smoke:feedback-event-write-route-contract-v0-1"],
      ["smoke:feedback-event-write-route-implementation-v0-1"],
      ["smoke:feedback-event-write-route-browser-validation-v0-1"],
      ["smoke:feedback-event-controls-ui-contract-v0-1"],
      downstreamFeedbackEventControlsUiImplementationPackageScriptNames,
      ["smoke:feedback-event-controls-ui-browser-validation-v0-1"],
      listRouteContractPackageScriptNames,
    ].some((allowedNames) => arraysEqual(addedScriptNames, [...allowedNames].sort())),
    "package additions must only include the downstream Candidate-to-Codex handoff draft/review/operator decision smoke script",
  );
  assert.doesNotMatch(
    packageAddedLines.join("\n"),
    /dependencies|devDependencies|optionalDependencies/,
    "package dependencies must not be added",
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  if (feedbackEventStoreListRouteContractSliceActive(changedFiles)) {
    assertFeedbackEventStoreListRouteContractChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventControlsUiBrowserValidationSliceActive(changedFiles)) {
    assertFeedbackEventControlsUiBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventControlsUiImplementationSliceActive(changedFiles)) {
    assertFeedbackEventControlsUiImplementationChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventControlsUiContractSliceActive(changedFiles)) {
    assertFeedbackEventControlsUiContractChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventWriteRouteBrowserValidationSliceActive(changedFiles)) {
    assertFeedbackEventWriteRouteBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventWriteRouteImplementationSliceActive(changedFiles)) {
    assertFeedbackEventWriteRouteImplementationChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventWriteRouteContractSliceActive(changedFiles)) {
    assertFeedbackEventWriteRouteContractChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventStoreReviewControlsSliceActive(changedFiles)) {
    assertFeedbackEventStoreReviewControlsChangedFiles(changedFiles);
    return;
  }
  if (feedbackEventStoreSliceActive(changedFiles)) {
    assertFeedbackEventStoreChangedFiles(changedFiles);
    return;
  }
  const usesDownstreamAIContextUpgradeDelta =
    downstreamAIContextPacketGeometrySubstrateUpgradeChangedFiles.every((filePath) =>
      changedFiles.includes(filePath),
    );
  const usesDownstreamCandidateToCodexHandoffDraftDelta =
    downstreamCandidateToCodexHandoffDraftChangedFiles.every((filePath) =>
      changedFiles.includes(filePath),
    );
  const usesDownstreamCandidateToCodexHandoffDraftReviewDelta =
    downstreamCandidateToCodexHandoffDraftReviewChangedFiles.every((filePath) =>
      changedFiles.includes(filePath),
    );
  const usesDownstreamCandidateToCodexHandoffOperatorDecisionDelta =
    downstreamCandidateToCodexHandoffOperatorDecisionChangedFiles.every((filePath) =>
      changedFiles.includes(filePath),
    );
  const expectedFilesForDelta = usesDownstreamCandidateToCodexHandoffOperatorDecisionDelta
    ? downstreamCandidateToCodexHandoffOperatorDecisionChangedFiles
    : usesDownstreamCandidateToCodexHandoffDraftReviewDelta
    ? downstreamCandidateToCodexHandoffDraftReviewChangedFiles
    : usesDownstreamAIContextUpgradeDelta
      ? downstreamAIContextPacketGeometrySubstrateUpgradeChangedFiles
      : usesDownstreamCandidateToCodexHandoffDraftDelta
      ? downstreamCandidateToCodexHandoffDraftChangedFiles
    : expectedChangedFiles;
  for (const expectedFile of expectedFilesForDelta) {
    assert.ok(changedFiles.includes(expectedFile), `missing changed file ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /(^|\/)route\.(ts|tsx|js|mjs)$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /(^|\/)actions?\.(ts|tsx|js|mjs)$/, "must not change server actions");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema SQL");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(
      changedFile,
      /(^|\/)(schema|migration|db|sql)\b/i,
      "must not change schema/db/sql paths",
    );
    if (usesDownstreamAIContextUpgradeDelta) {
      assert.doesNotMatch(changedFile, /^components\//, "downstream AI context upgrade must not change components");
    }
  }
}

function feedbackEventStoreListRouteContractSliceActive(changedFiles) {
  return [
    listRouteContractTypePath,
    listRouteContractBuilderPath,
    listRouteContractFixturePath,
    listRouteContractSmokePath,
  ].every((filePath) => changedFiles.includes(filePath));
}

function assertFeedbackEventStoreListRouteContractChangedFiles(changedFiles) {
  const allowedChangedFiles = [
    listRouteContractTypePath,
    listRouteContractBuilderPath,
    listRouteContractFixturePath,
    listRouteContractSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    candidateToCodexHandoffOperatorDecisionSmokePath,
    candidateToCodexHandoffDraftReviewSmokePath,
    candidateToCodexHandoffDraftSmokePath,
    aiContextPacketGeometrySubstrateUpgradeSmokePath,
    "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
    smokePath,
    previewBuilderSmokePath,
    substrateSmokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  ];
  for (const expectedFile of allowedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream list route contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /(^|\/)route\.(ts|tsx|js|mjs)$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /(^|\/)actions?\.(ts|tsx|js|mjs)$/, "must not change server actions");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema SQL");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(
      changedFile,
      /(^|\/)(schema|migration|db|sql)\b/i,
      "must not change schema/db/sql paths",
    );
  }
}

function feedbackEventControlsUiBrowserValidationSliceActive(changedFiles) {
  return feedbackEventControlsUiBrowserValidationChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventControlsUiBrowserValidationChangedFiles(changedFiles) {
  const allowedChangedFiles = feedbackEventControlsUiBrowserValidationChangedFiles();
  for (const expectedFile of allowedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream UI browser validation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    if (changedFile !== "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs") {
      assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
    }
  }
}

function feedbackEventControlsUiBrowserValidationChangedFiles() {
  return [
    "fixtures/research-candidate-review.feedback-event-controls-ui-browser-validation.sample.v0.1.json",
    "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  ];
}

function feedbackEventControlsUiImplementationSliceActive(changedFiles) {
  return feedbackEventControlsUiImplementationChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventControlsUiImplementationChangedFiles(changedFiles) {
  const allowedChangedFiles = feedbackEventControlsUiImplementationChangedFiles();
  for (const expectedFile of allowedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream UI implementation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /(^|\/)route\.(ts|tsx|js|mjs)$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /(^|\/)actions?\.(ts|tsx|js|mjs)$/, "must not change server actions");
    if (changedFile.startsWith("components/")) {
      assert.ok(
        [feedbackControlsComponentPath, componentPath].includes(changedFile),
        `downstream UI implementation may only change allowed component files: ${changedFile}`,
      );
    }
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema SQL");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(
      changedFile,
      /(^|\/)(schema|migration|db|sql)\b/i,
      "must not change schema/db/sql paths",
    );
  }
}

function feedbackEventControlsUiImplementationChangedFiles() {
  return [
    feedbackControlsComponentPath,
    componentPath,
    uiImplementationFixturePath,
    uiImplementationSmokePath,
    "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    candidateToCodexHandoffOperatorDecisionSmokePath,
    candidateToCodexHandoffDraftReviewSmokePath,
    candidateToCodexHandoffDraftSmokePath,
    aiContextPacketGeometrySubstrateUpgradeSmokePath,
    previewBuilderSmokePath,
    substrateSmokePath,
    digestSmokePath,
    productWriteStoplineSmokePath,
    smokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ];
}

function feedbackEventControlsUiContractSliceActive(changedFiles) {
  return feedbackEventControlsUiContractChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventControlsUiContractChangedFiles(changedFiles) {
  const allowedChangedFiles = feedbackEventControlsUiContractChangedFiles();
  for (const expectedFile of allowedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream UI contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
  }
}

function feedbackEventControlsUiContractChangedFiles() {
  return [
    "types/feedback-event-controls-ui-contract.ts",
    "lib/research-candidate-review/feedback-event-controls-ui-contract.ts",
    "fixtures/research-candidate-review.feedback-event-controls-ui-contract.sample.v0.1.json",
    "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
    smokePath,
    "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  ];
}

function feedbackEventStoreSliceActive(changedFiles) {
  return feedbackEventStoreChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function feedbackEventStoreReviewControlsSliceActive(changedFiles) {
  return feedbackEventStoreReviewControlsRequiredChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function feedbackEventWriteRouteImplementationSliceActive(changedFiles) {
  return feedbackEventWriteRouteImplementationRequiredChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function feedbackEventWriteRouteBrowserValidationSliceActive(changedFiles) {
  return feedbackEventWriteRouteBrowserValidationChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventWriteRouteBrowserValidationChangedFiles(changedFiles) {
  const allowedChangedFiles = feedbackEventWriteRouteBrowserValidationChangedFiles();
  for (const expectedFile of allowedChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream browser validation file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream browser validation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
  }
}

function feedbackEventWriteRouteBrowserValidationChangedFiles() {
  return [
    "fixtures/research-candidate-review.feedback-event-write-route-browser-validation.sample.v0.1.json",
    "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    candidateToCodexHandoffOperatorDecisionSmokePath,
    candidateToCodexHandoffDraftReviewSmokePath,
    candidateToCodexHandoffDraftSmokePath,
    aiContextPacketGeometrySubstrateUpgradeSmokePath,
    "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
    "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs",
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  ];
}

function assertFeedbackEventWriteRouteImplementationChangedFiles(changedFiles) {
  const requiredChangedFiles = feedbackEventWriteRouteImplementationRequiredChangedFiles();
  const allowedChangedFiles = feedbackEventWriteRouteImplementationAllowedChangedFiles();
  for (const expectedFile of requiredChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream route implementation file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream route implementation slice: ${changedFile}`,
    );
    if (changedFile !== "app/api/research-candidate/feedback-events/route.ts") {
      assert.doesNotMatch(changedFile, /^app\/api\//, "must only add feedback route file");
      assert.doesNotMatch(changedFile, /(^|\/)route\.(ts|tsx|js|mjs)$/, "must not change other route handlers");
    }
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema SQL");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
  }
}

function feedbackEventWriteRouteImplementationRequiredChangedFiles() {
  return [
    "app/api/research-candidate/feedback-events/route.ts",
    "fixtures/research-candidate-review.feedback-event-write-route-implementation.sample.v0.1.json",
    "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
    "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    candidateToCodexHandoffOperatorDecisionSmokePath,
    candidateToCodexHandoffDraftReviewSmokePath,
    candidateToCodexHandoffDraftSmokePath,
    aiContextPacketGeometrySubstrateUpgradeSmokePath,
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    smokePath,
  ];
}

function feedbackEventWriteRouteImplementationAllowedChangedFiles() {
  return [
    ...feedbackEventWriteRouteImplementationRequiredChangedFiles(),
    previewBuilderSmokePath,
    substrateSmokePath,
    digestSmokePath,
    aiContextSmokePath,
    "scripts/smoke-research-candidate-canonical-promotion-gates-v0-1.mjs",
    "scripts/smoke-research-candidate-review-types-v0-1.mjs",
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  ];
}

function feedbackEventWriteRouteContractSliceActive(changedFiles) {
  return feedbackEventWriteRouteContractRequiredChangedFiles().every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function assertFeedbackEventWriteRouteContractChangedFiles(changedFiles) {
  const requiredChangedFiles = feedbackEventWriteRouteContractRequiredChangedFiles();
  const allowedChangedFiles = feedbackEventWriteRouteContractAllowedChangedFiles();
  for (const expectedFile of requiredChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream route contract file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream route contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(
      changedFile,
      /(^|\/)(schema|migration|db|sql)\b/i,
      "must not change schema/db/sql paths",
    );
  }
}

function feedbackEventWriteRouteContractRequiredChangedFiles() {
  return [
    "types/feedback-event-write-route-contract.ts",
    "lib/research-candidate-review/feedback-event-write-route-contract.ts",
    "fixtures/research-candidate-review.feedback-event-write-route-contract.sample.v0.1.json",
    "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  ];
}

function feedbackEventWriteRouteContractAllowedChangedFiles() {
  return [
    ...feedbackEventWriteRouteContractRequiredChangedFiles(),
    "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
    "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  ];
}

function assertFeedbackEventStoreReviewControlsChangedFiles(changedFiles) {
  const requiredChangedFiles = feedbackEventStoreReviewControlsRequiredChangedFiles();
  const allowedChangedFiles = feedbackEventStoreReviewControlsAllowedChangedFiles();
  for (const expectedFile of requiredChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream review controls file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream review controls slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(
      changedFile,
      /(^|\/)(schema|migration|db|sql)\b/i,
      "must not change schema/db/sql paths",
    );
  }
}

function feedbackEventStoreReviewControlsRequiredChangedFiles() {
  return [
    "types/feedback-event-store-review-controls-preview.ts",
    "lib/research-candidate-review/feedback-event-store-review-controls-preview.ts",
    "fixtures/research-candidate-review.feedback-event-store-review-controls-preview.sample.v0.1.json",
    "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
  ];
}

function feedbackEventStoreReviewControlsAllowedChangedFiles() {
  return [
    ...feedbackEventStoreReviewControlsRequiredChangedFiles(),
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
    "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  ];
}

function assertFeedbackEventStoreChangedFiles(changedFiles) {
  const allowedChangedFiles = feedbackEventStoreChangedFiles();
  for (const expectedFile of allowedChangedFiles) {
    assert.ok(
      changedFiles.includes(expectedFile),
      `changed files must include downstream feedback event store file: ${expectedFile}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in downstream feedback event store slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db.ts", "must not change lib/db.ts");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    if (changedFile !== "lib/db/schema.sql") {
      assert.doesNotMatch(changedFile, /^lib\/db(?:\.ts|\/)/, "must not change lib/db files");
      assert.doesNotMatch(changedFile, /schema\.sql$/, "must not change schema.sql");
      assert.doesNotMatch(changedFile, /(^|\/)(schema|migration|sql)\b/i, "must not change schema/migration/sql paths");
    }
  }
}

function feedbackEventStoreChangedFiles() {
  return [
    "types/feedback-event-store.ts",
    "lib/research-candidate-review/feedback-event-store.ts",
    "fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json",
    "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
    "lib/db/schema.sql",
    "package.json",
    "docs/00_INDEX_LATEST.md",
    "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md",
    "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
    "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
    "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
    "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
    "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
  ];
}
function assertNoForbiddenPanelPatterns() {
  const checkedSource = [
    componentSource,
    cockpitIntegrationSource,
  ].join("\n");
  for (const { label, regex } of [
    pattern(["local", "Storage"], "\\b", "\\b"),
    pattern(["session", "Storage"], "\\b", "\\b"),
    pattern(["indexed", "DB"], "\\b", "\\b"),
    pattern(["document", ".cookie"], "\\b", "\\b"),
    pattern(["fet", "ch"], "\\b", "\\s*\\("),
    pattern(["XML", "Http", "Request"], "\\b", "\\b"),
    pattern(["Web", "Socket"], "\\b", "\\b"),
    pattern(["Event", "Source"], "\\b", "\\b"),
    pattern(["navigator", ".send", "Beacon"], "\\b", "\\b"),
    pattern(["use ", "server"], "", ""),
    pattern(["action", "="], "\\b", "\\{"),
    pattern(["from ", "\"", "@/lib/db"], "", "", "i"),
    pattern(["from ", "\"", "openai"], "", "", "i"),
    pattern(["from ", "\"", "@/", "lib/", "provider"], "", "", "i"),
    pattern(["from ", "\"", "@/", "lib/", "retrieval"], "", "", "i"),
    pattern(["from ", "\"", "@/", "lib/", "source"], "", "", "i"),
    pattern(["from ", "\"", "@/", "lib/", "github"], "", "", "i"),
    pattern(["from ", "\"", "@/", "lib/", "gmail"], "", "", "i"),
    pattern(["from ", "\"", "@/", "lib/", "calendar"], "", "", "i"),
    pattern(["app", ".listen"], "\\b", "\\s*\\("),
    pattern(["next", " dev"], "\\b", "\\b", "i"),
    pattern(["CREATE", " TABLE"], "\\b", "\\b", "i"),
    pattern(["INSERT", " INTO"], "\\b", "\\b", "i"),
    pattern(["ALTER", " TABLE"], "\\b", "\\b", "i"),
    pattern(["DELETE", " FROM"], "\\b", "\\b", "i"),
    pattern(["provider", "Client"], "\\b", "\\b"),
    pattern(["retrieval", "Client"], "\\b", "\\b"),
    pattern(["rag", "Client"], "\\b", "\\b"),
    pattern(["external", "Handoff"], "\\b", "\\b"),
  ]) {
    assert.doesNotMatch(checkedSource, regex, `panel slice must not include ${label}`);
  }
}

function assertPreviewFixtureCoverage() {
  assert.equal(previewFixture.preview_version, "agent_perspective_substrate_preview.v0.1");
  const sectionKinds = new Set(
    previewFixture.folded_sections.map((section) => section.section_kind),
  );
  for (const requiredSectionKind of requiredSectionKinds) {
    assert.ok(sectionKinds.has(requiredSectionKind), `fixture section ${requiredSectionKind}`);
  }
  assert.ok(previewFixture.surfacing_cards.length >= 6, "fixture cards");
  assert.equal(previewFixture.diagnostics.product_write_stopline_respected, true);
  assert.equal(previewFixture.authority_boundary.can_execute_product_write, false);
  assert.equal(previewFixture.authority_boundary.can_execute_agents, false);
  assert.equal(previewFixture.authority_boundary.can_call_providers_or_openai, false);
  assert.equal(previewFixture.authority_boundary.can_run_retrieval_or_rag, false);
  assert.equal(previewFixture.authority_boundary.can_open_db, false);
  assert.equal(previewFixture.authority_boundary.can_execute_sql, false);
  assert.equal(previewFixture.authority_boundary.can_add_route_or_ui, false);
}

function assertDocsPointers() {
  for (const requiredText of [
    "Cockpit Agent Perspective Substrate folded audit panel v0.1",
    componentPath,
    smokePath,
    packageScriptName,
    "preview-only folded audit panel",
    "local-only folded state",
    "no persistence",
    "no route/API",
    "no DB",
    "no provider",
    "no retrieval",
    "no agent execution",
    "no product write",
    "source_refs",
    "epistemic_status",
    "review_status",
    "why_now",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Cockpit Agent Perspective Substrate folded audit panel v0\.1/);
    assert.match(doc, /folded audit panel/i);
    assert.match(doc, /static advisory input|static fixture/i);
    assert.match(doc, /no durable feedback persistence|no feedback persistence/i);
    assert.match(doc, new RegExp(nextRecommendedSlice));
    assert.match(doc, /AI Context Packet compiler GeometryDigest\/Substrate upgrade v0\.1/);
    assert.match(
      doc,
      new RegExp(downstreamAIContextPacketGeometrySubstrateUpgradeNextRecommendedSlice),
    );
    assert.match(doc, /Candidate-to-Codex handoff draft/i);
    assert.match(doc, new RegExp(downstreamCandidateToCodexHandoffDraftNextRecommendedSlice));
  }
}

function assertAdjacentSmokePointers() {
  assert.match(
    previewBuilderSmoke,
    /downstreamAgentPerspectiveSubstrateFoldedAuditPanelPackageScriptNames/,
  );
  assert.match(previewBuilderSmoke, new RegExp(packageScriptName));
  assert.match(previewBuilderSmoke, new RegExp(nextRecommendedSlice));
  assert.match(substrateSmoke, new RegExp(packageScriptName));
  assert.match(digestSmoke, new RegExp(packageScriptName));
  assert.match(aiContextSmoke, /Cockpit Agent Perspective Substrate folded audit panel v0\.1/);
  assert.match(formationReceiptSmoke, /Cockpit Agent Perspective Substrate folded audit panel v0\.1/);
  assert.match(productWriteStoplineSmoke, new RegExp(packageScriptName));
  assert.match(productWriteStoplineSmoke, /product_write_preflight_stopline_reached/);
  assert.match(
    readFileSync(smokePath, "utf8"),
    new RegExp(downstreamAIContextPacketGeometrySubstrateUpgradePackageScriptNames[0]),
  );
  assert.match(
    readFileSync(smokePath, "utf8"),
    new RegExp(downstreamAIContextPacketGeometrySubstrateUpgradeNextRecommendedSlice),
  );
  assert.match(
    readFileSync(smokePath, "utf8"),
    new RegExp(downstreamCandidateToCodexHandoffDraftPackageScriptNames[0]),
  );
  assert.match(
    readFileSync(smokePath, "utf8"),
    new RegExp(downstreamCandidateToCodexHandoffDraftNextRecommendedSlice),
  );
  assert.match(
    readFileSync(smokePath, "utf8"),
    new RegExp(downstreamCandidateToCodexHandoffDraftReviewPackageScriptNames[0]),
  );
  assert.match(
    readFileSync(smokePath, "utf8"),
    new RegExp(downstreamCandidateToCodexHandoffDraftReviewNextRecommendedSlice),
  );
  assert.match(
    readFileSync(smokePath, "utf8"),
    new RegExp(downstreamCandidateToCodexHandoffOperatorDecisionPackageScriptNames[0]),
  );
  assert.match(
    readFileSync(smokePath, "utf8"),
    new RegExp(downstreamCandidateToCodexHandoffOperatorDecisionNextRecommendedSlice),
  );
}

function readChangedFiles() {
  const baseRef = mergeBaseRef();
  return [
    ...readGitOutput(["diff", "--name-only", baseRef, "--"]).split("\n"),
    ...readGitOutput(["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ]
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();
}

function mergeBaseRef() {
  return readGitOutput(["merge-base", "origin/main", "HEAD"]).trim() || "origin/main";
}

function readGitOutput(args) {
  try {
    return execFileSync("git", args, { encoding: "utf8" });
  } catch {
    return "";
  }
}

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function extractAround(source, needle, radius) {
  const index = source.indexOf(needle);
  assert.notEqual(index, -1, `${needle} must exist`);
  return source.slice(Math.max(0, index - radius), index + needle.length + radius);
}

function extractScriptName(line) {
  return line.replace(/^\+\s*/, "").trim().match(/^"([^"]+)"/)?.[1] ?? null;
}

function arraysEqual(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function pattern(parts, prefix = "", suffix = "", flags = "") {
  const label = parts.join("");
  return {
    label,
    regex: new RegExp(`${prefix}${parts.map(escapeRegExp).join("")}${suffix}`, flags),
  };
}
