import assert from "node:assert/strict";
import { test } from "node:test";
import { toVnpayAmount } from "../src/payments/vnpay-ipn.preview.service";

test("Convert 10000 VND to VNPay amount", () => {
  assert.equal(toVnpayAmount("10000.00"), "1000000");
});

test("Reject fractional VND", () => {
  assert.equal(toVnpayAmount("10000.50"), null);
});

test("Reject invalid or negative amount", () => {
  assert.equal(toVnpayAmount("-10000"), null);
  assert.equal(toVnpayAmount("abc"), null);
});

test("Reject zero payment amount", () => {
  assert.equal(toVnpayAmount("0.00"), null);
});
