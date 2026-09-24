import type Database from "better-sqlite3";
import { compareSelectedWorkSources, readSelectedWorkSources } from "@/lib/intake/selected-work-source-comparison";
import { readCanonicalProjectWithRootV01 } from "@/lib/vnext/persistence/project-identity-registry";
import { canonicalizeProtocolValueV01, createProtocolSha256V01 } from "@/lib/vnext/protocol-primitives";
import { normalizeInitialProjectWorkDefinitionV01 } from "./initial-project-work-context";
import type { RevisePreExecutionProjectWorkRequestV01, NewWorkPreparationBindingV01 } from "@/types/vnext/project-work-revision";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export class NewProjectWorkPreparationErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 409) { super(code); }
}

/** The registry remains the root owner. This is a compare binding, not a store. */
export function currentPreparationRootBindingV01(db: Database.Database, scope: { workspace_id: string; project_id: string }) {
  const registration = readCanonicalProjectWithRootV01(db, scope);
  if (!registration) throw new NewProjectWorkPreparationErrorV01("new_work_root_unavailable");
  return createProtocolSha256V01(canonicalizeProtocolValueV01(registration.root_binding));
}

/** Shared, pure review material. A digest is not authentication or user consent.
 * Saving still requires the authenticated writer and an exact current packet. */
export function compareNewProjectWorkV01(prior: TaskContextPacketV01, request: RevisePreExecutionProjectWorkRequestV01,
  rootBinding: string, omissions: unknown) {
  if (request.action !== "prepare_new_project_work" || request.selected_source_context === undefined ||
    request.retained_source_refs !== undefined || !/^sha256:[a-f0-9]{64}$/u.test(rootBinding)) fail();
  const definition = normalizeInitialProjectWorkDefinitionV01(request);
  const comparison = compareSelectedWorkSources(prior, request.selected_source_context);
  if (comparison.fingerprint !== request.expected_source_comparison) fail();
  if (!Array.isArray(omissions) || omissions.length > 8) fail();
  const omitted = omissions.map(value => {
    if (!value || typeof value !== "object" || Array.isArray(value) ||
      Object.keys(value).sort().join(",") !== "reason,source_binding" ||
      typeof value.source_binding !== "string" || typeof value.reason !== "string" ||
      !value.reason.trim() || [...value.reason].length > 500 || /[\u0000-\u001f\u007f]/u.test(value.reason)) fail();
    return { source_binding: value.source_binding as string, reason: value.reason.trim() as string };
  }).sort((a, b) => a.source_binding.localeCompare(b.source_binding));
  const missing = comparison.unselected_previous.map(entry => entry.source_ref!).sort();
  if (canonicalizeProtocolValueV01(omitted.map(row => row.source_binding).sort()) !== canonicalizeProtocolValueV01(missing)) fail();
  const material = {
    declaration: "different_task" as const,
    workspace_id: request.workspace_id, project_id: request.project_id,
    expected_active_selection_revision: request.expected_active_selection_revision,
    prior_packet_id: prior.packet_id, prior_packet_fingerprint: prior.integrity.fingerprint,
    root_binding: rootBinding, before: normalizeInitialProjectWorkDefinitionV01(prior.task), after: definition,
    sources_before: readSelectedWorkSources(prior), sources_after: comparison.entries,
    omitted_sources: omitted,
    prior_work_marked_complete: false as const, prior_unresolved_matters_discharged: false as const,
    execution_started: false as const, execution_authority_granted: false as const,
  };
  const preparation: NewWorkPreparationBindingV01 = {
    expected_root_binding: rootBinding, omitted_sources: omitted,
    preview_binding: createProtocolSha256V01(canonicalizeProtocolValueV01(material)),
  };
  return { ...material, preparation };
}

function fail(): never { throw new NewProjectWorkPreparationErrorV01("new_work_selection_or_preview_invalid", 422); }
