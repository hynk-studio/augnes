#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ProductShell } from "../components/product-shell";
import { publicSafeCommandSummaryV01 } from "../lib/vnext/native-host/codex-app-server-adapter";
import {
  MAX_REFRESHED_PROJECT_HOME_PROJECTIONS_V01,
  buildProjectHomeRefreshProjectionKeyV01,
  createProjectHomeRefreshHistoryV01,
  type ProjectHomeRefreshProjectionV01,
} from "../lib/vnext/project-home-refresh-projection";
import { createProtocolSha256V01 } from "../lib/vnext/protocol-primitives";
import {
  createProjectReviewWorkbenchEntryV01,
  createProposalWorkbenchEntryV01,
  createRunResultWorkbenchEntryV01,
} from "../lib/vnext/runtime/semantic-workbench-entry";
import { buildManagementSafetyViewV01 } from "../lib/vnext/management-safety/management-safety-view";

const assertions: string[] = [];

for (const [command, secret] of [
  ["tool --client-secret super-secret-value", "super-secret-value"],
  ["tool --client-secret=super-secret-value", "super-secret-value"],
  ["aws --secret-access-key super-secret-value", "super-secret-value"],
  ["tool --service-account-token=super-secret-value", "super-secret-value"],
  ["env CLIENT_SECRET=super-secret-value tool", "super-secret-value"],
  ["set CLIENT_SECRET=super-secret-value", "super-secret-value"],
  ['$env:CLIENT_SECRET = "super-secret-value"', "super-secret-value"],
  [
    'curl -H "X-Api-Key: super-secret-value" https://example.invalid',
    "super-secret-value",
  ],
  [
    'curl --header "Authorization: Bearer super-secret-value" https://example.invalid',
    "super-secret-value",
  ],
  [
    'curl --header "Proxy-Authorization: Bearer super-secret-value" https://example.invalid',
    "super-secret-value",
  ],
  ["https://user:password@example.invalid/", "user:password"],
] as const) {
  const summary = publicSafeCommandSummaryV01(command);
  assert.equal(summary.includes(secret), false, command);
  assert.equal(summary.includes("[redacted]"), true, command);
  const fingerprint = createProtocolSha256V01(command);
  assert.equal(fingerprint, createProtocolSha256V01(command));
  assert.notEqual(
    fingerprint,
    createProtocolSha256V01(command.replace(secret, `${secret}-different`)),
  );
}
record("live_codex_public_command_summary_redacts_credentials_and_absolute_paths");

for (const [command, privatePath] of [
  ["/usr/bin/env npm test", "/usr/bin/env"],
  ["node /home/private/project/script.js", "/home/private/project/script.js"],
  [
    String.raw`"C:\Program Files\nodejs\node.exe" script.js`,
    String.raw`C:\Program Files\nodejs\node.exe`,
  ],
  [String.raw`\\server\share\tool.exe`, String.raw`\\server\share\tool.exe`],
  [String.raw`\rooted\tool.exe`, String.raw`\rooted\tool.exe`],
  ["file:///home/private/tool", "file:///home/private/tool"],
] as const) {
  const summary = publicSafeCommandSummaryV01(command);
  assert.equal(summary.includes(privatePath), false, command);
  assert.equal(summary.includes("[absolute-path]"), true, command);
  assert.match(createProtocolSha256V01(command), /^sha256:[a-f0-9]{64}$/u);
}

for (const command of [
  "npm test",
  "git status --short",
  "node scripts/check.mjs",
  "npm run check -- src/runtime/adapter.ts",
]) {
  assert.equal(publicSafeCommandSummaryV01(command), command);
}
record("live_codex_public_command_summary_preserves_safe_relative_commands");

const repositoryRoot = process.cwd();
const removedPaths = [
  "app/api/vnext/operator/packet-handoff/route.ts",
  "app/api/vnext/operator/later-result/route.ts",
  "app/api/vnext/operator/context-use-review/route.ts",
  "app/api/intake/codex-result-report/records/route.ts",
  "app/api/augnes/read/handoff-capsule/route.ts",
  "app/api/augnes/read/codex-launch-card/route.ts",
  "app/api/handoffs/generate/route.ts",
  "app/api/handoffs/review/route.ts",
  "app/api/workplane/handoff-packet-copy-exports/route.ts",
  "app/workbench/semantic-review/packet-handoff/[packet_id]/page.tsx",
  "components/codex-result-report-ingestion-panel.tsx",
  "components/workbench/semantic-review/later-result-intake-panel.tsx",
  "components/workbench/semantic-review/context-use-review-panel.tsx",
  "lib/vnext/runtime/operator-pilot-later-result-intake.ts",
  "lib/vnext/task-context-packet-handoff.ts",
  "lib/vnext/compat/run-receipt-from-codex-result-report.ts",
  "lib/dogfooding/codex-result-report-normalizer.ts",
  "lib/handoff/handoff-capsule-source.ts",
  "scripts/vnext-operator-pilot.ts",
  "scripts/browser-validate-vnext-task-context-packet-handoff-v0-1.mjs",
  "components/project-home.tsx",
  "components/project-onboarding-home.tsx",
  "components/project-destination-actions.tsx",
] as const;
for (const relativePath of removedPaths) {
  assert.equal(exists(relativePath), false, `${relativePath} must be retired`);
}
record("retired_native_host_transport_modules_and_routes_are_absent");

const productionSources = readSourceTree([
  "app",
  "components",
  "lib/vnext",
  "apps/augnes_apps/src",
  "apps/augnes_apps/public",
]);
for (const forbidden of [
  "codexResultText",
  "codexResultPaste",
  "copyable_core_handoff_text",
  "copyable_full_handoff_text",
  "augnes_generate_codex_handoff_draft",
  "augnes_review_codex_result_draft",
  "augnes_get_handoff_capsule_preview",
  "augnes_get_codex_launch_card_preview",
]) {
  assert.equal(productionSources.includes(forbidden), false, forbidden);
}
record("production_graph_has_zero_manual_native_host_copy_or_result_paste_symbols");

const blankStateShell = renderToStaticMarkup(
  createElement(
    ProductShell,
    {
      primaryZone: "blank-state",
      utilityContext: "project-management",
      projectContext: { label: "Current project", name: "Shell contract project" },
      children: createElement("main", null, "Blank State route"),
    },
  ),
);
const actionableProjectContextShell = renderToStaticMarkup(
  createElement(
    ProductShell,
    {
      primaryZone: "blank-state",
      projectContext: {
        label: "Current project",
        name: "Shell contract project",
        managementHref: "#project-settings",
      },
      children: createElement("main", null, "Managed Blank State route"),
    },
  ),
);
const aiWorkplaneShell = renderToStaticMarkup(
  createElement(
    ProductShell,
    {
      primaryZone: "ai-workplane",
      children: createElement("main", null, "AI Workplane route"),
    },
  ),
);
const portabilityShell = renderToStaticMarkup(
  createElement(
    ProductShell,
    {
      primaryZone: null,
      utilityContext: "portability",
      children: createElement("main", null, "Portability route"),
    },
  ),
);
const blankPrimaryNavigation = labeledNavigationMarkup(
  blankStateShell,
  "Primary navigation",
);
const aiPrimaryNavigation = labeledNavigationMarkup(
  aiWorkplaneShell,
  "Primary navigation",
);
const portabilityPrimaryNavigation = labeledNavigationMarkup(
  portabilityShell,
  "Primary navigation",
);
for (const primaryNavigation of [
  blankPrimaryNavigation,
  aiPrimaryNavigation,
  portabilityPrimaryNavigation,
]) {
  assert.equal(count(primaryNavigation, /<a /gu), 2);
  assert.equal(primaryNavigation.includes("<strong>Continuities</strong>"), true);
  assert.equal(primaryNavigation.includes("<strong>AI Workplane</strong>"), true);
  assert.equal(primaryNavigation.includes('href="/"'), true);
  assert.equal(
    primaryNavigation.includes('href="/workbench/semantic-review"'),
    true,
  );
  for (const rejectedPeer of [
    "Projects",
    "Home",
    "Workbench",
    "Inspector",
    "Portability",
    "Recovery",
  ]) {
    assert.equal(
      primaryNavigation.includes(`<strong>${rejectedPeer}</strong>`),
      false,
    );
  }
}
assert.equal(count(blankPrimaryNavigation, /aria-current="page"/gu), 1);
assert.match(blankPrimaryNavigation, /href="\/" aria-current="page"/u);
assert.equal(count(aiPrimaryNavigation, /aria-current="page"/gu), 1);
assert.match(
  aiPrimaryNavigation,
  /href="\/workbench\/semantic-review" aria-current="page"/u,
);
assert.equal(count(portabilityPrimaryNavigation, /aria-current="page"/gu), 0);
for (const shell of [blankStateShell, aiWorkplaneShell, portabilityShell]) {
  assert.equal(shell.includes("Project tools"), false);
  assert.equal(shell.includes('href="/projects"'), false);
  assert.equal(shell.includes('href="/portability"'), false);
  assert.equal(shell.includes('href="/recovery"'), false);
}
assert.match(blankStateShell, /data-primary-product-zone="blank-state"/u);
assert.match(blankStateShell, /data-product-utility-context="project-management"/u);
assert.match(aiWorkplaneShell, /data-primary-product-zone="ai-workplane"/u);
assert.match(portabilityShell, /data-primary-product-zone="none"/u);
assert.match(portabilityShell, /data-product-utility-context="portability"/u);
record("product_shell_has_only_two_primary_zones_and_no_global_project_tools");

assert.match(
  blankStateShell,
  /<p class="product-project-context"[^>]*data-project-context-label="Current project"/u,
);
assert.doesNotMatch(
  blankStateShell,
  /product-project-context--action|href="[^"]*#project-settings"/u,
);
assert.match(
  actionableProjectContextShell,
  /<a class="product-project-context product-project-context--action" href="#project-settings"[^>]*data-project-context-label="Current project"/u,
);
record("current_project_context_requires_explicit_management_destination");

const activeManagement = buildManagementSafetyViewV01({
  project_context: "active_project",
});
const noProjectManagement = buildManagementSafetyViewV01({
  project_context: "no_active_project",
});
const inactiveManagement = buildManagementSafetyViewV01({
  project_context: "viewed_inactive_project",
});
assert.equal(
  activeManagement.project_management.href,
  "/projects#project-management",
);
assert.equal(
  noProjectManagement.project_management.href,
  "/projects#project-management",
);
assert.equal(
  inactiveManagement.project_management.href,
  "/projects#project-management",
);
assert.equal(activeManagement.project_transfer.href, "/portability");
assert.equal(activeManagement.local_recovery.href, "/recovery");
assert.match(activeManagement.project_transfer.summary, /Export the current project/u);
assert.match(noProjectManagement.project_transfer.summary, /Import a local project package/u);
assert.doesNotMatch(noProjectManagement.project_transfer.summary, /Export/u);
assert.match(inactiveManagement.project_transfer.summary, /current project/u);
assert.deepEqual(
  buildManagementSafetyViewV01({ project_context: "active_project" }),
  activeManagement,
);
assert.equal(Object.values(activeManagement.authority).every((value) => value === false), true);
record("management_safety_navigation_is_fixed_deterministic_and_non_authoritative");

const portabilityPageSource = source("app/portability/page.tsx");
const recoveryPageSource = source("app/recovery/page.tsx");
const blankStateClientSource = source("components/blank-state/blank-state-client.tsx");
assert.equal(blankStateClientSource.includes("Manage and protect"), true);
assert.equal(blankStateClientSource.includes('href={item.href}'), true);
assert.equal(blankStateClientSource.includes("/api/vnext/portability"), false);
assert.equal(blankStateClientSource.includes("/api/recovery"), false);
assert.equal(portabilityPageSource.includes("Move or import a project"), true);
assert.equal(portabilityPageSource.includes("Back to Continuities"), true);
assert.equal(portabilityPageSource.includes("Open imported project"), true);
assert.equal(portabilityPageSource.includes("Open imported Project Home"), false);
assert.equal(portabilityPageSource.includes("Export current project"), true);
assert.equal(portabilityPageSource.includes("Review package contents"), true);
assert.equal(recoveryPageSource.includes("buildRecoverySafetyViewV01"), true);
assert.equal(recoveryPageSource.includes("Backups and recovery"), false);
assert.equal(recoveryPageSource.includes("Advanced diagnostics"), true);
assert.equal(recoveryPageSource.includes("Product tools"), false);
record("management_and_safety_surfaces_use_contextual_human_hierarchy");

const workbenchRouteSource = source("app/workbench/page.tsx");
const semanticReviewSurfaceSource = source(
  "components/workbench/semantic-review/semantic-review-surface.tsx",
);
const aiWorkplaneShellSource = source(
  "components/workbench/ai-workplane/ai-workplane-shell.tsx",
);
const changeReviewSource = source(
  "components/workbench/semantic-review/decision-centered-proposal-detail.tsx",
);
const transitionActionsSource = source(
  "components/workbench/semantic-review/semantic-transition-actions.tsx",
);
const resultReviewSource = source(
  "components/workbench/result-review/run-result-review-surface.tsx",
);
assert.match(
  workbenchRouteSource,
  /redirect\("\/workbench\/semantic-review"\)/u,
);
assert.equal(workbenchRouteSource.includes("AgentWorkplane"), false);
assert.equal(semanticReviewSurfaceSource.includes("AIWorkplaneShell"), true);
assert.equal(semanticReviewSurfaceSource.includes("SemanticWorkbenchShell"), false);
assert.equal(
  count(semanticReviewSurfaceSource, /useProjectGuideBriefV02\(/gu),
  1,
);
assert.equal(aiWorkplaneShellSource.includes("AI Workplane"), true);
assert.equal(aiWorkplaneShellSource.includes("How decisions are protected"), true);
assert.equal(changeReviewSource.includes("What would change"), true);
assert.equal(changeReviewSource.includes("Meaningful timeline"), true);
assert.equal(changeReviewSource.includes("What happens next"), true);
assert.equal(changeReviewSource.includes("Verification and uncertainty"), true);
assert.equal(changeReviewSource.includes("Your decision"), true);
assert.equal(changeReviewSource.includes("Advanced review"), true);
assert.equal(resultReviewSource.includes("Outcome"), true);
assert.equal(
  resultReviewSource.includes(
    'data-ai-workplane-result-section="verification"',
  ),
  true,
);
assert.equal(
  resultReviewSource.includes(
    "data-ai-workplane-verification={view.verification.status}",
  ),
  true,
);
assert.equal(
  resultReviewSource.includes("SEMANTIC_VISUAL_PRIORITY.aiSummary"),
  true,
);
assert.match(
  resultReviewSource,
  /<p className=\{styles\.kicker\}>AI summary<\/p>[\s\S]*<h2 id="result-verification-title">\{view\.verification\.label\}<\/h2>/u,
);
for (const verificationField of [
  "passed",
  "failed",
  "skipped",
  "satisfied",
  "unsatisfied",
  "unknown",
]) {
  assert.equal(
    resultReviewSource.includes(`view.verification.${verificationField}`),
    true,
    `result review preserves the ${verificationField} verification metric`,
  );
}
assert.equal(
  resultReviewSource.includes("view.verification.blockers.length > 0"),
  true,
);
assert.equal(
  resultReviewSource.includes("view.verification.blockers.map"),
  true,
);
assert.equal(resultReviewSource.includes("What remains unresolved"), true);
assert.equal(
  resultReviewSource.includes(
    'data-ai-workplane-result-section="unresolved"',
  ),
  true,
);
assert.equal(
  resultReviewSource.includes("SEMANTIC_VISUAL_PRIORITY.risk"),
  true,
);
assert.equal(resultReviewSource.includes("data-result-review-read-only"), true);
assert.equal(
  resultReviewSource.includes('data-result-to-shared-inspector="true"'),
  true,
);
assert.equal(
  resultReviewSource.includes("href={result.summary.inspector_href}"),
  true,
);
record("ai_workplane_replaces_active_agent_and_semantic_workbench_presentations");

const confirmationCallbackSource = transitionActionsSource.slice(
  transitionActionsSource.indexOf("async function confirmGate"),
  transitionActionsSource.indexOf(
    "async function applyTransitionAndCompile",
  ),
);
const applicationCallbackSource = transitionActionsSource.slice(
  transitionActionsSource.indexOf(
    "async function applyTransitionAndCompile",
  ),
  transitionActionsSource.indexOf("function handleRouteError"),
);
assert.equal(
  confirmationCallbackSource.includes(
    "await onExactReviewMaterialChanged()",
  ),
  true,
);
assert.equal(
  confirmationCallbackSource.includes(
    "onProjectApplicationCompleted",
  ),
  false,
);
assert.equal(
  applicationCallbackSource.includes(
    "await onProjectApplicationCompleted()",
  ),
  true,
);
assert.match(
  applicationCallbackSource,
  /body\.status !== "applied"[\s\S]*body\.status !== "exact_replay"/u,
);
assert.equal(
  applicationCallbackSource.includes(
    "onExactReviewMaterialChanged",
  ),
  false,
);
assert.equal(
  count(
    semanticReviewSurfaceSource,
    /onProjectApplicationCompleted=\{refreshAfterProjectApplication\}/gu,
  ),
  1,
);
record("ai_workplane_application_refreshes_exact_state_and_guide_once");

const directSource = source("lib/vnext/runtime/direct-native-host-round-trip.ts");
const routeSource = source("app/api/vnext/operator/host-round-trip/route.ts");
const normalizerSource = source("lib/vnext/native-host/native-host-result-normalization.ts");
const writerSource = source("lib/vnext/persistence/structured-run-receipt-admission.ts");
for (const forbidden of [
  "normalizeCodexResultReportV01",
  "codexResultText",
  "codexResultPaste",
  "result_report",
  "handoff_text",
  "packet_json",
]) {
  assert.equal(directSource.includes(forbidden), false);
  assert.equal(routeSource.includes(forbidden), false);
}
assert.equal(count(directSource, /admitStructuredRunReceiptV01\(/gu), 1);
assert.equal(count(directSource, /normalizeNativeHostResultResidueV01\(/gu), 2);
assert.equal(normalizerSource.includes("NativeHostResultV01"), true);
assert.equal(count(writerSource, /insertVNextCoreRecordV01\(/gu), 1);
assert.equal(
  readSourceTree(["lib/vnext/native-host"]).includes("admitStructuredRunReceiptV01"),
  false,
);
record("automatic_native_host_completion_has_one_complete_normalizer_and_receipt_authority");

const taskContextSource = source("lib/vnext/task-context-packet.ts");
const lineageSource = source(
  "lib/vnext/runtime/operator-pilot-workbench-lineage.ts",
);
const sharedInspectorSurface = source(
  "components/workbench/inspector/shared-project-inspector-surface.tsx",
);
assert.equal(taskContextSource.includes("isTaskContextPacketIdV01"), true);
assert.equal(taskContextSource.includes("TASK_CONTEXT_PACKET_ID_HEX_LENGTH_V01"), true);
assert.equal(lineageSource.includes("packet_compiled"), true);
assert.equal(lineageSource.includes("later_result"), false);
assert.equal(lineageSource.includes("context_use_review"), false);
assert.equal(sharedInspectorSurface.includes("Open exact packet handoff"), false);
assert.equal(sharedInspectorSurface.includes("fetch("), false);
assert.equal(sharedInspectorSurface.includes("<form"), false);
assert.equal(sharedInspectorSurface.includes("semantic mutation"), false);
record("packet_identity_is_absorbed_and_shared_inspector_is_read_only");

const optionalProjectReviewEntry = createProjectReviewWorkbenchEntryV01({
  workspace_id: "workspace:semantic-workbench-contract",
  project_id: "project:semantic-workbench-contract",
  reason: "Open the project review queue when useful.",
  review_required: false,
});
const requiredProjectReviewEntry = createProjectReviewWorkbenchEntryV01({
  workspace_id: "workspace:semantic-workbench-contract",
  project_id: "project:semantic-workbench-contract",
  reason: "Selected project context is stale and requires verification.",
  review_required: true,
});
assert.equal(optionalProjectReviewEntry.entry_state, "project_review");
assert.equal(optionalProjectReviewEntry.review_required, false);
assert.equal(requiredProjectReviewEntry.entry_state, "project_review");
assert.equal(requiredProjectReviewEntry.review_required, true);

const sourceConsistentWorkbenchEntries = [
  createRunResultWorkbenchEntryV01({
    workspace_id: "workspace:semantic-workbench-contract",
    project_id: "project:semantic-workbench-contract",
    receipt_id: "run-receipt:111111111111111111111111",
    entry_state: "assessment",
    origin: "interactive",
    reason: "Verify the exact result assessment.",
  }),
  createProposalWorkbenchEntryV01({
    workspace_id: "workspace:semantic-workbench-contract",
    project_id: "project:semantic-workbench-contract",
    proposal_id: "episode-delta-proposal:222222222222222222222222",
    entry_state: "pending_proposal",
    origin: "policy_triggered",
    reason: "Review the exact pending proposal.",
  }),
  optionalProjectReviewEntry,
  requiredProjectReviewEntry,
];
for (const entry of sourceConsistentWorkbenchEntries) {
  if (entry.source.record_kind === "run_receipt") {
    assert(["result_only", "assessment"].includes(entry.entry_state));
  } else if (entry.source.record_kind === "episode_delta_proposal") {
    assert([
      "pending_proposal",
      "decided_proposal",
      "transition_blocked",
      "transition_applied",
      "feedback_needed",
    ].includes(entry.entry_state));
  } else {
    assert.equal(entry.source.record_id, null);
    assert.equal(entry.entry_state, "project_review");
  }
}
record("semantic_workbench_entry_source_and_state_are_consistent");

const packageScripts = JSON.stringify({
  root: JSON.parse(source("package.json")).scripts,
  nested: JSON.parse(source("apps/augnes_apps/package.json")).scripts,
});
for (const retiredCommand of [
  "vnext:operator-pilot",
  "codex:record-completion",
  "codex:bind-session",
  "codex:handoff-check",
  "codex:record-result",
]) {
  assert.equal(packageScripts.includes(`"${retiredCommand}"`), false);
}
const canonicalSuite = source("scripts/run-canonical-test-suite.mjs");
assert.equal(
  canonicalSuite.includes("browser-validate-vnext-native-host-result-v0-1.mjs"),
  true,
);
assert.equal(
  canonicalSuite.includes("browser-validate-vnext-task-context-packet-handoff-v0-1.mjs"),
  false,
);
record("package_and_canonical_graph_have_no_retired_manual_aliases");

const refreshRunRef = "native-host-run:refresh-contract";
const approvalA = refreshProjection({
  run_ref: refreshRunRef,
  status: "waiting_for_approval",
  control_revision: 4,
  pending_approval: {
    approval_ref: "native-host-approval:refresh-a",
    control_revision: 4,
    decision_submitted: false,
  },
});
const approvalAKey = requireRefreshKey(approvalA);
assert.equal(approvalAKey, requireRefreshKey(structuredClone(approvalA)));
const exactReplayHistory = createProjectHomeRefreshHistoryV01();
assert.equal(exactReplayHistory.mark(approvalAKey), true);
assert.equal(exactReplayHistory.mark(approvalAKey), false);
assert.equal(exactReplayHistory.snapshot().length, 1);
for (const status of ["idle", "queued", "starting", "running"] as const) {
  assert.equal(
    buildProjectHomeRefreshProjectionKeyV01(
      refreshProjection({ status, control_revision: 4 }),
    ),
    null,
  );
}
record("project_home_refresh_exact_projection_replay_is_idempotent");

const approvalB = refreshProjection({
  run_ref: refreshRunRef,
  status: "waiting_for_approval",
  control_revision: 6,
  pending_approval: {
    approval_ref: "native-host-approval:refresh-b",
    control_revision: 6,
  },
});
const approvalBKey = requireRefreshKey(approvalB);
assert.notEqual(approvalAKey, approvalBKey);
const approvalHistory = createProjectHomeRefreshHistoryV01();
assert.equal(approvalHistory.mark(approvalAKey), true);
assert.equal(approvalHistory.mark(approvalAKey), false);
assert.equal(approvalHistory.mark(approvalBKey), true);
assert.equal(approvalHistory.mark(approvalBKey), false);
const decidedApprovalA = refreshProjection({
  ...approvalA,
  control_revision: 5,
  pending_approval: {
    ...approvalA.pending_approval!,
    decision_submitted: true,
  },
});
const decidedApprovalAKey = requireRefreshKey(decidedApprovalA);
assert.notEqual(decidedApprovalAKey, approvalAKey);
assert.equal(approvalHistory.mark(decidedApprovalAKey), true);
assert.equal(approvalHistory.mark(decidedApprovalAKey), false);
record("project_home_refresh_distinguishes_repeated_approval_revisions_in_one_run");

const terminalA = refreshProjection({
  run_ref: refreshRunRef,
  status: "completed",
  control_revision: 8,
  receipt: { receipt_ref: "run-receipt:refresh-a" },
});
const terminalAKey = requireRefreshKey(terminalA);
const terminalHistory = createProjectHomeRefreshHistoryV01();
assert.equal(terminalHistory.mark(terminalAKey), true);
assert.equal(terminalHistory.mark(terminalAKey), false);
const terminalBKey = requireRefreshKey(
  refreshProjection({
    run_ref: "native-host-run:refresh-contract-b",
    status: "completed",
    control_revision: 8,
    receipt: { receipt_ref: "run-receipt:refresh-b" },
  }),
);
assert.notEqual(terminalBKey, terminalAKey);
assert.equal(terminalHistory.mark(terminalBKey), true);
const pausedNKey = requireRefreshKey(
  refreshProjection({ status: "paused", control_revision: 9 }),
);
const pausedNPlusTwoKey = requireRefreshKey(
  refreshProjection({ status: "paused", control_revision: 11 }),
);
assert.equal(terminalHistory.mark(pausedNKey), true);
assert.equal(terminalHistory.mark(pausedNKey), false);
assert.equal(terminalHistory.mark(pausedNPlusTwoKey), true);
assert.equal(terminalHistory.mark(pausedNPlusTwoKey), false);
record("project_home_refresh_terminal_and_paused_boundaries_refresh_once");

const boundedHistory = createProjectHomeRefreshHistoryV01();
const boundedKeys = Array.from(
  { length: MAX_REFRESHED_PROJECT_HOME_PROJECTIONS_V01 + 3 },
  (_, index) =>
    requireRefreshKey(
      refreshProjection({
        run_ref: `native-host-run:bounded-${index}`,
        status: index % 2 === 0 ? "paused" : "completed",
        control_revision: index,
        receipt:
          index % 2 === 0
            ? null
            : { receipt_ref: `run-receipt:bounded-${index}` },
      }),
    ),
);
for (const key of boundedKeys) assert.equal(boundedHistory.mark(key), true);
assert.equal(
  boundedHistory.snapshot().length,
  MAX_REFRESHED_PROJECT_HOME_PROJECTIONS_V01,
);
assert.deepEqual(
  boundedHistory.snapshot(),
  boundedKeys.slice(-MAX_REFRESHED_PROJECT_HOME_PROJECTIONS_V01),
);
assert.equal(boundedHistory.snapshot().includes(boundedKeys[0]), false);
assert.equal(boundedHistory.snapshot().at(-1), boundedKeys.at(-1));
record("project_home_refresh_history_is_fifo_bounded");

const session = source(
  "components/workbench/semantic-review/operator-session-panel.tsx",
);
for (const marker of [
  "event.preventDefault();",
  'setBootstrapToken("");',
  'type="password"',
  'autoComplete="off"',
]) {
  assert.equal(session.includes(marker), true);
}
const credentialSafeSources = [
  session,
  source("components/workbench/semantic-review/semantic-transition-actions.tsx"),
  sharedInspectorSurface,
].join("\n");
for (const forbidden of [
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "document.cookie",
  "bootstrap_token_hash",
  "session_token_hash",
  "action_nonce_hash",
]) {
  assert.equal(credentialSafeSources.includes(forbidden), false);
}
record("static_refresh_resubmit_and_credential_safety_markers_present");

function source(relativePath: string): string {
  return readFileSync(path.join(repositoryRoot, relativePath), "utf8");
}

function exists(relativePath: string): boolean {
  try {
    readFileSync(path.join(repositoryRoot, relativePath));
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

function readSourceTree(relativeRoots: string[]): string {
  const extensions = new Set([".ts", ".tsx", ".js", ".mjs", ".html"]);
  const files: string[] = [];
  for (const relativeRoot of relativeRoots) {
    walk(path.join(repositoryRoot, relativeRoot), files);
  }
  return files
    .filter((file) => extensions.has(path.extname(file)))
    .sort()
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");
}

function walk(directory: string, files: string[]): void {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath, files);
    else if (entry.isFile()) files.push(fullPath);
  }
}

function count(value: string, pattern: RegExp): number {
  return [...value.matchAll(pattern)].length;
}

function labeledNavigationMarkup(markup: string, label: string): string {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = markup.match(
    new RegExp(`<nav(?: class="[^"]+")? aria-label="${escapedLabel}">([\\s\\S]*?)<\\/nav>`, "u"),
  );
  assert(match, `missing ${label}`);
  return match[1];
}

function refreshProjection(
  overrides: Partial<ProjectHomeRefreshProjectionV01> = {},
): ProjectHomeRefreshProjectionV01 {
  return {
    run_ref: refreshRunRef,
    status: "running",
    control_revision: 0,
    pending_approval: null,
    receipt: null,
    ...overrides,
  };
}

function requireRefreshKey(
  projection: ProjectHomeRefreshProjectionV01,
): string {
  const key = buildProjectHomeRefreshProjectionKeyV01(projection);
  assert(key, "refresh-worthy projection must produce a bounded key");
  return key;
}

assert.equal(new Set(assertions).size, assertions.length);
assert.deepEqual(assertions, [
  "live_codex_public_command_summary_redacts_credentials_and_absolute_paths",
  "live_codex_public_command_summary_preserves_safe_relative_commands",
  "retired_native_host_transport_modules_and_routes_are_absent",
  "production_graph_has_zero_manual_native_host_copy_or_result_paste_symbols",
  "product_shell_has_only_two_primary_zones_and_no_global_project_tools",
  "current_project_context_requires_explicit_management_destination",
  "management_safety_navigation_is_fixed_deterministic_and_non_authoritative",
  "management_and_safety_surfaces_use_contextual_human_hierarchy",
  "ai_workplane_replaces_active_agent_and_semantic_workbench_presentations",
  "ai_workplane_application_refreshes_exact_state_and_guide_once",
  "automatic_native_host_completion_has_one_complete_normalizer_and_receipt_authority",
  "packet_identity_is_absorbed_and_shared_inspector_is_read_only",
  "semantic_workbench_entry_source_and_state_are_consistent",
  "package_and_canonical_graph_have_no_retired_manual_aliases",
  "project_home_refresh_exact_projection_replay_is_idempotent",
  "project_home_refresh_distinguishes_repeated_approval_revisions_in_one_run",
  "project_home_refresh_terminal_and_paused_boundaries_refresh_once",
  "project_home_refresh_history_is_fifo_bounded",
  "static_refresh_resubmit_and_credential_safety_markers_present",
]);
process.stdout.write(
  `${JSON.stringify({
    status: "pass",
    contract_version: "vnext_operator_pure_contracts.v0.1",
    responsibility_execution_count: Object.fromEntries(
      assertions.map((responsibility) => [responsibility, 1]),
    ),
  })}\n`,
);

function record(assertion: string): void {
  assert.equal(assertions.includes(assertion), false, `duplicate assertion: ${assertion}`);
  assertions.push(assertion);
}
