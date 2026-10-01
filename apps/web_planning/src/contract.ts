import { FILE_FORMAT, FILE_COMPATIBILITY, fileManifest, historyFiles, type FileEntry } from "./files";
import { normalizeInitialProjectWorkDefinitionV01 } from "../../../lib/intake/work-definition";
import { buildSelectedWorkSourceEntry, normalizeSelectedWorkSources, selectedWorkSourceInput } from "../../../lib/intake/selected-work-source-comparison";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash, parseStrictIsoTimestampV01 } from "../../../lib/vnext/protocol-primitives";
import type { ProjectWorkDefinitionV01 } from "../../../types/vnext/project-work-initialization";
import type { TaskContextPacketSelectedEntryV01 } from "../../../types/vnext/task-context-packet";
export { canonical, hash, selectedWorkSourceInput };
export const FORMAT = "web_planning_revision.v0.1";
export const EXPORT_FORMAT = "web_planning_export.v0.1";
export const COMPATIBILITY = "web-planning/1";
export const RELATION_FORMAT = "web_planning_revision.v0.2";
export const RELATION_EXPORT_FORMAT = "web_planning_export.v0.2";
export const RELATION_COMPATIBILITY = "web-planning/2";
export const MAX_REVISIONS = 32;
export const RELATION_BYTES = 12_000;
export const REQUEST_BYTES = 1_500_000;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const FINGERPRINT = /^sha256:[0-9a-f]{64}$/;
export interface Scope { workspace_id: string; project_id: string; author_ref: string }
export interface Binding { revision: number; fingerprint: string | null }
export interface WorkRef { work_id: string; revision: number; fingerprint: string }
export interface MaterialRef extends WorkRef { source_ref: string }
export interface Material {
  source_ref: string; kind: "authored" | "inherited" | "incorporated" | "adapted";
  from: MaterialRef | null; dependencies: string[];
}
export interface Disposition { source_ref: string; disposition: "incorporated" | "not_selected" | "deferred" | "declined"; rationale: string }
export interface ComparisonReview { source: WorkRef; target: WorkRef; dispositions: Disposition[]; rationale: string; next_question: string }
export interface Relations {
  origin: { source: WorkRef; reason: string; selection: string[]; starting_review: ComparisonReview | null } | null;
  materials: Material[];
  review: ComparisonReview | null;
}
export interface Payload { definition: ProjectWorkDefinitionV01; sources: TaskContextPacketSelectedEntryV01[]; relations?: Relations; files?: FileEntry[] }
export interface Revision extends Scope, Payload {
  format: typeof FORMAT | typeof RELATION_FORMAT | typeof FILE_FORMAT; schema: 1; compatibility: typeof COMPATIBILITY | typeof RELATION_COMPATIBILITY | typeof FILE_COMPATIBILITY;
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
export function boundedText(value: unknown, required = false): string {
  if (typeof value !== "string" || [...value].length > 500 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value) || (required && !value.trim())) fail("invalid_relation_text");
  return value.trim();
}
export function workRef(value: unknown): WorkRef {
  exact(value, "work_id,revision,fingerprint");
  if (!UUID.test(value.work_id) || !Number.isInteger(value.revision) || value.revision < 1 || value.revision > MAX_REVISIONS || !FINGERPRINT.test(value.fingerprint)) fail("invalid_source_binding");
  return value as unknown as WorkRef;
}
export function reference(r: Revision): WorkRef { return {work_id:r.work_id,revision:r.revision,fingerprint:r.fingerprint}; }
export function dispositions(value: unknown): Disposition[] {
  if (!Array.isArray(value) || value.length > 8) fail("invalid_dispositions");
  const seen=new Set();
  return value.map(row=>{
    exact(row,"source_ref,disposition,rationale");
    if (!FINGERPRINT.test(row.source_ref) || seen.has(row.source_ref) || !["incorporated","not_selected","deferred","declined"].includes(row.disposition)) fail("invalid_dispositions");
    seen.add(row.source_ref);
    return {source_ref:row.source_ref,disposition:row.disposition,rationale:boundedText(row.rationale,["deferred","declined"].includes(row.disposition))} as Disposition;
  }).sort((a,b)=>a.source_ref.localeCompare(b.source_ref));
}
export function validateRelations(value: unknown, payload: Payload, id: string): Relations {
  const result = inspectRelations(value, payload, id);
  if (result.bytes > RELATION_BYTES) fail("relation_budget_exceeded");
  return result.relations;
}
export function inspectRelations(value: unknown, payload: Payload, id: string) {
  exact(value,"origin,materials,review");
  const refs=payload.sources.map(s=>s.source_ref);
  if (value.origin !== null) {
    exact(value.origin,"source,reason,selection,starting_review"); workRef(value.origin.source);
    if (value.origin.source.work_id===id || boundedText(value.origin.reason,true)!==value.origin.reason || !Array.isArray(value.origin.selection) || value.origin.selection.length>8 || value.origin.selection.some((s:unknown)=>typeof s!=="string" || !FINGERPRINT.test(s)) || new Set(value.origin.selection).size!==value.origin.selection.length) fail("invalid_branch_origin");
    if(value.origin.starting_review!==null) validateReview(value.origin.starting_review);
  }
  if (!Array.isArray(value.materials) || value.materials.length!==refs.length) fail("invalid_materials");
  const seen=new Set();
  for (const m of value.materials) {
    exact(m,"source_ref,kind,from,dependencies");
    if (!refs.includes(m.source_ref) || seen.has(m.source_ref) || !["authored","inherited","incorporated","adapted"].includes(m.kind)) fail("invalid_materials");
    seen.add(m.source_ref);
    if (m.kind==="authored" ? m.from!==null : m.from===null) fail("invalid_material_origin");
    if (m.from!==null) { exact(m.from,"work_id,revision,fingerprint,source_ref"); const {source_ref,...ref}=m.from; workRef(ref); if(!FINGERPRINT.test(source_ref))fail("invalid_source_binding"); }
    if (!Array.isArray(m.dependencies) || m.dependencies.length>7 || new Set(m.dependencies).size!==m.dependencies.length || m.dependencies.some((s:string)=>s===m.source_ref || !refs.includes(s))) fail("required_material_missing");
    if (m.kind==="adapted" && payload.sources.find(s=>s.source_ref===m.source_ref)?.trust_class!=="derived_interpretation") fail("adaptation_requires_interpretation");
  }
  if (value.review!==null) {
    validateReview(value.review);
    if (value.review.source.work_id===id || value.review.target.work_id!==id) fail("invalid_review");
  }
  return {relations:value as unknown as Relations,bytes:new TextEncoder().encode(canonical(value)).byteLength};
}
function validateReview(value:unknown) {
  exact(value,"source,target,dispositions,rationale,next_question");workRef(value.source);workRef(value.target);
  if(canonical(dispositions(value.dispositions))!==canonical(value.dispositions) || boundedText(value.rationale,true)!==value.rationale || boundedText(value.next_question)!==value.next_question)fail("invalid_review");
}
function scopeMaterial(s: Scope): Scope { return {workspace_id:s.workspace_id,project_id:s.project_id,author_ref:s.author_ref}; }
export function requestFingerprint(scope: Scope, work_id: string, expected: Binding, request_key: string, payload: Payload): string {
  return hash(canonical({ ...scopeMaterial(scope), work_id, expected, request_key, ...payload }));
}
export function makeRevision(scope: Scope, work_id: string, expected: Binding, request_key: string, payload: Payload, recorded_at: string): Revision {
  if (payload.files!==undefined) fileManifest(payload.files);
  if (payload.relations) validateRelations(payload.relations,payload,work_id);
  const material = { ...scopeMaterial(scope), format: payload.files!==undefined ? FILE_FORMAT : payload.relations ? RELATION_FORMAT : FORMAT, schema: 1, compatibility: payload.files!==undefined ? FILE_COMPATIBILITY : payload.relations ? RELATION_COMPATIBILITY : COMPATIBILITY,
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
    const filed=(value as Revision)?.format===FILE_FORMAT;
    const relational=(value as Revision)?.format===RELATION_FORMAT || (filed && "relations" in (value as Revision));
    if ((value as Revision)?.format!==FORMAT && !relational && !filed) fail("incompatible_format",409);
    exact(value, "workspace_id,project_id,author_ref,format,schema,compatibility,work_id,revision,predecessor,definition,sources,recorded_at,request_key,request_fingerprint,fingerprint"+(relational?",relations":"")+(filed?",files":""));
    if (value.schema !== 1 || value.compatibility !== (filed?FILE_COMPATIBILITY:relational?RELATION_COMPATIBILITY:COMPATIBILITY)) fail("incompatible_format", 409);
    if (value.workspace_id !== scope.workspace_id || value.project_id !== scope.project_id || value.author_ref !== scope.author_ref || value.work_id !== work_id ||
      !UUID.test(value.request_key) || keys.has(value.request_key) || parseStrictIsoTimestampV01(value.recorded_at) === null ||
      new Date(value.recorded_at).toISOString() !== value.recorded_at || !Array.isArray(value.sources)) fail("invalid_history", 503);
    const payload = normalizePayload(scope, value.definition, value.sources.map(selectedWorkSourceInput));
    if (relational) payload.relations=validateRelations(value.relations,payload,work_id);
    if (filed) payload.files=fileManifest(value.files);
    const prior=revisions.at(-1);
    if (prior?.files!==undefined && !filed) fail("file_format_downgrade",409);
    if (prior?.relations && (!payload.relations || canonical(prior.relations.origin)!==canonical(payload.relations.origin))) fail("branch_origin_changed",409);
    if (!prior?.relations && prior && payload.relations?.origin) fail("branch_origin_changed",409);
    const rebuilt = makeRevision(scope, work_id, headBinding(revisions.at(-1)), value.request_key, payload, value.recorded_at);
    if (canonical(rebuilt) !== canonical(value)) fail("history_integrity", 409);
    revisions.push(rebuilt); keys.add(value.request_key);
  }
  historyFiles(revisions);
  return revisions;
}
export function exportWork(revisions: Revision[]) {
  if(revisions.some(r=>r.files!==undefined))fail("file_export_required",409);
  const relational=revisions.some(r=>r.relations);
  const content = { format: relational?RELATION_EXPORT_FORMAT:EXPORT_FORMAT, schema: 1, compatibility: relational?RELATION_COMPATIBILITY:COMPATIBILITY, revisions };
  return { ...content, fingerprint: hash(canonical(content)) };
}
export function validateExport(scope: Scope, value: unknown): Revision[] {
  exact(value, "format,schema,compatibility,revisions,fingerprint");
  const relational=value.format===RELATION_EXPORT_FORMAT;
  if ((!relational && value.format!==EXPORT_FORMAT) || value.schema !== 1 || value.compatibility !== (relational?RELATION_COMPATIBILITY:COMPATIBILITY)) fail("incompatible_format", 409);
  if (!Array.isArray(value.revisions) || !value.revisions.length) fail("invalid_export");
  const { fingerprint, ...content } = value;
  if (hash(canonical(content)) !== fingerprint) fail("export_integrity", 409);
  const chain=validateChain(scope, value.revisions[0]?.work_id, value.revisions);
  if(canonical(exportWork(chain))!==canonical(value))fail("incompatible_format",409);
  return chain;
}
