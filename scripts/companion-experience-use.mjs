// Caller seam only: decisions come from the authorized consumer, not a selector.
import assert from "node:assert/strict";

export function ordinaryExperienceUse(call, repositoryRoot) {
  const read = async () => {
    const resumed = await call("augnes_resume_repository", { repositoryRoot });
    assert.equal(resumed.continuity?.snapshot.status, "exact");
    const binding = resumed.continuity.snapshot.binding;
    const sources = resumed.continuity.current_work.status === "no_current_work" ? null
      : await call("augnes_read_repository_work_sources", { repositoryRoot, expectedSnapshotBinding: binding });
    if (sources) assert.equal(sources.status, "available");
    return { binding, work: resumed.continuity.current_work, sources };
  };
  const write = async (kind, current, changes) => {
    const names = { initial: ["augnes_preview_repository_initial_work", "augnes_define_repository_initial_work"],
      revise: ["augnes_preview_repository_work_revision", "augnes_save_repository_work_revision"],
      different: ["augnes_preview_repository_new_work", "augnes_prepare_repository_new_work"] };
    assert(Object.hasOwn(names, kind));
    const args = { repositoryRoot, expectedSnapshotBinding: current.binding, changes };
    const preview = await call(names[kind][0], args); assert.equal(preview.status, "previewed");
    if (kind === "different") assert.equal(preview.preparation.prior_work_marked_complete, false);
    const saved = await call(names[kind][1], { ...args, previewBinding: preview.preview_binding });
    // A refusal or uncertain outcome stops here. Reconcile by an explicit read;
    // never automatically replace the save or change the source choices.
    assert.equal(saved.status, "saved");
    return { preview, saved, current: await read() };
  };
  const lookup = async (current, query) => {
    const result = await call("augnes_lookup_repository_retained_sources", {
      repositoryRoot, expectedSnapshotBinding: current.binding, query });
    assert.equal(result.status, "available"); return result;
  };
  return { read, write, lookup };
}
