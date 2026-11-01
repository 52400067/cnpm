import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";
import { db, sqlClient } from "./db";

async function runMigrations() {
  console.log("Running database migrations...");
  const migrationsFolder =
    typeof import.meta !== "undefined" && import.meta.dirname
      ? path.resolve(import.meta.dirname, "../../drizzle")
      : path.resolve(process.cwd(), "drizzle");
  await migrate(db, { migrationsFolder });
  console.log("Database migrations completed successfully.");
  await sqlClient.end();
}

runMigrations().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
