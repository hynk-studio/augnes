import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const routeFilePath = "app/api/research-candidate/feedback-events/route.ts";
const smokePath =
  "scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs";
const fixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-route-implementation.sample.v0.1.json";
const browserValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-route-browser-validation.sample.v0.1.json";
const listRouteContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-route-contract.sample.v0.1.json";
const feedbackStoreFixturePath =
  "fixtures/research-candidate-review.feedback-event-store.sample.v0.1.json";
const uiBrowserValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-controls-ui-browser-validation.sample.v0.1.json";
const listRouteContractSmokePath =
  "scripts/smoke-feedback-event-store-list-route-contract-v0-1.mjs";
const uiBrowserValidationSmokePath =
  "scripts/smoke-feedback-event-controls-ui-browser-validation-v0-1.mjs";
const uiImplementationSmokePath =
  "scripts/smoke-feedback-event-controls-ui-implementation-v0-1.mjs";
const uiContractSmokePath =
  "scripts/smoke-feedback-event-controls-ui-contract-v0-1.mjs";
const writeRouteImplementationSmokePath =
  "scripts/smoke-feedback-event-write-route-implementation-v0-1.mjs";
const writeRouteBrowserValidationSmokePath =
  "scripts/smoke-feedback-event-write-route-browser-validation-v0-1.mjs";
const writeRouteContractSmokePath =
  "scripts/smoke-feedback-event-write-route-contract-v0-1.mjs";
const reviewControlsSmokePath =
  "scripts/smoke-feedback-event-store-review-controls-preview-v0-1.mjs";
const feedbackEventStoreMinimalSmokePath =
  "scripts/smoke-feedback-event-store-minimal-v0-1.mjs";
const browserValidationSmokePath =
  "scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs";
const listUiContractTypePath =
  "types/feedback-event-store-list-ui-contract.ts";
const listUiContractBuilderPath =
  "lib/research-candidate-review/feedback-event-store-list-ui-contract.ts";
const listUiContractFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-ui-contract.sample.v0.1.json";
const listUiContractSmokePath =
  "scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs";
const listUiImplementationComponentPath =
  "components/feedback-event-store-list-panel.tsx";
const listUiImplementationFoldedAuditPanelPath =
  "components/agent-perspective-substrate-folded-audit-panel.tsx";
const listUiImplementationFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-ui-implementation.sample.v0.1.json";
const listUiImplementationSmokePath =
  "scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs";
const listUiBrowserValidationFixturePath =
  "fixtures/research-candidate-review.feedback-event-store-list-ui-browser-validation.sample.v0.1.json";
const listUiBrowserValidationSmokePath =
  "scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs";
const packagePath = "package.json";
const indexPath = "docs/00_INDEX_LATEST.md";
const substrateDocPath = "docs/AGENT_PERSPECTIVE_SUBSTRATE_V0_1.md";
const surfaceDocPath = "docs/RESEARCH_CANDIDATE_REVIEW_SURFACE_V0_1.md";
const gateDocPath =
  "docs/RESEARCH_CANDIDATE_CANONICAL_PROMOTION_GATES_V0_1.md";

const packageScriptName =
  "smoke:feedback-event-store-list-route-implementation-v0-1";
const packageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-feedback-event-store-list-route-implementation-v0-1.mjs";
const browserValidationPackageScriptName =
  "smoke:feedback-event-store-list-route-browser-validation-v0-1";
const browserValidationPackageScriptValue =
  "./apps/augnes_apps/node_modules/.bin/tsx --tsconfig tsconfig.json scripts/smoke-feedback-event-store-list-route-browser-validation-v0-1.mjs";
const listUiContractPackageScriptName =
  "smoke:feedback-event-store-list-ui-contract-v0-1";
const listUiContractPackageScriptValue =
  "node scripts/smoke-feedback-event-store-list-ui-contract-v0-1.mjs";
const listUiImplementationPackageScriptName =
  "smoke:feedback-event-store-list-ui-implementation-v0-1";
const listUiImplementationPackageScriptValue =
  "node scripts/smoke-feedback-event-store-list-ui-implementation-v0-1.mjs";
const listUiBrowserValidationPackageScriptName =
  "smoke:feedback-event-store-list-ui-browser-validation-v0-1";
const listUiBrowserValidationPackageScriptValue =
  "node scripts/smoke-feedback-event-store-list-ui-browser-validation-v0-1.mjs";
const routePath = "/api/research-candidate/feedback-events";
const routeMethod = "GET";
const requestVersion = "feedback_event_store_list_route_request.v0.1";
const responseVersion = "feedback_event_store_list_route_response.v0.1";
const recommendationStatus =
  "ready_for_feedback_event_store_list_route_browser_validation_v0_1";
const nextRecommendedSlice =
  "feedback_event_store_list_route_browser_validation_v0_1";
const listUiContractRecommendationStatus =
  "ready_for_feedback_event_store_list_ui_implementation_v0_1";
const listUiContractNextRecommendedSlice =
  "feedback_event_store_list_ui_implementation_v0_1";
const listUiImplementationRecommendationStatus =
  "ready_for_feedback_event_store_list_ui_browser_validation_v0_1";
const listUiImplementationNextRecommendedSlice =
  "feedback_event_store_list_ui_browser_validation_v0_1";
const listUiBrowserValidationRecommendationStatus =
  "ready_for_feedback_event_aggregation_read_model_contract_v0_1";
const listUiBrowserValidationNextRecommendedSlice =
  "feedback_event_aggregation_read_model_contract_v0_1";
const writeFixture = process.argv.includes("--write-fixture");

const requiredAcknowledgements = [
  "read_feedback_events_only",
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
  "missing_authority_acknowledgement",
  "invalid_request_version",
  "invalid_event_type",
  "invalid_target_kind",
  "invalid_limit",
  "invalid_cursor",
  "raw_sql_filter_forbidden",
  "forbidden_authority_requested",
  "product_write_authority_requested",
  "retrieval_rag_execution_requested",
  "provider_openai_call_requested",
  "source_fetch_requested",
  "codex_or_github_automation_requested",
];

const expectedChangedFiles = [
  routeFilePath,
  smokePath,
  fixturePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  listRouteContractSmokePath,
  uiBrowserValidationSmokePath,
  uiImplementationSmokePath,
  uiContractSmokePath,
  writeRouteImplementationSmokePath,
  writeRouteBrowserValidationSmokePath,
  writeRouteContractSmokePath,
  reviewControlsSmokePath,
  feedbackEventStoreMinimalSmokePath,
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
const browserValidationChangedFiles = [
  browserValidationSmokePath,
  browserValidationFixturePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  smokePath,
  listRouteContractSmokePath,
  uiBrowserValidationSmokePath,
  uiImplementationSmokePath,
  uiContractSmokePath,
  writeRouteImplementationSmokePath,
  writeRouteBrowserValidationSmokePath,
  writeRouteContractSmokePath,
  reviewControlsSmokePath,
  feedbackEventStoreMinimalSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const listUiBrowserValidationChangedFiles = [
  listUiBrowserValidationFixturePath,
  listUiBrowserValidationSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  listUiImplementationSmokePath,
  listUiContractSmokePath,
  browserValidationSmokePath,
  smokePath,
  listRouteContractSmokePath,
  uiBrowserValidationSmokePath,
  uiImplementationSmokePath,
  uiContractSmokePath,
  writeRouteBrowserValidationSmokePath,
  writeRouteImplementationSmokePath,
  writeRouteContractSmokePath,
  reviewControlsSmokePath,
  feedbackEventStoreMinimalSmokePath,
];
const listUiContractChangedFiles = [
  listUiContractTypePath,
  listUiContractBuilderPath,
  listUiContractFixturePath,
  listUiContractSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  browserValidationSmokePath,
  smokePath,
  listRouteContractSmokePath,
  uiBrowserValidationSmokePath,
  uiImplementationSmokePath,
  uiContractSmokePath,
  writeRouteBrowserValidationSmokePath,
  writeRouteImplementationSmokePath,
  writeRouteContractSmokePath,
  reviewControlsSmokePath,
  feedbackEventStoreMinimalSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];
const listUiImplementationChangedFiles = [
  listUiImplementationComponentPath,
  listUiImplementationFoldedAuditPanelPath,
  listUiImplementationFixturePath,
  listUiImplementationSmokePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
  listUiContractSmokePath,
  browserValidationSmokePath,
  smokePath,
  listRouteContractSmokePath,
  uiImplementationSmokePath,
  uiBrowserValidationSmokePath,
  uiContractSmokePath,
  feedbackEventStoreMinimalSmokePath,
  reviewControlsSmokePath,
  writeRouteBrowserValidationSmokePath,
  writeRouteContractSmokePath,
  writeRouteImplementationSmokePath,
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-operator-decision-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-review-v0-1.mjs",
  "scripts/smoke-research-candidate-review-candidate-to-codex-handoff-draft-geometry-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-review-ai-context-packet-geometry-substrate-upgrade-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-folded-audit-panel-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-preview-builder-v0-1.mjs",
  "scripts/smoke-agent-perspective-substrate-v0-1.mjs",
  "scripts/smoke-research-candidate-single-claim-product-write-preflight-stopline-v0-1.mjs",
];

for (const filePath of [
  routeFilePath,
  listRouteContractFixturePath,
  feedbackStoreFixturePath,
  uiBrowserValidationFixturePath,
  packagePath,
  indexPath,
  substrateDocPath,
  surfaceDocPath,
  gateDocPath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}
if (!writeFixture) {
  assert.ok(existsSync(fixturePath), `${fixturePath} must exist`);
}

const routeSource = readFile(routeFilePath);
const smokeSource = readFile(smokePath);
const browserValidationSmokeSource = existsSync(browserValidationSmokePath)
  ? readFile(browserValidationSmokePath)
  : "";
const listUiContractSmokeSource = existsSync(listUiContractSmokePath)
  ? readFile(listUiContractSmokePath)
  : "";
const listRouteContractSmokeSource = readFile(listRouteContractSmokePath);
const packageJson = readJson(packagePath);
const indexDoc = readFile(indexPath);
const substrateDoc = readFile(substrateDocPath);
const surfaceDoc = readFile(surfaceDocPath);
const gateDoc = readFile(gateDocPath);
const listRouteContractFixture = readJson(listRouteContractFixturePath);
const feedbackStoreFixture = readJson(feedbackStoreFixturePath);
const uiBrowserValidationFixture = readJson(uiBrowserValidationFixturePath);

const feedbackStoreModule = unwrapModule(
  await import("../lib/research-candidate-review/feedback-event-store.ts"),
);
const routeModule = unwrapModule(
  await import("../app/api/research-candidate/feedback-events/route.ts"),
);

const {
  feedbackEventStoreSchemaSql,
  feedbackEventStoreTableName,
  insertFeedbackEvent,
} = feedbackStoreModule;
const { handleFeedbackEventStoreListRouteRequest } = routeModule;

assertRouteSource();
assertPackageScript();
if (!writeFixture) {
  assertStaticBoundary();
  assertNoForbiddenPatterns();
  assertDocsPointers();
  assertListRouteContractDownstreamPointer();
  assertBrowserValidationDownstreamPointer();
  assertListUiContractDownstreamPointer();
  assertListUiImplementationDownstreamPointer();
  assertListUiBrowserValidationDownstreamPointer();
}

const rebuiltFixture = buildImplementationFixture();
const rebuiltFixtureAgain = buildImplementationFixture();

if (writeFixture) {
  writeFileSync(fixturePath, `${JSON.stringify(rebuiltFixture, null, 2)}\n`);
  process.exit(0);
}

const implementationFixture = readJson(fixturePath);

assert.deepEqual(
  rebuiltFixture,
  implementationFixture,
  "rebuilt list route implementation fixture must match committed fixture",
);
assert.deepEqual(
  rebuiltFixture.responses.valid_list_response,
  rebuiltFixtureAgain.responses.valid_list_response,
  "list route implementation valid response must be stable",
);
assertImplementationFixture(implementationFixture);
assertRouteBehavior();

console.log(
  JSON.stringify(
    {
      smoke: "feedback-event-store-list-route-implementation-v0-1",
      final_status: "pass",
      route_path: implementationFixture.route_path,
      route_method: implementationFixture.route_method,
      valid_list_count: implementationFixture.responses.valid_list_response.count,
      refusal_codes_checked: requiredRefusalCodes,
      next_recommended_slice: implementationFixture.next_recommended_slice,
      checked_get_writes_no_feedback: true,
      checked_product_write_lane_parked: true,
    },
    null,
    2,
  ),
);

function buildImplementationFixture() {
  const responses = withTempDb((db) => {
    seedFixtureEvents(db);
    const validListResponse = handleFeedbackEventStoreListRouteRequest({
      url: buildListUrl({ limit: "4" }),
      db,
    });
    const filteredByEventTypeResponse = handleFeedbackEventStoreListRouteRequest({
      url: buildListUrl({ event_type: "pin_preview", limit: "10" }),
      db,
    });
    const filteredByTargetResponse = handleFeedbackEventStoreListRouteRequest({
      url: buildListUrl({
        target_kind: "agent_perspective_substrate_folded_section",
        target_id: "folded_section:source_coverage",
        limit: "10",
      }),
      db,
    });
    const createdWindowResponse = handleFeedbackEventStoreListRouteRequest({
      url: buildListUrl({
        created_after: "2026-06-22T00:01:00.000Z",
        created_before: "2026-06-22T00:03:00.000Z",
        limit: "10",
      }),
      db,
    });

    return {
      valid_list_response: validListResponse,
      filtered_by_event_type_response: filteredByEventTypeResponse,
      filtered_by_target_response: filteredByTargetResponse,
      created_window_response: createdWindowResponse,
      missing_ack_refusal_response: handleFeedbackEventStoreListRouteRequest({
        url: buildListUrl({}, { omitAcknowledgements: true }),
        db,
      }),
      invalid_request_version_refusal_response: handleFeedbackEventStoreListRouteRequest({
        url: buildListUrl({ request_version: "wrong.version" }),
        db,
      }),
      invalid_event_type_refusal_response: handleFeedbackEventStoreListRouteRequest({
        url: buildListUrl({ event_type: "downgrade_preview" }),
        db,
      }),
      invalid_target_kind_refusal_response: handleFeedbackEventStoreListRouteRequest({
        url: buildListUrl({ target_kind: "proof_evidence_record" }),
        db,
      }),
      invalid_limit_refusal_response: handleFeedbackEventStoreListRouteRequest({
        url: buildListUrl({ limit: "101" }),
        db,
      }),
      invalid_cursor_refusal_response: handleFeedbackEventStoreListRouteRequest({
        url: buildListUrl({ cursor: "raw-created-at:feedback-event-id" }),
        db,
      }),
      raw_sql_refusal_response: handleFeedbackEventStoreListRouteRequest({
        url: buildListUrl({ where: "1 = 1" }),
        db,
      }),
      forbidden_authority_refusal_response: handleFeedbackEventStoreListRouteRequest({
        url: buildListUrl({
          authority_boundary: JSON.stringify({ proof_or_evidence_record: true }),
        }),
        db,
      }),
      product_write_refusal_response: handleFeedbackEventStoreListRouteRequest({
        url: buildListUrl({
          authority_boundary: JSON.stringify({ product_write_authority: true }),
        }),
        db,
      }),
      retrieval_rag_refusal_response: handleFeedbackEventStoreListRouteRequest({
        url: buildListUrl({
          authority_boundary: JSON.stringify({ retrieval_rag_authority: true }),
        }),
        db,
      }),
      provider_openai_refusal_response: handleFeedbackEventStoreListRouteRequest({
        url: buildListUrl({
          authority_boundary: JSON.stringify({ provider_openai_authority: true }),
        }),
        db,
      }),
      source_fetch_refusal_response: handleFeedbackEventStoreListRouteRequest({
        url: buildListUrl({
          authority_boundary: JSON.stringify({ source_fetch_authority: true }),
        }),
        db,
      }),
      codex_github_refusal_response: handleFeedbackEventStoreListRouteRequest({
        url: buildListUrl({
          authority_boundary: JSON.stringify({
            codex_execution_authority: true,
            github_automation_authority: true,
          }),
        }),
        db,
      }),
    };
  });

  return {
    fixture_kind: "feedback_event_store_list_route_implementation_fixture",
    fixture_version: "feedback_event_store_list_route_implementation.v0.1",
    route_path: routePath,
    route_method: routeMethod,
    route_implemented_now: true,
    source_list_route_contract_ref: `${listRouteContractFixture.contract_version}:${listRouteContractFixturePath}`,
    source_list_route_contract_fingerprint: listRouteContractFixture.contract_fingerprint,
    source_feedback_event_store_ref: `${feedbackStoreFixture.fixture_version}:${feedbackStoreFixturePath}`,
    source_feedback_event_store_version: feedbackStoreFixture.fixture_version,
    source_feedback_event_controls_ui_browser_validation_ref: `${uiBrowserValidationFixture.validation_version}:${uiBrowserValidationFixturePath}`,
    source_feedback_event_controls_ui_browser_validation_route_path:
      uiBrowserValidationFixture.route_path,
    get_reads_feedback_events_only: true,
    get_writes_feedback_events_now: false,
    production_db_used_in_smoke_now: false,
    temp_db_used_in_smoke_now: true,
    proof_evidence_write_available: false,
    perspective_promotion_available: false,
    work_mutation_available: false,
    provider_openai_available: false,
    source_fetch_available: false,
    retrieval_rag_available: false,
    codex_github_available: false,
    product_write_available: false,
    product_write_lane_parked_by_686: true,
    responses,
    validation: {
      passed: true,
      failure_codes: [],
    },
    recommendation_status: recommendationStatus,
    next_recommended_slice: nextRecommendedSlice,
  };
}

function assertRouteBehavior() {
  withTempDb((db) => {
    seedFixtureEvents(db);
    assert.equal(countRows(db), feedbackStoreFixture.events.length);
    const validResponse = handleFeedbackEventStoreListRouteRequest({
      url: buildListUrl({ limit: "4" }),
      db,
    });
    assert.equal(validResponse.accepted, true);
    assert.equal(validResponse.count, 4);
    assert.equal(validResponse.events.length, 4);
    assert.equal(validResponse.response_version, responseVersion);
    assert.equal(validResponse.route_implemented_now, true);
    assert.equal(validResponse.runtime_read_executed_now, true);
    assert.equal(validResponse.db_open_now, true);
    assert.equal(validResponse.sql_execution_now, true);
    assert.equal(validResponse.authority_boundary.durable_feedback_event_read_now, true);
    assert.equal(validResponse.authority_boundary.durable_feedback_event_written_now, false);
    assert.deepEqual(
      validResponse.events.map((event) => event.created_at),
      [...validResponse.events.map((event) => event.created_at)].sort().reverse(),
      "events must be ordered by created_at DESC",
    );
    assert.deepEqual(
      validResponse.events.map((event) => event.event_id),
      feedbackStoreFixture.events
        .slice()
        .sort((left, right) => {
          const createdAtComparison = right.created_at.localeCompare(left.created_at);
          if (createdAtComparison !== 0) return createdAtComparison;
          return right.event_id.localeCompare(left.event_id);
        })
        .map((event) => event.event_id),
    );

    const filteredByEventType = handleFeedbackEventStoreListRouteRequest({
      url: buildListUrl({ event_type: "pin_preview" }),
      db,
    });
    assert.equal(filteredByEventType.accepted, true);
    assert.equal(filteredByEventType.count, 1);
    assert.equal(filteredByEventType.events[0].event_type, "pin_preview");

    const filteredByTarget = handleFeedbackEventStoreListRouteRequest({
      url: buildListUrl({
        target_kind: "agent_perspective_substrate_folded_section",
        target_id: "folded_section:source_coverage",
      }),
      db,
    });
    assert.equal(filteredByTarget.accepted, true);
    assert.equal(filteredByTarget.count, 1);
    assert.equal(filteredByTarget.events[0].target_id, "folded_section:source_coverage");
    assert.equal(countRows(db), feedbackStoreFixture.events.length);
  });

  for (const [urlParams, expectedCode, options] of [
    [{}, "missing_authority_acknowledgement", { omitAcknowledgements: true }],
    [{ request_version: "wrong.version" }, "invalid_request_version"],
    [{ event_type: "downgrade_preview" }, "invalid_event_type"],
    [{ target_kind: "proof_evidence_record" }, "invalid_target_kind"],
    [{ limit: "0" }, "invalid_limit"],
    [{ cursor: "not-implemented" }, "invalid_cursor"],
    [{ raw_sql: "SELECT * FROM proof_evidence" }, "raw_sql_filter_forbidden"],
    [
      { authority_boundary: JSON.stringify({ perspective_promotion: true }) },
      "forbidden_authority_requested",
    ],
    [
      { authority_boundary: JSON.stringify({ product_id_allocation_authority: true }) },
      "product_write_authority_requested",
    ],
    [
      { authority_boundary: JSON.stringify({ retrieval_rag_available: true }) },
      "retrieval_rag_execution_requested",
    ],
    [
      { authority_boundary: JSON.stringify({ provider_openai_authority: true }) },
      "provider_openai_call_requested",
    ],
    [
      { authority_boundary: JSON.stringify({ source_fetch_available: true }) },
      "source_fetch_requested",
    ],
    [
      { authority_boundary: JSON.stringify({ codex_execution_available: true }) },
      "codex_or_github_automation_requested",
    ],
  ]) {
    assertRefusalBeforeDbOpen(urlParams, expectedCode, options);
  }
}

function assertRefusalBeforeDbOpen(urlParams, expectedCode, options = {}) {
  let dbOpened = false;
  const response = handleFeedbackEventStoreListRouteRequest({
    url: buildListUrl(urlParams, options),
    db: () => {
      dbOpened = true;
      throw new Error("DB must not open for refused list request");
    },
  });
  assert.equal(dbOpened, false, `${expectedCode} must not open DB`);
  assert.equal(response.accepted, false, `${expectedCode} must refuse`);
  assert.equal(response.count, 0, `${expectedCode} must not return events`);
  assert.deepEqual(response.events, [], `${expectedCode} must not return events`);
  assert.equal(response.refusal.refusal_code, expectedCode);
  assert.deepEqual(response.validation.failure_codes, [expectedCode]);
  assert.equal(response.runtime_read_executed_now, false);
  assert.equal(response.db_open_now, false);
  assert.equal(response.sql_execution_now, false);
  assert.equal(response.authority_boundary.durable_feedback_event_read_now, false);
  assert.equal(response.authority_boundary.durable_feedback_event_written_now, false);
}

function assertImplementationFixture(value) {
  assert.equal(value.fixture_kind, "feedback_event_store_list_route_implementation_fixture");
  assert.equal(value.fixture_version, "feedback_event_store_list_route_implementation.v0.1");
  assert.equal(value.route_path, routePath);
  assert.equal(value.route_method, routeMethod);
  assert.equal(value.route_implemented_now, true);
  assert.equal(value.source_list_route_contract_fingerprint, listRouteContractFixture.contract_fingerprint);
  assert.equal(value.get_reads_feedback_events_only, true);
  assert.equal(value.get_writes_feedback_events_now, false);
  assert.equal(value.production_db_used_in_smoke_now, false);
  assert.equal(value.temp_db_used_in_smoke_now, true);
  assert.equal(value.product_write_lane_parked_by_686, true);
  assert.equal(value.recommendation_status, recommendationStatus);
  assert.equal(value.next_recommended_slice, nextRecommendedSlice);
  assert.equal(value.validation.passed, true);
  assert.deepEqual(value.validation.failure_codes, []);

  const validResponse = value.responses.valid_list_response;
  assert.equal(validResponse.accepted, true);
  assert.equal(validResponse.response_version, responseVersion);
  assert.equal(validResponse.count, feedbackStoreFixture.events.length);
  assert.equal(validResponse.events.length, feedbackStoreFixture.events.length);
  assert.equal(validResponse.route_implemented_now, true);
  assert.equal(validResponse.runtime_read_executed_now, true);
  assert.equal(validResponse.db_open_now, true);
  assert.equal(validResponse.sql_execution_now, true);
  assertListAuthorityBoundary(validResponse.authority_boundary, {
    readNow: true,
    dbOpenNow: true,
    sqlExecutionNow: true,
  });

  assert.equal(value.responses.filtered_by_event_type_response.count, 1);
  assert.equal(value.responses.filtered_by_event_type_response.events[0].event_type, "pin_preview");
  assert.equal(value.responses.filtered_by_target_response.count, 1);
  assert.equal(
    value.responses.filtered_by_target_response.events[0].target_id,
    "folded_section:source_coverage",
  );

  for (const [responseName, response] of Object.entries(value.responses)) {
    if (responseName.endsWith("_refusal_response")) {
      assert.equal(response.accepted, false, `${responseName} must refuse`);
      assert.equal(response.count, 0, `${responseName} must return no rows`);
      assert.deepEqual(response.events, [], `${responseName} must return no events`);
      assert.ok(
        requiredRefusalCodes.includes(response.refusal.refusal_code),
        `${responseName} must use required refusal code`,
      );
      assert.equal(response.runtime_read_executed_now, false);
      assert.equal(response.db_open_now, false);
      assert.equal(response.sql_execution_now, false);
      assertListAuthorityBoundary(response.authority_boundary, {
        readNow: false,
        dbOpenNow: false,
        sqlExecutionNow: false,
      });
    }
  }
}

function assertListAuthorityBoundary(boundary, { readNow, dbOpenNow, sqlExecutionNow }) {
  assert.equal(boundary.contract_only, false);
  assert.equal(boundary.route_implemented_now, true);
  assert.equal(boundary.durable_feedback_event_read_now, readNow);
  assert.equal(boundary.durable_feedback_event_written_now, false);
  assert.equal(boundary.runtime_read_executed_now, readNow);
  assert.equal(boundary.runtime_write_executed_now, false);
  assert.equal(boundary.db_open_now, dbOpenNow);
  assert.equal(boundary.sql_execution_now, sqlExecutionNow);
  assert.equal(boundary.product_write_lane_parked_by_686, true);
  for (const forbiddenKey of [
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

function assertRouteSource() {
  assert.match(routeSource, /export\s+async\s+function\s+POST\b/);
  assert.match(routeSource, /export\s+async\s+function\s+GET\b/);
  assert.match(routeSource, /export\s+function\s+handleFeedbackEventStoreListRouteRequest\b/);
  assert.match(routeSource, /\blistFeedbackEvents\b/);
  assert.match(routeSource, /\bopenDatabase\b/);
  const getSource = routeSource.match(/export\s+async\s+function\s+GET[\s\S]*?\n}/)?.[0] ?? "";
  assert.ok(getSource.includes("handleFeedbackEventStoreListRouteRequest"));
  assert.doesNotMatch(getSource, /\binsertFeedbackEvent\b/, "GET wrapper must not insert");
  const listHandlerStart = routeSource.indexOf(
    "export function handleFeedbackEventStoreListRouteRequest",
  );
  const writePrepareStart = routeSource.indexOf("function prepareFeedbackEventWrite");
  const listHandlerSource = routeSource.slice(listHandlerStart, writePrepareStart);
  assert.match(listHandlerSource, /\blistFeedbackEvents\b/);
  assert.doesNotMatch(
    listHandlerSource,
    /\binsertFeedbackEvent\b/,
    "list handler must not insert feedback events",
  );
  assert.doesNotMatch(routeSource, /export\s+async\s+function\s+(PUT|PATCH|DELETE)\b/);
}

function assertPackageScript() {
  assert.equal(packageJson.scripts[packageScriptName], packageScriptValue);
  if (listUiBrowserValidationSliceActive()) {
    assert.equal(
      packageJson.scripts[listUiBrowserValidationPackageScriptName],
      listUiBrowserValidationPackageScriptValue,
    );
  } else if (browserValidationSliceActive()) {
    assert.equal(
      packageJson.scripts[browserValidationPackageScriptName],
      browserValidationPackageScriptValue,
    );
  }
  if (listUiContractSliceActive()) {
    assert.equal(
      packageJson.scripts[listUiContractPackageScriptName],
      listUiContractPackageScriptValue,
    );
  }
  if (listUiImplementationSliceActive()) {
    assert.equal(
      packageJson.scripts[listUiImplementationPackageScriptName],
      listUiImplementationPackageScriptValue,
    );
  }
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
    listUiBrowserValidationSliceActive()
      ? [listUiBrowserValidationPackageScriptName]
      : listUiImplementationSliceActive()
      ? [listUiImplementationPackageScriptName]
      : listUiContractSliceActive()
      ? [listUiContractPackageScriptName]
      : browserValidationSliceActive()
      ? [browserValidationPackageScriptName]
      : [packageScriptName],
    "package additions must only include the active list route smoke script",
  );
  assert.doesNotMatch(packageAddedLines.join("\n"), /"dependencies"\s*:/);
  assert.doesNotMatch(packageAddedLines.join("\n"), /"devDependencies"\s*:/);
}

function assertStaticBoundary() {
  const changedFiles = readChangedFiles();
  const activeExpectedChangedFiles = listUiBrowserValidationSliceActive()
    ? listUiBrowserValidationChangedFiles
    : listUiImplementationSliceActive()
    ? listUiImplementationChangedFiles
    : listUiContractSliceActive()
    ? listUiContractChangedFiles
    : browserValidationSliceActive()
    ? browserValidationChangedFiles
    : expectedChangedFiles;
  for (const requiredFile of activeExpectedChangedFiles) {
    assert.ok(changedFiles.includes(requiredFile), `changed files must include ${requiredFile}`);
  }
  for (const changedFile of changedFiles) {
    assert.ok(
      activeExpectedChangedFiles.includes(changedFile),
      `unexpected changed file in list route implementation slice: ${changedFile}`,
    );
    if (
      listUiImplementationSliceActive() ||
      listUiContractSliceActive() ||
      listUiBrowserValidationSliceActive()
    ) {
      assert.doesNotMatch(changedFile, /^app\/api\//, "must not change app/api files");
    } else if (changedFile.startsWith("app/api/")) {
      assert.equal(
        changedFile,
        routeFilePath,
        "only the existing feedback-events route may change",
      );
    }
    if (listUiImplementationSliceActive()) {
      if (changedFile.startsWith("components/")) {
        assert.ok(
          [
            listUiImplementationComponentPath,
            listUiImplementationFoldedAuditPanelPath,
          ].includes(changedFile),
          `only list UI implementation component files may change: ${changedFile}`,
        );
      }
    } else {
      assert.doesNotMatch(changedFile, /^components\//, "must not change components");
    }
    assert.notEqual(changedFile, "lib/db/schema.sql", "must not change schema.sql");
    assert.doesNotMatch(changedFile, /^migrations\//, "must not change migrations");
    assert.doesNotMatch(changedFile, /(^|\/)(schema|migration)\b/i);
  }
}

function assertNoForbiddenPatterns() {
  if (listUiBrowserValidationSliceActive()) return;
  const scannedSources = [
    [routeFilePath, stripAllowedBoundaryText(routeSource)],
    [smokePath, stripAllowedBoundaryText(smokeSource)],
    [browserValidationSmokePath, stripAllowedBoundaryText(browserValidationSmokeSource)],
    [listUiContractSmokePath, stripAllowedBoundaryText(listUiContractSmokeSource)],
  ];
  for (const [filePath, source] of scannedSources) {
    assert.doesNotMatch(source, /from\s+["'][^"']*openai["']/i);
    assert.doesNotMatch(source, /new\s+OpenAI\b/i);
    assert.doesNotMatch(source, /\bfetch\s*\(/, `${filePath} must not invoke fetch`);
    assert.doesNotMatch(source, /XMLHttpRequest|WebSocket|EventSource|sendBeacon/);
    assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|document\.cookie/);
    assert.doesNotMatch(source, /Octokit|api\.github\.com/i);
    assert.doesNotMatch(source, /\bcodex\s+(exec|run)\b/i);
    assert.doesNotMatch(source, /\bgh\s+pr\b/i);
    assert.doesNotMatch(source, /\bnext\s+(dev|start)\b/i);
    assert.doesNotMatch(source, /\bcreateProof\b|\binsertProof\b/);
    assert.doesNotMatch(source, /\bcreateEvidence\b|\binsertEvidence\b/);
    assert.doesNotMatch(source, /\bmutateWork\b|\bupdateWork\b/);
    assert.doesNotMatch(source, /\bpromotePerspective\b/);
    assert.doesNotMatch(source, /\bexecuteProductWrite\b|\ballocateProductId\b/i);
  }
  assert.doesNotMatch(routeSource, /product_write_authority\s*:\s*true/);
  assert.doesNotMatch(routeSource, /retrieval_rag_authority\s*:\s*true/);
  assert.doesNotMatch(routeSource, /provider_openai_authority\s*:\s*true/);
  assert.doesNotMatch(routeSource, /source_fetch_authority\s*:\s*true/);
}

function assertDocsPointers() {
  for (const requiredText of [
    "Feedback Event Store list route implementation v0.1",
    routeFilePath,
    fixturePath,
    smokePath,
    packageScriptName,
    "GET /api/research-candidate/feedback-events",
    "reads durable feedback events only",
    "GET does not write feedback",
    "no UI/component change",
    "no proof/evidence/Perspective promotion/work mutation",
    "no Codex/GitHub automation/external handoff",
    "no provider/OpenAI/source-fetch/retrieval/RAG execution",
    "no product write/product IDs",
    nextRecommendedSlice,
  ]) {
    assert.ok(indexDoc.includes(requiredText), `index must include ${requiredText}`);
  }
  for (const doc of [substrateDoc, surfaceDoc, gateDoc]) {
    assert.match(doc, /Feedback Event Store list route implementation/i);
    assert.match(doc, /GET \/api\/research-candidate\/feedback-events/i);
    assert.match(doc, /read(?:s)? durable feedback events only/i);
    assert.match(doc, /does not write feedback|no feedback write/i);
    assert.match(doc, /no UI|No UI controls|no UI\/component/i);
    assert.match(doc, /no proof\/evidence|proof\/evidence/i);
    assert.match(doc, /no Perspective promotion|Perspective state/i);
    assert.match(doc, /no work mutation|work mutation/i);
    assert.match(doc, /no provider\/OpenAI/i);
    assert.match(doc, /no source fetch|source-fetch/i);
    assert.match(doc, /no retrieval\/RAG execution/i);
    assert.match(doc, /no product write/i);
    assert.match(doc, /#686/);
    assert.match(doc, new RegExp(nextRecommendedSlice));
  }
}

function assertListRouteContractDownstreamPointer() {
  for (const requiredText of [
    packageScriptName,
    fixturePath,
    smokePath,
    recommendationStatus,
    nextRecommendedSlice,
    "handleFeedbackEventStoreListRouteRequest",
  ]) {
    assert.ok(
      listRouteContractSmokeSource.includes(requiredText),
      `#703 list route contract smoke must allow implementation text: ${requiredText}`,
    );
  }
  assert.equal(
    listRouteContractFixture.next_recommended_slice,
    "feedback_event_store_list_route_implementation_v0_1",
    "#703 list route contract fixture output must remain unchanged",
  );
}

function assertBrowserValidationDownstreamPointer() {
  if (!browserValidationSliceActive()) return;
  for (const requiredText of [
    browserValidationPackageScriptName,
    browserValidationFixturePath,
    browserValidationSmokePath,
    "feedback_event_store_list_route_browser_validation",
    "ready_for_feedback_event_store_list_ui_contract_v0_1",
    "feedback_event_store_list_ui_contract_v0_1",
    "handleFeedbackEventStoreListRouteRequest",
  ]) {
    assert.ok(
      browserValidationSmokeSource.includes(requiredText),
      `#704 list route implementation smoke must allow browser validation text: ${requiredText}`,
    );
  }
  const browserValidationFixture = readJson(browserValidationFixturePath);
  assert.equal(
    browserValidationFixture.validation_kind,
    "feedback_event_store_list_route_browser_validation",
  );
  assert.equal(browserValidationFixture.route_path, routePath);
  assert.equal(browserValidationFixture.route_method, routeMethod);
  assert.equal(browserValidationFixture.production_db_used_now, false);
  assert.equal(browserValidationFixture.temp_db_used_now, true);
  assert.equal(browserValidationFixture.runtime_read_executed_now, true);
  assert.equal(browserValidationFixture.runtime_write_executed_now, false);
  assert.equal(browserValidationFixture.no_feedback_write_observed, true);
  assert.equal(browserValidationFixture.no_forbidden_authority_granted, true);
  assert.equal(
    browserValidationFixture.recommendation_status,
    "ready_for_feedback_event_store_list_ui_contract_v0_1",
  );
  assert.equal(
    browserValidationFixture.next_recommended_slice,
    "feedback_event_store_list_ui_contract_v0_1",
  );
}

function assertListUiContractDownstreamPointer() {
  if (!listUiContractSliceActive()) return;
  for (const requiredText of [
    listUiContractPackageScriptName,
    listUiContractFixturePath,
    listUiContractSmokePath,
    listUiContractRecommendationStatus,
    listUiContractNextRecommendedSlice,
    "buildFeedbackEventStoreListUiContract",
  ]) {
    assert.ok(
      listUiContractSmokeSource.includes(requiredText),
      `#704 list route implementation smoke must allow list UI contract text: ${requiredText}`,
    );
  }
  const browserValidationFixture = readJson(browserValidationFixturePath);
  const listUiContractFixture = readJson(listUiContractFixturePath);
  assert.equal(
    browserValidationFixture.next_recommended_slice,
    "feedback_event_store_list_ui_contract_v0_1",
  );
  assert.equal(listUiContractFixture.contract_kind, "feedback_event_store_list_ui_contract");
  assert.equal(listUiContractFixture.route_path, routePath);
  assert.equal(listUiContractFixture.route_method, routeMethod);
  assert.equal(listUiContractFixture.ui_implemented_now, false);
  assert.equal(listUiContractFixture.browser_request_executed_now, false);
  assert.equal(listUiContractFixture.feedback_events_read_now, false);
  assert.equal(listUiContractFixture.feedback_events_written_now, false);
  assert.equal(
    listUiContractFixture.recommendation_status,
    listUiContractRecommendationStatus,
  );
  assert.equal(
    listUiContractFixture.next_recommended_slice,
    listUiContractNextRecommendedSlice,
  );
}

function assertListUiImplementationDownstreamPointer() {
  if (!listUiImplementationSliceActive()) return;
  for (const requiredText of [
    listUiImplementationPackageScriptName,
    listUiImplementationFixturePath,
    listUiImplementationSmokePath,
    listUiImplementationRecommendationStatus,
    listUiImplementationNextRecommendedSlice,
  ]) {
    assert.ok(
      readFile(listUiImplementationSmokePath).includes(requiredText) ||
        smokeSource.includes(requiredText),
      `#704 list route implementation smoke must allow list UI implementation text: ${requiredText}`,
    );
  }
  const listUiImplementationFixture = readJson(listUiImplementationFixturePath);
  assert.equal(
    listUiImplementationFixture.implementation_kind,
    "feedback_event_store_list_ui_implementation",
  );
  assert.equal(listUiImplementationFixture.enabled_panel.route_method, "GET");
  assert.equal(
    listUiImplementationFixture.enabled_panel.browser_request_available_now,
    true,
  );
  assert.equal(
    listUiImplementationFixture.enabled_panel.feedback_events_written_now,
    false,
  );
  assert.equal(
    listUiImplementationFixture.authority_boundary.route_changed_now,
    false,
  );
  assert.equal(
    listUiImplementationFixture.recommendation_status,
    listUiImplementationRecommendationStatus,
  );
  assert.equal(
    listUiImplementationFixture.next_recommended_slice,
    listUiImplementationNextRecommendedSlice,
  );
}

function assertListUiBrowserValidationDownstreamPointer() {
  if (!listUiBrowserValidationSliceActive()) return;
  for (const requiredText of [
    listUiBrowserValidationPackageScriptName,
    listUiBrowserValidationFixturePath,
    listUiBrowserValidationSmokePath,
    listUiBrowserValidationRecommendationStatus,
    listUiBrowserValidationNextRecommendedSlice,
  ]) {
    assert.ok(
      readFile(listUiBrowserValidationSmokePath).includes(requiredText),
      `#704 list route implementation smoke must allow list UI browser validation text: ${requiredText}`,
    );
  }
}

function browserValidationSliceActive() {
  const changedFiles = readChangedFiles();
  return browserValidationChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function listUiContractSliceActive() {
  const changedFiles = readChangedFiles();
  return listUiContractChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function listUiImplementationSliceActive() {
  const changedFiles = readChangedFiles();
  return listUiImplementationChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function listUiBrowserValidationSliceActive() {
  const changedFiles = readChangedFiles();
  return listUiBrowserValidationChangedFiles.every((filePath) =>
    changedFiles.includes(filePath),
  );
}

function buildListUrl(params = {}, options = {}) {
  const url = new URL(`http://localhost${routePath}`);
  url.searchParams.set("request_version", requestVersion);
  url.searchParams.set("include_event_json", "true");
  if (!options.omitAcknowledgements) {
    for (const acknowledgement of requiredAcknowledgements) {
      url.searchParams.append("authority_acknowledgements", acknowledgement);
    }
  }
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    url.searchParams.delete(key);
    url.searchParams.set(key, String(value));
  }
  return url;
}

function withTempDb(callback) {
  const tempDir = join(tmpdir(), "augnes-feedback-event-store-list-route-implementation-v0-1");
  const tempDbPath = join(tempDir, "feedback-event-list-route.sqlite");
  assert.ok(tempDbPath.startsWith(tmpdir()), "temp DB must be under /tmp");
  rmSync(tempDir, { recursive: true, force: true });
  mkdirSync(tempDir, { recursive: true });
  const db = new Database(tempDbPath);
  try {
    db.exec(feedbackEventStoreSchemaSql);
    return callback(db);
  } finally {
    db.close();
    rmSync(tempDir, { recursive: true, force: true });
  }
}

function seedFixtureEvents(db) {
  for (const event of feedbackStoreFixture.events) {
    const result = insertFeedbackEvent(db, event);
    assert.equal(result.inserted, true, `${event.event_id} must insert into temp DB`);
  }
}

function countRows(db) {
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM ${feedbackEventStoreTableName}`)
    .get();
  return row.count;
}

function unwrapModule(moduleValue) {
  return moduleValue.default && Object.keys(moduleValue).length === 1
    ? moduleValue.default
    : moduleValue;
}

function readFile(filePath) {
  return readFileSync(filePath, "utf8");
}

function readJson(filePath) {
  return JSON.parse(readFile(filePath));
}

function readGitOutput(args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function mergeBaseRef() {
  return readGitOutput(["merge-base", "HEAD", "origin/main"]).trim();
}

function readChangedFiles() {
  return [
    ...readGitOutput(["diff", "--name-only", mergeBaseRef(), "--"]).split("\n"),
    ...readGitOutput(["ls-files", "--others", "--exclude-standard"]).split("\n"),
  ]
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();
}

function extractScriptName(line) {
  const match = line.match(/^\+\s*"([^"]+)":\s*"/);
  return match?.[1] ?? null;
}

function stripAllowedBoundaryText(source) {
  return source
    .replace(/"[^"]*(?:provider\/OpenAI|retrieval\/RAG|source fetch|source-fetch|product-write|product write|Codex|GitHub|proof\/evidence|Perspective|work mutation)[^"]*"/gi, '""')
    .replace(/`[^`]*(?:provider\/OpenAI|retrieval\/RAG|source fetch|source-fetch|product-write|product write|Codex|GitHub|proof\/evidence|Perspective|work mutation)[^`]*`/gi, "``");
}
