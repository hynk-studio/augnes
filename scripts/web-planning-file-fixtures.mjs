// Synthetic representative sizes from #1372; no private research text or IDs.
const sized=(text,size,suffix='')=>text+'.'.repeat(size-Buffer.byteLength(text+suffix))+suffix;
const script=`import { readFileSync } from 'node:fs';
const input=JSON.parse(readFileSync(process.argv[2],'utf8'));
if(input.measurements.length!==1000)throw new Error('fixture_count');
const sum=input.measurements.reduce((a,b)=>a+b,0);
console.log(JSON.stringify({count:input.measurements.length,sum,mean:sum/input.measurements.length,judgment:'Synthetic arithmetic only; no research transfer claim.'}));
/*`;
const results=JSON.stringify({measurements:Array.from({length:1000},(_,i)=>i),units:'synthetic',padding:''});
export const fileFixtures=[
 {name:'보고서 🌿.html',role:'report',bytes:Buffer.from(sized('<!doctype html><title>Synthetic report</title><p>Only a generated integer sequence was measured. No transfer result.</p><!--',13634,'-->'))},
 {name:'analysis.mjs',role:'source',bytes:Buffer.from(sized(script,12601,'*/\n'))},
 {name:'results.json',role:'results',bytes:Buffer.from(results.replace('"padding":""','"padding":"'+'.'.repeat(39801-Buffer.byteLength(results))+'"'))},
 {name:'checks.txt',role:'other',bytes:Buffer.from(sized('Synthetic check summary: verify count, sum and mean. Not a general usefulness evaluation.\n',3180))},
];
export const uploadFiles=files=>files.map(({name,role,bytes})=>({name,role,data:bytes.toString('base64')}));
