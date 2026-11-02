# Bao cao Danh gia Pull Request (Danh cho Project Manager)

- **Pull Request:** #12 - feat(web): so do khu vuc tuong tac va proxy giu cho (UC04)
- **Tac gia:** @tranphuan68686868-lab
- **Nhanh:** `feat/w03-fe2-seatmap-interactive` vao `unstable`
- **Commit SHA duoc kiem tra:** `9f2b8a1c3e4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a`
- **Boi canh nghiep vu:** Use Case UC04 (Chon ghe va Giu cho tuong tac thoi gian thuc) tai docs/system-design/03-use-cases.md
- **Phan quyet (Verdict):** REQUEST_CHANGES

---

## 1. Tong quan boi canh va Phan quyet (Summary & Verdict)
Pull Request nay thuc hien giao dien so do khu vuc va ghe ngoi tuong tac (UC04) kem theo proxy Next.js Route Handler de chuyen tiep yeu cau giu cho va giai phong cho ve backend Fastify. Contributor da hoan thanh bo khung giao dien chinh va phan lon luong tuong tac giu ghe. Tuy nhien, PR chua the hop nhat vi co 2 loi nghiem trong can khac phuc: proxy chua kiem tra quyen truy cap bearer token truoc khi goi backend (loi Major ve bao mat) va thanh phan MiniMap van con chua ma gia lap toa do chua dong bo voi layout thuc te cua so do SVG.

---

## 2. Diem manh da duoc xac minh (Factual Strengths)
- **Kien truc giao dien:** Component SeatMap duoc tach nho hop ly, su dung SVG tuong tac thay vi canvas thuan, giup ho tro tot kha nang truy cap (accessibility) va tuong thich responsive.
- **Tuan thu Design Tokens:** Toan bo cac lop trang thai ghe (trong, dang giu, da ban, dang chon) su dung dung bien CSS tu docs/DESIGN_TOKENS.md (bg-primary, bg-muted, text-foreground), khong phat hien ma mau hex tuy tien.
- **Kiem thu giao dien:** Da bo sung bo unit test danh cho helper tinh toan ma tran toa do va logic chuyen doi trang thai ghe tai apps/web/test/seatmap.test.ts, tat ca 12 tests deu chay thanh cong.

---

## 3. Danh sach vi pham theo muc do nghiem trong (Severity Breakdown)

### Muc do: Blocker (Loi chan hop nhat bat buoc phai sua)
Khong phat hien loi o muc do Blocker (Khong co vi pham can thiep ha tang, khong co loi race condition ban trung ghe tai tang backend).

### Muc do: Major (Loi nghiep vu hoac kien truc lon)

- **Vi pham M1: Proxy route handler bo qua xac thuc phien dang nhap truoc khi giu cho**
  - **Vi tri:** `apps/web/src/app/api/v1/booking/hold/route.ts:24` - [Lien ket GitHub](https://github.com/newtab64/tickethub/blob/9f2b8a1c3e4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a/apps/web/src/app/api/v1/booking/hold/route.ts#L24)
  - **Hien trang ma nguon:** Route Handler lay payload tu request body va gui thang toi backend Fastify ma khong kiem tra Authorization header hoac session cookie cua nguoi dung hien tai.
  - **Hanh vi ky vong:** Theo docs/API_CONTRACT.md, endpoint POST /api/v1/booking/hold yeu cau quyen BUYER hop le. Proxy phai kiem tra phien nguoi dung hoac chuyen tiep nguyen ven Bearer token tu cookie phien sang backend.
  - **Tac dong rui ro van hanh (Production Impact):** Cho phep bat ky client chua xac thuc nao cung co the kich hoat giu cho hang loat, gay can kiet kho ve va tu choi dich vu (Denial of Inventory).

- **Vi pham M2: Thanh phan MiniMap dung toa do hardcoded thay vi tinh tu ViewBox SVG**
  - **Vi tri:** `apps/web/src/components/events/seat-map.tsx:185` - [Lien ket GitHub](https://github.com/newtab64/tickethub/blob/9f2b8a1c3e4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a/apps/web/src/components/events/seat-map.tsx#L185)
  - **Hien trang ma nguon:** MiniMap tinh toan vi tri khung nhin bang cach nhan ty le voi hang so co dinh (width: 800, height: 600) thay vi doc gia tri viewBox dong cua ban do hien tai.
  - **Hanh vi ky vong:** MiniMap phai dong bo ty le theo thuoc tinh viewBox thuc te cua so do duoc nap tu backend de ho tro cac dia diem co ty le kich thuoc khac nhau.
  - **Tac dong rui ro van hanh:** Khi mo cac su kien tai dia diem hinh chu nhat dai hoac hinh tron, khung nhin MiniMap bi lech hoan toan khoi vi tri nguoi dung dang thao tac.

### Muc do: Minor (Loi chat luong can don dep)
- **Loi N1:** Su dung `console.log` debug tai `apps/web/src/components/events/seat-map.tsx:92` can duoc go bo truoc khi vao production.
- **Loi N2:** Bien `tempSelectedSeat` khai bao nhung khong su dung tai `apps/web/src/components/events/seat-map.tsx:41`.

### Muc do: Nit (Gop y nho)
- **Gop y 1:** Can them ghi chu JSDoc giai thich cong thuc chuyen doi ty le zoom tai `seat-map.utils.ts:15`.

---

## 4. Kiem tra Minh chung Truc quan va Ha tang Kiem soat
- **Bao ve ha tang kiem soat (Anti-Tampering Guard):** AN TOAN
  - Khong co tep nao thuoc .github/workflows/**, scripts/pr-gate-* hoac tests/pr-gate-* bi sua doi trong PR nay.
- **Minh chung truc quan giao dien (Visual Evidence):** DAT
  - PR co sua doi giao dien nguoi dung tai `apps/web/src/components/events/seat-map.tsx`.
  - Tac gia da dinh kem video Loom minh hoa tuong tac chon ghe va phong to thu nho ban do tai Muc 6 cua mo ta PR. Lien ket video hoat dong tot va khop voi ma nguon duoc de trinh.

---

## 5. Dinh huong ky thuat cho Contributor (Technical Directives)
- [ ] **Yeu cau 1 (Xac thuc proxy):** Trich xuat access token tu phien nguoi dung (Session Context hoac cookie auth) trong Next.js Route Handler truoc khi goi sang backend. Neu khong co token, tra ve HTTP 401 Unauthorized ngay lap tuc.
- [ ] **Yeu cau 2 (MiniMap dong):** Su dung hook lay kich thuoc khung nhin SVG (`getBoundingClientRect` hoac doc viewBox goc) de tinh toan ma tran thu phong thay vi dung hang so co dinh 800x600.
- [ ] **Tieu chi nghiem thu:**
  - Goi POST /api/v1/booking/hold khong kem cookie phien phai nhan ma loi 401.
  - MiniMap hien thi dung vi tri khi thay doi zoom level tren cac man hinh co ty le khung hinh khac nhau.
  - Go bo console.log va bien thua.

---

## 6. Cac diem chua the kiem chung (Could Not Verify / Honest Limitations)
- Chua the kiem chung hieu nang giat lag cua thao tac keo re (drag/pan) tren cac thiet bi di dong Android phan khuc thap co GPU yeu do moi chi thu nghiem tren trinh duyet desktop va mobile emulator.
