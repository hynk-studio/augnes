import { inspectNativeHostPhysicalRootIdentitySynchronouslyV01 } from "../native-host/project-root-identity";
import type Database from "better-sqlite3";
import { readCanonicalProjectWithRootV01 } from "../persistence/project-identity-registry";
import { effectiveDirection } from "../persistence/project-direction-store";
import { canonicalizeProtocolValueV01, createProtocolSha256V01 } from "../protocol-primitives";

/** Compare material owned by the target project. Display selection never grants
 * authority. Authentication, exact work/source comparisons and admission remain
 * the writer's responsibility. No additional durable authority state is stored. */
export function readProjectWorkBindingV01(db: Database.Database, scope: { workspace_id: string; project_id: string }): string | null {
  const registration = readCanonicalProjectWithRootV01(db, scope);
  if (!registration) return null;
  let physicalRoot;
  try { physicalRoot = inspectNativeHostPhysicalRootIdentitySynchronouslyV01(registration.root_binding.local_root.normalized_path); }
  catch { return null; }
  return createProtocolSha256V01(canonicalizeProtocolValueV01({
    contract: "augnes.project-work-binding.v0.1", workspace_id: scope.workspace_id, project_id: scope.project_id,
    root_binding: registration.root_binding,
    physical_root: physicalRoot,
    direction_ref: effectiveDirection(db, scope, new Date().toISOString())?.ref ?? null,
  }));
}

/** Historical selection remains readable, but bound requests compare only the
 * target project's material. Useful for transport seals and exact retries. */
export function projectBoundRequestIdentityV01<T extends { expected_project_work_binding?: string; expected_active_selection_revision: unknown }>(request: T) {
  if (!request.expected_project_work_binding) return request;
  const { expected_active_selection_revision: _displaySelection, ...bound } = request;
  return bound;
}
