import { BlankStatePanel } from "@/components/human-surface/blank-state-panel";
import { CurrentPerspectiveCard } from "@/components/human-surface/current-perspective-card";
import { GuideBriefMiniPanel } from "@/components/guide/guide-brief-mini-panel";
import { RecentDeltasPreview } from "@/components/human-surface/recent-deltas-preview";
import { SurfaceLinkGrid } from "@/components/human-surface/surface-link-grid";
import { readCurrentPerspectiveForHumanSurface } from "@/lib/human-surface/read-current-perspective";
import { readGuideBriefForWeb } from "@/lib/guide/read-guide-brief-for-web";

export async function HumanSurfaceHome() {
  const [currentPerspectiveRead, guideBrief] = await Promise.all([
    readCurrentPerspectiveForHumanSurface(),
    Promise.resolve(readGuideBriefForWeb()),
  ]);
  const perspective = currentPerspectiveRead.data;

  return (
    <main className="human-surface-home" data-testid="human-surface-home-v0-1">
      <section className="human-surface-shell" aria-labelledby="human-surface-title">
        <header className="human-surface-header">
          <div>
            <p className="human-surface-kicker">Augnes</p>
            <h1 id="human-surface-title">Augnes</h1>
            <p>What are you trying to do?</p>
          </div>
          <nav className="human-surface-nav" aria-label="Primary surfaces">
            <a href="/perspective">Perspective</a>
            <a href="/workbench">Workbench</a>
          </nav>
        </header>

        <div className="human-surface-layout">
          <BlankStatePanel />
          <div className="human-surface-right-rail">
            <CurrentPerspectiveCard read={currentPerspectiveRead} />
            <GuideBriefMiniPanel guideBrief={guideBrief} variant="home" />
            <RecentDeltasPreview perspective={perspective} />
            <SurfaceLinkGrid />
          </div>
        </div>
      </section>
    </main>
  );
}
