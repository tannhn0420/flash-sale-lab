# GUIDE — Cách học với repo này

## 1. Bức tranh lớn

Ta xây một hệ thống **Flash Sale**: mở bán 100 sản phẩm, hàng nghìn người bấm mua cùng lúc.
Bài toán này được chọn vì nó **ép** ta gặp đủ các vấn đề mà Redis/RabbitMQ/Kafka sinh ra để giải:

| Vấn đề sẽ gặp | Công nghệ giải quyết | Phase |
|---|---|---|
| Race condition → bán quá số lượng (oversell) | Atomic operation (DB rồi Redis) | 1 → 2 |
| DB không chịu nổi lượng đọc lớn | Redis cache | 2 |
| Một user spam hàng trăm request | Redis rate limit | 2 |
| DB không chịu nổi lượng ghi dồn dập | RabbitMQ — hàng đợi giãn tải | 3 |
| Xử lý order thất bại giữa chừng | Retry + Dead Letter Queue | 3 |
| Muốn phân tích hành vi real-time mà không đụng vào luồng chính | Kafka — event streaming | 4 |

**Nguyên tắc số 1 của repo:** không thêm công nghệ nào trước khi tự tay ĐO được vấn đề của nó. Phase 1 cố tình xây hệ thống ngây thơ (naive) để nó sập — đó là baseline.

## 2. Learning workflow — lặp lại cho MỖI step

Mỗi step trong `PHASES.md` đều đi qua vòng lặp 5 bước này. Đây là phần quan trọng nhất của GUIDE:

```
┌─────────────────────────────────────────────────────┐
│  1. READ     Đọc phần concept được chỉ định          │
│              (mục "Đọc trước" của step)              │
│  2. PREDICT  Viết ra dự đoán: "làm xong step này,    │
│              số liệu/hành vi sẽ là ...?"             │
│  3. BUILD    Tự code. Bí quá mới xem gợi ý/hỏi AI.   │
│  4. MEASURE  Chạy + load test (nếu step có yêu cầu). │
│              So với PREDICT.                         │
│  5. EXPLAIN  Trả lời "Câu hỏi tự kiểm" của step      │
│              bằng lời của mình → ghi LEARNING-LOG.   │
└─────────────────────────────────────────────────────┘
```

- **PREDICT trước khi BUILD** là thứ phân biệt "học" với "chép tutorial". Sai dự đoán là lúc học được nhiều nhất.
- **EXPLAIN**: nếu không giải thích được cho người khác hiểu thì chưa xong step, quay lại READ.
- Đừng tiếc thời gian cho MEASURE. Con số trước/sau (`p99 latency`, `oversell count`, `throughput`) là bằng chứng học tập giá trị nhất — và là chuyện để kể khi phỏng vấn/review.

## 3. Setup môi trường (làm 1 lần, chi tiết trong Phase 0)

| Tool | Version tối thiểu | Kiểm tra |
|---|---|---|
| Java (Temurin/Oracle) | 21 | `java -version` |
| Maven wrapper | đi kèm project | `./mvnw -v` |
| Node.js | 20 LTS | `node -v` |
| Docker Desktop | mới nhất | `docker compose version` |
| k6 (load test) | mới nhất | `k6 version` |
| IDE | IntelliJ IDEA CE (Java) + VS Code (React) | |

Tất cả hạ tầng (Postgres, Redis, RabbitMQ, Kafka) chạy bằng Docker Compose — **không cài trực tiếp lên máy**.

### Ports quy ước (tránh đụng project khác)

| Service | Port | UI quản trị |
|---|---|---|
| Postgres | 5432 | (DBeaver/IntelliJ) |
| Redis | 6379 | RedisInsight 5540 |
| RabbitMQ | 5672 | Management UI **15672** (guest/guest) |
| Kafka | 9092 | Kafka UI **8085** |
| Backend API | 8080 | Actuator `/actuator/health` |
| Analytics service | 8081 | |
| Frontend dev | 5173 | |

## 4. Nhịp học đề xuất

Mỗi "buổi" ≈ 1.5–2 giờ buổi tối. Tổng ~16–20 buổi (~5-6 tuần nếu 3 buổi/tuần).

| Phase | Nội dung | Số buổi |
|---|---|---|
| 0 | Môi trường & skeleton | 2–3 |
| 1 | Naive system + oversell | 2–3 |
| 2 | Redis | 3–4 |
| 3 | RabbitMQ | 4–5 |
| 4 | Kafka | 4–5 |
| 5 | (Optional) Hardening | tùy |

Quy tắc nhịp độ: **thà chậm mà chắc**. Kết thúc mỗi buổi bằng 1 commit + 2-3 dòng LEARNING-LOG, kể cả khi step chưa xong.

## 5. Glossary — thuật ngữ sẽ gặp

Đọc lướt bây giờ, quay lại tra khi gặp trong phase.

- **Race condition**: hai luồng đọc-rồi-ghi cùng dữ liệu, kết quả phụ thuộc thứ tự chạy → sai dữ liệu (nguồn gốc oversell).
- **Oversell**: bán nhiều hơn tồn kho. Chỉ số thất bại chính của Phase 1.
- **Atomic operation**: thao tác không thể bị xen giữa (VD `DECR` của Redis, `UPDATE ... WHERE stock > 0` của SQL).
- **Cache-aside**: app tự đọc cache trước, miss thì đọc DB rồi ghi ngược vào cache. Pattern cache phổ biến nhất.
- **TTL (Time To Live)**: thời gian sống của key cache.
- **Cache stampede**: cache hết hạn đúng lúc cao điểm → cả nghìn request cùng dội xuống DB.
- **Idempotency**: xử lý cùng 1 request/message nhiều lần nhưng kết quả như xử lý 1 lần. Bắt buộc trong hệ messaging.
- **Producer / Consumer**: bên gửi / bên nhận message.
- **Exchange / Queue / Binding** (RabbitMQ): message vào *exchange*, exchange định tuyến vào *queue* theo *binding*; consumer đọc từ queue.
- **Ack / Nack**: consumer xác nhận đã xử lý xong / báo lỗi để requeue hoặc đẩy đi nơi khác.
- **Prefetch**: số message tối đa RabbitMQ giao cho 1 consumer chưa ack — van điều tiết backpressure.
- **DLQ (Dead Letter Queue)**: nơi chứa message xử lý thất bại sau N lần retry (poison message).
- **At-least-once delivery**: message có thể được giao ≥1 lần → consumer phải idempotent. (Mặc định thực tế của cả RabbitMQ lẫn Kafka.)
- **Topic / Partition / Offset** (Kafka): topic là log sự kiện; chia thành partition để song song; offset là vị trí đọc của consumer.
- **Consumer group** (Kafka): nhóm consumer chia nhau partition; mỗi partition chỉ 1 consumer trong group đọc.
- **Retention** (Kafka): message KHÔNG mất sau khi đọc, giữ theo thời gian cấu hình → có thể replay. Khác biệt bản chất với RabbitMQ.
- **Backpressure**: cơ chế kìm tốc độ đầu vào khi đầu ra xử lý không kịp.
- **p95 / p99 latency**: độ trễ mà 95%/99% request nhanh hơn nó. Quan trọng hơn average.
- **VU (Virtual User)**: user ảo trong k6.

## 6. Tài nguyên đọc thêm (chọn lọc, đọc theo phase)

- Phase 1–2: Redis docs — *Redis as a cache*, lệnh `SET/GET/DECR/EXPIRE/EVAL`; bài "Cache stampede" bất kỳ.
- Phase 3: RabbitMQ official tutorials 1–5 (Java) — ngắn và rất tốt; docs *Reliability Guide*.
- Phase 4: Kafka docs phần *Design* (chỉ cần mục Motivation, Persistence, Consumer position); bài "Kafka in a Nutshell".
- Xuyên suốt: *Designing Data-Intensive Applications* (Kleppmann) — chương 8, 11 nếu muốn đào sâu. Không bắt buộc.

## 7. Khi bí thì làm gì (theo thứ tự)

1. Đọc lại phần concept của step + PATTERNS.md liên quan.
2. Nhìn log: `docker compose logs -f <service>`, log Spring, tab Network của browser.
3. Dùng UI quản trị (RabbitMQ Management, Kafka UI, RedisInsight) — *nhìn thấy* message/key thường giải quyết 80% hoang mang.
4. Hỏi AI — nhưng hỏi "giải thích/gợi ý hướng", đừng xin code hoàn chỉnh (xem RULES mục Quy tắc học).
5. Ghi lại chỗ bí vào LEARNING-LOG kể cả khi đã giải quyết — chỗ bí của bạn là chỗ bí của mọi người.
