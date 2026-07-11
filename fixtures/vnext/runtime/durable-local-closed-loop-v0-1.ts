import {
  buildSemanticReviewLoopTaskContextPacketFixture,
  semanticReviewLoopMapperInputFixture,
  semanticReviewLoopProjectAFixture,
  semanticReviewLoopProjectBFixture,
  type SemanticReviewLoopProjectFixtureV01,
} from "@/fixtures/vnext/protocol/semantic-review-loop-v0-1";
import {
  SEMANTIC_TRANSITION_DECIDED_AT,
  createSemanticTransitionDecisionInputV01,
} from "@/fixtures/vnext/protocol/semantic-transition-loop-v0-1";
import { mapCodexSemanticReviewToEpisodeDeltaProposalV01 } from "@/lib/vnext/compat/episode-delta-proposal-from-codex-review";
import type { CodexReviewEpisodeDeltaProposalInputV01 } from "@/lib/vnext/compat/episode-delta-proposal-from-codex-review";
import {
  buildReviewDecisionV01,
  validateReviewDecisionAgainstEpisodeDeltaProposalV01,
  validateReviewDecisionV01,
} from "@/lib/vnext/review-decision";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { ReviewDecisionV01 } from "@/types/vnext/review-decision";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export const DURABLE_LOCAL_LOOP_CURRENT_STATE_OBSERVED_AT =
  "2026-07-10T14:00:00.000Z";
export const DURABLE_LOCAL_LOOP_PREVIEWED_AT =
  "2026-07-10T14:01:00.000Z";
export const DURABLE_LOCAL_LOOP_CONFIRMED_AT =
  "2026-07-10T14:02:00.000Z";
export const DURABLE_LOCAL_LOOP_GATE_EVALUATED_AT =
  "2026-07-10T14:03:00.000Z";
export const DURABLE_LOCAL_LOOP_ELIGIBILITY_EVALUATED_AT =
  "2026-07-10T14:04:00.000Z";
export const DURABLE_LOCAL_LOOP_APPLIED_AT =
  "2026-07-10T14:05:00.000Z";
export const DURABLE_LOCAL_LOOP_RECORDED_AT =
  "2026-07-10T14:06:00.000Z";
export const DURABLE_LOCAL_LOOP_GATE_EXPIRES_AT =
  "2026-07-10T15:00:00.000Z";
export const DURABLE_LOCAL_LOOP_LATER_PACKET_GENERATED_AT =
  "2026-07-10T14:07:00.000Z";
export const DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_STARTED_AT =
  "2026-07-10T14:08:00.000Z";
export const DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_FINISHED_AT =
  "2026-07-10T14:09:00.000Z";
export const DURABLE_LOCAL_LOOP_CONTEXT_USE_PROBE_RECORDED_AT =
  "2026-07-10T14:10:00.000Z";
export const DURABLE_LOCAL_LOOP_DECIDED_AT = SEMANTIC_TRANSITION_DECIDED_AT;

export const durableLocalClosedLoopProjectAFixture =
  semanticReviewLoopProjectAFixture;
export const durableLocalClosedLoopProjectBFixture =
  semanticReviewLoopProjectBFixture;

export interface DurableLocalClosedLoopM3APrefixFixtureV01 {
  project: SemanticReviewLoopProjectFixtureV01;
  prior_packet: TaskContextPacketV01;
  mapper_input: CodexReviewEpisodeDeltaProposalInputV01;
  run_receipt: RunReceiptV01;
  preview_id: string;
  preview_fingerprint: string;
  proposal: EpisodeDeltaProposalV01;
  decision: ReviewDecisionV01;
}

export function buildDurableLocalClosedLoopM3APrefixFixtureV01(
  project: SemanticReviewLoopProjectFixtureV01,
): DurableLocalClosedLoopM3APrefixFixtureV01 {
  const priorPacket = buildSemanticReviewLoopTaskContextPacketFixture(project);
  const mapperInput = semanticReviewLoopMapperInputFixture(project, priorPacket);
  const mapping = mapCodexSemanticReviewToEpisodeDeltaProposalV01(
    deepFreeze(clone(mapperInput)),
  );
  if (
    mapping.status !== "mapped" ||
    !mapping.receipt ||
    !mapping.proposal ||
    !mapping.preview_id ||
    !mapping.preview_fingerprint
  ) {
    throw new Error(
      `Durable local loop M3A prefix mapping failed: ${JSON.stringify(mapping)}`,
    );
  }

  const decision = buildReviewDecisionV01(
    deepFreeze(
      createSemanticTransitionDecisionInputV01(project, mapping.proposal),
    ),
  );
  const decisionValidation = validateReviewDecisionV01(decision);
  if (decisionValidation.status !== "valid") {
    throw new Error(
      `Durable local loop synthetic decision failed validation: ${JSON.stringify(decisionValidation)}`,
    );
  }
  const decisionRelation =
    validateReviewDecisionAgainstEpisodeDeltaProposalV01(
      decision,
      mapping.proposal,
    );
  if (decisionRelation.status !== "valid") {
    throw new Error(
      `Durable local loop synthetic decision relation failed: ${JSON.stringify(decisionRelation)}`,
    );
  }

  return {
    project,
    prior_packet: priorPacket,
    mapper_input: mapperInput,
    run_receipt: mapping.receipt,
    preview_id: mapping.preview_id,
    preview_fingerprint: mapping.preview_fingerprint,
    proposal: mapping.proposal,
    decision,
  };
}

export function buildDurableLocalClosedLoopProjectAFixtureV01(): DurableLocalClosedLoopM3APrefixFixtureV01 {
  return buildDurableLocalClosedLoopM3APrefixFixtureV01(
    durableLocalClosedLoopProjectAFixture,
  );
}

export function buildDurableLocalClosedLoopProjectBFixtureV01(): DurableLocalClosedLoopM3APrefixFixtureV01 {
  return buildDurableLocalClosedLoopM3APrefixFixtureV01(
    durableLocalClosedLoopProjectBFixture,
  );
}

function clone<T>(value: T): T {
  if (value === undefined) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

function deepFreeze<T>(value: T): T {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.values(value as Record<string, unknown>).forEach(deepFreeze);
  return Object.freeze(value);
}
