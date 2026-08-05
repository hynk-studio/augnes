import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";

import { createDeterministicCodexAdapterV01 } from "@/lib/vnext/native-host/deterministic-codex-adapter";
import type {
  NativeHostAdapterV01,
  NativeHostLifecycleEventV01,
  NativeHostRequestV01,
} from "@/types/vnext/native-host-adapter";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

export const CANONICAL_REPOSITORY_DELEGATION_TEST_ADAPTER_VERSION_V01 =
  "canonical_repository_delegation_test_adapter.v0.1" as const;
export const CANONICAL_REPOSITORY_DELEGATION_TEST_CAPABILITY_VERSION_V01 =
  "canonical_repository_delegation_test_capability.v0.1" as const;
export const CANONICAL_REPOSITORY_DELEGATION_TEST_FILE_V01 =
  "cdx2b2b-runtime-proof.txt" as const;

/**
 * Exact, source-runtime-only proof adapter. It is unreachable unless the
 * canonical disposable-test boundary selected it before service creation.
 * The fixed operation intentionally exercises the same NativeHost delivery,
 * result, receipt, and proposal owners without provider or network egress.
 */
export function createCanonicalRepositoryDelegationTestAdapterV01(
  environment: NodeJS.ProcessEnv = process.env,
): NativeHostAdapterV01 {
  if (
    environment.AUGNES_CANONICAL_TEST_MODE !== "1" ||
    environment.AUGNES_VNEXT_REPOSITORY_DELEGATION_TEST_ADAPTER !== "1"
  ) {
    throw new Error("canonical_repository_delegation_test_adapter_forbidden");
  }
  const temporaryRoot = environment.AUGNES_CANONICAL_TEMP_ROOT;
  if (!temporaryRoot || !path.isAbsolute(temporaryRoot)) {
    throw new Error("canonical_repository_delegation_test_root_required");
  }
  const checkpointScenario =
    environment.AUGNES_VNEXT_REPOSITORY_CHECKPOINT_TEST_SCENARIO ?? "safe";
  if (!["safe", "incomplete", "approval"].includes(checkpointScenario)) {
    throw new Error("canonical_repository_checkpoint_test_scenario_invalid");
  }
  const delegate = createDeterministicCodexAdapterV01();
  return {
    adapter_version: CANONICAL_REPOSITORY_DELEGATION_TEST_ADAPTER_VERSION_V01,
    capability_version:
      CANONICAL_REPOSITORY_DELEGATION_TEST_CAPABILITY_VERSION_V01,
    execution_profile: "deterministic_zero_model",
    provider_egress: "forbidden",
    resume_capability: {
      binding_version: "native_host_resume_binding.v0.1",
      resumable_after_detach: true,
    },
    invoke(request, control) {
      if (
        request.mode !== "repository_attachment" ||
        !request.repository_delegation_context ||
        control.cancellation_signal.aborted
      ) {
        throw new Error("canonical_repository_delegation_test_request_invalid");
      }
      const canonicalRoot = realpathSync(request.root_scope.canonical_root);
      const canonicalTemporaryRoot = realpathSync(temporaryRoot);
      if (
        canonicalRoot !== canonicalTemporaryRoot &&
        !canonicalRoot.startsWith(`${canonicalTemporaryRoot}${path.sep}`)
      ) {
        throw new Error("canonical_repository_delegation_test_scope_refused");
      }
      if (
        request.repository_delegation_context.protected_untracked_paths.includes(
          CANONICAL_REPOSITORY_DELEGATION_TEST_FILE_V01,
        )
      ) {
        throw new Error("canonical_repository_delegation_test_untracked_conflict");
      }
      const target = path.join(
        canonicalRoot,
        CANONICAL_REPOSITORY_DELEGATION_TEST_FILE_V01,
      );
      if (existsSync(target)) {
        throw new Error("canonical_repository_delegation_test_target_exists");
      }
      const content = "CDX2B2B managed repository delegation runtime proof\n";
      const invocation = delegate.invoke(request, control);
      const result = (async () => {
        const refs = canonicalResumeRefsV01(request);
        await reportCanonicalLifecycleV01(request, control, refs, {
          event_kind: "thread_bound",
          bounded_metadata: { source: "canonical_repository_test_adapter" },
        });
        await reportCanonicalLifecycleV01(request, control, refs, {
          event_kind: "turn_started",
          bounded_metadata: { source: "canonical_repository_test_adapter" },
        });
        const fileOperation = canonicalOperationRefV01(request, "file_change");
        await reportCanonicalCheckpointV01(request, control, refs, {
          operation_ref: fileOperation,
          operation_class: "file_change",
          phase: "declared",
          certainty: "not_started",
          change_count: 1,
        });
        await reportCanonicalCheckpointV01(request, control, refs, {
          operation_ref: fileOperation,
          operation_class: "file_change",
          phase: "started",
          certainty: "started",
          change_count: 1,
        });
        if (checkpointScenario === "incomplete") {
          await holdCanonicalInvocationV01(control);
        }
        const startedAt = new Date().toISOString();
        writeFileSync(target, content, { encoding: "utf8", flag: "wx" });
        await reportCanonicalCheckpointV01(request, control, refs, {
          operation_ref: fileOperation,
          operation_class: "file_change",
          phase: "completed",
          certainty: "completed",
          change_count: 1,
        });
        if (checkpointScenario === "approval") {
          const approvalRef = canonicalExternalRefV01(
            "host_approval_request",
            `canonical-approval-request:${request.run_id}`,
          );
          const itemRef = canonicalExternalRefV01(
            "host_item",
            `canonical-approval-item:${request.run_id}`,
          );
          await control.lifecycle_sink!.request_approval({
            approval_version: "native_host_approval.v0.1",
            approval_id: `native-host-approval:${request.run_id}`,
            idempotency_fingerprint: createProtocolFingerprintV01(
              `canonical-approval:${request.run_id}`,
            ),
            workspace_id: request.workspace_id,
            project_id: request.project_id,
            run_id: request.run_id,
            packet_id: request.packet.packet_id,
            packet_fingerprint: request.packet.integrity.fingerprint,
            host_thread_ref: refs[0]!,
            host_turn_ref: refs[1]!,
            host_item_ref: itemRef,
            host_request_ref: approvalRef,
            operation_class: "command_execution",
            repository_relative_paths: [],
            network_resources: [],
            command_summary: "Run one fixed local content check.",
            command_fingerprint: createProtocolFingerprintV01(
              "canonical_repository_fixture_check.v0.1",
            ),
            resource_summary: "One bounded local repository check",
            public_reason: "Review the requested bounded local check.",
            public_risk_summary: "The check may read repository files.",
            budget_impact: null,
            available_decisions: ["approve_once", "decline", "cancel_run"],
            issued_at: new Date().toISOString(),
            expires_at: null,
            coverage: "observed",
            repository_envelope_classification: "approval_required",
          });
        }
        const commandOperation = canonicalOperationRefV01(
          request,
          "command_execution",
        );
        await reportCanonicalCheckpointV01(request, control, refs, {
          operation_ref: commandOperation,
          operation_class: "command_execution",
          phase: "declared",
          certainty: "not_started",
          change_count: null,
        });
        await reportCanonicalCheckpointV01(request, control, refs, {
          operation_ref: commandOperation,
          operation_class: "command_execution",
          phase: "started",
          certainty: "started",
          change_count: null,
        });
        execFileSync(
          process.execPath,
          [
            "--eval",
            `const fs=require("node:fs");const value=fs.readFileSync(${JSON.stringify(CANONICAL_REPOSITORY_DELEGATION_TEST_FILE_V01)},"utf8");if(value!==${JSON.stringify(content)})process.exit(1);`,
          ],
          {
            cwd: canonicalRoot,
            env: { NODE_ENV: "test", PATH: process.env.PATH ?? "" },
            stdio: "ignore",
            timeout: 5_000,
          },
        );
        await reportCanonicalCheckpointV01(request, control, refs, {
          operation_ref: commandOperation,
          operation_class: "command_execution",
          phase: "completed",
          certainty: "completed",
          change_count: null,
        });
        if (
          environment.AUGNES_VNEXT_REPOSITORY_CHECKPOINT_HOLD === "1"
        ) {
          await holdCanonicalInvocationV01(control);
        }
        const base = await invocation.result;
        return {
        ...base,
        adapter_version:
          CANONICAL_REPOSITORY_DELEGATION_TEST_ADAPTER_VERSION_V01,
        capability_version:
          CANONICAL_REPOSITORY_DELEGATION_TEST_CAPABILITY_VERSION_V01,
        changed_files: [
          {
            repository_relative_path:
              CANONICAL_REPOSITORY_DELEGATION_TEST_FILE_V01,
            change_kind: "added" as const,
            before_hash: null,
            after_hash: `sha256:${createHash("sha256").update(content).digest("hex")}`,
          },
        ],
        observed_actions: [
          ...base.observed_actions,
          "created_one_fixed_fixture_inside_exact_repository_root",
          "ran_one_fixed_local_content_check",
        ],
        commands: [
          {
            command_id: "canonical_repository_fixture_check",
            summary: "Verify the fixed managed-delegation fixture content.",
            command_fingerprint: `sha256:${createHash("sha256")
              .update("canonical_repository_fixture_check.v0.1")
              .digest("hex")}`,
            started_at: startedAt,
            finished_at: new Date().toISOString(),
            exit_code: 0,
            status: "completed" as const,
          },
        ],
        checks: [
          ...base.checks,
          {
            check_id: "canonical_repository_fixture_content",
            required: true,
            status: "passed" as const,
            summary:
              "The fixed fixture was written and read back inside the exact repository root.",
          },
        ],
        skipped_checks: [],
        summary:
          "One deterministic managed worker changed a bounded fixture and completed one local check.",
        gaps: [
          "No real-provider model-mediated Codex conversation was exercised.",
        ],
        capability_coverage: base.capability_coverage.map((coverage) =>
          coverage.capability === "repository_command_execution"
            ? {
                ...coverage,
                coverage: "enforced" as const,
                source_ref: request.root_scope.root_scope_ref,
                notes: [
                  "The canonical disposable proof adapter ran one fixed local check inside the exact root.",
                ],
              }
            : coverage
        ),
        adapter_extension: {
          extension_version: "repository_delegation_test_extension.v0.1",
          adapter_kind: "canonical_repository_delegation_test",
          bounded_metadata: {
            execution_kind: "deterministic_local_repository_proof",
            project_file_changes: 1,
            project_commands: 1,
            provider_egress: false,
          },
        },
        };
      })();
      return {
        result,
        settled: result.then(() => undefined, () => undefined),
        request_stop: invocation.request_stop,
      };
    },
  };
}

function canonicalOperationRefV01(
  request: NativeHostRequestV01,
  operationClass: "file_change" | "command_execution",
): string {
  return `sha256:${createHash("sha256")
    .update(`${request.run_id}:${operationClass}:canonical.v0.1`)
    .digest("hex")}`;
}

function canonicalResumeRefsV01(request: NativeHostRequestV01): ExternalRefV01[] {
  return [
    canonicalExternalRefV01("host_thread", `canonical-thread:${request.run_id}`),
    canonicalExternalRefV01("host_turn", `canonical-turn:${request.run_id}`),
  ];
}

function canonicalExternalRefV01(
  refType: string,
  externalId: string,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    provider: "codex",
    host: "app_server",
    observed_at: new Date().toISOString(),
    trust_class: "direct_local_observation",
  };
}

function createProtocolFingerprintV01(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

async function holdCanonicalInvocationV01(
  control: Parameters<NativeHostAdapterV01["invoke"]>[1],
): Promise<never> {
  return new Promise<never>((_resolve, reject) => {
    control.cancellation_signal.addEventListener(
      "abort",
      () => reject(new Error("canonical_repository_checkpoint_hold_cancelled")),
      { once: true },
    );
  });
}

async function reportCanonicalCheckpointV01(
  request: NativeHostRequestV01,
  control: Parameters<NativeHostAdapterV01["invoke"]>[1],
  refs: ExternalRefV01[],
  input: {
    operation_ref: string;
    operation_class: "file_change" | "command_execution";
    phase: "declared" | "started" | "completed";
    certainty: "not_started" | "started" | "completed";
    change_count: number | null;
  },
): Promise<void> {
  await reportCanonicalLifecycleV01(request, control, refs, {
    event_kind: "work_checkpoint",
    bounded_metadata: {
      checkpoint_kind: input.operation_class,
      operation_ref: input.operation_ref,
      phase: input.phase,
      certainty: input.certainty,
      status: input.phase === "completed" ? "completed" : "active",
      change_count: input.change_count,
    },
  });
}

async function reportCanonicalLifecycleV01(
  request: NativeHostRequestV01,
  control: Parameters<NativeHostAdapterV01["invoke"]>[1],
  refs: ExternalRefV01[],
  input: Pick<NativeHostLifecycleEventV01, "event_kind" | "bounded_metadata">,
): Promise<void> {
  if (!control.lifecycle_sink) return;
  const observedAt = new Date().toISOString();
  const fingerprint = createHash("sha256")
    .update(JSON.stringify({
      run_id: request.run_id,
      event_kind: input.event_kind,
      bounded_metadata: input.bounded_metadata,
    }))
    .digest("hex");
  await control.lifecycle_sink.report_event({
    event_id: `native-host-event:${fingerprint}`,
    run_id: request.run_id,
    state: "running",
    event_kind: input.event_kind,
    observed_at: observedAt,
    coverage: "observed",
    host_refs: refs,
    bounded_metadata: input.bounded_metadata,
  });
}
