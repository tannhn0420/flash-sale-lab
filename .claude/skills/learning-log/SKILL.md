---
name: learning-log
description: Add a structured entry to docs/LEARNING-LOG.md for the Flash Sale Lab — either a PREDICT (written BEFORE a load test, RULES A4) or a full post-step reflection (RULES A3). Use when the user says "log this", "write a learning log entry", "record my prediction", or finishes a step/load test. Coaches the user to write in their own words rather than writing conclusions for them.
---

# Skill: learning-log

Help the user keep `docs/LEARNING-LOG.md` — the highest-priority artifact in this repo (RULES A3/A4). The log is written for "the user 3 months from now."

## Two modes

### 1. PREDICT (before a load test — RULES A4)
Before any k6 run, a prediction must be written FIRST. Prompt the user for their numbers, then append the prediction. Do NOT invent the prediction for them — ask: "stock=?, VUs=?, how many 201s do you expect? p99?" Capture their answer verbatim.

### 2. Post-step reflection (RULES A3)
After a step/phase, append an entry using the repo's template (already at the top of `LEARNING-LOG.md`):

```markdown
## YYYY-MM-DD — Phase X, Step PX.SY
**Làm gì**: ...
**PREDICT** (nếu có đo đạc): ...
**Kết quả thực tế**: ...
**Học được / vỡ ra**: ...
**Chỗ bí & cách thoát**: ...
**Ý tưởng để sau** (scope guard — RULES A7): ...
```

## Steps
1. Read the current `docs/LEARNING-LOG.md` (template + running results table live at top; newest entries go directly under `<!-- Entries bắt đầu từ đây -->`, newest on top).
2. Use today's date from context (do not guess). Fill the step id from `docs/PHASES.md`.
3. Gather the substance FROM THE USER — especially "Học được / vỡ ra" and the self-check answers (RULES A6). The learning must be in their words; you may tidy phrasing, not manufacture insight (RULES A1/A5).
4. If a load test ran, also offer to update the **Bảng số liệu tổng** table at the top (oversell, p99, req/s per scenario).
5. Append the entry; keep the template's Vietnamese field labels intact (the user's log is Vietnamese) even though your coaching is in English.

## Rules
- Never fabricate results or predictions. If a number is missing, ask.
- Preserve existing entries and the summary table.
- A PREDICT must be timestamped before the corresponding result — never backfill a prediction after seeing results.
