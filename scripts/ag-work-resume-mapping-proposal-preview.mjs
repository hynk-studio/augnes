import { readFileSync } from "node:fs";

const { buildAgWorkResumeMappingProposalPreview } = await import(
  "../lib/ag-work-resume-mapping-proposal-preview.ts"
);

const HELPER_ID = "ag_work_resume_mapping_proposal_preview.v0_1";
const knownFlags = new Set(["--strict", "--json", "--help", "--file"]);

const parsedArgs = parseArgs(process.argv.slice(2));

if (parsedArgs.error) {
  emitInputFailure({
    message: parsedArgs.error,
    exitCode: 2,
    inputMode: "none",
    strict: false,
  });
}

if (parsedArgs.help) {
  console.log(`Usage: npm run ag:resume-mapping-preview -- [--strict] [--json] [--file <path>]

Reads combined AG Resume Mapping Proposal Preview JSON from
AG_WORK_RESUME_MAPPING_PROPOSAL_INPUT, --file, or stdin and prints a local
read-only proposal preview. Packet preflight should already have run; this
helper does not run ag:resume-preflight.`);
  process.exit(0);
}

const inputResult = readInput(parsedArgs);

if (inputResult.error) {
  emitInputFailure({
    message: inputResult.error,
    exitCode: inputResult.exitCode ?? 2,
    inputMode: inputResult.inputMode ?? "none",
    strict: parsedArgs.strict,
  });
}

const parseResult = parsePreviewInput(inputResult.rawInput);

if (parseResult.error) {
  emitJson({
    ok: false,
    helper: HELPER_ID,
    strict: parsedArgs.strict,
    input_mode: inputResult.inputMode,
    preview: null,
    recommended_next_step:
      "Stop. Provide valid AG Resume Mapping Proposal Preview JSON input before proposal review.",
    error: parseResult.error,
  });
  console.error(`FAIL: valid_json: ${parseResult.error}`);
  process.exit(1);
}

const input = parseResult.value;
const effectiveStrict = input.strict === true || parsedArgs.strict === true;
const validationResult = validatePreviewInput(input);

if (validationResult.error) {
  emitJson({
    ok: false,
    helper: HELPER_ID,
    strict: effectiveStrict,
    input_mode: inputResult.inputMode,
    preview: null,
    recommended_next_step:
      "Stop. Provide a packet object and explicit Local B candidate array before mapping proposal review.",
    error: validationResult.error,
  });
  console.error(`FAIL: input_shape: ${validationResult.error}`);
  process.exit(1);
}

let preview;
try {
  preview = buildAgWorkResumeMappingProposalPreview({
    packet: input.packet,
    candidates: input.candidates ?? [],
    selected_candidate_id: input.selected_candidate_id ?? null,
    strict: effectiveStrict,
    source: input.source,
  });
} catch (error) {
  const message = `AG Resume Mapping Proposal Preview failed: ${
    error instanceof Error ? error.message : String(error)
  }`;
  emitJson({
    ok: false,
    helper: HELPER_ID,
    strict: effectiveStrict,
    input_mode: inputResult.inputMode,
    preview: null,
    recommended_next_step:
      "Stop. Correct the packet or candidate shape before mapping proposal review.",
    error: message,
  });
  console.error(`FAIL: preview: ${message}`);
  process.exit(1);
}

const previewOk =
  preview.status === "candidate_review" || preview.status === "needs_candidate";
const output = {
  ok: previewOk,
  helper: HELPER_ID,
  strict: effectiveStrict,
  input_mode: inputResult.inputMode,
  preview,
  recommended_next_step: recommendedNextStepForPreview(preview),
};

emitJson(output);
emitPreviewSummary(preview);

process.exit(previewOk ? 0 : 1);

function parseArgs(args) {
  const result = {
    strict: false,
    help: false,
    filePath: null,
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
  const envInput = clean(process.env.AG_WORK_RESUME_MAPPING_PROPOSAL_INPUT);
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
      error: "Missing AG Resume Mapping Proposal Preview input",
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
      error: "Missing AG Resume Mapping Proposal Preview input",
      exitCode: 2,
      inputMode: "stdin",
    };
  }

  return { rawInput: stdinText, inputMode: "stdin" };
}

function parsePreviewInput(rawInput) {
  let value;
  try {
    value = JSON.parse(rawInput);
  } catch (error) {
    return {
      error: `AG Resume Mapping Proposal Preview JSON is invalid: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }

  if (!isRecord(value)) {
    return {
      error: "AG Resume Mapping Proposal Preview input must be a JSON object.",
    };
  }

  return { value };
}

function validatePreviewInput(input) {
  if (!isRecord(input.packet)) {
    return {
      error: "AG Resume Mapping Proposal Preview input must include a packet object.",
    };
  }

  const packetShapeError = validatePacketShape(input.packet);
  if (packetShapeError) {
    return { error: packetShapeError };
  }

  if (input.candidates !== undefined && !Array.isArray(input.candidates)) {
    return {
      error: "AG Resume Mapping Proposal Preview candidates must be an array.",
    };
  }

  for (const [index, candidate] of (input.candidates ?? []).entries()) {
    const candidateShapeError = validateCandidateShape(candidate, index);
    if (candidateShapeError) {
      return { error: candidateShapeError };
    }
  }

  if (
    input.selected_candidate_id !== undefined &&
    input.selected_candidate_id !== null &&
    typeof input.selected_candidate_id !== "string"
  ) {
    return {
      error: "AG Resume Mapping Proposal Preview selected_candidate_id must be a string or null.",
    };
  }

  return {};
}

function validatePacketShape(packet) {
  const requiredObjects = [
    ["source_work", packet.source_work],
    ["git", packet.git],
    ["handoff", packet.handoff],
    ["continuity", packet.continuity],
    ["target_runtime_policy", packet.target_runtime_policy],
  ];
  for (const [field, value] of requiredObjects) {
    if (!isRecord(value)) {
      return `AG Resume Mapping Proposal Preview packet.${field} must be an object.`;
    }
  }

  for (const field of [
    "packet_id",
    "source_work.scope",
    "source_work.work_id",
    "source_work.title",
    "source_work.status",
    "source_work.priority",
    "source_work.summary",
    "source_work.next_action",
    "git.remote",
    "git.base_branch",
    "git.base_commit",
    "git.working_branch",
    "git.head_commit",
  ]) {
    const value = getPath(packet, field);
    if (typeof value !== "string") {
      return `AG Resume Mapping Proposal Preview packet.${field} must be a string.`;
    }
  }

  for (const field of [
    "source_work.related_state_keys",
    "handoff.expected_files",
    "handoff.expected_checks",
    "continuity.foreign_action_refs",
    "continuity.foreign_evidence_refs",
    "continuity.foreign_session_refs",
  ]) {
    const value = getPath(packet, field);
    if (!Array.isArray(value)) {
      return `AG Resume Mapping Proposal Preview packet.${field} must be an array.`;
    }
  }

  return null;
}

function validateCandidateShape(candidate, index) {
  if (!isRecord(candidate)) {
    return `AG Resume Mapping Proposal Preview candidates[${index}] must be an object.`;
  }

  for (const field of [
    "candidate_id",
    "local_scope",
    "local_work_id",
    "title",
    "status",
    "next_action",
  ]) {
    if (typeof candidate[field] !== "string") {
      return `AG Resume Mapping Proposal Preview candidates[${index}].${field} must be a string.`;
    }
  }

  if (!Array.isArray(candidate.related_state_keys)) {
    return `AG Resume Mapping Proposal Preview candidates[${index}].related_state_keys must be an array.`;
  }

  if (candidate.repo_match !== undefined) {
    if (!isRecord(candidate.repo_match)) {
      return `AG Resume Mapping Proposal Preview candidates[${index}].repo_match must be an object.`;
    }
    for (const field of ["expected_files_present", "expected_files_missing"]) {
      if (
        candidate.repo_match[field] !== undefined &&
        !Array.isArray(candidate.repo_match[field])
      ) {
        return `AG Resume Mapping Proposal Preview candidates[${index}].repo_match.${field} must be an array.`;
      }
    }
  }

  return null;
}

function recommendedNextStepForPreview(preview) {
  if (preview.status === "candidate_review") {
    return "User/Core should review whether the foreign work maps to the selected local work item. Do not create a mapping record or import context from this helper output.";
  }
  if (preview.status === "needs_candidate") {
    return "Provide an explicit Local B candidate work item before user/Core mapping review.";
  }
  if (preview.status === "conflict") {
    return `${preview.next_step} Conflicts must be resolved before future mapping confirmation.`;
  }
  return `${preview.next_step} Unsafe packet policy or packet shape must be corrected before mapping proposal review.`;
}

function emitPreviewSummary(preview) {
  for (const gap of preview.gaps) {
    const label = gap.severity === "warning" ? "WARN" : "GAP";
    console.error(`${label}: preview:${gap.id}: ${gap.detail}`);
  }
  for (const conflict of preview.conflicts) {
    console.error(`FAIL: preview:${conflict.id}: ${conflict.detail}`);
  }
}

function emitInputFailure({ message, exitCode, inputMode, strict }) {
  emitJson({
    ok: false,
    helper: HELPER_ID,
    strict,
    input_mode: inputMode,
    preview: null,
    recommended_next_step:
      "Provide AG Resume Mapping Proposal Preview input through AG_WORK_RESUME_MAPPING_PROPOSAL_INPUT, --file, or stdin.",
    error: message,
  });
  console.error(`FAIL: input_present: ${message}`);
  process.exit(exitCode);
}

function emitJson(value) {
  console.log(JSON.stringify(value, null, 2));
}

function clean(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getPath(value, fieldPath) {
  return fieldPath
    .split(".")
    .reduce((current, segment) => (isRecord(current) ? current[segment] : undefined), value);
}
