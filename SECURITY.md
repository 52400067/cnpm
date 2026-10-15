# Chính sách bảo mật (Security Policy)

Tài liệu này quy định quy trình tiếp nhận, đánh giá và xử lý các vấn đề liên quan đến bảo mật thông tin trên hệ thống TicketHub.

## 1. Các phiên bản được hỗ trợ (Supported Versions)

Dự án duy trì và cập nhật các bản vá bảo mật cho các nhánh mã nguồn sau:

| Nhánh / Phiên bản | Hỗ trợ bảo mật | Ghi chú                            |
| :---------------- | :------------- | :--------------------------------- |
| `stable`          | Có             | Nhánh phát hành chính thức         |
| `unstable`        | Có             | Nhánh tích hợp phát triển hiện tại |

Các phiên bản cũ hơn hoặc các bản fork không nằm trong phạm vi hỗ trợ bảo mật trực tiếp.

## 2. Báo cáo lỗ hổng bảo mật (Reporting a Vulnerability)

Nếu phát hiện bất kỳ vấn đề bảo mật nào, vui lòng thực hiện theo nguyên tắc công bố có trách nhiệm (Responsible Disclosure):

- **Không mở issue công khai:** Không tạo GitHub Issue công khai hoặc thảo luận trên Pull Request công khai đối với các lỗ hổng bảo mật chưa có bản vá để tránh nguy cơ bị khai thác diện rộng.
- **Kênh tiếp nhận báo cáo:**
  - Sử dụng tính năng **GitHub Private Vulnerability Reporting** tại thẻ _Security_ -> _Advisories_ của kho lưu trữ.
  - Hoặc gửi thư điện tử trực tiếp tới hòm thư chuyên trách bảo mật: `security@tickethub.vn`.
- **Thông tin cần cung cấp trong báo cáo:**
  - Mô tả rõ ràng bản chất lỗ hổng (ví dụ: Authentication Bypass, SQL Injection, Broken Object Level Authorization, Race Condition tranh chấp vé).
  - Các bước tái hiện chi tiết (Proof of Concept - PoC) hoặc mã kịch bản mẫu.
  - Mức độ ảnh hưởng ước tính đến tính toàn vẹn dữ liệu, tính sẵn sàng hoặc quyền riêng tư của người dùng.
  - Đề xuất giải pháp khắc phục (nếu có).

## 3. Quy trình phản hồi và xử lý

1. **Xác nhận tiếp nhận:** Đội ngũ phát triển xác nhận đã nhận được báo cáo trong vòng 48 giờ làm việc.
2. **Thẩm định kỹ thuật:** Đội ngũ kỹ thuật tái hiện sự cố trên môi trường thử nghiệm cô lập và đánh giá mức độ rủi ro trong vòng 5 ngày làm việc.
3. **Phát triển bản vá:** Bản vá bảo mật được xây dựng, kiểm thử hồi quy và chuẩn bị trên nhánh làm việc nội bộ.
4. **Phát hành và cập nhật:** Bản vá được hợp nhất và phát hành lên nhánh `stable`.
5. **Công bố thông tin:** Sau khi hệ thống đã được cập nhật an toàn, thông tin về lỗ hổng có thể được công bố kèm theo ghi nhận đóng góp của người phát hiện (nếu người báo cáo đồng ý).

## 4. Phạm vi áp dụng (Scope)

### Trong phạm vi (In-Scope)

- Lỗ hổng xác thực, phân quyền (RBAC) và quản lý phiên JWT trong `apps/api`.
- Lỗ hổng tranh chấp dữ liệu (Race Condition) trong quá trình giữ chỗ và mua vé.
- Lỗ hổng liên quan đến chữ ký số Ed25519 trên mã QR soát vé tại cổng.
- Lỗ hổng xử lý xác thực chữ ký HMAC và callback cổng thanh toán VNPay.
- Rò rỉ thông tin định danh cá nhân theo Nghị định 13/2023/NĐ-CP.

### Ngoài phạm vi (Out-of-Scope)

- Tấn công từ chối dịch vụ phân tán (DDoS) hoặc làm cạn kiệt tài nguyên mạng.
- Tấn công phi kỹ thuật (Social Engineering, Phishing) nhắm vào người dùng hoặc cộng tác viên.
- Các báo cáo từ công cụ quét tự động không có bằng chứng chứng minh khả năng khai thác thực tế.
- Sự cố bắt nguồn từ các dịch vụ hoặc hạ tầng của bên thứ ba nằm ngoài phạm vi kiểm soát của hệ thống.
