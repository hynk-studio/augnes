import { SemanticReviewSurface } from "@/components/workbench/semantic-review/semantic-review-surface";
import { notFound } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Suggested change review | Augnes",
  description: "Review what would change, verification, uncertainty, and your protected decision.",
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
