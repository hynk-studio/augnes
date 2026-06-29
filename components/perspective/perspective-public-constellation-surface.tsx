import projectConstellationFixture from "@/fixtures/project-constellation.sample.sidecar-strategy-c-v0.1.json";
import type { ProjectConstellationSampleFixtureV0 } from "@/types/project-constellation-fixture";
import type { CSSProperties } from "react";

const constellation = projectConstellationFixture as ProjectConstellationSampleFixtureV0;

type PublicNodeTone = "anchor" | "source" | "sample" | "review" | "check" | "decision";

type PublicNodeDisplay = {
  label: string;
  summary: string;
  x: number;
  y: number;
  tone: PublicNodeTone;
};

const nodeDisplayById: Record<string, PublicNodeDisplay> = {
  "node.lab_evidence_baseline": {
    label: "Project frame",
    summary: "Reference material that gives the map its starting shape.",
    x: 14,
    y: 18,
    tone: "anchor",
  },
  "node.grounded_quiet_probe": {
    label: "Source examples",
    summary: "Grounded and quiet examples that make the review set concrete.",
    x: 40,
    y: 12,
    tone: "source",
  },
  "node.first_fixture_subset": {
    label: "First sample set",
    summary: "A small selected set used to keep the project shape readable.",
    x: 65,
    y: 22,
    tone: "sample",
  },
  "node.manifest_routing": {
    label: "Review map",
    summary: "The connections that keep the sample set oriented.",
    x: 28,
    y: 48,
    tone: "review",
  },
  "node.manifest_hardening": {
    label: "Shape checks",
    summary: "Simple checks that keep the map consistent enough to review.",
    x: 55,
    y: 52,
    tone: "check",
  },
  "node.closeout_decision": {
    label: "Stop decision",
    summary: "A clear stop point so future work does not blur into this view.",
    x: 78,
    y: 50,
    tone: "decision",
  },
  "node.ag_resume_isolation_constraint": {
    label: "Separation rule",
    summary: "Related work stays visible without taking over the public surface.",
    x: 22,
    y: 76,
    tone: "decision",
  },
  "node.project_constellation_ia_next_direction": {
    label: "Next direction",
    summary: "A compact path for the next human review surface.",
    x: 62,
    y: 78,
    tone: "anchor",
  },
};

const relationshipLabels: Record<string, string> = {
  derived_from: "shapes",
  depends_on: "uses",
  validates: "checks",
  supports: "supports",
  warns_against: "separates",
  next_candidate: "points to",
};

const tensions = [
  "Examples help review without looking live.",
  "The map needs shape without a checklist wall.",
  "Next work stays separate from the cockpit.",
];

const reviewSurfaces = [
  {
    label: "Project constellation detail",
    summary: "Fuller map after this shape.",
  },
  {
    label: "Research candidate review",
    summary: "Candidates after the shape.",
  },
];

const nodes = constellation.nodes
  .map((node) => ({
    id: node.id,
    ...nodeDisplayById[node.id],
  }))
  .filter((node): node is { id: string } & PublicNodeDisplay => Boolean(node.label));

const nodeById = new Map(nodes.map((node) => [node.id, node]));
const relationships = constellation.edges
  .map((edge) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    if (!source || !target) return null;
    return {
      id: edge.id,
      label: relationshipLabels[edge.type] ?? "relates",
      source,
      target,
    };
  })
  .filter((edge): edge is NonNullable<typeof edge> => Boolean(edge));

export function PerspectivePublicConstellationSurface() {
  return (
    <main
      className="perspective-public-surface"
      data-testid="perspective-public-constellation-surface"
    >
      <section className="perspective-public-first-screen" aria-labelledby="perspective-public-title">
        <header className="perspective-public-header">
          <div>
            <p className="perspective-public-kicker">Augnes</p>
            <h1 id="perspective-public-title">Perspective</h1>
            <p>A public view of the current project shape, tensions, and review surfaces.</p>
          </div>
          <div className="perspective-public-header-rail">
            <a className="perspective-public-cockpit-link" href="/workbench">
              Open cockpit workbench
            </a>
            <div className="perspective-public-counts" aria-label="Constellation counts">
              <span>
                <strong>{nodes.length}</strong> nodes
              </span>
              <span>
                <strong>{relationships.length}</strong> relationships
              </span>
              <span>
                <strong>{tensions.length}</strong> tensions
              </span>
            </div>
          </div>
        </header>

        <div className="perspective-public-grid">
          <section className="perspective-public-map" aria-labelledby="perspective-public-shape">
            <div className="perspective-public-section-heading">
              <p>Current project shape</p>
              <h2 id="perspective-public-shape">Project constellation</h2>
              <span>Start with the constellation: it shows the current project shape before you open review surfaces.</span>
            </div>

            <div className="perspective-public-map-canvas" aria-label="Project nodes and relationships">
              <svg
                className="perspective-public-map-edges"
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

              <div className="perspective-public-map-nodes">
                {nodes.map((node) => (
                  <article
                    className={`perspective-public-node perspective-public-node--${node.tone}`}
                    key={node.id}
                    style={nodeStyle(node)}
                  >
                    <span>{node.label}</span>
                    <p>{node.summary}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="perspective-public-relationships" aria-label="Relationship summary">
              {relationships.slice(0, 4).map((relationship) => (
                <p key={relationship.id}>
                  <span>{relationship.source.label}</span>
                  <em>{relationship.label}</em>
                  <span>{relationship.target.label}</span>
                </p>
              ))}
            </div>
          </section>

          <aside className="perspective-public-review-column" aria-label="Review surfaces">
            <section className="perspective-public-panel" aria-labelledby="perspective-public-tensions">
              <div className="perspective-public-section-heading">
                <p>Tensions</p>
                <h2 id="perspective-public-tensions">What needs review</h2>
              </div>
              <ol className="perspective-public-tensions">
                {tensions.map((tension) => (
                  <li key={tension}>{tension}</li>
                ))}
              </ol>
            </section>

            <section className="perspective-public-panel" aria-labelledby="perspective-public-next">
              <div className="perspective-public-section-heading">
                <p>Next review surfaces</p>
                <h2 id="perspective-public-next">Where to look next</h2>
              </div>
              <div className="perspective-public-review-cards">
                {reviewSurfaces.map((surface) => (
                  <article key={surface.label}>
                    <strong>{surface.label}</strong>
                    <p>{surface.summary}</p>
                  </article>
                ))}
                <article className="perspective-public-secondary-card">
                  <strong>Promotion readiness</strong>
                  <p>Promotion readiness is review prep, not approval. Human review still required.</p>
                </article>
              </div>
            </section>

            <p className="perspective-public-workbench-note">
              <a href="/workbench">Open cockpit workbench</a>
              <span>Detailed workbench view remains in the cockpit.</span>
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}

function nodeStyle(node: PublicNodeDisplay): CSSProperties {
  return {
    left: `${node.x}%`,
    top: `${node.y}%`,
  };
}
