import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const typePath = "types/agent-perspective-substrate-preview.ts";
const builderPath =
  "lib/research-candidate-review/agent-perspective-substrate-preview.ts";
const substrateTypePath = "types/agent-perspective-substrate.ts";
const substrateFixturePath = "fixtures/agent-perspective-substrate.sample.v0.1.json";
const digestFixturePath =
  "fixtures/research-candidate-review.perspective-geometry-digest.sample.v0.1.json";
const manualDigestFixturePath =
  "fixtures/research-candidate-review.perspective-geometry-digest.manual-parser.sample.v0.1.json";
const previewFixturePath =
  "fixtures/agent-perspective-substrate-preview.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const substrateSmokePath = "scripts/smoke-agent-perspective-substrate-v0-1.mjs";
const digestSmokePath =
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs";
const aiContextSmokePath =
  "scripts/smoke-research-candidate-review-ai-context-packet-v0-1.mjs";
const formationReceiptSmokePath =
  "scripts/smoke-research-candidate-review-formation-receipt-v0-1.mjs";
const smokePath =
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs";
const foldedAuditPanelComponentPath =
  "components/agent-perspective-substrate-folded-audit-panel.tsx";
const foldedAuditPanelCockpitPath = "components/augnes-cockpit.tsx";
const foldedAuditPanelSmokePath =
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

const packageScriptName =
  "smoke:agent-perspective-substrate-preview-builder-v0-1";
const packageScriptValue = `node ${smokePath}`;
const downstreamAgentPerspectiveSubstrateFoldedAuditPanelPackageScriptNames = [
  "smoke:agent-perspective-substrate-folded-audit-panel-v0-1",
];
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
const previewVersion = "agent_perspective_substrate_preview.v0.1";
const previewMode = "folded_advisory_audit";
const nextRecommendedSlice =
  "cockpit_agent_perspective_substrate_folded_audit_panel_v0_1";
const downstreamFoldedAuditPanelNextRecommendedSlice =
  "ai_context_packet_compiler_geometry_substrate_upgrade_v0_1";
const downstreamAIContextPacketGeometrySubstrateUpgradeNextRecommendedSlice =
  "candidate_to_codex_handoff_draft_geometry_substrate_v0_1";
const downstreamCandidateToCodexHandoffDraftNextRecommendedSlice =
  "candidate_to_codex_handoff_draft_review_v0_1";
const downstreamCandidateToCodexHandoffDraftReviewNextRecommendedSlice =
  "candidate_to_codex_handoff_operator_decision_v0_1";
const downstreamCandidateToCodexHandoffOperatorDecisionNextRecommendedSlice =
  "feedback_event_store_minimal_v0_1";
const requiredSections = [
  "blockers",
  "warnings",
  "notices",
  "retrieval_hints",
  "handoff_improvements",
  "stale_context",
  "product_write_stopline",
  "source_coverage",
];
const requiredTypeExports = [
  "AgentPerspectiveSubstratePreview",
  "AgentPerspectiveSubstratePreviewInput",
  "AgentPerspectiveSubstratePreviewMode",
  "AgentPerspectiveSubstratePreviewSection",
  "AgentPerspectiveSurfacingPreviewCard",
  "AgentPerspectiveRulePreviewGroup",
  "AgentPerspectiveSourceCoveragePreview",
  "AgentPerspectivePreviewDiagnostics",
  "AgentPerspectivePreviewAuthorityBoundary",
  "AgentPerspectivePreviewValidationResult",
];
const expectedChangedFiles = [
  typePath,
  builderPath,
  previewFixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  substrateSmokePath,
  digestSmokePath,
  aiContextSmokePath,
  formationReceiptSmokePath,
];
const downstreamAgentPerspectiveSubstrateFoldedAuditPanelChangedFiles = [
  foldedAuditPanelComponentPath,
  foldedAuditPanelCockpitPath,
  foldedAuditPanelSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
  substrateSmokePath,
  digestSmokePath,
  aiContextSmokePath,
  formationReceiptSmokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
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
  foldedAuditPanelSmokePath,
  smokePath,
  substrateSmokePath,
  digestSmokePath,
  formationReceiptSmokePath,
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
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
  foldedAuditPanelSmokePath,
  smokePath,
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
  foldedAuditPanelSmokePath,
  smokePath,
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
  foldedAuditPanelSmokePath,
  smokePath,
  substrateSmokePath,
  digestSmokePath,
  "scripts/smoke-research-candidate-review-manual-parser-v0-1.mjs",
];

for (const filePath of [
  typePath,
  builderPath,
  substrateTypePath,
  substrateFixturePath,
  digestFixturePath,
  manualDigestFixturePath,
  previewFixturePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  substrateSmokePath,
  digestSmokePath,
  aiContextSmokePath,
  formationReceiptSmokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const typeSource = readFileSync(typePath, "utf8");
const builderSource = readFileSync(builderPath, "utf8");
const fixtureText = readFileSync(previewFixturePath, "utf8");
const previewFixture = JSON.parse(fixtureText);
const substrateFixture = readJson(substrateFixturePath);
const packageJson = readJson(packagePath);
const indexDoc = readFileSync(indexPath, "utf8");
const substrateDoc = readFileSync(substrateDocPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const substrateSmoke = readFileSync(substrateSmokePath, "utf8");
const digestSmoke = readFileSync(digestSmokePath, "utf8");
const aiContextSmoke = readFileSync(aiContextSmokePath, "utf8");
const formationReceiptSmoke = readFileSync(formationReceiptSmokePath, "utf8");

assertTypeContract();
assertBuilderSource();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertDocsPointers();
assertAdjacentSmokePointers();

const builderModule = await importBuilderModule();
const rebuiltPreview = builderModule.buildAgentPerspectiveSubstratePreview({
  substrateSnapshot: substrateFixture,
});
const rebuiltPreviewAgain = builderModule.buildAgentPerspectiveSubstratePreview({
  substrateSnapshot: substrateFixture,
});

assert.deepEqual(
  rebuiltPreview,
  previewFixture,
  "rebuilt substrate preview must match committed fixture",
);
assert.equal(
  rebuiltPreview.fingerprint,
  rebuiltPreviewAgain.fingerprint,
  "preview fingerprint must be stable across repeated builds",
);
assertPreview(rebuiltPreview);

console.log(
  JSON.stringify(
    {
      smoke: "agent-perspective-substrate-preview-builder-v0-1",
      final_status: "pass",
      preview_fingerprint: rebuiltPreview.fingerprint,
      folded_section_count: rebuiltPreview.folded_sections.length,
      surfacing_card_count: rebuiltPreview.surfacing_cards.length,
      rule_group_count: rebuiltPreview.rule_groups.length,
      next_recommended_slice: rebuiltPreview.next_recommended_slice,
      checked_advisory_preview_boundary: true,
      checked_no_runtime_route_db_provider_retrieval_agent_or_product_write:
        true,
    },
    null,
    2,
  ),
);

function assertTypeContract() {
  for (const exportName of requiredTypeExports) {
    assert.match(
      typeSource,
      new RegExp(`export\\s+(interface|type)\\s+${escapeRegExp(exportName)}\\b`),
      `type file must export ${exportName}`,
    );
  }
  for (const requiredText of [
    `"${previewMode}"`,
    `"${previewVersion}"`,
    "epistemic_status: string",
    "review_status: string",
    "execution_authority: false",
    "durable_write_authority: false",
    "route_action_available: false",
    "db_write_available: false",
    "external_call_available: false",
    "agent_execution_available: false",
    "product_write_available: false",
    "can_add_route_or_ui: false",
    "advisory_only: true",
    "preview_only: true",
    nextRecommendedSlice,
  ]) {
    assert.ok(typeSource.includes(requiredText), `type file must include ${requiredText}`);
  }
}

function assertBuilderSource() {
  for (const exportName of [
    "buildAgentPerspectiveSubstratePreview",
    "validateAgentPerspectiveSubstratePreview",
    "createAgentPerspectiveSubstratePreviewFingerprint",
  ]) {
    assert.match(
      builderSource,
      new RegExp(`export\\s+function\\s+${escapeRegExp(exportName)}\\b`),
      `builder must export ${exportName}`,
    );
  }
  const importLines = builderSource.match(/^import\s+.+$/gm) ?? [];
  assert.ok(importLines.length >= 1, "builder should import type contracts");
  for (const importLine of importLines) {
    assert.match(importLine, /^import type\b/, "builder imports must be type-only");
  }
  assert.doesNotMatch(
    builderSource,
    /^import\s+(?!type\b)/m,
    "builder must not import runtime modules",
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
  const usesDownstreamPanelDelta =
    downstreamAgentPerspectiveSubstrateFoldedAuditPanelChangedFiles.every((filePath) =>
      changedFiles.includes(filePath),
    );
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
    : usesDownstreamPanelDelta
      ? downstreamAgentPerspectiveSubstrateFoldedAuditPanelChangedFiles
      : usesDownstreamAIContextUpgradeDelta
        ? downstreamAIContextPacketGeometrySubstrateUpgradeChangedFiles
        : usesDownstreamCandidateToCodexHandoffDraftDelta
      ? downstreamCandidateToCodexHandoffDraftChangedFiles
    : expectedChangedFiles;
  const allowedDownstreamPanelComponentFiles = new Set([
    foldedAuditPanelComponentPath,
    foldedAuditPanelCockpitPath,
  ]);
  for (const expectedFile of expectedFilesForDelta) {
    assert.ok(changedFiles.includes(expectedFile), `missing changed file ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    if (
      (!usesDownstreamPanelDelta && !usesDownstreamAIContextUpgradeDelta) ||
      !allowedDownstreamPanelComponentFiles.has(changedFile)
    ) {
      assert.doesNotMatch(changedFile, /^components\//, "must not change components");
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
function assertNoForbiddenRuntimePatterns() {
  const coreSource = [typeSource, builderSource].join("\n");
  for (const { label, regex } of [
    pattern(["node", ":fs"]),
    pattern(["node", ":http"]),
    pattern(["node", ":https"]),
    pattern(["child", "_process"]),
    pattern(["from ", "\"", "@/app"], "", "", "i"),
    pattern(["from ", "\"", "@/components"], "", "", "i"),
    pattern(["from ", "\"", "@/lib/db"], "", "", "i"),
  ]) {
    assert.doesNotMatch(coreSource, regex, `preview type/builder must not include ${label}`);
  }

  const checkedSource = [
    typeSource,
    builderSource,
    fixtureText,
    readFileSync(smokePath, "utf8"),
  ].join("\n");
  for (const { label, regex } of [
    pattern(["openDatabase"], "\\b", "\\s*\\("),
    pattern(["exec", "Sql"], "\\b", "\\s*\\(", "i"),
    pattern(["execute", "Sql"], "\\b", "\\s*\\(", "i"),
    pattern(["begin", "Transaction"], "\\b", "\\b", "i"),
    pattern(["commit", "Transaction"], "\\b", "\\b", "i"),
    pattern(["rollback", "Transaction"], "\\b", "\\b", "i"),
    pattern(["fet", "ch"], "\\b", "\\s*\\("),
    pattern(["new", " OpenAI"], "\\b", "\\s*\\("),
    pattern(["provider", "Client"], "\\b", "\\b"),
    pattern(["retrieval", "Client"], "\\b", "\\b"),
    pattern(["rag", "Client"], "\\b", "\\b"),
    pattern(["source", "Fetch"], "\\b", "\\b"),
    pattern(["external", "Handoff"], "\\b", "\\b"),
    pattern(["local", "Storage"], "\\b", "\\b"),
    pattern(["session", "Storage"], "\\b", "\\b"),
    pattern(["indexed", "DB"], "\\b", "\\b"),
    pattern(["document", ".cookie"], "\\b", "\\b"),
    pattern(["app", ".listen"], "\\b", "\\s*\\("),
    pattern(["next", " dev"], "\\b", "\\b", "i"),
    pattern(["product", "Write", "Handler"], "\\b", "\\b"),
  ]) {
    assert.doesNotMatch(
      checkedSource,
      regex,
      `new preview files must not include ${label}`,
    );
  }
}

function assertDocsPointers() {
  for (const requiredText of [
    "Agent Perspective Substrate Preview Builder v0.1",
    typePath,
    builderPath,
    previewFixturePath,
    smokePath,
    packageScriptName,
    "folded-by-default advisory audit preview",
    "source_refs",
    "epistemic_status",
    "review_status",
    "why_now",
    "no runtime route/UI yet",
    "Agent Perspective Substrate v0.1",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Agent Perspective Substrate Preview Builder v0\.1/);
    assert.match(doc, /folded-by-default/i);
    assert.match(doc, /non-authoritative|not source of truth/i);
    assert.match(doc, /no route\/UI|no runtime route\/UI/i);
    assert.match(doc, new RegExp(nextRecommendedSlice));
    assert.match(doc, /Cockpit Agent Perspective Substrate folded audit panel v0\.1/);
    assert.match(doc, new RegExp(downstreamFoldedAuditPanelNextRecommendedSlice));
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
    substrateSmoke,
    /downstreamAgentPerspectiveSubstratePreviewPackageScriptNames/,
    "#688 substrate smoke must allow downstream preview-builder package script",
  );
  assert.match(substrateSmoke, new RegExp(nextRecommendedSlice));
  assert.match(
    digestSmoke,
    /downstreamAgentPerspectiveSubstratePreviewPackageScriptNames/,
    "#687 digest smoke must allow downstream preview-builder package script",
  );
  assert.match(
    readFileSync(smokePath, "utf8"),
    /downstreamAgentPerspectiveSubstrateFoldedAuditPanelPackageScriptNames/,
    "#689 preview-builder smoke must allow downstream folded audit panel package script",
  );
  assert.match(
    readFileSync(smokePath, "utf8"),
    new RegExp(downstreamFoldedAuditPanelNextRecommendedSlice),
  );
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
  for (const source of [aiContextSmoke, formationReceiptSmoke]) {
    assert.match(source, /Agent Perspective Substrate Preview Builder v0\.1/);
    assert.match(source, new RegExp(nextRecommendedSlice));
    assert.match(source, /Cockpit Agent Perspective Substrate folded audit panel v0\.1/);
    assert.match(source, new RegExp(downstreamFoldedAuditPanelNextRecommendedSlice));
    assert.match(source, /AI Context Packet compiler GeometryDigest\/Substrate upgrade v0\.1/);
    assert.match(
      source,
      new RegExp(downstreamAIContextPacketGeometrySubstrateUpgradeNextRecommendedSlice),
    );
  }
}

function assertPreview(preview) {
  assert.equal(preview.runtime, "augnes");
  assert.equal(preview.preview_version, previewVersion);
  assert.equal(preview.preview_mode, previewMode);
  assert.equal(preview.scope, substrateFixture.scope);
  assert.ok(preview.as_of.startsWith("fixture:"), "preview as_of must be deterministic");
  assert.ok(preview.source_substrate_ref, "source substrate ref must exist");
  assert.deepEqual(
    preview.source_digest_refs,
    substrateFixture.source_inputs.perspective_geometry_digest_refs.slice().sort(),
    "source digest refs must derive from substrate fixture",
  );
  assert.match(preview.fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(preview.recommendation_status, "ready_for_cockpit_folded_audit_panel");
  assert.equal(preview.next_recommended_slice, nextRecommendedSlice);
  assert.equal(preview.validation.passed, true);
  assert.deepEqual(preview.validation.failure_codes, []);

  const sectionKinds = new Set(preview.folded_sections.map((section) => section.section_kind));
  for (const requiredSection of requiredSections) {
    assert.ok(sectionKinds.has(requiredSection), `missing section ${requiredSection}`);
  }
  for (const section of preview.folded_sections) {
    assert.equal(section.folded_by_default, true, `${section.section_id} folded`);
    assert.equal(section.preview_only, true, `${section.section_id} preview only`);
    assert.equal(typeof section.item_count, "number", `${section.section_id} count`);
    assert.ok(Array.isArray(section.authority_boundary_notes));
  }

  assert.ok(preview.surfacing_cards.length >= 6, "preview must include surfacing cards");
  assert.ok(
    preview.surfacing_cards.some((card) => card.severity === "blocker"),
    "preview must include a blocker card",
  );
  assert.ok(
    preview.surfacing_cards.some((card) => card.severity === "warning"),
    "preview must include a warning card",
  );
  assert.ok(
    preview.surfacing_cards.some((card) => card.card_kind === "retrieval_hint"),
    "preview must include a retrieval hint card",
  );
  assert.ok(
    preview.surfacing_cards.some(
      (card) => card.card_kind === "handoff_improvement_suggestion",
    ),
    "preview must include a handoff improvement card",
  );
  const productWriteStoplineCard = preview.surfacing_cards.find(
    (card) => card.card_kind === "product_write_stopline_reminder",
  );
  assert.ok(productWriteStoplineCard, "preview must include product write stopline card");
  assert.equal(productWriteStoplineCard.product_write_available, false);

  for (const card of preview.surfacing_cards) {
    assert.ok(card.epistemic_status, `${card.card_id} epistemic status`);
    assert.ok(card.review_status, `${card.card_id} review status`);
    assert.ok(card.why_now, `${card.card_id} why_now`);
    assert.ok(
      hasSourceRefs(card) || Boolean(card.source_coverage_boundary_note),
      `${card.card_id} must include source refs or boundary note`,
    );
    assert.ok(
      Array.isArray(card.authority_boundary_notes) &&
        card.authority_boundary_notes.length > 0,
      `${card.card_id} authority boundary notes`,
    );
    assert.equal(card.execution_authority, false, `${card.card_id} execution`);
    assert.equal(card.durable_write_authority, false, `${card.card_id} durable write`);
    assert.equal(card.route_action_available, false, `${card.card_id} route`);
    assert.equal(card.db_write_available, false, `${card.card_id} DB`);
    assert.equal(card.external_call_available, false, `${card.card_id} external`);
    assert.equal(card.agent_execution_available, false, `${card.card_id} agent`);
    assert.equal(card.product_write_available, false, `${card.card_id} product write`);
    if (card.card_kind === "retrieval_hint") {
      assert.ok(
        card.retrieval_executed_now === false ||
          card.retrieval_executed_now === undefined,
        `${card.card_id} retrieval execution`,
      );
    }
  }

  assert.ok(preview.rule_groups.length > 0, "preview must include rule groups");
  assert.equal(
    preview.source_coverage_preview.cards_missing_source_refs_without_boundary_note_count,
    0,
    "source coverage must have no missing refs without boundary notes",
  );
  assertDiagnostics(preview);
  assertAuthorityBoundary(preview.authority_boundary);
  assertNoTrueAuthority(
    preview,
    /execution_authority|durable_write_authority|route_action_available|db_write_available|external_call_available|agent_execution_available|product_write_available|can_commit_or_reject_state|can_record_proof|can_create_evidence|can_update_work|can_create_work_item|can_execute_agents|can_route_agents|can_call_external_services|can_call_providers_or_openai|can_run_retrieval_or_rag|can_fetch_sources|can_promote_perspective|can_allocate_product_ids|can_execute_product_write|can_open_db|can_execute_sql|can_execute_transaction|can_add_route_or_ui/,
  );
}

function assertDiagnostics(preview) {
  const diagnostics = preview.diagnostics;
  assert.equal(diagnostics.folded_section_count, preview.folded_sections.length);
  assert.equal(diagnostics.surfacing_card_count, preview.surfacing_cards.length);
  assert.equal(
    diagnostics.blocker_card_count,
    preview.surfacing_cards.filter((card) => card.severity === "blocker").length,
  );
  assert.equal(
    diagnostics.warning_card_count,
    preview.surfacing_cards.filter((card) => card.severity === "warning").length,
  );
  assert.equal(
    diagnostics.notice_card_count,
    preview.surfacing_cards.filter((card) => card.severity === "notice").length,
  );
  assert.equal(
    diagnostics.info_card_count,
    preview.surfacing_cards.filter((card) => card.severity === "info").length,
  );
  assert.equal(
    diagnostics.retrieval_hint_card_count,
    preview.surfacing_cards.filter((card) => card.card_kind === "retrieval_hint").length,
  );
  assert.equal(
    diagnostics.handoff_improvement_card_count,
    preview.surfacing_cards.filter(
      (card) => card.card_kind === "handoff_improvement_suggestion",
    ).length,
  );
  assert.equal(
    diagnostics.stale_context_card_count,
    preview.surfacing_cards.filter((card) => card.card_kind === "stale_context_notice")
      .length,
  );
  assert.equal(
    diagnostics.product_write_stopline_card_count,
    preview.surfacing_cards.filter(
      (card) => card.card_kind === "product_write_stopline_reminder",
    ).length,
  );
  for (const [key, value] of Object.entries(diagnostics)) {
    if (typeof value === "number") {
      assert.ok(Number.isFinite(value), `${key} must be finite`);
    }
  }
  assert.equal(diagnostics.product_write_stopline_respected, true);
  assert.equal(diagnostics.substrate_consumed_as_advisory, true);
  assert.equal(diagnostics.preview_is_authority, false);
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.derived_view_only, true);
  assert.equal(boundary.source_of_truth, false);
  for (const forbiddenKey of [
    "can_commit_or_reject_state",
    "can_record_proof",
    "can_create_evidence",
    "can_update_work",
    "can_create_work_item",
    "can_execute_agents",
    "can_route_agents",
    "can_call_external_services",
    "can_call_providers_or_openai",
    "can_run_retrieval_or_rag",
    "can_fetch_sources",
    "can_promote_perspective",
    "can_allocate_product_ids",
    "can_execute_product_write",
    "can_open_db",
    "can_execute_sql",
    "can_execute_transaction",
    "can_add_route_or_ui",
  ]) {
    assert.equal(boundary[forbiddenKey], false, `${forbiddenKey} must be false`);
  }
  assert.equal(boundary.advisory_only, true);
  assert.equal(boundary.preview_only, true);
}

async function importBuilderModule() {
  const transformedSource = stripTypeScriptTypes(builderSource, {
    mode: "transform",
  });
  return import(
    `data:text/javascript;charset=utf-8,${encodeURIComponent(transformedSource)}`
  );
}

function hasSourceRefs(value) {
  return Array.isArray(value.source_refs) && value.source_refs.length > 0;
}

function assertNoTrueAuthority(value, forbiddenKeyPattern, pathSegments = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoTrueAuthority(item, forbiddenKeyPattern, [...pathSegments, String(index)]),
    );
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, nestedValue] of Object.entries(value)) {
    const nextPath = [...pathSegments, key];
    if (forbiddenKeyPattern.test(key) && !key.endsWith("_count")) {
      assert.equal(nestedValue, false, `${nextPath.join(".")} must be false`);
    }
    assertNoTrueAuthority(nestedValue, forbiddenKeyPattern, nextPath);
  }
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
