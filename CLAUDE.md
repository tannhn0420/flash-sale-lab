# Flash Sale Lab — Learning Project

## Mục đích project
Đây là **dự án học tập** của user về Redis, RabbitMQ, Kafka qua bài toán Flash Sale.
Stack: Spring Boot 3 (Java 21, Maven) + React 18 (TypeScript, Vite) + Docker Compose.

## QUAN TRỌNG — Cách hỗ trợ user trong repo này

User đang **học công nghệ**, không phải cần ship feature nhanh. Vì vậy:

1. **KHÔNG viết sẵn toàn bộ code hộ user** trừ khi user yêu cầu rõ ràng. Ưu tiên: giải thích khái niệm → gợi ý hướng → để user tự code → review code của user.
2. Khi user hỏi, **giải thích "tại sao" trước "làm thế nào"**. Luôn liên hệ về vấn đề mà công nghệ đó giải quyết trong project này.
3. Làm đúng theo phase trong `docs/PHASES.md`. **Không nhảy phase**, không giới thiệu công nghệ trước khi phase yêu cầu (ví dụ: không dùng Redis khi đang ở Phase 1).
4. Tuân thủ `docs/RULES.md` (coding convention) và `docs/PATTERNS.md` (pattern chuẩn của repo).
5. Sau mỗi phase, nhắc user viết `docs/LEARNING-LOG.md` và chạy load test so sánh trước/sau.
6. Code review: chỉ ra vấn đề + giải thích, không tự sửa trừ khi được yêu cầu.
7. **Sau MỖI lần implement** (dù AI code hay review code user): viết/cập nhật **implementation report** vào `docs/reports/phase-N-<ten>.md` — chi tiết từng bước đã làm + ý nghĩa, các service kết nối với nhau thế nào (port, config ở đâu), flow request/startup đi qua những đâu, và giải thích từng đoạn code quan trọng. Mẫu: `docs/reports/phase-0-setup.md`.

## Tài liệu
- `docs/GUIDE.md` — learning workflow, setup, glossary
- `docs/ARCHITECTURE.md` — kiến trúc từng phase, data model, naming (Redis keys, queues, topics)
- `docs/RULES.md` — quy tắc code Java/React/messaging/git
- `docs/PATTERNS.md` — pattern kiến trúc/tích hợp (cache, queue, event)
- `docs/CLEAN-CODE.md` — design pattern cấp code (GoF) & clean code BE/FE, map theo step; tối đa 1–2 pattern mới mỗi phase
- `docs/PHASES.md` — kế hoạch step-by-step, checkbox tiến độ
- `docs/reports/` — implementation report từng phase (flow, kết nối service, giải thích code)

## Commands (khi code đã hình thành)
```bash
# Hạ tầng
docker compose -f infra/docker-compose.yml up -d

# Backend
cd backend && ./mvnw spring-boot:run

# Frontend
cd frontend && npm run dev

# Load test
k6 run loadtest/order-burst.js
```

## Conventions tóm tắt
- Java: package-by-feature (`product/`, `order/`, `common/`), DTO là `record`, constructor injection, không expose entity ra controller.
- React: feature folders, fetch qua `src/api/client.ts`, không Redux.
- Messaging: mọi message có `eventId`, `occurredAt`; consumer phải idempotent; mọi queue có DLQ.
- Git: branch `phase/N-ten-ngan`, conventional commits, mỗi step một commit.
