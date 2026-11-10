export const sceneFixture={title:'봉인의 밤',viewpoint:'하린',event_time:2,reveal_order:1,source_names:['manuscript.txt'],draft:'하린은 궁정의 부고를 접어 품에 넣었다.\n\n문지기가 전한 봉인된 편지는 차가웠다. 하린은 봉인을 뜯지 않고 등불을 낮추었다.',proposals:[
 {kind:'fact',subject:'작가',text:'황제는 살아 있다.',event_time:0,reveal_order:0},
 {kind:'assertion',subject:'궁정',text:'궁정은 황제가 죽었다고 발표했다.',event_time:0,reveal_order:0},
 {kind:'belief',subject:'하린',text:'하린은 궁정의 부고를 믿는다. 황제를 아직 보지 못했다.',event_time:0,reveal_order:0},
 {kind:'knowledge',subject:'하린',text:'하린은 봉인된 편지를 받았다. 아직 열지 않았고 내용은 모른다.',event_time:2,reveal_order:1},
 {kind:'intention',subject:'작가',text:'황제의 훗날 공개 귀환은 아직 결정하지 않았다.',event_time:10,reveal_order:10},
 {kind:'knowledge',subject:'하린',text:'지금 편지를 열어 황제의 생존을 즉시 알게 한다.',event_time:2,reveal_order:1}
]};
export const sceneChoices=['adopted','adopted','adopted','adopted','undecided','rejected'];
export const sceneReason='합성 창작자의 선택: 부고와 믿음을 구분하고, 봉인된 편지의 수령만 진행한다. 귀환과 폭로는 확정하지 않는다.';
export const deterministicSuccessor='하린은 품 안의 봉인이 눌리지 않도록 외투를 여몄다.\n\n부고를 읽은 이들의 발소리가 복도를 메웠다. 그는 편지의 무게만 느끼며, 누구에게 먼저 물어야 할지 생각했다.';
