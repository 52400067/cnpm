# Báo cáo kiểm thử bảo mật cơ bản và phân quyền (RBAC)

- Ngày thực hiện: 27/10/2026
- Vai trò phụ trách: Quản lý dự án & QA (PM / QA Lead)
- Phạm vi kiểm thử: Tuyến đường công khai, tuyến đường bảo vệ (Admin, Organizer, Buyer), cơ chế Cookie JWT và khả năng chống chịu lỗi mạng.
- Tệp kịch bản kiểm thử: apps/web/test/security.spec.ts

## 1. Mục tiêu kiểm thử

Xác thực tính an toàn của tầng Next.js Edge Proxy (proxy.ts) và cơ chế xác thực phân quyền dựa trên JSON Web Token (JWT) có chữ ký số HMAC-SHA256, đảm bảo không có lỗ hổng vượt quyền (Privilege Escalation) giữa các vai trò người dùng trong hệ thống TicketHub.

## 2. Ma trận kiểm thử phân quyền (RBAC Test Matrix)

| Mã test | Kịch bản kiểm thử                                                  | Hành vi kỳ vọng                                                  | Kết quả |
| :------ | :----------------------------------------------------------------- | :--------------------------------------------------------------- | :-----: |
| SEC01   | Khách vãng lai chưa đăng nhập cố truy cập /admin                   | Bị chặn và chuyển hướng về /auth?redirect=%2Fadmin               |  PASS   |
| SEC02   | Người mua (vai trò BUYER) cố truy cập /admin                       | Bị từ chối truy cập và chuyển hướng về /?error=forbidden_admin   |  PASS   |
| SEC03   | Người dùng chưa có vai trò ORGANIZER cố vào /organizer/events      | Bị chặn và chuyển hướng về /auth?redirect=%2Forganizer%2Fevents  |  PASS   |
| SEC04   | Thao tác gửi yêu cầu liên tục vượt ngưỡng (HTTP 429)               | Giao diện hiển thị cảnh báo thao tác quá nhanh                   |  PASS   |
| SEC05   | Máy chủ mất kết nối hoặc phản hồi lỗi 503                          | Giao diện hiển thị cảnh báo không thể kết nối tới máy chủ        |  PASS   |
| SEC06   | Xóa bỏ Cookie accessToken khi đang xem trang cá nhân (/my-tickets) | Bị thu hồi quyền và chuyển hướng ngay lập tức về trang đăng nhập |  PASS   |

## 3. Kết luận an ninh

Cơ chế phân quyền tại tầng mạng biên (Edge Proxy) hoạt động an toàn và tuân thủ thiết kế:

- Các tuyến đường quản trị (/admin) và tổ chức sự kiện (/organizer) được bảo vệ nghiêm ngặt.
- Chữ ký số JWT được kiểm tra tính hợp lệ bằng khóa bí mật bí mật trên máy chủ; token giả mạo hoặc sai vai trò đều bị từ chối triệt để.
