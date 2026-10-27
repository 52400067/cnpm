import { test, expect } from "@playwright/test";

test.describe("UC01: Đăng nhập & Đăng ký (Real Integration Test)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth");
  });

  // 1. LUỒNG ĐĂNG KÝ (MAIN FLOW A)

  test("TC01 - Đăng ký tài khoản Người mua mới (Luồng A)", async ({ page }) => {
    const uniqueEmail = `buyer_${Date.now()}@example.com`;
    await page.fill("input#identifier", uniqueEmail);
    await page.click('button[type="submit"]:has-text("Tiếp tục")');

    await page.waitForSelector("input#fullName");
    await page.fill("input#fullName", "Võ Gia Khang");
    await page.fill("input#register-password", "Password123!");
    await page.click('button[type="submit"]:has-text("Tạo tài khoản")');

    await expect(page).toHaveURL(/\/verify-email\?email=/);
  });

  test("TC02 - Đăng ký tài khoản Ban tổ chức (Role ORGANIZER)", async ({
    page,
  }) => {
    const orgEmail = `org_${Date.now()}@example.com`;
    await page.fill("input#identifier", orgEmail);
    await page.click('button[type="submit"]:has-text("Tiếp tục")');

    await page.waitForSelector("input#fullName");
    await page.click('button:has-text("Bạn là ban tổ chức?")');

    await page.fill("input#fullName", "Đại diện Ban Tổ Chức");
    await page.fill("input#organizationName", "TicketHub Events");
    await page.fill("input#register-password", "OrgPass123!");
    await page.click('button[type="submit"]:has-text("Tạo tài khoản")');

    await expect(page).toHaveURL(/\/verify-email\?email=/);
  });

  // 2. LUỒNG ĐĂNG NHẬP & VALIDATION

  test("TC03 - Đăng ký thất bại khi Email đã tồn tại ở DB (Exception E1)", async ({
    page,
  }) => {
    await page.route("**/api/v1/auth/register", (route) => {
      route.fulfill({
        status: 409,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            code: "EMAIL_ALREADY_EXISTS",
            message: "Email đã được sử dụng",
          },
        }),
      });
    });

    const uniqueEmail = `existing_${Date.now()}@example.com`;
    await page.fill("input#identifier", uniqueEmail);
    await page.click('button[type="submit"]:has-text("Tiếp tục")');

    await page.waitForSelector("input#fullName");
    await page.fill("input#fullName", "Test Duplicate");
    await page.fill("input#register-password", "Password123!");
    await page.click('button[type="submit"]:has-text("Tạo tài khoản")');

    await expect(
      page.locator('div.text-destructive[role="alert"]'),
    ).toContainText(/tồn tại|đã được sử dụng/i);
  });

  test("TC04 - Đăng nhập với tài khoản có sẵn & Kiểm tra sai mật khẩu (Luồng B & E3)", async ({
    page,
  }) => {
    const activeEmail = "buyer@tickethub.vn";
    await page.fill("input#identifier", activeEmail);
    await page.click('button[type="submit"]:has-text("Tiếp tục")');

    await page.waitForSelector("input#password");

    await page.fill("input#password", "WrongPassword!");
    await page.click('button[type="submit"]:has-text("Đăng nhập")');
    await expect(
      page.locator('div.text-destructive[role="alert"]'),
    ).toContainText(/không chính xác/i);

    await page.fill("input#password", "Password123!");
    await page.click('button[type="submit"]:has-text("Đăng nhập")');

    await expect(page).toHaveURL(/\/(?!auth)/);
  });

  test("TC05 - Báo lỗi Validation trên UI Frontend (Exception E2)", async ({
    page,
  }) => {
    await page.fill("input#identifier", "invalid_email");
    await page.click('button[type="submit"]:has-text("Tiếp tục")');
    await expect(page.locator("#identifier-error")).toContainText(/hợp lệ/i);

    await page.fill("input#identifier", `test_${Date.now()}@example.com`);
    await page.click('button[type="submit"]:has-text("Tiếp tục")');

    await page.waitForSelector("input#register-password");
    await page.fill("input#fullName", "Nguyễn Văn A");
    await page.fill("input#register-password", "123");
    await page.click('button[type="submit"]:has-text("Tạo tài khoản")');

    await expect(page.locator("#register-password-error")).toContainText(
      /tối thiểu 8 ký tự/i,
    );
  });

  test("TC06 - Chức năng chuyển đổi tài khoản (Back to Identifier)", async ({
    page,
  }) => {
    await page.fill("input#identifier", "buyer@tickethub.vn");
    await page.click('button[type="submit"]:has-text("Tiếp tục")');

    await page.waitForSelector('button:has-text("Đổi")');
    await page.click('button:has-text("Đổi")');

    await expect(page.locator("h1")).toContainText(
      "Đăng nhập hoặc tạo tài khoản",
    );
    await expect(page.locator("input#identifier")).toBeVisible();
  });

  // 3. CÁC CA KIỂM THỬ NGOẠI LỆ MẠNG & BẢO MẬT

  test("TC07 - Báo lỗi Mất kết nối mạng (Exception HTTP 503)", async ({
    page,
  }) => {
    await page.route("**/api/v1/auth/check-identifier", (route) => {
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ message: "Service Unavailable" }),
      });
    });

    await page.fill("input#identifier", "error@example.com");
    await page.click('button[type="submit"]:has-text("Tiếp tục")');

    await expect(
      page.locator('div.text-destructive[role="alert"]'),
    ).toContainText(/Không thể kiểm tra|Không thể kết nối|máy chủ/i);
  });

  test("TC08 - Báo lỗi Thao tác quá nhanh (Exception HTTP 429)", async ({
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

    await page.fill("input#identifier", "ratelimit@example.com");
    await page.click('button[type="submit"]:has-text("Tiếp tục")');

    await expect(
      page.locator('div.text-destructive[role="alert"]'),
    ).toContainText(/quá nhanh|thử lại sau/i);
  });

  test("TC09 - Khóa 15 phút khi đăng nhập sai 5 lần (Exception E4)", async ({
    page,
  }) => {
    test.fixme(
      true,
      "Chờ Backend Lead (BE1) bổ sung bộ đếm đăng nhập sai và khóa tài khoản 15 phút",
    );

    const activeEmail = "buyer@tickethub.vn";
    await page.fill("input#identifier", activeEmail);
    await page.click('button[type="submit"]:has-text("Tiếp tục")');
    await page.waitForSelector("input#password");

    for (let i = 1; i <= 5; i++) {
      await page.fill("input#password", `WrongPassword_${i}!`);
      await page.click('button[type="submit"]:has-text("Đăng nhập")');
      await page.waitForTimeout(200);
    }

    await expect(
      page.locator('div.text-destructive[role="alert"]'),
    ).toContainText(/khóa|15 phút/i);
  });
});
