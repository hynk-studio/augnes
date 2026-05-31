import { readFileSync } from "node:fs";

const { createAgWorkResumeMappingProposalRecord } = await import(
  "../lib/ag-work-resume-mapping-proposal-record.ts"
);

const HELPER_ID = "ag_work_resume_mapping_proposal_record_create.v0_1";
const knownFlags = new Set(["--json", "--help", "--file"]);

const parsedArgs = parseArgs(process.argv.slice(2));
if (parsedArgs.error) {
  emitFailure({
    inputMode: "none",
    error: parsedArgs.error,
    exitCode: 2,
  });
}

if (parsedArgs.help) {
  console.log(`Usage: npm run ag:resume-mapping-proposal-record-create -- [--json] [--file <path>]

Reads combined AG Resume Mapping Proposal Record Create JSON from
AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_INPUT, --file, or stdin. Creates only a
Stage B proposal record in ag_work_resume_mapping_proposals after strict packet
preflight and generated mapping proposal preview.`);
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
      "Stop. Provide valid AG Resume Mapping Proposal Record Create JSON.",
    error: parseResult.error,
  });
  console.error(`FAIL: valid_json: ${parseResult.error}`);
  process.exit(1);
}

const result = createAgWorkResumeMappingProposalRecord(parseResult.value);
const output = {
  ok: result.ok,
  helper: HELPER_ID,
  input_mode: inputResult.inputMode,
  result,
  recommended_next_step:
    "User/Core should review the proposal record. It is not mapping confirmation, import authorization, proof/evidence authorization, session binding, Codex execution authority, or merge/publish authority.",
};

emitJson(output);
emitResultSummary(result);
process.exit(result.ok ? 0 : 1);

function parseArgs(args) {
  const result = {
    help: false,
    filePath: null,
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
    const equalsMatch = arg.match(/^--file=(.+)$/);
    if (equalsMatch) {
      const value = clean(equalsMatch[1]);
      if (!value) return { error: "--file requires a path" };
      result.filePath = value;
      continue;
    }
    if (arg.startsWith("--") && !knownFlags.has(arg)) {
      return { error: `Unknown flag: ${arg}` };
    }
    return { error: `Unexpected positional argument: ${arg}` };
  }

  return result;
}

function readInput(args) {
  const envInput = clean(process.env.AG_WORK_RESUME_MAPPING_PROPOSAL_RECORD_INPUT);
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

  if (process.stdin.isTTY) {
    return {
      error: "Missing AG Resume Mapping Proposal Record Create input",
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
      error: "Missing AG Resume Mapping Proposal Record Create input",
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
      error: `AG Resume Mapping Proposal Record Create JSON is invalid: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }

  if (!isRecord(value)) {
    return {
      error: "AG Resume Mapping Proposal Record Create input must be a JSON object.",
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
      "Stop. Provide valid AG Resume Mapping Proposal Record Create input.",
    error,
  });
  console.error(`FAIL: input: ${error}`);
  process.exit(exitCode);
}

function emitResultSummary(result) {
  if (result.ok) {
    console.error(`PASS: proposal_record_created: ${result.record.proposal_id}`);
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
