export const storyOriginal = `세계의 사실 — 작가가 정한 설정: 황제는 살아 있다.

공식 발표: 궁정은 “황제가 죽었다”고 알렸다. 발표는 세계의 사실과 같지 않다.

인물의 믿음: 기사 하린은 그 발표를 믿는다. 아직 황제를 보지 못했다.

미정인 작가의 의도: 황제가 나중에 돌아오는 전개를 고려 중이다. 채택하지 않았다.

원문 표기: café / é ≠ é / 한글 🧭
문단과 공백을 보존한다. <script>fiction only</script>`;
export const storyRevised = storyOriginal.replace('채택하지 않았다.', '아직 결정하지 않았다. 재등장 시점도 열어 둔다.');
export const storyMarker = {name:'augnes-story-worldbuilding.v1.json',role:'other',data:Buffer.from(JSON.stringify({format:'augnes_story_worldbuilding.v1',primary_file:'manuscript.txt'})).toString('base64')};
export const storyUpload = text => ({name:'manuscript.txt',role:'source',data:Buffer.from(text).toString('base64')});
