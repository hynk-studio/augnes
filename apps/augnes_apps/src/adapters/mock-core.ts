import type {
  AugnesCoreAdapter,
  BoundaryPacket,
  Casefile,
  ContinuityReport,
  FetchResult,
  GovernanceAudit,
  RepoNavigationResult,
  SearchResult,
  SearchScope,
  StrategyRationale,
  WorkingView,
} from "../lib/types.js";

const docs: FetchResult[] = [
  {
    id: "casefile-auth-1",
    title: "Auth connector review packet",
    text: "Evidence bundle for OAuth wiring, scope minimization, and review-safe metadata.",
    url: "https://augnes.local/casefile/auth",
    metadata: { source: "augnes", kind: "casefile" },
  },
  {
    id: "boundary-42",
    title: "Boundary packet 42",
    text: "Boundary packet containing carry-forward candidates, trace capsule candidates, and revision lineage.",
    url: "https://augnes.local/boundary/42",
    metadata: { source: "augnes", kind: "boundary" },
  },
  {
    id: "repo-node-healthcheck",
    title: "frontend.healthcheck.ready metric writer",
    text: "Metric emitted in apps/web/src/observability/health.ts with fetchable source location.",
    url: "https://augnes.local/repo/apps/web/src/observability/health.ts",
    metadata: { source: "repo", kind: "file" },
  },
];

export class MockAugnesCoreAdapter implements AugnesCoreAdapter {
  async search(query: string, scope?: SearchScope[]): Promise<SearchResult[]> {
    const lower = query.toLowerCase();
    const results = docs
      .filter((doc) => {
        const scopeOk = !scope?.length || scope.some((s) => doc.metadata?.kind === s || (s === "repo" && doc.metadata?.source === "repo"));
        return scopeOk && `${doc.id} ${doc.title} ${doc.text}`.toLowerCase().includes(lower);
      })
      .map((doc) => ({ id: doc.id, title: doc.title, url: doc.url }));

    return results.length
      ? results
      : docs.map((doc) => ({ id: doc.id, title: doc.title, url: doc.url }));
  }

  async fetch(id: string): Promise<FetchResult | null> {
    return docs.find((doc) => doc.id === id) ?? null;
  }

  async openCasefile(subjectOrQuery: string): Promise<Casefile> {
    return {
      id: "cf-001",
      subject: subjectOrQuery,
      summary:
        "Current work is centered on shipping a read-first ChatGPT app that surfaces evidence, rationale, boundary packets, and continuity signals without letting the ChatGPT thread become canonical memory.",
      supportingEvidence: [
        { id: "ev-001", title: "Core sovereignty rule", stance: "supporting", note: "Core retains Evidence Registry, JML, STATE_SNAPSHOT, Gate, SRF." },
        { id: "ev-002", title: "Working View cap", stance: "supporting", note: "Working View stores claim ids, summary, top evidence ids, active pointers only." },
      ],
      contradictingEvidence: [
        { id: "ev-003", title: "Potential UX friction", stance: "contradicting", note: "Read-first design may feel slower than generic ChatGPT search." },
      ],
      unresolvedQuestions: [
        "How much continuity state should be exposed in the public app versus the internal Chrono Lab?",
        "Which Augnes Core endpoints already exist and which need mock adapters first?",
      ],
      recentChanges: [
        "Boundary packet promoted to first-class UI surface.",
        "Governance audit moved into the internal console profile.",
      ],
    };
  }

  async getWorkingView(): Promise<WorkingView> {
    return {
      claimIds: ["claim-augnes-app-01"],
      summary:
        "Shipping Augnes as an Evidence & Continuity Console inside ChatGPT. Current emphasis: read-only tools, strong rationale surface, boundary packet review, continuity visibility.",
      topEvidenceIds: ["ev-001", "ev-002"],
      activePointers: ["casefile:cf-001", "boundary:boundary-42", "repo:repo-node-healthcheck"],
    };
  }

  async explainStrategy(subject = "current focus"): Promise<StrategyRationale> {
    return {
      subject,
      recommendedAction: "VERIFY",
      why: [
        "Meta-WM confidence is moderate, but unresolved contradictions remain.",
        "Boundary-safe carry-forward requires evidence-linked justification rather than narrator text.",
        "Repo grounding is available, so fetch before promotion.",
      ],
      metaWm: {
        wmStrength: 0.62,
        uncertainty: 0.31,
        dependencyHat: 0.48,
      },
      eop: {
        expected: "Search and fetch should narrow the implementation surface to the app-safe read-only subset.",
        observed: "Search returned relevant casefile and repo nodes.",
        delta: "No blocker yet, but OAuth and widget state need stronger review coverage.",
      },
      rubric: {
        score: 0.78,
        notes: [
          "Good evidence coverage.",
          "Still missing real adapter wiring.",
        ],
      },
      estimatedCost: 2,
      estimatedSteps: 5,
    };
  }

  async getBoundaryPacket(boundaryId = "boundary-42"): Promise<BoundaryPacket> {
    return {
      boundaryId,
      snapshotId: "snapshot-42",
      carryForwardCandidates: [
        {
          id: "cfwd-01",
          title: "Public app remains read-first",
          stage: "boundary_committed",
          why: "Matches directory-safe constraint and keeps review scope small.",
        },
        {
          id: "cfwd-02",
          title: "Chrono Lab keeps richer continuity views",
          stage: "provisional",
          why: "Useful for developer-mode regression, not yet public-safe.",
        },
      ],
      traceCapsuleCandidates: [
        {
          id: "tc-01",
          title: "Resume flow after tool wait",
          reuseValue: "Likely reusable across most Augnes sessions.",
        },
      ],
      revisionOperators: ["reinterpret", "revise", "carry_forward"],
      lineageNotes: [
        "No overwrite: new boundary packet extends prior chain.",
        "Narrator summary remains view-only.",
      ],
    };
  }

  async getContinuityReport(): Promise<ContinuityReport> {
    return {
      baselineClass: "same_self",
      identityGoal: "Build Augnes as an evidence-governed, time-aware operations console.",
      hardInvariants: [
        "Core owns Evidence Registry/JML/STATE_SNAPSHOT/Gate/SRF",
        "Working View and narrator are view-only",
        "ChatGPT thread is not canonical memory",
      ],
      latestBoundaryId: "boundary-42",
      canaryStatus: "warn",
      failAxis: ["public-vs-lab surface split not fully tested"],
      transitionRetention: [
        {
          scenario: "tool_wait_resume",
          status: "pass",
          note: "Pending slot preserved across idle gap.",
        },
        {
          scenario: "boundary_resume",
          status: "warn",
          note: "Boundary packet survives, but canary coverage is still partial.",
        },
      ],
    };
  }

  async navigateRepo(queryOrNodeId: string): Promise<RepoNavigationResult> {
    return {
      query: queryOrNodeId,
      search: [
        {
          nodeId: "repo-node-healthcheck",
          title: "apps/web/src/observability/health.ts",
          kind: "file",
          fetchable: true,
        },
        {
          nodeId: "repo-node-console-server",
          title: "src/server.ts",
          kind: "file",
          fetchable: true,
        },
      ],
      explore: [
        {
          nodeId: "repo-node-observability-folder",
          title: "apps/web/src/observability",
          kind: "folder",
          fetchable: false,
        },
      ],
      guidance: [
        "Search/Explore are view-only.",
        "Fetch source text before using a node as evidence.",
      ],
    };
  }

  async getGovernanceAudit(): Promise<GovernanceAudit> {
    return {
      readOnlyTools: [
        "search",
        "fetch",
        "open_casefile",
        "get_working_view",
        "explain_strategy",
        "get_boundary_packet",
        "get_continuity_report",
        "navigate_repo",
        "get_governance_audit",
        "augnes_list_work_items",
        "augnes_get_work_brief",
      ],
      rawFirstFields: [
        "provider session ids",
        "thread ids",
        "workspace ids",
        "run ids",
        "auth identifiers",
      ],
      promotionBans: [
        "No narrator text into Evidence Registry",
        "No thread/session metadata into canonical memory",
        "No Search/Explore RepoGraph results promoted as evidence",
      ],
      gateStatus: [
        { gate: "Gate-18", status: "pass", note: "No promoted telemetry in mock payloads." },
        { gate: "Gate-19", status: "pass", note: "External thread/session kept raw-first only." },
        { gate: "Gate-20", status: "warn", note: "Continuity canaries defined but not fully automated." },
      ],
    };
  }
}
