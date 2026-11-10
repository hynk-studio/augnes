import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import {
  buildSemanticReviewLoopTaskContextPacketFixture,
  buildSemanticReviewLoopRunReceiptFixture,
  buildSemanticReviewLoopProposalFixture,
} from "../fixtures/vnext/protocol/semantic-review-loop-v0-1";
import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";
import {
  getOrCreateDefaultWorkspaceIdentityV01,
  getOrCreateCanonicalProjectForLocalRootV01,
  normalizeLocalProjectRootRefV01,
} from "../lib/vnext/persistence/project-identity-registry";
import { selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { mutateProjectControlV01 } from "../lib/vnext/persistence/project-control-store";
import {
  createPersonalPerspectiveScopeLineageRefV01,
  selectPersonalPerspectiveContextV01,
} from "../lib/vnext/project-controls/project-controls";
import { buildTaskContextPacketV01 } from "../lib/vnext/task-context-packet";
import { insertVNextCoreRecordV01, readVNextCoreRecordV01 } from "../lib/vnext/persistence/durable-semantic-store";
import { admitStructuredRunReceiptV01 } from "../lib/vnext/persistence/structured-run-receipt-admission";
import { createEpisodeDeltaCandidateFingerprintV01 } from "../lib/vnext/review-decision";
import {
  issueVNextLocalOperatorBootstrapV01,
  consumeVNextLocalOperatorBootstrapV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01,
} from "../lib/vnext/runtime/local-operator-session";
import { recordVNextOperatorPilotReviewDecisionV01 } from "../lib/vnext/runtime/operator-pilot-review-material";
import {
  prepareVNextOperatorPilotSemanticCommitPreviewV01,
  confirmVNextOperatorPilotSemanticCommitV01,
} from "../lib/vnext/runtime/operator-pilot-semantic-transition";
import { commitVNextSemanticTransitionV01 } from "../lib/vnext/runtime/durable-semantic-transition";
import { compileTaskContextPacketFromPersistedSemanticStateV01 } from "../lib/vnext/runtime/persisted-semantic-context-compiler";
import { inspectVNextOperatorPilotPacketLineageV01 } from "../lib/vnext/runtime/operator-pilot-project-continuity";
import { canonicalizeProtocolValueV01 } from "../lib/vnext/protocol-primitives";
import type { PersonalPerspectiveContextCandidateV01, PersonalPerspectiveEffectiveScopeV01 } from "../types/vnext/project-controls";
import type { TaskContextPacketV01 } from "../types/vnext/task-context-packet";

// Frozen test-only output of 073c6516's selector, independently checked against
// that implementation during #1472 reproduction. Do not derive it by calling
// the modern selector: the historical loss of the caller's reason is the case.
export function legacyPersonalPerspectiveSelectionFixture(
  candidate: PersonalPerspectiveContextCandidateV01,
  scope: PersonalPerspectiveEffectiveScopeV01,
) {
  return {
    ...candidate.entry,
    why_included: "Included because this project explicitly permits Personal Perspective and the material passed project scope, review, currentness, trust, and context-selection checks.",
    compatibility_source_ref: createPersonalPerspectiveScopeLineageRefV01(scope),
  };
}

const TASK_REASON = "Compare recurring maintenance burden while permitting short, reversible exploration.";
const GENERATED_AT = "2026-07-10T14:07:00.000Z";

function prepareFixture(directory: string, legacy: boolean) {
  mkdirSync(directory);
  const databasePath = path.join(directory, "fixture.db");
  const db = new Database(databasePath);
  try {
    applyCanonicalDatabaseMigrations(db);
    const material = path.join(directory, "material");
    mkdirSync(material);
    const workspace = getOrCreateDefaultWorkspaceIdentityV01(db, {
      create_uuid: () => "14720000-0000-4000-8000-000000000001",
      now: () => "2026-07-09T20:00:00.000Z",
    });
    const project = getOrCreateCanonicalProjectForLocalRootV01(db, {
      workspace_id: workspace.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(material, { base_path: directory }),
      display_name: "Synthetic packet compatibility",
    }, {
      create_uuid: () => "14720000-0000-4000-8000-000000000002",
      now: () => "2026-07-09T20:00:00.000Z",
    }).project;
    const scope = { workspace_id: workspace.workspace_id, project_id: project.project_id };
    const active = selectActiveProjectV01(db, {
      ...scope, expected_project_id: null, expected_revision: null,
      now: "2026-07-09T20:00:00.000Z",
    });
    const changeScope = (action: "include_personal_perspective" | "exclude_personal_perspective", revision: number | null) =>
      mutateProjectControlV01(db, {
        ...scope, action, expected_control_revision: revision,
        expected_active_project_id: scope.project_id,
        expected_active_selection_revision: active.selection_revision,
      }, { now: () => "2026-07-09T21:00:00.000Z" }).personal_perspective!;
    const effective = changeScope("include_personal_perspective", null);
    const source = {
      ref_version: "external_ref.v0.1" as const, ref_type: "reviewed_memory",
      external_id: "synthetic:maintenance-guidance", source_ref: "r1",
      observed_at: "2026-07-09T22:00:00.000Z",
      trust_class: "direct_local_observation" as const,
    };
    const candidate: PersonalPerspectiveContextCandidateV01 = {
      candidate_scope: { scope_kind: "canonical_project", ...scope },
      review_status: "reviewed", trust_policy_status: "eligible",
      entry: {
        entry_id: "synthetic:maintenance-guidance", entry_kind: "memory_ref",
        source_ref: "synthetic:body:r1", external_ref: source,
        why_included: TASK_REASON,
        currentness: { status: "fresh", as_of: source.observed_at, basis: "Synthetic reviewed r1.", source_ref: source },
        trust_class: "direct_local_observation", compatibility_source_ref: null,
        bounded_summary: "Reduce long-term maintenance burden; permit short, reversible exploration.",
      },
    };
    const fresh = selectPersonalPerspectiveContextV01({ ...scope, scope: effective, candidates: [candidate] });
    assert.equal(fresh.selected_context[0]!.why_included, TASK_REASON);
    assert.deepEqual(fresh.selected_context[0]!.compatibility_source_ref, createPersonalPerspectiveScopeLineageRefV01(effective));
    const selected = legacy ? [legacyPersonalPerspectiveSelectionFixture(candidate, effective)] : fresh.selected_context;
    const context = { ...scope, fixture_id: "personal-continuation", run_id: "run:synthetic-personal-continuation" };
    const base = buildSemanticReviewLoopTaskContextPacketFixture(context);
    const prior = buildTaskContextPacketV01({
      ...base, selected_context: [...base.selected_context, ...selected],
      authority_notes: base.authority_summary.notes,
    });
    const run = buildSemanticReviewLoopRunReceiptFixture(context, prior);
    const proposal = buildSemanticReviewLoopProposalFixture(context, prior, run, { primary_delta_type: "agent_plan_delta" });
    insertVNextCoreRecordV01(db, {
      ...scope, record_kind: "task_context_packet", record_id: prior.packet_id,
      fingerprint: prior.integrity.fingerprint, payload: prior,
      created_at: prior.generated_at, idempotency_key: null,
    });
    admitStructuredRunReceiptV01(db, run);
    insertVNextCoreRecordV01(db, {
      ...scope, record_kind: "episode_delta_proposal", record_id: proposal.proposal_id,
      fingerprint: proposal.integrity.fingerprint, payload: proposal,
      created_at: proposal.created_at, idempotency_key: null,
    });
    const config = { ...scope, enabled: true as const, operator_id: "operator:synthetic-personal-continuation", database_path: databasePath };
    let time = "2026-07-10T13:00:00.000Z";
    const clock = { now: () => time };
    const bootstrap = issueVNextLocalOperatorBootstrapV01(db, { config, clock });
    const session = consumeVNextLocalOperatorBootstrapV01(db, { config, clock, bootstrap_token: bootstrap.bootstrap_token });
    const delta = proposal.proposed_deltas[0]!;
    const reviewed = recordVNextOperatorPilotReviewDecisionV01(db, {
      config, clock, credential: session.credential,
      request: {
        proposal_id: proposal.proposal_id, proposal_fingerprint: proposal.integrity.fingerprint,
        candidate_id: delta.candidate_id, candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(delta),
        decision: "accept", revisit: null, rationale_summary: "Synthetic compatibility control.",
      },
    });
    const credential = readVNextLocalOperatorCredentialFromRequestV01(new Request("http://localhost:3000/api/vnext/operator/semantic-review", {
      headers: { cookie: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${reviewed.session_cookie.value}` },
    }));
    assert(credential);
    const binding = {
      proposal_id: proposal.proposal_id, proposal_fingerprint: proposal.integrity.fingerprint,
      decision_id: reviewed.decision.decision_id, decision_fingerprint: reviewed.decision.integrity.fingerprint,
    };
    time = "2026-07-10T13:01:00.000Z";
    const preview = prepareVNextOperatorPilotSemanticCommitPreviewV01(db, { config, clock, credential, request: binding });
    time = "2026-07-10T13:02:00.000Z";
    const confirmed = confirmVNextOperatorPilotSemanticCommitV01(db, {
      config, clock, credential, preview_binding_cookie: preview.preview_binding_cookie,
      request: { ...binding, confirmation_digest: preview.preview.confirmation_digest },
    });
    time = "2026-07-10T13:03:00.000Z";
    const transition = commitVNextSemanticTransitionV01(db, {
      ...scope, ...binding, clock,
      gate_record_id: confirmed.gate_record.gate_record_id,
      gate_record_fingerprint: confirmed.gate_record.integrity.fingerprint,
    });
    assert.equal(transition.status, "applied");
    const compile = (candidates: PersonalPerspectiveContextCandidateV01[] = [candidate]) =>
      compileTaskContextPacketFromPersistedSemanticStateV01(db, {
        ...scope, prior_packet: prior,
        transition_receipt_id: transition.receipt.transition_receipt_id,
        transition_receipt_fingerprint: transition.receipt.integrity.fingerprint,
        expiry_policy: { mode: "reuse_prior" }, personal_perspective_candidates: candidates,
        clock: { now: () => GENERATED_AT },
      });
    return { db, databasePath, scope, config, prior, candidate, effective, compile, changeScope };
  } catch (error) {
    db.close();
    throw error;
  }
}

function logicalSnapshot(db: Database.Database) {
  const tables = db.prepare("SELECT name FROM sqlite_schema WHERE type='table' ORDER BY name").all() as { name: string }[];
  return canonicalizeProtocolValueV01(tables.map(({ name }) => [
    name, db.prepare(`SELECT * FROM "${name.replaceAll('"', '""')}"`).all().map(canonicalizeProtocolValueV01).sort(),
  ]));
}

export async function runPersonalPerspectiveContinuationChecks(parent: string) {
  const root = mkdtempSync(path.join(parent, "personal-continuation-"));
  const guard = installZeroNetworkGuard({ allowLoopback: false });
  const cases: string[] = [];
  const refusals: Array<{ name: string; error: string }> = [];
  const bindings: unknown[] = [];
  try {
    for (const legacy of [true, false]) {
      const f = prepareFixture(path.join(root, legacy ? "legacy" : "modern"), legacy);
      try {
        const readPrior = (db: Database.Database) => readVNextCoreRecordV01(db, {
          ...f.scope, record_kind: "task_context_packet", record_id: f.prior.packet_id,
        });
        const priorRecord = structuredClone(readPrior(f.db));
        const priorObject = structuredClone(f.prior);
        const candidate = structuredClone(f.candidate);
        const unchanged = () => {
          assert.deepEqual(readPrior(f.db), priorRecord);
          assert.deepEqual(f.prior, priorObject);
          assert.deepEqual(f.candidate, candidate);
        };
        assert.equal(validateRecoveryCanonicalDatabaseV01(f.db).status, "valid");
        const result = f.compile();
        assert.equal(result.status, "inserted");
        assert.equal(result.full_chain_relation.status, "valid");
        const priorEntry = f.prior.selected_context.find(e => e.entry_id === f.candidate.entry.entry_id)!;
        const laterEntry = result.later_packet.selected_context.find(e => e.entry_id === priorEntry.entry_id)!;
        assert.deepEqual(laterEntry, priorEntry, "the entire unaffected historical entry stays exact");
        assert.equal(result.personal_perspective_selection.selected_context[0]!.why_included, TASK_REASON,
          "current eligibility selection retains the caller's reason, independently of history");
        assert.equal(laterEntry.why_included, legacy ? legacyPersonalPerspectiveSelectionFixture(f.candidate, f.effective).why_included : TASK_REASON);
        assert.notEqual(result.later_packet.packet_id, f.prior.packet_id);
        assert.notEqual(result.later_packet.integrity.fingerprint, f.prior.integrity.fingerprint);
        unchanged();
        cases.push(legacy ? "legacy_upgrade_preserves_history" : "fresh_and_modern_reason_preserved");

        const refuse = (name: string, candidates: PersonalPerspectiveContextCandidateV01[], expected: RegExp) => {
          const before = logicalSnapshot(f.db);
          let caught: unknown;
          try { f.compile(candidates); } catch (error) { caught = error; }
          assert(caught instanceof Error, `${name}: compilation must refuse`);
          assert.match(caught.message, expected, `${name}: ${caught.message}`);
          assert.equal(logicalSnapshot(f.db), before, `${name}: no durable effects`);
          unchanged(); cases.push(`${legacy ? "legacy" : "modern"}:${name}`);
          refusals.push({ name, error: caught.message });
        };
        if (legacy) {
          assert.equal(f.compile([f.candidate, structuredClone(f.candidate)]).status, "exact_replay");
          unchanged();
          const changes: Array<[string, (c: PersonalPerspectiveContextCandidateV01) => void]> = [
            ["source", c => { c.entry.source_ref = "synthetic:changed"; }],
            ["revision", c => { c.entry.external_ref = { ...c.entry.external_ref!, source_ref: "r2" }; }],
            ["body", c => { c.entry.bounded_summary = "Different guidance."; }],
            ["freshness_basis", c => { c.entry.currentness.as_of = "2026-07-09T22:01:00.000Z"; }],
            ["trust", c => {
              c.entry.trust_class = "imported_unverified";
              c.entry.external_ref = { ...c.entry.external_ref!, trust_class: "imported_unverified" };
              c.entry.currentness.source_ref = { ...c.entry.currentness.source_ref!, trust_class: "imported_unverified" };
            }],
          ];
          for (const [name, change] of changes) {
            const changed = structuredClone(f.candidate); change(changed);
            refuse(name, [changed], /unrelated_selected_context_changed/);
          }
          for (const status of ["unreviewed", "contested", "retracted"] as const) {
            refuse(status, [{ ...f.candidate, review_status: status }], /unrelated_selected_context_changed/);
          }
          const stale = structuredClone(f.candidate); stale.entry.currentness.status = "stale";
          refuse("stale", [stale], /unrelated_selected_context_changed/);
          refuse("trust_ineligible", [{ ...f.candidate, trust_policy_status: "ineligible" }], /unrelated_selected_context_changed/);
          for (const field of ["workspace_id", "project_id"] as const) {
            const foreign = structuredClone(f.candidate);
            assert(foreign.candidate_scope.scope_kind === "canonical_project");
            foreign.candidate_scope[field] = "foreign";
            refuse(`foreign_${field}`, [foreign], /personal_perspective_candidate_scope_invalid/);
          }
          refuse("missing", [], /unrelated_selected_context_changed/);
          const extra = structuredClone(f.candidate); extra.entry.entry_id = "synthetic:extra";
          refuse("extra", [f.candidate, extra], /unrelated_selected_context_changed/);
          const conflicting = structuredClone(f.candidate); conflicting.entry.why_included = "A conflicting reason.";
          refuse("conflicting_eligible_duplicate", [f.candidate, conflicting], /duplicate_conflicting_selected_entry|unrelated_selected_context_changed/);
          refuse("conflicting_review_duplicate", [f.candidate, { ...f.candidate, review_status: "contested" }], /unrelated_selected_context_changed/);
          const excluded = f.changeScope("exclude_personal_perspective", 1);
          refuse("sharing_withdrawn", [f.candidate], /unrelated_selected_context_changed/);
          f.changeScope("include_personal_perspective", excluded.scope_revision);
          refuse("scope_revision_changed", [f.candidate], /unrelated_selected_context_changed/);
        } else {
          const changed = structuredClone(f.candidate); changed.entry.why_included = "Arbitrary new task rationale.";
          refuse("modern_reason_changed", [changed], /unrelated_selected_context_changed/);
        }

        // SQLite's supported backup plus new query-only connections exercise the
        // ordinary scoped lineage and recovery readers, including all source rows
        // and authenticated synthetic review/gate provenance. No record surgery.
        const backupPath = path.join(path.dirname(f.databasePath), "backup.db");
        await f.db.backup(backupPath);
        f.db.close();
        for (const databasePath of [f.databasePath, backupPath]) {
          const reopened = new Database(databasePath, { readonly: true, fileMustExist: true });
          try {
            reopened.pragma("query_only = ON");
            const before = logicalSnapshot(reopened);
            const read = inspectVNextOperatorPilotPacketLineageV01(reopened, {
              config: { ...f.config, database_path: databasePath },
              packet_id: result.later_packet.packet_id,
              packet_fingerprint: result.later_packet.integrity.fingerprint,
            });
            assert.deepEqual(read.packet, result.later_packet);
            assert.equal(read.projection_current, true);
            assert.deepEqual(readPrior(reopened), priorRecord);
            assert.equal(validateRecoveryCanonicalDatabaseV01(reopened).status, "valid");
            assert.equal(logicalSnapshot(reopened), before, "reader/recovery does not write");
            assert.equal(readVNextCoreRecordV01(reopened, {
              ...f.scope, project_id: "foreign", record_kind: "task_context_packet", record_id: result.later_packet.packet_id,
            }), null);
          } finally { reopened.close(); }
        }
        cases.push(`${legacy ? "legacy" : "modern"}:reopened_product_and_backup_readers`);
        bindings.push({ legacy, prior_id: f.prior.packet_id, prior_fingerprint: f.prior.integrity.fingerprint,
          later_id: result.later_packet.packet_id, later_fingerprint: result.later_packet.integrity.fingerprint });
      } finally { if (f.db.open) f.db.close(); }
    }
    return { status: "pass", cases, refusals, bindings, historical_records_unchanged: true, model_calls: 0 };
  } finally {
    guard.restore();
    rmSync(root, { recursive: true, force: true });
  }
}
