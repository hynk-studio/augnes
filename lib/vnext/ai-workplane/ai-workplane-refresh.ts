export async function refreshAIWorkplaneAfterProjectApplicationV01(input: {
  refresh_exact_review: () => Promise<void>;
  refresh_guide_brief: () => Promise<void>;
}): Promise<void> {
  await input.refresh_exact_review();
  await input.refresh_guide_brief();
}
