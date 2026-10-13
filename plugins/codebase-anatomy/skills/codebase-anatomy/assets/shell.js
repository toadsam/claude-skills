/* ═══ as-shell: 해부도 화면 껍데기 ═══
   kit 이 장(section[data-nav])과 컴포넌트를 다 그린 뒤에 돈다(문서 맨 끝). 내용은 건드리지 않고
   화면 여섯 개(지도 · 장 읽기 · 결함 보드 · 퀴즈 · 용어)와 요청 추적기 레인 그림을 얹는다.
   scripts/upgrade.js 가 <script id="as-runtime" data-key=…> 로 넣는다. 데이터는 kit 의 전역 배열을 읽는다. */
(function () {
  "use strict";
  var me = document.currentScript || document.getElementById("as-runtime");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function txt(e) { return e ? e.textContent.replace(/\s+/g, " ").trim() : ""; }
  function el(t, c, h) { var e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  // 문서 작성자가 쓴 설명은 HTML(<b>, <code>)을 품고 있을 수 있다. 태그가 보이면 그대로, 아니면 이스케이프
  function rich(s) { s = String(s == null ? "" : s); return /<\/?(b|code|em|strong|br|span|i|a)\b/.test(s) ? s : esc(s); }
  function pct(a, b) { return b ? Math.round(a / b * 100) : 0; }
  function arr(name) { var v = window[name]; return Array.isArray(v) ? v : []; }
  function obj(name) { var v = window[name]; return v && typeof v === "object" && !Array.isArray(v) ? v : {}; }
  function ring(r, p, w) { var c = 2 * Math.PI * r, o = r + w; return '<circle class="bg" cx="' + o + '" cy="' + o + '" r="' + r + '" stroke-width="' + w + '"/><circle class="fg" cx="' + o + '" cy="' + o + '" r="' + r + '" stroke-width="' + w + '" stroke-dasharray="' + (c * Math.max(0, Math.min(1, p))).toFixed(1) + " " + c.toFixed(1) + '"/>'; }

  var main = $("main.main"), shell = $(".shell");
  if (!main || !shell) return;
  var title = document.title || txt($("h1", main)) || "해부도";
  var KEY = (me && me.dataset.key) || "as-" + title.replace(/\s+/g, "-");
  function load(k, d) { try { var v = JSON.parse(localStorage.getItem(KEY + "-" + k)); return v == null ? d : v; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(KEY + "-" + k, JSON.stringify(v)); } catch (e) {} }

  /* ── 문서 읽기 ── */
  var FIND = arr("FINDINGS"), QUIZ = arr("QUIZ"), GOOD = arr("GOOD"), TL = arr("TIMELINE"), TRACES = arr("TRACES"), GLOSS = obj("GLOSSARY");
  var secs = $$("section[data-nav]", main).filter(function (s) { return s.parentNode === main; });
  var S = {}, order = [];
  var TAGS = [["#trTabs", "🚦 요청 추적기"], ["#lxStack", "🗂 레이어 탐색기"], ["#cc", "💡 개념 카드"], ["#jwtTabs", "🔑 토큰 해부기"], ["#atkTabs", "🗡 공격 시나리오"],
    ["#calcIn", "🧮 계산기"], ["#tl", "📈 커밋 그래프"], ["#erd", "🧱 데이터 모델"], ["#apimap", "🗺 API 지도"], [".dep", "🕸 의존 그래프"], [".bld", "🪜 처음부터"],
    ["#fx", "⚠️ 결함 목록"], ["#good", "✅ 잘 된 것"], ["#qz", "🧠 퀴즈"], ["#glossary", "📚 용어"], [".rcp", "📝 실습"], [".wb", "📝 문제집"]];
  secs.forEach(function (s, i) {
    if (!s.id) s.id = "as-sec-" + i;
    var eb = txt($(".eyebrow", s)), h = $("h2", s) || $("h1", s);
    S[s.id] = { id: s.id, el: s, i: i, n: String(i).padStart(2, "0"), nav: s.dataset.nav || txt(h), title: txt(h), cat: eb.replace(/^\s*\d+\s*—\s*/, ""),
      tags: TAGS.filter(function (t) { return $(t[0], s); }).map(function (t) { return t[1]; }),
      terms: Array.from(new Set($$(".term[data-t]", s).map(function (t) { return t.dataset.t; }))).filter(function (k) { return GLOSS[k]; }) };
    order.push(s.id);
  });
  var hero = secs[0], readable = order.slice(1);

  var readS = load("read", {}), fxS = load("fx", {}), qz = load("quiz", {});
  function qOk(i) { return qz[i] != null && QUIZ[i] && +qz[i] === QUIZ[i].a; }
  function stats() {
    var read = readable.filter(function (id) { return readS[id]; }).length;
    var qa = Object.keys(qz).filter(function (k) { return QUIZ[k]; }).length, qc = QUIZ.filter(function (q, i) { return qOk(i); }).length;
    var fr = FIND.filter(function (f) { return fxS[f.id]; }).length, ff = FIND.filter(function (f) { return fxS[f.id] === "fix"; }).length;
    var parts = [[readable.length ? read / readable.length : 0, 0.4]];
    if (QUIZ.length) parts.push([qc / QUIZ.length, 0.4]);
    if (FIND.length) parts.push([fr / FIND.length, 0.2]);
    var w = parts.reduce(function (a, p) { return a + p[1]; }, 0), v = parts.reduce(function (a, p) { return a + p[0] * p[1]; }, 0);
    return { read: read, qa: qa, qc: qc, fr: fr, ff: ff, ready: w ? Math.round(v / w * 100) : 0 };
  }

  /* ── 틀 ── */
  var VIEWS = [["home", "🗺️", "지도"], ["read", "📖", "장 읽기"]];
  if (FIND.length) VIEWS.push(["fx", "⚠️", "결함 보드"]);
  if (QUIZ.length) VIEWS.push(["quiz", "🧠", "퀴즈"]);
  if (Object.keys(GLOSS).length) VIEWS.push(["gloss", "📚", "용어"]);
  document.body.classList.add("as");
  try { var th = localStorage.getItem("as-theme"); if (th) document.documentElement.setAttribute("data-theme", th); } catch (e) {}
  var app = el("div", "as-app");
  var short = title.replace(/\s*해부도$/, "");
  var top = el("header", "as-top",
    '<button class="as-brand" data-view="home"><span class="as-logo">' + esc(short.replace(/[^A-Za-z0-9가-힣]/g, "").slice(0, 2).toUpperCase()) + "</span><span><b>" + esc(title) + "</b><small>" + esc(txt($(".hero-sub", hero))) + "</small></span></button>" +
    '<nav class="as-tabs">' + VIEWS.map(function (v) { return '<button data-view="' + v[0] + '">' + v[1] + " " + v[2] + "<em hidden></em></button>"; }).join("") + "</nav>" +
    '<div class="as-top-r"><button class="as-ready" data-view="home" title="이해도 = 장 읽음 + 퀴즈 정답 + 결함 확인">이해도 <svg class="as-ring" viewBox="0 0 34 34"></svg><b></b></button><button class="as-icon" data-act="theme" title="밝게 / 어둡게">◐</button></div>');
  app.appendChild(top);
  var V = {};
  VIEWS.forEach(function (v) { V[v[0]] = app.appendChild(el("div", "as-view")); });
  document.body.insertBefore(app, document.body.firstChild);

  /* ── 장 읽기 틀 ── */
  V.read.innerHTML = '<div class="as-readgrid"><aside class="as-rail"></aside><div class="as-center"><div class="as-sechead"></div><div class="as-host"></div><div class="as-foot"></div></div><aside class="as-side"></aside></div>';
  $(".as-host", V.read).appendChild(main);
  var railEl = $(".as-rail", V.read), sideEl = $(".as-side", V.read), headEl = $(".as-sechead", V.read), footEl = $(".as-foot", V.read);
  var cur = null, spy = null, view = null;
  function stagesOf(s) {
    return $$("h3, .panel-title, .callout > h4, .tabs[id]:not(#trTabs)", s).filter(function (e) { return !e.closest(".as-lanes"); }).map(function (e) {
      var target = e.classList.contains("panel-title") ? e.closest(".panel") : e.classList.contains("tabs") ? e : e.tagName === "H4" ? e.parentNode : e;
      var lbl = e.classList.contains("tabs") ? "탭 · " + (e.id === "jwtTabs" ? "토큰 해부기" : e.id === "atkTabs" ? "공격 시나리오" : "선택") : txt(e);
      return { l: lbl.slice(0, 38), el: target, k: e.tagName === "H3" ? "§" : e.tagName === "H4" ? "!" : "▣" };
    }).filter(function (x, i, a) { return !a.slice(0, i).some(function (y) { return y.el === x.el; }); });
  }
  function renderRail() {
    railEl.innerHTML = order.map(function (id) {
      var s = S[id];
      return '<button class="as-ri' + (id === cur ? " on" : "") + '" data-go="' + id + '"><span class="n">' + s.n + "</span><span>" + esc(s.nav) + '</span><span class="s">' + (readS[id] ? "✓" : "") + "</span></button>";
    }).join("");
  }
  function renderSide() {
    var s = S[cur], st = stagesOf(s.el), h = "";
    if (st.length) h += '<div class="as-sbox"><h4>이 장의 순서<span>' + st.length + '</span></h4><div class="as-stages">' + st.map(function (x, k) { return '<button data-stage="' + k + '"><i>' + x.k + "</i>" + esc(x.l) + "</button>"; }).join("") + "</div></div>";
    if (s.terms.length) h += '<div class="as-sbox"><h4>이 장의 용어<span>' + s.terms.length + '</span></h4><div class="as-terms-mini">' + s.terms.map(function (t) { return '<button data-term="' + esc(t) + '">' + esc(t) + "</button>"; }).join("") + "</div></div>";
    var rel = FIND.filter(function (f) { var re = new RegExp("\\b" + f.id.replace(/[-]/g, "\\-") + "\\b"); return id2text(s.id).match(re); });
    if (rel.length) h += '<div class="as-sbox"><h4>이 장이 가리키는 결함<span>' + rel.length + '</span></h4><div class="as-stages">' + rel.map(function (f) { return '<button data-fx="' + esc(f.id) + '"><i style="color:var(--' + (f.sev === "high" ? "alert" : f.sev === "mid" ? "warn" : "ink-faint") + ')">!</i>' + esc(f.id + " " + f.t).slice(0, 44) + "</button>"; }).join("") + "</div></div>";
    sideEl.innerHTML = h;
    sideEl._st = st;
    if (spy) spy.disconnect();
    if ("IntersectionObserver" in window && st.length) {
      var btns = $$(".as-stages button[data-stage]", sideEl);
      spy = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var k = st.findIndex(function (x) { return x.el === e.target; }); btns.forEach(function (b, j) { b.classList.toggle("on", j === k); b.classList.toggle("past", j < k); }); } }); }, { rootMargin: "-25% 0px -65% 0px" });
      st.forEach(function (x) { spy.observe(x.el); });
    }
  }
  var textCache = {};
  function id2text(id) { return textCache[id] || (textCache[id] = S[id].el.textContent); }
  function renderHead() {
    var k = order.indexOf(cur), prev = order[k - 1], next = order[k + 1], s = S[cur];
    headEl.innerHTML = "<span>" + esc(s.cat || "시작") + "</span><b>" + s.n + " / " + String(order.length - 1).padStart(2, "0") + "</b>" +
      '<div class="as-bar as-prog"><i class="s" style="width:' + pct(stats().read, readable.length) + '%"></i></div>' +
      '<div class="pn"><button class="as-btn" data-go="' + (prev || "") + '"' + (prev ? "" : " disabled") + '>◀ 이전</button><button class="as-btn" data-go="' + (next || "") + '"' + (next ? "" : " disabled") + ">다음 ▶</button></div>";
    footEl.innerHTML = (k > 0 ? '<button class="as-btn' + (readS[cur] ? " pri" : "") + '" data-act="read">' + (readS[cur] ? "✓ 읽음" : "이 장 다 읽음") + "</button>" : "") +
      (next ? '<button class="as-btn ink pri" data-go="' + next + '">다음 장 · ' + esc(S[next].nav) + " ▶</button>" : (QUIZ.length ? '<button class="as-btn ink pri" data-view="quiz">🧠 퀴즈로 확인하기 ▶</button>' : ""));
  }
  function openSec(id, target) {
    if (!S[id]) return;
    cur = id;
    secs.forEach(function (s) { s.classList.toggle("as-on", s.id === id); });
    try { localStorage.setItem(KEY + "-last", id); history.replaceState(null, "", "#/" + id); } catch (e) {}
    renderRail(); renderHead(); renderSide();
    show("read", true);
    if (S[id].el.querySelector("#trSteps")) setTimeout(drawLanes, 30);
    if (target) setTimeout(function () { target.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" }); target.classList.add("as-flash"); setTimeout(function () { target.classList.remove("as-flash"); }, 2600); }, 60);
    else window.scrollTo(0, 0);
  }

  /* ── 요청 추적기 레인 그림 ── */
  var LANE = { front: "프론트", back: "백엔드", rt: "실시간", ext: "외부" }, lanesEl = null;
  (function () {
    var body = $(".tr-body", main), steps = $("#trSteps", main), tabs = $("#trTabs", main);
    if (!body || !steps || !TRACES.length) return;
    var used = ["front", "back", "rt", "ext"].filter(function (w) { return TRACES.some(function (T) { return (T.steps || []).some(function (x) { return x.w === w; }); }); });
    if (!used.length) return;
    lanesEl = el("div", "as-lanes");
    lanesEl._used = used;
    body.parentNode.insertBefore(lanesEl, body);
    var mo = new MutationObserver(function () { clearTimeout(lanesEl._t); lanesEl._t = setTimeout(drawLanes, 10); });
    mo.observe(steps, { childList: true, subtree: true, attributes: true, attributeFilter: ["aria-selected"] });
    if (tabs) mo.observe(tabs, { subtree: true, attributes: true, attributeFilter: ["aria-selected"] });
    window.addEventListener("resize", function () { if (lanesEl.offsetParent) placeLanes(); });
  })();
  function curTrace() {
    var tabs = $$("#trTabs > *", main), ti = Math.max(0, tabs.findIndex(function (b) { return b.getAttribute("aria-selected") === "true"; }));
    var sb = $$("#trSteps > *", main), si = Math.max(0, sb.findIndex(function (b) { return b.getAttribute("aria-selected") === "true"; }));
    return { ti: ti, si: si };
  }
  function drawLanes() {
    if (!lanesEl) return;
    var c = curTrace(), T = TRACES[c.ti]; if (!T) return;
    // 레인은 지금 시나리오에 나오는 것만, 이름은 그 시나리오의 wl 앞부분(「백엔드 · service」→「백엔드」, 「공격자」)에서
    var used = lanesEl._used.filter(function (w) { return T.steps.some(function (x) { return x.w === w; }); }), n = T.steps.length;
    var name = function (w) {
      var c = {}; T.steps.forEach(function (x) { if (x.w === w && x.wl) { var k = String(x.wl).split(/\s*·\s*/)[0].trim(); c[k] = (c[k] || 0) + 1; } });
      var best = Object.keys(c).sort(function (a, b) { return c[b] - c[a]; })[0];
      return best && best.length <= 8 ? best : LANE[w];
    };
    lanesEl.innerHTML = used.map(function (w) {
      return '<div class="as-lane" data-w="' + w + '"><span><i style="background:var(--l-' + w + ')"></i>' + esc(name(w)) + "</span>" +
        T.steps.map(function (x, i) { return x.w === w ? '<button class="as-node' + (i < c.si ? " past" : i === c.si ? " cur" : "") + '" data-node="' + i + '" style="left:' + ((i + .5) / n * 100).toFixed(2) + '%;border-color:' + (i <= c.si ? "" : "var(--l-" + w + ")") + '" title="' + esc(x.t) + '">' + (i + 1) + "</button>" : ""; }).join("") + "</div>";
    }).join("") + '<div class="as-wire"><svg></svg></div><div class="as-packet"></div><div class="legend"><span>점을 누르면 그 단계로 · 경계를 넘는 순간 = 레인이 바뀌는 곳</span></div>';
    placeLanes(true);
  }
  function placeLanes(first) {
    if (!lanesEl || !lanesEl.offsetParent) return;
    var box = lanesEl.getBoundingClientRect(), nodes = $$(".as-node", lanesEl).sort(function (a, b) { return a.dataset.node - b.dataset.node; });
    var pts = nodes.map(function (nd) { var r = nd.getBoundingClientRect(); return [r.left + r.width / 2 - box.left, r.top + r.height / 2 - box.top]; });
    var c = curTrace(), svg = $(".as-wire svg", lanesEl), d1 = "", d2 = "";
    pts.forEach(function (p, i) {
      if (!i) return; var q = pts[i - 1], mx = (q[0] + p[0]) / 2;
      var seg = "M" + q[0] + " " + q[1] + " C" + mx + " " + q[1] + " " + mx + " " + p[1] + " " + p[0] + " " + p[1];
      if (i <= c.si) d1 += seg; else d2 += seg;
    });
    svg.innerHTML = '<path d="' + d2 + '"/><path class="done" d="' + d1 + '"/>';
    var pk = $(".as-packet", lanesEl), p = pts[c.si] || pts[0];
    if (!p) return;
    var prev = lanesEl._last;
    if (prev && !first) { pk.style.left = prev[0] + "px"; pk.style.top = prev[1] + "px"; }
    else if (prev && first && lanesEl._lastT === c.ti) { pk.style.transition = "none"; pk.style.left = prev[0] + "px"; pk.style.top = prev[1] + "px"; void pk.offsetWidth; pk.style.transition = ""; }
    requestAnimationFrame(function () { pk.style.left = p[0] + "px"; pk.style.top = p[1] + "px"; });
    lanesEl._last = p; lanesEl._lastT = c.ti;
  }

  /* ── 지도 ── */
  function spark() {
    if (!TL.length) return "";
    var W = 600, H = 110, n = TL.length, max = Math.max.apply(null, TL.map(function (t) { return t.n; })) || 1, bw = W / n;
    var bars = TL.map(function (t, i) { var h = Math.max(2, t.n / max * (H - 18)); return '<rect x="' + (i * bw + bw * .15).toFixed(1) + '" y="' + (H - h).toFixed(1) + '" width="' + (bw * .7).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2" style="fill:var(' + (t.evt ? "--alert" : t.peak ? "--signal" : "--ink-faint") + ');opacity:' + (t.peak || t.evt ? 1 : .55) + '"><title>' + esc(t.m + " · " + t.n) + "</title></rect>" + (t.peak ? '<text x="' + (i * bw + bw / 2).toFixed(1) + '" y="' + (H - h - 5).toFixed(1) + '" text-anchor="middle" style="fill:var(--signal);font:600 10px var(--mono)">' + t.n + "</text>" : ""); }).join("");
    var total = TL.reduce(function (a, t) { return a + t.n; }, 0);
    var hid = order.filter(function (id) { return $("#tl", S[id].el); })[0];
    return '<div class="as-panel"><div class="as-spark"><div style="display:flex;align-items:baseline;gap:10px;margin-bottom:8px"><b style="font-family:var(--mono);font-size:22px">' + total + '</b><span style="font-size:12.5px;color:var(--ink-faint)">커밋 · 월별</span>' + (hid ? '<button class="as-link" style="margin-left:auto" data-go="' + hid + '">역사 장으로 →</button>' : "") + '</div><svg viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="none">' + bars + '</svg><div class="cap"><span>' + esc(TL[0].m) + "</span><span>" + esc(TL[n - 1].m) + "</span></div></div></div>";
  }
  function renderHome() {
    var st = stats(), last = null; try { last = localStorage.getItem(KEY + "-last"); } catch (e) {}
    var cont = last && S[last] && last !== order[0] ? last : (readable.filter(function (id) { return !readS[id]; })[0] || readable[0]);
    var statEls = $$(".stat", hero).map(function (s) { return [txt($(".stat-n", s)), txt($(".stat-l", s))]; });
    var cnt = { high: 0, mid: 0, low: 0 }; FIND.forEach(function (f) { if (cnt[f.sev] != null) cnt[f.sev]++; });
    var h = '<div class="as-page"><div class="as-hero"><div class="as-hero-l"><div class="as-kicker">' + esc(txt($(".hero-sub", hero)) || "코드베이스 해부도") + "</div><h1>" + esc(txt($("h1", hero)) || title) + '</h1><p class="as-lead">' + ($(".lead", hero) ? $(".lead", hero).innerHTML : "") + "</p>" +
      '<div class="as-cta">' + (cont ? '<button class="as-btn pri big" data-go="' + cont + '">▶ ' + (last ? "이어서" : "읽기 시작") + " · " + S[cont].n + " " + esc(S[cont].nav) + "</button>" : "") +
      (FIND.length ? '<button class="as-btn big" data-view="fx">⚠️ 결함 ' + FIND.length + "개 보기</button>" : "") + (QUIZ.length ? '<button class="as-btn big" data-view="quiz">🧠 퀴즈 ' + QUIZ.length + "문항</button>" : "") + "</div></div>" +
      '<div class="as-hero-r as-panel"><div class="as-big"><div class="ring"><svg viewBox="0 0 64 64" class="as-ring">' + ring(28, st.ready / 100, 6) + "</svg><b>" + st.ready + "<small>%</small></b></div><p><strong>내 코드 이해도</strong>장을 읽고(40%) 퀴즈를 맞히고(40%) 결함을 하나씩 확인하면(20%) 올라가요.</p></div>" +
      '<div class="as-meter"><span>📖 장 읽음</span><div class="as-bar"><i class="s" style="width:' + pct(st.read, readable.length) + '%"></i></div><span>' + st.read + " / " + readable.length + "</span></div>" +
      (QUIZ.length ? '<div class="as-meter"><span>🧠 퀴즈</span><div class="as-bar"><i class="s" style="width:' + pct(st.qc, QUIZ.length) + '%"></i><i class="a" style="width:' + pct(st.qa - st.qc, QUIZ.length) + '%"></i></div><span>' + st.qc + " / " + QUIZ.length + "</span></div>" : "") +
      (FIND.length ? '<div class="as-meter"><span>⚠️ 결함 확인</span><div class="as-bar"><i class="s" style="width:' + pct(st.ff, FIND.length) + '%"></i><i class="w" style="width:' + pct(st.fr - st.ff, FIND.length) + '%"></i></div><span>' + st.fr + " / " + FIND.length + "</span></div>" : "") + "</div></div>";
    if (statEls.length) h += '<div class="as-stats">' + statEls.map(function (s) { return '<div class="as-stat"><b>' + esc(s[0]) + "</b><span>" + esc(s[1]) + "</span></div>"; }).join("") + "</div>";
    if (FIND.length || TL.length) {
      h += '<div class="as-h"><h2>⚠️ 지금 상태</h2><span class="sub">발견된 문제와 커밋 지문</span></div><div class="as-two">';
      if (FIND.length) h += '<div class="as-panel"><div class="as-sevrow">' + ["high", "mid", "low"].map(function (k) { var L = { high: "높음 · 지금 위험", mid: "중간 · 자라면 터짐", low: "낮음 · 정리할 것" }[k]; return '<button class="as-sevbox ' + k + '" data-view="fx" data-sev="' + k + '"><b>' + cnt[k] + "</b><span>" + L + "</span></button>"; }).join("") + '</div><div class="as-toplist">' +
        FIND.slice().sort(function (a, b) { return "hml".indexOf(a.sev[0]) - "hml".indexOf(b.sev[0]); }).slice(0, 4).map(function (f) { return '<button data-fx="' + esc(f.id) + '"><span class="id">' + esc(f.id) + '</span><span class="as-sev ' + f.sev + '">' + esc(f.sevL || f.sev) + "</span><span>" + esc(f.t) + "</span><span>" + (fxS[f.id] === "fix" ? "✅" : fxS[f.id] ? "👀" : "→") + "</span></button>"; }).join("") + "</div></div>";
      h += (TL.length ? spark() : "<div></div>") + "</div>";
    }
    h += '<div class="as-h"><h2>🗺️ 장 지도</h2><span class="sub">카드를 누르면 그 장으로 · 배지는 그 장에서 직접 눌러 볼 수 있는 것</span></div><div class="as-chgrid">' + readable.map(function (id) {
      var s = S[id];
      return '<button class="as-ch' + (readS[id] ? " done" : "") + '" data-go="' + id + '"><div class="top"><span class="n">' + s.n + "</span><span>" + esc(s.cat) + "</span></div><h3>" + esc(s.title || s.nav) + '</h3><div class="tags">' + s.tags.slice(0, 4).map(function (t) { return "<span>" + t + "</span>"; }).join("") + "</div></button>";
    }).join("") + "</div></div>";
    V.home.innerHTML = h;
  }

  /* ── 결함 보드 ── */
  var fsel = null, fonly = false, ftab = "fx", fsev = null;
  function renderFx() {
    if (!fsel && FIND.length) fsel = FIND[0].id;
    var st = stats(), F = FIND.filter(function (f) { return f.id === fsel; })[0];
    var col = function (k, L) {
      var l = FIND.filter(function (f) { return f.sev === k && (!fonly || fxS[f.id] !== "fix"); });
      return '<div><div class="as-colh"><span class="as-sev ' + k + '">' + L + "</span><b>" + l.length + "</b></div>" + (l.length ? l.map(function (f) {
        var s = fxS[f.id];
        return '<button class="as-fcard' + (f.id === fsel ? " on" : "") + (s === "fix" ? " fixed" : "") + '" data-fsel="' + esc(f.id) + '"><span class="id">' + esc(f.id) + '</span><span class="t">' + esc(f.t) + '</span><span class="ev">' + esc(f.ev) + "</span>" + (s ? '<span class="stt ' + (s === "fix" ? "fix" : "ok") + '">' + (s === "fix" ? "고침" : "이해함") + "</span>" : "") + "</button>";
      }).join("") : '<div class="as-empty" style="padding:18px;font-size:13px">없음</div>') + "</div>";
    };
    var h = '<div class="as-page"><div class="as-h" style="margin-top:4px"><h2>⚠️ 결함 보드</h2><span class="sub">근거가 붙은 실제 문제. 하나씩 열어 보고 「이해함 / 고침」으로 표시하세요</span></div>' +
      '<div class="as-fxtop"><div style="display:flex;gap:6px"><button class="as-chip" data-ftab="fx" aria-pressed="' + (ftab === "fx") + '">발견된 문제 ' + FIND.length + "</button>" + (GOOD.length ? '<button class="as-chip" data-ftab="good" aria-pressed="' + (ftab === "good") + '">잘 된 것 ' + GOOD.length + "</button>" : "") + "</div>" +
      (ftab === "fx" ? '<div class="as-bar"><i class="s" style="width:' + pct(st.ff, FIND.length) + '%"></i><i class="w" style="width:' + pct(st.fr - st.ff, FIND.length) + '%"></i></div><span class="cnt">고침 ' + st.ff + " · 이해함 " + (st.fr - st.ff) + " · 남음 " + (FIND.length - st.fr) + '</span><button class="as-chip" data-act="fonly" aria-pressed="' + fonly + '">고친 것 숨기기</button>' : "") + "</div>";
    if (ftab === "good") { h += '<div class="as-good">' + GOOD.map(function (g) { return "<div><h4>" + esc(g.h) + "</h4><p>" + g.p + "</p></div>"; }).join("") + "</div></div>"; V.fx.innerHTML = h; return; }
    h += '<div class="as-board"><div class="as-cols">' + col("high", "높음") + col("mid", "중간") + col("low", "낮음") + "</div>";
    h += '<aside class="as-panel as-drawer">' + (F ? '<div style="display:flex;gap:8px;align-items:center"><span class="as-sev ' + F.sev + '">' + esc(F.sevL || F.sev) + '</span><span style="font-family:var(--mono);font-size:12px;color:var(--ink-faint)">' + esc(F.id) + "</span></div><h3>" + esc(F.t) + '</h3><h6>근거</h6><div class="ev">' + esc(F.ev) + "</div>" + (F.code ? "<pre><code>" + esc(F.code) + "</code></pre>" : "") +
      "<h6>무엇이 문제인가</h6><p>" + rich(F.what) + "</p><h6>왜 중요한가</h6><p>" + rich(F.why) + "</p><h6>어떻게 고치나</h6><p>" + rich(F.fix) + '</p><div class="as-state">' + [["", "아직"], ["ok", "👀 이해함"], ["fix", "✅ 고침"]].map(function (b) { return '<button data-fstate="' + b[0] + '" class="' + ((fxS[F.id] || "") === b[0] ? "on" : "") + '">' + b[1] + "</button>"; }).join("") + "</div>" +
      (function () { var where = readable.filter(function (id) { return id2text(id).indexOf(F.id) >= 0 && !$("#fx", S[id].el); }); return where.length ? '<h6>이 결함이 나오는 장</h6><div style="display:flex;gap:6px;flex-wrap:wrap">' + where.map(function (id) { return '<button class="as-chip" data-go="' + id + '" data-find="' + esc(F.id) + '">' + S[id].n + " " + esc(S[id].nav) + "</button>"; }).join("") + "</div>" : ""; })()
      : '<div class="as-empty">결함을 고르세요</div>') + "</aside></div></div>";
    V.fx.innerHTML = h;
  }

  /* ── 퀴즈 ── */
  var qi = 0;
  function renderQuiz() {
    if (!QUIZ.length) return;
    var st = stats(), Q = QUIZ[qi], ans = qz[qi], done = ans != null, M = ["A", "B", "C", "D", "E"];
    var dots = QUIZ.map(function (q, i) { return '<i class="' + (qz[i] == null ? "" : qOk(i) ? "r" : "w") + (i === qi ? " cur" : "") + '"></i>'; }).join("");
    var wrong = QUIZ.map(function (q, i) { return i; }).filter(function (i) { return qz[i] != null && !qOk(i); });
    var h = '<div class="as-page"><div class="as-h" style="margin-top:4px"><h2>🧠 이해도 퀴즈</h2><span class="sub">읽은 걸 꺼내 보는 연습. 틀린 문제가 몰린 장을 다시 읽으세요</span></div><div class="as-qgrid">' +
      '<div class="as-panel as-qcard"><div class="as-qtop"><b style="color:var(--ink)">' + (qi + 1) + " / " + QUIZ.length + '</b><div class="dots">' + dots + "</div></div>" +
      '<div class="as-qq">' + esc(Q.q) + '</div><div class="as-qopts">' + Q.o.map(function (o, j) {
        var cls = done ? (j === Q.a ? " right" : j === +ans ? " wrong" : "") : "";
        return '<button class="as-qopt' + cls + '" data-qa="' + j + '"' + (done ? " disabled" : "") + '><span class="mk">' + M[j] + "</span><span>" + esc(o) + "</span></button>";
      }).join("") + "</div>" + (done ? '<div class="as-qexp">' + (+ans === Q.a ? "<b>정답.</b> " : "<b>오답.</b> ") + (Q.e || "") + (Q.src ? '<span class="src">' + esc(Q.src) + "</span>" : "") + "</div>" : "") +
      '<div class="as-qacts"><button class="as-btn" data-qnav="-1"' + (qi ? "" : " disabled") + '>◀ 이전</button><button class="as-btn ink" data-qnav="1"' + (qi < QUIZ.length - 1 ? "" : " disabled") + '>다음 ▶</button><span style="margin-left:auto;font-size:12px;color:var(--ink-faint)"><span class="k">1</span>–<span class="k">4</span> 고르기 · <span class="k">→</span> 다음</span></div></div>' +
      '<aside class="as-panel as-qside"><div class="big"><b>' + st.qc + "</b><span>/ " + QUIZ.length + ' 정답</span></div><div class="as-bar"><i class="s" style="width:' + pct(st.qc, QUIZ.length) + '%"></i><i class="a" style="width:' + pct(st.qa - st.qc, QUIZ.length) + '%"></i></div>' +
      '<div style="font-size:12.5px;color:var(--ink-faint)">' + (st.qa < QUIZ.length ? QUIZ.length - st.qa + "문항 남음" : st.qc === QUIZ.length ? "전부 맞혔어요." : "틀린 " + wrong.length + "문항을 다시 풀어 보세요.") + '</div><div class="as-qmap">' +
      QUIZ.map(function (q, i) { return '<button data-qgo="' + i + '" class="' + (qz[i] == null ? "" : qOk(i) ? "r" : "w") + (i === qi ? " cur" : "") + '">' + (i + 1) + "</button>"; }).join("") + "</div>" +
      (wrong.length ? '<button class="as-btn" data-act="qwrong">↻ 틀린 문제만 다시 (' + wrong.length + ")</button>" : "") + '<button class="as-link" data-act="qreset" style="align-self:flex-start">기록 지우기</button></aside></div></div>';
    V.quiz.innerHTML = h;
  }
  function answer(j) { if (qz[qi] != null) return; qz[qi] = j; save("quiz", qz); refresh(); renderQuiz(); }

  /* ── 용어 ── */
  var gq = "", gveil = false, terms = null;
  function renderGloss() {
    if (!terms) terms = Object.keys(GLOSS).map(function (k) {
      var where = readable.filter(function (id) { return $('.term[data-t="' + k.replace(/"/g, '\\"') + '"]', S[id].el) || id2text(id).indexOf(k) >= 0; }).filter(function (id) { return !$("#glossary", S[id].el); });
      return { k: k, d: GLOSS[k], where: where, low: (k + " " + GLOSS[k]).toLowerCase() };
    });
    if (!$(".as-terms", V.gloss)) {
      V.gloss.innerHTML = '<div class="as-page"><div class="as-h" style="margin-top:4px"><h2>📚 용어 사전</h2><span class="sub">뜻을 가리고 먼저 말해 본 뒤 눌러서 확인</span></div><div class="as-gtools"><input class="as-search" id="as-gq" type="search" placeholder="용어나 뜻으로 찾기"><button class="as-chip" data-act="veil" aria-pressed="false">🙈 뜻 가리기</button><span class="cnt"></span></div><div class="as-terms"></div></div>';
      $(".as-search", V.gloss).addEventListener("input", function (e) { gq = e.target.value.trim().toLowerCase(); fill(); });
    }
    $("[data-act=veil]", V.gloss).setAttribute("aria-pressed", gveil);
    $(".as-terms", V.gloss).classList.toggle("veil", gveil);
    fill();
    function fill() {
      var l = terms.filter(function (t) { return !gq || t.low.indexOf(gq) >= 0; });
      $(".cnt", V.gloss).textContent = l.length + " / " + terms.length + "개";
      $(".as-terms", V.gloss).innerHTML = l.length ? l.map(function (t) { return '<div class="as-term" tabindex="0"><b>' + esc(t.k) + '</b><div class="dd">' + rich(t.d) + "</div>" + (t.where.length ? '<div class="where">' + t.where.slice(0, 6).map(function (id) { return '<span data-go="' + id + '" data-find-term="' + esc(t.k) + '" title="' + esc(S[id].nav) + '">' + S[id].n + "</span>"; }).join("") + "</div>" : "") + "</div>"; }).join("") : '<div class="as-empty">찾는 용어가 없어요.</div>';
    }
  }

  /* ── 화면 전환 ── */
  function show(v, quiet) {
    if (!V[v]) v = "home";
    view = v;
    $$(".as-tabs button", top).forEach(function (b) { b.classList.toggle("on", b.dataset.view === v); });
    Object.keys(V).forEach(function (k) { V[k].classList.toggle("on", k === v); });
    if (v === "read" && !cur) { openSec(readable[0] || order[0]); return; }
    if (v !== "read") { try { history.replaceState(null, "", v === "home" ? location.pathname + location.search : "#/" + v); } catch (e) {} }
    if (v === "home") renderHome(); else if (v === "fx") renderFx(); else if (v === "quiz") renderQuiz(); else if (v === "gloss") renderGloss();
    if (!quiet) window.scrollTo(0, 0);
  }
  function refresh() {
    var st = stats();
    $(".as-ready svg", top).innerHTML = ring(13, st.ready / 100, 3.5);
    $(".as-ready b", top).textContent = st.ready + "%";
    var fb = $('[data-view="fx"] em', top); if (fb) { var left = FIND.filter(function (f) { return f.sev === "high" && fxS[f.id] !== "fix"; }).length; fb.hidden = !left; fb.textContent = left; }
    if (cur) { renderRail(); renderHead(); }
    if (view === "home") renderHome();
  }

  /* ── 클릭 ── */
  app.addEventListener("click", function (e) {
    var t = e.target.closest("button,[data-go],a[href^='#'],.as-term");
    if (!t || !app.contains(t)) return;
    var d = t.dataset;
    if (t.tagName === "A") {
      var id = t.getAttribute("href").slice(1), tg = id && document.getElementById(id);
      if (!tg || !main.contains(tg)) return;
      e.preventDefault(); var sec = S[id] ? tg : tg.closest("section[data-nav]"); if (sec) openSec(sec.id, S[id] ? null : tg); return;
    }
    if (t.closest("main.main") && !t.closest(".as-lanes")) return; // 장 안의 kit 컴포넌트는 그대로
    if (d.node !== undefined) { var b = $$("#trSteps > *", main)[+d.node]; if (b) b.click(); return; }
    if (d.go !== undefined) {
      if (!d.go) return;
      var target = null;
      if (d.find) target = $$(".fx-id, .path, p, li, td", S[d.go].el).filter(function (x) { return x.textContent.indexOf(d.find) >= 0; })[0];
      if (d.findTerm) target = $('.term[data-t="' + d.findTerm.replace(/"/g, '\\"') + '"]', S[d.go].el);
      return openSec(d.go, target);
    }
    if (d.view) { if (d.sev) fsev = d.sev; if (d.view === "fx" && fsev) { var f0 = FIND.filter(function (f) { return f.sev === fsev; })[0]; if (f0) fsel = f0.id; fsev = null; } return show(d.view); }
    if (d.fx) { fsel = d.fx; ftab = "fx"; return show("fx"); }
    if (d.stage !== undefined && sideEl._st) { var x = sideEl._st[+d.stage]; if (x) x.el.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" }); return; }
    if (d.term) { var te = $('.term[data-t="' + d.term.replace(/"/g, '\\"') + '"]', S[cur].el); if (te) { te.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" }); setTimeout(function () { te.click(); }, reduced ? 0 : 350); } return; }
    if (d.fsel) { fsel = d.fsel; return renderFx(); }
    if (d.ftab) { ftab = d.ftab; return renderFx(); }
    if (d.fstate !== undefined) { if (d.fstate) fxS[fsel] = d.fstate; else delete fxS[fsel]; save("fx", fxS); refresh(); return renderFx(); }
    if (d.qa !== undefined) return answer(+d.qa);
    if (d.qnav) { qi = Math.max(0, Math.min(QUIZ.length - 1, qi + +d.qnav)); return renderQuiz(); }
    if (d.qgo !== undefined) { qi = +d.qgo; return renderQuiz(); }
    if (t.classList.contains("as-term")) { t.classList.toggle("open"); return; }
    switch (d.act) {
      case "theme":
        var r = document.documentElement, c = r.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"), nx = c === "dark" ? "light" : "dark";
        r.setAttribute("data-theme", nx); try { localStorage.setItem("as-theme", nx); } catch (er) {} return;
      case "read": readS[cur] = !readS[cur]; save("read", readS); return refresh();
      case "fonly": fonly = !fonly; return renderFx();
      case "qwrong": QUIZ.forEach(function (q, i) { if (qz[i] != null && !qOk(i)) delete qz[i]; }); save("quiz", qz); qi = QUIZ.findIndex(function (q, i) { return qz[i] == null; }); if (qi < 0) qi = 0; refresh(); return renderQuiz();
      case "qreset":
        if (!t.dataset.armed) { t.dataset.armed = 1; t.textContent = "한 번 더 누르면 지워요"; setTimeout(function () { if (t.isConnected) { delete t.dataset.armed; t.textContent = "기록 지우기"; } }, 3000); return; }
        qz = {}; save("quiz", qz); qi = 0; refresh(); return renderQuiz();
      case "veil": gveil = !gveil; return renderGloss();
    }
  });
  // 끝까지 내려오면 읽음
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting && view === "read" && cur && cur !== order[0] && !readS[cur] && document.documentElement.scrollHeight > innerHeight * 1.3) { readS[cur] = 1; save("read", readS); refresh(); } });
  }, { rootMargin: "0px 0px -10% 0px" }).observe(footEl);
  document.addEventListener("keydown", function (e) {
    var tg = e.target; if ((tg && tg.closest && tg.closest("input,textarea,select")) || e.ctrlKey || e.metaKey || e.altKey) return;
    if (view === "quiz" && QUIZ.length) {
      if (/^[1-5]$/.test(e.key) && +e.key <= QUIZ[qi].o.length) { e.preventDefault(); answer(+e.key - 1); }
      else if (e.key === "ArrowRight" && qi < QUIZ.length - 1) { qi++; renderQuiz(); }
      else if (e.key === "ArrowLeft" && qi > 0) { qi--; renderQuiz(); }
    } else if (view === "read" && cur && (e.key === "ArrowRight" || e.key === "ArrowLeft") && !(tg && tg.closest && tg.closest(".tr-steps,.tabs"))) {
      var k = order.indexOf(cur) + (e.key === "ArrowRight" ? 1 : -1); if (order[k]) { e.preventDefault(); openSec(order[k]); }
    }
  });

  // 처음 화면
  var h0 = decodeURIComponent((location.hash || "").slice(1)).replace(/^\//, ""), t0 = h0 && document.getElementById(h0);
  refresh();
  if (V[h0]) show(h0);
  else if (t0 && S[h0]) openSec(h0);
  else if (t0 && t0.closest && t0.closest("section[data-nav]")) openSec(t0.closest("section[data-nav]").id, t0);
  else show("home");
  window.AS = { show: show, openSec: openSec, S: S, order: order };
})();
