# Using assets/kit.html

A tested scaffold: design system + 12 interactive components. Copy it, fill the data arrays,
add your chapters. Do not rewrite the CSS or render code — it is already verified for
light/dark/system themes, mobile, and runtime safety.

```bash
cp <이 스킬 폴더>/assets/kit.html docs/<project>-anatomy.html   # 플러그인으로 설치했다면 SKILL.md 의 ${CLAUDE_SKILL_DIR}
```

## What is already handled

- **Three theme states.** Tokens on bare `:root`, redefined under
  `@media (prefers-color-scheme: dark)` guarded by `:root:not([data-theme="light"])`,
  and again under `:root[data-theme="dark"]`. Never declare a color only inside a media or
  `[data-theme]` block — that is the classic unreadable-artifact bug.
- **Chapter numbers.** Computed from section order at runtime. The `.eyebrow` number you type
  is overwritten, so leave it as `00`.
- **Cross-references.** Write `{{sectionId}}장` anywhere — static markup or data strings —
  and it resolves to the real number. Insert or move a chapter and every reference follows.
  Resolution runs early, so it survives a later component failing.
- **Missing components degrade silently.** Each renderer checks its host element and data
  array first. Delete a section you do not need and nothing breaks.
- **Wide content scrolls inside its own container**, so the page body never scrolls sideways.

## Adding a chapter

```html
<section id="sTHING" data-nav="목차에 보일 이름">
  <div class="col">
    <p class="eyebrow">00 — 분류</p>
    <h2>제목</h2>
    <p>본문. 다른 장 참조는 {{sFIND}}장 처럼.</p>
  </div>
  <div class="wide"><!-- 표·패널은 넓게 --></div>
</section>
```

`.col` is the reading column (~68ch). `.wide` breaks out for panels and tables.

## Class reference

| Purpose | Markup |
|---|---|
| Callout | `.callout` / `.callout.warn` / `.callout.alert` with an `<h4>` |
| Comparison grid | `.split > div` each with `<h4>` + `<p>` |
| Table | `.tw > table` (the wrapper provides horizontal scroll) |
| File path | `<span class="path">a/b.java:12</span>`, `<b>` inside to accent |
| Inline code | `<code>` or `<span class="m">` |
| Glossary term | `<span class="term" data-t="KEY">…</span>` |
| Stepped build | `.bld > div` with `.q` (problem) / `.a` (solution) labels |
| Numbered recipe | `.rcp > div` — numbers auto-generate via CSS counter |
| Dependency graph | `.dep > pre` (use `<b>` and `<i>` to highlight) + `.hub > div` |

Inside `<pre>`, wrap comments in `<span class="cmt">` for muted styling.

## Data arrays

Fill only what applies; empty arrays are skipped. Schemas are documented inline in the kit's
DATA block. The most common mistakes:

- `TRACES[].steps[].w` must be one of `front` / `back` / `rt` / `ext` — it colours the badge.
- `FINDINGS[].sev` must be `high` / `mid` / `low`; `sevL` is the visible label.
- `QUIZ[].a` is a zero-based index.
- Fields named `note`, `p`, `b`, `msg`, `e`, `items` accept HTML; everything else is escaped.
- Every `data-t` term used in the body must exist in `GLOSSARY`.

## The calculator

Not auto-rendered — formulas differ per project. Only build one when the source contains
pure arithmetic you can port exactly. Add `#calcIn` / `#calcOut` hosts, write inputs with
`.fld`, and render the breakdown with `.bar-row`. If you cannot reproduce the formula
faithfully, ship the table instead; an approximation that disagrees with the server teaches
a false model.

## Verify before publishing

```bash
node -e "
const fs=require('fs'),src=fs.readFileSync('FILE','utf8');
[...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].forEach((m,i)=>{
  try{ new Function(m[1]); console.log('script '+(i+1)+' OK'); }
  catch(e){ console.log('script '+(i+1)+' ERROR '+e.message); }});
const need=[...new Set([...src.matchAll(/getElementById\(\"([^\"]+)\"\)/g)].map(m=>m[1]))];
const have=new Set([...src.matchAll(/ id=\"([^\"]+)\"/g)].map(m=>m[1]));
console.log('missing hosts:', need.filter(n=>!have.has(n)).join(', ')||'none');
console.log('sections:', (src.match(/<section /g)||[]).length);
"
```

For a full runtime check, render with jsdom and assert component counts plus zero errors.
That is how the kit itself is tested, and it catches failures a syntax check cannot —
one component throwing used to kill every component after it.

Last: re-verify a sample of `file:line` claims against the real files. A wrong line number
costs the document the only thing it really has.
