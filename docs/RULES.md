# RULES — Quy tắc của repo

Chia 4 nhóm: **quy tắc học**, **quy tắc code Java**, **quy tắc code React**, **quy tắc messaging & git**. Vi phạm quy tắc học là nghiêm trọng nhất — vì mục tiêu repo là học.

## A. Quy tắc học (quan trọng nhất)

- **A1. Không copy code mình không giải thích được.** Dán code từ AI/StackOverflow phải kèm khả năng trả lời: "dòng này làm gì, bỏ đi thì sao?". Không trả lời được → chưa được commit.
- **A2. Không thêm công nghệ trước khi đo được vấn đề.** Redis chỉ vào ở Phase 2 sau khi Phase 1 đã có số liệu xấu. Tương tự với RabbitMQ, Kafka.
- **A3. Mỗi phase bắt buộc kết thúc bằng: load test + bảng so sánh số liệu trước/sau + 1 entry LEARNING-LOG.** Chưa có 3 thứ này = phase chưa xong, không sang phase mới.
- **A4. PREDICT trước khi chạy.** Trước mỗi lần load test, viết dự đoán con số ra LEARNING-LOG rồi mới chạy.
- **A5. Khi dùng AI hỗ trợ**: hỏi khái niệm, xin review, xin gợi ý hướng — KHÔNG xin generate nguyên feature. (CLAUDE.md của repo đã dặn AI điều này, nhưng kỷ luật chính vẫn ở người học.)
- **A6. Trả lời hết "Câu hỏi tự kiểm"** của step bằng lời của mình (nói to hoặc viết) trước khi tick checkbox.
- **A7. Scope guard**: muốn thêm gì ngoài PHASES.md (auth, UI đẹp, deploy...) → ghi vào mục "Ý tưởng để sau" trong LEARNING-LOG, không làm ngay.

## B. Quy tắc code Java / Spring Boot

- **B1. Package-by-feature**, không package-by-layer. `order/` chứa cả controller + service + repository của order. Xem cây thư mục trong ARCHITECTURE §7.
- **B2. Constructor injection** duy nhất. Không `@Autowired` trên field. Class chỉ có 1 constructor thì không cần annotation.
- **B3. DTO là Java `record`**, đặt trong `dto/` của feature. **Entity không bao giờ đi ra khỏi tầng service** (không return entity từ controller, không nhận entity từ request).
- **B4. Transaction đặt ở service**, không ở controller/repository. Mỗi method `@Transactional` phải trả lời được: "transaction này bọc những thao tác nào, vì sao cần bọc chung?". **Không gọi network I/O (Redis/Rabbit/Kafka/HTTP) bên trong transaction DB** — trừ khi cố ý và có comment giải thích.
- **B5. Xử lý lỗi tập trung**: mọi lỗi nghiệp vụ ném custom exception (`OutOfStockException`...), `GlobalExceptionHandler` (@RestControllerAdvice) map sang error format thống nhất (ARCHITECTURE §6). Không try-catch nuốt lỗi trong controller.
- **B6. Cấu hình qua `application.yml`** + `@ConfigurationProperties` (record). Không hardcode connection string, tên queue/topic, TTL trong code — tất cả vào yml, tên khai báo hằng số 1 chỗ (`MessagingNames`).
- **B7. Logging**: SLF4J, log có ngữ cảnh (`orderId`, `userId`). Mức `INFO` cho nghiệp vụ chính (order created/confirmed/failed), `WARN` cho retry, `ERROR` kèm stacktrace chỉ khi thật sự lỗi. Không `System.out.println`.
- **B8. Test tối thiểu**: mỗi service nghiệp vụ có unit test cho happy path + 1-2 edge case (Mockito). Phase 2+ thêm integration test với Testcontainers cho phần Redis/Rabbit nếu còn sức — khuyến khích, không bắt buộc.
- **B9. Java 21**: dùng `record`, switch expression, `var` khi vế phải đã rõ kiểu. Không dùng Lombok (record + constructor injection đã đủ; đỡ magic).
- **B10. Thời gian**: luôn `Instant`/`OffsetDateTime` UTC. DB dùng `TIMESTAMPTZ`.

## C. Quy tắc code React / TypeScript

- **C1. Feature folders** (`features/product`, `features/order`...), component PascalCase, hook `useXxx`.
- **C2. Mọi call API đi qua `src/api/client.ts`** — nơi duy nhất biết base URL, gắn `X-User-Id` + `Idempotency-Key`, parse error format chung. Component không gọi `fetch` trực tiếp.
- **C3. State**: `useState`/`useReducer` + custom hook là đủ. **Không Redux/Zustand** — app này nhỏ, đừng đổi trọng tâm học.
- **C4. Server state tách khỏi UI state**: data từ API để trong custom hook (`useProduct`, `useMyOrders`) trả `{data, loading, error}`. Không rải `loading` khắp component.
- **C5. TypeScript strict**, không `any`. Type của API response khai báo ở `src/api/types.ts` — đồng bộ tay với DTO backend (đủ cho project học).
- **C6. UI tối giản**, CSS thường hoặc 1 file CSS/feature. Không component library nặng — thời gian để dành cho BE.
- **C7. SSE/polling logic nằm trong hook riêng** (`useOrderStream`), có cleanup (`EventSource.close()` trong effect cleanup) và fallback polling khi SSE lỗi.

## D. Quy tắc messaging (RabbitMQ & Kafka) — đúc kết để mang đi làm thật

- **D1. Message/event là JSON có envelope**: `eventId` (uuid), `occurredAt` (ISO UTC), `version`, payload. Không gửi entity JPA serialize thẳng.
- **D2. Consumer PHẢI idempotent.** Giả định mọi message có thể đến ≥ 2 lần. Kỹ thuật trong repo: `orderId` là khóa chính + `ON CONFLICT DO NOTHING`, hoặc check trạng thái trước khi xử lý.
- **D3. Mọi queue RabbitMQ phải có DLQ** khai báo ngay từ đầu, kể cả "chắc không lỗi đâu". Message vào DLQ phải có cách xem được (Management UI) và có kế hoạch xử lý (Phase 5: requeue tool).
- **D4. Retry có giới hạn + backoff.** Không requeue vô hạn (poison message sẽ kẹp chết consumer). Repo này: 3 lần qua retry-queue TTL 5s, sau đó DLQ.
- **D5. Publish là hành động có thể fail** — bọc try-catch, log rõ, và hiểu rằng "ghi DB xong nhưng publish fail" là vấn đề thật (đọc pattern Outbox ở PATTERNS §P10; Phase 5 mới làm).
- **D6. Không xử lý nghiệp vụ trong luồng publish của Kafka analytics** — event analytics là fire-and-forget, lỗi Kafka không được làm hỏng luồng bán hàng (log WARN là đủ).
- **D7. Đặt tên theo ARCHITECTURE §5**, không sáng tác tên mới giữa chừng.

## E. Quy tắc Git & tiến trình

- **E1. Branch theo phase**: `phase/0-setup`, `phase/1-naive`, `phase/2-redis`... Xong phase → merge về `master` (merge commit, giữ lịch sử).
- **E2. Conventional commits**: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `perf:`. Mỗi step trong PHASES ≈ 1 commit, message nói rõ step: `feat(order): naive order placement (P1.S2)`.
- **E3. Không commit secrets** (chưa có secret thật, nhưng giữ thói quen: config local vào `application-local.yml` đã gitignore).
- **E4. Số liệu load test** lưu vào `loadtest/results/` (txt/json xuất từ k6) và commit — để so sánh giữa các phase.
- **E5. Tick checkbox trong PHASES.md ngay khi xong step** và commit kèm — PHASES.md là nguồn sự thật về tiến độ.
