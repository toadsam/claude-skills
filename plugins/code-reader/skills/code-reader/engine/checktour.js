// node checktour.js <작업폴더> [tours/흐름.json ...]   (build.js 를 먼저 돌려 out/data.json 이 있어야 해요)
// 따라가기 단계가 그 흐름에 실제로 보이는 코드를 가리키는지, 필수 칸이 있는지, 다시 볼 단계(review)가 남았는지.
const L = require("./lib");
const { fs, path } = L;
const { ws } = L.loadWs(process.argv[2] || ".");
const D = L.readJson(path.join(ws, "out", "data.json"));
if (!D) { console.log("out/data.json 이 없어요. build.js 를 먼저 돌리세요."); process.exit(1); }
const terms = new Set(D.terms.map((t) => t.id));
const args = process.argv.slice(3).filter((x) => !x.startsWith("--"));
const allowReview = process.argv.includes("--allow-review");
const tdir = path.join(ws, "tours");
const list = args.length ? args.map((x) => path.resolve(x)) : fs.existsSync(tdir) ? fs.readdirSync(tdir).filter((f) => f.endsWith(".json")).map((f) => path.join(tdir, f)) : [];
let errors = 0;
const err = (m) => { errors++; console.log("ERROR " + m); };
for (const p of list) {
  const T = L.readJson(p);
  const files = D.files.filter((f) => f.flow === T.flow);
  if (!files.length) err(path.basename(p) + ": 모르는 흐름 " + T.flow);
  for (const tour of T.tours || []) {
    const lanes = new Set((tour.lanes || []).map((l) => l.id));
    if (!tour.id || !tour.name || !tour.summary) err("이야기에 id/name/summary 없음");
    if (lanes.size < 2) err(tour.id + ": lanes 가 2개 이상 필요");
    (tour.steps || []).forEach((s, i) => {
      const tag = tour.id + " " + (i + 1) + "단계";
      if (!lanes.has(s.lane)) err(tag + ": 모르는 lane " + s.lane);
      for (const k of ["title", "say", "carry", "carryShort"]) if (!s[k] && !(k.startsWith("carry") && i === tour.steps.length - 1)) err(tag + ": " + k + " 없음");
      if (s.carryShort && s.carryShort.length > 26) err(tag + ": carryShort 가 너무 김 (" + s.carryShort.length + ")");
      if (s.review && !allowReview) err(tag + ": 아직 다시 보지 않음 (review: " + s.review + ")");
      if (s.file) {
        const [a, b] = s.lines || [];
        if (!a || !b || b < a) err(tag + ": lines 가 이상함");
        const chunk = files.find((f) => f.path === s.file && a >= f.offset + 1 && b <= f.offset + f.lines.length);
        if (!chunk) err(tag + ": " + s.file + " " + a + "-" + b + " 가 이 흐름에 보이는 코드 안에 없음");
        else if (chunk.blocks.filter((bl) => bl.end >= a && bl.start <= b).length > 2) err(tag + ": 덩어리 3개 이상에 걸침 — 좁히세요");
      }
      for (const m of JSON.stringify(s).matchAll(/\[\[([a-z0-9-]+)\]\]/g)) if (!terms.has(m[1])) err(tag + ": 사전에 없는 [[" + m[1] + "]]");
    });
    console.log(tour.id + ": " + (tour.steps || []).length + "단계");
  }
}
console.log(errors ? errors + "개 오류" : "OK");
process.exit(errors ? 1 : 0);
