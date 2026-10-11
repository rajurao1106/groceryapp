import { asc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { staffMembers } from "../db/schema.js";
import { requireAdminSession } from "../plugins/admin-auth.js";
import { getInitials, isUniqueViolation, parsePositiveId } from "./admin-domain-shared.js";

const staffInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  initials: z.string().trim().min(1).max(8).optional(),
  role: z.enum(["Owner", "Store manager", "Catalog manager", "Order manager"]),
  status: z.enum(["Active", "Invitation pending", "Suspended"]).default("Invitation pending"),
  lastActive: z.string().trim().min(1).max(100).default("Invite created just now"),
});

export async function staffRoutes(app: FastifyInstance): Promise<void> {
  app.get("/staff", { preHandler: requireAdminSession }, async (_request, reply) => {
    reply.header("Cache-Control", "no-store, max-age=0");
    const rows = await db.select().from(staffMembers).orderBy(asc(staffMembers.id));
    return { staff: rows };
  });

  app.post("/staff", { preHandler: requireAdminSession }, async (request, reply) => {
    const parsed = staffInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid staff directory record.", details: parsed.error.flatten() });
    const value = parsed.data;
    try {
      const [row] = await db.insert(staffMembers).values({
        ...value,
        email: value.email.toLowerCase(),
        initials: value.initials ?? getInitials(value.name),
      }).returning();
      if (!row) throw new Error("The staff insert did not return a database row.");
      return reply.code(201).send({ staffMember: row });
    } catch (error) {
      if (isUniqueViolation(error)) return reply.code(409).send({ error: "A staff record with this email already exists." });
      throw error;
    }
  });

  app.put("/staff/:id", { preHandler: requireAdminSession }, async (request, reply) => {
    const id = parsePositiveId((request.params as { id: string }).id);
    const parsed = staffInput.safeParse(request.body);
    if (!id || !parsed.success) {
      return reply.code(400).send({ error: "Invalid staff ID or directory record.", details: parsed.success ? undefined : parsed.error.flatten() });
    }
    const value = parsed.data;
    try {
      const [row] = await db.update(staffMembers).set({
        ...value,
        email: value.email.toLowerCase(),
        initials: value.initials ?? getInitials(value.name),
        updatedAt: new Date(),
      }).where(eq(staffMembers.id, id)).returning();
      if (!row) return reply.code(404).send({ error: "Staff record not found." });
      return { staffMember: row };
    } catch (error) {
      if (isUniqueViolation(error)) return reply.code(409).send({ error: "A staff record with this email already exists." });
      throw error;
    }
  });

  app.delete("/staff/:id", { preHandler: requireAdminSession }, async (request, reply) => {
    const id = parsePositiveId((request.params as { id: string }).id);
    if (!id) return reply.code(400).send({ error: "Invalid staff ID." });
    const [row] = await db.delete(staffMembers).where(eq(staffMembers.id, id)).returning({ id: staffMembers.id });
    if (!row) return reply.code(404).send({ error: "Staff record not found." });
    return reply.code(204).send();
  });
}
