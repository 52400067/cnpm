# Đặc tả dịch vụ AI (AI Service Contract)

Tài liệu này đặc tả kiến trúc tích hợp, giao thức API, cơ chế RAG (Retrieval-Augmented Generation), định dạng dữ liệu và các ràng buộc bảo mật cho các dịch vụ AI trên nền tảng TicketHub, điển hình là trợ lý ảo hỗ trợ người dùng (AI Event Concierge).

## 1. Mục tiêu và phạm vi nghiệp vụ

### Mục tiêu

Cung cấp kênh hỗ trợ tương tác tự động giúp người mua vé tra cứu thông tin sự kiện nhanh chóng, tìm kiếm sự kiện phù hợp theo sở thích, hiểu rõ chính sách vé và nhận hướng dẫn thao tác trên nền tảng.

### Phạm vi nghiệp vụ hỗ trợ

- **Tra cứu thông tin sự kiện:** Thời gian tổ chức, địa điểm, danh sách nghệ sĩ/diễn giả, sơ đồ chỗ ngồi tổng quát, thời gian mở cổng và quy định độ tuổi.
- **Tư vấn giá và hạng vé:** Thông tin các hạng vé (VIP, Standard, GA), giá niêm yết, quyền lợi đi kèm và trạng thái tồn kho vé còn hay hết.
- **Giải đáp chính sách:** Quy định hoàn trả/đổi vé theo từng sự kiện, thời hạn check-in, quy định về vật dụng được phép mang vào địa điểm.
- **Hướng dẫn thao tác:** Hướng dẫn thanh toán qua cổng VNPay, hướng dẫn sử dụng mã QR động trên ứng dụng để soát vé tại cổng.

### Phạm vi không hỗ trợ (Out-of-Scope)

- AI không trực tiếp thực hiện giao dịch giữ chỗ, mua vé, xuất vé hoặc hủy vé.
- AI không xử lý hoặc thu thập dữ liệu thanh toán, thông tin thẻ ngân hàng hoặc thông tin định danh nhạy cảm.
- AI không can thiệp vào dữ liệu cấu hình sự kiện, quản trị của ban tổ chức hoặc phân quyền hệ thống.

## 2. Kiến trúc tích hợp dịch vụ AI

Hệ thống kết hợp giữa giao diện Web Frontend (`apps/web`), dịch vụ Backend API (`apps/api`) và nhà cung cấp mô hình ngôn ngữ lớn (LLM Provider):

1. **Client Layer (`apps/web`):** Cung cấp giao diện hộp thoại chat, quản lý `sessionId` cục bộ và tiếp nhận luồng dữ liệu streaming thời gian thực qua Server-Sent Events (SSE).
2. **API Layer (`apps/api`):** Tiếp nhận yêu cầu, áp dụng kiểm soát tần suất (Rate Limiting), điều phối lịch sử hội thoại trên Redis, thực thi cơ chế Function Calling để truy xuất dữ liệu từ cơ sở dữ liệu PostgreSQL.
3. **Data Retrieval (RAG & Tools):** Sử dụng các hàm tra cứu chỉ đọc (read-only) để lấy dữ liệu thực tế từ các bảng `events`, `ticket_types` và `organizer_profiles`.
4. **LLM Provider:** Nhận prompt kèm ngữ cảnh thực tế đã được chuẩn hóa để tổng hợp câu trả lời và truyền về dưới dạng streaming token.

## 3. Đặc tả API Contract

### Endpoint: Giao tiếp với trợ lý ảo

- **Đường dẫn:** `POST /api/v1/ai/chat`
- **Content-Type:** `application/json`
- **Accept:** `text/event-stream` (mặc định cho phản hồi trực tiếp từng token) hoặc `application/json` (cho phản hồi khối đơn)
- **Xác thực:** Tùy chọn (hỗ trợ cả khách vãng lai và người dùng đã đăng nhập). Khi có người dùng đăng nhập, client đính kèm header `Authorization: Bearer <JWT_ACCESS_TOKEN>`.
- **Headers bắt buộc:**
  - `X-Session-Id`: Chuỗi UUID v4 định danh phiên hội thoại liên tục của người dùng.

#### Request Body Schema

```typescript
export interface AiChatRequest {
  sessionId: string; // Chuỗi UUID v4 của phiên hội thoại
  eventId?: string; // UUID của sự kiện nếu người dùng đang đứng tại trang chi tiết sự kiện
  message: string; // Nội dung câu hỏi từ người dùng (tối thiểu 1 ký tự, tối đa 1000 ký tự)
  history?: Array<{
    role: "user" | "assistant";
    content: string;
  }>; // Lịch sử hội thoại gần nhất (tối đa 10 lượt gần nhất để duy trì ngữ cảnh)
}
```

#### Định dạng phản hồi luồng (Server-Sent Events)

Mỗi thông điệp được truyền về dưới dạng sự kiện SSE chuẩn:

- **Sự kiện `token`:** Chứa từng phần văn bản được sinh ra từ mô hình.

  ```
  event: token
  data: {"text": "Vé hạng Standard "}
  ```

- **Sự kiện `source`:** Danh sách nguồn dữ liệu tham chiếu được sử dụng để trả lời (nếu có).

  ```
  event: source
  data: {"eventId": "b2c6e643-4e3a-4db3-80b6-1ef21b1b46a2", "title": "Đêm Nhạc Indie 2026", "url": "/events/b2c6e643-4e3a-4db3-80b6-1ef21b1b46a2"}
  ```

- **Sự kiện `done`:** Đánh dấu lượt hội thoại kết thúc.

  ```
  event: done
  data: {"sessionId": "8f8ef59a-1153-43ef-ba2e-8cb51f65f02c", "finishReason": "stop"}
  ```

- **Sự kiện `error`:** Trả về khi xuất hiện lỗi trong quá trình xử lý luồng.
  ```
  event: error
  data: {"code": "AI_RATE_LIMIT_EXCEEDED", "message": "Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau giây lát."}
  ```

### Danh mục mã lỗi chuẩn

| Mã lỗi (Code)            | HTTP Status | Diễn giải                                                              |
| :----------------------- | :---------- | :--------------------------------------------------------------------- |
| `AI_RATE_LIMIT_EXCEEDED` | 429         | Vượt quá số lượng yêu cầu cho phép trong khoảng thời gian quy định     |
| `AI_INVALID_PROMPT`      | 400         | Nội dung câu hỏi rỗng, quá độ dài cho phép hoặc vi phạm bộ lọc an toàn |
| `AI_CONTEXT_NOT_FOUND`   | 404         | Tham số `eventId` được cung cấp không tồn tại trong cơ sở dữ liệu      |
| `AI_SERVICE_UNAVAILABLE` | 503         | Dịch vụ LLM của nhà cung cấp tạm thời gián đoạn hoặc mất kết nối       |

## 4. Công cụ tra cứu dữ liệu (Function Calling / Tools)

Để đảm bảo câu trả lời luôn khớp với dữ liệu thực tế trong hệ thống thay vì dựa trên phỏng đoán, dịch vụ AI được tích hợp các công cụ tra cứu sau:

1. `get_event_details(eventId: string)`:
   - **Mục đích:** Lấy thông tin tổng quan, thời gian, địa điểm tổ chức, trạng thái sự kiện và thông tin ban tổ chức.
   - **Nguồn dữ liệu:** Bảng `events` kết hợp bảng `organizer_profiles`.

2. `get_ticket_types(eventId: string)`:
   - **Mục đích:** Lấy danh sách hạng vé, giá bán, số lượng vé còn lại và giới hạn mua tối đa.
   - **Nguồn dữ liệu:** Bảng `ticket_types` và bảng `seats`.

3. `get_event_policies(eventId: string)`:
   - **Mục đích:** Lấy thông tin điều khoản hoàn tiền, quy định độ tuổi và hướng dẫn check-in của sự kiện.
   - **Nguồn dữ liệu:** Cột `description` và cấu hình chính sách của bảng `events`.

4. `search_events(query: string, city?: string, category?: string)`:
   - **Mục đích:** Tìm kiếm các sự kiện đang mở bán vé phù hợp với từ khóa người dùng muốn tìm.
   - **Nguồn dữ liệu:** Truy vấn tìm kiếm trên bảng `events` với điều kiện `status = 'PUBLISHED'`.

## 5. Ràng buộc an toàn và bảo mật (Guardrails & Constraints)

### Ranh giới chỉ đọc (Read-only Boundary)

Mọi công cụ và kết nối cơ sở dữ liệu cấp cho dịch vụ AI bắt buộc ở chế độ chỉ đọc (Read-only). Dịch vụ AI không có quyền cập nhật bảng `orders`, `tickets`, `seats` hoặc kích hoạt bất kỳ lệnh chuyển tiền/hoàn tiền nào.

### Phòng chống tấn công Prompt Injection

Hệ thống sử dụng kỹ thuật phân tách nghiêm ngặt giữa System Prompt và User Input:

- Nội dung câu hỏi của người dùng được coi là chuỗi dữ liệu chưa được tin cậy, không được thực thi như một chỉ thị thay thế cho System Prompt.
- Mô hình phải từ chối các yêu cầu vi phạm bảo mật, yêu cầu trích xuất cấu hình hệ thống hoặc yêu cầu đóng giả vai trò quản trị viên.

### Tuân thủ bảo vệ dữ liệu cá nhân

- Tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
- Không đưa thông tin cá nhân của người dùng (số CCCD, mật khẩu, mã OTP, số tài khoản thanh toán) vào ngữ cảnh gửi tới LLM.
- Nhật ký hội thoại (chat logs) phải được ẩn danh hóa và lưu trữ có thời hạn tự hủy (TTL) trên Redis.

### Kiểm soát tần suất truy vấn (Rate Limiting)

Hệ thống áp dụng giới hạn tần suất bằng Redis Token Bucket:

- **Khách chưa đăng nhập:** Tối đa 10 yêu cầu trong vòng 5 phút trên một địa chỉ IP.
- **Người dùng đã đăng nhập:** Tối đa 30 yêu cầu trong vòng 5 phút trên mỗi tài khoản người dùng (`userId`).

### Cơ chế dự phòng khi lỗi (Graceful Degradation)

Khi dịch vụ LLM không phản hồi hoặc phản hồi timeout quá 10 giây, giao diện người dùng tự động chuyển đổi sang thông báo hướng dẫn người dùng tra cứu thông tin trực tiếp trên trang chi tiết sự kiện hoặc liên hệ ban tổ chức.
