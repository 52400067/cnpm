### Phan hoi Danh gia Ma nguon (Code Review Feedback)

Chao ban @tranphuan68686868-lab, cam on ban da dong gop tinh nang So do ghe tuong tac va Proxy giu cho (UC04) cho TicketHub.

Giao dien so do khu vuc va cac tuong tac SVG cua ban duoc to chuc rat tot, tuan thu chat che he thong token mau va co kem video minh chung sinh dong. Tuy nhien, truoc khi PR duoc hop nhat vao nhanh unstable, co 2 diem nghiep vu va bao mat can duoc dieu chinh:

---

#### 1. Tinh trang kiem tra tong quan
- **Kiem tra ky thuat cuc bo:** 12/12 unit tests giao dien da vuot qua (PASS).
- **Minh chung truc quan:** Video Loom minh chung hoat dong tot va khop voi ma nguon.
- **Tuan thu kien truc:** Can bo sung kiem tra phien nguoi dung tai proxy va tinh toan dong cho MiniMap.

---

#### 2. Cac diem can dieu chinh truoc khi hop nhat

##### Diem 1: Kiem tra phien dang nhap truoc khi chuyen tiep yeu cau giu cho
- **Vi tri:** `apps/web/src/app/api/v1/booking/hold/route.ts:24` ([Xem tai day](https://github.com/newtab64/tickethub/blob/9f2b8a1c3e4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a/apps/web/src/app/api/v1/booking/hold/route.ts#L24))
- **Van de can luu y:** Route Handler hien dang chuyen tiep yeu cau truc tiep sang backend ma chua kiem tra xem nguoi dung da dang nhap hay chua. Dieu nay co the bi loi dung de giu cho trai phep ma khong can tai khoan.
- **Yeu cau ky thuat:** Trich xuat session token tu phien nguoi dung (cookie hoac context auth) va dinh kem vao Authorization header khi goi backend. Neu nguoi dung chua dang nhap, phan hoi HTTP 401 Unauthorized ngay tai proxy.
- **Tieu chi nghiem thu:** Gui yeu cau giu cho khi chua co token phai tra ve ma loi 401.

##### Diem 2: Dong bo ty le MiniMap theo ViewBox SVG
- **Vi tri:** `apps/web/src/components/events/seat-map.tsx:185` ([Xem tai day](https://github.com/newtab64/tickethub/blob/9f2b8a1c3e4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a/apps/web/src/components/events/seat-map.tsx#L185))
- **Van de can luu y:** Thanh phan MiniMap dang su dung kich thuoc co dinh 800x600 de tinh ty le, dan den khung nhin bi lech khi su dung cac so do co ty le khac.
- **Yeu cau ky thuat:** Tinh toan ty le thu phong dua tren thuoc tinh viewBox thuc te cua so do SVG thay vi dung hang so co dinh.
- **Tieu chi nghiem thu:** Khung thu phong MiniMap di chuyen khop voi vung nhin tren moi man hinh.

##### Diem 3: Don dep code
- Go bo `console.log` debug tai dong 92 va bien thua `tempSelectedSeat` tai dong 41 trong file `seat-map.tsx`.

---

#### 3. Dinh huong thuc hien
Ban co the doi chieu quy dinh tai:
- Dac ta nghiep vu: `docs/system-design/03-use-cases.md` (Muc UC04)
- Hop dong API: `docs/API_CONTRACT.md` (Muc Booking Endpoints)

Sau khi ban da dieu chinh cac diem tren va cap nhat commit len nhanh, vui long phan hoi tai day de reviewer tien hanh kiem tra lai. Chuc ban hoan thanh thuan loi!
