import { buildSelectedWorkSourceEntry } from "@/lib/intake/selected-work-source-comparison";
import { canonicalizeProtocolValueV01 as canonical } from "./protocol-primitives";
import type { DirectionDecision, DirectionEntry } from "./project-direction";

export const DIRECTION_SOURCE = "project_direction_source.v0.1";
export function directionSource(current: DirectionEntry<DirectionDecision>) {
  const d = current.value;
  return buildSelectedWorkSourceEntry(d, { source: "Effective project direction", label: "New candidate", observed_at: d.at,
    provenance: d.principal.kind === "human" ? "user_declaration" : "derived_interpretation",
    text: canonical({ version: DIRECTION_SOURCE, revision_ref: current.ref, authority_ref: d.authority_ref,
      principal: d.principal, purpose: d.content.purpose }) });
}
export function selectedDirectionProfile(entry: { bounded_summary: string | null }) {
  try { return JSON.parse(entry.bounded_summary ?? "null"); } catch { return null; }
}
