import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import Database from "better-sqlite3";

import { createVNextOperatorSemanticReviewHandlersV01 } from "@/app/api/vnext/operator/semantic-review/route";
import { createVNextOperatorSemanticTransitionHandlersV01 } from "@/app/api/vnext/operator/semantic-transition/route";
import { buildOperationalFrictionDisposableReviewFixtureV01 } from "@/fixtures/vnext/research/operational-friction-proposal-v0-1";
import {
  buildAIWorkplaneChangeReviewViewV01,
  buildAIWorkplaneQueueV01,
} from "@/lib/vnext/ai-workplane/ai-workplane-view";
import { buildSelectedWorkTimelineV01 } from "@/lib/vnext/ai-workplane/selected-work-timeline";
import { materializeOperationalFrictionProposalV01 } from "@/lib/vnext/operational-friction-proposal";
import {
  countVNextCoreRecordsV01,
  ensureVNextDurableSemanticStoreSchemaV01,
  insertVNextCoreRecordV01,
} from "@/lib/vnext/persistence/durable-semantic-store";
import { admitEpisodeDeltaProposalV01 } from "@/lib/vnext/persistence/episode-delta-proposal-admission";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01,
  VNEXT_LOCAL_OPERATOR_SESSION_SCHEMA_SQL_V01,
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  type VNextLocalOperatorPilotConfigV01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
} from "@/lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "@/lib/vnext/runtime/local-runtime-clock";
import { projectVNextOperatorPilotContinuityV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import { inspectVNextOperatorPilotCandidateAdmissionV01 } from "@/lib/vnext/runtime/operator-pilot-policy";
import {
  listVNextOperatorPilotSemanticReviewsV01,
  readVNextOperatorPilotSemanticReviewV01,
  recordVNextOperatorPilotReviewDecisionV01,
} from "@/lib/vnext/runtime/operator-pilot-review-material";
import { prepareVNextOperatorPilotSemanticCommitPreviewV01 } from "@/lib/vnext/runtime/operator-pilot-semantic-transition";
import { readVNextOperatorPilotProposalDurableLineageV01 } from "@/lib/vnext/runtime/operator-pilot-workbench-lineage";
import { readProjectVerifyReconciliationV01 } from "@/lib/vnext/runtime/project-verify-reconciliation";
import { readProjectVerifyLineageV01 } from "@/lib/vnext/runtime/project-verify-lineage";
import { createEpisodeDeltaCandidateFingerprintV01 } from "@/lib/vnext/review-decision";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import { validateRecoveryCanonicalDatabaseV01 } from "@/scripts/recovery-canonical-record-validator";

const TEST_CLOCK: VNextLocalRuntimeClockV01 = {
  now: () => "2026-07-19T00:00:00.000Z",
};

class DeterministicSecretSourceV01
  implements VNextLocalOperatorSecretSourceV01
{
  private cursor = 1;

  bytes(size: number): Uint8Array {
    const value = new Uint8Array(size);
    for (let index = 0; index < size; index += 1) {
      value[index] = (this.cursor + index) % 256;
    }
    this.cursor += size;
    return value;
  }
}

interface OperationalReviewFixtureV01 {
  db: Database.Database;
  config: VNextLocalOperatorPilotConfigV01;
  proposal: EpisodeDeltaProposalV01;
  credential: VNextLocalOperatorSessionCredentialV01;
  secret_source: DeterministicSecretSourceV01;
}

async function main(): Promise<void> {
  assertPolicyAndAuthenticatedDecisionFlowV01();
  assertRejectAndDeferV01();
  assertProposalOnlyTerminalDecisionBoundaryV01();
  await assertExistingRoutesV01();
  assertSourcePurityV01();
  console.log(
    JSON.stringify(
      {
        suite: "vnext-operational-proposal-review-v0.1",
        status: "passed",
        canonical_admission_verified: true,
        ordinary_readback_write_path_provenance:
          "not_serialized_not_reprovable",
        proposal_only_accept_review_decision: true,
        proposal_only_terminal_decision_gate: true,
        terminal_refusal_preserves_nonce: true,
        defer_revisit_remains_available: true,
        accepted_proposal_only: true,
        semantic_transition_firewall: true,
        durable_effect_counts: "passed",
        real_provider_calls: 0,
      },
      null,
      2,
    ),
  );
}

function assertPolicyAndAuthenticatedDecisionFlowV01(): void {
  const fixture = createOperationalReviewFixtureV01(":memory:");
  const { db, config, proposal, secret_source: secretSource } = fixture;
  let credential = fixture.credential;
  try {
    const proposalBefore = canonicalizeProtocolValueV01(proposal);
    const candidate = proposal.proposed_deltas[0]!;
    const candidateFingerprint =
      createEpisodeDeltaCandidateFingerprintV01(candidate);
    const admission = inspectVNextOperatorPilotCandidateAdmissionV01(db, {
      config,
      proposal,
      candidate,
      candidate_fingerprint: candidateFingerprint,
    });
    assert.deepEqual(
      {
        review_mode: admission.review_mode,
        accept_effect: admission.accept_effect,
        current_state: admission.current_state_status,
        current_state_applicability:
          admission.semantic_current_state_applicability,
        transition_applicable: admission.semantic_transition_applicable,
        activation_owner_present: admission.activation_owner_present,
        decision_allowed: admission.decision_allowed,
        mapped_operation: admission.mapped_operation,
        accept_operation: admission.accept_operation,
      },
      {
        review_mode: "proposal_only_no_activation",
        accept_effect: "records_judgment_only",
        current_state: "not_applicable",
        current_state_applicability: "not_applicable",
        transition_applicable: false,
        activation_owner_present: false,
        decision_allowed: { accept: true, reject: true, defer: true },
        mapped_operation: null,
        accept_operation: null,
      },
    );
    assert.equal(proposal.source_status.currentness, "unknown");

    const genericUnknown = structuredClone(proposal);
    delete genericUnknown.operational_friction_proposal;
    const genericAdmission = inspectVNextOperatorPilotCandidateAdmissionV01(
      db,
      {
        config,
        proposal: genericUnknown,
        candidate: genericUnknown.proposed_deltas[0]!,
        candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(
          genericUnknown.proposed_deltas[0]!,
        ),
      },
    );
    assert.equal(genericAdmission.review_mode, "semantic_transition");
    assert.equal(genericAdmission.decision_allowed.accept, false);
    assert.ok(
      genericAdmission.blocking_reasons.includes(
        "pilot_candidate_operation_not_transitionable",
      ),
    );

    const nonCanonicalDb = new Database(":memory:");
    try {
      initializeDbV01(nonCanonicalDb);
      assert.throws(
        () =>
          inspectVNextOperatorPilotCandidateAdmissionV01(nonCanonicalDb, {
            config,
            proposal,
            candidate,
            candidate_fingerprint: candidateFingerprint,
          }),
        /operator_pilot_operational_admission_not_canonical/u,
      );
    } finally {
      nonCanonicalDb.close();
    }

    const detailBefore = readVNextOperatorPilotSemanticReviewV01(db, {
      config,
      proposal_id: proposal.proposal_id,
      authenticated_session_id: credential.session_id,
    });
    assert.equal(detailBefore.criterion_specific_relations_source_bound, false);
    assert.equal(
      detailBefore.operational_friction_review?.status,
      "canonical_admission_verified",
    );
    assert.equal(
      detailBefore.operational_friction_review
        ?.ordinary_readback_rehydrates_upstream_sources,
      false,
    );
    assert.equal(
      detailBefore.operational_friction_review
        ?.canonical_admission_identity_verified,
      true,
    );
    assert.equal(
      detailBefore.operational_friction_review
        ?.canonical_writer_requires_exact_source_rematerialization,
      true,
    );
    assert.equal(
      detailBefore.operational_friction_review?.write_path_provenance,
      "not_serialized_not_reprovable",
    );
    assert.equal(
      "write_time_source_rematerialization_bound" in
        detailBefore.operational_friction_review!,
      false,
    );
    assert.equal(detailBefore.decision_application_summary.status, "needs_decision");
    assert.equal(
      listVNextOperatorPilotSemanticReviewsV01(db, {
        config,
        authenticated_session_id: credential.session_id,
      })[0]?.operational_friction_review?.review_mode,
      "proposal_only_no_activation",
    );

    const baseline = durableEffectSnapshotV01(db);
    const acceptRequest = decisionRequestV01(
      proposal,
      candidate,
      "accept",
    );
    const accepted = recordVNextOperatorPilotReviewDecisionV01(db, {
      config,
      credential,
      request: acceptRequest,
      clock: TEST_CLOCK,
      secret_source: secretSource,
    });
    credential = credentialFromCookieValueV01(accepted.session_cookie.value);
    assert.equal(accepted.status, "inserted");
    assert.equal(accepted.decision.decision, "accept");
    assert.equal(accepted.decision.requested_transition_intent, null);
    assert.equal(accepted.transition_requested, false);
    assert.equal(accepted.transition_applied, false);
    assert.equal(accepted.activation_requested, false);
    assert.equal(
      accepted.decision.compatibility.warnings.some((warning) =>
        warning.includes("proposal-only judgment"),
      ),
      true,
    );
    assertDurableDeltaV01(baseline, durableEffectSnapshotV01(db), {
      episode_delta_proposal: 0,
      review_decision: 1,
    });
    assert.equal(
      canonicalizeProtocolValueV01(
        readVNextOperatorPilotSemanticReviewV01(db, {
          config,
          proposal_id: proposal.proposal_id,
          authenticated_session_id: credential.session_id,
        }).proposal,
      ),
      proposalBefore,
    );

    const replayBaseline = durableEffectSnapshotV01(db);
    const replay = recordVNextOperatorPilotReviewDecisionV01(db, {
      config,
      credential,
      request: acceptRequest,
      clock: TEST_CLOCK,
      secret_source: secretSource,
    });
    credential = credentialFromCookieValueV01(replay.session_cookie.value);
    assert.equal(replay.status, "exact_replay");
    assert.deepEqual(replay.decision, accepted.decision);
    assertDurableDeltaV01(replayBaseline, durableEffectSnapshotV01(db), {
      episode_delta_proposal: 0,
      review_decision: 0,
    });

    assert.throws(
      () =>
        prepareVNextOperatorPilotSemanticCommitPreviewV01(db, {
          config,
          credential,
          request: {
            proposal_id: proposal.proposal_id,
            proposal_fingerprint: proposal.integrity.fingerprint,
            decision_id: accepted.decision.decision_id,
            decision_fingerprint: accepted.decision.integrity.fingerprint,
          },
          clock: TEST_CLOCK,
        }),
      /operator_pilot_operational_transition_not_applicable/u,
    );

    db.exec("BEGIN IMMEDIATE");
    try {
      const forgedReceiptFingerprint = createProtocolSha256V01(
        "acgc4b-forged-operational-transition-receipt",
      );
      insertVNextCoreRecordV01(db, {
        record_kind: "state_transition_receipt",
        record_id: "state-transition-receipt:acgc4b-forged-claim",
        workspace_id: config.workspace_id,
        project_id: config.project_id,
        fingerprint: forgedReceiptFingerprint,
        idempotency_key: null,
        payload: {
          source_proposal: {
            proposal_id: proposal.proposal_id,
            proposal_fingerprint: proposal.integrity.fingerprint,
          },
          source_candidate: {
            candidate_id: candidate.candidate_id,
            candidate_fingerprint: candidateFingerprint,
          },
          source_decision: {
            decision_id: accepted.decision.decision_id,
            decision_fingerprint: accepted.decision.integrity.fingerprint,
          },
        },
        created_at: "2026-07-19T00:00:01.000Z",
      });
      assert.throws(
        () =>
          readVNextOperatorPilotSemanticReviewV01(db, {
            config,
            proposal_id: proposal.proposal_id,
            authenticated_session_id: credential.session_id,
          }),
        /operator_pilot_operational_transition_conflict/u,
      );
    } finally {
      db.exec("ROLLBACK");
    }

    for (const [index, decision] of proposal.proposed_deltas
      .slice(1)
      .map((item, index) => [index, item] as const)) {
      if (index === 0 || index === 1) {
        const forbidden = index === 0 ? "supersede" : "retract";
        assert.throws(
          () =>
            recordVNextOperatorPilotReviewDecisionV01(db, {
              config,
              credential,
              request: decisionRequestV01(proposal, decision, forbidden),
              clock: TEST_CLOCK,
              secret_source: secretSource,
            }),
          /operator_pilot_proposal_only_decision_not_allowed/u,
        );
      }
      const rejected = recordVNextOperatorPilotReviewDecisionV01(db, {
        config,
        credential,
        request: decisionRequestV01(proposal, decision, "reject"),
        clock: TEST_CLOCK,
        secret_source: secretSource,
      });
      credential = credentialFromCookieValueV01(rejected.session_cookie.value);
      assert.equal(rejected.decision.requested_transition_intent, null);
    }

    const settled = readVNextOperatorPilotSemanticReviewV01(db, {
      config,
      proposal_id: proposal.proposal_id,
      authenticated_session_id: credential.session_id,
    });
    assert.equal(
      settled.decision_application_summary.status,
      "accepted_proposal_only",
    );
    assert.equal(
      settled.decision_application_summary.effective_decision
        ?.requested_project_change,
      false,
    );
    assert.equal(
      settled.decision_application_summary.applying_decision_pending,
      false,
    );
    assert.equal(
      settled.decision_application_summary.matching_transition_receipt_present,
      false,
    );
    const continuity = projectVNextOperatorPilotContinuityV01(db, {
      config,
      clock: TEST_CLOCK,
    });
    assert.equal(continuity.pending_proposal_count, 0);
    assert.equal(continuity.pending_accepted_decision_count, 0);
    assertNoTransitionOrActivationDurableEffectsV01(db);
    assertOperationalRecoveryRoundTripV01(db, proposal.proposal_id);
  } finally {
    db.close();
  }
}

function assertRejectAndDeferV01(): void {
  for (const decision of ["reject", "defer"] as const) {
    const fixture = createOperationalReviewFixtureV01(":memory:");
    try {
      const candidate = fixture.proposal.proposed_deltas[0]!;
      const result = recordVNextOperatorPilotReviewDecisionV01(fixture.db, {
        config: fixture.config,
        credential: fixture.credential,
        request: decisionRequestV01(fixture.proposal, candidate, decision),
        clock: TEST_CLOCK,
        secret_source: fixture.secret_source,
      });
      assert.equal(result.status, "inserted");
      assert.equal(result.decision.decision, decision);
      assert.equal(result.decision.requested_transition_intent, null);
      assert.equal(result.transition_requested, false);
      assert.equal(result.activation_requested, false);
      assert.equal(result.decision.revisit !== null, decision === "defer");
      if (decision === "defer") {
        const detail = readVNextOperatorPilotSemanticReviewV01(fixture.db, {
          config: fixture.config,
          proposal_id: fixture.proposal.proposal_id,
          authenticated_session_id: fixture.credential.session_id,
        });
        const selected = detail.candidates.find(
          (item) => item.candidate.candidate_id === candidate.candidate_id,
        );
        assert(selected);
        const projectionObservedAt = TEST_CLOCK.now();
        const timeline = buildSelectedWorkTimelineV01({
          read: {
            ...detail,
            projection_observed_at: projectionObservedAt,
            durable_lineage:
              readVNextOperatorPilotProposalDurableLineageV01(fixture.db, {
                config: fixture.config,
                proposal: fixture.proposal,
                clock: TEST_CLOCK,
              }),
            project_continuity: projectVNextOperatorPilotContinuityV01(
              fixture.db,
              { config: fixture.config, clock: TEST_CLOCK },
            ),
            project_verify_reconciliation:
              readProjectVerifyReconciliationV01(fixture.db, {
                workspace_id: fixture.config.workspace_id,
                project_id: fixture.config.project_id,
                observed_at: projectionObservedAt,
              }),
            project_verify_lineage: readProjectVerifyLineageV01(fixture.db, {
              workspace_id: fixture.config.workspace_id,
              project_id: fixture.config.project_id,
              observed_at: projectionObservedAt,
              lookup: {
                lookup_kind: "proposal",
                proposal_id: fixture.proposal.proposal_id,
                expected_fingerprint: fixture.proposal.integrity.fingerprint,
              },
            }),
          },
          selected_candidate: selected,
        });
        assert.equal(
          timeline.current_position.primary_action_owner,
          "candidate_selection",
        );
      }
      assertNoTransitionOrActivationDurableEffectsV01(fixture.db);
    } finally {
      fixture.db.close();
    }
  }
}

function assertProposalOnlyTerminalDecisionBoundaryV01(): void {
  for (const terminalDecision of ["accept", "reject"] as const) {
    const fixture = createOperationalReviewFixtureV01(":memory:");
    let credential = fixture.credential;
    try {
      const candidate = fixture.proposal.proposed_deltas[0]!;
      const otherCandidate = fixture.proposal.proposed_deltas[1]!;
      const terminalRequest = decisionRequestV01(
        fixture.proposal,
        candidate,
        terminalDecision,
      );
      const terminal = recordVNextOperatorPilotReviewDecisionV01(fixture.db, {
        config: fixture.config,
        credential,
        request: terminalRequest,
        clock: TEST_CLOCK,
        secret_source: fixture.secret_source,
      });
      credential = credentialFromCookieValueV01(terminal.session_cookie.value);
      assert.equal(terminal.status, "inserted");

      const replayBaseline = durableEffectSnapshotV01(fixture.db);
      const replay = recordVNextOperatorPilotReviewDecisionV01(fixture.db, {
        config: fixture.config,
        credential,
        request: terminalRequest,
        clock: TEST_CLOCK,
        secret_source: fixture.secret_source,
      });
      credential = credentialFromCookieValueV01(replay.session_cookie.value);
      assert.equal(replay.status, "exact_replay");
      assert.deepEqual(replay.decision, terminal.decision);
      assertDurableDeltaV01(
        replayBaseline,
        durableEffectSnapshotV01(fixture.db),
        { episode_delta_proposal: 0, review_decision: 0 },
      );

      const refusalBaseline = durableEffectSnapshotV01(fixture.db);
      for (const laterDecision of [
        "accept",
        "reject",
        "defer",
        "supersede",
        "retract",
      ] as const) {
        const distinctRequest = decisionRequestV01(
          fixture.proposal,
          candidate,
          laterDecision,
        );
        if (laterDecision === terminalDecision) {
          distinctRequest.rationale_summary =
            `Distinct later ACGC4B ${laterDecision} judgment.`;
        }
        assert.throws(
          () =>
            recordVNextOperatorPilotReviewDecisionV01(fixture.db, {
              config: fixture.config,
              credential,
              request: distinctRequest,
              clock: TEST_CLOCK,
              secret_source: fixture.secret_source,
            }),
          /operator_pilot_proposal_only_candidate_already_settled/u,
        );
      }
      assertDurableDeltaV01(
        refusalBaseline,
        durableEffectSnapshotV01(fixture.db),
        { episode_delta_proposal: 0, review_decision: 0 },
      );

      const otherCandidateResult =
        recordVNextOperatorPilotReviewDecisionV01(fixture.db, {
          config: fixture.config,
          credential,
          request: decisionRequestV01(
            fixture.proposal,
            otherCandidate,
            "reject",
          ),
          clock: TEST_CLOCK,
          secret_source: fixture.secret_source,
        });
      assert.equal(otherCandidateResult.status, "inserted");
      assert.equal(otherCandidateResult.decision.decision, "reject");
    } finally {
      fixture.db.close();
    }
  }

  const deferredFixture = createOperationalReviewFixtureV01(":memory:");
  try {
    const candidate = deferredFixture.proposal.proposed_deltas[0]!;
    const deferred = recordVNextOperatorPilotReviewDecisionV01(
      deferredFixture.db,
      {
        config: deferredFixture.config,
        credential: deferredFixture.credential,
        request: decisionRequestV01(
          deferredFixture.proposal,
          candidate,
          "defer",
        ),
        clock: TEST_CLOCK,
        secret_source: deferredFixture.secret_source,
      },
    );
    const later = recordVNextOperatorPilotReviewDecisionV01(
      deferredFixture.db,
      {
        config: deferredFixture.config,
        credential: credentialFromCookieValueV01(
          deferred.session_cookie.value,
        ),
        request: decisionRequestV01(
          deferredFixture.proposal,
          candidate,
          "accept",
        ),
        clock: {
          now: () => "2026-07-19T00:00:01.000Z",
        },
        secret_source: deferredFixture.secret_source,
      },
    );
    assert.equal(later.status, "inserted");
    assert.equal(later.decision.decision, "accept");
    assert.equal(later.decision.requested_transition_intent, null);
  } finally {
    deferredFixture.db.close();
  }
}

async function assertExistingRoutesV01(): Promise<void> {
  const directory = mkdtempSync(path.join(os.tmpdir(), "augnes-acgc4b-"));
  const databasePath = path.join(directory, "operator.sqlite");
  const fixture = createOperationalReviewFixtureV01(databasePath);
  const environment: NodeJS.ProcessEnv = {
    NODE_ENV: "test",
    AUGNES_VNEXT_OPERATOR_PILOT_ENABLED: "1",
    AUGNES_VNEXT_OPERATOR_WORKSPACE_ID: fixture.config.workspace_id,
    AUGNES_VNEXT_OPERATOR_PROJECT_ID: fixture.config.project_id,
    AUGNES_VNEXT_OPERATOR_ID: fixture.config.operator_id,
    AUGNES_DB_PATH: databasePath,
  };
  let cookie = `${VNEXT_LOCAL_OPERATOR_SESSION_COOKIE_V01}=${serializeCredentialV01(
    fixture.credential,
  )}`;
  const proposal = fixture.proposal;
  const candidate = proposal.proposed_deltas[0]!;
  fixture.db.close();
  try {
    const reviewHandlers = createVNextOperatorSemanticReviewHandlersV01({
      environment,
      clock: TEST_CLOCK,
      secret_source: fixture.secret_source,
    });
    const list = await reviewHandlers.GET(
      localRequestV01("/api/vnext/operator/semantic-review", { cookie }),
    );
    assert.equal(list.status, 200);
    assertSecurityHeadersV01(list);
    const listBody = await list.json();
    assert.equal(listBody.status, "proposal_list");
    assert.equal(
      listBody.proposals[0].operational_friction_review.status,
      "canonical_admission_verified",
    );

    const detail = await reviewHandlers.GET(
      localRequestV01(
        `/api/vnext/operator/semantic-review?proposal_id=${encodeURIComponent(
          proposal.proposal_id,
        )}`,
        { cookie },
      ),
    );
    assert.equal(detail.status, 200);
    assertSecurityHeadersV01(detail);
    const detailBody = await detail.json();
    assert.equal(
      detailBody.proposal.operational_friction_review.review_mode,
      "proposal_only_no_activation",
    );
    const beforeDecisionView = buildAIWorkplaneChangeReviewViewV01({
      read: detailBody.proposal,
      selected_candidate_id: candidate.candidate_id,
    });
    assert.equal(
      beforeDecisionView.operation_label,
      "Accept an operational hypothesis for review only",
    );
    assert.equal(beforeDecisionView.primary_action?.kind, "save_decision");
    assertOperationalUiSourceContractV01();

    const invalid = await reviewHandlers.POST(
      localRequestV01("/api/vnext/operator/semantic-review", {
        method: "POST",
        cookie,
        body: {
          ...decisionRequestV01(proposal, candidate, "accept"),
          review_mode: "proposal_only_no_activation",
        },
      }),
    );
    assert.equal(invalid.status, 400);
    assertSecurityHeadersV01(invalid);
    assert.equal(
      (await invalid.json()).error_code,
      "operator_pilot_decision_body_unknown_field",
    );

    const accepted = await reviewHandlers.POST(
      localRequestV01("/api/vnext/operator/semantic-review", {
        method: "POST",
        cookie,
        body: decisionRequestV01(proposal, candidate, "accept"),
      }),
    );
    assert.equal(accepted.status, 201);
    assertSecurityHeadersV01(accepted);
    const acceptedBody = await accepted.json();
    assert.equal(acceptedBody.transition_requested, false);
    assert.equal(acceptedBody.transition_applied, false);
    assert.equal(acceptedBody.activation_requested, false);
    assert.equal(acceptedBody.decision.requested_transition_intent, null);
    cookie = accepted.headers.get("set-cookie")!.split(";", 1)[0]!;

    const terminalRefusal = await reviewHandlers.POST(
      localRequestV01("/api/vnext/operator/semantic-review", {
        method: "POST",
        cookie,
        body: decisionRequestV01(proposal, candidate, "reject"),
      }),
    );
    assert.equal(terminalRefusal.status, 409);
    assertSecurityHeadersV01(terminalRefusal);
    assert.equal(
      (await terminalRefusal.json()).error_code,
      "operator_pilot_proposal_only_candidate_already_settled",
    );
    assert.equal(terminalRefusal.headers.get("set-cookie"), null);

    const acceptedDetail = await reviewHandlers.GET(
      localRequestV01(
        `/api/vnext/operator/semantic-review?proposal_id=${encodeURIComponent(
          proposal.proposal_id,
        )}`,
        { cookie },
      ),
    );
    assert.equal(acceptedDetail.status, 200);
    const acceptedDetailBody = await acceptedDetail.json();
    const acceptedSelected = acceptedDetailBody.proposal.candidates.find(
      (item: { candidate: { candidate_id: string } }) =>
        item.candidate.candidate_id === candidate.candidate_id,
    );
    assert(acceptedSelected);
    const acceptedTimeline = buildSelectedWorkTimelineV01({
      read: acceptedDetailBody.proposal,
      selected_candidate: acceptedSelected,
    });
    assert.equal(acceptedTimeline.current_position.stage, "proposal_only_accepted");
    assert.equal(
      acceptedTimeline.current_position.primary_action_owner,
      "candidate_selection",
    );
    assert.match(acceptedTimeline.current_position.title, /project unchanged/u);
    const acceptedView = buildAIWorkplaneChangeReviewViewV01({
      read: acceptedDetailBody.proposal,
      selected_candidate_id: candidate.candidate_id,
    });
    assert.equal(acceptedView.decision_status, "accepted_proposal_only");
    assert.equal(acceptedView.primary_action, null);

    const transitionHandlers =
      createVNextOperatorSemanticTransitionHandlersV01({
        environment,
        clock: TEST_CLOCK,
        secret_source: fixture.secret_source,
      });
    const query = new URLSearchParams({
      proposal_id: proposal.proposal_id,
      proposal_fingerprint: proposal.integrity.fingerprint,
      decision_id: acceptedBody.decision.decision_id,
      decision_fingerprint: acceptedBody.decision.integrity.fingerprint,
    });
    const preview = await transitionHandlers.GET(
      localRequestV01(
        `/api/vnext/operator/semantic-transition?${query.toString()}`,
        { cookie },
      ),
    );
    assert.equal(preview.status, 409);
    assertSecurityHeadersV01(preview);
    assert.equal(
      (await preview.json()).error_code,
      "operator_pilot_operational_transition_not_applicable",
    );

    for (const remaining of proposal.proposed_deltas.slice(1)) {
      const response = await reviewHandlers.POST(
        localRequestV01("/api/vnext/operator/semantic-review", {
          method: "POST",
          cookie,
          body: decisionRequestV01(proposal, remaining, "reject"),
        }),
      );
      assert.equal(response.status, 201);
      cookie = response.headers.get("set-cookie")!.split(";", 1)[0]!;
    }
    const settledList = await reviewHandlers.GET(
      localRequestV01("/api/vnext/operator/semantic-review", { cookie }),
    );
    assert.equal(settledList.status, 200);
    const settledListBody = await settledList.json();
    assert.equal(
      settledListBody.proposals[0].decision_application_summary.status,
      "accepted_proposal_only",
    );
    assert.equal(
      buildAIWorkplaneQueueV01(settledListBody.proposals).length,
      0,
    );
    assert.equal(settledListBody.project_continuity.pending_proposal_count, 0);
    assert.equal(
      settledListBody.project_continuity.pending_accepted_decision_count,
      0,
    );

    const db = new Database(databasePath, { fileMustExist: true });
    try {
      assertNoTransitionOrActivationDurableEffectsV01(db);
    } finally {
      db.close();
    }
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

function createOperationalReviewFixtureV01(
  databasePath: string,
): OperationalReviewFixtureV01 {
  const db = new Database(databasePath);
  initializeDbV01(db);
  const fixture = buildOperationalFrictionDisposableReviewFixtureV01();
  const source = fixture.materialization_source;
  const expected = materializeOperationalFrictionProposalV01(source);
  const latest = fixture.exact_source_records.at(-1)!;
  insertVNextCoreRecordV01(db, {
    record_kind: "run_receipt",
    record_id: latest.later_task_run_receipt.receipt_id,
    workspace_id: latest.later_task_run_receipt.workspace_id,
    project_id: latest.later_task_run_receipt.project_id,
    fingerprint: latest.later_task_run_receipt.integrity.fingerprint,
    idempotency_key: latest.later_task_run_receipt.idempotency_key,
    payload: latest.later_task_run_receipt,
    created_at: latest.later_task_run_receipt.recorded_at,
  });
  const beforeAdmission = durableEffectSnapshotV01(db);
  const write = admitEpisodeDeltaProposalV01(db, { expected, source });
  assert.equal(write.status, "inserted");
  assertDurableDeltaV01(beforeAdmission, durableEffectSnapshotV01(db), {
    episode_delta_proposal: 1,
    review_decision: 0,
  });
  const config: VNextLocalOperatorPilotConfigV01 = {
    enabled: true,
    workspace_id: source.workspace_id,
    project_id: source.project_id,
    operator_id: "operator:acgc4b-disposable-review",
    database_path:
      databasePath === ":memory:"
        ? path.join(os.tmpdir(), "acgc4b-in-memory-never-opened.sqlite")
        : databasePath,
  };
  const secretSource = new DeterministicSecretSourceV01();
  const issue = issueVNextLocalOperatorBootstrapV01(db, {
    config,
    clock: TEST_CLOCK,
    secret_source: secretSource,
  });
  const admission = consumeVNextLocalOperatorBootstrapV01(db, {
    config,
    bootstrap_token: issue.bootstrap_token,
    clock: TEST_CLOCK,
    secret_source: secretSource,
  });
  return {
    db,
    config,
    proposal: write.proposal,
    credential: admission.credential,
    secret_source: secretSource,
  };
}

function assertOperationalUiSourceContractV01(): void {
  const form = readFileSync(
    "components/workbench/semantic-review/review-decision-form.tsx",
    "utf8",
  );
  const detail = readFileSync(
    "components/workbench/semantic-review/decision-centered-proposal-detail.tsx",
    "utf8",
  );
  assert.match(form, /Accept this operational hypothesis/u);
  assert.match(form, /The project is not changed/u);
  assert.match(form, /no semantic Transition follows/u);
  assert.match(form, /no operational activation follows in ACGC4B/u);
  assert.match(detail, /Operation domain/u);
  assert.match(detail, /Target class/u);
  assert.match(detail, /no\s+activation owner/u);
  assert.match(
    detail,
    /primary_action_owner === "transition"/u,
  );
}

function initializeDbV01(db: Database.Database): void {
  ensureVNextDurableSemanticStoreSchemaV01(db);
  db.exec(VNEXT_LOCAL_OPERATOR_SESSION_SCHEMA_SQL_V01);
}

function assertOperationalRecoveryRoundTripV01(
  sourceDb: Database.Database,
  proposalId: string,
): void {
  const recoveryDb = new Database(":memory:");
  try {
    ensureVNextDurableSemanticStoreSchemaV01(recoveryDb);
    const records = sourceDb
      .prepare(
        `SELECT record_kind, record_id, workspace_id, project_id, fingerprint,
                idempotency_key, payload_json, created_at
           FROM vnext_core_records
          WHERE (record_kind = 'episode_delta_proposal' AND record_id = ?)
             OR (record_kind = 'review_decision'
                 AND instr(payload_json, ?) > 0)
          ORDER BY record_kind, record_id`,
      )
      .all(proposalId, proposalId) as Array<{
      record_kind: "episode_delta_proposal" | "review_decision";
      record_id: string;
      workspace_id: string;
      project_id: string;
      fingerprint: string;
      idempotency_key: string | null;
      payload_json: string;
      created_at: string;
    }>;
    for (const record of records) {
      insertVNextCoreRecordV01(recoveryDb, {
        record_kind: record.record_kind,
        record_id: record.record_id,
        workspace_id: record.workspace_id,
        project_id: record.project_id,
        fingerprint: record.fingerprint,
        idempotency_key: record.idempotency_key,
        payload: JSON.parse(record.payload_json),
        created_at: record.created_at,
      });
    }
    assert.deepEqual(validateRecoveryCanonicalDatabaseV01(recoveryDb), {
      contract: "augnes.recovery-canonical-record-validator.v1",
      contract_version: 1,
      status: "valid",
      code: "canonical_records_valid",
      record_count: records.length,
    });
  } finally {
    recoveryDb.close();
  }
}

function decisionRequestV01(
  proposal: EpisodeDeltaProposalV01,
  candidate: EpisodeDeltaProposalV01["proposed_deltas"][number],
  decision: "accept" | "reject" | "defer" | "supersede" | "retract",
) {
  return {
    proposal_id: proposal.proposal_id,
    proposal_fingerprint: proposal.integrity.fingerprint,
    candidate_id: candidate.candidate_id,
    candidate_fingerprint: createEpisodeDeltaCandidateFingerprintV01(candidate),
    decision,
    rationale_summary: `Bounded disposable ACGC4B ${decision} judgment.`,
    ...(decision === "defer"
      ? {
          revisit: {
            condition_summary:
              "Review again when bounded operational verification is available.",
          },
        }
      : {}),
  };
}

function serializeCredentialV01(
  credential: VNextLocalOperatorSessionCredentialV01,
): string {
  return [
    "vnext_session_v01",
    credential.session_id,
    credential.session_secret,
    credential.action_nonce,
  ].join(".");
}

function credentialFromCookieValueV01(
  value: string,
): VNextLocalOperatorSessionCredentialV01 {
  const [prefix, sessionId, sessionSecret, actionNonce] = value.split(".");
  assert.equal(prefix, "vnext_session_v01");
  assert(sessionId && sessionSecret && actionNonce);
  return {
    session_id: sessionId,
    session_secret: sessionSecret,
    action_nonce: actionNonce,
  };
}

function durableEffectSnapshotV01(db: Database.Database) {
  const coreKinds = Object.fromEntries(
    [
      "episode_delta_proposal",
      "review_decision",
      "semantic_commit_gate",
      "semantic_state",
      "state_transition_receipt",
      "task_context_packet",
      "run_receipt",
      "context_use_review",
    ].map((recordKind) => [
      recordKind,
      countVNextCoreRecordsV01(db, {
        record_kind: recordKind as Parameters<
          typeof countVNextCoreRecordsV01
        >[1] extends { record_kind?: infer T }
          ? T
          : never,
      }),
    ]),
  ) as Record<string, number>;
  const tables = db
    .prepare(
      `SELECT name FROM sqlite_master
       WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
       ORDER BY name`,
    )
    .all() as Array<{ name: string }>;
  const nonCoreTables = Object.fromEntries(
    tables
      .filter(
        ({ name }) =>
          name !== "vnext_core_records" &&
          name !== "vnext_local_operator_sessions",
      )
      .map(({ name }) => [
        name,
        (db.prepare(`SELECT COUNT(*) AS count FROM "${name}"`).get() as {
          count: number;
        }).count,
      ]),
  );
  return { coreKinds, nonCoreTables };
}

function assertDurableDeltaV01(
  before: ReturnType<typeof durableEffectSnapshotV01>,
  after: ReturnType<typeof durableEffectSnapshotV01>,
  expected: {
    episode_delta_proposal: number;
    review_decision: number;
  },
): void {
  assert.equal(
    after.coreKinds.episode_delta_proposal -
      before.coreKinds.episode_delta_proposal,
    expected.episode_delta_proposal,
  );
  assert.equal(
    after.coreKinds.review_decision - before.coreKinds.review_decision,
    expected.review_decision,
  );
  for (const kind of Object.keys(before.coreKinds)) {
    if (kind === "episode_delta_proposal" || kind === "review_decision") {
      continue;
    }
    assert.equal(after.coreKinds[kind], before.coreKinds[kind], kind);
  }
  assert.deepEqual(after.nonCoreTables, before.nonCoreTables);
}

function assertNoTransitionOrActivationDurableEffectsV01(
  db: Database.Database,
): void {
  for (const kind of [
    "semantic_commit_gate",
    "semantic_state",
    "state_transition_receipt",
    "task_context_packet",
    "context_use_review",
  ] as const) {
    assert.equal(countVNextCoreRecordsV01(db, { record_kind: kind }), 0, kind);
  }
  for (const table of [
    "vnext_semantic_state_entries",
    "vnext_semantic_target_heads",
  ]) {
    assert.equal(
      (db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as {
        count: number;
      }).count,
      0,
      table,
    );
  }
}

function localRequestV01(
  resource: string,
  input: {
    method?: "GET" | "POST";
    cookie: string;
    body?: unknown;
  },
): Request {
  const method = input.method ?? "GET";
  return new Request(`http://127.0.0.1:3000${resource}`, {
    method,
    headers: {
      host: "127.0.0.1:3000",
      cookie: input.cookie,
      ...(method === "POST"
        ? {
            origin: "http://127.0.0.1:3000",
            "sec-fetch-site": "same-origin",
            "content-type": "application/json",
          }
        : {}),
    },
    ...(method === "POST" ? { body: JSON.stringify(input.body) } : {}),
  });
}

function assertSecurityHeadersV01(response: Response): void {
  assert.equal(response.headers.get("cache-control"), "no-store, max-age=0");
  assert.equal(response.headers.get("pragma"), "no-cache");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
}

function assertSourcePurityV01(): void {
  for (const file of [
    "lib/vnext/operational-friction-proposal.ts",
    "lib/vnext/persistence/episode-delta-proposal-admission.ts",
    "lib/vnext/runtime/operator-pilot-policy.ts",
  ]) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /\bfetch\s*\(/u, file);
    assert.doesNotMatch(source, /from\s+["'][^"']*model-gateway/iu, file);
    assert.doesNotMatch(source, /from\s+["'][^"']*provider/iu, file);
    assert.doesNotMatch(source, /from\s+["'][^"']*github/iu, file);
    assert.doesNotMatch(source, /managed-(?:start|resume)/iu, file);
    assert.doesNotMatch(source, /\bprocess\.(?:env|cwd|argv)/u, file);
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
