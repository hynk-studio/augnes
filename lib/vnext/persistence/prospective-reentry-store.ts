import type Database from "better-sqlite3";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../protocol-primitives";
import type { ProspectiveJudgment } from "../prospective-agenda";

export interface ReentryScope { workspace_id: string; project_id: string; agenda_ref: string }
export interface ReentryState extends ReentryScope {
  host_fingerprint: string; phase: "armed" | "claimed" | "settled" | "stopped"; revision: number;
  packet_id: string; packet_fingerprint: string; work_id: string; work_fingerprint: string; control_revision: number;
  next_wake_at: string | null; event_key: string | null; event_refs: string[];
  receipt_id: string | null; receipt_fingerprint: string | null;
  history: Array<{ at: string; reason: string; judgment: ProspectiveJudgment }>;
}

export function readReentry(db: Database.Database, scope: ReentryScope): ReentryState | null {
  const row = db.prepare("SELECT * FROM vnext_prospective_reentry WHERE workspace_id=? AND project_id=? AND agenda_ref=?")
    .get(scope.workspace_id, scope.project_id, scope.agenda_ref) as Record<string, unknown> | undefined;
  if (!row) return null;
  if (row.recovery_suspended !== 0) throw new Error("prospective_recovery_suspended");
  const value = JSON.parse(row.body_json as string) as ReentryState;
  if (hash(canonical(value)) !== row.fingerprint || ["workspace_id", "project_id", "agenda_ref", "host_fingerprint", "phase", "revision"].some(k => row[k] !== value[k as keyof ReentryState])) throw new Error("prospective_store_binding_invalid");
  return value;
}

/** CAS is inside the caller's IMMEDIATE transaction, shared with admission. */
export function writeReentry(db: Database.Database, state: ReentryState, priorRevision: number | null) {
  if (!db.inTransaction || state.revision !== (priorRevision ?? 0) + 1 || state.history.length > 24 || state.event_refs.length > 8) throw new Error("prospective_write_bound");
  const body = canonical(state), fingerprint = hash(body);
  if (priorRevision === null) {
    db.prepare("INSERT INTO vnext_prospective_reentry (workspace_id,project_id,agenda_ref,host_fingerprint,phase,revision,body_json,fingerprint) VALUES (?,?,?,?,?,?,?,?)")
      .run(state.workspace_id, state.project_id, state.agenda_ref, state.host_fingerprint, state.phase, state.revision, body, fingerprint);
  } else {
    const changed = db.prepare("UPDATE vnext_prospective_reentry SET phase=?,revision=?,body_json=?,fingerprint=? WHERE workspace_id=? AND project_id=? AND agenda_ref=? AND revision=?")
      .run(state.phase, state.revision, body, fingerprint, state.workspace_id, state.project_id, state.agenda_ref, priorRevision).changes;
    if (changed !== 1) throw new Error("prospective_revision_conflict");
  }
}
