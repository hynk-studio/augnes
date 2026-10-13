// Developer-exposed deterministic integration, with real loopback requests and
// separate ordinary consumers. No native-model invocation or evaluator inputs.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import {
  createCanonicalTestResourceRoot,
  createCanonicalTestResourceDirectory,
  cleanupCanonicalTestResources,
} from "./canonical-test-environment.mjs";
import {
  trackServerConnections,
  closeTrackedServer,
} from "./test-harness-process-lifecycle.mjs";
import {
  runCanonicalChild,
  canonicalChildAcceptanceFailure,
} from "./canonical-child-runner.mjs";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import { createLocalProcessor } from "./external-response-counterpart.mjs";
import { ordinaryExperienceUse } from "./companion-experience-use.mjs";
import { handleMessageV01 } from "../plugins/augnes-operator/mcp/companion-proxy.mjs";
import { POST as resume } from "../app/api/augnes/read/codex-repository-continuity/route";
import { POST as writer } from "../app/api/augnes/repository-work-revision/route";
import { POST as sources } from "../app/api/augnes/read/codex-repository-work-sources/route";
import { POST as external } from "../app/api/augnes/external-response/route";
import {
  getOrCreateDefaultWorkspaceIdentityV01,
  getOrCreateCanonicalProjectForLocalRootV01,
  normalizeLocalProjectRootRefV01,
} from "../lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import {
  scopeKey,
  validateExternalStore,
} from "../lib/vnext/persistence/external-response-store.mjs";
import {
  EXTERNAL_VERSION,
  hashBytes,
  digest,
  canonical,
} from "../lib/vnext/external-response-rules.mjs";
import { assertPreparedDatabase } from "../lib/db/prepared-database.mjs";
import { structuralSchemaContractSignature } from "../lib/db/structural-schema-contract.mjs";
import {
  prepareRuntimeDatabase,
  restoreRuntimeDatabase,
  inspectRecoveryDatabaseFile,
} from "./runtime-database-bootstrap.mjs";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";
import { createRecoveryBackup } from "./recovery-backup.mjs";

const started = Date.now(),
  root = process.cwd(),
  resource = createCanonicalTestResourceRoot("ag-resource-test-", {
    shortSocketPaths: true,
  }),
  temporary = resource.root;
const exportDirectory = process.argv[2];
assert(
  !exportDirectory ||
    (path.isAbsolute(exportDirectory) && !existsSync(exportDirectory)),
);
const dbPath = path.join(temporary, "native.db"),
  savedEnv = { ...process.env },
  guard = installZeroNetworkGuard({ allowLoopback: true });
let db = new Database(dbPath);
const instance = "external-fixture",
  generation = "generation-1",
  repository = "d".repeat(64),
  token = randomBytes(32).toString("base64url"),
  secret = randomBytes(32).toString("base64url");
const processor = createLocalProcessor({ secret });
trackServerConnections(processor.server);
let origin = "",
  id = 0,
  processorRequests = 0,
  dropReturned = false,
  dropBeforeRequest = false,
  failSql: RegExp | null = null,
  dropRoute = false,
  failResponseCommit = false,
  wireTransform: ((v: any) => any) | null = null,
  heldReply: ((release: () => void) => void) | null = null;
const trace: any[] = [],
  children: any[] = [],
  phases: any[] = [],
  errors: string[] = [],
  originalFiles: { name: string; bytes: Buffer }[] = [];
const prepare = Database.prototype.prepare;
const routes: Record<string, (r: Request) => Promise<Response>> = {
  "/api/augnes/read/codex-repository-continuity": resume,
  "/api/augnes/read/codex-repository-work-sources": sources,
  "/api/augnes/repository-work-revision": writer,
  "/api/augnes/external-response": external,
};
const server = trackServerConnections(
  createServer(async (req, res) => {
    try {
      const url = new URL(req.url!, origin);
      if (["/healthz", "/api/healthz"].includes(url.pathname)) {
        res.setHeader("content-type", "application/json");
        res.end(
          JSON.stringify({
            ok: true,
            name: "augnes-console",
            service: "augnes-ui",
            status: "ready",
            mode: "http",
            live_core_status: "ready",
            recovery_mode: false,
            runtime_instance_id: instance,
            runtime_generation_id: generation,
            runtime_repository_fingerprint: repository,
          }),
        );
        return;
      }
      const handler = routes[url.pathname];
      if (!handler) {
        res.writeHead(404).end();
        return;
      }
      const chunks = [];
      for await (const c of req) chunks.push(Buffer.from(c));
      const body = Buffer.concat(chunks).toString();
      if (failSql || failResponseCommit)
        Database.prototype.prepare = function (
          this: Database.Database,
          sql: string,
        ) {
          if (failSql?.test(sql)) throw new Error("owned_storage_fault");
          const statement = prepare.call(this, sql);
          if (
            failResponseCommit &&
            sql.startsWith("INSERT INTO vnext_external_records")
          )
            return new Proxy(statement, {
              get(target, key) {
                if (key === "run")
                  return (...args: any[]) => {
                    if (args[3] === "response")
                      throw new Error("owned_before_response_commit_fault");
                    return Reflect.apply(target.run, target, args);
                  };
                return Reflect.get(target, key, target);
              },
            });
          return statement;
        } as typeof prepare;
      let response;
      try {
        response = await handler(
          new Request(url, {
            method: req.method,
            headers: req.headers as Record<string, string>,
            ...(body ? { body } : {}),
          }),
        );
      } finally {
        Database.prototype.prepare = prepare;
      }
      if (
        dropRoute &&
        url.pathname.endsWith("/external-response") &&
        JSON.parse(body).action === "publish" &&
        response.ok
      ) {
        dropRoute = false;
        res.destroy();
        return;
      }
      response.headers.forEach((v, k) => res.setHeader(k, v));
      res.writeHead(response.status).end(await response.text());
    } catch (e) {
      errors.push(String(e));
      res.writeHead(500).end("{}");
    }
  }),
);
processor.server.prependListener("request", (req, res) => {
  processorRequests++;
  if (dropBeforeRequest && req.method === "POST") {
    dropBeforeRequest = false;
    req.destroy();
    return;
  }
  const end = res.end.bind(res);
  res.end = ((body: any, ...args: any[]) => {
    let v;
    try {
      v = JSON.parse(body);
    } catch {}
    if (dropReturned && v?.status === "returned") {
      dropReturned = false;
      res.destroy();
      return res;
    }
    if (wireTransform && v) {
      body = JSON.stringify(wireTransform(v));
      wireTransform = null;
    }
    if (heldReply && v?.status === "returned") {
      const hold = heldReply;
      heldReply = null;
      hold(() => end(body, ...args));
      return res;
    }
    return end(body, ...args);
  }) as typeof res.end;
});
const call = async (name: string, args: object) => {
  const r: any = await handleMessageV01({
    jsonrpc: "2.0",
    id: ++id,
    method: "tools/call",
    params: { name, arguments: args },
  });
  assert(!r.error, JSON.stringify(r.error));
  return r.result.structuredContent;
};
const op = async (p: any, action: string, data?: object, basis?: string) => {
  const r = await call("augnes_external_repository_work", {
    repository_root: p.root,
    action,
    ...(data ? { data } : {}),
    ...(basis ? { expected_material_ref: basis } : {}),
  });
  trace.push({
    project: p.label,
    action,
    status: r.status,
    reason: r.reason ?? null,
    record: r.record ?? null,
  });
  return r;
};
const ok = (v: any) => {
  assert(
    ["available", "saved", "exact_replay"].includes(v.status),
    JSON.stringify(v),
  );
  return v;
};
const note = (source: string, text: string) => ({
  source,
  text,
  provenance: "imported_unverified",
  observed_at: new Date().toISOString(),
  label: "Next check",
});
const phase = (label: string) => {
  phases.push({ label, elapsed_ms: Date.now() - started });
  console.log(JSON.stringify(phases.at(-1)));
};
function databaseState(database = db) {
  return database
    .prepare(
      "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    )
    .all()
    .map((r: any) => [
      r.name,
      database.prepare(`SELECT * FROM "${r.name}" ORDER BY rowid`).all(),
    ]);
}
function snapshot(database = db) {
  return hashBytes(canonical(databaseState(database)));
}
async function preserves(
  p: any,
  action: string,
  data: object,
  reason: string,
  basis?: string,
) {
  const before = databaseState(),
    requestsBefore = processorRequests,
    effects = canonical(processor.snapshot());
  const value = await op(p, action, data, basis);
  assert.equal(value.reason, reason, JSON.stringify(value));
  assert.deepEqual(databaseState(), before);
  assert.equal(
    processorRequests,
    requestsBefore,
    "Refusal must cause no egress",
  );
  assert.equal(canonical(processor.snapshot()), effects);
  return value;
}
async function consumer(p: any, label: string) {
  const owner = createCanonicalTestResourceDirectory(
    path.join(temporary, label),
  );
  let out = "",
    err = "";
  const env = {
    PATH: process.env.PATH,
    HOME: owner.root,
    TMPDIR: owner.root,
    AUGNES_COMPANION_RUNTIME_MANIFEST:
      process.env.AUGNES_COMPANION_RUNTIME_MANIFEST,
    AUGNES_COMPANION_TEST_MODE: "1",
  };
  const result = await runCanonicalChild({
    suite: "external-response",
    label,
    command: process.execPath,
    args: [path.join(root, "scripts/external-response-report.mjs"), p.root],
    cwd: owner.root,
    env,
    timeoutMs: 20000,
    heartbeatMs: 0,
    resourceOwner: owner,
    log: () => {},
    stdout: {
      write(c: any) {
        out += c;
        return true;
      },
    } as typeof process.stdout,
    stderr: {
      write(c: any) {
        err += c;
        return true;
      },
    } as typeof process.stderr,
  });
  assert.equal(
    canonicalChildAcceptanceFailure(result, {
      suite: "external-response",
      timeoutMs: 20000,
      requireNaturalExit: true,
    }),
    null,
    err + " " + out,
  );
  const value = JSON.parse(out);
  assert.equal(
    value.runtime,
    process.version,
    "Verify the actual worker runtime, not only coordinator PATH.",
  );
  const files = value.output
    ? [
        {
          name: value.output,
          bytes: readFileSync(path.join(owner.root, value.output)),
        },
      ]
    : [];
  children.push({
    label,
    ...value,
    cleanup: result.cleanup_completed,
    remaining: result.remaining_owned_processes,
    files: files.map((f) => ({
      name: f.name,
      sha256: hashBytes(f.bytes),
      size: f.bytes.length,
      content: JSON.parse(f.bytes.toString()),
    })),
  });
  originalFiles.push(
    ...files.map((f) => ({ name: `${label}-${f.name}`, bytes: f.bytes })),
  );
  const cleaned = cleanupCanonicalTestResources([owner]);
  assert(cleaned.every((r: any) => r.completed));
  return value;
}
async function main() {
  db.pragma("foreign_keys = ON");
  applyCanonicalDatabaseMigrations(db);
  assertPreparedDatabase(db);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db),
    selection = readActiveProjectSelectionV01(db, workspace.workspace_id);
  const projects = [
    "A",
    "B",
    "control",
    "refusal",
    "partial",
    "private",
    "fault",
    "changed",
  ].map((label) => {
    const dir = path.join(temporary, label);
    mkdirSync(dir);
    const p = getOrCreateCanonicalProjectForLocalRootV01(db, {
      workspace_id: workspace.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(dir, {
        base_path: temporary,
      }),
      display_name: label,
    });
    return {
      label,
      root: dir,
      scope: {
        workspace_id: workspace.workspace_id,
        project_id: p.project.project_id,
      },
      api: ordinaryExperienceUse(call, dir),
    };
  });
  const [a, b, control, refusal, partial, privateProject, fault] = projects;
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${(server.address() as any).port}`;
  await new Promise<void>((resolve) =>
    processor.server.listen(0, "127.0.0.1", resolve),
  );
  const endpoint = `http://127.0.0.1:${(processor.server.address() as any).port}`;
  const manifest = {
    schema_version: 2,
    contract: "augnes-local-runtime-supervisor-v1",
    generation_version: 1,
    generation_id: generation,
    instance_id: instance,
    repository_fingerprint: repository,
    supervisor_pid: process.pid,
    lifecycle_state: "ready",
    database_state: "ready",
    effective_url: origin,
    ui_port: (server.address() as any).port,
    bridge_port: (server.address() as any).port,
    children: ["ui", "bridge"].map((role) => ({
      role,
      pid: process.pid,
      port: (server.address() as any).port,
      state: "ready",
    })),
  };
  writeFileSync(path.join(temporary, "runtime.json"), JSON.stringify(manifest));
  writeFileSync(
    path.join(temporary, "companion-access.json"),
    JSON.stringify({
      ...manifest,
      access_version: "augnes-companion-proxy-access.v0.1",
      proxy_token: token,
    }),
    { mode: 0o600 },
  );
  Object.assign(process.env, {
    AUGNES_DB_PATH: dbPath,
    AUGNES_RUNTIME_CHILD_ROLE: "ui",
    AUGNES_RUNTIME_INSTANCE_ID: instance,
    AUGNES_RUNTIME_GENERATION_ID: generation,
    AUGNES_RUNTIME_REPOSITORY_FINGERPRINT: repository,
    AUGNES_COMPANION_PROXY_TOKEN: token,
    AUGNES_COMPANION_RUNTIME_MANIFEST: path.join(temporary, "runtime.json"),
    AUGNES_COMPANION_TEST_MODE: "1",
  });
  delete process.env.AUGNES_RECOVERY_MODE;
  const inputA = readFileSync(
      path.join(root, "scripts/fixtures/experience-use/a.json"),
    ),
    inputB = readFileSync(
      path.join(root, "scripts/fixtures/experience-use/b.json"),
    ),
    jsonl = Buffer.from(
      JSON.parse(inputB.toString())
        .events.map((e: any) => JSON.stringify(e))
        .join("\n") + "\n",
    );
  const config: any = {
    version: EXTERNAL_VERSION,
    projects: projects.map((p) => ({
      repository_root: p.root,
      project_key: scopeKey(p.scope),
      share_to: p === a ? [scopeKey(b.scope)] : [],
    })),
    envelopes: [
      {
        id: "controlled-report-envelope",
        project_keys: projects.map((p) => scopeKey(p.scope)),
        endpoint,
        instance: processor.instance,
        secret,
        expires_at: new Date(Date.now() + 600000).toISOString(),
        max_calls: 64,
        max_amendments: 2,
        max_input_bytes: 1048576,
        timeout_ms: 1000,
        input_sha256: [inputA, inputB, jsonl].map(hashBytes),
      },
    ],
  };
  const configPath = path.join(temporary, "external-config.json"),
    configure = () =>
      writeFileSync(configPath, JSON.stringify(config), { mode: 0o600 });
  configure();
  process.env.AUGNES_EXTERNAL_CONFIG_FILE = configPath;
  for (const p of projects) {
    const population = p === a ? "success" : "all";
    await p.api.write("initial", await p.api.read(), {
      goal:
        p === a
          ? "Report successful build latency for the release dashboard"
          : "Report complete worker capacity consumed, including failed and retried attempts",
      success_criteria: ["Exact millisecond population and a traceable report"],
      non_goals: [
        "No model calls, public contact, semantic approval or makespan claims",
      ],
    });
    await p.api.write("revise", await p.api.read(), {
      sources: {
        add: [
          note(
            "note-ref:external-report-contract",
            JSON.stringify({
              population,
              input_name: "events.json",
              output: p === a ? "success-report.json" : "capacity-report.json",
            }),
          ),
        ],
      },
    });
    const read = ok(await op(p, "read")),
      body = p === a ? inputA : inputB;
    ok(
      await op(
        p,
        "put_material",
        {
          metadata: {
            name: "events.json",
            media_type: "application/json",
            version: "build-events.v1",
            source: "Synthetic build event observations",
            applicability: read.definition.goal,
            dependencies: [],
            sha256: hashBytes(body),
            size: body.length,
          },
          base64: body.toString("base64"),
        },
        read.material_basis,
      ),
    );
  }
  phase("ordinary_native_setup");
  const ar = await consumer(a, "consumer-a");
  assert.equal(ar.status, "completed");
  assert.equal(processor.snapshot().effects, 1);
  const av = ok(await op(a, "read", { work_ref: ar.work_ref })).work,
    aOutput = av.state.used.payload.output_ref;
  await a.api.write("revise", await a.api.read(), {
    sources: {
      add: [
        note(
          "note-ref:processor-observation",
          "Observed build processor accepted JSON build-events.v1 and returned a complete success-only result. Independent arithmetic was checked; failed events were outside A's dashboard population. Endpoint association with account/team is uncertain.",
        ),
      ],
    },
  });
  const ap = ok(await op(a, "read")),
    source = ap.sources.find(
      (s: any) => s.source_locator === "note-ref:processor-observation",
    );
  const publication = {
    key: "shared-observation",
    title: "build processor observed formats and scoped result",
    source_refs: [source.source_binding],
    conditions: JSON.stringify({
      schema: "build-events.v1",
      formats: [av.state.attempt.payload.terms.format],
      population: av.state.attempt.payload.terms.population,
    }),
    association: {
      endpoint: av.state.returned.payload.response.instance,
      account: "unresolved",
      operator: "possibly-report-team",
      confidence: "uncertain",
    },
    assessment:
      "Observed correctness for A under these conditions; B must check its own full population and current format.",
    materials: [aOutput],
    targets: [scopeKey(b.scope)],
  };
  const published = ok(await op(a, "publish", publication, ap.material_basis)),
    experience = published.record.ref;
  assert.equal(
    (await op(a, "publish", publication, ap.material_basis)).status,
    "exact_replay",
  );
  await preserves(
    a,
    "publish",
    { ...publication, title: "altered replay" },
    "external_replay_conflict",
    ap.material_basis,
  );
  await preserves(
    a,
    "publish",
    {
      ...publication,
      key: "wrong-share-target",
      targets: [scopeKey(privateProject.scope)],
    },
    "external_sharing_refused",
    ap.material_basis,
  );
  assert.deepEqual(
    ok(await op(privateProject, "discover", { query: "build processor" }))
      .experiences,
    [],
  );
  await preserves(
    privateProject,
    "read_experience",
    { ref: experience },
    "external_access_refused",
  );
  await preserves(
    privateProject,
    "material",
    { ref: aOutput },
    "external_access_refused",
  );
  await preserves(b, "material", { ref: aOutput }, "external_access_refused");
  assert.equal(
    ok(await op(b, "material", { ref: aOutput, experience_ref: experience }))
      .material.availability,
    "complete_read",
  );

  const peerPath = path.join(temporary, "wrong-workspace.db"),
    peer = new Database(peerPath);
  applyCanonicalDatabaseMigrations(peer);
  const peerWorkspace = getOrCreateDefaultWorkspaceIdentityV01(peer);
  getOrCreateCanonicalProjectForLocalRootV01(peer, {
    workspace_id: peerWorkspace.workspace_id,
    local_root: normalizeLocalProjectRootRefV01(b.root, {
      base_path: temporary,
    }),
    display_name: "B in an unrelated workspace",
  });
  const peerBefore = snapshot(peer);
  process.env.AUGNES_DB_PATH = peerPath;
  await preserves(
    b,
    "read_experience",
    { ref: experience },
    "external_access_refused",
  );
  assert.equal(snapshot(peer), peerBefore);
  process.env.AUGNES_DB_PATH = dbPath;
  peer.close();
  phase("selected_workspace_sharing_and_bytes");
  processor.setConditions({ formats: ["jsonl"] });
  dropReturned = true;
  const first = await consumer(b, "consumer-b-interrupted");
  assert.equal(first.status, "unresolved");
  assert.equal(processor.snapshot().effects, 2);
  const pending = ok(await op(b, "read", { work_ref: first.work_ref })).work;
  assert.equal(pending.state.amendments, 1);
  assert.equal(pending.state.unresolved, true);
  assert.equal(pending.state.used, null);
  await preserves(
    b,
    "act",
    {
      key: "unsafe-repeat",
      work_ref: first.work_ref,
      expected_head: pending.state.head,
      mode: "send",
    },
    "external_reconciliation_required",
  );
  const successor = await consumer(b, "consumer-b-fresh");
  assert.equal(successor.status, "completed");
  assert.notEqual(successor.process, first.process);
  assert.equal(
    processor.snapshot().effects,
    2,
    "reconciliation must not repeat processing",
  );
  const bReport = children.at(-1).files[0].content;
  assert.equal(bReport.total_worker_ms, 7500);
  assert.equal(bReport.failed_worker_ms, 3250);
  assert.deepEqual(bReport.failed_share, { numerator: 13, denominator: 30 });
  const bv = ok(await op(b, "read", { work_ref: successor.work_ref })).work;
  assert.equal(bv.events.filter((e: any) => e.kind === "attempt").length, 2);
  assert.equal(
    bv.events.filter((e: any) => e.kind === "sent" && e.payload.mode === "send")
      .length,
    2,
  );
  assert.equal(
    bv.events.filter(
      (e: any) => e.kind === "sent" && e.payload.mode === "reconcile",
    ).length,
    1,
  );
  assert.equal(
    bv.state.used.payload.attribution,
    "consumer_declared_use_with_material_dependency",
  );
  assert.deepEqual(bv.original.experience_refs, [experience]);
  assert(
    bv.original.expectation.includes(
      `Scoped observation ${experience} selected json`,
    ),
  );
  assert.equal(bv.original.terms.population, "all");
  const positiveService = processor.snapshot();
  for (const [p, view] of [
    [a, av],
    [b, bv],
  ] as const) {
    for (const [label, r] of [
      ["input", view.state.attempt.payload.input_ref],
      ["returned", view.state.returned.payload.material_ref],
      ["output", view.state.used.payload.output_ref],
    ]) {
      const m = ok(await op(p, "material", { ref: r })).material,
        body = Buffer.from(m.base64, "base64");
      assert.equal(hashBytes(body), m.metadata.sha256);
      assert.equal(body.length, m.metadata.size);
      originalFiles.push({
        name: `${p.label}-${label}-${m.metadata.name}`,
        bytes: body,
      });
      originalFiles.push({
        name: `${p.label}-${label}-manifest.json`,
        bytes: Buffer.from(
          JSON.stringify({ ref: m.ref, metadata: m.metadata }, null, 2) + "\n",
        ),
      });
    }
  }
  phase("feedback_amendment_lost_ack_fresh_acquisition_check_and_use");
  processor.setConditions({ formats: ["json"] });
  const unchanged = await consumer(control, "consumer-control");
  assert.equal(unchanged.status, "completed");
  const cv = ok(
    await op(control, "read", { work_ref: unchanged.work_ref }),
  ).work;
  assert.equal(cv.state.amendments, 0);
  assert.equal(cv.events.filter((e: any) => e.kind === "sent").length, 1);
  processor.setConditions({ accepting: false });
  assert.equal(
    (await consumer(refusal, "consumer-refusal")).status,
    "direct_fallback",
  );
  processor.setConditions({ accepting: true, maxRows: 3 });
  assert.equal(
    (await consumer(partial, "consumer-partial")).status,
    "direct_fallback",
  );
  processor.setConditions({ maxRows: 200 });
  phase("unchanged_action_refusal_partial_and_permitted_direct_fallback");
  const changed = projects.find((p) => p.label === "changed")!;
  dropReturned = true;
  const beforeChange = await consumer(changed, "consumer-before-basis-change");
  assert.equal(beforeChange.status, "unresolved");
  await changed.api.write("revise", await changed.api.read(), {
    goal: "Report capacity under a revised work basis; reconsider pending material first",
  });
  const effectsBeforeChangedSuccessor = processor.snapshot().effects;
  const changedSuccessor = await consumer(
    changed,
    "consumer-after-basis-change",
  );
  assert.equal(
    changedSuccessor.status,
    "reconsider_or_stop",
    "A successor must reconcile old unresolved work before preparing a new request.",
  );
  assert.equal(
    processor.snapshot().effects,
    effectsBeforeChangedSuccessor,
    "Changed basis cannot silently create another service effect.",
  );
  const changedView = ok(
    await op(changed, "read", { work_ref: beforeChange.work_ref }),
  ).work;
  assert.equal(changedView.state.unresolved, false);
  assert.equal(changedView.applicability, "basis_changed");
  assert.equal(changedView.state.used, null);
  assert.equal(ok(await op(changed, "read")).work_refs.length, 1);
  phase("changed_basis_successor_reconciles_before_any_new_request");

  const beforeCorrection = canonical(bv.events),
    beforeControl = canonical(cv),
    beforeBudget = db.prepare("SELECT * FROM vnext_external_envelopes").all();
  const unrelated = ok(
    await op(
      a,
      "publish",
      {
        ...publication,
        key: "unrelated-source",
        title: "Display layout preference",
        conditions: "alphabetical layout only",
        materials: [],
      },
      ap.material_basis,
    ),
  ).record.ref;
  ok(
    await op(
      a,
      "correct",
      {
        key: "unrelated-correction",
        target_ref: unrelated,
        topic: "display",
        statement: "Use descending display order for another report.",
        source_refs: [source.source_binding],
        targets: [scopeKey(b.scope)],
      },
      ap.material_basis,
    ),
  );
  const afterUnrelated = ok(
    await op(b, "read", { work_ref: successor.work_ref }),
  ).work;
  assert.equal(afterUnrelated.dependency_binding, bv.dependency_binding);
  assert.equal(canonical(afterUnrelated.events), beforeCorrection);
  const correction = ok(
    await op(
      a,
      "correct",
      {
        key: "identity-correction",
        target_ref: experience,
        topic: "identity",
        statement:
          "Operator association with report-team is unsupported; account remains unknown. The exact checked output bytes remain independent evidence.",
        source_refs: [source.source_binding],
        targets: [scopeKey(b.scope)],
      },
      ap.material_basis,
    ),
  );
  assert.deepEqual(
    ok(
      await op(b, "read_experience", { ref: correction.record.ref }),
    ).affected_work.map((w: any) => w.ref),
    [successor.work_ref],
  );
  const corrected = ok(
    await op(b, "read", { work_ref: successor.work_ref }),
  ).work;
  assert.equal(corrected.ready, false);
  assert.equal(
    corrected.dependencies[0].corrections[0].ref,
    correction.record.ref,
  );
  assert.equal(canonical(corrected.events), beforeCorrection);
  ok(
    await op(
      b,
      "reconsider",
      {
        key: "retain-independent-result",
        work_ref: successor.work_ref,
        expected_head: corrected.state.head,
        dependency_binding: corrected.dependency_binding,
        decision: "retain",
        reason:
          "The account association is uncertain. The independently checked request-bound bytes support this report without identifying an operator.",
      },
      (await op(b, "read")).material_basis,
    ),
  );
  assert.equal(
    ok(await op(b, "read", { work_ref: successor.work_ref })).work.ready,
    true,
  );
  assert.equal(
    canonical(
      ok(await op(control, "read", { work_ref: unchanged.work_ref })).work,
    ),
    beforeControl,
  );
  assert.deepEqual(
    db.prepare("SELECT * FROM vnext_external_envelopes").all(),
    beforeBudget,
  );
  ok(
    await op(
      a,
      "correct",
      {
        key: "withheld-correction",
        target_ref: experience,
        topic: "private-premise",
        statement: "Undisclosed source correction.",
        source_refs: [source.source_binding],
        targets: [],
      },
      ap.material_basis,
    ),
  );
  const limited = ok(
    await op(b, "read", { work_ref: successor.work_ref }),
  ).work;
  assert.equal(limited.dependencies[0].status, "unavailable");
  assert(!JSON.stringify(limited.dependencies).includes("Undisclosed"));
  await preserves(
    b,
    "reconsider",
    {
      key: "cannot-ignore-inaccessible",
      work_ref: successor.work_ref,
      expected_head: limited.state.head,
      dependency_binding: limited.dependency_binding,
      decision: "retain",
      reason: "Cannot claim nothing changed.",
    },
    "external_dependency_unavailable",
    (await op(b, "read")).material_basis,
  );
  ok(
    await op(a, "withdraw", { ref: experience, target_key: scopeKey(b.scope) }),
  );
  await preserves(
    b,
    "material",
    { ref: aOutput, experience_ref: experience },
    "external_access_refused",
  );
  assert.equal(
    ok(await op(b, "material", { ref: bv.state.used.payload.output_ref }))
      .material.availability,
    "complete_read",
  );
  phase("selective_correction_withdrawal_and_prior_attribution");
  // Additional streams use the same ordinary writer, transport and budget owner.
  const prepareWork = async (key: string, options: any = {}) => {
    const entry = ok(await op(fault, "read")),
      input = entry.materials.find(
        (m: any) => m.metadata.name === "events.json",
      );
    const prepared = ok(
      await op(
        fault,
        "prepare",
        {
          key,
          purpose: `Bounded regression ${key}`,
          experience_refs: [],
          envelope_id: options.envelope_id ?? config.envelopes[0].id,
          input_ref: input.ref,
          terms: {
            operation: "aggregate",
            format: "json",
            population: "all",
            deadline: config.envelopes[0].expires_at,
            max_rows: 200,
            ...options.terms,
          },
          expectation:
            "Complete checked material or explicit unresolved state.",
          reconsider_when: "Feedback, changed basis, permission or deadline.",
          owners: {
            receive: "test consumer",
            check: "independent fixture arithmetic",
            use: "report consumer",
          },
        },
        entry.material_basis,
      ),
    );
    return ok(await op(fault, "read", { work_ref: prepared.work_ref })).work;
  };
  const actWork = async (w: any, key: string, mode = "send") =>
    op(fault, "act", {
      key,
      work_ref: w.work_ref,
      expected_head: w.state.head,
      mode,
    });
  const reread = async (w: any) =>
    ok(await op(fault, "read", { work_ref: w.work_ref })).work;
  const compareRefusal = async (
    w: any,
    key: string,
    reason: string,
    mode = "send",
  ) =>
    preserves(
      fault,
      "act",
      { key, work_ref: w.work_ref, expected_head: w.state.head, mode },
      reason,
    );
  const isolated = await prepareWork("scope-refusal");
  await preserves(
    privateProject,
    "read",
    { work_ref: isolated.work_ref },
    "external_access_refused",
  );
  await preserves({ root: temporary }, "read", {}, "external_access_refused");
  await preserves(
    a,
    "publish",
    {
      ...publication,
      key: "undisclosed-source",
      source_refs: ["sha256:" + "f".repeat(64)],
    },
    "external_source_unavailable",
    ap.material_basis,
  );
  const oldConfig = JSON.stringify(config);
  config.projects = config.projects.filter(
    (p: any) => p.repository_root !== fault.root,
  );
  config.envelopes[0].project_keys = config.envelopes[0].project_keys.filter(
    (k: string) => k !== scopeKey(fault.scope),
  );
  configure();
  await compareRefusal(isolated, "removed-project", "external_access_refused");
  Object.assign(config, JSON.parse(oldConfig));
  configure();
  config.envelopes[0].instance = "a-similar-looking-new-instance";
  configure();
  await compareRefusal(
    isolated,
    "changed-instance",
    "external_permission_unavailable",
  );
  Object.assign(config, JSON.parse(oldConfig));
  configure();
  delete process.env.AUGNES_EXTERNAL_CONFIG_FILE;
  await compareRefusal(isolated, "secret-removed", "external_not_configured");
  process.env.AUGNES_EXTERNAL_CONFIG_FILE = configPath;
  // Every refused operation compares complete database and actual service state.
  const tiny = { ...config.envelopes[0], id: "one-call-only", max_calls: 1 };
  config.envelopes.push(tiny);
  configure();
  const exhausted = await prepareWork("bounded-budget", {
    envelope_id: tiny.id,
  });
  dropReturned = true;
  assert.equal(
    (await actWork(exhausted, "first-and-only")).status,
    "unavailable",
  );
  const exhaustedPending = await reread(exhausted);
  assert(exhaustedPending.state.unresolved);
  await compareRefusal(
    exhaustedPending,
    "no-query-budget",
    "external_budget_exhausted",
    "reconcile",
  );
  ok(
    await op(fault, "close", {
      key: "stop-with-obligation",
      work_ref: exhausted.work_ref,
      expected_head: exhaustedPending.state.head,
      reason:
        "Budget exhausted; unresolved external effect remains and no cancellation is inferred.",
    }),
  );
  assert.equal((await reread(exhausted)).state.unresolved, true);
  const amendment = await prepareWork("concurrent-amendment");
  processor.setConditions({ formats: ["jsonl"] });
  ok(await actWork(amendment, "format-probe"));
  const proposal = await reread(amendment),
    entry = ok(await op(fault, "read"));
  const converted = ok(
    await op(
      fault,
      "put_material",
      {
        metadata: {
          name: "converted.jsonl",
          media_type: "application/x-ndjson",
          version: "1",
          source: "explicit format conversion",
          applicability: entry.definition.goal,
          dependencies: [amendment.state.attempt.payload.input_ref],
          sha256: hashBytes(jsonl),
          size: jsonl.length,
        },
        base64: jsonl.toString("base64"),
      },
      entry.material_basis,
    ),
  ).material_ref;
  const amendData = {
    key: "amend-once",
    work_ref: proposal.work_ref,
    expected_head: proposal.state.head,
    proposal_ref: proposal.state.returned.ref,
    input_ref: converted,
    terms: { ...proposal.state.attempt.payload.terms, format: "jsonl" },
  };
  const racing = await Promise.all([
    op(fault, "amend", amendData, entry.material_basis),
    op(
      fault,
      "amend",
      { ...amendData, key: "competing-amendment" },
      entry.material_basis,
    ),
  ]);
  assert.equal(racing.filter((r) => r.status === "saved").length, 1);
  assert.equal(racing.filter((r) => r.status === "refused").length, 1);
  const winner = racing.find((r) => r.status === "saved").record;
  const winningData = { ...amendData, key: winner.operation_key };
  assert.equal(
    (await op(fault, "amend", winningData, entry.material_basis)).status,
    "exact_replay",
  );
  await preserves(
    fault,
    "amend",
    { ...winningData, input_ref: amendment.state.attempt.payload.input_ref },
    "external_replay_conflict",
    entry.material_basis,
  );
  let amended = await reread(amendment);
  processor.setConditions({ formats: ["json"] });
  ok(await actWork(amended, "second-proposal"));
  amended = await reread(amendment);
  ok(
    await op(
      fault,
      "amend",
      {
        key: "second-amendment",
        work_ref: amended.work_ref,
        expected_head: amended.state.head,
        proposal_ref: amended.state.returned.ref,
        input_ref: amendment.state.attempt.payload.input_ref,
        terms: { ...amended.state.attempt.payload.terms, format: "json" },
      },
      entry.material_basis,
    ),
  );
  amended = await reread(amendment);
  processor.setConditions({ formats: ["jsonl"] });
  ok(await actWork(amended, "third-proposal"));
  amended = await reread(amendment);
  await preserves(
    fault,
    "amend",
    {
      key: "beyond-amendment-bound",
      work_ref: amended.work_ref,
      expected_head: amended.state.head,
      proposal_ref: amended.state.returned.ref,
      input_ref: converted,
      terms: { ...amended.state.attempt.payload.terms, format: "jsonl" },
    },
    "external_amendment_outside_envelope",
    entry.material_basis,
  );
  processor.setConditions({ formats: ["json"] });
  // Real response with a damaged body fails integrity; receipt reconciliation
  // obtains the original bytes, rather than substituting any newer result.
  const absent = await prepareWork("receipt-absent");
  dropBeforeRequest = true;
  const effectsBeforeAbsent = processor.snapshot().effects;
  assert.equal(
    (await actWork(absent, "interrupted-before-effect")).status,
    "unavailable",
  );
  ok(await actWork(await reread(absent), "absence-query", "reconcile"));
  const confirmedAbsent = await reread(absent);
  assert.equal(
    confirmedAbsent.state.returned.payload.response.status,
    "absent",
  );
  assert.equal(processor.snapshot().effects, effectsBeforeAbsent);
  ok(await actWork(confirmedAbsent, "resend-after-confirmed-absence"));
  assert.equal(processor.snapshot().effects, effectsBeforeAbsent + 1);
  const corrupt = await prepareWork("corrupt-response");
  wireTransform = (v) =>
    v.status === "returned"
      ? { ...v, material: { ...v.material, base64: inputA.toString("base64") } }
      : v;
  assert.equal(
    (await actWork(corrupt, "damaged-return")).reason,
    "external_material_integrity_failed",
  );
  const corruptPending = await reread(corrupt);
  assert(corruptPending.state.unresolved);
  const beforeMaterial = db
    .prepare("SELECT * FROM vnext_external_materials ORDER BY ref")
    .all();
  failResponseCommit = true;
  assert.equal(
    (await actWork(corruptPending, "failed-commit-query", "reconcile"))
      .persistence,
    "sent_committed_response_unresolved",
  );
  failResponseCommit = false;
  assert.deepEqual(
    db.prepare("SELECT * FROM vnext_external_materials ORDER BY ref").all(),
    beforeMaterial,
    "no orphaned bytes after rollback",
  );
  const beforeReconcileEffects = processor.snapshot().effects;
  ok(await actWork(await reread(corrupt), "recover-response", "reconcile"));
  assert.equal(processor.snapshot().effects, beforeReconcileEffects);
  const committed = await reread(corrupt),
    resultRef = committed.state.returned.payload.material_ref;
  const savedMaterial = db
    .prepare("SELECT * FROM vnext_external_materials WHERE ref=?")
    .get(resultRef) as any;
  db.prepare("UPDATE vnext_external_materials SET body=? WHERE ref=?").run(
    Buffer.from("tampered"),
    resultRef,
  );
  await preserves(
    fault,
    "material",
    { ref: resultRef },
    "external_material_integrity_failed",
  );
  db.prepare("UPDATE vnext_external_materials SET body=? WHERE ref=?").run(
    savedMaterial.body,
    resultRef,
  );
  db.prepare("DELETE FROM vnext_external_materials WHERE ref=?").run(resultRef);
  await preserves(
    fault,
    "material",
    { ref: resultRef },
    "external_material_known_absent",
  );
  db.prepare("INSERT INTO vnext_external_materials VALUES(?,?,?,?,?)").run(
    savedMaterial.ref,
    savedMaterial.workspace_id,
    savedMaterial.project_id,
    savedMaterial.metadata_json,
    savedMaterial.body,
  );
  // Query can itself be unavailable. A stopped stream retains the obligation;
  // fresh service incarnation data cannot turn it into confirmed absence.
  const unknown = await prepareWork("unknown-effect");
  dropReturned = true;
  assert.equal((await actWork(unknown, "lost-ack")).status, "unavailable");
  wireTransform = (v) => ({
    ...v,
    instance: "different-receipt-owner",
    status: "absent",
    accepted_terms: undefined,
    material: undefined,
  });
  assert.equal(
    (await actWork(await reread(unknown), "wrong-incarnation", "reconcile"))
      .reason,
    "external_response_binding_mismatch",
  );
  assert((await reread(unknown)).state.unresolved);
  // Actual concurrent result and local closure: failed CAS rolls back bytes.
  const concurrent = await prepareWork("concurrent-result");
  let release!: () => void, heldResolve!: () => void;
  const held = new Promise<void>((r) => (heldResolve = r));
  heldReply = (r) => {
    release = r;
    heldResolve();
  };
  const inFlight = actWork(concurrent, "in-flight");
  await held;
  const inFlightView = await reread(concurrent),
    materialsBefore = db
      .prepare("SELECT * FROM vnext_external_materials ORDER BY ref")
      .all();
  ok(
    await op(fault, "close", {
      key: "close-while-in-flight",
      work_ref: concurrent.work_ref,
      expected_head: inFlightView.state.head,
      reason: "Stop further processing while preserving reconciliation.",
    }),
  );
  release();
  assert.equal((await inFlight).reason, "external_head_changed");
  assert.deepEqual(
    db.prepare("SELECT * FROM vnext_external_materials ORDER BY ref").all(),
    materialsBefore,
  );
  ok(await actWork(await reread(concurrent), "query-after-close", "reconcile"));
  assert.equal((await reread(concurrent)).state.closed, true);
  assert.equal(
    (await reread(concurrent)).next_action,
    "closed_retaining_obligations",
  );
  assert.equal((await reread(concurrent)).state.unresolved, false);
  // Late return keeps exact identity and requires an attributable current review.
  const late = await prepareWork("late-material", {
    terms: { deadline: new Date(Date.now() + 700).toISOString() },
  });
  let releaseLate!: () => void, lateResolve!: () => void;
  const lateHeld = new Promise<void>((r) => (lateResolve = r));
  heldReply = (r) => {
    releaseLate = r;
    lateResolve();
  };
  const lateFlight = actWork(late, "late-send");
  await lateHeld;
  await new Promise((r) => setTimeout(r, 750));
  releaseLate();
  ok(await lateFlight);
  const lateView = await reread(late);
  assert.equal(lateView.applicability, "late_result_review_required");
  assert.equal(lateView.ready, false);
  ok(
    await op(
      fault,
      "reconsider",
      {
        key: "late-review",
        work_ref: late.work_ref,
        expected_head: lateView.state.head,
        dependency_binding: lateView.dependency_binding,
        decision: "retain",
        reason:
          "Exact prior request bytes remain applicable to this unchanged arithmetic report despite delayed delivery.",
      },
      entry.material_basis,
    ),
  );
  assert.equal((await reread(late)).ready, true);
  const stopView = await reread(late);
  ok(
    await op(
      fault,
      "reconsider",
      {
        key: "deliberate-stop",
        work_ref: late.work_ref,
        expected_head: stopView.state.head,
        dependency_binding: stopView.dependency_binding,
        decision: "stop",
        reason: "No additional work authorized in this stream.",
      },
      entry.material_basis,
    ),
  );
  assert.equal((await reread(late)).ready, false);
  phase("scope_replays_concurrency_budgets_tampering_late_and_unknown_effects");

  // Complete logical and counterpart-state comparisons after refusals.
  const fr = ok(await op(fault, "read")),
    inputRef = fr.materials.find(
      (m: any) => m.metadata.name === "events.json",
    ).ref;
  await preserves(
    fault,
    "put_material",
    {
      metadata: {
        ...fr.materials.find((m: any) => m.metadata.name === "events.json")
          .metadata,
        sha256: "sha256:" + "0".repeat(64),
      },
      base64: inputB.toString("base64"),
    },
    "external_material_integrity_failed",
    fr.material_basis,
  );
  await preserves(
    fault,
    "put_material",
    {
      metadata: fr.materials.find((m: any) => m.metadata.name === "events.json")
        .metadata,
      base64: inputB.subarray(0, -1).toString("base64"),
    },
    "external_material_integrity_failed",
    fr.material_basis,
  );
  await preserves(
    fault,
    "put_material",
    {
      metadata: fr.materials.find((m: any) => m.metadata.name === "events.json")
        .metadata,
      base64: inputB.toString("base64"),
    },
    "external_work_basis_changed",
    "sha256:" + "0".repeat(64),
  );
  const beforeFault = snapshot();
  failSql = /INSERT INTO vnext_external_materials/;
  const failed = await op(
    fault,
    "put_material",
    {
      metadata: {
        ...fr.materials.find((m: any) => m.metadata.name === "events.json")
          .metadata,
        name: "new-name.json",
      },
      base64: inputB.toString("base64"),
    },
    fr.material_basis,
  );
  failSql = null;
  assert.equal(failed.status, "unavailable");
  assert.equal(snapshot(), beforeFault);
  dropRoute = true;
  const lost = await op(
    a,
    "publish",
    { ...publication, key: "lost-publication" },
    ap.material_basis,
  );
  assert.equal(lost.status, "unavailable");
  assert.equal(
    ok(
      await op(
        a,
        "publish",
        { ...publication, key: "lost-publication" },
        ap.material_basis,
      ),
    ).status,
    "exact_replay",
  );
  const timed = await prepareWork("actual-timeout");
  let timeoutRelease!: () => void, timeoutResolve!: () => void;
  const timeoutHeld = new Promise<void>((r) => (timeoutResolve = r));
  heldReply = (r) => {
    timeoutRelease = r;
    timeoutResolve();
  };
  const timedCall = actWork(timed, "timeout-send");
  await timeoutHeld;
  assert.equal((await timedCall).reason, "external_effect_unresolved");
  timeoutRelease();
  const timedView = await reread(timed);
  assert(timedView.state.unresolved);
  await compareRefusal(
    timedView,
    "unsafe-timeout-repeat",
    "external_reconciliation_required",
  );
  const staleWork = await prepareWork("changed-native-basis");
  await fault.api.write("revise", await fault.api.read(), {
    goal: "A changed report purpose requires explicit current applicability review",
  });
  await compareRefusal(
    staleWork,
    "stale-request",
    "external_reconsideration_required",
  );
  validateExternalStore(db);
  phase("storage_failure_atomicity_exact_and_conflicting_replay");

  // An ordinary dependency writer must admit the same record kind as recovery.
  // Keep corrections readable without treating them as their target's grant.
  const admissionEntry = ok(await op(b, "read"));
  const admissionExperience = ok(
    await op(
      a,
      "publish",
      {
        ...publication,
        key: "admission-experience",
        title: "Admission observation",
      },
      ap.material_basis,
    ),
  ).record.ref;
  const admissionCorrection = ok(
    await op(
      a,
      "correct",
      {
        key: "admission-correction",
        target_ref: admissionExperience,
        topic: "identity",
        statement:
          "Association remains uncertain; independently checked arithmetic is usable.",
        source_refs: [source.source_binding],
        targets: [scopeKey(b.scope)],
      },
      ap.material_basis,
    ),
  ).record.ref;
  const ownExperience = ok(
    await op(
      b,
      "publish",
      {
        ...publication,
        key: "own-admission-experience",
        title: "B's own observations",
        source_refs: [admissionEntry.sources[0].source_binding],
        materials: [],
        targets: [],
      },
      admissionEntry.material_basis,
    ),
  ).record.ref;
  const withheldExperience = ok(
    await op(
      a,
      "publish",
      {
        ...publication,
        key: "withheld-admission-experience",
        targets: [],
      },
      ap.material_basis,
    ),
  ).record.ref;
  const withheldCorrection = ok(
    await op(
      a,
      "correct",
      {
        key: "withheld-admission-correction",
        target_ref: withheldExperience,
        topic: "identity",
        statement: "Private association correction",
        source_refs: [source.source_binding],
        targets: [],
      },
      ap.material_basis,
    ),
  ).record.ref;
  const readablePrivateTargetCorrection = ok(
    await op(
      a,
      "correct",
      {
        key: "readable-private-target-correction",
        target_ref: withheldExperience,
        topic: "identity",
        statement: "Disclosure does not share the target",
        source_refs: [source.source_binding],
        targets: [scopeKey(b.scope)],
      },
      ap.material_basis,
    ),
  ).record.ref;
  const admissionEnvelope = {
    ...config.envelopes[0],
    id: "admission-unused-envelope",
  };
  config.envelopes.push(admissionEnvelope);
  configure();
  const admissionRequest = {
    key: "admission-reusable-key",
    purpose: "B's corrected dependency preparation",
    experience_refs: [admissionCorrection],
    envelope_id: admissionEnvelope.id,
    input_ref: admissionEntry.materials.find(
      (m: any) => m.metadata.name === "events.json",
    ).ref,
    terms: {
      operation: "aggregate",
      format: "json",
      population: "all",
      deadline: admissionEnvelope.expires_at,
      max_rows: 200,
    },
    expectation: "Complete scoped arithmetic",
    reconsider_when: "Changed support or feedback",
    owners: { receive: "B", check: "B arithmetic", use: "B report" },
  };
  const refusedDependencies = [
    { refs: [admissionCorrection], reason: "external_invalid_input" },
    {
      refs: [admissionExperience, admissionCorrection],
      reason: "external_invalid_input",
    },
    {
      refs: [ownExperience, admissionExperience, admissionCorrection],
      reason: "external_invalid_input",
    },
    {
      refs: [readablePrivateTargetCorrection],
      reason: "external_invalid_input",
    },
    { refs: ["sha256:" + "0".repeat(64)], reason: "external_access_refused" },
    { refs: [withheldExperience], reason: "external_access_refused" },
    { refs: [withheldCorrection], reason: "external_access_refused" },
    { refs: [experience], reason: "external_access_refused" }, // withdrawn earlier
    {
      refs: [ownExperience, withheldCorrection],
      reason: "external_access_refused",
    },
    {
      refs: [admissionExperience, admissionExperience],
      reason: "external_invalid_input",
    },
  ];
  assert.equal(
    db
      .prepare("SELECT 1 FROM vnext_external_envelopes WHERE envelope_id=?")
      .get(admissionEnvelope.id),
    undefined,
  );
  for (const c of refusedDependencies) {
    await preserves(
      b,
      "prepare",
      { ...admissionRequest, experience_refs: c.refs },
      c.reason,
      admissionEntry.material_basis,
    );
    assert.equal(
      db
        .prepare("SELECT 1 FROM vnext_external_envelopes WHERE envelope_id=?")
        .get(admissionEnvelope.id),
      undefined,
    );
    validateExternalStore(db);
    assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid");
  }
  ok(await op(b, "read_experience", { ref: readablePrivateTargetCorrection }));
  await preserves(
    b,
    "read_experience",
    { ref: withheldExperience },
    "external_access_refused",
  );

  // A real other-workspace writer produces these refs; no malformed SQL writes.
  const otherDb = new Database(peerPath),
    originalProjects = config.projects,
    originalEnvelopes = config.envelopes;
  const otherProject = otherDb
    .prepare("SELECT project_id FROM vnext_project_identities")
    .get() as any;
  const otherScope = {
    workspace_id: peerWorkspace.workspace_id,
    project_id: otherProject.project_id,
  };
  config.projects = [
    {
      repository_root: b.root,
      project_key: scopeKey(otherScope),
      share_to: [],
    },
  ];
  config.envelopes = [
    { ...admissionEnvelope, project_keys: [scopeKey(otherScope)] },
  ];
  configure();
  process.env.AUGNES_DB_PATH = peerPath;
  let otherExperience, otherCorrection;
  try {
    await b.api.write("initial", await b.api.read(), {
      goal: "Other workspace's report",
      success_criteria: ["Scoped report"],
      non_goals: ["No external effects"],
    });
    await b.api.write("revise", await b.api.read(), {
      sources: {
        add: [note("note-ref:other-workspace", "Other workspace observation")],
      },
    });
    const otherEntry = ok(await op(b, "read"));
    otherExperience = ok(
      await op(
        b,
        "publish",
        {
          ...publication,
          key: "other-workspace",
          source_refs: [otherEntry.sources[0].source_binding],
          materials: [],
          targets: [],
        },
        otherEntry.material_basis,
      ),
    ).record.ref;
    otherCorrection = ok(
      await op(
        b,
        "correct",
        {
          key: "other-correction",
          target_ref: otherExperience,
          topic: "identity",
          statement: "Other workspace correction",
          source_refs: [otherEntry.sources[0].source_binding],
          targets: [],
        },
        otherEntry.material_basis,
      ),
    ).record.ref;
    validateExternalStore(otherDb);
  } finally {
    process.env.AUGNES_DB_PATH = dbPath;
    config.projects = originalProjects;
    config.envelopes = originalEnvelopes;
    configure();
    otherDb.close();
  }
  for (const r of [otherExperience, otherCorrection])
    await preserves(
      b,
      "prepare",
      { ...admissionRequest, experience_refs: [r] },
      "external_access_refused",
      admissionEntry.material_basis,
    );

  const validAdmission = {
    ...admissionRequest,
    experience_refs: [ownExperience, admissionExperience],
  };
  const admission = ok(
    await op(b, "prepare", validAdmission, admissionEntry.material_basis),
  );
  assert.equal(
    admission.status,
    "saved",
    "Refused key and envelope were not consumed",
  );
  const admissionState = databaseState();
  assert.equal(
    (await op(b, "prepare", validAdmission, admissionEntry.material_basis))
      .status,
    "exact_replay",
  );
  assert.deepEqual(databaseState(), admissionState);
  await preserves(
    b,
    "prepare",
    { ...validAdmission, purpose: "Conflicting replay" },
    "external_replay_conflict",
    admissionEntry.material_basis,
  );
  ok(
    await op(
      b,
      "prepare",
      { ...validAdmission, key: "empty-experience-list", experience_refs: [] },
      admissionEntry.material_basis,
    ),
  );
  let admissionView = ok(
    await op(b, "read", { work_ref: admission.work_ref }),
  ).work;
  assert.equal(
    admissionView.dependencies[1].corrections[0].ref,
    admissionCorrection,
  );
  assert(
    ok(
      await op(b, "read_experience", { ref: admissionCorrection }),
    ).affected_work.some((w: any) => w.ref === admission.work_ref),
  );
  ok(
    await op(
      b,
      "reconsider",
      {
        key: "admission-reconsider",
        work_ref: admission.work_ref,
        expected_head: admissionView.state.head,
        dependency_binding: admissionView.dependency_binding,
        decision: "retain",
        reason:
          "Independent scoped arithmetic does not require the uncertain operator association.",
      },
      admissionEntry.material_basis,
    ),
  );
  admissionView = ok(
    await op(b, "read", { work_ref: admission.work_ref }),
  ).work;
  assert.equal(admissionView.ready, true);
  const fresh = new Database(dbPath, { readonly: true, fileMustExist: true });
  try {
    validateExternalStore(fresh);
    assert.equal(validateRecoveryCanonicalDatabaseV01(fresh).status, "valid");
  } finally {
    fresh.close();
  }
  // Historical validation is offline and must not consult today's private config.
  delete process.env.AUGNES_EXTERNAL_CONFIG_FILE;
  try {
    validateExternalStore(db);
    assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid");
  } finally {
    process.env.AUGNES_EXTERNAL_CONFIG_FILE = configPath;
  }
  phase(
    "experience_kind_admission_atomic_privacy_replay_and_fresh_recovery_parity",
  );
  // Unsupported readers refuse an additive new schema; the old nonempty store
  // remains byte-preserved until the explicit staged lifecycle prepares it.
  await db.backup(path.join(temporary, "migration-source.db"));
  let older = new Database(path.join(temporary, "migration-source.db"));
  older.exec(
    "DROP TABLE vnext_external_shares;DROP TABLE vnext_external_records;DROP TABLE vnext_external_materials;DROP TABLE vnext_external_envelopes;",
  );
  assert.equal(
    structuralSchemaContractSignature(older),
    "8bf85c585123abac3554f945496fc0e702d326f2cd23709938ed310e7cee840a",
  );
  assert.throws(
    () => assertPreparedDatabase(older),
    (e: any) => e.code === "database_unprepared",
  );
  const prior = older
    .prepare("SELECT * FROM vnext_core_records ORDER BY record_id")
    .all();
  const oldState = snapshot(older);
  older.close();
  await assert.rejects(
    prepareRuntimeDatabase({
      databasePath: path.join(temporary, "migration-source.db"),
      backupDirectory: path.join(temporary, "migration-backups"),
      repositoryRoot: root,
      instanceId: instance,
      repositoryFingerprint: repository,
      databaseOverrideActive: true,
      dependencies: {
        beforeReplacement() {
          throw new Error("owned_prepublication_fault");
        },
      },
    } as any),
    (e: any) => e.code === "database_bootstrap_failed",
  );
  older = new Database(path.join(temporary, "migration-source.db"));
  assert.equal(snapshot(older), oldState);
  assert.equal(
    structuralSchemaContractSignature(older),
    "8bf85c585123abac3554f945496fc0e702d326f2cd23709938ed310e7cee840a",
  );
  applyCanonicalDatabaseMigrations(older);
  assertPreparedDatabase(older);
  assert.deepEqual(
    older.prepare("SELECT * FROM vnext_core_records ORDER BY record_id").all(),
    prior,
  );
  older.close();
  // Full recovery owns preparation/publication and suspends all restored effects.
  const retained = db
    .prepare("SELECT * FROM vnext_external_records ORDER BY ref")
    .all();
  db.close();
  const lifecycle = {
    databasePath: dbPath,
    backupDirectory: path.join(temporary, "backups"),
    repositoryRoot: root,
    instanceId: instance,
    repositoryFingerprint: repository,
    databaseOverrideActive: true,
  };
  const backup = await createRecoveryBackup({
    databasePath: dbPath,
    backupDirectory: lifecycle.backupDirectory,
    applicationScopeFingerprint: repository,
    sourceApplication: {
      application_version: null,
      build_identity: null,
      package_contract: null,
      package_contract_version: null,
      runtime_contract: null,
      runtime_schema_version: null,
    },
    reason: "manual_recovery",
    inspectDatabase: inspectRecoveryDatabaseFile,
  } as any);
  await restoreRuntimeDatabase({
    ...lifecycle,
    selectedBackupId: backup.manifest.backup_id,
  } as any);
  await prepareRuntimeDatabase(lifecycle as any);
  db = new Database(dbPath);
  assert.deepEqual(
    db.prepare("SELECT * FROM vnext_external_records ORDER BY ref").all(),
    retained,
  );
  assert(
    db
      .prepare("SELECT suspended FROM vnext_external_envelopes")
      .all()
      .every((r: any) => r.suspended === 1),
  );
  validateExternalStore(db);
  assert.deepEqual(
    readActiveProjectSelectionV01(db, workspace.workspace_id),
    selection,
  );
  const restoredAdmission = ok(
    await op(b, "read", { work_ref: admission.work_ref }),
  ).work;
  assert.deepEqual(restoredAdmission.events, admissionView.events);
  assert.equal(
    restoredAdmission.dependencies[1].corrections[0].ref,
    admissionCorrection,
  );
  assert.equal(validateRecoveryCanonicalDatabaseV01(db).status, "valid");
  const restoredUnknown = await reread(unknown);
  assert(restoredUnknown.state.unresolved);
  await compareRefusal(
    restoredUnknown,
    "no-restored-grant",
    "external_recovery_suspended",
    "reconcile",
  );
  assert.deepEqual(errors, []);
  assert.equal(guard.attempts.length, 0);
  phase("nonempty_older_store_recovery_and_suspension");
  if (exportDirectory) {
    mkdirSync(exportDirectory, { mode: 0o700 });
    for (const file of originalFiles)
      writeFileSync(path.join(exportDirectory, file.name), file.bytes);
    writeFileSync(
      path.join(exportDirectory, "integration.json"),
      JSON.stringify(
        {
          version: EXTERNAL_VERSION,
          phases,
          children,
          trace,
          original_journal_rows: retained,
          positive_service_receipts: positiveService,
          final_service_receipts: processor.snapshot(),
          source_mechanism: "PASS",
          counterpart: "owned_deterministic_service",
          fresh_process: "PASS",
          actual_human_model_consumption: "NOT_RUN",
          intervention_effect: "NOT_EVALUATED",
          comparative_usefulness: "NOT_EVALUATED",
          installed_hosted_adoption: "NOT_RUN",
        },
        null,
        2,
      ) + "\n",
    );
  }
}
async function run() {
  try {
    await main();
    console.log(
      JSON.stringify({
        test: "external-response",
        status: "PASS",
        duration_ms: Date.now() - started,
        phases: phases.map((p) => p.label),
      }),
    );
  } finally {
    Database.prototype.prepare = prepare;
    await closeTrackedServer(server);
    await closeTrackedServer(processor.server);
    if (db.open) db.close();
    guard.restore();
    for (const k of Object.keys(process.env))
      if (!(k in savedEnv)) delete process.env[k];
    Object.assign(process.env, savedEnv);
    const cleanup = cleanupCanonicalTestResources([resource]);
    assert(
      cleanup.every((r: any) => r.completed),
      JSON.stringify(cleanup),
    );
  }
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
