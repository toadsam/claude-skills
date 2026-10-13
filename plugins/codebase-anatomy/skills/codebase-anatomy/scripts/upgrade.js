// node upgrade.js <해부도.html> [결과.html] [--key K]
// 해부도의 화면 껍데기(as-shell: assets/shell.css + assets/shell.js)를 넣거나 최신으로 바꿔 끼운다.
// kit 의 장 · 데이터 · 렌더 스크립트는 건드리지 않는다. 껍데기 스크립트는 kit 이 다 그린 뒤 돌도록 문서 맨 끝에 둔다.
// 결과 파일을 안 주면 제자리에 쓰고, 처음 한 번은 <이름>.before-shell.html 로 원본을 남긴다.
const fs = require("fs");
const path = require("path");
const args = process.argv.slice(2), opt = {}, pos = [];
for (let i = 0; i < args.length; i++) { if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[++i]; else pos.push(args[i]); }
if (!pos[0]) { console.log("쓰는 법: node upgrade.js <해부도.html> [결과.html] [--key K]"); process.exit(1); }
const inPath = path.resolve(pos[0]), outPath = path.resolve(pos[1] || pos[0]);
const A = path.join(__dirname, "..", "assets");
const css = fs.readFileSync(path.join(A, "shell.css"), "utf8"), js = fs.readFileSync(path.join(A, "shell.js"), "utf8");
let h = fs.readFileSync(inPath, "utf8").replace(/^﻿/, "");

// 발행 때 씌워진 문서 뼈대를 벗긴다 (다시 발행하면 또 씌워진다)
const wrapRe = /^<!doctype html><html><head><meta charset=utf8>[\s\S]*?<\/head><body>\n?/i;
let stripped = false;
if (wrapRe.test(h)) { h = h.replace(wrapRe, "").replace(/\n?<\/body><\/html>\s*$/i, "\n"); stripped = true; }
if (!/<div class="shell">/.test(h) || !/<main class="main">/.test(h)) { console.log("kit 구조(.shell · main.main)를 못 찾았어요. codebase-anatomy kit 으로 만든 해부도인지 확인해 주세요."); process.exit(1); }

let key = opt.key;
const rtRe = /<script id="as-runtime"([^>]*)>[\s\S]*?<\/script>\n?/;
const rt = h.match(rtRe);
if (rt) { const m = rt[1].match(/data-key="([^"]*)"/); key = key || (m && m[1]); h = h.replace(rtRe, ""); }
h = h.replace(/<style id="as-shell">[\s\S]*?<\/style>\n?/, "");
if (!key || /\{\{/.test(key)) {
  const t = (h.match(/<title>([^<]*)<\/title>/) || [])[1] || "anatomy";
  key = "as-" + t.trim().replace(/\s+/g, "-");
}
const at = h.indexOf('<div class="shell">'), ls = h.lastIndexOf("</style>", at);
if (ls < 0) { console.log("문서 <style> 을 못 찾았어요."); process.exit(1); }
h = h.slice(0, ls + 8) + `\n<style id="as-shell">\n${css}</style>` + h.slice(ls + 8);
h = h.replace(/\s*$/, "\n") + `<script id="as-runtime" data-key="${key.replace(/"/g, "")}">\n${js}</script>\n`;

if (outPath === inPath) { const bak = inPath.replace(/\.html?$/i, "") + ".before-shell.html"; if (!fs.existsSync(bak)) fs.copyFileSync(inPath, bak); }
fs.writeFileSync(outPath, h);
console.log(`${rt ? "껍데기 교체" : "껍데기 추가"}${stripped ? " · 발행 뼈대 벗김" : ""} · key=${key}`);
const live = h.replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>/g, "");
console.log(`장 ${(live.match(/<section[^>]*data-nav=/g) || []).length} → ${outPath}`);
