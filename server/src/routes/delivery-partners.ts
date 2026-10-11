import { asc, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db } from "../db/client.js";
import { deliveryPartners, orders } from "../db/schema.js";
import { requireAdminSession } from "../plugins/admin-auth.js";
import { getInitials, isUniqueViolation, partnerStatuses, parsePositiveId } from "./admin-domain-shared.js";

const partnerInput = z.object({
  name: z.string().trim().min(1).max(160),
  phone: z.string().trim().min(1).max(40),
  initials: z.string().trim().min(1).max(8).optional(),
  zone: z.string().trim().min(1).max(120),
  vehicle: z.string().trim().min(1).max(80),
  status: z.enum(partnerStatuses).default("Pending review"),
  deliveries: z.number().int().nonnegative().default(0),
  rating: z.number().finite().min(0).max(5).nullable().default(null),
  joined: z.string().trim().min(1).max(80).default("Today"),
});

function toPartner(row: typeof deliveryPartners.$inferSelect) {
  return { ...row, rating: row.rating === null ? null : Number(row.rating) };
}

export async function deliveryPartnerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/delivery-partners", { preHandler: requireAdminSession }, async (_request, reply) => {
    reply.header("Cache-Control", "no-store, max-age=0");
    const rows = await db.select().from(deliveryPartners).orderBy(asc(deliveryPartners.id));
    return { partners: rows.map(toPartner) };
  });

  app.post("/delivery-partners", { preHandler: requireAdminSession }, async (request, reply) => {
    const parsed = partnerInput.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ error: "Invalid delivery partner data.", details: parsed.error.flatten() });
    const [row] = await db.insert(deliveryPartners).values({
      ...parsed.data,
      initials: parsed.data.initials ?? getInitials(parsed.data.name),
      rating: parsed.data.rating === null ? null : parsed.data.rating.toFixed(2),
    }).returning();
    if (!row) throw new Error("The delivery partner insert did not return a database row.");
    return reply.code(201).send({ partner: toPartner(row) });
  });

  app.put("/delivery-partners/:id", { preHandler: requireAdminSession }, async (request, reply) => {
    const id = parsePositiveId((request.params as { id: string }).id);
    const parsed = partnerInput.safeParse(request.body);
    if (!id || !parsed.success) {
      return reply.code(400).send({ error: "Invalid delivery partner ID or data.", details: parsed.success ? undefined : parsed.error.flatten() });
    }
    const [row] = await db.update(deliveryPartners).set({
      ...parsed.data,
      initials: parsed.data.initials ?? getInitials(parsed.data.name),
      rating: parsed.data.rating === null ? null : parsed.data.rating.toFixed(2),
      updatedAt: new Date(),
    }).where(eq(deliveryPartners.id, id)).returning();
    if (!row) return reply.code(404).send({ error: "Delivery partner not found." });
    return { partner: toPartner(row) };
  });

  app.patch("/delivery-partners/:id/status", { preHandler: requireAdminSession }, async (request, reply) => {
    const id = parsePositiveId((request.params as { id: string }).id);
    const parsed = z.object({ status: z.enum(partnerStatuses) }).safeParse(request.body);
    if (!id || !parsed.success) {
      return reply.code(400).send({ error: "Invalid delivery partner status update.", details: parsed.success ? undefined : parsed.error.flatten() });
    }
    const [row] = await db.update(deliveryPartners).set({
      status: parsed.data.status,
      updatedAt: new Date(),
    }).where(eq(deliveryPartners.id, id)).returning();
    if (!row) return reply.code(404).send({ error: "Delivery partner not found." });
    return { partner: toPartner(row) };
  });

  app.delete("/delivery-partners/:id", { preHandler: requireAdminSession }, async (request, reply) => {
    const id = parsePositiveId((request.params as { id: string }).id);
    if (!id) return reply.code(400).send({ error: "Invalid delivery partner ID." });
    const [partner] = await db.select().from(deliveryPartners).where(eq(deliveryPartners.id, id)).limit(1);
    if (!partner) return reply.code(404).send({ error: "Delivery partner not found." });
    await db.transaction(async (transaction) => {
      await transaction.update(orders)
        .set({ deliveryPartner: partner.name })
        .where(eq(orders.deliveryPartnerId, id));
      await transaction.delete(deliveryPartners).where(eq(deliveryPartners.id, id));
    });
    return reply.code(204).send();
  });
}
