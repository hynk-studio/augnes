import { readFileSync } from "node:fs";

const { createAgWorkResumeProofEvidenceRecordingFromCandidate } = await import(
  "../lib/ag-work-resume-proof-evidence-recording.ts"
);

const HELPER_ID = "ag_work_resume_proof_evidence_recording_create.v0_1";
const ENV_INPUT = "AG_WORK_RESUME_PROOF_EVIDENCE_RECORDING_CREATE_INPUT";
const jsonFlagFields = new Map([
  ["user_core_approval_json", "user_core_approval"],
  ["redaction_summary_json", "redaction_summary"],
]);
const knownFlags = new Set([
  "--json",
  "--help",
  "--file",
  "--candidate-id",
  "--import-id",
  "--mapping-id",
  "--user-core-approval-json",
  "--actor",
  "--reason",
  "--redaction-summary-json",
  "--trust-provenance-label",
  "--local-target-scope",
  "--local-target-work-id",
  "--expected-idempotency-key",
  "--now",
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
  console.log(`Usage: npm run ag:resume-proof-evidence-recording-create -- [--json] [--file <path>]
       npm run ag:resume-proof-evidence-recording-create -- --candidate-id <id> --user-core-approval-json <json-object> --actor <user/Core actor> --reason <reason> --redaction-summary-json <json-object> --trust-provenance-label foreign_summary_user_core_attested --local-target-scope <scope> --local-target-work-id <work_id>

Reads AG Resume proof/evidence recording JSON from ${ENV_INPUT}, --file,
flags, or stdin. On exact per-attempt user/Core approval it may create exactly
one verification_evidence_records row and one
ag_work_resume_proof_evidence_recording_links row in one local transaction.
It does not add routes, UI, action_records rows, session binding, Codex
execution or continuation, work item/event creation, source-row mutation,
approval, publish, retry, replay, merge, auto-merge, external posting, or
committed-state authority.`);
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
      "Stop. Provide valid AG Resume proof/evidence recording JSON or supported flags.",
    error: parseResult.error,
  });
  console.error(`FAIL: valid_json: ${parseResult.error}`);
  process.exit(1);
}

const result =
  createAgWorkResumeProofEvidenceRecordingFromCandidate(parseResult.value);
const output = {
  ok: result.ok,
  helper: HELPER_ID,
  input_mode: inputResult.inputMode,
  result,
  recommended_next_step:
    "Review the local evidence/bridge result. This helper grants no route/UI, action_records, session, Codex, work item/event, source-row mutation, approval, publish, retry, replay, merge, auto-merge, external posting, or committed-state authority.",
};

emitJson(output);
emitResultSummary(result);
process.exit(
  result.ok &&
    (result.result === "recorded" ||
      result.result === "idempotent_no_new_write")
    ? 0
    : 1,
);

function parseArgs(args) {
  const result = {
    help: false,
    filePath: null,
    flagInput: {},
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--json") continue;
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
      const parsedValue = parseFlagValue(key, value);
      if (parsedValue.error) return parsedValue;
      result.flagInput[parsedValue.key] = parsedValue.value;
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

function parseFlagValue(key, value) {
  const targetKey = jsonFlagFields.get(key);
  if (!targetKey) {
    return { key, value };
  }
  try {
    return { key: targetKey, value: JSON.parse(value) };
  } catch (error) {
    return {
      error: `--${key.replaceAll("_", "-")} must be valid JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

function readInput(args) {
  const envInput = clean(process.env[ENV_INPUT]);
  if (envInput) return { rawInput: envInput, inputMode: "env" };

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
      error: "Missing AG Resume proof/evidence recording input",
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
      error: "Missing AG Resume proof/evidence recording input",
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
      error: `AG Resume proof/evidence recording JSON is invalid: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }

  if (!isRecord(value)) {
    return {
      error: "AG Resume proof/evidence recording input must be a JSON object.",
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
      "Stop. Provide exact AG Resume proof/evidence recording input before retrying.",
    error,
  });
  console.error(`FAIL: input: ${error}`);
  process.exit(exitCode);
}

function emitResultSummary(result) {
  if (result.ok) {
    console.error(
      `PASS: ${result.result}: candidate=${result.candidate_id} evidence=${result.evidence_id} link=${result.recording_link_id}`,
    );
    return;
  }
  console.error(
    `FAIL: ${result.result}: ${result.failures.join("; ") || "unknown failure"}`,
  );
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
