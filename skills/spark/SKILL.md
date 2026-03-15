---
name: spark
description: This skill should be used when the user invokes "/spark" or asks "what's the best thing you could add to this PR/project?", "what single feature would make this better?", "what's the most impactful next move?", or "what would you add to this branch/codebase?". Generates the single smartest, most innovative and high-value addition to the current PR/branch or project, then offers to implement it.
invoke: spark
license: MIT
metadata:
  author: stackone
  version: "1.0"
---

# Spark — Find the Single Best Next Move

Identify the most innovative, high-value addition to the current context — a PR/branch in progress, or the entire project — then offer to build it.

## Step 1: Detect Context

Run these together to understand current state:

```bash
git branch --show-current          # Are we on a named branch?
git status --short                 # Any uncommitted changes?
git log --oneline -10              # Recent commit history
```

Then decide which mode applies:

### Branch/PR Mode
Triggers when: on a non-default branch (`main`/`master`/`develop`/`trunk`) OR when there are staged/uncommitted changes that form a coherent unit of work.

Gather PR context:
```bash
git diff main...HEAD --stat        # What files changed?
git diff main...HEAD               # Full diff (skim for intent)
git log main...HEAD --oneline      # Commits in this branch
gh pr view 2>/dev/null             # PR title, description, comments
```

### Project Mode
Triggers when: on the default branch with no active feature work.

Gather project context:
```bash
ls -la                             # Root structure
cat README.md 2>/dev/null | head -60
cat package.json 2>/dev/null       # or Cargo.toml, pyproject.toml, etc.
git log --oneline -20              # Recent trajectory
```

Also read key architectural files (routes, main entry points, core modules) to understand what exists.

## Step 2: Synthesize and Ideate

With context gathered, think hard. The goal: find the **single highest-leverage addition** that is:

- **Non-obvious** — not the next logical TODO item or a feature already implied by the PR
- **Accretive** — genuinely multiplies the value of what's already there
- **Feasible** — implementable in this codebase without a full rewrite
- **Specific** — a concrete feature/change, not a vague theme like "better error handling"

### For Branch/PR Mode
Focus on: what would make this PR go from good to exceptional? What's the one thing that would make reviewers say "wow, I didn't think of that"? Consider: edge cases that become features, DX improvements, observability, composability, performance wins, security hardening that's elegant rather than bolt-on.

### For Project Mode
Focus on: what single addition would unlock the most value for users/developers? Consider: killer features that are missing, architectural capabilities that enable a class of new use cases, developer experience that removes the biggest friction point, integrations that make the whole more valuable than the sum of parts.

**Avoid**: generic suggestions (add tests, add docs, add logging). The idea should be surprising and specific.

## Step 3: Present the Idea

Present ONE idea with conviction. Format:

```
## Spark: [Catchy Name for the Idea]

**What**: [One crisp sentence]

**Why it's the right move**: [2-3 sentences on why this is the highest-leverage addition
right now, referencing specifics from the codebase/PR]

**How it would work**: [Concrete sketch — key files touched, rough approach, any
interesting technical choices. Not a full spec, just enough to make it tangible]

**Impact**: [What does this unlock? Who benefits? Why does it matter?]
```

Then use `AskUserQuestion` to ask:

- **"Want to build it?"** with options: Yes, build it now / Refine the idea first / Show me alternatives

## Step 4: Act on Response

**"Yes, build it now"** → Call `EnterPlanMode` to design the full implementation. Use the existing codebase patterns, read relevant files, and produce a concrete step-by-step plan before writing any code.

**"Refine the idea first"** → Ask clarifying questions: scope, constraints, preferences. Then re-present the refined version and loop back to Step 3.

**"Show me alternatives"** → Generate 2-3 more options (weaker than the primary but still strong), let user pick, then proceed with their choice.

## Principles

- **One idea, not a list.** Presenting multiple ideas dilutes the thinking. Commit to the best one.
- **Specificity over generality.** "Add a `--watch` flag that re-runs the build on file change, streaming output to a WebSocket" beats "improve developer experience".
- **Reference what's actually there.** The idea should feel inevitable given the existing code, not imported from another project.
- **Be direct.** Don't hedge with "you might consider" or "one option could be". State the idea with confidence.
