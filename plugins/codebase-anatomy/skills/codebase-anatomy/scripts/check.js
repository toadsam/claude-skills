// node check.js <해부도.html>
// 발행 전 점검: 스크립트 문법, getElementById 대상, {{섹션id}} 참조, 데이터 배열 꼴, 껍데기(as-shell) 유무.
const fs = require("fs");
const file = process.argv[2];
if (!file) { console.log("쓰는 법: node check.js <해부도.html>"); process.exit(1); }
const h = fs.readFileSync(file, "utf8");
let bad = 0; const say = (m) => { console.log("✗ " + m); bad++; };
const scripts = [...h.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
scripts.forEach((s, i) => { try { new Function(s); } catch (e) { say("script " + i + ": " + e.message); } });
const ids = new Set([...h.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
// 주석과 껍데기 · kit 렌더 코드는 빼고 본다 (예시 문자열 오탐 방지)
// /* */ 는 스크립트 · 스타일 안에서만 지운다 — 본문 글자(예: sql/*.sql)까지 지우면 장이 통째로 사라진다
const body = h.replace(/<!--[\s\S]*?-->/g, "").replace(/<script id="as-runtime"[\s\S]*?<\/script>/, "")
  .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/g, (m) => m.replace(/\/\*[\s\S]*?\*\//g, ""));
const markup = body.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "");
const secIds = [...h.replace(/<!--[\s\S]*?-->/g, "").matchAll(/<section[^>]*id="([^"]+)"[^>]*data-nav=/g)].map((m) => m[1]);
[...body.matchAll(/\{\{([A-Za-z0-9_]+)\}\}/g)].forEach((m) => { if (!secIds.includes(m[1]) && !/^(sectionId|xref)$/.test(m[1])) say("없는 장 참조 {{" + m[1] + "}}"); });
// DATA 블록을 실제로 돌려서 배열 꼴을 본다
const data = scripts.find((s) => /var\s+FINDINGS\s*=/.test(s) || /var\s+STATS\s*=/.test(s));
if (data) {
  try {
    const D = new Function(data + ";return {FINDINGS:typeof FINDINGS!=='undefined'?FINDINGS:[],QUIZ:typeof QUIZ!=='undefined'?QUIZ:[],TRACES:typeof TRACES!=='undefined'?TRACES:[],GLOSSARY:typeof GLOSSARY!=='undefined'?GLOSSARY:{}}")();
    D.FINDINGS.forEach((f) => { if (!/^(high|mid|low)$/.test(f.sev)) say(f.id + " sev 가 high|mid|low 가 아님"); });
    D.QUIZ.forEach((q, i) => { if (!(q.a >= 0 && q.a < q.o.length)) say("퀴즈 " + (i + 1) + " 정답 번호가 보기 밖"); });
    D.TRACES.forEach((t) => (t.steps || []).forEach((s, i) => { if (!/^(front|back|rt|ext)$/.test(s.w)) say(t.id + " " + (i + 1) + "단계 w 가 front|back|rt|ext 가 아님"); }));
    const terms = [...markup.matchAll(/data-t="([^"]+)"/g)].map((m) => m[1]).filter((t) => !(t in D.GLOSSARY));
    if (terms.length) say("용어 사전에 없는 data-t: " + [...new Set(terms)].join(", "));
    console.log(`결함 ${D.FINDINGS.length} · 퀴즈 ${D.QUIZ.length} · 추적 ${D.TRACES.length} · 용어 ${Object.keys(D.GLOSSARY).length}`);
  } catch (e) { console.log("· DATA 블록을 따로 실행하지 못해 배열 점검은 건너뜀 (" + e.message + ")"); }
}
if (!/<style id="as-shell">[\s\S]{200,}?<\/style>/.test(h) || !/<script id="as-runtime"[^>]*>[\s\S]{200,}?<\/script>/.test(h)) say("화면 껍데기가 없어요 → node scripts/upgrade.js " + file);
console.log(`장 ${secIds.length}`);
console.log(bad ? `문제 ${bad}개` : "문제 없음");
process.exit(bad ? 1 : 0);
