---
name: loadtest
description: Run a k6 load test for the Flash Sale Lab and capture results for phase comparison — enforcing the discipline: PREDICT first, reset+activate, run, save to loadtest/results/, then reconcile (0 oversell) and prompt a LEARNING-LOG entry. Use when the user says "run the load test", "bắn k6", "measure", or "load test phase N".
---

# Skill: loadtest

Drive a disciplined load-test run. The point isn't just to run k6 — it's to produce trustworthy before/after numbers and force reflection (RULES A3/A4). Infra runs in Docker; backend on **8090** on this machine.

## Preconditions (do not skip — this is the learning ritual)
1. **PREDICT first (RULES A4).** Confirm a prediction is already written in `docs/LEARNING-LOG.md` for this run. If not, STOP and have the user write one (offer the `learning-log` skill). Never run before the prediction exists.
2. **Reset + activate.** Reset data to a known baseline (`loadtest/reset.sql`: stock=100, orders cleared) and, for Phase 2+, activate the sale (`POST /api/admin/sales/{id}/activate`) so `fs:stock:{id}` is loaded. This is the "nghi thức khai hỏa" before every run.
3. **Infra up.** `docker compose -f infra/docker-compose.yml up -d` and the backend running.

## Run
1. Identify the script under `loadtest/` (e.g. `order-burst.js`) and the intended VUs/duration for this phase (Phase 1: 200 VUs; Phase 2: 500; Phase 3: 1000 with stock 2000). Confirm with the user.
2. Run: `k6 run loadtest/order-burst.js` (add `--out json=loadtest/results/phaseN-<variant>.json` or tee the summary to `loadtest/results/phaseN-<variant>.txt`). Watch CPU with `docker stats` when comparing Postgres vs Redis pressure.
3. Save the summary under `loadtest/results/` with a phase/variant name (RULES E4). These files are committed for cross-phase comparison.

## After the run — verify the invariants
1. **Count oversell.** `SELECT count(*) FROM orders;` and `SELECT stock FROM products;` (or the Redis `fs:stock:{id}`). Phase 1 naive: expect oversell. Phase 2+: expect **0**.
2. **Reconcile (Phase 3+).** `CONFIRMED + remaining stock == initial` (P9). Use `GET /api/admin/sales/{id}/reconcile` if it exists.
3. **Compare vs previous phase** — pull the matching `loadtest/results/*` file and put the delta (oversell, p99 POST /orders, req/s) into words.
4. **Prompt the reflection.** Remind the user to record actual-vs-PREDICT and the takeaway in `docs/LEARNING-LOG.md` and to update the summary table (offer the `learning-log` skill). A phase isn't done without this (RULES A3).

## Rules
- Never run without a written PREDICT.
- Never silently "fix" a bad number — a bad baseline (e.g. Phase 1 oversell) is the intended learning artifact.
- Save every run; results are the repo's evidence.
