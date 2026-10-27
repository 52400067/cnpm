# Báo cáo kiểm thử tích hợp E2E: Phân hệ Xác thực (UC01)

- Ngày thực hiện: 27/10/2026
- Vai trò phụ trách: Quản lý dự án & QA (PM / QA Lead)
- Môi trường kiểm thử: Môi trường tích hợp (Web: http://localhost:3000, API: http://localhost:4000)
- Công cụ kiểm thử: Playwright Test Runner (apps/web/test/uc01-auth.spec.ts)

## 1. Tổng quan kết quả kiểm thử

- Tổng số test case: 9
- PASS: 8 / 9
- PENDING (test.fixme): 1 / 9 (TC09: Khóa tài khoản sau 5 lần sai mật khẩu, đang theo dõi theo tiến độ Backend Lead)
- Tỉ lệ thành công: 100% các ca kiểm thử khả dụng đạt yêu cầu.

## 2. Chi tiết kết quả kiểm thử từng ca

| Mã TC | Kịch bản kiểm thử                                    | Kết quả | Ghi chú                                                           |
| :---- | :--------------------------------------------------- | :-----: | :---------------------------------------------------------------- |
| TC01  | Đăng ký tài khoản Người mua mới (Luồng chính A)      |  PASS   | Điền form, gửi dữ liệu, chuyển hướng verify-email                 |
| TC02  | Đăng ký tài khoản Ban tổ chức (Role ORGANIZER)       |  PASS   | Chọn tab BTC, điền tổ chức, chuyển hướng verify-email             |
| TC03  | Đăng ký thất bại khi Email đã tồn tại (Exception E1) |  PASS   | Bắt mã lỗi 409 Conflict, hiển thị cảnh báo tài khoản tồn tại      |
| TC04  | Đăng nhập tài khoản có sẵn và xác thực mật khẩu sai  |  PASS   | Mật khẩu sai báo lỗi alert, mật khẩu đúng chuyển hướng thành công |
| TC05  | Kiểm tra tính hợp lệ dữ liệu nhập (Validation UI)    |  PASS   | Bắt lỗi email sai định dạng và mật khẩu dưới 8 ký tự              |
| TC06  | Chuyển đổi tài khoản (Quay lại bước nhập identifier) |  PASS   | Nút Đổi chuyển mượt mà về form nhập identifier ban đầu            |
| TC07  | Xử lý sự cố mạng / Dịch vụ gián đoạn (HTTP 503)      |  PASS   | Giao diện hiển thị cảnh báo không thể kết nối tới máy chủ         |
| TC08  | Giới hạn tần suất thao tác (HTTP 429 Rate Limit)     |  PASS   | Hiển thị cảnh báo thao tác quá nhanh, vô hiệu hóa nút gửi         |
| TC09  | Khóa tài khoản 15 phút sau 5 lần nhập sai liên tiếp  | PENDING | Đánh dấu test.fixme, chờ Backend Lead (BE1) hoàn tất logic đếm    |

## 3. Phân tích nguyên nhân gốc rễ sự cố môi trường phát triển

Trong quá trình khởi chạy thử nghiệm ban đầu, hệ thống ghi nhận lỗi TypeError: Cannot read properties of undefined (reading 'checkIdentifier') và lỗi tại BookingCleanupTask.

- Nguyên nhân gốc rễ: Lệnh chạy dev của Backend sử dụng công cụ tsx (dựa trên esbuild). esbuild mặc định bỏ qua cờ emitDecoratorMetadata của TypeScript, làm mất metadata design:paramtypes cần thiết cho cơ chế Dependency Injection của NestJS.
- Giải pháp khắc phục: Đã chuyển đổi dev runner của API sang tsc-watch (tsc-watch -p tsconfig.json --onSuccess "node dist/main.js"), đảm bảo toàn bộ service được inject chuẩn xác và tác vụ nền dọn dẹp đơn hàng BookingCleanupTask hoạt động ổn định.
