import type { GuideBrief } from "@/types/guide-brief";
import { GuideBriefPanel } from "./guide-brief-panel";

type GuideBriefMiniPanelProps = {
  guideBrief: GuideBrief;
  variant: "home" | "perspective" | "workbench";
};

export function GuideBriefMiniPanel({
  guideBrief,
  variant,
}: GuideBriefMiniPanelProps) {
  const limits =
    variant === "workbench"
      ? {
          maxObserved: 3,
          maxInferred: 2,
          maxSuggested: 3,
          maxJudgment: 2,
          maxWarnings: 3,
        }
      : {
          maxObserved: 2,
          maxInferred: 1,
          maxSuggested: 2,
          maxJudgment: 2,
          maxWarnings: 2,
        };

  return (
    <GuideBriefPanel
      guideBrief={guideBrief}
      variant={variant}
      {...limits}
    />
  );
}
