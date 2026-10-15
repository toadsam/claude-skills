// node smoke.js <작업폴더>
// out/code-reader.html 의 스크립트를 가짜 DOM에서 돌려, 모든 파일 · 덩어리 · 용어 · 이야기 · 탭을 한 번씩 그려 보고 오류를 찾는다.
const L = require("./lib");
const { fs, path } = L;
const { ws } = L.loadWs(process.argv[2] || ".");
const html = fs.readFileSync(path.join(ws, "out", "code-reader.html"), "utf8");
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
const js = (scripts.find((m) => m[1].includes("const DATA =")) || scripts[scripts.length - 1])[1]; // 본문 스크립트(실험실 스크립트는 따로 검사)
function el() {
  return {
    innerHTML: "", textContent: "", hidden: false, checked: true, value: "", style: {}, dataset: {}, scrollTop: 0,
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    setAttribute() {}, getAttribute() { return null; }, addEventListener() {}, insertAdjacentHTML() {},
    querySelector() { return el(); }, querySelectorAll() { return []; }, closest() { return null; },
    scrollIntoView() {}, scrollTo() {}, getBoundingClientRect() { return { top: 0, bottom: 10, height: 10 }; }, focus() {}, clientHeight: 500, offsetLeft: 0, offsetWidth: 10, setSelectionRange() {}, matches() { return false; },
  };
}
global.document = { querySelector() { return el(); }, querySelectorAll() { return []; }, addEventListener() {}, body: el(), getElementById() { return el(); } };
global.window = { matchMedia() { return { matches: false }; }, addEventListener() {} };
global.location = { hash: "" };
global.matchMedia = () => ({ matches: false });
global.requestAnimationFrame = (fn) => fn();
global.CSS = { escape: (s) => s };
global.addEventListener = () => {};
global.localStorage = { getItem() { return null; }, setItem() {} };
const api = new Function(js + `
return { FILES, openFile, selectBlock, openTerm, renderGloss, renderLine, TERMS, OCC, TOURS, openTour, openBigMap, showTab,
  renderPractice, renderMap, renderReview, renderReadHub, renderTourHub, axPanelHtml, hsModel,
  setPV: (v, m) => { pView = v; pMode = m; pCur = null; }, setSec: (m) => { mxSec = m; }, setSel: (a) => { axSel = a; },
  hubs: (r, t) => { rHub = r; tHub = t; }, AX_NODES, AX_EDGES, AX_SCEN, RX_AREAS, REVIEW, PMAP, FLOWS };`)();
let n = 0, mismatch = 0;
for (const f of api.FILES) {
  api.openFile(f.file);
  f.blocks.forEach((b, i) => { api.selectBlock(i, b.start, false); n++; });
  for (const ln of f.lines) {
    const text = api.renderLine(ln, f.lang).replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
    if (text !== ln && !(ln === "" && text === " ")) { if (mismatch++ < 5) console.log("MISMATCH", f.base, JSON.stringify(ln)); }
  }
}
for (const t of api.TERMS) api.openTerm(t.id);
api.hubs(false, false);
api.showTab("tour");
for (const tr of api.TOURS) { tr.steps.forEach((s, i) => api.openTour(tr.id, i)); api.openBigMap(tr); }
api.hubs(true, true);
api.showTab("tour"); api.renderTourHub();
api.showTab("read"); api.renderReadHub();
api.showTab("gloss"); api.renderGloss();
api.showTab("practice");
api.setPV("hub"); api.renderPractice();
for (const m of ["line", "block", "order", "card", "stars", "progress"]) for (let k = 0; k < 3; k++) { api.setPV("mode", m); api.renderPractice(); }
api.showTab("map");
for (const s of ["arch", "deploy", "env", "data", "history", "style"]) { api.setSec(s); api.renderMap(); }
for (const nd of api.AX_NODES) { api.setSel(nd.id); api.axPanelHtml(); }
const ids = new Set(api.AX_NODES.map((x) => x.id)), eids = new Set(api.AX_EDGES.map((e) => e.id));
for (const e of api.AX_EDGES) if (!ids.has(e.a) || !ids.has(e.b)) throw new Error("구조 그림: 없는 상자를 잇는 선 " + e.id);
for (const s of api.AX_SCEN) for (const st of s.steps) if ((st.e && !eids.has(st.e)) || (st.n && !ids.has(st.n))) throw new Error("구조 그림: 재생 " + s.id + " 에 없는 선/상자");
const flowIds = new Set(api.FLOWS.map((f) => f.id));
for (const nd of api.AX_NODES) for (const fl of nd.flows || []) if (!flowIds.has(fl)) throw new Error("구조 그림: 상자 " + nd.id + " 의 흐름 " + fl + " 이 없음");
if (api.REVIEW) for (const a of api.RX_AREAS) for (const r of a.refs || []) { const [s, i] = r.split(":"); const sec = api.REVIEW.sections.find((x) => x.id === s); if (!sec || !sec.items[+i]) throw new Error("성적표: 없는 근거 " + r); }
api.showTab("review"); api.renderReview();
console.log("smoke OK · 덩어리 " + n + " · 용어 " + api.TERMS.length + " · 이야기 " + api.TOURS.length + " · 줄 그리기 불일치 " + mismatch + " · 사용처 없는 용어 " + api.TERMS.filter((t) => !(api.OCC[t.id] || []).length).length);
if (mismatch) process.exit(1);
