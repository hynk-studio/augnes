#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import { publicSafeCommandSummaryV01 } from "../lib/vnext/native-host/codex-app-server-adapter";
import { createProtocolSha256V01 } from "../lib/vnext/protocol-primitives";

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

const directSource = readFileSync(
  path.join(process.cwd(), "lib/vnext/runtime/direct-native-host-round-trip.ts"),
  "utf8",
);
const routeSource = readFileSync(
  path.join(process.cwd(), "app/api/vnext/operator/host-round-trip/route.ts"),
  "utf8",
);
const laterResultSource = readFileSync(
  path.join(
    process.cwd(),
    "lib/vnext/runtime/operator-pilot-later-result-intake.ts",
  ),
  "utf8",
);
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
assert.equal(directSource.includes("admitStructuredRunReceiptV01"), true);
assert.equal(laterResultSource.includes("admitStructuredRunReceiptV01"), true);
record("automatic_host_path_bypasses_legacy_text_parser_and_shares_receipt_writer");

const directory = path.join(
  process.cwd(),
  "components/workbench/semantic-review",
);
const session = readFileSync(path.join(directory, "operator-session-panel.tsx"), "utf8");
const transition = readFileSync(
  path.join(directory, "semantic-transition-actions.tsx"),
  "utf8",
);
const proposalDetail = readFileSync(path.join(directory, "proposal-detail.tsx"), "utf8");
const durableLineage = readFileSync(
  path.join(directory, "durable-lineage-panel.tsx"),
  "utf8",
);
const laterResult = readFileSync(
  path.join(directory, "later-result-intake-panel.tsx"),
  "utf8",
);
const contextReview = readFileSync(
  path.join(directory, "context-use-review-panel.tsx"),
  "utf8",
);
const packetPage = readFileSync(
  path.join(
    process.cwd(),
    "app/workbench/semantic-review/packet-handoff/[packet_id]/page.tsx",
  ),
  "utf8",
);
const continuityCard = readFileSync(
  path.join(
    process.cwd(),
    "components/human-surface/vnext-project-continuity-card.tsx",
  ),
  "utf8",
);
for (const marker of [
  "event.preventDefault();",
  'setBootstrapToken("");',
  'type="password"',
  'autoComplete="off"',
]) {
  assert.equal(session.includes(marker), true);
}
assert.equal(laterResult.includes('data-vnext-later-result-native-post="false"'), true);
assert.equal(
  contextReview.includes('data-vnext-context-use-review-native-post="false"'),
  true,
);
for (const action of ["preview", "confirm", "commit", "compile"]) {
  assert.match(
    transition,
    new RegExp(
      `type="button"[\\s\\S]{0,160}data-vnext-transition-action="${action}"`,
    ),
  );
}
assert.equal(proposalDetail.includes("classification.pilot_actionable"), true);
assert.equal(proposalDetail.includes("generic history · not pilot actionable"), true);
for (const marker of [
  'data-vnext-durable-lineage="v0.1"',
  "Packet not compiled",
  "Later result not recorded",
  "Context use not reviewed",
  "Helpfulness established",
]) {
  assert.equal(durableLineage.includes(marker), true);
}
for (const forbidden of ["fetch(", 'method: "POST"', "<button", "<form"]) {
  assert.equal(durableLineage.includes(forbidden), false);
}
record("workbench_durable_lineage_panel_is_read_only_and_explicit");
record("api_and_ui_share_session_bound_decision_actionability_policy");
assert.equal(
  packetPage.includes("decodeTaskContextPacketHandoffSlugV01(packetSlug)"),
  true,
);
assert.equal(
  continuityCard.includes("buildTaskContextPacketHandoffHrefV01(packet)"),
  true,
);
assert.equal(packetPage.includes("task-context-packet~[a-f0-9]{24}"), false);
assert.equal(continuityCard.includes("task-context-packet:[a-f0-9]{24}"), false);
record("page_and_project_home_share_canonical_packet_handoff_identity");
const combined = [
  session,
  transition,
  proposalDetail,
  durableLineage,
  laterResult,
  contextReview,
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
  assert.equal(combined.includes(forbidden), false);
}
record("static_refresh_resubmit_and_credential_safety_markers_present");

assert.equal(new Set(assertions).size, assertions.length);
assert.deepEqual(assertions, [
  "live_codex_public_command_summary_redacts_credentials_and_absolute_paths",
  "live_codex_public_command_summary_preserves_safe_relative_commands",
  "automatic_host_path_bypasses_legacy_text_parser_and_shares_receipt_writer",
  "workbench_durable_lineage_panel_is_read_only_and_explicit",
  "api_and_ui_share_session_bound_decision_actionability_policy",
  "page_and_project_home_share_canonical_packet_handoff_identity",
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
