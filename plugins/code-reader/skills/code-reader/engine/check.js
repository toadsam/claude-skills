// node check.js <작업폴더> <annot/파일.json | --all> [--allow-review]
// 해설 파일 검사: 모양, 덩어리가 모든 줄을 빈틈없이 덮는지, 줄 해설이 덩어리 안인지, [[용어]]가 사전에 있는지,
// 그리고 업데이트 뒤 아직 다시 쓰지 않은 덩어리("review")가 남았는지.
const L = require("./lib");
const { fs, path } = L;
const { ws, config, repo } = L.loadWs(process.argv[2] || ".");
const target = process.argv[3];
const allowReview = process.argv.includes("--allow-review");
const terms = new Set(L.readJson(path.join(ws, "terms.json"), []).map((t) => t.id));
const list = target === "--all" || !target ? fs.readdirSync(path.join(ws, "annot")).filter((f) => f.endsWith(".json")).map((f) => path.join(ws, "annot", f)) : [path.resolve(target)];
let errors = 0, reviews = 0, missingTotal = 0;
const err = (m) => { errors++; console.log("ERROR " + m); };
for (const fp of list) {
  const data = L.readJson(fp);
  for (const f of Array.isArray(data) ? data : [data]) {
    const all = L.readSource(repo, f.file, config.mask || []);
    if (!all) { err(f.file + ": 저장소에 파일이 없어요"); continue; }
    const from = f.from || 1, n = f.to || all.length;
    if (n > all.length) err(f.file + ": to=" + n + " 인데 파일은 " + all.length + "줄");
    for (const k of ["file", "oneLine", "role", "calls", "calledBy", "blocks"]) if (!(k in f)) err(f.file + ": " + k + " 없음");
    let prevEnd = from - 1;
    for (const b of f.blocks || []) {
      if (b.start !== prevEnd + 1) err(f.file + ": 덩어리 '" + b.title + "' 가 " + b.start + "에서 시작 (기대: " + (prevEnd + 1) + ")");
      if (b.end < b.start || b.end > n) err(f.file + ": 덩어리 '" + b.title + "' 끝이 이상함 " + b.end + " (구간 끝 " + n + ")");
      prevEnd = b.end;
      if (!b.title || !b.explain) err(f.file + ": " + b.start + "줄 덩어리에 title/explain 없음");
      for (const ln of Object.keys(b.lines || {})) if (+ln < b.start || +ln > b.end) err(f.file + ": 줄 해설 " + ln + " 이 덩어리 " + b.start + "-" + b.end + " 밖");
      for (const m of JSON.stringify(b).matchAll(/\[\[([a-z0-9-]+)\]\]/g)) if (!terms.has(m[1])) err(f.file + ": 사전에 없는 [[" + m[1] + "]]");
      if (b.review) { reviews++; if (!allowReview) err(f.file + ": " + b.start + "~" + b.end + " '" + b.title + "' 아직 다시 쓰지 않음 (review)"); }
    }
    if (prevEnd !== n) err(f.file + ": 덩어리가 " + prevEnd + "에서 끝나는데 구간은 " + n + "줄까지");
    const missing = [];
    for (let i = from; i <= n; i++) {
      const t = (all[i - 1] || "").trim();
      if (!t || /^[{}()\[\];,]*$/.test(t) || /^import\b/.test(t) || /^from\s+\S+\s+import\b/.test(t) || /^("""|#|\/\/)/.test(t) || /^\}\s*(\)|;)*$/.test(t)) continue;
      const b = (f.blocks || []).find((x) => i >= x.start && i <= x.end);
      if (b && !(b.lines && b.lines[i])) missing.push(i);
    }
    missingTotal += missing.length;
    if (list.length === 1 || missing.length > 0 && target !== "--all") console.log(f.file + (f.from ? " [" + from + "~" + n + "]" : "") + ": " + (n - from + 1) + "줄, 덩어리 " + (f.blocks || []).length + ", 줄 해설 없는 코드 줄 " + missing.length + (missing.length ? " → " + missing.slice(0, 40).join(",") + (missing.length > 40 ? "…" : "") : ""));
  }
}
console.log((errors ? errors + "개 오류" : "OK") + " · 검사한 파일 " + list.length + " · review 남음 " + reviews + " · 줄 해설 없는 코드 줄 " + missingTotal);
process.exit(errors ? 1 : 0);
