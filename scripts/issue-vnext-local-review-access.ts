#!/usr/bin/env node

import Database from "better-sqlite3";
import { existsSync, statSync } from "node:fs";
import { pathToFileURL } from "node:url";

import {
  readCanonicalProjectWithRootV01,
  readDefaultWorkspaceIdentityV01,
} from "../lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01 } from "../lib/vnext/persistence/project-lifecycle-registry";
import {
  issueVNextLocalOperatorBootstrapV01,
  type VNextLocalOperatorBootstrapIssueV01,
  type VNextLocalOperatorPilotConfigV01,
} from "../lib/vnext/runtime/local-operator-session";
import type { VNextLocalRuntimeClockV01 } from "../lib/vnext/runtime/local-runtime-clock";

const LOCAL_REVIEW_OPERATOR_ID = "operator:local-review";

export interface VNextLocalReviewAccessIssueV01 {
  config: VNextLocalOperatorPilotConfigV01;
  bootstrap: VNextLocalOperatorBootstrapIssueV01;
}

export function issueVNextLocalReviewAccessV01(
  db: Database.Database,
  input: {
    database_path: string;
    clock?: VNextLocalRuntimeClockV01;
  },
): VNextLocalReviewAccessIssueV01 {
  const workspace = readDefaultWorkspaceIdentityV01(db);
  if (!workspace) throw new Error("local_review_workspace_unavailable");
  const active = readActiveProjectSelectionV01(db, workspace.workspace_id);
  if (!active) throw new Error("local_review_active_project_required");
  const registration = readCanonicalProjectWithRootV01(db, {
    workspace_id: workspace.workspace_id,
    project_id: active.project_id,
  });
  if (!registration) throw new Error("local_review_project_unavailable");
  const root = registration.root_binding.local_root.normalized_path;
  if (!existsSync(root) || !statSync(root).isDirectory()) {
    throw new Error("local_review_project_root_unavailable");
  }
  const config: VNextLocalOperatorPilotConfigV01 = {
    enabled: true,
    workspace_id: workspace.workspace_id,
    project_id: active.project_id,
    operator_id: LOCAL_REVIEW_OPERATOR_ID,
    database_path: input.database_path,
  };
  return {
    config,
    bootstrap: issueVNextLocalOperatorBootstrapV01(db, {
      config,
      clock: input.clock,
    }),
  };
}

function requiredDatabasePath(environment: NodeJS.ProcessEnv): string {
  const value = environment.AUGNES_DB_PATH?.trim();
  if (!value) throw new Error("local_review_database_path_required");
  return value;
}

function publicErrorCode(error: unknown): string {
  return error instanceof Error && /^[a-z0-9_]+$/u.test(error.message)
    ? error.message
    : "local_review_access_unavailable";
}

async function main(): Promise<void> {
  const databasePath = requiredDatabasePath(process.env);
  const db = new Database(databasePath, { fileMustExist: true });
  try {
    db.pragma("foreign_keys = ON");
    const issued = issueVNextLocalReviewAccessV01(db, {
      database_path: databasePath,
    });
    process.stdout.write(`${JSON.stringify({
      ok: true,
      workspace_id: issued.config.workspace_id,
      project_id: issued.config.project_id,
      operator_id: issued.config.operator_id,
      bootstrap_token: issued.bootstrap.bootstrap_token,
      expires_at: issued.bootstrap.session.expires_at,
    })}\n`);
  } finally {
    db.close();
  }
}

if (
  Boolean(process.argv[1]) &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  void main().catch((error) => {
    process.stderr.write(`${JSON.stringify({
      ok: false,
      error_code: publicErrorCode(error),
    })}\n`);
    process.exitCode = 1;
  });
}
