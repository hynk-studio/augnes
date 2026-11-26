import path from 'node:path';
import { startLocal } from './web-planning-local-runtime.mjs';
import { checkWorkContinuation } from './web-planning-successor-checks.mjs';
import { checkContinuationClient } from './test-web-planning-continuation-client.mjs';
import { checkRecipientSignIn } from './web-planning-recipient-signin-checks.mjs';
import { checkSharedHomeIngress } from './web-planning-cloudflare-checks.mjs';
const root=process.env.AUGNES_CANONICAL_TEMP_ROOT;if(!root)throw Error('owned_test_root_required');
const servers=[];let checks=0;
async function start(name,options){const server=await startLocal({root:path.join(root,name),...options});servers.push(server);return server;}
const passed=name=>{checks++;console.log(name);};
try {
  await checkContinuationClient();
  await checkWorkContinuation({root,start,passed});
  const direct=await start('direct-home',{direct:true});
  await checkSharedHomeIngress(direct,passed);
  await checkRecipientSignIn({server:direct,root,passed});
  console.log(JSON.stringify({successor_checks:checks,hosted_adoption:false,deciding_evidence:false}));
} finally {for(const s of servers.reverse())await s.close();console.log('successor_owned_runtime_cleanup_complete');}
