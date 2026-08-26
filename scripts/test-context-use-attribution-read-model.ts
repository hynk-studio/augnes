import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import {
  contextUseAttributionSourceFixture,
} from "@/fixtures/vnext/protocol/context-use-attribution-projection-v0-1";
import {
  buildContextUseReviewV01,
  deriveContextUseReviewPresentationProvenanceV01,
} from "@/lib/vnext/context-use-review";
import {
  countVNextCoreRecordsV01,
  ensureVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
  type VNextCoreRecordEnvelopeV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import { readContextUseAttributionProjectionV01 } from "@/lib/vnext/runtime/context-use-attribution-read-model";
import { buildRunReceiptV01 } from "@/lib/vnext/run-receipt";
import { buildTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import {
  runContextUseAttributionReportV01,
} from "@/scripts/context-use-attribution-report";
import { runContextUseAttributionConformanceV01 } from "@/scripts/vnext-protocol-conformance/context-use-attribution-projection";
import type { ContextUseReviewV01 } from "@/types/vnext/context-use-review";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

const pureSummary = runContextUseAttributionConformanceV01();
const source = contextUseAttributionSourceFixture;
const temporaryRoot = mkdtempSync(
  path.join(tmpdir(), "augnes-context-use-attribution-"),
);
const databasePath = path.join(temporaryRoot, "product-state.sqlite");
const originalFetch = globalThis.fetch;
let fetchCalls = 0;
globalThis.fetch = (async () => {
  fetchCalls += 1;
  throw new Error("context-use attribution read model must not call fetch");
}) as typeof fetch;

try {
  const db = new Database(databasePath);
  try {
    ensureVNextDurableSemanticStoreSchemaV01(db);
    persistSourceChainV01(db, source);

    const before = snapshotStateV01(db);
    const request = {
      workspace_id: source.review.workspace_id,
      project_id: source.review.project_id,
      review_id: source.review.review_id,
      review_fingerprint: source.review.integrity.fingerprint,
    };
    const first = readContextUseAttributionProjectionV01(db, request);
    const replay = readContextUseAttributionProjectionV01(db, request);
    assert.deepEqual(replay, first);
    assert.equal(first.rows.length, source.later_packet.selected_context.length);
    assert.ok(first.rows.every((row) => row.actual_use.status === "unknown"));
    assert.ok(
      first.rows.every((row) => row.outcome_association.status === "unknown"),
    );
    assert.ok(
      first.rows.every((row) => row.causal_contribution.status === "unknown"),
    );

    assert.throws(
      () =>
        readContextUseAttributionProjectionV01(db, {
          ...request,
          project_id: "project:foreign",
        }),
      /context_use_attribution_review_missing/,
    );
    assert.throws(
      () =>
        readContextUseAttributionProjectionV01(db, {
          ...request,
          review_fingerprint: `sha256:${"f".repeat(64)}`,
        }),
      /context_use_attribution_review_fingerprint_mismatch/,
    );
    assert.throws(
      () =>
        readContextUseAttributionProjectionV01(db, {
          ...request,
          review_id: source.review.review_id,
          review_fingerprint: source.review.integrity.fingerprint,
          extra_field: "forbidden",
        } as typeof request),
      /context_use_attribution_read_request_unknown_field/,
    );

    const jsonReport = runContextUseAttributionReportV01({
      database_path: databasePath,
      ...request,
      format: "json",
    });
    const parsed = JSON.parse(jsonReport) as typeof first;
    assert.deepEqual(parsed, first);
    const markdownReport = runContextUseAttributionReportV01({
      database_path: databasePath,
      ...request,
      format: "markdown",
    });
    assert.match(markdownReport, /Actual use \| Referenced \| Support \| Outcome \| Causal/);
    assert.match(markdownReport, /\| unknown \|/);
    assert.equal(markdownReport.includes(databasePath), false);
    assert.equal(jsonReport.includes(databasePath), false);
    assert.equal(markdownReport.includes(temporaryRoot), false);
    assert.equal(jsonReport.includes(temporaryRoot), false);

    const cli = spawnSync(
      process.execPath,
      [
        "--import",
        "tsx",
        "scripts/context-use-attribution-report.ts",
        "--workspace-id",
        request.workspace_id,
        "--project-id",
        request.project_id,
        "--review-id",
        request.review_id,
        "--review-fingerprint",
        request.review_fingerprint,
        "--format",
        "markdown",
      ],
      {
        cwd: process.cwd(),
        encoding: "utf8",
        env: {
          AUGNES_DB_PATH: databasePath,
          NODE_ENV: "test",
          PATH: process.env.PATH ?? "",
        },
        timeout: 10_000,
      },
    );
    assert.equal(cli.status, 0, cli.stderr);
    assert.equal(cli.signal, null);
    assert.match(cli.stdout, /# Context-use attribution projection/);
    assert.equal(cli.stdout.includes(databasePath), false);
    assert.equal(cli.stderr, "");

    const after = snapshotStateV01(db);
    assert.deepEqual(after, before);
    assert.equal(before.core_record_count, 5);
    assert.equal(before.semantic_state_entry_count, 0);
    assert.equal(before.semantic_target_head_count, 0);
    for (const kind of [
      "automation_work_item",
      "capability_grant",
      "evidence_record",
      "claim_record",
      "claim_evidence_relation",
      "episode_delta_proposal",
      "review_decision",
      "semantic_commit_gate",
      "semantic_state",
    ] as const) {
      assert.equal(
        countVNextCoreRecordsV01(db, {
          workspace_id: source.review.workspace_id,
          project_id: source.review.project_id,
          record_kind: kind,
        }),
        0,
        kind,
      );
    }

    const oversized = buildOversizedSourceChainV01();
    const oversizedDb = new Database(
      path.join(temporaryRoot, "oversized-product-state.sqlite"),
    );
    try {
      ensureVNextDurableSemanticStoreSchemaV01(oversizedDb);
      persistSourceChainV01(oversizedDb, oversized);
      assert.throws(
        () =>
          readContextUseAttributionProjectionV01(oversizedDb, {
            workspace_id: oversized.review.workspace_id,
            project_id: oversized.review.project_id,
            review_id: oversized.review.review_id,
            review_fingerprint: oversized.review.integrity.fingerprint,
          }),
        /context_use_attribution_collection_bound_exceeded/,
      );
    } finally {
      oversizedDb.close();
    }
  } finally {
    db.close();
  }

  assert.equal(fetchCalls, 0);
  console.log(
    JSON.stringify(
      {
        suite: "context-use-attribution-read-model-v0.1",
        status: "passed",
        pure_contract: pureSummary,
        persisted_exact_chain_checked: true,
        canonical_replay_checked: true,
        read_only_consumer_checked: true,
        repository_command_checked: true,
        core_record_counts_unchanged: true,
        schema_unchanged: true,
        cross_project_refused: true,
        stale_fingerprint_refused: true,
        collection_bound_refused: true,
        provider_calls: 0,
        network_calls: 0,
        external_calls: 0,
        owned_processes: 0,
      },
      null,
      2,
    ),
  );
} finally {
  globalThis.fetch = originalFetch;
  rmSync(temporaryRoot, { recursive: true, force: true });
  assert.equal(existsSync(temporaryRoot), false);
}

function persistSourceChainV01(
  db: Database.Database,
  input: typeof contextUseAttributionSourceFixture,
) {
  const records: VNextCoreRecordEnvelopeV01[] = [
    {
      record_kind: "task_context_packet",
      record_id: input.prior_packet.packet_id,
      workspace_id: input.prior_packet.workspace_id,
      project_id: input.prior_packet.project_id,
      fingerprint: input.prior_packet.integrity.fingerprint,
      idempotency_key: null,
      payload: input.prior_packet,
      created_at: input.prior_packet.generated_at,
    },
    {
      record_kind: "task_context_packet",
      record_id: input.later_packet.packet_id,
      workspace_id: input.later_packet.workspace_id,
      project_id: input.later_packet.project_id,
      fingerprint: input.later_packet.integrity.fingerprint,
      idempotency_key: null,
      payload: input.later_packet,
      created_at: input.later_packet.generated_at,
    },
    {
      record_kind: "state_transition_receipt",
      record_id: input.source_transition_receipt.transition_receipt_id,
      workspace_id: input.source_transition_receipt.workspace_id,
      project_id: input.source_transition_receipt.project_id,
      fingerprint: input.source_transition_receipt.integrity.fingerprint,
      idempotency_key: input.source_transition_receipt.idempotency_key,
      payload: input.source_transition_receipt,
      created_at: input.source_transition_receipt.recorded_at,
    },
    {
      record_kind: "run_receipt",
      record_id: input.later_task_run_receipt.receipt_id,
      workspace_id: input.later_task_run_receipt.workspace_id,
      project_id: input.later_task_run_receipt.project_id,
      fingerprint: input.later_task_run_receipt.integrity.fingerprint,
      idempotency_key: input.later_task_run_receipt.idempotency_key,
      payload: input.later_task_run_receipt,
      created_at: input.later_task_run_receipt.recorded_at,
    },
    {
      record_kind: "context_use_review",
      record_id: input.review.review_id,
      workspace_id: input.review.workspace_id,
      project_id: input.review.project_id,
      fingerprint: input.review.integrity.fingerprint,
      idempotency_key: null,
      payload: input.review,
      created_at: input.review.reviewed_at,
    },
  ];
  for (const record of records) insertVNextCoreRecordV01(db, record);
}

function snapshotStateV01(db: Database.Database) {
  const schema = db
    .prepare(
      `SELECT type, name, tbl_name, sql
       FROM sqlite_master
       WHERE name LIKE 'vnext_%' OR tbl_name LIKE 'vnext_%'
       ORDER BY type, name`,
    )
    .all();
  return {
    core_record_count: countVNextCoreRecordsV01(db),
    semantic_state_entry_count: rowCountV01(db, "vnext_semantic_state_entries"),
    semantic_target_head_count: rowCountV01(db, "vnext_semantic_target_heads"),
    schema: canonicalizeProtocolValueV01(schema),
  };
}

function rowCountV01(db: Database.Database, table: string): number {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as {
    count: number;
  };
  return row.count;
}

function buildOversizedSourceChainV01(): typeof contextUseAttributionSourceFixture {
  const seed = source.later_packet.selected_context[1]!;
  const additionalEntries = Array.from({ length: 127 }, (_, index) => {
      const entry = clone(seed);
      entry.entry_id = `context-use-attribution-bound:${index}`;
      entry.source_ref = `artifact:context-use-attribution-bound:${index}`;
      if (entry.external_ref) {
        entry.external_ref.external_id = `context-use-attribution-bound:${index}`;
      }
      if (entry.compatibility_source_ref) {
        entry.compatibility_source_ref.external_id =
          `context-use-attribution-compat-bound:${index}`;
      }
      if (entry.currentness.source_ref) {
        entry.currentness.source_ref.external_id =
          `context-use-attribution-currentness-bound:${index}`;
      }
      return entry;
    });
  const priorInput = taskContextPacketBuilderInput(source.prior_packet);
  priorInput.selected_context.push(...clone(additionalEntries));
  priorInput.constraints.context_budget = {
    ...priorInput.constraints.context_budget,
    max_selected_entries: 128,
    max_characters: 1_000_000,
    max_estimated_tokens: 250_000,
  };
  const priorPacket = buildTaskContextPacketV01(priorInput);
  assert.equal(priorPacket.selected_context.length, 128);

  const laterInput = taskContextPacketBuilderInput(source.later_packet);
  laterInput.selected_context.push(...clone(additionalEntries));
  laterInput.constraints.context_budget = {
    ...laterInput.constraints.context_budget,
    max_selected_entries: 129,
    max_characters: 1_000_000,
    max_estimated_tokens: 250_000,
  };
  const laterPacket = buildTaskContextPacketV01(laterInput);
  assert.equal(laterPacket.selected_context.length, 129);

  const runInput = runReceiptBuilderInput(source.later_task_run_receipt);
  runInput.task_context_packet_ref = {
    ...runInput.task_context_packet_ref!,
    external_id: laterPacket.packet_id,
    source_ref: laterPacket.integrity.fingerprint,
  };
  const replacementDeliveryRef = {
    ...runInput.checks.find(
      (check) => check.check_id === "deterministic_packet_delivery",
    )!.source_refs[0]!,
    external_id: laterPacket.packet_id,
    source_ref: laterPacket.integrity.fingerprint,
  };
  for (const ref of runInput.verifier_refs) {
    if (ref.ref_type === "task_context_packet_delivery") {
      Object.assign(ref, replacementDeliveryRef);
    }
  }
  for (const check of runInput.checks) {
    if (check.check_id === "deterministic_packet_delivery") {
      check.source_refs = [replacementDeliveryRef];
    }
  }
  const runReceipt = buildRunReceiptV01(runInput);

  const reviewInput = contextUseReviewBuilderInput(source.review);
  reviewInput.prior_packet = {
    packet_version: priorPacket.packet_version,
    packet_id: priorPacket.packet_id,
    packet_fingerprint: priorPacket.integrity.fingerprint,
  };
  reviewInput.later_packet = {
    packet_version: laterPacket.packet_version,
    packet_id: laterPacket.packet_id,
    packet_fingerprint: laterPacket.integrity.fingerprint,
  };
  reviewInput.later_task_run_receipt = {
    receipt_version: runReceipt.receipt_version,
    receipt_id: runReceipt.receipt_id,
    receipt_fingerprint: runReceipt.integrity.fingerprint,
  };
  const presentation = deriveContextUseReviewPresentationProvenanceV01(
    runReceipt,
  );
  reviewInput.usage.presented = presentation.presented;
  reviewInput.usage_provenance!.presented = presentation.provenance;
  const review = buildContextUseReviewV01(reviewInput);

  return {
    review,
    prior_packet: priorPacket,
    later_packet: laterPacket,
    source_transition_receipt: source.source_transition_receipt,
    later_task_run_receipt: runReceipt,
  };
}

function taskContextPacketBuilderInput(packet: TaskContextPacketV01) {
  const {
    packet_version: _version,
    packet_id: _id,
    authority_summary,
    integrity: _integrity,
    ...input
  } = clone(packet);
  return { ...input, authority_notes: authority_summary.notes };
}

function runReceiptBuilderInput(receipt: RunReceiptV01) {
  const {
    receipt_version: _version,
    receipt_id: _id,
    trust_summary: _trust,
    authority_summary,
    idempotency_key: _key,
    integrity: _integrity,
    ...input
  } = clone(receipt);
  return { ...input, authority_notes: authority_summary.notes };
}

function contextUseReviewBuilderInput(review: ContextUseReviewV01) {
  const {
    review_version: _version,
    review_id: _id,
    material_boundary: _boundary,
    authority_summary,
    integrity: _integrity,
    ...input
  } = clone(review);
  return { ...input, authority_notes: authority_summary.notes };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
