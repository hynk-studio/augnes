"use client";

import { useMemo, useState } from "react";
import { GuideBriefMiniPanel } from "@/components/guide/guide-brief-mini-panel";
import type { AugnesDelta } from "@/types/augnes-delta";
import type { GuideBrief } from "@/types/guide-brief";
import type { HumanSurfaceCurrentPerspectiveRead } from "@/lib/human-surface/read-current-perspective";
import type { HumanSurfaceDeltaProjectionRead } from "@/lib/human-surface/read-delta-projection";
import { PerspectiveBoundaryNextPanel } from "./perspective-boundary-next-panel";
import { PerspectiveCurrentSummaryRail } from "./perspective-current-summary-rail";
import { PerspectiveDeltaInspector } from "./perspective-delta-inspector";
import { PerspectiveTimeline } from "./perspective-timeline";
import type { PerspectiveDeltaCardReviewState } from "./perspective-delta-card";

type PerspectiveHumanSurfaceProps = {
  currentPerspectiveRead: HumanSurfaceCurrentPerspectiveRead;
  deltaProjectionRead: HumanSurfaceDeltaProjectionRead;
  guideBrief: GuideBrief;
};

export function PerspectiveHumanSurface({
  currentPerspectiveRead,
  deltaProjectionRead,
  guideBrief,
}: PerspectiveHumanSurfaceProps) {
  const sortedDeltas = useMemo(
    () => sortDeltasNewestFirst(deltaProjectionRead.data.deltas),
    [deltaProjectionRead.data.deltas],
  );
  const reviewStateByDeltaId = useMemo(
    () => buildReviewStateByDeltaId(currentPerspectiveRead.data),
    [currentPerspectiveRead.data],
  );
  const [selectedDeltaId, setSelectedDeltaId] = useState<string | null>(
    sortedDeltas[0]?.delta_id ?? null,
  );

  const selectedDelta =
    sortedDeltas.find((delta) => delta.delta_id === selectedDeltaId) ??
    sortedDeltas[0] ??
    null;
  const effectiveSelectedDeltaId = selectedDelta?.delta_id ?? null;

  return (
    <main
      className="perspective-human-surface"
      data-testid="perspective-human-surface"
    >
      <div className="perspective-human-shell">
        <header className="perspective-human-header">
          <div>
            <p className="perspective-human-kicker">Augnes</p>
            <h1>Perspective</h1>
            <p>
              Read-only Current Working Perspective with a vertical Augnes
              Delta timeline and Delta Inspector.
            </p>
          </div>
          <nav className="perspective-human-nav" aria-label="Perspective links">
            <a href="/">Home</a>
            <a href="/workbench">Workbench</a>
          </nav>
        </header>

        <section className="perspective-human-source-strip" aria-label="Source status">
          <span>
            Current perspective source: {currentPerspectiveRead.source_status}
          </span>
          <span>Delta projection source: {deltaProjectionRead.source_status}</span>
          <span>Scope: {deltaProjectionRead.data.scope}</span>
        </section>

        {deltaProjectionRead.source_status !== "runtime" ? (
          <p className="perspective-human-fallback-note">
            Delta Projection is unavailable from runtime. Showing public-safe
            sample / empty fallback. No state was read or mutated.
          </p>
        ) : null}

        <div className="perspective-human-layout">
          <PerspectiveCurrentSummaryRail
            currentPerspectiveRead={currentPerspectiveRead}
          />
          <PerspectiveTimeline
            deltas={sortedDeltas}
            selectedDeltaId={effectiveSelectedDeltaId}
            reviewStateByDeltaId={reviewStateByDeltaId}
            formatCreatedAt={formatDeltaCreatedAt}
            onSelectDelta={setSelectedDeltaId}
          />
          <div className="perspective-human-right-column">
            <PerspectiveDeltaInspector
              delta={selectedDelta}
              projection={deltaProjectionRead.data}
              createdAtLabel={
                selectedDelta ? formatDeltaCreatedAt(selectedDelta.created_at) : null
              }
            />
            <GuideBriefMiniPanel guideBrief={guideBrief} variant="perspective" />
            <PerspectiveBoundaryNextPanel
              currentPerspectiveRead={currentPerspectiveRead}
              deltaProjectionRead={deltaProjectionRead}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function sortDeltasNewestFirst(deltas: AugnesDelta[]) {
  return deltas
    .map((delta, index) => ({ delta, index, time: Date.parse(delta.created_at) }))
    .sort((left, right) => {
      const leftTime = Number.isFinite(left.time) ? left.time : -Infinity;
      const rightTime = Number.isFinite(right.time) ? right.time : -Infinity;
      if (rightTime !== leftTime) return rightTime - leftTime;
      return left.index - right.index;
    })
    .map((item) => item.delta);
}

function buildReviewStateByDeltaId(
  perspective: HumanSurfaceCurrentPerspectiveRead["data"],
) {
  const queue = perspective.review_queue_hints;
  const importantIds = new Set(
    perspective.last_major_delta_refs.map((delta) => delta.delta_id),
  );
  const entries: Array<[string, string]> = [
    ...queue.needs_review_delta_ids.map((id): [string, string] => [
      id,
      "needs review",
    ]),
    ...queue.blocked_delta_ids.map((id): [string, string] => [id, "blocked"]),
    ...queue.manual_review_delta_ids.map((id): [string, string] => [
      id,
      "manual review",
    ]),
    ...queue.validation_required_delta_ids.map(
      (id): [string, string] => [id, "validation required"],
    ),
    ...queue.project_perspective_review_delta_ids.map(
      (id): [string, string] => [id, "project Perspective review"],
    ),
    ...queue.durable_memory_review_delta_ids.map(
      (id): [string, string] => [id, "durable memory review"],
    ),
    ...queue.user_decision_delta_ids.map((id): [string, string] => [
      id,
      "user decision",
    ]),
  ];

  const states = new Map<string, PerspectiveDeltaCardReviewState>();
  for (const [deltaId, label] of entries) {
    const state = states.get(deltaId) ?? {
      labels: [],
      isImportant: importantIds.has(deltaId),
    };
    if (!state.labels.includes(label)) {
      state.labels.push(label);
    }
    states.set(deltaId, state);
  }

  for (const deltaId of importantIds) {
    const state = states.get(deltaId) ?? { labels: [], isImportant: true };
    state.isImportant = true;
    states.set(deltaId, state);
  }

  return states;
}

function formatDeltaCreatedAt(createdAt: string) {
  const timestamp = Date.parse(createdAt);
  if (!Number.isFinite(timestamp)) {
    return "created_at unavailable";
  }

  return new Date(timestamp).toISOString();
}
