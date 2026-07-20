import { genericCliDirectObservationProposalInputFixture } from "@/fixtures/vnext/protocol/episode-delta-proposal-v0-1";
import { genericCliDirectObservationInputFixture } from "@/fixtures/vnext/protocol/run-receipt-v0-1";
import {
  buildEpisodeDeltaProposalV01,
  type EpisodeDeltaProposalBuilderInputV01,
} from "@/lib/vnext/episode-delta-proposal";
import { buildRunReceiptV01, type RunReceiptBuilderInputV01 } from "@/lib/vnext/run-receipt";
import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import {
  buildTaskContextPacketV01,
  type TaskContextPacketBuilderInputV01,
} from "@/lib/vnext/task-context-packet";
import {
  EXTERNAL_REF_VERSION_V01,
  type ExternalRefV01,
} from "@/types/vnext/external-ref";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import type { EpisodeDeltaProposalV01 } from "@/types/vnext/episode-delta-proposal";
import type { RunReceiptV01 } from "@/types/vnext/run-receipt";

export interface SemanticReviewLoopProjectFixtureV01 {
  fixture_id: string;
  workspace_id: string;
  project_id: string;
  run_id: string;
}

export const semanticReviewLoopProjectAFixture: SemanticReviewLoopProjectFixtureV01 = {
  fixture_id: "semantic-review-loop-project-a",
  workspace_id: "workspace-semantic-review-loop",
  project_id: "project-semantic-review-loop-a",
  run_id: "run-semantic-review-loop-a",
};

export const semanticReviewLoopProjectBFixture: SemanticReviewLoopProjectFixtureV01 = {
  fixture_id: "semantic-review-loop-project-b",
  workspace_id: "workspace-semantic-review-loop",
  project_id: "project-semantic-review-loop-b",
  run_id: "run-semantic-review-loop-b",
};

export function buildSemanticReviewLoopTaskContextPacketFixture(
  project: SemanticReviewLoopProjectFixtureV01,
  options: {
    data_classification?: "public_safe";
  } = {},
): TaskContextPacketV01 {
  const input = clone(
    genericCliBuilderInputFixture,
  ) as TaskContextPacketBuilderInputV01;
  input.workspace_id = project.workspace_id;
  input.project_id = project.project_id;
  input.task.goal =
    "Review one bounded provider-neutral semantic result chain without applying project state.";
  input.task.success_criteria = [
    "Receipt, proposal, and explicit decision relations remain project-isolated.",
  ];
  input.task.non_goals = [
    "No StateTransitionReceipt, durable write, Evidence acceptance, or next-context mutation.",
  ];
  input.authority_notes = [
    "This synthetic packet is protocol conformance context, not execution authority.",
  ];
  if (options.data_classification) {
    input.constraints.data_classification = options.data_classification;
  }
  return buildTaskContextPacketV01(input);
}

export function semanticReviewLoopTaskContextPacketRefFixture(
  packet: TaskContextPacketV01,
): ExternalRefV01 {
  return {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: "task_context_packet",
    external_id: packet.packet_id,
    trust_class: "direct_local_observation",
    observed_at: packet.generated_at,
    source_ref: packet.integrity.fingerprint,
    compatibility_namespace: "augnes.vnext.task-context-packet.v0.1",
  };
}

export interface SemanticReviewLoopMaterialFixtureV01 {
  prior_packet: TaskContextPacketV01;
  run_receipt: RunReceiptV01;
  proposal: EpisodeDeltaProposalV01;
}

export function buildSemanticReviewLoopRunReceiptFixture(
  project: SemanticReviewLoopProjectFixtureV01,
  packet: TaskContextPacketV01,
  options: { timeline_anchor_at?: string } = {},
): RunReceiptV01 {
  let input = clone(
    genericCliDirectObservationInputFixture,
  ) as RunReceiptBuilderInputV01;
  if (options.timeline_anchor_at) {
    input = remapTimeline(input, options.timeline_anchor_at, [
      ["2026-07-10T02:00:00.000Z", 100],
      ["2026-07-10T02:30:00.000Z", 200],
      ["2026-07-10T03:00:00.000Z", 300],
    ]);
  }
  input.workspace_id = project.workspace_id;
  input.project_id = project.project_id;
  input.run_id = project.run_id;
  input.task_context_packet_ref =
    semanticReviewLoopTaskContextPacketRefFixture(packet);
  input.result_summary.summary =
    "The bounded provider-neutral fixture completed without granting semantic authority.";
  input.result_summary.outcome = "Canonical fixture result recorded.";
  return buildRunReceiptV01(input);
}

export function buildSemanticReviewLoopProposalFixture(
  project: SemanticReviewLoopProjectFixtureV01,
  packet: TaskContextPacketV01,
  receipt: RunReceiptV01,
  options: {
    primary_delta_type?: "agent_plan_delta";
    candidate_namespace?: string;
    timeline_anchor_at?: string;
  } = {},
): EpisodeDeltaProposalV01 {
  const receiptRef: ExternalRefV01 = {
    ref_version: EXTERNAL_REF_VERSION_V01,
    ref_type: "run_receipt",
    external_id: receipt.receipt_id,
    trust_class: "direct_local_observation",
    observed_at: receipt.recorded_at,
    source_ref: receipt.integrity.fingerprint,
    compatibility_namespace: "augnes.vnext.run-receipt.v0.1",
  };
  const packetRef = semanticReviewLoopTaskContextPacketRefFixture(packet);
  let input = replaceProtocolRefs(
    clone(genericCliDirectObservationProposalInputFixture),
    receiptRef,
    packetRef,
  ) as EpisodeDeltaProposalBuilderInputV01;
  if (options.timeline_anchor_at) {
    input = remapTimeline(input, options.timeline_anchor_at, [
      ["2026-07-10T11:50:00.000Z", 400],
      ["2026-07-10T12:00:00.000Z", 500],
    ]);
  }
  input.workspace_id = project.workspace_id;
  input.project_id = project.project_id;
  input.task_context_packet_ref = packetRef;
  input.run_receipt_refs = [receiptRef];
  const primaryCandidate = input.proposed_deltas[0];
  if (!primaryCandidate) {
    throw new Error("Provider-neutral semantic review fixture requires a candidate.");
  }
  if (options.primary_delta_type) {
    primaryCandidate.delta_type = options.primary_delta_type;
  }
  const secondaryCandidate = clone(primaryCandidate);
  secondaryCandidate.candidate_id = "delta:host-attested-result-secondary";
  secondaryCandidate.title = "Review the second bounded coordination candidate";
  secondaryCandidate.target_refs = secondaryCandidate.target_refs.map(
    (target, index) => ({
      ...target,
      external_id: `${target.external_id}:secondary-${index + 1}`,
    }),
  );
  input.proposed_deltas.push(secondaryCandidate);
  if (options.candidate_namespace) {
    input.proposed_deltas = input.proposed_deltas.map((candidate) => ({
      ...candidate,
      candidate_id: `${candidate.candidate_id}:${options.candidate_namespace}`,
      target_refs: candidate.target_refs.map((target, index) => ({
        ...target,
        external_id: `${target.external_id}:${options.candidate_namespace}-${index + 1}`,
      })),
    }));
  }
  input.bounded_summary =
    "A bounded provider-neutral RunReceipt supports reviewable synthetic protocol candidates.";
  input.authority_notes = [
    "This synthetic proposal is conformance material, not a user decision or transition authority.",
  ];
  return buildEpisodeDeltaProposalV01(input);
}

export function buildSemanticReviewLoopMaterialFixture(
  project: SemanticReviewLoopProjectFixtureV01,
): SemanticReviewLoopMaterialFixtureV01 {
  const priorPacket = buildSemanticReviewLoopTaskContextPacketFixture(project);
  const receipt = buildSemanticReviewLoopRunReceiptFixture(project, priorPacket);
  return {
    prior_packet: priorPacket,
    run_receipt: receipt,
    proposal: buildSemanticReviewLoopProposalFixture(
      project,
      priorPacket,
      receipt,
    ),
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function remapTimeline<T>(
  value: T,
  anchorAt: string,
  replacements: Array<[source: string, offsetMs: number]>,
): T {
  const anchorMs = Date.parse(anchorAt);
  if (!Number.isFinite(anchorMs)) {
    throw new Error("Semantic review fixture timeline anchor must be ISO-8601.");
  }
  const mapped = new Map(
    replacements.map(([source, offsetMs]) => [
      source,
      new Date(anchorMs + offsetMs).toISOString(),
    ]),
  );
  return JSON.parse(
    JSON.stringify(value, (_key, entry) =>
      typeof entry === "string" ? (mapped.get(entry) ?? entry) : entry,
    ),
  ) as T;
}

function replaceProtocolRefs<T>(
  value: T,
  receiptRef: ExternalRefV01,
  packetRef: ExternalRefV01,
): T {
  if (Array.isArray(value)) {
    return value.map((entry) =>
      replaceProtocolRefs(entry, receiptRef, packetRef),
    ) as T;
  }
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  if (record.ref_type === "run_receipt") return clone(receiptRef) as T;
  if (record.ref_type === "task_context_packet") return clone(packetRef) as T;
  return Object.fromEntries(
    Object.entries(record).map(([key, entry]) => [
      key,
      replaceProtocolRefs(entry, receiptRef, packetRef),
    ]),
  ) as T;
}
