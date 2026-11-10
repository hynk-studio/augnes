// Runs inside the registered supervisor lifecycle child, reusing its real Next
// runtime and stop/start owner. No route imports, alternate HTTP server or model.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { request as httpRequest } from "node:http";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import Database from "better-sqlite3";
import { declareAndInspectLocalProjectV01, confirmLocalProjectOnboardingV01 } from "../lib/vnext/onboarding/local-project-onboarding";
import { discoverVerifiedCompanionV01 } from "../plugins/augnes-operator/mcp/companion-proxy.mjs";
import { REVIEW_MARKER } from "../plugins/augnes-operator/mcp/review-connection.mjs";
import { receiverSecret } from "./test-review-receiver-fixture.mjs";

const modernMeta = { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {} };
const reviewTools = ["augnes_list_review_requests", "augnes_read_review_request", "augnes_reply_to_review", "augnes_get_review_status"];
const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");

type Fixture = ReturnType<typeof prepareSupervisedReviewHttp>;
export function prepareSupervisedReviewHttp(root: string, temporaryRoot: string, databasePath: string) {
    const directory = path.join(temporaryRoot, "review-http");
    mkdirSync(directory, { mode: 0o700 });
    const networkAttempts = path.join(directory, "network-attempts.jsonl");
    const preload = path.join(directory, "network-preload.mjs");
    const receiverRecords = path.join(directory, "receiver.jsonl");
    writeFileSync(preload, `import {appendFileSync} from 'node:fs';
import {installZeroNetworkGuard} from ${JSON.stringify(pathToFileURL(path.join(root, "scripts/test-harness-zero-network-guard.mjs")).href)};
// The review owner is UI-only. The separate legacy bridge uses tsx Unix IPC.
if(process.env.AUGNES_RUNTIME_CHILD_ROLE !== 'bridge') installZeroNetworkGuard({allowLoopback:true,onBlockedAttempt:a=>appendFileSync(${JSON.stringify(networkAttempts)},JSON.stringify(a)+'\\n',{mode:0o600})});
import {installReviewReceiverFixture} from ${JSON.stringify(pathToFileURL(path.join(root, "scripts/test-review-receiver-fixture.mjs")).href)};
if(process.env.AUGNES_RUNTIME_CHILD_ROLE === 'ui') installReviewReceiverFixture(${JSON.stringify(receiverRecords)});
`, { mode: 0o600 });
    return { root, directory, databasePath, networkAttempts, preload, receiverRecords, config: path.join(directory, "connections.json"),
        projectRoot: path.join(directory, "synthetic-project"), connection: null as any, pending: null as any,
        priorRuntime: null as any, initialPassed: false, recoveryPassed: false, refusalCases: 0 };
}

export async function assertSupervisedReviewHttp(f: Fixture, environment: NodeJS.ProcessEnv, ready: any, recovery = false) {
    const sdk = createRequire(path.join(f.root, "apps/augnes_apps/package.json"));
    const { Client } = sdk("@modelcontextprotocol/sdk/client/index.js");
    const { StdioClientTransport } = sdk("@modelcontextprotocol/sdk/client/stdio.js");
    const env: NodeJS.ProcessEnv = { ...environment, AUGNES_REVIEW_CONNECTIONS_FILE: f.config,
        NODE_OPTIONS: `--import=${pathToFileURL(f.preload).href}` };
    delete env.OPENAI_API_KEY;
    delete env.AUGNES_COMPANION_RUNTIME_MANIFEST;
    delete env.AUGNES_COMPANION_TEST_MODE;
    const found = await discoverVerifiedCompanionV01(env);
    assert.equal(found.status, "resolved");
    const companion = found.companion;
    assert.equal(companion.instance_id, ready.instance_id);
    const manifest = JSON.parse(readFileSync(path.join(env.AUGNES_RUNTIME_STATE_DIR!, "runtime.json"), "utf8"));
    assert.equal(companion.generation_id, manifest.generation_id);
    assert.equal(companion.repository_fingerprint, manifest.repository_fingerprint);
    const db = new Database(f.databasePath, { fileMustExist: true });
    const transports: any[] = [];
    let origin: any, reviewer: any, sequence = 0;
    async function transport(entrypoint: string, extra = {}) {
        const t = new StdioClientTransport({ command: process.execPath, args: [path.join(f.root, "plugins/augnes-operator/mcp", entrypoint)], cwd: f.root, env: { ...env, ...extra }, stderr: "pipe" });
        transports.push(t);
        // A real close event, not a request to close, is the fixture boundary.
        t.closed = new Promise<void>(resolve => { t.onclose = resolve; });
        t.stderr?.on("data", () => {});
        return t;
    }
    async function close(t: any) {
        let timer: ReturnType<typeof setTimeout> | undefined;
        try {
            await t.close();
            await Promise.race([t.closed, new Promise<void>((_, reject) => { timer = setTimeout(() => reject(new Error("review_stdio_cleanup_timeout")), 5000); })]);
        } finally { clearTimeout(timer); }
    }
    async function freshOrigin() {
        if (origin) await close(origin.transport);
        const t = await transport("companion-proxy.mjs");
        const client = new Client({ name: "supervised-review-origin-fixture", version: "1.0.0" });
        await client.connect(t);
        // Client.connect owns onclose; preserve an observation after connecting.
        const onclose = t.onclose;
        t.closed = new Promise<void>(resolve => { t.onclose = () => { onclose?.(); resolve(); }; });
        origin = { client, transport: t };
    }
    const call = async (name: string, args: object) => {
        const r = await origin.client.callTool({ name, arguments: args });
        assert.notEqual(r.isError, true, `origin ${name}: ${r.structuredContent?.reason ?? "unavailable"}`);
        assert(r.structuredContent);
        return r.structuredContent;
    };
    const op = (args: object) => call("augnes_review_repository_work", args);
    const modern = (method: string, params: object = {}) => ({ jsonrpc: "2.0", id: ++sequence, method, params: { ...params, _meta: modernMeta } });
    const rpc = (message: object): Promise<any> => new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("review_stdio_timeout")), 15000);
        reviewer.onmessage = (reply: any) => { clearTimeout(timer); resolve(reply); };
        reviewer.onerror = () => { clearTimeout(timer); reject(new Error("review_stdio_failed")); };
        reviewer.send(message).catch(() => { clearTimeout(timer); reject(new Error("review_stdio_send_failed")); });
    });
    const review = async (name: string, args: object) => {
        const r = await rpc(modern("tools/call", { name, arguments: args }));
        assert(!r.error, `review protocol: ${r.error?.code}`);
        assert(r.result?.structuredContent);
        assert.equal(r.result.content[0].text, JSON.stringify(r.result.structuredContent), "failure and currentness survive the rendered tool result");
        return r.result.structuredContent;
    };
    const saveWork = async (changes: object, initial = false) => {
        const current = await call("augnes_resume_repository", { repositoryRoot: f.projectRoot });
        const args = { repositoryRoot: f.projectRoot, expectedSnapshotBinding: current.continuity.snapshot.binding, changes };
        const preview = await call(initial ? "augnes_preview_repository_initial_work" : "augnes_preview_repository_work_revision", args);
        const saved = await call(initial ? "augnes_define_repository_initial_work" : "augnes_save_repository_work_revision", { ...args, previewBinding: preview.preview_binding });
        assert.equal(saved.status, "saved");
        return current;
    };
    const raw = (input: object, query = "?scope=repository:local", extra: Record<string, string | null> = {}): Promise<any> => new Promise((resolve, reject) => {
        const headers: Record<string, string> = { "content-type": "application/json", "x-augnes-review": REVIEW_MARKER,
            "x-augnes-companion-proxy": companion.proxy_token, "x-augnes-runtime-instance": companion.instance_id,
            "x-augnes-runtime-generation": companion.generation_id, "x-augnes-runtime-repository": companion.repository_fingerprint };
        for (const [k, v] of Object.entries(extra)) { if (v === null) delete headers[k]; else headers[k] = v; }
        const req = httpRequest(new URL("/api/augnes/review" + query, companion.ui_url), { method: "POST", agent: false, headers }, res => {
            let text = "";
            res.setEncoding("utf8"); res.on("data", c => { text += c; }); res.on("error", reject);
            res.on("end", () => { try { resolve({ status: res.statusCode, value: JSON.parse(text) }); } catch { reject(new Error("private_route_non_json")); } });
        });
        req.on("error", reject); req.setTimeout(15000, () => req.destroy(new Error("private_route_timeout")));
        req.end(JSON.stringify(input));
    });
    const state = () => fingerprint(db.prepare("SELECT name,sql FROM sqlite_master WHERE type='table' ORDER BY name").all().map((t: any) => [t.name, t.sql,
        db.prepare(`SELECT * FROM "${t.name.replaceAll('"', '""')}"`).all().map(row => JSON.stringify(row)).sort()]));
    const zeroEffect = async (action: () => Promise<void>) => {
        const before = state(), config = readFileSync(f.config, "utf8"); await action(); assert.equal(state(), before, "read/refusal must preserve review, subscription, delivery, Core and run rows/schema");
        assert.equal(readFileSync(f.config, "utf8"), config);
        assert(!existsSync(f.networkAttempts), "no callback/provider/network attempt: " + (existsSync(f.networkAttempts) ? readFileSync(f.networkAttempts, "utf8") : "")); f.refusalCases++;
    };
    const saveConfig = (connections = [f.connection]) => writeFileSync(f.config, JSON.stringify({ version: REVIEW_MARKER, connections }), { mode: 0o600 });
    const requestReview = async (question: string) => {
        const inspected = await op({ action: "inspect", connection_ref: f.connection.id });
        assert.equal(inspected.status, "available");
        return op({ action: "request", connection_ref: f.connection.id, expected_material_ref: inspected.material_ref, question });
    };
    try {
        await freshOrigin();
        if (!recovery) {
            mkdirSync(f.projectRoot, { mode: 0o700 });
            execFileSync("git", ["init", "--quiet", f.projectRoot], { env });
            execFileSync("git", ["-C", f.projectRoot, "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", "-c", "commit.gpgsign=false", "commit", "--allow-empty", "--quiet", "-m", "Synthetic review fixture"], { env });
            const selection = await declareAndInspectLocalProjectV01(f.projectRoot, { open_database: () => new Database(f.databasePath, { fileMustExist: true }) });
            const registered = await confirmLocalProjectOnboardingV01(db, { selection_token: selection.selection_token, inspection_fingerprint: selection.inspection.inspection_fingerprint, selection_origin: "declared_path", display_name: "Synthetic supervised review" });
            assert.equal(registered.status, "created");
            const current = await saveWork({ goal: "Preserve all synthetic duplicate CSV rows.", success_criteria: ["Every original row remains available."], non_goals: ["No model, run, provider, semantic acceptance or external effect."] }, true);
            await saveWork({ sources: { add: [{ source: "synthetic local fixture", text: "Rows A:red, A:blue, B:green. Proposed step: retain all rows and flag conflicting IDs.", provenance: "derived_interpretation", observed_at: null, label: "Next check" }] } });
            const setup = path.join(f.directory, "setup.json");
            writeFileSync(setup, JSON.stringify({ repository_root: f.projectRoot, project_key: current.repository_resolution.project_key, destination: "local synthetic fixture", reviewer_label: "scripted fixture; no model", expires_at: new Date(Date.now() + 600000).toISOString(), callback_origins: [], callback_enrollment: true }), { mode: 0o600 });
            execFileSync(process.execPath, [path.join(f.root, "scripts/configure-review-connection.mjs"), setup, f.config], { cwd: f.root, env, stdio: "pipe" });
            f.connection = JSON.parse(readFileSync(f.config, "utf8")).connections[0];
        } else {
            assert(f.initialPassed && f.pending);
            assert.notEqual(companion.generation_id, f.priorRuntime.generation_id);
            await zeroEffect(async () => {
                const r = await raw({ action: "inspect", connection_ref: f.connection.id }, undefined, { "x-augnes-runtime-generation": f.priorRuntime.generation_id });
                assert.equal(r.status, 409); assert.equal(r.value.reason, "review_runtime_changed");
            });
        }
        const connection = (await op({ action: "connections", repository_root: f.projectRoot })).connections;
        assert.equal(connection.length, 1); assert.equal(connection[0].connection_ref, f.connection.id);
        assert.equal((await op({ action: "inspect", connection_ref: f.connection.id })).status, "available");
        reviewer = await transport("request-bound-review.mjs", { AUGNES_REVIEW_CONNECTION_ID: f.connection.id });
        await reviewer.start();
        const discover = await rpc(modern("server/discover")); assert(discover.result.capabilities.events);
        const catalog = await rpc(modern("tools/list")); assert.deepEqual(catalog.result.tools.map((t: any) => t.name), reviewTools);
        const eventCatalog = await rpc(modern("events/list")); assert.equal(eventCatalog.result?.events[0].name, "review.requested");
        assert.equal(eventCatalog.result.resultType, "complete");
        const inspectInput = { action: "inspect", connection_ref: f.connection.id };
        for (const query of ["?scope=repository:local", "?scope=repository%3Alocal"])
            assert.equal((await raw(inspectInput, query)).value.status, "available");
        if (!recovery) {
            const inspected = await op(inspectInput);
            const wouldWrite = { action: "request", connection_ref: f.connection.id, expected_material_ref: inspected.material_ref, question: "Forbidden request must not persist." };
            for (const query of ["", "?scope=other", "?scope=", "?scope", "?scope=repository:local&scope=repository:local", "?scope=repository:local&scope=other", "?scope=repository:local&extra=1", "?scope=repository%253Alocal", "?scope=repository%ZZlocal", "?%73cope=repository:local&scope=repository:local"])
                await zeroEffect(async () => { const r = await raw(wouldWrite, query); assert.equal(r.status, 403); assert.equal(r.value.reason, "review_access_refused"); });
            for (const headers of [{ host: "foreign.example" }, { origin: "http://localhost" }, { forwarded: "for=127.0.0.1" }, { "x-original-host": "localhost" },
                { "x-forwarded-host": "foreign.example" }, { "x-forwarded-for": "8.8.8.8" }, { "x-forwarded-proto": "https" }, { "x-forwarded-port": "1" }, { "sec-fetch-site": "cross-site" },
                { "x-augnes-review": null }, { "x-augnes-review": "wrong" }, { "x-augnes-companion-proxy": null }, { "x-augnes-companion-proxy": "wrong" }] as Record<string, string | null>[])
                await zeroEffect(async () => { const r = await raw(wouldWrite, undefined, headers); assert.equal(r.status, 403); assert.equal(r.value.reason, "review_access_refused"); });
            for (const name of ["x-augnes-runtime-instance", "x-augnes-runtime-generation", "x-augnes-runtime-repository"])
                await zeroEffect(async () => { const r = await raw(wouldWrite, undefined, { [name]: "stale-or-foreign" }); assert.equal(r.status, 409); assert.equal(r.value.reason, "review_runtime_changed"); });
            const eventInput = { action: "event", connection_ref: f.connection.id, method: "events/list", params: {} };
            for (const secret of [null, "wrong"])
                await zeroEffect(async () => assert.equal((await raw(eventInput, undefined, { "x-augnes-review-credential": secret })).status, 403));
            await zeroEffect(async () => assert.equal((await raw({ ...eventInput, connection_ref: "review:" + "f".repeat(32) }, undefined, { "x-augnes-review-credential": f.connection.secret })).status, 403));
            for (const changes of [{ expires_at: new Date(0).toISOString() }, { project_key: "sha256:" + "f".repeat(64) }, { repository_root: f.directory }]) {
                try {
                    saveConfig([{ ...f.connection, ...changes }]);
                    await zeroEffect(async () => assert.equal((await raw(eventInput, undefined, { "x-augnes-review-credential": f.connection.secret })).status, 403));
                } finally { saveConfig(); }
            }
            try { saveConfig([]); await zeroEffect(async () => assert.equal((await raw(eventInput, undefined, { "x-augnes-review-credential": f.connection.secret })).status, 403)); }
            finally { saveConfig(); }
            for (const method of ["server/discover", "tools/list", "events/list", "events/subscribe", "events/unsubscribe"]) {
                for (const meta of [undefined, null, {}, { ...modernMeta, "io.modelcontextprotocol/clientCapabilities": [] }])
                    await zeroEffect(async () => { const r = await rpc({ jsonrpc: "2.0", id: ++sequence, method, params: meta === undefined ? {} : { _meta: meta } }); assert.equal(r.error.code, -32602); });
                await zeroEffect(async () => { const r = await rpc({ ...modern(method), params: { _meta: { ...modernMeta, "io.modelcontextprotocol/protocolVersion": "unsupported" } } }); assert.equal(r.error.code, -32022); });
            }
            for (const name of ["augnes_plan", "augnes_observe", "augnes_review_repository_work", "augnes_save_repository_work_revision", "unknown"])
                await zeroEffect(async () => assert.equal((await rpc(modern("tools/call", { name, arguments: {} }))).error.code, -32602));
            await zeroEffect(async () => assert.equal((await rpc(modern("events/list", { unknown_domain_key: true }))).error.code, -32602));
            await zeroEffect(async () => assert.equal((await rpc(modern("tools/call", { name: reviewTools[0], arguments: { connection_ref: "forged" } }))).error.code, -32602));
            await zeroEffect(async () => {
                const r = await rpc({ ...modern("events/list"), params: { _meta: { ...modernMeta, principal: "forged", destination: "other", project_key: "forged", clientCapabilities: { unrestricted: true } } } });
                assert.equal(r.result.events[0].name, "review.requested");
            });
        }
        const receiver = () => existsSync(f.receiverRecords) ? readFileSync(f.receiverRecords, "utf8").trim().split("\n").map(line => JSON.parse(line)) : [];
        const callbackCli = (operation: string, decision?: object) => {
            const decisionFile = path.join(f.directory, "decision.json");
            if (decision) writeFileSync(decisionFile, JSON.stringify(decision), { mode: 0o600 });
            return JSON.parse(execFileSync(process.execPath, [path.join(f.root, "scripts/configure-review-connection.mjs"), "callbacks", operation,
                f.connection.id, ...(decision ? [decisionFile] : [])], { cwd: f.root, env, encoding: "utf8", stdio: "pipe" }));
        };
        const subscription = { name: "review.requested", arguments: {}, delivery: { mode: "webhook", url: "https://receiver.example.invalid/first?private=synthetic", secret: `whsec_${Buffer.alloc(32, 17).toString("base64")}` } };
        if (!recovery) {
            const configBefore = readFileSync(f.config, "utf8");
            const pending = await rpc(modern("events/subscribe", subscription));
            assert.equal(pending.error.code, -32015); assert.equal(pending.error.data.reason, "approval_required");
            assert.equal(pending.error.data.stage, "origin_policy"); assert(!JSON.stringify(pending).includes("receiver.example"));
            assert.deepEqual(receiver(), [], "no DNS/challenge/application before approval");
            assert.equal((db.prepare("SELECT count(*) n FROM vnext_review_subscriptions").get() as any).n, 0);
            const inspected = callbackCli("inspect");
            assert.equal(inspected.observation, "observed"); assert.equal(inspected.candidates.length, 1);
            const candidate = inspected.candidates[0]; assert.equal(candidate.origin, "https://receiver.example.invalid");
            assert(!JSON.stringify(inspected).includes("private=synthetic")); assert(!JSON.stringify(inspected).includes(receiverSecret));
            const decision = { candidate_ref: candidate.candidate_ref, expected_revision: candidate.revision,
                expected_policy_generation: inspected.policy_generation, expected_policy_revision: inspected.policy_revision, expires_at: new Date(Date.now() + 300000).toISOString() };
            assert.equal(callbackCli("approve", decision).candidates[0].state, "approved");
            assert.deepEqual(receiver(), [], "approval does not activate the refused host request");
            assert.throws(() => callbackCli("approve", decision), "stale CLI decision refuses");
            // The host can supply fresh path and signing material after the
            // refusal; only the origin and scope were approved or persisted.
            subscription.delivery.url = "https://receiver.example.invalid/fresh?private=replacement";
            subscription.delivery.secret = receiverSecret;
            const subscribed = await rpc(modern("events/subscribe", subscription)); assert(subscribed.result.id);
            assert.equal(receiver().filter(r => r.stage === "verification").length, 1);
            assert((await rpc(modern("events/subscribe", subscription))).result.id === subscribed.result.id);
            assert.equal(receiver().filter(r => r.stage === "verification").length, 1, "same permission/path/key refresh uses bounded cache");
            assert.equal(readFileSync(f.config, "utf8"), configBefore, "approval preserves connection and historical review binding");
        }
        const requested = recovery ? f.pending : await requestReview("Should all synthetic rows remain available?");
        if (!recovery) assert.deepEqual(receiver().filter(r => r.stage === "event").map(r => r.request_ref), [requested.request_ref]);
        await zeroEffect(async () => {
            const pending = await review(reviewTools[3], { request_ref: requested.request_ref });
            assert.equal(pending.status, "available"); assert.equal(pending.response, null); assert.equal(pending.currentness, "current");
            assert(!("read_binding" in pending)); assert.match(pending.next_action, /augnes_read_review_request/);
            for (const receipt_mode of [undefined, "historical_v1"])
                assert.equal((await review(reviewTools[2], { request_ref: requested.request_ref, read_binding: "sha256:" + "f".repeat(64), answer: "Not a material read.", limitations: "synthetic", source_refs: [], ...(receipt_mode ? { receipt_mode } : {}) })).reason, "review_read_binding_refused");
        });
        const read = await review(reviewTools[1], { request_ref: requested.request_ref });
        assert.equal(read.status, "available"); assert.equal(read.material_ref, requested.material_ref);
        assert.equal(read.definition.goal, "Preserve all synthetic duplicate CSV rows."); assert(read.sources.some((s: any) => s.excerpt_text.includes("A:red")));
        const reply = { request_ref: requested.request_ref, read_binding: read.read_binding, answer: "Retain all rows; flag conflicting IDs without overwriting their original positions.", limitations: "Local scripted protocol fixture; no model judgment.", source_refs: read.sources.map((s: any) => s.source_binding) };
        assert.equal((await review(reviewTools[2], reply)).status, "saved");
        assert.equal((await review(reviewTools[2], reply)).status, "exact_replay");
        await zeroEffect(async () => assert.equal((await review(reviewTools[2], { ...reply, answer: "Conflicting answer" })).reason, "review_reply_conflict"));
        await zeroEffect(async () => {
            const answered = await review(reviewTools[3], { request_ref: requested.request_ref });
            assert.equal(answered.readback, "not_served"); assert.equal(answered.response.answer, reply.answer);
            assert.match(answered.next_action, /No resubmission/); assert(!("read_binding" in answered));
            assert.deepEqual(await review(reviewTools[3], { request_ref: requested.request_ref }), answered);
        });
        await freshOrigin();
        const back = await op({ action: "readback", connection_ref: f.connection.id, request_ref: requested.request_ref });
        assert.equal(back.response.answer, reply.answer); assert.equal(back.currentness, "current"); assert.equal(back.use.status, "not_observed_in_current_work");
        assert.equal(back.response.attribution.model_and_tier, "unverified");
        assert.equal(back.readback, "served_to_origin"); assert.match(back.next_action, /prepare retain, revise or reject/);
        const use = await op({ action: "prepare_use", connection_ref: f.connection.id, request_ref: requested.request_ref, choice: "revise", reasoning: "Partly use the response: retain every original row and its position. Defer the conflicting-ID flag because no conflict encoding has been agreed. No overwrite or execution is authorized." });
        const preview = await call(use.revision_tool, use.revision_arguments);
        assert.equal((await call("augnes_save_repository_work_revision", { ...use.revision_arguments, previewBinding: preview.preview_binding })).status, "saved");
        const used = await op({ action: "readback", connection_ref: f.connection.id, request_ref: requested.request_ref });
        assert.equal(used.use.status, "attributed_note_in_current_work"); assert.equal(used.currentness, "historical");
        await zeroEffect(async () => assert.equal((await review(reviewTools[1], { request_ref: requested.request_ref })).reason, "review_material_changed"));
        if (!recovery) {
            const inspected = callbackCli("inspect");
            assert.equal(callbackCli("stop", { expected_policy_generation: inspected.policy_generation, expected_policy_revision: inspected.policy_revision }).stopped, true);
            const beforeUnsubscribe = receiver().length;
            const { secret: _secret, ...delivery } = subscription.delivery;
            assert((await rpc(modern("events/unsubscribe", { ...subscription, delivery }))).result);
            assert.equal(receiver().length, beforeUnsubscribe, "unsubscribe after revocation has no network verification");
            for (let n = 0; n < 5; n++) await requestReview(`Unanswered status pagination control ${n}`);
            const page = await review(reviewTools[0], {});
            assert(page.next_cursor && !page.requests.some((r: any) => r.request_ref === requested.request_ref));
            await close(reviewer);
            reviewer = await transport("request-bound-review.mjs", { AUGNES_REVIEW_CONNECTION_ID: f.connection.id });
            await reviewer.start();
            await rpc(modern("server/discover"));
            let observed: any;
            await zeroEffect(async () => {
                observed = await review(reviewTools[3], { request_ref: requested.request_ref });
                assert.equal(observed.status, "available"); assert.equal(observed.currentness, "historical");
                assert.equal(observed.readback, "served_to_origin"); assert.equal(observed.response.answer, reply.answer);
                assert.match(observed.use.reasoning, /Defer the conflicting-ID flag/);
                const { projection_version, status, source_material_authority, authority, ...item } = observed;
                const nextPage = await review(reviewTools[0], { cursor: page.next_cursor });
                assert.deepEqual(item, nextPage.requests.find((r: any) => r.request_ref === requested.request_ref));
                assert(!("read_binding" in item) && !("definition" in item) && !("sources" in item));
            });
            const packets = db.prepare("SELECT * FROM vnext_core_records ORDER BY record_id").all();
            const requests = db.prepare("SELECT * FROM vnext_review_requests ORDER BY request_ref").all();
            const resumed = await call("augnes_resume_repository", { repositoryRoot: f.projectRoot });
            const sources = await call("augnes_read_repository_work_sources", { repositoryRoot: f.projectRoot, expectedSnapshotBinding: resumed.continuity.snapshot.binding });
            const useNotes = sources.sources.filter((s: any) => s.trust_class === "derived_interpretation" && s.excerpt_text === observed.use.reasoning);
            assert.equal(useNotes.length, 1, "select the exact returned authored note without relying on a withheld locator");
            const useNote = useNotes[0];
            assert(useNote);
            await saveWork({ sources: { deselect: [useNote.source_binding] } });
            assert.deepEqual(db.prepare("SELECT * FROM vnext_review_requests ORDER BY request_ref").all(), requests);
            for (const row of packets as any[]) assert.deepEqual(db.prepare("SELECT * FROM vnext_core_records WHERE record_id=?").get(row.record_id), row);
            await zeroEffect(async () => {
                const deselected = await review(reviewTools[3], { request_ref: requested.request_ref });
                assert.deepEqual(deselected.use, { status: "not_observed_in_current_work" });
                assert.deepEqual(deselected.response, observed.response);
                assert.equal((await review(reviewTools[1], { request_ref: requested.request_ref })).reason, "review_material_changed");
                console.log(JSON.stringify({ test: "supervised-contributor-status", status: "pass", actual_next_http: true, fresh_reviewer: true,
                    beyond_first_page: true, selected: observed, deselected, prior_packets_preserved: packets.length }));
            });
            f.pending = await requestReview("Later recovery request: retain all rows?");
            f.priorRuntime = { generation_id: companion.generation_id }; f.initialPassed = true;
        } else f.recoveryPassed = true;
        assert.equal((db.prepare("SELECT count(*) n FROM vnext_review_subscriptions WHERE stopped=0").get() as any).n, 0);
        assert.equal((db.prepare("SELECT count(*) n FROM vnext_review_deliveries WHERE status='pending'").get() as any).n, 0);
        assert.equal(receiver().filter(r => r.stage === "event").length, 1, "restart/stop/reply do not redeliver");
        assert(!existsSync(f.networkAttempts));
    } finally {
        for (const t of transports) await close(t);
        db.close();
    }
}
