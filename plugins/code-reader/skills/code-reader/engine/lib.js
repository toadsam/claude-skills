// code-reader 공용 도우미: 작업 폴더 읽기, 파일 읽기(+비밀 가리기), 언어 판별, 덩어리 지문, 줄 맞춤(diff)
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

function loadWs(ws) {
  ws = path.resolve(ws);
  const cfgPath = path.join(ws, "config.json");
  if (!fs.existsSync(cfgPath)) throw new Error("config.json 이 없어요: " + cfgPath);
  const config = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  return { ws, config, repo: path.resolve(ws, config.repo || ".") }; // repo 가 상대 경로면 작업 폴더 기준
}
const readJson = (p, dflt) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : dflt);
const writeJson = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(v, null, 2)); };

// 공개되면 안 되는 값은 페이지에 넣기 전에 가린다. 줄 수는 바꾸지 않는다(키 파일은 줄마다 가림).
function mask(file, text, extra) {
  if (/\.env([._].*)?$/.test(path.basename(file)) || /\.env[._]example$/.test(file)) text = text.replace(/^([ \t]*(?:export[ \t]+)?[A-Za-z0-9_.]+[ \t]*=[ \t]*)(\S.*)$/gm, (m, k) => k + "<가린 값>");
  text = text
    .replace(/\b\d{6,}-[a-z0-9]{20,}\.apps\.googleusercontent\.com\b/g, "<가린 값: 구글 클라이언트 ID>")
    .replace(/https?:\/\/[a-z0-9-]+-\d{6,}\.[a-z0-9-]+\.run\.app/g, "<가린 값: 서버 주소>")
    .replace(/^(\s*PROJECT_ID\s*=\s*)(["'])[^"']+\2/gm, "$1$2<가린 값: 프로젝트 ID>$2")
    .replace(/AIza[0-9A-Za-z_-]{20,}/g, "<가린 값: API 키>")
    .replace(/GOCSPX-[A-Za-z0-9_-]+/g, "<가린 값: 클라이언트 비밀>")
    .replace(/\bsk-[A-Za-z0-9_-]{16,}/g, "<가린 값: API 키>")
    .replace(/\bgh[pousr]_[A-Za-z0-9]{20,}/g, "<가린 값: 토큰>")
    .replace(/\bAKIA[0-9A-Z]{16}\b/g, "<가린 값: 키>")
    .replace(/-----BEGIN [A-Z ]+-----[\s\S]*?-----END [A-Z ]+-----/g, (m) => m.split("\n").map(() => "<가린 값: 키 파일>").join("\n"));
  for (const x of extra || []) text = text.replace(new RegExp(x.re, x.flags || "g"), x.with || "<가린 값>");
  return text;
}
function readSource(repo, file, extraMask) {
  const p = path.join(repo, file);
  if (!fs.existsSync(p)) return null;
  const raw = fs.readFileSync(p, "utf8").replace(/^﻿+/, "").replace(/\r\n/g, "\n").replace(/\n$/, "");
  return mask(file, raw, extraMask).split("\n");
}
function langOf(file) {
  return /\.py$/.test(file) ? "py" : /\.md$/.test(file) ? "md" : /(\.ya?ml|Dockerfile|\.properties|\.toml|\.ini|\.cfg|ignore|\.env([._].*)?|\.sh)$/.test(file) ? "conf" : /\.(tsx?|jsx?|mjs|cjs|html|json|css)$/.test(file) ? "ts" : "java";
}
// 덩어리 지문: 줄 끝 공백을 뺀 코드 내용의 FNV-1a. 줄 번호와 무관하다.
function fnv(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, "0"); }
function blockFp(lines, offset, b) { return "b" + fnv(lines.slice(b.start - 1 - offset, b.end - offset).map((x) => x.replace(/\s+$/, "")).join("\n")); }
function addFps(chunk) {
  const seen = {};
  for (const b of chunk.blocks) { let fp = blockFp(chunk.lines, chunk.offset, b); seen[fp] = (seen[fp] || 0) + 1; if (seen[fp] > 1) fp += "-" + seen[fp]; b.fp = fp; }
}
// 줄 맞춤: 옛 줄 → 새 줄 (같은 내용끼리 최장 공통 부분열). 앞뒤 같은 줄은 먼저 잘라서 빠르게.
function lineMap(oldL, newL) {
  const norm = (s) => s.replace(/\s+$/, "");
  const a = oldL.map(norm), b = newL.map(norm);
  const map = new Array(a.length).fill(-1);
  let s = 0; while (s < a.length && s < b.length && a[s] === b[s]) { map[s] = s; s++; }
  let ea = a.length - 1, eb = b.length - 1; while (ea >= s && eb >= s && a[ea] === b[eb]) { map[ea] = eb; ea--; eb--; }
  const n = ea - s + 1, m = eb - s + 1;
  if (n > 0 && m > 0) {
    if (n * m > 30e6) { // 너무 크면 고유한 줄만 맞춘다
      const cnt = {}; for (let i = s; i <= ea; i++) cnt[a[i]] = (cnt[a[i]] || 0) + 1;
      const pos = {}; for (let j = s; j <= eb; j++) pos[b[j]] = pos[b[j]] === undefined ? j : -2;
      let last = s - 1; for (let i = s; i <= ea; i++) { const j = pos[a[i]]; if (cnt[a[i]] === 1 && j >= 0 && j > last) { map[i] = j; last = j; } }
    } else {
      const W = m + 1, dp = new Uint32Array((n + 1) * W);
      for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i * W + j] = a[s + i] === b[s + j] ? dp[(i + 1) * W + j + 1] + 1 : Math.max(dp[(i + 1) * W + j], dp[i * W + j + 1]);
      let i = 0, j = 0;
      while (i < n && j < m) { if (a[s + i] === b[s + j]) { map[s + i] = s + j; i++; j++; } else if (dp[(i + 1) * W + j] >= dp[i * W + j + 1]) i++; else j++; }
    }
  }
  return map; // 0부터 센 줄 번호
}
// map 을 [옛 시작(1부터), 새 시작(1부터), 길이] 묶음으로
function runsOf(map) {
  const runs = [];
  for (let i = 0; i < map.length; i++) {
    if (map[i] < 0) continue;
    const r = runs[runs.length - 1];
    if (r && r[0] + r[2] === i + 1 && r[1] + r[2] === map[i] + 1) r[2]++; else runs.push([i + 1, map[i] + 1, 1]);
  }
  return runs;
}
function gitRaw(repo, args) { try { return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); } catch (e) { return null; } }
// 저장소 폴더가 git 저장소의 맨 위일 때만 git 을 쓴다 (다른 저장소 안에 들어 있는 예시 폴더라면 바깥 저장소 기록을 읽지 않게)
function git(repo, args) {
  const top = gitRaw(repo, ["rev-parse", "--show-toplevel"]);
  const norm = (p) => path.resolve(p).replace(/\\/g, "/").replace(/\/$/, "").toLowerCase();
  if (!top || norm(top) !== norm(repo)) return null;
  return gitRaw(repo, args);
}
function annotIndex(ws) {
  const dir = path.join(ws, "annot"), out = {};
  if (!fs.existsSync(dir)) return out;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".json")) continue;
    const list = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    (Array.isArray(list) ? list : [list]).forEach((a, i) => { out[a.file + "@" + (a.from || 1)] = { a, src: f, i }; });
  }
  return out;
}
function flowEntries(config) {
  const out = [];
  for (const fl of config.flows) for (const e of fl.order) { const [group, file, from, to, label] = e; out.push({ flow: fl.id, group, file, from, to, label, entry: e }); }
  return out;
}
module.exports = { fs, path, loadWs, readJson, writeJson, mask, readSource, langOf, fnv, blockFp, addFps, lineMap, runsOf, git, annotIndex, flowEntries };
