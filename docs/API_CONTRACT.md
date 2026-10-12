# Hợp đồng giao diện lập trình (API Contract)

Tài liệu này đặc tả các endpoint REST API, định dạng dữ liệu đầu vào và đầu ra, mã lỗi, cũng như giao thức Server-Sent Events (SSE) cho hệ thống TicketHub.

Phiên bản API hiện tại: `v1` (tiền tố URL: `/api/v1`).

## Quy ước chung

### Cấu trúc phản hồi

Tất cả các endpoint API trả về dữ liệu theo cấu trúc chuẩn sau:

Thành công (`HTTP 200` hoặc `201`):
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-10-14T09:30:00.000Z",
    "requestId": "req_01HZX890ABCDEF"
  }
}
```

Thất bại (`HTTP 4xx` hoặc `5xx`):
```json
{
  "success": false,
  "error": {
    "code": "SEAT_ALREADY_HELD",
    "message": "Một hoặc nhiều ghế bạn chọn đang được giữ trong phiên khác.",
    "details": [
      {
        "field": "seatIds",
        "issue": "Ghế A-12 không khả dụng"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-10-14T09:30:00.000Z",
    "requestId": "req_01HZX890ABCDEF"
  }
}
```

### Mã lỗi nghiệp vụ

| Mã lỗi | HTTP Status | Diễn giải |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | 400 | Dữ liệu đầu vào không hợp lệ |
| `UNAUTHORIZED` | 401 | Thiếu JWT token hoặc token hết hạn/không hợp lệ |
| `FORBIDDEN` | 403 | Tài khoản không có quyền truy cập tài nguyên |
| `ACCOUNT_LOCKED` | 403 | Tài khoản bị tạm khóa 15 phút do nhập sai mật khẩu 5 lần |
| `ORGANIZER_NOT_VERIFIED` | 403 | Ban tổ chức chưa được quản trị viên duyệt hồ sơ |
| `NOT_FOUND` | 404 | Tài nguyên không tồn tại |
| `SEAT_ALREADY_HELD` | 409 | Ghế đã có người giữ hoặc đã bán |
| `CONFLICT_VERSION` | 409 | Xung đột phiên bản dữ liệu khi cập nhật đồng thời |
| `WAITING_ROOM_REQUIRED` | 428 | Sự kiện đang bật hàng chờ, thiếu admission token |
| `TOO_MANY_REQUESTS` | 429 | Gửi yêu cầu vượt quá giới hạn tần suất cho phép |
| `INTERNAL_SERVER_ERROR` | 500 | Lỗi xử lý nội bộ phía máy chủ |

### Xác thực và phân quyền

- Access Token: JWT có thời hạn 15 phút, truyền qua header: `Authorization: Bearer <accessToken>`.
- Refresh Token: Lưu trong HTTP-Only Cookie (`SameSite=Strict`, `Secure`), thời hạn 7 ngày, áp dụng cơ chế token rotation khi gọi `/auth/refresh`.
- Khóa Idempotency: Với các yêu cầu tạo đơn, giữ chỗ, thanh toán hoặc hoàn tiền, client truyền header: `Idempotency-Key: <UUIDv4>`. Hệ thống đối chiếu bảng `idempotency_keys` trước khi thực thi.

## Danh sách endpoint

### Xác thực tài khoản (`/auth`)

#### `POST /api/v1/auth/register`
Đăng ký tài khoản người mua hoặc ban tổ chức.
- Quyền: Công khai
- Request body:
```json
{
  "email": "nguyenan@example.com",
  "phone": "0912345678",
  "fullName": "Nguyễn Văn An",
  "password": "Password123!",
  "role": "BUYER"
}
```
- Response 201:
```json
{
  "success": true,
  "data": {
    "userId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "email": "nguyenan@example.com",
    "status": "PENDING_EMAIL",
    "message": "Liên kết kích hoạt đã được gửi tới email của bạn (hiệu lực 24 giờ)."
  }
}
```

#### `POST /api/v1/auth/verify-email`
Xác thực địa chỉ email.
- Request body: `{ "token": "string" }`
- Response 200: `{ "success": true, "data": { "status": "ACTIVE" } }`

#### `POST /api/v1/auth/login`
Đăng nhập hệ thống.
- Request body: `{ "email": "nguyenan@example.com", "password": "Password123!" }`
- Response 200:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOi...",
    "expiresIn": 900,
    "user": {
      "id": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "email": "nguyenan@example.com",
      "fullName": "Nguyễn Văn An",
      "role": "BUYER",
      "status": "ACTIVE"
    }
  }
}
```

#### `POST /api/v1/auth/refresh`
Làm mới Access Token thông qua Refresh Token từ cookie.
- Response 200: `{ "success": true, "data": { "accessToken": "...", "expiresIn": 900 } }`

#### `POST /api/v1/auth/logout`
Thu hồi Refresh Token và xóa cookie phiên đăng nhập.
- Response 200: `{ "success": true, "data": { "message": "Đăng xuất thành công" } }`

### Tìm kiếm và chi tiết sự kiện (`/events`)

#### `GET /api/v1/events`
Tìm kiếm và lọc danh sách sự kiện, phân trang theo cursor.
- Tham số truy vấn:
  - `keyword`: string (tìm kiếm tiếng Việt có dấu hoặc không dấu)
  - `city`: string
  - `category`: string
  - `fromDate`: chuỗi ISO 8601
  - `toDate`: chuỗi ISO 8601
  - `minPrice`: số
  - `maxPrice`: số
  - `cursor`: UUID của sự kiện mốc
  - `limit`: số lượng bản ghi (mặc định 20, tối đa 50)
- Response 200:
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "e1-uuid",
        "title": "Liveshow Âm Nhạc Mùa Thu 2026",
        "slug": "liveshow-am-nhac-mua-thu-2026",
        "bannerUrl": "https://cdn.tickethub.vn/banners/show1.webp",
        "venueName": "Trung tâm Hội nghị Quốc gia",
        "city": "Hà Nội",
        "startTime": "2026-11-20T19:30:00Z",
        "minPrice": 500000,
        "maxPrice": 2500000,
        "isSoldOut": false
      }
    ],
    "nextCursor": "e2-uuid",
    "hasMore": true
  }
}
```

#### `GET /api/v1/events/:slug`
Lấy chi tiết sự kiện phục vụ SSR.
- Response 200: Chi tiết sự kiện kèm danh sách các hạng vé (`ticketTypes`).

#### `GET /api/v1/events/:id/seatmap`
Lấy sơ đồ ghế và trạng thái chỗ ngồi.
- Response 200:
```json
{
  "success": true,
  "data": {
    "eventId": "e1-uuid",
    "zones": [
      {
        "zoneName": "Khu VIP A",
        "isSeated": true,
        "ticketTypeId": "tt-vip-uuid",
        "rows": [
          {
            "rowLabel": "A",
            "seats": [
              { "id": "s1-uuid", "seatNumber": "01", "status": "AVAILABLE", "price": 2500000 },
              { "id": "s2-uuid", "seatNumber": "02", "status": "HELD", "price": 2500000 },
              { "id": "s3-uuid", "seatNumber": "03", "status": "SOLD", "price": 2500000 }
            ]
          }
        ]
      }
    ]
  }
}
```

#### `GET /api/v1/events/:id/seats/stream` (SSE)
Cập nhật trạng thái ghế theo thời gian thực.
- Tên sự kiện: `seat_status_changed`
- Dữ liệu gửi về:
```json
{
  "seatIds": ["s2-uuid"],
  "status": "HELD",
  "expiresAt": "2026-10-14T09:35:00.000Z"
}
```

### Hàng chờ ảo (`/waiting-room`)

#### `POST /api/v1/waiting-room/:eventId/join`
Gia nhập hàng chờ trước khi vào màn hình chọn ghế.
- Header: `Authorization: Bearer <accessToken>`
- Response 200 (khi số người chọn ghế còn dưới ngưỡng `MAX_ACTIVE`):
```json
{
  "success": true,
  "data": {
    "status": "ADMITTED",
    "admissionToken": "jwt_token_valid_10_minutes"
  }
}
```
- Response 202 (khi phải xếp hàng):
```json
{
  "success": true,
  "data": {
    "status": "QUEUED",
    "queuePosition": 142,
    "estimatedWaitSeconds": 90,
    "queueId": "q_user_uuid_event_uuid"
  }
}
```

#### `POST /api/v1/waiting-room/:eventId/heartbeat`
Gửi tín hiệu duy trì vị trí hàng chờ mỗi 15 giây.
- Request body: `{ "queueId": "q_user_uuid_event_uuid" }`
- Response 200: `{ "success": true, "data": { "queuePosition": 120, "estimatedWaitSeconds": 75 } }`

### Đặt và giữ chỗ vé (`/booking`)

#### `POST /api/v1/booking/hold`
Giữ chỗ ghế trong thời hạn 5 phút.
- Header:
  - `Authorization: Bearer <accessToken>`
  - `Idempotency-Key: <UUID>`
  - `X-Admission-Token: <token>` (khi sự kiện bật hàng chờ)
- Request body:
```json
{
  "eventId": "e1-uuid",
  "items": [
    { "seatId": "s1-uuid", "ticketTypeId": "tt-vip-uuid" },
    { "seatId": "s2-uuid", "ticketTypeId": "tt-vip-uuid" }
  ]
}
```
- Response 201:
```json
{
  "success": true,
  "data": {
    "orderId": "ord-uuid",
    "orderCode": "ORD-20261014-ABC12",
    "heldSeats": ["s1-uuid", "s2-uuid"],
    "totalAmount": 5000000,
    "holdExpiresAt": "2026-10-14T09:35:00.000Z",
    "remainingSeconds": 300
  }
}
```
- Response 409: Mã lỗi `SEAT_ALREADY_HELD` nếu có ít nhất một ghế không còn trống.

#### `POST /api/v1/booking/release`
Hủy giữ chỗ chủ động khi người dùng rời màn hình thanh toán.
- Request body: `{ "orderId": "ord-uuid" }`
- Response 200: `{ "success": true, "data": { "message": "Đã giải phóng ghế" } }`

### Thanh toán (`/checkout`)

#### `POST /api/v1/checkout/create-payment`
Khởi tạo giao dịch thanh toán và lấy URL cổng VNPay.
- Header: `Authorization: Bearer <accessToken>`, `Idempotency-Key: <UUID>`
- Request body:
```json
{
  "orderId": "ord-uuid",
  "voucherCode": "GIAM50K",
  "bankCode": "NCB"
}
```
- Response 200:
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
    "orderCode": "ORD-20261014-ABC12",
    "finalAmount": 4950000,
    "expiresAt": "2026-10-14T09:35:00.000Z"
  }
}
```

#### `GET /api/v1/webhooks/vnpay/ipn`
Webhook tiếp nhận thông báo kết quả từ cổng VNPay.
- Tham số truy vấn: Toàn bộ tham số do VNPay gửi (`vnp_TxnRef`, `vnp_Amount`, `vnp_ResponseCode`, `vnp_SecureHash`,...).
- Phản hồi trả lại VNPay:
  - Thành công: `{"RspCode": "00", "Message": "Confirm Success"}`
  - Sai chữ ký: `{"RspCode": "97", "Message": "Invalid Signature"}`
  - Không tìm thấy đơn: `{"RspCode": "01", "Message": "Order not found"}`

### Vé điện tử và soát vé (`/tickets` và `/checkin`)

#### `GET /api/v1/tickets/my-tickets`
Lấy danh sách vé đã mua của người dùng đăng nhập.
- Header: `Authorization: Bearer <accessToken>`
- Response 200: Danh sách vé kèm thông tin sự kiện, vị trí ghế và trạng thái.

#### `GET /api/v1/tickets/:id/dynamic-qr`
Lấy token mã QR động ký số bằng Ed25519 (hiệu lực 30 giây).
- Header: `Authorization: Bearer <accessToken>`
- Điều kiện: Vé ở trạng thái `SOLD`, đúng chủ sở hữu và nằm trong khung giờ quy định (từ 2 giờ trước giờ mở cổng đến hết sự kiện).
- Response 200:
```json
{
  "success": true,
  "data": {
    "ticketId": "tkt-uuid",
    "qrToken": "eyJhbGciOiJFZERTQSI...",
    "issuedAt": "2026-11-20T17:30:00Z",
    "expiresAt": "2026-11-20T17:30:30Z",
    "refreshIntervalSeconds": 25
  }
}
```

Nội dung giải mã của `qrToken` (Ed25519 JWS):
```json
{
  "sub": "tkt-uuid",
  "eventId": "e1-uuid",
  "ticketCode": "TKT-XYZ789",
  "seat": "Khu VIP A - Hàng A - Ghế 01",
  "iat": 1795195800,
  "exp": 1795195830,
  "jti": "random_unique_nonce_string"
}
```

#### `POST /api/v1/checkin/scan`
Nhân viên soát vé quét mã QR tại cổng.
- Header: `Authorization: Bearer <staffToken>`
- Request body: `{ "qrToken": "string", "gateId": "gate-a-uuid" }`
- Response 200 (vé hợp lệ):
```json
{
  "success": true,
  "data": {
    "status": "VALID",
    "ticketCode": "TKT-XYZ789",
    "seat": "Khu VIP A - Hàng A - Ghế 01",
    "ticketTypeName": "VIP",
    "checkedInAt": "2026-11-20T18:15:22Z"
  }
}
```
- Response 409 (vé đã sử dụng hoặc đã hủy):
```json
{
  "success": false,
  "error": {
    "code": "TICKET_ALREADY_USED",
    "message": "Vé này đã được soát lúc 18:02:11 tại Cổng B"
  }
}
```

#### `POST /api/v1/checkin/manual-search`
Tra cứu vé thủ công khi người mua không mở được mã QR.
- Request body: `{ "eventId": "e1-uuid", "searchQuery": "0912345678" }`
- Response 200: Danh sách vé phù hợp để nhân viên đối chiếu giấy tờ tùy thân.

### Hủy vé và hoàn tiền (`/refund`)

#### `POST /api/v1/refund/preview`
Tính trước số tiền hoàn lại theo chính sách trước khi xác nhận.
- Request body: `{ "ticketId": "tkt-uuid" }`
- Response 200:
```json
{
  "success": true,
  "data": {
    "ticketPrice": 2500000,
    "refundPercentage": 70,
    "refundAmount": 1750000,
    "feeDeducted": 750000,
    "policyApplied": "Hủy trước sự kiện 3-7 ngày (hoàn 70%)"
  }
}
```

#### `POST /api/v1/refund/request`
Gửi yêu cầu hủy vé.
- Header: `Authorization: Bearer <accessToken>`, `Idempotency-Key: <UUID>`
- Request body: `{ "ticketId": "tkt-uuid", "reason": "Bận việc đột xuất" }`
- Response 200: `{ "success": true, "data": { "refundId": "ref-uuid", "status": "PROCESSING" } }`

### Quản trị hệ thống (`/admin`)

#### `POST /api/v1/admin/events/:id/approve`
Phê duyệt sự kiện chuyển sang trạng thái `PUBLISHED`.
- Header: `Authorization: Bearer <adminToken>`
- Response 200: Sự kiện chuyển trạng thái và tự động tạo tồn kho ghế.

#### `POST /api/v1/admin/events/:id/kill-switch`
Kích hoạt dừng khẩn cấp sự kiện vi phạm.
- Header: `Authorization: Bearer <adminToken>`
- Request body: `{ "reason": "Phát hiện thông tin giả mạo" }`
- Response 200: Sự kiện chuyển `SUSPENDED`, hủy các đơn đang giữ chỗ và giải tán hàng chờ.

#### `GET /api/v1/admin/reconciliations`
Lấy danh sách đối soát giao dịch với dữ liệu VNPay.
- Response 200: Danh sách giao dịch khớp và các bản ghi phát hiện chênh lệch.

#### `POST /api/v1/admin/payouts/:id/approve`
Xác nhận phê duyệt lệnh chi trả tiền bán vé cho ban tổ chức.
- Response 200: Lệnh chi trả chuyển trạng thái `PAID_OUT`.
