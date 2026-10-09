import { projectClientEntryHref } from "@/lib/vnext/project-client-href";
import { resolveProjectClientEntryProjectV01 } from "@/lib/vnext/runtime/project-client-entry";
import { SemanticReviewSurface } from "@/components/workbench/semantic-review/semantic-review-surface";
import { notFound, redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Suggested change review | Augnes",
  description: "Review what would change, verification, uncertainty, and your protected decision.",
};

export default async function SemanticReviewProposalPage({
  params, searchParams,
}: {
  params: Promise<{ proposal_id: string }>;
  searchParams: Promise<{ project_id?: string }>;
}) {
  const { proposal_id: proposalSlug } = await params;
  if (!/^episode-delta-proposal~[a-f0-9]{24}$/.test(proposalSlug)) {
    notFound();
  }
  const proposalId = proposalSlug.replace("~", ":");
  const query = await searchParams;
  const { project_id } = query;
  const projectId = resolveProjectClientEntryProjectV01(project_id);
  if (project_id === undefined && projectId) redirect(projectClientEntryHref(`/workbench/semantic-review/${proposalSlug}`, query, projectId));
  return <SemanticReviewSurface proposalId={proposalId} projectId={projectId} />;
}
