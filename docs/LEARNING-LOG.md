# LEARNING LOG — Nhật ký học tập

Quy tắc (RULES A3, A4): mỗi buổi học ít nhất vài dòng; mỗi lần load test phải có PREDICT ghi TRƯỚC khi chạy. Viết cho "mình của 3 tháng sau" đọc.

## Template entry (copy xuống dưới, mới nhất để trên cùng)

```markdown
## YYYY-MM-DD — Phase X, Step PX.SY
**Làm gì**: ...
**PREDICT** (nếu có đo đạc): ...
**Kết quả thực tế**: ...
**Học được / vỡ ra**: ...
**Chỗ bí & cách thoát**: ...
**Ý tưởng để sau** (scope guard — RULES A7): ...
```

## Bảng số liệu tổng (cập nhật dần)

| Kịch bản | Oversell | p99 POST /orders | req/s | Ghi chú |
|---|---|---|---|---|
| P1 naive (200 VUs) | ? | ? | ? | baseline lỗi |
| P1 serializable | 0? | ? | ? | đúng nhưng... |
| P1 atomic update | 0 | ? | ? | DB làm trọng tài |
| P2 redis (500 VUs) | 0 | ? | ? | Redis làm trọng tài |
| P3 rabbitmq (1000 VUs) | 0 | ? | ? | API mỏng, 202 |
| P3 tuning (prefetch/concurrency) | 0 | ? | ? | |

---

<!-- Entries bắt đầu từ đây -->

## 2026-08-18 — Phase 0, P0.S1 → P0.S8 (setup, AI hỗ trợ toàn bộ — phase sau tự code)
**Làm gì**: Dựng skeleton đầy đủ: Postgres 16 (Docker, healthcheck), Spring Boot 3.5.16 + Java 21 (scaffold, `application.yml`), Flyway `V1__init` + `V2__seed`, endpoint `GET /api/products/{id}` (+ GlobalExceptionHandler chuẩn ARCHITECTURE §6), React + Vite (proxy `/api`, `api/client.ts`), ProductPage hiển thị sản phẩm từ DB thật.
**Tool versions (P0.S1)**: Java OpenJDK 21.0.2 · Node v24.15.0 · Docker Compose v5.3.1 · k6 v2.2.0 (cài qua `winget install GrafanaLabs.k6`) · Postgres 16.15 (container `fs-postgres`).
**Kết quả thực tế**: `/actuator/health` → UP · `/api/products/1` → 200 JSON đúng DTO · `/api/products/999` → 404 `{"code":"NOT_FOUND",...}` · `localhost:5173` hiển thị "iPhone Flash Sale 15.000.000 ₫, stock 100" qua proxy.
**Chỗ bí & cách thoát**:
1. Port 8080 bị app Caris (công việc) chiếm → backend đổi sang **8090** (`server.port` trong `application.yml` + proxy trong `vite.config.ts`). Muốn về 8080 thì sửa 2 chỗ đó.
2. start.spring.io **đã bỏ Spring Boot 3.x** (chỉ còn 4.x, vì 3.5 hết OSS support 06/2026) → tự pin `spring-boot-starter-parent` **3.5.16** trong pom (Maven Central giữ artifact vĩnh viễn). Chọn 3.x để khớp docs repo + tutorial RabbitMQ/Kafka phổ biến.
3. Dừng `mvnw spring-boot:run` kiểu kill process cha → **process java con vẫn giữ port** → phải tìm process theo port (`Get-NetTCPConnection -LocalPort 8090`) và kill đúng PID (kiểm tra command line có "flashsale" trước khi kill).
**Học được / vỡ ra**: _(tự viết sau khi trả lời 3 câu hỏi tự kiểm Phase 0 — xem PHASES.md)_
**Ý tưởng để sau**: —

