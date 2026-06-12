import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import validateOrchestration from "../lib/perspective-ingest/codex-former-local-adapter-validate-orchestration.ts";

const { buildCodexFormerLocalAdapterValidateDryRunSummary } =
  validateOrchestration;

const valueRequiredOptions = new Set([
  "source-input",
  "prepare-execution-summary",
  "returned-envelope",
  "validation-summary-out",
  "generated-at",
]);
const booleanOptions = new Set(["dry-run", "execute"]);

export function runLocalAdapterValidateOrchestrationCli(argv) {
  const options = parseOptions(argv);
  const dryRun = options["dry-run"] === true;
  const execute = options.execute === true;
  if (dryRun && execute) {
    throw new Error("validate orchestration cannot use --dry-run and --execute together");
  }
  if (execute) {
    throw new Error("validate orchestration --execute is not implemented in this dry-run slice");
  }
  if (!dryRun) {
    throw new Error("validate orchestration requires --dry-run for this slice");
  }
  return runDryRun(options);
}

function runDryRun(options) {
  for (const optionName of [
    "source-input",
    "prepare-execution-summary",
    "returned-envelope",
  ]) {
    if (!hasText(options[optionName])) {
      throw new Error(`validate dry-run requires --${optionName} <path>`);
    }
  }

  const sourceInputPath = String(options["source-input"]);
  const prepareExecutionSummaryPath = String(
    options["prepare-execution-summary"],
  );
  const returnedEnvelopePath = String(options["returned-envelope"]);
  const validationSummaryPath = hasText(options["validation-summary-out"])
    ? String(options["validation-summary-out"])
    : null;

  const sourceInputText = readLocalFile(
    resolve(sourceInputPath),
    "validate.source_input_path",
  );
  const prepareExecutionSummaryText = readLocalFile(
    resolve(prepareExecutionSummaryPath),
    "validate.prepare_execution_summary_path",
  );
  const returnedEnvelopeText = readLocalFile(
    resolve(returnedEnvelopePath),
    "validate.returned_envelope_path",
  );
  const promptArtifactText = readPromptArtifactIfAvailable(
    prepareExecutionSummaryText,
  );

  const result = buildCodexFormerLocalAdapterValidateDryRunSummary({
    generatedAt: hasText(options["generated-at"])
      ? String(options["generated-at"])
      : null,
    sourceInputPath,
    sourceInputText,
    prepareExecutionSummaryPath,
    prepareExecutionSummaryText,
    returnedEnvelopePath,
    returnedEnvelopeText,
    promptArtifactText,
  });

  if (validationSummaryPath) {
    writeTextFile(resolve(validationSummaryPath), result.summaryJson);
  }

  printDryRunSummary(result.summary, validationSummaryPath);
  return result;
}

function readPromptArtifactIfAvailable(prepareExecutionSummaryText) {
  try {
    const summary = JSON.parse(prepareExecutionSummaryText);
    const promptPath = summary?.helper_output_paths?.prompt_path;
    if (!hasText(promptPath)) return null;
    const resolved = resolve(String(promptPath));
    if (!existsSync(resolved) || statSync(resolved).isDirectory()) return null;
    return readFileSync(resolved, "utf8");
  } catch {
    return null;
  }
}

function parseOptions(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      throw new Error("unexpected positional argument");
    }
    const key = arg.slice(2);
    if (Object.prototype.hasOwnProperty.call(options, key)) {
      throw new Error(`duplicate option: --${key}`);
    }
    if (booleanOptions.has(key)) {
      const next = argv[index + 1];
      if (next && !next.startsWith("--")) {
        throw new Error(`option --${key} does not accept a value`);
      }
      options[key] = true;
      continue;
    }
    if (!valueRequiredOptions.has(key)) {
      throw new Error(`unknown option: --${key}`);
    }
    const next = argv[index + 1];
    if (!next || next.startsWith("--") || !hasText(next)) {
      throw new Error(`option --${key} requires a value`);
    }
    options[key] = next;
    index += 1;
  }
  return options;
}

function readLocalFile(path, label) {
  if (!existsSync(path)) {
    throw new Error(`${label} file does not exist: ${path}`);
  }
  if (statSync(path).isDirectory()) {
    throw new Error(`${label} path must not be a directory`);
  }
  return readFileSync(path, "utf8");
}

function writeTextFile(path, text) {
  if (existsSync(path) && statSync(path).isDirectory()) {
    throw new Error("validate.validation_summary_out must not point to a directory");
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, "utf8");
}

function printDryRunSummary(summary, validationSummaryPath) {
  console.log(`mode=${summary.mode}`);
  console.log(`source_input_path=${summary.source_input_path}`);
  console.log(
    `prepare_execution_summary_path=${summary.prepare_execution_summary_path}`,
  );
  console.log(`returned_envelope_path=${summary.returned_envelope_path}`);
  if (validationSummaryPath) {
    console.log(`validation_summary_path=${validationSummaryPath}`);
  }
  console.log(`dry_run_result=${summary.dry_run_result}`);
  console.log(`candidate_count=${summary.candidate_count}`);
  console.log(`candidate_shape_status=${summary.candidate_shape_status}`);
  console.log(
    `direct_validation_prerequisites_status=${summary.direct_validation_prerequisites_status}`,
  );
  console.log(
    `worker_facing_guidance_eligibility=${summary.worker_facing_guidance_eligibility}`,
  );
  console.log("validate_helper_executed=false");
  console.log("authority_boundary=review-only local-only non-authorizing");
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

if (import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    runLocalAdapterValidateOrchestrationCli(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
