import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const hookPath =
  "components/use-research-candidate-manual-note-preview-runtime.ts";
const manualPanelPath =
  "components/research-candidate-manual-note-preview-panel.tsx";
const draftListPanelPath =
  "components/research-candidate-preview-draft-list-panel.tsx";
const activityReadoutPath =
  "components/research-candidate-preview-draft-activity-readout.tsx";
const preflightReadoutPath =
  "components/research-candidate-promotion-readiness-preflight-readout.tsx";
const dryRunPlanReadoutPath =
  "components/research-candidate-promotion-dry-run-plan-readout.tsx";
const copyPacketPanelPath =
  "components/research-candidate-readiness-copy-packet-panel.tsx";
const localChecklistPath =
  "components/research-candidate-local-packet-review-checklist.tsx";
const candidateFamilyListsPath =
  "components/research-candidate-manual-note-candidate-family-lists.tsx";
const startupReadinessPath = "components/cockpit-startup-readiness-readout.tsx";
const docsIndexPath = "docs/00_INDEX_LATEST.md";
const packagePath = "package.json";

for (const filePath of [
  hookPath,
  manualPanelPath,
  draftListPanelPath,
  activityReadoutPath,
  preflightReadoutPath,
  dryRunPlanReadoutPath,
  copyPacketPanelPath,
  localChecklistPath,
  candidateFamilyListsPath,
  startupReadinessPath,
  docsIndexPath,
  packagePath,
]) {
  assert.ok(existsSync(filePath), `${filePath} must exist`);
}

const hook = readFileSync(hookPath, "utf8");
const manualPanel = readFileSync(manualPanelPath, "utf8");
const uiSurface = [
  manualPanel,
  readFileSync(draftListPanelPath, "utf8"),
  readFileSync(activityReadoutPath, "utf8"),
  readFileSync(preflightReadoutPath, "utf8"),
  readFileSync(dryRunPlanReadoutPath, "utf8"),
  readFileSync(copyPacketPanelPath, "utf8"),
  readFileSync(localChecklistPath, "utf8"),
  readFileSync(candidateFamilyListsPath, "utf8"),
  readFileSync(startupReadinessPath, "utf8"),
].join("\n");
const docsIndex = readFileSync(docsIndexPath, "utf8");
const packageJson = JSON.parse(readFileSync(packagePath, "utf8"));

assertHookAndParentWiring();
assertSameOriginRoutes();
assertTransitionResetHelpers();
assertTransitionActions();
assertReturnedStateShape();
assertPreservedUiSurfaces();
assertForbiddenPatternsAbsent();
assertDocsAndPackagePointers();

console.log(
  JSON.stringify(
    {
      smoke:
        "research-candidate-manual-note-runtime-hook-transitions-v0-1",
      hook_exports_runtime_hook: true,
      parent_local_parse_preserved: true,
      same_origin_routes_checked: true,
      transition_reset_helpers_checked: true,
      action_transition_guards_checked: true,
      grouped_hook_state_checked: true,
      preserved_ui_surfaces_checked: true,
      forbidden_patterns_absent: true,
      docs_pointer_checked: true,
      package_script_checked: true,
      manual_panel_line_count: manualPanel.split("\n").length,
    },
    null,
    2,
  ),
);

function assertHookAndParentWiring() {
  assert.match(
    hook,
    /export function useResearchCandidateManualNotePreviewRuntime\(/,
    "hook must export useResearchCandidateManualNotePreviewRuntime",
  );
  assert.match(
    manualPanel,
    /useResearchCandidateManualNotePreviewRuntime\(\)/,
    "manual note panel must call the runtime hook",
  );
  assert.match(
    manualPanel,
    /parseManualResearchNoteToPreview\(manualNoteText\)/,
    "manual note panel must still own local deterministic parse execution",
  );
  assert.match(
    manualPanel,
    /manualNoteRuntime\.actions\.clearRuntimeResult\(\)/,
    "local parse must clear stale runtime/opened/activity/preflight state",
  );
  assert.match(
    manualPanel,
    /manualNoteRuntime\.actions\.resetRuntimeDraftState\(\)/,
    "clear local note/sample reset must clear runtime-owned state",
  );
  assert.match(
    manualPanel,
    /setParserResult\(null\)/,
    "parent wrappers must still clear local parser result after runtime/open transitions",
  );
  assert.ok(
    manualPanel.split("\n").length <= 560,
    "manual panel should stay near the #658 size and not absorb orchestration again",
  );
}

function assertSameOriginRoutes() {
  for (const routeText of [
    "MANUAL_NOTE_PREVIEW_ROUTE",
    "MANUAL_NOTE_PREVIEW_DRAFTS_ROUTE",
    "buildManualNotePreviewDraftDetailRoute",
    "buildManualNotePreviewDraftLabelRoute",
    "buildManualNotePreviewDraftActivityRoute",
    "buildManualNotePreviewDraftDiscardRoute",
    "buildManualNotePreviewDraftPromotionReadinessRoute",
    "buildManualNotePreviewDraftPromotionDryRunPlanRoute",
  ]) {
    assert.ok(hook.includes(routeText), `hook must use ${routeText}`);
  }

  const fetchCalls = [...hook.matchAll(/\bfetch\s*\(([^)]*)/g)].map((match) =>
    match[1].trim(),
  );
  assert.ok(fetchCalls.length >= 6, "hook must own same-origin route fetches");
  for (const fetchCall of fetchCalls) {
    assert.doesNotMatch(
      fetchCall,
      /https?:\/\//,
      `fetch call must not use external URL: ${fetchCall}`,
    );
  }
}

function assertTransitionResetHelpers() {
  const activityReset = functionBlock("clearPreviewDraftActivityState");
  assertIncludes(activityReset, "setPreviewDraftActivity(null)");
  assertIncludes(activityReset, "setPreviewDraftActivityError(null)");
  assertIncludes(activityReset, "setLoadingPreviewDraftActivityId(null)");

  const preflightReset = functionBlock("clearPromotionReadinessPreflightState");
  assertIncludes(preflightReset, "setPromotionReadinessPreflight(null)");
  assertIncludes(preflightReset, "setPromotionReadinessPreflightError(null)");
  assertIncludes(preflightReset, "setLoadingPromotionReadinessPreflightId(null)");

  const dryRunReset = functionBlock("clearPromotionDryRunPlanState");
  assertIncludes(dryRunReset, "setPromotionDryRunPlan(null)");
  assertIncludes(dryRunReset, "setPromotionDryRunPlanError(null)");
  assertIncludes(dryRunReset, "setLoadingPromotionDryRunPlanId(null)");

  const labelReset = functionBlock("clearDraftLabelEditState");
  assertIncludes(labelReset, "setDraftLabelEditState(null)");
  assertIncludes(labelReset, "setSavingDraftLabelId(null)");

  const transitionUiReset = functionBlock("clearPreviewDraftTransitionUiState");
  assertOrdered(transitionUiReset, [
    "setConfirmDiscardPreviewDraftId(null)",
    "clearDraftLabelEditState()",
  ]);

  const openedDependentReset = functionBlock("clearOpenedPreviewDraftDependentState");
  assertOrdered(openedDependentReset, [
    "clearPreviewDraftActivityState()",
    "clearPromotionReadinessPreflightState()",
    "clearPromotionDryRunPlanState()",
    "clearPreviewDraftTransitionUiState()",
  ]);
}

function assertTransitionActions() {
  const clearRuntime = functionBlock("clearRuntimeResult");
  assertOrdered(clearRuntime, [
    "setRuntimeResult(null)",
    "setOpenedPreviewDraft(null)",
    "clearOpenedPreviewDraftDependentState()",
    "setRuntimeError(null)",
    "setIsRuntimeLoading(false)",
  ]);

  const refresh = functionBlock("refreshPreviewDrafts");
  assertIncludes(
    refresh,
    "setConfirmDiscardPreviewDraftId(null)",
    "refresh must clear stale confirm-discard state",
  );

  const create = functionBlock("createRuntimePreviewDraft");
  assertOrdered(create, [
    "setRuntimeResult(result)",
    "setOpenedPreviewDraft(null)",
    "clearOpenedPreviewDraftDependentState()",
    "void refreshPreviewDrafts()",
  ]);

  const open = functionBlock("openPreviewDraft");
  assertOrdered(open, [
    "setOpenedPreviewDraft(result)",
    "setRuntimeResult(null)",
    "clearOpenedPreviewDraftDependentState()",
    "setRuntimeError(null)",
    "setIsRuntimeLoading(false)",
  ]);

  const discard = functionBlock("discardPreviewDraft");
  assertOrdered(discard, [
    "setConfirmDiscardPreviewDraftId(null)",
    "clearDraftLabelEditState()",
    "clearPromotionDryRunPlanState()",
    "void loadPreviewDraftActivity(previewDraftId)",
    "void loadPromotionReadinessPreflight(previewDraftId)",
    "await refreshPreviewDrafts()",
  ]);

  const startLabel = functionBlock("startDraftLabelEdit");
  assertIncludes(
    startLabel,
    "setConfirmDiscardPreviewDraftId(null)",
    "starting label edit must clear stale confirm-discard state",
  );

  const cancelLabel = functionBlock("cancelDraftLabelEdit");
  assertIncludes(
    cancelLabel,
    "clearDraftLabelEditState()",
    "cancel label edit must clear saving/edit state",
  );

  const saveLabel = functionBlock("saveDraftLabel");
  assertOrdered(saveLabel, [
    "clearDraftLabelEditState()",
    "clearPromotionDryRunPlanState()",
    "await refreshPreviewDrafts()",
    "void loadPreviewDraftActivity(previewDraftId)",
    "void loadPromotionReadinessPreflight(previewDraftId)",
  ]);
  assertIncludes(
    saveLabel,
    "operator_note_label: nextLabel.length > 0 ? nextLabel : null",
    "save label must preserve clear-label null behavior",
  );
}

function assertReturnedStateShape() {
  const returnBlock = hook.slice(hook.indexOf("return {"));
  for (const requiredGroup of [
    "runtimeState",
    "draftListState",
    "openedDraftState",
    "discardState",
    "labelState",
    "activityState",
    "preflightState",
    "dryRunPlanState",
    "actions",
    "filterActions",
  ]) {
    assert.ok(returnBlock.includes(requiredGroup), `hook return must include ${requiredGroup}`);
  }

  for (const requiredAction of [
    "createRuntimePreviewDraft",
    "refreshPreviewDrafts",
    "openPreviewDraft",
    "discardPreviewDraft",
    "cancelDiscardPreviewDraft",
    "startDraftLabelEdit",
    "updateDraftLabelEditValue",
    "saveDraftLabel",
    "cancelDraftLabelEdit",
    "clearDraftLabelEditValue",
    "loadPreviewDraftActivity",
    "loadPromotionReadinessPreflight",
    "loadPromotionDryRunPlan",
    "clearPromotionDryRunPlanState",
    "clearRuntimeResult",
    "resetRuntimeDraftState",
    "updateDraftLifecycleFilter",
    "updateDraftSort",
    "updateDraftWarningFilter",
    "updateDraftCandidateFilter",
    "updateDraftListLimit",
  ]) {
    assert.ok(returnBlock.includes(requiredAction), `hook return must expose ${requiredAction}`);
  }
}

function assertPreservedUiSurfaces() {
  for (const requiredText of [
    "RecentPreviewDraftsPanel",
    "PreviewDraftActivityReadout",
    "PromotionReadinessPreflightReadout",
    "PromotionDryRunPlanReadout",
    "Readiness copy packet",
    "No-write promotion dry-run plan",
    "Local packet review checklist",
    "claim_candidates",
    "evidence_candidates",
    "Startup readiness",
  ]) {
    assert.ok(uiSurface.includes(requiredText), `UI surface must retain ${requiredText}`);
  }
}

function assertForbiddenPatternsAbsent() {
  for (const forbiddenStorage of [
    "localStorage",
    "sessionStorage",
    "indexedDB",
    "document.cookie",
  ]) {
    assert.doesNotMatch(hook, new RegExp(`\\b${escapeRegExp(forbiddenStorage)}\\b`));
    assert.doesNotMatch(manualPanel, new RegExp(`\\b${escapeRegExp(forbiddenStorage)}\\b`));
  }

  for (const forbiddenImport of [
    "@/lib/db",
    "@/lib/research-candidate-review/manual-note-preview-draft-store",
    "@/app/api/",
    "openai",
    "provider",
    "retrieval",
    "rag",
    "source-fetch",
    "codex",
    "proof",
    "evidence",
    "work-item",
    "promotion-gate",
  ]) {
    assert.doesNotMatch(
      hook,
      new RegExp(`from ["'][^"']*${escapeRegExp(forbiddenImport)}[^"']*["']`),
      `hook must not import ${forbiddenImport}`,
    );
  }

  for (const forbiddenMutation of [
    "INSERT INTO",
    "UPDATE ",
    "DELETE FROM",
    "CREATE TABLE",
    "ALTER TABLE",
    "DROP TABLE",
    "schema.sql",
    "seed",
  ]) {
    assert.ok(!hook.includes(forbiddenMutation), `hook must not contain ${forbiddenMutation}`);
  }

  for (const forbiddenStateMachine of [
    "useReducer",
    "createMachine",
    "state machine",
    "reducer action enum",
  ]) {
    assert.ok(
      !hook.includes(forbiddenStateMachine),
      `hook transition hardening must not introduce ${forbiddenStateMachine}`,
    );
  }

  assert.doesNotMatch(hook, /https?:\/\//, "hook must not introduce external URLs");
}

function assertDocsAndPackagePointers() {
  assert.equal(
    packageJson.scripts?.[
      "smoke:research-candidate-manual-note-runtime-hook-transitions-v0-1"
    ],
    "node scripts/smoke-research-candidate-manual-note-runtime-hook-transitions-v0-1.mjs",
    "package.json must expose the transition smoke",
  );
  assert.ok(
    docsIndex.includes(
      "smoke:research-candidate-manual-note-runtime-hook-transitions-v0-1",
    ),
    "docs index must point to the transition smoke",
  );
}

function functionBlock(name) {
  let start = hook.indexOf(`function ${name}(`);
  if (start === -1) {
    start = hook.indexOf(`async function ${name}(`);
  }
  assert.notEqual(start, -1, `function ${name} must exist`);
  const signatureStart = hook.indexOf("(", start);
  assert.notEqual(signatureStart, -1, `function ${name} must have parameters`);
  let parameterDepth = 0;
  let signatureEnd = -1;
  for (let index = signatureStart; index < hook.length; index += 1) {
    const char = hook[index];
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

  const bodyStart = hook.indexOf("{", signatureEnd);
  assert.notEqual(bodyStart, -1, `function ${name} must have a body`);

  let depth = 0;
  for (let index = bodyStart; index < hook.length; index += 1) {
    const char = hook[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return hook.slice(start, index + 1);
      }
    }
  }

  assert.fail(`function ${name} body was not closed`);
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

function assertIncludes(source, snippet, message) {
  assert.ok(source.includes(snippet), message ?? `expected source to include ${snippet}`);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
