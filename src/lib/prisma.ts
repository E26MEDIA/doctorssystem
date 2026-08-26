import { copyFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import path from "path";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  sqliteReady?: boolean;
};

function isServerlessWritableFsHost() {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
}

/** Vercel/Lambda only allow writes under /tmp — seed a local SQLite there. */
function prepareWritableSqlite() {
  if (!isServerlessWritableFsHost()) return;
  if (globalForPrisma.sqliteReady) return;

  const tmpDb = "/tmp/honnani.db";
  process.env.DATABASE_URL = `file:${tmpDb}`;

  if (!existsSync(tmpDb)) {
    const candidates = [
      path.join(process.cwd(), "prod.db"),
      path.join(process.cwd(), "prisma", "prod.db"),
      path.join("/var/task", "prod.db"),
    ];
    let seeded = false;
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        copyFileSync(candidate, tmpDb);
        seeded = true;
        break;
      }
    }
    if (!seeded) {
      try {
        execSync("npx prisma db push --skip-generate --accept-data-loss", {
          env: { ...process.env, DATABASE_URL: `file:${tmpDb}` },
          stdio: "ignore",
        });
      } catch {
        // Tables may still be created on first Prisma use failure — login can fall back to env password.
      }
    }
  }

  globalForPrisma.sqliteReady = true;
}

prepareWritableSqlite();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
} else if (isServerlessWritableFsHost()) {
  // Reuse client across warm serverless invocations
  globalForPrisma.prisma = prisma;
}
