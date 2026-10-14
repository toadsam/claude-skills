// node check.js <작업폴더> [movies/<id>.json]  — 각본이 엔진과 저장소에 맞는지 본다. 끝에 「문제 없음」이 나와야 build 한다.
// 보는 것: 상자 · 방 · 연결 id, 장면 동작 이름과 필수 값, 카드가 만들어진 뒤에만 쓰였는지, 이동 목적지,
//          코드 근거 파일이 있고 줄 범위가 파일 안인지, 어려운 말 id, 끝 화면, 원문자(①) 금지.
const { fs, loadWs, readLines } = require("./lib");
const { theater, movies } = loadWs(process.argv[2], process.argv[3]);
const KINDS = ["app", "server", "db", "ext", "ai", "tool"];
const NEED = { focus: [], zoom: [], unzoom: [], type: ["node", "text"], press: ["node"], screen: ["node"], show: ["card", "at"], move: ["card", "to"],
  chips: ["card", "value"], swap: ["card", "value"], drop: ["card", "idx"], order: ["card", "value"], tag: ["card"], text: ["card", "value"],
  wait: ["node"], score: ["card", "hits", "text"], pick: ["card", "others"], clear: ["card"], remove: ["cards"], note: ["text", "at"], unnote: [],
  fetch: ["card", "to"], play: ["node", "words"], say: ["text"], pause: [], field: ["card", "fields"], regrid: ["card"], posefx: ["card", "fx"] };
const POSEFX = ["jitter", "calm", "sign", "center", "fix", "ghost"];
let total = 0;
for (const mv of movies) {
  const errs = [], warns = []; const E = (m) => errs.push(m), W = (m) => warns.push(m);
  if (mv.missing) { console.log(`■ ${mv.file}: 파일이 아직 없어요`); total++; continue; }
  const M = mv.movie, repo = mv.repo;
  const nodes = new Set((M.stage?.nodes || []).map((n) => n.id));
  const rooms = new Set((M.stage?.rooms || []).map((r) => r.id));
  for (const k of ["id", "title", "icon", "story", "key"]) if (!M[k]) E(k + " 가 없어요");
  if (/[①-⑳]/.test(JSON.stringify(M))) E("원문자(①②…)는 글꼴에 따라 ⊙ 로 깨져요 — 숫자로");
  if (!M.stage?.nodes?.length) E("stage.nodes 가 비었어요");
  for (const n of M.stage?.nodes || []) {
    for (const k of ["x", "y", "w", "h"]) if (typeof n[k] !== "number") E(`상자 ${n.id}: ${k} 가 숫자가 아니에요`);
    if (!KINDS.includes(n.kind)) E(`상자 ${n.id}: kind 는 ${KINDS.join("|")}`);
    if (n.x < 0 || n.y < 0 || n.x + n.w > 1200 || n.y + n.h > 660) E(`상자 ${n.id}: 무대(1200×660) 밖으로 나가요`);
    if (n.zoom && (n.zoom.x + n.zoom.w > 1200 || n.zoom.y + n.zoom.h > 660)) E(`상자 ${n.id}: 확대 배치가 무대 밖이에요`);
  }
  if (rooms.size > 6) E("방은 6개까지예요");
  if (rooms.size && !nodes.has(M.stage.roomsIn)) E("stage.roomsIn 이 상자 id 가 아니에요");
  if (rooms.size && !(M.stage.nodes.find((n) => n.id === M.stage.roomsIn) || {}).zoom) E("방이 있는 상자에 zoom 배치가 없어요");
  for (const [a, b] of M.stage?.links || []) if (!nodes.has(a) || !nodes.has(b)) E(`연결 ${a}–${b}: 없는 상자`);
  let zoomed = false;
  const place = (p, where) => { if (!p) return E(where + ": 위치가 없어요");
    if (p.startsWith("room:")) { if (!rooms.has(p.slice(5))) E(where + ": 없는 방 " + p); else if (!zoomed) E(where + ": 확대(zoom) 전엔 방을 쓸 수 없어요"); }
    else if (!nodes.has(p)) E(where + ": 없는 상자 " + p); };
  const T = M.terms || {}; const cards = new Map(); const ids = new Set(); let refs = 0, acts = 0;
  (M.scenes || []).forEach((s, si) => {
    const W0 = `장면 ${si + 1}(${s.id})`;
    if (!s.id || ids.has(s.id)) E(W0 + ": id 가 없거나 겹쳐요"); ids.add(s.id);
    if (!s.title || !s.say) E(W0 + ": title · say 가 필요해요");
    if (s.title && s.title.length > 18) W(W0 + ": 제목이 길어요(타임라인에 18자 이하)");
    if (s.say && s.say.length > 140) W(W0 + ": 첫 자막이 길어요(" + s.say.length + "자)");
    if (!(s.code || []).length) W(W0 + ": 코드 근거가 없어요");
    for (const t of s.terms || []) if (!T[t]) E(W0 + ": 없는 어려운 말 " + t);
    (s.actions || []).forEach((a, ai) => {
      acts++; const w = `${W0} 동작 ${ai + 1}(${a.do})`;
      if (!NEED[a.do]) return E(w + ": 모르는 동작");
      for (const k of NEED[a.do]) if (a[k] == null) E(w + ": " + k + " 가 필요해요");
      if (a.say && a.say.length > 160) W(w + ": 자막이 길어요");
      if (a.do === "zoom") { zoomed = true; return; } if (a.do === "unzoom") { zoomed = false; return; }
      if (a.do === "focus" && a.node) place(a.node, w);
      if (["type", "press", "wait", "play", "screen"].includes(a.do) && !nodes.has(a.node)) E(w + ": 없는 상자 " + a.node);
      if (["type", "press", "play", "screen"].includes(a.do) && nodes.has(a.node) && M.stage.nodes.find((n) => n.id === a.node).kind !== "app") E(w + ": 화면 동작은 kind app 상자에만");
      if (a.do === "show") {
        if (cards.has(a.card)) E(w + ": 이미 있는 카드 " + a.card); place(a.at, w);
        const kinds = ["text", "chips", "fields", "grid", "pose"].filter((k) => a[k] != null);
        if (kinds.length !== 1) E(w + ": text · chips · fields · grid · pose 중 하나만");
        if (a.grid && !(a.grid.rows > 0 && a.grid.cols > 0)) E(w + ": grid 는 { rows, cols, label }");
        cards.set(a.card, { chips: a.chips ? a.chips.length : 0, kind: kinds[0] }); return; }
      if (a.do === "remove") { for (const c of a.cards || []) { if (!cards.has(c)) E(w + ": 없는 카드 " + c); cards.delete(c); } return; }
      if (a.card && !cards.has(a.card)) return E(w + ": 아직 없는 카드 " + a.card);
      const cd = cards.get(a.card);
      if (a.do === "move" || a.do === "fetch") place(a.to, w);
      if (a.do === "note") place(a.at, w);
      if (["chips", "swap", "order"].includes(a.do)) { if (!Array.isArray(a.value)) E(w + ": value 는 배열"); else { cd.chips = a.value.length; cd.kind = "chips"; } }
      if (a.do === "order" && cd.kind !== "chips") E(w + ": order 는 칩 카드에만");
      if (a.do === "text") { cd.chips = 0; cd.kind = "text"; }
      if (a.do === "drop") cd.chips -= (a.idx || []).length;
      if (a.do === "score" && a.hits.length !== cd.chips) E(w + `: hits ${a.hits.length}개 ≠ 칩 ${cd.chips}개`);
      if (a.do === "fetch" && cd.kind !== "chips") E(w + ": fetch 는 칩 카드에만");
      if (a.do === "field" && cd.kind !== "fields") E(w + ": field 는 fields 카드에만");
      if (a.do === "regrid" && cd.kind !== "grid") E(w + ": regrid 는 grid 카드에만");
      if (a.do === "posefx") { if (cd.kind !== "pose") E(w + ": posefx 는 pose 카드에만"); if (!POSEFX.includes(a.fx)) E(w + ": fx 는 " + POSEFX.join("|")); }
      if (a.do === "pick") for (const o of a.others || []) if (!cards.has(o)) E(w + ": 없는 카드 " + o);
    });
    for (const r of s.code || []) {
      refs++;
      if (!r.file || !Array.isArray(r.lines) || r.lines.length !== 2) { E(W0 + ": code 는 { file, lines:[시작,끝], why }"); continue; }
      const lines = repo && readLines(repo, r.file);
      if (!lines) { E(W0 + ": 저장소에 없는 파일 " + r.file); continue; }
      const [a, b] = r.lines; if (a < 1 || b < a || b > lines.length) E(`${W0}: ${r.file} 줄 ${a}-${b} 이 파일(${lines.length}줄) 밖이에요`);
      if (b - a > 30) W(`${W0}: ${r.file} ${a}-${b} 구간이 길어요(30줄 이하 권장)`);
      if (!r.why) W(`${W0}: ${r.file} 근거에 why 가 없어요`);
    }
  });
  if (!repo || !fs.existsSync(repo)) E("repo 경로가 없어요: " + M.repo);
  if (!M.ending?.points?.length) W("ending.points 가 비었어요");
  console.log(`■ ${mv.file} — ${M.icon || ""} ${M.title}: 장면 ${(M.scenes || []).length} · 동작 ${acts} · 코드 근거 ${refs} · 어려운 말 ${Object.keys(T).length}`);
  for (const w of warns) console.log("  주의 · " + w);
  for (const e of errs) console.log("  오류 · " + e);
  total += errs.length;
}
if (theater) { const keys = movies.filter((m) => m.movie).map((m) => m.movie.key); if (new Set(keys).size !== keys.length) { console.log("  오류 · 영화끼리 key 가 겹쳐요"); total++; } }
console.log(total ? `오류 ${total}개` : "문제 없음");
process.exit(total ? 1 : 0);
