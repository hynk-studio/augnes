import { genericCliBuilderInputFixture } from "@/fixtures/vnext/protocol/task-context-packet-v0-1";
import { genericCliDirectObservationInputFixture } from "@/fixtures/vnext/protocol/run-receipt-v0-1";
import {
  createLocalProjectRootCriterionVerificationPlanV01,
  LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
  LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01,
} from "@/lib/vnext/automation/local-project-root-verification-profile";
import { evaluateCriterionAssessmentV01 } from "@/lib/vnext/criterion-assessment";
import { materializeRunAssessmentProposalV01 } from "@/lib/vnext/run-assessment-proposal";
import {
  buildRunReceiptV01,
  type RunReceiptBuilderInputV01,
} from "@/lib/vnext/run-receipt";
import {
  buildTaskContextPacketV01,
  type TaskContextPacketBuilderInputV01,
} from "@/lib/vnext/task-context-packet";

export const PROJECT_VERIFY_WORKBENCH_FIXTURE_VERSION_V01 =
  "project_verify_workbench_fixture.v0.1" as const;

/**
 * Production-shaped, deterministic SR-1/SR-2 source material for Workbench
 * browser and route tests. The real evaluator and proposal materializer own
 * criterion meaning; this fixture does not hand-author assessment statuses.
 */
export function buildProjectVerifyWorkbenchFixtureV01(input: {
  workspace_id: string;
  project_id: string;
  run_id: string;
}) {
  const packetInput = structuredClone(
    genericCliBuilderInputFixture,
  ) as TaskContextPacketBuilderInputV01;
  packetInput.workspace_id = input.workspace_id;
  packetInput.project_id = input.project_id;
  packetInput.expires_at = null;
  packetInput.task = {
    goal: LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.goal,
    success_criteria: [
      ...LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.success_criteria,
    ],
    non_goals: [...LOCAL_PROJECT_ROOT_VERIFICATION_TASK_V01.non_goals],
  };
  packetInput.constraints.required_checks = [
    ...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
  ];
  packetInput.return_contract.required_checks = [
    ...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
  ];
  packetInput.criterion_verification_plan =
    createLocalProjectRootCriterionVerificationPlanV01({
      workspace_id: input.workspace_id,
      project_id: input.project_id,
    });
  const packet = buildTaskContextPacketV01(packetInput);

  const receiptInput = structuredClone(
    genericCliDirectObservationInputFixture,
  ) as RunReceiptBuilderInputV01;
  receiptInput.workspace_id = input.workspace_id;
  receiptInput.project_id = input.project_id;
  receiptInput.run_id = input.run_id;
  receiptInput.work_ref =
    packet.work_ref && typeof packet.work_ref === "object"
      ? structuredClone(packet.work_ref)
      : null;
  receiptInput.task_context_packet_ref = {
    ref_version: "external_ref.v0.1",
    ref_type: "task_context_packet",
    external_id: packet.packet_id,
    trust_class: "direct_local_observation",
    observed_at: packet.generated_at,
    source_ref: packet.integrity.fingerprint,
    compatibility_namespace: packet.packet_version,
  };
  const verifierRef = receiptInput.verifier_refs[0]!;
  receiptInput.verification = {
    status: "passed",
    basis: "observed",
    required_check_ids: [
      ...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
    ],
    source_refs: [verifierRef],
  };
  receiptInput.checks =
    LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01.map((checkId) => ({
      check_id: checkId,
      required: true,
      status: "passed" as const,
      basis: "observed" as const,
      summary: `Exact production-profile check ${checkId} passed.`,
      source_refs: [verifierRef],
    }));
  receiptInput.skipped_checks = [];
  receiptInput.changed_artifacts = [];
  receiptInput.artifact_refs = [];
  receiptInput.commands = [];
  receiptInput.observations = [
    {
      observation_id: "observation:r7b-production-shaped-verification",
      observation_kind: "command_result",
      summary:
        "The server-owned bounded project-root verifier completed its exact checks.",
      event_at: receiptInput.finished_at!,
      observed_at: receiptInput.finished_at!,
      observer_ref: receiptInput.observer_refs[0]!,
      trust_class: "direct_local_observation",
      source_refs: [verifierRef],
      related_command_ids: [],
      related_check_ids: [
        ...LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
      ],
      related_artifact_refs: [],
    },
  ];
  receiptInput.attestations = [];
  receiptInput.result_summary = {
    summary:
      "The production-shaped local project-root verification completed.",
    outcome: "completed",
    limitations: [
      "Criterion assessment and Verify material remain non-authoritative.",
    ],
  };
  const receipt = buildRunReceiptV01(receiptInput);
  const assessment = evaluateCriterionAssessmentV01({ packet, receipt });
  const proposal_material = materializeRunAssessmentProposalV01({
    packet,
    receipt,
    assessment,
  });
  return {
    fixture_version: PROJECT_VERIFY_WORKBENCH_FIXTURE_VERSION_V01,
    packet,
    receipt,
    assessment,
    proposal_material,
  };
}
