export const PROJECT_EXPERIENCE_MANAGEMENT_HYDRATED_CONDITION_V1 =
  `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null`;

export const MANAGEMENT_SAFETY_HYDRATION_REGRESSION_WARNING_REQUIRED_COUNT_V1 = 0;

export function managementSafetyHydrationRegressionWarningV1(entry) {
  return (
    entry.phase === "rendered_state_responsive_matrix" &&
    entry.text.includes(
      "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.",
    ) &&
    entry.text.includes('data-management-safety="management_safety_view.v0.1"') &&
    entry.text.includes('-                                 open=""')
  );
}

export function expectedConsoleErrorAfterManagementSafetyBoundaryV1(
  entry,
  expectedByExistingClassification,
) {
  if (managementSafetyHydrationRegressionWarningV1(entry)) return false;
  return expectedByExistingClassification === true;
}
