import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validatePullRequest } from '../scripts/pr-gate-check.mjs';

const VALID_PR_BODY = `
## 1. Loai thay doi (PR Type)
- [x] \`feat\`: Tinh nang moi
- [ ] \`fix\`: Sua loi he thong

## 2. Kiem tra ky thuat truoc khi gui (Pre-flight Checks)
- [x] Da chay \`pnpm typecheck\` va khong co loi TypeScript
- [x] Da chay \`pnpm lint\` va khong co loi vi pham quy tac lint
- [x] Da chay \`pnpm format:check\` va ma nguon da duoc dinh dang nhat quan
- [x] Da chay \`pnpm test\` va tat ca cac bai kiem thu deu vuot qua (PASS)

## 3. Cam ket chat luong ma nguon (Code Quality Guarantees)
- [x] Khong chua ma gia lap o client (khong dung localStorage hoac mock de thay the API backend)
- [x] Khong su dung kieu \`any\` (dung schema Zod hoac kieu \`unknown\` co kiem tra kieu)
- [x] Tuan thu token mau tai \`docs/DESIGN_TOKENS.md\` (khong dung ma hex tho khong khai bao)
- [x] Khong chua bieu tuong cam xuc (emoji) trong commit message va noi dung trao doi
- [x] Khong chua ky tu gach ngang dai (em-dash) trong commit message va noi dung

## 4. Danh sach ca kiem thu (Test Cases)
- Ca kiem thu 1: Kiem tra gate thanh cong
`;

describe('validatePullRequest', () => {
  it('passes when PR body and commits are completely valid', () => {
    const result = validatePullRequest({
      title: 'feat(api): them tinh nang phan quyen',
      body: VALID_PR_BODY,
      commits: [
        { message: 'feat(api): them middleware phan quyen' },
        { message: 'test(api): bo sung unit test cho auth guard' },
      ],
    });

    assert.equal(result.valid, true);
    assert.deepEqual(result.errors, []);
    assert.ok(result.labelsToRemove.includes('needs-checklist'));
    assert.ok(result.labelsToRemove.includes('invalid-commit'));
    assert.equal(result.labelsToAdd.length, 0);
  });

  it('fails when required checklist items are unchecked', () => {
    const invalidBody = VALID_PR_BODY.replace(
      '- [x] Da chay `pnpm typecheck`',
      '- [ ] Da chay `pnpm typecheck`'
    );

    const result = validatePullRequest({
      title: 'feat(api): them tinh nang phan quyen',
      body: invalidBody,
      commits: [{ message: 'feat(api): them middleware phan quyen' }],
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.some((err) => err.includes('pnpm typecheck')));
    assert.ok(result.labelsToAdd.includes('needs-checklist'));
  });

  it('fails when no PR type is selected', () => {
    const invalidBody = VALID_PR_BODY.replace(
      '- [x] `feat`: Tinh nang moi',
      '- [ ] `feat`: Tinh nang moi'
    );

    const result = validatePullRequest({
      title: 'feat(api): them tinh nang phan quyen',
      body: invalidBody,
      commits: [{ message: 'feat(api): them middleware phan quyen' }],
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.some((err) => err.includes('Loai thay doi')));
    assert.ok(result.labelsToAdd.includes('needs-checklist'));
  });

  it('fails when commit message contains emoji', () => {
    const result = validatePullRequest({
      title: 'feat(api): them tinh nang',
      body: VALID_PR_BODY,
      commits: [
        { message: 'feat(api): them tinh nang \u{1F389}' },
      ],
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.some((err) => err.includes('emoji')));
    assert.ok(result.labelsToAdd.includes('invalid-commit'));
  });

  it('fails when commit message contains em-dash', () => {
    const result = validatePullRequest({
      title: 'feat(api): them tinh nang',
      body: VALID_PR_BODY,
      commits: [
        { message: 'feat(api): them tinh nang \u2014 bo sung role guard' },
      ],
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.some((err) => err.includes('em-dash')));
    assert.ok(result.labelsToAdd.includes('invalid-commit'));
  });

  it('fails when PR title does not follow conventional commit format', () => {
    const result = validatePullRequest({
      title: 'Update code and fix bugs',
      body: VALID_PR_BODY,
      commits: [{ message: 'feat(api): them tinh nang' }],
    });

    assert.equal(result.valid, false);
    assert.ok(result.errors.some((err) => err.includes('Tieu de PR khong dung quy chuan')));
    assert.ok(result.labelsToAdd.includes('invalid-commit'));
  });

  it('handles empty body gracefully and marks as invalid checklist', () => {
    const result = validatePullRequest({
      title: 'feat(api): them tinh nang',
      body: '',
      commits: [{ message: 'feat(api): them tinh nang' }],
    });

    assert.equal(result.valid, false);
    assert.ok(result.labelsToAdd.includes('needs-checklist'));
  });
});
