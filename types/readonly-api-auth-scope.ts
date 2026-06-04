/**
 * Read-only API auth/scope adapter boundary v0.1.
 *
 * Boundary phrases: type-only; not runtime schema; not auth implementation;
 * not production auth; not hosted auth; not OAuth; not session identity
 * implementation; not workspace membership implementation; not route behavior
 * change; not consumer authority; not proof/evidence write authority; not DB
 * query authority; not source-of-truth.
 * Boundary phrases: not session identity implementation; not route behavior change.
 * Boundary phrases: not DB query authority.
 *
 * These types define vocabulary for a future fail-closed auth/scope adapter.
 * They do not validate requests, query records, create sessions, resolve
 * membership, call providers, or change route behavior.
 */

export type ReadonlyApiAuthScopeSourceKindV0 =
  | "local_guard_only"
  | "augnes_local_session_candidate"
  | "local_operator_session_candidate"
  | "chatgpt_app_mcp_context_candidate"
  | "local_development_auth_adapter_candidate"
  | "future_external_auth_candidate";

export type ReadonlyApiAuthScopeErrorCodeV0 =
  | "missing_identity"
  | "invalid_identity"
  | "missing_session"
  | "invalid_session"
  | "missing_workspace"
  | "unauthorized_workspace"
  | "missing_project"
  | "unauthorized_project"
  | "missing_scope"
  | "ambiguous_scope"
  | "stale_scope"
  | "cross_workspace_scope"
  | "unavailable_auth_source"
  | "malformed_request"
  | "method_not_allowed"
  | "local_guard_failed"
  | "forbidden_field_detected";

export type ReadonlyApiAuthScopeForbiddenFieldV0 =
  | "secrets"
  | "credentials/auth/env"
  | "raw DB rows"
  | "raw private user text"
  | "hidden reasoning / chain-of-thought"
  | "proof/evidence write handles"
  | "mutation URLs"
  | "approval/publish/merge controls"
  | "Codex SDK execution handles"
  | "provider credentials"
  | "session secrets"
  | "OAuth tokens"
  | "workspace private membership graph";

export type ReadonlyApiAuthScopeAdapterAuthorityBoundaryV0 = {
  type_only: true;
  runtime_schema: false;
  auth_implementation: false;
  production_auth: false;
  hosted_auth: false;
  oauth: false;
  session_identity_implementation: false;
  workspace_membership_implementation: false;
  route_behavior_change: false;
  consumer_authority: false;
  proof_evidence_write_authority: false;
  db_query_authority: false;
  source_of_truth: false;
  notes: readonly string[];
};

export type ReadonlyApiAuthScopeIdentityRefV0 = {
  identity_ref: string;
  identity_source_kind: ReadonlyApiAuthScopeSourceKindV0;
  identity_proof_label: string;
  raw_identity_payload_returned: false;
};

export type ReadonlyApiAuthScopeWorkspaceRefV0 = {
  workspace_ref: string;
  workspace_source_kind: ReadonlyApiAuthScopeSourceKindV0;
  membership_proof_label: string;
  raw_membership_graph_returned: false;
};

export type ReadonlyApiAuthScopeProjectRefV0 = {
  project_ref: string;
  project_scope: string;
  project_source_kind: ReadonlyApiAuthScopeSourceKindV0;
  membership_proof_label: string;
  raw_project_payload_returned: false;
};

export type ReadonlyApiAuthScopeRequestV0 = {
  route_id: string;
  route_family: string;
  requested_scope: string | null;
  requested_project: string | null;
  requested_workspace: string | null;
  request_method: "GET" | string;
  local_guard_result_ref?: string;
  source_kind: ReadonlyApiAuthScopeSourceKindV0;
};

export type ReadonlyApiAuthScopeSuccessV0 = {
  ok: true;
  route_id: string;
  route_family: string;
  identity_ref: ReadonlyApiAuthScopeIdentityRefV0;
  workspace_ref: ReadonlyApiAuthScopeWorkspaceRefV0;
  project_ref: ReadonlyApiAuthScopeProjectRefV0;
  authorized_scope: string;
  source_kind: ReadonlyApiAuthScopeSourceKindV0;
  local_guard_composed: boolean;
  authority_boundary: ReadonlyApiAuthScopeAdapterAuthorityBoundaryV0;
  forbidden_fields_removed: readonly ReadonlyApiAuthScopeForbiddenFieldV0[];
};

export type ReadonlyApiAuthScopeFailureV0 = {
  ok: false;
  code: ReadonlyApiAuthScopeErrorCodeV0;
  status: 400 | 401 | 403 | 405 | 500 | 503;
  safe_error_label: string;
  authority_boundary: ReadonlyApiAuthScopeAdapterAuthorityBoundaryV0;
  forbidden_fields_removed: readonly ReadonlyApiAuthScopeForbiddenFieldV0[];
};

export type ReadonlyApiAuthScopeDecisionV0 =
  | ReadonlyApiAuthScopeSuccessV0
  | ReadonlyApiAuthScopeFailureV0;

export type ReadonlyApiAuthScopeAdapterBoundaryV0 = {
  boundary_version: "readonly_api_auth_scope_adapter_boundary.v0.1";
  candidate_route: "GET /api/augnes/read/constellation-preview";
  route_family: "project_constellation" | string;
  default_scope: "project:augnes" | string;
  source_kinds: readonly ReadonlyApiAuthScopeSourceKindV0[];
  forbidden_fields: readonly ReadonlyApiAuthScopeForbiddenFieldV0[];
  authority_boundary: ReadonlyApiAuthScopeAdapterAuthorityBoundaryV0;
};
