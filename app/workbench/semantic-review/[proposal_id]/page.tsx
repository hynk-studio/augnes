import { SemanticReviewSurface } from "@/components/workbench/semantic-review/semantic-review-surface";
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Episode Delta Proposal Review | Augnes",
  description:
    "Authenticated local EpisodeDeltaProposal detail and ReviewDecision preparation.",
};

export default async function SemanticReviewProposalPage({
  params,
}: {
  params: Promise<{ proposal_id: string }>;
}) {
  const { proposal_id: proposalSlug } = await params;
  if (!/^episode-delta-proposal~[a-f0-9]{24}$/.test(proposalSlug)) {
    notFound();
  }
  const proposalId = proposalSlug.replace("~", ":");
  return <SemanticReviewSurface proposalId={proposalId} />;
}
