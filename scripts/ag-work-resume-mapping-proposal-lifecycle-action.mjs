import { readFileSync } from "node:fs";

const { applyAgWorkResumeMappingProposalLifecycleAction } = await import(
  "../lib/ag-work-resume-mapping-proposal-lifecycle-action.ts"
);

const HELPER_ID = "ag_work_resume_mapping_proposal_lifecycle_action.v0_1";
const knownFlags = new Set([
  "--json",
  "--help",
  "--file",
  "--proposal-id",
  "--action",
  "--reviewed-by",
  "--review-note",
  "--reviewed-at",
  "--replacement-proposal-id",
  "--superseded-by-proposal-id",
]);

const parsedArgs = parseArgs(process.argv.slice(2));
if (parsedArgs.error) {
  emitFailure({
    inputMode: "none",
    error: parsedArgs.error,
    exitCode: 2,
  });
}

if (parsedArgs.help) {
  console.log(`Usage: npm run ag:resume-mapping-proposal-lifecycle-action -- [--json] [--file <path>]
       npm run ag:resume-mapping-proposal-lifecycle-action -- --proposal-id <id> --action <withdraw|reject|supersede|expire> --reviewed-by <actor> --review-note <note> [--reviewed-at <iso>]
       npm run ag:resume-mapping-proposal-lifecycle-action -- --proposal-id <id> --action supersede --reviewed-by <actor> --review-note <note> [--replacement-proposal-id <id>]

Applies an AG Resume mapping proposal lifecycle action to an existing proposal
record. This helper updates proposal review metadata only. It does not create
proposal rows, confirm mappings, import context, record proof/evidence, bind
sessions, execute Codex, publish, retry, replay, or merge.`);
  process.exit(0);
}

const inputResult = readInput(parsedArgs);
if (inputResult.error) {
  emitFailure({
    inputMode: inputResult.inputMode ?? "none",
    error: inputResult.error,
    exitCode: inputResult.exitCode ?? 2,
  });
}

const parseResult = parseInput(inputResult.rawInput);
if (parseResult.error) {
  emitJson({
    ok: false,
    helper: HELPER_ID,
    input_mode: inputResult.inputMode,
    result: null,
    recommended_next_step:
      "Stop. Provide valid AG Resume Mapping Proposal Lifecycle Action JSON or supported lifecycle flags.",
    error: parseResult.error,
  });
  console.error(`FAIL: valid_json: ${parseResult.error}`);
  process.exit(1);
}

const result = applyAgWorkResumeMappingProposalLifecycleAction(parseResult.value);
const output = {
  ok: result.ok,
  helper: HELPER_ID,
  input_mode: inputResult.inputMode,
  result,
  recommended_next_step:
    "User/Core may review the lifecycle result. It is proposal review metadata only, not mapping confirmation, import authorization, proof/evidence authorization, session binding, Codex execution authority, or merge/publish authority.",
};

emitJson(output);
emitResultSummary(result);
process.exit(result.ok ? 0 : 1);

function parseArgs(args) {
  const result = {
    help: false,
    filePath: null,
    flagInput: {},
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") {
      continue;
    }
    if (arg === "--help") {
      result.help = true;
      continue;
    }
    if (arg === "--file") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        return { error: "--file requires a path" };
      }
      result.filePath = value;
      index += 1;
      continue;
    }
    const fileEqualsMatch = arg.match(/^--file=(.+)$/);
    if (fileEqualsMatch) {
      const value = clean(fileEqualsMatch[1]);
      if (!value) return { error: "--file requires a path" };
      result.filePath = value;
      continue;
    }
    const flagMatch = arg.match(/^--([a-z-]+)(?:=(.+))?$/);
    if (flagMatch && knownFlags.has(`--${flagMatch[1]}`)) {
      const key = flagMatch[1].replaceAll("-", "_");
      const value =
        flagMatch[2] !== undefined ? flagMatch[2] : args[index + 1];
      if (!value || value.startsWith("--")) {
        return { error: `--${flagMatch[1]} requires a value` };
      }
      result.flagInput[key] = value;
      if (flagMatch[2] === undefined) index += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      return { error: `Unknown flag: ${arg}` };
    }
    return { error: `Unexpected positional argument: ${arg}` };
  }

  return result;
}

function readInput(args) {
  const envInput = clean(
    process.env.AG_WORK_RESUME_MAPPING_PROPOSAL_LIFECYCLE_ACTION_INPUT,
  );
  if (envInput) {
    return { rawInput: envInput, inputMode: "env" };
  }

  if (args.filePath) {
    try {
      return { rawInput: readFileSync(args.filePath, "utf8"), inputMode: "file" };
    } catch (error) {
      return {
        error: `Unable to read --file path: ${
          error instanceof Error ? error.message : String(error)
        }`,
        exitCode: 2,
        inputMode: "file",
      };
    }
  }

  if (Object.keys(args.flagInput).length > 0) {
    return { rawInput: JSON.stringify(args.flagInput), inputMode: "flags" };
  }

  if (process.stdin.isTTY) {
    return {
      error: "Missing AG Resume Mapping Proposal Lifecycle Action input",
      exitCode: 2,
      inputMode: "none",
    };
  }

  let stdinText = "";
  try {
    stdinText = readFileSync(0, "utf8");
  } catch (error) {
    return {
      error: `Unable to read stdin: ${
        error instanceof Error ? error.message : String(error)
      }`,
      exitCode: 2,
      inputMode: "stdin",
    };
  }

  if (!clean(stdinText)) {
    return {
      error: "Missing AG Resume Mapping Proposal Lifecycle Action input",
      exitCode: 2,
      inputMode: "stdin",
    };
  }

  return { rawInput: stdinText, inputMode: "stdin" };
}

function parseInput(rawInput) {
  let value;
  try {
    value = JSON.parse(rawInput);
  } catch (error) {
    return {
      error: `AG Resume Mapping Proposal Lifecycle Action JSON is invalid: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }

  if (!isRecord(value)) {
    return {
      error:
        "AG Resume Mapping Proposal Lifecycle Action input must be a JSON object.",
    };
  }

  return { value };
}

function emitFailure({ inputMode, error, exitCode }) {
  emitJson({
    ok: false,
    helper: HELPER_ID,
    input_mode: inputMode,
    result: null,
    recommended_next_step:
      "Stop. Provide valid AG Resume Mapping Proposal Lifecycle Action input.",
    error,
  });
  console.error(`FAIL: input: ${error}`);
  process.exit(exitCode);
}

function emitResultSummary(result) {
  if (result.ok) {
    console.error(`PASS: ${result.action}: ${result.proposal_id}`);
    return;
  }
  const failures = result.failures?.length ? result.failures : [result.status];
  for (const failure of failures) {
    console.error(`FAIL: ${result.status}: ${failure}`);
  }
}

function emitJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function clean(value) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
