import { AgentWorkplane } from "@/components/workplane/agent-workplane";
import { ProductShell } from "@/components/product-shell";

export const metadata = {
  title: "Augnes Agent Workplane",
  description:
    "Read-only entry to project-scoped native-host results and Inspector lineage.",
};

export default function WorkbenchPage() {
  return (
    <ProductShell primaryZone="ai-workplane">
      <AgentWorkplane />
    </ProductShell>
  );
}
