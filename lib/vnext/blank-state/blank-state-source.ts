import type Database from "better-sqlite3";

import { openDatabase } from "@/lib/db";
import { listRecentProjectsV01 } from "@/lib/vnext/onboarding/local-project-onboarding";
import {
  ProjectIdentityRegistryErrorV01,
  readDefaultWorkspaceIdentityV01,
} from "@/lib/vnext/persistence/project-identity-registry";
import { readActiveProjectSelectionV01 } from "@/lib/vnext/persistence/project-lifecycle-registry";
import {
  ProjectHomeProjectionErrorV01,
  readProjectHomeProjectionV01,
} from "@/lib/vnext/project-home/project-home-projection";
import {
  DETERMINISTIC_CODEX_ADAPTER_VERSION_V01,
  DETERMINISTIC_CODEX_CAPABILITY_VERSION_V01,
} from "@/lib/vnext/native-host/deterministic-codex-adapter";
import {
  LOCAL_PROJECT_VERIFICATION_ADAPTER_VERSION_V01,
  LOCAL_PROJECT_VERIFICATION_CAPABILITY_VERSION_V01,
} from "@/lib/vnext/native-host/local-project-verification-adapter";
import { DEFAULT_LIVE_TIMEOUT_MS } from "@/lib/vnext/runtime/live-native-host-run-service";
import { getLiveNativeHostRunServiceV01 } from "@/lib/vnext/runtime/live-native-host-run-service";
import { readDelegatedWorkProjectionV01 } from "@/lib/vnext/delegated-work/delegated-work-source";
import { readVNextLocalOperatorPilotConfigV01 } from "@/lib/vnext/runtime/local-operator-session";
import { VNextOperatorPilotContinuityErrorV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import type { BoundedAutomationHostContractV01 } from "@/lib/vnext/runtime/bounded-automation-cycle";
import type {
  BlankStateRouteModeV01,
  BlankStateSourceV01,
} from "@/types/vnext/blank-state";
import type { ProjectHomeProjectionV01 } from "@/types/vnext/project-home";

interface BlankStateSourceInputV01 {
  route_mode: BlankStateRouteModeV01;
  requested_project_id?: string | null;
}

interface BlankStateSourceDependenciesV01 {
  open_database: () => Database.Database;
  read_source: (
    db: Database.Database,
    input: BlankStateSourceInputV01,
  ) => Promise<BlankStateSourceV01>;
}

export async function loadBlankStateSourceV01(
  input: BlankStateSourceInputV01,
  dependencies: Partial<BlankStateSourceDependenciesV01> = {},
): Promise<BlankStateSourceV01> {
  const db = (dependencies.open_database ?? openDatabase)();
  try {
    return await (dependencies.read_source ?? readBlankStateSourceV01)(db, input);
  } finally {
    db.close();
  }
}

export async function readBlankStateSourceV01(
  db: Database.Database,
  input: BlankStateSourceInputV01,
): Promise<BlankStateSourceV01> {
  const recentProjects = await listRecentProjectsV01(db);
  const workspace = readDefaultWorkspaceIdentityV01(db);
  const activeSelection = workspace
    ? readActiveProjectSelectionV01(db, workspace.workspace_id)
    : null;
  const requestedProjectId = input.requested_project_id ?? null;
  const targetProjectId = input.route_mode === "viewed_project"
    ? requestedProjectId
    : activeSelection?.project_id ?? null;

  if (!workspace || !targetProjectId) {
    return {
      route_mode: input.route_mode,
      requested_project_id: requestedProjectId,
      active_project_id: activeSelection?.project_id ?? null,
      recent_projects: recentProjects,
      projection: null,
      project_resolution: "none",
      direct_host_round_trip_available: false,
      delegated_work: null,
    };
  }

  let projection: ProjectHomeProjectionV01 | null = null;
  let projectResolution: BlankStateSourceV01["project_resolution"] = "resolved";
  try {
    const operatorConfig = readMatchingOperatorConfigV01(
      workspace.workspace_id,
      targetProjectId,
    );
    projection = await readProjectHomeProjectionV01(
      db,
      {
        workspace_id: workspace.workspace_id,
        project_id: targetProjectId,
      },
      {
        operator_config: operatorConfig,
        automation_host_contract: automationHostContractV01(),
      },
    );
  } catch (error) {
    if (isProjectNotFoundErrorV01(error)) {
      projectResolution = "not_found";
    } else if (error instanceof VNextOperatorPilotContinuityErrorV01) {
      projectResolution = "unavailable";
    } else {
      throw error;
    }
  }

  const operatorConfig = readMatchingOperatorConfigV01(
    workspace.workspace_id,
    targetProjectId,
  );
  const delegatedWork =
    projection?.project_summary.is_active && operatorConfig
      ? readDelegatedWorkProjectionV01(db, {
          config: operatorConfig,
          live_run:
            getLiveNativeHostRunServiceV01().read(operatorConfig),
        })
      : null;

  return {
    route_mode: input.route_mode,
    requested_project_id: requestedProjectId,
    active_project_id: activeSelection?.project_id ?? null,
    recent_projects: recentProjects,
    projection,
    project_resolution: projection ? "resolved" : projectResolution,
    direct_host_round_trip_available: projection
      ? directHostRoundTripAvailableV01(projection)
      : false,
    delegated_work: delegatedWork,
  };
}

function isProjectNotFoundErrorV01(error: unknown): boolean {
  if (error instanceof ProjectHomeProjectionErrorV01) return true;
  return (
    error instanceof ProjectIdentityRegistryErrorV01 &&
    [
      "workspace_identity_invalid",
      "project_identity_invalid",
      "project_identity_scope_mismatch",
    ].includes(error.code)
  );
}

function automationHostContractV01(): BoundedAutomationHostContractV01 {
  const deterministic =
    process.env.AUGNES_CANONICAL_TEST_MODE === "1" &&
    process.env.AUGNES_VNEXT_BOUNDED_CYCLE_DETERMINISTIC_ADAPTER === "1";
  return deterministic
    ? {
        adapter_version: DETERMINISTIC_CODEX_ADAPTER_VERSION_V01,
        capability_version: DETERMINISTIC_CODEX_CAPABILITY_VERSION_V01,
        timeout_ms: DEFAULT_LIVE_TIMEOUT_MS,
        execution_profile: "deterministic_zero_model",
        provider_egress: "forbidden",
      }
    : {
        adapter_version: LOCAL_PROJECT_VERIFICATION_ADAPTER_VERSION_V01,
        capability_version: LOCAL_PROJECT_VERIFICATION_CAPABILITY_VERSION_V01,
        timeout_ms: DEFAULT_LIVE_TIMEOUT_MS,
        execution_profile: "deterministic_zero_model",
        provider_egress: "forbidden",
      };
}

function readMatchingOperatorConfigV01(
  workspaceId: string,
  projectId: string,
) {
  try {
    const config = readVNextLocalOperatorPilotConfigV01(process.env);
    return config.workspace_id === workspaceId && config.project_id === projectId
      ? config
      : null;
  } catch {
    return null;
  }
}

function directHostRoundTripAvailableV01(
  projection: ProjectHomeProjectionV01,
): boolean {
  if (
    !projection.project_summary.is_active ||
    projection.project_summary.root_availability !== "available"
  ) {
    return false;
  }
  return readMatchingOperatorConfigV01(
    projection.workspace_id,
    projection.project_id,
  ) !== null;
}
