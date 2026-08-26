import { Suspense } from "react";

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

export default function SharedProjectInspectorPage() {
  return (
    <Suspense fallback={<ProductShell primaryZone="ai-workplane"><main className="product-route-state" aria-live="polite">Checking exact details…</main></ProductShell>}>
      <SharedProjectInspectorLoader />
    </Suspense>
  );
}
