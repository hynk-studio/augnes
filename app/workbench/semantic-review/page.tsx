import { redirect } from "next/navigation";
import { projectClientEntryHref } from "@/lib/vnext/project-client-href";
import { resolveProjectClientEntryProjectV01 } from "@/lib/vnext/runtime/project-client-entry";
import { SemanticReviewSurface } from "@/components/workbench/semantic-review/semantic-review-surface";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Augnes AI Workplane",
  description: "Review current work, results, suggested changes, and protected project decisions.",
};

export default async function SemanticReviewPage({ searchParams }: { searchParams: Promise<{ project_id?: string }> }) {
  const query = await searchParams;
  const { project_id } = query;
  const projectId = resolveProjectClientEntryProjectV01(project_id);
  if (project_id === undefined && projectId) redirect(projectClientEntryHref("/workbench/semantic-review", query, projectId));
  return <SemanticReviewSurface projectId={projectId} />;
}
