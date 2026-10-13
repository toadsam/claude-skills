# 재현 실험 패턴

실험은 **칸의 주장 하나를 눌러서 확인**하게 한다. 실제 서버를 부르지 않는다. 로그 창(`.log`)에
요청·응답을 흉내 낸 줄을 찍고 `.ok` `.bad` `.warn` `.k`(주석색)으로 칠한다.
모든 틀은 `.lab > .lab-h(.pill 재현) + .lab-b`.

공용 스크립트가 `window.G = {$, $$, log, add, wait, reduced}` 를 준다. `wait` 는
reduced-motion 이면 0ms. 전용 코드는 템플릿 맨 아래 스크립트에 `/* lvNN */` 로 구분해 쓴다.

## JS 없이 되는 것

### 1. 단계 넘기기 `[data-stepper]` — 흐름·파이프라인
예: 「입력 → 분석 → 결과 저장 → 기록 → 공유」 같은 기능 흐름.
```html
<div data-stepper>
  <div class="row"><button class="btn js-next">다음 단계 ▶</button><button class="btn ghost js-reset">되돌리기</button></div>
  <div class="steps">
    <div class="step" data-msg="&lt;span class=&quot;ok&quot;&gt;POST /api/ai/analyze&lt;/span&gt; → GPT 에 코치 역할 프롬프트"><b>② AI 분석</b>지금 상태 해석<br><small>POST /api/ai/analyze</small></div>
  </div>
  <div class="log" data-empty="// 아직 아무 요청도 나가지 않았습니다"></div>
</div>
```
`data-msg` 안의 HTML 은 `&lt; &quot;` 로 이스케이프. 단계 수가 5가 아니면
`.steps` 에 `style="grid-template-columns:repeat(N,1fr)"`.

### 2. 골라 보기 `.stack[data-picker]` — 기술 지도, 층별 역할과 선택 이유
```html
<div class="stack" data-picker>
  <button data-msg="&lt;span class=&quot;k&quot;&gt;// 백엔드&lt;/span&gt;&#10;역할: …&#10;&lt;span class=&quot;ok&quot;&gt;왜 Spring:&lt;/span&gt; …"><b>백엔드 · Spring Boot</b>규칙을 지키는 서버</button>
</div>
<div class="log"><span class="k">// 층을 하나 골라 보세요</span></div>
```
줄바꿈은 `&#10;` (`.log` 가 `white-space:pre-wrap`).

### 3. 스위치 `.switch[data-on][data-off]`
(아래 참고) 두 상태 이상을 고르게 할 때는 세그먼트 버튼 `.seg > button[aria-pressed]` 를 쓰고, 전용 JS 에서
눌린 버튼만 `aria-pressed="true"` 로 바꾼다.

### 3-1. 스위치 원형
```html
<button class="switch" id="rot" aria-pressed="true" data-on="로테이션 켬" data-off="로테이션 끔"><i></i>로테이션 켬</button>
```
값은 `el.getAttribute("aria-pressed")==="true"`. 바뀔 때 `flip` 이벤트.

## 전용 JS 가 필요한 것

| 패턴 | 마크업 | 어울리는 주장 | 원본 |
|---|---|---|---|
| **공격 시도** 스위치 + 버튼 + 누적 로그 | `.switch` `.btn` `.log` | 보안 기법이 있으면/없으면 결과가 어떻게 달라지나 |
| **동시 요청 레인** | `.lanes > .lane(.bar>i.b401/bref/bwait/bok/bbad, .st)` | 경쟁 상태, 병렬 호출, 단일화 전후 비교 |
| **역할 전환** + 행동 버튼들 | `.switch` + `.btn[data-t]` | 401/403, 권한 판정 위치 |
| **신호등** 스위치 둘 + 램프 4개 | `.lamps > .lamp.on/.off` | 여러 조건이 다 맞아야 통과(CORS 프리플라이트) |
| **변경 범위** 스위치 + 박스 강조 | `.steps` 에 border 색 | 분리 설계의 이점 |
| **카운터** 스위치 + 큰 숫자 애니메이션 | `.idx > .box.slow/.fast .num` | 인덱스, 캐시 적중, 읽은 행 수 |
| **홉** 순차 점등 | `.hops > .hop.on` | 요청이 층을 지나는 경로(DNS→CDN→서버) |
| **엣지 상태** 배포/무효화 버튼 | `.edges > .edge.old/.new .v` | 캐시·버전 불일치 |
| **JWT 해부** 정적 3칸 | `.jwt > .h/.p/.s` | 토큰 구조 |
| **경쟁 흐름** 세그먼트(입력 선택) + 스위치(외부 키) | `.streams > .stream.win/.off .tk span.hit/.miss` | 여러 후보 결과 중 기준으로 하나 고르기 |
| **수정 전/후 조회** 세그먼트 + 조건 스위치 + 4단계 점등 | `.seg` + `.steps` | 조회 키·폴백 버그의 전후 비교 |
| **IDOR** 세그먼트(지금/고친다면) + 요청 버튼들 | `.seg` + `.btn[data-r]` + `.log` | 인가 부재, 401/403 |
| **배포 사고** 커밋별 스위치 + 램프 | `.switch` + `.lamps` | 빌드 시점 설정이 하나씩 풀리는 과정 |
| **사고 카드** 접이식 | `details.acc > .acc-b > .r(b.s 증상/b.c 원인/b.f 해결/b 교훈)` | 트러블슈팅 서술 |

비동기 연출 뼈대:
```js
var busy=false;
$("#go").addEventListener("click", async function(){
  if(busy) return; busy=true;
  var L=$("#go-log"); log(L,'<span class="k">// 시작</span>');
  await wait(450); add(L,'\n<span class="ok">200</span> …');
  busy=false;
});
```

## 원칙
- 실험 하나에 주장 하나. 두 상태(전/후, 켬/끔)를 **직접 비교**하게 만든다.
- 로그 마지막 줄에 결론을 `.ok`/`.bad` 로 한 문장. 다음 칸으로 넘기는 연결 문장도 좋다.
- 실제 코드에 없는 기능을 실험에서 동작하는 것처럼 보여 주지 않는다. 가상의 대안이면
  버튼 이름에 「(다시 한다면)」 등으로 표시.
- 캔버스·무거운 애니메이션보다 DOM 로그. 모바일에서 `.steps`·`.hops` 는 2열로 접힌다.
