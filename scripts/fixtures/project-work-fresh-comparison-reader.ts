import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { readProjectWorkCaptures } from "../project-work-comparison-capture.mjs";
import { inspectVNextOperatorPilotPacketLineageV01, readCurrentProjectWorkPacketLineageV01 } from "../../lib/vnext/runtime/operator-pilot-project-continuity";

// A separate process consumes the actual captured DB and config. It emits its
// own production result; the parent compares that with the originating read.
for (const {entry,bytes,config} of readProjectWorkCaptures()) {
  if(!entry.case_id.startsWith("read-"))continue;
  const db=new Database(bytes);
  try {
    const before=db.serialize();
    let result: unknown, refusal: string|null=null;
    try { result=readCurrentProjectWorkPacketLineageV01(db,config); }
    catch(error){refusal=error instanceof Error?error.message:String(error);assert.match(refusal,/fingerprint|mismatch|conflict|invalid|drift/);}
    let standalone="not_applicable";
    const selector=entry.selector??(result as {packet?:{packet_id:string;integrity:{fingerprint:string}}})?.packet;
    if(selector?.packet_id) {
      try { inspectVNextOperatorPilotPacketLineageV01(db,{config,packet_id:selector.packet_id,packet_fingerprint:selector.packet_fingerprint??selector.integrity.fingerprint});standalone="available"; }
      catch(error){assert.match(error instanceof Error?error.message:String(error),/fingerprint|mismatch|conflict|invalid|drift/);standalone="refused";}
    }
    assert(before.equals(db.serialize()));assert.equal(db.inTransaction,false);
    console.log(JSON.stringify({fresh_process_read:entry.case_id,input_sha256:entry.uncompressed_sha256,config_sha256:entry.config.sha256,
      outcome:refusal?"refused":result===null?"empty":"available",standalone,writes:0,result:result??null}));
  } finally {db.close();}
}
