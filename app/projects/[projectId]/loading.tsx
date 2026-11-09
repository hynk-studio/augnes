"use client";

import { useParams } from "next/navigation";
import { ProductShell } from "@/components/product-shell";

export default function BlankStateProjectLoading() {
  const params = useParams<{ projectId: string }>();
  let projectId = params.projectId;
  try {
    projectId = decodeURIComponent(projectId);
  } catch {
    // Keep malformed scope explicit; the project route refuses it.
  }
  return (
    <ProductShell primaryZone="blank-state" projectId={projectId}>
      <main className="blank-state-shell product-route-state" aria-busy="true" aria-live="polite">
        <p className="blank-state-eyebrow">Continuities</p>
        <h1>Opening this project…</h1>
        <p>Reading the current situation without changing the current project.</p>
      </main>
    </ProductShell>
  );
}
