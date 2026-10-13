---
name: project-haeseolseo
description: Build a Korean interview-prep "해설서" for one of the user's own projects and publish it as an interactive HTML Artifact, grounded in the project's GitHub repository (code, commits, README) as the source of truth — one section ("칸") per key decision, code path, troubleshooting commit, or feature found in the repo, each with a one-line summary, first-principles explanation, a clickable reenactment lab, real code excerpts, honesty notes, a "if I did it again" comparison, expected interview questions in three tiers (기본 / 꼬리 / 압박) with speakable first-person answers, and a "면접 전 확인" checklist; plus a glossary and a random mock-interview flashcard drill. Use when the user asks for a 해설서, 면접 대비 문서, 면접 해설, 포트폴리오 프로젝트 공부 자료, or wants to study a project so they can defend it in a technical interview. Not for a general architecture/defect audit — that is codebase-anatomy; not for line-by-line code reading — that is code-reader.
---

# 프로젝트 해설서

사용자가 **자기 프로젝트를 면접에서 끝까지 방어할 수 있게** 만드는 문서.
틀은 `assets/template.html` 에 다 들어 있다(디자인 · 목차 · 체크 저장 · 모의 면접 카드).
처음 만든 해설서가 있으면 그 링크를 메모리에 남겨 두고, 다음부터 형식의 기준으로 `Artifact action:"read"` 로 열어 본다.

**기준은 GitHub 저장소다. 포트폴리오 사이트 · 발표자료 · 이력서가 아니다.**
그런 글은 사용자가 나중에 만든 설명이라 저장소와 어긋날 수 있다(저장소에 없는 코드가 구현된 것처럼
들어가 있는 경우도 흔하다). 해설서의 칸 · 순서 · 사실은 저장소에서 뽑고, 포트폴리오는
「어긋난 곳을 찾아 알리는」 대조 대상으로만 쓴다.

독자는 **그 프로젝트를 만든 본인**이다. 코드는 봤지만 원리 · 용어 · 트레이드오프를 말로
설명하는 데 약하고, 기술 면접의 꼬리 질문에 대비하려 한다.

## 처음 쓸 때 물어볼 것 (메모리에 저장)

- 프로젝트 저장소들이 있는 폴더, GitHub 계정, 포트폴리오 사이트 저장소(있다면)
- 사용자 자신을 가리키는 git 작성자 이름 · 커밋 서명(팀 프로젝트에서 내 몫을 가를 때 쓴다)
- 지원하려는 분야(예: 금융권이면 감사 추적 · 개인정보 질문이 늘어난다)

## 일곱 가지 규칙 (어기면 문서가 해롭다)

1. **코드에 없는 것을 있다고 쓰지 않는다.** 「우리 코드」 블록과 답변 속 구현 사실은 전부
   직접 연 파일에서 나온다. 확인 못 한 것은 답에 「확인해서 답하겠다」로 두고
   **면접 전 확인** 체크 항목으로 내린다. 이 경계선이 문서의 존재 이유다.
2. **답은 1인칭, 소리 내 말할 수 있는 문장.** 「~했습니다」 체, 3~5문장. 약점은 인정 → 이유
   → 지금 다시 한다면 순서. 지어낸 수치 · 경험은 절대 넣지 않는다.
3. **바닥 원리부터.** 칸마다 이해를 막는 개념 하나를 처음 듣는 사람 기준으로 세우고,
   일상 비유를 하나 붙이고, 용어는 용어 사전에 올린다.
4. **재현과 실제를 구분.** 실험(lab)은 전부 `재현` 표시. 예시 숫자는 「설명용 가정」이라고
   적는다. 측정하지 않은 성과 지표는 쓰지 않는다.
5. **GitHub 가 기준, 포트폴리오는 대조 대상.** 칸의 출처와 순서는 저장소(README · 코드 · 커밋 · PR)에서 정한다.
   포트폴리오 · 발표자료 · 이력서의 주장은 저장소와 대조만 하고, 어긋나면 사용자에게 알리고 고칠지 묻는다.
   해설서 본문에 포트폴리오 대조표를 넣지 않는다.
   「내 몫」도 README 문장이 아니라 blame · 커밋으로 확인한다. README 가 「내 결정」이라 쓴 것도 첫 구현자가
   팀원일 수 있다(팀원이 먼저 만든 것을 사용자가 넓힌 경우 등).
6. **팀 프로젝트면 내 몫과 팀 몫을 git 으로 가른다.** 칸 제목 옆에 `by me`/`by team` 배지,
   회고 칸에 사람별 담당 표(근거 커밋). 면접에서 「그건 누가 했나요」에 무너지지 않게.
   팀원 담당 칸도 뺄 수는 없다. 「구조는 설명할 수 있고 구현은 팀원」으로 답을 짠다.
7. **사용자의 언어로.** 기본 한국어. 문서 안 데이터 문자열까지.

## 워크플로

### 1. 칸의 출처를 정한다 — GitHub 저장소에서
자세한 방법은 `references/sources.md`.
1. `git fetch` 후 **원격 기본 브랜치(origin/main)** 를 기준으로 삼는다. 로컬이 뒤처져 있을 수 있다
   (README 개편 커밋이 원격에만 있는 경우가 흔하다).
2. **README** 가 가리키는 것을 뼈대로: 핵심 코드 링크, 결정과 근거, 측정값, 알고 있는 빚, 역할 표.
3. **코드**: 서비스 흐름 끝까지(요청 → 도메인 → 외부 호출 → 저장소 → 응답), 인증, 데이터 모델, 배포 파일.
4. **커밋 · PR**: 트러블슈팅은 커밋 diff 에서 찾는다(fix/수정/버그 메시지, 짧은 시간에 몰린 연속 커밋,
   메시지가 「1」인 커밋도 diff 로 확인). 증상 기록이 없으면 「diff 로 재구성」이라고 밝힌다.
5. 칸 순서 예: 프로젝트와 팀 → 핵심 결정 · 코드 경로 → 트러블슈팅 → 기능 도메인 → 인증 → 구조 → 배포 →
   잰 것 → 빚 · 회고. 보통 10~14칸. 태그에 README 위치를 적는다.
6. 포트폴리오 · 발표자료는 이 단계가 끝난 뒤에 열어 대조한다.

### 2. 조사한다 (쓰기 전에 끝낸다)
큰 파일 읽기는 서브에이전트로 병렬 분담하고, 각자 `file:line` + 짧은 원문 스니펫으로
보고하게 한다. 최소한:
- 스택 · 버전(빌드 파일), 환경변수, 배포 방식(워크플로 · Dockerfile)
- 인증 · 권한 전 과정, 핵심 도메인 흐름 끝까지, 외부 API 호출(타임아웃 · 실패 처리 · 키 관리)
- 데이터 모델, 엔드포인트 목록, 테스트 유무
- git: 작성자별 커밋 · 파일, 트러블슈팅 커밋의 실제 diff, 비밀값이 이력에 들어간 적 있는지
  (존재만 확인하고 값은 출력하지 않는다)
- 작성자 귀속: 칸마다 핵심 함수의 `git blame` 과 `git log -S '<식별자>'` 로 **처음 만든 사람과
  확장한 사람**을 가른다. README · 포트폴리오의 역할 문장은 확인 대상이지 근거가 아니다.
- 포트폴리오 · 이력서의 숫자와 코드 조각을 저장소와 대조해 어긋나는 곳을 목록으로 만든다. 사용자에게 보고하고,
  고치라고 하면 고친다(`references/sources.md` 「포트폴리오 고치기」).

### 3. 칸을 쓴다
블록 구성과 쓰는 법은 `references/section-recipe.md`, 질문 작성법은
`references/questions.md`, 실험 패턴은 `references/labs.md`.
`assets/template.html` 을 복사해 채운다. 디자인 시스템 · 목차 · 체크 저장 · 모의 면접 카드
스크립트가 이미 들어 있으니 CSS와 공용 스크립트는 고치지 않는다. 바꾸는 것은:
- `--accent` 계열 팔레트(라이트 · 다크 두 벌)와 `--on-sem`(배지 글자색)을 프로젝트에 맞게. 프로젝트 자체에 색 토큰(CSS 변수)이 있으면 그걸 가져온다.
- `STORE_KEY` 를 프로젝트 slug 로.
- 실험 로그 · 기술 지도 설명 문자열 안에도 근거 없는 「왜」를 지어내지 않는다. 이유가 기록에 없으면 「기록에 없음 → 확인」이라고 쓴다.
- 칸별 실험은 맨 아래 「프로젝트 전용 실험 스크립트」에만 쓴다.

분량 기준: 칸 12개 안팎, 칸마다 질문 3~6개(기본 · 꼬리 · 압박 섞어서),
확인 항목 2~5개, 실험은 핵심 칸에 1~2개, 전체 질문 45개 안팎, 용어 30개 안팎.

### 4. 검증 (발행 전 필수)
```bash
node -e '
const fs=require("fs");const h=fs.readFileSync(process.argv[1],"utf8");
const s=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
s.forEach((b,i)=>{try{new Function(b)}catch(e){console.log("script",i,e.message)}});
const ids=new Set([...h.matchAll(/id="([^"]+)"/g)].map(m=>m[1]));
[...h.matchAll(/\$\("#([\w-]+)"\)/g)].forEach(m=>{if(!ids.has(m[1]))console.log("missing #"+m[1])});
[...h.matchAll(/href="#([\w-]+)"/g)].forEach(m=>{if(!ids.has(m[1]))console.log("broken link #"+m[1])});
console.log("{{ left:",(h.match(/\{\{/g)||[]).length,"| qa:",(h.match(/class="qa"/g)||[]).length,"| checks:",(h.match(/type="checkbox"/g)||[]).length);
' 해설서.html
```
`{{` 가 0 이어야 한다(코드 조각 속 `${{ vars.X }}` 같은 원문은 예외). 그 다음 「우리 코드」 블록 3개 이상을 골라 실제 파일과 한 줄씩 대조한다.

### 5. 발행
`artifact-design` 스킬을 먼저 불러 디자인을 점검한 뒤 `Artifact` 로 발행한다.
제목은 `<프로젝트명> 해설서`, 파비콘은 프로젝트를 상징하는 이모지 하나.
사용자에게는 링크와 함께 **조사에서 새로 드러난 것**(README · 포트폴리오 · 이력서가 저장소와 어긋난 곳,
작성자 귀속이 README 와 다른 곳, 면접에서 가장 위험한 질문, 가장 강한 카드)을 먼저 알린다.

## 기존 해설서 갱신
같은 프로젝트 해설서가 이미 있으면(`Artifact action:"list"`) 새로 만들지 않고 읽어서
그 위에 고친다. 사용자의 체크 · 카드 진행은 브라우저 localStorage 에 있으니
`STORE_KEY` 와 칸 id 를 바꾸지 않는다.
