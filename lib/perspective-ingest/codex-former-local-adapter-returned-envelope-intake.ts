import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from "node:fs";
import { isAbsolute, posix, relative, resolve } from "node:path";
import {
  hashCodexFormerLocalAdapterContent,
} from "@/lib/perspective-ingest/codex-former-local-adapter-manifest-to-source-input";
import {
  buildOperatorFlowBlockedBeforeExecutionResponse,
  runOperatorFlowLocalValidationBridge,
} from "@/lib/perspective-ingest/codex-former-local-adapter-operator-flow-local-validate";
import {
  CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_AUTHORITY_BOUNDARY,
  CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_INTAKE_DIR,
  type OperatorFlowReturnedEnvelopeIntakeEntry,
  type OperatorFlowReturnedEnvelopeIntakeListResponse,
  type OperatorFlowReturnedEnvelopeIntakeValidationResponse,
} from "@/lib/perspective-ingest/codex-former-local-adapter-operator-flow";

export const CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_MAX_BYTES = 20000;

type IntakeOptions = {
  cwd?: string;
  nowIso?: string;
};

type ResolvedIntakeRef = {
  ref: string;
  absolutePath: string;
  allowedRoot: string;
  blockedReasons: string[];
};

export function listCodexFormerLocalAdapterReturnedEnvelopeIntakeRefs(
  options: IntakeOptions = {},
): OperatorFlowReturnedEnvelopeIntakeListResponse {
  const cwd = options.cwd ?? process.cwd();
  const directoryRef = CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_INTAKE_DIR;
  const directoryPath = resolve(/*turbopackIgnore: true*/ cwd, directoryRef);
  const blockedReasons: string[] = [];
  let entries: OperatorFlowReturnedEnvelopeIntakeEntry[] = [];

  if (!existsSync(directoryPath)) {
    blockedReasons.push("returned envelope intake directory does not exist");
  } else {
    const directoryStat = lstatSync(directoryPath);
    if (directoryStat.isSymbolicLink()) {
      blockedReasons.push("returned envelope intake directory must not be a symlink");
    } else if (!directoryStat.isDirectory()) {
      blockedReasons.push("returned envelope intake path must be a directory");
    }
  }

  if (blockedReasons.length === 0) {
    entries = readdirSync(directoryPath, { withFileTypes: true })
      .map((dirent) =>
        buildReturnedEnvelopeIntakeEntry(
          `${directoryRef}/${dirent.name}`,
          {
            cwd,
            direntIsRegularFile: dirent.isFile(),
            direntIsDirectory: dirent.isDirectory(),
            direntIsSymbolicLink: dirent.isSymbolicLink(),
          },
        ),
      )
      .sort(compareIntakeEntries);
  }

  const latest =
    entries
      .filter((entry) => entry.valid)
      .sort((left, right) => right.modified_at.localeCompare(left.modified_at))[0] ??
    null;

  return {
    intake_directory_ref: `${directoryRef}/`,
    max_returned_envelope_bytes:
      CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_MAX_BYTES,
    latest_ref: latest?.ref ?? null,
    latest,
    entries,
    blocked_reasons: uniqueStrings(blockedReasons),
    boundary: CODEX_FORMER_LOCAL_ADAPTER_OPERATOR_FLOW_AUTHORITY_BOUNDARY,
  };
}

export function validateCodexFormerLocalAdapterReturnedEnvelopeIntake(
  input: unknown,
  options: IntakeOptions = {},
): OperatorFlowReturnedEnvelopeIntakeValidationResponse {
  const request = parseValidateRequest(input);
  if (!request.ok) {
    return {
      ...buildOperatorFlowBlockedBeforeExecutionResponse({
        sourceInputRef: request.sourceInputRef,
        prepareSummaryRef: request.prepareSummaryRef,
        returnedEnvelopeText: "",
        blockedReasons: request.blockedReasons,
      }),
      returned_envelope_intake: null,
      returned_envelope_text: null,
    };
  }

  const entry = buildReturnedEnvelopeIntakeEntry(request.value.returnedEnvelopeRef, {
    cwd: options.cwd ?? process.cwd(),
  });
  if (!entry.valid) {
    return {
      ...buildOperatorFlowBlockedBeforeExecutionResponse({
        sourceInputRef: request.value.sourceInputRef,
        prepareSummaryRef: request.value.prepareSummaryRef,
        returnedEnvelopeText: "",
        blockedReasons: entry.blocked_reasons,
      }),
      returned_envelope_intake: entry,
      returned_envelope_text: null,
    };
  }

  const resolved = resolveReturnedEnvelopeIntakeRef(
    request.value.returnedEnvelopeRef,
    options.cwd ?? process.cwd(),
  );
  if (resolved.blockedReasons.length > 0) {
    return {
      ...buildOperatorFlowBlockedBeforeExecutionResponse({
        sourceInputRef: request.value.sourceInputRef,
        prepareSummaryRef: request.value.prepareSummaryRef,
        returnedEnvelopeText: "",
        blockedReasons: resolved.blockedReasons,
      }),
      returned_envelope_intake: entry,
      returned_envelope_text: null,
    };
  }

  const returnedEnvelopeText = readFileSync(
    /*turbopackIgnore: true*/ resolved.absolutePath,
    "utf8",
  );
  return {
    ...runOperatorFlowLocalValidationBridge({
      selected_returned_envelope_fixture_key: null,
      source_input_ref: request.value.sourceInputRef,
      prepare_summary_ref: request.value.prepareSummaryRef,
      returned_envelope_text: returnedEnvelopeText,
    }),
    returned_envelope_intake: entry,
    returned_envelope_text: returnedEnvelopeText,
  };
}

function buildReturnedEnvelopeIntakeEntry(
  returnedEnvelopeRef: string,
  options: IntakeOptions & {
    direntIsRegularFile?: boolean;
    direntIsDirectory?: boolean;
    direntIsSymbolicLink?: boolean;
  } = {},
): OperatorFlowReturnedEnvelopeIntakeEntry {
  const cwd = options.cwd ?? process.cwd();
  const resolved = resolveReturnedEnvelopeIntakeRef(returnedEnvelopeRef, cwd);
  const blockedReasons = [...resolved.blockedReasons];
  let fileSizeBytes = 0;
  let contentHash = "not_available";
  let modifiedAt = "not_available";

  if (options.direntIsDirectory) {
    blockedReasons.push("returned_envelope_ref must point to a regular file");
  }
  if (options.direntIsSymbolicLink) {
    blockedReasons.push("returned_envelope_ref must not be a symlink");
  }
  if (options.direntIsRegularFile === false) {
    blockedReasons.push("returned_envelope_ref must point to a regular file");
  }

  if (blockedReasons.length === 0) {
    try {
      const stat = lstatSync(resolved.absolutePath);
      fileSizeBytes = stat.size;
      modifiedAt = stat.mtime.toISOString();
      if (stat.isSymbolicLink()) {
        blockedReasons.push("returned_envelope_ref must not be a symlink");
      } else if (!stat.isFile()) {
        blockedReasons.push("returned_envelope_ref must point to a regular file");
      } else if (stat.size === 0) {
        blockedReasons.push("returned_envelope_ref file is empty");
      } else if (
        stat.size > CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_MAX_BYTES
      ) {
        blockedReasons.push(
          `returned_envelope_ref exceeds ${CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_MAX_BYTES} bytes`,
        );
      } else {
        const text = readFileSync(
          /*turbopackIgnore: true*/ resolved.absolutePath,
          "utf8",
        );
        contentHash = hashCodexFormerLocalAdapterContent(text);
      }
    } catch (error) {
      blockedReasons.push(
        error instanceof Error
          ? `returned_envelope_ref could not be inspected: ${error.message}`
          : "returned_envelope_ref could not be inspected",
      );
    }
  }

  return {
    ref: returnedEnvelopeRef,
    file_size_bytes: fileSizeBytes,
    content_hash: contentHash,
    modified_at: modifiedAt,
    valid: blockedReasons.length === 0,
    blocked_reasons: uniqueStrings(blockedReasons),
  };
}

function resolveReturnedEnvelopeIntakeRef(
  returnedEnvelopeRef: string,
  cwd: string,
): ResolvedIntakeRef {
  const blockedReasons: string[] = [];
  const ref = returnedEnvelopeRef.trim();
  const allowedDirectory = CODEX_FORMER_LOCAL_ADAPTER_RETURNED_ENVELOPE_INTAKE_DIR;
  const allowedPrefix = `${allowedDirectory}/`;
  const allowedRoot = resolve(
    /*turbopackIgnore: true*/ cwd,
    allowedDirectory,
  );
  const innerRef = ref.startsWith(allowedPrefix)
    ? ref.slice(allowedPrefix.length)
    : "";

  if (!ref) {
    blockedReasons.push("returned_envelope_ref is required");
  }
  if (ref.includes("\0")) {
    blockedReasons.push("returned_envelope_ref must not contain null bytes");
  }
  if (ref.includes("\\")) {
    blockedReasons.push("returned_envelope_ref must use POSIX separators");
  }
  if (isAbsolute(ref)) {
    blockedReasons.push("returned_envelope_ref must be a relative project ref");
  }
  if (posix.normalize(ref) !== ref) {
    blockedReasons.push("returned_envelope_ref must be normalized");
  }
  if (!ref.startsWith(allowedPrefix)) {
    blockedReasons.push(
      `returned_envelope_ref must stay under ${allowedPrefix}`,
    );
  }
  if (ref === allowedPrefix) {
    blockedReasons.push("returned_envelope_ref must point to a file");
  }

  const absolutePath = resolve(
    /*turbopackIgnore: true*/ allowedRoot,
    innerRef,
  );
  const projectRelative = relative(allowedRoot, absolutePath);
  if (
    projectRelative === "" ||
    projectRelative.startsWith("..") ||
    isAbsolute(projectRelative)
  ) {
    blockedReasons.push(
      `returned_envelope_ref resolved outside ${allowedPrefix}`,
    );
  }

  if (blockedReasons.length === 0 && existsSync(absolutePath)) {
    try {
      const realRoot = realpathSync(allowedRoot);
      const realFile = realpathSync(absolutePath);
      const realRelative = relative(realRoot, realFile);
      if (
        realRelative === "" ||
        realRelative.startsWith("..") ||
        isAbsolute(realRelative)
      ) {
        blockedReasons.push(
          `returned_envelope_ref realpath escapes ${allowedPrefix}`,
        );
      }
    } catch (error) {
      blockedReasons.push(
        error instanceof Error
          ? `returned_envelope_ref realpath check failed: ${error.message}`
          : "returned_envelope_ref realpath check failed",
      );
    }
  }

  return {
    ref,
    absolutePath,
    allowedRoot,
    blockedReasons: uniqueStrings(blockedReasons),
  };
}

function parseValidateRequest(input: unknown):
  | {
      ok: true;
      value: {
        returnedEnvelopeRef: string;
        sourceInputRef: string;
        prepareSummaryRef: string;
      };
    }
  | {
      ok: false;
      sourceInputRef: string | null;
      prepareSummaryRef: string | null;
      blockedReasons: string[];
    } {
  if (!isRecord(input)) {
    return {
      ok: false,
      sourceInputRef: null,
      prepareSummaryRef: null,
      blockedReasons: ["request body must be a JSON object"],
    };
  }

  const blockedReasons: string[] = [];
  const returnedEnvelopeRef = readString(input.returned_envelope_ref);
  const sourceInputRef = readString(input.source_input_ref);
  const prepareSummaryRef = readString(input.prepare_summary_ref);

  if (!returnedEnvelopeRef) blockedReasons.push("returned_envelope_ref is required");
  if (!sourceInputRef) blockedReasons.push("source_input_ref is required");
  if (!prepareSummaryRef) blockedReasons.push("prepare_summary_ref is required");

  if (!returnedEnvelopeRef || !sourceInputRef || !prepareSummaryRef) {
    return {
      ok: false,
      sourceInputRef,
      prepareSummaryRef,
      blockedReasons,
    };
  }

  return {
    ok: true,
    value: {
      returnedEnvelopeRef,
      sourceInputRef,
      prepareSummaryRef,
    },
  };
}

function compareIntakeEntries(
  left: OperatorFlowReturnedEnvelopeIntakeEntry,
  right: OperatorFlowReturnedEnvelopeIntakeEntry,
) {
  if (left.valid !== right.valid) return left.valid ? -1 : 1;
  const modified = right.modified_at.localeCompare(left.modified_at);
  return modified === 0 ? left.ref.localeCompare(right.ref) : modified;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values));
}
