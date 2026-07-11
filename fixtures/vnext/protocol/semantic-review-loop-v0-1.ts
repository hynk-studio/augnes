import {
  codexReviewProposalMapperInputFixture,
} from "@/fixtures/vnext/protocol/episode-delta-proposal-codex-review-v0-1";
import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import {
  buildTaskContextPacketV01,
  type TaskContextPacketBuilderInputV01,
} from "@/lib/vnext/task-context-packet";
import type { CodexReviewEpisodeDeltaProposalInputV01 } from "@/lib/vnext/compat/episode-delta-proposal-from-codex-review";
import {
  EXTERNAL_REF_VERSION_V01,
  type ExternalRefV01,
} from "@/types/vnext/external-ref";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

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
): TaskContextPacketV01 {
  const input = clone(
    genericCliBuilderInputFixture,
  ) as TaskContextPacketBuilderInputV01;
  input.workspace_id = project.workspace_id;
  input.project_id = project.project_id;
  input.task.goal =
    "Review one bounded Codex semantic result chain without applying project state.";
  input.task.success_criteria = [
    "Receipt, proposal, and explicit decision relations remain project-isolated.",
  ];
  input.task.non_goals = [
    "No StateTransitionReceipt, durable write, Evidence acceptance, or next-context mutation.",
  ];
  input.authority_notes = [
    "This synthetic packet is protocol conformance context, not execution authority.",
  ];
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

export function semanticReviewLoopMapperInputFixture(
  project: SemanticReviewLoopProjectFixtureV01,
  packet: TaskContextPacketV01,
): CodexReviewEpisodeDeltaProposalInputV01 {
  const input = codexReviewProposalMapperInputFixture({
    workspace_id: project.workspace_id,
    project_id: project.project_id,
    task_context_packet_ref:
      semanticReviewLoopTaskContextPacketRefFixture(packet),
  });
  input.run_id = project.run_id;
  return input;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
