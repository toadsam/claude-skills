---
name: code-reader
description: Build (or incrementally update) a Korean "코드 리더" interactive HTML Artifact for one of the user's repositories — the real source files shown verbatim with a Korean note on every code line, block explanations, execution-order "흐름 따라가기" stories across files, a glossary of every built-in/library name the code uses, practice drills (line meaning, block explain, order puzzle, flash cards, daily 5), a project map (architecture diagram with request replay, deploy steps, env vars, data map, commit history, screen styles), and a project review (scorecard, priority matrix, warning heatmap, team request checklist). Use when the user wants to understand/read a codebase line by line without relying on AI, asks for "코드 리더", "줄마다 해설", "코드 읽기 페이지", "흐름 따라가기", "이 저장소를 다 이해하고 싶어", or when the repository changed and they want the reader updated ("코드 바뀐 거 반영해줘", "코드 리더 업데이트"). Update mode re-annotates only changed blocks. Not for interview prep documents (project-haeseolseo) or architecture/defect audits alone (codebase-anatomy).
---

# 코드 리더 (code-reader)

사용자가 **자기 저장소의 코드를 AI 없이 직접 읽고, 어떤 질문에도 답할 수 있게** 만드는 페이지.
예시: 이 스킬의 `example/` — 아주 작은 할 일 앱(`example/repo/`)과 그 작업 폴더(`example/workspace/`).
모양이 헷갈리면 거기 파일을 열어 보고, `node ${CLAUDE_SKILL_DIR}/engine/build.js ${CLAUDE_SKILL_DIR}/example/workspace` 로 직접 만들어 본다.
처음 만든 진짜 페이지가 생기면 그 작업 폴더와 URL 을 메모리에 남겨 다음부터 기준으로 쓴다.

## 구성

- **엔진** (이 스킬 폴더 `engine/`, 프로젝트와 무관): `template.html`(페이지 전체), `build.js`, `update.js`, `check.js`, `checktour.js`, `outline.js`, `smoke.js`, `shot.js`, `lib.js`
- **작업 폴더** (프로젝트마다 하나, `~/.claude/code-reader/<이름>/`): 저장소 밖, 세션이 끝나도 남는다. **저장소 안에는 아무것도 쓰지 않는다.**

```
<작업폴더>/
  config.json        제목 · 저장소 경로 · 흐름(파일 순서) · ui(구조 그림 · 폴더 주인 · 파일 지도 뿌리 …) · artifactUrl
  annot/*.json       파일(또는 구간)마다 해설: 덩어리 · 줄 해설
  tours/<흐름>.json  흐름 따라가기 이야기
  terms.json         코드에서 밑줄 칠 단어(정규식)        glossary/*.json  사전 내용
  review.json        평가(잘된 점 · 부족한 점 · 꼭 알아야 할 점 · 요청 · 성적표 areas · effort)
  map-env.json map-data.json map-history.json map-style.json   프로젝트 지도
  manifest.json      마지막 빌드의 기록표 (커밋 · 파일 내용 · 덩어리 지문) ← 업데이트의 기준
  pending-update.json  마지막 업데이트에서 바뀐 것 (페이지의 "지난번 이후 바뀐 곳")
  worklist.md        업데이트 때 다시 쓸 목록       backup/<시각>/  업데이트 전 사본
  out/code-reader.html  out/data.json      shots/  스크린샷
```

명령은 모두 `node <스킬>/engine/<스크립트> <작업폴더> …` 꼴이다. 여기와 참고 문서의 `<스킬>` 은 이 SKILL.md 가 있는 폴더 `${CLAUDE_SKILL_DIR}` 이다
(플러그인이 아니라 `~/.claude/skills/code-reader/` 에 직접 두었다면 그 경로). Node.js 18 이상이 필요하다.
`config.repo` 는 절대 경로나 작업 폴더 기준 상대 경로로 쓴다.

## 먼저 정할 것: 처음 만들기인가, 업데이트인가

- 작업 폴더에 `manifest.json` 이 있으면 → **업데이트 모드** (아래 B)
- 없으면 → **처음 만들기** (아래 A). 저장소 크기를 보고 흐름 후보를 먼저 말로 제안하고 사용자의 OK 를 받는다.

## 지킬 것 (어기면 페이지가 해롭다)

1. **코드는 저장소 파일 그대로.** 해설은 실제로 연 줄에 대해서만 쓴다. 짐작은 "~로 보여요"로 표시한다.
2. **비밀 값을 싣지 않는다.** `lib.js` 의 `mask()` 가 키 · 토큰 · 클라이언트 ID · `.env*` 값을 가린다. 새 종류가 보이면 `config.mask` 에 `{re, flags, with}` 를 더한다. 대화에도 값을 옮겨 적지 않는다. 올리기 전 `out/code-reader.html` 을 비밀 패턴으로 grep 해서 0건을 확인한다.
3. **저장소를 고치지 않는다.** 찾은 문제는 해설에 `주의:` 로 적고, 평가 탭의 요청 문장으로만 남긴다. 저장소의 CLAUDE.md(폴더 주인 · 계약)를 따른다.
4. **"주의:" 는 직접 확인한 것만.** 에이전트가 찾은 문제는 코드를 열어 확인한 뒤 넣는다. 확인 못 하면 빼거나 "확인 필요"로 쓴다.
5. **한국어 해요체, 쉬운 말.** 독자는 코드를 본 적은 있지만 원리 · 용어를 말로 설명하는 게 약한 사람이다. 자세한 문체 규칙은 `references/writing.md`.
6. **정규식이 든 스크립트는 Write 도구로 쓴다.** 이 환경의 bash heredoc 은 역슬래시를 먹는다.
7. **Chrome 을 강제 종료하지 않는다.** `shot.js` 는 시간 제한으로 자기가 띄운 Chrome 만 끝낸다. `taskkill /IM chrome.exe` 는 사용자 브라우저까지 끈다.

## A. 처음 만들기

1. **둘러보기**: `git ls-files`, README, 진입점(main, 라우터, 화면 목록), 배포 설정. 기능 하나 = 흐름 하나가 되게 6~13개 흐름을 고르고, 흐름마다 "추천 읽기 순서"로 파일을 놓는다. 긴 파일(400줄+)은 `[그룹, 파일, from, to, 이름]` 으로 구간을 나눈다. 스타일 · 설정 · 문서 · 배포 흐름도 따로 둔다(예: 기능별 흐름 + "배포 · 실행", "데이터 · 도구 · 테스트", "문서 · 기록", "화면 스타일").
2. **config.json** 을 쓴다 (`references/schemas.md` §1). 흐름마다 `icon`(이모지) · `section`(홈의 묶음 이름).
3. **해설(annot)**: 흐름별로 에이전트를 병렬로 돌린다(한 번에 4~6개, 파일 3~8개씩). 에이전트 프롬프트에 `references/schemas.md` §2 와 `references/writing.md` 를 그대로 붙인다. 파일마다 `node check.js <ws> annot/<f>.json` 이 OK 이고 "줄 해설 없는 코드 줄"이 거의 0 이어야 받는다.
4. **사전**: 해설의 `[[용어-id]]` 를 모아 `terms.json`(밑줄 정규식) · `glossary/*.json`(무엇 · 왜 · 예 · 이 저장소에서는) 을 만든다. `build.js` 의 "missing glossary 0", `smoke.js` 의 "줄 그리기 불일치 0" 이 기준.
5. `node build.js <ws> --allow-missing` → `node outline.js <ws>` 로 흐름별 덩어리 목록을 만들고, 그걸 보며 **따라가기 이야기**를 쓴다 (§3). `node checktour.js <ws>`.
6. **평가 · 지도**: `review.json`(§5), `map-*.json`(§6), `config.ui.arch` 구조 그림(§7). 모두 근거(file · lines)를 단다. 성적표 · effort 는 "제 판단"임을 페이지가 밝힌다.
7. **검사**: `check.js <ws> --all` → `build.js <ws>` → `checktour.js <ws>` → `smoke.js <ws>` → `shot.js <ws> <이름> "<JS>"` 로 각 탭을 찍어 눈으로 본다(예: `'rHub=true;showTab("read")'`, `'mxSec="arch";showTab("map")'`). 비밀 패턴 grep 0건.
8. **올리기**: `Artifact` 로 `out/code-reader.html` 을 publish. 스크린샷 같은 파일은 `config.publishFiles` 를 `files` 로 같이 보낸다. 받은 URL 을 `config.artifactUrl` 에 적어 둔다. 메모리에도 작업 폴더 위치와 URL 을 남긴다.

## B. 업데이트 (코드가 조금 바뀌었을 때)

**전부 다시 쓰지 않는다.** 해설은 덩어리 지문(fp = 줄 번호와 무관한 코드 내용의 해시)으로 묶여 있어서, 내용이 같은 덩어리는 줄 번호만 옮기고 그대로 쓴다. 자세한 원리는 `references/update.md`.

1. `node update.js <ws> --dry` 로 규모를 본다 → `node update.js <ws>`
   - 내용 같은 덩어리: 줄 번호 · 줄 해설 자동 이동 (AI 필요 없음)
   - 바뀐 덩어리: annot 의 block 에 `"review": {status, newLines, deletedLines, droppedNotes}` 가 붙음
   - 따라가기 단계: 줄 이동, 바뀐 코드면 step 에 `"review"`
   - 부분 구간(from~to)도 옮김. 구간 이름(key)은 처음 것을 유지해 읽음 기록이 이어진다
   - 새 파일 · 지운 파일 · 이름 바뀐 파일 목록 (git 있을 때)
2. `worklist.md` 를 읽는다. **바뀐 비율이 30% 넘으면** 사용자에게 "이 흐름은 처음부터 다시 만들까요?"를 먼저 묻는다.
3. `review` 붙은 덩어리만 다시 쓴다: 코드를 열어 `explain` · `title` · `sig` 를 맞추고, `newLines` 에 줄 해설을 쓰고, 새 줄이 많으면(`split`) 덩어리를 나눈다(덩어리는 빈틈없이 이어져야 함). 끝나면 `review` 를 지운다.
4. 따라가기 단계의 `say` · `carry` 를 확인하고 `review` 를 지운다. 새 파일을 흐름에 넣을지 판단해 config 에 넣고 annot 을 새로 쓴다.
5. 새 함수 · 라이브러리 → terms · glossary. 고쳐진 버그의 `주의:` 는 지우고, review.json · map-*.json 중 관련 파일이 바뀐 것만 손본다.
6. `check.js <ws> --all` (review 가 남으면 오류) → `build.js` → `checktour.js` → `smoke.js` → `shot.js` 로 읽기 홈의 "🆕 지난번 이후 바뀐 곳"을 확인 → **같은 URL**(`config.artifactUrl`) 로 publish. 다른 대화에서 만든 아티팩트면 먼저 `Artifact action:"read"` 로 읽고 `url` 을 넘긴다.
7. 사용자에게: 바뀐 파일 · 다시 쓴 덩어리 수 · 새로 생긴 "주의" · 사라진 "주의"를 짧게 보고한다.

페이지는 업데이트를 이렇게 보여 준다: 바뀐 덩어리는 다시 "안 읽음", 덩어리 지도에 초록 점, 읽기 홈 맨 위에 "지난번 이후 바뀐 곳" 목록, 별표 · 틀린 줄은 새 줄 번호로 따라감(바뀐 줄의 별표는 빠지고 알림).

## 페이지 기능 (엔진에 이미 있음 — 데이터만 채우면 된다)

탭 6개, 각 탭은 홈 화면부터: 코드 읽기(흐름 카드 · 파일 칸 · 덩어리 지도 · 줄 해설 · 읽는 방식 3가지 — 📖 해설 보며 / 🙈 먼저 생각하기(해설을 가리고 덩어리마다 「맞혔어요 / 몰랐어요」, 몰랐던 덩어리는 연습에 먼저 나옴) / 🧾 코드만 · 🎯 집중 보기) · 흐름 따라가기(이야기 카드 · 자동 재생 · 파일 지도 · 크게 보기) · 내장 기능 사전(단어 구름 · 묶음 고리 · 알아요 체크) · 연습하기(오늘의 5문제 · 6가지 방식 · 연속 정답) · 프로젝트 지도(구조 그림과 요청 재생 · 배포 단계 재생 · 환경변수 타일 · 데이터 나무 · 커밋 그래프와 시간 재생 · 스크린샷 번호) · 프로젝트 평가(성적표 · 우선순위 표 · 주의 히트맵 · 요청 체크리스트). 자료가 없는 지도 칸 · 성적표는 저절로 숨는다. 진도 · 별표 · 체크는 보는 사람 브라우저(localStorage)에만 남는다.

## 참고 문서

- `references/schemas.md` — 모든 JSON 모양 (config, annot, tour, terms, glossary, review, map-*, ui.arch)
- `references/writing.md` — 해설 문체와 예시, 에이전트에게 줄 지시문
- `references/update.md` — 지문 · 줄 맞춤 · 업데이트가 하는 일과 한계
