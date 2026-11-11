import path from 'node:path';
import { startLocal } from './web-planning-local-runtime.mjs';
import { checkWorkContinuation } from './web-planning-successor-checks.mjs';
import { checkContinuationClient } from './test-web-planning-continuation-client.mjs';
const root=process.env.AUGNES_CANONICAL_TEMP_ROOT;if(!root)throw Error('owned_test_root_required');
const servers=[];let checks=0;
try {
  await checkContinuationClient();
  await checkWorkContinuation({root,start:async(name,options)=>{const s=await startLocal({root:path.join(root,name),...options});servers.push(s);return s;},
    passed:name=>{checks++;console.log(name);}});
  console.log(JSON.stringify({successor_checks:checks,hosted_adoption:false,deciding_evidence:false}));
} finally {for(const s of servers.reverse())await s.close();console.log('successor_owned_runtime_cleanup_complete');}
