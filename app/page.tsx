import { BlankStateSurface } from "@/components/blank-state/blank-state-surface";
import { loadProjectGuideBriefV02 } from "@/lib/vnext/guide-brief/project-guide-brief-source";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { source, guide } = await loadProjectGuideBriefV02({ route_mode: "canonical" });
  return <BlankStateSurface source={source} guide={guide} />;
}
