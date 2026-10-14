// 작업 폴더 읽기 공용 함수
// 작업 폴더에는 theater.json(영화 여러 편, movies[].file) 이나 movie.json(한 편) 중 하나가 있다.
const fs = require("fs"), path = require("path");
function readJson(f) { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch (e) { console.log(path.basename(f) + " JSON 오류: " + e.message); process.exit(1); } }
function loadWs(arg, only) {
  const ws = path.resolve(arg || ".");
  const tf = path.join(ws, "theater.json"), mf = path.join(ws, "movie.json");
  let theater = null, list;
  if (fs.existsSync(tf)) { theater = readJson(tf); list = theater.movies.map((m) => ({ ...m, path: path.join(ws, m.file) })); }
  else if (fs.existsSync(mf)) list = [{ file: "movie.json", path: mf }];
  else { console.log("theater.json 도 movie.json 도 없어요: " + ws); process.exit(1); }
  if (only) list = list.filter((m) => path.resolve(m.path) === path.resolve(ws, only) || m.file === only);
  const movies = list.map((m) => {
    if (!fs.existsSync(m.path)) return { ...m, missing: true };
    const movie = readJson(m.path);
    return { ...m, movie, repo: movie.repo ? path.resolve(path.dirname(m.path), movie.repo) : null };
  });
  return { ws, theater, movies };
}
function readLines(repo, file) {
  const p = path.join(repo, file);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n").split("\n");
}
module.exports = { fs, path, loadWs, readLines };
