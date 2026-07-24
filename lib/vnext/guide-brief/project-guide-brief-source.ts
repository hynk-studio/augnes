import type Database from "better-sqlite3";

import { openDatabase } from "@/lib/db";
import {
  readBlankStateSourceV01,
} from "@/lib/vnext/blank-state/blank-state-source";
import {
  buildProjectGuideBriefV02,
} from "@/lib/vnext/guide-brief/project-guide-brief";
import type {
  BlankStateRouteModeV01,
  BlankStateSourceV01,
} from "@/types/vnext/blank-state";
import type {
  GuideBriefAIWorkplaneProjectionV02,
  ProjectGuideBriefV02,
} from "@/types/vnext/guide-brief";

export interface ProjectGuideBriefReadInputV02 {
  route_mode?: BlankStateRouteModeV01;
  project_id?: string | null;
  generated_at?: string;
}

export interface ProjectGuideBriefSourceBundleV02 {
  source: BlankStateSourceV01;
  guide: ProjectGuideBriefV02;
}

interface ProjectGuideBriefSourceDependenciesV02 {
  open_database: () => Database.Database;
  read_source: typeof readBlankStateSourceV01;
  now: () => string;
}

export async function loadProjectGuideBriefV02(
  input: ProjectGuideBriefReadInputV02 = {},
  dependencies: Partial<ProjectGuideBriefSourceDependenciesV02> = {},
): Promise<ProjectGuideBriefSourceBundleV02> {
  const db = (dependencies.open_database ?? openDatabase)();
  try {
    return await readProjectGuideBriefV02(db, input, dependencies);
  } finally {
    db.close();
  }
}

export async function readProjectGuideBriefV02(
  db: Database.Database,
  input: ProjectGuideBriefReadInputV02 = {},
  dependencies: Pick<Partial<ProjectGuideBriefSourceDependenciesV02>, "read_source" | "now"> = {},
): Promise<ProjectGuideBriefSourceBundleV02> {
  const projectId = input.project_id ?? null;
  const routeMode = input.route_mode ?? (projectId ? "viewed_project" : "canonical");
  if (projectId && routeMode !== "viewed_project") {
    throw new Error("guide_brief_project_route_mode_conflict");
  }
  const source = await (dependencies.read_source ?? readBlankStateSourceV01)(db, {
    route_mode: routeMode,
    requested_project_id: projectId,
  });
  return {
    source,
    guide: buildProjectGuideBriefV02({
      source,
      generated_at: input.generated_at ?? (dependencies.now ?? (() => new Date().toISOString()))(),
    }),
  };
}

export async function loadProjectGuideBriefAIWorkplaneProjectionV02(): Promise<GuideBriefAIWorkplaneProjectionV02> {
  try {
    return (await loadProjectGuideBriefV02()).guide.projections.ai_workplane;
  } catch {
    return {
      status: "unavailable",
      project_name: null,
      current_coordinate: "Current project guidance is unavailable",
      current_goal: null,
      important_constraints: [],
      work_or_result_status: "Use the existing work surface without inferring missing project state.",
      material_blocker_or_judgment: "Current read sources could not be resolved.",
      unresolved_user_judgments: [],
      recommended_review_focus: "Continue only from verified current project information",
      exact_detail_href: null,
      delegated_work: null,
    };
  }
}
