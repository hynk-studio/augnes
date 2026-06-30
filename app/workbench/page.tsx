import { AgentWorkplane } from "@/components/workplane/agent-workplane";

export const metadata = {
  title: "Augnes Agent Workplane",
  description:
    "Read-only backend work surface for agent/operator traces, projection context, handoff pointers, and legacy Cockpit compatibility.",
};

export default function WorkbenchPage() {
  return <AgentWorkplane />;
}
