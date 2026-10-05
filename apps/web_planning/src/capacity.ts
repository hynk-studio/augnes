import { inspectInitialProjectWorkDefinitionV01 } from "../../../lib/intake/work-definition";
import { buildSelectedWorkSourceEntry, inspectSelectedWorkSources, SELECTED_WORK_SOURCE_LIMITS } from "../../../lib/intake/selected-work-source-comparison";
import { INITIAL_PROJECT_WORK_LIMITS_V01 } from "../../../types/vnext/project-work-initialization";
import { canonical, exact, headBinding, HISTORY_READ_BYTES, HISTORY_READ_ROWS, RELATION_BYTES, REQUEST_BYTES, type Payload, type Revision, type Scope } from "./contract";
import { inspectEditedPayload } from "./relations";

export const CAPACITY_FORMAT = "web_planning_capacity.v0.2";
export const canonicalBytes = (value: unknown) => new TextEncoder().encode(canonical(value)).byteLength;
const textBytes = (text: string) => canonicalBytes(text) - 2; // JSON string content, including escapes
const code = (error: unknown) => {
  const value = (error as {code?: string})?.code;
  return value && /^[a-z_]+$/.test(value) ? value : "invalid_planning_material";
};
const quantity = (used: number | null, limit: number) => ({used,limit,remaining:used===null?null:limit-used});

/** Read-only accounting. The admission owners still enforce every save limit. */
export function inspectDraftCapacity(scope: Scope, input: {definition: unknown; notes: unknown; material_edits?: unknown}, previous?: Revision) {
  const issues: {code: string; note: number | null}[] = [];
  const issue = (code: string, note: number | null = null) => { issues.push({code,note}); };
  let definition: Payload["definition"] | undefined, definitionBytes: number | null = null;
  try {
    exact(input.definition,"goal,success_criteria,non_goals");
    const inspected=inspectInitialProjectWorkDefinitionV01(input.definition as any);
    definition=inspected.definition;definitionBytes=inspected.bytes;
    if(definitionBytes>INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes)issue("first_work_definition_too_large");
  } catch(error) { issue(code(error)); }

  const notes=Array.isArray(input.notes)?input.notes:null;
  const rows: {characters: number | null; source_units: number | null; bytes: number | null; text_bytes: number | null; duplicate_of: number | null}[]=[];
  let selectionBytes: number | null=null, selectedTextBytes: number | null=null, sourceCount: number | null=null;
  let sources: Payload["sources"] | undefined;
  if(!notes || notes.length>SELECTED_WORK_SOURCE_LIMITS.entries)issue("whole_note_limit");
  else {
    const entries: Payload["sources"]=[], seen=new Map<string,number>();
    for(const [index,note] of notes.entries()) {
      const row={characters:typeof note?.text==="string"?[...note.text].length:null,
        source_units:typeof note?.source==="string"?note.source.length:null,
        bytes:null as number|null,text_bytes:null as number|null,duplicate_of:null as number|null};
      rows.push(row);
      try {
        const entry=buildSelectedWorkSourceEntry(scope,note);entries.push(entry);
        row.bytes=canonicalBytes(entry);row.text_bytes=textBytes(entry.bounded_summary!);
        row.duplicate_of=seen.get(entry.entry_id)??null;
        if(row.duplicate_of===null)seen.set(entry.entry_id,index+1);
      } catch(error) { issue(code(error),index+1); }
    }
    if(entries.length===notes.length) {
      const inspected=inspectSelectedWorkSources(scope,entries);
      sources=inspected.entries;selectionBytes=inspected.bytes;sourceCount=sources.length;
      selectedTextBytes=sources.reduce((sum,entry)=>sum+textBytes(entry.bounded_summary!),0);
      if(selectionBytes>SELECTED_WORK_SOURCE_LIMITS.bytes)issue("selected_source_context_budget_exceeded");
    }
  }
  let relationBytes: number | null=null, payload: Payload | undefined;
  if(definition && definitionBytes!==null && definitionBytes<=INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes && sources && notes) {
    try {
      const inspected=inspectEditedPayload(scope,{definition,sources},notes,input.material_edits,previous);
      payload=inspected.payload;relationBytes=inspected.relationBytes;
      if(relationBytes>RELATION_BYTES)issue("relation_budget_exceeded");
    } catch(error) { issue(code(error)); }
  }
  // Draft fit describes planning material, not a reservation for history or
  // file storage. Admission checks the complete proposed history on Save.
  const noop=!!(payload && previous?.relations && canonical(payload)===canonical({definition:previous.definition,sources:previous.sources,relations:previous.relations}));
  return {
    format:CAPACITY_FORMAT, expected:headBinding(previous), fits:issues.length===0 && !!payload, issues,
    notes:quantity(notes?.length??null,SELECTED_WORK_SOURCE_LIMITS.entries), rows,
    note_character_limit:SELECTED_WORK_SOURCE_LIMITS.characters, source_unit_limit:256,
    selection:{...quantity(selectionBytes,SELECTED_WORK_SOURCE_LIMITS.bytes),unique_notes:sourceCount,
      text_bytes:selectedTextBytes,metadata_bytes:selectionBytes===null?null:selectionBytes-selectedTextBytes!},
    definition:quantity(definitionBytes,INITIAL_PROJECT_WORK_LIMITS_V01.definition_bytes),
    relations:quantity(relationBytes,RELATION_BYTES),
    history:{revisions:previous?.revision??0,read_row_limit:HISTORY_READ_ROWS,read_byte_limit:HISTORY_READ_BYTES}, noop, request_byte_limit:REQUEST_BYTES,
  };
}
