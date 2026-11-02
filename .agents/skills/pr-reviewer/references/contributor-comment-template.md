### Phan hoi Danh gia Ma nguon (Code Review Feedback)

Chao ban @[AUTHOR], cam on ban da dong gop ma nguon cho du an TicketHub qua Pull Request nay.

Sau khi doi chieu voi dac ta Use Case [USE_CASE_ID], hop dong API va tieu chuan kien truc cua du an, duoi day la tong hop danh gia va cac diem can hoan thien truoc khi hop nhat:

---

#### 1. Tinh trang kiem tra tong quan
- **Kiem tra ky thuat cuc bo (Lint/Typecheck/Test):** [Dat / Con ton tai loi can khac phuc]
- **Minh chung giao dien (Neu co sua UI):** [Da cung cap day du / Can bo sung hinh anh hoac video hoat dong thuc te]
- **Tuan thu kien truc:** [Co mot so diem can dieu chinh de dam bao an toan giao dich va dong bo du lieu]

---

#### 2. Cac diem can dieu chinh truoc khi hop nhat

##### Diem 1: [Tieu de ngan gon]
- **Vi tri:** `[FILE_PATH]:[LINE_NUMBER]` ([Xem tai day](https://github.com/[OWNER]/[REPO]/blob/[HEAD_COMMIT_SHA]/[FILE_PATH]#L[LINE_NUMBER]))
- **Van de can luu y:** [Giai thich ro hanh vi hien tai va rui ro gap phai mot cach ton trong, vi du: nguy co xung dot tranh chap khi nhieu nguoi cung giu mot ghe]
- **Yeu cau ky thuat:** [Dac ta hanh vi mong muon dua tren tai lieu kien truc]
- **Tieu chi nghiem thu:** [Tieu chi cu the de ban tu kiem tra khi hoan thanh]

##### Diem 2: [Tieu de ngan gon]
- **Vi tri:** `[FILE_PATH]:[LINE_NUMBER]` ([Xem tai day](https://github.com/[OWNER]/[REPO]/blob/[HEAD_COMMIT_SHA]/[FILE_PATH]#L[LINE_NUMBER]))
- **Van de can luu y:** [Giai thich van de]
- **Yeu cau ky thuat:** [Dac ta hanh vi]
- **Tieu chi nghiem thu:** [Tieu chi nghiem thu]

---

#### 3. Cac diem nho can don dep va toi uu (Minor & Nit)
- `[FILE_PATH]:[LINE_NUMBER]`: [Mo ta gop y ngan gon, vi du: go bo console.log, bien thua hoac them chu thich]

---

#### 4. Dinh huong thuc hien
Ban co the tham khao them tai lieu kien truc tai:
- Dac ta nghiep vu: `docs/system-design/03-use-cases.md`
- Hop dong API: `docs/API_CONTRACT.md`
- Mo hinh du lieu: `docs/DATA_MODEL.md`

*(Luu y: Theo quy trinh cua du an, reviewer cung cap yeu cau va tieu chi ky thuat chu khong cung cap doan ma thay the hoan chinh, nham tao dieu kien de ban chu dong lam chu giai phap).*

Sau khi ban da dieu chinh xong va cap nhat commit len nhanh, vui long phan hoi tai day de reviewer tien hanh kiem tra lai. Chuc ban hoan thanh tot!
