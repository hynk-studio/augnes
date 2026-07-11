#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { createVNextLocalOperatorSessionHandlersV01 } from "../app/api/vnext/operator/session/route";
import {
  VNEXT_LOCAL_OPERATOR_MAX_BODY_BYTES_V01,
  admitVNextLocalOperatorMutationV01,
  issueVNextLocalOperatorBootstrapV01,
  openVNextLocalOperatorDatabaseV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  readVNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
} from "../lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "../lib/vnext/runtime/local-runtime-clock";
import { migrateVNextLocalOperatorSessionsV01 } from "./db-migrations.mjs";

const SMOKE_VERSION = "vnext_operator_pilot_smoke.v0.1" as const;
const require = createRequire(import.meta.url);
const tempRoot = mkdtempSync(
  path.join(tmpdir(), "augnes-vnext-operator-pilot-v0-1-"),
);
const canonicalDbPath = path.join(tempRoot, "operator-pilot.db");
const migrationDbPath = path.join(tempRoot, "legacy-upgrade.db");
const schemaSql = readFileSync(
  path.join(process.cwd(), "lib", "db", "schema.sql"),
  "utf8",
);
const positiveCases: string[] = [];
const negativeCases: string[] = [];
const credentialMaterial = new Set<string>();
let networkGuard: ReturnType<typeof installZeroNetworkGuard> | null = null;
let finalSummary: Record<string, unknown> | null = null;

class ManualClock implements VNextLocalRuntimeClockV01 {
  constructor(private value: string) {}

  now(): string {
    return this.value;
  }

  set(value: string): void {
    this.value = value;
  }
}

class DeterministicSecretSource implements VNextLocalOperatorSecretSourceV01 {
  private sequence = 1;

  bytes(size: number): Uint8Array {
    const seed = createHash("sha256")
      .update(`vnext-operator-pilot-smoke-secret:${this.sequence}`)
      .digest();
    this.sequence += 1;
    if (size <= seed.byteLength) return seed.subarray(0, size);
    const output = new Uint8Array(size);
    for (let index = 0; index < size; index += 1) {
      output[index] = seed[index % seed.byteLength];
    }
    return output;
  }
}

async function main(): Promise<void> {
try {
  initializeCanonicalDatabase();
  validateAdditiveAndRepeatedMigration();
  const protectedBefore = snapshotNonSessionRows(canonicalDbPath);

  networkGuard = installZeroNetworkGuard();
  const clock = new ManualClock("2026-07-11T00:00:00.000Z");
  const secretSource = new DeterministicSecretSource();
  const environment = pilotEnvironment({
    workspaceId: "workspace:operator-pilot-smoke",
    projectId: "project:operator-pilot-smoke",
    operatorId: "operator:operator-pilot-smoke",
    databasePath: canonicalDbPath,
  });
  const handlers = createVNextLocalOperatorSessionHandlersV01({
    environment,
    clock,
    secret_source: secretSource,
  });

  await assertTransportAndDisabledRefusals({ handlers, environment });
  await assertCookieAndBootstrapRefusals({ handlers });

  const primary = issueBootstrap(environment, clock, secretSource);
  rememberCredentialMaterial(primary.bootstrap_token);
  const primaryBootstrap = await bootstrapThroughRoute(
    handlers,
    primary.bootstrap_token,
  );
  assert.equal(primaryBootstrap.response.status, 200);
  assertRouteSecurityHeaders(primaryBootstrap.response);
  assertCookieFlags(primaryBootstrap.setCookie);
  assertPublicResponseHasNoCredentials(
    primaryBootstrap.body,
    primary.bootstrap_token,
  );
  rememberCookie(primaryBootstrap.cookiePair);
  pass("one_time_bootstrap_accepted");
  pass("local_post_form_bootstrap_accepted");
  pass("http_only_same_site_strict_cookie_issued");
  pass("bootstrap_response_public_safe");

  const authenticated = await handlers.GET(
    localGetRequest({ cookie: primaryBootstrap.cookiePair }),
  );
  assert.equal(authenticated.status, 200);
  assertRouteSecurityHeaders(authenticated);
  assert.equal((await authenticated.json()).status, "authenticated");
  pass("valid_session_authenticated");

  const replay = await bootstrapThroughRoute(
    handlers,
    primary.bootstrap_token,
  );
  await expectRouteError(
    replay.response,
    409,
    "operator_bootstrap_consumed",
    "bootstrap_replay_rejected",
  );

  const rotated = rotateNonce(
    environment,
    clock,
    secretSource,
    primaryBootstrap.cookiePair,
  );
  rememberCookie(rotated.cookiePair);
  pass("action_nonce_rotated_atomically");
  await expectRouteError(
    await handlers.GET(
      localGetRequest({ cookie: primaryBootstrap.cookiePair }),
    ),
    409,
    "operator_action_nonce_invalid",
    "stale_action_nonce_rejected",
  );
  const rotatedAuthentication = await handlers.GET(
    localGetRequest({ cookie: rotated.cookiePair }),
  );
  assert.equal(rotatedAuthentication.status, 200);
  pass("rotated_action_nonce_authenticates");

  await assertForeignScopeRefusal({
    environment,
    clock,
    secretSource,
    cookiePair: rotated.cookiePair,
  });

  const revoked = issueBootstrap(environment, clock, secretSource);
  rememberCredentialMaterial(revoked.bootstrap_token);
  const revokedBootstrap = await bootstrapThroughRoute(
    handlers,
    revoked.bootstrap_token,
  );
  rememberCookie(revokedBootstrap.cookiePair);
  const logout = await handlers.POST(
    localPostRequest({
      body: { action: "logout" },
      cookie: revokedBootstrap.cookiePair,
    }),
  );
  assert.equal(logout.status, 200);
  assertRouteSecurityHeaders(logout);
  assert.match(logout.headers.get("set-cookie") ?? "", /Max-Age=0/);
  pass("explicit_logout_revokes_session");
  await expectRouteError(
    await handlers.GET(
      localGetRequest({ cookie: revokedBootstrap.cookiePair }),
    ),
    401,
    "operator_session_revoked",
    "revoked_session_rejected",
  );

  const concurrent = issueBootstrap(environment, clock, secretSource);
  rememberCredentialMaterial(concurrent.bootstrap_token);
  const concurrentBootstrap = await bootstrapThroughRoute(
    handlers,
    concurrent.bootstrap_token,
  );
  rememberCookie(concurrentBootstrap.cookiePair);
  const concurrentResponses = await Promise.all([
    handlers.POST(
      localPostRequest({
        body: { action: "logout" },
        cookie: concurrentBootstrap.cookiePair,
      }),
    ),
    handlers.POST(
      localPostRequest({
        body: { action: "logout" },
        cookie: concurrentBootstrap.cookiePair,
      }),
    ),
  ]);
  concurrentResponses.forEach(assertRouteSecurityHeaders);
  const concurrentStatuses = concurrentResponses.map((response) => response.status);
  assert.equal(
    concurrentStatuses.filter((status) => status === 200).length,
    1,
  );
  assert.equal(
    concurrentStatuses.filter((status) => status !== 200).length,
    1,
  );
  pass("concurrent_nonce_reuse_accepts_at_most_one");
  reject("concurrent_nonce_reuse_loser_rejected");

  const expiring = issueBootstrap(environment, clock, secretSource);
  rememberCredentialMaterial(expiring.bootstrap_token);
  const expiringBootstrap = await bootstrapThroughRoute(
    handlers,
    expiring.bootstrap_token,
  );
  rememberCookie(expiringBootstrap.cookiePair);
  clock.set("2026-07-11T08:00:00.000Z");
  await expectRouteError(
    await handlers.GET(
      localGetRequest({ cookie: expiringBootstrap.cookiePair }),
    ),
    401,
    "operator_session_expired",
    "expired_session_rejected",
  );

  const protectedAfter = snapshotNonSessionRows(canonicalDbPath);
  assert.deepEqual(protectedAfter, protectedBefore);
  pass("authentication_does_not_mutate_semantic_or_legacy_rows");

  assertNoPlaintextCredentialPersistence(canonicalDbPath);
  pass("plaintext_credentials_not_persisted");
  assert.equal(networkGuard.attempts.length, 0);
  pass("fetch_dns_socket_external_calls_zero");

  assertIntegrity(canonicalDbPath);
  assertIntegrity(migrationDbPath);
  pass("sqlite_integrity_check_passed");

  finalSummary = {
    smoke_version: SMOKE_VERSION,
    status: "pass",
    positive_case_count: positiveCases.length,
    negative_case_count: negativeCases.length,
    positive_cases: positiveCases,
    negative_cases: negativeCases,
    session_rows_written: countRows(
      canonicalDbPath,
      "vnext_local_operator_sessions",
    ),
    semantic_or_legacy_row_delta: 0,
    plaintext_credential_occurrences: 0,
    fetch_calls: 0,
    dns_calls: 0,
    socket_calls: 0,
    external_network_calls: 0,
    default_database_accessed: false,
    external_identity_authenticated: false,
    semantic_authority_granted: false,
    real_operator_decision_created: false,
    temp_database_cleanup: "pending_finally",
  };
} finally {
  networkGuard?.restore();
  rmSync(tempRoot, { recursive: true, force: true });
}

assert.equal(existsSync(tempRoot), false);
pass("temporary_database_and_side_files_removed");
assert(finalSummary);
finalSummary.positive_case_count = positiveCases.length;
finalSummary.positive_cases = positiveCases;
finalSummary.temp_database_cleanup = "pass";
process.stdout.write(`${JSON.stringify(finalSummary, null, 2)}\n`);
}

void main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "operator_pilot_smoke_failed";
  process.stderr.write(`operator_pilot_smoke_failed:${message}\n`);
  process.exitCode = 1;
});

function initializeCanonicalDatabase(): void {
  const db = new Database(canonicalDbPath);
  try {
    db.pragma("foreign_keys = ON");
    db.exec(schemaSql);
    const table = db.prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name = 'vnext_local_operator_sessions'`,
    ).get();
    assert(table);
  } finally {
    db.close();
  }
  pass("canonical_temp_database_initialized");
}

function validateAdditiveAndRepeatedMigration(): void {
  const db = new Database(migrationDbPath);
  try {
    db.exec(
      `CREATE TABLE legacy_guard (id TEXT PRIMARY KEY, value TEXT NOT NULL);
       INSERT INTO legacy_guard (id, value) VALUES ('row', 'unchanged');`,
    );
    const first = migrateVNextLocalOperatorSessionsV01(db);
    assert.deepEqual(first.created_tables, ["vnext_local_operator_sessions"]);
    assert.deepEqual(first.created_indexes, [
      "idx_vnext_local_operator_sessions_scope_expiry",
    ]);
    pass("legacy_database_upgraded_additively");
    const second = migrateVNextLocalOperatorSessionsV01(db);
    assert.deepEqual(second.created_tables, []);
    assert.deepEqual(second.created_indexes, []);
    pass("operator_session_migration_repeat_is_noop");
    assert.deepEqual(
      db.prepare("SELECT id, value FROM legacy_guard").all(),
      [{ id: "row", value: "unchanged" }],
    );
    pass("legacy_rows_preserved_during_migration");
  } finally {
    db.close();
  }
}

async function assertTransportAndDisabledRefusals(input: {
  handlers: ReturnType<typeof createVNextLocalOperatorSessionHandlersV01>;
  environment: NodeJS.ProcessEnv;
}): Promise<void> {
  const disabledHandlers = createVNextLocalOperatorSessionHandlersV01({
    environment: { ...input.environment, AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "0" },
  });
  await expectRouteError(
    await disabledHandlers.GET(localGetRequest()),
    404,
    "not_found",
    "disabled_pilot_exposes_no_capability",
  );

  await expectRouteError(
    await input.handlers.GET(
      new Request("http://remote.example/api/vnext/operator/session", {
        headers: { host: "remote.example" },
      }),
    ),
    403,
    "local_operator_host_required",
    "non_loopback_request_rejected",
  );
  const invalidConfigurations: Array<[string, NodeJS.ProcessEnv]> = [
    [
      "missing_scope_remote_host_rejected_first",
      {
        ...input.environment,
        AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: undefined,
      },
    ],
    [
      "invalid_db_remote_host_rejected_first",
      {
        ...input.environment,
        AUGNES_DB_PATH: "relative-implicit.db",
      },
    ],
  ];
  for (const [caseId, environment] of invalidConfigurations) {
    const invalidConfigHandlers =
      createVNextLocalOperatorSessionHandlersV01({ environment });
    await expectRouteError(
      await invalidConfigHandlers.GET(
        new Request("http://remote.example/api/vnext/operator/session", {
          headers: { host: "remote.example" },
        }),
      ),
      403,
      "local_operator_host_required",
      caseId,
    );
  }
  await expectRouteError(
    await input.handlers.GET(
      new Request("http://0.0.0.0:3000/api/vnext/operator/session", {
        headers: { host: "0.0.0.0:3000" },
      }),
    ),
    403,
    "local_operator_host_required",
    "wildcard_bind_host_rejected",
  );
  await expectTransportAcceptedThroughAuthenticationBoundary(
    await input.handlers.GET(
      new Request("http://localhost:3000/api/vnext/operator/session", {
        headers: { host: "localhost:3000" },
      }),
    ),
    "localhost_transport_accepted",
  );
  await expectTransportAcceptedThroughAuthenticationBoundary(
    await input.handlers.GET(
      new Request("http://[::1]:3000/api/vnext/operator/session", {
        headers: { host: "[::1]:3000" },
      }),
    ),
    "ipv6_loopback_transport_accepted",
  );
  await expectRouteError(
    await input.handlers.POST(
      localPostRequest({
        body: { action: "bootstrap", bootstrap_token: "invalid" },
        omitOrigin: true,
      }),
    ),
    403,
    "same_origin_required",
    "missing_origin_rejected",
  );
  await expectRouteError(
    await input.handlers.POST(
      localPostRequest({
        body: { action: "bootstrap", bootstrap_token: "invalid" },
        origin: "http://localhost:3000",
      }),
    ),
    403,
    "same_origin_required",
    "wrong_origin_rejected",
  );
  for (const header of [
    "forwarded",
    "x-forwarded-host",
    "x-forwarded-proto",
  ]) {
    await expectRouteError(
      await input.handlers.GET(
        localGetRequest({ extraHeaders: { [header]: "localhost" } }),
      ),
      403,
      "forwarded_header_forbidden",
      `${header.replaceAll("-", "_")}_rejected`,
    );
  }
  await expectRouteError(
    await input.handlers.POST(
      new Request(
        "http://127.0.0.1:3000/api/vnext/operator/session?bootstrap_token=forbidden",
        {
          method: "POST",
          headers: localPostHeaders(),
          body: JSON.stringify({
            action: "bootstrap",
            bootstrap_token: "invalid",
          }),
        },
      ),
    ),
    400,
    "operator_pilot_request_invalid",
    "query_string_bootstrap_token_rejected",
  );
}

async function assertCookieAndBootstrapRefusals(input: {
  handlers: ReturnType<typeof createVNextLocalOperatorSessionHandlersV01>;
}): Promise<void> {
  await expectRouteError(
    await input.handlers.GET(localGetRequest()),
    401,
    "operator_session_cookie_missing",
    "absent_session_rejected",
  );
  await expectRouteError(
    await input.handlers.GET(localGetRequest({ cookie: "malformed=value" })),
    401,
    "operator_session_cookie_invalid",
    "malformed_cookie_rejected",
  );
  await expectRouteError(
    await input.handlers.GET(
      localGetRequest({
        cookie:
          "augnes_vnext_operator_session_v01=vnext_session_v01.vnext-local-operator-session:missing-nonce.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      }),
    ),
    401,
    "operator_session_cookie_invalid",
    "cookie_missing_action_nonce_rejected",
  );
  await expectRouteError(
    await input.handlers.POST(localPostRequest({ body: { action: "logout" } })),
    401,
    "operator_session_cookie_missing",
    "action_nonce_required",
  );
  await expectRouteError(
    await input.handlers.POST(
      localPostRequest({
        body: { action: "bootstrap", bootstrap_token: "invalid", extra: true },
      }),
    ),
    400,
    "operator_pilot_body_invalid",
    "unknown_body_field_rejected",
  );
  await expectRouteError(
    await input.handlers.POST(
      new Request("http://127.0.0.1:3000/api/vnext/operator/session", {
        method: "POST",
        headers: localPostHeaders({ "content-type": "text/plain" }),
        body: "invalid",
      }),
    ),
    415,
    "operator_pilot_content_type_unsupported",
    "unsupported_content_type_rejected",
  );
  await expectRouteError(
    await input.handlers.POST(
      new Request("http://127.0.0.1:3000/api/vnext/operator/session", {
        method: "POST",
        headers: localPostHeaders(),
        body: "{",
      }),
    ),
    400,
    "operator_pilot_body_invalid",
    "malformed_json_rejected",
  );
  await expectRouteError(
    await input.handlers.POST(
      new Request("http://127.0.0.1:3000/api/vnext/operator/session", {
        method: "POST",
        headers: localPostHeaders({
          "content-length": String(
            VNEXT_LOCAL_OPERATOR_MAX_BODY_BYTES_V01 + 1,
          ),
        }),
        body: "{}",
      }),
    ),
    413,
    "operator_pilot_body_too_large",
    "oversized_content_length_rejected",
  );
  await expectRouteError(
    await input.handlers.POST(
      new Request("http://127.0.0.1:3000/api/vnext/operator/session", {
        method: "POST",
        headers: localPostHeaders(),
        body: "x".repeat(VNEXT_LOCAL_OPERATOR_MAX_BODY_BYTES_V01 + 1),
      }),
    ),
    413,
    "operator_pilot_body_too_large",
    "oversized_chunked_body_rejected",
  );
}

async function assertForeignScopeRefusal(input: {
  environment: NodeJS.ProcessEnv;
  clock: ManualClock;
  secretSource: DeterministicSecretSource;
  cookiePair: string;
}): Promise<void> {
  const foreignHandlers = createVNextLocalOperatorSessionHandlersV01({
    environment: {
      ...input.environment,
      AUGNES_VNEXT_OPERATOR_PROJECT_ID: "project:foreign",
    },
    clock: input.clock,
    secret_source: input.secretSource,
  });
  await expectRouteError(
    await foreignHandlers.GET(localGetRequest({ cookie: input.cookiePair })),
    403,
    "operator_session_scope_mismatch",
    "foreign_project_session_rejected",
  );
}

function issueBootstrap(
  environment: NodeJS.ProcessEnv,
  clock: VNextLocalRuntimeClockV01,
  secretSource: VNextLocalOperatorSecretSourceV01,
) {
  const config = readVNextLocalOperatorPilotConfigV01(environment);
  const db = openVNextLocalOperatorDatabaseV01(config);
  try {
    const result = issueVNextLocalOperatorBootstrapV01(db, {
      config,
      clock,
      secret_source: secretSource,
    });
    const serialized = JSON.stringify(
      db.prepare(
        "SELECT * FROM vnext_local_operator_sessions WHERE session_id = ?",
      ).get(result.session.session_id),
    );
    assert(!serialized.includes(result.bootstrap_token));
    assert.match(serialized, /sha256:[a-f0-9]{64}/);
    pass("bootstrap_token_hash_only_persisted");
    return result;
  } finally {
    db.close();
  }
}

async function bootstrapThroughRoute(
  handlers: ReturnType<typeof createVNextLocalOperatorSessionHandlersV01>,
  bootstrapToken: string,
) {
  const response = await handlers.POST(
    new Request("http://127.0.0.1:3000/api/vnext/operator/session", {
      method: "POST",
      headers: localPostHeaders({
        "content-type": "application/x-www-form-urlencoded",
      }),
      body: new URLSearchParams({
        action: "bootstrap",
        bootstrap_token: bootstrapToken,
      }).toString(),
    }),
  );
  assertRouteSecurityHeaders(response);
  const setCookie = response.headers.get("set-cookie") ?? "";
  const cookiePair = setCookie.split(";", 1)[0];
  const body = await response.clone().json();
  return { response, setCookie, cookiePair, body };
}

function rotateNonce(
  environment: NodeJS.ProcessEnv,
  clock: VNextLocalRuntimeClockV01,
  secretSource: VNextLocalOperatorSecretSourceV01,
  cookiePair: string,
) {
  const config = readVNextLocalOperatorPilotConfigV01(environment);
  const credential = readVNextLocalOperatorCredentialFromRequestV01(
    localGetRequest({ cookie: cookiePair }),
  );
  const db = openVNextLocalOperatorDatabaseV01(config);
  try {
    const admission = admitVNextLocalOperatorMutationV01(db, {
      config,
      credential,
      clock,
      secret_source: secretSource,
    });
    return {
      cookiePair: `augnes_vnext_operator_session_v01=${admission.cookie_value}`,
    };
  } finally {
    db.close();
  }
}

function pilotEnvironment(input: {
  workspaceId: string;
  projectId: string;
  operatorId: string;
  databasePath: string;
}): NodeJS.ProcessEnv {
  return {
    NODE_ENV: "test",
    AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1",
    AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: input.workspaceId,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: input.projectId,
    AUGNES_VNEXT_OPERATOR_ID: input.operatorId,
    AUGNES_DB_PATH: input.databasePath,
  };
}

function localGetRequest(input: {
  cookie?: string;
  extraHeaders?: Record<string, string>;
} = {}): Request {
  const headers = new Headers({ host: "127.0.0.1:3000" });
  if (input.cookie) headers.set("cookie", input.cookie);
  for (const [key, value] of Object.entries(input.extraHeaders ?? {})) {
    headers.set(key, value);
  }
  return new Request(
    "http://127.0.0.1:3000/api/vnext/operator/session",
    { headers },
  );
}

function localPostRequest(input: {
  body: Record<string, unknown>;
  cookie?: string;
  origin?: string;
  omitOrigin?: boolean;
}): Request {
  const headers = localPostHeaders();
  if (input.omitOrigin) headers.delete("origin");
  if (input.origin) headers.set("origin", input.origin);
  if (input.cookie) headers.set("cookie", input.cookie);
  return new Request(
    "http://127.0.0.1:3000/api/vnext/operator/session",
    {
      method: "POST",
      headers,
      body: JSON.stringify(input.body),
    },
  );
}

function localPostHeaders(
  overrides: Record<string, string> = {},
): Headers {
  return new Headers({
    host: "127.0.0.1:3000",
    origin: "http://127.0.0.1:3000",
    "sec-fetch-site": "same-origin",
    "content-type": "application/json",
    ...overrides,
  });
}

async function expectRouteError(
  response: Response,
  status: number,
  code: string,
  caseId: string,
): Promise<void> {
  assert.equal(response.status, status, caseId);
  assertRouteSecurityHeaders(response);
  const body = await response.json();
  assert.equal(body.ok, false, caseId);
  assert.equal(body.error_code, code, caseId);
  assert.equal(body.semantic_authority_granted, false, caseId);
  assertPublicResponseHasNoCredentials(body);
  reject(caseId);
}

async function expectTransportAcceptedThroughAuthenticationBoundary(
  response: Response,
  caseId: string,
): Promise<void> {
  assert.equal(response.status, 401, caseId);
  assertRouteSecurityHeaders(response);
  const body = await response.json();
  assert.equal(body.error_code, "operator_session_cookie_missing", caseId);
  pass(caseId);
}

function assertRouteSecurityHeaders(response: Response): void {
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(
    response.headers.get("content-security-policy"),
    "frame-ancestors 'none'",
  );
  assert.equal(response.headers.has("access-control-allow-origin"), false);
}

function assertCookieFlags(setCookie: string): void {
  assert.match(setCookie, /HttpOnly/);
  assert.match(setCookie, /SameSite=Strict/);
  assert.match(setCookie, /Path=\/api\/vnext\/operator(?:;|$)/);
  assert.match(setCookie, /Max-Age=\d+/);
  assert.match(setCookie, /Expires=/);
  assert.doesNotMatch(setCookie, /Domain=/i);
}

function assertPublicResponseHasNoCredentials(
  body: unknown,
  ...specificCredentials: string[]
): void {
  const serialized = JSON.stringify(body);
  assert.doesNotMatch(serialized, /bootstrap_token_hash|session_token_hash|action_nonce_hash/);
  for (const credential of specificCredentials) {
    assert(!serialized.includes(credential));
  }
  for (const credential of credentialMaterial) {
    assert(!serialized.includes(credential));
  }
}

function rememberCredentialMaterial(value: string): void {
  credentialMaterial.add(value);
  const segments = value.split(".");
  for (const segment of segments.slice(2)) {
    if (segment.length >= 40) credentialMaterial.add(segment);
  }
}

function rememberCookie(cookiePair: string): void {
  const value = cookiePair.slice(cookiePair.indexOf("=") + 1);
  rememberCredentialMaterial(value);
}

function snapshotNonSessionRows(
  databasePath: string,
): Record<string, { count: number; row_hash: string }> {
  const db = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const tables = (
      db.prepare(
        `SELECT name FROM sqlite_master
         WHERE type = 'table'
           AND name NOT LIKE 'sqlite_%'
           AND name <> 'vnext_local_operator_sessions'
         ORDER BY name`,
      ).all() as { name: string }[]
    ).map((row) => row.name);
    return Object.fromEntries(tables.map((table) => {
      const rows = db
        .prepare(`SELECT * FROM ${quoteIdentifier(table)}`)
        .all()
        .map((row) => canonicalJson(row))
        .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
      return [
        table,
        {
          count: rows.length,
          row_hash: `sha256:${createHash("sha256")
            .update(JSON.stringify(rows))
            .digest("hex")}`,
        },
      ];
    }));
  } finally {
    db.close();
  }
}

function assertNoPlaintextCredentialPersistence(databasePath: string): void {
  const db = new Database(databasePath, { readonly: true, fileMustExist: true });
  let serializedRows = "";
  try {
    serializedRows = JSON.stringify(
      db.prepare("SELECT * FROM vnext_local_operator_sessions").all(),
    );
  } finally {
    db.close();
  }
  const databaseArtifacts = [
    databasePath,
    `${databasePath}-wal`,
    `${databasePath}-shm`,
    `${databasePath}-journal`,
  ].filter(existsSync);
  for (const credential of credentialMaterial) {
    assert(!serializedRows.includes(credential));
    const bytes = Buffer.from(credential, "utf8");
    for (const artifact of databaseArtifacts) {
      assert.equal(readFileSync(artifact).includes(bytes), false);
    }
  }
}

function countRows(databasePath: string, table: string): number {
  const db = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    return Number(
      (db.prepare(`SELECT COUNT(*) AS count FROM ${quoteIdentifier(table)}`).get() as {
        count: number;
      }).count,
    );
  } finally {
    db.close();
  }
}

function assertIntegrity(databasePath: string): void {
  const db = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const rows = db.pragma("integrity_check") as { integrity_check: string }[];
    assert.deepEqual(rows, [{ integrity_check: "ok" }]);
  } finally {
    db.close();
  }
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function canonicalJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalJson);
  if (Buffer.isBuffer(value)) return { type: "Buffer", data: [...value] };
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalJson(nested)]),
    );
  }
  if (typeof value === "bigint") return value.toString();
  return value;
}

function installZeroNetworkGuard() {
  const attempts: string[] = [];
  const restores: Array<() => void> = [];
  const modules = {
    http: require("node:http"),
    https: require("node:https"),
    net: require("node:net"),
    tls: require("node:tls"),
    dns: require("node:dns"),
  } as Record<string, Record<string, unknown>>;
  patch(globalThis as unknown as Record<string, unknown>, "fetch", "fetch");
  for (const [moduleName, methods] of Object.entries({
    http: ["request", "get"],
    https: ["request", "get"],
    net: ["connect", "createConnection"],
    tls: ["connect"],
    dns: ["lookup", "resolve", "resolve4", "resolve6", "resolveAny", "reverse"],
  })) {
    for (const method of methods) {
      patch(modules[moduleName], method, `${moduleName}.${method}`);
    }
  }
  const dnsPromises = modules.dns.promises as Record<string, unknown> | undefined;
  if (dnsPromises) {
    for (const method of ["lookup", "resolve", "resolve4", "resolve6", "resolveAny", "reverse"]) {
      patch(dnsPromises, method, `dns.promises.${method}`);
    }
  }
  return {
    attempts,
    restore() {
      restores.reverse().forEach((restore) => restore());
    },
  };

  function patch(
    target: Record<string, unknown>,
    method: string,
    label: string,
  ): void {
    const original = target[method];
    if (typeof original !== "function") return;
    target[method] = (..._args: unknown[]) => {
      attempts.push(label);
      throw new Error(`operator_pilot_external_io_blocked:${label}`);
    };
    restores.push(() => {
      target[method] = original;
    });
  }
}

function pass(caseId: string): void {
  if (!positiveCases.includes(caseId)) positiveCases.push(caseId);
}

function reject(caseId: string): void {
  if (!negativeCases.includes(caseId)) negativeCases.push(caseId);
}
