// node upgrade.js <해설서.html> [결과.html] [--key K] [--drill-key K] [--card-id sec|index]
// 해설서의 화면 껍데기(hs-shell: assets/shell.css + assets/shell.js)를 넣거나 최신으로 바꿔 끼운다. 칸(section.lv) 내용은 건드리지 않는다.
// - 새 해설서(템플릿): <style id="hs-shell"> · <script id="hs-runtime" data-key=…> 자리를 채운다.
// - 예전 해설서: 공용 스크립트(window.G + STORE_KEY)를 껍데기로 바꾸고, 저장 키는 그대로 이어 받는다(체크 · 카드 진행 유지).
// - 아주 옛 해설서(스크립트 하나에 다 들어 있음): 그 스크립트는 그대로 두고 껍데기를 앞에 넣는다. 카드 id 는 순번.
// 결과 파일을 안 주면 제자리에 쓰고, 처음 한 번은 <이름>.before-shell.html 로 원본을 남긴다.
const fs = require("fs");
const path = require("path");
const args = process.argv.slice(2);
const opt = {}; const pos = [];
for (let i = 0; i < args.length; i++) { if (args[i].startsWith("--")) opt[args[i].slice(2)] = args[++i]; else pos.push(args[i]); }
if (!pos[0]) { console.log("쓰는 법: node upgrade.js <해설서.html> [결과.html] [--key K] [--drill-key K] [--card-id sec|index]"); process.exit(1); }
const inPath = path.resolve(pos[0]), outPath = path.resolve(pos[1] || pos[0]);
const ASSETS = path.join(__dirname, "..", "assets");
const css = fs.readFileSync(path.join(ASSETS, "shell.css"), "utf8");
const js = fs.readFileSync(path.join(ASSETS, "shell.js"), "utf8");
let h = fs.readFileSync(inPath, "utf8").replace(/^﻿/, "");

// 1) Artifact 서비스가 발행할 때 씌운 문서 뼈대가 붙어 있으면 벗긴다 (다시 발행하면 또 씌워진다)
const wrapRe = /^<!doctype html><html><head><meta charset=utf8>[\s\S]*?\[hidden\]:not\([\s\S]*?<\/head><body>\n?/i;
let stripped = false;
if (wrapRe.test(h)) { h = h.replace(wrapRe, "").replace(/\n?<\/body><\/html>\s*$/i, "\n"); stripped = true; }

// 2) 이미 들어 있는 껍데기를 찾아 자리와 설정을 기억한다
let key = opt.key, drillKey = opt["drill-key"], cardId = opt["card-id"], mode = "";
const rtRe = /<script id="hs-runtime"([^>]*)>[\s\S]*?<\/script>/;
const rt = h.match(rtRe);
if (rt) {
  const attr = (n) => { const m = rt[1].match(new RegExp(n + '="([^"]*)"')); return m ? m[1] : undefined; };
  key = key || attr("data-key"); drillKey = drillKey || attr("data-drill-key"); cardId = cardId || attr("data-card-id");
  h = h.replace(rtRe, "<!--HS-RUNTIME-->"); mode = "껍데기 교체";
}
const stRe = /<style id="hs-shell">[\s\S]*?<\/style>/;
if (stRe.test(h)) h = h.replace(stRe, "<!--HS-SHELL-->");

// 3) 예전 공용 스크립트(window.G 를 만들고 STORE_KEY 로 저장)를 껍데기로 바꾼다
if (!rt) {
  const scripts = [...h.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const common = scripts.find((m) => /window\.G\s*=/.test(m[1]) && /STORE_KEY/.test(m[1]));
  if (common) {
    const m = common[1].match(/STORE_KEY\s*=\s*["']([^"']+)["']/);
    if (m && !key) key = m[1];
    h = h.replace(common[0], "<!--HS-RUNTIME-->"); mode = "공용 스크립트 → 껍데기";
  } else {
    const mono = scripts.find((s) => /details\.qa/.test(s[1]) && /localStorage/.test(s[1]));
    if (mono) {
      const km = mono[1].match(/var\s+KEY\s*=\s*["']([^"']+)["']/);
      if (km) { drillKey = drillKey || km[1]; key = key || km[1].replace(/-drill$/, ""); }
      if (/cards\.push\(\{\s*id\s*:\s*i\b/.test(mono[1])) cardId = cardId || "index";
      h = h.replace(mono[0], () => "<!--HS-RUNTIME-->\n" + mono[0]); // 함수로 넘겨야 $$ 같은 글자가 바뀌지 않는다
      mode ="옛 스크립트 유지 + 껍데기 추가";
    } else {
      const first = h.search(/<script>/);
      h = first >= 0 ? h.slice(0, first) + "<!--HS-RUNTIME-->\n" + h.slice(first) : h + "\n<!--HS-RUNTIME-->\n";
      mode = "껍데기 추가";
    }
  }
}
if (!key || /\{\{/.test(key)) { console.log("저장 키를 못 찾았어요. --key <프로젝트-slug>-guide 로 알려 주세요."); process.exit(1); }

// 4) 넣는다
if (!h.includes("<!--HS-SHELL-->")) {
  const wrapAt = h.indexOf('<div class="wrap">');
  const lastStyle = h.lastIndexOf("</style>", wrapAt >= 0 ? wrapAt : h.length);
  if (lastStyle < 0) { console.log("문서 <style> 을 못 찾았어요."); process.exit(1); }
  h = h.slice(0, lastStyle + 8) + "\n<!--HS-SHELL-->" + h.slice(lastStyle + 8);
}
const at = (k, v) => (v ? ` ${k}="${v}"` : "");
h = h.replace("<!--HS-SHELL-->", () => `<style id="hs-shell">\n${css}</style>`);
h = h.replace("<!--HS-RUNTIME-->", () => `<script id="hs-runtime"${at("data-key", key)}${at("data-drill-key", drillKey)}${at("data-card-id", cardId)}>\n${js}</script>`);

if (outPath === inPath) {
  const bak = inPath.replace(/\.html?$/i, "") + ".before-shell.html";
  if (!fs.existsSync(bak)) fs.copyFileSync(inPath, bak);
}
fs.writeFileSync(outPath, h);
const n = (re) => (h.match(re) || []).length;
console.log(`${mode}${stripped ? " · 발행 뼈대 벗김" : ""} · key=${key}${drillKey ? " drill=" + drillKey : ""}${cardId ? " card-id=" + cardId : ""}`);
console.log(`칸 ${n(/<section class="lv"/g)} · 질문 ${n(/<details class="qa"/g)} · 확인 ${n(/type="checkbox"/g)} · 남은 {{ ${n(/\{\{/g)} → ${outPath}`);
