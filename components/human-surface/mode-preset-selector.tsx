const modePresets = [
  {
    id: "general",
    label: "General",
    description: "Orient around the current frame before choosing a focused surface.",
    primaryNodeTypes: ["frame", "goal", "question"],
    expectedOutputStyle: "Short working perspective",
    status: "available",
  },
  {
    id: "writing",
    label: "Writing",
    description: "Shape notes, drafts, claims, and reviewable narrative material.",
    primaryNodeTypes: ["draft", "claim", "source"],
    expectedOutputStyle: "Structured draft notes",
    status: "preview",
  },
  {
    id: "research",
    label: "Research",
    description: "Separate source refs, questions, diagnostic pressure, and gaps.",
    primaryNodeTypes: ["source", "question", "gap"],
    expectedOutputStyle: "Review-first research brief",
    status: "preview",
  },
  {
    id: "coding",
    label: "Coding",
    description: "Track code deltas, validation traces, PR pointers, and handoff refs.",
    primaryNodeTypes: ["delta", "validation", "handoff"],
    expectedOutputStyle: "Implementation review packet",
    status: "preview",
  },
  {
    id: "office",
    label: "Office",
    description: "Organize decisions, coordination traces, and follow-up work.",
    primaryNodeTypes: ["decision", "coordination", "task"],
    expectedOutputStyle: "Action-oriented work summary",
    status: "future",
  },
  {
    id: "presentation",
    label: "Presentation",
    description: "Prepare a reviewable frame for slides, narrative, or briefing.",
    primaryNodeTypes: ["thesis", "risk", "candidate"],
    expectedOutputStyle: "Briefing outline",
    status: "future",
  },
  {
    id: "agentic",
    label: "Agentic",
    description: "Frame future agent work without launching agents or Codex.",
    primaryNodeTypes: ["plan", "handoff", "boundary"],
    expectedOutputStyle: "Bounded agent handoff preview",
    status: "future",
  },
  {
    id: "physical_world_model",
    label: "Physical world model",
    description: "Hold real-world context as reviewable model notes, not authority.",
    primaryNodeTypes: ["observation", "constraint", "risk"],
    expectedOutputStyle: "Grounded context map",
    status: "future",
  },
] as const;

export function ModePresetSelector() {
  return (
    <section
      className="human-surface-section"
      aria-labelledby="human-surface-mode-title"
    >
      <div className="human-surface-section-heading">
        <p>Mode preset selector</p>
        <h2 id="human-surface-mode-title">Choose a working shape</h2>
        <span>
          Presets are display-only in Phase 4A. They do not create work, run
          agents, persist state, launch Codex, call providers, or write records.
        </span>
      </div>
      <div className="human-surface-mode-grid" aria-label="Display-only mode presets">
        {modePresets.map((preset, index) => (
          <article
            className={`human-surface-mode-card${
              index === 0 ? " is-selected" : ""
            }`}
            data-mode-preset={preset.id}
            key={preset.id}
          >
            <div>
              <strong>{preset.label}</strong>
              <span>{preset.status}</span>
            </div>
            <p>{preset.description}</p>
            <dl>
              <div>
                <dt>Nodes</dt>
                <dd>{preset.primaryNodeTypes.join(", ")}</dd>
              </div>
              <div>
                <dt>Output</dt>
                <dd>{preset.expectedOutputStyle}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
