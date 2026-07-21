export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const RECOVERY_CONTRACT = "augnes.recovery-product.v1" as const;
const MAX_REQUEST_BYTES = 4_096;
const MAX_RESPONSE_BYTES = 256 * 1_024;
const REQUEST_TIMEOUT_MS = 5_000;
const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  Pragma: "no-cache",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "frame-ancestors 'none'",
} as const;

type RecoveryAction = "create_backup" | "restore_backup" | "retry_update";

interface RecoveryActionRequest {
  action: RecoveryAction;
  backup_id?: string;
}

export async function GET(request: Request): Promise<Response> {
  let backupPage: number;
  try {
    backupPage = assertRequestBoundary(request);
  } catch {
    return jsonResponse(
      {
        error_code: "recovery_request_invalid",
        message: "Recovery status is available only from this local Augnes window.",
        retryable: false,
      },
      400,
    );
  }
  let upstream;
  try {
    upstream = await requestSupervisor("GET", undefined, backupPage);
  } catch {
    return unavailableResponse("recovery_control_unavailable");
  }
  if (!upstream.ok) {
    return unavailableResponse("recovery_control_refused");
  }
  try {
    return jsonResponse(normalizeRecoveryStatus(upstream.value), upstream.status);
  } catch {
    return unavailableResponse("recovery_status_invalid");
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertRequestBoundary(request);
    const body = await readRecoveryAction(request);
    const upstream = await requestSupervisor("POST", body);
    const result = normalizeRecoveryActionResult(upstream.value);

    if (
      !upstream.ok &&
      (upstream.status < 400 ||
        upstream.status >= 500 ||
        result.outcome !== "refused")
    ) {
      return actionOutcomeUnknownResponse();
    }

    return jsonResponse(result, publicActionStatus(upstream.status, result));
  } catch (error) {
    if (error instanceof RecoveryRequestError) {
      return jsonResponse(
        {
          accepted: false,
          outcome: "refused",
          reason_code: "recovery_request_invalid",
          next_action: "choose_an_available_recovery_action",
        },
        400,
      );
    }
    return actionOutcomeUnknownResponse();
  }
}

function assertRequestBoundary(request: Request): number {
  const url = new URL(request.url);
  const host = request.headers.get("host");
  if (
    host === null ||
    !/^127\.0\.0\.1(?::(?:[1-9]\d{0,4}))?$/u.test(host) ||
    (host.includes(":") && Number(host.slice(host.lastIndexOf(":") + 1)) > 65_535)
  ) {
    throw new RecoveryRequestError();
  }

  const origin = request.headers.get("origin");
  const expectedOrigin = `http://${host}`;
  if (
    (request.method === "POST" && origin === null) ||
    (origin !== null && origin !== expectedOrigin)
  ) {
    throw new RecoveryRequestError();
  }

  if (request.method !== "GET") {
    if (url.search.length > 0) throw new RecoveryRequestError();
    return 1;
  }
  const entries = [...url.searchParams.entries()];
  if (entries.length === 0) return 1;
  if (
    entries.length !== 1 ||
    entries[0][0] !== "page" ||
    !/^[1-9]\d{0,2}$/u.test(entries[0][1])
  ) {
    throw new RecoveryRequestError();
  }
  const page = Number(entries[0][1]);
  if (!Number.isSafeInteger(page) || page > 100) {
    throw new RecoveryRequestError();
  }
  return page;
}

async function readRecoveryAction(request: Request): Promise<RecoveryActionRequest> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim();
  if (contentType !== "application/json") throw new RecoveryRequestError();

  const declaredLengthValue = request.headers.get("content-length");
  if (declaredLengthValue !== null) {
    if (!/^(0|[1-9]\d*)$/u.test(declaredLengthValue)) {
      throw new RecoveryRequestError();
    }
    const declaredLength = Number(declaredLengthValue);
    if (
      !Number.isSafeInteger(declaredLength) ||
      declaredLength > MAX_REQUEST_BYTES
    ) {
      throw new RecoveryRequestError();
    }
  }

  if (request.body === null) throw new RecoveryRequestError();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const remainingWithDetectionByte =
        MAX_REQUEST_BYTES + 1 - totalBytes;
      if (value.byteLength >= remainingWithDetectionByte) {
        try {
          await reader.cancel();
        } catch {
          // The bounded refusal does not depend on transport cancellation.
        }
        throw new RecoveryRequestError();
      }
      chunks.push(value);
      totalBytes += value.byteLength;
    }
  } finally {
    reader.releaseLock();
  }
  if (totalBytes === 0) {
    throw new RecoveryRequestError();
  }
  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new RecoveryRequestError();
  }
  if (!isRecord(value)) throw new RecoveryRequestError();

  const keys = Object.keys(value).sort();
  if (
    !(keys.length === 1 && keys[0] === "action") &&
    !(
      keys.length === 2 &&
      keys[0] === "action" &&
      keys[1] === "backup_id"
    )
  ) {
    throw new RecoveryRequestError();
  }

  if (
    value.action !== "create_backup" &&
    value.action !== "restore_backup" &&
    value.action !== "retry_update"
  ) {
    throw new RecoveryRequestError();
  }

  if (value.backup_id === undefined) return { action: value.action };
  return {
    action: value.action,
    backup_id: boundedOpaqueString(value.backup_id, 256),
  };
}

async function requestSupervisor(
  method: "GET" | "POST",
  body?: RecoveryActionRequest,
  backupPage = 1,
): Promise<{ ok: boolean; status: number; value: unknown }> {
  const port = runtimeControlPort();
  const instance = requiredEnvironment("AUGNES_RUNTIME_INSTANCE_ID");
  const ownership = requiredEnvironment("AUGNES_RUNTIME_OWNERSHIP_TOKEN");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs());

  try {
    const recoveryUrl = new URL(`http://127.0.0.1:${port}/v1/recovery`);
    if (method === "GET") recoveryUrl.searchParams.set("page", String(backupPage));
    const response = await fetch(recoveryUrl, {
      method,
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
        "x-augnes-runtime-instance": instance,
        "x-augnes-child-ownership": ownership,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const declaredLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
      throw new Error("recovery_response_too_large");
    }
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > MAX_RESPONSE_BYTES) {
      throw new Error("recovery_response_too_large");
    }
    return {
      ok: response.ok,
      status: response.status,
      value: JSON.parse(text),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeRecoveryStatus(value: unknown) {
  const root = recordValue(value);
  if (root.contract !== RECOVERY_CONTRACT || root.schema_version !== 1) {
    throw new Error("recovery_contract_invalid");
  }

  const application = recordValue(root.application);
  const database = recordValue(root.database);
  const actions = recordValue(root.actions);
  const rawBackups = root.backups;
  if (!Array.isArray(rawBackups) || rawBackups.length > 100) {
    throw new Error("recovery_backups_invalid");
  }

  const backupIds = new Set<string>();
  const backups = rawBackups.map((entry) => {
    const backup = recordValue(entry);
    const backupId = boundedOpaqueString(backup.backup_id, 256);
    if (backupIds.has(backupId)) throw new Error("recovery_backup_duplicate");
    backupIds.add(backupId);
    const createdAt = boundedPublicString(backup.created_at, 64);
    if (!Number.isFinite(Date.parse(createdAt))) {
      throw new Error("recovery_backup_timestamp_invalid");
    }
    return {
      backup_id: backupId,
      label: boundedPublicString(backup.label, 160),
      created_at: createdAt,
      reason: boundedPublicString(backup.reason, 160),
      source_application_version: boundedPublicString(
        backup.source_application_version,
        80,
      ),
      verified: booleanValue(backup.verified),
    };
  });

  return {
    contract: RECOVERY_CONTRACT,
    schema_version: 1,
    recovery_mode: booleanValue(root.recovery_mode),
    application: {
      version: boundedPublicString(application.version, 80),
      build_identity: publicBuildIdentity(application.build_identity),
      compatibility: boundedEnum(
        application.compatibility,
        ["verified_package", "source_runtime"] as const,
      ),
    },
    database: {
      state: boundedPublicCode(database.state, 80),
      schema_contract: nullableBoundedPublicString(
        database.schema_contract,
        160,
      ),
      schema_classification: boundedEnum(
        database.schema_classification,
        ["current", "old", "incompatible", "unavailable"] as const,
      ),
      migration_state: boundedPublicCode(database.migration_state, 80),
    },
    latest_operation:
      root.latest_operation === null
        ? null
        : normalizeLatestOperation(root.latest_operation),
    backup_inventory_state: boundedEnum(
      root.backup_inventory_state,
      ["available", "unavailable"] as const,
    ),
    backup_count: integerValue(root.backup_count),
    legacy_backup_count: integerValue(root.legacy_backup_count),
    legacy_backup_unavailable_count: integerValue(
      root.legacy_backup_unavailable_count,
    ),
    backup_inventory_truncated: booleanValue(
      root.backup_inventory_truncated,
    ),
    backup_page: boundedPageValue(root.backup_page),
    backup_page_count: boundedPageValue(root.backup_page_count),
    backups,
    actions: {
      create_backup: booleanValue(actions.create_backup),
      retry_update: booleanValue(actions.retry_update),
      restore_backup: booleanValue(actions.restore_backup),
    },
  };
}

function normalizeLatestOperation(value: unknown) {
  const operation = recordValue(value);
  return {
    outcome: boundedPublicCode(operation.outcome, 80),
    reason_code: boundedPublicCode(operation.reason_code, 120),
    application_version: nullableBoundedPublicString(
      operation.application_version,
      80,
    ),
    target_application_version: nullableBoundedPublicString(
      operation.target_application_version,
      80,
    ),
    target_build_identity: nullablePublicBuildIdentity(
      operation.target_build_identity,
    ),
    database_state: nullableBoundedPublicCode(
      operation.database_state,
      80,
    ),
    data_preserved: booleanValue(operation.data_preserved),
    backup_verified: booleanValue(operation.backup_verified),
    safety_backup_created: booleanValue(operation.safety_backup_created),
    next_action: boundedPublicCode(operation.next_action, 128),
  };
}

function normalizeRecoveryActionResult(value: unknown) {
  const result = recordValue(value);
  if (
    result.outcome !== "restore_scheduled" &&
    result.outcome !== "retry_scheduled" &&
    result.outcome !== "backup_created" &&
    result.outcome !== "refused"
  ) {
    throw new Error("recovery_action_response_invalid");
  }
  const accepted = booleanValue(result.accepted);
  if (accepted !== (result.outcome !== "refused")) {
    throw new Error("recovery_action_response_invalid");
  }
  return {
    accepted,
    outcome: result.outcome,
    ...(result.reason_code === undefined
      ? {}
      : { reason_code: boundedPublicCode(result.reason_code, 120) }),
    ...(result.next_action === undefined
      ? {}
      : { next_action: boundedPublicCode(result.next_action, 128) }),
  };
}

function publicActionStatus(
  upstreamStatus: number,
  result: ReturnType<typeof normalizeRecoveryActionResult>,
): number {
  if (upstreamStatus >= 200 && upstreamStatus <= 299) return upstreamStatus;
  if (result.outcome === "refused") return 409;
  return 202;
}

function runtimeControlPort(): number {
  const value = requiredEnvironment("AUGNES_RUNTIME_CONTROL_PORT");
  if (!/^\d{1,5}$/.test(value)) throw new Error("recovery_control_unavailable");
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("recovery_control_unavailable");
  }
  return port;
}

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error("recovery_control_unavailable");
  return value;
}

function boundedOpaqueString(value: unknown, maximumLength: number): string {
  if (typeof value !== "string") throw new Error("recovery_value_invalid");
  const text = value.trim();
  if (
    text.length === 0 ||
    text.length > maximumLength ||
    /[\u0000-\u001f\u007f]/.test(text)
  ) {
    throw new Error("recovery_value_invalid");
  }
  return text;
}

function boundedPublicString(value: unknown, maximumLength: number): string {
  const text = boundedOpaqueString(value, maximumLength);
  if (
    /(?:^|\s)(?:\/(?:Users|home|private|tmp|var|Volumes)\/|[a-zA-Z]:[\\/]|file:\/\/)/.test(
      text,
    )
  ) {
    throw new Error("recovery_private_value_refused");
  }
  return text;
}

function boundedPublicCode(value: unknown, maximumLength: number): string {
  const text = boundedOpaqueString(value, maximumLength);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]*$/u.test(text)) {
    throw new Error("recovery_public_code_invalid");
  }
  return text;
}

function nullableBoundedPublicCode(
  value: unknown,
  maximumLength: number,
): string | null {
  return value === null ? null : boundedPublicCode(value, maximumLength);
}

function publicBuildIdentity(value: unknown): string {
  if (
    typeof value !== "string" ||
    (value !== "source_runtime" &&
      !/^sha256:[a-f0-9]{64}$/u.test(value))
  ) {
    throw new Error("recovery_build_identity_invalid");
  }
  return value;
}

function nullablePublicBuildIdentity(value: unknown): string | null {
  return value === null ? null : publicBuildIdentity(value);
}

function nullableBoundedPublicString(
  value: unknown,
  maximumLength: number,
): string | null {
  return value === null ? null : boundedPublicString(value, maximumLength);
}

function booleanValue(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("recovery_value_invalid");
  return value;
}

function integerValue(value: unknown): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error("recovery_value_invalid");
  }
  return value as number;
}

function boundedPageValue(value: unknown): number {
  const page = integerValue(value);
  if (page < 1 || page > 100) throw new Error("recovery_value_invalid");
  return page;
}

function boundedEnum<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
): T[number] {
  if (
    typeof value !== "string" ||
    !(allowed as readonly string[]).includes(value)
  ) {
    throw new Error("recovery_value_invalid");
  }
  return value as T[number];
}

function recordValue(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error("recovery_value_invalid");
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unavailableResponse(
  errorCode = "recovery_service_unavailable",
): Response {
  return jsonResponse(
    {
      error_code: errorCode,
      message:
        "Recovery status is temporarily unavailable. This request did not change your data.",
      retryable: true,
    },
    503,
  );
}

function actionOutcomeUnknownResponse(): Response {
  return jsonResponse(
    {
      outcome: "status_unknown",
      reason_code: "recovery_action_outcome_unknown",
      next_action: "refresh_recovery_status",
      message:
        "Augnes could not confirm whether the recovery action was accepted. Refresh recovery status before choosing another action.",
    },
    504,
  );
}

function requestTimeoutMs(): number {
  if (process.env.AUGNES_CANONICAL_TEST_MODE !== "1") {
    return REQUEST_TIMEOUT_MS;
  }
  const injected = process.env.AUGNES_TEST_RECOVERY_ROUTE_TIMEOUT_MS;
  if (!/^\d{1,4}$/u.test(injected ?? "")) return REQUEST_TIMEOUT_MS;
  const timeout = Number(injected);
  return timeout >= 10 && timeout <= REQUEST_TIMEOUT_MS
    ? timeout
    : REQUEST_TIMEOUT_MS;
}

function jsonResponse(value: unknown, status = 200): Response {
  return Response.json(value, { status, headers: RESPONSE_HEADERS });
}

class RecoveryRequestError extends Error {}
