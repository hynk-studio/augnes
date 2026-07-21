"use client";

import { ProductShell } from "@/components/product-shell";

export default function ProjectHomeError({ reset }: { reset: () => void }) {
  return (
    <ProductShell surface="home">
      <main className="project-home-shell product-route-state product-route-state--danger" role="alert">
        <p className="project-selector-eyebrow">Project Home</p>
        <h1>Project Home could not be read</h1>
        <p>The project remains stored. Retry the local read or return to project selection.</p>
        <div className="project-home-actions">
          <button type="button" onClick={reset}>Retry</button>
          <a href="/projects">Project selection</a>
        </div>
      </main>
    </ProductShell>
  );
}
