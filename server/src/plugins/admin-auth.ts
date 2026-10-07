import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import type { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../db/client.js";
import { adminSessions, adminUsers } from "../db/schema.js";

export const ADMIN_SESSION_COOKIE = "greenmart_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

declare module "fastify" {
  interface FastifyRequest {
    adminUserId: number | null;
    adminUsername: string | null;
  }
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  const [algorithm, saltValue, hashValue] = encoded.split("$");
  if (algorithm !== "scrypt" || !saltValue || !hashValue) return false;

  const salt = Buffer.from(saltValue, "base64");
  const expected = Buffer.from(hashValue, "base64");
  if (salt.length !== 16 || expected.length !== 64) return false;

  const actual = scryptSync(password, salt, expected.length);
  return timingSafeEqual(actual, expected);
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function getSessionToken(request: FastifyRequest): string | null {
  const cookiePrefix = `${ADMIN_SESSION_COOKIE}=`;
  const cookie = request.headers.cookie
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(cookiePrefix));
  const token = cookie?.slice(cookiePrefix.length);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

export async function requireAdminSession(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  request.adminUserId = null;
  request.adminUsername = null;

  const token = getSessionToken(request);
  if (!token) {
    await reply.code(401).send({ error: "Sign in with an administrator account to manage products." });
    return;
  }

  const [session] = await db
    .select({ id: adminUsers.id, username: adminUsers.username })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.adminId, adminUsers.id))
    .where(and(
      eq(adminSessions.tokenHash, hashSessionToken(token)),
      gt(adminSessions.expiresAt, new Date()),
      eq(adminUsers.isActive, true),
    ))
    .limit(1);

  if (!session) {
    await reply.code(401).send({ error: "Your admin session has expired. Please sign in again." });
    return;
  }

  request.adminUserId = session.id;
  request.adminUsername = session.username;
}
