import { BlankStateClient } from "@/components/blank-state/blank-state-client";
import { ProductShell } from "@/components/product-shell";
import { buildBlankStateViewV01 } from "@/lib/vnext/blank-state/blank-state-view";
import type { BlankStateSourceV01 } from "@/types/vnext/blank-state";
import type { ProjectGuideBriefV02 } from "@/types/vnext/guide-brief";

export function BlankStateSurface({
  source,
  guide,
}: {
  source: BlankStateSourceV01;
  guide: ProjectGuideBriefV02;
}) {
  const view = buildBlankStateViewV01(guide);
  return (
    <ProductShell
      primaryZone="blank-state"
      utilityContext={source.route_mode === "project_management" ? "project-management" : null}
      projectContext={view.project_name && view.project_context_label
        ? { label: view.project_context_label, name: view.project_name }
        : null}
    >
      <BlankStateClient source={source} view={view} guide={guide} />
    </ProductShell>
  );
}
