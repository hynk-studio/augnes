export const DIRECTION_VERSION = "project_direction.v0.1";
export type DirectionContent = { purpose: string; criteria: string[]; constraints: string[] };
export type DirectionPrincipal = { kind: "human" | "agent"; id: string };
export type DirectionParent = {
  project_id: string; direction_ref: string; delegation_ref: string;
  why: string; contribution: string; return_question: string;
};
export type DirectionCreation = {
  grant_ref: string; slot: number; project_id: string; created_at: string;
  root: string; root_identity: string;
};
export type DirectionDecision = {
  version: typeof DIRECTION_VERSION; kind: "decision"; workspace_id: string; project_id: string; at: string;
  revision: number; previous: string | null; created_by: DirectionPrincipal | null;
  principal: DirectionPrincipal; authority_ref: string | null; parent: DirectionParent | null;
  content: DirectionContent; status: "active" | "paused"; reason: string; proposal_ref: string | null;
  /** Older draft rows remain readable; missing agent origin is not recovery proof. */
  creation?: DirectionCreation | null;
};
export type DirectionGrant = {
  version: typeof DIRECTION_VERSION; kind: "grant"; workspace_id: string; project_id: string; at: string;
  principal: DirectionPrincipal; issuer: DirectionPrincipal; expires_at: string;
  allowed_directions: DirectionContent[];
  // Explicit creation slots share one total mutation budget; no execution rights.
  creation_slots: Array<{ root: string; root_identity: string; display_name: string; parent: Omit<DirectionParent, "delegation_ref"> | null }>;
  continuations: Array<{ project_id: string; expected_ref: string; parent: Omit<DirectionParent, "delegation_ref"> | null }>;
  project_ids: string[]; max_mutations: number; execution_authority: false;
};
export type DirectionProposal = {
  version: typeof DIRECTION_VERSION; kind: "proposal" | "return"; workspace_id: string; project_id: string; at: string;
  principal: DirectionPrincipal; authority_ref: string; basis_ref: string | null;
  content: DirectionContent; reason: string;
  child_result: { project_id: string; direction_ref: string; receipt_id: string | null; receipt_fingerprint: string | null } | null;
};
export type DirectionBinding = {
  version: typeof DIRECTION_VERSION; kind: "binding"; workspace_id: string; project_id: string; at: string;
  packet_id: string; packet_fingerprint: string; direction_ref: string;
  basis?: "selected_direction";
};
export type PacketDirectionInterpretation = {
  status: "unconfigured" | "current" | "historical";
  direction_ref: string | null; effective_ref: string | null;
};
export type DirectionRevocation = {
  version: typeof DIRECTION_VERSION; kind: "revocation"; workspace_id: string; project_id: string; at: string;
  grant_ref: string; principal: DirectionPrincipal; reason: string;
};
export type DirectionRecord = DirectionDecision | DirectionGrant | DirectionProposal | DirectionBinding | DirectionRevocation;
export type DirectionEntry<T extends DirectionRecord = DirectionRecord> = { ref: string; value: T };
export type DirectionView = {
  effective: DirectionEntry<DirectionDecision> | null;
  history: DirectionEntry<DirectionDecision>[];
  proposals: DirectionEntry<DirectionProposal>[];
  grants: Array<{ record: DirectionEntry<DirectionGrant>; available: boolean; projects: Array<{ project_id: string; display_name: string; direction_ref: string }> }>;
  parent_current: boolean; authority_current: boolean;
  pending_work: Array<{ packet_id: string; direction_ref: string | null; interpretation: PacketDirectionInterpretation["status"]; admitted: boolean; needs_reconsideration: boolean }>;
  accepted_goal_relationship: "working_direction_only_review_accepted_goals_separately";
  execution_authority_granted: false;
};

// Small shared input primitives; no provider SDK or new schema dependency.
export function directionObject(value: unknown, fields: string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).sort().join() !== [...fields].sort().join()) throw new Error("project_direction_input_invalid");
  return value as Record<string, unknown>;
}
export function directionText(value: unknown, max = 600): string {
  if (typeof value !== "string" || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/u.test(value)) throw new Error("project_direction_input_invalid");
  return value.trim();
}
export function directionRef(value: unknown): string {
  if (typeof value !== "string" || !/^sha256:[a-f0-9]{64}$/u.test(value)) throw new Error("project_direction_input_invalid");
  return value;
}
export function directionTime(value: unknown): string {
  if (typeof value !== "string" || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/u.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString() !== value) throw new Error("project_direction_input_invalid");
  return value;
}
export function directionInteger(value: unknown, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < min || value > max) throw new Error("project_direction_input_invalid");
  return value;
}
export function directionArray(value: unknown, min: number, max: number): unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) throw new Error("project_direction_input_invalid");
  return value;
}
export function parseDirectionContent(value: unknown): DirectionContent {
  const input = directionObject(value, ["purpose", "criteria", "constraints"]);
  return { purpose: directionText(input.purpose), criteria: directionArray(input.criteria, 0, 4).map(v => directionText(v)), constraints: directionArray(input.constraints, 0, 4).map(v => directionText(v)) };
}
export function parseDirectionPrincipal(value: unknown): DirectionPrincipal {
  const p = directionObject(value, ["kind", "id"]);
  if (p.kind !== "human" && p.kind !== "agent") throw new Error("project_direction_input_invalid");
  const id = directionText(p.id, 256);
  if (p.kind === "agent" && !/^role:[a-z][a-z0-9_-]{1,63}$/u.test(id)) throw new Error("project_direction_input_invalid");
  return { kind: p.kind, id };
}
