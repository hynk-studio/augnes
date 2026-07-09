import { BlankStateAutohuntTargetOptionsPanel } from "@/components/human-surface/blank-state-autohunt-target-options-panel";
import { BlankStateReviewEntryGrid } from "@/components/human-surface/blank-state-review-entry-grid";
import { ModePresetSelector } from "@/components/human-surface/mode-preset-selector";
import type { BlankStateReviewEntry } from "@/lib/human-surface/blank-state-review-entries";
import type { AutohuntWorkTargetModeSummary } from "@/types/autohunt-work-target-mode";

type BlankStatePanelProps = {
  entries: BlankStateReviewEntry[];
  autohuntTargetModeSummary: AutohuntWorkTargetModeSummary;
};

export function BlankStatePanel({
  entries,
  autohuntTargetModeSummary,
}: BlankStatePanelProps) {
  return (
    <section className="human-surface-blank-state" aria-labelledby="blank-state-title">
      <div className="human-surface-section-heading">
        <p>Guided Blank State</p>
        <h2 id="blank-state-title">The Blank State</h2>
        <span>
          Start with intent, then inspect the current read-only perspective before
          choosing a surface. This page displays context only.
        </span>
      </div>

      <ModePresetSelector />

      <BlankStateAutohuntTargetOptionsPanel
        summary={autohuntTargetModeSummary}
      />

      <BlankStateReviewEntryGrid entries={entries} />

      <p className="human-surface-boundary-note">
        Read-only boundary: Blank State Review Entry Absorption v0.1 may display
        Current Working Perspective, review queue, handoff ref, and recovered
        runner DeltaBatch read context only. It does not create work, approve,
        apply, reject, commit, run agents, persist state, launch Codex, call
        providers, mutate memory, or add authority.
      </p>
    </section>
  );
}
