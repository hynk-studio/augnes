import { pathToFileURL } from "node:url";
import { fetchStateBrief } from "./codex-read-brief.js";

const DEFAULT_API_BASE_URL = "http://localhost:3000";
const DEFAULT_SCOPE = "project:augnes";

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

function countBlock(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (typeof value === "object" && value !== null) return Object.keys(value).length;
  return 0;
}

function countRecentActions(brief: { recent_actions: unknown[] }): number {
  return brief.recent_actions.length;
}

function snapshotCounts(brief: {
  active_state: unknown;
  pending_proposals: unknown[];
  recent_actions: unknown[];
  open_tensions: unknown[];
}) {
  return {
    active_state: countBlock(brief.active_state),
    pending_proposals: brief.pending_proposals.length,
    recent_actions: brief.recent_actions.length,
    open_tensions: brief.open_tensions.length,
  };
}

function assertUnchangedCounts(
  before: ReturnType<typeof snapshotCounts>,
  after: ReturnType<typeof snapshotCounts>,
) {
  for (const key of Object.keys(before) as Array<keyof typeof before>) {
    if (before[key] !== after[key]) {
      throw new Error(
        `CODEX_HANDOFF_CHECK_NOT_READ_ONLY ${key} before=${before[key]} after=${after[key]}`,
      );
    }
  }
}

async function main() {
  const apiBaseUrl = resolveApiBaseUrl();
  const scope = resolveScope();

  const before = await fetchStateBrief(apiBaseUrl, scope);
  const after = await fetchStateBrief(apiBaseUrl, scope);

  const beforeRecentActions = countRecentActions(before);
  const afterRecentActions = countRecentActions(after);
  const beforeCounts = snapshotCounts(before);
  const afterCounts = snapshotCounts(after);
  assertUnchangedCounts(beforeCounts, afterCounts);

  console.log("Codex handoff check (read-only)");
  console.log(`scope: ${scope}`);
  console.log(`recent_actions before: ${beforeRecentActions}`);
  console.log(`recent_actions after: ${afterRecentActions}`);
  console.log(`state_counts before: ${JSON.stringify(beforeCounts)}`);
  console.log(`state_counts after: ${JSON.stringify(afterCounts)}`);
  console.log("No action result, evidence row, work event, or external.* state marker was recorded.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "CODEX_HANDOFF_CHECK_FAILED";
    console.error(message);
    process.exitCode = 1;
  });
}
