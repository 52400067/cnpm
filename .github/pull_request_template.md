## 1. Loai thay doi (PR Type)

Danh dau vao loai thay doi tuong ung:

- [ ] `feat`: Tinh nang moi
- [ ] `fix`: Sua loi he thong
- [ ] `docs`: Cap nhat tai lieu
- [ ] `refactor`: Tai cau truc ma nguon (khong thay doi hanh vi)
- [ ] `chore`: Cau hinh cong cu, nang cap thu vien, tac vu bao tri

## 2. Kiem tra ky thuat truoc khi gui (Pre-flight Checks)

Bat buoc thuc thi va tich chon toan bo cac buoc sau tai moi truong cuc bo:

- [ ] Da chay `pnpm typecheck` va khong co loi TypeScript
- [ ] Da chay `pnpm lint` va khong co loi vi pham quy tac lint
- [ ] Da chay `pnpm format:check` va ma nguon da duoc dinh dang nhat quan
- [ ] Da chay `pnpm test` va tat ca cac bai kiem thu deu vuot qua (PASS)

## 3. Cam ket chat luong ma nguon (Code Quality Guarantees)

Bat buoc xac nhan toan bo cac cam ket duoi day:

- [ ] Khong chua ma gia lap o client (khong dung localStorage hoac mock de thay the API backend)
- [ ] Khong su dung kieu `any` (dung schema Zod hoac kieu `unknown` co kiem tra kieu)
- [ ] Tuan thu token mau tai `docs/DESIGN_TOKENS.md` (khong dung ma hex tho khong khai bao)
- [ ] Khong chua bieu tuong cam xuc (emoji) trong commit message va noi dung trao doi
- [ ] Khong chua ky tu gach ngang dai (em-dash) trong commit message va noi dung

## 4. Danh sach ca kiem thu (Test Cases)

Mieu ta cac ca kiem thu da thuc hien de chung minh tinh dung dan cua thay doi:

- Ca kiem thu 1: [Mo ta ca kiem thu va ket qua]
- Ca kiem thu 2: [Mo ta ca kiem thu va ket qua]

## 5. Ghi chu bo sung (Additional Notes)

[Neu co bat ky luu y kien truc nao, hay ghi tai day]
