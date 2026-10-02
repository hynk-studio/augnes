import { assertPacketDirectionCurrent } from "../persistence/project-direction-store";
import { assertAgendaDirectionBinding } from "./project-direction-preparation";
import type Database from "better-sqlite3";
import { hostname } from "node:os";
import { SELECTED_SOURCE_ADAPTER } from "../native-host/selected-source-inspection-adapter";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../protocol-primitives";
import { readAgendaInput, SELECTED_SOURCE_INSPECTION } from "../prospective-agenda";
import { readSelectedWorkSources } from "@/lib/intake/selected-work-source-comparison";
import { readCanonicalProjectWithRootV01 } from "../persistence/project-identity-registry";
import { readActiveProjectSelectionV01 } from "../persistence/project-lifecycle-registry";
import { readProjectAutomationControlV01 } from "../persistence/project-control-store";
import { validateProjectAutomationPolicyV01 } from "../project-controls/project-controls";
import { admitProspectiveAuthorization, readProspectiveAuthorization, PROSPECTIVE_AUTHORIZATION_BUDGET, prospectiveAuthorizationSummary, validProspectiveAuthorizationRequest, type ProspectiveAuthorizationRequest, type ProspectiveAuthorizationRef } from "../persistence/prospective-authorization";
import { inspectVNextOperatorPilotPacketLineageV01, projectVNextOperatorPilotContinuityV01 } from "./operator-pilot-project-continuity";
import { admitVNextLocalOperatorMutationInsideTransactionV01, type VNextLocalOperatorPilotConfigV01, type VNextLocalOperatorSessionCredentialV01 } from "./local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "./local-runtime-clock";
import type { TaskContextPacketV01 } from "@/types/vnext/task-context-packet";

type Scope = Pick<VNextLocalOperatorPilotConfigV01, "workspace_id" | "project_id">;
export function prospectiveHostFingerprint() { return hash(canonical({ host: hostname(), platform: process.platform, architecture: process.arch, adapter: SELECTED_SOURCE_ADAPTER })); }
export function prospectiveRootFingerprint(db: Database.Database, scope: Scope) {
  const registration = readCanonicalProjectWithRootV01(db, scope);
  if (!registration) throw new Error("prospective_project_root_required");
  return hash(canonical({ workspace_id: scope.workspace_id, project_id: scope.project_id,
    local_root: registration.root_binding.local_root, binding_version: registration.root_binding.binding_version, bound_at: registration.root_binding.bound_at }));
}

/** Reconstruct the exact opt-in material; preview is read-only and confers no authority. */
export function prospectiveAuthorizationPreview(db: Database.Database, input: {
  config: VNextLocalOperatorPilotConfigV01; agenda_ref: string; host_fingerprint: string; at: string; expires_at?: string;
}): ProspectiveAuthorizationRequest {
  const { config, at } = input;
  const continuity = projectVNextOperatorPilotContinuityV01(db, { config, clock: { now: () => at } });
  const latest = continuity.latest_compiled_packet;
  if (!latest || continuity.packet_currentness !== "fresh") throw new Error("prospective_current_packet_required");
  const lineage = inspectVNextOperatorPilotPacketLineageV01(db, { config, ...latest });
  const packet = lineage.packet;
  assertPacketDirectionCurrent(db, packet, at);
  assertAgendaDirectionBinding(db, packet, at);
  const agenda = readAgendaInput(readSelectedWorkSources(packet), at);
  const control = readProjectAutomationControlV01(db, config);
  if (!lineage.projection_current || packet.capability_grant !== null || !agenda || agenda.source_ref !== input.agenda_ref ||
    readActiveProjectSelectionV01(db, config.workspace_id)?.project_id !== config.project_id || !control?.enabled || control.paused ||
    !validateProjectAutomationPolicyV01(control.policy, config).valid) throw new Error("prospective_authorization_source_or_policy_changed");
  const expiry = Math.min(Date.parse(at) + 3_600_000, Date.parse(agenda.agenda.premise_until), packet.expires_at ? Date.parse(packet.expires_at) : Infinity);
  const expiresAt = input.expires_at ?? new Date(expiry).toISOString();
  const request = { workspace_id: config.workspace_id, project_id: config.project_id, agenda_ref: agenda.source_ref,
    packet_id: packet.packet_id, packet_fingerprint: packet.integrity.fingerprint, work_profile: SELECTED_SOURCE_INSPECTION,
    host_fingerprint: input.host_fingerprint, root_fingerprint: prospectiveRootFingerprint(db, config), control_revision: control.revision,
    expires_at: expiresAt, budget: PROSPECTIVE_AUTHORIZATION_BUDGET };
  if (!validProspectiveAuthorizationRequest(request) || Date.parse(expiresAt) <= Date.parse(at) || Date.parse(expiresAt) > expiry)
    throw new Error("prospective_authorization_expiry_invalid");
  return request;
}

export function authorizeProspectiveInspection(db: Database.Database, input: {
  config: VNextLocalOperatorPilotConfigV01; credential: VNextLocalOperatorSessionCredentialV01;
  request: unknown; host_fingerprint: string; clock?: VNextLocalRuntimeClockV01;
}) {
  if (!validProspectiveAuthorizationRequest(input.request)) throw new Error("prospective_authorization_request_invalid");
  const request = input.request;
  try {
    db.exec("BEGIN IMMEDIATE");
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, input);
    const expected = prospectiveAuthorizationPreview(db, { ...input, agenda_ref: request.agenda_ref, at: admission.action_observed_at, expires_at: request.expires_at });
    if (canonical(request) !== canonical(expected)) throw new Error("prospective_authorization_source_or_policy_changed");
    const grant = admitProspectiveAuthorization(db, request, input.config.operator_id, admission.action_observed_at);
    db.exec("COMMIT");
    return { grant, session_admission: admission };
  } catch (error) { if (db.inTransaction) db.exec("ROLLBACK"); throw error; }
}

/** Admission rechecks mutable authority; the historical reader deliberately does not. */
export function currentProspectiveAuthorization(db: Database.Database, input: {
  config: Scope; ref: ProspectiveAuthorizationRef; packet: TaskContextPacketV01; host_fingerprint: string; at: string;
}) {
  assertPacketDirectionCurrent(db, input.packet, input.at);
  assertAgendaDirectionBinding(db, input.packet, input.at);
  const grant = readProspectiveAuthorization(db, { ...input.config, ...input.ref });
  const control = readProjectAutomationControlV01(db, input.config);
  if (grant.request.packet_id !== input.packet.packet_id || grant.request.packet_fingerprint !== input.packet.integrity.fingerprint ||
    grant.request.host_fingerprint !== input.host_fingerprint || grant.request.root_fingerprint !== prospectiveRootFingerprint(db, input.config) ||
    readActiveProjectSelectionV01(db, input.config.workspace_id)?.project_id !== input.config.project_id ||
    !control?.enabled || control.paused || control.revision !== grant.request.control_revision ||
    !validateProjectAutomationPolicyV01(control.policy, input.config).valid || Date.parse(grant.issued_at) > Date.parse(input.at) || Date.parse(grant.expires_at) <= Date.parse(input.at))
    throw new Error("prospective_authorization_stale");
  return { grant, summary: prospectiveAuthorizationSummary(grant) };
}
