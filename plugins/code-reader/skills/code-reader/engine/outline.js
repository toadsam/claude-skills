// node outline.js <작업폴더> → out/outline-<흐름>.txt (흐름마다 파일 · 구간 · 덩어리 목록. 따라가기 이야기 쓸 때 본다)
const L = require("./lib");
const { fs, path } = L;
const { ws } = L.loadWs(process.argv[2] || ".");
const D = L.readJson(path.join(ws, "out", "data.json"));
for (const fl of D.flows) {
  let out = "# " + fl.name + " (" + fl.id + ")\n";
  for (const f of D.files.filter((x) => x.flow === fl.id)) {
    out += "\n## " + f.path + (f.offset ? "  [" + (f.offset + 1) + "-" + (f.offset + f.lines.length) + "줄만]" : "  [파일 전체]") + "\n   " + f.oneLine + "\n";
    for (const b of f.blocks) out += "   " + b.start + "-" + b.end + "  " + b.title + "\n";
  }
  fs.writeFileSync(path.join(ws, "out", "outline-" + fl.id + ".txt"), out);
  console.log(fl.id, out.split("\n").length, "줄");
}
