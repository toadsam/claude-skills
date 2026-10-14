// node smoke.js <작업폴더> [영화 번호]  — 화면 없는 Chrome 에서 영화를 실제로 재생해 본다(영화마다 Chrome 하나).
// 영화마다: 극장 첫 화면이 그려지는지, 모든 장면 건너뛰기(goto), 처음부터 끝까지 재생해 끝 화면이 뜨는지, 오류가 없는지.
const { fs, path, loadWs } = require("./lib");
const { spawnSync } = require("child_process");
const { ws, movies } = loadWs(process.argv[2]);
const CHROME = [process.env.CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => p && fs.existsSync(p));
if (!CHROME) { console.log("Chrome/Edge 를 찾지 못했어요"); process.exit(1); }
const html = fs.readFileSync(path.join(ws, "out", "movie.html"), "utf8");
const only = process.argv[3] != null ? [+process.argv[3]] : movies.filter((m) => !m.missing).map((_, i) => i);
let fail = 0;
for (const idx of only) {
  const probe = `<script>
window.__errs = []; window.addEventListener("error", (e) => window.__errs.push(e.message + " @" + e.lineno));
window.addEventListener("unhandledrejection", (e) => window.__errs.push("reject: " + (e.reason && e.reason.message || e.reason)));
setTimeout(async () => {
  const log = [];
  try {
    if (MOVIE.MOVIES.length > 1) { MOVIE.showHome(); log.push("home " + document.querySelectorAll(".mcard").length); }
    await MOVIE.openMovie(${idx}); const M = MOVIE.M; log.push(M.id); document.body.setAttribute("data-log", log.join(" · "));
    for (let i = 0; i < M.scenes.length; i++) await MOVIE.goto(i, { end: true });
    log.push("jumped " + M.scenes.length); document.body.setAttribute("data-log", log.join(" · "));
    document.getElementById("auto").checked = true;
    // 화면 없는 Chrome 은 애니메이션 시계가 흐르지 않는다 → 직접 앞으로 민다
    const pump = setInterval(() => { for (const a of document.getAnimations()) { try { if (a.playState === "running") a.currentTime = (a.currentTime || 0) + 250; } catch (e) {} } }, 25);
    const seen = []; const t0 = performance.now();
    MOVIE.goto(0, { play: true });
    await new Promise((res) => { const iv = setInterval(() => { if (!seen.includes(MOVIE.ST.scene)) { seen.push(MOVIE.ST.scene); document.body.setAttribute("data-log", log.join(" · ") + " · at " + seen.length + " t=" + Math.round(performance.now() - t0)); }
      if (document.getElementById("end").classList.contains("show") || performance.now() - t0 > 170000) { clearInterval(iv); clearInterval(pump); res(); } }, 50); });
    log.push("played " + seen.length + "/" + M.scenes.length + " end=" + document.getElementById("end").classList.contains("show"));
  } catch (e) { window.__errs.push("probe: " + e.message); }
  document.body.setAttribute("data-log", log.join(" · "));
  document.body.setAttribute("data-errs", window.__errs.join(" | ") || "none");
}, 300);
</script>`;
  const f = path.join(ws, "shots", "_smoke" + idx + ".html"); fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, html + probe);
  const prof = path.join(ws, "cr", "smoke"); fs.mkdirSync(prof, { recursive: true });
  const r = spawnSync(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--user-data-dir=" + prof, "--window-size=1500,1000", "--virtual-time-budget=180000", "--dump-dom", "file:///" + f.split(path.sep).join("/")], { encoding: "utf8", timeout: 240000, maxBuffer: 1 << 28 });
  const g = (k) => ((r.stdout || "").match(new RegExp('data-' + k + '="([^"]*)"')) || [])[1];
  const ok = g("errs") === "none" && /end=true/.test(g("log") || "");
  console.log(`${ok ? "✓" : "✗"} ${g("log") || "(probe 가 끝나지 않음)"}${ok ? "" : " — errors: " + (g("errs") || "?")}`);
  if (!ok) fail++;
  fs.unlinkSync(f);
}
console.log(fail ? `smoke FAIL (${fail})` : "smoke done");
process.exit(fail ? 1 : 0);
