import { opendir, realpath, stat } from "node:fs/promises";

import {
  canonicalizeProtocolValueV01,
  compareProtocolCodeUnitsV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  inspectNativeHostPhysicalRootIdentityV01,
  type ProjectRootIdentityFilesystemV01,
} from "@/lib/vnext/native-host/project-root-identity";
import {
  LOCAL_PROJECT_ROOT_VERIFICATION_REQUIRED_CHECKS_V01,
} from "@/lib/vnext/automation/local-project-root-verification-profile";
import {
  NATIVE_HOST_RESULT_VERSION_V01,
  type NativeHostAdapterV01,
  type NativeHostInvocationControlV01,
  type NativeHostRequestV01,
  type NativeHostResultV01,
  type NativeHostPhysicalRootIdentityV01,
} from "@/types/vnext/native-host-adapter";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";

export const LOCAL_PROJECT_VERIFICATION_ADAPTER_VERSION_V01 =
  "local_project_verification_adapter.v0.1" as const;
export const LOCAL_PROJECT_VERIFICATION_CAPABILITY_VERSION_V01 =
  "local_project_root_manifest_verification.v0.1" as const;

export const MAX_ROOT_ENTRIES_V01 = 512;
export const MAX_ROOT_ENTRY_NAME_BYTES_V01 = 255;

export type ProjectRootManifestEntryKindV01 =
  | "directory"
  | "file"
  | "symbolic_link"
  | "other";

export interface ProjectRootManifestEntryV01 {
  name: string;
  kind: ProjectRootManifestEntryKindV01;
}

export interface BoundedProjectRootDirectoryEntryV01 {
  name: string;
  isDirectory(): boolean;
  isFile(): boolean;
  isSymbolicLink(): boolean;
}

export interface BoundedProjectRootDirectoryHandleV01 {
  read(): Promise<BoundedProjectRootDirectoryEntryV01 | null>;
  close(): Promise<void>;
}

export interface LocalProjectVerificationFilesystemV01
  extends ProjectRootIdentityFilesystemV01 {
  openDirectory(pathname: string): Promise<BoundedProjectRootDirectoryHandleV01>;
}

const SYSTEM_LOCAL_PROJECT_VERIFICATION_FILESYSTEM_V01: LocalProjectVerificationFilesystemV01 = {
  realpath,
  stat,
  async openDirectory(pathname) {
    return opendir(pathname);
  },
};

export type BoundedProjectRootEnumerationResultV01 =
  | {
      status: "completed";
      entries: ProjectRootManifestEntryV01[];
      entries_read: number;
    }
  | {
      status: "cancelled";
      entries_read: number;
    }
  | {
      status: "bound_exceeded";
      entries_read: number;
    };

/**
 * Reads at most maxEntries + 1 directory entries and always closes the owned
 * handle. Partial material is never returned for cancellation or overflow.
 */
export async function enumerateBoundedProjectRootManifestV01(input: {
  open_directory: () => Promise<BoundedProjectRootDirectoryHandleV01>;
  cancellation_signal: AbortSignal;
  max_entries?: number;
}): Promise<BoundedProjectRootEnumerationResultV01> {
  const maxEntries = input.max_entries ?? MAX_ROOT_ENTRIES_V01;
  if (!Number.isSafeInteger(maxEntries) || maxEntries < 0 || maxEntries > 4096) {
    throw new Error("local_project_root_manifest_bound_invalid");
  }
  const handle = await input.open_directory();
  const entries: ProjectRootManifestEntryV01[] = [];
  let entriesRead = 0;
  try {
    while (true) {
      if (input.cancellation_signal.aborted) {
        return { status: "cancelled", entries_read: entriesRead };
      }
      const entry = await handle.read();
      if (input.cancellation_signal.aborted) {
        return { status: "cancelled", entries_read: entriesRead };
      }
      if (entry === null) {
        return {
          status: "completed",
          entries: normalizeProjectRootManifestV01(entries),
          entries_read: entriesRead,
        };
      }
      entriesRead += 1;
      if (entriesRead > maxEntries) {
        return {
          status: "bound_exceeded",
          entries_read: maxEntries + 1,
        };
      }
      entries.push(normalizeProjectRootManifestEntryV01(entry));
    }
  } finally {
    await handle.close();
  }
}

export function normalizeProjectRootManifestV01(
  entries: readonly ProjectRootManifestEntryV01[],
): ProjectRootManifestEntryV01[] {
  if (entries.length > MAX_ROOT_ENTRIES_V01) {
    throw new Error("local_project_root_manifest_bound_exceeded");
  }
  const normalized = entries.map(normalizeProjectRootManifestEntryV01);
  normalized.sort((left, right) =>
    compareProtocolCodeUnitsV01(left.name, right.name) ||
    compareProtocolCodeUnitsV01(left.kind, right.kind),
  );
  for (let index = 1; index < normalized.length; index += 1) {
    if (normalized[index - 1]!.name === normalized[index]!.name) {
      throw new Error("local_project_root_manifest_duplicate_name");
    }
  }
  return normalized;
}

export function fingerprintProjectRootManifestV01(
  entries: readonly ProjectRootManifestEntryV01[],
): string {
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(normalizeProjectRootManifestV01(entries)),
  );
}

/**
 * Production zero-model host profile for one bounded, useful local operation.
 * It verifies the exact admitted root and fingerprints a bounded canonical
 * top-level manifest. It never executes commands, mutates files, or performs
 * provider/network egress.
 */
export function createLocalProjectVerificationAdapterV01(
  options: {
    now?: () => string;
    filesystem?: LocalProjectVerificationFilesystemV01;
  } = {},
): NativeHostAdapterV01 {
  const now = options.now ?? (() => new Date().toISOString());
  const filesystem =
    options.filesystem ?? SYSTEM_LOCAL_PROJECT_VERIFICATION_FILESYSTEM_V01;
  return {
    adapter_version: LOCAL_PROJECT_VERIFICATION_ADAPTER_VERSION_V01,
    capability_version: LOCAL_PROJECT_VERIFICATION_CAPABILITY_VERSION_V01,
    execution_profile: "deterministic_zero_model",
    provider_egress: "forbidden",
    invoke(request, control) {
      const result = verifyProjectRootV01(request, control, now, filesystem);
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
  filesystem: LocalProjectVerificationFilesystemV01,
): Promise<NativeHostResultV01> {
  const startedAt = now();
  if (control.cancellation_signal.aborted) {
    return terminalResultV01(request, startedAt, now(), {
      outcome: "cancelled",
      public_stop_reason: "local_project_verification_cancelled",
      summary: "The bounded local verification was cancelled before root inspection.",
      checks: [],
      observed_actions: [],
      artifacts: [],
      gaps: ["The exact project root was not inspected."],
      root_identity_verified: false,
      manifest_completed: false,
    });
  }

  let exactIdentity: NativeHostPhysicalRootIdentityV01;
  try {
    exactIdentity = await inspectNativeHostPhysicalRootIdentityV01(
      request.root_scope.canonical_root,
      filesystem,
    );
  } catch {
    return rootConflictResultV01(request, startedAt, now());
  }
  if (
    canonicalizeProtocolValueV01(exactIdentity) !==
    canonicalizeProtocolValueV01(request.root_scope.physical_root_identity)
  ) {
    return rootConflictResultV01(request, startedAt, now());
  }
  if (control.cancellation_signal.aborted) {
    return terminalResultV01(request, startedAt, now(), {
      outcome: "cancelled",
      public_stop_reason: "local_project_verification_cancelled",
      summary: "The bounded local verification was cancelled before manifest enumeration.",
      checks: [passedRootCheckV01()],
      observed_actions: [
        "project_root_inspection_started",
        "verified_exact_project_root_binding",
      ],
      artifacts: [],
      gaps: ["The root manifest was not enumerated."],
      root_identity_verified: true,
      manifest_completed: false,
    });
  }

  let enumeration: BoundedProjectRootEnumerationResultV01;
  try {
    enumeration = await enumerateBoundedProjectRootManifestV01({
      open_directory: () =>
        filesystem.openDirectory(request.root_scope.canonical_root),
      cancellation_signal: control.cancellation_signal,
    });
  } catch {
    return terminalResultV01(request, startedAt, now(), {
      outcome: "failed",
      public_stop_reason: "local_project_verification_failed",
      summary: "The exact project root was verified, but its bounded manifest could not be enumerated.",
      checks: [
        passedRootCheckV01(),
        {
          check_id: "project_root_manifest_verified",
          required: true,
          status: "failed",
          summary: "The bounded top-level manifest could not be enumerated.",
        },
      ],
      observed_actions: [
        "project_root_inspection_started",
        "verified_exact_project_root_binding",
      ],
      artifacts: [],
      gaps: ["No root manifest fingerprint was produced."],
      root_identity_verified: true,
      manifest_completed: false,
    });
  }

  if (enumeration.status === "cancelled") {
    return terminalResultV01(request, startedAt, now(), {
      outcome: "cancelled",
      public_stop_reason: "local_project_verification_cancelled",
      summary: "The bounded local verification was cancelled during manifest enumeration.",
      checks: [passedRootCheckV01()],
      observed_actions: [
        "project_root_inspection_started",
        "verified_exact_project_root_binding",
      ],
      artifacts: [],
      gaps: ["No partial root manifest was retained."],
      root_identity_verified: true,
      manifest_completed: false,
    });
  }
  if (enumeration.status === "bound_exceeded") {
    return terminalResultV01(request, startedAt, now(), {
      outcome: "blocked",
      public_stop_reason: "local_project_root_manifest_bound_exceeded",
      summary: "The project root exceeds the bounded local manifest profile.",
      checks: [
        passedRootCheckV01(),
        {
          check_id: "project_root_manifest_bound",
          required: true,
          status: "blocked",
          summary: `The root contains more than ${MAX_ROOT_ENTRIES_V01} top-level entries.`,
        },
      ],
      observed_actions: [
        "project_root_inspection_started",
        "verified_exact_project_root_binding",
        "project_root_manifest_bound_exceeded",
      ],
      artifacts: [],
      gaps: ["No partial root manifest was retained."],
      root_identity_verified: true,
      manifest_completed: false,
    });
  }

  const manifestFingerprint = fingerprintProjectRootManifestV01(
    enumeration.entries,
  );
  const finishedAt = now();
  return terminalResultV01(request, startedAt, finishedAt, {
    outcome: "completed",
    public_stop_reason: null,
    summary:
      "Verified the exact project root and one bounded canonical top-level manifest without commands, mutation, model use, or network access.",
    checks: [
      passedRootCheckV01(),
      {
        check_id: "project_root_manifest_bound",
        required: true,
        status: "passed",
        summary: `Manifest enumeration completed within the ${MAX_ROOT_ENTRIES_V01}-entry bound.`,
      },
      {
        check_id: "project_root_manifest_verified",
        required: true,
        status: "passed",
        summary: `A canonical manifest of ${enumeration.entries.length} top-level entries was fingerprinted.`,
      },
      {
        check_id: "provider_model_network_absent",
        required: true,
        status: "passed",
        summary: "The in-process adapter has no provider, model, or network path.",
      },
      {
        check_id: "project_file_mutation_absent",
        required: true,
        status: "passed",
        summary: "The bounded adapter performed no command or file mutation.",
      },
    ],
    observed_actions: [
      "project_root_inspection_started",
      "verified_exact_project_root_binding",
      "enumerated_bounded_project_root_manifest",
      "fingerprinted_bounded_project_root_manifest",
    ],
    artifacts: [
      {
        artifact_ref: refV01(
          "project_root_manifest",
          `${request.project_id}:${request.root_scope.root_fingerprint}`,
          finishedAt,
          manifestFingerprint,
        ),
        summary: `Canonical top-level project-root manifest (${enumeration.entries.length} entries; content retained only as a fingerprint).`,
      },
    ],
    gaps: [],
    root_identity_verified: true,
    manifest_completed: true,
  });
}

function rootConflictResultV01(
  request: NativeHostRequestV01,
  startedAt: string,
  finishedAt: string,
): NativeHostResultV01 {
  return terminalResultV01(request, startedAt, finishedAt, {
    outcome: "blocked",
    public_stop_reason: "local_project_root_scope_conflict",
    summary: "The current project root did not match the exact physical root admitted before the run claim.",
    checks: [
      {
        check_id: "project_root_scope_verified",
        required: true,
        status: "blocked",
        summary: "The exact admitted project-root identity could not be revalidated.",
      },
    ],
    observed_actions: ["project_root_inspection_started"],
    artifacts: [],
    gaps: ["No root manifest was produced because the exact root binding failed."],
    root_identity_verified: false,
    manifest_completed: false,
  });
}

function passedRootCheckV01(): NativeHostResultV01["checks"][number] {
  return {
    check_id: "project_root_scope_verified",
    required: true,
    status: "passed",
    summary: "The current physical root exactly matched the admitted project-root identity.",
  };
}

function terminalResultV01(
  request: NativeHostRequestV01,
  startedAt: string,
  finishedAt: string,
  input: Pick<
    NativeHostResultV01,
    "outcome" | "public_stop_reason" | "summary" | "checks" | "artifacts" | "gaps"
  > & {
    observed_actions: string[];
    root_identity_verified: boolean;
    manifest_completed: boolean;
  },
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
    observed_actions: input.observed_actions,
    commands: [],
    checks: input.checks,
    skipped_checks: request.packet.constraints.required_checks
      .filter((checkId) => !observedCheckIds.has(checkId))
      .map((checkId) => ({
        check_id: checkId,
        required: true,
        reason:
          input.outcome === "cancelled"
            ? "The bounded verification was cancelled before this check completed."
            : input.outcome === "blocked"
              ? "The bounded verification was blocked before this check completed."
              : "The bounded verification failed before this check completed.",
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
        capability: "project_root_identity_verification",
        coverage: input.root_identity_verified ? "enforced" : "observed",
        source_ref: input.root_identity_verified ? hostRef : null,
        notes: [
          input.root_identity_verified
            ? "The execution-time physical root matched the exact admitted identity."
            : "The execution-time physical root could not be proven equal to the admitted identity.",
        ],
      },
      {
        capability: "project_root_manifest_verification",
        coverage: input.manifest_completed ? "enforced" : "observed",
        source_ref: input.manifest_completed ? hostRef : null,
        notes: [
          input.manifest_completed
            ? "The bounded canonical top-level manifest was fingerprinted."
            : "No completed manifest fingerprint was admitted.",
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
      {
        capability: "project_file_mutation",
        coverage: "enforced",
        source_ref: hostRef,
        notes: ["The adapter exposes no command or file-mutation operation."],
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

function normalizeProjectRootManifestEntryV01(
  entry: ProjectRootManifestEntryV01 | BoundedProjectRootDirectoryEntryV01,
): ProjectRootManifestEntryV01 {
  const name = entry.name;
  if (
    typeof name !== "string" ||
    name.length === 0 ||
    name === "." ||
    name === ".." ||
    name.includes("\0") ||
    name.includes("/") ||
    name.includes("\\") ||
    Buffer.byteLength(name, "utf8") > MAX_ROOT_ENTRY_NAME_BYTES_V01
  ) {
    throw new Error("local_project_root_manifest_entry_name_invalid");
  }
  const kind = "kind" in entry
    ? entry.kind
    : entry.isDirectory()
      ? "directory"
      : entry.isFile()
        ? "file"
        : entry.isSymbolicLink()
          ? "symbolic_link"
          : "other";
  if (!["directory", "file", "symbolic_link", "other"].includes(kind)) {
    throw new Error("local_project_root_manifest_entry_kind_invalid");
  }
  return { name, kind };
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
