const surfaceLinks = [
  {
    label: "Perspective",
    href: "/perspective",
    summary: "Open the project shape and future timeline surface.",
  },
  {
    label: "Workbench",
    href: "/workbench",
    summary: "Open the Agent Workplane without changing work state.",
  },
  {
    label: "Manual research notes",
    href: "/research-candidate-review",
    summary:
      "Candidate-only manual research note preview. No source fetching, provider calls, retrieval/RAG, durable Perspective promotion, proof/evidence writes, or proof/evidence rows.",
  },
] as const;

export function SurfaceLinkGrid() {
  return (
    <section className="human-surface-panel" aria-labelledby="human-surface-links">
      <div className="human-surface-section-heading">
        <p>Surfaces</p>
        <h2 id="human-surface-links">Where to go next</h2>
        <span>Choose a read surface or open the existing workbench.</span>
      </div>
      <div className="human-surface-link-grid">
        {surfaceLinks.map((link) => (
          <a className="human-surface-link-card" href={link.href} key={link.href}>
            <strong>{link.label}</strong>
            <span>{link.summary}</span>
          </a>
        ))}
        <article className="human-surface-link-card is-future">
          <strong>Future Guide / ChatGPT / Codex handoff</strong>
          <span>
            Future phases can use this page as the entry point for GuideBrief,
            ChatGPT, and Codex handoff previews. Phase 4A does not add those
            controls.
          </span>
        </article>
      </div>
    </section>
  );
}
