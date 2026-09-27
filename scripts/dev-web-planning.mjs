import { startLocal } from './web-planning-local-runtime.mjs';
const root=process.env.AUGNES_CANONICAL_TEMP_ROOT;if(!root)throw new Error('owned_local_root_required');
const local=await startLocal({root});
console.log(JSON.stringify({local_only:true,synthetic_data_only:true,entry:local.origin+'/_local/login',deadline_seconds:1500}));
let finish;const done=new Promise(resolve=>{finish=resolve;});const timer=setTimeout(finish,1_500_000);
process.once('SIGTERM',finish);process.once('SIGINT',finish);
try{await done;}finally{clearTimeout(timer);await local.close();console.log('web_planning_local_cleanup_complete');}
