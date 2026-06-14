#!/usr/bin/env node
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const SCRIPT_NAME = "perspective-memory-reuse-intake";

let options;
try {
  options = parseArgs(process.argv.slice(2));
} catch (error) {
  console.error(
    `${SCRIPT_NAME}: ${error instanceof Error ? error.message : String(error)}`,
  );
  printUsage();
  process.exit(1);
}

if (options.help) {
  printUsage();
  process.exit(0);
}

if (!hasTaskInput(options)) {
  console.error(`${SCRIPT_NAME}: provide --task, --task-title, or --task-description.`);
  printUsage();
  process.exit(1);
}

const dbPath = resolveDbPath(options.dbPath);
if (options.dbPath) {
  process.env.AUGNES_DB_PATH = dbPath;
}

const intake = await import(
  "../lib/perspective-ingest/perspective-memory-reuse-intake.ts"
);

let result;
if (!existsSync(dbPath)) {
  result = intake.buildPerspectiveMemoryReuseIntake({
    task: options.task,
    taskTitle: options.taskTitle,
    taskDescription: options.taskDescription,
    limit: options.limit,
    items: [],
    extraWarnings: [
      `Perspective-memory DB not found at ${dbPath}; no store read was performed.`,
    ],
  });
} else {
  result = intake.buildPerspectiveMemoryReuseIntakeFromStore({
    task: options.task,
    taskTitle: options.taskTitle,
    taskDescription: options.taskDescription,
    limit: options.limit,
  });
}

if (options.json) {
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} else if (options.brief) {
  process.stdout.write(`${intake.formatPerspectiveMemoryReuseIntakeBrief(result)}\n`);
} else {
  process.stdout.write(`${intake.formatPerspectiveMemoryReuseIntakeHuman(result)}\n`);
}

function parseArgs(args) {
  const parsed = {
    help: false,
    task: "",
    taskTitle: "",
    taskDescription: "",
    limit: null,
    dbPath: "",
    json: false,
    brief: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
      continue;
    }
    if (arg === "--json") {
      parsed.json = true;
      continue;
    }
    if (arg === "--brief") {
      parsed.brief = true;
      continue;
    }
    if (arg === "--task") {
      parsed.task = readValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--task=")) {
      parsed.task = arg.slice("--task=".length);
      continue;
    }
    if (arg === "--task-title") {
      parsed.taskTitle = readValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--task-title=")) {
      parsed.taskTitle = arg.slice("--task-title=".length);
      continue;
    }
    if (arg === "--task-description") {
      parsed.taskDescription = readValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--task-description=")) {
      parsed.taskDescription = arg.slice("--task-description=".length);
      continue;
    }
    if (arg === "--limit") {
      parsed.limit = parseLimit(readValue(args, index, arg));
      index += 1;
      continue;
    }
    if (arg.startsWith("--limit=")) {
      parsed.limit = parseLimit(arg.slice("--limit=".length));
      continue;
    }
    if (arg === "--db-path") {
      parsed.dbPath = readValue(args, index, arg);
      index += 1;
      continue;
    }
    if (arg.startsWith("--db-path=")) {
      parsed.dbPath = arg.slice("--db-path=".length);
      continue;
    }
    throw new Error(`Unsupported argument: ${arg}`);
  }

  return parsed;
}

function readValue(args, index, label) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${label} requires a value`);
  }
  return value;
}

function parseLimit(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`--limit must be a positive number: ${value}`);
  }
  return parsed;
}

function hasTaskInput(parsed) {
  return Boolean(
    parsed.task.trim() ||
      parsed.taskTitle.trim() ||
      parsed.taskDescription.trim(),
  );
}

function resolveDbPath(dbPath) {
  const rawDbPath =
    dbPath || process.env.AUGNES_DB_PATH || path.join(process.cwd(), "data", "augnes.db");
  return path.resolve(rawDbPath);
}

function printUsage() {
  console.log(`${SCRIPT_NAME}`);
  console.log("");
  console.log("Usage:");
  console.log('  npm run perspective:memory-reuse-intake -- --task "..."');
  console.log(
    '  npm run perspective:memory-reuse-intake -- --task-title "..." --task-description "..." --limit 5 --brief',
  );
  console.log(
    '  npm run perspective:memory-reuse-intake -- --task "..." --db-path /tmp/augnes.db --json',
  );
  console.log("");
  console.log("Options:");
  console.log("  --task                Task title/description in one string.");
  console.log("  --task-title          Short task title.");
  console.log("  --task-description    Longer task description.");
  console.log("  --limit               Suggested item limit; default 5.");
  console.log("  --db-path             Explicit existing Augnes SQLite DB path.");
  console.log("  --json                Print full structured intake JSON.");
  console.log("  --brief               Print copyable Codex Memory Brief plus quality warnings.");
  console.log("");
  console.log("Read-only deterministic local preview. No providers, OpenAI API, MCP tools, Codex SDK, GitHub mutation, persistence writes, memory creation, DB schema changes, runtime startup, or Augnes state authority.");
}
