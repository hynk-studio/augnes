import { BlankStateClient } from "@/components/blank-state/blank-state-client";
import { ProductShell } from "@/components/product-shell";
import {
  ContinuityPinsProvider,
} from "@/components/continuity-pins/continuity-pins-provider";
import {
  PinnedContinuitiesNavigation,
} from "@/components/continuity-pins/continuity-pins-ui";
import { buildContinuitiesTemporalContextV01 } from "@/lib/vnext/blank-state/continuities-temporal-context";
import { buildBlankStateViewV01 } from "@/lib/vnext/blank-state/blank-state-view";
import { buildManagementSafetyViewV01 } from "@/lib/vnext/management-safety/management-safety-view";
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
  const temporalContext = buildContinuitiesTemporalContextV01({
    source,
    view,
  });
  const managementSafety = buildManagementSafetyViewV01({
    project_context: source.projection === null
      ? "no_active_project"
      : source.projection.project_summary.is_active
        ? "active_project"
        : "viewed_inactive_project",
  });
  return (
    <ContinuityPinsProvider initialCollection={source.continuity_pins ?? null}>
      <ProductShell
        primaryZone="blank-state"
        projectContext={view.project_name && view.project_context_label
          ? { label: view.project_context_label, name: view.project_name }
          : null}
        secondaryNavigation={<PinnedContinuitiesNavigation />}
      >
        <BlankStateClient
          source={source}
          view={view}
          guide={guide}
          temporalContext={temporalContext}
          managementSafety={managementSafety}
        />
      </ProductShell>
    </ContinuityPinsProvider>
  );
}
