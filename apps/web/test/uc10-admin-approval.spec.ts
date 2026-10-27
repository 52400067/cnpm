import { test, expect } from "@playwright/test";

test.describe("UC10: Kiểm duyệt sự kiện (Admin)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth");
    await page.fill("input#identifier", "admin@tickethub.vn");
    await page.click('button[type="submit"]:has-text("Tiếp tục")');
    await page.waitForSelector("input#password");
    await page.fill("input#password", "Password123!");
    await page.click('button[type="submit"]:has-text("Đăng nhập")');
    await page.waitForURL("/admin");
  });

  test("TC01 - Hiển thị Bảng điều khiển Quản trị viên (/admin)", async ({
    page,
  }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL("/admin");
    await expect(page.locator("body")).toBeVisible();
  });

  test("TC02 - Duyệt sự kiện hợp lệ (Approve Event)", async () => {
    test.skip(
      true,
      "Giao diện duyệt sự kiện chi tiết của Admin đang chờ tích hợp",
    );
  });

  test("TC03 - Từ chối sự kiện kèm lý do (Reject Event)", async () => {
    test.skip(
      true,
      "Giao diện từ chối sự kiện chi tiết của Admin đang chờ tích hợp",
    );
  });
});
