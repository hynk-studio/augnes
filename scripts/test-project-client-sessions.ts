import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { issueVNextLocalOperatorBootstrapV01, issueVNextRepositoryDecisionChallengeV01, readVNextRepositoryDecisionCredentialFromRequestV01, readVNextLocalOperatorRequestProjectV01,
  type VNextLocalOperatorPilotConfigV01 } from "../lib/vnext/runtime/local-operator-session";
import { createVNextLocalOperatorSessionHandlersV01 } from "../app/api/vnext/operator/session/route";
import { createProjectDirectionHandler } from "../app/api/vnext/operator/project-direction/route";
import { resolveProjectClientEntryProjectV01 } from "../lib/vnext/runtime/project-client-entry";
import { readProjectSelectionStateV02, selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";

async function main() {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-project-sessions-")));
  const databasePath = path.join(root, "workspace.db"), db = new Database(databasePath);
  try {
    db.pragma("foreign_keys=ON"); applyCanonicalDatabaseMigrations(db);
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
    const configs = ["A", "B"].map(name => {
      const projectRoot = path.join(root, name); mkdirSync(projectRoot);
      const registration = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
        local_root: normalizeLocalProjectRootRefV01(projectRoot, { base_path: root }), display_name: name });
      return { enabled: true as const, database_path: databasePath, workspace_id: workspace.workspace_id,
        project_id: registration.project.project_id, operator_id: "operator:local-review" };
    });
    const [a, b] = configs as [VNextLocalOperatorPilotConfigV01, VNextLocalOperatorPilotConfigV01];
    // Page entry needs only a stable navigation selector. Explicit scope must
    // neither build the GuideBrief nor touch the default database/selection.
    assert.equal(resolveProjectClientEntryProjectV01(a.project_id, { open_database: () => { throw new Error("unexpected_database_open"); } }), a.project_id);
    const emptyDb = new Database(":memory:"); applyCanonicalDatabaseMigrations(emptyDb);
    assert.equal(resolveProjectClientEntryProjectV01(undefined, { open_database: () => emptyDb }), null);
    assert.equal(emptyDb.open, false, "A no-workspace entry closes its database");
    let entryDb = new Database(databasePath);
    assert.equal(resolveProjectClientEntryProjectV01(undefined, { open_database: () => entryDb }), null);
    assert.equal(entryDb.open, false, "A never-selected entry closes its database");
    const selectedA = selectActiveProjectV01(db, { workspace_id: a.workspace_id, project_id: a.project_id,
      expected_project_id: null, expected_revision: null, now: new Date().toISOString() });
    entryDb = new Database(databasePath);
    assert.equal(resolveProjectClientEntryProjectV01(undefined, { open_database: () => entryDb }), a.project_id);
    assert.equal(entryDb.open, false);
    const selectedB = selectActiveProjectV01(db, { workspace_id: b.workspace_id, project_id: b.project_id,
      expected_project_id: a.project_id, expected_revision: selectedA.selection_revision, now: new Date().toISOString() });
    assert.equal(resolveProjectClientEntryProjectV01(a.project_id, { open_database: () => { throw new Error("unexpected_database_open"); } }), a.project_id);
    assert.deepEqual(readProjectSelectionStateV02(db, b.workspace_id), selectedB, "Opening A cannot activate it or change B's selection");
    const invalidDb = new Database(":memory:");
    assert.throws(() => resolveProjectClientEntryProjectV01(undefined, { open_database: () => invalidDb }));
    assert.equal(invalidDb.open, false, "Failed entry resolution closes its database too");
    let instant = Date.now() + 5;
    const clock = { now: () => new Date(instant).toISOString() };
    const environment = { NODE_ENV: "test" as const, AUGNES_DB_PATH: databasePath,
      AUGNES_LOCAL_REVIEW_PROFILE: "companion_first_work_v1", AUGNES_RUNTIME_CONTRACT: "augnes-local-runtime-supervisor-v1",
      AUGNES_RUNTIME_CHILD_ROLE: "ui", AUGNES_DISTRIBUTION_MODE: "source" };
    const sessions = createVNextLocalOperatorSessionHandlersV01({ environment, clock });
    const direction = createProjectDirectionHandler({ environment, clock });
    // One origin/path cookie jar models the ordinary shared Browser profile;
    // requests overlap at controlled points, without separate profiles.
    const cookies = new Map<string, string>();
    const cookieHeader = () => [...cookies].map(([name, value]) => `${name}=${value}`).join("; ");
    async function call(route: (request: Request) => Promise<Response>, project: string, body?: unknown, suffix = "/session", cookie = cookieHeader()) {
      const response = await route(new Request(`http://127.0.0.1/api/vnext/operator${suffix}`, { method: body ? "POST" : "GET",
        headers: { host: "127.0.0.1", origin: "http://127.0.0.1", cookie, "Augnes-Project-Id": project, "content-type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}) }));
      for (const setCookie of response.headers.getSetCookie()) {
        const pair = setCookie.split(";")[0]!, split = pair.indexOf("=");
        if (pair.slice(split + 1)) cookies.set(pair.slice(0, split), pair.slice(split + 1)); else cookies.delete(pair.slice(0, split));
      }
      return { status: response.status, value: await response.json(), response };
    }
    async function bootstrap(config: VNextLocalOperatorPilotConfigV01) {
      const issue = issueVNextLocalOperatorBootstrapV01(db, { config, clock });
      const result = await call(sessions.POST, config.project_id, { action: "bootstrap", bootstrap_token: issue.bootstrap_token });
      assert.equal(result.status, 200); return result;
    }
    await bootstrap(a);
    assert.equal((await call(sessions.GET, a.project_id)).value.session.project_id, a.project_id);
    await bootstrap(b);
    const afterB = await call(sessions.GET, a.project_id);
    if (process.argv.includes("--reproduce")) {
      assert.equal(afterB.status, 200);
      assert.equal(afterB.value.session.project_id, b.project_id);
      console.log("REPRODUCED: authenticating B replaces the shared cookie; tab A session read silently returns B.");
      return;
    }
    assert.equal(afterB.status, 200);
    assert.equal(afterB.value.session.project_id, a.project_id, "Authenticating B must not retarget A");
    assert.equal((await call(sessions.GET, b.project_id)).value.session.project_id, b.project_id);
    for (const config of configs) {
      const credential = readVNextRepositoryDecisionCredentialFromRequestV01(new Request("http://127.0.0.1/api/vnext/projects", { headers: { cookie: cookieHeader() } }), config.project_id);
      assert.equal(credential.requested_project_id, config.project_id);
      assert.equal(credential.cookie_project_id, config.project_id);
      assert.ok(issueVNextRepositoryDecisionChallengeV01(db, { ...config, credential, request_fingerprint: `sha256:${"a".repeat(64)}`, clock }));
    }
    assert.throws(() => readVNextRepositoryDecisionCredentialFromRequestV01(new Request("http://127.0.0.1/api/vnext/projects", { headers: { cookie: cookieHeader(), "Augnes-Project-Id": b.project_id } }), a.project_id), /operator_session_scope_mismatch/);
    const operatorCookies = [...cookies].filter(([name]) => name.startsWith("augnes_vnext_operator_session_v01_"));
    assert.equal(operatorCookies.length, 2, "Both project credentials coexist in the same browser jar");
    const forgedJar = operatorCookies.map(([name], index) => `${name}=${operatorCookies[1 - index]![1]}`).join("; ");
    assert.equal((await call(sessions.GET, a.project_id, undefined, "/session", forgedJar)).status, 403,
      "Moving B's valid credential into A's cookie name cannot forge project authority");
    assert.equal((await call(sessions.GET, `${a.project_id},${b.project_id}`)).status, 401,
      "An unrelated selector cannot choose either authorized project cookie");
    assert.equal(readVNextLocalOperatorRequestProjectV01(new Request("http://127.0.0.1/", { headers: { "Augnes-Project-Id": "project:legacy.example@scope" } })), "project:legacy.example@scope",
      "Request selection reuses the existing session ID validator, without narrowing compatibility IDs");
    const bogus = issueVNextLocalOperatorBootstrapV01(db, { config: a, clock });
    assert.equal((await call(sessions.POST, b.project_id, { action: "bootstrap", bootstrap_token: bogus.bootstrap_token })).status, 403);
    assert.equal((db.prepare("SELECT bootstrap_consumed_at FROM vnext_local_operator_sessions WHERE session_id=?").get(bogus.session.session_id) as { bootstrap_consumed_at: string | null }).bootstrap_consumed_at, null);
    const pilot = createVNextLocalOperatorSessionHandlersV01({ environment: { NODE_ENV: "test", AUGNES_DB_PATH: databasePath,
      AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1", AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: a.workspace_id,
      AUGNES_VNEXT_OPERATOR_PROJECT_ID: a.project_id, AUGNES_VNEXT_OPERATOR_ID: a.operator_id }, clock });
    assert.equal((await call(pilot.GET, b.project_id)).value.session.project_id, b.project_id, "Enabled pilot can authenticate an explicitly bound B client");
    const otherOperator = issueVNextLocalOperatorBootstrapV01(db, { config: { ...b, operator_id: "operator:other" }, clock });
    assert.equal((await call(pilot.POST, b.project_id, { action: "bootstrap", bootstrap_token: otherOperator.bootstrap_token })).status, 403,
      "Another project's selector cannot expand the enabled pilot operator boundary");
    const disabled = createVNextLocalOperatorSessionHandlersV01({ environment: { ...environment, AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "0" }, clock });
    assert.equal((await call(disabled.GET, b.project_id)).status, 404, "The scoped cookie does not enable a disabled operator profile");
    const decide = (purpose: string) => ({ action: "decide", expected_ref: null, content: { purpose, criteria: [], constraints: [] }, reason: "Independent project work", status: "active", proposal_ref: null });
    // Capture both requests before either rotation, then admit each scoped nonce.
    const sharedCookies = cookieHeader();
    const writes = await Promise.all([a, b].map(config => call(direction, config.project_id, decide(`Purpose ${config.project_id}`), `/project-direction?project_id=${config.project_id}`, sharedCookies)));
    assert.deepEqual(writes.map(result => result.status), [200, 200]);
    for (const config of configs) {
      const readback = await call(direction, config.project_id, undefined, `/project-direction?project_id=${config.project_id}`);
      assert.equal(readback.status, 200);
      assert.equal(readback.value.state.effective.value.content.purpose, `Purpose ${config.project_id}`);
    }
    instant += 100;
    const sameNonce = cookieHeader();
    const sameWork = { ...decide("One winner"), expected_ref: writes[0]!.value.record.ref };
    const overlap = await Promise.all([0, 1].map(() => call(direction, a.project_id, sameWork, `/project-direction?project_id=${a.project_id}`, sameNonce)));
    assert.deepEqual(overlap.map(result => result.status).sort(), [200, 409]);
    assert.equal((await call(direction, a.project_id, sameWork, `/project-direction?project_id=${a.project_id}`, sameNonce)).status, 409);
    assert.equal((await call(direction, a.project_id, undefined, `/project-direction?project_id=${b.project_id}`)).status, 403);
    const revokedCookies = cookieHeader();
    assert.equal((await call(sessions.POST, a.project_id, { action: "logout" })).status, 200);
    assert.equal((await call(sessions.GET, a.project_id, undefined, "/session", revokedCookies)).status, 401);
    assert.equal((await call(sessions.GET, b.project_id)).status, 200, "A logout must preserve B authorization");
    instant += 9 * 60 * 60 * 1000;
    assert.equal((await call(sessions.GET, b.project_id)).status, 401);
    console.log("PASS: lightweight page entry bypass/default/no-selection/error cleanup, shared-profile A/B session isolation, interleaved nonce rotation/readback, same-work CAS/retry, wrong-project/forged/bootstrap/revoked/expired refusal, scoped enabled-pilot and disabled-profile boundaries; owned database and roots cleaned.");
  } finally { db.close(); rmSync(root, { recursive: true, force: true }); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
