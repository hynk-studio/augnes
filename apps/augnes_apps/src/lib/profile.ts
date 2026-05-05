import type { AugnesAppProfile } from "./config.js";
import type {
  BoundaryPacket,
  Casefile,
  ContinuityReport,
  GovernanceAudit,
  RepoNavigationResult,
  StrategyRationale,
  WorkingView,
} from "./types.js";

export type ConsolePanel = "casefile" | "working_view" | "strategy" | "boundary" | "continuity" | "repo" | "audit";

export interface PresentationMeta {
  profile: AugnesAppProfile;
  detailLevel: "summary" | "full";
  summary: Record<string, unknown>;
  safety: string[];
}

export function profileLabel(profile: AugnesAppProfile): string {
  return profile === "chrono_lab" ? "chrono_lab" : "public";
}

export function withPresentation<T extends Record<string, unknown>>(
  profile: AugnesAppProfile,
  panel: ConsolePanel,
  payload: T
): T & { panel: ConsolePanel; profile: AugnesAppProfile; presentation: PresentationMeta } {
  return {
    panel,
    profile,
    presentation: buildPresentation(profile, panel, payload),
    ...payload,
  };
}

function buildPresentation(profile: AugnesAppProfile, panel: ConsolePanel, payload: Record<string, unknown>): PresentationMeta {
  return {
    profile,
    detailLevel: profile === "chrono_lab" ? "full" : "summary",
    summary: buildSummary(panel, payload),
    safety: buildSafety(panel, payload),
  };
}

function buildSummary(panel: ConsolePanel, payload: Record<string, unknown>): Record<string, unknown> {
  switch (panel) {
    case "casefile": {
      const casefile = payload.casefile as Casefile;
      return {
        id: casefile.id,
        subject: casefile.subject,
        supportingEvidence: casefile.supportingEvidence.length,
        contradictingEvidence: casefile.contradictingEvidence.length,
        unresolvedQuestions: casefile.unresolvedQuestions.length,
      };
    }
    case "working_view": {
      const workingView = payload.workingView as WorkingView;
      return {
        claims: workingView.claimIds.length,
        topEvidenceIds: workingView.topEvidenceIds,
        activePointers: workingView.activePointers,
      };
    }
    case "strategy": {
      const strategy = payload.strategy as StrategyRationale;
      return {
        subject: strategy.subject,
        recommendedAction: strategy.recommendedAction,
        reasons: strategy.why.length,
      };
    }
    case "boundary": {
      const packet = payload.packet as BoundaryPacket;
      return {
        boundaryId: packet.boundaryId,
        snapshotId: packet.snapshotId,
        carryForwardCandidates: packet.carryForwardCandidates.length,
        traceCapsuleCandidates: packet.traceCapsuleCandidates.length,
        lineageNotes: packet.lineageNotes.length,
      };
    }
    case "continuity": {
      const continuity = payload.continuity as ContinuityReport;
      return {
        baselineClass: continuity.baselineClass,
        latestBoundaryId: continuity.latestBoundaryId,
        canaryStatus: continuity.canaryStatus,
        transitionRetention: continuity.transitionRetention.length,
        failAxes: continuity.failAxis.length,
      };
    }
    case "repo": {
      const repo = payload.repo as RepoNavigationResult;
      return {
        query: repo.query,
        searchHits: repo.search.length,
        exploreHits: repo.explore.length,
        fetchableSearchHits: repo.search.filter((item) => item.fetchable).length,
      };
    }
    case "audit": {
      const audit = payload.audit as GovernanceAudit;
      return {
        readOnlyTools: audit.readOnlyTools.length,
        promotionBans: audit.promotionBans,
        gates: audit.gateStatus.map(({ gate, status }) => ({ gate, status })),
      };
    }
  }
}

function buildSafety(panel: ConsolePanel, payload: Record<string, unknown>): string[] {
  if (panel === "strategy") {
    return ["Strategy Rationale is Control/View context, not evidence or truth."];
  }

  if (panel === "repo") {
    return ["Search and Explore are view-only. Fetch source text before treating a repo node as evidence."];
  }

  if (panel === "audit") {
    const audit = payload.audit as GovernanceAudit;
    return audit.promotionBans;
  }

  return [];
}
