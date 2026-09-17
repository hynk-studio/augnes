import {
  normalizeSelectedWorkSources,
  SELECTED_WORK_SOURCE_NAMESPACE,
} from "@/lib/intake/selected-work-source-comparison";
import { detectPrivacyRedactionRuntimeGuardFindingsV01 } from "@/lib/privacy/redaction-guard";
import { isPublicSafeSourceLocatorV01 } from "@/lib/research-source/sanitize-source-ref";
import { canonicalizeProtocolValueV01, createProtocolSha256V01, parseStrictIsoTimestampV01 } from "@/lib/vnext/protocol-primitives";
import { containsPublicTextLocalPathV01 } from "@/lib/vnext/repository-relative-path";
import { normalizeInitialProjectWorkDefinitionV01 } from "@/lib/vnext/runtime/initial-project-work-context";
import type { VNextOperatorPilotPacketLineageInspectionV01 } from "@/lib/vnext/runtime/operator-pilot-project-continuity";
import type { ExternalRefV01 } from "@/types/vnext/external-ref";
import { HOSTED_RESEARCH_PROJECTION_SCHEMA_V02, type HostedResearchProjectionV02, type HostedResearchSelectedSourceV02 } from "@/types/vnext/hosted-research-projection";
import { PROJECT_DISPLAY_NAME_MAX_LENGTH_V01, type ProjectIdentityV01 } from "@/types/vnext/project-identity";
import type { ActiveProjectSelectionV01 } from "@/types/vnext/project-onboarding";
import type { ProjectWorkInitializationV01 } from "@/types/vnext/project-work-initialization";
import type { TaskContextPacketSelectedEntryV01 } from "@/types/vnext/task-context-packet";

export interface HostedResearchProjectionInputV02 {
  project: ProjectIdentityV01 | null;
  initialization: ProjectWorkInitializationV01;
  packet_lineage: VNextOperatorPilotPacketLineageInspectionV01 | null;
  active_selection: ActiveProjectSelectionV01 | null;
  captured_at: string;
}

export class HostedResearchProjectionErrorV02 extends Error {
  constructor(readonly code: "current_work_unavailable" | "current_read_binding_mismatch" | "capture_time_invalid" | "duplicate_selected_source" | "unsafe_projection_metadata") {
    super(code);
    this.name = "HostedResearchProjectionErrorV02";
  }
}

const CURRENT_STATES = {
  initial_user_defined: ["defined_initial_work", "current_initial_packet"],
  pre_execution_user_revision: ["defined_revised_work", "current_revision_packet"],
  authored_successor_task: ["defined_successor_work", "current_successor_packet"],
  semantic_transition: ["defined_transition_work", "current_transition_packet"],
  source_linked_operational_continuation: ["defined_operational_continuation_work", "current_operational_continuation_packet"],
} as const;

/**
 * Caller supplies authenticated, scoped reads from one local capture boundary.
 * Existing initialization/lineage readers own validity and currentness. This
 * adapter only checks their agreement; on drift, the caller must reread them.
 * No reads, writes, clock acquisition, credential handling or transport here.
 */
export function buildHostedResearchProjectionV02(input: HostedResearchProjectionInputV02): HostedResearchProjectionV02 {
  const { project, initialization: current, packet_lineage: lineage, active_selection: selection } = input;
  if (!project || !lineage || !selection || !current.current_packet || !current.current_work) {
    refuse("current_work_unavailable");
  }
  const packet = lineage.packet;
  const expectedState = CURRENT_STATES[current.current_packet.lineage_kind];
  if (!expectedState || current.state !== expectedState[0] || current.reason !== expectedState[1]) {
    refuse("current_work_unavailable");
  }
  if (
    current.initialization_version !== "project_work_initialization.v0.1" ||
    !lineage.projection_current ||
    [current, packet, selection].some((scope) => scope.workspace_id !== project.workspace_id || scope.project_id !== project.project_id) ||
    current.active_project_id !== project.project_id ||
    !Number.isSafeInteger(selection.selection_revision) || selection.selection_revision < 1 ||
    current.active_selection_revision !== selection.selection_revision ||
    current.current_packet.packet_id !== packet.packet_id ||
    current.current_packet.packet_fingerprint !== packet.integrity.fingerprint ||
    current.current_packet.generated_at !== packet.generated_at ||
    current.current_packet.lineage_kind !== lineage.lineage_kind ||
    !same(current.current_work, packet.task)
  ) refuse("current_read_binding_mismatch");

  const captured = parseStrictIsoTimestampV01(input.captured_at);
  const generated = parseStrictIsoTimestampV01(packet.generated_at);
  const selected = parseStrictIsoTimestampV01(selection.selected_at);
  const expires = packet.expires_at === null ? null : parseStrictIsoTimestampV01(packet.expires_at);
  if (captured === null || generated === null || selected === null || captured < generated || captured < selected ||
    (packet.expires_at !== null && (expires === null || captured >= expires))) refuse("capture_time_invalid");

  // Reuse the bounded stored-source contract, including its exact scope-bound
  // identity check. Refuse duplicates before that owner's normal deduplication.
  const packetSources = packet.selected_context.filter((entry) =>
    entry.external_ref?.compatibility_namespace === SELECTED_WORK_SOURCE_NAMESPACE || entry.entry_id.startsWith("selected-source:"));
  const sources = checkedSources(project, current.selected_source_context ?? []);
  if (!same(sources, checkedSources(project, packetSources))) refuse("current_read_binding_mismatch");
  const definition = normalizeInitialProjectWorkDefinitionV01(current.current_work);
  if (!same(definition, current.current_work)) refuse("current_read_binding_mismatch");

  const material: Omit<HostedResearchProjectionV02, "integrity"> = {
    schema: HOSTED_RESEARCH_PROJECTION_SCHEMA_V02,
    envelope_kind: "hosted_projection_export_envelope",
    data_kind: "local_augnes_explicit_export",
    projection_authority: "non_authoritative",
    live_sync: false,
    local_augnes_currentness: "not_verified",
    semantic_authority_granted: false,
    execution_authority_granted: false,
    canonical_import_supported: false,
    captured_at: input.captured_at,
    project: { workspace_id: project.workspace_id, project_id: project.project_id, display_name: project.display_name },
    work: { ...definition, work_ref: projectWorkRef(packet.work_ref) },
    source_binding: {
      initialization_version: current.initialization_version,
      active_selection_revision: selection.selection_revision,
      active_selection_selected_at: selection.selected_at,
      packet_id: packet.packet_id,
      packet_fingerprint: packet.integrity.fingerprint,
      packet_generated_at: packet.generated_at,
      packet_expires_at: packet.expires_at,
      lineage_kind: lineage.lineage_kind,
      currentness_at_capture: "locally_current_packet",
    },
    selected_source_context: sources.map(projectSource),
    unresolved: [],
    unresolved_scope: "not_included",
    limitations: [
      "Current packet identity is established only at the local capture boundary. Local Augnes currentness is not continuously verified after export.",
      "This bounded, lossy projection cannot restore canonical state, create a ReviewDecision or Transition, or grant semantic or execution authority.",
      "Project-wide unresolved state, pending reviews and unselected history are not included. Source review labels remain labels, not structured unresolved claims.",
      "Selected excerpts are literal untrusted source text. Their source completeness and currentness remain unverified; unsafe or unsupported locators are omitted.",
      "A future explicit user export is the externalization decision. This producer provides no upload, live sync, automatic write-back or canonical import.",
    ],
  };
  if (project.display_name !== null && project.display_name.length > PROJECT_DISPLAY_NAME_MAX_LENGTH_V01) refuse("unsafe_projection_metadata");
  // Excerpts are user work material, not metadata: never redact or interpret
  // their literal text. Everything else comes from an explicit field allowlist.
  const metadata = {
    project: material.project, work: material.work, source_binding: material.source_binding,
    sources: material.selected_source_context.map(({ excerpt_text: _text, ...rest }) => rest),
  };
  if (Buffer.byteLength(canonicalizeProtocolValueV01(metadata), "utf8") > 24_000) refuse("unsafe_projection_metadata");
  assertSafeMetadata(metadata);
  return {
    ...material,
    integrity: {
      canonicalization: "augnes-json-c14n-v0_1",
      fingerprint_scope: "projection_without_integrity",
      content_fingerprint: createProtocolSha256V01(canonicalizeProtocolValueV01(material)),
    },
  };
}

function checkedSources(scope: ProjectIdentityV01, entries: TaskContextPacketSelectedEntryV01[]) {
  if (new Set(entries.map((entry) => entry.entry_id)).size !== entries.length) refuse("duplicate_selected_source");
  return normalizeSelectedWorkSources(scope, entries);
}

function projectWorkRef(ref: string | ExternalRefV01 | null): string | ExternalRefV01 | null {
  if (ref === null || typeof ref === "string") return ref;
  return {
    ref_version: ref.ref_version, ref_type: ref.ref_type, external_id: ref.external_id,
    trust_class: ref.trust_class,
    ...(ref.observed_at !== undefined ? { observed_at: ref.observed_at } : {}),
    ...(ref.source_ref !== undefined ? { source_ref: ref.source_ref } : {}),
    ...(ref.compatibility_namespace !== undefined ? { compatibility_namespace: ref.compatibility_namespace } : {}),
  };
}

function projectSource(entry: TaskContextPacketSelectedEntryV01): HostedResearchSelectedSourceV02 {
  const locator = entry.compatibility_source_ref!.external_id;
  const safe = ["url", "doi", "file_ref", "note_ref", "manual_text_summary"].some((input_kind) =>
    isPublicSafeSourceLocatorV01({ input_kind, source_locator: locator }));
  return {
    entry_id: entry.entry_id, source_fingerprint: entry.source_ref!, excerpt_text: entry.bounded_summary!,
    why_included: entry.why_included, trust_class: entry.trust_class,
    observed_at: entry.external_ref?.observed_at ?? null,
    source_locator: safe ? locator : null,
    source_locator_status: safe ? "included_export_safe" : "omitted_not_export_safe",
    currentness: structuredClone(entry.currentness),
    source_text_authority: "untrusted_source_text",
  };
}

function assertSafeMetadata(value: unknown): void {
  if (typeof value === "string" && (containsPublicTextLocalPathV01(value) ||
    /\b(?:cookie|authorization|OPENAI_API_KEY|GITHUB_TOKEN)\s*[:=]/iu.test(value) ||
    detectPrivacyRedactionRuntimeGuardFindingsV01(value).some((finding) => finding.action !== "allowed"))) refuse("unsafe_projection_metadata");
  if (value && typeof value === "object") Object.values(value).forEach(assertSafeMetadata);
}

function same(left: unknown, right: unknown): boolean {
  return canonicalizeProtocolValueV01(left) === canonicalizeProtocolValueV01(right);
}

function refuse(code: HostedResearchProjectionErrorV02["code"]): never {
  throw new HostedResearchProjectionErrorV02(code);
}
