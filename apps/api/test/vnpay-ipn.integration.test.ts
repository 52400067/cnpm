import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { BookingService } from "../src/booking/booking.service";
import type { WaitingRoomService } from "../src/waiting-room/waiting-room.service";
import {
  OrderStatus,
  TransactionStatus,
  PaymentProvider,
} from "@tickethub/shared";

import { env } from "../src/config/env.config";
import { db } from "../src/database/db";
import {
  users,
  orders,
  orderItems,
  transactions,
  ticketTypes,
  outbox,
} from "../src/database/schema";

import { VnpayIpnService } from "../src/payments/vnpay-ipn.service";
import { toVnpayAmount } from "../src/payments/vnpay-ipn.preview.service";

// Safety guard: never write integration fixtures to dev DB.
const targetDb = new URL(env.DATABASE_URL).pathname.slice(1);

if (targetDb !== "tickethub_ipn_test") {
  throw new Error(
    `Unsafe test database: ${targetDb}. Expected tickethub_ipn_test`,
  );
}

async function createFixture(expired = false) {
  const [user] = await db.select({ id: users.id }).from(users).limit(1);

  const [tt] = await db
    .select()
    .from(ticketTypes)
    .where(eq(ticketTypes.isSeated, false))
    .limit(1);

  if (!user || !tt) {
    throw new Error("Test DB needs seeded users and GA ticket types");
  }

  const id = randomUUID();
  const orderId = id;
  const transactionRef = "IPNTEST" + id.replace(/-/g, "");
  const orderCode = "IPN" + id.replace(/-/g, "").slice(0, 20);

  await db.transaction(async (tx) => {
    await tx.insert(orders).values({
      id: orderId,
      orderCode,
      userId: user.id,
      eventId: tt.eventId,
      totalAmount: tt.price,
      finalAmount: tt.price,
      status: OrderStatus.PENDING,
      expiresAt: new Date(Date.now() + (expired ? -60_000 : 300_000)),
    });

    await tx.insert(orderItems).values({
      orderId,
      ticketTypeId: tt.id,
      quantity: 1,
      unitPrice: tt.price,
      subtotal: tt.price,
    });

    await tx.insert(transactions).values({
      orderId,
      provider: PaymentProvider.VNPAY,
      transactionRef,
      amount: tt.price,
      status: TransactionStatus.PENDING,
      idempotencyKey: `ipn-test:${id}`,
    });

    await tx
      .update(ticketTypes)
      .set({
        heldCount: sql`${ticketTypes.heldCount} + 1`,
      })
      .where(eq(ticketTypes.id, tt.id));
  });

  return {
    userId: user.id,
    orderId,
    transactionRef,
    amount: toVnpayAmount(tt.price)!,
    ticketTypeId: tt.id,
    heldBefore: tt.heldCount,
    soldBefore: tt.soldCount,
  };
}

// Mock only the already-verified gateway result.
// Database transactions and inventory changes remain real.
function serviceWithVerifiedCallback(transactionRef: string, success: boolean) {
  const service = new VnpayIpnService();

  Object.defineProperty(service, "gateway", {
    value: {
      verifyCallback: () => ({
        verified: true,
        success,
        transactionRef,
        providerTransactionId: "TESTPROVIDER001",
      }),
    },
  });

  return service;
}

async function readOrder(orderId: string) {
  const [order] = await db.select().from(orders).where(eq(orders.id, orderId));

  const [transaction] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.orderId, orderId));

  return { order, transaction };
}

test("Successful IPN updates payment once", async () => {
  const fixture = await createFixture();
  const service = serviceWithVerifiedCallback(fixture.transactionRef, true);

  const callback = {
    vnp_Amount: fixture.amount,
    vnp_ResponseCode: "00",
    vnp_TransactionStatus: "00",
  };

  const first = await service.process(callback);
  assert.equal(first, "APPLY_SUCCESS");

  const second = await service.process(callback);
  assert.equal(second, "ALREADY_PROCESSED");

  const { order, transaction } = await readOrder(fixture.orderId);

  assert.equal(order?.status, OrderStatus.PAID);
  assert.equal(transaction?.status, TransactionStatus.SUCCESS);

  const [tt] = await db
    .select()
    .from(ticketTypes)
    .where(eq(ticketTypes.id, fixture.ticketTypeId));

  assert.equal(tt?.heldCount, fixture.heldBefore);
  assert.equal(tt?.soldCount, fixture.soldBefore + 1);

  const emittedEvents = await db
    .select({ id: outbox.id })
    .from(outbox)
    .where(
      and(
        eq(outbox.eventType, "ORDER_PAID"),
        sql`${outbox.payload} ->> 'orderId' = ${fixture.orderId}`,
      ),
    );

  assert.equal(emittedEvents.length, 1);
});

test("Failed IPN releases GA hold", async () => {
  const fixture = await createFixture();
  const service = serviceWithVerifiedCallback(fixture.transactionRef, false);

  const result = await service.process({
    vnp_Amount: fixture.amount,
    vnp_ResponseCode: "24",
    vnp_TransactionStatus: "02",
  });

  assert.equal(result, "RECORD_FAILURE");

  const { order, transaction } = await readOrder(fixture.orderId);

  assert.equal(order?.status, OrderStatus.FAILED);
  assert.equal(transaction?.status, TransactionStatus.FAILED);

  const [tt] = await db
    .select()
    .from(ticketTypes)
    .where(eq(ticketTypes.id, fixture.ticketTypeId));

  assert.equal(tt?.heldCount, fixture.heldBefore);
  assert.equal(tt?.soldCount, fixture.soldBefore);
});

test("Expired order never becomes PAID", async () => {
  const fixture = await createFixture(true);
  const service = serviceWithVerifiedCallback(fixture.transactionRef, true);

  const result = await service.process({
    vnp_Amount: fixture.amount,
    vnp_ResponseCode: "00",
    vnp_TransactionStatus: "00",
  });

  assert.equal(result, "MANUAL_REVIEW");

  const { order, transaction } = await readOrder(fixture.orderId);

  assert.equal(order?.status, OrderStatus.PENDING);
  assert.equal(transaction?.status, TransactionStatus.PENDING);
});

test("Concurrent duplicate IPNs update inventory only once", async () => {
  const fixture = await createFixture();

  const service = serviceWithVerifiedCallback(fixture.transactionRef, true);

  const callback = {
    vnp_Amount: fixture.amount,
    vnp_ResponseCode: "00",
    vnp_TransactionStatus: "00",
  };

  const results = await Promise.all([
    service.process(callback),
    service.process(callback),
  ]);

  assert.deepEqual(
    results.sort(),
    ["ALREADY_PROCESSED", "APPLY_SUCCESS"].sort(),
  );

  const { order, transaction } = await readOrder(fixture.orderId);

  assert.equal(order?.status, OrderStatus.PAID);
  assert.equal(transaction?.status, TransactionStatus.SUCCESS);

  const [tt] = await db
    .select()
    .from(ticketTypes)
    .where(eq(ticketTypes.id, fixture.ticketTypeId));

  assert.equal(tt?.heldCount, fixture.heldBefore);
  assert.equal(tt?.soldCount, fixture.soldBefore + 1);
});

test("Wrong VNPay amount does not change database state", async () => {
  const fixture = await createFixture();

  const service = serviceWithVerifiedCallback(fixture.transactionRef, true);

  const wrongAmount = (BigInt(fixture.amount) + 100n).toString();

  const result = await service.process({
    vnp_Amount: wrongAmount,
    vnp_ResponseCode: "00",
    vnp_TransactionStatus: "00",
  });

  assert.equal(result, "AMOUNT_MISMATCH");

  const { order, transaction } = await readOrder(fixture.orderId);

  assert.equal(order?.status, OrderStatus.PENDING);
  assert.equal(transaction?.status, TransactionStatus.PENDING);

  const [tt] = await db
    .select()
    .from(ticketTypes)
    .where(eq(ticketTypes.id, fixture.ticketTypeId));

  assert.equal(tt?.heldCount, fixture.heldBefore + 1);
  assert.equal(tt?.soldCount, fixture.soldBefore);
});

test("Repeated failed callback does not release tickets twice", async () => {
  const fixture = await createFixture();

  const service = serviceWithVerifiedCallback(fixture.transactionRef, false);

  const callback = {
    vnp_Amount: fixture.amount,
    vnp_ResponseCode: "24",
    vnp_TransactionStatus: "02",
  };

  const first = await service.process(callback);
  const second = await service.process(callback);

  assert.equal(first, "RECORD_FAILURE");
  assert.equal(second, "ALREADY_PROCESSED");

  const { order, transaction } = await readOrder(fixture.orderId);

  assert.equal(order?.status, OrderStatus.FAILED);
  assert.equal(transaction?.status, TransactionStatus.FAILED);

  const [tt] = await db
    .select()
    .from(ticketTypes)
    .where(eq(ticketTypes.id, fixture.ticketTypeId));

  assert.equal(tt?.heldCount, fixture.heldBefore);
  assert.equal(tt?.soldCount, fixture.soldBefore);
});

test("IPN vs releaseHold: payment and cancellation cannot both win", async () => {
  const fixture = await createFixture();

  const ipn = serviceWithVerifiedCallback(fixture.transactionRef, true);

  const booking = new BookingService({} as WaitingRoomService);

  const [paymentResult, releaseResult] = await Promise.allSettled([
    ipn.process({
      vnp_Amount: fixture.amount,
      vnp_ResponseCode: "00",
      vnp_TransactionStatus: "00",
    }),
    booking.releaseHold(fixture.userId, fixture.orderId),
  ]);

  const { order, transaction } = await readOrder(fixture.orderId);

  const [tt] = await db
    .select()
    .from(ticketTypes)
    .where(eq(ticketTypes.id, fixture.ticketTypeId));

  assert.ok(order);
  assert.ok(transaction);
  assert.ok(tt);

  if (order.status === OrderStatus.PAID) {
    assert.equal(transaction.status, TransactionStatus.SUCCESS);
    assert.equal(paymentResult.status, "fulfilled");
    assert.equal(paymentResult.value, "APPLY_SUCCESS");
    assert.equal(releaseResult.status, "rejected");

    assert.equal(tt.heldCount, fixture.heldBefore);
    assert.equal(tt.soldCount, fixture.soldBefore + 1);
  } else {
    assert.equal(order.status, OrderStatus.CANCELLED);
    assert.equal(transaction.status, TransactionStatus.PENDING);
    assert.equal(releaseResult.status, "fulfilled");
    assert.equal(paymentResult.status, "fulfilled");
    assert.equal(paymentResult.value, "MANUAL_REVIEW");

    assert.equal(tt.heldCount, fixture.heldBefore);
    assert.equal(tt.soldCount, fixture.soldBefore);
  }
});

test("IPN vs Booking Cleanup: expired order never becomes PAID", async () => {
  const booking = new BookingService({} as WaitingRoomService);

  // Don cac hold da het han cua cac test truoc.
  await booking.cleanExpiredOrders();

  const fixture = await createFixture(true);

  const ipn = serviceWithVerifiedCallback(fixture.transactionRef, true);

  const [paymentResult, cleanupResult] = await Promise.allSettled([
    ipn.process({
      vnp_Amount: fixture.amount,
      vnp_ResponseCode: "00",
      vnp_TransactionStatus: "00",
    }),
    booking.cleanExpiredOrders(),
  ]);

  assert.equal(paymentResult.status, "fulfilled");
  assert.equal(cleanupResult.status, "fulfilled");

  if (paymentResult.status === "fulfilled") {
    assert.equal(paymentResult.value, "MANUAL_REVIEW");
  }

  const { order, transaction } = await readOrder(fixture.orderId);

  assert.equal(order?.status, OrderStatus.EXPIRED);
  assert.equal(transaction?.status, TransactionStatus.PENDING);

  const [tt] = await db
    .select()
    .from(ticketTypes)
    .where(eq(ticketTypes.id, fixture.ticketTypeId));

  assert.equal(tt?.heldCount, fixture.heldBefore);
  assert.equal(tt?.soldCount, fixture.soldBefore);
});
