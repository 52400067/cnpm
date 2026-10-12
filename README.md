# TicketHub (Vé Việt) 🎟️🇻🇳

> **Nền tảng bán và quản lý vé sự kiện trực tuyến chuẩn Production tại Việt Nam.**  
> Giải quyết triệt để các bài toán hóc búa: **Chống bán trùng vé (Zero Double-Booking)** khi mở bán lượng truy cập lớn, **Hàng chờ ảo điều tiết tải**, **Mã QR động Ed25519** chống chụp màn hình gian lận, và tích hợp cổng thanh toán nội địa **VNPay**.

---

## 📌 Mục Lục
1. [Giới Thiệu & Bài Toán Giải Quyết](#-giới-thiệu--bài-toán-giải-quyết)
2. [Ba Cơ Chế Cốt Lõi](#-ba-cơ-chế-cốt-lõi)
3. [Kiến Trúc & Ngăn Xếp Công Nghệ](#-kiến-trúc--ngăn-xếp-công-nghệ)
4. [Tài Liệu Thiết Kế Kỹ Thuật (Docs)](#-tài-liệu-thiết-kế-kỹ-thuật-docs)
5. [Đội Ngũ & Lộ Trình 6 Tuần](#-đội-ngũ--lộ-trình-6-tuần)
6. [Hướng Dẫn Khởi Chạy Môi Trường Local](#-hướng-dẫn-khởi-chạy-môi-trường-local)
7. [Khuyến Nghị Các Bước Triển Khai Tiếp Theo](#-khuyến-nghị-các-bước-triển-khai-tiếp-theo)

---

## 🎯 Giới Thiệu & Bài Toán Giải Quyết

TicketHub được thiết kế để phục vụ các sự kiện ca nhạc, hội thảo, thể thao, triển lãm và hoạt động giải trí tại Việt Nam. Hệ thống kết nối ba nhóm người dùng:
- **Người mua vé (Buyers):** Khám phá sự kiện, chọn ghế trực quan trên sơ đồ SVG tương tác, xếp hàng văn minh, thanh toán qua VNPay và nhận vé QR động trong ứng dụng.
- **Ban tổ chức (Organizers):** Tạo sự kiện, thiết kế sơ đồ khán đài, định giá hạng vé, bật hàng chờ ảo, quản lý nhân viên soát vé và theo dõi báo cáo doanh thu theo thời gian thực.
- **Nhân viên soát vé (Gate Staff):** Sử dụng ứng dụng Web PWA quét mã QR camera tốc độ cao, hỗ trợ kiểm tra nguyên tử tức thời và tra cứu thủ công dự phòng.
- **Quản trị viên (Admins):** Phê duyệt hồ sơ pháp lý BTC và nội dung sự kiện, kích hoạt Kill Switch khẩn cấp và đối soát quyết toán chi trả.

---

## ⚡ Ba Cơ Chế Cốt Lõi

1. **Giữ Chỗ Tạm Thời 5 Phút (PostgreSQL Row-Level Locking):**
   - Nguồn sự thật duy nhất về tồn kho là **PostgreSQL Transaction**.
   - Khóa các hàng ghế theo thứ tự ID tăng dần (`SELECT ... FOR UPDATE ORDER BY id ASC`) để loại trừ nguy cơ Deadlock. Cập nhật trạng thái có điều kiện nguyên tử, bảo đảm tuyệt đối **không bán trùng vé**.
2. **Hàng Chờ Ảo Điều Tiết Tải (Virtual Waiting Room):**
   - Sử dụng **Redis Sorted Set** ghi nhận thứ tự người mua theo thời gian.
   - Khi lượng truy cập đột biến vượt ngưỡng `MAX_ACTIVE`, hệ thống điều tiết xếp hàng theo thứ tự công bằng, cấp `admissionToken` có hạn 10 phút để từng nhóm vào khu vực chọn ghế.
3. **Mã QR Động Ký Số Ed25519 (Dynamic Ticket Token):**
   - Mã QR không chứa mã tĩnh. Mỗi mã là một JWS Token được ký bằng thuật toán bất đối xứng **Ed25519 (EdDSA)**, có hiệu lực 30 giây và tự làm mới ngầm mỗi 25-30 giây.
   - Chống hoàn toàn hành vi chụp màn hình chia sẻ cho nhiều người. Lệnh check-in tại cổng là thao tác nguyên tử `UPDATE tickets SET status='CHECKED_IN' WHERE status='SOLD' RETURNING id` (chỉ đúng 1 người vào cổng thành công).

---

## 🛠️ Kiến Trúc & Ngăn Xếp Công Nghệ

Dự án áp dụng mô hình **pnpm Monorepo**:
```
ticket-hub/
├── apps/
│   ├── web/               # Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui, next-intl
│   └── api/               # NestJS trên nền Fastify, Drizzle ORM, BullMQ Worker
├── packages/
│   └── shared/            # Zod schemas và TypeScript Types dùng chung Client & Server
├── docs/                  # Tài liệu đặc tả kỹ thuật, ERD, API Contract, AI Contract
└── tmp/duty-roster/       # Bảng phân công tiến độ dự án
```

| Hạng mục | Công nghệ lựa chọn | Ghi chú |
| :--- | :--- | :--- |
| **Ngôn ngữ** | TypeScript 5.x (Strict Mode) | Bật `noUncheckedIndexedAccess` và `exactOptionalPropertyTypes` |
| **Frontend Web** | Next.js 15, React 19, TanStack Query | Render SSR/SEO tối ưu Open Graph chia sẻ Facebook, Zalo |
| **Sơ đồ ghế** | SVG tương tác cao | Zoom/pan mượt mà trên mobile, responsive |
| **App Soát vé** | Next.js PWA | Cài đặt màn hình chính, quét QR qua camera điện thoại |
| **Backend API** | NestJS chạy trên Fastify | Hiệu năng I/O cao, Dependency Injection, RBAC Guard |
| **Cơ sở dữ liệu** | PostgreSQL 16/17 | Nguồn sự thật duy nhất; FTS tiếng Việt (`unaccent`, tsvector) |
| **Cache & Queue**| Redis & BullMQ | Cache tồn kho 60s, hàng chờ ảo, transactional outbox worker |
| **Thanh toán** | VNPay Adapter | Tích hợp URL thanh toán, xử lý Webhook IPN chuẩn Idempotency |
| **Bảo mật QR** | `jose` (Thuật toán Ed25519) | Ký số JWT bất đối xứng, private key lưu trong Secret Manager |

---

## 📚 Tài Liệu Thiết Kế Kỹ Thuật (Docs)

Hệ thống tài liệu hoàn chỉnh được lưu trữ trong thư mục `docs/`:

- [**docs/ERD.md**](file:///home/user/Downloads/Repos/ticket-hub/docs/ERD.md): Sơ đồ thực thể - quan hệ Mermaid, đặc tả chi tiết 16 bảng PostgreSQL, ràng buộc DDL, chỉ mục Full-Text Search, thủ tục SQL khóa hàng giữ chỗ và Materialized View báo cáo.
- [**docs/API_CONTRACT.md**](file:///home/user/Downloads/Repos/ticket-hub/docs/API_CONTRACT.md): Hợp đồng API toàn diện cho toàn bộ 11 Use Cases (REST endpoints, Request/Response Zod schemas, mã lỗi chuẩn, headers Idempotency, SSE stream và Webhook IPN VNPay).
- [**docs/AI_CONTRACT.md**](file:///home/user/Downloads/Repos/ticket-hub/docs/AI_CONTRACT.md): Bộ nguyên tắc bất biến dành cho AI Coding Assistant và lập trình viên (nguyên tắc dữ liệu, locking patterns, tiêu chuẩn kiểm thử Testcontainers, tuân thủ Nghị định 13/2023/NĐ-CP).
- [**docs/ARCHITECTURE.md**](file:///home/user/Downloads/Repos/ticket-hub/docs/ARCHITECTURE.md): Sơ đồ kiến trúc tổng thể, sơ đồ tuần tự (Sequence Diagrams) giữ chỗ, thanh toán IPN, check-in nguyên tử và kiến trúc bảo mật.
- [**tmp/duty-roster/bangPhanCong_SE_6tuan.xlsx**](file:///home/user/Downloads/Repos/ticket-hub/tmp/duty-roster/bangPhanCong_SE_6tuan.xlsx): Bảng Excel phân công 30 gói công việc trong **6 tuần** (3 giai đoạn) cho 5 thành viên, công thức chuẩn 0 lỗi.

---

## 👥 Đội Ngũ & Lộ Trình 6 Tuần

### Đội ngũ 5 thành viên:
1. **Quản lý dự án & QA (PM):** Gia Khang – *Kế hoạch tiến độ, Test cases, kiểm thử đồng thời (UC03, UC04, UC08), kiểm thử tải k6, UAT.*
2. **Backend Lead - Core & DB (BE1):** Tuan Anh – *Schema PostgreSQL, giữ chỗ ghế transaction, hàng chờ Redis, check-in nguyên tử, QR Ed25519, Kill Switch.*
3. **Backend Developer - Integration (BE2):** Tuan Khoi – *Tích hợp cổng VNPay (URL, IPN, hoàn tiền, querydr), API tìm kiếm, worker outbox email, đối soát chi trả (UC11).*
4. **Frontend Lead - Web App (FE1):** Vi Kiet – *Next.js App Router, SSR sự kiện, luồng giữ chỗ & checkout, Dashboard BTC & Admin.*
5. **Frontend PWA & UI/UX (FE2):** Phu An – *Design system, sơ đồ ghế SVG, giao diện 'Vé của tôi' QR động, ứng dụng PWA soát vé camera.*

### Lộ trình 3 Giai đoạn (14/10/2026 – 24/11/2026):
```mermaid
gantt
    title Lộ Trình 6 Tuần Dự Án TicketHub
    dateFormat  YYYY-MM-DD
    section GĐ1 · Nền tảng
    Tuần 1 : Monorepo, Schema DB, VNPay Adapter, Next.js Auth, SeatMap SVG : 2026-10-14, 7d
    Tuần 2 : Auth RBAC, API Sự kiện, Admin Duyệt, Dashboard BTC, Nghiệm thu GĐ1 : 2026-10-21, 7d
    section GĐ2 · Bán vé & Hàng chờ
    Tuần 3 : Giữ chỗ PostgreSQL, Hàng chờ ảo, Tìm kiếm FTS, Sơ đồ ghế tương tác : 2026-10-28, 7d
    Tuần 4 : Hoàn tất đơn, IPN VNPay, Luồng Checkout, Hủy vé hoàn tiền, Nghiệm thu GĐ2 : 2026-11-04, 7d
    section GĐ3 · Cổng vào & Phát hành
    Tuần 5 : QR động Ed25519, Check-in nguyên tử, PWA Camera Soát vé, Báo cáo BTC : 2026-11-11, 7d
    Tuần 6 : Tải k6, Đối soát chi trả, Kill Switch, Diễn tập soát vé, Pilot & Go/No-Go : 2026-11-18, 7d
```

---

## 🚀 Hướng Dẫn Khởi Chạy Môi Trường Local

### Yêu cầu tiên quyết:
- **Node.js**: Phiên bản 22 LTS trở lên
- **pnpm**: Phiên bản 9.x trở lên (`npm install -g pnpm`)
- **Docker & Docker Compose**: Để chạy PostgreSQL và Redis nội bộ

### Các bước cài đặt:
```bash
# 1. Clone repository
git clone https://github.com/your-org/ticket-hub.git
cd ticket-hub

# 2. Khởi chạy cơ sở dữ liệu và cache qua Docker Compose
docker compose up -d

# 3. Cài đặt toàn bộ dependencies trong monorepo
pnpm install

# 4. Sao chép và cấu hình biến môi trường
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 5. Chạy migration tạo bảng cơ sở dữ liệu
pnpm --filter @tickethub/api db:migrate
pnpm --filter @tickethub/api db:seed

# 6. Khởi động môi trường phát triển đồng thời
pnpm dev
```
- **Web App:** `http://localhost:3000`
- **Backend API:** `http://localhost:4000`
- **API Health Check:** `http://localhost:4000/health`

---

## 🔮 Khuyến Nghị Các Bước Triển Khai Tiếp Theo (Next Steps)

Theo kế hoạch tuần 1 (W01), các bước tiếp theo cần triển khai ngay:

1. **Khởi tạo Bộ Khung Monorepo (W01-BE1 & W01-FE1):**
   - Tạo file `pnpm-workspace.yaml`, cấu hình `tsconfig.base.json` bật Strict Mode.
   - Khởi tạo `apps/api` với NestJS (Fastify adapter).
   - Khởi tạo `apps/web` với Next.js 15 App Router, Tailwind CSS, shadcn/ui.
   - Khởi tạo `packages/shared` chứa các Zod schemas từ [docs/API_CONTRACT.md](file:///home/user/Downloads/Repos/ticket-hub/docs/API_CONTRACT.md).
2. **Tạo `docker-compose.yml` cho Hạ Tầng Local (W01-BE1):**
   - Thiết lập service PostgreSQL 16 (kèm volume và cấu hình extension `unaccent`, `pgcrypto`).
   - Thiết lập service Redis 7 (dùng cho Cache, Pub/Sub và BullMQ).
3. **Đăng Ký & Kiểm Thử VNPay Sandbox (W01-BE2):**
   - Đăng ký tài khoản thử nghiệm trên VNPay Sandbox, nhận `vnp_TmnCode` và `vnp_HashSecret`.
   - Viết module adapter `vnpay.service.ts` sinh URL thanh toán thử nghiệm.
4. **Thiết Lập Pipeline CI/CD GitHub Actions (W01-BE2):**
   - Tạo workflow `.github/workflows/ci.yml` tự động kiểm tra `pnpm lint`, `pnpm typecheck`, `pnpm test` cho mọi Pull Request.
5. **Dựng Bộ Component UI & Khung Sơ Đồ Ghế SVG (W01-FE2):**
   - Tích hợp shadcn/ui, thiết lập design tokens chuẩn tiếng Việt.
   - Viết prototype component `SeatMap` SVG vẽ sơ đồ ghế có tham số hàng/cột và pan/zoom cảm ứng.
