import Database from "better-sqlite3";
import type { TaskContextPacketSelectedEntryV01 } from "@/types/vnext/task-context-packet";
import { getDatabasePath } from "@/lib/db";
import { isPublicSafeSourceLocatorV01 } from "@/lib/research-source/sanitize-source-ref";
import { isSafeSourceProjectionMetadataV01 } from "@/lib/research-source/projection-metadata";
import { selectedWorkSourceInput } from "@/lib/intake/selected-work-source-comparison";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import { INITIAL_PROJECT_WORK_LIMITS_V01, type ProjectWorkDefinitionV01 } from "@/types/vnext/project-work-initialization";
import {
  CODEX_CURRENT_CONTINUITY_AUTHORITY_V01,
  readCodexCurrentContinuitySnapshotV01,
} from "@/lib/vnext/codex-current-continuity/codex-current-continuity";
import {
  resolveCodexRepositoryProjectV01,
  type CodexRepositoryContinuityDependenciesV01,
} from "./codex-repository-continuity";
import {
  CODEX_REPOSITORY_WORK_SOURCES_VERSION_V01,
  CODEX_REPOSITORY_WORK_DEFINITION_SOURCES_VERSION_V01,
  type CodexRepositoryWorkSourcesV01,
  type CodexRepositoryWorkSourcesReadV01,
} from "@/types/vnext/codex-repository-work-sources";

export interface CodexRepositoryWorkSourcesInputV01 {
  repository_root: string;
  expected_snapshot_binding: string;
  include_work_definition?: true;
}

/**
 * Repository resolution, the Resume snapshot and the UI's selected-source
 * reader share one database read snapshot. No fallback to history or WorkBrief.
 * The loader owns a dedicated query-only connection; never borrow a writer's
 * transaction across the asynchronous physical-root inspection.
 */
export async function readCodexRepositoryWorkSourcesV01(
  db: Database.Database,
  input: CodexRepositoryWorkSourcesInputV01,
  dependencies: CodexRepositoryContinuityDependenciesV01 = {},
): Promise<CodexRepositoryWorkSourcesReadV01> {
  if (!/^sha256:[a-f0-9]{64}$/u.test(input.expected_snapshot_binding)) {
    throw new Error("expected_snapshot_binding_invalid");
  }
  if (db.inTransaction) throw new Error("work_sources_dedicated_read_required");
  const project = (value: CodexRepositoryWorkSourcesV01, definition: ProjectWorkDefinitionV01 | null = null): CodexRepositoryWorkSourcesReadV01 =>
    input.include_work_definition === true
      ? { ...value, projection_version: CODEX_REPOSITORY_WORK_DEFINITION_SOURCES_VERSION_V01, work_definition: definition }
      : value;
  db.exec("BEGIN");
  try {
    const resolution = await resolveCodexRepositoryProjectV01(db, input, dependencies);
    const result: CodexRepositoryWorkSourcesV01 = {
      projection_version: CODEX_REPOSITORY_WORK_SOURCES_VERSION_V01,
      status: "unavailable",
      reason: "repository_unresolved",
      repository_resolution: resolution.status,
      snapshot_binding: null,
      packet_fingerprint: null,
      sources: [],
      source_material_authority: "untrusted_selected_context",
      authority: CODEX_CURRENT_CONTINUITY_AUTHORITY_V01,
    };
    if (resolution.status !== "resolved_exact") return project(result);
    const { projection: continuity, work_initialization: work } = await readCodexCurrentContinuitySnapshotV01(db, {
      viewed_project_id: resolution.project_id!,
    }, dependencies);
    result.reason = "current_work_unavailable";
    if (continuity.snapshot.status !== "exact") return project(result);
    // A changed selection, work packet or other Resume-bound state is not
    // permission to deliver replacement work that the caller has not seen.
    if (continuity.snapshot.binding !== input.expected_snapshot_binding) {
      return project({ ...result, status: "refresh_required", reason: "snapshot_changed" });
    }
    if (
      continuity.current_work.status !== "current_work" ||
      continuity.current_work.currentness !== "fresh" ||
      continuity.project.root_availability !== "available"
    ) return project(result);
    if (!work?.current_packet || !work.current_work) return project(result);
    // Use the validated persisted task from this same read transaction. Resume
    // text is a display summary: never use it as the complete definition.
    const definition = input.include_work_definition === true ? boundedWorkDefinitionV01(work.current_work) : null;
    if (input.include_work_definition === true && !definition) {
      return { ...result, projection_version: CODEX_REPOSITORY_WORK_DEFINITION_SOURCES_VERSION_V01,
        reason: "work_definition_out_of_bounds", work_definition: null };
    }
    // The snapshot owner already reconstructed and validated this exact work,
    // including source scope, lineage, bindings and whole-note limits. Repeating
    // that initialization scans every packet's lineage again and can exhaust
    // the client deadline on an otherwise valid retained revision chain.
    const sources = projectSelectedWorkSourcesV01(work.selected_source_context ?? []);
    return project({
      ...result,
      status: "available",
      reason: "current_selected_sources",
      snapshot_binding: continuity.snapshot.binding,
      packet_fingerprint: work.current_packet.packet_fingerprint,
      sources,
    }, definition);
  } finally {
    db.exec("ROLLBACK");
  }
}

export async function loadCodexRepositoryWorkSourcesV01(
  input: CodexRepositoryWorkSourcesInputV01,
): Promise<CodexRepositoryWorkSourcesReadV01> {
  const db = new Database(getDatabasePath(), { readonly: true, fileMustExist: true });
  try {
    db.pragma("query_only = ON");
    db.pragma("foreign_keys = ON");
    db.pragma("busy_timeout = 5000");
    return await readCodexRepositoryWorkSourcesV01(db, input);
  } finally {
    db.close();
  }
}

function boundedWorkDefinitionV01(work: ProjectWorkDefinitionV01): ProjectWorkDefinitionV01 | null {
  const limits = INITIAL_PROJECT_WORK_LIMITS_V01;
  const definition = { goal: work.goal, success_criteria: [...work.success_criteria], non_goals: [...work.non_goals] };
  // Check the existing complete-definition budget without normalizing, sorting,
  // deduplicating or truncating validated stored text. Other packet producers
  // may exceed this supported delivery domain; refuse the entire read then.
  if ([...definition.goal].length > limits.goal_characters ||
      definition.success_criteria.length > limits.success_criteria ||
      definition.success_criteria.some(value => [...value].length > limits.success_criterion_characters) ||
      definition.non_goals.length > limits.non_goals ||
      definition.non_goals.some(value => [...value].length > limits.non_goal_characters) ||
      Buffer.byteLength(canonicalizeProtocolValueV01(definition), "utf8") > limits.definition_bytes) return null;
  return definition;
}

/** Shared disclosure projection for read and revision preview. Canonical
 * retained entries, including withheld fields, never round-trip through it. */
export function projectSelectedWorkSourcesV01(entries: TaskContextPacketSelectedEntryV01[]): CodexRepositoryWorkSourcesV01["sources"] {
  return entries.map((entry) => {
      const source = selectedWorkSourceInput(entry).source;
      const permitted = isDisclosedWorkSourceLocatorV01(source);
      return {
        source_binding: entry.source_ref!,
        excerpt_text: entry.bounded_summary!,
        source_locator: permitted ? source : null,
        source_locator_status: permitted ? "included_export_safe" as const : "omitted_not_export_safe" as const,
        trust_class: entry.trust_class,
        review_label: entry.why_included,
        observed_at: entry.external_ref?.observed_at ?? null,
        currentness: {
          status: entry.currentness.status,
          as_of: entry.currentness.as_of,
          basis: entry.currentness.basis,
        },
      };
    });
}

/** The same disclosure boundary applies to matching and presentation. */
export function isDisclosedWorkSourceLocatorV01(source: string): boolean {
  return isSafeSourceProjectionMetadataV01(source) && (["url", "doi", "file_ref", "note_ref", "manual_text_summary"] as const)
    .some((input_kind) => isPublicSafeSourceLocatorV01({ input_kind, source_locator: source }));
}
