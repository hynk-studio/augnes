import { Suspense } from "react";

import { SharedProjectInspectorLoader } from "@/components/workbench/inspector/shared-project-inspector-loader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Shared Inspector | Augnes",
  description:
    "Authenticated, project-scoped, read-only drill-down over exact Augnes lineage.",
};

export default function SharedProjectInspectorPage() {
  return (
    <Suspense fallback={<p>Validating exact Inspector target…</p>}>
      <SharedProjectInspectorLoader />
    </Suspense>
  );
}
