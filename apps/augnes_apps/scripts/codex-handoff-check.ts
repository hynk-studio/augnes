import { pathToFileURL } from "node:url";
import { fetchStateBrief } from "./codex-read-brief.js";
import { recordActionResult, resolveRecordResultConfig } from "./codex-record-result.js";

const DEFAULT_API_BASE_URL = "http://localhost:3000";
const DEFAULT_SCOPE = "project:augnes";
const CHECK_ACTION_NAME = "codex_handoff_check";

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function resolveApiBaseUrl(): string {
  return trimTrailingSlash((process.env.AUGNES_API_BASE_URL ?? DEFAULT_API_BASE_URL).trim() || DEFAULT_API_BASE_URL);
}

function readDefaultedEnv(names: string[], fallback: string): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }

  return fallback;
}

function resolveScope(): string {
  return readDefaultedEnv(["CODEX_SCOPE", "AUGNES_SCOPE"], DEFAULT_SCOPE);
}

function countRecentActions(brief: { recent_actions: unknown[] }): number {
  return brief.recent_actions.length;
}

function briefMentionsAction(brief: unknown, actionName: string): boolean {
  return JSON.stringify(brief).includes(actionName);
}

async function main() {
  const apiBaseUrl = resolveApiBaseUrl();
  const scope = resolveScope();

  const before = await fetchStateBrief(apiBaseUrl, scope);
  const result = await recordActionResult(
    resolveRecordResultConfig({
      apiBaseUrl,
      scope,
      actionName: CHECK_ACTION_NAME,
      resultSummary: "Codex handoff check recorded a demo external action result through Augnes.",
      filesChanged: ["docs/CODEX_HANDOFF_DEMO.md"],
    })
  );
  const after = await fetchStateBrief(apiBaseUrl, scope);

  const beforeRecentActions = countRecentActions(before);
  const afterRecentActions = countRecentActions(after);
  const actionVisible = briefMentionsAction(after, CHECK_ACTION_NAME);

  console.log("Codex handoff check");
  console.log(`record_result: ${JSON.stringify(result)}`);
  console.log(`recent_actions before: ${beforeRecentActions}`);
  console.log(`recent_actions after: ${afterRecentActions}`);
  console.log(`recorded action visible in state brief: ${actionVisible ? "yes" : "not detected"}`);
  console.log("Manual confirmation: refresh http://localhost:3000 and check the Temporal State Graph.");
  console.log(`Expected transition label: external.${CHECK_ACTION_NAME}_recorded`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "CODEX_HANDOFF_CHECK_FAILED";
    console.error(message);
    process.exitCode = 1;
  });
}
