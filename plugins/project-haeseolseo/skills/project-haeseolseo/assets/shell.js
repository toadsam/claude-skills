/* ═══ hs-shell: 해설서 화면 껍데기 ═══
   문서의 section.lv(칸)는 그대로 두고, 그 위에 화면 다섯 개(지도 · 칸 읽기 · 말하기 연습 · 용어 · 면접 전 확인)를 짠다.
   scripts/upgrade.js 가 <script id="hs-runtime" data-key=… > 로 넣는다. 저장 키는 예전 해설서와 같아서 체크 · 카드 진행이 이어진다.
     data-key       저장 키 앞부분 (예전 STORE_KEY)
     data-drill-key 질문 자기 평가 저장 키 (기본 <key>-drill)
     data-card-id   "sec" → "<칸 id>:<문서 안 질문 순번>" (기본) · "index" → "<순번>" (아주 옛 해설서) */
(function () {
  "use strict";
  var me = document.currentScript || document.getElementById("hs-runtime");
  var ds = (me && me.dataset) || {};
  var KEY = ds.key || "haeseolseo";
  var DRILL_KEY = ds.drillKey || KEY + "-drill";
  var CARD_ID = ds.cardId || "sec";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function wait(ms) { return new Promise(function (r) { setTimeout(r, reduced ? 0 : ms); }); }
  if (!window.G) window.G = { $: $, $$: $$, log: function (el, h) { el.innerHTML = h; }, add: function (el, h) { el.innerHTML += h; }, wait: wait, reduced: reduced };

  /* ── 범용 실험 (예전 공용 스크립트와 같은 동작) ── */
  $$("[data-stepper]").forEach(function (root) {
    if (root.dataset.hsb) return; root.dataset.hsb = 1;
    var steps = $$(".step", root), L = $(".log", root), next = $(".js-next", root), reset = $(".js-reset", root), i = -1;
    var label = next ? next.textContent : "다음 단계 ▶";
    function render() {
      steps.forEach(function (s, k) { s.classList.toggle("on", k <= i); });
      if (next) { next.disabled = i >= steps.length - 1; next.textContent = i >= steps.length - 1 ? "끝" : label; }
      if (L) L.innerHTML = i < 0 ? '<span class="k">' + (L.dataset.empty || "//") + "</span>" : (steps[i].dataset.msg || "");
    }
    if (next) next.addEventListener("click", function () { if (i < steps.length - 1) { i++; render(); } });
    if (reset) reset.addEventListener("click", function () { i = -1; render(); });
    render();
  });
  $$(".stack[data-picker]").forEach(function (root) {
    if (root.dataset.hsb) return; root.dataset.hsb = 1;
    var L = root.parentNode.querySelector(".log");
    $$("button", root).forEach(function (b) { b.addEventListener("click", function () {
      $$("button", root).forEach(function (x) { x.classList.toggle("on", x === b); });
      if (L) L.innerHTML = b.dataset.msg || "";
    }); });
  });
  $$(".switch[data-on]").forEach(function (b) {
    if (b.dataset.hsb) return; b.dataset.hsb = 1;
    b.addEventListener("click", function () {
      var v = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", String(v));
      b.lastChild.textContent = v ? b.dataset.on : b.dataset.off;
      b.dispatchEvent(new CustomEvent("flip", { detail: v }));
    });
  });

  /* ── 도우미 ── */
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function txt(el) { return el ? el.textContent.replace(/\s+/g, " ").trim() : ""; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function pct(a, b) { return b ? Math.round((a / b) * 100) : 0; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var TIER = { t1: "기본", t2: "꼬리", t3: "압박" };
  var RATE = { again: "😵 다시", meh: "🤔 애매", ok: "😎 자신 있음" };
  function ring(r, p, cls) { var c = 2 * Math.PI * r; return '<circle class="bg" cx="' + (r + 3) + '" cy="' + (r + 3) + '" r="' + r + '" stroke-width="' + (cls || 4) + '"/><circle class="fg" cx="' + (r + 3) + '" cy="' + (r + 3) + '" r="' + r + '" stroke-width="' + (cls || 4) + '" stroke-dasharray="' + (c * p).toFixed(1) + " " + c.toFixed(1) + '"/>'; }

  /* ── 문서 읽기 ── */
  var main = $("main.main");
  if (!main) return;
  var mast = $(".masthead"), nav = $("nav.rail");
  var secEls = $$(".lv", main).filter(function (s) { return s.parentNode === main; });
  var S = {}, order = [];
  secEls.forEach(function (s, k) {
    if (!s.id) s.id = "hs-sec-" + k;
    var head = $(".lv-head", s), by = head && $(".by", head), tag = txt(head && $(".tag", head));
    var one = $(".oneline", s);
    var kind = $("dl.gloss", s) && !$("details.qa", s) ? "gloss" : $(".drill", s) ? "drill" : (!one && $(".strategy", s)) || s.id === "howto" ? "howto" : "lv";
    S[s.id] = {
      id: s.id, el: s, kind: kind, n: txt(head && $(".n", head)), title: txt(head && $("h2", head)), tag: tag,
      by: by ? { me: by.classList.contains("me"), text: txt(by) } : null,
      one: one ? txt(one).replace(/^한 줄로\s*/, "") : "", star: /가장 중요|핵심 칸/.test(tag),
      labs: $$(".lab", s).length, codes: $$(".code", s).length, cards: [], checks: [], group: null
    };
    if (kind === "lv" || kind === "howto") order.push(s.id);
  });
  var groups = [], g = null;
  if (nav) Array.prototype.forEach.call(nav.children, function (c) {
    if (c.classList.contains("rail-h")) { g = { name: txt(c), ids: [] }; groups.push(g); }
    else if (c.tagName === "A") {
      var id = (c.getAttribute("href") || "").replace(/^#/, "");
      if (S[id] && S[id].group == null) { if (!g) { g = { name: "", ids: [] }; groups.push(g); } g.ids.push(id); S[id].group = g.name; }
    }
  });
  var lost = order.filter(function (id) { return S[id].group == null; });
  if (lost.length) { groups.push({ name: "기타", ids: lost }); lost.forEach(function (id) { S[id].group = "기타"; }); }
  order = [];
  groups.forEach(function (gr) { gr.ids.forEach(function (id) { if (S[id].kind === "lv" || S[id].kind === "howto") order.push(id); }); });
  var lvIds = order.filter(function (id) { return S[id].kind === "lv"; });
  var howto = order.filter(function (id) { return S[id].kind === "howto"; })[0];
  var glossSec = secEls.filter(function (s) { return S[s.id].kind === "gloss"; })[0];

  var cards = [], C = {};
  $$("details.qa").forEach(function (d, i) {
    var sec = d.closest(".lv"), sid = sec ? sec.id : "x", t = $(".t", d);
    var tier = t ? (["t1", "t2", "t3"].filter(function (c) { return t.classList.contains(c); })[0] || "t1") : "t1";
    var c = { id: CARD_ID === "index" ? String(i) : sid + ":" + i, sid: sid, tier: tier, d: d,
      q: txt($("summary", d)).replace(/^(기본|꼬리|압박)\s*/, ""),
      ans: $(".ans", d) ? $(".ans", d).innerHTML : "", tip: $(".tip", d) ? $(".tip", d).innerHTML : "" };
    cards.push(c); C[c.id] = c; if (S[sid]) S[sid].cards.push(c);
  });

  var checks = load(KEY + "-checks", {}), checkItems = [];
  $$(".check").forEach(function (box) {
    var sec = box.closest(".lv"), sid = sec ? sec.id : "x";
    $$("input[type=checkbox]", box).forEach(function (inp, k) {
      var key = sid + ":" + k, lab = inp.closest("label"), html = "";
      if (lab) { var cl = lab.cloneNode(true); var ci = $("input", cl); if (ci) ci.remove(); html = cl.innerHTML.trim(); }
      inp.checked = !!checks[key];
      var it = { key: key, sid: sid, inp: inp, html: html };
      inp.addEventListener("change", function () { checks[key] = inp.checked; save(KEY + "-checks", checks); refresh(); });
      checkItems.push(it); if (S[sid]) S[sid].checks.push(it);
    });
    var hEl = $(".h", box);
    if (hEl && !$(".prog", hEl)) hEl.appendChild(el("span", "prog"));
  });

  var rate = load(DRILL_KEY, {}), readS = load(KEY + "-read", {}), peek = load(KEY + "-peek", {});
  function rOf(c) { var v = rate[c.id]; return v === "ok" || v === "meh" || v === "again" ? v : ""; }
  function setRate(c, r) { rate[c.id] = r; save(DRILL_KEY, rate); paintCard(c); refresh(); }
  function score(list) { var s = 0; list.forEach(function (c) { var r = rOf(c); s += r === "ok" ? 1 : r === "meh" ? 0.5 : 0; }); return list.length ? s / list.length : 0; }
  function counts(list) { var o = { ok: 0, meh: 0, again: 0, none: 0 }; list.forEach(function (c) { o[rOf(c) || "none"]++; }); return o; }
  function stats() {
    var read = lvIds.filter(function (id) { return readS[id]; }).length;
    var chk = checkItems.filter(function (x) { return x.inp.checked; }).length;
    var m = score(cards);
    var ready = (lvIds.length ? read / lvIds.length : 0) * 0.3 + m * 0.5 + (checkItems.length ? chk / checkItems.length : 1) * 0.2;
    return { read: read, chk: chk, chkLeft: checkItems.length - chk, m: m, cnt: counts(cards), ready: Math.round(ready * 100) };
  }
  function label(id) { var s = S[id]; return (s.n && s.n !== "—" ? s.n + " " : "") + s.title; }
  function dots(list) { return list.map(function (c) { return '<i class="d ' + c.tier + " r-" + (rOf(c) || "none") + '"></i>'; }).join(""); }
  function bar3(list) { var o = counts(list), n = list.length || 1; return '<div class="hs-bar"><i class="ok" style="width:' + (o.ok / n * 100) + '%"></i><i class="meh" style="width:' + (o.meh / n * 100) + '%"></i><i class="again" style="width:' + (o.again / n * 100) + '%"></i></div>'; }

  /* ── 틀 ── */
  var title = txt(mast && $("h1", mast)) || document.title || "해설서";
  var eyebrow = txt(mast && $(".eyebrow", mast));
  var VIEWS = [["home", "🗺️", "지도"], ["read", "📖", "칸 읽기"], ["practice", "🎤", "말하기 연습"], ["gloss", "📚", "용어"], ["checks", "✅", "면접 전 확인"]];
  if (!glossSec) VIEWS = VIEWS.filter(function (v) { return v[0] !== "gloss"; });
  if (!checkItems.length) VIEWS = VIEWS.filter(function (v) { return v[0] !== "checks"; });
  document.body.classList.add("hs");
  var app = el("div", "hs-app");
  var top = el("header", "hs-top",
    '<button class="hs-brand" data-view="home"><span class="hs-logo">' + esc(title.charAt(0)) + "</span><span><b>" + esc(title) + "</b><small>" + esc(eyebrow) + "</small></span></button>" +
    '<nav class="hs-tabs">' + VIEWS.map(function (v) { return '<button data-view="' + v[0] + '">' + v[1] + " " + v[2] + '<em hidden></em></button>'; }).join("") + "</nav>" +
    '<div class="hs-top-r"><button class="hs-ready" data-view="home" title="면접 준비도 = 칸 읽음 30% + 질문 자신감 50% + 확인 항목 20%">준비도 <svg class="hs-ring" viewBox="0 0 36 36"></svg><b></b></button>' +
    '<button class="hs-icon-btn" data-act="theme" title="밝게 / 어둡게">◐</button></div>');
  app.appendChild(top);
  var V = {};
  VIEWS.forEach(function (v) { V[v[0]] = app.appendChild(el("section", "hs-view")); V[v[0]].id = "hs-" + v[0]; });
  document.body.insertBefore(app, document.body.firstChild);
  try { var th = localStorage.getItem("hs-theme"); if (th) document.documentElement.setAttribute("data-theme", th); } catch (e) {}

  /* ── 칸 읽기: 틀은 한 번만 만들고 칸만 바꿔 끼운다 ── */
  V.read.innerHTML = '<div class="hs-readgrid"><aside class="hs-rail"></aside><div class="hs-center"><div class="hs-sechead"></div><div class="hs-host"></div><div class="hs-foot"></div></div><aside class="hs-side"></aside></div>';
  $(".hs-host", V.read).appendChild(main);
  var railEl = $(".hs-rail", V.read), sideEl = $(".hs-side", V.read), headEl = $(".hs-sechead", V.read), footEl = $(".hs-foot", V.read);

  // 한 줄 가리기
  secEls.forEach(function (s) {
    var one = $(".oneline", s); if (!one) return;
    var t = el("span", "hs-one-t");
    Array.prototype.slice.call(one.childNodes).forEach(function (n) { if (!(n.nodeType === 1 && n.tagName === "SMALL")) t.appendChild(n); });
    one.appendChild(t);
    if (!peek[s.id] && !readS[s.id]) {
      one.classList.add("hs-veil");
      var b = el("button", "hs-veil-btn", "<span>🗣 이 칸을 한 문장으로 먼저 말해 보고 → 눌러서 확인</span>");
      b.addEventListener("click", function () { one.classList.remove("hs-veil"); b.remove(); peek[s.id] = 1; save(KEY + "-peek", peek); });
      one.appendChild(b);
    }
  });
  // 질문마다 자기 평가
  cards.forEach(function (c) {
    var a = $(".a", c.d) || c.d;
    var r = el("div", "hs-rate", "<span>말해 보니</span>" + ["again", "meh", "ok"].map(function (k) { return '<button data-r="' + k + '">' + RATE[k] + "</button>"; }).join(""));
    r.addEventListener("click", function (e) { var b = e.target.closest("button"); if (b) setRate(c, b.dataset.r); });
    a.appendChild(r); paintCard(c);
  });
  function paintCard(c) {
    var r = rOf(c);
    c.d.classList.remove("r-ok", "r-meh", "r-again"); if (r) c.d.classList.add("r-" + r);
    $$(".hs-rate button", c.d).forEach(function (b) { b.classList.toggle("on", b.dataset.r === r); });
  }

  var cur = null, spy = null;
  function stagesOf(s) {
    var out = [], last = "";
    function push(lbl, ic, node) { if (lbl === last) return; last = lbl; out.push({ l: lbl, i: ic, el: node }); }
    Array.prototype.forEach.call(s.children, function (c) {
      var cl = c.classList;
      if (cl.contains("lv-head")) return;
      if (cl.contains("oneline")) push("한 줄로", "1", c);
      else if (cl.contains("strategy")) push("답의 전략", "♟", c);
      else if (cl.contains("body")) push(out.length < 2 ? "바닥 원리" : "설명", "¶", c);
      else if (c.tagName === "FIGURE") push("구조 그림", "◫", c);
      else if (cl.contains("lab")) { last = ""; push("실험 · " + txt($(".lab-h", c)).replace(/^재현\s*/, "").slice(0, 18), "🧪", c); last = "lab"; }
      else if (cl.contains("code")) push("우리 코드", "‹›", c);
      else if (cl.contains("claim")) push("전시실 대조", "⇄", c);
      else if (cl.contains("honest")) push("정직 표시", "!", c);
      else if (c.tagName === "H3") push(/질문/.test(txt(c)) ? "예상 질문" : txt(c).replace(/^다시 (한다면|넣는다면)\s*·?\s*/, "비교 · ").slice(0, 20), /질문/.test(txt(c)) ? "?" : "⚖", c);
      else if (cl.contains("qa-list")) push(last.indexOf("질문") >= 0 ? last : "예상 질문", "?", c);
      else if (cl.contains("check")) push("면접 전 확인", "☑", c);
      else if (cl.contains("tbl-wrap") && !last) push("표", "▦", c);
    });
    return out;
  }
  function renderRail() {
    railEl.innerHTML = groups.map(function (gr) {
      var ids = gr.ids.filter(function (id) { return order.indexOf(id) >= 0; });
      var extra = gr.ids.filter(function (id) { return S[id].kind === "gloss" || S[id].kind === "drill"; });
      if (!ids.length && !extra.length) return "";
      return '<div class="g">' + esc(gr.name) + "</div>" + ids.map(function (id) {
        var s = S[id], m = s.cards.length ? '<div class="hs-bar"><i class="ok" style="width:' + Math.round(score(s.cards) * 100) + '%"></i></div>' : "";
        return '<button class="hs-ri' + (id === cur ? " on" : "") + '" data-go="' + id + '"><span class="n">' + esc(s.n === "—" ? "·" : s.n) + '</span><span class="t">' + esc(s.title) + '</span><span class="s">' + (readS[id] ? "✓" : "") + "</span>" + m + "</button>";
      }).join("") + extra.map(function (id) {
        var v = S[id].kind === "gloss" ? "gloss" : "practice";
        return '<button class="hs-ri" data-view="' + v + '"><span class="n">→</span><span class="t">' + esc(S[id].title) + '</span><span class="s"></span></button>';
      }).join("");
    }).join("");
  }
  function renderSide() {
    if (!cur) return;
    var s = S[cur], st = stagesOf(s.el), html = "";
    html += '<div class="hs-sbox"><h4>이 칸의 순서<span>' + st.length + "단계</span></h4><div class=\"hs-stages\">" + st.map(function (x, k) { return '<button data-stage="' + k + '"><i>' + x.i + "</i>" + esc(x.l) + "</button>"; }).join("") + "</div></div>";
    if (s.cards.length) {
      var o = counts(s.cards);
      html += '<div class="hs-sbox"><h4>질문 사다리<span>' + o.ok + " / " + s.cards.length + " 자신 있음</span></h4><div class=\"hs-ladder\">" + ["t1", "t2", "t3"].map(function (t) {
        var l = s.cards.filter(function (c) { return c.tier === t; }); if (!l.length) return "";
        return '<div class="row"><span>' + TIER[t] + "</span><div>" + l.map(function (c) { return '<button data-card="' + esc(c.id) + '" title="' + esc(c.q) + '"><i class="d ' + t + " r-" + (rOf(c) || "none") + '"></i></button>'; }).join("") + "</div></div>";
      }).join("") + "</div>" + bar3(s.cards) + '<button class="hs-btn" data-act="tail">🪜 이 칸 꼬리 물기 연습</button></div>';
    }
    if (s.checks.length) {
      var dn = s.checks.filter(function (x) { return x.inp.checked; }).length;
      html += '<div class="hs-sbox"><h4>면접 전 확인<span>' + dn + " / " + s.checks.length + '</span></h4><div class="hs-bar"><i class="ok" style="width:' + pct(dn, s.checks.length) + '%"></i></div><div class="hs-mini">저장소에서 직접 봐야 답할 수 있는 것들이에요.</div><button class="hs-btn" data-jump=".check">확인 항목으로 ↓</button></div>';
    }
    sideEl.innerHTML = html;
    if (spy) spy.disconnect();
    if ("IntersectionObserver" in window) {
      var btns = $$(".hs-stages button", sideEl);
      spy = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { var k = st.findIndex(function (x) { return x.el === e.target; }); btns.forEach(function (b, j) { b.classList.toggle("on", j === k); b.classList.toggle("past", j < k); }); } });
      }, { rootMargin: "-25% 0px -65% 0px" });
      st.forEach(function (x) { spy.observe(x.el); });
    }
    sideEl._stages = st;
  }
  function renderHead() {
    var s = S[cur], k = order.indexOf(cur), prev = order[k - 1], next = order[k + 1];
    var lvk = lvIds.indexOf(cur);
    headEl.innerHTML = "<span>" + esc(s.group || "") + "</span>" + (lvk >= 0 ? "<b>" + (lvk + 1) + " / " + lvIds.length + "</b>" : "") +
      '<div class="hs-bar hs-prog"><i class="acc" style="width:' + pct(lvIds.filter(function (id) { return readS[id]; }).length, lvIds.length) + '%"></i></div>' +
      '<div class="hs-pn"><button class="hs-btn" data-go="' + (prev || "") + '"' + (prev ? "" : " disabled") + '>◀ 이전</button><button class="hs-btn" data-go="' + (next || "") + '"' + (next ? "" : " disabled") + ">다음 ▶</button></div>";
    footEl.innerHTML = (s.kind === "lv" ? '<button class="hs-btn' + (readS[cur] ? " ok" : "") + '" data-act="read">' + (readS[cur] ? "✓ 읽음" : "이 칸 다 읽음") + "</button>" : "") +
      (s.cards.length ? '<button class="hs-btn" data-act="tail">🪜 이 칸 질문으로 연습</button>' : "") +
      (next ? '<button class="hs-btn pri" data-go="' + next + '">다음 칸 · ' + esc(label(next)) + " ▶</button>" : '<button class="hs-btn pri" data-view="practice">🎤 말하기 연습으로 ▶</button>');
  }
  function openSec(id, target) {
    if (!S[id] || order.indexOf(id) < 0) return;
    cur = id;
    secEls.forEach(function (s) { s.classList.toggle("hs-on", s.id === id); });
    try { localStorage.setItem(KEY + "-last", id); history.replaceState(null, "", "#/" + id); } catch (e) {}
    renderRail(); renderHead(); renderSide();
    show("read", true);
    if (target) setTimeout(function () { target.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" }); target.classList.add("hs-flash"); setTimeout(function () { target.classList.remove("hs-flash"); }, 2600); }, 60);
    else window.scrollTo(0, 0);
  }

  /* ── 지도 ── */
  function renderHome() {
    var st = stats(), last = null;
    try { last = localStorage.getItem(KEY + "-last"); } catch (e) {}
    var contId = last && S[last] && order.indexOf(last) >= 0 ? last : (lvIds.filter(function (id) { return !readS[id]; })[0] || order[0]);
    var t = { t1: 0, t2: 0, t3: 0 }; cards.forEach(function (c) { t[c.tier]++; });
    var labs = 0; lvIds.forEach(function (id) { labs += S[id].labs; });
    var terms = glossSec ? $$("dt", glossSec).length : 0;
    var html = '<div class="hs-page"><div class="hs-hero"><div class="hs-hero-l">' +
      '<div class="hs-eyebrow">' + esc(eyebrow) + "</div><h1>" + esc(title) + '</h1><p class="hs-lede">' + (mast && $(".lede", mast) ? $(".lede", mast).innerHTML : "") + "</p>" +
      '<div class="hs-cta">' + (contId ? '<button class="hs-btn pri big" data-go="' + contId + '">▶ ' + (last ? "이어서" : "시작") + " · " + esc(label(contId)) + "</button>" : "") +
      '<button class="hs-btn big" data-act="today">🎤 오늘의 5문제</button>' + (checkItems.length ? '<button class="hs-btn big ghost" data-view="checks">✅ 확인 ' + st.chkLeft + "개 남음</button>" : "") + "</div>" +
      (mast && $(".legend", mast) ? '<div class="hs-legend">' + $(".legend", mast).innerHTML + "</div>" : "") + "</div>" +
      '<div class="hs-hero-r hs-panel"><div class="hs-big"><div class="hs-ring"><svg viewBox="0 0 66 66">' + ring(30, st.ready / 100, 6) + "</svg><b>" + st.ready + "<small>%</small></b></div>" +
      "<p><strong>면접 준비도</strong>칸을 읽고(30%), 질문에 자신 있게 답하고(50%), 확인 항목을 채우면(20%) 올라가요.</p></div>" +
      '<div class="hs-meters">' +
      '<div class="hs-meter"><span>📖 칸 읽음</span><div class="hs-bar"><i class="acc" style="width:' + pct(st.read, lvIds.length) + '%"></i></div><span>' + st.read + " / " + lvIds.length + "</span></div>" +
      '<div class="hs-meter"><span>🎤 질문</span>' + bar3(cards) + "<span>" + st.cnt.ok + " / " + cards.length + "</span></div>" +
      (checkItems.length ? '<div class="hs-meter"><span>✅ 확인</span><div class="hs-bar"><i class="chk" style="width:' + pct(st.chk, checkItems.length) + '%"></i></div><span>' + st.chk + " / " + checkItems.length + "</span></div>" : "") +
      "</div></div></div>" +
      '<div class="hs-tiles">' +
      '<div class="hs-tile hs-panel"><b>' + lvIds.length + "</b><span>칸 · 결정과 기능 하나씩</span></div>" +
      '<div class="hs-tile hs-panel"><b>' + cards.length + '</b><span>예상 질문</span><div class="hs-split"><i class="d t1 r-ok"></i>기본 ' + t.t1 + ' <i class="d t2 r-ok" style="background:var(--accent)"></i>꼬리 ' + t.t2 + ' <i class="d t3" style="background:var(--bad)"></i>압박 ' + t.t3 + "</div></div>" +
      '<div class="hs-tile hs-panel"><b>' + labs + "</b><span>눌러 보는 재현 실험</span></div>" +
      '<div class="hs-tile hs-panel"><b>' + (terms || checkItems.length) + "</b><span>" + (terms ? "용어 사전" : "면접 전 확인") + "</span></div></div>";
    if (howto) {
      var boxes = $$(".strategy .box", S[howto].el);
      if (boxes.length) html += '<div class="hs-h"><h2>🧭 답하는 법</h2><span class="hs-sub">칸에 들어가기 전에 한 번</span><button class="hs-link" data-go="' + howto + '">전체 보기 →</button></div><div class="hs-strat">' +
        boxes.map(function (b, k) { var hh = $(".h", b), body = b.cloneNode(true), x = $(".h", body); if (x) x.remove(); return '<button data-go="' + howto + '" data-sel=".strategy .box:nth-child(' + (k + 1) + ')"><b>' + esc(txt(hh)) + '</b><div class="x">' + body.innerHTML + "</div></button>"; }).join("") + "</div>";
    }
    html += '<div class="hs-h"><h2>🗺️ 칸 지도</h2><span class="hs-sub">카드를 누르면 그 칸으로</span><div class="hs-key"><span><i class="d t1 r-none"></i>기본</span><span><i class="d t2 r-none"></i>꼬리</span><span><i class="d t3 r-none"></i>압박</span><span><i class="d r-again"></i>다시</span><span><i class="d r-meh"></i>애매</span><span><i class="d r-ok"></i>자신 있음</span></div></div>';
    groups.forEach(function (gr) {
      var ids = gr.ids.filter(function (id) { return S[id].kind === "lv"; }); if (!ids.length) return;
      html += '<div class="hs-group">' + (groups.length > 1 ? '<div class="hs-group-h">' + esc(gr.name) + "</div>" : "") + '<div class="hs-grid">' + ids.map(function (id) {
        var s = S[id], dn = s.checks.filter(function (x) { return x.inp.checked; }).length;
        return '<button class="hs-lvcard' + (readS[id] ? " done" : "") + (s.star ? " star" : "") + '" data-go="' + id + '"><div class="top"><span class="n">' + esc(s.n) + "</span>" +
          (s.by ? '<span class="hs-by' + (s.by.me ? " me" : "") + '">' + esc(s.by.text) + "</span>" : "") + '<span class="st">' + (readS[id] ? "✓ 읽음" : "") + "</span></div>" +
          "<h3>" + esc(s.title) + '</h3><p class="one">' + esc(s.one) + "</p>" +
          '<div class="meta">' + (s.labs ? "<span>🧪 실험 " + s.labs + "</span>" : "") + (s.codes ? "<span>‹› 코드 " + s.codes + "</span>" : "") + (s.checks.length ? "<span>☑ " + dn + "/" + s.checks.length + "</span>" : "") + "</div>" +
          (s.cards.length ? '<div class="dots">' + dots(s.cards) + "</div>" + bar3(s.cards) : "") + "</button>";
      }).join("") + "</div></div>";
    });
    V.home.innerHTML = html + "</div>";
  }

  /* ── 말하기 연습 ── */
  var P = { mode: "shuffle", tiers: { t1: true, t2: true, t3: true }, weak: false, secs: {}, timer: 0, count: 5 };
  var sess = null, tick = null;
  function poolOf() {
    return cards.filter(function (c) {
      if (!P.tiers[c.tier]) return false;
      var any = Object.keys(P.secs).some(function (k) { return P.secs[k]; });
      if (any && !P.secs[c.sid]) return false;
      if (P.weak && rOf(c) === "ok") return false;
      return true;
    });
  }
  function prio(c) { var r = rOf(c); return (r === "again" ? 4 : r === "" ? 3 : r === "meh" ? 2.5 : 1) * (0.5 + Math.random()); }
  function weakest() {
    var cand = lvIds.filter(function (id) { return S[id].cards.length >= 2; });
    var any = Object.keys(P.secs).filter(function (k) { return P.secs[k] && S[k] && S[k].cards.length; });
    if (any.length) cand = any;
    cand = shuffle(cand).sort(function (a, b) { return score(S[a].cards) - score(S[b].cards); });
    return cand[0];
  }
  function startSession(list, mode, timer) {
    if (!list.length) { P.empty = true; sess = null; show("practice", true); renderPractice(); return; }
    sess = { list: list, i: 0, shown: false, res: {}, mode: mode, timer: timer || 0 };
    show("practice", true); renderPractice(); window.scrollTo(0, 0);
  }
  function startFrom(mode, sid) {
    var n = P.count === "all" ? 999 : +P.count, list;
    if (mode === "tail") {
      sid = sid || weakest(); if (!sid) return;
      list = ["t1", "t2", "t3"].reduce(function (a, t) { return a.concat(S[sid].cards.filter(function (c) { return c.tier === t; })); }, []);
      return startSession(list, "tail", P.timer);
    }
    var pool = poolOf();
    if (mode === "pressure") {
      list = pool.slice().sort(function (a, b) { return (prio(b) + (b.tier === "t3" ? 2 : b.tier === "t2" ? 1 : 0)) - (prio(a) + (a.tier === "t3" ? 2 : a.tier === "t2" ? 1 : 0)); }).slice(0, Math.min(n, 999));
      return startSession(list, "pressure", P.timer || 45);
    }
    list = pool.slice().sort(function (a, b) { return prio(b) - prio(a); }).slice(0, n);
    startSession(shuffle(list), "shuffle", P.timer);
  }
  function stopTick() { if (tick) { clearInterval(tick); tick = null; } }
  function renderPractice() {
    stopTick();
    var left;
    if (!sess) left = practiceSetup();
    else if (sess.i >= sess.list.length) left = practiceSummary();
    else left = practiceCard();
    V.practice.innerHTML = '<div class="hs-page"><div class="hs-pgrid"><div>' + left + '</div><aside class="hs-pside">' + practiceSide() + "</aside></div></div>";
    if (sess && sess.i < sess.list.length && sess.timer && !sess.shown) startTick();
  }
  function practiceSetup() {
    var modes = [["shuffle", "🃏", "카드 섞기", "약한 질문을 먼저 섞어서. 칸을 가리지 않고 넓게 훑어요."], ["tail", "🪜", "꼬리 물기", "한 칸을 골라 기본 → 꼬리 → 압박 순서로 끝까지 파고들어요."], ["pressure", "🔥", "압박 면접", "꼬리 · 압박 위주로, 시간 제한을 걸고 몰아쳐요."]];
    var pool = poolOf();
    return '<div class="hs-h" style="margin-top:6px"><h2>🎤 말하기 연습</h2><span class="hs-sub">질문을 보고 소리 내 답한 뒤, 답을 열어 비교하고 스스로 평가해요</span></div>' +
      '<div class="hs-modes">' + modes.map(function (m) { return '<button class="hs-mode" data-mode="' + m[0] + '" aria-pressed="' + (P.mode === m[0]) + '"><span class="e">' + m[1] + "</span><b>" + m[2] + "</b><span>" + m[3] + "</span></button>"; }).join("") + "</div>" +
      '<div class="hs-opts hs-panel">' +
      (P.mode !== "tail" ? '<div class="hs-opt"><span>단계</span><div>' + ["t1", "t2", "t3"].map(function (t) { return '<button class="hs-chip" data-tier="' + t + '" aria-pressed="' + P.tiers[t] + '">' + TIER[t] + "</button>"; }).join("") + '<button class="hs-chip" data-weak aria-pressed="' + P.weak + '">자신 있음 빼기</button></div></div>' : "") +
      '<div class="hs-opt"><span>' + (P.mode === "tail" ? "칸 (하나)" : "칸") + "</span><div>" + lvIds.filter(function (id) { return S[id].cards.length; }).map(function (id) { return '<button class="hs-chip" data-sec="' + id + '" aria-pressed="' + !!P.secs[id] + '">' + esc(label(id)) + "</button>"; }).join("") + "</div></div>" +
      (P.mode !== "tail" ? '<div class="hs-opt"><span>문제 수</span><div>' + [5, 10, "all"].map(function (k) { return '<button class="hs-chip" data-count="' + k + '" aria-pressed="' + (String(P.count) === String(k)) + '">' + (k === "all" ? "전부" : k + "개") + "</button>"; }).join("") + "</div></div>" : "") +
      '<div class="hs-opt"><span>시간 제한</span><div>' + [0, 30, 45, 60].map(function (k) { return '<button class="hs-chip" data-timer="' + k + '" aria-pressed="' + (P.timer === k) + '">' + (k ? k + "초" : "없음") + "</button>"; }).join("") + "</div></div></div>" +
      '<div class="hs-start"><button class="hs-btn pri big" data-act="start">▶ 시작</button><span class="hs-mini">' +
      (P.empty ? (P.empty = false, '<b style="color:var(--bad)">이 조건에 맞는 질문이 없어요. 단계나 칸을 넓혀 보세요.</b> ') : "") +
      (P.mode === "tail" ? "칸을 고르지 않으면 가장 약한 칸으로 시작해요." : "지금 조건에 맞는 질문 " + pool.length + "개 · 다시 → 안 봄 → 애매 순으로 먼저 나와요.") + "</span></div>";
  }
  function practiceCard() {
    var c = sess.list[sess.i], s = S[c.sid] || { n: "", title: "" };
    var mname = { shuffle: "🃏 카드 섞기", tail: "🪜 꼬리 물기", pressure: "🔥 압박 면접", single: "🎯 한 문제" }[sess.mode];
    return '<div class="hs-panel hs-sess"><div class="hs-sess-top"><b>' + mname + "</b><span>" + (sess.i + 1) + " / " + sess.list.length + '</span><div class="dots">' +
      sess.list.map(function (x, k) { var r = sess.res[x.id]; return '<i class="d ' + x.tier + " r-" + (r || "none") + (k === sess.i ? " cur" : "") + '"></i>'; }).join("") + '</div><button class="hs-link" data-act="quit">그만하기 ✕</button></div>' +
      '<div class="hs-qbox"><div><div class="crumb"><span class="hs-tier ' + c.tier + '">' + TIER[c.tier] + "</span>" + esc(label(c.sid)) + (rOf(c) ? " · 지난번 " + RATE[rOf(c)] : "") + '</div><div class="q">' + esc(c.q) + "</div></div>" +
      (sess.timer ? '<div class="hs-timer"><svg class="hs-ring" viewBox="0 0 76 76">' + ring(34, 1, 5) + "</svg><b>" + sess.timer + "</b></div>" : "") + "</div>" +
      (sess.shown ? '<div class="hs-ansbox">' + c.ans + (c.tip ? '<div class="tip">' + c.tip + "</div>" : "") + "</div>" : "") +
      '<div class="hs-sess-acts">' + (sess.shown ?
        '<div class="hs-rates"><button data-r="again">😵 못함<span class="k">1</span></button><button data-r="meh">🤔 애매<span class="k">2</span></button><button data-r="ok">😎 됨<span class="k">3</span></button></div>' :
        '<button class="hs-btn ink big" data-act="reveal">답 보기 <span class="k">Space</span></button><span class="hs-mini" style="color:var(--muted);font-size:13px">' + (sess.timer ? "시계가 끝나기 전에" : "먼저 소리 내서 30초 안에") + ' 답해 보세요.</span><button class="hs-link" data-go="' + c.sid + '" data-card-jump="' + esc(c.id) + '" style="margin-left:auto">칸에서 보기 →</button>') + "</div></div>";
  }
  function startTick() {
    var box = $(".hs-timer", V.practice); if (!box) return;
    var total = sess.timer, t0 = Date.now(), circ = 2 * Math.PI * 34, fg = $(".fg", box), b = $("b", box);
    tick = setInterval(function () {
      var leftS = Math.max(0, total - (Date.now() - t0) / 1000);
      fg.setAttribute("stroke-dasharray", (circ * leftS / total).toFixed(1) + " " + circ.toFixed(1));
      b.textContent = leftS > 0 ? Math.ceil(leftS) : "시간 끝";
      box.classList.toggle("low", leftS <= 10); box.classList.toggle("up", leftS <= 0);
      if (leftS <= 0) stopTick();
    }, 200);
  }
  function practiceSummary() {
    var o = { again: 0, meh: 0, ok: 0 }; sess.list.forEach(function (c) { var r = sess.res[c.id]; if (r) o[r]++; });
    var redo = sess.list.filter(function (c) { return sess.res[c.id] !== "ok"; });
    return '<div class="hs-panel hs-sum"><div class="hs-h" style="margin:0"><h2>🏁 끝! 이번 판 결과</h2></div>' +
      '<div class="hs-sum-n"><div class="again"><b>' + o.again + '</b>😵 다시</div><div class="meh"><b>' + o.meh + '</b>🤔 애매</div><div class="ok"><b>' + o.ok + "</b>😎 자신 있음</div></div>" +
      '<div class="hs-sum-list">' + sess.list.map(function (c) { var r = sess.res[c.id] || ""; return '<button data-go="' + c.sid + '" data-card-jump="' + esc(c.id) + '"><i class="d ' + c.tier + " r-" + (r || "none") + '"></i><span>' + esc(c.q) + "</span><small>" + esc(S[c.sid] ? S[c.sid].n : "") + " · " + TIER[c.tier] + "</small></button>"; }).join("") + "</div>" +
      '<div class="hs-start">' + (redo.length ? '<button class="hs-btn pri big" data-act="redo">↻ 다시 · 애매만 한 번 더 (' + redo.length + ")</button>" : "") + '<button class="hs-btn big" data-act="setup">처음으로</button></div></div>';
  }
  function practiceSide() {
    var o = counts(cards), n = cards.length || 1;
    return '<div class="hs-panel"><h4>질문 ' + cards.length + "개 · 자신감</h4>" + bar3(cards) +
      '<div class="hs-counts"><div><b>' + o.ok + "</b>자신 있음</div><div><b>" + o.meh + "</b>애매</div><div><b>" + o.again + "</b>다시</div><div><b>" + o.none + "</b>안 봄</div></div></div>" +
      '<div class="hs-panel"><h4>질문 지도 · 칸 × 질문<button class="hs-link" data-act="reset">평가 초기화</button></h4><div class="hs-hm">' +
      lvIds.filter(function (id) { return S[id].cards.length; }).map(function (id) {
        return '<div class="hs-hm-row"><span title="' + esc(S[id].title) + '">' + esc(S[id].n) + "</span><div>" + S[id].cards.map(function (c) { return '<button class="hs-cell ' + c.tier + " r-" + (rOf(c) || "none") + '" data-one="' + esc(c.id) + '" data-tip="' + esc(TIER[c.tier] + " · " + c.q) + '"></button>'; }).join("") + "</div></div>";
      }).join("") + '</div><div class="hs-key" style="margin-top:12px"><span>칸을 누르면 그 질문 하나만 연습</span></div></div>';
  }
  function rateNow(r) {
    var c = sess.list[sess.i]; sess.res[c.id] = r; setRate(c, r); sess.i++; sess.shown = false; renderPractice();
  }

  /* ── 용어 ── */
  var gq = "", gveil = false, terms = null;
  function buildTerms() {
    terms = [];
    if (!glossSec) return;
    var dts = $$("dt", glossSec);
    dts.forEach(function (dt) {
      var dd = dt.nextElementSibling && dt.nextElementSibling.tagName === "DD" ? dt.nextElementSibling : null;
      var name = txt(dt), keys = name.split(/\s*[\/·]\s*/).map(function (k) { return k.replace(/\(.*?\)|（.*?）/g, "").trim(); }).filter(function (k) { return k.length >= 2; });
      var where = lvIds.filter(function (id) { var tx = S[id].el.textContent.toLowerCase(); return keys.some(function (k) { return tx.indexOf(k.toLowerCase()) >= 0; }); });
      terms.push({ name: name, dd: dd ? dd.innerHTML : "", where: where, low: (name + " " + (dd ? txt(dd) : "")).toLowerCase() });
    });
  }
  function renderGloss() {
    if (!terms) buildTerms();
    var head = '<div class="hs-page"><div class="hs-h" style="margin-top:6px"><h2>📚 용어 사전</h2><span class="hs-sub">문서에 나온 순서대로 · 뜻을 가리고 먼저 말해 보기</span></div>' +
      '<div class="hs-gtools"><input class="hs-search" type="search" placeholder="용어나 뜻으로 찾기" value="' + esc(gq) + '"><button class="hs-chip" data-act="veil" aria-pressed="' + gveil + '">🙈 뜻 가리기</button><span class="hs-mini"></span></div><div class="hs-terms' + (gveil ? " veil" : "") + '"></div></div>';
    if (!$(".hs-terms", V.gloss)) {
      V.gloss.innerHTML = head;
      $(".hs-search", V.gloss).addEventListener("input", function (e) { gq = e.target.value.trim().toLowerCase(); fillTerms(); });
    }
    $(".hs-terms", V.gloss).classList.toggle("veil", gveil);
    $("[data-act=veil]", V.gloss).setAttribute("aria-pressed", gveil);
    fillTerms();
    function fillTerms() {
      var l = terms.filter(function (t) { return !gq || t.low.indexOf(gq) >= 0; });
      $(".hs-mini", V.gloss).textContent = l.length + " / " + terms.length + "개";
      $(".hs-terms", V.gloss).innerHTML = l.length ? l.map(function (t) {
        return '<div class="hs-term" tabindex="0"><b>' + esc(t.name) + '</b><div class="dd">' + t.dd + "</div>" + (t.where.length ? '<div class="where">' + t.where.slice(0, 5).map(function (id) { return '<span data-go="' + id + '" title="' + esc(S[id].title) + '">' + esc(S[id].n) + "</span>"; }).join("") + "</div>" : "") + "</div>";
      }).join("") : '<div class="hs-empty">찾는 용어가 없어요.</div>';
    }
  }

  /* ── 면접 전 확인 ── */
  var conly = false;
  function renderChecks() {
    var st = stats();
    var html = '<div class="hs-page"><div class="hs-h" style="margin-top:6px"><h2>✅ 면접 전 확인</h2><span class="hs-sub">저장소를 직접 열어 봐야 답할 수 있는 것들. 체크는 이 브라우저에 저장돼요</span></div>' +
      '<div class="hs-panel hs-chk-top"><div><b>' + st.chk + " / " + checkItems.length + '</b> <span style="color:var(--muted)">확인 완료</span><div class="hs-bar"><i class="ok" style="width:' + pct(st.chk, checkItems.length) + '%"></i></div></div>' +
      '<div><button class="hs-chip" data-act="conly" aria-pressed="' + conly + '">남은 것만 보기</button></div></div>';
    order.forEach(function (id) {
      var s = S[id]; if (!s.checks.length) return;
      var l = conly ? s.checks.filter(function (x) { return !x.inp.checked; }) : s.checks; if (!l.length) return;
      var dn = s.checks.filter(function (x) { return x.inp.checked; }).length;
      html += '<div class="hs-panel hs-chk-g"><div class="gh"><span class="n">' + esc(s.n) + "</span><b>" + esc(s.title) + "</b><small>" + dn + " / " + s.checks.length + '</small><button class="hs-link" data-go="' + id + '" data-sel=".check">칸에서 보기 →</button></div>' +
        l.map(function (x) { return '<button class="hs-ci' + (x.inp.checked ? " done" : "") + '" data-chk="' + esc(x.key) + '"><i>' + (x.inp.checked ? "✓" : "") + "</i><span>" + x.html + "</span></button>"; }).join("") + "</div>";
    });
    if (conly && !st.chkLeft) html += '<div class="hs-empty">🎉 전부 확인했어요.</div>';
    V.checks.innerHTML = html + "</div>";
  }

  /* ── 화면 전환 · 갱신 ── */
  var view = null;
  function show(v, quiet) {
    if (!V[v]) v = "home";
    view = v;
    $$(".hs-tabs button", top).forEach(function (b) { b.classList.toggle("on", b.dataset.view === v); });
    Object.keys(V).forEach(function (k) { V[k].classList.toggle("on", k === v); });
    if (v === "read" && !cur) { openSec(order[0]); return; }
    if (v !== "read") { try { history.replaceState(null, "", v === "home" ? location.pathname + location.search : "#/" + v); } catch (e) {} }
    if (!quiet || v !== "read") renderView();
    if (!quiet) window.scrollTo(0, 0);
  }
  function renderView() {
    if (view === "home") renderHome();
    else if (view === "practice") renderPractice();
    else if (view === "gloss") renderGloss();
    else if (view === "checks") renderChecks();
  }
  function refresh() {
    var st = stats();
    $(".hs-ready svg", top).innerHTML = ring(15, st.ready / 100, 3.5);
    $(".hs-ready b", top).textContent = st.ready + "%";
    var cb = $('[data-view="checks"] em', top); if (cb) { cb.hidden = !st.chkLeft; cb.textContent = st.chkLeft; }
    $$(".check").forEach(function (box) {
      var p = $(".prog", box), ins = $$("input[type=checkbox]", box);
      if (p) p.textContent = ins.filter(function (x) { return x.checked; }).length + " / " + ins.length;
    });
    if (cur) { renderRail(); renderHead(); if (view === "read") { var y = sideEl.scrollTop; renderSide(); sideEl.scrollTop = y; } }
    if (view === "home") renderHome();
    else if (view === "checks") renderChecks();
    else if (view === "practice" && !sess) renderPractice();
    else if (view === "practice") { var side = $(".hs-pside", V.practice); if (side) side.innerHTML = practiceSide(); }
  }
  function jumpCard(id) {
    var c = C[id]; if (!c) return;
    openSec(c.sid, c.d); c.d.open = true;
  }

  /* ── 클릭 하나로 모두 처리 ── */
  app.addEventListener("click", function (e) {
    var t = e.target.closest("button,[data-go],a[href^='#'],.hs-term");
    if (!t || !app.contains(t)) return;
    var d = t.dataset;
    if (t.tagName === "A") {
      var id = t.getAttribute("href").slice(1), tg = document.getElementById(id);
      if (!tg) return;
      e.preventDefault();
      if (S[id] && S[id].kind === "gloss") return show("gloss");
      if (S[id] && S[id].kind === "drill") return show("practice");
      var sec = tg.closest(".lv"); if (sec && S[sec.id]) openSec(sec.id, S[id] ? null : tg);
      return;
    }
    if (d.cardJump) { stopTick(); return jumpCard(d.cardJump); }
    if (d.go !== undefined) { if (!d.go) return; var target = d.sel ? $(d.sel, S[d.go] && S[d.go].el) : null; stopTick(); return openSec(d.go, target); }
    if (d.view) { stopTick(); return show(d.view); }
    if (d.card) return jumpCard(d.card);
    if (d.stage !== undefined && sideEl._stages) { var x = sideEl._stages[+d.stage]; if (x) x.el.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" }); return; }
    if (d.jump && cur) { var j = $(d.jump, S[cur].el); if (j) { j.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" }); j.classList.add("hs-flash"); } return; }
    if (d.mode) { P.mode = d.mode; if (d.mode === "tail") { var one = Object.keys(P.secs).filter(function (k) { return P.secs[k]; })[0]; P.secs = {}; if (one) P.secs[one] = true; } return renderPractice(); }
    if (d.tier) { P.tiers[d.tier] = !P.tiers[d.tier]; return renderPractice(); }
    if (d.weak !== undefined) { P.weak = !P.weak; return renderPractice(); }
    if (d.sec) { var on = !P.secs[d.sec]; if (P.mode === "tail") P.secs = {}; P.secs[d.sec] = on; return renderPractice(); }
    if (d.count) { P.count = d.count === "all" ? "all" : +d.count; return renderPractice(); }
    if (d.timer !== undefined) { P.timer = +d.timer; return renderPractice(); }
    if (d.one) return startSession([C[d.one]], "single", P.timer);
    if (d.r && sess && sess.shown) return rateNow(d.r);
    if (d.chk) { var it = checkItems.filter(function (x) { return x.key === d.chk; })[0]; if (it) { it.inp.checked = !it.inp.checked; it.inp.dispatchEvent(new Event("change")); } return; }
    if (t.classList.contains("hs-term")) { t.classList.toggle("open"); return; }
    switch (d.act) {
      case "theme":
        var dark = document.documentElement.getAttribute("data-theme") === "dark" || (!document.documentElement.getAttribute("data-theme") && matchMedia("(prefers-color-scheme: dark)").matches);
        document.documentElement.setAttribute("data-theme", dark ? "light" : "dark");
        try { localStorage.setItem("hs-theme", dark ? "light" : "dark"); } catch (er) {}
        return;
      case "read": readS[cur] = !readS[cur]; save(KEY + "-read", readS); return refresh();
      case "tail": stopTick(); return startFrom("tail", cur);
      case "today": P.mode = "shuffle"; P.tiers = { t1: true, t2: true, t3: true }; P.secs = {}; P.weak = false; P.count = 5; return startFrom("shuffle");
      case "start": return startFrom(P.mode, Object.keys(P.secs).filter(function (k) { return P.secs[k]; })[0]);
      case "reveal": sess.shown = true; return renderPractice();
      case "quit": sess.i = sess.list.length; stopTick(); return renderPractice();
      case "setup": sess = null; return renderPractice();
      case "redo": var rl = sess.list.filter(function (c) { return sess.res[c.id] !== "ok"; }); return startSession(rl, sess.mode, sess.timer);
      case "reset":
        // 뷰어 안에서는 confirm() 이 막혀 있어서 두 번 누르게 한다
        if (!t.dataset.armed) { t.dataset.armed = 1; t.textContent = "한 번 더 누르면 지워요"; setTimeout(function () { if (t.isConnected) { delete t.dataset.armed; t.textContent = "평가 초기화"; } }, 3000); return; }
        rate = {}; save(DRILL_KEY, rate); cards.forEach(paintCard); refresh(); renderPractice();
        return;
      case "veil": gveil = !gveil; return renderGloss();
      case "conly": conly = !conly; return renderChecks();
    }
  });
  // 질문 지도 칸 위 말풍선
  var tipBox = el("div", "hs-tipbox"); tipBox.hidden = true; app.appendChild(tipBox);
  app.addEventListener("mouseover", function (e) {
    var t = e.target.closest("[data-tip]"); if (!t) { tipBox.hidden = true; return; }
    tipBox.textContent = t.dataset.tip; tipBox.hidden = false;
    var r = t.getBoundingClientRect(); tipBox.style.left = Math.max(8, Math.min(innerWidth - 350, r.left - 160)) + "px"; tipBox.style.top = (r.bottom + 8) + "px";
  });
  // 끝까지 내려오면 읽음
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting && view === "read" && cur && S[cur].kind === "lv" && !readS[cur] && document.documentElement.scrollHeight > innerHeight * 1.3) { readS[cur] = 1; save(KEY + "-read", readS); refresh(); } });
  }, { rootMargin: "0px 0px -10% 0px" }).observe(footEl);
  // 키보드
  document.addEventListener("keydown", function (e) {
    var tg = e.target;
    if ((tg && tg.closest && tg.closest("input,textarea,select,[contenteditable]")) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (view === "practice" && sess && sess.i < sess.list.length) {
      if ((e.key === " " || e.key === "Enter") && !sess.shown) { e.preventDefault(); sess.shown = true; stopTick(); renderPractice(); }
      else if (sess.shown && (e.key === "1" || e.key === "2" || e.key === "3")) { e.preventDefault(); rateNow(["again", "meh", "ok"][+e.key - 1]); }
    } else if (view === "read" && cur && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      var k = order.indexOf(cur) + (e.key === "ArrowRight" ? 1 : -1); if (order[k]) { e.preventDefault(); openSec(order[k]); }
    }
  });
  // 답 보기 누르면 시계 멈춤
  V.practice.addEventListener("click", function (e) { if (e.target.closest("[data-act=reveal]")) stopTick(); }, true);

  // 처음 화면: 주소의 #/칸 → 그 칸, #/보기 → 그 화면, 없으면 지도. (#/ 를 붙여 브라우저가 스스로 그 요소로 스크롤하지 않게)
  var h0 = decodeURIComponent((location.hash || "").slice(1)).replace(/^\//, ""), t0 = h0 && document.getElementById(h0);
  refresh();
  if (V[h0]) show(h0);
  else if (t0 && S[h0] && order.indexOf(h0) >= 0) openSec(h0);
  else if (t0 && t0.closest(".lv") && S[t0.closest(".lv").id]) openSec(t0.closest(".lv").id, t0);
  else show("home");
  window.HS = { show: show, openSec: openSec, startFrom: startFrom, P: P, cards: cards, S: S, order: order };
})();
