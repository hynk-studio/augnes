export const SELECTED_SOURCE_INSPECTION_TITLE = "Bounded selected-source preparation";
export const SELECTED_SOURCE_INSPECTION_TASK = {
  goal: "Inspect at most two explicitly selected local text sources for the prospective decision, binding observations to exact source versions.",
  success_criteria: ["Return each selected observation's availability and exact source binding."],
  non_goals: ["Do not execute commands, mutate sources, use network or models, or accept the candidate judgment."],
};
export const SELECTED_SOURCE_INSPECTION_CHECKS = ["selected_source_bundle_inspected"];
export const SELECTED_SOURCE_INSPECTION_OUTPUTS = ["selected_source_observations"];
