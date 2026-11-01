#!/usr/bin/env node

/**
 * PR Gate Validation Engine
 * Kiểm tra tính hợp lệ của PR checklist, tiêu đề và commit message trên TicketHub repository.
 */

const EMOJI_REGEX = /\p{Extended_Pictographic}/u;
const EM_DASH_REGEX = /[\u2013\u2014]/;
const CONVENTIONAL_COMMIT_REGEX = /^(feat|fix|docs|refactor|test|chore)(\([a-zA-Z0-9_.\-/]+\))?:\s.+/;

const REQUIRED_PREFLIGHT_PATTERNS = [
  {
    name: 'pnpm typecheck',
    regex: /-\s*\[([ xX])\]\s*.*`pnpm typecheck`/,
  },
  {
    name: 'pnpm lint',
    regex: /-\s*\[([ xX])\]\s*.*`pnpm lint`/,
  },
  {
    name: 'pnpm format:check',
    regex: /-\s*\[([ xX])\]\s*.*`pnpm format:check`/,
  },
  {
    name: 'pnpm test',
    regex: /-\s*\[([ xX])\]\s*.*`pnpm test`/,
  },
];

const REQUIRED_QUALITY_PATTERNS = [
  {
    name: 'Không chứa mã giả lập ở client',
    regex: /-\s*\[([ xX])\]\s*.*(?:chứa|chua)\s+(?:mã|ma)\s+(?:giả|gia)\s+(?:lập|lap)\s+.*client/i,
  },
  {
    name: 'Không sử dụng kiểu any',
    regex: /-\s*\[([ xX])\]\s*.*(?:sử|su)\s+(?:dụng|dung)\s+(?:kiểu|kieu)\s+`?any`?/i,
  },
  {
    name: 'Tuân thủ token màu tại docs/DESIGN_TOKENS.md',
    regex: /-\s*\[([ xX])\]\s*.*token\s+(?:màu|mau)/i,
  },
  {
    name: 'Không chứa biểu tượng cảm xúc (emoji)',
    regex: /-\s*\[([ xX])\]\s*.*(?:biểu|bieu)\s+(?:tượng|tuong)\s+(?:cảm|cam)\s+(?:xúc|xuc)\s*\(emoji\)/i,
  },
  {
    name: 'Không chứa ký tự gạch ngang dài (em-dash)',
    regex: /-\s*\[([ xX])\]\s*.*(?:gạch|gach)\s+(?:ngang|ngang)\s+(?:dài|dai)\s*\(em-dash\)/i,
  },
];

const PR_TYPE_PATTERN = /-\s*\[([xX])\]\s*`(feat|fix|docs|refactor|chore)`/;

export function validatePullRequest({ title = '', body = '', commits = [] }) {
  const errors = [];
  const labelsToAdd = [];
  const labelsToRemove = [];

  let checklistHasErrors = false;
  let commitHasErrors = false;

  const normalizedBody = body || '';

  // 1. Kiểm tra loại PR
  if (!PR_TYPE_PATTERN.test(normalizedBody)) {
    errors.push('Loại thay đổi (PR Type) chưa được chọn. Vui lòng tích ít nhất một loại (feat, fix, docs, refactor, chore).');
    checklistHasErrors = true;
  }

  // 2. Kiểm tra Pre-flight checks
  for (const item of REQUIRED_PREFLIGHT_PATTERNS) {
    const match = normalizedBody.match(item.regex);
    if (!match) {
      errors.push(`Mục kiểm tra bắt buộc bị thiếu: "${item.name}".`);
      checklistHasErrors = true;
    } else if (match[1].toLowerCase() !== 'x') {
      errors.push(`Mục kiểm tra bắt buộc chưa được tích: "${item.name}".`);
      checklistHasErrors = true;
    }
  }

  // 3. Kiểm tra Cam kết chất lượng mã nguồn
  for (const item of REQUIRED_QUALITY_PATTERNS) {
    const match = normalizedBody.match(item.regex);
    if (!match) {
      errors.push(`Cam kết bắt buộc bị thiếu: "${item.name}".`);
      checklistHasErrors = true;
    } else if (match[1].toLowerCase() !== 'x') {
      errors.push(`Cam kết bắt buộc chưa được xác nhận: "${item.name}".`);
      checklistHasErrors = true;
    }
  }

  // 4. Kiểm tra Tiêu đề PR
  const trimmedTitle = title.trim();
  if (EMOJI_REGEX.test(trimmedTitle)) {
    errors.push('Tiêu đề PR chứa biểu tượng cảm xúc (emoji). Vui lòng gỡ bỏ emoji theo CONTRIBUTING.md.');
    commitHasErrors = true;
  }
  if (EM_DASH_REGEX.test(trimmedTitle)) {
    errors.push('Tiêu đề PR chứa ký tự gạch ngang dài (em-dash). Vui lòng thay thế bằng dấu hai chấm, dấu gạch nối hoặc dấu ngoặc đơn.');
    commitHasErrors = true;
  }
  if (!CONVENTIONAL_COMMIT_REGEX.test(trimmedTitle)) {
    errors.push('Tiêu đề PR không đúng quy chuẩn Conventional Commits. Cú pháp hợp lệ: <type>(<scope>): <mô tả ngắn gọn>');
    commitHasErrors = true;
  }

  // 5. Kiểm tra Commit messages
  const commitList = Array.isArray(commits) ? commits : [];
  for (const commitItem of commitList) {
    const message = (typeof commitItem === 'string' ? commitItem : commitItem.message || '').trim();
    if (!message) continue;

    const firstLine = message.split('\n')[0].trim();

    // Cho phép commit merge tiêu chuẩn
    if (/^Merge (branch|remote-tracking branch|pull request)/.test(firstLine)) {
      continue;
    }

    if (EMOJI_REGEX.test(message)) {
      errors.push(`Commit "${firstLine}" chứa biểu tượng cảm xúc (emoji). Vui lòng reword và gỡ bỏ emoji.`);
      commitHasErrors = true;
    }
    if (EM_DASH_REGEX.test(message)) {
      errors.push(`Commit "${firstLine}" chứa ký tự gạch ngang dài (em-dash). Vui lòng thay thế bằng dấu gạch nối hoặc dấu hai chấm.`);
      commitHasErrors = true;
    }
    if (!CONVENTIONAL_COMMIT_REGEX.test(firstLine)) {
      errors.push(`Commit "${firstLine}" không tuân thủ Conventional Commits. Cú pháp hợp lệ: <type>(<scope>): <mô tả>`);
      commitHasErrors = true;
    }
  }

  // Xử lý nhãn (labels)
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

// Chạy trực tiếp qua CLI nếu được gọi từ dòng lệnh
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
