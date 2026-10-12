# Hợp Đồng Giao Diện Lập Trình (API Contract Specification)
**Dự án:** Nền tảng bán vé sự kiện trực tuyến (TicketHub)  
**Tiêu chuẩn:** RESTful API · NestJS (Fastify) · Schema Zod / TypeScript Strict · OpenAPI 3.1  
**Phiên bản API:** `v1` (Base URL: `/api/v1`)  

---

## 1. Quy Ước Chung & Chuẩn Định Dạng

### 1.1 Cấu Trúc Phản Hồi Chuẩn (Standard Response Envelope)

Tất cả các endpoint API đều trả về định dạng JSON theo hai mẫu quy chuẩn dưới đây:

#### Phản hồi Thành công (`HTTP 200 / 201`)
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

#### Phản hồi Thất bại (`HTTP 4xx / 5xx`)
```json
{
  "success": false,
  "error": {
    "code": "SEAT_ALREADY_HELD",
    "message": "Một hoặc nhiều ghế bạn chọn vừa có người khác giữ chỗ.",
    "details": [
      {
        "field": "seatIds",
        "issue": "Ghế A-12 đang được giữ trong phiên khác"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-10-14T09:30:00.000Z",
    "requestId": "req_01HZX890ABCDEF"
  }
}
```

---

### 1.2 Bảng Mã Lỗi Nghiệp Vụ Chuẩn (Business Error Codes)

| Mã lỗi (`error.code`) | HTTP Status | Diễn giải |
| :--- | :--- | :--- |
| `VALIDATION_ERROR` | 400 | Dữ liệu đầu vào không hợp lệ theo Zod schema |
| `UNAUTHORIZED` | 401 | Thiếu JWT token hoặc token hết hạn/không hợp lệ |
| `FORBIDDEN` | 403 | Không đủ quyền truy cập (RBAC chặn) |
| `ACCOUNT_LOCKED` | 403 | Tài khoản bị tạm khóa 15 phút do nhập sai 5 lần |
| `ORGANIZER_NOT_VERIFIED` | 403 | Ban tổ chức chưa được Admin phê duyệt hồ sơ |
| `NOT_FOUND` | 404 | Tài nguyên không tồn tại |
| `SEAT_ALREADY_HELD` | 409 | Ghế đã có người giữ hoặc đã bán |
| `CONFLICT_VERSION` | 409 | Xung đột phiên bản dữ liệu (Optimistic locking) |
| `WAITING_ROOM_REQUIRED`| 428 | Sự kiện đang bật hàng chờ, thiếu admission token |
| `TOO_MANY_REQUESTS` | 429 | Vượt quá giới hạn tần suất gửi request (Rate limit) |
| `INTERNAL_SERVER_ERROR`| 500 | Lỗi hệ thống nội bộ |

---

### 1.3 Xác Thực & Phân Quyền (Authentication & RBAC)
- **Access Token:** JWT ngắn hạn (15 phút), gửi qua Header: `Authorization: Bearer <accessToken>`.
- **Refresh Token:** Lưu trong HTTP-Only Cookie (`SameSite=Strict`, `Secure`), thời hạn 7 ngày, tự động xoay vòng (Token Rotation) khi gọi `/auth/refresh`.
- **Idempotency Key:** Với các thao tác tạo đơn, giữ chỗ, thanh toán, hoàn tiền, Client gửi Header:
  `Idempotency-Key: <UUIDv4>`. Backend sẽ kiểm tra bảng `idempotency_keys` trước khi thực thi.

---

## 2. Danh Sách Endpoint Chi Tiết Theo Phân Hệ

---

### 2.1 Module Xác Thực & Người Dùng (`/auth`) – UC01

#### `POST /api/v1/auth/register`
Đăng ký tài khoản người mua hoặc Ban tổ chức.
- **Quyền:** Public
- **Request Body:**
```json
{
  "email": "nguyenan@example.com",
  "phone": "0912345678",
  "fullName": "Nguyễn Văn An",
  "password": "Password123!",
  "role": "BUYER" // "BUYER" | "ORGANIZER"
}
```
- **Response 201:**
```json
{
  "success": true,
  "data": {
    "userId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "email": "nguyenan@example.com",
    "status": "PENDING_EMAIL",
    "message": "Vui lòng kiểm tra email để kích hoạt tài khoản trong vòng 24 giờ."
  }
}
```

#### `POST /api/v1/auth/verify-email`
Xác thực email qua token gửi trong đường dẫn.
- **Request Body:** `{ "token": "string" }`
- **Response 200:** `{ "success": true, "data": { "status": "ACTIVE" } }`

#### `POST /api/v1/auth/login`
Đăng nhập, cấp Access Token và gán Refresh Token vào cookie.
- **Request Body:** `{ "email": "nguyenan@example.com", "password": "Password123!" }`
- **Response 200:**
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
Tự động làm mới Access Token bằng Refresh Token từ cookie.
- **Response 200:** `{ "success": true, "data": { "accessToken": "...", "expiresIn": 900 } }`

#### `POST /api/v1/auth/logout`
Thu hồi Refresh Token và xóa cookie phiên làm việc.
- **Response 200:** `{ "success": true, "data": { "message": "Đăng xuất thành công" } }`

---

### 2.2 Module Sự Kiện & Tìm Kiếm (`/events`) – UC02

#### `GET /api/v1/events`
Tra cứu danh sách sự kiện kèm bộ lọc và phân trang theo con trỏ (cursor pagination).
- **Query Params:**
  - `keyword`: string (hỗ trợ tiếng Việt không dấu)
  - `city`: string (Hà Nội, TP.HCM,...)
  - `category`: string (MUSIC, WORKSHOP, SPORTS,...)
  - `fromDate`: ISO string
  - `toDate`: ISO string
  - `minPrice`: number
  - `maxPrice`: number
  - `cursor`: string (UUID của bản ghi trước)
  - `limit`: number (mặc định 20, tối đa 50)
- **Response 200:**
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
Chi tiết sự kiện phục vụ Server-Side Rendering (Next.js SSR/SEO).
- **Response 200:** Thông tin sự kiện, danh sách hạng vé (`ticketTypes`), tình trạng mở bán.

#### `GET /api/v1/events/:id/seatmap`
Tải sơ đồ ghế và trạng thái tồn kho thời gian thực từ Redis Cache (TTL 60s).
- **Response 200:**
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

#### `GET /api/v1/events/:id/seats/stream` (SSE Endpoint)
Server-Sent Events đẩy cập nhật trạng thái ghế mỗi khi có giao dịch giữ chỗ/hủy chỗ/thanh toán.
- **Event:** `seat_status_changed`
- **Data Payload:**
```json
{
  "seatIds": ["s2-uuid"],
  "status": "HELD",
  "expiresAt": "2026-10-14T09:35:00.000Z"
}
```

---

### 2.3 Module Hàng Chờ Ảo (`/waiting-room`) – UC03

#### `POST /api/v1/waiting-room/:eventId/join`
Gia nhập hàng chờ ảo khi mở bán sự kiện đông người.
- **Headers:** `Authorization: Bearer <accessToken>`
- **Response 200 (Nếu được vào ngay):**
```json
{
  "success": true,
  "data": {
    "status": "ADMITTED",
    "admissionToken": "adm_jwt_token_valid_10_minutes"
  }
}
```
- **Response 202 (Nếu phải xếp hàng):**
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
Gửi tín hiệu duy trì vị trí hàng chờ mỗi 15 giây (mất kết nối 60s sẽ bị loại khỏi hàng).
- **Request Body:** `{ "queueId": "q_user_uuid_event_uuid" }`
- **Response 200:** `{ "success": true, "data": { "queuePosition": 120, "estimatedWaitSeconds": 75 } }`

---

### 2.4 Module Giữ Chỗ & Đặt Vé (`/booking`) – UC04

#### `POST /api/v1/booking/hold`
Giữ chỗ ghế tạm thời 5 phút. Thực thi khóa hàng `SELECT ... FOR UPDATE` trên PostgreSQL.
- **Headers:**
  - `Authorization: Bearer <accessToken>`
  - `Idempotency-Key: <UUID>`
  - `X-Admission-Token: <token>` (bắt buộc nếu sự kiện bật hàng chờ)
- **Request Body:**
```json
{
  "eventId": "e1-uuid",
  "items": [
    { "seatId": "s1-uuid", "ticketTypeId": "tt-vip-uuid" },
    { "seatId": "s2-uuid", "ticketTypeId": "tt-vip-uuid" }
  ]
}
```
- **Response 201:**
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
- **Response 409 Conflict:**
```json
{
  "success": false,
  "error": {
    "code": "SEAT_ALREADY_HELD",
    "message": "Ghế s2-uuid vừa có người khác giữ chỗ. Vui lòng chọn ghế khác."
  }
}
```

#### `POST /api/v1/booking/release`
Hủy phiên giữ chỗ trước hạn khi người mua thoát trang hoặc hủy chọn.
- **Request Body:** `{ "orderId": "ord-uuid" }`
- **Response 200:** `{ "success": true, "data": { "message": "Đã giải phóng ghế" } }`

---

### 2.5 Module Thanh Toán VNPay (`/checkout`) – UC05

#### `POST /api/v1/checkout/create-payment`
Khởi tạo giao dịch thanh toán và lấy đường dẫn URL chuyển hướng sang cổng VNPay.
- **Headers:** `Authorization: Bearer <accessToken>`, `Idempotency-Key: <UUID>`
- **Request Body:**
```json
{
  "orderId": "ord-uuid",
  "voucherCode": "GIAM50K",
  "bankCode": "NCB" // Optional: VNPAYQR, VNBANK, INTCARD
}
```
- **Response 200:**
```json
{
  "success": true,
  "data": {
    "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=...",
    "orderCode": "ORD-20261014-ABC12",
    "finalAmount": 4950000,
    "expiresAt": "2026-10-14T09:35:00.000Z"
  }
}
```

#### `GET /api/v1/webhooks/vnpay/ipn` (Server-to-Server IPN Callback)
Cổng VNPay gọi trực tiếp thông báo kết quả thanh toán.
- **Query Params:** Chứa toàn bộ tham số do VNPay gửi (`vnp_TxnRef`, `vnp_Amount`, `vnp_ResponseCode`, `vnp_SecureHash`,...)
- **Quy trình xử lý:**
  1. Kiểm tra chữ ký HMAC SHA512 với `vnp_HashSecret`.
  2. Tra cứu giao dịch trong DB theo `vnp_TxnRef`.
  3. Kiểm tra Idempotent (giao dịch đã `SUCCESS` thì trả `{"RspCode":"00","Message":"Confirm Success"}` ngay).
  4. Nếu `vnp_ResponseCode == '00'`: Cập nhật đơn `PAID`, ghế `SOLD`, phát hành `TICKETS`, ghi `OUTBOX`.
- **Response theo quy định VNPay:**
  - Thành công: `{"RspCode": "00", "Message": "Confirm Success"}`
  - Sai chữ ký: `{"RspCode": "97", "Message": "Invalid Signature"}`
  - Đơn không tồn tại: `{"RspCode": "01", "Message": "Order not found"}`

---

### 2.6 Module Vé Của Tôi & QR Động (`/tickets`) – UC05, UC08

#### `GET /api/v1/tickets/my-tickets`
Lấy danh sách vé đã mua của người dùng hiện tại.
- **Headers:** `Authorization: Bearer <accessToken>`
- **Response 200:** Danh sách vé với mã `ticketCode`, tên sự kiện, khu vực, hàng, số ghế.

#### `GET /api/v1/tickets/:id/dynamic-qr`
Lấy mã QR động (JWS token Ed25519) có hiệu lực 30 giây.
- **Headers:** `Authorization: Bearer <accessToken>`
- **Điều kiện:** Vé ở trạng thái `SOLD`, đúng chủ sở hữu, thời gian nằm trong khung giờ check-in (từ 2 giờ trước giờ mở cổng).
- **Response 200:**
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

**Cấu trúc giải mã bên trong `qrToken` (Ed25519 JWS):**
```json
{
  "sub": "tkt-uuid",
  "eventId": "e1-uuid",
  "ticketCode": "TKT-XYZ789",
  "seat": "Khu VIP A - Hàng A - Ghế 01",
  "iat": 1795195800,
  "exp": 1795195830,
  "jti": "random_nonce_used_once_string"
}
```

---

### 2.7 Module Soát Vé Tại Cổng (`/checkin`) – UC08

#### `POST /api/v1/checkin/scan`
Nhân viên soát vé quét mã QR qua PWA Gate App.
- **Headers:** `Authorization: Bearer <staffAccessToken>`
- **Request Body:**
```json
{
  "qrToken": "eyJhbGciOiJFZERTQSI...",
  "gateId": "gate-a-uuid"
}
```
- **Xử lý:**
  1. Xác thực chữ ký Ed25519 bằng Public Key.
  2. Kiểm tra `exp` còn hạn (cho phép lệch clock tối đa 5 giây).
  3. Kiểm tra `jti` chưa từng xuất hiện.
  4. Thực thi SQL nguyên tử `UPDATE tickets SET status='CHECKED_IN' WHERE id=$1 AND status='SOLD'`.
- **Response 200 (Hợp lệ - Màn hình Xanh):**
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
- **Response 409 (Vé đã dùng - Màn hình Đỏ):**
```json
{
  "success": false,
  "error": {
    "code": "TICKET_ALREADY_USED",
    "message": "Vé này đã được quét vào cổng lúc 18:02:11 tại Cổng B!"
  }
}
```

#### `POST /api/v1/checkin/manual-search`
Tra cứu thủ công khi khách hàng không hiển thị được mã QR trên điện thoại.
- **Request Body:** `{ "eventId": "e1-uuid", "searchQuery": "0912345678" }` (Tìm theo SĐT, email hoặc `ticketCode`)
- **Response 200:** Danh sách vé khớp thông tin để nhân viên đối chiếu CMND/CCCD.

---

### 2.8 Module Hủy Vé & Hoàn Tiền (`/refund`) – UC06

#### `POST /api/v1/refund/preview`
Xem trước số tiền hoàn lại theo chính sách trước khi xác nhận hủy vé.
- **Request Body:** `{ "ticketId": "tkt-uuid" }`
- **Response 200:**
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
Xác nhận hủy vé và đưa yêu cầu hoàn tiền vào hàng đợi nền gọi API VNPay Refund.
- **Headers:** `Authorization: Bearer <accessToken>`, `Idempotency-Key: <UUID>`
- **Request Body:** `{ "ticketId": "tkt-uuid", "reason": "Bận việc đột xuất" }`
- **Response 200:** `{ "success": true, "data": { "refundId": "ref-uuid", "status": "PROCESSING" } }`

---

### 2.9 Module Quản Trị Admin (`/admin`) – UC10, UC11

#### `POST /api/v1/admin/events/:id/approve`
Admin duyệt xuất bản sự kiện (`PENDING_APPROVAL` → `PUBLISHED`).
- **Headers:** `Authorization: Bearer <adminToken>`
- **Response 200:** Sự kiện chuyển `PUBLISHED`, hệ thống tự động sinh tồn kho ghế và đánh chỉ mục FTS.

#### `POST /api/v1/admin/events/:id/kill-switch`
Kích hoạt cơ chế dừng khẩn cấp (Kill Switch).
- **Headers:** `Authorization: Bearer <adminToken>`
- **Request Body:** `{ "reason": "Phát hiện sự kiện có dấu hiệu lừa đảo giả mạo nghệ sĩ" }`
- **Response 200:** Trạng thái sự kiện chuyển `SUSPENDED`, lập tức hủy các đơn `PENDING`, giải tán hàng chờ, đưa toàn bộ vé đã bán vào danh sách xem xét hoàn tiền hàng loạt.

#### `GET /api/v1/admin/reconciliations`
Báo cáo đối soát đối chiếu giao dịch nội bộ với VNPay.
- **Response 200:** Danh sách giao dịch khớp, danh sách giao dịch lệch (nếu có).

#### `POST /api/v1/admin/payouts/:id/approve`
Phê duyệt chuyển khoản quyết toán doanh thu cho Ban tổ chức.
- **Response 200:** Lệnh chi trả chuyển trạng thái `PAID_OUT`.
