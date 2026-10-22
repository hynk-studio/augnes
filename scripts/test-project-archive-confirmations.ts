import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import {
  confirmLocalProjectOnboardingV01, declareAndInspectLocalProjectV01,
  declareAndInspectLocalProjectRecoveryV01, listRegisteredProjectsV02,
  previewLocalProjectRootRebindFromSelectionV01, readPreparedLocalProjectSelectionBindingV01,
  rebindLocalProjectRootFromSelectionV01,
} from "../lib/vnext/onboarding/local-project-onboarding";
import { getOrCreateDefaultWorkspaceIdentityV01, listProjectExternalRefsV01 } from "../lib/vnext/persistence/project-identity-registry";
import {
  changeProjectOrganizationV01, readProjectOrganizationV01,
  readProjectSelectionStateV02, selectActiveProjectV01,
} from "../lib/vnext/persistence/project-lifecycle-registry";
import { authorizeRepositoryExecutionDecisionFromBrowserSessionInsideTransactionV01 } from "../lib/vnext/repository-execution/repository-execution";
import {
  consumeVNextLocalOperatorBootstrapV01, issueVNextLocalOperatorBootstrapV01,
  issueVNextRepositoryDecisionChallengeV01,
} from "../lib/vnext/runtime/local-operator-session";

type Drift = "none" | "different_project" | "same_project_new_revision";
const digest = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const snapshot = (db: Database.Database) => Object.fromEntries(
  (db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all() as { name: string }[])
    .map(({ name }) => [name, db.prepare('SELECT * FROM "' + name.replaceAll('"', '""') + '" ORDER BY rowid').all()]));

async function confirmationCase(kind: "root_recovery" | "repeat_registration", state: "working" | "archived", drift: Drift) {
  const root = realpathSync(mkdtempSync(path.join(tmpdir(), "augnes-archive-confirmation-")));
  const previous = process.env.AUGNES_DB_PATH, databasePath = path.join(root, "state.db");
  process.env.AUGNES_DB_PATH = databasePath;
  const db = new Database(databasePath);
  const now = () => "2026-10-22T00:00:00.000Z";
  try {
    db.pragma("foreign_keys=ON"); applyCanonicalDatabaseMigrations(db);
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db).workspace_id;
    const projects: string[] = [];
    for (const name of ["A", "B", "C"]) {
      const folder = path.join(root, name); mkdirSync(folder);
      writeFileSync(path.join(folder, "retained.txt"), "Retained project " + name);
      const prepared = await declareAndInspectLocalProjectV01(folder);
      projects.push((await confirmLocalProjectOnboardingV01(db, {
        selection_token: prepared.selection_token, inspection_fingerprint: prepared.inspection.inspection_fingerprint,
        selection_origin: "declared_path", display_name: name,
      })).project.project_id);
    }
    const [a, b, c] = projects as [string, string, string];
    const scope = { workspace_id: workspace, project_id: a };
    const observation = () => {
      const current = readProjectSelectionStateV02(db, workspace);
      return { expected_project_id: current?.project_id ?? null, expected_revision: current?.selection_revision ?? null };
    };
    const select = (project_id: string) => selectActiveProjectV01(db, { workspace_id: workspace, project_id, now: now(), ...observation() });
    select(b);
    if (state === "archived") changeProjectOrganizationV01(db, {
      ...scope, ...observation(), state, expected_organization_revision: readProjectOrganizationV01(db, scope).revision,
    });
    const originalOrganization = readProjectOrganizationV01(db, scope), selectedB = observation();
    const driftSelection = () => {
      if (drift !== "none") select(c);
      if (drift === "same_project_new_revision") select(b);
    };
    let result: unknown, error: unknown, before: ReturnType<typeof snapshot>, token: string;
    let authorizations = 0, initialSelectionObserved = false;
    if (kind === "root_recovery") {
      const entry = (await listRegisteredProjectsV02(db, null)).projects.find(p => p.project.project_id === a)!;
      const moved = path.join(root, "A moved"); renameSync(path.join(root, "A"), moved);
      const recoveryScope = {
        project_id: a, expected_old_root_binding_fingerprint: entry.root_binding_fingerprint,
        expected_old_baseline_fingerprint: entry.physical_root_baseline_fingerprint,
        expected_active_project_id: entry.active_project_id, expected_active_selection_revision: entry.active_selection_revision,
      };
      const prepared = await declareAndInspectLocalProjectRecoveryV01(moved, recoveryScope, { now });
      assert.equal(prepared.recovery_action, "rebind"); token = prepared.selection_token;
      const input = { ...recoveryScope, selection_token: token, inspection_fingerprint: prepared.inspection.inspection_fingerprint };
      const preview = await previewLocalProjectRootRebindFromSelectionV01(db, input, { now });
      assert.equal(preview.status, "ready"); assert(preview.decision_request);
      const config = { enabled: true as const, ...scope, operator_id: "operator:archive-confirmation", database_path: databasePath };
      const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config, clock: { now } });
      const session = consumeVNextLocalOperatorBootstrapV01(db, { config, bootstrap_token: bootstrap.bootstrap_token, clock: { now } });
      const credential = session.repository_decision_session.credential;
      const requestFingerprint = preview.decision_request.request_fingerprint;
      const challenge = issueVNextRepositoryDecisionChallengeV01(db, { ...scope, request_fingerprint: requestFingerprint, credential, clock: { now } });
      // Observe the real initial read, then change selection only after the
      // async confirmation has yielded to its filesystem inspection.
      const prepare = db.prepare.bind(db);
      db.prepare = ((sql: string) => {
        const statement = prepare(sql);
        if (sql.includes("SELECT * FROM vnext_active_project_selections WHERE workspace_id = ?")) {
          const get = statement.get.bind(statement);
          statement.get = (...args: unknown[]) => {
            const row = get(...args) as { project_id: string; selection_revision: string };
            initialSelectionObserved = row.project_id === b && row.selection_revision === selectedB.expected_revision;
            return row;
          };
        }
        return statement;
      }) as typeof db.prepare;
      let pending: ReturnType<typeof rebindLocalProjectRootFromSelectionV01>;
      try {
        pending = rebindLocalProjectRootFromSelectionV01(db, { ...input, decision_request_fingerprint: requestFingerprint }, {
          now,
          authorize_decision_inside_transaction: () => {
            authorizations += 1; assert(db.inTransaction);
            const authorized = authorizeRepositoryExecutionDecisionFromBrowserSessionInsideTransactionV01(db, {
              ...scope, request_fingerprint: requestFingerprint, challenge_fingerprint: challenge.challenge_fingerprint, credential,
            }, { now });
            assert(authorized.decision.grant_fingerprint);
            return { grant_fingerprint: authorized.decision.grant_fingerprint };
          },
        });
      } finally { db.prepare = prepare; }
      assert(initialSelectionObserved, "initial expected-B check read the unchanged observation");
      assert.equal(authorizations, 0, "confirmation has yielded before the committing transaction");
      assert.equal(db.inTransaction, false);
      driftSelection(); before = snapshot(db);
      try { result = await pending; } catch (caught) { error = caught; }
      assert.equal(authorizations, 1, "exercise the actual authorized rebind transaction, not an early refusal");
    } else {
      assert.deepEqual(listProjectExternalRefsV01(db, scope), []);
      // Adding an origin before preparation leaves matching inspection
      // fingerprints while introducing a real durable association to write.
      mkdirSync(path.join(root, "A", ".git"));
      writeFileSync(path.join(root, "A", ".git", "config"), '[remote "origin"]\n  url = https://github.com/example/archive-confirmation.git\n');
      const prepared = await declareAndInspectLocalProjectV01(path.join(root, "A"));
      assert(prepared.inspection.repository_ref); assert(prepared.inspection.already_added);
      token = prepared.selection_token; driftSelection(); before = snapshot(db);
      try { result = await confirmLocalProjectOnboardingV01(db, {
        selection_token: token, inspection_fingerprint: prepared.inspection.inspection_fingerprint, selection_origin: "declared_path",
      }); } catch (caught) { error = caught; }
    }
    const after = snapshot(db), changedTables = Object.keys(before).filter(table => digest(before[table]) !== digest(after[table]));
    console.log(JSON.stringify({ archive_confirmation: kind, organization: state, drift,
      outcome: error instanceof Error ? error.message : "committed", initial_selection_observed: kind === "root_recovery" ? initialSelectionObserved : undefined,
      authorized_rebind_transactions: kind === "root_recovery" ? authorizations : undefined,
      changed_tables: changedTables, before_sha256: digest(before), after_sha256: digest(after) }));
    assert.throws(() => readPreparedLocalProjectSelectionBindingV01(token), /inspection_stale/, "confirmation consumes its process-local selection even on refusal");
    assert.deepEqual(readProjectOrganizationV01(db, scope), originalOrganization, "organization and its observation are unchanged");
    if (drift !== "none") {
      assert(error instanceof Error && /active_selection_conflict/.test(error.message), "stale confirmation must refuse with active_selection_conflict");
      assert.deepEqual(after, before, "rollback retains roots, baselines, receipts, decisions, sessions, external refs and every other durable row");
    } else {
      assert.equal(error, undefined); assert(result);
      if (state === "archived") {
        assert.deepEqual(observation(), selectedB, "fresh archived confirmation preserves B and its exact revision");
        assert.deepEqual(after.vnext_recent_projects, before.vnext_recent_projects, "archived confirmation does not restore a recent shortcut");
      } else {
        assert.equal(observation().expected_project_id, a, "ordinary working confirmation selects A");
        assert.notEqual(observation().expected_revision, selectedB.expected_revision);
        assert((after.vnext_recent_projects as { project_id: string }[]).some(row => row.project_id === a));
      }
      if (kind === "root_recovery") {
        assert(changedTables.includes("vnext_project_root_bindings"));
        assert(changedTables.includes("vnext_physical_root_baselines"));
        assert.equal((after.vnext_repository_root_rebind_receipts as unknown[]).length, 1);
      } else assert.equal(listProjectExternalRefsV01(db, scope).length, 1, "fresh candidate attaches its new origin");
    }
  } finally {
    db.close(); if (previous === undefined) delete process.env.AUGNES_DB_PATH; else process.env.AUGNES_DB_PATH = previous;
    rmSync(root, { recursive: true, force: true });
  }
}

export async function testProjectArchiveConfirmations() {
  const failures: Error[] = [];
  for (const kind of ["root_recovery", "repeat_registration"] as const)
    for (const state of ["archived", "working"] as const)
      for (const drift of ["different_project", "same_project_new_revision", "none"] as const) {
        try { await confirmationCase(kind, state, drift); }
        catch (error) { failures.push(new Error(`${kind}/${state}/${drift}: ${String(error)}`)); }
      }
  console.log(JSON.stringify({ archive_confirmation_cases: 12, passed: 12 - failures.length, failed: failures.length, provider_calls: 0 }));
  if (failures.length) throw new AggregateError(failures, "archive confirmation regressions");
}

if (path.resolve(process.argv[1] ?? "") === fileURLToPath(import.meta.url))
  void testProjectArchiveConfirmations().catch(error => { console.error(error); process.exitCode = 1; });
