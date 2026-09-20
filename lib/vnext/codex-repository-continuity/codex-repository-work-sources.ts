import Database from "better-sqlite3";
import { getDatabasePath } from "@/lib/db";
import { isPublicSafeSourceLocatorV01 } from "@/lib/research-source/sanitize-source-ref";
import { isSafeSourceProjectionMetadataV01 } from "@/lib/research-source/projection-metadata";
import { selectedWorkSourceInput } from "@/lib/intake/selected-work-source-comparison";
import {
  CODEX_CURRENT_CONTINUITY_AUTHORITY_V01,
  readCodexProjectContinuityV01,
} from "@/lib/vnext/codex-current-continuity/codex-current-continuity";
import { readProjectWorkInitializationV01 } from "@/lib/vnext/runtime/project-work-initialization";
import {
  resolveCodexRepositoryProjectV01,
  type CodexRepositoryContinuityDependenciesV01,
} from "./codex-repository-continuity";
import {
  CODEX_REPOSITORY_WORK_SOURCES_VERSION_V01,
  type CodexRepositoryWorkSourcesV01,
} from "@/types/vnext/codex-repository-work-sources";

export interface CodexRepositoryWorkSourcesInputV01 {
  repository_root: string;
  expected_snapshot_binding: string;
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
): Promise<CodexRepositoryWorkSourcesV01> {
  if (!/^sha256:[a-f0-9]{64}$/u.test(input.expected_snapshot_binding)) {
    throw new Error("expected_snapshot_binding_invalid");
  }
  if (db.inTransaction) throw new Error("work_sources_dedicated_read_required");
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
    if (resolution.status !== "resolved_exact") return result;
    const continuity = await readCodexProjectContinuityV01(db, {
      project_id: resolution.project_id!,
    }, dependencies);
    result.reason = "current_work_unavailable";
    if (continuity.snapshot.status !== "exact") return result;
    // A changed selection, work packet or other Resume-bound state is not
    // permission to deliver replacement work that the caller has not seen.
    if (continuity.snapshot.binding !== input.expected_snapshot_binding) {
      return { ...result, status: "refresh_required", reason: "snapshot_changed" };
    }
    if (
      continuity.current_work.status !== "current_work" ||
      continuity.current_work.currentness !== "fresh" ||
      continuity.project.root_availability !== "available"
    ) return result;
    const work = readProjectWorkInitializationV01(db, {
      workspace_id: resolution.workspace_id!,
      project_id: resolution.project_id!,
    }, { root_available: () => true });
    if (!work.current_packet || !work.current_work) return result;
    // This canonical reader has already reconstructed and validated each
    // selected entry, its source binding, scope, lineage and whole-note limits.
    const sources = (work.selected_source_context ?? []).map((entry) => {
      const source = selectedWorkSourceInput(entry).source;
      const permitted = isSafeSourceProjectionMetadataV01(source) && (["url", "doi", "file_ref", "note_ref", "manual_text_summary"] as const)
        .some((input_kind) => isPublicSafeSourceLocatorV01({ input_kind, source_locator: source }));
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
    return {
      ...result,
      status: "available",
      reason: "current_selected_sources",
      snapshot_binding: continuity.snapshot.binding,
      packet_fingerprint: work.current_packet.packet_fingerprint,
      sources,
    };
  } finally {
    db.exec("ROLLBACK");
  }
}

export async function loadCodexRepositoryWorkSourcesV01(
  input: CodexRepositoryWorkSourcesInputV01,
): Promise<CodexRepositoryWorkSourcesV01> {
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
