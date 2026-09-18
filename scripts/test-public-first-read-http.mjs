import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { buildCanonicalChildEnvironment, createCanonicalTestResourceRoot, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { registerOwnedChild, terminateOwnedProcessTree, trackServerConnections, closeTrackedServer } from "./test-harness-process-lifecycle.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";

// This child serves a disposable copy of the real production build, not a mock
// route. Its working directory has no retained env files, DB or user profile.
if (process.argv[2] === "--serve") {
  installZeroNetworkGuard({ allowLoopback: true,
    onBlockedAttempt: () => process.send?.({ kind: "blocked-network-attempt" }) });
  const { startServer } = await import("next/dist/server/lib/start-server.js");
  await startServer({ dir: process.cwd(), isDev: false, hostname: "127.0.0.1", port: Number(process.argv[3]), allowRetry: false });
  process.send?.({ kind: "ready" });
} else {
  await qualify();
}

async function qualify() {
  const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  assert.ok(existsSync(path.join(repository, ".next/BUILD_ID")), "run npm run build before HTTP qualification");
  const fixture = JSON.parse(readFileSync(path.join(repository, "fixtures/public-first-read-tool-library.v0.1.json"), "utf8"));
  const { renderPublicFirstReadV01 } = await import("../lib/vnext/adapters/public-first-read.ts");
  const expected = renderPublicFirstReadV01(fixture);
  const owner = createCanonicalTestResourceRoot("ag-suite-");
  const application = path.join(owner.root, "application");
  const state = path.join(owner.root, "state");
  const processes = new Set();
  let childRecord;
  let attempts = 0;
  let requests = 0;
  const guard = installZeroNetworkGuard({ allowLoopback: true });
  try {
    mkdirSync(application);
    mkdirSync(state);
    cpSync(path.join(repository, ".next"), path.join(application, ".next"), { recursive: true,
      filter: (source) => !["cache", "standalone", "dev"].includes(path.relative(path.join(repository, ".next"), source).split(path.sep)[0]) });
    symlinkSync(path.join(repository, "node_modules"), path.join(application, "node_modules"), "dir");
    const environment = buildCanonicalChildEnvironment({ temporaryRoot: owner.root });
    environment.NODE_ENV = "production";
    environment.NEXT_TELEMETRY_DISABLED = "1";
    environment.AUGNES_DB_PATH = path.join(state, "canonical.db");
    environment.AUGNES_RUNTIME_STATE_DIR = path.join(state, "runtime");
    mkdirSync(environment.HOME, { recursive: true });
    mkdirSync(environment.AUGNES_RUNTIME_STATE_DIR);
    writeFileSync(path.join(environment.AUGNES_RUNTIME_STATE_DIR, "disposable-session-guard"), "private-session-material");
    const database = new Database(environment.AUGNES_DB_PATH);
    applyCanonicalDatabaseMigrations(database);
    database.prepare(`INSERT INTO state_entries (id, scope, state_key, value, temporal_scope, stability, change_type,
      source_agent_id, source_session_id, source_transition_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?)`).run(
      "public-read-disposable", "project:public-read-disposable", "private-guard", '"private-retained-material"',
      "current", "temporary", "test", "2000-01-01T00:00:00.000Z", "2000-01-01T00:00:00.000Z");
    database.close();
    const snapshot = () => {
      const db = new Database(environment.AUGNES_DB_PATH, { readonly: true, fileMustExist: true });
      try {
        const records = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all()
          .map(({ name }) => [name, db.prepare(`SELECT count(*) AS n FROM "${name.replaceAll('"', '""')}"`).get().n]);
        return { files: fileHashes(state), records };
      } finally { db.close(); }
    };
    const baseline = snapshot();
    const reservation = net.createServer();
    trackServerConnections(reservation);
    await new Promise((resolve, reject) => { reservation.once("error", reject); reservation.listen(0, "127.0.0.1", resolve); });
    const port = reservation.address().port;
    await closeTrackedServer(reservation);
    const child = spawn(process.execPath, [fileURLToPath(import.meta.url), "--serve", String(port)], {
      cwd: application, env: environment, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe", "ipc"],
    });
    childRecord = registerOwnedChild(processes, child, { label: "public-first-read-http" });
    // Drain bounded runtime diagnostics without printing private paths or errors.
    child.stdout.on("data", () => {});
    child.stderr.on("data", () => {});
    child.on("message", (message) => { if (message?.kind === "blocked-network-attempt") attempts++; });
    await new Promise((resolve, reject) => {
      const deadline = setTimeout(() => reject(new Error("public_http_start_timeout")), 30_000);
      child.once("error", () => { clearTimeout(deadline); reject(new Error("public_http_start_failed")); });
      child.once("exit", () => { clearTimeout(deadline); reject(new Error("public_http_early_exit")); });
      child.on("message", (message) => { if (message?.kind === "ready") { clearTimeout(deadline); resolve(); } });
    });
    const hashes = {};
    for (const [suffix, format, type] of [["", "html", "text/html"], [".md", "markdown", "text/markdown"], [".json", "json", "application/json"]]) {
      for (let repeat = 0; repeat < 2; repeat++) {
        const response = await fetch(`http://127.0.0.1:${port}/public-cases/${fixture.case_id}${suffix}?private=disposable-query`, {
          headers: { cookie: "disposable-private-cookie", authorization: "Bearer disposable-private-token" },
          signal: AbortSignal.timeout(10_000),
        });
        requests++;
        assert.equal(response.status, 200);
        assert.ok(response.headers.get("content-type").startsWith(type));
        assert.equal(response.headers.has("set-cookie"), false);
        const body = await response.text();
        assert.equal(body, expected[format], "actual HTTP bytes must equal the qualified semantic owner");
        assert.equal(body, readFileSync(path.join(application, `.next/server/app/public-cases/${fixture.case_id}${suffix}.body`), "utf8"), "HTTP must serve the statically generated body");
        assert.doesNotMatch(body, /private-retained-material|private-session-material|disposable-private|disposable-query/u);
        if (format === "html") assert.doesNotMatch(body, /<script\b|\ssrc=|<iframe\b|<form\b/iu);
        hashes[format] = createHash("sha256").update(body).digest("hex");
      }
    }
    // Next 16.2.4 returns the prerendered body even for POST on this static
    // route. Prove ignored input and unchanged content/state, not an assumed
    // 405. No request body reader or mutation handler exists in the route.
    const ignored = await fetch(`http://127.0.0.1:${port}/public-cases/${fixture.case_id}`, { method: "POST", body: "disposable-private-upload", signal: AbortSignal.timeout(10_000) });
    requests++;
    assert.equal(ignored.status, 200);
    assert.equal(await ignored.text(), expected.html);
    const afterPost = await fetch(`http://127.0.0.1:${port}/public-cases/${fixture.case_id}`, { signal: AbortSignal.timeout(10_000) });
    requests++;
    assert.equal(await afterPost.text(), expected.html);
    assert.deepEqual(snapshot(), baseline);
    assert.deepEqual(guard.attempts, []);
    assert.equal(attempts, 0);
    console.log(JSON.stringify({ public_first_read_http: "pass", no_js: "raw_HTTP_no_script_or_subresources",
      loopback_requests: requests, external_provider_model_attempts: attempts,
      post_body: "ignored_unchanged_static_body", product_canonical_session_bytes_changed: 0, table_record_counts_changed: 0, hashes }));
  } finally {
    if (childRecord) await terminateOwnedProcessTree(childRecord, { termGraceMs: 5_000, killGraceMs: 5_000 });
    guard.restore();
    assert.equal(processes.size, 0);
    const cleanup = cleanupCanonicalTestResources([owner]);
    assert.ok(cleanup.every((entry) => entry.completed));
    console.log(JSON.stringify({ public_first_read_http_cleanup: "complete", remaining_owned_processes: 0,
      temporary_application_database_runtime_removed: !existsSync(owner.root) }));
  }
}

function fileHashes(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap((entry) => {
    const relative = path.join(prefix, entry.name);
    return entry.isDirectory() ? fileHashes(path.join(directory, entry.name), relative)
      : [[relative, createHash("sha256").update(readFileSync(path.join(directory, entry.name))).digest("hex")]];
  });
}
