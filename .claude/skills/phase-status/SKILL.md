---
name: phase-status
description: Show where the Flash Sale Lab currently stands — active phase, ticked vs remaining steps, the next step with its DoD, and which learning-discipline gates are still open. Use when the user asks "where am I", "what's next", "phase status", "what should I do next", or before starting a work session.
---

# Skill: phase-status

Give the user a fast, accurate snapshot of their progress in the phase plan, then point them at the single next action.

## Steps

1. **Read progress source of truth.** `docs/PHASES.md` — checkboxes (`- [x]` done, `- [ ]` todo) are authoritative (RULES E5).
2. **Determine current phase & branch.** Run `git branch --show-current` and `git log --oneline -8`. Cross-check the branch name (`phase/N-...`) with the first unchecked step.
3. **Find the next step.** The first `- [ ]` in the lowest-numbered incomplete phase. Read its **Làm gì**, **Gợi ý**, and **DoD**.
4. **Check open learning gates** for the current phase (don't run tools that mutate anything):
   - Is there a `📖 Đọc trước` block for this phase/step the user should read first?
   - For load-test steps: is there a PREDICT written in `docs/LEARNING-LOG.md` yet (RULES A4)?
   - Are the phase-completion artifacts present if the phase is near done — `loadtest/results/`, a comparison table + LEARNING-LOG entry (RULES A3)?
5. **Report** concisely:
   - Current phase + branch.
   - `▓▓▓░░` style or `x/n steps` progress for the active phase.
   - **Next step**: id (e.g. `P2.S3`), one-line what, and its DoD as a checklist.
   - Any open gate the user must clear before/after that step.
   - A reminder of the loop: READ → PREDICT → BUILD → MEASURE → EXPLAIN (GUIDE §2).

## Rules
- Do NOT implement the next step or write code. This skill only reports and orients (CLAUDE.md 1, RULES A5).
- Do NOT tick checkboxes — that's the user's action after they finish (RULES A6/E5).
- Keep it short: the user wants orientation, not a lecture.
