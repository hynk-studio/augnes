"use client";

import { ProductShell } from "@/components/product-shell";

export default function BlankStateProjectError({ reset }: { reset: () => void }) {
  return (
    <ProductShell primaryZone="blank-state">
      <main className="blank-state-shell product-route-state product-route-state--danger" role="alert">
        <p className="blank-state-eyebrow">Blank State</p>
        <h1>This project could not be opened</h1>
        <p>No project data was changed. Retry the read or choose another project.</p>
        <div className="blank-state-error-actions">
          <button
            type="button"
            className="blank-state-primary-action"
            data-blank-state-primary-action="retry"
            data-augnes-primary-action="retry"
            onClick={reset}
          >
            Retry
          </button>
          <a className="blank-state-secondary-link" href="/projects">Choose another project</a>
        </div>
      </main>
    </ProductShell>
  );
}
