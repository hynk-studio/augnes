import { PerspectiveHumanSurface } from "@/components/perspective/perspective-human-surface";
import { readCurrentPerspectiveForHumanSurface } from "@/lib/human-surface/read-current-perspective";
import { readDeltaProjectionForHumanSurface } from "@/lib/human-surface/read-delta-projection";

export async function PerspectivePublicConstellationSurface() {
  const [currentPerspectiveRead, deltaProjectionRead] = await Promise.all([
    readCurrentPerspectiveForHumanSurface(),
    readDeltaProjectionForHumanSurface(),
  ]);

  return (
    <PerspectiveHumanSurface
      currentPerspectiveRead={currentPerspectiveRead}
      deltaProjectionRead={deltaProjectionRead}
    />
  );
}
