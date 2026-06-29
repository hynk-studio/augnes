import projectConstellationData from "@/fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json";

type ConstellationPreviewData = {
  nodes: Array<{ id: string }>;
  edges: Array<{ source: string; target: string }>;
};

type PublicNodeTone = "anchor" | "source" | "review" | "decision";

type PublicNodeDisplay = {
  id: string;
  label: string;
  summary: string;
  x: number;
  y: number;
  tone: PublicNodeTone;
};

const constellation = projectConstellationData as ConstellationPreviewData;

const nodeDisplays: PublicNodeDisplay[] = [
  {
    id: "node.lab_evidence_baseline",
    label: "Project frame",
    summary: "The reference frame for the current shape.",
    x: 14,
    y: 20,
    tone: "anchor",
  },
  {
    id: "node.grounded_quiet_probe",
    label: "Source examples",
    summary: "Examples that make the review set concrete.",
    x: 40,
    y: 14,
    tone: "source",
  },
  {
    id: "node.first_fixture_subset",
    label: "Sample set",
    summary: "A small set used to keep the shape readable.",
    x: 66,
    y: 23,
    tone: "source",
  },
  {
    id: "node.manifest_routing",
    label: "Review map",
    summary: "Connections that show where review should continue.",
    x: 30,
    y: 50,
    tone: "review",
  },
  {
    id: "node.manifest_hardening",
    label: "Shape checks",
    summary: "Checks that keep the view coherent.",
    x: 56,
    y: 54,
    tone: "review",
  },
  {
    id: "node.closeout_decision",
    label: "Stop point",
    summary: "A boundary that keeps future work separate.",
    x: 79,
    y: 52,
    tone: "decision",
  },
  {
    id: "node.project_constellation_ia_next_direction",
    label: "Next direction",
    summary: "The next useful review surface.",
    x: 62,
    y: 78,
    tone: "anchor",
  },
];

const nodeById = new Map(nodeDisplays.map((node) => [node.id, node]));
const relationships = constellation.edges
  .map((edge, index) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) return null;
    return { id: `${edge.source}-${edge.target}-${index}`, source, target };
  })
  .filter((relationship): relationship is NonNullable<typeof relationship> =>
    Boolean(relationship),
  );

const tensionSummaries = [
  "The project shape needs to stay readable before deeper review.",
  "Research candidates need review without becoming product state.",
  "Promotion readiness remains review prep, not approval.",
] as const;

const reviewSurfaces = [
  {
    label: "Perspective",
    summary: "Open the project shape and relationship view.",
    href: "/perspective",
  },
  {
    label: "Research candidate review",
    summary: "Inspect candidate claims, evidence, tensions, and gaps.",
    href: "/workbench#research-candidate-review-preview",
  },
  {
    label: "Review memory",
    summary: "Follow review continuity and candidate history.",
    href: "/workbench",
  },
  {
    label: "Promotion readiness",
    summary: "Promotion readiness is review prep, not approval. Human review still required.",
    href: "/perspective/promotion",
  },
] as const;

export function AugnesPublicHomeSurface() {
  return (
    <main className="augnes-public-surface" data-testid="augnes-public-home-surface">
      <section className="augnes-public-hero" aria-labelledby="augnes-public-title">
        <header className="augnes-public-header">
          <div>
            <p className="augnes-public-kicker">AUGNES</p>
            <h1 id="augnes-public-title">Augnes</h1>
            <p>Understand the current project shape, tensions, and review surfaces.</p>
          </div>
          <a className="augnes-public-workbench-link" href="/workbench">
            Open workbench
          </a>
        </header>

        <div className="augnes-public-first-grid">
          <section className="augnes-public-primary" aria-labelledby="augnes-project-shape-title">
            <div className="augnes-public-section-heading">
              <p>Current project shape</p>
              <h2 id="augnes-project-shape-title">Project constellation</h2>
              <span>
                Start with the shape of the project before opening detailed review.
              </span>
            </div>

            <div className="augnes-public-constellation" aria-label="Current project shape preview">
              <svg
                className="augnes-public-constellation-lines"
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {relationships.map((relationship) => (
                  <line
                    key={relationship.id}
                    x1={relationship.source.x}
                    y1={relationship.source.y}
                    x2={relationship.target.x}
                    y2={relationship.target.y}
                  />
                ))}
              </svg>
              {nodeDisplays.map((node) => (
                <article
                  className={`augnes-public-node augnes-public-node--${node.tone}`}
                  key={node.id}
                  style={{ left: `${node.x}%`, top: `${node.y}%` }}
                >
                  <strong>{node.label}</strong>
                  <span>{node.summary}</span>
                </article>
              ))}
            </div>

            <div className="augnes-public-shape-summary" aria-label="Project shape summary">
              <span>{constellation.nodes.length} project points</span>
              <span>{relationships.length} visible relationships</span>
              <a href="/perspective">Open Perspective</a>
            </div>
          </section>

          <aside className="augnes-public-side" aria-label="Augnes review summary">
            <section className="augnes-public-card" aria-labelledby="augnes-attention-title">
              <div className="augnes-public-section-heading">
                <p>What needs attention</p>
                <h2 id="augnes-attention-title">Tensions</h2>
              </div>
              <ol className="augnes-public-tensions">
                {tensionSummaries.map((tension) => (
                  <li key={tension}>{tension}</li>
                ))}
              </ol>
            </section>

            <section className="augnes-public-card" aria-labelledby="augnes-current-work-title">
              <div className="augnes-public-section-heading">
                <p>Current work summary</p>
                <h2 id="augnes-current-work-title">Continue from review</h2>
              </div>
              <p>
                Use the project shape first, then choose the review surface that matches the
                next human decision.
              </p>
            </section>

            <section className="augnes-public-review-section" aria-labelledby="augnes-review-title">
              <div className="augnes-public-section-heading">
                <p>Continue review</p>
                <h2 id="augnes-review-title">Review surfaces</h2>
                <span>Choose a focused surface before entering the workbench.</span>
              </div>
              <div className="augnes-public-review-grid">
                {reviewSurfaces.map((surface) => (
                  <a className="augnes-public-review-card" href={surface.href} key={surface.label}>
                    <strong>{surface.label}</strong>
                    <span>{surface.summary}</span>
                  </a>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
