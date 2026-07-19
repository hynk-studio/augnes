import { createHash } from "node:crypto";
import { lstat, readdir, realpath } from "node:fs/promises";

import {
  NATIVE_HOST_RESULT_VERSION_V01,
  type NativeHostAdapterV01,
  type NativeHostInvocationControlV01,
  type NativeHostRequestV01,
  type NativeHostResultV01,
} from "@/types/vnext/native-host-adapter";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

export const LOCAL_PROJECT_VERIFICATION_ADAPTER_VERSION_V01 =
  "local_project_verification_adapter.v0.1" as const;
export const LOCAL_PROJECT_VERIFICATION_CAPABILITY_VERSION_V01 =
  "local_project_root_manifest_verification.v0.1" as const;

const MAX_ROOT_ENTRIES_V01 = 512;

/**
 * Production zero-model host profile for one bounded, useful local operation.
 * It verifies the exact admitted root and fingerprints a bounded canonical
 * top-level manifest. It never executes commands, mutates files, or performs
 * provider/network egress.
 */
export function createLocalProjectVerificationAdapterV01(
  options: { now?: () => string } = {},
): NativeHostAdapterV01 {
  const now = options.now ?? (() => new Date().toISOString());
  return {
    adapter_version: LOCAL_PROJECT_VERIFICATION_ADAPTER_VERSION_V01,
    capability_version: LOCAL_PROJECT_VERIFICATION_CAPABILITY_VERSION_V01,
    execution_profile: "deterministic_zero_model",
    provider_egress: "forbidden",
    invoke(
      request: NativeHostRequestV01,
      control: NativeHostInvocationControlV01,
    ) {
      const result = verifyProjectRootV01(request, control, now);
      const settled = result.then(
        () => undefined,
        () => undefined,
      );
      return {
        result,
        settled,
        request_stop: async () => {
          await settled;
        },
      };
    },
  };
}

async function verifyProjectRootV01(
  request: NativeHostRequestV01,
  control: NativeHostInvocationControlV01,
  now: () => string,
): Promise<NativeHostResultV01> {
  const startedAt = now();
  if (control.cancellation_signal.aborted) {
    return terminalResultV01(request, startedAt, now(), {
      outcome: "cancelled",
      public_stop_reason: "local_project_verification_cancelled",
      summary: "The bounded local verification was cancelled before root inspection.",
      checks: [],
      artifacts: [],
      gaps: ["The exact project root was not inspected."],
    });
  }
  try {
    const canonicalRoot = request.root_scope.canonical_root;
    const [resolvedRoot, stat, entries] = await Promise.all([
      realpath(canonicalRoot),
      lstat(canonicalRoot),
      readdir(canonicalRoot, { withFileTypes: true }),
    ]);
    if (control.cancellation_signal.aborted) {
      return terminalResultV01(request, startedAt, now(), {
        outcome: "cancelled",
        public_stop_reason: "local_project_verification_cancelled",
        summary: "The bounded local verification was cancelled during root inspection.",
        checks: [],
        artifacts: [],
        gaps: ["The root manifest was not admitted as a completed observation."],
      });
    }
    if (!resolvedRoot || !stat.isDirectory()) {
      return terminalResultV01(request, startedAt, now(), {
        outcome: "blocked",
        public_stop_reason: "local_project_root_scope_conflict",
        summary: "The persisted project root did not resolve to the exact admitted directory.",
        checks: [
          {
            check_id: "project_root_scope_verified",
            required: true,
            status: "blocked",
            summary: "The exact persisted project-root binding could not be verified.",
          },
        ],
        artifacts: [],
        gaps: ["No root manifest was produced because the exact root binding failed."],
      });
    }
    if (entries.length > MAX_ROOT_ENTRIES_V01) {
      return terminalResultV01(request, startedAt, now(), {
        outcome: "blocked",
        public_stop_reason: "local_project_root_manifest_bound_exceeded",
        summary: "The project root exceeds the bounded local manifest profile.",
        checks: [
          {
            check_id: "project_root_manifest_bound",
            required: true,
            status: "blocked",
            summary: `The root contains more than ${MAX_ROOT_ENTRIES_V01} top-level entries.`,
          },
        ],
        artifacts: [],
        gaps: ["No partial root manifest was retained."],
      });
    }
    const manifest = entries
      .map((entry) => ({
        name: entry.name,
        kind: entry.isDirectory()
          ? "directory"
          : entry.isFile()
            ? "file"
            : entry.isSymbolicLink()
              ? "symbolic_link"
              : "other",
      }))
      .sort((left, right) =>
        left.name.localeCompare(right.name) || left.kind.localeCompare(right.kind),
      );
    const manifestFingerprint = `sha256:${createHash("sha256")
      .update(JSON.stringify(manifest))
      .digest("hex")}`;
    const finishedAt = now();
    return terminalResultV01(request, startedAt, finishedAt, {
      outcome: "completed",
      public_stop_reason: null,
      summary:
        "Verified the exact project root and one bounded canonical top-level manifest without commands, mutation, model use, or network access.",
      checks: [
        {
          check_id: "project_root_scope_verified",
          required: true,
          status: "passed",
          summary: "The persisted root resolved to the exact admitted project directory.",
        },
        {
          check_id: "project_root_manifest_verified",
          required: true,
          status: "passed",
          summary: `A canonical manifest of ${manifest.length} top-level entries was fingerprinted within the ${MAX_ROOT_ENTRIES_V01}-entry bound.`,
        },
      ],
      artifacts: [
        {
          artifact_ref: refV01(
            "project_root_manifest",
            `${request.project_id}:${request.root_scope.root_fingerprint}`,
            finishedAt,
            manifestFingerprint,
          ),
          summary: `Canonical top-level project-root manifest (${manifest.length} entries; content retained only as a fingerprint).`,
        },
      ],
      gaps: [],
    });
  } catch {
    return terminalResultV01(request, startedAt, now(), {
      outcome: "failed",
      public_stop_reason: "local_project_verification_failed",
      summary: "The bounded local project-root verification could not be completed.",
      checks: [
        {
          check_id: "project_root_scope_verified",
          required: true,
          status: "failed",
          summary: "The exact persisted project root could not be inspected.",
        },
      ],
      artifacts: [],
      gaps: ["No root manifest was produced."],
    });
  }
}

function terminalResultV01(
  request: NativeHostRequestV01,
  startedAt: string,
  finishedAt: string,
  input: Pick<
    NativeHostResultV01,
    "outcome" | "public_stop_reason" | "summary" | "checks" | "artifacts" | "gaps"
  >,
): NativeHostResultV01 {
  const observedCheckIds = new Set(input.checks.map((check) => check.check_id));
  const hostRef = refV01(
    "native_host_adapter",
    LOCAL_PROJECT_VERIFICATION_ADAPTER_VERSION_V01,
    finishedAt,
    null,
  );
  return {
    result_version: NATIVE_HOST_RESULT_VERSION_V01,
    request_id: request.request_id,
    run_id: request.run_id,
    outcome: input.outcome,
    public_stop_reason: input.public_stop_reason,
    started_at: startedAt,
    finished_at: finishedAt,
    host_refs: [hostRef],
    adapter_version: LOCAL_PROJECT_VERIFICATION_ADAPTER_VERSION_V01,
    capability_version: LOCAL_PROJECT_VERIFICATION_CAPABILITY_VERSION_V01,
    changed_files: [],
    artifacts: input.artifacts,
    observed_actions: [
      "verified_exact_project_root_binding",
      "fingerprinted_bounded_project_root_manifest",
    ],
    commands: [],
    checks: input.checks,
    skipped_checks: request.packet.constraints.required_checks
      .filter((checkId) => !observedCheckIds.has(checkId))
      .map((checkId) => ({
        check_id: checkId,
        required: true,
        reason:
          "The production zero-model verification profile executes no arbitrary repository commands; task-specific command checks remain explicitly skipped.",
      })),
    model_invocation_receipt_refs: [],
    summary: input.summary,
    uncertainty: [],
    gaps: input.gaps,
    proposed_next_steps: [
      "Review the immutable receipt and pending proposal before any semantic action.",
    ],
    capability_coverage: [
      {
        capability: "project_root_manifest_verification",
        coverage: input.outcome === "completed" ? "enforced" : "observed",
        source_ref: hostRef,
        notes: [
          "The adapter is limited to an exact, bounded, read-only project-root manifest operation.",
        ],
      },
      {
        capability: "repository_command_execution",
        coverage: "unsupported",
        source_ref: null,
        notes: ["Arbitrary command execution is unavailable in this profile."],
      },
      {
        capability: "provider_or_model_egress",
        coverage: "enforced",
        source_ref: hostRef,
        notes: ["The in-process adapter contains no provider, model, or network path."],
      },
    ],
    adapter_extension: {
      extension_version: "local_project_verification_extension.v0.1",
      adapter_kind: "local_project_verification",
      bounded_metadata: {
        live_host_invoked: true,
        packet_delivery_initiated: true,
        local_read_only_operation: true,
        raw_provider_payload_included: false,
      },
    },
  };
}

function refV01(
  refType: string,
  externalId: string,
  observedAt: string,
  sourceRef: string | null,
): ExternalRefV01 {
  return {
    ref_version: "external_ref.v0.1",
    ref_type: refType,
    external_id: externalId,
    observed_at: observedAt,
    source_ref: sourceRef,
    compatibility_namespace: LOCAL_PROJECT_VERIFICATION_ADAPTER_VERSION_V01,
    trust_class: "direct_local_observation",
  };
}
