#!/usr/bin/env node
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, renameSync, symlinkSync, unlinkSync } from "node:fs";
import { open as openFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import Database from "better-sqlite3";

import { applyCanonicalDatabaseMigrations } from "./canonical-database-migrations.mjs";
import { vNextProjectLifecycleSchemaSqlV01 } from "./db-migrations.mjs";
import {
  projectFolderPickerMessageV01,
  projectFolderSelectionErrorMessageV01,
} from "../lib/vnext/blank-state/blank-state-view";
import {
  chooseLocalProjectFolderV01,
  abandonPreparedLocalProjectSelectionV01,
  abandonPreparedLocalProjectRecoverySelectionV01,
  confirmLocalProjectOnboardingV01,
  declareAndInspectLocalProjectRecoveryV01,
  declareAndInspectLocalProjectV01,
  inspectLocalProjectRootV01,
  listRecentProjectsV01,
  openRecoveredLocalProjectFromSelectionV01,
  openRecentProjectV01,
  pickAndInspectLocalProjectRecoveryV01,
  pickAndInspectLocalProjectV01,
  previewLocalProjectRootRebindFromSelectionV01,
  readProjectDestinationV01,
  readPreparedLocalProjectSelectionBindingV01,
  readRootAvailabilityV01,
  rebindLocalProjectRootFromSelectionV01,
  renameActiveProjectDisplayNameV01,
  removeProjectFromRecentV01,
  sanitizeRepositoryRemoteV01,
  type LocalProjectMetadataFileReaderV01,
} from "../lib/vnext/onboarding/local-project-onboarding";
import {
  abandonLocalProjectOnboardingSessionV01,
  confirmLocalProjectOnboardingFromBrowserSessionV01,
  issueLocalProjectOnboardingChallengeV01,
  issueLocalProjectOnboardingSessionV01,
  readLocalProjectOnboardingCredentialFromRequestV01,
  serializeLocalProjectOnboardingCookieV01,
} from "../lib/vnext/onboarding/local-project-onboarding-decision";
import {
  LOCAL_PROJECT_DECLARED_PATH_MAX_BYTES_V01,
  parseLocalProjectPathDeclarationV01,
} from "../lib/vnext/onboarding/local-project-path-declaration";
import { getOrCreateDefaultWorkspaceIdentityV01, VNEXT_PROJECT_IDENTITY_REGISTRY_SCHEMA_SQL_V01 } from "../lib/vnext/persistence/project-identity-registry";
import { VNEXT_PROJECT_LIFECYCLE_SCHEMA_SQL_V01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import {
  authorizeRepositoryExecutionDecisionFromBrowserSessionInsideTransactionV01,
  fingerprintProjectRootBindingV01,
  grantRepositoryExecutionDecisionFromBrowserSessionV01,
  type RepositoryExecutionDependenciesV01,
} from "../lib/vnext/repository-execution/repository-execution";
import {
  clearVNextRecoveryRepositoryDecisionProcessScopesV01,
  consumeVNextLocalOperatorBootstrapV01,
  issueVNextLocalOperatorBootstrapV01,
  issueVNextRepositoryDecisionChallengeV01,
  readVNextRecoveryRepositoryDecisionCredentialFromRequestV01,
  readVNextRepositoryDecisionCredentialFromRequestV01,
  serializeVNextRepositoryDecisionSessionCookieV01,
  VNEXT_LOCAL_OPERATOR_MAX_COOKIE_HEADER_CHARACTERS_V01,
} from "../lib/vnext/runtime/local-operator-session";
import { POST as projectRoutePost } from "../app/api/vnext/projects/route";

const root = mkdtempSync(path.join(tmpdir(), "augnes-project-onboarding-"));
const dbPath = path.join(root, "onboarding.db");
const folderA = path.join(root, "Project A ü");
const folderB = path.join(root, "Project B");
const folderA2 = path.join(root, "Project A moved");
const folderA3 = path.join(root, "Project A moved again");
const folderA4 = path.join(root, "Project A moved with general session");
const folderNoRemote = path.join(root, "Git without remote");
const worktreeFolder = path.join(root, "Git worktree fixture");
const worktreeGitDir = path.join(root, "worktree metadata");
const disappearingFolder = path.join(root, "Disappearing selection");
const staleFolder = path.join(root, "Stale project C");
const nullConflictFolder = path.join(root, "Null conflict project D");
const plainDefaultFolder = path.join(root, "Plain default project");
const plainEditedFolder = path.join(root, "Plain edited folder");
const invalidNameFolder = path.join(root, "Invalid name folder");
const declaredUnicodeFolder = path.join(root, "선언 경로 Project ü");
const abandonmentRaceFolderA = path.join(root, "Abandonment race A");
const abandonmentRaceFolderB = path.join(root, "Abandonment race B");
const ordinaryCancelFolder = path.join(root, "Ordinary cancel");
const failedAbandonmentFolder = path.join(root, "Failed abandonment transport");
mkdirSync(folderA); mkdirSync(folderB); mkdirSync(folderA2); mkdirSync(folderNoRemote);
mkdirSync(worktreeFolder); mkdirSync(worktreeGitDir); mkdirSync(disappearingFolder);
mkdirSync(staleFolder); mkdirSync(nullConflictFolder);
mkdirSync(plainDefaultFolder); mkdirSync(plainEditedFolder); mkdirSync(invalidNameFolder);
mkdirSync(declaredUnicodeFolder); mkdirSync(abandonmentRaceFolderA);
mkdirSync(abandonmentRaceFolderB); mkdirSync(ordinaryCancelFolder);
mkdirSync(failedAbandonmentFolder);
const originalEnvironment = { ...process.env };
const MAX_GIT_METADATA_BYTES = 64 * 1024;
const MAX_REQUEST_BODY_BYTES = 16 * 1024;

function sizedText(prefix: string, byteLength: number): string {
  const remaining = byteLength - Buffer.byteLength(prefix);
  assert(remaining >= 0);
  return prefix + "#".repeat(remaining);
}

function createTrackingMetadataReader(metrics: {
  bytes_read: number;
  read_lengths: number[];
  opened: number;
  closed: number;
}): LocalProjectMetadataFileReaderV01 {
  return {
    async open(file) {
      const handle = await openFile(file, "r");
      metrics.opened += 1;
      return {
        async read(buffer, offset, length, position) {
          metrics.read_lengths.push(length);
          const result = await handle.read(buffer, offset, length, position);
          metrics.bytes_read += result.bytesRead;
          return { bytesRead: result.bytesRead };
        },
        async close() {
          metrics.closed += 1;
          await handle.close();
        },
      };
    },
  };
}

function activeSnapshot(entries: Awaited<ReturnType<typeof listRecentProjectsV01>>) {
  const entry = entries[0];
  return {
    expected_project_id: entry?.active_project_id ?? null,
    expected_revision: entry?.active_selection_revision ?? null,
  };
}

function recoveryScopeV01(entry: Awaited<ReturnType<typeof listRecentProjectsV01>>[number]) {
  return {
    project_id: entry.project.project_id,
    expected_old_root_binding_fingerprint: entry.root_binding_fingerprint,
    expected_old_baseline_fingerprint:
      entry.physical_root_baseline_fingerprint,
    expected_active_project_id: entry.active_project_id,
    expected_active_selection_revision: entry.active_selection_revision,
  };
}

async function rebindWithBrowserDecisionV01(
  db: Database.Database,
  input: Omit<
    Parameters<typeof rebindLocalProjectRootFromSelectionV01>[1],
    "decision_request_fingerprint"
  >,
  options: { now?: () => string; now_ms?: () => number } = {},
) {
  const preview = await previewLocalProjectRootRebindFromSelectionV01(
    db,
    input,
    options,
  );
  const now = (options.now ?? (() => new Date().toISOString()))();
  const config = {
    enabled: true as const,
    workspace_id: preview.workspace_id,
    project_id: preview.project_id,
    operator_id: "operator:project-onboarding-rebind",
    database_path: dbPath,
  };
  const base = Date.parse(now);
  const bootstrap = issueVNextLocalOperatorBootstrapV01(db, {
    config,
    clock: { now: () => new Date(base - 2_000).toISOString() },
  });
  const session = consumeVNextLocalOperatorBootstrapV01(db, {
    config,
    bootstrap_token: bootstrap.bootstrap_token,
    clock: { now: () => new Date(base - 1_000).toISOString() },
  });
  const decisionSession = session.repository_decision_session;
  const challenge = issueVNextRepositoryDecisionChallengeV01(db, {
    workspace_id: preview.workspace_id,
    project_id: preview.project_id,
    request_fingerprint: preview.decision_request!.request_fingerprint,
    credential: decisionSession.credential,
    clock: { now: () => now },
  });
  return rebindLocalProjectRootFromSelectionV01(
    db,
    {
      ...input,
      decision_request_fingerprint:
        preview.decision_request!.request_fingerprint,
    },
    {
      ...options,
      authorize_decision_inside_transaction: () => {
        const authorized =
          authorizeRepositoryExecutionDecisionFromBrowserSessionInsideTransactionV01(
            db,
            {
              workspace_id: preview.workspace_id,
              project_id: preview.project_id,
              request_fingerprint:
                preview.decision_request!.request_fingerprint,
              challenge_fingerprint: challenge.challenge_fingerprint,
              credential: decisionSession.credential,
            },
            { now: () => now },
          );
        assert(authorized.decision.grant_fingerprint);
        return {
          grant_fingerprint: authorized.decision.grant_fingerprint,
        };
      },
    },
  );
}

async function main() {
try {
  assert.deepEqual(
    parseLocalProjectPathDeclarationV01(declaredUnicodeFolder, {
      platform: "darwin",
    }),
    {
      declaration_version: "local_project_path_declaration.v0.1",
      absolute_path: declaredUnicodeFolder,
      path_flavor: "posix",
    },
  );
  const literalShellPath = "/tmp/$HOME/$(touch should-not-run)-[glob]*";
  assert.equal(
    parseLocalProjectPathDeclarationV01(literalShellPath, {
      platform: "darwin",
    }).absolute_path,
    literalShellPath,
  );
  assert.throws(() => parseLocalProjectPathDeclarationV01("", { platform: "darwin" }), /path_declaration_empty/);
  assert.throws(() => parseLocalProjectPathDeclarationV01("   ", { platform: "darwin" }), /path_declaration_relative/);
  assert.throws(() => parseLocalProjectPathDeclarationV01("relative/project", { platform: "darwin" }), /path_declaration_relative/);
  assert.throws(() => parseLocalProjectPathDeclarationV01("~/project", { platform: "darwin" }), /path_declaration_relative/);
  assert.throws(() => parseLocalProjectPathDeclarationV01("$HOME/project", { platform: "darwin" }), /path_declaration_relative/);
  assert.throws(() => parseLocalProjectPathDeclarationV01("https://example.test/project", { platform: "darwin" }), /path_declaration_url/);
  assert.throws(() => parseLocalProjectPathDeclarationV01("file:///tmp/project", { platform: "darwin" }), /path_declaration_url/);
  assert.throws(() => parseLocalProjectPathDeclarationV01("/tmp/project\0name", { platform: "darwin" }), /path_declaration_control_character/);
  assert.throws(() => parseLocalProjectPathDeclarationV01("/tmp/project\u007fname", { platform: "darwin" }), /path_declaration_control_character/);
  const exactDeclaredPathLimit = `/${"경".repeat(Math.floor((LOCAL_PROJECT_DECLARED_PATH_MAX_BYTES_V01 - 1) / 3))}${"x".repeat((LOCAL_PROJECT_DECLARED_PATH_MAX_BYTES_V01 - 1) % 3)}`;
  assert.equal(Buffer.byteLength(exactDeclaredPathLimit), LOCAL_PROJECT_DECLARED_PATH_MAX_BYTES_V01);
  assert.equal(parseLocalProjectPathDeclarationV01(exactDeclaredPathLimit, { platform: "darwin" }).absolute_path, exactDeclaredPathLimit);
  assert.throws(() => parseLocalProjectPathDeclarationV01(`${exactDeclaredPathLimit}x`, { platform: "darwin" }), /path_declaration_too_large/);
  assert.equal(
    parseLocalProjectPathDeclarationV01("C:\\Users\\Augnes Project\\이어짐", { platform: "win32" }).path_flavor,
    "windows",
  );
  assert.equal(
    parseLocalProjectPathDeclarationV01("\\\\?\\C:\\Users\\Augnes\\Long path", { platform: "win32" }).absolute_path,
    "\\\\?\\C:\\Users\\Augnes\\Long path",
  );
  assert.throws(() => parseLocalProjectPathDeclarationV01("\\\\server\\share\\project", { platform: "win32" }), /path_declaration_unsupported/);
  assert.throws(() => parseLocalProjectPathDeclarationV01("/tmp/project", { platform: "linux" }), /path_declaration_unsupported/);

  const decisionBinding = {
    selection_token: "declared-candidate-a",
    inspection_fingerprint: `sha256:${"1".repeat(64)}`,
    expected_active_project_id: null,
    expected_active_selection_revision: null,
  };
  const secretValues = ["credential-a", "nonce-a", "challenge-a", "nonce-b"];
  const issuedSession = issueLocalProjectOnboardingSessionV01(
    decisionBinding,
    { create_session_id: () => "session-a", create_secret: () => secretValues.shift()! },
  );
  const initialCookie = serializeLocalProjectOnboardingCookieV01({
    credential: issuedSession.credential,
    expires_at: issuedSession.expires_at,
    secure: false,
  });
  assert.match(initialCookie, /HttpOnly/u);
  assert.match(initialCookie, /SameSite=Strict/u);
  const parsedCredential = readLocalProjectOnboardingCredentialFromRequestV01(
    new Request("http://127.0.0.1/api/vnext/projects", {
      headers: { cookie: initialCookie.split(";")[0] },
    }),
  );
  assert.deepEqual(parsedCredential, issuedSession.credential);
  const challenged = issueLocalProjectOnboardingChallengeV01({
    ...decisionBinding,
    display_name: "이어지는 프로젝트",
    credential: issuedSession.credential,
  }, { create_secret: () => secretValues.shift()! });
  assert.throws(() => issueLocalProjectOnboardingChallengeV01({
    ...decisionBinding,
    display_name: "이어지는 프로젝트",
    credential: issuedSession.credential,
  }), /onboarding_confirmation_invalid|onboarding_confirmation_conflict/);
  const decisionResult = {
    status: "created" as const,
    project: {
      project_identity_version: "project_identity.v0.1" as const,
      identity_kind: "canonical" as const,
      identity_source: "canonical_registry" as const,
      workspace_id: "workspace:decision-test",
      project_id: "project:decision-test",
      display_name: "이어지는 프로젝트",
      created_at: "2026-08-06T00:00:00.000Z",
    },
    destination: "/projects/project%3Adecision-test",
  };
  let releaseDecision!: (value: typeof decisionResult) => void;
  let decisionExecutions = 0;
  const executeDecision = () => {
    decisionExecutions += 1;
    return new Promise<typeof decisionResult>((resolve) => {
      releaseDecision = resolve;
    });
  };
  const confirmationInput = {
    selection_token: decisionBinding.selection_token,
    inspection_fingerprint: decisionBinding.inspection_fingerprint,
    display_name: "이어지는 프로젝트",
    challenge_fingerprint: challenged.confirmation.challenge_fingerprint,
    credential: challenged.credential,
  };
  const concurrentA = confirmLocalProjectOnboardingFromBrowserSessionV01(
    confirmationInput,
    executeDecision,
  );
  const concurrentB = confirmLocalProjectOnboardingFromBrowserSessionV01(
    confirmationInput,
    executeDecision,
  );
  assert.equal(decisionExecutions, 1);
  releaseDecision(decisionResult);
  assert.deepEqual(await concurrentA, decisionResult);
  assert.deepEqual(await concurrentB, decisionResult);
  assert.deepEqual(
    await confirmLocalProjectOnboardingFromBrowserSessionV01(
      confirmationInput,
      executeDecision,
    ),
    decisionResult,
  );
  assert.equal(decisionExecutions, 1, "exact successful replay must not execute onboarding twice");
  await assert.rejects(
    confirmLocalProjectOnboardingFromBrowserSessionV01(
      { ...confirmationInput, display_name: "changed after challenge" },
      executeDecision,
    ),
    /onboarding_confirmation_conflict/,
  );
  const crossSecrets = ["credential-b", "nonce-c", "challenge-b", "nonce-d"];
  const crossSession = issueLocalProjectOnboardingSessionV01({
    ...decisionBinding,
    selection_token: "declared-candidate-b",
  }, {
    create_session_id: () => "session-b",
    create_secret: () => crossSecrets.shift()!,
  });
  const crossChallenge = issueLocalProjectOnboardingChallengeV01({
    ...decisionBinding,
    selection_token: "declared-candidate-b",
    display_name: "Second project",
    credential: crossSession.credential,
  }, { create_secret: () => crossSecrets.shift()! });
  await assert.rejects(
    confirmLocalProjectOnboardingFromBrowserSessionV01({
      ...confirmationInput,
      credential: crossChallenge.credential,
    }, executeDecision),
    /onboarding_confirmation_conflict/,
  );
  const abandonmentBindingA = {
    ...decisionBinding,
    selection_token: "abandonment-candidate-a",
  };
  const abandonmentBindingB = {
    ...decisionBinding,
    selection_token: "abandonment-candidate-b",
  };
  const abandonmentSessionA = issueLocalProjectOnboardingSessionV01(
    abandonmentBindingA,
    {
      create_session_id: () => "abandonment-session-a",
      create_secret: (() => {
        const values = ["abandonment-credential-a", "abandonment-nonce-a"];
        return () => values.shift()!;
      })(),
    },
  );
  const abandonmentSessionB = issueLocalProjectOnboardingSessionV01(
    abandonmentBindingB,
    {
      create_session_id: () => "abandonment-session-b",
      create_secret: (() => {
        const values = ["abandonment-credential-b", "abandonment-nonce-b"];
        return () => values.shift()!;
      })(),
    },
  );
  assert.equal(
    abandonLocalProjectOnboardingSessionV01(
      abandonmentSessionB.credential,
      abandonmentBindingA.selection_token,
    ),
    false,
    "an older candidate token must not invalidate a newer credential",
  );
  const abandonmentChallengeB = issueLocalProjectOnboardingChallengeV01({
    ...abandonmentBindingB,
    display_name: "Abandonment candidate B",
    credential: abandonmentSessionB.credential,
  }, {
    create_secret: (() => {
      const values = ["abandonment-challenge-b", "abandonment-next-nonce-b"];
      return () => values.shift()!;
    })(),
  });
  assert.equal(
    abandonLocalProjectOnboardingSessionV01(
      abandonmentSessionA.credential,
      abandonmentBindingA.selection_token,
    ),
    true,
  );
  assert.throws(() => issueLocalProjectOnboardingChallengeV01({
    ...abandonmentBindingA,
    display_name: "Abandonment candidate A",
    credential: abandonmentSessionA.credential,
  }), /onboarding_confirmation_invalid/);
  assert.equal(
    abandonLocalProjectOnboardingSessionV01(
      abandonmentChallengeB.credential,
      abandonmentBindingB.selection_token,
    ),
    true,
  );
  const failingSecrets = ["credential-c", "nonce-e", "challenge-c", "nonce-f"];
  const failingSession = issueLocalProjectOnboardingSessionV01({
    ...decisionBinding,
    selection_token: "declared-candidate-c",
  }, {
    create_session_id: () => "session-c",
    create_secret: () => failingSecrets.shift()!,
  });
  const failingChallenge = issueLocalProjectOnboardingChallengeV01({
    ...decisionBinding,
    selection_token: "declared-candidate-c",
    display_name: "Invalid project",
    credential: failingSession.credential,
  }, { create_secret: () => failingSecrets.shift()! });
  const failingInput = {
    selection_token: "declared-candidate-c",
    inspection_fingerprint: decisionBinding.inspection_fingerprint,
    display_name: "Invalid project",
    challenge_fingerprint: failingChallenge.confirmation.challenge_fingerprint,
    credential: failingChallenge.credential,
  };
  await assert.rejects(
    confirmLocalProjectOnboardingFromBrowserSessionV01(
      failingInput,
      async () => { throw new Error("validation_failed"); },
    ),
    /validation_failed/,
  );
  await assert.rejects(
    confirmLocalProjectOnboardingFromBrowserSessionV01(
      failingInput,
      async () => decisionResult,
    ),
    /onboarding_confirmation_invalid/,
  );

  const commands: Array<{ command: string; args: readonly string[] }> = [];
  const selected = await chooseLocalProjectFolderV01({ platform: "darwin", process: {
    async run(command, args) { commands.push({ command, args }); return { stdout: `${folderA}\n` }; },
  }});
  assert.deepEqual(selected, { status: "selected", absolute_path: folderA });
  assert.equal(commands[0].command, "/usr/bin/osascript");
  assert.equal(commands[0].args.includes(folderA), false, "selected paths must never enter process arguments");
  const windowsCommands: string[] = [];
  await chooseLocalProjectFolderV01({ platform: "win32", process: { async run(command) { windowsCommands.push(command); return { stdout: folderA }; } } });
  assert.deepEqual(windowsCommands, ["powershell.exe"]);
  const linuxCommands: string[] = [];
  await chooseLocalProjectFolderV01({ platform: "linux", process: { async run(command) { linuxCommands.push(command); return { stdout: folderA }; } } });
  assert.deepEqual(linuxCommands, ["zenity"]);
  assert.equal((await chooseLocalProjectFolderV01({ platform: "freebsd" })).status, "unavailable");
  assert.equal((await chooseLocalProjectFolderV01({ platform: "freebsd", environment: { NODE_ENV: "production", AUGNES_TEST_FOLDER_PICKER_PATH: folderA } })).status, "unavailable");
  assert.equal((await chooseLocalProjectFolderV01({ platform: "freebsd", environment: { NODE_ENV: "production", AUGNES_TEST_FOLDER_PICKER_OUTCOME: "cancelled" } })).status, "unavailable");
  assert.equal((await chooseLocalProjectFolderV01({ platform: "freebsd", environment: { NODE_ENV: "test", AUGNES_CANONICAL_TEST_MODE: "1", AUGNES_CANONICAL_TEMP_ROOT: root, AUGNES_TEST_FOLDER_PICKER_OUTCOME: "cancelled" } })).status, "cancelled");
  const pickerSequencePath = path.join(root, "folder-picker-sequence.json");
  const pickerSequenceEnvironment: NodeJS.ProcessEnv = {
    NODE_ENV: "test",
    AUGNES_CANONICAL_TEST_MODE: "1",
    AUGNES_CANONICAL_TEMP_ROOT: root,
    AUGNES_TEST_FOLDER_PICKER_SEQUENCE_PATH: pickerSequencePath,
  };
  writeFileSync(pickerSequencePath, JSON.stringify({
    sequence_version: "augnes_canonical_folder_picker_sequence.v0.1",
    next_index: 0,
    entries: [
      { id: "cancel", outcome: "cancelled" },
      { id: "first", outcome: "selected", absolute_path: folderA },
      { id: "second", outcome: "selected", absolute_path: folderB },
      { id: "pending", outcome: "pending_until_abort" },
    ],
  }));
  assert.deepEqual(await chooseLocalProjectFolderV01({ platform: "freebsd", environment: pickerSequenceEnvironment }), { status: "cancelled" });
  assert.deepEqual(await chooseLocalProjectFolderV01({ platform: "freebsd", environment: pickerSequenceEnvironment }), { status: "selected", absolute_path: folderA });
  assert.deepEqual(await chooseLocalProjectFolderV01({ platform: "freebsd", environment: pickerSequenceEnvironment }), { status: "selected", absolute_path: folderB });
  const canonicalPendingAbort = new AbortController();
  canonicalPendingAbort.abort();
  assert.deepEqual(await chooseLocalProjectFolderV01({
    platform: "freebsd",
    environment: pickerSequenceEnvironment,
    signal: canonicalPendingAbort.signal,
  }), { status: "cancelled" });
  assert.deepEqual(await chooseLocalProjectFolderV01({ platform: "freebsd", environment: pickerSequenceEnvironment }), { status: "error", error_code: "picker_failed" });
  assert.equal((await chooseLocalProjectFolderV01({ platform: "freebsd", environment: { NODE_ENV: "production", AUGNES_TEST_FOLDER_PICKER_SEQUENCE_PATH: pickerSequencePath } })).status, "unavailable", "the sequence seam must be inaccessible outside canonical mode");
  writeFileSync(pickerSequencePath, "{malformed");
  assert.deepEqual(await chooseLocalProjectFolderV01({ platform: "freebsd", environment: pickerSequenceEnvironment }), { status: "error", error_code: "picker_failed" });
  writeFileSync(pickerSequencePath, JSON.stringify({ sequence_version: "augnes_canonical_folder_picker_sequence.v0.1", next_index: 0, entries: [{ id: "escape", outcome: "selected", absolute_path: tmpdir() }] }));
  assert.deepEqual(await chooseLocalProjectFolderV01({ platform: "freebsd", environment: pickerSequenceEnvironment }), { status: "error", error_code: "picker_failed" });
  writeFileSync(pickerSequencePath, JSON.stringify({ sequence_version: "augnes_canonical_folder_picker_sequence.v0.1", next_index: 0, entries: [{ id: "duplicate", outcome: "cancelled" }, { id: "duplicate", outcome: "cancelled" }] }));
  assert.deepEqual(await chooseLocalProjectFolderV01({ platform: "freebsd", environment: pickerSequenceEnvironment }), { status: "error", error_code: "picker_failed" });
  const symlinkedSelection = path.join(root, "symlinked-picker-selection");
  symlinkSync(folderA, symlinkedSelection, process.platform === "win32" ? "junction" : "dir");
  writeFileSync(pickerSequencePath, JSON.stringify({ sequence_version: "augnes_canonical_folder_picker_sequence.v0.1", next_index: 0, entries: [{ id: "symlinked-selection", outcome: "selected", absolute_path: symlinkedSelection }] }));
  assert.deepEqual(await chooseLocalProjectFolderV01({ platform: "freebsd", environment: pickerSequenceEnvironment }), { status: "error", error_code: "picker_failed" });
  const realSequencePath = path.join(root, "real-folder-picker-sequence.json");
  writeFileSync(realSequencePath, JSON.stringify({ sequence_version: "augnes_canonical_folder_picker_sequence.v0.1", next_index: 0, entries: [{ id: "cancel-via-symlink", outcome: "cancelled" }] }));
  unlinkSync(pickerSequencePath);
  const pickerSequenceFileSymlinkRefusalVerified = process.platform !== "win32";
  if (pickerSequenceFileSymlinkRefusalVerified) {
    symlinkSync(realSequencePath, pickerSequencePath);
    assert.deepEqual(await chooseLocalProjectFolderV01({ platform: "freebsd", environment: pickerSequenceEnvironment }), { status: "error", error_code: "picker_failed" });
  }
  assert.equal((await chooseLocalProjectFolderV01({ platform: "linux", process: { async run() { const error = new Error("cancelled") as Error & { code: number }; error.code = 1; throw error; } } })).status, "cancelled");
  assert.deepEqual(await chooseLocalProjectFolderV01({ platform: "darwin", process: { async run() { const error = new Error("timeout") as Error & { code: string }; error.code = "ETIMEDOUT"; throw error; } } }), { status: "error", error_code: "picker_timeout" });
  assert.deepEqual(await chooseLocalProjectFolderV01({ platform: "darwin", process: { async run() { const error = Object.assign(new Error("killed"), { code: null, killed: true, signal: "SIGKILL" }); throw error; } } }), { status: "error", error_code: "picker_timeout" });
  assert.deepEqual(await chooseLocalProjectFolderV01({ platform: "darwin", process: { async run() { const error = Object.assign(new Error("bounded"), { code: "ERR_CHILD_PROCESS_STDIO_MAXBUFFER" }); throw error; } } }), { status: "error", error_code: "picker_failed" });
  const pickerAbortController = new AbortController();
  let pickerAbortListeners = 0;
  const abortedPicker = chooseLocalProjectFolderV01({
    platform: "darwin",
    signal: pickerAbortController.signal,
    process: {
      async run(_command, _args, _timeout, signal) {
        return new Promise<{ stdout: string }>((_resolve, reject) => {
          const onAbort = () => {
            signal?.removeEventListener("abort", onAbort);
            pickerAbortListeners -= 1;
            reject(Object.assign(new Error("aborted"), { code: "ABORT_ERR" }));
          };
          pickerAbortListeners += 1;
          signal?.addEventListener("abort", onAbort, { once: true });
        });
      },
    },
  });
  pickerAbortController.abort();
  assert.deepEqual(await abortedPicker, { status: "cancelled" });
  assert.equal(pickerAbortListeners, 0, "picker abort listeners must be removed");
  assert.equal(
    projectFolderPickerMessageV01({
      status: "selected",
      selection_token: "selection-token",
      selection_origin: "native_picker",
      inspection: {
        inspection_version: "local_project_inspection.v0.1",
        display_name: "Plain project",
        local_root: {
          local_root_ref_version: "local_project_root_ref.v0.1",
          ref_kind: "local_project_root",
          path_flavor: "posix",
          normalized_path: folderA,
        },
        folder_kind: "plain_folder",
        repository_ref: null,
        repository_display: null,
        repository_status: "not_repository",
        inspected_at: "2026-07-15T00:00:00.000Z",
        inspection_fingerprint: "inspection-fingerprint",
        physical_identity_status: "exact",
        physical_root_observation_fingerprint: "sha256:physical-observation",
        already_added: false,
        existing_project: null,
      },
    }),
    null,
    "valid plain and Git selections must not create an error message",
  );
  assert.deepEqual(
    projectFolderPickerMessageV01({ status: "cancelled" }),
    {
      tone: "info",
      text: "Folder selection was cancelled. Nothing changed.",
    },
  );
  assert.deepEqual(
    projectFolderPickerMessageV01({
      status: "error",
      error_code: "picker_timeout",
    }),
    {
      tone: "error",
      text: "The folder picker timed out before returning a selection. Try again.",
    },
  );
  assert.deepEqual(
    projectFolderPickerMessageV01({
      status: "error",
      error_code: "picker_failed",
    }),
    {
      tone: "error",
      text: "The folder picker could not be opened. Try again.",
    },
  );
  const missingSelectionMessage =
    projectFolderSelectionErrorMessageV01("selection_missing");
  const inaccessibleSelectionMessage =
    projectFolderSelectionErrorMessageV01("selection_inaccessible");
  const inspectionFailureMessage =
    projectFolderSelectionErrorMessageV01("inspection_failed");
  assert.match(missingSelectionMessage.text, /no longer available/u);
  assert.match(inaccessibleSelectionMessage.text, /cannot read/u);
  assert.match(inspectionFailureMessage.text, /could not inspect/u);
  assert.notEqual(
    missingSelectionMessage.text,
    projectFolderPickerMessageV01({
      status: "error",
      error_code: "picker_failed",
    })?.text,
  );
  for (const message of [
    missingSelectionMessage,
    inaccessibleSelectionMessage,
    inspectionFailureMessage,
  ]) {
    assert.equal(message.tone, "error");
    assert.doesNotMatch(
      message.text,
      /selection_missing|selection_inaccessible|inspection_failed/u,
    );
  }

  const regularFile = path.join(root, "not-a-directory.txt");
  writeFileSync(regularFile, "fixture");
  await assert.rejects(inspectLocalProjectRootV01(path.join(root, "missing")), /selection_missing/);
  await assert.rejects(inspectLocalProjectRootV01(regularFile), /selection_not_directory/);
  await assert.rejects(inspectLocalProjectRootV01(folderA, { filesystem: { async access() { throw Object.assign(new Error("denied"), { code: "EACCES" }); } } }), /selection_inaccessible/);

  const plain = await inspectLocalProjectRootV01(folderA, { now: () => "2026-07-15T00:00:00.000Z" });
  assert.equal(plain.folder_kind, "plain_folder");
  assert.equal(plain.display_name, "Project A ü");
  mkdirSync(path.join(folderA, ".git"));
  const credentialRemote = "https://credential-user:credential-password@example.test/shared/repo.git?access_token=top-secret&token=second-secret#secret-fragment";
  const removedCredentialMaterial = ["credential-user", "credential-password", "access_token", "top-secret", "token=", "second-secret", "secret-fragment"];
  writeFileSync(path.join(folderA, ".git", "config"), `[remote "origin"]\n  url = ${credentialRemote}\n`);
  const git = await inspectLocalProjectRootV01(folderA, { now: () => "2026-07-15T00:00:01.000Z" });
  assert.equal(git.folder_kind, "git_repository");
  assert.equal(git.repository_display, "https://example.test/shared/repo.git");
  assert.equal(git.repository_ref?.external_id, "https://example.test/shared/repo.git");
  for (const secret of removedCredentialMaterial) assert.equal(JSON.stringify(git).includes(secret), false);
  const remoteCases = [
    ["https://credential-user:credential-password@example.test/org/repo.git", "https://example.test/org/repo.git"],
    ["https://example.test/org/repo.git?access_token=secret", "https://example.test/org/repo.git"],
    ["https://example.test/org/repo.git?token=secret", "https://example.test/org/repo.git"],
    ["https://example.test/org/repo.git?first=secret&second=other", "https://example.test/org/repo.git"],
    ["https://example.test/org/repo.git?token=secret%2Fencoded", "https://example.test/org/repo.git"],
    ["https://example.test/org/repo.git#secret-fragment", "https://example.test/org/repo.git"],
    ["https://example.test/org/repo.git?token=secret#secret-fragment", "https://example.test/org/repo.git"],
    ["ssh://credential-user:credential-password@example.test/org/repo.git?token=secret#fragment", "ssh://example.test/org/repo.git"],
    ["git://credential-user:credential-password@example.test/org/repo.git?token=secret#fragment", "git://example.test/org/repo.git"],
    ["git@example.test:org/repo.git?secret", "example.test:org/repo.git"],
    ["git@example.test:org/repo.git#secret", "example.test:org/repo.git"],
    ["git@example.test:org/repo.git", "example.test:org/repo.git"],
    ["https://example.test/org/repo.git", "https://example.test/org/repo.git"],
  ] as const;
  for (const [remote, expected] of remoteCases) {
    const sanitized = sanitizeRepositoryRemoteV01(remote);
    assert.equal(sanitized, expected);
    assert.equal(JSON.stringify(sanitized).includes("secret"), false);
    assert.equal(JSON.stringify(sanitized).includes("credential-password"), false);
  }
  mkdirSync(path.join(folderNoRemote, ".git"));
  writeFileSync(path.join(folderNoRemote, ".git", "config"), "[core]\n  bare = false\n");
  const noRemote = await inspectLocalProjectRootV01(folderNoRemote);
  assert.equal(noRemote.folder_kind, "git_repository");
  assert.equal(noRemote.repository_status, "no_remote");
  writeFileSync(path.join(worktreeFolder, ".git"), `gitdir: ${path.relative(worktreeFolder, worktreeGitDir)}\n`);
  writeFileSync(path.join(worktreeGitDir, "config"), `[remote "origin"]\n  url = git@example.test:shared/worktree.git\n`);
  const worktree = await inspectLocalProjectRootV01(worktreeFolder);
  assert.equal(worktree.folder_kind, "git_repository");
  assert.equal(worktree.repository_display, "example.test:shared/worktree.git");
  mkdirSync(path.join(folderB, ".git"));
  writeFileSync(path.join(folderB, ".git", "config"), `[remote "origin"]\n  url = https://example.test/shared/repo.git\n`);
  mkdirSync(path.join(staleFolder, ".git"));
  writeFileSync(path.join(staleFolder, ".git", "config"), `[remote "origin"]\n  url = https://example.test/stale/project.git\n`);

  const exactLimitRoot = path.join(root, "Git config exact limit");
  const oversizedRoot = path.join(root, "Git config over limit");
  const substantiallyOversizedRoot = path.join(root, "Git config substantially over limit");
  const oversizedPointerRoot = path.join(root, "Git pointer over limit");
  const oversizedCommonRoot = path.join(root, "Git commondir over limit");
  for (const fixture of [exactLimitRoot, oversizedRoot, substantiallyOversizedRoot, oversizedPointerRoot, oversizedCommonRoot]) mkdirSync(fixture);
  for (const fixture of [exactLimitRoot, oversizedRoot, substantiallyOversizedRoot, oversizedCommonRoot]) mkdirSync(path.join(fixture, ".git"));
  const configPrefix = `[remote "origin"]\n  url = https://example.test/bounded/repo.git\n`;
  writeFileSync(path.join(exactLimitRoot, ".git", "config"), sizedText(configPrefix, MAX_GIT_METADATA_BYTES));
  writeFileSync(path.join(oversizedRoot, ".git", "config"), sizedText(configPrefix, MAX_GIT_METADATA_BYTES + 1));
  writeFileSync(path.join(substantiallyOversizedRoot, ".git", "config"), sizedText(configPrefix, MAX_GIT_METADATA_BYTES * 4));
  writeFileSync(path.join(oversizedPointerRoot, ".git"), sizedText("gitdir: metadata\n", MAX_GIT_METADATA_BYTES + 1));
  writeFileSync(path.join(oversizedCommonRoot, ".git", "commondir"), sizedText("../metadata\n", MAX_GIT_METADATA_BYTES + 1));
  const successMetrics = { bytes_read: 0, read_lengths: [] as number[], opened: 0, closed: 0 };
  const exactLimitInspection = await inspectLocalProjectRootV01(exactLimitRoot, { metadata_reader: createTrackingMetadataReader(successMetrics) });
  assert.equal(exactLimitInspection.repository_display, "https://example.test/bounded/repo.git");
  assert.equal(successMetrics.opened, successMetrics.closed);
  assert.equal(successMetrics.bytes_read, MAX_GIT_METADATA_BYTES);
  assert(Math.max(...successMetrics.read_lengths) <= MAX_GIT_METADATA_BYTES + 1);
  for (const fixture of [oversizedRoot, substantiallyOversizedRoot, oversizedPointerRoot, oversizedCommonRoot]) {
    const metrics = { bytes_read: 0, read_lengths: [] as number[], opened: 0, closed: 0 };
    await assert.rejects(inspectLocalProjectRootV01(fixture, { metadata_reader: createTrackingMetadataReader(metrics) }), /inspection_failed/);
    assert.equal(metrics.opened, metrics.closed, "metadata handles must close after bounded-read failure");
    assert.equal(metrics.bytes_read, MAX_GIT_METADATA_BYTES + 1, "metadata reads must stop at the detection byte");
    assert(Math.max(...metrics.read_lengths) <= MAX_GIT_METADATA_BYTES + 1);
  }

  process.env.AUGNES_CANONICAL_TEST_MODE = "1";
  process.env.AUGNES_CANONICAL_TEMP_ROOT = root;
  const open = () => { const db = new Database(dbPath); db.pragma("foreign_keys = ON"); applyCanonicalDatabaseMigrations(db); return db; };
  process.env.AUGNES_DB_PATH = dbPath;
  const nonExactDbPath = path.join(root, "non-exact-preparation.db");
  const openNonExact = () => {
    const database = new Database(nonExactDbPath);
    database.pragma("foreign_keys = ON");
    applyCanonicalDatabaseMigrations(database);
    return database;
  };
  async function assertNonExactPreparationRefused(
    errorCode: "physical_identity_unsupported" | "physical_identity_ambiguous" | "physical_identity_unavailable",
    token: string,
    dependencies: RepositoryExecutionDependenciesV01,
  ) {
    await assert.rejects(
      declareAndInspectLocalProjectV01(plainDefaultFolder, {
        open_database: openNonExact,
        create_token: () => token,
        repository_execution_dependencies: dependencies,
      }),
      new RegExp(errorCode, "u"),
    );
    assert.throws(
      () => readPreparedLocalProjectSelectionBindingV01(token),
      /inspection_stale/,
      `${errorCode} must not allocate a prepared selection`,
    );
    const refusalDb = openNonExact();
    for (const table of [
      "vnext_workspace_identities",
      "vnext_project_identities",
      "vnext_project_root_bindings",
      "vnext_physical_root_baselines",
      "vnext_recent_projects",
      "vnext_active_project_selections",
    ]) {
      assert.equal(
        (refusalDb.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }).count,
        0,
        `${errorCode} must not mutate ${table}`,
      );
    }
    refusalDb.close();
  }
  await assertNonExactPreparationRefused(
    "physical_identity_unsupported",
    "unsupported-preparation-token",
    { platform: "freebsd" },
  );
  await assertNonExactPreparationRefused(
    "physical_identity_ambiguous",
    "ambiguous-preparation-token",
    {
      platform: "darwin",
      physical_identity_filesystem: {
        async realpath(pathname) { return pathname; },
        async stat() {
          return { dev: 0, ino: 0, isDirectory: () => true };
        },
      },
    },
  );
  await assertNonExactPreparationRefused(
    "physical_identity_unavailable",
    "unavailable-preparation-token",
    {
      platform: "darwin",
      physical_identity_filesystem: {
        async realpath() { throw new Error("identity unavailable"); },
        async stat() { throw new Error("identity unavailable"); },
      },
    },
  );
  assert.equal(
    projectFolderSelectionErrorMessageV01("physical_identity_unsupported").text,
    "That folder is on an unsupported filesystem or location.",
  );
  assert.equal(
    projectFolderSelectionErrorMessageV01("physical_identity_ambiguous").text,
    "Augnes cannot determine one exact local folder for that path.",
  );
  assert.equal(
    projectFolderSelectionErrorMessageV01("physical_identity_unavailable").text,
    "Augnes could not verify that folder at this time. Try again.",
  );
  process.env.AUGNES_TEST_FOLDER_PICKER_PATH = plainDefaultFolder;
  await assert.rejects(
    pickAndInspectLocalProjectV01({
      open_database: openNonExact,
      create_token: () => "native-picker-unsupported-token",
      repository_execution_dependencies: { platform: "freebsd" },
    }),
    /physical_identity_unsupported/,
  );
  assert.throws(
    () => readPreparedLocalProjectSelectionBindingV01(
      "native-picker-unsupported-token",
    ),
    /inspection_stale/,
    "the native picker shares the exact-identity preparation invariant",
  );
  const exactWindowsSelection = await declareAndInspectLocalProjectV01(
    plainDefaultFolder,
    {
      open_database: openNonExact,
      create_token: () => "exact-windows-preparation-token",
      repository_execution_dependencies: {
        platform: "win32",
        architecture: "x64",
        windows_physical_identity: async (pathname) => ({
          identity_version: "physical_root_identity.windows.v0.1",
          canonical_final_path_fingerprint: `sha256:${(
            pathname === plainDefaultFolder ? "a" : "b"
          ).repeat(64)}`,
          volume_serial_identity: "0000000000000001",
          file_id: pathname === plainDefaultFolder
            ? "00000000000000000000000000000001"
            : "00000000000000000000000000000002",
          filesystem_family: "NTFS",
          drive_type: "fixed",
        }),
      },
    },
  );
  assert.equal(exactWindowsSelection.inspection.physical_identity_status, "exact");
  abandonPreparedLocalProjectSelectionV01(exactWindowsSelection.selection_token);
  const declaredOriginCandidate = await declareAndInspectLocalProjectV01(
    plainDefaultFolder,
    { open_database: open, create_token: () => "declared-origin-candidate" },
  );
  assert.equal(declaredOriginCandidate.selection_origin, "declared_path");
  let originMismatchDb = open();
  await assert.rejects(confirmLocalProjectOnboardingV01(originMismatchDb, {
    selection_token: declaredOriginCandidate.selection_token,
    inspection_fingerprint:
      declaredOriginCandidate.inspection.inspection_fingerprint,
  }), /selection_origin_mismatch/);
  assert.equal((originMismatchDb.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count, 0);
  originMismatchDb.close();
  const expiredDeclaredCandidate = await declareAndInspectLocalProjectV01(
    plainDefaultFolder,
    {
      open_database: open,
      now_ms: () => 1_000,
      create_token: () => "expired-declared-candidate",
    },
  );
  assert.throws(() => readPreparedLocalProjectSelectionBindingV01(
    expiredDeclaredCandidate.selection_token,
    { now_ms: () => 1_000 + 10 * 60 * 1000 + 1 },
  ), /inspection_stale/);
  const lostDeclaredCandidate = await declareAndInspectLocalProjectV01(
    plainDefaultFolder,
    { open_database: open, create_token: () => "lost-declared-candidate" },
  );
  abandonPreparedLocalProjectSelectionV01(lostDeclaredCandidate.selection_token);
  assert.throws(() => readPreparedLocalProjectSelectionBindingV01(
    lostDeclaredCandidate.selection_token,
  ), /inspection_stale/);
  let db = open();
  assert.deepEqual(await listRecentProjectsV01(db), []);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_workspace_identities").get() as { count: number }).count, 0, "passive recent reads must not create a workspace");
  db.close();
  const rejectedOrigin = await projectRoutePost(new Request("http://127.0.0.1:4321/api/vnext/projects", {
    method: "POST", headers: { host: "127.0.0.1:4321", origin: "https://attacker.invalid", "content-type": "application/json" }, body: JSON.stringify({ action: "choose_folder" }),
  }));
  assert.equal(rejectedOrigin.status, 403);
  const invalidBodyDatabasePath = path.join(root, "invalid-body", "must-not-open.db");
  process.env.AUGNES_DB_PATH = invalidBodyDatabasePath;
  const routeHeaders = { host: "127.0.0.1:4321", origin: "http://127.0.0.1:4321", "content-type": "application/json" };
  const routeRequest = (body?: BodyInit | null, headers: Record<string, string> = {}) => new Request(
    "http://127.0.0.1:4321/api/vnext/projects",
    { method: "POST", headers: { ...routeHeaders, ...headers }, ...(body === undefined ? {} : { body }), duplex: "half" } as RequestInit & { duplex: "half" },
  );
  const recoveryCookieJar = new Map<string, string>();
  const applySetCookieHeader = (setCookie: string | null) => {
    if (!setCookie) return;
    const pair = setCookie.split(";", 1)[0];
    const separator = pair.indexOf("=");
    assert(separator > 0, "set-cookie must contain one named value");
    const name = pair.slice(0, separator);
    if (/;\s*Max-Age=0(?:;|$)/iu.test(setCookie)) {
      recoveryCookieJar.delete(name);
    } else {
      recoveryCookieJar.set(name, pair.slice(separator + 1));
    }
  };
  const applyCookieResponse = (response: Response) =>
    applySetCookieHeader(response.headers.get("set-cookie"));
  const recoveryCookieHeader = () =>
    [...recoveryCookieJar.entries()]
      .map(([name, value]) => `${name}=${value}`)
      .join("; ");
  assert.equal((await projectRoutePost(routeRequest(undefined))).status, 400, "missing request bodies must be rejected");
  for (const contentLength of ["-1", "1.5", "NaN", "Infinity", "+1"]) {
    const response = await projectRoutePost(routeRequest("{}", { "content-length": contentLength }));
    assert.equal(response.status, 400, `invalid Content-Length ${contentLength} must be rejected`);
  }
  assert.equal((await projectRoutePost(routeRequest("{}", { "content-length": String(MAX_REQUEST_BODY_BYTES + 1) }))).status, 413);
  let oversizedPulls = 0;
  let oversizedCancelled = false;
  const oversizedChunks = [8192, 8192, 1, 4096];
  const oversizedStream = new ReadableStream<Uint8Array>({
    type: "bytes",
    pull(controller) {
      const size = oversizedChunks[oversizedPulls] ?? 4096;
      oversizedPulls += 1;
      controller.enqueue(new Uint8Array(size));
    },
    cancel() { oversizedCancelled = true; },
  });
  assert.equal((await projectRoutePost(routeRequest(oversizedStream))).status, 413);
  assert.equal(oversizedCancelled, true);
  assert.equal(oversizedPulls, 3, "the request reader must not consume chunks after the detection byte");
  let understatedPulls = 0;
  let understatedCancelled = false;
  const understatedStream = new ReadableStream<Uint8Array>({
    type: "bytes",
    pull(controller) {
      understatedPulls += 1;
      controller.enqueue(new Uint8Array(understatedPulls === 1 ? MAX_REQUEST_BODY_BYTES : 1));
    },
    cancel() { understatedCancelled = true; },
  });
  assert.equal((await projectRoutePost(routeRequest(understatedStream, { "content-length": "1" }))).status, 413);
  assert.equal(understatedCancelled, true);
  assert.equal(understatedPulls, 2);
  assert.equal(existsSync(invalidBodyDatabasePath), false, "invalid and oversized request bodies must be rejected before opening SQLite");
  process.env.AUGNES_DB_PATH = dbPath;
  process.env.AUGNES_TEST_FOLDER_PICKER_PATH = folderA;
  const exactBodyPrefix = '{"action":"choose_folder","padding":"';
  const exactBodySuffix = '"}';
  const exactBody = exactBodyPrefix + "x".repeat(MAX_REQUEST_BODY_BYTES - Buffer.byteLength(exactBodyPrefix + exactBodySuffix)) + exactBodySuffix;
  assert.equal(Buffer.byteLength(exactBody), MAX_REQUEST_BODY_BYTES);
  assert.equal((await projectRoutePost(routeRequest(exactBody, { "content-length": String(MAX_REQUEST_BODY_BYTES) }))).status, 200);
  db = open();
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_recent_projects").get() as { count: number }).count, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_active_project_selections").get() as { count: number }).count, 0);
  db.close();

  const declaredRouteDbPath = path.join(root, "declared-route.db");
  process.env.AUGNES_DB_PATH = declaredRouteDbPath;
  const declaredResponse = await projectRoutePost(routeRequest(JSON.stringify({
    action: "declare_path",
    path: declaredUnicodeFolder,
  })));
  assert.equal(declaredResponse.status, 200);
  const declaredCookie = declaredResponse.headers.get("set-cookie");
  assert(declaredCookie?.includes("HttpOnly"));
  assert(declaredCookie?.includes("SameSite=Strict"));
  if (!declaredCookie) throw new Error("declared onboarding cookie missing");
  const declaredCookieValue = declaredCookie.split(";")[0];
  const declaredPayload = await declaredResponse.json() as {
    picker: Extract<Awaited<ReturnType<typeof declareAndInspectLocalProjectV01>>, { status: "selected" }>;
  };
  assert.equal(declaredPayload.picker.selection_origin, "declared_path");
  assert.equal(
    declaredPayload.picker.inspection.local_root.normalized_path,
    declaredUnicodeFolder,
  );
  const declaredDbBeforeConfirmation = new Database(declaredRouteDbPath);
  assert.equal((declaredDbBeforeConfirmation.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count, 0);
  assert.equal((declaredDbBeforeConfirmation.prepare("SELECT COUNT(*) AS count FROM vnext_project_root_bindings").get() as { count: number }).count, 0);
  assert.equal((declaredDbBeforeConfirmation.prepare("SELECT COUNT(*) AS count FROM vnext_physical_root_baselines").get() as { count: number }).count, 0);
  declaredDbBeforeConfirmation.close();
  const declaredConfirmationRequest = {
    selection_token: declaredPayload.picker.selection_token,
    inspection_fingerprint:
      declaredPayload.picker.inspection.inspection_fingerprint,
    display_name: "선언 경로 Project",
  };
  const browserConfirmationHeaders = {
    "sec-fetch-site": "same-origin",
    "sec-fetch-mode": "cors",
    "sec-fetch-dest": "empty",
  };
  const forgedPrepare = await projectRoutePost(routeRequest(JSON.stringify({
    action: "prepare_onboarding_confirmation",
    ...declaredConfirmationRequest,
  }), browserConfirmationHeaders));
  assert.equal(forgedPrepare.status, 403, "same-origin-shaped requests without the exact cookie must fail");
  const preparedDeclaredResponse = await projectRoutePost(routeRequest(JSON.stringify({
    action: "prepare_onboarding_confirmation",
    ...declaredConfirmationRequest,
  }), {
    ...browserConfirmationHeaders,
    cookie: declaredCookieValue,
  }));
  assert.equal(preparedDeclaredResponse.status, 200);
  const rotatedDeclaredCookie = preparedDeclaredResponse.headers.get("set-cookie")?.split(";")[0];
  assert(rotatedDeclaredCookie);
  assert.notEqual(rotatedDeclaredCookie, declaredCookieValue, "the confirmation nonce must rotate");
  const preparedDeclaredPayload = await preparedDeclaredResponse.json() as {
    confirmation: { challenge_fingerprint: string };
  };
  const exactDeclaredConfirmationBody = JSON.stringify({
    action: "confirm_declared_path",
    ...declaredConfirmationRequest,
    challenge_fingerprint:
      preparedDeclaredPayload.confirmation.challenge_fingerprint,
  });
  const oldNonceResponse = await projectRoutePost(routeRequest(
    exactDeclaredConfirmationBody,
    { ...browserConfirmationHeaders, cookie: declaredCookieValue },
  ));
  assert.equal(oldNonceResponse.status, 403);
  const changedNameResponse = await projectRoutePost(routeRequest(JSON.stringify({
    action: "confirm_declared_path",
    ...declaredConfirmationRequest,
    display_name: "changed after challenge",
    challenge_fingerprint:
      preparedDeclaredPayload.confirmation.challenge_fingerprint,
  }), { ...browserConfirmationHeaders, cookie: rotatedDeclaredCookie }));
  assert.equal(changedNameResponse.status, 409);
  const confirmedDeclaredResponse = await projectRoutePost(routeRequest(
    exactDeclaredConfirmationBody,
    { ...browserConfirmationHeaders, cookie: rotatedDeclaredCookie },
  ));
  assert.equal(confirmedDeclaredResponse.status, 200);
  const confirmedDeclaredPayload = await confirmedDeclaredResponse.json() as {
    result: { project: { project_id: string }; destination: string };
  };
  const replayedDeclaredResponse = await projectRoutePost(routeRequest(
    exactDeclaredConfirmationBody,
    { ...browserConfirmationHeaders, cookie: rotatedDeclaredCookie },
  ));
  assert.equal(replayedDeclaredResponse.status, 200);
  assert.deepEqual(await replayedDeclaredResponse.json(), {
    ok: true,
    result: confirmedDeclaredPayload.result,
  });
  const declaredDbAfterConfirmation = new Database(declaredRouteDbPath);
  assert.equal((declaredDbAfterConfirmation.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count, 1);
  assert.equal((declaredDbAfterConfirmation.prepare("SELECT COUNT(*) AS count FROM vnext_project_root_bindings").get() as { count: number }).count, 1);
  assert.equal((declaredDbAfterConfirmation.prepare("SELECT COUNT(*) AS count FROM vnext_physical_root_baselines").get() as { count: number }).count, 1);
  assert.equal((declaredDbAfterConfirmation.prepare("SELECT COUNT(*) AS count FROM vnext_active_project_selections").get() as { count: number }).count, 1);
  declaredDbAfterConfirmation.close();

  const abandonmentRaceDbPath = path.join(root, "abandonment-race.db");
  process.env.AUGNES_DB_PATH = abandonmentRaceDbPath;
  const ordinaryCancelResponse = await projectRoutePost(routeRequest(JSON.stringify({
    action: "declare_path",
    path: ordinaryCancelFolder,
  })));
  assert.equal(ordinaryCancelResponse.status, 200);
  const ordinaryCancelCookie = ordinaryCancelResponse.headers.get("set-cookie")?.split(";")[0];
  assert(ordinaryCancelCookie);
  const ordinaryCancelPayload = await ordinaryCancelResponse.json() as {
    picker: Extract<Awaited<ReturnType<typeof declareAndInspectLocalProjectV01>>, { status: "selected" }>;
  };
  const ordinaryAbandonBody = JSON.stringify({
    action: "abandon_selection",
    selection_token: ordinaryCancelPayload.picker.selection_token,
  });
  const ordinaryAbandonResponse = await projectRoutePost(routeRequest(
    ordinaryAbandonBody,
    { cookie: ordinaryCancelCookie },
  ));
  assert.equal(ordinaryAbandonResponse.status, 200);
  assert.equal(ordinaryAbandonResponse.headers.get("set-cookie"), null);
  const repeatedAbandonResponse = await projectRoutePost(routeRequest(
    ordinaryAbandonBody,
    { cookie: ordinaryCancelCookie },
  ));
  assert.equal(repeatedAbandonResponse.status, 200);
  assert.equal(repeatedAbandonResponse.headers.get("set-cookie"), null);
  assert.throws(
    () => readPreparedLocalProjectSelectionBindingV01(
      ordinaryCancelPayload.picker.selection_token,
    ),
    /inspection_stale/,
  );
  assert.throws(() => issueLocalProjectOnboardingChallengeV01({
    selection_token: ordinaryCancelPayload.picker.selection_token,
    inspection_fingerprint:
      ordinaryCancelPayload.picker.inspection.inspection_fingerprint,
    expected_active_project_id: null,
    expected_active_selection_revision: null,
    display_name: "Ordinary cancel",
    credential: readLocalProjectOnboardingCredentialFromRequestV01(
      routeRequest(undefined, { cookie: ordinaryCancelCookie }),
    ),
  }), /onboarding_confirmation_invalid/);

  process.env.AUGNES_TEST_FOLDER_PICKER_PATH = abandonmentRaceFolderA;
  const pickerAfterCancelResponse = await projectRoutePost(routeRequest(
    JSON.stringify({ action: "choose_folder" }),
  ));
  assert.equal(pickerAfterCancelResponse.status, 200);
  const pickerAfterCancelPayload = await pickerAfterCancelResponse.json() as {
    picker: Extract<Awaited<ReturnType<typeof pickAndInspectLocalProjectV01>>, { status: "selected" }>;
  };
  assert.equal(pickerAfterCancelPayload.picker.selection_origin, "native_picker");
  const pickerAfterCancelAbandonResponse = await projectRoutePost(routeRequest(
    JSON.stringify({
      action: "abandon_selection",
      selection_token: pickerAfterCancelPayload.picker.selection_token,
    }),
  ));
  assert.equal(pickerAfterCancelAbandonResponse.status, 200);
  assert.equal(pickerAfterCancelAbandonResponse.headers.get("set-cookie"), null);

  const abandonmentAResponse = await projectRoutePost(routeRequest(JSON.stringify({
    action: "declare_path",
    path: abandonmentRaceFolderA,
  })));
  assert.equal(abandonmentAResponse.status, 200);
  const abandonmentACookie = abandonmentAResponse.headers.get("set-cookie")?.split(";")[0];
  assert(abandonmentACookie);
  const abandonmentAPayload = await abandonmentAResponse.json() as {
    picker: Extract<Awaited<ReturnType<typeof declareAndInspectLocalProjectV01>>, { status: "selected" }>;
  };
  const abandonmentBodyBytes = new TextEncoder().encode(JSON.stringify({
    action: "abandon_selection",
    selection_token: abandonmentAPayload.picker.selection_token,
  }));
  let releaseAbandonmentResponse!: () => void;
  let abandonmentRequestBodyClosed = false;
  const delayedAbandonmentBody = new ReadableStream<Uint8Array>({
    start(controller) {
      releaseAbandonmentResponse = () => {
        controller.enqueue(abandonmentBodyBytes);
        controller.close();
        abandonmentRequestBodyClosed = true;
      };
    },
  });
  const delayedAbandonmentResponsePromise = projectRoutePost(routeRequest(
    delayedAbandonmentBody,
    { cookie: abandonmentACookie },
  ));
  const abandonmentBResponse = await projectRoutePost(routeRequest(JSON.stringify({
    action: "declare_path",
    path: abandonmentRaceFolderB,
  })));
  assert.equal(abandonmentBResponse.status, 200);
  const abandonmentBCookie = abandonmentBResponse.headers.get("set-cookie")?.split(";")[0];
  assert(abandonmentBCookie);
  const abandonmentBPayload = await abandonmentBResponse.json() as {
    picker: Extract<Awaited<ReturnType<typeof declareAndInspectLocalProjectV01>>, { status: "selected" }>;
  };
  releaseAbandonmentResponse();
  const delayedAbandonmentResponse = await delayedAbandonmentResponsePromise;
  assert.equal(delayedAbandonmentResponse.status, 200);
  assert.equal(abandonmentRequestBodyClosed, true);
  const staleAbandonmentSetCookie = delayedAbandonmentResponse.headers.get("set-cookie");
  const currentOnboardingCookie = staleAbandonmentSetCookie
    ? staleAbandonmentSetCookie.split(";")[0]
    : abandonmentBCookie;
  assert.equal(staleAbandonmentSetCookie, null);
  assert.equal(
    currentOnboardingCookie,
    abandonmentBCookie,
    "a delayed abandonment response must not overwrite the newer cookie",
  );
  assert.throws(() => issueLocalProjectOnboardingChallengeV01({
    selection_token: abandonmentAPayload.picker.selection_token,
    inspection_fingerprint:
      abandonmentAPayload.picker.inspection.inspection_fingerprint,
    expected_active_project_id: null,
    expected_active_selection_revision: null,
    display_name: "Abandonment race A",
    credential: readLocalProjectOnboardingCredentialFromRequestV01(
      routeRequest(undefined, { cookie: abandonmentACookie }),
    ),
  }), /onboarding_confirmation_invalid/);
  const abandonmentBConfirmationRequest = {
    selection_token: abandonmentBPayload.picker.selection_token,
    inspection_fingerprint:
      abandonmentBPayload.picker.inspection.inspection_fingerprint,
    display_name: "Abandonment race B",
  };
  const preparedAbandonmentBResponse = await projectRoutePost(routeRequest(
    JSON.stringify({
      action: "prepare_onboarding_confirmation",
      ...abandonmentBConfirmationRequest,
    }),
    { ...browserConfirmationHeaders, cookie: currentOnboardingCookie },
  ));
  assert.equal(preparedAbandonmentBResponse.status, 200);
  const preparedAbandonmentBCookie = preparedAbandonmentBResponse.headers
    .get("set-cookie")?.split(";")[0];
  assert(preparedAbandonmentBCookie);
  const preparedAbandonmentBPayload = await preparedAbandonmentBResponse.json() as {
    confirmation: { challenge_fingerprint: string };
  };
  const confirmedAbandonmentBResponse = await projectRoutePost(routeRequest(
    JSON.stringify({
      action: "confirm_declared_path",
      ...abandonmentBConfirmationRequest,
      challenge_fingerprint:
        preparedAbandonmentBPayload.confirmation.challenge_fingerprint,
    }),
    { ...browserConfirmationHeaders, cookie: preparedAbandonmentBCookie },
  ));
  assert.equal(confirmedAbandonmentBResponse.status, 200);
  assert.throws(
    () => readPreparedLocalProjectSelectionBindingV01(
      abandonmentAPayload.picker.selection_token,
    ),
    /inspection_stale/,
  );
  assert.throws(
    () => readPreparedLocalProjectSelectionBindingV01(
      abandonmentBPayload.picker.selection_token,
    ),
    /inspection_stale/,
  );
  const abandonmentRaceDb = new Database(abandonmentRaceDbPath);
  for (const [table, expected] of [
    ["vnext_workspace_identities", 1],
    ["vnext_project_identities", 1],
    ["vnext_project_root_bindings", 1],
    ["vnext_physical_root_baselines", 1],
    ["vnext_recent_projects", 1],
    ["vnext_active_project_selections", 1],
  ] as const) {
    assert.equal(
      (abandonmentRaceDb.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }).count,
      expected,
      `abandonment race must leave exactly ${expected} row in ${table}`,
    );
  }
  abandonmentRaceDb.close();

  const failedAbandonmentResponse = await projectRoutePost(routeRequest(JSON.stringify({
    action: "declare_path",
    path: failedAbandonmentFolder,
  })));
  assert.equal(failedAbandonmentResponse.status, 200);
  const failedAbandonmentCookie = failedAbandonmentResponse.headers.get("set-cookie")?.split(";")[0];
  assert(failedAbandonmentCookie);
  const failedAbandonmentPayload = await failedAbandonmentResponse.json() as {
    picker: Extract<Awaited<ReturnType<typeof declareAndInspectLocalProjectV01>>, { status: "selected" }>;
  };
  const failedTransportRequest = routeRequest(
    new ReadableStream<Uint8Array>({
      start(controller) { controller.error(new Error("abandonment transport failed")); },
    }),
    { cookie: failedAbandonmentCookie },
  );
  const failedTransportResponse = await projectRoutePost(failedTransportRequest);
  assert.notEqual(failedTransportResponse.status, 200);
  const afterFailedTransportDb = new Database(abandonmentRaceDbPath);
  assert.equal(
    (afterFailedTransportDb.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count,
    1,
    "a failed abandonment transport must not create or confirm a project",
  );
  afterFailedTransportDb.close();
  const cleanupFailedAbandonmentResponse = await projectRoutePost(routeRequest(
    JSON.stringify({
      action: "abandon_selection",
      selection_token: failedAbandonmentPayload.picker.selection_token,
    }),
    { cookie: failedAbandonmentCookie },
  ));
  assert.equal(cleanupFailedAbandonmentResponse.status, 200);
  assert.throws(
    () => readPreparedLocalProjectSelectionBindingV01(
      failedAbandonmentPayload.picker.selection_token,
    ),
    /inspection_stale/,
  );

  process.env.AUGNES_DB_PATH = dbPath;
  process.env.AUGNES_TEST_FOLDER_PICKER_PATH = substantiallyOversizedRoot;
  await assert.rejects(pickAndInspectLocalProjectV01({ open_database: open }), /inspection_failed/);
  db = open();
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_workspace_identities").get() as { count: number }).count, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_project_external_ref_bindings").get() as { count: number }).count, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_recent_projects").get() as { count: number }).count, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_active_project_selections").get() as { count: number }).count, 0);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_core_records").get() as { count: number }).count, 0);
  db.close();
  async function selection(folder: string, time: string) {
    process.env.AUGNES_TEST_FOLDER_PICKER_PATH = folder;
    const result = await pickAndInspectLocalProjectV01({ open_database: open, now: () => time });
    assert.equal(result.status, "selected");
    return result;
  }
  async function assertIsolatedPlainOnboarding(
    folder: string,
    databaseName: string,
    displayName?: string,
  ) {
    const isolatedPath = path.join(root, databaseName);
    const openIsolated = () => {
      const isolated = new Database(isolatedPath);
      isolated.pragma("foreign_keys = ON");
      applyCanonicalDatabaseMigrations(isolated);
      return isolated;
    };
    process.env.AUGNES_TEST_FOLDER_PICKER_PATH = folder;
    const selected = await pickAndInspectLocalProjectV01({
      open_database: openIsolated,
      now: () => "2026-07-15T00:00:30.000Z",
    });
    assert.equal(selected.status, "selected");
    assert.equal(selected.inspection.folder_kind, "plain_folder");
    const isolated = openIsolated();
    try {
      const confirmed = await confirmLocalProjectOnboardingV01(isolated, {
        selection_token: selected.selection_token,
        inspection_fingerprint: selected.inspection.inspection_fingerprint,
        ...(displayName === undefined ? {} : { display_name: displayName }),
      }, { now: () => "2026-07-15T00:00:31.000Z" });
      assert.equal(
        confirmed.project.display_name,
        displayName?.trim() ?? path.basename(folder),
      );
    } finally {
      isolated.close();
    }
  }
  await assertIsolatedPlainOnboarding(
    plainDefaultFolder,
    "plain-default-onboarding.db",
  );
  await assertIsolatedPlainOnboarding(
    plainEditedFolder,
    "plain-edited-onboarding.db",
    "  Edited plain project  ",
  );
  process.env.AUGNES_TEST_FOLDER_PICKER_PATH = invalidNameFolder;
  const invalidNameSelection = await pickAndInspectLocalProjectV01({
    open_database: open,
    now: () => "2026-07-15T00:00:40.000Z",
  });
  assert.equal(invalidNameSelection.status, "selected");
  db = open();
  const projectCountBeforeInvalidName = (db.prepare(
    "SELECT COUNT(*) AS count FROM vnext_project_identities",
  ).get() as { count: number }).count;
  await assert.rejects(
    confirmLocalProjectOnboardingV01(db, {
      selection_token: invalidNameSelection.selection_token,
      inspection_fingerprint:
        invalidNameSelection.inspection.inspection_fingerprint,
      display_name: "   ",
    }),
    /project_display_name_invalid/,
  );
  assert.equal(
    (db.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count,
    projectCountBeforeInvalidName,
  );
  db.close();
  const selectedA = await selection(folderA, "2026-07-15T00:01:00.000Z");
  assert.equal(selectedA.status, "selected");
  db = open();
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_workspace_identities").get() as { count: number }).count, 0, "inspection must not create workspace identity rows");
  const confirmedA = await confirmLocalProjectOnboardingV01(db, {
    selection_token: selectedA.selection_token,
    inspection_fingerprint: selectedA.inspection.inspection_fingerprint,
    display_name: "  Git project A  ",
  }, { now: () => "2026-07-15T00:01:00.000Z" });
  assert.equal(confirmedA.status, "created");
  assert.equal(confirmedA.project.display_name, "Git project A");
  assert.equal((await listRecentProjectsV01(db)).length, 1);
  assert.equal((await listRecentProjectsV01(db))[0].is_active, true);
  const credentialInspectionAndConfirmation = JSON.stringify({ inspection: selectedA.inspection, confirmation: confirmedA });
  for (const secret of removedCredentialMaterial) assert.equal(credentialInspectionAndConfirmation.includes(secret), false);
  const persistedCredentialRef = db.prepare("SELECT ref_json FROM vnext_project_external_ref_bindings").get() as { ref_json: string };
  assert.equal(JSON.parse(persistedCredentialRef.ref_json).external_id, "https://example.test/shared/repo.git");
  for (const secret of removedCredentialMaterial) assert.equal(persistedCredentialRef.ref_json.includes(secret), false);
  writeFileSync(path.join(folderA, ".git", "config"), `[remote "origin"]\n  url = https://example.test/shared/repo.git\n`);
  const cleanReplaySelection = await selection(folderA, "2026-07-15T00:01:15.000Z");
  assert.equal(cleanReplaySelection.status, "selected");
  assert.equal(cleanReplaySelection.inspection.already_added, true);
  assert.equal(cleanReplaySelection.inspection.existing_project?.display_name, "Git project A");
  const cleanReplay = await confirmLocalProjectOnboardingV01(db, {
    selection_token: cleanReplaySelection.selection_token,
    inspection_fingerprint: cleanReplaySelection.inspection.inspection_fingerprint,
  }, { now: () => "2026-07-15T00:01:15.000Z" });
  assert.equal(cleanReplay.project.project_id, confirmedA.project.project_id);
  assert.equal(cleanReplay.project.display_name, "Git project A");
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_project_external_ref_bindings").get() as { count: number }).count, 1, "sanitized and clean remotes must replay one binding");
  if (process.platform !== "win32") {
    const folderAAlias = path.join(root, "Project A physical alias");
    symlinkSync(folderA, folderAAlias, "dir");
    const aliasSelection = await declareAndInspectLocalProjectV01(
      folderAAlias,
      { open_database: open, now: () => "2026-07-15T00:01:20.000Z" },
    );
    assert.equal(aliasSelection.inspection.already_added, true);
    assert.equal(
      aliasSelection.inspection.existing_project?.project_id,
      confirmedA.project.project_id,
    );
    const aliasReplay = await confirmLocalProjectOnboardingV01(db, {
      selection_token: aliasSelection.selection_token,
      inspection_fingerprint:
        aliasSelection.inspection.inspection_fingerprint,
      selection_origin: "declared_path",
    }, { now: () => "2026-07-15T00:01:20.000Z" });
    assert.equal(aliasReplay.project.project_id, confirmedA.project.project_id);
    assert.equal(
      (await readProjectDestinationV01(db, confirmedA.project.project_id))
        ?.root_binding.local_root.normalized_path,
      folderA,
      "a physical alias must not rewrite the canonical root",
    );
  }
  db.close();

  db = open();
  const activeBeforeRename = activeSnapshot(await listRecentProjectsV01(db));
  assert(activeBeforeRename.expected_project_id);
  assert(activeBeforeRename.expected_revision);
  const renamedProjectName = "이어지는 프로젝트 Alpha";
  assert.equal(renameActiveProjectDisplayNameV01(db, {
    project_id: confirmedA.project.project_id,
    expected_active_project_id: activeBeforeRename.expected_project_id,
    expected_active_selection_revision: activeBeforeRename.expected_revision,
    expected_current_display_name: "Git project A",
    requested_display_name: renamedProjectName,
  }).status, "updated");
  const reopened = await readProjectDestinationV01(db, confirmedA.project.project_id);
  assert(reopened);
  assert.equal(reopened.project.display_name, renamedProjectName);
  assert.equal((await listRecentProjectsV01(db))[0]?.project.display_name, renamedProjectName);
  assert.equal(reopened.external_refs.length, 1);
  for (const secret of removedCredentialMaterial) assert.equal(JSON.stringify(reopened).includes(secret), false);
  const selectedB = await selection(folderB, "2026-07-15T00:02:00.000Z");
  assert.equal(selectedB.status, "selected");
  const confirmedB = await confirmLocalProjectOnboardingV01(db, {
    selection_token: selectedB.selection_token,
    inspection_fingerprint: selectedB.inspection.inspection_fingerprint,
    display_name: "Edited Git project B",
  }, { now: () => "2026-07-15T00:02:00.000Z" });
  assert.equal(confirmedB.project.display_name, "Edited Git project B");
  assert.notEqual(confirmedA.project.project_id, confirmedB.project.project_id);
  assert.equal((await listRecentProjectsV01(db)).length, 2);
  assert.equal((await readProjectDestinationV01(db, confirmedB.project.project_id))?.external_refs.length, 1);
  assert.equal((await readProjectDestinationV01(db, confirmedA.project.project_id))?.external_refs.length, 1);

  const lifecycleBeforeRemoteConflict = JSON.stringify({
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  });
  writeFileSync(path.join(folderB, ".git", "config"), `[remote "origin"]\n  url = https://example.test/changed/repo.git\n`);
  const changedRemote = await selection(folderB, "2026-07-15T00:02:15.000Z");
  assert.equal(changedRemote.status, "selected");
  await assert.rejects(confirmLocalProjectOnboardingV01(db, {
    selection_token: changedRemote.selection_token,
    inspection_fingerprint: changedRemote.inspection.inspection_fingerprint,
  }, { now: () => "2026-07-15T00:02:15.000Z" }), /project_external_ref_conflict/);
  assert.equal(JSON.stringify({
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  }), lifecycleBeforeRemoteConflict, "failed confirmation must roll back lifecycle state");
  assert.equal(JSON.stringify(await readProjectDestinationV01(db, confirmedB.project.project_id)).includes("changed/repo"), false);
  writeFileSync(path.join(folderB, ".git", "config"), `[remote "origin"]\n  url = https://example.test/shared/repo.git\n`);

  const currentRootRecoveryEntry = (await listRecentProjectsV01(db)).find(
    (entry) => entry.project.project_id === confirmedA.project.project_id,
  )!;
  const rebindDecisionCountBeforeCurrentOpen = (db.prepare(
    "SELECT COUNT(*) AS count FROM vnext_repository_execution_decision_requests WHERE action = 'rebind_root'",
  ).get() as { count: number }).count;
  const currentRootRecovery = await declareAndInspectLocalProjectRecoveryV01(
    folderA,
    recoveryScopeV01(currentRootRecoveryEntry),
    { open_database: open, now: () => "2026-07-15T00:02:20.000Z" },
  );
  assert.equal(currentRootRecovery.selection_origin, "declared_path");
  assert.equal(currentRootRecovery.recovery_action, "open_project");
  assert.deepEqual(
    {
      purpose: readPreparedLocalProjectSelectionBindingV01(
        currentRootRecovery.selection_token,
      ).selection_purpose,
      project_id: readPreparedLocalProjectSelectionBindingV01(
        currentRootRecovery.selection_token,
      ).recovery_project_id,
    },
    {
      purpose: "recover_existing_project",
      project_id: confirmedA.project.project_id,
    },
  );
  await assert.rejects(
    confirmLocalProjectOnboardingV01(db, {
      selection_token: currentRootRecovery.selection_token,
      inspection_fingerprint:
        currentRootRecovery.inspection.inspection_fingerprint,
      selection_origin: "declared_path",
    }),
    /project_scope_conflict/,
    "a recovery candidate must not enter new-project onboarding",
  );
  await assert.rejects(
    openRecoveredLocalProjectFromSelectionV01(db, {
      project_id: confirmedB.project.project_id,
      selection_token: currentRootRecovery.selection_token,
      inspection_fingerprint:
        currentRootRecovery.inspection.inspection_fingerprint,
      expected_old_root_binding_fingerprint:
        currentRootRecoveryEntry.root_binding_fingerprint,
      expected_old_baseline_fingerprint:
        currentRootRecoveryEntry.physical_root_baseline_fingerprint,
    }),
    /project_scope_conflict/,
    "a recovery candidate for project A must not open project B",
  );
  const currentRootOpened = await openRecoveredLocalProjectFromSelectionV01(
    db,
    {
      project_id: confirmedA.project.project_id,
      selection_token: currentRootRecovery.selection_token,
      inspection_fingerprint:
        currentRootRecovery.inspection.inspection_fingerprint,
      expected_old_root_binding_fingerprint:
        currentRootRecoveryEntry.root_binding_fingerprint,
      expected_old_baseline_fingerprint:
        currentRootRecoveryEntry.physical_root_baseline_fingerprint,
    },
    { now: () => "2026-07-15T00:02:21.000Z" },
  );
  assert.equal(currentRootOpened.project.project_id, confirmedA.project.project_id);
  assert.equal(
    (db.prepare(
      "SELECT COUNT(*) AS count FROM vnext_repository_execution_decision_requests WHERE action = 'rebind_root'",
    ).get() as { count: number }).count,
    rebindDecisionCountBeforeCurrentOpen,
    "opening the exact current root must not create a rebind decision",
  );
  assert.equal(
    (await readProjectDestinationV01(db, confirmedA.project.project_id))
      ?.root_binding.local_root.normalized_path,
    folderA,
  );
  let restoreActive = activeSnapshot(await listRecentProjectsV01(db));
  await openRecentProjectV01(db, {
    project_id: confirmedB.project.project_id,
    ...restoreActive,
    now: "2026-07-15T00:02:22.000Z",
  });

  if (process.platform !== "win32") {
    const recoveryAlias = path.join(root, "Project A recovery alias");
    symlinkSync(folderA, recoveryAlias, "dir");
    const aliasEntry = (await listRecentProjectsV01(db)).find(
      (entry) => entry.project.project_id === confirmedA.project.project_id,
    )!;
    const aliasRecovery = await declareAndInspectLocalProjectRecoveryV01(
      recoveryAlias,
      recoveryScopeV01(aliasEntry),
      { open_database: open, now: () => "2026-07-15T00:02:23.000Z" },
    );
    assert.equal(aliasRecovery.recovery_action, "open_project");
    await openRecoveredLocalProjectFromSelectionV01(db, {
      project_id: confirmedA.project.project_id,
      selection_token: aliasRecovery.selection_token,
      inspection_fingerprint: aliasRecovery.inspection.inspection_fingerprint,
      expected_old_root_binding_fingerprint: aliasEntry.root_binding_fingerprint,
      expected_old_baseline_fingerprint:
        aliasEntry.physical_root_baseline_fingerprint,
    });
    assert.equal(
      (await readProjectDestinationV01(db, confirmedA.project.project_id))
        ?.root_binding.local_root.normalized_path,
      folderA,
      "a recovery alias must open without rewriting the canonical root",
    );
    restoreActive = activeSnapshot(await listRecentProjectsV01(db));
    await openRecentProjectV01(db, {
      project_id: confirmedB.project.project_id,
      ...restoreActive,
      now: "2026-07-15T00:02:24.000Z",
    });
  }

  const purposeConnectCandidate = await declareAndInspectLocalProjectV01(
    plainEditedFolder,
    { open_database: open, now: () => "2026-07-15T00:02:25.000Z" },
  );
  const purposeTarget = (await listRecentProjectsV01(db)).find(
    (entry) => entry.project.project_id === confirmedA.project.project_id,
  )!;
  const recoveryPreparationStateBeforeNonExact = JSON.stringify({
    projects: db.prepare("SELECT * FROM vnext_project_identities ORDER BY workspace_id, project_id").all(),
    roots: db.prepare("SELECT * FROM vnext_project_root_bindings ORDER BY workspace_id, project_id").all(),
    baselines: db.prepare("SELECT * FROM vnext_physical_root_baselines ORDER BY workspace_id, project_id, node_scope_fingerprint").all(),
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
    decisions: db.prepare("SELECT * FROM vnext_repository_execution_decision_requests ORDER BY workspace_id, project_id, requested_at").all(),
  });
  for (const refusal of [
    {
      code: "physical_identity_unsupported",
      dependencies: { platform: "freebsd" } satisfies RepositoryExecutionDependenciesV01,
    },
    {
      code: "physical_identity_ambiguous",
      dependencies: {
        platform: "darwin",
        physical_identity_filesystem: {
          async realpath(pathname: string) { return pathname; },
          async stat() { return { dev: 0, ino: 0, isDirectory: () => true }; },
        },
      } satisfies RepositoryExecutionDependenciesV01,
    },
    {
      code: "physical_identity_unavailable",
      dependencies: {
        platform: "darwin",
        physical_identity_filesystem: {
          async realpath() { throw new Error("identity unavailable"); },
          async stat() { throw new Error("identity unavailable"); },
        },
      } satisfies RepositoryExecutionDependenciesV01,
    },
  ] as const) {
    let recoveryTokenCreated = false;
    await assert.rejects(
      declareAndInspectLocalProjectRecoveryV01(
        folderA,
        recoveryScopeV01(purposeTarget),
        {
          open_database: open,
          create_token: () => {
            recoveryTokenCreated = true;
            return `forbidden-recovery-${refusal.code}`;
          },
          repository_execution_dependencies: refusal.dependencies,
        },
      ),
      new RegExp(refusal.code, "u"),
    );
    assert.equal(
      recoveryTokenCreated,
      false,
      `${refusal.code} must refuse before recovery candidate allocation`,
    );
    assert.throws(
      () => readPreparedLocalProjectSelectionBindingV01(
        `forbidden-recovery-${refusal.code}`,
      ),
      /inspection_stale/,
    );
    assert.equal(
      JSON.stringify({
        projects: db.prepare("SELECT * FROM vnext_project_identities ORDER BY workspace_id, project_id").all(),
        roots: db.prepare("SELECT * FROM vnext_project_root_bindings ORDER BY workspace_id, project_id").all(),
        baselines: db.prepare("SELECT * FROM vnext_physical_root_baselines ORDER BY workspace_id, project_id, node_scope_fingerprint").all(),
        recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
        active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
        decisions: db.prepare("SELECT * FROM vnext_repository_execution_decision_requests ORDER BY workspace_id, project_id, requested_at").all(),
      }),
      recoveryPreparationStateBeforeNonExact,
      `${refusal.code} recovery preparation must leave canonical state unchanged`,
    );
  }
  await assert.rejects(
    previewLocalProjectRootRebindFromSelectionV01(db, {
      project_id: confirmedA.project.project_id,
      selection_token: purposeConnectCandidate.selection_token,
      inspection_fingerprint:
        purposeConnectCandidate.inspection.inspection_fingerprint,
      expected_old_root_binding_fingerprint: purposeTarget.root_binding_fingerprint,
      expected_old_baseline_fingerprint:
        purposeTarget.physical_root_baseline_fingerprint,
    }),
    /project_scope_conflict/,
    "a new-project candidate must not enter rebind preview",
  );
  await assert.rejects(
    rebindLocalProjectRootFromSelectionV01(db, {
      project_id: confirmedA.project.project_id,
      selection_token: purposeConnectCandidate.selection_token,
      inspection_fingerprint:
        purposeConnectCandidate.inspection.inspection_fingerprint,
      expected_old_root_binding_fingerprint: purposeTarget.root_binding_fingerprint,
      expected_old_baseline_fingerprint:
        purposeTarget.physical_root_baseline_fingerprint,
      decision_request_fingerprint: `sha256:${"0".repeat(64)}`,
    }),
    /project_scope_conflict/,
    "a new-project candidate must not enter rebind commit",
  );
  abandonPreparedLocalProjectSelectionV01(
    purposeConnectCandidate.selection_token,
  );

  const abandonedRecovery = await declareAndInspectLocalProjectRecoveryV01(
    folderA,
    recoveryScopeV01(purposeTarget),
    { open_database: open, now: () => "2026-07-15T00:02:26.000Z" },
  );
  assert.equal(
    abandonPreparedLocalProjectRecoverySelectionV01(
      abandonedRecovery.selection_token,
      confirmedA.project.project_id,
    ),
    true,
  );
  assert.throws(
    () => readPreparedLocalProjectSelectionBindingV01(
      abandonedRecovery.selection_token,
    ),
    /inspection_stale/,
  );
  const expiredRecovery = await declareAndInspectLocalProjectRecoveryV01(
    folderA,
    recoveryScopeV01(purposeTarget),
    {
      open_database: open,
      now: () => "2026-07-15T00:02:27.000Z",
      now_ms: () => 0,
    },
  );
  assert.throws(
    () => readPreparedLocalProjectSelectionBindingV01(
      expiredRecovery.selection_token,
      { now_ms: () => 10 * 60 * 1000 + 1 },
    ),
    /inspection_stale/,
  );

  const recoveryRouteResponse = await projectRoutePost(routeRequest(
    JSON.stringify({
      action: "declare_recovery_path",
      path: folderA,
      ...recoveryScopeV01(purposeTarget),
    }),
  ));
  assert.equal(recoveryRouteResponse.status, 200);
  assert.equal(recoveryRouteResponse.headers.get("set-cookie"), null);
  const recoveryRoutePayload = await recoveryRouteResponse.json() as {
    picker: Awaited<ReturnType<typeof declareAndInspectLocalProjectRecoveryV01>>;
  };
  assert.equal(recoveryRoutePayload.picker.recovery_action, "open_project");
  const recoveryRouteAbandon = await projectRoutePost(routeRequest(JSON.stringify({
    action: "abandon_recovery_selection",
    project_id: confirmedA.project.project_id,
    selection_token: recoveryRoutePayload.picker.selection_token,
  })));
  assert.equal(recoveryRouteAbandon.status, 200);

  const occupiedExpected = (await listRecentProjectsV01(db)).find(
    (entry) => entry.project.project_id === confirmedA.project.project_id,
  )!;
  await assert.rejects(
    declareAndInspectLocalProjectRecoveryV01(
      folderB,
      recoveryScopeV01(occupiedExpected),
      {
        open_database: open,
        now: () => "2026-07-15T00:02:30.000Z",
      },
    ),
    /project_scope_conflict/,
  );
  assert.equal((await readProjectDestinationV01(db, confirmedB.project.project_id))?.root_binding.local_root.normalized_path, folderB);

  await assert.rejects(openRecentProjectV01(db, {
    project_id: confirmedA.project.project_id,
    expected_project_id: null,
    expected_revision: null,
  }), /active_selection_conflict/);
  let currentActiveSnapshot = activeSnapshot(await listRecentProjectsV01(db));
  await openRecentProjectV01(db, { project_id: confirmedA.project.project_id, ...currentActiveSnapshot, now: "2026-07-15T00:03:00.000Z" });
  assert.equal((await listRecentProjectsV01(db)).find((entry) => entry.is_active)?.project.project_id, confirmedA.project.project_id);
  const staleAbaSnapshot = activeSnapshot(await listRecentProjectsV01(db));
  await openRecentProjectV01(db, { project_id: confirmedB.project.project_id, ...staleAbaSnapshot, now: "2026-07-15T00:03:10.000Z" });
  currentActiveSnapshot = activeSnapshot(await listRecentProjectsV01(db));
  await openRecentProjectV01(db, { project_id: confirmedA.project.project_id, ...currentActiveSnapshot, now: "2026-07-15T00:03:20.000Z" });
  const recencyBeforeAbaConflict = JSON.stringify(db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all());
  await assert.rejects(openRecentProjectV01(db, {
    project_id: confirmedB.project.project_id,
    ...staleAbaSnapshot,
    now: "2026-07-15T00:03:30.000Z",
  }), /active_selection_conflict/);
  assert.equal((await listRecentProjectsV01(db)).find((entry) => entry.is_active)?.project.project_id, confirmedA.project.project_id, "ABA conflicts must preserve the later active selection");
  assert.equal(JSON.stringify(db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all()), recencyBeforeAbaConflict, "ABA conflicts must roll back recency");

  const staleOnboarding = await selection(staleFolder, "2026-07-15T00:03:40.000Z");
  assert.equal(staleOnboarding.status, "selected");
  currentActiveSnapshot = activeSnapshot(await listRecentProjectsV01(db));
  await openRecentProjectV01(db, { project_id: confirmedB.project.project_id, ...currentActiveSnapshot, now: "2026-07-15T00:03:50.000Z" });
  const stateBeforeStaleOnboarding = JSON.stringify({
    projects: db.prepare("SELECT * FROM vnext_project_identities ORDER BY workspace_id, project_id").all(),
    roots: db.prepare("SELECT * FROM vnext_project_root_bindings ORDER BY workspace_id, project_id").all(),
    refs: db.prepare("SELECT * FROM vnext_project_external_ref_bindings ORDER BY workspace_id, project_id, ref_fingerprint").all(),
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  });
  await assert.rejects(confirmLocalProjectOnboardingV01(db, {
    selection_token: staleOnboarding.selection_token,
    inspection_fingerprint: staleOnboarding.inspection.inspection_fingerprint,
  }, { now: () => "2026-07-15T00:04:00.000Z" }), /active_selection_conflict/);
  assert.equal(JSON.stringify({
    projects: db.prepare("SELECT * FROM vnext_project_identities ORDER BY workspace_id, project_id").all(),
    roots: db.prepare("SELECT * FROM vnext_project_root_bindings ORDER BY workspace_id, project_id").all(),
    refs: db.prepare("SELECT * FROM vnext_project_external_ref_bindings ORDER BY workspace_id, project_id, ref_fingerprint").all(),
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  }), stateBeforeStaleOnboarding, "stale onboarding must roll back every project lifecycle row");
  assert.equal((await listRecentProjectsV01(db)).find((entry) => entry.is_active)?.project.project_id, confirmedB.project.project_id);
  currentActiveSnapshot = activeSnapshot(await listRecentProjectsV01(db));
  await openRecentProjectV01(db, { project_id: confirmedA.project.project_id, ...currentActiveSnapshot, now: "2026-07-15T00:04:10.000Z" });
  const recencyBeforeStaleRemoval = JSON.stringify(db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all());
  assert.throws(() => removeProjectFromRecentV01(db, {
    project_id: confirmedA.project.project_id,
    ...staleAbaSnapshot,
  }), /active_selection_conflict/);
  assert.equal(JSON.stringify(db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all()), recencyBeforeStaleRemoval);
  currentActiveSnapshot = activeSnapshot(await listRecentProjectsV01(db));
  const removed = removeProjectFromRecentV01(db, { project_id: confirmedA.project.project_id, ...currentActiveSnapshot });
  assert.deepEqual(removed, { removed: true, project_data_preserved: true });
  assert(await readProjectDestinationV01(db, confirmedA.project.project_id));
  assert.equal((await listRecentProjectsV01(db)).some((entry) => entry.is_active), false);

  renameSync(folderA, `${folderA}.missing`);
  const remainingA = await readProjectDestinationV01(db, confirmedA.project.project_id);
  assert.equal(remainingA?.root_availability, "missing");
  await assert.rejects(openRecentProjectV01(db, {
    project_id: confirmedA.project.project_id,
    expected_project_id: null,
    expected_revision: null,
  }), /project_root_unavailable/);
  writeFileSync(folderA, "not a directory");
  assert.equal(await readRootAvailabilityV01(folderA), "not_directory");
  rmSync(folderA);
  writeFileSync(path.join(folderA2, "replacement-marker.txt"), "replacement folder remains unchanged");
  const oldFolderConfigBeforeRecovery = readFileSync(path.join(`${folderA}.missing`, ".git", "config"), "utf8");
  const replacementContentsBeforeRecovery = readdirSync(folderA2).sort();
  const staleDestination = await readProjectDestinationV01(
    db,
    confirmedA.project.project_id,
  );
  assert(staleDestination);
  const staleBaseline = db.prepare(
    `SELECT baseline_fingerprint FROM vnext_physical_root_baselines
      WHERE workspace_id = ? AND project_id = ?`,
  ).get(
    confirmedA.project.workspace_id,
    confirmedA.project.project_id,
  ) as { baseline_fingerprint: string };
  const staleRecovery = await declareAndInspectLocalProjectRecoveryV01(
    folderA2,
    {
      project_id: confirmedA.project.project_id,
      expected_old_root_binding_fingerprint:
        fingerprintProjectRootBindingV01(staleDestination.root_binding),
      expected_old_baseline_fingerprint: staleBaseline.baseline_fingerprint,
      expected_active_project_id: null,
      expected_active_selection_revision: null,
    },
    { open_database: open, now: () => "2026-07-15T00:04:20.000Z" },
  );
  assert.equal(staleRecovery.recovery_action, "rebind");
  const nullOnboarding = await selection(nullConflictFolder, "2026-07-15T00:04:20.000Z");
  assert.equal(nullOnboarding.status, "selected");
  await openRecentProjectV01(db, {
    project_id: confirmedB.project.project_id,
    expected_project_id: null,
    expected_revision: null,
    now: "2026-07-15T00:04:30.000Z",
  });
  const rowsBeforeNullConflict = JSON.stringify({
    projects: db.prepare("SELECT * FROM vnext_project_identities ORDER BY workspace_id, project_id").all(),
    roots: db.prepare("SELECT * FROM vnext_project_root_bindings ORDER BY workspace_id, project_id").all(),
    refs: db.prepare("SELECT * FROM vnext_project_external_ref_bindings ORDER BY workspace_id, project_id, ref_fingerprint").all(),
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  });
  await assert.rejects(confirmLocalProjectOnboardingV01(db, {
    selection_token: nullOnboarding.selection_token,
    inspection_fingerprint: nullOnboarding.inspection.inspection_fingerprint,
  }, { now: () => "2026-07-15T00:04:40.000Z" }), /active_selection_conflict/);
  assert.equal(JSON.stringify({
    projects: db.prepare("SELECT * FROM vnext_project_identities ORDER BY workspace_id, project_id").all(),
    roots: db.prepare("SELECT * FROM vnext_project_root_bindings ORDER BY workspace_id, project_id").all(),
    refs: db.prepare("SELECT * FROM vnext_project_external_ref_bindings ORDER BY workspace_id, project_id, ref_fingerprint").all(),
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  }), rowsBeforeNullConflict, "null-to-project conflicts must leave no partial rows");
  const stateBeforeStaleRebind = JSON.stringify({
    roots: db.prepare("SELECT * FROM vnext_project_root_bindings ORDER BY workspace_id, project_id").all(),
    refs: db.prepare("SELECT * FROM vnext_project_external_ref_bindings ORDER BY workspace_id, project_id, ref_fingerprint").all(),
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  });
  await assert.rejects(rebindWithBrowserDecisionV01(db, {
    project_id: confirmedA.project.project_id,
    selection_token: staleRecovery.selection_token,
    inspection_fingerprint: staleRecovery.inspection.inspection_fingerprint,
    expected_old_root_binding_fingerprint: fingerprintProjectRootBindingV01(
      staleDestination.root_binding,
    ),
    expected_old_baseline_fingerprint: staleBaseline.baseline_fingerprint,
  }, { now: () => "2026-07-15T00:04:50.000Z" }), /active_selection_conflict/);
  assert.equal(JSON.stringify({
    roots: db.prepare("SELECT * FROM vnext_project_root_bindings ORDER BY workspace_id, project_id").all(),
    refs: db.prepare("SELECT * FROM vnext_project_external_ref_bindings ORDER BY workspace_id, project_id, ref_fingerprint").all(),
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  }), stateBeforeStaleRebind, "stale rebind must roll back root, recency, refs, and active state");
  assert.equal(readFileSync(path.join(`${folderA}.missing`, ".git", "config"), "utf8"), oldFolderConfigBeforeRecovery);
  assert.deepEqual(readdirSync(folderA2).sort(), replacementContentsBeforeRecovery);
  assert.equal((await listRecentProjectsV01(db)).find((entry) => entry.is_active)?.project.project_id, confirmedB.project.project_id);

  const recoveryActive = activeSnapshot(await listRecentProjectsV01(db));
  process.env.AUGNES_TEST_FOLDER_PICKER_PATH = folderA2;
  const recovery = await pickAndInspectLocalProjectRecoveryV01(
    {
      project_id: confirmedA.project.project_id,
      expected_old_root_binding_fingerprint:
        fingerprintProjectRootBindingV01(staleDestination.root_binding),
      expected_old_baseline_fingerprint: staleBaseline.baseline_fingerprint,
      expected_active_project_id: recoveryActive.expected_project_id,
      expected_active_selection_revision: recoveryActive.expected_revision,
    },
    { open_database: open, now: () => "2026-07-15T00:05:00.000Z" },
  );
  assert.equal(recovery.status, "selected");
  assert.equal(recovery.recovery_action, "rebind");
  const recoveryCrossCandidate = await declareAndInspectLocalProjectRecoveryV01(
    folderA2,
    {
      project_id: confirmedA.project.project_id,
      expected_old_root_binding_fingerprint:
        fingerprintProjectRootBindingV01(staleDestination.root_binding),
      expected_old_baseline_fingerprint: staleBaseline.baseline_fingerprint,
      expected_active_project_id: recoveryActive.expected_project_id,
      expected_active_selection_revision: recoveryActive.expected_revision,
    },
    { open_database: open, now: () => "2026-07-15T00:05:00.000Z" },
  );
  const recoveryInput = {
    project_id: confirmedA.project.project_id,
    selection_token: recovery.selection_token,
    inspection_fingerprint: recovery.inspection.inspection_fingerprint,
    expected_old_root_binding_fingerprint: fingerprintProjectRootBindingV01(
      staleDestination.root_binding,
    ),
    expected_old_baseline_fingerprint: staleBaseline.baseline_fingerprint,
  };
  const crossInput = {
    ...recoveryInput,
    selection_token: recoveryCrossCandidate.selection_token,
    inspection_fingerprint:
      recoveryCrossCandidate.inspection.inspection_fingerprint,
  };
  const recoveryPreview = await previewLocalProjectRootRebindFromSelectionV01(
    db,
    recoveryInput,
    { now: () => "2026-07-15T00:05:00.000Z" },
  );
  const crossPreview = await previewLocalProjectRootRebindFromSelectionV01(
    db,
    crossInput,
    { now: () => "2026-07-15T00:05:00.000Z" },
  );
  assert.notEqual(
    recoveryPreview.decision_request?.request_fingerprint,
    crossPreview.decision_request?.request_fingerprint,
    "two exact recovery candidates must bind distinct rebind requests",
  );
  const crossBootstrap = issueVNextLocalOperatorBootstrapV01(db, {
    config: {
      enabled: true,
      workspace_id: recoveryPreview.workspace_id,
      project_id: recoveryPreview.project_id,
      operator_id: "operator:cross-recovery-candidate",
      database_path: dbPath,
    },
    clock: { now: () => "2026-07-15T00:04:58.000Z" },
  });
  const recoveryCrossDecisionSession = consumeVNextLocalOperatorBootstrapV01(db, {
    config: {
      enabled: true,
      workspace_id: recoveryPreview.workspace_id,
      project_id: recoveryPreview.project_id,
      operator_id: "operator:cross-recovery-candidate",
      database_path: dbPath,
    },
    bootstrap_token: crossBootstrap.bootstrap_token,
    clock: { now: () => "2026-07-15T00:04:59.000Z" },
  }).repository_decision_session;
  const recoveryChallenge = issueVNextRepositoryDecisionChallengeV01(db, {
    workspace_id: recoveryPreview.workspace_id,
    project_id: recoveryPreview.project_id,
    request_fingerprint:
      recoveryPreview.decision_request!.request_fingerprint,
    credential: recoveryCrossDecisionSession.credential,
    clock: { now: () => "2026-07-15T00:05:00.000Z" },
  });
  let crossCandidateAuthorizationReached = false;
  await assert.rejects(
    rebindLocalProjectRootFromSelectionV01(
      db,
      {
        ...crossInput,
        decision_request_fingerprint:
          recoveryPreview.decision_request!.request_fingerprint,
      },
      {
        now: () => "2026-07-15T00:05:00.000Z",
        authorize_decision_inside_transaction: () => {
          crossCandidateAuthorizationReached = true;
          const authorized =
            authorizeRepositoryExecutionDecisionFromBrowserSessionInsideTransactionV01(
              db,
              {
                workspace_id: recoveryPreview.workspace_id,
                project_id: recoveryPreview.project_id,
                request_fingerprint:
                  recoveryPreview.decision_request!.request_fingerprint,
                challenge_fingerprint:
                  recoveryChallenge.challenge_fingerprint,
                credential: recoveryCrossDecisionSession.credential,
              },
            );
          return {
            grant_fingerprint: authorized.decision.grant_fingerprint!,
          };
        },
      },
    ),
    /inspection_stale/,
  );
  assert.equal(crossCandidateAuthorizationReached, false);
  assert.equal(
    abandonPreparedLocalProjectRecoverySelectionV01(
      recovery.selection_token,
      confirmedA.project.project_id,
    ),
    true,
  );
  const freshRecoveryCandidate =
    await declareAndInspectLocalProjectRecoveryV01(
      folderA2,
      {
        project_id: confirmedA.project.project_id,
        expected_old_root_binding_fingerprint:
          fingerprintProjectRootBindingV01(staleDestination.root_binding),
        expected_old_baseline_fingerprint: staleBaseline.baseline_fingerprint,
        expected_active_project_id: recoveryActive.expected_project_id,
        expected_active_selection_revision: recoveryActive.expected_revision,
      },
      { open_database: open, now: () => "2026-07-15T00:05:00.000Z" },
    );
  const freshRecoveryInput = {
    ...recoveryInput,
    selection_token: freshRecoveryCandidate.selection_token,
    inspection_fingerprint:
      freshRecoveryCandidate.inspection.inspection_fingerprint,
  };
  const freshRecoveryPreview =
    await previewLocalProjectRootRebindFromSelectionV01(
      db,
      freshRecoveryInput,
      { now: () => "2026-07-15T00:05:00.000Z" },
    );
  const freshRecoveryChallenge = issueVNextRepositoryDecisionChallengeV01(db, {
    workspace_id: freshRecoveryPreview.workspace_id,
    project_id: freshRecoveryPreview.project_id,
    request_fingerprint:
      freshRecoveryPreview.decision_request!.request_fingerprint,
    credential: recoveryCrossDecisionSession.credential,
    clock: { now: () => "2026-07-15T00:05:00.000Z" },
  });
  const grantedRecoveryDecision =
    grantRepositoryExecutionDecisionFromBrowserSessionV01(db, {
      workspace_id: freshRecoveryPreview.workspace_id,
      project_id: freshRecoveryPreview.project_id,
      request_fingerprint:
        freshRecoveryPreview.decision_request!.request_fingerprint,
      challenge_fingerprint: freshRecoveryChallenge.challenge_fingerprint,
      credential: recoveryCrossDecisionSession.credential,
    }, { now: () => "2026-07-15T00:05:00.000Z" });
  assert(grantedRecoveryDecision.decision.grant_fingerprint);
  const concurrentRebinds = await Promise.allSettled([
    rebindLocalProjectRootFromSelectionV01(db, {
      ...freshRecoveryInput,
      decision_request_fingerprint:
        freshRecoveryPreview.decision_request!.request_fingerprint,
    }, {
      now: () => "2026-07-15T00:05:00.000Z",
      decision_grant_fingerprint:
        grantedRecoveryDecision.decision.grant_fingerprint,
    }),
    rebindLocalProjectRootFromSelectionV01(db, {
      ...freshRecoveryInput,
      decision_request_fingerprint:
        freshRecoveryPreview.decision_request!.request_fingerprint,
    }, {
      now: () => "2026-07-15T00:05:00.000Z",
      decision_grant_fingerprint:
        grantedRecoveryDecision.decision.grant_fingerprint,
    }),
  ]);
  const successfulRebinds = concurrentRebinds.filter(
    (result) => result.status === "fulfilled",
  );
  assert.equal(
    successfulRebinds.length,
    1,
    concurrentRebinds.map((result) => result.status === "rejected"
      ? String(result.reason)
      : "fulfilled").join(" | "),
  );
  const rebound = (successfulRebinds[0] as PromiseFulfilledResult<
    Awaited<ReturnType<typeof rebindLocalProjectRootFromSelectionV01>>
  >).value;
  assert.equal(rebound.project.project_id, confirmedA.project.project_id);
  assert.equal(rebound.project.display_name, renamedProjectName);
  assert.equal((await readProjectDestinationV01(db, confirmedA.project.project_id))?.root_binding.local_root.normalized_path, folderA2);
  assert.equal((await listRecentProjectsV01(db)).find((entry) => entry.project.project_id === confirmedA.project.project_id)?.is_active, true);

  renameSync(folderA2, folderA3);
  const routeRecoveryEntry = (await listRecentProjectsV01(db)).find(
    (entry) => entry.project.project_id === confirmedA.project.project_id,
  )!;
  const routeRecoveryStateBefore = JSON.stringify({
    projects: db.prepare("SELECT * FROM vnext_project_identities ORDER BY project_id").all(),
    roots: db.prepare("SELECT * FROM vnext_project_root_bindings ORDER BY project_id").all(),
    baselines: db.prepare("SELECT * FROM vnext_physical_root_baselines ORDER BY project_id").all(),
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  });
  const declareRouteRecovery = async () => {
    const response = await projectRoutePost(routeRequest(JSON.stringify({
      action: "declare_recovery_path",
      path: folderA3,
      ...recoveryScopeV01(routeRecoveryEntry),
    })));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("set-cookie"), null);
    return (await response.json() as {
      picker: Extract<
        Awaited<ReturnType<typeof declareAndInspectLocalProjectRecoveryV01>>,
        { status: "selected" }
      >;
    }).picker;
  };
  const prepareRouteRecovery = async (
    picker: Awaited<ReturnType<typeof declareRouteRecovery>>,
    cookieHeader?: string,
  ) => {
    const response = await projectRoutePost(routeRequest(JSON.stringify({
      action: "prepare_repository_execution_rebind_confirmation",
      project_id: confirmedA.project.project_id,
      selection_token: picker.selection_token,
      inspection_fingerprint: picker.inspection.inspection_fingerprint,
      expected_old_root_binding_fingerprint:
        routeRecoveryEntry.root_binding_fingerprint,
      expected_old_baseline_fingerprint:
        routeRecoveryEntry.physical_root_baseline_fingerprint,
    }), {
      ...browserConfirmationHeaders,
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
    }));
    assert.equal(response.status, 200);
    const cookie = response.headers.get("set-cookie");
    if (!cookie) throw new Error("recovery confirmation cookie missing");
    assert(cookie.startsWith("augnes_vnext_recovery_decision_"));
    assert(cookie.includes("HttpOnly"));
    assert(cookie.includes("SameSite=Strict"));
    assert.equal(
      cookie.includes("augnes_vnext_repository_decision_session_v01"),
      false,
    );
    const text = await response.text();
    assert.equal(/vnext_(?:bootstrap|session)_v01|action_nonce|session_secret/.test(text), false);
    return {
      cookie: cookie.split(";")[0],
      set_cookie: cookie,
      payload: JSON.parse(text) as {
        decision_request_fingerprint: string;
        confirmation: { challenge_fingerprint: string };
      },
    };
  };
  const assertExactRecoveryCookieClear = (
    response: Response,
    issuedCookie: string,
  ) => {
    const clear = response.headers.get("set-cookie");
    assert(clear, "terminal recovery response must clear its exact cookie");
    assert.equal(
      clear.split("=", 1)[0],
      issuedCookie.split("=", 1)[0],
    );
    assert(clear.includes("Path=/api/vnext/projects"));
    assert(clear.includes("HttpOnly"));
    assert(clear.includes("SameSite=Strict"));
    assert(clear.includes("Max-Age=0"));
    assert.equal(
      clear.includes("augnes_vnext_repository_decision_session_v01"),
      false,
    );
  };

  const processLostCandidate = await declareRouteRecovery();
  const processLostPrepared = await prepareRouteRecovery(processLostCandidate);
  recoveryCookieJar.set(
    processLostPrepared.cookie.split("=", 1)[0],
    processLostPrepared.cookie.slice(processLostPrepared.cookie.indexOf("=") + 1),
  );
  clearVNextRecoveryRepositoryDecisionProcessScopesV01();
  const processLostConfirmation = await projectRoutePost(routeRequest(
    JSON.stringify({
      action: "confirm_rebind",
      project_id: confirmedA.project.project_id,
      selection_token: processLostCandidate.selection_token,
      inspection_fingerprint:
        processLostCandidate.inspection.inspection_fingerprint,
      expected_old_root_binding_fingerprint:
        routeRecoveryEntry.root_binding_fingerprint,
      expected_old_baseline_fingerprint:
        routeRecoveryEntry.physical_root_baseline_fingerprint,
      decision_request_fingerprint:
        processLostPrepared.payload.decision_request_fingerprint,
      challenge_fingerprint:
        processLostPrepared.payload.confirmation.challenge_fingerprint,
    }),
    { ...browserConfirmationHeaders, cookie: processLostPrepared.cookie },
  ));
  assert.equal(processLostConfirmation.status, 401);
  assertExactRecoveryCookieClear(
    processLostConfirmation,
    processLostPrepared.cookie,
  );
  applyCookieResponse(processLostConfirmation);
  assert.equal(recoveryCookieHeader(), "");
  assert.equal(JSON.stringify({
    projects: db.prepare("SELECT * FROM vnext_project_identities ORDER BY project_id").all(),
    roots: db.prepare("SELECT * FROM vnext_project_root_bindings ORDER BY project_id").all(),
    baselines: db.prepare("SELECT * FROM vnext_physical_root_baselines ORDER BY project_id").all(),
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  }), routeRecoveryStateBefore);
  const abandonProcessLostCandidate = await projectRoutePost(routeRequest(
    JSON.stringify({
      action: "abandon_recovery_selection",
      project_id: confirmedA.project.project_id,
      selection_token: processLostCandidate.selection_token,
    }),
  ));
  assert.equal(abandonProcessLostCandidate.status, 200);
  assertExactRecoveryCookieClear(
    abandonProcessLostCandidate,
    processLostPrepared.cookie,
  );

  const freshRouteRecoveryCandidate = await declareRouteRecovery();
  const freshRoutePrepared = await prepareRouteRecovery(
    freshRouteRecoveryCandidate,
  );
  const freshRouteBinding = readPreparedLocalProjectSelectionBindingV01(
    freshRouteRecoveryCandidate.selection_token,
  );
  const freshRecoveryCredential =
    readVNextRecoveryRepositoryDecisionCredentialFromRequestV01(
      routeRequest(undefined, { cookie: freshRoutePrepared.cookie }),
      freshRouteRecoveryCandidate.selection_token,
    );
  assert.throws(
    () => issueVNextRepositoryDecisionChallengeV01(db, {
      workspace_id: freshRouteBinding.expected_workspace_id!,
      project_id: freshRouteBinding.recovery_project_id!,
      request_fingerprint: `sha256:${"a".repeat(64)}`,
      credential: freshRecoveryCredential,
    }),
    /operator_session_scope_mismatch/,
    "recovery access must not authorize another request or action for the same project",
  );
  assert.throws(
    () => issueVNextRepositoryDecisionChallengeV01(db, {
      workspace_id: freshRouteBinding.expected_workspace_id!,
      project_id: confirmedB.project.project_id,
      request_fingerprint:
        freshRoutePrepared.payload.decision_request_fingerprint,
      credential: freshRecoveryCredential,
    }),
    /operator_session_scope_mismatch/,
    "recovery access must not authorize another project",
  );
  const genericDecisionAttempt = await projectRoutePost(routeRequest(
    JSON.stringify({
      action: "prepare_repository_execution_decision_confirmation",
      workspace_id: freshRouteBinding.expected_workspace_id,
      project_id: freshRouteBinding.recovery_project_id,
      request_fingerprint:
        freshRoutePrepared.payload.decision_request_fingerprint,
    }),
    { ...browserConfirmationHeaders, cookie: freshRoutePrepared.cookie },
  ));
  assert.equal(
    genericDecisionAttempt.status,
    401,
    "a recovery cookie must not enter the generic repository-decision route",
  );
  const freshRouteAbandoned = await projectRoutePost(routeRequest(JSON.stringify({
    action: "abandon_recovery_selection",
    project_id: confirmedA.project.project_id,
    selection_token: freshRouteRecoveryCandidate.selection_token,
  })));
  assert.equal(freshRouteAbandoned.status, 200);
  assertExactRecoveryCookieClear(
    freshRouteAbandoned,
    freshRoutePrepared.cookie,
  );
  const forgedRouteRecoveryCandidate = await declareRouteRecovery();
  const forgedRoutePrepared = await prepareRouteRecovery(
    forgedRouteRecoveryCandidate,
  );
  assert.notEqual(
    forgedRoutePrepared.cookie.split("=", 1)[0],
    freshRoutePrepared.cookie.split("=", 1)[0],
    "each recovery candidate must own a distinct cookie generation",
  );
  assert.equal(
    (db.prepare(
      `SELECT COUNT(*) AS count FROM vnext_local_operator_sessions
        WHERE operator_id = 'operator:local-project-recovery'
          AND revoked_at IS NULL`,
    ).get() as { count: number }).count,
    1,
    "a new issuance must prune process-lost recovery authority",
  );
  const forgedRouteRecoveryBody = JSON.stringify({
    action: "confirm_rebind",
    project_id: confirmedA.project.project_id,
    selection_token: forgedRouteRecoveryCandidate.selection_token,
    inspection_fingerprint:
      forgedRouteRecoveryCandidate.inspection.inspection_fingerprint,
    expected_old_root_binding_fingerprint:
      routeRecoveryEntry.root_binding_fingerprint,
    expected_old_baseline_fingerprint:
      routeRecoveryEntry.physical_root_baseline_fingerprint,
    decision_request_fingerprint:
      forgedRoutePrepared.payload.decision_request_fingerprint,
    challenge_fingerprint:
      forgedRoutePrepared.payload.confirmation.challenge_fingerprint,
  });
  const forgedFreshRecovery = await projectRoutePost(routeRequest(
    forgedRouteRecoveryBody,
    browserConfirmationHeaders,
  ));
  assert.equal(forgedFreshRecovery.status, 401);
  assertExactRecoveryCookieClear(
    forgedFreshRecovery,
    forgedRoutePrepared.cookie,
  );
  assert.equal(
    (db.prepare(
      `SELECT COUNT(*) AS count FROM vnext_local_operator_sessions
        WHERE operator_id = 'operator:local-project-recovery'
          AND revoked_at IS NULL`,
    ).get() as { count: number }).count,
    0,
    "a failed terminal confirmation must revoke its exact recovery access",
  );
  const forgedCandidateAbandoned = await projectRoutePost(routeRequest(JSON.stringify({
    action: "abandon_recovery_selection",
    project_id: confirmedA.project.project_id,
    selection_token: forgedRouteRecoveryCandidate.selection_token,
  })));
  assert.equal(forgedCandidateAbandoned.status, 200);
  assertExactRecoveryCookieClear(
    forgedCandidateAbandoned,
    forgedRoutePrepared.cookie,
  );

  const retryGeneralConfig = {
    enabled: true as const,
    workspace_id: confirmedB.project.workspace_id,
    project_id: confirmedB.project.project_id,
    operator_id: "operator:recovery-cookie-budget-sentinel",
    database_path: dbPath,
  };
  const retryGeneralBootstrap = issueVNextLocalOperatorBootstrapV01(db, {
    config: retryGeneralConfig,
  });
  const retryGeneralSession = consumeVNextLocalOperatorBootstrapV01(db, {
    config: retryGeneralConfig,
    bootstrap_token: retryGeneralBootstrap.bootstrap_token,
  }).repository_decision_session;
  const retryGeneralCookie = serializeVNextRepositoryDecisionSessionCookieV01({
    value: retryGeneralSession.cookie_value,
    expires_at: retryGeneralSession.cookie_expires_at,
    max_age_seconds: retryGeneralSession.cookie_max_age_seconds,
    secure: false,
  }).split(";", 1)[0];
  recoveryCookieJar.set(
    retryGeneralCookie.split("=", 1)[0],
    retryGeneralCookie.slice(retryGeneralCookie.indexOf("=") + 1),
  );

  const invalidChallengeCandidate = await declareRouteRecovery();
  const invalidChallengePrepared = await prepareRouteRecovery(
    invalidChallengeCandidate,
    recoveryCookieHeader(),
  );
  applySetCookieHeader(invalidChallengePrepared.set_cookie);
  const invalidChallengeResponse = await projectRoutePost(routeRequest(
    JSON.stringify({
      action: "confirm_rebind",
      project_id: confirmedA.project.project_id,
      selection_token: invalidChallengeCandidate.selection_token,
      inspection_fingerprint:
        invalidChallengeCandidate.inspection.inspection_fingerprint,
      expected_old_root_binding_fingerprint:
        routeRecoveryEntry.root_binding_fingerprint,
      expected_old_baseline_fingerprint:
        routeRecoveryEntry.physical_root_baseline_fingerprint,
      decision_request_fingerprint:
        invalidChallengePrepared.payload.decision_request_fingerprint,
      challenge_fingerprint: `sha256:${"0".repeat(64)}`,
    }),
    { ...browserConfirmationHeaders, cookie: recoveryCookieHeader() },
  ));
  assert.equal(invalidChallengeResponse.status, 401);
  assertExactRecoveryCookieClear(
    invalidChallengeResponse,
    invalidChallengePrepared.cookie,
  );
  applyCookieResponse(invalidChallengeResponse);
  const invalidChallengeReprepare = await projectRoutePost(routeRequest(
    JSON.stringify({
      action: "prepare_repository_execution_rebind_confirmation",
      project_id: confirmedA.project.project_id,
      selection_token: invalidChallengeCandidate.selection_token,
      inspection_fingerprint:
        invalidChallengeCandidate.inspection.inspection_fingerprint,
      expected_old_root_binding_fingerprint:
        routeRecoveryEntry.root_binding_fingerprint,
      expected_old_baseline_fingerprint:
        routeRecoveryEntry.physical_root_baseline_fingerprint,
    }),
    { ...browserConfirmationHeaders, cookie: recoveryCookieHeader() },
  ));
  assert.equal(
    invalidChallengeReprepare.status,
    409,
    "terminal failure must require a freshly inspected candidate",
  );
  assertExactRecoveryCookieClear(
    invalidChallengeReprepare,
    invalidChallengePrepared.cookie,
  );
  const invalidChallengeAbandoned = await projectRoutePost(routeRequest(
    JSON.stringify({
      action: "abandon_recovery_selection",
      project_id: confirmedA.project.project_id,
      selection_token: invalidChallengeCandidate.selection_token,
    }),
    { cookie: recoveryCookieHeader() },
  ));
  assert.equal(invalidChallengeAbandoned.status, 200);

  const expiredRecoveryCandidate = await declareRouteRecovery();
  const expiredRecoveryPrepared = await prepareRouteRecovery(
    expiredRecoveryCandidate,
    recoveryCookieHeader(),
  );
  applySetCookieHeader(expiredRecoveryPrepared.set_cookie);
  const expiringRecoveryRow = db.prepare(
    `SELECT session_id FROM vnext_local_operator_sessions
      WHERE operator_id = 'operator:local-project-recovery'
        AND revoked_at IS NULL`,
  ).get() as { session_id: string };
  db.prepare(
    `UPDATE vnext_local_operator_sessions
       SET expires_at = ?, decision_action_nonce_expires_at = ?
     WHERE session_id = ?`,
  ).run(
    "1970-01-01T00:00:00.000Z",
    "1970-01-01T00:00:00.000Z",
    expiringRecoveryRow.session_id,
  );
  const expiredRecoveryResponse = await projectRoutePost(routeRequest(
    JSON.stringify({
      action: "confirm_rebind",
      project_id: confirmedA.project.project_id,
      selection_token: expiredRecoveryCandidate.selection_token,
      inspection_fingerprint:
        expiredRecoveryCandidate.inspection.inspection_fingerprint,
      expected_old_root_binding_fingerprint:
        routeRecoveryEntry.root_binding_fingerprint,
      expected_old_baseline_fingerprint:
        routeRecoveryEntry.physical_root_baseline_fingerprint,
      decision_request_fingerprint:
        expiredRecoveryPrepared.payload.decision_request_fingerprint,
      challenge_fingerprint:
        expiredRecoveryPrepared.payload.confirmation.challenge_fingerprint,
    }),
    { ...browserConfirmationHeaders, cookie: recoveryCookieHeader() },
  ));
  assert.equal(expiredRecoveryResponse.status, 401);
  assertExactRecoveryCookieClear(
    expiredRecoveryResponse,
    expiredRecoveryPrepared.cookie,
  );
  applyCookieResponse(expiredRecoveryResponse);
  await projectRoutePost(routeRequest(JSON.stringify({
    action: "abandon_recovery_selection",
    project_id: confirmedA.project.project_id,
    selection_token: expiredRecoveryCandidate.selection_token,
  }), { cookie: recoveryCookieHeader() }));

  const staleRecoveryCandidate = await declareRouteRecovery();
  const staleRecoveryPrepared = await prepareRouteRecovery(
    staleRecoveryCandidate,
    recoveryCookieHeader(),
  );
  applySetCookieHeader(staleRecoveryPrepared.set_cookie);
  assert.equal(
    abandonPreparedLocalProjectRecoverySelectionV01(
      staleRecoveryCandidate.selection_token,
      confirmedA.project.project_id,
    ),
    true,
  );
  const staleRecoveryResponse = await projectRoutePost(routeRequest(
    JSON.stringify({
      action: "confirm_rebind",
      project_id: confirmedA.project.project_id,
      selection_token: staleRecoveryCandidate.selection_token,
      inspection_fingerprint:
        staleRecoveryCandidate.inspection.inspection_fingerprint,
      expected_old_root_binding_fingerprint:
        routeRecoveryEntry.root_binding_fingerprint,
      expected_old_baseline_fingerprint:
        routeRecoveryEntry.physical_root_baseline_fingerprint,
      decision_request_fingerprint:
        staleRecoveryPrepared.payload.decision_request_fingerprint,
      challenge_fingerprint:
        staleRecoveryPrepared.payload.confirmation.challenge_fingerprint,
    }),
    { ...browserConfirmationHeaders, cookie: recoveryCookieHeader() },
  ));
  assert.equal(staleRecoveryResponse.status, 409);
  assertExactRecoveryCookieClear(
    staleRecoveryResponse,
    staleRecoveryPrepared.cookie,
  );
  applyCookieResponse(staleRecoveryResponse);
  assert.equal(
    (db.prepare(
      `SELECT COUNT(*) AS count FROM vnext_local_operator_sessions
        WHERE operator_id = 'operator:local-project-recovery'
          AND revoked_at IS NULL`,
    ).get() as { count: number }).count,
    0,
  );

  let maximumRetryCookieHeaderCharacters = recoveryCookieHeader().length;
  let retryCookieCharactersWithoutCleanup = recoveryCookieHeader().length;
  for (let retryIndex = 0; retryIndex < 32; retryIndex += 1) {
    const retryCandidate = await declareRouteRecovery();
    const retryPrepared = await prepareRouteRecovery(
      retryCandidate,
      recoveryCookieHeader(),
    );
    applySetCookieHeader(retryPrepared.set_cookie);
    retryCookieCharactersWithoutCleanup += retryPrepared.cookie.length + 2;
    maximumRetryCookieHeaderCharacters = Math.max(
      maximumRetryCookieHeaderCharacters,
      recoveryCookieHeader().length,
    );
    assert(
      recoveryCookieHeader().length <
        VNEXT_LOCAL_OPERATOR_MAX_COOKIE_HEADER_CHARACTERS_V01,
    );
    const retryAbandoned = await projectRoutePost(routeRequest(
      JSON.stringify({
        action: "abandon_recovery_selection",
        project_id: confirmedA.project.project_id,
        selection_token: retryCandidate.selection_token,
      }),
      { cookie: recoveryCookieHeader() },
    ));
    assert.equal(retryAbandoned.status, 200);
    assertExactRecoveryCookieClear(retryAbandoned, retryPrepared.cookie);
    applyCookieResponse(retryAbandoned);
    assert.equal(
      [...recoveryCookieJar.keys()].filter((name) =>
        name.startsWith("augnes_vnext_recovery_decision_"),
      ).length,
      0,
    );
  }
  assert(
    maximumRetryCookieHeaderCharacters <
      VNEXT_LOCAL_OPERATOR_MAX_COOKIE_HEADER_CHARACTERS_V01,
  );
  assert(
    retryCookieCharactersWithoutCleanup >
      VNEXT_LOCAL_OPERATOR_MAX_COOKIE_HEADER_CHARACTERS_V01,
    "the retry stress must exceed the parser bound without exact cleanup",
  );
  assert.equal(
    recoveryCookieJar.get(retryGeneralCookie.split("=", 1)[0]),
    retryGeneralCookie.slice(retryGeneralCookie.indexOf("=") + 1),
  );
  const preservedGeneralCredential =
    readVNextRepositoryDecisionCredentialFromRequestV01(
      routeRequest(undefined, { cookie: recoveryCookieHeader() }),
    );
  assert.deepEqual(
    preservedGeneralCredential,
    retryGeneralSession.credential,
  );
  assert.doesNotThrow(() => issueVNextRepositoryDecisionChallengeV01(db, {
    workspace_id: confirmedB.project.workspace_id,
    project_id: confirmedB.project.project_id,
    request_fingerprint: `sha256:${"b".repeat(64)}`,
    credential: preservedGeneralCredential,
  }));

  const delayedRouteRecoveryCandidate = await declareRouteRecovery();
  const delayedRoutePrepared = await prepareRouteRecovery(
    delayedRouteRecoveryCandidate,
    recoveryCookieHeader(),
  );
  const positiveRouteRecoveryCandidate = await declareRouteRecovery();
  const positiveRoutePreparedB = await prepareRouteRecovery(
    positiveRouteRecoveryCandidate,
    recoveryCookieHeader(),
  );
  const positiveRoutePreparedA = await prepareRouteRecovery(
    positiveRouteRecoveryCandidate,
    recoveryCookieHeader(),
  );
  assert.deepEqual(
    positiveRoutePreparedA.payload,
    positiveRoutePreparedB.payload,
    "same-candidate preparation must reuse the exact challenge",
  );
  assert.equal(
    positiveRoutePreparedA.cookie,
    positiveRoutePreparedB.cookie,
    "same-candidate preparation must reuse the exact credential",
  );
  assert.equal(
    (db.prepare(
      `SELECT COUNT(*) AS count FROM vnext_local_operator_sessions
        WHERE operator_id = 'operator:local-project-recovery'
          AND revoked_at IS NULL`,
    ).get() as { count: number }).count,
    2,
    "two candidates may coexist, but repeated preparation adds no generation",
  );
  applySetCookieHeader(positiveRoutePreparedB.set_cookie);
  applySetCookieHeader(positiveRoutePreparedA.set_cookie);
  applySetCookieHeader(delayedRoutePrepared.set_cookie);
  assert.equal(
    [...recoveryCookieJar.keys()].filter((name) =>
      name.startsWith("augnes_vnext_recovery_decision_"),
    ).length,
    2,
  );
  const delayedRouteAbandoned = await projectRoutePost(routeRequest(
    JSON.stringify({
      action: "abandon_recovery_selection",
      project_id: confirmedA.project.project_id,
      selection_token: delayedRouteRecoveryCandidate.selection_token,
    }),
    { cookie: recoveryCookieHeader() },
  ));
  assert.equal(delayedRouteAbandoned.status, 200);
  assertExactRecoveryCookieClear(
    delayedRouteAbandoned,
    delayedRoutePrepared.cookie,
  );
  applyCookieResponse(delayedRouteAbandoned);
  assert.equal(
    recoveryCookieJar.has(positiveRoutePreparedA.cookie.split("=", 1)[0]),
    true,
    "clearing candidate A must preserve candidate B",
  );
  const exactRouteRecoveryBody = JSON.stringify({
    action: "confirm_rebind",
    project_id: confirmedA.project.project_id,
    selection_token: positiveRouteRecoveryCandidate.selection_token,
    inspection_fingerprint:
      positiveRouteRecoveryCandidate.inspection.inspection_fingerprint,
    expected_old_root_binding_fingerprint:
      routeRecoveryEntry.root_binding_fingerprint,
    expected_old_baseline_fingerprint:
      routeRecoveryEntry.physical_root_baseline_fingerprint,
    decision_request_fingerprint:
      positiveRoutePreparedB.payload.decision_request_fingerprint,
    challenge_fingerprint:
      positiveRoutePreparedB.payload.confirmation.challenge_fingerprint,
  });
  const freshRouteConfirmed = await projectRoutePost(routeRequest(
    exactRouteRecoveryBody,
    {
      ...browserConfirmationHeaders,
      cookie: recoveryCookieHeader(),
    },
  ));
  assert.equal(freshRouteConfirmed.status, 200);
  assertExactRecoveryCookieClear(
    freshRouteConfirmed,
    positiveRoutePreparedB.cookie,
  );
  applyCookieResponse(freshRouteConfirmed);
  assert.equal(
    [...recoveryCookieJar.keys()].filter((name) =>
      name.startsWith("augnes_vnext_recovery_decision_"),
    ).length,
    0,
  );
  assert.equal(
    recoveryCookieJar.get(retryGeneralCookie.split("=", 1)[0]),
    retryGeneralCookie.slice(retryGeneralCookie.indexOf("=") + 1),
  );
  const freshRouteResult = await freshRouteConfirmed.json() as {
    result: { project: { project_id: string; display_name: string } };
  };
  assert.equal(freshRouteResult.result.project.project_id, confirmedA.project.project_id);
  assert.equal(freshRouteResult.result.project.display_name, renamedProjectName);
  const recoveryReplay = await projectRoutePost(routeRequest(
    exactRouteRecoveryBody,
    { ...browserConfirmationHeaders, cookie: recoveryCookieHeader() },
  ));
  assert.notEqual(recoveryReplay.status, 200);
  assertExactRecoveryCookieClear(
    recoveryReplay,
    positiveRoutePreparedB.cookie,
  );
  const delayedCandidateReplay = await projectRoutePost(routeRequest(
    JSON.stringify({
      action: "confirm_rebind",
      project_id: confirmedA.project.project_id,
      selection_token: delayedRouteRecoveryCandidate.selection_token,
      inspection_fingerprint:
        delayedRouteRecoveryCandidate.inspection.inspection_fingerprint,
      expected_old_root_binding_fingerprint:
        routeRecoveryEntry.root_binding_fingerprint,
      expected_old_baseline_fingerprint:
        routeRecoveryEntry.physical_root_baseline_fingerprint,
      decision_request_fingerprint:
        delayedRoutePrepared.payload.decision_request_fingerprint,
      challenge_fingerprint:
        delayedRoutePrepared.payload.confirmation.challenge_fingerprint,
    }),
    { ...browserConfirmationHeaders, cookie: recoveryCookieHeader() },
  ));
  assert.notEqual(delayedCandidateReplay.status, 200);
  assert.equal(
    (db.prepare(
      `SELECT COUNT(*) AS count FROM vnext_local_operator_sessions
        WHERE operator_id = 'operator:local-project-recovery'
          AND revoked_at IS NULL`,
    ).get() as { count: number }).count,
    0,
  );
  assert.equal((await readProjectDestinationV01(db, confirmedA.project.project_id))?.root_binding.local_root.normalized_path, folderA3);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count, 2);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_recent_projects").get() as { count: number }).count, 2);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_physical_root_baselines WHERE project_id = ?").get(confirmedA.project.project_id) as { count: number }).count, 1);

  renameSync(folderA3, folderA4);
  const generalSessionRecoveryEntry = (await listRecentProjectsV01(db)).find(
    (entry) => entry.project.project_id === confirmedA.project.project_id,
  )!;
  const generalSessionRecoveryResponse = await projectRoutePost(routeRequest(
    JSON.stringify({
      action: "declare_recovery_path",
      path: folderA4,
      ...recoveryScopeV01(generalSessionRecoveryEntry),
    }),
  ));
  assert.equal(generalSessionRecoveryResponse.status, 200);
  const generalSessionRecoveryCandidate = (await generalSessionRecoveryResponse.json() as {
    picker: Extract<
      Awaited<ReturnType<typeof declareAndInspectLocalProjectRecoveryV01>>,
      { status: "selected" }
    >;
  }).picker;
  const generalRecoveryConfig = {
    enabled: true as const,
    workspace_id: confirmedA.project.workspace_id,
    project_id: confirmedA.project.project_id,
    operator_id: "operator:general-recovery-regression",
    database_path: dbPath,
  };
  const generalRecoveryBootstrap = issueVNextLocalOperatorBootstrapV01(db, {
    config: generalRecoveryConfig,
  });
  const generalRecoverySession = consumeVNextLocalOperatorBootstrapV01(db, {
    config: generalRecoveryConfig,
    bootstrap_token: generalRecoveryBootstrap.bootstrap_token,
  }).repository_decision_session;
  const generalRecoveryCookie =
    serializeVNextRepositoryDecisionSessionCookieV01({
      value: generalRecoverySession.cookie_value,
      expires_at: generalRecoverySession.cookie_expires_at,
      max_age_seconds: generalRecoverySession.cookie_max_age_seconds,
      secure: false,
    }).split(";")[0];
  const generalRecoveryPrepareResponse = await projectRoutePost(routeRequest(
    JSON.stringify({
      action: "prepare_repository_execution_rebind_confirmation",
      project_id: confirmedA.project.project_id,
      selection_token: generalSessionRecoveryCandidate.selection_token,
      inspection_fingerprint:
        generalSessionRecoveryCandidate.inspection.inspection_fingerprint,
      expected_old_root_binding_fingerprint:
        generalSessionRecoveryEntry.root_binding_fingerprint,
      expected_old_baseline_fingerprint:
        generalSessionRecoveryEntry.physical_root_baseline_fingerprint,
    }),
    { ...browserConfirmationHeaders, cookie: generalRecoveryCookie },
  ));
  assert.equal(generalRecoveryPrepareResponse.status, 200);
  assert.equal(generalRecoveryPrepareResponse.headers.get("set-cookie"), null);
  const generalRecoveryPrepared = await generalRecoveryPrepareResponse.json() as {
    decision_request_fingerprint: string;
    confirmation: { challenge_fingerprint: string };
  };
  const generalRecoveryConfirmResponse = await projectRoutePost(routeRequest(
    JSON.stringify({
      action: "confirm_rebind",
      project_id: confirmedA.project.project_id,
      selection_token: generalSessionRecoveryCandidate.selection_token,
      inspection_fingerprint:
        generalSessionRecoveryCandidate.inspection.inspection_fingerprint,
      expected_old_root_binding_fingerprint:
        generalSessionRecoveryEntry.root_binding_fingerprint,
      expected_old_baseline_fingerprint:
        generalSessionRecoveryEntry.physical_root_baseline_fingerprint,
      decision_request_fingerprint:
        generalRecoveryPrepared.decision_request_fingerprint,
      challenge_fingerprint:
        generalRecoveryPrepared.confirmation.challenge_fingerprint,
    }),
    { ...browserConfirmationHeaders, cookie: generalRecoveryCookie },
  ));
  assert.equal(generalRecoveryConfirmResponse.status, 200);
  assert(
    generalRecoveryConfirmResponse.headers.get("set-cookie")?.startsWith(
      "augnes_vnext_repository_decision_session_v01=",
    ),
  );
  assert.equal((await readProjectDestinationV01(db, confirmedA.project.project_id))?.root_binding.local_root.normalized_path, folderA4);

  const replaySelection = await selection(folderA4, "2026-07-15T00:05:10.000Z");
  assert.equal(replaySelection.status, "selected");
  assert.equal(replaySelection.inspection.display_name, "Project A moved with general session");
  assert.equal(replaySelection.inspection.existing_project?.display_name, renamedProjectName);
  const replay = await confirmLocalProjectOnboardingV01(db, {
    selection_token: replaySelection.selection_token,
    inspection_fingerprint: replaySelection.inspection.inspection_fingerprint,
    display_name: replaySelection.inspection.display_name,
  }, { now: () => "2026-07-15T00:05:10.000Z" });
  assert.equal(replay.status, "already_added");
  assert.equal(replay.project.project_id, confirmedA.project.project_id);
  assert.equal(replay.project.display_name, renamedProjectName);
  assert.equal((await readProjectDestinationV01(db, confirmedA.project.project_id))?.external_refs.length, 1);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count, 2);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_recent_projects").get() as { count: number }).count, 2);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_active_project_selections").get() as { count: number }).count, 1);
  const activeForRoute = activeSnapshot(await listRecentProjectsV01(db));
  const lifecycleBeforeRouteConflicts = JSON.stringify({
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  });
  const exactRenameReplayResponse = await projectRoutePost(routeRequest(JSON.stringify({
    action: "rename",
    project_id: confirmedA.project.project_id,
    expected_active_project_id: activeForRoute.expected_project_id,
    expected_active_selection_revision: activeForRoute.expected_revision,
    expected_current_display_name: renamedProjectName,
    requested_display_name: renamedProjectName,
  })));
  assert.equal(exactRenameReplayResponse.status, 200);
  assert.equal(
    (await exactRenameReplayResponse.json() as { result: { status: string } }).result.status,
    "exact_replay",
  );
  const staleRenameResponse = await projectRoutePost(routeRequest(JSON.stringify({
    action: "rename",
    project_id: confirmedA.project.project_id,
    expected_active_project_id: activeForRoute.expected_project_id,
    expected_active_selection_revision: activeForRoute.expected_revision,
    expected_current_display_name: "Old project name",
    requested_display_name: "Must not be written",
  })));
  assert.equal(staleRenameResponse.status, 409);
  assert.equal(
    (await staleRenameResponse.json() as { error_code: string }).error_code,
    "project_display_name_conflict",
  );
  const invalidRenameResponse = await projectRoutePost(routeRequest(JSON.stringify({
    action: "rename",
    project_id: confirmedA.project.project_id,
    expected_active_project_id: activeForRoute.expected_project_id,
    expected_active_selection_revision: activeForRoute.expected_revision,
    expected_current_display_name: renamedProjectName,
    requested_display_name: "",
  })));
  assert.equal(invalidRenameResponse.status, 400);
  assert.equal(
    (await invalidRenameResponse.json() as { error_code: string }).error_code,
    "project_display_name_invalid",
  );
  const inactiveRenameResponse = await projectRoutePost(routeRequest(JSON.stringify({
    action: "rename",
    project_id: confirmedB.project.project_id,
    expected_active_project_id: activeForRoute.expected_project_id,
    expected_active_selection_revision: activeForRoute.expected_revision,
    expected_current_display_name: "Edited Git project B",
    requested_display_name: "Must not rename inactive project",
  })));
  assert.equal(inactiveRenameResponse.status, 409);
  assert.equal(
    (await inactiveRenameResponse.json() as { error_code: string }).error_code,
    "active_selection_conflict",
  );
  assert.equal(
    (await readProjectDestinationV01(db, confirmedA.project.project_id))?.project.display_name,
    renamedProjectName,
  );
  assert.equal(
    (await readProjectDestinationV01(db, confirmedB.project.project_id))?.project.display_name,
    "Edited Git project B",
  );
  const missingRevisionResponse = await projectRoutePost(routeRequest(JSON.stringify({
    action: "open",
    project_id: confirmedB.project.project_id,
    expected_project_id: activeForRoute.expected_project_id,
  })));
  assert.equal(missingRevisionResponse.status, 400, "Open must require the complete active-selection snapshot");
  assert(activeForRoute.expected_revision && activeForRoute.expected_revision > 1);
  const staleRevisionResponse = await projectRoutePost(routeRequest(JSON.stringify({
    action: "open",
    project_id: confirmedB.project.project_id,
    expected_project_id: activeForRoute.expected_project_id,
    expected_revision: activeForRoute.expected_revision - 1,
  })));
  assert.equal(staleRevisionResponse.status, 409);
  assert.equal((await staleRevisionResponse.json() as { error_code: string }).error_code, "active_selection_conflict");
  assert.equal(JSON.stringify({
    recent: db.prepare("SELECT * FROM vnext_recent_projects ORDER BY workspace_id, project_id").all(),
    active: db.prepare("SELECT * FROM vnext_active_project_selections ORDER BY workspace_id").all(),
  }), lifecycleBeforeRouteConflicts);
  const workspace = getOrCreateDefaultWorkspaceIdentityV01(db);
  assert(workspace.workspace_id.startsWith("workspace:"));
  db.close();

  const disappearing = await selection(disappearingFolder, "2026-07-15T00:05:30.000Z");
  assert.equal(disappearing.status, "selected");
  renameSync(disappearingFolder, `${disappearingFolder}.missing`);
  db = open();
  const projectsBeforeMissingConfirmation = (db.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count;
  await assert.rejects(confirmLocalProjectOnboardingV01(db, {
    selection_token: disappearing.selection_token,
    inspection_fingerprint: disappearing.inspection.inspection_fingerprint,
  }), /selection_missing/);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count, projectsBeforeMissingConfirmation);
  db.close();

  const tampered = await selection(folderB, "2026-07-15T00:06:00.000Z");
  assert.equal(tampered.status, "selected");
  db = open();
  await assert.rejects(confirmLocalProjectOnboardingV01(db, { selection_token: tampered.selection_token, inspection_fingerprint: "sha256:" + "0".repeat(64) }), /selection_tampered/);
  assert.equal((db.prepare("SELECT COUNT(*) AS count FROM vnext_project_identities").get() as { count: number }).count, 2);
  for (const artifact of ["vnext_recent_projects", "vnext_active_project_selections", "idx_vnext_recent_projects_workspace_opened"]) {
    assert(db.prepare("SELECT 1 FROM sqlite_master WHERE name = ?").get(artifact));
  }
  applyCanonicalDatabaseMigrations(db);
  db.close();

  const artifactNames = ["vnext_recent_projects", "vnext_active_project_selections", "idx_vnext_recent_projects_workspace_opened"];
  const artifactSql = (database: Database.Database) => Object.fromEntries(artifactNames.map((name) => [name, String((database.prepare("SELECT sql FROM sqlite_master WHERE name = ?").get(name) as { sql: string }).sql).replace(/\s+/g, " ").replace(/\s*([(),=])\s*/g, "$1").trim()]));
  const runtimeSchema = new Database(":memory:");
  runtimeSchema.exec(VNEXT_PROJECT_IDENTITY_REGISTRY_SCHEMA_SQL_V01);
  runtimeSchema.exec(VNEXT_PROJECT_LIFECYCLE_SCHEMA_SQL_V01);
  const migrationSchema = new Database(":memory:");
  migrationSchema.exec(VNEXT_PROJECT_IDENTITY_REGISTRY_SCHEMA_SQL_V01);
  migrationSchema.exec(vNextProjectLifecycleSchemaSqlV01);
  const canonicalSchema = new Database(":memory:");
  canonicalSchema.exec(readFileSync(path.join(process.cwd(), "lib", "db", "schema.sql"), "utf8"));
  assert.deepEqual(artifactSql(runtimeSchema), artifactSql(migrationSchema));
  assert.deepEqual(artifactSql(runtimeSchema), artifactSql(canonicalSchema));
  runtimeSchema.close(); migrationSchema.close(); canonicalSchema.close();

  console.log(JSON.stringify({ status: "pass", declared_path_parser_bounded_and_literal: true, declared_path_platform_boundaries: true, prepared_selection_origins_distinct: true, non_exact_preparation_refused_before_candidate_or_session: true, shared_picker_and_declared_path_exact_identity_gate: true, pre_project_browser_cookie_and_challenge: true, stale_abandonment_response_cannot_clear_newer_session: true, ordinary_repeated_and_cross_mode_cancel: true, failed_abandonment_transport_zero_authority: true, old_nonce_and_cross_candidate_replay_refused: true, concurrent_confirmation_executions: 1, exact_successful_transport_replay: true, failed_confirmation_requires_fresh_material: true, process_local_candidate_loss_refused: true, declared_path_zero_mutation_before_confirmation: true, physical_alias_preserves_canonical_root: true, recovery_candidate_purpose_is_server_bound: true, onboarding_candidate_rebind_refused: true, recovery_candidate_onboarding_refused: true, recovery_cross_project_refused: true, recovery_non_exact_preparation_refused_before_candidate: true, recovery_inspection_issued_decision_sessions: 0, recovery_current_root_opened_without_rebind: true, recovery_alias_preserved_canonical_root: true, recovery_native_and_declared_origins: true, recovery_cross_candidate_decision_refused: true, recovery_same_candidate_prepare_idempotent: true, recovery_different_candidate_response_order_safe: true, recovery_terminal_cookie_cleanup: true, recovery_retry_cookie_header_max_characters: maximumRetryCookieHeaderCharacters, recovery_retry_without_cleanup_characters: retryCookieCharactersWithoutCleanup, recovery_retry_final_success: true, recovery_general_decision_cookie_preserved: true, concurrent_rebind_executions: 1, picker_abort_listener_residue: 0, picker_adapter: true, picker_platform_boundaries: true, picker_output_and_timeout_bounded: true, picker_sequence_file_symlink_refusal_verified: pickerSequenceFileSymlinkRefusalVerified, picker_sequence_file_symlink_refusal_skip_reason: pickerSequenceFileSymlinkRefusalVerified ? null : "windows_symlink_privilege_unavailable", test_only_cancel_injection_guarded: true, origin_guard: true, plain_and_git_inspection: true, plain_default_name: true, plain_edited_name: true, git_edited_name: true, invalid_name_rollback: true, explicit_active_project_rename: true, stale_name_conflict: true, inactive_project_rename_refused: true, existing_root_preserves_saved_name: true, root_rebind_preserves_name: true, folder_basename_does_not_rename: true, recent_and_current_reads_return_renamed_name: true, inaccessible_and_not_directory_states: true, git_no_remote_and_worktree_metadata: true, bounded_git_metadata_limit_and_detection_byte: true, bounded_chunked_request_limit_and_cancellation: true, inspection_identity_rows_written: 0, passive_reads_identity_rows_written: 0, credential_material_in_returned_and_persisted_values: 0, exact_root_replay: true, same_repository_independence: true, conflicting_repository_confirmation_rolled_back: true, stale_onboarding_rolled_back: true, null_to_project_conflict_rolled_back: true, aba_conflict_refused: true, stale_rebind_rolled_back: true, partial_rows_after_cas_conflicts: 0, recent_active_restart: true, removal_preserves_data: true, moved_root_recovery: true, occupied_root_rebind_refusal: true, stale_tamper_and_disappearing_root_refusal: true, migration_idempotent: true, migration_schema_parity: true, bytes_read_beyond_limit_plus_detection_byte: 0, network_calls: 0, git_processes: 0 }, null, 2));
} finally {
  process.env = originalEnvironment;
  rmSync(root, { recursive: true, force: true });
}
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : "project_onboarding_test_failed");
  process.exitCode = 1;
});
