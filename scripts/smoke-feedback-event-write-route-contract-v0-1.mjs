import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";

const typePath = "types/feedback-event-write-route-contract.ts";
const builderPath =
  "lib/research-candidate-review/feedback-event-write-route-contract.ts";
const reviewControlsFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-review-controls-preview.sample.v0.1.json";
const feedbackEventStoreFixturePath =
  "fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json";
const contractFixturePath =
  "fixtures/research-candidate-review.feedback-event-write-route-contract.sample.v0.1.json";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";
const reviewControlsSmokePath =
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs";
const minimalSmokePath = "scripts/smoke-feedback-event-store-minimal-v0-1.mjs";
const operatorDecisionSmokePath =
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs";
const foldedAuditPanelSmokePath =
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs";
const previewBuilderSmokePath =
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs";
const substrateSmokePath = "scripts/smoke-agent-perspective-substrate-v0-1.mjs";
const smokePath = "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs";

const packageScriptName = "smoke:feedback-event-write-route-contract-v0-1";
const packageScriptValue = `node ${smokePath}`;
const routePath = "/api/research-candidate/feedback-events";
const recommendationStatus =
  "ready_for_feedback_event_write_route_implementation_v0_1";
const nextRecommendedSlice = "feedback_event_write_route_implementation_v0_1";
const requiredAcknowledgements = [
  "durable_feedback_event_only",
  "not_proof_or_evidence",
  "not_perspective_promotion",
  "not_work_mutation",
  "not_execution_authority",
  "not_codex_execution",
  "not_github_automation",
  "not_external_handoff",
  "not_provider_openai_call",
  "not_source_fetch",
  "not_retrieval_rag_execution",
  "not_product_write",
  "product_write_lane_parked_by_686",
];
const requiredRefusalCodes = [
  "route_not_implemented_in_this_slice",
  "missing_authority_acknowledgement",
  "invalid_event_type",
  "invalid_target_kind",
  "missing_target_id",
  "missing_source_refs_without_reason",
  "correction_text_required_for_correct_preview",
  "operator_note_secret_like_pattern",
  "forbidden_authority_requested",
  "product_write_authority_requested",
  "retrieval_rag_execution_requested",
  "provider_openai_call_requested",
  "source_fetch_requested",
  "codex_or_github_automation_requested",
];
const appRoutePathCandidates = [
  "app/api/research-candidate/feedback-events/route.ts",
  "app/api/research-candidate/feedback-events/route.tsx",
  "app/api/research-candidate/feedback-events/route.js",
  "app/api/research-candidate/feedback-events/route.mjs",
];
const requiredChangedFiles = [
  typePath,
  builderPath,
  contractFixturePath,
  smokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  reviewControlsSmokePath,
];
const allowedChangedFiles = [
  ...requiredChangedFiles,
  minimalSmokePath,
  operatorDecisionSmokePath,
  foldedAuditPanelSmokePath,
  previewBuilderSmokePath,
  substrateSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-research-candidate-review-perspective-geometry-digest-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];

for (const filePath of [
  typePath,
  builderPath,
  reviewControlsFixturePath,
  feedbackEventStoreFixturePath,
  contractFixturePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  reviewControlsSmokePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

for (const appRoutePath of appRoutePathCandidates) {
  assert.ok(!existsSync(appRoutePath), `${appRoutePath} must not exist`);
}

const typeSource = readFileSync(typePath, "utf8");
const builderSource = readFileSync(builderPath, "utf8");
const smokeSource = readFileSync(smokePath, "utf8");
const reviewControlsSmokeSource = readFileSync(reviewControlsSmokePath, "utf8");
const reviewControlsFixture = readJson(reviewControlsFixturePath);
const feedbackEventStoreFixture = readJson(feedbackEventStoreFixturePath);
const contractFixture = readJson(contractFixturePath);
const packageJson = readJson(packagePath);
const indexDoc = readFileSync(indexPath, "utf8");
const substrateDoc = readFileSync(substrateDocPath, "utf8");
const surfaceDoc = readFileSync(surfaceDocPath, "utf8");
const gateDoc = readFileSync(gateDocPath, "utf8");

assertTypeAndBuilderContracts();
assertPackageScript();
assertStaticBoundary();
assertNoForbiddenImplementationPatterns();
assertDocsPointers();
assertReviewControlsDownstreamPointer();

const builderModule = await importBuilderModule();
const rebuiltContract = builderModule.buildFeedbackEventWriteRouteContract(
  buildContractInput(),
);
const rebuiltContractAgain = builderModule.buildFeedbackEventWriteRouteContract(
  buildContractInput(),
);

assert.deepEqual(
  rebuiltContract,
  contractFixture,
  "rebuilt write route contract fixture must match committed fixture",
);
assert.equal(
  rebuiltContract.contract_fingerprint,
  rebuiltContractAgain.contract_fingerprint,
  "route contract fingerprint must be stable across repeated builds",
);

assertContract(contractFixture, builderModule);

console.log(
  JSON.stringify(
    {
      smoke: "feedback-event-write-route-contract-v0-1",
      final_status: "pass",
      contract_fingerprint: contractFixture.contract_fingerprint,
      route_path: contractFixture.route_path,
      route_method: contractFixture.route_method,
      route_implemented_now: contractFixture.route_implemented_now,
      refusal_contract_count: contractFixture.refusal_contracts.length,
      next_recommended_slice: contractFixture.next_recommended_slice,
      checked_no_route_handler: true,
      checked_no_db_open_or_sql_execution: true,
      checked_product_write_lane_parked: true,
    },
    null,
    2,
  ),
);

function assertTypeAndBuilderContracts() {
  for (const exportName of [
    "FeedbackEventWriteRouteContract",
    "FeedbackEventWriteRouteContractInput",
    "FeedbackEventWriteRouteRequest",
    "FeedbackEventWriteRouteResponse",
    "FeedbackEventWriteRouteRefusal",
    "FeedbackEventWriteRouteIdempotencyContract",
    "FeedbackEventWriteRouteAuthorityBoundary",
    "FeedbackEventWriteRouteValidationResult",
  ]) {
    assert.match(
      typeSource,
      new RegExp(`export\\s+(interface|type)\\s+${escapeRegExp(exportName)}\\b`),
      `type file must export ${exportName}`,
    );
  }
  for (const exportName of [
    "buildFeedbackEventWriteRouteContract",
    "validateFeedbackEventWriteRouteContract",
    "createFeedbackEventWriteRouteContractFingerprint",
  ]) {
    assert.match(
      builderSource,
      new RegExp(`export\\s+function\\s+${escapeRegExp(exportName)}\\b`),
      `builder must export ${exportName}`,
    );
  }
  for (const requiredText of [
    "feedback_event_write_route_contract.v0.1",
    routePath,
    "feedback_event_write_route_request.v0.1",
    "feedback_event_write_route_response.v0.1",
    "route_not_implemented_in_this_slice",
    "contract_only",
    "route_implemented_now",
    "durable_feedback_event_written_now",
    "runtime_write_executed_now",
    "db_open_now",
    "sql_execution_now",
    "server_action_available_now",
    "retrieval_rag_authority",
    "source_fetch_authority",
    "product_write_authority",
    "product_id_allocation_authority",
    "product_write_lane_parked_by_686",
    recommendationStatus,
    nextRecommendedSlice,
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
  assert.deepEqual(
    addedScriptNames,
    [packageScriptName],
    "package additions must only include the feedback event write route contract smoke script",
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
  for (const expectedFile of requiredChangedFiles) {
    assert.ok(changedFiles.includes(expectedFile), `changed files must include ${expectedFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      allowedChangedFiles.includes(changedFile),
      `unexpected changed file in write route contract slice: ${changedFile}`,
    );
    assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(schema|migration|db|sql)\b/i, "must not change schema/db/sql paths");
    if (
      changedFile !==
      "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs"
    ) {
      assert.doesNotMatch(
        changedFile,
        /product.*write/i,
        "must not change product write files",
      );
    }
  }
}

function assertNoForbiddenImplementationPatterns() {
  const strippedSmokeSource = stripSmokeAssertionText(smokeSource);
  const scannedSources = [
    [typePath, typeSource],
    [builderPath, builderSource],
    [smokePath, strippedSmokeSource],
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
    { label: "gh-pr-command", regex: /\bgh\s+pr\b/i },
    { label: "git-push-command", regex: /\bgit\s+push\b/i },
    { label: "codex-exec-command", regex: /\bcodex\s+exec\b/i },
    { label: "codex-run-command", regex: /\bcodex\s+run\b/i },
    { label: "npm-run-codex-command", regex: /\bnpm\s+run\s+codex\b/i },
    pattern(["executeProductWrite", "("]),
    pattern(["productDbWrite", "("]),
  ];
  for (const [filePath, source] of scannedSources) {
    for (const { label, regex } of forbiddenPatterns) {
      assert.doesNotMatch(source, regex, `${filePath} must not include ${label}`);
    }
  }
  for (const [filePath, source] of [
    [builderPath, builderSource],
    [smokePath, strippedSmokeSource],
  ]) {
    assert.doesNotMatch(
      source,
      /\b(insertFeedbackEvent|listFeedbackEvents|feedbackEventStoreSchemaSql|feedbackEventStoreTableName|better-sqlite3|new\s+Database|\.exec\()\b/,
      `${filePath} must not include DB-backed feedback write behavior`,
    );
  }
}

function assertDocsPointers() {
  for (const requiredText of [
    "Feedback Event write route contract v0.1",
    typePath,
    builderPath,
    contractFixturePath,
    smokePath,
    packageScriptName,
    routePath,
    "route path documented but not implemented",
    "no app/api route yet",
    "no DB open/write yet",
    "no SQL execution",
    "no proof/evidence/Perspective promotion/work mutation",
    "no Codex/GitHub automation/external handoff",
    "no provider/OpenAI/source-fetch/retrieval/RAG execution",
    "no product write/product IDs",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Feedback Event write route contract v0\.1/i);
    assert.match(doc, /contract-only|contract only/i);
    assert.match(doc, new RegExp(escapeRegExp(routePath)));
    assert.match(doc, /adds no route|no route\/API\/server action|no app\/api route/i);
    assert.match(doc, /no DB write|no DB open|does not write feedback/i);
    assert.match(doc, /no provider\/OpenAI/i);
    assert.match(doc, /no source fetch|source-fetch/i);
    assert.match(doc, /no retrieval\/RAG execution/i);
    assert.match(doc, /no Codex execution/i);
    assert.match(doc, /no GitHub automation|no branch\/PR\/GitHub automation/i);
    assert.match(doc, /no product write/i);
    assert.match(doc, /#686/);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertReviewControlsDownstreamPointer() {
  for (const requiredText of [
    packageScriptName,
    nextRecommendedSlice,
    typePath,
    builderPath,
    contractFixturePath,
    smokePath,
    recommendationStatus,
  ]) {
    assert.ok(
      reviewControlsSmokeSource.includes(requiredText),
      `#696 review controls smoke must allow downstream route contract text: ${requiredText}`,
    );
  }
  assert.equal(
    reviewControlsFixture.next_recommended_slice,
    "feedback_event_write_route_contract_v0_1",
    "#696 review controls fixture output must remain unchanged",
  );
}

function assertContract(contract, builderModule) {
  assert.equal(contract.contract_kind, "feedback_event_write_route_contract");
  assert.equal(contract.contract_version, "feedback_event_write_route_contract.v0.1");
  assert.equal(contract.route_path, routePath);
  assert.equal(contract.route_method, "POST");
  assert.equal(contract.route_implemented_now, false);
  assert.equal(contract.source_review_controls_preview_fixture_path, reviewControlsFixturePath);
  assert.equal(contract.source_feedback_event_store_fixture_path, feedbackEventStoreFixturePath);
  assert.equal(
    contract.source_review_controls_preview_fingerprint,
    reviewControlsFixture.preview_fingerprint,
  );
  assert.equal(contract.recommendation_status, recommendationStatus);
  assert.equal(contract.next_recommended_slice, nextRecommendedSlice);
  assert.match(contract.contract_fingerprint, /^fnv1a32:[0-9a-f]{8}$/);
  assert.equal(contract.validation.passed, true);
  assert.deepEqual(contract.validation.failure_codes, []);
  assert.equal(builderModule.validateFeedbackEventWriteRouteContract(contract).passed, true);
  assertRequestContract(contract.request_contract);
  assertResponseContract(contract.response_contract);
  assert.deepEqual(
    contract.refusal_contracts.map((refusal) => refusal.refusal_code).sort(),
    [...requiredRefusalCodes].sort(),
  );
  assert.equal(contract.idempotency_contract.idempotency_key_optional_in_request, true);
  assert.equal(
    contract.idempotency_contract.derives_from_normalized_event_input_when_missing,
    true,
  );
  assert.equal(
    contract.idempotency_contract.duplicate_idempotency_key_returns_duplicate_true,
    true,
  );
  assert.equal(contract.idempotency_contract.duplicate_inserted_false, true);
  assert.equal(contract.idempotency_contract.duplicate_row_created, false);
  assert.equal(contract.idempotency_contract.db_insert_tested_in_this_slice, false);
  assertAuthorityBoundary(contract.authority_boundary);
}

function assertRequestContract(request) {
  assert.equal(request.request_version, "feedback_event_write_route_request.v0.1");
  assert.equal(request.event_type, "correct_preview");
  assert.ok(request.target_id);
  assert.ok(Array.isArray(request.source_ref_ids));
  assert.ok(request.source_ref_ids.length > 0);
  assert.ok(request.correction_text);
  assert.ok(request.idempotency_key);
  assert.deepEqual(
    request.authority_acknowledgements.slice().sort(),
    [...requiredAcknowledgements].sort(),
  );
}

function assertResponseContract(response) {
  assert.equal(response.response_version, "feedback_event_write_route_response.v0.1");
  assert.equal(response.accepted, false);
  assert.equal(response.inserted, false);
  assert.equal(response.duplicate, false);
  assert.equal(response.event_id, null);
  assert.ok(response.idempotency_key);
  assert.equal(response.route_implemented_now, false);
  assert.equal(response.runtime_write_executed_now, false);
  assert.equal(response.db_open_now, false);
  assert.equal(response.sql_execution_now, false);
  assert.equal(response.validation.passed, false);
  assert.deepEqual(response.validation.failure_codes, ["route_not_implemented_in_this_slice"]);
  assert.equal(response.refusal.refusal_code, "route_not_implemented_in_this_slice");
  assertAuthorityBoundary(response.authority_boundary);
}

function assertAuthorityBoundary(boundary) {
  assert.equal(boundary.contract_only, true);
  assert.equal(boundary.product_write_lane_parked_by_686, true);
  for (const forbiddenKey of [
    "route_implemented_now",
    "durable_feedback_event_written_now",
    "runtime_write_executed_now",
    "db_open_now",
    "sql_execution_now",
    "server_action_available_now",
    "proof_or_evidence_record",
    "perspective_promotion",
    "work_mutation",
    "execution_authority",
    "codex_execution_authority",
    "github_automation_authority",
    "external_handoff_authority",
    "provider_openai_authority",
    "retrieval_rag_authority",
    "source_fetch_authority",
    "product_write_authority",
    "product_id_allocation_authority",
  ]) {
    assert.equal(boundary[forbiddenKey], false, `${forbiddenKey} must be false`);
  }
}

function buildContractInput() {
  return {
    reviewControlsPreview: reviewControlsFixture,
    feedbackEventStoreFixture,
    scope: "project:augnes",
    as_of:
      "fixture:research-candidate-review.feedback-event-write-route-contract.sample.v0.1",
  };
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

function stripSmokeAssertionText(source) {
  return source
    .split("\n")
    .filter((line) => !line.includes("pattern(["))
    .filter((line) => !line.includes("insertFeedbackEvent"))
    .filter((line) => !line.includes("listFeedbackEvents"))
    .filter((line) => !line.includes("feedbackEventStoreSchemaSql"))
    .filter((line) => !line.includes("feedbackEventStoreTableName"))
    .filter((line) => !line.includes("better-sqlite3"))
    .filter((line) => !line.includes("new Database"))
    .filter((line) => !line.includes(".exec("))
    .join("\n");
}

function pattern(parts) {
  const label = parts.join("");
  return {
    label,
    regex: new RegExp(parts.map(escapeRegExp).join("\\s*"), "i"),
  };
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
