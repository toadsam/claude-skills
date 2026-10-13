// node check.js <해설서.html>
// 발행 전 점검: 스크립트 문법, 없는 id 를 부르는 곳, 깨진 #링크, 남은 {{ }}, 껍데기(hs-shell) 유무와 저장 키, 칸 · 질문 · 확인 수.
const fs = require("fs");
const file = process.argv[2];
if (!file) { console.log("쓰는 법: node check.js <해설서.html>"); process.exit(1); }
const h = fs.readFileSync(file, "utf8");
let bad = 0;
const say = (m) => { console.log("✗ " + m); bad++; };
[...h.matchAll(/<script(?: [^>]*)?>([\s\S]*?)<\/script>/g)].forEach((m, i) => { try { new Function(m[1]); } catch (e) { say("script " + i + ": " + e.message); } });
const ids = new Set([...h.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
[...h.matchAll(/\$\("#([\w-]+)"\)/g)].forEach((m) => { if (!ids.has(m[1])) say("없는 #" + m[1] + " 를 부름"); });
[...h.matchAll(/href="#([\w-]+)"/g)].forEach((m) => { if (!ids.has(m[1])) say("깨진 링크 #" + m[1]); });
const left = (h.replace(/\$\{\{[^}]*\}\}/g, "").match(/\{\{/g) || []).length; // 코드 원문의 ${{ vars.X }} 는 뺀다
if (left) say("채우지 않은 {{ }} " + left + "곳");
if (!/<style id="hs-shell">[\s\S]{200,}?<\/style>/.test(h)) say("화면 껍데기 스타일이 없어요 → node scripts/upgrade.js " + file);
const rt = h.match(/<script id="hs-runtime"([^>]*)>([\s\S]*?)<\/script>/);
if (!rt || rt[2].length < 200) say("화면 껍데기 스크립트가 없어요 → node scripts/upgrade.js " + file);
const key = rt && (rt[1].match(/data-key="([^"]*)"/) || [])[1];
if (!key || /\{\{/.test(key)) say("저장 키(data-key)가 비어 있어요");
const secs = [...h.matchAll(/<section class="lv" id="([^"]+)"/g)].map((m) => m[1]);
const dup = secs.filter((s, i) => secs.indexOf(s) !== i);
if (dup.length) say("칸 id 가 겹쳐요: " + dup.join(", "));
const n = (re) => (h.match(re) || []).length;
const noOne = [...h.matchAll(/<section class="lv" id="(lv[^"]*)"[\s\S]*?<\/section>/g)].filter((m) => !/class="oneline"/.test(m[0])).map((m) => m[1]);
if (noOne.length) console.log("· 한 줄 요약(.oneline)이 없는 칸: " + noOne.join(", ") + " (지도 카드와 가리기에 쓰여요)");
console.log(`칸 ${secs.length} · 질문 ${n(/<details class="qa"/g)} (기본 ${n(/class="t t1"/g)} · 꼬리 ${n(/class="t t2"/g)} · 압박 ${n(/class="t t3"/g)}) · 실험 ${n(/class="lab"/g)} · 확인 ${n(/type="checkbox"/g)} · 용어 ${n(/<dt>/g)} · 저장 키 ${key || "-"}`);
console.log(bad ? `문제 ${bad}개` : "문제 없음");
process.exit(bad ? 1 : 0);
