import assert from "node:assert/strict";

import {
  buildSemanticReviewLoopMaterialFixture,
  semanticReviewLoopProjectAFixture,
  semanticReviewLoopProjectBFixture,
  semanticReviewLoopTaskContextPacketRefFixture,
  type SemanticReviewLoopProjectFixtureV01,
} from "@/fixtures/vnext/protocol/semantic-review-loop-v0-1";
import {
  createEpisodeDeltaProposalFingerprintV01,
  deriveEpisodeDeltaProposalIdV01,
  validateEpisodeDeltaProposalV01,
} from "@/lib/vnext/episode-delta-proposal";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  buildReviewDecisionV01,
  createEpisodeDeltaCandidateFingerprintV01,
  createReviewDecisionFingerprintV01,
  deriveReviewDecisionIdV01,
  type ReviewDecisionBuilderInputV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "@/lib/vnext/review-decision";
import { validateTaskContextPacketV01 } from "@/lib/vnext/task-context-packet";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

const CHAIN_PACKET_EVALUATED_AT = "2026-07-10T01:00:00.000Z";
const CHAIN_DECIDED_AT = "2026-07-10T13:15:00.000Z";
const FIXED_SEMANTIC_REVIEW_CHAIN_FINGERPRINT =
  "sha256:160e48e92527010db75142e6e28a34b2ac46c54cfb42079455a81e1d02d1e141";

interface SemanticReviewChainFixtureResultV01 {
  project: SemanticReviewLoopProjectFixtureV01;
  packet: TaskContextPacketV01;
  receipt: RunReceiptV01;
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
  chain_fingerprint: string;
}

interface RelationResult {
  status: "valid" | "blocked";
  errors: string[];
}

export interface SemanticReviewLoopConformanceSummaryV01 {
  suite: "semantic-review-loop-v0.1";
  status: "passed";
  positive_project_fixture_count: 2;
  cross_project_failure_count: number;
  full_chain_fingerprint: string;
  task_context_packet_id: string;
  task_context_packet_fingerprint: string;
  run_receipt_id: string;
  run_receipt_fingerprint: string;
  episode_delta_proposal_id: string;
  episode_delta_proposal_fingerprint: string;
  review_decision_id: string;
  review_decision_fingerprint: string;
  explicit_workspace_project_identity_checked: true;
  source_native_ids_external_refs_checked: true;
  fingerprints_integrity_not_authority_checked: true;
  receipt_trust_semantics_preserved: true;
  proposal_decision_separation_checked: true;
  decision_transition_separation_checked: true;
  same_project_relations_passed: true;
  cross_project_relations_failed_closed: true;
  no_automatic_transition_checked: true;
  no_next_context_mutation_checked: true;
  repeated_execution_deterministic: true;
  unordered_collection_normalization_checked: true;
  resigned_malformed_payloads_rejected: true;
  fetch_calls: 0;
  database_calls: 0;
  provider_calls: 0;
  network_calls: 0;
  external_side_effects: 0;
}

export function runSemanticReviewLoopConformanceV01(): SemanticReviewLoopConformanceSummaryV01 {
  const projectA = buildSemanticReviewChain(semanticReviewLoopProjectAFixture);
  const projectB = buildSemanticReviewChain(semanticReviewLoopProjectBFixture);

  assert.notEqual(projectA.project.project_id, projectB.project.project_id);
  for (const chain of [projectA, projectB]) {
    assert.equal(chain.packet.workspace_id, chain.project.workspace_id);
    assert.equal(chain.packet.project_id, chain.project.project_id);
    assert.equal(chain.receipt.workspace_id, chain.project.workspace_id);
    assert.equal(chain.receipt.project_id, chain.project.project_id);
    assert.equal(chain.proposal.workspace_id, chain.project.workspace_id);
    assert.equal(chain.proposal.project_id, chain.project.project_id);
    assert.equal(chain.decision.workspace_id, chain.project.workspace_id);
    assert.equal(chain.decision.project_id, chain.project.project_id);
    assert.equal(
      validatePacketReceiptRelation(chain.packet, chain.receipt).status,
      "valid",
    );
    assert.equal(
      validateReceiptProposalRelation(chain.receipt, chain.proposal).status,
      "valid",
    );
    const decisionRelation =
      validateReviewDecisionAgainstEpisodeDeltaProposalV01(
        chain.decision,
        chain.proposal,
      );
    assert.equal(
      decisionRelation.status,
      "valid",
      formatValidation(decisionRelation),
    );
    assert.ok(chain.receipt.observations.length > 0);
    assert.ok(
      chain.receipt.observations.every(
        (item) => item.trust_class === "direct_local_observation",
      ),
    );
    assert.equal(chain.proposal.authority_summary.proposal_is_review_decision, false);
    assert.equal(chain.proposal.authority_summary.performs_durable_transition, false);
    assert.equal(chain.decision.authority_summary.decision_is_proposal, false);
    assert.equal(
      chain.decision.authority_summary.decision_is_state_transition_receipt,
      false,
    );
    assert.equal(
      chain.decision.requested_transition_intent?.intent_only,
      true,
    );
    assert.equal(chain.decision.requested_transition_intent?.applied, false);
    assert.equal(
      chain.decision.requested_transition_intent
        ?.state_transition_receipt_ref,
      null,
    );
    assert.equal(chain.decision.authority_summary.performs_durable_transition, false);
    assert.equal(chain.decision.authority_summary.writes_database, false);
    assert.equal(chain.proposal.authority_summary.creates_evidence, false);
    assert.equal(chain.proposal.authority_summary.applies_perspective, false);
    assert.equal(chain.proposal.authority_summary.promotes_reviewed_memory, false);
    assert.equal(chain.proposal.authority_summary.closes_work, false);
    assert.equal(
      chain.proposal.authority_summary.selects_next_context_automatically,
      false,
    );
    assertSourceNativeIdsRemainExternalRefs(chain);
  }

  assert.equal(
    projectA.chain_fingerprint,
    FIXED_SEMANTIC_REVIEW_CHAIN_FINGERPRINT,
  );

  const crossProjectResults = [
    validatePacketReceiptRelation(projectA.packet, projectB.receipt),
    validatePacketReceiptRelation(projectB.packet, projectA.receipt),
    validateReceiptProposalRelation(projectA.receipt, projectB.proposal),
    validateReceiptProposalRelation(projectB.receipt, projectA.proposal),
  ];
  const decisionACross = validateReviewDecisionAgainstEpisodeDeltaProposalV01(
    projectA.decision,
    projectB.proposal,
  );
  const decisionBCross = validateReviewDecisionAgainstEpisodeDeltaProposalV01(
    projectB.decision,
    projectA.proposal,
  );
  for (const relation of crossProjectResults) {
    assert.equal(relation.status, "blocked");
    assert.ok(relation.errors.length > 0);
  }
  for (const relation of [decisionACross, decisionBCross]) {
    assert.equal(relation.status, "blocked", formatValidation(relation));
    assert.ok(
      relation.errors.some(
        (issue) =>
          issue.code === "project_mismatch" ||
          issue.code === "proposal_id_mismatch" ||
          issue.code === "proposal_fingerprint_mismatch",
      ),
    );
  }

  const repeatedA = buildSemanticReviewChain(
    semanticReviewLoopProjectAFixture,
  );
  assert.deepEqual(repeatedA, projectA);

  const decisionInput = createSyntheticDecisionInput(
    projectA.project,
    projectA.proposal,
  );
  const normalizedDecision = buildReviewDecisionV01(
    deepFreeze(clone(decisionInput)),
  );
  reverseAllArrays(decisionInput);
  const reorderedDecision = buildReviewDecisionV01(
    deepFreeze(decisionInput),
  );
  assert.deepEqual(reorderedDecision, normalizedDecision);

  const packetBefore = canonicalizeProtocolValueV01(projectA.packet);
  const resignedProposal = clone(projectA.proposal);
  resignedProposal.authority_summary.selects_next_context_automatically =
    true as false;
  resignedProposal.proposal_id = deriveEpisodeDeltaProposalIdV01(
    resignedProposal,
  );
  resignedProposal.integrity.fingerprint =
    createEpisodeDeltaProposalFingerprintV01(resignedProposal);
  const malformedProposalValidation = validateEpisodeDeltaProposalV01(
    resignedProposal,
  );
  assert.equal(malformedProposalValidation.status, "blocked");
  assert.ok(
    malformedProposalValidation.errors.some(
      (issue) => issue.code === "authority_boundary_violation",
    ),
  );
  assertNoIntegrityOnlyFailure(malformedProposalValidation.errors, [
    "proposal_identity_mismatch",
    "fingerprint_mismatch",
  ]);

  const resignedDecision = clone(projectA.decision);
  if (!resignedDecision.requested_transition_intent) {
    throw new Error("Synthetic chain decision requires transition intent.");
  }
  resignedDecision.requested_transition_intent.applied = true as false;
  resignedDecision.decision_id = deriveReviewDecisionIdV01(resignedDecision);
  resignedDecision.integrity.fingerprint =
    createReviewDecisionFingerprintV01(resignedDecision);
  const malformedDecisionValidation = validateReviewDecisionV01(
    resignedDecision,
  );
  assert.equal(malformedDecisionValidation.status, "blocked");
  assert.ok(
    malformedDecisionValidation.errors.some(
      (issue) => issue.code === "automatic_transition_claim",
    ),
  );
  assertNoIntegrityOnlyFailure(malformedDecisionValidation.errors, [
    "decision_identity_mismatch",
    "fingerprint_mismatch",
  ]);
  assert.equal(canonicalizeProtocolValueV01(projectA.packet), packetBefore);

  return {
    suite: "semantic-review-loop-v0.1",
    status: "passed",
    positive_project_fixture_count: 2,
    cross_project_failure_count:
      crossProjectResults.length + 2,
    full_chain_fingerprint: projectA.chain_fingerprint,
    task_context_packet_id: projectA.packet.packet_id,
    task_context_packet_fingerprint: projectA.packet.integrity.fingerprint,
    run_receipt_id: projectA.receipt.receipt_id,
    run_receipt_fingerprint: projectA.receipt.integrity.fingerprint,
    episode_delta_proposal_id: projectA.proposal.proposal_id,
    episode_delta_proposal_fingerprint:
      projectA.proposal.integrity.fingerprint,
    review_decision_id: projectA.decision.decision_id,
    review_decision_fingerprint: projectA.decision.integrity.fingerprint,
    explicit_workspace_project_identity_checked: true,
    source_native_ids_external_refs_checked: true,
    fingerprints_integrity_not_authority_checked: true,
    receipt_trust_semantics_preserved: true,
    proposal_decision_separation_checked: true,
    decision_transition_separation_checked: true,
    same_project_relations_passed: true,
    cross_project_relations_failed_closed: true,
    no_automatic_transition_checked: true,
    no_next_context_mutation_checked: true,
    repeated_execution_deterministic: true,
    unordered_collection_normalization_checked: true,
    resigned_malformed_payloads_rejected: true,
    fetch_calls: 0,
    database_calls: 0,
    provider_calls: 0,
    network_calls: 0,
    external_side_effects: 0,
  };
}

function buildSemanticReviewChain(
  project: SemanticReviewLoopProjectFixtureV01,
): SemanticReviewChainFixtureResultV01 {
  const material = buildSemanticReviewLoopMaterialFixture(project);
  const packet = material.prior_packet;
  const packetValidation = validateTaskContextPacketV01(packet, {
    evaluated_at: CHAIN_PACKET_EVALUATED_AT,
  });
  assert.equal(packetValidation.status, "valid", formatValidation(packetValidation));
  const decisionInput = createSyntheticDecisionInput(project, material.proposal);
  const decision = buildReviewDecisionV01(deepFreeze(decisionInput));
  const decisionValidation = validateReviewDecisionV01(decision);
  assert.equal(
    decisionValidation.status,
    "valid",
    formatValidation(decisionValidation),
  );
  const chainIdentity = {
    workspace_id: project.workspace_id,
    project_id: project.project_id,
    task_context_packet: {
      packet_id: packet.packet_id,
      fingerprint: packet.integrity.fingerprint,
    },
    run_receipt: {
      receipt_id: material.run_receipt.receipt_id,
      fingerprint: material.run_receipt.integrity.fingerprint,
    },
    episode_delta_proposal: {
      proposal_id: material.proposal.proposal_id,
      fingerprint: material.proposal.integrity.fingerprint,
    },
    review_decision: {
      decision_id: decision.decision_id,
      fingerprint: decision.integrity.fingerprint,
    },
  };
  return {
    project,
    packet,
    receipt: material.run_receipt,
    proposal: material.proposal,
    decision,
    chain_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(chainIdentity),
    ),
  };
}

function createSyntheticDecisionInput(
  project: SemanticReviewLoopProjectFixtureV01,
  proposal: EpisodeDeltaProposalV01,
): ReviewDecisionBuilderInputV01 {
  const candidate = proposal.proposed_deltas[0]!;
  const receiptRef = proposal.run_receipt_refs[0]!;
  return {
    workspace_id: project.workspace_id,
    project_id: project.project_id,
    source_proposal: {
      proposal_version: proposal.proposal_version,
      proposal_id: proposal.proposal_id,
      proposal_fingerprint: proposal.integrity.fingerprint,
    },
    candidate: {
      candidate_id: candidate.candidate_id,
      candidate_fingerprint:
        createEpisodeDeltaCandidateFingerprintV01(candidate),
    },
    decision: "accept",
    actor_ref: {
      ref_version: "external_ref.v0.1",
      ref_type: "operator_actor",
      external_id: `synthetic-operator:${project.fixture_id}`,
      trust_class: "user_declaration",
      observed_at: CHAIN_DECIDED_AT,
      compatibility_namespace: "augnes.semantic-review-loop.conformance.v0.1",
    },
    authorization_basis_refs: [
      {
        ref_version: "external_ref.v0.1",
        ref_type: "authorization_basis",
        external_id: `synthetic-authorization:${project.fixture_id}:a`,
        trust_class: "user_declaration",
        observed_at: CHAIN_DECIDED_AT,
        compatibility_namespace:
          "augnes.semantic-review-loop.conformance.v0.1",
      },
      {
        ref_version: "external_ref.v0.1",
        ref_type: "authorization_basis",
        external_id: `synthetic-authorization:${project.fixture_id}:b`,
        trust_class: "user_declaration",
        observed_at: CHAIN_DECIDED_AT,
        compatibility_namespace:
          "augnes.semantic-review-loop.conformance.v0.1",
      },
    ],
    decision_basis_material_ids: [...candidate.basis_material_ids],
    decision_basis_refs: [receiptRef],
    rationale_summary:
      "Synthetic conformance acceptance binds one proposal candidate without representing a real user decision or applying state.",
    decided_at: CHAIN_DECIDED_AT,
    revisit: null,
    requested_transition_intent: {
      intent_id: `transition-intent:${project.fixture_id}`,
      transition_kind: "semantic_candidate_apply",
      bounded_summary:
        "Request a future separately authorized semantic transition while keeping this chain non-durable.",
      target_refs: [...candidate.target_refs],
      intent_only: true,
      applied: false,
      state_transition_receipt_ref: null,
    },
    lineage: {
      prior_decisions: [],
      superseding_candidate: null,
      retracted_decision: null,
    },
    compatibility: {
      source_contracts: [proposal.proposal_version],
      unmapped_fields: [],
      warnings: [
        "Synthetic conformance decision is not a real operator authorization.",
        "No StateTransitionReceipt or later TaskContextPacket is generated.",
      ],
      external_refs: [],
    },
    authority_notes: [
      "Full-chain conformance is protocol isolation, not observed use.",
    ],
  };
}

function validatePacketReceiptRelation(
  packet: TaskContextPacketV01,
  receipt: RunReceiptV01,
): RelationResult {
  const errors: string[] = [];
  if (packet.workspace_id !== receipt.workspace_id) errors.push("workspace_mismatch");
  if (packet.project_id !== receipt.project_id) errors.push("project_mismatch");
  const expectedRef = semanticReviewLoopTaskContextPacketRefFixture(packet);
  if (
    canonicalizeProtocolValueV01(receipt.task_context_packet_ref) !==
    canonicalizeProtocolValueV01(expectedRef)
  ) {
    errors.push("task_context_packet_binding_mismatch");
  }
  return { status: errors.length === 0 ? "valid" : "blocked", errors };
}

function validateReceiptProposalRelation(
  receipt: RunReceiptV01,
  proposal: EpisodeDeltaProposalV01,
): RelationResult {
  const errors: string[] = [];
  if (receipt.workspace_id !== proposal.workspace_id) errors.push("workspace_mismatch");
  if (receipt.project_id !== proposal.project_id) errors.push("project_mismatch");
  if (
    canonicalizeProtocolValueV01(receipt.task_context_packet_ref) !==
    canonicalizeProtocolValueV01(proposal.task_context_packet_ref)
  ) {
    errors.push("task_context_packet_binding_mismatch");
  }
  const receiptBound = proposal.run_receipt_refs.some(
    (ref) =>
      ref.ref_type === "run_receipt" &&
      ref.external_id === receipt.receipt_id &&
      ref.source_ref === receipt.integrity.fingerprint,
  );
  if (!receiptBound) errors.push("run_receipt_binding_mismatch");
  return { status: errors.length === 0 ? "valid" : "blocked", errors };
}

function assertSourceNativeIdsRemainExternalRefs(
  chain: SemanticReviewChainFixtureResultV01,
) {
  assert.ok(
    chain.proposal.source_refs.some(
      (ref) =>
        ref.ref_type === "run_receipt" &&
        ref.external_id === chain.receipt.receipt_id &&
        ref.source_ref === chain.receipt.integrity.fingerprint,
    ),
  );
  assert.ok(
    chain.proposal.source_refs.some(
      (ref) =>
        ref.ref_type === "task_context_packet" &&
        ref.external_id === chain.packet.packet_id &&
        ref.source_ref === chain.packet.integrity.fingerprint,
    ),
  );
  assert.equal(
    chain.proposal.source_refs.some((ref) =>
      ref.ref_type.includes("codex_result_report"),
    ),
    false,
  );
  assert.equal(
    chain.proposal.authority_summary.fingerprint_verification_grants_authority,
    false,
  );
  assert.equal(
    chain.proposal.authority_summary.source_validation_grants_authority,
    false,
  );
}

function assertNoIntegrityOnlyFailure(
  errors: Array<{ code: string }>,
  integrityCodes: string[],
) {
  for (const code of integrityCodes) {
    assert.equal(
      errors.some((issue) => issue.code === code),
      false,
      `Re-signed semantic rejection must not rely on ${code}.`,
    );
  }
}

function reverseAllArrays(value: unknown) {
  if (Array.isArray(value)) {
    value.reverse();
    value.forEach(reverseAllArrays);
    return;
  }
  if (!value || typeof value !== "object") return;
  Object.values(value as Record<string, unknown>).forEach(reverseAllArrays);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  return Object.freeze(value);
}

function formatValidation(value: {
  status: string;
  errors: Array<{ code: string; path: string | null; message: string }>;
  warnings: Array<{ code: string; path: string | null; message: string }>;
}) {
  return JSON.stringify(value, null, 2);
}
