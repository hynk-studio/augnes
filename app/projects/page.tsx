import { BlankStateSurface } from "@/components/blank-state/blank-state-surface";
import { loadProjectGuideBriefV02 } from "@/lib/vnext/guide-brief/project-guide-brief-source";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const { source, guide } = await loadProjectGuideBriefV02({ route_mode: "project_management" });
  return <BlankStateSurface source={source} guide={guide} />;
}
