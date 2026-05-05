export type SearchScope =
  | "evidence"
  | "casefile"
  | "working_view"
  | "boundary"
  | "continuity"
  | "repo";

export interface SearchResult {
  id: string;
  title: string;
  url: string;
}

export interface FetchResult {
  id: string;
  title: string;
  text: string;
  url: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface EvidenceRef {
  id: string;
  title: string;
  url?: string;
  stance?: "supporting" | "contradicting" | "neutral";
  note?: string;
}

export interface Casefile {
  id: string;
  subject: string;
  summary: string;
  supportingEvidence: EvidenceRef[];
  contradictingEvidence: EvidenceRef[];
  unresolvedQuestions: string[];
  recentChanges: string[];
}

export interface WorkingView {
  claimIds: string[];
  summary: string;
  topEvidenceIds: string[];
  activePointers: string[];
}

export interface StrategyRationale {
  subject: string;
  recommendedAction: "VERIFY" | "RETRIEVE" | "ASK" | "PROCEED";
  why: string[];
  metaWm?: {
    wmStrength: number;
    uncertainty: number;
    dependencyHat: number;
  };
  eop?: {
    expected: string;
    observed?: string;
    delta?: string;
  };
  rubric?: {
    score: number;
    notes: string[];
  };
  estimatedCost?: number;
  estimatedSteps?: number;
}

export interface BoundaryPacket {
  boundaryId: string;
  snapshotId: string;
  carryForwardCandidates: Array<{
    id: string;
    title: string;
    stage: "provisional" | "boundary_committed" | "canary_or_reviewed" | "promoted";
    why: string;
  }>;
  traceCapsuleCandidates: Array<{
    id: string;
    title: string;
    reuseValue: string;
  }>;
  revisionOperators: string[];
  lineageNotes: string[];
}

export interface ContinuityReport {
  baselineClass: "same_self" | "branch" | "successor";
  identityGoal: string;
  hardInvariants: string[];
  latestBoundaryId: string;
  canaryStatus: "pass" | "warn" | "fail";
  failAxis: string[];
  transitionRetention: Array<{
    scenario: string;
    status: "pass" | "warn" | "fail";
    note: string;
  }>;
}

export interface RepoNodeSummary {
  nodeId: string;
  title: string;
  kind: "file" | "symbol" | "folder" | "doc";
  fetchable: boolean;
}

export interface RepoNavigationResult {
  query: string;
  search: RepoNodeSummary[];
  explore: RepoNodeSummary[];
  guidance: string[];
}

export interface GovernanceAudit {
  readOnlyTools: string[];
  rawFirstFields: string[];
  promotionBans: string[];
  gateStatus: Array<{
    gate: "Gate-18" | "Gate-19" | "Gate-20";
    status: "pass" | "warn" | "fail";
    note: string;
  }>;
}

export interface AugnesCoreAdapter {
  search(query: string, scope?: SearchScope[], timeRange?: string): Promise<SearchResult[]>;
  fetch(id: string): Promise<FetchResult | null>;
  openCasefile(subjectOrQuery: string): Promise<Casefile>;
  getWorkingView(scope?: string): Promise<WorkingView>;
  explainStrategy(subject?: string): Promise<StrategyRationale>;
  getBoundaryPacket(boundaryId?: string): Promise<BoundaryPacket>;
  getContinuityReport(): Promise<ContinuityReport>;
  navigateRepo(queryOrNodeId: string): Promise<RepoNavigationResult>;
  getGovernanceAudit(): Promise<GovernanceAudit>;
}
