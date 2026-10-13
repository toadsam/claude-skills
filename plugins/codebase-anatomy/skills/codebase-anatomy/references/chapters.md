# Chapter specification

Order matters: context → structure → mechanism → foundations → honesty → practice → check.
Adapt names to the project; keep the *function* of each chapter.

Number chapters from the section order at runtime (the kit does this automatically) and
cross-reference with `{{sectionId}}` tokens, never hardcoded numbers — they drift the moment
a chapter is inserted, and stale references quietly destroy trust.

---

## 00 · Opening

State what the document is, who it is for, and the evidence promise: *every claim carries a
file path and line number, so you can check whether this document is lying.*
Then a stat strip of extracted numbers (processes, endpoints, files, LOC, tables).
Caption it with how the numbers were derived. No hero flourish beyond this.

## 01 · Project biography (from git)

Month histogram, the phases visible in commit messages, what happened in any spike,
security incidents, and how commit-message quality changed over time.

The point is not nostalgia — it **explains the quality variance** the reader is about to
meet. Say so explicitly: meticulous parts and careless parts are the same author at
different speeds, and that reframes the findings chapter from blame to context.

## 02 · What this actually is

How many programs run, on which ports, and what each owns. Most owners of AI-built projects
cannot answer this, and every debugging session starts here (which one failed to start?).
Include the deliberate trade-off each split created.

## 03 · Structure — the layers

An interactive explorer of the source tree: each layer's responsibility, what it may call,
its one core rule, and real file names.

Then the single most important structural concept, argued from real code. In a layered
backend that is usually **why DTO and Entity both exist** — show the entity field the DTO
deliberately omits (a password hash). One concrete diff beats a paragraph of theory.

## 04 · Framework concepts you must know

Expandable cards for the ~8 pieces of "magic" that block reading *this* codebase —
annotations, decorators, dependency injection, transactions, ORM query derivation, lifecycle.
Each card: what it does, why it is here, and a snippet **from this project**, never generic docs.

## 05 · The real dependency graph

Extracted, not imagined. Show hub / deepest chain / cycles / leaves and translate to
"edit here and these break" and "this is the safest file to change".
If several classes share a name prefix, add a table that separates their roles — this is
consistently the most confusing thing for a newcomer.

## 06 · Request tracer (the centerpiece)

3–6 scenarios followed end to end, one step per hop, each with real `file:line`, the actual
code, and a note explaining the *why* of that step. Cover at least: authentication,
the core domain loop, and the riskiest or most novel path.

Steps should be tagged by where they run (client / server / external / realtime) so the
reader watches control cross boundaries. This chapter is what makes layers stop being
abstract.

## 07 · The core algorithm

If the project has a scoring, pricing, matching, or ranking formula, dissect it and — where
it is pure arithmetic — reimplement it as a live calculator so the reader can move inputs
and watch outputs. Faithful port only; if you cannot reproduce it exactly, show the table
instead of an approximation.

Report the weights as **design decisions**: what the formula rewards reveals what the product
actually values, which sometimes contradicts what the product promises. That contradiction
is a finding.

## 08 · The riskiest subsystem

Whatever is most novel or most likely to be misunderstood — AI integration, payments,
realtime sync, file handling. Explain the failure mode first, then how the code defends
against it. If the defenses are good, say why; it is usually the strongest thing to talk
about in an interview.

## 09 · Foundations, from zero

Pick the concept area the reader has said (or shown) they lack. Build from *nothing*:
the underlying problem → the naive solution → why it fails → the real solution → the attack
or failure it prevents. Use a stepped build, and finish with a short list the reader can
carry into the next chapter.

For web auth, the ladder is: HTTP forgets you → so tokens exist → but clients are editable
→ so signatures exist → but where do tokens live → so storage matters → and here is what
breaks. Include a live decoder for any opaque-looking token, and let the reader watch a
forged one fail verification.

## 10 · That subsystem in this codebase

Now the actual configuration, read line by line, with the concepts already in hand.
Include a secrets table (what, where, tracked?, verdict) and the defenses that are correct —
credit them precisely.

## 11 · Data

Group tables/collections into ~8 logical clusters. Cover shared base types, and how schema
changes are managed. Two competing sources of schema truth is a common and real finding.

## 12 · Client structure

Folder roles with an honest "actual state" column (empty directories, oversized files).
Routing and its three access tiers; how auth is attached to requests; where derived UI state
is computed and whether that placement will hold as features grow.

## 13 · API map

Every endpoint prefix with owning file, required permission, and purpose. Reference, not prose.

## 14 · Failure paths

The success path is only half the system. Table: situation → who catches it → status code →
what the client does. Explain the status codes in plain words (401 = who are you?,
403 = I know you, but no), then the loop-prevention machinery. Finish with commands to
trigger each failure deliberately.

## 15 · Alternatives not taken

For each major choice: what was chosen, the credible alternative, and **the price actually
being paid** — pointing at a specific finding where the price already came due.

Be candid that many choices were defaults rather than deliberations. The goal is not to
retro-justify but to give the reader comparison vocabulary. Close with the difference between
a memorized answer and an understood one: an understood answer names the cost.

## 16 · Findings

Sorted by severity. Expandable: evidence (`file:line` + snippet), what is wrong, why it
matters in consequences, how to fix concretely. End with a prioritization that says what to
do first and what can wait — a list of 14 problems without an order is paralysing.

## 17 · What is done well

Same evidence standard. Credit deliberate anti-abuse logic, safe defaults, and pure functions
where they exist. This is also the interview-material chapter.

## 18 · Hands-on: add one field

A step-by-step walkthrough adding one field through **every layer**, with the real files of
this project. This teaches layering better than any diagram because the reader feels the cost.
Finish with a symptom → responsible-layer debugging table.

## 19 · Run it and break it

Startup order, then deliberate-breakage experiments each proving one claim in the document.
The most valuable one: escalate your own role in client storage and watch the server refuse.
Then a triage order for diagnosing failures.

## 20 · Quiz

12–18 multiple-choice questions with immediate feedback and evidence. See `interactions.md`.

## 21 · Glossary

Every term marked in the body, defined in the reader's terms, not the specification's.

---

## Writing standards

- **Consequences, not labels.** "1,000 users produce 1,001 queries" beats "N+1 antipattern".
- **Quote real code.** Trimmed for length, never invented, never idealized.
- **Explain the why of each step**, not just what it does — the why is what transfers.
- **Name the trade-off** whenever you praise a decision. Everything cost something.
- **Never moralize** about defects. State the mechanism, the consequence, the fix.
- **Bold the load-bearing sentence** in a long passage so scanning still works.
