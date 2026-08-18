# .claude — Souls & Skills for Flash Sale Lab

Project-scoped agents ("souls") and skills that enforce this repo's **learning discipline**
(CLAUDE.md, `docs/RULES.md §A`). Everything here mentors and reviews — nothing auto-generates
whole features. All content is English; it references the Vietnamese docs and preserves
code/key/queue/topic names verbatim.

## Souls (`agents/`) — invoke with the Agent tool / `@agent-name`

| Soul | Use it for | Writes files? |
|---|---|---|
| `mentor` | Conceptual why/how/what-if questions. Socratic, hints not code. | No |
| `java-reviewer` | Review backend Java/Spring vs `RULES §B` + patterns. | No |
| `react-reviewer` | Review frontend React/TS vs `RULES §C`. | No |
| `messaging-reviewer` | Review Redis/Rabbit/Kafka vs `RULES §D` + `ARCHITECTURE §5`. | No |
| `report-writer` | Write/update `docs/reports/phase-N-*.md` (CLAUDE.md rule 7). | Only under `docs/reports/` |
| `phase-guardian` | Gate a step/phase/merge: DoD, no phase-jump, PREDICT/log/results present. | No |

## Skills (`skills/`) — invoke with `/skill-name`

| Skill | What it does |
|---|---|
| `/phase-status` | Where am I: active phase, next step + DoD, open learning gates. |
| `/write-report` | Produce/update the phase implementation report. |
| `/learning-log` | Add a PREDICT (before a run) or a post-step reflection to `LEARNING-LOG.md`. |
| `/loadtest` | Disciplined k6 run: PREDICT → reset+activate → run → save → reconcile → reflect. |

## The loop these enforce (GUIDE §2)
READ → PREDICT → BUILD → MEASURE → EXPLAIN. A phase isn't done without a load test +
before/after table + LEARNING-LOG entry (RULES A3).
