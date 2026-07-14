import { notFound } from "next/navigation";
import { ProjectDestinationActions } from "@/components/project-destination-actions";
import { openDatabase } from "@/lib/db";
import { readProjectDestinationV01 } from "@/lib/vnext/onboarding/local-project-onboarding";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const routeParams = await params;
  let projectId: string;
  try { projectId = decodeURIComponent(routeParams.projectId); }
  catch { notFound(); }
  const db = openDatabase();
  try {
    const value = await readProjectDestinationV01(db, projectId);
    if (!value) notFound();
    const active = value.active_selection?.project_id === value.project.project_id;
    return <main className="project-selector-shell"><header><p className="project-selector-eyebrow">Augnes · Project</p><h1>{value.project.display_name ?? "Unnamed project"}</h1><p>{value.root_binding.local_root.normalized_path}</p></header><section className="project-selector-card"><h2>Project connection</h2><dl><div><dt>Root status</dt><dd>{value.root_availability}</dd></div><div><dt>Project type</dt><dd>{value.external_refs.length ? "Repository-backed local project" : "Local folder"}</dd></div><div><dt>Selection</dt><dd>{active ? "Active project" : "Not currently active"}</dd></div></dl>{!active && <ProjectDestinationActions projectId={value.project.project_id} expectedProjectId={value.active_selection?.project_id ?? null} />}<p>This project is ready. Project Home summaries arrive in PR C; no legacy or unscoped data is shown here.</p></section><p><a href="/">Back to project selection</a></p></main>;
  } finally { db.close(); }
}
