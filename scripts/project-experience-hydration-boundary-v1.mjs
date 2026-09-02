export const PROJECT_EXPERIENCE_MANAGEMENT_HYDRATED_CONDITION_V1 =
  `document.querySelector('[data-blank-state-project-management-hydrated="true"]') !== null`;

export function expectedManagementSafetyHydrationWarningV1(entry) {
  return (
    entry.phase === "rendered_state_responsive_matrix" &&
    entry.text.includes(
      "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.",
    ) &&
    entry.text.includes('data-management-safety="management_safety_view.v0.1"') &&
    entry.text.includes('-                                 open=""')
  );
}
