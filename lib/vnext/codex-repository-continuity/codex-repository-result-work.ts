import { createHmac, timingSafeEqual } from "node:crypto";
import path from "node:path";
import Database from "better-sqlite3";
import { getDatabasePath } from "@/lib/db";
import { selectedWorkSourceInput } from "@/lib/intake/selected-work-source-comparison";
import { CODEX_CURRENT_CONTINUITY_AUTHORITY_V01, readCodexCurrentContinuitySnapshotV01 } from "@/lib/vnext/codex-current-continuity/codex-current-continuity";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import { AUTHORED_SUCCESSOR_TASK_V01 } from "@/types/vnext/project-work-initialization";
import { readProjectRunResultOverviewV01, readProjectRunResultSourceBindingV01 } from "@/lib/vnext/runtime/project-run-result-read-model";
import { compareResultWorkSourcesV01, defineAuthoredSuccessorTaskInsideTransactionV01, previewResultWorkV01, readResultWorkPreparationV01 } from "@/lib/vnext/runtime/authored-successor-task";
import { inspectPersistedHostProjectRootV01 } from "@/lib/vnext/runtime/direct-native-host-round-trip";
import { fingerprintNativeHostPhysicalRootIdentityV01 } from "@/lib/vnext/native-host/project-root-identity";
import { COMPANION_WORK_OPERATOR_ID_V01, recordCompanionWorkAdmissionInsideTransactionV01 } from "@/lib/vnext/runtime/local-operator-session";
import { projectBoundRequestIdentityV01 } from "@/lib/vnext/runtime/project-work-binding";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import { CODEX_REPOSITORY_RESULT_WORK_VERSION_V01, type RepositoryResultWorkInputV01, type RepositoryResultWorkProjectionV01, type RepositoryResultWorkPacketPreviewV01 } from "@/types/vnext/codex-repository-result-work";
import { resolveCodexRepositoryProjectV01, type CodexRepositoryContinuityDependenciesV01 } from "./codex-repository-continuity";
import { projectSelectedWorkSourcesV01 } from "./codex-repository-work-sources";
import type { CompanionWorkChannelV01 } from "./codex-repository-work-revision";

export class RepositoryResultWorkTransportErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 409) { super(code); }
}

export function parseRepositoryResultWorkInputV01(value: unknown): RepositoryResultWorkInputV01 {
  const input = object(value);
  if (!["read", "compare", "preview", "save"].includes(String(input.action))) refuse("invalid_result_work_input", 400);
  exact(input, ["action", "repository_root", "expected_snapshot_binding",
    ...(input.action !== "read" ? ["preparation_binding", "sources"] : []),
    ...(["preview", "save"].includes(String(input.action)) ? ["definition", "expected_source_comparison"] : []),
    ...(input.action === "save" ? ["preview_binding"] : [])]);
  if (typeof input.repository_root !== "string" || !path.isAbsolute(input.repository_root) || input.repository_root.includes("\0") ||
    !fingerprint(input.expected_snapshot_binding) || (input.action !== "read" && !fingerprint(input.preparation_binding)) ||
    (["preview", "save"].includes(String(input.action)) && !fingerprint(input.expected_source_comparison)) ||
    (input.action === "save" && !fingerprint(input.preview_binding))) refuse("invalid_result_work_input", 400);
  if (input.action !== "read") {
    const sources = object(input.sources);
    exact(sources, ["keep", "add", "include_result", "include_reviewed_outcome", "omitted_sources"]);
    if (!Array.isArray(sources.keep) || sources.keep.length > 8 || !sources.keep.every(fingerprint) ||
      new Set(sources.keep).size !== sources.keep.length || !Array.isArray(sources.add) || sources.add.length > 8 ||
      typeof sources.include_result !== "boolean" || typeof sources.include_reviewed_outcome !== "boolean" ||
      !Array.isArray(sources.omitted_sources) || sources.omitted_sources.length > 8) refuse("invalid_source_selection", 422);
    for (const omission of sources.omitted_sources) {
      const row = object(omission); exact(row, ["source_binding", "reason"]);
      if (!fingerprint(row.source_binding) || typeof row.reason !== "string" || !row.reason.trim() ||
        [...row.reason].length > 500 || /[\u0000-\u001f\u007f]/u.test(row.reason)) refuse("invalid_source_selection", 422);
    }
  }
  if (["preview", "save"].includes(String(input.action))) exact(object(input.definition), ["goal", "success_criteria", "non_goals"]);
  return input as unknown as RepositoryResultWorkInputV01;
}

/** A dedicated snapshot for each read/compare/preview; write reservation precedes
 * every asynchronous resolution/save check. No request carries authentication,
 * a receipt ID, a serialized packet or caller-authored canonical source entries. */
export async function prepareCodexRepositoryResultWorkV01(db: Database.Database, value: unknown,
  channel: CompanionWorkChannelV01, dependencies: CodexRepositoryContinuityDependenciesV01 = {},
): Promise<RepositoryResultWorkProjectionV01> {
  const input = parseRepositoryResultWorkInputV01(value);
  if (!channel.key || !channel.instance_id || !channel.generation_id || !channel.repository_fingerprint) refuse("companion_unavailable", 503);
  if (db.inTransaction) refuse("result_work_transaction_conflict");
  const saved = input.action === "save";
  db.exec(saved ? "BEGIN IMMEDIATE" : "BEGIN");
  try {
    const resolution = await resolveCodexRepositoryProjectV01(db, input, dependencies);
    if (resolution.status !== "resolved_exact") refuse("repository_unresolved");
    const scope = { workspace_id: resolution.workspace_id!, project_id: resolution.project_id! };
    const snapshot = await readCodexCurrentContinuitySnapshotV01(db, { viewed_project_id: scope.project_id }, dependencies);
    if (snapshot.projection.snapshot.status !== "exact" || snapshot.projection.snapshot.binding !== input.expected_snapshot_binding) refuse("refresh_required");
    if (snapshot.projection.project.root_availability !== "available") refuse("result_preparation_unavailable");
    const config = { ...scope, enabled: true as const, operator_id: COMPANION_WORK_OPERATOR_ID_V01, database_path: db.name };
    const clock = { now: dependencies.now ?? (() => new Date().toISOString()) };
    const latest = readProjectRunResultOverviewV01(db, scope);
    if (latest.latest_result_state !== "available" || !latest.latest_result) refuse("result_preparation_unavailable");
    const preparation = readResultWorkPreparationV01(db, { config, receipt_id: latest.latest_result.receipt_ref, clock });
    const root = await inspectPersistedHostProjectRootV01(db, { config, evaluated_at: clock.now(), require_active_project: false });
    const predecessor = readProjectRunResultSourceBindingV01(db, { ...scope, receipt_id: preparation.binding.expected_latest_receipt_id });
    if (root.root_fingerprint !== preparation.binding.expected_root_fingerprint ||
      predecessor.run?.metadata.root_physical_identity_fingerprint !== fingerprintNativeHostPhysicalRootIdentityV01(root.physical_root_identity)) refuse("result_root_changed");
    const preparationBinding = seal(channel, { kind: "preparation", snapshot: input.expected_snapshot_binding,
      binding: projectBoundRequestIdentityV01(preparation.binding), physical_root: root.physical_root_identity });
    if (input.action !== "read" && !sameSeal(input.preparation_binding!, preparationBinding)) refuse("preparation_changed");
    const before = preparation.initialization.current_work;
    if (!before) refuse("result_preparation_unavailable");
    const previous = preparation.initialization.selected_source_context ?? [];
    const result: RepositoryResultWorkProjectionV01 = {
      projection_version: CODEX_REPOSITORY_RESULT_WORK_VERSION_V01, status: "read",
      expected_snapshot_binding: input.expected_snapshot_binding, preparation_binding: preparationBinding,
      expected_source_comparison: null, preview_binding: null, packet_fingerprint: null,
      result: { execution_status: predecessor.receipt.execution.status, verification_status: predecessor.receipt.verification.status,
        recorded_at: predecessor.receipt.recorded_at, report_source_status: preparation.result_source ? "available" : "whole_note_unavailable" },
      definition: { before, after: null },
      sources: { before: projectSelectedWorkSourcesV01(previous), after: [],
        result: preparation.result_source ? projectSelectedWorkSourcesV01([preparation.result_source])[0]! : null,
        reviewed_outcome: preparation.reviewed_outcome.status === "available" ? projectSelectedWorkSourcesV01(preparation.reviewed_outcome.entries) : [],
        reviewed_outcome_status: preparation.reviewed_outcome.status, omitted_sources: [], comparison: [], unselected_previous: [] },
      packet_preview: null, effects: { successor_work_created: false, authorization_record_created: false },
      source_material_authority: "untrusted_selected_context",
      authority: { ...CODEX_CURRENT_CONTINUITY_AUTHORITY_V01, writes_database: false, changes_operator_session: false },
    };
    if (input.action !== "read") {
      const selected = input.sources!;
      if (selected.keep.some(binding => !previous.some(entry => entry.source_ref === binding))) refuse("source_binding_changed");
      if (selected.include_result && !preparation.result_source) refuse("result_source_unavailable");
      if (selected.include_reviewed_outcome && preparation.reviewed_outcome.status !== "available") refuse("reviewed_outcome_unavailable");
      const comparison = compareResultWorkSourcesV01(db, { config, binding: preparation.binding, clock, notes: [
        ...selected.keep.map(binding => ({ saved_source_id: previous.find(entry => entry.source_ref === binding)!.entry_id })),
        ...selected.add,
        ...(selected.include_result ? [selectedWorkSourceInput(preparation.result_source!)] : []),
        ...(selected.include_reviewed_outcome && preparation.reviewed_outcome.status === "available"
          ? [{ reviewed_outcome_ref: preparation.reviewed_outcome.binding }] : []),
      ] });
      if (canonicalizeProtocolValueV01(selected.omitted_sources.map(row => row.source_binding).sort()) !==
        canonicalizeProtocolValueV01(comparison.unselected_previous.map(row => row.source_ref!).sort())) refuse("source_omissions_invalid", 422);
      result.status = "compared";
      result.expected_source_comparison = comparison.fingerprint;
      result.sources.after = projectSelectedWorkSourcesV01(comparison.entries);
      result.sources.comparison = comparison.rows.map(row => ({ source_binding: row.entry.source_ref!, comparison: row.comparison, user_correction: row.user_correction }));
      result.sources.unselected_previous = comparison.unselected_previous.map(row => row.source_ref!);
      result.sources.omitted_sources = selected.omitted_sources;
      if (input.action === "preview" || saved) {
        if (input.expected_source_comparison !== comparison.fingerprint) refuse("source_comparison_changed");
        // This is read-only compiler material, not a session or credential. Its
        // length equals the existing admission owner's eventual session ID so
        // the full-packet budget includes the complete provenance overhead.
        const previewSession = "vnext-local-operator-session:companion-work:" + "p".repeat(22);
        const preview = previewResultWorkV01(db, { config, session_id: previewSession, binding: preparation.binding,
          definition: input.definition, selected_sources: { selected_source_context: comparison.entries,
            expected_source_comparison: comparison.fingerprint, omitted_sources: selected.omitted_sources },
          clock, include_compiled_packet: true });
        const previewBinding = seal(channel, { kind: "preview", preparation: preparationBinding,
          request: projectBoundRequestIdentityV01(preview.request), material: snapshot.binding_material });
        if (saved && !sameSeal(input.preview_binding!, previewBinding)) refuse("preview_changed");
        result.status = "previewed";
        result.preview_binding = previewBinding;
        result.definition.after = preview.after;
        result.packet_preview = projectPacketPreview(preview.compiled_packet!);
        if (saved) {
          const admission = recordCompanionWorkAdmissionInsideTransactionV01(db, { ...scope, observed_at: clock.now() });
          const written = defineAuthoredSuccessorTaskInsideTransactionV01(db, { config, request: preview.request, root, admission,
            expected_direction_ref: preview.request.expected_direction_ref ?? null });
          // This owner has no replay acknowledgement. Repeated or uncertain
          // saves must reconcile through Resume/readback, never create a twin.
          if (written.status !== "inserted") refuse("refresh_required");
          result.status = "saved";
          result.packet_fingerprint = written.packet.integrity.fingerprint;
          result.packet_preview = projectPacketPreview(written.packet);
          result.effects = { successor_work_created: true, authorization_record_created: true };
          result.authority = { ...result.authority, writes_database: true, changes_operator_session: true };
        }
      }
    }
    db.exec(saved ? "COMMIT" : "ROLLBACK");
    return result;
  } catch (error) { if (db.inTransaction) db.exec("ROLLBACK"); throw error; }
}

export async function loadCodexRepositoryResultWorkV01(value: unknown, channel: CompanionWorkChannelV01) {
  const input = parseRepositoryResultWorkInputV01(value);
  const db = new Database(getDatabasePath(), { readonly: input.action !== "save", fileMustExist: true });
  try {
    if (input.action !== "save") db.pragma("query_only = ON");
    db.pragma("foreign_keys = ON"); db.pragma("busy_timeout = 5000");
    return await prepareCodexRepositoryResultWorkV01(db, input, channel);
  } finally { db.close(); }
}

/** Authored content and mandatory context are complete. Root and session metadata locators and the serialized internal request never leave this
 * projection; selected-note locators use the existing disclosure owner. */
function projectPacketPreview(packet: TaskContextPacketV01): RepositoryResultWorkPacketPreviewV01 {
  const currentness = (value: TaskContextPacketV01["source_status"]["currentness"]) => ({ status: value.status, as_of: value.as_of, basis: value.basis });
  return {
    current_projection: packet.current_projection ? {
      bounded_summary: packet.current_projection.bounded_summary, as_of: packet.current_projection.as_of,
      currentness: currentness(packet.current_projection.currentness), warnings: packet.current_projection.warnings,
      items: packet.current_projection.items.map(item => ({ item_kind: item.item_kind, summary: item.summary, currentness: currentness(item.currentness) })),
    } : null,
    tensions: packet.tensions.map(item => ({ summary: item.summary, severity: item.severity, currentness: currentness(item.currentness) })),
    risks: packet.risks.map(item => ({ summary: item.summary, severity: item.severity, currentness: currentness(item.currentness) })),
    gaps: packet.gaps.map(item => ({ code: item.code, summary: item.summary, severity: item.severity, missing_fields: item.missing_fields })),
    criterion_verification_plan: null,
    selected_context: packet.selected_context.map(entry => ({ entry_kind: entry.entry_kind,
      source_binding: fingerprint(entry.source_ref) ? entry.source_ref : null,
      text: entry.entry_id === `${AUTHORED_SUCCESSOR_TASK_V01}:source` ? null : entry.bounded_summary ?? null,
      content_status: entry.entry_id === `${AUTHORED_SUCCESSOR_TASK_V01}:source` ? "withheld_authorship_material" : "included",
      reason: entry.why_included, trust_class: entry.trust_class, currentness: currentness(entry.currentness) })),
    excluded_context: packet.excluded_context.map(entry => ({ source_binding: fingerprint(entry.source_ref) ? entry.source_ref : null,
      reason: entry.why_excluded, currentness: currentness(entry.currentness) })),
    constraints: packet.constraints, return_contract: packet.return_contract,
    source_status: { status: packet.source_status.status, currentness: currentness(packet.source_status.currentness), warnings: packet.source_status.warnings },
    capability_grant: null,
  };
}
function seal(channel: CompanionWorkChannelV01, value: unknown) {
  const { key, ...identity } = channel;
  return `sha256:${createHmac("sha256", key).update(canonicalizeProtocolValueV01({ contract: CODEX_REPOSITORY_RESULT_WORK_VERSION_V01, identity, value })).digest("hex")}`;
}
function sameSeal(left: string, right: string) {
  const a = Buffer.from(left), b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) refuse("invalid_result_work_input", 400);
  return value as Record<string, unknown>;
}
function exact(value: Record<string, unknown>, keys: string[]) {
  if (Object.keys(value).sort().join(",") !== [...keys].sort().join(",")) refuse("invalid_result_work_input", 400);
}
function fingerprint(value: unknown): value is string { return typeof value === "string" && /^sha256:[a-f0-9]{64}$/u.test(value); }
function refuse(code: string, status = 409): never { throw new RepositoryResultWorkTransportErrorV01(code, status); }
