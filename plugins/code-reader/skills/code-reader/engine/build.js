// node build.js <작업폴더> [--allow-missing]
// 저장소의 실제 파일 + 작업 폴더의 해설(annot) · 이야기(tours) · 사전 · 평가 · 지도 → out/code-reader.html
// 덩어리마다 지문(fp)을 붙이고, 다음 업데이트 때 비교할 manifest.json 을 남긴다.
const L = require("./lib");
const { fs, path } = L;
const { ws, config, repo } = L.loadWs(process.argv[2] || ".");
const allowMissing = process.argv.includes("--allow-missing");
const extraMask = config.mask || [];

const terms = L.readJson(path.join(ws, "terms.json"), []);
const glossary = {};
const gdir = path.join(ws, "glossary");
if (fs.existsSync(gdir)) for (const g of fs.readdirSync(gdir).sort()) if (g.endsWith(".json")) Object.assign(glossary, L.readJson(path.join(gdir, g), {}));
const annots = L.annotIndex(ws);

const files = [], usedKeys = new Set(), manifestFiles = {}, manifestChunks = {};
for (const e of L.flowEntries(config)) {
  const hit = annots[e.file + "@" + (e.from || 1)];
  if (!hit) { if (allowMissing) { console.log("skip (해설 없음)", e.file, e.from || ""); continue; } throw new Error("해설이 없어요: " + e.file + "@" + (e.from || 1) + "  (--allow-missing 으로 건너뛸 수 있어요)"); }
  const a = hit.a;
  const all = L.readSource(repo, e.file, extraMask);
  if (!all) throw new Error("저장소에 파일이 없어요: " + e.file + "  → node update.js 로 정리하세요");
  manifestFiles[e.file] = all;
  let key = a.key || (e.from ? e.file + "@" + e.from : e.file);
  if (usedKeys.has(key)) key = e.flow + ":" + key; // 같은 파일이 여러 흐름에 나오면 흐름 이름을 붙여 구분
  usedKeys.add(key);
  const chunk = {
    file: key, path: e.file, group: e.group, flow: e.flow,
    base: e.label || path.basename(e.file), lang: L.langOf(e.file),
    offset: e.from ? e.from - 1 : 0,
    lines: e.from ? all.slice(e.from - 1, e.to) : all,
    oneLine: a.oneLine, role: a.role, calls: a.calls, calledBy: a.calledBy,
    blocks: (a.blocks || []).map(({ review, ...b }) => b),
  };
  L.addFps(chunk);
  files.push(chunk);
  manifestChunks[key] = { path: e.file, from: e.from || 1, to: e.from ? e.to : all.length, fps: chunk.blocks.map((b) => b.fp) };
}
const flows = config.flows.map(({ id, name, icon, section }) => ({ id, name, icon, section })).filter((fl) => files.some((f) => f.flow === fl.id));
const tours = [];
const tdir = path.join(ws, "tours");
if (fs.existsSync(tdir)) for (const f of fs.readdirSync(tdir)) if (f.endsWith(".json")) {
  const g = L.readJson(path.join(tdir, f));
  g.tours = (g.tours || []).map((t) => ({ ...t, steps: (t.steps || []).map(({ review, ...s }) => s) }));
  tours.push(g);
}
tours.sort((a, b) => config.flows.findIndex((x) => x.id === a.flow) - config.flows.findIndex((x) => x.id === b.flow));
const review = L.readJson(path.join(ws, "review.json"), null);
const projectMap = {};
for (const k of ["env", "data", "history", "style"]) { const v = L.readJson(path.join(ws, "map-" + k + ".json"), null); if (v) projectMap[k] = v; }
const log = L.git(repo, ["log", "--all", "--format=%ad|%an", "--date=short"]);
if (log) projectMap.commits = log.split(/\r?\n/).filter(Boolean).map((s) => { const [d, a] = s.split("|"); return { d, a }; });
const commit = L.git(repo, ["rev-parse", "HEAD"]) || "";
const commitDate = L.git(repo, ["log", "-1", "--format=%ad", "--date=short"]) || "";

// 판 번호: 내용(지문 · 해설)이 같으면 같은 번호
const buildId = L.fnv(JSON.stringify(files.map((f) => [f.file, f.blocks.map((b) => b.fp)])) + JSON.stringify(Object.values(annots).map((x) => x.a))) + "-" + commit.slice(0, 7);
// 업데이트 직후라면: 바뀐 덩어리 목록과 줄 옮김표
const pending = L.readJson(path.join(ws, "pending-update.json"), null);
let changes = null;
if (pending) {
  const blocks = [], seenFp = new Set();
  for (const f of files) {
    const prev = pending.prevFps[f.path];
    for (const b of f.blocks) {
      if (prev && prev.includes(b.fp)) continue;
      if (seenFp.has(f.path + "#" + b.fp)) continue; // 같은 파일이 여러 흐름에 나오면 한 번만
      seenFp.add(f.path + "#" + b.fp);
      blocks.push({ file: f.file, fp: b.fp, status: prev ? "changed" : "new" });
    }
  }
  changes = { prevBuild: pending.prevBuild, sinceLabel: pending.sinceLabel, atLabel: commitDate + " " + commit.slice(0, 7), blocks, files: pending.files || [], lineRuns: pending.lineRuns || {} };
}
const ui = config.ui || {};
const data = { terms, glossary, files, flows, tours, review, projectMap, ui, build: { id: buildId, commit, date: commitDate }, changes };
const json = JSON.stringify(data).replace(/<\//g, "<\\/").replace(/<!--/g, "<\\!--");
const htmlEsc = (s) => String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const tpl = fs.readFileSync(path.join(__dirname, "template.html"), "utf8");
const out = tpl.replace("/*__DATA__*/null", () => json).split("__TITLE__").join(htmlEsc(config.title || "코드 읽기")).split("__SUB__").join(htmlEsc(config.subtitle || "저장소의 실제 파일 그대로 · 줄을 누르면 해설, 밑줄 단어를 누르면 사전"));
fs.mkdirSync(path.join(ws, "out"), { recursive: true });
fs.writeFileSync(path.join(ws, "out", "code-reader.html"), out);
fs.writeFileSync(path.join(ws, "out", "data.json"), JSON.stringify(data));
L.writeJson(path.join(ws, "manifest.json"), { buildId, builtAt: new Date().toISOString(), commit, commitDate, repo, chunks: manifestChunks, files: manifestFiles });

const notes = files.reduce((n, f) => n + f.blocks.reduce((m, b) => m + Object.keys(b.lines || {}).length, 0), 0);
const missingGloss = terms.filter((t) => !glossary[t.id]).map((t) => t.id);
const pendingReview = Object.values(annots).reduce((n, x) => n + (x.a.blocks || []).filter((b) => b.review).length, 0);
console.log("build", buildId, "| tours", tours.reduce((n, g) => n + g.tours.length, 0), "files", files.length, "lines", files.reduce((n, f) => n + f.lines.length, 0), "blocks", files.reduce((n, f) => n + f.blocks.length, 0), "notes", notes, "glossary", Object.keys(glossary).length, "missing glossary", missingGloss.length, "bytes", out.length);
if (changes) console.log("changes since last version:", changes.blocks.length, "blocks");
if (pendingReview) console.log("⚠ 아직 다시 쓰지 않은 덩어리(review 표시):", pendingReview, "개 — worklist.md 를 보세요");
