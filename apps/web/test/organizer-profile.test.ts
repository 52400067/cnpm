import { test, describe } from "node:test";
import assert from "node:assert/strict";

describe("Organizer Profile: Vietnamese Regulatory Validation (Decree 13 & Tax Rules)", () => {
  const taxRegex = /^(\d{10}|\d{12}|\d{13})$/;
  const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

  test("Chap nhan Ma so thue doanh nghiep 10 chu so", () => {
    assert.ok(taxRegex.test("0312345678"));
    assert.ok(taxRegex.test("0102938475"));
  });

  test("Chap nhan Ma so thue chi nhanh 13 chu so", () => {
    assert.ok(taxRegex.test("0312345678001"));
  });

  test("Chap nhan So CCCD ca nhan 12 chu so", () => {
    assert.ok(taxRegex.test("079199001234"));
  });

  test("Tu choi Ma so thue / CCCD co do dai khong hop le hoac chua ky tu chu", () => {
    assert.equal(taxRegex.test("123456789"), false); // 9 so
    assert.equal(taxRegex.test("12345678901"), false); // 11 so
    assert.equal(taxRegex.test("031234567A"), false); // Chữ cái
    assert.equal(taxRegex.test(""), false);
  });

  test("Chap nhan so dien thoai Viet Nam hop le", () => {
    assert.ok(phoneRegex.test("0901234567"));
    assert.ok(phoneRegex.test("0387654321"));
    assert.ok(phoneRegex.test("+84901234567"));
    assert.ok(phoneRegex.test("+84387654321"));
  });

  test("Tu choi so dien thoai sai dau so hoac thieu chu so", () => {
    assert.equal(phoneRegex.test("0123456789"), false); // Dau 01 cu
    assert.equal(phoneRegex.test("090123456"), false); // 9 so
    assert.equal(phoneRegex.test("09012345678"), false); // 11 so
    assert.equal(phoneRegex.test("+840901234567"), false); // Thua so 0 sau +84
    assert.equal(phoneRegex.test("abc0901234"), false);
  });
});
