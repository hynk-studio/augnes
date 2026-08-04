import path from "node:path";
import { statfs } from "node:fs/promises";

import type Database from "better-sqlite3";

import { readLatestManagedLiveAutonomyRunSummaryV01 } from "@/lib/autonomy/runner-ledger";
import { isTerminalRunnerStatus } from "@/lib/autonomy/runner-state";
import {
  canonicalizeProtocolValueV01,
  createProtocolSha256V01,
} from "@/lib/vnext/protocol-primitives";
import {
  readCanonicalProjectWithRootV01,
  rebindCanonicalProjectLocalRootV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import {
  insertPhysicalRootBaselineIfAbsentInsideTransactionV01,
  insertRepositoryExecutionDecisionRequestInsideTransactionV01,
  insertRepositoryExecutionAttachmentInsideTransactionV01,
  pruneRepositoryExecutionDecisionsInsideTransactionV01,
  pruneRepositoryExecutionAttachmentsInsideTransactionV01,
  readPhysicalRootBaselineV01,
  readOpenRepositoryExecutionDecisionV01,
  readPreparedRepositoryExecutionAttachmentV01,
  readRepositoryExecutionDecisionRequestV01,
  readRepositoryExecutionAttachmentByBindingV01,
  readRepositoryExecutionAttachmentV01,
  replacePhysicalRootBaselineExpectedInsideTransactionV01,
  updateRepositoryExecutionDecisionInsideTransactionV01,
  updateRepositoryExecutionAttachmentLifecycleInsideTransactionV01,
} from "@/lib/vnext/persistence/repository-execution-store";
import { readProjectWorkInitializationV01 } from "@/lib/vnext/runtime/project-work-initialization";
import {
  admitVNextRepositoryDecisionConfirmationInsideTransactionV01,
  type VNextLocalOperatorSecretSourceV01,
  type VNextLocalOperatorSessionCredentialV01,
  type VNextLocalOperatorSessionMutationAdmissionV01,
} from "@/lib/vnext/runtime/local-operator-session";
import {
  inspectNativeHostPhysicalRootIdentityV01,
  type ProjectRootIdentityFilesystemV01,
} from "@/lib/vnext/native-host/project-root-identity";
import { inspectRepositoryWorktreeV01 } from "@/lib/vnext/repository-execution/worktree-observation";
import type { LocalProjectRootRefV01, ProjectLocalRootBindingV01 } from "@/types/vnext/project-identity";
import {
  PHYSICAL_ROOT_BASELINE_VERSION_V01,
  PROJECT_EXECUTION_ADMISSION_VERSION_V01,
  REPOSITORY_EXECUTION_ATTACHMENT_VERSION_V01,
  REPOSITORY_EXECUTION_DECISION_REQUEST_VERSION_V01,
  REPOSITORY_EXECUTION_FRESHNESS_POLICY_VERSION_V01,
  type PhysicalRootBaselineV01,
  type PhysicalRootObservationV01,
  type ProjectExecutionAdmissionReasonV01,
  type ProjectExecutionAdmissionV01,
  type RepositoryExecutionAttachmentStaleReasonV01,
  type RepositoryExecutionAttachmentV01,
  type RepositoryExecutionAuthorityBoundaryV01,
  type RepositoryExecutionDecisionActionV01,
  type RepositoryExecutionDecisionRequestProjectionV01,
  type RepositoryExecutionDecisionRequestV01,
  type RepositoryExecutionPreparationV01,
} from "@/types/vnext/repository-execution";

const DEFAULT_ATTACHMENT_MAX_AGE_MS = 30 * 60 * 1_000;
const ATTACHMENT_HISTORY_RETAIN = 16;
const DEFAULT_DECISION_MAX_AGE_MS = 15 * 60 * 1_000;
const DECISION_HISTORY_RETAIN = 16;

export const REPOSITORY_EXECUTION_AUTHORITY_BOUNDARY_V01 = Object.freeze({
  project_files_written: false,
  project_commands_executed: false,
  managed_run_created: false,
  execution_started: false,
  provider_called: false,
  branch_or_commit_created: false,
  github_called: false,
  semantic_authority_granted: false,
  execution_authority_granted: false,
  external_effect_authority_granted: false,
}) satisfies RepositoryExecutionAuthorityBoundaryV01;

export class RepositoryExecutionErrorV01 extends Error {
  constructor(readonly code: string, readonly status = 409) {
    super(code);
    this.name = "RepositoryExecutionErrorV01";
  }
}

export interface RepositoryExecutionDependenciesV01 {
  now?: () => string;
  platform?: NodeJS.Platform;
  physical_identity_filesystem?: ProjectRootIdentityFilesystemV01;
  filesystem_type?: (root: string) => Promise<number | bigint>;
  node_scope_root?: string;
  inspect_worktree?: typeof inspectRepositoryWorktreeV01;
  before_prepare_transaction?: () => void;
  after_prepare_transaction_before_reobserve?: () => void;
  before_onboarding_baseline_insert_inside_transaction?: () => void;
  after_rebind_inside_transaction?: (result: {
    root_binding: ProjectLocalRootBindingV01;
    baseline: PhysicalRootBaselineV01;
  }) => void;
  authorize_decision_inside_transaction?: (input: {
    action: RepositoryExecutionDecisionActionV01;
    workspace_id: string;
    project_id: string;
    request_fingerprint: string;
    expected_state_fingerprint: string;
    now: string;
  }) => { grant_fingerprint: string };
}

export function projectPhysicalRootMutationResultV01(
  result: {
    status: "adopted" | "rebound" | "exact_replay";
    baseline: PhysicalRootBaselineV01;
    authority: RepositoryExecutionAuthorityBoundaryV01;
  },
  ordinaryText: string,
): {
  status: typeof result.status;
  project_id: string;
  baseline_fingerprint: string;
  ordinary_text: string;
  authority: RepositoryExecutionAuthorityBoundaryV01;
} {
  return {
    status: result.status,
    project_id: result.baseline.project_id,
    baseline_fingerprint: result.baseline.baseline_fingerprint,
    ordinary_text: ordinaryText,
    authority: result.authority,
  };
}

export function fingerprintProjectRootBindingV01(
  binding: ProjectLocalRootBindingV01,
): string {
  return createProtocolSha256V01(canonicalizeProtocolValueV01(binding));
}

export async function inspectPhysicalRootForExecutionV01(
  db: Database.Database,
  canonicalRoot: string,
  dependencies: RepositoryExecutionDependenciesV01 = {},
): Promise<PhysicalRootObservationV01> {
  const observedAt = (dependencies.now ?? (() => new Date().toISOString()))();
  const platform = dependencies.platform ?? process.platform;
  if (platform !== "darwin" && platform !== "linux") {
    return {
      status: "identity_unsupported",
      platform,
      node_scope_fingerprint: null,
      reason: platform === "win32"
        ? "stable_windows_file_identity_not_verified"
        : "platform_identity_adapter_unavailable",
      observed_at: observedAt,
    };
  }
  try {
    const nodeScopeRoot = dependencies.node_scope_root ?? databaseScopeRoot(db);
    const filesystemType = dependencies.filesystem_type ??
      (dependencies.physical_identity_filesystem
        ? null
        : async (root: string) => (await statfs(root, { bigint: true })).type);
    if (filesystemType) {
      for (const target of new Set([nodeScopeRoot, canonicalRoot])) {
        const classification = classifyFilesystemType(
          await filesystemType(target),
          platform,
        );
        if (classification) {
          return {
            status: classification.status,
            platform,
            node_scope_fingerprint: null,
            reason: classification.reason,
            observed_at: observedAt,
          };
        }
      }
    }
    const [nodeIdentity, identity] = await Promise.all([
      inspectNativeHostPhysicalRootIdentityV01(
        nodeScopeRoot,
        dependencies.physical_identity_filesystem,
      ),
      inspectNativeHostPhysicalRootIdentityV01(
        canonicalRoot,
        dependencies.physical_identity_filesystem,
      ),
    ]);
    if (
      !isStableFilesystemIdentity(nodeIdentity.device, nodeIdentity.inode) ||
      !isStableFilesystemIdentity(identity.device, identity.inode)
    ) {
      return {
        status: "identity_ambiguous",
        platform,
        node_scope_fingerprint: null,
        reason: "filesystem_identity_fields_ambiguous",
        observed_at: observedAt,
      };
    }
    const nodeScopeFingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        scope_version: "augnes_local_node_scope.v0.1",
        platform,
        identity: nodeIdentity,
      }),
    );
    const observationMaterial = {
      platform,
      node_scope_fingerprint: nodeScopeFingerprint,
      identity,
    };
    return {
      status: "exact",
      ...observationMaterial,
      observation_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(observationMaterial),
      ),
      observed_at: observedAt,
    };
  } catch {
    return {
      status: "identity_unavailable",
      platform,
      node_scope_fingerprint: null,
      reason: "physical_root_identity_unavailable",
      observed_at: observedAt,
    };
  }
}

export function buildPhysicalRootBaselineV01(input: {
  workspace_id: string;
  project_id: string;
  root_binding: ProjectLocalRootBindingV01;
  observation: Extract<PhysicalRootObservationV01, { status: "exact" }>;
  provenance: PhysicalRootBaselineV01["provenance"];
}): PhysicalRootBaselineV01 {
  const material = {
    baseline_version: PHYSICAL_ROOT_BASELINE_VERSION_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    node_scope_fingerprint: input.observation.node_scope_fingerprint,
    root_binding_fingerprint: fingerprintProjectRootBindingV01(input.root_binding),
    identity_version: input.observation.identity.identity_version,
    canonical_realpath_fingerprint:
      input.observation.identity.canonical_realpath_fingerprint,
    filesystem_volume_identity: input.observation.identity.device,
    filesystem_object_identity: input.observation.identity.inode,
    observed_at: input.observation.observed_at,
    provenance: input.provenance,
  };
  return {
    ...material,
    baseline_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(material),
    ),
  };
}

function readExpectedDatabaseAdmissionStateV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    node_scope_fingerprint: string;
  },
): {
  root_binding_fingerprint: string | null;
  physical_root_baseline_fingerprint: string | null;
  task_context_packet_id: string | null;
  task_context_packet_fingerprint: string | null;
  current_work_fingerprint: string | null;
  managed_run_state_fingerprint: string;
  managed_run_conflict: boolean;
  expected_database_state_fingerprint: string;
} {
  const registration = readCanonicalProjectWithRootV01(db, input);
  const baseline = readPhysicalRootBaselineV01(db, input);
  const work = readProjectWorkInitializationV01(db, input);
  const run = readLatestManagedLiveAutonomyRunSummaryV01(input, db);
  const managedRunStateFingerprint = managedRunStateFingerprintV01(db, input);
  const material = {
    state_version: "repository_execution_database_admission_state.v0.1",
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    root_binding_fingerprint: registration
      ? fingerprintProjectRootBindingV01(registration.root_binding)
      : null,
    physical_root_baseline_fingerprint: baseline?.baseline_fingerprint ?? null,
    task_context_packet_id: work.current_packet?.packet_id ?? null,
    task_context_packet_fingerprint: work.current_packet?.packet_fingerprint ?? null,
    current_work_fingerprint: work.current_work
      ? createProtocolSha256V01(canonicalizeProtocolValueV01(work.current_work))
      : null,
    managed_run_state_fingerprint: managedRunStateFingerprint,
    managed_run_conflict: Boolean(run && !isTerminalRunnerStatus(run.status)),
  };
  return {
    ...material,
    expected_database_state_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(material),
    ),
  };
}

function managedRunStateFingerprintV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
): string {
  const run = readLatestManagedLiveAutonomyRunSummaryV01(input, db);
  return createProtocolSha256V01(
    canonicalizeProtocolValueV01(
      run
        ? { run_id: run.run_id, status: run.status, updated_at: run.updated_at }
        : { run: null },
    ),
  );
}

export function createRepositoryExecutionDecisionRequestV01(
  db: Database.Database,
  input: {
    action: RepositoryExecutionDecisionActionV01;
    workspace_id: string;
    project_id: string;
    expected_state: Record<string, unknown>;
  },
  options: { now?: () => string; max_age_ms?: number } = {},
): RepositoryExecutionDecisionRequestProjectionV01 {
  const now = (options.now ?? (() => new Date().toISOString()))();
  const nowMs = Date.parse(now);
  const maxAgeMs = options.max_age_ms ?? DEFAULT_DECISION_MAX_AGE_MS;
  if (!Number.isFinite(nowMs) || !Number.isSafeInteger(maxAgeMs) || maxAgeMs < 1) {
    throw new RepositoryExecutionErrorV01("repository_execution_decision_clock_invalid", 500);
  }
  const expiresAt = new Date(nowMs + maxAgeMs).toISOString();
  const expectedStateJson = canonicalizeProtocolValueV01(input.expected_state);
  const expectedStateFingerprint = createProtocolSha256V01(expectedStateJson);
  let selected!: RepositoryExecutionDecisionRequestV01;
  db.transaction(() => {
    const open = readOpenRepositoryExecutionDecisionV01(db, input);
    if (open && Date.parse(open.expires_at) <= nowMs) {
      updateRepositoryExecutionDecisionInsideTransactionV01(db, {
        request_fingerprint: open.request_fingerprint,
        from: ["pending", "granted"],
        to: "expired",
      });
    } else if (open?.expected_state_fingerprint === expectedStateFingerprint) {
      selected = open;
      return;
    } else if (open) {
      updateRepositoryExecutionDecisionInsideTransactionV01(db, {
        request_fingerprint: open.request_fingerprint,
        from: ["pending", "granted"],
        to: "superseded",
      });
    }
    const requestMaterial = {
      decision_request_version: REPOSITORY_EXECUTION_DECISION_REQUEST_VERSION_V01,
      action: input.action,
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      expected_state_fingerprint: expectedStateFingerprint,
      requested_at: now,
      expires_at: expiresAt,
    };
    const request: RepositoryExecutionDecisionRequestV01 = {
      ...requestMaterial,
      request_fingerprint: createProtocolSha256V01(
        canonicalizeProtocolValueV01(requestMaterial),
      ),
      expected_state_json: expectedStateJson,
      status: "pending",
      grant_fingerprint: null,
      confirmation_source: null,
      granted_at: null,
      consumed_at: null,
      result_fingerprint: null,
    };
    insertRepositoryExecutionDecisionRequestInsideTransactionV01(db, request);
    pruneRepositoryExecutionDecisionsInsideTransactionV01(db, {
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      retain: DECISION_HISTORY_RETAIN,
    });
    selected = request;
  }).immediate();
  return repositoryExecutionDecisionProjectionV01(selected);
}

export function grantRepositoryExecutionDecisionFromBrowserSessionV01(
  db: Database.Database,
  input: {
    request_fingerprint: string;
    workspace_id: string;
    project_id: string;
    challenge_fingerprint: string;
    credential: VNextLocalOperatorSessionCredentialV01;
  },
  options: {
    now?: () => string;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  } = {},
): {
  decision: RepositoryExecutionDecisionRequestProjectionV01;
  session_admission: VNextLocalOperatorSessionMutationAdmissionV01;
} {
  let result!: {
    decision: RepositoryExecutionDecisionRequestProjectionV01;
    session_admission: VNextLocalOperatorSessionMutationAdmissionV01;
  };
  let expired = false;
  db.transaction(() => {
    const authorized = authorizeRepositoryExecutionDecisionFromBrowserSessionInsideTransactionV01(
      db,
      input,
      options,
      { allow_expired_result: true },
    );
    result = {
      decision: authorized.decision,
      session_admission: authorized.session_admission,
    };
    expired = authorized.expired;
  }).immediate();
  if (expired) {
    throw new RepositoryExecutionErrorV01("repository_execution_decision_expired", 409);
  }
  return result;
}

export function authorizeRepositoryExecutionDecisionFromBrowserSessionInsideTransactionV01(
  db: Database.Database,
  input: {
    request_fingerprint: string;
    workspace_id: string;
    project_id: string;
    challenge_fingerprint: string;
    credential: VNextLocalOperatorSessionCredentialV01;
  },
  options: {
    now?: () => string;
    secret_source?: VNextLocalOperatorSecretSourceV01;
  } = {},
  behavior: { allow_expired_result?: boolean } = {},
): {
  decision: RepositoryExecutionDecisionRequestProjectionV01;
  session_admission: VNextLocalOperatorSessionMutationAdmissionV01;
  expired: boolean;
} {
  if (!db.inTransaction) {
    throw new Error("repository_execution_decision_transaction_required");
  }
  const sessionAdmission =
    admitVNextRepositoryDecisionConfirmationInsideTransactionV01(db, {
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      request_fingerprint: input.request_fingerprint,
      challenge_fingerprint: input.challenge_fingerprint,
      credential: input.credential,
      clock: options.now ? { now: options.now } : undefined,
      secret_source: options.secret_source,
    });
  const granted = grantRepositoryExecutionDecisionInsideTransactionV01(
    db,
    {
      request_fingerprint: input.request_fingerprint,
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      confirmation_source: "browser_same_origin_button",
    },
    options,
  );
  if (granted.expired && !behavior.allow_expired_result) {
    throw new RepositoryExecutionErrorV01(
      "repository_execution_decision_expired",
      409,
    );
  }
  return {
    decision: repositoryExecutionDecisionProjectionV01(granted.request),
    session_admission: sessionAdmission,
    expired: granted.expired,
  };
}

function grantRepositoryExecutionDecisionInsideTransactionV01(
  db: Database.Database,
  input: {
    request_fingerprint: string;
    workspace_id: string;
    project_id: string;
    confirmation_source: "browser_same_origin_button";
  },
  options: { now?: () => string } = {},
): { request: RepositoryExecutionDecisionRequestV01; expired: boolean } {
  if (!db.inTransaction) {
    throw new Error("repository_execution_decision_transaction_required");
  }
  const now = (options.now ?? (() => new Date().toISOString()))();
  const nowMs = Date.parse(now);
  const request = readRepositoryExecutionDecisionRequestV01(
    db,
    input.request_fingerprint,
  );
  if (
    !request ||
    request.workspace_id !== input.workspace_id ||
    request.project_id !== input.project_id
  ) {
    throw new RepositoryExecutionErrorV01("repository_execution_decision_unavailable", 404);
  }
  if (request.status === "granted" || request.status === "consumed") {
    return { request, expired: false };
  }
  if (request.status !== "pending") {
    throw new RepositoryExecutionErrorV01("repository_execution_decision_not_confirmable", 409);
  }
  if (!Number.isFinite(nowMs) || nowMs >= Date.parse(request.expires_at)) {
    updateRepositoryExecutionDecisionInsideTransactionV01(db, {
      request_fingerprint: request.request_fingerprint,
      from: ["pending"],
      to: "expired",
    });
    return { request: { ...request, status: "expired" }, expired: true };
  }
    const grantFingerprint = createProtocolSha256V01(
      canonicalizeProtocolValueV01({
        grant_version: "repository_execution_decision_grant.v0.1",
        request_fingerprint: request.request_fingerprint,
        confirmation_source: input.confirmation_source,
      }),
    );
  if (!updateRepositoryExecutionDecisionInsideTransactionV01(db, {
      request_fingerprint: request.request_fingerprint,
      from: ["pending"],
      to: "granted",
      grant_fingerprint: grantFingerprint,
      confirmation_source: input.confirmation_source,
      granted_at: now,
  })) {
    throw new RepositoryExecutionErrorV01("repository_execution_decision_stale", 409);
  }
  return {
    request: readRepositoryExecutionDecisionRequestV01(
      db,
      request.request_fingerprint,
    )!,
    expired: false,
  };
}

export function readOpenRepositoryExecutionDecisionProjectionV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  options: { now?: () => string } = {},
): RepositoryExecutionDecisionRequestProjectionV01 | null {
  const request = readOpenRepositoryExecutionDecisionV01(db, input);
  if (!request) return null;
  const nowMs = Date.parse((options.now ?? (() => new Date().toISOString()))());
  if (!Number.isFinite(nowMs) || nowMs >= Date.parse(request.expires_at)) return null;
  return repositoryExecutionDecisionProjectionV01(request);
}

function repositoryExecutionDecisionProjectionV01(
  request: RepositoryExecutionDecisionRequestV01,
): RepositoryExecutionDecisionRequestProjectionV01 {
  return {
    decision_request_version: request.decision_request_version,
    request_fingerprint: request.request_fingerprint,
    action: request.action,
    workspace_id: request.workspace_id,
    project_id: request.project_id,
    expected_state_fingerprint: request.expected_state_fingerprint,
    requested_at: request.requested_at,
    expires_at: request.expires_at,
    status: request.status,
    grant_fingerprint: request.grant_fingerprint,
    ordinary_text: decisionOrdinaryTextV01(request.action),
  };
}

function decisionOrdinaryTextV01(action: RepositoryExecutionDecisionActionV01): string {
  if (action === "adopt_legacy_baseline") {
    return "Use this folder as this project's trusted execution root?";
  }
  if (action === "rebind_root") {
    return "Use the selected folder as this project's new trusted execution root?";
  }
  return "Revoke this prepared repository attachment?";
}

function adoptionDecisionExpectedStateV01(input: {
  workspace_id: string;
  project_id: string;
  expected_admission_fingerprint: string;
  expected_observation_fingerprint: string;
  expected_root_binding_fingerprint: string;
}): Record<string, unknown> {
  return {
    expected_state_version: "repository_execution_adoption_expected_state.v0.1",
    action: "adopt_legacy_baseline",
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    expected_admission_fingerprint: input.expected_admission_fingerprint,
    expected_observation_fingerprint: input.expected_observation_fingerprint,
    expected_root_binding_fingerprint: input.expected_root_binding_fingerprint,
    expected_baseline: "absent",
  };
}

function rebindDecisionExpectedStateV01(input: {
  workspace_id: string;
  project_id: string;
  new_local_root: LocalProjectRootRefV01;
  expected_old_root_binding_fingerprint: string;
  expected_old_baseline_fingerprint: string;
  expected_new_observation_fingerprint: string;
}): Record<string, unknown> {
  return {
    expected_state_version: "repository_execution_rebind_expected_state.v0.1",
    action: "rebind_root",
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    new_local_root: input.new_local_root,
    expected_old_root_binding_fingerprint:
      input.expected_old_root_binding_fingerprint,
    expected_old_baseline_fingerprint:
      input.expected_old_baseline_fingerprint,
    expected_new_observation_fingerprint:
      input.expected_new_observation_fingerprint,
  };
}

function revocationDecisionExpectedStateV01(input: {
  attachment_id: string;
  expected_binding_fingerprint: string;
}): Record<string, unknown> {
  return {
    expected_state_version: "repository_execution_revocation_expected_state.v0.1",
    action: "revoke_attachment",
    attachment_id: input.attachment_id,
    expected_binding_fingerprint: input.expected_binding_fingerprint,
  };
}

function assertGrantedRepositoryExecutionDecisionInsideTransactionV01(
  db: Database.Database,
  input: {
    action: RepositoryExecutionDecisionActionV01;
    workspace_id: string;
    project_id: string;
    expected_state_fingerprint: string;
    decision_request_fingerprint: string;
    decision_grant_fingerprint: string;
    now: string;
  },
): RepositoryExecutionDecisionRequestV01 {
  if (!db.inTransaction) throw new Error("repository_execution_decision_transaction_required");
  const request = readRepositoryExecutionDecisionRequestV01(
    db,
    input.decision_request_fingerprint,
  );
  if (
    !request ||
    request.action !== input.action ||
    request.workspace_id !== input.workspace_id ||
    request.project_id !== input.project_id ||
    request.expected_state_fingerprint !== input.expected_state_fingerprint ||
    request.grant_fingerprint !== input.decision_grant_fingerprint
  ) {
    throw new RepositoryExecutionErrorV01("repository_execution_decision_mismatch", 409);
  }
  if (
    request.status !== "consumed" &&
    Date.parse(input.now) >= Date.parse(request.expires_at)
  ) {
    throw new RepositoryExecutionErrorV01("repository_execution_decision_expired", 409);
  }
  if (request.status !== "granted" && request.status !== "consumed") {
    throw new RepositoryExecutionErrorV01("repository_execution_decision_not_granted", 409);
  }
  return request;
}

function consumeRepositoryExecutionDecisionInsideTransactionV01(
  db: Database.Database,
  input: {
    request: RepositoryExecutionDecisionRequestV01;
    consumed_at: string;
    result_fingerprint: string;
  },
): void {
  if (input.request.status === "consumed") {
    if (input.request.result_fingerprint !== input.result_fingerprint) {
      throw new RepositoryExecutionErrorV01("repository_execution_decision_replay_conflict", 409);
    }
    return;
  }
  if (!updateRepositoryExecutionDecisionInsideTransactionV01(db, {
    request_fingerprint: input.request.request_fingerprint,
    from: ["granted"],
    to: "consumed",
    consumed_at: input.consumed_at,
    result_fingerprint: input.result_fingerprint,
  })) {
    throw new RepositoryExecutionErrorV01("repository_execution_decision_stale", 409);
  }
}

export async function readProjectExecutionAdmissionV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  dependencies: RepositoryExecutionDependenciesV01 = {},
): Promise<ProjectExecutionAdmissionV01> {
  const registration = readCanonicalProjectWithRootV01(db, input);
  const active = readActiveProjectSelectionV01(db, input.workspace_id);
  const browserObservation = {
    active_project_id: active?.project_id ?? null,
    selected_project_is_target: active?.project_id === input.project_id,
  };
  if (!registration) {
    return blockedAdmission(input, browserObservation, "project_unavailable");
  }
  const rootBindingFingerprint = fingerprintProjectRootBindingV01(
    registration.root_binding,
  );
  const physical = await inspectPhysicalRootForExecutionV01(
    db,
    registration.root_binding.local_root.normalized_path,
    dependencies,
  );
  if (physical.status !== "exact") {
    return blockedAdmission(
      input,
      browserObservation,
      physical.status,
      rootBindingFingerprint,
    );
  }
  const baseline = readPhysicalRootBaselineV01(db, {
    ...input,
    node_scope_fingerprint: physical.node_scope_fingerprint,
  });
  if (!baseline) {
    return blockedAdmission(
      input,
      browserObservation,
      "baseline_adoption_required",
      rootBindingFingerprint,
      null,
      "decision_required",
      undefined,
      physical.node_scope_fingerprint,
      physical.observation_fingerprint,
    );
  }
  if (
    baseline.root_binding_fingerprint !== rootBindingFingerprint ||
    !baselineMatchesObservation(baseline, physical)
  ) {
    return blockedAdmission(
      input,
      browserObservation,
      "physical_root_mismatch",
      rootBindingFingerprint,
      baseline.baseline_fingerprint,
    );
  }
  const work = readProjectWorkInitializationV01(db, input);
  if (!work.current_packet || !work.current_work || !work.state.startsWith("defined_")) {
    return blockedAdmission(
      input,
      browserObservation,
      "current_work_unavailable",
      rootBindingFingerprint,
      baseline.baseline_fingerprint,
    );
  }
  const run = readLatestManagedLiveAutonomyRunSummaryV01(input, db);
  const managedRunStateFingerprint = managedRunStateFingerprintV01(db, input);
  if (run && !isTerminalRunnerStatus(run.status)) {
    return blockedAdmission(
      input,
      browserObservation,
      "managed_run_conflict",
      rootBindingFingerprint,
      baseline.baseline_fingerprint,
      "blocked",
      managedRunStateFingerprint,
    );
  }
  const worktree = await (dependencies.inspect_worktree ?? inspectRepositoryWorktreeV01)(
    registration.root_binding.local_root.normalized_path,
    { now: dependencies.now },
  );
  if (worktree.status === "non_git") {
    return blockedAdmission(
      input,
      browserObservation,
      "non_git_execution_unsupported",
      rootBindingFingerprint,
      baseline.baseline_fingerprint,
      "blocked",
      managedRunStateFingerprint,
    );
  }
  if (worktree.status === "unavailable" || worktree.status === "ambiguous") {
    return blockedAdmission(
      input,
      browserObservation,
      worktree.status === "ambiguous" ? "worktree_ambiguous" : "worktree_unavailable",
      rootBindingFingerprint,
      baseline.baseline_fingerprint,
      "blocked",
      managedRunStateFingerprint,
    );
  }
  const postObservationRun = readLatestManagedLiveAutonomyRunSummaryV01(input, db);
  const postObservationManagedRunStateFingerprint = managedRunStateFingerprintV01(db, input);
  if (postObservationRun && !isTerminalRunnerStatus(postObservationRun.status)) {
    return blockedAdmission(
      input,
      browserObservation,
      "managed_run_conflict",
      rootBindingFingerprint,
      baseline.baseline_fingerprint,
      "blocked",
      postObservationManagedRunStateFingerprint,
    );
  }
  const databaseState = readExpectedDatabaseAdmissionStateV01(db, {
    ...input,
    node_scope_fingerprint: physical.node_scope_fingerprint,
  });
  if (
    databaseState.root_binding_fingerprint !== rootBindingFingerprint ||
    databaseState.physical_root_baseline_fingerprint !== baseline.baseline_fingerprint
  ) {
    return blockedAdmission(
      input,
      browserObservation,
      "admission_state_changed",
      databaseState.root_binding_fingerprint,
      databaseState.physical_root_baseline_fingerprint,
      "blocked",
      databaseState.managed_run_state_fingerprint,
    );
  }
  if (databaseState.managed_run_conflict) {
    return blockedAdmission(
      input,
      browserObservation,
      "managed_run_conflict",
      rootBindingFingerprint,
      baseline.baseline_fingerprint,
      "blocked",
      databaseState.managed_run_state_fingerprint,
    );
  }
  if (
    !databaseState.task_context_packet_id ||
    !databaseState.task_context_packet_fingerprint ||
    !databaseState.current_work_fingerprint
  ) {
    return blockedAdmission(
      input,
      browserObservation,
      "current_work_unavailable",
      rootBindingFingerprint,
      baseline.baseline_fingerprint,
      "blocked",
      databaseState.managed_run_state_fingerprint,
    );
  }
  const bindingMaterial = {
    admission_version: PROJECT_EXECUTION_ADMISSION_VERSION_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    readiness: "ready" as const,
    reason: "ready" as const,
    root_binding_fingerprint: rootBindingFingerprint,
    node_scope_fingerprint: physical.node_scope_fingerprint,
    physical_root_observation_fingerprint: physical.observation_fingerprint,
    physical_root_baseline_fingerprint: baseline.baseline_fingerprint,
    task_context_packet_id: databaseState.task_context_packet_id,
    task_context_packet_fingerprint: databaseState.task_context_packet_fingerprint,
    current_work_fingerprint: databaseState.current_work_fingerprint,
    managed_run_state_fingerprint: databaseState.managed_run_state_fingerprint,
    expected_database_state_fingerprint:
      databaseState.expected_database_state_fingerprint,
    worktree_observation_fingerprint: worktree.observation_fingerprint,
  };
  return {
    ...bindingMaterial,
    worktree_observation: worktree,
    admission_fingerprint: createProtocolSha256V01(
      canonicalizeProtocolValueV01(bindingMaterial),
    ),
    browser_observation: browserObservation,
    projection_only: true,
    execution_authority_granted: false,
    semantic_authority_granted: false,
  };
}

export async function prepareRepositoryExecutionV01(
  db: Database.Database,
  input: { workspace_id: string; project_id: string },
  dependencies: RepositoryExecutionDependenciesV01 & { max_age_ms?: number } = {},
): Promise<RepositoryExecutionPreparationV01> {
  const admission = await readProjectExecutionAdmissionV01(db, input, dependencies);
  const registration = readCanonicalProjectWithRootV01(db, input);
  const project = registration
    ? { project_id: registration.project.project_id, display_name: registration.project.display_name }
    : null;
  if (admission.readiness !== "ready" || admission.worktree_observation?.status !== "exact") {
    const existingPrepared = readPreparedRepositoryExecutionAttachmentV01(db, input);
    if (existingPrepared) {
      const updatedAt = (dependencies.now ?? (() => new Date().toISOString()))();
      const staleReason = classifyStaleReason(existingPrepared, admission, updatedAt) ?? "project_unavailable";
      db.transaction(() => {
        updateRepositoryExecutionAttachmentLifecycleInsideTransactionV01(db, {
          attachment_id: existingPrepared.attachment_id,
          from: "prepared",
          to: "stale",
          stale_reason: staleReason,
          updated_at: updatedAt,
        });
      }).immediate();
    }
    const decisionRequest = admission.reason === "baseline_adoption_required" &&
      admission.physical_root_observation_fingerprint &&
      admission.root_binding_fingerprint
      ? createRepositoryExecutionDecisionRequestV01(db, {
          action: "adopt_legacy_baseline",
          ...input,
          expected_state: adoptionDecisionExpectedStateV01({
            ...input,
            expected_admission_fingerprint: admission.admission_fingerprint,
            expected_observation_fingerprint:
              admission.physical_root_observation_fingerprint,
            expected_root_binding_fingerprint: admission.root_binding_fingerprint,
          }),
        }, { now: dependencies.now })
      : null;
    return {
      preparation_version: "repository_execution_preparation.v0.1",
      status: admission.reason === "baseline_adoption_required"
        ? "baseline_adoption_required"
        : "blocked",
      reason: admission.reason,
      project,
      ordinary_text: ordinaryBlockedText(admission.reason, project?.display_name ?? null),
      attachment: null,
      admission,
      decision_request: decisionRequest,
      authority: REPOSITORY_EXECUTION_AUTHORITY_BOUNDARY_V01,
    };
  }
  const now = (dependencies.now ?? (() => new Date().toISOString()))();
  const nowMs = Date.parse(now);
  const maxAgeMs = dependencies.max_age_ms ?? DEFAULT_ATTACHMENT_MAX_AGE_MS;
  if (!Number.isFinite(nowMs) || !Number.isSafeInteger(maxAgeMs) || maxAgeMs < 1) {
    throw new RepositoryExecutionErrorV01("repository_execution_clock_invalid", 500);
  }
  const preparedAt = now;
  const expiresAt = new Date(nowMs + maxAgeMs).toISOString();
  const bindingMaterial = {
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    node_scope_fingerprint: admission.node_scope_fingerprint!,
    physical_root_baseline_fingerprint: admission.physical_root_baseline_fingerprint!,
    root_binding_fingerprint: admission.root_binding_fingerprint!,
    task_context_packet_id: admission.task_context_packet_id!,
    task_context_packet_fingerprint: admission.task_context_packet_fingerprint!,
    current_work_fingerprint: admission.current_work_fingerprint!,
    project_execution_admission_fingerprint: admission.admission_fingerprint,
    worktree_observation_fingerprint: admission.worktree_observation.observation_fingerprint,
    managed_run_state_fingerprint: admission.managed_run_state_fingerprint,
    prepared_at: preparedAt,
    freshness_policy: {
      policy_version: REPOSITORY_EXECUTION_FRESHNESS_POLICY_VERSION_V01,
      max_age_ms: maxAgeMs,
      expires_at: expiresAt,
    },
  };
  const bindingFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(bindingMaterial),
  );
  const proposedAttachment: RepositoryExecutionAttachmentV01 = {
    attachment_version: REPOSITORY_EXECUTION_ATTACHMENT_VERSION_V01,
    attachment_id: createProtocolSha256V01(`attachment:${bindingFingerprint}`),
    ...bindingMaterial,
    binding_fingerprint: bindingFingerprint,
    lifecycle: "prepared",
    stale_reason: null,
    lifecycle_updated_at: preparedAt,
    consumed_run_id: null,
  };
  dependencies.before_prepare_transaction?.();
  let selectedAttachment!: RepositoryExecutionAttachmentV01;
  db.transaction(() => {
    const exactDatabaseState = readExpectedDatabaseAdmissionStateV01(db, {
      ...input,
      node_scope_fingerprint: admission.node_scope_fingerprint!,
    });
    if (
      !admission.expected_database_state_fingerprint ||
      exactDatabaseState.expected_database_state_fingerprint !==
        admission.expected_database_state_fingerprint
    ) {
      throw new RepositoryExecutionErrorV01(
        "repository_execution_preparation_stale",
        409,
      );
    }
    const active = readPreparedRepositoryExecutionAttachmentV01(db, input);
    if (
      active &&
      samePreparedMaterial(active, admission) &&
      Date.parse(active.freshness_policy.expires_at) > nowMs
    ) {
      selectedAttachment = active;
      return;
    }
    const existing = readRepositoryExecutionAttachmentByBindingV01(
      db,
      bindingFingerprint,
    );
    if (active) {
      updateRepositoryExecutionAttachmentLifecycleInsideTransactionV01(db, {
        attachment_id: active.attachment_id,
        from: "prepared",
        to: "superseded",
        stale_reason: "superseded",
        updated_at: now,
      });
    }
    if (existing) {
      updateRepositoryExecutionAttachmentLifecycleInsideTransactionV01(db, {
        attachment_id: existing.attachment_id,
        to: "prepared",
        stale_reason: null,
        updated_at: now,
      });
    } else {
      insertRepositoryExecutionAttachmentInsideTransactionV01(
        db,
        proposedAttachment,
      );
    }
    pruneRepositoryExecutionAttachmentsInsideTransactionV01(db, {
      ...input,
      retain: ATTACHMENT_HISTORY_RETAIN,
    });
    selectedAttachment = readRepositoryExecutionAttachmentV01(
      db,
      proposedAttachment.attachment_id,
    )!;
  }).immediate();
  dependencies.after_prepare_transaction_before_reobserve?.();
  const physicalAfter = await inspectPhysicalRootForExecutionV01(
    db,
    registration!.root_binding.local_root.normalized_path,
    dependencies,
  );
  const worktreeAfter = await (
    dependencies.inspect_worktree ?? inspectRepositoryWorktreeV01
  )(
    registration!.root_binding.local_root.normalized_path,
    { now: dependencies.now },
  );
  // This must remain the last admission-state read. A packet, work, root,
  // baseline, or managed-run mutation may commit while the bounded filesystem
  // observations are in flight.
  const databaseAfter = readExpectedDatabaseAdmissionStateV01(db, {
    ...input,
    node_scope_fingerprint: admission.node_scope_fingerprint!,
  });
  const physicalChanged = physicalAfter.status !== "exact" ||
    physicalAfter.observation_fingerprint !==
      admission.physical_root_observation_fingerprint;
  const worktreeChanged = worktreeAfter.status !== "exact" ||
    worktreeAfter.observation_fingerprint !==
      admission.worktree_observation.observation_fingerprint;
  const databaseChanged = databaseAfter.expected_database_state_fingerprint !==
    admission.expected_database_state_fingerprint;
  if (physicalChanged || worktreeChanged || databaseChanged) {
    const updatedAt = (dependencies.now ?? (() => new Date().toISOString()))();
    db.transaction(() => {
      updateRepositoryExecutionAttachmentLifecycleInsideTransactionV01(db, {
        attachment_id: selectedAttachment.attachment_id,
        from: "prepared",
        to: "stale",
        stale_reason: physicalChanged
          ? "physical_root_mismatch"
          : worktreeChanged
            ? "worktree_changed"
            : classifyDatabaseStateChangeV01(selectedAttachment, databaseAfter),
        updated_at: updatedAt,
      });
    }).immediate();
    const reason: ProjectExecutionAdmissionReasonV01 = physicalChanged
      ? "physical_root_mismatch"
      : worktreeAfter.status === "ambiguous"
        ? "worktree_ambiguous"
        : worktreeAfter.status === "unavailable"
          ? "worktree_unavailable"
          : worktreeAfter.status === "non_git"
            ? "non_git_execution_unsupported"
            : databaseAfter.managed_run_conflict
              ? "managed_run_conflict"
              : "admission_state_changed";
    const postChangeAdmission = blockedAdmission(
      input,
      admission.browser_observation,
      reason,
      databaseAfter.root_binding_fingerprint,
      databaseAfter.physical_root_baseline_fingerprint,
      "blocked",
      databaseAfter.managed_run_state_fingerprint,
      physicalAfter.status === "exact"
        ? physicalAfter.node_scope_fingerprint
        : null,
      physicalAfter.status === "exact"
        ? physicalAfter.observation_fingerprint
        : null,
    );
    return {
      preparation_version: "repository_execution_preparation.v0.1",
      status: "blocked",
      reason,
      project,
      ordinary_text: ordinaryBlockedText(reason, project?.display_name ?? null),
      attachment: null,
      admission: postChangeAdmission,
      decision_request: null,
      authority: REPOSITORY_EXECUTION_AUTHORITY_BOUNDARY_V01,
    };
  }
  return preparedResult(project, admission, selectedAttachment);
}

export async function adoptLegacyPhysicalRootBaselineV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    expected_admission_fingerprint: string;
    expected_observation_fingerprint: string;
    decision_request_fingerprint: string;
    decision_grant_fingerprint: string;
  },
  dependencies: RepositoryExecutionDependenciesV01 = {},
): Promise<{ status: "adopted" | "exact_replay"; baseline: PhysicalRootBaselineV01; authority: RepositoryExecutionAuthorityBoundaryV01 }> {
  const admission = await readProjectExecutionAdmissionV01(db, input, dependencies);
  const registration = readCanonicalProjectWithRootV01(db, input);
  if (!registration) throw new RepositoryExecutionErrorV01("project_unavailable", 404);
  const physical = await inspectPhysicalRootForExecutionV01(
    db,
    registration.root_binding.local_root.normalized_path,
    dependencies,
  );
  if (physical.status !== "exact") throw new RepositoryExecutionErrorV01(physical.status, 409);
  const expectedRootBindingFingerprint = fingerprintProjectRootBindingV01(
    registration.root_binding,
  );
  const expectedState = adoptionDecisionExpectedStateV01({
    ...input,
    expected_root_binding_fingerprint: expectedRootBindingFingerprint,
  });
  const expectedStateFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(expectedState),
  );
  const baseline = buildPhysicalRootBaselineV01({
    ...input,
    root_binding: registration.root_binding,
    observation: physical,
    provenance: "explicit_legacy_adoption",
  });
  let resultStatus: "adopted" | "exact_replay" = "adopted";
  let resultBaseline = baseline;
  db.transaction(() => {
    const decision = assertGrantedRepositoryExecutionDecisionInsideTransactionV01(db, {
      action: "adopt_legacy_baseline",
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      expected_state_fingerprint: expectedStateFingerprint,
      decision_request_fingerprint: input.decision_request_fingerprint,
      decision_grant_fingerprint: input.decision_grant_fingerprint,
      now: (dependencies.now ?? (() => new Date().toISOString()))(),
    });
    const current = readCanonicalProjectWithRootV01(db, input);
    if (!current || fingerprintProjectRootBindingV01(current.root_binding) !== expectedRootBindingFingerprint) {
      throw new RepositoryExecutionErrorV01("baseline_adoption_stale", 409);
    }
    const existing = readPhysicalRootBaselineV01(db, {
      ...input,
      node_scope_fingerprint: physical.node_scope_fingerprint,
    });
    if (decision.status === "consumed") {
      if (!existing || existing.baseline_fingerprint !== decision.result_fingerprint) {
        throw new RepositoryExecutionErrorV01("baseline_adoption_replay_conflict", 409);
      }
      resultStatus = "exact_replay";
      resultBaseline = existing;
      return;
    }
    if (
      admission.reason !== "baseline_adoption_required" ||
      admission.admission_fingerprint !== input.expected_admission_fingerprint ||
      physical.observation_fingerprint !== input.expected_observation_fingerprint ||
      existing
    ) {
      throw new RepositoryExecutionErrorV01("baseline_adoption_stale", 409);
    }
    const insertion = insertPhysicalRootBaselineIfAbsentInsideTransactionV01(db, baseline);
    if (insertion.status !== "inserted") {
      throw new RepositoryExecutionErrorV01("baseline_adoption_stale", 409);
    }
    consumeRepositoryExecutionDecisionInsideTransactionV01(db, {
      request: decision,
      consumed_at: baseline.observed_at,
      result_fingerprint: baseline.baseline_fingerprint,
    });
  }).immediate();
  return { status: resultStatus, baseline: resultBaseline, authority: REPOSITORY_EXECUTION_AUTHORITY_BOUNDARY_V01 };
}

export async function validateRepositoryExecutionAttachmentV01(
  db: Database.Database,
  attachmentId: string,
  dependencies: RepositoryExecutionDependenciesV01 = {},
): Promise<RepositoryExecutionAttachmentV01 | null> {
  const attachment = readRepositoryExecutionAttachmentV01(db, attachmentId);
  if (!attachment || attachment.lifecycle !== "prepared") return attachment;
  const now = (dependencies.now ?? (() => new Date().toISOString()))();
  const admission = await readProjectExecutionAdmissionV01(db, attachment, dependencies);
  const staleReason = classifyStaleReason(attachment, admission, now);
  if (!staleReason) return attachment;
  db.transaction(() => {
    updateRepositoryExecutionAttachmentLifecycleInsideTransactionV01(db, {
      attachment_id: attachment.attachment_id,
      from: "prepared",
      to: "stale",
      stale_reason: staleReason,
      updated_at: now,
    });
  }).immediate();
  return readRepositoryExecutionAttachmentV01(db, attachmentId);
}

export function revokeRepositoryExecutionAttachmentV01(
  db: Database.Database,
  input: {
    attachment_id: string;
    expected_binding_fingerprint: string;
    decision_request_fingerprint: string;
    decision_grant_fingerprint: string;
    now?: string;
  },
): RepositoryExecutionAttachmentV01 {
  let attachment = readRepositoryExecutionAttachmentV01(db, input.attachment_id);
  if (!attachment) throw new RepositoryExecutionErrorV01("attachment_unavailable", 404);
  const now = input.now ?? new Date().toISOString();
  const expectedStateFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(revocationDecisionExpectedStateV01({
      attachment_id: input.attachment_id,
      expected_binding_fingerprint: input.expected_binding_fingerprint,
    })),
  );
  db.transaction(() => {
    attachment = readRepositoryExecutionAttachmentV01(db, input.attachment_id);
    if (!attachment) throw new RepositoryExecutionErrorV01("attachment_unavailable", 404);
    const decision = assertGrantedRepositoryExecutionDecisionInsideTransactionV01(db, {
      action: "revoke_attachment",
      workspace_id: attachment.workspace_id,
      project_id: attachment.project_id,
      expected_state_fingerprint: expectedStateFingerprint,
      decision_request_fingerprint: input.decision_request_fingerprint,
      decision_grant_fingerprint: input.decision_grant_fingerprint,
      now,
    });
    if (decision.status === "consumed") {
      if (
        attachment.lifecycle !== "revoked" ||
        decision.result_fingerprint !== attachment.binding_fingerprint
      ) {
        throw new RepositoryExecutionErrorV01("attachment_revocation_replay_conflict", 409);
      }
      return;
    }
    if (attachment.binding_fingerprint !== input.expected_binding_fingerprint) {
      throw new RepositoryExecutionErrorV01("attachment_revocation_stale", 409);
    }
    if (attachment.lifecycle !== "prepared") {
      throw new RepositoryExecutionErrorV01("attachment_not_revocable", 409);
    }
    updateRepositoryExecutionAttachmentLifecycleInsideTransactionV01(db, {
      attachment_id: attachment.attachment_id,
      from: "prepared",
      to: "revoked",
      stale_reason: "explicitly_revoked",
      updated_at: now,
    });
    consumeRepositoryExecutionDecisionInsideTransactionV01(db, {
      request: decision,
      consumed_at: now,
      result_fingerprint: attachment.binding_fingerprint,
    });
  }).immediate();
  return readRepositoryExecutionAttachmentV01(db, input.attachment_id)!;
}

export function previewRepositoryExecutionAttachmentRevocationV01(
  db: Database.Database,
  input: { attachment_id: string; expected_binding_fingerprint: string },
  options: { now?: () => string } = {},
): {
  preview_version: "repository_execution_attachment_revocation_preview.v0.1";
  status: "ready";
  ordinary_text: string;
  decision_request: RepositoryExecutionDecisionRequestProjectionV01;
  authority: RepositoryExecutionAuthorityBoundaryV01;
} {
  const attachment = readRepositoryExecutionAttachmentV01(db, input.attachment_id);
  if (!attachment || attachment.lifecycle !== "prepared") {
    throw new RepositoryExecutionErrorV01("attachment_not_revocable", 409);
  }
  if (attachment.binding_fingerprint !== input.expected_binding_fingerprint) {
    throw new RepositoryExecutionErrorV01("attachment_revocation_stale", 409);
  }
  return {
    preview_version: "repository_execution_attachment_revocation_preview.v0.1",
    status: "ready",
    ordinary_text: "Confirm revocation in the Augnes Browser project settings.",
    decision_request: createRepositoryExecutionDecisionRequestV01(db, {
      action: "revoke_attachment",
      workspace_id: attachment.workspace_id,
      project_id: attachment.project_id,
      expected_state: revocationDecisionExpectedStateV01(input),
    }, options),
    authority: REPOSITORY_EXECUTION_AUTHORITY_BOUNDARY_V01,
  };
}

export async function rebindRepositoryExecutionRootV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    new_local_root: LocalProjectRootRefV01;
    expected_old_root_binding_fingerprint: string;
    expected_old_baseline_fingerprint: string;
    expected_new_observation_fingerprint: string;
    decision_request_fingerprint: string;
    decision_grant_fingerprint?: string;
  },
  dependencies: RepositoryExecutionDependenciesV01 = {},
): Promise<{ status: "rebound" | "exact_replay"; root_binding: ProjectLocalRootBindingV01; baseline: PhysicalRootBaselineV01; authority: RepositoryExecutionAuthorityBoundaryV01 }> {
  const physical = await inspectPhysicalRootForExecutionV01(
    db,
    input.new_local_root.normalized_path,
    dependencies,
  );
  if (physical.status !== "exact") throw new RepositoryExecutionErrorV01(physical.status, 409);
  if (physical.observation_fingerprint !== input.expected_new_observation_fingerprint) {
    throw new RepositoryExecutionErrorV01("root_rebind_observation_stale", 409);
  }
  const requestFingerprint = createProtocolSha256V01(canonicalizeProtocolValueV01({
    action: "rebind_project_root",
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    new_local_root: input.new_local_root,
    expected_old_root_binding_fingerprint: input.expected_old_root_binding_fingerprint,
    expected_old_baseline_fingerprint: input.expected_old_baseline_fingerprint,
    expected_new_observation_fingerprint: input.expected_new_observation_fingerprint,
  }));
  const now = (dependencies.now ?? (() => new Date().toISOString()))();
  const expectedStateFingerprint = createProtocolSha256V01(
    canonicalizeProtocolValueV01(rebindDecisionExpectedStateV01(input)),
  );
  let resultStatus: "rebound" | "exact_replay" = "rebound";
  let result!: { root_binding: ProjectLocalRootBindingV01; baseline: PhysicalRootBaselineV01 };
  db.transaction(() => {
    const authorizedGrant =
      dependencies.authorize_decision_inside_transaction?.({
        action: "rebind_root",
        workspace_id: input.workspace_id,
        project_id: input.project_id,
        request_fingerprint: input.decision_request_fingerprint,
        expected_state_fingerprint: expectedStateFingerprint,
        now,
      }).grant_fingerprint ?? input.decision_grant_fingerprint;
    if (!authorizedGrant) {
      throw new RepositoryExecutionErrorV01(
        "repository_execution_decision_not_granted",
        409,
      );
    }
    const decision = assertGrantedRepositoryExecutionDecisionInsideTransactionV01(db, {
      action: "rebind_root",
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      expected_state_fingerprint: expectedStateFingerprint,
      decision_request_fingerprint: input.decision_request_fingerprint,
      decision_grant_fingerprint: authorizedGrant,
      now,
    });
    const receipt = db.prepare(
      "SELECT * FROM vnext_repository_root_rebind_receipts WHERE request_fingerprint = ?",
    ).get(requestFingerprint) as { new_baseline_fingerprint: string } | undefined;
    if (receipt) {
      const replayCurrent = readCanonicalProjectWithRootV01(db, input);
      const replayBaseline = readPhysicalRootBaselineV01(db, {
        ...input,
        node_scope_fingerprint: physical.node_scope_fingerprint,
      });
      if (
        decision.status === "consumed" &&
        decision.result_fingerprint === receipt.new_baseline_fingerprint &&
        replayCurrent &&
        replayBaseline?.baseline_fingerprint === receipt.new_baseline_fingerprint
      ) {
        resultStatus = "exact_replay";
        result = { root_binding: replayCurrent.root_binding, baseline: replayBaseline };
        return;
      }
      throw new RepositoryExecutionErrorV01("root_rebind_replay_conflict", 409);
    }
    if (decision.status === "consumed") {
      throw new RepositoryExecutionErrorV01("root_rebind_replay_conflict", 409);
    }
    const current = readCanonicalProjectWithRootV01(db, input);
    if (!current) throw new RepositoryExecutionErrorV01("project_unavailable", 404);
    const currentRootFingerprint = fingerprintProjectRootBindingV01(current.root_binding);
    const oldBaseline = readPhysicalRootBaselineV01(db, {
      ...input,
      node_scope_fingerprint: physical.node_scope_fingerprint,
    });
    if (
      currentRootFingerprint !== input.expected_old_root_binding_fingerprint ||
      oldBaseline?.baseline_fingerprint !== input.expected_old_baseline_fingerprint
    ) {
      throw new RepositoryExecutionErrorV01("root_rebind_stale", 409);
    }
    const rootBinding = rebindCanonicalProjectLocalRootV01(db, {
      ...input,
      local_root: input.new_local_root,
    }, { now: () => now });
    const baseline = buildPhysicalRootBaselineV01({
      ...input,
      root_binding: rootBinding,
      observation: physical,
      provenance: "explicit_root_rebind",
    });
    const replacement = replacePhysicalRootBaselineExpectedInsideTransactionV01(db, {
      baseline,
      expected_old_baseline_fingerprint: input.expected_old_baseline_fingerprint,
    });
    if (replacement.status === "conflict") {
      throw new RepositoryExecutionErrorV01("root_rebind_stale", 409);
    }
    const prepared = readPreparedRepositoryExecutionAttachmentV01(db, input);
    if (prepared) {
      updateRepositoryExecutionAttachmentLifecycleInsideTransactionV01(db, {
        attachment_id: prepared.attachment_id,
        from: "prepared",
        to: "stale",
        stale_reason: "root_binding_changed",
        updated_at: now,
      });
    }
    db.prepare(
      `INSERT INTO vnext_repository_root_rebind_receipts (
        request_fingerprint, workspace_id, project_id,
        old_root_binding_fingerprint, old_baseline_fingerprint,
        new_root_binding_fingerprint, new_baseline_fingerprint, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      requestFingerprint,
      input.workspace_id,
      input.project_id,
      input.expected_old_root_binding_fingerprint,
      input.expected_old_baseline_fingerprint,
      fingerprintProjectRootBindingV01(rootBinding),
      baseline.baseline_fingerprint,
      now,
    );
    consumeRepositoryExecutionDecisionInsideTransactionV01(db, {
      request: decision,
      consumed_at: now,
      result_fingerprint: baseline.baseline_fingerprint,
    });
    result = { root_binding: rootBinding, baseline };
    dependencies.after_rebind_inside_transaction?.(result);
  }).immediate();
  return { status: resultStatus, ...result, authority: REPOSITORY_EXECUTION_AUTHORITY_BOUNDARY_V01 };
}

export async function previewRepositoryExecutionRootRebindV01(
  db: Database.Database,
  input: {
    workspace_id: string;
    project_id: string;
    new_local_root: LocalProjectRootRefV01;
  },
  dependencies: RepositoryExecutionDependenciesV01 = {},
): Promise<{
  preview_version: "repository_execution_root_rebind_preview.v0.1";
  status: "ready" | "blocked";
  reason: "ready" | "project_unavailable" | "baseline_adoption_required" | "identity_unavailable" | "identity_unsupported" | "identity_ambiguous";
  workspace_id: string;
  project_id: string;
  expected_old_root_binding_fingerprint: string | null;
  expected_old_baseline_fingerprint: string | null;
  expected_new_observation_fingerprint: string | null;
  decision_request: RepositoryExecutionDecisionRequestProjectionV01 | null;
  ordinary_text: string;
  authority: RepositoryExecutionAuthorityBoundaryV01;
}> {
  const current = readCanonicalProjectWithRootV01(db, input);
  if (!current) {
    return {
      preview_version: "repository_execution_root_rebind_preview.v0.1",
      status: "blocked",
      reason: "project_unavailable",
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      expected_old_root_binding_fingerprint: null,
      expected_old_baseline_fingerprint: null,
      expected_new_observation_fingerprint: null,
      decision_request: null,
      ordinary_text: "The project is unavailable, so its folder cannot be changed.",
      authority: REPOSITORY_EXECUTION_AUTHORITY_BOUNDARY_V01,
    };
  }
  const physical = await inspectPhysicalRootForExecutionV01(
    db,
    input.new_local_root.normalized_path,
    dependencies,
  );
  if (physical.status !== "exact") {
    return {
      preview_version: "repository_execution_root_rebind_preview.v0.1",
      status: "blocked",
      reason: physical.status,
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      expected_old_root_binding_fingerprint: fingerprintProjectRootBindingV01(current.root_binding),
      expected_old_baseline_fingerprint: null,
      expected_new_observation_fingerprint: null,
      decision_request: null,
      ordinary_text: "The selected folder identity cannot be established.",
      authority: REPOSITORY_EXECUTION_AUTHORITY_BOUNDARY_V01,
    };
  }
  const baseline = readPhysicalRootBaselineV01(db, {
    ...input,
    node_scope_fingerprint: physical.node_scope_fingerprint,
  });
  if (!baseline) {
    return {
      preview_version: "repository_execution_root_rebind_preview.v0.1",
      status: "blocked",
      reason: "baseline_adoption_required",
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      expected_old_root_binding_fingerprint:
        fingerprintProjectRootBindingV01(current.root_binding),
      expected_old_baseline_fingerprint: null,
      expected_new_observation_fingerprint: physical.observation_fingerprint,
      decision_request: null,
      ordinary_text: "Adopt the current trusted root before moving this project.",
      authority: REPOSITORY_EXECUTION_AUTHORITY_BOUNDARY_V01,
    };
  }
  const expectedState = rebindDecisionExpectedStateV01({
    ...input,
    expected_old_root_binding_fingerprint:
      fingerprintProjectRootBindingV01(current.root_binding),
    expected_old_baseline_fingerprint: baseline.baseline_fingerprint,
    expected_new_observation_fingerprint: physical.observation_fingerprint,
  });
  return {
    preview_version: "repository_execution_root_rebind_preview.v0.1",
    status: "ready",
    reason: "ready",
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    expected_old_root_binding_fingerprint: fingerprintProjectRootBindingV01(current.root_binding),
    expected_old_baseline_fingerprint: baseline.baseline_fingerprint,
    expected_new_observation_fingerprint: physical.observation_fingerprint,
    decision_request: createRepositoryExecutionDecisionRequestV01(db, {
      action: "rebind_root",
      workspace_id: input.workspace_id,
      project_id: input.project_id,
      expected_state: expectedState,
    }, { now: dependencies.now }),
    ordinary_text: `Use this folder as ${(current.project.display_name ?? "this project")}'s trusted execution root.`,
    authority: REPOSITORY_EXECUTION_AUTHORITY_BOUNDARY_V01,
  };
}

function blockedAdmission(
  input: { workspace_id: string; project_id: string },
  browserObservation: ProjectExecutionAdmissionV01["browser_observation"],
  reason: ProjectExecutionAdmissionReasonV01,
  rootBindingFingerprint: string | null = null,
  baselineFingerprint: string | null = null,
  readiness: ProjectExecutionAdmissionV01["readiness"] = "blocked",
  managedRunStateFingerprint = createProtocolSha256V01(canonicalizeProtocolValueV01({ run: null })),
  nodeScopeFingerprint: string | null = null,
  physicalObservationFingerprint: string | null = null,
): ProjectExecutionAdmissionV01 {
  const material = {
    admission_version: PROJECT_EXECUTION_ADMISSION_VERSION_V01,
    workspace_id: input.workspace_id,
    project_id: input.project_id,
    readiness,
    reason,
    node_scope_fingerprint: nodeScopeFingerprint,
    physical_root_observation_fingerprint: physicalObservationFingerprint,
    root_binding_fingerprint: rootBindingFingerprint,
    physical_root_baseline_fingerprint: baselineFingerprint,
    task_context_packet_id: null,
    task_context_packet_fingerprint: null,
    current_work_fingerprint: null,
    managed_run_state_fingerprint: managedRunStateFingerprint,
    expected_database_state_fingerprint: null,
    worktree_observation_fingerprint: null,
  };
  return {
    ...material,
    worktree_observation: null,
    admission_fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(material)),
    browser_observation: browserObservation,
    projection_only: true,
    execution_authority_granted: false,
    semantic_authority_granted: false,
  };
}

function baselineMatchesObservation(
  baseline: PhysicalRootBaselineV01,
  observation: Extract<PhysicalRootObservationV01, { status: "exact" }>,
): boolean {
  return baseline.node_scope_fingerprint === observation.node_scope_fingerprint &&
    baseline.canonical_realpath_fingerprint === observation.identity.canonical_realpath_fingerprint &&
    baseline.filesystem_volume_identity === observation.identity.device &&
    baseline.filesystem_object_identity === observation.identity.inode;
}

function samePreparedMaterial(
  attachment: RepositoryExecutionAttachmentV01,
  admission: ProjectExecutionAdmissionV01,
): boolean {
  return attachment.physical_root_baseline_fingerprint === admission.physical_root_baseline_fingerprint &&
    attachment.root_binding_fingerprint === admission.root_binding_fingerprint &&
    attachment.task_context_packet_id === admission.task_context_packet_id &&
    attachment.task_context_packet_fingerprint === admission.task_context_packet_fingerprint &&
    attachment.current_work_fingerprint === admission.current_work_fingerprint &&
    attachment.project_execution_admission_fingerprint === admission.admission_fingerprint &&
    attachment.worktree_observation_fingerprint === admission.worktree_observation?.observation_fingerprint &&
    attachment.managed_run_state_fingerprint === admission.managed_run_state_fingerprint;
}

function classifyStaleReason(
  attachment: RepositoryExecutionAttachmentV01,
  admission: ProjectExecutionAdmissionV01,
  now: string,
): RepositoryExecutionAttachmentStaleReasonV01 | null {
  if (Date.parse(now) >= Date.parse(attachment.freshness_policy.expires_at)) return "freshness_expired";
  if (admission.reason === "project_unavailable") return "project_unavailable";
  if (admission.reason === "physical_root_mismatch" || admission.reason.startsWith("identity_")) return "physical_root_mismatch";
  if (admission.reason === "managed_run_conflict") return "managed_run_conflict";
  if (
    admission.reason === "worktree_unavailable" ||
    admission.reason === "worktree_ambiguous" ||
    admission.reason === "non_git_execution_unsupported"
  ) return "worktree_changed";
  if (attachment.root_binding_fingerprint !== admission.root_binding_fingerprint) return "root_binding_changed";
  if (attachment.physical_root_baseline_fingerprint !== admission.physical_root_baseline_fingerprint) return "physical_root_mismatch";
  if (attachment.task_context_packet_id !== admission.task_context_packet_id ||
      attachment.task_context_packet_fingerprint !== admission.task_context_packet_fingerprint) return "packet_changed";
  if (attachment.current_work_fingerprint !== admission.current_work_fingerprint) return "current_work_changed";
  if (attachment.worktree_observation_fingerprint !== admission.worktree_observation?.observation_fingerprint) return "worktree_changed";
  if (attachment.managed_run_state_fingerprint !== admission.managed_run_state_fingerprint) return "managed_run_conflict";
  return null;
}

function classifyDatabaseStateChangeV01(
  attachment: RepositoryExecutionAttachmentV01,
  state: ReturnType<typeof readExpectedDatabaseAdmissionStateV01>,
): RepositoryExecutionAttachmentStaleReasonV01 {
  if (!state.root_binding_fingerprint) return "project_unavailable";
  if (attachment.root_binding_fingerprint !== state.root_binding_fingerprint) {
    return "root_binding_changed";
  }
  if (
    attachment.physical_root_baseline_fingerprint !==
      state.physical_root_baseline_fingerprint
  ) return "physical_root_mismatch";
  if (
    state.managed_run_conflict ||
    attachment.managed_run_state_fingerprint !==
      state.managed_run_state_fingerprint
  ) return "managed_run_conflict";
  if (
    attachment.task_context_packet_id !== state.task_context_packet_id ||
    attachment.task_context_packet_fingerprint !==
      state.task_context_packet_fingerprint
  ) return "packet_changed";
  if (attachment.current_work_fingerprint !== state.current_work_fingerprint) {
    return "current_work_changed";
  }
  return "project_unavailable";
}

function preparedResult(
  project: RepositoryExecutionPreparationV01["project"],
  admission: ProjectExecutionAdmissionV01,
  attachment: RepositoryExecutionAttachmentV01,
): RepositoryExecutionPreparationV01 {
  const label = project?.display_name ?? "This project";
  return {
    preparation_version: "repository_execution_preparation.v0.1",
    status: "prepared",
    reason: "ready",
    project,
    ordinary_text: `${label} is ready to continue.`,
    attachment,
    admission,
    decision_request: null,
    authority: REPOSITORY_EXECUTION_AUTHORITY_BOUNDARY_V01,
  };
}

function ordinaryBlockedText(
  reason: ProjectExecutionAdmissionReasonV01,
  displayName: string | null,
): string {
  const label = displayName ?? "This project";
  if (reason === "baseline_adoption_required") {
    return `Confirm this folder as ${label}'s trusted execution root.`;
  }
  if (reason === "physical_root_mismatch") {
    return `${label}'s folder identity has changed. Choose the intended folder to continue.`;
  }
  if (reason === "identity_unsupported" || reason === "identity_ambiguous") {
    return `${label}'s folder identity cannot be established on this filesystem.`;
  }
  if (reason === "non_git_execution_unsupported") {
    return `${label} remains available for continuity, but managed repository execution requires bounded Git worktree evidence.`;
  }
  if (reason === "worktree_ambiguous" || reason === "worktree_unavailable") {
    return `${label}'s worktree cannot be bounded exactly, so execution preparation is blocked.`;
  }
  if (reason === "admission_state_changed") {
    return `${label} changed during preparation. Retry from its current state.`;
  }
  return `${label} is not ready to continue.`;
}

function isStableFilesystemIdentity(device: string, inode: string): boolean {
  return /^\d+$/u.test(device) && /^\d+$/u.test(inode) && device !== "0" && inode !== "0";
}

function databaseScopeRoot(db: Database.Database): string {
  if (!db.name || db.name === ":memory:") {
    throw new RepositoryExecutionErrorV01("local_node_scope_unavailable", 409);
  }
  return path.dirname(path.resolve(db.name));
}

function classifyFilesystemType(
  type: number | bigint,
  platform: "darwin" | "linux",
): null | {
  status: "identity_unsupported" | "identity_ambiguous";
  reason: string;
} {
  const value = BigInt(type);
  if (platform === "darwin") {
    // Darwin's statfs(2) exposes the registered VFS type number. Keep this
    // allow/refusal boundary explicit because Node does not expose f_fstypename
    // or the MNT_LOCAL flag.
    const network = new Set([
      BigInt(2), // NFS
      BigInt(13), // AFS
      BigInt(22), // WebDAV
      BigInt(24), // AFP
      BigInt(27), // CIFS/SMB
    ]);
    if (network.has(value)) {
      return {
        status: "identity_unsupported",
        reason: "network_filesystem_identity_unsupported",
      };
    }
    const virtual = new Set([
      BigInt(7), // fdesc
      BigInt(9), // null/loopback
      BigInt(11), // kernfs
      BigInt(12), // procfs
      BigInt(15), // union
      BigInt(19), // devfs
    ]);
    return virtual.has(value)
      ? {
          status: "identity_ambiguous",
          reason: "virtual_filesystem_identity_ambiguous",
        }
      : null;
  }
  const unsupportedNetwork = new Set([
    BigInt("0x6969"), // Linux NFS
    BigInt("0xff534d42"), // Linux CIFS/SMB
    BigInt("0x517b"), // SMB
    BigInt("0x01021997"), // 9P
  ]);
  if (unsupportedNetwork.has(value)) {
    return { status: "identity_unsupported", reason: "network_filesystem_identity_unsupported" };
  }
  const ambiguousVirtual = new Set([
    BigInt("0x65735546"), // FUSE
    BigInt("0x794c7630"), // overlayfs
  ]);
  return ambiguousVirtual.has(value)
    ? { status: "identity_ambiguous", reason: "virtual_filesystem_identity_ambiguous" }
    : null;
}
