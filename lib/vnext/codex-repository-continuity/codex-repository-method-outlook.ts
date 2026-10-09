import Database from "better-sqlite3";
import { getDatabasePath } from "@/lib/db";
import { CODEX_CURRENT_CONTINUITY_AUTHORITY_V01, readCodexCurrentContinuitySnapshotV01 } from "@/lib/vnext/codex-current-continuity/codex-current-continuity";
import { readRetryInspectionOutlookV01, retryInspectionReadHorizonV01 } from "@/lib/vnext/retry-inspection-outlook";
import { readPacketDirectionInterpretation } from "@/lib/vnext/persistence/project-direction-store";
import { CODEX_REPOSITORY_METHOD_OUTLOOK_VERSION, type CodexRepositoryMethodOutlookV01 } from "@/types/vnext/codex-repository-method-outlook";
import { resolveCodexRepositoryProjectV01, type CodexRepositoryContinuityDependenciesV01 } from "./codex-repository-continuity";
import { projectSelectedWorkSourcesV01 } from "./codex-repository-work-sources";

export interface CodexRepositoryMethodOutlookInputV01 { repository_root: string; expected_snapshot_binding: string }

/** One dedicated query-only snapshot. The validated packet never crosses the channel. */
export async function readCodexRepositoryMethodOutlookV01(
  db: Database.Database, input: CodexRepositoryMethodOutlookInputV01,
  dependencies: CodexRepositoryContinuityDependenciesV01 = {},
): Promise<CodexRepositoryMethodOutlookV01> {
  if (!/^sha256:[a-f0-9]{64}$/u.test(input.expected_snapshot_binding)) throw new Error("expected_snapshot_binding_invalid");
  if (db.inTransaction) throw new Error("method_outlook_dedicated_read_required");
  db.exec("BEGIN");
  try {
    const resolution = await resolveCodexRepositoryProjectV01(db, input, dependencies);
    const result: CodexRepositoryMethodOutlookV01 = {
      projection_version: CODEX_REPOSITORY_METHOD_OUTLOOK_VERSION, status: "unavailable", reason: "repository_unresolved",
      repository_resolution: resolution.status, snapshot_binding: null, packet: null, outlook: null, applicability: null, sources: [],
      source_material_authority: "untrusted_selected_context", authority: CODEX_CURRENT_CONTINUITY_AUTHORITY_V01,
    };
    if (resolution.status !== "resolved_exact") return result;
    const { projection: continuity, work_initialization: work, validated_packet: packet } =
      await readCodexCurrentContinuitySnapshotV01(db, { viewed_project_id: resolution.project_id! }, dependencies);
    result.reason = "current_work_unavailable";
    if (continuity.snapshot.status !== "exact") return result;
    if (continuity.snapshot.binding !== input.expected_snapshot_binding) return { ...result, status: "refresh_required", reason: "snapshot_changed" };
    if (!packet || !work?.current_packet || !["current_work", "stale_current_work"].includes(continuity.current_work.status) ||
      !["fresh", "stale"].includes(continuity.current_work.currentness) || continuity.project.root_availability !== "available") return result;
    try {
      // Reuse the frozen-version reconstruction owner, not another calculator or
      // history scan. Absence is meaningful only after exact current-work validation.
      const outlook = readRetryInspectionOutlookV01(packet);
      const identity = { packet_id: packet.packet_id, packet_fingerprint: packet.integrity.fingerprint, packet_version: packet.packet_version };
      if (!outlook) return { ...result, status: "absent", reason: "no_optional_outlook", snapshot_binding: continuity.snapshot.binding, packet: identity };
      const evaluatedAt = continuity.generated_at;
      const horizon = retryInspectionReadHorizonV01(outlook, evaluatedAt);
      const reasons: NonNullable<CodexRepositoryMethodOutlookV01["applicability"]>["reasons"] = [];
      // The horizon test follows the same owner as native task-start guidance.
      if (horizon.expired) reasons.push("horizon_expired_or_missing");
      if (readPacketDirectionInterpretation(db, packet, evaluatedAt).status === "historical") reasons.push("project_direction_changed");
      if (continuity.current_work.currentness !== "fresh") reasons.push("packet_not_fresh");
      const refs = new Set(outlook.sources.map(source => source.source_ref));
      const sources = projectSelectedWorkSourcesV01(work.selected_source_context ?? []).filter(source => refs.has(source.source_binding));
      if (sources.length !== refs.size || Buffer.byteLength(JSON.stringify({ outlook, sources }), "utf8") > 128 * 1024) throw new Error("outlook_disclosure_invalid");
      return { ...result, status: "available", reason: "frozen_method_outlook", snapshot_binding: continuity.snapshot.binding,
        packet: identity, outlook, sources, applicability: { status: reasons.length ? "reconsideration_required" : "conditional",
          evaluated_at: evaluatedAt, reasons, guidance: reasons.length
            ? "Reconsider the recorded applicability reasons before using this historical recommendation. Required task checks still apply."
            : horizon.guidance } };
    } catch { return { ...result, reason: "outlook_unavailable" }; }
  } finally { db.exec("ROLLBACK"); }
}

export async function loadCodexRepositoryMethodOutlookV01(input: CodexRepositoryMethodOutlookInputV01): Promise<CodexRepositoryMethodOutlookV01> {
  const db = new Database(getDatabasePath(), { readonly: true, fileMustExist: true });
  try {
    db.pragma("query_only = ON"); db.pragma("foreign_keys = ON"); db.pragma("busy_timeout = 5000");
    return await readCodexRepositoryMethodOutlookV01(db, input);
  } finally { db.close(); }
}
