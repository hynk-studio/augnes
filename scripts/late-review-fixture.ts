// Disposable deterministic handlers/proxies. No actual external participant,
// model judgment, production service, execution grant or provider call.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createServer } from "node:http";
import { mkdirSync, writeFileSync, readFileSync, renameSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { trackServerConnections, closeTrackedServer } from "./test-harness-process-lifecycle.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { POST as resume } from "../app/api/augnes/read/codex-repository-continuity/route";
import { POST as sources } from "../app/api/augnes/read/codex-repository-work-sources/route";
import { POST as writer } from "../app/api/augnes/repository-work-revision/route";
import { POST as review } from "../app/api/augnes/review/route";
import { handleMessageV01 } from "../plugins/augnes-operator/mcp/companion-proxy.mjs";
import { createRequestBoundReviewAdapter } from "../plugins/augnes-operator/mcp/request-bound-review.mjs";
import { REVIEW_MARKER, digest } from "../plugins/augnes-operator/mcp/review-connection.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { createRecoveryBackup } from "./recovery-backup.mjs";
import { inspectRecoveryDatabaseFile, prepareRuntimeDatabase, restoreRuntimeDatabase } from "./runtime-database-bootstrap.mjs";
import { issueVNextLocalOperatorBootstrapV01, consumeVNextLocalOperatorBootstrapV01, readVNextLocalOperatorCredentialFromRequestV01, VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01 } from "../lib/vnext/runtime/local-operator-session";
import { mutateHumanDirection } from "../lib/vnext/runtime/project-direction";

const [mode, directory] = process.argv.slice(2), dbPath = path.join(directory, "fixture.db"), root = path.join(directory, "project");
const artifactDirectory = path.join(directory, "artifacts");
const save = (name: string, value: unknown) => writeFileSync(path.join(artifactDirectory, name + ".json"), JSON.stringify(value, null, 2) + "\n");
const configPath = path.join(directory, "review.json");
const guard = installZeroNetworkGuard({ allowLoopback: true }), started = Date.now();
const trace: any[] = [], failures: string[] = [], checks: string[] = [];
let db = new Database(dbPath), origin = "", id = 0, dropAck = false, storageFailure = false, saveFailure = false;
let historyFault: string | null = null, projectId = "", faultHits = 0;
const token = randomBytes(32).toString("base64url"), instance = "late-review-fixture", generation = randomBytes(16).toString("hex"), repository = "d".repeat(64);
const routes: Record<string, (r: Request) => Promise<Response>> = {
    "/api/augnes/read/codex-repository-continuity": resume, "/api/augnes/read/codex-repository-work-sources": sources,
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
            if (storageFailure && /UPDATE vnext_review_requests SET response_json/u.test(sql)) throw new Error("injected_response_storage_failure");
            if (saveFailure && /INSERT INTO vnext_core_records/u.test(sql)) throw new Error("injected_ordinary_save_failure");
            const statement = originalPrepare.call(this, sql);
            if (historyFault === "semantic" && /SELECT COUNT\(\*\)[\s\S]*FROM vnext_semantic_(state_entries|target_heads)/u.test(sql))
                return new Proxy(statement, { get(target, key) {
                    if (key === "get") return () => { faultHits++; return { count: 1 }; };
                    const value = Reflect.get(target, key); return typeof value === "function" ? value.bind(target) : value;
                } });
            if (historyFault && /FROM autonomy_runs/u.test(sql) && /SELECT scope, metadata_json/u.test(sql))
                return new Proxy(statement, { get(target, key) {
                    if (key === "all") return (...args: any[]) => {
                        if (historyFault === "managed") { faultHits++; return [{ scope: projectId, metadata_json: "{}" }]; }
                        if (historyFault === "budget") { faultHits++; return Array.from({ length: 4097 }, () => ({ scope: "other", metadata_json: "{}" })); }
                        return (target.all as Function)(...args);
                    };
                    const value = Reflect.get(target, key); return typeof value === "function" ? value.bind(target) : value;
                } });
            if (["corrupt", "missing"].includes(historyFault ?? "") && /SELECT \* FROM vnext_core_records/u.test(sql))
                return new Proxy(statement, { get(target, key) {
                    if (key === "all") return (...args: any[]) => {
                        faultHits++;
                        const rows = (target.all as Function)(...args) as any[];
                        return historyFault === "missing" ? [] : rows.map(row => ({ ...row, payload_json: "{}" }));
                    };
                    const value = Reflect.get(target, key); return typeof value === "function" ? value.bind(target) : value;
                } });
            return statement;
        } as typeof originalPrepare;
        let response;
        try { response = await handler(new Request(url, { method: req.method, headers: req.headers as Record<string, string>, body })); }
        finally { Database.prototype.prepare = originalPrepare; }
        if (response.status >= 400 || url.pathname.includes("/read/") || input.action === "preview" ||
            (url.pathname.endsWith("/review") && ["inspect", "list", "reassess", "prepare_use", "prepare_reassessed_use"].includes(input.action)))
            assert(before.equals(db.serialize()), "read/preparation/preview/refusal changed durable bytes");
        if (dropAck && input.action === "reply" && response.ok) { dropAck = false; res.destroy(); return; }
        response.headers.forEach((v, k) => res.setHeader(k, v)); res.writeHead(response.status).end(await response.text());
    } catch (error) { failures.push(String(error)); res.writeHead(500).end('{"fixture_error":true}'); }
}));
const modern = { "io.modelcontextprotocol/protocolVersion": "2026-07-28", "io.modelcontextprotocol/clientCapabilities": {} };
async function raw(name: string, args: object) {
    const r: any = await handleMessageV01({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args } });
    trace.push({ name, arguments: args, result: r.result?.structuredContent ?? r.error }); return r;
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
let connections: any[];
const configure = () => writeFileSync(configPath, JSON.stringify({ version: REVIEW_MARKER, connections }), { mode: 0o600 });
async function request(c: any, question: string) {
    const inspected = await op({ action: "inspect", connection_ref: c.id });
    return op({ action: "request", connection_ref: c.id, expected_material_ref: inspected.material_ref, question });
}
const replyArgs = (r: any, answer: unknown) => ({ request_ref: r.request_ref, read_binding: r.read_binding,
    answer: JSON.stringify(answer), limitations: "Exposed synthetic arithmetic; no road-access observation, model judgment or real vehicle inspection.", source_refs: r.sources.map((s: any) => s.source_binding) });
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
async function produce() {
    applyCanonicalDatabaseMigrations(db);
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
    mkdirSync(root); mkdirSync(artifactDirectory);
    const project = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
        local_root: normalizeLocalProjectRootRefV01(root, { base_path: directory }), display_name: "Synthetic water delivery" });
    const scope = { workspace_id: workspace.workspace_id, project_id: project.project.project_id };
    projectId = scope.project_id;
    connections = ["B", "C"].map(label => ({ id: `review:${randomBytes(16).toString("hex")}`, project_key: digest({ purpose: "codex-current-continuity-public-project-key.v0.1", ...scope }),
        repository_root: root, destination: "disposable-local-fixture", reviewer_label: `Scripted reviewer ${label}`, expires_at: new Date(Date.now() + 3600000).toISOString(),
        secret: randomBytes(32).toString("base64url"), storage_key: randomBytes(32).toString("base64url"), callback_origins: [] }));
    configure(); const [b, c] = connections;
    await saveChanges({ goal: "Plan whole water-delivery trips for three sites, retaining reserve and unresolved access checks.", success_criteria: ["Check demand plus reserve against current vehicle capacity", "Do not dispatch without confirming road access"], non_goals: ["No dispatch or physical observation"] }, true);
    await saveChanges({ sources: { add: [note("note-ref:vehicle", { capacity_l: 20, basis: "original synthetic vehicle" }),
        note("note-ref:site-needs", { demands_l: [8, 7, 9], reserve_l: 3, unfinished: "Confirm road access before departure" })] } });
    const rb = await request(b, "Check vehicle availability and planning constraints."), rc = await request(c, "Check demand, reserve and whole-trip arithmetic.");
    const unread = await request(c, "Not read before material changed.");
    const br = await reviewer(b, "augnes_read_review_request", { request_ref: rb.request_ref });
    const cr = await reviewer(c, "augnes_read_review_request", { request_ref: rc.request_ref });
    assert.equal(br.material_ref, cr.material_ref); assert.deepEqual(br.sources, cr.sources);
    save("original-reads", { B: br, C: cr });
    const bAnswer = { capacity_l: 30, basis: "stipulated replacement vehicle measurement", unfinished: "Confirm road access before departure" };
    assert.equal((await reviewer(b, "augnes_reply_to_review", replyArgs(br, bAnswer))).status, "saved");
    const bBack = await op({ action: "readback", connection_ref: b.id, request_ref: rb.request_ref });
    const bUse = await op({ action: "prepare_use", connection_ref: b.id, request_ref: rb.request_ref, choice: "revise", reasoning: "Use B's stipulated replacement vehicle capacity of 30 L. Preserve the original 20 L basis in history and confirm road access before departure." });
    const oldVehicle = br.sources.find((s: any) => s.source_locator === "note-ref:vehicle");
    bUse.revision_arguments.changes.sources.replace = [{ source_binding: oldVehicle.source_binding, note: note("note-ref:vehicle", { capacity_l: JSON.parse(bBack.response.answer).capacity_l, basis: "B replacement vehicle", response_ref: bBack.response_ref }) }];
    await savePrepared(bUse);
    const afterB = await readCurrent(); save("after-B", afterB);
    const demand = JSON.parse(cr.sources.find((s: any) => s.source_locator === "note-ref:site-needs").excerpt_text);
    const originalCapacity = JSON.parse(cr.sources.find((s: any) => s.source_locator === "note-ref:vehicle").excerpt_text).capacity_l;
    const total = demand.demands_l.reduce((sum: number, n: number) => sum + n, 0) + demand.reserve_l;
    const cAnswer = { total_l: total, reserve_l: demand.reserve_l, original_capacity_l: originalCapacity, suggested_trips: Math.ceil(total / originalCapacity), unfinished: demand.unfinished };
    const args = replyArgs(cr, cAnswer), late = { ...args, receipt_mode: "historical_v1" };
    await refused("default first late reply", () => reviewer(c, "augnes_reply_to_review", args), "review_material_changed");
    await refused("first read after change", () => reviewer(c, "augnes_read_review_request", { request_ref: unread.request_ref }), "review_material_changed");
    await refused("forged read binding", () => reviewer(c, "augnes_reply_to_review", { ...late, read_binding: "sha256:" + "0".repeat(64) }), "review_read_binding_refused");
    await refused("missing prior read", () => reviewer(c, "augnes_reply_to_review", { ...late, request_ref: unread.request_ref }), "review_read_binding_refused");
    await refused("current replacement source is not original membership", () => reviewer(c, "augnes_reply_to_review", { ...late, source_refs: [afterB.sources.find((s: any) => s.source_locator === "note-ref:vehicle").source_binding] }), "review_source_ref_refused");
    await refused("foreign connection", () => reviewer(b, "augnes_reply_to_review", late), "review_access_refused");
    await refused("answer bound", () => reviewer(c, "augnes_reply_to_review", { ...late, answer: "x".repeat(1001) }), "invalid_review_input");
    await refused("source count bound", () => reviewer(c, "augnes_reply_to_review", { ...late, source_refs: Array(9).fill(oldVehicle.source_binding) }), "invalid_review_input");
    await refused("reviewer cannot reassess origin work", () => reviewer(c, "augnes_review_repository_work", { action: "reassess", connection_ref: c.id, request_ref: rc.request_ref }));
    storageFailure = true;
    await refused("actual response storage failure", () => reviewer(c, "augnes_reply_to_review", late), "review_inspection_or_storage_unavailable");
    storageFailure = false;
    const empty = await op({ action: "readback", connection_ref: c.id, request_ref: rc.request_ref }); assert.equal(empty.response_ref, null);
    dropAck = true;
    const unknown = await reviewer(c, "augnes_reply_to_review", late); assert.equal(unknown.persistence, "unknown_read_back_before_retry");
    const back = await op({ action: "readback", connection_ref: c.id, request_ref: rc.request_ref });
    assert.equal(back.currentness, "historical"); assert.deepEqual(JSON.parse(back.response.answer), cAnswer);
    assert.equal(back.use.status, "not_observed_in_current_work");
    assert.equal((await readCurrent()).packet_fingerprint, afterB.packet_fingerprint, "receipt must not apply work");
    checks.push("lost acknowledgement reconciled by readback before duplicate test");
    const beforeReplay = db.serialize();
    assert.equal((await reviewer(c, "augnes_reply_to_review", late)).status, "exact_replay");
    assert(beforeReplay.equals(db.serialize())); checks.push("exact duplicate late delivery");
    await refused("conflicting late delivery", () => reviewer(c, "augnes_reply_to_review", { ...late, answer: "changed" }), "review_reply_conflict");
    await refused("default current-only preparation", () => raw("augnes_review_repository_work", { action: "prepare_use", connection_ref: c.id, request_ref: rc.request_ref, choice: "retain", reasoning: "old basis" }), "review_material_changed");
    const re = () => op({ action: "reassess", connection_ref: c.id, request_ref: rc.request_ref });
    const assessment = await re();
    assert.deepEqual(assessment.original.sources, cr.sources); assert.deepEqual(assessment.original.definition, cr.definition);
    assert(assessment.changes.original_sources_not_selected.includes(oldVehicle.source_binding));
    save("historical-response-and-bases", assessment);
    const prepare = (a: any) => ({ action: "prepare_reassessed_use", connection_ref: c.id, request_ref: rc.request_ref,
        expected_response_ref: a.response_ref, expected_reassessment_binding: a.reassessment_binding, choice: "partial_use",
        reasoning: "Use C's demand-plus-reserve total of 27 L. Reject C's two-trip suggestion: B's retained 30 L replacement supersedes the original 20 L vehicle. Use one trip; road access remains unconfirmed and dispatch is forbidden until checked." });
    await refused("exact response binding", () => raw("augnes_review_repository_work", { ...prepare(assessment), expected_response_ref: bBack.response_ref }), "review_reassessment_changed");
    await refused("reasoning bound", () => raw("augnes_review_repository_work", { ...prepare(assessment), reasoning: "x".repeat(1001) }), "invalid_review_input");
    await saveChanges({ success_criteria: ["Check litres and whole trips", "Confirm road access before dispatch"] });
    await refused("reassessment race", () => raw("augnes_review_repository_work", prepare(assessment)), "review_reassessment_changed");
    const stalePreparation = await op(prepare(await re()));
    await saveChanges({ success_criteria: ["Check litres and whole trips using the replacement vehicle", "Confirm road access before dispatch"] });
    await refused("preparation to preview race", () => raw(stalePreparation.revision_tool, stalePreparation.revision_arguments));
    const forPreview = await op(prepare(await re()));
    const preview = await call(forPreview.revision_tool, forPreview.revision_arguments);
    await saveChanges({ non_goals: ["No dispatch, physical observation or automatic merging"] });
    await refused("preview to save race", () => raw("augnes_save_repository_work_revision", { ...forPreview.revision_arguments, previewBinding: preview.preview_binding }));
    save("preserved-stale-drafts", { stalePreparation, forPreview, preview });
    const fresh = await re(), use = await op(prepare(fresh));
    const capacity = JSON.parse(fresh.current.sources.find((s: any) => s.source_locator === "note-ref:vehicle").excerpt_text).capacity_l;
    const receivedC = JSON.parse(fresh.response.answer);
    const plan = { total_l: receivedC.total_l, reserve_l: receivedC.reserve_l, capacity_l: capacity,
        trips: Math.ceil(receivedC.total_l / capacity), used_response_ref: fresh.response_ref,
        rejected_suggestion: { trips: receivedC.suggested_trips, reason: "Original 20 L capacity superseded by B's 30 L replacement" },
        unfinished: receivedC.unfinished, dispatch_authorized: false };
    assert.equal(plan.total_l, 8 + 7 + 9 + 3); assert.equal(plan.trips, 1); assert.equal(plan.rejected_suggestion.trips, 2);
    use.revision_arguments.changes.sources.add.push(note("note-ref:checked-water-plan", plan, "derived_interpretation"));
    const checkedPreview = await call(use.revision_tool, use.revision_arguments);
    saveFailure = true;
    await refused("atomic ordinary save failure", () => raw("augnes_save_repository_work_revision", { ...use.revision_arguments, previewBinding: checkedPreview.preview_binding }));
    saveFailure = false;
    assert.equal((await re()).current.packet_ref, fresh.current.packet_ref);
    await call("augnes_save_repository_work_revision", { ...use.revision_arguments, previewBinding: checkedPreview.preview_binding });
    const saved = await readCurrent(); save("checked-current-plan", plan); save("saved-current-material", saved);
    assert(saved.sources.some((s: any) => s.excerpt_text.includes(bBack.response_ref.slice(7)) || s.source_locator === "note-ref:vehicle"));
    assert.equal((await op({ action: "readback", connection_ref: c.id, request_ref: rc.request_ref })).use.status, "attributed_note_in_current_work");
    // Current authorization and physical-root checks, with exact restoration of
    // disposable test configuration only; no installed service is involved.
    const expiry = c.expires_at; c.expires_at = "2000-01-01T00:00:00.000Z"; configure();
    await refused("expired access", () => reviewer(c, "augnes_reply_to_review", late));
    c.expires_at = expiry; connections = [b]; configure();
    await refused("revoked access", () => reviewer(c, "augnes_reply_to_review", late));
    connections = [b, c]; configure();
    const key = c.project_key; c.project_key = "sha256:" + "0".repeat(64); configure();
    await refused("foreign project scope", () => reviewer(c, "augnes_reply_to_review", late));
    c.project_key = key; configure();
    renameSync(root, root + "-original"); mkdirSync(root);
    await refused("physical root changed", () => reviewer(c, "augnes_reply_to_review", late));
    renameSync(root, root + "-replacement"); renameSync(root + "-original", root);
    // Negative-only storage-read faults. No positive history or response is
    // manufactured and immutable persisted bytes remain untouched.
    for (const fault of ["corrupt", "missing", "managed", "budget", "semantic"]) {
        historyFault = fault; faultHits = 0;
        await refused(`${fault} history`, () => reviewer(c, "augnes_reply_to_review", late));
        assert(faultHits > 0, `${fault}: storage-read intervention must actually occur`);
        historyFault = null;
    }
    save("producer-results", { checks, actions: trace.length, elapsed_ms: Date.now() - started,
        actual_external_participation: "NOT_RUN", human_model_semantic_consumption: "NOT_RUN", comparative_usefulness: "NOT_RUN", costs: "model/token/billing and human effort unmeasured" });
}
async function boundaries() {
    connections = JSON.parse(readFileSync(configPath, "utf8")).connections;
    const c = connections[1], list = await op({ action: "list", connection_ref: c.id });
    const original = list.requests.find((r: any) => r.response_ref);
    const current = await readCurrent();
    const args = { repositoryRoot: root, expectedSnapshotBinding: current.snapshot,
        changes: { goal: "A distinct later inspection task", success_criteria: ["Inspect retained planning history"], non_goals: ["No delivery"],
            sources: { keep: current.sources.map((s: any) => s.source_binding), omitted_sources: [] } } };
    const preview = await call("augnes_preview_repository_new_work", args);
    await call("augnes_prepare_repository_new_work", { ...args, previewBinding: preview.preview_binding });
    await refused("real new-task boundary", () => raw("augnes_review_repository_work", { action: "reassess", connection_ref: c.id, request_ref: original.request_ref }), "review_original_material_unavailable");
    // Exercise another eligible task segment positively, without importing an
    // old request across the boundary. Then a real direction write invalidates it.
    const rq = await request(c, "Check this distinct task only."), read = await reviewer(c, "augnes_read_review_request", { request_ref: rq.request_ref });
    await saveChanges({ goal: "A distinct later inspection task with a clarified report" });
    const late = { ...replyArgs(read, { finding: "Retain the unconfirmed road-access obligation" }), receipt_mode: "historical_v1" };
    assert.equal((await reviewer(c, "augnes_reply_to_review", late)).status, "saved");
    const row = db.prepare("SELECT workspace_id,project_id FROM vnext_review_requests WHERE request_ref=?").get(rq.request_ref) as any;
    const config = { ...row, enabled: true as const, operator_id: "operator:local-review", database_path: dbPath };
    const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config });
    const session = consumeVNextLocalOperatorBootstrapV01(db, { config, bootstrap_token: bootstrap.bootstrap_token });
    const credential = readVNextLocalOperatorCredentialFromRequestV01(new Request("http://127.0.0.1", {
        headers: { cookie: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${session.cookie_value}` } }));
    mutateHumanDirection(db, { config, credential, request: { action: "decide", expected_ref: null,
        content: { purpose: "Inspect conservation planning only", criteria: [], constraints: [] }, reason: "Synthetic direction change", status: "active", proposal_ref: null } });
    await refused("real effective direction change", () => reviewer(c, "augnes_reply_to_review", late), "review_project_binding_changed");
    save("boundary-results", { checks, positive: "a new request within the new eligible segment supports late receipt", actions: trace.length });
}
async function consume() {
    connections = JSON.parse(readFileSync(configPath, "utf8")).connections;
    const current = await readCurrent();
    const records = [];
    for (const c of connections) {
        const list = await op({ action: "list", connection_ref: c.id });
        for (const r of list.requests.filter((r: any) => r.response_ref)) records.push(await op({ action: "reassess", connection_ref: c.id, request_ref: r.request_ref }));
    }
    // Inputs are exclusively normal persisted work and authorized review reads.
    // No producer report, expected-answer file or coordinator context is read.
    const plan = JSON.parse(current.sources.find((s: any) => s.source_locator === "note-ref:checked-water-plan").excerpt_text);
    const demand = JSON.parse(current.sources.find((s: any) => s.source_locator === "note-ref:site-needs").excerpt_text);
    const vehicle = JSON.parse(current.sources.find((s: any) => s.source_locator === "note-ref:vehicle").excerpt_text);
    const total = demand.demands_l.reduce((n: number, x: number) => n + x, 0) + demand.reserve_l;
    assert.equal(plan.total_l, total); assert.equal(plan.trips, Math.ceil(total / vehicle.capacity_l));
    const c = records.find(r => r.response_ref === plan.used_response_ref); assert(c);
    assert.equal(JSON.parse(c.response.answer).suggested_trips, plan.rejected_suggestion.trips);
    const followup = { based_on_packet: current.packet_fingerprint, load_l: total, trips: Math.ceil(total / vehicle.capacity_l),
        vehicle_capacity_l: vehicle.capacity_l, next_check: plan.unfinished, dispatch_authorized: false,
        retained_response_refs: records.map(r => r.response_ref).sort(), original_C: c.original,
        complete_C_response: c.response, non_use: plan.rejected_suggestion, use_notes: current.sources.filter((s: any) => /^(partial_use|revise):/.test(s.excerpt_text)) };
    save(mode + "-followup", followup); save(mode + "-reads", { current, records });
    checks.push("fresh process computes follow-up solely from authorized persisted material");
}
async function recover() {
    db.close();
    const lifecycle = { databasePath: dbPath, backupDirectory: path.join(directory, "backups"), repositoryRoot: process.cwd(), instanceId: instance, repositoryFingerprint: repository, databaseOverrideActive: true };
    const backup = await createRecoveryBackup({ databasePath: dbPath, backupDirectory: lifecycle.backupDirectory, applicationScopeFingerprint: repository,
        sourceApplication: { application_version: null, build_identity: null, package_contract: null, package_contract_version: null, runtime_contract: null, runtime_schema_version: null },
        reason: "manual_recovery", inspectDatabase: inspectRecoveryDatabaseFile } as unknown as Parameters<typeof createRecoveryBackup>[0]);
    const restored = await restoreRuntimeDatabase({ ...lifecycle, selectedBackupId: backup.manifest.backup_id } as unknown as Parameters<typeof restoreRuntimeDatabase>[0]);
    const prepared = await prepareRuntimeDatabase(lifecycle as unknown as Parameters<typeof prepareRuntimeDatabase>[0]);
    save("recovery", { backup: backup.manifest, restored, prepared });
}
async function main() {
    try {
        db.pragma("foreign_keys=ON"); db.pragma("journal_mode=WAL");
        if (mode === "recover") await recover();
        else { await setupServer(); if (mode === "producer") await produce(); else if (mode === "boundaries") await boundaries(); else await consume(); }
        assert.deepEqual(failures, []); assert.equal(guard.attempts.length, 0);
    } finally {
        Database.prototype.prepare = originalPrepare;
        await closeTrackedServer(server); if (db.open) db.close(); guard.restore();
        save(mode + "-trace", trace);
    }
    console.log(JSON.stringify({ mode, status: "PASS", checks, actions: trace.length, elapsed_ms: Date.now() - started, cleanup: "server and database closed" }));
}
void main();
