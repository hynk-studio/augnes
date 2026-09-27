import { normalizeInitialProjectWorkDefinitionV01 } from "../../../lib/intake/work-definition";
import { buildSelectedWorkSourceEntry, normalizeSelectedWorkSources, selectedWorkSourceInput } from "../../../lib/intake/selected-work-source-comparison";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash, parseStrictIsoTimestampV01 } from "../../../lib/vnext/protocol-primitives";
import type { ProjectWorkDefinitionV01 } from "../../../types/vnext/project-work-initialization";
import type { TaskContextPacketSelectedEntryV01 } from "../../../types/vnext/task-context-packet";
export { canonical, hash, selectedWorkSourceInput };
export const FORMAT = "web_planning_revision.v0.1";
export const EXPORT_FORMAT = "web_planning_export.v0.1";
export const COMPATIBILITY = "web-planning/1";
export const MAX_REVISIONS = 32;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const FINGERPRINT = /^sha256:[0-9a-f]{64}$/;
export interface Scope { workspace_id: string; project_id: string; author_ref: string }
export interface Binding { revision: number; fingerprint: string | null }
export interface Payload { definition: ProjectWorkDefinitionV01; sources: TaskContextPacketSelectedEntryV01[] }
export interface Revision extends Scope, Payload {
  format: typeof FORMAT; schema: 1; compatibility: typeof COMPATIBILITY;
  work_id: string; revision: number; predecessor: string | null;
  recorded_at: string; request_key: string; request_fingerprint: string; fingerprint: string;
}
export class Refusal extends Error {
  constructor(readonly code: string, readonly status = 422) { super(code); }
}
export function fail(code: string, status = 422): never { throw new Refusal(code, status); }
export function exact(value: unknown, keys: string): asserts value is Record<string, any> {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join(",") !== keys.split(",").sort().join(",")) fail("invalid_fields");
}
export function binding(value: unknown): Binding {
  exact(value, "revision,fingerprint");
  if (!Number.isInteger(value.revision) || value.revision < 0 || value.revision > MAX_REVISIONS ||
    (value.revision === 0 ? value.fingerprint !== null : !FINGERPRINT.test(value.fingerprint))) fail("invalid_binding");
  return value as unknown as Binding;
}
export function normalizePayload(scope: Scope, definition: unknown, notes: unknown): Payload {
  exact(definition, "goal,success_criteria,non_goals");
  if (!Array.isArray(notes) || notes.length > 8) fail("whole_note_limit");
  try {
    return { definition: normalizeInitialProjectWorkDefinitionV01(definition as any),
      sources: normalizeSelectedWorkSources(scope, notes.map(note => buildSelectedWorkSourceEntry(scope, note))) };
  } catch (error) {
    // Only bounded validation codes cross the HTTP boundary, never raw errors.
    const code = (error as { code?: string }).code;
    fail(code && /^[a-z_]+$/.test(code) ? code : "invalid_planning_material");
  }
}
function scopeMaterial(s: Scope): Scope { return {workspace_id:s.workspace_id,project_id:s.project_id,author_ref:s.author_ref}; }
export function requestFingerprint(scope: Scope, work_id: string, expected: Binding, request_key: string, payload: Payload): string {
  return hash(canonical({ ...scopeMaterial(scope), work_id, expected, request_key, ...payload }));
}
export function makeRevision(scope: Scope, work_id: string, expected: Binding, request_key: string, payload: Payload, recorded_at: string): Revision {
  const material = { ...scopeMaterial(scope), format: FORMAT, schema: 1, compatibility: COMPATIBILITY,
    work_id, revision: expected.revision + 1, predecessor: expected.fingerprint, ...payload,
    recorded_at, request_key, request_fingerprint: requestFingerprint(scope, work_id, expected, request_key, payload) };
  return { ...material, fingerprint: hash(canonical(material)) } as Revision;
}
export function headBinding(revision?: Revision): Binding {
  return revision ? { revision: revision.revision, fingerprint: revision.fingerprint } : { revision: 0, fingerprint: null };
}
export function sameBinding(a: Binding, b: Binding): boolean { return canonical(a) === canonical(b); }
export function validateChain(scope: Scope, work_id: string, values: unknown[]): Revision[] {
  if (!UUID.test(work_id) || !values.length || values.length > MAX_REVISIONS) fail("invalid_history", 503);
  const revisions: Revision[] = []; const keys = new Set();
  for (const value of values) {
    exact(value, "workspace_id,project_id,author_ref,format,schema,compatibility,work_id,revision,predecessor,definition,sources,recorded_at,request_key,request_fingerprint,fingerprint");
    if (value.format !== FORMAT || value.schema !== 1 || value.compatibility !== COMPATIBILITY) fail("incompatible_format", 409);
    if (value.workspace_id !== scope.workspace_id || value.project_id !== scope.project_id || value.author_ref !== scope.author_ref || value.work_id !== work_id ||
      !UUID.test(value.request_key) || keys.has(value.request_key) || parseStrictIsoTimestampV01(value.recorded_at) === null ||
      new Date(value.recorded_at).toISOString() !== value.recorded_at || !Array.isArray(value.sources)) fail("invalid_history", 503);
    const payload = normalizePayload(scope, value.definition, value.sources.map(selectedWorkSourceInput));
    const rebuilt = makeRevision(scope, work_id, headBinding(revisions.at(-1)), value.request_key, payload, value.recorded_at);
    if (canonical(rebuilt) !== canonical(value)) fail("history_integrity", 409);
    revisions.push(rebuilt); keys.add(value.request_key);
  }
  return revisions;
}
export function exportWork(revisions: Revision[]) {
  const content = { format: EXPORT_FORMAT, schema: 1, compatibility: COMPATIBILITY, revisions };
  return { ...content, fingerprint: hash(canonical(content)) };
}
export function validateExport(scope: Scope, value: unknown): Revision[] {
  exact(value, "format,schema,compatibility,revisions,fingerprint");
  if (value.format !== EXPORT_FORMAT || value.schema !== 1 || value.compatibility !== COMPATIBILITY) fail("incompatible_format", 409);
  if (!Array.isArray(value.revisions) || !value.revisions.length) fail("invalid_export");
  const { fingerprint, ...content } = value;
  if (hash(canonical(content)) !== fingerprint) fail("export_integrity", 409);
  return validateChain(scope, value.revisions[0]?.work_id, value.revisions);
}
