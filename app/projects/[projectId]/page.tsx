import { notFound } from "next/navigation";

import { ProjectHome } from "@/components/project-home";
import { openDatabase } from "@/lib/db";
import { ProjectIdentityRegistryErrorV01, readDefaultWorkspaceIdentityV01 } from "@/lib/vnext/persistence/project-identity-registry";
import {
  ProjectHomeProjectionErrorV01,
  readProjectHomeProjectionV01,
} from "@/lib/vnext/project-home/project-home-projection";
import type { ProjectHomeProjectionV01 } from "@/types/vnext/project-home";
import { readVNextLocalOperatorPilotConfigV01 } from "@/lib/vnext/runtime/local-operator-session";
import {
  DETERMINISTIC_CODEX_ADAPTER_VERSION_V01,
  DETERMINISTIC_CODEX_CAPABILITY_VERSION_V01,
} from "@/lib/vnext/native-host/deterministic-codex-adapter";
import {
  LOCAL_PROJECT_VERIFICATION_ADAPTER_VERSION_V01,
  LOCAL_PROJECT_VERIFICATION_CAPABILITY_VERSION_V01,
} from "@/lib/vnext/native-host/local-project-verification-adapter";
import { DEFAULT_LIVE_TIMEOUT_MS } from "@/lib/vnext/runtime/live-native-host-run-service";
import type { BoundedAutomationHostContractV01 } from "@/lib/vnext/runtime/bounded-automation-cycle";

export const dynamic = "force-dynamic";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const routeParams = await params;
  let projectId: string;
  try {
    projectId = decodeURIComponent(routeParams.projectId);
  } catch {
    notFound();
  }

  const db = openDatabase();
  let projection: ProjectHomeProjectionV01 | null = null;
  try {
    const workspace = readDefaultWorkspaceIdentityV01(db);
    if (workspace) {
      const operatorConfig = readMatchingOperatorConfigV01(
        workspace.workspace_id,
        projectId,
      );
      projection = await readProjectHomeProjectionV01(db, {
        workspace_id: workspace.workspace_id,
        project_id: projectId,
      }, {
        operator_config: operatorConfig,
        automation_host_contract: automationHostContractV01(),
      });
    }
  } catch (error) {
    if (!isProjectNotFoundError(error)) throw error;
  } finally {
    db.close();
  }

  if (!projection) notFound();
  return (
    <ProjectHome
      projection={projection}
      directHostRoundTripAvailable={directHostRoundTripAvailable(projection)}
    />
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

function directHostRoundTripAvailable(
  projection: ProjectHomeProjectionV01,
): boolean {
  if (
    !projection.project_summary.is_active ||
    projection.project_summary.root_availability !== "available"
  ) {
    return false;
  }
  try {
    const config = readVNextLocalOperatorPilotConfigV01(process.env);
    return (
      config.workspace_id === projection.workspace_id &&
      config.project_id === projection.project_id
    );
  } catch {
    return false;
  }
}

function isProjectNotFoundError(error: unknown): boolean {
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
