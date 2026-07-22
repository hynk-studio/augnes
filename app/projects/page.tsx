import { BlankStateSurface } from "@/components/blank-state/blank-state-surface";
import { loadBlankStateSourceV01 } from "@/lib/vnext/blank-state/blank-state-source";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const source = await loadBlankStateSourceV01({ route_mode: "project_management" });
  return <BlankStateSurface source={source} />;
}
