# 작업 폴더 JSON 모양

예시는 모두 이 스킬의 `example/workspace/` 에 실물이 있다(할 일 앱). 헷갈리면 거기서 하나 열어 본다.

## §1 config.json

```json
{
  "name": "todo-app",
  "title": "할 일 앱 코드 읽기",
  "subtitle": "저장소의 실제 파일 그대로 · 줄을 누르면 해설, 밑줄 단어를 누르면 사전",
  "repo": "../repo",                                  // 절대 경로 또는 작업 폴더 기준 상대 경로
  "artifactUrl": "",                                  // 처음 올린 뒤 채운다
  "publishFiles": { "docs/screenshots/home.png": "docs/screenshots/home.png" },  // 페이지 경로 → 저장소 기준 경로 (화면 스타일 지도의 이미지 등)
  "mask": [{ "re": "my-secret-[0-9]+", "flags": "g", "with": "<가린 값>" }],     // 선택: 추가로 가릴 것
  "flows": [
    { "id": "add", "name": "할 일 추가 흐름", "icon": "➕", "section": "기능",
      "order": [
        ["화면", "web/src/TodoList.tsx"],
        ["서버 입구", "server/src/app.ts"],
        ["긴 파일은 구간으로", "server/src/bigFile.ts", 120, 260, "bigFile.ts ② 저장"]
      ] }
  ],
  "ui": { … §7 … }
}
```

- `order` 한 칸 = `[그룹, 저장소 기준 경로, from?, to?, 목록 이름?]`. from/to 를 주면 그 구간만(원래 줄 번호 유지).
- 같은 파일 · 같은 구간을 두 흐름에 넣어도 된다(해설은 하나를 같이 쓴다).
- 흐름 순서 = 홈과 탭에 보이는 순서. `section` 이 같은 흐름끼리 홈에서 묶인다.

## §2 annot/*.json — 해설

파일 하나에 여러 항목을 배열로 담는다. 항목 하나 = order 의 한 칸.

```json
[{
  "file": "web/src/api.ts",
  "from": 1, "to": 120,                 // 구간 항목일 때만. 전체 파일이면 생략
  "key": "web/src/api.ts@1",            // update.js 가 붙임. 지우지 않는다(읽음 기록이 이어짐)
  "oneLine": "이 파일이 하는 일을 한 문장으로",
  "role": "흐름 안에서의 역할 · 누가 부르고 무엇을 부르는지 · 왜 필요한지 3~5문장",
  "calls": ["base-url.ts"],             // 이 파일이 쓰는 것 (파일 이름이면 칩이 링크가 된다)
  "calledBy": ["TodoList.tsx"],         // 이 파일을 쓰는 곳
  "blocks": [
    {
      "start": 11, "end": 19, "title": "addTodo — 할 일 하나 추가", "kind": "method",
      "explain": "첫 문장은 요약(굵게 보임). 그다음 문장들이 글머리표가 된다.",
      "sig": { "in": "title(string)", "out": "Promise<Todo>" },   // 함수면
      "lines": { "12": "줄 해설", "17": "주의: 직접 확인한 문제만" }
    }
  ]
}]
```

검사 규칙(`check.js`): 덩어리가 구간 첫 줄부터 끝 줄까지 **빈틈 · 겹침 없이** 이어진다. `lines` 의 줄 번호는 그 덩어리 안. `[[id]]` 는 terms.json 에 있어야 한다. 빈 줄 · 괄호만 있는 줄 · import · 주석 줄을 뺀 **모든 코드 줄에 줄 해설**이 있어야 좋다("줄 해설 없는 코드 줄" 수를 0 가깝게). `kind`: header · field · constructor · method · type · other.
업데이트 뒤에는 `review` 칸이 붙을 수 있다 — 다 고친 뒤 지운다.

## §3 tours/<흐름>.json — 흐름 따라가기

```json
{ "flow": "add", "tours": [{
  "id": "add-milk", "name": "'우유 사기'를 추가하기",
  "summary": "누가 무엇을 눌렀을 때부터 어디까지 따라가는지 2~3문장",
  "lanes": [{ "id": "app", "name": "웹 화면" }, { "id": "server", "name": "API 서버" }, { "id": "db", "name": "메모리 db" }],
  "steps": [{
    "lane": "app", "file": "web/src/api.ts", "lines": [11, 16],
    "title": "api.ts 가 POST /todos 를 보내요",
    "say": "이 단계에서 일어나는 일. 줄 번호를 짚으며 2~4문장. [[fetch]] 처럼 용어 링크",
    "carry": "다음 단계로 넘어가는 데이터를 구체적인 값으로",
    "carryShort": "POST /todos {title}"
  }]
}]}
```

- lane id 는 아이콘이 정해져 있다: app phone server google db ext storage data common prep vq gen recog view ml build. 그 밖은 구름 아이콘.
- `file` 이 없는 단계 = 저장소 밖(외부 API, DB 안, 디스크 파일). lanes 는 2개 이상.
- `lines` 는 그 흐름에 실제로 보이는 구간 안, 덩어리 2개 이하에 걸치게. `carryShort` ≤ 26자. 마지막 단계는 carry 생략 가능.
- 이야기 하나 12~28단계. 구체적인 예시 값(실제 입력, 실제 id)을 끝까지 들고 간다.

## §4 terms.json · glossary/*.json — 사전

```json
// terms.json: 코드에서 밑줄 칠 위치
[{ "id": "fetch", "label": "fetch", "lang": "ts", "patterns": ["\\bfetch\\b"] }]
```
`lang`: java · ts · py · conf · md · both(java+ts). 패턴은 JS 정규식 문자열(역슬래시 두 번). 너무 넓으면 엉뚱한 곳에 밑줄이 생긴다.

```json
// glossary/<묶음>.json: id → 설명
{ "fetch": { "name": "fetch", "group": "HTTP",
  "what": "무엇인지 1~2문장", "why": "왜 쓰는지 · 없으면 어떻게 되는지",
  "example": "짧은 예시 코드", "exampleNote": "예시 설명",
  "here": "이 저장소에서 쓰인 곳 — 파일:줄 과 함께", "related": ["http-method"] } }
```
`group` 이 사전 탭의 묶음이 된다(아이콘은 엔진 기본값 + `ui.groupIcons`).

## §5 review.json — 프로젝트 평가

```json
{ "summary": "4~5문장 요약",
  "sections": [
    { "id": "good", "title": "잘된 점", "items": [{ "title": "", "detail": "", "flow": "add", "evidence": [{ "file": "…", "lines": [10, 30] }] }] },
    { "id": "weak", "title": "부족한 점", "items": [{ "title": "", "detail": "", "severity": "높음|중간|낮음", "owner": "서버 담당", "fix": "고치려면", "effort": 0, "flow": "add", "evidence": [] }] },
    { "id": "key",  "title": "꼭 알아야 할 점", "items": [ … ] }
  ],
  "areas": [{ "id": "sec", "ic": "🔐", "name": "보안", "grade": "good|mid|bad", "say": "한 줄 이유", "refs": ["weak:1", "good:0"] }],
  "requests": [{ "owner": "서버 담당", "folder": "server/", "items": ["무엇을 왜 (파일:줄)"] }] }
```
`effort`: 0 쉬움 · 1 보통 · 2 어려움 (우선순위 표의 가로축). `refs` 는 `섹션id:번호(0부터)`. areas 가 없으면 성적표가 숨는다.

## §6 map-*.json — 프로젝트 지도 (없으면 그 칸이 숨는다)

- `map-env.json`: `{ summary, deploy: [{ id, icon?, title, trigger, steps: [""], result, evidence: [{file, lines}] }], vars: [{ name, side, required: "필수|선택", default: "없음|개발용 기본값 있음|일반 기본값 있음(…)", purpose, usedBy, ifMissing, readAt: [{file, lines}] }], notes: [""] }` — **값은 절대 싣지 않는다.**
- `map-data.json`: `{ summary, dbName?, storageName?, firestore: [{ path, what, fields: [{ name, type, example, meaning, note?, writtenBy: [], readBy: [] }], children: [ … ] }], storage: { what, folders: [{ path, example, what, usedBy }] }, local: [{ path, shape, what, usedBy }], notes: [] }` — `firestore` 칸 이름은 역사적인 것이고 "DB 컬렉션 · 테이블 나무"라는 뜻으로 어떤 DB 든 쓴다(`dbName` 으로 이름을 바꾼다).
- `map-history.json`: `{ summary, stats: { commits, first, last, byAuthor: [{ name, commits, mainAreas }] }, phases: [{ title, period: "YYYY-MM-DD ~ YYYY-MM-DD", summary, flow?, items: [{ date, hash, author, title, what }] }], lessons: [""] }` — 주별 커밋 그래프는 build.js 가 `git log` 로 직접 만든다(저장소 폴더가 git 저장소 맨 위일 때만).
- `map-style.json`: `{ summary, palette: [{ color, name, usedFor, where: [] }], rules: [""], screens: [{ id, title, image, file, marks: [{ n, x, y, label, style, jsx: [a, b], lines: [a, b], props, explain }] }] }` — x · y 는 이미지 안 % 좌표. image 는 `config.publishFiles` 로 같이 올린다.

## §7 config.ui — 프로젝트마다 다른 화면 설정

```json
{
  "ownPackages": ["com.example.app"],            // 자바 import 를 "우리 프로젝트"로 부를 패키지
  "ownPyModules": ["common", "prep"],            // 파이썬 import 를 "우리 프로젝트"로 부를 모듈
  "pathShort": [["backend/src/main/java/com/example/app/", "backend/…/app/"]],
  "fileRoots": [["web/", "웹 화면", "app"], ["server/", "API 서버", "server"], ["", "저장소 맨 위", "build"]],   // 파일 지도의 뿌리 [접두어, 이름, lane 아이콘]
  "dataFlows": ["ml"], "dataNote": "코드 밖 단계 설명",   // 저장소 밖 단계를 '데이터 파일'로 부를 흐름
  "owners": [{ "name": "서버 담당", "label": "server/", "match": ["server/", "^tools/(db|migrate)/"] }],   // 위에서부터 첫 일치. "^" 로 시작하면 정규식, 아니면 접두어. "" 는 나머지 전부
  "ownerDefault": "팀",
  "groupIcons": { "서버(Express)": "🚂" },
  "arch": {
    "title": "한 장으로 보는 할 일 앱", "viewBox": "0 0 1000 380",
    "bands": [{ "x": 12, "y": 12, "w": 976, "h": 356, "label": "지금 돌아가는 부분", "lx": 30, "ly": 352, "cls": "b1" }],
    "groups": { "front": "웹 화면", "back": "API 서버", "data": "저장", "ext": "사람" },
    "nodes": [{ "id": "web", "x": 250, "y": 120, "w": 200, "h": 116, "ic": "🖥️", "t": "웹 화면", "s": "web/ · React", "sub2": ["TodoList.tsx"], "g": "front",
                "files": ["web/"], "flows": ["add"], "what": "설명 2~3문장" }],
    "edges": [{ "id": "web_srv", "a": "web", "b": "server", "l": "fetch", "cp": [x, y], "plan": false }],
    "scenarios": [{ "id": "add", "ic": "➕", "n": "할 일 추가", "flow": "add",
                    "steps": [{ "e": "web_srv", "rev": false, "say": "<code>POST /todos</code> 로 …" }, { "n": "web", "say": "상자만 밝힐 때" }] }]
  }
}
```
구조 그림 좌표: viewBox 안 px. 상자끼리 겹치지 않게, 선 이름표(l)는 짧게(5~8자). `cp` 는 휘는 선의 조절점. `g` 색: front 파랑 · back 보라 · data 초록 · ext 회색 · deploy 주황 · tool 청록 · ml 분홍. 재생 단계의 API 주소 · 동작은 반드시 코드에서 확인한다. arch 가 없으면 지도 탭의 "전체 구조" 칸이 숨는다.
