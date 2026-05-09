import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { createAugnesCoreAdapter } from "./adapters/index.js";
import { StateRuntimeHttpAdapter } from "./adapters/state-runtime-http.js";
import { config } from "./lib/config.js";
import { withPresentation } from "./lib/profile.js";
import { sanitizeValue } from "./lib/sanitize.js";
import {
  StateRuntimeActionResultKindSchema,
  StateRuntimeActionResultStatusSchema,
  type StateBrief,
  type StateRuntimeBridgeAdapter,
  type WorkBrief,
  type WorkItem,
} from "./lib/state-runtime-types.js";
import type { AugnesCoreAdapter, SearchScope } from "./lib/types.js";

const widgetHtml = readFileSync(new URL("../public/console-widget.html", import.meta.url), "utf8");
export const WIDGET_URI = "ui://widget/augnes-console.v2.html";
export const APP_NAME = "augnes-console";
export const APP_VERSION = "0.1.0";
const DEFAULT_STATE_RUNTIME_SCOPE = "project:augnes";
export const LEGACY_PUBLIC_TOOL_NAMES = [
  "search",
  "fetch",
  "open_casefile",
  "get_working_view",
  "explain_strategy",
  "get_boundary_packet",
  "get_continuity_report",
  "navigate_repo",
  "get_governance_audit",
] as const;
export const AUGNES_BRIDGE_TOOL_NAMES = [
  "augnes_get_state_brief",
  "augnes_observe",
  "augnes_plan",
  "augnes_record_action_result",
  "augnes_list_pending_proposals",
  "augnes_record_work_event",
  "augnes_generate_codex_handoff_draft",
  "augnes_review_codex_result_draft",
  "augnes_get_mailbox_summary",
] as const;
export const AUGNES_WORK_READ_TOOL_NAMES = [
  "augnes_list_work_items",
  "augnes_get_work_brief",
] as const;
export const PUBLIC_TOOL_NAMES = [
  ...LEGACY_PUBLIC_TOOL_NAMES,
  ...AUGNES_WORK_READ_TOOL_NAMES,
] as const;
const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: false,
} as const;
const bridgeReadAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  openWorldHint: true,
} as const;
const bridgeWriteAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  openWorldHint: true,
} as const;
export const WIDGET_CSP = {
  connectDomains: [],
  resourceDomains: [],
  frameDomains: [],
  baseUriDomains: [],
} as const;
const legacyWidgetCsp = {
  connect_domains: WIDGET_CSP.connectDomains,
  resource_domains: WIDGET_CSP.resourceDomains,
} as const;
const widgetToolMeta = { ui: { resourceUri: WIDGET_URI }, profile: config.appProfile } as const;
const modelOnlyToolMeta = { ui: { visibility: ["model"] } } as const;

function narrative(text: string) {
  return [{ type: "text" as const, text }];
}

function asSummaryList(items: string[]): string {
  return items.length ? items.join(", ") : "none";
}

function safeOrigin(rawUrl: string): string | undefined {
  try {
    return new URL(rawUrl).origin;
  } catch {
    return undefined;
  }
}

function sanitizePayload<T>(value: T): T {
  return sanitizeValue(value);
}

function buildToolError(tool: string, error: unknown, panel?: string) {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  const errorPayload = sanitizePayload({
    tool,
    mode: config.coreMode,
    profile: config.appProfile,
    readOnly: true,
    message,
  });

  return {
    structuredContent: panel ? { panel, profile: config.appProfile, error: errorPayload } : { profile: config.appProfile, error: errorPayload },
    content: narrative(`${tool} failed: ${message}`),
    _meta: panel ? sanitizePayload({ panel, profile: config.appProfile, error: errorPayload }) : sanitizePayload({ profile: config.appProfile, error: errorPayload }),
  };
}

function buildBridgeToolError(tool: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected error.";
  const errorPayload = sanitizePayload({
    tool,
    source: "state_runtime",
    profile: config.appProfile,
    message,
  });

  return {
    structuredContent: { profile: config.appProfile, error: errorPayload },
    content: narrative(`${tool} failed: ${errorPayload.message}`),
    _meta: sanitizePayload({ profile: config.appProfile, error: errorPayload }),
  };
}

export function buildHealthPayload() {
  return {
    ok: true,
    name: APP_NAME,
    version: APP_VERSION,
    mode: config.coreMode,
    readOnly: true,
    profile: config.appProfile,
  };
}

function describeCasefile(casefile: Awaited<ReturnType<AugnesCoreAdapter["openCasefile"]>>): string {
  if (config.appProfile === "chrono_lab") {
    return `Opened casefile for ${casefile.subject}. Supporting evidence: ${casefile.supportingEvidence.length}. Contradicting evidence: ${casefile.contradictingEvidence.length}. Unresolved questions: ${casefile.unresolvedQuestions.length}.`;
  }

  return `Opened ${casefile.subject}: ${casefile.supportingEvidence.length} supporting, ${casefile.contradictingEvidence.length} contradicting, ${casefile.unresolvedQuestions.length} unresolved.`;
}

function describeWorkingView(workingView: Awaited<ReturnType<AugnesCoreAdapter["getWorkingView"]>>): string {
  return `Working view loaded: ${workingView.claimIds.length} claims, ${workingView.topEvidenceIds.length} top evidence refs, ${workingView.activePointers.length} active pointers.`;
}

function describeStrategy(strategy: Awaited<ReturnType<AugnesCoreAdapter["explainStrategy"]>>): string {
  if (config.appProfile === "chrono_lab") {
    return `Loaded strategy rationale for ${strategy.subject}. Recommended action: ${strategy.recommendedAction}. Why: ${strategy.why.join(" ")}`.trim();
  }

  return `Strategy rationale for ${strategy.subject}: ${strategy.recommendedAction}. Control/View context only; not evidence or truth.`;
}

function describeBoundary(packet: Awaited<ReturnType<AugnesCoreAdapter["getBoundaryPacket"]>>): string {
  if (config.appProfile === "chrono_lab") {
    return `Loaded boundary packet ${packet.boundaryId}. Carry-forward candidates: ${packet.carryForwardCandidates.length}. Trace capsules: ${packet.traceCapsuleCandidates.length}.`;
  }

  return `Boundary ${packet.boundaryId}: ${packet.carryForwardCandidates.length} carry-forward candidates, ${packet.lineageNotes.length} lineage notes.`;
}

function describeContinuity(continuity: Awaited<ReturnType<AugnesCoreAdapter["getContinuityReport"]>>): string {
  if (config.appProfile === "chrono_lab") {
    return `Loaded continuity report. Baseline: ${continuity.baselineClass}. Canary status: ${continuity.canaryStatus}. Latest boundary: ${continuity.latestBoundaryId}.`;
  }

  return `Continuity: ${continuity.baselineClass}, canary ${continuity.canaryStatus}, latest boundary ${continuity.latestBoundaryId}.`;
}

function describeRepo(repo: Awaited<ReturnType<AugnesCoreAdapter["navigateRepo"]>>, query: string): string {
  return `Repo navigation for ${query}: ${repo.search.length} search hits, ${repo.explore.length} explore hits. Fetch before treating any repo node as evidence.`;
}

function describeAudit(audit: Awaited<ReturnType<AugnesCoreAdapter["getGovernanceAudit"]>>): string {
  const gateSummary = audit.gateStatus.map((gate) => `${gate.gate}:${gate.status}`).join(", ");
  if (config.appProfile === "chrono_lab") {
    return `Loaded governance audit. Read-only tools: ${audit.readOnlyTools.length}. Promotion bans: ${audit.promotionBans.length}. Gates: ${gateSummary}.`;
  }

  return `Governance summary: ${audit.readOnlyTools.length} read-only tools, ${audit.promotionBans.length} promotion bans, gates ${gateSummary}.`;
}

function stateBlockCount(block: StateBrief["active_state"]): number {
  return Array.isArray(block) ? block.length : Object.keys(block).length;
}

function describeStateBrief(brief: StateBrief): string {
  const agentHandoffSuffix = Object.prototype.hasOwnProperty.call(brief, "agent_handoff")
    ? " Agent handoff is available for current status, next step, blockers, and Codex handoff."
    : "";

  return `State brief for ${brief.scope}: ${stateBlockCount(brief.active_state)} active, ${brief.pending_proposals.length} pending, ${brief.recent_actions.length} recent action(s), ${brief.open_tensions.length} open tension(s).${agentHandoffSuffix}`;
}

function describeWorkItems(scope: string, workItems: WorkItem[]): string {
  const attentionCount = workItems.filter((item) => item.user_attention_required).length;
  return `Found ${workItems.length} work item(s) for ${scope}; ${attentionCount} require user attention. Work IDs are trace anchors, not state authority.`;
}

function describeWorkBrief(brief: WorkBrief): string {
  return `Work brief for ${brief.work_id}: ${brief.work.title}. Status ${brief.work.status}, priority ${brief.work.priority}, ${brief.recent_events.length} recent event(s), ${brief.related_proof.action_ids.length} linked action record(s). work_id is a trace anchor; committed state remains authoritative.`;
}

function describeCodexHandoffDraft(workId: string, handoffId: string): string {
  return [
    `Generated Codex handoff draft ${handoffId} for ${workId}.`,
    "This is a guidance packet only: it does not execute Codex, mark the handoff ready or delivered, commit or reject Augnes state, or publish externally.",
  ].join(" ");
}

function describeCodexResultReviewDraft(handoffId: string, status: string, kind: string): string {
  return [
    `Created Codex result review draft for ${handoffId}; recommended ${status}/${kind}.`,
    "This is review/draft only: it does not execute Codex, does not record proof, does not commit or reject Augnes state, and does not publish externally.",
  ].join(" ");
}

function describeMailboxSummary(summary: Awaited<ReturnType<StateRuntimeBridgeAdapter["getMailboxSummary"]>>): string {
  const activeCount =
    summary.summary.pending_handoffs.length +
    summary.summary.needs_review.length +
    summary.summary.approval_needed.length +
    summary.summary.blocked_or_partial.length;

  return [
    `Mailbox summary for ${summary.scope}: ${summary.summary.pending_handoffs.length} pending handoff(s), ${summary.summary.needs_review.length} needs-review item(s), ${summary.summary.approval_needed.length} approval-needed item(s), ${summary.summary.blocked_or_partial.length} blocked/partial item(s), ${activeCount} active categorization(s).`,
    "This is a read-only derived view: it does not acknowledge messages, approve or reject state, execute Codex, publish externally, or record proof.",
  ].join(" ");
}

export type McpAppServerOptions = {
  enableAgentBridge?: boolean;
};

export function createMcpAppServer(
  adapter: AugnesCoreAdapter = createAugnesCoreAdapter(),
  stateRuntimeAdapter: StateRuntimeBridgeAdapter = new StateRuntimeHttpAdapter(),
  options: McpAppServerOptions = {}
) {
  const enableAgentBridge = options.enableAgentBridge ?? config.enableAgentBridge;
  const server = new McpServer({ name: APP_NAME, version: APP_VERSION });

  registerAppResource(
    server,
    "augnes-console-widget-v2",
    WIDGET_URI,
    {
      _meta: {
        ui: {
          domain: safeOrigin(config.resourceDomain),
          csp: WIDGET_CSP,
        },
        "openai/widgetDomain": safeOrigin(config.resourceDomain),
        "openai/widgetCSP": legacyWidgetCsp,
      },
    },
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: widgetHtml,
          _meta: {
            ui: {
              prefersBorder: true,
              domain: safeOrigin(config.resourceDomain),
              csp: WIDGET_CSP,
            },
            "openai/widgetDomain": safeOrigin(config.resourceDomain),
            "openai/widgetCSP": legacyWidgetCsp,
            "openai/widgetDescription":
              "Augnes Console shows evidence-backed casefiles, working view, rationale, boundary packets, repo navigation, and continuity status.",
          },
        },
      ],
    })
  );

  registerAppTool(
    server,
    "search",
    {
      title: "Search Augnes knowledge",
      description: "Search evidence-backed Augnes knowledge, casefiles, working pointers, boundary packets, continuity records, and repo nodes.",
      inputSchema: {
        query: z.string().min(1),
        scope: z
          .array(z.enum(["evidence", "casefile", "working_view", "boundary", "continuity", "repo"]))
          .optional(),
        timeRange: z.string().optional(),
      },
      annotations: readOnlyAnnotations,
      _meta: modelOnlyToolMeta,
    },
    async ({ query, scope, timeRange }) => {
      try {
        const results = await adapter.search(query, scope as SearchScope[] | undefined, timeRange);
        const structuredContent = sanitizePayload({ profile: config.appProfile, results });
        return {
          structuredContent,
          content: narrative(
            results.length
              ? `Found ${results.length} result(s) for "${query}" in ${scope?.length ? asSummaryList(scope) : "all scopes"}.`
              : `No results found for "${query}".`
          ),
          _meta: sanitizePayload({ profile: config.appProfile }),
        };
      } catch (error) {
        return buildToolError("search", error);
      }
    }
  );

  registerAppTool(
    server,
    "fetch",
    {
      title: "Fetch Augnes document",
      description: "Fetch the full content for a specific Augnes document, casefile, repo node, or boundary packet.",
      inputSchema: { id: z.string().min(1) },
      annotations: readOnlyAnnotations,
      _meta: modelOnlyToolMeta,
    },
    async ({ id }) => {
      try {
        const result = await adapter.fetch(id);
        if (!result) {
          const structuredContent: Record<string, unknown> = sanitizePayload({
            profile: config.appProfile,
            id,
            title: "Not found",
            text: "",
            url: "",
            metadata: { status: "not_found" },
          });
          return {
            structuredContent,
            content: narrative(`No fetch result exists for ${id}.`),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        }

        const structuredContent: Record<string, unknown> = sanitizePayload({ profile: config.appProfile, ...result });
        return {
          structuredContent,
          content: narrative(config.appProfile === "chrono_lab" ? `Fetched ${result.title}. ${result.text}` : `Fetched ${result.title}.`),
          _meta: sanitizePayload({ profile: config.appProfile }),
        };
      } catch (error) {
        return buildToolError("fetch", error);
      }
    }
  );

  registerAppTool(
    server,
    "open_casefile",
    {
      title: "Open casefile",
      description: "Show a structured casefile with supporting evidence, contradicting evidence, unresolved questions, and recent changes.",
      inputSchema: { subject: z.string().min(1) },
      annotations: readOnlyAnnotations,
      _meta: widgetToolMeta,
    },
    async ({ subject }) => {
      try {
        const casefile = await adapter.openCasefile(subject);
        const structuredContent = sanitizePayload(withPresentation(config.appProfile, "casefile", { casefile }));
        return {
          structuredContent,
          content: narrative(describeCasefile(casefile)),
          _meta: structuredContent,
        };
      } catch (error) {
        return buildToolError("open_casefile", error, "casefile");
      }
    }
  );

  registerAppTool(
    server,
    "get_working_view",
    {
      title: "Get working view",
      description: "Return the current working view summary, active pointers, and top evidence refs without exposing raw logs.",
      inputSchema: { scope: z.string().optional() },
      annotations: readOnlyAnnotations,
      _meta: widgetToolMeta,
    },
    async ({ scope }) => {
      try {
        const workingView = await adapter.getWorkingView(scope);
        const structuredContent = sanitizePayload(withPresentation(config.appProfile, "working_view", { workingView }));
        return {
          structuredContent,
          content: narrative(describeWorkingView(workingView)),
          _meta: structuredContent,
        };
      } catch (error) {
        return buildToolError("get_working_view", error, "working_view");
      }
    }
  );

  registerAppTool(
    server,
    "explain_strategy",
    {
      title: "Explain strategy",
      description: "Explain why Augnes recommends verify, retrieve, ask, or proceed using Meta-WM, rubric, and expected-outcome context.",
      inputSchema: { subject: z.string().optional() },
      annotations: readOnlyAnnotations,
      _meta: widgetToolMeta,
    },
    async ({ subject }) => {
      try {
        const strategy = await adapter.explainStrategy(subject);
        const structuredContent = sanitizePayload(withPresentation(config.appProfile, "strategy", { strategy }));
        return {
          structuredContent,
          content: narrative(describeStrategy(strategy)),
          _meta: structuredContent,
        };
      } catch (error) {
        return buildToolError("explain_strategy", error, "strategy");
      }
    }
  );

  registerAppTool(
    server,
    "get_boundary_packet",
    {
      title: "Get boundary packet",
      description: "Return the latest or requested boundary packet with carry-forward candidates, trace capsule candidates, and revision lineage.",
      inputSchema: { boundaryId: z.string().optional() },
      annotations: readOnlyAnnotations,
      _meta: widgetToolMeta,
    },
    async ({ boundaryId }) => {
      try {
        const packet = await adapter.getBoundaryPacket(boundaryId);
        const structuredContent = sanitizePayload(withPresentation(config.appProfile, "boundary", { packet }));
        return {
          structuredContent,
          content: narrative(describeBoundary(packet)),
          _meta: structuredContent,
        };
      } catch (error) {
        return buildToolError("get_boundary_packet", error, "boundary");
      }
    }
  );

  registerAppTool(
    server,
    "get_continuity_report",
    {
      title: "Get continuity report",
      description: "Return self-succession baseline status, same-self vs branch status, and recent continuity canary results.",
      inputSchema: {},
      annotations: readOnlyAnnotations,
      _meta: widgetToolMeta,
    },
    async () => {
      try {
        const continuity = await adapter.getContinuityReport();
        const structuredContent = sanitizePayload(withPresentation(config.appProfile, "continuity", { continuity }));
        return {
          structuredContent,
          content: narrative(describeContinuity(continuity)),
          _meta: structuredContent,
        };
      } catch (error) {
        return buildToolError("get_continuity_report", error, "continuity");
      }
    }
  );

  registerAppTool(
    server,
    "navigate_repo",
    {
      title: "Navigate repo",
      description: "Search and explore the Augnes repo graph. Search and explore are view-only; fetch the source before treating it as evidence.",
      inputSchema: { query: z.string().min(1) },
      annotations: readOnlyAnnotations,
      _meta: widgetToolMeta,
    },
    async ({ query }) => {
      try {
        const repo = await adapter.navigateRepo(query);
        const structuredContent = sanitizePayload(withPresentation(config.appProfile, "repo", { repo }));
        return {
          structuredContent,
          content: narrative(describeRepo(repo, query)),
          _meta: structuredContent,
        };
      } catch (error) {
        return buildToolError("navigate_repo", error, "repo");
      }
    }
  );

  registerAppTool(
    server,
    "get_governance_audit",
    {
      title: "Get governance audit",
      description: "Show raw-first trace handling, promotion bans, and Gate-18/19/20 status for the current app profile.",
      inputSchema: {},
      annotations: readOnlyAnnotations,
      _meta: widgetToolMeta,
    },
    async () => {
      try {
        const audit = await adapter.getGovernanceAudit();
        const structuredContent = sanitizePayload(withPresentation(config.appProfile, "audit", { audit }));
        return {
          structuredContent,
          content: narrative(describeAudit(audit)),
          _meta: structuredContent,
        };
      } catch (error) {
        return buildToolError("get_governance_audit", error, "audit");
      }
    }
  );

  registerAppTool(
    server,
    "augnes_list_work_items",
    {
      title: "List Augnes work items",
      description: "List focused Augnes work trace anchors without treating work_id as durable project state.",
      inputSchema: { scope: z.string().min(1).optional() },
      annotations: bridgeReadAnnotations,
      _meta: modelOnlyToolMeta,
    },
    async ({ scope }) => {
      const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

      try {
        const workItems = await stateRuntimeAdapter.listWorkItems(resolvedScope);
        const structuredContent = sanitizePayload({ profile: config.appProfile, scope: resolvedScope, workItems });
        return {
          structuredContent,
          content: narrative(describeWorkItems(resolvedScope, workItems)),
          _meta: sanitizePayload({ profile: config.appProfile }),
        };
      } catch (error) {
        return buildBridgeToolError("augnes_list_work_items", error);
      }
    }
  );

  registerAppTool(
    server,
    "augnes_get_work_brief",
    {
      title: "Get Augnes work brief",
      description: "Return a ChatGPT-friendly work packet with current metadata, recent events, proof links, and Codex handoff.",
      inputSchema: {
        scope: z.string().min(1).optional(),
        workId: z.string().min(1),
      },
      annotations: bridgeReadAnnotations,
      _meta: modelOnlyToolMeta,
    },
    async ({ scope, workId }) => {
      const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

      try {
        const brief = await stateRuntimeAdapter.getWorkBrief(resolvedScope, workId);
        const structuredContent = sanitizePayload({ profile: config.appProfile, brief });
        return {
          structuredContent,
          content: narrative(describeWorkBrief(brief)),
          _meta: sanitizePayload({ profile: config.appProfile }),
        };
      } catch (error) {
        return buildBridgeToolError("augnes_get_work_brief", error);
      }
    }
  );

  if (enableAgentBridge) {
    registerAppTool(
      server,
      "augnes_get_state_brief",
      {
        title: "Get Augnes state brief",
        description: "Return a compact Augnes runtime state brief for an agent scope.",
        inputSchema: { scope: z.string().min(1).optional() },
        annotations: bridgeReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const brief = await stateRuntimeAdapter.getStateBrief(resolvedScope);
          const structuredContent = sanitizePayload({ profile: config.appProfile, brief });
          return {
            structuredContent,
            content: narrative(describeStateBrief(brief)),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_get_state_brief", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_observe",
      {
        title: "Observe Augnes state message",
        description: "Send an observation message to the Augnes runtime and return any pending proposals it produces.",
        inputSchema: {
          scope: z.string().min(1).optional(),
          message: z.string().min(1),
        },
        annotations: bridgeWriteAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope, message }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const observe = await stateRuntimeAdapter.observe({ scope: resolvedScope, message });
          const structuredContent = sanitizePayload({ profile: config.appProfile, observe });
          return {
            structuredContent,
            content: narrative(
              `Observed message for ${observe.scope}; produced ${observe.proposals.length} pending proposal(s). No proposals were committed or rejected.`
            ),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_observe", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_plan",
      {
        title: "Plan from Augnes state",
        description: "Ask the Augnes runtime planner for state-grounded recommendations without committing state changes.",
        inputSchema: {
          scope: z.string().min(1).optional(),
          message: z.string().min(1),
        },
        annotations: bridgeReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope, message }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const plan = await stateRuntimeAdapter.plan({ scope: resolvedScope, message });
          const firstTitle = plan.recommendations[0]?.title;
          const structuredContent = sanitizePayload({ profile: config.appProfile, plan });
          return {
            structuredContent,
            content: narrative(
              firstTitle
                ? `Plan for ${plan.scope}: ${plan.recommendations.length} recommendation(s). First: ${firstTitle}.`
                : `Plan for ${plan.scope}: 0 recommendation(s).`
            ),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_plan", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_record_action_result",
      {
        title: "Record Augnes action result",
        description: "Record an external action result in the Augnes runtime without committing or rejecting state deltas.",
        inputSchema: {
          scope: z.string().min(1).optional(),
          sourceAgentId: z.string().min(1),
          actionName: z.string().min(1),
          resultSummary: z.string().min(1),
          filesChanged: z.array(z.string()).optional(),
          resultStatus: StateRuntimeActionResultStatusSchema.optional(),
          resultKind: StateRuntimeActionResultKindSchema.optional(),
        },
        annotations: bridgeWriteAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope, sourceAgentId, actionName, resultSummary, filesChanged, resultStatus, resultKind }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const actionRecord = await stateRuntimeAdapter.recordActionResult({
            scope: resolvedScope,
            sourceAgentId,
            actionName,
            resultSummary,
            filesChanged,
            resultStatus,
            resultKind,
          });
          const changedFileCount = filesChanged?.length ?? 0;
          const structuredContent = sanitizePayload({ profile: config.appProfile, actionRecord });
          return {
            structuredContent,
            content: narrative(
              `Recorded action result from ${sourceAgentId} for ${actionName}; ${changedFileCount} changed file(s). No state deltas were committed or rejected.`
            ),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_record_action_result", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_list_pending_proposals",
      {
        title: "List Augnes pending proposals",
        description: "List pending Augnes runtime proposals for an agent scope without committing or rejecting them.",
        inputSchema: { scope: z.string().min(1).optional() },
        annotations: bridgeReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const proposals = await stateRuntimeAdapter.listPendingProposals(resolvedScope);
          const structuredContent = sanitizePayload({ profile: config.appProfile, proposals });
          return {
            structuredContent,
            content: narrative(`Found ${proposals.length} pending proposal(s) for ${resolvedScope}.`),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_list_pending_proposals", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_record_work_event",
      {
        title: "Record Augnes work event",
        description: "Record a human-readable event on an existing work trace anchor without committing state deltas.",
        inputSchema: {
          scope: z.string().min(1).optional(),
          workId: z.string().min(1),
          actor: z.enum(["user", "chatgpt", "codex", "augnes_runtime"]).optional(),
          eventType: z.enum(["note", "implementation", "verification", "review", "handoff", "blocked", "decision"]).optional(),
          summary: z.string().min(1),
          resultStatus: StateRuntimeActionResultStatusSchema.optional(),
          resultKind: StateRuntimeActionResultKindSchema.optional(),
          relatedActionId: z.string().min(1).optional(),
          relatedPr: z.string().min(1).optional(),
          relatedStateKeys: z.array(z.string()).optional(),
        },
        annotations: bridgeWriteAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope, workId, actor, eventType, summary, resultStatus, resultKind, relatedActionId, relatedPr, relatedStateKeys }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const eventResult = await stateRuntimeAdapter.recordWorkEvent({
            scope: resolvedScope,
            workId,
            actor,
            eventType,
            summary,
            resultStatus,
            resultKind,
            relatedActionId,
            relatedPr,
            relatedStateKeys,
          });
          const structuredContent = sanitizePayload({ profile: config.appProfile, eventResult });
          return {
            structuredContent,
            content: narrative(
              `Recorded work event for ${eventResult.event.work_id}; no state deltas were committed or rejected.`
            ),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_record_work_event", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_generate_codex_handoff_draft",
      {
        title: "Generate Codex handoff draft",
        description:
          "Use this when the user asks for a Codex handoff draft from Augnes state and work context. It creates a durable draft guidance packet only; it does not execute Codex, commit or reject state, mark delivery, or publish externally.",
        inputSchema: {
          scope: z.string().min(1).optional(),
          workId: z.string().min(1),
          targetAgent: z.string().min(1).optional(),
          createdBy: z.string().min(1).optional(),
        },
        annotations: bridgeWriteAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope, workId, targetAgent, createdBy }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const draft = await stateRuntimeAdapter.generateHandoffDraft({
            scope: resolvedScope,
            workId,
            targetAgent: targetAgent ?? "codex",
            createdBy: createdBy ?? "chatgpt",
          });
          const handoff = draft.handoff;
          const structuredContent = sanitizePayload({
            profile: config.appProfile,
            handoff,
            packet_text: draft.packet_text,
            work_id: handoff.work_id,
            expected_state_keys: handoff.expected_state_keys,
            expected_files: handoff.expected_files,
            expected_checks: handoff.expected_checks,
            expected_execution_surfaces: handoff.expected_execution_surfaces,
            safety_boundaries: handoff.safety_boundaries,
            completion_record_fields: handoff.completion_record_fields,
          });

          return {
            structuredContent,
            content: narrative(describeCodexHandoffDraft(handoff.work_id ?? workId.toUpperCase(), handoff.handoff_id)),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_generate_codex_handoff_draft", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_review_codex_result_draft",
      {
        title: "Review Codex result draft",
        description:
          "Use this when the user asks to review a reported Codex result against a handoff and prepare Augnes record drafts. It does not execute Codex, record proof, commit or reject state, or publish externally.",
        inputSchema: {
          scope: z.string().min(1).optional(),
          handoffId: z.string().min(1),
          actualFilesChanged: z.array(z.string()).optional(),
          actualStateKeys: z.array(z.string()).optional(),
          actualChecks: z.array(z.string()).optional(),
          actualExecutionSurfaces: z.array(z.string()).optional(),
          resultStatus: StateRuntimeActionResultStatusSchema.optional(),
          resultKind: StateRuntimeActionResultKindSchema.optional(),
          resultSummary: z.string().min(1),
          relatedPr: z.string().min(1).optional(),
          blockersOrFailures: z.array(z.string()).optional(),
          skippedChecks: z
            .array(
              z.union([
                z.string(),
                z.object({
                  check: z.string().min(1),
                  reason: z.string().min(1),
                }),
              ])
            )
            .optional(),
        },
        annotations: bridgeWriteAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({
        scope,
        handoffId,
        actualFilesChanged,
        actualStateKeys,
        actualChecks,
        actualExecutionSurfaces,
        resultStatus,
        resultKind,
        resultSummary,
        relatedPr,
        blockersOrFailures,
        skippedChecks,
      }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const draft = await stateRuntimeAdapter.reviewCodexResultDraft({
            scope: resolvedScope,
            handoffId,
            actualFilesChanged,
            actualStateKeys,
            actualChecks,
            actualExecutionSurfaces,
            resultStatus,
            resultKind,
            resultSummary,
            relatedPr,
            blockersOrFailures,
            skippedChecks,
          });
          const structuredContent = sanitizePayload({
            profile: config.appProfile,
            handoff: draft.handoff,
            review: draft.review,
            action_record_draft: draft.action_record_draft,
            work_event_draft: draft.work_event_draft,
            boundaries: {
              review_only: true,
              records_are_drafts_only: true,
              codex_execution: false,
              proof_recording: false,
              state_commit_or_reject: false,
              external_publication: false,
            },
          });

          return {
            structuredContent,
            content: narrative(
              describeCodexResultReviewDraft(
                draft.handoff.handoff_id,
                draft.review.recommended_result_status,
                draft.review.recommended_result_kind
              )
            ),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_review_codex_result_draft", error);
        }
      }
    );

    registerAppTool(
      server,
      "augnes_get_mailbox_summary",
      {
        title: "Get mailbox summary",
        description:
          "Read the Augnes mailbox summary buckets for pending handoffs, review needs, approval needs, and blocked or partial results. This is a derived read-only view and does not update mailbox, handoff, state, proof, Codex, or publication surfaces.",
        inputSchema: { scope: z.string().min(1).optional() },
        annotations: bridgeReadAnnotations,
        _meta: modelOnlyToolMeta,
      },
      async ({ scope }) => {
        const resolvedScope = scope ?? DEFAULT_STATE_RUNTIME_SCOPE;

        try {
          const mailboxSummary = await stateRuntimeAdapter.getMailboxSummary(resolvedScope);
          const structuredContent = sanitizePayload({
            profile: config.appProfile,
            mailbox_summary: mailboxSummary,
            boundaries: {
              derived_view_only: true,
              mailbox_status_update: false,
              mailbox_status_update_authority: false,
              handoff_status_update: false,
              codex_execution: false,
              codex_execution_authority: false,
              proof_recording: false,
              proof_recording_authority: false,
              state_commit_or_reject: false,
              state_commit_or_reject_authority: false,
              external_publication: false,
              publisher_authority: false,
            },
          });

          return {
            structuredContent,
            content: narrative(describeMailboxSummary(mailboxSummary)),
            _meta: sanitizePayload({ profile: config.appProfile }),
          };
        } catch (error) {
          return buildBridgeToolError("augnes_get_mailbox_summary", error);
        }
      }
    );
  }

  return server;
}

export function createHttpServer(
  adapter: AugnesCoreAdapter = createAugnesCoreAdapter(),
  stateRuntimeAdapter: StateRuntimeBridgeAdapter = new StateRuntimeHttpAdapter(),
  options: McpAppServerOptions = {}
) {
  return createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400).end("Missing URL");
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host ?? "localhost"}`);

    if (req.method === "OPTIONS" && url.pathname === config.mcpPath) {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, GET, OPTIONS, DELETE",
        "Access-Control-Allow-Headers": "content-type, mcp-session-id",
        "Access-Control-Expose-Headers": "Mcp-Session-Id",
      });
      res.end();
      return;
    }

    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "content-type": "text/plain" }).end("Augnes MCP server");
      return;
    }

    if (req.method === "GET" && url.pathname === "/healthz") {
      res.writeHead(200, { "content-type": "application/json" }).end(
        JSON.stringify(buildHealthPayload())
      );
      return;
    }

    const mcpMethods = new Set(["POST", "GET", "DELETE"]);
    if (url.pathname === config.mcpPath && req.method && mcpMethods.has(req.method)) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

      const server = createMcpAppServer(adapter, stateRuntimeAdapter, options);
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
        enableJsonResponse: true,
      });

      res.on("close", () => {
        transport.close();
        server.close();
      });

      try {
        await server.connect(transport);
        await transport.handleRequest(req, res);
      } catch (error) {
        console.error("Error handling MCP request:", error);
        if (!res.headersSent) res.writeHead(500).end("Internal server error");
      }
      return;
    }

    res.writeHead(404).end("Not Found");
  });
}

function isDirectExecution(): boolean {
  return Boolean(process.argv[1]) && pathToFileURL(process.argv[1]).href === import.meta.url;
}

if (isDirectExecution()) {
  const httpServer = createHttpServer();
  httpServer.listen(config.port, () => {
    console.log(`Augnes MCP server listening on http://localhost:${config.port}${config.mcpPath}`);
  });
}
