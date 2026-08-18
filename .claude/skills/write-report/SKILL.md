---
name: write-report
description: Write or update the per-phase implementation report under docs/reports/ after implementing or reviewing a step in the Flash Sale Lab, following the docs/reports/phase-0-setup.md structure required by CLAUDE.md rule 7. Use after finishing/reviewing a step, or when the user asks to "write the report", "update the phase report", or "document what we did".
---

# Skill: write-report

Produce the implementation report mandated by **CLAUDE.md rule 7** after every implementation or review. The report explains, for the future reader: how the services connect (ports, where configured), the startup and request flows, and what each important piece of code means.

## How to run

Delegate the writing to the **report-writer** subagent (it is scoped to write only under `docs/reports/`), or perform the steps below directly if a subagent isn't appropriate.

1. **Scope the work.** `git diff` and identify the changed files and which `PHASES.md` step(s) they implement.
2. **Pick the target file.** `docs/reports/phase-N-<short-name>.md`. If it exists, UPDATE it (append the new step, refresh flow/connection tables); do not create a duplicate.
3. **Read the template.** `docs/reports/phase-0-setup.md` — mirror its section skeleton:
   1. Big picture after this phase + port/config-location table + startup dependency order.
   2. Detailed flows: startup, one SUCCESS request (name every class/hop), one ERROR/failure flow (Phase 2+ include Redis/Rabbit/Kafka hops with exact key/queue/topic names).
   3. Step-by-step of what was done (with meaning).
   4. Code explanation per important file (call out the lines carrying the design).
   5. Decisions & incidents to remember before the next phase.
   6. Hook into the phase's self-check questions.
4. **Ground the names.** Use `docs/ARCHITECTURE.md §5–§8` for exact keys/queues/topics/flows; use this machine's real config (backend **8090**, Redis 6379/5540, Rabbit 5672/15672, Kafka 9092/8085, Analytics 8081, FE 5173).
5. **Verify accuracy.** Never describe code that isn't in the diff. If the code contradicts the intended design, note it in section 5.

## Rules
- Write only under `docs/reports/`. Do not modify source code or other docs.
- English prose, but keep code identifiers, paths, key/queue/topic names verbatim.
- Report the file path written and a one-line summary when done.
