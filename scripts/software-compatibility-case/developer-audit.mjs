// DEVELOPER-AUTHORED CONTROL ONLY. Never exported to a consumer or attributed
// to consumer learning. Derives every result from the supplied batch/revision.
import fs from 'node:fs';
import { loadSnapshot, runOperations } from './runner.mjs';
const [snapshot, input, output]=process.argv.slice(2);
if (!output || fs.existsSync(output)) throw new Error('audit requires absent output');
const batch=JSON.parse(fs.readFileSync(input));
const results=runOperations(loadSnapshot(snapshot),batch.records.map(r=>({id:r.id,op:'result',request:r.request,value:r.packet})));
fs.writeFileSync(output,JSON.stringify({revision:'b',results:results.map(r=>r.accepted?{id:r.id,accepted:true,packet:r.value}:{id:r.id,accepted:false,error_code:r.error.code})},null,2)+'\n',{flag:'wx'});
