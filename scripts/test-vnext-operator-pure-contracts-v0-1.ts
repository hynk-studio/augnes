#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  semanticReviewDetailEntryPresentationV01,
  type SemanticReviewEntryPresentationInputV01,
} from "../components/workbench/semantic-review/semantic-review-entry-presentation";
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
const lineagePanel = source(
  "components/workbench/semantic-review/durable-lineage-panel.tsx",
);
assert.equal(taskContextSource.includes("isTaskContextPacketIdV01"), true);
assert.equal(taskContextSource.includes("TASK_CONTEXT_PACKET_ID_HEX_LENGTH_V01"), true);
assert.equal(lineageSource.includes("packet_compiled"), true);
assert.equal(lineageSource.includes("later_result"), false);
assert.equal(lineageSource.includes("context_use_review"), false);
assert.equal(lineagePanel.includes("Open exact packet handoff"), false);
assert.equal(lineagePanel.includes("fetch("), false);
assert.equal(lineagePanel.includes("<form"), false);
record("packet_identity_is_absorbed_and_workbench_lineage_is_read_only");

assert.equal(
  semanticReviewDetailEntryPresentationV01(
    semanticReviewEntryRead({ decision_count: 0 }),
  ).state,
  "pending_proposal",
);
assert.equal(
  semanticReviewDetailEntryPresentationV01(
    semanticReviewEntryRead({
      decisions: [
        semanticReviewDecision("candidate:a", "defer", {
          revisit_at: "2026-07-20T10:00:00Z",
        }),
      ],
      projection_observed_at: "2026-07-20T19:00:00+09:00",
    }),
  ).state,
  "pending_proposal",
);
const partiallyAppliedDecision = semanticReviewDecision("candidate:a", "accept");
assert.equal(
  semanticReviewDetailEntryPresentationV01(
    semanticReviewEntryRead({
      candidates: ["candidate:a", "candidate:b"],
      decisions: [partiallyAppliedDecision],
      chain: semanticReviewChain("packet_compiled", partiallyAppliedDecision, {
        packet_id: "task-context-packet:partial",
        packet_fingerprint: "packet-fingerprint:partial",
      }),
    }),
  ).state,
  "pending_proposal",
);
const awaitingSecondTransition = semanticReviewDecision("candidate:b", "accept");
assert.deepEqual(
  semanticReviewDetailEntryPresentationV01(
    semanticReviewEntryRead({
      candidates: ["candidate:a", "candidate:b"],
      decisions: [partiallyAppliedDecision, awaitingSecondTransition],
      chain: semanticReviewChain("packet_compiled", partiallyAppliedDecision, {
        packet_id: "task-context-packet:partial",
        packet_fingerprint: "packet-fingerprint:partial",
      }),
    }),
  ),
  {
    state: "decided_proposal",
    label: "Decision recorded · another Transition remains",
  },
);
assert.equal(
  semanticReviewDetailEntryPresentationV01(
    semanticReviewEntryRead({
      candidates: ["candidate:a", "candidate:b"],
      decisions: [partiallyAppliedDecision, awaitingSecondTransition],
      blocked_candidates: ["candidate:b"],
      chain: semanticReviewChain("packet_compiled", partiallyAppliedDecision, {
        packet_id: "task-context-packet:partial",
        packet_fingerprint: "packet-fingerprint:partial",
      }),
    }),
  ).state,
  "transition_blocked",
);
assert.equal(
  semanticReviewDetailEntryPresentationV01(
    semanticReviewEntryRead({ decision_count: 1 }),
  ).state,
  "decided_proposal",
);
assert.equal(
  semanticReviewDetailEntryPresentationV01(
    semanticReviewEntryRead({
      candidates: ["candidate:a", "candidate:b"],
      decisions: [semanticReviewDecision("candidate:a", "accept")],
    }),
  ).state,
  "pending_proposal",
);
const acceptedDecision = semanticReviewDecision("candidate:a", "accept");
assert.equal(
  semanticReviewDetailEntryPresentationV01(
    semanticReviewEntryRead({
      decisions: [
        acceptedDecision,
        semanticReviewDecision("candidate:a", "retract", {
          prior: acceptedDecision,
          decided_at: "2026-07-19T10:01:00.000Z",
        }),
      ],
    }),
  ).state,
  "pending_proposal",
);
const deferredDecision = semanticReviewDecision("candidate:a", "defer", {
  revisit_at: "2026-07-20T10:00:00.000Z",
});
assert.equal(
  semanticReviewDetailEntryPresentationV01(
    semanticReviewEntryRead({ decisions: [deferredDecision] }),
  ).state,
  "decided_proposal",
);
assert.equal(
  semanticReviewDetailEntryPresentationV01(
    semanticReviewEntryRead({
      decisions: [deferredDecision],
      projection_observed_at: "2026-07-20T10:00:00.000Z",
    }),
  ).state,
  "pending_proposal",
);
assert.deepEqual(
  semanticReviewDetailEntryPresentationV01(
    semanticReviewEntryRead({
      decision_count: 1,
      chain: semanticReviewChain(
        "applied_awaiting_packet",
        semanticReviewDecision("candidate:a", "accept"),
        null,
      ),
      receipt: semanticReviewLaterReceipt("task-context-packet:prior", "packet-fingerprint:prior"),
      review: semanticReviewLaterReview("later-receipt:prior", "later-receipt-fingerprint:prior"),
    }),
  ),
  {
    state: "transition_applied",
    label: "Transition applied · later packet pending",
  },
);
const exactPacket = {
  packet_id: "task-context-packet:current",
  packet_fingerprint: "packet-fingerprint:current",
};
const exactReceipt = semanticReviewLaterReceipt(
  exactPacket.packet_id,
  exactPacket.packet_fingerprint,
);
const compiledWithoutReview = semanticReviewEntryRead({
  decision_count: 1,
  chain: semanticReviewChain(
    "packet_compiled",
    semanticReviewDecision("candidate:a", "accept"),
    exactPacket,
  ),
  receipt: exactReceipt,
});
assert.deepEqual(
  semanticReviewDetailEntryPresentationV01(
    semanticReviewEntryRead({
      decision_count: 1,
      chain: semanticReviewChain(
        "packet_compiled",
        semanticReviewDecision("candidate:a", "accept"),
        exactPacket,
      ),
    }),
  ),
  {
    state: "transition_applied",
    label: "Transition applied · later packet compiled",
  },
);
assert.equal(
  semanticReviewDetailEntryPresentationV01(compiledWithoutReview).state,
  "feedback_needed",
);
assert.equal(
  semanticReviewDetailEntryPresentationV01(
    semanticReviewEntryRead({
      decision_count: 1,
      chain: semanticReviewChain(
        "packet_compiled",
        semanticReviewDecision("candidate:a", "accept"),
        exactPacket,
      ),
      receipt: exactReceipt,
      review: semanticReviewLaterReview(
        exactReceipt.receipt_id,
        "later-receipt-fingerprint:mismatch",
      ),
    }),
  ).state,
  "feedback_needed",
);
assert.deepEqual(
  semanticReviewDetailEntryPresentationV01(
    semanticReviewEntryRead({
      decision_count: 1,
      chain: semanticReviewChain(
        "packet_compiled",
        semanticReviewDecision("candidate:a", "accept"),
        exactPacket,
      ),
      receipt: exactReceipt,
      review: semanticReviewLaterReview(
        exactReceipt.receipt_id,
        exactReceipt.receipt_fingerprint,
      ),
    }),
  ),
  { state: "transition_applied", label: "Later-context feedback recorded" },
);
record("semantic_workbench_entry_requires_exact_proposal_packet_feedback_lineage");

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
  lineagePanel,
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

function semanticReviewEntryRead(
  input: {
    decision_count?: number;
    projection_observed_at?: string;
    candidates?: string[];
    decisions?: SemanticReviewEntryPresentationInputV01["decisions"];
    blocked_candidates?: string[];
    chain?: SemanticReviewEntryPresentationInputV01["durable_lineage"]["chains"][number] | null;
    receipt?: SemanticReviewEntryPresentationInputV01["project_continuity"]["latest_context_use_receipt"];
    review?: SemanticReviewEntryPresentationInputV01["project_continuity"]["latest_context_use_review_status"];
    durable_lineage?: SemanticReviewEntryPresentationInputV01["durable_lineage"];
    project_continuity?: SemanticReviewEntryPresentationInputV01["project_continuity"];
  } = {},
): SemanticReviewEntryPresentationInputV01 {
  const candidates = input.candidates ?? ["candidate:a"];
  return {
    projection_observed_at:
      input.projection_observed_at ?? "2026-07-19T10:00:00.000Z",
    proposal: {
      proposed_deltas: candidates.map((candidate_id) => ({ candidate_id })),
    },
    decisions:
      input.decisions ??
      (input.decision_count
        ? [semanticReviewDecision(candidates[0]!, "accept")]
        : []),
    candidate_admissions: candidates.map((candidate_id) => ({
      candidate_id,
      decision_allowed: {
        accept: !(input.blocked_candidates ?? []).includes(candidate_id),
      },
      blocking_reasons: (input.blocked_candidates ?? []).includes(candidate_id)
        ? ["current_state_drifted"]
        : [],
    })),
    durable_lineage:
      input.durable_lineage ?? {
        chains: input.chain ? [input.chain] : [],
      },
    project_continuity:
      input.project_continuity ?? {
        latest_context_use_receipt: input.receipt ?? null,
        latest_context_use_review_status: input.review ?? null,
      },
  };
}

function semanticReviewDecision(
  candidateId: string,
  decision: SemanticReviewEntryPresentationInputV01["decisions"][number]["decision"],
  options: {
    prior?: SemanticReviewEntryPresentationInputV01["decisions"][number];
    decided_at?: string;
    revisit_at?: string | null;
    expires_at?: string | null;
  } = {},
): SemanticReviewEntryPresentationInputV01["decisions"][number] {
  const decisionId = `review-decision:${candidateId}:${decision}:${options.decided_at ?? "base"}`;
  return {
    decision_id: decisionId,
    decision,
    decided_at: options.decided_at ?? "2026-07-19T09:00:00.000Z",
    candidate: { candidate_id: candidateId },
    revisit:
      decision === "defer"
        ? {
            revisit_at: options.revisit_at ?? null,
            expires_at: options.expires_at ?? null,
          }
        : null,
    lineage: {
      prior_decisions: options.prior
        ? [
            {
              decision_id: options.prior.decision_id,
              decision_fingerprint: options.prior.integrity.fingerprint,
            },
          ]
        : [],
    },
    integrity: { fingerprint: `fingerprint:${decisionId}` },
  };
}

function semanticReviewChain(
  stageStatus: SemanticReviewEntryPresentationInputV01["durable_lineage"]["chains"][number]["stage_status"],
  decision: SemanticReviewEntryPresentationInputV01["decisions"][number],
  packet: SemanticReviewEntryPresentationInputV01["durable_lineage"]["chains"][number]["compiled_packet"],
): SemanticReviewEntryPresentationInputV01["durable_lineage"]["chains"][number] {
  return {
    stage_status: stageStatus,
    transition: {
      candidate_id: decision.candidate.candidate_id,
      decision_id: decision.decision_id,
      decision_fingerprint: decision.integrity.fingerprint,
    },
    compiled_packet: packet,
  };
}

function semanticReviewLaterReceipt(
  packetId: string,
  packetFingerprint: string,
): NonNullable<
  SemanticReviewEntryPresentationInputV01["project_continuity"]["latest_context_use_receipt"]
> {
  return {
    receipt_id: "later-receipt:current",
    receipt_fingerprint: "later-receipt-fingerprint:current",
    task_context_packet_id: packetId,
    task_context_packet_fingerprint: packetFingerprint,
  };
}

function semanticReviewLaterReview(
  receiptId: string,
  receiptFingerprint: string,
): NonNullable<
  SemanticReviewEntryPresentationInputV01["project_continuity"]["latest_context_use_review_status"]
> {
  return {
    later_task_run_receipt_id: receiptId,
    later_task_run_receipt_fingerprint: receiptFingerprint,
  };
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
  "automatic_native_host_completion_has_one_complete_normalizer_and_receipt_authority",
  "packet_identity_is_absorbed_and_workbench_lineage_is_read_only",
  "semantic_workbench_entry_requires_exact_proposal_packet_feedback_lineage",
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
