#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const HOOK_EVENT_NAME = "UserPromptSubmit";
const DEFAULT_MAX_CONTEXT_CHARS = 12_000;
const MAX_CONTEXT_CHARS = readPositiveInteger(
  process.env.AUGNES_REUSE_HOOK_CONTEXT_MAX_CHARS,
  DEFAULT_MAX_CONTEXT_CHARS,
);
const INTAKE_TIMEOUT_MS = 25_000;
const TASK_PREVIEW_LIMIT = 2_400;
const FAILURE_PREVIEW_LIMIT = 800;

const OPT_OUT_PHRASES = [
  "no augnes memory",
  "skip augnes reuse",
  "skip memory intake",
  "do not run reuse intake",
];

const REUSE_BRIEF_MARKERS = [
  "Codex Augnes Reuse Context",
  "# Codex Memory Brief",
  "## Quality Review Warning Summary",
  "# Perspective Memory Reuse Intake v0",
];

const DEVELOPMENT_TASK_PATTERNS = [
  /\b(add|address|adjust|audit|build|change|check|create|debug|document|fix|implement|inspect|modify|patch|refactor|repair|review|run|smoke|test|triage|update|validate|verify|wire)\b/i,
  /\b(agents\.md|package\.json|\.codex|hook|script|docs?|reports?|smoke|typecheck|pr|branch|diff|commit|github|codex|augnes|perspective|memory|reuse|intake)\b/i,
  /(?:^|\s)(?:app|components|docs|lib|reports|scripts|\.codex|plugins)\//i,
];

main();
process.exit(0);

function main() {
  const input = readInputJson();
  if (!input || input.hook_event_name !== HOOK_EVENT_NAME) return;

  const prompt = typeof input.prompt === "string" ? input.prompt.trim() : "";
  if (!prompt) return;
  if (containsOptOut(prompt)) return;
  if (containsReuseBriefMarker(prompt)) return;
  if (!promptLooksLikeDevelopmentTask(prompt)) return;

  const repoRoot = findRepoRoot(
    typeof input.cwd === "string" && input.cwd.trim()
      ? input.cwd.trim()
      : process.cwd(),
  );
  if (!repoRoot || !appearsToBeAugnesRepo(repoRoot)) return;

  const intake = runReuseIntake(repoRoot, prompt);
  if (!intake.ok) {
    const context = buildFailureContext(prompt, intake.message);
    writeAdditionalContext(context);
    return;
  }

  const context = buildUsefulContext(prompt, intake.result);
  if (!context) return;
  writeAdditionalContext(limitContext(context, prompt, intake.result));
}

function readInputJson() {
  try {
    const raw = readFileSync(0, "utf8");
    if (!raw.trim()) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function findRepoRoot(startPath) {
  const startCwd = resolveExistingCwd(startPath);
  const gitRoot = resolveGitRepoRoot(startCwd);
  if (gitRoot && appearsToBeAugnesRepo(gitRoot)) return gitRoot;

  let current = startCwd;
  while (true) {
    if (appearsToBeAugnesRepo(current)) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function resolveExistingCwd(startPath) {
  const preferred = path.resolve(startPath || process.cwd());
  if (existsSync(preferred)) return preferred;
  return process.cwd();
}

function resolveGitRepoRoot(cwd) {
  try {
    const result = spawnSync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      encoding: "utf8",
      timeout: 3_000,
    });
    if (result.status !== 0) return "";
    return result.stdout.trim();
  } catch {
    return "";
  }
}

function appearsToBeAugnesRepo(repoRoot) {
  try {
    const packageJson = JSON.parse(
      readFileSync(path.join(repoRoot, "package.json"), "utf8"),
    );
    const hasPackageMarker = packageJson.name === "augnes";
    const hasIntakeCommand =
      typeof packageJson.scripts?.["perspective:memory-reuse-intake"] ===
      "string";
    const agentsText = safeRead(path.join(repoRoot, "AGENTS.md"));
    const hasInstructionMarker =
      agentsText.includes("Codex Operating Contract For Augnes") ||
      agentsText.includes("Codex Augnes Reuse Hook v0.1");
    const gitConfig = safeRead(path.join(repoRoot, ".git", "config"));
    const hasRepoMarker =
      gitConfig.includes("hynk-studio/augnes") ||
      gitConfig.includes("Aurna-code/augnes");
    return (
      hasPackageMarker &&
      hasIntakeCommand &&
      (hasInstructionMarker || hasRepoMarker)
    );
  } catch {
    return false;
  }
}

function containsOptOut(prompt) {
  const normalized = normalizePrompt(prompt);
  return OPT_OUT_PHRASES.some((phrase) => normalized.includes(phrase));
}

function containsReuseBriefMarker(prompt) {
  if (REUSE_BRIEF_MARKERS.some((marker) => prompt.includes(marker))) {
    return true;
  }
  return /memory_item_id:\s*perspective-memory-item:[\w:.-]+/i.test(prompt);
}

function promptLooksLikeDevelopmentTask(prompt) {
  const normalized = normalizePrompt(prompt);
  if (/^(hi|hello|hey|thanks|thank you|ok|okay|sounds good|what'?s up)[.!?\s]*$/i.test(normalized)) {
    return false;
  }
  if (/^(what time is it|what is the date|tell me a joke)[?!.]?\s*$/i.test(normalized)) {
    return false;
  }
  return DEVELOPMENT_TASK_PATTERNS.some((pattern) => pattern.test(prompt));
}

function runReuseIntake(repoRoot, prompt) {
  const env = { ...process.env };
  delete env.OPENAI_API_KEY;
  delete env.GITHUB_TOKEN;
  delete env.GH_TOKEN;

  const result = spawnSync(
    "npm",
    [
      "run",
      "--silent",
      "perspective:memory-reuse-intake",
      "--",
      "--task",
      prompt,
      "--json",
    ],
    {
      cwd: repoRoot,
      encoding: "utf8",
      env,
      timeout: INTAKE_TIMEOUT_MS,
      maxBuffer: 1024 * 1024 * 2,
    },
  );

  if (result.error) {
    return {
      ok: false,
      message: `Perspective Memory Reuse Intake failed open: ${result.error.message}`,
    };
  }
  if (result.status !== 0) {
    const detail = compactLine(result.stderr || result.stdout, FAILURE_PREVIEW_LIMIT);
    return {
      ok: false,
      message: `Perspective Memory Reuse Intake exited ${result.status}; Codex should continue without blocking.${detail ? ` Detail: ${detail}` : ""}`,
    };
  }
  try {
    return { ok: true, result: JSON.parse(result.stdout) };
  } catch {
    return {
      ok: false,
      message:
        "Perspective Memory Reuse Intake returned non-JSON output; Codex should continue without blocking.",
    };
  }
}

function buildUsefulContext(prompt, result) {
  const selectedItems = getSelectedItems(result);
  const warnings = collectWarnings(result);
  const noMatchMessage = result?.selection_guidance?.no_match_message;
  const brief =
    typeof result?.codex_memory_brief === "string"
      ? result.codex_memory_brief.trim()
      : "";

  if (
    selectedItems.length === 0 &&
    warnings.length === 0 &&
    !noMatchMessage &&
    !brief
  ) {
    return "";
  }

  return [
    "# Codex Augnes Reuse Context",
    "",
    "Injected by the project-local Codex UserPromptSubmit hook before implementation.",
    "Use this as task-start context before coding; it does not replace explicit operator review.",
    "",
    "## Task",
    prompt,
    "",
    "## Selected Memory IDs",
    ...formatSelectedMemoryIds(selectedItems),
    "",
    "## Generated Codex Memory Brief",
    brief || "- No Codex Memory Brief text was generated.",
    "",
    "## why_selected And reuse_boundary",
    ...formatWhySelectedAndReuseBoundary(selectedItems),
    "",
    "## quality_review_preview_summary",
    stringifyStable(result?.quality_review_preview_summary ?? {}),
    "",
    "## Warnings",
    ...formatBullets(warnings),
    "",
    "## No-Match Guidance",
    `no_match_state: ${result?.selection_guidance?.no_match_state ?? "not_applicable"}`,
    `no_match_message: ${noMatchMessage || "not_applicable"}`,
    "",
    "## Authority Boundary",
    stringifyStable(result?.authority_boundary ?? {}),
    "",
    "## Boundary Reminders",
    "- Preserve selected memory IDs, why_selected, and reuse_boundary when using this context.",
    "- Treat quality review warnings as operator-review signals, not semantic truth.",
    "- Do not add storage, persistence, DB schema, provider/model calls, OpenAI API calls, MCP tool calls, Codex SDK execution, GitHub mutation, proof/evidence writes, automatic memory creation, hidden background daemons, or Augnes state commit/reject authority unless explicitly scoped.",
    "",
    "## Closeout Expectations",
    "- Report changed files, verification, skipped checks with concrete reasons, and remaining friction.",
  ].join("\n");
}

function buildFailureContext(prompt, message) {
  return [
    "# Codex Augnes Reuse Context",
    "",
    "Perspective Memory Reuse Intake did not complete. The hook is fail-open, so continue the task without blocking.",
    "",
    "## Task",
    trimWithNote(prompt, TASK_PREVIEW_LIMIT),
    "",
    "## Warning",
    `- ${message}`,
    "",
    "## Boundary Reminders",
    "- Do not try to repair storage, persistence, DB schema, provider/model calls, OpenAI API calls, MCP tool calls, Codex SDK execution, GitHub mutation, or Augnes state authority unless the user explicitly scoped that work.",
    "- Report that task-start memory reuse was unavailable and explain the concrete reason.",
  ].join("\n");
}

function limitContext(context, prompt, result) {
  if (context.length <= MAX_CONTEXT_CHARS) return context;
  const compacted = buildCompactedContext(prompt, result);
  if (compacted.length <= MAX_CONTEXT_CHARS) return compacted;
  return compacted.slice(0, MAX_CONTEXT_CHARS - 120).trimEnd() +
    "\n\n[Hook compacted the injected context to stay within the configured character limit.]";
}

function buildCompactedContext(prompt, result) {
  const selectedItems = getSelectedItems(result);
  const warnings = collectWarnings(result);
  return [
    "# Codex Augnes Reuse Context",
    "",
    "Hook compacted the injected context because the generated intake brief exceeded the configured max character limit.",
    "Use this as task-start context before coding.",
    "",
    "## Task",
    trimWithNote(prompt, TASK_PREVIEW_LIMIT),
    "",
    "## Selected Memory IDs",
    ...formatSelectedMemoryIds(selectedItems),
    "",
    "## Preserved why_selected And reuse_boundary",
    ...formatWhySelectedAndReuseBoundary(selectedItems),
    "",
    "## quality_review_preview_summary",
    stringifyStable(result?.quality_review_preview_summary ?? {}),
    "",
    "## Quality Review Warning Summary",
    ...formatBullets(warnings),
    "",
    "## No-Match Guidance",
    `no_match_state: ${result?.selection_guidance?.no_match_state ?? "not_applicable"}`,
    `no_match_message: ${result?.selection_guidance?.no_match_message || "not_applicable"}`,
    "",
    "## Authority Boundary",
    stringifyStable(result?.authority_boundary ?? {}),
    "",
    "## Compaction Rule",
    "- Preserved selected memory IDs.",
    "- Preserved why_selected.",
    "- Preserved reuse_boundary.",
    "- Preserved quality review warning summary.",
    "- Preserved authority boundary.",
    "- Trimmed repeated summaries, long source refs, and repeated warnings first.",
    "",
    "## Closeout Expectations",
    "- Report changed files, verification, skipped checks with concrete reasons, and remaining friction.",
  ].join("\n");
}

function writeAdditionalContext(additionalContext) {
  if (!additionalContext.trim()) return;
  process.stdout.write(
    `${JSON.stringify(
      {
        continue: true,
        hookSpecificOutput: {
          hookEventName: HOOK_EVENT_NAME,
          additionalContext,
        },
      },
      null,
      2,
    )}\n`,
  );
}

function getSelectedItems(result) {
  if (Array.isArray(result?.suggested_memory_items)) {
    return result.suggested_memory_items;
  }
  if (Array.isArray(result?.reuse_packet?.selected_memory_items)) {
    return result.reuse_packet.selected_memory_items;
  }
  return [];
}

function formatSelectedMemoryIds(selectedItems) {
  if (selectedItems.length === 0) return ["- none selected"];
  return selectedItems.map((item) => {
    const id = item.memory_item_id ?? item.item_id ?? "unknown";
    const title = item.title ? ` - ${item.title}` : "";
    return `- ${id}${title}`;
  });
}

function formatWhySelectedAndReuseBoundary(selectedItems) {
  if (selectedItems.length === 0) {
    return ["- No selected memory items; use no-match guidance only."];
  }
  return selectedItems.flatMap((item, index) => [
    `${index + 1}. ${item.memory_item_id ?? item.item_id ?? "unknown"}`,
    `   - why_selected: ${item.why_selected || "missing"}`,
    `   - reuse_boundary: ${item.reuse_boundary || "missing"}`,
  ]);
}

function collectWarnings(result) {
  const warnings = [];
  if (Array.isArray(result?.warnings)) warnings.push(...result.warnings);
  if (Array.isArray(result?.quality_review_preview_summary?.warnings)) {
    warnings.push(...result.quality_review_preview_summary.warnings);
  }
  return [...new Set(warnings.filter((warning) => typeof warning === "string" && warning.trim()))];
}

function formatBullets(values) {
  if (!values.length) return ["- none"];
  return values.map((value) => `- ${value}`);
}

function stringifyStable(value) {
  return JSON.stringify(value, null, 2);
}

function normalizePrompt(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function safeRead(filePath) {
  try {
    return readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

function readPositiveInteger(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function compactLine(value, limit) {
  return trimWithNote(String(value || "").replace(/\s+/g, " ").trim(), limit);
}

function trimWithNote(value, limit) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 40).trimEnd()} [trimmed by Augnes reuse hook]`;
}
