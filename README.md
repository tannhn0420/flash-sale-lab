# Flash Sale Lab

Dự án học tập: xây dựng hệ thống Flash Sale chịu tải cao để học **Redis, RabbitMQ, Kafka** một cách thực chiến, với **Spring Boot (BE) + React (FE)**.

> Triết lý của repo này: **gặp vấn đề trước, học công nghệ sau**. Mỗi công nghệ chỉ được thêm vào khi ta đã tự tay đo được vấn đề mà nó giải quyết.

## Bắt đầu từ đâu?

Đọc theo thứ tự:

1. [docs/GUIDE.md](docs/GUIDE.md) — Cách học với repo này, setup môi trường, glossary
2. [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — Kiến trúc hệ thống, tiến hóa qua từng phase
3. [docs/RULES.md](docs/RULES.md) — Quy tắc code, quy tắc học, quy tắc git
4. [docs/PATTERNS.md](docs/PATTERNS.md) — Catalog pattern kiến trúc/tích hợp (cache, queue, event — đọc từng pattern khi phase yêu cầu)
5. [docs/CLEAN-CODE.md](docs/CLEAN-CODE.md) — Design pattern cấp code (GoF) & clean code cho cả BE lẫn FE, map vào từng step
6. [docs/PHASES.md](docs/PHASES.md) — **Kế hoạch chi tiết từng step** — đây là tài liệu làm việc chính
7. [docs/LEARNING-LOG.md](docs/LEARNING-LOG.md) — Nhật ký học tập (tự viết sau mỗi phase)

## Cấu trúc repo (sẽ hình thành dần theo phase)

```
flash-sale-lab/
├── docs/           # Tài liệu (đã có sẵn)
├── infra/          # docker-compose: Postgres, Redis, RabbitMQ, Kafka
├── backend/        # Spring Boot: API + worker
├── analytics/      # Spring Boot: Kafka consumer (Phase 4)
├── frontend/       # React + Vite + TypeScript
└── loadtest/       # k6 scripts
```

## Tech stack

| Layer | Công nghệ | Ghi chú |
|---|---|---|
| Backend | Java 21, Spring Boot 3.x, Maven | JPA + Flyway + Postgres |
| Frontend | React 18, TypeScript, Vite | Không dùng state lib nặng |
| Cache / Counter | Redis 7 | Phase 2 |
| Task Queue | RabbitMQ 4 | Phase 3 |
| Event Streaming | Apache Kafka (KRaft) | Phase 4 |
| Load test | k6 | Từ Phase 1 |
| Hạ tầng dev | Docker Compose | Tất cả chạy local |

## Tiến độ

Xem checkbox trong [docs/PHASES.md](docs/PHASES.md).

- [ ] Phase 0 — Môi trường & Skeleton
- [ ] Phase 1 — Naive system + chứng kiến oversell
- [ ] Phase 2 — Redis: cache, atomic counter, rate limit
- [ ] Phase 3 — RabbitMQ: async order pipeline
- [ ] Phase 4 — Kafka: event streaming & analytics
- [ ] Phase 5 — (Optional) Hardening & observability
