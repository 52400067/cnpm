# Quy chuẩn phát triển và kiểm thử

Tài liệu này quy định các nguyên tắc kiến trúc, quy chuẩn mã nguồn và tiêu chuẩn kiểm thử áp dụng cho kỹ sư và các công cụ hỗ trợ lập trình trên kho mã nguồn TicketHub.

## Nguyên tắc kiến trúc và dữ liệu

### Nguồn sự thật về tồn kho và giao dịch
Tồn kho vé, phiên giữ chỗ và giao dịch tiền tệ được quản lý tập trung trên PostgreSQL qua database transaction.

Redis được sử dụng cho việc xếp hàng chờ ảo, lưu tạm dữ liệu truy vấn (cache), xuất bản thông điệp thời gian thực (Pub/Sub) và hàng đợi nền BullMQ. Không đưa ra quyết định xác nhận đặt chỗ hay thanh toán dựa trên dữ liệu lưu tạm trong bộ nhớ Redis.

### Kiểm soát tranh chấp ghế ngồi
Thao tác giữ chỗ cho ghế có số bắt buộc sử dụng cơ chế khóa mức hàng:
```sql
SELECT id FROM seats WHERE id = ANY($1) ORDER BY id ASC FOR UPDATE;
```
Việc sắp xếp danh sách định danh ghế tăng dần (`ORDER BY id ASC`) là bắt buộc để ngăn ngừa deadlock giữa các transaction chạy song song.

Ràng buộc `UNIQUE (event_id, seat_id)` trên bảng `tickets` với điều kiện vé chưa bị hủy là lớp kiểm tra bắt buộc ở tầng cơ sở dữ liệu.

### Kiểm soát soát vé tại cổng
Lệnh check-in vé tại cổng phải thực thi qua một câu lệnh cập nhật nguyên tử:
```sql
UPDATE tickets SET status = 'CHECKED_IN', checked_in_at = now()
WHERE id = $1 AND status = 'SOLD' RETURNING id;
```
Chỉ chấp nhận vào cổng khi câu lệnh trả về đúng một dòng dữ liệu.

### Tính bất biến của bảng nhật ký
Bảng `audit_log` chỉ tiếp nhận thao tác ghi mới (`INSERT`). Không viết mã hoặc cung cấp quyền thực thi các câu lệnh `UPDATE` hoặc `DELETE` trên bảng này.

### Mẫu Transactional Outbox
Các thao tác gửi thông báo bên ngoài (email Resend/SES, SMS) không được gọi trực tiếp bên trong database transaction đang xử lý đơn hàng. Bản ghi sự kiện được ghi vào bảng `outbox` cùng transaction với đơn hàng; worker nền sẽ đọc bảng này và gửi đi với cơ chế thử lại có khoảng lùi thời gian (retry backoff).

## Tiêu chuẩn mã nguồn

### Cấu hình TypeScript
Kho mã nguồn kích hoạt chế độ nghiêm ngặt trong `tsconfig.json`:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `exactOptionalPropertyTypes: true`

Không sử dụng kiểu `any`. Định nghĩa kiểu rõ ràng cho mọi tham số và giá trị trả về. Trường hợp dữ liệu chưa xác định từ bên ngoài, sử dụng `unknown` kết hợp hàm kiểm tra kiểu hoặc schema Zod.

### Tổ chức mã dùng chung
Toàn bộ schema xác thực Zod và interface TypeScript dùng chung giữa client và server phải được đặt trong package `packages/shared`.

## Các mẫu thiết kế bắt buộc

### Khóa Idempotency
Các endpoint tạo đơn, thanh toán và yêu cầu hoàn tiền yêu cầu header `Idempotency-Key`. Hệ thống kiểm tra và lưu kết quả vào bảng `idempotency_keys` với thời hạn tối thiểu 24 giờ để ngăn chặn việc gửi trùng yêu cầu.

### Khóa lạc quan (Optimistic Locking)
Các bảng `events`, `organizer_profiles` và `seats` chứa cột `version INT NOT NULL DEFAULT 1`. Khi cập nhật thông tin cấu hình sự kiện hoặc hồ sơ:
```sql
UPDATE events SET title = $1, version = version + 1 
WHERE id = $2 AND version = $currentVersion RETURNING version;
```
Nếu không có dòng nào được cập nhật, trả về mã lỗi `CONFLICT_VERSION` (HTTP 409).

### Ký số mã QR động
Mã QR hiển thị trên ứng dụng là chuỗi JWS được ký bằng thuật toán Ed25519 (EdDSA) qua thư viện `jose`:
- `iat`: Thời điểm phát hành.
- `exp`: `iat + 30 seconds`.
- `jti`: Chuỗi định danh dùng một lần.

Khóa riêng (Private Key) được lưu trong trình quản lý bí mật (Secret Manager); ứng dụng soát vé chỉ lưu khóa công khai (Public Key) để xác thực tính toàn vẹn và nguồn gốc của token.

## Yêu cầu kiểm thử

### Kiểm thử giữ chỗ và thanh toán
Logic giữ chỗ và soát vé bắt buộc có test tích hợp chạy trên PostgreSQL thật qua thư viện Testcontainers. Không dùng mock cơ sở dữ liệu cho các logic này.

Mỗi thay đổi liên quan đến tồn kho phải đi kèm kịch bản kiểm thử đồng thời (tối thiểu 50 yêu cầu tranh chấp cùng một ghế) để xác nhận chỉ có một yêu cầu thành công.

### Kiểm thử tích hợp cổng thanh toán
Kiểm thử xử lý webhook IPN VNPay phải bao gồm các trường hợp:
- Chữ ký HMAC không khớp.
- Gửi trùng lặp nhiều webhook cho cùng một giao dịch.
- Webhook trả về sau khi đơn hàng đã hết hạn giữ chỗ (xử lý cấp vé nếu ghế còn trống hoặc kích hoạt hoàn tiền tự động).
- Phản hồi timeout từ cổng thanh toán (kiểm tra luồng gọi API truy vấn trạng thái giao dịch).

## Tuân thủ quy định và định dạng

### Ngôn ngữ và tiền tệ
Giao diện mặc định sử dụng tiếng Việt qua thư viện `next-intl`. Số tiền hiển thị theo định dạng VNĐ (ví dụ: `500.000 đ`). Múi giờ mặc định cho hiển thị lịch sự kiện là `Asia/Ho_Chi_Minh` (UTC+7).

### Dữ liệu cá nhân
Hệ thống tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân. Biểu mẫu đăng ký yêu cầu bước người dùng đồng ý điều khoản xử lý dữ liệu. Bản ghi nhật ký hệ thống không in mật khẩu thô, thông tin thẻ thanh toán hoặc dữ liệu định danh nhạy cảm.
