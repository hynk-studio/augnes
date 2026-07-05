#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdirSync, rmSync } from "node:fs";

import Database from "better-sqlite3";

import {
  assertChangedFilesWithin,
  assertContainsAll,
  assertPackageScript,
  loadTextByFile,
} from "./smoke-boundary-common.mjs";

const files = {
  decisionType: "types/next-work-signal-decision.ts",
  decisionHelper: "lib/workplane/next-work-signal-decision.ts",
  decisionPanel: "components/workplane/next-work-signal-decision-panel.tsx",
  writeType: "types/next-work-signal-decision-write.ts",
  writeHelper: "lib/workplane/next-work-signal-decision-write.ts",
  route: "app/api/workplane/next-work-signal-decisions/route.ts",
  reviewType: "types/next-work-signal-decision-record-review.ts",
  reviewHelper: "lib/workplane/next-work-signal-decision-record-review.ts",
  reviewForWeb:
    "lib/workplane/read-next-work-signal-decision-record-review-for-web.ts",
  reviewPanel:
    "components/workplane/next-work-signal-decision-record-review-panel.tsx",
  bridgeType: "types/perspective-relay-update-candidate-bridge-preview.ts",
  bridgeHelper: "lib/workplane/perspective-relay-update-candidate-bridge-preview.ts",
  bridgePanel:
    "components/workplane/perspective-relay-update-candidate-bridge-preview-panel.tsx",
  agentWorkplane: "components/workplane/agent-workplane.tsx",
  overviewType: "types/workbench-dogfood-loop-spine-overview.ts",
  overviewHelper: "lib/workplane/workbench-dogfood-loop-spine-overview.ts",
  agentWorkplaneSmoke: "scripts/smoke-agent-workplane-panels-v0-1.mjs",
  overviewSmoke: "scripts/smoke-workbench-dogfood-loop-spine-overview-v0-1.mjs",
  smoke:
    "scripts/smoke-next-work-signal-decision-perspective-relay-bridge-v0-1.mjs",
  packageJson: "package.json",
};


const textByFile = loadTextByFile(Object.values(files));
const packageJsonText = textByFile.get(files.packageJson);

assertPackageScript({
  packageJsonText,
  scriptName: "smoke:next-work-signal-decision-perspective-relay-bridge-v0-1",
  expectedCommand:
    "tsx --tsconfig tsconfig.json scripts/smoke-next-work-signal-decision-perspective-relay-bridge-v0-1.mjs",
});

assertContainsAll(
  [
    files.decisionType,
    files.decisionHelper,
    files.writeType,
    files.writeHelper,
    files.route,
    files.reviewType,
    files.reviewHelper,
    files.bridgeType,
    files.bridgeHelper,
  ]
    .map((file) => textByFile.get(file))
    .join("\n"),
  [
    "next_work_signal_operator_decision_preview.v0.1",
    "next_work_signal_decision_record.v0.1",
    "next_work_signal_decision_receipt.v0.1",
    "next_work_signal_decision_store.v0.1",
    "perspective_relay_update_candidate_bridge_preview.v0.1",
  ],
  { label: "next-work signal decision files" },
);

assertContainsAll(textByFile.get(files.agentWorkplane), [
  "NextWorkSignalDecisionPanel",
  "NextWorkSignalDecisionRecordReviewPanel",
  "PerspectiveRelayUpdateCandidateBridgePreviewPanel",
  "buildNextWorkSignalOperatorDecisionPreviewV01",
  "readNextWorkSignalDecisionRecordReviewForWebV01",
  "buildPerspectiveRelayUpdateCandidateBridgePreviewV01",
  "const nextWorkSignalDecisionPreview",
  "const nextWorkSignalDecisionRecordReview",
  "const perspectiveRelayUpdateCandidateBridgePreview",
  "preview={nextWorkSignalDecisionPreview}",
  "review={nextWorkSignalDecisionRecordReview}",
  "preview={perspectiveRelayUpdateCandidateBridgePreview}",
  "next_work_signal_decision_preview:\n        nextWorkSignalDecisionPreview",
  "next_work_signal_decision_record_review:\n        nextWorkSignalDecisionRecordReview",
  "perspective_relay_update_candidate_bridge_preview:\n        perspectiveRelayUpdateCandidateBridgePreview",
]);

assertContainsAll(textByFile.get(files.overviewType), [
  "next_work_signal_operator_decision",
  "next_work_signal_decision_record",
  "perspective_relay_update_candidate_bridge",
  "review_next_work_signal_decision",
  "write_next_work_signal_decision_record",
  "review_next_work_signal_decision_record",
  "review_perspective_relay_update_candidates",
  "prepare_perspective_next_work_update_decision",
  "prepare_continuity_relay_update_contract",
  "resolve_next_work_signal_blockers",
]);
assertContainsAll(textByFile.get(files.overviewHelper), [
  "nextWorkSignalDecisionStep",
  "nextWorkSignalDecisionRecordStep",
  "perspectiveRelayUpdateCandidateBridgeStep",
  "next_work_signal_decision_preview",
  "next_work_signal_decision_record_review",
  "perspective_relay_update_candidate_bridge_preview",
]);

for (const panel of [
  files.decisionPanel,
  files.reviewPanel,
  files.bridgePanel,
  files.agentWorkplane,
]) {
  const text = textByFile.get(panel);
  assert(!text.includes("<button"), `${panel} must not render buttons`);
  assert(
    !/onClick\s*=\{[^}]*\b(import|apply|approve|send|launch|run|execute|merge)\b/i.test(
      text,
    ),
    `${panel} must not add action click handlers`,
  );
}

for (const file of [
  files.writeHelper,
  files.route,
  files.reviewHelper,
  files.bridgeHelper,
]) {
  const text = textByFile.get(file);
  assert(!/writePerspectiveUnit|writeNextWorkBias|updateCurrentWorkingPerspective/i.test(text));
  assert(!/updateContinuityRelay|applyHandoffContext|sendHandoff/i.test(text));
  assert(!/from ["']@\/(lib\/)?providers?\//i.test(text));
  assert(!/\b(provider|openai|github|codex)\.(create|request|send|execute|run|call)\b/i.test(text));
  assert(!/\b(createGraph|createVectorStore|createRagStack|crawlBrowser|observeBrowser)\b/i.test(text));
}

const { buildNextWorkSignalOperatorDecisionPreviewV01 } = await import(
  "../lib/workplane/next-work-signal-decision.ts"
);
const signalWrite = await import(
  "../lib/workplane/next-work-signal-decision-write.ts"
);
const signalReview = await import(
  "../lib/workplane/next-work-signal-decision-record-review.ts"
);
const { buildPerspectiveRelayUpdateCandidateBridgePreviewV01 } = await import(
  "../lib/workplane/perspective-relay-update-candidate-bridge-preview.ts"
);
const { buildWorkbenchDogfoodLoopSpineOverviewV01 } = await import(
  "../lib/workplane/workbench-dogfood-loop-spine-overview.ts"
);
const route = await import(
  "../app/api/workplane/next-work-signal-decisions/route.ts"
);

const emptyDecision = buildNextWorkSignalOperatorDecisionPreviewV01();
assert.equal(
  emptyDecision.decision_preview_status,
  "no_next_work_signal_refresh_preview",
);
assert.notEqual(
  emptyDecision.decision_preview_status,
  "ready_for_future_next_work_signal_record_write",
);

const refreshPreview = makeRefreshPreview();
const decisionWithoutSelection = buildNextWorkSignalOperatorDecisionPreviewV01({
  next_work_signal_refresh_preview: refreshPreview,
});
assert.equal(
  decisionWithoutSelection.decision_preview_status,
  "needs_operator_judgment",
);
assert(
  decisionWithoutSelection.would_write_next_work_signal_record_preview
    .selectable_signal_refs.length > 0,
);

const badSelectedDecision = buildNextWorkSignalOperatorDecisionPreviewV01({
  next_work_signal_refresh_preview: refreshPreview,
  selected_signal_refs: ["signal:not-present"],
  requested_operator_ref: "operator:next-work-reviewer",
  requested_idempotency_key: "idempotency:next-work-signal",
  review_confirmation_ref: "review:next-work-signal",
  source_refs: ["source:next-work-decision"],
});
assert.notEqual(
  badSelectedDecision.decision_preview_status,
  "ready_for_future_next_work_signal_record_write",
);
assert(
  badSelectedDecision.refusal_reasons.includes(
    "selected_signal_refs_not_in_refresh_preview",
  ),
);

const selectableRef =
  decisionWithoutSelection.would_write_next_work_signal_record_preview
    .selectable_signal_refs[0];
const readyDecision = buildNextWorkSignalOperatorDecisionPreviewV01({
  next_work_signal_refresh_preview: refreshPreview,
  dogfood_metric_snapshot_record_review: makeMetricSnapshotRecordReview(),
  selected_signal_refs: [selectableRef],
  requested_operator_ref: "operator:next-work-reviewer",
  requested_idempotency_key: "idempotency:next-work-signal",
  review_confirmation_ref: "review:next-work-signal",
  source_refs: ["source:next-work-decision"],
});
assert.equal(
  readyDecision.decision_preview_status,
  "ready_for_future_next_work_signal_record_write",
);
assert.equal(readyDecision.write_readiness.write_ready, true);
assert.equal(
  readyDecision.recommended_operator_decision,
  "approve_for_next_work_signal_record",
);
assert.equal(readyDecision.evidence_summary.has_evidence_refs, true);

const writeInput = makeWriteInput(readyDecision);

const invalidDb = new Database(":memory:");
const refusedNonReady = signalWrite.writeNextWorkSignalDecisionRecordV01(
  makeWriteInput(decisionWithoutSelection, "idempotency:non-ready"),
  { db: invalidDb },
);
assert.equal(refusedNonReady.status, "refused");
assert(
  refusedNonReady.receipt.refusal_reasons.includes(
    "decision_preview_not_ready_for_future_next_work_signal_record_write",
  ),
);
assert.equal(
  signalWrite.nextWorkSignalDecisionWriteSchemaExistsV01(invalidDb),
  false,
);
invalidDb.close();

assertRefused(
  { ...writeInput, operator_approval: { ...writeInput.operator_approval, checklist_confirmations: [] } },
  "checklist_confirmations_missing",
);
assertRefused(
  { ...writeInput, idempotency_key: "idempotency:other" },
  "idempotency_key_mismatch_with_decision_preview",
);
assertRefused(
  {
    ...writeInput,
    operator_approval: {
      ...writeInput.operator_approval,
      operator_ref: "operator:other",
    },
  },
  "operator_ref_mismatch_with_decision_preview",
);
assertRefused(
  {
    ...writeInput,
    decision_preview: {
      ...readyDecision,
      source_refs: ["source:../private"],
      would_write_next_work_signal_record_preview: {
        ...readyDecision.would_write_next_work_signal_record_preview,
        source_refs: ["source:next-work-decision"],
      },
    },
  },
  "decision_preview_source_refs_unsafe",
);
assertRefused(
  {
    ...writeInput,
    decision_preview: {
      ...readyDecision,
      would_write_next_work_signal_record_preview: {
        ...readyDecision.would_write_next_work_signal_record_preview,
        selected_signal_summaries: [
          {
            ...readyDecision.would_write_next_work_signal_record_preview
              .selected_signal_summaries[0],
            signal_ref: "signal:not-selected",
          },
        ],
      },
    },
  },
  "selected_signal_summary_not_selected",
);
assertRefused(
  {
    ...writeInput,
    decision_preview: {
      ...readyDecision,
      would_write_next_work_signal_record_preview: {
        ...readyDecision.would_write_next_work_signal_record_preview,
        selected_signal_summaries: [
          {
            ...readyDecision.would_write_next_work_signal_record_preview
              .selected_signal_summaries[0],
            bucket: "unknown_but_safe",
          },
        ],
      },
    },
  },
  "selected_signal_summary_bucket_invalid",
);
assertRefused(
  {
    ...writeInput,
    raw_text: "raw result material must not persist",
  },
  "raw_or_private_marker_material_refused",
);
assertRefused(
  {
    ...writeInput,
    notes: ["source:workbench:default"],
  },
  "sample_fixture_default_or_workbench_material_refused",
);
assertRefused(
  {
    ...writeInput,
    requested_side_effects: { can_write_perspective_unit: true },
  },
  "requested_side_effect_not_allowed",
);
assertRefused(
  {
    ...writeInput,
    notes: ["request:write-perspective-unit"],
  },
  "forbidden_side_effect_request_refused",
);

const db = new Database(":memory:");
const written = signalWrite.writeNextWorkSignalDecisionRecordV01(writeInput, {
  db,
});
assert.equal(written.status, "written");
assert(written.record);
assert.equal(written.receipt.no_side_effects.next_work_signal_decision_record_written, true);
assert.equal(written.receipt.no_side_effects.next_work_signal_decision_receipt_written, true);
assert.equal(written.receipt.no_side_effects.next_work_signal_decision_persisted, true);
for (const field of forbiddenNoSideEffectFields()) {
  assert.equal(written.receipt.no_side_effects[field], false, field);
}

const replay = signalWrite.writeNextWorkSignalDecisionRecordV01(writeInput, {
  db,
});
assert.equal(replay.status, "idempotent_existing");
assert.equal(replay.record.record_id, written.record.record_id);
const conflict = signalWrite.writeNextWorkSignalDecisionRecordV01(
  {
    ...writeInput,
    notes: ["note:changed"],
  },
  { db },
);
assert.equal(conflict.status, "refused");
assert(conflict.receipt.refusal_reasons.includes("idempotency_key_conflict"));
assert.equal(
  signalWrite.readNextWorkSignalDecisionRecordByIdV01(written.record.record_id, {
    db,
  }).status,
  "read",
);
assert.equal(
  signalWrite.readNextWorkSignalDecisionRecordByIdempotencyKeyV01(
    writeInput.idempotency_key,
    { db },
  ).status,
  "read",
);
const outOfScopeRecord = insertOutOfScopeRow(db, written.record, written.receipt, {
  recordId: "next-work-signal-decision:out-of-scope",
  idempotencyKey: "idempotency:out-of-scope",
});
assert.equal(
  signalWrite.readNextWorkSignalDecisionRecordByIdV01(outOfScopeRecord.record_id, {
    db,
  }).status,
  "not_found",
);
assert.equal(
  signalWrite.readNextWorkSignalDecisionRecordByIdempotencyKeyV01(
    outOfScopeRecord.idempotency_key,
    { db },
  ).status,
  "not_found",
);
assert.equal(signalWrite.listNextWorkSignalDecisionRecordsV01({ db }).records.length, 1);
db.close();

const outOfScopeReplayDb = new Database(":memory:");
signalWrite.ensureNextWorkSignalDecisionWriteSchemaV01(outOfScopeReplayDb);
insertOutOfScopeRow(
  outOfScopeReplayDb,
  written.record,
  written.receipt,
  {
    recordId: "next-work-signal-decision:out-of-scope-replay",
    idempotencyKey: writeInput.idempotency_key,
    recordFingerprint: written.record.record_fingerprint,
  },
);
const replayAgainstOutOfScope =
  signalWrite.writeNextWorkSignalDecisionRecordV01(writeInput, {
    db: outOfScopeReplayDb,
  });
assert.notEqual(replayAgainstOutOfScope.status, "idempotent_existing");
assert.equal(
  signalWrite.listNextWorkSignalDecisionRecordsV01({
    db: outOfScopeReplayDb,
  }).records.length,
  0,
);
outOfScopeReplayDb.close();

const readBeforeSchemaDb = new Database(":memory:");
assert.equal(
  signalWrite.listNextWorkSignalDecisionRecordsV01({
    db: readBeforeSchemaDb,
  }).status,
  "schema_missing",
);
assert.equal(
  signalWrite.nextWorkSignalDecisionWriteSchemaExistsV01(readBeforeSchemaDb),
  false,
);
readBeforeSchemaDb.close();

const noRecordsReview = signalReview.buildNextWorkSignalDecisionRecordReviewV01();
assert.equal(noRecordsReview.review_status, "no_records");
const recordsReview = signalReview.buildNextWorkSignalDecisionRecordReviewV01({
  store_result: written,
});
assert.equal(recordsReview.review_status, "records_available");
assert.equal(recordsReview.input_summary.valid_record_count, 1);
assert.equal(recordsReview.record_material_summary.preserve_context_count > 0, true);
const malformedReview = signalReview.buildNextWorkSignalDecisionRecordReviewV01({
  records: [
    {
      record_version: "next_work_signal_decision_record.v0.1",
      record_id: "next-work-signal-decision:malformed",
      idempotency_key: "idempotency:malformed",
      created_at: "2026-07-05T00:00:00.000Z",
      operator_ref: "operator:next-work-reviewer",
      record_fingerprint: "fingerprint:malformed",
    },
  ],
});
assert.equal(malformedReview.review_status, "records_invalid");
assert(
  malformedReview.record_summaries.some((summary) =>
    summary.problem_reasons.includes("next_work_signal_decision_record_malformed"),
  ),
);
const corruptReceiptResult = structuredClone(written);
corruptReceiptResult.receipt.no_side_effects.memory_mutated = true;
const corruptReceiptReview = signalReview.buildNextWorkSignalDecisionRecordReviewV01({
  store_result: corruptReceiptResult,
});
assert.equal(corruptReceiptReview.review_status, "records_invalid");
assert(corruptReceiptReview.input_summary.receipt_side_effect_problem_count > 0);
assert.equal(
  corruptReceiptReview.evidence_summary.has_receipt_side_effect_problem,
  true,
);
assert(
  corruptReceiptReview.blocked_reasons.includes(
    "next_work_signal_decision_receipt_no_side_effects_invalid",
  ),
);

const emptyBridge = buildPerspectiveRelayUpdateCandidateBridgePreviewV01();
assert.equal(emptyBridge.bridge_preview_status, "no_next_work_signal_material");
const nonReadyDecisionWithMaterial = {
  ...readyDecision,
  decision_preview_status: "needs_operator_judgment",
  recommended_operator_decision: "defer_until_selected_signal_refs_supplied",
  write_readiness: {
    ...readyDecision.write_readiness,
    write_ready: false,
    current_insufficient_data: ["selected_signal_refs_missing"],
  },
};
const bridgeFromNonReadyDecision =
  buildPerspectiveRelayUpdateCandidateBridgePreviewV01({
    next_work_signal_decision_preview: nonReadyDecisionWithMaterial,
    next_work_signal_refresh_preview: refreshPreview,
  });
assert.equal(
  bridgeFromNonReadyDecision.input_summary.candidate_material_count,
  0,
);
assert.notEqual(
  bridgeFromNonReadyDecision.recommended_next_action,
  "review_perspective_relay_update_candidates",
);
const nonReadyBridgeOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  next_work_signal_refresh_preview: refreshPreview,
  next_work_signal_decision_preview: nonReadyDecisionWithMaterial,
  perspective_relay_update_candidate_bridge_preview:
    bridgeFromNonReadyDecision,
});
assert.notEqual(
  stepById(nonReadyBridgeOverview, "perspective_relay_update_candidate_bridge")
    .recommended_next_action,
  "review_perspective_relay_update_candidates",
);
assert.notEqual(
  nonReadyBridgeOverview.recommended_next_operator_action,
  "review_perspective_relay_update_candidates",
);
const bridgeFromDecision = buildPerspectiveRelayUpdateCandidateBridgePreviewV01({
  next_work_signal_decision_preview: readyDecision,
  next_work_signal_refresh_preview: refreshPreview,
});
assert(
  ["update_candidates_available", "ready_for_operator_review"].includes(
    bridgeFromDecision.bridge_preview_status,
  ),
);
assert(bridgeFromDecision.input_summary.candidate_material_count > 0);
const bridgeFromRecord = buildPerspectiveRelayUpdateCandidateBridgePreviewV01({
  next_work_signal_decision_record_review: recordsReview,
});
assert(bridgeFromRecord.input_summary.candidate_material_count > 0);
for (const [key, value] of Object.entries(bridgeFromRecord.authority_boundary)) {
  if (key.startsWith("can_")) assert.equal(value, false, key);
}

const overview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  next_work_signal_refresh_preview: refreshPreview,
  next_work_signal_decision_preview: readyDecision,
  next_work_signal_decision_record_review: signalReview.buildNextWorkSignalDecisionRecordReviewV01(),
  perspective_relay_update_candidate_bridge_preview: bridgeFromDecision,
});
assert(
  overview.spine_steps.some(
    (step) => step.step_id === "next_work_signal_operator_decision",
  ),
);
assert(
  overview.spine_steps.some(
    (step) => step.step_id === "next_work_signal_decision_record",
  ),
);
assert(
  overview.spine_steps.some(
    (step) => step.step_id === "perspective_relay_update_candidate_bridge",
  ),
);
assert.equal(
  stepById(overview, "next_work_signal_decision_record")
    .recommended_next_action,
  "write_next_work_signal_decision_record",
);
const bridgeOverview = buildWorkbenchDogfoodLoopSpineOverviewV01({
  perspective_relay_update_candidate_bridge_preview: bridgeFromRecord,
});
assert.equal(
  stepById(bridgeOverview, "perspective_relay_update_candidate_bridge")
    .recommended_next_action,
  "review_perspective_relay_update_candidates",
);
assertNoForbiddenOverviewActions(overview);
assertNoForbiddenOverviewActions(bridgeOverview);

const routeDir = ".tmp/next-work-signal-decisions";
mkdirSync(routeDir, { recursive: true });
for (const file of [
  `${routeDir}/valid.db`,
  `${routeDir}/invalid-before-open.db`,
  `${routeDir}/proxied.db`,
  `${routeDir}/scope-boundary.db`,
]) {
  rmSync(file, { force: true });
}

const unsafeGet = await route.GET(
  new Request("http://localhost/api/workplane/next-work-signal-decisions?db_path=../private.sqlite"),
);
assert.equal(unsafeGet.status, 400);
const missingGet = await route.GET(
  new Request(
    "http://localhost/api/workplane/next-work-signal-decisions?db_path=.tmp/next-work-signal-decisions/missing.db",
  ),
);
assert.equal(missingGet.status, 404);
const routeScopeDbPath = `${routeDir}/scope-boundary.db`;
const routeScopeDb = new Database(routeScopeDbPath);
signalWrite.ensureNextWorkSignalDecisionWriteSchemaV01(routeScopeDb);
const routeOutOfScopeRecord = insertOutOfScopeRow(
  routeScopeDb,
  written.record,
  written.receipt,
  {
    recordId: "next-work-signal-decision:route-out-of-scope",
    idempotencyKey: "idempotency:route-out-of-scope",
  },
);
routeScopeDb.close();
const outOfScopeRouteById = await route.GET(
  new Request(
    `http://localhost/api/workplane/next-work-signal-decisions?db_path=${routeScopeDbPath}&record_id=${routeOutOfScopeRecord.record_id}`,
  ),
);
assert.equal(outOfScopeRouteById.status, 404);
const outOfScopeRouteByIdempotency = await route.GET(
  new Request(
    `http://localhost/api/workplane/next-work-signal-decisions?db_path=${routeScopeDbPath}&idempotency_key=${routeOutOfScopeRecord.idempotency_key}`,
  ),
);
assert.equal(outOfScopeRouteByIdempotency.status, 404);

const invalidAction = await postRoute({
  body: { action: "delete", db_path: `${routeDir}/valid.db`, input: writeInput },
});
assert.equal(invalidAction.status, 400);
const invalidJson = await route.POST(
  new Request("http://internal/api/workplane/next-work-signal-decisions", {
    method: "POST",
    body: "not-json",
    headers: sameOriginHeaders(),
  }),
);
assert.equal(invalidJson.status, 400);
const invalidObject = await route.POST(
  new Request("http://internal/api/workplane/next-work-signal-decisions", {
    method: "POST",
    body: JSON.stringify([]),
    headers: sameOriginHeaders(),
  }),
);
assert.equal(invalidObject.status, 400);
const unsafePost = await postRoute({
  body: { action: "write", db_path: "../private.db", input: writeInput },
});
assert.equal(unsafePost.status, 400);
const crossSite = await route.POST(
  new Request("http://internal/api/workplane/next-work-signal-decisions", {
    method: "POST",
    body: JSON.stringify({
      action: "write",
      db_path: `${routeDir}/valid.db`,
      input: writeInput,
    }),
    headers: {
      host: "internal",
      origin: "https://evil.example",
      "sec-fetch-site": "cross-site",
    },
  }),
);
assert.equal(crossSite.status, 403);

const invalidBeforeOpen = await postRoute({
  body: {
    action: "write",
    db_path: `${routeDir}/invalid-before-open.db`,
    input: makeWriteInput(decisionWithoutSelection, "idempotency:route-invalid"),
  },
});
assert.equal(invalidBeforeOpen.status, 400);
assert.equal(existsSync(`${routeDir}/invalid-before-open.db`), false);

const proxiedInput = makeWriteInput(
  buildNextWorkSignalOperatorDecisionPreviewV01({
    next_work_signal_refresh_preview: refreshPreview,
    selected_signal_refs: [selectableRef],
    requested_operator_ref: "operator:next-work-reviewer",
    requested_idempotency_key: "idempotency:next-work-proxied",
    review_confirmation_ref: "review:next-work-signal",
    source_refs: ["source:next-work-decision"],
  }),
  "idempotency:next-work-proxied",
);
const proxied = await route.POST(
  new Request("http://internal/api/workplane/next-work-signal-decisions", {
    method: "POST",
    body: JSON.stringify({
      action: "write",
      db_path: `${routeDir}/proxied.db`,
      input: proxiedInput,
    }),
    headers: {
      host: "internal",
      "x-forwarded-host": "operator.local",
      origin: "http://operator.local",
      "sec-fetch-site": "same-origin",
    },
  }),
);
assert.equal(proxied.status, 201);
const proxiedJson = await proxied.json();
assert.equal(
  proxiedJson.no_side_effects.next_work_signal_decision_record_written,
  true,
);
assert.equal(proxiedJson.no_side_effects.perspective_unit_written, false);
assert.equal(proxiedJson.no_side_effects.current_working_perspective_updated, false);
assert.equal(proxiedJson.no_side_effects.continuity_relay_written, false);
assert.equal(proxiedJson.no_side_effects.provider_called, false);

rmSync(routeDir, { recursive: true, force: true });

const changedFileBoundary = assertChangedFilesWithin({
  label: "next-work signal decision perspective relay bridge v0.1",
  allowedChangedFiles: Object.values(files),
});
assert(changedFileBoundary.files.length > 0);

console.log(
  "smoke-next-work-signal-decision-perspective-relay-bridge-v0-1 passed",
);

function makeRefreshPreview() {
  return {
    preview_version: "next_work_signal_refresh_preview.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-05T00:00:00.000Z",
    source_refs: ["source:next-work-refresh"],
    refresh_preview_status: "ready_for_operator_review",
    recommended_next_action: "review_next_work_signal_candidates",
    input_summary: {
      has_metric_snapshot_preview: true,
      has_metric_snapshot_records: true,
      has_reuse_ledger_records: true,
      metric_material_count: 1,
      next_work_signal_count: 8,
      blocker_count: 0,
      insufficient_data_count: 0,
    },
    proposed_next_work_signals: {
      preserve_context_refs: ["signal:preserve-helpful-context"],
      warn_context_refs: ["signal:warn-stale-context"],
      drop_or_deprioritize_context_refs: ["signal:drop-misleading-context"],
      verification_focus_candidates: ["signal:verify-skipped-checks"],
      expected_observed_followup_candidates: ["signal:followup-mismatch"],
      handoff_quality_focus_candidates: ["signal:handoff-quality-gap"],
      context_diet_candidates: ["signal:context-diet-noisy-ref"],
      review_burden_reduction_candidates: ["signal:review-burden-reduction"],
    },
    evidence_summary: {
      has_metric_material: true,
      has_source_refs: true,
      has_evidence_refs: true,
      evidence_refs: ["evidence:next-work-refresh"],
      source_refs: ["source:next-work-refresh"],
      missing_evidence: [],
    },
    blocked_reasons: [],
    insufficient_data_reasons: [],
    operator_review_checklist: ["review_next_work_signal_candidates"],
    would_not_write: ["does_not_write_perspective_or_relay"],
    non_goals: ["perspective_relay_write"],
    authority_boundary: {
      read_only: true,
      candidate_material_only: true,
      source_of_truth: false,
      derived_read_model: true,
      can_write_perspective_unit: false,
      can_write_next_work_bias: false,
      can_update_current_working_perspective: false,
      can_update_continuity_relay: false,
      can_mutate_handoff_context: false,
      can_send_handoff: false,
      can_write_memory: false,
      can_write_dogfood_metrics: false,
      can_write_reuse_outcome_ledger: false,
      can_call_provider_openai: false,
      can_call_github: false,
      can_execute_codex: false,
      can_create_pr: false,
      can_merge_pr: false,
      can_run_autonomous_action: false,
      can_create_graph_or_vector_store: false,
      can_create_rag_stack: false,
      can_crawl_or_observe_browser: false,
      notes: ["read-only refresh fixture"],
    },
  };
}

function makeMetricSnapshotRecordReview() {
  return {
    review_version: "dogfood_metric_snapshot_record_review.v0.1",
    scope: "project:augnes",
    as_of: "2026-07-05T00:00:00.000Z",
    source_refs: ["source:metric-snapshot-review"],
    review_status: "records_available",
    input_summary: {
      supplied_record_count: 1,
      valid_record_count: 1,
      invalid_record_count: 0,
      selected_record_id: null,
      selected_record_found: false,
      latest_record_id: "dogfood-metric-snapshot:reviewed-local",
      latest_record_created_at: "2026-07-05T00:00:00.000Z",
      selected_metric_candidate_ref_count: 1,
      receipt_side_effect_problem_count: 0,
    },
    record_summaries: [],
    selected_record_summary: null,
    latest_record_summary: null,
    records: [
      {
        record_id: "dogfood-metric-snapshot:reviewed-local",
      },
    ],
    evidence_summary: {
      supplied_record_count: 1,
      valid_record_count: 1,
      has_records: true,
      has_selected_record: false,
      has_source_refs: true,
      has_evidence_refs: true,
      has_receipt_side_effect_problem: false,
      source_refs: ["source:metric-snapshot-review"],
      evidence_refs: ["evidence:metric-snapshot"],
      missing_evidence: [],
      problem_record_ids: [],
    },
    record_material_summary: {},
    receipt_no_side_effects_summary: {},
    blocked_reasons: [],
    insufficient_data_reasons: [],
    operator_review_checklist: [],
    would_not_do: [],
    non_goals: [],
    authority_boundary: {},
  };
}

function makeWriteInput(
  decisionPreview,
  idempotencyKey = "idempotency:next-work-signal",
) {
  return {
    decision_preview: decisionPreview,
    operator_approval: {
      operator_decision: "approve_for_next_work_signal_record",
      approved_by: "operator:next-work-reviewer",
      operator_ref: "operator:next-work-reviewer",
      approved_at: "2026-07-05T00:00:00.000Z",
      approval_statement: "Approved for local next-work signal decision record.",
      checklist_confirmations: [
        "review:signals",
        "confirm:candidate-only",
        "confirm:no-perspective-relay-handoff-memory-metric-write",
      ],
    },
    idempotency_key: idempotencyKey,
    notes: ["note:bounded-next-work-signal-decision"],
  };
}

function insertOutOfScopeRow(
  db,
  sourceRecord,
  sourceReceipt,
  {
    recordId,
    idempotencyKey,
    recordFingerprint = `fingerprint:${recordId}`,
  },
) {
  const record = structuredClone(sourceRecord);
  record.record_id = recordId;
  record.idempotency_key = idempotencyKey;
  record.scope = "project:outside-augnes";
  record.record_fingerprint = recordFingerprint;
  const receipt = structuredClone(sourceReceipt);
  receipt.record_id = recordId;
  receipt.idempotency_key = idempotencyKey;
  receipt.record_fingerprint = recordFingerprint;
  receipt.store_ref = `next_work_signal_decision_records:${recordId}`;
  db.prepare(
    `INSERT INTO next_work_signal_decision_records (
      record_id,
      idempotency_key,
      created_at,
      scope,
      operator_ref,
      record_fingerprint,
      record_json,
      receipt_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    record.record_id,
    record.idempotency_key,
    record.created_at,
    "project:outside-augnes",
    record.operator_ref,
    record.record_fingerprint,
    JSON.stringify(record),
    JSON.stringify(receipt),
  );
  return record;
}

function assertRefused(input, expectedReason) {
  const db = new Database(":memory:");
  const result = signalWrite.writeNextWorkSignalDecisionRecordV01(input, { db });
  assert.equal(result.status, "refused");
  assert(
    result.receipt.refusal_reasons.includes(expectedReason),
    `expected refusal reason ${expectedReason}; got ${result.receipt.refusal_reasons.join(", ")}`,
  );
  assert.equal(
    signalWrite.nextWorkSignalDecisionWriteSchemaExistsV01(db),
    false,
  );
  db.close();
}

async function postRoute({ body }) {
  return route.POST(
    new Request("http://internal/api/workplane/next-work-signal-decisions", {
      method: "POST",
      body: JSON.stringify(body),
      headers: sameOriginHeaders(),
    }),
  );
}

function sameOriginHeaders() {
  return {
    host: "internal",
    "x-forwarded-host": "operator.local",
    origin: "http://operator.local",
    "sec-fetch-site": "same-origin",
  };
}

function stepById(overview, stepId) {
  const step = overview.spine_steps.find((item) => item.step_id === stepId);
  assert(step, `Expected overview step ${stepId}`);
  return step;
}

function assertNoForbiddenOverviewActions(overview) {
  const serialized = JSON.stringify(overview);
  for (const forbidden of [
    "write_perspective_unit",
    "write_next_work_bias",
    "mutate_current_working_perspective",
    "update_current_working_perspective",
    "write_continuity_relay",
    "apply_handoff",
    "send_handoff",
    "write_memory",
    "update_global_metric",
    "call_provider",
    "call_github",
    "execute_codex",
  ]) {
    assert(
      !serialized.includes(`"recommended_next_action":"${forbidden}"`),
      `overview step must not recommend ${forbidden}`,
    );
    assert(
      !serialized.includes(
        `"recommended_next_operator_action":"${forbidden}"`,
      ),
      `overview must not recommend ${forbidden}`,
    );
  }
}

function forbiddenNoSideEffectFields() {
  return [
    "perspective_unit_written",
    "next_work_bias_written",
    "current_working_perspective_updated",
    "continuity_relay_written",
    "handoff_context_mutated",
    "selected_refs_written_to_live_handoff",
    "handoff_sent",
    "memory_mutated",
    "dogfood_metrics_global_state_updated",
    "dogfood_metric_snapshot_written",
    "reuse_outcome_ledger_written",
    "expected_observed_delta_written",
    "work_episode_written",
    "provider_called",
    "github_called",
    "codex_executed",
    "pr_created",
    "pr_merged",
    "autonomous_action_run",
    "graph_or_vector_store_created",
    "rag_stack_created",
    "crawler_or_browser_observer_created",
  ];
}
