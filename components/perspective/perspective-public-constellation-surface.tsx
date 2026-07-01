import { PerspectiveHumanSurface } from "@/components/perspective/perspective-human-surface";
import { readGuideBriefForWeb } from "@/lib/guide/read-guide-brief-for-web";
import { readCurrentPerspectiveForHumanSurface } from "@/lib/human-surface/read-current-perspective";
import { readDeltaProjectionForHumanSurface } from "@/lib/human-surface/read-delta-projection";

export async function PerspectivePublicConstellationSurface() {
  const [currentPerspectiveRead, deltaProjectionRead, guideBrief] = await Promise.all([
    readCurrentPerspectiveForHumanSurface(),
    readDeltaProjectionForHumanSurface(),
    Promise.resolve(readGuideBriefForWeb()),
  ]);

  return (
    <PerspectiveHumanSurface
      currentPerspectiveRead={currentPerspectiveRead}
      deltaProjectionRead={deltaProjectionRead}
      guideBrief={guideBrief}
    />
  );
}
