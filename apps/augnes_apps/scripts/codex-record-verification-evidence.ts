import { pathToFileURL } from "node:url";
import { z } from "zod";

const DEFAULT_API_BASE_URL = "http://localhost:3000";
const DEFAULT_SCOPE = "project:augnes";
const DEFAULT_SOURCE_SURFACE = "codex";
const DEFAULT_CREATED_BY = "codex";

const EvidenceKindSchema = z.enum([
  "command_run",
  "check_passed",
  "check_failed",
  "check_skipped",
  "replay_observed",
  "duplicate_block_observed",
]);

const EvidenceStatusSchema = z.enum([
  "passed",
  "failed",
  "skipped",
  "observed",
  "blocked",
  "needs_review",
]);

const MetadataSchema = z.record(z.unknown());

const EvidenceInputSchema = z.object({
  scope: z.string().min(1).optional(),
  work_id: z.string().min(1).optional(),
  publication_id: z.string().min(1).optional(),
  delivery_id: z.string().min(1).optional(),
  target_surface: z.string().min(1).optional(),
  target_ref: z.string().min(1).optional(),
  evidence_kind: EvidenceKindSchema,
  label: z.string().min(1),
  status: EvidenceStatusSchema,
  command: z.string().min(1).optional(),
  result_summary: z.string().min(1),
  skipped_reason: z.string().min(1).optional(),
  observed_behavior: z.string().min(1).optional(),
  source_surface: z.string().min(1),
  source_ref: z.string().min(1).optional(),
  related_action_id: z.string().min(1).optional(),
  related_work_event_id: z.string().min(1).optional(),
  metadata: MetadataSchema.optional(),
  created_by: z.string().min(1),
});

const EvidenceBatchSchema = z.array(EvidenceInputSchema).min(1);

type EvidenceInput = z.infer<typeof EvidenceInputSchema>;

type EvidenceRecordResponse = {
  scope?: unknown;
  record?: {
    evidence_id?: unknown;
    evidence_kind?: unknown;
    status?: unknown;
    scope?: unknown;
    work_id?: unknown;
    publication_id?: unknown;
    delivery_id?: unknown;
  };
};

type EvidenceRunConfig = {
  apiBaseUrl: string;
  inputs: EvidenceInput[];
};

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function readDefaultedEnv(names: string[], fallback: string): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }

  return fallback;
}

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function readOptionalJsonObjectEnv(name: string): Record<string, unknown> | undefined {
  const raw = readOptionalEnv(name);
  if (!raw) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`${name} must be a valid JSON object string.`);
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${name} must be a JSON object string.`);
  }

  return parsed as Record<string, unknown>;
}

function readOptionalJsonArrayEnv(name: string): unknown[] | undefined {
  const raw = readOptionalEnv(name);
  if (!raw) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error(`${name} must be a valid JSON array string.`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`${name} must be a JSON array string.`);
  }

  return parsed;
}

function cleanOptionalInput(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );
}

function validateEvidenceInput(input: EvidenceInput, sourceLabel: string): EvidenceInput {
  if (input.evidence_kind === "command_run" && !input.command) {
    throw new Error(`${sourceLabel}: CODEX_COMMAND is required when evidence_kind is command_run.`);
  }

  if (input.evidence_kind === "check_skipped" && !input.skipped_reason) {
    throw new Error(
      `${sourceLabel}: CODEX_SKIPPED_REASON is required when evidence_kind is check_skipped.`,
    );
  }

  if (
    input.evidence_kind === "replay_observed" &&
    !input.delivery_id &&
    !input.publication_id &&
    !input.source_ref
  ) {
    throw new Error(
      `${sourceLabel}: replay_observed requires CODEX_DELIVERY_ID, CODEX_PUBLICATION_ID, or CODEX_SOURCE_REF.`,
    );
  }

  if (
    input.evidence_kind === "duplicate_block_observed" &&
    !input.delivery_id &&
    !input.publication_id &&
    !input.target_ref &&
    !input.source_ref
  ) {
    throw new Error(
      `${sourceLabel}: duplicate_block_observed requires CODEX_DELIVERY_ID, CODEX_PUBLICATION_ID, CODEX_TARGET_REF, or CODEX_SOURCE_REF.`,
    );
  }

  return input;
}

function readSingleInputFromEnv(): EvidenceInput {
  const input = cleanOptionalInput({
    scope: readDefaultedEnv(["CODEX_SCOPE", "AUGNES_SCOPE"], DEFAULT_SCOPE),
    work_id: readOptionalEnv("CODEX_WORK_ID"),
    publication_id: readOptionalEnv("CODEX_PUBLICATION_ID"),
    delivery_id: readOptionalEnv("CODEX_DELIVERY_ID"),
    target_surface: readOptionalEnv("CODEX_TARGET_SURFACE"),
    target_ref: readOptionalEnv("CODEX_TARGET_REF"),
    evidence_kind: readRequiredEnv("CODEX_EVIDENCE_KIND"),
    label: readRequiredEnv("CODEX_EVIDENCE_LABEL"),
    status: readRequiredEnv("CODEX_EVIDENCE_STATUS"),
    command: readOptionalEnv("CODEX_COMMAND"),
    result_summary: readRequiredEnv("CODEX_RESULT_SUMMARY"),
    skipped_reason: readOptionalEnv("CODEX_SKIPPED_REASON"),
    observed_behavior: readOptionalEnv("CODEX_OBSERVED_BEHAVIOR"),
    source_surface: readDefaultedEnv(["CODEX_SOURCE_SURFACE"], DEFAULT_SOURCE_SURFACE),
    source_ref: readOptionalEnv("CODEX_SOURCE_REF"),
    related_action_id: readOptionalEnv("CODEX_RELATED_ACTION_ID"),
    related_work_event_id: readOptionalEnv("CODEX_RELATED_WORK_EVENT_ID"),
    metadata: readOptionalJsonObjectEnv("CODEX_METADATA_JSON"),
    created_by: readDefaultedEnv(["CODEX_CREATED_BY"], DEFAULT_CREATED_BY),
  });

  const parsed = EvidenceInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(`CODEX_RECORD_EVIDENCE_INVALID_INPUT ${parsed.error.message}`);
  }

  return validateEvidenceInput(parsed.data, "single record");
}

function readBatchInputFromEnv(): EvidenceInput[] | undefined {
  const batch = readOptionalJsonArrayEnv("CODEX_EVIDENCE_BATCH_JSON");
  if (!batch) return undefined;

  const normalizedBatch = batch.map((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      return item;
    }

    return {
      scope: DEFAULT_SCOPE,
      source_surface: DEFAULT_SOURCE_SURFACE,
      created_by: DEFAULT_CREATED_BY,
      ...(item as Record<string, unknown>),
    };
  });

  const parsed = EvidenceBatchSchema.safeParse(normalizedBatch);
  if (!parsed.success) {
    throw new Error(`CODEX_RECORD_EVIDENCE_INVALID_BATCH ${parsed.error.message}`);
  }

  return parsed.data.map((input, index) =>
    validateEvidenceInput(input, `batch record ${index + 1}`),
  );
}

export function resolveRecordEvidenceConfig(): EvidenceRunConfig {
  const apiBaseUrl = trimTrailingSlash(
    readDefaultedEnv(["AUGNES_API_BASE_URL"], DEFAULT_API_BASE_URL),
  );
  const batch = readBatchInputFromEnv();

  return {
    apiBaseUrl,
    inputs: batch ?? [readSingleInputFromEnv()],
  };
}

function buildEvidenceRecordsUrl(apiBaseUrl: string): URL {
  try {
    return new URL("/api/evidence/records", `${apiBaseUrl}/`);
  } catch {
    throw new Error("CODEX_RECORD_EVIDENCE_INVALID_BASE_URL");
  }
}

function buildReviewUrl(
  apiBaseUrl: string,
  pathname: string,
  params: Record<string, string | undefined>,
): string {
  let url: URL;
  try {
    url = new URL(pathname, `${apiBaseUrl}/`);
  } catch {
    throw new Error("CODEX_RECORD_EVIDENCE_INVALID_BASE_URL");
  }

  for (const [key, value] of Object.entries(params)) {
    if (value) url.searchParams.set(key, value);
  }

  return url.toString();
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error("CODEX_RECORD_EVIDENCE_INVALID_JSON");
  }
}

function stringifyServerError(value: unknown): string {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export async function recordEvidenceInput(
  apiBaseUrl: string,
  input: EvidenceInput,
): Promise<EvidenceRecordResponse> {
  let response: Response;
  try {
    response = await fetch(buildEvidenceRecordsUrl(apiBaseUrl), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    throw new Error("CODEX_RECORD_EVIDENCE_RUNTIME_UNAVAILABLE");
  }

  const parsed = await readJson(response);
  if (!response.ok) {
    throw new Error(
      `CODEX_RECORD_EVIDENCE_REQUEST_FAILED status=${response.status} body=${stringifyServerError(parsed)}`,
    );
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("CODEX_RECORD_EVIDENCE_INVALID_RESPONSE");
  }

  return parsed as EvidenceRecordResponse;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }

  return undefined;
}

function printEvidenceSummary(
  index: number,
  apiBaseUrl: string,
  input: EvidenceInput,
  result: EvidenceRecordResponse,
) {
  const record = result.record ?? {};
  const suffix = index > 0 ? ` ${index + 1}` : "";
  const scope = firstString(record.scope, result.scope, input.scope) ?? DEFAULT_SCOPE;
  const workId = firstString(record.work_id, input.work_id);
  const publicationId = firstString(record.publication_id, input.publication_id);
  const deliveryId = firstString(record.delivery_id, input.delivery_id);
  const targetRef = firstString(input.target_ref);

  console.log(`Augnes verification evidence recorded${suffix}`);
  console.log(`evidence_id: ${String(record.evidence_id ?? "(none returned)")}`);
  console.log(`evidence_kind: ${String(record.evidence_kind ?? "(none returned)")}`);
  console.log(`status: ${String(record.status ?? "(none returned)")}`);
  console.log(`scope: ${scope}`);
  if (workId) console.log(`work_id: ${workId}`);
  if (publicationId) console.log(`publication_id: ${publicationId}`);
  if (deliveryId) console.log(`delivery_id: ${deliveryId}`);
  console.log("read_only_review_refs:");
  console.log(
    `evidence_records_url: ${buildReviewUrl(apiBaseUrl, "/api/evidence/records", { scope })}`,
  );
  if (workId) {
    const workBriefPath = `/api/work/${encodeURIComponent(workId)}/brief`;
    console.log(
      `work_brief_url: ${buildReviewUrl(apiBaseUrl, workBriefPath, { scope })}`,
    );
    console.log(
      `evidence_pack_url: ${buildReviewUrl(apiBaseUrl, "/api/evidence-pack", {
        scope,
        work_id: workId,
      })}`,
    );
  } else if (publicationId) {
    console.log(
      `evidence_pack_url: ${buildReviewUrl(apiBaseUrl, "/api/evidence-pack", {
        scope,
        publication_id: publicationId,
      })}`,
    );
  } else if (deliveryId) {
    console.log(
      `evidence_pack_url: ${buildReviewUrl(apiBaseUrl, "/api/evidence-pack", {
        scope,
        delivery_id: deliveryId,
      })}`,
    );
  } else if (targetRef) {
    console.log(
      `evidence_pack_url: ${buildReviewUrl(apiBaseUrl, "/api/evidence-pack", {
        scope,
        target_ref: targetRef,
      })}`,
    );
  }
}

async function main() {
  const config = resolveRecordEvidenceConfig();
  const results = [];

  for (const input of config.inputs) {
    results.push(await recordEvidenceInput(config.apiBaseUrl, input));
  }

  results.forEach((result, index) => {
    const input = config.inputs[index];
    if (!input) throw new Error("CODEX_RECORD_EVIDENCE_MISSING_INPUT_FOR_RESULT");
    printEvidenceSummary(index, config.apiBaseUrl, input, result);
  });
  console.log(
    "This helper records observation evidence only; it does not call GitHub/OpenAI, execute replay, publish, approve, or mutate state authority rows.",
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "CODEX_RECORD_EVIDENCE_FAILED";
    console.error(message);
    process.exitCode = 1;
  });
}
