import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";

const templatePath = "docs/templates/dogfood-ai-surface-episode.md";
const outputDir = "reports/dogfood";

const argSpec = new Map([
  ["--run-id", "run_id"],
  ["--title", "title"],
  ["--work-id", "work_id"],
  ["--handoff-id", "handoff_id"],
  ["--session-id", "session_id"],
  ["--pr", "pr"],
  ["--outcome", "outcome"],
]);

const envValues = {
  run_id: process.env.DOGFOOD_RUN_ID ?? "",
  title: process.env.DOGFOOD_TITLE ?? "",
  work_id: process.env.DOGFOOD_WORK_ID ?? "",
  handoff_id: process.env.DOGFOOD_HANDOFF_ID ?? "",
  session_id: process.env.DOGFOOD_SESSION_ID ?? "",
  pr: process.env.DOGFOOD_PR ?? "",
  outcome: process.env.DOGFOOD_OUTCOME ?? "",
};

try {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    printHelp();
    process.exit(0);
  }

  const values = { ...envValues, ...parsed.values };
  const hasExplicitRunId = values.run_id.trim() !== "";
  values.title = values.title || "Untitled dogfood AI surface episode";
  values.outcome = values.outcome || "pending";

  if (hasExplicitRunId) {
    rejectPathLikeRunId(values.run_id);
  }

  const today = new Date().toISOString().slice(0, 10);
  const slug = slugify(hasExplicitRunId ? values.run_id : values.title);
  if (!slug) {
    throw new Error("DOGFOOD_RUN_ID or DOGFOOD_TITLE must contain at least one filename-safe character");
  }

  const outputPath = path.join(outputDir, `${today}-${slug}.md`);
  assertRelativeOutputPath(outputPath);
  assertUnderOutputDir(outputPath);

  const template = readFileSync(templatePath, "utf8");
  const content = fillTemplate(template, { ...values, date: today });
  const result = {
    ok: true,
    dry_run: parsed.dryRun,
    output_path: outputPath,
    run_id: values.run_id,
    title: values.title,
    work_id: values.work_id,
    handoff_id: values.handoff_id,
    session_id: values.session_id,
    pr: values.pr,
    outcome: values.outcome,
  };

  if (!parsed.dryRun) {
    mkdirSync(outputDir, { recursive: true });
    writeFileSync(outputPath, content, { flag: "wx" });
  }

  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exit(1);
}

function parseArgs(args) {
  const values = {};
  let dryRun = false;
  let help = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (arg === "--help") {
      help = true;
      continue;
    }
    if (!argSpec.has(arg)) {
      throw new Error(`Unknown argument: ${arg}`);
    }
    const value = args[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }
    values[argSpec.get(arg)] = value;
    index += 1;
  }

  return { dryRun, help, values };
}

function printHelp() {
  console.log(`Usage: node scripts/create-dogfood-episode.mjs [options]

Creates a local Markdown dogfood episode under reports/dogfood/.

Options:
  --run-id <value>      Run identifier used for metadata and filename slug
  --title <value>       Episode title
  --work-id <value>     Augnes work ID trace anchor
  --handoff-id <value>  Handoff ID trace anchor
  --session-id <value>  Session ID trace anchor
  --pr <value>          Related PR number or URL
  --outcome <value>     Episode outcome
  --dry-run             Print JSON plan without writing a file
  --help                Show this help

Environment variables:
  DOGFOOD_RUN_ID DOGFOOD_TITLE DOGFOOD_WORK_ID DOGFOOD_HANDOFF_ID
  DOGFOOD_SESSION_ID DOGFOOD_PR DOGFOOD_OUTCOME
`);
}

function rejectPathLikeRunId(value) {
  if (path.isAbsolute(value) || value.includes("/") || value.includes("\\") || value.split(/[\\/]+/).includes("..")) {
    throw new Error("DOGFOOD_RUN_ID/--run-id must not be an absolute path or contain path separators");
  }
  if (value.includes("..")) {
    throw new Error("DOGFOOD_RUN_ID/--run-id must not contain path traversal segments");
  }
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/[\s_.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function assertRelativeOutputPath(outputPath) {
  if (path.isAbsolute(outputPath)) {
    throw new Error("Output path must be relative");
  }
}

function assertUnderOutputDir(outputPath) {
  const root = realpathOrResolve(outputDir);
  const target = path.resolve(outputPath);
  if (!target.startsWith(`${root}${path.sep}`)) {
    throw new Error("Output path must stay under reports/dogfood/");
  }
}

function realpathOrResolve(value) {
  return existsSync(value) ? realpathSync(value) : path.resolve(value);
}

function fillTemplate(template, values) {
  const replacements = {
    DOGFOOD_RUN_ID: values.run_id,
    DOGFOOD_TITLE: values.title,
    DOGFOOD_WORK_ID: values.work_id,
    DOGFOOD_HANDOFF_ID: values.handoff_id,
    DOGFOOD_SESSION_ID: values.session_id,
    DOGFOOD_PR: values.pr,
    DOGFOOD_OUTCOME: values.outcome,
    DOGFOOD_DATE: values.date,
  };

  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_match, key) => replacements[key] ?? "");
}
