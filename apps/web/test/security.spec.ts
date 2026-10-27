import { test, expect } from "@playwright/test";

const DEV_JWT_SECRET =
  "tickethub-super-secret-development-jwt-key-2026-min-32-chars";

async function createSignedJwt(
  payload: Record<string, unknown>,
  secret = DEV_JWT_SECRET,
): Promise<string> {
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const data = new TextEncoder().encode(`${header}.${payloadB64}`);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const sig = await crypto.subtle.sign("HMAC", key, data);
  const sigB64 = Buffer.from(sig).toString("base64url");

  return `${header}.${payloadB64}.${sigB64}`;
}

test.describe("Kiểm thử bảo mật cơ bản (Security Test Suite)", () => {
  test("SEC01 - Kiểm tra Middleware RBAC Guard (Khách chưa đăng nhập cố truy cập /admin)", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth\?redirect=%2Fadmin/);
  });

  test("SEC02 - Kiểm tra RBAC Route Guard (Người mua cố truy cập /admin)", async ({
    page,
    context,
  }) => {
    const buyerToken = await createSignedJwt({
      sub: "user-buyer-1",
      email: "buyer@tickethub.vn",
      role: "BUYER",
      exp: Math.floor(Date.now() / 1000) + 900,
    });

    await context.addCookies([
      {
        name: "accessToken",
        value: buyerToken,
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/\?error=forbidden_admin/);
  });

  test("SEC03 - Kiểm tra RBAC Route Guard cho Organizer (/organizer/events)", async ({
    page,
  }) => {
    await page.goto("/organizer/events");
    await expect(page).toHaveURL(/\/auth\?redirect=%2Forganizer%2Fevents/);
  });

  test("SEC04 - Kiểm tra Bắt lỗi Rate Limit HTTP 429 khi thao tác quá nhanh", async ({
    page,
  }) => {
    await page.route("**/api/v1/auth/check-identifier", (route) => {
      route.fulfill({
        status: 429,
        headers: { "Retry-After": "60" },
        contentType: "application/json",
        body: JSON.stringify({
          message: "Thao tác quá nhanh. Vui lòng thử lại sau 60 giây.",
        }),
      });
    });

    await page.goto("/auth");
    await page.fill("input#identifier", "ratelimit@example.com");
    await page.click('button[type="submit"]:has-text("Tiếp tục")');
    await expect(
      page.locator('div.text-destructive[role="alert"]'),
    ).toContainText(/quá nhanh|thử lại sau/i);
  });

  test("SEC05 - Kiểm tra Xử lý sự cố Mất kết nối Mạng / HTTP 503", async ({
    page,
  }) => {
    await page.route("**/api/v1/auth/check-identifier", (route) => {
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "Service Unavailable" }),
      });
    });

    await page.goto("/auth");
    await page.fill("input#identifier", "error@example.com");
    await page.click('button[type="submit"]:has-text("Tiếp tục")');

    await expect(
      page.locator('div.text-destructive[role="alert"]'),
    ).toContainText(/Không thể kiểm tra|Không thể kết nối|máy chủ/i);
  });

  test("SEC06 - Xóa Cookie Access Token bắt buộc quay về trang Login", async ({
    page,
    context,
  }) => {
    const validToken = await createSignedJwt({
      sub: "user-buyer-1",
      email: "buyer@tickethub.vn",
      role: "BUYER",
      exp: Math.floor(Date.now() / 1000) + 900,
    });

    await context.addCookies([
      {
        name: "accessToken",
        value: validToken,
        domain: "localhost",
        path: "/",
      },
    ]);

    await context.clearCookies();
    await page.goto("/my-tickets");
    await expect(page).toHaveURL(/\/auth\?redirect=%2Fmy-tickets/);
  });
});
