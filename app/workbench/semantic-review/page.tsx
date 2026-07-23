import { SemanticReviewSurface } from "@/components/workbench/semantic-review/semantic-review-surface";
import { loadProjectGuideBriefAIWorkplaneProjectionV02 } from "@/lib/vnext/guide-brief/project-guide-brief-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Augnes Semantic Review Workbench",
  description:
    "Opt-in local review of EpisodeDeltaProposal candidates and explicit ReviewDecision preparation.",
};

export default async function SemanticReviewPage() {
  const guide = await loadProjectGuideBriefAIWorkplaneProjectionV02();
  return <SemanticReviewSurface guide={guide} />;
}
