import { and, eq, lte } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { adminSessions, adminUsers } from "../db/schema.js";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  getSessionToken,
  hashSessionToken,
  requireAdminSession,
  verifyPassword,
} from "../plugins/admin-auth.js";

const credentialsSchema = z.object({
  username: z.string().trim().min(1).max(120),
  password: z.string().min(1).max(256),
});

function sessionCookie(value: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=${value}; HttpOnly; SameSite=Lax; Path=/api; Max-Age=${maxAge}${secure}`;
}

export async function adminAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post("/admin/login", async (request, reply) => {
    const parsed = credentialsSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Enter a valid admin username and password." });
    }

    const username = parsed.data.username.toLowerCase();
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.username, username))
      .limit(1);

    if (!admin || !admin.isActive || !verifyPassword(parsed.data.password, admin.passwordHash)) {
      return reply.code(401).send({ error: "Invalid admin username or password." });
    }

    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000);
    await db.insert(adminSessions).values({
      tokenHash: hashSessionToken(token),
      adminId: admin.id,
      expiresAt,
    });
    await db.delete(adminSessions).where(and(
      eq(adminSessions.adminId, admin.id),
      lte(adminSessions.expiresAt, new Date()),
    ));

    return reply
      .header("Set-Cookie", sessionCookie(token, ADMIN_SESSION_MAX_AGE_SECONDS))
      .send({ username: admin.username });
  });

  app.get("/admin/session", { preHandler: requireAdminSession }, async (request) => ({
    username: request.adminUsername,
  }));

  app.post("/admin/logout", async (request, reply) => {
    const token = getSessionToken(request);
    if (token) {
      await db.delete(adminSessions).where(eq(adminSessions.tokenHash, hashSessionToken(token)));
    }

    return reply
      .header("Set-Cookie", sessionCookie("", 0))
      .code(204)
      .send();
  });
}
