"use client";

export default function ProjectHomeError({ reset }: { reset: () => void }) {
  return (
    <main className="project-home-shell" role="alert">
      <p className="project-selector-eyebrow">Augnes · Project Home</p>
      <h1>Project Home could not be read</h1>
      <p>The project remains stored. Retry the local read or return to project selection.</p>
      <div className="project-home-actions">
        <button type="button" onClick={reset}>Retry</button>
        <a href="/projects">Project selection</a>
      </div>
    </main>
  );
}
