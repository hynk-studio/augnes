import { inspectRevisableProjectWorkChainV01 } from "@/lib/vnext/runtime/project-work-revision";
import { compareNewProjectWorkV01, currentPreparationRootBindingV01, NewProjectWorkPreparationErrorV01 } from "@/lib/vnext/runtime/new-project-work-preparation";
import { createHmac, timingSafeEqual } from "node:crypto";
import path from "node:path";
import Database from "better-sqlite3";
import { getDatabasePath } from "@/lib/db";
import { buildSelectedWorkSourceEntry, compareSelectedWorkSources, normalizeSelectedWorkSources, readSelectedWorkSources } from "@/lib/intake/selected-work-source-comparison";
import { resolveRetainedWorkSources } from "@/lib/intake/retained-work-source-recall";
import { CODEX_CURRENT_CONTINUITY_AUTHORITY_V01, readCodexCurrentContinuitySnapshotV01 } from "@/lib/vnext/codex-current-continuity/codex-current-continuity";
import { canonicalizeProtocolValueV01 } from "@/lib/vnext/protocol-primitives";
import { normalizeInitialProjectWorkDefinitionV01 } from "@/lib/vnext/runtime/initial-project-work-context";
import { COMPANION_WORK_OPERATOR_ID_V01, recordCompanionWorkAdmissionInsideTransactionV01 } from "@/lib/vnext/runtime/local-operator-session";
import { ProjectWorkRevisionErrorV01, packetLineageKindV01, readProjectWorkRevisionEligibilityStrictV01, revisePreExecutionProjectWorkInsideTransactionV01 } from "@/lib/vnext/runtime/project-work-revision";
import { CODEX_REPOSITORY_WORK_REVISION_VERSION_V01, type RepositoryWorkRevisionInputV01, type RepositoryWorkRevisionProjectionV01 } from "@/types/vnext/codex-repository-work-revision";
import type { RevisePreExecutionProjectWorkRequestV01 } from "@/types/vnext/project-work-revision";
import { resolveCodexRepositoryProjectV01, type CodexRepositoryContinuityDependenciesV01 } from "./codex-repository-continuity";
import { projectSelectedWorkSourcesV01 } from "./codex-repository-work-sources";

export class RepositoryWorkRevisionTransportErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 409) { super(code); }
}

/** Established by the private route, never supplied in a tool argument. */
export interface CompanionWorkChannelV01 {
  key: string;
  instance_id: string;
  generation_id: string;
  repository_fingerprint: string;
}

export function parseRepositoryWorkRevisionInputV01(value: unknown): RepositoryWorkRevisionInputV01 {
  const input = object(value);
  const keys = [...(input.intent === "new_task" ? ["intent"] : []), "action", "repository_root", "expected_snapshot_binding", "changes", ...(input.action === "save" ? ["preview_binding"] : [])];
  exact(input, keys);
  if (!["preview", "save"].includes(String(input.action)) || typeof input.repository_root !== "string" ||
    !path.isAbsolute(input.repository_root) || input.repository_root.includes("\0") || !fingerprint(input.expected_snapshot_binding) ||
    (input.action === "save" && !fingerprint(input.preview_binding))) refuse("invalid_revision_input", 400);
  const changes = object(input.changes);
  if (input.intent === "new_task") {
    exact(changes, ["goal", "success_criteria", "non_goals", "sources"]);
    if (changes.sources === undefined) refuse("invalid_source_changes", 422);
  }
  only(changes, ["goal", "success_criteria", "non_goals", "sources"]);
  if (changes.sources !== undefined) {
    const sources = object(changes.sources);
    if (input.intent === "new_task") {
      only(sources, ["keep", "add", "omitted_sources"]);
      if (!Array.isArray(sources.keep) || !Array.isArray(sources.omitted_sources)) refuse("invalid_source_changes", 422);
      for (const binding of sources.keep) if (!fingerprint(binding)) refuse("invalid_source_binding", 422);
    } else only(sources, ["add", "replace", "deselect", "retained_source_refs"]);
    for (const key of Object.keys(sources)) if (!Array.isArray(sources[key])) refuse("invalid_source_changes", 422);
    for (const replacement of (sources.replace ?? []) as unknown[]) {
      const row = object(replacement); exact(row, ["source_binding", "note"]);
      if (!fingerprint(row.source_binding)) refuse("invalid_source_binding", 422);
    }
    for (const binding of (sources.deselect ?? []) as unknown[]) if (!fingerprint(binding)) refuse("invalid_source_binding", 422);
  }
  return input as unknown as RepositoryWorkRevisionInputV01;
}

/** Dedicated connection: coherent preview snapshot, and write reservation BEFORE
 * asynchronous repository resolution and every save check. No borrowed transaction. */
export async function reviseCodexRepositoryWorkV01(
  db: Database.Database,
  value: unknown,
  channel: CompanionWorkChannelV01,
  dependencies: CodexRepositoryContinuityDependenciesV01 = {},
): Promise<RepositoryWorkRevisionProjectionV01> {
  const input = parseRepositoryWorkRevisionInputV01(value);
  if (!channel.key || !channel.instance_id || !channel.generation_id || !channel.repository_fingerprint) refuse("companion_unavailable", 503);
  if (db.inTransaction) refuse("work_revision_transaction_conflict");
  db.exec(input.action === "save" ? "BEGIN IMMEDIATE" : "BEGIN");
  let stale = false;
  try {
    const resolution = await resolveCodexRepositoryProjectV01(db, input, dependencies);
    if (resolution.status !== "resolved_exact") refuse("repository_unresolved");
    const scope = { workspace_id: resolution.workspace_id!, project_id: resolution.project_id! };
    const { projection: continuity, binding_material: material } = await readCodexCurrentContinuitySnapshotV01(db, {
      viewed_project_id: scope.project_id,
    }, dependencies);
    if (continuity.snapshot.status !== "exact" || continuity.current_work.status !== "current_work" ||
      continuity.current_work.currentness !== "fresh" || continuity.project.root_availability !== "available") refuse("current_work_unavailable");
    const chain = inspectRevisableProjectWorkChainV01(db, scope);
    if (input.intent === "new_task" && chain.tip_lineage_kind === "authored_successor_task") refuse("work_revision_not_eligible");
    const eligibility = readProjectWorkRevisionEligibilityStrictV01(db, scope);
    stale = continuity.snapshot.binding !== input.expected_snapshot_binding;
    if (input.action === "preview" && stale) refuse("refresh_required");
    if (!eligibility.eligible && !(input.action === "save" && stale && eligibility.status === "revision_limit_reached")) refuse("work_revision_not_eligible");
    // Only the validated immediate predecessor is even considered for a replay.
    // It cannot authorize a new revision; the shared writer must acknowledge it.
    const basis = stale && input.action === "save" ? chain.tip_revision?.prior_packet : chain.tip_packet;
    if (!basis) refuse("refresh_required");
    const before = normalizeInitialProjectWorkDefinitionV01(basis.task);
    const after = normalizeInitialProjectWorkDefinitionV01({ ...before, ...input.changes });
    const previous = readSelectedWorkSources(basis);
    const operations = input.changes.sources ?? {};
    // Replay may resolve only the history that was visible at its original
    // preview, matching the atomic writer's immediate-predecessor cutoff.
    const cutoff = chain.packets.findIndex((packet) => packet.packet_id === basis.packet_id);
    const retained = resolveRetainedWorkSources({ ...chain, packets: chain.packets.slice(0, cutoff + 1) }, operations.retained_source_refs ?? []);
    if (input.intent === "new_task" && (new Set(operations.keep).size !== operations.keep!.length ||
      operations.keep!.some(binding => !previous.some(entry => entry.source_ref === binding)))) refuse("source_binding_changed");
    const removed = [...(operations.deselect ?? []), ...(operations.replace ?? []).map((row) => row.source_binding)];
    if (new Set(removed).size !== removed.length || removed.some((binding) => !previous.some((entry) => entry.source_ref === binding))) {
      refuse("source_binding_changed", 409);
    }
    const selected = normalizeSelectedWorkSources(scope, [
      ...previous.filter((entry) => input.intent === "new_task" ? operations.keep!.includes(entry.source_ref!) : !removed.includes(entry.source_ref!)),
      ...(operations.add ?? []).map((note) => buildSelectedWorkSourceEntry(scope, note)),
      ...(operations.replace ?? []).map((row) => buildSelectedWorkSourceEntry(scope, row.note)),
      ...retained.entries,
    ]);
    const comparison = compareSelectedWorkSources(basis, selected, retained.refs);
    const lineage = packetLineageKindV01(basis);
    if (!lineage) refuse("current_work_unavailable");
    const request: RevisePreExecutionProjectWorkRequestV01 = {
      action: input.intent === "new_task" ? "prepare_new_project_work" : "revise_pre_execution_project_work", ...scope,
      expected_active_project_id: scope.project_id,
      expected_active_selection_revision: eligibility.active_selection_revision!,
      expected_current_packet_id: basis.packet_id,
      expected_current_packet_fingerprint: basis.integrity.fingerprint,
      expected_current_lineage_kind: lineage,
      ...after, selected_source_context: selected, expected_source_comparison: comparison.fingerprint,
      ...(retained.refs.length ? { retained_source_refs: retained.refs } : {}),
    };
    if (input.intent === "new_task") request.preparation = compareNewProjectWorkV01(basis, request,
      currentPreparationRootBindingV01(db, scope), operations.omitted_sources).preparation;
    const seal = sealPreview(channel, input.expected_snapshot_binding, request, material);
    if (input.action === "save" && !sameSeal(seal, input.preview_binding!)) refuse(stale ? "refresh_required" : "preview_changed");
    let packet = basis;
    let status: RepositoryWorkRevisionProjectionV01["status"] = "previewed";
    if (input.action === "save") {
      const observed_at = (dependencies.now ?? (() => new Date().toISOString()))();
      const admission = recordCompanionWorkAdmissionInsideTransactionV01(db, { ...scope, observed_at });
      const result = revisePreExecutionProjectWorkInsideTransactionV01(db, {
        scope: { ...scope, operator_id: COMPANION_WORK_OPERATOR_ID_V01 }, request, admission,
      });
      if (stale && result.status !== "exact_replay") refuse("refresh_required");
      packet = result.packet;
      status = result.status === "inserted" ? "saved" : "exact_replay";
    }
    const priorBindings = previous.map((entry) => entry.source_ref!);
    const nextBindings = selected.map((entry) => entry.source_ref!);
    const result: RepositoryWorkRevisionProjectionV01 = {
      projection_version: CODEX_REPOSITORY_WORK_REVISION_VERSION_V01, status,
      expected_snapshot_binding: input.expected_snapshot_binding, preview_binding: seal,
      packet_fingerprint: packet.integrity.fingerprint,
      definition: { before, after },
      sources: {
        before: projectSelectedWorkSourcesV01(previous), after: projectSelectedWorkSourcesV01(selected),
        retained: nextBindings.filter((binding) => priorBindings.includes(binding)),
        added: nextBindings.filter((binding) => !priorBindings.includes(binding)),
        deselected: priorBindings.filter((binding) => !nextBindings.includes(binding)),
      },
      effects: { work_revision_created: input.intent !== "new_task" && status === "saved", authorization_record_created: input.action === "save",
        ...(input.intent === "new_task" ? { work_preparation_created: status === "saved" } : {}) },
      ...(request.preparation ? { preparation: { prior_work_marked_complete: false as const, omitted_sources: request.preparation.omitted_sources } } : {}),
      source_material_authority: "untrusted_selected_context", authority: {
        ...CODEX_CURRENT_CONTINUITY_AUTHORITY_V01, writes_database: input.action === "save",
        changes_operator_session: input.action === "save", retries_or_replays: status === "exact_replay",
      },
    };
    db.exec(input.action === "save" ? "COMMIT" : "ROLLBACK");
    return result;
  } catch (error) {
    if (db.inTransaction) db.exec("ROLLBACK");
    // The existing exact-successor owner rejected a different concurrent
    // revision. Expose a confirmed stale-state refusal, never an uncertain save.
    if (stale && error instanceof NewProjectWorkPreparationErrorV01) refuse("refresh_required");
    if (error instanceof ProjectWorkRevisionErrorV01 && error.code === "work_revision_current_packet_changed") refuse("refresh_required");
    throw error;
  }
}

export async function loadCodexRepositoryWorkRevisionV01(value: unknown, channel: CompanionWorkChannelV01) {
  const input = parseRepositoryWorkRevisionInputV01(value);
  const db = new Database(getDatabasePath(), { readonly: input.action === "preview", fileMustExist: true });
  try {
    if (input.action === "preview") db.pragma("query_only = ON");
    db.pragma("foreign_keys = ON"); db.pragma("busy_timeout = 5000");
    return await reviseCodexRepositoryWorkV01(db, input, channel);
  } finally { db.close(); }
}

function sealPreview(channel: CompanionWorkChannelV01, snapshot: string, request: RevisePreExecutionProjectWorkRequestV01, value: unknown): string {
  const material = object(value);
  const work = object(material.current_work);
  // Preserve all other canonical owner fields verbatim. These are the only
  // changes a normal pre-execution revision (including the final slot) implies.
  const { current_packet: _packet, current_work: _work, ...invariant } = material;
  const { lineage_kind: _lineage, revision_eligible: _eligible, revision_reason: _reason, ...stableWork } = work;
  const { key, ...identity } = channel;
  return `sha256:${createHmac("sha256", key).update(canonicalizeProtocolValueV01({
    contract: CODEX_REPOSITORY_WORK_REVISION_VERSION_V01, identity, snapshot, request,
    invariant: { ...invariant, current_work: stableWork },
  })).digest("hex")}`;
}
function sameSeal(a: string, b: string) { return a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b)); }
function object(value: unknown): Record<string, unknown> { if (!value || typeof value !== "object" || Array.isArray(value)) refuse("invalid_revision_input", 400); return value as Record<string, unknown>; }
function exact(value: Record<string, unknown>, keys: string[]) { if (Object.keys(value).sort().join(",") !== [...keys].sort().join(",")) refuse("invalid_revision_input", 400); }
function only(value: Record<string, unknown>, keys: string[]) { if (Object.keys(value).some((key) => !keys.includes(key))) refuse("invalid_revision_input", 400); }
function fingerprint(value: unknown): value is string { return typeof value === "string" && /^sha256:[a-f0-9]{64}$/u.test(value); }
function refuse(code: string, status = 409): never { throw new RepositoryWorkRevisionTransportErrorV01(code, status); }
