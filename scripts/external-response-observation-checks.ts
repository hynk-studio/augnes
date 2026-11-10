// Invoked by the existing external-response integration and its resource owner.
// All positive histories use ordinary MCP/HTTP writers and the actual processor.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { independentCostOracle } from "./external-response-report.mjs";
import { canonical, digest, hashBytes } from "../lib/vnext/external-response-rules.mjs";
import { scopeKey, validateExternalStore } from "../lib/vnext/persistence/external-response-store.mjs";

export async function verifyReceiptObservation(h: any) {
  const { db, projects, config, configure, op, ok, consumer, preserves, processor, fault, hooks, phase } = h;
  const evidence: any = { positives: [], controls: [] };
  const read = async (p: any, w: any) => ok(await op(p, "read", { work_ref: w.work_ref })).work;
  const act = async (p: any, w: any, key: string, mode = "reconcile") => op(p, "act", {
    key, work_ref: w.work_ref, expected_head: w.state.head, mode,
  });
  const reservations = (w: any) => w.events.filter((r: any) => r.kind === "sent" && r.payload.receipt_observation);
  const deny = async (p: any, w: any, key: string, reason: string, mode = "reconcile") => {
    await preserves(p, "act", { key, work_ref: w.work_ref, expected_head: w.state.head, mode }, reason);
    evidence.controls.push({ key, reason, egress: 0 });
  };
  const permission = (e: any, w: any, max_queries = 3, expires_at = new Date(Date.now() + 60000).toISOString()) => {
    const value = { work_ref: w.work_ref, attempt_ref: w.state.attempt.ref, expires_at, max_queries };
    e.receipt_observations ??= [];
    e.receipt_observations.push(value);
    configure();
    return value;
  };
  const envelope = (id: string, p: any, max_calls: number, expires_at: string) => {
    const e = { ...config.envelopes[0], id, project_keys: [scopeKey(p.scope)], max_calls, expires_at };
    config.envelopes.push(e);
    configure();
    return e;
  };
  const prepare = async (p: any, e: any, key: string) => {
    const entry = ok(await op(p, "read"));
    const input = entry.materials.find((m: any) => m.metadata.name === "events.json");
    const w = ok(await op(p, "prepare", {
      key, purpose: entry.definition.goal, experience_refs: [], envelope_id: e.id,
      input_ref: input.ref, terms: { operation: "aggregate", format: "json", population: "all", deadline: e.expires_at, max_rows: 200 },
      expectation: "Recover and independently check this exact aggregate without repeating work.",
      reconsider_when: "Late return, changed basis or current observation refusal.",
      owners: { receive: "ordinary consumer", check: "independent integer oracle", use: "capacity report" },
    }, entry.material_basis));
    return read(p, w);
  };
  const bytes = async (p: any, ref: string) => {
    const m = ok(await op(p, "material", { ref })).material;
    const b = Buffer.from(m.base64, "base64");
    assert.equal(hashBytes(b), m.metadata.sha256);
    assert.equal(b.length, m.metadata.size);
    return JSON.parse(b.toString());
  };
  const counts = () => {
    const { posts, queries, effects } = processor.snapshot();
    return { posts, queries, effects };
  };
  const delta = (before: any) => Object.fromEntries(Object.entries(counts()).map(([k, v]) => [k, (v as number) - before[k]]));
  processor.setConditions({ formats: ["json"], accepting: true, maxRows: 200 });

  // Open positive: actual processor return is lost after its receipt is stored.
  // A fresh ordinary process reconstructs the exact obligation after one send
  // consumes the whole legacy budget, then checks/uses real returned bytes.
  const p = projects.find((p: any) => p.label === "observation");
  const e = envelope("receipt-positive-exhausted", p, 1, new Date(Date.now() + 60000).toISOString());
  const before = counts();
  let w = await prepare(p, e, "receipt-positive-exhausted");
  const original = w.original;
  hooks.dropReturned();
  assert.equal((await act(p, w, "original-post", "send")).status, "unavailable");
  w = await read(p, w);
  assert(w.state.unresolved);
  const persisted = h.persistedReceipt(w.state.attempt.ref);
  assert.equal(persisted.record.instance, processor.instance);
  assert.equal(persisted.record.request_ref, w.state.attempt.ref);
  assert.equal(persisted.record.response.status, "returned");
  await deny(p, w, "legacy-exhausted", "external_budget_exhausted");
  permission(e, w, 1);
  const stateBeforeRead = canonical(db.prepare("SELECT * FROM vnext_external_records ORDER BY ref").all());
  const eligibility = await read(p, w);
  assert.equal(eligibility.receipt_confirmation.authority, "explicit_receipt_observation");
  assert.equal(eligibility.receipt_confirmation.remaining, 1);
  const entry = ok(await op(p, "read"));
  assert.equal(entry.work_refs[0].receipt_confirmation.eligible, true);
  assert.equal(canonical(db.prepare("SELECT * FROM vnext_external_records ORDER BY ref").all()), stateBeforeRead);
  assert.deepEqual(delta(before), { posts: 1, queries: 0, effects: 1 });
  const acquired = await consumer(p, "observation-fresh-exhausted");
  assert.equal(acquired.status, "completed");
  assert.notEqual(acquired.process, process.pid);
  w = await read(p, w);
  assert.deepEqual(w.original, original);
  assert(w.state.checked && w.state.used && !w.state.unresolved);
  assert.equal(reservations(w).length, 1);
  const saved = await consumer(p, "observation-fresh-saved-readback");
  assert.equal(saved.sha256, acquired.sha256);
  assert.notEqual(saved.process, acquired.process);
  assert.deepEqual(delta(before), { posts: 1, queries: 1, effects: 1 });
  const receipt = processor.snapshot().receipts.find((r: any) => r.ref === w.state.attempt.ref).response;
  assert.deepEqual(receipt, persisted.record.response);
  assert.equal(w.state.returned.payload.material_ref, w.state.checked.payload.material_ref);
  assert.deepEqual(await bytes(p, w.state.returned.payload.material_ref), JSON.parse(Buffer.from(receipt.material.base64, "base64").toString()));
  evidence.positives.push({ case: "send_allowance_exhausted", counts: delta(before), persisted_receipt: persisted, original_receipt: receipt,
    work: w, acquired, saved });

  // Expiry additionally requires deliberate late-result applicability review.
  const lateProject = projects.find((p: any) => p.label === "expired-observation");
  const lateEnvelope = envelope("receipt-positive-expired", lateProject, 4, new Date(Date.now() + 2500).toISOString());
  const lateBefore = counts();
  let late = await prepare(lateProject, lateEnvelope, "receipt-positive-expired");
  hooks.dropReturned();
  assert.equal((await act(lateProject, late, "late-original", "send")).status, "unavailable");
  const latePersisted = h.persistedReceipt(late.state.attempt.ref);
  assert.equal(latePersisted.record.request_ref, late.state.attempt.ref);
  assert.equal(latePersisted.record.response.status, "returned");
  await new Promise(r => setTimeout(r, Math.max(0, Date.parse(lateEnvelope.expires_at) - Date.now() + 10)));
  late = await read(lateProject, late);
  await deny(lateProject, late, "legacy-expired", "external_permission_unavailable");
  permission(lateEnvelope, late, 2);
  const lateAcquired = await consumer(lateProject, "observation-fresh-expired");
  assert.equal(lateAcquired.status, "reconsider_or_stop");
  late = await read(lateProject, late);
  assert.equal(late.applicability, "late_result_review_required");
  assert.equal(late.state.used, null);
  const actual = await bytes(lateProject, late.state.returned.payload.material_ref);
  assert.deepEqual(actual, JSON.parse(Buffer.from(latePersisted.record.response.material.base64, "base64").toString()));
  const input = await bytes(lateProject, late.state.attempt.payload.input_ref);
  const checked = independentCostOracle(input, "all");
  for (const [k, v] of Object.entries(checked)) assert.equal(actual[k], v);
  ok(await op(lateProject, "reconsider", {
    key: "deliberate-late-retain", work_ref: late.work_ref, expected_head: late.state.head,
    dependency_binding: late.dependency_binding, decision: "retain",
    reason: "Read the original returned bytes and independently checked the entire original population; unchanged current purpose permits this late result.",
  }, ok(await op(lateProject, "read")).material_basis));
  const lateUsed = await consumer(lateProject, "observation-fresh-late-use");
  assert.equal(lateUsed.status, "completed");
  const lateSaved = await consumer(lateProject, "observation-fresh-late-readback");
  assert.equal(lateSaved.sha256, lateUsed.sha256);
  late = await read(lateProject, late);
  assert.equal(late.applicability, "explicitly_reconsidered");
  assert(late.state.used);
  assert.deepEqual(delta(lateBefore), { posts: 1, queries: 1, effects: 1 });
  evidence.positives.push({ case: "send_lifetime_expired", counts: delta(lateBefore), persisted_receipt: latePersisted, work: late, lateAcquired, lateUsed, lateSaved });

  // The legacy exhausted/closed control is preserved, then explicitly observed.
  let closed = await read(fault, h.exhausted);
  const closedBefore = counts();
  permission(config.envelopes.find((e: any) => e.id === closed.original.envelope_id), closed, 1);
  ok(await act(fault, closed, "closed-confirmation"));
  closed = await read(fault, closed);
  assert(closed.state.closed && !closed.state.unresolved && !closed.state.used);
  for (const action of ["check", "use"]) {
    const data = action === "check" ? {
      response_ref: closed.state.returned.ref, material_ref: closed.state.returned.payload.material_ref,
      checker: "closed consumer", verdict: "pass", checks: "Not eligible", limitations: "Closed work",
    } : { check_ref: closed.state.returned.ref, output_ref: closed.state.returned.payload.material_ref, description: "Not eligible" };
    await preserves(fault, action, { key: `closed-${action}`, work_ref: closed.work_ref, expected_head: closed.state.head, ...data },
      "external_work_closed", ok(await op(fault, "read")).material_basis);
  }
  assert.deepEqual(delta(closedBefore), { posts: 0, queries: 1, effects: 0 });
  evidence.positives.push({ case: "closed_confirmation", counts: delta(closedBefore), work: closed });

  // A still-live legacy envelope cannot become a fallback around exhausted or
  // withdrawn explicit observation authority once this attempt has used it.
  const liveEnvelope = config.envelopes[0];
  let noFallback = await prepare(fault, liveEnvelope, "observation-no-legacy-fallback");
  hooks.dropReturned();
  assert.equal((await act(fault, noFallback, "no-fallback-post", "send")).status, "unavailable");
  noFallback = await read(fault, noFallback);
  const onlyObservation = permission(liveEnvelope, noFallback, 1);
  hooks.transform((v: any) => { const { material, accepted_terms, ...rest } = v; return { ...rest, status: "unknown" }; });
  ok(await act(fault, noFallback, "no-fallback-query"));
  noFallback = await read(fault, noFallback);
  const legacy = ok(await op(fault, "read")).envelopes.find((e: any) => e.id === liveEnvelope.id);
  assert(legacy.usage.calls < legacy.max_calls && Date.parse(legacy.expires_at) > Date.now());
  await deny(fault, noFallback, "no-fallback-after-exhaustion", "external_observation_budget_exhausted");
  liveEnvelope.receipt_observations = []; configure();
  await deny(fault, noFallback, "no-fallback-after-withdrawal", "external_observation_permission_unavailable");
  liveEnvelope.receipt_observations = [onlyObservation]; configure();

  const ce = envelope("receipt-controls", fault, 16, new Date(Date.now() + 4000).toISOString());
  const cases: any = {};
  for (const name of ["binding", "timeout", "absence", "unknown", "race", "commit-expiry", "never-issued"]) {
    let c = await prepare(fault, ce, `observation-${name}`);
    if (name !== "never-issued") {
      if (name === "absence") hooks.dropBeforeRequest(); else hooks.dropReturned();
      assert.equal((await act(fault, c, `${name}-post`, "send")).status, "unavailable");
      c = await read(fault, c);
    }
    cases[name] = c;
  }
  await new Promise(r => setTimeout(r, Math.max(0, Date.parse(ce.expires_at) - Date.now() + 10)));
  let binding = cases.binding;
  await deny(fault, binding, "missing-permission", "external_permission_unavailable");
  const perm = permission(ce, binding, 4);
  permission(ce, cases["never-issued"]);
  await deny(fault, cases["never-issued"], "never-issued", "external_request_not_issued");
  const restorePermission = () => { ce.receipt_observations = [perm]; configure(); };
  ce.receipt_observations = [{ ...perm, work_ref: cases.absence.work_ref }]; configure();
  await deny(fault, binding, "wrong-work", "external_permission_unavailable");
  ce.receipt_observations = [{ ...perm, attempt_ref: cases.absence.state.attempt.ref }]; configure();
  await deny(fault, binding, "wrong-attempt", "external_permission_unavailable");
  ce.receipt_observations = [{ ...perm, expires_at: new Date(Date.now() - 1).toISOString() }]; configure();
  await deny(fault, binding, "expired-observation", "external_observation_permission_expired");
  restorePermission();
  for (const [field, changed] of Object.entries({ instance: "other-incarnation", secret: randomBytes(32).toString("base64url"),
    endpoint: "http://127.0.0.1:1", input_sha256: ["sha256:" + "a".repeat(64)], max_calls: 17 })) {
    const old = ce[field]; ce[field] = changed; configure();
    assert.equal((await read(fault, binding)).receipt_confirmation.reason, "external_permission_unavailable");
    await deny(fault, binding, `changed-${field}`, "external_permission_unavailable");
    ce[field] = old; configure();
  }
  const configuredEnvelopes = config.envelopes;
  config.envelopes = configuredEnvelopes.filter((e: any) => e !== ce); configure();
  assert.equal((await read(fault, binding)).state.unresolved, true);
  await deny(fault, binding, "removed-original-envelope", "external_permission_unavailable");
  config.envelopes = configuredEnvelopes; configure();
  const originalMaterial = db.prepare("SELECT body FROM vnext_external_materials WHERE ref=?").get(binding.original.input_ref);
  db.prepare("UPDATE vnext_external_materials SET body=? WHERE ref=?").run(Buffer.from("damaged input"), binding.original.input_ref);
  try { await deny(fault, binding, "changed-input-bytes", "external_material_integrity_failed"); }
  finally { db.prepare("UPDATE vnext_external_materials SET body=? WHERE ref=?").run(originalMaterial.body, binding.original.input_ref); }
  await deny(fault, binding, "no-retransmission", "external_reconciliation_required", "send");
  await preserves(fault, "act", { key: "changed-terms", work_ref: binding.work_ref, expected_head: binding.state.head,
    mode: "reconcile", terms: { ...binding.original.terms, population: "success" } }, "external_invalid_input");
  await preserves(fault, "amend", { key: "no-amendment", work_ref: binding.work_ref, expected_head: binding.state.head,
    proposal_ref: binding.state.sent.ref, input_ref: binding.original.input_ref, terms: binding.original.terms },
    "external_reconciliation_required", ok(await op(fault, "read")).material_basis);
  // An unrelated valid project/share edit is not revocation of this binding.
  const other = config.projects.find((p: any) => p.repository_root !== fault.root);
  const share = other.share_to; other.share_to = []; configure();
  assert.equal((await read(fault, binding)).receipt_confirmation.eligible, true);
  other.share_to = share; configure();

  const noEgress = counts();
  hooks.afterReservation(() => { ce.receipt_observations = []; configure(); });
  const reservedView = binding;
  assert.equal((await act(fault, binding, "withdraw-after-admission")).reason, "external_observation_permission_unavailable");
  assert.deepEqual(counts(), noEgress);
  binding = await read(fault, binding);
  assert.equal(reservations(binding).length, 1);
  assert.equal(binding.receipt_confirmation.reason, "external_observation_permission_unavailable");
  assert.equal((await act(fault, reservedView, "withdraw-after-admission")).status, "exact_replay");
  await deny(fault, binding, "withdrawn-permission", "external_observation_permission_unavailable");
  restorePermission();
  ce.receipt_observations = [{ ...perm, max_queries: 5 }]; configure();
  await deny(fault, binding, "no-budget-reset", "external_observation_permission_changed");
  ce.receipt_observations = [{ ...perm, expires_at: new Date(Date.now() + 120000).toISOString() }]; configure();
  await deny(fault, binding, "no-deadline-renewal", "external_observation_permission_changed");
  restorePermission();

  // Revoke project admission after durable reservation, before egress.
  const project = config.projects.find((p: any) => p.repository_root === fault.root);
  const originalRoot = project.repository_root;
  hooks.afterReservation(() => { project.repository_root = projects[0].root; configure(); });
  assert.equal((await act(fault, binding, "project-after-admission")).reason, "external_access_refused");
  assert.deepEqual(counts(), noEgress);
  project.repository_root = originalRoot; configure();
  binding = await read(fault, binding);
  assert.equal(reservations(binding).length, 2);
  // The actual query reply arrives after observation permission is withdrawn.
  let release: () => void = () => {};
  let reached: () => void = () => {};
  const reachedReply = new Promise<void>(r => { reached = r; });
  hooks.hold((r: () => void) => { release = r; reached(); });
  const pending = act(fault, binding, "withdraw-at-commit");
  await reachedReply;
  ce.receipt_observations = []; configure(); release();
  assert.equal((await pending).reason, "external_observation_permission_unavailable");
  restorePermission();
  binding = await read(fault, binding);
  assert.equal(reservations(binding).length, 3);
  assert(binding.state.unresolved);
  // Credential revocation at the same pre-egress boundary consumes the admitted
  // query but cannot reach the original destination with withdrawn credentials.
  const oldSecret = ce.secret, beforeCredential = counts();
  hooks.afterReservation(() => { ce.secret = randomBytes(32).toString("base64url"); configure(); });
  assert.equal((await act(fault, binding, "credential-after-admission")).reason, "external_permission_unavailable");
  assert.deepEqual(counts(), beforeCredential);
  ce.secret = oldSecret; configure();
  binding = await read(fault, binding);
  assert.equal(reservations(binding).length, 4);
  assert.equal(binding.receipt_confirmation.reason, "external_observation_budget_exhausted");
  // Keep one outstanding obligation for actual staged restore below.
  evidence.unresolved_work_ref = binding.work_ref;
  evidence.unresolved_events = binding.events;

  let timeout = cases.timeout;
  permission(ce, timeout, 3);
  hooks.hold((r: () => void) => { release = r; });
  assert.equal((await act(fault, timeout, "query-timeout")).status, "unavailable"); release();
  timeout = await read(fault, timeout);
  hooks.failCommit(true);
  try { assert.equal((await act(fault, timeout, "query-failed-commit")).status, "unavailable"); }
  finally { hooks.failCommit(false); }
  timeout = await read(fault, timeout);
  hooks.dropReturned();
  assert.equal((await act(fault, timeout, "query-lost-reply")).status, "unavailable");
  timeout = await read(fault, timeout);
  assert(timeout.state.unresolved);
  assert.equal(reservations(timeout).length, 3);
  await deny(fault, timeout, "query-exhausted", "external_observation_budget_exhausted");

  let absent = cases.absence;
  permission(ce, absent, 1);
  ok(await act(fault, absent, "query-absence"));
  absent = await read(fault, absent);
  assert.equal(absent.state.returned.payload.response.status, "absent");
  await deny(fault, absent, "late-absence-needs-review", "external_reconsideration_required", "send");
  ok(await op(fault, "reconsider", { key: "retain-absence-evidence", work_ref: absent.work_ref,
    expected_head: absent.state.head, dependency_binding: absent.dependency_binding, decision: "retain",
    reason: "Retain the same request's authoritative absence as evidence only; it does not renew the expired send deadline.",
  }, ok(await op(fault, "read")).material_basis));
  absent = await read(fault, absent);
  await deny(fault, absent, "absence-does-not-renew-send", "external_deadline_elapsed", "send");
  let unknown = cases.unknown;
  permission(ce, unknown, 4);
  for (const field of ["request_ref", "input_ref", "terms_ref"]) {
    hooks.transform((v: any) => ({ ...v, [field]: "sha256:" + "f".repeat(64) }));
    assert.equal((await act(fault, unknown, `query-wrong-${field}`)).reason, "external_response_binding_mismatch");
    unknown = await read(fault, unknown);
    assert(unknown.state.unresolved);
  }
  hooks.transform((v: any) => { const { material, accepted_terms, ...rest } = v; return { ...rest, status: "unknown" }; });
  ok(await act(fault, unknown, "query-unknown"));
  unknown = await read(fault, unknown);
  assert(unknown.state.unresolved);
  await deny(fault, unknown, "unknown-consumes-allowance", "external_observation_budget_exhausted");

  const race = cases.race;
  permission(ce, race, 3);
  const raceBefore = counts();
  const raceHeld = new Promise<void>(r => { reached = r; });
  hooks.hold((r: () => void) => { release = r; reached(); });
  const firstQuery = act(fault, race, "same-query");
  await raceHeld;
  const contenders = await Promise.all([act(fault, race, "same-query"), act(fault, race, "stale-query")]);
  release();
  const same = [await firstQuery, ...contenders];
  assert(same.some(r => r.status === "saved"));
  assert(same.some(r => r.status === "exact_replay"));
  assert(same.some(r => r.reason === "external_head_changed"));
  assert.equal(reservations(await read(fault, race)).length, 1);
  assert.deepEqual(delta(raceBefore), { posts: 0, queries: 1, effects: 0 });

  const expiring = cases["commit-expiry"];
  const expiryBefore = counts();
  const expiringPermission = permission(ce, expiring, 1, new Date(Date.now() + 500).toISOString());
  const expiryHeld = new Promise<void>(r => { reached = r; });
  hooks.hold((r: () => void) => { release = r; reached(); });
  const expires = act(fault, expiring, "observation-expires-at-commit");
  await expiryHeld;
  await new Promise(r => setTimeout(r, Math.max(0, Date.parse(expiringPermission.expires_at) - Date.now() + 20)));
  release();
  assert.equal((await expires).reason, "external_observation_permission_expired");
  assert((await read(fault, expiring)).state.unresolved);
  assert.equal(reservations(await read(fault, expiring)).length, 1);
  assert.deepEqual(delta(expiryBefore), { posts: 0, queries: 1, effects: 0 });
  validateExternalStore(db);
  // Re-sign only deliberately malformed last records inside rolled-back
  // transactions. No successful history or consumption is manufactured.
  const originalLast = timeout.events.at(-1);
  for (const mutation of [
    (v: any) => { delete v.receipt_observation; },
    (v: any) => { v.receipt_observation.work_ref = binding.work_ref; },
    (v: any) => { v.receipt_observation.attempt_ref = binding.state.attempt.ref; },
    (v: any) => { v.receipt_observation.max_queries = 2; },
    (v: any) => { v.receipt_observation.max_queries = 4; },
    (v: any) => { v.mode = "send"; },
    (v: any) => { v.receipt_observation.authorization_id = "renamed-allowance"; },
  ]) {
    db.exec("BEGIN IMMEDIATE");
    try {
      const { ref: oldRef, ...body } = JSON.parse(JSON.stringify(originalLast));
      mutation(body.payload);
      db.prepare("UPDATE vnext_external_records SET ref=?,payload_json=? WHERE ref=?")
        .run(digest(body), canonical(body.payload), oldRef);
      assert.throws(() => validateExternalStore(db));
    } finally { db.exec("ROLLBACK"); }
  }
  validateExternalStore(db);
  evidence.controls.push({ timeout_queries: reservations(timeout).length, absent: absent.state.returned,
    unknown: unknown.state.returned, race: same, commit_expiry: (await read(fault, expiring)).receipt_confirmation });
  evidence.journal_digest = digest(db.prepare("SELECT * FROM vnext_external_records ORDER BY ref").all());
  phase("explicit_receipt_observation_exhaustion_expiry_fresh_use_closure_revocation_and_accounting");
  return evidence;
}
