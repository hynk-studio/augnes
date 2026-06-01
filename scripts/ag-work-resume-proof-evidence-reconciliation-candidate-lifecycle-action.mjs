import { readFileSync } from "node:fs";

const { applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction } =
  await import(
    "../lib/ag-work-resume-proof-evidence-reconciliation-candidate-lifecycle-action.ts"
  );

const HELPER_ID =
  "ag_work_resume_proof_evidence_reconciliation_candidate_lifecycle_action.v0_1";
const ENV_INPUT =
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_LIFECYCLE_ACTION_INPUT";
const knownFlags = new Set([
  "--json",
  "--help",
  "--file",
  "--candidate-id",
  "--action",
  "--reviewed-by",
  "--review-note",
  "--reviewed-at",
  "--replacement-candidate-id",
  "--superseded-by-candidate-id",
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
  console.log(`Usage: npm run ag:resume-proof-evidence-reconciliation-candidate-lifecycle-action -- [--json] [--file <path>]
       npm run ag:resume-proof-evidence-reconciliation-candidate-lifecycle-action -- --candidate-id <id> --action <accept_for_future_recording|reject|defer|withdraw|revoke|supersede> --reviewed-by <actor> --review-note <note> [--reviewed-at <iso>]
       npm run ag:resume-proof-evidence-reconciliation-candidate-lifecycle-action -- --candidate-id <id> --action supersede --reviewed-by <actor> --review-note <note> [--replacement-candidate-id <id>]

Applies an AG Resume proof/evidence reconciliation candidate lifecycle action to
an existing candidate. This helper updates candidate review metadata only.
accepted_for_future_recording is not proof/evidence recording. The helper does
not create proof/evidence records, bind sessions, execute Codex, create work
items/events, mutate imported context/confirmed mapping/proposal rows, approve,
publish, retry, replay, or merge.`);
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
      "Stop. Provide valid AG Resume reconciliation candidate lifecycle JSON or supported lifecycle flags.",
    error: parseResult.error,
  });
  console.error(`FAIL: valid_json: ${parseResult.error}`);
  process.exit(1);
}

const result =
  applyAgWorkResumeProofEvidenceReconciliationCandidateLifecycleAction(
    parseResult.value,
  );
const output = {
  ok: result.ok,
  helper: HELPER_ID,
  input_mode: inputResult.inputMode,
  result,
  recommended_next_step:
    "User/Core may review the candidate lifecycle result. It is candidate review metadata only; accepted_for_future_recording is not proof/evidence recording.",
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
  const envInput = clean(process.env[ENV_INPUT]);
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
      error: "Missing AG Resume reconciliation candidate lifecycle input",
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
      error: "Missing AG Resume reconciliation candidate lifecycle input",
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
      error: `AG Resume reconciliation candidate lifecycle JSON is invalid: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }

  if (!isRecord(value)) {
    return {
      error:
        "AG Resume reconciliation candidate lifecycle input must be a JSON object.",
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
      "Stop. Provide valid AG Resume reconciliation candidate lifecycle input.",
    error,
  });
  console.error(`FAIL: input: ${error}`);
  process.exit(exitCode);
}

function emitResultSummary(result) {
  if (result.ok) {
    console.error(`PASS: ${result.action}: ${result.candidate_id}`);
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
