# Investigation recipes

Commands that reliably surface facts worth documenting. Run them; do not estimate.
Adapt paths and extensions to the stack detected in Phase 1.

Always exclude vendor noise: `-not -path "*/.git/*" -not -path "*/node_modules/*"
-not -path "*/build/*" -not -path "*/dist/*" -not -path "*/bin/*" -not -path "*/vendor/*"`

## Shape of the project

```bash
ls -1
find . -maxdepth 3 -type d $EXCLUDES | sort
find . -name "*.java" $EXCLUDES | wc -l        # repeat per candidate extension
find . -name "*.py" $EXCLUDES | xargs wc -l | tail -1
```

Detect separate runnable programs — a project is often 3 processes on 3 ports and the
owner has never articulated that. Look for multiple manifests, `docker-compose.yml`,
`Procfile`, and hardcoded ports (`grep -rn "PORT\|listen(\|server.port"`).

## Layer / module sizes

```bash
for d in config controller service repository entity dto; do
  printf "%-12s %s\n" "$d" "$(find src/main/java/**/$d -name '*.java' 2>/dev/null | wc -l)"
done
```
Generic: count files per immediate subdirectory of the source root. The distribution is
itself a finding — 92 DTOs vs 46 entities tells a story worth a chapter.

## API surface

```bash
# Spring
grep -rhoE "@(Get|Post|Put|Patch|Delete)Mapping" src/main/java/**/controller/ | sort | uniq -c
grep -nE "@RequestMapping|@(Get|Post)Mapping" path/to/SomeController.java

# Express / Fastify
grep -rnoE "(app|router)\.(get|post|put|patch|delete)\(" src/ | wc -l
# FastAPI / Flask
grep -rnoE "@(app|router)\.(get|post|put|patch|delete)" .
```
Report the total and the per-prefix breakdown with the owning file and required permission.

## Real dependency graph (never guess this)

```bash
# Spring constructor injection — service→service edges only
for f in src/main/java/**/service/*Impl.java; do
  n=$(basename "$f" .java)
  deps=$(grep -oE "private final [A-Z][A-Za-z]*(Service|Client|Calculator)" "$f" \
         | sed 's/private final //' | tr '\n' ' ')
  [ -n "$deps" ] && echo "$n -> $deps"
done

# JS/TS — internal imports per module
grep -rhoE "from ['\"]\.\.?/[^'\"]+['\"]" src/ | sort | uniq -c | sort -rn | head -30
```
Then report: the most-depended-on module (**the hub — riskiest to change**), the deepest
chain, whether cycles exist, and which modules are leaves (**safest to change**).
This turns into "if you edit here, these break", which is the most useful page in the doc.

## Git history — the project's biography

```bash
git log --oneline | wc -l
git log --format="%ad" --date=format:"%Y-%m" | sort | uniq -c      # month histogram
git log --reverse --format="%ad %s" --date=short | head -5
git log --format="%ad %s" --date=short --since=PEAK --until=PEAK_END   # what happened in the spike
git log --format="%s" | grep -ciE "^(1|2|test|wip|fix|굿|asdf)$"       # low-information commits
git log --format="%ad %s" --date=short --grep="secret\|security\|purge\|remove key" -i
git branch -a | grep -i "backup\|sanitiz\|clean"
```

Read the histogram for **shape**, not totals. A month holding 60% of commits explains why
parts of the codebase are meticulous and parts are careless — same author, different speed.
That single insight reframes every defect in the document as *context* rather than blame.

Security-related commits plus `backup/sanitized-*` branches usually mean **secrets were once
committed and history was rewritten.** Say so plainly, and note that a leaked key must be
rotated regardless of a rewrite, since clones and scrapers may already hold it.

## Secret hygiene

```bash
git ls-files | grep -iE "\.env|\.properties|\.ya?ml|secrets|credentials"
cat .gitignore
grep -rnE "(api[_-]?key|secret|password|token)\s*[=:]\s*['\"][A-Za-z0-9]{16,}" $EXCLUDES
```
Distinguish three states: never committed (good), ignored but still tracked (gitignore does
not apply to already-tracked files — real trap), and committed with a fallback default.

A pattern worth a **high** finding: `${SECRET:some-default-in-the-repo}` — the server boots
silently with a public key when the env var is missing.

## Config keys that are silently dead

```bash
grep -rhoE '\$\{[a-z][a-zA-Z0-9._-]+' src/main/java | sed 's/\${//' | sort -u > /tmp/used
grep -rhoE '^[a-z][a-zA-Z0-9._-]+(?==)' src/main/resources/*.properties | sort -u > /tmp/defined
comm -3 /tmp/used /tmp/defined
```
Near-miss names (`jwt.access-expiration-ms` in code vs `jwt.access.expiration-ms` in config)
produce settings that do nothing, with no error. Symptomless today, hours lost later.
Same idea applies to `process.env.X` vs `.env` keys.

## Rot and debt markers

```bash
grep -rnE "TODO|FIXME|HACK|XXX" $EXCLUDES | head -40
find . -type d -empty $EXCLUDES                       # planned structure never built
find . -name "*.EXT" $EXCLUDES | xargs wc -l | sort -rn | head -10   # giant files
grep -rn "[?][?][?]\|占쎈\|�" $EXCLUDES | head          # encoding corruption
```
A `TODO` next to authentication is a **high** finding, not a note. Empty directories paired
with one oversized file mean an abandoned refactor plan — report both together.

## Performance patterns worth checking

```bash
grep -rn "findAll()" src/ | head              # load-everything then filter
grep -rnB2 -A6 "for\|while\|\.map(" src/ | grep -n "repository\.\|await db\|SELECT"
```
A query inside a loop is the N+1 pattern. Quote the loop and state the cost in the reader's
terms ("1,000 users → 1,001 queries"), not as jargon.
