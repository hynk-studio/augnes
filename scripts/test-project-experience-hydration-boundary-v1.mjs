#!/usr/bin/env node

import assert from "node:assert/strict";

import {
  MANAGEMENT_SAFETY_HYDRATION_REGRESSION_WARNING_REQUIRED_COUNT_V1,
  PROJECT_EXPERIENCE_MANAGEMENT_HYDRATED_CONDITION_V1,
  expectedConsoleErrorAfterManagementSafetyBoundaryV1,
  managementSafetyHydrationRegressionWarningV1,
} from "./project-experience-hydration-boundary-v1.mjs";

const hydrationPrefix =
  "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.";
const exactKnownWarning = {
  phase: "rendered_state_responsive_matrix",
  path: "/projects",
  text: `${hydrationPrefix}\n<ManagementSafety>\n  <details\n    data-management-safety="management_safety_view.v0.1"\n-                                 open=""\n  >`,
};

assert.equal(
  PROJECT_EXPERIENCE_MANAGEMENT_HYDRATED_CONDITION_V1,
  `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null`,
);
assert.equal(
  MANAGEMENT_SAFETY_HYDRATION_REGRESSION_WARNING_REQUIRED_COUNT_V1,
  0,
);
assert.equal(
  managementSafetyHydrationRegressionWarningV1(exactKnownWarning),
  true,
);
assert.equal(
  expectedConsoleErrorAfterManagementSafetyBoundaryV1(
    exactKnownWarning,
    true,
  ),
  false,
);

for (const entry of [
  {
    ...exactKnownWarning,
    phase: "project_home_lifecycle_presentation",
  },
  {
    ...exactKnownWarning,
    text: exactKnownWarning.text.replace(
      'data-management-safety="management_safety_view.v0.1"',
      'data-another-component="unrelated_hydration_view.v0.1"',
    ),
  },
  {
    ...exactKnownWarning,
    text: exactKnownWarning.text.replace(
      '-                                 open=""',
      '-                                 aria-expanded="true"',
    ),
  },
  {
    ...exactKnownWarning,
    text: `${hydrationPrefix}\nretained historical prefix without a component or attribute identity`,
  },
]) {
  assert.equal(
    managementSafetyHydrationRegressionWarningV1(entry),
    false,
  );
}

assert.equal(
  expectedConsoleErrorAfterManagementSafetyBoundaryV1(
    {
      phase: "rendered_state_responsive_matrix",
      path: "/api/vnext/projects",
      text: "Failed to load resource: the server responded with a status of 409 (Conflict)",
    },
    true,
  ),
  true,
);

assert.equal(
  /vnext_bootstrap_v01\.|OPENAI_API_KEY|GITHUB_TOKEN|\/Users\//u.test(
    JSON.stringify(exactKnownWarning),
  ),
  false,
);

process.stdout.write(
  `${JSON.stringify({
    test: "project-experience-hydration-boundary-v1",
    status: "pass",
    hydrated_interaction_gate: true,
    exact_legacy_regression_warning_match: true,
    unrelated_hydration_warning_rejected: true,
    legacy_regression_warning_not_expected: true,
    legacy_regression_warning_required_count: 0,
    existing_expected_status_classification_preserved: true,
    phase_and_semantic_identity_bounded: true,
    private_material_absent: true,
  })}\n`,
);
