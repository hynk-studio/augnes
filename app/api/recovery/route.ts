import { getDatabasePath } from "@/lib/db";
import {
  buildRedactedSupportReport,
  readContinuityOperationalStatus,
} from "@/scripts/continuity-operational-status.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const RECOVERY_CONTRACT = "augnes.recovery-product.v2" as const;
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

type RecoveryAction =
  | "create_backup"
  | "verify_backup"
  | "restore_backup"
  | "retry_update"
  | "preview_support_report";

interface RecoveryActionRequest {
  action: RecoveryAction;
  backup_id?: string;
  request_id?: string;
  admission_binding?: string;
  backup_identity?: string;
  target_binding?: string;
  verification_request_id?: string;
}

export async function GET(request: Request): Promise<Response> {
  let query: {page: number; requestId: string | null};
  try {
    query = assertRequestBoundary(request);
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
    upstream = await requestSupervisor("GET", undefined, query.page, query.requestId);
  } catch {
    return unavailableResponse("recovery_control_unavailable");
  }
  if (!upstream.ok) {
    return unavailableResponse("recovery_control_refused");
  }
  try {
    const status = normalizeRecoveryStatus(upstream.value);
    if ((status.operation?.request_id ?? null) !== query.requestId) throw new Error("recovery_request_mismatch");
    return jsonResponse(
      {
        ...status,
        continuity: readContinuityOperationalStatus({
          databasePath: getDatabasePath(),
        }),
      },
      upstream.status,
    );
  } catch {
    return unavailableResponse("recovery_status_invalid");
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    assertRequestBoundary(request);
    const body = await readRecoveryAction(request);
    if (body.action === "preview_support_report") {
      try {
        const upstream = await requestSupervisor("GET");
        if (!upstream.ok) return unavailableResponse("recovery_control_refused");
        const recoveryStatus = normalizeRecoveryStatus(upstream.value);
        const report = (buildRedactedSupportReport as (input: {
          recoveryStatus: unknown;
          continuityStatus: unknown;
          generatedAt?: string;
        }) => Record<string, unknown>)({
          recoveryStatus,
          continuityStatus: readContinuityOperationalStatus({
            databasePath: getDatabasePath(),
          }),
        });
        const byteCount = Buffer.byteLength(JSON.stringify(report), "utf8");
        if (byteCount > 64 * 1_024) {
          return unavailableResponse("support_report_too_large");
        }
        return jsonResponse({
          contract: "augnes.support-report-preview.v1",
          schema_version: 1,
          previewed: true,
          export_format: "application/json",
          byte_count: byteCount,
          report,
        });
      } catch {
        return unavailableResponse("support_report_unavailable");
      }
    }
    const upstream = await requestSupervisor("POST", body);
    const result = normalizeRecoveryActionResult(upstream.value);
    if ((result.outcome === "operation_recorded" || result.outcome === "request_not_admitted") && result.request_id !== body.request_id) throw new Error("recovery_request_mismatch");

    if (
      !upstream.ok &&
      (upstream.status < 400 ||
        upstream.status >= 500 ||
        !["refused", "request_not_admitted"].includes(result.outcome))
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

function assertRequestBoundary(request: Request): {page: number; requestId: string | null} {
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
    return {page:1,requestId:null};
  }
  const requestIds=url.searchParams.getAll("request_id");
  if(requestIds.length>1)throw new RecoveryRequestError();
  const requestId=requestIds.length?uuidValue(requestIds[0]):null;
  const entries = [...url.searchParams.entries()].filter(([key])=>key!=="request_id");
  if (entries.length === 0) return {page:1,requestId};
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
  return {page,requestId};
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

  try {
    if(value.action === "create_backup" || value.action === "verify_backup") {
      return normalizeAdmissionMaterial(value);
    }
    if(value.action === "preview_support_report"){exactKeys(value,["action"]);return {action:value.action};}
    if(value.action === "retry_update"){exactKeys(value,["action","verification_request_id"]);return {action:value.action,verification_request_id:uuidValue(value.verification_request_id)};}
    if(value.action === "restore_backup"){exactKeys(value,["action","backup_id","verification_request_id"]);return {action:value.action,backup_id:backupIdValue(value.backup_id),verification_request_id:uuidValue(value.verification_request_id)};}
  } catch { throw new RecoveryRequestError(); }
  throw new RecoveryRequestError();
}

function normalizeAdmissionMaterial(value: Record<string, unknown>) {
  const action = boundedEnum(value.action, ["create_backup", "verify_backup"] as const);
  exactKeys(value, action === "create_backup" ? ["action","request_id","admission_binding"] : ["action","request_id","admission_binding","backup_id","backup_identity","target_binding"]);
  return {action,request_id:uuidValue(value.request_id),admission_binding:uuidValue(value.admission_binding),...(action === "verify_backup"?{backup_id:backupIdValue(value.backup_id),backup_identity:shaValue(value.backup_identity),target_binding:shaValue(value.target_binding)}:{})};
}

async function requestSupervisor(
  method: "GET" | "POST",
  body?: RecoveryActionRequest,
  backupPage = 1,
  requestId: string | null = null,
): Promise<{ ok: boolean; status: number; value: unknown }> {
  const port = runtimeControlPort();
  const instance = requiredEnvironment("AUGNES_RUNTIME_INSTANCE_ID");
  const ownership = requiredEnvironment("AUGNES_RUNTIME_OWNERSHIP_TOKEN");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs());

  try {
    const recoveryUrl = new URL(`http://127.0.0.1:${port}/v1/recovery`);
    if (method === "GET") { recoveryUrl.searchParams.set("page", String(backupPage)); if(requestId) recoveryUrl.searchParams.set("request_id", requestId); }
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
  if (root.contract !== RECOVERY_CONTRACT || root.schema_version !== 2) {
    throw new Error("recovery_contract_invalid");
  }

  exactKeys(root,["contract","schema_version","recovery_mode","application","database","runtime","latest_operation","backup_inventory_state","backup_count","legacy_backup_count","legacy_backup_unavailable_count","backup_inventory_truncated","backup_page","backup_page_count","backups","actions","admission_binding","operation"]);
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
    exactKeys(backup,["backup_id","backup_identity","target_binding","label","created_at","reason","source_application_version","verified"]);
    const backupId = backupIdValue(backup.backup_id);
    if(backup.verified!==false)throw new Error("metadata_not_validation");
    if (backupIds.has(backupId)) throw new Error("recovery_backup_duplicate");
    backupIds.add(backupId);
    const createdAt = boundedPublicString(backup.created_at, 64);
    if (!Number.isFinite(Date.parse(createdAt))) {
      throw new Error("recovery_backup_timestamp_invalid");
    }
    return {
      backup_id: backupId,
      backup_identity: shaValue(backup.backup_identity),
      target_binding: shaValue(backup.target_binding),
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
    schema_version: 2,
    admission_binding:root.admission_binding===null?null:uuidValue(root.admission_binding),
    operation:normalizeRequestOperation(root.operation),
    recovery_mode: booleanValue(root.recovery_mode),
    application: {
      version: boundedPublicString(application.version, 80),
      build_identity: publicBuildIdentity(application.build_identity),
      package_contract: nullableBoundedPublicString(
        application.package_contract,
        160,
      ),
      package_contract_version: nullableIntegerValue(
        application.package_contract_version,
      ),
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
    runtime: normalizeRuntimeStatus(root.runtime),
    latest_operation:
      root.latest_operation === null
        ? null
        : normalizeLatestOperation(root.latest_operation),
    backup_inventory_state: boundedEnum(
      root.backup_inventory_state,
      ["metadata_only", "unavailable"] as const,
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
      verify_backup: booleanValue(actions.verify_backup),
      retry_update: booleanValue(actions.retry_update),
      restore_backup: booleanValue(actions.restore_backup),
    },
  };
}

function normalizeRuntimeStatus(value: unknown) {
  const runtimeStatus = recordValue(value);
  return {
    runtime_contract: nullableBoundedPublicString(
      runtimeStatus.runtime_contract,
      160,
    ),
    runtime_schema_version: nullableIntegerValue(
      runtimeStatus.runtime_schema_version,
    ),
    lifecycle_state: boundedPublicCode(runtimeStatus.lifecycle_state, 80),
    bridge_health: boundedPublicCode(runtimeStatus.bridge_health, 80),
    capability_availability: boundedPublicCode(
      runtimeStatus.capability_availability,
      80,
    ),
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
    result.outcome !== "operation_recorded" &&
    result.outcome !== "request_not_admitted" &&
    result.outcome !== "refused"
  ) {
    throw new Error("recovery_action_response_invalid");
  }
  exactKeys(result,["accepted","outcome",...(result.request_id===undefined?[]:["request_id"]),...(result.reason_code===undefined?[]:["reason_code"]),...(result.next_action===undefined?[]:["next_action"])]);
  if((["operation_recorded", "request_not_admitted"].includes(result.outcome)) !== (result.request_id!==undefined)) throw new Error("recovery_action_response_invalid");
  if (result.outcome === "request_not_admitted" && !["recovery_action_in_progress", "recovery_backup_changed"].includes(String(result.reason_code))) throw new Error("recovery_action_response_invalid");
  const accepted = booleanValue(result.accepted);
  if (accepted !== (!["refused", "request_not_admitted"].includes(result.outcome))) {
    throw new Error("recovery_action_response_invalid");
  }
  return {
    accepted,
    outcome: result.outcome,
    ...(result.request_id===undefined?{}:{request_id:uuidValue(result.request_id)}),
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
  if (result.outcome === "refused" || result.outcome === "request_not_admitted") return 409;
  return 202;
}

function exactKeys(value: Record<string, unknown>, keys: string[]) {
    if (Object.keys(value).sort().join("|") !== keys.sort().join("|"))
        throw new Error("recovery_value_invalid");
}
function uuidValue(value: unknown): string {
    if (typeof value !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(value))
        throw new Error("recovery_id_invalid");
    return value;
}
function shaValue(value: unknown): string {
    if (typeof value !== "string" || !/^sha256:[a-f0-9]{64}$/u.test(value))
        throw new Error("recovery_identity_invalid");
    return value;
}
function backupIdValue(value: unknown): string {
    if (typeof value !== "string" || !/^recovery:[0-9a-f-]{36}$/iu.test(value))
        throw new Error("recovery_id_invalid");
    return value;
}
function normalizeRequestOperation(value: unknown) {
    if (value === null)
        return null;
    const row = recordValue(value);
    const known = row.action !== undefined;
    const notAdmitted = row.state === "not_admitted";
    exactKeys(row, ["request_id", "state", "reason", "result", ...(known ? ["action", "accepted_at", "finished_at", "observation_boundary"] : []), ...(notAdmitted ? ["request"] : [])]);
    const state = boundedEnum(row.state, ["accepted", "running", "completed", "failed", "interrupted", "unknown", "stale", "not_admitted"] as const);
    const request = notAdmitted ? normalizeAdmissionMaterial(recordValue(row.request)) : null;
    if (notAdmitted && (!request || row.accepted_at !== null || row.finished_at === null || request.request_id !== row.request_id || request.action !== row.action ||
        !["recovery_action_in_progress", "recovery_backup_changed"].includes(String(row.reason)))) throw new Error("recovery_operation_invalid");
    const result = row.result === null ? null : recordValue(row.result);
    if (!known && (state !== "unknown" || result !== null))
        throw new Error("recovery_operation_invalid");
    if (result) {
        exactKeys(result, ["backup_id", "backup_identity", "target_binding", "verified_at", "validator_contract", "application_version", "build_identity", "runtime_contract", "runtime_schema_version", "creation_completed"]);
        if (result.validator_contract !== "augnes.recovery-backup.v1" || result.runtime_contract !== "augnes-local-runtime-supervisor-v1" || result.runtime_schema_version !== 2 || !Number.isFinite(Date.parse(String(result.verified_at))))
            throw new Error("recovery_validation_result_invalid");
    }
    if ((state === "completed" || state === "stale") !== (result !== null))
        throw new Error("recovery_validation_result_invalid");
    if (known && ((!notAdmitted && !Number.isFinite(Date.parse(String(row.accepted_at)))) || (row.finished_at !== null && !Number.isFinite(Date.parse(String(row.finished_at))))))
        throw new Error("recovery_operation_invalid");
    if (result && booleanValue(result.creation_completed) !== (row.action === "create_backup"))
        throw new Error("recovery_validation_result_invalid");
    return { request_id: uuidValue(row.request_id), state, reason: row.reason === null ? null : boundedPublicCode(row.reason, 120),
        ...(known ? { action: boundedEnum(row.action, ["create_backup", "verify_backup"] as const), accepted_at: notAdmitted ? null : boundedPublicString(row.accepted_at, 64), finished_at: nullableBoundedPublicString(row.finished_at, 64), observation_boundary: boundedEnum(row.observation_boundary, notAdmitted ? ["request_not_admitted"] as const : ["exact_operation_validation_not_perpetual_freshness"] as const) } : {}),
        ...(request ? {request} : {}),
        result: result ? { backup_id: backupIdValue(result.backup_id), backup_identity: shaValue(result.backup_identity), target_binding: shaValue(result.target_binding), verified_at: boundedPublicString(result.verified_at, 64), validator_contract: "augnes.recovery-backup.v1", application_version: boundedPublicString(result.application_version, 80), build_identity: nullablePublicBuildIdentity(result.build_identity), runtime_contract: "augnes-local-runtime-supervisor-v1", runtime_schema_version: 2, creation_completed: booleanValue(result.creation_completed) } : null };
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

function nullableIntegerValue(value: unknown): number | null {
  return value === null ? null : integerValue(value);
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
