# Nguyên Tắc & Hợp Đồng Phát Triển Cùng AI (AI Contract)
**Dự án:** Nền tảng bán vé sự kiện trực tuyến (TicketHub)  
**Đối tượng áp dụng:** Tất cả AI Coding Assistants, Lập trình viên và Pair Programmers làm việc trên repository này.  

---

## 1. Tôn Chỉ Bất Biến (Golden Invariants)

1. **PostgreSQL là Nguồn Sự Thật Duy Nhất (Single Source of Truth):**
   - Mọi quyết định về tồn kho vé, giữ chỗ ghế và tiền bạc **bắt buộc** phải thực thi và ghi nhận thông qua Database Transaction trên PostgreSQL.
   - **Tuyệt đối không** sử dụng Redis để quyết định kết quả giữ chỗ cuối cùng (Redis chỉ đóng vai trò hàng chờ điều tiết lưu lượng truy cập, cache dữ liệu có thể tái tạo và phân phối sự kiện Pub/Sub).

2. **Không Bao Giờ Bán Trùng Vé (Zero Double-Booking Guarantee):**
   - Mọi thao tác giữ chỗ ghế phải áp dụng cơ chế khóa mức hàng:
     ```sql
     SELECT id FROM seats WHERE id = ANY($1) ORDER BY id ASC FOR UPDATE;
     ```
   - Sắp xếp ID tăng dần (`ORDER BY id ASC`) là điều kiện tiên quyết để triệt tiêu nguy cơ Deadlock giữa các transaction đồng thời.
   - Luôn duy trì ràng buộc `UNIQUE (event_id, seat_id)` trên bảng `tickets` (với điều kiện vé chưa bị hủy).

3. **Mỗi Vé Chỉ Được Vào Cổng Đúng Một Lần (Atomic Check-in):**
   - Lệnh soát vé phải là một thao tác nguyên tử duy nhất:
     ```sql
     UPDATE tickets SET status = 'CHECKED_IN', checked_in_at = now()
     WHERE id = $1 AND status = 'SOLD' RETURNING id;
     ```
   - Chỉ khi cập nhật thành công đúng 1 dòng mới cấp quyền vào cổng.

4. **Tính Bất Biến Của Nhật Ký Kiểm Toán (Immutable Audit Log):**
   - Bảng `audit_log` chỉ cho phép quyền `INSERT`. Không bao giờ viết câu lệnh `UPDATE` hoặc `DELETE` trên bảng này.

5. **Mẫu Thiết Kế Transactional Outbox (Zero-Lost Notifications):**
   - Không gọi dịch vụ bên thứ ba (gửi email Resend/SES, gửi SMS, đẩy thông báo) trực tiếp trong database transaction nghiệp vụ.
   - Luôn ghi bản ghi vào bảng `outbox` cùng transaction với đơn hàng; Worker BullMQ sẽ đọc và xử lý gửi sau với cơ chế thử lại (Retry Backoff).

---

## 2. Tiêu Chuẩn Mã Nguồn & Ngôn Ngữ (Coding Standards)

### 2.1 Cấu Hình TypeScript Bắt Buộc
Dự án kích hoạt chế độ siêu nghiêm ngặt trong `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```
- **Không sử dụng `any`:** Mọi biến, tham số và kết quả trả về phải có định nghĩa kiểu rõ ràng. Dùng `unknown` khi cần ép kiểm tra kiểu runtime.
- **Shared Schemas:** Toàn bộ Zod Schema và TypeScript Type dùng chung cho Client và Server phải đặt trong package `packages/shared`.

### 2.2 Quy Ước Đặt Tên & Cấu Trúc File
- **File & Thư mục:** Kebab-case (VD: `seat-map.tsx`, `booking.service.ts`, `holding-queue.job.ts`).
- **Class & Interface:** PascalCase (VD: `BookingService`, `PaymentGateway`).
- **Function & Biến:** camelCase (VD: `calculateFinalAmount`, `holdExpiresAt`).
- **Database Column & Tables:** snake_case (VD: `ticket_types`, `hold_expires_at`).
- **Environment Variables:** UPPER_SNAKE_CASE (VD: `DATABASE_URL`, `VNPAY_HASH_SECRET`).

---

## 3. Các Mẫu Thiết Kế Bắt Buộc (Mandatory Design Patterns)

### 3.1 Idempotency Key Pattern (Chống Thao Tác Trùng)
Với các endpoint biến đổi trạng thái tài chính hoặc đặt giữ chỗ:
- Bắt buộc kiểm tra Header `Idempotency-Key`.
- Lưu key và response vào bảng `idempotency_keys` với TTL tối thiểu 24 giờ.
- Nếu key đã tồn tại và đã xử lý thành công, trả ngay kết quả lưu trong cache/DB mà không thực thi lại logic nghiệp vụ.

### 3.2 Optimistic Locking (Khóa Lạc Quan)
- Các bảng: `events`, `organizer_profiles`, `seats` bắt buộc có cột `version INT NOT NULL DEFAULT 1`.
- Khi cập nhật cấu hình:
  ```sql
  UPDATE events SET title = $1, version = version + 1 
  WHERE id = $2 AND version = $currentVersion RETURNING version;
  ```
- Nếu không có dòng nào được cập nhật, ném lỗi `CONFLICT_VERSION` (HTTP 409).

### 3.3 Dynamic QR Code Signing (Ký Số Ed25519)
- Mã QR không bao giờ lưu trữ ID tĩnh trần trụi.
- Mã QR là một JWS token ký bằng thuật toán **Ed25519 (EdDSA)** qua thư viện `jose`:
  - `iat`: Thời điểm ký.
  - `exp`: `iat + 30 seconds`.
  - `jti`: UUID nonce sử dụng một lần.
- Khóa riêng (Private Key) được bảo vệ trong Secret Manager; thiết bị quét vé hoặc Client chỉ lưu Public Key để xác thực chữ ký.

---

## 4. Yêu Cầu Kiểm Thử (Testing Invariants)

1. **Kiểm thử logic giữ chỗ và thanh toán:**
   - **Bắt buộc** viết Integration Test sử dụng **Testcontainers với PostgreSQL thật**. Tuyệt đối không mock database cho logic giữ chỗ hoặc check-in.
   - Phải có kịch bản kiểm thử đồng thời (Concurrency Test): Giả lập tối thiểu 50-100 request đồng thời tranh chấp 1 ghế duy nhất và khẳng định chắc chắn chỉ đúng 1 request thành công.

2. **Kiểm thử thanh toán VNPay:**
   - Kiểm thử toàn diện 4 trường hợp ngoại lệ:
     - Chữ ký HMAC không hợp lệ (`vnp_SecureHash` sai).
     - Callback IPN trùng lặp nhiều lần (Idempotency).
     - Callback IPN đến sau khi đơn đã `EXPIRED` (Tự động cấp lại vé hoặc kích hoạt hoàn tiền).
     - Cổng thanh toán timeout (Thực hiện gọi API QueryDR).

3. **Kiểm thử E2E (Playwright):**
   - Luồng mua vé trọn vẹn: Tìm kiếm sự kiện → Giữ ghế 5 phút → Điền thông tin thanh toán → Giả lập VNPay thành công → Kiểm tra vé xuất hiện trong "Vé của tôi".

---

## 5. Bản Địa Hóa & Tuân Thủ Pháp Lý Việt Nam

1. **Ngôn ngữ và Tiền tệ:**
   - Ngôn ngữ mặc định là **Tiếng Việt (`vi-VN`)**, quản lý chuỗi qua `next-intl`.
   - Tiền tệ hiển thị dạng VND chuẩn Việt Nam (VD: `500.000 đ` hoặc `1.250.000 VND`).
   - Múi giờ hiển thị mặc định: `Asia/Ho_Chi_Minh` (UTC+7).

2. **Bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP):**
   - Màn hình đăng ký bắt buộc có checkbox đồng ý với Điều khoản sử dụng và Chính sách bảo vệ dữ liệu cá nhân.
   - Log hệ thống **tuyệt đối không** in mật khẩu thô, số thẻ ngân hàng hoặc dữ liệu cá nhân nhạy cảm của người dùng.
   - Dữ liệu người mua phải được lưu trữ trên hạ tầng máy chủ tuân thủ quy định pháp luật sở tại.
