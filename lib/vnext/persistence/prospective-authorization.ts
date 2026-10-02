import type Database from "better-sqlite3";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash, parseStrictIsoTimestampV01 } from "../protocol-primitives";
import { readAgendaInput, SELECTED_SOURCE_INSPECTION } from "../prospective-agenda";
import { readSelectedWorkSources } from "@/lib/intake/selected-work-source-comparison";
import { insertVNextCoreRecordV01, readVNextCoreRecordV01 } from "./durable-semantic-store";
import type { TaskContextPacketBoundedCapabilitySummaryV01, TaskContextPacketV01 } from "@/types/vnext/task-context-packet";
import { validateTaskContextPacketV01 } from "../task-context-packet";

export const PROSPECTIVE_AUTHORIZATION = "prospective_inspection_authorization.v0.1";
export const PROSPECTIVE_AUTHORIZATION_BUDGET = Object.freeze({
  max_work_items: 1, max_active_runs: 1, max_attempts: 1, max_runtime_ms: 10_000,
  max_files: 2, max_bytes: 65_536, max_commands: 0, model_calls: 0, network_access: "denied",
});
export interface ProspectiveAuthorizationRequest {
  workspace_id: string; project_id: string; agenda_ref: string;
  packet_id: string; packet_fingerprint: string; work_profile: typeof SELECTED_SOURCE_INSPECTION;
  host_fingerprint: string; root_fingerprint: string; control_revision: number;
  expires_at: string; budget: typeof PROSPECTIVE_AUTHORIZATION_BUDGET;
}
export interface ProspectiveAuthorization {
  grant_version: typeof PROSPECTIVE_AUTHORIZATION; grant_id: string; grant_fingerprint: string;
  workspace_id: string; project_id: string; request: ProspectiveAuthorizationRequest;
  approved_by: string; issued_at: string; expires_at: string;
}
export type ProspectiveAuthorizationRef = { grant_id: string; grant_fingerprint: string };
const sha = (value: unknown): value is string => typeof value === "string" && /^sha256:[a-f0-9]{64}$/u.test(value);
const text = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length <= 160;
const exact = (value: unknown, keys: string[]): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join() === keys.sort().join();
export function validProspectiveAuthorizationRequest(value: unknown): value is ProspectiveAuthorizationRequest {
  return exact(value, ["workspace_id", "project_id", "agenda_ref", "packet_id", "packet_fingerprint", "work_profile", "host_fingerprint", "root_fingerprint", "control_revision", "expires_at", "budget"]) &&
    text(value.workspace_id) && text(value.project_id) && text(value.packet_id) && sha(value.agenda_ref) && sha(value.packet_fingerprint) &&
    sha(value.host_fingerprint) && sha(value.root_fingerprint) && value.work_profile === SELECTED_SOURCE_INSPECTION &&
    Number.isSafeInteger(value.control_revision) && Number(value.control_revision) > 0 && typeof value.expires_at === "string" && parseStrictIsoTimestampV01(value.expires_at) !== null &&
    canonical(value.budget) === canonical(PROSPECTIVE_AUTHORIZATION_BUDGET);
}
export function prospectiveAuthorizationKey(request: ProspectiveAuthorizationRequest, operator: string) {
  return hash(canonical({ purpose: PROSPECTIVE_AUTHORIZATION, request, approved_by: operator }));
}
export function validateProspectiveAuthorization(value: unknown): value is ProspectiveAuthorization {
  if (!exact(value, ["grant_version", "grant_id", "grant_fingerprint", "workspace_id", "project_id", "request", "approved_by", "issued_at", "expires_at"]) ||
    value.grant_version !== PROSPECTIVE_AUTHORIZATION || !validProspectiveAuthorizationRequest(value.request) || !text(value.approved_by) ||
    value.workspace_id !== value.request.workspace_id || value.project_id !== value.request.project_id || value.expires_at !== value.request.expires_at ||
    typeof value.issued_at !== "string" || parseStrictIsoTimestampV01(value.issued_at) === null || Date.parse(value.issued_at) >= Date.parse(value.request.expires_at) ||
    Date.parse(value.request.expires_at) - Date.parse(value.issued_at) > 3_600_000) return false;
  const { grant_id, grant_fingerprint, ...material } = value;
  return grant_id === `prospective-grant:${prospectiveAuthorizationKey(value.request, value.approved_by).slice(7, 31)}` && grant_fingerprint === hash(canonical(material));
}

/** Called only after authenticated mutation admission in the caller's transaction.
 * Existing Core CapabilityGrant persistence owns authority; no packet is rewritten. */
export function admitProspectiveAuthorization(db: Database.Database, request: ProspectiveAuthorizationRequest, operator: string, at: string) {
  if (!db.inTransaction) throw new Error("prospective_authorization_transaction_required");
  const idempotencyKey = prospectiveAuthorizationKey(request, operator);
  const grantId = `prospective-grant:${idempotencyKey.slice(7, 31)}`;
  const prior = readVNextCoreRecordV01(db, { ...request, record_kind: "capability_grant", record_id: grantId });
  if (prior) return readProspectiveAuthorization(db, { ...request, grant_id: grantId, grant_fingerprint: prior.fingerprint });
  const material = { grant_version: PROSPECTIVE_AUTHORIZATION, workspace_id: request.workspace_id, project_id: request.project_id,
    request, approved_by: operator, issued_at: at, expires_at: request.expires_at };
  const grant = { ...material, grant_id: grantId, grant_fingerprint: hash(canonical(material)) };
  if (!validateProspectiveAuthorization(grant)) throw new Error("prospective_authorization_invalid");
  insertVNextCoreRecordV01(db, { record_kind: "capability_grant", record_id: grant.grant_id, workspace_id: grant.workspace_id,
    project_id: grant.project_id, fingerprint: grant.grant_fingerprint, idempotency_key: idempotencyKey, payload: grant, created_at: at });
  return grant;
}
export function readProspectiveAuthorization(db: Database.Database, input: ProspectiveAuthorizationRef & { workspace_id: string; project_id: string }): ProspectiveAuthorization {
  const record = readVNextCoreRecordV01(db, { ...input, record_kind: "capability_grant", record_id: input.grant_id });
  if (!record || record.fingerprint !== input.grant_fingerprint || !validateProspectiveAuthorization(record.payload) ||
    record.payload.grant_id !== record.record_id || record.payload.grant_fingerprint !== record.fingerprint || record.created_at !== record.payload.issued_at ||
    record.payload.workspace_id !== input.workspace_id || record.payload.project_id !== input.project_id ||
    record.idempotency_key !== prospectiveAuthorizationKey(record.payload.request, record.payload.approved_by)) throw new Error("prospective_authorization_binding_invalid");
  const grant = record.payload;
  const packetRecord = readVNextCoreRecordV01(db, { ...input, record_kind: "task_context_packet", record_id: grant.request.packet_id });
  if (!packetRecord || packetRecord.fingerprint !== grant.request.packet_fingerprint) throw new Error("prospective_authorization_source_missing");
  const packet = packetRecord.payload as TaskContextPacketV01;
  if (packet.packet_id !== grant.request.packet_id || packet.integrity.fingerprint !== grant.request.packet_fingerprint ||
    packet.workspace_id !== input.workspace_id || packet.project_id !== input.project_id ||
    validateTaskContextPacketV01(packet, { evaluated_at: grant.issued_at }).status !== "valid") throw new Error("prospective_authorization_source_conflict");
  const agenda = readAgendaInput(readSelectedWorkSources(packet), grant.issued_at);
  if (packet.capability_grant !== null || !agenda || agenda.source_ref !== grant.request.agenda_ref ||
    Date.parse(grant.expires_at) > Date.parse(agenda.agenda.premise_until) || packet.expires_at && Date.parse(grant.expires_at) > Date.parse(packet.expires_at)) throw new Error("prospective_authorization_source_conflict");
  return grant;
}
export function prospectiveAuthorizationSummary(grant: ProspectiveAuthorization): TaskContextPacketBoundedCapabilitySummaryV01 {
  return { grant_ref: grant.grant_id, grant_external_ref: { ref_version: "external_ref.v0.1", ref_type: "capability_grant",
    external_id: grant.grant_id, source_ref: grant.grant_fingerprint, observed_at: grant.issued_at,
    compatibility_namespace: PROSPECTIVE_AUTHORIZATION, trust_class: "direct_local_observation" },
  allowed_capabilities: ["project_scoped_structured_task_round_trip.v0.1"],
  forbidden_capabilities: ["authority_expansion", "credential_access", "deploy", "external_post", "merge", "model_invocation", "network_access", "publish", "semantic_commit"],
  resource_scope: [grant.project_id, `project_root:${grant.request.root_fingerprint}`].sort(),
  stop_conditions: ["budget_exhausted", "cancellation_requested", "review_needed", "timeout"], coverage: "enforced", expires_at: grant.expires_at };
}
