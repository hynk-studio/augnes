// Focused development regression; the full Web suite invokes this same owner.
import path from 'node:path';
import { startLocal } from './web-planning-local-runtime.mjs';
import { checkIndependentProjects } from './web-planning-project-checks.mjs';
const root = process.env.AUGNES_CANONICAL_TEMP_ROOT;
if (!root) throw Error('owned_test_root_required');
const servers = []; let checks = 0;
async function start(name, options = {}) {
  const s = await startLocal({ root: path.join(root, name), ...options }); servers.push(s); return s;
}
try {
  await checkIndependentProjects({ start, root, passed: name => { checks++; console.log(name); } });
  console.log(JSON.stringify({ independent_project_checks: checks, authentication: 'controlled local fixture identities', hosted_adoption: false, deciding_evidence: false }));
} finally {
  for (const s of servers.reverse()) await s.close();
  console.log('independent_projects_owned_runtime_cleanup_complete');
}
