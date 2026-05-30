import { readFileSync } from "node:fs";
import { preflightAgWorkResumePacket } from "../lib/ag-work-resume-packet-preflight-core.mjs";

const knownFlags = new Set(["--strict", "--json", "--help", "--file"]);
const strict = process.argv.includes("--strict");

const parsedArgs = parseArgs(process.argv.slice(2));

if (parsedArgs.error) {
  const output = buildInputFailure(parsedArgs.error, false);
  writeJson(output);
  console.error(`FAIL: input_present: ${parsedArgs.error}`);
  process.exit(2);
}

if (parsedArgs.help) {
  console.log(`Usage: npm run ag:resume-preflight -- [--strict] [--json] [--file <path>]

Reads AG Resume Packet JSON from AG_WORK_RESUME_PACKET, a file, or stdin and
prints a deterministic JSON preflight report. The helper is local only: it does
not call Augnes, GitHub, OpenAI, or network resources, execute shell commands,
record proof/evidence, import or persist resume context, create work events,
bind sessions, mutate files, or mutate runtime state.`);
  process.exit(0);
}

const inputResult = readPacketInput(parsedArgs.filePath);

if (inputResult.error) {
  const output = buildInputFailure(inputResult.error, false);
  writeJson(output);
  console.error(`FAIL: input_present: ${inputResult.error}`);
  process.exit(inputResult.exitCode ?? 2);
}

const rawInput = inputResult.packet.trim();
const parseResult = parsePacketJson(rawInput);

if (parseResult.error) {
  const output = {
    ok: false,
    strict,
    summary: emptySummary(inputResult.inputMode),
    checks: [
      {
        id: "input_present",
        status: "pass",
        message: "AG Resume Packet input is present.",
      },
      { id: "valid_json", status: "fail", message: parseResult.error },
    ],
    recommended_next_step:
      "Stop. Provide valid AG Resume Packet JSON before preview, import, or Codex start.",
  };
  writeJson(output);
  writeNonPassToStderr(output.checks);
  process.exit(1);
}

const output = preflightAgWorkResumePacket(parseResult.value, {
  strict,
  rawInput,
  inputMode: inputResult.inputMode,
});

writeJson(output);
writeNonPassToStderr(output.checks);

process.exit(output.ok ? 0 : 1);

function parseArgs(args) {
  let filePath = null;
  let help = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help") {
      help = true;
      continue;
    }
    if (arg === "--json" || arg === "--strict") {
      continue;
    }
    if (arg === "--file") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        return { error: "--file requires a path" };
      }
      filePath = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--file=")) {
      const value = arg.slice("--file=".length).trim();
      if (!value) return { error: "--file requires a path" };
      filePath = value;
      continue;
    }
    if (arg.startsWith("--") && !knownFlags.has(arg)) {
      return { error: `Unknown flag: ${arg}` };
    }
  }

  return { filePath, help };
}

function readPacketInput(filePath) {
  const envPacket = clean(process.env.AG_WORK_RESUME_PACKET);
  if (envPacket) return { packet: envPacket, inputMode: "json" };

  if (filePath) {
    try {
      return { packet: readFileSync(filePath, "utf8"), inputMode: "file" };
    } catch (error) {
      return {
        error: `Unable to read --file path: ${
          error instanceof Error ? error.message : String(error)
        }`,
        exitCode: 2,
      };
    }
  }

  if (process.stdin.isTTY) {
    return { error: "Missing AG Resume Packet input", exitCode: 2 };
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
    };
  }

  if (!clean(stdinText)) {
    return { error: "Missing AG Resume Packet input", exitCode: 2 };
  }
  return { packet: stdinText, inputMode: "stdin" };
}

function parsePacketJson(input) {
  try {
    const value = JSON.parse(input);
    if (!isRecord(value)) {
      return { error: "AG Resume Packet JSON must be an object." };
    }
    return { value };
  } catch (error) {
    return {
      error: `AG Resume Packet JSON is invalid: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

function emptySummary(inputMode = "none") {
  return {
    input_mode: inputMode,
    schema: null,
    packet_kind: null,
    has_packet_id: false,
    has_runtime_instance_id: false,
    has_scope: false,
    has_work_id: false,
    has_git_remote: false,
    has_expected_checks: false,
    preview_only_by_default: false,
  };
}

function buildInputFailure(message, inputPresent) {
  return {
    ok: false,
    strict,
    summary: emptySummary("none"),
    checks: [
      { id: "input_present", status: inputPresent ? "pass" : "fail", message },
      {
        id: "valid_json",
        status: "fail",
        message: "No valid packet JSON was available.",
      },
    ],
    recommended_next_step:
      "Provide AG Resume Packet JSON through AG_WORK_RESUME_PACKET, --file, or stdin.",
  };
}

function writeNonPassToStderr(checks) {
  const nonPass = checks.filter((check) => check.status !== "pass");
  if (nonPass.length > 0) {
    console.error(
      nonPass
        .map((check) => `${check.status.toUpperCase()}: ${check.id}: ${check.message}`)
        .join("\n"),
    );
  }
}

function clean(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}
