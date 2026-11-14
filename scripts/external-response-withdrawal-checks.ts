// Production MCP/HTTP writers, real processor receipts and ordinary fresh
// consumers. Negative SQL mutations are rolled back and never create success.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { writeFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { canonical, digest, hashBytes, originalReceiptIdentity } from "../lib/vnext/external-response-rules.mjs";
import { scopeKey, validateExternalStore } from "../lib/vnext/persistence/external-response-store.mjs";
import { independentCostOracle } from "./external-response-report.mjs";
import { configuredReceipt } from "../lib/vnext/external-response-transport.mjs";
import { createLocalProcessor } from "./external-response-counterpart.mjs";
import { trackServerConnections, closeTrackedServer } from "./test-harness-process-lifecycle.mjs";

export async function verifyWithdrawnReceipt(h: any) {
  const { db, projects, config, configure, op, ok, consumer, preserves, processor, hooks, phase } = h;
  const evidence: any = { controls: [] };
  const p = projects.find((p: any) => p.label === "withdrawal");
  const c = projects.find((p: any) => p.label === "withdrawal-controls");
  const read = async (p: any, w: any) => ok(await op(p, "read", { work_ref: w.work_ref })).work;
  const act = (p: any, w: any, key: string, mode = "reconcile") =>
    op(p, "act", { key: "act:" + key, work_ref: w.work_ref, expected_head: w.state.head, mode });
  const deny = async (p: any, w: any, key: string, reason: string, mode = "reconcile") => {
    await preserves(p, "act", { key: "refuse:" + key, work_ref: w.work_ref, expected_head: w.state.head, mode }, reason);
    evidence.controls.push({ key, reason, contact: 0 });
  };
  const reservations = (w: any) => w.events.filter((r: any) => r.kind === "sent" && r.payload.receipt_observation);
  const counts = () => {
    const { posts, queries, effects } = processor.snapshot();
    return { posts, queries, effects };
  };
  const delta = (before: any) => Object.fromEntries(Object.entries(counts()).map(([k, v]) => [k, (v as number) - before[k]]));
  const e: any = { ...config.envelopes[0], id: "withdrawal-original", receipt_observations: [],
    project_keys: [scopeKey(p.scope), scopeKey(c.scope)] };
  config.envelopes.push(e); configure();
  const prepare = async (p: any, key: string, deadline = e.expires_at) => {
    const entry = ok(await op(p, "read")), input = entry.materials.find((m: any) => m.metadata.name === "events.json");
    const w = ok(await op(p, "prepare", {
      key, purpose: entry.definition.goal, experience_refs: [], envelope_id: e.id, input_ref: input.ref,
      terms: { operation: "aggregate", format: "json", population: "all", deadline, max_rows: 200 },
      expectation: "Recover this original receipt after execution binding withdrawal.",
      reconsider_when: "Late result or current purpose and authority change.",
      owners: { receive: "fresh consumer", check: "independent integer oracle", use: "capacity report" },
    }, entry.material_basis));
    return read(p, w);
  };
  const issue = async (p: any, w: any, key: string) => {
    hooks.dropReturned();
    assert.equal((await act(p, w, key, "send")).status, "unavailable");
    const next = await read(p, w);
    assert(next.state.unresolved);
    return next;
  };
  const grant = (w: any, max_queries: number) => {
    const g = processor.grantReceipt({ request_ref: w.state.attempt.ref,
      expires_at: new Date(Date.now() + 60000).toISOString(), max_queries });
    const permission = { ...g, timeout_ms: 1000 };
    config.receipt_permissions ??= [];
    config.receipt_permissions.push(permission); configure();
    return permission;
  };
  const removeSend = () => { config.envelopes = config.envelopes.filter((x: any) => x !== e); configure(); };
  const originalCounts = counts();
  let w = await prepare(p, "withdrawal-open", new Date(Date.now() + 2200).toISOString());
  const preparedOriginal = w.original;
  w = await issue(p, w, "withdrawal-real-post");
  const persisted = h.persistedReceipt(w.state.attempt.ref);
  assert.equal(persisted.record.response.status, "returned");
  assert.deepEqual(delta(originalCounts), { posts: 1, queries: 0, effects: 1 });
  removeSend();
  const local = await consumer(p, "withdrawal-fresh-no-permission");
  assert.equal(local.status, "unresolved");
  assert.equal(local.receipt_confirmation.eligible, false);
  assert.deepEqual(delta(originalCounts), { posts: 1, queries: 0, effects: 1 });
  w = await read(p, w);
  assert(w.state.unresolved);
  await deny(p, w, "withdrawal-no-permission", "external_permission_unavailable");
  await deny(p, w, "withdrawal-no-resend", "external_reconciliation_required", "send");
  const permission = grant(w, 1);
  assert.notEqual(permission.secret, e.secret);
  assert.deepEqual(permission.receipt, originalReceiptIdentity(
    w.events.find((r: any) => r.kind === "work"), w.state.attempt, scopeKey(p.scope)));
  const query = (method: string, changes: any = {}) => {
    const r = permission.receipt;
    return fetch(r.endpoint + "/requests/" + (changes.attempt_ref ?? r.attempt_ref).slice(7), {
      method, headers: { authorization: "Bearer " + permission.secret,
        "x-input-ref": changes.input_ref ?? r.input_ref, "x-terms-ref": changes.terms_ref ?? r.terms_ref,
        "x-counterpart-instance": changes.instance ?? r.instance,
        "x-receipt-identity": changes.identity ?? digest(r) },
      ...(method === "POST" ? { body: "{}" } : {}),
    });
  };
  for (const [method, changes] of [
    ["POST", {}], ["GET", { attempt_ref: "sha256:" + "f".repeat(64) }],
    ["GET", { input_ref: "sha256:" + "e".repeat(64) }], ["GET", { terms_ref: "sha256:" + "e".repeat(64) }],
    ["GET", { instance: "replacement" }], ["GET", { identity: "sha256:" + "e".repeat(64) }],
  ] as [string, any][]) {
    const response = await query(method, changes);
    assert.equal(response.status, 403); await response.arrayBuffer();
  }
  assert.deepEqual(delta(originalCounts), { posts: 1, queries: 0, effects: 1 });
  await new Promise(r => setTimeout(r, Math.max(0, Date.parse(w.original.terms.deadline) - Date.now() + 10)));
  const acquired = await consumer(p, "withdrawal-fresh-receipt");
  assert.equal(acquired.status, "reconsider_or_stop");
  w = await read(p, w);
  assert.equal(w.applicability, "late_result_review_required");
  const returned = ok(await op(p, "material", { ref: w.state.returned.payload.material_ref })).material;
  const bytes = Buffer.from(returned.base64, "base64");
  assert.equal(hashBytes(bytes), returned.metadata.sha256);
  assert.equal(bytes.length, returned.metadata.size);
  const input = ok(await op(p, "material", { ref: w.state.attempt.payload.input_ref })).material;
  const oracle = independentCostOracle(JSON.parse(Buffer.from(input.base64, "base64").toString()), "all");
  for (const [k, v] of Object.entries(oracle)) assert.equal(JSON.parse(bytes.toString())[k], v);
  ok(await op(p, "reconsider", { key: "withdrawal-late-retain", work_ref: w.work_ref, expected_head: w.state.head,
    dependency_binding: w.dependency_binding, decision: "retain",
    reason: "Read and independently checked the original aggregate; the unchanged capacity report can use these late bytes.",
  }, ok(await op(p, "read")).material_basis));
  const used = await consumer(p, "withdrawal-fresh-use");
  const saved = await consumer(p, "withdrawal-fresh-readback");
  assert.equal(used.status, "completed"); assert.equal(saved.sha256, used.sha256);
  assert.notEqual(saved.process, used.process);
  w = await read(p, w);
  assert(w.state.checked && w.state.used && !w.state.unresolved);
  assert.deepEqual(w.original, preparedOriginal);
  assert.equal(reservations(w).length, 1);
  assert(!config.envelopes.some((x: any) => x.id === e.id));
  assert.deepEqual(delta(originalCounts), { posts: 1, queries: 1, effects: 1 });
  const exhaustedCredential = await query("GET");
  assert.equal(exhaustedCredential.status, 403); await exhaustedCredential.arrayBuffer();
  evidence.positive = { counts: delta(originalCounts), persisted_receipt: persisted, work: w, local, acquired, used, saved };

  // Separate disposable control work uses the same actual preparation and send
  // owners. No record or receipt is manufactured for a successful path.
  config.envelopes.push(e); configure();
  const cases: any = {};
  for (const name of ["boundary", "cross-route", "race", "timeout", "closed", "identity", "never-issued", "expiry"]) {
    let v = await prepare(c, "withdrawal-" + name);
    if (name !== "never-issued") v = await issue(c, v, "withdrawal-" + name + "-post");
    cases[name] = v;
  }
  // An explicit legacy observation reserves the same ceiling before withdrawal.
  let cross = cases["cross-route"];
  const crossGrant = grant(cross, 3);
  config.receipt_permissions = config.receipt_permissions.filter((x: any) => x !== crossGrant);
  const legacy = { work_ref: cross.work_ref, attempt_ref: cross.state.attempt.ref,
    expires_at: crossGrant.expires_at, max_queries: crossGrant.max_queries };
  e.receipt_observations = [legacy]; configure();
  hooks.transform((v: any) => { const { material, accepted_terms, ...rest } = v; return { ...rest, status: "unknown" }; });
  ok(await act(c, cross, "legacy-before-withdrawal"));
  cross = await read(c, cross);
  removeSend();
  config.receipt_permissions.push(crossGrant); configure();
  assert.equal((await read(c, cross)).receipt_confirmation.remaining, 2);
  hooks.dropReturned();
  assert.equal((await act(c, cross, "separate-after-legacy")).status, "unavailable");
  cross = await read(c, cross);
  // Credential rotation and moving the private configuration cannot reset usage.
  const rotated = processor.grantReceipt({ request_ref: cross.state.attempt.ref,
    expires_at: crossGrant.expires_at, max_queries: crossGrant.max_queries });
  crossGrant.secret = rotated.secret; configure();
  const relocated = path.join(h.temporary, "relocated-external-config.json");
  writeFileSync(relocated, JSON.stringify(config), { mode: 0o600 });
  process.env.AUGNES_EXTERNAL_CONFIG_FILE = relocated;
  try {
    assert.equal((await read(c, cross)).receipt_confirmation.remaining, 1);
    hooks.dropReturned();
    assert.equal((await act(c, cross, "separate-relocated")).status, "unavailable");
  } finally { process.env.AUGNES_EXTERNAL_CONFIG_FILE = h.configPath; unlinkSync(relocated); }
  cross = await read(c, cross);
  await deny(c, cross, "cross-route-exhausted", "external_observation_budget_exhausted");
  crossGrant.max_queries = 4; configure();
  await deny(c, cross, "cross-route-no-enlargement", "external_observation_permission_changed");
  crossGrant.max_queries = 3;
  const expiry = crossGrant.expires_at; crossGrant.expires_at = e.expires_at; configure();
  await deny(c, cross, "cross-route-no-renewal", "external_observation_permission_changed");
  crossGrant.expires_at = expiry; configure();
  config.envelopes.push(e);
  config.receipt_permissions = config.receipt_permissions.filter((x: any) => x !== crossGrant); configure();
  await deny(c, cross, "separate-back-to-legacy", "external_observation_budget_exhausted");
  e.receipt_observations = []; configure();
  await deny(c, cross, "no-legacy-fallback", "external_observation_permission_unavailable");
  removeSend(); config.receipt_permissions.push(crossGrant); configure();
  evidence.cross_route = { work: cross, reservations: reservations(cross).length };

  const never = cases["never-issued"];
  config.receipt_permissions.push({ ...crossGrant,
    receipt: originalReceiptIdentity(never.events[0], never.state.attempt, scopeKey(c.scope)) }); configure();
  await deny(c, never, "withdrawal-never-issued", "external_request_not_issued");
  assert.throws(() => processor.grantReceipt({ request_ref: never.state.attempt.ref, expires_at: expiry, max_queries: 1 }));
  config.receipt_permissions.pop(); configure();
  let identity = cases.identity;
  const identityGrant = grant(identity, 3);
  for (const field of ["endpoint", "instance", "project_key", "input_ref", "terms_ref", "material_basis"]) {
    const previous = identityGrant.receipt[field];
    identityGrant.receipt[field] = field === "endpoint" ? "http://127.0.0.1:1" : field === "instance" ? "replacement" :
      field === "project_key" ? scopeKey(p.scope) : "sha256:" + "f".repeat(64);
    configure();
    await deny(c, identity, "withdrawal-wrong-" + field, "external_receipt_identity_mismatch");
    identityGrant.receipt[field] = previous; configure();
  }
  const wrongEnvelope = { ...e, instance: "replacement-incarnation", secret: randomBytes(32).toString("base64url") };
  config.envelopes.push(wrongEnvelope); configure();
  assert.equal((await read(c, identity)).receipt_confirmation.authority, "separate_receipt_permission");
  config.receipt_permissions = config.receipt_permissions.filter((x: any) => x !== identityGrant); configure();
  await deny(c, identity, "replacement-envelope-not-original", "external_permission_unavailable");
  config.envelopes = config.envelopes.filter((x: any) => x !== wrongEnvelope);
  config.receipt_permissions.push(identityGrant); configure();
  const legacyRecord = structuredClone(identity.events[0]);
  delete legacyRecord.payload.receipt_owner;
  assert.throws(() => configuredReceipt(legacyRecord, identity.state.attempt, scopeKey(c.scope)),
    (error: any) => error.code === "external_original_receipt_unsupported");
  const actualCredential = identityGrant.secret, credentialCounts = counts();
  identityGrant.secret = e.secret; configure();
  assert.equal((await act(c, identity, "withdrawal-execution-bearer-not-receipt")).status, "unavailable");
  assert.deepEqual(counts(), credentialCounts);
  identityGrant.secret = actualCredential; configure(); identity = await read(c, identity);
  hooks.transform((v: any) => ({ ...v, instance: "replacement-incarnation" }));
  assert.equal((await act(c, identity, "withdrawal-response-incarnation-mismatch")).reason, "external_response_binding_mismatch");
  identity = await read(c, identity);
  const oldBody = db.prepare("SELECT body FROM vnext_external_materials WHERE ref=?").get(identity.state.attempt.payload.input_ref).body;
  db.prepare("UPDATE vnext_external_materials SET body=? WHERE ref=?").run(Buffer.from("corrupt"), identity.state.attempt.payload.input_ref);
  try { await deny(c, identity, "withdrawal-changed-bytes", "external_material_integrity_failed"); }
  finally { db.prepare("UPDATE vnext_external_materials SET body=? WHERE ref=?").run(oldBody, identity.state.attempt.payload.input_ref); }

  let boundary = cases.boundary;
  const boundaryGrant = grant(boundary, 6), beforeBoundary = counts();
  for (const [field, changed, reason] of [
    ["secret", randomBytes(32).toString("base64url"), "external_observation_permission_changed"],
    ["timeout_ms", 1100, "external_observation_permission_changed"],
  ]) {
    const old = boundaryGrant[field as string];
    hooks.afterReservation(() => { boundaryGrant[field as string] = changed; configure(); });
    assert.equal((await act(c, boundary, "withdrawal-boundary-" + field)).reason, reason);
    boundaryGrant[field as string] = old; configure();
    boundary = await read(c, boundary);
  }
  const project = config.projects.find((x: any) => x.project_key === scopeKey(c.scope)), oldRoot = project.repository_root;
  hooks.afterReservation(() => { project.repository_root = p.root; configure(); });
  assert.equal((await act(c, boundary, "withdrawal-root-loss")).reason, "external_access_refused");
  project.repository_root = oldRoot; configure(); boundary = await read(c, boundary);
  const oldToken = process.env.AUGNES_COMPANION_PROXY_TOKEN;
  hooks.afterReservation(() => { process.env.AUGNES_COMPANION_PROXY_TOKEN = randomBytes(32).toString("base64url"); });
  try { assert.equal((await act(c, boundary, "withdrawal-auth-loss")).reason, "external_access_refused"); }
  finally { process.env.AUGNES_COMPANION_PROXY_TOKEN = oldToken; }
  boundary = await read(c, boundary);
  assert.deepEqual(counts(), beforeBoundary);
  let release: () => void = () => {}, reached: () => void = () => {};
  const held = new Promise<void>(r => { reached = r; });
  hooks.hold((r: () => void) => { release = r; reached(); });
  const pending = act(c, boundary, "withdrawal-permission-at-commit");
  await held;
  config.receipt_permissions = config.receipt_permissions.filter((x: any) => x !== boundaryGrant); configure();
  release(); assert.equal((await pending).reason, "external_observation_permission_changed");
  config.receipt_permissions.push(boundaryGrant); configure(); boundary = await read(c, boundary);
  assert(boundary.state.unresolved);
  evidence.unresolved_work_ref = boundary.work_ref;
  evidence.unresolved_events = boundary.events;

  let timeout = cases.timeout;
  grant(timeout, 3);
  hooks.hold((r: () => void) => { release = r; });
  assert.equal((await act(c, timeout, "withdrawal-timeout")).status, "unavailable"); release();
  timeout = await read(c, timeout);
  hooks.failCommit(true);
  try { assert.equal((await act(c, timeout, "withdrawal-commit-failure")).status, "unavailable"); }
  finally { hooks.failCommit(false); }
  timeout = await read(c, timeout);
  hooks.transform((v: any) => { const { material, accepted_terms, ...rest } = v; return { ...rest, status: "absent" }; });
  ok(await act(c, timeout, "withdrawal-absence"));
  timeout = await read(c, timeout);
  await deny(c, timeout, "withdrawal-absence-no-send", "external_permission_unavailable", "send");
  await deny(c, timeout, "withdrawal-timeout-exhausted", "external_observation_budget_exhausted");

  const race = cases.race, raceBefore = counts();
  grant(race, 2);
  const raceHeld = new Promise<void>(r => { reached = r; });
  hooks.hold((r: () => void) => { release = r; reached(); });
  const first = act(c, race, "withdrawal-concurrent");
  await raceHeld;
  const contenders = await Promise.all([act(c, race, "withdrawal-concurrent"), act(c, race, "withdrawal-stale")]);
  release(); ok(await first);
  assert(contenders.some(r => r.status === "exact_replay"));
  assert(contenders.some(r => r.reason === "external_head_changed"));
  assert.equal(reservations(await read(c, race)).length, 1);
  assert.deepEqual(delta(raceBefore), { posts: 0, queries: 1, effects: 0 });

  let closed = cases.closed;
  ok(await op(c, "close", { key: "withdrawal-close", work_ref: closed.work_ref, expected_head: closed.state.head, reason: "Close local work retaining its external obligation." }));
  closed = await read(c, closed); grant(closed, 1);
  ok(await act(c, closed, "withdrawal-closed-query")); closed = await read(c, closed);
  assert(closed.state.closed && !closed.state.unresolved && !closed.state.used);
  for (const action of ["check", "use"]) {
    const data = action === "check" ? { response_ref: closed.state.returned.ref,
      material_ref: closed.state.returned.payload.material_ref, checker: "closed consumer", verdict: "pass",
      checks: "Closed work is ineligible", limitations: "Closed" } :
      { check_ref: closed.state.returned.ref, output_ref: closed.state.returned.payload.material_ref, description: "Closed work is ineligible" };
    await preserves(c, action, { key: "withdrawal-closed-" + action, work_ref: closed.work_ref, expected_head: closed.state.head, ...data },
      "external_work_closed", ok(await op(c, "read")).material_basis);
  }
  let expiring = cases.expiry;
  const expired = grant(expiring, 1);
  expired.expires_at = new Date(Date.now() - 1).toISOString(); configure();
  await deny(c, expiring, "withdrawal-expired", "external_observation_permission_expired");
  expired.expires_at = new Date(Date.now() + 400).toISOString(); configure();
  const expiryHeld = new Promise<void>(r => { reached = r; });
  hooks.hold((r: () => void) => { release = r; reached(); });
  const expiryQuery = act(c, expiring, "withdrawal-expired-at-commit");
  await expiryHeld;
  await new Promise(r => setTimeout(r, Math.max(0, Date.parse(expired.expires_at) - Date.now() + 10)));
  release(); assert.equal((await expiryQuery).reason, "external_observation_permission_expired");
  // Reuse the actual port after settling the original listener. Even the same
  // sending bearer cannot reconstruct that server's receipt-only credentials.
  const port = processor.server.address().port;
  await closeTrackedServer(processor.server);
  const replacement = createLocalProcessor({ secret: e.secret });
  trackServerConnections(replacement.server);
  let replacementContacts = 0;
  replacement.server.prependListener("request", () => { replacementContacts++; });
  try {
    await new Promise<void>((resolve, reject) => {
      replacement.server.once("error", reject);
      replacement.server.listen(port, "127.0.0.1", resolve);
    });
    assert.notEqual(replacement.instance, processor.instance);
    const refused = await act(c, identity, "withdrawal-reused-port");
    assert.equal(refused.status, "unavailable");
    assert.equal(replacementContacts, 1);
    assert.deepEqual({ posts: replacement.snapshot().posts, queries: replacement.snapshot().queries,
      effects: replacement.snapshot().effects }, { posts: 0, queries: 0, effects: 0 });
    assert((await read(c, identity)).state.unresolved);
    evidence.reused_port = { contacts: replacementContacts, authorized_queries: 0, processing_effects: 0 };
  } finally { await closeTrackedServer(replacement.server); }
  validateExternalStore(db);
  evidence.boundaries = { timeout_reservations: reservations(timeout).length, boundary_reservations: reservations(boundary).length,
    concurrency: contenders, closed_work: closed, expiry: (await read(c, expiring)).receipt_confirmation };
  phase("withdrawn_binding_original_receipt_fresh_read_check_use_and_scoped_authority");
  return evidence;
}
