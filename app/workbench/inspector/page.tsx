import { Suspense } from "react";

import { SharedProjectInspectorLoader } from "@/components/workbench/inspector/shared-project-inspector-loader";
import { ProductShell } from "@/components/product-shell";

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
    <Suspense fallback={<ProductShell surface="inspector"><main className="product-route-state" aria-live="polite">Validating exact Inspector target…</main></ProductShell>}>
      <SharedProjectInspectorLoader />
    </Suspense>
  );
}
