import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { reviseCodexRepositoryWorkV01 } from "../lib/vnext/codex-repository-continuity/codex-repository-work-revision";
import { authenticateVNextLocalOperatorSessionV01, consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01 } from "../lib/vnext/runtime/local-operator-session";
import { runConnectionRoundtripChild } from "./companion-connection-roundtrip.mjs";

/** Extends the disposable HTTP fixture. Only elapsed time, discovery and channel
 * rotation are simulated; route/writer/readback and SQLite errors are real.
 * This is not an OS sleep, filesystem-full, or production-session experiment. */
export async function assertCompanionDisruptionRecovery(input: {
  db: Database.Database;
  databasePath: string;
  root: string;
  runtimeRoot: string;
  scope: { workspace_id: string; project_id: string };
  identity: { instance_id: string; generation_id: string; repository_fingerprint: string };
  call: (name: string, args: Record<string, unknown>) => Promise<any>;
  saveCount: () => number;
  loseNextSaveResponse: () => void;
}) {
  const { db, databasePath, root, runtimeRoot, scope, identity, call } = input;
  const resume = () => call("augnes_resume_repository", { repositoryRoot: root });
  const initial = await resume();
  const draft = { repositoryRoot: root, expectedSnapshotBinding: initial.continuity.snapshot.binding,
    changes: { goal: "Retain this pending draft across a disconnected client — 한글 🧭" } };
  const draftBytes = JSON.stringify(draft);
  const preview = await call("augnes_preview_repository_work_revision", draft);
  assert.equal(preview.status, "previewed");

  // A 24-hour elapsed-time boundary is supplied to the existing clock owner;
  // neither the host clock nor any production credential is changed.
  const config = { enabled: true as const, ...scope, operator_id: "operator:disruption-fixture", database_path: databasePath };
  let now = new Date().toISOString();
  const clock = { now: () => now };
  const issue = issueVNextLocalOperatorBootstrapV01(db, { config, clock });
  const admission = consumeVNextLocalOperatorBootstrapV01(db, { config, clock, bootstrap_token: issue.bootstrap_token });
  authenticateVNextLocalOperatorSessionV01(db, { config, clock, credential: admission.credential });
  const beforeExpiry = db.serialize();
  now = new Date(Date.parse(now) + 24 * 60 * 60 * 1_000).toISOString();
  assert.throws(() => authenticateVNextLocalOperatorSessionV01(db, { config, clock, credential: admission.credential }),
    /operator_session_expired/);
  assert.deepEqual(db.serialize(), beforeExpiry, "expired Browser access does not mutate saved work");
  assert.equal((await resume()).continuity.current_work.goal, initial.continuity.current_work.goal,
    "Companion reads do not depend on the expired Browser credential");
  assert.equal(JSON.stringify(draft), draftBytes, "the caller retains its proposed text");
  const renewedIssue = issueVNextLocalOperatorBootstrapV01(db, { config, clock });
  const renewed = consumeVNextLocalOperatorBootstrapV01(db, { config, clock, bootstrap_token: renewedIssue.bootstrap_token });
  authenticateVNextLocalOperatorSessionV01(db, { config, clock, credential: renewed.credential });
  assert.throws(() => authenticateVNextLocalOperatorSessionV01(db, { config, clock, credential: admission.credential }),
    /operator_session_expired/, "new access must not revive the expired credential");

  // Rotate only synthetic server discovery/channel state. An old preview is
  // not permission to save against a new generation, even after fresh discovery.
  identity.generation_id = "envelope-generation-after-disruption";
  const key = "disposable-channel-after-disruption";
  process.env.AUGNES_RUNTIME_GENERATION_ID = identity.generation_id;
  process.env.AUGNES_COMPANION_PROXY_TOKEN = key;
  for (const name of ["runtime.json", "companion-access.json"]) {
    const file = path.join(runtimeRoot, name);
    const value = JSON.parse(readFileSync(file, "utf8"));
    writeFileSync(file, JSON.stringify({ ...value, ...identity, ...(name === "companion-access.json" ? { proxy_token: key } : {}) }));
  }
  const oldSave = { ...draft, previewBinding: preview.preview_binding };
  const beforeStaleSave = db.serialize(), staleCount = input.saveCount();
  const stale = await call("augnes_save_repository_work_revision", oldSave);
  assert.equal(stale.status, "refused"); assert.equal(stale.reason, "preview_changed");
  assert.equal(input.saveCount(), staleCount + 1, "stale preview gets one dispatch and no retry");
  assert.deepEqual(db.serialize(), beforeStaleSave);
  const reconnected = await runConnectionRoundtripChild("read", root, runtimeRoot);
  assert.equal(reconnected.continuity.current_work.goal, initial.continuity.current_work.goal);
  assert.equal(reconnected.continuity.snapshot.binding, initial.continuity.snapshot.binding);
  const freshDraft = { ...draft, expectedSnapshotBinding: reconnected.continuity.snapshot.binding };
  const freshPreview = await call("augnes_preview_repository_work_revision", freshDraft);
  assert.equal(freshPreview.status, "previewed");
  assert.notEqual(freshPreview.preview_binding, preview.preview_binding);

  // Actual SQLite storage refusals at the production writer. max_page_count
  // bounds only this disposable connection; it never fills the host volume.
  const channel = { key, ...identity };
  const wire = { action: "save", repository_root: root, expected_snapshot_binding: freshDraft.expectedSnapshotBinding,
    changes: freshDraft.changes, preview_binding: freshPreview.preview_binding };
  const maxPages = db.pragma("max_page_count", { simple: true }) as number;
  const pages = db.pragma("page_count", { simple: true }) as number;
  const beforeFull = db.serialize();
  try {
    assert.equal(db.pragma(`max_page_count = ${pages}`, { simple: true }), pages);
    await assert.rejects(reviseCodexRepositoryWorkV01(db, wire, channel),
      (error: unknown) => (error as { code?: string }).code === "SQLITE_FULL");
    assert.equal(db.inTransaction, false);
    assert.deepEqual(db.serialize(), beforeFull, "storage-full write preserves the entire database");
  } finally { db.pragma(`max_page_count = ${maxPages}`); }
  const readonly = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    await assert.rejects(reviseCodexRepositoryWorkV01(readonly, wire, channel),
      (error: unknown) => (error as { code?: string }).code?.startsWith("SQLITE_READONLY") === true);
    assert.equal(readonly.inTransaction, false);
  } finally { readonly.close(); }
  assert.deepEqual(db.serialize(), beforeFull);
  const afterStorage = await runConnectionRoundtripChild("read", root, runtimeRoot);
  assert.equal(afterStorage.continuity.snapshot.binding, reconnected.continuity.snapshot.binding);
  assert.deepEqual(afterStorage.sources, reconnected.sources);

  // A separate, explicit save after readback commits, but its real HTTP
  // response is dropped. A fresh protocol process reconciles without a write.
  const finalPreview = await call("augnes_preview_repository_work_revision", freshDraft);
  assert.equal(finalPreview.status, "previewed");
  const saves = input.saveCount();
  input.loseNextSaveResponse();
  const unknown = await call("augnes_save_repository_work_revision", { ...freshDraft, previewBinding: finalPreview.preview_binding });
  assert.equal(unknown.status, "outcome_unknown");
  assert.equal(unknown.reason, "save_outcome_unknown");
  assert.equal(input.saveCount(), saves + 1);
  const committed = db.serialize();
  const recovered = await runConnectionRoundtripChild("read", root, runtimeRoot);
  assert.equal(recovered.continuity.current_work.goal, freshDraft.changes.goal);
  assert.deepEqual(recovered.sources.structuredContent.sources, reconnected.sources.structuredContent.sources);
  assert.notEqual(recovered.continuity.snapshot.binding, reconnected.continuity.snapshot.binding);
  assert.deepEqual(db.serialize(), committed, "readback must not send a replacement save");
  assert.equal(input.saveCount(), saves + 1);
  assert.equal((db.prepare("SELECT COUNT(*) AS n FROM autonomy_runs").get() as { n: number }).n, 0);
  console.log(JSON.stringify({ companion_disruption_recovery: "pass", elapsed_hours: 24,
    browser_expiry: "refused_without_mutation", fresh_browser_access: "admitted_old_credential_still_refused",
    pending_draft: "caller_memory_preserved",
    old_generation_preview: "refused_without_mutation", sqlite_full: "atomic_refusal",
    sqlite_readonly: "atomic_refusal", fresh_protocol_readbacks: 3,
    lost_save_response: "committed_then_reconciled_without_replacement", managed_runs: 0,
    os_sleep_reboot_and_volume_full: "NOT_RUN" }));
}
