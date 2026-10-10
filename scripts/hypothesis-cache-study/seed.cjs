// Identical, deliberately mistaken starting code for both research arms.
module.exports = {
  plan(job, view) {
    const entry = view.entries.find(item => item.key === job.name);
    return entry ? { action: 'reuse', entry_id: entry.id }
      : { action: 'compute', key: job.name };
  },
  project(job, raw) {
    return job.output === 'mean' ? raw / (job.values.length + 1) : raw;
  },
  countExecutions(deliveries) {
    return deliveries.length;
  },
};
