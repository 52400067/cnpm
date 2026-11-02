# Bao cao Danh gia Pull Request (Danh cho Project Manager)

- **Pull Request:** #[PR_NUMBER] - [PR_TITLE]
- **Tac gia:** @[AUTHOR]
- **Nhanh:** `[HEAD_BRANCH]` vao `[BASE_BRANCH]`
- **Commit SHA duoc kiem tra:** `[HEAD_COMMIT_SHA]`
- **Boi canh nghiep vu:** [Use Case UC01 den UC12 tai docs/system-design/03-use-cases.md]
- **Phan quyet (Verdict):** [APPROVE | REQUEST_CHANGES | REJECT (SECURITY_VIOLATION) | REJECT (TRASH_CODE)]

---

## 1. Tong quan boi canh va Phan quyet (Summary & Verdict)
[Danh gia 2-3 doan van khach quan ve muc tieu cua PR, phan viec contributor thuc hien, muc do dap ung yeu cau nghiep vu va ly do xac dang dan den phan quyet.]

---

## 2. Diem manh da duoc xac minh (Factual Strengths)
[Ghi nhan trung thuc cac diem thuc hien dung chuan ky thuat va da vuot qua kiem tra thuc te, khong dung loi khen ngoai giao.]
- **Kien truc & Du lieu:** [Vi du: Ap dung dung transaction voi SELECT ... FOR UPDATE hoac dung Zod schema tai packages/shared]
- **Kiem thu:** [Vi du: Bo sung day du ca kiem thu tich hop cho endpoint moi, ty le phu dat chuan]
- **Giao dien & Token:** [Vi du: Component tuan thu dung design tokens, khong chua hardcoded styles]

---

## 3. Danh sach vi pham theo muc do nghiem trong (Severity Breakdown)

### Muc do: Blocker (Loi chan hop nhat bat buoc phai sua)
[Loi gay hong he thong, rui ro bao mat, race condition ban trung ve, can thiep ha tang, mock token, pha vo hop dong API/ERD]

- **Vi pham B1:** [Ten vi pham ngan gon]
  - **Vi tri:** `[FILE_PATH]:[LINE_NUMBER]` - [Lien ket GitHub](https://github.com/[OWNER]/[REPO]/blob/[HEAD_COMMIT_SHA]/[FILE_PATH]#L[LINE_NUMBER])
  - **Hien trang ma nguon:** [Mo ta doan ma hien tai dang lam gi va sai o diem nao]
  - **Hanh vi ky vong:** [Dac ta cach he thong phai xu ly dung theo tai lieu kien truc]
  - **Tac dong rui ro van hanh (Production Impact):** [Hau qua thuc te: race condition, ro ri du lieu, sap dich vu]

### Muc do: Major (Loi nghiep vu hoac kien truc lon)
[Thieu kiem tra quyen so huu, chua validate input day du, thieu test ca loi, UI thieu trang thai responsive hoac loading]

- **Vi pham M1:** [Ten vi pham]
  - **Vi tri:** `[FILE_PATH]:[LINE_NUMBER]` - [Lien ket GitHub](https://github.com/[OWNER]/[REPO]/blob/[HEAD_COMMIT_SHA]/[FILE_PATH]#L[LINE_NUMBER])
  - **Hien trang ma nguon:** [Mo ta]
  - **Hanh vi ky vong:** [Dac ta]
  - **Tac dong rui ro van hanh:** [Hau qua]

### Muc do: Minor (Loi chat luong can don dep)
[Dung kieu any thay vi schema, loi code smell, import khong su dung, console.log du thua, ma mau hex chua anh xa token]

- **Loi N1:** [Mo ta kem vi tri file:line]

### Muc do: Nit (Gop y nho, khong can sua de hop nhat)
[Dat ten bien chua toi uu, comment chua ro nghia]

- **Gop y:** [Mo ta]

---

## 4. Kiem tra Minh chung Truc quan va Ha tang Kiem soat
- **Bao ve ha tang kiem soat (Anti-Tampering Guard):** [AN TOAN | VI PHAM]
  - Chi tiet: [Khong can thiep / Phat hien can thiep vao tep bao ve: .github/workflows/**, scripts/pr-gate-*, tests/pr-gate-*]
- **Minh chung truc quan giao dien (Visual Evidence):** [DAT | KHONG DAT | N/A]
  - Tinh trang tep UI: [PR co sua giao dien tai apps/web/src/** / PR chi sua backend hoac logic khong giao dien]
  - Xac minh media: [Hinh anh/video da xem va xac nhan khop voi thay doi thuc te / Link hong / Thieu minh chung / Khai bao N/A gian lan]

---

## 5. Dinh huong ky thuat cho Contributor (Technical Directives)
[Dua ra chi dan mang tinh nguyen ly, pseudocode, chu ky ham va tieu chi nghiem thu. TUYET DOI KHONG DUA CODE DROP-IN HOAN CHINH]
- [ ] **Chi dan 1:** [Yeu cau ky thuat, dac ta pattern can dung, tham chieu docs/API_CONTRACT.md hoac docs/DATA_MODEL.md]
- [ ] **Chi dan 2:** [Tieu chi nghiem thu cu the de contributor tu kiem chung]

---

## 6. Cac diem chua the kiem chung (Could Not Verify / Honest Limitations)
[Nhung phan ma Reviewer khong the xac minh 100% qua kiem tra cuc bo va can luu y khi dua len staging/production]
- [Vi du: Webhook callback tu cong thanh toan thuc te VNPay trong moi truong sandbox]
- [Vi du: Kha nang chiu tai dong thoi 1000 requests/s vao luong giu cho tren moi truong clustering]
