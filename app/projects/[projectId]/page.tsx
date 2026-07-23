import { notFound } from "next/navigation";

import { BlankStateSurface } from "@/components/blank-state/blank-state-surface";
import { loadProjectGuideBriefV02 } from "@/lib/vnext/guide-brief/project-guide-brief-source";

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

  const { source, guide } = await loadProjectGuideBriefV02({
    route_mode: "viewed_project",
    project_id: projectId,
  });
  if (source.project_resolution !== "resolved") notFound();
  return <BlankStateSurface source={source} guide={guide} />;
}
