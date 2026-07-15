export default function ProjectHomeLoading() {
  return (
    <main className="project-home-shell" aria-busy="true" aria-live="polite">
      <p className="project-selector-eyebrow">Augnes · Project Home</p>
      <h1>Loading this project…</h1>
      <p>Reading project-scoped state and lineage from local storage.</p>
    </main>
  );
}
