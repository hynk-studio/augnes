import path from 'node:path';
import { startLocal } from './web-planning-local-runtime.mjs';
import { checkCrossProjectContributions } from './web-planning-contribution-checks.mjs';
import { checkNeedDrivenRequest } from './web-planning-need-request-checks.mjs';
const root=process.env.AUGNES_CANONICAL_TEMP_ROOT;if(!root)throw Error('owned_test_root_required');
const servers=[];let checks=0;
async function start(name,options={}){const s=await startLocal({root:path.join(root,name),...options});servers.push(s);return s;}
try{const passed=name=>{checks++;console.log(name);};await checkCrossProjectContributions({start,root,passed});await checkNeedDrivenRequest({start,root,passed});console.log(JSON.stringify({cross_project_checks:checks,authentication:'controlled local principals',hosted_adoption:false}));}
finally{for(const s of servers.reverse())await s.close();console.log('contribution_owned_runtime_cleanup_complete');}
