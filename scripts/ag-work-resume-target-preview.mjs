import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { buildAgWorkResumeTargetPreview } = await import(
  "../lib/ag-work-resume-target-preview.ts"
);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const preflightPath = path.join(__dirname, "ag-work-resume-packet-preflight.mjs");
const knownFlags = new Set([
  "--strict",
  "--json",
  "--help",
  "--file",
  "--packet-file",
  "--local-context-file",
  "--skip-preflight",
]);

const parsedArgs = parseArgs(process.argv.slice(2));

if (parsedArgs.error) {
  writeFailure({
    message: parsedArgs.error,
    exitCode: 2,
    inputMode: "none",
    strict: false,
  });
}

if (parsedArgs.help) {
  console.log(`Usage: npm run ag:resume-target-preview -- [--strict] [--json] [--skip-preflight] [--file <path>]
       npm run ag:resume-target-preview -- --packet-file <packet.json> [--local-context-file <local.json>]

Reads an already-built AG Resume Packet and explicit Local B context, runs
strict packet preflight unless skipped, then prints a read-only target preview.
The helper does not call Augnes runtime routes, GitHub, OpenAI, browser,
network resources, git, or shell commands from packet content; it does not
persist, import, record proof/evidence, bind sessions, create work items, or
execute Codex.`);
  process.exit(0);
}

const inputResult = readInput(parsedArgs);

if (inputResult.error) {
  writeFailure({
    message: inputResult.error,
    exitCode: inputResult.exitCode ?? 2,
    inputMode: inputResult.inputMode ?? "none",
    strict: parsedArgs.strict,
  });
}

const parseResult = parsePreviewInput(inputResult.rawInput, inputResult.inputMode);

if (parseResult.error) {
  const output = buildBaseOutput({
    ok: false,
    strict: parsedArgs.strict,
    inputMode: inputResult.inputMode,
    preflight: skippedPreflight("Packet preview input could not be parsed."),
    preview: null,
    recommendedNextStep: "Stop. Provide valid AG Resume Target Preview JSON input before target preview.",
  });
  output.error = parseResult.error;
  writeJson(output);
  console.error(`FAIL: valid_json: ${parseResult.error}`);
  process.exit(1);
}

const { packet, local } = parseResult.value;
const effectiveStrict = parsedArgs.strict || parseResult.value.strict === true;
const preflight = parsedArgs.skipPreflight
  ? skippedPreflight("Packet preflight was skipped; run ag:resume-preflight before relying on this target preview.")
  : runPreflight(packet);

if (preflight.ran && !preflight.ok) {
  const output = buildBaseOutput({
    ok: false,
    strict: effectiveStrict,
    inputMode: inputResult.inputMode,
    preflight,
    preview: null,
    recommendedNextStep: "Stop. Fix failed packet preflight checks before target preview.",
  });
  writeJson(output);
  writePreflightSummary(preflight);
  process.exit(1);
}

const preview = buildAgWorkResumeTargetPreview({
  packet,
  local,
  strict: effectiveStrict,
});
const previewOk =
  preview.status === "ready_for_user_core_review" ||
  preview.status === "needs_mapping" ||
  preview.status === "context_only";
const recommendedNextStep = recommendedNextStepForPreview(
  preview,
  parsedArgs.skipPreflight,
);

const output = buildBaseOutput({
  ok: previewOk,
  strict: effectiveStrict,
  inputMode: inputResult.inputMode,
  preflight,
  preview,
  recommendedNextStep,
});

writeJson(output);
writePreflightSummary(preflight);
writePreviewSummary(preview);

process.exit(previewOk ? 0 : 1);

function parseArgs(args) {
  const result = {
    strict: false,
    help: false,
    filePath: null,
    packetFilePath: null,
    localContextFilePath: null,
    skipPreflight: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--strict") {
      result.strict = true;
      continue;
    }
    if (arg === "--json") {
      continue;
    }
    if (arg === "--help") {
      result.help = true;
      continue;
    }
    if (arg === "--skip-preflight") {
      result.skipPreflight = true;
      continue;
    }
    if (arg === "--file" || arg === "--packet-file" || arg === "--local-context-file") {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) {
        return { error: `${arg} requires a path` };
      }
      setPath(result, arg, value);
      index += 1;
      continue;
    }
    const equalsMatch = arg.match(/^(--file|--packet-file|--local-context-file)=(.+)$/);
    if (equalsMatch) {
      const [, flag, value] = equalsMatch;
      const cleaned = clean(value);
      if (!cleaned) return { error: `${flag} requires a path` };
      setPath(result, flag, cleaned);
      continue;
    }
    if (arg.startsWith("--") && !knownFlags.has(arg)) {
      return { error: `Unknown flag: ${arg}` };
    }
    return { error: `Unexpected positional argument: ${arg}` };
  }

  return result;
}

function setPath(result, flag, value) {
  if (flag === "--file") result.filePath = value;
  if (flag === "--packet-file") result.packetFilePath = value;
  if (flag === "--local-context-file") result.localContextFilePath = value;
}

function readInput(args) {
  const envInput = clean(process.env.AG_WORK_RESUME_TARGET_PREVIEW_INPUT);
  if (envInput) {
    return { rawInput: envInput, inputMode: "env" };
  }

  if (args.filePath) {
    const file = readTextFile(args.filePath, "--file");
    if (file.error) return { ...file, inputMode: "file" };
    return { rawInput: file.text, inputMode: "file" };
  }

  if (args.packetFilePath) {
    const packetFile = readTextFile(args.packetFilePath, "--packet-file");
    if (packetFile.error) return { ...packetFile, inputMode: "separate-files" };

    let localText = null;
    if (args.localContextFilePath) {
      const localFile = readTextFile(args.localContextFilePath, "--local-context-file");
      if (localFile.error) return { ...localFile, inputMode: "separate-files" };
      localText = localFile.text;
    }

    return {
      rawInput: JSON.stringify({
        packet: parseTextOrRaw(packetFile.text),
        local: localText ? parseTextOrRaw(localText) : null,
        strict: args.strict,
      }),
      inputMode: "separate-files",
    };
  }

  if (process.stdin.isTTY) {
    return {
      error: "Missing AG Resume Target Preview input",
      exitCode: 2,
      inputMode: "none",
    };
  }

  let stdinText = "";
  try {
    stdinText = readFileSync(0, "utf8");
  } catch (error) {
    return {
      error: `Unable to read stdin: ${error instanceof Error ? error.message : String(error)}`,
      exitCode: 2,
      inputMode: "stdin",
    };
  }

  if (!clean(stdinText)) {
    return {
      error: "Missing AG Resume Target Preview input",
      exitCode: 2,
      inputMode: "stdin",
    };
  }

  return { rawInput: stdinText, inputMode: "stdin" };
}

function readTextFile(filePath, label) {
  try {
    return { text: readFileSync(filePath, "utf8") };
  } catch (error) {
    return {
      error: `Unable to read ${label} path: ${error instanceof Error ? error.message : String(error)}`,
      exitCode: 2,
    };
  }
}

function parseTextOrRaw(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function parsePreviewInput(rawInput, inputMode) {
  let value;
  try {
    value = JSON.parse(rawInput);
  } catch (error) {
    return {
      error: `AG Resume Target Preview JSON is invalid: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  if (!isRecord(value)) {
    return { error: "AG Resume Target Preview input must be a JSON object." };
  }
  if (!isRecord(value.packet)) {
    return { error: "AG Resume Target Preview input must include a packet object." };
  }
  if (inputMode === "separate-files" && typeof value.packet === "string") {
    return { error: "Separate --packet-file content must be valid packet JSON." };
  }
  if (inputMode === "separate-files" && typeof value.local === "string") {
    return { error: "Separate --local-context-file content must be valid Local B context JSON." };
  }
  if (value.local !== undefined && value.local !== null && !isRecord(value.local)) {
    return { error: "Local B context must be an object or null." };
  }

  return {
    value: {
      packet: value.packet,
      local: value.local ?? null,
      strict: value.strict === true,
    },
  };
}

function runPreflight(packet) {
  const result = spawnSync(process.execPath, [preflightPath, "--strict"], {
    env: { ...process.env, AG_WORK_RESUME_PACKET: JSON.stringify(packet) },
    encoding: "utf8",
  });
  const parsed = parsePreflightOutput(result.stdout);
  const failures = parsed.checks.filter((check) => check.status === "fail");
  const warnings = parsed.checks.filter((check) => check.status === "warn");
  const ok = result.status === 0 && parsed.ok === true && failures.length === 0;

  return {
    ran: true,
    ok,
    strict: true,
    status: ok ? warnings.length > 0 ? "warn" : "pass" : "fail",
    warnings: warnings.map(formatCheck),
    failures: failures.map(formatCheck),
  };
}

function parsePreflightOutput(stdout) {
  try {
    const parsed = JSON.parse(stdout);
    return {
      ok: parsed.ok === true,
      checks: Array.isArray(parsed.checks) ? parsed.checks : [],
    };
  } catch (error) {
    return {
      ok: false,
      checks: [
        {
          id: "preflight_output",
          status: "fail",
          message: `Unable to parse packet preflight output: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
}

function skippedPreflight(message) {
  return {
    ran: false,
    ok: null,
    strict: true,
    status: "skipped",
    warnings: [message],
    failures: [],
  };
}

function formatCheck(check) {
  const id = typeof check.id === "string" ? check.id : "unknown";
  const message = typeof check.message === "string" ? check.message : "No message.";
  return `${id}: ${message}`;
}

function recommendedNextStepForPreview(preview, skipped) {
  const base =
    preview.status === "ready_for_user_core_review"
      ? "User/Core should review and confirm the local mapping and authority choices before any Codex start."
      : preview.status === "needs_mapping"
        ? "User/Core must confirm whether the foreign work maps to an existing local work item; do not auto-create one."
        : preview.status === "context_only"
          ? "Use the packet as human-readable context only until local runtime and work mapping context are supplied."
          : preview.next_step;
  if (!skipped) return base;
  return `${base} Run ag:resume-preflight before relying on this target preview.`;
}

function buildBaseOutput({
  ok,
  strict,
  inputMode,
  preflight,
  preview,
  recommendedNextStep,
}) {
  return {
    ok,
    strict,
    input_mode: inputMode,
    preflight,
    preview,
    recommended_next_step: recommendedNextStep,
  };
}

function writeFailure({ message, exitCode, inputMode, strict }) {
  const output = buildBaseOutput({
    ok: false,
    strict,
    inputMode,
    preflight: skippedPreflight("Packet preflight was not run because required helper input was unavailable."),
    preview: null,
    recommendedNextStep: "Provide AG Resume Target Preview input through AG_WORK_RESUME_TARGET_PREVIEW_INPUT, --file, --packet-file, or stdin.",
  });
  output.error = message;
  writeJson(output);
  console.error(`FAIL: input_present: ${message}`);
  process.exit(exitCode);
}

function writePreflightSummary(preflight) {
  for (const warning of preflight.warnings) {
    console.error(`WARN: preflight: ${warning}`);
  }
  for (const failure of preflight.failures) {
    console.error(`FAIL: preflight: ${failure}`);
  }
}

function writePreviewSummary(preview) {
  for (const warning of preview.warnings) {
    console.error(`WARN: preview:${warning.id}: ${warning.detail}`);
  }
  for (const gap of preview.gaps) {
    if (gap.severity === "blocking") {
      console.error(`GAP: preview:${gap.id}: ${gap.detail}`);
    }
  }
  for (const conflict of preview.conflicts) {
    console.error(`FAIL: preview:${conflict.id}: ${conflict.detail}`);
  }
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function clean(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
