// node shot.js <작업폴더> <이름> "<불러온 뒤 실행할 JS>" [너비] [높이]
// → <작업폴더>/shots/<이름>.png 와 페이지 오류 여부. 컴퓨터의 Chrome 을 화면 없이(headless) 띄운다.
// 프로필은 짧은 경로(<작업폴더>/cr/)에 따로 둔다 — 경로가 길면 Windows 경로 한도 때문에 Chrome 이 조용히 실패한다.
// 멈춰도 사용자 Chrome 을 끄지 않는다: 시간 제한(timeout)으로 이 Chrome 만 끝낸다. taskkill 로 chrome.exe 를 끄지 말 것.
const L = require("./lib");
const { fs, path } = L;
const { spawnSync } = require("child_process");
const { ws } = L.loadWs(process.argv[2] || ".");
const [name, code, w, h] = process.argv.slice(3);
const CHROME = [process.env.CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => p && fs.existsSync(p));
if (!CHROME) { console.log("Chrome/Edge 를 찾지 못했어요. CHROME 환경변수로 경로를 알려 주세요."); process.exit(1); }
const dir = path.join(ws, "shots"); fs.mkdirSync(dir, { recursive: true });
const probe = `<script>
window.__errs = [];
window.addEventListener("error", (e) => { window.__errs.push(e.message + " @" + e.lineno); });
setTimeout(async () => { try { ${code || ""} } catch (e) { window.__errs.push("probe: " + e.message); }
  document.body.setAttribute("data-errs", window.__errs.join(" | ") || "none"); }, 400);
</script>
<style>/* headless Chrome 은 CSS 애니메이션 시간이 흐르지 않아 첫 장면(투명)에 멈춘다 → 사진용으로 끈다 */
*, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition: none !important; }</style>`;
const f = path.join(dir, name + ".html");
fs.writeFileSync(f, fs.readFileSync(path.join(ws, "out", "code-reader.html"), "utf8") + probe);
const url = "file:///" + f.replace(/\\/g, "/");
const run = (tag, extra) => {
  const prof = path.join(ws, "cr", tag); fs.mkdirSync(prof, { recursive: true });
  return spawnSync(CHROME, ["--headless=new", "--disable-gpu", "--no-first-run", "--hide-scrollbars", "--user-data-dir=" + prof, "--window-size=" + (w || 1500) + "," + (h || 1000), "--virtual-time-budget=6000", ...extra, url], { encoding: "utf8", timeout: 120000, maxBuffer: 1 << 28 });
};
run("s", ["--screenshot=" + path.join(dir, name + ".png")]);
const d = run("d", ["--dump-dom"]);
const m = (d.stdout || "").match(/data-errs="([^"]*)"/);
console.log(name, "errors:", m ? m[1] : "(probe did not run)", fs.existsSync(path.join(dir, name + ".png")) ? "→ " + path.join(dir, name + ".png") : "(no png)");
