import { readFileSync } from "node:fs";

const { readAgWorkResumeProofEvidenceReconciliationCandidates } = await import(
  "../lib/ag-work-resume-proof-evidence-reconciliation-candidate-read.ts"
);

const HELPER_ID =
  "ag_work_resume_proof_evidence_reconciliation_candidate_read.v0_1";
const ENV_INPUT =
  "AG_WORK_RESUME_PROOF_EVIDENCE_RECONCILIATION_CANDIDATE_READ_INPUT";
const knownFlags = new Set([
  "--json",
  "--help",
  "--file",
  "--candidate-id",
  "--import-id",
  "--mapping-id",
  "--foreign-ref-type",
  "--foreign-ref-id",
  "--local-target-scope",
  "--local-target-work-id",
  "--status",
  "--proposed-by",
  "--reviewed-by",
  "--limit",
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
  console.log(`Usage: npm run ag:resume-proof-evidence-reconciliation-candidate-read -- [--json] [--file <path>]
       npm run ag:resume-proof-evidence-reconciliation-candidate-read -- --candidate-id <id>
       npm run ag:resume-proof-evidence-reconciliation-candidate-read -- --import-id <id> [--limit <n>]
       npm run ag:resume-proof-evidence-reconciliation-candidate-read -- --mapping-id <id>
       npm run ag:resume-proof-evidence-reconciliation-candidate-read -- --foreign-ref-type <proof|evidence|action|session|git|evidence_pack|handoff|other> --foreign-ref-id <id>
       npm run ag:resume-proof-evidence-reconciliation-candidate-read -- --local-target-scope <scope> --local-target-work-id <id>
       npm run ag:resume-proof-evidence-reconciliation-candidate-read -- --status <proposed|accepted_for_future_recording|rejected|deferred|superseded|withdrawn|revoked>
       npm run ag:resume-proof-evidence-reconciliation-candidate-read -- --proposed-by <actor>
       npm run ag:resume-proof-evidence-reconciliation-candidate-read -- --reviewed-by <actor>

Reads AG Resume proof/evidence reconciliation candidate review metadata from
ag_work_resume_proof_evidence_reconciliation_candidates. This helper is
read-only and performs no row mutation, proof/evidence recording, session
binding, Codex execution, work item/event creation, imported context/confirmed
mapping/proposal mutation, approval, publish, retry, replay, or merge.`);
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
      "Stop. Provide valid AG Resume Proof/Evidence Reconciliation Candidate Read JSON or supported read flags.",
    error: parseResult.error,
  });
  console.error(`FAIL: valid_json: ${parseResult.error}`);
  process.exit(1);
}

const result = readAgWorkResumeProofEvidenceReconciliationCandidates(
  parseResult.value,
);
const output = {
  ok: result.ok,
  helper: HELPER_ID,
  input_mode: inputResult.inputMode,
  result,
  recommended_next_step:
    "User/Core may review reconciliation candidate metadata. This is read-only and not proof/evidence authorization, session binding, Codex execution authority, work item/event creation, approval, publish, retry, replay, or merge authority.",
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
      error:
        "Missing AG Resume Proof/Evidence Reconciliation Candidate Read input",
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
      error:
        "Missing AG Resume Proof/Evidence Reconciliation Candidate Read input",
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
      error: `AG Resume Proof/Evidence Reconciliation Candidate Read JSON is invalid: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }

  if (!isRecord(value)) {
    return {
      error:
        "AG Resume Proof/Evidence Reconciliation Candidate Read input must be a JSON object.",
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
      "Stop. Provide valid AG Resume Proof/Evidence Reconciliation Candidate Read input.",
    error,
  });
  console.error(`FAIL: input: ${error}`);
  process.exit(exitCode);
}

function emitResultSummary(result) {
  if (result.ok) {
    console.error(`PASS: ${result.status}: ${result.records.length} record(s)`);
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
