import { redirect } from "next/navigation";
import { projectClientEntryHref } from "@/lib/vnext/project-client-href";
import { Suspense } from "react";
import { resolveProjectClientEntryProjectV01 } from "@/lib/vnext/runtime/project-client-entry";

import { SharedProjectInspectorLoader } from "@/components/workbench/inspector/shared-project-inspector-loader";
import { ProductShell } from "@/components/product-shell";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Exact details | Augnes",
  description:
    "Contextual, project-scoped, read-only detail for an exact Augnes item.",
};

export default async function SharedProjectInspectorPage({ searchParams }: { searchParams: Promise<{ project_id?: string }> }) {
  const query = await searchParams;
  const { project_id } = query;
  const projectId = resolveProjectClientEntryProjectV01(project_id);
  if (project_id === undefined && projectId) redirect(projectClientEntryHref("/workbench/inspector", query, projectId));
  return (
    <Suspense fallback={<ProductShell primaryZone="ai-workplane"><main className="product-route-state" aria-live="polite">Checking exact details…</main></ProductShell>}>
      <SharedProjectInspectorLoader projectId={projectId} />
    </Suspense>
  );
}
