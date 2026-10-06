import type { ProjectSelectionRevision } from "../lib/vnext/project-selection";

/** A different, well-formed observation for stale-binding negative controls. */
export function differentSelectionRevision(value: ProjectSelectionRevision): ProjectSelectionRevision {
  return typeof value === "number" ? value + 1 : `${value.slice(0, -1)}${value.endsWith("0") ? "1" : "0"}`;
}
