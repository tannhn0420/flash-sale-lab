# PHASES — Kế hoạch chi tiết từng bước

Quy ước đọc một step:
- **Làm gì** — mô tả việc, đủ cụ thể để bắt tay vào.
- **Gợi ý** — từ khóa/hướng đi, KHÔNG phải code sẵn (xem RULES A1, A5).
- **DoD** (Definition of Done) — tiêu chí khách quan để tick ✅.
- Ký hiệu step: `P<phase>.S<step>` — dùng trong commit message (RULES E2).
- Trước khi code step nào có ghi "📖 Đọc trước", phải đọc phần đó đã (GUIDE §2 — READ → PREDICT → BUILD → MEASURE → EXPLAIN).

---

## Phase 0 — Môi trường & Skeleton (2–3 buổi)

**Mục tiêu**: mọi mảnh (Spring, React, Postgres, Docker) chạy và nói chuyện được với nhau. Chưa có logic gì.
**Branch**: `phase/0-setup`

### Steps

- [x] **P0.S1 — Cài & verify tools.** Cài theo bảng GUIDE §3. Chạy đủ: `java -version` (21), `node -v` (20+), `docker compose version`, `k6 version`. Ghi version thực tế vào LEARNING-LOG.
- [x] **P0.S2 — Khởi tạo repo & cấu trúc.** `git init`, tạo cây thư mục `infra/ backend/ frontend/ loadtest/` (docs đã có). Viết `.gitignore` gốc (Java + Node + IDE). Commit đầu tiên: toàn bộ docs.
- [x] **P0.S3 — docker-compose với MỖI Postgres.** Tạo `infra/docker-compose.yml`: service `postgres` image `postgres:16-alpine`, port 5432, env user/pass/db = `flashsale`, volume named để giữ data. **Gợi ý**: thêm `healthcheck` với `pg_isready` ngay từ đầu — sau này các service khác `depends_on: condition: service_healthy`. **DoD**: `docker compose up -d` xong, kết nối được bằng IntelliJ Database tool/DBeaver.
- [x] **P0.S4 — Scaffold Spring Boot.** Dùng start.spring.io: Maven, Java 21, Boot 3.x. Dependencies: `web`, `data-jpa`, `postgresql`, `flyway`, `validation`, `actuator`. GroupId `com.lab`, artifact `flashsale`. Đặt vào `backend/`. Cấu hình `application.yml` trỏ Postgres. **DoD**: `./mvnw spring-boot:run` lên, `GET /actuator/health` trả `UP`.
- [x] **P0.S5 — Flyway migration V1.** Tạo `V1__init.sql` theo đúng schema ARCHITECTURE §4 (bảng `products`, `orders`). Thêm `V2__seed.sql`: 1 sản phẩm "iPhone Flash Sale", price 15000000, stock 100, `sale_active=false`. **DoD**: bảng + seed xuất hiện trong DB; app restart không lỗi (Flyway checksum).
- [x] **P0.S6 — Endpoint đầu tiên.** `GET /api/products/{id}` trả `ProductResponse` record (id, name, price, stock, saleActive). Làm đúng RULES B1–B5: package `product/`, DTO record, GlobalExceptionHandler + `NOT_FOUND` khi id lạ. **DoD**: `curl localhost:8080/api/products/1` trả JSON đúng; id 999 trả error format chuẩn ARCHITECTURE §6.
- [x] **P0.S7 — Scaffold React.** `npm create vite@latest frontend -- --template react-ts`. Cấu hình `vite.config.ts` proxy `/api` → `localhost:8080`. Tạo `src/api/client.ts` (fetch wrapper theo RULES C2 — tạm hardcode `X-User-Id: u1`). **DoD**: `npm run dev` lên ở 5173.
- [x] **P0.S8 — Trang sản phẩm.** `features/product/ProductPage.tsx` + hook `useProduct(id)`: hiển thị tên, giá (format VND), stock, nút "Mua ngay" (disabled, chưa có API). **DoD**: mở `localhost:5173` thấy sản phẩm load từ BE thật.

### Câu hỏi tự kiểm Phase 0
1. Flyway giải quyết vấn đề gì mà `ddl-auto: update` của Hibernate không giải quyết được?
2. Vì sao FE gọi `/api` qua proxy của Vite thay vì gọi thẳng `localhost:8080`? (từ khóa: CORS)
3. Luồng 1 request `GET /api/products/1` đi qua những class nào, theo thứ tự?

### DoD Phase 0
FE hiển thị sản phẩm từ DB thật qua BE. Mọi thứ lên bằng đúng 3 lệnh: `docker compose up -d`, `mvnw spring-boot:run`, `npm run dev`. LEARNING-LOG có entry. Merge về master.

---

## Phase 1 — Hệ thống ngây thơ & chứng kiến Oversell (2–3 buổi)

**Mục tiêu**: xây chức năng đặt hàng ĐƠN GIẢN NHẤT có thể, rồi dùng load test chứng minh nó sai (oversell) và chậm. Số liệu phase này là baseline cho mọi phase sau.
**Branch**: `phase/1-naive`
📖 Đọc trước: GUIDE glossary các mục *race condition, oversell, atomic, p99*; PATTERNS P2 phần "Vấn đề" (chưa đọc giải pháp vội).

### Steps

- [ ] **P1.S1 — POST /api/orders phiên bản NGÂY THƠ (cố ý).** Service làm tuần tự trong 1 `@Transactional`: (1) `findById` product; (2) `if (stock > 0)`; (3) `product.setStock(stock - 1)`; (4) insert order `CONFIRMED`. Trả `201 {orderId, status}`. Hết hàng → `409 OUT_OF_STOCK`. Chưa cần unique constraint user (thả lỏng cho phase này — tạm bỏ constraint `uq_order_user_product` bằng cách cho phép trùng… KHÔNG: giữ schema, cho mỗi VU một userId riêng khi load test). **Gợi ý**: đây chính là SELECT-then-UPDATE — bạn đang cố ý viết bug kinh điển nhất ngành. **DoD**: mua tay trên FE được, stock giảm.
- [ ] **P1.S2 — FE: nút Mua + trang My Orders.** Nút "Mua ngay" gọi API, hiện kết quả (thành công/hết hàng). Trang `/orders`: `GET /api/users/{userId}/orders` liệt kê đơn + trạng thái, nút refresh. UserId: input text đơn giản góc màn hình (giả lập đăng nhập, lưu localStorage). **DoD**: 2 tab browser với 2 userId mua và thấy đơn của riêng mình.
- [ ] **P1.S3 — Viết k6 script đầu tiên.** `loadtest/order-burst.js`: 200 VUs × 30s, mỗi VU userId riêng (`u${__VU}`), POST /api/orders liên tục, `sleep(0.1)`. Thu: p95/p99 latency, request/s, tỷ lệ 201 vs 409. 📖 Đọc trước: k6 docs mục *Running k6* + *Metrics* (15 phút). **DoD**: script chạy được với 10 VUs thử nghiệm.
- [ ] **P1.S4 — 💥 PREDICT rồi bắn.** Reset data (script SQL reset stock=100, xóa orders — viết `loadtest/reset.sql` dùng lại nhiều lần). **Viết dự đoán vào LEARNING-LOG**: "stock=100, 200 VUs → sẽ có bao nhiêu order 201?". Chạy k6. Đếm thực tế: `SELECT count(*) FROM orders;` và `SELECT stock FROM products;`. **DoD**: có con số oversell thực tế (thường 100–300+ đơn cho 100 hàng) + số liệu latency, lưu `loadtest/results/phase1-naive.txt`.
- [ ] **P1.S5 — Giải thích bằng được.** Vẽ ra giấy/ghi log: 2 transaction cùng đọc stock=1, cùng thấy >0, cùng trừ. Thử `@Transactional(isolation = SERIALIZABLE)` — chạy lại k6 — quan sát: hết oversell nhưng xuất hiện lỗi serialize + latency tăng vọt. Đây là trade-off đầu tiên bạn ĐO được. **DoD**: LEARNING-LOG giải thích được race condition bằng lời của mình + số liệu SERIALIZABLE.
- [ ] **P1.S6 — Fix đúng cách (tầng DB).** Bỏ SERIALIZABLE. Đổi sang atomic update: `@Modifying @Query("UPDATE Product p SET p.stock = p.stock - 1 WHERE p.id = :id AND p.stock > 0")` — trả về số row; 0 row = hết hàng. Chạy lại k6: **đúng** (0 oversell) nhưng ghi nhận throughput/p99 và CPU Postgres (`docker stats`). **DoD**: 0 oversell; số liệu lưu `loadtest/results/phase1-atomic.txt`; hiểu rằng giờ TẤT CẢ request vẫn dồn vào DB — vấn đề còn nguyên cho Phase 2.

### Câu hỏi tự kiểm Phase 1
1. Race condition xảy ra giữa 2 câu lệnh nào? Vì sao `@Transactional` MỘT MÌNH không cứu được?
2. `UPDATE ... WHERE stock > 0` atomic nhờ cơ chế gì của Postgres? (từ khóa: row-level lock)
3. Nếu ngày mai sale 1 triệu user, giải pháp P1.S6 chết ở đâu trước: CPU app, connection pool, hay disk DB?
4. p99 nói lên điều gì mà average giấu đi?

### DoD Phase 1
Có bảng so sánh 3 cấu hình (naive / serializable / atomic-update) × (oversell, p99, req/s). LEARNING-LOG entry. Merge về master.

---

## Phase 2 — Redis: cache, atomic counter, rate limit (3–4 buổi)

**Mục tiêu**: chuyển "trọng tài" tồn kho từ DB lên Redis; loại phần lớn request khỏi DB. Học Redis bằng tay trước, code sau.
**Branch**: `phase/2-redis`
📖 Đọc trước: PATTERNS P1, P2, P3, P4, P14 (giờ mới đọc phần Giải pháp).

### Steps

- [ ] **P2.S1 — Thêm Redis vào compose + chơi bằng tay.** Service `redis` image `redis:7-alpine` + `redisinsight` (port 5540). Mở `docker exec -it <redis> redis-cli`, tự tay chạy: `SET/GET/DEL`, `INCR/DECR`, `EXPIRE/TTL`, `SETNX`, `SADD/SISMEMBER`, `HSET/HGETALL`, `KEYS fs:*` (và đọc vì sao production không dùng KEYS mà dùng SCAN). Mô phỏng tay kịch bản flash sale: `SET fs:stock:1 3` rồi DECR 4 lần, quan sát giá trị âm. **DoD**: thao tác trôi chảy không cần tra; hiểu DECR key không tồn tại trả -1.
- [ ] **P2.S2 — Nối Spring với Redis.** Thêm `spring-boot-starter-data-redis`. Cấu hình `StringRedisTemplate` là chính (JSON tự serialize bằng ObjectMapper khi cần — tránh magic của RedisTemplate default serializer, một nguồn bug kinh điển). Viết smoke test nhỏ: set/get 1 key lúc app start (xóa sau khi xong step). **DoD**: app đọc/ghi Redis được, key thấy trong RedisInsight.
- [ ] **P2.S3 — Cache-aside cho product (P1).** `GET /api/products/{id}`: đọc `fs:product:{id}` → miss thì DB → `SET ... EX 60` (+ jitter ±10s — P14). Response vẫn cần stock "gần đúng": lấy từ `fs:stock:{id}` nếu sale active, không thì từ DB. Log rõ HIT/MISS. **Gợi ý**: cache DTO JSON, không cache entity (P1 bẫy 1). **DoD**: gọi 2 lần, lần 2 log HIT; sửa tên sản phẩm trong DB không thấy đổi cho đến khi TTL hết (đúng thiết kế — nói được vì sao chấp nhận).
- [ ] **P2.S4 — Sale activation.** `POST /api/admin/sales/{productId}/activate`: đọc stock từ DB, `SET fs:stock:{id} <stock>`, `DEL fs:bought:{id}`, set `sale_active=true`, invalidate cache product. (Endpoint `deactivate` làm ngược lại: ghi stock Redis còn lại về DB rồi xóa keys.) Đây là "nghi thức khai hỏa" trước mỗi lần load test từ giờ. **DoD**: activate xong thấy `fs:stock:1 = 100` trong RedisInsight.
- [ ] **P2.S5 — Reserve stock bằng Redis (P2 — trái tim của phase).** Viết lại `OrderService`: (1) check `SISMEMBER fs:bought` → đã mua → `409 ALREADY_BOUGHT`; (2) `DECR fs:stock` → `< 0` thì `INCR` bù + `409 OUT_OF_STOCK`; (3) thắng → `SADD fs:bought`, ghi order DB (vẫn sync ở phase này), stock DB cập nhật đối chiếu khi deactivate. Sau khi chạy đúng bằng 2 lệnh rời, **nâng cấp thành 1 Lua script** (check bought + decr trong 1 script, trả mã kết quả) và giải thích được vì sao 2 lệnh rời có khe hở (P2 bẫy 2). **DoD**: cả 2 phiên bản chạy; giữ bản Lua; test tay: user mua 2 lần bị chặn.
- [ ] **P2.S6 — Idempotency key (P4).** FE: sinh uuid khi user bấm Mua, gửi header `Idempotency-Key`; retry cùng key khi network error. BE: `SET fs:idem:{userId}:{key} "1" NX EX 600` — thất bại → `409 DUPLICATE_REQUEST`. **DoD**: double-click nút Mua chỉ tạo 1 đơn (giả lập bằng cách bấm nhanh hoặc devtools throttling).
- [ ] **P2.S7 — Rate limit (P3).** Interceptor trước POST /orders: `INCR fs:rl:{userId}:{epochMinute}`, nếu ==1 thì `EXPIRE 120`; > 10 → `429 RATE_LIMITED`. FE hiện thông báo tử tế. **DoD**: k6 1 VU bắn 50 req/phút → thấy 429 sau request thứ 10.
- [ ] **P2.S8 — 💥 Load test so sánh.** Reset + activate. PREDICT trước. Chạy lại `order-burst.js` (nâng lên 500 VUs). Thu: oversell (phải = 0), p99, req/s, tỷ lệ mã lỗi, `docker stats` CPU của Postgres vs Redis. So với `phase1-atomic.txt`. **Kỳ vọng học được**: p99 của request BỊ TỪ CHỐI cực nhanh (không chạm DB); nhưng ~100 request THẮNG vẫn ghi DB sync — nếu stock lớn (thử stock=5000, 2000 VUs) thì DB ghi vẫn è cổ → động lực Phase 3. **DoD**: `loadtest/results/phase2.txt` + bảng so sánh trong LEARNING-LOG.

### Câu hỏi tự kiểm Phase 2
1. Vì sao stock để riêng `fs:stock:*` mà không nằm trong cache `fs:product:*`? Hai loại dữ liệu này khác nhau bản chất gì?
2. Lua script cho ta atomicity kiểu gì? Khác gì transaction MULTI/EXEC của Redis? (đọc thêm nếu tò mò)
3. Nếu Redis restart mất sạch key `fs:stock` giữa lúc sale thì chuyện gì xảy ra? Có những hướng xử lý nào? (từ khóa: AOF, RDB, sale re-activation)
4. Idempotency key (P4) và unique constraint `uq_order_user_product` (DB) — vì sao cần CẢ HAI tầng?

### DoD Phase 2
0 oversell ở 500 VUs; bảng so sánh Phase 1 vs 2; giải thích được đường đi của 1 request bị từ chối (không chạm DB). Merge về master.

---

## Phase 3 — RabbitMQ: async order pipeline (4–5 buổi)

**Mục tiêu**: API mỏng trả 202 tức thì; worker xử lý nền; retry + DLQ; FE thấy trạng thái real-time. Đây là phase nặng nhất và giá trị nhất.
**Branch**: `phase/3-rabbitmq`
📖 Đọc trước: RabbitMQ official tutorial 1–2; PATTERNS P5, P6, P7, P8, P9, P13. (Chia nhỏ: P5–P6 trước S1; P7–P8 trước S5; P9 trước S6; P13 trước S7.)

### Steps

- [ ] **P3.S1 — Thêm RabbitMQ + chơi bằng tay qua UI.** Compose thêm `rabbitmq:4-management`, port 5672 + 15672. Vào Management UI (guest/guest): TỰ TAY tạo exchange thử, queue thử, binding, publish message từ UI, xem message nằm trong queue, Get Message. Xóa đồ thử sau khi hiểu. **DoD**: giải thích được exchange/queue/binding/routing-key bằng ví dụ vừa tự làm.
- [ ] **P3.S2 — Khai báo topology bằng code.** Thêm `spring-boot-starter-amqp`. `RabbitConfig`: khai báo `fs.order.x` (direct, durable), `fs.order.requested.q` (durable) + binding; đồng thời khai báo luôn `retry.q` (TTL 5s, DLX về `fs.order.x`) và `dlq` theo ARCHITECTURE §5 (D3: DLQ có mặt từ ngày đầu). Message converter: Jackson JSON. **DoD**: app start → topology tự xuất hiện trong Management UI đúng tên.
- [ ] **P3.S3 — Publisher: API trả 202.** `POST /api/orders` sau khi thắng Redis (giữ nguyên P2 logic): sinh `orderId` UUID, publish `OrderRequestedMessage {orderId, productId, userId, occurredAt}` vào exchange, trả `202 {orderId, status: PENDING}`. **CHƯA có consumer** — cố ý. Mua 3 đơn trên FE, vào Management UI thấy 3 message nằm chờ trong queue. Cảm nhận: queue = buffer bền. **DoD**: message JSON đọc được trong UI, đủ field envelope (RULES D1).
- [ ] **P3.S4 — Consumer: OrderWorker.** `@RabbitListener(queues = "fs.order.requested.q", concurrency = "2-4")` + prefetch 10 (yml: `spring.rabbitmq.listener.simple.prefetch`). Xử lý: INSERT order PENDING→PROCESSING (idempotent: `ON CONFLICT DO NOTHING` — P8), giả lập thanh toán `Thread.sleep(200–500ms)` + 10% random fail → CONFIRMED / FAILED. Acknowledge mode để mặc định (auto — ack sau khi method xong, nack khi throw). **DoD**: 3 message tồn đọng ở S3 được xử lý ngay khi app start; đơn mới đi PENDING→CONFIRMED trong ~nửa giây.
- [ ] **P3.S5 — Retry + DLQ hoạt động thật (P7).** Thêm "công tắc lỗi" để test: nếu `userId == "u-poison"` thì luôn throw. Cấu hình reject-không-requeue (yml `default-requeue-rejected: false`) → message dead-letter sang retry.q → 5s sau quay lại → đếm `x-death` trong header, ≥3 lần → publish sang dlq (hoặc dùng routing với `x-delivery-limit`/quorum queue — chọn 1 cách, hiểu cách đó). Mua bằng `u-poison` → NHÌN message nảy qua lại trong Management UI rồi nằm im trong DLQ. **DoD**: message poison vào DLQ sau đúng 3 lần thử, kèm log WARN mỗi lần retry; order thường không bị ảnh hưởng.
- [ ] **P3.S6 — Compensation khi thanh toán fail (P9).** Nhánh FAILED: `INCR fs:stock` + `SREM fs:bought` + `failure_reason`. Kiểm tra tổng: sau khi sale chạy xong, `số CONFIRMED + stock Redis còn lại == 100`? Viết endpoint debug `GET /api/admin/sales/{id}/reconcile` so 2 con số này — công cụ đối chiếu sẽ dùng ở mọi load test sau. **DoD**: chạy 200 đơn, reconcile khớp (CONFIRMED + remaining == initial).
- [ ] **P3.S7 — Trạng thái real-time: SSE + Redis pub/sub (P13).** Worker sau khi chốt trạng thái: `PUBLISH fs:order-status {orderId, status, reason}`. API: `GET /api/orders/{id}/stream` trả `SseEmitter`; một `RedisSubscriber` (Spring `RedisMessageListenerContainer`) nhận pub/sub và route tới emitter theo orderId. FE: hook `useOrderStream(orderId)` — mở EventSource sau khi nhận 202, cập nhật UI PENDING → CONFIRMED/FAILED, timeout 30s fallback về polling (RULES C7). **DoD**: bấm Mua → thấy trạng thái nhảy trên UI không cần refresh; kill worker (dừng app? — worker cùng app nên: tạm comment listener) thì FE vẫn hiển thị PENDING và tự fallback polling.
- [ ] **P3.S8 — 💥 Load test end-to-end + chỉnh van.** Reset + activate (stock 2000, 1000 VUs để thấy queue sâu). PREDICT: p99 của POST /orders sẽ ra sao so với Phase 2? Queue depth đỉnh bao nhiêu? Chạy — quan sát đồ thị queue depth trong Management UI (nghiện lắm đấy). Sau đó chỉnh `concurrency` 2→8, prefetch 1→50, chạy lại, lập bảng ảnh hưởng. Kiểm tra reconcile sau mỗi lần. **DoD**: `loadtest/results/phase3-*.txt` ≥ 2 cấu hình; nhận xét được prefetch/concurrency ảnh hưởng thế nào; API p99 gần như không đổi khi tăng tải (vì việc nặng đã sang worker) — chính là điều Phase 3 tồn tại để chứng minh.

### Câu hỏi tự kiểm Phase 3
1. Điều gì xảy ra với message nếu worker crash GIỮA LÚC xử lý (sau insert, trước ack)? Message đi đâu, và vì sao P8 cứu ta?
2. Vì sao KHÔNG dùng Redis pub/sub thay RabbitMQ cho luồng order? (gợi ý: điều gì xảy ra khi worker offline 30 giây?)
3. Prefetch=1 và prefetch=100 khác nhau thế nào khi có 1 message xử lý chậm 10 giây lẫn trong 1000 message nhanh?
4. Ở kiến trúc này, "nguồn sự thật" về trạng thái đơn là DB, SSE chỉ là "tín hiệu". Nếu đảo lại (tin SSE, DB ghi sau) thì hỏng kiểu gì?
5. Nếu API publish xong nhưng chưa kịp trả 202 thì crash — user thấy gì, hệ thống ở trạng thái nào, có mất tiền/mất hàng không?

### DoD Phase 3
API p99 ổn định dưới tải; 0 oversell; reconcile khớp; DLQ demo được; FE real-time. Bảng so sánh 3 phase. Merge về master.

---

## Phase 4 — Kafka: event streaming & analytics (4–5 buổi)

**Mục tiêu**: bắn mọi sự kiện vào Kafka; app analytics riêng tiêu thụ và dựng dashboard real-time; TỰ TRẢI NGHIỆM khác biệt Kafka vs RabbitMQ (retention, replay, consumer group).
**Branch**: `phase/4-kafka`
📖 Đọc trước: PATTERNS P11, P12; Kafka docs mục *Motivation* + *Consumer position* (30 phút).

### Steps

- [ ] **P4.S1 — Thêm Kafka + chơi bằng tay.** Compose thêm `apache/kafka:3.9.x` (KRaft, single broker — cấu hình listener cho cả trong-docker lẫn host; đây là chỗ hay vướng nhất, kiên nhẫn) + `kafka-ui` (provectuslabs) port 8085. Bằng CLI trong container: tạo topic `fs.events` 3 partitions; `kafka-console-producer` gõ vài message với key (`key:value` với `parse.key=true`); `kafka-console-consumer --from-beginning` đọc lại NHIỀU LẦN — cùng message đọc lại được, khác hẳn RabbitMQ. Quan sát message vào partition nào theo key. **DoD**: giải thích được vì sao đọc lại được (offset là của consumer, log là của broker).
- [ ] **P4.S2 — Producer từ backend.** Thêm `spring-kafka`. `EventPublisher` bọc `KafkaTemplate<String,String>`: `publish(type, productId, payloadMap)` build envelope (ARCHITECTURE §5), key = productId, **fire-and-forget**: callback lỗi chỉ log WARN (RULES D6 — thử tắt Kafka, mua hàng vẫn phải chạy bình thường!). Gắn vào: API (ORDER_REQUESTED/REJECTED + endpoint `POST /api/events/view` cho FE bắn PRODUCT_VIEWED khi mở trang), worker (ORDER_CONFIRMED/FAILED). **DoD**: mua vài đơn → thấy events trong Kafka UI đúng partition theo key; **tắt container Kafka → mua hàng vẫn OK**, log WARN.
- [ ] **P4.S3 — App analytics riêng.** Scaffold `analytics/` (Spring Boot mới, port 8081, KHÔNG có JPA — chỉ `spring-kafka` + `data-redis` + `web`). `@KafkaListener(topics = "fs.events", groupId = "analytics")`: parse envelope, đếm vào Redis hash `fs:metrics:{type}:{epochMinute}` (`HINCRBY`). **DoD**: mua đơn bên kia, `HGETALL` bên Redis thấy counter nhảy.
- [ ] **P4.S4 — API metrics + dashboard FE.** Analytics: `GET /api/metrics/summary?minutes=15` gom counter 15 phút gần nhất thành series; thêm SSE `/api/metrics/stream` đẩy mỗi 2s (scheduler đọc Redis — đơn giản thôi). FE: trang `/dashboard` — 3 con số to (orders/phút, tỷ lệ confirm, views/phút) + 1 chart line đơn giản (SVG tự vẽ hoặc thư viện siêu nhẹ). **DoD**: chạy k6 nhẹ, nhìn dashboard nhảy real-time.
- [ ] **P4.S5 — Thí nghiệm consumer group (P12) — vui nhất phase.** (a) Chạy instance analytics thứ 2 (`--server.port=8082`): xem log rebalance, mỗi instance nhận partition nào; (b) kill 1 instance → partition dồn về instance còn lại; (c) dừng CẢ HAI 2 phút trong khi k6 vẫn bắn → bật lại → thấy consumer "đuổi kịp" backlog (quan sát consumer lag trong Kafka UI trước/sau); (d) đổi groupId thành `analytics-v2` + `auto-offset-reset: earliest` → thấy nó đọc lại TOÀN BỘ lịch sử từ đầu — chính là replay, RabbitMQ không làm được điều này. **DoD**: 4 quan sát trên ghi vào LEARNING-LOG kèm screenshot/log.
- [ ] **P4.S6 — Viết bài tổng kết so sánh.** Trong LEARNING-LOG, viết bằng trải nghiệm thật (không chép blog): RabbitMQ vs Kafka — mô hình message, sau-khi-đọc, scale consumer, use case nào chọn cái nào trong công việc của bạn. Thêm: Redis pub/sub đứng ở đâu giữa 2 cái này. **DoD**: bài viết ≥ 300 chữ, có dẫn số liệu/quan sát từ S5.

### Câu hỏi tự kiểm Phase 4
1. Vì sao key = productId chứ không phải orderId hay random? Nếu 1 sản phẩm chiếm 99% event thì partition bị gì? (từ khóa: hot partition)
2. Consumer analytics chết 10 phút — event có mất không? So với: worker RabbitMQ chết 10 phút — message có mất không? Cùng "không mất" nhưng cơ chế khác nhau thế nào?
3. Nếu đếm metrics yêu cầu chính-xác-tuyệt-đối, `HINCRBY` khi consumer đọc lại message lần 2 sẽ sai — hướng xử lý? (P8 với eventId; hoặc chấp nhận — vì sao với metrics thường chấp nhận được?)
4. Thêm 1 consumer group mới (VD "email-service") có ảnh hưởng gì tới group "analytics" không? Điều này nói lên gì về điểm mạnh lớn nhất của Kafka?

### DoD Phase 4
Dashboard real-time chạy; 4 thí nghiệm S5 hoàn thành; bài so sánh viết xong; tắt Kafka không ảnh hưởng bán hàng. Merge về master.

---

## Phase 5 — (Optional) Hardening & Observability (tùy sức)

Không bắt buộc — làm khi muốn đào sâu. Mỗi mục độc lập, chọn theo hứng thú:

- [ ] **P5.A — Transactional Outbox (P10)** cho event từ worker: bảng `outbox` + poller `@Scheduled` publish → đánh dấu. Test: tắt Kafka 1 phút giữa chừng, bật lại, không mất event.
- [ ] **P5.B — Metrics kỹ thuật**: Micrometer + Prometheus + Grafana vào compose; dashboard: queue depth, consumer lag, p99 theo endpoint, cache hit rate. (Đây là kỹ năng observability dùng được ngay ở công ty.)
- [ ] **P5.C — Graceful shutdown**: đảm bảo `SIGTERM` → worker xử lý nốt message đang cầm rồi mới thoát (`spring.lifecycle.timeout-per-shutdown-phase`); test bằng cách stop app giữa load test rồi reconcile.
- [ ] **P5.D — Reconciliation job**: `@Scheduled` mỗi phút đối chiếu Redis stock vs DB, log lệch (hệ quả P9 bẫy).
- [ ] **P5.E — Tách worker thành app riêng** (multi-module Maven hoặc project riêng): cảm nhận chi phí và lợi ích của việc tách service.
- [ ] **P5.F — DLQ requeue tool**: endpoint admin đọc message từ DLQ và đẩy lại queue chính sau khi fix bug.

---

## Tổng kết cuối dự án (1 buổi — đừng bỏ qua)

- [ ] Cập nhật bảng số liệu cuối cùng: Phase 1 → 4, cùng 1 kịch bản test.
- [ ] Viết README mục "Kết quả": before/after + 3 bài học lớn nhất.
- [ ] Dọn TODO, đảm bảo `docker compose up` + 2 lệnh chạy được từ máy sạch (thử xóa volume làm lại từ đầu).
- [ ] (Khuyến khích) Viết 1 bài blog nội bộ / present cho team — dạy lại là cách học sâu nhất.
