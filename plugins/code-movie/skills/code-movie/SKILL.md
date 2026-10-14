---
name: code-movie
description: Turn one important flow of the user's repository into a Korean animated "코드 영화" HTML Artifact — app · server · DB boxes on a stage, the real example value (e.g. the user's sentence) travelling between them as a card, splitting into word chips, being reordered, sent to external services, scored, and finally shown on screen, with plain-language subtitles, play/pause/speed/scene timeline, and a collapsible "이 장면의 진짜 코드" panel that shows the exact file:line excerpts read from the repo at build time. For beginners who cannot read code yet. Use when the user asks to visualize/animate a feature or code flow, "애니메이션으로 보여줘", "영화처럼", "그림으로 이해하고 싶어", "코드 영화", or wants to understand what happens when a button is pressed without reading code. Not for line-by-line reading (code-reader), interview prep (project-haeseolseo), or whole-architecture audits (codebase-anatomy).
---

# 코드 영화 (code-movie)

코드를 아직 못 읽는 사람이 **중요한 흐름 하나를 그림이 움직이는 걸 보며** 이해하게 만드는 페이지.
예시: 이 스킬의 `example/` — 아주 작은 할 일 앱(`example/repo/`)과 그 영화 한 편(`example/workspace/movie.json`, 9장면).
모양이 헷갈리면 그 각본을 열어 보고, `node ${CLAUDE_SKILL_DIR}/engine/build.js ${CLAUDE_SKILL_DIR}/example/workspace` 로 직접 만들어 본다.
처음 만든 진짜 극장이 생기면 그 작업 폴더와 URL 을 메모리에 남겨 다음부터 기준으로 쓴다.

## 결과물이 남는 곳

결과물은 **Artifact**(claude.ai 의 비공개 페이지)다. 원본은 다른 스킬과 같은 프로젝트 폴더에 둔다.

```
~/.claude/study-my-code/<프로젝트>/
  links.json      결과물 URL 모음 — 발행하면 "movie": { "url", "title", "movies": [영화 id…] } 를 채운다
  movie/          theater.json(극장 목록) · movies/<id>.json(각본 한 편씩) · out/movie.html · shots/
```
분석하는 저장소 안에는 아무것도 쓰지 않는다. 흐름을 하나 더 만들면 `movies/<id>.json` 을 쓰고 theater.json 에 한 줄 더한다 — 같은 URL 하나에 영화가 쌓인다.

## 구성

- **엔진** (`engine/`, 프로젝트와 무관): `template.html`(무대 · 재생기 전체), `build.js`, `check.js`, `smoke.js`, `shot.js`, `lib.js`
- **각본** `movies/<id>.json` 만 프로젝트마다 쓴다(영화가 여러 편이면 극장 첫 화면에서 고른다). 그림 코드(HTML/CSS/JS)는 쓰지도 고치지도 않는다.

```bash
node <스킬>/engine/check.js <작업폴더>   # 상자 · 방 · 카드 · 동작 · 코드 근거(파일 · 줄 범위) 검사 → 「문제 없음」
node <스킬>/engine/build.js <작업폴더>   # 코드 근거 줄을 저장소에서 그대로 읽어 넣고 out/movie.html
node <스킬>/engine/smoke.js <작업폴더> [영화 번호]   # 영화마다 모든 장면 건너뛰기 + 처음부터 끝까지 재생 → 「smoke done」
node <스킬>/engine/shot.js  <작업폴더> m8 "await MOVIE.openMovie(0); await MOVIE.goto(7,{end:true})" 1400 900   # 1번 영화 8번 장면 끝 모습
```
`<스킬>` 은 이 SKILL.md 가 있는 폴더 `${CLAUDE_SKILL_DIR}` 이다(플러그인이 아니라 `~/.claude/skills/code-movie/` 에 직접 두었다면 그 경로).
Node.js 18 이상이 필요하고, smoke.js · shot.js 는 Chrome 이나 Edge 를 쓴다(`CHROME` 환경변수로 경로를 알려 줄 수 있다).
각본의 `repo` 는 저장소 절대 경로나 각본 파일 기준 상대 경로로 쓴다. 페이지에는 싣지 않는다.
headless Chrome 은 애니메이션 시계가 흐르지 않는다. 그래서 사진은 `goto(i,{end:true})`(장면 끝 모습)로 찍고,
재생 검사는 smoke.js 가 시계를 직접 밀어서 한다. 사진은 확인 후 지운다. Chrome 을 taskkill 로 끄지 않는다.

## 순서

1. **흐름 고르기**: 사용자에게 "버튼 하나를 눌렀을 때" 수준의 핵심 흐름 1~3개를 제안하고 하나를 고르게 한다.
   code-reader 작업 폴더에 `tours/<흐름>.json` 이 있으면 그 이야기(이미 줄 단위로 확인됨)를 뼈대로 쓴다.
   없으면 진입점부터 실제 파일을 끝까지 따라가며 단계 목록(파일:줄 · 무엇 · 들고 가는 값)을 먼저 만든다.
2. **무대 정하기**: 상자는 사용자가 정한 종류(app · server · db · ext)만. 서버 안의 클래스는 **방**(rooms, 최대 6개, 3×2)으로.
3. **장면 쓰기**: 단계 15~25개를 장면 10~14개로 묶는다. 장면 하나 = 자막 한두 문장 + 동작 3~10개 + 코드 근거 1~4개.
   동작 목록과 값 모양은 `references/movie-schema.md`.
4. **검사 → 빌드 → smoke → 영화마다 사진 2~3장 눈으로 확인**(겹침 · 글자 깨짐 · 카드가 방 밖으로).
   영화가 여러 편이면 각본은 하위 에이전트에게 나눠 맡겨도 된다: 이 SKILL.md · schema · 예시 각본 · code-reader 이야기를 주고, 저장소는 읽기만, check.js 「문제 없음」까지.
5. **올리기**: `Artifact` 로 `out/movie.html` publish(아이콘 `movie`). URL 을 `links.json` 과 메모리에 남긴다.
   다시 만들 때는 같은 파일 경로 / 같은 URL 로 publish 한다(본 장면 기록이 `codemovie.<key>` 로 브라우저에 남는다).

## 지킬 것

1. **그림은 쉬워도 사실은 코드 그대로.** 장면의 모든 주장에는 `code` 근거(파일 · 줄)가 있어야 하고, 줄은 실제로 열어 확인한다.
   값이 실제 실행 결과가 아니라 예시면(바깥 서비스 답 등) 자막이나 note 로 **「예시」** 라고 밝힌다.
2. **자막은 코드 용어 없이.** 클래스 이름 · 함수 이름은 자막이 아니라 방 이름 아래(sub)와 코드 패널에만. 꼭 필요한 말은 `terms` 로 풀이한다.
3. **비유는 상자 · 편지 · 방 · 창고 정도로 가볍게.** 캐릭터 이야기를 지어내지 않는다. 비유가 코드와 어긋나면 비유를 버린다.
4. **코드를 읽어야 보이는 중요한 점**(예: 공들인 규칙 결과가 동점 규칙 때문에 버려짐)은 숨기지 말고 장면 하나를 쓴다.
5. 원문자(①②…)는 쓰지 않는다 — 글꼴에 따라 ⊙ 로 깨진다. 숫자가 필요하면 방의 `n`.
6. 비밀 값(키 · 토큰 · 개인 주소)을 카드 · 자막 · 코드 근거에 싣지 않는다. 근거 줄에 키가 있으면 다른 줄을 고른다.
