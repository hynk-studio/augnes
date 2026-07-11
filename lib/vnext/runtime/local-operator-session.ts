import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";

import {
  readVNextLocalRuntimeClockNowV01,
  type VNextLocalRuntimeClockV01,
} from "@/lib/vnext/runtime/local-runtime-clock";

export const VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 =
  "augnes_vnext_operator_session_v01" as const;
export const VNEXT_LOCAL_OPERATOR_MAX_BODY_BYTES_V01 = 16 * 1024;
export const VNEXT_LOCAL_OPERATOR_BOOTSTRAP_TTL_MS_V01 = 10 * 60 * 1000;
export const VNEXT_LOCAL_OPERATOR_SESSION_TTL_MS_V01 = 8 * 60 * 60 * 1000;

const SESSION_ID_PREFIX = "vnext-local-operator-session:";
const BOOTSTRAP_TOKEN_PREFIX = "vnext_bootstrap_v01";
const SESSION_COOKIE_PREFIX = "vnext_session_v01";
const MAX_CREDENTIAL_CHARACTERS = 1024;
const MAX_COOKIE_HEADER_CHARACTERS = 4096;
const MAX_ID_CHARACTERS = 256;
const FORWARDED_HEADERS = [
  "forwarded",
  "x-forwarded-for",
  "x-forwarded-host",
  "x-forwarded-port",
  "x-forwarded-proto",
  "x-original-host",
] as const;

export const VNEXT_LOCAL_OPERATOR_SESSION_SCHEMA_SQL_V01 = `
  CREATE TABLE IF NOT EXISTS vnext_local_operator_sessions (
    session_id TEXT PRIMARY KEY CHECK (
      length(trim(session_id)) > 0 AND length(session_id) <= 256
    ),
    workspace_id TEXT NOT NULL CHECK (
      length(trim(workspace_id)) > 0 AND length(workspace_id) <= 256
    ),
    project_id TEXT NOT NULL CHECK (
      length(trim(project_id)) > 0 AND length(project_id) <= 256
    ),
    operator_id TEXT NOT NULL CHECK (
      length(trim(operator_id)) > 0 AND length(operator_id) <= 256
    ),
    bootstrap_token_hash TEXT NOT NULL UNIQUE CHECK (
      length(bootstrap_token_hash) = 71 AND
      substr(bootstrap_token_hash, 1, 7) = 'sha256:'
    ),
    session_token_hash TEXT UNIQUE CHECK (
      session_token_hash IS NULL OR
      (length(session_token_hash) = 71 AND
       substr(session_token_hash, 1, 7) = 'sha256:')
    ),
    issued_at TEXT NOT NULL CHECK (length(trim(issued_at)) > 0),
    expires_at TEXT NOT NULL CHECK (length(trim(expires_at)) > 0),
    bootstrap_consumed_at TEXT,
    revoked_at TEXT,
    action_nonce_hash TEXT UNIQUE CHECK (
      action_nonce_hash IS NULL OR
      (length(action_nonce_hash) = 71 AND
       substr(action_nonce_hash, 1, 7) = 'sha256:')
    ),
    action_nonce_expires_at TEXT,
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    CHECK (
      (bootstrap_consumed_at IS NULL AND
       session_token_hash IS NULL AND
       action_nonce_hash IS NULL AND
       action_nonce_expires_at IS NULL) OR
      (bootstrap_consumed_at IS NOT NULL AND
       session_token_hash IS NOT NULL AND
       action_nonce_hash IS NOT NULL AND
       action_nonce_expires_at IS NOT NULL)
    )
  );

  CREATE INDEX IF NOT EXISTS idx_vnext_local_operator_sessions_scope_expiry
    ON vnext_local_operator_sessions(
      workspace_id, project_id, operator_id, revoked_at, expires_at, session_id
    );
`;

export type VNextLocalOperatorSessionErrorCodeV01 =
  | "operator_pilot_disabled"
  | "operator_pilot_config_invalid"
  | "operator_pilot_db_path_required"
  | "operator_pilot_db_path_invalid"
  | "operator_pilot_db_missing"
  | "operator_pilot_schema_uninitialized"
  | "operator_pilot_body_too_large"
  | "operator_pilot_content_type_unsupported"
  | "operator_pilot_body_invalid"
  | "operator_pilot_request_invalid"
  | "local_operator_host_required"
  | "forwarded_header_forbidden"
  | "same_origin_required"
  | "operator_session_cookie_missing"
  | "operator_session_cookie_invalid"
  | "operator_bootstrap_invalid"
  | "operator_bootstrap_consumed"
  | "operator_session_expired"
  | "operator_session_revoked"
  | "operator_session_scope_mismatch"
  | "operator_session_invalid"
  | "operator_action_nonce_invalid"
  | "operator_action_nonce_expired"
  | "operator_session_not_found"
  | "operator_session_conflict";

export class VNextLocalOperatorSessionErrorV01 extends Error {
  readonly code: VNextLocalOperatorSessionErrorCodeV01;
  readonly status: number;

  constructor(
    code: VNextLocalOperatorSessionErrorCodeV01,
    status: number,
  ) {
    super(code);
    this.name = "VNextLocalOperatorSessionErrorV01";
    this.code = code;
    this.status = status;
  }
}

export interface VNextLocalOperatorPilotConfigV01 {
  enabled: true;
  workspace_id: string;
  project_id: string;
  operator_id: string;
  database_path: string;
}

export interface VNextLocalOperatorSecretSourceV01 {
  bytes(size: number): Uint8Array;
}

export interface VNextLocalOperatorSessionPublicV01 {
  session_id: string;
  workspace_id: string;
  project_id: string;
  operator_id: string;
  issued_at: string;
  expires_at: string;
  bootstrap_consumed_at: string | null;
  revoked_at: string | null;
  action_nonce_expires_at: string | null;
  authenticated: boolean;
}

export interface VNextLocalOperatorBootstrapIssueV01 {
  session: VNextLocalOperatorSessionPublicV01;
  bootstrap_token: string;
}

export interface VNextLocalOperatorSessionCredentialV01 {
  session_id: string;
  session_secret: string;
  action_nonce: string;
}

export interface VNextLocalOperatorSessionAuthenticationV01 {
  session: VNextLocalOperatorSessionPublicV01;
  credential: VNextLocalOperatorSessionCredentialV01;
}

export interface VNextLocalOperatorSessionMutationAdmissionV01
  extends VNextLocalOperatorSessionAuthenticationV01 {
  cookie_value: string;
  cookie_expires_at: string;
  cookie_max_age_seconds: number;
}

interface LocalOperatorSessionRowV01 {
  session_id: string;
  workspace_id: string;
  project_id: string;
  operator_id: string;
  bootstrap_token_hash: string;
  session_token_hash: string | null;
  issued_at: string;
  expires_at: string;
  bootstrap_consumed_at: string | null;
  revoked_at: string | null;
  action_nonce_hash: string | null;
  action_nonce_expires_at: string | null;
  updated_at: string;
}

const SYSTEM_SECRET_SOURCE: VNextLocalOperatorSecretSourceV01 = Object.freeze({
  bytes: (size: number) => randomBytes(size),
});

export function readVNextLocalOperatorPilotConfigV01(
  environment: NodeJS.ProcessEnv = process.env,
): VNextLocalOperatorPilotConfigV01 {
  if (environment.AUGNES_VNEXT_OPERATOR_PILOT_ENABLED !== "1") {
    throw sessionError("operator_pilot_disabled", 404);
  }
  const workspaceId = requiredCanonicalId(
    environment.AUGNES_VNEXT_OPERATOR_WORKSPACE_ID,
  );
  const projectId = requiredCanonicalId(
    environment.AUGNES_VNEXT_OPERATOR_PROJECT_ID,
  );
  const operatorId = requiredCanonicalId(
    environment.AUGNES_VNEXT_OPERATOR_ID,
  );
  if (!workspaceId || !projectId || !operatorId) {
    throw sessionError("operator_pilot_config_invalid", 503);
  }

  const configuredPath = environment.AUGNES_DB_PATH;
  if (!configuredPath || configuredPath.trim().length === 0) {
    throw sessionError("operator_pilot_db_path_required", 503);
  }
  const databasePath = normalizeExplicitDatabasePath(configuredPath);
  if (!databasePath) {
    throw sessionError("operator_pilot_db_path_invalid", 503);
  }
  return {
    enabled: true,
    workspace_id: workspaceId,
    project_id: projectId,
    operator_id: operatorId,
    database_path: databasePath,
  };
}

export function openVNextLocalOperatorDatabaseV01(
  config: VNextLocalOperatorPilotConfigV01,
): Database.Database {
  if (!existsSync(config.database_path)) {
    throw sessionError("operator_pilot_db_missing", 503);
  }
  let db: Database.Database | null = null;
  try {
    if (!statSync(config.database_path).isFile()) {
      throw sessionError("operator_pilot_db_path_invalid", 503);
    }
    db = new Database(config.database_path, { fileMustExist: true });
    db.pragma("foreign_keys = ON");
    db.pragma("busy_timeout = 5000");
    assertVNextLocalOperatorSessionSchemaV01(db);
    return db;
  } catch (error) {
    db?.close();
    if (error instanceof VNextLocalOperatorSessionErrorV01) throw error;
    throw sessionError("operator_pilot_db_missing", 503);
  }
}

export function assertVNextLocalOperatorSessionSchemaV01(
  db: Database.Database,
): void {
  const requiredArtifacts = [
    ["table", "vnext_local_operator_sessions"],
    ["index", "idx_vnext_local_operator_sessions_scope_expiry"],
  ] as const;
  const lookup = db.prepare(
    "SELECT 1 FROM sqlite_master WHERE type = ? AND name = ?",
  );
  if (requiredArtifacts.some(([type, name]) => !lookup.get(type, name))) {
    throw sessionError("operator_pilot_schema_uninitialized", 503);
  }
}

export function issueVNextLocalOperatorBootstrapV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
    bootstrap_ttl_ms?: number;
  },
): VNextLocalOperatorBootstrapIssueV01 {
  assertVNextLocalOperatorSessionSchemaV01(db);
  const now = readVNextLocalRuntimeClockNowV01(
    input.clock,
    "operator_session_issued_at",
  );
  const ttl = boundedTtl(
    input.bootstrap_ttl_ms,
    VNEXT_LOCAL_OPERATOR_BOOTSTRAP_TTL_MS_V01,
    VNEXT_LOCAL_OPERATOR_BOOTSTRAP_TTL_MS_V01,
  );
  const expiresAt = addMilliseconds(now, ttl);
  const source = input.secret_source ?? SYSTEM_SECRET_SOURCE;
  const sessionId = `${SESSION_ID_PREFIX}${randomBase64Url(source, 16)}`;
  const bootstrapToken = [
    BOOTSTRAP_TOKEN_PREFIX,
    sessionId,
    randomBase64Url(source, 32),
  ].join(".");
  const row: LocalOperatorSessionRowV01 = {
    session_id: sessionId,
    workspace_id: input.config.workspace_id,
    project_id: input.config.project_id,
    operator_id: input.config.operator_id,
    bootstrap_token_hash: credentialHash("bootstrap", bootstrapToken),
    session_token_hash: null,
    issued_at: now,
    expires_at: expiresAt,
    bootstrap_consumed_at: null,
    revoked_at: null,
    action_nonce_hash: null,
    action_nonce_expires_at: null,
    updated_at: now,
  };

  try {
    withImmediateTransaction(db, () => {
      db.prepare(
        `INSERT INTO vnext_local_operator_sessions (
          session_id, workspace_id, project_id, operator_id,
          bootstrap_token_hash, session_token_hash, issued_at, expires_at,
          bootstrap_consumed_at, revoked_at, action_nonce_hash,
          action_nonce_expires_at, updated_at
        ) VALUES (
          @session_id, @workspace_id, @project_id, @operator_id,
          @bootstrap_token_hash, @session_token_hash, @issued_at, @expires_at,
          @bootstrap_consumed_at, @revoked_at, @action_nonce_hash,
          @action_nonce_expires_at, @updated_at
        )`,
      ).run(row);
    });
  } catch {
    throw sessionError("operator_session_conflict", 409);
  }

  return {
    session: publicSession(row, false),
    bootstrap_token: bootstrapToken,
  };
}

export function consumeVNextLocalOperatorBootstrapV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    bootstrap_token: string;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
    session_ttl_ms?: number;
  },
): VNextLocalOperatorSessionMutationAdmissionV01 {
  assertVNextLocalOperatorSessionSchemaV01(db);
  const parsed = parseBootstrapToken(input.bootstrap_token);
  const now = readVNextLocalRuntimeClockNowV01(
    input.clock,
    "operator_session_bootstrap_consumed_at",
  );
  const ttl = boundedTtl(
    input.session_ttl_ms,
    VNEXT_LOCAL_OPERATOR_SESSION_TTL_MS_V01,
    VNEXT_LOCAL_OPERATOR_SESSION_TTL_MS_V01,
  );
  const expiresAt = addMilliseconds(now, ttl);
  const source = input.secret_source ?? SYSTEM_SECRET_SOURCE;
  const credential: VNextLocalOperatorSessionCredentialV01 = {
    session_id: parsed.session_id,
    session_secret: randomBase64Url(source, 32),
    action_nonce: randomBase64Url(source, 32),
  };

  const row = withImmediateTransaction(db, () => {
    const current = selectSession(db, parsed.session_id);
    assertBootstrapCanBeConsumed(
      current,
      input.config,
      parsed.token,
      now,
    );
    const sessionTokenHash = sessionCredentialHash(credential);
    const actionNonceHash = actionNonceCredentialHash(credential);
    const result = db.prepare(
      `UPDATE vnext_local_operator_sessions SET
        session_token_hash = ?,
        expires_at = ?,
        bootstrap_consumed_at = ?,
        action_nonce_hash = ?,
        action_nonce_expires_at = ?,
        updated_at = ?
       WHERE session_id = ?
         AND bootstrap_consumed_at IS NULL
         AND revoked_at IS NULL
         AND bootstrap_token_hash = ?`,
    ).run(
      sessionTokenHash,
      expiresAt,
      now,
      actionNonceHash,
      expiresAt,
      now,
      parsed.session_id,
      credentialHash("bootstrap", parsed.token),
    );
    if (result.changes !== 1) {
      throw sessionError("operator_bootstrap_consumed", 409);
    }
    return requireSession(db, parsed.session_id);
  });

  return sessionAdmission(row, credential, now);
}

export function readVNextLocalOperatorCredentialFromRequestV01(
  request: Request,
): VNextLocalOperatorSessionCredentialV01 {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) {
    throw sessionError("operator_session_cookie_missing", 401);
  }
  if (cookieHeader.length > MAX_COOKIE_HEADER_CHARACTERS) {
    throw sessionError("operator_session_cookie_invalid", 401);
  }
  const values = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter((part) => part.startsWith(`${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=`))
    .map((part) => part.slice(part.indexOf("=") + 1));
  if (values.length !== 1) {
    throw sessionError("operator_session_cookie_invalid", 401);
  }
  return parseSessionCookieValue(values[0]);
}

export function authenticateVNextLocalOperatorSessionV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    clock?: VNextLocalRuntimeClockV01;
  },
): VNextLocalOperatorSessionAuthenticationV01 {
  assertVNextLocalOperatorSessionSchemaV01(db);
  const now = readVNextLocalRuntimeClockNowV01(
    input.clock,
    "operator_session_authenticated_at",
  );
  const row = requireSession(db, input.credential.session_id);
  assertSessionCanAuthenticate(row, input.config, input.credential, now);
  return {
    session: publicSession(row, true),
    credential: input.credential,
  };
}

export function admitVNextLocalOperatorMutationV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    clock?: VNextLocalRuntimeClockV01;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  },
): VNextLocalOperatorSessionMutationAdmissionV01 {
  assertVNextLocalOperatorSessionSchemaV01(db);
  const now = readVNextLocalRuntimeClockNowV01(
    input.clock,
    "operator_action_nonce_rotated_at",
  );
  const nextCredential = {
    ...input.credential,
    action_nonce: randomBase64Url(
      input.secret_source ?? SYSTEM_SECRET_SOURCE,
      32,
    ),
  };
  const row = withImmediateTransaction(db, () => {
    const current = requireSession(db, input.credential.session_id);
    assertSessionCanAuthenticate(
      current,
      input.config,
      input.credential,
      now,
    );
    const currentHash = actionNonceCredentialHash(input.credential);
    const result = db.prepare(
      `UPDATE vnext_local_operator_sessions SET
         action_nonce_hash = ?,
         action_nonce_expires_at = expires_at,
         updated_at = ?
       WHERE session_id = ?
         AND action_nonce_hash = ?
         AND revoked_at IS NULL`,
    ).run(
      actionNonceCredentialHash(nextCredential),
      now,
      input.credential.session_id,
      currentHash,
    );
    if (result.changes !== 1) {
      throw sessionError("operator_action_nonce_invalid", 409);
    }
    return requireSession(db, input.credential.session_id);
  });
  return sessionAdmission(row, nextCredential, now);
}

export function revokeVNextLocalOperatorSessionByCredentialV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    credential: VNextLocalOperatorSessionCredentialV01;
    clock?: VNextLocalRuntimeClockV01;
  },
): VNextLocalOperatorSessionPublicV01 {
  assertVNextLocalOperatorSessionSchemaV01(db);
  const now = readVNextLocalRuntimeClockNowV01(
    input.clock,
    "operator_session_revoked_at",
  );
  return withImmediateTransaction(db, () => {
    const row = requireSession(db, input.credential.session_id);
    assertSessionCanAuthenticate(row, input.config, input.credential, now);
    const result = db.prepare(
      `UPDATE vnext_local_operator_sessions SET
         revoked_at = ?, updated_at = ?
       WHERE session_id = ?
         AND action_nonce_hash = ?
         AND revoked_at IS NULL`,
    ).run(
      now,
      now,
      input.credential.session_id,
      actionNonceCredentialHash(input.credential),
    );
    if (result.changes !== 1) {
      throw sessionError("operator_action_nonce_invalid", 409);
    }
    return publicSession(requireSession(db, input.credential.session_id), false);
  });
}

export function revokeVNextLocalOperatorSessionByIdV01(
  db: Database.Database,
  input: {
    config: VNextLocalOperatorPilotConfigV01;
    session_id: string;
    clock?: VNextLocalRuntimeClockV01;
  },
): VNextLocalOperatorSessionPublicV01 {
  assertVNextLocalOperatorSessionSchemaV01(db);
  const sessionId = requiredCanonicalId(input.session_id);
  if (!sessionId) throw sessionError("operator_session_not_found", 404);
  const now = readVNextLocalRuntimeClockNowV01(
    input.clock,
    "operator_session_revoked_at",
  );
  return withImmediateTransaction(db, () => {
    const row = requireSession(db, sessionId);
    assertScope(row, input.config);
    if (!row.revoked_at) {
      db.prepare(
        `UPDATE vnext_local_operator_sessions SET
           revoked_at = ?, updated_at = ?
         WHERE session_id = ? AND revoked_at IS NULL`,
      ).run(now, now, sessionId);
    }
    return publicSession(requireSession(db, sessionId), false);
  });
}

export function listVNextLocalOperatorSessionStatusV01(
  db: Database.Database,
  config: VNextLocalOperatorPilotConfigV01,
): VNextLocalOperatorSessionPublicV01[] {
  assertVNextLocalOperatorSessionSchemaV01(db);
  return (
    db.prepare(
      `SELECT * FROM vnext_local_operator_sessions
       WHERE workspace_id = ? AND project_id = ? AND operator_id = ?
       ORDER BY issued_at DESC, session_id`,
    ).all(
      config.workspace_id,
      config.project_id,
      config.operator_id,
    ) as LocalOperatorSessionRowV01[]
  ).map((row) => publicSession(row, false));
}

export function serializeVNextLocalOperatorSessionCookieV01(input: {
  value: string;
  expires_at: string;
  max_age_seconds: number;
  secure: boolean;
}): string {
  parseSessionCookieValue(input.value);
  const expires = strictTimestampMilliseconds(input.expires_at);
  if (expires === null) {
    throw sessionError("operator_session_cookie_invalid", 500);
  }
  const maxAge = Math.max(0, Math.floor(input.max_age_seconds));
  return [
    `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${input.value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    `Expires=${new Date(expires).toUTCString()}`,
    `Max-Age=${maxAge}`,
    input.secure ? "Secure" : null,
  ].filter(Boolean).join("; ");
}

export function serializeVNextLocalOperatorSessionCookieClearV01(input: {
  secure: boolean;
}): string {
  return [
    `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Strict",
    "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
    "Max-Age=0",
    input.secure ? "Secure" : null,
  ].filter(Boolean).join("; ");
}

export function assertVNextLocalOperatorRequestBoundaryV01(
  request: Request,
  options: { mutating: boolean },
): URL {
  let requestUrl: URL;
  try {
    requestUrl = new URL(request.url);
  } catch {
    throw sessionError("operator_pilot_request_invalid", 400);
  }
  if (
    !["http:", "https:"].includes(requestUrl.protocol) ||
    !isAllowedLoopbackHostname(requestUrl.hostname)
  ) {
    throw sessionError("local_operator_host_required", 403);
  }
  const host = request.headers.get("host")?.trim().toLowerCase();
  if (
    !host ||
    host.includes(",") ||
    host !== requestUrl.host.toLowerCase()
  ) {
    throw sessionError("local_operator_host_required", 403);
  }
  if (FORWARDED_HEADERS.some((name) => request.headers.has(name))) {
    throw sessionError("forwarded_header_forbidden", 403);
  }
  if (!options.mutating) return requestUrl;

  const origin = request.headers.get("origin");
  if (!origin || origin.includes(",")) {
    throw sessionError("same_origin_required", 403);
  }
  try {
    if (new URL(origin).origin !== requestUrl.origin) {
      throw sessionError("same_origin_required", 403);
    }
  } catch (error) {
    if (error instanceof VNextLocalOperatorSessionErrorV01) throw error;
    throw sessionError("same_origin_required", 403);
  }
  const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
  if (fetchSite && fetchSite !== "same-origin") {
    throw sessionError("same_origin_required", 403);
  }
  return requestUrl;
}

export async function readBoundedVNextLocalOperatorBodyV01(
  request: Request,
): Promise<Record<string, unknown>> {
  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader) {
    const length = Number(lengthHeader);
    if (!Number.isInteger(length) || length < 0) {
      throw sessionError("operator_pilot_body_invalid", 400);
    }
    if (length > VNEXT_LOCAL_OPERATOR_MAX_BODY_BYTES_V01) {
      throw sessionError("operator_pilot_body_too_large", 413);
    }
  }
  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    .trim()
    .toLowerCase();
  if (
    contentType !== "application/json" &&
    contentType !== "application/x-www-form-urlencoded"
  ) {
    throw sessionError("operator_pilot_content_type_unsupported", 415);
  }
  const text = await readBoundedText(request);
  if (contentType === "application/json") {
    try {
      const value = JSON.parse(text) as unknown;
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw sessionError("operator_pilot_body_invalid", 400);
      }
      return value as Record<string, unknown>;
    } catch (error) {
      if (error instanceof VNextLocalOperatorSessionErrorV01) throw error;
      throw sessionError("operator_pilot_body_invalid", 400);
    }
  }
  const values = new URLSearchParams(text);
  const result: Record<string, string> = {};
  for (const [key, value] of values.entries()) {
    if (Object.hasOwn(result, key)) {
      throw sessionError("operator_pilot_body_invalid", 400);
    }
    result[key] = value;
  }
  return result;
}

function assertBootstrapCanBeConsumed(
  row: LocalOperatorSessionRowV01 | null,
  config: VNextLocalOperatorPilotConfigV01,
  token: string,
  now: string,
): asserts row is LocalOperatorSessionRowV01 {
  if (!row) throw sessionError("operator_bootstrap_invalid", 401);
  assertScope(row, config);
  if (row.revoked_at) throw sessionError("operator_session_revoked", 401);
  if (row.bootstrap_consumed_at) {
    throw sessionError("operator_bootstrap_consumed", 409);
  }
  if (timestampExpired(row.expires_at, now)) {
    throw sessionError("operator_session_expired", 401);
  }
  if (!safeDigestEqual(row.bootstrap_token_hash, credentialHash("bootstrap", token))) {
    throw sessionError("operator_bootstrap_invalid", 401);
  }
}

function assertSessionCanAuthenticate(
  row: LocalOperatorSessionRowV01,
  config: VNextLocalOperatorPilotConfigV01,
  credential: VNextLocalOperatorSessionCredentialV01,
  now: string,
): void {
  assertScope(row, config);
  if (row.revoked_at) throw sessionError("operator_session_revoked", 401);
  if (!row.bootstrap_consumed_at || !row.session_token_hash || !row.action_nonce_hash) {
    throw sessionError("operator_session_invalid", 401);
  }
  if (timestampExpired(row.expires_at, now)) {
    throw sessionError("operator_session_expired", 401);
  }
  if (
    !row.action_nonce_expires_at ||
    timestampExpired(row.action_nonce_expires_at, now)
  ) {
    throw sessionError("operator_action_nonce_expired", 401);
  }
  if (!safeDigestEqual(row.session_token_hash, sessionCredentialHash(credential))) {
    throw sessionError("operator_session_invalid", 401);
  }
  if (!safeDigestEqual(row.action_nonce_hash, actionNonceCredentialHash(credential))) {
    throw sessionError("operator_action_nonce_invalid", 409);
  }
}

function assertScope(
  row: LocalOperatorSessionRowV01,
  config: VNextLocalOperatorPilotConfigV01,
): void {
  if (
    row.workspace_id !== config.workspace_id ||
    row.project_id !== config.project_id ||
    row.operator_id !== config.operator_id
  ) {
    throw sessionError("operator_session_scope_mismatch", 403);
  }
}

function sessionAdmission(
  row: LocalOperatorSessionRowV01,
  credential: VNextLocalOperatorSessionCredentialV01,
  now: string,
): VNextLocalOperatorSessionMutationAdmissionV01 {
  const expires = strictTimestampMilliseconds(row.expires_at);
  const nowMs = strictTimestampMilliseconds(now);
  if (expires === null || nowMs === null || expires <= nowMs) {
    throw sessionError("operator_session_expired", 401);
  }
  return {
    session: publicSession(row, true),
    credential,
    cookie_value: serializeCredential(credential),
    cookie_expires_at: row.expires_at,
    cookie_max_age_seconds: Math.max(1, Math.floor((expires - nowMs) / 1000)),
  };
}

function parseBootstrapToken(value: unknown): {
  token: string;
  session_id: string;
} {
  if (typeof value !== "string" || value.length > MAX_CREDENTIAL_CHARACTERS) {
    throw sessionError("operator_bootstrap_invalid", 401);
  }
  const parts = value.split(".");
  if (
    parts.length !== 3 ||
    parts[0] !== BOOTSTRAP_TOKEN_PREFIX ||
    !validSessionId(parts[1]) ||
    !validBase64UrlSecret(parts[2])
  ) {
    throw sessionError("operator_bootstrap_invalid", 401);
  }
  return { token: value, session_id: parts[1] };
}

function parseSessionCookieValue(
  value: unknown,
): VNextLocalOperatorSessionCredentialV01 {
  if (typeof value !== "string" || value.length > MAX_CREDENTIAL_CHARACTERS) {
    throw sessionError("operator_session_cookie_invalid", 401);
  }
  const parts = value.split(".");
  if (
    parts.length !== 4 ||
    parts[0] !== SESSION_COOKIE_PREFIX ||
    !validSessionId(parts[1]) ||
    !validBase64UrlSecret(parts[2]) ||
    !validBase64UrlSecret(parts[3])
  ) {
    throw sessionError("operator_session_cookie_invalid", 401);
  }
  return {
    session_id: parts[1],
    session_secret: parts[2],
    action_nonce: parts[3],
  };
}

function serializeCredential(
  credential: VNextLocalOperatorSessionCredentialV01,
): string {
  return [
    SESSION_COOKIE_PREFIX,
    credential.session_id,
    credential.session_secret,
    credential.action_nonce,
  ].join(".");
}

async function readBoundedText(request: Request): Promise<string> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > VNEXT_LOCAL_OPERATOR_MAX_BODY_BYTES_V01) {
      throw sessionError("operator_pilot_body_too_large", 413);
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return text;
}

function requiredCanonicalId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (
    value !== normalized ||
    normalized.length === 0 ||
    normalized.length > MAX_ID_CHARACTERS ||
    /[\u0000-\u001f\u007f]/.test(normalized)
  ) {
    return null;
  }
  return normalized;
}

function normalizeExplicitDatabasePath(value: string): string | null {
  if (
    value !== value.trim() ||
    value.includes("\0") ||
    !path.isAbsolute(value) ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/.test(value) ||
    (!value.endsWith(".db") && !value.endsWith(".sqlite"))
  ) {
    return null;
  }
  return path.normalize(value);
}

function selectSession(
  db: Database.Database,
  sessionId: string,
): LocalOperatorSessionRowV01 | null {
  return (
    db.prepare(
      "SELECT * FROM vnext_local_operator_sessions WHERE session_id = ?",
    ).get(sessionId) as LocalOperatorSessionRowV01 | undefined
  ) ?? null;
}

function requireSession(
  db: Database.Database,
  sessionId: string,
): LocalOperatorSessionRowV01 {
  const row = selectSession(db, sessionId);
  if (!row) throw sessionError("operator_session_not_found", 404);
  return row;
}

function publicSession(
  row: LocalOperatorSessionRowV01,
  authenticated: boolean,
): VNextLocalOperatorSessionPublicV01 {
  return {
    session_id: row.session_id,
    workspace_id: row.workspace_id,
    project_id: row.project_id,
    operator_id: row.operator_id,
    issued_at: row.issued_at,
    expires_at: row.expires_at,
    bootstrap_consumed_at: row.bootstrap_consumed_at,
    revoked_at: row.revoked_at,
    action_nonce_expires_at: row.action_nonce_expires_at,
    authenticated,
  };
}

function sessionCredentialHash(
  credential: VNextLocalOperatorSessionCredentialV01,
): string {
  return credentialHash(
    "session",
    `${credential.session_id}.${credential.session_secret}`,
  );
}

function actionNonceCredentialHash(
  credential: VNextLocalOperatorSessionCredentialV01,
): string {
  return credentialHash(
    "action-nonce",
    `${credential.session_id}.${credential.action_nonce}`,
  );
}

function credentialHash(domain: string, value: string): string {
  return `sha256:${createHash("sha256")
    .update(`augnes-vnext-local-operator-${domain}.v0.1\0`, "utf8")
    .update(value, "utf8")
    .digest("hex")}`;
}

function safeDigestEqual(left: string, right: string): boolean {
  if (!/^sha256:[a-f0-9]{64}$/.test(left) || !/^sha256:[a-f0-9]{64}$/.test(right)) {
    return false;
  }
  return timingSafeEqual(
    Buffer.from(left.slice(7), "hex"),
    Buffer.from(right.slice(7), "hex"),
  );
}

function randomBase64Url(
  source: VNextLocalOperatorSecretSourceV01,
  size: number,
): string {
  const bytes = source.bytes(size);
  if (!(bytes instanceof Uint8Array) || bytes.byteLength !== size) {
    throw sessionError("operator_session_conflict", 500);
  }
  return Buffer.from(bytes).toString("base64url");
}

function validSessionId(value: string): boolean {
  return (
    value.startsWith(SESSION_ID_PREFIX) &&
    value.length <= MAX_ID_CHARACTERS &&
    /^[A-Za-z0-9:_-]+$/.test(value)
  );
}

function validBase64UrlSecret(value: string): boolean {
  return value.length >= 40 && value.length <= 128 && /^[A-Za-z0-9_-]+$/.test(value);
}

function isAllowedLoopbackHostname(hostname: string): boolean {
  return ["localhost", "127.0.0.1", "[::1]"].includes(
    hostname.toLowerCase(),
  );
}

function boundedTtl(
  value: number | undefined,
  fallback: number,
  maximum: number,
): number {
  const resolved = value ?? fallback;
  if (!Number.isInteger(resolved) || resolved <= 0 || resolved > maximum) {
    throw sessionError("operator_pilot_config_invalid", 500);
  }
  return resolved;
}

function addMilliseconds(timestamp: string, milliseconds: number): string {
  const value = strictTimestampMilliseconds(timestamp);
  if (value === null) throw sessionError("operator_pilot_config_invalid", 500);
  return new Date(value + milliseconds).toISOString();
}

function timestampExpired(expiresAt: string, now: string): boolean {
  const expiry = strictTimestampMilliseconds(expiresAt);
  const current = strictTimestampMilliseconds(now);
  if (expiry === null || current === null) {
    throw sessionError("operator_session_invalid", 401);
  }
  return current >= expiry;
}

function strictTimestampMilliseconds(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    return null;
  }
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && new Date(parsed).toISOString() === value
    ? parsed
    : null;
}

function withImmediateTransaction<T>(
  db: Database.Database,
  run: () => T,
): T {
  if (db.inTransaction) {
    throw sessionError("operator_session_conflict", 409);
  }
  db.exec("BEGIN IMMEDIATE");
  try {
    const value = run();
    db.exec("COMMIT");
    return value;
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    throw error;
  }
}

function sessionError(
  code: VNextLocalOperatorSessionErrorCodeV01,
  status: number,
): VNextLocalOperatorSessionErrorV01 {
  return new VNextLocalOperatorSessionErrorV01(code, status);
}
