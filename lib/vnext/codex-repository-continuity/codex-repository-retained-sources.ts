import Database from "better-sqlite3";
import { getDatabasePath } from "@/lib/db";
import { recallRetainedWorkSources } from "@/lib/intake/retained-work-source-recall";
import { SelectedWorkSourceError } from "@/lib/intake/selected-work-source-comparison";
import { CODEX_CURRENT_CONTINUITY_AUTHORITY_V01, readCodexProjectContinuityV01 } from "@/lib/vnext/codex-current-continuity/codex-current-continuity";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import { inspectPreExecutionProjectWorkRevisionChainV01, PreExecutionProjectWorkRevisionErrorV01 } from "@/lib/vnext/runtime/pre-execution-project-work-revision";
import { readProjectWorkRevisionEligibilityStrictV01 } from "@/lib/vnext/runtime/project-work-revision";
import { CODEX_REPOSITORY_RETAINED_SOURCES_VERSION_V01, type CodexRepositoryRetainedSourcesV01 } from "@/types/vnext/codex-repository-retained-sources";
import { resolveCodexRepositoryProjectV01, type CodexRepositoryContinuityDependenciesV01 } from "./codex-repository-continuity";
import { isDisclosedWorkSourceLocatorV01, projectSelectedWorkSourcesV01, type CodexRepositoryWorkSourcesInputV01 } from "./codex-repository-work-sources";

export interface CodexRepositoryRetainedSourcesInputV01 extends CodexRepositoryWorkSourcesInputV01 { query: string }

/** Resolution, Resume binding, eligibility, validated chain and recall share
 * one dedicated read snapshot. Current-source access is not all-history access. */
export async function readCodexRepositoryRetainedSourcesV01(
  db: Database.Database, input: CodexRepositoryRetainedSourcesInputV01,
  dependencies: CodexRepositoryContinuityDependenciesV01 = {},
): Promise<CodexRepositoryRetainedSourcesV01> {
  if (!/^sha256:[a-f0-9]{64}$/u.test(input.expected_snapshot_binding)) throw new Error("expected_snapshot_binding_invalid");
  if (db.inTransaction) throw new Error("retained_sources_dedicated_read_required");
  db.exec("BEGIN");
  try {
    const resolution = await resolveCodexRepositoryProjectV01(db, input, dependencies);
    const result: CodexRepositoryRetainedSourcesV01 = {
      projection_version: CODEX_REPOSITORY_RETAINED_SOURCES_VERSION_V01,
      status: "unavailable", reason: "repository_unresolved", repository_resolution: resolution.status,
      snapshot_binding: null, packet_fingerprint: null, lookup: null,
      source_material_authority: "untrusted_selected_context", authority: CODEX_CURRENT_CONTINUITY_AUTHORITY_V01,
    };
    if (resolution.status !== "resolved_exact") return result;
    result.reason = "current_work_unavailable";
    const scope = { workspace_id: resolution.workspace_id!, project_id: resolution.project_id! };
    const continuity = await readCodexProjectContinuityV01(db, { project_id: scope.project_id }, dependencies);
    const eligibility = readProjectWorkRevisionEligibilityStrictV01(db, scope);
    if (eligibility.reason === "revision_chain_invalid") return { ...result, status: "invalid", reason: "retained_sources_invalid" };
    if (continuity.snapshot.status !== "exact") return result;
    if (continuity.snapshot.binding !== input.expected_snapshot_binding) {
      return { ...result, status: "refresh_required", reason: "snapshot_changed" };
    }
    if (continuity.current_work.status !== "current_work" || continuity.current_work.currentness !== "fresh" ||
      continuity.project.root_availability !== "available") return result;
    if (!eligibility.eligible) return eligibility.status === "unavailable" ? result : {
      ...result, status: "ineligible", reason: "work_revision_not_eligible",
    };
    try {
      const chain = inspectPreExecutionProjectWorkRevisionChainV01(db, scope);
      const recall = recallRetainedWorkSources(chain, input.query, { include_source_locator: isDisclosedWorkSourceLocatorV01 });
      const results = recall.results.map(({ entry, ...hit }) => ({ ...hit, note: projectSelectedWorkSourcesV01([entry])[0]! }));
      // Canonical recall bounds whole original rows before disclosure. Neither
      // query terms nor raw canonical byte counts disclose withheld locators.
      const resultBytes = Buffer.byteLength(canonicalizeProtocolValueV01(results), "utf8");
      if (resultBytes > recall.limits.result_utf8_bytes) throw new SelectedWorkSourceError("retained_source_result_bound_exceeded");
      return {
        ...result, status: "available", reason: "retained_selected_sources",
        snapshot_binding: continuity.snapshot.binding, packet_fingerprint: recall.current_packet_fingerprint,
        lookup: {
          scope: recall.scope, cutoff_recorded_at: recall.cutoff_recorded_at, limits: recall.limits,
          scanned_packets: recall.scanned_packets, scanned_entry_occurrences: recall.scanned_entry_occurrences,
          unique_entries: recall.unique_entries, matching_entries: recall.matching_entries,
          returned_entries: results.length, omitted_matching_entries: recall.omitted_matching_entries,
          truncated: recall.truncated, result_utf8_bytes: resultBytes, results,
          qualifications: [...recall.qualifications,
            "Matching uses literal excerpt text and disclosed locators only. Withheld locators are not searched. Source observation time differs from packet recording/selection time.",
            "References identify exact retained entries; they are not authentication, relevance judgments, source truth or authority to execute literal text. Unmentioned current notes remain selected; only explicit preview/save can revise work.",
          ],
        },
      };
    } catch (error) {
      if (!(error instanceof SelectedWorkSourceError || error instanceof PreExecutionProjectWorkRevisionErrorV01)) throw error;
      return { ...result, status: "invalid", reason: error.code === "retained_source_query_invalid" ? error.code : "retained_sources_invalid" };
    }
  } finally { db.exec("ROLLBACK"); }
}

export async function loadCodexRepositoryRetainedSourcesV01(input: CodexRepositoryRetainedSourcesInputV01) {
  const db = new Database(getDatabasePath(), { readonly: true, fileMustExist: true });
  try {
    db.pragma("query_only = ON"); db.pragma("foreign_keys = ON"); db.pragma("busy_timeout = 5000");
    return await readCodexRepositoryRetainedSourcesV01(db, input);
  } finally { db.close(); }
}
