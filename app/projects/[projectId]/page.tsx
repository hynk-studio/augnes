import { notFound } from "next/navigation";

import { BlankStateSurface } from "@/components/blank-state/blank-state-surface";
import { loadBlankStateSourceV01 } from "@/lib/vnext/blank-state/blank-state-source";

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

  const source = await loadBlankStateSourceV01({
    route_mode: "viewed_project",
    requested_project_id: projectId,
  });
  if (source.project_resolution !== "resolved") notFound();
  return <BlankStateSurface source={source} />;
}
