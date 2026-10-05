import type Database from "better-sqlite3";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../protocol-primitives";
import { parseDirectionContent, parseDirectionPrincipal, directionObject, directionRef, directionTime, directionText, directionInteger, directionArray, DIRECTION_VERSION, type DirectionBinding, type DirectionDecision, type DirectionEntry, type DirectionGrant, type DirectionRecord, type DirectionView, type DirectionProposal } from "../project-direction";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import type { PacketDirectionInterpretation } from "../project-direction";
import { readSelectedWorkSources } from "@/lib/intake/selected-work-source-comparison";
import { DIRECTION_SOURCE, directionSource, selectedDirectionProfile } from "../project-direction-source";
import { readAgendaInput } from "../prospective-agenda";

export type DirectionScope = { workspace_id: string; project_id: string };
const nullableRef = (value: unknown) => value === null ? null : directionRef(value);
function validateParent(value: unknown) {
  if (value === null) return;
  const p = directionObject(value, ["project_id", "direction_ref", "delegation_ref", "why", "contribution", "return_question"]);
  directionText(p.project_id, 256); directionRef(p.direction_ref); directionRef(p.delegation_ref);
  directionText(p.why); directionText(p.contribution); directionText(p.return_question);
}
function validateRecord(value: unknown): asserts value is DirectionRecord {
  const r = value as DirectionRecord;
  directionCheck(r?.version === DIRECTION_VERSION, "record_version_invalid");
  directionText(r.workspace_id, 256); directionText(r.project_id, 256); directionTime(r.at);
  const fields: Record<DirectionRecord["kind"], string[]> = {
    decision: ["revision", "previous", "created_by", "principal", "authority_ref", "parent", "content", "status", "reason", "proposal_ref"],
    grant: ["principal", "issuer", "expires_at", "allowed_directions", "creation_slots", "continuations", "project_ids", "max_mutations", "execution_authority"],
    proposal: ["principal", "authority_ref", "basis_ref", "content", "reason", "child_result"],
    return: ["principal", "authority_ref", "basis_ref", "content", "reason", "child_result"],
    binding: ["packet_id", "packet_fingerprint", "direction_ref"], revocation: ["grant_ref", "principal", "reason"],
  };
  directionCheck(Object.hasOwn(fields, r.kind), "record_kind_invalid");
  if (r.kind === "decision" && Object.hasOwn(r, "creation")) fields.decision.push("creation");
  if (r.kind === "binding" && Object.hasOwn(r, "basis")) fields.binding.push("basis");
  directionObject(r, ["version", "kind", "workspace_id", "project_id", "at", ...fields[r.kind]]);
  if (r.kind === "decision") {
    directionInteger(r.revision, 1, 512); nullableRef(r.previous); if (r.created_by) parseDirectionPrincipal(r.created_by);
    parseDirectionPrincipal(r.principal); nullableRef(r.authority_ref); validateParent(r.parent); parseDirectionContent(r.content);
    directionCheck((r.principal.kind === "agent") === (r.authority_ref !== null), "decision_authority_invalid");
    directionCheck(["active", "paused"].includes(r.status), "status_invalid"); directionText(r.reason); nullableRef(r.proposal_ref);
    if (r.creation !== undefined && r.creation !== null) {
      const c = directionObject(r.creation, ["grant_ref", "slot", "project_id", "created_at", "root", "root_identity"]);
      directionRef(c.grant_ref); directionInteger(c.slot, 0, 1); directionText(c.project_id, 256);
      directionTime(c.created_at); directionText(c.root, 8192); directionRef(c.root_identity);
      directionCheck(r.principal.kind === "agent" && r.authority_ref !== null, "creation_attribution_invalid");
    }
  } else if (r.kind === "grant") {
    directionCheck(r.execution_authority === false && r.principal.kind === "agent" && r.issuer.kind === "human", "grant_authority_invalid");
    parseDirectionPrincipal(r.principal); parseDirectionPrincipal(r.issuer); directionTime(r.expires_at);
    directionCheck(r.expires_at > r.at && Date.parse(r.expires_at)-Date.parse(r.at) <= 3_600_000, "grant_expiry_invalid");
    directionArray(r.allowed_directions, 1, 4).forEach(parseDirectionContent); directionInteger(r.max_mutations, 1, 20);
    directionArray(r.project_ids, 0, 4).forEach(v => directionText(v, 256));
    for (const value of directionArray(r.creation_slots, 0, 2)) {
      const slot = directionObject(value, ["root", "root_identity", "display_name", "parent"]);
      directionText(slot.root, 8192); directionRef(slot.root_identity); directionText(slot.display_name, 240);
      if (slot.parent) validateParent({ ...(slot.parent as object), delegation_ref: "sha256:"+"0".repeat(64) });
    }
    for (const value of directionArray(r.continuations, 0, 2)) {
      const continuation = directionObject(value, ["project_id", "expected_ref", "parent"]);
      directionText(continuation.project_id, 256); directionRef(continuation.expected_ref);
      if (continuation.parent) validateParent({ ...(continuation.parent as object), delegation_ref: "sha256:"+"0".repeat(64) });
    }
  } else if (r.kind === "binding") { directionText(r.packet_id, 256); directionRef(r.packet_fingerprint); directionRef(r.direction_ref); directionCheck(r.basis === undefined || r.basis === "selected_direction", "binding_basis_invalid"); }
  else if (r.kind === "revocation") { directionRef(r.grant_ref); parseDirectionPrincipal(r.principal); directionText(r.reason); }
  else {
    parseDirectionPrincipal(r.principal); directionRef(r.authority_ref); nullableRef(r.basis_ref); parseDirectionContent(r.content); directionText(r.reason);
    if (r.kind === "proposal") directionCheck(r.child_result === null, "proposal_invalid");
    else {
      const c = directionObject(r.child_result, ["project_id", "direction_ref", "receipt_id", "receipt_fingerprint"]);
      directionText(c.project_id, 256); directionRef(c.direction_ref);
      if (c.receipt_id !== null) { directionText(c.receipt_id, 256); directionRef(c.receipt_fingerprint); }
      else directionCheck(c.receipt_fingerprint === null, "return_invalid");
    }
  }
}
export class ProjectDirectionError extends Error {
  constructor(readonly code: string, readonly status = 409) { super(code); }
}
export function directionCheck(condition: unknown, code: string, status = 409): asserts condition {
  if (!condition) throw new ProjectDirectionError(`project_direction_${code}`, status);
}
const hasStore = (db: Database.Database) => !!db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='vnext_project_direction_records'").get();
type Row = { workspace_id: string; project_id: string; kind: string; ref: string; recorded_at: string; body_json: string };
function decode(row: Row): DirectionEntry {
  const value: unknown = JSON.parse(row.body_json);
  validateRecord(value);
  directionCheck(value.workspace_id === row.workspace_id && value.project_id === row.project_id && value.kind === row.kind && value.at === row.recorded_at && hash(canonical(value)) === row.ref, "record_binding_invalid");
  return { ref: row.ref, value };
}
export function readDirectionRecords(db: Database.Database, scope: DirectionScope, at = new Date().toISOString()): DirectionEntry[] {
  if (!hasStore(db)) return [];
  directionTime(at);
  const observed = db.prepare(`WITH direction_history AS MATERIALIZED (
    SELECT * FROM vnext_project_direction_records WHERE workspace_id=? AND project_id=? AND recorded_at<=?
    ORDER BY recorded_at,ordinal LIMIT 513
  ) SELECT 0 AS summary,ordinal,workspace_id,project_id,kind,ref,recorded_at,body_json,NULL AS n FROM direction_history
    UNION ALL SELECT 1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,count(*) FROM direction_history
    ORDER BY summary DESC,recorded_at,ordinal`).all(scope.workspace_id, scope.project_id, at) as Array<Row & { summary: number; n: number; ordinal: number }>;
  const [summary, ...rows] = observed;
  // A lost final decision or revocation is not evidence of current scope or
  // continued authority. Preserve the existing history bound, detect every row.
  directionCheck(summary?.summary === 1 && summary.n === rows.length &&
    rows.every(row => row.summary === 0) && new Set(rows.map(row => row.ordinal)).size === rows.length, "history_incomplete");
  directionCheck(rows.length <= 512, "history_bound");
  return rows.map(decode);
}
export function readDirectionRecord(db: Database.Database, scope: DirectionScope, reference: string): DirectionEntry {
  const row = db.prepare("SELECT * FROM vnext_project_direction_records WHERE workspace_id=? AND project_id=? AND ref=?").get(scope.workspace_id, scope.project_id, reference) as Row | undefined;
  directionCheck(row, "source_missing");
  return decode(row);
}
export function appendDirectionRecord<T extends DirectionRecord>(db: Database.Database, value: T): DirectionEntry<T> {
  directionCheck(db.inTransaction, "transaction_required");
  validateRecord(value);
  const count = db.prepare("SELECT COUNT(*) AS count FROM vnext_project_direction_records WHERE workspace_id=? AND project_id=?").get(value.workspace_id, value.project_id) as { count: number };
  directionCheck(count.count < 512, "history_bound");
  const reference = hash(canonical(value));
  db.prepare("INSERT INTO vnext_project_direction_records(workspace_id,project_id,kind,ref,recorded_at,body_json) VALUES (?,?,?,?,?,?)").run(value.workspace_id,value.project_id,value.kind,reference,value.at,canonical(value));
  return { ref: reference, value };
}
export function effectiveDirection(db: Database.Database, scope: DirectionScope, at: string): DirectionEntry<DirectionDecision> | null {
  const history = readDirectionRecords(db, scope, at).filter((r): r is DirectionEntry<DirectionDecision> => r.value.kind === "decision");
  let prior: DirectionEntry<DirectionDecision> | null = null;
  for (const entry of history) {
    directionCheck(entry.value.previous === (prior?.ref ?? null) && entry.value.revision === (prior?.value.revision ?? 0) + 1 &&
      (!prior || entry.value.at > prior.value.at && canonical(entry.value.creation ?? null) === canonical(prior.value.creation ?? null) && canonical(entry.value.created_by) === canonical(prior.value.created_by) && canonical(entry.value.principal) === canonical(prior.value.principal)), "history_invalid");
    prior = entry;
  }
  return prior;
}
export function grantAvailable(db: Database.Database, scope: DirectionScope, reference: string, at: string): boolean {
  try {
    const record = readDirectionRecord(db, scope, reference);
    if (record.value.kind !== "grant" || record.value.at > at || record.value.expires_at <= at) return false;
    const credential = db.prepare("SELECT suspended,token_hash FROM vnext_project_direction_credentials WHERE grant_ref=?").get(reference) as { suspended: number; token_hash: string | null } | undefined;
    return !!credential && !credential.suspended && !!credential.token_hash && !readDirectionRecords(db, scope, at).some(r => r.value.kind === "revocation" && r.value.grant_ref === reference);
  } catch { return false; }
}
export function findDirectionGrant(db: Database.Database, workspaceId: string, reference: string): DirectionEntry<DirectionGrant> {
  const row = db.prepare("SELECT * FROM vnext_project_direction_records WHERE workspace_id=? AND ref=? AND kind='grant'").get(workspaceId, reference) as Row | undefined;
  directionCheck(row, "grant_missing", 403);
  return decode(row) as DirectionEntry<DirectionGrant>;
}
export function directionCurrent(db: Database.Database, current: DirectionEntry<DirectionDecision>, at: string, visited = new Set<string>()): { parent_current: boolean; authority_current: boolean } {
  const d = current.value;
  directionCheck(!visited.has(d.project_id) && visited.size < 8, "parent_cycle");
  visited.add(d.project_id);
  let parentCurrent = true;
  if (d.parent) {
    const p = effectiveDirection(db, { ...d, project_id: d.parent.project_id }, at);
    parentCurrent = !!p && p.ref === d.parent.direction_ref && p.value.status === "active";
    if (p) { const inherited = directionCurrent(db, p, at, visited); parentCurrent &&= inherited.parent_current && inherited.authority_current; }
    const grant = findDirectionGrant(db, d.workspace_id, d.parent.delegation_ref);
    parentCurrent &&= grantAvailable(db, grant.value, grant.ref, at);
  }
  const authority = d.authority_ref ? findDirectionGrant(db, d.workspace_id, d.authority_ref) : null;
  return { parent_current: parentCurrent, authority_current: !authority || grantAvailable(db, authority.value, authority.ref, at) };
}
export function bindPacketDirection(db: Database.Database, packet: TaskContextPacketV01) {
  const direction = consumedPacketDirection(db, packet);
  if (!direction) return;
  const existing = packetDirectionBinding(db, packet);
  if (existing) { directionCheck(existing.value.direction_ref === direction.ref, "binding_conflict"); return; }
  appendDirectionRecord(db, { version: DIRECTION_VERSION, kind: "binding", workspace_id: packet.workspace_id, project_id: packet.project_id,
    at: packet.generated_at, packet_id: packet.packet_id, packet_fingerprint: packet.integrity.fingerprint, direction_ref: direction.ref, basis: "selected_direction" });
}
/** Resolve the direction the packet actually selected. A sidecar never proves
 * reconsideration. An agenda, when present, must point to this exact projection. */
function consumedPacketDirection(db: Database.Database, packet: TaskContextPacketV01): DirectionEntry<DirectionDecision> | null {
  try {
    const sources = readSelectedWorkSources(packet);
    const selected = sources.filter(e => selectedDirectionProfile(e)?.version === DIRECTION_SOURCE);
    if (selected.length !== 1) return null;
    const ref = directionRef(selectedDirectionProfile(selected[0]!).revision_ref);
    const direction = readDirectionRecord(db, packet, ref);
    if (direction.value.kind !== "decision" || direction.value.at > packet.generated_at) return null;
    const projection = directionSource(direction as DirectionEntry<DirectionDecision>);
    if (canonical(selected[0]) !== canonical(projection)) return null;
    const agenda = readAgendaInput(sources, packet.generated_at);
    if (agenda && agenda.agenda.direction_ref !== projection.source_ref) return null;
    return direction as DirectionEntry<DirectionDecision>;
  } catch { return null; }
}
export function assertExpectedPacketDirection(db: Database.Database, scope: DirectionScope, expected: string | null, at: string) {
  directionCheck(db.inTransaction, "transaction_required");
  directionCheck((effectiveDirection(db, scope, at)?.ref ?? null) === expected, "stale_revision");
}
export function packetDirectionBinding(db: Database.Database, packet: TaskContextPacketV01): DirectionEntry<DirectionBinding> | null {
  const bindings = readDirectionRecords(db, packet, packet.generated_at).filter((r): r is DirectionEntry<DirectionBinding> => r.value.kind === "binding" && r.value.packet_id === packet.packet_id);
  directionCheck(bindings.length <= 1 && (!bindings[0] || bindings[0].value.packet_fingerprint === packet.integrity.fingerprint), "packet_binding_invalid");
  return bindings[0] ?? null;
}
export function assertPacketDirectionCurrent(db: Database.Database, packet: TaskContextPacketV01, at: string) {
  directionCheck(readPacketDirectionInterpretation(db, packet, at).status !== "historical", "reconsideration_required");
}
export function readPacketDirectionInterpretation(db: Database.Database, packet: TaskContextPacketV01, at: string): PacketDirectionInterpretation {
  const current = effectiveDirection(db, packet, at);
  const consumed = consumedPacketDirection(db, packet);
  if (!current) return { status: packet.selected_context?.some(e => selectedDirectionProfile(e)?.version === DIRECTION_SOURCE) ? "historical" : "unconfigured", direction_ref: consumed?.ref ?? null, effective_ref: null };
  const binding = packetDirectionBinding(db, packet);
  const state = directionCurrent(db, current, at);
  const active = packet.generated_at <= at && consumed?.ref === current.ref && binding?.value.direction_ref === consumed.ref &&
    state.parent_current && state.authority_current && current.value.status === "active";
  return { status: active ? "current" : "historical", direction_ref: consumed?.ref ?? null, effective_ref: current.ref };
}
export function readProjectDirection(db: Database.Database, scope: DirectionScope, at: string): DirectionView {
  const records = readDirectionRecords(db, scope, at);
  const effective = effectiveDirection(db, scope, at);
  const state = effective ? directionCurrent(db, effective, at) : { parent_current: true, authority_current: true };
  const history = records.filter((r): r is DirectionEntry<DirectionDecision> => r.value.kind === "decision");
  const applied = new Set(history.flatMap(r => r.value.proposal_ref ?? []));
  const proposals = records.filter((r): r is DirectionEntry<DirectionProposal> => ["proposal", "return"].includes(r.value.kind) && !applied.has(r.ref));
  const packets = db.prepare("SELECT payload_json FROM vnext_core_records WHERE workspace_id=? AND project_id=? AND record_kind='task_context_packet' AND created_at<=? ORDER BY created_at DESC LIMIT 1").all(scope.workspace_id, scope.project_id, at) as Array<{ payload_json: string }>;
  const pending = packets.map(row => {
    const packet = JSON.parse(row.payload_json) as TaskContextPacketV01;
    const interpretation = readPacketDirectionInterpretation(db, packet, at);
    const admitted = !!db.prepare("SELECT 1 FROM autonomy_runs WHERE scope=? AND json_extract(metadata_json, '$.packet_id')=? AND created_at<=? LIMIT 1").get(scope.project_id, packet.packet_id, at);
    return { packet_id: packet.packet_id, direction_ref: interpretation.direction_ref, interpretation: interpretation.status, admitted,
      needs_reconsideration: !admitted && interpretation.status === "historical" };
  });
  const grants = records.filter((r): r is DirectionEntry<DirectionGrant> => r.value.kind === "grant").map(record => {
    const projects = (db.prepare("SELECT DISTINCT project_id FROM vnext_project_direction_records WHERE workspace_id=? AND kind='decision' AND recorded_at<=?").all(scope.workspace_id, at) as Array<{ project_id: string }>).flatMap(p => {
      const direction = effectiveDirection(db, { ...scope, ...p }, at);
      if (direction?.value.authority_ref !== record.ref) return [];
      const identity = db.prepare("SELECT display_name FROM vnext_project_identities WHERE workspace_id=? AND project_id=?").get(scope.workspace_id, p.project_id) as { display_name: string } | undefined;
      return [{ ...p, display_name: identity?.display_name ?? "Delegated project", direction_ref: direction.ref }];
    });
    return { record, available: grantAvailable(db, scope, record.ref, at), projects };
  });
  return { effective, history, proposals, grants, ...state, pending_work: pending,
    accepted_goal_relationship: "working_direction_only_review_accepted_goals_separately", execution_authority_granted: false };
}

/** Recovery reads every immutable row, including historical grants and bindings. */
export function validateProjectDirectionHistory(db: Database.Database) {
  if (!hasStore(db)) return;
  const scopes = db.prepare("SELECT DISTINCT workspace_id,project_id FROM vnext_project_direction_records").all() as DirectionScope[];
  for (const scope of scopes) {
    const records = readDirectionRecords(db, scope, "9999-12-31T23:59:59.999Z");
    effectiveDirection(db, scope, "9999-12-31T23:59:59.999Z");
    for (const r of records) {
      if (r.value.kind === "binding") {
        const d = readDirectionRecord(db, scope, r.value.direction_ref);
        directionCheck(d.value.kind === "decision" && d.value.at <= r.value.at, "binding_history_invalid");
        const packet = db.prepare("SELECT fingerprint,payload_json FROM vnext_core_records WHERE workspace_id=? AND project_id=? AND record_id=? AND record_kind='task_context_packet'").get(scope.workspace_id,scope.project_id,r.value.packet_id) as { fingerprint: string; payload_json: string } | undefined;
        directionCheck(packet?.fingerprint === r.value.packet_fingerprint && JSON.parse(packet.payload_json).generated_at === r.value.at, "binding_packet_missing");
        // Keep earlier draft sidecars intact as history; current admission still
        // resolves consumed sources. New sidecars assert only the selected basis.
        directionCheck(r.value.basis === "selected_direction" ? consumedPacketDirection(db, JSON.parse(packet.payload_json))?.ref === d.ref
          : effectiveDirection(db, scope, r.value.at)?.ref === d.ref, "binding_history_invalid");
      }
      if (r.value.kind === "revocation") {
        const grant = findDirectionGrant(db, scope.workspace_id, r.value.grant_ref);
        directionCheck(grant.value.project_id === scope.project_id && grant.value.at <= r.value.at && canonical(grant.value.issuer) === canonical(r.value.principal), "revocation_history_invalid");
      }
      if (r.value.kind === "proposal" || r.value.kind === "return") {
        const p = r.value, grant = findDirectionGrant(db, scope.workspace_id, p.authority_ref);
        directionCheck(grant.value.at <= p.at && grant.value.expires_at > p.at && canonical(grant.value.principal) === canonical(p.principal), "proposal_authority_invalid");
        if (p.basis_ref) { const basis = readDirectionRecord(db, scope, p.basis_ref); directionCheck(basis.value.kind === "decision" && basis.value.at <= p.at, "proposal_basis_invalid"); }
        if (p.child_result) {
          const c = p.child_result, child = readDirectionRecord(db, { ...scope, project_id: c.project_id }, c.direction_ref);
          directionCheck(child.value.kind === "decision" && child.value.at <= p.at && child.value.authority_ref === grant.ref && child.value.parent?.project_id === scope.project_id && child.value.parent.direction_ref === p.basis_ref, "return_lineage_invalid");
          if (c.receipt_id) {
            const receipt = db.prepare("SELECT fingerprint,created_at FROM vnext_core_records WHERE workspace_id=? AND project_id=? AND record_kind='run_receipt' AND record_id=?").get(scope.workspace_id, c.project_id, c.receipt_id) as { fingerprint: string; created_at: string } | undefined;
            directionCheck(receipt?.fingerprint === c.receipt_fingerprint && receipt.created_at <= p.at, "return_receipt_invalid");
          }
        } else directionCheck(grant.value.project_ids.includes(scope.project_id) || effectiveDirection(db, scope, p.at)?.value.authority_ref === grant.ref || grant.value.continuations.some(c => c.project_id === scope.project_id && c.expected_ref === p.basis_ref), "proposal_scope_invalid");
      }
      if (r.value.kind === "decision" && r.value.parent) {
        const d = r.value, parent = d.parent!;
        const source = effectiveDirection(db, { ...scope, project_id: parent.project_id }, d.at);
        directionCheck(source?.ref === parent.direction_ref && source.value.status === "active" && parent.project_id !== scope.project_id, "parent_history_invalid");
        directionCurrent(db, r as DirectionEntry<DirectionDecision>, d.at); // cycle detection, including historical ancestors
        const delegation = findDirectionGrant(db, scope.workspace_id, parent.delegation_ref);
        const selected = { project_id: parent.project_id, direction_ref: parent.direction_ref, why: parent.why, contribution: parent.contribution, return_question: parent.return_question };
        directionCheck(delegation.value.creation_slots.some(s => canonical(s.parent) === canonical(selected)) || delegation.value.continuations.some(c => c.project_id === scope.project_id && canonical(c.parent) === canonical(selected)), "parent_delegation_invalid");
      }
      if (r.value.kind === "grant") {
        const grant = r.value;
        const uses = db.prepare("SELECT COUNT(*) AS count FROM vnext_project_direction_records WHERE workspace_id=? AND kind IN ('decision','proposal','return') AND json_extract(body_json,'$.authority_ref')=?").get(scope.workspace_id, r.ref) as { count: number };
        const credential = db.prepare("SELECT sequence,token_hash,suspended FROM vnext_project_direction_credentials WHERE grant_ref=?").get(r.ref) as { sequence: number; token_hash: string | null; suspended: number } | undefined;
        directionCheck(credential && credential.sequence === uses.count && uses.count <= grant.max_mutations && (credential.suspended === 1 ? credential.token_hash === null : typeof credential.token_hash === "string" && /^sha256:[a-f0-9]{64}$/u.test(credential.token_hash)), "grant_accounting_invalid");
        for (const c of grant.continuations) {
          const source = readDirectionRecord(db, { ...scope, project_id: c.project_id }, c.expected_ref);
          directionCheck(source.value.kind === "decision" && source.value.at < grant.at && canonical(source.value.principal) === canonical(grant.principal) && source.value.authority_ref, "renewal_history_invalid");
          const old = findDirectionGrant(db, scope.workspace_id, source.value.authority_ref);
          directionCheck(old.value.project_id === scope.project_id && canonical(old.value.issuer) === canonical(grant.issuer), "renewal_issuer_invalid");
        }
      }
      if ((r.value.kind === "decision" && r.value.authority_ref) || r.value.kind === "proposal" || r.value.kind === "return") {
        const grant = findDirectionGrant(db, scope.workspace_id, r.value.authority_ref!);
        directionCheck(!readDirectionRecords(db, grant.value, r.value.at).some(row => row.value.kind === "revocation" && row.value.grant_ref === grant.ref), "revoked_history_invalid");
      }
      if (r.value.kind === "decision" && r.value.authority_ref) {
        const grant = findDirectionGrant(db, scope.workspace_id, r.value.authority_ref);
        directionCheck(grant.value.at <= r.value.at && grant.value.expires_at > r.value.at && canonical(grant.value.principal) === canonical(r.value.principal) && grant.value.allowed_directions.some(c => canonical(c) === canonical((r.value as DirectionDecision).content)), "decision_authority_history_invalid");
        const d = r.value;
        const prior = d.previous ? readDirectionRecord(db, scope, d.previous) : null;
        if (!d.previous) {
          const c = d.creation;
          directionCheck(c, "creation_attribution_missing");
          const slot = grant.value.creation_slots[c.slot];
          const project = db.prepare("SELECT created_at FROM vnext_project_identities WHERE workspace_id=? AND project_id=?").get(scope.workspace_id, scope.project_id) as { created_at: string } | undefined;
          directionCheck(c.grant_ref === grant.ref && c.project_id === scope.project_id && c.created_at === d.at && project?.created_at === c.created_at &&
            slot?.root === c.root && slot.root_identity === c.root_identity && canonical(d.created_by) === canonical(grant.value.principal) &&
            canonical(d.parent) === canonical(slot.parent ? { ...slot.parent, delegation_ref: grant.ref } : null), "creation_attribution_invalid");
          const uses = db.prepare("SELECT count(*) AS count FROM vnext_project_direction_records WHERE workspace_id=? AND kind='decision' AND json_extract(body_json,'$.previous') IS NULL AND json_extract(body_json,'$.creation.grant_ref')=? AND json_extract(body_json,'$.creation.slot')=?")
            .get(scope.workspace_id, grant.ref, c.slot) as { count: number };
          directionCheck(uses.count === 1, "creation_slot_reused");
        }
        directionCheck(prior?.value.kind === "decision" && prior.value.authority_ref === grant.ref ||
          grant.value.continuations.some(c => c.project_id === scope.project_id && c.expected_ref === d.previous) ||
          !d.previous && d.creation?.grant_ref === grant.ref, "decision_grant_scope_invalid");
      }
    }
  }
}
