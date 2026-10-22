import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";

import { EnvSchema } from "../src/config/env.config";

test("Development allows default JWT secret", () => {
  const result = EnvSchema.safeParse({
    NODE_ENV: "development",
  });

  assert.equal(result.success, true);
});

test("Production rejects default JWT secret", () => {
  const result = EnvSchema.safeParse({
    NODE_ENV: "production",
  });

  assert.equal(result.success, false);
});

test("Production rejects short JWT secret", () => {
  const result = EnvSchema.safeParse({
    NODE_ENV: "production",
    JWT_SECRET: "short-secret",
  });

  assert.equal(result.success, false);
});

test("Production accepts configured JWT secret", () => {
  const result = EnvSchema.safeParse({
    NODE_ENV: "production",
    JWT_SECRET: randomBytes(32).toString("hex"),
  });

  assert.equal(result.success, true);
});
