#!/usr/bin/env bash
# ==============================================================================
# Script: scan-diff.sh
# Mo ta: Quet tinh cac dong ma moi duoc them vao (+) trong diff cua Pull Request
#        nham phat hien cac dau vet vi pham ve ky tu cam, ma gia lap va chat luong.
# ==============================================================================

set -euo pipefail

export LC_ALL=C.UTF-8
export LANG=C.UTF-8

PR_NUMBER="${1:-}"

if [ -z "$PR_NUMBER" ]; then
  echo "Su dung: $0 <PR_NUMBER>"
  echo "Vi du: $0 15"
  exit 1
fi

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

DIFF_FILE="$TMP_DIR/pr-$PR_NUMBER.diff"
ADDED_LINES_FILE="$TMP_DIR/added_lines.txt"
FRONTEND_ADDED_LINES_FILE="$TMP_DIR/frontend_added_lines.txt"

# 1. Lay diff tu GitHub CLI
gh pr diff "$PR_NUMBER" > "$DIFF_FILE"

# 2. Trich xuat cac dong them moi (+), bo qua dong tieu de diff (+++)
grep -E '^\+[^+]' "$DIFF_FILE" > "$ADDED_LINES_FILE" || true

# 3. Trich xuat cac dong them moi rieng cho phan frontend (apps/web)
awk '
  /^diff --git a\/apps\/web/ { in_web = 1; next }
  /^diff --git a\// { in_web = 0; next }
  in_web && /^\+[^+]/ { print }
' "$DIFF_FILE" > "$FRONTEND_ADDED_LINES_FILE" || true

echo "======================================================================"
echo "KET QUA QUET TINH DIFF CHO PULL REQUEST #$PR_NUMBER"
echo "======================================================================"

# Kiem tra 1: Ky tu bieu tuong cam xuc (Emoji)
echo "[1] Quet bieu tuong cam xuc (Emoji):"
EMOJI_HITS=$(perl -CS -ne 'print if /\p{Extended_Pictographic}/' "$ADDED_LINES_FILE" || true)
if [ -n "$EMOJI_HITS" ]; then
  echo "CANH BAO: Phat hien bieu tuong cam xuc trong cac dong them moi:"
  echo "$EMOJI_HITS" | head -n 10
else
  echo "OK: Khong phat hien bieu tuong cam xuc."
fi
echo ""

# Kiem tra 2: Ky tu gach ngang cam (En-dash va Em-dash)
echo "[2] Quet ky tu gach ngang cam (En-dash U+2013, Em-dash U+2014):"
DASH_HITS=$(perl -CS -ne 'print if /[\x{2013}\x{2014}]/' "$ADDED_LINES_FILE" || true)
if [ -n "$DASH_HITS" ]; then
  echo "CANH BAO: Phat hien ky tu gach ngang dai bi cam:"
  echo "$DASH_HITS" | head -n 10
else
  echo "OK: Khong phat hien en-dash hoac em-dash."
fi
echo ""

# Kiem tra 3: Dau vet ma gia lap (Mock / Fake Tokens / Client storage)
echo "[3] Quet dau vet ma gia lap client-side (Can danh gia ngu canh):"
MOCK_HITS=$(grep -En "(localStorage|sessionStorage|mockData|fakeToken|dummyToken)" "$ADDED_LINES_FILE" || true)
if [ -n "$MOCK_HITS" ]; then
  echo "DAU VET: Phat hien tu khoa luu tru client hoac du lieu gia lap:"
  echo "$MOCK_HITS" | head -n 10
  echo "Chu y: Reviewer can xac minh xem day co phai token auth gia lap (Vi pham)"
  echo "hay la luu tru UI state khong nhay cam nhu theme/sidebar (Chap nhan)."
else
  echo "OK: Khong phat hien tu khoa mock hoac client storage."
fi
echo ""

# Kiem tra 4: Ham setTimeout tre lau (Nghi van gia lap do tre mang)
echo "[4] Quet ham setTimeout co do tre lon hon hoac bang 300ms:"
TIMEOUT_HITS=$(grep -En "setTimeout\([^,]+,\s*[3-9][0-9]{2,}\)" "$ADDED_LINES_FILE" || true)
if [ -n "$TIMEOUT_HITS" ]; then
  echo "DAU VET: Phat hien setTimeout voi do tre tu 300ms tro len:"
  echo "$TIMEOUT_HITS" | head -n 10
  echo "Chu y: Reviewer can xac minh: neu dung cho debounce search thi hop le,"
  echo "neu dung de gia lap loading/API call thi la vi pham TRASH_CODE."
else
  echo "OK: Khong phat hien setTimeout dang nghi van."
fi
echo ""

# Kiem tra 5: Kiem tra ep kieu bat can TypeScript (any casting / suppressions)
echo "[5] Quet ep kieu any va bo qua kiem tra TypeScript:"
TYPE_HITS=$(grep -En "(:\s*any\b|as\s+any\b|@ts-ignore|@ts-nocheck)" "$ADDED_LINES_FILE" || true)
if [ -n "$TYPE_HITS" ]; then
  echo "CANH BAO: Phat hien su dung any hoac ts-ignore:"
  echo "$TYPE_HITS" | head -n 10
else
  echo "OK: Khong phat hien ep kieu any hoac bo qua kiem tra kieu."
fi
echo ""

# Kiem tra 6: Ma mau hex tho trong frontend (Design Tokens compliance)
echo "[6] Quet ma mau hex tho tai apps/web (Can doi chieu docs/DESIGN_TOKENS.md):"
HEX_HITS=$(grep -En "#[0-9a-fA-F]{3,8}\b" "$FRONTEND_ADDED_LINES_FILE" || true)
if [ -n "$HEX_HITS" ]; then
  echo "DAU VET: Phat hien ma mau hex trong code frontend:"
  echo "$HEX_HITS" | head -n 10
  echo "Chu y: Neu la ma mau trong SVG icon ben thu ba thi co the chap nhan,"
  echo "neu la mau giao dien phai dung token CSS tu docs/DESIGN_TOKENS.md."
else
  echo "OK: Khong phat hien ma mau hex tho trong frontend."
fi

echo "======================================================================"
echo "HOAN TAT QUET TINH DIFF CHO PR #$PR_NUMBER"
echo "======================================================================"
