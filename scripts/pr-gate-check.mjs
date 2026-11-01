#!/usr/bin/env node

/**
 * PR Gate Validation Engine
 * Kiem tra tinh hop le cua PR checklist, tieu de va commit message tren TicketHub repository.
 */

const EMOJI_REGEX = /\p{Extended_Pictographic}/u;
const EM_DASH_REGEX = /[\u2013\u2014]/;
const CONVENTIONAL_COMMIT_REGEX = /^(feat|fix|docs|refactor|test|chore)(\([a-zA-Z0-9_.\-/]+\))?:\s.+/;

const REQUIRED_PREFLIGHT_PATTERNS = [
  { name: 'pnpm typecheck', regex: /-\s*\[([ xX])\]\s*Da chay `pnpm typecheck`/ },
  { name: 'pnpm lint', regex: /-\s*\[([ xX])\]\s*Da chay `pnpm lint`/ },
  { name: 'pnpm format:check', regex: /-\s*\[([ xX])\]\s*Da chay `pnpm format:check`/ },
  { name: 'pnpm test', regex: /-\s*\[([ xX])\]\s*Da chay `pnpm test`/ },
];

const REQUIRED_QUALITY_PATTERNS = [
  { name: 'Khong chua ma gia lap o client', regex: /-\s*\[([ xX])\]\s*Khong chua ma gia lap o client/ },
  { name: 'Khong su dung kieu any', regex: /-\s*\[([ xX])\]\s*Khong su dung kieu `?any`?/ },
  { name: 'Tuan thu token mau tai docs/DESIGN_TOKENS.md', regex: /-\s*\[([ xX])\]\s*Tuan thu token mau/ },
  { name: 'Khong chua bieu tuong cam xuc (emoji)', regex: /-\s*\[([ xX])\]\s*Khong chua bieu tuong cam xuc \(emoji\)/ },
  { name: 'Khong chua ky tu gach ngang dai (em-dash)', regex: /-\s*\[([ xX])\]\s*Khong chua ky tu gach ngang dai \(em-dash\)/ },
];

const PR_TYPE_PATTERN = /-\s*\[([xX])\]\s*`(feat|fix|docs|refactor|chore)`/;

export function validatePullRequest({ title = '', body = '', commits = [] }) {
  const errors = [];
  const labelsToAdd = [];
  const labelsToRemove = [];

  let checklistHasErrors = false;
  let commitHasErrors = false;

  const normalizedBody = body || '';

  // 1. Kiem tra loai PR
  if (!PR_TYPE_PATTERN.test(normalizedBody)) {
    errors.push('Loai thay doi (PR Type) chua duoc chon. Vui long tich it nhat mot loai (feat, fix, docs, refactor, chore).');
    checklistHasErrors = true;
  }

  // 2. Kiem tra Pre-flight checks
  for (const item of REQUIRED_PREFLIGHT_PATTERNS) {
    const match = normalizedBody.match(item.regex);
    if (!match) {
      errors.push(`Muc kiem tra bat buoc bi thieu: "${item.name}".`);
      checklistHasErrors = true;
    } else if (match[1].toLowerCase() !== 'x') {
      errors.push(`Muc kiem tra bat buoc chua duoc tich: "${item.name}".`);
      checklistHasErrors = true;
    }
  }

  // 3. Kiem tra Cam ket chat luong ma nguon
  for (const item of REQUIRED_QUALITY_PATTERNS) {
    const match = normalizedBody.match(item.regex);
    if (!match) {
      errors.push(`Cam ket bat buoc bi thieu: "${item.name}".`);
      checklistHasErrors = true;
    } else if (match[1].toLowerCase() !== 'x') {
      errors.push(`Cam ket bat buoc chua duoc xac nhan: "${item.name}".`);
      checklistHasErrors = true;
    }
  }

  // 4. Kiem tra Tieu de PR
  const trimmedTitle = title.trim();
  if (EMOJI_REGEX.test(trimmedTitle)) {
    errors.push('Tieu de PR chua bieu tuong cam xuc (emoji). Vui long go bo emoji theo CONTRIBUTING.md.');
    commitHasErrors = true;
  }
  if (EM_DASH_REGEX.test(trimmedTitle)) {
    errors.push('Tieu de PR chua ky tu gach ngang dai (em-dash). Vui long thay the bang dau hai cham, dau gach noi hoac dau ngoac don.');
    commitHasErrors = true;
  }
  if (!CONVENTIONAL_COMMIT_REGEX.test(trimmedTitle)) {
    errors.push('Tieu de PR khong dung quy chuan Conventional Commits. Cu phap hop le: <type>(<scope>): <mo ta ngan gon>');
    commitHasErrors = true;
  }

  // 5. Kiem tra Commit messages
  const commitList = Array.isArray(commits) ? commits : [];
  for (const commitItem of commitList) {
    const message = (typeof commitItem === 'string' ? commitItem : commitItem.message || '').trim();
    if (!message) continue;

    const firstLine = message.split('\n')[0].trim();

    // Cho phep commit merge tieu chuan
    if (/^Merge (branch|remote-tracking branch|pull request)/.test(firstLine)) {
      continue;
    }

    if (EMOJI_REGEX.test(firstLine)) {
      errors.push(`Commit "${firstLine}" chua bieu tuong cam xuc (emoji). Vui long reword va go bo emoji.`);
      commitHasErrors = true;
    }
    if (EM_DASH_REGEX.test(firstLine)) {
      errors.push(`Commit "${firstLine}" chua ky tu gach ngang dai (em-dash). Vui long thay the bang dau gach noi hoac dau hai cham.`);
      commitHasErrors = true;
    }
    if (!CONVENTIONAL_COMMIT_REGEX.test(firstLine)) {
      errors.push(`Commit "${firstLine}" khong tuan thu Conventional Commits. Cu phap hop le: <type>(<scope>): <mo ta>`);
      commitHasErrors = true;
    }
  }

  // Xu ly nhan (labels)
  if (checklistHasErrors) {
    labelsToAdd.push('needs-checklist');
  } else {
    labelsToRemove.push('needs-checklist');
  }

  if (commitHasErrors) {
    labelsToAdd.push('invalid-commit');
  } else {
    labelsToRemove.push('invalid-commit');
  }

  return {
    valid: errors.length === 0,
    errors,
    labelsToAdd,
    labelsToRemove,
  };
}

// Chay truc tiep qua CLI neu duoc goi tu dong lenh
if (process.argv[1] && process.argv[1].endsWith('pr-gate-check.mjs')) {
  const args = process.argv.slice(2);
  let title = '';
  let body = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--title' && args[i + 1]) {
      title = args[i + 1];
      i++;
    } else if (args[i] === '--body' && args[i + 1]) {
      body = args[i + 1];
      i++;
    }
  }

  const result = validatePullRequest({ title, body, commits: [] });
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.valid ? 0 : 1);
}
