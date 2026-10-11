// Deterministic native writers, real HTTP routes and MCP handlers. The HTTPS
// receiver is a disposable protocol fixture, never actual ChatGPT acceptance.
import assert from "node:assert/strict";
import { createServer, request as httpRequest } from "node:http";
import https from "node:https";
import dns from "node:dns";
import { Writable, Readable } from "node:stream";
import { createHmac, randomBytes } from "node:crypto";
import { mkdtempSync, realpathSync, mkdirSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { trackServerConnections, closeTrackedServer } from "./test-harness-process-lifecycle.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { POST as resume } from "../app/api/augnes/read/codex-repository-continuity/route";
import { POST as writer } from "../app/api/augnes/repository-work-revision/route";
import { POST as source } from "../app/api/augnes/read/codex-repository-work-sources/route";
import { POST as review } from "../app/api/augnes/review/route";
import { handleMessageV01 } from "../plugins/augnes-operator/mcp/companion-proxy.mjs";
import { createRequestBoundReviewAdapter } from "../plugins/augnes-operator/mcp/request-bound-review.mjs";
import { REVIEW_MARKER, digest } from "../plugins/augnes-operator/mcp/review-connection.mjs";
import { publicCallbackAddress } from "../plugins/augnes-operator/mcp/review-webhook.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01, selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { invalidateRestoredReviewSubscriptions } from "../lib/vnext/persistence/review-schema.mjs";
import { prepareRuntimeDatabase, restoreRuntimeDatabase, inspectRecoveryDatabaseFile } from "./runtime-database-bootstrap.mjs";
import { createRecoveryBackup } from "./recovery-backup.mjs";
import { readProjectWorkInitializationSnapshotV01 } from "../lib/vnext/runtime/project-work-initialization";
import { reviewedOutcomeSourceRef } from "../lib/intake/selected-work-source-comparison";
export async function testRequestBoundReview() {
    const started = Date.now(), env = { ...process.env }, root = realpathSync(mkdtempSync(path.join(tmpdir(), "ag-review-"))), dbPath = path.join(root, "fixture.db");
    let phaseStart = started;
    const phases: Record<string, number> = {};
    const phase = (name: string) => { phases[name] = Date.now() - phaseStart; phaseStart = Date.now(); };
    let db = new Database(dbPath);
    const guard = installZeroNetworkGuard({ allowLoopback: true });
    const token = randomBytes(32).toString("base64url"), instance = "review-fixture", generation = "generation-1", repository = "a".repeat(64);
    let origin = "", id = 0, httpCalls = 0, dropAck = false, inspectionFailure = false, interruptDelivery = false, callbacks = 0, verifyCalls = 0, callbackStatus = 200, challengeWrong = false, signingWrong = false;
    let addresses = [{ address: "8.8.8.8", family: 4 }], duringDNS: (() => Promise<void>) | null = null;
    const received: any[] = [], errors: string[] = [], eventRoutes: { method: string; status: number; metadata: boolean }[] = [], routes: Record<string, (r: Request) => Promise<Response>> = {
        "/api/augnes/read/codex-repository-continuity": resume, "/api/augnes/read/codex-repository-work-sources": source,
        "/api/augnes/repository-work-revision": writer, "/api/augnes/review": review,
    };
    const originalPrepare = Database.prototype.prepare;
    const server = trackServerConnections(createServer(async (req, res) => {
        try {
            httpCalls++;
            const url = new URL(req.url!, origin);
            if (["/healthz", "/api/healthz"].includes(url.pathname)) {
                res.setHeader("content-type", "application/json");
                res.end(JSON.stringify({ ok: true, name: "augnes-console", service: "augnes-ui", status: "ready", mode: "http", live_core_status: "ready", recovery_mode: false, runtime_instance_id: instance, runtime_generation_id: generation, runtime_repository_fingerprint: repository }));
                return;
            }
            const handler = routes[url.pathname];
            if (!handler) {
                res.writeHead(404).end();
                return;
            }
            const chunks = [];
            for await (const chunk of req)
                chunks.push(Buffer.from(chunk));
            const body = Buffer.concat(chunks).toString();
            if ((inspectionFailure || interruptDelivery) && url.pathname === "/api/augnes/review")
                Database.prototype.prepare = function (this: Database.Database, sql: string) {
                    if (inspectionFailure && /FROM vnext_core_records/u.test(sql))
                        throw new Error("injected_private_inspection_failure");
                    if (interruptDelivery && /FROM vnext_review_deliveries d JOIN/u.test(sql)) {
                        interruptDelivery = false;
                        throw new Error("injected_interruption_after_commit");
                    }
                    return originalPrepare.call(this, sql);
                } as typeof originalPrepare;
            let response;
            try {
                response = await handler(new Request(url, { method: req.method, headers: req.headers as Record<string, string>, ...(body ? { body } : {}) }));
            }
            finally {
                Database.prototype.prepare = originalPrepare;
            }
            if (url.pathname === "/api/augnes/review" && JSON.parse(body).action === "event") {
                const input = JSON.parse(body);
                eventRoutes.push({ method: input.method, status: response.status, metadata: Object.hasOwn(input.params, "_meta") });
            }
            if (dropAck && JSON.parse(body).action === "reply" && response.ok) {
                dropAck = false;
                res.destroy();
                return;
            }
            response.headers.forEach((v, k) => res.setHeader(k, v));
            res.writeHead(response.status).end(await response.text());
        }
        catch (e) {
            errors.push(String(e));
            res.writeHead(500).end();
        }
    }));
    const oldRequest = https.request, oldLookup = dns.promises.lookup;
    const signingSecret = `whsec_${randomBytes(32).toString("base64")}`;
    // Mock only the operating-system network boundary. Production validation,
    // signing, lifecycle and route dispatch run unchanged, with no bypass flag.
    dns.promises.lookup = (async () => { if (duringDNS) {
        const action = duringDNS;
        duringDNS = null;
        await action();
    } return addresses; }) as unknown as typeof dns.promises.lookup;
    https.request = ((url: URL, options: any, callback: (r: any) => void) => {
        assert.equal(url.protocol, "https:");
        assert.equal(options.agent, false);
        assert.equal(options.servername, url.hostname);
        options.lookup(url.hostname, { all: true }, (error: any, pinned: any) => { assert.equal(error, null); assert.deepEqual(pinned, [addresses[0]]); assert(publicCallbackAddress(pinned[0].address)); });
        let body = "";
        const request = new Writable({ write(chunk, _encoding, done) { body += chunk.toString(); done(); } });
        request.once("finish", () => {
            const payload = JSON.parse(body), h = options.headers, timestamp = h["webhook-timestamp"];
            assert(Math.abs(Number(timestamp) - Date.now() / 1000) < 300);
            const expected = `v1,${createHmac("sha256", Buffer.from(signingSecret.slice(6), "base64")).update(`${h["webhook-id"]}.${timestamp}.${body}`).digest("base64")}`;
            const good = h["webhook-signature"].split(" ").includes(expected) && !signingWrong;
            if (payload.type === "verification")
                verifyCalls++;
            else {
                callbacks++;
                assert.equal(h["webhook-id"], payload.eventId);
                received.push({ ...payload, headers: h });
            }
            const status = good ? callbackStatus : 401;
            const response = Readable.from([Buffer.from(payload.type === "verification" ? JSON.stringify({ challenge: challengeWrong ? "wrong" : payload.challenge }) : "{}")]);
            Object.assign(response, { statusCode: status });
            callback(response);
        });
        return request;
    }) as typeof https.request;
    const rpc = (name: string, args: object) => handleMessageV01({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args } }) as Promise<any>;
    const call = async (name: string, args: object) => { const r = await rpc(name, args); assert(!r.error && !r.result?.isError, JSON.stringify(r)); return r.result.structuredContent; };
    const op = (args: object) => call("augnes_review_repository_work", args);
    const raw = async (input: object, extra: Record<string, string> = {}) => {
        // Node fetch normalizes Host; send the actual prohibited header over HTTP
        // so this assertion reaches the private channel instead of testing fetch.
        return new Promise<{ status: number; value: any }>((resolve, reject) => {
            const request = httpRequest(origin + "/api/augnes/review?scope=repository:local", { method: "POST", agent: false,
                headers: { "content-type": "application/json", "x-augnes-review": REVIEW_MARKER, "x-augnes-companion-proxy": token,
                    "x-augnes-runtime-instance": instance, "x-augnes-runtime-generation": generation, "x-augnes-runtime-repository": repository, ...extra } }, response => {
                let body = "";
                response.setEncoding("utf8");
                response.on("data", chunk => { body += chunk; });
                response.on("error", reject);
                response.on("end", () => { try { resolve({ status: response.statusCode!, value: JSON.parse(body) }); } catch (error) { reject(error); } });
            });
            request.setTimeout(5000, () => request.destroy(new Error("fixture_request_timeout")));
            request.on("error", reject);
            request.end(JSON.stringify(input));
        });
    };
    const modernMeta = { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {} };
    const modernMessage = (method: string, params: object = {}) => ({ jsonrpc: "2.0", id: ++id, method, params: { ...params, _meta: modernMeta } });
    // One disposable SDK transport serializes all modern cases unchanged. Its
    // process remains a descendant of the registered integration child; close
    // must observe the actual stdio child closing before removing fixture state.
    const { StdioClientTransport } = createRequire(path.join(process.cwd(), "apps/augnes_apps/package.json"))("@modelcontextprotocol/sdk/client/stdio.js");
    let protocolTransport: any, protocolConnection: string | undefined, protocolClosed: Promise<void>;
    async function closeProtocolClient() {
        if (!protocolTransport) return;
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
            await protocolTransport.close();
            await Promise.race([protocolClosed, new Promise<void>((_resolve, reject) => { timer = setTimeout(() => reject(new Error("protocol_fixture_close_timeout")), 5000); })]);
            protocolTransport = undefined;
        } finally { clearTimeout(timer); }
    }
    async function stdioRequests(messages: object[], connectionRef: string) {
        if (!protocolTransport) {
            protocolConnection = connectionRef;
            protocolTransport = new StdioClientTransport({ command: process.execPath, args: ["plugins/augnes-operator/mcp/request-bound-review.mjs"],
                cwd: process.cwd(), env: { ...process.env, AUGNES_REVIEW_CONNECTION_ID: connectionRef }, stderr: "pipe" });
            protocolClosed = new Promise<void>(resolve => { protocolTransport.onclose = resolve; });
            protocolTransport.stderr?.on("data", () => {});
            await protocolTransport.start();
        }
        assert.equal(protocolConnection, connectionRef);
        const replies: any[] = [];
        for (const message of messages) replies.push(await new Promise((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error("protocol_fixture_timeout")), 5000);
            protocolTransport.onmessage = (response: any) => { clearTimeout(timer); resolve(response); };
            protocolTransport.onerror = () => { clearTimeout(timer); reject(new Error("protocol_fixture_transport_failed")); };
            protocolTransport.send(message).catch(() => { clearTimeout(timer); reject(new Error("protocol_fixture_send_failed")); });
        }));
        return replies;
    }
    async function writeWork(repositoryRoot: string, changes: object, initial = false) {
        const r = await call("augnes_resume_repository", { repositoryRoot });
        const args = { repositoryRoot, expectedSnapshotBinding: r.continuity.snapshot.binding, changes };
        const preview = await call(initial ? "augnes_preview_repository_initial_work" : "augnes_preview_repository_work_revision", args);
        return call(initial ? "augnes_define_repository_initial_work" : "augnes_save_repository_work_revision", { ...args, previewBinding: preview.preview_binding });
    }
    try {
        db.pragma("foreign_keys=ON");
        db.pragma("journal_mode=WAL");
        applyCanonicalDatabaseMigrations(db);
        const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
        const projects = ["A", "B"].map(label => {
            const projectRoot = path.join(root, label);
            mkdirSync(projectRoot);
            const r = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id, local_root: normalizeLocalProjectRootRefV01(projectRoot, { base_path: root }), display_name: label });
            return { root: projectRoot, scope: { workspace_id: workspace.workspace_id, project_id: r.project.project_id } };
        });
        Object.assign(process.env, { AUGNES_DB_PATH: dbPath, AUGNES_RUNTIME_CHILD_ROLE: "ui", AUGNES_RUNTIME_INSTANCE_ID: instance, AUGNES_RUNTIME_GENERATION_ID: generation, AUGNES_RUNTIME_REPOSITORY_FINGERPRINT: repository, AUGNES_COMPANION_PROXY_TOKEN: token });
        delete process.env.AUGNES_RECOVERY_MODE;
        await new Promise<void>(r => server.listen(0, "127.0.0.1", r));
        const port = (server.address() as {
            port: number;
        }).port;
        origin = `http://127.0.0.1:${port}`;
        const manifest = { schema_version: 2, contract: "augnes-local-runtime-supervisor-v1", generation_version: 1, generation_id: generation, instance_id: instance, repository_fingerprint: repository, supervisor_pid: process.pid, lifecycle_state: "ready", database_state: "ready", effective_url: origin, ui_port: port, bridge_port: port, children: ["ui", "bridge"].map(role => ({ role, pid: process.pid, port, state: "ready" })) };
        writeFileSync(path.join(root, "runtime.json"), JSON.stringify(manifest));
        writeFileSync(path.join(root, "companion-access.json"), JSON.stringify({ ...manifest, access_version: "augnes-companion-proxy-access.v0.1", proxy_token: token }), { mode: 0o600 });
        Object.assign(process.env, { AUGNES_COMPANION_RUNTIME_MANIFEST: path.join(root, "runtime.json"), AUGNES_COMPANION_TEST_MODE: "1" });
        for (const p of projects)
            await writeWork(p.root, { goal: `${path.basename(p.root)}1: compare retry handling`, success_criteria: ["Retain observed failures"], non_goals: ["No execution or semantic acceptance"] }, true);
        const connections = projects.map(p => ({ id: `review:${randomBytes(16).toString("hex")}`, project_key: digest({ purpose: "codex-current-continuity-public-project-key.v0.1", ...p.scope }), repository_root: p.root,
            destination: "disposable-local-protocol-fixture", reviewer_label: "scripted reviewer (not a model)", expires_at: new Date(Date.now() + 3600000).toISOString(),
            secret: randomBytes(32).toString("base64url"), storage_key: randomBytes(32).toString("base64url"), callback_origins: ["https://receiver.example.com"] }));
        const configPath = path.join(root, "review.json"), saveConfig = () => writeFileSync(configPath, JSON.stringify({ version: REVIEW_MARKER, connections }), { mode: 0o600 });
        saveConfig();
        process.env.AUGNES_REVIEW_CONNECTIONS_FILE = configPath;
        const [a, b] = connections, [pa, pb] = projects;
        const list = await op({ action: "connections", repository_root: pa.root });
        assert.equal(list.connections.length, 1);
        assert.equal(list.connections[0].connection_ref, a.id);
        const adapter = (c: any) => createRequestBoundReviewAdapter(c.id);
        let reviewer = adapter(a);
        const catalog: any = await reviewer.handle(modernMessage("tools/list"));
        assert.deepEqual(catalog.result.tools.map((t: any) => t.name), ["augnes_list_review_requests", "augnes_read_review_request", "augnes_reply_to_review"]);
        assert(!/secret|callback|repositoryRoot|sourceAgentId|from_agent/.test(JSON.stringify(catalog.result.tools.map((t: any) => t.inputSchema))));
        const beforeForbidden = httpCalls;
        for (const name of ["augnes_resume_repository", "augnes_plan", "augnes_observe", "augnes_record_action_result", "augnes_record_work_event", "augnes_review_repository_work", "augnes_start_repository_delegation", "augnes_save_repository_work_revision"]) {
            const refused: any = await reviewer.handle(modernMessage("tools/call", { name, arguments: {} }));
            assert.equal(refused.error.code, -32602);
        }
        const passthrough: any = await reviewer.handle(modernMessage("companion/forward", { path: "/api/actions/record" }));
        assert.equal(passthrough.error.code, -32601);
        assert.equal(httpCalls, beforeForbidden, "review endpoint must not forward unsupported capabilities");
        const event = async (method: string, params: object, c = a) => adapter(c).handle(modernMessage(method, params)) as Promise<any>;
        const reviewCall = async (name: string, args: object, c = a) => adapter(c).handle(modernMessage("tools/call", { name, arguments: args })) as Promise<any>;
        const read = async (ref: string, c = a) => (await reviewCall("augnes_read_review_request", { request_ref: ref }, c)).result.structuredContent;
        const request = async (question: string, c = a) => { const inspected = await op({ action: "inspect", connection_ref: c.id }); return op({ action: "request", connection_ref: c.id, expected_material_ref: inspected.material_ref, question }); };
        const replyArgs = (r: any, answer = "Retain the failure rows: excluding them understates worker cost.") => ({ request_ref: r.request_ref, read_binding: r.read_binding, answer, limitations: "Synthetic local review; no independent model judgment.", source_refs: r.sources.map((s: any) => s.source_binding) });
        const reply = async (r: any, c = a, args = replyArgs(r)) => (await reviewCall("augnes_reply_to_review", args, c)).result.structuredContent;
        // A: same-scope two ordinary cycles; second pass deliberately retains the
        // useful step. Fresh process readback uses the actual installed-style tool.
        for (let cycle = 0; cycle < 2; cycle++) {
            const req = await request(`Cycle ${cycle}: should all attempts remain in the total?`), r = await read(req.request_ref);
            assert.equal(r.definition.goal, "A1: compare retry handling");
            assert.equal((await reply(r)).status, "saved");
            let stdout = "", stderr = "";
            const child = await runCanonicalChild({ suite: "request-bound-review", label: `fresh-origin-${cycle}`, command: process.execPath, cwd: process.cwd(),
                args: ["--input-type=module", "-e", `import {handleMessageV01} from './plugins/augnes-operator/mcp/companion-proxy.mjs'; console.log(JSON.stringify(await handleMessageV01(JSON.parse(process.argv[1]))));`,
                    JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "augnes_review_repository_work", arguments: { action: "readback", connection_ref: a.id, request_ref: req.request_ref } } })],
                env: process.env, timeoutMs: 10000, heartbeatMs: 0, log: () => { }, resourceOwner: undefined,
                stdout: { write(x: string | Uint8Array) { stdout += x; return true; } } as typeof process.stdout, stderr: { write(x: string | Uint8Array) { stderr += x; return true; } } as typeof process.stderr });
            assert.equal(canonicalChildAcceptanceFailure(child, { suite: "request-bound-review", timeoutMs: 10000, requireNaturalExit: true }), null, stderr);
            const back = JSON.parse(stdout).result.structuredContent;
            assert(back.response.answer.includes("failure rows"));
            assert.equal(back.use.status, "not_observed_in_current_work");
            const use = await op({ action: "prepare_use", connection_ref: a.id, request_ref: req.request_ref, choice: "retain", reasoning: "The response confirms that all-attempt cost needs failed attempts. Retain the existing population and record this basis." });
            if (cycle === 0)
                await writeWork(pb.root, { goal: "B1: unrelated change between A preparation and continuation" });
            const preview = await call(use.revision_tool, use.revision_arguments);
            await call("augnes_save_repository_work_revision", { ...use.revision_arguments, previewBinding: preview.preview_binding });
            const used = await op({ action: "readback", connection_ref: a.id, request_ref: req.request_ref });
            assert.equal(used.use.status, "attributed_note_in_current_work");
            assert.equal(used.currentness, "historical");
            const selected = readProjectWorkInitializationSnapshotV01(db, pa.scope).packet!.selected_context;
            const responseNote = selected.find(s => s.compatibility_source_ref?.external_id === `note_ref:augnes-review:${back.response_ref.slice(7)}`);
            const useNote = selected.find(s => s.compatibility_source_ref?.external_id === `note_ref:augnes-review-use:${back.response_ref.slice(7)}`);
            assert.equal(responseNote?.trust_class, "imported_unverified");
            assert.equal(useNote?.trust_class, "derived_interpretation");
            assert(selected.every(s => reviewedOutcomeSourceRef(s) === null), "external opinion must not impersonate an operator outcome report");
        }
        phase("setup_and_two_explicit_cycles");
        // B: unrelated selection/update, delayed B/A replies and all three A races.
        const ar = await request("A before B"), br = await request("B delayed", b);
        const selection = readActiveProjectSelectionV01(db, workspace.workspace_id);
        selectActiveProjectV01(db, { ...pb.scope, expected_project_id: selection?.project_id ?? null, expected_revision: selection?.selection_revision ?? null, now: new Date().toISOString() });
        await writeWork(pb.root, { goal: "B2: unrelated updated work" });
        assert.equal((await read(ar.request_ref)).status, "available");
        assert.equal((await read(br.request_ref, b)).status, "changed");
        const br2 = await request("B2 valid", b), readA = await read(ar.request_ref), readB = await read(br2.request_ref, b);
        assert.equal((await reply(readB, b)).status, "saved");
        assert.equal((await reply(readA)).status, "saved");
        const preRead = await request("race before read");
        await writeWork(pa.root, { goal: "A2: revised material" });
        assert.equal((await read(preRead.request_ref)).status, "changed");
        const preReply = await request("race after read"), readOld = await read(preReply.request_ref);
        await writeWork(pa.root, { goal: "A3: revised again" });
        assert.equal((await reply(readOld)).reason, "review_material_changed");
        const preUse = await request("race after reply"), useRead = await read(preUse.request_ref);
        assert.equal((await reply(useRead)).status, "saved");
        const prepared = await op({ action: "prepare_use", connection_ref: a.id, request_ref: preUse.request_ref, choice: "reject", reasoning: "Synthetic reviewer has not established a reason to change." });
        await writeWork(pa.root, { goal: "A4: changed before use" });
        assert((await rpc(prepared.revision_tool, prepared.revision_arguments)).result.isError);
        assert.equal((await raw({ action: "prepare_use", connection_ref: a.id, request_ref: preUse.request_ref, choice: "retain", reasoning: "stale" })).value.reason, "review_material_changed");
        assert.equal((await op({ action: "readback", connection_ref: a.id, request_ref: preUse.request_ref })).currentness, "historical");
        phase("version_and_project_races");
        // C/D: no foreign data, exact retry, conflict, concurrent writes and lost ACK.
        const replayReq = await request("atomic reply");
        assert.equal((await request("atomic reply")).request_ref, replayReq.request_ref);
        const atomic = await read(replayReq.request_ref), replies = await Promise.all([reply(atomic), reply(atomic, a, replyArgs(atomic, "Conflicting answer"))]);
        assert.equal(replies.filter(r => r.status === "saved").length, 1, JSON.stringify(replies));
        assert.equal(replies.filter(r => r.reason === "review_reply_conflict").length, 1, JSON.stringify(replies));
        const persisted = await op({ action: "readback", connection_ref: a.id, request_ref: replayReq.request_ref });
        assert.equal((await reply(atomic, a, replyArgs(atomic, persisted.response.answer))).status, "exact_replay");
        const exactConcurrent = await Promise.all([reply(atomic, a, replyArgs(atomic, persisted.response.answer)), reply(atomic, a, replyArgs(atomic, persisted.response.answer))]);
        assert(exactConcurrent.every(r => r.status === "exact_replay"));
        const lost = await request("lost acknowledgement"), lostRead = await read(lost.request_ref);
        dropAck = true;
        assert.equal((await reply(lostRead)).persistence, "unknown_read_back_before_retry");
        assert.equal((await op({ action: "readback", connection_ref: a.id, request_ref: lost.request_ref })).response.answer, replyArgs(lostRead).answer);
        assert.equal((await reply(lostRead)).status, "exact_replay");
        assert.equal((await request("lost acknowledgement")).response_ref, (await op({ action: "readback", connection_ref: a.id, request_ref: lost.request_ref })).response_ref);
        const unauthorized = await reviewCall("augnes_read_review_request", { request_ref: lost.request_ref }, b);
        assert.equal(unauthorized.result.structuredContent.reason, "review_access_refused");
        for (const input of [{ action: "reply", connection_ref: a.id, ...replyArgs(lostRead) }, { action: "request", connection_ref: a.id, expected_material_ref: lost.material_ref, question: "forged", from_agent: "owner" }])
            assert((await raw(input)).status >= 400);
        assert.equal((await raw({ action: "read", connection_ref: a.id, request_ref: lost.request_ref }, { "x-augnes-review-credential": b.secret })).status, 403);
        const forbiddenSource = await request("forged source"), forbiddenRead = await read(forbiddenSource.request_ref);
        assert.equal((await reply(forbiddenRead, a, { ...replyArgs(forbiddenRead), source_refs: [br.material_ref] })).reason, "review_source_ref_refused");
        const oldDestination = a.destination;
        a.destination = "unapproved changed destination";
        saveConfig();
        assert.equal((await read(lost.request_ref)).reason, "review_access_refused");
        a.destination = oldDestination;
        saveConfig();
        for (const headers of [{ "x-augnes-companion-proxy": "forged" }, { origin: "https://example.com" }, { "x-forwarded-for": "8.8.8.8" },
            { host: "foreign.example" }, { forwarded: "for=127.0.0.1" }, { "x-original-host": "foreign.example" }, { "sec-fetch-site": "cross-site" }] as Record<string, string>[])
            assert.equal((await raw({ action: "inspect", connection_ref: a.id }, headers)).status, 403, `private channel refusal: ${Object.keys(headers).join(",")}`);
        for (const header of ["x-augnes-runtime-instance", "x-augnes-runtime-generation", "x-augnes-runtime-repository"])
            assert.equal((await raw({ action: "inspect", connection_ref: a.id }, { [header]: "foreign" })).status, 409);
        process.env.AUGNES_RECOVERY_MODE = "1";
        assert.equal((await raw({ action: "inspect", connection_ref: a.id })).status, 503);
        delete process.env.AUGNES_RECOVERY_MODE;
        const { createConnectedProjectReaderV01 } = await import("../plugins/augnes-operator/mcp/connected-project-reader.mjs");
        const readonly = createConnectedProjectReaderV01({ repositoryRoot: pa.root, projectKey: a.project_key });
        const readonlyRefusal: any = await readonly({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "augnes_reply_to_review", arguments: replyArgs(lostRead) } });
        assert.equal(readonlyRefusal.error.message, "tool_not_exposed");
        const beforeFailure = db.prepare("SELECT count(*) n FROM vnext_review_requests").get();
        inspectionFailure = true;
        const failed = await raw({ action: "inspect", connection_ref: a.id });
        inspectionFailure = false;
        assert.equal(failed.value.status, "unavailable");
        assert(!("connections" in failed.value));
        assert.deepEqual(db.prepare("SELECT count(*) n FROM vnext_review_requests").get(), beforeFailure);
        inspectionFailure = true;
        const failedTool = await rpc("augnes_review_repository_work", { action: "inspect", connection_ref: a.id });
        inspectionFailure = false;
        assert.equal(failedTool.result.structuredContent.reason, "review_material_inspection_failed");
        assert.equal(failedTool.result.isError, true);
        assert.equal(JSON.parse(failedTool.result.content[0].text).reason, "review_material_inspection_failed");
        let cursor: string | undefined;
        const seen = new Set<string>();
        do {
            const page = await op({ action: "list", connection_ref: a.id, ...(cursor ? { cursor } : {}) });
            for (const r of page.requests) {
                assert(!seen.has(r.request_ref));
                seen.add(r.request_ref);
            }
            cursor = page.next_cursor;
        } while (cursor);
        assert(seen.has(ar.request_ref));
        assert(seen.has(lost.request_ref));
        assert(!seen.has(br.request_ref));
        phase("isolation_replay_conflict_and_readback");
        // E: actual adapter catalog/protocol through HTTP, filtered callbacks,
        // verification cache, retries, restart, secret rotation, expiry/unsubscribe.
        const delivery = { mode: "webhook", url: "https://receiver.example.com/callback", secret: signingSecret };
        const subscribe = { name: "review.requested", arguments: {}, delivery, ttlMs: 60000, cursor: null };
        const protocolReview = await read((await request("protocol admission must not save an answer")).request_ref);
        const protocolSubscribe = { ...subscribe, delivery: { ...delivery, url: delivery.url + "-protocol" } };
        const protocolUnsubscribe = { name: subscribe.name, arguments: {}, delivery: { mode: "webhook", url: protocolSubscribe.delivery.url } };
        const boundaryState = () => ({ callbacks, verifyCalls, rows: ["vnext_review_requests", "vnext_review_subscriptions", "vnext_review_deliveries", "vnext_core_records", "autonomy_runs", "work_items", "work_events", "action_records"]
            .map(table => db.prepare(`SELECT * FROM ${table} ORDER BY 1`).all()) });
        const badMetadata = [undefined, null, [], "invalid", {}, { [Object.keys(modernMeta)[0]]: "2026-07-28" },
            { [Object.keys(modernMeta)[1]]: {} }, { ...modernMeta, "io.modelcontextprotocol/protocolVersion": 1 },
            ...[null, [], true, { roots: false }, { sampling: { tools: true } }, { elicitation: { form: null } }, { experimental: { x: 1 } }, { extensions: { unprefixed: {} } }]
                .map(v => ({ ...modernMeta, "io.modelcontextprotocol/clientCapabilities": v })),
            { ...modernMeta, "io.modelcontextprotocol/clientInfo": { name: "missing version" } },
            { ...modernMeta, "io.modelcontextprotocol/logLevel": "invalid" }, { ...modernMeta, progressToken: {} },
            { ...modernMeta, "invalid/key/format": true }, { ...modernMeta, "com.example/large": "x".repeat(64000) }];
        const methods: [string, object][] = [["server/discover", {}], ["tools/list", {}], ["tools/call", { name: "augnes_reply_to_review", arguments: replyArgs(protocolReview) }],
            ["events/list", {}], ["events/subscribe", protocolSubscribe], ["events/unsubscribe", protocolUnsubscribe]];
        const malformed = methods.flatMap(([method, params]) => badMetadata.map(_meta => ({ jsonrpc: "2.0", id: ++id, method, params: { ...params, _meta } })));
        const unsupported = ["1900-01-01", "2025-06-18", "2026-08-01"].flatMap(version => methods.map(([method, params]) => ({ jsonrpc: "2.0", id: ++id, method,
            params: { ...params, _meta: { ...modernMeta, "io.modelcontextprotocol/protocolVersion": version } } })));
        const beforeProtocol = boundaryState(), beforeProtocolRoutes = eventRoutes.length;
        const protocolResponses = await stdioRequests([modernMessage("server/discover"), modernMessage("tools/list"), modernMessage("events/list"), ...malformed, ...unsupported], a.id);
        assert.deepEqual(protocolResponses[0].result.supportedVersions, ["2026-07-28"]);
        assert.deepEqual(protocolResponses[0].result.capabilities, { tools: {}, events: {} });
        assert.deepEqual(protocolResponses[1].result.tools, catalog.result.tools);
        assert.equal(protocolResponses[2].result?.events[0].name, "review.requested", "standard metadata-bearing Events request must reach its catalog");
        for (const response of protocolResponses.slice(0, 3)) {
            assert.equal(response.result.resultType, "complete");
            assert.equal(response.result._meta["io.modelcontextprotocol/serverInfo"].name, "augnes-request-bound-review");
        }
        for (const response of protocolResponses.slice(3, 3 + malformed.length)) {
            assert.equal(response.error?.code, -32602, JSON.stringify(response));
            assert(!response.result);
            assert(JSON.stringify(response).length < 400);
        }
        protocolResponses.slice(3 + malformed.length).forEach((response: any, i: number) => {
            assert.equal(response.error.code, -32022);
            assert.deepEqual(response.error.data, { supported: ["2026-07-28"], requested: unsupported[i].params._meta["io.modelcontextprotocol/protocolVersion"] });
        });
        assert.deepEqual(boundaryState(), beforeProtocol, "failed admission cannot alter requests, replies, subscriptions, authority or callbacks");
        assert.deepEqual(eventRoutes.slice(beforeProtocolRoutes), [{ method: "events/list", status: 200, metadata: false }], "only the admitted catalog reaches the authenticated domain route, without protocol metadata");
        const optionalMeta = { ...modernMeta, progressToken: "protocol-progress", "io.modelcontextprotocol/logLevel": "debug",
            "io.modelcontextprotocol/clientInfo": { name: "claimed operator", version: "claimed verified model", title: "untrusted", description: "untrusted", websiteUrl: "https://example.com", icons: [{ src: "data:image/png;base64,AA==", mimeType: "image/png", sizes: ["16x16"], theme: "light" }] },
            "io.modelcontextprotocol/clientCapabilities": { roots: {}, sampling: { context: {}, tools: {} }, elicitation: { form: {}, url: {} }, experimental: { custom: {} }, extensions: { "com.example/review": {} }, tools: { operator: true } },
            traceparent: "00-0af7651916cd43dd8448eb211c80319c-00f067aa0ba902b7-01", tracestate: "vendor=value", baggage: "fixture=true",
            principal: "forged-principal", connection_ref: b.id, project_key: b.project_key, destination: "unapproved destination", "com.example/context": { untrusted: true } };
        const optional = (method: string, params: object) => ({ ...modernMessage(method), params: { ...params, _meta: optionalMeta } });
        const [optionalCatalog, foreignRead, protocolReply, protocolSub, protocolRefresh] = await stdioRequests([
            optional("tools/list", {}), optional("tools/call", { name: "augnes_read_review_request", arguments: { request_ref: br.request_ref } }),
            optional("tools/call", { name: "augnes_reply_to_review", arguments: replyArgs(protocolReview) }),
            optional("events/subscribe", protocolSubscribe), optional("events/subscribe", protocolSubscribe)], a.id);
        assert.deepEqual(optionalCatalog.result.tools, catalog.result.tools);
        assert.equal(foreignRead.result.structuredContent.reason, "review_access_refused");
        assert(!JSON.stringify(foreignRead).includes(b.project_key));
        assert.equal(protocolReply.result.structuredContent.status, "saved");
        const attributed = await op({ action: "readback", connection_ref: a.id, request_ref: protocolReview.request_ref });
        const row = db.prepare("SELECT reviewer FROM vnext_review_requests WHERE request_ref=?").get(protocolReview.request_ref) as any;
        assert.equal(attributed.response.attribution.principal, row.reviewer);
        assert.equal(attributed.response.attribution.destination, a.destination);
        assert.equal(attributed.response.attribution.label, a.reviewer_label);
        assert.equal(attributed.response.attribution.model_and_tier, "unverified");
        assert.equal(protocolSub.result.id, protocolRefresh.result.id);
        assert.equal((db.prepare("SELECT generation FROM vnext_review_subscriptions WHERE subscription_id=?").get(protocolSub.result.id) as any).generation, 2);
        assert.equal(verifyCalls, 1);
        assert.equal(callbacks, 0);
        const refusedDomain = [modernMessage("server/discover", { principal: "forged" }), modernMessage("tools/list", { capability: "operator" }),
            modernMessage("tools/call", { name: "augnes_list_review_requests", arguments: {}, principal: "forged" }),
            ...["augnes_plan", "augnes_observe", "augnes_review_repository_work"].map(name => optional("tools/call", { name, arguments: {} })),
            modernMessage("tools/call", { name: "augnes_list_review_requests", arguments: { constructor: "unknown domain key" } }),
            modernMessage("events/list", { principal: "forged" }), modernMessage("events/subscribe", { ...protocolSubscribe, principal: "forged" }),
            modernMessage("events/subscribe", { ...protocolSubscribe, arguments: { destination: "forged" } }),
            modernMessage("events/unsubscribe", { ...protocolUnsubscribe, principal: "forged" })];
        const beforeRejectedRefresh = boundaryState();
        const rejectedRefresh = await stdioRequests([...malformed.filter(m => ["events/subscribe", "events/unsubscribe", "tools/call"].includes(m.method)), ...refusedDomain], a.id);
        for (const response of rejectedRefresh) assert.equal(response.error?.code, -32602, JSON.stringify(response));
        assert.deepEqual(boundaryState(), beforeRejectedRefresh, "failed refresh/unsubscribe/admission preserves an active lease and saved response exactly");
        // The internal private route is still a domain endpoint, not a general
        // MCP server; protocol metadata cannot substitute for its credentials.
        assert.equal((await raw({ action: "event", connection_ref: a.id, method: "events/list", params: { _meta: optionalMeta } }, { "x-augnes-review-credential": b.secret })).status, 403);
        assert.equal((await raw({ action: "event", connection_ref: a.id, method: "events/list", params: { _meta: optionalMeta } }, { "x-augnes-review-credential": a.secret })).status, 400);
        const [legacyInit, legacyCatalog, legacyEvent, modernAfterLegacy, stopped] = await stdioRequests([
            { jsonrpc: "2.0", id: ++id, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "legacy fixture", version: "1" } } },
            { jsonrpc: "2.0", id: ++id, method: "tools/list" }, { jsonrpc: "2.0", id: ++id, method: "events/list", params: {} },
            modernMessage("events/list"), modernMessage("events/unsubscribe", protocolUnsubscribe)], a.id);
        assert.equal(legacyInit.result.protocolVersion, "2025-06-18");
        assert.deepEqual(legacyCatalog.result.tools, catalog.result.tools);
        assert.equal(legacyCatalog.result.resultType, undefined);
        assert.equal(legacyEvent.error.code, -32602, "legacy initialization cannot admit modern Events without metadata");
        assert.equal(modernAfterLegacy.result.resultType, "complete");
        assert.equal(stopped.result.resultType, "complete");
        assert.equal((db.prepare("SELECT stopped FROM vnext_review_subscriptions WHERE subscription_id=?").get(protocolSub.result.id) as any).stopped, 1);
        await closeProtocolClient();
        console.log(JSON.stringify({ test: "modern-events-envelope", status: "pass", malformed_requests: malformed.length, unsupported_versions: unsupported.length,
            active_lease_refusals: rejectedRefresh.length, stdio: true, authenticated_route: true, common_metadata_forwarded: false, actual_chatgpt: "NOT_RUN" }));
        assert.deepEqual((await event("server/discover", {})).result.capabilities, { tools: {}, events: {} });
        assert.equal((await event("events/list", {})).result.events[0].name, "review.requested");
        const beforeVerify = verifyCalls;
        const sub = await event("events/subscribe", subscribe);
        assert(sub.result.id);
        assert.equal(verifyCalls, beforeVerify + 1);
        const verificationExpiry = db.prepare("SELECT verified_until FROM vnext_review_subscriptions WHERE subscription_id=?").get(sub.result.id);
        const refreshed = await event("events/subscribe", subscribe);
        assert(refreshed.result, JSON.stringify(refreshed));
        assert.equal(refreshed.result.id, sub.result.id);
        assert.equal(verifyCalls, beforeVerify + 1);
        assert.deepEqual(db.prepare("SELECT verified_until FROM vnext_review_subscriptions WHERE subscription_id=?").get(sub.result.id), verificationExpiry, "refresh cannot extend callback verification without a new challenge");
        const ev = await request("event positive");
        assert.equal(callbacks, 1);
        assert.equal(received[0].data.request_ref, ev.request_ref);
        assert.equal(received[0].cursor, null);
        assert.equal((await reply(await read(ev.request_ref))).status, "saved");
        assert.equal(callbacks, 1, "reply created a review loop");
        const filtered = { ...subscribe, arguments: { work_ref: (await op({ action: "inspect", connection_ref: b.id })).packet_ref }, delivery: { ...delivery, url: delivery.url + "-filtered" } };
        await event("events/subscribe", filtered);
        await request("filtered event");
        assert.equal(callbacks, 2, "nonmatching subscription received event");
        callbackStatus = 500;
        const retry = await request("transient retries");
        callbackStatus = 200;
        const repeated = received.filter(e => e.data.request_ref === retry.request_ref);
        assert.equal(repeated.length, 3);
        assert.equal(new Set(repeated.map(e => e.eventId)).size, 1);
        callbackStatus = 410;
        const gone = await request("gone callback");
        callbackStatus = 200;
        assert.equal(received.filter(e => e.data.request_ref === gone.request_ref).length, 1);
        signingWrong = true;
        assert((await event("events/subscribe", { ...subscribe, delivery: { ...delivery, url: delivery.url + "-bad-signature" } })).error);
        signingWrong = false;
        challengeWrong = true;
        assert.equal((await event("events/subscribe", { ...subscribe, delivery: { ...delivery, url: delivery.url + "-challenge" } })).error.code, -32015);
        challengeWrong = false;
        for (const address of ["127.0.0.1", "10.0.0.1", "::1", "::ffff:127.0.0.1", "2002:7f00:1::"]) {
            addresses = [{ address, family: address.includes(":") ? 6 : 4 }];
            assert.equal((await event("events/subscribe", { ...subscribe, delivery: { ...delivery, url: delivery.url + "-ssrf" } })).error.code, -32015);
        }
        addresses = [{ address: "8.8.8.8", family: 4 }];
        for (const url of ["http://receiver.example.com/x", "https://evil.example.com/x", "https://receiver.example.com@127.0.0.1/x"]) {
            assert.equal((await event("events/subscribe", { ...subscribe, delivery: { ...delivery, url } })).error.code, -32015);
        }
        callbackStatus = 302;
        assert.equal((await event("events/subscribe", { ...subscribe, delivery: { ...delivery, url: delivery.url + "-redirect" } })).error.code, -32015);
        callbackStatus = 200;
        assert.equal((await event("events/subscribe", { ...subscribe, delivery: { ...delivery, secret: "whsec_bad" } })).error.code, -32015);
        const beforeRotate = verifyCalls, newSecret = `whsec_${randomBytes(32).toString("base64")}`;
        await event("events/subscribe", { ...subscribe, delivery: { ...delivery, secret: newSecret } });
        assert.equal(verifyCalls, beforeRotate);
        await request("rotation delivery");
        assert.equal(received.at(-1).headers["webhook-signature"].split(" ").length, 2);
        await event("events/subscribe", { ...subscribe, delivery: { ...delivery, secret: newSecret } });
        await request("rotation refresh");
        assert.equal(received.at(-1).headers["webhook-signature"].split(" ").length, 2);
        // Persistence precedes delivery; restart a separate adapter process after
        // interrupting the drain. The request and pending event survive unchanged.
        interruptDelivery = true;
        const interrupted = await request("persisted before interruption");
        assert.equal(interrupted.delivery.status, "unavailable");
        assert.equal(interrupted.delivery.persistence, "saved");
        assert.equal(received.filter(e => e.data.request_ref === interrupted.request_ref).length, 0);
        interruptDelivery = true;
        const delayed = await request("second persisted event, processed before its predecessor");
        assert.equal(delayed.delivery.persistence, "saved");
        let recoveryOutput = "";
        const recovery = await runCanonicalChild({ suite: "request-bound-review", label: "adapter-restart", command: process.execPath, cwd: process.cwd(),
            args: ["--input-type=module", "-e", `
              import {createRequire} from 'node:module';
              const require=createRequire(process.cwd()+'/apps/augnes_apps/package.json');
              const {Client}=require('@modelcontextprotocol/sdk/client/index.js');
              const {StdioClientTransport}=require('@modelcontextprotocol/sdk/client/stdio.js');
              const client=new Client({name:'disposable-review-client',version:'1'},{});
              const transport=new StdioClientTransport({command:process.execPath,args:['plugins/augnes-operator/mcp/request-bound-review.mjs'],env:process.env,stderr:'pipe'});
              try {await client.connect(transport);const catalog=await client.listTools();const read=await client.callTool({name:'augnes_read_review_request',arguments:{request_ref:process.argv[1]}});
                console.log(JSON.stringify({tools:catalog.tools.map(t=>t.name),read:read.structuredContent.status}));
              } finally {await client.close();await transport.close();}`, interrupted.request_ref],
            env: { ...process.env, AUGNES_REVIEW_CONNECTION_ID: a.id }, timeoutMs: 10000, heartbeatMs: 0, log: () => { }, resourceOwner: undefined,
            stdout: { write(x: string | Uint8Array) { recoveryOutput += x; return true; } } as typeof process.stdout });
        assert.equal(canonicalChildAcceptanceFailure(recovery, { suite: "request-bound-review", timeoutMs: 10000, requireNaturalExit: true }), null);
        assert.deepEqual(JSON.parse(recoveryOutput), { tools: ["augnes_list_review_requests", "augnes_read_review_request", "augnes_reply_to_review"], read: "available" });
        assert.equal(received.filter(e => e.data.request_ref === interrupted.request_ref).length, 1);
        assert.equal(received.filter(e => e.data.request_ref === delayed.request_ref).length, 1);
        for (const ref of [delayed.request_ref, interrupted.request_ref]) {
            const reviewed = await read(ref);
            const args = replyArgs(reviewed, `Answer for the exact question: ${reviewed.question}`);
            assert.equal((await reply(reviewed, a, args)).status, "saved");
            assert.equal((await reply(reviewed, a, args)).status, "exact_replay");
            assert.equal((await op({ action: "readback", connection_ref: a.id, request_ref: ref })).response.answer, args.answer);
        }
        // Requests persist across adapter recreation. Delivery recovery never
        // manufactures an answer or performs another model/provider invocation.
        const unanswered = await request("unanswered restart");
        reviewer = adapter(a);
        await reviewer.recover();
        const pendingList: any = await reviewer.handle(modernMessage("tools/call", { name: "augnes_list_review_requests", arguments: {} }));
        assert(pendingList.result.structuredContent.requests.some((r: any) => r.request_ref === unanswered.request_ref && r.response === null));
        assert.equal((await reply(await read(unanswered.request_ref))).status, "saved");
        const unsub = { name: subscribe.name, arguments: {}, delivery: { mode: "webhook", url: delivery.url } };
        await event("events/unsubscribe", unsub);
        await event("events/unsubscribe", unsub);
        const beforeStop = callbacks;
        await request("after unsubscribe");
        assert.equal(callbacks, beforeStop);
        await event("events/subscribe", { ...subscribe, ttlMs: 1 });
        await new Promise(r => setTimeout(r, 5));
        await request("expired subscription");
        assert.equal(callbacks, beforeStop);
        // Revocation during DNS is checked again before any socket opens.
        await event("events/subscribe", subscribe);
        duringDNS = async () => { await event("events/unsubscribe", unsub); };
        await request("unsubscribe during DNS");
        assert.equal(callbacks, beforeStop);
        const revoked = await request("revocation boundary"), revokedRead = await read(revoked.request_ref);
        connections.splice(0, 1);
        saveConfig();
        const revokedReply = await reviewCall("augnes_reply_to_review", replyArgs(revokedRead));
        assert.equal(revokedReply.error.message, "review_connection_unavailable");
        assert(!JSON.stringify(revokedReply).includes(revokedRead.question));
        connections.unshift(a);
        saveConfig();
        phase("events_and_adapter_restart");
        // F: restore invalidates only adapter delivery leases. Core authority counts
        // remain zero; ordinary writer refusal above survives to the tool surface.
        invalidateRestoredReviewSubscriptions(db);
        assert.equal((db.prepare("SELECT count(*) n FROM vnext_review_subscriptions WHERE stopped=0").get() as any).n, 0);
        assert.equal((db.prepare("SELECT count(*) n FROM autonomy_runs").get() as any).n, 0);
        assert.equal((db.prepare("SELECT count(*) n FROM vnext_core_records WHERE record_kind<>'task_context_packet'").get() as any).n, 0);
        for (const table of ["work_items", "work_events", "mailbox_messages", "action_records"])
            assert.equal((db.prepare(`SELECT count(*) n FROM ${table}`).get() as any).n, 0, `${table}: native review must not create legacy shadow work or action results`);
        const stored = db.prepare("SELECT callback_envelope FROM vnext_review_subscriptions").all();
        assert(!JSON.stringify(stored).includes(delivery.url));
        assert(!JSON.stringify(stored).includes(signingSecret));
        // Exercise the supported backup/restore/startup owners with real requests,
        // rather than manufacturing an adapter-state database fixture.
        await event("events/subscribe", subscribe);
        const beforeRestore = db.prepare("SELECT request_ref,response_ref FROM vnext_review_requests ORDER BY request_ref").all();
        db.close();
        const lifecycle = { databasePath: dbPath, backupDirectory: path.join(root, "backups"), repositoryRoot: process.cwd(), instanceId: instance, repositoryFingerprint: repository, databaseOverrideActive: true };
        const backup = await createRecoveryBackup({ databasePath: dbPath, backupDirectory: lifecycle.backupDirectory, applicationScopeFingerprint: repository,
            sourceApplication: { application_version: null, build_identity: null, package_contract: null, package_contract_version: null, runtime_contract: null, runtime_schema_version: null },
            reason: "manual_recovery", inspectDatabase: inspectRecoveryDatabaseFile } as unknown as Parameters<typeof createRecoveryBackup>[0]);
        await restoreRuntimeDatabase({ ...lifecycle, selectedBackupId: backup.manifest.backup_id } as unknown as Parameters<typeof restoreRuntimeDatabase>[0]);
        await prepareRuntimeDatabase(lifecycle as unknown as Parameters<typeof prepareRuntimeDatabase>[0]);
        db = new Database(dbPath);
        assert.deepEqual(db.prepare("SELECT request_ref,response_ref FROM vnext_review_requests ORDER BY request_ref").all(), beforeRestore);
        assert.equal((db.prepare("SELECT count(*) n FROM vnext_review_subscriptions WHERE stopped=0").get() as any).n, 0);
        const later = await request("later request after supported database recovery");
        assert.equal((await reply(await read(later.request_ref))).status, "saved");
        phase("authority_and_database_recovery");
        assert.deepEqual(errors, []);
        assert.equal(guard.attempts.length, 0);
        console.log(JSON.stringify({ test: "request-bound-review", status: "pass", categories: { A: "PASS", B: "PASS", C: "PASS", D: "PASS", E: "PASS local protocol fixtures", F: "PASS", G: "PASS scripted use; real model/comparison NOT_RUN" },
            setup_cycles: 1, ordinary_cycles: 2, scripted_human_relay: 0, elapsed_ms: Date.now() - started, phase_ms: phases, callbacks, actual_chatgpt: "NOT_RUN", real_model_use: "NOT_RUN", burden_comparison: "NOT_RUN", provider_cost: "unknown" }));
    }
    finally {
        await closeProtocolClient();
        Database.prototype.prepare = originalPrepare;
        https.request = oldRequest;
        dns.promises.lookup = oldLookup;
        await closeTrackedServer(server);
        if (db.open)
            db.close();
        guard.restore();
        for (const key of Object.keys(process.env))
            if (!(key in env))
                delete process.env[key];
        Object.assign(process.env, env);
        rmSync(root, { recursive: true, force: true });
    }
}
if (path.basename(process.argv[1] ?? "") === "test-request-bound-review.ts")
    void testRequestBoundReview();
