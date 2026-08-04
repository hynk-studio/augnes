import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";

import { createDeterministicCodexAdapterV01 } from "@/lib/vnext/native-host/deterministic-codex-adapter";
import type { NativeHostAdapterV01 } from "@/types/vnext/native-host-adapter";

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
  const delegate = createDeterministicCodexAdapterV01();
  return {
    adapter_version: CANONICAL_REPOSITORY_DELEGATION_TEST_ADAPTER_VERSION_V01,
    capability_version:
      CANONICAL_REPOSITORY_DELEGATION_TEST_CAPABILITY_VERSION_V01,
    execution_profile: "deterministic_zero_model",
    provider_egress: "forbidden",
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
      const startedAt = new Date().toISOString();
      writeFileSync(target, content, { encoding: "utf8", flag: "wx" });
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
      const invocation = delegate.invoke(request, control);
      const result = invocation.result.then((base) => ({
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
      }));
      return {
        result,
        settled: result.then(() => undefined, () => undefined),
        request_stop: invocation.request_stop,
      };
    },
  };
}
