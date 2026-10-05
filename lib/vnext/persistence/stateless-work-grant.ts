import type Database from "better-sqlite3";
import { insertVNextCoreRecordV01, readVNextCoreRecordV01 } from "./durable-semantic-store";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../protocol-primitives";
import { readSourceReview, readStatelessSelectedNotes, reviewRef, reviewCheck as check, validateStatelessGrant, statelessGrantKey, STATELESS_GRANT, type StatelessGrant, type StatelessGrantRequest } from "../stateless-work";
import { buildModelInvocationCapabilityGrantV01 } from "../automation/model-invocation-capability-grant";
import { validateTaskContextPacketV01 } from "../task-context-packet";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

export function readStatelessGrant(db: Database.Database, scope: { workspace_id: string; project_id: string; grant_id: string; grant_fingerprint: string }) {
  const record = readVNextCoreRecordV01(db, { ...scope, record_kind: "capability_grant", record_id: scope.grant_id });
  check(record && record.fingerprint === scope.grant_fingerprint && validateStatelessGrant(record.payload), "grant_invalid");
  const grant = record.payload;
  check(grant.workspace_id === scope.workspace_id && grant.project_id === scope.project_id && grant.grant_id === record.record_id &&
    grant.grant_fingerprint === record.fingerprint && record.created_at === grant.issued_at && record.idempotency_key === statelessGrantKey(grant.request, grant.approved_by), "grant_binding");
  const source = readVNextCoreRecordV01(db, { ...scope, record_kind: "task_context_packet", record_id: grant.request.packet_id });
  check(source && source.fingerprint === grant.request.packet_fingerprint, "grant_packet_missing");
  const packet = source.payload as TaskContextPacketV01;
  check(validateTaskContextPacketV01(packet, { evaluated_at: grant.issued_at }).status === "valid" && packet.integrity.fingerprint === source.fingerprint &&
    packet.packet_id === source.record_id && packet.workspace_id === scope.workspace_id && packet.project_id === scope.project_id &&
    packet.capability_grant === null && reviewRef(readSourceReview(packet)) === grant.request.review_ref &&
    (grant.request.selected_notes_ref === undefined || grant.request.selected_notes_ref === readStatelessSelectedNotes(packet).fingerprint) &&
    (!packet.expires_at || grant.request.expires_at <= packet.expires_at), "grant_source_conflict");
  return grant;
}

/** Derive invocation lineage from the validated immutable record for execution
 * and historical readback alike. This neither renews nor authorizes the grant. */
export function buildStatelessModelInvocationGrant(grant: StatelessGrant, input: { work_id: string; run_id: string; stage: string }) {
  const { limits } = grant.request;
  return buildModelInvocationCapabilityGrantV01({ grant_id: `${grant.grant_id}.${input.stage}`, workspace_id: grant.workspace_id, project_id: grant.project_id,
    work_id: input.work_id, run_id: input.run_id, automation_control_revision: grant.request.control_revision, permitted_purposes: ["planner_plan"], permitted_execution_modes: ["live"], provider_egress_allowed: true,
    max_provider_calls: 1, max_input_bytes: limits.input_bytes, max_output_tokens: limits.output_tokens, max_timeout_ms: limits.invocation_ms,
    allowed_data_classifications: ["private"], issued_at: grant.issued_at, expires_at: grant.request.expires_at, status: "active", capability_status: "available" });
}

/** Only the authenticated issuer calls this inside its immediate transaction. */
export function insertStatelessGrant(db: Database.Database, request: StatelessGrantRequest, operator: string, at: string) {
  check(db.inTransaction, "grant_transaction_required");
  const key = statelessGrantKey(request, operator), id = `stateless-grant:${key.slice(7, 31)}`;
  const prior = readVNextCoreRecordV01(db, { ...request, record_kind: "capability_grant", record_id: id });
  if (prior) return readStatelessGrant(db, { ...request, grant_id: id, grant_fingerprint: prior.fingerprint });
  const material = { grant_version: STATELESS_GRANT, workspace_id: request.workspace_id, project_id: request.project_id, approved_by: operator, issued_at: at, request };
  const grant = { ...material, grant_id: id, grant_fingerprint: hash(canonical(material)) };
  check(validateStatelessGrant(grant), "grant_invalid");
  insertVNextCoreRecordV01(db, { record_kind: "capability_grant", record_id: id, workspace_id: request.workspace_id, project_id: request.project_id,
    fingerprint: grant.grant_fingerprint, idempotency_key: key, payload: grant, created_at: at });
  return grant;
}
