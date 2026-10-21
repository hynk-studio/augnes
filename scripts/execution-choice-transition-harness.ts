// Disposable deterministic handlers/proxies. No actual external participant,
// model judgment, production service, execution grant or provider call.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { writeFileSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { trackServerConnections, closeTrackedServer } from "./test-harness-process-lifecycle.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { POST as resume } from "../app/api/augnes/read/codex-repository-continuity/route";
import { POST as sources } from "../app/api/augnes/read/codex-repository-work-sources/route";
import { POST as writer } from "../app/api/augnes/repository-work-revision/route";
import { POST as retained } from "../app/api/augnes/read/codex-repository-retained-sources/route";
import { EXECUTION_CHOICE_TOOL } from "../plugins/augnes-operator/mcp/execution-choice.mjs";
import { POST as review } from "../app/api/augnes/review/route";
import { handleMessageV01 } from "../plugins/augnes-operator/mcp/companion-proxy.mjs";
import { createRequestBoundReviewAdapter } from "../plugins/augnes-operator/mcp/request-bound-review.mjs";
const [mode, directory] = process.argv.slice(2), dbPath = path.join(directory, "fixture.db"), root = path.join(directory, "project");
const artifactDirectory = path.join(directory, "artifacts");
const save = (name: string, value: unknown) => writeFileSync(path.join(artifactDirectory, name + ".json"), JSON.stringify(value, null, 2) + "\n");
const configPath = path.join(directory, "review.json");
const guard = installZeroNetworkGuard({ allowLoopback: true }), started = Date.now();
const trace: any[] = [], failures: string[] = [], checks: string[] = [];
const db = new Database(dbPath);
let origin = "", id = 0, saveFailure = false;

const token = randomBytes(32).toString("base64url"), instance = "execution-choice-transition-fixture", generation = randomBytes(16).toString("hex"), repository = "d".repeat(64);
const routes: Record<string, (r: Request) => Promise<Response>> = {
    "/api/augnes/read/codex-repository-continuity": resume, "/api/augnes/read/codex-repository-work-sources": sources,
    "/api/augnes/read/codex-repository-retained-sources": retained,
    "/api/augnes/repository-work-revision": writer, "/api/augnes/review": review,
};
const originalPrepare = Database.prototype.prepare;
const server = trackServerConnections(createServer(async (req, res) => {
    try {
        const url = new URL(req.url!, origin);
        if (["/healthz", "/api/healthz"].includes(url.pathname)) {
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ ok: true, name: "augnes-console", service: "augnes-ui", status: "ready", mode: "http", live_core_status: "ready", recovery_mode: false,
                runtime_instance_id: instance, runtime_generation_id: generation, runtime_repository_fingerprint: repository })); return;
        }
        const handler = routes[url.pathname]; if (!handler) { res.writeHead(404).end(); return; }
        const chunks = []; for await (const chunk of req) chunks.push(Buffer.from(chunk));
        const body = Buffer.concat(chunks).toString(), input = JSON.parse(body), before = db.serialize();
        Database.prototype.prepare = function (this: Database.Database, sql: string) {
            if (saveFailure && /INSERT INTO vnext_core_records/u.test(sql)) throw new Error("injected_ordinary_save_failure");
            return originalPrepare.call(this, sql);
        } as typeof originalPrepare;
        let response;
        try { response = await handler(new Request(url, { method: req.method, headers: req.headers as Record<string, string>, body })); }
        finally { Database.prototype.prepare = originalPrepare; }
        if (response.status >= 400 || url.pathname.includes("/read/") || input.action === "preview" ||
            (url.pathname.endsWith("/review") && ["inspect", "list", "reassess", "prepare_use", "prepare_reassessed_use"].includes(input.action)))
            assert(before.equals(db.serialize()), "read/preparation/preview/refusal changed durable bytes");
        response.headers.forEach((v, k) => res.setHeader(k, v)); res.writeHead(response.status).end(await response.text());
    } catch (error) { failures.push(String(error)); res.writeHead(500).end('{"fixture_error":true}'); }
}));
const modern = { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {} };
async function raw(name: string, args: object) {
    const r: any = await handleMessageV01({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args } });
    trace.push({ name, arguments: args, result: r.result?.structuredContent ?? r.error,
        ...(name === EXECUTION_CHOICE_TOOL ? { content: r.result?.content } : {}) }); return r;
}
async function call(name: string, args: object) {
    const r = await raw(name, args); assert(!r.error && !r.result?.isError, JSON.stringify(r)); return r.result.structuredContent;
}
const op = (args: object) => call("augnes_review_repository_work", args);
async function reviewer(c: any, name: string, args: object) {
    const r: any = await createRequestBoundReviewAdapter(c.id).handle({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args, _meta: modern } });
    const result = r.result?.structuredContent ?? r.error;
    trace.push({ reviewer: c.reviewer_label, name, arguments: args, result }); return result;
}
async function readCurrent() {
    const r = await call("augnes_resume_repository", { repositoryRoot: root });
    return { snapshot: r.continuity.snapshot.binding, ...(await call("augnes_read_repository_work_sources", { repositoryRoot: root, expectedSnapshotBinding: r.continuity.snapshot.binding })) };
}
async function saveChanges(changes: object, initial = false, repositoryRoot = root) {
    const r = await call("augnes_resume_repository", { repositoryRoot });
    const args = { repositoryRoot, expectedSnapshotBinding: r.continuity.snapshot.binding, changes };
    const preview = await call(initial ? "augnes_preview_repository_initial_work" : "augnes_preview_repository_work_revision", args);
    return call(initial ? "augnes_define_repository_initial_work" : "augnes_save_repository_work_revision", { ...args, previewBinding: preview.preview_binding });
}
async function savePrepared(prepared: any) {
    const p = await call(prepared.revision_tool, prepared.revision_arguments);
    return call("augnes_save_repository_work_revision", { ...prepared.revision_arguments, previewBinding: p.preview_binding });
}
const note = (source: string, value: unknown, provenance = "imported_unverified") => ({ source, text: typeof value === "string" ? value : JSON.stringify(value), provenance, observed_at: null, label: "Next check" });
const replyArgs = (r: any, answer: unknown) => ({ request_ref: r.request_ref, read_binding: r.read_binding,
    answer: JSON.stringify(answer), limitations: "Synthetic packing arithmetic; physical stock unknown; no model judgment or dispatch authority.", source_refs: r.sources.map((s: any) => s.source_binding) });
const refused = async (label: string, run: () => Promise<any>, reason?: string) => {
    const before = db.serialize(), r = await run();
    const v = r.result?.structuredContent ?? r;
    assert(["refused", "unavailable", "changed", "refresh_required", "preview_changed"].includes(v.status) || r.result?.isError || r.error || r.code, `${label}: ${JSON.stringify(r)}`);
    if (reason) assert.equal(v.reason, reason, label);
    assert(before.equals(db.serialize()), `${label}: refusal must be atomic`); checks.push(label); return v;
};
async function setupServer() {
    Object.assign(process.env, { AUGNES_DB_PATH: dbPath, AUGNES_RUNTIME_CHILD_ROLE: "ui", AUGNES_RUNTIME_INSTANCE_ID: instance,
        AUGNES_RUNTIME_GENERATION_ID: generation, AUGNES_RUNTIME_REPOSITORY_FINGERPRINT: repository, AUGNES_COMPANION_PROXY_TOKEN: token,
        AUGNES_REVIEW_CONNECTIONS_FILE: configPath, AUGNES_COMPANION_TEST_MODE: "1" });
    delete process.env.AUGNES_RECOVERY_MODE;
    await new Promise<void>(r => server.listen(0, "127.0.0.1", r));
    const port = (server.address() as { port: number }).port; origin = `http://127.0.0.1:${port}`;
    const manifest = { schema_version: 2, contract: "augnes-local-runtime-supervisor-v1", generation_version: 1, generation_id: generation, instance_id: instance,
        repository_fingerprint: repository, supervisor_pid: process.pid, lifecycle_state: "ready", database_state: "ready", effective_url: origin, ui_port: port, bridge_port: port,
        children: ["ui", "bridge"].map(role => ({ role, pid: process.pid, port, state: "ready" })) };
    writeFileSync(path.join(directory, "runtime.json"), JSON.stringify(manifest));
    writeFileSync(path.join(directory, "companion-access.json"), JSON.stringify({ ...manifest, access_version: "augnes-companion-proxy-access.v0.1", proxy_token: token }), { mode: 0o600 });
    process.env.AUGNES_COMPANION_RUNTIME_MANIFEST = path.join(directory, "runtime.json");
}

async function choice(action: string, values: object = {}, allowRefusal = false) {
    const c = await readCurrent();
    const args = { action, repositoryRoot: root, expectedSnapshotBinding: c.snapshot, ...values };
    const before = db.serialize(); const r = await raw(EXECUTION_CHOICE_TOOL, args);
    assert(before.equals(db.serialize()), "execution-choice read/preparation must not write");
    if (!allowRefusal) assert(!r.error && !r.result?.isError, JSON.stringify(r));
    return r.result?.structuredContent ?? r.error;
}
async function lookup(query: string) {
    const c = await readCurrent();
    return call("augnes_lookup_repository_retained_sources", {repositoryRoot: root, expectedSnapshotBinding: c.snapshot, query});
}
const find = (c: any, locator: string) => c.sources.find((s: any) => s.source_locator === locator);
const jsonNote = (c: any, locator: string) => JSON.parse(find(c, locator).excerpt_text);

async function finish() {
    Database.prototype.prepare = originalPrepare;
    await closeTrackedServer(server); db.close(); guard.restore();
    save(mode + "-trace", trace);
    save(mode + "-settlement", {closed_listener:true,closed_database:true,elapsed_ms:Date.now()-started});
    assert.equal(failures.length, 0, failures.join("\n"));
}
const setSaveFailure = (value: boolean) => { saveFailure = value; };
export { mode, directory, root, db, artifactDirectory, configPath, started, checks, save, raw, call, op, reviewer, readCurrent, saveChanges, savePrepared, note, replyArgs, refused, setupServer, finish, choice, lookup, find, jsonNote, setSaveFailure };
