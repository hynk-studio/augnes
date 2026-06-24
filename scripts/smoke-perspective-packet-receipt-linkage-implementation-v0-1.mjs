import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const builderPath =
  "lib/research-candidate-review/perspective-packet-receipt-linkage.ts";
const contractTypePath =
  "types/perspective-packet-receipt-linkage-contract.ts";
const contractFixturePath =
  "fixtures/research-candidate-review.perspective-packet-receipt-linkage-contract.sample.v0.1.json";
const implementationFixturePath =
  "fixtures/research-candidate-review.perspective-packet-receipt-linkage-implementation.sample.v0.1.json";
const smokePath =
  "scripts/smoke-perspective-packet-receipt-linkage-implementation-v0-1.mjs";
const contractSmokePath =
  "scripts/smoke-perspective-packet-receipt-linkage-contract-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:perspective-packet-receipt-linkage-implementation-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-packet-receipt-linkage-implementation-v0-1.mjs";
const implementationKind =
  "perspective_packet_receipt_linkage_implementation";
const implementationVersion =
  "perspective_packet_receipt_linkage_implementation.v0.1";
const previewVersion = "perspective_packet_receipt_linkage_preview.v0.1";
const recommendationStatus =
  "ready_for_perspective_packet_receipt_linkage_browser_validation_v0_1";
const nextRecommendedSlice =
  "perspective_packet_receipt_linkage_browser_validation_v0_1";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.perspective-packet-receipt-linkage-browser-validation.sample.v0.1.json";
const browserValidationSmokePath =
  "scripts/smoke-perspective-packet-receipt-linkage-browser-validation-v0-1.mjs";
const browserValidationPackageScriptName =
  "smoke:perspective-packet-receipt-linkage-browser-validation-v0-1";
const browserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-perspective-packet-receipt-linkage-browser-validation-v0-1.mjs";
const browserValidationVersion =
  "perspective_packet_receipt_linkage_browser_validation.v0.1";
const browserValidationRecommendationStatus =
  "ready_for_agent_perspective_substrate_feedback_loop_contract_v0_1";
const browserValidationNextRecommendedSlice =
  "agent_perspective_substrate_feedback_loop_contract_v0_1";
const feedbackLoopContractTypePath =
  "types/agent-perspective-substrate-feedback-loop-contract.ts";
const feedbackLoopContractFixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-contract.sample.v0.1.json";
const feedbackLoopContractSmokePath =
  "scripts/smoke-agent-perspective-substrate-feedback-loop-contract-v0-1.mjs";
const feedbackLoopContractPackageScriptName =
  "smoke:agent-perspective-substrate-feedback-loop-contract-v0-1";
const feedbackLoopContractPackageScriptValue =
  "node scripts/smoke-agent-perspective-substrate-feedback-loop-contract-v0-1.mjs";
const feedbackLoopContractVersion =
  "agent_perspective_substrate_feedback_loop_contract.v0.1";
const feedbackLoopContractRecommendationStatus =
  "ready_for_agent_perspective_substrate_feedback_loop_implementation_v0_1";
const feedbackLoopContractNextRecommendedSlice =
  "agent_perspective_substrate_feedback_loop_implementation_v0_1";
const agentPerspectiveSubstrateFeedbackLoopImplementationBuilderPath =
  "lib/research-candidate-review/agent-perspective-substrate-feedback-loop.ts";
const agentPerspectiveSubstrateFeedbackLoopImplementationFixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-implementation.sample.v0.1.json";
const agentPerspectiveSubstrateFeedbackLoopImplementationSmokePath =
  "scripts/smoke-agent-perspective-substrate-feedback-loop-implementation-v0-1.mjs";
const agentPerspectiveSubstrateFeedbackLoopImplementationPackageScriptName =
  "smoke:agent-perspective-substrate-feedback-loop-implementation-v0-1";
const agentPerspectiveSubstrateFeedbackLoopImplementationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-agent-perspective-substrate-feedback-loop-implementation-v0-1.mjs";
const agentPerspectiveSubstrateFeedbackLoopImplementationVersion =
  "agent_perspective_substrate_feedback_loop_implementation.v0.1";
const agentPerspectiveSubstrateFeedbackLoopImplementationRecommendationStatus =
  "ready_for_agent_perspective_substrate_feedback_loop_browser_validation_v0_1";
const agentPerspectiveSubstrateFeedbackLoopImplementationNextRecommendedSlice =
  "agent_perspective_substrate_feedback_loop_browser_validation_v0_1";
const agentPerspectiveSubstrateFeedbackLoopBrowserValidationFixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-browser-validation.sample.v0.1.json";
const agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath =
  "scripts/smoke-agent-perspective-substrate-feedback-loop-browser-validation-v0-1.mjs";
const agentPerspectiveSubstrateFeedbackLoopBrowserValidationPackageScriptName =
  "smoke:agent-perspective-substrate-feedback-loop-browser-validation-v0-1";
const agentPerspectiveSubstrateFeedbackLoopBrowserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-agent-perspective-substrate-feedback-loop-browser-validation-v0-1.mjs";
const agentPerspectiveSubstrateFeedbackLoopBrowserValidationVersion =
  "agent_perspective_substrate_feedback_loop_browser_validation.v0.1";
const agentPerspectiveSubstrateFeedbackLoopBrowserValidationRecommendationStatus =
  "ready_for_agent_perspective_substrate_feedback_loop_closeout_v0_1";
const agentPerspectiveSubstrateFeedbackLoopBrowserValidationNextRecommendedSlice =
  "agent_perspective_substrate_feedback_loop_closeout_v0_1";
const agentPerspectiveSubstrateFeedbackLoopCloseoutFixturePath =
  "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-closeout.sample.v0.1.json";
const agentPerspectiveSubstrateFeedbackLoopCloseoutSmokePath =
  "scripts/smoke-agent-perspective-substrate-feedback-loop-closeout-v0-1.mjs";
const agentPerspectiveSubstrateFeedbackLoopCloseoutPackageScriptName =
  "smoke:agent-perspective-substrate-feedback-loop-closeout-v0-1";
const agentPerspectiveSubstrateFeedbackLoopCloseoutPackageScriptValue =
  "node scripts/smoke-agent-perspective-substrate-feedback-loop-closeout-v0-1.mjs";
const agentPerspectiveSubstrateFeedbackLoopCloseoutVersion =
  "agent_perspective_substrate_feedback_loop_closeout.v0.1";
const agentPerspectiveSubstrateFeedbackLoopCloseoutRecommendationStatus =
  "ready_for_dogfooding_research_to_perspective_ci_expansion_contract_v0_1";
const agentPerspectiveSubstrateFeedbackLoopCloseoutNextRecommendedSlice =
  "dogfooding_research_to_perspective_ci_expansion_contract_v0_1";
const writeFixture = process.argv.includes("--write-fixture");
let cachedMergeBaseRef = null;

const downstreamSmokePaths = [
  "scripts/smoke-ai-context-packet-browser-validation-v0-1.mjs",
  "scripts/smoke-ai-context-packet-contract-v0-1.mjs",
  "scripts/smoke-ai-context-packet-implementation-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-browser-validation-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-contract-v0-1.mjs",
  "scripts/smoke-bounded-external-source-intake-implementation-v0-1.mjs",
  "scripts/smoke-codex-handoff-draft-browser-validation-v0-1.mjs",
  "scripts/smoke-codex-handoff-draft-contract-v0-1.mjs",
  "scripts/smoke-codex-handoff-draft-implementation-v0-1.mjs",
  "scripts/smoke-durable-perspective-state-trajectory-browser-validation-v0-1.mjs",
  "scripts/smoke-durable-perspective-state-trajectory-contract-v0-1.mjs",
  "scripts/smoke-durable-perspective-state-trajectory-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-aggregation-read-model-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs",
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs",
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs",
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-browser-validation-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-contract-v0-1.mjs",
  "scripts/smoke-formation-receipt-durable-event-implementation-v0-1.mjs",
  "scripts/smoke-human-reviewed-durable-perspective-promotion-browser-validation-v0-1.mjs",
  "scripts/smoke-human-reviewed-durable-perspective-promotion-contract-v0-1.mjs",
  "scripts/smoke-human-reviewed-durable-perspective-promotion-implementation-v0-1.mjs",
  "scripts/smoke-non-authoritative-retrieval-rag-browser-validation-v0-1.mjs",
  "scripts/smoke-non-authoritative-retrieval-rag-contract-v0-1.mjs",
  "scripts/smoke-non-authoritative-retrieval-rag-implementation-v0-1.mjs",
  "scripts/smoke-operator-source-candidate-generation-browser-validation-v0-1.mjs",
  "scripts/smoke-operator-source-candidate-generation-contract-v0-1.mjs",
  "scripts/smoke-operator-source-candidate-generation-implementation-v0-1.mjs",
  "scripts/smoke-perspective-geometry-digest-browser-validation-v0-1.mjs",
  "scripts/smoke-perspective-geometry-digest-contract-v0-1.mjs",
  "scripts/smoke-perspective-geometry-digest-implementation-v0-1.mjs",
  "scripts/smoke-project-constellation-runtime-layout-browser-validation-v0-1.mjs",
  "scripts/smoke-project-constellation-runtime-layout-contract-v0-1.mjs",
  "scripts/smoke-project-constellation-runtime-layout-implementation-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-browser-validation-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-contract-v0-1.mjs",
  "scripts/smoke-recent-rehearsal-buffer-implementation-v0-1.mjs",
  "scripts/smoke-salience-governor-browser-validation-v0-1.mjs",
  "scripts/smoke-salience-governor-contract-v0-1.mjs",
  "scripts/smoke-salience-governor-implementation-v0-1.mjs",
];

const expectedChangedFiles = [
  builderPath,
  implementationFixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  contractSmokePath,
  ...downstreamSmokePaths,
];

const protectedUnchangedPaths = [
  contractTypePath,
  contractFixturePath,
  "fixtures/research-candidate-review.codex-handoff-draft-browser-validation.sample.v0.1.json",
  "types/codex-handoff-draft-contract.ts",
  "fixtures/research-candidate-review.codex-handoff-draft-contract.sample.v0.1.json",
  "lib/research-candidate-review/codex-handoff-draft.ts",
  "fixtures/research-candidate-review.codex-handoff-draft-implementation.sample.v0.1.json",
  "types/ai-context-packet-contract.ts",
  "fixtures/research-candidate-review.ai-context-packet-contract.sample.v0.1.json",
  "lib/research-candidate-review/ai-context-packet.ts",
  "fixtures/research-candidate-review.ai-context-packet-implementation.sample.v0.1.json",
  "types/perspective-geometry-digest-contract.ts",
  "fixtures/research-candidate-review.perspective-geometry-digest-contract.sample.v0.1.json",
  "lib/research-candidate-review/perspective-geometry-digest.ts",
  "fixtures/research-candidate-review.perspective-geometry-digest-implementation.sample.v0.1.json",
  "lib/db/schema.sql",
];

for (const filePath of [
  builderPath,
  contractTypePath,
  contractFixturePath,
  smokePath,
  contractSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}
if (!writeFixture) {
  assert.ok(existsSync(implementationFixturePath), `${implementationFixturePath} must exist`);
}

const builderSource = readFile(builderPath);
const smokeSource = readFile(smokePath);
const contractSmokeSource = readFile(contractSmokePath);
const contractTypeSource = readFile(contractTypePath);
const contractFixture = readJson(contractFixturePath);
const packageJson = readJson(packagePath);
const basePackageJson = readJsonFromGit(packagePath);
const indexDoc = readFile(indexPath);
const substrateDoc = readFile(substrateDocPath);
const surfaceDoc = readFile(surfaceDocPath);
const gateDoc = readFile(gateDocPath);

const {
  buildPerspectivePacketReceiptLinkageImplementationFixture,
  buildPerspectivePacketReceiptLinkagePreviewBundle,
  validatePerspectivePacketReceiptLinkagePreviewBundle,
  createPerspectivePacketReceiptLinkageFingerprint,
} = await import("../lib/research-candidate-review/perspective-packet-receipt-linkage.ts");

const sourceContractRef =
  `${contractFixture.contract_version}:${contractFixturePath}`;
const rebuiltImplementationFixture =
  buildPerspectivePacketReceiptLinkageImplementationFixture({
    perspective_packet_receipt_linkage_contract: contractFixture,
    source_contract_ref: sourceContractRef,
  });

if (writeFixture) {
  writeFileSync(
    implementationFixturePath,
    `${JSON.stringify(rebuiltImplementationFixture, null, 2)}\n`,
  );
  process.exit(0);
}

const fixture = readJson(implementationFixturePath);

assertContractArtifactsUnchanged();
assertRequiredExports();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenRuntimePatterns();
assertImplementationFixture(fixture);
assertPreviewBundle(
  fixture.built_perspective_packet_receipt_linkage_preview_bundle,
);
assertValidatedImplementation(fixture.validated_implementation);
assertImplementationAuthorityBoundary(fixture.authority_boundary);
assertInvalidOverrideCoverage();
assertDocsPointers();
assertContractSmokeDownstreamPointer();
assertBrowserValidationDownstreamPointer();
assertPortableMergeBaseFallback();
assert.deepEqual(
  fixture,
  rebuiltImplementationFixture,
  "rebuilt Perspective Packet Receipt Linkage implementation fixture must match committed fixture",
);

console.log(
  JSON.stringify(
    {
      smoke: "perspective-packet-receipt-linkage-implementation-v0-1",
      final_status: "pass",
      implementation_kind: fixture.implementation_kind,
      implementation_version: fixture.implementation_version,
      source_contract_fingerprint: fixture.source_contract_fingerprint,
      preview_bundle_follows_contract:
        fixture.validated_implementation.preview_bundle_follows_contract,
      linkage_principles_preserved:
        fixture.validated_implementation.linkage_principles_preserved,
      linkage_section_families_preserved:
        fixture.validated_implementation.linkage_section_families_preserved,
      runtime_linkage_build_not_implemented:
        fixture.validated_implementation.runtime_linkage_build_not_implemented,
      linkage_record_write_not_implemented:
        fixture.validated_implementation.linkage_record_write_not_implemented,
      formation_receipt_write_not_implemented:
        fixture.validated_implementation.formation_receipt_write_not_implemented,
      codex_execution_now_false:
        fixture.validated_implementation.codex_execution_now_false,
      github_pr_creation_now_false:
        fixture.validated_implementation.github_pr_creation_now_false,
      product_write_not_implemented:
        fixture.validated_implementation.product_write_not_implemented,
      next_recommended_slice: fixture.next_recommended_slice,
    },
    null,
    2,
  ),
);

function assertContractArtifactsUnchanged() {
  assert.deepEqual(
    contractFixture,
    readJsonFromGit(contractFixturePath),
    "#748 Perspective Packet Receipt Linkage contract fixture must not change",
  );
  assert.equal(
    contractTypeSource,
    readTextFromGit(contractTypePath),
    "#748 Perspective Packet Receipt Linkage type contract must not change",
  );
}

function assertRequiredExports() {
  for (const exportName of [
    "buildPerspectivePacketReceiptLinkageImplementationFixture",
    "buildPerspectivePacketReceiptLinkagePreviewBundle",
    "validatePerspectivePacketReceiptLinkagePreviewBundle",
    "createPerspectivePacketReceiptLinkageFingerprint",
  ]) {
    assert.ok(
      builderSource.includes(`export function ${exportName}`),
      `${builderPath} must export ${exportName}`,
    );
  }
}

function assertPackageScript() {
  if (dogfoodingResearchToPerspectiveCiExpansionContractSliceActive()) {
    assertDogfoodingResearchToPerspectiveCiExpansionContractPackageScript();
    return;
  }
  if (agentPerspectiveSubstrateFeedbackLoopCloseoutSliceActive()) {
    assertAgentPerspectiveSubstrateFeedbackLoopCloseoutPackageScript();
    return;
  }
  if (agentPerspectiveSubstrateFeedbackLoopBrowserValidationSliceActive()) {
    assertAgentPerspectiveSubstrateFeedbackLoopBrowserValidationPackageScript();
    return;
  }
  if (agentPerspectiveSubstrateFeedbackLoopImplementationSliceActive()) {
    assertAgentPerspectiveSubstrateFeedbackLoopImplementationPackageScript();
    return;
  }
  if (feedbackLoopContractSliceActive()) {
    assertFeedbackLoopContractPackageScript();
    return;
  }
  if (browserValidationSliceActive()) {
    assertBrowserValidationPackageScript();
    return;
  }
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
    .map((line) => line.match(/^\+\s+"([^"]+)"\s*:/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
  assert.deepEqual(
    addedScriptNames,
    [packageScriptName],
    "package.json must add only the Perspective Packet Receipt Linkage implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  if (dogfoodingResearchToPerspectiveCiExpansionContractSliceActive()) {
    assertDogfoodingResearchToPerspectiveCiExpansionContractChangedFiles(changedFiles);
    return;
  }
  if (agentPerspectiveSubstrateFeedbackLoopCloseoutSliceActive()) {
    assertAgentPerspectiveSubstrateFeedbackLoopCloseoutChangedFiles(changedFiles);
    return;
  }
  if (agentPerspectiveSubstrateFeedbackLoopBrowserValidationSliceActive()) {
    assertAgentPerspectiveSubstrateFeedbackLoopBrowserValidationChangedFiles(changedFiles);
    return;
  }
  if (agentPerspectiveSubstrateFeedbackLoopImplementationSliceActive()) {
    assertAgentPerspectiveSubstrateFeedbackLoopImplementationChangedFiles(changedFiles);
    return;
  }
  if (feedbackLoopContractSliceActive()) {
    assertFeedbackLoopContractChangedFiles(changedFiles);
    return;
  }
  if (browserValidationSliceActive()) {
    assertBrowserValidationChangedFiles(changedFiles);
    return;
  }
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const unchangedPath of protectedUnchangedPaths) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Perspective Packet Receipt Linkage implementation slice must not change ${unchangedPath}`,
    );
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedChangedFiles.includes(changedFile),
      `unexpected changed file in Perspective Packet Receipt Linkage implementation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function assertNoForbiddenRuntimePatterns() {
  if (dogfoodingResearchToPerspectiveCiExpansionContractSliceActive()) {
    return;
  }
  const changedCodeFiles = readChangedFiles().filter(
    (filePath) =>
      (filePath.endsWith(".ts") || filePath.endsWith(".mjs")) &&
      filePath !== smokePath &&
      filePath !== contractSmokePath &&
      filePath !== browserValidationSmokePath &&
      filePath !== feedbackLoopContractTypePath &&
      filePath !== feedbackLoopContractSmokePath &&
      filePath !== agentPerspectiveSubstrateFeedbackLoopImplementationBuilderPath &&
      filePath !== agentPerspectiveSubstrateFeedbackLoopImplementationSmokePath &&
      filePath !== agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath &&
      filePath !== agentPerspectiveSubstrateFeedbackLoopCloseoutSmokePath &&
      !downstreamSmokePaths.includes(filePath),
  );
  for (const filePath of changedCodeFiles) {
    const stripped = stripNonCode(readFile(filePath));
    assert.doesNotMatch(stripped, /\bfetch\s*\(/, `${filePath} must not call fetch`);
    assert.doesNotMatch(stripped, /\bXMLHttpRequest\b|\bEventSource\b|\bWebSocket\b/, `${filePath} must not call browser request APIs`);
    assert.doesNotMatch(stripped, /\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b|\bdocument\.cookie\b/, `${filePath} must not use browser persistence`);
    assert.doesNotMatch(stripped, /\brequestAnimationFrame\s*\(/, `${filePath} must not use requestAnimationFrame`);
    assert.doesNotMatch(stripped, /from\s+["'][^"']*openai[^"']*["']|\bnew\s+OpenAI\b/i, `${filePath} must not import OpenAI`);
    assert.doesNotMatch(stripped, /from\s+["'][^"']*(?:octokit|github)[^"']*["']|\bcreatePullRequest\b|\bgh\s+pr\b/i, `${filePath} must not implement GitHub automation`);
    assert.doesNotMatch(stripped, /\bexecuteCodex\b|\bspawnCodex\b|\brunCodex\b/i, `${filePath} must not execute Codex`);
    assert.doesNotMatch(stripped, /\bgit\s+(?:branch|checkout|switch|commit)\b|\bcreateBranch\b|\bcreateCommit\b/i, `${filePath} must not implement git branch or commit creation`);
    assert.doesNotMatch(stripped, /\brouteAgent\b|\bexecuteAgent\b|\bagentRouter\b/i, `${filePath} must not route or execute agents`);
    assert.doesNotMatch(stripped, /\bbuildRuntimeLinkage\b|\bwriteLinkageRecord\b|\bdurableAuditLog\b/i, `${filePath} must not implement linkage runtime or audit writes`);
    assert.doesNotMatch(stripped, /\bformationReceipt.*(?:insert|write|mutate|update)\b/i, `${filePath} must not write Formation Receipt`);
    assert.doesNotMatch(stripped, /\bcreateEmbedding\b|\bembeddingModel\b|\bvector(?:Db|Store|Index)\b|\bfts\b/i, `${filePath} must not implement embedding/vector/FTS behavior`);
    assert.doesNotMatch(stripped, /\bdb\.(?:query|insert|update|delete|execute)|\bprisma\.|\bsql`|\bproductionDb\b/i, `${filePath} must not query or write DB`);
    assert.doesNotMatch(stripped, /\bcreateEvidence\b|\bwriteEvidence\b|\bacceptedEvidence\b/i, `${filePath} must not write proof/evidence`);
    assert.doesNotMatch(stripped, /\bpromotePerspective\b|\bpromotionDecision\b/i, `${filePath} must not implement Perspective promotion`);
    assert.doesNotMatch(stripped, /\bproductId\b|\bproduct_id\b|\bwriteProduct\b/i, `${filePath} must not implement product writes or IDs`);
  }
  assert.doesNotMatch(builderSource, /from\s+["'][^"']*(?:openai|octokit|github)[^"']*["']/i);
  assert.doesNotMatch(builderSource, /\bfetch\s*\(/);
}

function assertImplementationFixture(value) {
  assert.equal(value.implementation_kind, implementationKind);
  assert.equal(value.implementation_version, implementationVersion);
  assert.equal(value.source_contract_ref, sourceContractRef);
  assert.equal(value.source_contract_fingerprint, contractFixture.contract_fingerprint);
  assert.equal(value.implemented_contract.contract_kind, contractFixture.contract_kind);
  assert.equal(value.implemented_contract.contract_version, contractFixture.contract_version);
  assert.equal(value.implemented_contract.contract_fixture_path, contractFixturePath);
  assert.equal(value.implemented_contract.type_contract_path, contractTypePath);
  for (const key of [
    "contract_authority_boundary_preserved",
    "contract_validation_policy_preserved",
    "contract_linkage_principles_preserved",
    "contract_linkage_section_families_preserved",
    "contract_forbidden_actions_policy_preserved",
  ]) {
    assert.equal(value.implemented_contract[key], true, `${key} must be true`);
  }
  assert.equal(value.deterministic_builder.builder_path, builderPath);
  assert.equal(value.deterministic_builder.deterministic_fixture_backed_only, true);
  for (const [key, flag] of Object.entries(value.deterministic_builder)) {
    if (key === "builder_path" || key === "deterministic_fixture_backed_only") continue;
    assert.equal(flag, false, `deterministic_builder.${key} must be false`);
  }
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(
    value.implementation_fingerprint,
    createPerspectivePacketReceiptLinkageFingerprint(value),
  );
}

function assertPreviewBundle(bundle) {
  assert.equal(bundle.preview_version, previewVersion);
  assert.equal(bundle.source_contract_ref, sourceContractRef);
  assert.deepEqual(
    bundle.authority_boundary,
    contractFixture.authority_boundary,
    "preview authority_boundary must deep-equal #748 contract authority_boundary",
  );
  assert.deepEqual(bundle.validation_policy, contractFixture.validation_policy);
  assert.deepEqual(
    bundle.forbidden_actions_policy,
    contractFixture.forbidden_actions_policy,
  );
  assert.equal(bundle.authority_boundary.implementation_added_now, false);
  assert.equal(bundle.authority_boundary.deterministic_builder_added_now, undefined);
  assert.deepEqual(
    bundle.linkage_input_preview,
    contractFixture.sample_perspective_packet_receipt_linkage_preview.linkage_input_preview,
  );
  assert.deepEqual(
    bundle.linkage_preview,
    contractFixture.sample_perspective_packet_receipt_linkage_preview.linkage_preview,
  );
  assert.deepEqual(
    bundle.linkage_principle_summary.product_write_lane_parked_by_686,
    true,
  );
  assert.equal(
    bundle.linkage_section_family_summary.linkage_section_family_count,
    contractFixture.linkage_section_families.length,
  );
  assert.equal(bundle.forbidden_actions_summary.no_linkage_record_write, true);
  assert.equal(bundle.reference_summary.public_safe_refs_only, true);
  assert.equal(bundle.validation.passed, true);
}

function assertValidatedImplementation(value) {
  const requiredTrueFlags = [
    "preview_bundle_follows_contract",
    "preview_bundle_authority_boundary_matches_contract",
    "preview_bundle_validation_policy_matches_contract",
    "preview_bundle_forbidden_actions_policy_matches_contract",
    "top_level_implementation_boundary_is_separate",
    "linkage_input_fields_preserved",
    "linkage_output_fields_preserved",
    "linkage_principles_preserved",
    "linkage_section_families_preserved",
    "forbidden_actions_policy_preserved",
    "linkage_is_provenance_not_execution_authority",
    "linkage_is_derived_public_safe_advisory_only",
    "linkage_not_source_of_truth",
    "linkage_not_proof_or_evidence",
    "linkage_not_completion_proof",
    "linkage_not_durable_perspective_state",
    "linkage_not_work_status",
    "linkage_not_product_write",
    "linkage_does_not_prove_codex_ran",
    "linkage_does_not_prove_pr_created",
    "linkage_does_not_prove_validation_passed",
    "linkage_does_not_create_formation_receipt_now",
    "formation_receipt_ref_future_only",
    "decision_or_handoff_ref_future_only",
    "source_refs_required",
    "authority_boundary_required",
    "forbidden_actions_required",
    "stop_conditions_required",
    "selected_candidates_remain_candidates",
    "omitted_candidates_remain_visible",
    "deferred_candidates_remain_visible",
    "unresolved_tensions_preserved",
    "knowledge_gaps_preserved",
    "candidate_durable_distinction_preserved",
    "ai_context_packet_context_not_execution_authority",
    "codex_handoff_draft_not_execution_approval",
    "perspective_geometry_digest_interpretation_not_truth",
    "expected_files_hints_not_write_authority",
    "expected_checks_hints_not_execution_authority",
    "final_report_template_not_completion_proof",
    "runtime_linkage_build_not_implemented",
    "linkage_record_write_not_implemented",
    "durable_audit_log_write_not_implemented",
    "formation_receipt_write_not_implemented",
    "codex_execution_now_false",
    "github_automation_now_false",
    "github_pr_creation_now_false",
    "git_branch_commit_creation_now_false",
    "external_handoff_sending_now_false",
    "agent_routing_execution_now_false",
    "provider_openai_call_not_implemented",
    "retrieval_rag_execution_not_implemented",
    "runtime_geometry_digest_build_not_implemented",
    "runtime_layout_execution_not_implemented",
    "graph_mutation_now_false",
    "runtime_state_read_write_not_implemented",
    "durable_perspective_delta_apply_not_implemented",
    "proof_or_evidence_write_not_implemented",
    "accepted_evidence_write_not_implemented",
    "work_mutation_now_false",
    "runtime_db_write_query_not_implemented",
    "durable_memory_write_not_implemented",
    "product_write_not_implemented",
    "public_safe_refs_only",
    "no_raw_private_source_body",
    "no_raw_provider_thread_run_session_ids",
    "no_private_urls",
    "no_secrets",
    "no_access_tokens",
    "no_ssh_keys",
    "invalid_linkage_preview_override_rejected",
    "invalid_linkage_section_override_rejected",
    "invalid_forbidden_actions_override_rejected",
    "invalid_authority_boundary_override_rejected",
    "invalid_refs_override_rejected",
  ];
  assert.equal(value.passed, true);
  assert.deepEqual(value.failure_codes, []);
  for (const key of requiredTrueFlags) {
    assert.equal(value[key], true, `validated_implementation.${key} must be true`);
  }
}

function assertImplementationAuthorityBoundary(value) {
  assert.equal(value.implementation_added_now, true);
  assert.equal(value.deterministic_builder_added_now, true);
  assert.equal(value.product_write_lane_parked_by_686, true);
  for (const [key, flag] of Object.entries(value)) {
    if (
      key === "implementation_added_now" ||
      key === "deterministic_builder_added_now" ||
      key === "product_write_lane_parked_by_686"
    ) {
      assert.equal(flag, true, `${key} must be true`);
    } else {
      assert.equal(flag, false, `${key} must remain false`);
    }
  }
}

function assertInvalidOverrideCoverage() {
  assertFailureCodes(
    "invalid linkage preview override",
    invalidLinkagePreviewValidation().failure_codes,
    [
      "linkage_preview_missing_linkage_id",
      "linkage_preview_missing_source_refs",
      "linkage_preview_runtime_write_enabled",
      "linkage_preview_not_public_safe",
      "linkage_preview_missing_authority_boundary",
      "linkage_preview_missing_forbidden_actions",
      "linkage_preview_missing_stop_conditions",
      "linkage_preview_completion_proof_enabled",
      "linkage_preview_codex_execution_enabled",
      "linkage_preview_formation_receipt_write_enabled",
      "linkage_preview_linkage_record_write_enabled",
      "linkage_preview_durable_audit_log_write_enabled",
    ],
  );
  assertFailureCodes(
    "invalid linkage section override",
    invalidSectionValidation().failure_codes,
    [
      "linkage_section_missing_section_kind",
      "linkage_section_unknown_section_kind",
      "linkage_section_runtime_write_enabled",
      "selected_candidate_not_candidate_only",
      "selected_candidate_proof_or_evidence_enabled",
      "selected_candidate_durable_state_enabled",
      "omitted_candidate_treated_as_rejected",
      "deferred_candidate_treated_as_rejected",
      "unresolved_tension_resolution_implied",
      "knowledge_gap_closure_implied",
      "future_formation_receipt_written_now",
      "future_decision_or_handoff_made_now",
      "authority_boundary_section_execution_enabled",
      "expected_files_write_authority_enabled",
      "expected_checks_execution_authority_enabled",
      "linkage_notes_truth_source_enabled",
    ],
  );
  assertFailureCodes(
    "invalid forbidden actions override",
    invalidForbiddenActionsValidation().failure_codes,
    [
      "forbidden_action_missing_no_linkage_record_write",
      "forbidden_action_missing_no_durable_audit_log_write",
      "forbidden_action_missing_no_formation_receipt_write",
      "forbidden_action_missing_no_codex_execution",
      "forbidden_action_missing_no_github_automation",
      "forbidden_action_missing_no_github_pr_creation",
      "forbidden_action_missing_no_git_branch_creation",
      "forbidden_action_missing_no_git_commit_creation",
      "forbidden_action_missing_no_provider_openai_call",
      "forbidden_action_missing_no_retrieval_rag_execution",
      "forbidden_action_missing_no_db_write_or_query",
      "forbidden_action_missing_no_perspective_promotion",
      "forbidden_action_missing_no_product_write",
    ],
  );
  const authorityCodes = uniqueSorted([
    ...invalidAuthorityBoundaryValidation().failure_codes,
    ...invalidImplementationAuthorityBoundaryValidation()
      .validated_implementation.failure_codes,
  ]);
  assertFailureCodes("invalid authority boundary override", authorityCodes, [
    "linkage_runtime_build_enabled",
    "linkage_record_write_enabled",
    "durable_audit_log_write_enabled",
    "formation_receipt_write_enabled",
    "formation_receipt_runtime_mutation_enabled",
    "codex_execution_enabled",
    "github_automation_enabled",
    "github_pr_creation_enabled",
    "git_branch_creation_enabled",
    "git_commit_creation_enabled",
    "external_handoff_sending_enabled",
    "agent_routing_enabled",
    "agent_execution_enabled",
    "ai_context_packet_runtime_build_enabled",
    "codex_handoff_draft_runtime_build_enabled",
    "provider_openai_call_enabled",
    "retrieval_rag_execution_enabled",
    "runtime_geometry_digest_build_enabled",
    "graph_mutation_enabled",
    "durable_perspective_state_read_enabled",
    "durable_perspective_state_write_enabled",
    "durable_perspective_delta_apply_enabled",
    "proof_or_evidence_record_write_enabled",
    "accepted_evidence_write_enabled",
    "work_mutation_enabled",
    "runtime_db_query_enabled",
    "runtime_db_write_enabled",
    "durable_memory_write_enabled",
    "linkage_authority_enabled",
    "receipt_completion_authority_enabled",
    "product_write_enabled",
    "product_id_allocation_enabled",
  ]);
  assertFailureCodes("invalid refs override", invalidRefsValidation().failure_codes, [
    "linkage_id_missing",
    "private_or_unstable_ref_detected",
    "source_refs_missing",
    "selected_candidate_missing_source_refs",
    "omitted_candidate_missing_reason",
    "deferred_candidate_missing_reason",
    "future_formation_receipt_ref_missing",
    "future_decision_or_handoff_ref_missing",
    "raw_private_source_body_detected",
    "raw_provider_thread_run_session_id_detected",
    "access_token_detected",
    "ssh_key_detected",
  ]);
}

function invalidLinkagePreviewValidation() {
  const linkage = clone(
    contractFixture.sample_perspective_packet_receipt_linkage_preview.linkage_preview,
  );
  delete linkage.linkage_id;
  delete linkage.authority_boundary;
  linkage.source_refs = [];
  linkage.all_runtime_write_now_false = false;
  linkage.all_sections_public_safe = false;
  linkage.forbidden_actions = [];
  linkage.stop_conditions = [];
  linkage.not_completion_proof = false;
  linkage.codex_execution_now = true;
  linkage.formation_receipt_write_now = true;
  linkage.linkage_record_write_now = true;
  linkage.durable_audit_log_write_now = true;
  return buildPerspectivePacketReceiptLinkagePreviewBundle({
    contract: contractFixture,
    source_contract_ref: sourceContractRef,
    linkage_preview: linkage,
  }).validation;
}

function invalidSectionValidation() {
  const families = clone(contractFixture.linkage_section_families);
  families.push({}, { section_kind: "unknown_section", runtime_write_now: false });
  for (const family of families) {
    if (family.section_kind === "ai_context_packet_link") {
      family.runtime_write_now = true;
    }
    if (family.section_kind === "selected_candidates") {
      family.candidates_remain_candidates = false;
      family.not_proof_or_evidence = false;
      family.not_durable_state = false;
    }
    if (family.section_kind === "omitted_candidates") {
      family.omission_not_rejection = false;
    }
    if (family.section_kind === "deferred_candidates") {
      family.deferral_not_rejection = false;
    }
    if (family.section_kind === "unresolved_tensions") {
      family.resolution_not_implied = false;
    }
    if (family.section_kind === "knowledge_gaps") {
      family.closure_not_implied = false;
    }
    if (family.section_kind === "future_formation_receipt_ref") {
      family.receipt_not_written_now = false;
    }
    if (family.section_kind === "future_decision_or_handoff_ref") {
      family.decision_not_made_now = false;
    }
    if (family.section_kind === "authority_boundary") {
      family.execution_authority_false = false;
    }
    if (family.section_kind === "expected_files") {
      family.not_file_write_authority = false;
    }
    if (family.section_kind === "expected_checks") {
      family.not_execution_authority = false;
    }
    if (family.section_kind === "linkage_notes") {
      family.not_truth_source = false;
    }
  }
  return buildPerspectivePacketReceiptLinkagePreviewBundle({
    contract: contractFixture,
    source_contract_ref: sourceContractRef,
    linkage_section_families: families,
  }).validation;
}

function invalidForbiddenActionsValidation() {
  const policy = clone(contractFixture.forbidden_actions_policy);
  for (const key of Object.keys(policy)) {
    policy[key] = false;
  }
  return buildPerspectivePacketReceiptLinkagePreviewBundle({
    contract: contractFixture,
    source_contract_ref: sourceContractRef,
    forbidden_actions_policy: policy,
  }).validation;
}

function invalidAuthorityBoundaryValidation() {
  const boundary = clone(contractFixture.authority_boundary);
  for (const key of [
    "linkage_runtime_build_implemented_now",
    "linkage_record_write_now",
    "durable_audit_log_write_now",
    "formation_receipt_write_now",
    "codex_execution_now",
    "github_automation_now",
    "github_pr_creation_now",
    "git_branch_creation_now",
    "git_commit_creation_now",
    "external_handoff_sending_now",
    "agent_routing_now",
    "agent_execution_now",
    "ai_context_packet_runtime_build_implemented_now",
    "codex_handoff_draft_runtime_build_implemented_now",
    "provider_openai_call_now",
    "retrieval_rag_execution_now",
    "runtime_geometry_digest_build_implemented_now",
    "graph_mutation_now",
    "durable_perspective_state_read_now",
    "durable_perspective_state_write_now",
    "durable_perspective_delta_apply_now",
    "proof_or_evidence_record_write_now",
    "accepted_evidence_write_now",
    "work_mutation_now",
    "runtime_db_query_now",
    "runtime_db_write_now",
    "durable_memory_write_now",
    "linkage_authority",
    "receipt_completion_authority",
    "product_write_authority",
    "product_id_allocation_authority",
  ]) {
    boundary[key] = true;
  }
  const bundle = buildPerspectivePacketReceiptLinkagePreviewBundle({
    contract: contractFixture,
    source_contract_ref: sourceContractRef,
  });
  const previewBundle = { ...bundle, authority_boundary: boundary };
  return validatePerspectivePacketReceiptLinkagePreviewBundle(
    previewBundle,
    contractFixture,
  );
}

function invalidImplementationAuthorityBoundaryValidation() {
  return buildPerspectivePacketReceiptLinkageImplementationFixture({
    perspective_packet_receipt_linkage_contract: contractFixture,
    source_contract_ref: sourceContractRef,
    authority_boundary_overrides: {
      formation_receipt_runtime_mutation_now: true,
    },
  });
}

function invalidRefsValidation() {
  const inputPreview = clone(
    contractFixture.sample_perspective_packet_receipt_linkage_preview
      .linkage_input_preview,
  );
  inputPreview.private_ref = "private_ref:internal:value";
  inputPreview.raw_private_source_body = "raw private source body";
  const linkage = clone(
    contractFixture.sample_perspective_packet_receipt_linkage_preview.linkage_preview,
  );
  delete linkage.linkage_id;
  linkage.source_refs = [];
  linkage.selected_candidates[0].source_refs = [];
  linkage.omitted_candidates[0].omission_reason_summary = "";
  linkage.deferred_candidates[0].defer_reason_summary = "";
  linkage.future_formation_receipt_ref = "";
  linkage.future_decision_or_handoff_ref = "";
  linkage.provider_thread_ref = "thread_abc123";
  linkage.token_ref = "access_token:sk-test";
  linkage.key_ref = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQ";
  return buildPerspectivePacketReceiptLinkagePreviewBundle({
    contract: contractFixture,
    source_contract_ref: sourceContractRef,
    linkage_input_preview: inputPreview,
    linkage_preview: linkage,
  }).validation;
}

function assertFailureCodes(label, actualCodes, requiredCodes) {
  assert.notEqual(actualCodes.length, 0, `${label} must fail validation`);
  for (const requiredCode of requiredCodes) {
    assert.ok(
      actualCodes.includes(requiredCode),
      `${label} must include failure code ${requiredCode}; got ${actualCodes.join(", ")}`,
    );
  }
}

function assertDocsPointers() {
  for (const requiredText of [
    "Perspective Packet Receipt Linkage implementation v0.1",
    builderPath,
    implementationFixturePath,
    smokePath,
    "deterministic fixture-backed implementation only",
    "validates and materializes #748 Perspective Packet Receipt Linkage preview bundle",
    "linkage is provenance, not execution authority",
    "linkage is derived, public-safe, advisory-only",
    "linkage is not source of truth",
    "linkage is not proof/evidence",
    "linkage is not completion proof",
    "linkage is not durable Perspective state",
    "linkage is not work status",
    "linkage is not product write",
    "linkage does not prove Codex ran",
    "linkage does not prove PR created",
    "linkage does not prove validation passed",
    "linkage does not create Formation Receipt now",
    "future Formation Receipt ref only",
    "future decision/handoff ref only",
    "selected candidates remain candidates",
    "omitted candidates remain visible and omission is not rejection",
    "deferred candidates remain visible and deferral is not rejection",
    "unresolved tensions preserved",
    "knowledge gaps preserved",
    "candidate/durable distinction preserved",
    "AI Context Packet remains context, not execution authority",
    "Codex Handoff Draft remains draft, not execution approval",
    "Perspective Geometry Digest remains interpretation, not truth",
    "expected_files are hints only, not write authority",
    "expected_checks are validation hints only, not execution authority",
    "final_report_template is not completion proof",
    "no runtime linkage build",
    "no linkage record write",
    "no durable audit log write",
    "no Formation Receipt write",
    "no Codex execution",
    "no GitHub automation",
    "no GitHub PR creation",
    "no git branch/commit creation",
    "no external handoff sending",
    "no agent routing/execution",
    "no provider/OpenAI call",
    "no retrieval/RAG execution",
    "no DB write/query",
    "no durable memory write",
    "no perspective promotion",
    "no proof/evidence write",
    "no accepted evidence write",
    "no work mutation",
    "no schema/migration",
    "no route or UI",
    "no browser request",
    "no product write/product IDs",
    "product-write remains parked by #686",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `${indexPath} must include ${requiredText}`);
  }
  for (const requiredText of [
    "Perspective Packet Receipt Linkage implementation is deterministic fixture-backed only.",
    "It materializes preview bundles from the #748 contract.",
    "Agent Substrate remains advisory-only",
    "Linkage is provenance, not execution authority.",
    "Future Formation Receipt refs and future decision/handoff refs are references only and are not written now.",
    "Selected, omitted, and deferred candidates remain visible and retain candidate/durable distinction.",
    "This slice does not implement runtime linkage build, linkage write, Formation Receipt write, durable audit log write, Codex execution, GitHub automation, branch/commit/PR creation, external handoff sending, agent routing/execution, provider/OpenAI, retrieval/RAG, DB writes, route/UI, proof/evidence writes, work mutation, or product write.",
    "Next recommended slice is Perspective Packet Receipt Linkage browser validation v0.1.",
  ]) {
    assert.ok(substrateDoc.includes(requiredText), `${substrateDocPath} must include ${requiredText}`);
  }
  for (const doc of [surfaceDoc, gateDoc]) {
    for (const requiredText of [
      "Perspective Packet Receipt Linkage implementation remains separated from candidate preview, AI Context Packet runtime, Codex Handoff runtime, digest runtime, layout runtime, durable Perspective state, promotion runtime, Formation Receipt write, and execution.",
      "Selected candidates remain candidates, not proof/evidence or durable state.",
      "Omitted candidates remain visible and omission is not rejection.",
      "Deferred candidates remain visible and deferral is not rejection.",
      "Unresolved tensions and knowledge gaps must remain visible.",
      "Codex Handoff Draft remains draft, not execution approval.",
      "Linkage cannot execute Codex, create branches, create commits, create PRs, call providers, run retrieval/RAG, mutate state/work, write Formation Receipt, write audit logs, or write product data.",
      "This slice does not implement runtime DB/browser/provider/source-fetch/retrieval/promotion/state/layout/digest/packet/handoff/linkage behavior.",
    ]) {
      assert.ok(doc.includes(requiredText), `Research Candidate docs must include ${requiredText}`);
    }
  }
}

function assertContractSmokeDownstreamPointer() {
  for (const requiredText of [
    implementationVersion,
    implementationFixturePath,
    smokePath,
    packageScriptName,
    recommendationStatus,
    nextRecommendedSlice,
  ]) {
    assert.ok(
      contractSmokeSource.includes(requiredText),
      `${contractSmokePath} must include ${requiredText}`,
    );
  }
}

function assertBrowserValidationDownstreamPointer() {
  if (!browserValidationSliceActive()) return;
  for (const requiredText of [
    browserValidationVersion,
    browserValidationFixturePath,
    browserValidationSmokePath,
    browserValidationPackageScriptName,
    browserValidationRecommendationStatus,
    browserValidationNextRecommendedSlice,
  ]) {
    assert.ok(
      smokeSource.includes(requiredText),
      `${smokePath} must include ${requiredText}`,
    );
  }
}


function dogfoodingResearchToPerspectiveCiExpansionImplementationSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-implementation-v0-1.mjs",
  );
}

function assertDogfoodingResearchToPerspectiveCiExpansionImplementationPackageScript() {
  const implementationPackageScriptName =
    "smoke:dogfooding-research-to-perspective-ci-expansion-implementation-v0-1";
  const implementationPackageScriptValue =
    "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-dogfooding-research-to-perspective-ci-expansion-implementation-v0-1.mjs";
  const dogfoodingBasePackageJson =
    typeof basePackageJson !== "undefined"
      ? basePackageJson
      : JSON.parse(
          readGitOutput(["show", `${mergeBaseRef()}:${packagePath}`]),
        );
  assert.equal(
    packageJson.scripts[implementationPackageScriptName],
    implementationPackageScriptValue,
  );
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
    .map((line) => line.match(/^\+\s+"([^"]+)"\s*:/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
  assert.deepEqual(
    addedScriptNames,
    [implementationPackageScriptName],
    "package.json must add only the Dogfooding Research-to-Perspective CI Expansion implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  assert.deepEqual(packageJson.dependencies, dogfoodingBasePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, dogfoodingBasePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    dogfoodingBasePackageJson.optionalDependencies ?? {},
  );
}

function assertDogfoodingResearchToPerspectiveCiExpansionImplementationChangedFiles(changedFiles) {
  const expected = [
    "lib/research-candidate-review/dogfooding-research-to-perspective-ci-expansion.ts",
    "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-implementation.sample.v0.1.json",
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-implementation-v0-1.mjs",
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-contract-v0-1.mjs",
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ];
  for (const filePath of expected) {
    assert.ok(changedFiles.includes(filePath), "dogfooding implementation slice must include " + filePath);
  }
  for (const protectedPath of [
    "types/dogfooding-research-to-perspective-ci-expansion-contract.ts",
    "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-contract.sample.v0.1.json",
    "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-closeout.sample.v0.1.json",
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(protectedPath),
      "Dogfooding Research-to-Perspective CI Expansion implementation slice must not change " + protectedPath,
    );
  }
  for (const changedFile of changedFiles) {
    const allowedDownstreamSmoke =
      changedFile.startsWith("scripts/smoke-") &&
      changedFile.endsWith(".mjs") &&
      !expected.includes(changedFile) &&
      readFileSync(changedFile, "utf8").includes(
        "dogfoodingResearchToPerspectiveCiExpansionImplementationSliceActive",
      );
    assert.ok(
      expected.includes(changedFile) || allowedDownstreamSmoke,
      "unexpected changed file in Dogfooding Research-to-Perspective CI Expansion implementation slice: " + changedFile,
    );
    if (allowedDownstreamSmoke) continue;
    assert.doesNotMatch(changedFile, /^\.github\/workflows\//, "must not change GitHub Actions workflows");
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    if (changedFile !== "lib/research-candidate-review/dogfooding-research-to-perspective-ci-expansion.ts") {
      assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files outside the deterministic builder");
    }
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function dogfoodingResearchToPerspectiveCiExpansionContractSliceActive() {
  return readChangedFiles().includes(
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-contract-v0-1.mjs",
  );
}

function assertDogfoodingResearchToPerspectiveCiExpansionContractPackageScript() {
  if (dogfoodingResearchToPerspectiveCiExpansionImplementationSliceActive()) {
    assertDogfoodingResearchToPerspectiveCiExpansionImplementationPackageScript();
    return;
  }
  const dogfoodingPackageScriptName =
    "smoke:dogfooding-research-to-perspective-ci-expansion-contract-v0-1";
  const dogfoodingPackageScriptValue =
    "node scripts/smoke-dogfooding-research-to-perspective-ci-expansion-contract-v0-1.mjs";
  const dogfoodingBasePackageJson =
    typeof basePackageJson !== "undefined"
      ? basePackageJson
      : JSON.parse(
          readGitOutput(["show", `${mergeBaseRef()}:${packagePath}`]),
        );
  assert.equal(
    packageJson.scripts[dogfoodingPackageScriptName],
    dogfoodingPackageScriptValue,
  );
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
    .map((line) => line.match(/^\+\s+"([^"]+)"\s*:/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
  assert.deepEqual(
    addedScriptNames,
    [dogfoodingPackageScriptName],
    "package.json must add only the Dogfooding Research-to-Perspective CI Expansion contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  assert.deepEqual(packageJson.dependencies, dogfoodingBasePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, dogfoodingBasePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    dogfoodingBasePackageJson.optionalDependencies ?? {},
  );
}

function assertDogfoodingResearchToPerspectiveCiExpansionContractChangedFiles(changedFiles) {
  if (dogfoodingResearchToPerspectiveCiExpansionImplementationSliceActive()) {
    assertDogfoodingResearchToPerspectiveCiExpansionImplementationChangedFiles(changedFiles);
    return;
  }
  const expected = [
    "types/dogfooding-research-to-perspective-ci-expansion-contract.ts",
    "fixtures/research-candidate-review.dogfooding-research-to-perspective-ci-expansion-contract.sample.v0.1.json",
    "scripts/smoke-dogfooding-research-to-perspective-ci-expansion-contract-v0-1.mjs",
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    "scripts/smoke-agent-perspective-substrate-feedback-loop-closeout-v0-1.mjs",
  ];
  for (const filePath of expected) {
    assert.ok(changedFiles.includes(filePath), "dogfooding contract slice must include " + filePath);
  }
  for (const changedFile of changedFiles) {
    const allowedDownstreamSmoke =
      changedFile.startsWith("scripts/smoke-") &&
      changedFile.endsWith(".mjs") &&
      !expected.includes(changedFile) &&
      readFileSync(changedFile, "utf8").includes(
        "dogfoodingResearchToPerspectiveCiExpansionContractSliceActive",
      );
    assert.ok(
      expected.includes(changedFile) || allowedDownstreamSmoke,
      "unexpected changed file in Dogfooding Research-to-Perspective CI Expansion contract slice: " + changedFile,
    );
    if (allowedDownstreamSmoke) continue;
    assert.doesNotMatch(changedFile, /^\.github\/workflows\//, "must not change GitHub Actions workflows");
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
}

function agentPerspectiveSubstrateFeedbackLoopCloseoutSliceActive() {
  const changedFiles = readChangedFiles();
  const packageAddedLines = readGitOutput([
    "diff",
    "--unified=0",
    mergeBaseRef(),
    "--",
    packagePath,
  ])
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
  const packageAddsCloseoutScript = packageAddedLines.some((line) =>
    line.includes(`"${agentPerspectiveSubstrateFeedbackLoopCloseoutPackageScriptName}"`),
  );
  return (
    changedFiles.includes(agentPerspectiveSubstrateFeedbackLoopCloseoutSmokePath) ||
    changedFiles.includes(agentPerspectiveSubstrateFeedbackLoopCloseoutFixturePath) ||
    packageAddsCloseoutScript
  );
}

function assertAgentPerspectiveSubstrateFeedbackLoopCloseoutPackageScript() {
  assert.equal(
    packageJson.scripts[agentPerspectiveSubstrateFeedbackLoopCloseoutPackageScriptName],
    agentPerspectiveSubstrateFeedbackLoopCloseoutPackageScriptValue,
  );
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
    .map((line) => line.match(/^\+\s+"([^"]+)"\s*:/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
  assert.deepEqual(
    addedScriptNames,
    [agentPerspectiveSubstrateFeedbackLoopCloseoutPackageScriptName],
    "package.json must add only the Agent Perspective Substrate Feedback Loop closeout smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  if (typeof basePackageJson !== "undefined") {
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
  }
}

function assertAgentPerspectiveSubstrateFeedbackLoopCloseoutChangedFiles(changedFiles) {
  const expectedFiles = [
    agentPerspectiveSubstrateFeedbackLoopCloseoutFixturePath,
    agentPerspectiveSubstrateFeedbackLoopCloseoutSmokePath,
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ];
  for (const unchangedPath of [
    agentPerspectiveSubstrateFeedbackLoopImplementationBuilderPath,
    agentPerspectiveSubstrateFeedbackLoopImplementationFixturePath,
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationFixturePath,
    "types/agent-perspective-substrate-feedback-loop-contract.ts",
    "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-contract.sample.v0.1.json",
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Agent Perspective Substrate Feedback Loop closeout slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    const allowedDownstreamSmoke =
      changedFile.startsWith("scripts/smoke-") &&
      changedFile.endsWith(".mjs") &&
      !expectedFiles.includes(changedFile) &&
      readFileSync(changedFile, "utf8").includes(
        "agentPerspectiveSubstrateFeedbackLoopCloseoutSliceActive",
      );
    assert.ok(
      expectedFiles.includes(changedFile) || allowedDownstreamSmoke,
      "unexpected changed file in Agent Perspective Substrate Feedback Loop closeout slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertAgentPerspectiveSubstrateFeedbackLoopCloseoutDownstreamPointer();
}

function assertAgentPerspectiveSubstrateFeedbackLoopCloseoutDownstreamPointer() {
  const browserValidationSmoke = readFileSync(
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath,
    "utf8",
  );
  for (const requiredText of [
    agentPerspectiveSubstrateFeedbackLoopCloseoutVersion,
    agentPerspectiveSubstrateFeedbackLoopCloseoutFixturePath,
    agentPerspectiveSubstrateFeedbackLoopCloseoutSmokePath,
    agentPerspectiveSubstrateFeedbackLoopCloseoutPackageScriptName,
    agentPerspectiveSubstrateFeedbackLoopCloseoutPackageScriptValue,
    agentPerspectiveSubstrateFeedbackLoopCloseoutRecommendationStatus,
    agentPerspectiveSubstrateFeedbackLoopCloseoutNextRecommendedSlice,
  ]) {
    assert.ok(
      browserValidationSmoke.includes(requiredText),
      agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath + " must include " + requiredText,
    );
  }
}

function agentPerspectiveSubstrateFeedbackLoopBrowserValidationSliceActive() {
  return readChangedFiles().includes(agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath);
}

function assertAgentPerspectiveSubstrateFeedbackLoopBrowserValidationPackageScript() {
  assert.equal(
    packageJson.scripts[agentPerspectiveSubstrateFeedbackLoopBrowserValidationPackageScriptName],
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationPackageScriptValue,
  );
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
    .map((line) => line.match(/^\+\s+"([^"]+)"\s*:/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
  assert.deepEqual(
    addedScriptNames,
    [agentPerspectiveSubstrateFeedbackLoopBrowserValidationPackageScriptName],
    "package.json must add only the Agent Perspective Substrate Feedback Loop browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  if (typeof basePackageJson !== "undefined") {
    assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
    assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
    assert.deepEqual(
      packageJson.optionalDependencies ?? {},
      basePackageJson.optionalDependencies ?? {},
    );
  }
}

function assertAgentPerspectiveSubstrateFeedbackLoopBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationFixturePath,
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath,
    agentPerspectiveSubstrateFeedbackLoopImplementationSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ];
  for (const unchangedPath of [
    agentPerspectiveSubstrateFeedbackLoopImplementationBuilderPath,
    agentPerspectiveSubstrateFeedbackLoopImplementationFixturePath,
    "types/agent-perspective-substrate-feedback-loop-contract.ts",
    "fixtures/research-candidate-review.agent-perspective-substrate-feedback-loop-contract.sample.v0.1.json",
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Agent Perspective Substrate Feedback Loop browser validation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    const allowedDownstreamSmoke =
      changedFile.startsWith("scripts/smoke-") &&
      changedFile.endsWith(".mjs") &&
      !expectedFiles.includes(changedFile) &&
      readFileSync(changedFile, "utf8").includes(
        "agentPerspectiveSubstrateFeedbackLoopBrowserValidationSliceActive",
      );
    assert.ok(
      expectedFiles.includes(changedFile) || allowedDownstreamSmoke,
      "unexpected changed file in Agent Perspective Substrate Feedback Loop browser validation slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertAgentPerspectiveSubstrateFeedbackLoopBrowserValidationDownstreamPointer();
}

function assertAgentPerspectiveSubstrateFeedbackLoopBrowserValidationDownstreamPointer() {
  const browserValidationSmoke = readFileSync(
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath,
    "utf8",
  );
  for (const requiredText of [
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationVersion,
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationFixturePath,
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath,
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationPackageScriptName,
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationPackageScriptValue,
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationRecommendationStatus,
    agentPerspectiveSubstrateFeedbackLoopBrowserValidationNextRecommendedSlice,
  ]) {
    assert.ok(
      browserValidationSmoke.includes(requiredText),
      agentPerspectiveSubstrateFeedbackLoopBrowserValidationSmokePath + " must include " + requiredText,
    );
  }
}

function agentPerspectiveSubstrateFeedbackLoopImplementationSliceActive() {
  return readChangedFiles().includes(agentPerspectiveSubstrateFeedbackLoopImplementationSmokePath);
}

function assertAgentPerspectiveSubstrateFeedbackLoopImplementationPackageScript() {
  assert.equal(
    packageJson.scripts[agentPerspectiveSubstrateFeedbackLoopImplementationPackageScriptName],
    agentPerspectiveSubstrateFeedbackLoopImplementationPackageScriptValue,
  );
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
    .map((line) => line.match(/^\+\s+"([^"]+)"\s*:/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
  assert.deepEqual(
    addedScriptNames,
    [agentPerspectiveSubstrateFeedbackLoopImplementationPackageScriptName],
    "package.json must add only the Agent Perspective Substrate Feedback Loop implementation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
  );
}

function assertAgentPerspectiveSubstrateFeedbackLoopImplementationChangedFiles(changedFiles) {
  const expectedFiles = [
    agentPerspectiveSubstrateFeedbackLoopImplementationBuilderPath,
    agentPerspectiveSubstrateFeedbackLoopImplementationFixturePath,
    agentPerspectiveSubstrateFeedbackLoopImplementationSmokePath,
    feedbackLoopContractSmokePath,
    smokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
  ];
  for (const unchangedPath of [
    feedbackLoopContractTypePath,
    feedbackLoopContractFixturePath,
    browserValidationFixturePath,
    builderPath,
    implementationFixturePath,
    contractTypePath,
    contractFixturePath,
    "lib/db/schema.sql",
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      "Agent Perspective Substrate Feedback Loop implementation slice must not change " + unchangedPath,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), "changed files must include " + expectedFile);
  }
  for (const changedFile of changedFiles) {
    const allowedDownstreamSmoke =
      changedFile.startsWith("scripts/smoke-") &&
      changedFile.endsWith(".mjs") &&
      !expectedFiles.includes(changedFile) &&
      readFileSync(changedFile, "utf8").includes(
        "agentPerspectiveSubstrateFeedbackLoopImplementationSliceActive",
      );
    assert.ok(
      expectedFiles.includes(changedFile) || allowedDownstreamSmoke,
      "unexpected changed file in Agent Perspective Substrate Feedback Loop implementation slice: " + changedFile,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    if (changedFile.startsWith("lib/")) {
      assert.equal(
        changedFile,
        agentPerspectiveSubstrateFeedbackLoopImplementationBuilderPath,
        "implementation slice may only add the deterministic feedback-loop builder under lib",
      );
    }
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertAgentPerspectiveSubstrateFeedbackLoopImplementationDownstreamPointer();
}

function assertAgentPerspectiveSubstrateFeedbackLoopImplementationDownstreamPointer() {
  const implementationSmoke = readFile(agentPerspectiveSubstrateFeedbackLoopImplementationSmokePath);
  for (const requiredText of [
    agentPerspectiveSubstrateFeedbackLoopImplementationVersion,
    agentPerspectiveSubstrateFeedbackLoopImplementationBuilderPath,
    agentPerspectiveSubstrateFeedbackLoopImplementationFixturePath,
    agentPerspectiveSubstrateFeedbackLoopImplementationSmokePath,
    agentPerspectiveSubstrateFeedbackLoopImplementationPackageScriptName,
    agentPerspectiveSubstrateFeedbackLoopImplementationPackageScriptValue,
    agentPerspectiveSubstrateFeedbackLoopImplementationRecommendationStatus,
    agentPerspectiveSubstrateFeedbackLoopImplementationNextRecommendedSlice,
  ]) {
    assert.ok(
      implementationSmoke.includes(requiredText),
      agentPerspectiveSubstrateFeedbackLoopImplementationSmokePath + " must include " + requiredText,
    );
  }
}

function feedbackLoopContractSliceActive() {
  const changedFiles = readChangedFiles();
  return (
    changedFiles.includes(feedbackLoopContractTypePath) ||
    changedFiles.includes(feedbackLoopContractFixturePath) ||
    changedFiles.includes(feedbackLoopContractSmokePath)
  );
}

function assertFeedbackLoopContractPackageScript() {
  assert.equal(
    packageJson.scripts[feedbackLoopContractPackageScriptName],
    feedbackLoopContractPackageScriptValue,
  );
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
    .map((line) => line.match(/^\+\s+"([^"]+)"\s*:/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
  assert.deepEqual(
    addedScriptNames,
    [feedbackLoopContractPackageScriptName],
    "package.json must add only the Agent Perspective Substrate Feedback Loop contract smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
  );
}

function assertFeedbackLoopContractChangedFiles(changedFiles) {
  const expectedFiles = [
    feedbackLoopContractTypePath,
    feedbackLoopContractFixturePath,
    feedbackLoopContractSmokePath,
    browserValidationSmokePath,
    contractSmokePath,
    smokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    ...downstreamSmokePaths,
  ];
  for (const unchangedPath of [
    browserValidationFixturePath,
    builderPath,
    implementationFixturePath,
    contractTypePath,
    contractFixturePath,
    "fixtures/research-candidate-review.codex-handoff-draft-browser-validation.sample.v0.1.json",
    "types/codex-handoff-draft-contract.ts",
    "fixtures/research-candidate-review.codex-handoff-draft-contract.sample.v0.1.json",
    "lib/research-candidate-review/codex-handoff-draft.ts",
    "fixtures/research-candidate-review.codex-handoff-draft-implementation.sample.v0.1.json",
    "lib/db/schema.sql",
    ...protectedUnchangedPaths,
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Agent Perspective Substrate Feedback Loop contract slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of Array.from(new Set(expectedFiles))) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Agent Perspective Substrate Feedback Loop contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not add runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertFeedbackLoopContractDownstreamPointer();
}

function assertFeedbackLoopContractDownstreamPointer() {
  if (!feedbackLoopContractSliceActive()) return;
  const feedbackLoopContractSmoke = readFile(feedbackLoopContractSmokePath);
  for (const requiredText of [
    feedbackLoopContractVersion,
    feedbackLoopContractFixturePath,
    feedbackLoopContractSmokePath,
    feedbackLoopContractPackageScriptName,
    feedbackLoopContractRecommendationStatus,
    feedbackLoopContractNextRecommendedSlice,
  ]) {
    assert.ok(
      feedbackLoopContractSmoke.includes(requiredText),
      `${feedbackLoopContractSmokePath} must include ${requiredText}`,
    );
  }
}

function browserValidationSliceActive() {
  const changedFiles = readChangedFiles();
  return (
    changedFiles.includes(browserValidationSmokePath) ||
    changedFiles.includes(browserValidationFixturePath)
  );
}

function assertBrowserValidationPackageScript() {
  assert.equal(
    packageJson.scripts[browserValidationPackageScriptName],
    browserValidationPackageScriptValue,
  );
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
    .map((line) => line.match(/^\+\s+"([^"]+)"\s*:/)?.[1] ?? null)
    .filter(Boolean)
    .sort();
  assert.deepEqual(
    addedScriptNames,
    [browserValidationPackageScriptName],
    "package.json must add only the Perspective Packet Receipt Linkage browser validation smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"optionalDependencies"\s*:/);
  assert.deepEqual(packageJson.dependencies, basePackageJson.dependencies);
  assert.deepEqual(packageJson.devDependencies, basePackageJson.devDependencies);
  assert.deepEqual(
    packageJson.optionalDependencies ?? {},
    basePackageJson.optionalDependencies ?? {},
  );
}

function assertBrowserValidationChangedFiles(changedFiles) {
  const expectedFiles = [
    browserValidationFixturePath,
    browserValidationSmokePath,
    smokePath,
    contractSmokePath,
    packagePath,
    indexPath,
    substrateDocPath,
    surfaceDocPath,
    gateDocPath,
    ...downstreamSmokePaths,
  ];
  for (const unchangedPath of [
    builderPath,
    implementationFixturePath,
    contractTypePath,
    contractFixturePath,
    "fixtures/research-candidate-review.codex-handoff-draft-browser-validation.sample.v0.1.json",
    "types/codex-handoff-draft-contract.ts",
    "fixtures/research-candidate-review.codex-handoff-draft-contract.sample.v0.1.json",
    "lib/research-candidate-review/codex-handoff-draft.ts",
    "fixtures/research-candidate-review.codex-handoff-draft-implementation.sample.v0.1.json",
    ...protectedUnchangedPaths,
  ]) {
    assert.ok(
      !changedFiles.includes(unchangedPath),
      `Perspective Packet Receipt Linkage browser validation slice must not change ${unchangedPath}`,
    );
  }
  for (const expectedFile of expectedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedFiles.includes(changedFile),
      `unexpected changed file in Perspective Packet Receipt Linkage browser validation slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api routes");
    assert.doesNotMatch(changedFile, /route\.ts$/, "must not change route handlers");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /^lib\//, "must not change runtime implementation files");
    assert.doesNotMatch(changedFile, /product.*write/i, "must not change product write files");
  }
  assertBrowserValidationDownstreamPointer();
}

function assertPortableMergeBaseFallback() {
  assert.ok(mergeBaseRef(), "mergeBaseRef must resolve");
  for (const requiredText of ["origin/main", "main", "HEAD^", "Unable to resolve merge base"]) {
    assert.ok(smokeSource.includes(requiredText), `${smokePath} must include ${requiredText}`);
  }
}

function readChangedFiles() {
  const diffFiles = readGitOutput([
    "diff",
    "--name-only",
    mergeBaseRef(),
    "--",
  ])
    .split("\n")
    .filter(Boolean);
  const untrackedFiles = readGitOutput([
    "ls-files",
    "--others",
    "--exclude-standard",
  ])
    .split("\n")
    .filter(Boolean);
  return Array.from(new Set([...diffFiles, ...untrackedFiles])).sort();
}

function mergeBaseRef() {
  if (cachedMergeBaseRef) return cachedMergeBaseRef;
  for (const ref of ["origin/main", "main", "HEAD^"]) {
    try {
      readGitOutput(["rev-parse", "--verify", ref]);
      cachedMergeBaseRef = ref;
      return cachedMergeBaseRef;
    } catch {
      // Try the next portable fallback.
    }
  }
  throw new Error("Unable to resolve merge base ref from origin/main, main, or HEAD^");
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function readJsonFromGit(filePath) {
  return JSON.parse(readTextFromGit(filePath));
}

function readTextFromGit(filePath) {
  return execFileSync("git", ["show", `${mergeBaseRef()}:${filePath}`], {
    encoding: "utf8",
  });
}

function readGitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function stripNonCode(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/`(?:\\.|[^`])*`/g, "\"\"")
    .replace(/"(?:\\.|[^"\\])*"/g, "\"\"")
    .replace(/'(?:\\.|[^'\\])*'/g, "''");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function uniqueSorted(values) {
  return Array.from(new Set(values)).sort();
}
