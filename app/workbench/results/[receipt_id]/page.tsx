import { projectClientEntryHref } from "@/lib/vnext/project-client-href";
import { resolveProjectClientEntryProjectV01 } from "@/lib/vnext/runtime/project-client-entry";
import { notFound, redirect } from "next/navigation";

import { RunResultReviewLoader } from "@/components/workbench/result-review/run-result-review-loader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Result review | Augnes",
  description: "Review a project result, its verification, open questions, and next action.",
};

export default async function RunResultReviewPage({
  params, searchParams,
}: {
  params: Promise<{ receipt_id: string }>;
  searchParams: Promise<{ project_id?: string }>;
}) {
  const { receipt_id: receiptSlug } = await params;
  if (!/^run-receipt~[a-f0-9]{24}$/u.test(receiptSlug)) notFound();
  const receiptId = receiptSlug.replace("~", ":");
  const query = await searchParams;
  const { project_id } = query;
  const projectId = resolveProjectClientEntryProjectV01(project_id);
  if (project_id === undefined && projectId) redirect(projectClientEntryHref(`/workbench/results/${receiptSlug}`, query, projectId));
  return <RunResultReviewLoader receiptId={receiptId} projectId={projectId} />;
}
