# PATTERNS — Catalog pattern của repo

Mỗi pattern: **Vấn đề → Giải pháp → Dùng ở đâu trong repo → Bẫy thường gặp**.
Đừng đọc hết một lượt — mỗi step trong PHASES.md sẽ chỉ định "đọc pattern Pn trước khi code".

---

## Nhóm Redis

### P1. Cache-Aside (Lazy Loading)
- **Vấn đề**: hàng nghìn request đọc cùng 1 sản phẩm, DB tốn công trả lời cùng 1 câu.
- **Giải pháp**: app đọc cache trước; miss → đọc DB → ghi vào cache với TTL → trả về. Ghi/sửa dữ liệu → **xóa (invalidate)** key cache, không update tay.
- **Dùng ở**: `GET /api/products/{id}` — key `fs:product:{id}`, TTL 60s. Lưu ý: **stock KHÔNG nằm trong cache này** (stock là dữ liệu nóng, có nguồn riêng `fs:stock:*`).
- **Bẫy**: (1) cache entity JPA trực tiếp → lỗi serialize; cache DTO/JSON. (2) Quên invalidate khi admin sửa sản phẩm → dữ liệu ôi. (3) Nhét dữ liệu thay đổi liên tục (stock) vào cache TTL → user thấy số sai.

### P2. Atomic Counter — quyết định thắng/thua bằng 1 lệnh
- **Vấn đề**: "check rồi mới trừ" (read-check-write) là race condition kinh điển → oversell.
- **Giải pháp**: gộp check + trừ thành 1 thao tác atomic. Redis: `DECR fs:stock:{id}`; nếu kết quả `< 0` nghĩa là thua → `INCR` trả lại và từ chối. Khi cần nhiều điều kiện (đã mua chưa + còn hàng) → gói vào **Lua script** (Redis chạy script như 1 lệnh atomic duy nhất).
- **Dùng ở**: `OrderService.reserveStock()` — Phase 2.
- **Bẫy**: (1) DECR rồi quên INCR bù ở nhánh từ chối → kho "bốc hơi". (2) Làm 2 lệnh Redis rời nhau (SISMEMBER rồi DECR) tưởng là atomic — không hề, giữa 2 lệnh vẫn bị xen. (3) Quên nạp key stock trước khi sale (DECR key không tồn tại → Redis coi là 0 → thành -1).

### P3. Rate Limiting — Fixed Window
- **Vấn đề**: 1 user (hoặc script) spam trăm request/giây, chiếm tài nguyên của người khác.
- **Giải pháp**: đếm request theo cửa sổ thời gian: `INCR fs:rl:{userId}:{epochMinute}` + `EXPIRE 120`; quá ngưỡng (VD 10/phút) → trả `429`.
- **Dùng ở**: filter/interceptor trước `POST /api/orders` — Phase 2.
- **Bẫy**: (1) Fixed window có "burst đường biên" (19 request lọt trong 2 giây quanh ranh giới phút) — biết vậy là đủ, nâng cấp sliding-window là bài tập thêm. (2) INCR và EXPIRE phải đảm bảo key nào cũng có TTL (set EXPIRE khi INCR trả về 1).

### P4. Idempotency Key (tầng API)
- **Vấn đề**: user double-click, mạng lag bấm lại → 2 request giống hệt nhau.
- **Giải pháp**: FE sinh `Idempotency-Key` (uuid) cho mỗi *ý định* mua; BE `SET fs:idem:{userId}:{key} orderId NX EX 600` — `SETNX` thất bại nghĩa là request lặp → trả kết quả cũ / `409 DUPLICATE_REQUEST`.
- **Dùng ở**: `POST /api/orders` — Phase 2. (Khác với P8 — idempotency tầng consumer.)
- **Bẫy**: FE sinh key mới mỗi lần re-render → vô dụng. Key phải gắn với hành động bấm mua, sinh 1 lần khi user nhấn.

### P13. Redis Pub/Sub — fanout tức thời, chấp nhận mất
- **Vấn đề**: worker xử lý xong order, làm sao API (đang giữ kết nối SSE với browser) biết mà đẩy xuống?
- **Giải pháp**: worker `PUBLISH fs:order-status {json}`; API subscribe channel này, match `orderId` → emit SSE.
- **Dùng ở**: Phase 3, bước SSE.
- **Bẫy**: pub/sub **không lưu message** — subscriber offline là mất. Vì thế chỉ dùng cho tín hiệu "nice to have" (UI update); trạng thái thật vẫn nằm trong DB, FE reconnect thì GET lại. Đừng bao giờ dùng pub/sub thay queue cho việc-phải-làm.

### P14. Chống Cache Stampede (biết để phòng)
- **Vấn đề**: key cache hết hạn đúng cao điểm → nghìn request cùng miss → cùng dội DB.
- **Giải pháp trong repo**: TTL + jitter ngẫu nhiên (60s ± 10s) để các key không chết cùng lúc. Nâng cao (chỉ cần biết tên): single-flight/lock để 1 request đi nạp, số còn lại đợi; hoặc refresh-ahead.
- **Dùng ở**: P1, Phase 2.

---

## Nhóm RabbitMQ

### P5. Async Request-Reply (202 Accepted + truy vấn trạng thái)
- **Vấn đề**: xử lý order mất 200–500ms (thanh toán). Bắt 5000 user giữ kết nối chờ là tự sát; ta chỉ cần *ghi nhận* yêu cầu nhanh.
- **Giải pháp**: API validate nhanh → publish message → trả ngay `202 {orderId, status: PENDING}`. Client theo dõi trạng thái qua polling `GET /api/orders/{id}` hoặc SSE.
- **Dùng ở**: `POST /api/orders` từ Phase 3. Đây là thay đổi **hợp đồng API** (201 → 202) — FE phải đổi theo.
- **Bẫy**: quên thiết kế "trạng thái trung gian" cho UI (user thấy gì lúc PENDING?). UX của async là bài toán thật, không phải chi tiết phụ.

### P6. Work Queue + Competing Consumers
- **Vấn đề**: việc dồn vào nhanh hơn tốc độ xử lý → cần hàng đợi làm giảm xóc (buffer) và nhiều worker chia việc.
- **Giải pháp**: N consumer cùng đọc 1 queue, RabbitMQ chia message round-robin theo khả năng ack. Điều tiết bằng `prefetch` (số message giao trước chưa ack cho mỗi consumer).
- **Dùng ở**: `fs.order.requested.q`, worker concurrency 2–4, prefetch 10 — Phase 3. Thí nghiệm chỉnh prefetch/concurrency và xem queue depth là bài học chính.
- **Bẫy**: (1) auto-ack (ack trước khi xử lý) → crash là mất message; dùng manual/auto sau xử lý thành công. (2) prefetch quá lớn → 1 worker ôm hết việc, worker khác ngồi chơi; quá nhỏ → round-trip nhiều, throughput giảm.

### P7. Retry với Backoff + Dead Letter Queue
- **Vấn đề**: xử lý fail tạm thời (DB chớp cháy, timeout) nên thử lại; nhưng message "độc" (dữ liệu hỏng, bug) thì thử lại mãi vô ích và kẹp chết consumer.
- **Giải pháp**: fail → reject không requeue → dead-letter sang `retry.q` có TTL 5s → hết TTL tự quay về queue chính (dead-letter lần nữa). Đếm số lần qua header `x-death`; quá 3 lần → route sang `dlq` nằm im chờ người xem.
- **Dùng ở**: topology `fs.order.requested.*` — Phase 3. Test bằng cách cố tình throw exception theo % và theo orderId cụ thể.
- **Bẫy**: (1) requeue=true mặc định → vòng lặp retry tức thời vô hạn, CPU 100%. (2) Không monitor DLQ → lỗi im lặng vĩnh viễn. Mở Management UI xem DLQ là thao tác bắt buộc cuối Phase 3.

### P8. Idempotent Consumer (tầng message)
- **Vấn đề**: at-least-once delivery — sau crash/retry, cùng message đến 2 lần → nguy cơ 2 đơn, trừ kho 2 lần.
- **Giải pháp**: xử lý phải "làm lần 2 vô hại": `orderId` do API sinh là khóa chính → `INSERT ... ON CONFLICT (id) DO NOTHING`; update trạng thái thì check trạng thái hiện tại trước (state machine: không cho FAILED → CONFIRMED).
- **Dùng ở**: `OrderWorker` — Phase 3; `FsEventsConsumer` analytics — Phase 4 (dedupe bằng `eventId` nếu cần chính xác, hoặc chấp nhận sai số đếm — quyết định có ý thức).
- **Bẫy**: nghĩ "mình ack cẩn thận rồi nên không cần idempotent" — sai; ack cẩn thận đến mấy vẫn có khe hở crash-sau-xử-lý-trước-ack.

### P9. Compensation (bù trừ, saga thu nhỏ)
- **Vấn đề**: đã trừ kho ở Redis (bước 1) nhưng thanh toán fail (bước 2) — không có transaction chung giữa Redis và DB.
- **Giải pháp**: mỗi bước có hành động bù: thanh toán fail → `INCR fs:stock` hoàn kho + `SREM fs:bought` + order → FAILED. Chuỗi "làm-hỏng-bù" chính là tư duy saga.
- **Dùng ở**: `OrderWorker` nhánh thất bại — Phase 3.
- **Bẫy**: hành động bù cũng có thể fail (INCR lỗi mạng) → tối thiểu phải log ERROR + đếm được (Phase 5: reconciliation job đối chiếu Redis vs DB). Chấp nhận và ghi nhận rủi ro là một phần của thiết kế.

---

## Nhóm Kafka

### P11. Event Notification & phân biệt với Task Queue
- **Vấn đề**: nhiều bên (analytics, sau này: email, audit...) muốn biết "chuyện gì đã xảy ra" mà không được phép làm chậm/làm hỏng luồng bán.
- **Giải pháp**: luồng chính produce **sự kiện quá khứ** ("ORDER_CONFIRMED") vào Kafka topic — không biết và không quan tâm ai đọc. Consumer mới thêm vào sau vẫn đọc lại được lịch sử (retention). Đối lập với RabbitMQ message = **mệnh lệnh** ("hãy xử lý order này") gửi cho đúng 1 worker rồi biến mất.
- **Dùng ở**: topic `fs.events` — Phase 4. Envelope JSON theo ARCHITECTURE §5.
- **Bẫy**: (1) nhét cả hai vai vào 1 công cụ khi chưa hiểu — repo này cố tình dùng cả 2 để cảm nhận ranh giới. (2) Coi produce Kafka là bước bắt buộc của nghiệp vụ → sai tinh thần fire-and-forget (RULES D6).

### P12. Consumer Group, Partition & thứ tự
- **Vấn đề**: 1 consumer đọc không kịp event → muốn scale ngang; nhưng đếm số liệu cần thứ tự tương đối theo sản phẩm.
- **Giải pháp**: topic chia 3 partition; **key = productId** → mọi event cùng sản phẩm vào cùng partition, có thứ tự với nhau. Consumer group `analytics` chạy 1→2→3 instance; Kafka tự chia partition (rebalance). Offset commit định kỳ = "đọc đến đâu rồi".
- **Dùng ở**: Phase 4, step thí nghiệm rebalance — chạy 2 instance analytics, kill 1, quan sát log partition assignment.
- **Bẫy**: (1) Thứ tự chỉ đảm bảo TRONG 1 partition — không có thứ tự toàn topic; đừng thiết kế logic dựa vào thứ tự giữa 2 sản phẩm khác nhau. (2) Số consumer trong group > số partition → thừa consumer ngồi chơi. (3) Đổi số partition sau này làm key phân bố lại — chọn số từ đầu có suy nghĩ.

---

## Nhóm nâng cao (Phase 5 — đọc để biết, làm nếu còn sức)

### P10. Transactional Outbox
- **Vấn đề**: "ghi DB xong, publish message fail" (hoặc ngược lại) → DB và queue lệch nhau. Transaction DB không bọc được RabbitMQ/Kafka.
- **Giải pháp**: trong CÙNG transaction DB, ghi message vào bảng `outbox`; một poller riêng đọc bảng này và publish, xong đánh dấu đã gửi. DB thành nguồn sự thật duy nhất. (Bản xịn: Debezium đọc WAL — chỉ cần biết tên.)
- **Dùng ở**: Phase 5 optional, cho event `ORDER_CONFIRMED` từ worker.
- **Bẫy**: poller phải idempotent phía consumer (P8) vì có thể publish lặp — outbox cho at-least-once, không phải exactly-once.

### Các khái niệm chỉ-cần-biết-tên (không làm trong repo)
- **Exactly-once semantics (Kafka transactions)** — đắt và ít khi thật sự cần; idempotent consumer thường đủ.
- **Sliding window / token bucket rate limit** — nâng cấp của P3.
- **Distributed lock (Redlock)** — repo này tránh được nhờ thiết kế atomic counter; lock phân tán là công cụ dễ dùng sai nhất của Redis.
- **Saga orchestration đầy đủ** — P9 là dạng phôi thai (choreography 2 bước).
