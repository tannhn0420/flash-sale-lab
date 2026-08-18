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
