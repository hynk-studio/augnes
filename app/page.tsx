import { DashboardPanel } from "@/components/dashboard-panel";

const panels = [
  {
    title: "Chat Cockpit",
    eyebrow: "Input",
    body: "Conversation surface reserved for steering work sessions.",
  },
  {
    title: "Temporal Delta Proposals",
    eyebrow: "Pending",
    body: "Typed state changes will queue here before commit or rejection.",
  },
  {
    title: "State Snapshot",
    eyebrow: "Active",
    body: "Current committed state will summarize the runtime context.",
  },
  {
    title: "State Trajectory View",
    eyebrow: "Timeline",
    body: "State keys will show how they changed across sessions.",
  },
  {
    title: "Tensions",
    eyebrow: "Review",
    body: "Conflicts and temporal layering decisions will appear here.",
  },
  {
    title: "State-Grounded Actions",
    eyebrow: "Next",
    body: "Actions derived from committed state will be staged here.",
  },
];

export default function Home() {
  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="kicker">Augnes</p>
          <h1>Temporal State Cockpit</h1>
        </div>
        <div className="status-pill">Scaffold</div>
      </header>

      <section className="panel-grid" aria-label="Augnes dashboard panels">
        {panels.map((panel) => (
          <DashboardPanel
            key={panel.title}
            title={panel.title}
            eyebrow={panel.eyebrow}
          >
            {panel.body}
          </DashboardPanel>
        ))}
      </section>
    </main>
  );
}
