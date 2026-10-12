# Kiến Trúc Hệ Thống (System Architecture)
**Dự án:** Nền tảng bán vé sự kiện trực tuyến (TicketHub)  
**Tiêu chuẩn:** Microservices-Ready Modular Monorepo · High-Throughput Concurrency · Zero Double-Booking  

---

## 1. Kiến Trúc Tổng Thể (System Architecture Diagram)

Hệ thống được tổ chức theo mô hình **pnpm Monorepo** hiện đại, kết hợp sức mạnh render SEO của Next.js App Router phía Frontend và hiệu năng xử lý cao của NestJS trên nền tảng Fastify phía Backend.

```mermaid
graph TD
    subgraph Clients["Tầng Client & Người Dùng"]
        BuyerBrowser["Trình duyệt Người mua\n(Next.js App Router - Web)"]
        OrganizerDashboard["Bảng điều khiển BTC & Admin\n(Next.js App Router)"]
        GateStaffPWA["Ứng dụng Soát vé\n(Next.js PWA + Camera Scanner)"]
    end

    subgraph EdgeLayer["Tầng Biên (Edge & CDN)"]
        Cloudflare["Cloudflare CDN / WAF / Turnstile CAPTCHA\n(Chống DDoS, Bot & Chặn IP xấu)"]
    end

    subgraph AppLayer["Tầng Ứng Dụng (Application Layer)"]
        WebApp["Web App Frontend Service\n(Next.js 15 / React 19 / TanStack Query)"]
        API["Backend API Core Service\n(NestJS + Fastify / Drizzle ORM)"]
        Worker["Background Job Worker\n(BullMQ / Cùng Codebase API)"]
    end

    subgraph DataLayer["Tầng Dữ Liệu & Hạ Tầng (Infrastructure)"]
        Postgres[(PostgreSQL 16/17\nNguồn Sự Thật Duy Nhất\nKhóa hàng Row-level Lock)]
        Redis[(Redis Cluster / Standalone\nCache 60s, Hàng chờ Sorted Set,\nPub/Sub & BullMQ)]
        Storage[(Cloudflare R2 / AWS S3\nẢnh sự kiện, GPKD, file xuất)]
    end

    subgraph ExternalServices["Dịch Vụ Bên Ngoài (Third-Party Integrations)"]
        VNPay["Cổng Thanh Toán VNPay\n(URL Thanh toán, IPN Callback, QueryDR, Hoàn tiền)"]
        EmailService["Nhà Cung Cấp Email\n(Resend / Amazon SES)"]
        SMSService["Cổng SMS OTP Trong Nước\n(eSMS / SpeedSMS)"]
    end

    BuyerBrowser --> Cloudflare
    OrganizerDashboard --> Cloudflare
    GateStaffPWA --> Cloudflare

    Cloudflare --> WebApp
    Cloudflare --> API

    WebApp -.->|"Server-Side Rendering (SSR)"| API
    BuyerBrowser -->|"REST API & SSE Stream"| API
    OrganizerDashboard -->|"REST API"| API
    GateStaffPWA -->|"Quét QR / Check-in API"| API

    API -->|"Transaction, Khóa hàng, Audit Log"| Postgres
    API -->|"Sorted Set Queue, Cache, Pub/Sub"| Redis
    API -->|"Upload Presigned URL"| Storage
    API -->|"Tạo URL thanh toán, Refund"| VNPay

    Worker -->|"Đọc hàng đợi BullMQ & Outbox"| Redis
    Worker -->|"Cập nhật đơn EXPIRED, hoàn ghế"| Postgres
    Worker -->|"Gửi email vé, thông báo"| EmailService
    Worker -->|"Gửi OTP đăng nhập Admin"| SMSService

    VNPay -->|"Webhook IPN Chữ Ký HMAC"| API
```

---

## 2. Cấu Trúc Monorepo (Repository Layout)

```
ticket-hub/
├── apps/
│   ├── web/                          # Next.js App Router (Client, BTC, Admin, PWA)
│   │   ├── app/                      # App router layout & route groups
│   │   │   ├── (public)/             # Trang chủ, tìm kiếm sự kiện, chi tiết sự kiện
│   │   │   ├── (buyer)/              # Chọn ghế, checkout, Vé của tôi
│   │   │   ├── (organizer)/          # Dashboard BTC, tạo sự kiện, báo cáo
│   │   │   ├── (admin)/              # Dashboard Admin, duyệt sự kiện, đối soát
│   │   │   └── (gate)/               # Ứng dụng PWA quét vé tại cổng
│   │   ├── components/               # UI components (shadcn/ui, SeatMap SVG)
│   │   └── hooks/                    # Custom hooks (SSE, camera scanner, countdown)
│   │
│   └── api/                          # NestJS trên nền tảng Fastify
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/             # JWT, argon2id, RBAC, Rate-limit
│       │   │   ├── events/           # Quản lý sự kiện, danh mục, upload ảnh
│       │   │   ├── seats/            # Sinh sơ đồ ghế, quản lý ghế
│       │   │   ├── booking/          # Khóa hàng SELECT FOR UPDATE, giữ chỗ 5p
│       │   │   ├── waiting-room/     # Hàng chờ ảo Redis Sorted Set, admission token
│       │   │   ├── payment/          # Adapter VNPay, IPN handler, querydr
│       │   │   ├── ticket/           # Ký số QR Ed25519, phát hành vé
│       │   │   ├── checkin/          # Soát vé nguyên tử, tra cứu thủ công
│       │   │   ├── refund/           # Chính sách hoàn vé, gọi refund VNPay
│       │   │   ├── reporting/        # Materialized views, xuất Excel/CSV
│       │   │   ├── admin/            # Phê duyệt, Kill Switch, đối soát chi trả
│       │   │   └── notification/     # Worker BullMQ, outbox email/SMS
│       │   └── main.ts               # Fastify bootstrap & global guards
│
├── packages/
│   └── shared/                       # Thư viện dùng chung cả Client và Server
│       ├── src/
│       │   ├── schemas/              # Zod schemas (Auth, Booking, Event, Payment)
│       │   ├── types/                # TypeScript types & DTOs
│       │   └── constants/            # Error codes, Enums, Timeouts
│
├── docker-compose.yml                # Chạy PostgreSQL 16 và Redis cho local dev
├── pnpm-workspace.yaml               # Cấu hình workspace
└── tsconfig.base.json                # TypeScript strict config dùng chung
```

---

## 3. Các Luồng Nghiệp Vụ Trọng Yếu (Critical Sequence Diagrams)

### 3.1 Luồng Giữ Chỗ Ghế & Hàng Chờ Ảo (UC03 & UC04)

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Người mua
    participant Web as Web Client (Next.js)
    participant Redis as Redis
    participant API as API Server (Fastify)
    participant DB as PostgreSQL
    participant Worker as BullMQ Worker

    alt Sự kiện bật Hàng chờ ảo (UC03)
        Buyer->>Web: Bấm "Mua Vé"
        Web->>API: POST /waiting-room/:eventId/join
        API->>Redis: ZADD event_queue (score = timestamp)
        API-->>Web: Trả trạng thái QUEUED & Số thứ tự (VD: 142)
        loop Mỗi 15s gửi Heartbeat
            Web->>API: POST /waiting-room/:eventId/heartbeat
            API->>Redis: Cập nhật TTL heartbeat
        end
        Note over API,Redis: Worker chạy mỗi 5s tính slot trống < MAX_ACTIVE
        API->>Web: Phát thông báo SSE "Đến lượt bạn" kèm Admission Token (hạn 10p)
    end

    Buyer->>Web: Chọn ghế trên sơ đồ SVG & bấm "Giữ chỗ"
    Web->>API: POST /booking/hold (kèm admission token & Idempotency-Key)
    API->>DB: BEGIN TRANSACTION
    API->>DB: SELECT id FROM seats WHERE id = ANY($1) ORDER BY id ASC FOR UPDATE
    Note over API,DB: Khóa hàng theo thứ tự ID để triệt tiêu Deadlock
    API->>DB: UPDATE seats SET status = 'HELD', hold_expires_at = now() + 5p WHERE id = ANY($1) AND (status='AVAILABLE' OR (status='HELD' AND hold_expires_at < now())) RETURNING id
    
    alt Số ghế trả về < Số ghế yêu cầu
        API->>DB: ROLLBACK
        API-->>Web: Lỗi SEAT_ALREADY_HELD (HTTP 409)
        Web-->>Buyer: Hiển thị ghế vừa bị người khác chọn
    else Giữ ghế thành công
        API->>DB: INSERT INTO orders (status = 'PENDING', expires_at = now() + 5p)
        API->>DB: COMMIT
        API->>Redis: PUBLISH seat_events (seatIds chuyển HELD)
        Redis-->>Web: SSE cập nhật sơ đồ ghế của các người dùng khác
        API-->>Web: Trả orderId & Đồng hồ đếm ngược 5 phút
    end

    opt Nếu quá 5 phút chưa thanh toán
        Worker->>DB: Quét đơn PENDING hết hạn
        Worker->>DB: UPDATE orders SET status = 'EXPIRED'
        Worker->>DB: UPDATE seats SET status = 'AVAILABLE', hold_order_id = NULL
        Worker->>Redis: PUBLISH seat_events (seatIds chuyển AVAILABLE)
    end
```

---

### 3.2 Luồng Thanh Toán VNPay & IPN Xử Lý Idempotent (UC05)

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Người mua
    participant Web as Web Client
    participant API as API Server
    participant DB as PostgreSQL
    participant VNPay as Cổng VNPay Sandbox/Prod
    participant Worker as BullMQ Worker

    Buyer->>Web: Nhập mã giảm giá & chọn phương thức VNPay
    Web->>API: POST /checkout/create-payment (orderId, Idempotency-Key)
    API->>DB: Kiểm tra đơn PENDING & tính lại tổng tiền phía Server
    API->>API: Sinh URL thanh toán có mã băm bảo mật HMAC SHA512
    API-->>Web: Trả về paymentUrl
    Web->>VNPay: Chuyển hướng người mua sang trang thanh toán VNPay
    Buyer->>VNPay: Quét mã QR ngân hàng / Nhập thẻ ATM thành công

    VNPay->>API: Webhook Gọi IPN (GET /webhooks/vnpay/ipn)
    Note over API: 1. Kiểm tra chữ ký HMAC SHA512 với vnp_HashSecret
    Note over API: 2. Kiểm tra Idempotency (giao dịch đã xử lý chưa)
    
    alt Chữ ký hợp lệ & Chưa xử lý
        API->>DB: BEGIN TRANSACTION
        API->>DB: UPDATE orders SET status = 'PAID', paid_at = now() WHERE id = $orderId
        API->>DB: UPDATE seats SET status = 'SOLD' WHERE hold_order_id = $orderId
        API->>DB: INSERT INTO tickets (status = 'SOLD', ticket_code = ...)
        API->>DB: INSERT INTO transactions (status = 'SUCCESS', raw_callback = ...)
        API->>DB: INSERT INTO outbox (event_type = 'TICKET_ISSUED', payload = ...)
        API->>DB: COMMIT
        API-->>VNPay: Trả JSON {"RspCode":"00","Message":"Confirm Success"}
        
        Worker->>DB: Đọc bản ghi outbox
        Worker->>Worker: Gửi Email xác nhận đơn kèm mã vé qua Resend/SES
    else Callback trùng lặp
        API-->>VNPay: Trả ngay {"RspCode":"00","Message":"Confirm Success"}
    else Chữ ký không hợp lệ
        API-->>VNPay: Trả {"RspCode":"97","Message":"Invalid Signature"}
    end

    VNPay->>Web: Chuyển hướng trình duyệt về return URL (/checkout/result)
    Web->>API: Lấy trạng thái đơn hàng
    API-->>Web: Đơn PAID -> Chuyển sang trang "Vé của tôi"
```

---

### 3.3 Luồng Ký Số QR Động & Soát Vé Nguyên Tử Tại Cổng (UC05 & UC08)

```mermaid
sequenceDiagram
    autonumber
    actor Buyer as Người mua (Khán giả)
    participant AppBuyer as Web "Vé của tôi"
    participant API as API Server
    actor Staff as Nhân viên soát vé
    participant GateApp as Ứng dụng Soát vé PWA (Camera)
    participant DB as PostgreSQL

    Buyer->>AppBuyer: Mở vé trong mục "Vé của tôi"
    Note over AppBuyer: Khung giờ: 2 tiếng trước giờ mở cổng đến hết sự kiện
    AppBuyer->>API: GET /tickets/:id/dynamic-qr
    API->>API: Sinh JWS Token ký bằng Ed25519 (iat, exp = iat + 30s, jti)
    API-->>AppBuyer: Trả qrToken & đếm ngược 30 giây
    AppBuyer->>AppBuyer: Dựng mã QR hiển thị trên màn hình điện thoại
    Note over AppBuyer: Tự động xin token mới mỗi 25-30 giây ngầm

    Staff->>GateApp: Đưa camera quét mã QR của khán giả
    GateApp->>API: POST /checkin/scan (qrToken, gateId)
    
    API->>API: 1. Xác thực chữ ký Ed25519 với Public Key
    API->>API: 2. Kiểm tra token chưa hết hạn & jti chưa từng xuất hiện
    
    API->>DB: UPDATE tickets SET status = 'CHECKED_IN', checked_in_at = now(), gate_id = $gateId, checked_in_by = $staffId WHERE id = $ticketId AND status = 'SOLD' RETURNING id, ticket_code, seat_id;

    alt Cập nhật thành công 1 dòng (Thành công)
        API-->>GateApp: Trả VALID (Màn hình XANH, rung, âm thanh báo hợp lệ)
        GateApp-->>Staff: Cho khán giả vào cổng
    else Trả về 0 dòng (Đã check-in trước đó hoặc vé bị hủy)
        API-->>GateApp: Trả INVALID / ALREADY_USED (Màn hình ĐỎ, cảnh báo)
        GateApp-->>Staff: Giữ lại kiểm tra thủ công
    end
```

---

## 4. Kiến Trúc Bảo Mật & Phòng Thủ (Security Architecture)

1. **Bảo Vệ Vé Giả Mạo & Chụp Màn Hình:**
   - Mã QR động sử dụng cơ chế token JWT ký bằng cặp khóa bất đối xứng **Ed25519 (EdDSA)**.
   - Khóa riêng (Private Key) chỉ lưu trữ trong Secret Manager trên server. Thiết bị soát vé chỉ sử dụng Khóa công khai (Public Key) để xác thực.
   - Token chỉ có hiệu lực tối đa 30 giây kèm mã dùng một lần (`jti`). Ảnh chụp màn hình gửi qua tin nhắn sẽ hết hạn trong vài giây.

2. **Cơ Chế Khẩn Cấp (Kill Switch - UC10):**
   - Khi Admin phát hiện sự kiện lừa đảo hoặc có sự cố an ninh nghiêm trọng, kích hoạt lệnh Kill Switch:
     - Trạng thái sự kiện chuyển thành `SUSPENDED`.
     - Lập tức chặn mọi API đặt chỗ, thanh toán và hủy các đơn đang giữ chỗ.
     - Toàn bộ hàng chờ ảo bị giải tán với thông báo chính thức.
     - Tự động chuyển các đơn đã thanh toán sang danh sách hoàn tiền hàng loạt.

3. **Chống Tấn Công Từ Chối Dịch Vụ & Bot:**
   - Cloudflare WAF và Turnstile CAPTCHA chặn bot tự động trước khi request chạm vào backend.
   - Rate limit theo IP và theo User ID trên các endpoint nhạy cảm (`/auth/login`, `/booking/hold`, `/checkout/create-payment`).

4. **Bảo Mật Dữ Liệu Cá Nhân (Nghị định 13/2023/NĐ-CP):**
   - Mọi mật khẩu băm bằng Argon2id với salt duy nhất.
   - Thông tin cá nhân nhạy cảm được mã hóa khi truyền (HTTPS/TLS 1.3) và khi lưu trữ (Encryption at Rest).
   - Quyền truy cập dữ liệu được phân chia chặt chẽ bằng Role-Based Access Control (RBAC).
