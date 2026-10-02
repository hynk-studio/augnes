import type Database from "better-sqlite3";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { realpathSync, statSync } from "node:fs";
import { canonicalizeProtocolValueV01 as canonical, createProtocolSha256V01 as hash } from "../protocol-primitives";
import { DIRECTION_VERSION, parseDirectionContent, directionObject, directionRef, directionText, directionInteger, directionArray, type DirectionDecision, type DirectionEntry, type DirectionGrant, type DirectionPrincipal, type DirectionParent } from "../project-direction";
import { appendDirectionRecord, directionCheck as check, directionCurrent, effectiveDirection, findDirectionGrant, grantAvailable, readDirectionRecord, readDirectionRecords, readProjectDirection, type DirectionScope } from "../persistence/project-direction-store";
import { getOrCreateCanonicalProjectForLocalRootV01, normalizeLocalProjectRootRefV01, readCanonicalProjectIdentityV01 } from "../persistence/project-identity-registry";
import { readVNextCoreRecordV01 } from "../persistence/durable-semantic-store";
import { admitVNextLocalOperatorMutationInsideTransactionV01, type VNextLocalOperatorPilotConfigV01, type VNextLocalOperatorSessionCredentialV01 } from "./local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "./local-runtime-clock";

type DecideRequest = { action: "decide"; expected_ref: string | null; content: DirectionDecision["content"]; reason: string; status: "active" | "paused"; proposal_ref: string | null };
function parseDecision(value: unknown): DecideRequest {
  const r = directionObject(value, ["action", "expected_ref", "content", "reason", "status", "proposal_ref"]);
  check(r.action === "decide" && ["active", "paused"].includes(String(r.status)), "request_invalid");
  return { action: "decide", expected_ref: r.expected_ref === null ? null : directionRef(r.expected_ref),
    content: parseDirectionContent(r.content), reason: directionText(r.reason), status: r.status as "active" | "paused", proposal_ref: r.proposal_ref === null ? null : directionRef(r.proposal_ref) };
}
function parseGrant(value: unknown) {
  const r = directionObject(value, ["action", "role", "allowed_directions", "max_mutations", "expires_in_minutes", "creation_slots"]);
  const role = directionText(r.role, 69);
  check(r.action === "authorize_agent" && /^role:[a-z][a-z0-9_-]{1,63}$/u.test(role), "role_invalid");
  return { role, allowed_directions: directionArray(r.allowed_directions, 1, 4).map(parseDirectionContent),
    max_mutations: directionInteger(r.max_mutations, 1, 20), expires_in_minutes: directionInteger(r.expires_in_minutes, 1, 60),
    creation_slots: directionArray(r.creation_slots, 0, 2).map(value => {
      const slot = directionObject(value, ["root", "display_name", "delegation"]);
      const d = slot.delegation === null ? null : directionObject(slot.delegation, ["expected_parent_ref", "why", "contribution", "return_question"]);
      return { root: directionText(slot.root, 8192), display_name: directionText(slot.display_name, 240), delegation: d ? {
        expected_parent_ref: directionRef(d.expected_parent_ref), why: directionText(d.why), contribution: directionText(d.contribution), return_question: directionText(d.return_question) } : null };
    }) };
}
function rootIdentity(root: string) {
  const stat = statSync(root, { bigint: true });
  check(stat.isDirectory(), "creation_root_unavailable");
  return hash(canonical({ root, device: String(stat.dev), inode: String(stat.ino) }));
}
export type DirectionAgentAccess = { grant: DirectionEntry<DirectionGrant>; sequence: number };

function base(scope: DirectionScope, at: string) { return { version: DIRECTION_VERSION as typeof DIRECTION_VERSION, workspace_id: scope.workspace_id, project_id: scope.project_id, at }; }
function saveDecision(db: Database.Database, scope: DirectionScope, request: DecideRequest, actor: DirectionPrincipal,
  at: string, authority: DirectionEntry<DirectionGrant> | null, parent: DirectionParent | null = null) {
  const previous = effectiveDirection(db, scope, at);
  check(previous?.ref === request.expected_ref || !previous && request.expected_ref === null, "stale_revision");
  check(!previous || previous.value.at < at, "decision_time_conflict");
  const principal = previous?.value.principal ?? actor;
  check(canonical(principal) === canonical(actor), "decision_principal_required", 403);
  if (authority) {
    check(authority.value.allowed_directions.some(value => canonical(value) === canonical(request.content)), "outside_delegation_propose_instead", 403);
  }
  if (previous && !authority?.value.continuations.some(c => c.project_id === scope.project_id && c.expected_ref === previous.ref)) parent = previous.value.parent;
  if (parent) {
    const p = effectiveDirection(db, { ...scope, project_id: parent.project_id }, at);
    check(p?.ref === parent.direction_ref && p.value.status === "active", "parent_changed");
    const inherited = directionCurrent(db, p, at);
    check(inherited.parent_current && inherited.authority_current, "parent_authority_changed");
    check(parent.project_id !== scope.project_id, "parent_cycle");
  }
  if (request.proposal_ref) {
    const proposal = readDirectionRecord(db, scope, request.proposal_ref);
    check(proposal.value.kind === "proposal" && proposal.value.basis_ref === request.expected_ref && canonical(proposal.value.content) === canonical(request.content), "proposal_changed");
  }
  return appendDirectionRecord(db, { ...base(scope, at), kind: "decision", revision: (previous?.value.revision ?? 0) + 1,
    previous: previous?.ref ?? null, created_by: previous ? previous.value.created_by : authority ? actor : null, principal, authority_ref: authority?.ref ?? null,
    parent, content: request.content, status: request.status, reason: request.reason, proposal_ref: request.proposal_ref } satisfies DirectionDecision);
}

/** The ordinary local session authorizes only its project and explicit creation
 * slots. It cannot impersonate an agent or edit an agent's effective direction. */
export function mutateHumanDirection(db: Database.Database, input: {
  config: VNextLocalOperatorPilotConfigV01; credential: VNextLocalOperatorSessionCredentialV01; request: unknown; clock?: VNextLocalRuntimeClockV01;
}) {
  check(!db.inTransaction, "transaction_conflict");
  db.exec("BEGIN IMMEDIATE");
  try {
    const admission = admitVNextLocalOperatorMutationInsideTransactionV01(db, input);
    const at = admission.action_observed_at, scope = { workspace_id: input.config.workspace_id, project_id: input.config.project_id };
    check(readCanonicalProjectIdentityV01(db, scope), "project_missing");
    const actor: DirectionPrincipal = { kind: "human", id: input.config.operator_id };
    const action = (input.request as { action?: unknown })?.action;
    let credential: string | undefined;
    let record;
    if (action === "decide") record = saveDecision(db, scope, parseDecision(input.request), actor, at, null);
    else if (action === "authorize_agent") {
      const request = parseGrant(input.request);
      const current = effectiveDirection(db, scope, at);
      check(!current || current.value.principal.kind === "human" && current.value.principal.id === actor.id, "human_policy_authority_required", 403);
      const slots = request.creation_slots.map(slot => {
        const root = realpathSync(slot.root);
        check(statSync(root).isDirectory(), "creation_root_unavailable");
        if (slot.delegation) check(current && current.ref === slot.delegation.expected_parent_ref && current.value.status === "active", "parent_changed");
        return { root, root_identity: rootIdentity(root), display_name: slot.display_name, parent: slot.delegation ? {
          project_id: scope.project_id, direction_ref: slot.delegation.expected_parent_ref,
          why: slot.delegation.why, contribution: slot.delegation.contribution, return_question: slot.delegation.return_question,
        } : null };
      });
      check(new Set(slots.map(s => s.root)).size === slots.length, "duplicate_creation_root");
      record = appendDirectionRecord(db, { ...base(scope, at), kind: "grant", principal: { kind: "agent", id: request.role }, issuer: actor,
        expires_at: new Date(Date.parse(at) + request.expires_in_minutes * 60_000).toISOString(), allowed_directions: request.allowed_directions,
        creation_slots: slots, continuations: [], project_ids: [scope.project_id], max_mutations: request.max_mutations, execution_authority: false } satisfies DirectionGrant);
      credential = `augnes-direction.${randomBytes(32).toString("base64url")}`;
      db.prepare("INSERT INTO vnext_project_direction_credentials(grant_ref,token_hash) VALUES (?,?)").run(record.ref, hash(credential));
    } else if (action === "renew_agent") {
      const raw = directionObject(input.request, ["action", "grant_ref", "projects", "expires_in_minutes", "max_mutations"]);
      const old = findDirectionGrant(db, scope.workspace_id, directionRef(raw.grant_ref));
      check(old.value.project_id === scope.project_id && canonical(old.value.issuer) === canonical(actor), "grant_scope_conflict", 403);
      const current = effectiveDirection(db, scope, at);
      check(!current || canonical(current.value.principal) === canonical(actor), "human_policy_authority_required", 403);
      const continuations = directionArray(raw.projects, 1, 2).map(value => {
        const p = directionObject(value, ["project_id", "expected_ref"]);
        const projectId = directionText(p.project_id, 256), expected = directionRef(p.expected_ref);
        const d = effectiveDirection(db, { ...scope, project_id: projectId }, at);
        check(d?.ref === expected && d.value.authority_ref === old.ref && canonical(d.value.principal) === canonical(old.value.principal), "renewal_source_changed");
        check(!d.value.parent || d.value.parent.project_id === scope.project_id && current?.value.status === "active", "parent_changed");
        return { project_id: projectId, expected_ref: expected, parent: d.value.parent && current ? {
          project_id: scope.project_id, direction_ref: current.ref, why: d.value.parent.why,
          contribution: d.value.parent.contribution, return_question: d.value.parent.return_question } : null };
      });
      check(new Set(continuations.map(c => c.project_id)).size === continuations.length, "renewal_duplicate");
      record = appendDirectionRecord(db, { ...old.value, ...base(scope, at),
        expires_at: new Date(Date.parse(at) + directionInteger(raw.expires_in_minutes, 1, 60) * 60_000).toISOString(),
        max_mutations: directionInteger(raw.max_mutations, 1, 20), creation_slots: [], continuations });
      appendDirectionRecord(db, { ...base(scope, at), kind: "revocation", grant_ref: old.ref, principal: actor, reason: "Replaced by explicitly renewed bounded authorization" });
      credential = `augnes-direction.${randomBytes(32).toString("base64url")}`;
      db.prepare("INSERT INTO vnext_project_direction_credentials(grant_ref,token_hash) VALUES (?,?)").run(record.ref, hash(credential));
    } else if (action === "revoke_agent") {
      const raw = directionObject(input.request, ["action", "grant_ref", "reason"]);
      const request = { grant_ref: directionRef(raw.grant_ref), reason: directionText(raw.reason) };
      const grant = findDirectionGrant(db, scope.workspace_id, request.grant_ref);
      check(grant.value.project_id === scope.project_id && canonical(grant.value.issuer) === canonical(actor), "grant_scope_conflict", 403);
      record = appendDirectionRecord(db, { ...base(scope, at), kind: "revocation", grant_ref: grant.ref, principal: actor, reason: request.reason });
    } else check(false, "request_invalid", 400);
    db.exec("COMMIT");
    return { record, ...(credential ? { credential } : {}), state: readProjectDirection(db, scope, at), session_admission: admission };
  } catch (error) { if (db.inTransaction) db.exec("ROLLBACK"); throw error; }
}

export function authenticateDirectionAgent(db: Database.Database, token: string, at: string): DirectionAgentAccess {
  check(/^augnes-direction\.[A-Za-z0-9_-]{43}$/u.test(token), "agent_credential_required", 401);
  const digest = hash(token);
  const row = db.prepare("SELECT c.grant_ref,c.token_hash,c.sequence,r.workspace_id FROM vnext_project_direction_credentials c JOIN vnext_project_direction_records r ON r.ref=c.grant_ref WHERE c.token_hash=?").get(digest) as { grant_ref: string; token_hash: string; sequence: number; workspace_id: string } | undefined;
  check(row && timingSafeEqual(Buffer.from(row.token_hash), Buffer.from(digest)), "agent_credential_invalid", 401);
  const grant = findDirectionGrant(db, row.workspace_id, row.grant_ref);
  check(grantAvailable(db, grant.value, grant.ref, at), "agent_grant_unavailable", 403);
  return { grant, sequence: row.sequence };
}
function agentProject(db: Database.Database, access: DirectionAgentAccess, projectId: string, at: string) {
  const scope = { workspace_id: access.grant.value.workspace_id, project_id: projectId };
  const current = effectiveDirection(db, scope, at);
  const continuation = access.grant.value.continuations.find(c => c.project_id === projectId && c.expected_ref === current?.ref);
  const owned = !!current && (current.value.authority_ref === access.grant.ref || !!continuation) && canonical(current.value.principal) === canonical(access.grant.value.principal);
  check(owned || access.grant.value.project_ids.includes(projectId), "agent_project_scope", 403);
  return { scope, current, owned, continuation };
}
export function readAgentDirection(db: Database.Database, access: DirectionAgentAccess, projectId: string, at: string) {
  const { scope } = agentProject(db, access, projectId, at);
  return readProjectDirection(db, scope, at);
}
export function mutateAgentDirection(db: Database.Database, input: { token: string; request: unknown; at: string }) {
  check(!db.inTransaction, "transaction_conflict");
  db.exec("BEGIN IMMEDIATE");
  try {
    const access = authenticateDirectionAgent(db, input.token, input.at);
    const raw = directionObject(input.request, ["sequence", "project_id", "operation"]);
    check(raw.operation && typeof raw.operation === "object" && !Array.isArray(raw.operation), "request_invalid");
    const envelope = { sequence: directionInteger(raw.sequence, 0, 20), project_id: raw.project_id === null ? null : directionText(raw.project_id, 256), operation: raw.operation as Record<string, unknown> };
    check(envelope.sequence === access.sequence, "agent_replay_or_concurrent_write");
    check(access.sequence < access.grant.value.max_mutations, "agent_mutation_budget_exhausted", 403);
    const { operation } = envelope;
    const actor = access.grant.value.principal;
    let scope: DirectionScope;
    let record;
    if (operation.action === "create_project") {
      const raw = directionObject(operation, ["action", "slot", "content", "reason"]);
      const op = { slot: directionInteger(raw.slot, 0, 1), content: parseDirectionContent(raw.content), reason: directionText(raw.reason) };
      check(envelope.project_id === null, "creation_scope_invalid");
      const slot = access.grant.value.creation_slots[op.slot];
      check(slot && access.grant.value.allowed_directions.some(c => canonical(c) === canonical(op.content)), "creation_not_authorized", 403);
      check(realpathSync(slot.root) === slot.root && rootIdentity(slot.root) === slot.root_identity, "creation_root_changed");
      const result = getOrCreateCanonicalProjectForLocalRootV01(db, { workspace_id: access.grant.value.workspace_id,
        local_root: normalizeLocalProjectRootRefV01(slot.root, { base_path: slot.root }), display_name: slot.display_name }, { now: () => input.at });
      check(result.status === "inserted", "creation_slot_already_used");
      scope = result.project;
      const parent = slot.parent ? { ...slot.parent, delegation_ref: access.grant.ref } : null;
      record = saveDecision(db, scope, { action: "decide", expected_ref: null, content: op.content, reason: op.reason, status: "active", proposal_ref: null }, actor, input.at, access.grant, parent);
    } else {
      check(envelope.project_id, "project_required");
      const selected = agentProject(db, access, envelope.project_id, input.at);
      scope = selected.scope;
      if (operation.action === "decide") {
        check(selected.owned, "decision_principal_required", 403);
        record = saveDecision(db, scope, parseDecision(operation), actor, input.at, access.grant, selected.continuation?.parent ? { ...selected.continuation.parent, delegation_ref: access.grant.ref } : null);
      } else if (operation.action === "propose") {
        const raw = directionObject(operation, ["action", "expected_ref", "content", "reason"]);
        const op = { expected_ref: raw.expected_ref === null ? null : directionRef(raw.expected_ref), content: parseDirectionContent(raw.content), reason: directionText(raw.reason) };
        check((selected.current?.ref ?? null) === op.expected_ref, "stale_revision");
        record = appendDirectionRecord(db, { ...base(scope, input.at), kind: "proposal", principal: actor, authority_ref: access.grant.ref,
          basis_ref: op.expected_ref, content: op.content, reason: op.reason, child_result: null });
      } else if (operation.action === "return_result" || operation.action === "return_proposal") {
        const raw = directionObject(operation, ["action", "expected_ref", "receipt_id", "receipt_fingerprint", "summary"]);
        const op = { expected_ref: directionRef(raw.expected_ref), receipt_id: raw.receipt_id === null ? null : directionText(raw.receipt_id, 256),
          receipt_fingerprint: raw.receipt_fingerprint === null ? null : directionRef(raw.receipt_fingerprint), summary: directionText(raw.summary) };
        check(operation.action === "return_result" ? op.receipt_id && op.receipt_fingerprint : op.receipt_id === null && op.receipt_fingerprint === null, "return_source_invalid");
        const child = selected.current;
        check(child && selected.owned && child.value.authority_ref === access.grant.ref && child.ref === op.expected_ref && child.value.parent, "delegated_child_required", 403);
        if (op.receipt_id) {
          const receipt = readVNextCoreRecordV01(db, { ...scope, record_kind: "run_receipt", record_id: op.receipt_id });
          check(receipt?.fingerprint === op.receipt_fingerprint && receipt.created_at <= input.at, "child_result_source_missing");
        }
        const parentScope = { ...scope, project_id: child.value.parent.project_id };
        record = appendDirectionRecord(db, { ...base(parentScope, input.at), kind: "return", principal: actor, authority_ref: access.grant.ref,
          basis_ref: child.value.parent.direction_ref, content: { purpose: op.summary, criteria: [], constraints: [] }, reason: child.value.parent.return_question,
          child_result: { project_id: scope.project_id, direction_ref: child.ref, receipt_id: op.receipt_id, receipt_fingerprint: op.receipt_fingerprint } });
      } else check(false, "request_invalid", 400);
    }
    db.prepare("UPDATE vnext_project_direction_credentials SET sequence=sequence+1 WHERE grant_ref=? AND sequence=?").run(access.grant.ref, access.sequence);
    db.exec("COMMIT");
    return { record, project_id: scope.project_id, sequence: access.sequence + 1, state: readProjectDirection(db, scope, input.at), execution_authority_granted: false };
  } catch (error) { if (db.inTransaction) db.exec("ROLLBACK"); throw error; }
}
