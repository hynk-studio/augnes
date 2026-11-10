// One exposed P3.1/P5.2 development case. All positive state uses ordinary writers.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { createCanonicalTestResourceRoot, createCanonicalTestResourceDirectory, cleanupCanonicalTestResources } from "./canonical-test-environment.mjs";
import { runCanonicalChild, canonicalChildAcceptanceFailure } from "./canonical-child-runner.mjs";
import { trackServerConnections, closeTrackedServer } from "./test-harness-process-lifecycle.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { createLocalProcessor } from "./external-response-counterpart.mjs";
import { ordinaryExperienceUse } from "./companion-experience-use.mjs";
import { handleMessageV01 } from "../plugins/augnes-operator/mcp/companion-proxy.mjs";
import { POST as resume } from "../app/api/augnes/read/codex-repository-continuity/route";
import { POST as writer } from "../app/api/augnes/repository-work-revision/route";
import { POST as sources } from "../app/api/augnes/read/codex-repository-work-sources/route";
import { POST as external } from "../app/api/augnes/external-response/route";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { scopeKey, validateExternalStore } from "../lib/vnext/persistence/external-response-store.mjs";
import { EXTERNAL_VERSION, canonical, hashBytes } from "../lib/vnext/external-response-rules.mjs";

const root = process.cwd(), started = Date.now();
const owner = createCanonicalTestResourceRoot("ag-resource-test-");
const temporary = owner.root, dbPath = path.join(temporary, "native.db"), savedEnv = { ...process.env };
const guard = installZeroNetworkGuard({ allowLoopback: true });
const db = new Database(dbPath), period = "2026-10 synthetic build and reservation period";
const token = randomBytes(32).toString("base64url"), secret = randomBytes(32).toString("base64url");
const processor = createLocalProcessor({ secret }); trackServerConnections(processor.server);
const children: any[] = [], artifacts: { name: string; body: Buffer }[] = [], phases: string[] = [], errors: string[] = [];
const externalRequests: { root: string; action: string }[] = [], eventCases: any[] = [];
let origin = "", id = 0, failMaterial = false, failPublication = false;
let race: (() => Promise<void>) | null = null;
const prepare = Database.prototype.prepare;
const routes: Record<string, (r: Request) => Promise<Response>> = {
  "/api/augnes/read/codex-repository-continuity": resume,
  "/api/augnes/repository-work-revision": writer,
  "/api/augnes/read/codex-repository-work-sources": sources,
  "/api/augnes/external-response": external,
};
const server = trackServerConnections(createServer(async (req, res) => {
  try {
    const url = new URL(req.url!, origin);
    if (["/healthz", "/api/healthz"].includes(url.pathname)) {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: true, name: "augnes-console", service: "augnes-ui", status: "ready", mode: "http", live_core_status: "ready", recovery_mode: false,
        runtime_instance_id: "selective-fixture", runtime_generation_id: "one", runtime_repository_fingerprint: "e".repeat(64) })); return;
    }
    const handler = routes[url.pathname]; if (!handler) { res.writeHead(404).end(); return; }
    const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString();
    const request = body ? JSON.parse(body) : {};
    if (url.pathname === "/api/augnes/external-response") externalRequests.push({ root: request.repository_root, action: request.action });
    if (failMaterial || failPublication) Database.prototype.prepare = function(this: Database.Database, sql: string) {
      if (failMaterial && sql.startsWith("INSERT INTO vnext_external_materials")) throw new Error("owned_material_rollback_fault");
      if (failPublication && request.action === "publish" && sql.startsWith("INSERT INTO vnext_external_records")) throw new Error("owned_publication_rollback_fault");
      return prepare.call(this, sql);
    } as typeof prepare;
    let response;
    try { response = await handler(new Request(url, { method: req.method, headers: req.headers as Record<string, string>, ...(body ? { body } : {}) })); }
    finally { Database.prototype.prepare = prepare; }
    // A real ordinary correction between the byte read and the final observation.
    if (race && request.action === "material") { const run = race; race = null; await run(); }
    response.headers.forEach((v, k) => res.setHeader(k, v));
    res.writeHead(response.status).end(await response.text());
  } catch (error) { errors.push(String(error)); res.writeHead(500).end("{}"); }
}));
const call = async (name: string, args: object) => {
  const r: any = await handleMessageV01({ jsonrpc: "2.0", id: ++id, method: "tools/call", params: { name, arguments: args } });
  assert(!r.error, JSON.stringify(r.error));
  if (r.result.structuredContent?.status === "refused") console.error(JSON.stringify({ name, refusal: r.result.structuredContent.reason }));
  return r.result.structuredContent;
};
const op = async (p: any, action: string, data?: object, basis?: string) => call("augnes_external_repository_work", {
  repository_root: p.root, action, ...(data ? { data } : {}), ...(basis ? { expected_material_ref: basis } : {}),
});
const ok = (v: any) => { assert(["available", "saved", "exact_replay"].includes(v.status), JSON.stringify(v)); return v; };
const note = (source: string, text: string) => ({ source, text, provenance: "imported_unverified", observed_at: "2026-10-16T00:00:00.000Z", label: "Next check" });
const snapshot = () => canonical(db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all()
  .map((r: any) => [r.name, db.prepare(`SELECT * FROM "${r.name}" ORDER BY rowid`).all()]));
const frozen = JSON.parse(readFileSync(path.join(root, "scripts/fixtures/experience-use/selective-expectations.json"), "utf8"));
async function consumer(p: any, label: string, script = "external-response-selective-report.mjs", expected = "completed") {
  const child = createCanonicalTestResourceDirectory(path.join(temporary, label));
  let out = "", err = "";
  try {
    const result = await runCanonicalChild({ suite: "external-selective", label, command: process.execPath,
      args: [path.join(root, "scripts", script), p.root], cwd: child.root,
      env: { PATH: process.env.PATH, HOME: child.root, TMPDIR: child.root, AUGNES_COMPANION_RUNTIME_MANIFEST: process.env.AUGNES_COMPANION_RUNTIME_MANIFEST, AUGNES_COMPANION_TEST_MODE: "1" },
      timeoutMs: 20000, heartbeatMs: 0, resourceOwner: child, log: () => {},
      stdout: { write(c: any) { out += c; return true; } } as typeof process.stdout,
      stderr: { write(c: any) { err += c; return true; } } as typeof process.stderr,
    });
    assert.equal(result.timed_out, false); assert.equal(result.cleanup_completed, true); assert.equal(result.remaining_owned_processes, 0);
    if (expected === "completed") assert.equal(canonicalChildAcceptanceFailure(result, { suite: "external-selective", timeoutMs: 20000, requireNaturalExit: true }), null, err + out);
    else assert.equal(result.exit_code, 1, err + out);
    const value = JSON.parse(out); assert.equal(value.status, expected, out); assert.equal(value.runtime, process.version);
    const planCreated = existsSync(path.join(child.root, "plan.json"));
    if (expected === "stopped") assert.equal(existsSync(path.join(child.root, "plan.json")), false);
    let content;
    if (value.output) {
      const body = readFileSync(path.join(child.root, value.output)); assert.equal(hashBytes(body), value.sha256);
      artifacts.push({ name: `${label}-${value.output}`, body }); content = JSON.parse(body.toString());
    }
    if (value.assessment_material_ref) {
      const material = ok(await op(p, "material", { ref: value.assessment_material_ref })).material;
      const body = Buffer.from(material.base64, "base64");
      assert.equal(hashBytes(body), material.metadata.sha256);
      artifacts.push({ name: `${label}-applicability.json`, body });
      assert.deepEqual(JSON.parse(body.toString()).correction_refs, value.correction_refs);
    }
    children.push({ label, ...value, content, plan_created: planCreated, cleanup: true, remaining_owned_processes: 0, duration_ms: result.duration_ms });
    return { ...value, content, plan_created: planCreated };
  } finally { assert(cleanupCanonicalTestResources([child]).every((r: { completed: boolean }) => r.completed)); }
}
async function main() {
  db.pragma("foreign_keys = ON"); applyCanonicalDatabaseMigrations(db);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
  const projects = ["source", "intermediate", "consumer", "invoice"].map(label => {
    const dir = path.join(temporary, label); mkdirSync(dir);
    const p = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(dir, { base_path: temporary }), display_name: label });
    return { label, root: dir, scope: { workspace_id: workspace.workspace_id, project_id: p.project.project_id }, api: ordinaryExperienceUse(call, dir) };
  });
  const [a, b, c, d] = projects;
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve)); origin = `http://127.0.0.1:${(server.address() as any).port}`;
  await new Promise<void>(resolve => processor.server.listen(0, "127.0.0.1", resolve));
  const manifest = { schema_version: 2, contract: "augnes-local-runtime-supervisor-v1", generation_version: 1,
    generation_id: "one", instance_id: "selective-fixture", repository_fingerprint: "e".repeat(64), supervisor_pid: process.pid,
    lifecycle_state: "ready", database_state: "ready", effective_url: origin, ui_port: (server.address() as any).port, bridge_port: (server.address() as any).port,
    children: ["ui", "bridge"].map(role => ({ role, pid: process.pid, port: (server.address() as any).port, state: "ready" })) };
  writeFileSync(path.join(temporary, "runtime.json"), JSON.stringify(manifest));
  writeFileSync(path.join(temporary, "companion-access.json"), JSON.stringify({ ...manifest, access_version: "augnes-companion-proxy-access.v0.1", proxy_token: token }), { mode: 0o600 });
  Object.assign(process.env, { AUGNES_DB_PATH: dbPath, AUGNES_RUNTIME_CHILD_ROLE: "ui", AUGNES_RUNTIME_INSTANCE_ID: "selective-fixture", AUGNES_RUNTIME_GENERATION_ID: "one", AUGNES_RUNTIME_REPOSITORY_FINGERPRINT: "e".repeat(64), AUGNES_COMPANION_PROXY_TOKEN: token, AUGNES_COMPANION_RUNTIME_MANIFEST: path.join(temporary, "runtime.json"), AUGNES_COMPANION_TEST_MODE: "1" });
  delete process.env.AUGNES_RECOVERY_MODE;
  const original = readFileSync(path.join(root, "scripts/fixtures/experience-use/b.json"));
  const config = { version: EXTERNAL_VERSION, projects: projects.map(p => ({ repository_root: p.root, project_key: scopeKey(p.scope), share_to: projects.filter(q => q !== p).map(q => scopeKey(q.scope)) })),
    envelopes: [{ id: "intermediate-only", project_keys: [scopeKey(b.scope)], endpoint: `http://127.0.0.1:${(processor.server.address() as any).port}`, instance: processor.instance, secret,
      expires_at: new Date(Date.now() + 600000).toISOString(), max_calls: 4, max_amendments: 0, max_input_bytes: 1048576, timeout_ms: 1000, input_sha256: [hashBytes(original)] }] };
  const configPath = path.join(temporary, "external-config.json");
  const configure = () => writeFileSync(configPath, JSON.stringify(config), { mode: 0o600 }); configure(); process.env.AUGNES_EXTERNAL_CONFIG_FILE = configPath;
  for (const p of projects) {
    await p.api.write("initial", await p.api.read(), { goal: `Synthetic ${p.label} reporting`, success_criteria: ["Exact bytes and explicit sources"], non_goals: ["No semantic acceptance, model or production effects"] });
    await p.api.write("revise", await p.api.read(), { sources: { add: [note(`note-ref:${p.label}-source`, period)] } });
  }
  const put = async (p: any, name: string, body: Buffer, version: string, dependencies: string[] = []) => {
    const entry = ok(await op(p, "read"));
    return ok(await op(p, "put_material", { metadata: { name, media_type: "application/json", version, source: `${p.label} synthetic observations`, applicability: period, dependencies, sha256: hashBytes(body), size: body.length }, base64: body.toString("base64") }, entry.material_basis)).material_ref;
  };
  const publish = async (p: any, key: string, title: string, conditions: any, materials: string[], targets: any[]) => {
    const entry = ok(await op(p, "read"));
    return ok(await op(p, "publish", { key, title, source_refs: [entry.sources[0].source_binding], conditions: canonical(conditions), association: { endpoint: "none", account: "unresolved", operator: "synthetic producer", confidence: "attributed observation" }, assessment: "Bounded source and original check; consumer evaluates current applicability.", materials, targets: targets.map(q => scopeKey(q.scope)) }, entry.material_basis)).record.ref;
  };
  const aMaterial = await put(a, "events.json", original, "events-r1");
  const aExperience = await publish(a, "input-original", "Source build observations", { version: "source-build-input.v1", period }, [aMaterial], [b, c]);
  // Complete ordinary delivery and attributable copy, then the existing real B consumer.
  const delivered = ok(await op(b, "material", { ref: aMaterial, experience_ref: aExperience })).material;
  await put(b, "events.json", Buffer.from(delivered.base64, "base64"), delivered.metadata.version, [aMaterial]);
  await b.api.write("revise", await b.api.read(), { sources: { add: [note("note-ref:external-report-contract", JSON.stringify({ population: "all", input_name: "events.json", output: "capacity-report.json" }))] } });
  const br = await consumer(b, "b-original", "external-response-report.mjs");
  assert.equal(br.content.total_worker_ms, frozen.original_B_total_ms);
  const bw = ok(await op(b, "read", { work_ref: br.work_ref })).work;
  const bOriginal = canonical(bw.events);
  artifacts.push({ name: "b-original-check-history.json", body: Buffer.from(JSON.stringify(bw.events, null, 2) + "\n") });
  const lineage = { version: "worker-report-lineage.v1", period, population: "all", upstream: { experience_ref: aExperience, material_ref: aMaterial, version: "events-r1", sha256: hashBytes(original) }, input_ref: bw.state.attempt.payload.input_ref, result_ref: bw.state.returned.payload.material_ref, report_ref: bw.state.used.payload.output_ref };
  await publish(b, "derived-intermediate", "Capacity intermediate for planning", lineage, [lineage.input_ref, lineage.result_ref, lineage.report_ref], [c]);
  const invoice = Buffer.from(JSON.stringify({ version: "reservation-invoice.v1", period, units: 4, unit_cents: 3000 }));
  const dMaterial = await put(d, "reservation.json", invoice, "invoice-r1");
  await publish(d, "independent-invoice", "Independent reservation invoice", { version: "reservation-invoice.v1", material_ref: dMaterial, period }, [dMaterial], [c]);
  await c.api.write("revise", await c.api.read(), { sources: { add: [note("note-ref:selective-report-contract", JSON.stringify({ version: "selective-worker-report.v1", intermediate_query: "Capacity intermediate for planning", independent_query: "Independent reservation invoice", repetitions: 3, period, output: "plan.json" }))] } });
  assert.deepEqual(ok(await op(c, "read")).envelopes, [], "C inherits no execution envelope from A/B/D");
  phases.push("ordinary_A_delivery_and_real_B_output");

  const beforeFault = snapshot(); failMaterial = true;
  const fault = await consumer(c, "c-write-fault", undefined, "stopped"); failMaterial = false;
  assert.equal(fault.reason, "external_inspection_or_storage_unavailable"); assert.equal(snapshot(), beforeFault);
  phases.push("new_output_write_rollback");
  failPublication = true;
  const publicationFault = await consumer(c, "c-publication-fault", undefined, "stopped"); failPublication = false;
  assert.equal(publicationFault.reason, "external_inspection_or_storage_unavailable");
  const savedRecords = db.prepare("SELECT count(*) n FROM vnext_external_records WHERE workspace_id=? AND project_id=?")
    .get(c.scope.workspace_id, c.scope.project_id) as { n: number };
  assert.equal(savedRecords.n, 0);
  assert.equal(ok(await op(c, "read")).materials.length, 2, "Successful immutable material writes survive failed later publication");
  const first = await consumer(c, "c-original");
  assert.equal(first.content.projected_worker_ms, frozen.C_original_projected_worker_ms);
  assert.equal(first.content.reservation_fee_cents, frozen.D_reservation_fee_cents);
  assert.equal(first.decision, "use_original");
  assert.equal(first.arithmetic_checks, 1, "Unadvertised material is checked again, not trusted as a completed report");
  phases.push("explicit_fresh_recovery_of_unadvertised_material");
  const firstState = snapshot();
  const replay = await consumer(c, "c-replay");
  assert.equal(replay.output_ref, first.output_ref); assert.equal(replay.sha256, first.sha256);
  assert.equal(replay.assessment_ref, first.assessment_ref); assert.equal(replay.assessment_status, "exact_replay");
  assert.equal(replay.arithmetic_checks, 0); assert.equal(snapshot(), firstState);
  phases.push("fresh_original_and_exact_replay");

  let previousRef = aMaterial;
  const correction = async (key: string, value: any, version: string, declaredVersion = version) => {
    const body = Buffer.from(JSON.stringify(value));
    const materialRef = await put(a, `${key}.json`, body, version, [previousRef]);
    const experienceRef = await publish(a, `${key}-replacement`, "Explicit replacement source bytes", { version: "source-build-input.v1", period }, [materialRef], [c]);
    await a.api.write("revise", await a.api.read(), { sources: { add: [note(`note-ref:${key}`,
      `Explicit source revision ${version}; predecessor ${previousRef}; replacement ${materialRef}; same applicability period. Complete replacement bytes are published.`)] } });
    const entry = ok(await op(a, "read"));
    const change = { version: "worker-input-replacement.v1", previous_material_ref: previousRef, replacement_experience_ref: experienceRef, replacement_material_ref: materialRef, replacement_version: declaredVersion, replacement_sha256: hashBytes(body) };
    const correctionSource = entry.sources.find((s: any) => s.source_locator === `note-ref:${key}`);
    const result = ok(await op(a, "correct", { key, target_ref: aExperience, topic: "source version", statement: canonical(change), source_refs: [correctionSource.source_binding], targets: [scopeKey(c.scope)] }, entry.material_basis));
    previousRef = materialRef; artifacts.push({ name: `${key}-input.json`, body }); return result.record.ref;
  };
  const revised = JSON.parse(original.toString()); revised.events.find((e: any) => e.event_id === "b-03").duration_s = "1.500";
  const numerical = await correction("numerical-correction", revised, "events-r2");
  const corrected = await consumer(c, "c-corrected");
  assert.equal(corrected.decision, "revise"); assert.equal(corrected.content.projected_worker_ms, frozen.C_corrected_projected_worker_ms);
  assert.equal(corrected.content.reservation_fee_cents, frozen.D_reservation_fee_cents);
  assert.notEqual(corrected.sha256, first.sha256); assert.notEqual(corrected.derived_ref, first.derived_ref);
  assert.deepEqual(corrected.correction_refs, [numerical]);
  const rederived = ok(await op(c, "material", { ref: corrected.derived_ref })).material;
  assert.equal(JSON.parse(Buffer.from(rederived.base64, "base64").toString()).total_ms, frozen.corrected_B_total_ms);
  artifacts.push({ name: "corrected-intermediate.json", body: Buffer.from(rederived.base64, "base64") });
  phases.push("fresh_two_step_correction_changes_actual_output_D_retained");

  const annotated = { ...revised, annotation: { display_label: "Corrected source display metadata" } };
  await correction("metadata-correction", annotated, "events-r3");
  const metadata = await consumer(c, "c-metadata");
  assert.equal(metadata.decision, "retain"); assert.equal(metadata.arithmetic_checks, 0);
  assert.equal(metadata.sha256, corrected.sha256); assert.equal(metadata.output_ref, corrected.output_ref);
  assert.notEqual(metadata.assessment_ref, corrected.assessment_ref);
  assert.equal(ok(await op(c, "material", { ref: first.output_ref })).material.metadata.sha256, first.sha256);
  assert.equal(ok(await op(d, "material", { ref: dMaterial })).material.base64, invoice.toString("base64"));
  phases.push("metadata_changes_current_judgment_not_valid_output");

  // Current permission is checked even when C has an older output in its own scope.
  const aConfig = config.projects[0], sharing = [...aConfig.share_to];
  aConfig.share_to = aConfig.share_to.filter(r => r !== scopeKey(c.scope)); configure();
  const deniedState = snapshot(), denied = await consumer(c, "c-inaccessible", undefined, "stopped");
  assert.equal(denied.reason, "external_access_refused"); assert.equal(snapshot(), deniedState);
  aConfig.share_to = sharing; configure();
  // Race changes the real source through ordinary writers; the fresh consumer
  // must reject its earlier applicability observation before creating output.
  race = () => correction("racing-metadata", { ...annotated, annotation: { display_label: "later" } }, "events-r4").then(() => {});
  const raced = await consumer(c, "c-race", undefined, "stopped");
  assert.equal(raced.reason, "selective_dependencies_changed_during_read");
  race = () => c.api.read().then(current => c.api.write("revise", current, { sources: { add: [note("note-ref:changed-consumer-basis", "A new independently recorded review context requires a fresh consumer read.")] } })).then(() => {});
  const changedBasis = await consumer(c, "c-basis-race", undefined, "stopped");
  assert.equal(changedBasis.reason, "selective_work_basis_changed");
  const reviewBasis = ok(await op(c, "read"));
  ok(await op(c, "correct", { key: "review-prior-applicability", target_ref: metadata.assessment_ref,
    topic: "current applicability", statement: "The prior scripted applicability judgment requires a separate review.",
    source_refs: [reviewBasis.sources[0].source_binding], targets: [] }, reviewBasis.material_basis));
  const reviewState = snapshot(), review = await consumer(c, "c-previous-review", undefined, "stopped");
  assert.equal(review.reason, "selective_previous_judgment_requires_review"); assert.equal(snapshot(), reviewState);
  await correction("wrong-version", annotated, "events-r5", "incorrect-declared-version");
  const badState = snapshot(), badVersion = await consumer(c, "c-wrong-version", undefined, "stopped");
  assert.equal(badVersion.reason, "selective_replacement_binding_invalid"); assert.equal(snapshot(), badState);
  ok(await op(a, "withdraw", { ref: aExperience, target_key: scopeKey(c.scope) }));
  const withdrawnState = snapshot(), withdrawn = await consumer(c, "c-withdrawn", undefined, "stopped");
  assert.equal(withdrawn.reason, denied.reason); assert.equal(snapshot(), withdrawnState);
  phases.push("access_version_race_and_withdrawal_refusal");
  assert.equal(canonical(ok(await op(b, "read", { work_ref: br.work_ref })).work.events), bOriginal);
  assert.equal(processor.snapshot().effects, 1, "Only original B needed an authorized processor effect");
  validateExternalStore(db);
  assert.equal(new Set(children.map(c => c.process)).size, children.length);
  assert.deepEqual(guard.attempts, []); assert.deepEqual(errors, []);
  artifacts.push({ name: "original-upstream.json", body: original }, { name: "independent-invoice.json", body: invoice });
  phases.push("original_history_immutable_and_no_inherited_authority");

  const replaceNote = async (p: any, locator: string, text: string) => {
    const entry = ok(await op(p, "read"));
    const old = entry.sources.find((s: any) => s.source_locator === locator);
    const next = note(locator, text);
    await p.api.write("revise", await p.api.read(), { sources: old
      ? { replace: [{ source_binding: old.source_binding, note: next }] } : { add: [next] } });
  };
  const onRow = (mutate: (row: any) => void) => (events: any[]) => mutate(events.find(e => e.event_id === "b-03"));
  const malformed: [string, (events: any[]) => void][] = [
    ["missing-event-id", onRow(row => { delete row.event_id; })],
    ["missing-job-id", onRow(row => { delete row.job_id; })],
    ["zero-attempt", onRow(row => { row.attempt = 0; })],
    ["unsupported-event-field", onRow(row => { row.annotation = "Not top-level annotation"; })],
    ["empty-event-id", onRow(row => { row.event_id = ""; })],
    ["numeric-job-id", onRow(row => { row.job_id = 1; })],
    ["fractional-attempt", onRow(row => { row.attempt = 1.5; })],
    ["unsafe-attempt", onRow(row => { row.attempt = Number.MAX_SAFE_INTEGER + 1; })],
    ["unsupported-status", onRow(row => { row.status = "passed"; })],
    ["numeric-duration", onRow(row => { row.duration_s = 1.5; })],
    ["duration-width", onRow(row => { row.duration_s = "1000000000"; })],
    ["duration-precision", onRow(row => { row.duration_s = "1.5000"; })],
    ["null-row", events => { events.push(null); }],
    ["invalid-late-duplicate", events => { events.push({ ...events[1], job_id: "" }); }],
    ["conflicting-duplicate", events => { events.push({ ...events[1], duration_s: "2.501" }); }],
  ];
  const cases: [string, (events: any[]) => void][] = [...malformed, ["valid-boundaries", events => {
    const row = events.find(e => e.event_id === "b-03"); row.duration_s = "0";
    const upper = { event_id: " ", job_id: " ", attempt: Number.MAX_SAFE_INTEGER, status: "ok", duration_s: "999999999.999" };
    events.push(upper, ...Array.from({ length: 201 }, () => ({ ...row })));
  }]];
  for (let offset = 0; offset < cases.length; offset += 8) {
    // Two explicit, bounded replacement chains. Publish the complete batch and
    // its selected source note once; each correction still uses ordinary APIs.
    const upstream = await publish(a, `profile-${offset}-source`, `Profile source ${offset}`,
      { version: "source-build-input.v1", period }, [aMaterial], [c]);
    const title = `Profile intermediate ${offset}`;
    await publish(b, `profile-${offset}-intermediate`, title,
      { ...lineage, upstream: { ...lineage.upstream, experience_ref: upstream } },
      [lineage.input_ref, lineage.result_ref, lineage.report_ref], [c]);
    await replaceNote(c, "note-ref:selective-report-contract", JSON.stringify({ version: "selective-worker-report.v1",
      intermediate_query: title, independent_query: "Independent reservation invoice", repetitions: 3, period, output: "plan.json" }));
    const prepared = [];
    let predecessor = aMaterial;
    for (const [name, mutate] of cases.slice(offset, offset + 8)) {
      const value = structuredClone(revised); mutate(value.events);
      const body = Buffer.from(JSON.stringify(value)), version = `profile-${name}`;
      const inputRef = await put(a, `${name}.json`, body, version, [predecessor]);
      const replacement = await publish(a, `profile-${name}-replacement`, `Replacement ${name}`,
        { version: "source-build-input.v1", period }, [inputRef], [c]);
      const change = { version: "worker-input-replacement.v1", previous_material_ref: predecessor,
        replacement_experience_ref: replacement, replacement_material_ref: inputRef,
        replacement_version: version, replacement_sha256: hashBytes(body) };
      prepared.push({ name, value, body, version, inputRef, replacement, change }); predecessor = inputRef;
    }
    await replaceNote(a, "note-ref:event-profile-replacement", `Explicit replacements for ${upstream}, same applicability period:\n` +
      prepared.map(p => `${p.version}: ${p.inputRef}`).join("\n"));
    const entry = ok(await op(a, "read"));
    for (const { name, value, body, version, inputRef, replacement, change } of prepared) {
    const correctionRef = ok(await op(a, "correct", { key: `profile-${name}-correction`, target_ref: upstream,
      topic: "source version", statement: canonical(change), source_refs: [entry.sources.find((s: any) => s.source_locator === "note-ref:event-profile-replacement").source_binding],
      targets: [scopeKey(c.scope)] }, entry.material_basis)).record.ref;
    const readable = ok(await op(c, "material", { ref: inputRef, experience_ref: replacement })).material;
    assert.equal(readable.metadata.version, version); assert.equal(readable.metadata.sha256, hashBytes(body));
    assert.equal(readable.base64, body.toString("base64"));
    assert(ok(await op(c, "read_experience", { ref: upstream })).dependencies[0].corrections.some((r: any) => r.ref === correctionRef));
    artifacts.push({ name: `${name}-replacement.json`, body });
    let seededCache: string | null = null;
    if (name === "unsupported-event-field") {
      // Ordinary negative fixture for output left by the reviewed buggy consumer.
      // Matching material + publication must not let current validation be skipped.
      const current = ok(await op(c, "read"));
      const selected = current.sources.find((s: any) => s.source_locator === "note-ref:selective-report-contract");
      const calculation = hashBytes(canonical({ version: "selective-worker-report.v1", contract: selected.source_binding,
        intermediate: lineage.report_ref, independent: dMaterial, events: value.events,
        schema: value.schema_version, repetitions: 3, period }));
      const oldOutput = Buffer.from(JSON.stringify({ ...corrected.content, calculation_binding: calculation, source_material: inputRef }, null, 2) + "\n");
      seededCache = ok(await op(c, "put_material", { metadata: { name: "plan.json", media_type: "application/json",
        version: "selective-worker-report.v1", source: calculation, applicability: period,
        dependencies: [lineage.report_ref, dMaterial, inputRef, corrected.derived_ref], sha256: hashBytes(oldOutput), size: oldOutput.length },
        base64: oldOutput.toString("base64") }, current.material_basis)).material_ref;
      const assessment = Buffer.from(JSON.stringify({ version: "selective-worker-report.v1", calculation_binding: calculation,
        output_ref: seededCache, original_check_ref: br.content.check_ref, current_input_ref: inputRef }));
      const assessmentRef = await put(c, "prior-invalid-applicability.json", assessment, "selective-worker-report.v1", [seededCache!]);
      await publish(c, "prior-invalid-applicability", "Selective worker report applicability",
        { version: "selective-worker-report.v1", output_ref: seededCache, assessment_ref: assessmentRef }, [seededCache!, assessmentRef], []);
      assert(ok(await op(c, "read")).materials.some((m: any) => m.ref === seededCache && m.metadata.source === calculation));
    }
    // All producer/legacy-cache setup finishes BEFORE the no-write snapshot.
    // This includes every project table, prior B check, C material and judgment.
    const before = snapshot(), startRequest = externalRequests.length;
    const valid = name === "valid-boundaries";
    const observed = await consumer(c, `c-${name}`, undefined, valid ? "completed" : "stopped");
    const after = snapshot();
    const actions = externalRequests.slice(startRequest).filter(r => r.root === c.root).map(r => r.action);
    if (valid) {
      assert.equal(observed.content.projected_worker_ms, 3000000020997);
      assert.equal(observed.content.reservation_fee_cents, frozen.D_reservation_fee_cents);
      assert.equal(processor.snapshot().effects, 1, "C does not inherit processor max_rows or an execution envelope");
    } else {
      assert.equal(observed.reason, "selective_event_invalid");
      assert.equal(after, before, `No durable writes after ${name} producer setup`);
      assert.equal(observed.plan_created, false);
      assert(actions.length > 0 && actions.every(action => ["read", "discover", "read_experience", "material"].includes(action)));
    }
    eventCases.push({ name, status: observed.status, reason: observed.reason, plan_created: observed.plan_created,
      shared_material_readback: true, replacement_ref: inputRef, replacement_sha256: hashBytes(body), seeded_cache_ref: seededCache,
      before_sha256: hashBytes(before), after_sha256: hashBytes(after), unchanged: before === after,
      projected_worker_ms: observed.content?.projected_worker_ms, actions });
    assert.equal(canonical(ok(await op(b, "read", { work_ref: br.work_ref })).work.events), bOriginal);
    assert.equal(ok(await op(c, "material", { ref: corrected.output_ref })).material.metadata.sha256, corrected.sha256);
    console.error(JSON.stringify({ event_case: name, status: observed.status, durable_unchanged: before === after }));
    }
  }
  assert.equal(eventCases.filter(r => r.status === "stopped" && r.unchanged && !r.plan_created).length, malformed.length);
  phases.push("event_profile_refusal_no_writes_and_valid_duplicate_bounds");
  validateExternalStore(db);
  assert.equal(new Set(children.map(c => c.process)).size, children.length);
  assert.deepEqual(guard.attempts, []); assert.deepEqual(errors, []);

}
async function run() {
let failure: unknown;
try { await main(); } catch (error) { failure = error; }
finally {
  Database.prototype.prepare = prepare;
  await closeTrackedServer(server); await closeTrackedServer(processor.server); db.close(); guard.restore();
  for (const key of Object.keys(process.env)) if (!(key in savedEnv)) delete process.env[key]; Object.assign(process.env, savedEnv);
  const cleanup = cleanupCanonicalTestResources([owner]);
  const report = { version: "selective-correction-development.v1", passed: !failure, phases, children, event_cases: eventCases,
    artifacts: artifacts.map(f => ({ name: f.name, sha256: hashBytes(f.body), size: f.body.length })),
    errors, failure: failure instanceof Error ? { message: failure.message, stack: failure.stack } : failure,
    cleanup, duration_ms: Date.now() - started, evidence: "exposed scripted development, not model use or comparative benefit" };
  const destination = process.argv[2];
  if (destination) {
    assert(path.isAbsolute(destination) && !existsSync(destination)); mkdirSync(destination, { recursive: true });
    for (const f of artifacts) writeFileSync(path.join(destination, f.name), f.body, { flag: "wx" });
    writeFileSync(path.join(destination, "evidence.json"), JSON.stringify(report, null, 2) + "\n");
  }
  console.log(JSON.stringify(report));
  assert(cleanup.every((r: { completed: boolean }) => r.completed));
}
if (failure) throw failure;

}
run().catch(error => { console.error(error); process.exitCode = 1; });
