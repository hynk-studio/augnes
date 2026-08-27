import { createHash } from "node:crypto";
import {
  closeSync,
  existsSync,
  fsyncSync,
  fstatSync,
  ftruncateSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  writeSync,
} from "node:fs";
import { constants as FS_CONSTANTS } from "node:fs";
import path from "node:path";

import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
  scanForbiddenProtocolMaterialV01,
} from "@/lib/vnext/protocol-primitives";
import { canonicalizeRepositoryRelativePathV01 } from "@/lib/vnext/repository-relative-path";
import {
  COMMISSIONED_WORK_CANDIDATE_COMPONENT_IDS_V01,
  COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01,
  COMMISSIONED_WORK_EXPERIMENT_CLASS_V01,
  type CommissionedWorkCandidateComponentIdV01,
  type CommissionedWorkEpisodeOperationContractV01,
  type CommissionedWorkSyntheticFixtureOutputV01,
} from "@/types/vnext/commissioned-controlled-workbench";
import type {
  NativeHostAdapterV01,
  NativeHostRequestV01,
  NativeHostResultV01,
} from "@/types/vnext/native-host-adapter";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export const COMMISSIONED_WORKBENCH_FIXTURE_ADAPTER_VERSION_V01 =
  "commissioned_workbench_fixture_adapter.v0.1" as const;
export const COMMISSIONED_WORKBENCH_FIXTURE_CAPABILITY_VERSION_V01 =
  "commissioned_workbench_fixture_capability.v0.1" as const;

const SAFE_SEGMENT_V01 = /^[A-Za-z0-9._-]{1,200}$/u;
const FINGERPRINT_V01 = /^sha256:[a-f0-9]{64}$/u;
const PRIVATE_ABSOLUTE_PATH_V01 =
  /(?:^|[\s"'`(])(?:\/Users\/|\/home\/|[A-Za-z]:[\\/]|\\\\)/u;

export interface CommissionedWorkbenchFixtureAdmissionV01 {
  admission_version: "commissioned_workbench_fixture_admission.v0.1";
  admission_id: string;
  episode_id: string;
  packet_fingerprint: string;
  executor_role_fingerprint: string;
  single_use: true;
  live_authorization_created: false;
  product_execution_grant_created: false;
  integrity_fingerprint: string;
}

export interface CommissionedWorkbenchSyntheticFixtureBindingV01 {
  binding_version: "commissioned_workbench_synthetic_fixture_binding.v0.1";
  packet_material_set_fingerprint: string;
  operation_contract: CommissionedWorkEpisodeOperationContractV01;
  operation_contract_fingerprint: string;
  synthetic_fixture_output: CommissionedWorkSyntheticFixtureOutputV01;
  synthetic_fixture_output_fingerprint: string;
  expected_current_source_fingerprint: string | null;
  current_source_relative_paths: string[];
  continuation_material_count: number;
  candidate_component_ids: CommissionedWorkCandidateComponentIdV01[];
  binding_fingerprint: string;
}

export class CommissionedWorkbenchFixtureAdapterErrorV01 extends Error {
  constructor(readonly code: string) {
    super(code);
    this.name = "CommissionedWorkbenchFixtureAdapterErrorV01";
  }
}

export function createCommissionedWorkbenchPacketMaterialSetFingerprintV01(
  packet: TaskContextPacketV01,
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01({
      selected: packet.selected_context
        .map((entry) => ({
          source_ref: entry.source_ref,
          ref_type: entry.external_ref?.ref_type ?? null,
        }))
        .sort(compareCanonicalV01),
      excluded: packet.excluded_context
        .map((entry) => ({
          source_ref: entry.source_ref,
          ref_type: entry.external_ref?.ref_type ?? null,
        }))
        .sort(compareCanonicalV01),
    }),
  );
}

export function createCommissionedWorkbenchFixtureAdmissionV01(input: {
  admission_id: string;
  episode_id: string;
  packet_fingerprint: string;
  executor_role_fingerprint: string;
}): CommissionedWorkbenchFixtureAdmissionV01 {
  for (const value of [
    input.admission_id,
    input.episode_id,
    input.packet_fingerprint,
    input.executor_role_fingerprint,
  ]) {
    if (typeof value !== "string" || value.length < 1 || value.length > 256) {
      failV01("commissioned_workbench_fixture_admission_invalid");
    }
  }
  if (
    !FINGERPRINT_V01.test(input.packet_fingerprint) ||
    !FINGERPRINT_V01.test(input.executor_role_fingerprint)
  ) {
    failV01("commissioned_workbench_fixture_admission_invalid");
  }
  const withoutIntegrity = {
    admission_version: "commissioned_workbench_fixture_admission.v0.1" as const,
    admission_id: input.admission_id,
    episode_id: input.episode_id,
    packet_fingerprint: input.packet_fingerprint,
    executor_role_fingerprint: input.executor_role_fingerprint,
    single_use: true as const,
    live_authorization_created: false as const,
    product_execution_grant_created: false as const,
  };
  return {
    ...withoutIntegrity,
    integrity_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutIntegrity),
    ),
  };
}

export function createCommissionedWorkbenchSyntheticFixtureBindingV01(input: {
  packet: TaskContextPacketV01;
  operation_contract: CommissionedWorkEpisodeOperationContractV01;
  synthetic_fixture_output: CommissionedWorkSyntheticFixtureOutputV01;
  expected_current_source_fingerprint: string | null;
  current_source_relative_paths: string[];
  continuation_material_count: number;
}): CommissionedWorkbenchSyntheticFixtureBindingV01 {
  const normalizedMaterial = normalizeSyntheticFixtureBindingMaterialV01({
    packet_material_set_fingerprint:
      createCommissionedWorkbenchPacketMaterialSetFingerprintV01(input.packet),
    operation_contract: input.operation_contract,
    operation_contract_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(input.operation_contract),
    ),
    synthetic_fixture_output: input.synthetic_fixture_output,
    synthetic_fixture_output_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(input.synthetic_fixture_output),
    ),
    expected_current_source_fingerprint:
      input.expected_current_source_fingerprint,
    current_source_relative_paths: input.current_source_relative_paths,
    continuation_material_count: input.continuation_material_count,
    candidate_component_ids: candidateComponentIdsFromPacketV01(input.packet),
  });
  const withoutFingerprint = {
    binding_version: "commissioned_workbench_synthetic_fixture_binding.v0.1" as const,
    ...normalizedMaterial,
  };
  return {
    ...withoutFingerprint,
    binding_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(withoutFingerprint),
    ),
  };
}

export function createCommissionedWorkbenchFixtureAdapterV01(input: {
  exact_repository_root: string;
  synthetic_fixture_binding: CommissionedWorkbenchSyntheticFixtureBindingV01;
  fixture_admission: CommissionedWorkbenchFixtureAdmissionV01;
  started_at: string;
  first_material_action_at: string;
  finished_at: string;
}): NativeHostAdapterV01 {
  if (!path.isAbsolute(input.exact_repository_root)) {
    failV01("commissioned_workbench_adapter_root_must_be_absolute");
  }
  const exactRoot = realpathSync(input.exact_repository_root);
  if (!lstatSync(exactRoot).isDirectory()) {
    failV01("commissioned_workbench_adapter_root_not_directory");
  }
  if (
    Number.isNaN(Date.parse(input.started_at)) ||
    Number.isNaN(Date.parse(input.first_material_action_at)) ||
    Number.isNaN(Date.parse(input.finished_at)) ||
    Date.parse(input.first_material_action_at) < Date.parse(input.started_at) ||
    Date.parse(input.finished_at) < Date.parse(input.first_material_action_at)
  ) {
    failV01("commissioned_workbench_adapter_time_invalid");
  }
  const admissionWithoutIntegrity = {
    admission_version: input.fixture_admission.admission_version,
    admission_id: input.fixture_admission.admission_id,
    episode_id: input.fixture_admission.episode_id,
    packet_fingerprint: input.fixture_admission.packet_fingerprint,
    executor_role_fingerprint: input.fixture_admission.executor_role_fingerprint,
    single_use: input.fixture_admission.single_use,
    live_authorization_created: input.fixture_admission.live_authorization_created,
    product_execution_grant_created:
      input.fixture_admission.product_execution_grant_created,
  };
  if (
    input.fixture_admission.integrity_fingerprint !==
      createProtocolSha256V01(
        canonicalizeProtocolValueV01(admissionWithoutIntegrity),
      ) ||
    input.fixture_admission.single_use !== true ||
    input.fixture_admission.live_authorization_created !== false ||
    input.fixture_admission.product_execution_grant_created !== false
  ) {
    failV01("commissioned_workbench_fixture_admission_invalid");
  }
  const syntheticFixtureBinding = normalizeSyntheticFixtureBindingV01(
    input.synthetic_fixture_binding,
  );
  const syntheticFixtureOutput =
    syntheticFixtureBinding.synthetic_fixture_output;
  let admissionConsumed = false;
  return {
    adapter_version: COMMISSIONED_WORKBENCH_FIXTURE_ADAPTER_VERSION_V01,
    capability_version: COMMISSIONED_WORKBENCH_FIXTURE_CAPABILITY_VERSION_V01,
    execution_profile: "deterministic_zero_model",
    provider_egress: "forbidden",
    invoke(request, control) {
      const packetMaterialSetFingerprint =
        createCommissionedWorkbenchPacketMaterialSetFingerprintV01(request.packet);
      const deliveredCandidateComponentIds =
        candidateComponentIdsFromPacketV01(request.packet);
      const expectedActionRefFingerprint = createProtocolSha256V01(
        canonicalizeProtocolValueV01({
          episode_id: input.fixture_admission.episode_id,
          request_id: request.request_id,
          packet_fingerprint: request.packet.integrity.fingerprint,
          executor_role_fingerprint:
            input.fixture_admission.executor_role_fingerprint,
        }),
      );
      const operatorActionRef =
        "operator_action_ref" in request.packet_lineage
          ? request.packet_lineage.operator_action_ref
          : null;
      const packetLineageKind =
        "lineage_kind" in request.packet_lineage
          ? request.packet_lineage.lineage_kind
          : null;
      if (
        input.fixture_admission.admission_id !==
          `fixture-admission:${input.fixture_admission.episode_id}` ||
        request.request_id !==
          `cw1-request:${input.fixture_admission.episode_id}` ||
        request.run_id !== `cw1-run:${input.fixture_admission.episode_id}` ||
        packetLineageKind !== "initial_user_defined" ||
        operatorActionRef?.source_ref !== expectedActionRefFingerprint ||
        request.mode !== "interactive" ||
        request.root_scope.root_kind !== "git_repository" ||
        request.policy.filesystem !== "selected_project_root_only" ||
        request.policy.network !== "forbidden" ||
        request.policy.commands !== "approval_required" ||
        request.policy.model !== "native_host_managed" ||
        request.policy.host_egress !== "explicit_interactive_start" ||
        canonicalizeProtocolValueV01(request.allowed_operation_categories) !==
          canonicalizeProtocolValueV01(
            syntheticFixtureBinding.operation_contract
              .allowed_operation_categories,
          ) ||
        request.policy.max_changed_files !==
          syntheticFixtureBinding.operation_contract.max_changed_files ||
        request.policy.max_commands !==
          syntheticFixtureBinding.operation_contract.max_commands ||
        request.execution_grant_ref !== null ||
        request.automation_context !== null ||
        request.repository_delegation_context != null ||
        request.repository_resume_context != null ||
        control.resume_binding != null ||
        control.cancellation_signal.aborted ||
        realpathSync(request.root_scope.canonical_root) !== exactRoot ||
        request.packet.integrity.fingerprint !==
          input.fixture_admission.packet_fingerprint ||
        admissionConsumed ||
        packetMaterialSetFingerprint !==
          syntheticFixtureBinding.packet_material_set_fingerprint ||
        canonicalizeProtocolValueV01(deliveredCandidateComponentIds) !==
          canonicalizeProtocolValueV01(
            syntheticFixtureBinding.candidate_component_ids,
          ) ||
        syntheticFixtureOutput.case_id !== fixtureCaseIdFromWorkRefV01(request) ||
        createProtocolSha256V01(
          canonicalizeProtocolValueV01({
            role_kind: "executor",
            role_id: syntheticFixtureOutput.executor_role_id,
          }),
        ) !== input.fixture_admission.executor_role_fingerprint
      ) {
        failV01("commissioned_workbench_adapter_request_refused");
      }
      admissionConsumed = true;
      let stopRequested = false;
      const result = Promise.resolve().then((): NativeHostResultV01 => {
        if (stopRequested || control.cancellation_signal.aborted) {
          failV01("commissioned_workbench_adapter_cancelled_before_write");
        }
        if (syntheticFixtureBinding.expected_current_source_fingerprint !== null) {
          const observedCurrentSource = currentSourceFingerprintV01(
            exactRoot,
            syntheticFixtureBinding.current_source_relative_paths,
          );
          if (
            observedCurrentSource !==
            syntheticFixtureBinding.expected_current_source_fingerprint
          ) {
            failV01("commissioned_workbench_adapter_current_source_drift");
          }
        }
        const changedFiles = syntheticFixtureOutput.writes.map((write) => {
          const target = resolveTargetV01(exactRoot, write.repository_relative_path);
          const existed = existsSync(target);
          if (existed && (lstatSync(target).isSymbolicLink() || !lstatSync(target).isFile())) {
            failV01("commissioned_workbench_adapter_target_not_file");
          }
          ensureParentChainV01(exactRoot, path.dirname(target));
          const { before, after } = writeNoFollowV01(target, write.content, existed);
          return {
            repository_relative_path: write.repository_relative_path,
            change_kind: existed ? ("modified" as const) : ("added" as const),
            before_hash: before === null ? null : sha256V01(before),
            after_hash: sha256V01(after),
          };
        });
        const hostIdentityFingerprint = createProtocolSha256V01(
          canonicalizeProtocolValueV01({
            adapter_version: COMMISSIONED_WORKBENCH_FIXTURE_ADAPTER_VERSION_V01,
            physical_root_identity: request.root_scope.physical_root_identity,
          }),
        );
        return {
          result_version: "native_host_result.v0.1",
          request_id: request.request_id,
          run_id: request.run_id,
          outcome: syntheticFixtureOutput.terminal_outcome,
          public_stop_reason:
            syntheticFixtureOutput.terminal_outcome === "blocked"
              ? "sealed_interruption"
              : null,
          started_at: input.started_at,
          finished_at: input.finished_at,
          host_refs: [
            {
              ref_version: "external_ref.v0.1",
              ref_type: "commissioned_workbench_fixture_host",
              external_id: `opaque:${hostIdentityFingerprint.slice("sha256:".length, "sha256:".length + 32)}`,
              provider: null,
              host: null,
              observed_at: input.started_at,
              source_ref: hostIdentityFingerprint,
              compatibility_namespace: null,
              trust_class: "direct_local_observation",
            },
          ],
          adapter_version: COMMISSIONED_WORKBENCH_FIXTURE_ADAPTER_VERSION_V01,
          capability_version:
            COMMISSIONED_WORKBENCH_FIXTURE_CAPABILITY_VERSION_V01,
          changed_files: changedFiles,
          artifacts: [],
          observed_actions: ["applied_synthetic_fixture_output"],
          commands: [],
          checks: [],
          skipped_checks: [],
          model_invocation_receipt_refs: [],
          summary:
            syntheticFixtureOutput.terminal_outcome === "blocked"
              ? "The synthetic predecessor output was applied before the sealed interruption."
              : "The cold synthetic successor output was applied for mechanics evaluation.",
          uncertainty: [],
          gaps:
            syntheticFixtureOutput.terminal_outcome === "blocked"
              ? ["Required objective verification remains for the cold successor."]
              : [],
          proposed_next_steps: [],
          capability_coverage: [
            {
              capability: "bounded_repository_file_edit",
              coverage: "enforced",
              source_ref: request.root_scope.root_scope_ref,
              notes: [
                "Only the synthetic fixture output may touch paths permitted by the live-capable operation contract.",
              ],
            },
            {
              capability: "provider_model_network_absence",
              coverage: "enforced",
              source_ref: request.root_scope.root_scope_ref,
              notes: [
                "The adapter has no provider, model, command, network, or external-effect implementation.",
              ],
            },
          ],
          adapter_extension: {
            extension_version:
              "commissioned_workbench_fixture_extension.v0.1",
            adapter_kind: "commissioned_workbench_fixture_adapter",
            bounded_metadata: {
              packet_delivery_initiated: true,
              synthetic_fixture_write_count: changedFiles.length,
              provider_calls: 0,
              model_calls: 0,
              external_network_calls: 0,
              outside_root_writes: 0,
              live_authorization_created: false,
              product_execution_grant_created: false,
              fixture_admission_fingerprint:
                input.fixture_admission.integrity_fingerprint,
              fixture_admission_consumed: true,
              synthetic_fixture_binding_fingerprint:
                syntheticFixtureBinding.binding_fingerprint,
              synthetic_fixture_output_fingerprint:
                syntheticFixtureBinding.synthetic_fixture_output_fingerprint,
              execution_evidence_class:
                COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01,
              synthetic_fixture_output_applied: true,
              solution_write_plan_checked_during_result_admission: false,
              executor_claimed_complete:
                syntheticFixtureOutput.executor_claimed_complete,
              first_material_action_at: input.first_material_action_at,
              packet_material_set_fingerprint: packetMaterialSetFingerprint,
              delivered_material_set_fingerprint:
                packetMaterialSetFingerprint,
              continuation_materials_delivered:
                syntheticFixtureBinding.continuation_material_count,
              candidate_components_delivered:
                deliveredCandidateComponentIds.length,
              first_action_path_fingerprint:
                changedFiles[0] === undefined
                  ? null
                  : createProtocolSha256V01(
                      changedFiles[0].repository_relative_path,
                    ),
            },
          },
        };
      });
      return {
        result,
        settled: result.then(
          () => undefined,
          () => undefined,
        ),
        async request_stop() {
          stopRequested = true;
        },
      };
    },
  };
}

type CommissionedWorkbenchSyntheticFixtureBindingMaterialV01 = Omit<
  CommissionedWorkbenchSyntheticFixtureBindingV01,
  "binding_version" | "binding_fingerprint"
>;

function normalizeSyntheticFixtureBindingV01(
  binding: CommissionedWorkbenchSyntheticFixtureBindingV01,
): CommissionedWorkbenchSyntheticFixtureBindingV01 {
  const {
    binding_version: bindingVersion,
    binding_fingerprint: bindingFingerprint,
    ...material
  } = binding;
  const normalizedMaterial = normalizeSyntheticFixtureBindingMaterialV01(material);
  const normalizedWithoutFingerprint = {
    binding_version: "commissioned_workbench_synthetic_fixture_binding.v0.1" as const,
    ...normalizedMaterial,
  };
  if (
    bindingVersion !== normalizedWithoutFingerprint.binding_version ||
    !FINGERPRINT_V01.test(bindingFingerprint) ||
    bindingFingerprint !==
      createProtocolSha256V01(
        canonicalizeProtocolValueV01(normalizedWithoutFingerprint),
      ) ||
    canonicalizeProtocolValueV01({
      binding_version: bindingVersion,
      ...material,
    }) !== canonicalizeProtocolValueV01(normalizedWithoutFingerprint)
  ) {
    failV01("commissioned_workbench_synthetic_fixture_binding_invalid");
  }
  return {
    ...normalizedWithoutFingerprint,
    binding_fingerprint: bindingFingerprint,
  };
}

function normalizeSyntheticFixtureBindingMaterialV01(
  material: CommissionedWorkbenchSyntheticFixtureBindingMaterialV01,
): CommissionedWorkbenchSyntheticFixtureBindingMaterialV01 {
  if (
    !FINGERPRINT_V01.test(material.packet_material_set_fingerprint) ||
    !FINGERPRINT_V01.test(material.operation_contract_fingerprint) ||
    !FINGERPRINT_V01.test(material.synthetic_fixture_output_fingerprint) ||
    (material.expected_current_source_fingerprint !== null &&
      !FINGERPRINT_V01.test(material.expected_current_source_fingerprint)) ||
    !Number.isInteger(material.continuation_material_count) ||
    material.continuation_material_count < 0
  ) {
    failV01("commissioned_workbench_synthetic_fixture_binding_invalid");
  }
  const syntheticFixtureOutput = normalizeSyntheticFixtureOutputV01(
    material.synthetic_fixture_output,
  );
  const operationContract = normalizeOperationContractV01(
    material.operation_contract,
  );
  const currentSourcePaths = material.current_source_relative_paths
    .map(canonicalizeRepositoryRelativePathV01)
    .sort();
  const candidateComponentIds = normalizeCandidateComponentIdsV01(
    material.candidate_component_ids,
  );
  if (
    material.synthetic_fixture_output_fingerprint !==
      createProtocolSha256V01(
        canonicalizeProtocolValueV01(syntheticFixtureOutput),
      ) ||
    material.operation_contract_fingerprint !==
      createProtocolSha256V01(canonicalizeProtocolValueV01(operationContract)) ||
    syntheticFixtureOutput.writes.length > operationContract.max_changed_files ||
    syntheticFixtureOutput.writes.some(
      (write) =>
        !operationContract.allowed_repository_relative_paths.includes(
          write.repository_relative_path,
        ),
    ) ||
    new Set(currentSourcePaths).size !== currentSourcePaths.length ||
    (material.expected_current_source_fingerprint !== null &&
      currentSourcePaths.length === 0)
  ) {
    failV01("commissioned_workbench_synthetic_fixture_binding_invalid");
  }
  return {
    ...material,
    operation_contract: operationContract,
    synthetic_fixture_output: syntheticFixtureOutput,
    current_source_relative_paths: currentSourcePaths,
    candidate_component_ids: candidateComponentIds,
  };
}

function normalizeOperationContractV01(
  contract: CommissionedWorkEpisodeOperationContractV01,
): CommissionedWorkEpisodeOperationContractV01 {
  const allowedPaths = contract.allowed_repository_relative_paths
    .map(canonicalizeRepositoryRelativePathV01)
    .sort(compareCanonicalV01);
  if (
    canonicalizeProtocolValueV01(contract.allowed_operation_categories) !==
      canonicalizeProtocolValueV01(["repository_file_edit"]) ||
    allowedPaths.length === 0 ||
    new Set(allowedPaths).size !== allowedPaths.length ||
    !Number.isInteger(contract.max_changed_files) ||
    contract.max_changed_files < 1 ||
    contract.max_changed_files > allowedPaths.length ||
    !Number.isInteger(contract.max_commands) ||
    contract.max_commands < 1 ||
    contract.provider_authority_source !==
      "separate_live_authorization_required" ||
    contract.provider_calls_authorized_by_operation_contract !== false ||
    contract.external_network_call_limit !== 0 ||
    contract.outside_root_write_allowed !== false ||
    contract.github_mutation_allowed !== false ||
    contract.semantic_authority_allowed !== false
  ) {
    failV01("commissioned_workbench_operation_contract_invalid");
  }
  return {
    ...contract,
    allowed_operation_categories: ["repository_file_edit"],
    allowed_repository_relative_paths: allowedPaths,
  };
}

function normalizeSyntheticFixtureOutputV01(
  output: CommissionedWorkSyntheticFixtureOutputV01,
): CommissionedWorkSyntheticFixtureOutputV01 {
  const writes = output.writes.map((write) => ({
    repository_relative_path: canonicalizeRepositoryRelativePathV01(
      write.repository_relative_path,
    ),
    content: write.content,
  }));
  const forbiddenIssues = new Set<string>();
  scanForbiddenProtocolMaterialV01(
    output,
    "$synthetic_fixture_output",
    {
      error: (code) => forbiddenIssues.add(code),
      warning: () => {},
    },
    {
      secret_material_message:
        "Secret-shaped material is forbidden in synthetic CW1 fixture output.",
      provider_specific_field_message:
        "Provider-specific identity is forbidden in synthetic CW1 fixture output.",
    },
  );
  if (valueContainsPrivateAbsolutePathV01(output)) {
    forbiddenIssues.add("private_absolute_path");
  }
  if (
    output.output_version !== "commissioned_work_synthetic_fixture_output.v0.1" ||
    !SAFE_SEGMENT_V01.test(output.output_id) ||
    !SAFE_SEGMENT_V01.test(output.case_id) ||
    !SAFE_SEGMENT_V01.test(output.executor_role_id) ||
    output.experiment_class !== COMMISSIONED_WORK_EXPERIMENT_CLASS_V01 ||
    output.execution_evidence_class !==
      COMMISSIONED_WORK_EXECUTION_EVIDENCE_CLASS_V01 ||
    output.expected_mechanics_response !== true ||
    output.commissioned_behavioral_evidence !== false ||
    output.part_of_task_context_packet !== false ||
    output.part_of_candidate_derivation_evidence !== false ||
    output.required_by_live_executor_path !== false ||
    forbiddenIssues.size > 0 ||
    writes.length === 0 ||
    new Set(writes.map((write) => write.repository_relative_path)).size !==
      writes.length ||
    (output.episode_role === "predecessor" &&
      (output.condition !== null ||
        output.holdout_variant !== null ||
        output.terminal_outcome !== "blocked")) ||
    (output.episode_role === "successor" &&
      (output.condition === null || output.terminal_outcome !== "completed"))
  ) {
    failV01("commissioned_workbench_synthetic_fixture_output_invalid");
  }
  return { ...output, writes };
}

function valueContainsPrivateAbsolutePathV01(value: unknown): boolean {
  if (typeof value === "string") return PRIVATE_ABSOLUTE_PATH_V01.test(value);
  if (Array.isArray(value)) {
    return value.some(valueContainsPrivateAbsolutePathV01);
  }
  if (value && typeof value === "object") {
    return Object.values(value).some(valueContainsPrivateAbsolutePathV01);
  }
  return false;
}

function candidateComponentIdsFromPacketV01(
  packet: TaskContextPacketV01,
): CommissionedWorkCandidateComponentIdV01[] {
  const prefix = "candidate-component:";
  const componentIds = packet.selected_context
    .filter(
      (entry) =>
        entry.external_ref?.ref_type ===
        "commissioned_work_frozen_candidate_component",
    )
    .map((entry) => {
      const externalId = entry.external_ref?.external_id ?? "";
      const componentId = externalId.startsWith(prefix)
        ? externalId.slice(prefix.length)
        : "";
      if (
        !FINGERPRINT_V01.test(entry.source_ref ?? "") ||
        !COMMISSIONED_WORK_CANDIDATE_COMPONENT_IDS_V01.includes(
          componentId as CommissionedWorkCandidateComponentIdV01,
        )
      ) {
        failV01("commissioned_workbench_candidate_component_delivery_invalid");
      }
      return componentId as CommissionedWorkCandidateComponentIdV01;
    });
  return normalizeCandidateComponentIdsV01(componentIds);
}

function normalizeCandidateComponentIdsV01(
  componentIds: CommissionedWorkCandidateComponentIdV01[],
): CommissionedWorkCandidateComponentIdV01[] {
  if (
    new Set(componentIds).size !== componentIds.length ||
    componentIds.some(
      (componentId) =>
        !COMMISSIONED_WORK_CANDIDATE_COMPONENT_IDS_V01.includes(componentId),
    )
  ) {
    failV01("commissioned_workbench_candidate_component_delivery_invalid");
  }
  return COMMISSIONED_WORK_CANDIDATE_COMPONENT_IDS_V01.filter((componentId) =>
    componentIds.includes(componentId),
  );
}

function fixtureCaseIdFromWorkRefV01(request: NativeHostRequestV01): string {
  const prefix = "work:";
  const externalId = request.work_ref.external_id;
  if (!externalId.startsWith(prefix) || externalId.length <= prefix.length) {
    failV01("commissioned_workbench_synthetic_fixture_case_binding_invalid");
  }
  return externalId.slice(prefix.length);
}

function currentSourceFingerprintV01(root: string, relativePaths: string[]): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(
      relativePaths.map((repository_relative_path) => {
        const target = resolveTargetV01(root, repository_relative_path);
        const stat = lstatSync(target);
        if (stat.isSymbolicLink() || !stat.isFile()) {
          failV01("commissioned_workbench_adapter_current_source_invalid");
        }
        return {
          repository_relative_path,
          content_fingerprint: createProtocolSha256V01(
            canonicalizeProtocolValueV01(readFileSync(target, "utf8")),
          ),
        };
      }),
    ),
  );
}

function writeNoFollowV01(
  target: string,
  content: string,
  existed: boolean,
): { before: Buffer | null; after: Buffer } {
  const flags = existed
    ? FS_CONSTANTS.O_RDWR | FS_CONSTANTS.O_NOFOLLOW
    : FS_CONSTANTS.O_WRONLY |
      FS_CONSTANTS.O_CREAT |
      FS_CONSTANTS.O_EXCL |
      FS_CONSTANTS.O_NOFOLLOW;
  let descriptor: number | null = null;
  try {
    descriptor = openSync(target, flags, 0o600);
    const stat = fstatSync(descriptor);
    if (!stat.isFile()) {
      failV01("commissioned_workbench_adapter_target_not_file");
    }
    const before = existed ? readFileSync(descriptor) : null;
    if (existed) ftruncateSync(descriptor, 0);
    writeSync(descriptor, content, 0, "utf8");
    fsyncSync(descriptor);
    const after = Buffer.from(content, "utf8");
    return { before, after };
  } finally {
    if (descriptor !== null) closeSync(descriptor);
  }
}

function compareCanonicalV01(left: unknown, right: unknown): number {
  const leftValue = canonicalizeProtocolValueV01(left);
  const rightValue = canonicalizeProtocolValueV01(right);
  return leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;
}

function resolveTargetV01(root: string, relativePath: string): string {
  const target = path.join(root, relativePath);
  const relative = path.relative(root, target);
  if (
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    failV01("commissioned_workbench_adapter_target_escape");
  }
  assertExistingAncestorsNotSymlinksV01(root, target);
  return target;
}

function ensureParentChainV01(root: string, targetDirectory: string): void {
  const relative = path.relative(root, targetDirectory);
  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    if (!SAFE_SEGMENT_V01.test(segment)) {
      failV01("commissioned_workbench_adapter_directory_segment_invalid");
    }
    current = path.join(current, segment);
    if (existsSync(current)) {
      const stat = lstatSync(current);
      if (stat.isSymbolicLink() || !stat.isDirectory()) {
        failV01("commissioned_workbench_adapter_directory_boundary_invalid");
      }
    } else {
      mkdirSync(current, { mode: 0o700 });
    }
  }
}

function assertExistingAncestorsNotSymlinksV01(root: string, target: string): void {
  const relative = path.relative(root, target);
  let current = root;
  for (const segment of relative.split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    if (!existsSync(current)) break;
    if (lstatSync(current).isSymbolicLink()) {
      failV01("commissioned_workbench_adapter_symlink_refused");
    }
  }
}

function sha256V01(value: Buffer): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function failV01(code: string): never {
  throw new CommissionedWorkbenchFixtureAdapterErrorV01(code);
}
