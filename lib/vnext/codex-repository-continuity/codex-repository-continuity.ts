import Database from "better-sqlite3";
import { existsSync, statSync } from "node:fs";
import path from "node:path";

import { getDatabasePath } from "@/lib/db";
import {
  CODEX_CURRENT_CONTINUITY_AUTHORITY_V01,
  readCodexProjectContinuityV01,
  type CodexCurrentContinuityDependenciesV01,
} from "@/lib/vnext/codex-current-continuity/codex-current-continuity";
import { inspectNativeHostPhysicalRootIdentityV01 } from "@/lib/vnext/native-host/project-root-identity";
import {
  listCanonicalProjectsWithRootsV01,
  normalizeLocalProjectRootRefV01,
  readDefaultWorkspaceIdentityV01,
  type CanonicalProjectRegistrationV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import {
  canonicalizeProtocolValueV01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import type { NativeHostPhysicalRootIdentityV01 } from "@/types/vnext/native-host-adapter";
import {
  CODEX_REPOSITORY_CONTINUITY_VERSION_V01,
  type CodexRepositoryContinuityV01,
  type CodexRepositoryResolutionStatusV01,
} from "@/types/vnext/codex-repository-continuity";

export interface CodexRepositoryProjectResolutionV01 {
  status: Exclude<CodexRepositoryResolutionStatusV01, "companion_unavailable">;
  workspace_id: string | null;
  project_id: string | null;
  registration: CanonicalProjectRegistrationV01 | null;
}

export interface CodexRepositoryResolutionDependenciesV01 {
  inspect_physical_root: (root: string) => Promise<NativeHostPhysicalRootIdentityV01>;
}

export interface CodexRepositoryContinuityDependenciesV01
  extends Partial<Omit<CodexCurrentContinuityDependenciesV01, "open_database">>,
    Partial<CodexRepositoryResolutionDependenciesV01> {}

export async function resolveCodexRepositoryProjectV01(
  db: Database.Database,
  input: { repository_root: string },
  dependencies: Partial<CodexRepositoryResolutionDependenciesV01> = {},
): Promise<CodexRepositoryProjectResolutionV01> {
  if (
    typeof input.repository_root !== "string" ||
    !path.isAbsolute(input.repository_root) ||
    input.repository_root.includes("\0")
  ) {
    return unresolvedV01("repository_input_invalid");
  }
  const normalizedRoot = normalizeLocalProjectRootRefV01(input.repository_root, {
    base_path: path.parse(input.repository_root).root,
  }).normalized_path;
  const inspect = dependencies.inspect_physical_root ?? inspectNativeHostPhysicalRootIdentityV01;
  let suppliedIdentity: NativeHostPhysicalRootIdentityV01;
  try {
    suppliedIdentity = await inspect(normalizedRoot);
  } catch {
    return unresolvedV01("root_unavailable");
  }

  const workspace = readDefaultWorkspaceIdentityV01(db);
  if (!workspace) return unresolvedV01("project_not_registered");
  const registrations = listCanonicalProjectsWithRootsV01(db, {
    workspace_id: workspace.workspace_id,
  });
  const physicalMatches: CanonicalProjectRegistrationV01[] = [];
  for (const registration of registrations) {
    const registeredRoot = registration.root_binding.local_root.normalized_path;
    try {
      const identity = await inspect(registeredRoot);
      if (samePhysicalIdentityV01(suppliedIdentity, identity)) physicalMatches.push(registration);
    } catch {
      if (registeredRoot === normalizedRoot) return unresolvedV01("root_unavailable");
      // An unavailable registered root cannot establish an alias match.
    }
  }
  if (physicalMatches.length === 1) {
    return resolvedV01(workspace.workspace_id, physicalMatches[0]!);
  }
  if (physicalMatches.length > 1) return unresolvedV01("project_ambiguous");
  return unresolvedV01("project_not_registered");
}

export async function readCodexRepositoryContinuityV01(
  db: Database.Database,
  input: {
    repository_root: string;
    generated_at?: string;
    browser_base_url?: string;
  },
  dependencies: CodexRepositoryContinuityDependenciesV01 = {},
): Promise<CodexRepositoryContinuityV01> {
  const generatedAt = input.generated_at ??
    (dependencies.now ?? (() => new Date().toISOString()))();
  if (parseStrictIsoTimestampV01(generatedAt) === null) {
    throw new Error("codex_repository_continuity_generated_at_invalid");
  }
  const resolution = await resolveCodexRepositoryProjectV01(db, input, {
    inspect_physical_root: dependencies.inspect_physical_root,
  });
  if (resolution.status !== "resolved_exact") {
    return unavailableProjectionV01(generatedAt, resolution.status);
  }
  if (!resolution.project_id) throw new Error("codex_repository_resolution_corrupt");
  const continuity = await readCodexProjectContinuityV01(db, {
    project_id: resolution.project_id,
    generated_at: generatedAt,
  }, dependencies);
  return {
    projection_version: CODEX_REPOSITORY_CONTINUITY_VERSION_V01,
    generated_at: generatedAt,
    repository_resolution: {
      status: "resolved_exact",
      project_key: continuity.project.project_key,
      display_name: continuity.project.display_name,
      message: "The supplied physical repository root resolved to one existing canonical Augnes project.",
    },
    continuity,
    current_situation: currentSituationV01(continuity),
    next_meaningful_action: {
      label: continuity.next_action.label,
      reason: continuity.next_action.reason,
      executes: false,
    },
    browser_deep_link: browserDeepLinkV01(input.browser_base_url, resolution.project_id),
    authority: CODEX_CURRENT_CONTINUITY_AUTHORITY_V01,
  };
}

export async function loadCodexRepositoryContinuityV01(
  input: Parameters<typeof readCodexRepositoryContinuityV01>[1],
  dependencies: CodexRepositoryContinuityDependenciesV01 = {},
): Promise<CodexRepositoryContinuityV01> {
  const databasePath = getDatabasePath();
  if (!existsSync(databasePath) || !statSync(databasePath).isFile()) {
    throw new Error("codex_repository_continuity_database_unavailable");
  }
  const db = new Database(databasePath, { readonly: true, fileMustExist: true });
  db.pragma("query_only = ON");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  try {
    return await readCodexRepositoryContinuityV01(db, input, dependencies);
  } finally {
    db.close();
  }
}

function resolvedV01(
  workspaceId: string,
  registration: CanonicalProjectRegistrationV01,
): CodexRepositoryProjectResolutionV01 {
  return {
    status: "resolved_exact",
    workspace_id: workspaceId,
    project_id: registration.project.project_id,
    registration,
  };
}

function unresolvedV01(
  status: Exclude<CodexRepositoryResolutionStatusV01, "resolved_exact" | "companion_unavailable">,
): CodexRepositoryProjectResolutionV01 {
  return { status, workspace_id: null, project_id: null, registration: null };
}

function samePhysicalIdentityV01(
  left: NativeHostPhysicalRootIdentityV01,
  right: NativeHostPhysicalRootIdentityV01,
): boolean {
  return canonicalizeProtocolValueV01(left) === canonicalizeProtocolValueV01(right);
}

function unavailableProjectionV01(
  generatedAt: string,
  status: Exclude<CodexRepositoryResolutionStatusV01, "resolved_exact">,
): CodexRepositoryContinuityV01 {
  const messages: Record<typeof status, string> = {
    project_not_registered: "This physical repository is not registered as an Augnes project.",
    project_ambiguous: "More than one registered Augnes project maps to this physical repository.",
    root_unavailable: "The supplied repository root is unavailable or is not a directory.",
    repository_input_invalid: "A valid absolute local repository root is required.",
    companion_unavailable: "The live Augnes Companion is unavailable.",
  };
  return {
    projection_version: CODEX_REPOSITORY_CONTINUITY_VERSION_V01,
    generated_at: generatedAt,
    repository_resolution: {
      status,
      project_key: null,
      display_name: null,
      message: messages[status],
    },
    continuity: null,
    current_situation: messages[status],
    next_meaningful_action: {
      label: status === "project_not_registered"
        ? "Open this repository in Augnes first"
        : "Restore exact local Companion continuity",
      reason: messages[status],
      executes: false,
    },
    browser_deep_link: null,
    authority: CODEX_CURRENT_CONTINUITY_AUTHORITY_V01,
  };
}

function currentSituationV01(
  continuity: NonNullable<CodexRepositoryContinuityV01["continuity"]>,
): string {
  const project = continuity.project.display_name ?? "this Augnes project";
  if (continuity.current_work.goal) return `${project}: ${continuity.current_work.goal}`;
  if (continuity.current_work.status === "no_current_work") {
    return `${project} is registered, but no current work is defined.`;
  }
  return `${project} continuity is ${continuity.source_status}.`;
}

function browserDeepLinkV01(baseUrl: string | undefined, projectId: string): string | null {
  if (!baseUrl) return null;
  try {
    const url = new URL(baseUrl);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) return null;
    url.pathname = `/projects/${encodeURIComponent(projectId)}`;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}
