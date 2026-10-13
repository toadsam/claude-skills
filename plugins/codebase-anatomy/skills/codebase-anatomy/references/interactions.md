# Interactive components

Reading feels like understanding and is not. These components exist to force **retrieval**
(pull the answer out before seeing it) and **production** (make something), which is where
the learning actually happens.

All are implemented in `assets/kit.html`. You fill data arrays; do not rewrite the render code.

---

## Required in every document

### Quiz — retrieval practice

12–18 four-option questions. On click: correct answer highlights green, a wrong pick
highlights red, and the explanation reveals with its `file:line` evidence. Score accumulates.

Rules that make it work:

- **Test consequences, not recall.** Bad: "What port is the backend on?"
  Good: "You edit your stored role to ADMIN in the browser. What happens?"
- **Wrong options must be plausible** — ideally the misconception the reader actually holds.
  A joke option wastes the slot.
- **Explain why the wrong answer felt right**, not just why the right one is right.
- **Cite evidence** on every explanation, same standard as the body.
- **Cover the whole document**, roughly one per major chapter, so a cluster of misses
  points at a specific chapter to re-read. Say this in the closing note — it is the
  quiz's real purpose.

### Hands-on exercise — production practice

A numbered walkthrough of one change through every layer, using the real files of this
project. Each step: the layer, what to write, and **the trap specific to that step**
(nullable columns for existing rows, forgetting the response mapper, editing only the
create path and not the update path).

Close with a symptom → responsible-layer table. That table is the transferable artifact.

### Break-it experiments

Table of deliberate breakages, each proving one claim made earlier: stop one process,
clear stored credentials, escalate your own role, watch a single request in the network tab.
Each row names what it proves. The role-escalation one is the most valuable single exercise
in the document — it makes "never trust the client" physical.

---

## Use when the project has the material

### Request tracer

Tabs for scenarios, a step list, prev/next/autoplay. Each step carries: where it runs
(client / server / external / realtime — colour-coded), title, `file:line`, prose, real code,
and an optional note in a highlighted box.

Notes are where the teaching happens. Use them for the non-obvious *why*: why this line must
exist, why the order matters, why a seemingly redundant guard is load-bearing. Use the same
box to flag a defect at the exact step where it occurs — a finding hits hardest in context.

### Live calculator

Only when the project contains a pure arithmetic core (scoring, pricing, ranking). Port the
formula faithfully from source and show a component breakdown as bars, so the reader sees
which input dominates. The insight is usually the **weights**, not the output.

If the logic touches I/O or cannot be reproduced exactly, show a table of the formula instead.
An approximation that disagrees with the server is worse than no calculator.

### Layer / stack explorer

Clickable vertical stack. Each entry: responsibility, what it may call, its one core rule,
real file names. Also fits filter chains, middleware pipelines, and build stages.

### Attack or failure scenarios

Tabs per scenario, steps tagged attack / partial / blocked / fix, ending in a verdict banner
(safe or vulnerable) that links to the finding id. Include scenarios the project **fails** —
that is what makes the safe ones credible.

### Token / payload decoder

For anything that looks opaque but is not encrypted. Show it split into coloured parts,
decode each, then a second tab where a field has been tampered with so verification visibly
fails. Generate real values (compute the real signature) so the demonstration is honest.

The reliable revelation: it was readable all along, and signing prevents *modification*,
not *reading*.

### Timeline histogram

Commit volume by month, with peak and incident rows emphasised. Small component, high
payoff — the shape carries the argument.

### Concept cards

Expandable grid for framework magic. Collapsed by default so the chapter stays scannable;
each opens to a definition plus a snippet from this codebase.

### Glossary popovers

Mark a term inline with `<span class="term" data-t="KEY">`; clicking shows the definition.
Every marked term must exist in the glossary — the kit's verification step checks this.
Define in the reader's terms, not the specification's.

---

## Interaction principles

- **Prediction before reveal.** Anything with an answer stays hidden until the reader commits.
- **Never gate content.** Collapsed is fine, unreachable is not; the reader may be skimming
  for reference and should never hit a wall.
- **Every control does something visible immediately.** No submit-then-wait.
- **State the purpose of the exercise** in one line before it. "Check whether you can explain
  this without the text" is instruction, not decoration.
- **Keep interactions honest.** A simulation that disagrees with the real system teaches a
  false model, which is worse than plain prose.
