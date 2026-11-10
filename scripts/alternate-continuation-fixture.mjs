// Frozen C example: retroactive reinterpretation at event 2 / reveal 1,
// not a later opening event. Earlier rejection and primary knowledge survive.
export const alternateReason='합성 작가의 대안: 같은 밤의 선택을 소급 재해석한다. 원래 갈래의 봉인과 거절은 보존한다.';
export const bell='안뜰의 종은 새벽마다 한 번 울린다.';
export const alternateDraft='하린은 봉인을 열었다. 접힌 종이에는 황제가 살아 있다는 전갈이 있었다.\n\n안뜰의 종이 새벽을 알렸다. 공개 귀환의 날은 아직 누구도 정하지 않았다.';
export function alternateScene(origin,sceneId){return {title:'봉인을 연 밤 — 대안',viewpoint:'하린',event_time:2,reveal_order:1,source_names:['manuscript.txt'],draft:alternateDraft,proposals:[
 {kind:'knowledge',subject:'하린',text:'이 대안에서 하린은 봉인을 열어 황제가 살아 있음을 알았다.',event_time:2,reveal_order:1,revises:[3,5].map(proposal=>({work_id:origin,scene_id:sceneId,proposal})),requires:[]},
 {kind:'fact',subject:'안뜰',text:bell,event_time:1,reveal_order:1},
 {kind:'intention',subject:'작가',text:'황제의 공개 귀환 날짜는 계속 미정이다.',event_time:10,reveal_order:10}
]};}
export const primarySuccessor='새벽 종소리가 안뜰을 건넜다. 하린은 아직 봉인된 편지를 품에 넣었다.\n\n부고를 전하던 목소리가 떠올랐지만, 종이 안쪽의 말은 알 수 없었다.';
export const alternateSuccessor='안뜰의 종이 울리자 하린은 펼쳐 둔 전갈을 다시 접었다. 황제가 살아 있다는 문장이 또렷했다.\n\n그 사실을 누구에게 전할지는 아직 정하지 않았다.';
