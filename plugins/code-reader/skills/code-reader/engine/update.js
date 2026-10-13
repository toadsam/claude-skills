// node update.js <작업폴더> [--dry]
// 지난 빌드(manifest.json) 이후 저장소에서 바뀐 곳만 찾아서:
//  - 내용이 같은 덩어리는 줄 번호만 옮기고 (해설 그대로)
//  - 바뀐 덩어리에는 "review" 표시를 붙여 다시 쓸 목록(worklist.md)에 올리고
//  - 따라가기 단계 · 흐름 구간(from~to)도 옮기고, 새로 생긴/지워진 파일을 알려 준다.
// 고친 파일은 backup/<시각>/ 에 먼저 복사해 둔다.
const L = require("./lib");
const { fs, path } = L;
const { ws, config, repo } = L.loadWs(process.argv[2] || ".");
const dry = process.argv.includes("--dry");
const man = L.readJson(path.join(ws, "manifest.json"), null);
if (!man) { console.log("manifest.json 이 없어요. 처음 만들기라면 build.js 부터 돌리세요."); process.exit(1); }

// 1) 파일마다 옛 줄 → 새 줄
const pathInfo = {};
for (const p of Object.keys(man.files)) {
  const old = man.files[p], cur = L.readSource(repo, p, config.mask || []);
  if (!cur) { pathInfo[p] = { status: "deleted", old }; continue; }
  if (old.length === cur.length && old.every((x, i) => x === cur[i])) { pathInfo[p] = { status: "same" }; continue; }
  const map = L.lineMap(old, cur), back = new Array(cur.length).fill(-1);
  map.forEach((n, o) => { if (n >= 0) back[n] = o; });
  pathInfo[p] = { status: "changed", old, cur, map, back };
}
const P = (p) => pathInfo[p] || { status: "same" };
// 옛 줄 번호(1부터) → 새 줄 번호
const nf = (I, o) => (I.map[o - 1] >= 0 ? I.map[o - 1] + 1 : null);
function startNew(I, o) { const n = nf(I, o); if (n) return n; for (let k = o - 1; k >= 1; k--) { const x = nf(I, k); if (x) return x + 1; } return 1; }
function endNew(I, o) { const n = nf(I, o); if (n) return n; for (let k = o + 1; k <= I.old.length; k++) { const x = nf(I, k); if (x) return x - 1; } return I.cur.length; }

// 2) 해설 옮기기
const annots = L.annotIndex(ws);
const work = { blocks: [], removedBlocks: [], entries: [], tours: [], newFiles: [], deletedFiles: [], renamed: [] };
const touchedAnnotFiles = new Set();
let changedLines = 0, totalLines = 0;
const fromChange = {}; // 옛 key → 새 from/to
for (const [key, hit] of Object.entries(annots)) {
  const a = hit.a, I = P(a.file);
  const oldFrom = a.from || 1, oldTo = a.to || (I.old ? I.old.length : (man.files[a.file] || []).length);
  totalLines += oldTo - oldFrom + 1;
  if (I.status === "same") continue;
  if (I.status === "deleted") { work.entries.push({ key, status: "deleted", note: "파일이 없어졌어요. 흐름에서 빼거나 새 위치로 옮기세요." }); continue; }
  const newFrom = a.from ? startNew(I, oldFrom) : 1, newTo = a.from ? endNew(I, oldTo) : I.cur.length;
  if (a.from && (newFrom !== oldFrom || newTo !== oldTo)) fromChange[key] = { from: newFrom, to: newTo };
  const blocks = [];
  let prevEnd = newFrom - 1;
  a.blocks.forEach((b, bi) => {
    const last = bi === a.blocks.length - 1;
    const s = prevEnd + 1, e = last ? newTo : Math.min(newTo, endNew(I, b.end));
    if (e < s) { work.removedBlocks.push({ key, title: b.title, oldRange: [b.start, b.end] }); return; }
    const lines = {}; let dropped = 0;
    for (const [k, v] of Object.entries(b.lines || {})) { const nk = nf(I, +k); if (nk && nk >= s && nk <= e) lines[nk] = v; else dropped++; }
    const newLines = []; for (let n = s; n <= e; n++) if (I.back[n - 1] < 0) newLines.push(n);
    let deleted = 0; for (let o = b.start; o <= b.end; o++) if (!nf(I, o)) deleted++;
    const nb = { ...b, start: s, end: e, lines };
    delete nb.review;
    if (newLines.length || deleted || dropped) {
      nb.review = { status: "changed", newLines, deletedLines: deleted, droppedNotes: dropped };
      changedLines += newLines.length + deleted;
      work.blocks.push({ key, annotFile: hit.src, title: b.title, range: [s, e], newLines, deleted, dropped, split: newLines.length > Math.max(15, 0.6 * (e - s + 1)) });
    }
    blocks.push(nb); prevEnd = e;
  });
  if (blocks.length && blocks[blocks.length - 1].end !== newTo) blocks[blocks.length - 1].end = newTo;
  a.blocks = blocks;
  if (a.from && (a.from !== newFrom || a.to !== newTo)) { if (!a.key) a.key = a.file + "@" + a.from; a.from = newFrom; a.to = newTo; } // key: 처음 만든 구간 이름을 계속 써서 읽음 기록이 이어지게
  touchedAnnotFiles.add(hit.src);
}
// 3) 흐름 구간(config) 옮기기
for (const fl of config.flows) for (const e of fl.order) {
  const k = e[1] + "@" + (e[2] || 1);
  if (fromChange[k]) { e[2] = fromChange[k].from; e[3] = fromChange[k].to; work.entries.push({ key: k, status: "moved", to: e[2] + "~" + e[3] }); }
  if (P(e[1]).status === "deleted" && !work.entries.some((x) => x.key === k)) work.entries.push({ key: k, status: "deleted" });
}
// 4) 따라가기 단계 옮기기
const tdir = path.join(ws, "tours"), tourFiles = {};
if (fs.existsSync(tdir)) for (const f of fs.readdirSync(tdir)) if (f.endsWith(".json")) {
  const g = L.readJson(path.join(tdir, f)); let touched = false;
  for (const t of g.tours || []) (t.steps || []).forEach((s, i) => {
    if (!s.file) return;
    const I = P(s.file); if (I.status === "same") return;
    touched = true;
    if (I.status === "deleted") { s.review = "removed"; work.tours.push({ file: f, tour: t.id, step: i + 1, title: s.title, status: "파일이 없어짐" }); return; }
    const [a, b] = s.lines, na = startNew(I, a), nb = Math.max(na, endNew(I, b));
    let changed = false; for (let o = a; o <= b; o++) if (!nf(I, o)) changed = true;
    for (let n = na; n <= nb; n++) if (I.back[n - 1] < 0) changed = true;
    s.lines = [na, nb];
    delete s.review;
    if (changed) { s.review = "changed"; work.tours.push({ file: f, tour: t.id, step: i + 1, title: s.title, lines: s.lines, status: "코드가 바뀜" }); }
  });
  if (touched) tourFiles[f] = g;
}
// 5) 새로 생긴 · 지워진 파일 (git 이 있으면)
const shown = new Set(L.flowEntries(config).map((e) => e.file));
if (man.commit) {
  const diff = L.git(repo, ["diff", "--name-status", "-M", man.commit]);
  const untracked = L.git(repo, ["ls-files", "--others", "--exclude-standard"]);
  for (const line of (diff || "").split(/\r?\n/).filter(Boolean)) {
    const [st, a, b] = line.split("\t");
    if (st.startsWith("A") && !shown.has(a)) work.newFiles.push(a);
    if (st.startsWith("D") && shown.has(a)) work.deletedFiles.push(a);
    if (st.startsWith("R")) work.renamed.push([a, b]);
  }
  for (const u of (untracked || "").split(/\r?\n/).filter(Boolean)) if (!shown.has(u)) work.newFiles.push(u + " (아직 커밋 안 됨)");
}
// 6) 저장
const changedPaths = Object.entries(pathInfo).filter(([, I]) => I.status !== "same");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
if (!dry) {
  const bk = path.join(ws, "backup", stamp);
  fs.mkdirSync(path.join(bk, "annot"), { recursive: true }); fs.mkdirSync(path.join(bk, "tours"), { recursive: true });
  fs.copyFileSync(path.join(ws, "config.json"), path.join(bk, "config.json"));
  for (const f of touchedAnnotFiles) fs.copyFileSync(path.join(ws, "annot", f), path.join(bk, "annot", f));
  for (const f of Object.keys(tourFiles)) fs.copyFileSync(path.join(tdir, f), path.join(bk, "tours", f));
  // annot 파일 다시 쓰기
  const byFile = {};
  for (const hit of Object.values(annots)) (byFile[hit.src] = byFile[hit.src] || []).push(hit);
  for (const f of touchedAnnotFiles) {
    const raw = L.readJson(path.join(ws, "annot", f)), arr = Array.isArray(raw) ? raw : [raw];
    for (const hit of byFile[f]) arr[hit.i] = hit.a;
    L.writeJson(path.join(ws, "annot", f), Array.isArray(raw) ? arr : arr[0]);
  }
  for (const [f, g] of Object.entries(tourFiles)) L.writeJson(path.join(tdir, f), g);
  L.writeJson(path.join(ws, "config.json"), config);
  // 다음 빌드가 "지난번 이후 바뀐 곳"을 보여 주도록
  const prevFps = {};
  for (const c of Object.values(man.chunks)) (prevFps[c.path] = prevFps[c.path] || []).push(...c.fps);
  L.writeJson(path.join(ws, "pending-update.json"), {
    prevBuild: man.buildId, sinceLabel: (man.commitDate || "") + " " + (man.commit || "").slice(0, 7), prevFps,
    lineRuns: Object.fromEntries(changedPaths.filter(([, I]) => I.status === "changed").map(([p, I]) => [p, L.runsOf(I.map)])),
    files: changedPaths.map(([p, I]) => ({ path: p, status: I.status === "deleted" ? "지워짐" : "바뀜" })).concat(work.newFiles.map((p) => ({ path: p, status: "새 파일" }))),
  });
}
const ratio = totalLines ? changedLines / totalLines : 0;
const summary = { since: man.commit, changedPaths: changedPaths.map(([p, I]) => [p, I.status]), ...work, changedLines, totalLines, ratio };
L.writeJson(path.join(ws, "worklist.json"), summary);
// 사람이 읽는 목록
const cur = (p, n) => { const I = P(p); return I.cur ? I.cur[n - 1] : ""; };
let md = "# 업데이트 할 일 (" + new Date().toLocaleString("ko-KR") + ")\n\n";
md += "기준: 지난 빌드 커밋 `" + (man.commit || "?").slice(0, 7) + "` → 지금 저장소\n\n";
md += "- 바뀐 파일 " + changedPaths.length + "개 · 다시 써야 할 덩어리 **" + work.blocks.length + "개** · 따라가기 단계 " + work.tours.length + "개 · 바뀐 줄 " + changedLines + " / " + totalLines + " (" + (ratio * 100).toFixed(1) + "%)\n";
if (ratio > 0.3) md += "- ⚠ 바뀐 비율이 30%를 넘어요. 덩어리만 고치기보다 이 흐름을 처음부터 다시 만드는 게 나을 수 있어요. 사용자에게 먼저 물어보세요.\n";
md += "\n## 1. 다시 쓸 덩어리 (annot 의 block 에 \"review\" 가 붙어 있어요)\n\n";
for (const w of work.blocks) {
  md += "### " + w.key + " · " + w.title + " (" + w.range[0] + "~" + w.range[1] + "줄, " + w.annotFile + ")\n";
  md += "- 새로 생긴/바뀐 줄 " + w.newLines.length + "개, 지워진 줄 " + w.deleted + "개, 사라진 줄 해설 " + w.dropped + "개" + (w.split ? " · **새 줄이 많아요: 덩어리를 나누는 걸 고려**" : "") + "\n";
  for (const n of w.newLines.slice(0, 12)) md += "  - " + n + ": `" + cur(w.key.split("@")[0], n).trim().slice(0, 100).replace(/`/g, "'") + "`\n";
  if (w.newLines.length > 12) md += "  - … 외 " + (w.newLines.length - 12) + "줄\n";
  md += "\n";
}
if (work.removedBlocks.length) md += "## 지워진 덩어리\n\n" + work.removedBlocks.map((x) => "- " + x.key + " · " + x.title + " (옛 " + x.oldRange.join("~") + "줄)").join("\n") + "\n\n";
if (work.tours.length) md += "## 2. 다시 볼 따라가기 단계 (step 에 \"review\" 표시)\n\n" + work.tours.map((x) => "- " + x.file + " · " + x.tour + " " + x.step + "단계 「" + x.title + "」 — " + x.status + (x.lines ? " (지금 " + x.lines.join("~") + "줄)" : "")).join("\n") + "\n\n";
if (work.entries.length) md += "## 3. 흐름 구간\n\n" + work.entries.map((x) => "- " + x.key + " → " + (x.status === "moved" ? "구간이 " + x.to + "줄로 옮겨짐" : "파일이 없어짐") ).join("\n") + "\n\n";
if (work.newFiles.length || work.deletedFiles.length || work.renamed.length) md += "## 4. 새 파일 · 지운 파일 · 이름 바뀐 파일 (흐름에 넣을지 판단)\n\n" + work.newFiles.map((x) => "- 새 파일: " + x).concat(work.deletedFiles.map((x) => "- 지운 파일: " + x), work.renamed.map(([a, b]) => "- 이름 바꿈: " + a + " → " + b)).join("\n") + "\n\n";
md += "## 5. 마무리\n\n1. 위 덩어리의 explain · lines 를 고치고 `review` 를 지운다\n2. 따라가기 단계의 say · carry 를 확인하고 `review` 를 지운다\n3. 새 함수 · 라이브러리가 나왔으면 terms · glossary 추가, 고쳐진 버그의 \"주의\"는 지우고 review.json 도 손본다\n4. `node check.js <작업폴더> --all` → `node build.js <작업폴더>` → 같은 URL 로 다시 올리기\n";
fs.writeFileSync(path.join(ws, "worklist.md"), md);
console.log((dry ? "[미리 보기] " : "") + "바뀐 파일 " + changedPaths.length + " · 다시 쓸 덩어리 " + work.blocks.length + " · 지워진 덩어리 " + work.removedBlocks.length + " · 따라가기 단계 " + work.tours.length + " · 새 파일 " + work.newFiles.length + " · 바뀐 줄 비율 " + (ratio * 100).toFixed(1) + "%");
console.log("→ " + path.join(ws, "worklist.md"));
