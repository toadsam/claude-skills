// node scripts/check-examples.js [--no-browser]
// 저장소에 든 예제로 네 스킬의 검사 스크립트를 전부 돌린다. 하나라도 실패하면 종료 코드 1.
// CI(.github/workflows/check.yml)와 내 컴퓨터에서 같은 명령을 쓴다: npm test
// --no-browser 는 Chrome 을 띄우는 단계(코드 영화 재생)를 건너뛴다.
const fs = require("fs");
const path = require("path");
const { spawnSync, execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const noBrowser = process.argv.includes("--no-browser");
const skill = (name) => path.join("plugins", name, "skills", name);
const R = skill("code-reader"), M = skill("code-movie"), A = skill("codebase-anatomy"), H = skill("project-haeseolseo");
const rws = path.join(R, "example", "workspace"), mws = path.join(M, "example", "workspace");

let failed = 0;
function report(name, ok, detail) {
  console.log(`${ok ? "✓" : "✗"} ${name}${detail ? "\n" + detail.replace(/^/gm, "    ") : ""}`);
  if (!ok) failed++;
}

// 1) 모든 .js 는 문법이 맞아야 하고, 모든 .json 은 읽혀야 한다 (git 이 추적하는 파일만)
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
const badJs = tracked.filter((f) => f.endsWith(".js")).filter((f) => spawnSync(process.execPath, ["--check", f], { cwd: root }).status !== 0);
report(`문법 검사 · .js ${tracked.filter((f) => f.endsWith(".js")).length}개`, badJs.length === 0, badJs.join("\n"));
const badJson = tracked.filter((f) => f.endsWith(".json")).filter((f) => {
  try { JSON.parse(fs.readFileSync(path.join(root, f), "utf8")); return false; } catch (e) { return true; }
});
report(`JSON 읽기 · .json ${tracked.filter((f) => f.endsWith(".json")).length}개`, badJson.length === 0, badJson.join("\n"));

// 2) 스킬마다 예제를 검사 → 빌드 → 그려 보기. 순서가 중요하다(checktour · smoke 는 build 결과를 읽는다).
const steps = [
  ["code-reader · 해설이 모든 줄을 덮는지", [path.join(R, "engine", "check.js"), rws, "--all"]],
  ["code-reader · 페이지 빌드", [path.join(R, "engine", "build.js"), rws]],
  ["code-reader · 따라가기 단계가 실제 코드를 가리키는지", [path.join(R, "engine", "checktour.js"), rws]],
  ["code-reader · 실행 따라가기가 코드와 맞는지", [path.join(R, "engine", "labcheck.js"), rws]],
  ["code-reader · 가짜 DOM 에서 전부 그려 보기", [path.join(R, "engine", "smoke.js"), rws]],
  ["code-movie · 각본이 엔진 · 저장소와 맞는지", [path.join(M, "engine", "check.js"), mws]],
  ["code-movie · 페이지 빌드", [path.join(M, "engine", "build.js"), mws]],
  ["code-movie · Chrome 에서 처음부터 끝까지 재생", [path.join(M, "engine", "smoke.js"), mws], "browser"],
  ["codebase-anatomy · 예제 해부도 점검", [path.join(A, "scripts", "check.js"), path.join(A, "example", "todo-anatomy.html")]],
  ["project-haeseolseo · 예제 해설서 점검", [path.join(H, "scripts", "check.js"), path.join(H, "example", "todo-haeseolseo.html")]],
];
for (const [name, args, kind] of steps) {
  if (kind === "browser" && noBrowser) { console.log(`- ${name} (건너뜀: --no-browser)`); continue; }
  const r = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", timeout: 300000 });
  const out = ((r.stdout || "") + (r.stderr || "")).trim();
  report(name, r.status === 0, r.status === 0 ? out.split("\n").slice(-1)[0] : out);
}

console.log(failed ? `\n실패 ${failed}건` : "\n전부 통과");
process.exit(failed ? 1 : 0);
