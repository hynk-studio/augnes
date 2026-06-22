import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const typePath = "types/candidate-to-codex-handoff-operator-decision.ts";
const builderPath =
  "lib/research-candidate-review/candidate-to-codex-handoff-operator-decision.ts";
const sourceReviewFixturePath =
  "fixtures/research-candidate-review.candidate-to-codex-handoff-draft-review.sample.v0.1.json";
const sourceDraftFixturePath =
  "fixtures/research-candidate-review.candidate-to-codex-handoff-draft.geometry-substrate.sample.v0.1.json";
const sourcePacketFixturePath =
  "fixtures/research-candidate-review.ai-context-packet.geometry-substrate-upgrade.sample.v0.1.json";
const decisionFixturePath =
  "fixtures/research-candidate-review.candidate-to-codex-handoff-operator-decision.sample.v0.1.json";
const feedbackTypePath = "types/feedback-event-store.ts";
const feedbackHelperPath =
  "lib/research-candidate-review/feedback-event-store.ts";
const feedbackFixturePath =
  "fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json";
const feedbackSmokePath = "scripts/smoke-feedback-event-store-minimal-v0-1.mjs";
const feedbackSchemaPath = "lib/db/schema.sql";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const sourceReviewSmokePath =
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs";
const sourceDraftSmokePath =
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs";
const sourcePacketSmokePath =
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs";
const foldedAuditPanelSmokePath =
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs";
const previewBuilderSmokePath =
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs";
const substrateSmokePath = "scripts/smoke-agent-perspective-substrate-v0-1.mjs";
const geometryDigestSmokePath =
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs";
const productWriteStoplineSmokePath =
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs";
const smokePath =
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs";

const packageScriptName =
  "smoke:research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1";
const packageScriptValue = `node ${smokePath}`;
const feedbackPackageScriptName = "smoke:feedback-event-store-minimal-v0-1";
const feedbackPackageScriptValue = `node ${feedbackSmokePath}`;
const sourceReviewExpectedNextSlice =
  "candidate_to_codex_handoff_operator_decision_v0_1";
const nextRecommendedSlice = "feedback_event_store_minimal_v0_1";
const feedbackNextRecommendedSlice =
  "feedback_event_store_review_controls_preview_v0_1";
const requiredDecisionOptions = [
  "approve_for_manual_codex_copy_paste_later",
  "request_handoff_revision",
  "defer_handoff",
  "reject_handoff",
  "archive_preview",
];
const requiredAcknowledgements = [
  "packet_is_not_source_of_truth",
  "codex_execution_not_authorized_by_preview",
  "github_automation_not_authorized_by_preview",
  "branch_pr_creation_not_authorized_by_preview",
  "external_handoff_not_sent_by_preview",
  "no_provider_openai_call",
  "no_source_fetch",
  "no_retrieval_rag_execution",
  "no_db_sql_transaction",
  "no_proof_evidence_work_perspective_write",
  "no_product_write_or_product_id_allocation",
  "manual_lineage_preserved",
  "unresolved_tensions_preserved",
];
const requiredExecutionBlockers = [
  "operator_decision_missing",
  "required_acknowledgements_unsatisfied",
  "codex_execution_not_authorized",
  "github_automation_not_authorized",
  "branch_pr_creation_not_authorized",
  "external_handoff_not_authorized",
  "source_of_truth_authority_not_granted",
  "proof_evidence_write_not_authorized",
  "work_mutation_not_authorized",
  "perspective_promotion_not_authorized",
  "provider_openai_call_not_authorized",
  "source_fetch_not_authorized",
  "retrieval_rag_execution_not_authorized",
  "db_sql_transaction_not_authorized",
  "product_write_not_authorized",
  "product_id_allocation_not_authorized",
];
const expectedChangedFiles = [
  feedbackTypePath,
  feedbackHelperPath,
  feedbackFixturePath,
  feedbackSmokePath,
  feedbackSchemaPath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];

for (const filePath of [
  typePath,
  builderPath,
  sourceReviewFixturePath,
  sourceDraftFixturePath,
  sourcePacketFixturePath,
  decisionFixturePath,
  feedbackTypePath,
  feedbackHelperPath,
  feedbackFixturePath,
  feedbackSmokePath,
  feedbackSchemaPath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  sourceReviewSmokePath,
  sourceDraftSmokePath,
  sourcePacketSmokePath,
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  geometryDigestSmokePath,
  productWriteStoplineSmokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const typeSource = readFileSync(typePath, "utf8");
const builderSource = readFileSync(builderPath, "utf8");
const smokeSource = readFileSync(smokePath, "utf8");
const feedbackTypeSource = readFileSync(feedbackTypePath, "utf8");
const feedbackHelperSource = readFileSync(feedbackHelperPath, "utf8");
const feedbackSmokeSource = readFileSync(feedbackSmokePath, "utf8");
const feedbackSchemaSource = readFileSync(feedbackSchemaPath, "utf8");
const sourceReviewFixture = readJson(sourceReviewFixturePath);
const sourceDraftFixture = readJson(sourceDraftFixturePath);
const sourcePacketFixture = readJson(sourcePacketFixturePath);
const decisionFixture = readJson(decisionFixturePath);
const feedbackFixture = readJson(feedbackFixturePath);
const packageJson = readJson(packagePath);
const indexDoc = readFileSync(indexPath, "utf8");
const substrateDoc = readFileSync(substrateDocPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");
const sourceReviewSmoke = readFileSync(sourceReviewSmokePath, "utf8");
const sourceDraftSmoke = readFileSync(sourceDraftSmokePath, "utf8");
const sourcePacketSmoke = readFileSync(sourcePacketSmokePath, "utf8");
const foldedAuditPanelSmoke = readFileSync(foldedAuditPanelSmokePath, "utf8");
const previewBuilderSmoke = readFileSync(previewBuilderSmokePath, "utf8");
const substrateSmoke = readFileSync(substrateSmokePath, "utf8");
const geometryDigestSmoke = readFileSync(geometryDigestSmokePath, "utf8");
const productWriteStoplineSmoke = readFileSync(productWriteStoplineSmokePath, "utf8");

assertTypeAndBuilderContracts();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenImplementationPatterns();
assertDocsPointers();
assertFeedbackEventStoreDownstreamPointer();
assertAdjacentSmokePointers();

const builderModule = await importBuilderModule();
const rebuiltDecision =
  builderModule.buildCandidateToCodexHandoffOperatorDecisionPreview({
    handoffDraftReview: sourceReviewFixture,
    scope: "project:augnes",
    as_of:
      "fixture:research-candidate-review.candidate-to-codex-handoff-operator-decision.sample.v0.1",
  });
const rebuiltDecisionAgain =
  builderModule.buildCandidateToCodexHandoffOperatorDecisionPreview({
    handoffDraftReview: sourceReviewFixture,
    scope: "project:augnes",
    as_of:
      "fixture:research-candidate-review.candidate-to-codex-handoff-operator-decision.sample.v0.1",
  });

assert.deepEqual(
  rebuiltDecision,
  decisionFixture,
  "rebuilt Candidate-to-Codex handoff operator decision preview must match committed fixture",
);
assert.equal(
  rebuiltDecision.decision_preview_fingerprint,
  rebuiltDecisionAgain.decision_preview_fingerprint,
  "decision preview fingerprint must be stable across repeated builds",
);
assertDecisionPreview(decisionFixture);

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1",
      final_status: "pass",
      decision_preview_fingerprint: decisionFixture.decision_preview_fingerprint,
      source_handoff_draft_review_fingerprint:
        decisionFixture.source_handoff_draft_review_fingerprint,
      next_recommended_slice: decisionFixture.next_recommended_slice,
      checked_operator_decision_required_not_satisfied: true,
      checked_no_codex_github_external_db_provider_retrieval_or_product_write: true,
      checked_product_write_stopline_parked: true,
    },
    null,
    2,
  ),
);

function assertTypeAndBuilderContracts() {
  for (const exportName of [
    "CandidateToCodexHandoffOperatorDecisionPreview",
    "CandidateToCodexHandoffOperatorDecisionInput",
    "CandidateToCodexHandoffOperatorDecisionStatus",
    "CandidateToCodexHandoffOperatorDecisionOption",
    "CandidateToCodexHandoffOperatorDecisionRequiredAcknowledgement",
    "CandidateToCodexHandoffOperatorDecisionAuthorityBoundary",
    "CandidateToCodexHandoffOperatorDecisionLineage",
    "CandidateToCodexHandoffOperatorDecisionValidationResult",
  ]) {
    assert.match(
      typeSource,
      new RegExp(`export\\s+(interface|type)\\s+${escapeRegExp(exportName)}\\b`),
      `type file must export ${exportName}`,
    );
  }
  for (const exportName of [
    "buildCandidateToCodexHandoffOperatorDecisionPreview",
    "validateCandidateToCodexHandoffOperatorDecisionPreview",
    "createCandidateToCodexHandoffOperatorDecisionFingerprint",
  ]) {
    assert.match(
      builderSource,
      new RegExp(`export\\s+function\\s+${escapeRegExp(exportName)}\\b`),
      `builder must export ${exportName}`,
    );
  }
  for (const requiredText of [
    "candidate_to_codex_handoff_operator_decision_preview",
    "candidate_to_codex_handoff_operator_decision.v0.1",
    "operator_decision_required_before_any_codex_or_github_execution",
    nextRecommendedSlice,
    "can_execute_codex",
    "can_call_github",
    "can_run_retrieval_or_rag",
    "can_fetch_sources",
    "product_write_lane_parked_by_686",
  ]) {
    assert.ok(typeSource.includes(requiredText), `type source must include ${requiredText}`);
    assert.ok(
      builderSource.includes(requiredText),
      `builder source must include ${requiredText}`,
    );
  }
  assert.doesNotMatch(
    builderSource,
    /^import\s+(?!type\b)/m,
    "builder must keep runtime imports out",
  );
}

function assertDecisionPreview(preview) {
  assert.equal(
    preview.decision_preview_kind,
    "candidate_to_codex_handoff_operator_decision_preview",
  );
  assert.equal(
    preview.decision_preview_version,
    "candidate_to_codex_handoff_operator_decision.v0.1",
  );
  assert.equal(
    preview.source_handoff_draft_review_fingerprint,
    sourceReviewFixture.review_fingerprint,
  );
  assert.equal(
    sourceReviewFixture.next_recommended_slice,
    sourceReviewExpectedNextSlice,
  );
  assert.match(preview.decision_preview_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(preview.fingerprint_algorithm, "fnv1a32_canonical_json");
  assert.equal(preview.operator_decision_required, true);
  assert.equal(preview.operator_decision_satisfied_now, false);
  assert.equal(preview.operator_decision, null);
  assert.equal(preview.operator_note, null);
  assert.equal(
    preview.operator_decision_status,
    "operator_decision_required_before_any_codex_or_github_execution",
  );
  assert.equal(preview.recommendation_status, "ready_for_feedback_event_store_minimal_v0_1");
  assert.equal(preview.next_recommended_slice, nextRecommendedSlice);
  assert.equal(preview.validation.passed, true);
  assert.deepEqual(preview.validation.failure_codes, []);

  assertDecisionOptions(preview.decision_options);
  assertRequiredAcknowledgements(preview.required_acknowledgements);
  assertExecutionBlockers(preview.execution_blockers);
  assertAuthorityBoundary(preview.authority_boundary);
  assert.equal(preview.authority_boundary.can_run_retrieval_or_rag, false);
  assert.equal(preview.authority_boundary.can_fetch_sources, false);
  assert.equal(preview.manual_lineage_summary.manual_lineage_preserved, true);
  assert.ok(preview.lineage.manual_ai_context_packet_base_ref);
  assert.ok(preview.lineage.manual_research_candidate_review_refs.length > 0);
  assert.ok(preview.lineage.manual_formation_receipt_refs.length > 0);
  assert.equal(preview.unresolved_tension_summary.unresolved_tensions_preserved, true);
  assert.match(preview.lineage.product_write_stopline_ref, /pr:686/);
  assert.equal(preview.authority_boundary.product_write_lane_parked_by_686, true);
  assert.equal(
    preview.lineage.source_handoff_draft_fingerprint,
    sourceDraftFixture.draft_fingerprint,
  );
  assert.equal(
    preview.lineage.source_ai_context_packet_fingerprint,
    sourcePacketFixture.packet_fingerprint,
  );
}

function assertDecisionOptions(options) {
  assert.deepEqual(
    options.map((option) => option.option_id).sort(),
    [...requiredDecisionOptions].sort(),
  );
  for (const option of options) {
    assert.equal(option.execution_authority_granted_now, false);
    assert.equal(option.github_authority_granted_now, false);
    assert.equal(option.branch_or_pr_authority_granted_now, false);
    assert.equal(option.durable_write_authority_granted_now, false);
    assert.equal(option.product_write_authority_granted_now, false);
  }
}

function assertRequiredAcknowledgements(acknowledgements) {
  assert.deepEqual(
    acknowledgements
      .map((acknowledgement) => acknowledgement.acknowledgement_id)
      .sort(),
    [...requiredAcknowledgements].sort(),
  );
  for (const acknowledgement of acknowledgements) {
    assert.equal(acknowledgement.required, true);
    assert.equal(acknowledgement.satisfied_now, false);
  }
}

function assertExecutionBlockers(blockers) {
  for (const blocker of requiredExecutionBlockers) {
    assert.ok(blockers.includes(blocker), `execution blocker ${blocker}`);
  }
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.preview_only, true);
  assert.equal(boundary.review_only, true);
  assert.equal(boundary.operator_decision_recorded_now, false);
  assert.equal(boundary.operator_decision_satisfied_now, false);
  assert.equal(boundary.product_write_lane_parked_by_686, true);
  for (const forbiddenKey of [
    "can_execute_codex",
    "can_create_branch",
    "can_open_pr",
    "can_call_github",
    "can_send_external_handoff",
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
    "durable_write_authority",
    "merge_authority",
  ]) {
    assert.equal(boundary[forbiddenKey], false, `${forbiddenKey} must be false`);
  }
}

function assertPackageScript() {
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  assert.equal(packageJson.scripts[feedbackPackageScriptName], feedbackPackageScriptValue);
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
  assert.deepEqual(
    addedScriptNames,
    [feedbackPackageScriptName],
    "package additions must only include the Feedback Event Store smoke script",
  );
  assert.doesNotMatch(
    packageAddedLines.join("\n"),
    /"dependencies"\s*:/,
    "dependencies must not be added",
  );
  assert.doesNotMatch(
    packageAddedLines.join("\n"),
    /"devDependencies"\s*:/,
    "dev dependencies must not be added",
  );
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  for (const expectedFile of expectedChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      expectedChangedFiles.includes(changedFile),
      `unexpected changed file in operator decision slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    if (changedFile !== feedbackSchemaPath) {
      assert.doesNotMatch(changedFile, /^lib\/db(?:\.ts|\/)/, "must not change lib/db files");
      assert.doesNotMatch(changedFile, /schema\.sql$/, "must not change schema.sql");
      assert.doesNotMatch(changedFile, /(^|\/)(schema|migration|sql)\b/i, "must not change schema/migration/sql paths");
    }
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
  }
}

function assertNoForbiddenImplementationPatterns() {
  const scannedSources = [
    [typePath, typeSource],
    [builderPath, builderSource],
    [smokePath, stripForbiddenPatternDefinitions(smokeSource)],
    [feedbackTypePath, feedbackTypeSource],
    [feedbackHelperPath, feedbackHelperSource],
    [feedbackSchemaPath, feedbackSchemaSource],
    [feedbackSmokePath, stripForbiddenPatternDefinitions(feedbackSmokeSource)],
  ];
  const forbiddenPatterns = [
    pattern(["from ", '"openai"']),
    pattern(["new ", "OpenAI"]),
    pattern(["fetch", "("]),
    pattern(["XMLHttpRequest"]),
    pattern(["WebSocket"]),
    pattern(["EventSource"]),
    pattern(["sendBeacon"]),
    pattern(["localStorage"]),
    pattern(["sessionStorage"]),
    pattern(["indexedDB"]),
    pattern(["document", ".", "cookie"]),
    pattern(["createServer", "("]),
    pattern(["app", ".", "listen", "("]),
    pattern(["next", " ", "dev"]),
    pattern(["api", ".", "github", ".", "com"]),
    pattern(["Octokit"]),
    pattern(["gh", " ", "pr"]),
    pattern(["git", " ", "push"]),
    pattern(["codex", " ", "exec"]),
    pattern(["codex", " ", "run"]),
    pattern(["npm", " ", "run", " ", "codex"]),
    pattern(["executeProductWrite", "("]),
    pattern(["productDbWrite", "("]),
  ];
  for (const [filePath, source] of scannedSources) {
    for (const { label, regex } of forbiddenPatterns) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
}

function assertDocsPointers() {
  for (const requiredText of [
    "Candidate-to-Codex handoff operator decision preview v0.1",
    typePath,
    builderPath,
    decisionFixturePath,
    smokePath,
    packageScriptName,
    "consumes #693 handoff draft review as advisory input",
    "operator decision required but not satisfied",
    "no Codex execution",
    "no branch/PR/GitHub automation",
    "no external handoff sending",
    "no provider/OpenAI/source-fetch/retrieval/RAG execution",
    "no DB/proof/evidence/work/Perspective durable write",
    "no product write",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Candidate-to-Codex handoff operator decision preview/i);
    assert.match(doc, /operator\s+decision\s+required/i);
    assert.match(doc, /preview-only|preview only/i);
    assert.match(doc, /non-authoritative|not source of truth/i);
    assert.match(doc, /manual lineage|manual-note/i);
    assert.match(doc, /source refs/i);
    assert.match(doc, /unresolved tensions/i);
    assert.match(doc, /product-write stopline|product write/i);
    assert.match(doc, /no Codex execution/i);
    assert.match(doc, /no branch\/PR\/GitHub automation/i);
    assert.match(doc, /no external handoff/i);
    assert.match(doc, /no provider\/OpenAI/i);
    assert.match(doc, /no source fetch|source-fetch/i);
    assert.match(doc, /no DB|DB\/SQL/i);
    assert.match(doc, /no product write/i);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
  for (const doc of [substrateDoc, surfaceDoc]) {
    assert.match(doc, /no retrieval\/RAG|retrieval\/RAG execution/i);
  }
  assert.match(gateDoc, /no\s+retrieval\/RAG execution/i);
  assert.match(gateDoc, /no source fetch/i);
  assert.match(gateDoc, /no provider\/OpenAI call/i);
  assert.match(gateDoc, /no Codex execution/i);
  assert.match(gateDoc, /no branch\/PR\/GitHub automation/i);
  assert.match(gateDoc, /no product write/i);
  assert.match(gateDoc, new RegExp(nextRecommendedSlice));
  assertGateRecentHandoffSection();
}

function assertFeedbackEventStoreDownstreamPointer() {
  for (const requiredText of [
    feedbackTypePath,
    feedbackHelperPath,
    feedbackFixturePath,
    feedbackSmokePath,
    feedbackSchemaPath,
    feedbackPackageScriptName,
    feedbackNextRecommendedSlice,
    "feedback_event_store.v0.1",
    "research_candidate_feedback_events",
    "dismiss_preview",
    "pin_preview",
    "correct_preview",
    "invalidate_preview",
    "durable_feedback_event",
    "product_write_authority",
    "retrieval_rag_authority",
  ]) {
    assert.ok(
      smokeSource.includes(requiredText) ||
        feedbackTypeSource.includes(requiredText) ||
        feedbackHelperSource.includes(requiredText) ||
        feedbackSmokeSource.includes(requiredText) ||
        feedbackSchemaSource.includes(requiredText) ||
        indexDoc.includes(requiredText),
      `operator decision smoke downstream pointer must include ${requiredText}`,
    );
  }
  assert.equal(feedbackFixture.fixture_version, "feedback_event_store.v0.1");
  assert.equal(feedbackFixture.next_recommended_slice, feedbackNextRecommendedSlice);
  assert.equal(feedbackFixture.product_write_stopline_ref, "pr:686");
  assert.equal(feedbackFixture.events.length, 4);
  assert.equal(decisionFixture.next_recommended_slice, nextRecommendedSlice);
}

function assertGateRecentHandoffSection() {
  const recentSection = normalizeWhitespace(
    extractGateDocSection(
      "AI Context Packet compiler GeometryDigest/Substrate upgrade",
      "The Research Candidate AI Context Packet preview",
    ),
  );
  for (const requiredText of [
    "not source of truth, proof/evidence, durable Perspective state, execution authority, retrieval/RAG execution",
    "no provider/OpenAI call, no source fetch, no retrieval/RAG execution",
    "not retrieval/RAG output",
    "no Codex execution",
    "no branch/PR/GitHub automation",
    "no product write",
    nextRecommendedSlice,
  ]) {
    assert.ok(
      recentSection.includes(requiredText),
      `recent gate handoff section must include ${requiredText}`,
    );
  }
  const sectionWithoutAllowedRetrievalBoundary = recentSection
    .replaceAll("no retrieval/RAG execution", "")
    .replaceAll("retrieval/RAG execution", "")
    .replaceAll("not retrieval/RAG output", "");
  for (const forbiddenText of [
    "no retrieval execution",
    "retrieval execution",
    "not retrieval output",
  ]) {
    assert.ok(
      !sectionWithoutAllowedRetrievalBoundary.includes(forbiddenText),
      `recent gate handoff section must not drift to retrieval-only wording: ${forbiddenText}`,
    );
  }
}

function assertAdjacentSmokePointers() {
  for (const [label, source] of [
    ["#693 handoff draft review", sourceReviewSmoke],
    ["#692 handoff draft", sourceDraftSmoke],
    ["#691 AI Context Packet geometry/substrate upgrade", sourcePacketSmoke],
    ["#690 folded audit panel", foldedAuditPanelSmoke],
    ["#689 preview builder", previewBuilderSmoke],
    ["#688 substrate", substrateSmoke],
    ["#687 geometry digest", geometryDigestSmoke],
  ]) {
    assert.match(source, new RegExp(packageScriptName), `${label} smoke package pointer`);
    assert.match(source, new RegExp(nextRecommendedSlice), `${label} smoke next pointer`);
  }
  assert.match(productWriteStoplineSmoke, /product_write_preflight_stopline_reached/);
  assert.match(productWriteStoplineSmoke, /product_write_lane|product-write|product write/i);
}

async function importBuilderModule() {
  const transformedSource = stripTypeScriptTypes(builderSource, {
    mode: "transform",
  });
  return import(
    `data:text/javascript;charset=utf-8,${encodeURIComponent(transformedSource)}`
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

function extractScriptName(line) {
  return line.replace(/^\+\s*/, "").trim().match(/^"([^"]+)"/)?.[1] ?? null;
}

function extractGateDocSection(startMarker, endMarker) {
  const start = gateDoc.indexOf(startMarker);
  assert.notEqual(start, -1, `gate doc must include ${startMarker}`);
  const end = gateDoc.indexOf(endMarker, start);
  assert.notEqual(end, -1, `gate doc must include ${endMarker} after ${startMarker}`);
  return gateDoc.slice(start, end);
}

function normalizeWhitespace(source) {
  return source.replace(/\s+/g, " ");
}

function stripForbiddenPatternDefinitions(source) {
  return source
    .split("\n")
    .filter((line) => !line.includes("pattern(["))
    .join("\n");
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
