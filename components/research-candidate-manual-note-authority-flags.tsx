"use client";

import type { ManualResearchNoteParserResult } from "@/lib/research-candidate-review/manual-note-parser";
import type { ManualNotePreviewRuntimeAuthority } from "@/lib/research-candidate-review/manual-note-runtime-preview";
import type { ResearchCandidateReviewAuthority } from "@/types/research-candidate-review";

type BooleanFlagGridProps = {
  title: string;
  flags:
    | ManualResearchNoteParserResult["authority"]
    | ManualNotePreviewRuntimeAuthority
    | ResearchCandidateReviewAuthority;
};

export function BooleanFlagGrid({ title, flags }: BooleanFlagGridProps) {
  return (
    <section className="perspective-inspector-section">
      <h3>{title}</h3>
      <div className="perspective-workbench-status-row">
        {Object.entries(flags).map(([key, value]) => (
          <span key={key}>
            {key} <code>{String(value)}</code>
          </span>
        ))}
      </div>
    </section>
  );
}
