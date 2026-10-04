import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { registerOwnedChild, waitForOwnedProcessExit, terminateOwnedProcessTree } from "./test-harness-process-lifecycle.mjs";
import path from "node:path";
import { defineInitialProjectWorkV01, readProjectWorkInitializationV01 } from "../lib/vnext/runtime/project-work-initialization";
import { readProjectWorkRevisionEligibilityStrictV01, readProjectWorkRevisionEligibilityV01, revisePreExecutionProjectWorkV01 } from "../lib/vnext/runtime/project-work-revision";
import { buildPreExecutionProjectWorkRevisionPacketV01, inspectPreExecutionProjectWorkRevisionChainV01 } from "../lib/vnext/runtime/pre-execution-project-work-revision";
import { inspectInitialProjectWorkPacketLineageV01 } from "../lib/vnext/runtime/initial-project-work-context";
import { hasAuthoredSuccessorOfPacketV01, inspectAuthoredSuccessorPacketV01, readOrdinarySuccessorRootBindingV01 } from "../lib/vnext/runtime/authored-successor-task";
import { buildOrdinarySuccessorRevisionV01, ordinarySuccessorRevisionIdempotencyKeyV01, inspectCurrentOrdinarySuccessorRevisionChainV01 } from "../lib/vnext/runtime/authored-successor-revision";
import { readCurrentProjectWorkPacketLineageV01 } from "../lib/vnext/runtime/operator-pilot-project-continuity";
import { insertVNextCoreRecordV01 } from "../lib/vnext/persistence/durable-semantic-store";
import { exportActivePortableProjectV01, importPortableProjectV01, parseAndValidatePortableProjectV01 } from "../lib/vnext/portability/portable-project";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { canonicalizeProtocolValueV01 as canonical } from "../lib/vnext/protocol-primitives";
import { DURABLE_AUTHORED_WORK_V01 } from "../types/vnext/project-work-initialization";
import { readSelectedWorkSources } from "../lib/intake/selected-work-source-comparison";
import { recallRetainedWorkSources } from "../lib/intake/retained-work-source-recall";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";
import { buildTaskContextPacketV01, validateTaskContextPacketV01 } from "../lib/vnext/task-context-packet";
import { hasAutonomyRunAdmissionForPreparation } from "../lib/autonomy/runner-ledger";
import { readProjectWorkPacketHistoryV01, PROJECT_WORK_HISTORY_READ_BUDGET_V01 } from "../lib/vnext/runtime/project-work-packet-history";

const core = (db: Database.Database) => db.prepare("SELECT * FROM vnext_core_records ORDER BY rowid").all() as any[];
const authority = (db: Database.Database) => canonical(["autonomy_runs", "autonomy_run_steps", "autonomy_run_events", "vnext_project_automation_controls"]
  .filter(t => db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(t))
  .map(t => db.prepare(`SELECT * FROM ${t} ORDER BY rowid`).all()));

/** Owning suite supplies its existing authenticated fixture helpers. Prefixes
 * use the unchanged canonical compilers and genuine operator provenance; every
 * old boundary is crossed through the real authenticated transaction owner. */
export async function cumulativeRevisionHistory(h: any, successor?: { fixture: any; saved: any }) {
  const started = performance.now();
  const f = successor?.fixture ?? h.createFixtureV01("cumulative-initial", false, true, true);
  let credential = successor ? h.credentialFromCookieV01(successor.saved.session_admission.cookie_value) : h.authenticatedSessionV01(f, "cumulative");
  const ordinary = !!successor;
  const saved = successor?.saved ?? defineInitialProjectWorkV01(f.db, { config: f.config, credential, request: h.requestV01(f), clock: { now: () => "2026-08-01T00:00:02.000Z" } });
  credential = h.credentialFromCookieV01(saved.session_admission.cookie_value);
  const origin = saved.packet as TaskContextPacketV01, frozen = core(f.db), beforeAuthority = authority(f.db);
  const anchor = ordinary ? inspectAuthoredSuccessorPacketV01(f.db, { config: f.config, packet: origin }) : null;
  const originRef = ordinary ? null : inspectInitialProjectWorkPacketLineageV01(f.db, { ...f, packet: origin }).definition_ref;
  const root = ordinary ? readOrdinarySuccessorRootBindingV01(origin) : null;
  const at = (n: number) => new Date(Date.parse(origin.generated_at) + n * 1000).toISOString();
  let current = origin, lastRequest: any, lastResult: any;
  const checkpoints = new Set([31, 32, 33, 63, 64, 65, 127, 128, 129, 254, 255, 256, 257, 320]);
  const measure = (n: number) => {
    const prepare = f.db.prepare; let queries = 0;
    f.db.prepare = function(...args: any[]) { queries++; return prepare.apply(this, args); };
    const start = performance.now();
    try {
      const chain = ordinary ? inspectCurrentOrdinarySuccessorRevisionChainV01(f.db, f, at(n + 1))! : inspectPreExecutionProjectWorkRevisionChainV01(f.db, f);
      assert.equal(chain.revision_count, n); assert.equal(chain.tip_packet.packet_id, current.packet_id);
      assert(queries < 12 * n + 200, `Reconstruction must not issue a quadratic number of queries: ${queries} for ${n}`);
      console.log(JSON.stringify({ cumulative_history: ordinary ? "successor" : "initial", revisions: n, read_queries: queries, read_ms: performance.now() - start }));
      return chain;
    } finally { f.db.prepare = prepare; }
  };
  try {
    for (let n = 1; n <= 320; n++) {
      const request = h.revisionRequestV01(f, current, ordinary ? "authored_successor_task" : n === 1 ? "initial_user_defined" : "pre_execution_user_revision",
        { ...current.task, goal: `Cumulative ${ordinary ? "successor" : "initial"} revision ${n}` });
      if (n === 1 || checkpoints.has(n)) {
        lastResult = revisePreExecutionProjectWorkV01(f.db, { config: f.config, credential, request, clock: { now: () => at(n) } });
        assert.equal(lastResult.status, "inserted"); current = lastResult.packet;
        credential = h.credentialFromCookieV01(lastResult.session_admission.cookie_value);
      } else {
        // Exact builder/store fixtures avoid measuring all 320 write prefixes.
        // Nothing is resealed, backdated or presented as historical real work.
        const built = ordinary ? buildOrdinarySuccessorRevisionV01(current, anchor!, {
          request, revision_number: n, session_id: credential.session_id, work_lifetime: DURABLE_AUTHORED_WORK_V01,
          origin_packet_id: origin.packet_id, origin_packet_fingerprint: origin.integrity.fingerprint, ...root!,
        }, f.config.operator_id, at(n)) : buildPreExecutionProjectWorkRevisionPacketV01({ request, operator_id: f.config.operator_id,
          session_id: credential.session_id, revision_number: n, definition: request, prior_packet: current,
          origin_first_work_definition_ref: originRef!, generated_at: at(n) });
        current = built.packet;
        insertVNextCoreRecordV01(f.db, { ...f, record_kind: "task_context_packet", record_id: current.packet_id, fingerprint: current.integrity.fingerprint,
          idempotency_key: ordinary ? ordinarySuccessorRevisionIdempotencyKeyV01(current) : (built as any).lineage.idempotency_key,
          payload: current, created_at: current.generated_at });
      }
      lastRequest = request;
      if (checkpoints.has(n)) {
        const bytes = f.db.serialize(); measure(n);
        assert.equal(lastResult.revision_eligibility.eligible, true);
        assert.equal(lastResult.revision_eligibility.revision_count, n);
        if (n === 33 || n === 320) {
          assert.equal(readProjectWorkRevisionEligibilityStrictV01(f.db, f, { evaluated_at: at(n + 1) }).eligible, true);
          assert.equal(readProjectWorkInitializationV01(f.db, f).current_packet?.packet_id, current.packet_id);
          assert.equal(readCurrentProjectWorkPacketLineageV01(f.db, f.config)?.packet.packet_id, current.packet_id);
        }
        if (ordinary) {
          assert.equal(hasAuthoredSuccessorOfPacketV01(f.db, f, origin.packet_id), true);
          assert.equal(hasAuthoredSuccessorOfPacketV01(f.db, f, request.expected_current_packet_id), true, "The immediate successor may be beyond the first four pages");
          assert.equal(hasAuthoredSuccessorOfPacketV01(f.db, f, current.packet_id), false);
        }
        assert(bytes.equals(f.db.serialize()), "All history and currentness reads are read-only");
        if (n === 32 && process.argv.includes("--cumulative-surfaces-only")) {
          await cumulativeSurfaces(f, h.ROOT, ordinary, at(33)); return;
        }
      }
    }
    const replay = revisePreExecutionProjectWorkV01(f.db, { config: f.config, credential, request: lastRequest, clock: { now: () => at(321) } });
    assert.equal(replay.status, "exact_replay"); assert.equal(replay.packet.packet_id, current.packet_id);
    credential = h.credentialFromCookieV01(replay.session_admission.cookie_value);
    const beforeStale = f.db.serialize();
    assert.throws(() => revisePreExecutionProjectWorkV01(f.db, { config: f.config, credential, request: { ...lastRequest, goal: "Stale competing save" }, clock: { now: () => at(322) } }), /current_packet_changed/);
    assert(beforeStale.equals(f.db.serialize()));
    assert.deepEqual(core(f.db).slice(0, frozen.length), frozen); assert.equal(authority(f.db), beforeAuthority);
    assert.equal(current.expires_at, null); assert.equal(current.capability_grant, null);
    assert.deepEqual(readSelectedWorkSources(current), readSelectedWorkSources(origin));
    for (const field of ["tensions", "risks", "return_contract"] as const) assert.deepEqual(current[field], origin[field]);
    if (ordinary) assert.deepEqual(current.gaps, origin.gaps);
    else {
      // Initial-definition gaps are regenerated by the unchanged compiler with
      // the latest declaration's provenance; the unresolved obligation survives.
      const obligations = (packet: TaskContextPacketV01) => packet.gaps.map(({ source_refs, external_refs, ...gap }) => gap);
      assert.deepEqual(obligations(current), obligations(origin));
    }
    for (const field of ["required_checks", "forbidden_actions", "data_classification"] as const) assert.deepEqual(current.constraints[field], origin.constraints[field]);
    assert.deepEqual(core(f.db).filter(r => r.record_kind !== "task_context_packet"), frozen.filter(r => r.record_kind !== "task_context_packet"));
    for (const scope of [f.project_id, "project:unrelated-active-work"]) {
      const copy = new Database(f.db.serialize());
      try {
        h.insertManagedRunV01({ ...f, db: copy }, { run_id: "fixture:active-after-320", scope, status: "running", created_at: at(321), metadata_json: "{}" });
        const before = copy.serialize();
        assert.equal(readProjectWorkRevisionEligibilityStrictV01(copy, f, { evaluated_at: at(322) }).eligible, scope !== f.project_id);
        if (scope === f.project_id) {
          const request = h.revisionRequestV01(f, current, ordinary ? "authored_successor_task" : "pre_execution_user_revision", { ...current.task, goal: "Cannot edit admitted work" });
          assert.throws(() => revisePreExecutionProjectWorkV01(copy, { config: f.config, credential, request, clock: { now: () => at(322) } }), /execution_started/);
        }
        assert(before.equals(copy.serialize()));
      } finally { copy.close(); }
    }
    const branch = new Database(f.db.serialize());
    try {
      const prior = JSON.parse(core(branch).find(r => r.record_id === lastRequest.expected_current_packet_id)!.payload_json) as TaskContextPacketV01;
      const request = { ...lastRequest, goal: "Conflicting second tip beyond the first four pages" };
      const built = ordinary ? buildOrdinarySuccessorRevisionV01(prior, anchor!, { request, revision_number: 320,
        session_id: credential.session_id, work_lifetime: DURABLE_AUTHORED_WORK_V01, origin_packet_id: origin.packet_id,
        origin_packet_fingerprint: origin.integrity.fingerprint, ...root! }, f.config.operator_id, at(321)) :
        buildPreExecutionProjectWorkRevisionPacketV01({ request, operator_id: f.config.operator_id, session_id: credential.session_id,
          revision_number: 320, definition: request, prior_packet: prior, origin_first_work_definition_ref: originRef!, generated_at: at(321) });
      insertVNextCoreRecordV01(branch, { ...f, record_kind: "task_context_packet", record_id: built.packet.packet_id,
        fingerprint: built.packet.integrity.fingerprint, idempotency_key: ordinary ? ordinarySuccessorRevisionIdempotencyKeyV01(built.packet) : (built as any).lineage.idempotency_key,
        payload: built.packet, created_at: built.packet.generated_at });
      assert.equal(readProjectWorkRevisionEligibilityV01(branch, f).eligible, false);
      assert.throws(() => readCurrentProjectWorkPacketLineageV01(branch, f.config), /branch|invalid|incomplete/);
    } finally { branch.close(); }
    const recovered = validateRecoveryCanonicalDatabaseV01(f.db); assert.equal(recovered.status, "valid", canonical(recovered));
    // Missing, malformed and foreign ancestors are negative corruption fixtures.
    for (const corruption of ["missing", "malformed", "foreign"] as const) {
      const copy = new Database(f.db.serialize());
      try {
        // Only the disposable negative copy bypasses immutability to represent
        // damaged/missing storage. The positive source keeps every trigger.
        for (const { name } of copy.prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND tbl_name='vnext_core_records'").all() as { name: string }[])
          copy.exec(`DROP TRIGGER "${name.replaceAll('"', '""')}"`);
        const row = core(copy).filter(r => r.record_kind === "task_context_packet")[257]!;
        if (corruption === "missing") copy.prepare("DELETE FROM vnext_core_records WHERE record_id=?").run(row.record_id);
        if (corruption === "malformed") copy.prepare("UPDATE vnext_core_records SET payload_json='{}' WHERE record_id=?").run(row.record_id);
        if (corruption === "foreign") copy.prepare("UPDATE vnext_core_records SET project_id='project:foreign' WHERE record_id=?").run(row.record_id);
        assert.equal(readProjectWorkRevisionEligibilityV01(copy, f).eligible, false);
        assert.notEqual(validateRecoveryCanonicalDatabaseV01(copy).status, "valid");
      } finally { copy.close(); }
    }
    const exported = exportActivePortableProjectV01(f.db, { include_personal_perspective: false, exported_at: at(323) });
    const parsed = parseAndValidatePortableProjectV01(exported.bytes); assert(parsed.records.length >= 321);
    const destination = new Database(":memory:"), base = path.join(h.ROOT, `cumulative-portable-${ordinary}`); mkdirSync(base);
    try {
      applyCanonicalDatabaseMigrations(destination);
      assert.equal(importPortableProjectV01(destination, { bytes: exported.bytes, destination_root_base: base, imported_at: at(324) }).status, "imported");
      assert.equal(readProjectWorkInitializationV01(destination, f).current_packet?.packet_id, current.packet_id);
      assert.equal(validateRecoveryCanonicalDatabaseV01(destination).status, "valid");
      assert.equal((destination.prepare("SELECT count(*) AS n FROM autonomy_runs").get() as { n: number }).n, 0);
      assert.throws(() => revisePreExecutionProjectWorkV01(destination, { config: f.config, credential, request: lastRequest, clock: { now: () => at(325) } }), /session|credential|bootstrap/);
    } finally { destination.close(); }
    const chain = measure(320);
    if (!ordinary) {
      assert.equal(recallRetainedWorkSources(chain, "absent").scanned_packets, 321);
      const { readCodexCurrentContinuityV01 } = await import("../lib/vnext/codex-current-continuity/codex-current-continuity");
      const { readCodexRepositoryRetainedSourcesV01 } = await import("../lib/vnext/codex-repository-continuity/codex-repository-retained-sources");
      const { parseRepositoryRetainedSourcesResponseV01 } = await import("../plugins/augnes-operator/mcp/companion-proxy.mjs");
      const dependencies = { now: () => at(326), read_operator_config: () => f.config, managed_start_available: () => false };
      const before = f.db.serialize();
      const resumed = await readCodexCurrentContinuityV01(f.db, { viewed_project_id: f.project_id }, dependencies);
      const lookup = await readCodexRepositoryRetainedSourcesV01(f.db, { repository_root: f.root, expected_snapshot_binding: resumed.snapshot.binding!, query: "absent" }, dependencies);
      assert.equal(lookup.status, "available"); assert.equal(lookup.lookup!.scanned_packets, 321);
      assert.deepEqual(parseRepositoryRetainedSourcesResponseV01(JSON.parse(JSON.stringify(lookup))), lookup);
      assert(before.equals(f.db.serialize()));
    }
    console.log(JSON.stringify({ cumulative_history: ordinary ? "successor" : "initial", revisions: 320, old_boundaries_crossed: [32, 128, 256], elapsed_ms: performance.now() - started,
      peak_rss_bytes: process.resourceUsage().maxRSS * 1024, exact_replay: true, atomic_stale_refusal: true, immutable_history: true, authority_unchanged: true, recovery_and_portable: "valid", portable_credentials: "refused" }));
  } finally { if (!successor) f.db.close(); }
}

/** Generic protocol packets exercise operation budgets only. They have no
 * authored-work compiler marker and are never claimed as historical work. */
export function cumulativeReadBudgets(h: any) {
  for (const dimension of ["records", "packet_bytes"] as const) {
    const f = h.createFixtureV01(`cumulative-budget-${dimension}`);
    try {
      const packet = (n: number) => buildTaskContextPacketV01({ ...f,
        generated_at: new Date(Date.parse("2026-08-01T00:00:00.000Z") + n * 1000).toISOString(),
        task: { goal: dimension === "records" ? `Budget fixture ${n}` : `Budget fixture ${n}: ${"x".repeat(100_000)}`, success_criteria: ["Validate bounded reads"], non_goals: ["No execution"] },
        selected_context: [], constraints: { required_checks: [], forbidden_actions: [], data_classification: "private" },
        gaps: ["current_projection", "selected_context"].map(field => ({ code: `missing_${field}`, summary: `No ${field} in this generic fixture`, severity: "low" as const, missing_fields: [field], source_refs: ["fixture:budget"], external_refs: [] })),
        return_contract: { return_kind: "bounded_result", required_fields: [], expected_artifacts: [], required_checks: [], return_ref: null, compatibility_only: false },
        source_status: { status: "complete", currentness: { status: "fresh", as_of: "2026-08-01T00:00:00.000Z", basis: "Disposable budget fixture", source_ref: null }, source_refs: ["fixture:budget"], external_refs: [], warnings: [] },
        compatibility: { source_contracts: ["fixture:generic-context"], legacy_scope_ref: null, source_refs: [], unmapped_fields: [], warnings: [] },
      });
      const put = (p: TaskContextPacketV01) => insertVNextCoreRecordV01(f.db, { ...f, record_kind: "task_context_packet", record_id: p.packet_id,
        fingerprint: p.integrity.fingerprint, idempotency_key: null, payload: p, created_at: p.generated_at });
      let count = 0, bytes = 0, next = packet(count);
      f.db.transaction(() => {
        while ((dimension === "records" ? count + 1 : bytes + Buffer.byteLength(JSON.stringify(next))) <= PROJECT_WORK_HISTORY_READ_BUDGET_V01[dimension]) {
          const validation = validateTaskContextPacketV01(next, { evaluated_at: next.generated_at });
          assert.equal(validation.status, "valid", canonical(validation));
          put(next); bytes += Buffer.byteLength(JSON.stringify(next)); next = packet(++count);
        }
      })();
      assert(count <= PROJECT_WORK_HISTORY_READ_BUDGET_V01.records && bytes <= PROJECT_WORK_HISTORY_READ_BUDGET_V01.packet_bytes);
      assert.equal(f.db.transaction(() => readProjectWorkPacketHistoryV01(f.db, f).length)(), count);
      assert.equal(hasAuthoredSuccessorOfPacketV01(f.db, f, "fixture:no-successor"), false);
      put(next);
      const before = f.db.serialize();
      assert.throws(() => hasAuthoredSuccessorOfPacketV01(f.db, f, "fixture:no-successor"), /history_read_budget_exceeded/);
      const eligibility = readProjectWorkRevisionEligibilityStrictV01(f.db, f);
      assert.equal(eligibility.status, "unavailable"); assert.equal(eligibility.reason, "source_unavailable");
      assert(before.equals(f.db.serialize()), "An incomplete scan cannot become successful absence");
      console.log(JSON.stringify({ cumulative_read_budget: dimension, complete_records: count, complete_bytes: bytes, exhausted: "refused" }));
    } finally { f.db.close(); }
  }
  assert.throws(() => hasAutonomyRunAdmissionForPreparation({ db: null as never, scope: "fixture:scope", workspace_id: "fixture:workspace",
    packet_ids: ["x".repeat(1024 * 1024)], prepared_at: "2026-08-01T00:00:00.000Z" }), /packet_read_budget_exceeded/);
}

async function cumulativeSurfaces(f: any, root: string, ordinary: boolean, at: string) {
  for (const mode of process.platform === "darwin" ? ["human", "agent"] : ["agent"]) {
    const directory = path.join(root, `durable-surface-cumulative-${ordinary}-${mode}`); mkdirSync(directory);
    const database_path = path.join(directory, "work.sqlite"); await f.db.backup(database_path);
    for (const stage of [mode, "readback"]) {
      const input = path.join(directory, `${stage}.json`);
      writeFileSync(input, JSON.stringify({ config: { ...f.config, database_path }, projectRoot: f.root, mode: stage, cumulative: true,
        at: new Date(Date.parse(at) + (stage === "readback" ? 4 * 24 * 3600_000 : 0)).toISOString() }));
      const owned = new Set();
      const child = registerOwnedChild(owned, spawn(process.execPath, ["--import", "tsx", "scripts/test-durable-work-surfaces.ts", input],
        { detached: true, stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, OPENAI_API_KEY: "" } }), { label: "cumulative-work-surface" });
      let output = "";
      for (const stream of [child.child.stdout, child.child.stderr]) stream?.on("data", (b: Buffer) => { output = (output + b.toString()).slice(-16000); });
      try { const result = await waitForOwnedProcessExit(child, 90_000); assert.equal(result.code, 0, output); console.log(output.trim()); }
      finally { await terminateOwnedProcessTree(child); assert.equal(owned.size, 0); }
    }
  }
}
