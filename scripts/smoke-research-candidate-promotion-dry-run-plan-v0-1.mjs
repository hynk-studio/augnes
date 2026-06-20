import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const helperPath =
  "lib/research-candidate-review/manual-note-preview-draft-promotion-dry-run-plan.ts";
const routePath =
  "app/api/research-candidate-review/manual-note-preview-drafts/[preview_draft_id]/promotion-dry-run-plan/route.ts";
const runtimePreviewPath =
  "lib/research-candidate-review/manual-note-runtime-preview.ts";
const hookPath =
  "components/use-research-candidate-manual-note-preview-runtime.ts";
const componentPath =
  "components/research-candidate-promotion-dry-run-plan-readout.tsx";
const reviewDesignComponentPath =
  "components/research-candidate-dry-run-candidate-review-design-panel.tsx";
const manualPanelPath =
  "components/research-candidate-manual-note-preview-panel.tsx";
const fixturePath =
  "fixtures/research-candidate-review.manual-note-promotion-dry-run-plan.sample.v0.1.json";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";

for (const filePath of [
  helperPath,
  routePath,
  runtimePreviewPath,
  hookPath,
  componentPath,
  reviewDesignComponentPath,
  manualPanelPath,
  fixturePath,
  docsIndexPath,
  packagePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const helper = readFileSync(helperPath, "utf8");
const route = readFileSync(routePath, "utf8");
const runtimePreview = readFileSync(runtimePreviewPath, "utf8");
const hook = readFileSync(hookPath, "utf8");
const component = readFileSync(componentPath, "utf8");
const reviewDesignComponent = readFileSync(reviewDesignComponentPath, "utf8");
const manualPanel = readFileSync(manualPanelPath, "utf8");
const fixtureText = readFileSync(fixturePath, "utf8");
const fixture = JSON.parse(fixtureText);
const docsIndex = readFileSync(docsIndexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertRuntimeContract();
assertRouteContract();
assertHelperContract();
assertComponentAndHookContract();
assertFixtureContract();
assertDocsAndPackagePointers();
assertForbiddenPatternsAbsent();

console.log(
  JSON.stringify(
    {
      smoke: "research-candidate-promotion-dry-run-plan-v0-1",
      helper_exists: true,
      route_exists_get_only: true,
      component_exists: true,
      fixture_exists_and_parses: true,
      runtime_route_and_types_checked: true,
      no_write_patterns_checked: true,
      hook_state_and_clears_checked: true,
      local_copy_controls_checked: true,
      docs_pointer_checked: true,
      package_script_checked: true,
    },
    null,
    2,
  ),
);

function assertRuntimeContract() {
  for (const requiredText of [
    "ManualNotePreviewDraftPromotionDryRunPlanResponse",
    "ManualNotePreviewDraftPromotionDryRunPlanOkResponse",
    "ManualNotePreviewDraftPromotionDryRunRuntimeBoundary",
    "ManualNotePreviewDraftPromotionDryRunAuthority",
    "ManualNotePreviewDraftPromotionDryRunStatus",
    "buildManualNotePreviewDraftPromotionDryRunPlanRoute",
    "promotion-dry-run-plan",
    "buildManualNotePreviewDraftDetailRoute(previewDraftId)",
  ]) {
    assert.ok(
      runtimePreview.includes(requiredText),
      `manual-note-runtime-preview must include ${requiredText}`,
    );
  }
}

function assertRouteContract() {
  assert.match(route, /export const runtime = "nodejs"/);
  assert.match(route, /export const dynamic = "force-dynamic"/);
  assert.match(route, /export async function GET\(/);
  for (const forbiddenHandler of ["POST", "PATCH", "PUT", "DELETE"]) {
    assert.doesNotMatch(
      route,
      new RegExp(`export\\s+async\\s+function\\s+${forbiddenHandler}\\s*\\(`),
      `route must not export ${forbiddenHandler}`,
    );
  }

  for (const requiredText of [
    "PREVIEW_DRAFT_ID_PATTERN",
    "validatePreviewDraftId(previewDraftId)",
    "parseScope(url.searchParams.get(\"scope\"))",
    "scope must be project:augnes when provided.",
    "getResearchCandidateManualNotePreviewDraft",
    "listResearchCandidateManualNotePreviewDraftActivities",
    "buildManualNotePreviewDraftPromotionReadiness",
    "buildManualNotePromotionBoundaryAudit",
    "buildManualNotePreviewDraftPromotionDryRunPlan",
    "buildManualNotePreviewDraftPromotionDryRunPlanRoute",
    "preview_draft_not_found",
    "NextResponse.json",
  ]) {
    assert.ok(route.includes(requiredText), `route must include ${requiredText}`);
  }
}

function assertHelperContract() {
  for (const requiredText of [
    "MANUAL_NOTE_PROMOTION_DRY_RUN_PLAN_VERSION",
    'manual_note_promotion_dry_run_plan.v0.1',
    "buildManualNotePreviewDraftPromotionDryRunPlan",
    "buildManualNotePreviewDraftPromotionDryRunMarkdown",
    "buildManualNotePreviewDraftPromotionDryRunJsonPacket",
    "buildManualNotePreviewDraftPromotionDryRunBoundary",
    "buildManualNotePreviewDraftPromotionDryRunAuthority",
    "summarizeManualNotePromotionDryRunGateSnapshot",
    "buildManualNotePromotionBoundaryAudit",
    "hypothetical_targets",
    "required_authorities_before_write",
    "blocked_side_effects",
    "This is not promotion.",
    "No proof/evidence, Perspective, canonical graph, or work item writes are performed.",
    "Source references are not fetched or verified.",
    "Provider/retrieval is not used.",
  ]) {
    assert.ok(helper.includes(requiredText), `helper must include ${requiredText}`);
  }

  for (const status of ["blocked", "needs_operator_review", "plan_ready"]) {
    assert.ok(helper.includes(`"${status}"`), `helper must include ${status}`);
  }
}

function assertComponentAndHookContract() {
  for (const requiredText of [
    "promotionDryRunPlan",
    "promotionDryRunPlanError",
    "loadingPromotionDryRunPlanId",
    "loadPromotionDryRunPlan",
    "clearPromotionDryRunPlanState",
    "buildManualNotePreviewDraftPromotionDryRunPlanRoute(previewDraftId)",
    "dryRunPlanState",
  ]) {
    assert.ok(hook.includes(requiredText), `hook must include ${requiredText}`);
  }

  const dryRunReset = functionBlock(hook, "clearPromotionDryRunPlanState");
  assertIncludes(dryRunReset, "setPromotionDryRunPlan(null)");
  assertIncludes(dryRunReset, "setPromotionDryRunPlanError(null)");
  assertIncludes(dryRunReset, "setLoadingPromotionDryRunPlanId(null)");

  const openedDependentReset = functionBlock(
    hook,
    "clearOpenedPreviewDraftDependentState",
  );
  assertOrdered(openedDependentReset, [
    "clearPreviewDraftActivityState()",
    "clearPromotionReadinessPreflightState()",
    "clearPromotionDryRunPlanState()",
    "clearPreviewDraftTransitionUiState()",
  ]);

  for (const functionName of [
    "loadPromotionReadinessPreflight",
    "discardPreviewDraft",
    "saveDraftLabel",
  ]) {
    assertIncludes(
      functionBlock(hook, functionName),
      "clearPromotionDryRunPlanState()",
      `${functionName} must clear stale dry-run plan state`,
    );
  }

  assertIncludes(
    functionBlock(hook, "clearRuntimeResult"),
    "clearOpenedPreviewDraftDependentState()",
    "clear runtime result must clear dependent dry-run state",
  );
  assertIncludes(
    manualPanel,
    "manualNoteRuntime.actions.clearRuntimeResult()",
    "local parse must clear runtime-owned dry-run state through clearRuntimeResult",
  );
  assertIncludes(
    manualPanel,
    "manualNoteRuntime.actions.resetRuntimeDraftState()",
    "clear local note/sample reset must clear runtime-owned dry-run state",
  );

  const loadDryRunPlan = functionBlock(hook, "loadPromotionDryRunPlan");
  assertOrdered(loadDryRunPlan, [
    "if (result.preview_draft_id !== previewDraftId)",
    "setPromotionDryRunPlan(null)",
    'setPromotionDryRunPlanError(\n          "Promotion dry-run plan route returned a mismatched preview draft.",',
    "return false",
    "setPromotionDryRunPlan(result)",
  ]);

  for (const requiredText of [
    "PromotionDryRunPlanReadout",
    "<PromotionDryRunPlanReadout",
    "dryRunPlanResult={promotionDryRunPlan}",
    "loadingPromotionDryRunPlanId",
    "loadPromotionDryRunPlan",
  ]) {
    assert.ok(
      manualPanel.includes(requiredText),
      `manual panel must wire ${requiredText}`,
    );
  }

  for (const requiredText of [
    "DryRunCandidateReviewDesignPanel",
    'from "@/components/research-candidate-dry-run-candidate-review-design-panel"',
    "<DryRunCandidateReviewDesignPanel plan={currentPlan} />",
  ]) {
    assert.ok(
      normalizedIncludes(component, requiredText),
      `dry-run readout must render review/design panel with ${requiredText}`,
    );
  }

  for (const requiredText of [
    "Dry-run candidate review and authority design",
    "Build selected candidate review packet",
    "Build authority-gated design packet",
    "Copy selected review Markdown",
    "Copy authority design JSON",
  ]) {
    assert.ok(
      normalizedIncludes(reviewDesignComponent, requiredText),
      `review/design component must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "Generate no-write dry-run plan",
    "Refresh no-write dry-run plan",
    "This is not promotion.",
    "No proof/evidence, Perspective, canonical graph, or work item writes are performed.",
    "Source references are not fetched or verified.",
    "Provider/retrieval is not used.",
    "dry_run_status",
    "dry_run_summary",
    "Hypothetical targets summary",
    "Proposed canonical deltas",
    "Required authorities before write",
    "Blocked side effects",
    "Copy Markdown dry-run plan",
    "Copy JSON dry-run plan",
    "Manual dry-run plan copy fallback",
  ]) {
    assert.ok(
      normalizedIncludes(component, requiredText),
      `component must include ${requiredText}`,
    );
  }

  for (const requiredText of [
    "previewDraftId: string | null",
    "previewDraftId: null",
    "copyState.previewDraftId === currentPlan.preview_draft_id",
    "previewDraftId: plan.preview_draft_id",
    "currentCopyState?.message",
    "currentCopyState?.fallbackText",
    "value={currentCopyState.fallbackText}",
  ]) {
    assert.ok(
      normalizedIncludes(component, requiredText),
      `component must scope copy state to current dry-run plan with ${requiredText}`,
    );
  }
}

function assertFixtureContract() {
  assert.equal(fixture.ok, true);
  assert.equal(
    fixture.dry_run_plan_version,
    "manual_note_promotion_dry_run_plan.v0.1",
  );
  assert.ok(
    ["blocked", "needs_operator_review", "plan_ready"].includes(
      fixture.dry_run_status,
    ),
    "fixture dry_run_status must be valid",
  );
  assert.equal(fixture.boundary_audit_snapshot.actual_promotion_allowed, false);
  assert.equal(
    fixture.boundary_audit_snapshot
      .dry_run_promotion_allowed_by_this_audit,
    false,
  );
  assert.equal(fixture.local_copy_packet.boundary.local_clipboard_only, true);
  assert.equal(fixture.local_copy_packet.boundary.external_handoff_sent, false);
  assert.equal(fixture.local_copy_packet.boundary.dry_run_plan_persisted, false);
  assert.equal(
    fixture.local_copy_packet.boundary.promotion_authority_granted,
    false,
  );
  assert.equal(fixture.local_copy_packet.boundary.actual_promotion_allowed, false);

  for (const [field, expectedValue] of Object.entries({
    actual_promotion_allowed: false,
    promotion_authority_granted: false,
    proof_or_evidence_writes: false,
    canonical_perspective_write: false,
    canonical_graph_write: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sent: false,
    dry_run_plan_persisted: false,
  })) {
    assert.equal(
      fixture.authority[field],
      expectedValue,
      `fixture authority.${field} must be ${expectedValue}`,
    );
  }

  for (const [field, expectedValue] of Object.entries({
    proof_or_evidence_writes: false,
    canonical_perspective_write: false,
    canonical_graph_write: false,
    work_item_creation: false,
    provider_or_openai_calls: false,
    retrieval_or_rag: false,
    source_fetching: false,
    external_handoff_sending: false,
    dry_run_plan_persisted: false,
    browser_persistence: false,
  })) {
    assert.equal(
      fixture.runtime_boundary[field],
      expectedValue,
      `fixture runtime_boundary.${field} must be ${expectedValue}`,
    );
  }

  for (const targetKey of [
    "source_reference_targets",
    "claim_targets",
    "evidence_targets",
    "tension_gap_targets",
    "perspective_delta_targets",
    "follow_up_work_targets",
  ]) {
    assert.ok(
      fixture.hypothetical_targets[targetKey].length >= 1,
      `fixture must include at least one ${targetKey}`,
    );
  }

  for (const authorityId of [
    "operator_promotion_decision",
    "durable_write_contract",
    "source_evidence_authority_model",
    "proof_evidence_write_authority",
    "canonical_perspective_write_authority",
    "idempotency_and_rollback_contract",
    "review_audit_record_contract",
  ]) {
    assert.ok(
      fixture.required_authorities_before_write.some(
        (authority) => authority.authority_id === authorityId,
      ),
      `fixture must include required authority ${authorityId}`,
    );
  }

  for (const sideEffectId of [
    "proof_or_evidence_writes",
    "perspective_or_canonical_writes",
    "work_item_creation",
    "provider_or_openai_calls",
    "retrieval_or_rag",
    "source_fetching",
    "external_handoff_sending",
    "browser_persistence",
    "dry_run_plan_persistence",
  ]) {
    assert.ok(
      fixture.blocked_side_effects.some(
        (sideEffect) =>
          sideEffect.side_effect_id === sideEffectId &&
          sideEffect.blocked === true &&
          sideEffect.performed === false,
      ),
      `fixture must block ${sideEffectId}`,
    );
  }

  for (const forbiddenText of [
    "Research Question:",
    "Operator Intent:",
    "Source Title:",
    "manual_note_text:",
    "AUGNES_DB_PATH",
    "http://",
    "https://",
  ]) {
    assert.ok(
      !fixtureText.includes(forbiddenText),
      `fixture must not include ${forbiddenText}`,
    );
  }
}

function assertDocsAndPackagePointers() {
  assert.equal(
    packageJson.scripts?.["smoke:research-candidate-promotion-dry-run-plan-v0-1"],
    "node scripts/smoke-research-candidate-promotion-dry-run-plan-v0-1.mjs",
  );

  for (const requiredText of [
    "Manual note no-write promotion dry-run plan lane",
    helperPath,
    "GET /api/research-candidate-review/manual-note-preview-drafts/[preview_draft_id]/promotion-dry-run-plan",
    componentPath,
    fixturePath,
    "npm run smoke:research-candidate-promotion-dry-run-plan-v0-1",
    "selected preview draft -> no-write promotion plan",
    "operator-visible Cockpit readout",
    "local clipboard only",
    "no actual promotion",
    "no proof/evidence write",
    "no Perspective/canonical graph write",
    "no work item",
    "no provider/retrieval/source fetch",
    "no external handoff",
    "no dry-run plan persistence",
    "no schema/migration code",
    "no dependency",
  ]) {
    assert.ok(
      normalizedIncludes(docsIndex, requiredText),
      `docs index must include ${requiredText}`,
    );
  }
}

function assertForbiddenPatternsAbsent() {
  const inspected = [
    [helperPath, helper],
    [routePath, route],
    [componentPath, component],
  ];

  for (const [filePath, text] of inspected) {
    for (const forbiddenActionLabel of [
      "Promote",
      "Approve",
      "Reject",
      "Defer",
      "Create proof",
      "Create evidence",
      "Create work item",
      "Send handoff",
      "Fetch source",
      "Run provider",
    ]) {
      assert.ok(
        !text.includes(forbiddenActionLabel),
        `${filePath} must not include forbidden action label ${forbiddenActionLabel}`,
      );
    }

    for (const storagePattern of [
      /\blocalStorage\b/,
      /\bsessionStorage\b/,
      /\bindexedDB\b/,
      /\bdocument\.cookie\b/,
    ]) {
      assert.doesNotMatch(text, storagePattern, `${filePath} must not use browser persistence`);
    }

    const importLines = text.match(/^import .*$/gm) ?? [];
    for (const importLine of importLines) {
      assert.doesNotMatch(
        importLine,
        /openai|provider|retrieval|rag|source-fetch|source_fetch|proof\/write|evidence\/write|work-item|perspective.*write/i,
        `${filePath} must not import forbidden write/provider modules: ${importLine}`,
      );
    }
  }

  for (const [filePath, text] of [
    [helperPath, helper],
    [routePath, route],
  ]) {
    for (const [label, pattern] of [
      ["fetch call", /\bfetch\s*\(/],
      ["openDatabase call", /\bopenDatabase\s*\(/],
      ["INSERT statement", /\bINSERT\b/i],
      ["UPDATE statement", /\bUPDATE\b/i],
      ["DELETE statement", /\bDELETE\b/i],
      ["CREATE TABLE statement", /\bCREATE\s+TABLE\b/i],
      ["ALTER TABLE statement", /\bALTER\s+TABLE\b/i],
      ["DROP TABLE statement", /\bDROP\s+TABLE\b/i],
    ]) {
      assert.ok(!pattern.test(text), `${filePath} must not include ${label}`);
    }
  }

  assert.doesNotMatch(component, /\bfetch\s*\(/, "component must not fetch");
  assert.match(
    hook,
    /fetch\s*\(\s*buildManualNotePreviewDraftPromotionDryRunPlanRoute\(previewDraftId\)/,
    "hook may fetch only the same-origin dry-run route builder",
  );
  assert.doesNotMatch(
    hook,
    /https?:\/\//,
    "hook must not introduce external dry-run URLs",
  );

  for (const filePath of listFiles(".")) {
    if (!/(migration|migrations|schema)/i.test(filePath)) continue;
    const text = readFileSync(filePath, "utf8");
    assert.ok(
      !/promotion-dry-run-plan|manual_note_promotion_dry_run_plan/i.test(text),
      `schema/migration file must not reference dry-run plan lane: ${filePath}`,
    );
  }
}

function functionBlock(source, name) {
  let start = source.indexOf(`function ${name}(`);
  if (start === -1) {
    start = source.indexOf(`async function ${name}(`);
  }
  assert.notEqual(start, -1, `function ${name} must exist`);
  const signatureStart = source.indexOf("(", start);
  assert.notEqual(signatureStart, -1, `function ${name} must have parameters`);
  let parameterDepth = 0;
  let signatureEnd = -1;
  for (let index = signatureStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "(") parameterDepth += 1;
    if (char === ")") {
      parameterDepth -= 1;
      if (parameterDepth === 0) {
        signatureEnd = index;
        break;
      }
    }
  }
  assert.notEqual(signatureEnd, -1, `function ${name} parameter list must close`);

  const bodyStart = source.indexOf("{", signatureEnd);
  assert.notEqual(bodyStart, -1, `function ${name} must have a body`);

  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  assert.fail(`function ${name} body was not closed`);
}

function listFiles(root) {
  if (!existsSync(root)) return [];
  const results = [];
  for (const entry of readdirSync(root)) {
    if (entry === ".git" || entry === "node_modules" || entry === ".next") {
      continue;
    }
    const filePath = path.join(root, entry);
    const stats = statSync(filePath);
    if (stats.isDirectory()) {
      results.push(...listFiles(filePath));
    } else {
      results.push(filePath);
    }
  }
  return results;
}

function assertIncludes(source, snippet, message) {
  assert.ok(source.includes(snippet), message ?? `expected source to include ${snippet}`);
}

function assertOrdered(source, snippets) {
  let cursor = -1;
  for (const snippet of snippets) {
    const index = source.indexOf(snippet, cursor + 1);
    assert.notEqual(
      index,
      -1,
      `expected ${snippet} after offset ${cursor} in:\n${source}`,
    );
    cursor = index;
  }
}

function normalizedIncludes(source, phrase) {
  return source.replace(/\s+/g, " ").includes(phrase.replace(/\s+/g, " "));
}
