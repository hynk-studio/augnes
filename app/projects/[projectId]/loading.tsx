import { ProductShell } from "@/components/product-shell";

export default function ProjectHomeLoading() {
  return (
    <ProductShell surface="home">
      <main className="project-home-shell product-route-state" aria-busy="true" aria-live="polite">
        <p className="project-selector-eyebrow">Project Home</p>
        <h1>Loading this project…</h1>
        <p>Reading project-scoped state and lineage from local storage.</p>
      </main>
    </ProductShell>
  );
}
