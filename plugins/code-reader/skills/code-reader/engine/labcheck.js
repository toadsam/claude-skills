// node labcheck.js <작업폴더>  — 「▶ 실행 따라가기」(labs/*.json + *.js)가 실제 코드와 맞는지 본다.
// 보는 것: anchors 의 줄 범위 안에 has 글자가 실제로 있는지(파일별), body 범위 · 앵커가 sources 로 화면에 실리는지,
//          states 줄에 그 이름의 useState 가 있는지, events 단계의 종류 · 앵커 · 함수 들어가고 나오기(call/effect ↔ return)가 짝이 맞는지,
//          await 뒤에 resume 이 있는지, 화면 JS 가 문법에 맞는지. 코드가 바뀌면 여기서 먼저 걸린다.
const L = require("./lib");
const { fs, path } = L;
const { ws, repo } = L.loadWs(process.argv[2] || ".");
const dir = path.join(ws, "labs");
if (!fs.existsSync(dir)) { console.log("labs/ 가 없어요 — 실험 0개"); process.exit(0); }
const KINDS = ["event", "call", "line", "set", "await", "resume", "return", "render", "effect", "end", "enter", "leave", "block"];
let errs = 0, n = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  n++;
  const lab = L.readJson(path.join(dir, f));
  const E = (m) => { errs++; console.log("  오류 · " + m); };
  console.log("■ " + f + " — " + lab.title);
  const sources = lab.sources || { [lab.file]: lab.show || [] };
  const files = {};
  for (const file of new Set([lab.file, ...Object.keys(sources)])) { files[file] = L.readSource(repo, file, []); if (!files[file]) E("저장소에 없는 파일 " + file); }
  const shown = (file, a, b) => (sources[file] || []).some(([x, y]) => a >= x && b <= y);
  for (const [file, rs] of Object.entries(sources)) for (const [a, b] of rs) if (files[file] && (a < 1 || b > files[file].length || b < a)) E(`${file} ${a}-${b} 이 파일 밖이에요`);
  for (const [k, v] of Object.entries(lab.anchors || {})) {
    const file = v.file || lab.file, src = files[file]; if (!src) continue;
    if (!v.l || v.l[1] > src.length) { E(`anchor ${k}: 줄 범위가 파일 밖`); continue; }
    if (v.has && !src.slice(v.l[0] - 1, v.l[1]).join("\n").includes(v.has)) E(`anchor ${k}: ${file} ${v.l[0]}-${v.l[1]}줄에 "${v.has}" 가 없어요 → 코드가 바뀌었는지 보고 줄을 고치세요`);
    if (!shown(file, v.l[0], v.l[1])) E(`anchor ${k}: ${v.l[0]}-${v.l[1]}줄이 sources 범위 밖이라 화면에 안 보여요`);
    if (v.body && !shown(file, v.body[0], v.body[1])) E(`anchor ${k}: 함수 몸통 ${v.body[0]}-${v.body[1]}줄이 sources 범위 밖`);
  }
  const main = files[lab.file] || [];
  for (const s of lab.states || []) if (!/useState/.test(main[s.line - 1] || "") || !(main[s.line - 1] || "").includes("[" + s.name + ",")) E(`state ${s.name}: ${s.line}줄에 useState 가 없어요`);
  const stateNames = new Set((lab.states || []).map((s) => s.name));
  let steps = 0;
  for (const ev of lab.events || []) {
    let depth = 0, waiting = false, inSec = false, secDepth = 0;
    ev.steps.forEach((st, i) => {
      steps++; const w = `${ev.id} ${i + 1}번(${st.k})`;
      if (!KINDS.includes(st.k)) return E(w + ": 모르는 종류");
      if (st.a && !(lab.anchors || {})[st.a]) E(w + ": 없는 anchor " + st.a);
      if (["call", "effect", "line", "set", "await", "event", "block"].includes(st.k) && !st.a) E(w + ": anchor(a) 가 필요해요");
      if ((st.k === "call" || st.k === "effect") && !st.fn) E(w + ": fn 이 필요해요");
      if (st.k === "set" && !stateNames.has(st.state)) E(w + ": states 에 없는 상태 " + st.state);
      if (st.k === "await") { if (!st.what) E(w + ": 무엇을 기다리는지(what) 가 필요해요"); waiting = true; }
      if (st.k === "block" && (!st.what || !st.a)) E(w + ": block 에는 a 와 what 이 필요해요");
      if (st.k === "enter") { if (inSec) E(w + ": 서버 구간 안에서 또 enter"); if (!waiting) E(w + ": 서버 구간은 앱이 await 로 기다리는 동안이어야 해요"); inSec = true; secDepth = depth; }
      if (st.k === "leave") { if (!inSec) E(w + ": enter 없이 leave"); if (depth !== secDepth) E(w + ": 서버 구간에서 들어간 함수를 다 나오지 않았어요"); inSec = false; }
      if (st.k === "resume") { if (!waiting && (ev.steps[i - 1] || {}).k !== "return") E(w + ": 기다린 적 없는데 resume (await 나 return 다음이어야 해요)"); waiting = false; }
      if (st.k === "call" || st.k === "effect") depth++;
      if (st.k === "return") { depth--; if (depth < 0) E(w + ": 들어간 함수보다 return 이 많아요"); }
      if (!st.say && st.k !== "return") E(w + ": say 가 비었어요");
    });
    if (depth !== 0) E(`${ev.id}: call/effect 와 return 의 짝이 안 맞아요 (남은 깊이 ${depth})`);
    if (inSec) E(`${ev.id}: 서버 구간이 leave 로 닫히지 않았어요`);
    if (waiting) E(`${ev.id}: 마지막 await 뒤에 resume 이 없어요`);
    if (!ev.steps.length || ev.steps[ev.steps.length - 1].k !== "end") E(`${ev.id}: 마지막 단계는 end 로`);
  }
  const jsf = path.join(dir, f.replace(/\.json$/, ".js"));
  if (!fs.existsSync(jsf)) E("짝 JS(화면 그림)가 없어요: " + path.basename(jsf));
  else { try { new Function("LAB", fs.readFileSync(jsf, "utf8")); } catch (e) { E("JS 문법 오류: " + e.message); } }
  console.log(`  anchors ${Object.keys(lab.anchors || {}).length} · states ${(lab.states || []).length} · 이벤트 ${(lab.events || []).length} · 단계 ${steps}`);
}
console.log(errs ? `오류 ${errs}개` : `실험 ${n}개 · 문제 없음`);
process.exit(errs ? 1 : 0);
