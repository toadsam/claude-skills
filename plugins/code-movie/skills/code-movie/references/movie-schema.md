# 각본(영화 한 편) 모양

작업 폴더는 영화 여러 편을 모은 **극장**이다.

```
<작업폴더>/
  theater.json          { title, subtitle, intro, movies: [{ file: "movies/<id>.json", group: "묶음 이름" }] }
  movies/<id>.json      영화 한 편(아래 모양)
  out/movie.html        build 결과 — 극장 첫 화면에서 영화를 고른다
```
(영화가 한 편뿐이면 `movie.json` 하나만 있어도 된다.)

예시: 이 스킬의 `example/workspace/movie.json` (할 일 앱, 9장면 · 동작 28개 · 방 3개). 헷갈리면 그 파일을 연다.

```jsonc
{
  "id": "translate", "icon": "💬",
  "title": "○○ 영화", "story": "한 줄 부제(어떤 값의 여행인지)", "subtitle": "극장 카드 설명",
  "key": "<프로젝트>-<흐름>",          // 브라우저에 본 장면을 저장하는 키. 영화마다 달라야 하고, 바꾸지 않는다
  "repo": "저장소 절대 경로(또는 이 파일 기준 상대 경로)",
  "intro": "재생 전 자막",
  "stage": {
    "nodes": [ { "id": "app", "kind": "app|server|db|ext|ai|tool", "icon": "📱", "name": "앱", "sub": "폴더 · 기술",
                 "x": 30, "y": 190, "w": 260, "h": 400,           // 무대는 1200×660. 상자끼리 겹치지 않게
                 "zoom": { "x": 16, "y": 200, "w": 236, "h": 390 },  // 확대할 때의 배치(선택, 방이 있는 상자는 필수)
                 "button": "번역" } ],                              // app 상자 화면의 기본 버튼 글자
    "roomsIn": "server",                 // 방을 품는 상자 하나(선택)
    "rooms": [ { "id": "ctrl", "n": 1, "name": "접수처", "sub": "클래스 · 파일 이름" } ],   // 최대 6개, 3×2 로 자동 배치(앞 3개가 윗줄)
    "links": [["app", "server"]]
  },
  "terms": { "http": { "name": "HTTP 요청", "say": "쉬운 풀이 (**굵게** · `코드` 가능)" } },
  "scenes": [ {
    "id": "press", "title": "타임라인 제목(18자 이하)",
    "say": "장면 첫 자막 — 한두 문장, 140자 이하, 코드 용어 없이",
    "explain": "오른쪽 패널의 긴 설명(3~5문장)",
    "carry": "지금 들고 다니는 값",
    "terms": ["http"],
    "actions": [ { "do": "…", "say": "이 동작이 시작될 때 자막(선택)", "after": 600 } ],
    "code": [ { "file": "저장소 기준 경로", "lines": [638, 647], "why": "이 줄이 무엇을 하는지 한 줄" } ]
  } ],
  "ending": { "title": "한 번에 정리", "say": "…", "points": ["4~6개"], "links": [{ "name": "코드 리더에서 읽기", "url": "…" }] }
}
```

kind 색: app 파랑 · server 보라 · db 주황 · ext 초록(바깥 서비스) · ai 분홍(모델) · tool 회색(도구 · 스크립트 · 뷰어).

## 카드 종류 (`show` 에 하나만)

| 값 | 모양 |
|---|---|
| `text: "글자"` | 글자 카드 |
| `chips: ["지하철역", "있/형용사"]` | 칩(단어 · 토큰) 줄. `/` 뒤는 작은 글씨 |
| `fields: [["uid", "a1b2…"], ["nickname", "토끼"]]` | 문서 카드(Firestore 문서 · JSON · 설정). 키: 값 줄 |
| `grid: { "rows": 139, "cols": 125, "label": "[139, 125, 3]", "holes": 0.1, "hl": [3, 7] }` | 숫자 배열 그림. 칸은 최대 10×20 개만 그리고(실제 크기는 label 로), `holes` 비율만큼 빈칸(빨강), `hl` 은 강조할 칸 번호(그린 칸 기준) |
| `pose: { "label": "프레임 1" }` | 사람 모양(상체 13 · 양손 42 · 얼굴 70 = 125점) 그림. 실제 좌표가 아니라 설명용 |

## 동작 (`do`)

위치(`at` · `to` · `node`)는 상자 id 또는 `room:<방 id>`. 방은 `zoom` 한 뒤에만 쓸 수 있다.
카드 위치는 대상 가운데 + `dx` · `dy`(같은 곳에 카드가 여럿이면 dy 로 띄운다. 카드 높이는 50~70).

| do | 값 | 하는 일 |
|---|---|---|
| `focus` | node | 상자 · 방 하나를 밝힌다 |
| `zoom` / `unzoom` | — | 방을 품은 상자를 키워 방을 보여 준다 / 되돌린다(방 안의 카드는 상자 가운데로) |
| `screen` | node, title?, items?[], input?, button? | app 상자 화면을 바꾼다(제목 · 목록 · 입력칸 · 버튼). 예: 로그인 화면, 퀴즈 문제 |
| `type` | node, text | app 화면 입력칸에 글자를 한 자씩 친다 |
| `press` | node, label? | 버튼(또는 label 글자가 같은 목록 항목)을 누른다 |
| `show` | card, at, (카드 종류 하나), tag?, dy?, dx? | 카드를 만든다 |
| `move` | card, to, label?, dy?, dx? | 카드가 곡선을 그리며 날아간다. label 은 겉봉 글자(`POST /translate`) |
| `chips` | card, value[] | 카드를 칩들로 바꾼다 |
| `swap` | card, value[], mark[] | 칩 글자를 바꾼다. mark 의 칩이 뒤집히며 강조 |
| `drop` | card, idx[] | 그 칩들이 떠올라 사라지고 나머지가 붙는다 |
| `order` | card, value[], mark[]? | 같은 칩들의 순서를 바꾼다(칩이 실제로 자리를 옮김) |
| `field` | card, fields[], mark?[] | 문서 카드의 줄을 바꾼다. mark 의 줄 번호가 강조(새로 생긴 줄 · 바뀐 값) |
| `regrid` | card, rows?, cols?, label?, holes?, hl?[] | 배열 그림의 모양을 바꾼다(줄어들기 · 늘어나기 · 빈칸 메우기 · 강조) |
| `posefx` | card, fx, ms? | 사람 모양 효과: `jitter` 떨림 · `calm` 떨림이 가라앉음 · `fix` 손가락 길이 고정 · `center` 가운데로 맞추고 크기 맞춤 · `sign` 손을 움직여 수어 · `ghost` 반투명(복원본) |
| `tag` | card, text?, badge?, small? | 카드 위 이름표 · 아래 배지 |
| `text` | card, value | 카드를 글자 하나로 되돌린다 |
| `wait` | node, ms, text | 상자에 ‘기다리는 중’ 표시(바깥 서비스 · 학습 기다림) |
| `score` | card, hits[0/1], text | 칩마다 ✅/❌ 와 배지. hits 개수 = 칩 개수 |
| `pick` | card, others[] | 이긴 카드에 👑, 나머지는 흐리게 |
| `clear` | card | 배지 · 👑 · 표시를 지운다 |
| `remove` | cards[] | 카드를 없앤다 |
| `note` / `unnote` | text, at, dy, ms?, id / id | 말풍선(ms 가 있으면 그 뒤 사라짐) |
| `fetch` | card, to, ask, back, label, wait, waitText, mark | 칩 하나씩 작은 카드가 `to` 에 다녀오고 칩에 mark 가 붙는다(`{w}` = 칩 글자) |
| `play` | node, words[], clip, says[] | app 화면에서 영상 칸 A · B 를 번갈아 쓰며 이어 재생 |
| `say` | text, ms? | 자막만 바꾸고 ms 만큼 기다린다 |
| `pause` | ms | 그냥 기다린다 |

## 쓰는 요령

- 장면 하나 = 자막 한두 문장 + 동작 3~10개 + 코드 근거 1~4개. 영화 한 편은 10~14장면.
- 같은 값이 계속 이어지는 것이 영화의 힘이다. 첫 장면에서 만든 카드(예: 사용자의 문장, 클립 하나)를 끝까지 들고 간다.
- 실제 실행 값이 아니면(바깥 서비스 답 · 학습 결과 숫자를 모를 때) note 나 자막에 **예시** 라고 쓴다.
  저장소 · 기록에 실제 숫자가 있으면(예: 실험 로그) 그 숫자를 쓴다.
- 자막에는 함수 · 클래스 이름을 쓰지 않는다. 이름은 방 sub, 상자 sub, 코드 패널(why)에만.
- 원문자(①②…)는 쓰지 않는다. 비밀 값(키 · 토큰 · 실제 개인 정보)은 싣지 않는다 — 토큰은 `eyJ…(가림)` 처럼.
