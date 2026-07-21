import type Database from "better-sqlite3";

import {
  buildConservativeProjectAutomationPolicyV01,
  buildProjectAutomationPolicySummaryV01,
  validateProjectAutomationPolicyV01,
} from "@/lib/vnext/project-controls/project-controls";
import {
  readCanonicalProjectIdentityV01,
  readDefaultWorkspaceIdentityV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import {
  canonicalizeProtocolValueV01,
  parseStrictIsoTimestampV01,
} from "@/lib/vnext/protocol-primitives";
import {
  PERSONAL_PERSPECTIVE_EFFECTIVE_SCOPE_VERSION_V01,
  PERSONAL_PERSPECTIVE_PROJECT_SCOPE_VERSION_V01,
  PROJECT_AUTOMATION_CONTROL_VERSION_V01,
  PROJECT_AUTOMATION_EFFECTIVE_STATUS_VERSION_V01,
  PROJECT_AUTOMATION_POLICY_VERSION_V01,
  PROJECT_CONTROL_MUTATION_RESULT_VERSION_V01,
  type PersonalPerspectiveEffectiveScopeV01,
  type PersonalPerspectiveProjectScopeV01,
  type ProjectAutomationControlActionV01,
  type ProjectAutomationControlV01,
  type ProjectAutomationEffectiveStatusV01,
  type ProjectControlActionV01,
  type ProjectControlMutationResultV01,
  type PersonalPerspectiveScopeActionV01,
} from "@/types/vnext/project-controls";

export const VNEXT_PROJECT_CONTROL_STORE_VERSION_V01 =
  "vnext_project_control_store.v0.1" as const;

export const VNEXT_PROJECT_CONTROL_SCHEMA_SQL_V01 = `
  CREATE TABLE IF NOT EXISTS vnext_project_automation_controls (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    control_version TEXT NOT NULL CHECK (
      control_version = 'project_automation_control.v0.1'
    ),
    enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
    paused INTEGER NOT NULL CHECK (paused IN (0, 1)),
    policy_version TEXT NOT NULL CHECK (
      policy_version = 'project_automation_policy.v0.1'
    ),
    policy_json TEXT NOT NULL CHECK (
      json_valid(policy_json) AND json_type(policy_json) = 'object'
    ),
    revision INTEGER NOT NULL CHECK (revision > 0),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT,
    CHECK (paused = 0 OR enabled = 1)
  );

  CREATE TABLE IF NOT EXISTS vnext_project_personal_perspective_scopes (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    scope_version TEXT NOT NULL CHECK (
      scope_version = 'personal_perspective_project_scope.v0.1'
    ),
    selection TEXT NOT NULL CHECK (selection IN ('included', 'excluded')),
    revision INTEGER NOT NULL CHECK (revision > 0),
    created_at TEXT NOT NULL CHECK (length(trim(created_at)) > 0),
    updated_at TEXT NOT NULL CHECK (length(trim(updated_at)) > 0),
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id, project_id)
      REFERENCES vnext_project_identities(workspace_id, project_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT
  );
`;

export type ProjectControlStoreErrorCodeV01 =
  | "project_control_request_invalid"
  | "project_control_project_not_found"
  | "project_control_scope_conflict"
  | "active_project_conflict"
  | "automation_revision_conflict"
  | "personal_perspective_revision_conflict"
  | "automation_transition_invalid"
  | "personal_perspective_transition_invalid"
  | "automation_policy_invalid"
  | "project_control_record_invalid";

export class ProjectControlStoreErrorV01 extends Error {
  constructor(readonly code: ProjectControlStoreErrorCodeV01) {
    super(code);
    this.name = "ProjectControlStoreErrorV01";
  }
}

export interface ProjectControlMutationInputV01 {
  workspace_id: string;
  project_id: string;
  action: ProjectControlActionV01;
  expected_active_project_id: string;
  expected_active_selection_revision: number;
  expected_control_revision: number | null;
}

export interface ProjectControlStoreDependenciesV01 {
  now?: () => string;
}

type AutomationControlRowV01 = {
  workspace_id: string;
  project_id: string;
  control_version: string;
  enabled: number;
  paused: number;
  policy_version: string;
  policy_json: string;
  revision: number;
  created_at: string;
  updated_at: string;
};

type PersonalPerspectiveScopeRowV01 = {
  workspace_id: string;
  project_id: string;
  scope_version: string;
  selection: string;
  revision: number;
  created_at: string;
  updated_at: string;
};

export function ensureVNextProjectControlSchemaV01(
  db: Database.Database,
): void {
  db.pragma("foreign_keys = ON");
  db.exec(VNEXT_PROJECT_CONTROL_SCHEMA_SQL_V01);
}

export function assertVNextProjectControlSchemaV01(
  db: Database.Database,
): void {
  for (const table of [
    "vnext_project_automation_controls",
    "vnext_project_personal_perspective_scopes",
  ]) {
    if (
      !db
        .prepare(
          "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?",
        )
        .get(table)
    ) {
      throw new Error(`vnext_project_control_schema_missing:${table}`);
    }
  }
}

export function readProjectAutomationControlV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): ProjectAutomationControlV01 | null {
  requireCanonicalProject(db, input);
  const row = selectAutomationRow(db, input);
  return row ? parseAutomationControlRow(row) : null;
}

export function readProjectAutomationEffectiveStatusV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): ProjectAutomationEffectiveStatusV01 {
  const control = readProjectAutomationControlV01(db, input);
  if (!control) {
    return {
      effective_status_version:
        PROJECT_AUTOMATION_EFFECTIVE_STATUS_VERSION_V01,
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      status: "not_configured",
      configured: false,
      control_revision: null,
      created_at: null,
      updated_at: null,
      policy_summary: buildProjectAutomationPolicySummaryV01(),
      policy_triggered_work_allowed_at_control_layer: false,
      blocked_reasons: [
        "Project automation has not been explicitly configured.",
      ],
    };
  }
  const status = control.paused
    ? "paused"
    : control.enabled
      ? "enabled"
      : "disabled";
  return {
    effective_status_version:
      PROJECT_AUTOMATION_EFFECTIVE_STATUS_VERSION_V01,
    workspace_id: control.workspace_id,
    project_id: control.project_id,
    status,
    configured: true,
    control_revision: control.revision,
    created_at: control.created_at,
    updated_at: control.updated_at,
    policy_summary: buildProjectAutomationPolicySummaryV01(),
    policy_triggered_work_allowed_at_control_layer: status === "enabled",
    blocked_reasons:
      status === "disabled"
        ? ["Project automation is explicitly disabled."]
        : status === "paused"
          ? ["New policy-triggered work is paused for this project."]
          : [],
  };
}

export function readPersonalPerspectiveProjectScopeV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): PersonalPerspectiveProjectScopeV01 | null {
  requireCanonicalProject(db, input);
  const row = selectPersonalPerspectiveRow(db, input);
  return row ? parsePersonalPerspectiveScopeRow(row) : null;
}

export function readPersonalPerspectiveEffectiveScopeV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): PersonalPerspectiveEffectiveScopeV01 {
  const scope = readPersonalPerspectiveProjectScopeV01(db, input);
  if (!scope) {
    return {
      effective_scope_version:
        PERSONAL_PERSPECTIVE_EFFECTIVE_SCOPE_VERSION_V01,
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      status: "not_configured",
      configured: false,
      effectively_included: false,
      scope_revision: null,
      created_at: null,
      updated_at: null,
      effective_context_behavior: "excluded_fail_closed",
      explanation:
        "No project-specific choice has been made. Personal Perspective is excluded by default.",
    };
  }
  const included = scope.selection === "included";
  return {
    effective_scope_version:
      PERSONAL_PERSPECTIVE_EFFECTIVE_SCOPE_VERSION_V01,
    workspace_id: scope.workspace_id,
    project_id: scope.project_id,
    status: scope.selection,
    configured: true,
    effectively_included: included,
    scope_revision: scope.revision,
    created_at: scope.created_at,
    updated_at: scope.updated_at,
    effective_context_behavior: included
      ? "eligible_for_normal_context_selection"
      : "excluded_by_explicit_choice",
    explanation: included
      ? "Eligible reviewed Personal Perspective material may enter normal project context selection; review, currentness, trust, scope, and budget checks still apply."
      : "Personal Perspective is explicitly excluded from this project's context selection.",
  };
}

/** Preserve an explicitly consented, already-admitted project sharing scope. */
export function admitPortablePersonalPerspectiveScopeInsideTransactionV01(
  db: Database.Database,
  scope: PersonalPerspectiveProjectScopeV01,
): "inserted" | "exact_replay" {
  if (!db.inTransaction) fail("project_control_scope_conflict");
  requireCanonicalProject(db, scope);
  if (
    scope.scope_version !== PERSONAL_PERSPECTIVE_PROJECT_SCOPE_VERSION_V01 ||
    !["included", "excluded"].includes(scope.selection) ||
    !Number.isSafeInteger(scope.revision) ||
    scope.revision < 1 ||
    parseStrictIsoTimestampV01(scope.created_at) === null ||
    parseStrictIsoTimestampV01(scope.updated_at) === null ||
    Date.parse(scope.updated_at) < Date.parse(scope.created_at)
  ) {
    fail("personal_perspective_transition_invalid");
  }
  const current = selectPersonalPerspectiveRow(db, scope);
  if (current) {
    const parsed = parsePersonalPerspectiveScopeRow(current);
    if (canonicalizeProtocolValueV01(parsed) !== canonicalizeProtocolValueV01(scope)) {
      fail("personal_perspective_revision_conflict");
    }
    return "exact_replay";
  }
  db.prepare(
    `INSERT INTO vnext_project_personal_perspective_scopes (
      workspace_id, project_id, scope_version, selection,
      revision, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    scope.workspace_id,
    scope.project_id,
    scope.scope_version,
    scope.selection,
    scope.revision,
    scope.created_at,
    scope.updated_at,
  );
  return "inserted";
}

export function mutateProjectControlV01(
  db: Database.Database,
  input: ProjectControlMutationInputV01,
  dependencies: ProjectControlStoreDependenciesV01 = {},
): ProjectControlMutationResultV01 {
  validateMutationInput(input);
  return runImmediate(db, () => {
    requireCanonicalProject(db, input);
    requireActiveProjectSnapshot(db, input);
    if (isAutomationAction(input.action)) {
      return mutateAutomationControl(
        db,
        { ...input, action: input.action },
        dependencies,
      );
    }
    return mutatePersonalPerspectiveScope(
      db,
      { ...input, action: input.action },
      dependencies,
    );
  });
}

function mutateAutomationControl(
  db: Database.Database,
  input: ProjectControlMutationInputV01 & {
    action: ProjectAutomationControlActionV01;
  },
  dependencies: ProjectControlStoreDependenciesV01,
): ProjectControlMutationResultV01 {
  const currentRow = selectAutomationRow(db, input);
  const current = currentRow ? parseAutomationControlRow(currentRow) : null;
  if ((current?.revision ?? null) !== input.expected_control_revision) {
    fail("automation_revision_conflict");
  }
  const next = nextAutomationState(current, input.action);
  const now = strictNow(dependencies);
  const policy = buildConservativeProjectAutomationPolicyV01(input);
  const policyJson = canonicalizeProtocolValueV01(policy);

  if (!current) {
    db.prepare(
      `INSERT INTO vnext_project_automation_controls (
        workspace_id, project_id, control_version, enabled, paused,
        policy_version, policy_json, revision, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    ).run(
      input.workspace_id,
      input.project_id,
      PROJECT_AUTOMATION_CONTROL_VERSION_V01,
      next.enabled ? 1 : 0,
      next.paused ? 1 : 0,
      PROJECT_AUTOMATION_POLICY_VERSION_V01,
      policyJson,
      now,
      now,
    );
  } else {
    const write = db.prepare(
      `UPDATE vnext_project_automation_controls
       SET enabled = ?, paused = ?, policy_version = ?, policy_json = ?,
           revision = revision + 1, updated_at = ?
       WHERE workspace_id = ? AND project_id = ? AND revision = ?`,
    ).run(
      next.enabled ? 1 : 0,
      next.paused ? 1 : 0,
      PROJECT_AUTOMATION_POLICY_VERSION_V01,
      policyJson,
      now,
      input.workspace_id,
      input.project_id,
      current.revision,
    );
    if (write.changes !== 1) fail("automation_revision_conflict");
  }
  return {
    mutation_result_version: PROJECT_CONTROL_MUTATION_RESULT_VERSION_V01,
    action: input.action,
    automation: readProjectAutomationEffectiveStatusV01(db, input),
    personal_perspective: null,
  };
}

function mutatePersonalPerspectiveScope(
  db: Database.Database,
  input: ProjectControlMutationInputV01 & {
    action: PersonalPerspectiveScopeActionV01;
  },
  dependencies: ProjectControlStoreDependenciesV01,
): ProjectControlMutationResultV01 {
  const currentRow = selectPersonalPerspectiveRow(db, input);
  const current = currentRow
    ? parsePersonalPerspectiveScopeRow(currentRow)
    : null;
  if ((current?.revision ?? null) !== input.expected_control_revision) {
    fail("personal_perspective_revision_conflict");
  }
  const selection = nextPersonalPerspectiveSelection(current, input.action);
  const now = strictNow(dependencies);
  if (!current) {
    db.prepare(
      `INSERT INTO vnext_project_personal_perspective_scopes (
        workspace_id, project_id, scope_version, selection,
        revision, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 1, ?, ?)`,
    ).run(
      input.workspace_id,
      input.project_id,
      PERSONAL_PERSPECTIVE_PROJECT_SCOPE_VERSION_V01,
      selection,
      now,
      now,
    );
  } else {
    const write = db.prepare(
      `UPDATE vnext_project_personal_perspective_scopes
       SET selection = ?, revision = revision + 1, updated_at = ?
       WHERE workspace_id = ? AND project_id = ? AND revision = ?`,
    ).run(
      selection,
      now,
      input.workspace_id,
      input.project_id,
      current.revision,
    );
    if (write.changes !== 1) {
      fail("personal_perspective_revision_conflict");
    }
  }
  return {
    mutation_result_version: PROJECT_CONTROL_MUTATION_RESULT_VERSION_V01,
    action: input.action,
    automation: null,
    personal_perspective: readPersonalPerspectiveEffectiveScopeV01(db, input),
  };
}

function nextAutomationState(
  current: ProjectAutomationControlV01 | null,
  action: ProjectAutomationControlActionV01,
): { enabled: boolean; paused: boolean } {
  if (!current) {
    if (action === "enable_automation") {
      return { enabled: true, paused: false };
    }
    fail("automation_transition_invalid");
  }
  const status = current.paused
    ? "paused"
    : current.enabled
      ? "enabled"
      : "disabled";
  if (status === "disabled" && action === "enable_automation") {
    return { enabled: true, paused: false };
  }
  if (status === "enabled" && action === "disable_automation") {
    return { enabled: false, paused: false };
  }
  if (status === "enabled" && action === "pause_automation") {
    return { enabled: true, paused: true };
  }
  if (status === "paused" && action === "resume_automation") {
    return { enabled: true, paused: false };
  }
  if (status === "paused" && action === "disable_automation") {
    return { enabled: false, paused: false };
  }
  fail("automation_transition_invalid");
}

function nextPersonalPerspectiveSelection(
  current: PersonalPerspectiveProjectScopeV01 | null,
  action: PersonalPerspectiveScopeActionV01,
): "included" | "excluded" {
  const requested =
    action === "include_personal_perspective" ? "included" : "excluded";
  if (!current || current.selection !== requested) return requested;
  fail("personal_perspective_transition_invalid");
}

function parseAutomationControlRow(
  row: AutomationControlRowV01,
): ProjectAutomationControlV01 {
  let policy: unknown;
  try {
    policy = JSON.parse(row.policy_json);
  } catch {
    fail("automation_policy_invalid");
  }
  const policyValidation = validateProjectAutomationPolicyV01(policy, row);
  if (!policyValidation.valid) fail("automation_policy_invalid");
  if (
    row.control_version !== PROJECT_AUTOMATION_CONTROL_VERSION_V01 ||
    row.policy_version !== PROJECT_AUTOMATION_POLICY_VERSION_V01 ||
    ![0, 1].includes(row.enabled) ||
    ![0, 1].includes(row.paused) ||
    (row.paused === 1 && row.enabled !== 1) ||
    !Number.isSafeInteger(row.revision) ||
    row.revision <= 0 ||
    parseStrictIsoTimestampV01(row.created_at) === null ||
    parseStrictIsoTimestampV01(row.updated_at) === null
  ) {
    fail("project_control_record_invalid");
  }
  return {
    control_version: PROJECT_AUTOMATION_CONTROL_VERSION_V01,
    workspace_id: row.workspace_id,
    project_id: row.project_id,
    enabled: row.enabled === 1,
    paused: row.paused === 1,
    policy: policy as ProjectAutomationControlV01["policy"],
    revision: row.revision,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function parsePersonalPerspectiveScopeRow(
  row: PersonalPerspectiveScopeRowV01,
): PersonalPerspectiveProjectScopeV01 {
  if (
    row.scope_version !== PERSONAL_PERSPECTIVE_PROJECT_SCOPE_VERSION_V01 ||
    !["included", "excluded"].includes(row.selection) ||
    !Number.isSafeInteger(row.revision) ||
    row.revision <= 0 ||
    parseStrictIsoTimestampV01(row.created_at) === null ||
    parseStrictIsoTimestampV01(row.updated_at) === null
  ) {
    fail("project_control_record_invalid");
  }
  return {
    scope_version: PERSONAL_PERSPECTIVE_PROJECT_SCOPE_VERSION_V01,
    workspace_id: row.workspace_id,
    project_id: row.project_id,
    selection: row.selection as "included" | "excluded",
    revision: row.revision,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function selectAutomationRow(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): AutomationControlRowV01 | null {
  return (
    (db
      .prepare(
        `SELECT * FROM vnext_project_automation_controls
         WHERE workspace_id = ? AND project_id = ?`,
      )
      .get(input.workspace_id, input.project_id) as
      | AutomationControlRowV01
      | undefined) ?? null
  );
}

function selectPersonalPerspectiveRow(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): PersonalPerspectiveScopeRowV01 | null {
  return (
    (db
      .prepare(
        `SELECT * FROM vnext_project_personal_perspective_scopes
         WHERE workspace_id = ? AND project_id = ?`,
      )
      .get(input.workspace_id, input.project_id) as
      | PersonalPerspectiveScopeRowV01
      | undefined) ?? null
  );
}

function requireCanonicalProject(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): void {
  const workspace = readDefaultWorkspaceIdentityV01(db);
  if (!workspace || workspace.workspace_id !== input.workspace_id) {
    fail("project_control_scope_conflict");
  }
  let project;
  try {
    project = readCanonicalProjectIdentityV01(db, input);
  } catch {
    fail("project_control_project_not_found");
  }
  if (!project) fail("project_control_project_not_found");
}

function requireActiveProjectSnapshot(
  db: Database.Database,
  input: ProjectControlMutationInputV01,
): void {
  const active = readActiveProjectSelectionV01(db, input.workspace_id);
  if (
    input.expected_active_project_id !== input.project_id ||
    active?.project_id !== input.expected_active_project_id ||
    active.selection_revision !== input.expected_active_selection_revision
  ) {
    fail("active_project_conflict");
  }
}

function validateMutationInput(input: ProjectControlMutationInputV01): void {
  if (
    typeof input.workspace_id !== "string" ||
    typeof input.project_id !== "string" ||
    typeof input.expected_active_project_id !== "string" ||
    !Number.isSafeInteger(input.expected_active_selection_revision) ||
    input.expected_active_selection_revision <= 0 ||
    !(
      input.expected_control_revision === null ||
      (Number.isSafeInteger(input.expected_control_revision) &&
        input.expected_control_revision > 0)
    ) ||
    ![
      "enable_automation",
      "disable_automation",
      "pause_automation",
      "resume_automation",
      "include_personal_perspective",
      "exclude_personal_perspective",
    ].includes(input.action)
  ) {
    fail("project_control_request_invalid");
  }
}

function strictNow(dependencies: ProjectControlStoreDependenciesV01): string {
  const value = (dependencies.now ?? (() => new Date().toISOString()))();
  if (parseStrictIsoTimestampV01(value) === null) {
    fail("project_control_request_invalid");
  }
  return value;
}

function isAutomationAction(
  action: ProjectControlActionV01,
): action is ProjectAutomationControlActionV01 {
  return [
    "enable_automation",
    "disable_automation",
    "pause_automation",
    "resume_automation",
  ].includes(action);
}

function runImmediate<T>(db: Database.Database, operation: () => T): T {
  return db.inTransaction ? operation() : db.transaction(operation).immediate();
}

function fail(code: ProjectControlStoreErrorCodeV01): never {
  throw new ProjectControlStoreErrorV01(code);
}
