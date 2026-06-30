import { AugnesCockpit } from "@/components/augnes-cockpit";
import { CurrentPerspectiveWorkplanePanel } from "@/components/workplane/current-perspective-workplane-panel";
import { DeltaProjectionWorkplanePanel } from "@/components/workplane/delta-projection-workplane-panel";
import { EvidenceHandoffWorkplanePanel } from "@/components/workplane/evidence-handoff-workplane-panel";
import { LegacyCockpitCompatibilityPanel } from "@/components/workplane/legacy-cockpit-compatibility-panel";
import { ReviewQueueWorkplanePanel } from "@/components/workplane/review-queue-workplane-panel";
import { WorkQueuePanel } from "@/components/workplane/work-queue-panel";
import { WorkplaneHeader } from "@/components/workplane/workplane-header";
import { WorkplaneInspector } from "@/components/workplane/workplane-inspector";
import { WorkplaneOverview } from "@/components/workplane/workplane-overview";
import { readWorkplaneContext } from "@/lib/workplane/read-workplane-context";
import type { CSSProperties } from "react";

const surfaceStyle: CSSProperties = {
  minHeight: "100vh",
  padding: "28px",
  background:
    "linear-gradient(180deg, #eaf0f8 0%, #f8fafc 42%, #eef2f7 100%)",
  color: "#0f172a",
};

const shellStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  width: "min(1560px, 100%)",
  margin: "0 auto",
};

const layoutStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: "14px",
  alignItems: "start",
};

const panelGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
  gap: "14px",
  alignItems: "start",
};

export async function AgentWorkplane() {
  const context = await readWorkplaneContext();

  return (
    <div aria-label="Agent Workplane" style={surfaceStyle}>
      <div style={shellStyle}>
        <WorkplaneHeader />
        <WorkplaneOverview context={context} />

        <section aria-label="Agent Workplane layout" style={layoutStyle}>
          <section aria-label="Agent Workplane panels" style={panelGridStyle}>
            <WorkQueuePanel context={context} />
            <CurrentPerspectiveWorkplanePanel context={context} />
            <DeltaProjectionWorkplanePanel context={context} />
            <ReviewQueueWorkplanePanel context={context} />
            <EvidenceHandoffWorkplanePanel context={context} />
            <WorkplaneInspector context={context} />
          </section>

          <section
            aria-label="Agent Workplane active compatibility content"
            style={{ minWidth: 0 }}
          >
            <LegacyCockpitCompatibilityPanel>
              <AugnesCockpit />
            </LegacyCockpitCompatibilityPanel>
          </section>
        </section>
      </div>
    </div>
  );
}
