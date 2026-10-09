import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { getOrCreateDefaultWorkspaceIdentityV01, getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01 } from "../lib/vnext/persistence/project-identity-registry";
import { selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { issueVNextLocalOperatorBootstrapV01, projectScopedOperatorCookieNameV01 } from "../lib/vnext/runtime/local-operator-session";
import { VNEXT_OPERATOR_PILOT_PREVIEW_COOKIE_V01 as LEGACY } from "../lib/vnext/runtime/operator-pilot-semantic-transition";
import { createVNextLocalOperatorSessionHandlersV01 } from "../app/api/vnext/operator/session/route";
import { createVNextOperatorSemanticReviewHandlersV01 } from "../app/api/vnext/operator/semantic-review/route";
import { createVNextOperatorSemanticTransitionHandlersV01 } from "../app/api/vnext/operator/semantic-transition/route";
import { seedProjectTransition } from "./project-transition-fixture";

class CookieJar {
  values = new Map<string, string>();
  header() { return [...this.values].map(([k, v]) => `${k}=${v}`).join("; "); }
  absorb(response: Response) {
    for (const cookie of response.headers.getSetCookie()) {
      const pair = cookie.split(";")[0]!, index = pair.indexOf("="), name = pair.slice(0, index);
      if (cookie.includes("Max-Age=0")) this.values.delete(name); else this.values.set(name, pair.slice(index + 1));
    }
  }
}

async function fixture(run: (f: Awaited<ReturnType<typeof prepare>>) => Promise<void>) {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-preview-scope-")));
  const db = new Database(path.join(root, "workspace.db"));
  try { await run(await prepare(root, db)); }
  finally { db.close(); rmSync(root, { recursive: true }); assert.equal(db.open, false); assert.equal(existsSync(root), false); }
}

async function prepare(root: string, db: Database.Database) {
  db.pragma("foreign_keys=ON"); applyCanonicalDatabaseMigrations(db);
  let instant = Date.parse("2026-07-11T09:00:00.000Z");
  const clock = { now: () => new Date(instant).toISOString() };
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db, { now: clock.now });
  const projects = ["A", "B"].map(name => {
    const dir = path.join(root, name); mkdirSync(dir);
    const project = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: workspace.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(dir, { base_path: root }), display_name: name }, { now: clock.now }).project;
    const config = { enabled: true as const, database_path: db.name, workspace_id: workspace.workspace_id,
      project_id: project.project_id, operator_id: "operator:preview-scope" };
    return seedProjectTransition(db, config);
  });
  const [a, b] = projects as [typeof projects[number], typeof projects[number]];
  selectActiveProjectV01(db, { ...a.config, expected_project_id: null, expected_revision: null, now: clock.now() });
  const environment = { NODE_ENV: "test" as const, AUGNES_DB_PATH: db.name, AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1",
    AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: workspace.workspace_id, AUGNES_VNEXT_OPERATOR_PROJECT_ID: a.config.project_id,
    AUGNES_VNEXT_OPERATOR_ID: a.config.operator_id };
  const sessions = createVNextLocalOperatorSessionHandlersV01({ environment, clock });
  const review = createVNextOperatorSemanticReviewHandlersV01({ environment, clock });
  const transition = createVNextOperatorSemanticTransitionHandlersV01({ environment, clock });
  const jar = new CookieJar();
  const request = (p: typeof a, endpoint: string, body?: unknown, cookie = jar.header()) => new Request(`http://127.0.0.1:3000${endpoint}`, {
    method: body === undefined ? "GET" : "POST", headers: { cookie, "Augnes-Project-Id": p.config.project_id,
      "content-type": "application/json", host: "127.0.0.1:3000", origin: "http://127.0.0.1:3000" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const call = async (handler: (r: Request) => Promise<Response>, req: Request, absorb = true) => {
    const response = await handler(req); const body = await response.clone().json(); if (absorb) jar.absorb(response);
    return { response, status: response.status, body };
  };
  const decisions = new Map<string, any>();
  for (const p of projects) {
    const issued = issueVNextLocalOperatorBootstrapV01(db, { config: p.config, clock });
    const boot = await call(sessions.POST, request(p, "/api/vnext/operator/session", { action: "bootstrap", bootstrap_token: issued.bootstrap_token }));
    assert.equal(boot.status, 200, boot.body.error_code);
    const result = await call(review.POST, request(p, "/api/vnext/operator/semantic-review", p.decisionRequest));
    assert.equal(result.status, 201, result.body.error_code); decisions.set(p.config.project_id, result.body.decision);
  }
  const binding = (p: typeof a) => ({ proposal_id: p.proposal.proposal_id, proposal_fingerprint: p.proposal.integrity.fingerprint,
    decision_id: decisions.get(p.config.project_id).decision_id, decision_fingerprint: decisions.get(p.config.project_id).integrity.fingerprint });
  const preview = (p: typeof a, absorb = true) => call(transition.GET,
    request(p, "/api/vnext/operator/semantic-transition?" + new URLSearchParams(binding(p))), absorb);
  const confirmRequest = (p: typeof a, preview: any, cookie = jar.header()) => request(p, "/api/vnext/operator/semantic-transition",
    { action: "confirm", ...binding(p), confirmation_digest: preview.body.preview.confirmation_digest }, cookie);
  const confirm = (p: typeof a, preview: any, absorb = true) => call(transition.POST, confirmRequest(p, preview), absorb);
  const apply = (p: typeof a, gate: any) => call(transition.POST, request(p, "/api/vnext/operator/semantic-transition", {
    action: "apply", ...binding(p), gate_record_id: gate.gate_record_id, gate_record_fingerprint: gate.integrity.fingerprint,
    prior_packet_id: p.packet.packet_id, prior_packet_fingerprint: p.packet.integrity.fingerprint }));
  const snapshot = () => createHash("sha256").update(JSON.stringify([
    db.prepare("SELECT * FROM vnext_core_records ORDER BY record_id").all(),
    db.prepare("SELECT * FROM vnext_local_operator_sessions ORDER BY session_id").all(),
    db.prepare("SELECT * FROM vnext_semantic_state_entries ORDER BY project_id, target_key").all(),
    db.prepare("SELECT * FROM vnext_semantic_target_heads ORDER BY project_id, target_key").all(),
  ])).digest("hex");
  return { db, a, b, projects, clock, advance: (ms: number) => { instant += ms; }, jar, sessions, review, transition,
    request, call, decisions, binding, preview, confirm, confirmRequest, apply, snapshot };
}

type Fixture = Awaited<ReturnType<typeof prepare>>;
const previewName = (p: Fixture["a"]) => projectScopedOperatorCookieNameV01(LEGACY, p.config.project_id);
async function refused(f: Fixture, req: Request, status: number, code: string) {
  const before = f.snapshot(), result = await f.call(f.transition.POST, req);
  assert.equal(result.status, status, result.body.error_code); assert.equal(result.body.error_code, code);
  assert.equal(f.snapshot(), before, "Refusal must preserve all semantic rows and session/nonce state");
  assert.equal(result.response.headers.getSetCookie().length, 0, "A refusal cannot change another pending preview");
}
function persisted(f: Fixture, applied: any[]) {
  const fresh = new Database(f.db.name, { readonly: true, fileMustExist: true });
  try {
    for (const [i, p] of f.projects.entries()) {
      const result = applied[i], receipt = result.body.transition_receipt, packet = result.body.later_packet;
      for (const [kind, id] of [["semantic_commit_gate", result.body.gate_record.gate_record_id],
        ["state_transition_receipt", receipt.transition_receipt_id], ["task_context_packet", packet.packet_id]]) {
        const row = fresh.prepare("SELECT project_id, payload_json FROM vnext_core_records WHERE record_kind=? AND record_id=?").get(kind, id) as any;
        assert(row, kind); assert.equal(row.project_id, p.config.project_id);
        assert.equal(JSON.parse(row.payload_json).project_id, p.config.project_id);
      }
      assert.equal(receipt.source_proposal.proposal_id, p.proposal.proposal_id);
      assert.equal(receipt.source_decision.decision_id, f.binding(p).decision_id);
      const states = fresh.prepare("SELECT source_proposal_id FROM vnext_semantic_state_entries WHERE project_id=?").all(p.config.project_id) as any[];
      assert.equal(states.length, 1); assert.equal(states[0].source_proposal_id, p.proposal.proposal_id);
    }
  } finally { fresh.close(); }
}

async function main() {
  const guard = installZeroNetworkGuard({ allowLoopback: false });
  try {
    if (process.argv.includes("--reproduce")) await fixture(async f => {
      const pa = await f.preview(f.a), pb = await f.preview(f.b);
      assert.equal(pa.status, 200); assert.equal(pb.status, 200);
      const before = f.snapshot(), ca = await f.confirm(f.a, pa);
      assert.equal(ca.status, 409); assert.equal(ca.body.error_code, "operator_pilot_preview_binding_invalid"); assert.equal(f.snapshot(), before);
      assert.equal((await f.confirm(f.b, pb)).status, 201);
      const afterB = f.snapshot(), againA = await f.confirm(f.a, pa);
      assert.equal(againA.status, 409); assert.equal(againA.body.error_code, "operator_pilot_preview_binding_missing"); assert.equal(f.snapshot(), afterB);
      console.log(JSON.stringify({ actual_route_reproduction: "PASS", A_after_B_preview: "409 operator_pilot_preview_binding_invalid",
        A_after_B_confirmation: "409 operator_pilot_preview_binding_missing", refusal_writes: 0, preview_cookie_header_bytes: f.jar.header().length }));
    });
    else {
      for (const reverse of [false, true]) await fixture(async f => {
        // Requests share one jar with both actual authenticated project sessions.
        // Deliver preview responses in reverse completion order; hold the first
        // confirmation response until the other project's confirmation finishes.
        const pa = await f.preview(f.a, false), pb = await f.preview(f.b, false);
        assert.equal(pa.status, 200); assert.equal(pb.status, 200);
        f.jar.values.set(LEGACY, "retired-preview"); f.jar.absorb(pb.response); f.jar.absorb(pa.response);
        assert.equal(f.jar.values.has(LEGACY), false);
        assert.notEqual(previewName(f.a), previewName(f.b));
        for (const p of f.projects) assert(f.jar.values.has(previewName(p)));
        const previews = [pa, pb], order = reverse ? [1, 0] : [0, 1], confirmed: any[] = [];
        for (const i of order) {
          const other = f.projects[1-i]!, pending = f.jar.values.get(previewName(other));
          confirmed[i] = await f.confirm(f.projects[i]!, previews[i], false);
          assert.equal(confirmed[i].status, 201, confirmed[i].body.error_code);
          assert.equal(f.jar.values.get(previewName(other)), pending);
        }
        f.jar.absorb(confirmed[order[1]!]!.response); f.jar.absorb(confirmed[order[0]!]!.response);
        for (const p of f.projects) assert.equal(f.jar.values.has(previewName(p)), false);
        const applied = [];
        for (const [i, p] of f.projects.entries()) { const result = await f.apply(p, confirmed[i].body.gate_record); assert.equal(result.status, 201, result.body.error_code); applied.push(result); }
        persisted(f, applied);
        console.log(JSON.stringify({ actual_routes: "PASS", confirmation_order: reverse ? "B,A" : "A,B", reversed_response_delivery: true, fresh_persisted_projects: 2 }));
      });
      await fixture(async f => {
        const pb = await f.preview(f.b), cb = await f.confirm(f.b, pb, false);
        assert.equal(cb.status, 201);
        const pa = await f.preview(f.a), aCookie = f.jar.values.get(previewName(f.a));
        f.jar.absorb(cb.response); // B's late deletion arrives after A's new preview.
        assert.equal(f.jar.values.get(previewName(f.a)), aCookie);
        assert.equal((await f.confirm(f.a, pa)).status, 201);
      });
      await fixture(async f => {
        const pa = await f.preview(f.a), pb = await f.preview(f.b, false);
        const aCookie = f.jar.values.get(previewName(f.a)); f.jar.absorb(pb.response);
        assert.equal(f.jar.values.get(previewName(f.a)), aCookie, "B's delayed preview cannot overwrite A");
        const bCookie = f.jar.values.get(previewName(f.b));
        const ca = await f.confirm(f.a, pa); assert.equal(ca.status, 201);
        assert.equal(f.jar.values.get(previewName(f.b)), bCookie, "A deletion must leave B's pending preview intact");
        assert.equal((await f.confirm(f.b, pb)).status, 201);
      });
      await fixture(async f => {
        const pa = await f.preview(f.a), pb = await f.preview(f.b);
        const aName = previewName(f.a), bName = previewName(f.b), aValue = f.jar.values.get(aName)!, bValue = f.jar.values.get(bName)!;
        const altered = (value: string) => { const jar = new CookieJar(); jar.values = new Map(f.jar.values); jar.values.set(aName, value); return jar.header(); };
        for (const value of [bValue, aValue.split('.')[0]+'.'+bValue.split('.')[1], 'forged.signature'])
          await refused(f, f.confirmRequest(f.a, pa, altered(value)), 409, "operator_pilot_preview_binding_invalid");
        const original = new Map(f.jar.values);
        f.jar.values.set(LEGACY, aValue);
        f.jar.values.set(aName, "invalid.scoped");
        await refused(f, f.confirmRequest(f.a, pa), 409, "operator_pilot_preview_binding_invalid");
        f.jar.values.set(aName, "");
        await refused(f, f.confirmRequest(f.a, pa), 409, "operator_pilot_preview_binding_missing");
        f.jar.values.delete(aName);
        await refused(f, f.confirmRequest(f.a, pa), 409, "operator_pilot_preview_binding_missing");
        f.jar.values = original;
        await refused(f, f.confirmRequest(f.a, pa, f.jar.header()+`; ${aName}=duplicate`), 409, "operator_pilot_preview_binding_missing");
        await refused(f, f.confirmRequest(f.a, pa, f.jar.header()+`; oversized=${"x".repeat(4096)}`), 401, "operator_session_cookie_invalid");
        const cookieA = projectScopedOperatorCookieNameV01("augnes_vnext_operator_session_v01", f.a.config.project_id);
        const cookieB = projectScopedOperatorCookieNameV01("augnes_vnext_operator_session_v01", f.b.config.project_id);
        const credentialA = f.jar.values.get(cookieA)!; f.jar.values.set(cookieA, f.jar.values.get(cookieB)!);
        await refused(f, f.confirmRequest(f.a, pa), 403, "operator_session_scope_mismatch"); f.jar.values.set(cookieA, credentialA);
        const changedDigest = f.confirmRequest(f.a, { body: { preview: { confirmation_digest: `sha256:${"0".repeat(64)}` } } });
        await refused(f, changedDigest, 409, "operator_pilot_preview_binding_mismatch");
        const staleNonce = f.confirmRequest(f.a, pa);
        assert.equal((await f.confirm(f.a, pa)).status, 201);
        await refused(f, staleNonce, 409, "operator_action_nonce_invalid");
        assert.equal((await f.confirm(f.b, pb)).status, 201);
      });
      for (const mode of ["revoked", "expired", "preview_expired", "decision_changed", "state_changed"] as const) await fixture(async f => {
        const pa = await f.preview(f.a);
        let req = f.confirmRequest(f.a, pa), status = 409, code = "operator_pilot_transition_conflict";
        if (mode === "revoked") { assert.equal((await f.call(f.sessions.POST, f.request(f.a, "/api/vnext/operator/session", { action: "logout" }))).status, 200); status=401; code="operator_session_revoked"; }
        if (mode === "expired") { f.advance(9*60*60*1000); status=401; code="operator_session_expired"; }
        if (mode === "preview_expired") f.advance(16*60*1000);
        if (mode === "decision_changed") {
          f.advance(1); // The replacement is strictly newer, not a timestamp tie.
          const changed = await f.call(f.review.POST, f.request(f.a, "/api/vnext/operator/semantic-review", { ...f.a.decisionRequest, decision: "reject", rationale_summary: "A genuinely newer review decision." }));
          assert.equal(changed.status, 201); req=f.confirmRequest(f.a,pa); code="operator_pilot_decision_not_current";
        }
        if (mode === "state_changed") {
          // A second real session applies the same target. The original session
          // and preview remain cryptographically valid but semantically stale.
          const issued=issueVNextLocalOperatorBootstrapV01(f.db,{config:f.a.config,clock:f.clock});
          assert.equal((await f.call(f.sessions.POST,f.request(f.a,"/api/vnext/operator/session",{action:"bootstrap",bootstrap_token:issued.bootstrap_token}))).status,200);
          const newer=await f.preview(f.a), confirmed=await f.confirm(f.a,newer);
          assert.equal(confirmed.status,201); assert.equal((await f.apply(f.a,confirmed.body.gate_record)).status,201);
          code="pilot_add_requires_observed_absent_state";
        }
        await refused(f, req, status, code).catch(error => { throw new Error(`refusal_case:${mode}`, { cause: error }); });
      });
      console.log(JSON.stringify({ actual_route_refusals: "PASS", wrong_project_signature_forgery_legacy_no_fallback: true,
        same_project_nonce_conflict: true, revoked_expired_changed_material: true, partial_semantic_writes: 0, owned_databases_and_roots_removed: true }));
    }
  } finally { assert.equal(guard.attempts.length, 0); guard.restore(); }
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
