import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01, selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { insertVNextCoreRecordV01, readVNextCoreRecordV01 } from "../lib/vnext/persistence/durable-semantic-store";
import { abandonVNextRecoveryRepositoryDecisionSessionV01, authenticateVNextLocalOperatorSessionV01, consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01, issueVNextRecoveryRepositoryDecisionSessionV01, issueVNextRepositoryDecisionChallengeV01,
  readVNextLocalOperatorCredentialFromRequestV01, readVNextLocalOperatorSessionHistoryV01, recordCompanionWorkAdmissionInsideTransactionV01,
  VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01, type VNextLocalOperatorSecretSourceV01, type VNextLocalOperatorSessionCredentialV01 } from "../lib/vnext/runtime/local-operator-session";
import { buildInitialProjectWorkTaskContextPacketV01, inspectInitialProjectWorkPacketLineageV01 } from "../lib/vnext/runtime/initial-project-work-context";
import { defineInitialProjectWorkV01 } from "../lib/vnext/runtime/project-work-initialization";
import { validateTaskContextPacketV01 } from "../lib/vnext/task-context-packet";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../lib/vnext/protocol-primitives";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";
import type { ProjectWorkDefinitionV01 } from "../types/vnext/project-work-initialization";

const T0 = "2026-08-01T00:00:00.000Z", T1 = "2026-08-01T00:00:01.000Z", T2 = "2026-08-01T00:00:02.000Z";
const clock = (now: string) => ({ now: () => now });
const definition: ProjectWorkDefinitionV01 = { goal: "Inspect the bounded project evidence", success_criteria: ["Retain verified source attribution"], non_goals: ["Do not execute commands"] };
const collisionBytes = Buffer.from("sk-AAAAAAAAAAAAAAAAAAA", "base64url");
const ordinaryPrefix = "vnext-local-operator-session:";

function sourceFor(idBytes: Uint8Array) {
  const draws: number[] = [];
  const source: VNextLocalOperatorSecretSourceV01 = { bytes(size) {
    draws.push(size);
    return size === 16 ? Buffer.from(idBytes) : Buffer.alloc(size, 0x41 + draws.length);
  } };
  return { source, draws };
}
function withFixture<T>(label: string, run: (fixture: ReturnType<typeof createFixture>) => T): T {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), `augnes-session-identity-${label}-`)));
  let fixture: ReturnType<typeof createFixture> | undefined;
  try { fixture = createFixture(root); return run(fixture); }
  finally { fixture?.db.close(); rmSync(root, { recursive: true, force: true }); }
}
function createFixture(root: string) {
  const db = new Database(path.join(root, "identity.db"));
  try {
    db.pragma("foreign_keys=ON"); applyCanonicalDatabaseMigrations(db);
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
    const projectRoot = path.join(root, "project"); mkdirSync(projectRoot);
    const project = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(projectRoot, { base_path: root }), display_name: "Session identity regression" }).project;
    const scope = { workspace_id: workspace.workspace_id, project_id: project.project_id };
    selectActiveProjectV01(db, { ...scope, expected_project_id: null, expected_revision: null, now: T0 });
    const config = { ...scope, enabled: true as const, operator_id: "operator:local-review", database_path: path.join(root, "identity.db") };
    const selection = readActiveProjectSelectionV01(db, workspace.workspace_id)!.selection_revision;
    return { root, db, scope, config, selection };
  } catch (error) { db.close(); throw error; }
}
type Fixture = ReturnType<typeof createFixture>;
function build(f: Fixture, sessionId: string, authored = definition, operatorId = f.config.operator_id) {
  return buildInitialProjectWorkTaskContextPacketV01({ ...f.scope, operator_id: operatorId, session_id: sessionId,
    expected_active_selection_revision: f.selection, definition: authored, generated_at: T2 });
}
function packetValidity(packet: ReturnType<typeof build>["packet"]) {
  return validateTaskContextPacketV01(packet, { evaluated_at: T2 });
}
function requireValidPacket(packet: ReturnType<typeof build>["packet"], label: string) {
  const validation = packetValidity(packet);
  // This is the deciding regression assertion: the actual compiler and validator
  // must accept an issued public identity. No suffix-format assertion precedes it.
  // Failure diagnostics contain only codes and JSON paths, never packet material.
  assert.equal(validation.status, "valid", JSON.stringify({ case: label, errors: validation.errors.map(({ code, path }) => ({ code, path })) }));
}
function credential(cookieValue: string) {
  return readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1", { headers: { cookie: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${cookieValue}` } }));
}
function define(f: Fixture, usedCredential: VNextLocalOperatorSessionCredentialV01, source: VNextLocalOperatorSecretSourceV01, authored = definition) {
  return defineInitialProjectWorkV01(f.db, { config: f.config, credential: usedCredential, clock: clock(T2), secret_source: source,
    request: { action: "define_initial_project_work", ...f.scope, expected_active_project_id: f.scope.project_id,
      expected_active_selection_revision: f.selection, expected_initialization_state: "not_defined", ...authored } });
}
function assertIssuedIdentity(idBytes: Uint8Array, label: string) {
  withFixture(label, f => {
    const { source, draws } = sourceFor(idBytes);
    const issued = issueVNextLocalOperatorBootstrapV01(f.db, { config: f.config, clock: clock(T0), secret_source: source });
    const admitted = consumeVNextLocalOperatorBootstrapV01(f.db, { config: f.config, clock: clock(T1), secret_source: source, bootstrap_token: issued.bootstrap_token });
    const usedCredential = credential(admitted.cookie_value);
    assert.equal(authenticateVNextLocalOperatorSessionV01(f.db, { config: f.config, credential: usedCredential, clock: clock(T2) }).session.session_id, issued.session.session_id);
    const compiled = build(f, issued.session.session_id);
    requireValidPacket(compiled.packet, label);
    const result = define(f, usedCredential, source);
    requireValidPacket(result.packet, `${label}_persisted`);
    assert(canonical(result.packet) === canonical(compiled.packet), "Persisted packet equals the actual issuer-bound compiled packet");
    assert.equal(inspectInitialProjectWorkPacketLineageV01(f.db, { ...f.scope, packet: result.packet }).projection_current, true);
    assert.equal(validateRecoveryCanonicalDatabaseV01(f.db).status, "valid");
    // Representation assertions supplement the behavioral check above. One
    // 128-bit ID draw remains distinct from unchanged 256-bit secret draws.
    assert.equal(issued.session.session_id, `${ordinaryPrefix}${Buffer.from(idBytes).toString("hex")}`);
    assert.deepEqual(draws, [16, 32, 32, 32, 32]);
    assert.equal(result.packet.capability_grant, null);
  });
}

/** Fixed pre-correction rows are compatibility fixtures, not reissued or migrated
 * production credentials. Hash domains and cookie format are the existing v0.1
 * contract; fixture secrets are synthetic and never printed. */
function seedLegacySession(f: Fixture, suffix: string) {
  const sessionId = `${ordinaryPrefix}${suffix}`;
  const legacyCredential = { session_id: sessionId, session_secret: Buffer.alloc(32, 0x51).toString("base64url"), action_nonce: Buffer.alloc(32, 0x52).toString("base64url") };
  const digest = (domain: string, value: string) => `sha256:${createHash("sha256").update(`augnes-vnext-local-operator-${domain}.v0.1\0`).update(value).digest("hex")}`;
  f.db.prepare(`INSERT INTO vnext_local_operator_sessions (
    session_id,workspace_id,project_id,operator_id,bootstrap_token_hash,session_token_hash,issued_at,expires_at,
    bootstrap_consumed_at,revoked_at,action_nonce_hash,action_nonce_expires_at,updated_at
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(sessionId, f.scope.workspace_id, f.scope.project_id, f.config.operator_id,
    digest("bootstrap", "synthetic-legacy-unissued"), digest("session", `${sessionId}.${legacyCredential.session_secret}`), T0,
    "2026-08-01T00:10:00.000Z", T1, null, digest("action-nonce", `${sessionId}.${legacyCredential.action_nonce}`), "2026-08-01T00:05:00.000Z", T1);
  const parsed = credential(["vnext_session_v01", sessionId, legacyCredential.session_secret, legacyCredential.action_nonce].join("."));
  assert(canonical(parsed) === canonical(legacyCredential), "Legacy cookie retains its credential fields");
  assert.equal(readVNextLocalOperatorSessionHistoryV01(f.db, { session_id: sessionId })!.session_id, sessionId);
  assert.equal(authenticateVNextLocalOperatorSessionV01(f.db, { config: f.config, credential: parsed, clock: clock(T2) }).session.session_id, sessionId);
  return sessionId;
}
function assertLegacyCompatibility() {
  withFixture("legacy", f => {
    const sessionId = seedLegacySession(f, "QUJDREVGR0hJSktMTU5PUA");
    const historical = build(f, sessionId); requireValidPacket(historical.packet, "legacy_valid");
    insertVNextCoreRecordV01(f.db, { ...f.scope, record_kind: "task_context_packet", record_id: historical.packet.packet_id,
      fingerprint: historical.packet.integrity.fingerprint, idempotency_key: historical.lineage.idempotency_key, payload: historical.packet, created_at: T2 });
    const original = canonical(historical.packet);
    assert.equal(inspectInitialProjectWorkPacketLineageV01(f.db, { ...f.scope, packet: historical.packet }).projection_current, true);
    const reopened = new Database(f.config.database_path);
    try {
      const persisted = readVNextCoreRecordV01(reopened, { ...f.scope, record_kind: "task_context_packet", record_id: historical.packet.packet_id })!;
      assert(canonical(persisted.payload) === original, "Legacy packet bytes remain unchanged after reopen");
      assert.equal(inspectInitialProjectWorkPacketLineageV01(reopened, { ...f.scope, packet: historical.packet }).projection_current, true);
      assert.equal(validateRecoveryCanonicalDatabaseV01(reopened).status, "valid");
    } finally { reopened.close(); }
  });
  withFixture("legacy-collision", f => {
    const sessionId = seedLegacySession(f, collisionBytes.toString("base64url"));
    assert(packetValidity(build(f, sessionId).packet).errors.some(e => e.code === "secret_shaped_material"),
      "Historical colliding identifiers still authenticate, but do not acquire a new packet-scanner exemption");
  });
}
function assertOtherSessionFamilies() {
  withFixture("recovery", f => {
    const { source, draws } = sourceFor(collisionBytes);
    const binding = hash("synthetic session identity recovery selection");
    const request = hash("synthetic session identity recovery request");
    try {
      const result = issueVNextRecoveryRepositoryDecisionSessionV01(f.db, { selection_token: "selection:identity-regression", clock: clock(T0), secret_source: source,
        scope: { ...f.scope, action: "rebind_root", selection_binding_fingerprint: binding, decision_request_fingerprint: request,
          expected_old_root_binding_fingerprint: hash("old root"), expected_old_baseline_fingerprint: hash("old baseline"), expected_new_physical_observation_fingerprint: hash("new observation"),
          expected_active_project_id: f.scope.project_id, expected_active_selection_revision: f.selection, candidate_expires_at: "2026-08-01T00:05:00.000Z" } });
      const sessionId = result.admission.session.session_id;
      assert.equal(issueVNextRepositoryDecisionChallengeV01(f.db, { ...f.scope, credential: result.admission.credential, request_fingerprint: request, clock: clock(T1) }).request_fingerprint, request);
      assert.equal(sessionId, `${ordinaryPrefix}recovery-rebind:${collisionBytes.toString("hex")}`);
      assert.deepEqual(draws, [16, 32, 32, 32]);
      assert.equal(readVNextLocalOperatorSessionHistoryV01(f.db, { session_id: sessionId })!.operator_id, "operator:local-project-recovery");
      assert.throws(() => authenticateVNextLocalOperatorSessionV01(f.db, { config: f.config, credential: result.admission.credential, clock: clock(T1) }), /operator_session_scope_mismatch/,
        "Recovery identity does not grant ordinary first-work authority");
    } finally { abandonVNextRecoveryRepositoryDecisionSessionV01(f.db, binding, clock(T2)); }
  });
  withFixture("companion", f => {
    const recorded = f.db.transaction(() => recordCompanionWorkAdmissionInsideTransactionV01(f.db, { ...f.scope, observed_at: T2 }))();
    const compiled = build(f, recorded.session.session_id, definition, recorded.session.operator_id);
    requireValidPacket(compiled.packet, "companion_admission");
    assert.match(recorded.session.session_id, /^vnext-local-operator-session:companion-work:[a-f0-9]{32}$/u);
    assert.equal(recorded.session.revoked_at, T2); assert.equal(recorded.session.authenticated, false);
    const row = f.db.prepare("SELECT decision_session_token_hash,decision_action_nonce_hash FROM vnext_local_operator_sessions WHERE session_id=?").get(recorded.session.session_id);
    assert.deepEqual(row, { decision_session_token_hash: null, decision_action_nonce_hash: null });
    insertVNextCoreRecordV01(f.db, { ...f.scope, record_kind: "task_context_packet", record_id: compiled.packet.packet_id,
      fingerprint: compiled.packet.integrity.fingerprint, idempotency_key: compiled.lineage.idempotency_key, payload: compiled.packet, created_at: T2 });
    assert.equal(inspectInitialProjectWorkPacketLineageV01(f.db, { ...f.scope, packet: compiled.packet }).projection_current, true);
  });
}
function assertAuthoredSecretStillRefused() {
  withFixture("authored-secret", f => {
    const { source } = sourceFor(Buffer.alloc(16, 0x37));
    const issued = issueVNextLocalOperatorBootstrapV01(f.db, { config: f.config, clock: clock(T0), secret_source: source });
    const admitted = consumeVNextLocalOperatorBootstrapV01(f.db, { config: f.config, bootstrap_token: issued.bootstrap_token, clock: clock(T1), secret_source: source });
    const authored = { ...definition, goal: "Retain sk-AAAAAAAAAAAAAAAAAAA as authored material" };
    const invalid = packetValidity(build(f, issued.session.session_id, authored).packet);
    assert.equal(invalid.status, "blocked");
    assert(invalid.errors.some(e => e.code === "secret_shaped_material" && e.path === "$.task.goal"));
    const before = f.db.serialize();
    assert.throws(() => define(f, credential(admitted.cookie_value), source, authored), /first_work_packet_invalid/);
    assert(before.equals(f.db.serialize()), "Authored-secret refusal rolls back packet and session mutation");
  });
}

function assertMalformedIdentitySourceRefused() {
  withFixture("invalid-source", f => {
    const before = f.db.serialize();
    for (const length of [15, 17]) {
      const badSource: VNextLocalOperatorSecretSourceV01 = { bytes: () => new Uint8Array(length) };
      assert.throws(() => issueVNextLocalOperatorBootstrapV01(f.db, { config: f.config, clock: clock(T0), secret_source: badSource }),
        (error: unknown) => error instanceof Error && error.message === "operator_session_conflict" && (error as { status?: number }).status === 500);
      assert(before.equals(f.db.serialize()), "A malformed identity draw creates no session row");
    }
  });
}

export function assertIssuedSessionIdentityCompatibilityV01() {
  assert.equal(collisionBytes.length, 16);
  assert.equal(collisionBytes.toString("base64url"), "sk-AAAAAAAAAAAAAAAAAAA");
  // The fixed collision is first so the exact predecessor fails at the real
  // packet-validity assertion, without expected-failure inversion or retries.
  assertIssuedIdentity(collisionBytes, "issued_identity_collision");
  assertIssuedIdentity(Buffer.alloc(16, 0x35), "ordinary_issued_identity");
  assertLegacyCompatibility();
  assertOtherSessionFamilies();
  assertAuthoredSecretStillRefused();
  assertMalformedIdentitySourceRefused();
  console.log(JSON.stringify({ local_operator_session_identity: "pass", fixed_collision: "actual_issuer_to_initial_packet", legacy_auth_and_lineage: "preserved",
    recovery_and_companion: "preserved", authored_secret: "refused", cleanup: "owned disposable databases and roots removed", model_calls: 0 }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { assertIssuedSessionIdentityCompatibilityV01(); }
  catch (error) { console.error(error); process.exitCode = 1; }
}
