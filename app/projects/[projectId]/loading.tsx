import { ProductShell } from "@/components/product-shell";

export default function BlankStateProjectLoading() {
  return (
    <ProductShell primaryZone="blank-state">
      <main className="blank-state-shell product-route-state" aria-busy="true" aria-live="polite">
        <p className="blank-state-eyebrow">Continuities</p>
        <h1>Opening this project…</h1>
        <p>Reading the current situation without changing the current project.</p>
      </main>
    </ProductShell>
  );
}
