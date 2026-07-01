import { AugnesCockpit } from "@/components/augnes-cockpit";
import { GuideBriefMiniPanel } from "@/components/guide/guide-brief-mini-panel";
import { CurrentPerspectiveWorkplanePanel } from "@/components/workplane/current-perspective-workplane-panel";
import { DeltaBatchPanel } from "@/components/workplane/delta-batch-panel";
import { DeltaProjectionWorkplanePanel } from "@/components/workplane/delta-projection-workplane-panel";
import { EvidenceHandoffWorkplanePanel } from "@/components/workplane/evidence-handoff-workplane-panel";
import { HandoffBuilderPreviewPanel } from "@/components/workplane/handoff-builder-preview-panel";
import { LegacyCockpitCompatibilityPanel } from "@/components/workplane/legacy-cockpit-compatibility-panel";
import { ProjectionCandidatesPanel } from "@/components/workplane/projection-candidates-panel";
import { ReviewQueueWorkplanePanel } from "@/components/workplane/review-queue-workplane-panel";
import { RunPostmortemSkeletonPanel } from "@/components/workplane/run-postmortem-skeleton-panel";
import { TraceDiagnosticsPanel } from "@/components/workplane/trace-diagnostics-panel";
import { WorkQueuePanel } from "@/components/workplane/work-queue-panel";
import { WorkplaneHeader } from "@/components/workplane/workplane-header";
import { WorkplaneInspector } from "@/components/workplane/workplane-inspector";
import { WorkplaneOverview } from "@/components/workplane/workplane-overview";
import { readGuideBriefForWeb } from "@/lib/guide/read-guide-brief-for-web";
import { readWorkplaneContext } from "@/lib/workplane/read-workplane-context";
import type { CSSProperties } from "react";

const surfaceStyle: CSSProperties = {
  minHeight: "100vh",
  boxSizing: "border-box",
  padding: "clamp(12px, 4vw, 28px)",
  background:
    "linear-gradient(180deg, #eaf0f8 0%, #f8fafc 42%, #eef2f7 100%)",
  color: "#0f172a",
  overflowX: "hidden",
};

const shellStyle: CSSProperties = {
  display: "grid",
  gap: "14px",
  width: "min(1560px, 100%)",
  minWidth: 0,
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

const previewSectionStyle: CSSProperties = {
  display: "grid",
  gap: "12px",
  minWidth: 0,
};

const previewHeadingStyle: CSSProperties = {
  display: "grid",
  gap: "4px",
  minWidth: 0,
  padding: "14px",
  border: "1px solid rgba(30, 41, 59, 0.12)",
  borderRadius: "8px",
  background: "rgba(255, 255, 255, 0.9)",
  overflowWrap: "anywhere",
};

const previewKickerStyle: CSSProperties = {
  margin: 0,
  color: "#64748b",
  fontSize: "0.72rem",
  fontWeight: 820,
  textTransform: "uppercase",
};

const previewTitleStyle: CSSProperties = {
  margin: 0,
  color: "#0f172a",
  fontSize: "1.06rem",
  lineHeight: 1.2,
};

const previewCopyStyle: CSSProperties = {
  margin: 0,
  color: "#475569",
  fontSize: "0.82rem",
  lineHeight: 1.38,
  overflowWrap: "anywhere",
};

export async function AgentWorkplane() {
  const [context, guideBrief] = await Promise.all([
    readWorkplaneContext(),
    Promise.resolve(readGuideBriefForWeb()),
  ]);

  return (
    <div aria-label="Agent Workplane" style={surfaceStyle}>
      <div style={shellStyle}>
        <WorkplaneHeader />
        <WorkplaneOverview context={context} />
        <GuideBriefMiniPanel guideBrief={guideBrief} variant="workbench" />

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
            aria-label="Agent Workplane projection and handoff previews"
            style={previewSectionStyle}
          >
            <div style={previewHeadingStyle}>
              <p style={previewKickerStyle}>Phase 5C read-only preview</p>
              <h2 style={previewTitleStyle}>
                Projection, handoff, postmortem, and trace skeletons
              </h2>
              <p style={previewCopyStyle}>
                These panels expose preview-only backend context for projection
                candidates, Delta Batch review, handoff builder inputs, run
                postmortem slots, and bounded trace diagnostics. No hidden
                execution authority is added: no apply, approve, reject, send,
                launch Codex, provider/GitHub call, proof/evidence write, DB
                write, memory mutation, scheduler, merge, publish, retry,
                replay, or deploy behavior.
              </p>
            </div>

            <section
              aria-label="Agent Workplane Phase 5C preview panels"
              style={panelGridStyle}
            >
              <ProjectionCandidatesPanel context={context} />
              <DeltaBatchPanel context={context} />
              <HandoffBuilderPreviewPanel context={context} />
              <RunPostmortemSkeletonPanel context={context} />
              <TraceDiagnosticsPanel context={context} />
            </section>
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
