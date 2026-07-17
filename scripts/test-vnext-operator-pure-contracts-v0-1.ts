#!/usr/bin/env node

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
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
  "lib/vnext/runtime/operator-pilot-context-use-review.ts",
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

assert.equal(new Set(assertions).size, assertions.length);
assert.deepEqual(assertions, [
  "live_codex_public_command_summary_redacts_credentials_and_absolute_paths",
  "live_codex_public_command_summary_preserves_safe_relative_commands",
  "retired_native_host_transport_modules_and_routes_are_absent",
  "production_graph_has_zero_manual_native_host_copy_or_result_paste_symbols",
  "automatic_native_host_completion_has_one_complete_normalizer_and_receipt_authority",
  "packet_identity_is_absorbed_and_workbench_lineage_is_read_only",
  "package_and_canonical_graph_have_no_retired_manual_aliases",
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
