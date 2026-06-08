import type {
  PerspectiveAgentBriefIngressContextV0,
  PerspectiveAgentBriefV0,
} from "@/lib/perspective-ingest/perspective-agent-brief";

export type PerspectiveAgentBriefHandoffPacketAudienceV0 =
  | "chatgpt_review"
  | "codex_handoff"
  | "agent_context";

export interface BuildPerspectiveAgentBriefHandoffPacketInput {
  brief: PerspectiveAgentBriefV0;
  audience: PerspectiveAgentBriefHandoffPacketAudienceV0;
  generated_at?: string;
  title?: string;
}

export interface PerspectiveAgentBriefHandoffPacketV0 {
  packet_version: "perspective_agent_brief_handoff_packet.v0.1";
  audience: PerspectiveAgentBriefHandoffPacketAudienceV0;
  generated_at: string;
  title: string;
  sections: {
    purpose: string;
    selected_material: string[];
    spatial_context: string[];
    temporal_context: string[];
    ingress_context: string[];
    tensions: string[];
    next_actions: string[];
    handoff_constraints: string[];
    authority: string[];
  };
  packet_text: string;
  exclusions: string[];
}

const DEFAULT_TITLE = "Perspective Agent Brief Handoff";
const MAX_PACKET_ITEMS = 3;

export function buildPerspectiveAgentBriefHandoffPacket({
  brief,
  audience,
  generated_at = new Date().toISOString(),
  title = DEFAULT_TITLE,
}: BuildPerspectiveAgentBriefHandoffPacketInput): PerspectiveAgentBriefHandoffPacketV0 {
  const exclusions = buildPerspectiveAgentBriefHandoffExclusions();
  const sections: PerspectiveAgentBriefHandoffPacketV0["sections"] = {
    purpose: [
      `Local read-only Agent Brief handoff for ${formatAudience(audience)} follow-up.`,
      "Use for human-reviewed review and planning only.",
      "This consumption artifact does not grant Formation, execution, GitHub, persistence, or provider authority.",
    ].join(" "),
    selected_material: [
      `Scope: ${brief.scope.mode} / ${brief.scope.label}`,
      `Selected: ${brief.selected.label}`,
      `Type: ${brief.selected.type}`,
      `Summary: ${brief.selected.summary}`,
    ],
    spatial_context: [
      `Node count: ${brief.spatial_context.node_count}`,
      `Edge count: ${brief.spatial_context.edge_count}`,
      `Related node count: ${brief.spatial_context.related_node_ids.length}`,
      `Related edge count: ${brief.spatial_context.related_edge_ids.length}`,
    ],
    temporal_context: [
      `Primary spine: ${formatList(brief.temporal_context.primary_spine)}`,
      `Satellites: ${brief.temporal_context.satellites.parent} -> ${formatList(
        brief.temporal_context.satellites.items,
      )}`,
      `Related temporal nodes: ${formatList(
        brief.temporal_context.related_temporal_nodes,
      )}`,
      `Current temporal node: ${
        brief.temporal_context.current_temporal_node ?? "none"
      }`,
      `Next temporal node: ${brief.temporal_context.next_temporal_node ?? "none"}`,
      `Related Cockpit surfaces: ${formatList(
        brief.surface_context.related_surfaces,
      )}`,
    ],
    ingress_context: buildIngressContextLines(brief.ingress_context),
    tensions: buildLimitedLines(
      brief.tensions.map((tension) => tension.summary),
      "No tensions in brief.",
    ),
    next_actions: buildLimitedLines(
      brief.next_actions.map((action) => action.summary),
      "No next actions in brief.",
    ),
    handoff_constraints: [
      "Use for review/planning only.",
      "Do not treat as Formation authority.",
      "Do not execute Codex.",
      "Do not mutate GitHub.",
      "Do not infer raw source content.",
      "Ask the user before implementation.",
    ],
    authority: [
      `Mode: ${brief.authority.mode}`,
      "No external calls.",
      "No persistence.",
      "No graph DB.",
      "No proof/evidence/readiness writes.",
      "No Codex execution.",
      "No GitHub mutation.",
      "No provider/model/API call.",
    ],
  };

  return {
    packet_version: "perspective_agent_brief_handoff_packet.v0.1",
    audience,
    generated_at,
    title,
    sections,
    packet_text: renderPacketText({
      audience,
      exclusions,
      generated_at,
      sections,
      title,
    }),
    exclusions,
  };
}

function buildIngressContextLines(
  ingressContext: PerspectiveAgentBriefIngressContextV0 | undefined,
) {
  if (!ingressContext) {
    return ["No ingress context present."];
  }

  return [
    `Ingress kind: ${ingressContext.ingress_kind}`,
    `Trust level: ${ingressContext.trust_level}`,
    `Admission state: ${ingressContext.admission_state}`,
    `Redaction state: ${ingressContext.redaction_state}`,
    `Decision: ${ingressContext.decision.to_state} / allowed ${formatBoolean(
      ingressContext.decision.allowed,
    )}`,
    `Readiness: ${
      ingressContext.readiness.eligible_for_preview
        ? "preview ready"
        : "not preview ready"
    }`,
    `Research archive: ${formatBoolean(
      ingressContext.readiness.eligible_for_research_archive,
    )}`,
    `Boundary: ${formatIngressBoundary(ingressContext)}`,
    `Pointer count: ${ingressContext.refs.pointer_count}`,
    `Source ref available: ${formatBoolean(
      ingressContext.refs.source_ref_available,
    )}`,
    `Candidate id available: ${formatBoolean(
      ingressContext.refs.candidate_id_available,
    )}`,
  ];
}

function buildPerspectiveAgentBriefHandoffExclusions() {
  return [
    "raw pasted text omitted",
    "raw ingress_admission JSON omitted",
    "raw Agent Brief JSON omitted",
    "candidate/source/pointer/actor/consent values omitted",
    "bounded summary omitted from ingress_context",
    "packet body text omitted",
    "FormationReceipt body omitted",
    "external integration and private payloads omitted",
    "packet text does not grant authority",
  ];
}

function renderPacketText({
  audience,
  exclusions,
  generated_at,
  sections,
  title,
}: {
  audience: PerspectiveAgentBriefHandoffPacketAudienceV0;
  generated_at: string;
  title: string;
  sections: PerspectiveAgentBriefHandoffPacketV0["sections"];
  exclusions: string[];
}) {
  return [
    `# ${title}`,
    "",
    `Audience: ${audience}`,
    `Generated: ${generated_at}`,
    "",
    "## Purpose",
    sections.purpose,
    "",
    "## Selected Material",
    renderList(sections.selected_material),
    "",
    "## Spatial Context",
    renderList(sections.spatial_context),
    "",
    "## Temporal Context",
    renderList(sections.temporal_context),
    "",
    "## Ingress Context",
    renderList(sections.ingress_context),
    "",
    "## Tensions",
    renderList(sections.tensions),
    "",
    "## Next Actions",
    renderList(sections.next_actions),
    "",
    "## Handoff Constraints",
    renderList(sections.handoff_constraints),
    "",
    "## Authority",
    renderList(sections.authority),
    "",
    "## Exclusions",
    renderList(exclusions),
  ].join("\n");
}

function renderList(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function buildLimitedLines(items: string[], emptyLine: string) {
  const visibleItems = items.slice(0, MAX_PACKET_ITEMS);
  return visibleItems.length ? visibleItems : [emptyLine];
}

function formatList(items: string[]) {
  return items.length ? items.join(" -> ") : "none";
}

function formatBoolean(value: boolean) {
  return value ? "yes" : "no";
}

function formatIngressBoundary(
  ingressContext: PerspectiveAgentBriefIngressContextV0,
) {
  if (ingressContext.authority.local_only && ingressContext.authority.read_only) {
    return "local/read-only";
  }

  if (ingressContext.authority.local_only) return "local";
  if (ingressContext.authority.read_only) return "read-only";
  return "not local/read-only";
}

function formatAudience(audience: PerspectiveAgentBriefHandoffPacketAudienceV0) {
  return audience.replaceAll("_", " ");
}
