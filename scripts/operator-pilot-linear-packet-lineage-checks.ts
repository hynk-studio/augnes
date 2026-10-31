#!/usr/bin/env node

import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { readVNextCoreRecordV01 } from "../lib/vnext/persistence/durable-semantic-store";
import { compileTaskContextPacketFromPersistedSemanticStateInsideTransactionV01 } from "../lib/vnext/runtime/persisted-semantic-context-compiler";
import { readVNextOperatorPilotProposalDurableLineageV01 } from "../lib/vnext/runtime/operator-pilot-workbench-lineage";
import type { EpisodeDeltaProposalV01 } from "../types/vnext/episode-delta-proposal";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";
import { buildVNextOperatorBrowserFixtureV01, type VNextOperatorBrowserFixtureManifestV01 } from "./vnext-operator-browser-fixture-builder-v0-1";

interface CoreRow {
  record_kind: string;
  record_id: string;
  [column: string]: unknown;
}

/** Exercise the ordinary compiler and reader on an isolated copy of a real fixture. */
export function assertOperatorPilotLinearPacketLineageV01(
  source: Database.Database,
  manifest: VNextOperatorBrowserFixtureManifestV01,
): void {
  const root = mkdtempSync(path.join(tmpdir(), "augnes-linear-packet-lineage-"));
  const databasePath = path.join(root, "lineage.db");
  let db: Database.Database | null = null;
  try {
    writeFileSync(databasePath, source.serialize(), { mode: 0o600 });
    db = new Database(databasePath, { fileMustExist: true });
    db.pragma("foreign_keys = ON");
    const config = { enabled: true as const, workspace_id: manifest.workspace_id,
      project_id: manifest.project_id, operator_id: manifest.operator_id,
      database_path: databasePath };
    const original = readVNextCoreRecordV01(db, { ...config,
      record_kind: "task_context_packet", record_id: manifest.packet_id })!.payload as TaskContextPacketV01;
    const proposal = readVNextCoreRecordV01(db, { ...config,
      record_kind: "episode_delta_proposal", record_id: manifest.proposal_id })!.payload as EpisodeDeltaProposalV01;
    const originalRows = rows(db);
    const generatedAt = new Date(Date.parse(original.generated_at) + 1_000).toISOString();
    const compile = (prior: TaskContextPacketV01) => db!.transaction(() =>
      compileTaskContextPacketFromPersistedSemanticStateInsideTransactionV01(db!, {
        workspace_id: config.workspace_id, project_id: config.project_id,
        prior_packet: prior,
        transition_receipt_id: manifest.transition_receipt_id,
        transition_receipt_fingerprint: manifest.transition_receipt_fingerprint,
        expiry_policy: { mode: "explicit", expires_at: null },
        clock: { now: () => generatedAt },
      }))();
    const second = compile(original);
    const third = compile(second.later_packet);
    assert.equal(second.status, "inserted");
    assert.equal(third.status, "inserted");
    assert.equal(second.full_chain_relation.status, "valid");
    assert.equal(third.full_chain_relation.status, "valid");
    assert.equal(second.later_packet.generated_at, third.later_packet.generated_at,
      "The exact successor is required even when timestamps tie");

    const read = () => readVNextOperatorPilotProposalDurableLineageV01(db!, {
      config, proposal, clock: { now: () => generatedAt },
    });
    // The predecessor fails naturally here: the actual reader rejects multiple
    // packets before recognizing their already validated A -> B -> C ancestry.
    const lineage = read();
    const chain = lineage.chains.find(entry =>
      entry.transition.receipt_id === manifest.transition_receipt_id);
    assert.equal(chain?.compiled_packet?.packet_id, third.later_packet.packet_id);
    assert.equal(chain?.compiled_packet?.packet_fingerprint, third.later_packet.integrity.fingerprint);
    assert.equal(lineage.read_only, true);
    assert.equal(lineage.semantic_authority_granted, false);
    assertOriginalRowsUnchanged(db, originalRows);

    const beforeBranch = logicalDatabaseState(db);
    db.exec("SAVEPOINT disconnected_compiled_sibling");
    try {
      const sibling = compile(original);
      // A replay of B is harmless; use a distinct timestamp to create a real
      // second child of A through the same production compiler.
      assert.equal(sibling.status, "exact_replay");
      const branched = db.transaction(() =>
        compileTaskContextPacketFromPersistedSemanticStateInsideTransactionV01(db!, {
          workspace_id: config.workspace_id, project_id: config.project_id,
          prior_packet: original,
          transition_receipt_id: manifest.transition_receipt_id,
          transition_receipt_fingerprint: manifest.transition_receipt_fingerprint,
          expiry_policy: { mode: "explicit", expires_at: null },
          clock: { now: () => new Date(Date.parse(generatedAt) + 1_000).toISOString() },
        }))();
      assert.equal(branched.status, "inserted");
      assert.throws(read, (error: unknown) => hasCode(error,
        "operator_pilot_workbench_lineage_packet_relation_ambiguous"));
    } finally { db.exec("ROLLBACK TO disconnected_compiled_sibling; RELEASE disconnected_compiled_sibling"); }
    assert(logicalDatabaseState(db) === beforeBranch,
      "Sibling refusal and rollback preserve the complete schema and every stored row");

    for (const mutation of ["malformed", "foreign", "missing", "self_reference"] as const) {
      const before = logicalDatabaseState(db);
      db.exec("SAVEPOINT invalid_compiled_predecessor");
      try {
        db.exec("DROP TRIGGER trg_vnext_core_records_immutable_update; DROP TRIGGER trg_vnext_core_records_immutable_delete");
        if (mutation === "missing") {
          db.prepare("DELETE FROM vnext_core_records WHERE record_kind = 'task_context_packet' AND record_id = ?")
            .run(second.later_packet.packet_id);
        } else if (mutation === "foreign") {
          db.prepare("UPDATE vnext_core_records SET project_id = ? WHERE record_kind = 'task_context_packet' AND record_id = ?")
            .run("project:foreign-linear-packet-control", second.later_packet.packet_id);
        } else {
          const changed = structuredClone(second.later_packet);
          if (mutation === "self_reference") {
            const prior = changed.compatibility.source_refs.find(ref => ref.external_id === original.packet_id);
            assert(prior);
            prior.external_id = changed.packet_id;
            prior.source_ref = changed.integrity.fingerprint;
          }
          db.prepare("UPDATE vnext_core_records SET payload_json = ? WHERE record_kind = 'task_context_packet' AND record_id = ?")
            .run(mutation === "malformed" ? JSON.stringify({ malformed_packet: true }) : JSON.stringify(changed), second.later_packet.packet_id);
        }
        assert.throws(read, (error: unknown) => error instanceof Error,
          `${mutation} predecessor must remain unavailable`);
      } finally { db.exec("ROLLBACK TO invalid_compiled_predecessor; RELEASE invalid_compiled_predecessor"); }
      assert(logicalDatabaseState(db) === before,
        `${mutation} refusal and rollback preserve the complete schema and every stored row`);
    }
    const beforeReopen = logicalDatabaseState(db);
    db.close();
    db = new Database(databasePath, { fileMustExist: true });
    db.pragma("foreign_keys = ON");
    const reopened = read();
    assert(reopened.chains.some(entry => entry.transition.receipt_id === manifest.transition_receipt_id &&
      entry.compiled_packet?.packet_id === third.later_packet.packet_id), "Reopen retains the exact linear successor");
    assert(logicalDatabaseState(db) === beforeReopen,
      "Lineage readback preserves the complete schema and every stored row after reopen");
    assertOriginalRowsUnchanged(db, originalRows);
    console.log(JSON.stringify({ operator_pilot_linear_packet_lineage: "pass",
      production_compiler: true, equal_timestamp_successors: true,
      disconnected_sibling_refused: true, malformed_foreign_missing_self_reference_refused: true,
      rollback_and_reopen: true, original_record_bytes_preserved: true,
      semantic_authority_granted: false }));
  } finally {
    if (db?.open) db.close();
    rmSync(root, { recursive: true, force: true });
  }
  assert.equal(existsSync(root), false);
}

function rows(db: Database.Database): CoreRow[] {
  return db.prepare(`SELECT record_kind, record_id, workspace_id, project_id,
    fingerprint, idempotency_key, payload_json, created_at
    FROM vnext_core_records ORDER BY record_kind, record_id`).all() as CoreRow[];
}

function assertOriginalRowsUnchanged(db: Database.Database, original: CoreRow[]): void {
  const current = new Map(rows(db).map(row => [`${row.record_kind}|${row.record_id}`, JSON.stringify(row)]));
  assert(original.every(row => current.get(`${row.record_kind}|${row.record_id}`) === JSON.stringify(row)),
    "Every original immutable record retains its exact envelope and stored payload bytes");
}

function logicalDatabaseState(db: Database.Database): string {
  // Releasing an outermost savepoint after rollback can advance SQLite's
  // file-header change counter. Compare the complete main schema and every
  // table row instead, retaining exact payload strings and integer values.
  const encode = (value: unknown) => JSON.stringify(value, (_key, current) =>
    typeof current === "bigint" ? { sqlite_integer: current.toString() } : current);
  const schema = db.prepare(
    "SELECT type, name, tbl_name, rootpage, sql FROM sqlite_schema ORDER BY type, name",
  ).safeIntegers(true).all();
  const tables = db.prepare(
    "SELECT name FROM sqlite_schema WHERE type = 'table' ORDER BY name",
  ).all() as Array<{ name: string }>;
  return encode({ schema, tables: tables.map(table => ({
    name: table.name,
    rows: db.prepare(`SELECT * FROM "${table.name.replaceAll('"', '""')}"`)
      .safeIntegers(true).all().map(encode).sort(),
  })) });
}

function hasCode(error: unknown, code: string): boolean {
  return error instanceof Error && "code" in error && error.code === code;
}

async function main(): Promise<void> {
  const root = mkdtempSync(path.join(tmpdir(), "augnes-linear-packet-fixture-"));
  const fixtureRoot = path.join(root, "fixture");
  let db: Database.Database | null = null;
  try {
    mkdirSync(fixtureRoot);
    const built = await buildVNextOperatorBrowserFixtureV01({
      output_directory: fixtureRoot, reference_time: "2026-07-17T12:00:00.000Z",
    });
    assert.equal(built.status, "pass");
    assert.equal(built.provider_calls, 0);
    assert.equal(built.external_network_calls, 0);
    const manifest = JSON.parse(readFileSync(path.join(fixtureRoot, built.manifest_file), "utf8")) as VNextOperatorBrowserFixtureManifestV01;
    db = new Database(path.join(fixtureRoot, "operator-pilot.db"), { readonly: true, fileMustExist: true });
    assertOperatorPilotLinearPacketLineageV01(db, manifest);
  } finally {
    if (db?.open) db.close();
    rmSync(root, { recursive: true, force: true });
  }
  assert.equal(existsSync(root), false);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  void main().catch((error: unknown) => {
    console.error(JSON.stringify({ operator_pilot_linear_packet_lineage: "fail",
      error_class: error instanceof Error ? error.constructor.name : "unknown",
      error_code: error && typeof error === "object" && "code" in error &&
        typeof error.code === "string" && /^(?:[a-z][a-z0-9_]{0,100}|ERR_[A-Z_]+|SQLITE_[A-Z_]+)$/u.test(error.code) ? error.code : null,
      static_paths: error instanceof Error ? [...(error.stack ?? "").matchAll(
        /(?:lib|scripts)\/[A-Za-z0-9_./-]+:[0-9]+:[0-9]+/gu,
      )].map(match => match[0]).slice(0, 5) : [] }));
    process.exitCode = 1;
  });
}
