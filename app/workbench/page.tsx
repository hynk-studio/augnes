import { AgentWorkplane } from "@/components/workplane/agent-workplane";
import { ProductShell } from "@/components/product-shell";
import { loadProjectGuideBriefAIWorkplaneProjectionV02 } from "@/lib/vnext/guide-brief/project-guide-brief-source";

export const metadata = {
  title: "Augnes Agent Workplane",
  description:
    "Read-only entry to project-scoped native-host results and Inspector lineage.",
};

export default async function WorkbenchPage() {
  const guide = await loadProjectGuideBriefAIWorkplaneProjectionV02();
  return (
    <ProductShell primaryZone="ai-workplane">
      <AgentWorkplane guide={guide} />
    </ProductShell>
  );
}
