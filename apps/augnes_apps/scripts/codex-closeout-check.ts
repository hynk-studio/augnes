import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const CLOSEOUT_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_CLOSEOUT_JSON";
const CLOSEOUT_JSON_END_MARKER = "END_AUGNES_CODEX_CLOSEOUT_JSON";
const CHECK_JSON_BEGIN_MARKER = "BEGIN_AUGNES_CODEX_CLOSEOUT_CHECK_JSON";
const CHECK_JSON_END_MARKER = "END_AUGNES_CODEX_CLOSEOUT_CHECK_JSON";

const REQUIRED_TOP_LEVEL_KEYS = [
  "helper",
  "version",
  "operation_mode",
  "closeout_status",
  "scope",
  "work_id",
  "related_pr",
  "changed_files",
  "tests_run",
  "tests_skipped",
  "runtime_refs",
  "evidence_completion_refs",
  "warnings",
  "blockers",
  "scope_risks",
  "assumptions",
  "open_questions",
  "delegated_authority_scope",
  "forbidden_actions",
  "next_goal",
  "authority_boundary",
] as const;

const RUNTIME_REF_KEYS = [
  "state_brief_url",
  "work_brief_url",
  "evidence_pack_url",
  "session_trace_url",
] as const;

const AUTHORITY_BOUNDARY_REQUIREMENTS = [
  {
    label: "does not call GitHub/OpenAI",
    passes: (value: string) => value.includes("does not call GitHub/OpenAI"),
  },
  {
    label: "does not create evidence",
    passes: (value: string) => value.includes("does not create evidence"),
  },
  {
    label: "does not commit/reject",
    passes: (value: string) => value.includes("commit/reject"),
  },
  {
    label: "does not grant or exercise authority",
    passes: (value: string) => value.includes("does not itself grant or exercise authority"),
  },
] as const;

type OperationMode = "human_assisted" | "delegated";
type ValidationStatus = "pass" | "needs_review" | "fail";
type RuntimeRefName = (typeof RUNTIME_REF_KEYS)[number];

type RuntimeRefs = Record<RuntimeRefName, string | null>;

type EvidenceCompletionRefs = {
  evidence_ids: string[];
  action_id: string | null;
  work_event_id: string | null;
  related_pr: string | null;
  handoff_ref: string | null;
  evidence_pack_ref: string | null;
};

type CloseoutBlock = {
  helper: "codex:closeout-block";
  version: string | number;
  operation_mode: OperationMode;
  closeout_status: string | null;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  changed_files: string[];
  tests_run: string[];
  tests_skipped: string[];
  runtime_refs: RuntimeRefs;
  evidence_completion_refs: EvidenceCompletionRefs;
  warnings: string[];
  blockers: string[];
  scope_risks: string[];
  assumptions: string[];
  open_questions: string[];
  delegated_authority_scope: string[];
  forbidden_actions: string[];
  next_goal: string | null;
  authority_boundary: string;
};

type ReadOnlyRefCheck = {
  name: RuntimeRefName;
  url: string | null;
  checked: boolean;
  status: number | null;
  ok: boolean | null;
  error?: string;
};

type CloseoutCheckResult = {
  helper: "codex:closeout-check";
  version: 1;
  validation_status: ValidationStatus;
  operation_mode: OperationMode;
  delegated_consumption: boolean;
  scope: string;
  work_id: string | null;
  related_pr: string | null;
  missing_recommended_fields: string[];
  boundary_warnings: string[];
  read_only_ref_checks: ReadOnlyRefCheck[];
  forbidden_actions: string[];
  delegated_authority_scope: string[];
  authority_boundary: string;
};

class CloseoutCheckError extends Error {
  constructor(
    message: string,
    readonly exitCode = 1,
  ) {
    super(message);
  }
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value === undefined ? undefined : value;
}

function readReadRefsFlag(): boolean {
  const raw = process.env.CODEX_CLOSEOUT_CHECK_READ_REFS?.trim() ?? "false";
  if (raw === "false") return false;
  if (raw === "true") return true;
  throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_INVALID_READ_REFS");
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function readInputText(): Promise<string> {
  const inline = readOptionalEnv("CODEX_CLOSEOUT_JSON");
  if (inline !== undefined) {
    if (!inline.trim()) throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_MISSING_INPUT");
    return inline;
  }

  const filePath = readOptionalEnv("CODEX_CLOSEOUT_JSON_FILE");
  if (filePath !== undefined) {
    if (!filePath.trim()) throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_MISSING_INPUT");
    const content = await readFile(filePath, "utf8");
    if (!content.trim()) throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_MISSING_INPUT");
    return content;
  }

  const stdin = await readStdin();
  if (!stdin.trim()) throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_MISSING_INPUT");
  return stdin;
}

function extractJsonText(input: string): string {
  const begin = input.indexOf(CLOSEOUT_JSON_BEGIN_MARKER);
  const end = input.indexOf(CLOSEOUT_JSON_END_MARKER);
  if (begin !== -1 || end !== -1) {
    if (begin === -1 || end === -1 || end <= begin) {
      throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_INVALID_JSON");
    }

    return input.slice(begin + CLOSEOUT_JSON_BEGIN_MARKER.length, end).trim();
  }

  return input.trim();
}

function parseCloseoutJson(input: string): unknown {
  try {
    return JSON.parse(extractJsonText(input)) as unknown;
  } catch (error) {
    if (error instanceof CloseoutCheckError) throw error;
    throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_INVALID_JSON");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertStringArray(value: unknown): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_INVALID_SHAPE");
  }
}

function assertStringOrNull(value: unknown): asserts value is string | null {
  if (value !== null && typeof value !== "string") {
    throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_INVALID_SHAPE");
  }
}

function assertRuntimeRef(value: unknown): asserts value is string | null {
  assertStringOrNull(value);
  if (typeof value !== "string") return;

  try {
    new URL(value);
  } catch {
    throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_INVALID_URL");
  }
}

function validateRuntimeRefs(value: unknown): RuntimeRefs {
  if (!isRecord(value)) throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_INVALID_SHAPE");

  const refs: Partial<RuntimeRefs> = {};
  for (const key of RUNTIME_REF_KEYS) {
    if (!(key in value)) throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_INVALID_SHAPE");
    const ref = value[key];
    assertRuntimeRef(ref);
    refs[key] = ref;
  }

  return {
    state_brief_url: refs.state_brief_url ?? null,
    work_brief_url: refs.work_brief_url ?? null,
    evidence_pack_url: refs.evidence_pack_url ?? null,
    session_trace_url: refs.session_trace_url ?? null,
  };
}

function validateEvidenceCompletionRefs(value: unknown): EvidenceCompletionRefs {
  if (!isRecord(value)) throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_INVALID_SHAPE");

  assertStringArray(value.evidence_ids);
  assertStringOrNull(value.action_id);
  assertStringOrNull(value.work_event_id);
  assertStringOrNull(value.related_pr);
  assertStringOrNull(value.handoff_ref);
  assertStringOrNull(value.evidence_pack_ref);

  return {
    evidence_ids: value.evidence_ids,
    action_id: value.action_id,
    work_event_id: value.work_event_id,
    related_pr: value.related_pr,
    handoff_ref: value.handoff_ref,
    evidence_pack_ref: value.evidence_pack_ref,
  };
}

function validateCloseoutShape(value: unknown): CloseoutBlock {
  if (!isRecord(value)) throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_INVALID_SHAPE");

  for (const key of REQUIRED_TOP_LEVEL_KEYS) {
    if (!(key in value)) throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_INVALID_SHAPE");
  }

  if (value.helper !== "codex:closeout-block") {
    throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_INVALID_SHAPE");
  }
  if (typeof value.version !== "string" && typeof value.version !== "number") {
    throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_INVALID_SHAPE");
  }
  if (value.operation_mode !== "human_assisted" && value.operation_mode !== "delegated") {
    throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_INVALID_SHAPE");
  }
  assertStringOrNull(value.closeout_status);
  if (typeof value.scope !== "string") throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_INVALID_SHAPE");
  assertStringOrNull(value.work_id);
  assertStringOrNull(value.related_pr);
  assertStringArray(value.changed_files);
  assertStringArray(value.tests_run);
  assertStringArray(value.tests_skipped);
  assertStringArray(value.warnings);
  assertStringArray(value.blockers);
  assertStringArray(value.scope_risks);
  assertStringArray(value.assumptions);
  assertStringArray(value.open_questions);
  assertStringArray(value.delegated_authority_scope);
  assertStringArray(value.forbidden_actions);
  assertStringOrNull(value.next_goal);
  if (typeof value.authority_boundary !== "string" || !value.authority_boundary.trim()) {
    throw new CloseoutCheckError("CODEX_CLOSEOUT_CHECK_INVALID_SHAPE");
  }

  return {
    helper: "codex:closeout-block",
    version: value.version,
    operation_mode: value.operation_mode,
    closeout_status: value.closeout_status,
    scope: value.scope,
    work_id: value.work_id,
    related_pr: value.related_pr,
    changed_files: value.changed_files,
    tests_run: value.tests_run,
    tests_skipped: value.tests_skipped,
    runtime_refs: validateRuntimeRefs(value.runtime_refs),
    evidence_completion_refs: validateEvidenceCompletionRefs(value.evidence_completion_refs),
    warnings: value.warnings,
    blockers: value.blockers,
    scope_risks: value.scope_risks,
    assumptions: value.assumptions,
    open_questions: value.open_questions,
    delegated_authority_scope: value.delegated_authority_scope,
    forbidden_actions: value.forbidden_actions,
    next_goal: value.next_goal,
    authority_boundary: value.authority_boundary,
  };
}

function collectBoundaryWarnings(closeout: CloseoutBlock): string[] {
  return AUTHORITY_BOUNDARY_REQUIREMENTS.filter((requirement) => !requirement.passes(closeout.authority_boundary)).map(
    (requirement) => `authority_boundary missing phrase: ${requirement.label}`,
  );
}

function collectMissingRecommendedFields(closeout: CloseoutBlock): string[] {
  const missing: string[] = [];
  if (closeout.tests_run.length === 0) missing.push("tests_run");
  if (closeout.changed_files.length === 0) missing.push("changed_files");
  if (!closeout.next_goal) missing.push("next_goal");
  if (
    closeout.evidence_completion_refs.evidence_ids.length === 0 &&
    !closeout.evidence_completion_refs.action_id &&
    !closeout.evidence_completion_refs.work_event_id
  ) {
    missing.push("evidence_or_completion_ref");
  }
  if (closeout.blockers.length > 0) missing.push("blockers_present");

  return missing;
}

function skippedReadOnlyRefChecks(runtimeRefs: RuntimeRefs): ReadOnlyRefCheck[] {
  return RUNTIME_REF_KEYS.map((name) => ({
    name,
    url: runtimeRefs[name],
    checked: false,
    status: null,
    ok: null,
    error: runtimeRefs[name] ? undefined : "not provided",
  }));
}

async function checkReadOnlyRefs(runtimeRefs: RuntimeRefs): Promise<ReadOnlyRefCheck[]> {
  const checks: ReadOnlyRefCheck[] = [];

  for (const name of RUNTIME_REF_KEYS) {
    const url = runtimeRefs[name];
    if (!url) {
      checks.push({ name, url, checked: false, status: null, ok: null, error: "not provided" });
      continue;
    }

    try {
      const response = await fetch(url, { method: "GET" });
      checks.push({ name, url, checked: true, status: response.status, ok: response.ok });
    } catch (error) {
      checks.push({
        name,
        url,
        checked: true,
        status: null,
        ok: false,
        error: error instanceof Error ? error.message : "fetch failed",
      });
    }
  }

  return checks;
}

function resolveValidationStatus(
  boundaryWarnings: string[],
  missingRecommendedFields: string[],
  readOnlyRefChecks: ReadOnlyRefCheck[],
): ValidationStatus {
  if (boundaryWarnings.length > 0) return "fail";
  if (readOnlyRefChecks.some((check) => check.checked && check.ok === false)) return "fail";
  if (missingRecommendedFields.length > 0) return "needs_review";
  return "pass";
}

async function buildCheckResult(closeout: CloseoutBlock, readRefs: boolean): Promise<CloseoutCheckResult> {
  const boundaryWarnings = collectBoundaryWarnings(closeout);
  const missingRecommendedFields = collectMissingRecommendedFields(closeout);
  const readOnlyRefChecks = readRefs
    ? await checkReadOnlyRefs(closeout.runtime_refs)
    : skippedReadOnlyRefChecks(closeout.runtime_refs);
  const validationStatus = resolveValidationStatus(boundaryWarnings, missingRecommendedFields, readOnlyRefChecks);

  return {
    helper: "codex:closeout-check",
    version: 1,
    validation_status: validationStatus,
    operation_mode: closeout.operation_mode,
    delegated_consumption: closeout.operation_mode === "delegated",
    scope: closeout.scope,
    work_id: closeout.work_id,
    related_pr: closeout.related_pr,
    missing_recommended_fields: missingRecommendedFields,
    boundary_warnings: boundaryWarnings,
    read_only_ref_checks: readOnlyRefChecks,
    forbidden_actions: closeout.forbidden_actions,
    delegated_authority_scope: closeout.delegated_authority_scope,
    authority_boundary: closeout.authority_boundary,
  };
}

function printCheckResult(result: CloseoutCheckResult, closeout: CloseoutBlock): void {
  console.log("Codex closeout check");
  console.log(`operation_mode: ${result.operation_mode}`);
  console.log(`closeout_status: ${closeout.closeout_status ?? "Not provided."}`);
  console.log(`scope: ${result.scope}`);
  console.log(`work_id: ${result.work_id ?? "Not provided."}`);
  console.log(`related_pr: ${result.related_pr ?? "Not provided."}`);
  console.log(`evidence_ids count: ${closeout.evidence_completion_refs.evidence_ids.length}`);
  console.log(`changed_files count: ${closeout.changed_files.length}`);
  console.log(`tests_run count: ${closeout.tests_run.length}`);
  console.log(`blockers count: ${closeout.blockers.length}`);
  console.log(`warnings count: ${closeout.warnings.length}`);
  console.log(`delegated_consumption: ${result.delegated_consumption}`);
  console.log(`validation_status: ${result.validation_status}`);
  console.log(CHECK_JSON_BEGIN_MARKER);
  console.log(JSON.stringify(result, null, 2));
  console.log(CHECK_JSON_END_MARKER);
}

async function main(): Promise<void> {
  const readRefs = readReadRefsFlag();
  const inputText = await readInputText();
  const closeout = validateCloseoutShape(parseCloseoutJson(inputText));
  const result = await buildCheckResult(closeout, readRefs);
  printCheckResult(result, closeout);

  if (result.validation_status === "fail") {
    if (result.read_only_ref_checks.some((check) => check.checked && check.ok === false)) {
      const failed = result.read_only_ref_checks
        .filter((check) => check.checked && check.ok === false)
        .map((check) => `${check.name}=${check.url ?? "(none)"}`)
        .join(", ");
      console.error(`CODEX_CLOSEOUT_CHECK_READ_REF_FAILED ${failed}`);
    } else {
      console.error("CODEX_CLOSEOUT_CHECK_INVALID_SHAPE");
    }
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "CODEX_CLOSEOUT_CHECK_FAILED";
    console.error(message);
    process.exitCode = error instanceof CloseoutCheckError ? error.exitCode : 1;
  });
}
