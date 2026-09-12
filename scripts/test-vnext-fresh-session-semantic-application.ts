import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";
import {
  buildSemanticReviewLoopTaskContextPacketFixture,
  buildSemanticReviewLoopRunReceiptFixture,
  buildSemanticReviewLoopProposalFixture,
} from "../fixtures/vnext/protocol/semantic-review-loop-v0-1";
import {
  insertVNextCoreRecordV01,
  readVNextCoreRecordV01,
  listVNextSemanticStateEntriesV01,
} from "../lib/vnext/persistence/durable-semantic-store";
import { admitStructuredRunReceiptV01 } from "../lib/vnext/persistence/structured-run-receipt-admission";
import {
  getOrCreateDefaultWorkspaceIdentityV01,
  getOrCreateCanonicalProjectForLocalRootV01,
  normalizeLocalProjectRootRefV01,
} from "../lib/vnext/persistence/project-identity-registry";
import { selectActiveProjectV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import { createEpisodeDeltaCandidateFingerprintV01 } from "../lib/vnext/review-decision";
import {
  readVNextLocalOperatorPilotConfigV01,
  issueVNextLocalOperatorBootstrapV01,
  consumeVNextLocalOperatorBootstrapV01,
  readVNextLocalOperatorCredentialFromRequestV01,
  revokeVNextLocalOperatorSessionByIdV01,
  authenticateVNextLocalOperatorSessionV01,
  VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01,
  type VNextLocalOperatorSessionCredentialV01,
} from "../lib/vnext/runtime/local-operator-session";
import {
  recordVNextOperatorPilotReviewDecisionV01,
  readVNextOperatorPilotSemanticReviewV01,
  validateVNextOperatorPilotReviewDecisionProvenanceV01,
} from "../lib/vnext/runtime/operator-pilot-review-material";
import {
  prepareVNextOperatorPilotSemanticCommitPreviewV01,
  confirmVNextOperatorPilotSemanticCommitV01,
  applyVNextOperatorPilotReviewedSemanticTransitionV01,
  validateVNextOperatorPilotSemanticGateConfirmationProvenanceV01,
} from "../lib/vnext/runtime/operator-pilot-semantic-transition";
import {
  exportActivePortableProjectV01,
  parseAndValidatePortableProjectV01,
} from "../lib/vnext/portability/portable-project";
import { validateRecoveryCanonicalDatabaseV01 } from "./recovery-canonical-record-validator";
import { readVNextOperatorPilotProposalDurableLineageV01 } from "../lib/vnext/runtime/operator-pilot-workbench-lineage";
import { readVNextOperatorPilotReviewWindowConfigV01 } from "../lib/vnext/runtime/operator-pilot-review-window-config-v0-1";
import { installZeroNetworkGuard } from "./test-harness-zero-network-guard.mjs";

const root = mkdtempSync(path.join(tmpdir(), "augnes-fresh-action-session-"));
const guard = installZeroNetworkGuard({ allowLoopback: false });
const cases: string[] = [];
let sequence = 0;

function fixture(run: (f: ReturnType<typeof prepareFixture>) => void) {
  const f = prepareFixture();
  try {
    run(f);
  } finally {
    try {
      for (const session_id of f.sessions)
        revokeVNextLocalOperatorSessionByIdV01(f.db, {
          config: f.config,
          session_id,
          clock: f.clock,
        });
    } finally {
      f.db.close();
    }
  }
}

function prepareFixture() {
  const folder = path.join(root, String(++sequence));
  mkdirSync(folder);
  const material = path.join(folder, "material");
  mkdirSync(material);
  const db = new Database(path.join(folder, "fixture.db"));
  db.pragma("foreign_keys = ON");
  db.exec(readFileSync("lib/db/schema.sql", "utf8"));
  let time = "2026-07-11T09:00:00.000Z";
  const clock = { now: () => time };
  const set = (value: string) => {
    time = value;
  };
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db, {
    now: clock.now,
  });
  const project = getOrCreateCanonicalProjectForLocalRootV01(
    db,
    {
      workspace_id: workspace.workspace_id,
      local_root: normalizeLocalProjectRootRefV01(material, {
        base_path: path.parse(material).root,
      }),
      display_name: "Synthetic fresh action session",
    },
    { now: clock.now },
  ).project;
  selectActiveProjectV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: project.project_id,
    now: time,
    expected_project_id: null,
    expected_revision: null,
  });
  const config = readVNextLocalOperatorPilotConfigV01({
    NODE_ENV: "test",
    AUGNES_DB_PATH: path.join(folder, "fixture.db"),
    AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1",
    AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: workspace.workspace_id,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: project.project_id,
    AUGNES_VNEXT_OPERATOR_ID: "operator:fresh-action-fixture",
  });
  const context = {
    fixture_id: "fresh-action",
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    run_id: "run:synthetic-source",
  };
  const packet = buildSemanticReviewLoopTaskContextPacketFixture(context, {
    data_classification: "public_safe",
  });
  const receipt = buildSemanticReviewLoopRunReceiptFixture(context, packet);
  const proposal = buildSemanticReviewLoopProposalFixture(
    context,
    packet,
    receipt,
    { primary_delta_type: "agent_plan_delta" },
  );
  insertVNextCoreRecordV01(db, {
    record_kind: "task_context_packet",
    record_id: packet.packet_id,
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    fingerprint: packet.integrity.fingerprint,
    payload: packet,
    created_at: packet.generated_at,
    idempotency_key: null,
  });
  admitStructuredRunReceiptV01(db, receipt);
  insertVNextCoreRecordV01(db, {
    record_kind: "episode_delta_proposal",
    record_id: proposal.proposal_id,
    workspace_id: config.workspace_id,
    project_id: config.project_id,
    fingerprint: proposal.integrity.fingerprint,
    payload: proposal,
    created_at: proposal.created_at,
    idempotency_key: null,
  });
  const sessions: string[] = [];
  const session = () => {
    const issued = issueVNextLocalOperatorBootstrapV01(db, { config, clock });
    const exchanged = consumeVNextLocalOperatorBootstrapV01(db, {
      config,
      clock,
      bootstrap_token: issued.bootstrap_token,
    });
    sessions.push(exchanged.session.session_id);
    return exchanged.credential;
  };
  const fromCookie = (value: string) =>
    readVNextLocalOperatorCredentialFromRequestV01(
      new Request("http://localhost:3000/api/vnext/operator/semantic-review", {
        headers: {
          cookie: `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${value}`,
        },
      }),
    );
  let a = session();
  const candidate = proposal.proposed_deltas[0]!;
  const result = recordVNextOperatorPilotReviewDecisionV01(db, {
    config,
    credential: a,
    clock,
    request: {
      proposal_id: proposal.proposal_id,
      proposal_fingerprint: proposal.integrity.fingerprint,
      candidate_id: candidate.candidate_id,
      candidate_fingerprint:
        createEpisodeDeltaCandidateFingerprintV01(candidate),
      decision: "accept",
      revisit: null,
      rationale_summary:
        "Synthetic explicit acceptance of one bounded candidate.",
    },
  });
  a = fromCookie(result.session_cookie.value);
  const decision = result.decision;
  const binding = {
    proposal_id: proposal.proposal_id,
    proposal_fingerprint: proposal.integrity.fingerprint,
    decision_id: decision.decision_id,
    decision_fingerprint: decision.integrity.fingerprint,
  };
  const preview = (credential: VNextLocalOperatorSessionCredentialV01) =>
    prepareVNextOperatorPilotSemanticCommitPreviewV01(db, {
      config,
      credential,
      clock,
      request: binding,
    });
  const review = (
    credential: VNextLocalOperatorSessionCredentialV01 | null,
  ) => {
    if (credential)
      authenticateVNextLocalOperatorSessionV01(db, {
        config,
        credential,
        clock,
      });
    return readVNextOperatorPilotSemanticReviewV01(db, {
      config,
      proposal_id: proposal.proposal_id,
      authenticated_session_id: credential?.session_id ?? null,
    });
  };
  const count = (kind: string) =>
    (
      db
        .prepare(
          "SELECT count(*) AS n FROM vnext_core_records WHERE record_kind = ?",
        )
        .get(kind) as { n: number }
    ).n;
  const revoke = (credential: VNextLocalOperatorSessionCredentialV01) =>
    revokeVNextLocalOperatorSessionByIdV01(db, {
      config,
      session_id: credential.session_id,
      clock,
    });
  return {
    db,
    config,
    clock,
    set,
    sessions,
    session,
    a,
    decision,
    proposal,
    candidate,
    packet,
    binding,
    preview,
    review,
    revoke,
    fromCookie,
    count,
  };
}

type Fixture = ReturnType<typeof prepareFixture>;
function fresh(f: Fixture) {
  f.set("2026-07-11T09:01:00.000Z");
  f.revoke(f.a);
  f.set("2026-07-11T09:02:00.000Z");
  return f.session();
}
function confirm(
  f: Fixture,
  credential: VNextLocalOperatorSessionCredentialV01,
  preview: ReturnType<Fixture["preview"]>,
) {
  return confirmVNextOperatorPilotSemanticCommitV01(f.db, {
    config: f.config,
    credential,
    clock: f.clock,
    preview_binding_cookie: preview.preview_binding_cookie,
    request: {
      ...f.binding,
      confirmation_digest: preview.preview.confirmation_digest,
    },
  });
}
function apply(
  f: Fixture,
  credential: VNextLocalOperatorSessionCredentialV01,
  gate: ReturnType<typeof confirm>["gate_record"],
) {
  return applyVNextOperatorPilotReviewedSemanticTransitionV01(f.db, {
    config: f.config,
    credential,
    clock: f.clock,
    request: {
      ...f.binding,
      gate_record_id: gate.gate_record_id,
      gate_record_fingerprint: gate.integrity.fingerprint,
      prior_packet_id: f.packet.packet_id,
      prior_packet_fingerprint: f.packet.integrity.fingerprint,
    },
  });
}
function rejected(
  f: Fixture,
  name: string,
  run: () => unknown,
  expected: RegExp,
) {
  const before = [
    "review_decision",
    "semantic_commit_gate",
    "state_transition_receipt",
    "semantic_state",
  ].map(f.count);
  assert.throws(run, expected, name);
  assert.deepEqual(
    [
      "review_decision",
      "semantic_commit_gate",
      "state_transition_receipt",
      "semantic_state",
    ].map(f.count),
    before,
  );
  cases.push(name);
}
// Existing fixture fault-injection pattern: changes are confined to a savepoint
// in the newly created synthetic DB, rolled back before cleanup. Positive
// records are produced by the normal owners; no historical study DB is used.
function sessionFault(
  f: Fixture,
  sql: string,
  values: string[],
  run: () => void,
) {
  f.db.exec("SAVEPOINT session_fault");
  try {
    f.db.prepare(sql).run(...values);
    run();
  } finally {
    f.db.exec("ROLLBACK TO session_fault; RELEASE session_fault");
  }
}

try {
  fixture((f) => {
    const original = structuredClone(f.decision);
    assert.equal(f.preview(f.a).preview_is_write, false);
    f.set("2026-07-11T09:01:00.000Z");
    f.revoke(f.a);
    assert.equal(f.review(null).decision_history[0]?.status, "valid");
    assert.equal(f.review(null).decision_history[0]?.pilot_actionable, false);
    f.set("2026-07-11T09:02:00.000Z");
    let b = f.session();
    const preview = f.preview(b);
    assert.equal(
      f.review(b).decision_application_summary.status,
      "ready_to_complete",
    );
    f.set("2026-07-11T09:03:00.000Z");
    const confirmed = confirmVNextOperatorPilotSemanticCommitV01(f.db, {
      config: f.config,
      credential: b,
      clock: f.clock,
      preview_binding_cookie: preview.preview_binding_cookie,
      request: {
        ...f.binding,
        confirmation_digest: preview.preview.confirmation_digest,
      },
    });
    b = confirmed.session_admission.credential;
    const gate = confirmed.gate_record;
    assert.equal(
      gate.operator_confirmation_basis_refs?.filter(
        (r) => r.ref_type === "local_operator_session_action",
      )[0]?.external_id,
      b.session_id,
    );
    assert.deepEqual(gate.operator_actor_ref, f.decision.actor_ref);
    f.set("2026-07-11T09:04:00.000Z");
    const request = {
      ...f.binding,
      gate_record_id: gate.gate_record_id,
      gate_record_fingerprint: gate.integrity.fingerprint,
      prior_packet_id: f.packet.packet_id,
      prior_packet_fingerprint: f.packet.integrity.fingerprint,
    };
    const applied = applyVNextOperatorPilotReviewedSemanticTransitionV01(f.db, {
      config: f.config,
      credential: b,
      clock: f.clock,
      request,
    });
    assert.equal(applied.status, "applied");
    assert.equal(f.count("review_decision"), 1);
    assert.equal(f.count("state_transition_receipt"), 1);
    assert.deepEqual(
      readVNextCoreRecordV01(f.db, {
        ...f.config,
        record_kind: "review_decision",
        record_id: f.decision.decision_id,
      })!.payload,
      original,
    );
    const state = listVNextSemanticStateEntriesV01(f.db, f.config)[0]!;
    assert(state);
    assert.equal(
      state.bounded_state_summary,
      f.candidate.proposed_state_summary,
    );
    const stateRecord = readVNextCoreRecordV01(f.db, {
      ...f.config,
      record_kind: "semantic_state",
      record_id: state.state_ref.external_id,
    });
    assert(stateRecord);
    const content = (
      stateRecord.payload as {
        state_content: { proposed_state_summary: string };
      }
    ).state_content;
    assert.equal(
      content.proposed_state_summary,
      f.candidate.proposed_state_summary,
    );
    assert.equal(Object.hasOwn(content, "limitations"), false);
    assert.equal(Object.hasOwn(content, "uncertainties"), false);
    const replay = applyVNextOperatorPilotReviewedSemanticTransitionV01(f.db, {
      config: f.config,
      credential: applied.session_admission.credential,
      clock: f.clock,
      request,
    });
    assert.equal(replay.status, "exact_replay");
    assert.equal(f.count("review_decision"), 1);
    assert.equal(f.count("state_transition_receipt"), 1);
    assert.equal(validateRecoveryCanonicalDatabaseV01(f.db).status, "valid");
    const portable = exportActivePortableProjectV01(f.db, {
      include_personal_perspective: false,
      exported_at: f.clock.now(),
    });
    assert.deepEqual(
      portable.package.operator_provenance_sessions
        .map((session) => session.session_id)
        .sort(),
      [f.a.session_id, b.session_id].sort(),
    );
    assert.deepEqual(
      parseAndValidatePortableProjectV01(portable.bytes),
      portable.package,
    );
    cases.push("fresh_confirmation_gate_recovery_and_portable_reconstruction");
    const lineage = readVNextOperatorPilotProposalDurableLineageV01(f.db, {
      config: f.config,
      proposal: f.proposal,
      clock: f.clock,
    });
    assert(lineage);
    f.set("2026-07-11T09:05:00.000Z");
    f.revoke(b);
    assert.equal(validateRecoveryCanonicalDatabaseV01(f.db).status, "valid");
    assert.equal(
      validateVNextOperatorPilotSemanticGateConfirmationProvenanceV01(f.db, {
        config: f.config,
        proposal: f.proposal,
        decision: f.decision,
        gate,
      }).status,
      "valid",
    );
    cases.push(
      "session_A_decision_revoke_A_fresh_B_preview_confirm_apply_one_decision",
    );
  });

  fixture((f) => {
    // Expiration after the Decision is also historical, without revival of A.
    f.set("2026-07-11T17:01:00.000Z");
    const b = f.session();
    assert.equal(f.review(null).decision_history[0]?.status, "valid");
    assert.equal(f.preview(b).preview_is_write, false);
    cases.push(
      "expired_original_session_valid_historical_decision_fresh_preview",
    );
  });
  for (const field of ["workspace_id", "project_id", "operator_id"] as const)
    fixture((f) => {
      const b = fresh(f);
      const config = { ...f.config, [field]: `foreign:${field}` };
      rejected(
        f,
        `fresh_${field}_mismatch`,
        () =>
          prepareVNextOperatorPilotSemanticCommitPreviewV01(f.db, {
            config,
            credential: b,
            clock: f.clock,
            request: f.binding,
          }),
        /operator_session_scope_mismatch/,
      );
    });
  for (const [name, sql, values, code] of [
    [
      "missing_original_history",
      "DELETE FROM vnext_local_operator_sessions WHERE session_id = ?",
      [],
      "operator_pilot_decision_session_missing",
    ],
    [
      "decision_after_original_expiry",
      "UPDATE vnext_local_operator_sessions SET expires_at = ? WHERE session_id = ?",
      ["2026-07-11T08:59:59.000Z"],
      "operator_pilot_decision_outside_session_lifetime",
    ],
    [
      "decision_after_original_revocation",
      "UPDATE vnext_local_operator_sessions SET revoked_at = ? WHERE session_id = ?",
      ["2026-07-11T08:59:59.000Z"],
      "operator_pilot_decision_after_session_revocation",
    ],
  ] as const)
    fixture((f) => {
      const b = fresh(f);
      sessionFault(f, sql, [...values, f.a.session_id], () =>
        rejected(f, name, () => f.preview(b), new RegExp(code)),
      );
    });
  fixture((f) => {
    fresh(f);
    const decision = structuredClone(f.decision);
    decision.actor_ref.source_ref = `sha256:${"0".repeat(64)}`;
    const result = validateVNextOperatorPilotReviewDecisionProvenanceV01(f.db, {
      config: f.config,
      proposal: f.proposal,
      decision,
      authenticated_session_id: null,
    });
    assert.equal(result.status, "invalid");
    assert(
      result.errors.includes("operator_pilot_decision_actor_binding_invalid"),
    );
    cases.push("original_decision_provenance_tamper");
  });
  fixture((f) => {
    const b = fresh(f),
      preview = f.preview(b),
      c = f.session();
    rejected(
      f,
      "session_C_cannot_use_B_cookie",
      () => confirm(f, c, preview),
      /operator_pilot_preview_binding_(invalid|mismatch)/,
    );
    rejected(
      f,
      "confirmation_digest_changed",
      () =>
        confirm(f, b, {
          ...preview,
          preview: {
            ...preview.preview,
            confirmation_digest: `sha256:${"0".repeat(64)}`,
          },
        }),
      /operator_pilot_preview_binding_mismatch/,
    );
    rejected(
      f,
      "review_window_configuration_changed",
      () =>
        confirmVNextOperatorPilotSemanticCommitV01(f.db, {
          config: f.config,
          credential: b,
          clock: f.clock,
          preview_binding_cookie: preview.preview_binding_cookie,
          request: {
            ...f.binding,
            confirmation_digest: preview.preview.confirmation_digest,
          },
          review_window_config: readVNextOperatorPilotReviewWindowConfigV01({
            AUGNES_VNEXT_OPERATOR_PREVIEW_MAX_AGE_MS: "1800000",
          }),
        }),
      /operator_pilot_preview_binding_mismatch/,
    );
    f.set("2026-07-11T09:18:00.000Z");
    rejected(
      f,
      "expired_preview",
      () => confirm(f, b, preview),
      /semantic_commit_preview_confirmation_window_expired/,
    );
  });
  for (const kind of ["revoked", "expired"] as const)
    fixture((f) => {
      const b = fresh(f),
        preview = f.preview(b);
      if (kind === "revoked") {
        f.set("2026-07-11T09:03:00.000Z");
        f.revoke(b);
      } else f.set("2026-07-11T17:03:00.000Z");
      rejected(
        f,
        `fresh_confirmation_session_${kind}`,
        () => confirm(f, b, preview),
        new RegExp(`operator_session_${kind}`),
      );
      rejected(
        f,
        `fresh_review_session_${kind}`,
        () => f.review(b),
        new RegExp(`operator_session_${kind}`),
      );
    });
  fixture((f) => {
    const b = fresh(f),
      preview = f.preview(b);
    f.set("2026-07-11T09:03:00.000Z");
    const confirmed = confirm(f, b, preview);
    const c = f.session();
    rejected(
      f,
      "apply_wrong_confirmation_session",
      () => apply(f, c, confirmed.gate_record),
      /operator_pilot_gate_session_continuity_mismatch/,
    );
    rejected(
      f,
      "apply_mismatched_gate",
      () =>
        apply(f, confirmed.session_admission.credential, {
          ...confirmed.gate_record,
          integrity: {
            ...confirmed.gate_record.integrity,
            fingerprint: `sha256:${"0".repeat(64)}`,
          },
        }),
      /operator_pilot_gate_fingerprint_mismatch/,
    );
    const unknown = structuredClone(confirmed.gate_record);
    const basis = unknown.operator_confirmation_basis_refs!.find(
      (r) => r.ref_type === "local_operator_session_action",
    )!;
    basis.compatibility_namespace = "unknown.confirmation.v9";
    assert.equal(
      validateVNextOperatorPilotSemanticGateConfirmationProvenanceV01(f.db, {
        config: f.config,
        proposal: f.proposal,
        decision: f.decision,
        gate: unknown,
      }).status,
      "invalid",
    );
    cases.push("unsupported_confirmation_profile_refused");
    const legacy = structuredClone(confirmed.gate_record);
    legacy.operator_confirmation_basis_refs!.find(
      (r) => r.ref_type === "local_operator_session_action",
    )!.compatibility_namespace = "augnes.vnext.local-operator-session.v0.1";
    assert(
      validateVNextOperatorPilotSemanticGateConfirmationProvenanceV01(f.db, {
        config: f.config,
        proposal: f.proposal,
        decision: f.decision,
        gate: legacy,
      }).errors.includes("operator_pilot_gate_session_continuity_mismatch"),
    );
    cases.push("legacy_gate_still_requires_original_decision_session");
  });
  for (const stage of ["before_preview", "before_confirmation"] as const)
    fixture((f) => {
      const b = fresh(f),
        preview = stage === "before_confirmation" ? f.preview(b) : null;
      const c = f.session(),
        competing = f.preview(c);
      f.set("2026-07-11T09:03:00.000Z");
      const confirmed = confirm(f, c, competing);
      f.set("2026-07-11T09:04:00.000Z");
      apply(f, confirmed.session_admission.credential, confirmed.gate_record);
      rejected(
        f,
        `target_changed_${stage}`,
        () => (preview ? confirm(f, b, preview) : f.preview(b)),
        /pilot_add_requires_observed_absent_state/,
      );
      assert.notEqual(
        f.review(b).decision_application_summary.status,
        "ready_to_complete",
      );
    });
  fixture((f) => {
    const b = fresh(f),
      preview = f.preview(b);
    f.set("2026-07-11T09:03:00.000Z");
    const confirmed = confirm(f, b, preview);
    f.set("2026-07-11T09:04:00.000Z");
    // A distinct, explicitly authored fixture Decision supersedes the old one.
    // This is adversarial input, not an automatic continuation side effect.
    recordVNextOperatorPilotReviewDecisionV01(f.db, {
      config: f.config,
      credential: f.session(),
      clock: f.clock,
      request: {
        proposal_id: f.proposal.proposal_id,
        proposal_fingerprint: f.proposal.integrity.fingerprint,
        candidate_id: f.candidate.candidate_id,
        candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(
          f.candidate,
        ),
        decision: "reject",
        revisit: null,
        rationale_summary: "Synthetic explicit superseding review decision.",
      },
    });
    assert.equal(f.count("review_decision"), 2);
    rejected(
      f,
      "superseded_decision_cannot_preview",
      () => f.preview(confirmed.session_admission.credential),
      /operator_pilot_decision_not_current/,
    );
    rejected(
      f,
      "superseded_decision_cannot_apply_old_gate",
      () =>
        apply(f, confirmed.session_admission.credential, confirmed.gate_record),
      /operator_pilot_decision_not_current/,
    );
    assert.equal(f.count("state_transition_receipt"), 0);
  });
  fixture((f) => {
    const b = fresh(f);
    for (const field of [
      "proposal_fingerprint",
      "decision_fingerprint",
    ] as const)
      rejected(
        f,
        `fresh_action_changed_${field}`,
        () =>
          prepareVNextOperatorPilotSemanticCommitPreviewV01(f.db, {
            config: f.config,
            credential: b,
            clock: f.clock,
            request: { ...f.binding, [field]: `sha256:${"0".repeat(64)}` },
          }),
        /operator_pilot_(?:proposal_fingerprint_mismatch|decision_missing)/,
      );
    rejected(
      f,
      "fresh_action_cannot_change_candidate_operation",
      () =>
        prepareVNextOperatorPilotSemanticCommitPreviewV01(f.db, {
          config: f.config,
          credential: b,
          clock: f.clock,
          request: {
            ...f.binding,
            candidate_id: "other",
            operation: "replace",
          },
        }),
      /unknown|request|field/,
    );
    assert.equal(f.count("review_decision"), 1);
  });
} finally {
  assert.equal(guard.attempts.length, 0);
  guard.restore();
  rmSync(root, { recursive: true, force: true });
  assert.equal(existsSync(root), false);
}
console.log(
  JSON.stringify({
    status: "passed",
    cases,
    owned_resources_removed: true,
    provider_calls: 0,
  }),
);
