# CLEAN-CODE — Design Patterns & Clean Code cho repo này

> Phân biệt với `PATTERNS.md`: tài liệu đó là pattern **kiến trúc/tích hợp** (cache, queue, event). Tài liệu này là pattern **cấp code** (GoF, clean code) — cách tổ chức class/function/component cho dễ đọc, dễ test, dễ đổi.

## 0. Triết lý — đọc trước khi áp bất kỳ pattern nào

1. **Pattern phải giải quyết vấn đề có thật trong repo** (cùng tinh thần RULES A2 với công nghệ). Mỗi pattern dưới đây đều ghi rõ *vấn đề* và *step áp dụng* — không áp trước khi gặp vấn đề đó.
2. **Ngân sách pattern: tối đa 1–2 pattern MỚI mỗi phase.** Nhồi 5 pattern một lúc thì không cái nào ngấm.
3. **Rule of three**: chỉ trừu tượng hóa khi lặp lại lần thứ 3, hoặc khi có 2 cách làm thật cần hoán đổi. Trừu tượng "để sau này tiện" = YAGNI.
4. **Nếu giải thích pattern mất nhiều thời gian hơn code nó thay thế → bỏ pattern.** Đơn giản hơn là thắng.
5. Học pattern kiểu nhận diện: sau khi tự áp dụng, quay lại đọc tên chuẩn (Strategy, Observer...) và nhận ra "à, Spring/React đầy chỗ dùng cái này".

---

## A. Backend — Design patterns CÓ đất diễn thật

### A1. Strategy — hoán đổi cách giữ chỗ tồn kho ⭐ đáng giá nhất repo

- **Vấn đề thật**: Phase 1 giữ kho bằng DB atomic update; Phase 2 chuyển sang Redis. Nếu ghi đè code cũ thì mất khả năng so sánh load test giữa 2 cách — mà so sánh chính là mục đích học.
- **Áp dụng**: interface `StockReservationStrategy { ReservationResult reserve(productId, userId); void release(productId, userId); }` với 2 bean: `DbAtomicReservation` (P1.S6) và `RedisReservation` (P2.S5). Chọn bằng config: `flashsale.reservation-mode: db | redis` + `@ConditionalOnProperty`. `OrderService` chỉ biết interface.
- **Áp ở step**: cuối P1.S6 (tạo interface + impl DB), P2.S5 (thêm impl Redis). Load test P2.S8 chạy cả 2 mode chỉ bằng đổi 1 dòng yml — đây là demo sức mạnh của Strategy mà không sách nào dạy sướng bằng.
- **Học được**: program-to-interface, dependency injection đúng nghĩa, open-closed principle.

### A2. State (rút gọn) — vòng đời trạng thái Order

- **Vấn đề thật**: P3 có chuỗi PENDING → PROCESSING → CONFIRMED/FAILED, và retry/duplicate message (P8) dễ tạo chuyển trạng thái ngược đời (FAILED → CONFIRMED). Nếu rải `setStatus()` khắp nơi thì không ai kiểm soát.
- **Áp dụng**: KHÔNG cần State pattern full (class per state — quá khổ). Chỉ cần: enum `OrderStatus` có method `boolean canTransitionTo(OrderStatus next)` + entity `Order` có duy nhất method `transitionTo(next)` ném `IllegalStateTransitionException` khi sai. Cấm `setStatus` public.
- **Áp ở step**: P3.S4 (worker cập nhật trạng thái), được kiểm chứng ở P3.S5 khi message retry.
- **Học được**: đóng gói bất biến nghiệp vụ (invariant) vào domain object thay vì rải if ở service — hạt nhân của "rich domain model".

### A3. Observer / Domain Events — tách "chốt đơn" khỏi "loan tin"

- **Vấn đề thật**: đến P4, sau khi worker chốt CONFIRMED phải làm 3 việc phụ: pub Redis (SSE), produce Kafka, log. Nhét cả 3 vào `OrderWorker` → class phình, và lỗi Kafka có thể lây sang luồng chính (vi phạm RULES D6).
- **Áp dụng**: worker chỉ `applicationEventPublisher.publishEvent(new OrderConfirmedEvent(...))` (in-process của Spring). Ba `@EventListener` riêng: `OrderStatusNotifier` (Redis pub/sub), `AnalyticsEventForwarder` (Kafka), logger. Listener Kafka để `@Async` hoặc bọc try-catch — chết không lây.
- **Áp ở step**: refactor tại P4.S2 (khi có bên nghe thứ 2 — đúng rule of three... của số 2 có chủ đích: 2 bên nghe khác bản chất). Trước đó ở P3.S7 gọi thẳng là ĐÚNG — chưa có vấn đề thì chưa có pattern.
- **Học được**: Observer chính là phiên bản in-process của kiến trúc event-driven bạn đang xây bằng Kafka — nhìn ra sự tự đồng dạng (fractal) này là một khoảnh khắc "aha" đáng giá.

### A4. Factory — một nơi duy nhất sinh envelope

- **Vấn đề thật**: envelope (`eventId`, `occurredAt`, `version` — ARCHITECTURE §5) mà tự tay new ở 5 chỗ thì sẽ có chỗ quên field, sai format thời gian.
- **Áp dụng**: `EventEnvelopeFactory.create(type, payload)` — nơi duy nhất biết cách sinh `eventId` (UUID), `occurredAt` (Instant.now() qua `Clock` inject được — để test đóng băng thời gian), `version`.
- **Áp ở step**: P3.S3 (message RabbitMQ đầu tiên), tái dùng ở P4.S2.
- **Học được**: Factory không phải để "trông pro" — nó là chốt chặn tính nhất quán; và inject `Clock` là bài học testability kinh điển.

### A5. Adapter / Port (phiên bản tối giản) — bọc Redis sau interface

- **Vấn đề thật**: `OrderService` gọi thẳng `StringRedisTemplate` → unit test phải mock template với chuỗi lệnh Redis chi tiết (mock địa ngục), và key naming rải rác khắp service.
- **Áp dụng**: interface theo NGHIỆP VỤ, không theo công nghệ: `StockStore` (reserve/release/remaining), `IdempotencyStore` (tryRegister), `RateLimiter` (tryAcquire). Impl Redis đặt ở `cache/`. Test service bằng fake in-memory (`InMemoryStockStore` dùng `AtomicInteger`) — không cần Mockito cho Redis.
- **Áp ở step**: P2.S5–S7 (viết interface ngay từ đầu, impl Redis là class đầu tiên).
- **⚠️ Chống leo thang**: đây KHÔNG phải lời mời làm hexagonal đầy đủ (ports & adapters cho cả JPA, REST...). Chỉ bọc Redis — vì nó có logic key/script cần cô lập. JPA repository đã là abstraction sẵn của Spring Data, đừng bọc thêm lớp nữa.

### A6. Những pattern CỐ TÌNH không dùng (và vì sao — cũng là bài học)

| Pattern | Vì sao không |
|---|---|
| Singleton (tự viết) | Spring bean mặc định đã là singleton có quản lý |
| Builder | DTO là record, tham số ≤ 4; Builder chỉ đáng khi 6+ tham số optional |
| Abstract Factory, Visitor, Bridge... | Không có vấn đề tương ứng trong repo — áp vào là "pattern tìm vấn đề" |
| Hexagonal/Clean Architecture đầy đủ | Chi phí khái niệm lớn, che mất trọng tâm messaging; đã lấy phần hồn của nó ở A5 |
| CQRS + Event Sourcing | Nghe rất hợp flash-sale nhưng là con quái vật riêng; để dành cho project học khác |
| DDD tactical đầy đủ (aggregate, VO everywhere) | Lấy tinh thần (A2 — invariant trong domain) là đủ cho scale này |

---

## B. Backend — Clean code rules (bổ sung cho RULES §B)

- **CC1. Guard clause / early return.** Validate và từ chối sớm ở đầu method, đường thành công đi thẳng xuống dưới — không kim tự tháp if-else. `OrderService.placeOrder` là nơi luyện: 4 lớp chặn (sale active? rate limit? duplicate? stock?) = 4 guard.
- **CC2. Một method – một tầng trừu tượng.** `placeOrder()` đọc như mục lục: `checkRateLimit(); registerIdempotency(); reserveStock(); publishOrderRequested();` — chi tiết Redis/Rabbit nằm ở method/collaborator con. Nếu trong 1 method vừa có `if (result < 0)` vừa có tên nghiệp vụ → đang trộn tầng.
- **CC3. Tên theo nghiệp vụ, không theo kỹ thuật.** `reserveStock/releaseStock/confirmOrder` chứ không `processData/handleRedis/doUpdate`. Người đọc không cần biết Redis vẫn hiểu luồng.
- **CC4. Method ≤ ~20 dòng, class ≤ ~200 dòng** — không phải luật cứng, là chuông báo: vượt thì dừng lại hỏi "class này đang gánh mấy trách nhiệm?" (SRP).
- **CC5. Không boolean parameter.** `activate(productId, true)` đọc là gì? Dùng enum hoặc tách 2 method (`activateSale/deactivateSale`).
- **CC6. Exception có ngữ nghĩa, fail loud.** Mỗi lỗi nghiệp vụ một class (`OutOfStockException`...) map 1-1 với error code (RULES B5). Không `catch (Exception e) {}` — nuốt lỗi trong hệ messaging là tự bịt mắt.
- **CC7. Hằng số key/tên tập trung**: `RedisKeys.stock(productId)`, `MessagingNames.ORDER_REQUESTED_Q` — format key chỉ tồn tại 1 chỗ (đã có RULES B6, đây là cách thi hành).
- **CC8. Test đặt tên như đặc tả**: `shouldRejectWhenStockDepleted()`, `shouldReleaseStockWhenPaymentFails()` — đọc tên test của class là hiểu nghiệp vụ. Kết hợp A5: test service với fake, nhanh và không cần Docker.
- **CC9. Comment trả lời "vì sao", code trả lời "cái gì".** Ví dụ đúng: `// INCR bù vì DECR đã trừ trước khi biết thua (P2)`. Ví dụ sai: `// tăng stock lên 1`.

---

## C. Frontend — Patterns & clean code cho React

### C-P1. Tách logic/view bằng custom hook (headless pattern) ⭐

- **Vấn đề thật**: P3 làm luồng mua phức tạp: bấm mua → 202 → mở SSE → cập nhật → timeout → fallback polling. Nhét hết vào `ProductPage` là thành component 300 dòng không test được.
- **Áp dụng**: hook `useBuyFlow(productId)` chứa TOÀN BỘ logic (gọi API, SSE, fallback, cleanup), trả về `{ state, buy }`. Component chỉ render theo `state`. Đây là RULES C4/C7 nâng thành pattern có tên: *headless* — logic không biết gì về UI.
- **Áp ở step**: P1.S2 (dạng đơn giản `useProduct`), hoàn chỉnh ở P3.S7.

### C-P2. Discriminated union thay rừng boolean ⭐

- **Vấn đề thật**: `isLoading && !isError && data` — 3 boolean tạo 8 tổ hợp trong đó 5 tổ hợp vô nghĩa; bug UI sinh ra từ tổ hợp vô nghĩa.
- **Áp dụng**:
  ```ts
  type BuyState =
    | { kind: 'idle' }
    | { kind: 'submitting' }
    | { kind: 'pending'; orderId: string }        // 202, đang chờ worker
    | { kind: 'confirmed'; orderId: string }
    | { kind: 'rejected'; code: ApiErrorCode }     // 409/429
    | { kind: 'failed'; reason: string };          // worker báo fail
  ```
  Render bằng `switch (state.kind)` — TypeScript ép xử lý đủ nhánh (exhaustiveness check với `never`). Trạng thái vô nghĩa **không biểu diễn được** = không bao giờ xảy ra ("make illegal states unrepresentable").
- **Áp ở step**: P1.S2 (3 kind đầu), mở rộng dần P3. Đây là bài clean-code FE giá trị nhất repo.

### C-P3. useReducer như state machine cho luồng mua

- **Vấn đề thật**: từ P3, `BuyState` chuyển trạng thái theo NHIỀU nguồn sự kiện (user click, HTTP response, SSE message, timeout) — nhiều `setState` rải rác sẽ tạo chuyển trạng thái lậu (nhận SSE 'confirmed' khi đang 'idle'?).
- **Áp dụng**: `useReducer(buyFlowReducer, { kind: 'idle' })` — mọi chuyển trạng thái qua action (`BUY_CLICKED`, `ACCEPTED`, `STATUS_RECEIVED`, `STREAM_TIMEOUT`); reducer từ chối chuyển không hợp lệ. Đây là **người anh em FE của pattern A2** — cùng một tư duy state machine ở hai đầu hệ thống.
- **Áp ở step**: refactor tại P3.S7 (khi có nguồn sự kiện thứ 2 — đúng lúc vấn đề xuất hiện).

### C-P4. Adapter tầng API (đã có mầm ở RULES C2)

- `client.ts` là **nơi duy nhất** biết: base URL, headers, error format của BE, và việc parse `202` thành `{orderId}`. Component/hook nhận type sạch từ `api/types.ts`. Nếu BE đổi error format → sửa 1 file. Thêm mapper nhỏ nếu shape API xấu (đừng để shape API "rò" vào 10 component).

### C-P5. Composition thay prop drilling; component nhỏ

- Component ≤ ~100 dòng; mỗi component 1 việc (ProductInfo, BuyButton, OrderStatusBadge, OrderList). Truyền `children`/compose trước khi nghĩ tới Context. Context CHỈ cho `userId` (giả lập đăng nhập) — đúng 1 cái, có lý do.
- Loading/empty/error là trạng thái hạng nhất: mỗi trang đủ 3 khuôn mặt này ngay từ đầu, không phải "để sau".

### C-P6. Những thứ FE cố tình KHÔNG dùng

| Thứ | Vì sao không |
|---|---|
| Redux/Zustand/MobX | Server state đã nằm trong hooks; UI state nhỏ (RULES C3) |
| React Query | Rất tốt ở production, nhưng nó GIẤU đúng những thứ ta đang học tay (cache, retry, polling); tự viết trước, dùng nó ở project sau sẽ hiểu nó làm gì |
| HOC, render props | Pattern thời tiền-hook; custom hook (C-P1) thay thế sạch hơn |
| Atomic design system đầy đủ | UI là phụ trong repo này (RULES C6) |

---

## D. Bảng map: pattern → step (để tick cùng PHASES.md)

| Pattern | Áp tại step | Trạng thái |
|---|---|---|
| CC1–CC9 (clean code BE) | Mọi step từ P0.S6 | thói quen, không tick |
| C-P2 discriminated union | P1.S2 | ☐ |
| C-P1 custom hook headless | P1.S2 → hoàn chỉnh P3.S7 | ☐ |
| A1 Strategy (reservation) | P1.S6 (interface) + P2.S5 (Redis impl) | ☐ |
| A5 Adapter (StockStore...) | P2.S5–S7 | ☐ |
| A4 Factory (envelope + Clock) | P3.S3 | ☐ |
| A2 State (transition guard) | P3.S4, kiểm chứng P3.S5 | ☐ |
| C-P3 useReducer state machine | P3.S7 | ☐ |
| A3 Observer (domain events) | P4.S2 (refactor) | ☐ |

**Nhắc lại quy tắc số 2**: mỗi phase chỉ 1–2 pattern mới. Bảng trên đã rải sẵn theo nhịp đó — đừng kéo pattern của phase sau lên làm trước.
