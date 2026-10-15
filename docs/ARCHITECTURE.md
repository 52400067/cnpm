# Kiến trúc hệ thống

Tài liệu này mô tả kiến trúc tổng thể, mô hình phân chia module trong monorepo và các luồng xử lý đồng thời của hệ thống TicketHub.

## Kiến trúc tổng thể

Hệ thống được thiết kế theo mô hình monorepo, chia tách ứng dụng web và API backend, sử dụng PostgreSQL làm nơi lưu trữ trạng thái giao dịch và Redis làm lớp đệm trung gian.

```mermaid
graph TD
    subgraph Clients["Tầng Client"]
        BuyerBrowser["Trình duyệt Người mua\n(Next.js App Router)"]
        OrganizerDashboard["Bảng điều khiển BTC & Admin\n(Next.js App Router)"]
        GateStaffPWA["Ứng dụng Soát vé\n(Next.js PWA)"]
    end

    subgraph EdgeLayer["Tầng Biên"]
        Cloudflare["Cloudflare CDN / WAF / Turnstile CAPTCHA\n(Chặn bot và cân bằng tải)"]
    end

    subgraph AppLayer["Tầng Ứng dụng"]
        WebApp["Web App Frontend\n(Next.js / React 19)"]
        API["Backend API Service\n(NestJS + Fastify)"]
        Worker["Background Job Worker\n(BullMQ)"]
    end

    subgraph DataLayer["Tầng Dữ liệu"]
        Postgres[(PostgreSQL 16/17\nLưu trữ giao dịch, khóa hàng)]
        Redis[(Redis\nCache, Hàng chờ, Pub/Sub, BullMQ)]
        Storage[(Cloudflare R2 / AWS S3\nLưu trữ ảnh và tệp)]
    end

    subgraph ExternalServices["Dịch vụ bên thứ ba"]
        VNPay["Cổng thanh toán VNPay"]
        EmailService["Dịch vụ Email (Resend / SES)"]
        SMSService["Dịch vụ SMS"]
    end

    BuyerBrowser --> Cloudflare
    OrganizerDashboard --> Cloudflare
    GateStaffPWA --> Cloudflare

    Cloudflare --> WebApp
    Cloudflare --> API

    WebApp -.->|"SSR"| API
    BuyerBrowser -->|"REST API & SSE"| API
    OrganizerDashboard -->|"REST API"| API
    GateStaffPWA -->|"Soát vé API"| API

    API --> Postgres
    API --> Redis
    API --> Storage
    API --> VNPay

    Worker --> Redis
    Worker --> Postgres
    Worker --> EmailService
    Worker --> SMSService

    VNPay -->|"Webhook IPN"| API
```

## Cấu trúc thư mục

Kho mã nguồn sử dụng pnpm workspaces để quản lý các gói:

- `apps/web`: Ứng dụng giao diện người dùng xây dựng bằng Next.js App Router, bao gồm trang công khai, trang mua vé, bảng điều khiển ban tổ chức, bảng điều khiển quản trị viên và ứng dụng PWA soát vé.
- `apps/api`: Dịch vụ backend xây dựng bằng NestJS trên nền tảng Fastify. Các module nghiệp vụ được tách biệt (auth, events, seats, booking, waiting-room, payment, ticket, checkin, refund, reporting, admin, notification).
- `packages/shared`: Thư viện dùng chung chứa định nghĩa kiểu dữ liệu TypeScript, schema xác thực Zod và hằng số hệ thống.

## Các luồng xử lý chính

### Giữ chỗ và điều tiết hàng chờ

Khi sự kiện mở bán lượng vé lớn, hàng chờ ảo được kích hoạt để giới hạn số lượng phiên chọn ghế đồng thời không vượt quá ngưỡng `MAX_ACTIVE`.

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Người mua
    participant Web as Web Client
    participant Redis as Redis
    participant API as API Server
    participant DB as PostgreSQL
    participant Worker as BullMQ Worker

    alt Sự kiện bật Hàng chờ ảo
        Buyer->>Web: Nhấn Mua vé
        Web->>API: POST /waiting-room/:eventId/join
        API->>Redis: ZADD event_queue (score = timestamp)
        API-->>Web: Trả vị trí trong hàng và thời gian chờ dự kiến
        loop Heartbeat 15 giây/lần
            Web->>API: POST /waiting-room/:eventId/heartbeat
            API->>Redis: Cập nhật thời điểm kết nối
        end
        Note over API,Redis: Job quét cấp admission token cho đầu hàng khi có slot trống
        API->>Web: SSE báo đến lượt kèm Admission Token (hiệu lực 10 phút)
    end

    Buyer->>Web: Chọn ghế và gửi yêu cầu giữ chỗ
    Web->>API: POST /booking/hold (kèm Idempotency-Key và admission token)
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT id FROM seats WHERE id = ANY($1) ORDER BY id ASC FOR UPDATE
    API->>DB: UPDATE seats SET status = 'HELD', hold_expires_at = now() + 5 phút WHERE id = ANY($1) AND (status='AVAILABLE' OR (status='HELD' AND hold_expires_at < now())) RETURNING id

    alt Số dòng cập nhật nhỏ hơn số ghế yêu cầu
        API->>DB: ROLLBACK
        API-->>Web: Báo lỗi SEAT_ALREADY_HELD
    else Cập nhật đủ số ghế
        API->>DB: INSERT INTO orders (status = 'PENDING', expires_at = now() + 5 phút)
        API->>DB: COMMIT
        API->>Redis: PUBLISH trạng thái ghế chuyển HELD
        Redis-->>Web: SSE cập nhật sơ đồ ghế tới các client khác
        API-->>Web: Trả mã đơn hàng và bắt đầu đếm ngược 5 phút
    end

    opt Quá hạn 5 phút chưa thanh toán
        Worker->>DB: Quét đơn PENDING hết hạn
        Worker->>DB: Chuyển đơn sang EXPIRED, hoàn ghế về AVAILABLE
        Worker->>Redis: PUBLISH trạng thái ghế chuyển AVAILABLE
    end
```

### Thanh toán qua VNPay và xử lý webhook

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Người mua
    participant Web as Web Client
    participant API as API Server
    participant DB as PostgreSQL
    participant VNPay as Cổng VNPay
    participant Worker as BullMQ Worker

    Buyer->>Web: Chọn thanh toán qua VNPay
    Web->>API: POST /checkout/create-payment
    API->>DB: Kiểm tra đơn PENDING và tính tổng tiền phía server
    API->>API: Tạo URL thanh toán kèm chữ ký HMAC SHA512
    API-->>Web: Trả về URL thanh toán
    Web->>VNPay: Chuyển hướng người dùng sang VNPay
    Buyer->>VNPay: Hoàn tất thao tác thanh toán

    VNPay->>API: Gửi IPN webhook (GET /webhooks/vnpay/ipn)
    Note over API: Xác thực chữ ký HMAC và kiểm tra bản ghi giao dịch

    alt Chữ ký hợp lệ và giao dịch chưa được xử lý
        API->>DB: BEGIN TRANSACTION
        API->>DB: Cập nhật đơn PAID, ghế SOLD, tạo bản ghi tickets
        API->>DB: Ghi bản ghi outbox TICKET_ISSUED
        API->>DB: COMMIT
        API-->>VNPay: Trả {"RspCode":"00","Message":"Confirm Success"}

        Worker->>DB: Đọc bản ghi outbox
        Worker->>Worker: Gửi email vé qua Resend/SES
    else Giao dịch đã xử lý trước đó
        API-->>VNPay: Trả {"RspCode":"00","Message":"Confirm Success"}
    else Chữ ký không hợp lệ
        API-->>VNPay: Trả {"RspCode":"97","Message":"Invalid Signature"}
    end

    VNPay->>Web: Chuyển hướng người dùng về màn hình kết quả
```

### Ký số mã QR động và kiểm soát soát vé

Mã QR hiển thị trên ứng dụng là một token JWS có thời hạn ngắn (30 giây) để giảm nguy cơ chia sẻ ảnh chụp màn hình.

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Người mua
    participant AppBuyer as Màn hình Vé của tôi
    participant API as API Server
    actor Staff as Nhân viên soát vé
    participant GateApp as Ứng dụng Soát vé
    participant DB as PostgreSQL

    Buyer->>AppBuyer: Mở chi tiết vé trong khung giờ check-in
    AppBuyer->>API: GET /tickets/:id/dynamic-qr
    API->>API: Tạo token JWS ký bằng khóa riêng Ed25519 (exp = iat + 30s, jti)
    API-->>AppBuyer: Trả qrToken
    AppBuyer->>AppBuyer: Hiển thị mã QR và tự xin token mới sau mỗi 25-30 giây

    Staff->>GateApp: Quét mã QR bằng camera
    GateApp->>API: POST /checkin/scan (qrToken, gateId)
    API->>API: Xác thực chữ ký bằng khóa công khai Ed25519, kiểm tra hạn và jti
    API->>DB: UPDATE tickets SET status = 'CHECKED_IN', checked_in_at = now(), gate_id = $gateId WHERE id = $ticketId AND status = 'SOLD' RETURNING id

    alt Trả về 1 dòng
        API-->>GateApp: Xác nhận hợp lệ (màn hình xanh)
    else Trả về 0 dòng
        API-->>GateApp: Báo vé không hợp lệ hoặc đã sử dụng (màn hình đỏ)
    end
```

## Các biện pháp an toàn và giới hạn

### Giới hạn gian lận vé

- Cơ chế QR động giới hạn hiệu lực trong 30 giây giúp giảm thiểu việc chia sẻ ảnh chụp màn hình, nhưng không ngăn được việc người dùng đưa trực tiếp thiết bị của họ cho người khác vào cổng.
- Nhân viên soát vé vẫn duy trì quy trình kiểm tra đối chiếu giấy tờ tùy thân khi phát hiện dấu hiệu nghi vấn.

### Dừng khẩn cấp (Kill Switch)

- Khi phát hiện sự kiện vi phạm hoặc có khiếu nại nghiêm trọng, quản trị viên có thể chuyển trạng thái sự kiện sang `SUSPENDED`.
- Hệ thống sẽ chặn các yêu cầu đặt chỗ, thanh toán mới, hủy các đơn đang giữ chỗ và thông báo cho người dùng đang chờ trong hàng.

### Kiểm soát lưu lượng và bảo vệ ứng dụng

- Cloudflare áp dụng tường lửa ứng dụng (WAF) và Turnstile CAPTCHA để hạn chế lưu lượng truy cập từ bot tự động.
- API áp dụng rate limiting theo địa chỉ IP và tài khoản người dùng trên các endpoint nhạy cảm như đăng nhập, giữ chỗ và tạo thanh toán.
