import { z } from "zod";

export const SearchScopeSchema = z.enum([
  "evidence",
  "casefile",
  "working_view",
  "boundary",
  "continuity",
  "repo",
]);

export const SearchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string(),
});

export const FetchMetadataValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

export const FetchResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  url: z.string(),
  metadata: z.record(FetchMetadataValueSchema).optional(),
});

export const EvidenceRefSchema = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().optional(),
  stance: z.enum(["supporting", "contradicting", "neutral"]).optional(),
  note: z.string().optional(),
});

export const CasefileSchema = z.object({
  id: z.string(),
  subject: z.string(),
  summary: z.string(),
  supportingEvidence: z.array(EvidenceRefSchema),
  contradictingEvidence: z.array(EvidenceRefSchema),
  unresolvedQuestions: z.array(z.string()),
  recentChanges: z.array(z.string()),
});

export const WorkingViewSchema = z.object({
  claimIds: z.array(z.string()),
  summary: z.string(),
  topEvidenceIds: z.array(z.string()),
  activePointers: z.array(z.string()),
});

export const StrategyRationaleSchema = z.object({
  subject: z.string(),
  recommendedAction: z.enum(["VERIFY", "RETRIEVE", "ASK", "PROCEED"]),
  why: z.array(z.string()),
  metaWm: z
    .object({
      wmStrength: z.number(),
      uncertainty: z.number(),
      dependencyHat: z.number(),
    })
    .optional(),
  eop: z
    .object({
      expected: z.string(),
      observed: z.string().optional(),
      delta: z.string().optional(),
    })
    .optional(),
  rubric: z
    .object({
      score: z.number(),
      notes: z.array(z.string()),
    })
    .optional(),
  estimatedCost: z.number().optional(),
  estimatedSteps: z.number().optional(),
});

export const BoundaryPacketSchema = z.object({
  boundaryId: z.string(),
  snapshotId: z.string(),
  carryForwardCandidates: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      stage: z.enum(["provisional", "boundary_committed", "canary_or_reviewed", "promoted"]),
      why: z.string(),
    })
  ),
  traceCapsuleCandidates: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      reuseValue: z.string(),
    })
  ),
  revisionOperators: z.array(z.string()),
  lineageNotes: z.array(z.string()),
});

export const ContinuityReportSchema = z.object({
  baselineClass: z.enum(["same_self", "branch", "successor"]),
  identityGoal: z.string(),
  hardInvariants: z.array(z.string()),
  latestBoundaryId: z.string(),
  canaryStatus: z.enum(["pass", "warn", "fail"]),
  failAxis: z.array(z.string()),
  transitionRetention: z.array(
    z.object({
      scenario: z.string(),
      status: z.enum(["pass", "warn", "fail"]),
      note: z.string(),
    })
  ),
});

export const RepoNodeSummarySchema = z.object({
  nodeId: z.string(),
  title: z.string(),
  kind: z.enum(["file", "symbol", "folder", "doc"]),
  fetchable: z.boolean(),
});

export const RepoNavigationResultSchema = z.object({
  query: z.string(),
  search: z.array(RepoNodeSummarySchema),
  explore: z.array(RepoNodeSummarySchema),
  guidance: z.array(z.string()),
});

export const GovernanceAuditSchema = z.object({
  readOnlyTools: z.array(z.string()),
  rawFirstFields: z.array(z.string()),
  promotionBans: z.array(z.string()),
  gateStatus: z.array(
    z.object({
      gate: z.enum(["Gate-18", "Gate-19", "Gate-20"]),
      status: z.enum(["pass", "warn", "fail"]),
      note: z.string(),
    })
  ),
});
