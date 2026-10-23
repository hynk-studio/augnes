// Preparation authoring only. Never run to refresh an immutable live freeze.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inventory } from './inventory.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const target=path.join(root,'freeze-ready.json');
if(fs.existsSync(target)) throw new Error('preparation manifest already exists; do not overwrite originals');
fs.writeFileSync(target,JSON.stringify({kind:'PREPARATION_ONLY_NOT_LIVE_FREEZE',authored_at:new Date().toISOString(),
  consumers:'NOT_RUN; no allocation',route_controls:'NOT_RUN; no allocation',
  source:'snapshots/manifest.json',dependency:'package-lock.json',
  invocation:'README.md',acceptance:'acceptance.md',
  access:{a:'12-file export',b:'whole settled A excluding node_modules/ and .runtime/, plus nine B additions',isolation:'declared protocol separation on shared-user host'},
  exposure:'Coordinator and two read-only engineering reviewers exposed to evaluator/source material; developer controls are not consumers.',
  files:inventory(root)},null,2)+'\n',{flag:'wx'});
