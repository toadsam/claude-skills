// node build.js <작업폴더>  → <작업폴더>/out/movie.html
// 극장(theater.json)이면 영화를 모두, 아니면 movie.json 한 편을 한 페이지로 묶는다.
// 장면마다 code[].file 의 lines 구간을 저장소에서 그대로 읽어 넣는다(코드는 손으로 옮겨 적지 않는다).
const { fs, path, loadWs, readLines } = require("./lib");
const { ws, theater, movies } = loadWs(process.argv[2]);
let refs = 0, miss = 0;
const list = [];
for (const mv of movies) {
  if (mv.missing) { console.log("없는 각본: " + mv.file); miss++; continue; }
  const m = mv.movie; if (mv.group) m.group = mv.group;
  for (const s of m.scenes || []) for (const r of s.code || []) {
    const lines = mv.repo && readLines(mv.repo, r.file);
    if (!lines) { miss++; r.src = ["(파일을 찾지 못했어요: " + r.file + ")"]; continue; }
    r.src = lines.slice(r.lines[0] - 1, r.lines[1]); refs++;
  }
  delete m.repo; // 내 컴퓨터 경로는 페이지에 싣지 않는다
  list.push(m);
}
const title = theater ? theater.title : list[0].title;
const sub = theater ? theater.subtitle : (list[0].subtitle || list[0].story);
const tpl = fs.readFileSync(path.join(__dirname, "template.html"), "utf8");
const json = JSON.stringify({ theater: theater ? { title: theater.title, subtitle: theater.subtitle, intro: theater.intro } : null, movies: list }).replace(/</g, "\\u003c");
const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const out = tpl.replace("{{TITLE}}", esc(title)).replace("{{SUBTITLE}}", esc(sub)).replace("/*__MOVIE__*/", () => json);
fs.mkdirSync(path.join(ws, "out"), { recursive: true });
fs.writeFileSync(path.join(ws, "out", "movie.html"), out);
console.log(`영화 ${list.length} · 장면 ${list.reduce((n, m) => n + m.scenes.length, 0)} · 코드 근거 ${refs}${miss ? " · 못 찾은 것 " + miss : ""} · ${(out.length / 1024).toFixed(0)} KB → out/movie.html`);
if (miss) process.exit(1);
